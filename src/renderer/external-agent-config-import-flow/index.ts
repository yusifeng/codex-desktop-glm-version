import "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

const { $i: openExternalAgentImportExport, Qi: initializeExternalAgentImport } =
  appInitialChunk;
initializeExternalAgentImport();
const openExternalAgentImport = openExternalAgentImportExport;
export { openExternalAgentImport };
