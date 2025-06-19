import { useState, useEffect } from "react";
import styles from "./AdditionalInfo1Step.module.css";
import Button from "../../components/button/Button";
import Divider from "../../components/divider/Divider";
import { toast } from "react-toastify";
import Card from "../../components/card/Card";
import Input from "../../components/input/Input";
import { FaTrash } from "react-icons/fa";

const AdditionalInfo1Step = ({
  departureRoutes = [],
  stops = [],
  updateData,
  onNext,
  onPrev,
  data,
  isReturnRoute = false, // Dodaj nowy prop
}) => {
  const [localStops, setLocalStops] = useState(stops);
  const [displayStops, setDisplayStops] = useState([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const defaultFirstStop = localStops.find(
    (stop) => stop.is_first === true && stop.is_optional === false
  );

  const defaultLastStop = localStops.find(
    (stop) => stop.is_last === true && stop.is_optional === false
  );

  const [variants, setVariants] = useState([
    {
      signature: "Podstawowy",
      color: "#3498db",
      additionalStops: [],
      firstStop: defaultFirstStop || null,
      lastStop: defaultLastStop || null,
      isDefault: true,
    },
  ]);

  useEffect(() => {
    console.log(
      `AdditionalInfo1Step (${
        isReturnRoute ? "trasa powrotna" : "trasa główna"
      }) otrzymał dane:`,
      data
    );
    console.log(
      `AdditionalInfo1Step (${
        isReturnRoute ? "trasa powrotna" : "trasa główna"
      }) otrzymał przystanki:`,
      stops
    );

    const stopsWithNumbers = stops.map((stop, index) => ({
      ...stop,
      stop_number: stop.stop_number || index + 1,
    }));

    const needsUpdate =
      JSON.stringify(stopsWithNumbers) !== JSON.stringify(localStops);

    if (needsUpdate) {
      setLocalStops(stopsWithNumbers);

      const hasNumberChanges = stopsWithNumbers.some(
        (stop, idx) => stop.stop_number !== stops[idx]?.stop_number
      );

      if (updateData && hasNumberChanges) {
        updateData({ _stopsOverride: stopsWithNumbers });
      }
    }
  }, [stops, data, isReturnRoute]);

  useEffect(() => {
    const filteredStops = localStops.filter(
      (stop) => stop.is_optional === true
    );

    if (JSON.stringify(filteredStops) !== JSON.stringify(displayStops)) {
      setDisplayStops(filteredStops);
    }
  }, [localStops]);

  useEffect(() => {
    if (localStops && localStops.length > 0) {
      const newFirstStop = localStops.find(
        (stop) => stop.is_first === true && stop.is_optional === false
      );

      const newLastStop = localStops.find(
        (stop) => stop.is_last === true && stop.is_optional === false
      );

      const needsUpdate = variants.some(
        (v) =>
          v.firstStop?.id !== newFirstStop?.id ||
          v.lastStop?.id !== newLastStop?.id
      );

      if (needsUpdate) {
        setVariants((prev) =>
          prev.map((variant) => ({
            ...variant,
            firstStop: newFirstStop || variant.firstStop,
            lastStop: newLastStop || variant.lastStop,
          }))
        );
      }
    }
  }, [localStops]);

  useEffect(() => {
    if (
      variants &&
      variants.length > 0 &&
      localStops &&
      localStops.length > 0
    ) {
      const currentVariant = variants[selectedVariantIndex];
      const updatedStops = calculateStopNumbers(localStops, currentVariant);
      const hasChanges =
        JSON.stringify(updatedStops) !== JSON.stringify(localStops);

      if (hasChanges) {
        setLocalStops(updatedStops);
      }
    }
  }, [selectedVariantIndex, variants]);

  useEffect(() => {
    if (localStops && localStops.length > 0) {
      let updatedStops = localStops.map((stop, index) => ({
        ...stop,
        stop_number: stop.stop_number || index + 1,
      }));

      if (variants && variants.length > 0 && variants[0]) {
        updatedStops = calculateStopNumbers(updatedStops, variants[0]);
      }

      if (JSON.stringify(updatedStops) !== JSON.stringify(localStops)) {
        setLocalStops(updatedStops);
      }
    }
  }, []);

  useEffect(() => {
    if (data && data.variants && data.variants.length > 0) {
      const normalizedVariants = data.variants.map((variant) => {
        const normalizedStops = (variant.additionalStops || []).map((stop) => {
          const matchingLocalStop = localStops.find(
            (s) =>
              (stop.stop_number &&
                parseInt(s.stop_number) === parseInt(stop.stop_number)) ||
              (stop.id && s.id === stop.id) ||
              (stop.stopId && s.stopId === stop.stopId) ||
              (stop.stop_id && s.id === stop.stop_id)
          );

          return {
            ...stop,
            routeId:
              stop.routeId ||
              (matchingLocalStop && matchingLocalStop.routeId) ||
              `stop_${
                stop.id ||
                stop.stop_id ||
                stop.stop_number ||
                Math.random().toString(36).substring(2)
              }`,
          };
        });

        return {
          ...variant,
          additionalStops: normalizedStops,
        };
      });

      if (JSON.stringify(normalizedVariants) !== JSON.stringify(variants)) {
        setVariants(normalizedVariants);
      }
    }
  }, [data]);

  const handleStopChange = (stopId, isChecked) => {
    const stop = localStops.find((s) => s.routeId === stopId);
    if (!stop) {
      console.error("Nie znaleziono przystanku o id:", stopId);
      return;
    }

    if (isChecked) {
      const currentVariant = variants[selectedVariantIndex];

      if (stop.is_first && stop.is_optional) {
        const hasSelectedFirstStop = currentVariant.additionalStops.some(
          (s) => s.routeId !== stopId && s.is_first && s.is_optional
        );

        if (hasSelectedFirstStop) {
          toast.error(
            "Można wybrać tylko jeden opcjonalny przystanek początkowy!"
          );
          return;
        }
      }

      if (stop.is_last && stop.is_optional) {
        const hasSelectedLastStop = currentVariant.additionalStops.some(
          (s) => s.routeId !== stopId && s.is_last && s.is_optional
        );

        if (hasSelectedLastStop) {
          toast.error(
            "Można wybrać tylko jeden opcjonalny przystanek końcowy!"
          );
          return;
        }
      }
    }

    const updatedVariants = [...variants];
    const currentVariant = updatedVariants[selectedVariantIndex];

    if (isChecked) {
      if (!currentVariant.additionalStops.some((s) => s.routeId === stopId)) {
        const stopCopy = JSON.parse(JSON.stringify(stop));

        if (!stopCopy.stopGroup || !stopCopy.stopGroup.name) {
          stopCopy.stopGroup = {
            id: stopCopy.stopGroup?.id || "unknown",
            name:
              stopCopy.stopGroup?.name ||
              `Przystanek ${stopCopy.stop_number || ""}`,
          };
        }

        currentVariant.additionalStops.push(stopCopy);
      }
    } else {
      currentVariant.additionalStops = currentVariant.additionalStops.filter(
        (s) => {
          const matchById = s.id === stop.id;
          const matchByStopId = s.stopId === stop.stopId;
          const matchByRouteId = s.routeId === stop.routeId;
          const matchByStopNumber =
            parseInt(s.stop_number) === parseInt(stop.stop_number);
          const matchByApiStopId = s.stop_id && s.stop_id === stop.id;

          return !(
            matchById ||
            matchByStopId ||
            matchByRouteId ||
            matchByStopNumber ||
            matchByApiStopId
          );
        }
      );
    }

    setVariants([...updatedVariants]);

    toast.success(
      `Przystanek ${stop.stopGroup?.name} został ${
        isChecked ? "dodany do" : "usunięty z"
      } wariantu trasy`
    );
  };

  const isStopSelected = (stopId) => {
    const currentVariant = variants[selectedVariantIndex];
    if (!currentVariant || !currentVariant.additionalStops) return false;

    const stop = localStops.find((s) => s.routeId === stopId);
    if (!stop) return false;

    return currentVariant.additionalStops.some((addStop) => {
      const matchById = addStop.id === stop.id;
      const matchByStopId = addStop.stopId === stop.stopId;
      const matchByRouteId = addStop.routeId === stop.routeId;
      const matchByNumber =
        parseInt(addStop.stop_number) === parseInt(stop.stop_number);
      const matchByApiStopId = addStop.stop_id && addStop.stop_id === stop.id;

      return (
        matchById ||
        matchByStopId ||
        matchByRouteId ||
        matchByNumber ||
        matchByApiStopId
      );
    });
  };

  const addVariant = () => {
    const newVariant = {
      signature: "",
      color: "#3498db",
      additionalStops: [],
      firstStop: variants[0]?.firstStop || null,
      lastStop: variants[0]?.lastStop || null,
      isDefault: false,
    };

    setVariants([...variants, newVariant]);
    setSelectedVariantIndex(variants.length);
  };

  const deleteVariant = (indexToRemove) => {
    if (indexToRemove === 0) return;

    setVariants(variants.filter((_, index) => index !== indexToRemove));

    if (selectedVariantIndex === indexToRemove) {
      setSelectedVariantIndex(0);
    } else if (selectedVariantIndex > indexToRemove) {
      setSelectedVariantIndex(selectedVariantIndex - 1);
    }

    toast.success("Usunięto wariant trasy");
  };

  const selectVariant = (index) => {
    setSelectedVariantIndex(index);
  };

  const calculateStopNumbers = (stops, selectedVariant) => {
    if (!stops || !stops.length || !selectedVariant) return stops;

    let updatedStops = [...stops];

    updatedStops = updatedStops.map((stop, index) => ({
      ...stop,
      stop_number: stop.stop_number || index + 1,
    }));

    const nonOptionalFirstStop = updatedStops.find(
      (stop) => stop.is_first === true && stop.is_optional === false
    );

    updatedStops = updatedStops
      .sort((a, b) => (a.stop_number || 999) - (b.stop_number || 999))
      .map((stop, index) => ({
        ...stop,
        stop_number: index + 1,
      }));

    if (nonOptionalFirstStop && nonOptionalFirstStop.stop_number === 2) {
      updatedStops = updatedStops.map((stop) => ({
        ...stop,
        stop_number:
          stop.stop_number - 1 > 0 ? stop.stop_number - 1 : stop.stop_number,
      }));
    }

    return updatedStops;
  };

  const renderVariantPreview = (variant) => {
    if (!variant || !variant.additionalStops) {
      return (
        <div className={styles.routePreview}>
          <p>Brak danych wariantu</p>
        </div>
      );
    }

    const validStops = variant.additionalStops.filter(
      (stop) => stop && stop.stopGroup && stop.stopGroup.name
    );

    const optionalFirstStops = validStops.filter((stop) => stop.is_first);
    const optionalLastStops = validStops.filter((stop) => stop.is_last);
    const optionalMiddleStops = validStops.filter(
      (stop) => !stop.is_first && !stop.is_last
    );

    const mandatoryFirstStop = localStops.find(
      (stop) => stop.is_first && !stop.is_optional
    );
    const mandatoryLastStop = localStops.find(
      (stop) => stop.is_last && !stop.is_optional
    );

    const displayFirstStop =
      optionalFirstStops.length > 0
        ? optionalFirstStops[0]
        : mandatoryFirstStop || { stopGroup: { name: "Start" } };

    const displayLastStop =
      optionalLastStops.length > 0
        ? optionalLastStops[0]
        : mandatoryLastStop || { stopGroup: { name: "Koniec" } };

    return (
      <div className={styles.routePreview}>
        <div className={styles.routePath}>
          <strong>Trasa:</strong> {displayFirstStop.stopGroup?.name || "Start"}
          {displayFirstStop.stop_number
            ? ` (${displayFirstStop.stop_number})`
            : ""}{" "}
          → {displayLastStop.stopGroup?.name || "Koniec"}
          {displayLastStop.stop_number
            ? ` (${displayLastStop.stop_number})`
            : ""}
        </div>

        {optionalMiddleStops.length > 0 && (
          <div className={styles.additionalStops}>
            <strong>Opcjonalne przystanki przelotowe:</strong>{" "}
            {optionalMiddleStops
              .sort(
                (a, b) =>
                  (parseInt(a.stop_number) || 0) -
                  (parseInt(b.stop_number) || 0)
              )
              .map(
                (stop) =>
                  `${stop.stopGroup?.name || "Brak nazwy"}${
                    stop.stop_number ? ` (${stop.stop_number})` : ""
                  }`
              )
              .join(", ")}
          </div>
        )}

        <div className={styles.additionalStopsCount}>
          <strong>Dodatkowych przystanków:</strong>{" "}
          {variant.additionalStops.length}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h2>Warianty trasy podstawowej</h2>

      <div className={styles.stopsContainer}>
        <div className={styles.left}>
          <h3>Obsługa przystanków opcjonalnych</h3>

          {displayStops.length === 0 ? (
            <p className={styles.noStops}>
              Brak przystanków opcjonalnych do skonfigurowania
            </p>
          ) : (
            <>
              <p className={styles.stopsDescription}>
                Zaznacz przystanki opcjonalne, które mają być obsługiwane w tym
                wariancie trasy
              </p>

              <div className={styles.variantConfiguration}>
                <div className={styles.variantInputs}>
                  <Input
                    label="Oznaczenie wariantu"
                    value={variants[selectedVariantIndex]?.signature || ""}
                    onChange={(e) => {
                      if (selectedVariantIndex === 0) return;

                      const updatedVariants = [...variants];
                      updatedVariants[selectedVariantIndex].signature =
                        e.target.value;
                      setVariants(updatedVariants);
                    }}
                    placeholder="np. #, @, !..."
                    className={styles.signatureInput}
                    disabled={selectedVariantIndex === 0}
                  />
                  <Input
                    type="color"
                    label="Kolor wariantu"
                    value={variants[selectedVariantIndex]?.color || "#3498db"}
                    onChange={(e) => {
                      if (selectedVariantIndex === 0) return;

                      const updatedVariants = [...variants];
                      updatedVariants[selectedVariantIndex].color =
                        e.target.value;
                      setVariants(updatedVariants);
                    }}
                    className={styles.colorInput}
                    disabled={selectedVariantIndex === 0}
                  />
                </div>
              </div>

              <Divider />

              <div className={styles.stopSection}>
                <h4>Przystanki początkowe opcjonalne:</h4>
                {displayStops.filter((stop) => stop.is_first === true)
                  .length === 0 ? (
                  <p>Brak opcjonalnych przystanków początkowych</p>
                ) : (
                  displayStops
                    .filter((stop) => stop.is_first === true)
                    .map((stop) => (
                      <div
                        key={stop.routeId}
                        className={styles.optionalStopItem}
                      >
                        <Input
                          type="checkbox"
                          label={`${stop.stopGroup?.name || "Brak nazwy"}${
                            stop.stop_number ? ` (${stop.stop_number})` : ""
                          }`}
                          checked={isStopSelected(stop.routeId)}
                          onChange={(e) =>
                            handleStopChange(stop.routeId, e.target.checked)
                          }
                          disabled={selectedVariantIndex === 0}
                        />
                      </div>
                    ))
                )}
              </div>

              <div className={styles.stopSection}>
                <h4>Przystanki przelotowe opcjonalne:</h4>
                {displayStops.filter(
                  (stop) => stop.is_first === false && stop.is_last === false
                ).length === 0 ? (
                  <p>Brak opcjonalnych przystanków przelotowych</p>
                ) : (
                  displayStops
                    .filter(
                      (stop) =>
                        stop.is_first === false && stop.is_last === false
                    )
                    .map((stop) => (
                      <div
                        key={stop.routeId}
                        className={styles.optionalStopItem}
                      >
                        <Input
                          type="checkbox"
                          label={`${stop.stopGroup?.name || "Brak nazwy"}${
                            stop.stop_number ? ` (${stop.stop_number})` : ""
                          }`}
                          checked={isStopSelected(stop.routeId)}
                          onChange={(e) =>
                            handleStopChange(stop.routeId, e.target.checked)
                          }
                          disabled={selectedVariantIndex === 0}
                        />
                      </div>
                    ))
                )}
              </div>

              <div className={styles.stopSection}>
                <h4>Przystanki końcowe opcjonalne:</h4>
                {displayStops.filter((stop) => stop.is_last === true).length ===
                0 ? (
                  <p>Brak opcjonalnych przystanków końcowych</p>
                ) : (
                  displayStops
                    .filter((stop) => stop.is_last === true)
                    .map((stop) => (
                      <div
                        key={stop.routeId}
                        className={styles.optionalStopItem}
                      >
                        <Input
                          type="checkbox"
                          label={`${stop.stopGroup?.name || "Brak nazwy"}${
                            stop.stop_number ? ` (${stop.stop_number})` : ""
                          }`}
                          checked={isStopSelected(stop.routeId)}
                          onChange={(e) =>
                            handleStopChange(stop.routeId, e.target.checked)
                          }
                          disabled={selectedVariantIndex === 0}
                        />
                      </div>
                    ))
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.right}>
          <h3>Lista wariantów trasy</h3>

          <div className={styles.variantsList}>
            {variants.map((variant, index) => (
              <div
                key={index}
                className={`${styles.variantItem} ${
                  index === selectedVariantIndex ? styles.selectedVariant : ""
                } ${variant.isDefault ? styles.defaultVariant : ""}`}
                onClick={() => selectVariant(index)}
              >
                <div className={styles.variantHeader}>
                  <div
                    className={styles.variantColor}
                    style={{ backgroundColor: variant.color }}
                  ></div>
                  <span className={styles.variantSignature}>
                    {variant.signature || "Bez oznaczenia"}
                  </span>
                  {variant.isDefault && (
                    <span className={styles.defaultBadge}>Domyślny</span>
                  )}
                  {!variant.isDefault && (
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteVariant(index);
                      }}
                      title="Usuń wariant"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>

                {renderVariantPreview(variant)}
              </div>
            ))}

            <Button
              onClick={addVariant}
              variant="secondary"
              className={styles.addButton}
            >
              Dodaj nowy wariant trasy
            </Button>
          </div>
        </div>
      </div>

      <Divider />

      <div className={styles.navigation}>
        <div>
          <Button onClick={onPrev} variant="secondary">
            Wróć
          </Button>
        </div>
        <Button
          onClick={() => {
            if (updateData) {
              updateData({
                variants,
                _stopsOverride: localStops,
              });
            }
            onNext();
          }}
        >
          Dalej
        </Button>
      </div>
    </div>
  );
};

export default AdditionalInfo1Step;
