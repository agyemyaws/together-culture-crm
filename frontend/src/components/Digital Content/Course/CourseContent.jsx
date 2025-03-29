import styles from "./CourseCertificate.module.css";

const CourseContent = ({ currentLesson, courseTitle }) => {
  const { module, lesson } = currentLesson;

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.breadcrumbs}>
        <span>My courses</span>
        <span className={styles.breadcrumbSeparator}>›</span>
        <span>{courseTitle}</span>
        <span className={styles.breadcrumbSeparator}>›</span>
        <span>{lesson.title}</span>
      </div>

      <h1 className={styles.lessonTitle}>{lesson.title}</h1>

      <div className={styles.lessonContent}>
        {/* Render lesson content - could be HTML or markdown */}
        {lesson.content && (
          <div className={styles.contentBody}>
            {/* Split by paragraphs and render each */}
            {lesson.content.split("\n\n").map((paragraph, index) => {
              // Check if it's a header (starts with "Common" or similar)
              if (
                paragraph.startsWith("Common Leadership Styles") ||
                paragraph.startsWith("Democratic Leadership") ||
                paragraph.startsWith("Transformational Leadership") ||
                paragraph.startsWith("Servant Leadership") ||
                paragraph.startsWith("Reflection Point")
              ) {
                return (
                  <h2 key={index} className={styles.contentHeading}>
                    {paragraph}
                  </h2>
                );
              }

              // Check if paragraph contains a bullet list
              if (paragraph.includes("\n- ")) {
                const [listTitle, ...listItems] = paragraph.split("\n- ");
                return (
                  <div key={index}>
                    {listTitle && <p>{listTitle}</p>}
                    <ul className={styles.bulletList}>
                      {listItems.map((item, itemIndex) => (
                        <li key={itemIndex} className={styles.bulletItem}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }

              // Handle reflection point differently
              if (paragraph.includes("Reflection Point:")) {
                return (
                  <div key={index} className={styles.reflectionBox}>
                    <h3 className={styles.reflectionTitle}>Reflection Point</h3>
                    <p className={styles.reflectionText}>
                      {paragraph.replace("Reflection Point:", "")}
                    </p>
                  </div>
                );
              }

              // Regular paragraph
              return (
                <p key={index} className={styles.paragraph}>
                  {paragraph}
                </p>
              );
            })}
          </div>
        )}

        {!lesson.content && (
          <div className={styles.noContent}>
            <p>No content available for this lesson.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseContent;
