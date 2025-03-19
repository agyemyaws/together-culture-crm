from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Profile, Membership, Interest
from django.utils import timezone
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2')
        extra_kwargs = {
            'username': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')  # Remove password2 before creating user
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user


class ProfileCreateSerializer(serializers.ModelSerializer):
    interests = serializers.ListField(
        child=serializers.ChoiceField(choices=Interest.INTEREST_CHOICES),
        required=True,
        write_only=True
    )

    class Meta:
        model = Profile
        fields = ('full_name', 'phone_number', 'location', 'bio', 'interests', 'created_at')
        extra_kwargs = {
            'full_name': {'required': True, 'allow_blank': False},
            'bio': {'required': False, 'allow_blank': True},
            'phone_number': {'required': False, 'allow_blank': True},
            'location': {'required': False, 'allow_blank': True},
        }

    def validate_full_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Full name cannot be empty")
        return value

    def validate_interests(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError("At least one interest must be selected")
        
        # Handle case when interests might come as a single string
        if isinstance(value, str):
            value = [value]
        
        # Ensure it's a list
        if not isinstance(value, list):
            raise serializers.ValidationError("Interests must be a list of values")
        
        # Validate each interest is in the available choices
        valid_interests = [choice[0] for choice in Interest.INTEREST_CHOICES]
        for interest in value:
            if interest not in valid_interests:
                raise serializers.ValidationError(f"'{interest}' is not a valid interest")
        
        return value

    def create(self, validated_data):
        # Pop interests data before creating profile
        interests_data = validated_data.pop('interests', [])

        # Create profile
        user = self.context['request'].user
        profile = Profile.objects.create(user=user, **validated_data)

        # Create interests - ensure we're creating actual Interest objects
        for interest_type in interests_data:
            Interest.objects.create(
                profile=profile,
                interest_type=interest_type,
                start_date=timezone.now()
            )

        # Create initial community membership
        Membership.objects.create(
            profile=profile,
            membership_type='community',
            is_approved=True
        )

        return profile
        
    def update(self, instance, validated_data):
        # Extract interests data before updating profile fields
        interests_data = validated_data.pop('interests', None)
        
        # Update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle interests if provided
        if interests_data:
            # End current interests
            current_interests = instance.interests.filter(end_date__isnull=True)
            for interest in current_interests:
                interest.end_date = timezone.now()
                interest.save()
                
            # Create new interests as model instances
            for interest_type in interests_data:
                Interest.objects.create(
                    profile=instance,
                    interest_type=interest_type,
                    start_date=timezone.now()
                )
        
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add current interests to response
        data['interests'] = [
            interest.interest_type
            for interest in instance.interests.filter(end_date__isnull=True)
        ]
        return data

class MembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ('id', 'membership_type', 'start_date', 'end_date', 'is_approved',
                  'approved_date')
        read_only_fields = ('start_date', 'end_date', 'is_approved', 'approved_date')


class PendingMembershipSerializer(serializers.ModelSerializer):
    """Extended serializer for pending membership requests that includes profile information"""
    profile_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Membership
        fields = ('id', 'membership_type', 'start_date', 'end_date', 'is_approved',
                  'approved_date', 'profile_details')
        read_only_fields = ('start_date', 'end_date', 'is_approved', 'approved_date')
    
    def get_profile_details(self, obj):
        if not obj.profile:
            return None
        
        # Get user details from the profile
        try:
            profile = obj.profile
            user = profile.user
            
            # Get active interests
            active_interests = [
                interest.interest_type
                for interest in profile.interests.filter(end_date__isnull=True)
            ]
            
            return {
                'id': profile.id,
                'full_name': profile.full_name,
                'email': user.email,
                'phone_number': profile.phone_number,
                'location': profile.location,
                'bio': profile.bio,
                'interests': active_interests,
                'username': user.username
            }
        except Exception as e:
            # Log error and return minimal data if there's an issue
            logger.error(f"Error getting profile details: {str(e)}")
            return {
                'id': obj.profile.id if obj.profile else None,
                'full_name': 'Error retrieving user details'
            }


class InterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interest
        fields = ('interest_type', 'start_date', 'end_date')
        read_only_fields = ('start_date',)


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    is_staff = serializers.BooleanField(source='user.is_staff', read_only=True)
    is_superuser = serializers.BooleanField(source='user.is_superuser', read_only=True)
    current_membership = MembershipSerializer(read_only=True)
    pending_membership_request = MembershipSerializer(read_only=True)
    membership_history = MembershipSerializer(source='memberships', many=True, read_only=True)
    current_interests = InterestSerializer(source='interests', many=True, read_only=True)

    # For updating interests - traditional approach
    interests = serializers.ListField(
        child=serializers.ChoiceField(choices=Interest.INTEREST_CHOICES),
        write_only=True,
        required=False
    )
    
    # For selective interest updates
    interests_update = serializers.DictField(
        child=serializers.ListField(
            child=serializers.ChoiceField(choices=Interest.INTEREST_CHOICES)
        ),
        write_only=True,
        required=False
    )

    class Meta:
        model = Profile
        fields = ('email', 'username', 'full_name', 'bio',
                  'phone_number', 'location', 'current_membership',
                  'pending_membership_request', 'membership_history',
                  'current_interests', 'interests', 'interests_update',
                  'is_staff', 'is_superuser')

    def update(self, instance, validated_data):
        # Check if we're using the new selective interests update
        interests_update = validated_data.pop('interests_update', None)
        
        # Fall back to traditional interests field if selective update not provided
        interests_data = validated_data.pop('interests', None)

        # Update profile instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle selective interest updates if provided
        if interests_update:
            # Get lists of added, removed, and unchanged interests
            removed_interests = interests_update.get('removed', [])
            added_interests = interests_update.get('added', [])
            # unchanged_interests are just for reference, we don't need to process them
            
            # End removed interests
            for interest_type in removed_interests:
                interests_to_end = instance.interests.filter(
                    interest_type=interest_type, 
                    end_date__isnull=True
                )
                for interest in interests_to_end:
                    interest.end_date = timezone.now()
                    interest.save()
            
            # Add new interests
            for interest_type in added_interests:
                Interest.objects.create(
                    profile=instance,
                    interest_type=interest_type
                )
                
        # Traditional approach - end all current interests and create new ones
        elif interests_data:
            # End current interests
            current_interests = instance.interests.filter(end_date__isnull=True)
            for interest in current_interests:
                interest.end_date = timezone.now()
                interest.save()

            # Create new interests - create actual Interest objects instead of trying to assign strings
            for interest_type in interests_data:
                Interest.objects.create(
                    profile=instance,
                    interest_type=interest_type
                )

        return instance


class MembershipRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ('id', 'membership_type')
        read_only_fields = ('id',)

    def create(self, validated_data):
        profile = self.context['profile']

        # Check if there's already a pending request
        pending_request = profile.pending_membership_request
        if pending_request:
            raise serializers.ValidationError(
                "You already have a pending membership request."
            )

        return Membership.objects.create(
            profile=profile,
            is_approved=False,
            **validated_data
        )