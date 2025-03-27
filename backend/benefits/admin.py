# File: backend/benefits/admin.py

from django.contrib import admin
from .models import Benefit, BenefitUsage

class BenefitUsageInline(admin.TabularInline):
    model = BenefitUsage
    extra = 0
    readonly_fields = ('used_at',)
    raw_id_fields = ['user']

@admin.register(Benefit)
class BenefitAdmin(admin.ModelAdmin):
    list_display = ('name', 'membership_level_required', 'is_active')
    list_filter = ('membership_level_required', 'is_active')
    search_fields = ('name', 'description')
    inlines = [BenefitUsageInline]

@admin.register(BenefitUsage)
class BenefitUsageAdmin(admin.ModelAdmin):
    list_display = ('user', 'benefit', 'used_at', 'usage_count')
    list_filter = ('benefit__membership_level_required',)
    search_fields = ('user__email', 'user__username', 'benefit__name', 'notes')
    date_hierarchy = 'used_at'
    raw_id_fields = ['user', 'benefit']
    list_select_related = ['user', 'benefit']