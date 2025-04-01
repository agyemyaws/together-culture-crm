// components/Benefits/BenefitsCard.jsx
import React from 'react';
import styles from './Benefits.module.css';

const BenefitCard = ({ benefit, isActive, onActivateBenefit, onUseBenefit }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get benefit data depending on structure
  const benefitData = benefit.benefit || benefit;
  const benefitId = benefitData.id;

  return (
    <div className={`${styles['benefit-card']} ${isActive ? styles['active'] : styles['inactive']}`}>
      <div className={styles['benefit-content']}>
        <div className={styles['benefit-header']}>
          <h3>{benefitData.name}</h3>
          <span className={styles['membership-badge']}>
            {benefitData.membership_group_display}
          </span>
        </div>
        <p>{benefitData.description}</p>
        
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
              <span className={styles['stat-value']}>{benefit.usage_count || 0} times</span>
            </div>
          </div>
        )}
        
        {!isActive && benefitId && (
          <button 
            className={styles['activate-button']}
            onClick={() => onActivateBenefit(benefitId)}
          >
            Activate Benefit
          </button>
        )}
        
        {isActive && benefit.id && (
          <button 
            className={styles['use-button']}
            onClick={() => onUseBenefit(benefitId)}
          >
            Use Benefit
          </button>
        )}
      </div>
    </div>
  );
};

export default BenefitCard;