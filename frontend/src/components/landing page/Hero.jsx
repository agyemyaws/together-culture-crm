import styles from "./Hero.module.css";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Together Culture</h1>
      <p className={styles.description}>
        Join our community of creators and innovators building a more equitable
        and ecological creative economy
      </p>
      <div className={styles.buttonGroup}>
        <Link to="/join" className={styles.joinButton}>
          Join Us
        </Link>
        <Link to="/login" className={styles.loginButton}>
          Log In
        </Link>
      </div>
    </div>
  );
};

export default Hero;
