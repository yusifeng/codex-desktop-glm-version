import "@rchunk/rolldown-runtime";
import * as Tokenize from "@rchunk/tokenize-math-block";
import * as XLike from "@rchunk/x-like";
import * as MathUtils from "@rchunk/math-block-utils";
import * as Classify from "@rchunk/classify";
function splitEquations(input: string): string[] { const body = input.match(/\\begin\{(?:cases|aligned)\}(?<body>[\s\S]*?)\\end\{(?:cases|aligned)\}/i)?.groups?.body ?? input.match(/\\begin\{array\}\{[^}]*\}(?<body>[\s\S]*?)\\end\{array\}/i)?.groups?.body ?? input; return body.split(/\\\\|\r?\n|\\n(?=\s*(?:y|[a-z][a-z0-9_]*\s*\(\s*x\s*\))\s*=)/iu).map((v) => v.replace(/\\(?:displaystyle|textstyle|scriptstyle|scriptscriptstyle)\b/gi, "").replace(/&/g, "").replace(/\\left\s*\\\{|\\right\s*\\\}|\\left\s*\\\.|\\right\s*\\\.|\\\{|\\\}/g, "").replace(/[;,]\s*$/, "").trim()).filter(Boolean); }
function parseSystem(input: string): string[] | null { const equations = splitEquations(input); if (equations.length < 2) return null; let dependent = false; for (const equation of equations) { if (/\\text\b|\\(?:le|ge|lt|gt)\b|<=|>=|<|>|\\in\b|\\mid\b/i.test(equation)) return null; const match = /^\s*(y|[a-z][a-z0-9_]*\s*\(\s*x\s*\))\s*=\s*(.+)$/i.exec(equation); if (!match) return null; if (/\by\b/i.test(match[2])) return null; if (/\bx\b/i.test(match[2])) dependent = true; else if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(match[2].trim())) return null; } return dependent ? equations : null; }
function initialize(): void { (MathUtils as unknown as { r(): void }).r(); (Tokenize as unknown as { n(): void }).n(); (XLike as unknown as { r(): void }).r(); (Classify as unknown as { a(): void }).a(); }
export { initialize as n, parseSystem as t };
