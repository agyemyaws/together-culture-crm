from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    email = models.EmailField(null=True)
    username = models.CharField(max_length=30, unique=True)

    USERNAME_FIELD = 'username'

    @property
    def profile(self):
        try:
            return Profile.objects.get(user=self)
        except Profile.DoesNotExist:
            return None

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=1000)
    bio = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, blank=True)
    location = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.email}'s profile"

    @property
    def current_membership(self):
        return self.memberships.filter(end_date__isnull=True, is_approved=True).first()

    @property
    def pending_membership_request(self):
        return self.memberships.filter(end_date__isnull=True, is_approved=False).first()

class Membership(models.Model):
    MEMBERSHIP_CHOICES = [
        ('community', 'Community Member'),
        ('key_access', 'Key Access Member'),
        ('creative_workspace', 'Creative Workspace Member'),
    ]

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='memberships')
    membership_type = models.CharField(max_length=20, choices=MEMBERSHIP_CHOICES)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_memberships')
    approved_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-start_date']

    def save(self, *args, **kwargs):
        if self.is_approved and not self.approved_date:
            self.approved_date = timezone.now()
            current_memberships = Membership.objects.filter(
                profile=self.profile,
                end_date__isnull=True,
                is_approved=True
            ).exclude(pk=self.pk)
            for membership in current_memberships:
                membership.end_date = timezone.now()
                membership.save()
        super().save(*args, **kwargs)

class Interest(models.Model):
    INTEREST_CHOICES = [
        ('caring', 'Caring'),
        ('sharing', 'Sharing'),
        ('creating', 'Creating'),
        ('experiencing', 'Experiencing'),
        ('working', 'Working'),
    ]

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='interests')
    interest_type = models.CharField(max_length=20, choices=INTEREST_CHOICES)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-start_date']

class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action_type = models.CharField(max_length=50) 
    timestamp = models.DateTimeField(default=timezone.now)
    details = models.TextField(blank=True)  

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.action_type} at {self.timestamp}"


class Discussion(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='discussions')
    created_at = models.DateTimeField(default=timezone.now)
    replies_count = models.PositiveIntegerField(default=0)  

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title        
class Reply(models.Model):
    discussion = models.ForeignKey(Discussion, on_delete=models.CASCADE, related_name='replies')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='replies')
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    liked_by = models.ManyToManyField(User, related_name="liked_replies", blank=True)  # New field
    disliked_by = models.ManyToManyField(User, related_name="disliked_replies", blank=True)  # New field

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Reply by {self.author.username} on {self.discussion.title}"

    @property
    def likes_count(self):
        return self.liked_by.count()

    @property
    def dislikes_count(self):
        return self.disliked_by.count()

class Message(models.Model):
    sender = models.ForeignKey(User, related_name="sent_messages", on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, related_name="received_messages", on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    parent_message = models.ForeignKey(
        'self', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='replies'
    )
    liked_by = models.ManyToManyField(User, related_name="liked_messages", blank=True)  # New field

    def __str__(self):
        return f"Message from {self.sender} to {self.recipient}"

    @property
    def likes_count(self):
        return self.liked_by.count() 