import { useState, useEffect } from "react";
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
        <button className={styles.eventAction} onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={styles.discussionContainer}>
      {/* Discussion Header */}
      <div className={styles.discussionHeader}>
        <div>
          <h3 className={styles.discussionTitle}>{discussion.title}</h3>
          <div className={styles.discussionMeta}>
            <span>Started by {discussion.author}</span>
            <span className={styles.replyCount}>
              {discussion.replies_count} {discussion.replies_count === 1 ? "reply" : "replies"}
            </span>
          </div>
        </div>
        <button className={styles.backButton} onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>

      {/* Replies Section */}
      <div className={styles.repliesSection}>
        <h4 className={styles.sectionTitle}>Replies</h4>
        {discussion.replies.length > 0 ? (
          discussion.replies.map((reply) => (
            <div
              key={reply.id}
              className={`${styles.replyCard} ${animateReply ? styles.replyAnimation : ""}`}
            >
              <div className={styles.replyHeader}>
                <div className={styles.replyAuthor}>
                  <div className={styles.avatar}>
                    {reply.author.charAt(0).toUpperCase()}
                  </div>
                  <span>{reply.author}</span>
                </div>
                <span className={styles.replyDate}>
                  {new Date(reply.created_at).toLocaleString()}
                </span>
              </div>
              <p className={styles.replyContent}>{reply.content}</p>
              <div className={styles.replyActions}>
                <button
                  className={`${styles.likeButton} ${reply.liked_by_me ? styles.liked : ""}`}
                  onClick={() => handleLike(reply.id)}
                  title={reply.liked_by_me ? "Unlike" : "Like"}
                >
                  👍 {reply.likes_count || 0}
                </button>
                <button
                  className={`${styles.dislikeButton} ${reply.disliked_by_me ? styles.disliked : ""}`}
                  onClick={() => handleDislike(reply.id)}
                  title={reply.disliked_by_me ? "Undislike" : "Dislike"}
                >
                  👎 {reply.dislikes_count || 0}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.noReplies}>No replies yet. Be the first to reply!</p>
        )}
      </div>

      {/* Reply Form */}
      <div className={styles.replyFormSection}>
        <h4 className={styles.sectionTitle}>Add a Reply</h4>
        <form onSubmit={handleReplySubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="replyContent" className={styles.formLabel}>
              Your Reply
            </label>
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
          <button
            type="submit"
            className={styles.submitButton}
            disabled={replyLoading}
          >
            {replyLoading ? <span className={styles.spinner}></span> : "Post Reply"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DiscussionDetail;