import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import styles from './AdminDashboard.module.css';
import api from '../../api';
import MembersList from './MembersList';
import PendingApprovals from './PendingApprovals';

const AdminDashboard = () => {
  const { user, isAdminMode } = useUser();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingMembers, setPendingMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch pending membership requests
  const fetchPendingMemberships = async () => {
    try {
      setError(null);
      console.log('Fetching pending memberships...');
      const response = await api.get('/auth/membership/pending/');
      console.log('Pending memberships response:', response.data);
      
      if (!Array.isArray(response.data)) {
        console.error('Expected array in response but got:', typeof response.data);
        setPendingMembers([]);
        setError('Invalid response format when loading pending memberships.');
        return [];
      }
      
      setPendingMembers(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending memberships:', error);
      console.error('Error details:', error.response?.data || error.message);
      setPendingMembers([]);
      setError('Failed to load pending membership requests. ' + 
              (error.response?.data?.detail || error.message || ''));
      return [];
    }
  };

  // Fetch all members
  const fetchAllMembers = async () => {
    try {
      // Assuming there's an endpoint for getting all users with their profiles
      const response = await api.get('/auth/members/');
      setAllMembers(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching all members:', error);
      setError('Failed to load member list.');
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (activeTab === 'pending') {
        await fetchPendingMemberships();
      } else if (activeTab === 'all') {
        await fetchAllMembers();
      } else if (activeTab === 'events') {
        // Future implementation
      }
      setLoading(false);
    };

    loadData();
  }, [activeTab]);

  // Handle approving a membership request
  const handleApproveMembership = async (membershipId) => {
    try {
      await api.put(`/auth/membership/${membershipId}/approve/`);
      // Update the pending memberships list
      const updatedPending = await fetchPendingMemberships();
      setPendingMembers(updatedPending);
      return true;
    } catch (error) {
      console.error('Error approving membership:', error);
      setError('Failed to approve membership.');
      return false;
    }
  };

  // Handle declining a membership request
  const handleDeclineMembership = async (membershipId) => {
    try {
      await api.delete(`/auth/membership/${membershipId}/cancel/`);
      // Update the pending memberships list
      const updatedPending = await fetchPendingMemberships();
      setPendingMembers(updatedPending);
      return true;
    } catch (error) {
      console.error('Error declining membership:', error);
      setError('Failed to decline membership.');
      return false;
    }
  };

  if (!user?.isAdmin || !isAdminMode) {
    return (
      <div className={styles.adminDashboard}>
        <h2>Not Authorized</h2>
        <p>You need to be an admin and in admin mode to access this page.</p>
      </div>
    );
  }

  return (
    <div className={styles.adminDashboard}>
      <h1 className={styles.dashboardTitle}>Admin Dashboard</h1>
      
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'all' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Members
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'pending' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'events' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {loading ? (
        <div className={styles.loadingIndicator}>Loading...</div>
      ) : (
        <div className={styles.tabContent}>
          {activeTab === 'all' && (
            <MembersList members={allMembers} />
          )}
          
          {activeTab === 'pending' && (
            <PendingApprovals 
              pendingMembers={pendingMembers} 
              onApprove={handleApproveMembership}
              onDecline={handleDeclineMembership}
            />
          )}
          
          {activeTab === 'events' && (
            <div className={styles.comingSoon}>
              <h3>Events Management</h3>
              <p>This feature is coming soon!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 