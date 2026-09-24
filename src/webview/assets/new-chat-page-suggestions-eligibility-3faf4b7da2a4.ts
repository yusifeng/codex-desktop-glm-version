// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { $3 as t, $O as n, _L as r, ek as i, gL as a } from "./app-shared-7b9edc1bfb7f.js";
import { mnt as o, pnt as s } from "./app-initial-51da50e6c6e3.js";
function c(e) {
  let t = (0, m.c)(9),
    { accountId: i, enabled: a, hostId: o } = e,
    c;
  t[0] !== i || t[1] !== o ? ((c = l(o, i)), (t[0] = i), (t[1] = o), (t[2] = c)) : (c = t[2]);
  let u;
  t[3] === o
    ? (u = t[4])
    : ((u = async () =>
        (await s.ambientSuggestions?.hasAccessibleAndEnabledApp({ hostId: o })) ?? !1),
      (t[3] = o),
      (t[4] = u));
  let d;
  return (
    t[5] !== a || t[6] !== c || t[7] !== u
      ? ((d = { queryKey: c, queryFn: u, enabled: a, retry: !1, staleTime: n.FIVE_MINUTES }),
        (t[5] = a),
        (t[6] = c),
        (t[7] = u),
        (t[8] = d))
      : (d = t[8]),
    r(d)
  );
}
function l(e, t) {
  return [...u(e), t];
}
function u(e) {
  return [`new-chat-suggestion-source`, `has-accessible-enabled-ambient-suggestion-app`, e];
}
function d({ debugOverride: e, experimentEligible: t, personalized: n }) {
  return e ?? (t && n ? `generated` : `curated`);
}
function f({
  canUsePersonalizedSuggestions: e,
  generatedSuggestionsEnabled: t,
  hasGeneratedSuggestionsReadSettled: n,
  shouldUseCuratedNewChatPageSuggestions: r,
}) {
  return r || !t || !e ? !0 : n;
}
function p({
  areNewChatPageSuggestionsLoading: e,
  hasProjectRoot: t,
  shouldShowHomeSuggestions: n,
  shouldUseCuratedNewChatPageSuggestions: r,
}) {
  return e ? !1 : r ? !0 : t && n;
}
var m;
function h() {
  return (h = e(() => {
    ((m = t()), a(), o(), i());
  }))();
}
export { h as a, f as i, u as n, c as o, d as r, p as t };
