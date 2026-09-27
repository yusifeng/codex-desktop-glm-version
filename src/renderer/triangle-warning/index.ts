import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";

const { I3: getJsxRuntime, e6: getReactRuntime } = appSharedChunk;
let jsx: JsxRuntime;
function TriangleWarningIcon(props: Record<string, unknown>): unknown {
  initializeTriangleWarningIcon();
  return jsx.jsxs("svg", {
    width: 20,
    height: 20,
    viewBox: "0 0 20 20",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ...props,
    children: [
      jsx.jsx("path", {
        d: "M8.505 3.645c.657-1.147 2.333-1.147 2.99 0l6.025 10.526c.64 1.119-.176 2.504-1.495 2.504H3.975c-1.319 0-2.135-1.385-1.495-2.504L8.505 3.645Z",
        stroke: "currentColor",
        strokeWidth: 1.5,
        strokeLinejoin: "round",
      }),
      jsx.jsx("path", {
        d: "M10 7.083v3.334",
        stroke: "currentColor",
        strokeWidth: 1.5,
        strokeLinecap: "round",
      }),
      jsx.jsx("path", {
        d: "M10 13.333h.008",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
      }),
    ],
  });
}
let initialized = false;
function initializeTriangleWarningIcon(): void {
  if (initialized) return;
  getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}
initializeTriangleWarningIcon();
export { initializeTriangleWarningIcon as n, TriangleWarningIcon as t };
