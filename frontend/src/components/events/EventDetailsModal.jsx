import { useState, useEffect } from "react";
import styles from "./EventDetailsModal.module.css";
import EventConfirmation from "./EventConfirmation";

const EventDetailsModal = ({ event, onClose }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  
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
    
    return () => {
      // Clean up event listener and restore scrolling
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);
  
  const handleOverlayClick = (e) => {
    // Close modal when clicking on the overlay (outside the content)
    if (e.target.className === styles.modalOverlay) {
      onClose();
    }
  };
  
  const handleRegister = () => {
    // Start registration process
    setIsRegistering(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const ticket = {
        ticketNumber: "#FF62UB07",
        memberName: "Sarah Anderson",
        event: event
      };
      
      setTicketData(ticket);
      setIsRegistering(false);
      setRegistrationComplete(true);
    }, 1500);
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
                <span className={styles.metaText}>{event.date} at {event.time}</span>
              </div>
              
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}>📍</span>
                <span className={styles.metaText}>{event.location}</span>
              </div>
              
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}>👥</span>
                <span className={styles.metaText}>
                  {event.registered.split('/')[0]} members attending
                </span>
              </div>
            </div>
            
            <div className={styles.detailsSection}>
              <h3 className={styles.sectionTitle}>Workshop Details</h3>
              <p className={styles.detailsText}>{event.details}</p>
            </div>
            
            <div className={styles.itemsSection}>
              <h3 className={styles.sectionTitle}>What to bring:</h3>
              <ul className={styles.itemsList}>
                {event.bringItems.map((item, index) => (
                  <li key={index} className={styles.item}>
                    <span className={styles.itemIcon}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className={styles.availabilitySection}>
              <span className={styles.spacesText}>
                Spaces available: {event.spacesAvailable}
              </span>
              
              <button 
                className={styles.registerButton}
                onClick={handleRegister}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <span className={styles.spinner}></span>
                    <span>Confirming...</span>
                  </>
                ) : (
                  "Confirm RSVP"
                )}
              </button>
            </div>
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