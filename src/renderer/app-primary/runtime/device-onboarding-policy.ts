/** Decide whether Codex Micro device onboarding should be shown. */
export function shouldShowDeviceOnboarding({
  deviceStatus,
  hasEverBeenDetected,
  onboardingState,
}: {
  deviceStatus: string;
  hasEverBeenDetected: boolean | null | undefined;
  onboardingState: string;
}): boolean {
  return onboardingState === "pending"
    ? true
    : onboardingState !== "idle" || hasEverBeenDetected !== false
      ? false
      : deviceStatus === "detected" || deviceStatus === "connected";
}
