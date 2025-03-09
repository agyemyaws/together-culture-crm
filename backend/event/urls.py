from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, AttendanceViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'attendances', AttendanceViewSet)

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]