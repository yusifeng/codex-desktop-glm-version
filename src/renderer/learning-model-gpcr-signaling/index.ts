// G-protein-coupled receptor signaling pathways and activation stages.
import "@rchunk/rolldown-runtime";

type GpcrPathway = "Gs" | "Gi" | "Gq";
interface GpcrValues { pathway?: string | null; stage?: number | null }

const gpcrSignalingType = "GPCR_SIGNALING";
const gpcrSignalingThumbnail = "gpcr-signaling-v1";
const gpcrSignalingParameters = { pathway: { kind: "enum" as const, defaultValue: "Gs" as GpcrPathway, allowedValues: ["Gs", "Gi", "Gq"] as GpcrPathway[] } };
const gpcrSignalingSpecification = { type: gpcrSignalingType, version: 1, thumbnailAssetKey: gpcrSignalingThumbnail, parameters: gpcrSignalingParameters };
const pathways = gpcrSignalingSpecification.parameters.pathway.allowedValues;
const pathwayControl = { min: 0, max: pathways.length - 1, step: 1, defaultValue: gpcrSignalingSpecification.parameters.pathway.defaultValue };
const signalingStageControl = { min: 0, max: 3, step: 1, defaultValue: 2 };
const isGpcrPathway = (value: unknown): value is GpcrPathway => pathways.some((pathway) => pathway === value);
const normalizeGpcrValues = (values: GpcrValues) => ({
  pathway: isGpcrPathway(values.pathway) ? values.pathway : pathwayControl.defaultValue,
  stage: typeof values.stage === "number" && Number.isFinite(values.stage) ? Math.min(signalingStageControl.max, Math.max(0, Math.round(values.stage))) : signalingStageControl.defaultValue,
});
const pathwayForIndex = (index: number): GpcrPathway => pathways[Math.min(pathwayControl.max, Math.max(0, Math.round(index)))] ?? pathwayControl.defaultValue;
const indexForPathway = (pathway: GpcrPathway): number => Math.max(0, pathways.indexOf(pathway));
const calculateGpcrSignaling = (values: GpcrValues) => {
  const normalized = normalizeGpcrValues(values);
  const isGq = normalized.pathway === "Gq";
  const isGi = normalized.pathway === "Gi";
  return {
    ...normalized, ligandBound: normalized.stage !== 0, exchanged: normalized.stage === 1 || normalized.stage === 2, separated: normalized.stage === 2, signaling: normalized.stage === 2, resetting: normalized.stage === 3,
    effector: isGq ? "plc-beta" : "adenylyl-cyclase", outcome: isGq ? "ip3-and-dag" : isGi ? "camp-decreases" : "camp-increases",
  };
};

function initializeGpcrSignalingSpecification(): void {}
function initializeGpcrSignalingModel(): void {}

export { pathwayForIndex as a, initializeGpcrSignalingSpecification as c, initializeGpcrSignalingModel as i, gpcrSignalingSpecification as l, signalingStageControl as n, indexForPathway as o, calculateGpcrSignaling as r, normalizeGpcrValues as s, pathwayControl as t };
