// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/appgen-share-dialog",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/appgen-access",
      "@rchunk/appgen-site-card",
      "@rchunk/app-primary",
      "./app-primary-484df789f2f5.css",
      "@rchunk/dialog-action",
      "@rchunk/permission-dropdown",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import { EF as t, H3 as n, TF as r, V3 as i, fI as a } from "@rchunk/app-shared";
import { Uzt as o, Vzt as s, xpn as c, ypn as l } from "@rchunk/app-initial";
function u(e, n, a) {
  i(
    async () => {
      let { AppgenShareDialog: e } = await import(`@rchunk/appgen-share-dialog`);
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
