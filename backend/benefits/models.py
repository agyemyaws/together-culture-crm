from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Benefit(models.Model):
    """
    Represents a benefit available to members
    """
    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)
    value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    icon = models.CharField(max_length=100, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    requires_activation = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class UserBenefit(models.Model):
    """
    Tracks individual user's benefits and their usage
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_benefits')
    benefit = models.ForeignKey(Benefit, on_delete=models.CASCADE)
    
    is_active = models.BooleanField(default=False)
    activated_on = models.DateTimeField(null=True, blank=True)
    expires_on = models.DateTimeField(null=True, blank=True)
    
    usage_count = models.PositiveIntegerField(default=0)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'benefit')

    def __str__(self):
        return f"{self.user.username} - {self.benefit.name}"