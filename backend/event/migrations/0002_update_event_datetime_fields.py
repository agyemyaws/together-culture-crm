from django.db import migrations, models
from django.utils import timezone


def split_datetime_fields(apps, schema_editor):
    Event = apps.get_model('event', 'Event')
    for event in Event.objects.all():
        # Split start_date into event_date and start_time
        if event.start_date:
            event.event_date = event.start_date.date()
            event.start_time = event.start_date.time()
            
            # If end_date exists, set end_time
            if event.end_date:
                event.end_time = event.end_date.time()
            
            event.save()


def combine_datetime_fields(apps, schema_editor):
    Event = apps.get_model('event', 'Event')
    for event in Event.objects.all():
        if event.event_date and event.start_time:
            event.start_date = timezone.make_aware(
                timezone.datetime.combine(event.event_date, event.start_time)
            )
            if event.end_time:
                event.end_date = timezone.make_aware(
                    timezone.datetime.combine(event.event_date, event.end_time)
                )
            event.save()


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0001_initial'),
    ]

    operations = [
        # Add new fields
        migrations.AddField(
            model_name='event',
            name='event_date',
            field=models.DateField(null=True),
        ),
        migrations.AddField(
            model_name='event',
            name='start_time',
            field=models.TimeField(null=True),
        ),
        migrations.AddField(
            model_name='event',
            name='end_time',
            field=models.TimeField(blank=True, null=True),
        ),
        
        # Data migration
        migrations.RunPython(
            split_datetime_fields,
            combine_datetime_fields
        ),
        
        # Make new fields required
        migrations.AlterField(
            model_name='event',
            name='event_date',
            field=models.DateField(),
        ),
        migrations.AlterField(
            model_name='event',
            name='start_time',
            field=models.TimeField(),
        ),
        
        # Remove old fields
        migrations.RemoveField(
            model_name='event',
            name='start_date',
        ),
        migrations.RemoveField(
            model_name='event',
            name='end_date',
        ),
    ] 