from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('authentication.urls')),
    path('event/', include('event.urls')),
    path('content/', include('content.urls')),
    path('api/benefits/', include('benefits.urls')),
    path('community/', include('community.urls')),
]