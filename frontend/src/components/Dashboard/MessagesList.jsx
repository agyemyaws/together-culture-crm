import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";
import fetchWithAuth from "../utils/auth";

const MessagesList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessageId, setForwardMessageId] = useState(null);
  const [forwardUsername, setForwardUsername] = useState("");
  const [forwardError, setForwardError] = useState(null);
  const [forwardSuccess, setForwardSuccess] = useState(null);

  const navigate = useNavigate();
  const currentUser = localStorage.getItem("username");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetchWithAuth("http://localhost:8000/auth/messages/");
        if (!response.ok) throw new Error("Failed to fetch messages");
        const data = await response.json();
        setConversations(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setReplyContent("");
    setSendError(null);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      setSendError("Reply cannot be empty.");
      return;
    }
    if (!selectedConversation) {
      setSendError("No conversation selected.");
      return;
    }

    setSending(true);
    setSendError(null);

    const payload = {
      recipient_id: selectedConversation.other_user_id,
      content: replyContent,
      parent_message_id: selectedConversation.messages[selectedConversation.messages.length - 1].id,
    };

    try {
      const response = await fetchWithAuth("http://localhost:8000/auth/messages/send/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send reply");
      }

      const newMessage = await response.json();
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.other_user_id === selectedConversation.other_user_id
            ? { ...conv, messages: [...conv.messages, newMessage] }
            : conv
        )
      );
      setReplyContent("");
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleLikeMessage = async (messageId) => {
    try {
      const response = await fetchWithAuth(`http://localhost:8000/auth/messages/${messageId}/like/`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to like message");
      const result = await response.json();
      const updatedMessage = result.data;

      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.other_user_id === selectedConversation.other_user_id
            ? {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === messageId
                    ? { ...msg, liked_by_me: updatedMessage.liked_by_me, likes_count: updatedMessage.likes_count }
                    : msg
                ),
              }
            : conv
        )
      );
    } catch (err) {
      setSendError(err.message);
    }
  };

  const handleForwardMessage = async (messageId) => {
    setForwardMessageId(messageId);
    setShowForwardModal(true);
    setForwardError(null);
    setForwardSuccess(null);
    setForwardUsername("");
  };

  const submitForwardMessage = async () => {
    if (!forwardUsername.trim()) {
      setForwardError("Please enter a username");
      return;
    }

    try {
      const response = await fetchWithAuth(`http://localhost:8000/auth/messages/${forwardMessageId}/forward/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_username: forwardUsername }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to forward message");
      }

      setForwardSuccess("Message forwarded successfully!");
      setTimeout(() => {
        setShowForwardModal(false);
        setForwardSuccess(null);
      }, 2000);
    } catch (err) {
      setForwardError(err.message);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isDifferentDay = (date1, date2) => {
    const d1 = new Date(date1).setHours(0, 0, 0, 0);
    const d2 = new Date(date2).setHours(0, 0, 0, 0);
    return d1 !== d2;
  };

  if (loading) return <div className={styles.loading}>Loading messages...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.messagesContainer}>
      {!selectedConversation ? (
        <div className={styles.chatList}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 className={styles.sectionTitle}>Messages</h3>
            <button className={styles.backButtonStyled} onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
          {conversations.length > 0 ? (
            conversations
              .sort((a, b) => {
                const lastMessageA = a.messages[a.messages.length - 1];
                const lastMessageB = b.messages[b.messages.length - 1];
                return new Date(lastMessageB.timestamp) - new Date(lastMessageA.timestamp);
              })
              .map((conversation) => {
                const latestMessage = conversation.messages[conversation.messages.length - 1];
                return (
                  <div
                    key={conversation.other_user_id}
                    className={styles.chatItem}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div className={styles.chatAvatar}>
                      {conversation.other_user_username.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.chatInfo}>
                      <span className={styles.chatName}>{conversation.other_user_username}</span>
                      <span className={styles.chatPreview}>
                        {latestMessage.sender === currentUser ? "You: " : ""}
                        {latestMessage.content?.slice(0, 50) || "Voice call"}...
                      </span>
                    </div>
                    <span className={styles.chatTime}>
                      {formatTime(latestMessage.timestamp)}
                    </span>
                  </div>
                );
              })
          ) : (
            <p className={styles.noMessages}>No messages found.</p>
          )}
        </div>
      ) : (
        <div className={styles.threadContainer}>
          <div className={styles.threadHeader}>
            <button className={styles.backButton} onClick={handleBackToList}>
              ←
            </button>
            <h3 className={styles.threadTitle}>{selectedConversation.other_user_username}</h3>
          </div>
          <div className={styles.messageThread}>
            {selectedConversation.messages.map((message, index) => {
              const isSent = message.sender === currentUser;
              const showDateSeparator =
                index === 0 ||
                isDifferentDay(
                  selectedConversation.messages[index - 1].timestamp,
                  message.timestamp
                );

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className={styles.dateSeparator}>
                      {formatDate(message.timestamp)}
                    </div>
                  )}
                  {message.content ? (
                    <div
                      className={`${styles.messageContainer} ${isSent ? styles.sent : styles.received}`}
                    >
                      <div className={styles.messageContent}>
                        <p className={styles.messageText}>{message.content}</p>
                        <div className={styles.messageTimestamps}>
                          <span className={`${styles.messageTime} ${styles.sentTime}`}>
                            Sent: {formatTime(message.sent_timestamp)}
                          </span>
                          <span className={`${styles.messageTime} ${styles.receivedTime}`}>
                            Received: {formatTime(message.received_timestamp)}
                          </span>
                          {isSent && (
                            <span className={styles.checkmark}>
                              ✓✓
                            </span>
                          )}
                        </div>
                        <div className={styles.messageActions}>
                          <button
                            className={`${styles.likeButton} ${message.liked_by_me ? styles.liked : ''}`}
                            onClick={() => handleLikeMessage(message.id)}
                            title="Love"
                          >
                            {message.liked_by_me ? '♥' : '♡'} {message.likes_count > 0 && message.likes_count}
                          </button>
                          <button
                            className={styles.forwardButton}
                            onClick={() => handleForwardMessage(message.id)}
                            title="Forward"
                          >
                            ➡️
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.voiceCall}>
                      <span className={styles.voiceCallIcon}>📞</span>
                      Voice call • {message.duration || "1 min"} •{" "}
                      {isSent ? "Outgoing" : "Incoming"}
                      <div className={styles.messageTimestamps}>
                        <span className={`${styles.messageTime} ${styles.sentTime}`}>
                          Sent: {formatTime(message.sent_timestamp)}
                        </span>
                        <span className={`${styles.messageTime} ${styles.receivedTime}`}>
                          Received: {formatTime(message.received_timestamp)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className={styles.replyInputContainer}>
            {sendError && <div className={styles.errorMessage}>{sendError}</div>}
            <textarea
              className={styles.replyInput}
              placeholder="Type a message"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              disabled={sending}
              rows={3}
            />
            <button
              className={styles.sendButton}
              onClick={handleSendReply}
              disabled={sending || !replyContent.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {showForwardModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Forward Message</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowForwardModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              {forwardSuccess && (
                <div className={styles.successMessage}>{forwardSuccess}</div>
              )}
              {forwardError && (
                <div className={styles.errorMessage}>{forwardError}</div>
              )}
              <input
                type="text"
                className={styles.messageInput}
                placeholder="Enter recipient username"
                value={forwardUsername}
                onChange={(e) => setForwardUsername(e.target.value)}
                disabled={forwardSuccess}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowForwardModal(false)}
                disabled={forwardSuccess}
              >
                Cancel
              </button>
              <button
                className={styles.sendButton}
                onClick={submitForwardMessage}
                disabled={forwardSuccess || !forwardUsername.trim()}
              >
                Forward
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesList; 