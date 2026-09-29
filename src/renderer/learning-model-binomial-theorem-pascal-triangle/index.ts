// Binomial-theorem learning model backed by Pascal's triangle.
import "@rchunk/rolldown-runtime";

interface BinomialValues { n?: number | null }
interface BinomialTerm { coefficient: number; aPower: number; bPower: number }

const binomialTheoremType = "BINOMIAL_THEOREM_PASCAL_TRIANGLE";
const binomialTheoremThumbnail = "binomial-theorem-pascal-triangle-v1";
const binomialTheoremFormula = "(a+b)^n = \\sum_{k=0}^{n}\\binom{n}{k}a^{n-k}b^k";
const binomialTheoremParameters = { n: { kind: "integer", defaultValue: 5, min: 0, max: 6 } };
const binomialTheoremDefinition = { type: binomialTheoremType, version: 1, thumbnailAssetKey: binomialTheoremThumbnail, canonicalFormula: binomialTheoremFormula, parameters: binomialTheoremParameters };
const exponentControl = { ...binomialTheoremDefinition.parameters.n, step: 1 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeBinomialValues = (values: BinomialValues) => {
  const exponent = Number.isFinite(values.n) ? Number(values.n) : exponentControl.defaultValue;
  return { n: clamp(Math.round(exponent), exponentControl.min, exponentControl.max) };
};

function buildPascalTriangle(maximumRow = exponentControl.max): number[][] {
  const rowCount = clamp(Math.round(maximumRow), 0, exponentControl.max);
  const rows = [[1]];
  for (let row = 1; row <= rowCount; row += 1) {
    const previous = rows[row - 1] ?? [1];
    rows.push(Array.from({ length: row + 1 }, (_unused, index) => (previous[index - 1] ?? 0) + (previous[index] ?? 0)));
  }
  return rows;
}

const getBinomialTerms = (value: number): Array<BinomialTerm & { k: number }> => {
  const exponent = normalizeBinomialValues({ n: value }).n;
  return (buildPascalTriangle(exponent)[exponent] ?? [1]).map((coefficient, k) => ({ k, coefficient, aPower: exponent - k, bPower: k }));
};
const formatPower = (variable: string, power: number): string => power === 0 ? "" : power === 1 ? variable : `${variable}^{${power}}`;
const formatBinomialTerm = ({ coefficient, aPower, bPower }: BinomialTerm): string => {
  const variables = `${formatPower("a", aPower)}${formatPower("b", bPower)}`;
  return variables ? `${coefficient === 1 ? "" : coefficient}${variables}` : String(coefficient);
};
const formatBinomialExpansion = (value: number): string => {
  const exponent = normalizeBinomialValues({ n: value }).n;
  return `(a+b)^{${exponent}} = ${getBinomialTerms(exponent).map(formatBinomialTerm).join(" + ")}`;
};

function initializeBinomialTheoremSchema(): void {}
function initializeBinomialTheoremModel(): void {}

export {
  formatBinomialTerm as a,
  initializeBinomialTheoremSchema as c,
  buildPascalTriangle as i,
  binomialTheoremDefinition as l,
  getBinomialTerms as n,
  initializeBinomialTheoremModel as o,
  formatBinomialExpansion as r,
  normalizeBinomialValues as s,
  exponentControl as t,
};
