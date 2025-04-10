import styles from "./FeaturedContent.module.css";
import ContentCard from "./ContentCard";

const FeaturedContent = ({ featuredContent }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Featured Content</h2>
      <div className={styles.grid}>
        {featuredContent.map((item) => (
          <ContentCard key={item.id} item={item} featured={true} />
        ))}
      </div>
    </div>
  );
};

export default FeaturedContent;
