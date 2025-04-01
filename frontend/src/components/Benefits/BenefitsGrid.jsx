// components/Benefits/BenefitsGrid.jsx
import React, { useState } from 'react';
import BenefitsCard from './BenefitsCard';
import styles from './Benefits.module.css';

const BenefitsGrid = ({ activeBenefits, unusedBenefits, categories, onActivateBenefit, onUseBenefit }) => {
  const [activeTab, setActiveTab] = useState('all');

  const renderBenefits = () => {
    if (activeTab === 'all') {
      return (
        <div className={styles['benefits-container']}>
          <div className={styles['benefits-section']}>
            <h2>Benefits You're Using</h2>
            <div className={styles['benefits-grid']}>
              {activeBenefits.length > 0 ? (
                activeBenefits.map(benefit => (
                  <BenefitsCard 
                    key={benefit.id} 
                    benefit={benefit} 
                    isActive={true}
                    onActivateBenefit={onActivateBenefit}
                    onUseBenefit={onUseBenefit}
                  />
                ))
              ) : (
                <p className={styles['no-benefits']}>You're not using any benefits yet.</p>
              )}
            </div>
          </div>
          
          <div className={styles['benefits-section']}>
            <h2>Available Benefits</h2>
            <div className={styles['benefits-grid']}>
              {unusedBenefits.length > 0 ? (
                unusedBenefits.map(benefit => (
                  <BenefitsCard 
                    key={benefit.id} 
                    benefit={benefit} 
                    isActive={false}
                    onActivateBenefit={onActivateBenefit}
                    onUseBenefit={onUseBenefit}
                  />
                ))
              ) : (
                <p className={styles['no-benefits']}>No available benefits to activate.</p>
              )}
            </div>
          </div>
        </div>
      );
    } else if (activeTab === 'active') {
      return (
        <div className={styles['benefits-container']}>
          <div className={styles['benefits-section']}>
            <h2>Benefits You're Using</h2>
            <div className={styles['benefits-grid']}>
              {activeBenefits.length > 0 ? (
                activeBenefits.map(benefit => (
                  <BenefitsCard 
                    key={benefit.id} 
                    benefit={benefit} 
                    isActive={true}
                    onActivateBenefit={onActivateBenefit}
                    onUseBenefit={onUseBenefit}
                  />
                ))
              ) : (
                <p className={styles['no-benefits']}>You're not using any benefits yet.</p>
              )}
            </div>
          </div>
        </div>
      );
    } else if (activeTab === 'unused') {
      return (
        <div className={styles['benefits-container']}>
          <div className={styles['benefits-section']}>
            <h2>Available Benefits</h2>
            <div className={styles['benefits-grid']}>
              {unusedBenefits.length > 0 ? (
                unusedBenefits.map(benefit => (
                  <BenefitsCard 
                    key={benefit.id} 
                    benefit={benefit} 
                    isActive={false}
                    onActivateBenefit={onActivateBenefit}
                    onUseBenefit={onUseBenefit}
                  />
                ))
              ) : (
                <p className={styles['no-benefits']}>No available benefits to activate.</p>
              )}
            </div>
          </div>
        </div>
      );
    } else if (activeTab === 'categories') {
      return (
        <div className={styles['benefits-container']}>
          {Object.entries(categories).map(([category, benefitsList]) => (
            <div className={styles['category-section']} key={category}>
              <h2>{category}</h2>
              
              {benefitsList.utilized.length > 0 && (
                <div className={styles['benefits-subsection']}>
                  <h3>Benefits You're Using</h3>
                  <div className={styles['benefits-grid']}>
                    {benefitsList.utilized.map(benefit => (
                      <BenefitsCard 
                        key={benefit.id} 
                        benefit={benefit} 
                        isActive={true}
                        onActivateBenefit={onActivateBenefit}
                        onUseBenefit={onUseBenefit}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {benefitsList.unutilized.length > 0 && (
                <div className={styles['benefits-subsection']}>
                  <h3>Available Benefits</h3>
                  <div className={styles['benefits-grid']}>
                    {benefitsList.unutilized.map(benefit => (
                      <BenefitsCard 
                        key={benefit.id} 
                        benefit={benefit} 
                        isActive={false}
                        onActivateBenefit={onActivateBenefit}
                        onUseBenefit={onUseBenefit}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className={styles['benefits-grid-container']}>
      <div className={styles['benefits-tabs']}>
        <button 
          className={activeTab === 'all' ? styles['active'] : ''} 
          onClick={() => setActiveTab('all')}
        >
          All Benefits
        </button>
        <button 
          className={activeTab === 'active' ? styles['active'] : ''} 
          onClick={() => setActiveTab('active')}
        >
          Benefits You're Using
        </button>
        <button 
          className={activeTab === 'unused' ? styles['active'] : ''} 
          onClick={() => setActiveTab('unused')}
        >
          Available Benefits
        </button>
        <button 
          className={activeTab === 'categories' ? styles['active'] : ''} 
          onClick={() => setActiveTab('categories')}
        >
          By Category
        </button>
      </div>
      
      {renderBenefits()}
    </div>
  );
};

export default BenefitsGrid;