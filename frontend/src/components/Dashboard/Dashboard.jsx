import styles from "./Dashboard.module.css";
import CommunityEngagement from "./CommunityEngagement";
import RecentActivity from "./RecentActivity";
import UserStats from "./UserStats";
import UpcomingEvents from "./UpcomingEvents";
import AvailableBenefits from "./AvailableBenefits";
import QuickActions from "./QuickActions";


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
