import { Dft as initializeAppConnectNavigation } from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

function shouldNavigateAppConnectLink(_url: string): boolean {
  return false;
}

let initialized = false;
function initializeAppConnectLinkNavigation(): void {
  if (initialized) return;
  initialized = true;
  initializeAppConnectNavigation();
}

export { shouldNavigateAppConnectLink as n, initializeAppConnectLinkNavigation as t };
