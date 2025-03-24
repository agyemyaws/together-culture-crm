from rest_framework import serializers
from .models import Benefit, BenefitUsage

class BenefitSerializer(serializers.ModelSerializer):
    is_available = serializers.SerializerMethodField()
    has_used = serializers.SerializerMethodField()
    
    class Meta:
        model = Benefit
        fields = [
            'id', 
            'name', 
            'description', 
            'membership_level_required', 
            'is_active', 
            'is_available', 
            'has_used'
        ]
    
    def get_is_available(self, obj):
        """Check if benefit is available to the current user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return obj.is_available_to(profile)
        except:
            return False
    
    def get_has_used(self, obj):
        """Check if the current user has used this benefit"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        return BenefitUsage.objects.filter(
            user=request.user, 
            benefit=obj
        ).exists()

class BenefitUsageSerializer(serializers.ModelSerializer):
    benefit = BenefitSerializer(read_only=True)
    
    class Meta:
        model = BenefitUsage
        fields = [
            'id', 
            'benefit', 
            'used_at', 
            'usage_count', 
            'notes'
        ]