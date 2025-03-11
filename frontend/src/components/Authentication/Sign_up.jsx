import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Authentication.module.css";
import Modal from "../profile setup/Modal";

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear errors when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate username
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulating API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Sign up submitted with:", formData);
      // Here you would typically call your registration API

      // Show welcome modal instead of redirecting
      setShowModal(true);
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Sign up</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="username" className={styles.inputLabel}>
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            className={styles.input}
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          {errors.username && (
            <p className={styles.errorText}>{errors.username}</p>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.inputLabel}>
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className={styles.input}
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errors.password && (
            <p className={styles.errorText}>{errors.password}</p>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="confirmPassword" className={styles.inputLabel}>
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className={styles.input}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {errors.confirmPassword && (
            <p className={styles.errorText}>{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing Up..." : "Sign Up"}
        </button>

        <div className={styles.signupPrompt}>
          Already have an account?
          <Link to="/login" className={styles.textLink}>
            {" "}
            Log In
          </Link>
        </div>
      </form>

      {showModal && <Modal onClose={handleCloseModal} />}
    </div>
  );
};

export default SignUp;
