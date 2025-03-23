import styles from "./ContentGrid.module.css";
import ContentCard from "./ContentCard";

const ContentGrid = ({
  contentItems,
  activeTab,
  searchQuery,
  contentTypes,
}) => {
  // Get the currently active tab label for display
  const activeTabLabel =
    contentTypes.find((type) => type.id === activeTab)?.label || "All Content";

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {activeTabLabel}
        {searchQuery && (
          <span className={styles.searchTerm}>
            {" "}
            • Search results for "{searchQuery}"
          </span>
        )}
      </h2>

      {contentItems.length > 0 ? (
        <div className={styles.grid}>
          {contentItems.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No content found</h3>
          <p className={styles.emptyText}>
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default ContentGrid;
