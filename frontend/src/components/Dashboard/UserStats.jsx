import styles from './Dashboard.module.css';

const UserStats = () => {
  return (
    <div className={styles.userStatsContainer}>
      <h2>Your Statistics</h2>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Projects</h3>
          <p className={styles.statNumber}>0</p>
        </div>
        <div className={styles.statCard}>
          <h3>Active Projects</h3>
          <p className={styles.statNumber}>0</p>
        </div>
        <div className={styles.statCard}>
          <h3>Completed Projects</h3>
          <p className={styles.statNumber}>0</p>
        </div>
      </div>
    </div>
  );
};

export default UserStats; 