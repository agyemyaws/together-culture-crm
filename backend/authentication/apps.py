from django.apps import AppConfig


class AuthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authentication'
def ready(self):
        print("AuthenticationConfig.ready() called")  # Debug
        import authentication.signals
        print("Signals imported successfully")  # Debug