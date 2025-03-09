from django.db import models
from django.utils import timezone
from authentication.models import User, Profile

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


class Attendance(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendances')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    registered_at = models.DateTimeField(auto_now_add=True)
    attended = models.BooleanField(default=False)
    attended_at = models.DateTimeField(blank=True, null=True)

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