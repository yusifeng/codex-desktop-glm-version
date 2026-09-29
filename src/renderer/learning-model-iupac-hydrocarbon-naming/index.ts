// IUPAC parent-chain, substituent, and multiple-bond naming examples.
import "@rchunk/rolldown-runtime";

type HydrocarbonExampleId = "3-ethyl-2,4-dimethylhexane" | "2-ethylpent-1-ene" | "4-methylhex-2-yne";
interface Atom { x: number; y: number; label: string }
interface Bond { from: number; to: number; order: number }
interface Branch { name: "ethyl" | "methyl"; locant: number; atoms: number[] }
interface HydrocarbonStructure { id: HydrocarbonExampleId; atoms: Atom[]; bonds: Bond[]; parentLength: number; bondOrder: number; bondLocant?: number; branches: Branch[] }

const hydrocarbonExamples: HydrocarbonExampleId[] = ["3-ethyl-2,4-dimethylhexane", "2-ethylpent-1-ene", "4-methylhex-2-yne"];
const structures: Record<HydrocarbonExampleId, HydrocarbonStructure> = {
  "3-ethyl-2,4-dimethylhexane": { id: "3-ethyl-2,4-dimethylhexane", atoms: [{ x: 58, y: 130, label: "CH₃" }, { x: 198, y: 130, label: "CH" }, { x: 338, y: 130, label: "CH" }, { x: 478, y: 130, label: "CH" }, { x: 618, y: 130, label: "CH₂" }, { x: 618, y: 62, label: "CH₃" }, { x: 198, y: 62, label: "CH₃" }, { x: 338, y: 202, label: "CH₂" }, { x: 432, y: 232, label: "CH₃" }, { x: 478, y: 204, label: "CH₃" }], bonds: [{ from: 0, to: 1, order: 1 }, { from: 1, to: 2, order: 1 }, { from: 2, to: 3, order: 1 }, { from: 3, to: 4, order: 1 }, { from: 4, to: 5, order: 1 }, { from: 1, to: 6, order: 1 }, { from: 2, to: 7, order: 1 }, { from: 7, to: 8, order: 1 }, { from: 3, to: 9, order: 1 }], parentLength: 6, bondOrder: 1, branches: [{ name: "ethyl", locant: 3, atoms: [7, 8] }, { name: "methyl", locant: 2, atoms: [6] }, { name: "methyl", locant: 4, atoms: [9] }] },
  "2-ethylpent-1-ene": { id: "2-ethylpent-1-ene", atoms: [{ x: 58, y: 138, label: "CH₂" }, { x: 198, y: 138, label: "C" }, { x: 338, y: 138, label: "CH₂" }, { x: 478, y: 138, label: "CH₂" }, { x: 618, y: 138, label: "CH₃" }, { x: 198, y: 64, label: "CH₂" }, { x: 322, y: 64, label: "CH₃" }], bonds: [{ from: 0, to: 1, order: 2 }, { from: 1, to: 2, order: 1 }, { from: 2, to: 3, order: 1 }, { from: 3, to: 4, order: 1 }, { from: 1, to: 5, order: 1 }, { from: 5, to: 6, order: 1 }], parentLength: 5, bondOrder: 2, bondLocant: 1, branches: [{ name: "ethyl", locant: 2, atoms: [5, 6] }] },
  "4-methylhex-2-yne": { id: "4-methylhex-2-yne", atoms: [{ x: 58, y: 138, label: "CH₃" }, { x: 170, y: 138, label: "C" }, { x: 282, y: 138, label: "C" }, { x: 394, y: 138, label: "CH" }, { x: 506, y: 138, label: "CH₂" }, { x: 618, y: 138, label: "CH₃" }, { x: 394, y: 65, label: "CH₃" }], bonds: [{ from: 0, to: 1, order: 1 }, { from: 1, to: 2, order: 3 }, { from: 2, to: 3, order: 1 }, { from: 3, to: 4, order: 1 }, { from: 4, to: 5, order: 1 }, { from: 3, to: 6, order: 1 }], parentLength: 6, bondOrder: 3, bondLocant: 2, branches: [{ name: "methyl", locant: 4, atoms: [6] }] },
};
const parentStem = (length: number): string => length === 5 ? "pent" : "hex";
const multiplicativePrefix = (count: number): string => count === 2 ? "di" : count === 3 ? "tri" : "";
const normalizeHydrocarbonExample = (value: unknown): HydrocarbonExampleId => typeof value === "string" && hydrocarbonExamples.some((example) => example === value) ? value as HydrocarbonExampleId : hydrocarbonExamples[0];
const normalizeNamingStep = (value: unknown): number => typeof value === "number" && Number.isFinite(value) ? Math.min(3, Math.max(0, Math.round(value))) : 0;
const structureForExample = (value: unknown): HydrocarbonStructure => structures[normalizeHydrocarbonExample(value)];
const groupedBranches = (structure: HydrocarbonStructure) => (["ethyl", "methyl"] as const).map((name) => ({ name, locants: structure.branches.filter((branch) => branch.name === name).map((branch) => branch.locant).sort((left, right) => left - right) })).filter(({ locants }) => locants.length > 0);
const buildHydrocarbonName = (structure: HydrocarbonStructure) => {
  const prefixes = groupedBranches(structure).map(({ name, locants }) => `${locants.join(",")}-${multiplicativePrefix(locants.length)}${name}`);
  const parent = structure.bondOrder === 1 ? `${parentStem(structure.parentLength)}ane` : `${parentStem(structure.parentLength)}-${structure.bondLocant}-${structure.bondOrder === 2 ? "ene" : "yne"}`;
  return { prefixes, parent, full: `${prefixes.join("-")}${parent}` };
};
const reversedBranchLocants = (structure: HydrocarbonStructure): number[] => structure.branches.map((branch) => structure.parentLength + 1 - branch.locant).sort((left, right) => left - right);
const reversedBondLocant = (structure: HydrocarbonStructure): number | undefined => structure.bondLocant === undefined ? undefined : structure.parentLength - structure.bondLocant;

function initializeIupacHydrocarbonNamingModel(): void {}

export { buildHydrocarbonName as a, normalizeHydrocarbonExample as c, initializeIupacHydrocarbonNamingModel as i, normalizeNamingStep as l, structureForExample as n, reversedBondLocant as o, groupedBranches as r, reversedBranchLocants as s, hydrocarbonExamples as t };
