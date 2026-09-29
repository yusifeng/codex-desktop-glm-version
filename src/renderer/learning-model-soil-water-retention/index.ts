// Soil-water-retention learning model using van Genuchten curves.
// Release chunk: app/webview/assets/model-d08d16b0a6e8.js.
import "@rchunk/rolldown-runtime";

type SoilTexture = "sand" | "loam" | "clay";
interface SoilWaterValues { soil_texture?: string | null; suctionLog10?: number | null }
interface NormalizedSoilWaterValues { soil_texture: SoilTexture; suctionLog10: number }
interface SoilParameters { residual: number; saturated: number; alpha: number; n: number }

let soilTextures: SoilTexture[];
let suctionLogControl: { min: number; max: number; step: number; defaultValue: number };
let fieldCapacityLog: number;
let wiltingPointLog: number;
let normalizeSoilWaterValues: (values: SoilWaterValues) => NormalizedSoilWaterValues;
let waterContentPercent: (texture: SoilTexture, suctionKpa: number) => number;
let isSoilTexture: (value: unknown) => value is SoilTexture;
let calculateSoilWaterState: (values: SoilWaterValues) => NormalizedSoilWaterValues & {
  suctionKpa: number; current: number; fieldCapacity: number; wiltingPoint: number; plantAvailable: number;
};
let initialized = false;

function initializeSoilWaterRetentionModel(): void {
  if (initialized) return;
  initialized = true;
  soilTextures = ["sand", "loam", "clay"];
  suctionLogControl = { min: 0, max: 4, step: 0.05, defaultValue: 1.52 };
  fieldCapacityLog = Math.log10(33);
  wiltingPointLog = Math.log10(1500);
  const parameters: Record<SoilTexture, SoilParameters> = {
    sand: { residual: 0.03, saturated: 0.43, alpha: 1.3249278, n: 1.39445576 },
    loam: { residual: 0.07, saturated: 0.46, alpha: 0.0567237, n: 1.32983302 },
    clay: { residual: 0.12, saturated: 0.5, alpha: 0.24867067, n: 1.1569497 },
  };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.max(minimum, Math.min(maximum, value));
  isSoilTexture = (value): value is SoilTexture => value === "sand" || value === "loam" || value === "clay";
  normalizeSoilWaterValues = values => ({
    soil_texture: isSoilTexture(values.soil_texture) ? values.soil_texture : "loam",
    suctionLog10: typeof values.suctionLog10 === "number" && Number.isFinite(values.suctionLog10)
      ? clamp(values.suctionLog10, suctionLogControl.min, suctionLogControl.max)
      : suctionLogControl.defaultValue,
  });
  waterContentPercent = (texture, suctionKpa) => {
    const { residual, saturated, alpha, n } = parameters[texture];
    const exponent = 1 - 1 / n;
    return 100 * (residual + (saturated - residual) / (1 + (alpha * Math.max(0, suctionKpa)) ** +n) ** exponent);
  };
  calculateSoilWaterState = values => {
    const normalized = normalizeSoilWaterValues(values);
    const suctionKpa = 10 ** normalized.suctionLog10;
    const fieldCapacity = waterContentPercent(normalized.soil_texture, 33);
    const wiltingPoint = waterContentPercent(normalized.soil_texture, 1500);
    return {
      ...normalized, suctionKpa, current: waterContentPercent(normalized.soil_texture, suctionKpa),
      fieldCapacity, wiltingPoint, plantAvailable: fieldCapacity - wiltingPoint,
    };
  };
}

export {
  calculateSoilWaterState as a, normalizeSoilWaterValues as c, wiltingPointLog as i,
  waterContentPercent as l, soilTextures as n, initializeSoilWaterRetentionModel as o,
  suctionLogControl as r, isSoilTexture as s, fieldCapacityLog as t,
};
