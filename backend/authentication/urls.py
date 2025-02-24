from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from authentication.views import (
    RegisterView,
    ProfileView,
    MembershipRequestView,
    MembershipApprovalView,
    MembershipHistoryView,
    AdminUserProfileView,
    PendingMembershipRequestsView, CreateProfileView,
)

urlpatterns = [
    # Authentication URLs
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),

    # Profile URLs

    path('profile/create/', CreateProfileView.as_view(), name='create-profile'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/<int:pk>/', AdminUserProfileView.as_view(), name='admin-profile'),

    # Membership URLs
    path('membership/request/', MembershipRequestView.as_view(), name='request-membership'),
    path('membership/history/', MembershipHistoryView.as_view(), name='membership-history'),
    path('membership/<int:pk>/approve/', MembershipApprovalView.as_view(), name='approve-membership'),
    path('membership/pending/', PendingMembershipRequestsView.as_view(), name='pending-memberships'),
]