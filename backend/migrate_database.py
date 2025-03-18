# File: backend/migrate_database.py

import os
import django
import sys

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.management import call_command
from django.db import connection
from django.db.utils import OperationalError
import pymysql

def setup_database():
    """Setup the MySQL database if it doesn't exist"""
    db_name = os.environ.get('DB_NAME')
    db_user = os.environ.get('DB_USER')
    db_password = os.environ.get('DB_PASSWORD')
    db_host = os.environ.get('DB_HOST')
    db_port = os.environ.get('DB_PORT', 3306)
    
    if not all([db_name, db_user, db_password, db_host]):
        print("Environment variables DB_NAME, DB_USER, DB_PASSWORD, and DB_HOST must be set.")
        sys.exit(1)
    
    # Try to connect to the database
    try:
        # Connect to MySQL without database
        conn = pymysql.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            port=int(db_port)
        )
        
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(f"SHOW DATABASES LIKE '{db_name}';")
        result = cursor.fetchone()
        
        if not result:
            print(f"Database '{db_name}' does not exist. Creating...")
            cursor.execute(f"CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            print(f"Database '{db_name}' created successfully.")
        else:
            print(f"Database '{db_name}' already exists.")
        
        # Grant privileges to user
        cursor.execute(f"GRANT ALL PRIVILEGES ON {db_name}.* TO '{db_user}'@'%';")
        cursor.execute("FLUSH PRIVILEGES;")
        
        print(f"Granted all privileges on {db_name} to {db_user}.")
        
        conn.close()
        return True
    
    except Exception as e:
        print(f"Error connecting to MySQL: {e}")
        return False

def run_migrations():
    """Run Django migrations"""
    try:
        # Check if database is accessible
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            
        print("Running makemigrations...")
        call_command('makemigrations')
        
        print("Running migrate...")
        call_command('migrate')
        
        return True
    except OperationalError as e:
        print(f"Database error: {e}")
        return False

def create_superuser():
    """Create a superuser if none exists"""
    from authentication.models import User
    
    if not User.objects.filter(is_superuser=True).exists():
        username = input("Enter superuser username: ")
        email = input("Enter superuser email: ")
        password = input("Enter superuser password: ")
        
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"Superuser '{username}' created successfully.")
    else:
        print("Superuser already exists.")

def main():
    """Main migration script"""
    print("Setting up Together Culture CRM database...")
    
    # Setup database
    if setup_database():
        # Run migrations
        if run_migrations():
            # Create superuser
            create_superuser()
            print("Database setup completed successfully.")
        else:
            print("Migration failed. Please check your database configuration.")
    else:
        print("Database setup failed. Please check your MySQL installation and credentials.")

if __name__ == "__main__":
    main()