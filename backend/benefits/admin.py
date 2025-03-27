from django.contrib import admin
from .models import Benefit, UserBenefit

@admin.register(Benefit)
class BenefitAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'value', 'is_active', 'requires_activation']
    list_filter = ['category', 'is_active', 'requires_activation']
    search_fields = ['name', 'description']

@admin.register(UserBenefit)
class UserBenefitAdmin(admin.ModelAdmin):
    list_display = ['user', 'benefit', 'is_active', 'activated_on', 'expires_on', 'usage_count']
    list_filter = ['is_active']
    search_fields = ['user__username', 'benefit__name']