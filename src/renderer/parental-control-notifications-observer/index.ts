// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/parental-control-notifications-runtime",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/settings-parental-presentation",
      "@rchunk/u18-banner-logging",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import {
  FX as t,
  H3 as n,
  Q3 as r,
  QI as i,
  V3 as a,
  Z3 as o,
  ZI as s,
  sZ as c,
} from "@rchunk/app-shared";
import { bL as l, xL as u } from "@rchunk/app-initial";
function d(e) {
  return e.watch(({ get: t }) => {
    let n = t(f);
    if (n == null) return;
    let i = !1,
      o;
    return (
      a(
        async () => {
          let { listenForParentalControlNotifications: e } = await import(
            `@rchunk/parental-control-notifications-runtime`
          );
          return { listenForParentalControlNotifications: e };
        },
        __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7]),
        import.meta.url,
      )
        .then(({ listenForParentalControlNotifications: t }) => {
          i || (o = t(e, n.userId, n.accountId));
        })
        .catch(() => {
          i || r.warning(`chatgpt_family_notifications_initialization_failed`);
        }),
      () => {
        ((i = !0), o?.());
      }
    );
  });
}
var f;
function p() {
  return (p = e(() => {
    (t(),
      i(),
      u(),
      o(),
      n(),
      (f = c(
        s,
        ({ get: e }) => {
          let t = e(l);
          return t.status === `allowed` ? { userId: t.userId, accountId: t.accountId } : null;
        },
        { isEqual: (e, t) => e?.userId === t?.userId && e?.accountId === t?.accountId },
      )));
  }))();
}
p();
export { d as observeParentalControlNotifications };
