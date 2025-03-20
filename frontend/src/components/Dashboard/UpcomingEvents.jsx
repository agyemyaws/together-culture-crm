import styles from "./Dashboard.module.css";

const UpcomingEvents = () => {
  const events = [
    {
      id: 1,
      title: "Creative Workshop Series",
      date: "Feb 15, 2024",
      time: "3:00 PM",
      location: "Main Space",
      type: "Workshop",
    },
    {
      id: 2,
      title: "Community Meetup",
      date: "Feb 18, 2024",
      time: "6:00 PM",
      location: "Community Hall",
      type: "Networking",
    },
    {
      id: 3,
      title: "Leadership Development",
      date: "Feb 22, 2024",
      time: "2:00 PM",
      location: "Conference Room",
      type: "Training",
    },
  ];

  // Calendar icon for event items
  const CalendarIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );

  return (
    <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
      <h3 className={styles.sectionTitle}>
        Upcoming Events
        <a href="#" className={styles.viewAllLink}>
          View all →
        </a>
      </h3>

      <div className={styles.eventList}>
        {events.map((event) => (
          <div key={event.id} className={styles.eventItem}>
            <div className={styles.eventIcon}>
              <CalendarIcon />
            </div>
            <div className={styles.eventInfo}>
              <h4 className={styles.eventTitle}>{event.title}</h4>
              <p className={styles.eventMeta}>
                {event.date} at {event.time}
              </p>
              <p className={styles.eventLocation}>{event.location}</p>
              <span className={styles.eventTag}>{event.type}</span>
            </div>
            <button className={styles.eventAction}>Register</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
