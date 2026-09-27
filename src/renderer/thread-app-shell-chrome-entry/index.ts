import { wL as initializeAppRuntime } from "@rchunk/app-shared";
import {
  n as initializeThreadAppShellChrome,
  t as ThreadAppShellChrome,
} from "@rchunk/thread-app-shell-chrome";

initializeAppRuntime();
initializeThreadAppShellChrome();

export { ThreadAppShellChrome };
