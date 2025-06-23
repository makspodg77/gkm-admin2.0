import styles from "../ReviewStep.module.css";
import Divider from "../../../components/divider/Divider";
import { FaClock } from "react-icons/fa";

const ScheduleSection = ({ data, showDivider = false }) => {
  const getDeparturesFromData = (routeType) => {
    const schedules =
      routeType === "first" ? data?.schedules1 : data?.schedules2;

    return (
      schedules?.[0]?.departures ||
      data?._ui?.[routeType === "first" ? "schedules1" : "schedules2"]?.[0]
        ?.departures ||
      []
    );
  };

  const renderDepartures = (routeType = "first") => {
    const departures = getDeparturesFromData(routeType);

    if (!departures || departures.length === 0) {
      return (
        <div className={styles.emptySection}>
          Brak zdefiniowanych odjazdów dla tej trasy
        </div>
      );
    }

    const variants = data?.additionalInfo1?.variants ||
      data?._ui?.additionalInfo1?.variants || [
        { signature: "Podstawowy", color: "#3498db", isDefault: true },
      ];

    const departuresByHour = {};
    departures.forEach((departure) => {
      const hour = departure.time?.split(":")?.[0] || "00";
      if (!departuresByHour[hour]) {
        departuresByHour[hour] = [];
      }
      departuresByHour[hour].push(departure);
    });

    return Object.keys(departuresByHour)
      .sort()
      .map((hour) => (
        <div key={hour} className={styles.hourGroup}>
          <h4 className={styles.hourHeader}>{hour}:00</h4>
          <div className={styles.hourDepartures}>
            {departuresByHour[hour]
              .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
              .map((departure, idx) => {
                const variant = variants[departure.variantIndex] || {
                  signature: "Podstawowy",
                  color: "#ccc",
                };

                return (
                  <div key={idx} className={styles.departureItem}>
                    <div className={styles.departureTime}>
                      <FaClock />{" "}
                      {departure.time?.substring(0, departure.time.length - 3)}
                    </div>
                    <div
                      className={styles.departureVariant}
                      style={{
                        backgroundColor: variant.color,
                        color: getContrastColor(variant.color),
                      }}
                    >
                      {variant.signature || "Podstawowy"}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ));
  };

  const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor.length < 7) return "#ffffff";

    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);

    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    return yiq >= 128 ? "#000000" : "#ffffff";
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Rozkład jazdy</h3>

      <div className={styles.routeScheduleSection}>
        <h4 className={styles.routeScheduleTitle}>
          <span className={styles.routeBadge}>Trasa podstawowa</span>
        </h4>
        <div className={styles.schedulesContainer}>
          {renderDepartures("first")}
        </div>
      </div>

      {data?.routeType !== "circular" && (
        <div className={styles.routeScheduleSection}>
          <h4 className={styles.routeScheduleTitle}>
            <span className={styles.routeBadge}>Trasa powrotna</span>
          </h4>
          <div className={styles.schedulesContainer}>
            {renderDepartures("second")}
          </div>
        </div>
      )}

      {showDivider && <Divider />}
    </div>
  );
};

export default ScheduleSection;
