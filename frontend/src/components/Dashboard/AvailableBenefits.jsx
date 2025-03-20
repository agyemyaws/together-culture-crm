import styles from "./Dashboard.module.css";

const AvailableBenefits = () => {
  const benefits = [
    "Free Workshop Access",
    "Digital Content Library",
    "Community Forums",
    "Event Discounts",
  ];

  return (
    <div className={styles.card}>
      <h3 className={styles.sectionTitle}>Available Benefits</h3>

      <ul className={styles.benefitsList}>
        {benefits.map((benefit, index) => (
          <li key={index} className={styles.benefitItem}>
            <span className={styles.benefitDot}></span>
            {benefit}
          </li>
        ))}
      </ul>

      <button className={styles.upgradeButton}>Upgrade Membership</button>
    </div>
  );
};

export default AvailableBenefits;
