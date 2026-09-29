// SVG solid, dotted, and line pattern fills. Release chunk: shape-fill-8f10786c12a1.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

interface ShapeFill {
  id: string;
  pattern: string;
  color?: string | null;
}
interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
}

interface SharedRuntime {
  I3(): JsxRuntime;
}

const sharedRuntime = appSharedChunk as unknown as SharedRuntime;
let fillValue: (fill: ShapeFill) => string;
let FillPattern: (fill: ShapeFill) => unknown;
let initialized = false;

function initialize(): void {
  if (initialized) return;
  initialized = true;
  const jsx = sharedRuntime.I3();
  const defaultColor = "var(--icon-accent)";
  const dottedPatternSize = 6;
  const dotPosition = 1;
  const linePatternSize = 15;
  const lineRotationDegrees = 30;

  fillValue = (fill) =>
    fill.pattern === "solid"
      ? (fill.color ?? defaultColor)
      : `url(#${fill.id})`;

  FillPattern = (fill) => {
    if (fill.pattern === "solid") return null;
    const color = fill.color ?? defaultColor;
    if (fill.pattern === "dotted") {
      return jsx.jsx("pattern", {
        id: fill.id,
        width: dottedPatternSize,
        height: dottedPatternSize,
        patternUnits: "userSpaceOnUse",
        children: jsx.jsx("circle", {
          cx: dotPosition,
          cy: dotPosition,
          r: dotPosition,
          fill: color,
        }),
      });
    }
    return jsx.jsx("pattern", {
      id: fill.id,
      width: linePatternSize,
      height: linePatternSize,
      patternUnits: "userSpaceOnUse",
      patternTransform: `rotate(${lineRotationDegrees})`,
      children: jsx.jsx("line", {
        x1: "0",
        y1: "0",
        x2: "0",
        y2: linePatternSize,
        stroke: color,
        strokeWidth: "1",
      }),
    });
  };
}

export { fillValue as n, initialize as r, FillPattern as t };
