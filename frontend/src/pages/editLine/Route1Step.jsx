import { useState, useEffect } from "react";
import styles from "./Route1Step.module.css";
import Input from "../../components/input/Input";
import StopMap from "../../components/stopMap/StopMap";
import Divider from "../../components/divider/Divider";
import Button from "../../components/button/Button";
import Pagination from "../../components/pagination/Pagination";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Route1Step = ({
  stops = [],
  data = { stops: [] },
  updateData,
  onNext,
  onPrev,
  onCancel,
  isReturnRoute = false,
}) => {
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
    console.log("Route1Step otrzymał dane:", data);
    console.log("Dostępne przystanki:", stops);

    // Sprawdź, czy przystanki mają wszystkie wymagane właściwości
    const initialStops = data.stops || [];
    const validatedStops = initialStops.map((stop, index) => {
      // Zapewnij, że wszystkie wymagane właściwości są ustawione
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
        stopGroup: {
          id: stop.stopGroup?.id || stop.stop_group_id || "unknown",
          name: stop.stopGroup?.name || stop.stop_name || "Nieznany przystanek",
        },
        street: stop.street || "",
        map: stop.map || "",
      };
    });

    console.log("Zwalidowane przystanki:", validatedStops);
    setRoute(validatedStops);
  }, []);

  // Dodaj zabezpieczenia dla przypadków, gdy stopGroup lub name są undefined
  const getStopName = (stop) => {
    if (!stop) return "Brak danych";

    if (stop.stopGroup && stop.stopGroup.name) {
      return stop.stopGroup.name;
    }

    // Sprawdź alternatywne ścieżki do nazwy przystanku
    if (stop.name) return stop.name;
    if (stop.stop_name) return stop.stop_name;

    return "Nieznany przystanek";
  };

  const getStopStreet = (stop) => {
    if (!stop) return "";
    return stop.street || "";
  };

  // Paginacja
  const [currentPage, setCurrentPage] = useState(1);
  const [stopsPerPage] = useState(3); // Already set to 5 stops per page

  // Funkcja pomocnicza do aktualizacji trasy i powiadomienia rodzica
  const updateRouteAndParent = (newRoute) => {
    // Dodaj numerację przystanków (stop_number) - liczymy od 1
    const routeWithNumbers = newRoute.map((stop, index) => ({
      ...stop,
      stop_number: index + 1,
    }));

    setRoute(routeWithNumbers);

    // Aktualizuj dane rodzica
    if (updateData) {
      updateData({ stops: routeWithNumbers });
    }
  };

  // Efekt aktualizujący numery przystanków po każdej zmianie trasy
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

        // Aktualizuj dane rodzica tylko jeśli faktycznie były zmiany
        if (updateData) {
          updateData({ stops: updatedRoute });
        }
      }
    }
  }, [route]);

  // Filter stops based on search and reset pagination
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
          (stop.street && stop.street.toLowerCase().includes(search)) ||
          (stop.stopGroup &&
            stop.stopGroup.name &&
            stop.stopGroup.name.toLowerCase().includes(search))
      );
      setFilteredStops(filtered);
    }

    // Reset strony do pierwszej po każdym wyszukiwaniu
    setCurrentPage(1);
  }, [stops, stopSearch]);

  // Obliczenie bieżącej strony przystanków
  const indexOfLastStop = currentPage * stopsPerPage;
  const indexOfFirstStop = indexOfLastStop - stopsPerPage;
  const currentStops = filteredStops.slice(indexOfFirstStop, indexOfLastStop);

  // Obliczenie całkowitej liczby stron
  const totalPages = Math.ceil(filteredStops.length / stopsPerPage);

  // Update a stop in the route
  const updateRouteStop = (routeId, updates) => {
    const updatedRoute = route.map((stop) =>
      stop.routeId === routeId ? { ...stop, ...updates } : stop
    );
    updateRouteAndParent(updatedRoute);
  };

  // Add a stop to the route with a unique routeId
  const addStopToRoute = (stop) => {
    const newRouteId = lastRouteId + 1;
    setLastRouteId(newRouteId);

    const updatedRoute = [
      ...route,
      {
        ...stop,
        routeId: newRouteId, // Unique ID for this occurrence in the route
        stop_number: route.length + 1, // Numer przystanku (na końcu, więc length + 1)
        travel_time: 0,
        on_request: false,
        is_optional: false,
        is_first: route.length === 0, // First stop is "first" by default
        is_last: false,
      },
    ];

    updateRouteAndParent(updatedRoute);

    // Auto-expand the newly added stop
    setExpandedStops((prev) => ({
      ...prev,
      [newRouteId]: true, // Expanded by default
    }));
  };

  // Popraw funkcję getStopOccurrences
  const getStopOccurrences = (stopId) => {
    if (!stopId) return 0;
    return route.filter(
      (routeStop) =>
        routeStop.id === stopId ||
        routeStop.stopId === stopId ||
        routeStop.stop_id === stopId
    ).length;
  };

  // Validation function to check if the route is valid before proceeding
  const validateRoute = () => {
    // Check if there's at least one stop
    if (route.length === 0) {
      return {
        valid: false,
        error: `Trasa ${
          isReturnRoute ? "powrotna" : "podstawowa"
        } musi zawierać co najmniej jeden przystanek`,
      };
    }

    // Check if there's at least one non-optional first stop
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

    // Check if there's at least one non-optional last stop
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

  // Handle proceeding to next step
  const handleNext = () => {
    const validation = validateRoute();
    if (validation.valid) {
      if (onNext) onNext();
    } else {
      toast.error(validation.error, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Funkcja zmieniająca stronę
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Funkcja do przejścia do następnej strony
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Funkcja do przejścia do poprzedniej strony
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <>
      <ToastContainer />

      {isReturnRoute && (
        <div className={styles.routeHeader}>
          <h2>Trasa powrotna</h2>
          <p>
            Zdefiniuj trasę powrotną linii, dodając przystanki i określając ich
            właściwości.
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
              // Use the state to determine if this stop is expanded
              const isShown = expandedStops[stop.routeId] || false;
              // Count occurrences of this stop
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
                                  // Jeśli przystanek staje się nieopcjonalny i jest pierwszy/ostatni
                                  const updatedRoute = route.map(
                                    (routeStop) => {
                                      // Nie zmieniaj aktualnego przystanku jeszcze
                                      if (routeStop.routeId === stop.routeId)
                                        return routeStop;

                                      // Odznacz inne nieopcjonalne przystanki początkowe/końcowe
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
                                        if (stop.is_last && routeStop.is_last) {
                                          return {
                                            ...routeStop,
                                            is_last: false,
                                          };
                                        }
                                      }
                                      return routeStop;
                                    }
                                  );

                                  // Aktualizuj trasę z odznaczonymi przystankami
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
                                  // Po prostu zaktualizuj ten przystanek
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
                                  // If making this stop "first"
                                  if (!stop.is_optional) {
                                    // If it's non-optional, unmark all other non-optional first stops
                                    const updatedRoute = route.map(
                                      (routeStop) => {
                                        if (
                                          routeStop.routeId !== stop.routeId &&
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

                                  // Then mark this stop as first
                                  updateRouteStop(stop.routeId, {
                                    is_first: true,
                                    // Can't be both first and last unless optional
                                    is_last: stop.is_optional
                                      ? stop.is_last
                                      : false,
                                  });
                                } else {
                                  // Simply unmark as first
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
                                  // If making this stop "last"
                                  if (!stop.is_optional) {
                                    // If it's non-optional, unmark all other non-optional last stops
                                    const updatedRoute = route.map(
                                      (routeStop) => {
                                        if (
                                          routeStop.routeId !== stop.routeId &&
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

                                  // Then mark this stop as last
                                  updateRouteStop(stop.routeId, {
                                    is_last: true,
                                    // Can't be both first and last unless optional
                                    is_first: stop.is_optional
                                      ? stop.is_first
                                      : false,
                                  });
                                } else {
                                  // Simply unmark as last
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
                          stop.stop_name ||
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

      <Divider />
      <div className={styles.navigationButtons}>
        <div className={styles.leftButtons}>
          <Button onClick={onCancel} variant="secondary">
            Anuluj
          </Button>

          <Button onClick={onPrev} variant="secondary">
            ← Wstecz
          </Button>
        </div>

        <div className={styles.rightButtons}>
          <Button onClick={handleNext} disabled={route.length === 0}>
            Dalej →
          </Button>
        </div>
      </div>
    </>
  );
};

export default Route1Step;
