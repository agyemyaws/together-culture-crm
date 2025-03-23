import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DigitalContent.module.css";

// Import child components
import ContentFilter from "./ContentFilter";
import FeaturedContent from "./FeaturedContent";
import ContentGrid from "./ContentGrid";
import ActionSection from "./ActionSection";
import DigitalContentModal from "./DigitalContentModal";

const DigitalContent = () => {
  const navigate = useNavigate();

  // State for content filtering and search
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);

  const contentItems = [
    {
      id: 1,
      title: "Community Leadership Fundamentals",
      type: "course",
      category: "Leadership",
      description:
        "Learn the essential skills needed to lead and grow community initiatives",
      image: "/api/placeholder/280/160",
      progress: 65,
      duration: "4 hours",
      author: "Sarah Johnson",
      rating: 4.8,
      featured: true,
    },
    {
      id: 2,
      title: "Event Planning Template",
      type: "template",
      category: "Events",
      description:
        "Professional template for planning community events and tracking outcomes",
      image: "/api/placeholder/280/160",
      downloads: 1243,
      author: "Community Team",
      rating: 4.6,
      featured: true,
    },
    {
      id: 3,
      title: "Digital Marketing for Communities",
      type: "course",
      category: "Marketing",
      description:
        "Complete guide to promoting your community through digital channels",
      image: "/api/placeholder/280/160",
      progress: 10,
      duration: "6 hours",
      author: "Michael Chen",
      rating: 4.9,
    },
    {
      id: 4,
      title: "Effective Community Engagement",
      type: "webinar",
      category: "Community",
      description:
        "Recording of our popular webinar on increasing member participation",
      image: "/api/placeholder/280/160",
      duration: "45 min",
      author: "Elena Rodriguez",
      views: 768,
      rating: 4.5,
      featured: true,
    },
    {
      id: 5,
      title: "Community Workshop Facilitation",
      type: "course",
      category: "Leadership",
      description: "Learn how to plan and run effective community workshops",
      image: "/api/placeholder/280/160",
      progress: 0,
      duration: "3 hours",
      author: "Workshop Team",
      rating: 4.9,
    },
  ];

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

  // Featured content items
  const featuredContent = contentItems.filter((item) => item.featured);

  // Handle request content form submission
  const handleRequestSubmit = (data) => {
    console.log("Content request submitted:", data);
    alert(
      "Your content request has been submitted. We will notify you when it's available."
    );
  };

  // Handle navigation back to dashboard
  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

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

      {/* Featured Content Section */}
      {activeTab === "all" &&
        searchQuery === "" &&
        featuredContent.length > 0 && (
          <FeaturedContent featuredContent={featuredContent} />
        )}

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
