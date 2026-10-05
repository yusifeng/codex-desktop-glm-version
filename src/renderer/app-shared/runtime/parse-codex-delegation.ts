export interface CodexDelegation { sourceThreadId: string; input: string }
export function parseCodexDelegation(value: string | null | undefined): CodexDelegation | null {
  if (value == null) return null;
  const input = value.trim();
  if (!input.startsWith("<codex_delegation>") || !input.endsWith("</codex_delegation>")) return null;
  const read = (tag: string): string | null => input.match(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, "i"))?.[1]?.trim() || null;
  const sourceThreadId = read("source_thread_id");
  const delegatedInput = read("input");
  return sourceThreadId == null || delegatedInput == null ? null : { sourceThreadId, input: delegatedInput };
}
