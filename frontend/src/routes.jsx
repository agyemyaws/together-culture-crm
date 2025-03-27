import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/landingPage";
import LoginPage from "./pages/loginPage";
import SignupPage from "./pages/SignupPage";
import CompleteProfilePage from "./pages/completeProfilePage";
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from './pages/ProfilePage';
import MembershipPage from './pages/MembershipPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import PasswordResetRequest from './components/auth/PasswordResetRequest';
import PasswordResetConfirm from './components/auth/PasswordResetConfirm';
import MembersList from "./components/Dashboard/MembersList";
import CreateDiscussion from "./components/Dashboard/CreateDiscussion";
import DiscussionDetail from "./components/Dashboard/DiscussionDetail";
import DiscussionsList from "./components/Dashboard/DiscussionsList";
import MessagesList from "./components/Dashboard/MessagesList";
import { ACCESS_TOKEN } from './constants';
import { useUser } from './context/UserContext';

const Logout = () => {
  localStorage.clear();
  return <Navigate to="/login" />;
};

// Admin Route component that checks if the user is an admin
const AdminRoute = ({ children }) => {
  const { user, isLoading, isAdminMode } = useUser();
  
  console.log('AdminRoute - Admin check:', {
    user: user?.username || user?.email || 'No user',
    isAdmin: user?.isAdmin,
    isAdminMode,
    adminModeInStorage: localStorage.getItem('adminMode')
  });
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user || !user.isAdmin) {
    console.log('AdminRoute - Redirecting: Not an admin user');
    return <Navigate to="/dashboard" />;
  }

  if (!isAdminMode) {
    console.log('AdminRoute - Redirecting: Admin mode not active');
    return <Navigate to="/dashboard" />;
  }
  
  console.log('AdminRoute - Access granted to admin area');
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/join" element={<SignupPage />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/password-reset" element={<PasswordResetRequest />} />
      <Route path="/password-reset/:uidb64/:token" element={<PasswordResetConfirm />} />

      {/* Protected Routes */}
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <CompleteProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/membership"
        element={
          <ProtectedRoute>
            <MembershipPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <MembersList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-discussion"
        element={
          <ProtectedRoute>
            <CreateDiscussion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/discussions/:id"
        element={
          <ProtectedRoute>
            <DiscussionDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/discussions/:id"
        element={
          <ProtectedRoute>
            <DiscussionDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/discussions"
        element={
          <ProtectedRoute>
            <DiscussionsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MessagesList />
          </ProtectedRoute>
        }
      />
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />

      {/* Catch all - redirect to landing page */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes; 