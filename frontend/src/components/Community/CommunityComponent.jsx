import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Community.module.css';
import api from '../../api';

const CommunityComponent = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discussions');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [viewMore, setViewMore] = useState({
    discussions: false,
    members: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [membersRes, discussionsRes] = await Promise.all([
          api.get('/auth/community-members/'),
          api.get('/auth/discussions/')
        ]);
        
        setMembers(membersRes.data);
        setDiscussions(discussionsRes.data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load community data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle messaging functionality
  const handleOpenMessageDialog = (member) => {
    setSelectedMember(member);
    setOpenDialog(true);
    setMessage('');
    setSendError(null);
    setSendSuccess(false);
  };

  const handleCloseMessageDialog = () => {
    setOpenDialog(false);
    setSelectedMember(null);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setSendError('Message cannot be empty');
      return;
    }

    setSending(true);
    try {
      await api.post('/auth/messages/send/', {
        recipient_id: selectedMember.user_id,
        content: message.trim()
      });
      
      setSendSuccess(true);
      setTimeout(() => handleCloseMessageDialog(), 1500);
    } catch (err) {
      setSendError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle new discussion functionality
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
    setNewDiscussion({ title: '', content: '' });
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  const handleCreateDiscussion = async () => {
    if (!newDiscussion.title.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/auth/discussions/create/', newDiscussion);
      setDiscussions([response.data, ...discussions]);
      handleCloseCreateDialog();
    } catch (err) {
      console.error('Failed to create discussion:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter members and discussions based on search query
  const filteredMembers = members.filter(
    (member) => member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                member.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDiscussions = discussions.filter(
    (discussion) => discussion.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    discussion.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Effect to load members data when tab is selected
  useEffect(() => {
    if (activeTab === 'members') {
      const fetchAllMembers = async () => {
        try {
          setLoading(true);
          const response = await api.get('/auth/all-community-members/');
          setMembers(response.data);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching all members:', err);
          setError('Failed to load members list');
          setLoading(false);
        }
      };
      
      fetchAllMembers();
    }
  }, [activeTab]);

  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    
    if (tab === 'messages') {
      navigate('/messages');
    }
  };

  // Format date for better readability
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading community data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <svg 
          className={styles.errorIcon} 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Determine the number of items to display based on view more state
  const displayedDiscussions = viewMore.discussions 
    ? filteredDiscussions 
    : filteredDiscussions.slice(0, 5);
    
  const displayedMembers = viewMore.members 
    ? filteredMembers 
    : filteredMembers.slice(0, 8);

  return (
    <div className={styles.communityContainer}>
      {/* Header with search and create button */}
      <div className={styles.communityHeader}>
        <div className={styles.headerLeftSection}>
          <button
            className={styles.backToDashboardButton}
            onClick={() => navigate("/dashboard")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
            Back to Dashboard
          </button>
          <div className={styles.searchContainer}>
            <svg 
              className={styles.searchIcon} 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search discussions, members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
        <button 
          className={styles.createButton}
          onClick={handleOpenCreateDialog}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Discussion
        </button>
      </div>

      {/* Community Stats */}
      <div className={styles.communityStats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#e6f0ff', color: '#0066ff' }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div>
            <h3>{members.length}</h3>
            <p>Active Members</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fdf2f8', color: '#ec4899' }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </div>
          <div>
            <h3>{discussions.length}</h3>
            <p>Active Discussions</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div>
            <h3>{discussions.reduce((sum, discussion) => sum + (discussion.replies_count || 0), 0)}</h3>
            <p>Total Replies</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'discussions' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('discussions')}
        >
          Discussions
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'members' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('members')}
        >
          Members
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'messages' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('messages')}
        >
          My Messages
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <>
            {filteredDiscussions.length > 0 ? (
              <div className={styles.discussionsList}>
                {displayedDiscussions.map((discussion) => (
                  <div key={discussion.id} className={styles.discussionCard}>
                    <div className={styles.discussionHeader}>
                      <h4>{discussion.title}</h4>
                      <div className={styles.discussionStats}>
                        <span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                          </svg>
                          {discussion.replies_count || 0} replies
                        </span>
                      </div>
                    </div>
                    <p className={styles.discussionPreview}>
                      {discussion.content ? (
                        discussion.content.length > 150 
                          ? `${discussion.content.substring(0, 150)}...` 
                          : discussion.content
                      ) : 'No content available'}
                    </p>
                    <div className={styles.discussionFooter}>
                      <div className={styles.discussionAuthor}>
                        <div className={styles.authorAvatar}>
                          {discussion.author?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span>{discussion.author || 'Unknown'}</span>
                        <span className={styles.discussionDate}>
                          {formatDate(discussion.created_at)}
                        </span>
                      </div>
                      <button 
                        className={styles.viewButton}
                        onClick={() => navigate(`/discussions/${discussion.id}`)}
                      >
                        View Discussion
                      </button>
                    </div>
                  </div>
                ))}
                
                {filteredDiscussions.length > 5 && (
                  <button 
                    className={styles.viewMoreButton}
                    onClick={() => setViewMore({...viewMore, discussions: !viewMore.discussions})}
                  >
                    {viewMore.discussions ? 'View Less' : 'View More Discussions'}
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="64" 
                  height="64" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <h3>No discussions found</h3>
                <p>Start a new discussion to get the conversation going!</p>
                <button 
                  className={styles.createButton}
                  onClick={handleOpenCreateDialog}
                >
                  Create Discussion
                </button>
              </div>
            )}
          </>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <>
            {filteredMembers.length > 0 ? (
              <>
                <div className={styles.membersGrid}>
                  {displayedMembers.map((member) => (
                    <div key={member.user_id || member.id} className={styles.memberCard}>
                      <div className={styles.memberAvatar}>
                        {(member.full_name || member.username)?.charAt(0).toUpperCase() || '?'}
                        <div className={styles.onlineIndicator} 
                             style={{backgroundColor: Math.random() > 0.7 ? '#10b981' : '#9ca3af'}}></div>
                      </div>
                      <div className={styles.memberInfo}>
                        <h4>{member.full_name || member.username || 'Unknown User'}</h4>
                        <p className={styles.memberRole}>
                          {member.current_membership?.membership_type === 'key_access' ? 'Key Access Member' : 
                           member.current_membership?.membership_type === 'creative_workspace' ? 'Creative Workspace Member' : 
                           'Community Member'}
                        </p>
                        {Array.isArray(member.current_interests) && member.current_interests.length > 0 && (
                          <div className={styles.memberInterests}>
                            {member.current_interests.slice(0, 3).map((interest, index) => (
                              <span className={styles.interestTag} key={index}>
                                {interest.interest_type || interest}
                              </span>
                            ))}
                            {member.current_interests.length > 3 && (
                              <span className={styles.interestTag}>+{member.current_interests.length - 3}</span>
                            )}
                          </div>
                        )}
                        <button 
                          className={styles.messageButton}
                          onClick={() => handleOpenMessageDialog(member)}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredMembers.length > 8 && (
                  <button 
                    className={styles.viewMoreButton}
                    onClick={() => setViewMore({...viewMore, members: !viewMore.members})}
                  >
                    {viewMore.members ? 'View Less' : 'View More Members'}
                  </button>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="64" 
                  height="64" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <h3>No members found</h3>
                <p>Try modifying your search criteria</p>
              </div>
            )}
          </>
        )}

        {/* Messages Tab - Replaced with direct navigation */}
        {activeTab === 'messages' && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Redirecting to messages...</p>
          </div>
        )}
      </div>

      {/* Message Dialog */}
      {openDialog && selectedMember && (
        <div className={styles.modalOverlay} onClick={handleCloseMessageDialog}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWithAvatar}>
                <div className={styles.modalAvatar}>
                  {(selectedMember.full_name || selectedMember.username)?.charAt(0).toUpperCase() || '?'}
                </div>
                <h3>Message {selectedMember.full_name || selectedMember.username}</h3>
              </div>
              <button 
                className={styles.closeButton}
                onClick={handleCloseMessageDialog}
                disabled={sending}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              {sendSuccess ? (
                <div className={styles.successMessage}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <p>Message sent successfully!</p>
                </div>
              ) : (
                <>
                  {sendError && <div className={styles.errorMessage}>{sendError}</div>}
                  <textarea
                    className={styles.messageInput}
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sending}
                    rows={5}
                    autoFocus
                  />
                </>
              )}
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={handleCloseMessageDialog}
                disabled={sending}
              >
                Cancel
              </button>
              {!sendSuccess && (
                <button 
                  className={styles.sendButton}
                  onClick={handleSendMessage}
                  disabled={sending || !message.trim()}
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Discussion Dialog */}
      {createDialogOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseCreateDialog}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Start a New Discussion</h3>
              <button 
                className={styles.closeButton}
                onClick={handleCloseCreateDialog}
                disabled={submitting}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Title</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Enter a title for your discussion"
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion({...newDiscussion, title: e.target.value})}
                  disabled={submitting}
                  autoFocus
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Content</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Describe your discussion topic..."
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({...newDiscussion, content: e.target.value})}
                  disabled={submitting}
                  rows={6}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={handleCloseCreateDialog}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className={styles.createButton}
                onClick={handleCreateDiscussion}
                disabled={submitting || !newDiscussion.title.trim()}
              >
                {submitting ? 'Creating...' : 'Create Discussion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityComponent; 