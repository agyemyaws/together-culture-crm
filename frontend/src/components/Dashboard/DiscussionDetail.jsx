

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

  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const response = await fetch(`http://localhost:8000/auth/discussions/${id}/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch discussion");
        }
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
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!updatedResponse.ok) {
        throw new Error("Failed to refresh discussion");
      }
      const updatedDiscussion = await updatedResponse.json();
      setDiscussion(updatedDiscussion);
      setReplyContent("");
      setReplyLoading(false);
    } catch (err) {
      setReplyError(err.message);
      setReplyLoading(false);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 className={styles.sectionTitle}>{discussion.title}</h3>
        <button
          className={styles.eventAction}
          onClick={() => navigate("/dashboard")}
          style={{ backgroundColor: "#f0f0f0", color: "#333" }}
        >
          Back to Dashboard
        </button>
      </div>
      <div className={styles.activityItem}>
        <div className={styles.activityHeader}>
          <p className={styles.progressText}>Started by {discussion.author}</p>
          <span className={styles.activityType}>{discussion.replies_count} replies</span>
        </div>
      </div>

   
      <div style={{ marginTop: "1rem" }}>
        <h4 className={styles.sectionTitle}>Replies</h4>
        {discussion.replies.length > 0 ? (
          discussion.replies.map((reply) => (
            <div key={reply.id} className={styles.activityItem} style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #eee", borderRadius: "4px" }}>
              <div className={styles.activityHeader}>
                <p className={styles.progressText}>Reply by {reply.author}</p>
                <span className={styles.activityType}>
                  {new Date(reply.created_at).toLocaleString()}
                </span>
              </div>
              <p>{reply.content}</p>
            </div>
          ))
        ) : (
          <p>No replies yet. Be the first to reply!</p>
        )}
      </div>

    
      <div style={{ marginTop: "2rem" }}>
        <h4 className={styles.sectionTitle}>Add a Reply</h4>
        <form onSubmit={handleReplySubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="replyContent" style={{ display: "block", marginBottom: "0.5rem" }}>
              Your Reply
            </label>
            <textarea
              id="replyContent"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Enter your reply"
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "1rem",
                minHeight: "100px",
              }}
              required
            />
          </div>
          {replyError && <p style={{ color: "red", marginBottom: "1rem" }}>{replyError}</p>}
          <button
            type="submit"
            className={styles.eventAction}
            disabled={replyLoading}
          >
            {replyLoading ? "Posting..." : "Post Reply"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DiscussionDetail;