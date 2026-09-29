// Prime-factor-tree learning model with deterministic tree layout.
import "@rchunk/rolldown-runtime";

interface PrimeValues { number?: number | null }
interface FactorNode { id: string; value: number; prime: boolean; depth: number; leafStart: number; leafEnd: number; left?: FactorNode; right?: FactorNode }
interface PositionedFactorNode extends FactorNode { x: number; y: number }

const primesType = "PRIMES";
const primesThumbnail = "primes-v1";
const primesParameters = { number: { kind: "integer", defaultValue: 100, min: 2, max: 1000 } };
const primesDefinition = { type: primesType, version: 1, thumbnailAssetKey: primesThumbnail, parameters: primesParameters };
const numberParameter = primesDefinition.parameters.number;
const numberControl = { defaultValue: numberParameter.defaultValue, min: numberParameter.min, max: numberParameter.max };
const factorTreeLayout = { baseMin: 2, baseMax: 200, step: 1 };
const horizontalPadding = 32;
const verticalPadding = 24;
const leafSpacing = 48;
const levelSpacing = 56;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizePrimeNumber = (value: number | null | undefined): number => {
  const number = typeof value === "number" && Number.isFinite(value) ? value : numberControl.defaultValue;
  return clamp(Math.round(number), numberControl.min, numberControl.max);
};
const normalizePrimeValues = (values: PrimeValues) => ({ number: normalizePrimeNumber(values.number) });
const primeFactors = (value: number): number[] => {
  const factors: number[] = [];
  let remainder = normalizePrimeNumber(value);
  for (let divisor = 2; divisor * divisor <= remainder; divisor += 1) {
    while (remainder % divisor === 0) { factors.push(divisor); remainder /= divisor; }
  }
  if (remainder > 1) factors.push(remainder);
  return factors;
};
const product = (values: number[]): number => values.reduce((result, value) => result * value, 1);
const buildFactorTree = (factors: number[], depth: number, leafStart: number, id: string): FactorNode => {
  const value = product(factors);
  if (factors.length === 1) return { id, value, prime: true, depth, leafStart, leafEnd: leafStart };
  const midpoint = Math.floor(factors.length / 2);
  const leftFactors = factors.slice(0, midpoint);
  const rightFactors = factors.slice(midpoint);
  return {
    id, value, prime: false, depth, leafStart, leafEnd: leafStart + factors.length - 1,
    left: buildFactorTree(leftFactors, depth + 1, leafStart, `${id}-l`),
    right: buildFactorTree(rightFactors, depth + 1, leafStart + leftFactors.length, `${id}-r`),
  };
};
const createPrimeFactorTree = (values: PrimeValues): FactorNode => buildFactorTree(primeFactors(normalizePrimeValues(values).number), 0, 0, "root");
const maximumDepth = (node: FactorNode): number => node.prime ? node.depth : Math.max(maximumDepth(node.left as FactorNode), maximumDepth(node.right as FactorNode));

function layoutPrimeFactorTree(values: PrimeValues) {
  const root = createPrimeFactorTree(values);
  const leafCount = root.leafEnd - root.leafStart + 1;
  const maxDepth = maximumDepth(root);
  const width = 64 + (leafCount - 1) * leafSpacing;
  const height = 56 + maxDepth * levelSpacing;
  const nodes: PositionedFactorNode[] = [];
  const edges: Array<{ from: PositionedFactorNode; to: PositionedFactorNode }> = [];
  const leafX = (index: number): number => leafCount === 1 ? width / 2 : horizontalPadding + index * leafSpacing;
  const positionNode = (node: FactorNode): PositionedFactorNode => {
    const positioned = { ...node, x: (leafX(node.leafStart) + leafX(node.leafEnd)) / 2, y: verticalPadding + node.depth * levelSpacing };
    nodes.push(positioned);
    for (const child of [node.left, node.right]) {
      if (child) { const positionedChild = positionNode(child); edges.push({ from: positioned, to: positionedChild }); }
    }
    return positioned;
  };
  positionNode(root);
  return { edges, height, maxDepth, nodes, width };
}

function initializePrimesSchema(): void {}
function initializePrimesModel(): void {}

export {
  layoutPrimeFactorTree as a,
  primesDefinition as c,
  initializePrimesModel as i,
  factorTreeLayout as n,
  normalizePrimeValues as o,
  primeFactors as r,
  initializePrimesSchema as s,
  numberControl as t,
};
