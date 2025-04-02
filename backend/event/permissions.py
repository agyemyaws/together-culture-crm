from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow administrators to create/edit/delete events,
    but only allow read access to others.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to admins
        return request.user and request.user.is_staff


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an attendance record or admins to view it
    """

    def has_object_permission(self, request, view, obj):
        # Admin permissions
        if request.user.is_staff:
            return True

        # Owner permissions
        return obj.user == request.user


class CanManageEvent(permissions.BasePermission):
    """
    Custom permission to manage events (create, update, delete)
    Only allows admin users or event creators to manage events
    """

    def has_object_permission(self, request, view, obj):
        # Admin can do everything
        if request.user.is_staff:
            return True

        # Event creator can update/delete their own events
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.created_by == request.user


class CanProvideFeedback(permissions.BasePermission):
    """
    Custom permission to provide event feedback
    Only allows users who have attended the event to provide feedback
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Admin can provide feedback for any event
        if request.user.is_staff:
            return True

        # For POST requests, check if user has attended the event
        if request.method == 'POST':
            event_id = request.data.get('event')
            if not event_id:
                return False
            return request.user.attendances.filter(
                event_id=event_id,
                attended=True
            ).exists()

        return True