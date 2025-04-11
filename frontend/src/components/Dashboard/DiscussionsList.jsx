import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";

const DiscussionsList = () => {
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check for newly created discussion
  useEffect(() => {
    const discussionCreated = sessionStorage.getItem('discussionCreated');
    if (discussionCreated === 'true') {
      // Clear the flag
      sessionStorage.removeItem('discussionCreated');
      // Force refresh by incrementing the trigger
      setRefreshTrigger(prev => prev + 1);
    }
  }, []);

  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        setLoading(true);
        const url = searchQuery
          ? `http://localhost:8000/community/discussions/?search=${encodeURIComponent(searchQuery)}`
          : "http://localhost:8000/community/discussions/";
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch discussions");
        const discussionsData = await response.json();
        setDiscussions(discussionsData);
        setLoading(false);
        
        // Check if we need to highlight a discussion
        const newDiscussionId = sessionStorage.getItem('newDiscussionId');
        if (newDiscussionId) {
          // Find the element and scroll to it after render
          setTimeout(() => {
            const element = document.getElementById(`discussion-${newDiscussionId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
              element.classList.add(styles.highlightNew);
              setTimeout(() => {
                element.classList.remove(styles.highlightNew);
              }, 3000);
            }
            sessionStorage.removeItem('newDiscussionId');
          }, 500);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchDiscussions();
  }, [searchQuery, refreshTrigger]);

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
            <div 
              key={discussion.id} 
              id={`discussion-${discussion.id}`} 
              className={styles.replyCard}
            >
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
          <div className={styles.noDiscussionsContainer}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ marginBottom: "1rem", color: "#9ca3af" }}
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p className={styles.noReplies}>No discussions found</p>
            <p style={{ margin: "0.5rem 0 1rem", color: "#6b7280" }}>
              Start a new discussion to get the conversation going!
            </p>
          </div>
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