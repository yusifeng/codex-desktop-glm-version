const BEACON_QUERY_KEYS = ["beacon_checkout_mode", "entry_point", "promo_campaign", "beacon_source_thread", "beacon_target_plan", "upsell_context_id"];
const BEACON_RETURN_PATH_KEY = "beacon_return_path";

/** Remove beacon-only query parameters while preserving the remaining query string. */
export function stripBeaconQueryParams(search: string): string {
  const params = new URLSearchParams(search);
  for (const key of BEACON_QUERY_KEYS) params.delete(key);
  params.delete(BEACON_RETURN_PATH_KEY);
  const result = params.toString();
  return result.length === 0 ? "" : `?${result}`;
}
