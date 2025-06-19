import React from "react";
import styles from "./FilterButton.module.css";
import Button from "../button/Button";

const FilterButtons = ({ filters, activeFilter, onChange }) => {
  return (
    <div className={styles.filters}>
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? "primary" : "secondary"}
          onClick={() => onChange(filter.value)}
          className={styles.filterButton}
          align="center"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
};

export default FilterButtons;
