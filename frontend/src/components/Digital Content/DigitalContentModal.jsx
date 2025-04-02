import { useState, useEffect } from "react";
import styles from "./DigitalContentModal.module.css";

const DigitalContentModal = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("");
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setContentType("");
      setReason("");
      setEmail("");
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, contentType, reason, email });
    onClose();
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Request Content</h2>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              What content would you like us to create?
            </label>
            <input
              type="text"
              className={styles.input}
              placeholder="Title or topic"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Content type</label>
            <div className={styles.buttonGroup}>
              {["Course", "Template", "Video"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.typeButton} ${
                    contentType === type ? styles.typeButtonActive : ""
                  }`}
                  onClick={() => setContentType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Why is this content important to you?
            </label>
            <textarea
              className={styles.textarea}
              rows="4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            ></textarea>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Your email (for updates on this request)
            </label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DigitalContentModal;
