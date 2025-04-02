# File: backend/event/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import Event, Attendance, EventFeedback, EventTicket
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
    start_date = serializers.SerializerMethodField()
    end_date = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ('id', 'title', 'description', 'event_type', 
                 'event_date', 'start_time', 'end_time',
                 'start_date', 'end_date',  # Compatibility fields
                 'location', 'capacity', 'cost', 'is_active', 'is_public',
                 'created_at', 'updated_at', 'created_by', 
                 'eligible_membership_types', 'registration_count', 
                 'attendance_count', 'is_full', 'is_registered', 
                 'registration_open', 'registration_opens', 
                 'registration_closes')
        read_only_fields = ('created_at', 'updated_at', 'created_by')

    def get_start_date(self, obj):
        """Get the combined start datetime for compatibility"""
        return obj.start_date

    def get_end_date(self, obj):
        """Get the combined end datetime for compatibility"""
        return obj.end_date

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
        fields = [
            'title', 'description', 'event_type', 
            'event_date', 'start_time', 'end_time',
            'location', 'capacity', 'cost', 
            'registration_opens', 'registration_closes',
            'eligible_membership_types', 'is_active', 'is_public'
        ]
        read_only_fields = ['created_by']

    def validate(self, data):
        """Validate the event data"""
        # Ensure end_time is after start_time if provided
        if data.get('end_time') and data.get('start_time'):
            if data['end_time'] <= data['start_time']:
                raise serializers.ValidationError("End time must be after start time")

        # Check if registration dates are before event date
        event_start = timezone.make_aware(
            timezone.datetime.combine(data['event_date'], data['start_time'])
        )

        if data.get('registration_opens') and data['registration_opens'] > event_start:
            raise serializers.ValidationError("Registration open date must be before event start")

        if data.get('registration_closes') and data['registration_closes'] > event_start:
            raise serializers.ValidationError("Registration close date must be before event start")

        # Check if registration_closes is after registration_opens
        if data.get('registration_closes') and data.get('registration_opens'):
            if data['registration_closes'] <= data['registration_opens']:
                raise serializers.ValidationError("Registration close date must be after registration open date")

        return data

    def validate_eligible_membership_types(self, value):
        """Validate that the eligible membership types are valid"""
        if not value:
            return value

        # Split the comma-separated string into a list
        membership_types = [t.strip() for t in value.split(',')]
        
        # Get valid membership types from the Membership model
        valid_types = [choice[0] for choice in Membership.MEMBERSHIP_CHOICES]
        
        # Check if all provided types are valid
        invalid_types = [t for t in membership_types if t not in valid_types]
        if invalid_types:
            raise serializers.ValidationError(
                f"Invalid membership types: {', '.join(invalid_types)}. "
                f"Valid types are: {', '.join(valid_types)}"
            )
        
        return value


class AttendanceSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)
    event = EventSerializer(read_only=True)
    checked_in_by = UserBriefSerializer(read_only=True)

    class Meta:
        model = Attendance
        fields = ('id', 'event', 'user', 'registered_at', 'attended', 'attended_at', 'checked_in_by')
        read_only_fields = ('registered_at', 'attended', 'attended_at', 'checked_in_by')


class AttendanceCreateSerializer(serializers.ModelSerializer):
    event_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Attendance
        fields = ('event_id',)

    def validate_event_id(self, value):
        """Validate that the event exists and can be registered for"""
        # Ensure value is treated as integer
        try:
            event_id = int(value)
        except (TypeError, ValueError):
            raise serializers.ValidationError("Event ID must be an integer.")

        try:
            event = Event.objects.get(id=event_id)
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

            return event_id
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
        if 'attended' in validated_data and validated_data['attended'] and not instance.attended:
            instance.attended = True
            instance.attended_at = timezone.now()

        instance.save()
        return instance


class CheckInSerializer(serializers.ModelSerializer):
    """Serializer for check-in functionality"""

    class Meta:
        model = Attendance
        fields = ('id', 'attended')
        read_only_fields = ('id',)

    def update(self, instance, validated_data):
        """Update attendance record with check-in information"""
        if validated_data.get('attended', False) and not instance.attended:
            instance.attended = True
            instance.attended_at = timezone.now()
            instance.checked_in_by = self.context['request'].user

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


class EventFeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = EventFeedback
        fields = ['id', 'event', 'user', 'user_name', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']

    def validate(self, data):
        # Check if user has attended the event
        if not Attendance.objects.filter(event=data['event'], user=self.context['request'].user).exists():
            raise serializers.ValidationError("You can only provide feedback for events you have attended.")
        return data


class EventTicketSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='attendance.event.title', read_only=True)
    event_date = serializers.DateTimeField(source='attendance.event.start_date', read_only=True)
    user_name = serializers.CharField(source='attendance.user.get_full_name', read_only=True)

    class Meta:
        model = EventTicket
        fields = ['id', 'ticket_number', 'event_title', 'event_date', 'user_name', 'created_at', 'is_valid']
        read_only_fields = ['ticket_number', 'created_at']


