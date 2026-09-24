// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./notifications-runtime-a5056e67819a.js",
      "./rolldown-runtime-2d059c5e81f4.js",
      "./app-shared-7b9edc1bfb7f.js",
      "./app-shared-fa570b9eb9dd.css",
      "./app-initial-51da50e6c6e3.js",
      "./app-initial-e8ceb32eb626.css",
      "./presentation-eeb7ac6fced2.js",
      "./u18-banner-logging-126c6aef16d2.js",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import {
  FX as t,
  H3 as n,
  Q3 as r,
  QI as i,
  V3 as a,
  Z3 as o,
  ZI as s,
  sZ as c,
} from "./app-shared-7b9edc1bfb7f.js";
import { bL as l, xL as u } from "./app-initial-51da50e6c6e3.js";
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
            `./notifications-runtime-a5056e67819a.js`
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
