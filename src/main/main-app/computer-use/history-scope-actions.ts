export const HISTORY_SCOPE_ACTIONS = {
  app: { include: `include_application`, exclude: `exclude_application` },
  url: { include: `include_url`, exclude: `exclude_url` },
} as const;

export const HISTORY_CLEAR_ACTIONS = {
  application_session: `clear_application_session`,
  last_ten_minutes: `clear_last_ten_minutes`,
  last_hour: `clear_last_hour`,
  last_day: `clear_last_day`,
} as const;

export function historyScopeAction(scope: keyof typeof HISTORY_SCOPE_ACTIONS, observe: boolean): string {
  return HISTORY_SCOPE_ACTIONS[scope][observe ? `include` : `exclude`];
}

/** Build the bounded interval used when clearing one application session. */
export function historyClearRange(
  scope: keyof typeof HISTORY_CLEAR_ACTIONS,
  startedAt?: string | null,
  endedAt?: string | null,
  now = Date.now(),
): { startMs: number; endMs: number } | null {
  if (scope !== `application_session`) return null;
  if (startedAt == null) return null;
  const startMs = Date.parse(startedAt);
  const endMs = endedAt == null ? now : Date.parse(endedAt);
  return { startMs, endMs: Math.max(startMs + 1, endMs) };
}

if (typeof module !== `undefined`) module.exports = { HISTORY_SCOPE_ACTIONS, HISTORY_CLEAR_ACTIONS, historyScopeAction, historyClearRange };
