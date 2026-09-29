// Acid strength comparisons explained by conjugate-base stability.
import "@rchunk/rolldown-runtime";

type AcidStrengthComparison = "resonance" | "inductive" | "atom-trend" | "hybridization";
interface AcidStrengthValues { comparison?: unknown }
interface AcidExample { acidPrefix: string; baseContributors: string[]; pKa: number }
interface AcidComparison { key: AcidStrengthComparison; stronger: AcidExample; weaker: AcidExample }

const acidStrengthType = "ACID_STRENGTH_AND_CONJUGATE_BASE_STABILITY";
const acidStrengthThumbnail = "acid-strength-and-conjugate-base-stability-v1";
const acidStrengthParameters = { comparison: { kind: "enum" as const, defaultValue: "resonance" as AcidStrengthComparison, allowedValues: ["resonance", "inductive", "atom-trend", "hybridization"] as AcidStrengthComparison[] } };
const acidStrengthSpecification = { type: acidStrengthType, version: 2, thumbnailAssetKey: acidStrengthThumbnail, parameters: acidStrengthParameters };
const comparisons: AcidStrengthComparison[] = ["resonance", "inductive", "atom-trend", "hybridization"];
const comparisonDetails: Record<AcidStrengthComparison, AcidComparison> = {
  resonance: { key: "resonance", stronger: { acidPrefix: "\\mathrm{CH_3{-}C(=O){-}O{-}}", baseContributors: ["\\mathrm{CH_3{-}C(=O){-}O^-}", "\\mathrm{CH_3{-}C(-O^-){=}O}"], pKa: 4.8 }, weaker: { acidPrefix: "\\mathrm{CH_3CH_2{-}O{-}}", baseContributors: ["\\mathrm{CH_3CH_2{-}O^-}"], pKa: 16 } },
  inductive: { key: "inductive", stronger: { acidPrefix: "\\mathrm{ClCH_2{-}C(=O){-}O{-}}", baseContributors: ["\\mathrm{ClCH_2{-}C(=O){-}O^-}"], pKa: 2.9 }, weaker: { acidPrefix: "\\mathrm{CH_3{-}C(=O){-}O{-}}", baseContributors: ["\\mathrm{CH_3{-}C(=O){-}O^-}"], pKa: 4.8 } },
  "atom-trend": { key: "atom-trend", stronger: { acidPrefix: "\\mathrm{CH_3CH_2{-}O{-}}", baseContributors: ["\\mathrm{CH_3CH_2{-}O^-}"], pKa: 16 }, weaker: { acidPrefix: "\\mathrm{CH_3CH_2{-}NH{-}}", baseContributors: ["\\mathrm{CH_3CH_2{-}NH^-}"], pKa: 38 } },
  hybridization: { key: "hybridization", stronger: { acidPrefix: "\\mathrm{HC{\\equiv}C{-}}", baseContributors: ["\\mathrm{HC{\\equiv}C^-}"], pKa: 25 }, weaker: { acidPrefix: "\\mathrm{CH_3CH_2{-}}", baseContributors: ["\\mathrm{CH_3CH_2^-}"], pKa: 50 } },
};
const defaultComparison = acidStrengthSpecification.parameters.comparison.defaultValue;
const selectAcidStrengthComparison = (values: AcidStrengthValues): AcidComparison => { const comparison = typeof values.comparison === "string" && comparisons.some((candidate) => candidate === values.comparison) ? values.comparison as AcidStrengthComparison : defaultComparison; return comparisonDetails[comparison]; };

function initializeAcidStrengthSpecification(): void {}
function initializeAcidStrengthModel(): void {}

export { acidStrengthSpecification as a, initializeAcidStrengthSpecification as i, selectAcidStrengthComparison as n, initializeAcidStrengthModel as r, comparisons as t };
