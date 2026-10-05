export interface NotificationStatus { kind?: string; isLoading?: boolean; level?: string }

/** Project notification rows into the compact attention/success status. */
export function deriveNotificationStatus(enabled: boolean, rows: readonly NotificationStatus[]): "attention" | "success" | null {
  if (!enabled) return null;
  if (rows.some((row) => row.kind !== "first-awake" && !row.isLoading && (row.level === "warning" || row.level === "danger"))) return "attention";
  const first = rows[0];
  return first != null && first.kind !== "first-awake" && !first.isLoading && first.level === "success" ? "success" : null;
}
