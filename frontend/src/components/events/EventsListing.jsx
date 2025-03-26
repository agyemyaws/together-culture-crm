import { useState, useEffect } from "react";
import styles from "./EventsListing.module.css";
import EventCard from "./EventCard";
import EventDetailsModal from "./EventDetailsModal";

const EventsListing = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Event types and locations for filters
  const eventTypes = ["Workshop", "Networking", "Course", "Exhibition", "All"];
  const locations = ["Main Space", "Community Hall", "Learning Lab", "Exhibition Hall", "All"];
  
  // Sample event data - in a real app, this would come from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const sampleEvents = [
        {
          id: 1,
          title: "Creative Workshop Series",
          type: "Workshop",
          tags: ["creative", "collaboration"],
          date: "Feb 15, 2024",
          time: "2:00 PM",
          location: "Main Space",
          registered: "12/20",
          attendees: [{initial: "A"}, {initial: "B"}, {initial: "C"}],
          othersRegistered: 9,
          details: "Join us for this exciting workshop where we'll explore creative ideas and connect with fellow community members. This session will focus on collaborative techniques and innovative approaches to creative projects.",
          bringItems: [
            "Laptop or tablet",
            "Any ongoing project materials",
            "Ideas to share with the group"
          ],
          spacesAvailable: 8
        },
        {
          id: 2,
          title: "Community Meetup",
          type: "Networking",
          tags: ["networking", "community"],
          date: "Feb 18, 2024",
          time: "6:00 PM",
          location: "Community Hall",
          registered: "28/50",
          attendees: [{initial: "A"}, {initial: "B"}, {initial: "C"}],
          othersRegistered: 25,
          details: "Connect with like-minded individuals from our community. Share experiences, discuss challenges, and explore potential collaborations.",
          bringItems: [
            "Business cards",
            "A positive attitude",
            "Questions for the community"
          ],
          spacesAvailable: 22
        },
        {
          id: 3,
          title: "Digital Marketing Masterclass",
          type: "Course", 
          tags: ["digital", "marketing"],
          date: "Feb 20, 2024",
          time: "10:00 AM",
          location: "Learning Lab",
          registered: "25/30",
          attendees: [{initial: "A"}, {initial: "B"}, {initial: "C"}],
          othersRegistered: 12,
          details: "Learn essential digital marketing strategies to promote your creative work. This hands-on session will cover social media, content marketing, and analytics.",
          bringItems: [
            "Laptop",
            "Notebook",
            "Examples of current marketing materials"
          ],
          spacesAvailable: 5
        },
        {
          id: 4,
          title: "Art & Technology Showcase",
          type: "Exhibition",
          tags: ["art", "technology"],
          date: "Feb 25, 2024",
          time: "5:00 PM",
          location: "Exhibition Hall",
          registered: "67/100",
          attendees: [{initial: "A"}, {initial: "B"}, {initial: "C"}],
          othersRegistered: 64,
          details: "Experience the fusion of art and technology in this unique exhibition. Features works from local and international artists exploring the intersection of creativity and innovation.",
          bringItems: [
            "Nothing required - just bring your curiosity!",
            "Optional: business cards for networking"
          ],
          spacesAvailable: 33
        }
      ];
      
      setEvents(sampleEvents);
      setFilteredEvents(sampleEvents);
      setLoading(false);
    }, 800);
  }, []);
  
  // Search and filter functionality
  useEffect(() => {
    let results = [...events];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(event => 
        event.title.toLowerCase().includes(query) || 
        event.type.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply type filter
    if (selectedType && selectedType !== "All") {
      results = results.filter(event => event.type === selectedType);
    }
    
    // Apply location filter
    if (selectedLocation && selectedLocation !== "All") {
      results = results.filter(event => event.location === selectedLocation);
    }
    
    setFilteredEvents(results);
  }, [searchQuery, selectedType, selectedLocation, events]);
  
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
  };
  
  return (
    <div className={styles.eventsContainer}>
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
        />
      )}
    </div>
  );
};

export default EventsListing;