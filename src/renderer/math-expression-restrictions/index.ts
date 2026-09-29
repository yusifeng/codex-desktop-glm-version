// Parses and evaluates mathematical domain restrictions. Release chunk: restrictions-e423e45ffc9f.js.
import "@rchunk/rolldown-runtime";
import * as equationChunk from "@rchunk/equation";

interface Token {
  type: string;
  value: string;
}
type Expression = Token[];
type Operator = "<" | "<=" | ">" | ">=";
interface Comparison {
  left: Expression;
  operator: Operator;
  right: Expression;
}
interface Restriction {
  comparisons: Comparison[];
  identifiers: unknown;
}
interface EquationRuntime {
  S(content: string): string[] | null;
  b(): void;
  g(content: string, context: unknown): Expression | null;
  i(input: Record<string, unknown> & { tokens: Expression }): number;
  s(...expressions: Expression[]): unknown;
  u(): void;
  x(content: string): string;
}

const equationRuntime = equationChunk as unknown as EquationRuntime;
let initialized = false;
const comparisonPattern =
  /[<>≤≥]|\\(?:lt|gt|leqslant|leq|le|geqslant|geq|ge)(?![a-zA-Z])/;

function unwrapBraces(content: string): string {
  const trimmed = content.trim();
  return trimmed.startsWith("{") && trimmed.endsWith("}")
    ? trimmed.slice(1, -1).trim()
    : trimmed;
}

function normalizeComparisons(content: string): string {
  return content
    .replace(/\\(?:leqslant|leq?)(?![a-zA-Z])\s*/g, "<=")
    .replace(/\\(?:geqslant|geq?)(?![a-zA-Z])\s*/g, ">=")
    .replace(/\\lt(?![a-zA-Z])\s*/g, "<")
    .replace(/\\gt(?![a-zA-Z])\s*/g, ">")
    .replaceAll("≤", "<=")
    .replaceAll("≥", ">=");
}

function splitComparisonChain(
  content: string,
): { expressions: string[]; operators: Operator[] } | null {
  const normalized = normalizeComparisons(content);
  const expressions: string[] = [];
  const operators: Operator[] = [];
  let expressionStart = 0;
  let depth = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    if (character === "(" || character === "{" || character === "[") {
      depth += 1;
      continue;
    }
    if (character === ")" || character === "}" || character === "]") {
      depth -= 1;
      if (depth < 0) return null;
      continue;
    }
    if (depth !== 0 || (character !== "<" && character !== ">")) continue;
    const inclusive = normalized[index + 1] === "=";
    expressions.push(normalized.slice(expressionStart, index).trim());
    operators.push(`${character}${inclusive ? "=" : ""}` as Operator);
    if (inclusive) index += 1;
    expressionStart = index + 1;
  }
  expressions.push(normalized.slice(expressionStart).trim());
  return depth === 0 &&
    operators.length > 0 &&
    expressions.length === operators.length + 1 &&
    expressions.every(Boolean)
    ? { expressions, operators }
    : null;
}

function parseComparisonChain(
  content: string,
  context: unknown,
): Restriction | null {
  const split = splitComparisonChain(content);
  if (!split) return null;
  const expressions = split.expressions.map((expression) =>
    equationRuntime.g(expression, context),
  );
  if (expressions.some((expression) => expression == null)) return null;
  const parsed = expressions as Expression[];
  return {
    comparisons: split.operators.map((operator, index) => ({
      left: parsed[index],
      operator,
      right: parsed[index + 1],
    })),
    identifiers: equationRuntime.s(...parsed),
  };
}

function parseRestrictionGroup(
  content: string,
  context: unknown,
): Restriction[] | null {
  const normalized = equationRuntime.x(content).trim();
  if (!normalized) return [];
  const unwrapped = unwrapBraces(normalized);
  const clauses = equationRuntime.S(unwrapped);
  if (!clauses) return null;
  const restrictions = clauses.map((clause) =>
    parseComparisonChain(clause, context),
  );
  return restrictions.every((restriction) => restriction != null)
    ? (restrictions as Restriction[])
    : null;
}

function extractRestrictions(
  content: string,
  context: unknown,
): {
  content: string;
  domain?: { content: string; restrictions: Restriction[] };
  restrictions: Restriction[];
} | null {
  const normalized = equationRuntime.x(content).trim();
  if (!normalized.endsWith("}"))
    return { content: normalized, restrictions: [] };
  const groups: Array<{ content: string; restrictions: Restriction[] }> = [];
  let boundary = normalized.length;
  while (normalized[boundary - 1] === "}") {
    let depth = 0;
    let start = boundary - 1;
    for (; start >= 0; start -= 1) {
      if (normalized[start] === "}") depth += 1;
      else if (normalized[start] === "{" && --depth === 0) break;
    }
    if (start < 0) return null;
    const groupContent = normalized.slice(start, boundary);
    if (!comparisonPattern.test(groupContent)) break;
    const restrictions = parseRestrictionGroup(groupContent, context);
    if (!restrictions) return null;
    groups.unshift({ content: unwrapBraces(groupContent), restrictions });
    boundary = start;
    while (boundary > 0 && /\s/.test(normalized[boundary - 1])) boundary -= 1;
  }
  if (groups.length === 0) return { content: normalized, restrictions: [] };
  const primaryContent = normalized.slice(0, boundary).trim();
  const [domain, ...additionalGroups] = groups;
  const additionalRestrictions = additionalGroups.flatMap(
    (group) => group.restrictions,
  );
  return primaryContent
    ? {
        content: primaryContent,
        domain: {
          content: domain.content,
          restrictions: additionalRestrictions,
        },
        restrictions: [...domain.restrictions, ...additionalRestrictions],
      }
    : { content: domain.content, restrictions: additionalRestrictions };
}

