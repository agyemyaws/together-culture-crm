import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { ACCESS_TOKEN } from '../constants';

// Create context outside of any component
const UserContext = createContext(null);

// Define the hook
function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Define the provider component 
function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const formatMembershipType = (membership) => {
    if (!membership) return 'Community Member';
    
    switch (membership.toLowerCase()) {
      case 'community':
        return 'Community Member';
      case 'key_access':
        return 'Key Access Member';
      case 'creative_workspace':
        return 'Creative Workspace Member';
      case 'admin':
        return 'Admin';
      default:
        return 'Community Member';
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        return null;
      }

      const response = await api.get('/auth/profile/');
      
      console.log('Profile API response:', response.data);

      // Get current membership type from current_membership
      const membershipType = response.data.current_membership?.membership_type || 'community';
      
      // Check and log pending membership request data
      console.log('Raw pending membership data:', response.data.pending_membership_request);
      
      const pendingMembership = response.data.pending_membership_request 
        ? { 
            id: response.data.pending_membership_request.id,
            membership_type: response.data.pending_membership_request.membership_type 
          } 
        : null;
        
      console.log('Processed pending membership:', pendingMembership);
      
      const isAdmin = response.data.is_staff || response.data.is_superuser;

      // Check if this is an auto-created profile that needs to be filled out
      const isEmptyProfile = !response.data.full_name || response.data.full_name === '';

      // Extract interests properly
      let interests = [];
      try {
        if (response.data.current_interests && Array.isArray(response.data.current_interests)) {
          // Extract only interest_type from each interest object
          interests = response.data.current_interests
            .filter(interest => interest && typeof interest === 'object')
            // Only include interests without an end_date (active interests)
            .filter(interest => interest.end_date === null)
            .map(interest => interest.interest_type)
            .filter(Boolean);
        }
      } catch (error) {
        console.error('Error extracting interests:', error);
      }

      const userData = {
        id: response.data.id,
        fullName: response.data.full_name || '',
        email: response.data.email || '',
        phoneNumber: response.data.phone_number || '',
        location: response.data.location || '',
        bio: response.data.bio || '',
        membership: isAdmin ? 'admin' : membershipType,
        pendingMembership: pendingMembership,
        membershipHistory: response.data.membership_history || [],
        interests: interests, // Use the extracted interests array
        isAdmin: isAdmin,
        isEmptyProfile: isEmptyProfile
      };

      // If user is admin, set admin mode to true by default
      if (isAdmin) {
        setIsAdminMode(true);
        localStorage.setItem('adminMode', 'true');
      } else {
        setIsAdminMode(false);
        localStorage.setItem('adminMode', 'false');
      }

      return userData;
    } catch (error) {
      console.error("Error fetching user profile", error);
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
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log('Loaded user from localStorage:', parsedUser);
            setUser(parsedUser);
            
            // Always set admin mode to true for admin users by default
            if (parsedUser.isAdmin) {
              setIsAdminMode(true);
              localStorage.setItem('adminMode', 'true');
              console.log('Setting admin mode to true for admin user');
            }
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            localStorage.removeItem('user'); // Remove invalid data
          }
        }

        // Fetch fresh data from API
        const freshUserData = await fetchUserProfile();
        if (freshUserData) {
          console.log('Setting fresh user data:', freshUserData);
          setUser(freshUserData);
          
          // Always set admin mode to true for admin users by default
          if (freshUserData.isAdmin) {
            setIsAdminMode(true);
            localStorage.setItem('adminMode', 'true');
            console.log('Setting admin mode to true for admin user from fresh data');
          }
          
          // Store the updated user data in localStorage
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
      } else if (event.key === 'adminMode') {
        setIsAdminMode(event.newValue === 'true');
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
    setIsAdminMode(false);
    localStorage.clear();
  };

  const toggleAdminMode = () => {
    if (user && user.isAdmin) {
      const newAdminMode = !isAdminMode;
      setIsAdminMode(newAdminMode);
      localStorage.setItem('adminMode', newAdminMode.toString());
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      updateUser, 
      logout, 
      isLoading,
      formatMembershipType,
      isAdminMode,
      toggleAdminMode
    }}>
      {children}
    </UserContext.Provider>
  );
}

// Export both using named exports
export { UserProvider, useUser }; 