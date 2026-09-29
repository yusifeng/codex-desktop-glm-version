// Rolle's theorem learning model with equal endpoints and a stationary vertex.
import "@rchunk/rolldown-runtime";

interface RolleValues { leftX?: number | null; rightX?: number | null; endpointY?: number | null; vertexOffset?: number | null }

const rollesTheoremType = "ROLLES_THEOREM";
const rollesTheoremThumbnail = "rolles-theorem-v1";
const rollesTheoremFormula = "f(a)=f(b)\\implies\\exists\\,c\\in(a,b):f'(c)=0";
const rollesTheoremParameters = { endpointY: { kind: "number", defaultValue: -2, min: -10, max: 10 }, vertexOffset: { kind: "number", defaultValue: 6, min: -10, max: 10 } };
const rollesTheoremDefinition = { type: rollesTheoremType, version: 1, thumbnailAssetKey: rollesTheoremThumbnail, canonicalFormula: rollesTheoremFormula, parameters: rollesTheoremParameters };
const minimumEndpointSeparation = 2;
const xBounds = { min: -10, max: 10 };
const minimumViewportSpan = 8;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const finiteOr = (value: number | null | undefined, fallback: number): number => Number.isFinite(value) ? Number(value) : fallback;
const expandRange = (minimum: number, maximum: number, span: number): [number, number] => {
  if (maximum - minimum >= span) return [minimum, maximum];
  const center = (minimum + maximum) / 2;
  return [center - span / 2, center + span / 2];
};
const defaultRolleValues = { leftX: -4, rightX: 4, endpointY: rollesTheoremDefinition.parameters.endpointY.defaultValue, vertexOffset: rollesTheoremDefinition.parameters.vertexOffset.defaultValue };

function normalizeRolleValues(values: RolleValues) {
  const firstX = clamp(finiteOr(values.leftX, defaultRolleValues.leftX), xBounds.min, xBounds.max);
  const secondX = clamp(finiteOr(values.rightX, defaultRolleValues.rightX), xBounds.min, xBounds.max);
  let leftX = Math.min(firstX, secondX);
  let rightX = Math.max(firstX, secondX);
  if (rightX - leftX < minimumEndpointSeparation) {
    const center = (leftX + rightX) / 2;
    leftX = clamp(center - minimumEndpointSeparation / 2, xBounds.min, xBounds.max - minimumEndpointSeparation);
    rightX = leftX + minimumEndpointSeparation;
  }
  return {
    leftX, rightX,
    endpointY: clamp(finiteOr(values.endpointY, defaultRolleValues.endpointY), rollesTheoremDefinition.parameters.endpointY.min, rollesTheoremDefinition.parameters.endpointY.max),
    vertexOffset: clamp(finiteOr(values.vertexOffset, defaultRolleValues.vertexOffset), rollesTheoremDefinition.parameters.vertexOffset.min, rollesTheoremDefinition.parameters.vertexOffset.max),
  };
}

function deriveRolleTheoremState(values: RolleValues) {
  const normalized = normalizeRolleValues(values);
  const centerX = (normalized.leftX + normalized.rightX) / 2;
  const halfWidth = (normalized.rightX - normalized.leftX) / 2;
  const vertexY = normalized.endpointY + normalized.vertexOffset;
  const xPadding = Math.max(1.5, halfWidth * 0.35);
  const yPadding = Math.max(1.5, Math.abs(normalized.vertexOffset) * 0.28);
  const [xMin, xMax] = expandRange(normalized.leftX - xPadding, normalized.rightX + xPadding, minimumViewportSpan);
  const [yMin, yMax] = expandRange(Math.min(normalized.endpointY, vertexY) - yPadding, Math.max(normalized.endpointY, vertexY) + yPadding, minimumViewportSpan);
  return { values: normalized, centerX, halfWidth, vertexY, pointA: { x: normalized.leftX, y: normalized.endpointY }, pointB: { x: normalized.rightX, y: normalized.endpointY }, stationaryPoint: { x: centerX, y: vertexY }, viewport: { xMin, xMax, yMin, yMax } };
}
const formatRolleValue = (value: number): string => Number(value.toFixed(2)).toString();

function initializeRolleTheoremSchema(): void {}
function initializeRolleTheoremModel(): void {}

export {
  normalizeRolleValues as a,
  initializeRolleTheoremModel as i,
  deriveRolleTheoremState as n,
  initializeRolleTheoremSchema as o,
  formatRolleValue as r,
  rollesTheoremDefinition as s,
  defaultRolleValues as t,
};
