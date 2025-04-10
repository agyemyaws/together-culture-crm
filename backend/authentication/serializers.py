from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Profile, Membership, Interest
from community.models import Discussion, Reply, Message
from django.utils import timezone
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

# Existing serializers (unchanged)
class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
        }

    def validate_username(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        if not all(c.isalnum() or c == '_' for c in value):
            raise serializers.ValidationError("Username can only contain letters, numbers, and underscores.")
        if not self.instance and User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value
        
    def validate_email(self, value):
        if not self.instance and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_password(self, value):
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
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
            'phone_number': {'required': True, 'allow_blank': False},
            'location': {'required': True, 'allow_blank': False},
            'bio': {'required': False, 'allow_blank': True},
        }

    def validate_full_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Full name cannot be empty")
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Full name must be at least 3 characters long")
        return value.strip()
        
    def validate_phone_number(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Phone number is required")
        phone = ''.join(c for c in value if c.isdigit() or c == '+')
        if phone and len(phone) < 10:
            raise serializers.ValidationError("Phone number must have at least 10 digits")
        import re
        if phone and not re.match(r'^[+]?\d{10,15}$', phone):
            raise serializers.ValidationError("Please enter a valid phone number")
        return phone
        
    def validate_location(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Location is required")
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Location must be at least 3 characters long")
        return value.strip()
        
    def validate_bio(self, value):
        if not value:
            return value
        if len(value.strip()) > 500:
            raise serializers.ValidationError("Bio must be less than 500 characters")
        return value.strip()

    def validate_interests(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError("At least one interest must be selected")
        if isinstance(value, str):
            value = [value]
        if not isinstance(value, list):
            raise serializers.ValidationError("Interests must be a list of values")
        valid_interests = [choice[0] for choice in Interest.INTEREST_CHOICES]
        for interest in value:
            if interest not in valid_interests:
                raise serializers.ValidationError(f"'{interest}' is not a valid interest")
        return value

    def create(self, validated_data):
        interests_data = validated_data.pop('interests', [])
        user = self.context['request'].user
        profile = Profile.objects.create(user=user, **validated_data)
        for interest_type in interests_data:
            Interest.objects.create(
                profile=profile,
                interest_type=interest_type,
                start_date=timezone.now()
            )
        Membership.objects.create(
            profile=profile,
            membership_type='community',
            is_approved=True
        )
        return profile
        
    def update(self, instance, validated_data):
        interests_data = validated_data.pop('interests', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if interests_data:
            current_interests = instance.interests.filter(end_date__isnull=True)
            for interest in current_interests:
                interest.end_date = timezone.now()
                interest.save()
            for interest_type in interests_data:
                Interest.objects.create(
                    profile=instance,
                    interest_type=interest_type,
                    start_date=timezone.now()
                )
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
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
    profile_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Membership
        fields = ('id', 'membership_type', 'start_date', 'end_date', 'is_approved',
                  'approved_date', 'profile_details')
        read_only_fields = ('start_date', 'end_date', 'is_approved', 'approved_date')
    
    def get_profile_details(self, obj):
        if not obj.profile:
            return None
        try:
            profile = obj.profile
            user = profile.user
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
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    interests = serializers.ListField(
        child=serializers.ChoiceField(choices=Interest.INTEREST_CHOICES),
        write_only=True,
        required=False
    )
    
    interests_update = serializers.DictField(
        child=serializers.ListField(
            child=serializers.ChoiceField(choices=Interest.INTEREST_CHOICES)
        ),
        write_only=True,
        required=False
    )

    class Meta:
        model = Profile
        fields = ('user_id','email', 'username', 'full_name', 'bio',
                  'phone_number', 'location', 'current_membership',
                  'pending_membership_request', 'membership_history',
                  'current_interests', 'interests', 'interests_update',
                  'is_staff', 'is_superuser')
        extra_kwargs = {
            'full_name': {'required': False, 'allow_blank': False},
            'phone_number': {'required': True, 'allow_blank': False},
            'location': {'required': True, 'allow_blank': False},
            'bio': {'required': False, 'allow_blank': True},
        }

    def validate_full_name(self, value):
        create_serializer = ProfileCreateSerializer()
        return create_serializer.validate_full_name(value)
    
    def validate_phone_number(self, value):
        create_serializer = ProfileCreateSerializer()
        return create_serializer.validate_phone_number(value)
    
    def validate_location(self, value):
        create_serializer = ProfileCreateSerializer()
        return create_serializer.validate_location(value)
    
    def validate_bio(self, value):
        create_serializer = ProfileCreateSerializer()
        return create_serializer.validate_bio(value)
    
    def validate_interests(self, value):
        create_serializer = ProfileCreateSerializer()
        return create_serializer.validate_interests(value)

    def update(self, instance, validated_data):
        interests_update = validated_data.pop('interests_update', None)
        interests_data = validated_data.pop('interests', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if interests_update:
            removed_interests = interests_update.get('removed', [])
            added_interests = interests_update.get('added', [])
            for interest_type in removed_interests:
                interests_to_end = instance.interests.filter(
                    interest_type=interest_type, 
                    end_date__isnull=True
                )
                for interest in interests_to_end:
                    interest.end_date = timezone.now()
                    interest.save()
            for interest_type in added_interests:
                Interest.objects.create(
                    profile=instance,
                    interest_type=interest_type
                )
        elif interests_data:
            current_interests = instance.interests.filter(end_date__isnull=True)
            for interest in current_interests:
                interest.end_date = timezone.now()
                interest.save()
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

class ReplySerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='author.username', read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    dislikes_count = serializers.IntegerField(read_only=True)
    liked_by_me = serializers.SerializerMethodField()
    disliked_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Reply
        fields = ('id', 'content', 'author', 'created_at', 'likes_count', 'dislikes_count', 'liked_by_me', 'disliked_by_me')
        read_only_fields = ('id', 'author', 'created_at', 'likes_count', 'dislikes_count', 'liked_by_me', 'disliked_by_me')

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Content cannot be empty.")
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Content must be at least 5 characters long.")
        return value.strip()

    def get_liked_by_me(self, obj):
        user = self.context['request'].user if 'request' in self.context else None
        return user and user.is_authenticated and obj.liked_by.filter(id=user.id).exists()

    def get_disliked_by_me(self, obj):
        user = self.context['request'].user if 'request' in self.context else None
        return user and user.is_authenticated and obj.disliked_by.filter(id=user.id).exists()

class DiscussionSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='author.username', read_only=True)
    replies = ReplySerializer(many=True, read_only=True)

    class Meta:
        model = Discussion
        fields = ('id', 'title', 'author', 'replies_count', 'created_at', 'replies')
        read_only_fields = ('id', 'author', 'replies_count', 'created_at', 'replies')

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters long.")
        return value.strip()

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()
    recipient = serializers.StringRelatedField()
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    recipient_id = serializers.IntegerField(source='recipient.id', read_only=True)
    parent_message = serializers.PrimaryKeyRelatedField(
        queryset=Message.objects.all(),
        required=False,
        allow_null=True
    )
    replies = serializers.SerializerMethodField()
    sent_timestamp = serializers.DateTimeField(source='timestamp', read_only=True)
    received_timestamp = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(read_only=True)  # New field
    liked_by_me = serializers.SerializerMethodField()       # New field

    class Meta:
        model = Message
        fields = ['id', 'sender', 'recipient', 'sender_id', 'recipient_id', 'content',
                  'timestamp', 'sent_timestamp', 'received_timestamp', 'parent_message', 
                  'replies', 'likes_count', 'liked_by_me']

    def get_replies(self, obj):
        replies = obj.replies.all().order_by('timestamp')
        return MessageSerializer(replies, many=True).data

    def get_received_timestamp(self, obj):
        from datetime import timedelta
        return obj.timestamp + timedelta(minutes=1)

    def get_liked_by_me(self, obj):
        user = self.context['request'].user if 'request' in self.context else None
        if user and user.is_authenticated:
            return obj.liked_by.filter(id=user.id).exists()
        return False
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
            })
        return data
