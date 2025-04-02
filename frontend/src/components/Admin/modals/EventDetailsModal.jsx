import React, { useState, useEffect } from 'react';
import styles from './EventDetailsModal.module.css';
import api from '../../../api';

const EventDetailsModal = ({ event, onClose, onDelete }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [attendees, setAttendees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'attendees') {
      fetchAttendees();
    }
  }, [activeTab, event.id]);

  const fetchAttendees = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`event/events/${event.id}/attendees/`);
      setAttendees(response.data);
    } catch (err) {
      console.error('Error fetching attendees:', err);
      setError('Failed to load attendees. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeAttendee = async (attendanceId) => {
    if (!window.confirm('Are you sure you want to remove this attendee?')) return;
    
    try {
      await api.delete(`event/attendances/${attendanceId}/`);
      // Remove the attendee from the local state
      setAttendees(attendees.filter(a => a.id !== attendanceId));
    } catch (err) {
      console.error('Error removing attendee:', err);
      alert('Failed to remove attendee. Please try again.');
    }
  };

  const checkInAttendee = async (attendanceId) => {
    try {
      await api.patch(`event/attendances/check-in/${attendanceId}/`, {
        attended: true
      });
      
      // Update the attendee in the local state
      setAttendees(attendees.map(a => {
        if (a.id === attendanceId) {
          return { ...a, attended: true, attended_at: new Date().toISOString() };
        }
        return a;
      }));
      
    } catch (err) {
      console.error('Error checking in attendee:', err);
      alert('Failed to check in attendee. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
    }).format(date);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(date);
  };

  const formatMembershipTypes = (types) => {
    if (!types) return 'None';
    
    // If types is a string with comma-separated values
    if (typeof types === 'string') {
      return types.split(',').map(type => {
        switch(type.trim()) {
          case 'community': return 'Community Members';
          case 'creative_workspace': return 'Creative Workspace Members';
          case 'key_access': return 'Key Access Members';
          default: return type.trim();
        }
      }).join(', ');
    }
    
    return 'Unknown';
  };

  const formatCost = (cost) => {
    if (cost === 0 || cost === '0') return 'Free';
    return `$${parseFloat(cost).toFixed(2)}`;
  };

  const formatLocation = (location) => {
    if (!location) return 'Not specified';
    
    switch(location) {
      case 'main_hall': return 'Main Hall';
      case 'workshop_room': return 'Workshop Room';
      case 'conference_room': return 'Conference Room';
      default: return location;
    }
  };

  const formatEventType = (type) => {
    if (!type) return 'Not specified';
    
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const renderDetailsTab = () => (
    <div className={styles.eventDetails}>
      <div className={styles.detailGroup}>
        <h3>Title</h3>
        <p>{event.title}</p>
      </div>

      <div className={styles.detailGroup}>
        <h3>Description</h3>
        <p className={styles.description}>{event.description}</p>
      </div>

      <div className={styles.detailRow}>
        <div className={styles.detailGroup}>
          <h3>Event Type</h3>
          <p>{formatEventType(event.event_type)}</p>
        </div>

        <div className={styles.detailGroup}>
          <h3>Location</h3>
          <p>{formatLocation(event.location)}</p>
        </div>
      </div>

      <div className={styles.detailRow}>
        <div className={styles.detailGroup}>
          <h3>Date</h3>
          <p>{formatDate(event.event_date || event.date)}</p>
        </div>

        <div className={styles.detailGroup}>
          <h3>Time</h3>
          <p>
            {event.start_time || 'Not specified'}
            {event.end_time ? ` - ${event.end_time}` : ''}
          </p>
        </div>
      </div>

      <div className={styles.detailRow}>
        <div className={styles.detailGroup}>
          <h3>Capacity</h3>
          <p>{event.capacity || 'Unlimited'} attendees</p>
        </div>

        <div className={styles.detailGroup}>
          <h3>Cost</h3>
          <p>{formatCost(event.cost)}</p>
        </div>
      </div>

      <div className={styles.detailGroup}>
        <h3>Eligible Membership Types</h3>
        <p>{formatMembershipTypes(event.eligible_membership_types)}</p>
      </div>

      <div className={styles.detailGroup}>
        <h3>Public Event</h3>
        <p>{event.is_public ? 'Yes - Open to non-members' : 'No - Members only'}</p>
      </div>

      <div className={styles.detailRow}>
        <div className={styles.detailGroup}>
          <h3>Registration Opens</h3>
          <p>{event.registration_opens ? formatDateTime(event.registration_opens) : 'Not specified'}</p>
        </div>

        <div className={styles.detailGroup}>
          <h3>Registration Closes</h3>
          <p>{event.registration_closes ? formatDateTime(event.registration_closes) : 'Not specified'}</p>
        </div>
      </div>

      {event.registeredCount !== undefined && (
        <div className={styles.detailGroup}>
          <h3>Registration Status</h3>
          <div className={styles.registrationStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Registered</span>
              <span className={styles.statValue}>{event.registeredCount || 0}</span>
            </div>
            {event.capacity && (
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Available Spots</span>
                <span className={styles.statValue}>
                  {event.capacity - (event.registeredCount || 0)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderAttendeesTab = () => (
    <div className={styles.attendeesTab}>
      <div className={styles.attendeesHeader}>
        <h3>Attendees ({attendees.length}/{event.capacity || '∞'})</h3>
      </div>

      {isLoading ? (
        <div className={styles.loadingIndicator}>Loading attendees...</div>
      ) : error ? (
        <div className={styles.errorMessage}>{error}</div>
      ) : attendees.length === 0 ? (
        <div className={styles.noAttendees}>No registered attendees yet.</div>
      ) : (
        <div className={styles.attendeesTable}>
          <div className={styles.tableHeader}>
            <div className={styles.headerCell}>Name</div>
            <div className={styles.headerCell}>Email</div>
            <div className={styles.headerCell}>Member Type</div>
            <div className={styles.headerCell}>Status</div>
            <div className={styles.headerCell}>Actions</div>
          </div>
          
          {attendees.map(attendance => (
            <div key={attendance.id} className={styles.tableRow}>
              <div className={styles.tableCell}>
                {attendance.user.full_name || attendance.user.username}
              </div>
              <div className={styles.tableCell}>{attendance.user.email}</div>
              <div className={styles.tableCell}>
                {attendance.user.membership_type ? 
                  formatMembershipTypes(attendance.user.membership_type) : 
                  'Non-member'}
              </div>
              <div className={styles.tableCell}>
                <span className={`${styles.status} ${attendance.attended ? styles.attended : styles.confirmed}`}>
                  {attendance.attended ? 'Attended' : 'Confirmed'}
                </span>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.actionButtons}>
                  {!attendance.attended && (
                    <button
                      className={styles.checkInButton}
                      onClick={() => checkInAttendee(attendance.id)}
                    >
                      Check In
                    </button>
                  )}
                  <button
                    className={styles.removeButton}
                    onClick={() => removeAttendee(attendance.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Edit Event: {event.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'details' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'attendees' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('attendees')}
            >
              Attendees
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'details' && renderDetailsTab()}
            {activeTab === 'attendees' && renderAttendeesTab()}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.actionButtons}>
            {onDelete && (
              <button 
                className={styles.deleteButton} 
                onClick={() => onDelete(event.id)}
              >
                Delete Event
              </button>
            )}
            <button 
              className={styles.editButton}
              onClick={() => onClose('edit')}
            >
              Edit Event
            </button>
          </div>
          <button className={styles.closeButton} onClick={() => onClose()}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal; 