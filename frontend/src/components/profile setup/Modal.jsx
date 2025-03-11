import styles from "./Modal.module.css";
import { Link } from "react-router-dom";

const WelcomeModal = ({ onClose }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Welcome to Together Culture!</h2>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalDescription}>
            Let's get you started! Complete your profile to get the most out of
            our community.
          </p>
        </div>

        <div className={styles.modalFooter}>
          <Link
            to="/complete-profile"
            className={styles.completeProfileButton}
            onClick={onClose}
          >
            Complete Your Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
