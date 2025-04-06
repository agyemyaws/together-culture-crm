import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";

const DiscussionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [discussion, setDiscussion] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyError, setReplyError] = useState(null);
  const [replyLoading, setReplyLoading] = useState(false);
  const [animateReply, setAnimateReply] = useState(false);
  const newReplyRef = useRef(null);

  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const response = await fetch(`http://localhost:8000/auth/discussions/${id}/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch discussion");
        const discussionData = await response.json();
        setDiscussion(discussionData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchDiscussion();
  }, [id]);

  // Scroll to the latest reply when a new one is added
  useEffect(() => {
    if (animateReply && newReplyRef.current) {
      newReplyRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [animateReply]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    setReplyLoading(true);
    setReplyError(null);

    try {
      const response = await fetch(`http://localhost:8000/auth/discussions/${id}/reply/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ content: replyContent }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.content?.[0] || "Failed to post reply");
      }

      const updatedResponse = await fetch(`http://localhost:8000/auth/discussions/${id}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      if (!updatedResponse.ok) throw new Error("Failed to refresh discussion");
      const updatedDiscussion = await updatedResponse.json();
      setDiscussion(updatedDiscussion);
      setReplyContent("");
      setReplyLoading(false);
      setAnimateReply(true);
      setTimeout(() => setAnimateReply(false), 1000);
    } catch (err) {
      setReplyError(err.message);
      setReplyLoading(false);
    }
  };

  const handleLike = async (replyId) => {
    try {
      const response = await fetch(`http://localhost:8000/auth/replies/${replyId}/like/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to like reply");
      const { data } = await response.json();
      setDiscussion((prev) => ({
        ...prev,
        replies: prev.replies.map((reply) =>
          reply.id === replyId ? { ...reply, ...data } : reply
        ),
      }));
    } catch (err) {
      console.error("Error liking reply:", err.message);
      setError("Failed to update like status");
    }
  };

  const handleDislike = async (replyId) => {
    try {
      const response = await fetch(`http://localhost:8000/auth/replies/${replyId}/dislike/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to dislike reply");
      const { data } = await response.json();
      setDiscussion((prev) => ({
        ...prev,
        replies: prev.replies.map((reply) =>
          reply.id === replyId ? { ...reply, ...data } : reply
        ),
      }));
    } catch (err) {
      console.error("Error disliking reply:", err.message);
      setError("Failed to update dislike status");
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading discussion...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Error: {error}</p>
        <button className={styles.eventAction} onClick={() => navigate("/community")}>
          Back to Community
        </button>
      </div>
    );
  }

  return (
    <div className={styles.discussionDetailContainer}>
      {/* Discussion Header */}
      <div className={styles.discussionDetailHeader}>
        <div className={styles.headerContent}>
          <button className={styles.backButton} onClick={() => navigate("/community")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
            <span>Back to Community</span>
          </button>
          <h2 className={styles.discussionDetailTitle}>{discussion.title}</h2>
          <div className={styles.discussionMeta}>
            <div className={styles.authorInfo}>
              <div className={styles.authorAvatar}>
                {discussion.author.charAt(0).toUpperCase()}
              </div>
              <span className={styles.authorName}>{discussion.author}</span>
              <span className={styles.discussionDate}>{formatDate(discussion.created_at)}</span>
            </div>
            <div className={styles.discussionStats}>
              <span className={styles.replyCount}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {discussion.replies_count} {discussion.replies_count === 1 ? "reply" : "replies"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.discussionDetailContent}>
        <div className={styles.discussionMainContent}>
          <p className={styles.discussionBody}>{discussion.content}</p>
        </div>

        {/* Replies Section */}
        <div className={styles.repliesSection}>
          <h3 className={styles.repliesSectionTitle}>
            Replies ({discussion.replies_count})
          </h3>
          
          <div className={styles.repliesList}>
            {discussion.replies.length > 0 ? (
              discussion.replies.map((reply, index) => (
                <div
                  key={reply.id}
                  ref={index === discussion.replies.length - 1 && animateReply ? newReplyRef : null}
                  className={`${styles.replyCard} ${index === discussion.replies.length - 1 && animateReply ? styles.newReplyAnimation : ""}`}
                >
                  <div className={styles.replyHeader}>
                    <div className={styles.replyAuthor}>
                      <div className={styles.replyAvatar}>
                        {reply.author.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.authorDetails}>
                        <span className={styles.authorName}>{reply.author}</span>
                        <span className={styles.replyDate}>
                          {formatDate(reply.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.replyBody}>
                    <p className={styles.replyContent}>{reply.content}</p>
                  </div>
                  <div className={styles.replyActions}>
                    <button
                      className={`${styles.actionButton} ${reply.liked_by_me ? styles.liked : ""}`}
                      onClick={() => handleLike(reply.id)}
                      title={reply.liked_by_me ? "Unlike" : "Like"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={reply.liked_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                      </svg>
                      <span>{reply.likes_count || ''}</span>
                    </button>
                    <button
                      className={`${styles.actionButton} ${reply.disliked_by_me ? styles.disliked : ""}`}
                      onClick={() => handleDislike(reply.id)}
                      title={reply.disliked_by_me ? "Undislike" : "Dislike"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={reply.disliked_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm10-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
                      </svg>
                      <span>{reply.dislikes_count || ''}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyReplies}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <p>No replies yet. Be the first to reply!</p>
              </div>
            )}
          </div>
        </div>

        {/* Reply Form */}
        <div className={styles.replyFormSection}>
          <h3 className={styles.replySectionTitle}>Add Your Reply</h3>
          <form onSubmit={handleReplySubmit} className={styles.replyForm}>
            <div className={styles.formGroup}>
              <textarea
                id="replyContent"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Share your thoughts..."
                className={styles.replyTextarea}
                required
              />
            </div>
            {replyError && <p className={styles.errorMessage}>{replyError}</p>}
            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={replyLoading || !replyContent.trim()}
              >
                {replyLoading ? (
                  <>
                    <span className={styles.spinnerSmall}></span>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    <span>Post Reply</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetail;