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
  
  return (
    <>
      <button className={styles.closeButton} onClick={onClose}>×</button>
      
      <div className={styles.confirmationContainer}>
        <div className={styles.confirmationHeader}>
          <div className={styles.confirmationIcon}>✓</div>
          <h2 className={styles.confirmationTitle}>You're confirmed!</h2>
          <p className={styles.confirmationSubtitle}>
            Save your ticket for easy check-in
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
                  {ticketData.event.date}, {ticketData.event.time}
                </div>
              </div>
              
              <div className={styles.ticketDetail}>
                <div className={styles.detailLabel}>Location</div>
                <div className={styles.detailValue}>
                  {ticketData.event.location}
                </div>
              </div>
              
              <div className={styles.ticketDetail}>
                <div className={styles.detailLabel}>Member</div>
                <div className={styles.detailValue}>
                  {ticketData.memberName}
                </div>
              </div>
            </div>
            
            <div className={styles.qrCodeContainer}>
              <div className={styles.qrCode}>
                {/* This would be an actual QR code in production */}
                <div className={styles.placeholderQR}>
                  100 × 100
                </div>
              </div>
              <div className={styles.qrCodeText}>Scan at check-in</div>
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
          
          <button 
            className={styles.calendarButton}
            onClick={handleAddToCalendar}
          >
            <span className={styles.calendarIcon}>📅</span> Add to Calendar
          </button>
        </div>
      </div>
    </>
  );
};

export default EventConfirmation;