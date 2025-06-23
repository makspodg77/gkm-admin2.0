import { useState } from "react";
import styles from "./ReviewStep.module.css";
import Divider from "../../components/divider/Divider";
import BasicInfoSection from "./sections/BasicInfoSection";
import RoutesSection from "./sections/RoutesSection";
import VariantsSection from "./sections/VariantsSection";
import ScheduleSection from "./sections/ScheduleSection";
import ValidationSummary from "./sections/ValidationSummary";

const ReviewStep = ({ data, lineTypes, onPrev, onSubmit, isLoading }) => {
  const [section, setSection] = useState("all");

  const getLineTypeColor = () => {
    const lineTypeId = data.lineTypeId || data._ui?.lineTypeId;

    if (!lineTypeId) {
      return "#ccc";
    }

    const lineType = lineTypes.find((lt) => lt.id === lineTypeId);

    if (!lineType) {
      return "#ccc";
    }

    return lineType.color || "#ccc";
  };

  const validation = {
    isValid: true,
    issues: [],
  };

  return (
    <div className={styles.reviewStep}>
      <div className={styles.header}>
        <h2>Podsumowanie linii</h2>
        <div
          className={styles.lineNumber}
          style={{ backgroundColor: getLineTypeColor() }}
        >
          {data.name}
        </div>
      </div>

      <div className={styles.navigation}>
        <button
          className={`${styles.navButton} ${
            section === "all" ? styles.active : ""
          }`}
          onClick={() => setSection("all")}
        >
          Wszystko
        </button>
        <button
          className={`${styles.navButton} ${
            section === "basic" ? styles.active : ""
          }`}
          onClick={() => setSection("basic")}
        >
          Informacje podstawowe
        </button>
        <button
          className={`${styles.navButton} ${
            section === "routes" ? styles.active : ""
          }`}
          onClick={() => setSection("routes")}
        >
          Trasy
        </button>
        <button
          className={`${styles.navButton} ${
            section === "variants" ? styles.active : ""
          }`}
          onClick={() => setSection("variants")}
        >
          Warianty
        </button>
        <button
          className={`${styles.navButton} ${
            section === "schedule" ? styles.active : ""
          }`}
          onClick={() => setSection("schedule")}
        >
          Rozkład jazdy
        </button>
      </div>

      <Divider />

      {(section === "all" || section === "basic") && (
        <BasicInfoSection
          data={data}
          lineTypes={lineTypes}
          showDivider={section === "all"}
        />
      )}

      {(section === "all" || section === "routes") && (
        <RoutesSection data={data} showDivider={section === "all"} />
      )}

      {(section === "all" || section === "variants") && (
        <VariantsSection data={data} showDivider={section === "all"} />
      )}

      {(section === "all" || section === "schedule") && (
        <ScheduleSection data={data} showDivider={section === "all"} />
      )}

      <ValidationSummary validation={validation} data={data} />
    </div>
  );
};

export default ReviewStep;
