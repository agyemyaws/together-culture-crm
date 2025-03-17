import { useState } from 'react';
import { useUser } from '../context/UserContext';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { user, updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    location: user?.location || '',
    bio: user?.bio || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // TODO: Add API call to update profile
      await updateUser(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      location: user?.location || '',
      bio: user?.bio || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Profile</h1>
        {!isEditing && (
          <button 
            className={styles.editButton}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className={styles.card}>
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
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
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
              />
            </div>

            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.saveButton}>
                Save Changes
              </button>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={handleCancel}
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
              <p>{user.bio || 'No bio provided'}</p>
            </div>

            <div className={styles.infoGroup}>
              <h3>Membership</h3>
              <p>{user.membership}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 