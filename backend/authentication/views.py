from rest_framework import generics, status, views
from rest_framework.views import APIView  
from django.db import models
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from .models import Profile, Membership, User, ActivityLog
from .serializers import (
    UserSignupSerializer,
    ProfileCreateSerializer,
    ProfileSerializer,
    MembershipSerializer,
    MembershipRequestSerializer,
    PendingMembershipSerializer,
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

# User registration view for creating new accounts
class RegisterView(generics.CreateAPIView):
    serializer_class = UserSignupSerializer
    permission_classes = (AllowAny,)

    # Create a new user account with validation and error handling
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

# View for creating user profile after registration
class CreateProfileView(generics.CreateAPIView):
    serializer_class = ProfileCreateSerializer
    permission_classes = (IsAuthenticated,)

    # Create or update profile with detailed validation and error handling
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
            
            # Format interests data properly regardless of input format
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
            
            # Get or create profile for the user
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

# View for retrieving and updating user profile
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = (IsAuthenticated,)

    # Get user profile, creating one if it doesn't exist
    def get_object(self):
        try:
            return Profile.objects.get(user=self.request.user)
        except Profile.DoesNotExist:
            new_profile = Profile.objects.create(user=self.request.user)
            return new_profile

    # Get user profile with error handling
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
    
    # Update user profile with validation of required fields
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
            
            # Normalize interests data format
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

class PasswordResetRequestView(views.APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({
                    "message": "If an account with this email exists, a password reset link has been sent."
                }, status=status.HTTP_200_OK)
            
            # Generate token and UID
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Create reset URL using frontend URL
            frontend_url = request.data.get('frontend_url', 'http://localhost:5173')
            reset_url = f"{frontend_url}/password-reset/{uid}/{token}"
            
            # Send email
            subject = "Reset your password"
            message = password_reset_email_template(user.first_name or 'User', reset_url)
            try:
                send_email(recipient=email, subject=subject, message=message)
            except Exception as e:
                logger.error(f"Error sending password reset email: {str(e)}")
                return Response({"error": "Error sending password reset email"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                "message": "If an account with this email exists, a password reset link has been sent."
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(views.APIView):
    def post(self, request, uidb64, token):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Decode the UID
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
                
                # Check if token is valid
                if not default_token_generator.check_token(user, token):
                    return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
                
                # Set the new password
                user.set_password(serializer.validated_data['password'])
                user.save()
                
                # Send confirmation email
                subject = "Your password has been reset"
                message = password_changed_email_template(user.first_name or 'User')
                
                try:
                    send_email(recipient=user.email, subject=subject, message=message)
                except Exception as e:
                    logger.error(f"Error sending password changed email: {str(e)}")
                
                return Response({"message": "Password has been reset successfully"}, status=status.HTTP_200_OK)
                
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response({"error": "Invalid reset link"}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
