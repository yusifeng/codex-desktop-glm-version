// Alcohol-oxidation product learning model for two reagent conditions.
import "@rchunk/rolldown-runtime";

type OxidationCondition = "dess_martin" | "jones_reagent";
interface OxidationValues { oxidationConditions?: unknown }

const alcoholOxidationType = "ALCOHOL_OXIDATION_PRODUCTS";
const alcoholOxidationThumbnailAssetKey = "alcohol-oxidation-products-v1";
const alcoholOxidationParameters = {
  oxidationConditions: {
    kind: "enum" as const,
    defaultValue: "dess_martin" as OxidationCondition,
    allowedValues: ["dess_martin", "jones_reagent"] as OxidationCondition[],
  },
};
const alcoholOxidationSpecification = {
  type: alcoholOxidationType,
  version: 1,
  thumbnailAssetKey: alcoholOxidationThumbnailAssetKey,
  parameters: alcoholOxidationParameters,
};
const oxidationParameter = alcoholOxidationSpecification.parameters.oxidationConditions;
const oxidationConditions = oxidationParameter.allowedValues;
const defaultOxidationCondition = oxidationParameter.defaultValue;

const normalizeOxidationCondition = (value: unknown): OxidationCondition =>
  oxidationConditions.includes(value as OxidationCondition)
    ? value as OxidationCondition
    : defaultOxidationCondition;

function normalizeOxidationValues(values: OxidationValues): { oxidationConditions: OxidationCondition } {
  return { oxidationConditions: normalizeOxidationCondition(values.oxidationConditions) };
}

function calculateAlcoholOxidationProducts(values: OxidationValues) {
  const { oxidationConditions: condition } = normalizeOxidationValues(values);
  return {
    primary: condition === "dess_martin" ? "aldehyde" : "carboxylicAcid",
    secondary: "ketone",
    tertiary: "noOxidation",
  };
}

function initializeAlcoholOxidationSpecification(): void {}
function initializeAlcoholOxidationModel(): void {}

export {
  normalizeOxidationValues as a,
  initializeAlcoholOxidationModel as i,
  oxidationConditions as n,
  initializeAlcoholOxidationSpecification as o,
  calculateAlcoholOxidationProducts as r,
  alcoholOxidationSpecification as s,
  defaultOxidationCondition as t,
};
