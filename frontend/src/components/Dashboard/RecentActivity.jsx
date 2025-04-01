import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Dashboard.module.css";
import api from "../../api";

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        // Fetch user's content progress
        const progressResponse = await api.get('/content/my-progress/');
        
        // Fetch in-progress items
        const inProgressResponse = await api.get('/content/in-progress/');
        
        // Combine and process the data for display
        const progressItems = progressResponse.data.map(item => ({
          id: item.content?.id,
          title: item.content?.title || 'Unknown Content',
          progress: item.progress_percentage || 0,
          type: item.content?.content_type || 'Content',
          completed: item.completed,
          last_accessed: item.last_accessed
        })).filter(item => item.id); // Filter out items without valid IDs
        
        // Sort by last accessed (most recent first)
        const sortedActivities = progressItems.sort((a, b) => {
          // Most recently accessed first
          return new Date(b.last_accessed) - new Date(a.last_accessed);
        });
        
        // Take the most recent 3 items
        setActivities(sortedActivities.slice(0, 3));
        setError(null);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        setError('Failed to load recent activities');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, []);

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

  // Format content type for display
  const formatType = (type) => {
    if (!type) return 'Content';
    
    // Capitalize first letter
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>Recent Activities</h3>
        <div className={styles.loadingState}>Loading activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>Recent Activities</h3>
        <div className={styles.errorState}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.sectionTitle}>
        Recent Activities
        <Link to="/digital-content" className={styles.viewAllLink}>
          View all →
        </Link>
      </h3>

      {activities.length === 0 ? (
        <div className={styles.emptyState}>No recent activity</div>
      ) : (
        <div>
          {activities.map((activity) => (
            <div key={activity.id} className={styles.activityItem}>
              <div className={styles.activityHeader}>
                <h4 className={styles.activityTitle}>
                  <ClockIcon />
                  {activity.title}
                </h4>
                <span className={styles.activityType}>{formatType(activity.type)}</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${activity.progress}%` }}
                ></div>
              </div>
              <p className={styles.progressText}>
                {activity.completed 
                  ? "Completed" 
                  : `${activity.progress}% complete`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
