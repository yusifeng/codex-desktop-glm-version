// Transversal angle-relationship learning model for parallel lines.
import "@rchunk/rolldown-runtime";

interface TransversalValues { angleDeg?: number | null; handleX?: number | null; handleY?: number | null; relationshipIndex?: number | null }

const angleRelationships = [
  { index: 0, label: "Corresponding", outcome: "equal" },
  { index: 1, label: "Alternate interior", outcome: "equal" },
  { index: 2, label: "Alternate exterior", outcome: "equal" },
  { index: 3, label: "Same-side interior", outcome: "supplementary" },
] as const;
const angleControl = { min: 25, max: 155, step: 1, defaultValue: 62 };
const relationshipIndexControl = { min: 0, max: angleRelationships.length - 1, step: 1, defaultValue: 0 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const finiteCoordinate = (value: number | null | undefined): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const normalizeAngle = (value: number | null | undefined): number => {
  const angle = typeof value === "number" && Number.isFinite(value) ? value : angleControl.defaultValue;
  return clamp(Math.round(angle / angleControl.step) * angleControl.step, angleControl.min, angleControl.max);
};
const normalizeRelationshipIndex = (value: number | null | undefined): number => {
  const index = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : relationshipIndexControl.defaultValue;
  return clamp(index, relationshipIndexControl.min, relationshipIndexControl.max);
};
const normalizeTransversalValues = (values: TransversalValues) => ({
  angleDeg: normalizeAngle(values.angleDeg),
  handleX: finiteCoordinate(values.handleX),
  handleY: finiteCoordinate(values.handleY),
  relationshipIndex: normalizeRelationshipIndex(values.relationshipIndex),
});
const getAngleRelationship = (index: number) => angleRelationships[index];

function calculateTransversalAnglePair(values: TransversalValues) {
  const normalized = normalizeTransversalValues(values);
  const relationship = getAngleRelationship(normalized.relationshipIndex);
  const angle = normalized.angleDeg;
  const supplement = 180 - angle;
  if (relationship.outcome === "supplementary") {
    return { ...normalized, relationship, pair: [supplement, angle], equation: `${supplement}° + ${angle}° = 180°` };
  }
  const pairedAngle = relationship.index === 0 ? angle : supplement;
  return { ...normalized, relationship, pair: [pairedAngle, pairedAngle], equation: `${pairedAngle}° = ${pairedAngle}°` };
}

function initializeTransversalAngleRelationshipsModel(): void {}

export {
  normalizeAngle as a,
  calculateTransversalAnglePair as c,
  initializeTransversalAngleRelationshipsModel as i,
  relationshipIndexControl as n,
  normalizeRelationshipIndex as o,
  angleRelationships as r,
  normalizeTransversalValues as s,
  angleControl as t,
};
