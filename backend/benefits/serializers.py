from rest_framework import serializers
from .models import Benefit, UserBenefit

class BenefitSerializer(serializers.ModelSerializer):
    """
    Serializer for Benefit model
    """
    class Meta:
        model = Benefit
        fields = [
            'id', 'name', 'description', 'category', 
            'value', 'icon', 'is_active', 'requires_activation'
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
            'activated_on', 'expires_on', 
            'usage_count', 'last_used_at'
        ]