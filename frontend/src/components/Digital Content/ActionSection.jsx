import styles from "./ActionSection.module.css";

const ActionSection = ({ onRequestContent, onBackToDashboard }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h3 className={styles.title}>Can't find what you need?</h3>
        <p className={styles.text}>
          Request new content or return to your dashboard
        </p>
      </div>
      <div className={styles.buttonGroup}>
        <button className={styles.dashboardButton} onClick={onBackToDashboard}>
          Back to Dashboard
        </button>
        <button className={styles.requestButton} onClick={onRequestContent}>
          Request Content
        </button>
      </div>
    </div>
  );
};

export default ActionSection;
