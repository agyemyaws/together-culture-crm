from rest_framework import serializers
from .models import Benefit, UserBenefit, BenefitUsageLog

class BenefitSerializer(serializers.ModelSerializer):
    """
    Serializer for Benefit model
    """
    membership_group_display = serializers.CharField(source='get_membership_group_display', read_only=True)
    
    class Meta:
        model = Benefit
        fields = [
            'id', 'name', 'description', 'category', 
            'membership_group', 'membership_group_display',
            'is_active', 'requires_activation'
        ]

class UserBenefitSerializer(serializers.ModelSerializer):
    """
    Serializer for UserBenefit model with nested benefit details
    """
    benefit = BenefitSerializer(read_only=True)

    class Meta:
        model = UserBenefit
        fields = [
            'id', 'benefit', 'is_active', 
            'activated_on', 'expires_on'
        ]

class BenefitUsageLogSerializer(serializers.ModelSerializer):
    """
    Serializer for BenefitUsageLog model
    """
    benefit_name = serializers.CharField(source='benefit.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    logged_by_email = serializers.CharField(source='logged_by.email', read_only=True, allow_null=True)
    
    class Meta:
        model = BenefitUsageLog
        fields = [
            'id', 'user_benefit', 'timestamp', 'notes',
            'benefit_name', 'user_email', 'logged_by_email'
        ]
        read_only_fields = ['timestamp']

class DetailedUserBenefitSerializer(UserBenefitSerializer):
    """
    Extended serializer with usage logs
    """
    usage_logs = BenefitUsageLogSerializer(many=True, read_only=True, source='usage_logs.all')
    usage_count = serializers.SerializerMethodField()
    last_used_at = serializers.SerializerMethodField()
    
    class Meta(UserBenefitSerializer.Meta):
        fields = UserBenefitSerializer.Meta.fields + ['usage_logs', 'usage_count', 'last_used_at']
    
    def get_usage_count(self, obj):
        return obj.usage_logs.count()
    
    def get_last_used_at(self, obj):
        last_log = obj.usage_logs.order_by('-timestamp').first()
        return last_log.timestamp if last_log else None