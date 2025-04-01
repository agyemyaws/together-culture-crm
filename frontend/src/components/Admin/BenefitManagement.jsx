import { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';
import { benefitsService } from '../../services/benefitsService';

const BenefitManagement = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [benefits, setBenefits] = useState([]);
  const [usageStats, setUsageStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    membership_group: 'all',
    is_active: true,
    requires_activation: false
  });
  const [usageForm, setUsageForm] = useState({
    user_id: '',
    notes: ''
  });
  const [usageHistory, setUsageHistory] = useState([]);
  const [users, setUsers] = useState([]);

  // Load mock users for demo - in a real app, fetch from API
  useEffect(() => {
    setUsers([
      { id: 1, username: 'user1', email: 'user1@example.com' },
      { id: 2, username: 'user2', email: 'user2@example.com' },
      { id: 3, username: 'user3', email: 'user3@example.com' }
    ]);
  }, []);

  // Fetch benefits and usage stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [benefitsData, statsData] = await Promise.all([
          benefitsService.getAllBenefits(),
          benefitsService.getBenefitUsageStats()
        ]);
        setBenefits(benefitsData);
        setUsageStats(statsData);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load benefits data. ' + 
          (error.response?.data?.detail || error.message || ''));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenFormModal = (benefit = null) => {
    if (benefit) {
      setSelectedBenefit(benefit);
      setFormData({
        name: benefit.name,
        description: benefit.description,
        category: benefit.category,
        membership_group: benefit.membership_group,
        is_active: benefit.is_active,
        requires_activation: benefit.requires_activation
      });
    } else {
      setSelectedBenefit(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        membership_group: 'all',
        is_active: true,
        requires_activation: false
      });
    }
    setIsFormModalOpen(true);
  };

  const handleOpenUsageModal = (benefit) => {
    setSelectedBenefit(benefit);
    setUsageForm({
      user_id: '',
      notes: ''
    });
    setIsUsageModalOpen(true);
  };

  const handleOpenHistoryModal = async (benefit) => {
    setSelectedBenefit(benefit);
    try {
      const historyData = await benefitsService.getBenefitUsageHistory(benefit.id);
      setUsageHistory(historyData);
    } catch (error) {
      console.error('Error fetching usage history:', error);
      setError('Failed to load usage history. ' + 
        (error.response?.data?.detail || error.message || ''));
      setUsageHistory([]);
    }
    setIsHistoryModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleUsageFormChange = (e) => {
    const { name, value } = e.target;
    setUsageForm({
      ...usageForm,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedBenefit) {
        // Update existing benefit
        await benefitsService.updateBenefit(selectedBenefit.id, formData);
      } else {
        // Create new benefit
        await benefitsService.createBenefit(formData);
      }
      
      // Refresh benefits list
      const benefitsData = await benefitsService.getAllBenefits();
      setBenefits(benefitsData);
      
      setIsFormModalOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error saving benefit:', error);
      setError('Failed to save benefit. ' + 
        (error.response?.data?.detail || error.message || ''));
    }
  };

  const handleDelete = async (benefitId) => {
    if (!window.confirm('Are you sure you want to delete this benefit?')) {
      return;
    }

    try {
      await benefitsService.deleteBenefit(benefitId);
      // Refresh benefits list
      const benefitsData = await benefitsService.getAllBenefits();
      setBenefits(benefitsData);
      setError(null);
    } catch (error) {
      console.error('Error deleting benefit:', error);
      setError('Failed to delete benefit. ' + 
        (error.response?.data?.detail || error.message || ''));
    }
  };

  const handleLogUsage = async (e) => {
    e.preventDefault();
    try {
      await benefitsService.logBenefitUsage(
        selectedBenefit.id,
        usageForm.user_id,
        usageForm.notes
      );
      
      // Refresh usage stats
      const statsData = await benefitsService.getBenefitUsageStats();
      setUsageStats(statsData);
      
      setIsUsageModalOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error logging usage:', error);
      setError('Failed to log benefit usage. ' + 
        (error.response?.data?.detail || error.message || ''));
    }
  };

  return (
    <div>
      <div className={styles.managementHeader}>
        <h2>Benefit Management</h2>
      </div>

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'list' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Benefits List
        </button>
        {/* <button
          className={`${styles.tabButton} ${activeTab === 'stats' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Usage Statistics
        </button> */}
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {loading ? (
        <div className={styles.loadingIndicator}>Loading...</div>
      ) : (
        <div className={styles.content}>
          {/* Benefits List Tab */}
          {activeTab === 'list' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button 
                  className={styles.addButton}
                  onClick={() => handleOpenFormModal()}
                >
                  Add New Benefit
                </button>
              </div>
              
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Membership Group</th>
                    <th>Status</th>
                    <th>Requires Activation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {benefits.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={styles.emptyMessage}>
                        No benefits found. Create your first benefit.
                      </td>
                    </tr>
                  ) : (
                    benefits.map(benefit => (
                      <tr key={benefit.id}>
                        <td>{benefit.name}</td>
                        <td>{benefit.category}</td>
                        <td>{benefit.membership_group_display}</td>
                        <td>{benefit.is_active ? 'Active' : 'Inactive'}</td>
                        <td>{benefit.requires_activation ? 'Yes' : 'No'}</td>
                        <td className={styles.actionButtons}>
                          <button
                            className={styles.editButton}
                            onClick={() => handleOpenFormModal(benefit)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDelete(benefit.id)}
                          >
                            Delete
                          </button>
                          <button
                            className={styles.editButton}
                            onClick={() => handleOpenUsageModal(benefit)}
                            style={{ backgroundColor: '#4caf50', color: 'white' }}
                          >
                            Log Usage
                          </button>
                          <button
                            className={styles.editButton}
                            onClick={() => handleOpenHistoryModal(benefit)}
                            style={{ backgroundColor: '#2196F3', color: 'white' }}
                          >
                            History
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
          
          {/* Usage Statistics Tab */}
          {/* {activeTab === 'stats' && (
            <div className={styles.statCards}>
              {usageStats.map(stat => (
                <div key={stat.id} className={styles.statCard}>
                  <h3>{stat.name}</h3>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Category:</span> {stat.category}
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Membership:</span> {stat.membership_group}
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Total Users:</span> {stat.total_users}
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Active Users:</span> {stat.active_users}
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Total Usage:</span> {stat.total_usage}
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Recent Usage (30 days):</span> {stat.recent_usage}
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Last Used:</span> {stat.last_used ? new Date(stat.last_used.timestamp).toLocaleString() : 'Never'}
                  </div>
                  <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                    <button
                      className={styles.editButton}
                      onClick={() => handleOpenHistoryModal(stat)}
                      style={{ backgroundColor: '#2196F3', color: 'white' }}
                    >
                      View History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )} */}
        </div>
      )}

      {/* Benefit Form Modal */}
      {isFormModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{selectedBenefit ? 'Edit Benefit' : 'Add New Benefit'}</h3>
              <button
                className={styles.closeButton}
                onClick={() => setIsFormModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Benefit Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className={styles.textarea}
                  rows="4"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="category">Category *</label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className={styles.input}
                    placeholder="e.g. Workspace, Resources, Events"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="membership_group">Membership Group *</label>
                  <select
                    id="membership_group"
                    name="membership_group"
                    value={formData.membership_group}
                    onChange={handleInputChange}
                    required
                    className={styles.select}
                  >
                    <option value="all">All Members</option>
                    <option value="community">Community Member</option>
                    <option value="key_access">Key Access Member</option>
                    <option value="creative_workspace">Creative Workspace Member</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="is_active">Status *</label>
                  <select
                    id="is_active"
                    name="is_active"
                    value={formData.is_active}
                    onChange={handleInputChange}
                    required
                    className={styles.select}
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="requires_activation">Requires Activation *</label>
                  <select
                    id="requires_activation"
                    name="requires_activation"
                    value={formData.requires_activation}
                    onChange={handleInputChange}
                    required
                    className={styles.select}
                  >
                    <option value={true}>Yes</option>
                    <option value={false}>No</option>
                  </select>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {selectedBenefit ? 'Update Benefit' : 'Create Benefit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Log Usage Modal */}
      {isUsageModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Log Benefit Usage</h3>
              <button
                className={styles.closeButton}
                onClick={() => setIsUsageModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleLogUsage} className={styles.form}>
              <div className={styles.formGroup}>
                <h4>{selectedBenefit?.name}</h4>
                <p>{selectedBenefit?.description}</p>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="user_id">User *</label>
                <select
                  id="user_id"
                  name="user_id"
                  value={usageForm.user_id}
                  onChange={handleUsageFormChange}
                  required
                  className={styles.select}
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={usageForm.notes}
                  onChange={handleUsageFormChange}
                  className={styles.textarea}
                  rows="3"
                  placeholder="Add details about this usage"
                />
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setIsUsageModalOpen(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={!usageForm.user_id}
                >
                  Log Usage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Usage History Modal */}
      {isHistoryModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{selectedBenefit?.name} - Usage History</h3>
              <button
                className={styles.closeButton}
                onClick={() => setIsHistoryModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalContent}>
              {usageHistory.length === 0 ? (
                <div className={styles.emptyMessage}>No usage history found.</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>User</th>
                      <th>Logged By</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageHistory.map(usage => (
                      <tr key={usage.id}>
                        <td>{new Date(usage.timestamp).toLocaleString()}</td>
                        <td>{usage.user_email}</td>
                        <td>{usage.logged_by_email || 'System'}</td>
                        <td>{usage.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className={styles.formActions} style={{ marginTop: '1rem' }}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setIsHistoryModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenefitManagement; 