from rest_framework import serializers
from django.utils import timezone
from django.db.models import Q
from .models import DigitalContent, ContentProgress
from authentication.models import User

class UserBriefSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    membership_type = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'full_name', 'membership_type')
    
    def get_full_name(self, obj):
        """Get user's full name from profile if available"""
        try:
            profile = obj.profile
            if profile and profile.full_name:
                return profile.full_name
        except:
            pass
        return ""
    
    def get_membership_type(self, obj):
        """Get user's current membership type"""
        try:
            profile = obj.profile
            if profile and profile.current_membership:
                return profile.current_membership.membership_type
            return None
        except:
            return None

class DigitalContentSerializer(serializers.ModelSerializer):
    created_by = UserBriefSerializer(read_only=True)
    is_accessible = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = DigitalContent
        fields = ('id', 'title', 'description', 'content_type', 'category', 'access_level',
                 'author', 'duration', 'image_url', 'featured', 'rating', 'downloads', 'views',
                 'url', 'file', 'created_at', 'updated_at', 'is_active', 'created_by', 
                 'is_accessible', 'progress')
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'downloads', 'views')
    
    def get_is_accessible(self, obj):
        """Check if content is accessible to the current user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
            
        user = request.user
        profile = user.profile
        
        if not profile:
            return False
            
        return obj.is_accessible_by(profile)
    
    def get_progress(self, obj):
        """Get the current user's progress for this content"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
            
        user = request.user
        try:
            progress = ContentProgress.objects.get(user=user, content=obj)
            return {
                'progress_percentage': progress.progress_percentage,
                'completed': progress.completed,
                'last_accessed': progress.last_accessed
            }
        except ContentProgress.DoesNotExist:
            return {
                'progress_percentage': 0,
                'completed': False,
                'last_accessed': None
            }

class ContentProgressSerializer(serializers.ModelSerializer):
    content = DigitalContentSerializer(read_only=True)
    content_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ContentProgress
        fields = ('id', 'content', 'content_id', 'progress_percentage', 'completed', 'last_accessed')
        read_only_fields = ('id', 'last_accessed')
    
    def create(self, validated_data):
        user = self.context['request'].user
        content_id = validated_data.pop('content_id')
        content = DigitalContent.objects.get(id=content_id)
        
        # Check if content is accessible
        profile = user.profile
        if not profile or not content.is_accessible_by(profile):
            raise serializers.ValidationError("You do not have access to this content.")
        
        # Create or update progress
        progress, created = ContentProgress.objects.update_or_create(
            user=user,
            content=content,
            defaults={
                'progress_percentage': validated_data.get('progress_percentage', 0),
                'completed': validated_data.get('completed', False),
                'last_accessed': timezone.now()
            }
        )
        
        return progress