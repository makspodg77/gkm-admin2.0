import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import styles from "./StopMap.module.css";

// Globalny licznik aktywnych map
let activeMapCount = 0;
const MAX_ACTIVE_MAPS = 5; // Maksymalna liczba jednocześnie aktywnych map

// Funkcja pomocnicza do parsowania koordynatów
const parseCoordinates = (coords) => {
  // Jeśli coords to już poprawny obiekt, zwróć go
  if (
    coords &&
    typeof coords === "object" &&
    typeof coords.lat === "number" &&
    typeof coords.lng === "number"
  ) {
    return coords;
  }

  // Jeśli coords to string, spróbuj sparsować
  if (typeof coords === "string") {
    try {
      // Usuń białe znaki i rozdziel po przecinku
      const parts = coords.trim().split(",");

      if (parts.length === 2) {
        const lng = parseFloat(parts[0].trim());
        const lat = parseFloat(parts[1].trim());

        if (!isNaN(lng) && !isNaN(lat)) {
          return { lng, lat };
        }
      }
    } catch (error) {
      console.error("Błąd parsowania koordynatów:", error);
    }
  }

  // Jeśli parsowanie się nie powiodło, zwróć null
  return null;
};

const StopMap = ({
  coordinates,
  stopName,
  height = "200px",
  zoom = 14,
  showControls = false,
  lazyLoad = true,
}) => {
  // Parsuj koordynaty, jeśli są stringiem
  const parsedCoordinates = parseCoordinates(coordinates);

  // Sprawdź, czy parsedCoordinates jest poprawne
  const hasValidCoordinates = parsedCoordinates !== null;

  // Jeśli współrzędne są niepoprawne, wyświetl informację
  if (!hasValidCoordinates) {
    return (
      <div
        className={styles.mapWrapper}
        style={{
          height,
          backgroundColor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          fontSize: "12px",
          textAlign: "center",
        }}
      >
        {stopName || "Przystanek"}
        <br />
        (Brak poprawnych współrzędnych)
      </div>
    );
  }

  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [destroyed, setDestroyed] = useState(false);

  // Poprawiony efekt sprawdzający widoczność mapy
  useEffect(() => {
    if (!lazyLoad) return; // Pomijamy jeśli nie używamy leniowego ładowania

    const observer = new IntersectionObserver(
      (entries) => {
        // Sprawdź, czy entries istnieje i ma elementy
        if (entries && entries.length > 0) {
          const entry = entries[0];
          // Jeśli komponent jest widoczny, inicjalizujemy mapę
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        }
      },
      {
        rootMargin: "100px", // Załaduj mapę gdy jest 100px od viewporta
        threshold: 0.1,
      }
    );

    // Sprawdź, czy kontener mapy istnieje przed obserwacją
    if (mapContainer.current) {
      observer.observe(mapContainer.current);
    }

    return () => {
      // Sprawdź, czy observer istnieje przed odłączeniem
      if (observer) {
        observer.disconnect();
      }
    };
  }, [lazyLoad]);

  // Poprawiony efekt inicjalizujący mapę
  useEffect(() => {
    // Jeśli mapa nie jest widoczna lub już została zniszczona, nie inicjalizuj jej
    if (!isVisible || destroyed || !parsedCoordinates) return;

    // Sprawdź, czy kontener mapy istnieje
    if (!mapContainer.current) {
      console.warn("Kontener mapy nie istnieje");
      return;
    }

    // Sprawdź, czy mamy za dużo aktywnych map
    if (activeMapCount >= MAX_ACTIVE_MAPS) {
      console.log(
        "Osiągnięto maksymalną liczbę aktywnych map. Mapa nie zostanie zainicjalizowana."
      );
      setDestroyed(true);
      return;
    }

    // Inicjalizuj mapę
    try {
      if (map.current) return; // Mapa już istnieje

      activeMapCount++;
      console.log("Inicjalizacja nowej mapy. Aktywne mapy:", activeMapCount);

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://tiles.stadiamaps.com/styles/osm_bright.json",
        center: [parsedCoordinates.lng, parsedCoordinates.lat],
        zoom: zoom,
        attributionControl: false,
        scrollZoom: false,
        dragPan: showControls,
        dragRotate: false,
        doubleClickZoom: false,
        touchZoomRotate: showControls,
      });

      // Dodaj marker
      if (map.current) {
        marker.current = new maplibregl.Marker({ color: "#3887be" })
          .setLngLat([parsedCoordinates.lng, parsedCoordinates.lat])
          .addTo(map.current);
      }

      // Dodaj kontrolki jeśli wymagane
      if (showControls && map.current) {
        map.current.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          "top-right"
        );
      }
    } catch (error) {
      console.error("Błąd podczas inicjalizacji mapy:", error);
      setDestroyed(true);
      activeMapCount--; // Zmniejsz licznik jeśli wystąpił błąd
    }

    // Czyszczenie przy odmontowaniu
    return () => {
      if (map.current) {
        try {
          map.current.remove();
        } catch (error) {
          console.error("Błąd podczas usuwania mapy:", error);
        }
        map.current = null;
        activeMapCount--;
        console.log("Usunięto mapę. Aktywne mapy:", activeMapCount);
      }
    };
  }, [parsedCoordinates, zoom, showControls, isVisible, destroyed]);

  const mapPlaceholderStyle = {
    height: height,
    backgroundColor: destroyed ? "#f5f5f5" : "#e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
    fontSize: "12px",
    textAlign: "center",
  };

  return (
    <div className={styles.mapWrapper} style={{ height }}>
      {destroyed ? (
        <div style={mapPlaceholderStyle}>
          {stopName || "Przystanek"}
          <br />
          (Mapa niedostępna)
        </div>
      ) : (
        <div ref={mapContainer} className={styles.map} style={{ height }} />
      )}
    </div>
  );
};

export default React.memo(StopMap);
