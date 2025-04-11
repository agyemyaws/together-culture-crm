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
    PendingMembershipRequestsView,
    CreateProfileView,
    AllMembersView,
    MembershipCancelView,
    EngagementAnalyticsView,  
    FunnelAnalyticsView,     
    InterestCategorizationView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

urlpatterns = [
    # Authentication endpoints - handle login, registration, and token refresh
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # JWT login endpoint
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Refresh expired JWT tokens
    path('register/', RegisterView.as_view(), name='register'),  # Create new user account

    # Profile endpoints - user profile management
    path('profile/create/', CreateProfileView.as_view(), name='create-profile'),  # Initialize user profile
    path('profile/', ProfileView.as_view(), name='profile'),  # Get or update user profile

    # Membership endpoints - manage user membership status
    path('membership/request/', MembershipRequestView.as_view(), name='request-membership'),  # Request membership upgrade
    path('membership/history/', MembershipHistoryView.as_view(), name='membership-history'),  # View membership history
    path('membership/<int:pk>/approve/', MembershipApprovalView.as_view(), name='approve-membership'),  # Admin approval
    path('membership/<int:pk>/cancel/', MembershipCancelView.as_view(), name='cancel-membership'),  # Cancel membership
    path('membership/pending/', PendingMembershipRequestsView.as_view(), name='pending-memberships'),  # View pending requests
    
    # Admin endpoints - system management for administrators 
    path('members/', AllMembersView.as_view(), name='all-members'),  # List all members
    
    # Analytics endpoints - data insights for administrators
    path('analytics/engagement/', EngagementAnalyticsView.as_view(), name='engagement-analytics'),  # User engagement metrics
    path('analytics/funnel/', FunnelAnalyticsView.as_view(), name='funnel-analytics'),  # User conversion funnel
    path('analytics/interests/', InterestCategorizationView.as_view(), name='interest-categorization'),  # Interest distribution

    # Password reset endpoints - handle forgotten passwords
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),  # Send reset email
    path('password-reset/<str:uidb64>/<str:token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),  # Reset with token
]