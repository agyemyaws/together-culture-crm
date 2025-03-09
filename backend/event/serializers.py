from rest_framework import serializers
from django.utils import timezone
from .models import Event, Attendance
from authentication.models import User, Profile

class UserBriefSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'full_name')
    
    def get_full_name(self, obj):
        """Get user's full name from profile if available"""
        try:
            profile = obj.profile()
            if profile and profile.full_name:
                return profile.full_name
        except:
            pass
        return ""

class EventSerializer(serializers.ModelSerializer):
    created_by = UserBriefSerializer(read_only=True)
    registration_count = serializers.SerializerMethodField()
    attendance_count = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = ('id', 'title', 'description', 'event_type', 'start_date', 
                  'end_date', 'location', 'capacity', 'is_active', 
                  'created_at', 'updated_at', 'created_by', 
                  'registration_count', 'attendance_count', 'is_full', 
                  'is_registered')
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

class EventCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ('id', 'title', 'description', 'event_type', 'start_date', 
                  'end_date', 'location', 'capacity', 'is_active')
    
    def validate(self, data):
        """Validate event dates"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({
                "end_date": "End date must be after start date."
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
        fields = ('id', 'event', 'user', 'registered_at', 'attended', 'attended_at')
        read_only_fields = ('registered_at', 'attended', 'attended_at')

class AttendanceCreateSerializer(serializers.ModelSerializer):
    event_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Attendance
        fields = ('event_id',)
    
    def validate_event_id(self, value):
        """Validate that the event exists and can be registered for"""
        try:
            event = Event.objects.get(id=value)
            if not event.is_active:
                raise serializers.ValidationError("This event is not active.")
            if event.is_full():
                raise serializers.ValidationError("This event is already at full capacity.")
            
            # Check if the event has already started
            if event.start_date < timezone.now():
                raise serializers.ValidationError("This event has already started.")
            
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
        fields = ('id', 'attended')
        read_only_fields = ('id',)
    
    def update(self, instance, validated_data):
        """Update attendance record, setting attended_at if needed"""
        instance.attended = validated_data.get('attended', instance.attended)
        if instance.attended and not instance.attended_at:
            instance.attended_at = timezone.now()
        instance.save()
        return instance

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