import styles from "../ReviewStep.module.css";
import Divider from "../../../components/divider/Divider";

const VariantsSection = ({ data, showDivider = false }) => {
  const getStopName = (stopId) => {
    if (!data?.route1Stops) return "Nieznany przystanek";

    const stop = data.route1Stops.find((s) => Number(s.stop_number) === stopId);
    return stop?.stop_group?.name || "Nieznany przystanek";
  };

  const renderVariant = (variant, index) => {
    return (
      <div key={index} className={styles.variantItem}>
        <div
          className={styles.variantColor}
          style={{ backgroundColor: variant.color || "#ccc" }}
        ></div>
        <div className={styles.variantInfo}>
          <div className={styles.variantSignature}>
            {variant.signature || "Wariant podstawowy"}
            {variant.isDefault && (
              <span className={styles.defaultBadge}>Domyślny</span>
            )}
          </div>
          {variant.additionalStops?.length > 0 && (
            <div className={styles.additionalStops}>
              <strong>Dodatkowe przystanki:</strong>
              <ul>
                {variant.additionalStops.map((stopId, idx) => (
                  <li key={idx}>{getStopName(stopId.stop_number)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Warianty trasy</h3>
      {data?.additionalInfo1?.variants?.length > 0 ? (
        <div className={styles.variantsList}>
          {data.additionalInfo1.variants.map((variant, index) =>
            renderVariant(variant, index)
          )}
        </div>
      ) : (
        <div className={styles.emptySection}>Brak zdefiniowanych wariantów</div>
      )}

      {data?.additionalInfo1?.description && (
        <div className={styles.infoContainer}>
          <h4>Opis dla trasy podstawowej:</h4>
          <div className={styles.infoText}>
            {data.additionalInfo1.description}
          </div>
        </div>
      )}

      {data?.additionalInfo1?.notes && (
        <div className={styles.infoContainer}>
          <h4>Uwagi dla trasy podstawowej:</h4>
          <div className={styles.infoText}>{data.additionalInfo1.notes}</div>
        </div>
      )}

      {data?.routeType !== "circular" && (
        <>
          {data?.additionalInfo2?.description && (
            <div className={styles.infoContainer}>
              <h4>Opis dla trasy powrotnej:</h4>
              <div className={styles.infoText}>
                {data.additionalInfo2.description}
              </div>
            </div>
          )}

          {data?.additionalInfo2?.notes && (
            <div className={styles.infoContainer}>
              <h4>Uwagi dla trasy powrotnej:</h4>
              <div className={styles.infoText}>
                {data.additionalInfo2.notes}
              </div>
            </div>
          )}
        </>
      )}
      {showDivider && <Divider />}
    </div>
  );
};

export default VariantsSection;
