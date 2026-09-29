// Aufbau orbital filling with Hund's rule and chromium/copper exceptions.
import "@rchunk/rolldown-runtime";

interface OrbitalDefinition { id: string; shell: number; letter: string; orbitalCount: number; capacity: number }
interface ElementDefinition { symbol: string; name: string }

const orbitalFillingSpecification = { type: "ELECTRON_ORBITAL_FILLING", version: 2, thumbnailAssetKey: "electron-orbital-filling-v1", parameters: { atomicNumber: { kind: "integer" as const, defaultValue: 10, min: 1, max: 36 } } };
const atomicNumberControl = { ...orbitalFillingSpecification.parameters.atomicNumber, step: 1 };
const orbitalDefinitions: OrbitalDefinition[] = [{ id: "1s", shell: 1, letter: "s", orbitalCount: 1, capacity: 2 }, { id: "2s", shell: 2, letter: "s", orbitalCount: 1, capacity: 2 }, { id: "2p", shell: 2, letter: "p", orbitalCount: 3, capacity: 6 }, { id: "3s", shell: 3, letter: "s", orbitalCount: 1, capacity: 2 }, { id: "3p", shell: 3, letter: "p", orbitalCount: 3, capacity: 6 }, { id: "4s", shell: 4, letter: "s", orbitalCount: 1, capacity: 2 }, { id: "3d", shell: 3, letter: "d", orbitalCount: 5, capacity: 10 }, { id: "4p", shell: 4, letter: "p", orbitalCount: 3, capacity: 6 }];
const notationOrder = ["1s", "2s", "2p", "3s", "3p", "3d", "4s", "4p"];
const elements: ElementDefinition[] = [
  ["H", "Hydrogen"], ["He", "Helium"], ["Li", "Lithium"], ["Be", "Beryllium"], ["B", "Boron"], ["C", "Carbon"], ["N", "Nitrogen"], ["O", "Oxygen"], ["F", "Fluorine"], ["Ne", "Neon"], ["Na", "Sodium"], ["Mg", "Magnesium"], ["Al", "Aluminum"], ["Si", "Silicon"], ["P", "Phosphorus"], ["S", "Sulfur"], ["Cl", "Chlorine"], ["Ar", "Argon"], ["K", "Potassium"], ["Ca", "Calcium"], ["Sc", "Scandium"], ["Ti", "Titanium"], ["V", "Vanadium"], ["Cr", "Chromium"], ["Mn", "Manganese"], ["Fe", "Iron"], ["Co", "Cobalt"], ["Ni", "Nickel"], ["Cu", "Copper"], ["Zn", "Zinc"], ["Ga", "Gallium"], ["Ge", "Germanium"], ["As", "Arsenic"], ["Se", "Selenium"], ["Br", "Bromine"], ["Kr", "Krypton"]
].map(([symbol, name]) => ({ symbol, name }));
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeAtomicNumber = (value: number | null | undefined): number => clamp(Math.round(typeof value === "number" && Number.isFinite(value) ? value : atomicNumberControl.defaultValue), atomicNumberControl.min, atomicNumberControl.max);
const elementForAtomicNumber = (value: number | null | undefined) => { const atomicNumber = normalizeAtomicNumber(value); const element = elements[atomicNumber - 1]; return { atomicNumber, symbol: element.symbol, name: element.name }; };
const orbitalArrows = (electronCount: number, orbitalCount: number) => Array.from({ length: orbitalCount }, (_, index) => ({ up: index < electronCount, down: index < electronCount - orbitalCount }));
const orbitalFilling = (value: number | null | undefined) => { const atomicNumber = normalizeAtomicNumber(value); let remaining = atomicNumber; const counts = new Map<string, number>(); for (const orbital of orbitalDefinitions) { const electrons = Math.min(remaining, orbital.capacity); counts.set(orbital.id, electrons); remaining -= electrons; } if (atomicNumber === 24) { counts.set("4s", 1); counts.set("3d", 5); } else if (atomicNumber === 29) { counts.set("4s", 1); counts.set("3d", 10); } return orbitalDefinitions.map((orbital) => { const electrons = counts.get(orbital.id) ?? 0; return { ...orbital, electrons, orbitals: orbitalArrows(electrons, orbital.orbitalCount) }; }); };
const orderedOrbitalFilling = (value: number | null | undefined) => { const filling = orbitalFilling(value); return notationOrder.map((id) => filling.find((orbital) => orbital.id === id)!); };
const superscripts: Record<string, string> = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const electronConfiguration = (value: number | null | undefined): string => orderedOrbitalFilling(value).filter(({ electrons }) => electrons > 0).map(({ id, electrons }) => `${id}${String(electrons).split("").map((digit) => superscripts[digit]).join("")}`).join(" ");
const gainedOrbital = (value: number | null | undefined): string => { const atomicNumber = normalizeAtomicNumber(value); if (atomicNumber === atomicNumberControl.min) return "1s"; const current = orbitalFilling(atomicNumber); const previous = orbitalFilling(atomicNumber - 1); return current.map((orbital, index) => ({ id: orbital.id, gain: orbital.electrons - previous[index].electrons })).filter(({ gain }) => gain > 0).sort((left, right) => right.gain - left.gain)[0]?.id ?? "1s"; };

function initializeOrbitalFillingSpecification(): void {}
function initializeOrbitalFillingModel(): void {}

export { elementForAtomicNumber as a, initializeOrbitalFillingSpecification as c, orderedOrbitalFilling as i, orbitalFillingSpecification as l, electronConfiguration as n, initializeOrbitalFillingModel as o, gainedOrbital as r, normalizeAtomicNumber as s, atomicNumberControl as t };
