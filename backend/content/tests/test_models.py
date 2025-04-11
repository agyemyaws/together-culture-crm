from django.test import TestCase
from django.urls import reverse
from authentication.models import User, Profile, Membership
from content.models import DigitalContent, ContentProgress
from django.utils import timezone

class ContentModelTestCase(TestCase):
    def setUp(self):
        # Create test users with different membership levels
        self.admin_user = User.objects.create_user(
            username='admin',
            password='adminpass',
            is_staff=True
        )
        self.regular_user = User.objects.create_user(
            username='regular',
            password='regularpass'
        )
        self.key_access_user = User.objects.create_user(
            username='keyaccess',
            password='keyaccesspass'
        )
        self.creative_workspace_user = User.objects.create_user(
            username='creative',
            password='creativepass'
        )

        # Create profiles for users
        self.regular_profile = Profile.objects.create(
            user=self.regular_user,
            full_name='Regular User',
            bio='Regular user bio'
        )
        self.key_access_profile = Profile.objects.create(
            user=self.key_access_user,
            full_name='Key Access User',
            bio='Key access user bio'
        )
        self.creative_workspace_profile = Profile.objects.create(
            user=self.creative_workspace_user,
            full_name='Creative Workspace User',
            bio='Creative workspace user bio'
        )

        # Create memberships for users
        self.regular_membership = Membership.objects.create(
            profile=self.regular_profile,
            membership_type='community',
            is_approved=True
        )
        self.key_access_membership = Membership.objects.create(
            profile=self.key_access_profile,
            membership_type='key_access',
            is_approved=True
        )
        self.creative_workspace_membership = Membership.objects.create(
            profile=self.creative_workspace_profile,
            membership_type='creative_workspace',
            is_approved=True
        )

        # Create sample content with different access levels
        self.public_content = DigitalContent.objects.create(
            title='Public Content',
            description='Content for all members',
            content_type='course',
            access_level='all',
            created_by=self.admin_user
        )

        self.community_content = DigitalContent.objects.create(
            title='Community Content',
            description='Content for community members',
            content_type='template',
            access_level='community',
            created_by=self.admin_user
        )

        self.key_access_content = DigitalContent.objects.create(
            title='Key Access Content',
            description='Content for key access members',
            content_type='webinar',
            access_level='key_access',
            created_by=self.admin_user
        )

        self.creative_workspace_content = DigitalContent.objects.create(
            title='Creative Workspace Content',
            description='Content for creative workspace members',
            content_type='course',
            access_level='creative_workspace',
            created_by=self.admin_user
        )

    def test_content_creation(self):
        """Test that content can be created with all required fields"""
        content = DigitalContent.objects.create(
            title='Test Content',
            description='Test Description',
            content_type='course',
            category='Leadership',
            access_level='all',
            created_by=self.admin_user
        )
        
        self.assertEqual(content.title, 'Test Content')
        self.assertEqual(content.content_type, 'course')
        self.assertEqual(content.access_level, 'all')
        self.assertTrue(content.is_active)
        self.assertEqual(content.views, 0)
        self.assertEqual(content.downloads, 0)

    def test_content_accessibility(self):
        """Test content accessibility based on membership levels"""
        # Test public content accessibility
        self.assertTrue(self.public_content.is_accessible_by(self.regular_profile))
        self.assertTrue(self.public_content.is_accessible_by(self.key_access_profile))
        self.assertTrue(self.public_content.is_accessible_by(self.creative_workspace_profile))

        # Test community content accessibility
        self.assertTrue(self.community_content.is_accessible_by(self.regular_profile))
        self.assertTrue(self.community_content.is_accessible_by(self.key_access_profile))
        self.assertTrue(self.community_content.is_accessible_by(self.creative_workspace_profile))

        # Test key access content accessibility
        self.assertFalse(self.key_access_content.is_accessible_by(self.regular_profile))
        self.assertTrue(self.key_access_content.is_accessible_by(self.key_access_profile))
        self.assertTrue(self.key_access_content.is_accessible_by(self.creative_workspace_profile))

        # Test creative workspace content accessibility
        self.assertFalse(self.creative_workspace_content.is_accessible_by(self.regular_profile))
        self.assertFalse(self.creative_workspace_content.is_accessible_by(self.key_access_profile))
        self.assertTrue(self.creative_workspace_content.is_accessible_by(self.creative_workspace_profile))

    def test_content_view_counting(self):
        """Test that view counting works correctly for webinar content"""
        # Test view counting for webinar content
        self.assertEqual(self.key_access_content.views, 0)
        self.key_access_content.increment_views()
        self.assertEqual(self.key_access_content.views, 1)

        # Test view counting for non-webinar content
        self.assertEqual(self.public_content.views, 0)
        self.public_content.increment_views()
        self.assertEqual(self.public_content.views, 0)  # Should not increment for non-webinar content

    def test_content_download_counting(self):
        """Test that download counting works correctly for template content"""
        # Test download counting for template content
        self.assertEqual(self.community_content.downloads, 0)
        self.community_content.increment_downloads()
        self.assertEqual(self.community_content.downloads, 1)

        # Test download counting for non-template content
        self.assertEqual(self.public_content.downloads, 0)
        self.public_content.increment_downloads()
        self.assertEqual(self.public_content.downloads, 0)  # Should not increment for non-template content

    def test_content_progress_tracking(self):
        """Test that content progress is tracked correctly"""
        # Create content progress
        progress = ContentProgress.objects.create(
            user=self.regular_user,
            content=self.public_content,
            progress_percentage=50,
            completed=False
        )

        self.assertEqual(progress.progress_percentage, 50)
        self.assertFalse(progress.completed)
        self.assertIsNotNone(progress.last_accessed)

        # Update progress
        progress.progress_percentage = 100
        progress.completed = True
        progress.save()

        updated_progress = ContentProgress.objects.get(id=progress.id)
        self.assertEqual(updated_progress.progress_percentage, 100)
        self.assertTrue(updated_progress.completed) 