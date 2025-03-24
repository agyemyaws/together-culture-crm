import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "./Dashboard.module.css";
import api from '../../api';

const AvailableBenefits = ({ onUpgradeMembership }) => {
  const [benefits, setBenefits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        setIsLoading(true);
        const response = await api.benefits.getAvailableBenefits();
        
        const availableBenefits = response.data
          .filter(benefit => benefit.is_available && !benefit.has_used)
          .map(benefit => ({
            id: benefit.id,
            name: benefit.name,
            description: benefit.description
          }));
        
        setBenefits(availableBenefits);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch benefits');
        setIsLoading(false);
        console.error('Benefits fetch error:', err);
      }
    };

    fetchBenefits();
  }, []);

  const handleUseBenefit = async (benefit) => {
    try {
      await api.benefits.useBenefit(benefit.id);
      
      // Remove the used benefit from the list
      setBenefits(prevBenefits => 
        prevBenefits.filter(b => b.id !== benefit.id)
      );
    } catch (err) {
      console.error('Failed to use benefit', err);
      // Optionally show an error message to the user
    }
  };

  const handleUpgradeMembership = () => {
    navigate('/membership');
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.sectionTitle}>
        Available Benefits
        <a href="#" className={styles.viewAllLink}>View All</a>
      </h3>

      {isLoading ? (
        <p>Loading benefits...</p>
      ) : error ? (
        <p>{error}</p>
      ) : benefits.length === 0 ? (
        <p>No benefits available at the moment</p>
      ) : (
        <ul className={styles.benefitsList}>
          {benefits.map((benefit) => (
            <li key={benefit.id} className={styles.benefitItem}>
              <span className={styles.benefitDot}></span>
              <div>
                <strong>{benefit.name}</strong>
                <p className={styles.benefitDescription}>{benefit.description}</p>
              </div>
              <button 
                onClick={() => handleUseBenefit(benefit)}
                className={styles.eventAction}
                style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                Use
              </button>
            </li>
          ))}
        </ul>
      )}

      <button 
        className={styles.upgradeButton}
        onClick={handleUpgradeMembership}
      >
        Upgrade Membership
      </button>
    </div>
  );
};

export default AvailableBenefits;