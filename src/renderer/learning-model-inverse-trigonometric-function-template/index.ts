import "@rchunk/rolldown-runtime";
import * as Classify from "@rchunk/classify";
type FunctionName = "arcsin" | "arccos" | "arctan";
let sineBounds: { min: number; max: number; step: number; defaultValue: number }, tangentBounds: typeof sineBounds;
const boundsFor = (name: FunctionName) => name === "arctan" ? tangentBounds : sineBounds;
const apply = (name: FunctionName, value: number) => name === "arccos" ? Math.acos(value) : name === "arctan" ? Math.atan(value) : Math.asin(value);
const ratioLabel = (name: FunctionName) => name === "arccos" ? "x" : name === "arctan" ? "y/x" : "y";
function parse(input = ""): { functionName: FunctionName; value: number } { const normalized = input.replace(/\\(?:sin|cos|tan)\^\{-1\}|\\(?:sin|cos|tan)\^-1/gi, (m) => "arc" + m.match(/sin|cos|tan/i)?.[0].toLowerCase()).replace(/\\(arcsin|arccos|arctan)/g, "$1").replace(/\\pi|π/g, "pi").replace(/\s+|[{}]/g, "").toLowerCase(); const match = /(arcsin|arccos|arctan)\(([^)]+)\)|(arcsin|arccos|arctan)([a-z0-9.+\-*/]+)/i.exec(normalized); const name = (match?.[1] ?? match?.[3] ?? "arcsin") as FunctionName; const expression = match?.[2] ?? match?.[4]; let value = boundsFor(name).defaultValue; if (expression && /^[0-9+\-*/().pi]+$/i.test(expression)) { try { const evaluated = Function('"use strict"; return (' + expression.replace(/pi/gi, "Math.PI") + ');')() as unknown; if (typeof evaluated === "number" && Number.isFinite(evaluated)) value = evaluated; } catch {} } return { functionName: name, value }; }
function initialize(): void { (Classify as unknown as { a(): void }).a(); sineBounds = { min: -1, max: 1, step: .01, defaultValue: .5 }; tangentBounds = { min: -30, max: 30, step: .1, defaultValue: 0 }; }
export { parse as a, initialize as i, ratioLabel as n, boundsFor as r, apply as t };
