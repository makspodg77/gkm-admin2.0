import styles from "../ReviewStep.module.css";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";

const ValidationSummary = ({ data }) => {
  const validation = getValidationSummary();

  function getValidationSummary() {
    const issues = [];

    if (!data?.name) issues.push("Brak nazwy linii");
    if (!data?.lineTypeId) issues.push("Nie wybrano typu linii");

    if (!data?.route1Stops || data.route1Stops.length === 0) {
      issues.push("Brak przystanków w trasie pierwszej");
    } else {
      const hasFirstStop = data.route1Stops.some(
        (stop) => stop.is_first && !stop.is_optional
      );
      const hasLastStop = data.route1Stops.some(
        (stop) => stop.is_last && !stop.is_optional
      );

      if (!hasFirstStop)
        issues.push(
          "Brak nieopcjonalnego przystanku początkowego w trasie pierwszej"
        );
      if (!hasLastStop)
        issues.push(
          "Brak nieopcjonalnego przystanku końcowego w trasie pierwszej"
        );
    }

    if (data?.routeType !== "circular") {
      if (!data?.route2Stops || data.route2Stops.length === 0) {
        issues.push("Brak przystanków w trasie powrotnej");
      } else {
        const hasFirstStop = data.route2Stops.some(
          (stop) => stop.is_first && !stop.is_optional
        );
        const hasLastStop = data.route2Stops.some(
          (stop) => stop.is_last && !stop.is_optional
        );

        if (!hasFirstStop)
          issues.push(
            "Brak nieopcjonalnego przystanku początkowego w trasie powrotnej"
          );
        if (!hasLastStop)
          issues.push(
            "Brak nieopcjonalnego przystanku końcowego w trasie powrotnej"
          );
      }
    }

    const hasSchedule1 =
      data?.schedules1 &&
      data.schedules1.length > 0 &&
      data.schedules1[0]?.departures &&
      data.schedules1[0].departures.length > 0;

    if (!hasSchedule1) {
      issues.push("Brak odjazdów w rozkładzie jazdy dla trasy podstawowej");
    }

    if (data?.routeType !== "circular") {
      const hasSchedule2 =
        data?.schedules2 &&
        data.schedules2.length > 0 &&
        data.schedules2[0]?.departures &&
        data.schedules2[0].departures.length > 0;

      if (!hasSchedule2) {
        issues.push("Brak odjazdów w rozkładzie jazdy dla trasy powrotnej");
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  return (
    <div className={styles.validation}>
      <h3 className={styles.validationTitle}>
        {validation.isValid ? (
          <>
            <FaCheck className={styles.validIcon} /> Dane są kompletne
          </>
        ) : (
          <>
            <FaExclamationTriangle className={styles.invalidIcon} /> Wykryto
            problemy
          </>
        )}
      </h3>

      {!validation.isValid && (
        <div className={styles.issuesList}>
          <ul>
            {validation.issues.map((issue, index) => (
              <li key={index} className={styles.issueItem}>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ValidationSummary;
