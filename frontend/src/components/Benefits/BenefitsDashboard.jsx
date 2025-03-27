// components/Benefits/BenefitsDashboard.jsx
import React from 'react';
import BenefitsSummary from './BenefitsSummary';
import BenefitsGrid from './BenefitsGrid';
import styles from './Benefits.module.css';

const BenefitsDashboard = ({ benefitsData, onActivateBenefit }) => {
  return (
    <div className={styles['benefits-dashboard']}>
      <BenefitsSummary 
        totalBenefits={benefitsData.total_benefits}
        activeBenefits={benefitsData.utilized_benefits.length}
        unusedBenefits={benefitsData.unutilized_benefits.length}
      />
      
      <BenefitsGrid 
        activeBenefits={benefitsData.utilized_benefits}
        unusedBenefits={benefitsData.unutilized_benefits}
        categories={benefitsData.benefits_by_category}
        onActivateBenefit={onActivateBenefit}
      />
    </div>
  );
};

export default BenefitsDashboard;