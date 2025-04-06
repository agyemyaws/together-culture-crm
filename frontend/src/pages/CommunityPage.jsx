import React, { useEffect } from 'react';
import CommunityComponent from '../components/Community/CommunityComponent';
import styles from './CommunityPage.module.css';

const CommunityPage = () => {
  useEffect(() => {
    // Set document title
    document.title = 'Community | Together Culture';
    
    // Optional: Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Join discussions and connect with other community members');
    }
    
    // Clean up on unmount
    return () => {
      document.title = 'Together Culture';
    };
  }, []);

  return (
    <div className={styles.communityPageContainer}>      
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Community Hub</h1>
          <p className={styles.pageDescription}>
            Connect with members, join discussions, and be part of our growing community
          </p>
        </div>
      </header>
      
      <CommunityComponent />
    </div>
  );
};

export default CommunityPage; 