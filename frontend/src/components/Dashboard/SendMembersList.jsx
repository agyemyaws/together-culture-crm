import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";
import fetchWithAuth from "../utils/auth"; // Import fetchWithAuth

const SendMembersList = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // State for the dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetchWithAuth("http://localhost:8000/auth/all-community-members/");
        if (!response.ok) {
          throw new Error("Failed to fetch members");
        }
        const data = await response.json();
        console.log("API Response for members:", data);
        setMembers(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const handleOpenDialog = (member) => {
    setSelectedMember(member);
    setOpenDialog(true);
    setMessage("");
    setSendError(null);
    setSendSuccess(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMember(null);
    setMessage("");
    setSendError(null);
    setSendSuccess(false);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setSendError("Message cannot be empty.");
      return;
    }

    if (!selectedMember || !selectedMember.user_id) {
      setSendError("No recipient selected.");
      return;
    }

    setSending(true);
    setSendError(null);
    setSendSuccess(false);

    const payload = {
      recipient_id: selectedMember.user_id,
      content: message,
    };
    console.log("Sending message payload:", payload);

    try {
      const response = await fetchWithAuth("http://localhost:8000/auth/messages/send/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Error response from server:", errorData);
        throw new Error(errorData.error || "Failed to send message");
      }

      setSendSuccess(true);
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    const fullName = member.full_name?.toLowerCase() || '';
    const email = member.email?.toLowerCase() || '';
    const interests = member.current_interests 
      ? member.current_interests.map(i => i.interest_type?.toLowerCase()).join(' ') 
      : '';
    const location = member.location?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || 
           email.includes(query) || 
           interests.includes(query) || 
           location.includes(query);
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Error: {error}</p>
        <button className={styles.eventAction} onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={styles.card} style={{ margin: "1.5rem" }}>
      <div className={styles.membersListHeader}>
        <h3 className={styles.sectionTitle}>All Members</h3>
        <div className={styles.memberActions}>
          <div className={styles.searchContainer}>
            <svg 
              className={styles.searchIcon} 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
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
              placeholder="Search members by name, email, interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button
            className={styles.backButton}
            onClick={() => navigate("/dashboard")}
            style={{ backgroundColor: "#e6f0ff", color: "#0066ff" }}
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
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className={styles.membersGrid}>
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <div key={member.id} className={styles.memberCard}>
              <div className={styles.memberAvatar}>
                {member.full_name?.charAt(0).toUpperCase() || '?'}
                <div className={styles.onlineIndicator} 
                     style={{backgroundColor: Math.random() > 0.7 ? '#10b981' : '#9ca3af'}}></div>
              </div>
              <div className={styles.memberInfo}>
                <h4>{member.full_name || 'Unknown User'}</h4>
                <p className={styles.memberRole}>
                  {member.current_membership?.membership_type === 'key_access' ? 'Key Access Member' : 
                   member.current_membership?.membership_type === 'creative_workspace' ? 'Creative Workspace Member' : 
                   'Community Member'}
                </p>
                <p className={styles.memberEmail}>{member.email}</p>
                {member.location && <p className={styles.memberLocation}>{member.location}</p>}
                
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
                  onClick={() => handleOpenDialog(member)}
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
          ))
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
      </div>

      {/* Message Dialog */}
      {openDialog && selectedMember && (
        <div className={styles.modalOverlay} onClick={handleCloseDialog}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWithAvatar}>
                <div className={styles.modalAvatar}>
                  {selectedMember.full_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <h3>Message {selectedMember.full_name}</h3>
              </div>
              <button 
                className={styles.closeButton}
                onClick={handleCloseDialog}
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
                onClick={handleCloseDialog}
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
    </div>
  );
};

export default SendMembersList;