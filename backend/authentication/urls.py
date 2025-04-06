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
    CommunityMembersView,
    RecentDiscussionsView,
    AllCommunityMembersView,
    CreateDiscussionView,
    DiscussionDetailView,
    CommunityMemberDetailView,
    CreateReplyView,
    DiscussionsListView,  
    SendMessageView,
    GetMessagesView,  
    LikeMessageView,
    LikeReplyView,
    DislikeReplyView,
    ForwardMessageView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    AllMembersView,
    MembershipCancelView,
)

urlpatterns = [
    # Authentication URLs
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),

    # Profile URLs
    path('profile/create/', CreateProfileView.as_view(), name='create-profile'),
    path('profile/', ProfileView.as_view(), name='profile'),

    # Membership URLs
    path('membership/request/', MembershipRequestView.as_view(), name='request-membership'),
    path('membership/history/', MembershipHistoryView.as_view(), name='membership-history'),
    path('membership/<int:pk>/approve/', MembershipApprovalView.as_view(), name='approve-membership'),
    path('membership/<int:pk>/cancel/', MembershipCancelView.as_view(), name='cancel-membership'),
    path('membership/<int:pk>/cancel/', MembershipCancelView.as_view(), name='cancel-membership'),
    path('membership/pending/', PendingMembershipRequestsView.as_view(), name='pending-memberships'),
    
    # Admin URLs
    path('members/', AllMembersView.as_view(), name='all-members'),
    
    # Analytics URLs 
    path('analytics/engagement/', EngagementAnalyticsView.as_view(), name='engagement-analytics'),
    path('analytics/funnel/', FunnelAnalyticsView.as_view(), name='funnel-analytics'),
    path('analytics/interests/', InterestCategorizationView.as_view(), name='interest-categorization'),

    # Community Members and Discussions
    path('community-members/', CommunityMembersView.as_view(), name='community-members'),
    path('recent-discussions/', RecentDiscussionsView.as_view(), name='recent-discussions'),
    path('all-community-members/', AllCommunityMembersView.as_view(), name='all-community-members'), 
    path('create-discussion/', CreateDiscussionView.as_view(), name='create-discussion'), 
    path('community-members/<int:id>/', CommunityMemberDetailView.as_view(), name='community-member-detail'),
    path('discussions/<int:discussion_id>/reply/', CreateReplyView.as_view(), name='create-reply'),  
    path('discussions/<int:id>/', DiscussionDetailView.as_view(), name='discussion-detail'), 
    path('discussions/', DiscussionsListView.as_view(), name='discussions'),  

    # Messages URLs
    path("messages/<int:message_id>/like/", LikeMessageView.as_view(), name="like-message"),
    path("messages/send/", SendMessageView.as_view(), name="send-message"),
    path("messages/", GetMessagesView.as_view(), name="get-messages"),
    path('replies/<int:reply_id>/like/', LikeReplyView.as_view(), name='like-reply'),
    path('replies/<int:reply_id>/dislike/', DislikeReplyView.as_view(), name='dislike-reply'),
    path("messages/<int:message_id>/forward/", ForwardMessageView.as_view(), name="forward-message"),

    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset/<str:uidb64>/<str:token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Admin URLs
    path('members/', AllMembersView.as_view(), name='all-members'),
]