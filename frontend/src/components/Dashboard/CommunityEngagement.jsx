import styles from "./Dashboard.module.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const CommunityEngagement = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("members");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const membersResponse = await fetch("http://localhost:8000/auth/community-members/", {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        });
        if (!membersResponse.ok) throw new Error("Failed to fetch members");
        const membersData = await membersResponse.json();
        setMembers(membersData);

        const discussionsResponse = await fetch("http://localhost:8000/auth/recent-discussions/", {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        });
        if (!discussionsResponse.ok) throw new Error("Failed to fetch discussions");
        const discussionsData = await discussionsResponse.json();
        setDiscussions(discussionsData);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
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

    const payload = { recipient_id: selectedMember.user_id, content: message };
    try {
      const response = await fetch("http://localhost:8000/auth/messages/send/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }
      setSendSuccess(true);
      setTimeout(() => handleCloseDialog(), 1500);
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  const filteredMembers = members.filter((member) =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.current_interests.some((interest) =>
      interest.interest_type.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredDiscussions = discussions.filter((discussion) =>
    discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (discussion.content && discussion.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>Loading community...</p>
    </div>
  );

  if (error) return (
    <div className={styles.errorContainer}>
      <h3>Error</h3>
      <p>{error}</p>
      <button className={styles.eventAction} onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );

  return (
    <div className={styles.communityContainer}>
      {/* Header */}
      <div className={styles.communityHeader}>
        <h2>Community Hub</h2>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search members, discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div> 

      {/* Quick Actions */}
      <div className={styles.quickActionsContainer}>
        <button className={styles.actionButton} onClick={() => navigate("/messages")}>
          <svg className={styles.actionIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span className={styles.actionLabel}>Messages</span>
        </button>
        <button className={styles.actionButton} onClick={() => navigate("/discussions")}>
          <svg className={styles.actionIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span className={styles.actionLabel}>Discussions</span>
        </button>
        <button className={styles.actionButton} onClick={() => navigate("/create-discussion")}>
          <svg className={styles.actionIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span className={styles.actionLabel}>New Discussion</span>
        </button>
        <button className={styles.actionButton} onClick={() => navigate("/members")}>
          <svg className={styles.actionIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span className={styles.actionLabel}>Compose Message</span>
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === "members" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("members")}
        >
          Members ({filteredMembers.length})
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "discussions" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("discussions")}
        >
          Discussions ({filteredDiscussions.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
      {activeTab === "members" && (
  <div className={styles.membersGrid}>
    {filteredMembers.slice(0, 6).map((member) => (
      <div key={member.user_id} className={styles.card}>
        <div className={styles.memberAvatar}>
          {(member.full_name || member.username)?.charAt(0).toUpperCase() || "?"}
        </div>
        <h4 className={styles.sectionTitle}>
        {member.full_name || member.username || "Unknown Member"}
        </h4>
        <p className={styles.eventMeta}>
         interest : 
          {member.current_interests && Array.isArray(member.current_interests)
            ? member.current_interests.map((i) => i.interest_type).join(", ")
            : "No interests"}
        </p>
        <button
          className={styles.eventAction}
          onClick={() => handleOpenDialog(member)}
        >
          Message
        </button>
      </div>
    ))}
    {filteredMembers.length > 6 && (
      <button className={styles.viewAllLink} onClick={() => navigate("/members")}>
        View All Members →
      </button>
    )}
  </div>
)}
        

        {activeTab === "discussions" && (
          <div className={styles.discussionsList}>
            {filteredDiscussions.slice(0, 4).map((discussion) => (
              <div key={discussion.id} className={styles.card}>
                <h4 className={styles.sectionTitle}>{discussion.title}</h4>
                <p className={styles.eventMeta}>
                  {discussion.content?.substring(0, 100)}... • {discussion.replies_count} replies
                </p>
                <button
                  className={styles.eventAction}
                  onClick={() => navigate(`/discussions/${discussion.id}`)}
                >
                  Join
                </button>
              </div>
            ))}
            {filteredDiscussions.length > 4 && (
              <button className={styles.viewAllLink} onClick={() => navigate("/discussions")}>
                View All Discussions →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Message Dialog */}
      {openDialog && selectedMember && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Message {selectedMember.full_name}</h3>
              <button className={styles.closeButton} onClick={handleCloseDialog} disabled={sending}>
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              {sendSuccess ? (
                <div className={styles.successMessage}>Message sent!</div>
              ) : (
                <>
                  {sendError && <div className={styles.errorMessage}>{sendError}</div>}
                  <textarea
                    className={styles.replyTextarea}
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sending}
                  />
                </>
              )}
            </div>
            <div className={styles.modalActions}>
              {!sendSuccess && (
                <button
                  className={styles.submitButton}
                  onClick={handleSendMessage}
                  disabled={sending || !message.trim()}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityEngagement;