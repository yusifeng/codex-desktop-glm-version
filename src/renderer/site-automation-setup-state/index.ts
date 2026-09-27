import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignalRuntime,
  QI as initializeQueryRuntime,
  ZI as appScope,
  oZ as createSignalFamily,
} from "@rchunk/app-shared";

let siteAutomationSetupState: unknown;

function initializeSiteAutomationSetupState(): void {
  initializeSignalRuntime();
  initializeQueryRuntime();
  siteAutomationSetupState = createSignalFamily(appScope, () => null);
}

export {
  siteAutomationSetupState as n,
  initializeSiteAutomationSetupState as t,
};
