// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./rpc-971deaddf2c2.js",
      "./app-initial-51da50e6c6e3.js",
      "./rolldown-runtime-2d059c5e81f4.js",
      "./app-shared-7b9edc1bfb7f.js",
      "./app-shared-fa570b9eb9dd.css",
      "./app-initial-e8ceb32eb626.css",
      "./app-main-be230e7e4f5a.js",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { t } from "./modulepreload-polyfill-f3909396b544.js";
import { H3 as n, V3 as r, W3 as i } from "./app-shared-7b9edc1bfb7f.js";
function a() {
  return (a = e(async () => {
    (i(),
      n(),
      await r(
        () => import(`./rpc-971deaddf2c2.js`),
        __vite__mapDeps([0, 1, 2, 3, 4, 5]),
        import.meta.url,
      ),
      await r(
        () => import(`./app-main-be230e7e4f5a.js`),
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
