// Compare endogenous MHC I and exogenous MHC II antigen-presentation pathways.
import "@rchunk/rolldown-runtime";

type MhcPathway = "MHC I (endogenous)" | "MHC II (exogenous)";
interface EnumParameter { kind: "enum"; defaultValue: MhcPathway; allowedValues: MhcPathway[] }
interface MhcPresentationValues { initial_pathway?: string | null; stage?: number | null }

const mhcPresentationType = "MHC_I_VS_MHC_II_PRESENTATION";
const mhcPresentationThumbnail = "mhc-i-vs-mhc-ii-presentation-v2";
const mhcPresentationParameters: { initial_pathway: EnumParameter } = {
  initial_pathway: {
    kind: "enum",
    defaultValue: "MHC I (endogenous)",
    allowedValues: ["MHC I (endogenous)", "MHC II (exogenous)"],
  },
};
const mhcPresentationSpecification = {
  type: mhcPresentationType,
  version: 1,
  thumbnailAssetKey: mhcPresentationThumbnail,
  parameters: mhcPresentationParameters,
};
const pathways = mhcPresentationSpecification.parameters.initial_pathway.allowedValues;
const pathwayControl = {
  min: 0,
  max: pathways.length - 1,
  step: 1,
  defaultValue: mhcPresentationSpecification.parameters.initial_pathway.defaultValue,
};
const stageControl = { min: 0, max: 3, step: 1, defaultValue: 0 };

const pathwayToIndex = (pathway: string): number => Math.max(0, pathways.indexOf(pathway as MhcPathway));
const indexToPathway = (index: number): MhcPathway =>
  pathways[Math.min(Math.max(Math.round(index), pathwayControl.min), pathwayControl.max)] ?? pathwayControl.defaultValue;

function normalizeMhcPresentationValues(values: MhcPresentationValues) {
  const stage = typeof values.stage === "number" && Number.isFinite(values.stage)
    ? Math.round(values.stage)
    : stageControl.defaultValue;
  const candidate = values.initial_pathway ?? "";
  return {
    initial_pathway: pathways.includes(candidate as MhcPathway) ? candidate as MhcPathway : pathwayControl.defaultValue,
    stage: Math.min(Math.max(stage, stageControl.min), stageControl.max),
  };
}

function initializeMhcPresentationSpecification(): void {}
function initializeMhcPresentationModel(): void {}

export {
  initializeMhcPresentationModel as a,
  mhcPresentationSpecification as c,
  pathwayToIndex as i,
  stageControl as n,
  normalizeMhcPresentationValues as o,
  indexToPathway as r,
  initializeMhcPresentationSpecification as s,
  pathwayControl as t,
};
