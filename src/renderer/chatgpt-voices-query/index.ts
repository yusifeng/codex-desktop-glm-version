// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { FX as t, QI as n, QX as r, ZI as i } from "@rchunk/app-shared";
import {
  Sqt as a,
  U6t as o,
  bqt as s,
  cJt as c,
  gdn as l,
  hdn as u,
  rJt as d,
} from "@rchunk/app-initial";
var f, p;
function m() {
  return (m = e(() => {
    (t(),
      c(),
      a(),
      n(),
      l(),
      (f = [`chatgpt-settings-voices`]),
      (p = r(i, ({ spoken_language: e, voice_mode: t = `advanced` }, { get: n }) => {
        let r = e ?? n(s).data?.voiceMainLanguage,
          i = r == null || r === `auto` ? u() : r;
        return {
          queryKey: [...f, n(o), t, i],
          queryFn: () =>
            d.safeGet(`/settings/voices`, {
              parameters: { query: { spoken_language: i, voice_mode: t } },
            }),
          select: (e) => ({
            ...e,
            voices: e.voices.map((e) => ({
              description: e.description ?? ``,
              name: e.name ?? e.voice,
              orbTreatment: `advanced-blue`,
              previewUrl: e.preview_url,
              slug: e.voice,
            })),
          }),
          staleTime: 0,
          refetchOnMount: `always`,
          retryOnMount: !0,
        };
      })));
  }))();
}
export { p as n, m as r, f as t };
