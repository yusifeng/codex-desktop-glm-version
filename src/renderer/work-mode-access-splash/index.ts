// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n, K2 as r, Y2 as i } from "@rchunk/app-shared";
import { Cg as a, wg as o } from "@rchunk/app-primary";
import { n as s, t as c } from "@rchunk/access-splash";
function l(e) {
  let t = (0, u.c)(8),
    { modeToggle: n } = e,
    r;
  t[0] === n
    ? (r = t[1])
    : ((r =
        n == null ? null : (0, d.jsx)(d.Fragment, { children: (0, d.jsx)(a, { children: n }) })),
      (t[0] = n),
      (t[1] = r));
  let o, s, l;
  t[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = (0, d.jsx)(i, {
        id: `composer.home.workModeAccessSplash.accessMessage`,
        defaultMessage: `You don’t have access to Work yet. Contact your admin to request access.`,
        description: `Status shown above the Work access splash when the user's workspace has not enabled Work, directing them to contact their admin`,
      })),
      (s = (0, d.jsx)(i, {
        id: `composer.home.workModeAccessSplash.description`,
        defaultMessage: `Research across your tools, create documents and presentations, and take action with ChatGPT`,
        description: `Description shown when a user selects Work mode but their workspace has not enabled Work`,
      })),
      (l = (0, d.jsx)(i, {
        id: `composer.home.workModeAccessSplash.learnMore`,
        defaultMessage: `Learn more about Work`,
        description: `Link below the Work access splash that opens an overview of Work`,
      })),
      (t[2] = o),
      (t[3] = s),
      (t[4] = l))
    : ((o = t[2]), (s = t[3]), (l = t[4]));
  let f;
  t[5] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((f = (0, d.jsx)(c, {
        accessMessage: o,
        description: s,
        learnMoreLabel: l,
        learnMoreUrl: `https://openai.com/chatgpt-work/`,
        title: (0, d.jsx)(i, {
          id: `composer.home.workModeAccessSplash.title`,
          defaultMessage: `Turn complex tasks into finished work`,
          description: `Title shown when a user selects Work mode but their workspace has not enabled Work`,
        }),
      })),
      (t[5] = f))
    : (f = t[5]);
  let p;
  return (
    t[6] === r
      ? (p = t[7])
      : ((p = (0, d.jsxs)(d.Fragment, { children: [r, f] })), (t[6] = r), (t[7] = p)),
    p
  );
}
var u, d;
function f() {
  return (f = e(() => {
    ((u = t()), r(), o(), s(), (d = n()));
  }))();
}
f();
export { l as WorkModeAccessSplash };
