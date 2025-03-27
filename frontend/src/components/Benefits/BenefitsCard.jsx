// components/Benefits/BenefitsCard.jsx
import React from 'react';
import styles from './Benefits.module.css';

const BenefitCard = ({ benefit, isActive, onActivateBenefit }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`${styles['benefit-card']} ${isActive ? styles['active'] : styles['inactive']}`}>
      <div className={styles['benefit-icon']}>
        <i className={benefit.benefit.icon || 'fas fa-gift'}></i>
      </div>
      
      <div className={styles['benefit-content']}>
        <h3>{benefit.benefit.name}</h3>
        <p>{benefit.benefit.description}</p>
        
        {isActive && (
          <div className={styles['benefit-stats']}>
            <div className={styles['stat']}>
              <span className={styles['stat-label']}>Activated:</span>
              <span className={styles['stat-value']}>
                {formatDate(benefit.activated_on)}
              </span>
            </div>
            
            {benefit.expires_on && (
              <div className={styles['stat']}>
                <span className={styles['stat-label']}>Expires:</span>
                <span className={styles['stat-value']}>
                  {formatDate(benefit.expires_on)}
                </span>
              </div>
            )}
            
            <div className={styles['stat']}>
              <span className={styles['stat-label']}>Usage:</span>
              <span className={styles['stat-value']}>{benefit.usage_count} times</span>
            </div>
          </div>
        )}
        
        {!isActive && benefit.benefit.id && (
          <button 
            className={styles['activate-button']}
            onClick={() => onActivateBenefit(benefit.benefit.id)}
          >
            Activate Benefit
          </button>
        )}
      </div>
      
      {benefit.benefit.value && (
        <div className={styles['benefit-value']}>
          Value: ${benefit.benefit.value}
        </div>
      )}
    </div>
  );
};

export default BenefitCard;