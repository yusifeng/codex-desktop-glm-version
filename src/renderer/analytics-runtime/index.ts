// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { xpn as t, ypn as n } from "@rchunk/app-initial";
var r, i, a;
function o() {
  return (o = e(() => {
    ((r = { $type: `protobuf_analytics_events.v1.ChatgptPostShareModalShown` }),
      (i = { $type: `protobuf_analytics_events.v1.ChatgptPostShareCopySuccess` }),
      (a = { $type: `protobuf_analytics_events.v1.ChatgptPostShareCopyFailure` }));
  }))();
}
var s, c;
function l() {
  return (l = e(() => {
    ((s = { $type: `protobuf_analytics_events.v1.ChatgptSharePromptLinkLanded` }),
      (c = { $type: `protobuf_analytics_events.v1.ChatgptSharePromptLinkSubmitted` }));
  }))();
}
function u(e) {
  t(e, r, {});
}
function d(e, n, r) {
  t(e, n === `success` ? i : a, { shareType: `prompt-share`, ...r });
}
function f(e, n) {
  t(e, s, m(n));
}
function p(e, n, r) {
  t(e, c, { ...m(n), submittedPromptTextLength: r == null ? void 0 : String(r) });
}
function m(e) {
  return {
    hasShareId: `true`,
    originalPromptTextLength: String(e.promptTextLength),
    shareId: e.shareId,
    shareSource: `shared_post`,
    sourceConversationIsWorkMode: String(e.sourceConversationIsWorkMode === !0),
  };
}
function h() {
  return (h = e(() => {
    (o(), l(), n());
  }))();
}
export { u as a, p as i, d as n, f as r, h as t };
