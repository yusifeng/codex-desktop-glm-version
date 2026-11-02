// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/browser-profile-import-dialog",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/app-primary",
      "./app-primary-484df789f2f5.css",
      "@rchunk/browser-profile-import-analytics",
      "@rchunk/browser-profile-import-query",
      "@rchunk/browser-profile-import-cookies-icon",
      "@rchunk/browser-profile-import-history-icon",
      "@rchunk/google-chrome",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import { H3 as t, V3 as n, e6 as r } from "@rchunk/app-shared";
import { Hzt as i, Uzt as a, Vzt as o } from "@rchunk/app-initial";
import { n as s, t as c } from "@rchunk/browser-profile-import-availability";
import { a as l, t as u } from "@rchunk/browser-profile-import-analytics";
var d, f;
function p() {
  return (p = e(() => {
    ((d = r()),
      t(),
      (f = (0, d.lazy)(async () => ({
        default: (
          await n(
            async () => {
              let { BrowserProfileImportDialogModal: e } = await import(`@rchunk/browser-profile-import-dialog`);
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
