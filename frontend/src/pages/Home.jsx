import Button from "../components/button/Button";
import Card from "../components/card/Card";
import styles from "./Home.module.css";
import stopIcon from "../assets/stop.svg";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { StopGroupService } from "../services/stopGroupService";
import { LineTypeService } from "../services/lineTypeService";
import Loading from "../components/ui/Loading";
import { LineService } from "../services/lineService";
import { FaMapMarkerAlt, FaBus, FaTags } from "react-icons/fa";
import Pagination from "../components/pagination/Pagination";
import SectionHeader from "../components/sectionHeader/SectionHeader";
import SearchBar from "../components/searchBar/SearchBar";
import EmptyState from "../components/emptyState/EmptyState";
import FilterButtons from "../components/filterButton/FilterButton";

const Home = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [stops, setStops] = useState([]);
  const [lines, setLines] = useState([]);
  const [lineTypes, setLineTypes] = useState([]);

  const [filteredStops, setFilteredStops] = useState([]);
  const [filteredLines, setFilteredLines] = useState([]);
  const [filteredLineTypes, setFilteredLineTypes] = useState([]);

  const [stopSearch, setStopSearch] = useState("");
  const [lineSearch, setLineSearch] = useState("");
  const [lineTypeSearch, setLineTypeSearch] = useState("");
  const [lineFilter, setLineFilter] = useState("all");

  const [stopPage, setStopPage] = useState(1);
  const [linePage, setLinePage] = useState(1);
  const itemsPerPage = 12;
  const linesPerPage = 18;

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const stopsData = await StopGroupService.getAllStopGroups();
      const lineTypesData = await LineTypeService.getAllLineTypes();
      const linesData = await LineService.getAllLines();

      setStops(stopsData);
      setLineTypes(lineTypesData);
      setLines(linesData.sort((a, b) => Number(a.name) - Number(b.name)));

      setStopPage(1);
      setLinePage(1);
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (!stopSearch.trim()) {
      setFilteredStops(stops);
    } else {
      const term = stopSearch.toLowerCase();
      setFilteredStops(
        stops.filter((stop) => stop.name.toLowerCase().includes(term))
      );
    }
    setStopPage(1);
  }, [stops, stopSearch]);

  useEffect(() => {
    let filtered = [...lines];

    if (lineFilter === "night") {
      filtered = filtered.filter((line) => line.is_night);
    } else if (lineFilter === "day") {
      filtered = filtered.filter((line) => !line.is_night);
    }

    if (lineSearch && lineSearch.trim()) {
      const term = lineSearch.toLowerCase();
      filtered = filtered.filter((line) =>
        line.name.toLowerCase().includes(term)
      );
    }

    setFilteredLines(filtered);
    setLinePage(1);
  }, [lines, lineSearch, lineFilter]);

  useEffect(() => {
    if (!lineTypeSearch.trim()) {
      setFilteredLineTypes(lineTypes);
    } else {
      const term = lineTypeSearch.toLowerCase();
      setFilteredLineTypes(
        lineTypes.filter(
          (type) =>
            type.name_plural.toLowerCase().includes(term) ||
            (type.name && type.name.toLowerCase().includes(term))
        )
      );
    }
  }, [lineTypes, lineTypeSearch]);

  const navigateToStopEdit = (id) => {
    navigate(`/stop/${id}`);
  };

  const navigateToLineEdit = (id) => {
    navigate(`/line/${id}`);
  };

  const navigateToLineTypeEdit = (id) => {
    navigate(`/line-type/${id}`);
  };

  const totalStopPages = Math.ceil(filteredStops.length / itemsPerPage);
  const totalLinePages = Math.ceil(filteredLines.length / linesPerPage);

  const currentStops = filteredStops.slice(
    (stopPage - 1) * itemsPerPage,
    stopPage * itemsPerPage
  );

  const currentLines = filteredLines.slice(
    (linePage - 1) * linesPerPage,
    linePage * linesPerPage
  );

  if (isLoading && stops.length === 0) return <Loading />;

  return (
    <div className={styles.homeContainer}>
      <h1 className={styles.dashboardTitle}>Panel zarządzania</h1>

      <div className={styles.home}>
        <Card className={styles.card}>
          <SectionHeader
            title="Przystanki"
            icon={FaMapMarkerAlt}
            count={stops.length}
            onRefresh={refreshData}
            isLoading={isLoading}
          />
          <SearchBar
            placeholder="Wyszukaj przystanek..."
            value={stopSearch}
            onChange={setStopSearch}
            onClear={() => setStopSearch("")}
            addButtonLink="/stop/new"
            addButtonTitle="Dodaj nowy przystanek"
          />
          {filteredStops.length > 0 ? (
            <>
              <div className={styles.itemsGrid}>
                {currentStops.map((item) => (
                  <Button
                    key={item.id}
                    variant="secondary"
                    className={styles.itemButton}
                    onClick={() => navigateToStopEdit(item.id)}
                    align="left"
                  >
                    <div className={styles.itemContent}>
                      <img
                        src={stopIcon}
                        alt="Przystanek"
                        className={styles.itemIcon}
                      />
                      <span className={styles.itemName}>{item.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
              {totalStopPages > 1 && (
                <div className={styles.paginationContainer}>
                  <Pagination
                    currentPage={stopPage}
                    totalPages={totalStopPages}
                    onPageChange={setStopPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyStateContainer}>
              <EmptyState
                icon={FaMapMarkerAlt}
                message="Brak przystanków spełniających kryteria wyszukiwania"
                buttonText={stopSearch ? "Wyczyść wyszukiwanie" : null}
                onClick={stopSearch ? () => setStopSearch("") : null}
              />
            </div>
          )}
        </Card>
        <Card className={styles.card}>
          <SectionHeader
            title="Linie"
            icon={FaBus}
            count={lines.length}
            onRefresh={refreshData}
            isLoading={isLoading}
          />
          <SearchBar
            placeholder="Wyszukaj linię..."
            value={lineSearch}
            onChange={setLineSearch}
            onClear={() => setLineSearch("")}
            addButtonLink="/line/new"
            addButtonTitle="Dodaj nową linię"
          />
          <FilterButtons
            filters={[
              { value: "all", label: "Wszystkie" },
              { value: "day", label: "Dzienne" },
              { value: "night", label: "Nocne" },
            ]}
            activeFilter={lineFilter}
            onChange={setLineFilter}
          />

          {filteredLines.length > 0 ? (
            <>
              <div className={styles.linesGrid}>
                {currentLines.map((item) => (
                  <div key={item.id} className={styles.lineButtonContainer}>
                    <Button
                      variant="custom"
                      color={item.color || "#3498db"}
                      className={styles.lineButton}
                      onClick={() => navigateToLineEdit(item.id)}
                      align="center"
                      centered={true}
                    >
                      <div className={styles.lineBadge}>{item.name}</div>
                    </Button>
                  </div>
                ))}
              </div>
              {totalLinePages > 1 && (
                <div className={styles.paginationContainer}>
                  <Pagination
                    currentPage={linePage}
                    totalPages={totalLinePages}
                    onPageChange={setLinePage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyStateContainer}>
              <EmptyState
                icon={FaBus}
                message="Brak linii spełniających kryteria wyszukiwania"
                buttonText={
                  lineFilter !== "all" || lineSearch ? "Wyczyść filtry" : null
                }
                onClick={
                  lineFilter !== "all" || lineSearch
                    ? () => {
                        setLineFilter("all");
                        setLineSearch("");
                      }
                    : null
                }
              />
            </div>
          )}
        </Card>
        <Card className={styles.card}>
          <SectionHeader
            title="Typy linii"
            icon={FaTags}
            count={lineTypes.length}
            onRefresh={refreshData}
            isLoading={isLoading}
          />
          <SearchBar
            placeholder="Wyszukaj typ linii..."
            value={lineTypeSearch}
            onChange={setLineTypeSearch}
            onClear={() => setLineTypeSearch("")}
            addButtonLink="/line-type/new"
            addButtonTitle="Dodaj nowy typ linii"
          />

          {filteredLineTypes.length > 0 ? (
            <div className={styles.itemsGrid}>
              {filteredLineTypes.map((item) => (
                <Button
                  key={item.id}
                  variant="custom"
                  color={item.color || "#3498db"}
                  className={styles.itemButton}
                  onClick={() => navigateToLineTypeEdit(item.id)}
                  align="left"
                >
                  <div className={styles.itemContent}>
                    <span
                      className={styles.lineTypeBadge}
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className={styles.itemName}>{item.name_plural}</span>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FaMapMarkerAlt}
              message="Brak typów linii spełniających kryteria wyszukiwania"
              buttonText={lineTypeSearch ? "Wyczyść wyszukiwanie" : null}
              onClick={lineTypeSearch ? () => setLineTypeSearch("") : null}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Home;
