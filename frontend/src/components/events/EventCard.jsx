import styles from "./EventsListing.module.css";

const EventCard = ({ event, onClick }) => {
  const handleRegister = (e) => {
    e.stopPropagation(); // Prevent clicking through to the details view
    onClick(); // Open the details modal
  };
  
  return (
    <div 
      className={styles.eventCard}
      onClick={onClick}
    >
      <div className={styles.eventHeader}>
        <div className={styles.eventTags}>
          <span className={styles.eventTypeTag}>{event.type}</span>
          {event.tags.map((tag, index) => (
            <span key={index} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>
      
      <h3 className={styles.eventTitle}>{event.title}</h3>
      
      <div className={styles.eventDetails}>
        <div className={styles.eventDetail}>
          <span className={styles.detailIcon}>📅</span>
          <span>{event.date}, {event.time}</span>
        </div>
        
        <div className={styles.eventDetail}>
          <span className={styles.detailIcon}>📍</span>
          <span>{event.location}</span>
        </div>
        
        <div className={styles.eventDetail}>
          <span className={styles.detailIcon}>👥</span>
          <span>{event.registered} registered</span>
        </div>
      </div>
      
      <div className={styles.attendeesList}>
        {event.attendees.map((attendee, index) => (
          <div key={index} className={styles.attendeeCircle}>
            {attendee.initial}
          </div>
        ))}
        {event.othersRegistered > 0 && (
          <div className={styles.attendeeCircle}>
            +{event.othersRegistered} others registered
          </div>
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
          Event Details <span className={styles.detailsArrow}>▼</span>
        </button>
        
        <button 
          className={styles.registerButton}
          onClick={handleRegister}
        >
          Register
        </button>
      </div>
    </div>
  );
};

export default EventCard;