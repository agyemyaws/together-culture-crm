import styles from "./Dashboard.module.css";
import QuickActions from "./QuickActions";
import RecentActivity from "./RecentActivity";
import UserStats from "./UserStats";
import UpcomingEvents from "./UpcomingEvents";
import AvailableBenefits from "./AvailableBenefits";
import CommunityEngagement  from "./CommunityEngagement "
const Dashboard = () => {
  return (
    <div className={styles.dashboardContainer}>
    <UserStats />

    <div className={styles.dashboardGrid}>
      <div>
        <UpcomingEvents />
        <RecentActivity />
        
      </div>
      <QuickActions />
      <CommunityEngagement />
      <div>
     
      
        <AvailableBenefits />
      </div>
    </div>
  </div>
  );
};

export default Dashboard;
