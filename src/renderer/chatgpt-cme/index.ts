import "@rchunk/rolldown-runtime";

let chatGptCmeHomeEntryClicked: { readonly $type: string };
let chatGptCmeClaimSubmitted: { readonly $type: string };
function initializeChatGptCmeEvents(): void {
  chatGptCmeHomeEntryClicked = {
    $type: "protobuf_analytics_events.v1.ChatgptCmeHomeEntryClicked",
  };
  chatGptCmeClaimSubmitted = {
    $type: "protobuf_analytics_events.v1.ChatgptCmeClaimSubmitted",
  };
}
export {
  chatGptCmeHomeEntryClicked as n,
  initializeChatGptCmeEvents as r,
  chatGptCmeClaimSubmitted as t,
};
