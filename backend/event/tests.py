from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from datetime import timedelta
from authentication.models import User, Profile, Membership
from .models import Event, Attendance, EventFeedback, EventTicket


class EventAPITestCase(APITestCase):
    def setUp(self):
        # Create test users
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='user123'
        )
        self.regular_user.profile = Profile.objects.create(
            user=self.regular_user,
            full_name='Test User'
        )

        # Create test event
        self.event = Event.objects.create(
            title='Test Event',
            description='Test Description',
            event_type='workshop',
            start_date=timezone.now() + timedelta(days=1),
            end_date=timezone.now() + timedelta(days=2),
            location='Test Location',
            capacity=10,
            created_by=self.admin_user
        )

        # Create test attendance
        self.attendance = Attendance.objects.create(
            event=self.event,
            user=self.regular_user
        )

    def test_event_list(self):
        """Test listing events"""
        url = reverse('event-list')
        
        # Test unauthenticated access
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test authenticated access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_event_create(self):
        """Test creating an event"""
        url = reverse('event-list')
        data = {
            'title': 'New Event',
            'description': 'New Description',
            'event_type': 'meetup',
            'start_date': timezone.now() + timedelta(days=1),
            'end_date': timezone.now() + timedelta(days=2),
            'location': 'New Location',
            'capacity': 20
        }

        # Test regular user creating event
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Test admin creating event
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Event.objects.count(), 2)

    def test_event_detail(self):
        """Test retrieving event details"""
        url = reverse('event-detail', kwargs={'pk': self.event.pk})

        # Test unauthenticated access
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test authenticated access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Event')

    def test_event_update(self):
        """Test updating an event"""
        url = reverse('event-detail', kwargs={'pk': self.event.pk})
        data = {'title': 'Updated Event'}

        # Test regular user updating event
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Test admin updating event
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.event.refresh_from_db()
        self.assertEqual(self.event.title, 'Updated Event')

    def test_event_delete(self):
        """Test deleting an event"""
        url = reverse('event-detail', kwargs={'pk': self.event.pk})

        # Test regular user deleting event
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Test admin deleting event
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Event.objects.count(), 0)

    def test_event_attendees(self):
        """Test getting event attendees"""
        url = reverse('event-attendees', kwargs={'pk': self.event.pk})

        # Test unauthenticated access
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test authenticated access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_event_upcoming(self):
        """Test getting upcoming events"""
        url = reverse('event-upcoming')

        # Test unauthenticated access
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test authenticated access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_event_past(self):
        """Test getting past events"""
        # Create a past event
        past_event = Event.objects.create(
            title='Past Event',
            description='Past Description',
            event_type='workshop',
            start_date=timezone.now() - timedelta(days=2),
            end_date=timezone.now() - timedelta(days=1),
            location='Past Location',
            created_by=self.admin_user
        )

        url = reverse('event-past')

        # Test unauthenticated access
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test authenticated access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_event_statistics(self):
        """Test getting event statistics"""
        url = reverse('event-statistics')

        # Test regular user access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Test admin access
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class AttendanceAPITestCase(APITestCase):
    def setUp(self):
        # Create test users
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='user123'
        )

        # Create test event
        self.event = Event.objects.create(
            title='Test Event',
            description='Test Description',
            event_type='workshop',
            start_date=timezone.now() + timedelta(days=1),
            end_date=timezone.now() + timedelta(days=2),
            location='Test Location',
            created_by=self.admin_user
        )

        # Create test attendance
        self.attendance = Attendance.objects.create(
            event=self.event,
            user=self.regular_user
        )

    def test_attendance_list(self):
        """Test listing attendances"""
        url = reverse('attendance-list')

        # Test unauthenticated access
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test regular user access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_attendance_create(self):
        """Test creating attendance"""
        url = reverse('attendance-list')
        data = {
            'event': self.event.id
        }

        # Test unauthenticated access
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test authenticated access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)  # Already registered

    def test_attendance_detail(self):
        """Test retrieving attendance details"""
        url = reverse('attendance-detail', kwargs={'pk': self.attendance.pk})

        # Test unauthenticated access
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test regular user access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test other user access
        other_user = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='other123'
        )
        self.client.force_authenticate(user=other_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_mark_attendance(self):
        """Test marking attendance"""
        url = reverse('attendance-mark-attendance', kwargs={'pk': self.attendance.pk})
        data = {'attended': True}

        # Test regular user access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Test admin access
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.attendance.refresh_from_db()
        self.assertTrue(self.attendance.attended)

    def test_check_in(self):
        """Test checking in attendance"""
        url = reverse('attendance-check-in', kwargs={'pk': self.attendance.pk})
        data = {'checked_in': True}

        # Test regular user access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Test admin access
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.attendance.refresh_from_db()
        self.assertTrue(self.attendance.checked_in)


class EventFeedbackAPITestCase(APITestCase):
    def setUp(self):
        # Create test users
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='user123'
        )

        # Create test event
        self.event = Event.objects.create(
            title='Test Event',
            description='Test Description',
            event_type='workshop',
            start_date=timezone.now() + timedelta(days=1),
            end_date=timezone.now() + timedelta(days=2),
            location='Test Location',
            created_by=self.admin_user
        )

        # Create test attendance
        self.attendance = Attendance.objects.create(
            event=self.event,
            user=self.regular_user,
            attended=True
        )

        # Create test feedback
        self.feedback = EventFeedback.objects.create(
            event=self.event,
            user=self.regular_user,
            rating=5,
            comment='Great event!'
        )

    def test_feedback_list(self):
        """Test listing feedback"""
        url = reverse('event-feedback-list')

        # Test unauthenticated access
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test authenticated access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_feedback_create(self):
        """Test creating feedback"""
        url = reverse('event-feedback-list')
        data = {
            'event': self.event.id,
            'rating': 4,
            'comment': 'Good event!'
        }

        # Test unauthenticated access
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test authenticated access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)  # Already provided feedback

    def test_feedback_detail(self):
        """Test retrieving feedback details"""
        url = reverse('event-feedback-detail', kwargs={'pk': self.feedback.pk})

        # Test unauthenticated access
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test authenticated access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rating'], 5)

    def test_event_feedback(self):
        """Test getting feedback for a specific event"""
        url = reverse('event-feedback-event-feedback')
        data = {'event_id': self.event.id}

        # Test unauthenticated access
        response = self.client.get(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test authenticated access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
