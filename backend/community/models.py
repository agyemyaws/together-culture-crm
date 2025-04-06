from django.db import models
from django.utils import timezone
from django.conf import settings

User = settings.AUTH_USER_MODEL

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
    liked_by = models.ManyToManyField(User, related_name="liked_replies", blank=True)
    disliked_by = models.ManyToManyField(User, related_name="disliked_replies", blank=True)

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
    liked_by = models.ManyToManyField(User, related_name="liked_messages", blank=True)

    def __str__(self):
        return f"Message from {self.sender} to {self.recipient}"

    @property
    def likes_count(self):
        return self.liked_by.count()
