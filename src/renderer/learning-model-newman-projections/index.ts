// Newman-projection conformations for ethane and butane.
import "@rchunk/rolldown-runtime";

type NewmanMolecule = "ethane" | "butane";
interface NewmanProjectionValues { molecule?: unknown; rotationStep?: number | null }

const newmanProjectionsType = "NEWMAN_PROJECTIONS";
const newmanProjectionsThumbnail = "newman-projections-v1";
const newmanProjectionsParameters = { molecule: { kind: "enum" as const, defaultValue: "butane" as NewmanMolecule, allowedValues: ["ethane", "butane"] as NewmanMolecule[] } };
const newmanProjectionsSpecification = { type: newmanProjectionsType, version: 2, thumbnailAssetKey: newmanProjectionsThumbnail, parameters: newmanProjectionsParameters };
const normalizeMolecule = (value: unknown): NewmanMolecule => value === "ethane" || value === "butane" ? value : newmanProjectionsSpecification.parameters.molecule.defaultValue === "ethane" ? "ethane" : "butane";
const normalizeRotationStep = (value: number | null | undefined): number => Number.isFinite(value) ? (Math.round(value ?? 0) % 6 + 6) % 6 : 3;
const rotationStepFromDegrees = (degrees: number): number => Number.isFinite(degrees) ? normalizeRotationStep(Math.round(degrees / 60)) : 3;
const calculateNewmanProjection = (values: NewmanProjectionValues) => {
  const molecule = normalizeMolecule(values.molecule);
  const rotationStep = normalizeRotationStep(values.rotationStep);
  const rotationDegrees = rotationStep * 60;
  if (molecule === "ethane") {
    const staggered = rotationStep % 2 === 1;
    return { molecule, rotationStep, rotationDegrees, methylDihedralDegrees: null, kind: staggered ? "staggered" : "eclipsed", stabilityRank: staggered ? 1 : 4 };
  }
  const methylDihedralDegrees = rotationStep === 0 ? 0 : rotationStep === 3 ? 180 : rotationStep === 1 || rotationStep === 5 ? 60 : 120;
  if (methylDihedralDegrees === 180) return { molecule, rotationStep, rotationDegrees, methylDihedralDegrees, kind: "anti-staggered", stabilityRank: 1 };
  if (methylDihedralDegrees === 60) return { molecule, rotationStep, rotationDegrees, methylDihedralDegrees, kind: "gauche-staggered", stabilityRank: 2 };
  if (methylDihedralDegrees === 120) return { molecule, rotationStep, rotationDegrees, methylDihedralDegrees, kind: "partially-eclipsed", stabilityRank: 3 };
  return { molecule, rotationStep, rotationDegrees, methylDihedralDegrees, kind: "fully-eclipsed", stabilityRank: 4 };
};
const defaultNewmanProjectionValues = { molecule: normalizeMolecule(newmanProjectionsSpecification.parameters.molecule.defaultValue), rotationStep: 3 };

function initializeNewmanProjectionsSpecification(): void {}
function initializeNewmanProjectionsModel(): void {}

export { initializeNewmanProjectionsSpecification as a, rotationStepFromDegrees as i, calculateNewmanProjection as n, newmanProjectionsSpecification as o, initializeNewmanProjectionsModel as r, defaultNewmanProjectionValues as t };
