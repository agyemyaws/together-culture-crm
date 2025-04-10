from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BenefitDashboardView, BenefitAdminView, UserBenefitUsageView

# Create a router for viewsets
router = DefaultRouter()
# Register the dashboard viewset
router.register(r'dashboard', BenefitDashboardView, basename='benefits-dashboard')
# Register the admin viewset
router.register(r'admin', BenefitAdminView, basename='benefits-admin')
# Register the user benefit usage viewset
router.register(r'usage', UserBenefitUsageView, basename='benefits-usage')

urlpatterns = [
    # Include the router URLs - this will make dashboard endpoints available
    # at /api/benefits/dashboard/
    path('', include(router.urls)),
]