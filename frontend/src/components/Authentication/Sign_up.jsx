import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Authentication.module.css";
import Modal from "../profile setup/Modal";

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password2: "",
    full_name: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.password2) {
      newErrors.password2 = "Passwords do not match";
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
      const response = await axios.post(
        "http://localhost:8000/api/register/", // Replace with your backend URL
        {
          email: formData.email,
          password: formData.password,
          password2: formData.password2,
          full_name: formData.full_name,
        }
      );

      console.log("Sign up successful:", response.data);
      setShowModal(true); // Show a modal, then redirect to profile creation

      // Optionally auto-login after signup
      const loginResponse = await axios.post(
        "http://localhost:8000/api/token/",
        {
          email: formData.email,
          password: formData.password,
        }
      );
      localStorage.setItem("access_token", loginResponse.data.access);
      localStorage.setItem("refresh_token", loginResponse.data.refresh);
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({
        ...errors,
        server:
          error.response?.data?.email?.[0] ||
          error.response?.data?.password?.[0] ||
          error.response?.data?.non_field_errors?.[0] ||
          "Registration failed, please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/profile/create"); // Redirect to profile creation after closing modal
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Sign up</h1>

      {errors.server && <p className={styles.errorText}>{errors.server}</p>}

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
          {errors.email && <p className={styles.errorText}>{errors.email}</p>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="full_name" className={styles.inputLabel}>
            Full Name
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            className={styles.input}
            placeholder="Enter your full name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
          {errors.full_name && (
            <p className={styles.errorText}>{errors.full_name}</p>
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
          <label htmlFor="password2" className={styles.inputLabel}>
            Confirm Password
          </label>
          <input
            type="password"
            id="password2"
            name="password2"
            className={styles.input}
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

      {showModal && <Modal onClose={handleCloseModal} />}
    </div>
  );
};

export default SignUp;