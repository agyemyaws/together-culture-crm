import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./CompleteProfile.module.css";
import api from '../../api';

const CompleteProfile = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    phone_number: "",
    location: "",
    interests: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValidated, setFormValidated] = useState(false);
  const [error, setError] = useState("");

  const interestOptions = [
    {
      value: "caring",
      label: "Caring",
      description: "Supporting and nurturing community growth",
    },
    {
      value: "sharing",
      label: "Sharing",
      description: "Exchanging knowledge and resources",
    },
    {
      value: "creating",
      label: "Creating",
      description: "Making and designing new things",
    },
    {
      value: "experiencing",
      label: "Experiencing",
      description: "Exploring and discovering opportunities",
    },
    {
      value: "working",
      label: "Working",
      description: "Professional development and collaboration",
    },
  ];

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }

    validateForm({
      ...formData,
      [name]: value,
    });
  };

  const handleInterestToggle = (interestId) => {
    const updatedInterests = [...formData.interests];

    if (updatedInterests.includes(interestId)) {
      // Remove interest if already selected
      const index = updatedInterests.indexOf(interestId);
      updatedInterests.splice(index, 1);
    } else {
      // Add interest if not selected
      updatedInterests.push(interestId);
    }

    const updatedFormData = {
      ...formData,
      interests: updatedInterests,
    };

    setFormData(updatedFormData);

    // Clear error when user selects an interest
    if (errors.interests) {
      setErrors({
        ...errors,
        interests: "",
      });
    }

    validateForm(updatedFormData);
  };

  const validateForm = (data = formData) => {
    const newErrors = {};
    let isValid = true;

    // Validate full_name (changed from fullName)
    if (!data.full_name?.trim()) {
      newErrors.full_name = "Full name is required";
      isValid = false;
    }

    // Validate phoneNumber (optional field, but could add validation if needed)

    // Validate location (optional field, but could add validation if needed)

    // Validate interests
    if (data.interests.length === 0) {
      newErrors.interests = "Please select at least one interest";
      isValid = false;
    }

    // Update errors
    setErrors(newErrors);
    setFormValidated(isValid);

    return isValid;
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
      await api.post('/auth/profile/create/', formData);
      // Navigate to dashboard on success
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error creating profile:', error);
      setError(error.response?.data?.detail || 'Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Complete Profile</h1>
      <p className={styles.infoMessage}>Complete your profile to get started</p>

      <div className={styles.profileContainer}>
        <form onSubmit={handleSubmit} className={styles.profileForm}>
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>

            <div className={styles.formGroup}>
              <label htmlFor="full_name" className={styles.formLabel}>
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={`${styles.textInput} ${
                  errors.full_name ? styles.inputError : ""
                }`}
                required
              />
              {errors.full_name && (
                <p className={styles.errorText}>{errors.full_name}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone_number" className={styles.formLabel}>
                Phone Number
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
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
            <p className={styles.sectionDescription}>
              Select the areas that interest you most:
            </p>
            {errors.interests && (
              <p className={styles.errorText}>{errors.interests}</p>
            )}

            <div className={styles.interestsList}>
              {interestOptions.map((interest) => (
                <div
                  key={interest.value}
                  className={`${styles.interestOption} ${
                    formData.interests.includes(interest.value)
                      ? styles.selected
                      : ""
                  }`}
                  onClick={() => handleInterestToggle(interest.value)}
                >
                  <div className={styles.interestContent}>
                    <div className={styles.interestIcon}>
                      {interest.value === "caring" && (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                      {interest.value === "sharing" && (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37051L8.08264 9.19372C7.54958 8.46401 6.81906 7.87031 5.96318 7.50148C4.55634 6.88134 2.97647 6.89136 1.58261 7.5186C0.188745 8.14583 -0.138348 9.24474 0.049791 10.159C0.23793 11.0732 1.02507 11.8473 2.10463 12.1253C3.18419 12.4033 4.35617 12.117 5.41711 11.3249C5.78461 11.0451 6.10422 10.7121 6.36288 10.3391L13.1133 14.0629C13.039 14.3646 13 14.6787 13 15C13 15.7906 13.2176 16.5268 13.5974 17.1448L9.1688 19.9626C8.67293 19.3721 7.93942 19 7.13173 19C5.95912 19 5 19.9591 5 21.1317C5 22.3043 5.95912 23.2634 7.13173 23.2634C8.30433 23.2634 9.26345 22.3043 9.26345 21.1317C9.26345 20.9379 9.23454 20.7506 9.18071 20.5732L13.6279 17.7427C14.2835 18.5154 15.2488 19 16.3228 19C18.3535 19 20 17.3535 20 15.3228C20 13.2922 18.3535 11.6457 16.3228 11.6457C14.8519 11.6457 13.5829 12.5413 13.1046 13.8059L6.62531 10.2562C6.8262 9.51304 6.79261 8.72389 6.50043 7.96246C6.20824 7.20103 5.68116 6.53331 5 6.06363V6.06363"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {interest.value === "creating" && (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 8V16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8 12H16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {interest.value === "experiencing" && (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 16V12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 8H12.01"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {interest.value === "working" && (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div className={styles.interestDetails}>
                      <h3 className={styles.interestTitle}>{interest.label}</h3>
                      <p className={styles.interestDescription}>
                        {interest.description}
                      </p>
                    </div>
                  </div>
                  <div className={styles.checkmark}>
                    {formData.interests.includes(interest.value) && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
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
              disabled={isSubmitting || !formValidated}
            >
              {isSubmitting ? 'Completing Profile...' : 'Complete Profile'}
            </button>
            {error && <p className={styles.errorText}>{error}</p>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
