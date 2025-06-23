import { useNavigate, useParams } from "react-router-dom";
import styles from "./EditStop.module.css";
import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Card from "../components/card/Card";
import FormRow from "../components/formRow/FormRow";
import Input from "../components/input/Input";
import Divider from "../components/divider/Divider";
import Button from "../components/button/Button";
import deleteIcon from "../assets/delete.svg";
import editIcon from "../assets/plus.svg";
import stopIcon from "../assets/stop.svg";
import { StopGroupService } from "../services/stopGroupService";
import Loading from "../components/ui/Loading";
import StopMap from "../components/stopMap/StopMap";

const swapAndFormatCoordinates = (coordString) => {
  if (!coordString || typeof coordString !== "string") return "";

  try {
    const parts = coordString.split(",").map((part) => parseFloat(part.trim()));
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
      return coordString;
    }

    const [first, second] = parts;

    if (first >= 49 && first <= 55) {
      return `${second}, ${first}`;
    } else if (first >= 14 && first <= 24) {
      return `${first}, ${second}`;
    } else {
      if (Math.abs(first) <= 90 && (first < 14 || first > 24)) {
        return `${second}, ${first}`;
      } else {
        return `${first}, ${second}`;
      }
    }
  } catch (e) {
    console.error("Error handling coordinates:", e);
    return coordString;
  }
};

const isValidCoordinates = (coords) => {
  if (!coords) return false;

  const pattern = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
  if (!pattern.test(coords)) return false;

  const [first, second] = coords.split(",").map((c) => parseFloat(c.trim()));
  if (isNaN(first) || isNaN(second)) return false;

  const isLatLngFormat =
    first >= 49 && first <= 55 && second >= 14 && second <= 24;

  const isLngLatFormat =
    first >= 14 && first <= 24 && second >= 49 && second <= 55;

  const isValidRange =
    (Math.abs(first) <= 90 && Math.abs(second) <= 180) ||
    (Math.abs(first) <= 180 && Math.abs(second) <= 90);

  return isLatLngFormat || isLngLatFormat || isValidRange;
};

const validationSchema = Yup.object({
  name: Yup.string().required("Nazwa jest wymagana"),
  stops: Yup.array().of(
    Yup.object({
      coordinates: Yup.string().required("Współrzędne są wymagane"),
      street: Yup.string().required("Ulica jest wymagana"),
    })
  ),
});

