import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout/Layout';
import styles from './ProfilePage.module.css';
import api from '../api';

const ProfilePage = () => {
  const { user, updateUser, isLoading: userLoading } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    location: '',
    bio: '',
    interests: []
  });

  // Define the available interest options like in CompleteProfile
  const interestOptions = [
    {
      value: "caring",
      label: "Caring",
      description: "Supporting and nurturing community growth",
    },
    {
      value: "sharing",
      label: "Sharing",
      description: "Exchanging knowledge and resources",
    },
    {
      value: "creating",
      label: "Creating",
      description: "Making and designing new things",
    },
    {
      value: "experiencing",
      label: "Experiencing",
      description: "Exploring and discovering opportunities",
    },
    {
      value: "working",
      label: "Working",
      description: "Professional development and collaboration",
    },
  ];

  // Function to handle interest selection
  const handleInterestToggle = (interestValue) => {
    const updatedInterests = [...formData.interests];

    if (updatedInterests.includes(interestValue)) {
      // Remove interest if already selected
      const index = updatedInterests.indexOf(interestValue);
      updatedInterests.splice(index, 1);
    } else {
      // Add interest if not selected
      updatedInterests.push(interestValue);
    }

    setFormData(prev => ({
      ...prev,
      interests: updatedInterests
    }));
  };

  // Function to fetch fresh profile data including interests
  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/auth/profile/');
      
      // Extract interests properly
      let interests = [];
      if (response.data.current_interests && Array.isArray(response.data.current_interests)) {
        interests = response.data.current_interests.map(interest => interest.interest_type);
      }
      
      // Update the interests in form data and user context
      if (interests.length > 0) {
        setFormData(prev => ({ ...prev, interests }));
        updateUser({ interests });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching profile data');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle fallback interests when none are found
  const handleMissingInterests = () => {
    const fallbackInterests = [
      'caring',
      'sharing',
      'creating',
      'experiencing',
      'working'
    ];
    
    setFormData(prev => ({ ...prev, interests: fallbackInterests }));
    updateUser({ interests: fallbackInterests });
    
    return fallbackInterests;
  };

  useEffect(() => {
    // Log what data we have at component mount
    console.log('ProfilePage mounted or updated');
    console.log('Current user state:', user);
    console.log('Is loading?', isLoading);
    
    if (user) {
      console.log('User data available in context:', user);
      console.log('User interests from context:', user.interests);
      
      // Set form data from user context
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        location: user.location || '',
        bio: user.bio || '',
        interests: user.interests || []
      });
      
      // If no interests in user context, fetch them or use fallbacks
      if (!user.interests || user.interests.length === 0) {
        console.log('No interests in user context, fetching from API or using fallbacks');
        fetchProfileData();
      }
    } else {
      console.log('No user data in context, fetching from API');
      // If no user at all, fetch everything
      fetchProfileData();
    }
  }, [user, updateUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Get the current interests from user context for comparison
      const currentInterests = user.interests || [];
      
      // Determine which interests were removed (exist in current but not in formData)
      const removedInterests = currentInterests.filter(
        interest => !formData.interests.includes(interest)
      );
      
      // Determine which interests are new (exist in formData but not in current)
      const addedInterests = formData.interests.filter(
        interest => !currentInterests.includes(interest)
      );
      
      // Determine which interests are unchanged (exist in both)
      const unchangedInterests = formData.interests.filter(
        interest => currentInterests.includes(interest)
      );
      
      console.log('Interest changes:', {
        removed: removedInterests,
        added: addedInterests,
        unchanged: unchangedInterests
      });
      
      // Format the data for the API
      // Only send the interests that need changes
      const apiData = {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        location: formData.location,
        bio: formData.bio,
        // Include specially formatted interests data to indicate what changed
        interests_update: {
          removed: removedInterests, // These should get end dates
          added: addedInterests,     // These should be newly created
          unchanged: unchangedInterests // These should be preserved as-is
        }
      };
      
      console.log('Updating profile with data:', apiData);
      
      // Call API to update the profile
      const response = await api.put('/auth/profile/', apiData);
      
      if (response.status === 200) {
        // Update the user context with the new data
        updateUser({
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          location: formData.location,
          bio: formData.bio,
          interests: formData.interests
        });
        
        // Exit edit mode
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile');
      // Could add error state and display to user here
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      location: user?.location || '',
      bio: user?.bio || '',
      interests: user?.interests || []
    });
    setIsEditing(false);
  };

  // Format an interest for display
  const formatInterest = (interest) => {
    if (!interest) return '';
    
    // Find the matching option
    const option = interestOptions.find(option => option.value === interest);
    return option ? option.label : interest;
  };

  if (!user || isLoading || userLoading) {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your profile...</p>
        </div>
      </Layout>
    );
  }

  // Ensure interests is always an array
  const interests = Array.isArray(user.interests) ? user.interests : [];

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1>My Profile</h1>
            <p className={styles.subtitle}>Manage your personal information and account preferences</p>
          </div>
          {!isEditing && (
            <button 
              className={styles.editButton}
              onClick={() => setIsEditing(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Profile
            </button>
          )}
        </div>

        <div className={styles.profileGrid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Personal Information</h2>
              <p className={styles.cardSubtitle}>Your personal details</p>
            </div>
            {isEditing ? (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    required
                    readOnly
                  />
                  <small className={styles.inputNote}>Email cannot be changed</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter your location"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Tell us a bit about yourself"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Interests</label>
                  <div className={styles.interestsList}>
                    {interestOptions.map((interest) => (
                      <div
                        key={interest.value}
                        className={`${styles.interestOption} ${
                          formData.interests.includes(interest.value) ? styles.selected : ""
                        }`}
                        onClick={() => handleInterestToggle(interest.value)}
                      >
                        <div className={styles.interestContent}>
                          <div className={styles.interestCheckbox}>
                            {formData.interests.includes(interest.value) && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                          <div>
                            <h4 className={styles.interestTitle}>{interest.label}</h4>
                            <p className={styles.interestDescription}>{interest.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.buttonGroup}>
                  <button 
                    type="submit" 
                    className={styles.saveButton}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className={styles.spinner}></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17 21 17 13 7 13 7 21"></polyline>
                          <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className={styles.cancelButton}
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.profileInfo}>
                <div className={styles.infoGroup}>
                  <h3>Full Name</h3>
                  <p>{user.fullName}</p>
                </div>

                <div className={styles.infoGroup}>
                  <h3>Email</h3>
                  <p>{user.email}</p>
                </div>

                <div className={styles.infoGroup}>
                  <h3>Phone Number</h3>
                  <p>{user.phoneNumber || 'Not provided'}</p>
                </div>

                <div className={styles.infoGroup}>
                  <h3>Location</h3>
                  <p>{user.location || 'Not provided'}</p>
                </div>

                <div className={styles.infoGroup}>
                  <h3>Bio</h3>
                  <p className={styles.bio}>{user.bio || 'No bio provided'}</p>
                </div>

                <div className={styles.infoGroup}>
                  <h3>Interests</h3>
                  <div className={styles.interestsList}>
                    {!interests || interests.length === 0 ? (
                      <p>No interests provided</p>
                    ) : (
                      <div className={styles.interestTags}>
                        {interests.map((interest, index) => (
                          <span key={index} className={styles.interestTag}>
                            {formatInterest(interest)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Membership</h2>
              <p className={styles.cardSubtitle}>Your membership information</p>
            </div>
            <div className={styles.membershipInfo}>
              {/* Current Membership */}
              <div className={styles.membershipHeader}>
                <div className={styles.membershipBadge}>
                  {user.membership}
                </div>
                
                {/* Show pending membership request if exists */}
                {user.pendingMembership && (
                  <div className={styles.pendingMembershipBadge}>
                    Pending: {user.pendingMembership.membership_type}
                  </div>
                )}
              </div>

              {/* Membership Description */}
              <p className={styles.membershipDescription}>
                {user.membership === 'community' && 'You are a community member with access to basic features.'}
                {user.membership === 'creative_workspace' && 'You have full access to creative workspace and all platform features.'}
                {user.membership === 'key_access' && 'You have key access to physical spaces and enhanced features.'}
              </p>
              
              {/* Add info about pending request */}
              {user.pendingMembership && (
                <p className={styles.pendingNote}>
                  Your request to upgrade to {user.pendingMembership.membership_type} is pending approval.
                  An administrator will review your request soon.
                </p>
              )}
              
              <a href="/membership" className={styles.upgradeButton}>
                Manage Membership
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage; 