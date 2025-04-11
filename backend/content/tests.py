from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from authentication.models import User, Profile, Membership
from content.models import DigitalContent, ContentProgress
from django.utils import timezone
from django.test import TestCase, TransactionTestCase
from django.db import transaction
from django.db.utils import IntegrityError
from concurrent.futures import ThreadPoolExecutor
import threading
import time


class DigitalContentAdminTests(APITestCase):
    def setUp(self):
        """Create an admin user and authenticate"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass',
            is_staff=True,
            is_superuser=True
        )
        # Create admin profile
        self.admin_profile = Profile.objects.create(
            user=self.admin_user,
            full_name='Admin User',
            bio='Admin user bio'
        )
        # Create admin membership
        self.admin_membership = Membership.objects.create(
            profile=self.admin_profile,
            membership_type='creative_workspace',
            is_approved=True
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
        self.content_url = reverse('digital-content-list')

    def test_admin_can_create_digital_content(self):
        """Ensure admin user can create digital content"""
        payload = {
            "title": "Admin Test Webinar",
            "content_type": "webinar",
            "category": "Events",
            "access_level": "all",
            "author": "Admin Author",
            "duration": "1 hour",
            "url": "https://example.com/webinar"
        }

        response = self.client.post(self.content_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(DigitalContent.objects.count(), 1)
        self.assertEqual(DigitalContent.objects.first().title, "Admin Test Webinar")

    def test_admin_can_update_digital_content(self):
        """Ensure admin user can update digital content"""
        content = DigitalContent.objects.create(
            title="Old Title", content_type="course", category="Marketing",
            access_level="all", author="Admin", created_by=self.admin_user
        )

        url = reverse('digital-content-detail', kwargs={'pk': content.pk})
        updated_data = {
            "title": "Updated Course Title",
            "content_type": "course",
            "category": "Marketing",
            "access_level": "all",
            "author": "Updated Admin",
            "url": "https://example.com/updated-course"
        }

        response = self.client.put(url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content.refresh_from_db()
        self.assertEqual(content.title, "Updated Course Title")

    def test_admin_can_delete_digital_content(self):
        """Ensure admin user can delete digital content"""
        content = DigitalContent.objects.create(
            title="Deletable Content", content_type="template", category="Other",
            access_level="all", author="ToDelete", created_by=self.admin_user
        )

        url = reverse('digital-content-detail', kwargs={'pk': content.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(DigitalContent.objects.filter(pk=content.pk).exists())

    def test_non_admin_cannot_create_content(self):
        """Ensure non-admin users cannot create digital content"""
        # Create regular user with profile
        user = User.objects.create_user(username='normal', email='normal@example.com', password='pass')
        profile = Profile.objects.create(
            user=user,
            full_name='Normal User',
            bio='Normal user bio'
        )
        Membership.objects.create(
            profile=profile,
            membership_type='community',
            is_approved=True
        )
        
        self.client.force_authenticate(user=user)

        payload = {
            "title": "Unauthorized Creation",
            "content_type": "course",
            "category": "Community",
            "access_level": "all",
            "author": "NotAdmin"
        }

        response = self.client.post(self.content_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_sees_only_active_content(self):
        """Ensure regular users only see active content"""
        # Create content
        DigitalContent.objects.create(
            title="Visible Content", content_type="course", category="Leadership",
            access_level="all", author="Admin", is_active=True, created_by=self.admin_user
        )
        DigitalContent.objects.create(
            title="Hidden Content", content_type="course", category="Marketing",
            access_level="all", author="Admin", is_active=False, created_by=self.admin_user
        )

        # Create regular user with profile
        normal_user = User.objects.create_user(username='student', email='student@example.com', password='pass')
        normal_profile = Profile.objects.create(
            user=normal_user,
            full_name='Student User',
            bio='Student user bio'
        )
        Membership.objects.create(
            profile=normal_profile,
            membership_type='community',
            is_approved=True
        )
        
        self.client.force_authenticate(user=normal_user)

        response = self.client.get(self.content_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "Visible Content")

    def test_regular_user_cannot_delete_content(self):
        """Test that regular users cannot delete content even if they know the ID"""
        # Create content first
        content = DigitalContent.objects.create(
            title="Test Content",
            content_type="course",
            category="Leadership",
            access_level="all",
            created_by=self.admin_user
        )

        # Create regular user with profile and membership
        regular_user = User.objects.create_user(
            username='regular',
            email='regular@example.com',
            password='regularpass'
        )
        regular_profile = Profile.objects.create(
            user=regular_user,
            full_name='Regular User',
            bio='Regular user bio'
        )
        Membership.objects.create(
            profile=regular_profile,
            membership_type='community',
            is_approved=True
        )

        # Try to delete as regular user
        self.client.force_authenticate(user=regular_user)
        response = self.client.delete(
            reverse('digital-content-detail', kwargs={'pk': content.id})
        )
        
        # Assert deletion was prevented
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(DigitalContent.objects.filter(id=content.id).exists())

    def test_admin_cannot_create_content_with_invalid_payload(self):
        """Test that content creation fails with invalid payload"""
        # Test missing required fields
        response = self.client.post(self.content_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.data)

        # Test invalid content type
        invalid_data = {
            'title': 'Test Content',
            'content_type': 'invalid_type',
            'category': 'Leadership',
            'access_level': 'all'
        }
        response = self.client.post(self.content_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('content_type', response.data)

        # Test invalid access level
        invalid_data = {
            'title': 'Test Content',
            'content_type': 'course',
            'category': 'Leadership',
            'access_level': 'invalid_level'
        }
        response = self.client.post(self.content_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('access_level', response.data)

    def test_duplicate_content_creation(self):
        """Test creating content with duplicate title"""
        # Create initial content
        initial_data = {
            'title': 'Duplicate Test',
            'content_type': 'course',
            'category': 'Leadership',
            'access_level': 'all'
        }
        response = self.client.post(self.content_url, initial_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Try to create duplicate content
        response = self.client.post(self.content_url, initial_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.data)  # Assuming title uniqueness is enforced


class ConcurrentEditingTests(TransactionTestCase):
    def setUp(self):
        """Set up test environment for concurrent editing"""
        # Create admin users
        self.admin1 = User.objects.create_user(
            username='admin1',
            email='admin1@example.com',
            password='admin1pass',
            is_staff=True,
            is_superuser=True
        )
        self.admin2 = User.objects.create_user(
            username='admin2',
            email='admin2@example.com',
            password='admin2pass',
            is_staff=True,
            is_superuser=True
        )

        # Create profiles and memberships
        for admin in [self.admin1, self.admin2]:
            profile = Profile.objects.create(
                user=admin,
                full_name=f'{admin.username} User',
                bio=f'{admin.username} bio'
            )
            Membership.objects.create(
                profile=profile,
                membership_type='creative_workspace',
                is_approved=True
            )

        # Create test content
        self.content = DigitalContent.objects.create(
            title="Concurrent Test Content",
            content_type="course",
            category="Leadership",
            access_level="all",
            created_by=self.admin1
        )

        self.client1 = APIClient()
        self.client2 = APIClient()
        self.client1.force_authenticate(user=self.admin1)
        self.client2.force_authenticate(user=self.admin2)

    def test_concurrent_content_editing(self):
        """Test concurrent editing of the same content by multiple administrators"""
        url = reverse('digital-content-detail', kwargs={'pk': self.content.id})
        
        def update_content(client, new_title):
            data = {
                'title': new_title,
                'content_type': 'course',
                'category': 'Leadership',
                'access_level': 'all'
            }
            return client.put(url, data, format='json')

        # Use ThreadPoolExecutor to simulate concurrent requests
        with ThreadPoolExecutor(max_workers=2) as executor:
            future1 = executor.submit(update_content, self.client1, "Updated by Admin 1")
            future2 = executor.submit(update_content, self.client2, "Updated by Admin 2")

            response1 = future1.result()
            response2 = future2.result()

        # At least one update should succeed
        self.assertTrue(
            response1.status_code == status.HTTP_200_OK or 
            response2.status_code == status.HTTP_200_OK
        )

        # Verify the content was updated
        updated_content = DigitalContent.objects.get(id=self.content.id)
        self.assertIn(
            updated_content.title, 
            ["Updated by Admin 1", "Updated by Admin 2"]
        )
