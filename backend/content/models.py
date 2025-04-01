from django.db import models
from django.utils import timezone
from authentication.models import User, Profile

class DigitalContent(models.Model):
    CONTENT_TYPE_CHOICES = (
        ('course', 'Course'),
        ('template', 'Template'),
        ('webinar', 'Webinar'),
    )
    
    ACCESS_LEVEL_CHOICES = (
        ('all', 'All Members'),
        ('community', 'Community Members'),
        ('key_access', 'Key Access Members'),
        ('creative_workspace', 'Creative Workspace Members'),
    )
    
    CATEGORY_CHOICES = (
        ('Leadership', 'Leadership'),
        ('Marketing', 'Marketing'),
        ('Community', 'Community'),
        ('Events', 'Events'),
        ('Other', 'Other'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default='course')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Other')
    access_level = models.CharField(max_length=20, choices=ACCESS_LEVEL_CHOICES, default='all')
    
    # Content metadata
    author = models.CharField(max_length=100, blank=True, null=True)
    duration = models.CharField(max_length=50, blank=True, null=True)  # For courses, webinars, videos
    image_url = models.URLField(blank=True, null=True)
    featured = models.BooleanField(default=False)
    rating = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    downloads = models.PositiveIntegerField(default=0)  # For templates
    views = models.PositiveIntegerField(default=0)  # For webinars, videos
    
    # Content source
    url = models.URLField(blank=True, null=True)
    file = models.FileField(upload_to='content/', blank=True, null=True)
    
    # Metadata
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
            
        if self.access_level == 'creative_workspace' and membership.membership_type == 'creative_workspace':
            return True
            
        return False
    
    def increment_views(self):
        """Increment the view count for this content"""
        if self.content_type in ['webinar']:
            self.views += 1
            self.save(update_fields=['views'])
    
    def increment_downloads(self):
        """Increment the download count for this content"""
        if self.content_type == 'template':
            self.downloads += 1
            self.save(update_fields=['downloads'])


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