import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";

const DiscussionsList = () => {
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        const url = searchQuery
          ? `http://localhost:8000/auth/discussions/?search=${encodeURIComponent(searchQuery)}`
          : "http://localhost:8000/auth/discussions/";
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch discussions");
        const discussionsData = await response.json();
        setDiscussions(discussionsData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchDiscussions();
  }, [searchQuery]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading discussions...</p>
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
      <div className={styles.discussionHeader}>
        <div>
          <h3 className={styles.discussionTitle}>All Discussions</h3>
          <div className={styles.discussionMeta}>
            <span>{discussions.length} discussions</span>
          </div>
        </div>
        <button className={styles.backButton} onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>

      <div className={styles.searchSection} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search discussions by title or author..."
          className={styles.replyTextarea} 
          style={{ width: "100%", padding: "0.5rem" }}
        />
      </div>

      <div className={styles.repliesSection}>
        {discussions.length > 0 ? (
          discussions.map((discussion) => (
            <div key={discussion.id} className={styles.replyCard}>
              <div className={styles.replyHeader}>
                <div className={styles.replyAuthor}>
                  <div className={styles.avatar}>
                    {discussion.author.charAt(0).toUpperCase()}
                  </div>
                  <span>{discussion.author}</span>
                </div>
                <span className={styles.replyDate}>
                  {new Date(discussion.created_at).toLocaleString()}
                </span>
              </div>
              <h4 className={styles.activityTitle}>
                <button
                  onClick={() => navigate(`/discussions/${discussion.id}`)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    font: "inherit",
                    cursor: "pointer",
                    color: "#0066ff",
                    textDecoration: "underline",
                  }}
                >
                  {discussion.title}
                </button>
              </h4>
              <div className={styles.replyActions}>
                <span className={styles.replyCount}>
                  {discussion.replies_count} {discussion.replies_count === 1 ? "reply" : "replies"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.noReplies}>No discussions found.</p>
        )}
      </div>

      <div style={{ marginTop: "1rem", textAlign: "right" }}>
        <button
          className={styles.eventAction}
          onClick={() => navigate("/create-discussion")}
        >
          Start a Discussion
        </button>
      </div>
    </div>
  );
};

export default DiscussionsList;