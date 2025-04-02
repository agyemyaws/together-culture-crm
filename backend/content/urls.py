from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DigitalContentViewSet, ContentProgressViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'content', DigitalContentViewSet, basename='digital-content')
router.register(r'progress', ContentProgressViewSet, basename='content-progress')

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    
    # Shortcut URLs for common queries
    path('my-content/', DigitalContentViewSet.as_view({'get': 'my_content'}), name='my-content'),
    path('featured-content/', DigitalContentViewSet.as_view({'get': 'featured'}), name='featured-content'),
    
    # Progress-related URLs
    path('my-progress/', ContentProgressViewSet.as_view({'get': 'my_progress'}), name='my-progress'),
    path('in-progress/', ContentProgressViewSet.as_view({'get': 'in_progress'}), name='in-progress'),
    path('completed/', ContentProgressViewSet.as_view({'get': 'completed'}), name='completed'),
    
    # Content interaction URLs
    path('content/<int:pk>/view/', DigitalContentViewSet.as_view({'post': 'view'}), name='view-content'),
    path('content/<int:pk>/download/', DigitalContentViewSet.as_view({'post': 'download'}), name='download-content'),
]