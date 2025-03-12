import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Authentication.module.css";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import api from "../../api";

const SignIn = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const checkProfileStatus = async () => {
    try {
      const response = await api.get("/auth/profile/");
      return response.data;
    } catch (error) {
      // If we get a 404, it means no profile exists
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await api.post("/auth/token/", {
        username: formData.username,
        password: formData.password,
      });

      localStorage.setItem(ACCESS_TOKEN, response.data.access);
      localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
      
      navigate("/dashboard"); // Always navigate to dashboard
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.detail || "An error occurred during login"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Sign in</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <p className={styles.errorText}>{error}</p>}
        
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
