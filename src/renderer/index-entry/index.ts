// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/rpc",
      "@rchunk/app-initial",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/app-main",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import { t } from "@rchunk/modulepreload-polyfill";
import { H3 as n, V3 as r, W3 as i } from "@rchunk/app-shared";
function a() {
  return (a = e(async () => {
    (i(),
      n(),
      await r(
        () => import(`@rchunk/rpc`),
        __vite__mapDeps([0, 1, 2, 3, 4, 5]),
        import.meta.url,
      ),
      await r(
        () => import(`@rchunk/app-main`),
        __vite__mapDeps([6, 2, 3, 4, 1, 5]),
        import.meta.url,
      ));
  }))();
}
function o() {
  return (o = e(async () => {
    (t(), await a());
  }))();
}
await o();
