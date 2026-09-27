import "@rchunk/rolldown-runtime";
import {
  G2 as defineMessages,
  K2 as initializeInternationalization,
} from "@rchunk/app-shared";

const securityHistoryMessages = defineMessages({
  title: {
    id: "chatgpt.settings.security.history.title",
    defaultMessage: "Security history",
    description:
      "Short title for the nested Security history screen and its entry row in ChatGPT Settings > Security and login.",
  },
  description: {
    id: "chatgpt.settings.security.history.description",
    defaultMessage: "Review login activity and changes to your security settings.",
    description:
      "One-sentence description shown with the Security history entry and nested screen.",
  },
});

function initializeSecurityHistoryMessages(): void {
  initializeInternationalization();
}

export { initializeSecurityHistoryMessages as n, securityHistoryMessages as t };
