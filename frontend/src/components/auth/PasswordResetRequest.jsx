import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import styles from '../Authentication/Authentication.module.css';

const PasswordResetRequest = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/password-reset/', { 
        email,
        frontend_url: window.location.origin // This will be http://localhost:5173 in development
      });
      setMessage(response.data.message);
      setError('');
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
      setMessage('');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formWrapper}>
        <div className={styles.formContainer}>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          {message && (
            <div className={`${styles.alert} ${styles.successAlert}`}>
              {message}
            </div>
          )}
          {error && (
            <div className={`${styles.alert} ${styles.errorAlert}`}>
              {error}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.inputLabel}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={styles.input}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
            >
              Send Reset Link
            </button>

            <button
              type="button"
              className={styles.textButton}
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetRequest; 