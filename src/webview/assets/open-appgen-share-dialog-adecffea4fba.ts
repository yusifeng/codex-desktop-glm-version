// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./appgen-share-dialog-5fd465534630.js",
      "./rolldown-runtime-2d059c5e81f4.js",
      "./app-shared-7b9edc1bfb7f.js",
      "./app-shared-fa570b9eb9dd.css",
      "./app-initial-51da50e6c6e3.js",
      "./app-initial-e8ceb32eb626.css",
      "./appgen-access-50974c702eaf.js",
      "./appgen-site-card-230b77db57a9.js",
      "./app-primary-d66705000d76.js",
      "./app-primary-484df789f2f5.css",
      "./dialog-action-9fe7be84d34e.js",
      "./permission-dropdown-faa59c51006d.js",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { EF as t, H3 as n, TF as r, V3 as i, fI as a } from "./app-shared-7b9edc1bfb7f.js";
import { Uzt as o, Vzt as s, xpn as c, ypn as l } from "./app-initial-51da50e6c6e3.js";
function u(e, n, a) {
  i(
    async () => {
      let { AppgenShareDialog: e } = await import(`./appgen-share-dialog-5fd465534630.js`);
      return { AppgenShareDialog: e };
    },
    __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
    import.meta.url,
  ).then(({ AppgenShareDialog: i }) => {
    try {
      c(e, t, { action: r.CODEX_SITES_SHARING_ACTION_OPENED, projectId: n, source: a.source });
    } catch {}
    o(e, i, { projectId: n, ...a });
  });
}
function d() {
  return (d = e(() => {
    (a(), s(), l(), n());
  }))();
}
export { u as n, d as t };
