import styles from "../ReviewStep.module.css";
import Divider from "../../../components/divider/Divider";
import StopMap from "../../../components/stopMap/StopMap";

const RoutesSection = ({ data, showDivider = false }) => {
  const renderStopWithAttributes = (stop) => {
    return (
      <div className={styles.stopItem}>
        <span className={styles.stopName}>{stop.stop_group?.name}</span>
        {stop.is_first && (
          <span className={styles.firstBadge} title="Przystanek początkowy">
            ⭐
          </span>
        )}
        {stop.is_last && (
          <span className={styles.lastBadge} title="Przystanek końcowy">
            🏁
          </span>
        )}
        {stop.is_optional && (
          <span className={styles.optionalBadge} title="Przystanek opcjonalny">
            ✓?
          </span>
        )}
        {stop.on_request && (
          <span className={styles.onRequestBadge} title="Na żądanie">
            👋
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Trasy</h3>

      <div className={styles.routeContainer}>
        <h4 className={styles.routeTitle}>Trasa podstawowa</h4>
        {data.route1Stops && data.route1Stops.length > 0 ? (
          <div className={styles.routeContent}>
            <div className={styles.stopsList}>
              {data.route1Stops.map((stop, index) => (
                <div key={index} className={styles.routeStop}>
                  <div className={styles.stopNumber}>{index + 1}</div>
                  {renderStopWithAttributes(stop)}
                </div>
              ))}
            </div>
            <div className={styles.mapPreview}>
              {data.route1Stops.length > 0 && (
                <StopMap
                  coordinates={data.route1Stops[0].map}
                  stopName={data.route1Stops[0].stopGroup?.name || ""}
                  height="200px"
                  zoom={15}
                />
              )}
            </div>
          </div>
        ) : (
          <div className={styles.emptyRoute}>
            Brak przystanków w trasie podstawowej
          </div>
        )}
      </div>

      {data.routeType !== "circular" && (
        <div className={styles.routeContainer}>
          <h4 className={styles.routeTitle}>Trasa powrotna</h4>
          {data.route2Stops && data.route2Stops.length > 0 ? (
            <div className={styles.routeContent}>
              <div className={styles.stopsList}>
                {data.route2Stops.map((stop, index) => (
                  <div key={index} className={styles.routeStop}>
                    <div className={styles.stopNumber}>{index + 1}</div>
                    {renderStopWithAttributes(stop)}
                  </div>
                ))}
              </div>
              <div className={styles.mapPreview}>
                {data.route2Stops.length > 0 && (
                  <StopMap
                    coordinates={data.route2Stops[0].map}
                    stopName={data.route2Stops[0].stopGroup?.name || ""}
                    height="200px"
                    zoom={15}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyRoute}>
              Brak przystanków w trasie powrotnej
            </div>
          )}
        </div>
      )}
      {showDivider && <Divider />}
    </div>
  );
};

export default RoutesSection;
