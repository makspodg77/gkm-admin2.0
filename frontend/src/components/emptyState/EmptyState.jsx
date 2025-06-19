import React from "react";
import styles from "./EmptyState.module.css";
import Button from "../button/Button";

const EmptyState = ({ icon: Icon, message, buttonText, onClick }) => {
  return (
    <div className={styles.emptyState}>
      {Icon && <Icon size={48} className={styles.emptyIcon} />}
      <p>{message}</p>
      {buttonText && onClick && (
        <Button variant="secondary" onClick={onClick}>
          {buttonText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
