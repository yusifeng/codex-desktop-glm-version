// Derivative-as-secant controls. Release chunk: type-a2f2d61e4f86.js.
import "@rchunk/rolldown-runtime";
type FunctionExpression = "x^2" | "x^3" | "x^3-x" | "sin(x)" | "cos(x)" | "e^x";
interface Specification {
  type: "DERIVATIVE_AS_SECANT";
  version: 1;
  thumbnailAssetKey: "derivative-as-secant-v1";
  canonicalFormula: string;
  parameters: {
    functionExpression: {
      kind: "enum";
      defaultValue: FunctionExpression;
      allowedValues: FunctionExpression[];
    };
    xValue: { kind: "number"; defaultValue: 1; min: -10; max: 10 };
    h: { kind: "number"; defaultValue: 2; min: 0.05; max: 4 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "DERIVATIVE_AS_SECANT",
    version: 1,
    thumbnailAssetKey: "derivative-as-secant-v1",
    canonicalFormula: "f'(a)=\\lim_{h\\to0^+}\\frac{f(a+h)-f(a)}{h}",
    parameters: {
      functionExpression: {
        kind: "enum",
        defaultValue: "x^2",
        allowedValues: ["x^2", "x^3", "x^3-x", "sin(x)", "cos(x)", "e^x"],
      },
      xValue: { kind: "number", defaultValue: 1, min: -10, max: 10 },
      h: { kind: "number", defaultValue: 2, min: 0.05, max: 4 },
    },
  };
}
export { specification as n, initialize as t };
