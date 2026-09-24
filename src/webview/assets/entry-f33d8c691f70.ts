// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./code-block-execution-4181c76c1863.js",
      "./rolldown-runtime-2d059c5e81f4.js",
      "./app-shared-7b9edc1bfb7f.js",
      "./app-shared-fa570b9eb9dd.css",
      "./app-initial-51da50e6c6e3.js",
      "./app-initial-e8ceb32eb626.css",
      "./ansi-block-5043e88b0254.js",
      "./ansi-block-cecb2c03ae9a.css",
      "./connect-code-execution-sandbox-b02ae1d03047.js",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { H3 as t, V3 as n } from "./app-shared-7b9edc1bfb7f.js";
async function r() {
  return (
    await n(
      async () => {
        let { CodeBlockExecution: e } = await import(`./code-block-execution-4181c76c1863.js`);
        return { CodeBlockExecution: e };
      },
      __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8]),
      import.meta.url,
    )
  ).CodeBlockExecution;
}
function i() {
  return (i = e(() => {
    t();
  }))();
}
i();
export { r as loadCodeBlockExecution };
