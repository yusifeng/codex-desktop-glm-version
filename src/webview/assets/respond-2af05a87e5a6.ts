// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { POt as t, ROt as n } from "./app-initial-51da50e6c6e3.js";
async function r(
  e,
  {
    action: t,
    conversationId: r,
    elicitationResponse: i,
    isApiToolElicitation: a,
    isTemporaryChat: o,
    model: s,
    recipient: c,
  },
) {
  await n(e, {
    conversationId: r,
    isTemporaryChat: o,
    model: s,
    prompt: ``,
    toolApproval: {
      action: t.type,
      actionData: t,
      elicitationResponse: i,
      isApiToolElicitation: a,
      recipient: c,
      targetMessageId: t.target_message_id,
    },
  });
}
function i() {
  return (i = e(() => {
    t();
  }))();
}
export { r as n, i as t };
