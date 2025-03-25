

import styles from "./Dashboard.module.css";

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const CommunityEngagement = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const membersResponse = await fetch("http://localhost:8000/auth/community-members/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (!membersResponse.ok) {
          throw new Error("Failed to fetch members");
        }
        const membersData = await membersResponse.json();
        setMembers(membersData);

        const discussionsResponse = await fetch("http://localhost:8000/auth/recent-discussions/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (!discussionsResponse.ok) {
          throw new Error("Failed to fetch discussions");
        }
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
      <h3 className={styles.sectionTitle}>Community Engagement</h3>

      {/* Quick Actions */}
      <div style={{ marginBottom: "1.5rem" }}>
       
      </div>

      {/* Digital Connections Board Preview */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div className={styles.sectionTitle}>
          <span>Digital Connections Board</span>
          <a
            href="#"
            className={styles.viewAllLink}
            onClick={() => navigate("/members")}
          >
            View all →
          </a>
        </div>
        <div className={styles.eventList}>
          {members.map((member) => (
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
              </div>
              <button
                className={styles.eventAction}
                onClick={() => navigate(`/members/${member.id}`)}
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Discussions */}
      <div className={styles.card}>
        <div className={styles.sectionTitle}>
          <span>Recent Discussions</span>
          <a
            href="#"
            className={styles.viewAllLink}
            onClick={() => navigate("/discussions")}
          >
            View all →
          </a>
        </div>
        <div>
          {discussions.length > 0 ? (
            discussions.map((discussion) => (
              <div key={discussion.id} className={styles.activityItem}>
                <div className={styles.activityHeader}>
                  <h4 className={styles.activityTitle}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
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
                  <span className={styles.activityType}>
                    {discussion.replies_count} replies
                  </span>
                </div>
                <p className={styles.progressText}>
                  Started by {discussion.author}
                </p>
              </div>
            ))
          ) : (
            <p>No recent discussions found.</p>
          )}
          
          <div style={{ marginTop: "1rem", textAlign: "right" }}>
            <button
              className={styles.eventAction}
              onClick={() => navigate("/create-discussion")}
            >
              Start a Discussion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityEngagement;