import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import styles from './AdminDashboard.module.css';
import api from '../../api';
import MembersList from './MembersList';
import PendingApprovals from './PendingApprovals';
import EventManagement from './EventManagement';

const AdminDashboard = () => {
  const { user, isAdminMode } = useUser();
  const [activeSection, setActiveSection] = useState('members');
  const [pendingMembers, setPendingMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      if (activeSection === 'pending') {
        await fetchPendingMemberships();
      } else if (activeSection === 'members') {
        await fetchAllMembers();
      }
      setLoading(false);
    };

    loadData();
  }, [activeSection]);

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

  const renderSection = () => {
    switch (activeSection) {
      case 'members':
        return <MembersList members={allMembers} />;
      case 'pending':
        return <PendingApprovals 
          pendingMembers={pendingMembers} 
          onApprove={handleApproveMembership}
          onDecline={handleDeclineMembership}
        />;
      case 'events':
        return <EventManagement />;
      default:
        return <MembersList members={allMembers} />;
    }
  };

  return (
    <div className={styles.adminDashboard}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <div className={styles.headerRight}>
          <div className={styles.modeIndicator}>
            Mode: <span className={styles.adminMode}>Admin</span>
          </div>
          <button className={styles.iconButton}>
            <i className="fas fa-bell"></i>
          </button>
          <button className={styles.iconButton}>
            <i className="fas fa-filter"></i>
          </button>
        </div>
      </div>

      <div className={styles.searchBar}>
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Search members, events, or activities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeSection === 'members' ? styles.activeTab : ''}`}
          onClick={() => setActiveSection('members')}
        >
          All Members
        </button>
        <button
          className={`${styles.tabButton} ${activeSection === 'pending' ? styles.activeTab : ''}`}
          onClick={() => setActiveSection('pending')}
        >
          Pending Approvals
        </button>
        <button
          className={`${styles.tabButton} ${activeSection === 'events' ? styles.activeTab : ''}`}
          onClick={() => setActiveSection('events')}
        >
          Events
        </button>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        {loading ? (
          <div className={styles.loadingIndicator}>Loading...</div>
        ) : (
          renderSection()
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 