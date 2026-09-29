// Water-molecule hydrogen-bonding geometry learning model.
import "@rchunk/rolldown-runtime";

interface Point { x: number; y: number }
interface WaterMolecule { oxygen: Point; hydrogens: Point[] }
interface NeighborWaterValues { neighborX?: number | null; neighborY?: number | null; neighborAngle?: number | null }

const canvasSize = { width: 720, height: 340 };
const centralOxygen = { x: 270, y: 155 };
const waterHalfAngleDegrees = 52.25;
const defaultNeighborWater = { neighborX: 535, neighborY: 165, neighborAngle: -127.75 };
const neighborBounds = { x: { min: 470, max: 620 }, y: { min: 105, max: 190 }, angle: { min: -180, max: 180 } };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const finiteOr = (value: number | null | undefined, fallback: number): number => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const degreesToRadians = (degrees: number): number => degrees * Math.PI / 180;
const normalizeNeighborWater = (values: NeighborWaterValues) => ({
  neighborX: clamp(finiteOr(values.neighborX, defaultNeighborWater.neighborX), neighborBounds.x.min, neighborBounds.x.max),
  neighborY: clamp(finiteOr(values.neighborY, defaultNeighborWater.neighborY), neighborBounds.y.min, neighborBounds.y.max),
  neighborAngle: clamp(finiteOr(values.neighborAngle, defaultNeighborWater.neighborAngle), neighborBounds.angle.min, neighborBounds.angle.max),
});
const pointAtAngle = (point: Point, angleDegrees: number): Point => ({
  x: clamp(point.x + Math.cos(degreesToRadians(angleDegrees)) * 56, 16, canvasSize.width - 16),
  y: clamp(point.y + Math.sin(degreesToRadians(angleDegrees)) * 56, 16, canvasSize.height - 16),
});
const buildWaterMolecule = (oxygen: Point, angleDegrees: number, bondLength = 90): WaterMolecule => {
  const firstAngle = degreesToRadians(angleDegrees - waterHalfAngleDegrees);
  const secondAngle = degreesToRadians(angleDegrees + waterHalfAngleDegrees);
  return { oxygen, hydrogens: [
    { x: oxygen.x + Math.cos(firstAngle) * bondLength, y: oxygen.y + Math.sin(firstAngle) * bondLength },
    { x: oxygen.x + Math.cos(secondAngle) * bondLength, y: oxygen.y + Math.sin(secondAngle) * bondLength },
  ] };
};
const closestHydrogenBondCandidate = (donor: WaterMolecule, acceptor: WaterMolecule) => {
  const candidates = donor.hydrogens.map((hydrogen) => {
    const covalentX = hydrogen.x - donor.oxygen.x;
    const covalentY = hydrogen.y - donor.oxygen.y;
    const hydrogenBondX = acceptor.oxygen.x - hydrogen.x;
    const hydrogenBondY = acceptor.oxygen.y - hydrogen.y;
    const distance = Math.hypot(hydrogenBondX, hydrogenBondY);
    const alignment = (covalentX * hydrogenBondX + covalentY * hydrogenBondY)
      / Math.max(2 ** -52, Math.hypot(covalentX, covalentY) * distance);
    return { hydrogen, oxygen: acceptor.oxygen, distance, alignment };
  });
  return candidates[0].distance <= candidates[1].distance ? candidates[0] : candidates[1];
};

function deriveWaterHydrogenBondState(values: NeighborWaterValues) {
  const normalized = normalizeNeighborWater(values);
  const central = buildWaterMolecule(centralOxygen, 90);
  const neighbor = buildWaterMolecule({ x: normalized.neighborX, y: normalized.neighborY }, normalized.neighborAngle);
  const candidates = [closestHydrogenBondCandidate(neighbor, central), closestHydrogenBondCandidate(central, neighbor)];
  const candidate = candidates[0].distance <= candidates[1].distance ? candidates[0] : candidates[1];
  const oxygenDistance = Math.hypot(neighbor.oxygen.x - central.oxygen.x, neighbor.oxygen.y - central.oxygen.y);
  const inBondingRange = oxygenDistance >= 165 && oxygenDistance <= 285;
  const aligned = candidate.alignment >= 0.86;
  const bonded = inBondingRange && aligned;
  return {
    ...normalized,
    central,
    neighbor,
    hydrogenBond: bonded ? { hydrogen: candidate.hydrogen, oxygen: candidate.oxygen } : null,
    alignment: bonded ? "bonded" : inBondingRange ? "misaligned" : "too-far",
  };
}

function initializeWaterHydrogenBondingModel(): void {}

export {
  neighborBounds as a,
  initializeWaterHydrogenBondingModel as c,
  waterHalfAngleDegrees as i,
  buildWaterMolecule as l,
  centralOxygen as n,
  deriveWaterHydrogenBondState as o,
  defaultNeighborWater as r,
  pointAtAngle as s,
  canvasSize as t,
  normalizeNeighborWater as u,
};
