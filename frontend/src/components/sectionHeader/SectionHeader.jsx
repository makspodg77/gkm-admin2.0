import styles from "./SectionHeader.module.css";
import { FaSyncAlt } from "react-icons/fa";

const SectionHeader = ({
  title,
  icon: Icon,
  count,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionTitleWrapper}>
        {Icon && <Icon className={styles.sectionIcon} />}
        <h2 className={styles.sectionTitle}>{title}</h2>
        {count !== undefined && <span className={styles.counter}>{count}</span>}
      </div>
      {onRefresh && (
        <button
          className={styles.refreshButton}
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Odśwież dane"
        >
          <FaSyncAlt className={isLoading ? styles.spinning : ""} />
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
