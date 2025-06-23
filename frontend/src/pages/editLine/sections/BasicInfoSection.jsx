import styles from "../ReviewStep.module.css";
import Divider from "../../../components/divider/Divider";

const BasicInfoSection = ({ data, lineTypes, showDivider = false }) => {
  const getLineTypeName = () => {
    const lineTypeId = data?.lineTypeId || data?._ui?.lineTypeId;

    if (!lineTypeId) {
      return "Nieznany typ linii";
    }

    const lineType = lineTypes?.find((lt) => lt.id === lineTypeId);

    if (!lineType) {
      console.warn(`Nie znaleziono typu linii o ID: ${lineTypeId}`);
      return "Nieznany typ linii";
    }

    return lineType.name_singular || "Nieznany typ linii";
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Informacje podstawowe</h3>
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Nazwa/numer linii:</div>
          <div className={styles.infoValue}>{data?.name || "—"}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Typ linii:</div>
          <div className={styles.infoValue}>{getLineTypeName()}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Rodzaj trasy:</div>
          <div className={styles.infoValue}>
            {data?.routeType === "circular" ? "Okrężna" : "Dwukierunkowa"}
          </div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Linia nocna:</div>
          <div className={styles.infoValue}>
            {data?.isNight ? "Tak" : "Nie"}
          </div>
        </div>
      </div>
      {showDivider && <Divider />}
    </div>
  );
};

export default BasicInfoSection;
