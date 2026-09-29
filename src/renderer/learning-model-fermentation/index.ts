// Fermentation-type learning-model specification and slider conversion.
import "@rchunk/rolldown-runtime";

type FermentationType = "alcohol" | "lactic acid";
interface FermentationValues { fermentation_type?: unknown }

const fermentationType = "FERMENTATION";
const fermentationThumbnailAssetKey = "fermentation-v1";
const fermentationParameters = {
  fermentation_type: {
    kind: "enum" as const,
    defaultValue: "lactic acid" as FermentationType,
    allowedValues: ["lactic acid", "alcohol"] as FermentationType[],
  },
};
const fermentationSpecification = {
  type: fermentationType,
  version: 2,
  thumbnailAssetKey: fermentationThumbnailAssetKey,
  parameters: fermentationParameters,
};
const fermentationParameter = fermentationSpecification.parameters.fermentation_type;
const fermentationControl: {
  defaultValue: FermentationType;
  max: number;
  min: number;
  step: number;
} = {
  min: 0,
  max: fermentationParameter.allowedValues.length - 1,
  step: 1,
  defaultValue: fermentationParameter.defaultValue === "alcohol" ? "alcohol" : "lactic acid",
};

function normalizeFermentationValues(values: FermentationValues): { fermentation_type: FermentationType } {
  return {
    fermentation_type: values.fermentation_type === "alcohol" || values.fermentation_type === "lactic acid"
      ? values.fermentation_type
      : fermentationControl.defaultValue,
  };
}

const fermentationTypeToIndex = (value: FermentationType): number => +(value === "alcohol");
const indexToFermentationType = (value: number): FermentationType => value >= 0.5 ? "alcohol" : "lactic acid";
function initializeFermentationSpecification(): void {}
function initializeFermentationModel(): void {}

export {
  normalizeFermentationValues as a,
  initializeFermentationModel as i,
  indexToFermentationType as n,
  initializeFermentationSpecification as o,
  fermentationTypeToIndex as r,
  fermentationSpecification as s,
  fermentationControl as t,
};
