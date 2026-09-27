import "@rchunk/rolldown-runtime";

const chatGptCmeHomeEntryClicked = {
  $type: "protobuf_analytics_events.v1.ChatgptCmeHomeEntryClicked",
} as const;
const chatGptCmeClaimSubmitted = {
  $type: "protobuf_analytics_events.v1.ChatgptCmeClaimSubmitted",
} as const;
function initializeChatGptCmeEvents(): void {}
export {
  chatGptCmeHomeEntryClicked as n,
  initializeChatGptCmeEvents as r,
  chatGptCmeClaimSubmitted as t,
};
