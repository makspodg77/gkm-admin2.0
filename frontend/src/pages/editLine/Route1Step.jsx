import {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useMemo,
} from "react";
import styles from "./Route1Step.module.css";
import Input from "../../components/input/Input";
import StopMap from "../../components/stopMap/StopMap";
import Button from "../../components/button/Button";
import Pagination from "../../components/pagination/Pagination";
import "react-toastify/dist/ReactToastify.css";

const Route1Step = forwardRef(
  (
    { stops = [], data = { stops: [] }, updateData, isReturnRoute = false },
    ref
  ) => {
    const [stopSearch, setStopSearch] = useState("");
    const [filteredStops, setFilteredStops] = useState([]);
    const [route, setRoute] = useState(data.stops || []);
    const [expandedStops, setExpandedStops] = useState({});
    const [lastRouteId, setLastRouteId] = useState(
      data.stops?.length > 0
        ? Math.max(...data.stops.map((stop) => stop.routeId || 0))
        : 0
    );

    useEffect(() => {
      const initialStops = data.stops || [];
      const validatedStops = initialStops.map((stop, index) => {
        return {
          ...stop,
          routeId: stop.routeId || stop.id || `temp_${index}`,
          id: stop.id || stop.stopId || stop.stop_id,
          stopId: stop.stopId || stop.id || stop.stop_id,
          stop_number: stop.stop_number || index + 1,
          travel_time: stop.travel_time || 0,
          on_request: stop.on_request || stop.is_on_request || false,
          is_optional: stop.is_optional || false,
          is_first: stop.is_first || false,
          is_last: stop.is_last || false,
          stop_group: {
            id: stop.stop_group?.id || stop.stop_group_id || "unknown",
            name:
              stop.stop_group?.name ||
              stop.stopGroup?.name ||
              "Nieznany przystanek",
          },
          street: stop.street || "",
          map: stop.map || "",
        };
      });

      setRoute(validatedStops);
    }, []);

    const getStopName = (stop) => {
      if (!stop) return "Brak danych";

      if (stop.stop_group && stop.stop_group.name) {
        return stop.stop_group.name;
      }

      if (stop.name) return stop.name;
      if (stop.stop_name) return stop.stop_name;
      if (stop.stopGroup) return stop.stopGroup.name;
      return "Nieznany przystanek";
    };

    const getStopStreet = (stop) => {
      if (!stop) return "";
      return stop.street || "";
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [stopsPerPage] = useState(5);

    const updateRouteAndParent = useCallback(
      (newRoute) => {
        const routeWithNumbers = newRoute.map((stop, index) => ({
          ...stop,
          stop_number: index + 1,
        }));

        setRoute(routeWithNumbers);

        if (updateData) {
          updateData({ stops: routeWithNumbers });
        }
      },
      [updateData]
    );

    useEffect(() => {
      if (route && route.length > 0) {
        const needsUpdate = route.some(
          (stop, index) => stop.stop_number !== index + 1
        );

        if (needsUpdate) {
          const updatedRoute = route.map((stop, index) => ({
            ...stop,
            stop_number: index + 1,
          }));

          setRoute(updatedRoute);

          if (updateData) {
            updateData({ stops: updatedRoute });
          }
        }
      }
    }, [route.length]);

    useEffect(() => {
      if (!stops) {
        setFilteredStops([]);
        return;
      }

      if (stopSearch === "") {
        setFilteredStops(stops);
      } else {
        const search = stopSearch.toLowerCase();

        const filtered = stops.filter(
          (stop) =>
            stop.stopGroup &&
            stop.stopGroup.name &&
            stop.stopGroup.name.toLowerCase().includes(search)
        );
        setFilteredStops(filtered);
      }

      setCurrentPage(1);
    }, [stops, stopSearch]);

    const indexOfLastStop = currentPage * stopsPerPage;
    const indexOfFirstStop = indexOfLastStop - stopsPerPage;
    const currentStops = filteredStops.slice(indexOfFirstStop, indexOfLastStop);

    const totalPages = Math.ceil(filteredStops.length / stopsPerPage);

    const updateRouteStop = useCallback(
      (routeId, updates) => {
        setRoute((currentRoute) => {
          const updatedRoute = currentRoute.map((stop) =>
            stop.routeId === routeId ? { ...stop, ...updates } : stop
          );

          const routeWithNumbers = updatedRoute.map((stop, index) => ({
            ...stop,
            stop_number: index + 1,
          }));

          if (updateData) {
            updateData({ stops: routeWithNumbers });
          }

          return routeWithNumbers;
        });
      },
      [updateData]
    );

    const addStopToRoute = (stop) => {
      const newRouteId = lastRouteId + 1;
      setLastRouteId(newRouteId);

      const updatedRoute = [
        ...route,
        {
          ...stop,
          routeId: newRouteId,
          stop_number: route.length + 1,
          travel_time: 0,
          on_request: false,
          is_optional: false,
          is_first: route.length === 0,
          is_last: false,
        },
      ];

      updateRouteAndParent(updatedRoute);

      setExpandedStops((prev) => ({
        ...prev,
        [newRouteId]: true,
      }));
    };

    const getStopOccurrences = (stopId) => {
      if (!stopId) return 0;
      return route.filter(
        (routeStop) =>
          routeStop.stopId === stopId || routeStop.stop_id === stopId
      ).length;
    };

    const validateRoute = () => {
      if (route.length === 0) {
        return {
          valid: false,
          error: `Trasa ${
            isReturnRoute ? "powrotna" : "podstawowa"
          } musi zawierać co najmniej jeden przystanek`,
        };
      }

      const hasNonOptionalFirst = route.some(
        (stop) => stop.is_first && !stop.is_optional
      );
      if (!hasNonOptionalFirst) {
        return {
          valid: false,
          error: `Trasa ${
            isReturnRoute ? "powrotna" : "podstawowa"
          } musi mieć co najmniej jeden nieopcjonalny przystanek początkowy`,
        };
      }

      const hasNonOptionalLast = route.some(
        (stop) => stop.is_last && !stop.is_optional
      );
      if (!hasNonOptionalLast) {
        return {
          valid: false,
          error: `Trasa ${
            isReturnRoute ? "powrotna" : "podstawowa"
          } musi mieć co najmniej jeden nieopcjonalny przystanek końcowy`,
        };
      }

      return { valid: true };
    };

    useImperativeHandle(ref, () => ({
      validateRoute: () => {
        return validateRoute();
      },
    }));

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
      <>
        {isReturnRoute && (
          <div className={styles.routeHeader}>
            <h2>Trasa powrotna</h2>
            <p>
              Zdefiniuj trasę powrotną linii, dodając przystanki i określając
              ich właściwości.
            </p>
          </div>
        )}

        {!isReturnRoute && (
          <div className={styles.routeHeader}>
            <h2>Trasa podstawowa</h2>
            <p>
              Zdefiniuj trasę podstawową linii, dodając przystanki i określając
              ich właściwości.
            </p>
          </div>
        )}

        <div className={styles.container}>
          <div className={styles.left}>
            {route.length === 0 ? (
              <div className={styles.emptyRoute}>
                Kliknij na przystanki z prawej strony, aby dodać je do trasy
              </div>
            ) : (
              route.map((stop, index) => {
                const isShown = expandedStops[stop.routeId] || false;
                const occurrences = getStopOccurrences(stop.id);
                const isRepeated = occurrences > 1;

                return (
                  <div key={stop.routeId} className={styles.routeStopWrapper}>
                    <div
                      className={`${styles.routeStop} 
                      ${isRepeated ? styles.repeatedStop : ""} 
                      ${stop.is_first ? styles.firstStop : ""} 
                      ${stop.is_last ? styles.lastStop : ""} 
                      ${stop.is_optional ? styles.optionalStop : ""}`}
                    >
                      <div
                        className={styles.routeStopHeader}
                        onClick={() => {
                          setExpandedStops((prev) => ({
                            ...prev,
                            [stop.routeId]: !isShown,
                          }));
                        }}
                      >
                        <div>
                          <span className={styles.stopNumber}>{index + 1}</span>
                          <span>{getStopName(stop)}</span>
                          {isRepeated && (
                            <span className={styles.repeatBadge}>↻</span>
                          )}
                          {stop.is_first && (
                            <span
                              className={`${styles.statusBadge} ${styles.firstBadge}`}
                              title="Przystanek początkowy"
                            >
                              ⭐
                            </span>
                          )}
                          {stop.is_last && (
                            <span
                              className={`${styles.statusBadge} ${styles.lastBadge}`}
                              title="Przystanek końcowy"
                            >
                              🏁
                            </span>
                          )}
                          {stop.is_optional && (
                            <span
                              className={`${styles.statusBadge} ${styles.optionalBadge}`}
                              title="Przystanek opcjonalny"
                            >
                              ✓?
                            </span>
                          )}
                        </div>
                        <span className={styles.expandIcon}>
                          {isShown ? "▼" : "►"}
                        </span>
                      </div>

                      {isShown && (
                        <div className={styles.routeStopDetails}>
                          <div className={styles.stopInfo}>
                            <div>{getStopStreet(stop)}</div>
                            {isRepeated && (
                              <div className={styles.repeatInfo}>
                                Ten przystanek występuje w trasie {occurrences}{" "}
                                razy
                              </div>
                            )}
                          </div>

                          <div className={styles.detailRow}>
                            <div className={styles.detailLabel}>
                              🕒 Czas podróży (minuty):
                            </div>
                            <div className={styles.detailValue}>
                              <Input
                                type="number"
                                value={stop.travel_time}
                                onChange={(e) =>
                                  updateRouteStop(stop.routeId, {
                                    travel_time: parseInt(e.target.value) || 0,
                                  })
                                }
                                min="0"
                                max="120"
                              />
                            </div>
                          </div>

                          <div className={styles.detailRow}>
                            <div className={styles.detailLabel}>
                              <Input
                                type="checkbox"
                                label="Na żądanie"
                                checked={stop.on_request}
                                onChange={(e) =>
                                  updateRouteStop(stop.routeId, {
                                    on_request: e.target.checked,
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div className={styles.stopTypeSection}>
                            <div className={styles.stopTypeTitle}>
                              Rodzaj przystanku:
                            </div>

                            <div className={styles.checkboxGroup}>
                              <Input
                                type="checkbox"
                                label="Opcjonalny"
                                checked={stop.is_optional}
                                onChange={(e) => {
                                  const isOptional = e.target.checked;

                                  if (
                                    !isOptional &&
                                    (stop.is_first || stop.is_last)
                                  ) {
                                    const updatedRoute = route.map(
                                      (routeStop) => {
                                        if (routeStop.routeId === stop.routeId)
                                          return routeStop;

                                        if (!routeStop.is_optional) {
                                          if (
                                            stop.is_first &&
                                            routeStop.is_first
                                          ) {
                                            return {
                                              ...routeStop,
                                              is_first: false,
                                            };
                                          }
                                          if (
                                            stop.is_last &&
                                            routeStop.is_last
                                          ) {
                                            return {
                                              ...routeStop,
                                              is_last: false,
                                            };
                                          }
                                        }
                                        return routeStop;
                                      }
                                    );

                                    updateRouteAndParent(
                                      updatedRoute.map((routeStop) =>
                                        routeStop.routeId === stop.routeId
                                          ? {
                                              ...routeStop,
                                              is_optional: isOptional,
                                            }
                                          : routeStop
                                      )
                                    );
                                  } else {
                                    updateRouteStop(stop.routeId, {
                                      is_optional: isOptional,
                                    });
                                  }
                                }}
                              />

                              <Input
                                type="checkbox"
                                label="Początkowy"
                                checked={stop.is_first}
                                onChange={(e) => {
                                  const isFirst = e.target.checked;

                                  if (isFirst) {
                                    if (!stop.is_optional) {
                                      const updatedRoute = route.map(
                                        (routeStop) => {
                                          if (
                                            routeStop.routeId !==
                                              stop.routeId &&
                                            !routeStop.is_optional
                                          ) {
                                            return {
                                              ...routeStop,
                                              is_first: false,
                                            };
                                          }
                                          return routeStop;
                                        }
                                      );
                                      updateRouteAndParent(updatedRoute);
                                    }

                                    updateRouteStop(stop.routeId, {
                                      is_first: true,
                                      is_last: stop.is_optional
                                        ? stop.is_last
                                        : false,
                                    });
                                  } else {
                                    updateRouteStop(stop.routeId, {
                                      is_first: false,
                                    });
                                  }
                                }}
                              />

                              <Input
                                type="checkbox"
                                label="Końcowy"
                                checked={stop.is_last}
                                onChange={(e) => {
                                  const isLast = e.target.checked;

                                  if (isLast) {
                                    if (!stop.is_optional) {
                                      const updatedRoute = route.map(
                                        (routeStop) => {
                                          if (
                                            routeStop.routeId !==
                                              stop.routeId &&
                                            !routeStop.is_optional
                                          ) {
                                            return {
                                              ...routeStop,
                                              is_last: false,
                                            };
                                          }
                                          return routeStop;
                                        }
                                      );
                                      updateRouteAndParent(updatedRoute);
                                    }

                                    updateRouteStop(stop.routeId, {
                                      is_last: true,
                                      is_first: stop.is_optional
                                        ? stop.is_first
                                        : false,
                                    });
                                  } else {
                                    updateRouteStop(stop.routeId, {
                                      is_last: false,
                                    });
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className={styles.actionButtons}>
                            <Button
                              onClick={() => {
                                if (index > 0) {
                                  const newRoute = [...route];
                                  [newRoute[index], newRoute[index - 1]] = [
                                    newRoute[index - 1],
                                    newRoute[index],
                                  ];
                                  updateRouteAndParent(newRoute);
                                }
                              }}
                              disabled={index === 0}
                              variant="secondary"
                            >
                              ↑ W górę
                            </Button>

                            <Button
                              onClick={() => {
                                if (index < route.length - 1) {
                                  const newRoute = [...route];
                                  [newRoute[index], newRoute[index + 1]] = [
                                    newRoute[index + 1],
                                    newRoute[index],
                                  ];
                                  updateRouteAndParent(newRoute);
                                }
                              }}
                              disabled={index === route.length - 1}
                              variant="secondary"
                            >
                              ↓ W dół
                            </Button>

                            <Button
                              onClick={() => {
                                const updatedRoute = route.filter(
                                  (s) => s.routeId !== stop.routeId
                                );
                                updateRouteAndParent(updatedRoute);
                              }}
                              color="#f44336"
                              variant="custom"
                            >
                              Usuń przystanek
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.right}>
            <Input
              placeholder={"Wyszukaj..."}
              type={"search"}
              height="48px"
              width={"100%"}
              value={stopSearch}
              onChange={(e) => setStopSearch(e.target.value)}
            />

            {filteredStops.length === 0 ? (
              <div className={styles.noResults}>
                {stops.length === 0
                  ? "Brak dostępnych przystanków"
                  : "Nie znaleziono przystanków pasujących do wyszukiwania"}
              </div>
            ) : (
              <>
                <div className={styles.stopsContainer}>
                  {currentStops.map((stop, index) => (
                    <div
                      className={styles.stop}
                      key={`page-${currentPage}-stop-${index}`}
                      onClick={() => addStopToRoute(stop)}
                    >
                      <div className={styles.mapContainer}>
                        <StopMap
                          coordinates={stop.map}
                          stopName={
                            stop.stopGroup?.name ||
                            stop.stop_group?.name ||
                            stop.name ||
                            "Nieznany przystanek"
                          }
                          height={"100%"}
                          zoom={16}
                          lazyLoad={true}
                        />
                      </div>
                      <div className={styles.stopNameContainer}>
                        <div className={styles.stopName}>
                          {stop.stopGroup?.name ||
                            stop.stop_name ||
                            "Nieznany przystanek"}
                        </div>
                        <div className={styles.stopStreet}>
                          {stop.street || ""}
                        </div>
                        <div className={styles.stopId}>
                          ID: {stop.stopGroup?.id || stop.stop_group_id || "?"}/
                          {stop.id || stop.stop_id || "?"}
                        </div>
                        {getStopOccurrences(stop.id || stop.stop_id) > 0 && (
                          <div className={styles.alreadyInRoute}>
                            Już w trasie:{" "}
                            {getStopOccurrences(stop.id || stop.stop_id)}×
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.paginationContainer}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={paginate}
                    showPageNumbers={true}
                    maxVisiblePages={5}
                  />
                  <div className={styles.paginationInfo}>
                    Pokazano {currentStops.length} z {filteredStops.length}{" "}
                    przystanków
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }
);

export default Route1Step;
