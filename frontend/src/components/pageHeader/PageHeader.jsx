import React from "react";
import styles from "./PageHeader.module.css";
import Button from "../button/Button";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const PageHeader = ({
  title,
  subtitle = "",
  icon = null,
  actions = [],
  showBackButton = true,
  backUrl = null,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={styles.pageHeader}>
      <div className={styles.headerContent}>
        <div className={styles.titleSection}>
          {showBackButton && (
            <Button
              variant="secondary"
              onClick={handleBack}
              className={styles.backButton}
            >
              <FaArrowLeft /> Wróć
            </Button>
          )}

          <div className={styles.titleWrapper}>
            {icon && <div className={styles.titleIcon}>{icon}</div>}
            <div>
              <h1 className={styles.title}>{title}</h1>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          </div>
        </div>

        {actions.length > 0 && (
          <div className={styles.actionsWrapper}>
            {actions.map((action, index) => (
              <React.Fragment key={index}>{action}</React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
