// Monohybrid Punnett-square learning model for a single R/r gene.
import "@rchunk/rolldown-runtime";

type Genotype = "RR" | "Rr" | "rr";
interface ParentGenotypes { parentOne?: unknown; parentTwo?: unknown }

const parentOneGenotypes: Genotype[] = ["RR", "Rr", "rr"];
const parentTwoGenotypes: Genotype[] = ["RR", "Rr", "rr"];
const defaultParentGenotypes = { parentOne: "Rr" as Genotype, parentTwo: "Rr" as Genotype };
const genotypePattern = /\b([A-Za-z]{2})\b/g;
const compareAlleles = (first: string, second: string): number => {
  const firstLower = first.toLowerCase();
  const secondLower = second.toLowerCase();
  if (firstLower === secondLower) {
    if (first === second) return 0;
    return first === first.toUpperCase() ? -1 : 1;
  }
  return firstLower.localeCompare(secondLower);
};
const compareGenotypes = (first: string, second: string): number => {
  const length = Math.max(first.length, second.length);
  for (let index = 0; index < length; index += 1) {
    const firstAllele = first[index];
    const secondAllele = second[index];
    if (!firstAllele || !secondAllele) return first.length - second.length;
    const comparison = compareAlleles(firstAllele, secondAllele);
    if (comparison !== 0) return comparison;
  }
  return 0;
};
const canonicalizeGenotype = (value: unknown): Genotype | null => {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length !== 2) return null;
  const [first, second] = [...text];
  if (!/[A-Za-z]/.test(first) || !/[A-Za-z]/.test(second)) return null;
  const gene = first.toLowerCase();
  if (gene !== second.toLowerCase() || gene !== "r") return null;
  if (first === first.toUpperCase() && second === second.toUpperCase()) return "RR";
  if (first === first.toLowerCase() && second === second.toLowerCase()) return "rr";
  return "Rr";
};
const normalizeParentOne = (value: unknown): Genotype => {
  const genotype = canonicalizeGenotype(value);
  return genotype && parentOneGenotypes.includes(genotype) ? genotype : defaultParentGenotypes.parentOne;
};
const normalizeParentTwo = (value: unknown): Genotype => {
  const genotype = canonicalizeGenotype(value);
  return genotype && parentTwoGenotypes.includes(genotype) ? genotype : defaultParentGenotypes.parentTwo;
};
const normalizeParentGenotypes = (values: ParentGenotypes) => ({ parentOne: normalizeParentOne(values.parentOne), parentTwo: normalizeParentTwo(values.parentTwo) });
const parseParentCross = (text: string) => {
  const matches: Genotype[] = [];
  for (const match of text.matchAll(genotypePattern)) {
    const genotype = canonicalizeGenotype(match[1]);
    if (genotype) {
      matches.push(genotype);
      if (matches.length === 2) break;
    }
  }
  return normalizeParentGenotypes({ parentOne: matches[0], parentTwo: matches[1] });
};
const formatParentCross = (values: ParentGenotypes): string => {
  const normalized = normalizeParentGenotypes(values);
  return normalized.parentOne + " x " + normalized.parentTwo;
};
const gametes = (genotype: Genotype): string[] => [genotype[0], genotype[1]];
const combineAlleles = (first: string, second: string): Genotype => [first, second].sort(compareAlleles).join("") as Genotype;

function derivePunnettSquare(values: ParentGenotypes) {
  const normalized = normalizeParentGenotypes(values);
  const parentOneGametes = gametes(normalized.parentOne);
  const parentTwoGametes = gametes(normalized.parentTwo);
  const cells = parentTwoGametes.flatMap((rowGamete) => parentOneGametes.map((columnGamete) => ({ rowGamete, columnGamete, genotype: combineAlleles(rowGamete, columnGamete) })));
  const counts = new Map<Genotype, number>();
  for (const cell of cells) counts.set(cell.genotype, (counts.get(cell.genotype) ?? 0) + 1);
  const outcomes = [...counts.entries()].map(([genotype, count]) => ({ genotype, count, probability: count / cells.length })).sort((first, second) => compareGenotypes(first.genotype, second.genotype));
  const dominantCount = cells.filter((cell) => [...cell.genotype].some((allele) => allele === "R")).length;
  return { parentOneGametes, parentTwoGametes, cells, outcomes, dominantPhenotypeProbability: dominantCount / cells.length, recessivePhenotypeProbability: (cells.length - dominantCount) / cells.length, isMixedGeneCross: false, geneSymbol: "R" };
}

const formatProbability = (probability: number): string => {
  const percent = probability * 100;
  return Number.isInteger(percent) ? percent + "%" : percent.toFixed(1) + "%";
};
function initializeMonohybridPunnettSquare(): void {}

export {
  parseParentCross as a,
  normalizeParentGenotypes as c,
  formatParentCross as i,
  parentTwoGenotypes as n,
  formatProbability as o,
  derivePunnettSquare as r,
  initializeMonohybridPunnettSquare as s,
  parentOneGenotypes as t,
};
