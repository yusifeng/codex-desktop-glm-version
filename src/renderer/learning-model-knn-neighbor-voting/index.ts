// K-nearest-neighbor classification by Euclidean neighbor voting.
import "@rchunk/rolldown-runtime";

type ClassName = "a" | "b";
interface KnnValues { k?: number | null; queryX?: number | null; queryY?: number | null }
interface KnnPoint { id: string; x: number; y: number; className: ClassName }

const knnType = "KNN_NEIGHBOR_VOTING";
const knnThumbnail = "knn-neighbor-voting-v1";
const knnParameters = { k: { kind: "integer" as const, defaultValue: 5, min: 1, max: 9 }, queryX: { kind: "number" as const, defaultValue: 5.2, min: 0, max: 10 }, queryY: { kind: "number" as const, defaultValue: 3.3, min: 0, max: 10 } };
const knnSpecification = { type: knnType, version: 1, thumbnailAssetKey: knnThumbnail, parameters: knnParameters };
const knnBounds = { xMin: knnSpecification.parameters.queryX.min, xMax: knnSpecification.parameters.queryX.max, yMin: knnSpecification.parameters.queryY.min, yMax: knnSpecification.parameters.queryY.max };
const kControl = { min: knnSpecification.parameters.k.min, max: knnSpecification.parameters.k.max, step: 1 };
const trainingPoints: KnnPoint[] = [
  { id: "a1", x: 1.4, y: 2, className: "a" }, { id: "a2", x: 2.5, y: 3.1, className: "a" }, { id: "a3", x: 1.9, y: 5.1, className: "a" }, { id: "a4", x: 3.6, y: 4.3, className: "a" },
  { id: "a5", x: 4.2, y: 6, className: "a" }, { id: "a6", x: 3.1, y: 7.7, className: "a" }, { id: "a7", x: 5, y: 5.2, className: "a" }, { id: "a8", x: 4.6, y: 2.3, className: "a" },
  { id: "b1", x: 8.4, y: 2, className: "b" }, { id: "b2", x: 7.2, y: 3.1, className: "b" }, { id: "b3", x: 8.1, y: 4.9, className: "b" }, { id: "b4", x: 6.5, y: 5, className: "b" },
  { id: "b5", x: 6.1, y: 6.8, className: "b" }, { id: "b6", x: 7.5, y: 7.6, className: "b" }, { id: "b7", x: 5.4, y: 4.5, className: "b" }, { id: "b8", x: 6.2, y: 2, className: "b" },
];
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const finiteOrDefault = (value: number | null | undefined, defaultValue: number, minimum: number, maximum: number): number => clamp(Number.isFinite(value) ? value ?? defaultValue : defaultValue, minimum, maximum);
const defaultKnnValues = { k: knnSpecification.parameters.k.defaultValue, queryX: knnSpecification.parameters.queryX.defaultValue, queryY: knnSpecification.parameters.queryY.defaultValue };
const initialKnnValues = { ...defaultKnnValues };
const normalizeKnnValues = (values: KnnValues) => ({ k: Math.round(finiteOrDefault(values.k, defaultKnnValues.k, knnSpecification.parameters.k.min, knnSpecification.parameters.k.max)), queryX: finiteOrDefault(values.queryX, defaultKnnValues.queryX, knnBounds.xMin, knnBounds.xMax), queryY: finiteOrDefault(values.queryY, defaultKnnValues.queryY, knnBounds.yMin, knnBounds.yMax) });
const classifyKnn = (query: { x: number; y: number }, k: number, points: KnnPoint[] = trainingPoints) => {
  const neighborCount = clamp(Math.round(k), 1, points.length);
  const neighbors = points.map((point) => ({ ...point, distanceSquared: (point.x - query.x) ** 2 + (point.y - query.y) ** 2 })).sort((left, right) => left.distanceSquared - right.distanceSquared || left.id.localeCompare(right.id)).slice(0, neighborCount);
  const votes = neighbors.reduce((counts, point) => { counts[point.className] += 1; return counts; }, { a: 0, b: 0 });
  return { neighbors, votes, winner: votes.a === votes.b ? "tie" : votes.a > votes.b ? "a" : "b", radius: Math.sqrt(neighbors.at(-1)?.distanceSquared ?? 0) };
};

function initializeKnnSpecification(): void {}
function initializeKnnModel(): void {}

export { classifyKnn as a, initializeKnnSpecification as c, trainingPoints as i, knnSpecification as l, knnBounds as n, initializeKnnModel as o, kControl as r, normalizeKnnValues as s, initialKnnValues as t };
