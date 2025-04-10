import React, { useState, useEffect } from 'react';
import styles from './EventManagement.module.css';
import CreateEventModal from './modals/CreateEventModal';
import EventDetailsModal from './modals/EventDetailsModal';
import api from '../../api';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching events...');
      const response = await api.get('event/events/');
      console.log('Events response:', response.data);
      setEvents(response.data);
    } catch (err) {
      console.error('Error fetching events:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        'Failed to fetch events. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      console.log(isEditMode ? 'Updating event:' : 'Creating new event:', eventData);
      
      // Clone the data to track any changes
      const dataToSend = {...eventData};
      
      // Force is_public to be a boolean (true) if it's not already
      if (eventData.is_public) {
        dataToSend.is_public = true;
      }
      
      let response;
      
      if (isEditMode && selectedEvent) {
        // Update existing event
        response = await api.put(`event/events/${selectedEvent.id}/`, dataToSend);
        setEvents(events.map(event => 
          event.id === selectedEvent.id ? response.data : event
        ));
      } else {
        // Create new event
        response = await api.post('event/events/', dataToSend);
        setEvents([...events, response.data]);
      }
      
      // Reset state
      setShowCreateModal(false);
      setIsEditMode(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error(isEditMode ? 'Error updating event:' : 'Error creating event:', err);
      console.error('Error response:', err.response?.data);
      
      // Show more detailed error message
      let errorMessage = isEditMode ? 'Failed to update event. Please try again.' : 'Failed to create event. Please try again.';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          // Create a more detailed error message from all fields
          errorMessage = Object.entries(err.response.data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.delete(`event/events/${eventId}/`);
        setEvents(events.filter(event => event.id !== eventId));
        setShowDetailsModal(false);
        setSelectedEvent(null);
      } catch (err) {
        console.error('Error deleting event:', err);
        console.error('Error response:', err.response?.data);
        alert(
          err.response?.data?.detail || 
          err.response?.data?.message || 
          'Failed to delete event. Please try again.'
        );
      }
    }
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = (action) => {
    setShowDetailsModal(false);
    
    if (action === 'edit' && selectedEvent) {
      setIsEditMode(true);
      setShowCreateModal(true);
      // Keep selectedEvent set for the edit form
    } else {
      setSelectedEvent(null);
    }
  };

  const handleCreateButtonClick = () => {
    setSelectedEvent(null);
    setIsEditMode(false);
    setShowCreateModal(true);
  };

  if (loading) {
    return <div className={styles.loadingIndicator}>Loading events...</div>;
  }

  if (error) {
    return (
      <div className={styles.errorMessage}>
        <p>{error}</p>
        <button 
          onClick={fetchEvents}
          className={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Event Management</h2>
        <button 
          className={styles.createButton}
          onClick={handleCreateButtonClick}
        >
          Create New Event
        </button>
      </div>

      <div className={styles.eventsList}>
        {events.length === 0 ? (
          <div className={styles.noEvents}>
            <p>No events found. Create your first event!</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className={styles.eventCard}>
              <div className={styles.eventInfo}>
                <h3>{event.title}</h3>
                <div className={styles.eventMeta}>
                  <span className={styles.eventDate}>
                    {new Date(event.event_date || event.date).toLocaleDateString()}
                  </span>
                  <span className={styles.eventTime}>
                    {event.start_time || 'Time not specified'}
                  </span>
                  <span className={styles.eventType}>
                    {event.event_type?.charAt(0).toUpperCase() + event.event_type?.slice(1) || 'Event'}
                  </span>
                </div>
                <p className={styles.eventDescription}>
                  {event.description.length > 100 
                    ? `${event.description.substring(0, 100)}...` 
                    : event.description}
                </p>
              </div>
              <div className={styles.eventActions}>
                <button
                  className={styles.viewButton}
                  onClick={() => handleViewDetails(event)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateEventModal
          onClose={() => {
            setShowCreateModal(false);
            setIsEditMode(false);
            setSelectedEvent(null);
          }}
          onSubmit={handleCreateEvent}
          event={isEditMode ? selectedEvent : null}
          isEditMode={isEditMode}
        />
      )}

      {showDetailsModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={handleCloseDetailsModal}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
};

export default EventManagement; 