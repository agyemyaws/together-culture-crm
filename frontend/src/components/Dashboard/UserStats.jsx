import styles from "./Dashboard.module.css";

const UserStats = () => {
  const stats = [
    {
      id: 1,
      label: "Upcoming Events",
      value: 3,
      hasIcon: true,
    },
    {
      id: 2,
      label: "Available Courses",
      value: 12,
      hasIcon: true,
    },
    {
      id: 3,
      label: "Community Posts",
      value: 23,
      meta: "discussions",
      hasIcon: false,
    },
    {
      id: 4,
      label: "Community Members",
      value: 158,
      hasIcon: true,
    },
  ];

  // Function to render the appropriate icon based on the stat
  const renderIcon = (statId) => {
    switch (statId) {
      case 1: // Upcoming Events
        return (
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        );
      case 2: // Available Courses
        return (
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
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        );
      case 4: // Community Members
        return (
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
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div
            key={stat.id}
            className={styles.statCard}
            style={{ textAlign: "left" }}
          >
            <div className={styles.statLabel}>{stat.label}</div>
            <div className={styles.statValue}>
              {stat.hasIcon && renderIcon(stat.id)}
              <span className={styles.statNumber}>{stat.value}</span>
              {stat.meta && (
                <span className={styles.statMeta}>{stat.meta}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserStats;
