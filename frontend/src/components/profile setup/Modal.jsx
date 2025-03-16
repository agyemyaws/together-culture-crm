import { useState } from 'react';
import styles from "./Modal.module.css";
import CompleteProfile from './CompleteProfile';

const Modal = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {!showForm ? (
          <>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Welcome to Together Culture!</h2>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalDescription}>
                To get the most out of your experience, please complete your profile.
                This will help us better understand your interests and connect you with
                like-minded community members.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.completeProfileButton}
                onClick={() => setShowForm(true)}
              >
                Complete Your Profile!
              </button>
            </div>
          </>
        ) : (
          <CompleteProfile />
        )}
      </div>
    </div>
  );
};

export default Modal;
