import "@rchunk/rolldown-runtime";

function stringEnum<const Values extends readonly string[]>(values: Values): {
  [Key in Values[number]]: Key;
} {
  return Object.fromEntries(values.map((value) => [value, value])) as {
    [Key in Values[number]]: Key;
  };
}

let promptPresentationType: Record<string, string>;
let promptSentSurfaceType: Record<string, string>;
let promptImpressionEvent: { $type: string };
let promptSelectedEvent: { $type: string };
let promptSentEvent: { $type: string };

function initializeChatGptImageHomeEvents(): void {
  promptPresentationType = stringEnum([
    "CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_UNSPECIFIED",
    "CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_IMAGE_CARD",
    "CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_TEXT_PILL",
    "CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_PORTRAIT",
    "CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_ICON_PILL",
    "UNRECOGNIZED",
  ]);
  promptSentSurfaceType = stringEnum([
    "CHATGPT_IMAGE_PROMPT_SENT_SURFACE_TYPE_UNSPECIFIED",
    "CHATGPT_IMAGE_PROMPT_SENT_SURFACE_TYPE_IMAGES",
    "CHATGPT_IMAGE_PROMPT_SENT_SURFACE_TYPE_PHOTO_BOOTH",
    "CHATGPT_IMAGE_PROMPT_SENT_SURFACE_TYPE_CHATGPT_HOME",
    "UNRECOGNIZED",
  ]);
  promptImpressionEvent = {
    $type: "protobuf_analytics_events.v1.ChatgptImagePromptImpression",
  };
  promptSelectedEvent = {
    $type: "protobuf_analytics_events.v1.ChatgptImagePromptSelected",
  };
  promptSentEvent = {
    $type: "protobuf_analytics_events.v1.ChatgptImagePromptSent",
  };
}

export {
  promptSentSurfaceType as a,
  promptSentEvent as i,
  promptImpressionEvent as n,
  initializeChatGptImageHomeEvents as o,
  promptSelectedEvent as r,
  promptPresentationType as t,
};
