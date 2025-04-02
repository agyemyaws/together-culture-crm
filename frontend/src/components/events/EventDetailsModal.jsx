import { useState, useEffect } from "react";
import styles from "./EventDetailsModal.module.css";
import EventConfirmation from "./EventConfirmation";
import api from "../../api";
import axios from "axios";

const EventDetailsModal = ({ event, onClose, onRegister, isRegistered, membershipLevel }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [registrationError, setRegistrationError] = useState(null);
  
  // Public registration form state
  const [showPublicForm, setShowPublicForm] = useState(false);
  const [publicFormData, setPublicFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  
  // Determine if registration is currently open
  const isRegistrationOpen = () => {
    if (!event.registration_open && !event.registration_close) {
      return true; // If no dates specified, assume registration is open
    }
    
    const now = new Date();
    const startDate = event.registration_open ? new Date(event.registration_open) : null;
    const endDate = event.registration_close ? new Date(event.registration_close) : null;
    
    if (startDate && now < startDate) {
      return false; // Registration not started yet
    }
    
    if (endDate && now > endDate) {
      return false; // Registration already ended
    }
    
    return true; // Within registration period
  };
  
  // Get registration status message
  const getRegistrationStatusMessage = () => {
    if (!event.registration_open && !event.registration_close) {
      return null;
    }
    
    const now = new Date();
    const startDate = event.registration_open ? new Date(event.registration_open) : null;
    const endDate = event.registration_close ? new Date(event.registration_close) : null;
    
    if (startDate && now < startDate) {
      return `Registration opens on ${formatDate(event.registration_open, true)}`;
    }
    
    if (endDate && now > endDate) {
      return `Registration closed on ${formatDate(event.registration_close, true)}`;
    }
    
    if (startDate && endDate) {
      return `Registration period: ${formatDate(event.registration_open, true)} - ${formatDate(event.registration_close, true)}`;
    }
    
    if (startDate) {
      return `Registration opened on ${formatDate(event.registration_open, true)}`;
    }
    
    if (endDate) {
      return `Registration closes on ${formatDate(event.registration_close, true)}`;
    }
    
    return null;
  };
  
  useEffect(() => {
    // Add event listener to close on escape key
    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEscKey);
    
    // Prevent scrolling on background
    document.body.style.overflow = "hidden";
    
    // Log event details for debugging
    console.log('Event details in modal:', event);
    console.log('User membership level:', membershipLevel);
    console.log('Event eligible membership types:', event.eligible_membership_types);
    
    return () => {
      // Clean up event listener and restore scrolling
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "auto";
    };
  }, [onClose, event, membershipLevel]);
  
  const handleOverlayClick = (e) => {
    // Close modal when clicking on the overlay (outside the content)
    if (e.target.className === styles.modalOverlay) {
      onClose();
    }
  };
  
  const handleRegister = async () => {
    if (!isRegistrationOpen()) {
      setRegistrationError("Registration is not currently open for this event");
      return;
    }
    
    // If user isn't logged in and event is public, show public registration form
    if (!membershipLevel && event.is_public) {
      setShowPublicForm(true);
      return;
    }
    
    // Start registration process
    setIsRegistering(true);
    setRegistrationError(null);
    
    try {
      console.log(`Attempting to register for event ID: ${event.id}`);
      console.log('Event details:', event);
      console.log('User membership level:', membershipLevel);
      
      // Call the registration API
      const success = await onRegister(event.id);
      console.log(`Registration result: ${success ? 'Success' : 'Failed'}`);
      
      if (success) {
        const ticket = {
          ticketNumber: `#${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          eventId: event.id,
          event: event
        };
        
        setTicketData(ticket);
        setRegistrationComplete(true);
      } else {
        setRegistrationError("Registration failed. Please try again or contact support if the issue persists.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      // Show more detailed error messages
      let errorMessage = "An error occurred during registration. Please try again.";
      
      if (err.response) {
        console.error("Error response status:", err.response.status);
        console.error("Error response data:", JSON.stringify(err.response.data));
        
        if (err.response.data) {
          if (typeof err.response.data === 'object') {
            if (err.response.data.error) {
              // If there's a specific error message from the server, use it
              errorMessage = err.response.data.error;
            } else {
              // Create a formatted error message from all fields
              errorMessage = Object.entries(err.response.data)
                .map(([key, value]) => {
                  if (Array.isArray(value)) {
                    return `${key}: ${value.join(', ')}`;
                  }
                  return `${key}: ${value}`;
                })
                .join('\n');
            }
          } else if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          }
        }
      }
      
      setRegistrationError(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Handle change in public registration form
  const handlePublicFormChange = (e) => {
    const { name, value } = e.target;
    setPublicFormData({
      ...publicFormData,
      [name]: value
    });
  };
  
  // Submit public registration
  const handlePublicRegistration = async (e) => {
    e.preventDefault();
    setIsRegistering(true);
    setRegistrationError(null);
    
    // Registration data to send
    const registrationData = {
      event_id: event.id,
      ...publicFormData
    };
    
    console.log("Sending public registration data:", registrationData);
    
    try {
      // Try a direct XMLHttpRequest to avoid any possible CORS issues
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${import.meta.env.VITE_API_URL}/event/public-registration/`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.withCredentials = false; // Explicitly disable credentials
      
      // Create a promise to handle the XHR
      const response = await new Promise((resolve, reject) => {
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve({
                ok: true,
                status: xhr.status,
                data: JSON.parse(xhr.responseText)
              });
            } catch (e) {
              reject(new Error("Invalid JSON response"));
            }
          } else {
            try {
              reject({
                ok: false,
                status: xhr.status,
                data: JSON.parse(xhr.responseText)
              });
            } catch (e) {
              reject({
                ok: false,
                status: xhr.status,
                data: { error: "Unknown error occurred" }
              });
            }
          }
        };
        
        xhr.onerror = function() {
          reject({
            ok: false,
            status: 0,
            data: { error: "Network error occurred" }
          });
        };
        
        xhr.send(JSON.stringify(registrationData));
      });
      
      // If we get here, the request was successful
      console.log("Public registration successful:", response.data);
      
      const ticket = {
        ticketNumber: response.data.ticket_number,
        eventId: event.id,
        event: event,
        public: true,
        email: publicFormData.email
      };
      
      setTicketData(ticket);
      setRegistrationComplete(true);
    } catch (err) {
      console.error("Public registration failed:", err);
      
      // Handle different error formats
      let errorMessage = "Failed to register for this event. Please try again.";
      
      if (err.data) {
        if (err.data.error) {
          errorMessage = err.data.error;
        }
        if (err.data.details) {
          errorMessage += err.data.details ? `: ${err.data.details}` : '';
        }
      }
      
      setRegistrationError(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    
    const options = { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    };
    
    if (includeTime) {
      options.hour = 'numeric';
      options.minute = 'numeric';
      options.hour12 = true;
    }
    
    return date.toLocaleDateString('en-US', options);
  };
  
  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        {!registrationComplete ? (
          // Event Details View
          <>
            <button className={styles.closeButton} onClick={onClose}>×</button>
            
            <h2 className={styles.eventTitle}>{event.title}</h2>
            
            <div className={styles.eventMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}>📅</span>
                <span className={styles.metaText}>
                  {formatDate(event.event_date || event.date)}
                </span>
              </div>
              
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}>🕒</span>
                <span className={styles.metaText}>
                  {event.start_time || 'Time TBD'}
                  {event.end_time && ` - ${event.end_time}`}
                </span>
              </div>
              
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}>📍</span>
                <span className={styles.metaText}>{event.location || 'Location TBD'}</span>
              </div>
              
              {event.capacity && (
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}>👥</span>
                <span className={styles.metaText}>
                    {event.registered_count || 0}/{event.capacity} registered
                </span>
              </div>
              )}
              
              {event.event_type && (
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>🏷️</span>
                  <span className={styles.metaText}>{event.event_type}</span>
                </div>
              )}
            </div>
            
            <div className={styles.detailsSection}>
              <h3 className={styles.sectionTitle}>Event Description</h3>
              <p className={styles.detailsText}>{event.description}</p>
            </div>
            
            {event.requirements && (
            <div className={styles.itemsSection}>
              <h3 className={styles.sectionTitle}>What to bring:</h3>
                <div className={styles.requirements}>
                  {event.requirements}
                </div>
            </div>
            )}
            
            {/* Public Registration Form */}
            {showPublicForm ? (
              <div className={styles.publicRegistrationForm}>
                <h3 className={styles.sectionTitle}>Register for This Event</h3>
                <form onSubmit={handlePublicRegistration}>
                  <div className={styles.formGroup}>
                    <label htmlFor="full_name">Full Name *</label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={publicFormData.full_name}
                      onChange={handlePublicFormChange}
                      required
                      className={styles.formInput}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={publicFormData.email}
                      onChange={handlePublicFormChange}
                      required
                      className={styles.formInput}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Phone Number (optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={publicFormData.phone}
                      onChange={handlePublicFormChange}
                      className={styles.formInput}
                    />
                  </div>
                  
                  {registrationError && (
                    <div className={styles.errorMessage}>
                      {registrationError}
                    </div>
                  )}
                  
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => setShowPublicForm(false)}
                    >
                      Cancel
                    </button>
              <button 
                      type="submit"
                      className={styles.submitButton}
                disabled={isRegistering}
                    >
                      {isRegistering ? 'Registering...' : 'Complete Registration'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className={styles.availabilitySection}>
                {registrationError && (
                  <div className={styles.errorMessage}>
                    {registrationError}
                  </div>
                )}
                
                {!isRegistered ? (
                  <button 
                    className={`${styles.registerButton} 
                      ${!isRegistrationOpen() ? styles.disabledButton : ''}`}
                    onClick={handleRegister}
                    disabled={isRegistering || !isRegistrationOpen()}
              >
                {isRegistering ? (
                  <>
                    <span className={styles.spinner}></span>
                    <span>Confirming...</span>
                  </>
                ) : (
                      !isRegistrationOpen() ? "Registration Closed" : 
                      "Confirm Registration"
                    )}
                  </button>
                ) : (
                  <div className={styles.alreadyRegistered}>
                    <span className={styles.checkIcon}>✓</span>
                    <span>You're registered for this event</span>
                  </div>
                )}
            </div>
            )}
          </>
        ) : (
          // Registration Confirmation View
          <EventConfirmation 
            ticketData={ticketData} 
            onClose={onClose} 
          />
        )}
      </div>
    </div>
  );
};

export default EventDetailsModal;