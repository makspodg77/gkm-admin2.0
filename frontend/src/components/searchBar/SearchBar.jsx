import React from "react";
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
  addButtonTitle = "Dodaj nowy",
}) => {
  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchWrapper}>
        <Input
          placeholder={placeholder}
          type="search"
          height="48px"
          width="100%"
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
            <FaTimes />
          </button>
        )}
      </div>
      {addButtonLink && (
        <div className={styles.addButtonWrapper}>
          <Link to={addButtonLink} className={styles.addButtonLink}>
            <Button
              height="100%"
              width="100%"
              title={addButtonTitle}
              className={styles.addButton}
            >
              <span className={styles.plusIcon}>+</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
