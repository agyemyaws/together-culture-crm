import { useState } from "react";
import {  useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./CompleteProfile.module.css";

const CompleteProfile = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    location: "",
    interests: [],
    bio: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const interestOptions = [
    { id: "caring", label: "Caring", description: "Supporting and nurturing community growth" },
    { id: "sharing", label: "Sharing", description: "Exchanging knowledge and resources" },
    { id: "creating", label: "Creating", description: "Making and designing new things" },
    { id: "experiencing", label: "Experiencing", description: "Exploring and discovering opportunities" },
    { id: "working", label: "Working", description: "Professional development and collaboration" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    validateForm({ ...formData, [name]: value });
  };

  const handleInterestToggle = (interestId) => {
    const updatedInterests = formData.interests.includes(interestId)
      ? formData.interests.filter((id) => id !== interestId)
      : [...formData.interests, interestId];

    const updatedFormData = { ...formData, interests: updatedInterests };
    setFormData(updatedFormData);

    if (errors.interests) {
      setErrors({ ...errors, interests: "" });
    }
    validateForm(updatedFormData);
  };

  const validateForm = (data = formData) => {
    const newErrors = {};
    let isValid = true;

    if (!data.fullName.trim()) {
      newErrors.fullName = "Full name is required";
      isValid = false;
    }

    if (data.interests.length === 0) {
      newErrors.interests = "Please select at least one interest";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateForm()) {
      window.scrollTo(0, 0);
      return;
    }
  
    setIsSubmitting(true);
  
    const payload = {
      full_name: formData.fullName,
      phone_number: formData.phoneNumber,
      location: formData.location,
      bio: formData.bio,
      interests: formData.interests,
    };
    console.log("Payload sent to /auth/profile/create/:", payload); // Debug
  
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        "http://localhost:8000/auth/profile/create/",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Profile created successfully:", response.data);
      setIsSubmitting(false);
      navigate("/dashboard");
    } catch (error) {
      console.error("Profile creation error:", error.response?.data || error.message);
      setErrors({
        ...errors,
        server:
          error.response?.data?.detail ||
          "Failed to create profile. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Complete Profile</h1>
      <p className={styles.infoMessage}>Complete your profile to get started</p>

      {errors.server && <p className={styles.errorText}>{errors.server}</p>}

      <div className={styles.profileContainer}>
        <form onSubmit={handleSubmit} className={styles.profileForm}>
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>

            <div className={styles.formGroup}>
              <label htmlFor="fullName" className={styles.formLabel}>
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={`${styles.textInput} ${errors.fullName ? styles.inputError : ""}`}
                required
              />
              {errors.fullName && <p className={styles.errorText}>{errors.fullName}</p>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber" className={styles.formLabel}>
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className={styles.textInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="location" className={styles.formLabel}>
                Location/Address
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter your address"
                className={styles.textInput}
              />
            </div>
          </section>

          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Your Interests</h2>
            <p className={styles.sectionDescription}>Select the areas that interest you most:</p>
            {errors.interests && <p className={styles.errorText}>{errors.interests}</p>}

            <div className={styles.interestsList}>
              {interestOptions.map((interest) => (
                <div
                  key={interest.id}
                  className={`${styles.interestOption} ${
                    formData.interests.includes(interest.id) ? styles.selected : ""
                  }`}
                  onClick={() => handleInterestToggle(interest.id)}
                >
                  <div className={styles.interestContent}>
                    <div className={styles.interestIcon}>
                      {/* SVG icons remain the same */}
                      {interest.id === "caring" && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                      {/* Add other SVGs as in your original code */}
                    </div>
                    <div className={styles.interestDetails}>
                      <h3 className={styles.interestTitle}>{interest.label}</h3>
                      <p className={styles.interestDescription}>{interest.description}</p>
                    </div>
                  </div>
                  <div className={styles.checkmark}>
                    {formData.interests.includes(interest.id) && (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M16.6663 5L7.49967 14.1667L3.33301 10"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>About You</h2>
            <div className={styles.formGroup}>
              <label htmlFor="bio" className={styles.formLabel}>
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself, your background, and what you hope to achieve..."
                className={styles.textArea}
                rows={4}
              />
            </div>
          </section>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Completing Profile..." : "Complete Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;