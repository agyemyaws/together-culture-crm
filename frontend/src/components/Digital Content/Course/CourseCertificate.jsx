import { Link } from "react-router-dom";
import styles from "./CourseCertificate.module.css";

const CourseCertificate = ({
  assessmentScore,
  assessmentPassed,
  resetAssessment,
  goBackToCourse,
  courseTitle,
}) => {
  const currentDate = new Date().toLocaleDateString();

  return (
    <div className={styles.certificateContainer}>
      <div
        className={`${styles.resultBox} ${
          assessmentPassed ? styles.passedBox : styles.failedBox
        }`}
      >
        <h2 className={styles.resultTitle}>
          {assessmentPassed ? "Congratulations!" : "Not Quite There Yet"}
        </h2>
        <p className={styles.resultText}>
          {assessmentPassed
            ? `You scored ${assessmentScore}% on the assessment. You've successfully completed the ${courseTitle} course.`
            : `You scored ${assessmentScore}%. You need at least 60% to pass. Please review the course material and try again.`}
        </p>
      </div>

      {assessmentPassed ? (
        <div>
          <h3 className={styles.certificateTitle}>Your Certificate</h3>
          <p className={styles.certificateText}>
            You've successfully completed this course. You can now download your
            certificate.
          </p>

          <div className={styles.certificateCard}>
            <div className={styles.certificateInfo}>
              <div className={styles.certificateIconWrapper}>
                <svg
                  className={styles.certificateIcon}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
              <div>
                <h4 className={styles.certificateName}>
                  {courseTitle} Certificate
                </h4>
                <p className={styles.certificateDate}>
                  Completed on {currentDate}
                </p>
              </div>
            </div>
            <button className={styles.downloadButton}>
              Download Certificate
            </button>
          </div>

          <div className={styles.certificateActions}>
            <button onClick={goBackToCourse} className={styles.backButton}>
              <svg
                className={styles.buttonIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
              Return to Course
            </button>

            <Link to="/digital-content" className={styles.browseButton}>
              Browse More Courses
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.certificateActions}>
          <button onClick={goBackToCourse} className={styles.backButton}>
            <svg
              className={styles.buttonIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
            Review Course
          </button>

          <button onClick={resetAssessment} className={styles.retryButton}>
            Retry Assessment
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseCertificate;
