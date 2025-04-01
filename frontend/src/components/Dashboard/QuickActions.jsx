import styles from "./Dashboard.module.css";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 1,
      label: "Book a Space",
      path: "/book-space",
      ariaLabel: "Book a space for collaboration",
    },
    {
      id: 2,
      label: "Browse Courses",
      path: "/courses",
      ariaLabel: "Browse available courses",
    },
  ];

  const renderIcon = (actionId) => {
    switch (actionId) {
      case 1: // Book Space
        return (
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        );
      case 2: // Course
        return (
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
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
      <h3 className={styles.sectionTitle}>Quick Actions</h3>

      <div className={styles.quickActionsContainer}>
        {actions.map((action) => (
          <button
            key={action.id}
            className={styles.actionButton}
            onClick={() => navigate(action.path)}
            aria-label={action.ariaLabel}
          >
            <span className={styles.actionIcon}>{renderIcon(action.id)}</span>
            <span className={styles.actionLabel}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;