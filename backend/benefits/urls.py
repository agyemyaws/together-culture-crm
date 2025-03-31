# File: backend/benefits/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BenefitViewSet, BenefitUsageViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'benefits', BenefitViewSet, basename='benefits')
router.register(r'usage', BenefitUsageViewSet, basename='benefit-usage')

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    
    # Shortcut URLs for common queries
    path('my-benefits/', BenefitUsageViewSet.as_view({'get': 'my_benefits'}), name='my-benefits'),
]