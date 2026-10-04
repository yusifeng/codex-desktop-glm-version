export type HostHandoffProgressStatus = `started` | `completed` | `failed`;

/**
 * Owns the small state machine used by host handoff progress reporting.
 * Keeping the active-step bookkeeping here lets the transfer orchestrator
 * focus on Git/Filesystem effects while preserving its failure envelope.
 */
function createHostHandoffProgress(onProgress: (step: string, status: HostHandoffProgressStatus) => void) {
  let activeStep: string | null = null;
  const progress = (step: string, status: HostHandoffProgressStatus) => {
    if (status === `started`) activeStep = step;
    else if (activeStep === step) activeStep = null;
    onProgress(step, status);
  };
  const failActive = () => {
    if (activeStep != null) progress(activeStep, `failed`);
  };
  return { progress, failActive, get activeStep() { return activeStep; } };
}

export { createHostHandoffProgress };
if (typeof module !== `undefined`) module.exports = { createHostHandoffProgress };
