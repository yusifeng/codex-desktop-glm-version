// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { POt as t, ROt as n } from "@rchunk/app-initial";
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
