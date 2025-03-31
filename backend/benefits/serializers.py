# File: backend/benefits/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import Benefit, BenefitUsage
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

class BenefitSerializer(serializers.ModelSerializer):
    is_available = serializers.SerializerMethodField()
    has_used = serializers.SerializerMethodField()
    
    class Meta:
        model = Benefit
        fields = ('id', 'name', 'description', 'membership_level_required',
                 'is_active', 'is_available', 'has_used')
        read_only_fields = ('id', 'is_active')
    
    def get_is_available(self, obj):
        """Check if benefit is available to the current user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
            
        user = request.user
        profile = user.profile
        
        if not profile:
            return False
            
        return obj.is_available_to(profile)
    
    def get_has_used(self, obj):
        """Check if the current user has used this benefit"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
            
        user = request.user
        return BenefitUsage.objects.filter(user=user, benefit=obj).exists()

class BenefitUsageSerializer(serializers.ModelSerializer):
    benefit = BenefitSerializer(read_only=True)
    benefit_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = BenefitUsage
        fields = ('id', 'benefit', 'benefit_id', 'used_at', 'usage_count', 'notes')
        read_only_fields = ('id', 'used_at')
    
    def create(self, validated_data):
        user = self.context['request'].user
        benefit_id = validated_data.pop('benefit_id')
        benefit = Benefit.objects.get(id=benefit_id)
        
        # Check if benefit is available
        profile = user.profile
        if not profile or not benefit.is_available_to(profile):
            raise serializers.ValidationError("This benefit is not available to you.")
        
        # Create or update usage
        usage, created = BenefitUsage.objects.update_or_create(
            user=user,
            benefit=benefit,
            defaults={
                'usage_count': validated_data.get('usage_count', 1),
                'notes': validated_data.get('notes', ''),
                'used_at': timezone.now()
            }
        )
        
        return usage