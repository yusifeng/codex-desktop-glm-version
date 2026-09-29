// Linear-programming shadow-price learning model.
import "@rchunk/rolldown-runtime";

interface ShadowPriceValues { resourceLimit?: number | null }
interface LinearConstraint { a: number; b: number; c: number }
interface Point { x: number; y: number }
interface Viewport { xMin: number; xMax: number; yMin: number; yMax: number }

const shadowPriceType = "SHADOW_PRICE";
const shadowPriceThumbnail = "shadow-price-v1";
const shadowPriceFormula = "P = 3x + 4y";
const shadowPriceParameters = { resourceLimit: { kind: "number", defaultValue: 12, min: 8, max: 18 } };
const shadowPriceDefinition = { type: shadowPriceType, version: 1, thumbnailAssetKey: shadowPriceThumbnail, canonicalFormula: shadowPriceFormula, parameters: shadowPriceParameters };
const resourceLimitControl = { min: shadowPriceDefinition.parameters.resourceLimit.min, max: shadowPriceDefinition.parameters.resourceLimit.max, step: 1, defaultValue: shadowPriceDefinition.parameters.resourceLimit.defaultValue };
const fixedConstraint: LinearConstraint = { a: 2, b: 1, c: 12 };
const objectiveCoefficients = { x: 3, y: 4 };
const constantShadowPrice = 5 / 3;
const tolerance = 1e-9;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const normalizeResourceLimit = (value: number | null | undefined): number => Number.isFinite(value) ? clamp(value ?? resourceLimitControl.defaultValue, resourceLimitControl.min, resourceLimitControl.max) : resourceLimitControl.defaultValue;
const normalizeShadowPriceValues = (values: ShadowPriceValues) => ({ resourceLimit: normalizeResourceLimit(values.resourceLimit) });
const intersectConstraints = (first: LinearConstraint, second: LinearConstraint): Point | null => {
  const determinant = first.a * second.b - second.a * first.b;
  return Math.abs(determinant) <= tolerance ? null : { x: (first.c * second.b - second.c * first.b) / determinant, y: (first.a * second.c - second.a * first.c) / determinant };
};
const isFeasible = (point: Point, resourceLimit: number): boolean => point.x >= -tolerance && point.y >= -tolerance && fixedConstraint.a * point.x + fixedConstraint.b * point.y <= fixedConstraint.c + tolerance && point.x + 2 * point.y <= resourceLimit + tolerance;
const uniquePoints = (points: Point[]): Point[] => points.filter((point, index) => points.findIndex((candidate) => Math.abs(candidate.x - point.x) <= tolerance && Math.abs(candidate.y - point.y) <= tolerance) === index);
const feasibleVertices = (resourceLimit: number): Point[] => {
  const boundaries: LinearConstraint[] = [{ a: 1, b: 0, c: 0 }, { a: 0, b: 1, c: 0 }, fixedConstraint, { a: 1, b: 2, c: resourceLimit }];
  const candidates: Point[] = [];
  boundaries.forEach((first, index) => boundaries.slice(index + 1).forEach((second) => {
    const point = intersectConstraints(first, second);
    if (point && isFeasible(point, resourceLimit)) candidates.push({ x: Math.abs(point.x) <= tolerance ? 0 : point.x, y: Math.abs(point.y) <= tolerance ? 0 : point.y });
  }));
  const points = uniquePoints(candidates);
  const center = points.reduce((sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }), { x: 0, y: 0 });
  return points.sort((first, second) => Math.atan2(first.y - center.y, first.x - center.x) - Math.atan2(second.y - center.y, second.x - center.x));
};
const objectiveValue = (point: Point): number => objectiveCoefficients.x * point.x + objectiveCoefficients.y * point.y;

function deriveShadowPriceState(values: ShadowPriceValues) {
  const { resourceLimit } = normalizeShadowPriceValues(values);
  const vertices = feasibleVertices(resourceLimit);
  const optimum = vertices.reduce((best, point) => objectiveValue(point) > objectiveValue(best) ? point : best);
  return { resourceLimit, feasibleVertices: vertices, optimum, maximumProfit: objectiveValue(optimum), shadowPrice: constantShadowPrice };
}

const clipConstraintToViewport = (constraint: LinearConstraint, viewport: Viewport) => {
  const candidates: Point[] = [];
  if (Math.abs(constraint.b) > tolerance) {
    for (const x of [viewport.xMin, viewport.xMax]) {
      const y = (constraint.c - constraint.a * x) / constraint.b;
      if (y >= viewport.yMin - tolerance && y <= viewport.yMax + tolerance) candidates.push({ x, y: clamp(y, viewport.yMin, viewport.yMax) });
    }
  }
  if (Math.abs(constraint.a) > tolerance) {
    for (const y of [viewport.yMin, viewport.yMax]) {
      const x = (constraint.c - constraint.b * y) / constraint.a;
      if (x >= viewport.xMin - tolerance && x <= viewport.xMax + tolerance) candidates.push({ x: clamp(x, viewport.xMin, viewport.xMax), y });
    }
  }
  const points = uniquePoints(candidates);
  return points.length < 2 ? null : { from: points[0], to: points[1] };
};

function initializeShadowPriceSchema(): void {}
function initializeShadowPriceModel(): void {}

export {
  clipConstraintToViewport as a,
  initializeShadowPriceSchema as c,
  deriveShadowPriceState as i,
  shadowPriceDefinition as l,
  objectiveCoefficients as n,
  initializeShadowPriceModel as o,
  resourceLimitControl as r,
  normalizeShadowPriceValues as s,
  fixedConstraint as t,
};
