export type UrlParser = (value: string) => URL | null | undefined;

/** Normalize app-server elicitation/approval metadata into the desktop shape. */
export function elicitationForTurn(
  request: Record<string, unknown>,
  supportsOpenAiForm: boolean,
  parseUrl: UrlParser,
): Record<string, unknown> | null {
  const mode = request.mode;
  const serverName = typeof request.serverName === "string" ? request.serverName : "";
  if (mode === "openai/userVerification")
    return { kind: "userVerification", serverName, title: request.title, description: request.description, challenge: request.challenge };
  const metadata = typeof request._meta === "object" && request._meta != null ? request._meta as Record<string, unknown> : {};
  const risk = metadata.riskLevel === "low" || metadata.riskLevel === "high" ? { riskLevel: metadata.riskLevel } : {};
  if (metadata.codex_approval_kind === "browser_auth") {
    if (mode !== "form" || typeof metadata.browser_auth_challenge_id !== "string") return null;
    const { browser_auth_challenge_id: challengeId, ...browserAuth } = metadata;
    return { kind: "browserAuth", challengeId, message: request.message, serverName, browserAuth };
  }
  if (mode === "url") {
    if (typeof request.url !== "string") return null;
    const url = parseUrl(request.url);
    if (url == null || url.protocol !== "https:" || url.username || url.password) return null;
    return { ...risk, kind: "urlAction", message: request.message, serverName, url: url.href };
  }
  if (mode === "openai/form" || mode === "openaiForm")
    return supportsOpenAiForm
      ? { ...risk, kind: mode === "openaiForm" ? "openaiForm" : "legacyOpenAIForm", message: request.message, serverName, schema: request.requestedSchema }
      : { kind: "unsupportedOpenAIForm", serverName };
  if (mode !== "form") return null;
  if (metadata.codex_approval_kind === "tool_suggestion") return { ...risk, kind: "toolSuggestion", suggestion: metadata };
  if (metadata.codex_approval_kind === "mcp_tool_call")
    return { ...risk, kind: "mcpToolCall", message: request.message, approval: metadata, toolParamsDisplay: metadata.tool_params_display };
  return { ...risk, kind: "formElicitation", message: request.message, serverName, schema: request.requestedSchema };
}
