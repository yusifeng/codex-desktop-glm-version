import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

interface UsageOptions { accountId?: string | null; authMethod?: string; days: number; enabled?: boolean; isPolling?: boolean; scope?: "business" | "consumer" | "workspace"; userId?: string | null }
function dateRange(days: number, now = new Date()): { endDate: string; startDate: string } { const start = new Date(now); start.setUTCDate(start.getUTCDate() - days + 1); return { endDate: now.toISOString().slice(0, 10), startDate: start.toISOString().slice(0, 10) }; }
function usageQuery(kind: string, options: UsageOptions): Record<string, unknown> { const range = dateRange(options.days); const scope = options.scope ?? "workspace"; return { queryKey: ["usage-settings", "usage-billing", kind, options.accountId, options.userId, scope, range.startDate, range.endDate], enabled: options.enabled !== false && options.authMethod === "chatgpt" && options.accountId != null && options.userId != null, refetchInterval: options.isPolling === false ? false : 60_000, staleTime: 60_000, retry: false, range }; }
function creditEstimate(options: UsageOptions & { credits: number }): Record<string, unknown> { const roundedCredits = Math.round(options.credits * 1e6) / 1e6; return { ...usageQuery("credit-estimate", options), queryKey: ["usage-settings", "usage-billing", "credit-estimate", options.accountId, options.userId, roundedCredits], enabled: options.enabled !== false && roundedCredits > 0 && options.authMethod === "chatgpt" && options.accountId != null && options.userId != null, refetchInterval: options.isPolling === false ? false : 30_000, staleTime: 30_000 }; }
function pluginUsage(options: UsageOptions): Record<string, unknown> { return usageQuery("plugins", options); }
function workspaceTurns(options: UsageOptions): Record<string, unknown> { return { ...usageQuery("turns", options), enabled: options.scope !== "workspace" && usageQuery("turns", options).enabled }; }
function skillUsage(options: UsageOptions): Record<string, unknown> { return usageQuery("skills", options); }
function codeReview(options: UsageOptions): Record<string, unknown> { return { ...usageQuery("code-review", options), enabled: options.scope !== "workspace" && usageQuery("code-review", options).enabled }; }
function creditHistory(options: UsageOptions): Record<string, unknown> { return usageQuery("credit-history", options); }
function linesOfCode(options: UsageOptions): Record<string, unknown> { return { ...usageQuery("lines-of-code", options), enabled: options.scope === "business" && usageQuery("lines-of-code", options).enabled }; }
function personalHistory(options: UsageOptions): Record<string, unknown> { return usageQuery("personal-history", options); }
function tokenHistory(options: UsageOptions): Record<string, unknown> { return { ...usageQuery("token-history", options), enabled: options.scope !== "consumer" && usageQuery("token-history", options).enabled }; }
function initialize(): void {}
export { creditEstimate as a, pluginUsage as c, workspaceTurns as i, skillUsage as l, codeReview as n, creditHistory as o, linesOfCode as r, personalHistory as s, initialize as t, tokenHistory as u };
