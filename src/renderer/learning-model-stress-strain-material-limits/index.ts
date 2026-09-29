// Piecewise engineering stress-strain curves through fracture.
import "@rchunk/rolldown-runtime";

type MaterialId = "steel" | "aluminum" | "copper";
interface StressStrainValues { material?: unknown; loadProgress?: number | null }
interface Material { id: MaterialId; name: string; shortName: string; youngsModulusGPa: number; yieldStressMPa: number; yieldStrain: number; tensileStrengthMPa: number; ultimateStrain: number; fractureStressMPa: number; fractureStrain: number; stressAxisMaxMPa: number }

const stressStrainSpecification = { type: "STRESS_STRAIN_MATERIAL_LIMITS", version: 1, thumbnailAssetKey: "stress-strain-material-limits-v1", parameters: { material: { kind: "enum" as const, defaultValue: "steel" as MaterialId, allowedValues: ["steel", "aluminum", "copper"] as MaterialId[] } } };
const materials: Material[] = [
  { id: "steel", name: "Structural steel", shortName: "Steel", youngsModulusGPa: 200, yieldStressMPa: 250, yieldStrain: 125e-5, tensileStrengthMPa: 460, ultimateStrain: 0.18, fractureStressMPa: 360, fractureStrain: 0.28, stressAxisMaxMPa: 520 },
  { id: "aluminum", name: "Aluminum alloy", shortName: "Aluminum", youngsModulusGPa: 69, yieldStressMPa: 275, yieldStrain: 275 / 69e3, tensileStrengthMPa: 310, ultimateStrain: 0.12, fractureStressMPa: 240, fractureStrain: 0.2, stressAxisMaxMPa: 350 },
  { id: "copper", name: "Annealed copper", shortName: "Copper", youngsModulusGPa: 117, yieldStressMPa: 70, yieldStrain: 70 / 117e3, tensileStrengthMPa: 220, ultimateStrain: 0.3, fractureStressMPa: 170, fractureStrain: 0.45, stressAxisMaxMPa: 250 },
];
const materialParameter = stressStrainSpecification.parameters.material;
const loadProgressControl = { defaultValue: 0.42, min: 0, max: 1 };
const defaultStressStrainValues = { material: materialParameter.defaultValue, loadProgress: loadProgressControl.defaultValue };
const elasticProgressShare = 0.28;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const smoothstep = (value: number): number => value * value * (3 - 2 * value);
const normalizeStressStrainValues = (values: StressStrainValues) => ({
  material: typeof values.material === "string" && materialParameter.allowedValues.some((material) => material === values.material) ? values.material as MaterialId : defaultStressStrainValues.material,
  loadProgress: clamp(typeof values.loadProgress === "number" && Number.isFinite(values.loadProgress) ? values.loadProgress : defaultStressStrainValues.loadProgress, loadProgressControl.min, loadProgressControl.max),
});
const materialForId = (id: MaterialId): Material => materials.find((material) => material.id === id) ?? materials[0];
const stressAtStrain = (material: Material, strain: number): number => {
  const safeStrain = clamp(strain, 0, material.fractureStrain);
  if (safeStrain <= material.yieldStrain) return material.youngsModulusGPa * 1e3 * safeStrain;
  if (safeStrain <= material.ultimateStrain) {
    const progress = (safeStrain - material.yieldStrain) / (material.ultimateStrain - material.yieldStrain);
    return material.yieldStressMPa + (material.tensileStrengthMPa - material.yieldStressMPa) * smoothstep(progress);
  }
  const progress = (safeStrain - material.ultimateStrain) / (material.fractureStrain - material.ultimateStrain);
  return material.tensileStrengthMPa + (material.fractureStressMPa - material.tensileStrengthMPa) * smoothstep(progress);
};
const strainForLoadProgress = (material: Material, loadProgress: number): number => {
  const progress = clamp(loadProgress, 0, 1);
  return progress <= elasticProgressShare ? material.yieldStrain * (progress / elasticProgressShare) : material.yieldStrain + (material.fractureStrain - material.yieldStrain) * ((progress - elasticProgressShare) / (1 - elasticProgressShare));
};
const loadProgressForStrain = (material: Material, strain: number): number => {
  const safeStrain = clamp(strain, 0, material.fractureStrain);
  return safeStrain <= material.yieldStrain ? elasticProgressShare * (safeStrain / Math.max(material.yieldStrain, 1e-9)) : elasticProgressShare + (1 - elasticProgressShare) * ((safeStrain - material.yieldStrain) / (material.fractureStrain - material.yieldStrain));
};
const fractureFraction = (material: Material, strain: number): number => clamp(strain / material.fractureStrain, 0, 1);
const loadProgressForStrainFraction = (material: Material, strainFraction: number): number => loadProgressForStrain(material, clamp(strainFraction, 0, 1) * material.fractureStrain);
const materialRegion = (material: Material, strain: number): "elastic" | "plastic" | "necking" | "fracture" => strain >= material.fractureStrain * 0.995 ? "fracture" : strain <= material.yieldStrain ? "elastic" : strain <= material.ultimateStrain ? "plastic" : "necking";

function initializeStressStrainSpecification(): void {}
function initializeStressStrainModel(): void {}

export { materialForId as a, initializeStressStrainModel as c, normalizeStressStrainValues as d, fractureFraction as f, materialParameter as i, loadProgressForStrainFraction as l, stressStrainSpecification as m, loadProgressControl as n, stressAtStrain as o, initializeStressStrainSpecification as p, materials as r, materialRegion as s, defaultStressStrainValues as t, strainForLoadProgress as u };
