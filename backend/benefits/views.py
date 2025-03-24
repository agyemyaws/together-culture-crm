from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Benefit, BenefitUsage
from .serializers import BenefitSerializer, BenefitUsageSerializer

class BenefitViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Benefit.objects.all()
    serializer_class = BenefitSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        """Include request in serializer context for is_available method"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        """Filter benefits based on user's membership"""
        user = self.request.user
        
        try:
            profile = user.profile
            membership = profile.current_membership
            
            if not membership:
                return Benefit.objects.none()

            membership_type = membership.membership_type
            
            if membership_type == 'community':
                return Benefit.objects.filter(
                    is_active=True,
                    membership_level_required__in=['all', 'community']
                )
            elif membership_type == 'key_access':
                return Benefit.objects.filter(
                    is_active=True,
                    membership_level_required__in=['all', 'community', 'key_access']
                )
            elif membership_type == 'creative_workspace':
                return Benefit.objects.filter(is_active=True)
            
            return Benefit.objects.none()
        except:
            return Benefit.objects.none()

class BenefitUsageViewSet(viewsets.ModelViewSet):
    serializer_class = BenefitUsageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get benefit usage for the current user"""
        return BenefitUsage.objects.filter(user=self.request.user)

    def create(self, request):
        """Use a benefit"""
        benefit_id = request.data.get('benefit_id')
        try:
            benefit = Benefit.objects.get(id=benefit_id)
            
            # Check if benefit is available to the user
            profile = request.user.profile
            if not benefit.is_available_to(profile):
                return Response(
                    {'detail': 'This benefit is not available to you.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Create or update benefit usage
            usage, created = BenefitUsage.objects.get_or_create(
                user=request.user,
                benefit=benefit
            )
            
            serializer = self.get_serializer(usage)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Benefit.DoesNotExist:
            return Response(
                {'detail': 'Benefit not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['GET'])
    def my_benefits(self, request):
        """Get all benefit usage for the current user"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)