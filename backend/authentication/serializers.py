from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Profile, Membership, Interest
from django.utils import timezone

User = get_user_model()


class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    full_name = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2')
        extra_kwargs = {
            'email': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        full_name = validated_data.pop('full_name')
        user = User.objects.create_user(**validated_data)

        # Update profile full name
        profile = Profile.objects.get(user=user)
        profile.full_name = full_name
        profile.save()

        return user


class ProfileCreateSerializer(serializers.ModelSerializer):
    interests = serializers.MultipleChoiceField(
        choices=Interest.INTEREST_CHOICES,
        required=True,
        write_only=True
    )

    class Meta:
        model = Profile
        fields = ('full_name', 'phone_number', 'location', 'bio', 'interests')

    def create(self, validated_data):
        # Pop interests data before creating profile
        interests_data = validated_data.pop('interests')

        # Create profile
        user = self.context['request'].user
        profile = Profile.objects.create(user=user, **validated_data)

        # Create interests
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
            is_approved=True,
            notes='Initial membership on signup'
        )

        return profile

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


class InterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interest
        fields = ('interest_type', 'start_date')
        read_only_fields = ('start_date',)


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    current_membership = MembershipSerializer(read_only=True)
    pending_membership_request = MembershipSerializer(read_only=True)
    membership_history = MembershipSerializer(source='memberships', many=True, read_only=True)
    current_interests = InterestSerializer(source='interests.filter(end_date__isnull=True)',
                                           many=True, read_only=True)

    # For updating interests
    interests = serializers.ListField(
        child=serializers.ChoiceField(choices=Interest.INTEREST_CHOICES),
        write_only=True,
        required=False
    )

    class Meta:
        model = Profile
        fields = ('email', 'username', 'full_name', 'bio', 'verified',
                  'phone_number', 'location', 'current_membership',
                  'pending_membership_request', 'membership_history',
                  'current_interests', 'interests')
        read_only_fields = ('verified',)

    def update(self, instance, validated_data):
        interests_data = validated_data.pop('interests', None)

        # Update profile instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update interests if provided
        if interests_data:
            # End current interests
            current_interests = instance.interests.filter(end_date__isnull=True)
            for interest in current_interests:
                interest.end_date = timezone.now()
                interest.save()

            # Create new interests
            for interest_type in interests_data:
                Interest.objects.create(
                    profile=instance,
                    interest_type=interest_type
                )

        return instance


class MembershipRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ('membership_type',)

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