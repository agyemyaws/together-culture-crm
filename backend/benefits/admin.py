from django.contrib import admin
from django.utils.html import format_html
from .models import Benefit, UserBenefit, BenefitUsageLog

@admin.register(Benefit)
class BenefitAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'membership_group', 'is_active', 'requires_activation', 'usage_count']
    list_filter = ['category', 'membership_group', 'is_active', 'requires_activation']
    search_fields = ['name', 'description']
    actions = ['mark_active', 'mark_inactive']
    
    def usage_count(self, obj):
        return BenefitUsageLog.objects.filter(user_benefit__benefit=obj).count()
    
    usage_count.short_description = 'Usage Count'
    
    def mark_active(self, request, queryset):
        queryset.update(is_active=True)
    mark_active.short_description = "Mark selected benefits as active"
    
    def mark_inactive(self, request, queryset):
        queryset.update(is_active=False)
    mark_inactive.short_description = "Mark selected benefits as inactive"

class BenefitUsageLogInline(admin.TabularInline):
    model = BenefitUsageLog
    extra = 0
    readonly_fields = ['timestamp', 'logged_by']
    fields = ['timestamp', 'notes', 'logged_by']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return True
    
    def has_change_permission(self, request, obj=None):
        return False

@admin.register(UserBenefit)
class UserBenefitAdmin(admin.ModelAdmin):
    list_display = ['user', 'benefit', 'benefit_membership_group', 'is_active', 'activated_on', 'expires_on', 'usage_count', 'log_usage_link']
    list_filter = ['is_active', 'benefit__membership_group', 'benefit__category']
    search_fields = ['user__username', 'user__email', 'benefit__name']
    inlines = [BenefitUsageLogInline]
    actions = ['log_usage_for_selected']
    
    def benefit_membership_group(self, obj):
        return obj.benefit.get_membership_group_display()
    
    benefit_membership_group.short_description = 'Membership Group'
    
    def usage_count(self, obj):
        return BenefitUsageLog.objects.filter(user_benefit=obj).count()
    
    usage_count.short_description = 'Usage Count'
    
    def log_usage_link(self, obj):
        if obj.is_active:
            return format_html(
                '<a class="button" href="{}">Log Usage</a>',
                f'/admin/benefits/benefitusagelog/add/?user_benefit={obj.id}'
            )
        return "Not active"
    
    log_usage_link.short_description = 'Log Usage'
    
    def log_usage_for_selected(self, request, queryset):
        for user_benefit in queryset.filter(is_active=True):
            BenefitUsageLog.objects.create(
                user_benefit=user_benefit,
                notes=f"Usage logged via admin action by {request.user.username}",
                logged_by=request.user
            )
        self.message_user(request, f"Usage logged for {queryset.filter(is_active=True).count()} active benefits")
    
    log_usage_for_selected.short_description = "Log usage for selected benefits"

@admin.register(BenefitUsageLog)
class BenefitUsageLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_display', 'benefit_display', 'timestamp', 'logged_by_display']
    list_filter = ['timestamp', 'user_benefit__benefit__category', 'user_benefit__benefit__membership_group']
    search_fields = ['user_benefit__user__username', 'user_benefit__user__email', 'user_benefit__benefit__name', 'notes']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    def user_display(self, obj):
        return obj.user_benefit.user.username
    user_display.short_description = 'User'
    
    def benefit_display(self, obj):
        return obj.user_benefit.benefit.name
    benefit_display.short_description = 'Benefit'
    
    def logged_by_display(self, obj):
        if obj.logged_by:
            return obj.logged_by.username
        return 'System'
    logged_by_display.short_description = 'Logged By'