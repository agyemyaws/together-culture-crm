from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from django.db.models import Count, Sum, Max

from .models import Benefit, UserBenefit, BenefitUsageLog
from .serializers import BenefitSerializer, UserBenefitSerializer, BenefitUsageLogSerializer

class BenefitDashboardView(viewsets.ViewSet):
    """
    Dashboard view for member benefits
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user
        
        # Get user's membership
        user_membership_type = None
        try:
            if hasattr(user, 'profile') and user.profile.current_membership:
                user_membership_type = user.profile.current_membership.membership_type
        except:
            pass
        
        # Get all active benefits
        all_benefits = Benefit.objects.filter(is_active=True)
        
        # Filter benefits based on user's membership group
        eligible_benefits = []
        if user_membership_type:
            # Define membership hierarchy
            group_hierarchy = {
                'creative_workspace': ['creative_workspace', 'all'],
                'key_access': ['key_access', 'all'],
                'community': ['community', 'all'],
            }
            
            # Get eligible membership groups for this user
            eligible_groups = group_hierarchy.get(user_membership_type, ['all'])
            
            # Filter benefits
            for benefit in all_benefits:
                if benefit.membership_group in eligible_groups:
                    eligible_benefits.append(benefit)
        else:
            # If no membership, only show 'all' benefits
            for benefit in all_benefits:
                if benefit.membership_group == 'all':
                    eligible_benefits.append(benefit)
        
        # Get user's benefits
        user_benefits = UserBenefit.objects.filter(user=user)
        
        # Categorize benefits
        utilized_benefits = user_benefits.filter(is_active=True)
        
        # Get all benefit IDs the user has
        user_benefit_ids = user_benefits.values_list('benefit_id', flat=True)
        
        # Get benefits user doesn't have yet but is eligible for
        unutilized_benefits = []
        for benefit in eligible_benefits:
            if benefit.id not in user_benefit_ids:
                unutilized_benefits.append({
                    'id': None,
                    'benefit': BenefitSerializer(benefit).data,
                    'is_active': False,
                    'activated_on': None,
                    'expires_on': None,
                    'usage_count': 0,
                    'last_used_at': None
                })
        
        # Group benefits by category
        benefits_by_category = {}
        for benefit in eligible_benefits:
            if benefit.category not in benefits_by_category:
                benefits_by_category[benefit.category] = {
                    'utilized': [],
                    'unutilized': []
                }
            
            user_benefit = user_benefits.filter(benefit=benefit).first()
            
            if user_benefit and user_benefit.is_active:
                # Get usage information
                usage_data = self._get_usage_data(user_benefit)
                
                # Add benefit data with usage info
                benefit_data = UserBenefitSerializer(user_benefit).data
                benefit_data.update(usage_data)
                
                benefits_by_category[benefit.category]['utilized'].append(benefit_data)
            else:
                # For benefits user doesn't have yet
                if not user_benefit:
                    serialized_benefit = {
                        'id': None,
                        'benefit': BenefitSerializer(benefit).data,
                        'is_active': False,
                        'activated_on': None,
                        'expires_on': None,
                        'usage_count': 0,
                        'last_used_at': None
                    }
                else:
                    # For benefits user has but not active
                    serialized_benefit = UserBenefitSerializer(user_benefit).data
                    # Add usage information
                    usage_data = self._get_usage_data(user_benefit)
                    serialized_benefit.update(usage_data)
                
                benefits_by_category[benefit.category]['unutilized'].append(serialized_benefit)
        
        # Get user's membership information
        membership_info = None
        if user_membership_type:
            membership_info = {
                'type': user_membership_type,
                'display_name': dict(Benefit.MEMBERSHIP_GROUPS).get(user_membership_type, 'Unknown')
            }
        
        return Response({
            'membership': membership_info,
            'total_benefits': len(eligible_benefits),
            'utilized_benefits': self._serialize_benefits_with_usage(utilized_benefits),
            'unutilized_benefits': unutilized_benefits,
            'benefits_by_category': benefits_by_category
        })
    
    def _get_usage_data(self, user_benefit):
        """Helper method to get usage data for a user benefit"""
        usage_count = BenefitUsageLog.objects.filter(user_benefit=user_benefit).count()
        last_usage = BenefitUsageLog.objects.filter(user_benefit=user_benefit).order_by('-timestamp').first()
        
        return {
            'usage_count': usage_count,
            'last_used_at': last_usage.timestamp if last_usage else None
        }
    
    def _serialize_benefits_with_usage(self, benefits):
        """Helper method to serialize benefits with usage data"""
        result = []
        for benefit in benefits:
            data = UserBenefitSerializer(benefit).data
            usage_data = self._get_usage_data(benefit)
            data.update(usage_data)
            result.append(data)
        return result

    @action(detail=False, methods=['POST'], url_path='(?P<benefit_id>\d+)/activate')
    def activate_benefit(self, request, benefit_id=None):
        """
        Activate a specific benefit for the user
        """
        try:
            benefit = Benefit.objects.get(id=benefit_id, is_active=True)
            user = request.user
            
            # Check if user is eligible for this benefit based on membership
            user_membership_type = None
            try:
                if hasattr(user, 'profile') and user.profile.current_membership:
                    user_membership_type = user.profile.current_membership.membership_type
            except:
                pass
            
            is_eligible = False
            if benefit.membership_group == 'all':
                is_eligible = True
            elif user_membership_type:
                # Define membership hierarchy
                group_hierarchy = {
                    'creative_workspace': ['creative_workspace', 'all'],
                    'key_access': ['key_access', 'all'],
                    'community': ['community', 'all'],
                }
                
                eligible_groups = group_hierarchy.get(user_membership_type, ['all'])
                is_eligible = benefit.membership_group in eligible_groups
            
            if not is_eligible:
                return Response(
                    {'error': 'You are not eligible for this benefit based on your membership.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create or get user benefit
            user_benefit, created = UserBenefit.objects.get_or_create(
                user=request.user, 
                benefit=benefit,
                defaults={
                    'is_active': True,
                    'activated_on': timezone.now(),
                    'expires_on': timezone.now() + timezone.timedelta(days=365)  # Example expiry
                }
            )
            
            if not created and not user_benefit.is_active:
                user_benefit.is_active = True
                user_benefit.activated_on = timezone.now()
                user_benefit.expires_on = timezone.now() + timezone.timedelta(days=365)
                user_benefit.save()
            
            # Return with usage data
            response_data = UserBenefitSerializer(user_benefit).data
            response_data.update(self._get_usage_data(user_benefit))
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        except Benefit.DoesNotExist:
            return Response(
                {'error': 'Benefit not found.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class BenefitAdminView(viewsets.ModelViewSet):
    """
    Admin view for managing benefits
    """
    queryset = Benefit.objects.all()
    serializer_class = BenefitSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        """
        Optionally filter benefits by category
        """
        queryset = Benefit.objects.all()
        category = self.request.query_params.get('category', None)
        
        if category:
            queryset = queryset.filter(category=category)
            
        return queryset
    
    @action(detail=False, methods=['GET'])
    def usage_stats(self, request):
        """
        Get usage statistics for benefits
        """
        benefits = Benefit.objects.all()
        stats = []
        
        for benefit in benefits:
            # Get UserBenefits for this benefit
            user_benefits = UserBenefit.objects.filter(benefit=benefit)
            
            # Count metrics
            total_users = user_benefits.count()
            active_users = user_benefits.filter(is_active=True).count()
            
            # Get usage logs
            usage_logs = BenefitUsageLog.objects.filter(user_benefit__benefit=benefit)
            total_usage = usage_logs.count()
            
            # Get recent usage
            recent_usage = usage_logs.filter(
                timestamp__gte=timezone.now() - timezone.timedelta(days=30)
            ).count()
            
            stats.append({
                'id': benefit.id,
                'name': benefit.name,
                'category': benefit.category,
                'membership_group': benefit.membership_group,
                'total_users': total_users,
                'active_users': active_users,
                'total_usage': total_usage,
                'recent_usage': recent_usage,
                'last_used': usage_logs.order_by('-timestamp').values('timestamp').first()
            })
            
        return Response(stats)
    
    @action(detail=True, methods=['POST'], url_path='log-usage')
    def log_usage(self, request, pk=None):
        """
        Log usage of a benefit for a specific user
        """
        try:
            benefit = self.get_object()
            user_id = request.data.get('user_id')
            notes = request.data.get('notes', '')
            
            if not user_id:
                return Response(
                    {'error': 'User ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Get or create UserBenefit (auto-activate if not active)
            user_benefit, created = UserBenefit.objects.get_or_create(
                user=user,
                benefit=benefit,
                defaults={
                    'is_active': True,
                    'activated_on': timezone.now(),
                    'expires_on': timezone.now() + timezone.timedelta(days=365)
                }
            )
            
            if not user_benefit.is_active:
                user_benefit.is_active = True
                user_benefit.save()
                
            # Create usage log
            usage_log = BenefitUsageLog.objects.create(
                user_benefit=user_benefit,
                notes=notes,
                logged_by=request.user
            )
            
            return Response(
                BenefitUsageLogSerializer(usage_log).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    @action(detail=True, methods=['GET'], url_path='usage-history')
    def usage_history(self, request, pk=None):
        """
        Get usage history for a specific benefit
        """
        benefit = self.get_object()
        usage_logs = BenefitUsageLog.objects.filter(
            user_benefit__benefit=benefit
        ).order_by('-timestamp')
        
        # Optional user filter
        user_id = request.query_params.get('user_id', None)
        if user_id:
            usage_logs = usage_logs.filter(user_benefit__user_id=user_id)
            
        return Response(
            BenefitUsageLogSerializer(usage_logs, many=True).data
        )

class UserBenefitUsageView(viewsets.GenericViewSet):
    """
    View for managing user benefit usage
    """
    permission_classes = [permissions.IsAdminUser]
    
    @action(detail=False, methods=['GET'], url_path='user/(?P<user_id>\d+)')
    def user_usage(self, request, user_id=None):
        """
        Get benefit usage for a specific user
        """
        try:
            user = User.objects.get(id=user_id)
            user_benefits = UserBenefit.objects.filter(user=user)
            
            result = []
            for user_benefit in user_benefits:
                usage_logs = BenefitUsageLog.objects.filter(
                    user_benefit=user_benefit
                ).order_by('-timestamp')
                
                benefit_data = UserBenefitSerializer(user_benefit).data
                benefit_data['usage_logs'] = BenefitUsageLogSerializer(
                    usage_logs, many=True
                ).data
                
                result.append(benefit_data)
                
            return Response(result)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )