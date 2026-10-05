/**
 * Stable cache key for the account spend-limit banner.
 *
 * The generated app-primary chunk keeps this helper next to the banner
 * initializer; exporting it here makes the pure projection independently
 * readable and testable without carrying renderer state or effects.
 */
export type SpendLimitAccount = {
  account_id?: string | number | null;
  spend_control?: {
    individual_limit?: {
      limit?: string | number | null;
      reset_at?: number | null;
    } | null;
  } | null;
};

export function accountSpendKey(value: SpendLimitAccount | null | undefined): string | null {
  const accountId = value?.account_id;
  const limit = value?.spend_control?.individual_limit?.limit;
  const resetAt = value?.spend_control?.individual_limit?.reset_at;
  if (accountId == null || limit == null || resetAt == null) return null;
  return `${accountId}:${limit}:${new Date(resetAt * 1e3).toISOString().slice(0, 10)}`;
}
