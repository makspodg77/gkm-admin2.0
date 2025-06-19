import React, { useState } from "react";
import styles from "./ReviewStep.module.css";
import Button from "../../components/button/Button";
import Divider from "../../components/divider/Divider";
import StopMap from "../../components/stopMap/StopMap";
import { FaCheck, FaExclamationTriangle, FaClock } from "react-icons/fa";

const ReviewStep = ({
  data,
  lineTypes,
  stops,
  onSubmit,
  onPrev,
  isLoading = false,
}) => {
  const [section, setSection] = useState("all"); // all, basic, routes, variants, schedule

  // Poprawiona funkcja getLineTypeName:
  const getLineTypeName = () => {
    // Pobierz ID typu linii (sprawdź różne możliwe lokalizacje)
    const lineTypeId = data.lineTypeId || data._ui?.lineTypeId;

    if (!lineTypeId) {
      return "Nieznany typ linii";
    }

    // Szukaj typu linii po ID
    const lineType = lineTypes.find(
      (lt) => lt.id === lineTypeId || lt.id === parseInt(lineTypeId)
    );

    // Zabezpiecz się przed nullami
    if (!lineType) {
      console.warn(`Nie znaleziono typu linii o ID: ${lineTypeId}`);
      return "Nieznany typ linii";
    }

    return lineType.nameSingular || lineType.name || "Nieznany typ linii";
  };

  // Formatowanie nazwy linii (np. dodawanie przedrostka N dla linii nocnych)
  const formatLineName = (name, isNight) => {
    if (!name) return "";
    return isNight ? `N${name}` : name;
  };

  // Poprawiona funkcja getLineTypeColor:
  const getLineTypeColor = () => {
    // Pobierz ID typu linii (sprawdź różne możliwe lokalizacje)
    const lineTypeId = data.lineTypeId || data._ui?.lineTypeId;

    if (!lineTypeId) {
      return "#ccc";
    }

    // Szukaj typu linii po ID
    const lineType = lineTypes.find(
      (lt) => lt.id === lineTypeId || lt.id === parseInt(lineTypeId)
    );

    // Zabezpiecz się przed nullami
    if (!lineType) {
      return "#ccc";
    }

    return lineType.color || "#ccc";
  };

  // Funkcja znajdująca nazwę przystanku
  const getStopName = (stopId) => {
    const stop = stops.find((s) => s.id === stopId);
    return stop ? stop.name : "Nieznany przystanek";
  };

  // Funkcja do renderowania nazwy przystanku
  const renderStopWithAttributes = (stop) => {
    return (
      <div className={styles.stopItem}>
        <div className={styles.stopName}>
          {stop.stopGroup?.name || getStopName(stop.stopId)}
        </div>
        <div className={styles.stopAttributes}>
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
            <span
              className={styles.optionalBadge}
              title="Przystanek opcjonalny"
            >
              ✓?
            </span>
          )}
          {stop.on_request && (
            <span className={styles.onRequestBadge} title="Na żądanie">
              👋
            </span>
          )}
        </div>
      </div>
    );
  };

  // Funkcja do renderowania wariantu
  const renderVariant = (variant, index) => {
    return (
      <div key={index} className={styles.variantItem}>
        <div
          className={styles.variantColor}
          style={{ backgroundColor: variant.color }}
        ></div>
        <div className={styles.variantInfo}>
          <div className={styles.variantSignature}>
            {variant.signature || "Wariant podstawowy"}
            {variant.isDefault && (
              <span className={styles.defaultBadge}>Domyślny</span>
            )}
          </div>
          {variant.additionalStops && variant.additionalStops.length > 0 && (
            <div className={styles.additionalStops}>
              <strong>Dodatkowe przystanki:</strong>
              <ul>
                {variant.additionalStops.map((stopId, idx) => (
                  <li key={idx}>{getStopName(stopId)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Poprawiony renderDepartures:
  const renderDepartures = (routeType = "first") => {
    // Wybierz odpowiedni rozkład dla trasy
    const schedules = routeType === "first" ? data.schedules1 : data.schedules2;

    // Sprawdzamy wszystkie możliwe miejsca, gdzie mogą być przechowywane odjazdy
    let departures = [];

    if (schedules && schedules.length > 0) {
      departures = schedules[0]?.departures || [];
    } else if (data._ui) {
      // Spróbuj znaleźć w _ui
      departures =
        routeType === "first"
          ? data._ui.schedules1?.[0]?.departures || []
          : data._ui.schedules2?.[0]?.departures || [];
    }

    // Ostatecznie sprawdź czy mamy jakieś odjazdy
    if (!departures || departures.length === 0) {
      return (
        <div className={styles.emptySection}>
          Brak zdefiniowanych odjazdów dla tej trasy
        </div>
      );
    }

    // Pobierz warianty (sprawdź różne możliwe lokalizacje)
    const variants = data.additionalInfo1?.variants ||
      data._ui?.additionalInfo1?.variants || [
        { signature: "Podstawowy", color: "#3498db", isDefault: true },
      ];

    // Grupuj odjazdy według godzin
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
                      <FaClock /> {departure.time}
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

  // Helper do określania kontrastu tekstu
  const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor.length < 7) return "#ffffff";

    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);

    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    return yiq >= 128 ? "#000000" : "#ffffff";
  };

  // Walidacja danych przed wysłaniem
  const getValidationSummary = () => {
    const issues = [];

    // Sprawdź podstawowe dane
    if (!data.name) issues.push("Brak nazwy linii");
    if (!data.lineTypeId) issues.push("Nie wybrano typu linii");

    // Sprawdź trasę pierwszą
    if (!data.route1Stops || data.route1Stops.length === 0) {
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

    // Sprawdź trasę powrotną (jeśli nie jest okrężna)
    if (data.routeType !== "circular") {
      if (!data.route2Stops || data.route2Stops.length === 0) {
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

    // Sprawdź rozkład - check schedules1 and schedules2 specifically
    const hasSchedule1 =
      data.schedules1 &&
      data.schedules1.length > 0 &&
      data.schedules1[0].departures &&
      data.schedules1[0].departures.length > 0;

    if (!hasSchedule1) {
      issues.push("Brak odjazdów w rozkładzie jazdy dla trasy podstawowej");
    }

    // Check schedule for second route if not circular
    if (data.routeType !== "circular") {
      const hasSchedule2 =
        data.schedules2 &&
        data.schedules2.length > 0 &&
        data.schedules2[0].departures &&
        data.schedules2[0].departures.length > 0;

      if (!hasSchedule2) {
        issues.push("Brak odjazdów w rozkładzie jazdy dla trasy powrotnej");
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  };

  const validation = getValidationSummary();

  return (
    <div className={styles.reviewStep}>
      <div className={styles.header}>
        <h2>Podsumowanie linii</h2>
        <div
          className={styles.lineNumber}
          style={{ backgroundColor: getLineTypeColor() }}
        >
          {formatLineName(data.name, data.isNight)}
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
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Informacje podstawowe</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Nazwa/numer linii:</div>
              <div className={styles.infoValue}>
                {formatLineName(data.name, data.isNight)}
              </div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Typ linii:</div>
              <div className={styles.infoValue}>{getLineTypeName()}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Rodzaj trasy:</div>
              <div className={styles.infoValue}>
                {data.routeType === "circular" ? "Okrężna" : "Dwukierunkowa"}
              </div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Linia nocna:</div>
              <div className={styles.infoValue}>
                {data.isNight ? "Tak" : "Nie"}
              </div>
            </div>
          </div>
          {section === "basic" && <Divider />}
        </div>
      )}

      {(section === "all" || section === "routes") && (
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
          {section === "routes" && <Divider />}
        </div>
      )}

      {(section === "all" || section === "variants") && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Warianty trasy</h3>
          {data.additionalInfo1?.variants &&
          data.additionalInfo1.variants.length > 0 ? (
            <div className={styles.variantsList}>
              {data.additionalInfo1.variants.map((variant, index) =>
                renderVariant(variant, index)
              )}
            </div>
          ) : (
            <div className={styles.emptySection}>
              Brak zdefiniowanych wariantów
            </div>
          )}

          {data.additionalInfo1?.description && (
            <div className={styles.infoContainer}>
              <h4>Opis dla trasy podstawowej:</h4>
              <div className={styles.infoText}>
                {data.additionalInfo1.description}
              </div>
            </div>
          )}

          {data.additionalInfo1?.notes && (
            <div className={styles.infoContainer}>
              <h4>Uwagi dla trasy podstawowej:</h4>
              <div className={styles.infoText}>
                {data.additionalInfo1.notes}
              </div>
            </div>
          )}

          {data.routeType !== "circular" && (
            <>
              {data.additionalInfo2?.description && (
                <div className={styles.infoContainer}>
                  <h4>Opis dla trasy powrotnej:</h4>
                  <div className={styles.infoText}>
                    {data.additionalInfo2.description}
                  </div>
                </div>
              )}

              {data.additionalInfo2?.notes && (
                <div className={styles.infoContainer}>
                  <h4>Uwagi dla trasy powrotnej:</h4>
                  <div className={styles.infoText}>
                    {data.additionalInfo2.notes}
                  </div>
                </div>
              )}
            </>
          )}
          {section === "variants" && <Divider />}
        </div>
      )}

      {(section === "all" || section === "schedule") && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Rozkład jazdy</h3>

          {/* Trasa podstawowa */}
          <div className={styles.routeScheduleSection}>
            <h4 className={styles.routeScheduleTitle}>
              <span className={styles.routeBadge}>Trasa podstawowa</span>
            </h4>
            <div className={styles.schedulesContainer}>
              {renderDepartures("first")}
            </div>
          </div>

          {/* Trasa powrotna - tylko jeśli nie jest okrężna */}
          {data.routeType !== "circular" && (
            <div className={styles.routeScheduleSection}>
              <h4 className={styles.routeScheduleTitle}>
                <span className={styles.routeBadge}>Trasa powrotna</span>
              </h4>
              <div className={styles.schedulesContainer}>
                {renderDepartures("second")}
              </div>
            </div>
          )}

          {section === "schedule" && <Divider />}
        </div>
      )}

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

      <Divider />

      <div className={styles.actionsContainer}>
        <Button onClick={onPrev} variant="secondary">
          Wróć
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!validation.isValid || isLoading}
          title={!validation.isValid ? "Napraw błędy przed zapisaniem" : ""}
        >
          {isLoading ? "Zapisywanie..." : "Zapisz linię"}
        </Button>
      </div>
    </div>
  );
};

// Funkcja debugująca
const DebugData = ({ data }) => {
  if (process.env.NODE_ENV === "development") {
    return (
      <details className={styles.debugContainer}>
        <summary>Debug Data</summary>
        <pre className={styles.debugPre}>{JSON.stringify(data, null, 2)}</pre>
      </details>
    );
  }
  return null;
};

export default ReviewStep;
