import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DigitalContent.module.css";
import api from "../../api";

// Import child components
import ContentFilter from "./ContentFilter";
import ContentGrid from "./ContentGrid";
import ActionSection from "./ActionSection";
import DigitalContentModal from "./DigitalContentModal";

// Mapping function to convert backend content_type to frontend type
const mapContentType = (backendType) => {
  // The backend uses content_type, frontend uses type
  return backendType;
};

// Mapping function for backend data to frontend format
const mapContentItem = (backendItem) => {
  return {
    id: backendItem.id,
    title: backendItem.title,
    type: mapContentType(backendItem.content_type),
    category: backendItem.category,
    description: backendItem.description || "",
    progress: backendItem.progress?.progress_percentage || 0,
    duration: backendItem.duration || "",
    author: backendItem.author || "Unknown Author",
    rating: backendItem.rating || 0,
    image: backendItem.image_url,
    url: backendItem.url,
    downloads: backendItem.downloads || 0,
    views: backendItem.views || 0,
    completed: backendItem.progress?.completed || false,
  };
};

const DigitalContent = () => {
  const navigate = useNavigate();

  // State for content filtering and search
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch content from API
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await api.get('/content/content/');
        
        // Map the backend data to the format expected by frontend components
        const mappedItems = response.data.map(mapContentItem);
        
        setContentItems(mappedItems);
        setError(null);
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Failed to load digital content library. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Content type definitions for filtering
  const contentTypes = [
    { id: "all", label: "All Content" },
    { id: "course", label: "Courses" },
    { id: "template", label: "Templates" },
    { id: "webinar", label: "Webinars" },
  ];

  // Filter content based on active tab and search query
  const filteredContent = contentItems.filter((item) => {
    const matchesTab = activeTab === "all" || item.type === activeTab;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Handle request content form submission
  const handleRequestSubmit = async (data) => {
    try {
      console.log("Content request submitted:", data);
      // Here you could send the request to the backend API
      // await api.post('/content/request/', data);
      
      alert(
        "Your content request has been submitted. We will notify you when it's available."
      );
      setShowRequestModal(false);
    } catch (error) {
      console.error('Error submitting content request:', error);
      alert('Failed to submit your request. Please try again later.');
    }
  };

  // Handle navigation back to dashboard
  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading digital content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Error Loading Content</h2>
          <p>{error}</p>
          <button 
            className={styles.backButton} 
            onClick={handleBackToDashboard}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Digital Content Library</h1>
          <p className={styles.subtitle}>
            Explore our collection of courses, templates, and webinars
          </p>
        </div>
        <button className={styles.backButton} onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Content Filter and Search */}
      <ContentFilter
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        contentTypes={contentTypes}
      />

      {/* Content Grid */}
      <ContentGrid
        contentItems={filteredContent}
        activeTab={activeTab}
        searchQuery={searchQuery}
        contentTypes={contentTypes}
      />

      {/* Action Section */}
      <ActionSection
        onRequestContent={() => setShowRequestModal(true)}
        onBackToDashboard={handleBackToDashboard}
      />

      {/* Request Content Modal */}
      <DigitalContentModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={handleRequestSubmit}
      />
    </div>
  );
};

export default DigitalContent;
