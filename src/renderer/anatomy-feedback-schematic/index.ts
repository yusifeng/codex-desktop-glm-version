// Anatomy negative-feedback schematic primitives. Release chunk: anatomy-feedback-schematic-88345e8df0bb.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as strokeChunk from "@rchunk/learning-block-stroke";
import * as pathChunk from "@rchunk/learning-block-path";

interface Point {
  x: number;
  y: number;
}
interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
  jsxs(type: unknown, props: Record<string, unknown>): unknown;
}
let jsxRuntime: JsxRuntime;
const bodyPath =
  "M195 78 C174 82 160 94 157 119 L145 190 M225 78 C246 82 260 94 263 119 L275 190 M180 91 C173 129 173 174 181 216 L179 326 M240 91 C247 129 247 174 239 216 L241 326 M181 216 C190 226 199 230 210 230 C221 230 230 226 239 216 M210 230 L201 326 M210 230 L219 326";
function AnatomyBody({
  children,
  outlineColor = "var(--text-tertiary)",
  surfaceColor = "var(--learning-block-visualization-surface, var(--bg-primary))",
}: {
  children?: unknown;
  outlineColor?: string;
  surfaceColor?: string;
}): unknown {
  return jsxRuntime.jsxs("g", {
    "data-anatomy-body": "endocrine",
    children: [
      jsxRuntime.jsx("circle", {
        cx: 210,
        cy: 44,
        r: 27,
        fill: surfaceColor,
        stroke: outlineColor,
        strokeWidth: 2.5,
      }),
      jsxRuntime.jsx("path", {
        d: bodyPath,
        fill: "none",
        stroke: outlineColor,
        strokeWidth: 2.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      children,
    ],
  });
}
function NegativeFeedbackPath({
  capOrientation = "vertical",
  color,
  endTangent,
  opacity,
  path,
  strokeWidth = 3,
  target,
}: {
  capOrientation?: "vertical" | "horizontal";
  color: string;
  endTangent?: Point;
  opacity?: number;
  path: unknown;
  strokeWidth?: number;
  target: Point;
}): unknown {
  const from =
    capOrientation === "vertical"
      ? { x: target.x, y: target.y - 8 }
      : { x: target.x - 8, y: target.y };
  const to =
    capOrientation === "vertical"
      ? { x: target.x, y: target.y + 8 }
      : { x: target.x + 8, y: target.y };
  const Path = (pathChunk as unknown as { t: unknown }).t;
  const Stroke = (strokeChunk as unknown as { r: unknown }).r;
  return jsxRuntime.jsxs("g", {
    opacity,
    "data-negative-feedback-path": true,
    children: [
      jsxRuntime.jsx(Path, {
        path,
        endTangent,
        variant: "guideDashed",
        color,
        strokeWidth,
      }),
      jsxRuntime.jsx(Stroke, {
        from,
        to,
        variant: "solidAccent",
        color,
        strokeWidth,
      }),
    ],
  });
}
function initializeAnatomyFeedbackSchematic(): void {
  (pathChunk as unknown as { n?: () => void }).n?.();
  (strokeChunk as unknown as { i?: () => void }).i?.();
  jsxRuntime = (appSharedChunk as unknown as { I3(): JsxRuntime }).I3();
}

export {
  NegativeFeedbackPath as n,
  initializeAnatomyFeedbackSchematic as r,
  AnatomyBody as t,
};
