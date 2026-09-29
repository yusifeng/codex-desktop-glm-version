// Matched-pairs experimental designs with assignment and matching quality.
import "@rchunk/rolldown-runtime";

type DesignVariant = "separate-units" | "self-paired";
type MatchingQuality = "close" | "poor";
interface MatchedPairsValues { design_variant?: unknown; matchingQuality?: unknown; assignment?: number | null }

const matchedPairsType = "MATCHED_PAIRS_DESIGN";
const matchedPairsThumbnail = "matched-pairs-design-v1";
const matchedPairsParameters = { design_variant: { kind: "enum" as const, defaultValue: "separate-units" as DesignVariant, allowedValues: ["separate-units", "self-paired"] as DesignVariant[] } };
const matchedPairsSpecification = { type: matchedPairsType, version: 3, thumbnailAssetKey: matchedPairsThumbnail, parameters: matchedPairsParameters };
const designVariantParameter = matchedPairsSpecification.parameters.design_variant;
const isDesignVariant = (value: unknown): value is DesignVariant => typeof value === "string" && designVariantParameter.allowedValues.some((variant) => variant === value);
const defaultDesignVariant = isDesignVariant(designVariantParameter.defaultValue) ? designVariantParameter.defaultValue : "separate-units";
const designVariants = designVariantParameter.allowedValues.filter(isDesignVariant);
const baselines = [38, 54, 71, 89];
const closeOffsets = [-1, 1, 0, 0];
const poorOffsets = [11, 4, 8, 6];
const treatmentEffect = 6;
const selfPairedAssignments = [3, 5, 6, 9, 10, 12];
const calculateMatchedPairsDesign = (values: MatchedPairsValues) => {
  const variant: DesignVariant = values.design_variant === "self-paired" ? "self-paired" : "separate-units";
  const requestedQuality: MatchingQuality = values.matchingQuality === "poor" ? "poor" : "close";
  const quality: MatchingQuality = variant === "self-paired" ? "close" : requestedQuality;
  const normalizedAssignment = Number.isFinite(values.assignment) ? Math.abs(Math.round(values.assignment ?? 5)) % 16 : 5;
  const assignment = variant === "self-paired" && !selfPairedAssignments.some((candidate) => candidate === normalizedAssignment) ? selfPairedAssignments[normalizedAssignment % selfPairedAssignments.length] : normalizedAssignment;
  const offsets = quality === "poor" ? poorOffsets : closeOffsets;
  const lanes = baselines.map((baseline, index) => {
    const firstGetsA = !(assignment >> index & 1);
    const offset = variant === "self-paired" ? 0 : offsets[index] ?? 0;
    const firstBaseline = baseline - offset / 2;
    const secondBaseline = baseline + offset / 2;
    const responseA = firstGetsA ? firstBaseline : secondBaseline;
    const responseB = (firstGetsA ? secondBaseline : firstBaseline) + treatmentEffect;
    return { baseline, firstBaseline, secondBaseline, firstTreatment: firstGetsA ? "A" : "B", secondTreatment: firstGetsA ? "B" : "A", responseA, responseB, difference: responseB - responseA };
  });
  const meanDifference = lanes.reduce((sum, lane) => sum + lane.difference, 0) / lanes.length;
  const spread = Math.sqrt(lanes.reduce((sum, lane) => sum + (lane.difference - meanDifference) ** 2, 0) / lanes.length);
  return { variant, quality, assignment, effect: treatmentEffect, lanes, meanDifference, spread };
};

function initializeMatchedPairsSpecification(): void {}
function initializeMatchedPairsModel(): void {}

export { initializeMatchedPairsModel as a, calculateMatchedPairsDesign as i, defaultDesignVariant as n, initializeMatchedPairsSpecification as o, designVariants as r, matchedPairsSpecification as s, selfPairedAssignments as t };
