import { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';
import api from '../../api';

const ContentEngagement = () => {
  const [contentStats, setContentStats] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchEngagementData = async () => {
      try {
        setLoading(true);
        
        // Fetch content data with views/downloads statistics
        const contentResponse = await api.get('/content/content/');
        
        // Fetch all content progress data for users
        const progressResponse = await api.get('/content/progress/');
        
        // Process content stats
        const processedContentStats = contentResponse.data.map(content => {
          // Count progresses for this content
          const contentProgresses = progressResponse.data.filter(p => 
            p.content && p.content.id === content.id
          );
          
          // Calculate completion rate
          const completedCount = contentProgresses.filter(p => p.completed).length;
          const completionRate = contentProgresses.length > 0 
            ? Math.round((completedCount / contentProgresses.length) * 100)
            : 0;
            
          return {
            id: content.id,
            title: content.title,
            type: content.content_type,
            category: content.category,
            views: content.views || 0,
            downloads: content.downloads || 0,
            startedCount: contentProgresses.length,
            completedCount: completedCount,
            completionRate: completionRate,
          };
        });
        
        // Sort by engagement (started count)
        const sortedContentStats = processedContentStats.sort((a, b) => 
          b.startedCount - a.startedCount
        );
        
        setContentStats(sortedContentStats);
        setUserProgress(progressResponse.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching engagement data:', error);
        setError('Failed to load engagement data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEngagementData();
  }, []);
  
  const renderOverviewTab = () => {
    // Calculate summary statistics
    const totalContent = contentStats.length;
    const totalViews = contentStats.reduce((sum, item) => sum + item.views, 0);
    const totalDownloads = contentStats.reduce((sum, item) => sum + item.downloads, 0);
    const totalStarted = contentStats.reduce((sum, item) => sum + item.startedCount, 0);
    const totalCompleted = contentStats.reduce((sum, item) => sum + item.completedCount, 0);
    const overallCompletionRate = totalStarted > 0 
      ? Math.round((totalCompleted / totalStarted) * 100)
      : 0;
      
    // Group by content type
    const contentTypeGroups = contentStats.reduce((groups, item) => {
      if (!groups[item.type]) {
        groups[item.type] = {count: 0, started: 0, completed: 0};
      }
      groups[item.type].count++;
      groups[item.type].started += item.startedCount;
      groups[item.type].completed += item.completedCount;
      return groups;
    }, {});
    
    return (
      <div className={styles.engagementOverview}>
        <div className={styles.statCards}>
          <div className={styles.statCard}>
            <h3>Total Content</h3>
            <div className={styles.statValue}>{totalContent}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Total Views</h3>
            <div className={styles.statValue}>{totalViews}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Total Downloads</h3>
            <div className={styles.statValue}>{totalDownloads}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Completion Rate</h3>
            <div className={styles.statValue}>{overallCompletionRate}%</div>
          </div>
        </div>
        
        <h3 className={styles.sectionTitle}>Content Type Breakdown</h3>
        <div className={styles.contentTypeBreakdown}>
          {Object.entries(contentTypeGroups).map(([type, data]) => (
            <div key={type} className={styles.contentTypeCard}>
              <h4>{type.charAt(0).toUpperCase() + type.slice(1)}s</h4>
              <div className={styles.contentTypeStats}>
                <div className={styles.typeStatItem}>
                  <span className={styles.statLabel}>Count:</span> {data.count}
                </div>
                <div className={styles.typeStatItem}>
                  <span className={styles.statLabel}>Started:</span> {data.started}
                </div>
                <div className={styles.typeStatItem}>
                  <span className={styles.statLabel}>Completed:</span> {data.completed}
                </div>
                <div className={styles.typeStatItem}>
                  <span className={styles.statLabel}>Completion Rate:</span> 
                  {data.started > 0 
                    ? Math.round((data.completed / data.started) * 100) 
                    : 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContentStatsTab = () => {
    return (
      <div className={styles.contentStatsContainer}>
        <h3 className={styles.sectionTitle}>Content Performance</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Started</th>
              <th>Completed</th>
              <th>Completion %</th>
              <th>Views</th>
              <th>Downloads</th>
            </tr>
          </thead>
          <tbody>
            {contentStats.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.emptyMessage}>
                  No content data available.
                </td>
              </tr>
            ) : (
              contentStats.map(item => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.type}</td>
                  <td>{item.startedCount}</td>
                  <td>{item.completedCount}</td>
                  <td>{item.completionRate}%</td>
                  <td>{item.views}</td>
                  <td>{item.downloads}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderUserProgressTab = () => {
    // Group by user
    const userProgressGroups = userProgress.reduce((groups, progress) => {
      const userId = progress.user?.id;
      const userName = progress.user?.username || 'Unknown User';
      
      if (!groups[userId]) {
        groups[userId] = {
          id: userId,
          name: userName,
          contents: []
        };
      }
      
      if (progress.content) {
        groups[userId].contents.push({
          contentId: progress.content.id,
          title: progress.content.title,
          progress: progress.progress_percentage,
          completed: progress.completed,
          lastAccessed: progress.last_accessed
        });
      }
      
      return groups;
    }, {});
    
    return (
      <div className={styles.userProgressContainer}>
        <h3 className={styles.sectionTitle}>User Progress</h3>
        
        {Object.values(userProgressGroups).length === 0 ? (
          <div className={styles.emptyMessage}>
            No user progress data available.
          </div>
        ) : (
          <div className={styles.userProgressList}>
            {Object.values(userProgressGroups).map(user => (
              <div key={user.id} className={styles.userProgressCard}>
                <h4 className={styles.userName}>{user.name}</h4>
                <div className={styles.userStats}>
                  <div className={styles.userStatItem}>
                    Total Content: {user.contents.length}
                  </div>
                  <div className={styles.userStatItem}>
                    Completed: {user.contents.filter(c => c.completed).length}
                  </div>
                </div>
                
                <table className={styles.userContentTable}>
                  <thead>
                    <tr>
                      <th>Content</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th>Last Accessed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.contents.map(content => (
                      <tr key={content.contentId}>
                        <td>{content.title}</td>
                        <td>
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFill}
                              style={{width: `${content.progress}%`}}
                            ></div>
                          </div>
                          {content.progress}%
                        </td>
                        <td>
                          <span className={content.completed ? styles.completed : styles.inProgress}>
                            {content.completed ? 'Completed' : 'In Progress'}
                          </span>
                        </td>
                        <td>
                          {content.lastAccessed ? 
                            new Date(content.lastAccessed).toLocaleDateString() : 
                            'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className={styles.loadingIndicator}>Loading engagement data...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div className={styles.engagementDashboard}>
      <div className={styles.managementHeader}>
        <h2>Content Engagement Analytics</h2>
      </div>

      <div className={styles.engagementTabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'content' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Content Stats
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'users' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Progress
        </button>
      </div>

      <div className={styles.engagementContent}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'content' && renderContentStatsTab()}
        {activeTab === 'users' && renderUserProgressTab()}
      </div>
    </div>
  );
};

export default ContentEngagement; 