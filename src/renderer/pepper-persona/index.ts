// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f || (m.f = ["@rchunk/persona-runtime", "@rchunk/rolldown-runtime"]),
) => i.map((i) => d[i]);
import { n as e, o as t } from "@rchunk/rolldown-runtime";
import { H3 as n, V3 as r, vW as i, wL as a } from "@rchunk/app-shared";
import { cJt as o, rJt as s } from "@rchunk/app-initial";
function c({ accountId: e, kind: n = `age`, onLoad: a, onComplete: o, onCancel: c, onError: l }) {
  let u = new AbortController(),
    d = !1,
    f = null,
    p = () => {
      ((d = !0), u.abort(), f?.destroy(), (f = null));
    },
    m =
      n === `guardian`
        ? `/compliance/guardian_verification/persona/inquiries`
        : `/compliance/age_verification/persona/inquiries`,
    h = n === `guardian` ? { "ChatGPT-Account-ID": e, [i]: e } : { "ChatGPT-Account-ID": e };
  return (
    Promise.all([
      r(
        () => import(`@rchunk/persona-runtime`).then((e) => t(e.default, 1)),
        __vite__mapDeps([0, 1]),
        import.meta.url,
      ),
      s.safePost(m, { additionalHeaders: h, requestBody: { enabled: !0 }, signal: u.signal }),
    ])
      .then(([{ default: e }, t]) => {
        d ||
          ((f = new e.Client({
            inquiryId: t.id,
            onLoad: () => {
              d || a?.();
            },
            onComplete: () => {
              d || (p(), o());
            },
            onCancel: () => {
              d || (p(), c());
            },
            onError: () => {
              d || (p(), l());
            },
          })),
          f.open());
      })
      .catch(() => {
        d || (p(), l());
      }),
    p
  );
}
function l() {
  return (l = e(() => {
    (a(), o(), n());
  }))();
}
export { c as n, l as t };
