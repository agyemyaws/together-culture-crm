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