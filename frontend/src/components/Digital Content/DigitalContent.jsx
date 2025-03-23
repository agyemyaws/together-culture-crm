import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DigitalContent.module.css";

// Import child components
import ContentFilter from "./ContentFilter";
import FeaturedContent from "./FeaturedContent";
import ContentGrid from "./ContentGrid";
import ActionSection from "./ActionSection";
import DigitalContentModal from "./DigitalContentModal";

// Helper function to get relevant image based on content type and category
const getImageForContent = (type, category) => {
  // Map of content types and categories to relevant Unsplash images
  const imageMap = {
    course: {
      Leadership:
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop&q=80",
      Marketing:
        "https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=600&h=400&fit=crop&q=80",
      Community:
        "https://images.unsplash.com/photo-1528605105345-5344ea20e269?w=600&h=400&fit=crop&q=80",
      default:
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop&q=80",
    },
    template: {
      Events:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop&q=80",
      default:
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&h=400&fit=crop&q=80",
    },
    webinar: {
      Community:
        "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&h=400&fit=crop&q=80",
      default:
        "https://images.unsplash.com/photo-1591115765373-5207764f72e4?w=600&h=400&fit=crop&q=80",
    },
    default:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop&q=80",
  };

  // Return the specific image for the type and category, or fall back to defaults
  return (
    imageMap[type]?.[category] || imageMap[type]?.default || imageMap.default
  );
};

const DigitalContent = () => {
  const navigate = useNavigate();

  // State for content filtering and search
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [contentItems, setContentItems] = useState([]);

  // Initialize content items with appropriate images
  useEffect(() => {
    const initialContentItems = [
      {
        id: 1,
        title: "Community Leadership Fundamentals",
        type: "course",
        category: "Leadership",
        description:
          "Learn the essential skills needed to lead and grow community initiatives",
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
        progress: 0,
        duration: "3 hours",
        author: "Workshop Team",
        rating: 4.9,
      },
    ];

    // Add images to each content item
    const itemsWithImages = initialContentItems.map((item) => ({
      ...item,
      image: getImageForContent(item.type, item.category),
    }));

    setContentItems(itemsWithImages);
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
