import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./EventDetailPage.module.css";
import axios from "axios";
import api from "../api";
import { useUser } from "../context/UserContext";

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // For logged-in users, try to fetch the actual event data
      if (user) {
        try {
          const authResponse = await api.get(`event/events/${eventId}/`);
          setEvent(authResponse.data);
          console.log("Fetched event with auth:", authResponse.data);
          
          // Check registration status
          const registrationsResponse = await api.get("event/attendances/my-events/");
          if (registrationsResponse.data.registered_event_ids && 
              registrationsResponse.data.registered_event_ids.includes(parseInt(eventId))) {
            setIsRegistered(true);
          }
        } catch (authErr) {
          console.error("Error fetching event data:", authErr);
          setError("This event is not available for viewing.");
        }
      } else {
        // For non-authenticated users, use the public detail endpoint
        try {
          // Use direct axios to avoid token injection attempts
          const publicResponse = await axios.get(`${import.meta.env.VITE_API_URL}/event/events/${eventId}/public_detail/`);
          console.log("Fetched public event details:", publicResponse.data);
          setEvent(publicResponse.data);
        } catch (publicErr) {
          console.error("Error fetching public event details:", publicErr);
          
          // If we get a 404, either the event doesn't exist or isn't public
          if (publicErr.response?.status === 404) {
            // Try to use mock data as fallback for development purposes
            console.error("Public event not found, checking mock data");
            const mockEvents = [
              {
                id: 1,
                title: "Creative Workshop",
                event_type: "Workshop",
                description: "Learn about sustainable practices in the creative industry",
                date: "2025-02-15",
                event_date: "2025-02-15",
                start_time: "14:00",
                end_time: "16:00",
                location: "Main Space",
                capacity: 30,
                registered_count: 12,
                image: "/images/pexels-shkrabaanthony-4348401.jpg",
                is_public: true
              },
              {
                id: 2,
                title: "Community Open Day",
                event_type: "Open Day",
                description: "Experience our vibrant community and creative spaces",
                date: "2025-02-20",
                event_date: "2025-02-20",
                start_time: "10:00",
                end_time: "18:00",
                location: "Community Hall",
                capacity: 50,
                registered_count: 22,
                image: "/images/pexels-bertellifotografia-3321793.jpg",
                is_public: true
              },
              {
                id: 3,
                title: "Digital Art Masterclass",
                event_type: "Masterclass",
                description: "Explore advanced techniques in digital illustration and design",
                date: "2025-03-05",
                event_date: "2025-03-05",
                start_time: "13:00",
                end_time: "15:30",
                location: "Design Studio",
                capacity: 25,
                registered_count: 18,
                image: "/images/pexels-lum3n-44775-398257.jpg",
                is_public: true
              },
            ];
            
            // Find the mock event with the matching ID
            const foundEvent = mockEvents.find(event => event.id === parseInt(eventId));
            
            if (foundEvent) {
              setEvent(foundEvent);
            } else {
              setError("This event is only available to members. Please log in to view.");
            }
          } else {
            setError("This event is only available to members. Please log in to view.");
          }
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Could not load event details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    // If user is not logged in, go to landing page
    if (!user) {
      navigate("/");
    } else {
      // If user is logged in, go to events or dashboard page
      navigate("/events");
    }
  };

  const handleRegister = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      // Attempt registration
      const response = await api.post(`event/register/${eventId}/`, {});
      setIsRegistered(true);
      // Show success message or refresh data as needed
    } catch (err) {
      console.error("Registration error:", err);
      // Handle error appropriately
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return "Time TBD";
    // Handle time formatting
    return timeString;
  };

  if (loading) {
    return <div className={styles.loading}>Loading event details...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={fetchEventDetails}>Retry</button>
        <button onClick={handleBackClick}>Go Back</button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.notFound}>
        <h2>Event Not Found</h2>
        <p>The event you're looking for doesn't exist or has been removed.</p>
        <button onClick={handleBackClick}>Go Back</button>
      </div>
    );
  }

  return (
    <div className={styles.eventDetailContainer}>
      <div className={styles.headerNav}>
        <button className={styles.backButton} onClick={handleBackClick}>
          <span className={styles.backIcon}>←</span> Back
        </button>
      </div>

      <div className={styles.eventContent}>
        <div className={styles.eventHeader}>
          <div className={styles.eventTypeTag}>{event.event_type || "Event"}</div>
          <h1 className={styles.eventTitle}>{event.title}</h1>
        </div>

        {event.image && (
          <div className={styles.eventImageContainer}>
            <img src={event.image} alt={event.title} className={styles.eventImage} />
          </div>
        )}

        <div className={styles.eventDetails}>
          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>📅</div>
            <div className={styles.detailContent}>
              <h3>Date & Time</h3>
              <p>{formatDate(event.event_date || event.date)}</p>
              <p>{formatTime(event.start_time)} - {formatTime(event.end_time)}</p>
            </div>
          </div>

          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>📍</div>
            <div className={styles.detailContent}>
              <h3>Location</h3>
              <p>{event.location || "Location TBD"}</p>
            </div>
          </div>

          {event.capacity && (
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>👥</div>
              <div className={styles.detailContent}>
                <h3>Capacity</h3>
                <p>{event.registered_count || 0}/{event.capacity} registered</p>
              </div>
            </div>
          )}
        </div>

        <div className={styles.eventDescription}>
          <h2>About This Event</h2>
          <p>{event.description}</p>
        </div>

        <div className={styles.registrationSection}>
          {isRegistered ? (
            <div className={styles.alreadyRegistered}>
              <p>You're registered for this event!</p>
              {/* Could add option to unregister here */}
            </div>
          ) : (
            <button 
              className={styles.registerButton}
              onClick={handleRegister}
              disabled={event.is_full}
            >
              {event.is_full ? "Event Full" : "Register for this Event"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage; 