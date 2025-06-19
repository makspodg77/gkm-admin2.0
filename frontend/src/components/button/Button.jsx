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
  align = "center", // domyślnie center dla wszystkich przycisków
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

  // Określ klasę wariantu
  let variantClass = styles.primary;
  if (variant === "secondary") variantClass = styles.secondary;
  else if (variant === "outline") variantClass = styles.outline;
  else if (variant === "custom") variantClass = ""; // dla niestandardowych kolorów

  // Określ klasę wyrównania
  const alignmentClass = align ? styles[`align-${align}`] : "";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${styles.button} ${className} ${variantClass} ${alignmentClass}`}
      style={{
        width: width || "",
        height: height || "",
        backgroundColor:
          variant === "custom"
            ? generateOutline(color, isHovered).backgroundColor
            : "",
        color: variant === "custom" ? generateOutline(color).color : "",
        outline: variant === "custom" ? generateOutline(color).outline : "",
        transition: "all 0.2s ease",
        position: centered ? "relative" : "static",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      title={title}
    >
      <div
        className={styles.children}
        style={{
          fontSize,
          ...(centered
            ? {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }
            : {}),
        }}
      >
        {children}
      </div>
    </button>
  );
};

export default Button;
