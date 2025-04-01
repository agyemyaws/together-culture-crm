import styles from "./CourseHeader.module.css";

const CourseHeader = ({ courseState }) => {
  const { progress } = courseState;

  return (
    <div className={styles.header}>
      <div className={styles.container}>
        <div className={styles.progressContainer}>
          <div className={styles.progressInfo}>
            <span className={styles.progressPercentage}>
              {progress.percentage}% COMPLETE
            </span>
            <span className={styles.progressSteps}>
              {progress.steps}/{progress.totalSteps} Steps
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>

        <div className={styles.userInfo}>
          <p>Hello, Daniel</p>
        </div>
      </div>
    </div>
  );
};

export default CourseHeader;
