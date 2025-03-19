import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import styles from './Header.module.css';

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const avatarButtonRef = useRef(null);
  const { user, logout, isLoading, formatMembershipType, isAdminMode, toggleAdminMode } = useUser();

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length < 2) return fullName.charAt(0).toUpperCase();
    return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
  };

  useEffect(() => {
    console.log('Header component - Current user:', user);
    console.log('Header component - Admin status:', user?.isAdmin);
    console.log('Header component - Admin mode status:', isAdminMode);
    console.log('Header component - Admin mode in localStorage:', localStorage.getItem('adminMode'));
    console.log('Header component - Loading state:', isLoading);
  }, [user, isLoading, isAdminMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !avatarButtonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    return path.substring(1).split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // Don't render if no user
  if (!user) {
    console.log('Header not rendering - No user data');
    return null;
  }

  const getMembershipInfo = () => {
    if (user.pendingMembership) {
      return `${formatMembershipType(user.membership)} (Upgrade Pending)`;
    }
    return formatMembershipType(user.membership);
  };

  return (
    <header className={styles.header}>
      <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
      <div className={styles.headerRight}>
        {user.isAdmin && (
          <div className={styles.adminModeContainer}>
            <span className={styles.adminModeLabel}>Admin Mode:</span>
            <div 
              className={`${styles.adminModeIndicator} ${isAdminMode ? styles.adminModeActive : ''}`}
              title={isAdminMode ? "You are in Admin mode" : "You are in User mode"}
            >
              {isAdminMode ? "ON" : "OFF"}
            </div>
          </div>
        )}
        
        <div className={styles.avatarContainer}>
          <button 
            ref={avatarButtonRef}
            className={styles.avatarButton} 
            onClick={toggleDropdown}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <div className={styles.avatar}>
              {getInitials(user.fullName)}
            </div>
          </button>
          
          {isDropdownOpen && (
            <div ref={dropdownRef} className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <span className={styles.userName}>{user.fullName}</span>
                <span className={styles.userRole}>{getMembershipInfo()}</span>
              </div>
              <div className={styles.dropdownDivider}></div>
              <a href="/profile" className={styles.dropdownItem}>
                My Profile
              </a>
              {user.isAdmin && (
                <a href="/admin" className={styles.dropdownItem}>
                  Admin Dashboard
                </a>
              )}
              <a href="/membership" className={styles.dropdownItem}>
                Upgrade Membership
              </a>
              <div className={styles.dropdownDivider}></div>
              <button 
                onClick={handleLogout}
                className={`${styles.dropdownItem} ${styles.signOutItem}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 