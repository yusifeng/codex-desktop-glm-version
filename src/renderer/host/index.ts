// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/pepper-onboarding-modal",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/pepper-persona",
      "@rchunk/chatgpt-accent-messages",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import {
  $3 as t,
  FX as n,
  H3 as r,
  HX as i,
  I3 as a,
  Jm as o,
  LX as s,
  QI as c,
  V3 as l,
  ZI as u,
  pZ as d,
  qm as f,
  sZ as p,
} from "@rchunk/app-shared";
import {
  $Bt as m,
  Fyt as h,
  Iyt as g,
  LBt as _,
  Sqt as v,
  Sun as y,
  U6t as b,
  bqt as x,
  vun as S,
} from "@rchunk/app-initial";
function C(e) {
  let t = (0, T.c)(4),
    { children: n } = e,
    r = s(u),
    a = i(A),
    o;
  return (
    t[0] !== a || t[1] !== n || t[2] !== r
      ? ((o = n(
          a == null
            ? null
            : {
                id: O,
                render: (e) =>
                  (0, E.jsx)(
                    D,
                    {
                      accountId: a,
                      includeIntro: !0,
                      onClose: () => {
                        (e(), r.set(k, new Set(r.get(k)).add(a)));
                      },
                      onComplete: () => {
                        r.get(b) === a && _(r, O, !0).catch(w);
                      },
                    },
                    a,
                  ),
              },
        )),
        (t[0] = a),
        (t[1] = n),
        (t[2] = r),
        (t[3] = o))
      : (o = t[3]),
    o
  );
}
function w() {}
var T, E, D, O, k, A;
function j() {
  return (j = e(() => {
    ((T = t()),
      n(),
      y(),
      m(),
      v(),
      f(),
      c(),
      h(),
      (E = a()),
      r(),
      (D = o(
        async () =>
          (
            await l(
              async () => {
                let { PepperOnboardingModal: e } = await import(`@rchunk/pepper-onboarding-modal`);
                return { PepperOnboardingModal: e };
              },
              __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7]),
              import.meta.url,
            )
          ).PepperOnboardingModal,
      )),
      (O = `oai/apps/pepperOnboarding`),
      (k = d(u, () => new Set())),
      (A = p(u, ({ get: e }) => {
        let t = e(b),
          n = e(S);
        return e(g) !== `work` ||
          t == null ||
          n.status !== `allowed` ||
          !(`accountId` in n) ||
          n.accountId !== t ||
          n.accountStructure !== `personal` ||
          e(k).has(t)
          ? null
          : e(x).data?.eligibleAnnouncements?.includes(O)
            ? t
            : null;
      })));
  }))();
}
j();
export { C as PepperOnboardingAnnouncementHost };
