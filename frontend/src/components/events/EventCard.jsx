import styles from "./EventsListing.module.css";

const EventCard = ({ event, onClick, isRegistered, membershipLevel }) => {
  const handleRegister = (e) => {
    e.stopPropagation(); // Prevent clicking through to the details view
    onClick(); // Open the details modal
  };
  
  // Format date properly
  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  return (
    <div 
      className={styles.eventCard}
      onClick={onClick}
    >
      <div className={styles.eventHeader}>
        <div className={styles.eventTags}>
          <span className={styles.eventTypeTag}>{event.event_type || 'Event'}</span>
          {/* Show registered tag if user is registered */}
          {isRegistered && (
            <span className={styles.registeredTag}>Registered</span>
          )}
        </div>
      </div>
      
      <h3 className={styles.eventTitle}>{event.title}</h3>
      
      <div className={styles.eventDetails}>
        <div className={styles.eventDetail}>
          <span className={styles.detailIcon}>📅</span>
          <span>{formatDate(event.event_date || event.date)}</span>
        </div>
        
        <div className={styles.eventDetail}>
          <span className={styles.detailIcon}>🕒</span>
          <span>{event.start_time || 'Time TBD'}</span>
        </div>
        
        <div className={styles.eventDetail}>
          <span className={styles.detailIcon}>📍</span>
          <span>{event.location || 'Location TBD'}</span>
        </div>
        
        {event.capacity && (
          <div className={styles.eventDetail}>
            <span className={styles.detailIcon}>👥</span>
            <span>
              {event.registered_count || 0}/{event.capacity} registered
            </span>
          </div>
        )}
      </div>
      
      {/* Show description preview */}
      <div className={styles.descriptionPreview}>
        {event.description && (
          <p>
            {event.description.length > 120 
              ? `${event.description.substring(0, 120)}...` 
              : event.description}
          </p>
        )}
      </div>
      
      <div className={styles.eventActions}>
        <button 
          className={styles.detailsButton}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Event Details
        </button>
        
        <button 
          className={`${styles.registerButton} ${isRegistered ? styles.registeredButton : ''}`}
          onClick={handleRegister}
          disabled={isRegistered}
        >
          {isRegistered ? 'Registered' : 'Register'}
        </button>
      </div>
    </div>
  );
};

export default EventCard;