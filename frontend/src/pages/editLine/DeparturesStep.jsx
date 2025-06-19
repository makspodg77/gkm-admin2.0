import { useState, useEffect } from "react";
import styles from "./DeparturesStep.module.css";
import Button from "../../components/button/Button";
import Divider from "../../components/divider/Divider";
import Card from "../../components/card/Card";
import Input from "../../components/input/Input";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPlus, FaTrash, FaClock } from "react-icons/fa";

const DeparturesStep = ({
  data = { schedules: [], variants: [] },
  updateData,
  onNext,
  onPrev,
  routeType = "first", // "first" lub "second" - wskazuje, którą trasę edytujemy
  title = "Rozkład jazdy", // Tytuł dla kroku - może być różny dla różnych tras
}) => {
  // Stan dla wariantów tras
  const [variants, setVariants] = useState([
    {
      signature: "Podstawowy",
      color: "#3498db",
      additionalStops: [],
      isDefault: true,
    },
  ]);

  // Stan dla pojedynczej listy odjazdów
  const [departures, setDepartures] = useState([]);

  // Aktualnie wybrany wariant do dodania odjazdu
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Nowa godzina odjazdu
  const [newDepartureTime, setNewDepartureTime] = useState("");

  // Inicjalizacja stanów z props data
  useEffect(() => {
    console.log("DeparturesStep inicjalizacja z:", data);

    // Inicjalizuj warianty
    if (
      data.variants &&
      Array.isArray(data.variants) &&
      data.variants.length > 0
    ) {
      setVariants(data.variants);
    }

    // Inicjalizuj departures z data.schedules
    if (
      data.schedules &&
      Array.isArray(data.schedules) &&
      data.schedules.length > 0
    ) {
      // Weź odjazdy z pierwszego schedule (lub jedynego)
      const firstSchedule = data.schedules[0];
      if (firstSchedule && Array.isArray(firstSchedule.departures)) {
        setDepartures(firstSchedule.departures);
      }
    }
  }, [data]);

  // Funkcja do renderowania wariantu
  const renderVariantPreview = (variant) => {
    if (!variant) {
      return (
        <div className={styles.variantPreview}>
          <div
            className={styles.variantColor}
            style={{ backgroundColor: "#cccccc" }}
          ></div>
          <span className={styles.variantSignature}>Brak wariantu</span>
        </div>
      );
    }

    return (
      <div className={styles.variantPreview}>
        <div
          className={styles.variantColor}
          style={{ backgroundColor: variant.color || "#cccccc" }}
        ></div>
        <span className={styles.variantSignature}>
          {variant.signature || "Bez oznaczenia"}
        </span>
        {variant.isDefault && (
          <span className={styles.defaultBadge}>Domyślny</span>
        )}
      </div>
    );
  };

  // Wybierz wariant do dodania odjazdu
  const selectVariant = (index) => {
    setSelectedVariantIndex(index);
  };

  // Funkcja do dodawania nowego odjazdu
  const addDeparture = () => {
    if (!newDepartureTime) {
      toast.error("Wprowadź godzinę odjazdu");
      return;
    }

    // Sprawdź czy mamy dostępny wariant
    if (!variants || !variants[selectedVariantIndex]) {
      toast.error("Nie wybrano prawidłowego wariantu");
      return;
    }

    // Sprawdź format czasu (HH:MM lub HH:MM:SS)
    const timePattern = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
    if (!timePattern.test(newDepartureTime)) {
      toast.error("Niepoprawny format czasu. Użyj formatu HH:MM lub HH:MM:SS");
      return;
    }

    // Normalizuj format czasu do HH:MM:SS
    let normalizedTime = newDepartureTime;
    if (newDepartureTime.length === 5) {
      normalizedTime = `${newDepartureTime}:00`;
    }

    // Sprawdź, czy taki odjazd już istnieje
    if (
      departures.some(
        (d) =>
          d.time === normalizedTime && d.variantIndex === selectedVariantIndex
      )
    ) {
      toast.warning("Taki odjazd już istnieje dla wybranego wariantu");
      return;
    }

    // Dodaj nowy odjazd i posortuj
    const updatedDepartures = [
      ...departures,
      {
        time: normalizedTime,
        variantIndex: selectedVariantIndex,
      },
    ];

    // Sortuj odjazdy według czasu
    updatedDepartures.sort((a, b) => a.time.localeCompare(b.time));

    // Aktualizuj lokalny stan
    setDepartures(updatedDepartures);

    // Aktualizuj dane rodzica - przekształć do formatu schedules
    // WAŻNE: aktualizuj parent po każdej zmianie
    updateData({
      schedules: [{ type: "all", departures: updatedDepartures }],
      variants: variants, // Przekazuj również warianty
    });

    setNewDepartureTime("");
    toast.success("Dodano nowy odjazd");
  };

  // Funkcja do usuwania odjazdu
  const removeDeparture = (departureIndex) => {
    const updatedDepartures = [...departures];
    updatedDepartures.splice(departureIndex, 1);

    setDepartures(updatedDepartures);

    // Aktualizuj dane rodzica
    updateData({
      schedules: [{ type: "all", departures: updatedDepartures }],
    });

    toast.success("Usunięto odjazd");
  };

  // Funkcja grupująca odjazdy według godzin
  const getDeparturesByHour = () => {
    const groupedByHour = {};

    departures.forEach((departure) => {
      const hour = departure.time.split(":")[0];
      if (!groupedByHour[hour]) {
        groupedByHour[hour] = [];
      }
      groupedByHour[hour].push(departure);
    });

    return Object.keys(groupedByHour)
      .sort()
      .map((hour) => ({
        hour,
        departures: groupedByHour[hour].sort((a, b) =>
          a.time.localeCompare(b.time)
        ),
      }));
  };

  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      <p>Dodaj godziny odjazdów dla poszczególnych wariantów trasy</p>

      {/* Dodaj wizualny wskaźnik, którą trasę edytujemy */}
      <div className={`${styles.routeIndicator} ${styles[routeType]}`}>
        {routeType === "first" ? "Trasa podstawowa" : "Trasa powrotna"}
      </div>

      <div className={styles.contentContainer}>
        <div className={styles.variantsColumn}>
          <h3>Wybierz wariant trasy</h3>

          <div className={styles.variantsList}>
            {variants.map((variant, index) => (
              <div
                key={index}
                className={`${styles.variantItem} ${
                  index === selectedVariantIndex ? styles.selectedVariant : ""
                }`}
                onClick={() => selectVariant(index)}
              >
                {renderVariantPreview(variant)}
              </div>
            ))}
          </div>

          <div className={styles.addDepartureForm}>
            <h3>Dodaj odjazd</h3>
            <div className={styles.addDepartureInputGroup}>
              <Input
                type="time"
                value={newDepartureTime}
                onChange={(e) => setNewDepartureTime(e.target.value)}
                placeholder="HH:MM"
                style={{ flexGrow: 1 }}
              />
              <Button onClick={addDeparture} style={{ height: "40px" }}>
                <FaPlus /> Dodaj
              </Button>
            </div>

            <div className={styles.selectedVariantInfo}>
              <p>Wybrany wariant: </p>
              {variants[selectedVariantIndex] ? (
                renderVariantPreview(variants[selectedVariantIndex])
              ) : (
                <span>Brak wybranego wariantu</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.departuresColumn}>
          <h3>Rozkład odjazdów</h3>

          {getDeparturesByHour().length === 0 && (
            <div className={styles.noDepartures}>
              Brak zdefiniowanych odjazdów
            </div>
          )}

          <div className={styles.departuresContainer}>
            {getDeparturesByHour().map((hourGroup, hourIndex) => (
              <div key={hourIndex} className={styles.hourGroup}>
                <h4 className={styles.hourHeader}>{hourGroup.hour}:00</h4>
                <div className={styles.hourDepartures}>
                  {hourGroup.departures.map((departure, departureIndex) => {
                    // Uzyskaj wariant bezpiecznie
                    const departureVariant =
                      departure.variantIndex !== undefined &&
                      variants[departure.variantIndex]
                        ? variants[departure.variantIndex]
                        : { signature: "Brak", color: "#cccccc" };

                    // Znajdź indeks tego odjazdu w tabeli odjazdów
                    const depIndex = departures.findIndex(
                      (d) =>
                        d.time === departure.time &&
                        d.variantIndex === departure.variantIndex
                    );

                    return (
                      <div
                        key={departureIndex}
                        className={styles.departureItem}
                      >
                        <div className={styles.departureTime}>
                          <FaClock /> {departure.time}
                        </div>
                        <div className={styles.departureVariant}>
                          {renderVariantPreview(departureVariant)}
                        </div>
                        <button
                          className={styles.deleteButton}
                          onClick={() => removeDeparture(depIndex)}
                          title="Usuń odjazd"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Divider />

      <div className={styles.navigation}>
        <Button onClick={onPrev} variant="secondary">
          Wróć
        </Button>
        <Button onClick={onNext}>Dalej</Button>
      </div>
    </div>
  );
};

export default DeparturesStep;
