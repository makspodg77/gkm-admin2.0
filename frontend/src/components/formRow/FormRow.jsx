import styles from "./FormRow.module.css";

const FormRow = ({ text, children, width = "100%", fontSize = "32px" }) => {
  return (
    <div className={`${styles.formRow}`} style={{ width }}>
      <div className={`${styles.left}`} style={{ fontSize }}>
        {text}
      </div>
      <div className={`${styles.right}`}>{children}</div>
    </div>
  );
};

export default FormRow;
