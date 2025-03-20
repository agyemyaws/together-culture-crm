# File: backend/content/admin.py

from django.contrib import admin
from .models import DigitalContent, ContentProgress

class ContentProgressInline(admin.TabularInline):
    model = ContentProgress
    extra = 0
    readonly_fields = ('last_accessed',)
    raw_id_fields = ['user']

@admin.register(DigitalContent)
class DigitalContentAdmin(admin.ModelAdmin):
    list_display = ('title', 'content_type', 'access_level', 'created_at', 'is_active')
    list_filter = ('content_type', 'access_level', 'is_active')
    search_fields = ('title', 'description')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
    inlines = [ContentProgressInline]

@admin.register(ContentProgress)
class ContentProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'content', 'progress_percentage', 'completed', 'last_accessed')
    list_filter = ('completed', 'content__content_type')
    search_fields = ('user__email', 'user__username', 'content__title')
    date_hierarchy = 'last_accessed'
    raw_id_fields = ['user', 'content']
    list_select_related = ['user', 'content']