# File: backend/benefits/views.py

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Q

from .models import Benefit, BenefitUsage
from .serializers import BenefitSerializer, BenefitUsageSerializer


class BenefitViewSet(viewsets.ModelViewSet):
    """ViewSet for benefit management"""
    queryset = Benefit.objects.all().order_by('membership_level_required')
    serializer_class = BenefitSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # For unauthenticated users, return an empty queryset
        if not self.request.user.is_authenticated:
            return Benefit.objects.none()
            
        # Regular users can only see active benefits
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
            
            # Filter by membership level
            profile = self.request.user.profile
            if profile and profile.current_membership:
                membership_type = profile.current_membership.membership_type
                if membership_type == 'community':
                    queryset = queryset.filter(
                        Q(membership_level_required='all') | 
                        Q(membership_level_required='community')
                    )
                elif membership_type == 'key_access':
                    queryset = queryset.filter(
                        Q(membership_level_required='all') | 
                        Q(membership_level_required='community') | 
                        Q(membership_level_required='key_access')
                    )
                elif membership_type == 'creative_workspace':
                    # Creative workspace members can access all benefits
                    pass
            else:
                # Non-members can't access any benefits
                queryset = queryset.none()
                
        # Apply filter by membership level (admin only)
        if self.request.user.is_staff:
            membership_level = self.request.query_params.get('membership_level', None)
            if membership_level:
                queryset = queryset.filter(membership_level_required=membership_level)
                
        return queryset


class BenefitUsageViewSet(viewsets.ModelViewSet):
    """ViewSet for tracking benefit usage"""
    serializer_class = BenefitUsageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # The IsAuthenticated permission ensures this is only called by authenticated users
        
        # Admin can see all usage records
        if self.request.user.is_staff:
            queryset = BenefitUsage.objects.all()
            
            # Filter by user if provided
            user_id = self.request.query_params.get('user_id', None)
            if user_id:
                queryset = queryset.filter(user_id=user_id)
                
            # Filter by benefit if provided
            benefit_id = self.request.query_params.get('benefit_id', None)
            if benefit_id:
                queryset = queryset.filter(benefit_id=benefit_id)
                
            return queryset
            
        # Regular users can only see their own usage
        return BenefitUsage.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_benefits(self, request):
        """Get all benefit usage for the current user"""
        usage = self.get_queryset()
        serializer = self.get_serializer(usage, many=True)
        return Response(serializer.data)