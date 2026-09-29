// Cathodic-protection learning model.
import "@rchunk/rolldown-runtime";

type AnodeMaterial = "magnesium" | "zinc";
interface CathodicProtectionValues { anode_material?: unknown; stage?: number | null }

const cathodicProtectionType = "CATHODIC_PROTECTION";
const cathodicProtectionThumbnail = "cathodic-protection-v1";
const cathodicProtectionParameters = { anode_material: { kind: "enum", defaultValue: "magnesium", allowedValues: ["magnesium", "zinc"] } };
const cathodicProtectionDefinition = { type: cathodicProtectionType, version: 2, thumbnailAssetKey: cathodicProtectionThumbnail, parameters: cathodicProtectionParameters };
const isAnodeMaterial = (value: unknown): value is AnodeMaterial => value === "magnesium" || value === "zinc";
const defaultAnodeMaterial: AnodeMaterial = isAnodeMaterial(cathodicProtectionDefinition.parameters.anode_material.defaultValue)
  ? cathodicProtectionDefinition.parameters.anode_material.defaultValue
  : "magnesium";
const cathodicProtectionStageControl = { min: 0, max: 2, step: 1 };

const normalizeCathodicProtectionValues = (values: CathodicProtectionValues) => ({
  anode_material: isAnodeMaterial(values.anode_material) ? values.anode_material : defaultAnodeMaterial,
  stage: Number.isFinite(values.stage)
    ? Math.min(cathodicProtectionStageControl.max, Math.max(cathodicProtectionStageControl.min, Math.round(values.stage ?? 1)))
    : 1,
});

function deriveCathodicProtectionState(values: CathodicProtectionValues) {
  const normalized = normalizeCathodicProtectionValues(values);
  const symbol = normalized.anode_material === "magnesium" ? "Mg" : "Zn";
  const connected = normalized.stage > 0;
  const afterUse = normalized.stage === 2;
  return {
    ...normalized,
    symbol,
    connected,
    afterUse,
    anodeHeight: afterUse ? 72 : 124,
    ionCount: connected ? afterUse ? 6 : 3 : 0,
    oxidation: `\\mathrm{${symbol}(s)\\rightarrow ${symbol}^{2+}(aq)+2e^-}`,
    reduction: "\\mathrm{O_2+2H_2O+4e^-\\rightarrow4OH^-}",
  };
}

function initializeCathodicProtectionSchema(): void {}
function initializeCathodicProtectionModel(): void {}

export {
  initializeCathodicProtectionSchema as a,
  isAnodeMaterial as i,
  deriveCathodicProtectionState as n,
  cathodicProtectionDefinition as o,
  initializeCathodicProtectionModel as r,
  cathodicProtectionStageControl as t,
};
