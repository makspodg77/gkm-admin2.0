import styles from "./Card.module.css";

const Card = ({ children, width, className = "" }) => {
  return (
    <div
      className={`${styles.card} ${className}`}
      style={{ width: width ? width : "" }}
    >
      {children}
    </div>
  );
};

export default Card;
