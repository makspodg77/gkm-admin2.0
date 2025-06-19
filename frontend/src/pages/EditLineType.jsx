import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import styles from "./EditLineType.module.css";
import Card from "../components/card/Card";
import FormRow from "../components/formRow/FormRow";
import Input from "../components/input/Input";
import Button from "../components/button/Button";
import { LineTypeService } from "../services/lineTypeService";
import Loading from "../components/ui/Loading";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Divider from "../components/divider/Divider";

const validationSchema = Yup.object({
  nameSingular: Yup.string().required("Nazwa pojedyncza jest wymagana"),
  namePlural: Yup.string().required("Nazwa mnoga jest wymagana"),
  color: Yup.string()
    .required("Kolor jest wymagany")
    .matches(
      /^#([A-Fa-f0-9]{6})$/,
      "Kolor musi być w formacie HEX (np. #FF5733)"
    ),
});

const getContrastColor = (hexColor) => {
  if (!hexColor || hexColor.length < 7) return "#ffffff";

  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 128 ? "#000000" : "#ffffff";
};

const FormikInput = ({ label, name, ...props }) => {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <Field name={name}>
        {({ field }) => (
          <Input {...field} {...props} id={name} className={styles.input} />
        )}
      </Field>
      <ErrorMessage name={name} component="div" className={styles.error} />
    </div>
  );
};

const EditLineType = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAddMode = !id;

  const [initialValues, setInitialValues] = useState({
    nameSingular: "",
    namePlural: "",
    color: "#1E88E5",
  });

  useEffect(() => {
    if (!isAddMode) {
      LineTypeService.getOneLineType(id)
        .then((data) => {
          setInitialValues({
            nameSingular: data.name_singular || data.nameSingular || "",
            namePlural: data.name_plural || data.namePlural || "",
            color: data.color || "#1E88E5",
          });
        })
        .catch((error) => {
          console.error("Error fetching line type:", error);
          setError("Nie udało się pobrać danych typu linii");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [id, isAddMode]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (isAddMode) {
        await LineTypeService.createLineType(values);
        toast.success(`Utworzono nowy typ linii: ${values.nameSingular}`);
      } else {
        await LineTypeService.updateLineType(id, values);
        toast.success(`Zaktualizowano typ linii: ${values.nameSingular}`);
      }
      navigate("/");
    } catch (error) {
      console.error("Error saving line type:", error);
      toast.error("Nie udało się zapisać typu linii");
      setError("Nie udało się zapisać typu linii");
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
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>
        {isAddMode ? "Dodaj nowy typ linii" : "Edytuj typ linii"}
      </h1>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({ values, handleChange, isSubmitting, setFieldValue }) => (
          <Form className={styles.form}>
            <Card width="100%" className={styles.card}>
              <FormRow text="Podstawowe" fontSize="24px">
                <div className={styles.inputsContainer}>
                  <FormikInput
                    label="Nazwa w liczbie pojedynczej:"
                    name="nameSingular"
                    placeholder="np. Linia autobusowa dzienna"
                  />

                  <FormikInput
                    label="Nazwa w liczbie mnogiej:"
                    name="namePlural"
                    placeholder="np. Linie autobusowe dzienne"
                  />
                </div>
              </FormRow>

              <Divider />

              <FormRow text="Wygląd" fontSize="24px">
                <div className={styles.colorSection}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Kolor identyfikujący typ linii:
                    </label>
                    <div className={styles.colorInputGroup}>
                      <Field
                        as={Input}
                        id="color"
                        name="color"
                        value={values.color}
                        onChange={handleChange}
                        placeholder="#000000"
                        className={styles.colorInput}
                      />
                      <input
                        type="color"
                        value={values.color}
                        onChange={(e) => setFieldValue("color", e.target.value)}
                        className={styles.colorPicker}
                        aria-label="Wybierz kolor"
                      />
                    </div>
                    <ErrorMessage
                      name="color"
                      component="div"
                      className={styles.error}
                    />
                  </div>

                  <div className={styles.previewSection}>
                    <h4 className={styles.previewTitle}>Podgląd:</h4>

                    <div
                      className={styles.colorPreviewBox}
                      style={{ backgroundColor: values.color }}
                    >
                      <span
                        className={styles.previewText}
                        style={{ color: getContrastColor(values.color) }}
                      >
                        {values.nameSingular || "Przykładowa linia"}
                      </span>
                    </div>

                    <div className={styles.lineExamples}>
                      {["10", "125", "N1"].map((lineNumber, index) => (
                        <div
                          key={index}
                          className={styles.lineExample}
                          style={{
                            backgroundColor: values.color,
                            color: getContrastColor(values.color),
                          }}
                        >
                          {lineNumber}
                        </div>
                      ))}
                    </div>

                    <div className={styles.colorValue}>
                      Kolor: <code>{values.color}</code>
                    </div>
                  </div>
                </div>
              </FormRow>
            </Card>

            <div className={styles.buttonContainer}>
              <Button
                type="button"
                onClick={() => navigate("/")}
                variant="secondary"
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditLineType;
