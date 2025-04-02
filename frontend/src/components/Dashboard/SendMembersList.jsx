import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";
import fetchWithAuth from "../utils/auth"; // Import fetchWithAuth

const SendMembersList = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={styles.card} style={{ margin: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3 className={styles.sectionTitle}>All Members</h3>
        <button
          className={styles.eventAction}
          onClick={() => navigate("/dashboard")}
          style={{ backgroundColor: "#e6f0ff", color: "#0066ff" }}
        >
          Back to Dashboard
        </button>
      </div>
      <div className={styles.eventList}>
        {members.length > 0 ? (
          members.map((member) => (
            <div key={member.id} className={styles.eventItem}>
              <div
                className={styles.eventIcon}
                style={{ backgroundColor: "#e6f0ff", color: "#0066ff" }}
              >
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
                  aria-hidden="true"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className={styles.eventInfo}>
                <h4 className={styles.eventTitle}>{member.full_name}</h4>
                <p className={styles.eventMeta}>
                  Interests:{" "}
                  {member.current_interests
                    .map((interest) => interest.interest_type)
                    .join(", ")}
                </p>
                <p className={styles.eventMeta}>Location: {member.location}</p>
                <p className={styles.eventMeta}>Email: {member.email}</p>
              </div>
              <button
                className={styles.eventAction}
                onClick={() => handleOpenDialog(member)}
              >
               Send Message
              </button>
            </div>
          ))
        ) : (
          <p>No members found.</p>
        )}
      </div>

      {/* Custom Dialog for Sending a Message */}
      {openDialog && selectedMember && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Send a Message to {selectedMember.full_name}</h3>
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
                  Message sent successfully!
                </div>
              ) : (
                <>
                  {sendError && (
                    <div className={styles.errorMessage}>{sendError}</div>
                  )}
                  <textarea
                    className={styles.messageInput}
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sending}
                    rows={4}
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

export default SendMembersList;