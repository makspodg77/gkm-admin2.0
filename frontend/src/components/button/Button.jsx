import { useState } from "react";
import styles from "./Button.module.css";

const Button = ({
  children,
  onClick,
  type = "button",
  width,
  color,
  fontSize = "16px",
  height,
  variant = "primary",
  align = "center",
  centered = false,
  className = "",
  disabled = false,
  title,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const generateOutline = (
    color = "var(--color-primary, #0A3F89)",
    hovered = false
  ) => {
    return {
      backgroundColor: `${color}${hovered ? "66" : "33"}`,
      outline: `2px solid ${color}`,
      color: color,
    };
  };

  let variantClass = styles.primary;
  if (variant === "secondary") variantClass = styles.secondary;
  else if (variant === "outline") variantClass = styles.outline;
  else if (variant === "custom") variantClass = "";

  const alignClass =
    styles[`align${align.charAt(0).toUpperCase() + align.slice(1)}`];

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${styles.button} ${variantClass} ${alignClass} ${className}`}
      disabled={disabled}
      style={{
        width,
        height,
        fontSize,
        ...(variant === "custom" && color
          ? generateOutline(color, isHovered)
          : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={title}
    >
      {centered ? (
        <div className={styles.centered}>{children}</div>
      ) : (
        <div className={styles.children}>{children}</div>
      )}
    </button>
  );
};

export default Button;
