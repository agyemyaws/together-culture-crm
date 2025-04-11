from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Discussion, Reply, Message
from authentication.models import Profile
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

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
    likes_count = serializers.IntegerField(read_only=True)
    liked_by_me = serializers.SerializerMethodField()

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

class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Profile
        fields = ('id', 'user_id', 'email', 'username', 'full_name', 'bio',
                  'phone_number', 'location')
        read_only_fields = ('id', 'user_id', 'email', 'username') 