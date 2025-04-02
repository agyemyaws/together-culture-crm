// components/Benefits/BenefitsSummary.jsx
import React from 'react';
import styles from './Benefits.module.css';

const BenefitsSummary = ({ totalBenefits, activeBenefits, unusedBenefits }) => {
  const usagePercentage = totalBenefits > 0 
    ? Math.round((activeBenefits / totalBenefits) * 100) 
    : 0;

  return (
    <div className={styles['benefits-summary']}>
      <div className={styles['summary-card']}>
        <h3>Total Benefits</h3>
        <div className={styles['summary-value']}>{totalBenefits}</div>
      </div>
      
      <div className={`${styles['summary-card']} ${styles['active']}`}>
        <h3>Benefits You're Using</h3>
        <div className={styles['summary-value']}>{activeBenefits}</div>
      </div>
      
      <div className={`${styles['summary-card']} ${styles['unused']}`}>
        <h3>Benefits Not Utilized</h3>
        <div className={styles['summary-value']}>{unusedBenefits}</div>
      </div>
      
      <div className={styles['usage-meter']}>
        <div className={styles['meter-label']}>
          <span>Benefit Utilization</span>
          <span>{usagePercentage}%</span>
        </div>
        <div className={styles['meter-bar']}>
          <div 
            className={styles['meter-fill']} 
            style={{ width: `${usagePercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default BenefitsSummary;