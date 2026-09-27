import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";

const { I3: getJsxRuntime, e6: getReactRuntime } = appSharedChunk;
let jsx: JsxRuntime;

function CookiesIcon(props: Record<string, unknown>): unknown {
  initializeCookiesIcon();
  return jsx.jsxs("svg", {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ...props,
    children: [
      jsx.jsx("path", {
        d: "M12 2A10 10 0 1 0 22 12C19.7909 12 18 10.2091 18 8C15.7909 8 14 6.20914 14 4C14 3.3072 13.824 2.6555 13.5143 2.0873C13.0186 2.02962 12.5139 2 12 2Z",
        stroke: "currentColor",
        strokeWidth: 1.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      ...[
        [12, 7],
        [7.5, 11],
        [11.5, 15],
        [16, 12.5],
      ].map(([cx, cy]) =>
        jsx.jsx("circle", { cx, cy, r: 1, fill: "currentColor" }),
      ),
    ],
  });
}

let initialized = false;
function initializeCookiesIcon(): void {
  if (initialized) return;
  getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}
initializeCookiesIcon();
export { initializeCookiesIcon as n, CookiesIcon as t };
