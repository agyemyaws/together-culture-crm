import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants";
import api from "../api";
import Modal from "./profile setup/Modal";

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const token = localStorage.getItem(ACCESS_TOKEN);

  useEffect(() => {
    const checkProfile = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/profile/");
        if (!response.data?.full_name) {
          setShowProfileModal(true);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setShowProfileModal(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkProfile();
  }, [token]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!token) {
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