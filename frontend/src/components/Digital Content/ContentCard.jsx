import { useNavigate } from "react-router-dom";
import styles from "./ContentCard.module.css";

const ContentCard = ({ item, featured = false }) => {
  const navigate = useNavigate();

  // Determine CSS classes based on content type
  const getTypeClass = (type) => {
    switch (type) {
      case "course":
        return styles.course;
      case "template":
        return styles.template;
      case "webinar":
        return styles.webinar;
      default:
        return "";
    }
  };

  // Determine button text based on content type and state
  const getButtonText = () => {
    if (item.type === "course") {
      return item.progress > 0 ? "Continue" : "Start";
    } else if (item.type === "template") {
      return "Download";
    } else if (item.type === "webinar") {
      return "Watch";
    } else {
      return "View";
    }
  };

  // Handle button click based on content type
  const handleButtonClick = () => {
    if (item.type === "course") {
      // Navigate to course page with the course ID
      navigate(`/course/${item.id}`);
    } else if (item.type === "template") {
      // Handle template download
      console.log("Downloading template:", item.title);
      // Add template download logic here
    } else if (item.type === "webinar") {
      // Handle webinar viewing
      console.log("Watching webinar:", item.title);
      // Add webinar viewing logic here
    }
  };

  return (
    <div className={`${styles.card} ${featured ? styles.featuredCard : ""}`}>
      <div className={styles.imageContainer}>
        <img src={item.image} alt={item.title} className={styles.image} />
        <span className={`${styles.typeBadge} ${getTypeClass(item.type)}`}>
          {item.type === "course"
            ? "Course"
            : item.type === "template"
            ? "Template"
            : item.type === "webinar"
            ? "Webinar"
            : item.type}
        </span>
      </div>

      <div className={styles.content}>
        <span className={styles.categoryBadge}>{item.category}</span>

        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.description}>{item.description}</p>

        {item.type === "course" && (
          <div className={styles.progressContainer}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Progress</span>
              <span className={styles.progressValue}>{item.progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${styles.courseFill}`}
                style={{ width: `${item.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {item.type === "template" && item.downloads && (
          <div className={styles.statsContainer}>
            <span className={styles.downloadIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </span>
            <span className={styles.downloads}>{item.downloads} downloads</span>
          </div>
        )}

        {item.type === "webinar" && (
          <div className={styles.statsContainer}>
            <span className={styles.duration}>Duration: {item.duration}</span>
            {item.views && (
              <span className={styles.views}>{item.views} views</span>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.author}>{item.author}</span>
          <div className={styles.rating}>
            <span className={styles.star}>★</span>
            <span>{item.rating}</span>
          </div>
        </div>

        <button
          className={`${styles.button} ${getTypeClass(item.type)}`}
          onClick={handleButtonClick}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
};

export default ContentCard;
