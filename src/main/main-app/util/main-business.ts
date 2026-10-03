/** Business helpers extracted from the main process entry chunk. */

export interface DelegationEnvelope {
  sourceThreadId: string;
  input: string;
}

const eligiblePlans = new Set([
  "plus",
  "pro",
  "business",
  "team",
  "self_serve_business_prolite",
  "self_serve_business_usage_based",
]);

export function decodeXmlText(value: string): string {
  return value.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
}

export function readDelegationTag(input: string, tag: string): string | null {
  const match = new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, "i").exec(input);
  return match?.[1].trim() == null ? null : decodeXmlText(match[1].trim());
}

export function parseDelegationEnvelope(input: string): DelegationEnvelope | null {
  const value = input.trim();
  if (!value.startsWith("<codex_delegation>") || !value.endsWith("</codex_delegation>")) return null;
  const sourceThreadId = readDelegationTag(value, "source_thread_id");
  const delegationInput = readDelegationTag(value, "input");
  return sourceThreadId == null || delegationInput == null
    ? null
    : { sourceThreadId, input: delegationInput };
}

export function isOpenAiEmployee(email: unknown): boolean {
  return typeof email === "string" && email.toLowerCase().endsWith("@openai.com");
}

export function isEligibleAccount(account: any): boolean {
  if (account == null) return false;
  if (account.type === "apiKey") return true;
  return account.type === "chatgpt" &&
    (isOpenAiEmployee(account.email) || eligiblePlans.has(account.planType));
}

export const eligibleAccountPlans = [...eligiblePlans];
