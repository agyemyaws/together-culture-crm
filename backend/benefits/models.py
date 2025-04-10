from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Benefit(models.Model):
    """
    Represents a benefit available to members
    """
    MEMBERSHIP_GROUPS = [
        ('community', 'Community Member'),
        ('key_access', 'Key Access Member'),
        ('creative_workspace', 'Creative Workspace Member'),
        ('all', 'All Members'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)
    
    membership_group = models.CharField(
        max_length=20,
        choices=MEMBERSHIP_GROUPS,
        default='all',
        help_text='The membership group that can access this benefit'
    )
    
    is_active = models.BooleanField(default=True)
    requires_activation = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    def is_eligible_for_user(self, user):
        """
        Check if a user is eligible for this benefit based on their membership group
        """
        # All members can access 'all' benefits
        if self.membership_group == 'all':
            return True
        
        # Get the user's membership from their profile
        user_membership_type = None
        try:
            if hasattr(user, 'profile') and user.profile.current_membership:
                user_membership_type = user.profile.current_membership.membership_type
        except:
            return False
        
        if not user_membership_type:
            return False
        
        # Define the hierarchy of membership groups
        group_hierarchy = {
            'creative_workspace': ['creative_workspace', 'all'],
            'key_access': ['key_access', 'all'],
            'community': ['community', 'all'],
        }
        
        eligible_groups = group_hierarchy.get(user_membership_type, ['all'])
        return self.membership_group in eligible_groups

class UserBenefit(models.Model):
    """
    Tracks individual user's activated benefits
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_benefits')
    benefit = models.ForeignKey(Benefit, on_delete=models.CASCADE)
    
    is_active = models.BooleanField(default=False)
    activated_on = models.DateTimeField(null=True, blank=True)
    expires_on = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'benefit')

    def __str__(self):
        return f"{self.user.username} - {self.benefit.name}"
        
    def is_expired(self):
        """
        Check if benefit has expired
        """
        if self.expires_on and self.expires_on < timezone.now():
            return True
        return False

class BenefitUsageLog(models.Model):
    """
    Automatically logs benefit usage
    """
    user_benefit = models.ForeignKey(UserBenefit, on_delete=models.CASCADE, related_name='usage_logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    logged_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='logged_benefits'
    )
    
    def __str__(self):
        return f"{self.user_benefit} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def benefit(self):
        return self.user_benefit.benefit
        
    @property
    def user(self):
        return self.user_benefit.user