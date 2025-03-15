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
        <h1>Welcome back, Sarah</h1>
        <p className={styles.subtitle}>Community Member</p>
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
