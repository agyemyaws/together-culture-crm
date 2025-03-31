from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg, F, Max
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay
from django.shortcuts import get_object_or_404
from django.db import transaction
import logging
from django.http import HttpResponse
from django.utils.crypto import get_random_string

from .models import Event, Attendance, EventFeedback, EventTicket
from .serializers import (
    EventSerializer, EventCreateUpdateSerializer,
    AttendanceSerializer, AttendanceCreateSerializer,
    AttendanceMarkSerializer, CheckInSerializer,
    AttendanceAnalyticsSerializer, EventAttendanceStatsSerializer,
    EventFeedbackSerializer, EventTicketSerializer
)
from .permissions import IsOwnerOrAdmin, CanManageEvent, CanProvideFeedback
from authentication.models import User, Profile, Membership, Interest
from authentication.serializers import ProfileSerializer

# # Import from content app for MemberActivityAPIView
# from content.models import ContentProgress, DigitalContent

# # Import from benefits app for MemberActivityAPIView
# from benefits.models import Benefit, BenefitUsage

# Add this new serializer for public event registration
from rest_framework import serializers

# Set up logger
logger = logging.getLogger(__name__)

class PublicEventRegistrationSerializer(serializers.Serializer):
    event_id = serializers.IntegerField()
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)


class EventViewSet(viewsets.ModelViewSet):
    """
    API endpoint for events.
    """
    queryset = Event.objects.all().order_by('-event_date', '-start_time')
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'location']
    permission_classes = [IsAuthenticated, CanManageEvent]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return EventCreateUpdateSerializer
        return EventSerializer

    def perform_create(self, serializer):
        """Add the current user as the event creator"""
        print("Event create data:", self.request.data)
        print("is_public in request data:", self.request.data.get('is_public'))
        
        # Convert is_public to boolean if it's a string
        is_public = self.request.data.get('is_public')
        if isinstance(is_public, str):
            is_public = is_public.lower() == 'true'
            print(f"Converted is_public string '{self.request.data.get('is_public')}' to boolean: {is_public}")
            
        # Make sure the data properly processes is_public
        serializer.save(
            created_by=self.request.user,
            is_public=is_public
        )

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
            queryset = queryset.filter(event_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(event_date__lte=end_date)

        # Filter past or upcoming events
        event_time = self.request.query_params.get('event_time', None)
        now = timezone.now()
        today = now.date()
        current_time = now.time()

        if event_time == 'past':
            queryset = queryset.filter(
                Q(event_date__lt=today) |
                Q(event_date=today, start_time__lt=current_time)
            )
        elif event_time == 'upcoming':
            queryset = queryset.filter(
                Q(event_date__gt=today) |
                Q(event_date=today, start_time__gte=current_time)
            )

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
        now = timezone.now()
        today = now.date()
        current_time = now.time()

        events = Event.objects.filter(
            Q(event_date__gt=today) |
            Q(event_date=today, start_time__gte=current_time),
            is_active=True
        ).order_by('event_date', 'start_time')

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
        now = timezone.now()
        today = now.date()
        current_time = now.time()

        events = Event.objects.filter(
            Q(event_date__lt=today) |
            Q(event_date=today, start_time__lt=current_time)
        ).order_by('-event_date', '-start_time')

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
        today = timezone.now().date()

        # Base queryset
        queryset = Event.objects.all()

        # Filter by time period
        if period == 'month':
            queryset = queryset.filter(
                event_date__gte=today - timezone.timedelta(days=30)
            )
        elif period == 'week':
            queryset = queryset.filter(
                event_date__gte=today - timezone.timedelta(days=7)
            )

        # Annotate with stats
        events = queryset.order_by('-event_date', '-start_time')

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
        ).order_by('-event_date', '-start_time')

        serializer = self.get_serializer(events, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def public_register(self, request):
        """Register for a public event without requiring an account"""
        # Explicitly set authentication classes to empty list to disable authentication
        self.authentication_classes = []
        
        serializer = PublicEventRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get event
        try:
            event = Event.objects.get(id=serializer.validated_data['event_id'])
        except Event.DoesNotExist:
            return Response(
                {"error": "Event not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Check if the event is public
        if not event.is_public:
            return Response(
                {"error": "This event is not open for public registration"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Check if event is full
        if event.is_full():
            return Response(
                {"error": "This event is already at full capacity"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check if registration is open
        if not event.is_registration_open():
            return Response(
                {"error": "Registration for this event is not currently open"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if email already exists as a user
        email = serializer.validated_data['email']
        full_name = serializer.validated_data['full_name']
        phone = serializer.validated_data.get('phone', '')
        
        with transaction.atomic():
            # Check if user exists with this email
            user = None
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Create temporary user for non-members
                username = f"guest_{email.split('@')[0]}_{timezone.now().strftime('%Y%m%d%H%M%S')}"
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=get_random_string(length=12),  # Random password
                    first_name=full_name.split(' ')[0] if ' ' in full_name else full_name,
                    last_name=' '.join(full_name.split(' ')[1:]) if ' ' in full_name else '',
                    is_active=True
                )
                
                # Create or update profile
                if not hasattr(user, 'profile'):
                    profile = Profile.objects.create(
                        user=user,
                        full_name=full_name,
                        phone_number=phone
                    )
            
            # Check if already registered
            attendance, created = Attendance.objects.get_or_create(
                user=user,
                event=event,
                defaults={'registered_at': timezone.now()}
            )
            
            if not created:
                return Response(
                    {"error": "You are already registered for this event"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate ticket
            ticket = EventTicket.objects.create(
                attendance=attendance,
                ticket_number=f"TKT-{attendance.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
            )
        
        # Return success response
        return Response({
            "message": "Successfully registered for the event",
            "ticket_number": ticket.ticket_number,
            "event": {
                "id": event.id,
                "title": event.title,
                "date": event.event_date,
                "time": event.start_time.strftime('%H:%M') if event.start_time else ""
            }
        }, status=status.HTTP_201_CREATED)

    # New action for public events
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """Get all public events (accessible without authentication)"""
        events = Event.objects.filter(is_public=True).order_by('event_date', 'start_time')
        
        # Filter by event type
        event_type = self.request.query_params.get('event_type', None)
        if event_type:
            events = events.filter(event_type=event_type)
            
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)

        if start_date:
            events = events.filter(event_date__gte=start_date)
        if end_date:
            events = events.filter(event_date__lte=end_date)
            
        # Only show upcoming public events
        now = timezone.now()
        today = now.date()
        current_time = now.time()
        
        events = events.filter(
            Q(event_date__gt=today) |
            Q(event_date=today, start_time__gte=current_time),
            is_active=True
        ).order_by('event_date', 'start_time')
        
        serializer = self.get_serializer(events, many=True, context={'request': request})
        return Response(serializer.data)
        
    # Also add a detail endpoint for public events
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def public_detail(self, request, pk=None):
        """Get details of a specific public event (accessible without authentication)"""
        try:
            event = Event.objects.get(pk=pk, is_public=True)
            serializer = self.get_serializer(event, context={'request': request})
            return Response(serializer.data)
        except Event.DoesNotExist:
            return Response(
                {"error": "This event is not available or does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )


class EventFeedbackViewSet(viewsets.ModelViewSet):
    """
    API endpoint for event feedback.
    """
    serializer_class = EventFeedbackSerializer
    permission_classes = [IsAuthenticated, CanProvideFeedback]

    def get_queryset(self):
        return EventFeedback.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def event_feedback(self, request):
        """Get feedback for a specific event"""
        event_id = request.query_params.get('event_id')
        if not event_id:
            return Response(
                {"error": "event_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        feedbacks = EventFeedback.objects.filter(event_id=event_id)
        serializer = self.get_serializer(feedbacks, many=True)
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
        elif self.action == 'ticket':
            return EventTicketSerializer
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
        """Register for an event and generate ticket"""
        # For direct registration via URL, use the event_id from the URL
        event_id = kwargs.get('event_id')
        
        if event_id:
            # If we have an event_id in the URL, we're using the /register/<event_id>/ endpoint
            print(f"Registering for event {event_id} from URL parameter")
            
            # Get the event to register for
            try:
                event = Event.objects.get(id=event_id)
            except Event.DoesNotExist:
                return Response(
                    {"error": "Event not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Check if the user is eligible to register
            user = request.user
            
            # Debug user and profile information
            print(f"User: {user.username}, is_authenticated: {user.is_authenticated}")
            if hasattr(user, 'profile') and user.profile:
                print(f"Profile exists: {user.profile}")
                if hasattr(user.profile, 'current_membership') and user.profile.current_membership:
                    print(f"Current membership: {user.profile.current_membership.membership_type}")
                else:
                    print("No current membership")
            else:
                print("No profile")
                
            # Check if already registered (do this first to provide clear message)
            if event.attendances.filter(user=user).exists():
                return Response(
                    {"error": "You are already registered for this event."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if not event.is_active:
                return Response(
                    {"error": "This event is not active."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if event.is_full():
                return Response(
                    {"error": "This event is already at full capacity."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if event.start_date < timezone.now():
                return Response(
                    {"error": "This event has already started."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Override the eligibility check for now to allow registration
            # if not event.can_register(user):
            #     return Response(
            #         {"error": "You are not eligible to register for this event."},
            #         status=status.HTTP_400_BAD_REQUEST
            #     )
                
            # Create attendance record
            attendance = Attendance.objects.create(
                user=user,
                event=event,
                registered_at=timezone.now()
            )
                
            # Generate ticket
            ticket = EventTicket.objects.create(
                attendance=attendance,
                ticket_number=f"TKT-{attendance.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
            )
            
            return Response(
                AttendanceSerializer(attendance, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        else:
            # If no event_id in URL, use the regular serializer-based registration
            print("Using regular serializer-based registration")
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            attendance = serializer.save()
            
            # Generate ticket
            ticket = EventTicket.objects.create(
                attendance=attendance,
                ticket_number=f"TKT-{attendance.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
            )
            
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
        attendances = Attendance.objects.filter(user=user)
        serializer = AttendanceSerializer(attendances, many=True, context={'request': request})
        
        # Add event IDs to make it easier for frontend to check registration status
        response_data = serializer.data
        
        # Add a simplified list of registered event IDs
        registered_event_ids = [attendance.event.id for attendance in attendances]
        
        return Response({
            'attendances': response_data,
            'registered_event_ids': registered_event_ids
        })

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

        # Mark users as attended
        attendances = Attendance.objects.filter(event=event, user_id__in=user_ids)
        admin_user = request.user

        for attendance in attendances:
            attendance.attended = True
            attendance.attended_at = timezone.now()
            attendance.checked_in_by = admin_user
            attendance.save()

        return Response(
            {"message": f"{attendances.count()} attendees marked as attended successfully"},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'])
    def ticket(self, request, pk=None):
        """Get ticket details for an attendance"""
        attendance = self.get_object()
        try:
            ticket = attendance.ticket
            serializer = EventTicketSerializer(ticket, context={'request': request})
            return Response(serializer.data)
        except EventTicket.DoesNotExist:
            return Response(
                {"error": "Ticket not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def my_tickets(self, request):
        """Get all tickets for the current user"""
        tickets = EventTicket.objects.filter(attendance__user=request.user)
        serializer = EventTicketSerializer(tickets, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def register_by_email(self, request):
        """Allow an admin to register a user by email address"""
        event_id = request.data.get('event_id')
        email = request.data.get('email')

        if not event_id:
            return Response(
                {"error": "event_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not email:
            return Response(
                {"error": "email is required"},
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

        # Check if event is full
        if event.is_full():
            return Response(
                {"error": "This event is already at full capacity"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if event has already started
        if event.start_date < timezone.now():
            return Response(
                {"error": "This event has already started"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find or create user with this email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create a temporary user for this email
            username = f"guest_{email.split('@')[0]}_{timezone.now().strftime('%Y%m%d%H%M%S')}"
            user = User.objects.create_user(
                username=username,
                email=email,
                password=get_random_string(length=12),
                is_active=True
            )
            
            # Create profile
            profile = Profile.objects.create(
                user=user,
                full_name=email.split('@')[0],  # Use part before @ as name
                bio="Added via admin registration"
            )

        # Check if user is already registered
        attendance, created = Attendance.objects.get_or_create(
            user=user,
            event=event,
            defaults={'registered_at': timezone.now()}
        )

        if not created:
            return Response(
                {"error": "This user is already registered for this event"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate ticket
        ticket = EventTicket.objects.create(
            attendance=attendance,
            ticket_number=f"TKT-{attendance.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        )

        return Response(
            AttendanceSerializer(attendance, context={'request': request}).data,
            status=status.HTTP_201_CREATED
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
    """
    API endpoint for member activity tracking
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id=None):
        """Get member activity data"""
        if user_id and not request.user.is_staff:
            return Response(
                {"error": "You don't have permission to view other users' activity"},
                status=status.HTTP_403_FORBIDDEN
            )

        user = get_object_or_404(User, id=user_id) if user_id else request.user
        profile = user.profile

        # Get event attendance
        event_attendances = Attendance.objects.filter(user=user)
        attended_events = event_attendances.filter(attended=True)
        upcoming_events = Event.objects.filter(
            attendances__user=user,
            event_date__gte=timezone.now().date()
        ).distinct()

        # Calculate event statistics
        total_events = event_attendances.count()
        attended_count = attended_events.count()
        attendance_rate = round((attended_count / total_events * 100), 1) if total_events > 0 else 0

        # Get membership history
        membership_history = profile.memberships.all().order_by('-start_date') if profile else []

        # Get interests
        interests = profile.interests.all().order_by('-start_date') if profile else []

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': profile.full_name if profile else None,
                'current_membership': profile.current_membership.membership_type if profile and profile.current_membership else None
            },
            'event_activity': {
                'total_events': total_events,
                'attended_events': attended_count,
                'attendance_rate': attendance_rate,
                'upcoming_events': EventSerializer(upcoming_events, many=True, context={'request': request}).data
            },
            'membership_history': [
                {
                    'type': membership.membership_type,
                    'start_date': membership.start_date,
                    'end_date': membership.end_date,
                    'is_approved': membership.is_approved
                }
                for membership in membership_history
            ],
            'interests': [
                {
                    'type': interest.interest_type,
                    'start_date': interest.start_date,
                    'end_date': interest.end_date
                }
                for interest in interests
            ]
        })

# This standalone APIView has no authentication at all and is dedicated to public event registration
class PublicEventRegistrationView(APIView):
    """API view for public event registration without authentication"""
    permission_classes = [AllowAny]
    authentication_classes = []  # Empty list means no authentication
    
    def options(self, request, *args, **kwargs):
        """Handle preflight OPTIONS request with CORS headers"""
        response = HttpResponse()
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    
    def post(self, request, format=None):
        """Register for a public event without requiring an account"""
        logger.info(f"Received public registration request: {request.data}")
        
        try:
            # Validate input data
            serializer = PublicEventRegistrationSerializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Invalid public registration data: {serializer.errors}")
                return Response(
                    {"error": "Invalid data provided", "details": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get event
            event_id = serializer.validated_data['event_id']
            try:
                event = Event.objects.get(id=event_id)
                logger.info(f"Found event: {event.title}, is_public: {event.is_public}")
            except Event.DoesNotExist:
                logger.error(f"Event not found: {event_id}")
                return Response(
                    {"error": f"Event not found with ID {event_id}"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Check if the event is public
            if not event.is_public:
                logger.error(f"Event {event.title} is not public")
                return Response(
                    {"error": "This event is not open for public registration"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Check if event is full
            if event.is_full():
                logger.error(f"Event {event.title} is full")
                return Response(
                    {"error": "This event is already at full capacity"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Skip registration open check for now as it might be causing issues
            # if hasattr(event, 'is_registration_open') and callable(getattr(event, 'is_registration_open')):
            #     if not event.is_registration_open():
            #         logger.error(f"Registration not open for event {event.title}")
            #         return Response(
            #             {"error": "Registration for this event is not currently open"},
            #             status=status.HTTP_400_BAD_REQUEST
            #         )
                
            # Get user info from serializer
            email = serializer.validated_data['email']
            full_name = serializer.validated_data['full_name']
            phone = serializer.validated_data.get('phone', '')
            
            # Process registration in a transaction
            with transaction.atomic():
                # Check if user exists with this email
                try:
                    user = User.objects.get(email=email)
                    logger.info(f"Found existing user with email {email}")
                except User.DoesNotExist:
                    # Create temporary user for non-members
                    username = f"guest_{email.split('@')[0]}_{timezone.now().strftime('%Y%m%d%H%M%S')}"
                    try:
                        user = User.objects.create_user(
                            username=username,
                            email=email,
                            password=get_random_string(length=12),
                            first_name=full_name.split(' ')[0] if ' ' in full_name else full_name,
                            last_name=' '.join(full_name.split(' ')[1:]) if ' ' in full_name else '',
                            is_active=True
                        )
                        logger.info(f"Created new user {username}")
                    except Exception as user_err:
                        logger.exception(f"Error creating user: {str(user_err)}")
                        return Response(
                            {"error": "Error creating user account", "details": str(user_err)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                    
                    # Create profile if needed
                    try:
                        if not hasattr(user, 'profile'):
                            profile = Profile.objects.create(
                                user=user,
                                full_name=full_name,
                                phone_number=phone
                            )
                            logger.info(f"Created new profile for {username}")
                    except Exception as profile_err:
                        logger.exception(f"Error creating profile (non-critical): {str(profile_err)}")
                        # Continue without profile if there's an issue
                
                # Check if already registered
                try:
                    existing = Attendance.objects.filter(user=user, event=event).exists()
                    if existing:
                        logger.warning(f"User {email} already registered for event {event.title}")
                        return Response(
                            {"error": "You are already registered for this event"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Create new attendance record
                    attendance = Attendance.objects.create(
                        user=user,
                        event=event,
                        registered_at=timezone.now()
                    )
                    logger.info(f"Created attendance record for {email} at event {event.title}")
                    
                    # Create ticket
                    ticket_number = f"TKT-{attendance.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                    ticket = EventTicket.objects.create(
                        attendance=attendance,
                        ticket_number=ticket_number
                    )
                    logger.info(f"Created ticket {ticket_number}")
                except Exception as reg_err:
                    logger.exception(f"Error during registration: {str(reg_err)}")
                    return Response(
                        {"error": "Error creating registration", "details": str(reg_err)},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
            # Return success response
            response_data = {
                "message": "Successfully registered for the event",
                "ticket_number": ticket.ticket_number,
                "event": {
                    "id": event.id,
                    "title": event.title,
                    "date": event.event_date.isoformat() if event.event_date else None,
                    "time": event.start_time.strftime('%H:%M') if event.start_time else None
                }
            }
            logger.info(f"Public registration successful for {email} at {event.title}")
            
            # Add CORS headers to response
            response = Response(response_data, status=status.HTTP_201_CREATED)
            response["Access-Control-Allow-Origin"] = "*"
            return response
            
        except Exception as e:
            logger.exception(f"Unexpected error in public registration: {str(e)}")
            return Response(
                {"error": "Registration failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )