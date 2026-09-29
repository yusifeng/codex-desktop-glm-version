// Numerical-integrand normalization. Release chunk: numerical-integration-e14603542012.js.
import "@rchunk/rolldown-runtime";

function replaceLatexFractions(expression: string): string {
  let normalized = expression;
  for (let pass = 0; pass < 4; pass += 1) {
    const next = normalized.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "(($1)/($2))");
    if (next === normalized) break;
    normalized = next;
  }
  return normalized;
}

function insertPiMultiplication(expression: string): string {
  return expression
    .replace(/(^|[0-9x)e])pi/g, (_match, prefix: string) => prefix + (prefix ? "*" : "") + "pi")
    .replace(/pi(?=pi|[0-9xe(])/g, "pi*");
}

function normalizeIntegrand(expression?: string | null): {
  integrand: string;
  hasUnsupportedLetter: boolean;
} {
  const sanitized = replaceLatexFractions(expression ?? "")
    .replace(/\\pi/g, "pi")
    .replace(/π/g, "pi")
    .replace(/\\cdot/g, "*")
    .replace(/\\times/g, "*")
    .replace(/\\div/g, "/")
    .replace(/\\(?:left|right)(?![a-zA-Z])/g, "")
    .replace(/\\(?:,|;|:|!| )/g, "")
    .replace(/[−–—]/g, "-")
    .replace(/[×·⋅]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[{}]/g, (token) => (token === "{" ? "(" : ")"))
    .toLowerCase();

  let hasUnsupportedLetter = false;
  let integrand = "";
  for (let index = 0; index < sanitized.length; index += 1) {
    if (sanitized.startsWith("pi", index)) {
      integrand += "pi";
      index += 1;
      continue;
    }
    const token = sanitized[index];
    if (/^[0-9xe+\-*/^().\s]$/.test(token)) {
      integrand += token;
      continue;
    }
    if (/^[a-z]$/.test(token)) {
      hasUnsupportedLetter = true;
    }
  }

  return {
    integrand: insertPiMultiplication(integrand.replace(/\s+/g, "")),
    hasUnsupportedLetter,
  };
}

function initializeNumericalIntegration(): void {}

export { normalizeIntegrand as n, initializeNumericalIntegration as t };
