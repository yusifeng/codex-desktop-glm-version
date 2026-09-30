// Math-expression classification helpers. Release chunk: classify-475110c4b36d.js.
import "@rchunk/rolldown-runtime";
import * as mathBlockUtilsChunk from "@rchunk/math-block-utils";

interface MathBlockUtilsRuntime {
  n(source: string): number[];
  r(): void;
}
const mathBlockUtils = mathBlockUtilsChunk as unknown as MathBlockUtilsRuntime;
let stripBox: (source: string) => string;
let stripTextWrappers: (source: string) => string;
let isMultiStep: (source: string) => boolean;
let stripSpacing: (source: string) => string;
let isCases: (source: string) => boolean;
let normalizeCompact: (source: string) => string;
let isMultipleIntegral: (source: string) => boolean;
let splitImplications: (source: string) => string[];
let adjacentEquationPairs: (
  source: string,
) => Array<{ lhs: string; rhs: string }>;
let normalizeMath: (source: string) => string;

function initializeClassify(): void {
  mathBlockUtils.r();
  const stylePattern =
    /(?:\\|\/)(?:displaystyle|textstyle|scriptstyle|scriptscriptstyle)\b/gi;
  const removeStyles = (source: string) => source.replace(stylePattern, "");
  normalizeMath = (source) => {
    const trimmed = source.trim();
    let normalized = trimmed;
    if (
      (trimmed.startsWith("\\(") && trimmed.endsWith("\\)")) ||
      (trimmed.startsWith("\\[") && trimmed.endsWith("\\]"))
    )
      normalized = trimmed.slice(2, -2).trim();
    if (normalized.startsWith("$") && normalized.endsWith("$")) {
      normalized = normalized.slice(1, -1).trim();
    }
    return removeStyles(normalized).trim();
  };
  stripBox = (source) => {
    const trimmed = source.trim();
    const match = trimmed.match(/^\\boxed\{(?<inner>.*)\}$/);
    return removeStyles(match?.groups?.inner ?? trimmed).trim();
  };
  stripSpacing = (source) =>
    removeStyles(source)
      .replace(/\\(?:,|;|:|!|quad|qquad| )/g, "")
      .replace(/\\left\s*/g, "")
      .replace(/\\right\s*/g, "");
  stripTextWrappers = (source) =>
    source.replace(/\\(?:text|mathrm|operatorname)\{([^{}]+)\}/g, "$1");
  const unwrapBraces = (source: string) => {
    let result = source.trim();
    while (result.startsWith("{") && result.endsWith("}")) {
      result = result.slice(1, -1).trim();
    }
    return result;
  };
  normalizeCompact = (source) =>
    stripSpacing(unwrapBraces(source)).replace(/\s+/g, "");
  const integralPattern = /\\(?:iint|iiint|oint)(?![a-zA-Z])/;
  const casesPattern = /\\(?:begin|end)\s*\{cases\}|\\cases(?![a-zA-Z])/;
  const multiStepPattern =
    /\\(?:text|begin|end|Rightarrow|to|big|Big|bigg|Bigg)\b/;
  const inverseFunctionPattern = /[a-wyzA-WYZ]\s*\^\s*\{\s*-1\s*\}\s*\(/;
  isCases = (source) => casesPattern.test(stripSpacing(source));
  isMultiStep = (source) =>
    multiStepPattern.test(source) ||
    inverseFunctionPattern.test(source) ||
    source.includes("&");
  isMultipleIntegral = (source) => integralPattern.test(stripSpacing(source));
  const implicationPattern =
    /\s*(?:\\(?:Rightarrow|Longrightarrow|rightarrow|to|implies|leftrightarrow)|=>|->|⇒|→|↔)\s*/g;
  const trimPunctuation = (source: string) =>
    source
      .trim()
      .replace(/(?:[.,;]|\\\.)+$/g, "")
      .trim();
  splitImplications = (source) =>
    source
      .split(implicationPattern)
      .flatMap((part) => part.split(/\r?\n+/))
      .map(trimPunctuation)
      .filter(Boolean);
  const splitEquations = (source: string) => {
    const separators = mathBlockUtils.n(source);
    if (separators.length === 0) return [trimPunctuation(source)];
    const parts: string[] = [];
    let start = 0;
    for (const separator of separators) {
      parts.push(trimPunctuation(source.slice(start, separator)));
      start = separator + 1;
    }
    parts.push(trimPunctuation(source.slice(start)));
    return parts.filter(Boolean);
  };
  adjacentEquationPairs = (source) => {
    const parts = splitEquations(source);
    const pairs: Array<{ lhs: string; rhs: string }> = [];
    for (let index = 0; index < parts.length - 1; index += 1) {
      const lhs = parts[index];
      const rhs = parts[index + 1];
      if (lhs && rhs) pairs.push({ lhs, rhs });
    }
    return pairs;
  };
}

export {
  initializeClassify as a,
  stripBox as c,
  stripTextWrappers as d,
  isMultiStep as i,
  stripSpacing as l,
  isCases as n,
  normalizeCompact as o,
  isMultipleIntegral as r,
  splitImplications as s,
  adjacentEquationPairs as t,
  normalizeMath as u,
};
