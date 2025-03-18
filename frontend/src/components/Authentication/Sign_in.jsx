import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Authentication.module.css";

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
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
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:8000/auth/token/", 
        {
          username: formData.email,
          password: formData.password,
        }
      );

      
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      console.log("Login successful:", response.data);
      navigate("/dashboard"); 
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.detail || "Invalid credentials, please try again"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Sign in</h1>

      {error && <p className={styles.errorText}>{error}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.inputLabel}>
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className={styles.input}
            placeholder="Enter your email"
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