function evaluateComparison(
  comparison: Comparison,
  context: Record<string, unknown>,
): boolean {
  const evaluate = (tokens: Expression) =>
    equationRuntime.i({ ...context, tokens });
  const left = evaluate(comparison.left);
  const right = evaluate(comparison.right);
  switch (comparison.operator) {
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case ">":
      return left > right;
    case ">=":
      return left >= right;
  }
}

function restrictionsMatch(
  restrictions: Restriction[],
  context: Record<string, unknown>,
): boolean {
  return restrictions.every((restriction) =>
    restriction.comparisons.every((comparison) =>
      evaluateComparison(comparison, context),
    ),
  );
}

function axisIdentifier(tokens: Expression): "x" | "y" | null {
  const token = tokens.length === 1 ? tokens[0] : null;
  return token?.type === "identifier" &&
    (token.value === "x" || token.value === "y")
    ? token.value
    : null;
}
function containsAxisIdentifier(tokens: Expression): boolean {
  return tokens.some(
    (token) =>
      token.type === "identifier" &&
      (token.value === "x" || token.value === "y" || token.value === "z"),
  );
}

function restrictionBounds(
  restrictions: Restriction[],
  axis: "x" | "y",
  context: Record<string, unknown>,
): {
  max: number;
  maxInclusive: boolean;
  min: number;
  minInclusive: boolean;
} | null {
  let minimum: number | undefined;
  let maximum: number | undefined;
  let minimumInclusive = true;
  let maximumInclusive = true;
  for (const restriction of restrictions) {
    for (const comparison of restriction.comparisons) {
      const leftAxis = axisIdentifier(comparison.left);
      const rightAxis = axisIdentifier(comparison.right);
      if (
        (leftAxis == null) === (rightAxis == null) ||
        (leftAxis ?? rightAxis) !== axis
      )
        continue;
      const otherSide = leftAxis ? comparison.right : comparison.left;
      if (containsAxisIdentifier(otherSide)) continue;
      const value = equationRuntime.i({ ...context, tokens: otherSide });
      if (!Number.isFinite(value)) return null;
      const inclusive = comparison.operator.endsWith("=");
      const isMinimum = leftAxis
        ? comparison.operator.startsWith(">")
        : comparison.operator.startsWith("<");
      if (isMinimum) {
        if (minimum == null || value > minimum) {
          minimum = value;
          minimumInclusive = inclusive;
        } else if (value === minimum) minimumInclusive &&= inclusive;
      } else if (maximum == null || value < maximum) {
        maximum = value;
        maximumInclusive = inclusive;
      } else if (value === maximum) maximumInclusive &&= inclusive;
    }
  }
  return minimum == null ||
    maximum == null ||
    minimum > maximum ||
    (minimum === maximum && (!minimumInclusive || !maximumInclusive))
    ? null
    : {
        max: maximum,
        maxInclusive: maximumInclusive,
        min: minimum,
        minInclusive: minimumInclusive,
      };
}

function axisBoundaries(
  restrictions: Restriction[],
  context: Record<string, unknown>,
): Array<{ axis: "x" | "y"; inclusive: boolean; value: number }> {
  return restrictions.flatMap((restriction) =>
    restriction.comparisons.flatMap((comparison) => {
      const leftAxis = axisIdentifier(comparison.left);
      const rightAxis = axisIdentifier(comparison.right);
      if ((leftAxis == null) === (rightAxis == null)) return [];
      const otherSide = leftAxis ? comparison.right : comparison.left;
      if (containsAxisIdentifier(otherSide)) return [];
      const value = equationRuntime.i({ ...context, tokens: otherSide });
      return Number.isFinite(value)
        ? [
            {
              axis: (leftAxis ?? rightAxis) as "x" | "y",
              inclusive: comparison.operator.endsWith("="),
              value,
            },
          ]
        : [];
    }),
  );
}

function initialize(): void {
  if (initialized) return;
  initialized = true;
  equationRuntime.u();
  equationRuntime.b();
}

export {
  extractRestrictions as a,
  initialize as i,
  axisBoundaries as n,
  restrictionBounds as r,
  restrictionsMatch as t,
};
