import  { useState } from 'react';
import styles from './MembersList.module.css';
import { useUser } from '../../context/UserContext';

const MembersList = ({ members }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { formatMembershipType } = useUser();
  const [selectedMember, setSelectedMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  if (!members || members.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>No Members Found</h3>
        <p>There are currently no members in the system.</p>
      </div>
    );
  }

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    const fullName = member.full_name?.toLowerCase() || '';
    const email = member.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getCurrentMembershipType = (member) => {
    if (member.is_staff || member.is_superuser) {
      return 'admin';
    }
    return member.current_membership?.membership_type || member.pending_membership?.membership_type || 'community';
  };

  const getMemberSinceDate = (member) => {
    // Check for current approved membership
    if (member.current_membership?.start_date) {
      return formatDate(member.current_membership.start_date);
    }
    
    // Check for pending membership
    if (member.pending_membership?.start_date) {
      return `Pending since: ${formatDate(member.pending_membership.start_date)}`;
    }
    
    // Check membership history for the earliest date
    if (member.membership_history && member.membership_history.length > 0) {
      // Sort by start_date and take the earliest
      const earliestMembership = [...member.membership_history].sort(
        (a, b) => new Date(a.start_date) - new Date(b.start_date)
      )[0];
      
      return formatDate(earliestMembership.start_date);
    }
    
    return 'N/A';
  };

  const getInterestsArray = (member) => {
    if (member.current_interests && Array.isArray(member.current_interests)) {
      return member.current_interests.map(interest => 
        typeof interest === 'object' ? interest.interest_type : interest
      );
    }
    return [];
  };

  const openUserDetails = (member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const closeUserDetails = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search members by name or email..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.MembersList}>
        {filteredMembers.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No Results Found</h3>
            <p>No members match your search criteria.</p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className={styles.memberCard}>
              <div className={styles.memberInfo}>
                <h3 className={styles.memberName}>{member.full_name || 'Unnamed User'}</h3>
                <p className={styles.memberType}>
                  Membership: {formatMembershipType(getCurrentMembershipType(member))}
                  {member.pending_membership && 
                    <span className={styles.pendingTag}> (Pending Approval)</span>
                  }
                </p>
                <p className={styles.memberEmail}>
                  Email: {member.email || 'No email'}
                </p>
                <p className={styles.memberSince}>
                  {member.pending_membership ? 'Requested' : 'Member since'}: {getMemberSinceDate(member)}
                </p>
              </div>
              
              <div className={styles.actionButtons}>
                <button 
                  className={styles.detailsButton}
                  onClick={() => openUserDetails(member)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
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
                <div className={styles.userInfoValue}>{selectedMember.full_name || 'Unnamed User'}</div>
              </div>
              
              <div className={styles.userInfoItem}>
                <div className={styles.userInfoLabel}>Email Address</div>
                <div className={styles.userInfoValue}>{selectedMember.email || 'No email'}</div>
              </div>
              
              <div className={styles.userInfoItem}>
                <div className={styles.userInfoLabel}>Phone Number</div>
                <div className={styles.userInfoValue}>{selectedMember.phone_number || 'Not provided'}</div>
              </div>
              
              <div className={styles.userInfoItem}>
                <div className={styles.userInfoLabel}>Location</div>
                <div className={styles.userInfoValue}>{selectedMember.location || 'Not specified'}</div>
              </div>
              
              <div className={styles.userInfoItem}>
                <div className={styles.userInfoLabel}>Membership Type</div>
                <div className={styles.userInfoValue}>
                  {formatMembershipType(getCurrentMembershipType(selectedMember))}
                  {selectedMember.pending_membership && 
                    <span className={styles.pendingTag}> (Pending Approval)</span>
                  }
                </div>
              </div>
              
              <div className={styles.userInfoItem}>
                <div className={styles.userInfoLabel}>Member Since</div>
                <div className={styles.userInfoValue}>
                  {selectedMember.pending_membership ? 'Requested' : 'Member since'}: {getMemberSinceDate(selectedMember)}
                </div>
              </div>
            </div>
            
            <div className={styles.userInfoItem} style={{ marginTop: '1rem' }}>
              <div className={styles.userInfoLabel}>Bio</div>
              <div className={styles.userInfoValue}>{selectedMember.bio || 'No bio provided'}</div>
            </div>
            
            <div className={styles.userInfoItem}>
              <div className={styles.userInfoLabel}>Interests</div>
              <div className={styles.userInterests}>
                {getInterestsArray(selectedMember).length > 0 ? (
                  getInterestsArray(selectedMember).map((interest, index) => (
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
                className={styles.closeModalButton}
                onClick={closeUserDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersList; 