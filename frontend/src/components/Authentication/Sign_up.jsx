import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Authentication.module.css";
import api from "../../api";

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    password2: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    if (formData.password !== formData.password2) {
      newErrors.password2 = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.post('/auth/register/', {
        username: formData.username,
        password: formData.password,
        password2: formData.password2,
      });

      if (response.data) {
        // Show success message (optional)
        alert('Registration successful! Please login.');
        // Navigate to login page
        navigate('/login');
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle specific error messages from the backend
      if (error.response?.data) {
        // Handle password-specific errors
        if (error.response.data.password) {
          setError(error.response.data.password[0]);
        }
        // Handle username-specific errors
        else if (error.response.data.username) {
          setError(error.response.data.username[0]);
        }
        // Handle non-field errors
        else if (error.response.data.non_field_errors) {
          setError(error.response.data.non_field_errors[0]);
        }
        // Handle detail message
        else if (error.response.data.detail) {
          setError(error.response.data.detail);
        }
        // If we get an unexpected error format, show the raw message
        else {
          setError(JSON.stringify(error.response.data));
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Sign up</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error && (
          <p className={styles.errorText}>{error}</p>
        )}

        <div className={styles.inputGroup}>
          <label htmlFor="username" className={styles.inputLabel}>
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            className={`${styles.input} ${
              errors.username ? styles.inputError : ""
            }`}
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
            className={`${styles.input} ${
              errors.password ? styles.inputError : ""
            }`}
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
          <label htmlFor="password2" className={styles.inputLabel}>
            Confirm Password
          </label>
          <input
            type="password"
            id="password2"
            name="password2"
            className={`${styles.input} ${
              errors.password2 ? styles.inputError : ""
            }`}
            placeholder="Confirm your password"
            value={formData.password2}
            onChange={handleChange}
            required
          />
          {errors.password2 && (
            <p className={styles.errorText}>{errors.password2}</p>
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
    </div>
  );
};

export default SignUp;
