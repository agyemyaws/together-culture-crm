# File: backend/event/admin.py

from django.contrib import admin
from django.utils import timezone
from .models import (
    Event, Attendance, DigitalContent, 
    ContentProgress, Benefit, BenefitUsage
)

class AttendanceInline(admin.TabularInline):
    model = Attendance
    extra = 0
    readonly_fields = ('registered_at',)
    raw_id_fields = ['user']
    fields = ('user', 'registered_at', 'attended', 'attended_at', 
             'checked_in', 'checked_in_at', 'checked_in_by', 'notes')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_type', 'start_date', 'end_date', 'capacity', 
                    'cost', 'registration_count', 'attendance_count', 'is_active')
    list_filter = ('event_type', 'is_active', 'start_date')
    search_fields = ('title', 'description', 'location')
    date_hierarchy = 'start_date'
    readonly_fields = ('created_at', 'updated_at', 'registration_count', 'attendance_count')
    inlines = [AttendanceInline]
    
    def registration_count(self, obj):
        return obj.get_registration_count()
    
    def attendance_count(self, obj):
        return obj.get_attendance_count()
    
    registration_count.short_description = "Registrations"
    attendance_count.short_description = "Attendees"

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'registered_at', 'attended', 'attended_at', 
                   'checked_in', 'checked_in_at')
    list_filter = ('attended', 'checked_in', 'registered_at', 'attended_at', 
                  'event__event_type')
    search_fields = ('user__email', 'user__username', 'event__title', 'notes')
    date_hierarchy = 'registered_at'
    raw_id_fields = ['user', 'event', 'checked_in_by']
    list_select_related = ['user', 'event']
    actions = ['mark_as_attended', 'mark_as_checked_in']
    
    def mark_as_attended(self, request, queryset):
        updated = queryset.update(attended=True, attended_at=timezone.now())
        self.message_user(request, f"{updated} attendees marked as attended.")
    
    def mark_as_checked_in(self, request, queryset):
        updated = queryset.update(
            checked_in=True, 
            checked_in_at=timezone.now(),
            checked_in_by=request.user,
            attended=True,
            attended_at=timezone.now()
        )
        self.message_user(request, f"{updated} attendees marked as checked in.")
    
    mark_as_attended.short_description = "Mark selected attendees as attended"
    mark_as_checked_in.short_description = "Mark selected attendees as checked in"

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

class BenefitUsageInline(admin.TabularInline):
    model = BenefitUsage
    extra = 0
    readonly_fields = ('used_at',)
    raw_id_fields = ['user']

@admin.register(Benefit)
class BenefitAdmin(admin.ModelAdmin):
    list_display = ('name', 'membership_level_required', 'is_active')
    list_filter = ('membership_level_required', 'is_active')
    search_fields = ('name', 'description')
    inlines = [BenefitUsageInline]

@admin.register(BenefitUsage)
class BenefitUsageAdmin(admin.ModelAdmin):
    list_display = ('user', 'benefit', 'used_at', 'usage_count')
    list_filter = ('benefit__membership_level_required',)
    search_fields = ('user__email', 'user__username', 'benefit__name', 'notes')
    date_hierarchy = 'used_at'
    raw_id_fields = ['user', 'benefit']
    list_select_related = ['user', 'benefit']