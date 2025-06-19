import React from "react";
import styles from "./ConfirmationModal.module.css";
import Button from "../button/Button";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

const ConfirmationModal = ({
  title = "Potwierdź operację",
  message = "Czy na pewno chcesz wykonać tę operację?",
  confirmText = "Potwierdź",
  cancelText = "Anuluj",
  onConfirm,
  onCancel,
  isVisible,
  isDestructive = false,
}) => {
  if (!isVisible) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onCancel}></div>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {isDestructive && (
              <FaExclamationTriangle className={styles.warningIcon} />
            )}
            {title}
          </h3>
          <button className={styles.closeButton} onClick={onCancel}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? "outline" : "primary"}
            color={isDestructive ? "#dc3545" : undefined}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </>
  );
};

export default ConfirmationModal;
