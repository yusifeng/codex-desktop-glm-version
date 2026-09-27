import { FX as initializeSignalRuntime } from "@rchunk/app-shared";
import {
  FR as openMcpExtensionThreadSidePanelTab,
  IR as restoreMcpExtensionSidePanelTab,
  MR as initializeMcpExtensionSidePanelTab,
  NR as mcpExtensionTabType,
  PR as openMcpExtensionFileViewerSidePanelTab,
} from "@rchunk/app-initial";

initializeSignalRuntime();
initializeMcpExtensionSidePanelTab();

export {
  mcpExtensionTabType,
  openMcpExtensionFileViewerSidePanelTab,
  openMcpExtensionThreadSidePanelTab,
  restoreMcpExtensionSidePanelTab,
};
