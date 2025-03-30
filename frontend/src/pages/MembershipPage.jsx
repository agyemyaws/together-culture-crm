import React, { useState } from 'react';
import styles from './MembershipPage.module.css';
import api from '../api';
import { useUser } from '../context/UserContext';

const CheckIcon = () => (
  <div className={styles.checkIcon}>
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 6L5 7.5L8.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const WarningIcon = () => (
  <div className={styles.warningIcon}>
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4V7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 9V9.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </div>
);

const MembershipPage = () => {
  const { user, updateUser } = useUser();
  const [requestStatus, setRequestStatus] = useState({
    loading: false,
    error: null,
    success: false,
    message: '',
  });

  const requestMembership = async (membershipType) => {
    setRequestStatus({
      loading: true,
      error: null,
      success: false,
      message: 'Submitting request...'
    });

    try {
      const response = await api.post('/auth/membership/request/', {
        membership_type: membershipType
      });

      console.log('Membership request response:', response.data);
      
      // Update user context with pending membership including the ID from the response
      updateUser({
        pendingMembership: { 
          id: response.data.id, 
          membership_type: response.data.membership_type || membershipType 
        }
      });

      setRequestStatus({
        loading: false,
        error: null,
        success: true,
        message: `Your request for ${membershipType} membership has been submitted successfully. An administrator will review your request.`
      });
    } catch (error) {
      let errorMessage = 'Failed to submit membership request. Please try again later.';
      
      // Check for specific error messages from API
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        }
      }
      
      setRequestStatus({
        loading: false,
        error: true,
        success: false,
        message: errorMessage
      });
    }
  };

  const cancelMembership = async () => {
    if (!user || !user.pendingMembership) return;
    
    console.log('Attempting to cancel membership:', user.pendingMembership);
    
    setRequestStatus({
      loading: true,
      error: null,
      success: false,
      message: 'Cancelling request...'
    });

    try {
      // Get the ID of the pending membership request
      const membershipId = user.pendingMembership.id;
      
      console.log('Using membership ID for cancellation:', membershipId);
      
      // Check if we have a valid membership ID
      if (!membershipId) {
        console.error('Missing membership ID for cancellation');
        throw new Error('Could not determine the membership request ID.');
      }
      
      // Call the cancel endpoint
      const url = `/auth/membership/${membershipId}/cancel/`;
      console.log('Making API call to:', url);
      await api.delete(url);
      
      console.log('Membership cancellation successful');
      
      // Update user context to remove the pending membership
      updateUser({
        pendingMembership: null
      });
      
      setRequestStatus({
        loading: false,
        error: null,
        success: true,
        message: 'Your membership request has been cancelled successfully.'
      });
    } catch (error) {
      console.error('Error cancelling membership:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }
      
      let errorMessage = 'Failed to cancel membership request. Please try again later.';
      
      // Check for specific error messages from API
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      }
      
      setRequestStatus({
        loading: false,
        error: true,
        success: false,
        message: errorMessage
      });
    }
  };

  // Determine if user already has a pending request
  const hasPendingRequest = user && user.pendingMembership;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Membership Plans</h1>
        <p className={styles.subtitle}>Choose the membership that best fits your needs</p>
        
        {/* Status Message */}
        {requestStatus.message && (
          <div 
            className={`${styles.statusMessage} ${requestStatus.error ? styles.errorMessage : ''} ${requestStatus.success ? styles.successMessage : ''}`}
          >
            {requestStatus.message}
          </div>
        )}
        
        {/* Pending Request Notice with Cancel Button */}
        {hasPendingRequest && (
          <div className={styles.pendingRequestNotice}>
            <p>You have a pending request for {user.pendingMembership.membership_type === 'creative_workspace' ? 'Creative Workspace' : 'Key Access'} membership.</p>
            <button 
              className={styles.cancelButton}
              onClick={cancelMembership}
              disabled={requestStatus.loading}
            >
              {requestStatus.loading ? 'Processing...' : 'Cancel Request'}
            </button>
          </div>
        )}
        
        <div className={styles.plansContainer}>
          {/* Community Member Plan */}
          <div className={styles.planCard}>
            <div className={styles.planTitleArea}>
              <h2 className={styles.memberTitle}>Community Member</h2>
            </div>
            <p className={styles.description}>Perfect for getting started and connecting with the community</p>
            
            <div className={styles.featuresSection}>
              <h4 className={styles.featuresTitle}>What's included:</h4>
              <ul className={styles.featuresList}>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  Community Events
                </li>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  Digital Content
                </li>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  Discussion Forums
                </li>
              </ul>
            </div>
            {user && user.membership === 'community' && (
              <div className={styles.currentPlanLabel}>Current Plan</div>
            )}
          </div>
          
          {/* Creative Workspace Member Plan */}
          <div className={styles.planCard}>
            <div className={styles.planTitleArea}>
              <h2 className={styles.memberTitle}>Creative Workspace Member</h2>
              {hasPendingRequest && user?.pendingMembership?.membership_type === 'creative_workspace' && (
                <div className={styles.pendingLabel}>Request Pending</div>
              )}
            </div>
            <p className={styles.description}>Ideal for creators who need dedicated workspace</p>
            
            <div className={styles.featuresSection}>
              <h4 className={styles.featuresTitle}>What's included:</h4>
              <ul className={styles.featuresList}>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  Workspace Access
                </li>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  Creative Tools
                </li>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  Mentoring Sessions
                </li>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  All Community Benefits
                </li>
                <li className={styles.featureItem}>
                  <WarningIcon />
                  Requires approval from administrators
                </li>
              </ul>
            </div>
            {user && user.membership === 'creative_workspace' ? (
              <div className={styles.currentPlanLabel}>Current Plan</div>
            ) : (
              <button 
                className={styles.upgradeButton}
                onClick={() => requestMembership('creative_workspace')}
                disabled={requestStatus.loading || hasPendingRequest}
              >
                {requestStatus.loading ? 'Processing...' : 'Request Upgrade'}
              </button>
            )}
          </div>
          
          {/* Key Access Member Plan */}
          <div className={styles.planCard}>
            <div className={styles.planTitleArea}>
              <h2 className={styles.memberTitle}>Key Access Member</h2>
              {hasPendingRequest && user?.pendingMembership?.membership_type === 'key_access' && (
                <div className={styles.pendingLabel}>Request Pending</div>
              )}
            </div>
            <p className={styles.description}>For professionals needing 24/7 access and premium features</p>
            
            <div className={styles.featuresSection}>
              <h4 className={styles.featuresTitle}>What's included:</h4>
              <ul className={styles.featuresList}>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  24/7 Building Access
                </li>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  Private Storage
                </li>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  Premium Support
                </li>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  All Workspace Benefits
                </li>
                <li className={styles.featureItem}>
                  <WarningIcon />
                  Requires approval from administrators
                </li>
              </ul>
            </div>
            {user && user.membership === 'key_access' ? (
              <div className={styles.currentPlanLabel}>Current Plan</div>
            ) : (
              <button 
                className={styles.upgradeButton}
                onClick={() => requestMembership('key_access')}
                disabled={requestStatus.loading || hasPendingRequest}
              >
                {requestStatus.loading ? 'Processing...' : 'Request Upgrade'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPage; 