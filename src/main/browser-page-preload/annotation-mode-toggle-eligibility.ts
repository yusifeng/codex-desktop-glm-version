type AnnotationModeEligibility = { destroyed: boolean; canUseSiteAnnotationApi: boolean; isAgentControllingBrowser: boolean; userActivationActive: boolean };
/** Pure eligibility gate shared by mode-toggle command creation. */
function canToggleAnnotationMode(input: AnnotationModeEligibility) {
  return !input.destroyed && input.canUseSiteAnnotationApi === true && !input.isAgentControllingBrowser && input.userActivationActive === true;
}
export { canToggleAnnotationMode };
if (typeof module !== `undefined`) module.exports = { canToggleAnnotationMode };
