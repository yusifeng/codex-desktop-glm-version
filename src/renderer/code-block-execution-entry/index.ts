// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/code-block-execution",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/ansi-block",
      "./ansi-block-cecb2c03ae9a.css",
      "@rchunk/code-execution-sandbox-connection",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import { H3 as t, V3 as n } from "@rchunk/app-shared";
async function r() {
  return (
    await n(
      async () => {
        let { CodeBlockExecution: e } = await import(`@rchunk/code-block-execution`);
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
