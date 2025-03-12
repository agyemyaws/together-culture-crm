import Sidebar from './Sidebar';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainContent}>
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 