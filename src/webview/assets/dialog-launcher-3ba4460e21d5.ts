// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./dialog-d7d4fcb916e3.js",
      "./rolldown-runtime-2d059c5e81f4.js",
      "./app-shared-7b9edc1bfb7f.js",
      "./app-shared-fa570b9eb9dd.css",
      "./app-initial-51da50e6c6e3.js",
      "./app-initial-e8ceb32eb626.css",
      "./app-primary-d66705000d76.js",
      "./app-primary-484df789f2f5.css",
      "./analytics-363d04057f73.js",
      "./query-8542d2419280.js",
      "./cookies-c14d68c334b1.js",
      "./history-f399ce44d7da.js",
      "./google-chrome-92f5e2c98419.js",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { H3 as t, V3 as n, e6 as r } from "./app-shared-7b9edc1bfb7f.js";
import { Hzt as i, Uzt as a, Vzt as o } from "./app-initial-51da50e6c6e3.js";
import { n as s, t as c } from "./availability-7faf4f21a73f.js";
import { a as l, t as u } from "./analytics-363d04057f73.js";
var d, f;
function p() {
  return (p = e(() => {
    ((d = r()),
      t(),
      (f = (0, d.lazy)(async () => ({
        default: (
          await n(
            async () => {
              let { BrowserProfileImportDialogModal: e } = await import(`./dialog-d7d4fcb916e3.js`);
              return { BrowserProfileImportDialogModal: e };
            },
            __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
            import.meta.url,
          )
        ).BrowserProfileImportDialogModal,
      }))));
  }))();
}
function m(e, t, n, r) {
  if (t == null || !e.get(s)) return !1;
  if (i(e, f)) return !0;
  let o = r ?? crypto.randomUUID();
  return (l(e, n, o), a(e, f, { entryPoint: n, flowId: o, service: t }), !0);
}
function h() {
  return (h = e(() => {
    (o(), u(), c(), p());
  }))();
}
export { m as n, h as t };
