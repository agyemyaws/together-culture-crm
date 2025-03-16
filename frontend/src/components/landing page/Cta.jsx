import { useNavigate } from "react-router-dom";
import styles from "./Cta.module.css";

const Cta = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/join");
  };
  
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Ready to Join Our Community?</h2>
      <p className={styles.description}>
        Take the first step towards being part of a creative and sustainable
        future
      </p>
      <button 
        className={styles.button} 
        onClick={handleGetStarted}
      >
        Get Started <span className={styles.arrow}>→</span>
      </button>
    </section>
  );
};

export default Cta;