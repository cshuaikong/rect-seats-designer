import React from "react";
import styles from "./navbar.module.css";

type NavBarProps = {
  children: React.ReactNode;
};

const NavBar: React.FC<NavBarProps> = ({ children }) => (
  <nav className={styles.navbar}>
    <div className={styles.toolbar}>
      {children}
    </div>
  </nav>
);

export default NavBar;
