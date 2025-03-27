from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from .models import Benefit, UserBenefit
from .serializers import BenefitSerializer, UserBenefitSerializer

class BenefitDashboardView(viewsets.ViewSet):
    """
    Dashboard view for member benefits
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user
        
        # Get all active benefits
        all_benefits = Benefit.objects.filter(is_active=True)
        
        # Get user's benefits
        user_benefits = UserBenefit.objects.filter(user=user)
        
        # Categorize benefits
        utilized_benefits = user_benefits.filter(is_active=True)
        unutilized_benefits = all_benefits.exclude(
            id__in=user_benefits.values_list('benefit_id', flat=True)
        )
        
        # Group benefits by category
        benefits_by_category = {}
        for benefit in all_benefits:
            if benefit.category not in benefits_by_category:
                benefits_by_category[benefit.category] = {
                    'utilized': [],
                    'unutilized': []
                }
            
            user_benefit = user_benefits.filter(benefit=benefit).first()
            serialized_benefit = UserBenefitSerializer(user_benefit).data if user_benefit else {
                'benefit': BenefitSerializer(benefit).data,
                'id': None,
                'is_active': False
            }
            
            if user_benefit and user_benefit.is_active:
                benefits_by_category[benefit.category]['utilized'].append(serialized_benefit)
            else:
                benefits_by_category[benefit.category]['unutilized'].append(serialized_benefit)
        
        return Response({
            'total_benefits': all_benefits.count(),
            'utilized_benefits': UserBenefitSerializer(utilized_benefits, many=True).data,
            'unutilized_benefits': UserBenefitSerializer(unutilized_benefits, many=True).data,
            'benefits_by_category': benefits_by_category
        })

    @action(detail=False, methods=['POST'], url_path='(?P<benefit_id>\d+)/activate')
    def activate_benefit(self, request, benefit_id=None):
        """
        Activate a specific benefit for the user
        """
        try:
            benefit = Benefit.objects.get(id=benefit_id, is_active=True)
            
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
            
            return Response(
                UserBenefitSerializer(user_benefit).data, 
                status=status.HTTP_200_OK
            )
        
        except Benefit.DoesNotExist:
            return Response(
                {'error': 'Benefit not found.'}, 
                status=status.HTTP_404_NOT_FOUND
            )