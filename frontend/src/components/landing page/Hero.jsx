import styles from "./Hero.module.css";

const Hero = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Together Culture</h1>
      <p className={styles.description}>
        Join our community of creators and innovators building a more equitable
        and ecological creative economy
      </p>
      <div className={styles.buttonGroup}>
        <button className={styles.joinButton}>Join Us</button>
        <button className={styles.loginButton}>Log In</button>
      </div>
    </div>
  );
};

export default Hero;
