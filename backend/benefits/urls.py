from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BenefitViewSet, BenefitUsageViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'benefits', BenefitViewSet, basename='benefits')
router.register(r'benefits/usage', BenefitUsageViewSet, basename='benefit-usage')

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]