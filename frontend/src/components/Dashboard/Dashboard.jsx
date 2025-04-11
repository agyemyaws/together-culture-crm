import styles from "./Dashboard.module.css";
import RecentActivity from "./RecentActivity";
import UserStats from "./UserStats";
import UpcomingEvents from "./UpcomingEvents";

const Dashboard = () => {
  return (
    <div className={styles.dashboardContainer}>
      <UserStats />

      <div className={styles.dashboardGrid}>
        <div>
          <UpcomingEvents />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
