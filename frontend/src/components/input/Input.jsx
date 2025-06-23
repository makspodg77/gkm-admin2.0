import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { debounce } from "lodash";
import styles from "./Input.module.css";

const Input = forwardRef((props, ref) => {
  const {
    type = "text",
    placeholder = "",
    value,
    onChange,
    width = "100%",
    height = "48px",
    icon,
    label,
    field,
    className = "",
    debounceTime = 300,
    ...restProps
  } = props;

  const fieldProps = field || {};
  const controlledValue = value !== undefined ? value : fieldProps.value;
  const [internalValue, setInternalValue] = useState(controlledValue || "");

  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== internalValue) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const debouncedHandler = useRef(
    debounce((newValue) => {
      const event = {
        target: { value: newValue },
        currentTarget: { value: newValue },
      };
      onChange ? onChange(event) : fieldProps.onChange?.(event);
    }, debounceTime)
  ).current;

  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      debouncedHandler(newValue);
    },
    [debouncedHandler]
  );

  useEffect(() => () => debouncedHandler.cancel(), [debouncedHandler]);

  if (type === "checkbox") {
    return (
      <label className={styles.checkboxContainer}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={controlledValue}
          onChange={onChange || fieldProps.onChange}
          ref={ref}
          name={restProps.name || fieldProps.name}
          {...restProps}
        />
        {label && <span className={styles.checkboxLabel}>{label}</span>}
      </label>
    );
  }

  return (
    <div
      className={`${styles.container} ${className}`}
      style={{ width, height }}
    >
      <input
        type={type === "search" ? "text" : type}
        className={styles.input}
        placeholder={placeholder}
        value={internalValue}
        onChange={handleChange}
        ref={ref}
        style={{ width, height, WebkitAppearance: "none" }}
        name={restProps.name || fieldProps.name}
        autoComplete="off"
        results="0"
        {...restProps}
      />
      {icon && <div className={styles.icon}>{icon}</div>}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
