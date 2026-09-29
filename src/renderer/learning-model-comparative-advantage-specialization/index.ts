// Comparative-advantage specialization model. Release chunk: model-380eb31b2348.js.
import "@rchunk/rolldown-runtime";

interface ProductionShareInput { producerAXShare?: number; producerBXShare?: number }
interface ProductionPoint { x: number; y: number }

const producerAXShareControl = { label: "A\\to X", min: 0, max: 100, step: 5, defaultValue: 100 };
const producerBXShareControl = { label: "B\\to X", min: 0, max: 100, step: 5, defaultValue: 0 };
const producerAMaximum = { x: 12, y: 6 };
const producerBMaximum = { x: 6, y: 10 };
const specializationTolerance = 1e-3;
const mixedShare = 50;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeShare = (value: number | undefined, fallback: number): number => typeof value === "number" && Number.isFinite(value) ? clamp(value, 0, 100) : fallback;
const productionAtShare = (maximum: ProductionPoint, xShare: number): ProductionPoint => {
  const ratio = xShare / 100;
  return { x: maximum.x * ratio, y: maximum.y * (1 - ratio) };
};
const addProduction = (left: ProductionPoint, right: ProductionPoint): ProductionPoint => ({ x: left.x + right.x, y: left.y + right.y });
const normalizeProductionShares = (input: ProductionShareInput) => ({
  producerAXShare: normalizeShare(input.producerAXShare, producerAXShareControl.defaultValue),
  producerBXShare: normalizeShare(input.producerBXShare, producerBXShareControl.defaultValue),
});
const calculateComparativeAdvantage = (input: ProductionShareInput) => {
  const normalized = normalizeProductionShares(input);
  const producerA = productionAtShare(producerAMaximum, normalized.producerAXShare);
  const producerB = productionAtShare(producerBMaximum, normalized.producerBXShare);
  const total = addProduction(producerA, producerB);
  const mixedBaseline = addProduction(productionAtShare(producerAMaximum, mixedShare), productionAtShare(producerBMaximum, mixedShare));
  return { ...normalized, producerA, producerB, total, mixedBaseline, xGainOverMixed: total.x - mixedBaseline.x, yGainOverMixed: total.y - mixedBaseline.y, isComparativeAdvantageSpecialization: Math.abs(normalized.producerAXShare - 100) <= specializationTolerance && Math.abs(normalized.producerBXShare) <= specializationTolerance };
};
function initializeComparativeAdvantageModel(): void {}

export { calculateComparativeAdvantage as a, producerBXShareControl as i, producerAXShareControl as n, initializeComparativeAdvantageModel as o, producerBMaximum as r, normalizeProductionShares as s, producerAMaximum as t };
