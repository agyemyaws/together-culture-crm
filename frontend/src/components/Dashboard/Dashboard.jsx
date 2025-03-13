import styles from './Dashboard.module.css';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';
import UserStats from './UserStats';

const Dashboard = () => {
  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>Welcome back, User!</h1>
        <p className={styles.subtitle}>Here's what's happening with your projects</p>
      </header>
      
      <div className={styles.dashboardGrid}>
        <UserStats />
        <QuickActions />
        <RecentActivity />
      </div>
    </div>
  );
};

export default Dashboard; 