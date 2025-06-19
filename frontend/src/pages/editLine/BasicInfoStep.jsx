import React, { useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import FormRow from "../../components/formRow/FormRow";
import Input from "../../components/input/Input";
import Button from "../../components/button/Button";
import styles from "./BasicInfoStep.module.css";
import Divider from "../../components/divider/Divider";

const validationSchema = Yup.object({
  name: Yup.string().required("Numer linii jest wymagany"),
  lineTypeId: Yup.string().required("Typ linii jest wymagany"),
});

// Formatuj nazwę linii (dodaj prefix N dla nocnych)
const formatLineName = (name, isNight) => {
  if (!name) return "";
  return isNight ? `N${name}` : name;
};

// Funkcja bezpiecznie pobierająca kolor typu linii
const getLineTypeColor = (lineTypeId, lineTypes) => {
  if (!lineTypeId || !lineTypes || !lineTypes.length) return "#ccc";

  const lineType = lineTypes.find((t) => String(t.id) === String(lineTypeId));
  if (!lineType) return "#ccc";

  // Sprawdź czy kolor istnieje
  return lineType.color || "#ccc";
};

const BasicInfoStep = ({
  data,
  lineTypes,
  updateData,
  onNext,
  isEditMode = false,
  hasReturnRoute = false,
  hasAdditionalInfo2 = false,
}) => {
  const handleSubmit = (values) => {
    updateData(values);
    onNext();
  };

  // Check if circular checkbox should be disabled
  const isCircularDisabled =
    isEditMode && (hasReturnRoute || hasAdditionalInfo2);

  // Tooltip message for disabled checkbox
  const disabledTooltip = isCircularDisabled
    ? "Nie można zmienić typu linii, ponieważ trasa powrotna lub dodatkowe informacje 2 już istnieją"
    : "";

  return (
    <Formik
      initialValues={{
        name: data.name,
        lineTypeId: data.lineTypeId,
        isCircular: data.isCircular,
        isNight: data.isNight,
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, setFieldValue }) => {
        return (
          <Form className={styles.form}>
            <FormRow text="Podstawowe">
              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>Numer linii:</label>
                <Field name="name">
                  {({ field }) => (
                    <Input
                      {...field}
                      placeholder="np. 96"
                      className={styles.numberInput}
                    />
                  )}
                </Field>
                {values.name && (
                  <div className={styles.linePreview}>
                    <span>Podgląd numeru linii:</span>
                    <div className={styles.lineNumberContainer}>
                      <div
                        className={styles.lineNumberRectangle}
                        style={{
                          backgroundColor: getLineTypeColor(
                            values.lineTypeId,
                            lineTypes
                          ),
                        }}
                      >
                        <span className={styles.lineNumberText}>
                          {formatLineName(values.name, values.isNight)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <ErrorMessage
                  name="name"
                  component="div"
                  className={styles.error}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>Typ linii:</label>
                <div className={styles.lineTypeSelectContainer}>
                  <Field
                    as="select"
                    name="lineTypeId"
                    className={styles.select}
                  >
                    <option value="">Wybierz typ linii</option>
                    {lineTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.nameSingular || type.name_singular}
                      </option>
                    ))}
                  </Field>
                  {values.lineTypeId && (
                    <div
                      className={styles.lineTypeColorPreview}
                      style={{
                        backgroundColor: getLineTypeColor(
                          values.lineTypeId,
                          lineTypes
                        ),
                      }}
                    />
                  )}
                </div>
                <ErrorMessage
                  name="lineTypeId"
                  component="div"
                  className={styles.error}
                />
              </div>
            </FormRow>
            <Divider />
            <FormRow text="Zaawansowane">
              <div className={styles.checkboxGroup}>
                <div
                  className={`${styles.checkboxContainer} ${
                    isCircularDisabled ? styles.disabled : ""
                  }`}
                  title={disabledTooltip}
                >
                  <Input
                    type="checkbox"
                    name="isCircular"
                    id="isCircular"
                    checked={values.isCircular}
                    onChange={(e) => {
                      setFieldValue("isCircular", e.target.checked);
                    }}
                    disabled={isCircularDisabled}
                    label={
                      <div className={styles.checkboxLabelGroup}>
                        <span
                          className={`${
                            isCircularDisabled ? styles.disabledLabel : ""
                          }`}
                        >
                          Linia okrężna
                        </span>
                        <span className={styles.checkboxDescription}>
                          Linia nie posiada trasy powrotnej, autobusy kursują w
                          kółko
                        </span>
                      </div>
                    }
                  />

                  {isCircularDisabled && (
                    <span className={styles.infoIcon} title={disabledTooltip}>
                      ⓘ
                    </span>
                  )}
                </div>

                <div className={styles.checkboxContainer}>
                  <Input
                    type="checkbox"
                    name="isNight"
                    id="isNight"
                    checked={values.isNight}
                    onChange={(e) => {
                      setFieldValue("isNight", e.target.checked);
                    }}
                    label={
                      <div className={styles.checkboxLabelGroup}>
                        <span>Linia nocna</span>
                        <span className={styles.checkboxDescription}>
                          Linia kursująca w godzinach nocnych
                        </span>
                      </div>
                    }
                  />
                </div>
              </div>
            </FormRow>

            <div className={styles.buttonContainer}>
              <Button
                type="button"
                onClick={() => window.history.back()}
                variant="secondary"
              >
                Anuluj
              </Button>
              <Button type="submit">Dalej</Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default BasicInfoStep;
