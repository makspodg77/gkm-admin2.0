import React from "react";
import styles from "./StepIndicator.module.css";

const StepIndicator = ({ steps, currentStep }) => {
  return (
    <div className={styles.stepIndicator}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div
            className={`${styles.step} ${
              index + 1 === currentStep
                ? styles.active
                : index + 1 < currentStep
                ? styles.completed
                : ""
            }`}
          >
            <div className={styles.stepNumber}>{index + 1}</div>
            <div className={styles.stepText}>{step}</div>
          </div>

          {index < steps.length - 1 && (
            <div
              className={`${styles.connector} ${
                index + 1 < currentStep ? styles.active : ""
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;
