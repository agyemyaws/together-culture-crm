from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404

from .models import Event, Attendance
from .serializers import (
    EventSerializer, EventCreateUpdateSerializer,
    AttendanceSerializer, AttendanceCreateSerializer, AttendanceMarkSerializer,
    EventAttendanceStatsSerializer
)
from .permissions import IsAdminOrReadOnly, IsOwnerOrAdmin
from authentication.models import User, Profile

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
        
        return queryset
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def attendees(self, request, pk=None):
        """Get all attendees for a specific event"""
        event = self.get_object()
        attendances = event.attendances.all()
        serializer = AttendanceSerializer(attendances, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def upcoming(self, request):
        """Get all upcoming events"""
        events = Event.objects.filter(
            start_date__gte=timezone.now(),
            is_active=True
        ).order_by('start_date')
        
        page = self.paginate_queryset(events)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def past(self, request):
        """Get all past events"""
        events = Event.objects.filter(
            end_date__lt=timezone.now()
        ).order_by('-start_date')
        
        page = self.paginate_queryset(events)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(events, many=True)
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
        
        serializer = EventAttendanceStatsSerializer(events, many=True)
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
        
        serializer = self.get_serializer(events, many=True)
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
        return AttendanceSerializer
    
    def get_permissions(self):
        """
        Set permissions based on action
        """
        if self.action in ['destroy', 'mark_attendance']:
            return [IsAdminUser()]
        elif self.action in ['retrieve', 'list']:
            return [IsOwnerOrAdmin()]
        return super().get_permissions()
    
    def get_queryset(self):
        user = self.request.user
        
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
    def bulk_mark_attendance(self, request):
        """Mark multiple users as attended for an event (admin only)"""
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
        
        # Mark attendances
        attendances = Attendance.objects.filter(event=event, user_id__in=user_ids)
        
        for attendance in attendances:
            attendance.attended = True
            attendance.attended_at = timezone.now()
            attendance.save()
        
        return Response(
            {"message": f"{attendances.count()} attendances marked successfully"}, 
            status=status.HTTP_200_OK
        )