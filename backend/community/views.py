from django.shortcuts import render
from rest_framework import generics, status, views
from rest_framework.views import APIView
from django.db import models, transaction
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.db.models import F, Q
from .models import Discussion, Message, Reply
from django.contrib.auth import get_user_model
from authentication.models import Profile
from .serializers import (
    ProfileSerializer,
    DiscussionSerializer,
    ReplySerializer,
    MessageSerializer
)

User = get_user_model()

class CommunityMembersView(generics.ListAPIView):
    serializer_class = ProfileSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Profile.objects.exclude(user=self.request.user).select_related('user')[:3]        

class RecentDiscussionsView(generics.ListAPIView):
    serializer_class = DiscussionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Discussion.objects.all().select_related('author')[:3]  

class AllCommunityMembersView(generics.ListAPIView):
    serializer_class = ProfileSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Profile.objects.exclude(user=self.request.user).select_related('user')    

class CreateDiscussionView(generics.CreateAPIView):
    serializer_class = DiscussionSerializer
    permission_classes = (IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)    

class CreateReplyView(generics.CreateAPIView):
    serializer_class = ReplySerializer
    permission_classes = (IsAuthenticated,)

    def perform_create(self, serializer):
        discussion_id = self.kwargs['discussion_id']
        try:
            discussion = Discussion.objects.get(id=discussion_id)
        except Discussion.DoesNotExist:
            raise serializers.ValidationError("Discussion does not exist.")

        with transaction.atomic():
            serializer.save(author=self.request.user, discussion=discussion)
            discussion.replies_count = F('replies_count') + 1
            discussion.save()   

class DiscussionDetailView(generics.RetrieveAPIView):
    serializer_class = DiscussionSerializer
    lookup_field = 'id'
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Discussion.objects.all().select_related('author').prefetch_related('replies')   

class CommunityMemberDetailView(generics.RetrieveAPIView):
    serializer_class = ProfileSerializer
    lookup_field = 'id'
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Profile.objects.all().select_related('user').prefetch_related('interests', 'memberships')        

class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        recipient_id = request.data.get("recipient_id")
        content = request.data.get("content")
        parent_message_id = request.data.get("parent_message_id")  

        if not recipient_id or not content:
            return Response(
                {"error": "Recipient ID and message content are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Recipient not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        parent_message = None
        if parent_message_id:
            try:
                parent_message = Message.objects.get(id=parent_message_id)
               
                if parent_message.sender != request.user and parent_message.recipient != request.user:
                    return Response(
                        {"error": "You can only reply to messages in your conversation."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Message.DoesNotExist:
                return Response(
                    {"error": "Parent message not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

        message = Message.objects.create(
            sender=request.user,
            recipient=recipient,
            content=content,
            parent_message=parent_message
        )

        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class GetMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch all messages where the user is either the sender or recipient
        messages = Message.objects.filter(
            Q(recipient=request.user) | Q(sender=request.user)
        ).order_by('timestamp').select_related('sender', 'recipient', 'parent_message')

        # Group messages by conversation (other user)
        grouped_messages = {}
        for message in messages:
            other_user = message.recipient if message.sender == request.user else message.sender
            other_user_id = other_user.id
            other_user_username = other_user.username

            if other_user_id not in grouped_messages:
                grouped_messages[other_user_id] = {
                    'other_user_id': other_user_id,
                    'other_user_username': other_user_username,
                    'messages': []
                }
            grouped_messages[other_user_id]['messages'].append(message)

        # Serialize the grouped messages
        response_data = []
        for other_user_id, conversation in grouped_messages.items():
            messages = conversation['messages']
            serializer = MessageSerializer(messages, many=True, context={'request': request})
            response_data.append({
                'other_user_id': conversation['other_user_id'],
                'other_user_username': conversation['other_user_username'],
                'messages': serializer.data
            })

        return Response(response_data, status=status.HTTP_200_OK)

class LikeMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return Response(
                {"error": "Message not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Toggle like: if already liked, unlike; if not liked, like
        if message.liked_by.filter(id=request.user.id).exists():
            message.liked_by.remove(request.user)
            action = "unliked"
        else:
            message.liked_by.add(request.user)
            action = "liked"

        serializer = MessageSerializer(message, context={'request': request})
        return Response({
            "message": f"Message {action} successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

class DiscussionsListView(generics.ListAPIView):
    serializer_class = DiscussionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = Discussion.objects.all().select_related('author').prefetch_related('replies')
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(author__username__icontains=search_query)
            )
        return queryset

class LikeReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, reply_id):
        try:
            reply = Reply.objects.get(id=reply_id)
        except Reply.DoesNotExist:
            return Response({"error": "Reply not found."}, status=status.HTTP_404_NOT_FOUND)

        # Toggle like
        if reply.liked_by.filter(id=request.user.id).exists():
            reply.liked_by.remove(request.user)
            action = "unliked"
        else:
            reply.liked_by.add(request.user)
            # Remove dislike if it exists to prevent conflicting votes
            if reply.disliked_by.filter(id=request.user.id).exists():
                reply.disliked_by.remove(request.user)
            action = "liked"

        reply.save()
        serializer = ReplySerializer(reply, context={'request': request})
        return Response({
            "message": f"Reply {action} successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

class DislikeReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, reply_id):
        try:
            reply = Reply.objects.get(id=reply_id)
        except Reply.DoesNotExist:
            return Response({"error": "Reply not found."}, status=status.HTTP_404_NOT_FOUND)

        # Toggle dislike
        if reply.disliked_by.filter(id=request.user.id).exists():
            reply.disliked_by.remove(request.user)
            action = "undisliked"
        else:
            reply.disliked_by.add(request.user)
            # Remove like if it exists to prevent conflicting votes
            if reply.liked_by.filter(id=request.user.id).exists():
                reply.liked_by.remove(request.user)
            action = "disliked"

        reply.save()
        serializer = ReplySerializer(reply, context={'request': request})
        return Response({
            "message": f"Reply {action} successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)        

class ForwardMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        try:
            original_message = Message.objects.get(id=message_id)
            if original_message.sender != request.user:
                return Response(
                    {"error": "You can only forward your own messages"},
                    status=status.HTTP_403_FORBIDDEN
                )

            recipient_username = request.data.get("recipient_username")
            if not recipient_username:
                return Response(
                    {"error": "Recipient username is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                recipient = User.objects.get(username=recipient_username)
            except User.DoesNotExist:
                return Response(
                    {"error": "Recipient not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            forwarded_message = Message.objects.create(
                sender=request.user,
                recipient=recipient,
                content=original_message.content,
            )

            serializer = MessageSerializer(forwarded_message, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Message.DoesNotExist:
            return Response(
                {"error": "Original message not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
