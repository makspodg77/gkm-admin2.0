import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import styles from "./EditLine.module.css";
import Card from "../../components/card/Card";
import Button from "../../components/button/Button";
import StepIndicator from "../../components/stepIndicator/StepIndicator";
import BasicInfoStep from "./BasicInfoStep";
import Route1Step from "./Route1Step";
import AdditionalInfo1Step from "./AdditionalInfo1Step";
import DeparturesStep from "./DeparturesStep";
import ReviewStep from "./ReviewStep";
import { LineService } from "../../services/lineService";
import { LineTypeService } from "../../services/lineTypeService";
import { StopGroupService } from "../../services/stopGroupService";
import { toast } from "react-toastify";
import Loading from "../../components/ui/Loading";

const EditLine = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAddMode = !id || id === "new";
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(!isAddMode);
  const [error, setError] = useState(null);

  // Reference data needed across steps
  const [lineTypes, setLineTypes] = useState([]);
  const [stopGroups, setStopGroups] = useState([]);

  // The complete line data object, structured according to the API
  const [lineData, setLineData] = useState({
    // Basic info
    name: "",
    lineTypeId: "",
    isActive: true,

    // Routes array (matching API format)
    routes: [
      {
        isCircular: false,
        isNight: false,
        fullRoutes: [
          {
            fullRoute: [],
            departureRoutes: [
              {
                signature: "A",
                color: "#FF0000",
                additionalStops: [],
                departures: [
                  { departureTime: "06:00:00", dayType: "all" },
                  { departureTime: "06:30:00", dayType: "all" },
                ],
              },
            ],
          },
        ],
      },
    ],

    // UI-specific fields (not sent to API)
    _ui: {
      routeType: "bidirectional", // "bidirectional" or "circular"
      route1Stops: [], // First route stops
      route2Stops: [], // Return route stops (if bidirectional)
      isNight: false,
      additionalInfo1: {
        variants: [
          {
            signature: "Podstawowy",
            color: "#3498db",
            additionalStops: [],
            isDefault: true,
          },
        ],
      },
      additionalInfo2: {
        description: "",
        notes: "",
      },
      // Osobne rozkłady dla obu kierunków
      schedules1: [
        {
          type: "all",
          departures: [
            { time: "06:00:00", variantIndex: 0 },
            { time: "06:30:00", variantIndex: 0 },
          ],
        },
      ],
      schedules2: [
        {
          type: "all",
          departures: [
            { time: "06:15:00", variantIndex: 0 },
            { time: "06:45:00", variantIndex: 0 },
          ],
        },
      ],
    },
  });

  const mapServerDataToRouteStops = (fullRoute, stopGroups) => {
    if (!fullRoute || !Array.isArray(fullRoute)) return [];

    return fullRoute.map((stop) => {
      // Znajdź odpowiednią grupę przystanków
      const stopGroup = stopGroups.find(
        (sg) => sg.id === stop.stop_group_id
      ) || {
        id: stop.stop_group_id,
        name: "Nieznany przystanek",
      };

      return {
        id: stop.stop_id, // ID przystanku
        stopId: stop.stop_id, // Dla spójności
        map: stop.map || "",
        street: stop.street || "",
        stopGroup: {
          id: stopGroup.id,
          name: stopGroup.name,
        },
        routeId: stop.id || `r1_${stop.stop_number}`, // Unikalny ID dla tego przystanku w trasie
        stop_number: parseInt(stop.stop_number) || 0,
        travel_time: stop.travel_time || 0,
        on_request: stop.is_on_request || false,
        is_optional: stop.is_optional || false,
        is_first: stop.is_first || false,
        is_last: stop.is_last || false,
      };
    });
  };

  const loadLineData = async () => {
    try {
      setIsLoading(true);
      const data = await LineService.getOneLine(id);
      const stopGroups = await StopGroupService.getAllStopGroups();
      console.log(data);
      // Przygotuj dane dla interfejsu
      const transformedData = {
        name: data.name,
        lineTypeId: data.line_type_id || data.lineTypeId,
        isActive: data.isActive !== false,
        isNight: data.routes[0].is_night,
        routes: data.routes || [],
        _ui: {
          routeType:
            data.routes?.[0]?.is_circular || data.routes?.[0]?.isCircular
              ? "circular"
              : "bidirectional",
          route1Stops: [],
          route2Stops: [],
          additionalInfo1: {
            variants: [],
          },
          additionalInfo2: {
            variants: [],
          },
          schedules1: [{ type: "all", departures: [] }],
          schedules2: [{ type: "all", departures: [] }],
        },
      };

      // Make sure isNight is set in the _ui object too
      transformedData._ui.isNight = data.routes?.[0]?.is_night || false;

      // Pobierz przystanki pierwszej trasy
      if (data.routes?.length > 0) {
        const firstRoute = data.routes[0];

        // Mapuj przystanki na format oczekiwany przez Route1Step
        if (firstRoute.fullRoute && firstRoute.fullRoute.length > 0) {
          transformedData._ui.route1Stops = mapServerDataToRouteStops(
            firstRoute.fullRoute,
            stopGroups
          );
        }

        // Przetwarzanie wariantów (departureRoutes)
        if (
          firstRoute.departureRoutes &&
          firstRoute.departureRoutes.length > 0
        ) {
          // Przygotuj warianty
          const variantsPromises = firstRoute.departureRoutes.map(
            async (route, idx) => {
              // Przetwarzanie additionalStops
              const additionalStops = [];

              if (route.additionalStops && route.additionalStops.length > 0) {
                // Wszystkie potrzebne przystanki możemy pobrać z fullRoute
                // gdzie każdy przystanek ma kompletne dane
                for (const addStop of route.additionalStops) {
                  // Najważniejsze: próbujemy ustalić stop_id na podstawie stop_number
                  // Znajdź przystanek o takim samym numerze w głównej trasie
                  const stopNumber = parseInt(addStop.stop_number);
                  if (!stopNumber) {
                    console.error(
                      "Brak prawidłowego stop_number w additionalStop:",
                      addStop
                    );
                    continue;
                  }

                  // Szukamy przystanku o tym samym numerze w głównej trasie
                  const matchingStop = transformedData._ui.route1Stops.find(
                    (s) => parseInt(s.stop_number) === stopNumber
                  );

                  if (matchingStop) {
                    // Dodajemy kopię przystanku z głównymi danymi z trasy
                    additionalStops.push({
                      ...JSON.parse(JSON.stringify(matchingStop)),
                      routeId: `addStop_${
                        addStop.id || Math.random().toString(36).substr(2, 9)
                      }`,
                    });
                  } else {
                    console.warn(
                      `Nie znaleziono przystanku o numerze ${stopNumber} w głównej trasie`
                    );

                    // Próbujemy znaleźć przystanek w stopGroups
                    const stopEntry = firstRoute.fullRoute.find(
                      (s) => parseInt(s.stop_number) === stopNumber
                    );

                    if (stopEntry) {
                      const stopGroup = stopGroups.find(
                        (sg) => sg.id === stopEntry.stop_group_id
                      );

                      additionalStops.push({
                        id: stopEntry.stop_id,
                        stopId: stopEntry.stop_id,
                        routeId: `addStop_${
                          addStop.id || Math.random().toString(36).substr(2, 9)
                        }`,
                        stop_number: stopNumber,
                        is_optional: true,
                        is_first: false,
                        is_last: false,
                        on_request: false,
                        stopGroup: {
                          id: stopGroup?.id || stopEntry.stop_group_id,
                          name: stopGroup?.name || "Nazwa przystanku",
                        },
                      });
                    }
                  }
                }
              }

              return {
                signature:
                  route.signature ||
                  (idx === 0 ? "Podstawowy" : `Wariant ${idx + 1}`),
                color: route.color || "#3498db",
                additionalStops,
                isDefault: idx === 0,
              };
            }
          );

          // Czekamy na zakończenie wszystkich operacji asynchronicznych
          transformedData._ui.additionalInfo1.variants = await Promise.all(
            variantsPromises
          );

          // Przetwarzanie odjazdów
          const allDepartures = [];

          firstRoute.departureRoutes.forEach((route, variantIndex) => {
            // Obsługa różnej nazwy pola - raz timetable, raz departures
            const routeDepartures = route.timetable || route.departures || [];

            routeDepartures.forEach((dep) => {
              // Formatuj datę ISO do formatu czasu HH:MM:SS
              let timeStr = dep.departure_time || dep.departureTime || "";

              // If it's an ISO timestamp, extract just the time part without timezone conversion
              if (timeStr.includes("T")) {
                // Extract just the time portion (HH:MM:SS) directly from the string
                // This avoids timezone issues by not creating a Date object
                const timePart = timeStr.split("T")[1].split(".")[0];
                if (timePart) {
                  timeStr = timePart.substring(0, 8); // Get only HH:MM:SS part
                }
              }

              allDepartures.push({
                time: timeStr,
                variantIndex: variantIndex,
              });
            });
          });

          // Sortuj odjazdy według czasu
          allDepartures.sort((a, b) => a.time.localeCompare(b.time));
          transformedData._ui.schedules1 = [
            { type: "all", departures: allDepartures },
          ];
        }

        // Podobnie dla trasy 2, jeśli nie jest okrężna
        if (
          !firstRoute.is_circular &&
          !firstRoute.isCircular &&
          data.routes.length > 1
        ) {
          const secondRoute = data.routes[1];

          // Mapuj przystanki trasy powrotnej
          if (secondRoute.fullRoute && secondRoute.fullRoute.length > 0) {
            transformedData._ui.route2Stops = mapServerDataToRouteStops(
              secondRoute.fullRoute,
              stopGroups
            );
          }

          // Przetwarzanie wariantów trasy powrotnej jako niezależnych od trasy głównej
          if (
            secondRoute.departureRoutes &&
            secondRoute.departureRoutes.length > 0
          ) {
            // Przetworz warianty trasy powrotnej jako NIEZALEŻNE od trasy głównej
            const variantsPromises = secondRoute.departureRoutes.map(
              async (route, idx) => {
                // Przetwarzanie additionalStops
                const additionalStops = [];

                if (route.additionalStops && route.additionalStops.length > 0) {
                  for (const addStop of route.additionalStops) {
                    const stopNumber = parseInt(addStop.stop_number);
                    if (!stopNumber) continue;

                    // Szukamy przystanku o tym samym numerze w trasie powrotnej
                    const matchingStop = transformedData._ui.route2Stops.find(
                      (s) => parseInt(s.stop_number) === stopNumber
                    );

                    if (matchingStop) {
                      additionalStops.push({
                        ...JSON.parse(JSON.stringify(matchingStop)),
                        routeId: `addStop2_${
                          addStop.id || Math.random().toString(36).substr(2, 9)
                        }`,
                      });
                    }
                  }
                }

                // Używamy własnych danych wariantu zamiast kopiować z trasy głównej
                return {
                  signature:
                    route.signature ||
                    (idx === 0 ? "Podstawowy" : `Wariant ${idx + 1}`),
                  color: route.color || "#3498db",
                  additionalStops,
                  isDefault: idx === 0,
                  routeType: "return", // Oznaczamy jako wariant trasy powrotnej
                };
              }
            );

            transformedData._ui.additionalInfo2.variants = await Promise.all(
              variantsPromises
            );

            // Przetwarzanie odjazdów dla trasy powrotnej
            const returnDepartures = [];

            secondRoute.departureRoutes.forEach((route, variantIndex) => {
              // Obsługa różnej nazwy pola - raz timetable, raz departures
              const routeDepartures = route.timetable || route.departures || [];

              routeDepartures.forEach((dep) => {
                // Formatuj datę ISO do formatu czasu HH:MM:SS
                let timeStr = dep.departure_time || dep.departureTime || "";

                // If it's an ISO timestamp, extract just the time part without timezone conversion
                if (timeStr.includes("T")) {
                  // Extract just the time portion (HH:MM:SS) directly from the string
                  // This avoids timezone issues by not creating a Date object
                  const timePart = timeStr.split("T")[1].split(".")[0];
                  if (timePart) {
                    timeStr = timePart.substring(0, 8); // Get only HH:MM:SS part
                  }
                }

                returnDepartures.push({
                  time: timeStr,
                  variantIndex: variantIndex,
                });
              });
            });

            // Sortuj odjazdy według czasu
            returnDepartures.sort((a, b) => a.time.localeCompare(b.time));
            transformedData._ui.schedules2 = [
              { type: "all", departures: returnDepartures },
            ];
          } else {
            // Jeśli trasa powrotna nie ma swoich wariantów, inicjalizuj JEDNYM domyślnym wariantem
            transformedData._ui.additionalInfo2.variants = [
              {
                signature: "Podstawowy",
                color: "#3498db",
                additionalStops: [],
                isDefault: true,
                routeType: "return",
              },
            ];

            // Inicjalizuj puste schedules2, jeśli nie ma departureRoutes
            transformedData._ui.schedules2 = [{ type: "all", departures: [] }];
          }
        }
      }

      setLineData(transformedData);
    } catch (err) {
      console.error("Error loading line data:", err);
      setError("Nie udało się załadować danych linii");
    } finally {
      setIsLoading(false);
    }
  };

  // Load reference data (line types and stops)
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [lineTypesData, stopsData] = await Promise.all([
          LineTypeService.getAllLineTypes(),
          StopGroupService.getAllStops(),
        ]);

        setLineTypes(lineTypesData);
        setStopGroups(stopsData);
      } catch (err) {
        console.error("Error loading reference data:", err);
        setError("Nie udało się załadować danych referencyjnych");
      }
    };

    loadReferenceData();
  }, []);

  // Load line data if editing existing line
  useEffect(() => {
    if (!isAddMode) {
      loadLineData();
    }
  }, [id, isAddMode]);

  // Handle step navigation with conditional steps
  const nextStep = () => {
    const isCircular = lineData._ui.routeType === "circular";

    // Handle special cases for conditional steps
    if (currentStep === 2 && isCircular) {
      // Skip Route 2 if circular
      setCurrentStep(4);
    } else if (currentStep === 4 && isCircular) {
      0,
        // Skip Additional Info 2 if circular
        setCurrentStep(6);
    } else {
      // Normal progression
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    const isCircular = lineData._ui.routeType === "circular";

    // Handle special cases for conditional steps
    if (currentStep === 4 && isCircular) {
      // Skip back past Route 2 if circular
      setCurrentStep(2);
    } else if (currentStep === 6 && isCircular) {
      // Skip back past Additional Info 2 if circular
      setCurrentStep(4);
    } else {
      // Normal regression
      setCurrentStep(currentStep - 1);
    }
  };

  const prepareDataForAPI = () => {
    console.log("LineData przed konwersją:", lineData);

    const { name, lineTypeId, isActive } = lineData;
    const isCircular = lineData._ui.routeType === "circular";

    const isNight = lineData._ui.isNight || false;

    const convertStopsToAPIFormat = (stops) => {
      if (!stops || !Array.isArray(stops)) return [];

      return stops
        .map((stop) => {
          if (!stop) return null;

          return {
            stopId: stop.id || stop.stopId || "",
            stopNumber:
              stop.stop_number || parseInt(stop.routeId?.split("_")?.[1]) || 0,
            isFirst: !!stop.is_first,
            isLast: !!stop.is_last,
            isOptional: !!stop.is_optional,
            isOnRequest: !!stop.on_request,
            travelTime: stop.travel_time || 0,
          };
        })
        .filter(Boolean);
    };

    const additionalInfo1 = lineData._ui.additionalInfo1 || {};
    const variants1 = Array.isArray(additionalInfo1.variants)
      ? additionalInfo1.variants
      : [
          {
            signature: "Podstawowy",
            color: "#3498db",
            additionalStops: [],
            isDefault: true,
          },
        ];

    const route1DepartureRoutes = variants1.map((variant, idx) => {
      if (!variant) {
        console.error(`Variant at index ${idx} is null or undefined`);
        variant = {
          signature: "Podstawowy",
          color: "#3498db",
          additionalStops: [],
        };
      }

      const schedules1 = Array.isArray(lineData._ui.schedules1)
        ? lineData._ui.schedules1
        : [];
      const departures = schedules1[0]?.departures || [];

      const variantDepartures = departures
        .filter((dep) => dep && dep.variantIndex === idx)
        .map((dep) => {
          let formattedTime = dep.time || "00:00:00";
          if (formattedTime && formattedTime.split(":").length === 2) {
            formattedTime = `${formattedTime}:00`;
          }
          return {
            departureTime: formattedTime,
            dayType: "all",
          };
        });

      // Przetwarzanie opcjonalnych przystanków do formatu API
      const additionalStops = Array.isArray(variant.additionalStops)
        ? variant.additionalStops
            .map((stop) => {
              if (!stop) return null;
              return {
                stopId: stop.id || stop.stopId || "",
                stopNumber: stop.stop_number || 0,
                isFirst: !!stop.is_first,
                isLast: !!stop.is_last,
                isOptional: !!stop.is_optional,
                isOnRequest: !!stop.on_request,
                travelTime: stop.travel_time || 0,
              };
            })
            .filter(Boolean)
        : [];

      // Zwróć departureRoute z additionalStops i departures dla tego wariantu
      return {
        signature: variant.signature || "Podstawowy",
        color: variant.color || "#3498db",
        additionalStops: additionalStops,
        departures: variantDepartures,
      };
    });

    const route1Stops = convertStopsToAPIFormat(lineData._ui.route1Stops || []);

    const route1 = {
      isCircular,
      isNight,
      fullRoutes: [
        {
          fullRoute: route1Stops,
          departureRoutes: route1DepartureRoutes,
        },
      ],
    };

    const routes = [route1];

    if (!isCircular) {
      const route2Stops = convertStopsToAPIFormat(
        lineData._ui.route2Stops || []
      );

      const additionalInfo2 = lineData._ui.additionalInfo2 || {};
      const variants2 = Array.isArray(additionalInfo2.variants)
        ? additionalInfo2.variants
        : [
            {
              signature: "Podstawowy",
              color: "#3498db",
              additionalStops: [],
              isDefault: true,
            },
          ];

      const route2DepartureRoutes = variants2.map((variant, idx) => {
        if (!variant) {
          console.error(
            `Variant (route2) at index ${idx} is null or undefined`
          );
          variant = {
            signature: "Podstawowy",
            color: "#3498db",
            additionalStops: [],
          };
        }

        const schedules2 = Array.isArray(lineData._ui.schedules2)
          ? lineData._ui.schedules2
          : [];
        const departures = schedules2[0]?.departures || [];

        const variantDepartures = departures
          .filter((dep) => dep && dep.variantIndex === idx)
          .map((dep) => {
            let formattedTime = dep.time || "00:00:00";
            if (formattedTime && formattedTime.split(":").length === 2) {
              formattedTime = `${formattedTime}:00`;
            }
            return {
              departureTime: formattedTime,
              dayType: "all",
            };
          });

        // Przetwarzanie opcjonalnych przystanków do formatu API
        const additionalStops = Array.isArray(variant.additionalStops)
          ? variant.additionalStops
              .map((stop) => {
                if (!stop) return null;
                return {
                  stopId: stop.id || stop.stopId || "",
                  stopNumber: stop.stop_number || 0,
                  isFirst: !!stop.is_first,
                  isLast: !!stop.is_last,
                  isOptional: !!stop.is_optional,
                  isOnRequest: !!stop.on_request,
                  travelTime: stop.travel_time || 0,
                };
              })
              .filter(Boolean)
          : [];

        // Zwróć departureRoute z additionalStops i departures dla tego wariantu
        return {
          signature: variant.signature || "Podstawowy",
          color: variant.color || "#3498db",
          additionalStops: additionalStops,
          departures: variantDepartures,
        };
      });

      if (route2Stops.length > 0) {
        const route2 = {
          isCircular: false,
          isNight: isNight,
          fullRoutes: [
            {
              fullRoute: route2Stops,
              departureRoutes: route2DepartureRoutes,
            },
          ],
        };

        routes.push(route2);
      }
    }

    const apiData = {
      name,
      lineTypeId,
      isActive,
      routes,
    };

    console.log(
      "Dane przygotowane do wysłania do API:",
      JSON.stringify(apiData, null, 2)
    );
    return apiData;
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiData = prepareDataForAPI();

      let result;
      if (isAddMode) {
        result = await LineService.createLine(apiData);
        toast.success("Linia została pomyślnie utworzona!");
      } else {
        result = await LineService.updateLine(id, apiData);
        toast.success("Linia została pomyślnie zaktualizowana!");
      }

      navigate("/");
    } catch (err) {
      console.error("Błąd podczas zapisywania linii:", err);
      setError(err.message || "Wystąpił błąd podczas zapisywania linii");
      toast.error("Nie udało się zapisać linii. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateLineData = (data) => {
    setLineData((prev) => {
      const newState = { ...prev };

      if (data.hasOwnProperty("isNight")) {
        newState.routes = newState.routes.map((route) => ({
          ...route,
          isNight: data.isNight,
        }));

        if (!newState._ui) newState._ui = {};
        newState._ui.isNight = data.isNight;

        console.log("Updated isNight value:", data.isNight);
      }

      if (data._ui) {
        const updatedUI = { ...newState._ui };

        Object.keys(data._ui).forEach((key) => {
          if (key === "additionalInfo1") {
            updatedUI.additionalInfo1 = {
              ...updatedUI.additionalInfo1,
              ...data._ui.additionalInfo1,
            };

            if (data._ui.additionalInfo1 && data._ui.additionalInfo1.variants) {
              updatedUI.additionalInfo1.variants =
                data._ui.additionalInfo1.variants;
            }
          } else {
            updatedUI[key] = data._ui[key];
          }
        });

        if (data._ui?.additionalInfo1?.variants !== undefined) {
          updatedUI.additionalInfo1.variants =
            data._ui.additionalInfo1.variants;
        }

        if (data._ui?.additionalInfo2?.variants !== undefined) {
          updatedUI.additionalInfo2.variants =
            data._ui.additionalInfo2.variants;
        }

        newState._ui = updatedUI;
      }

      const { _ui, ...basicFields } = data;
      return {
        ...newState,
        ...basicFields,
      };
    });
  };

  const getStepNames = () => {
    const isCircular = lineData._ui.routeType === "circular";

    const baseSteps = ["Podstawowe informacje", "Trasa pierwsza"];

    if (!isCircular) {
      baseSteps.push("Trasa powrotna");
    }

    baseSteps.push("Informacje dodatkowe");

    if (!isCircular) {
      baseSteps.push("Informacje dodatkowe 2");
    }

    baseSteps.push("Rozkład jazdy");

    if (!isCircular) {
      baseSteps.push("Rozkład jazdy (powrót)");
    }

    baseSteps.push("Podsumowanie");

    return baseSteps;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            data={{
              name: lineData.name,
              lineTypeId: lineData.lineTypeId,
              isCircular: lineData._ui.routeType === "circular",
              isNight: lineData._ui.isNight || false,
            }}
            lineTypes={lineTypes}
            updateData={(basicData) => {
              const updates = { ...basicData };

              if (basicData.hasOwnProperty("isCircular")) {
                updateLineData({
                  ...updates,
                  _ui: {
                    routeType: basicData.isCircular
                      ? "circular"
                      : "bidirectional",
                  },
                });
              } else if (basicData.hasOwnProperty("isNight")) {
                console.log("Setting isNight to:", basicData.isNight);
                updateLineData({
                  isNight: basicData.isNight,
                });
              } else {
                updateLineData(updates);
              }
            }}
            onNext={nextStep}
            isEditMode={!isAddMode}
            hasReturnRoute={lineData._ui.route2Stops.length > 0}
            hasAdditionalInfo2={
              lineData._ui.additionalInfo2 &&
              (lineData._ui.additionalInfo2.description ||
                lineData._ui.additionalInfo2.notes)
            }
          />
        );
      case 2:
        return (
          <Route1Step
            key="route1"
            data={{
              stops: lineData._ui.route1Stops,
            }}
            stops={stopGroups}
            updateData={(routeData) =>
              updateLineData({ _ui: { route1Stops: routeData.stops } })
            }
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <Route1Step
            key="route2"
            data={{
              stops: lineData._ui.route2Stops,
            }}
            stops={stopGroups}
            updateData={(routeData) =>
              updateLineData({ _ui: { route2Stops: routeData.stops } })
            }
            onNext={nextStep}
            onPrev={prevStep}
            onCancel={() => navigate("/")}
            isReturnRoute={true}
          />
        );
      case 4:
        return (
          <AdditionalInfo1Step
            key="route1"
            data={lineData._ui.additionalInfo1 || {}}
            stops={lineData._ui.route1Stops || []}
            updateData={(additionalData) => {
              const uiUpdates = { additionalInfo1: {} };

              if (additionalData.description !== undefined) {
                uiUpdates.additionalInfo1.description =
                  additionalData.description || "";
              }

              if (additionalData.notes !== undefined) {
                uiUpdates.additionalInfo1.notes = additionalData.notes || "";
              }

              if (additionalData.variants !== undefined) {
                uiUpdates.additionalInfo1.variants = additionalData.variants;
              }

              if (additionalData._stopsOverride) {
                uiUpdates.route1Stops = additionalData._stopsOverride;
              }

              updateLineData({ _ui: uiUpdates });
            }}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 5:
        return (
          <AdditionalInfo1Step
            key="route2"
            data={lineData._ui.additionalInfo2 || {}}
            stops={lineData._ui.route2Stops || []}
            updateData={(additionalData) => {
              const uiUpdates = { additionalInfo2: {} };

              if (additionalData.description !== undefined) {
                uiUpdates.additionalInfo2.description =
                  additionalData.description || "";
              }

              if (additionalData.notes !== undefined) {
                uiUpdates.additionalInfo2.notes = additionalData.notes || "";
              }

              if (additionalData.variants !== undefined) {
                uiUpdates.additionalInfo2.variants =
                  additionalData.variants.map((variant) => ({
                    ...variant,
                    routeType: "return",
                  }));
              }

              if (additionalData._stopsOverride) {
                uiUpdates.route2Stops = additionalData._stopsOverride;
              }

              updateLineData({ _ui: uiUpdates });
            }}
            onNext={nextStep}
            onPrev={prevStep}
            isReturnRoute={true}
          />
        );
      case 6:
        return (
          <DeparturesStep
            data={{
              schedules:
                lineData._ui.schedules1 && lineData._ui.schedules1.length > 0
                  ? lineData._ui.schedules1
                  : [{ type: "all", departures: [] }],
              variants: lineData._ui.additionalInfo1?.variants || [
                {
                  signature: "Podstawowy",
                  color: "#3498db",
                  additionalStops: [],
                  isDefault: true,
                },
              ],
            }}
            updateData={(scheduleData) => {
              updateLineData({
                _ui: {
                  schedules1: scheduleData.schedules || [],
                },
              });
            }}
            routeType="first"
            title="Rozkład jazdy - trasa podstawowa"
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 7:
        if (lineData._ui.routeType === "circular") {
          return (
            <ReviewStep
              data={{
                ...lineData,
                ...lineData._ui,
              }}
              lineTypes={lineTypes}
              stops={stopGroups}
              onSubmit={handleSubmit}
              onPrev={prevStep}
              isLoading={isLoading}
            />
          );
        }
        return (
          <DeparturesStep
            key="route2"
            data={{
              schedules:
                lineData._ui.schedules2 && lineData._ui.schedules2.length > 0
                  ? lineData._ui.schedules2
                  : [{ type: "all", departures: [] }],
              variants: lineData._ui.additionalInfo2?.variants || [
                {
                  signature: "Podstawowy",
                  color: "#3498db",
                  additionalStops: [],
                  isDefault: true,
                  routeType: "return",
                },
              ],
            }}
            updateData={(scheduleData) => {
              updateLineData({
                _ui: {
                  schedules2: scheduleData.schedules || [],
                },
              });
            }}
            routeType="second"
            title="Rozkład jazdy - trasa powrotna"
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 8:
        return (
          <ReviewStep
            data={{
              ...lineData,
              ...lineData._ui,
            }}
            lineTypes={lineTypes}
            stops={stopGroups}
            onSubmit={handleSubmit}
            onPrev={prevStep}
            isLoading={isLoading}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  const calculateVisualStep = (actualStep) => {
    const isCircular = lineData._ui.routeType === "circular";

    if (isCircular) {
      if (actualStep === 4) return 3;
      if (actualStep === 6) return 4;
      if (actualStep === 8) return 5;
    }

    return actualStep;
  };

  if (isLoading && currentStep === 1) {
    return (
      <div className={styles.loading}>
        <Loading />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.editLine}>
      <StepIndicator
        steps={getStepNames()}
        currentStep={calculateVisualStep(currentStep)}
      />

      <Card width="100%" className={styles.card}>
        {renderStep()}
      </Card>
    </div>
  );
};

export default EditLine;
