import { useState, useEffect } from "react";
import icon from "../../assets/herb.png";
import returnIcon from "../../assets/return.svg";
import logoutIcon from "../../assets/logout.svg";
import homeIcon from "../../assets/home.svg";
import styles from "./Navbar.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    if (window.confirm("Czy na pewno chcesz się wylogować?")) {
      logout();
      navigate("/login");
      if (mobileMenuOpen) setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav
      className={`${styles.nav} ${isScrolled ? styles.navScrolled : ""}`}
      role="navigation"
      aria-label="Menu główne"
    >
      <div className={styles.navContent}>
        <div className={styles.navLeft}>
          <div className={styles.logoContainer}>
            <img src={icon} alt="GKM" className={styles.icon} />
            <p className={styles.text}>Goleniowska Komunikacja Miejska</p>
          </div>
          <div className={styles.colorStripes}>
            <div className={styles.stripe1}></div>
            <div className={styles.stripe2}></div>
            <div className={styles.stripe3}></div>
          </div>
        </div>

        <button
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          aria-label="Menu mobilne"
          aria-expanded={mobileMenuOpen}
        >
          <div
            className={`${styles.hamburger} ${
              mobileMenuOpen ? styles.active : ""
            }`}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        <div
          className={`${styles.navRight} ${
            mobileMenuOpen ? styles.mobileOpen : ""
          }`}
        >
          {user && (
            <div className={styles.userInfo}>
              <span className={styles.username}>"Użytkownik"</span>
            </div>
          )}

          <div className={styles.navLinks}>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={styles.navLink}
            >
              <img src={homeIcon} alt="" className={styles.linkIcon} />
              <span className={styles.linkText}>Strona główna</span>
            </Link>

            <a
              href="https://goleniowkm.pl/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className={styles.navLink}
            >
              <img src={returnIcon} alt="" className={styles.linkIcon} />
              <span className={styles.linkText}>Strona publiczna</span>
            </a>

            <button
              onClick={handleLogout}
              className={`${styles.navLink} ${styles.logoutButton}`}
            >
              <img src={logoutIcon} alt="" className={styles.linkIcon} />
              <span className={styles.linkText}>Wyloguj</span>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            className={styles.backdrop}
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
