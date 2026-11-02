export type EligibilityStatus = "loading" | "eligible" | "ineligible";

/** Project the common loading/eligibility state used by announcement surfaces. */
export function getEligibilityStatus({
  isEligible,
  isLoading,
}: {
  isEligible: boolean;
  isLoading: boolean;
}): EligibilityStatus {
  return isLoading ? "loading" : isEligible ? "eligible" : "ineligible";
}

/** Project whether an enabled takeover target is pending or unavailable. */
export function getTakeoverAvailabilityStatus(
  enabled: boolean,
  capability: { isAvailable: boolean; target: unknown },
): { isPending: boolean; isUnavailable: boolean } {
  return {
    isPending: enabled && capability.isAvailable && capability.target == null,
    isUnavailable: enabled && !capability.isAvailable,
  };
}
