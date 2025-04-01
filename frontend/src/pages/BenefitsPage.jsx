// pages/BenefitsPage.jsx
import React, { useState, useEffect } from 'react';
import BenefitsDashboard from "../components/Benefits/BenefitsDashboard";
import Layout from "../components/Layout/Layout"; 
import { useUser } from '../context/UserContext';
import api from '../api';
import styles from './BenefitsPage.module.css';

const Benefits = () => {
  const { user, isLoading: isUserLoading } = useUser();
  const [benefitsData, setBenefitsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBenefitsData = async () => {
    if (!isUserLoading && user) {
      try {
        setLoading(true);
        
        const response = await api.get('/api/benefits/dashboard/');
        
        console.log('Benefits API Response:', response.data);
        
        setBenefitsData(response.data);
        setError(null);
      } catch (err) {
        console.error('Full Error Object:', err);
        console.error('Error Response:', err.response);
        
        if (err.response && err.response.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError(`Failed to load benefits data: ${err.response?.data?.error || err.message}`);
        }
      } finally {
        setLoading(false);
      }
    } else if (!user && !isUserLoading) {
      setError('Please log in to view your benefits.');
      setLoading(false);
    }
  };

  const handleActivateBenefit = async (benefitId) => {
    try {
      setLoading(true);
      await api.post(`/api/benefits/dashboard/${benefitId}/activate/`);
      
      // Reload benefits data after activation
      await fetchBenefitsData();
      
      // Show success message
      alert('Benefit activated successfully!');
    } catch (err) {
      console.error('Error activating benefit:', err);
      const errorMessage = err.response?.data?.error || 'Failed to activate benefit';
      alert(`Error: ${errorMessage}. Please try again.`);
      setLoading(false);
    }
  };
  
  const handleUseBenefit = async (benefitId) => {
    try {
      setLoading(true);
      await api.post(`/api/benefits/dashboard/${benefitId}/use/`);
      
      // Reload benefits data after usage
      await fetchBenefitsData();
      
      // Show success message
      alert('Benefit used successfully!');
    } catch (err) {
      console.error('Error using benefit:', err);
      const errorMessage = err.response?.data?.error || 'Failed to use benefit';
      alert(`Error: ${errorMessage}. Please try again.`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefitsData();
  }, [user, isUserLoading]);

  const isPageLoading = loading || isUserLoading;

  return (
    <Layout>
      <div className={styles['benefits-page']}>
        <div className={styles['page-header']}>
          <h1>Member Benefits</h1>
          <p>Explore and manage all the benefits available to you as a member.</p>
        </div>
        
        {isPageLoading ? (
          <div className={styles['loading-state']}>
            <div className={styles['spinner']}></div>
            <p>Loading your benefits...</p>
          </div>
        ) : error ? (
          <div className={styles['error-state']}>
            <div className={styles['error-icon']}>!</div>
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button 
              className={styles['retry-button']}
              onClick={fetchBenefitsData}
            >
              Try Again
            </button>
          </div>
        ) : (
          <BenefitsDashboard 
            benefitsData={benefitsData} 
            onActivateBenefit={handleActivateBenefit}
            onUseBenefit={handleUseBenefit}
          />
        )}
      </div>
    </Layout>
  );
};

export default Benefits;