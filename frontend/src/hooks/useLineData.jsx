import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LineService } from "../services/lineService";
import { LineTypeService } from "../services/lineTypeService";
import { StopGroupService } from "../services/stopGroupService";
import { cloneDeep } from "lodash";

function useLineData(id, isAddMode, navigate) {
  const [lineData, setLineData] = useState({
    name: "",
    lineTypeId: "",
    isActive: true,

    _ui: {
      routeType: "bidirectional",
      route1Stops: [],
      route2Stops: [],
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
      additionalInfo2: {},
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
  const [isLoading, setIsLoading] = useState(!isAddMode);
  const [error, setError] = useState(null);

  const [lineTypes, setLineTypes] = useState([]);
  const [stopGroups, setStopGroups] = useState([]);

  const mapServerDataToRouteStops = (fullRoute, stopGroups) => {
    if (!fullRoute || !Array.isArray(fullRoute)) return [];
    console.log(fullRoute);
    return fullRoute.map((stop) => {
      const stopGroup = stopGroups.find(
        (sg) => Number(sg.id) === Number(stop.stop_group_id)
      ) || {
        id: stop.stop_group_id,
        name: "Nieznany przystanek",
      };

      return {
        id: stop.stop_id,
        stop_id: stop.stop_id,
        map: stop.map || "",
        street: stop.street || "",
        stop_group: {
          id: stopGroup.id,
          name: stopGroup.name,
        },
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

      const transformedData = {
        name: data.name,
        lineTypeId: data.line_type_id || data.lineTypeId,
        isActive: data.isActive !== false,
        isNight: data.routes[0]?.is_night || false,
        routes: data.routes || [],
        _ui: {
          routeType: data.routes?.[0]?.is_circular
            ? "circular"
            : "bidirectional",
          route1Stops: [],
          route2Stops: [],
          additionalInfo1: { variants: [] },
          additionalInfo2: { variants: [] },
          schedules1: [{ type: "all", departures: [] }],
          schedules2: [{ type: "all", departures: [] }],
        },
      };

      if (data.routes?.length > 0) {
        await processRoute(data.routes[0], transformedData, stopGroups, 1);

        if (!data.routes[0].is_circular && data.routes.length > 1) {
          await processRoute(data.routes[1], transformedData, stopGroups, 2);
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

  const processRoute = async (
    route,
    transformedData,
    stopGroups,
    routeNumber
  ) => {
    const routePrefix = routeNumber === 1 ? "route1" : "route2";
    const routeType = routeNumber === 1 ? "" : "return";
    const addStopPrefix = routeNumber === 1 ? "addStop_" : "addStop2_";

    if (route.fullRoute && route.fullRoute.length > 0) {
      transformedData._ui[`${routePrefix}Stops`] = mapServerDataToRouteStops(
        route.fullRoute,
        stopGroups
      );
    }

    if (route.departureRoutes && route.departureRoutes.length > 0) {
      const variantsPromises = route.departureRoutes.map(
        async (departureRoute, idx) => {
          const additionalStops = [];

          if (
            departureRoute.additionalStops &&
            departureRoute.additionalStops.length > 0
          ) {
            for (const addStop of departureRoute.additionalStops) {
              const stopNumber = parseInt(addStop.stop_number);
              if (!stopNumber) continue;

              const matchingStop = transformedData._ui[
                `${routePrefix}Stops`
              ].find((s) => parseInt(s.stop_number) === stopNumber);

              if (matchingStop) {
                additionalStops.push({
                  ...(routeNumber === 1
                    ? structuredClone(matchingStop)
                    : cloneDeep(matchingStop)),
                  routeId: `${addStopPrefix}${
                    addStop.id || Math.random().toString(36).substr(2, 9)
                  }`,
                });
              } else if (routeNumber === 1) {
                console.warn(
                  `Nie znaleziono przystanku o numerze ${stopNumber} w głównej trasie`
                );

                const stopEntry = route.fullRoute.find(
                  (s) => parseInt(s.stop_number) === stopNumber
                );

                if (stopEntry) {
                  const stopGroup = stopGroups.find(
                    (sg) => sg.id === stopEntry.stop_group_id
                  );

                  additionalStops.push({
                    id: stopEntry.stop_id,
                    stopId: stopEntry.stop_id,
                    routeId: `${addStopPrefix}${
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
              departureRoute.signature ||
              (idx === 0 ? "Podstawowy" : `Wariant ${idx + 1}`),
            color: departureRoute.color || "#3498db",
            additionalStops,
            isDefault: idx === 0,
            ...(routeType ? { routeType } : {}),
          };
        }
      );

      transformedData._ui[`additionalInfo${routeNumber}`].variants =
        await Promise.all(variantsPromises);

      const allDepartures = [];

      route.departureRoutes.forEach((departureRoute, variantIndex) => {
        const routeDepartures =
          departureRoute.timetable || departureRoute.departures || [];

        routeDepartures.forEach((dep) => {
          let timeStr = dep.departure_time || dep.departureTime || "";

          if (timeStr.includes("T")) {
            const timePart = timeStr.split("T")[1].split(".")[0];
            if (timePart) {
              timeStr = timePart.substring(0, 8);
            }
          }

          allDepartures.push({
            time: timeStr,
            variantIndex: variantIndex,
          });
        });
      });

      allDepartures.sort((a, b) => a.time.localeCompare(b.time));
      transformedData._ui[`schedules${routeNumber}`] = [
        { type: "all", departures: allDepartures },
      ];
    } else if (routeNumber === 2) {
      transformedData._ui.additionalInfo2.variants = [
        {
          signature: "Podstawowy",
          color: "#3498db",
          additionalStops: [],
          isDefault: true,
          routeType: "return",
        },
      ];
      transformedData._ui.schedules2 = [{ type: "all", departures: [] }];
    }
  };

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

  useEffect(() => {
    if (!isAddMode) {
      loadLineData();
    }
  }, [id, isAddMode]);

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
            stopNumber: stop.stop_number || 0,
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
          };
        });

      const additionalStops = Array.isArray(variant.additionalStops)
        ? variant.additionalStops
            .map((stop) => {
              if (!stop) return null;
              return {
                stopNumber: stop.stop_number || 0,
              };
            })
            .filter(Boolean)
        : [];

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
            };
          });

        const additionalStops = Array.isArray(variant.additionalStops)
          ? variant.additionalStops
              .map((stop) => {
                if (!stop) return null;
                return {
                  stopNumber: stop.stop_number || 0,
                };
              })
              .filter(Boolean)
          : [];

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

  let result;

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiData = prepareDataForAPI();

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
    if (process.env.NODE_ENV !== "production") {
      console.group("Line data update");
      console.log("Previous state:", JSON.parse(JSON.stringify(lineData)));
      console.log("Update payload:", data);
      console.groupEnd();
    }

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

  return {
    lineData,
    updateLineData,
    isLoading,
    error,
    lineTypes,
    stopGroups,
    prepareDataForAPI,
    handleSubmit,
  };
}

export default useLineData;
