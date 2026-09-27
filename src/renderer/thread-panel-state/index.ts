import {
  _vt as initializeThreadAccounts,
  fvt as activateThreadPanelTab,
  hvt as getThreadPanelTabController,
} from "@rchunk/app-initial";

initializeThreadAccounts();

export { activateThreadPanelTab, getThreadPanelTabController };
