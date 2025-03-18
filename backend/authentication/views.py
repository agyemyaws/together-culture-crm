from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from .models import Profile, Membership
from .serializers import (
    UserSignupSerializer,
    ProfileCreateSerializer,
    ProfileSerializer,
    MembershipSerializer,
    MembershipRequestSerializer
)

class RegisterView(generics.CreateAPIView):
    serializer_class = UserSignupSerializer
    permission_classes = (AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
            },
            'access': access_token,
            'refresh': refresh_token,
        }, status=status.HTTP_201_CREATED)


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
                'membership_type': 'community',
                'verified': profile.verified
            }
        }, status=status.HTTP_201_CREATED)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        profile = self.request.user.profile
        if profile is None:
            raise generics.NotFound("Profile does not exist for this user.")
        return profile


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
class LogoutView(views.APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            # Get refresh token from request
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Blacklist the refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"message": "Successfully logged out"},
                status=status.HTTP_205_RESET_CONTENT
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )        