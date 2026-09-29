// Biomagnification learning model. Release chunk: model-aae321d23dad.js.
import "@rchunk/rolldown-runtime";

type Contaminant = "DDT" | "methylmercury" | "PCBs";
type TrophicKey = "water" | "plankton" | "smallFish" | "largeFish" | "apex";
interface BiomagnificationValues { contaminant?: string | null; stage?: number | null }
interface TrophicStage { key: TrophicKey; concentrationPpm: number }
interface BiomagnificationManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { contaminant: { kind: "enum"; defaultValue: Contaminant; allowedValues: Contaminant[] } };
}

let biomagnificationManifest: BiomagnificationManifest;
let trophicStages: TrophicStage[];
let biomagnificationControls: { defaultContaminant: Contaminant; contaminantOptions: Contaminant[]; minStage: number; maxStage: number; step: number };
let normalizeBiomagnificationValues: (values: BiomagnificationValues) => { contaminant: Contaminant; stage: number };
let formatConcentration: (stage: TrophicStage) => { value: number; unit: "ppb" | "ppm" };
let concentrationLogPosition: (concentrationPpm: number) => number;
let calculateBiomagnificationFactor: () => number;
let manifestInitialized = false;
let modelInitialized = false;

function initializeBiomagnificationManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  biomagnificationManifest = {
    type: "BIOMAGNIFICATION", version: 2, thumbnailAssetKey: "biomagnification-v3",
    parameters: { contaminant: { kind: "enum", defaultValue: "DDT", allowedValues: ["DDT", "methylmercury", "PCBs"] } },
  };
}

function initializeBiomagnificationModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeBiomagnificationManifest();
  trophicStages = [
    { key: "water", concentrationPpm: 3e-6 }, { key: "plankton", concentrationPpm: 0.04 },
    { key: "smallFish", concentrationPpm: 0.5 }, { key: "largeFish", concentrationPpm: 2 },
    { key: "apex", concentrationPpm: 25 },
  ];
  const parameter = biomagnificationManifest.parameters.contaminant;
  biomagnificationControls = {
    defaultContaminant: parameter.defaultValue, contaminantOptions: parameter.allowedValues,
    minStage: 0, maxStage: trophicStages.length - 1, step: 1,
  };
  const isContaminant = (value: unknown): value is Contaminant => biomagnificationControls.contaminantOptions.some(option => option === value);
  normalizeBiomagnificationValues = values => ({
    contaminant: isContaminant(values.contaminant) ? values.contaminant : biomagnificationControls.defaultContaminant,
    stage: typeof values.stage === "number" && Number.isFinite(values.stage)
      ? Math.max(biomagnificationControls.minStage, Math.min(biomagnificationControls.maxStage, Math.round(values.stage)))
      : biomagnificationControls.maxStage,
  });
  formatConcentration = stage => stage.key === "water"
    ? { value: stage.concentrationPpm * 1_000, unit: "ppb" }
    : { value: stage.concentrationPpm, unit: "ppm" };
  concentrationLogPosition = concentrationPpm => {
    const minimum = trophicStages[0].concentrationPpm;
    const maximum = trophicStages[trophicStages.length - 1].concentrationPpm;
    const logRange = Math.log10(maximum) - Math.log10(minimum);
    return Math.min(100, Math.max(0, (Math.log10(concentrationPpm) - Math.log10(minimum)) / logRange * 100));
  };
  calculateBiomagnificationFactor = () =>
    Math.round(trophicStages[trophicStages.length - 1].concentrationPpm / trophicStages[0].concentrationPpm);
}

export {
  formatConcentration as a, initializeBiomagnificationManifest as c, concentrationLogPosition as i,
  biomagnificationManifest as l, trophicStages as n, initializeBiomagnificationModel as o,
  calculateBiomagnificationFactor as r, normalizeBiomagnificationValues as s, biomagnificationControls as t,
};
