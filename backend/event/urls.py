from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EventViewSet, AttendanceViewSet,
    MemberJourneyAPIView, MemberActivityAPIView,
    EventFeedbackViewSet, PublicEventRegistrationView
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'attendances', AttendanceViewSet, basename='attendance')
router.register(r'feedback', EventFeedbackViewSet, basename='event-feedback')

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),

    # Analytics endpoints
    path('analytics/member-journey/', MemberJourneyAPIView.as_view(), name='member-journey-analytics'),
    path('analytics/member-activity/<int:user_id>/', MemberActivityAPIView.as_view(), name='member-activity'),
    path('analytics/my-activity/', MemberActivityAPIView.as_view(), name='my-activity'),

    # Event-specific endpoints
    path('events/<int:pk>/attendees/', EventViewSet.as_view({'get': 'attendees'}), name='event-attendees'),
    path('events/statistics/', EventViewSet.as_view({'get': 'statistics'}), name='event-statistics'),
    
    # Public registration endpoints - use both routes for compatibility 
    # Make the new view the primary one that should work
    path('public-registration/', PublicEventRegistrationView.as_view(), name='public-event-registration-standalone'),
    
    # Legacy endpoints that we're keeping for backward compatibility
    path('public-register/', EventViewSet.as_view({'post': 'public_register'}), name='public-event-registration'),
    path('events/public-register/', EventViewSet.as_view({'post': 'public_register'}), name='public-event-registration-alt'),

    # Attendance-specific endpoints
    path('register/<int:event_id>/', AttendanceViewSet.as_view({'post': 'create'}), name='register-for-event'),
    path('register-by-email/', AttendanceViewSet.as_view({'post': 'register_by_email'}), name='register-by-email'),
    path('attendances/check-in/<int:pk>/', AttendanceViewSet.as_view({'patch': 'check_in'}), name='check-in'),
    path('attendances/bulk-check-in/', AttendanceViewSet.as_view({'post': 'bulk_check_in'}), name='bulk-check-in'),
    path('attendances/my-tickets/', AttendanceViewSet.as_view({'get': 'my_tickets'}), name='my-tickets'),
    path('attendances/my-events/', AttendanceViewSet.as_view({'get': 'my_events'}), name='my-events'),
]