import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Messages.module.css";
import api from "../../api";

const ImprovedMessagesList = () => {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [typing, setTyping] = useState(false);
  const messageThreadRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const navigate = useNavigate();
  const currentUser = localStorage.getItem("username");

  // Fetch messages on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8000/auth/messages/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch messages");
        const data = await response.json();
        setConversations(data);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch messages");
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Add polling for new messages (simulating real-time)
    const intervalId = setInterval(() => {
      if (!sending) fetchMessages();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [sending]);

  // Scroll to bottom of message thread when new messages arrive
  useEffect(() => {
    if (messageThreadRef.current && selectedConversation) {
      messageThreadRef.current.scrollTop = messageThreadRef.current.scrollHeight;
    }
  }, [selectedConversation]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation =>
    conversation.other_user_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setReplyContent("");
    setSendError(null);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  const handleReplyChange = (e) => {
    setReplyContent(e.target.value);
    
    // Simulate typing indicator
    setTyping(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
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
        throw new Error(errorData.error || "Failed to send reply");
      }

      const newMessage = await response.json();
      
      // Update conversations with new message
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.other_user_id === selectedConversation.other_user_id
            ? { ...conv, messages: [...conv.messages, newMessage] }
            : conv
        )
      );
      
      setReplyContent("");
    } catch (err) {
      setSendError(err.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleLikeMessage = async (messageId) => {
    try {
      const response = await fetch(`http://localhost:8000/auth/messages/${messageId}/like/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
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
      console.error("Error liking message:", err);
    }
  };

  const handleForwardMessage = (messageId) => {
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
      const response = await fetch(`http://localhost:8000/auth/messages/${forwardMessageId}/forward/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
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
      setForwardError(err.message || "Failed to forward message");
    }
  };

  // Format date for better readability
  const formatDate = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if today
    if (messageDate.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
    // Check if yesterday
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Within last 7 days, show day name
    if (now - messageDate < 7 * 24 * 60 * 60 * 1000) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    // Otherwise show full date
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
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

  const getReadStatus = (message) => {
    const isSent = message.sender === currentUser;
    if (!isSent) return '';
    
    // Simulate read status based on time (in real app, this would come from server)
    const messageTime = new Date(message.timestamp).getTime();
    const now = new Date().getTime();
    const minutesSinceSent = (now - messageTime) / (1000 * 60);
    
    if (minutesSinceSent > 10) return 'read';
    if (minutesSinceSent > 2) return 'delivered';
    return 'sent';
  };

  // Convert read status to appropriate icon
  const getReadStatusIcon = (status) => {
    switch (status) {
      case 'read':
        return <span className={styles.readStatus}>✓✓</span>;
      case 'delivered':
        return <span className={styles.deliveredStatus}>✓✓</span>;
      case 'sent':
        return <span className={styles.sentStatus}>✓</span>;
      default:
        return null;
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  if (error && conversations.length === 0) {
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
        <h3>Failed to load messages</h3>
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

  return (
    <div className={styles.messagesContainer}>
      {!selectedConversation ? (
        <div className={styles.chatList}>
          <div className={styles.chatListHeader}>
            <h3 className={styles.chatListTitle}>Messages</h3>
            <button className={styles.backButton} onClick={() => navigate("/community")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
              Back to Community
            </button>
          </div>
          
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
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.conversationsList}>
            {filteredConversations.length > 0 ? (
              filteredConversations
                .sort((a, b) => {
                  const lastMessageA = a.messages[a.messages.length - 1];
                  const lastMessageB = b.messages[b.messages.length - 1];
                  return new Date(lastMessageB.timestamp) - new Date(lastMessageA.timestamp);
                })
                .map((conversation) => {
                  const latestMessage = conversation.messages[conversation.messages.length - 1];
                  const messageDate = new Date(latestMessage.timestamp);
                  const now = new Date();
                  const isToday = messageDate.toDateString() === now.toDateString();
                  
                  return (
                    <div
                      key={conversation.other_user_id}
                      className={styles.conversationItem}
                      onClick={() => handleSelectConversation(conversation)}
                    >
                      <div className={styles.conversationAvatar}>
                        {conversation.other_user_username.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.conversationInfo}>
                        <div className={styles.conversationHeader}>
                          <span className={styles.conversationName}>{conversation.other_user_username}</span>
                          <span className={styles.conversationTime}>
                            {isToday ? formatTime(latestMessage.timestamp) : formatDate(latestMessage.timestamp)}
                          </span>
                        </div>
                        <div className={styles.conversationPreview}>
                          {latestMessage.sender === currentUser && <span className={styles.sentLabel}>You: </span>}
                          <span className={styles.previewText}>
                            {latestMessage.content ? (
                              latestMessage.content.length > 35 
                                ? `${latestMessage.content.slice(0, 35)}...` 
                                : latestMessage.content
                            ) : (
                              "Voice call"
                            )}
                          </span>
                          {latestMessage.sender === currentUser && (
                            <span className={styles.messageStatus}>
                              {getReadStatusIcon(getReadStatus(latestMessage))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
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
                  <line x1="9" y1="9" x2="15" y2="9"></line>
                  <line x1="9" y1="13" x2="15" y2="13"></line>
                </svg>
                <h3>No messages found</h3>
                <p>{searchQuery ? "Try a different search term" : "Start a conversation from the Community page"}</p>
                <button 
                  className={styles.createButton}
                  onClick={() => navigate('/community')}
                >
                  Go to Community
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.conversationContainer}>
          <div className={styles.conversationHeader}>
            <button className={styles.backButton} onClick={handleBackToList}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <div className={styles.conversationUserInfo}>
              <div className={styles.conversationAvatar}>
                {selectedConversation.other_user_username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className={styles.conversationTitle}>{selectedConversation.other_user_username}</h3>
                <p className={styles.conversationStatus}>
                  {Math.random() > 0.5 ? (
                    <span className={styles.onlineStatus}>●&nbsp;Online</span>
                  ) : (
                    <span className={styles.offlineStatus}>Last seen today</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className={styles.messageThread} ref={messageThreadRef}>
            {selectedConversation.messages.map((message, index) => {
              const isSent = message.sender === currentUser;
              const showDateSeparator =
                index === 0 ||
                isDifferentDay(
                  selectedConversation.messages[index - 1].timestamp,
                  message.timestamp
                );
              const readStatus = getReadStatus(message);

              return (
                <div key={message.id} className={styles.messageWrapper}>
                  {showDateSeparator && (
                    <div className={styles.dateSeparator}>
                      {formatDate(message.timestamp)}
                    </div>
                  )}
                  {message.content ? (
                    <div
                      className={`${styles.messageContainer} ${isSent ? styles.sentMessage : styles.receivedMessage}`}
                    >
                      <div className={styles.messageContent}>
                        <p className={styles.messageText}>{message.content}</p>
                        <div className={styles.messageFooter}>
                          <span className={styles.messageTime}>
                            {formatTime(message.timestamp)}
                          </span>
                          {isSent && getReadStatusIcon(readStatus)}
                        </div>
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
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`${styles.voiceCallContainer} ${isSent ? styles.sentMessage : styles.receivedMessage}`}>
                      <div className={styles.voiceCall}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span className={styles.voiceCallText}>
                          {isSent ? "Outgoing call" : "Incoming call"} • {message.duration || "1:23"}
                        </span>
                        <span className={styles.messageTime}>
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {!isSender && typing && (
              <div className={`${styles.messageContainer} ${styles.receivedMessage}`}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>
          
          <div className={styles.replyInputContainer}>
            {sendError && <div className={styles.errorMessage}>{sendError}</div>}
            <div className={styles.replyInputWrapper}>
              <textarea
                className={styles.replyInput}
                placeholder="Type a message..."
                value={replyContent}
                onChange={handleReplyChange}
                disabled={sending}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <button
                className={styles.sendButton}
                onClick={handleSendReply}
                disabled={sending || !replyContent.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {showForwardModal && (
        <div className={styles.modalOverlay} onClick={() => setShowForwardModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
                <div className={styles.successMessage}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <p>{forwardSuccess}</p>
                </div>
              )}
              {forwardError && (
                <div className={styles.errorMessage}>{forwardError}</div>
              )}
              {!forwardSuccess && (
                <>
                  <p className={styles.modalText}>Enter the username of the person you want to forward this message to:</p>
                  <input
                    type="text"
                    className={styles.forwardInput}
                    placeholder="Username"
                    value={forwardUsername}
                    onChange={(e) => setForwardUsername(e.target.value)}
                  />
                </>
              )}
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowForwardModal(false)}
              >
                Cancel
              </button>
              {!forwardSuccess && (
                <button
                  className={styles.forwardModalButton}
                  onClick={submitForwardMessage}
                  disabled={!forwardUsername.trim()}
                >
                  Forward
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedMessagesList; 