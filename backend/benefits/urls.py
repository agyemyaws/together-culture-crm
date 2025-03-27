from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BenefitDashboardView

# Create a router for viewsets
router = DefaultRouter()
# Register the dashboard viewset
router.register(r'dashboard', BenefitDashboardView, basename='benefits-dashboard')

urlpatterns = [
    # Include the router URLs - this will make dashboard endpoints available
    # at /api/benefits/dashboard/
    path('', include(router.urls)),
]