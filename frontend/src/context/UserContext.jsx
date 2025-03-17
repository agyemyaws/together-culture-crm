import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { ACCESS_TOKEN } from '../constants';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatMembershipType = (membership) => {
    if (!membership) return 'Community Member';
    
    switch (membership.toLowerCase()) {
      case 'community':
        return 'Community Member';
      case 'key_access':
        return 'Key Access Member';
      case 'creative_workspace':
        return 'Creative Workspace Member';
      default:
        return 'Community Member';
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        console.log('No token found, skipping profile fetch');
        return null;
      }

      const response = await api.get('/auth/profile/');
      console.log('Raw profile response:', response.data);

      // Get current membership type from current_membership
      const membershipType = response.data.current_membership?.membership_type || 'community';
      const pendingMembership = response.data.pending_membership_request;

      const userData = {
        id: response.data.id,
        fullName: response.data.full_name,
        email: response.data.email,
        phoneNumber: response.data.phone_number,
        location: response.data.location,
        bio: response.data.bio,
        membership: membershipType,
        currentMembership: response.data.current_membership,
        pendingMembership: pendingMembership,
        membershipHistory: response.data.membership_history || [],
        interests: response.data.current_interests || []
      };

      console.log('Processed user profile:', userData);
      return userData;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);
      try {
        // First try to load from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('Loaded user from localStorage:', parsedUser);
          setUser(parsedUser);
        }

        // Fetch fresh data from API
        const freshUserData = await fetchUserProfile();
        if (freshUserData) {
          console.log('Setting fresh user data:', freshUserData);
          setUser(freshUserData);
          localStorage.setItem('user', JSON.stringify(freshUserData));
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();

    // Listen for storage events
    const handleStorageChange = (event) => {
      if (event.key === 'user') {
        console.log('Storage changed, updating user');
        try {
          const newUser = event.newValue ? JSON.parse(event.newValue) : null;
          setUser(newUser);
        } catch (error) {
          console.error('Error parsing user data from storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateUser = (newUserData) => {
    console.log('Updating user with:', newUserData);
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    console.log('Logging out user');
    setUser(null);
    localStorage.clear();
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      updateUser, 
      logout, 
      isLoading,
      formatMembershipType 
    }}>
      {children}
    </UserContext.Provider>
  );
}; 