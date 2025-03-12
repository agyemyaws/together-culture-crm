from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from .models import Profile, Membership
from .serializers import (
    UserSignupSerializer,
    ProfileCreateSerializer,
    ProfileSerializer,
    MembershipSerializer,
    MembershipRequestSerializer
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
            profile = Profile.objects.get(user=request.user)
            # Check if profile is complete (has full_name)
            if profile.full_name:  # You can add more conditions here
                return Response(
                    {"detail": "Profile already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # If profile exists but is incomplete, update it
                serializer = self.get_serializer(profile, data=request.data)
                serializer.is_valid(raise_exception=True)
                profile = serializer.save()
        except Profile.DoesNotExist:
            # Create new profile if doesn't exist
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            profile = serializer.save()

        # Get current interests
        current_interests = [
            interest.interest_type
            for interest in profile.interests.filter(end_date__isnull=True)
        ]

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

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        try:
            return Profile.objects.get(user=self.request.user)
        except Profile.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def retrieve(self, request, *args, **kwargs):
        try:
            profile = self.get_object()
            if isinstance(profile, Response):  # If no profile exists
                return profile
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
        context['profile'] = self.request.user.profile()
        return context


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
        return Membership.objects.filter(profile=self.request.user.profile())


class AdminUserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = (IsAdminUser,)
    queryset = Profile.objects.all()


class PendingMembershipRequestsView(generics.ListAPIView):
    serializer_class = MembershipSerializer
    permission_classes = (IsAdminUser,)

    def get_queryset(self):
        return Membership.objects.filter(is_approved=False, end_date__isnull=True)