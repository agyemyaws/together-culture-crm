import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants";
import api from "../api";
import Modal from "./profile setup/Modal";
import { useUser } from "../context/UserContext";

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user, isLoading: userLoading } = useUser();
  const token = localStorage.getItem(ACCESS_TOKEN);

  useEffect(() => {
    const checkProfile = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/profile/");
        
        // Check if user is an admin or superuser
        const isAdmin = response.data?.is_staff || response.data?.is_superuser;
        
        // Only require profile completion for non-admin users
        // Check if the profile is essentially empty (just auto-created)
        if ((!response.data?.full_name || response.data.full_name === '') && !isAdmin) {
          setShowProfileModal(true);
        }
      } catch (error) {
        console.error("Profile error:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem(ACCESS_TOKEN); // Clear invalid token
          setIsLoading(false);
          return;
        }
        
        // If the backend returns any error, check if we need to show the profile modal
        if (user && !user.isAdmin && (!user.fullName || user.fullName === '')) {
          setShowProfileModal(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Only check profile if we're not already loading user data from context
    if (!userLoading) {
      // If we already have user data and user is admin, don't check profile
      if (user && user.isAdmin) {
        setIsLoading(false);
      } else {
        checkProfile();
      }
    } else {
      // If UserContext is handling loading, sync with it
      setIsLoading(userLoading);
    }
  }, [token, userLoading, user]);

  // Wait for both local loading and user context loading to complete
  if (isLoading || userLoading) {
    return <div>Loading...</div>;
  }

  // Check if we have a token or user data
  if (!token && !user) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      {children}
      {showProfileModal && <Modal />}
    </>
  );
};

export default ProtectedRoute;