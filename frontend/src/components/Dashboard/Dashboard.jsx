import styles from "./Dashboard.module.css";
import QuickActions from "./QuickActions";
import RecentActivity from "./RecentActivity";
import UserStats from "./UserStats";
import UpcomingEvents from "./UpcomingEvents";
import AvailableBenefits from "./AvailableBenefits";

const Dashboard = () => {
  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <h1>Welcome back, Sarah</h1>
          <p className={styles.subtitle}>Community Member</p>
        </div>
        <button className={styles.signOutButton}>
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
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Sign Out
        </button>
      </header>

      <UserStats />

      <div className={styles.dashboardGrid}>
        <div>
          <UpcomingEvents />
          <RecentActivity />
        </div>
        <div>
          <QuickActions />
          <AvailableBenefits />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
