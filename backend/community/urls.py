from django.urls import path
from authentication.views import (
    CreateDiscussionView,
    CreateReplyView,
    DiscussionDetailView,
    DiscussionsListView,
    LikeReplyView,
    DislikeReplyView,
    SendMessageView,
    GetMessagesView,
    LikeMessageView,
    ForwardMessageView
)

urlpatterns = [
    # Discussion routes
    path('discussions/', DiscussionsListView.as_view(), name='discussions-list'),
    path('discussions/create/', CreateDiscussionView.as_view(), name='create-discussion'),
    path('discussions/<int:id>/', DiscussionDetailView.as_view(), name='discussion-detail'),
    path('discussions/<int:discussion_id>/reply/', CreateReplyView.as_view(), name='create-reply'),
    path('replies/<int:reply_id>/like/', LikeReplyView.as_view(), name='like-reply'),
    path('replies/<int:reply_id>/dislike/', DislikeReplyView.as_view(), name='dislike-reply'),
    
    # Message routes
    path('messages/', GetMessagesView.as_view(), name='get-messages'),
    path('messages/send/', SendMessageView.as_view(), name='send-message'),
    path('messages/<int:message_id>/like/', LikeMessageView.as_view(), name='like-message'),
    path('messages/<int:message_id>/forward/', ForwardMessageView.as_view(), name='forward-message'),
    
    # Community members
    path('members/', GetMessagesView.as_view(), name='community-members'),
] 