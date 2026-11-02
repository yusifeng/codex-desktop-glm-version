// @ts-nocheck
import { createHotkeyThreadRoute as o } from "../app-shared/runtime/navigation-route-policy";
import { n as e } from "@rchunk/rolldown-runtime";
import {
  $3 as t,
  FX as n,
  HX as r,
  I3 as i,
  K2 as a,
  Y2 as s,
  wL as c,
} from "@rchunk/app-shared";
import {
  Dht as l,
  Oht as u,
  mnt as d,
  pnt as f,
} from "@rchunk/app-initial";
import {
  Oo as p,
  c as m,
  dt as h,
  ko as g,
  l as _,
  nt as v,
  o as y,
  rt as b,
  s as x,
  ut as S,
} from "@rchunk/app-primary";
import { n as C, t as w } from "@rchunk/thread-scroll-layout";
import { n as T, r as E } from "@rchunk/use-hotkey-window-detail-layout";
function D() {
  let e = (0, k.c)(7),
    t = r(u),
    n = O,
    i;
  (e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((i = {
        title: (0, A.jsx)(`span`, {
          className: `max-w-full truncate`,
          children: (0, A.jsx)(s, {
            id: `threadPage.newThread`,
            defaultMessage: `New chat`,
            description: `Header title for the home page`,
          }),
        }),
        mainWindowPath: `/`,
        canCollapseToHome: !1,
      }),
      (e[0] = i))
    : (i = e[0]),
    E(i));
  let a;
  e[1] === t
    ? (a = e[2])
    : ((a = (0, A.jsx)(p, {
        children: (0, A.jsx)(S, {
          selectedProject: t,
          showWorkspaceDropdownInUtilityBar: !1,
          onLocalConversationCreated: n,
        }),
      })),
      (e[1] = t),
      (e[2] = a));
  let o;
  e[3] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = (0, A.jsx)(`div`, {
        "aria-hidden": `true`,
        children: (0, A.jsx)(y, { className: `h-12 w-12 text-text/20` }),
      })),
      (e[3] = o))
    : (o = e[3]);
  let c;
  e[4] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((c = (0, A.jsx)(`div`, {
        className: `flex h-full items-center justify-center px-panel`,
        children: (0, A.jsxs)(`div`, {
          className: `flex flex-col items-center gap-3 text-center`,
          children: [
            o,
            (0, A.jsxs)(`div`, {
              className: `flex flex-col items-center gap-1`,
              children: [
                (0, A.jsx)(`div`, {
                  className: `heading-xl mt-2 font-normal text-default select-none`,
                  children: (0, A.jsx)(s, {
                    id: `home.hero.letsBuild`,
                    defaultMessage: `Let’s build`,
                    description: `Label above the workspace name on the electron home page`,
                  }),
                }),
                (0, A.jsx)(m, { variant: `hero` }),
              ],
            }),
          ],
        }),
      })),
      (e[4] = c))
    : (c = e[4]);
  let l;
  return (
    e[5] === a
      ? (l = e[6])
      : ((l = (0, A.jsx)(v, {
          className: `h-full [--padding-panel:calc(var(--padding-panel-base)/2)]`,
          children: (0, A.jsx)(w, { footer: a, children: c }),
        })),
        (e[5] = a),
        (e[6] = l)),
    l
  );
}
function O(e) {
  f.hotkeyWindowHotkeys?.open({ path: o(e) });
}
var k, A;
function j() {
  return (j = e(() => {
    ((k = t()), n(), c(), a(), h(), g(), _(), x(), d(), l(), b(), C(), T(), (A = i()));
  }))();
}
j();
export { D as HotkeyWindowNewThreadPage };
