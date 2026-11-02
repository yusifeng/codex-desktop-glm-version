// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/personal-secrets-dialog",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/personal-secrets-service",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import { H3 as t, V3 as n } from "@rchunk/app-shared";
import {
  Hzt as r,
  Sun as i,
  Uzt as a,
  Vzt as o,
  _cn as s,
  _un as c,
  mun as l,
  wcn as u,
  yun as d,
  zzt as f,
} from "@rchunk/app-initial";
import { n as p, t as m } from "@rchunk/personal-secrets-service";
async function h(e, t, i) {
  let o = await p(t);
  if (o?.issues.length === 0) return;
  let { PersonalSecretsDialog: s } = await n(
      async () => {
        let { PersonalSecretsDialog: e } = await import(`@rchunk/personal-secrets-dialog`);
        return { PersonalSecretsDialog: e };
      },
      __vite__mapDeps([0, 1, 2, 3, 4, 5, 6]),
      import.meta.url,
    ),
    m = !0,
    h = (e) =>
      m &&
      !e.get(d).authLoading &&
      e.get(l) === t.accountId &&
      e.get(c) === t.userId &&
      i(e, t.config.id) &&
      (e.get(u)?.projectId ?? null) === t.projectId;
  if (!h(e)) return;
  if (r(e, s))
    throw new DOMException(`A Cloud task is already awaiting personal secrets`, `AbortError`);
  let g = !1;
  a(e, s, {
    selection: t,
    initialPreflight: o,
    isCurrent: () => h(e),
    onClose: () => {
      g = !0;
    },
  });
  try {
    if ((await e.when((e) => !h(e) || !r(e, s)), !g && h(e)))
      throw new DOMException(`Personal secrets prompt was interrupted`, `AbortError`);
  } finally {
    ((m = !1), f(e, s));
  }
}
function g() {
  return (g = e(() => {
    (i(), o(), s(), m(), t());
  }))();
}
g();
export { h as preparePersonalSecrets };
