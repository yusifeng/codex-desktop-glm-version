// Island-biogeography equilibrium model. Release chunk: model-2553fb5c0f9e.js.
import "@rchunk/rolldown-runtime";

type IslandArea = "small" | "large";
type IslandIsolation = "near" | "far";
interface IslandBiogeographyInput { island_area?: string; isolation?: string }

const islandBiogeographyDefinition = {
  type: "ISLAND_BIOGEOGRAPHY",
  version: 3,
  thumbnailAssetKey: "island-biogeography-v1",
  parameters: {
    island_area: { kind: "enum", defaultValue: "large", allowedValues: ["small", "large"] },
    isolation: { kind: "enum", defaultValue: "near", allowedValues: ["near", "far"] },
  },
} as const;
const immigrationMaximums: Record<IslandIsolation, number> = { near: 90, far: 50 };
const extinctionMaximums: Record<IslandArea, number> = { small: 90, large: 40 };
const defaultIslandBiogeographyValues = { island_area: islandBiogeographyDefinition.parameters.island_area.defaultValue, isolation: islandBiogeographyDefinition.parameters.isolation.defaultValue };
const normalizeIslandBiogeographyInput = (input: IslandBiogeographyInput) => ({
  island_area: input.island_area === "small" || input.island_area === "large" ? input.island_area : defaultIslandBiogeographyValues.island_area,
  isolation: input.isolation === "near" || input.isolation === "far" ? input.isolation : defaultIslandBiogeographyValues.isolation,
});
const calculateIslandBiogeography = (input: IslandBiogeographyInput) => {
  const normalized = normalizeIslandBiogeographyInput(input);
  const immigrationMax = immigrationMaximums[normalized.isolation];
  const extinctionMax = extinctionMaximums[normalized.island_area];
  return { ...normalized, immigrationMax, extinctionMax, richness: 100 * immigrationMax / (immigrationMax + extinctionMax), turnover: immigrationMax * extinctionMax / (immigrationMax + extinctionMax) };
};
const calculateIslandScenario = (island_area: IslandArea, isolation: IslandIsolation) => calculateIslandBiogeography({ island_area, isolation });
function initializeIslandBiogeographyDefinition(): void {}
function initializeIslandBiogeographyModel(): void {}

export { calculateIslandScenario as a, islandBiogeographyDefinition as c, calculateIslandBiogeography as i, extinctionMaximums as n, initializeIslandBiogeographyModel as o, immigrationMaximums as r, initializeIslandBiogeographyDefinition as s, defaultIslandBiogeographyValues as t };
