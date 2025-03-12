# File: backend/event/views.py

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg, F, Max
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay
from django.shortcuts import get_object_or_404

from .models import (
    Event, Attendance, DigitalContent, ContentProgress, 
    Benefit, BenefitUsage
)
from .serializers import (
    EventSerializer, EventCreateUpdateSerializer,
    AttendanceSerializer, AttendanceCreateSerializer, 
    AttendanceMarkSerializer, CheckInSerializer,
    AttendanceAnalyticsSerializer, EventAttendanceStatsSerializer,
    DigitalContentSerializer, ContentProgressSerializer,
    BenefitSerializer, BenefitUsageSerializer
)
from .permissions import IsAdminOrReadOnly, IsOwnerOrAdmin
from authentication.models import User, Profile, Membership, Interest

class EventViewSet(viewsets.ModelViewSet):
    """
    API endpoint for events.
    """
    queryset = Event.objects.all().order_by('-start_date')
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'location']
    permission_classes = [IsAdminOrReadOnly]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return EventCreateUpdateSerializer
        return EventSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by event type
        event_type = self.request.query_params.get('event_type', None)
        if event_type:
            queryset = queryset.filter(event_type=event_type)
            
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_date__lte=end_date)
        
        # Filter past or upcoming events
        event_time = self.request.query_params.get('event_time', None)
        if event_time == 'past':
            queryset = queryset.filter(end_date__lt=timezone.now())
        elif event_time == 'upcoming':
            queryset = queryset.filter(start_date__gte=timezone.now())
        
        # Filter by membership eligibility
        membership_type = self.request.query_params.get('membership_type', None)
        if membership_type:
            queryset = queryset.filter(eligible_membership_types__contains=membership_type)
        
        return queryset
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def attendees(self, request, pk=None):
        """Get all attendees for a specific event"""
        event = self.get_object()
        attendances = event.attendances.all()
        serializer = AttendanceSerializer(attendances, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def upcoming(self, request):
        """Get all upcoming events"""
        events = Event.objects.filter(
            start_date__gte=timezone.now(),
            is_active=True
        ).order_by('start_date')
        
        # Filter by user's membership type if not admin
        if not request.user.is_staff:
            profile = request.user.profile
            if profile and profile.current_membership:
                membership_type = profile.current_membership.membership_type
                events = events.filter(
                    Q(eligible_membership_types__isnull=True) | 
                    Q(eligible_membership_types__contains=membership_type)
                )
        
        page = self.paginate_queryset(events)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(events, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def past(self, request):
        """Get all past events"""
        events = Event.objects.filter(
            end_date__lt=timezone.now()
        ).order_by('-start_date')
        
        page = self.paginate_queryset(events)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(events, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def statistics(self, request):
        """Get event statistics for admin dashboard"""
        # Get time period from query params
        period = request.query_params.get('period', 'all')
        
        # Base queryset
        queryset = Event.objects.all()
        
        # Filter by time period
        if period == 'month':
            queryset = queryset.filter(
                start_date__gte=timezone.now() - timezone.timedelta(days=30)
            )
        elif period == 'week':
            queryset = queryset.filter(
                start_date__gte=timezone.now() - timezone.timedelta(days=7)
            )
        
        # Annotate with stats
        events = queryset.order_by('-start_date')
        
        serializer = EventAttendanceStatsSerializer(events, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def user_events(self, request):
        """Get all events attended by a specific user"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {"error": "user_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = get_object_or_404(User, id=user_id)
        
        # Get events where user is registered
        events = Event.objects.filter(
            attendances__user=user
        ).order_by('-start_date')
        
        serializer = self.get_serializer(events, many=True, context={'request': request})
        return Response(serializer.data)


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for event attendance records.
    """
    queryset = Attendance.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AttendanceCreateSerializer
        elif self.action == 'mark_attendance':
            return AttendanceMarkSerializer
        elif self.action == 'check_in':
            return CheckInSerializer
        return AttendanceSerializer
    
    def get_permissions(self):
        """
        Set permissions based on action
        """
        if self.action in ['destroy', 'mark_attendance', 'check_in', 'bulk_check_in']:
            return [IsAdminUser()]
        elif self.action in ['retrieve', 'list']:
            return [IsOwnerOrAdmin()]
        return super().get_permissions()
    
    def get_queryset(self):
        user = self.request.user
        
        # For unauthenticated users, return an empty queryset
        if not user.is_authenticated:
            return Attendance.objects.none()
        
        # Admin can see all attendances
        if user.is_staff:
            queryset = Attendance.objects.all()
            
            # Filter by user_id if provided
            user_id = self.request.query_params.get('user_id', None)
            if user_id:
                queryset = queryset.filter(user_id=user_id)
                
            # Filter by event_id if provided
            event_id = self.request.query_params.get('event_id', None)
            if event_id:
                queryset = queryset.filter(event_id=event_id)
                
            return queryset
        
        # Regular users can only see their own attendances
        return Attendance.objects.filter(user=user)
    
    def create(self, request, *args, **kwargs):
        """Register for an event"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attendance = serializer.save()
        return Response(
            AttendanceSerializer(attendance, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def mark_attendance(self, request, pk=None):
        """Mark user as attended for an event"""
        attendance = self.get_object()
        serializer = AttendanceMarkSerializer(attendance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AttendanceSerializer(attendance, context={'request': request}).data)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def check_in(self, request, pk=None):
        """Check in user for an event"""
        attendance = self.get_object()
        serializer = CheckInSerializer(attendance, data=request.data, context={'request': request}, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AttendanceSerializer(attendance, context={'request': request}).data)
    
    @action(detail=False, methods=['get'])
    def my_events(self, request):
        """Get all events the current user is registered for"""
        user = request.user
        attendances = Attendance.objects.filter(user=user).order_by('-event__start_date')
        serializer = AttendanceSerializer(attendances, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def event_attendees(self, request):
        """Get all attendees for a specific event (admin only)"""
        event_id = request.query_params.get('event_id', None)
        if not event_id:
            return Response(
                {"error": "event_id parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        attendances = Attendance.objects.filter(event_id=event_id)
        serializer = AttendanceSerializer(attendances, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_check_in(self, request):
        """Check in multiple users for an event (admin only)"""
        event_id = request.data.get('event_id')
        user_ids = request.data.get('user_ids', [])
        
        if not event_id:
            return Response(
                {"error": "event_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user_ids or not isinstance(user_ids, list):
            return Response(
                {"error": "user_ids must be a non-empty list"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get event
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {"error": "Event not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check in attendances
        attendances = Attendance.objects.filter(event=event, user_id__in=user_ids)
        
        for attendance in attendances:
            attendance.checked_in = True
            attendance.checked_in_at = timezone.now()
            attendance.checked_in_by = request.user
            attendance.attended = True
            attendance.attended_at = timezone.now()
            attendance.save()
        
        return Response(
            {"message": f"{attendances.count()} attendees checked in successfully"}, 
            status=status.HTTP_200_OK
        )


class MemberJourneyAPIView(APIView):
    """API view for analyzing member journey and progression"""
    permission_classes = [IsAdminUser]
    
    def get(self, request, format=None):
        """Get analysis of member journey through the community"""
        # Get query parameters
        period = request.query_params.get('period', 'all')
        interest_filter = request.query_params.get('interest')
        
        # Base queryset - all profiles
        queryset = Profile.objects.all()
        
        # Apply time filter
        if period == 'month':
            queryset = queryset.filter(
                user__date_joined__gte=timezone.now() - timezone.timedelta(days=30)
            )
        elif period == 'quarter':
            queryset = queryset.filter(
                user__date_joined__gte=timezone.now() - timezone.timedelta(days=90)
            )
        elif period == 'year':
            queryset = queryset.filter(
                user__date_joined__gte=timezone.now() - timezone.timedelta(days=365)
            )
            
        # Apply interest filter
        if interest_filter:
            queryset = queryset.filter(
                interests__interest_type=interest_filter,
                interests__end_date__isnull=True
            ).distinct()
        
        # Calculate membership stats
        total_profiles = queryset.count()
        membership_distribution = {}
        
        for membership_type, _ in Membership.MEMBERSHIP_CHOICES:
            count = queryset.filter(
                memberships__membership_type=membership_type,
                memberships__is_approved=True,
                memberships__end_date__isnull=True
            ).count()
            
            membership_distribution[membership_type] = {
                'count': count,
                'percentage': round((count / total_profiles * 100), 1) if total_profiles > 0 else 0
            }
        
        # Calculate interest trends
        interest_trends = []
        for interest_type, _ in Interest.INTEREST_CHOICES:
            initial_count = queryset.filter(
                interests__interest_type=interest_type,
                interests__start_date__lte=F('user__date_joined') + timezone.timedelta(days=7)
            ).distinct().count()
            
            current_count = queryset.filter(
                interests__interest_type=interest_type,
                interests__end_date__isnull=True
            ).distinct().count()
            
            interest_trends.append({
                'interest_type': interest_type,
                'initial_count': initial_count,
                'current_count': current_count,
                'change': current_count - initial_count,
                'percentage_change': round(((current_count - initial_count) / initial_count * 100), 1) 
                    if initial_count > 0 else 0
            })
        
        # Calculate engagement metrics
        event_engagement = queryset.annotate(
            event_count=Count('user__attendances', distinct=True),
            attended_count=Count('user__attendances', 
                filter=Q(user__attendances__attended=True), distinct=True)
        ).aggregate(
            avg_events=Avg('event_count'),
            avg_attended=Avg('attended_count'),
            max_events=Max('event_count'),
            max_attended=Max('attended_count')
        )
        
        # Return comprehensive data
        return Response({
            'total_members': total_profiles,
            'membership_distribution': membership_distribution,
            'interest_trends': interest_trends,
            'event_engagement': event_engagement,
        })


class MemberActivityAPIView(APIView):
    """API view for analyzing individual member activities"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id=None, format=None):
        """Get comprehensive activity analysis for a member"""
        # For regular users, only show their own data
        if not request.user.is_staff and user_id is not None and int(user_id) != request.user.id:
            return Response(
                {"error": "You do not have permission to view this user's activity"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # If no user_id provided, use the current user
        if user_id is None:
            user_id = request.user.id
            
        user = get_object_or_404(User, id=user_id)
        profile = user.profile
        
        if not profile:
            return Response(
                {"error": "User profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get event participation
        events = Event.objects.filter(attendances__user=user)
        event_count = events.count()
        attended_count = events.filter(attendances__attended=True).count()
        
        # Get event types distribution
        event_types = events.values('event_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Get content progress
        content_progress = ContentProgress.objects.filter(user=user)
        content_count = content_progress.count()
        completed_content = content_progress.filter(completed=True).count()
        
        # Get available content count
        if profile.current_membership:
            membership_type = profile.current_membership.membership_type
            available_content = DigitalContent.objects.filter(
                Q(access_level='all') | 
                Q(access_level=membership_type) |
                (Q(access_level='key_access') & Q(membership_type__in=['key_access', 'creative_workspace'])) |
                (Q(access_level='creative') & Q(membership_type='creative_workspace'))
            ).count()
        else:
            available_content = 0
        
        # Get benefit usage
        benefit_usage = BenefitUsage.objects.filter(user=user)
        if profile.current_membership:
            membership_type = profile.current_membership.membership_type
            benefit_count = Benefit.objects.filter(
                Q(membership_level_required='all') | 
                Q(membership_level_required=membership_type) |
                (Q(membership_level_required='key_access') & Q(membership_type__in=['key_access', 'creative_workspace'])) |
                (Q(membership_level_required='creative') & Q(membership_type='creative_workspace'))
            ).count()
        else:
            benefit_count = 0
        
        used_benefits_count = benefit_usage.values('benefit').distinct().count()
        benefit_usage_percentage = round((used_benefits_count / benefit_count * 100), 1) if benefit_count > 0 else 0
        
        # Get membership history
        membership_history = profile.memberships.all().order_by('-start_date')
        
        # Get interest history
        interest_history = profile.interests.all().order_by('-start_date')
        
        # Compile comprehensive activity data
        activity_data = {
            'user_id': user.id,
            'email': user.email,
            'full_name': profile.full_name,
            'joined_date': user.date_joined,
            'current_membership': profile.current_membership.membership_type if profile.current_membership else None,
            'event_participation': {
                'total_events': event_count,
                'attended_events': attended_count,
                'attendance_rate': round((attended_count / event_count * 100), 1) if event_count > 0 else 0,
                'event_types': list(event_types)
            },
            'content_engagement': {
                'total_content_available': available_content,
                'content_accessed': content_count,
                'completed_content': completed_content,
                'completion_rate': round((completed_content / content_count * 100), 1) if content_count > 0 else 0
            },
            'benefit_usage': {
                'available_benefits': benefit_count,
                'used_benefits': used_benefits_count,
                'usage_percentage': benefit_usage_percentage
            }
        }
        
        # Add membership and interest history for admin users
        if request.user.is_staff:
            activity_data['membership_history'] = [
                {
                    'type': m.membership_type,
                    'start_date': m.start_date,
                    'end_date': m.end_date,
                    'is_approved': m.is_approved
                } for m in membership_history
            ]
            
            activity_data['interest_history'] = [
                {
                    'type': i.interest_type,
                    'start_date': i.start_date,
                    'end_date': i.end_date
                } for i in interest_history
            ]
        
        return Response(activity_data)


class DigitalContentViewSet(viewsets.ModelViewSet):
    """ViewSet for digital content management"""
    queryset = DigitalContent.objects.all().order_by('-created_at')
    serializer_class = DigitalContentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # For unauthenticated users, return an empty queryset
        if not self.request.user.is_authenticated:
            return DigitalContent.objects.none()
            
        # Regular users can only see active content
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
            
            # Filter by access level based on user's membership
            profile = self.request.user.profile
            if profile and profile.current_membership:
                membership_type = profile.current_membership.membership_type
                if membership_type == 'community':
                    queryset = queryset.filter(
                        Q(access_level='all') | Q(access_level='community')
                    )
                elif membership_type == 'key_access':
                    queryset = queryset.filter(
                        Q(access_level='all') | Q(access_level='community') | 
                        Q(access_level='key_access')
                    )
                elif membership_type == 'creative_workspace':
                    # Creative workspace members can access all content
                    pass
            else:
                # Non-members can't access any content
                queryset = queryset.none()
                
        # Apply filter by content type
        content_type = self.request.query_params.get('content_type', None)
        if content_type:
            queryset = queryset.filter(content_type=content_type)
            
        # Apply filter by access level (admin only)
        if self.request.user.is_staff:
            access_level = self.request.query_params.get('access_level', None)
            if access_level:
                queryset = queryset.filter(access_level=access_level)
                
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_content(self, request):
        """Get all content the current user has interacted with"""
        user = request.user
        content_ids = ContentProgress.objects.filter(user=user).values_list('content_id', flat=True)
        queryset = self.get_queryset().filter(id__in=content_ids)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ContentProgressViewSet(viewsets.ModelViewSet):
    """ViewSet for user content progress tracking"""
    serializer_class = ContentProgressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # The IsAuthenticated permission ensures this is only called by authenticated users
        return ContentProgress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_progress(self, request):
        """Get all content progress for the current user"""
        progress = self.get_queryset()
        serializer = self.get_serializer(progress, many=True)
        return Response(serializer.data)


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