from django.contrib import admin
from .models import Discussion, Reply, Message

@admin.register(Discussion)
class DiscussionAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'created_at', 'replies_count')
    search_fields = ('title', 'author__username')
    list_filter = ('created_at',)

@admin.register(Reply)
class ReplyAdmin(admin.ModelAdmin):
    list_display = ('discussion', 'author', 'created_at', 'likes_count', 'dislikes_count')
    search_fields = ('discussion__title', 'author__username', 'content')
    list_filter = ('created_at',)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'timestamp', 'likes_count')
    search_fields = ('sender__username', 'recipient__username', 'content')
    list_filter = ('timestamp',)
