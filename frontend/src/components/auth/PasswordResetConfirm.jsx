import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import styles from '../Authentication/Authentication.module.css';

const PasswordResetConfirm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { uidb64, token } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await api.post(`/auth/password-reset/${uidb64}/${token}/`, {
        password: password,
        confirm_password: confirmPassword
      });
      setMessage(response.data.message);
      setError('');
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err.response?.data);
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
      setMessage('');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formWrapper}>
        <div className={styles.formContainer}>
          <h1 className={styles.title}>Set New Password</h1>
          <p className={styles.subtitle}>
            Please enter your new password below.
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
              <label htmlFor="password" className={styles.inputLabel}>
                New Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={styles.input}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.inputLabel}>
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirm_password"
                className={styles.input}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
            >
              Reset Password
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

export default PasswordResetConfirm; 