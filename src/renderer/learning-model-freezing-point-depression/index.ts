// Colligative freezing-point depression and its phase-diagram shift.
import "@rchunk/rolldown-runtime";

type Solvent = "water" | "benzene" | "cyclohexane";
interface FreezingPointValues { solvent?: unknown; molality?: number | null; particles?: number | null }

const freezingPointSpecification = {
  type: "FREEZING_POINT_DEPRESSION", version: 2, thumbnailAssetKey: "freezing-point-depression-v1", canonicalFormula: "\\Delta T_f = iK_fm",
  parameters: { solvent: { kind: "enum" as const, defaultValue: "water" as Solvent, allowedValues: ["water", "benzene", "cyclohexane"] as Solvent[] } },
};
const molalityControl = { min: 0, max: 0.5, step: 0.05, defaultValue: 0.25 };
const particleControl = { min: 1, max: 3, step: 1, defaultValue: 2 };
const solventProperties: Record<Solvent, { pureFreezingC: number; cryoscopicConstant: number }> = { water: { pureFreezingC: 0, cryoscopicConstant: 1.86 }, benzene: { pureFreezingC: 5.5, cryoscopicConstant: 5.12 }, cyclohexane: { pureFreezingC: 6.5, cryoscopicConstant: 20.1 } };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const isSolvent = (value: unknown): value is Solvent => value === "water" || value === "benzene" || value === "cyclohexane";
const linearSamples = (start: number, end: number, count: number): number[] => Array.from({ length: count }, (_, index) => start + (end - start) * index / (count - 1));
const normalizeFreezingPointValues = (values: FreezingPointValues) => ({
  solvent: isSolvent(values.solvent) ? values.solvent : freezingPointSpecification.parameters.solvent.defaultValue,
  molality: typeof values.molality === "number" && Number.isFinite(values.molality) ? clamp(values.molality, molalityControl.min, molalityControl.max) : molalityControl.defaultValue,
  particles: typeof values.particles === "number" && Number.isFinite(values.particles) ? clamp(Math.round(values.particles), particleControl.min, particleControl.max) : particleControl.defaultValue,
});
const calculateFreezingPointDepression = (values: FreezingPointValues) => {
  const normalized = normalizeFreezingPointValues(values);
  const { pureFreezingC, cryoscopicConstant } = solventProperties[normalized.solvent];
  const particleMolality = normalized.particles * normalized.molality;
  const depressionC = cryoscopicConstant * particleMolality;
  return { ...normalized, pureFreezingC, cryoscopicConstant, particleMolality, depressionC, solutionFreezingC: pureFreezingC - depressionC, maxDepressionC: cryoscopicConstant * particleControl.max * molalityControl.max };
};
const buildFreezingPointPhaseDiagram = (result: ReturnType<typeof calculateFreezingPointDepression>) => {
  const pressureMin = 0.05;
  const pureTriplePressure = 0.19;
  const xMin = result.pureFreezingC - result.maxDepressionC - 3;
  const xMax = result.pureFreezingC + Math.max(5, result.maxDepressionC * 0.7);
  const pressureScale = Math.max(0.72, result.maxDepressionC * 0.055);
  const direction = result.solvent === "water" ? -1 : 1;
  const pureTripleX = result.pureFreezingC + direction * -0.81 * pressureScale;
  const curveScale = Math.max(2.6, result.maxDepressionC * 0.36);
  const sublimationPressure = (temperature: number): number => pressureMin + 0.14 * Math.exp((temperature - pureTripleX) / curveScale);
  let solutionTripleX = result.solutionFreezingC + direction * -0.81 * pressureScale;
  for (let iteration = 0; iteration < 8; iteration += 1) solutionTripleX = result.solutionFreezingC + direction * (sublimationPressure(solutionTripleX) - 1) * pressureScale;
  const solutionTriplePressure = sublimationPressure(solutionTripleX);
  const depressionRatio = result.depressionC / result.maxDepressionC;
  const pureTopX = result.pureFreezingC + direction * 0.17 * pressureScale;
  const solutionTopX = result.solutionFreezingC + direction * 0.17 * pressureScale;
  const sublimation = linearSamples(xMin, pureTripleX, 42).map((x) => ({ x, y: sublimationPressure(x) }));
  const solidBoundary = [...sublimation.filter(({ x }) => x < solutionTripleX), { x: solutionTripleX, y: solutionTriplePressure }];
  const pureVapor = linearSamples(pureTripleX, xMax, 42).map((x) => { const progress = (x - pureTripleX) / (xMax - pureTripleX); return { x, y: pureTriplePressure + 0.33 * progress + 0.11 * progress ** 2 }; });
  const solutionVapor = linearSamples(solutionTripleX, xMax, 42).map((x) => { const progress = (x - solutionTripleX) / (xMax - solutionTripleX); return { x, y: solutionTriplePressure + (0.31 - 0.09 * depressionRatio) * progress + (0.09 - 0.04 * depressionRatio) * progress ** 2 }; });
  return { xMin, xMax, pressureMin, pressureMax: 1.17, fixedPressure: 1, pureTriple: { x: pureTripleX, y: pureTriplePressure }, solutionTriple: { x: solutionTripleX, y: solutionTriplePressure }, pureTopX, solutionTopX, sublimation, solidBoundary, pureVapor, solutionVapor };
};

function initializeFreezingPointSpecification(): void {}
function initializeFreezingPointModel(): void {}

export { initializeFreezingPointModel as a, freezingPointSpecification as c, buildFreezingPointPhaseDiagram as i, particleControl as n, normalizeFreezingPointValues as o, calculateFreezingPointDepression as r, initializeFreezingPointSpecification as s, molalityControl as t };
