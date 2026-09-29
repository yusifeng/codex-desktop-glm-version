// Poisson-distribution learning model. Release chunk: model-253b6086c636.js.
import "@rchunk/rolldown-runtime";

interface PoissonValues { lambda?: number | null; count?: number | null; question?: number | null }
interface PoissonManifest { type: string; version: number; thumbnailAssetKey: string; canonicalFormula: string; parameters: { lambda: { kind: "number"; defaultValue: number; min: number; max: number }; count: { kind: "integer"; defaultValue: number; min: number; max: number } } }
type ProbabilityFormat = { relation: "<" | ">" | "="; value: number; maximumFractionDigits: number };

let poissonManifest: PoissonManifest;
let lambdaControl: { min: number; max: number; step: number; defaultValue: number };
let countControl: { min: number; max: number; step: number; defaultValue: number };
let questionControl: { min: number; max: number; step: number; defaultValue: number };
let normalizePoissonValues: (values: PoissonValues) => { lambda: number; count: number; question: number };
let formatProbability: (probability: number) => ProbabilityFormat;
let calculatePoissonDistribution: (values: PoissonValues) => { lambda: number; count: number; question: number; exactProbability: number; atMostProbability: number; atLeastProbability: number; tailProbability: number; selectedProbability: number; modeCounts: number[]; outcomes: Array<{ count: number; probability: number; probabilityPercent: number; included: boolean; isMode: boolean }> };
let manifestInitialized = false; let modelInitialized = false;
function initializePoissonManifest(): void { if (manifestInitialized) return; manifestInitialized = true; poissonManifest = { type: "POISSON_DISTRIBUTION", version: 2, thumbnailAssetKey: "poisson-distribution-v1", canonicalFormula: "P(X=k)=\\frac{e^{-\\lambda}\\lambda^k}{k!}", parameters: { lambda: { kind: "number", defaultValue: 5, min: 0.5, max: 20 }, count: { kind: "integer", defaultValue: 5, min: 0, max: 40 } } }; }
function initializePoissonModel(): void {
  if (modelInitialized) return; modelInitialized = true; initializePoissonManifest();
  const lambda = poissonManifest.parameters.lambda; const count = poissonManifest.parameters.count;
  lambdaControl = { min: lambda.min, max: lambda.max, step: 0.1, defaultValue: lambda.defaultValue }; countControl = { min: count.min, max: count.max, step: 1, defaultValue: count.defaultValue }; questionControl = { min: 0, max: 2, step: 1, defaultValue: 0 };
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max); const finite = (value: number | null | undefined, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
  normalizePoissonValues = values => ({ lambda: clamp(finite(values.lambda, lambdaControl.defaultValue), lambdaControl.min, lambdaControl.max), count: Math.round(clamp(finite(values.count, countControl.defaultValue), countControl.min, countControl.max)), question: Math.round(clamp(finite(values.question, questionControl.defaultValue), questionControl.min, questionControl.max)) });
  formatProbability = probability => probability > 0 && probability < 1e-8 ? { relation: "<", value: 1e-8, maximumFractionDigits: 6 } : probability < 1 && probability > 0.9999 ? { relation: ">", value: 0.9999, maximumFractionDigits: 2 } : { relation: "=", value: probability, maximumFractionDigits: probability * 100 < 0.01 ? 4 : probability * 100 < 1 ? 2 : 1 };
  calculatePoissonDistribution = values => {
    const normalized = normalizePoissonValues(values); const probabilities = [Math.exp(-normalized.lambda)];
    for (let outcome = 1; outcome <= countControl.max; outcome += 1) probabilities.push((probabilities[outcome - 1] ?? 0) * normalized.lambda / outcome);
    const tailProbability = Math.max(0, 1 - probabilities.reduce((sum, probability) => sum + probability, 0)); const exactProbability = probabilities[normalized.count] ?? 0; const atMostProbability = probabilities.slice(0, normalized.count + 1).reduce((sum, probability) => sum + probability, 0); const atLeastProbability = Math.min(1, probabilities.slice(normalized.count).reduce((sum, probability) => sum + probability, tailProbability)); const selectedProbability = normalized.question === 0 ? exactProbability : normalized.question === 1 ? atMostProbability : atLeastProbability; const floor = Math.floor(normalized.lambda); const modeCounts = Number.isInteger(normalized.lambda) ? [floor - 1, floor] : [floor];
    return { ...normalized, exactProbability, atMostProbability, atLeastProbability, tailProbability, selectedProbability, modeCounts, outcomes: probabilities.map((probability, outcome) => ({ count: outcome, probability, probabilityPercent: probability * 100, included: normalized.question === 0 ? outcome === normalized.count : normalized.question === 1 ? outcome <= normalized.count : outcome >= normalized.count, isMode: modeCounts.includes(outcome) })) };
  };
}
export { formatProbability as a, initializePoissonManifest as c, calculatePoissonDistribution as i, poissonManifest as l, lambdaControl as n, initializePoissonModel as o, questionControl as r, normalizePoissonValues as s, countControl as t };
