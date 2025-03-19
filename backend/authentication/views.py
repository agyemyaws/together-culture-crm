from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from .models import Profile, Membership, User
from .serializers import (
    UserSignupSerializer,
    ProfileCreateSerializer,
    ProfileSerializer,
    MembershipSerializer,
    MembershipRequestSerializer,
    PendingMembershipSerializer
)
from django.db import IntegrityError
import logging

logger = logging.getLogger(__name__)

class RegisterView(generics.CreateAPIView):
    serializer_class = UserSignupSerializer
    permission_classes = (AllowAny,)

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()

            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username
                }
            }, status=status.HTTP_201_CREATED)
        except IntegrityError as e:
            logger.error(f"Registration error: {str(e)}")
            return Response(
                {"detail": "Registration failed. Please try a different username."},
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
            # Log the raw request data
            logger.debug(f"Raw profile creation data: {request.data}")
            
            # Process interests data separately to ensure proper format
            interests_data = []
            if 'interests' in request.data:
                interests = request.data.get('interests')
                logger.debug(f"Original interests data type: {type(interests)}, value: {interests}")
                
                # Handle different formats of interests data
                if isinstance(interests, list):
                    interests_data = interests
                elif isinstance(interests, str):
                    if ',' in interests:  # Comma-separated string
                        interests_data = [i.strip() for i in interests.split(',') if i.strip()]
                    else:  # Single string value
                        interests_data = [interests]
                
                # Make request data mutable
                if hasattr(request.data, '_mutable'):
                    request.data._mutable = True
                
                # Set the properly formatted interests data
                request.data['interests'] = interests_data
                
                # Make request data immutable again
                if hasattr(request.data, '_mutable'):
                    request.data._mutable = False
                
                logger.debug(f"Processed interests data: {interests_data}")
            
            # Get or create profile for the user
            profile, created = Profile.objects.get_or_create(user=request.user)
            logger.debug(f"Profile found or created: ID={profile.id}, created={created}")
            
            # Create serializer with the updated data
            serializer = self.get_serializer(profile, data=request.data)
            
            # Log validation errors if any
            if not serializer.is_valid():
                logger.error(f"Validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Save the profile with updated data
            logger.debug("Validated data before save: %s", serializer.validated_data)
            profile = serializer.save()
            logger.debug("Profile saved successfully")

            # Get current interests
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
            logger.error(f"Error creating profile: {str(e)}", exc_info=True)
            return Response(
                {"detail": f"Error creating profile: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        try:
            return Profile.objects.get(user=self.request.user)
        except Profile.DoesNotExist:
            # Create a basic profile for the user instead of returning 404
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
        
        # Use the instance to create the response
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
        # Use select_related to fetch profile and user data in a single query
        return Membership.objects.filter(
            is_approved=False, 
            end_date__isnull=True
        ).select_related('profile__user')


class AllMembersView(generics.ListAPIView):
    serializer_class = ProfileSerializer
    permission_classes = (IsAdminUser,)
    
    def get_queryset(self):
        # Get all profiles
        return Profile.objects.all().select_related('user')


class MembershipCancelView(generics.DestroyAPIView):
    serializer_class = MembershipSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_queryset(self):
        # Only allow cancellation of the user's own pending membership requests
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