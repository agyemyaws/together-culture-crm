# File: backend/benefits/models.py

from django.db import models
from django.utils import timezone
from authentication.models import User, Profile

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