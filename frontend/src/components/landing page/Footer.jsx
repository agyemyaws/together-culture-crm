import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.divider}></div>
      <div className={styles.content}>
        <nav className={styles.nav}>
          <a href="#" className={styles.link}>
            About Us
          </a>
          <a href="#" className={styles.link}>
            Contact
          </a>
          <a href="#" className={styles.link}>
            Privacy Policy
          </a>
          <a href="#" className={styles.link}>
            Terms of Service
          </a>
        </nav>
        <p className={styles.copyright}>
          © 2025 Together Culture. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
