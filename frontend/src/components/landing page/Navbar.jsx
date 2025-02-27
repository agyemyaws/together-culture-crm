import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <div className={styles.container}>
      <a href="/" className={styles.logo}>
        Together Culture
      </a>
      <nav className={styles.nav}>
        <a href="#events" className={styles.navLink}>
          Events
        </a>
        <a href="#join" className={styles.navLink}>
          Why Join
        </a>
        <a href="#login" className={styles.navLink}>
          Log In
        </a>
      </nav>
    </div>
  );
};

export default Navbar;
