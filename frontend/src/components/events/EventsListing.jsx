import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./EventsListing.module.css";
import EventCard from "./EventCard";
import EventDetailsModal from "./EventDetailsModal";
import api from "../../api";
import axios from "axios";
import { useUser } from "../../context/UserContext";

const EventsListing = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState({});
  const navigate = useNavigate();
  
  // Get user data from context
  const { user } = useUser();
  
  // Event types and locations for filters - will be populated from API data
  const [eventTypes, setEventTypes] = useState(["All"]);
  const [locations, setLocations] = useState(["All"]);
  
  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching events...');
      
      let response;
      
      if (user) {
        // Authenticated user - use api instance with token
        try {
          response = await api.get('event/events/');
          console.log('Events response (authenticated):', response.data);
          
          // Check registration status
          console.log('Current user:', user);
          console.log('User membership level:', user.membership);
          
          const userEventIds = await fetchUserRegistrations();
          const statusMap = {};
          userEventIds.forEach(eventId => {
            statusMap[eventId] = true;
          });
          setRegistrationStatus(statusMap);
          
          // Filter events based on user's membership level
          let accessibleEvents = [...response.data];
          console.log('All events before filtering:', accessibleEvents);
          
          if (user.membership === 'community') {
            // Community members can only see public events
            accessibleEvents = accessibleEvents.filter(event => event.is_public);
            console.log('Filtered to public events for community member:', accessibleEvents);
          } else if (user.membership === 'key_access') {
            // Key access members can see public events and key_access events
            accessibleEvents = accessibleEvents.filter(event => 
              event.is_public || 
              event.membership_required === 'key_access'
            );
            console.log('Filtered events for key_access member:', accessibleEvents);
          } else if (user.membership === 'creative_workspace') {
            // Creative workspace members can see all events
            console.log('Creative workspace member can see all events');
          } else if (user.isAdmin) {
            // Admins can see all events
            console.log('Admin can see all events');
          } else {
            console.log('Unknown membership type:', user.membership);
          }
          
          console.log('Final accessible events:', accessibleEvents);
          
          // Extract types and locations for filters
          const types = ['All', ...new Set(accessibleEvents.map(event => event.event_type).filter(Boolean))];
          const locs = ['All', ...new Set(accessibleEvents.map(event => event.location).filter(Boolean))];
          setEventTypes(types);
          setLocations(locs);
          
          setEvents(accessibleEvents);
          setFilteredEvents(accessibleEvents);
        } catch (err) {
          console.error('Error fetching events for authenticated user:', err);
          setError('Failed to load events. Please try again later.');
        }
      } else {
        // Non-authenticated user - use the public events endpoint
        try {
          // Use direct axios instance to avoid token injection
          const publicResponse = await axios.get(`${import.meta.env.VITE_API_URL}/event/events/public/`);
          console.log('Public events response:', publicResponse.data);
          
          // Extract types and locations for filters from public events
          const types = ['All', ...new Set(publicResponse.data.map(event => event.event_type).filter(Boolean))];
          const locs = ['All', ...new Set(publicResponse.data.map(event => event.location).filter(Boolean))];
          setEventTypes(types);
          setLocations(locs);
          
          setEvents(publicResponse.data);
          setFilteredEvents(publicResponse.data);
        } catch (err) {
          console.error('Error fetching public events:', err);
          
          // If we couldn't fetch public events, fallback to mock events
          if (err.response?.status === 404) {
            console.error('Public events endpoint not found, using mock events instead');
            
            // Use mock events from landing page
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
                is_public: true
              },
            ];
            
            // Extract types and locations for filters from mock events
            const types = ['All', ...new Set(mockEvents.map(event => event.event_type).filter(Boolean))];
            const locs = ['All', ...new Set(mockEvents.map(event => event.location).filter(Boolean))];
            setEventTypes(types);
            setLocations(locs);
            
            setEvents(mockEvents);
            setFilteredEvents(mockEvents);
          } else {
            setError('Failed to load public events. Please try again later.');
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRegistrations = async () => {
    try {
      // Use the correct endpoint for user registrations
      const response = await api.get('event/attendances/my-events/');
      console.log('User registrations:', response.data);
      
      // Check if the API returns the new format with registered_event_ids
      if (response.data && response.data.registered_event_ids) {
        return response.data.registered_event_ids;
      }
      
      // Fallback to the old format if needed
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(reg => reg.event.id);
      }
      
      // If we got an unexpected format, just return an empty array
      return [];
    } catch (err) {
      console.error('Error fetching user registrations:', err);
      return [];
    }
  };
  
  // Apply search and filter criteria when they change 
  useEffect(() => {
    if (!events.length) return;
    
    // Apply filters to the already membership-filtered events
    applyFilters(events);
  }, [events, searchQuery, selectedType, selectedLocation]);
  
  // Apply search and filter functionality
  const applyFilters = (eventsToFilter) => {
    let results = [...eventsToFilter];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(event => 
        (event.title && event.title.toLowerCase().includes(query)) || 
        (event.event_type && event.event_type.toLowerCase().includes(query)) ||
        (event.description && event.description.toLowerCase().includes(query))
      );
    }
    
    // Apply type filter
    if (selectedType && selectedType !== "All") {
      results = results.filter(event => event.event_type === selectedType);
    }
    
    // Apply location filter
    if (selectedLocation && selectedLocation !== "All") {
      results = results.filter(event => event.location === selectedLocation);
    }
    
    setFilteredEvents(results);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };
  
  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const loadMoreEvents = () => {
    // In a real app, this would load the next page of events
    console.log("Loading more events");
  };
  
  const handleEventDetails = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };
  
  const closeEventDetails = () => {
    setShowEventDetails(false);
    // Refresh events to get updated registration status
    fetchEvents();
  };
  
  const handleRegisterForEvent = async (eventId) => {
    if (!user) {
      // Redirect to login if not logged in
      window.location.href = '/login';
      return;
    }
    
    try {
      console.log(`Registering for event ${eventId}`);
      console.log('Current user membership:', user.membership);
      console.log('User object:', user);
      
      // Use JSON payload instead of FormData
      let response;
      
      try {
        // First try the standard registration endpoint
        response = await api.post(`event/register/${eventId}/`, {}, {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        console.error('First registration attempt failed:', err.response?.data);
        
        // Try direct attendance creation as fallback
        console.log('Trying direct attendance creation as fallback...');
        
        response = await api.post('event/attendances/', { 
          event_id: parseInt(eventId) 
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      console.log('Registration successful:', response.data);
      
      // Update registration status
      setRegistrationStatus({...registrationStatus, [eventId]: true});
      return true;
    } catch (err) {
      console.error('Error registering for event:', err);
      if (err.response) {
        console.error('Error status:', err.response.status);
        console.error('Error data:', err.response.data);
      }
      return false;
    }
  };
  
  const handleNavigateToDashboard = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };
  
  return (
    <div className={styles.eventsContainer}>
      <div className={styles.headerNav}>
        <button 
          className={styles.backToDashboardButton}
          onClick={handleNavigateToDashboard}
        >
          <span className={styles.backIcon}>←</span> Back to Dashboard
        </button>
      </div>
      
      <h2 className={styles.sectionTitle}>Upcoming Events</h2>
      
      {/* Search and Filters */}
      <div className={styles.filterSection}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filtersRow}>
          <select 
            value={selectedType} 
            onChange={handleTypeChange}
            className={styles.filterSelect}
          >
            <option value="">Event Type</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select 
            value={selectedLocation} 
            onChange={handleLocationChange}
            className={styles.filterSelect}
          >
            <option value="">Location</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          
          <button 
            className={styles.moreFiltersButton}
            onClick={toggleFilters}
          >
            <span className={styles.filterIcon}>⚙️</span> More Filters
          </button>
        </div>
        
        {showFilters && (
          <div className={styles.advancedFilters}>
            {/* Additional filters could go here */}
            <div className={styles.dateFilter}>
              <label>Date Range:</label>
              <input type="date" className={styles.dateInput} />
              <span>to</span>
              <input type="date" className={styles.dateInput} />
            </div>
          </div>
        )}
      </div>
      
      {/* Events List */}
      <div className={styles.eventsList}>
        {loading ? (
          <div className={styles.loading}>Loading events...</div>
        ) : error ? (
          <div className={styles.error}>
            {error}
            <button onClick={fetchEvents} className={styles.retryButton}>Retry</button>
          </div>
        ) : (
          <>
            {filteredEvents.length === 0 ? (
              <div className={styles.noEvents}>
                No events match your search criteria.
              </div>
            ) : (
              filteredEvents.map((event) => (
                <EventCard 
                  key={event.id}
                  event={event}
                  onClick={() => handleEventDetails(event)}
                  isRegistered={registrationStatus[event.id]}
                  membershipLevel={user?.membership}
                />
              ))
            )}
            
            {filteredEvents.length >= 4 && (
              <button 
                className={styles.loadMoreButton}
                onClick={loadMoreEvents}
              >
                Load More Events
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent}
          onClose={closeEventDetails}
          onRegister={handleRegisterForEvent}
          isRegistered={registrationStatus[selectedEvent.id]}
          membershipLevel={user?.membership}
        />
      )}
    </div>
  );
};

export default EventsListing;