import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Authentication.module.css";

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulating API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Login submitted with:", formData);
      // Here you would typically call your authentication API

      // Navigating to dashboard after successful login
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Sign in</h1>

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
            value={formData.email}
            onChange={handleChange}
            required
          />
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
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>

        <div className={styles.signupPrompt}>
          Do not have an account?
          <Link to="/join" className={styles.textLink}>
            {" "}
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SignIn;
