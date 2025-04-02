import styles from "./ContentFilter.module.css";

const ContentFilter = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  contentTypes,
}) => {
  return (
    <div className={styles.filterContainer}>
      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search content..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className={styles.searchIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
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
          </span>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        {contentTypes.map((type) => (
          <button
            key={type.id}
            className={`${styles.tabButton} ${
              activeTab === type.id ? styles[`${type.id}Active`] : ""
            }`}
            onClick={() => setActiveTab(type.id)}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ContentFilter;