const EditStop = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAddMode = !id || id === "new";
  const [editingStopIndex, setEditingStopIndex] = useState(-1);

  const [initialValues, setInitialValues] = useState({
    name: "",
    stops: [],
    newStop: {
      coordinates: "",
      street: "",
    },
  });
  const [isLoading, setIsLoading] = useState(!isAddMode);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAddMode) {
      setIsLoading(true);
      StopGroupService.getOneStopGroup(id)
        .then((data) => {
          setInitialValues({
            name: data.name,
            stops: data.stops.map((stop) => {
              let coords = stop.map;

              const coordParts = coords
                .split(",")
                .map((c) => parseFloat(c.trim()));
              if (coordParts.length === 2) {
                if (Math.abs(coordParts[0]) > 90) {
                  coords = swapAndFormatCoordinates(coords);
                }
              }

              return {
                id: stop.id,
                coordinates: coords,
                street: stop.street,
              };
            }),
            newStop: {
              coordinates: "",
              street: "",
            },
          });
        })
        .catch((error) => {
          console.error("Error fetching stop group:", error);
          setError("Nie udało się załadować danych przystanku");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, isAddMode]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        name: values.name,
        stops: values.stops.map((stop) => {
          const formattedCoords = swapAndFormatCoordinates(stop.coordinates);

          const [lng, lat] = formattedCoords
            .split(",")
            .map((c) => parseFloat(c.trim()));

          return {
            map: formattedCoords,
            street: stop.street,
            lat: lat,
            lng: lng,
            ...(stop.id && { id: stop.id }),
          };
        }),
      };

      if (isAddMode) {
        await StopGroupService.createStopGroup(payload);
      } else {
        await StopGroupService.updateStopGroup(id, payload);
      }

      navigate("/");
    } catch (error) {
      console.error("Error saving stop group:", error);
      setError("Nie udało się zapisać przystanku");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize={true}
    >
      {({ values, setValues, setFieldValue, handleChange, isSubmitting }) => {
        const addStop = () => {
          if (values.newStop.coordinates && values.newStop.street) {
            const swappedCoords = swapAndFormatCoordinates(
              values.newStop.coordinates
            );

            if (editingStopIndex >= 0) {
              const updatedStops = [...values.stops];
              updatedStops[editingStopIndex] = {
                ...updatedStops[editingStopIndex],
                street: values.newStop.street,
                coordinates: swappedCoords,
              };

              setValues({
                ...values,
                stops: updatedStops,
                newStop: { coordinates: "", street: "" },
              });
              setEditingStopIndex(-1);
            } else {
              setValues({
                ...values,
                stops: [
                  ...values.stops,
                  {
                    street: values.newStop.street,
                    coordinates: swappedCoords,
                  },
                ],
                newStop: { coordinates: "", street: "" },
              });
            }
          }
        };

        const editStop = (index) => {
          setEditingStopIndex(index);
          setValues({
            ...values,
            newStop: {
              coordinates: values.stops[index].coordinates,
              street: values.stops[index].street,
            },
          });
        };

        const removeStop = (index) => {
          const updatedStops = [...values.stops];
          updatedStops.splice(index, 1);

          if (editingStopIndex === index) {
            setEditingStopIndex(-1);
            setValues({
              ...values,
              stops: updatedStops,
              newStop: { coordinates: "", street: "" },
            });
          } else {
            setValues({
              ...values,
              stops: updatedStops,
            });
          }
        };

        const cancelEditing = () => {
          setEditingStopIndex(-1);
          setValues({
            ...values,
            newStop: { coordinates: "", street: "" },
          });
        };

        return (
          <Form>
            <h2 className={styles.pageTitle}>
              {isAddMode ? "Dodaj nowy przystanek" : "Edytuj przystanek"}
            </h2>
            <Card width={"100%"} className={styles.card}>
              <FormRow text={"Podstawowe"}>
                <label htmlFor="name">Nazwa zespołu przystankowego:</label>
                <Field
                  as={Input}
                  id="name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  placeholder="np. Dworzec Główny"
                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className={styles.error}
                />
              </FormRow>
              <Divider />
              <div className={styles.twoColumnLayout}>
                <div className={styles.stopsEditorColumn}>
                  <h3>Dodawanie przystanków</h3>
                  <div className={styles.stopForm}>
                    <FormRow text={"mapa/współrzędne:"} fontSize={"20px"}>
                      <div className={styles.inputWithHelp}>
                        <Input
                          name="newStop.coordinates"
                          value={values.newStop.coordinates}
                          onChange={(e) => {
                            setFieldValue(
                              "newStop.coordinates",
                              e.target.value
                            );
                          }}
                          placeholder="np. 54.3520, 18.6466"
                          className={
                            !isValidCoordinates(values.newStop.coordinates) &&
                            values.newStop.coordinates
                              ? styles.inputError
                              : ""
                          }
                        />
                        {values.newStop.coordinates &&
                          !isValidCoordinates(values.newStop.coordinates) && (
                            <div className={styles.inputErrorMessage}>
                              Niepoprawny format. Wprowadź współrzędne jako
                              "latitude,longitude" np. 54.3520, 18.6466
                            </div>
                          )}
                        <div className={styles.inputHelp}>
                          <span className={styles.helpIcon}>?</span>
                          <div className={styles.helpTooltip}>
                            Wprowadź współrzędne geograficzne w formacie
                            "szerokość,długość" np. 54.3520, 18.6466
                          </div>
                        </div>
                      </div>
                    </FormRow>
                    <FormRow text={"ulica:"} fontSize={"20px"}>
                      <Input
                        name="newStop.street"
                        value={values.newStop.street}
                        onChange={(e) => {
                          setFieldValue("newStop.street", e.target.value);
                        }}
                      />
                    </FormRow>
                    <div className={styles.mapPreview}>
                      <h4>Podgląd lokalizacji:</h4>
                      {values.newStop.coordinates &&
                      isValidCoordinates(values.newStop.coordinates) ? (
                        <StopMap
                          coordinates={swapAndFormatCoordinates(
                            values.newStop.coordinates
                          )}
                          stopName={values.newStop.street || "Nowy przystanek"}
                          height="200px"
                          zoom={15}
                          key={`preview-${values.newStop.coordinates}`}
                        />
                      ) : (
                        <div className={styles.emptyMap}>
                          {values.newStop.coordinates
                            ? "Nieprawidłowe współrzędne. Wprowadź w formacie: 54.3520, 18.6466"
                            : "Wprowadź współrzędne, aby zobaczyć podgląd na mapie"}
                        </div>
                      )}
                    </div>
                    <div className={styles.stopFormButtons}>
                      {editingStopIndex >= 0 ? (
                        <div className={`${styles.buttonContainer}`}>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={cancelEditing}
                            height="40px"
                          >
                            Anuluj
                          </Button>
                          <Button
                            type="button"
                            onClick={addStop}
                            disabled={
                              !values.newStop.coordinates ||
                              !values.newStop.street
                            }
                          >
                            Aktualizuj przystanek
                          </Button>
                        </div>
                      ) : (
                        <div className={`${styles.buttonContainer}`}>
                          <Button
                            type="button"
                            onClick={addStop}
                            disabled={
                              !values.newStop.coordinates ||
                              !values.newStop.street
                            }
                          >
                            Dodaj przystanek
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.stopsListColumn}>
                  <h3>Lista przystanków ({values.stops.length})</h3>
                  <div className={styles.stopsContainer}>
                    {values.stops.length > 0 ? (
                      values.stops.map((stop, index) => (
                        <div
                          key={`stop-${index}-${stop.id || index}`}
                          className={`${styles.stopItem} ${
                            editingStopIndex === index ? styles.edited : ""
                          }`}
                        >
                          <div
                            className={styles.stopInfo}
                            onClick={() => editStop(index)}
                          >
                            <div className={styles.stopIcon}>
                              <img src={stopIcon} alt="stop icon" />
                              <span className={styles.stopIndex}>
                                {index + 1}
                              </span>
                            </div>

                            <div className={styles.stopDetails}>
                              <div className={styles.stopStreet}>
                                {stop.street || "Bez nazwy"}
                              </div>
                              <div className={styles.stopCoordinates}>
                                {stop.coordinates}
                              </div>
                            </div>
                            <div className={styles.stopMapPreview}>
                              {stop.coordinates && (
                                <StopMap
                                  coordinates={stop.coordinates}
                                  stopName={
                                    stop.street || `Przystanek ${index + 1}`
                                  }
                                  height="100px"
                                  zoom={14}
                                  key={`map-${index}-${stop.coordinates}`}
                                />
                              )}
                            </div>
                          </div>

                          <div className={styles.stopActions}>
                            <button
                              type="button"
                              className={styles.editButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                editStop(index);
                              }}
                              title="Edytuj"
                            >
                              <img src={editIcon} alt="edit" />
                            </button>

                            <button
                              type="button"
                              className={styles.deleteButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  window.confirm(
                                    "Czy na pewno chcesz usunąć ten przystanek?"
                                  )
                                ) {
                                  removeStop(index);
                                }
                              }}
                              title="Usuń"
                            >
                              <img src={deleteIcon} alt="delete" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={styles.emptyMessage}>
                        Nie dodano jeszcze żadnych przystanków.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <div className={`${styles.buttonContainer}`}>
              <Button
                type="button"
                onClick={() => navigate("/")}
                variant="secondary"
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || values.stops.length === 0}
                title={
                  values.stops.length === 0
                    ? "Dodaj przynajmniej jeden przystanek"
                    : ""
                }
              >
                {isSubmitting ? (
                  <>
                    <span className={styles.loadingSpinner}></span>
                    Zapisywanie...
                  </>
                ) : (
                  "Zapisz"
                )}
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default EditStop;
