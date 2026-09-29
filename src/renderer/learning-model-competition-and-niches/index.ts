// Fundamental and realized niches under interspecific competition.
import "@rchunk/rolldown-runtime";

type ResourceDimension = "food size" | "habitat space" | "feeding time";
interface CompetitionValues { resource_dimension?: unknown; resourceSimilarity?: number | null; competitorPresent?: number | null }

const competitionAndNichesType = "COMPETITION_AND_NICHES";
const competitionAndNichesThumbnail = "competition-and-niches-v3";
const competitionAndNichesParameters = { resource_dimension: { kind: "enum" as const, defaultValue: "food size" as ResourceDimension, allowedValues: ["food size", "habitat space", "feeding time"] as ResourceDimension[] } };
const competitionAndNichesSpecification = { type: competitionAndNichesType, version: 2, thumbnailAssetKey: competitionAndNichesThumbnail, parameters: competitionAndNichesParameters };
const resourceDimensionParameter = competitionAndNichesSpecification.parameters.resource_dimension;
const isResourceDimension = (value: unknown): value is ResourceDimension => value === "food size" || value === "habitat space" || value === "feeding time";
const resourceDimensions = resourceDimensionParameter.allowedValues.filter(isResourceDimension);
const defaultResourceDimension = isResourceDimension(resourceDimensionParameter.defaultValue) ? resourceDimensionParameter.defaultValue : "food size";
const resourceSimilarityControl = { defaultValue: 58, min: 0, max: 100, step: 1 };
const competitorPresentControl = { defaultValue: 1, min: 0, max: 1, step: 1 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const normalizeCompetitionValues = (values: CompetitionValues) => ({ resource_dimension: isResourceDimension(values.resource_dimension) ? values.resource_dimension : defaultResourceDimension, resourceSimilarity: Number.isFinite(values.resourceSimilarity) ? clamp(values.resourceSimilarity ?? resourceSimilarityControl.defaultValue, resourceSimilarityControl.min, resourceSimilarityControl.max) : resourceSimilarityControl.defaultValue, competitorPresent: +((values.competitorPresent ?? 0) >= 0.5) });
const gaussian = (x: number, center: number, width: number, amplitude: number): number => amplitude * Math.exp(-0.5 * ((x - center) / width) ** 2);
const calculateCompetitionAndNiches = (values: CompetitionValues) => {
  const normalized = normalizeCompetitionValues(values);
  const similarity = normalized.resourceSimilarity / 100;
  const speciesACenter = 3.65;
  const speciesBCenter = 7.35 - similarity * 2.9;
  const transitionCenter = (speciesACenter + speciesBCenter) / 2 + 0.38;
  const speciesA: { x: number; y: number }[] = [];
  const speciesBFundamental: { x: number; y: number }[] = [];
  const speciesBRealized: { x: number; y: number }[] = [];
  const shared: { x: number; y: number }[] = [];
  for (let index = 0; index <= 160; index += 1) {
    const x = index / 160 * 12;
    const speciesAValue = gaussian(x, speciesACenter, 1.12, 0.92);
    const speciesBFundamentalValue = gaussian(x, speciesBCenter, 1.36, 0.84);
    const speciesBRealizedValue = speciesBFundamentalValue * (normalized.competitorPresent === 1 ? 0.08 + 0.82 / (1 + Math.exp(-(x - transitionCenter) / 0.18)) : 1);
    speciesA.push({ x, y: speciesAValue }); speciesBFundamental.push({ x, y: speciesBFundamentalValue }); speciesBRealized.push({ x, y: speciesBRealizedValue }); shared.push({ x, y: Math.min(speciesAValue, speciesBRealizedValue) });
  }
  const sharedArea = shared.reduce((area, point, index) => index === 0 ? area : area + (shared[index - 1].y + point.y) / 2 * (point.x - shared[index - 1].x), 0);
  return { ...normalized, speciesACenter, speciesBCenter, speciesA, speciesBFundamental, speciesBRealized, shared, sharedArea, overlapLevel: sharedArea > 0.74 ? "high" : sharedArea > 0.42 ? "partial" : "low" };
};

function initializeCompetitionAndNichesSpecification(): void {}
function initializeCompetitionAndNichesModel(): void {}

export { calculateCompetitionAndNiches as a, initializeCompetitionAndNichesSpecification as c, resourceSimilarityControl as i, competitionAndNichesSpecification as l, defaultResourceDimension as n, initializeCompetitionAndNichesModel as o, resourceDimensions as r, normalizeCompetitionValues as s, competitorPresentControl as t };
