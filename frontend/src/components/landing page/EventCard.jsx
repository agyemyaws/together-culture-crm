import { useNavigate } from "react-router-dom";
import styles from "./EventCard.module.css";

const EventCard = ({
  id,
  title,
  type,
  description,
  date,
  location,
  capacity,
  imageUrl,
}) => {
  const navigate = useNavigate();

  const handleLearnMore = () => {
    navigate(`/events/${id}`);
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        {imageUrl ? (
          <img src={imageUrl} alt={title} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>600 × 400</div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.tag}>{type}</span>
        </div>
        <p className={styles.description}>{description}</p>
        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span className={styles.icon}>📅</span>
            <span>{date}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.icon}>📌</span>
            <span>{location}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.icon}>👥</span>
            <span>Capacity: {capacity}</span>
          </div>
        </div>
        <button 
          className={styles.learnMore} 
          onClick={handleLearnMore}
        >
          Learn More
        </button>
      </div>
    </div>
  );
};

export default EventCard;