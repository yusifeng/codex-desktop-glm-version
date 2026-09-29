// Population-density learning model with logarithmic controls and density bands.
// Release chunk: app/webview/assets/model-4db1a43b78c0.js.
import "@rchunk/rolldown-runtime";

interface PopulationDensityValues { population?: number | null; landAreaSquareKilometers?: number | null }
interface DensityBand { key: string; lower: number; upper: number }
interface PopulationDensityManifest {
  type: string; version: number; thumbnailAssetKey: string; canonicalFormula: string;
  parameters: {
    population: { kind: "integer"; defaultValue: number; min: number; max: number };
    landAreaSquareKilometers: { kind: "number"; defaultValue: number; min: number; max: number };
  };
}

let populationDensityManifest: PopulationDensityManifest;
let populationParameter: PopulationDensityManifest["parameters"]["population"];
let areaParameter: PopulationDensityManifest["parameters"]["landAreaSquareKilometers"];
let densityBands: DensityBand[];
let populationLogControl: { min: number; max: number; step: number };
let areaLogControl: { min: number; max: number; step: number };
let normalizePopulationDensityValues: (values: PopulationDensityValues) => { population: number; landAreaSquareKilometers: number };
let calculatePopulationDensity: (values: PopulationDensityValues) => number;
let logDensity: (density: number) => number;
let populationFromLog: (logPopulation: number) => number;
let areaFromLog: (logArea: number) => number;
let populationMarkerRadius: (population: number) => number;
let areaMarkerRadius: (area: number) => number;
let classifyDensity: (density: number) => DensityBand;
let densityScalePosition: (density: number) => number;
let manifestInitialized = false;
let modelInitialized = false;

function initializePopulationDensityManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  populationDensityManifest = {
    type: "POPULATION_DENSITY", version: 1, thumbnailAssetKey: "population-density-v1",
    canonicalFormula: "D = \\frac{P}{A}",
    parameters: {
      population: { kind: "integer", defaultValue: 500_000, min: 1_000, max: 1_000_000 },
      landAreaSquareKilometers: { kind: "number", defaultValue: 100, min: 5, max: 1_000 },
    },
  };
}

function initializePopulationDensityModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializePopulationDensityManifest();
  populationParameter = populationDensityManifest.parameters.population;
  areaParameter = populationDensityManifest.parameters.landAreaSquareKilometers;
  const minimumDensity = populationParameter.min / areaParameter.max;
  const maximumDensity = populationParameter.max / areaParameter.min;
  densityBands = [
    { key: "sparseRural", lower: minimumDensity, upper: 50 }, { key: "village", lower: 50, upper: 300 },
    { key: "town", lower: 300, upper: 2_500 }, { key: "city", lower: 2_500, upper: 15_000 },
    { key: "urbanCore", lower: 15_000, upper: maximumDensity },
  ];
  populationLogControl = { min: Math.log10(populationParameter.min), max: Math.log10(populationParameter.max), step: 0.01 };
  const minimumMarkerRadius = 0.55;
  const radiusExponent = 2 * Math.log(minimumMarkerRadius) / Math.log(areaParameter.min / areaParameter.max);
  areaLogControl = { min: Math.log10(areaParameter.min), max: Math.log10(areaParameter.max), step: 0.01 };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
  const normalizeFinite = (value: number | null | undefined, fallback: number, minimum: number, maximum: number): number =>
    clamp(typeof value === "number" && Number.isFinite(value) ? value : fallback, minimum, maximum);
  normalizePopulationDensityValues = values => ({
    population: Math.round(normalizeFinite(values.population, populationParameter.defaultValue, populationParameter.min, populationParameter.max)),
    landAreaSquareKilometers: normalizeFinite(values.landAreaSquareKilometers, areaParameter.defaultValue, areaParameter.min, areaParameter.max),
  });
  calculatePopulationDensity = values => {
    const normalized = normalizePopulationDensityValues(values);
    return normalized.population / normalized.landAreaSquareKilometers;
  };
  logDensity = density => Math.log10(Math.max(density, Number.MIN_VALUE));
  populationFromLog = logPopulation => Math.round(10 ** logPopulation / 1_000) * 1_000;
  areaFromLog = logArea => Math.max(1, Math.round(10 ** logArea));
  populationMarkerRadius = population =>
    (clamp(Number.isFinite(population) ? population : populationParameter.min, populationParameter.min, populationParameter.max) / populationParameter.max) ** +radiusExponent;
  areaMarkerRadius = area =>
    (clamp(Number.isFinite(area) ? area : areaParameter.min, areaParameter.min, areaParameter.max) / areaParameter.max) ** (radiusExponent / 2);
  classifyDensity = density => {
    const normalizedDensity = Number.isFinite(density) ? Math.max(0, density) : 0;
    return densityBands.find(band => normalizedDensity < band.upper) ?? densityBands[densityBands.length - 1];
  };
  densityScalePosition = density => {
    const normalizedDensity = Number.isFinite(density) ? Math.max(minimumDensity, density) : minimumDensity;
    const foundIndex = densityBands.findIndex(band => normalizedDensity < band.upper);
    const bandIndex = foundIndex === -1 ? densityBands.length - 1 : foundIndex;
    const band = densityBands[bandIndex];
    const boundedDensity = clamp(normalizedDensity, band.lower, band.upper);
    const withinBand = (Math.log10(boundedDensity) - Math.log10(band.lower)) / (Math.log10(band.upper) - Math.log10(band.lower));
    return clamp((bandIndex + (Number.isFinite(withinBand) ? withinBand : 0)) / densityBands.length, 0, 1);
  };
}

export {
  calculatePopulationDensity as a, populationMarkerRadius as c, areaFromLog as d, populationFromLog as f,
  populationDensityManifest as g, initializePopulationDensityManifest as h, populationLogControl as i, densityScalePosition as l,
  logDensity as m, areaLogControl as n, classifyDensity as o, normalizePopulationDensityValues as p, areaParameter as r,
  areaMarkerRadius as s, densityBands as t, initializePopulationDensityModel as u,
};
