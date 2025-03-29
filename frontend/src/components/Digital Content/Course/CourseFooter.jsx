import { Link } from "react-router-dom";
import styles from "./CourseFooter.module.css";

const CourseFooter = ({
  currentLesson,
  courseModules,
  navigateToLesson,
  takeAssessment,
  goBackToCourse,
}) => {
  // Check if this is the last lesson in the last module
  const isLastLesson = () => {
    const lastModule = courseModules[courseModules.length - 1];
    const lastLesson = lastModule.lessons[lastModule.lessons.length - 1];

    return (
      currentLesson.moduleIndex === courseModules.length - 1 &&
      currentLesson.lessonIndex ===
        courseModules[currentLesson.moduleIndex].lessons.length - 1
    );
  };

  return (
    <div className={styles.footer}>
      <div className={styles.container}>
        <button
          onClick={() => navigateToLesson("prev")}
          className={`${styles.button} ${styles.prevButton} ${
            currentLesson.moduleIndex === 0 && currentLesson.lessonIndex === 0
              ? styles.disabledButton
              : ""
          }`}
          disabled={
            currentLesson.moduleIndex === 0 && currentLesson.lessonIndex === 0
          }
        >
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
          Previous Lesson
        </button>

        <Link to="/digital-content" className={styles.backLink}>
          Back to Course
        </Link>

        {isLastLesson() ? (
          // Last lesson - Show Assessment button
          <button
            onClick={takeAssessment}
            className={`${styles.button} ${styles.nextButton}`}
          >
            Take Assessment
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
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </button>
        ) : (
          // Normal next button
          <button
            onClick={() => navigateToLesson("next")}
            className={`${styles.button} ${styles.nextButton}`}
          >
            Next Lesson
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
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseFooter;
