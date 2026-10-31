export type UrlParser = (value: string) => URL | null | undefined;

/** Parse a URL into the credential-aware fields used by elicitation policy (原 `FW`，导出 `sr`)。 */
export function parseElicitationUrl(value: string): {
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  href: string;
} | null {
  try {
    const url = new URL(value);
    return {
      protocol: url.protocol,
      username: url.username,
      password: url.password,
      hostname: url.hostname,
      href: url.href,
    };
  } catch {
    return null;
  }
}

/** Connector-auth requests are equivalent when identity fields and scopes match (原 `EW`，导出 `cr`)。 */
export function sameConnectorAuth(left: any, right: any): boolean {
  if (left.connector_id !== right.connector_id || left.link_id !== right.link_id || left.auth_reason !== right.auth_reason ||
      left.connection_consent != null || right.connection_consent != null) return false;
  const leftScopes = new Set(left.requested_scopes ?? []);
  const rightScopes = new Set(right.requested_scopes ?? []);
  return leftScopes.size === rightScopes.size && [...leftScopes].every((scope) => rightScopes.has(scope));
}

/** Guard persistence-bearing responses for execution-bound Codex Apps approvals (原 `cW`，导出 `ur`)。 */
export function isElicitationApprovalSafe(request: any, response: any): boolean {
  if (request?.mode !== "form" || request?.serverName !== "codex_apps" || request?._meta?.codex_approval_kind !== "mcp_tool_call") return true;
  const toolName = request._meta.tool_name;
  const executionBound = toolName === "sites.execute_database_delete" || toolName === "sites.execute_database_insert" || toolName === "sites.execute_database_update" ||
    (toolName == null && request._meta.tool_params && ("confirmation_summary" in request._meta.tool_params || "plan_token" in request._meta.tool_params));
  if (!executionBound) return true;
  const summary = request._meta.tool_params?.confirmation_summary;
  const planToken = request._meta.tool_params?.plan_token;
  const approveDisabled = typeof summary !== "string" || summary.length > 500 || typeof planToken !== "string" || planToken.trim().length === 0;
  return !approveDisabled && response?._meta?.persist == null;
}

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

export { parseElicitationUrl as sr, sameConnectorAuth as cr, isElicitationApprovalSafe as ur };
