from django.db import models
from django.utils import timezone
from authentication.models import User, Profile, Membership


class Event(models.Model):
    EVENT_TYPE_CHOICES = (
        ('workshop', 'Workshop'),
        ('meetup', 'Meetup'),
        ('seminar', 'Seminar'),
        ('exhibition', 'Exhibition'),
        ('other', 'Other'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, default='other')
    
    # Event date and time fields
    event_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(blank=True, null=True)
    
    location = models.CharField(max_length=200, blank=True, null=True)
    capacity = models.PositiveIntegerField(default=0)  # 0 means unlimited
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True, null=True)
    registration_opens = models.DateTimeField(blank=True, null=True)
    registration_closes = models.DateTimeField(blank=True, null=True)
    eligible_membership_types = models.CharField(max_length=255, blank=True, null=True,
                                                 help_text="Comma-separated list of eligible membership types")
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False, help_text="If checked, non-members can access this event")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')

    def __str__(self):
        return self.title

    @property
    def start_date(self):
        """Compatibility property for start_date"""
        if self.event_date and self.start_time:
            return timezone.make_aware(
                timezone.datetime.combine(self.event_date, self.start_time)
            )
        return None

    @property
    def end_date(self):
        """Compatibility property for end_date"""
        if self.event_date and self.end_time:
            return timezone.make_aware(
                timezone.datetime.combine(self.event_date, self.end_time)
            )
        return None

    def get_attendance_count(self):
        """Return number of attendees who actually attended"""
        return self.attendances.filter(attended=True).count()

    def get_registration_count(self):
        """Return total number of registrations"""
        return self.attendances.count()

    def is_full(self):
        """Check if event is at capacity"""
        if self.capacity == 0:  # unlimited capacity
            return False
        return self.get_registration_count() >= self.capacity

    def is_registration_open(self):
        """Check if registration is currently open"""
        now = timezone.now()
        start_datetime = self.start_date

        # Event has passed
        if start_datetime and start_datetime < now:
            return False

        # Registration period defined and currently open
        if self.registration_opens and self.registration_closes:
            return self.registration_opens <= now <= self.registration_closes
        elif self.registration_opens:
            return self.registration_opens <= now
        elif self.registration_closes:
            return now <= self.registration_closes

        # Default: registration is open until event starts
        return True

    def can_register(self, user):
        """Check if a user is eligible to register for this event"""
        # Add debugging
        print(f"Checking if user {user.username} can register for event {self.title}")
        
        # Staff/admins can always register
        if user.is_staff or user.is_superuser:
            print("User is staff/admin, allowing registration")
            return True
        
        # Event must be active and registration open
        if not self.is_active:
            print("Event is not active")
            return False
            
        if not self.is_registration_open():
            print("Registration is not open")
            return False

        # Check if event is full
        if self.is_full():
            print("Event is full")
            return False

        # Check if user is already registered
        if self.attendances.filter(user=user).exists():
            print("User is already registered")
            return False

        # If event is public, anyone can register
        if self.is_public:
            print("Event is public, allowing registration")
            return True
            
        # If no membership types specified, anyone can register
        if not self.eligible_membership_types:
            print("No membership types specified, allowing registration")
            return True

        # Check user's membership against eligible types
        profile = user.profile
        print(f"User profile: {profile}")
        if not profile:
            print("User has no profile")
            return False
            
        # Get user's current membership
        user_membership = None
        if hasattr(profile, 'current_membership') and profile.current_membership:
            user_membership = profile.current_membership.membership_type
            
        print(f"User membership: {user_membership}")
        
        if not user_membership:
            print("User has no current membership")
            return False
            
        # Create standardized mappings for membership types
        membership_map = {
            # Common variations of community
            'community': ['community', 'community_member', 'community member'],
            
            # Common variations of key_access
            'key_access': ['key_access', 'key access', 'keyaccess', 'key', 'key member'],
            
            # Common variations of creative_workspace
            'creative_workspace': ['creative_workspace', 'creative workspace', 
                                  'creativeworkspace', 'workspace', 'creative']
        }
        
        # Parse eligible membership types
        eligible_types_raw = []
        if self.eligible_membership_types:
            eligible_types_raw = [t.strip().lower() for t in self.eligible_membership_types.split(',')]
        
        print(f"Parsed eligible types: {eligible_types_raw}")
        
        # Check if user's membership is eligible through any mapping
        user_membership_lower = user_membership.lower()
        
        # Direct match
        is_eligible = user_membership_lower in eligible_types_raw
        
        # Check through mappings
        if not is_eligible:
            for membership_type, variations in membership_map.items():
                # If the user's membership is this type
                if user_membership_lower in variations:
                    # Check if any variation of this type is in eligible types
                    for variation in variations:
                        if variation in eligible_types_raw:
                            is_eligible = True
                            break
                    # Also check if the main type key is in eligible types
                    if membership_type in eligible_types_raw:
                        is_eligible = True
                        break
        
        # Any key access or creative workspace member can attend key_access events
        if 'key_access' in eligible_types_raw or 'key access' in eligible_types_raw:
            if user_membership_lower in membership_map['key_access'] + membership_map['creative_workspace']:
                is_eligible = True
        
        # Creative workspace members can attend any member event
        if user_membership_lower in membership_map['creative_workspace']:
            is_eligible = True
            
        print(f"Is user eligible: {is_eligible}")
        return is_eligible


class Attendance(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendances')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    registered_at = models.DateTimeField(auto_now_add=True)
    attended = models.BooleanField(default=False)
    attended_at = models.DateTimeField(blank=True, null=True)
    checked_in_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checkins_performed'
    )

    class Meta:
        unique_together = ('user', 'event')
        verbose_name_plural = "Attendances"

    def __str__(self):
        return f"{self.user.username} - {self.event.title}"

    def mark_as_attended(self):
        """Mark this attendance record as attended"""
        self.attended = True
        self.attended_at = timezone.now()
        self.save()
        
    def check_in(self, admin_user=None):
        """Mark this attendance record as attended and set checked_in_by"""
        self.attended = True
        self.attended_at = timezone.now()
        self.checked_in_by = admin_user
        self.save()


class EventFeedback(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='feedbacks')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_feedbacks')
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('event', 'user')
        verbose_name_plural = "Event Feedbacks"

    def __str__(self):
        return f"{self.user.username}'s feedback for {self.event.title}"


class EventTicket(models.Model):
    attendance = models.OneToOneField(Attendance, on_delete=models.CASCADE, related_name='ticket')
    ticket_number = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_valid = models.BooleanField(default=True)

    def __str__(self):
        return f"Ticket {self.ticket_number} for {self.attendance.event.title}"