import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/events', label: 'Events', icon: '📅' },
    { path: '/digital-content', label: 'Digital Content', icon: '📱' },
    { path: '/benefits', label: 'Benefits', icon: '🎁' },
    { path: '/community', label: 'Community', icon: '👥' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <h2>Together Culture</h2>
      </div>
      <nav className={styles.navigation}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.navItem} ${
              location.pathname === item.path ? styles.active : ''
            }`}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar; 