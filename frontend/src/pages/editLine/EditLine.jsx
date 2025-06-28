import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./EditLine.module.css";
import Card from "../../components/card/Card";
import Button from "../../components/button/Button";
import StepIndicator from "../../components/stepIndicator/StepIndicator";
import BasicInfoStep from "./BasicInfoStep";
import Route1Step from "./Route1Step";
import AdditionalInfo1Step from "./AdditionalInfo1Step";
import DeparturesStep from "./DeparturesStep";
import ReviewStep from "./ReviewStep";
import Loading from "../../components/ui/Loading";
import useLineData from "../../hooks/useLineData";

const EditLine = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAddMode = !id || id === "new";
  const [currentStep, setCurrentStep] = useState(1);

  const {
    lineData,
    updateLineData,
    isLoading,
    error,
    lineTypes,
    stopGroups,
    handleSubmit: submitLine,
  } = useLineData(id, isAddMode, navigate);

  const route1StepRef = useRef(null);
  const route2StepRef = useRef(null);

  const nextStep = () => {
    const isCircular = lineData._ui.routeType === "circular";

    if (currentStep === 2) {
      const validation = route1StepRef.current?.validateRoute();
      if (validation && !validation.valid) {
        toast.error(validation.error);
        return;
      }
    }

    if (currentStep === 3) {
      const validation = route2StepRef.current?.validateRoute();
      if (validation && !validation.valid) {
        toast.error(validation.error);
        return;
      }
    }

    if (currentStep === 2 && isCircular) {
      setCurrentStep(4);
    } else if (currentStep === 4 && isCircular) {
      setCurrentStep(6);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    const isCircular = lineData._ui.routeType === "circular";

    if (currentStep === 4 && isCircular) {
      setCurrentStep(2);
    } else if (currentStep === 6 && isCircular) {
      setCurrentStep(4);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    submitLine();
  };

  const getStepNames = () => {
    const isCircular = lineData._ui.routeType === "circular";

    const baseSteps = ["Podstawowe informacje", "Trasa pierwsza"];

    if (!isCircular) {
      baseSteps.push("Trasa powrotna");
    }

    baseSteps.push("Informacje dodatkowe");

    if (!isCircular) {
      baseSteps.push("Informacje dodatkowe (powrót)");
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
            ref={route1StepRef}
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
            ref={route2StepRef}
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
              updateLineData({
                _ui: {
                  additionalInfo1: { variants: additionalData.variants },
                },
              });
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
              const variants = additionalData.variants.map((variant) => ({
                ...variant,
                routeType: "return",
              }));

              updateLineData({
                _ui: {
                  additionalInfo2: { variants },
                },
              });
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

  const renderNavigationButtons = () => {
    const isFirstStep = currentStep === 1;
    const isLastStep =
      (lineData._ui.routeType === "circular" && currentStep === 7) ||
      (lineData._ui.routeType !== "circular" && currentStep === 8);

    return (
      <div className={styles.navigationButtons}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (isFirstStep) {
              if (
                window.confirm(
                  "Czy na pewno chcesz anulować? Wprowadzone zmiany zostaną utracone."
                )
              ) {
                navigate("/");
              }
            } else {
              prevStep();
            }
          }}
        >
          {isFirstStep ? "Anuluj" : "Wstecz"}
        </Button>

        {!isFirstStep && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (
                window.confirm(
                  "Czy na pewno chcesz anulować? Wprowadzone zmiany zostaną utracone."
                )
              ) {
                navigate("/");
              }
            }}
          >
            Anuluj
          </Button>
        )}

        {!isLastStep ? (
          <Button type="button" onClick={nextStep}>
            Dalej
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Zapisywanie..." : "Zapisz"}
          </Button>
        )}
      </div>
    );
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
      <ToastContainer />
      <StepIndicator
        steps={getStepNames()}
        currentStep={calculateVisualStep(currentStep)}
      />

      <Card width="100%" className={styles.card}>
        {renderStep()}
      </Card>
      {renderNavigationButtons()}
    </div>
  );
};

export default EditLine;
