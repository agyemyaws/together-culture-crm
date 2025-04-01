import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Authentication.module.css";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import api from "../../api";
import { useUser } from "../../context/UserContext";

const SignIn = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { updateUser } = useUser();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear field error when user types
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
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/auth/profile/");
      
      // Check if user is an admin
      const isAdmin = response.data.is_staff || response.data.is_superuser;
      
      // Extract interests properly
      let interests = [];
      if (response.data.current_interests && Array.isArray(response.data.current_interests)) {
        interests = response.data.current_interests.map(interest => interest.interest_type);
      }
      
      const userData = {
        id: response.data.id,
        fullName: response.data.full_name || response.data.username,
        email: response.data.email,
        phoneNumber: response.data.phone_number,
        location: response.data.location,
        bio: response.data.bio,
        membership: isAdmin ? 'admin' : (response.data.current_membership?.membership_type || 'community'),
        interests: interests,
        isAdmin: isAdmin
      };
      
      updateUser(userData);
      
      // Store the complete user data in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData));
      
      // If user is admin, set admin mode on by default
      if (isAdmin) {
        localStorage.setItem('adminMode', 'true');
      }
      
      return userData;
    } catch (error) {
      console.error("Error fetching user profile");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      // Login request
      const response = await api.post("/auth/token/", {
        username: formData.username,
        password: formData.password,
      });

      // Store tokens in localStorage
      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;
      
      localStorage.setItem(ACCESS_TOKEN, accessToken);
      localStorage.setItem(REFRESH_TOKEN, refreshToken);
      
      // Explicitly set the Authorization header for the next request
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Now fetch user profile
      const userData = await fetchUserProfile();
      
      if (userData) {
        // Only navigate if we successfully got user data
        navigate("/dashboard");
      } else {
        throw new Error("Failed to fetch user profile after login");
      }
    } catch (error) {
      console.error("Login error");
      setError(
        error.response?.data?.detail || error.message || "An error occurred during login"
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
            className={`${styles.input} ${errors.username ? styles.inputError : ""}`}
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
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
            className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
          />
          {errors.password && (
            <p className={styles.errorText}>{errors.password}</p>
          )}
          <Link to="/password-reset" className={styles.forgotPassword}>
            Forgot Password?
          </Link>
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