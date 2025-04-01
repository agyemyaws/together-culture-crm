import styles from "./EventDetailsModal.module.css";

const EventConfirmation = ({ ticketData, onClose }) => {
  const handleSaveTicket = () => {
    // Logic to save/download ticket
    console.log("Saving ticket:", ticketData.ticketNumber);
    alert("Ticket saved successfully!");
  };
  
  const handleAddToCalendar = () => {
    // Logic to add to calendar - would generate ICS file in real app
    console.log("Adding to calendar:", ticketData.event.title);
    alert("Event added to calendar");
  };
  
  // Format date for display
  const formatEventDate = () => {
    if (ticketData.event.event_date) {
      return new Date(ticketData.event.event_date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Fallback for sample data
    return ticketData.event.date || 'Date TBD';
  };
  
  // Format time for display
  const formatEventTime = () => {
    return ticketData.event.start_time || ticketData.event.time || 'Time TBD';
  };
  
  return (
    <>
      <button className={styles.closeButton} onClick={onClose}>×</button>
      
      <div className={styles.confirmationContainer}>
        <div className={styles.confirmationHeader}>
          <div className={styles.confirmationIcon}>✓</div>
          <h2 className={styles.confirmationTitle}>You're confirmed!</h2>
          <p className={styles.confirmationSubtitle}>
            {ticketData.public ? 
              'Registration details have been sent to your email' : 
              'Save your ticket for easy check-in'
            }
          </p>
        </div>
        
        <div className={styles.ticketContainer}>
          <div className={styles.ticketLeftBar}></div>
          
          <div className={styles.ticketContent}>
            <div className={styles.organizationName}>Together Culture</div>
            <div className={styles.ticketNumber}>{ticketData.ticketNumber}</div>
            
            <h3 className={styles.ticketEventTitle}>
              {ticketData.event.title}
            </h3>
            
            <div className={styles.ticketDetails}>
              <div className={styles.ticketDetail}>
                <div className={styles.detailLabel}>Date & Time</div>
                <div className={styles.detailValue}>
                  {formatEventDate()}, {formatEventTime()}
                </div>
              </div>
              
              <div className={styles.ticketDetail}>
                <div className={styles.detailLabel}>Location</div>
                <div className={styles.detailValue}>
                  {ticketData.event.location || 'Location TBD'}
                </div>
              </div>
              
              <div className={styles.ticketDetail}>
                <div className={styles.detailLabel}>
                  {ticketData.public ? 'Email' : 'Member'}
                </div>
                <div className={styles.detailValue}>
                  {ticketData.public ? ticketData.email : 'Your Account'}
                </div>
              </div>
            </div>
            
            <div className={styles.qrCodeContainer}>
              <div className={styles.qrCode}>
                {/* This would be an actual QR code in production */}
                <div className={styles.placeholderQR}>
                  QR Code
                </div>
              </div>
              <div className={styles.qrCodeText}>
                {ticketData.public ? 
                  'Present this ticket at check-in' : 
                  'Scan at check-in'
                }
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.ticketActions}>
          <button 
            className={styles.saveTicketButton}
            onClick={handleSaveTicket}
          >
            <span className={styles.downloadIcon}>↓</span> Save Ticket
          </button>
        </div>
        
        {ticketData.public && (
          <div className={styles.publicRegistrationNote}>
            <p>
              A confirmation email has been sent to your email address. You'll need to present this
              ticket at the event. No account is needed to attend.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default EventConfirmation;