import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/queries";
interface PreparationInput extends Record<string, unknown> { accountId: string; hasPromotion?: boolean; initialPlan: string; pricingInfo?: unknown; updatedPlan: string; userId: string }
function parsePreparationError(error: unknown): string | undefined { if (!(error instanceof Error)) return undefined; const message = error.message; try { const detail = (JSON.parse(message) as { detail?: string | { error_type?: string } }).detail; if (typeof detail === "object") return detail?.error_type; } catch {} if (message.includes("already in progress")) return "subscription_update_pending"; if (message.includes("temporarily unavailable")) return "unavailable"; return undefined; }
async function prepareDelinquentUpgrade(input: PreparationInput): Promise<Record<string, unknown> | null> { if (input.hasPromotion || !["go", "plus", "prolite"].includes(input.initialPlan)) return null; return { accountId: input.accountId, userId: input.userId, initialPlan: input.initialPlan, updatedPlan: input.updatedPlan, pricingInfo: input.pricingInfo, attemptId: crypto.randomUUID(), startedAtMs: Date.now() }; }
function initialize(): void {}
export { initialize as n, prepareDelinquentUpgrade as r, parsePreparationError as t };
