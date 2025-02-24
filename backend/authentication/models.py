from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    email = models.EmailField(unique=True)

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
    verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=20, blank=True)
    location = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.email}'s profile"

    @property
    def current_membership(self):
        """Get the current active membership"""
        return self.memberships.filter(end_date__isnull=True, is_approved=True).first()

    @property
    def pending_membership_request(self):
        """Get pending membership request if any"""
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

            # End any existing approved memberships
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