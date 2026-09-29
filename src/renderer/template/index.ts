// Three-side numeric-control template used by the Heron-formula visualization.
// Release chunk: template-aa40bbaeb218.js.
import "@rchunk/rolldown-runtime";

interface NumericControl {
  min: number;
  max: number;
  step: number;
  label: "a" | "b" | "c";
  defaultValue: number;
}

const sharedSideRange = { min: 4, max: 12, step: 0.1 };
const sideAControl: NumericControl = { ...sharedSideRange, label: "a", defaultValue: 7 };
const sideBControl: NumericControl = { ...sharedSideRange, label: "b", defaultValue: 8 };
const sideCControl: NumericControl = { ...sharedSideRange, label: "c", defaultValue: 9 };
const triangleSideTemplate = { properties: { a: sideAControl, b: sideBControl, c: sideCControl } };

function initializeTriangleSideTemplate(): void {}

export {
  initializeTriangleSideTemplate as a,
  triangleSideTemplate as i,
  sideBControl as n,
  sideCControl as r,
  sideAControl as t,
};
