import styles from "./SearchBar.module.css";
import Input from "../input/Input";
import Button from "../button/Button";
import { Link } from "react-router-dom";
import { FaSearch, FaTimes } from "react-icons/fa";

const SearchBar = ({
  placeholder = "Wyszukaj...",
  value,
  onChange,
  onClear,
  addButtonLink,
}) => (
  <div className={styles.searchContainer}>
    <div className={styles.searchWrapper}>
      <Input
        placeholder={placeholder}
        type="text"
        height="48px"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        icon={<FaSearch className={styles.searchIcon} />}
      />
      {value && (
        <button
          className={styles.clearButton}
          onClick={onClear}
          aria-label="Wyczyść wyszukiwanie"
        >
          <FaTimes size={14} />
        </button>
      )}
    </div>

    {addButtonLink && (
      <div className={styles.addButtonWrapper}>
        <Link to={addButtonLink} className={styles.addButtonLink}>
          <Button className={styles.addButton}>
            <span className={styles.plusIcon}>+</span>
          </Button>
        </Link>
      </div>
    )}
  </div>
);

export default SearchBar;
