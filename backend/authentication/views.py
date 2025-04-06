from rest_framework import generics, status, views
from rest_framework.views import APIView  
from django.db import models
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from .models import Profile, Membership, User, ActivityLog
from community.models import Discussion, Message, Reply
from .serializers import (
    UserSignupSerializer,
    ProfileCreateSerializer,
    ProfileSerializer,
    MembershipSerializer,
    MembershipRequestSerializer,
    PendingMembershipSerializer,
    DiscussionSerializer,
    ReplySerializer,
    MessageSerializer, 
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from django.db import IntegrityError, transaction
from django.db.models import Count, F
from django.utils import timezone
import logging
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse
from .utils import send_email, password_reset_email_template, password_changed_email_template

logger = logging.getLogger(__name__)

# Existing views (unchanged)
class RegisterView(generics.CreateAPIView):
    serializer_class = UserSignupSerializer
    permission_classes = (AllowAny,)

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Registration validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
            user = serializer.save()

            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            }, status=status.HTTP_201_CREATED)
        except IntegrityError as e:
            error_msg = str(e)
            logger.error(f"Registration error: {error_msg}")
            
            if 'username' in error_msg.lower():
                return Response(
                    {"username": ["This username is already taken."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif 'email' in error_msg.lower():
                return Response(
                    {"email": ["This email is already registered."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {"detail": "Registration failed due to a database constraint."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            logger.error(f"Unexpected error during registration: {str(e)}")
            return Response(
                {"detail": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CreateProfileView(generics.CreateAPIView):
    serializer_class = ProfileCreateSerializer
    permission_classes = (IsAuthenticated,)

    def create(self, request, *args, **kwargs):
        try:
            logger.debug(f"Raw profile creation data: {request.data}")
            
            required_fields = ['full_name', 'phone_number', 'location', 'interests']
            for field in required_fields:
                if not request.data.get(field):
                    return Response(
                        {field: [f"{field.replace('_', ' ').title()} is required"]},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            interests_data = []
            if 'interests' in request.data:
                interests = request.data.get('interests')
                logger.debug(f"Original interests data type: {type(interests)}, value: {interests}")
                
                if isinstance(interests, list):
                    interests_data = interests
                elif isinstance(interests, str):
                    if ',' in interests:
                        interests_data = [i.strip() for i in interests.split(',') if i.strip()]
                    else:
                        interests_data = [interests]
                
                if hasattr(request.data, '_mutable'):
                    request.data._mutable = True
                
                request.data['interests'] = interests_data
                
                if hasattr(request.data, '_mutable'):
                    request.data._mutable = False
                
                logger.debug(f"Processed interests data: {interests_data}")
            
            profile, created = Profile.objects.get_or_create(user=request.user)
            logger.debug(f"Profile found or created: ID={profile.id}, created={created}")
            
            serializer = self.get_serializer(profile, data=request.data)
            
            if not serializer.is_valid():
                logger.error(f"Validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            logger.debug("Validated data before save: %s", serializer.validated_data)
            profile = serializer.save()
            logger.debug("Profile saved successfully")

            current_interests = [
                interest.interest_type
                for interest in profile.interests.filter(end_date__isnull=True)
            ]
            
            logger.debug(f"Current interests after save: {current_interests}")

            return Response({
                'profile': {
                    'id': profile.id,
                    'full_name': profile.full_name,
                    'phone_number': profile.phone_number,
                    'location': profile.location,
                    'bio': profile.bio,
                    'interests': current_interests,
                    'membership_type': 'community'
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error creating profile: {error_msg}", exc_info=True)
            
            if "full_name" in error_msg.lower():
                return Response(
                    {"full_name": [f"Error with full name: {error_msg}"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif "phone_number" in error_msg.lower():
                return Response(
                    {"phone_number": [f"Error with phone number: {error_msg}"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif "interests" in error_msg.lower():
                return Response(
                    {"interests": [f"Error with interests: {error_msg}"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {"detail": f"Error creating profile: {error_msg}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        try:
            return Profile.objects.get(user=self.request.user)
        except Profile.DoesNotExist:
            new_profile = Profile.objects.create(user=self.request.user)
            return new_profile

    def retrieve(self, request, *args, **kwargs):
        try:
            profile = self.get_object()
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error retrieving profile: {str(e)}")
            return Response(
                {"detail": "Error retrieving profile"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            partial = kwargs.pop('partial', False)
            
            if not partial:
                required_fields = ['phone_number', 'location'] 
                for field in required_fields:
                    if field not in request.data or not request.data.get(field):
                        return Response(
                            {field: [f"{field.replace('_', ' ').title()} is required"]},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            interests_data = request.data.get('interests')
            if interests_data is not None:
                if isinstance(interests_data, str):
                    if ',' in interests_data:
                        interests_data = [i.strip() for i in interests_data.split(',') if i.strip()]
                    else:
                        interests_data = [interests_data]
                
                if hasattr(request.data, '_mutable'):
                    request.data._mutable = True
                    request.data['interests'] = interests_data
                    request.data._mutable = False
                else:
                    mutable_data = request.data.copy()
                    mutable_data['interests'] = interests_data
                    request._request.POST = mutable_data
            
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            if not serializer.is_valid():
                logger.error(f"Profile update validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_update(serializer)
            
            if getattr(instance, '_prefetched_objects_cache', None):
                instance._prefetched_objects_cache = {}
            
            return Response(serializer.data)
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error updating profile: {error_msg}", exc_info=True)
            
            if "full_name" in error_msg.lower():
                return Response(
                    {"full_name": [f"Error with full name: {error_msg}"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif "phone_number" in error_msg.lower():
                return Response(
                    {"phone_number": [f"Error with phone number: {error_msg}"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif "interests" in error_msg.lower():
                return Response(
                    {"interests": [f"Error with interests: {error_msg}"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {"detail": f"Error updating profile: {error_msg}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

class MembershipRequestView(generics.CreateAPIView):
    serializer_class = MembershipRequestSerializer
    permission_classes = (IsAuthenticated,)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['profile'] = self.request.user.profile
        return context
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.perform_create(serializer)
        
        response_serializer = self.get_serializer(instance)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def perform_create(self, serializer):
        return serializer.save()

class MembershipApprovalView(generics.UpdateAPIView):
    permission_classes = (IsAdminUser,)
    serializer_class = MembershipSerializer
    queryset = Membership.objects.all()

    def update(self, request, *args, **kwargs):
        membership = self.get_object()
        membership.is_approved = True
        membership.approved_by = request.user
        membership.save()

        serializer = self.get_serializer(membership)
        return Response(serializer.data)

class MembershipHistoryView(generics.ListAPIView):
    serializer_class = MembershipSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Membership.objects.filter(profile=self.request.user.profile)

class PendingMembershipRequestsView(generics.ListAPIView):
    serializer_class = PendingMembershipSerializer
    permission_classes = (IsAdminUser,)

    def get_queryset(self):
        return Membership.objects.filter(
            is_approved=False, 
            end_date__isnull=True
        ).select_related('profile__user')

class AllMembersView(generics.ListAPIView):
    serializer_class = ProfileSerializer
    permission_classes = (IsAdminUser,)
    
    def get_queryset(self):
        return Profile.objects.all().select_related('user')

class MembershipCancelView(generics.DestroyAPIView):
    serializer_class = MembershipSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_queryset(self):
        return Membership.objects.filter(
            profile=self.request.user.profile,
            is_approved=False,
            end_date__isnull=True
        )
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response({"detail": "Membership request cancelled successfully."}, 
                           status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error cancelling membership request: {str(e)}")
            return Response(
                {"detail": "Error cancelling membership request."},
                status=status.HTTP_400_BAD_REQUEST
            )

class EngagementAnalyticsView(generics.ListAPIView):
    permission_classes = (IsAdminUser,)
    
    def get(self, request, *args, **kwargs):
        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        
        active_users = User.objects.filter(
            last_login__gte=thirty_days_ago
        ).count()
        
        return Response({
            'active_users': active_users,
        })

class FunnelAnalyticsView(generics.ListAPIView):
    permission_classes = (IsAdminUser,)
    
    def get(self, request, *args, **kwargs):
        total_users = User.objects.count()
        
        completed_profiles = Profile.objects.exclude(full_name='').count()
        
        pending_requests = Membership.objects.filter(
            is_approved=False, 
            end_date__isnull=True
        ).count()
        
        membership_counts = Membership.objects.filter(
            is_approved=True, 
            end_date__isnull=True
        ).values('membership_type').annotate(count=Count('id'))
        
        progression_data = []
        profiles = Profile.objects.select_related('user').all() 
        for profile in profiles:
            memberships = profile.memberships.order_by('start_date')
            if memberships.count() > 1:
                transitions = []
                for i in range(len(memberships) - 1):
                    if memberships[i].is_approved and memberships[i + 1].is_approved:
                        transition = f"{memberships[i].membership_type} → {memberships[i + 1].membership_type}"
                        transitions.append(transition)
                if transitions:
                    progression_data.append({
                        'username': profile.user.username,  
                        'profile_id': profile.id,           
                        'transitions': transitions
                    })
        
        return Response({
            'funnel': {
                'total_users': total_users,
                'completed_profiles': completed_profiles,
                'pending_requests': pending_requests,
                'membership_counts': list(membership_counts),
            },
            'progression': progression_data,
        })

class InterestCategorizationView(generics.ListAPIView):
    permission_classes = (IsAdminUser,)
    
    def get(self, request, *args, **kwargs):
        profiles = Profile.objects.all().prefetch_related('interests')
        categorization = []
        
        for profile in profiles:
            interest_counts = {}
            for interest in profile.interests.all():
                interest_type = interest.interest_type
                interest_counts[interest_type] = interest_counts.get(interest_type, 0) + 1
            
            predominant_interest = None
            if interest_counts:
                predominant_interest = max(interest_counts, key=interest_counts.get)
            
            interest_history = [
                {'interest_type': interest.interest_type, 'start_date': interest.start_date, 'end_date': interest.end_date}
                for interest in profile.interests.all()
            ]
            
            categorization.append({
                'profile_id': profile.id,
                'username': profile.user.username,
                'predominant_interest': predominant_interest,
                'interest_history': interest_history,
            })
        
        return Response(categorization)

class CommunityMembersView(generics.ListAPIView):
    serializer_class = ProfileSerializer
    

    def get_queryset(self):
        return Profile.objects.exclude(user=self.request.user).select_related('user')[:3]        

class RecentDiscussionsView(generics.ListAPIView):
    serializer_class = DiscussionSerializer
    

    def get_queryset(self):
        return Discussion.objects.all().select_related('author')[:3]  

class AllCommunityMembersView(generics.ListAPIView):
    serializer_class = ProfileSerializer
   

    def get_queryset(self):
        return Profile.objects.exclude(user=self.request.user).select_related('user')    

class CreateDiscussionView(generics.CreateAPIView):
    serializer_class = DiscussionSerializer
   

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)    

class CreateReplyView(generics.CreateAPIView):
    serializer_class = ReplySerializer
   

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

    def get_queryset(self):
        return Discussion.objects.all().select_related('author').prefetch_related('replies')   

class CommunityMemberDetailView(generics.RetrieveAPIView):
    serializer_class = ProfileSerializer
    lookup_field = 'id'

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

        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GetMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch all messages where the user is either the sender or recipient
        messages = Message.objects.filter(
            models.Q(recipient=request.user) | models.Q(sender=request.user)
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
            serializer = MessageSerializer(messages, many=True)
            response_data.append({
                'other_user_id': conversation['other_user_id'],
                'other_user_username': conversation['other_user_username'],
                'messages': serializer.data
            })

        return Response(response_data, status=status.HTTP_200_OK)

# views.py
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

# views.py
class GetMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        messages = Message.objects.filter(
            models.Q(recipient=request.user) | models.Q(sender=request.user)
        ).order_by('timestamp').select_related('sender', 'recipient', 'parent_message')

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

class DiscussionsListView(generics.ListAPIView):
    serializer_class = DiscussionSerializer

    def get_queryset(self):
        logger.info("Fetching all discussions")
        queryset = Discussion.objects.all().select_related('author').prefetch_related('replies')
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query) |
                models.Q(author__username__icontains=search_query)
            )
        logger.info(f"Found {queryset.count()} discussions")
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
                parent_message=original_message
            )

            serializer = MessageSerializer(forwarded_message, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Message.DoesNotExist:
            return Response(
                {"error": "Message not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )       
class PasswordResetRequestView(views.APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                # Generate password reset token
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                # Create reset link with frontend URL
                frontend_url = request.data.get('frontend_url', 'http://localhost:5173')
                reset_link = f"{frontend_url}/password-reset/{uid}/{token}"
                
                # Send password reset email
                email_content = password_reset_email_template(user.first_name, reset_link)
                send_email(
                    recipient=email,
                    subject="Password Reset Request",
                    message=email_content
                )
                
                return Response({
                    'message': 'Password reset email has been sent.'
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({
                    'message': 'User with this email does not exist.'
                }, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(views.APIView):
    def post(self, request, uidb64, token):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
                
                if default_token_generator.check_token(user, token):
                    user.set_password(serializer.validated_data['password'])
                    user.save()
                    
                    # Send password changed notification
                    email_content = password_changed_email_template(user.first_name)
                    send_email(
                        recipient=user.email,
                        subject="Password Changed Successfully",
                        message=email_content
                    )
                    
                    return Response({
                        'message': 'Password has been reset successfully.'
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'message': 'Invalid or expired token.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response({
                    'message': 'Invalid user or token.'
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
