// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f || (m.f = ["@rchunk/persona-runtime", "@rchunk/rolldown-runtime"]),
) => i.map((i) => d[i]);
import { n as e, o as t } from "@rchunk/rolldown-runtime";
import { H3 as n, V3 as r } from "@rchunk/app-shared";
import { cJt as i, rJt as a } from "@rchunk/app-initial";
function o({ accountId: e, onLoad: n, onComplete: i, onCancel: o, onError: s }) {
  let c = new AbortController(),
    l = !1,
    u = null,
    d = () => {
      ((l = !0), c.abort());
      let e = u;
      ((u = null), e?.destroy());
    },
    f = (e) => {
      l || (d(), s(e));
    };
  return (
    Promise.all([
      r(
        () => import(`@rchunk/persona-runtime`).then((e) => t(e.default, 1)),
        __vite__mapDeps([0, 1]),
        import.meta.url,
      ),
      a.safePost(`/compliance/npi_verification/persona/inquiries`, {
        additionalHeaders: e == null ? {} : { "Chatgpt-Account-Id": e },
        requestBody: { enabled: !0 },
        signal: c.signal,
      }),
    ])
      .then(([{ default: e }, t]) => {
        if (l) return;
        let r = new e.Client({
          inquiryId: t.id,
          onLoad: () => {
            l || n?.();
          },
          onComplete: () => {
            l || (d(), i());
          },
          onCancel: () => {
            l || (d(), o());
          },
          onError: (e) => {
            f(Error(e.message ?? e.code, { cause: e }));
          },
        });
        if (l) {
          r.destroy();
          return;
        }
        ((u = r), u.open());
      })
      .catch((e) => {
        f(e instanceof Error ? e : Error(`Could not start Persona verification`, { cause: e }));
      }),
    d
  );
}
function s() {
  return (s = e(() => {
    (i(), n());
  }))();
}
export { o as n, s as t };
