// Molecular-orbital filling and bond-order learning model.
import "@rchunk/rolldown-runtime";

type Molecule = "H2" | "He2" | "Li2" | "Be2" | "B2" | "C2" | "N2" | "O2" | "F2" | "Ne2";
interface MolecularOrbitalValues { initial_molecule?: unknown }
interface OrbitalOccupation { up: boolean; down: boolean }
type OrbitalKind = "bonding" | "antibonding";

const molecularOrbitalType = "MOLECULAR_ORBITAL_DIAGRAM";
const molecularOrbitalThumbnail = "molecular-orbital-diagram-v1";
const molecules: Molecule[] = ["H2", "He2", "Li2", "Be2", "B2", "C2", "N2", "O2", "F2", "Ne2"];
const molecularOrbitalParameters = { initial_molecule: { kind: "enum", defaultValue: "O2" as Molecule, allowedValues: molecules } };
const molecularOrbitalDefinition = { type: molecularOrbitalType, version: 3, thumbnailAssetKey: molecularOrbitalThumbnail, parameters: molecularOrbitalParameters };
const valenceElectronsPerAtom: Record<Molecule, number> = { H2: 1, He2: 2, Li2: 1, Be2: 2, B2: 3, C2: 4, N2: 5, O2: 6, F2: 7, Ne2: 8 };
const fillOrbitals = (electrons: number, orbitalCount: number): OrbitalOccupation[] => Array.from({ length: orbitalCount }, (_unused, index) => ({ up: index < electrons, down: index < electrons - orbitalCount }));
const isMolecule = (value: unknown): value is Molecule => molecules.some((molecule) => molecule === value);
const normalizeMolecule = (value: unknown): Molecule => isMolecule(value) ? value : isMolecule(molecularOrbitalDefinition.parameters.initial_molecule.defaultValue) ? molecularOrbitalDefinition.parameters.initial_molecule.defaultValue : "O2";

function deriveMolecularOrbitalDiagram(values: MolecularOrbitalValues) {
  const molecule = normalizeMolecule(values.initial_molecule);
  const electronsPerAtom = valenceElectronsPerAtom[molecule];
  const firstPeriod = molecule === "H2" || molecule === "He2";
  const earlySecondPeriod = molecule === "Li2" || molecule === "Be2" || molecule === "B2" || molecule === "C2" || molecule === "N2";
  const ordering = firstPeriod ? "first-period" : earlySecondPeriod ? "early-2p" : "late-2p";
  const levelDefinitions: Array<{ id: string; kind: OrbitalKind; orbitalCount: number }> = firstPeriod ? [
    { id: "sigma-s", kind: "bonding", orbitalCount: 1 },
    { id: "sigma-s-star", kind: "antibonding", orbitalCount: 1 },
  ] : [
    { id: "sigma-s", kind: "bonding", orbitalCount: 1 },
    { id: "sigma-s-star", kind: "antibonding", orbitalCount: 1 },
    ...(earlySecondPeriod ? [
      { id: "pi-p", kind: "bonding" as OrbitalKind, orbitalCount: 2 },
      { id: "sigma-p", kind: "bonding" as OrbitalKind, orbitalCount: 1 },
    ] : [
      { id: "sigma-p", kind: "bonding" as OrbitalKind, orbitalCount: 1 },
      { id: "pi-p", kind: "bonding" as OrbitalKind, orbitalCount: 2 },
    ]),
    { id: "pi-p-star", kind: "antibonding", orbitalCount: 2 },
    { id: "sigma-p-star", kind: "antibonding", orbitalCount: 1 },
  ];
  let remainingElectrons = electronsPerAtom * 2;
  const levels = levelDefinitions.map((level) => {
    const electrons = Math.min(remainingElectrons, level.orbitalCount * 2);
    remainingElectrons -= electrons;
    return { ...level, electrons, orbitals: fillOrbitals(electrons, level.orbitalCount) };
  });
  const bondingElectrons = levels.filter((level) => level.kind === "bonding").reduce((sum, level) => sum + level.electrons, 0);
  const antibondingElectrons = levels.filter((level) => level.kind === "antibonding").reduce((sum, level) => sum + level.electrons, 0);
  return {
    molecule,
    atom: molecule.slice(0, -1),
    shell: firstPeriod ? "1" : "2",
    valenceElectronsPerAtom: electronsPerAtom,
    valenceElectrons: electronsPerAtom * 2,
    ordering,
    atomicS: fillOrbitals(Math.min(electronsPerAtom, 2), 1),
    atomicP: firstPeriod ? [] : fillOrbitals(Math.max(electronsPerAtom - 2, 0), 3),
    levels,
    bondingElectrons,
    antibondingElectrons,
    bondOrder: (bondingElectrons - antibondingElectrons) / 2,
    unpairedElectrons: levels.reduce((sum, level) => sum + level.orbitals.filter((orbital) => orbital.up !== orbital.down).length, 0),
  };
}

function initializeMolecularOrbitalSchema(): void {}
function initializeMolecularOrbitalModel(): void {}

export {
  initializeMolecularOrbitalSchema as a,
  normalizeMolecule as i,
  deriveMolecularOrbitalDiagram as n,
  molecularOrbitalDefinition as o,
  initializeMolecularOrbitalModel as r,
  molecules as t,
};
