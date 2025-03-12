# File: backend/event/models.py

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
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    location = models.CharField(max_length=200, blank=True, null=True)
    capacity = models.PositiveIntegerField(default=0)  # 0 means unlimited
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True, null=True)
    registration_opens = models.DateTimeField(blank=True, null=True)
    registration_closes = models.DateTimeField(blank=True, null=True)
    eligible_membership_types = models.CharField(max_length=255, blank=True, null=True, 
                                               help_text="Comma-separated list of eligible membership types")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')

    def __str__(self):
        return self.title

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
        
        # Event has passed
        if self.start_date < now:
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
        # Event must be active and registration open
        if not self.is_active or not self.is_registration_open():
            return False
            
        # Check if event is full
        if self.is_full():
            return False
            
        # Check if user is already registered
        if self.attendances.filter(user=user).exists():
            return False
            
        # If no membership restrictions, anyone can register
        if not self.eligible_membership_types:
            return True
            
        # Check user's membership against eligible types
        profile = user.profile
        if not profile or not profile.current_membership:
            return False
            
        eligible_types = self.eligible_membership_types.split(',')
        return profile.current_membership.membership_type in eligible_types


class Attendance(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendances')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    registered_at = models.DateTimeField(auto_now_add=True)
    attended = models.BooleanField(default=False)
    attended_at = models.DateTimeField(blank=True, null=True)
    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(blank=True, null=True)
    checked_in_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='checkins_performed'
    )
    notes = models.TextField(blank=True, null=True)

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
        """Mark this attendance record as checked in"""
        self.checked_in = True
        self.checked_in_at = timezone.now()
        self.checked_in_by = admin_user
        self.save()


# Add Digital Content models
class DigitalContent(models.Model):
    CONTENT_TYPE_CHOICES = (
        ('article', 'Article'),
        ('video', 'Video'),
        ('course', 'Course'),
        ('ebook', 'E-Book'),
        ('podcast', 'Podcast'),
        ('other', 'Other'),
    )
    
    ACCESS_LEVEL_CHOICES = (
        ('all', 'All Members'),
        ('community', 'Community Members'),
        ('key_access', 'Key Access Members'),
        ('creative_workspace', 'Creative Workspace Members'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default='article')
    access_level = models.CharField(max_length=20, choices=ACCESS_LEVEL_CHOICES, default='all')
    url = models.URLField(blank=True, null=True)
    file = models.FileField(upload_to='content/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_content')
    
    def __str__(self):
        return self.title
    
    def is_accessible_by(self, profile):
        """Check if content is accessible by a given profile based on membership type"""
        if not self.is_active:
            return False
            
        if self.access_level == 'all':
            return True
            
        membership = profile.current_membership
        if not membership:
            return False
            
        if self.access_level == 'community':
            return True
            
        if self.access_level == 'key_access' and membership.membership_type in ['key_access', 'creative_workspace']:
            return True
            
        if self.access_level == 'creative' and membership.membership_type == 'creative_workspace':
            return True
            
        return False


class ContentProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='content_progress')
    content = models.ForeignKey(DigitalContent, on_delete=models.CASCADE, related_name='user_progress')
    progress_percentage = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)
    last_accessed = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ('user', 'content')
        
    def __str__(self):
        return f"{self.user.username} - {self.content.title} ({self.progress_percentage}%)"


# Add Benefits models
class Benefit(models.Model):
    MEMBERSHIP_LEVELS = (
        ('all', 'All Members'),
        ('community', 'Community Members'),
        ('key_access', 'Key Access Members'),
        ('creative_workspace', 'Creative Workspace Members'),
    )

    name = models.CharField(max_length=200)
    description = models.TextField()
    membership_level_required = models.CharField(max_length=20, choices=MEMBERSHIP_LEVELS, default='all')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    def is_available_to(self, profile):
        """Check if benefit is available to a given profile based on membership type"""
        if not self.is_active:
            return False
            
        membership = profile.current_membership
        if not membership:
            return False
            
        if self.membership_level_required == 'all':
            return True
            
        if self.membership_level_required == 'community':
            return True
            
        if self.membership_level_required == 'key_access' and membership.membership_type in ['key_access', 'creative_workspace']:
            return True
            
        if self.membership_level_required == 'creative' and membership.membership_type == 'creative_workspace':
            return True
            
        return False


class BenefitUsage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='benefit_usage')
    benefit = models.ForeignKey(Benefit, on_delete=models.CASCADE, related_name='usage_records')
    used_at = models.DateTimeField(default=timezone.now)
    usage_count = models.IntegerField(default=1)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        unique_together = ('user', 'benefit')
        
    def __str__(self):
        return f"{self.user.username} - {self.benefit.name}"