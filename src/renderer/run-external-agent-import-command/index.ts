import "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

const {
  Ji: initializeExternalAgentCommand,
  Yi: runExternalAgentImportCommand,
} = appInitialChunk;
initializeExternalAgentCommand();
export { runExternalAgentImportCommand };
