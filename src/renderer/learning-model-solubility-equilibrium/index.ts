// Solubility-product equilibrium for several dissolution stoichiometries.
import "@rchunk/rolldown-runtime";

type DissolutionStoichiometry = "MX" | "MX2" | "M2X3";
interface SolubilityValues { dissolution_stoichiometry?: unknown; ksp?: number | null; initialIonProductRatio?: number | null }

const solubilityEquilibriumType = "SOLUBILITY_EQUILIBRIUM";
const solubilityEquilibriumThumbnail = "solubility-equilibrium-v1";
const solubilityEquilibriumParameters = {
  dissolution_stoichiometry: { kind: "enum" as const, defaultValue: "MX" as DissolutionStoichiometry, allowedValues: ["MX", "MX2", "M2X3"] as DissolutionStoichiometry[] },
  ksp: { kind: "number" as const, defaultValue: 85e-18, min: 1e-18, max: 1e-16 },
};
const solubilityEquilibriumSpecification = { type: solubilityEquilibriumType, version: 3, thumbnailAssetKey: solubilityEquilibriumThumbnail, parameters: solubilityEquilibriumParameters };
const ionProductRatioControl = { min: 0, max: 2.2, step: 0.05, defaultValue: 0.35 };
const kspParameter = solubilityEquilibriumSpecification.parameters.ksp;
const stoichiometryParameter = solubilityEquilibriumSpecification.parameters.dissolution_stoichiometry;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const normalizeNumber = (value: number | null | undefined, defaultValue: number, minimum: number, maximum: number): number => Number.isFinite(value) ? clamp(value ?? defaultValue, minimum, maximum) : defaultValue;
const isStoichiometry = (value: unknown): value is DissolutionStoichiometry => stoichiometryParameter.allowedValues.some((candidate) => candidate === value);
const normalizeSolubilityValues = (values: SolubilityValues) => ({
  dissolution_stoichiometry: isStoichiometry(values.dissolution_stoichiometry) ? values.dissolution_stoichiometry : stoichiometryParameter.defaultValue,
  ksp: normalizeNumber(values.ksp, kspParameter.defaultValue, kspParameter.min, kspParameter.max),
  initialIonProductRatio: normalizeNumber(values.initialIonProductRatio, ionProductRatioControl.defaultValue, ionProductRatioControl.min, ionProductRatioControl.max),
});
const stoichiometryDetails: Record<DissolutionStoichiometry, { equationLatex: string; ionProductLatex: string }> = {
  MX: { equationLatex: "MX(s)\\rightleftharpoons M^{+}(aq)+X^{-}(aq)", ionProductLatex: "[M^+][X^-]" },
  MX2: { equationLatex: "MX_2(s)\\rightleftharpoons M^{2+}(aq)+2X^{-}(aq)", ionProductLatex: "[M^{2+}][X^-]^2" },
  M2X3: { equationLatex: "M_2X_3(s)\\rightleftharpoons2M^{3+}(aq)+3X^{2-}(aq)", ionProductLatex: "[M^{3+}]^2[X^{2-}]^3" },
};
const calculateSolubilityEquilibrium = (values: SolubilityValues) => {
  const normalized = normalizeSolubilityValues(values);
  const state = normalized.initialIonProductRatio < 1 ? "unsaturated" : normalized.initialIonProductRatio > 1 ? "supersaturated" : "saturated";
  return { ...normalized, state, ...stoichiometryDetails[normalized.dissolution_stoichiometry], initialQsp: normalized.initialIonProductRatio * normalized.ksp };
};
const ionProductRelaxation = (initialRatio: number, time: number): number => 1 + (initialRatio - 1) * Math.exp(-0.8 * time);
const ionProductCurve = (initialRatio: number) => Array.from({ length: 65 }, (_unused, index) => { const x = index / 8; return { x, y: ionProductRelaxation(initialRatio, x) }; });
const formatScientificLatex = (value: number, formatMantissa: (value: number) => string = (mantissa) => mantissa.toPrecision(3).replace(/\.?0+$/, "")): string => {
  if (value === 0) return "0";
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  return `${formatMantissa(value / 10 ** exponent)}\\times10^{${exponent}}`;
};

function initializeSolubilityEquilibriumSpecification(): void {}
function initializeSolubilityEquilibriumModel(): void {}

export { initializeSolubilityEquilibriumModel as a, initializeSolubilityEquilibriumSpecification as c, formatScientificLatex as i, solubilityEquilibriumSpecification as l, calculateSolubilityEquilibrium as n, normalizeSolubilityValues as o, ionProductCurve as r, ionProductRelaxation as s, ionProductRatioControl as t };
