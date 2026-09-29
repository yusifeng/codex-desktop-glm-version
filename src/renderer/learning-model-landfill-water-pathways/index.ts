// Landfill water-pathway teaching model. Release chunk: model-8e907fa97b63.js.
import "@rchunk/rolldown-runtime";

type LandfillPathway = "gas" | "leachate";
interface LandfillInput { waterEntry?: number; pathway?: LandfillPathway }

const waterEntryControl = { min: 0, max: 100, step: 1, defaultValue: 45 };
const pathwayControl = { defaultValue: "leachate" as const };
const pathwayToggleControl = { min: 0, max: 1, step: 1, defaultValue: 0 };
const normalizeLandfillInput = (input: LandfillInput) => ({
  waterEntry: Number.isFinite(input.waterEntry)
    ? Math.min(waterEntryControl.max, Math.max(waterEntryControl.min, input.waterEntry ?? 0))
    : waterEntryControl.defaultValue,
  pathway: input.pathway === "gas" ? "gas" as const : "leachate" as const,
});
const pathwayToToggle = (pathway: LandfillPathway): number => +(pathway === "gas");
const toggleToPathway = (value: number): LandfillPathway => value >= 0.5 ? "gas" : "leachate";
const describeWaterEntry = (value: number): "dry" | "moderate" | "heavy" =>
  value < 20 ? "dry" : value < 65 ? "moderate" : "heavy";
function initializeLandfillWaterPathwaysModel(): void {}

export { pathwayToToggle as a, normalizeLandfillInput as c, toggleToPathway as i, pathwayToggleControl as n, describeWaterEntry as o, waterEntryControl as r, initializeLandfillWaterPathwaysModel as s, pathwayControl as t };
