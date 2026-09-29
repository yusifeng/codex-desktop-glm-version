import "@rchunk/app-shared";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as openTargetChunk from "@rchunk/open-target";
import * as backgroundAgentChunk from "@rchunk/open-local-conversation-background-agent";

const primaryRuntime = appPrimaryChunk as unknown as {
  Gr(...arguments_: unknown[]): unknown;
};
const targetRuntime = openTargetChunk as unknown as {
  t(...arguments_: unknown[]): unknown;
};
const backgroundRuntime = backgroundAgentChunk as unknown as {
  n(): void;
  r(...arguments_: unknown[]): unknown;
  t: unknown;
};

const { Gr: openHydratedLocalConversationSubagent } = primaryRuntime;
const { t: getLocalConversationBackgroundAgentOpenTarget } = targetRuntime;
const {
  n: initializeBackgroundAgentEntry,
  r: openLocalConversationBackgroundAgent,
  t: backgroundAgentTabType,
} = backgroundRuntime;

initializeBackgroundAgentEntry();

export {
  backgroundAgentTabType,
  getLocalConversationBackgroundAgentOpenTarget,
  openHydratedLocalConversationSubagent,
  openLocalConversationBackgroundAgent,
};
