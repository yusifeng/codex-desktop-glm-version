// Agricultural-soil-erosion teaching model. Release chunk: model-33ec5072ad67.js.
import "@rchunk/rolldown-runtime";

type FieldManagement = "exposed" | "cover" | "contour";
interface SoilErosionInput { stage?: number; management?: FieldManagement | string }

const soilErosionDefaults = { stage: 1, management: "exposed" as FieldManagement };
const normalizeSoilErosionInput = (input: SoilErosionInput) => ({
  stage: Number.isFinite(input.stage)
    ? Math.min(3, Math.max(0, Math.round(input.stage ?? soilErosionDefaults.stage)))
    : soilErosionDefaults.stage,
  management: input.management === "exposed" || input.management === "cover" || input.management === "contour"
    ? input.management
    : soilErosionDefaults.management,
});
const calculateSoilErosion = (input: SoilErosionInput) => {
  const safe = normalizeSoilErosionInput(input);
  const runoffFactor = safe.management === "exposed" ? 1 : safe.management === "contour" ? 0.62 : 0.42;
  const sedimentFactor = safe.management === "exposed" ? 1 : safe.management === "contour" ? 0.58 : 0.34;
  const channel = safe.stage >= 3 ? "gully" : safe.stage === 2 ? "rill" : "none";
  const channelWidth = channel === "gully"
    ? safe.management === "exposed" ? 16 : safe.management === "contour" ? 12 : 9
    : channel === "rill"
      ? safe.management === "exposed" ? 4 : safe.management === "contour" ? 3 : 2
      : 0;
  return {
    ...safe,
    channel,
    channelWidth,
    splashCount: safe.management === "cover" ? 3 : 9,
    runoff: safe.stage === 0 ? 0 : runoffFactor,
    sediment: Math.round([2, 5, 9, 15][safe.stage] * sedimentFactor),
  };
};
function initializeSoilErosionModel(): void {}

export { normalizeSoilErosionInput as i, calculateSoilErosion as n, initializeSoilErosionModel as r, soilErosionDefaults as t };
