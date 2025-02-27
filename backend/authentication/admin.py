from django.contrib import admin
from .models import User, Profile

# Simple registration
admin.site.register(User)
admin.site.register(Profile)