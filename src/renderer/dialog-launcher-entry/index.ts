// Browser profile import dialog 的稳定公开入口。
import {
  n as openDialog,
  t as initializeDialogLauncher,
} from "@rchunk/dialog-launcher-core";

initializeDialogLauncher();

export { openDialog as openBrowserProfileImportDialog };
