// Morse-potential curves for single, double, and triple covalent bonds.
import "@rchunk/rolldown-runtime";

type BondOrder = "single" | "double" | "triple";
interface BondEnergyValues { bond_order?: string | null; distance?: number | null }
interface BondProperties { depth: number; equilibrium: number; steepness: number; color: string }

const bondOrders: BondOrder[] = ["single", "double", "triple"];
const bondProperties: Record<BondOrder, BondProperties> = {
  single: { depth: 0.9, equilibrium: 1.55, steepness: 1.5, color: "var(--learning-block-color-primary)" },
  double: { depth: 1.35, equilibrium: 1.3, steepness: 1.8, color: "var(--learning-block-color-secondary)" },
  triple: { depth: 1.8, equilibrium: 1.1, steepness: 3, color: "color-mix(in srgb, var(--learning-block-color-third) 84%, var(--text-primary))" },
};
const bondDistanceControl = { variable: "Distance", min: 0.8, max: 4.2, step: 0.05 };
const equilibriumTolerance = 0.04;
const separatedResidualThreshold = 0.06;
const clamp = (value: number, minimum: number, maximum: number): number => Math.max(minimum, Math.min(maximum, value));
const isBondOrder = (value: unknown): value is BondOrder => bondOrders.some((order) => order === value);
const normalizeBondEnergyValues = (values: BondEnergyValues) => ({
  bond_order: isBondOrder(values.bond_order) ? values.bond_order : "single" as BondOrder,
  distance: Number.isFinite(values.distance) ? clamp(values.distance ?? bondDistanceControl.min, bondDistanceControl.min, bondDistanceControl.max) : bondProperties.single.equilibrium,
});
const bondEnergy = (distance: number, order: BondOrder): number => {
  const { depth, equilibrium, steepness } = bondProperties[order];
  return depth * ((1 - Math.exp(-steepness * (distance - equilibrium))) ** 2 - 1);
};
const bondEnergyCurve = (order: BondOrder) => Array.from({ length: 181 }, (_unused, index) => {
  const distance = bondDistanceControl.min + index / 180 * (bondDistanceControl.max - bondDistanceControl.min);
  return { x: distance, y: bondEnergy(distance, order) };
});
const calculateBondEnergy = (values: BondEnergyValues) => {
  const normalized = normalizeBondEnergyValues(values);
  const bond = bondProperties[normalized.bond_order];
  const energy = bondEnergy(normalized.distance, normalized.bond_order);
  const distanceRatio = normalized.distance / bond.equilibrium;
  const residualFraction = Math.max(0, -energy / bond.depth);
  const regime = Math.abs(distanceRatio - 1) <= equilibriumTolerance ? "equilibrium" : distanceRatio < 1 ? "repulsive" : residualFraction <= separatedResidualThreshold ? "separated" : "attractive";
  return { ...normalized, bond, energy, regime, residualFraction };
};

function initializeCovalentBondEnergyModel(): void {}

export { bondEnergy as a, normalizeBondEnergyValues as c, calculateBondEnergy as i, bondOrders as n, bondEnergyCurve as o, bondDistanceControl as r, initializeCovalentBondEnergyModel as s, bondProperties as t };
