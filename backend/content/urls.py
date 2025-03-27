# File: backend/content/urls.py

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
    path('my-progress/', ContentProgressViewSet.as_view({'get': 'my_progress'}), name='my-progress'),
]