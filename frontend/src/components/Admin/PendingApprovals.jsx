import React, { useState } from 'react';
import styles from './PendingApprovals.module.css';
import { useUser } from '../../context/UserContext';

const PendingApprovals = ({ pendingMembers, onApprove, onDecline }) => {
  const { formatMembershipType } = useUser();
  const [selectedMember, setSelectedMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeclineId, setConfirmDeclineId] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Debug log for pending members data
  console.log('Pending members data:', pendingMembers);

  if (!pendingMembers || pendingMembers.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>No Pending Membership Requests</h3>
        <p>There are currently no pending membership requests to review.</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getProfileName = (member) => {
    try {
      // First check if we have profile_details from our updated backend
      if (member.profile_details && member.profile_details.full_name) {
        return member.profile_details.full_name;
      }
      
      // Fallback to old structure
      if (member.profile && typeof member.profile === 'object') {
        return member.profile.full_name || 'Unnamed User';
      }
      
      // If profile is just an ID
      return 'User #' + (member.profile || member.profile_details?.id || 'Unknown');
    } catch (e) {
      console.error('Error getting profile name:', e);
      return 'Unknown User';
    }
  };

  const getProfileEmail = (member) => {
    try {
      // First check if we have profile_details from our updated backend
      if (member.profile_details && member.profile_details.email) {
        return member.profile_details.email;
      }
      
      // Fallback to old structure
      if (member.profile && typeof member.profile === 'object' && member.profile.user) {
        return member.profile.user.email || 'No email';
      }
      
      return 'No email available';
    } catch (e) {
      console.error('Error getting profile email:', e);
      return 'No email available';
    }
  };

  const getProfileInterests = (member) => {
    try {
      // First check if we have profile_details from our updated backend
      if (member.profile_details && Array.isArray(member.profile_details.interests)) {
        return member.profile_details.interests.join(', ') || 'None specified';
      }
      
      // Fallback to old structure
      if (member.profile && typeof member.profile === 'object' && Array.isArray(member.profile.interests)) {
        return member.profile.interests.join(', ') || 'None specified';
      }
      
      return 'None specified';
    } catch (e) {
      console.error('Error getting profile interests:', e);
      return 'None specified';
    }
  };

  const getProfileInterestsArray = (member) => {
    try {
      // First check if we have profile_details from our updated backend
      if (member.profile_details && Array.isArray(member.profile_details.interests)) {
        return member.profile_details.interests || [];
      }
      
      // Fallback to old structure
      if (member.profile && typeof member.profile === 'object' && Array.isArray(member.profile.interests)) {
        return member.profile.interests || [];
      }
      
      return [];
    } catch (e) {
      console.error('Error getting profile interests array:', e);
      return [];
    }
  };

  const getProfileLocation = (member) => {
    try {
      if (member.profile_details && member.profile_details.location) {
        return member.profile_details.location;
      }
      
      if (member.profile && typeof member.profile === 'object') {
        return member.profile.location || 'Not specified';
      }
      
      return 'Not specified';
    } catch (e) {
      return 'Not specified';
    }
  };

  const getProfileBio = (member) => {
    try {
      if (member.profile_details && member.profile_details.bio) {
        return member.profile_details.bio;
      }
      
      if (member.profile && typeof member.profile === 'object') {
        return member.profile.bio || 'No bio provided';
      }
      
      return 'No bio provided';
    } catch (e) {
      return 'No bio provided';
    }
  };

  const getProfilePhone = (member) => {
    try {
      if (member.profile_details && member.profile_details.phone_number) {
        return member.profile_details.phone_number;
      }
      
      if (member.profile && typeof member.profile === 'object') {
        return member.profile.phone_number || 'Not provided';
      }
      
      return 'Not provided';
    } catch (e) {
      return 'Not provided';
    }
  };

  const openUserDetails = (member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const closeUserDetails = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  const handleDeclineClick = (memberId) => {
    setConfirmDeclineId(memberId);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDecline = () => {
    if (confirmDeclineId) {
      onDecline(confirmDeclineId);
      setIsConfirmDialogOpen(false);
      setConfirmDeclineId(null);
      // Close the details modal if it's open
      if (isModalOpen) {
        closeUserDetails();
      }
    }
  };

  const handleCancelDecline = () => {
    setIsConfirmDialogOpen(false);
    setConfirmDeclineId(null);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Pending Membership Approvals</h2>
      
      <div className={styles.MembersList}>
        {pendingMembers.map((member) => (
          <div key={member.id} className={styles.memberCard}>
            <div className={styles.memberInfo}>
              <h3 className={styles.memberName}>{getProfileName(member)}</h3>
              <p className={styles.memberType}>
                Type: {formatMembershipType(member.membership_type)}
              </p>
              <p className={styles.memberEmail}>
                Email: {getProfileEmail(member)}
              </p>
              <p className={styles.memberInterests}>
                Interests: {getProfileInterests(member)}
              </p>
              <p className={styles.memberApplied}>
                Applied: {formatDate(member.start_date)}
              </p>
            </div>
            
            <div className={styles.actionButtons}>
              <button 
                className={styles.approveButton}
                onClick={() => onApprove(member.id)}
              >
                Approve
              </button>
              <button 
                className={styles.reviewButton}
                onClick={() => openUserDetails(member)}
              >
                Review
              </button>
              <button 
                className={styles.declineButton}
                onClick={() => handleDeclineClick(member.id)}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && selectedMember && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Member Details</h2>
              <button className={styles.closeButton} onClick={closeUserDetails}>×</button>
            </div>
            
            <div className={styles.userInfoGrid}>
              <div className={styles.userInfoItem}>
                <div className={styles.userInfoLabel}>Full Name</div>
                <div className={styles.userInfoValue}>{getProfileName(selectedMember)}</div>
              </div>
              
              <div className={styles.userInfoItem}>
                <div className={styles.userInfoLabel}>Email Address</div>
                <div className={styles.userInfoValue}>{getProfileEmail(selectedMember)}</div>
              </div>
              
              <div className={styles.userInfoItem}>
                <div className={styles.userInfoLabel}>Phone Number</div>
                <div className={styles.userInfoValue}>{getProfilePhone(selectedMember)}</div>
              </div>
              
              <div className={styles.userInfoItem}>
                <div className={styles.userInfoLabel}>Location</div>
                <div className={styles.userInfoValue}>{getProfileLocation(selectedMember)}</div>
              </div>
              
              <div className={styles.userInfoItem}>
                <div className={styles.userInfoLabel}>Membership Type</div>
                <div className={styles.userInfoValue}>
                  {formatMembershipType(selectedMember.membership_type)}
                </div>
              </div>
              
              <div className={styles.userInfoItem}>
                <div className={styles.userInfoLabel}>Applied Date</div>
                <div className={styles.userInfoValue}>{formatDate(selectedMember.start_date)}</div>
              </div>
            </div>
            
            <div className={styles.userInfoItem} style={{ marginTop: '1rem' }}>
              <div className={styles.userInfoLabel}>Bio</div>
              <div className={styles.userInfoValue}>{getProfileBio(selectedMember)}</div>
            </div>
            
            <div className={styles.userInfoItem}>
              <div className={styles.userInfoLabel}>Interests</div>
              <div className={styles.userInterests}>
                {getProfileInterestsArray(selectedMember).length > 0 ? (
                  getProfileInterestsArray(selectedMember).map((interest, index) => (
                    <span key={index} className={styles.interestTag}>
                      {interest}
                    </span>
                  ))
                ) : (
                  <span>No interests specified</span>
                )}
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.declineButton}
                onClick={() => handleDeclineClick(selectedMember.id)}
              >
                Decline
              </button>
              <button 
                className={styles.approveButton}
                onClick={() => {
                  onApprove(selectedMember.id);
                  closeUserDetails();
                }}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmDialogOpen && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <h3 className={styles.confirmTitle}>Confirm Decline</h3>
            <p className={styles.confirmMessage}>
              Are you sure you want to decline this membership request? This action cannot be undone.
            </p>
            <div className={styles.confirmButtons}>
              <button 
                className={styles.cancelButton}
                onClick={handleCancelDecline}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmDeclineButton}
                onClick={handleConfirmDecline}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals; 