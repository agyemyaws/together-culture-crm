import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";
import fetchWithAuth from "../utils/auth"; 

const CreateDiscussion = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth("http://localhost:8000/community/discussions/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.title?.[0] || "Failed to create discussion");
      }
      
      // Get the newly created discussion data
      const discussionData = await response.json();
      
      // Store indication that we created a discussion
      sessionStorage.setItem('discussionCreated', 'true');
      sessionStorage.setItem('newDiscussionId', discussionData.id);
      
      // Navigate to discussions list
      navigate("/discussions");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.card} style={{ margin: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 className={styles.sectionTitle}>Create a New Discussion</h3>
        <button
          className={styles.eventAction}
          onClick={() => navigate("/discussions")}
          style={{ backgroundColor: "#f0f0f0", color: "#333" }}
        >
          Back to Discussions
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="title" style={{ display: "block", marginBottom: "0.5rem" }}>
            Discussion Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter discussion title"
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "1rem",
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="content" style={{ display: "block", marginBottom: "0.5rem" }}>
            Discussion Content (Optional)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Provide details for your discussion..."
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "1rem",
              minHeight: "100px",
              resize: "vertical"
            }}
          />
        </div>
        
        {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}
        <button
          type="submit"
          className={styles.eventAction}
          disabled={loading || !title.trim()}
        >
          {loading ? "Creating..." : "Create Discussion"}
        </button>
      </form>
    </div>
  );
};

export default CreateDiscussion;