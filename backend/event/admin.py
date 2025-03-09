from django.contrib import admin
from django.utils import timezone
from .models import Event, Attendance

class AttendanceInline(admin.TabularInline):
    model = Attendance
    extra = 0
    readonly_fields = ('registered_at',)
    # Replace autocomplete_fields with raw_id_fields
    raw_id_fields = ['user']
    fields = ('user', 'registered_at', 'attended', 'attended_at')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_type', 'start_date', 'end_date', 'capacity', 
                    'registration_count', 'attendance_count', 'is_active')
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
    list_display = ('user', 'event', 'registered_at', 'attended', 'attended_at')
    list_filter = ('attended', 'registered_at', 'attended_at', 'event__event_type')
    search_fields = ('user__email', 'user__username', 'event__title')
    date_hierarchy = 'registered_at'
    # Replace autocomplete_fields with raw_id_fields
    raw_id_fields = ['user', 'event']
    list_select_related = ['user', 'event']
    actions = ['mark_as_attended']
    
    def mark_as_attended(self, request, queryset):
        updated = queryset.update(attended=True, attended_at=timezone.now())
        self.message_user(request, f"{updated} attendees marked as attended.")
    
    mark_as_attended.short_description = "Mark selected attendees as attended"