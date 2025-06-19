import { Link, useLocation } from "react-router-dom";
import styles from "./Breadcrumbs.module.css";
import { FaChevronRight, FaHome } from "react-icons/fa";

const routes = {
  "/": "Strona główna",
  "/stop": "Przystanki",
  "/line": "Linie",
  "/line-type": "Typy linii",
  new: "Nowy",
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname
    .split("/")
    .filter((segment) => segment);

  // Nie pokazuj na stronie głównej
  if (location.pathname === "/") return null;

  return (
    <div className={styles.breadcrumbs}>
      <Link to="/" className={styles.breadcrumbItem}>
        <FaHome /> Strona główna
      </Link>

      {pathSegments.map((segment, index) => {
        const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
        const isLast = index === pathSegments.length - 1;

        // Sprawdź, czy segment to ID
        const isId = !isNaN(segment) || segment === "new";
        const label =
          routes[segment] || routes[isId ? "new" : segment] || segment;

        return (
          <div key={path} className={styles.breadcrumbItem}>
            <FaChevronRight className={styles.separator} />
            {isLast ? (
              <span className={styles.current}>{label}</span>
            ) : (
              <Link to={path}>{label}</Link>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Breadcrumbs;
