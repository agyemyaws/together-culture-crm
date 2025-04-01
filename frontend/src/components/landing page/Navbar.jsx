import React from "react";
import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <div className={styles.container}>
      <Link to="/" className={styles.logo}>
        Together Culture
      </Link>
  
      <nav className={styles.nav}>
        <Link to="/events" className={styles.navLink}>
          Events
        </Link>
        <Link to="/login" className={styles.navLink}>
          Log In
        </Link>
      </nav>
    </div>
  );
};

export default Navbar;