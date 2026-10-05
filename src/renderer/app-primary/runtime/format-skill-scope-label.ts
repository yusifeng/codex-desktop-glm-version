export interface SkillScopeIntl {
  formatMessage(descriptor: unknown): string;
}

/** Select the localized skill scope label, honoring explicit overrides. */
export function formatSkillScopeLabel(input: {
  scope: string;
  intl: SkillScopeIntl;
  repoLabel?: string;
  adminLabel?: string;
  messages?: Record<string, unknown>;
  fallback: (scope: string, intl: SkillScopeIntl) => string;
}): string {
  if (input.scope === "repo") return input.repoLabel ?? input.intl.formatMessage(input.messages?.repo);
  if (input.scope === "admin") return input.adminLabel ?? input.intl.formatMessage(input.messages?.admin);
  const message = input.messages?.[input.scope];
  return message ? input.intl.formatMessage(message) : input.fallback(input.scope, input.intl);
}
