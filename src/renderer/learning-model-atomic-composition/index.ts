// Atomic composition from proton, neutron, and electron counts.
import "@rchunk/rolldown-runtime";

type Particle = "protons" | "neutrons" | "electrons";
interface ParticleControl { min: number; max: number; step: number; defaultValue: number }
interface AtomicCompositionValues { protons?: number | null; neutrons?: number | null; electrons?: number | null }

const particleControls: Record<Particle, ParticleControl> = {
  protons: { min: 1, max: 10, step: 1, defaultValue: 6 },
  neutrons: { min: 0, max: 12, step: 1, defaultValue: 6 },
  electrons: { min: 0, max: 10, step: 1, defaultValue: 6 },
};
const defaultAtomicComposition = { protons: particleControls.protons.defaultValue, neutrons: particleControls.neutrons.defaultValue, electrons: particleControls.electrons.defaultValue };
const elements = [
  { atomicNumber: 1, name: "Hydrogen", symbol: "H" }, { atomicNumber: 2, name: "Helium", symbol: "He" },
  { atomicNumber: 3, name: "Lithium", symbol: "Li" }, { atomicNumber: 4, name: "Beryllium", symbol: "Be" },
  { atomicNumber: 5, name: "Boron", symbol: "B" }, { atomicNumber: 6, name: "Carbon", symbol: "C" },
  { atomicNumber: 7, name: "Nitrogen", symbol: "N" }, { atomicNumber: 8, name: "Oxygen", symbol: "O" },
  { atomicNumber: 9, name: "Fluorine", symbol: "F" }, { atomicNumber: 10, name: "Neon", symbol: "Ne" },
];
const normalizeParticleCount = (value: number | null | undefined, control: ParticleControl): number => Number.isFinite(value) ? Math.min(control.max, Math.max(control.min, Math.round(value ?? 0))) : control.defaultValue;
const normalizeAtomicComposition = (values: AtomicCompositionValues) => ({
  protons: normalizeParticleCount(values.protons, particleControls.protons),
  neutrons: normalizeParticleCount(values.neutrons, particleControls.neutrons),
  electrons: normalizeParticleCount(values.electrons, particleControls.electrons),
});
const updateParticleCount = (values: AtomicCompositionValues, particle: Particle, value: number) => {
  const normalized = normalizeAtomicComposition(values);
  return particle === "protons" ? { ...normalized, protons: normalizeParticleCount(value, particleControls.protons) } : particle === "electrons" ? { ...normalized, electrons: normalizeParticleCount(value, particleControls.electrons) } : { ...normalized, neutrons: normalizeParticleCount(value, particleControls.neutrons) };
};
const formattedCharge = (charge: number): string => charge > 0 ? `+${charge}` : `${charge}`;
const calculateAtomicComposition = (values: AtomicCompositionValues) => {
  const normalized = normalizeAtomicComposition(values);
  const netCharge = normalized.protons - normalized.electrons;
  return { values: normalized, element: elements[normalized.protons - 1] ?? elements[defaultAtomicComposition.protons - 1], massNumber: normalized.protons + normalized.neutrons, netCharge, chargeKind: netCharge === 0 ? "neutral" : netCharge > 0 ? "positive" : "negative", chargeValue: formattedCharge(netCharge) };
};

function initializeAtomicCompositionModel(): void {}

export { normalizeAtomicComposition as a, initializeAtomicCompositionModel as i, particleControls as n, updateParticleCount as o, calculateAtomicComposition as r, defaultAtomicComposition as t };
