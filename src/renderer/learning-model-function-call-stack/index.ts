// Function-call-stack learning model tracing nested calls and returns.
import "@rchunk/rolldown-runtime";

type StackStepKind = "call" | "return" | "resume";
interface CallStackValues { stepIndex?: number | null }
interface CallStackStep { key: string; kind: StackStepKind; currentFunction: string; frames: string[]; returnedValue: string | null; callTarget: string | null }

const callStackStepControl = { min: 0, max: 8, step: 1, defaultValue: 0 };
const defaultCallStackValues = { stepIndex: callStackStepControl.defaultValue };
const callStackSteps: CallStackStep[] = [
  { key: "main-calls-checkout", kind: "call", currentFunction: "main", frames: ["main"], returnedValue: null, callTarget: "checkout" },
  { key: "checkout-calls-subtotal", kind: "call", currentFunction: "checkout", frames: ["main", "checkout"], returnedValue: null, callTarget: "subtotal" },
  { key: "subtotal-returns", kind: "return", currentFunction: "subtotal", frames: ["main", "checkout", "subtotal"], returnedValue: "24", callTarget: null },
  { key: "checkout-calls-add-tax", kind: "call", currentFunction: "checkout", frames: ["main", "checkout"], returnedValue: "24", callTarget: "addTax" },
  { key: "add-tax-returns", kind: "return", currentFunction: "addTax", frames: ["main", "checkout", "addTax"], returnedValue: "25.92", callTarget: null },
  { key: "checkout-calls-format", kind: "call", currentFunction: "checkout", frames: ["main", "checkout"], returnedValue: "25.92", callTarget: "format" },
  { key: "format-returns", kind: "return", currentFunction: "format", frames: ["main", "checkout", "format"], returnedValue: "$25.92", callTarget: null },
  { key: "checkout-returns", kind: "return", currentFunction: "checkout", frames: ["main", "checkout"], returnedValue: "$25.92", callTarget: null },
  { key: "main-uses-result", kind: "resume", currentFunction: "main", frames: ["main"], returnedValue: "$25.92", callTarget: null },
];
const normalizeStepIndex = (value: number | null | undefined, minimum: number, maximum: number): number => Number.isFinite(value) ? Math.min(Math.max(Math.round(value as number), minimum), maximum) : minimum;
const normalizeCallStackValues = (values: CallStackValues) => ({ stepIndex: normalizeStepIndex(values.stepIndex ?? callStackStepControl.defaultValue, callStackStepControl.min, callStackStepControl.max) });
const getCallStackStep = (values: CallStackValues): CallStackStep => callStackSteps[normalizeCallStackValues(values).stepIndex] ?? callStackSteps[0];
const getActiveStackFrame = (step: CallStackStep): string => step.frames[step.frames.length - 1] ?? step.currentFunction;

function initializeFunctionCallStackModel(): void {}

export {
  getActiveStackFrame as a,
  getCallStackStep as i,
  callStackSteps as n,
  initializeFunctionCallStackModel as o,
  callStackStepControl as r,
  normalizeCallStackValues as s,
  defaultCallStackValues as t,
};
