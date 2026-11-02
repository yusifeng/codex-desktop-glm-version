/** Identify MCP extension entries in the mixed at-mention collection. */
export function isMcpExtensionKind(value: { kind?: unknown } | null | undefined): boolean {
  return value?.kind === "mcp-extension";
}
