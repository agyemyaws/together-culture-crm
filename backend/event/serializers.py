# File: backend/event/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import Event, Attendance, DigitalContent, ContentProgress, Benefit, BenefitUsage
from authentication.models import User, Profile, Membership

class UserBriefSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    membership_type = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'full_name', 'membership_type')
    
    def get_full_name(self, obj):
        """Get user's full name from profile if available"""
        try:
            profile = obj.profile
            if profile and profile.full_name:
                return profile.full_name
        except:
            pass
        return ""
    
    def get_membership_type(self, obj):
        """Get user's current membership type"""
        try:
            profile = obj.profile
            if profile and profile.current_membership:
                return profile.current_membership.membership_type
            return None
        except:
            return None

class EventSerializer(serializers.ModelSerializer):
    created_by = UserBriefSerializer(read_only=True)
    registration_count = serializers.SerializerMethodField()
    attendance_count = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()
    registration_open = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = ('id', 'title', 'description', 'event_type', 'start_date', 
                  'end_date', 'location', 'capacity', 'cost', 'is_active', 
                  'created_at', 'updated_at', 'created_by', 'eligible_membership_types',
                  'registration_count', 'attendance_count', 'is_full', 
                  'is_registered', 'registration_open', 'registration_opens', 'registration_closes')
        read_only_fields = ('created_at', 'updated_at', 'created_by')
    
    def get_registration_count(self, obj):
        return obj.get_registration_count()
    
    def get_attendance_count(self, obj):
        return obj.get_attendance_count()
    
    def get_is_full(self, obj):
        return obj.is_full()
    
    def get_is_registered(self, obj):
        """Check if request user is registered for this event"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.attendances.filter(user=request.user).exists()
        return False
    
    def get_registration_open(self, obj):
        """Check if registration is currently open for this event"""
        return obj.is_registration_open()

class EventCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ('id', 'title', 'description', 'event_type', 'start_date', 
                  'end_date', 'location', 'capacity', 'cost', 'is_active',
                  'eligible_membership_types', 'registration_opens', 'registration_closes')
    
    def validate(self, data):
        """Validate event dates"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({
                "end_date": "End date must be after start date."
            })
        
        # Validate registration period if provided
        registration_opens = data.get('registration_opens')
        registration_closes = data.get('registration_closes')
        
        if registration_opens and registration_closes and registration_opens >= registration_closes:
            raise serializers.ValidationError({
                "registration_closes": "Registration close date must be after registration open date."
            })
        
        if registration_closes and end_date and registration_closes > end_date:
            raise serializers.ValidationError({
                "registration_closes": "Registration cannot close after the event ends."
            })
        
        return data
    
    def create(self, validated_data):
        """Create event with current user as creator"""
        user = self.context['request'].user
        return Event.objects.create(created_by=user, **validated_data)

class AttendanceSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)
    event = EventSerializer(read_only=True)
    
    class Meta:
        model = Attendance
        fields = ('id', 'event', 'user', 'registered_at', 'attended', 'attended_at',
                 'checked_in', 'checked_in_at', 'checked_in_by', 'notes')
        read_only_fields = ('registered_at', 'attended', 'attended_at',
                           'checked_in', 'checked_in_at', 'checked_in_by')

class AttendanceCreateSerializer(serializers.ModelSerializer):
    event_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Attendance
        fields = ('event_id',)
    
    def validate_event_id(self, value):
        """Validate that the event exists and can be registered for"""
        try:
            event = Event.objects.get(id=value)
            user = self.context['request'].user
            
            if not event.is_active:
                raise serializers.ValidationError("This event is not active.")
                
            if event.is_full():
                raise serializers.ValidationError("This event is already at full capacity.")
            
            # Check if the event has already started
            if event.start_date < timezone.now():
                raise serializers.ValidationError("This event has already started.")
            
            # Check membership eligibility
            if not event.can_register(user):
                raise serializers.ValidationError("You are not eligible to register for this event.")
            
            return value
        except Event.DoesNotExist:
            raise serializers.ValidationError("Event not found.")
    
    def create(self, validated_data):
        """Register current user for event"""
        user = self.context['request'].user
        event_id = validated_data.pop('event_id')
        event = Event.objects.get(id=event_id)
        
        # Check if user already registered
        attendance, created = Attendance.objects.get_or_create(
            user=user,
            event=event,
            defaults={'registered_at': timezone.now()}
        )
        
        if not created:
            raise serializers.ValidationError("You are already registered for this event.")
        
        return attendance

class AttendanceMarkSerializer(serializers.ModelSerializer):
    """Serializer for marking attendance"""
    class Meta:
        model = Attendance
        fields = ('id', 'attended', 'notes')
        read_only_fields = ('id',)
    
    def update(self, instance, validated_data):
        """Update attendance record, setting attended_at if needed"""
        if 'attended' in validated_data and validated_data['attended'] and not instance.attended:
            instance.attended = True
            instance.attended_at = timezone.now()
        
        if 'notes' in validated_data:
            instance.notes = validated_data['notes']
            
        instance.save()
        return instance

class CheckInSerializer(serializers.ModelSerializer):
    """Serializer for check-in functionality"""
    class Meta:
        model = Attendance
        fields = ('id', 'checked_in', 'notes')
        read_only_fields = ('id',)
    
    def update(self, instance, validated_data):
        """Update check-in status"""
        if validated_data.get('checked_in', False) and not instance.checked_in:
            instance.checked_in = True
            instance.checked_in_at = timezone.now()
            instance.checked_in_by = self.context['request'].user
            
            # Also mark as attended
            instance.attended = True
            if not instance.attended_at:
                instance.attended_at = timezone.now()
        
        if 'notes' in validated_data:
            instance.notes = validated_data['notes']
            
        instance.save()
        return instance

class AttendanceAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for event attendance analytics"""
    attendance_by_membership = serializers.SerializerMethodField()
    attendance_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = ('id', 'title', 'start_date', 'event_type', 'attendance_by_membership', 
                  'attendance_rate')
    
    def get_attendance_by_membership(self, obj):
        """Get count of attendees by membership type"""
        result = {
            'community': 0,
            'key_access': 0,
            'creative_workspace': 0,
            'non_member': 0
        }
        
        for attendance in obj.attendances.filter(attended=True):
            profile = attendance.user.profile
            if not profile or not profile.current_membership:
                result['non_member'] += 1
            else:
                membership_type = profile.current_membership.membership_type
                if membership_type in result:
                    result[membership_type] += 1
        
        return result
    
    def get_attendance_rate(self, obj):
        """Calculate the percentage of registrants who attended"""
        registered = obj.get_registration_count()
        if registered == 0:
            return 0
        attended = obj.get_attendance_count()
        return round((attended / registered) * 100, 1)

class EventAttendanceStatsSerializer(serializers.ModelSerializer):
    """Serializer for event statistics for admin dashboard"""
    registration_count = serializers.SerializerMethodField()
    attendance_count = serializers.SerializerMethodField()
    attendance_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = ('id', 'title', 'start_date', 'event_type', 
                  'registration_count', 'attendance_count', 'attendance_rate')
    
    def get_registration_count(self, obj):
        return obj.get_registration_count()
    
    def get_attendance_count(self, obj):
        return obj.get_attendance_count()
    
    def get_attendance_rate(self, obj):
        registrations = obj.get_registration_count()
        if registrations == 0:
            return 0
        return round((obj.get_attendance_count() / registrations) * 100, 1)

# Digital Content Serializers
class DigitalContentSerializer(serializers.ModelSerializer):
    created_by = UserBriefSerializer(read_only=True)
    is_accessible = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = DigitalContent
        fields = ('id', 'title', 'description', 'content_type', 'access_level',
                 'url', 'file', 'thumbnail', 'created_at', 'updated_at',
                 'is_active', 'created_by', 'is_accessible', 'progress')
        read_only_fields = ('created_at', 'updated_at', 'created_by')
    
    def get_is_accessible(self, obj):
        """Check if content is accessible to the current user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
            
        user = request.user
        profile = user.profile
        
        if not profile:
            return False
            
        return obj.is_accessible_by(profile)
    
    def get_progress(self, obj):
        """Get the current user's progress for this content"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
            
        user = request.user
        try:
            progress = ContentProgress.objects.get(user=user, content=obj)
            return {
                'progress_percentage': progress.progress_percentage,
                'completed': progress.completed,
                'last_accessed': progress.last_accessed
            }
        except ContentProgress.DoesNotExist:
            return {
                'progress_percentage': 0,
                'completed': False,
                'last_accessed': None
            }

class ContentProgressSerializer(serializers.ModelSerializer):
    content = DigitalContentSerializer(read_only=True)
    content_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ContentProgress
        fields = ('id', 'content', 'content_id', 'progress_percentage', 'completed', 'last_accessed')
        read_only_fields = ('id', 'last_accessed')
    
    def create(self, validated_data):
        user = self.context['request'].user
        content_id = validated_data.pop('content_id')
        content = DigitalContent.objects.get(id=content_id)
        
        # Check if content is accessible
        profile = user.profile
        if not profile or not content.is_accessible_by(profile):
            raise serializers.ValidationError("You do not have access to this content.")
        
        # Create or update progress
        progress, created = ContentProgress.objects.update_or_create(
            user=user,
            content=content,
            defaults={
                'progress_percentage': validated_data.get('progress_percentage', 0),
                'completed': validated_data.get('completed', False),
                'last_accessed': timezone.now()
            }
        )
        
        return progress

# Benefit Serializers
class BenefitSerializer(serializers.ModelSerializer):
    is_available = serializers.SerializerMethodField()
    has_used = serializers.SerializerMethodField()
    
    class Meta:
        model = Benefit
        fields = ('id', 'name', 'description', 'membership_level_required',
                 'is_active', 'is_available', 'has_used')
        read_only_fields = ('id', 'is_active')
    
    def get_is_available(self, obj):
        """Check if benefit is available to the current user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
            
        user = request.user
        profile = user.profile
        
        if not profile:
            return False
            
        return obj.is_available_to(profile)
    
    def get_has_used(self, obj):
        """Check if the current user has used this benefit"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
            
        user = request.user
        return BenefitUsage.objects.filter(user=user, benefit=obj).exists()

class BenefitUsageSerializer(serializers.ModelSerializer):
    benefit = BenefitSerializer(read_only=True)
    benefit_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = BenefitUsage
        fields = ('id', 'benefit', 'benefit_id', 'used_at', 'usage_count', 'notes')
        read_only_fields = ('id', 'used_at')
    
    def create(self, validated_data):
        user = self.context['request'].user
        benefit_id = validated_data.pop('benefit_id')
        benefit = Benefit.objects.get(id=benefit_id)
        
        # Check if benefit is available
        profile = user.profile
        if not profile or not benefit.is_available_to(profile):
            raise serializers.ValidationError("This benefit is not available to you.")
        
        # Create or update usage
        usage, created = BenefitUsage.objects.update_or_create(
            user=user,
            benefit=benefit,
            defaults={
                'usage_count': validated_data.get('usage_count', 1),
                'notes': validated_data.get('notes', ''),
                'used_at': timezone.now()
            }
        )
        
        return usage