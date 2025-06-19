import React, { forwardRef } from "react";
import styles from "./Input.module.css";

const Input = forwardRef(
  (
    {
      type = "text",
      placeholder = "",
      value,
      onChange,
      width = "100%",
      height = "48px",
      icon,
      label,
      field, // Formik prop
      form, // Formik prop
      className, // Dodaj obsługę zewnętrznej klasy
      ...props
    },
    ref
  ) => {
    // Extract Formik props if present
    const fieldProps = field || {};

    // Połącz klasy CSS - wewnętrzne i zewnętrzne
    const containerClass = `${styles.container} ${className || ""}`;

    // Special case for checkbox type
    if (type === "checkbox") {
      return (
        <label className={styles.checkboxContainer}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={value !== undefined ? value : fieldProps.value}
            onChange={onChange || fieldProps.onChange}
            name={props.name || fieldProps.name}
            ref={ref}
            {...props}
          />
          {label && <span className={styles.checkboxLabel}>{label}</span>}
        </label>
      );
    }

    // Regular input
    return (
      <div className={containerClass} style={{ width, height }}>
        <input
          type={type}
          className={styles.input}
          placeholder={placeholder}
          value={value !== undefined ? value : fieldProps.value}
          onChange={onChange || fieldProps.onChange}
          name={props.name || fieldProps.name}
          ref={ref}
          style={{ width, height }}
          {...props}
          {...fieldProps}
        />
        {icon && <div className={styles.icon}>{icon}</div>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
