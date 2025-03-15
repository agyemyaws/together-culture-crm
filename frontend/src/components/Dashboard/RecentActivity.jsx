import styles from "./Dashboard.module.css";

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      title: "Digital Marketing Course",
      progress: 80,
      type: "Course",
    },
    {
      id: 2,
      title: "Design Thinking Workshop",
      progress: 25,
      type: "Workshop",
    },
  ];

  // Clock icon for activity items
  const ClockIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );

  return (
    <div className={styles.card}>
      <h3 className={styles.sectionTitle}>
        Recent Activities
        <a href="#" className={styles.viewAllLink}>
          View all →
        </a>
      </h3>

      <div>
        {activities.map((activity) => (
          <div key={activity.id} className={styles.activityItem}>
            <div className={styles.activityHeader}>
              <h4 className={styles.activityTitle}>
                <ClockIcon />
                {activity.title}
              </h4>
              <span className={styles.activityType}>{activity.type}</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${activity.progress}%` }}
              ></div>
            </div>
            <p className={styles.progressText}>{activity.progress}% complete</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
