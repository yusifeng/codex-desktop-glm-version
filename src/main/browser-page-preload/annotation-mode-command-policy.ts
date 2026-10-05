/** Pure policy and envelope helpers for page-to-host annotation mode commands. */
type AnnotationModeTogglePolicyInput = {
  destroyed: boolean;
  canUseSiteAnnotationApi: boolean;
  isAgentControllingBrowser: boolean;
  userActivationActive: boolean;
  force?: boolean;
};

type AnnotationModeToggleCommand = {
  type: `browser-sidebar-runtime-toggle-annotation-mode`;
  force?: boolean;
};

/** Returns the host command when the page is allowed to request a mode change. */
function createAnnotationModeToggleCommand(input: AnnotationModeTogglePolicyInput): AnnotationModeToggleCommand | null {
  if (!canToggleAnnotationMode(input)) return null;
  return { type: `browser-sidebar-runtime-toggle-annotation-mode`, force: input.force };
}

/** A non-forced toggle starts a new request session and clears pending site events. */
function shouldClearAnnotationRequestsForToggle(force?: boolean): boolean {
  return force !== true;
}

export { createAnnotationModeToggleCommand, shouldClearAnnotationRequestsForToggle };
if (typeof module !== `undefined`) module.exports = { createAnnotationModeToggleCommand, shouldClearAnnotationRequestsForToggle };
import { canToggleAnnotationMode } from "./annotation-mode-toggle-eligibility";
