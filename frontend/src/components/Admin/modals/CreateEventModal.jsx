import React, { useState, useEffect } from 'react';
import styles from './CreateEventModal.module.css';

const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'exhibition', label: 'Exhibition' },
  { value: 'other', label: 'Other' }
];

const MEMBER_TYPES = [
  { value: 'community', label: 'Community Members' },
  { value: 'creative_workspace', label: 'Creative Workspace Members' },
  { value: 'key_access', label: 'Key Access Members' }
];

const CreateEventModal = ({ onClose, onSubmit, event, isEditMode }) => {
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    // Event Details
    title: '',
    description: '',
    event_type: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',

    // Settings
    capacity: '',
    cost: '',
    eligible_membership_types: ['community', 'creative_workspace', 'key_access'],
    allow_non_members: false,

    // Registration
    registration_opens: '',
    registration_opens_time: '',
    registration_closes: '',
    registration_closes_time: ''
  });

  // Initialize form data with event data if in edit mode
  useEffect(() => {
    if (isEditMode && event) {
      // Format dates for form fields
      const formatEventDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };
      
      // Extract time from datetime string
      const extractTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toTimeString().slice(0, 5); // HH:MM format
      };
      
      // Parse eligible membership types
      let membershipTypes = ['community', 'creative_workspace', 'key_access'];
      if (event.eligible_membership_types) {
        if (typeof event.eligible_membership_types === 'string') {
          membershipTypes = event.eligible_membership_types.split(',');
        } else if (Array.isArray(event.eligible_membership_types)) {
          membershipTypes = event.eligible_membership_types;
        }
      }
      
      // Set form data from event
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || '',
        event_date: formatEventDate(event.event_date || event.date),
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        location: event.location || '',
        capacity: event.capacity?.toString() || '',
        cost: event.cost?.toString() || '',
        eligible_membership_types: membershipTypes,
        allow_non_members: event.is_public || false,
        registration_opens: event.registration_opens ? formatEventDate(event.registration_opens) : '',
        registration_opens_time: event.registration_opens ? extractTime(event.registration_opens) : '',
        registration_closes: event.registration_closes ? formatEventDate(event.registration_closes) : '',
        registration_closes_time: event.registration_closes ? extractTime(event.registration_closes) : ''
      });
    }
  }, [isEditMode, event]);

  const validateForm = () => {
    const newErrors = {};

    // Validate required fields
    if (!formData.title.trim()) newErrors.title = 'Event name is required';
    if (!formData.event_date) newErrors.event_date = 'Event date is required';
    if (!formData.start_time) newErrors.start_time = 'Start time is required';
    if (!formData.event_type) newErrors.event_type = 'Event type is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    // Validate numeric fields only if provided
    if (formData.capacity !== '' && (isNaN(formData.capacity) || parseInt(formData.capacity) < 0)) {
      newErrors.capacity = 'Capacity must be a non-negative number';
    }
    
    if (formData.cost !== '' && (isNaN(formData.cost) || parseFloat(formData.cost) < 0)) {
      newErrors.cost = 'Cost must be a non-negative number';
    }

    // Validate registration dates if provided
    if (formData.registration_opens && formData.event_date) {
      const regOpens = new Date(formData.registration_opens);
      const eventDate = new Date(formData.event_date);
      
      if (regOpens >= eventDate) {
        newErrors.registration_opens = 'Registration must open before the event date';
      }
    }
    
    if (formData.registration_opens && formData.registration_closes) {
      const regOpens = new Date(formData.registration_opens);
      const regCloses = new Date(formData.registration_closes);
      
      if (regCloses <= regOpens) {
        newErrors.registration_closes = 'Registration closing date must be after opening date';
      }
    }
    
    if (formData.registration_closes && formData.event_date) {
      const regCloses = new Date(formData.registration_closes);
      const eventDate = new Date(formData.event_date);
      
      if (regCloses > eventDate) {
        newErrors.registration_closes = 'Registration must close on or before the event date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear error when field is modified
    setErrors(prev => ({ ...prev, [name]: undefined }));

    if (type === 'checkbox') {
      if (name === 'eligible_membership_types') {
        const updatedTypes = formData.eligible_membership_types.includes(value)
          ? formData.eligible_membership_types.filter(type => type !== value)
          : [...formData.eligible_membership_types, value];
        setFormData(prev => ({ ...prev, eligible_membership_types: updatedTypes }));
      } else {
        console.log(`Checkbox ${name} changed to:`, checked);
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        event_date: formData.event_date,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        location: formData.location,
        capacity: parseInt(formData.capacity) || 0,
        cost: parseFloat(formData.cost) || 0,
        eligible_membership_types: formData.eligible_membership_types.join(','),
        is_public: formData.allow_non_members,
        registration_opens: formData.registration_opens 
          ? `${formData.registration_opens}T${formData.registration_opens_time || '00:00'}` 
          : null,
        registration_closes: formData.registration_closes 
          ? `${formData.registration_closes}T${formData.registration_closes_time || '00:00'}` 
          : null
      };
      
      // If in edit mode, include the event ID
      if (isEditMode && event?.id) {
        eventData.id = event.id;
      }
      
      await onSubmit(eventData);
    } catch (error) {
      console.error('Error in form submission:', error);
      setErrors({ submit: isEditMode ? 'Failed to update event. Please try again.' : 'Failed to create event. Please try again.' });
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{isEditMode ? 'Edit Event' : 'Create New Event'}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
          <p className={styles.subtitle}>{isEditMode ? 'Update event information' : 'Enter all event information'}</p>
          {errors.submit && <p className={styles.errorMessage}>{errors.submit}</p>}
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <h3>Event Details</h3>
          <div className={styles.formGroup}>
            <label htmlFor="title">Event Name*</label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="Enter event name"
              value={formData.title}
              onChange={handleChange}
              className={errors.title ? styles.error : ''}
              required
            />
            {errors.title && <span className={styles.errorMessage}>{errors.title}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="event_date">Event Date*</label>
            <input
              type="date"
              id="event_date"
              name="event_date"
              value={formData.event_date}
              onChange={handleChange}
              className={errors.event_date ? styles.error : ''}
              required
            />
            {errors.event_date && <span className={styles.errorMessage}>{errors.event_date}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="start_time">Start Time*</label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className={errors.start_time ? styles.error : ''}
                required
              />
              {errors.start_time && <span className={styles.errorMessage}>{errors.start_time}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="end_time">End Time</label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                min={formData.start_time}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="event_type">Event Type*</label>
            <select
              id="event_type"
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              className={errors.event_type ? styles.error : ''}
              required
            >
              <option value="">Select event type</option>
              {EVENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.event_type && <span className={styles.errorMessage}>{errors.event_type}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="location">Location*</label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={errors.location ? styles.error : ''}
              required
            >
              <option value="">Select location</option>
              <option value="main_hall">Main Hall</option>
              <option value="workshop_room">Workshop Room</option>
              <option value="conference_room">Conference Room</option>
            </select>
            {errors.location && <span className={styles.errorMessage}>{errors.location}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description*</label>
            <textarea
              id="description"
              name="description"
              placeholder="Enter event description"
              value={formData.description}
              onChange={handleChange}
              className={errors.description ? styles.error : ''}
              required
            />
            {errors.description && <span className={styles.errorMessage}>{errors.description}</span>}
          </div>

          <h3>Settings</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="capacity">Capacity</label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                placeholder="Maximum attendees"
                value={formData.capacity}
                onChange={handleChange}
                className={errors.capacity ? styles.error : ''}
                min="0"
              />
              {errors.capacity && <span className={styles.errorMessage}>{errors.capacity}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cost">Cost</label>
              <input
                type="number"
                id="cost"
                name="cost"
                placeholder="Enter cost (if applicable)"
                value={formData.cost}
                onChange={handleChange}
                className={errors.cost ? styles.error : ''}
                min="0"
                step="0.01"
              />
              {errors.cost && <span className={styles.errorMessage}>{errors.cost}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Eligible Member Types</label>
            <div className={styles.checkboxGroup}>
              {MEMBER_TYPES.map(type => (
                <label key={type.value} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    name="eligible_membership_types"
                    value={type.value}
                    checked={formData.eligible_membership_types.includes(type.value)}
                    onChange={handleChange}
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.publicEventCheckbox}>
              <input
                type="checkbox"
                name="allow_non_members"
                checked={formData.allow_non_members}
                onChange={handleChange}
              />
              Allow Non-Members (Public Event)
            </label>
            <p className={styles.fieldHelp}>
              If checked, people without a membership can view and register for this event.
            </p>
          </div>

          <h3>Registration Options</h3>
          <div className={styles.formGroup}>
            <label>Registration Period</label>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="registration_opens">Registration Opens</label>
                <input
                  type="date"
                  id="registration_opens"
                  name="registration_opens"
                  value={formData.registration_opens}
                  onChange={handleChange}
                  className={errors.registration_opens ? styles.error : ''}
                />
                <input
                  type="time"
                  id="registration_opens_time"
                  name="registration_opens_time"
                  value={formData.registration_opens_time || ''}
                  onChange={handleChange}
                  placeholder="Time"
                  className={errors.registration_opens_time ? styles.error : ''}
                />
                {errors.registration_opens && <span className={styles.errorMessage}>{errors.registration_opens}</span>}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="registration_closes">Registration Closes</label>
                <input
                  type="date"
                  id="registration_closes"
                  name="registration_closes"
                  value={formData.registration_closes}
                  onChange={handleChange}
                  className={errors.registration_closes ? styles.error : ''}
                />
                <input
                  type="time"
                  id="registration_closes_time"
                  name="registration_closes_time"
                  value={formData.registration_closes_time || ''}
                  onChange={handleChange}
                  placeholder="Time"
                  className={errors.registration_closes_time ? styles.error : ''}
                />
                {errors.registration_closes && <span className={styles.errorMessage}>{errors.registration_closes}</span>}
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              {isEditMode ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal; 