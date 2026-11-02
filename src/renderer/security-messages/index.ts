// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { G2 as t, K2 as n } from "@rchunk/app-shared";
var r;
function i() {
  return (i = e(() => {
    (n(),
      (r = t({
        title: {
          id: `chatgpt.settings.security.history.title`,
          defaultMessage: `Security history`,
          description: `Short title for the nested Security history screen and its entry row in ChatGPT Settings > Security and login. End users open this surface to review security-related account activity.`,
        },
        description: {
          id: `chatgpt.settings.security.history.description`,
          defaultMessage: `Review login activity and changes to your security settings.`,
          description: `One-sentence description shown with the Security history entry and at the top of the nested Security history screen in ChatGPT Settings > Security and login. It explains that the list contains login activity and changes to security settings. This is compact supporting copy with no placeholders.`,
        },
      })));
  }))();
}
export { i as n, r as t };
