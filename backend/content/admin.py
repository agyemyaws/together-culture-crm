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
    list_display = ('title', 'content_type', 'category', 'access_level', 'author', 'featured', 'rating', 'created_at', 'is_active')
    list_filter = ('content_type', 'category', 'access_level', 'featured', 'is_active')
    search_fields = ('title', 'description', 'author')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at', 'downloads', 'views')
    inlines = [ContentProgressInline]
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'content_type', 'category', 'access_level', 'is_active')
        }),
        ('Content Metadata', {
            'fields': ('author', 'duration', 'image_url', 'featured', 'rating'),
            'classes': ('collapse',),
        }),
        ('Statistics', {
            'fields': ('downloads', 'views'),
            'classes': ('collapse',),
        }),
        ('Content Source', {
            'fields': ('url', 'file'),
            'classes': ('collapse',),
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',),
        }),
    )
    list_editable = ('featured', 'is_active')

@admin.register(ContentProgress)
class ContentProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'content', 'progress_percentage', 'completed', 'last_accessed')
    list_filter = ('completed', 'content__content_type', 'content__category')
    search_fields = ('user__email', 'user__username', 'content__title')
    date_hierarchy = 'last_accessed'
    raw_id_fields = ['user', 'content']
    list_select_related = ['user', 'content']