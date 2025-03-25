

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css"; 

const MembersList = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch("http://localhost:8000/auth/all-community-members/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch members");
        }
        const data = await response.json();
        setMembers(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={styles.card} style={{ margin: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
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
                onClick={() => navigate(`/members/${member.id}`)}
              >
                Connect
              </button>
            </div>
          ))
        ) : (
          <p>No members found.</p>
        )}
      </div>
    </div>
  );
};

export default MembersList;