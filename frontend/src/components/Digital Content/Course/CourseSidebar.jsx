import styles from "./CourseSidebar.module.css";

const CourseSidebar = ({ modules, currentLesson, courseTitle }) => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <svg
            className={styles.icon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 14l9-5-9-5-9 5 9 5z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
            ></path>
          </svg>
        </div>
        <h2 className={styles.title}>{courseTitle}</h2>
      </div>

      <div className={styles.moduleList}>
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className={styles.module}>
            <h3 className={styles.moduleTitle}>{module.title}</h3>
            <ul className={styles.lessonList}>
              {module.lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className={`${styles.lessonItem} ${
                    lesson.current ? styles.currentLesson : ""
                  } ${lesson.completed ? styles.completedLesson : ""}`}
                >
                  <div className={styles.statusIndicator}>
                    {lesson.completed ? (
                      <div className={styles.completedIndicator}>
                        <svg
                          className={styles.checkIcon}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                      </div>
                    ) : lesson.current ? (
                      <div className={styles.currentIndicator}>
                        <div className={styles.currentDot}></div>
                      </div>
                    ) : (
                      <div className={styles.incompleteIndicator}></div>
                    )}
                  </div>
                  <span className={styles.lessonTitle}>{lesson.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseSidebar;
