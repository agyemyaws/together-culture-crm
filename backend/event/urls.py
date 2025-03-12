# File: backend/event/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EventViewSet, AttendanceViewSet, 
    MemberJourneyAPIView, MemberActivityAPIView,
    DigitalContentViewSet, ContentProgressViewSet,
    BenefitViewSet, BenefitUsageViewSet
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'attendances', AttendanceViewSet)
router.register(r'content', DigitalContentViewSet, basename='digital-content')
router.register(r'content-progress', ContentProgressViewSet, basename='content-progress')
router.register(r'benefits', BenefitViewSet, basename='benefits')
router.register(r'benefit-usage', BenefitUsageViewSet, basename='benefit-usage')

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    
    # Analytics endpoints
    path('analytics/member-journey/', MemberJourneyAPIView.as_view(), name='member-journey-analytics'),
    path('analytics/member-activity/<int:user_id>/', MemberActivityAPIView.as_view(), name='member-activity'),
    path('analytics/my-activity/', MemberActivityAPIView.as_view(), name='my-activity'),
    
    # Shortcut URLs for common queries
    path('events/upcoming/', EventViewSet.as_view({'get': 'upcoming'}), name='upcoming-events'),
    path('events/past/', EventViewSet.as_view({'get': 'past'}), name='past-events'),
    path('events/<int:pk>/attendees/', EventViewSet.as_view({'get': 'attendees'}), name='event-attendees'),
    path('events/statistics/', EventViewSet.as_view({'get': 'statistics'}), name='event-statistics'),
    
    # Check-in related endpoints
    path('attendances/<int:pk>/check-in/', AttendanceViewSet.as_view({'patch': 'check_in'}), name='check-in'),
    path('attendances/bulk-check-in/', AttendanceViewSet.as_view({'post': 'bulk_check_in'}), name='bulk-check-in'),
    
    # Member-specific endpoints
    path('my/events/', AttendanceViewSet.as_view({'get': 'my_events'}), name='my-events'),
    path('my/content/', ContentProgressViewSet.as_view({'get': 'my_progress'}), name='my-content-progress'),
    path('my/benefits/', BenefitUsageViewSet.as_view({'get': 'my_benefits'}), name='my-benefits'),
]