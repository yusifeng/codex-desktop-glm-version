import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/presentation";

interface IntlShape { formatMessage(descriptor: { defaultMessage: string; description?: string; id?: string }, values?: Record<string, unknown>): string }
interface MatchingApp { id: string; name: string; pluginDisplayNames?: string[] }
interface ToolActivityInput { appContext?: { actionName?: string; appName?: string; connectorId: string } | null; completed?: boolean; intl: IntlShape; matchingApp?: MatchingApp | null; nativeDesktopAppMetadata?: { name?: string } | null; platform?: string; serverName?: string | null; source?: { backend?: string; kind?: string } | null; toolArguments?: unknown; toolName: string; toolResult?: unknown }
interface ApprovalInput { connector_id: string; connector_name?: string | null; tool_name?: string | null; tool_params?: unknown; tool_title?: string | null }

function words(value: string): string[] { return value.trim().toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean); }
function sentence(value: string): string { const normalized = words(value).join(" "); return normalized.length === 0 ? "Used tool" : normalized[0].toUpperCase() + normalized.slice(1); }
function stripAppPrefix(toolName: string, app?: MatchingApp | null): string {
  if (app == null) return toolName;
  const toolWords = words(toolName);
  const prefixes = [app.name, app.id, app.id.replace(/^connector[_-]/i, ""), ...(app.pluginDisplayNames ?? [])].map(words).sort((a, b) => b.length - a.length);
  const prefix = prefixes.find(candidate => candidate.length > 0 && candidate.every((part, index) => part === toolWords[index]));
  return prefix == null ? toolName : toolWords.slice(prefix.length).join(" ") || toolName;
}
function getApprovalToolContext({ approval, matchingApp }: { approval: ApprovalInput; matchingApp?: MatchingApp | null }): string | null {
  const name = approval.tool_name?.trim() || approval.tool_title?.trim();
  if (!name) return null;
  const app = matchingApp ?? { id: approval.connector_id, name: approval.connector_name ?? name.split(".")[0], pluginDisplayNames: [] };
  const action = stripAppPrefix(name, app);
  const argument = approval.tool_params != null && typeof approval.tool_params === "object" ? Object.values(approval.tool_params).find(value => typeof value === "string") : null;
  return typeof argument === "string" && argument.trim() ? `${sentence(action)}: ${argument.trim()}` : sentence(action);
}
function getFallbackToolLabel({ appContext, matchingApp, toolName }: Pick<ToolActivityInput, "appContext" | "matchingApp" | "toolName">): string { return sentence(stripAppPrefix(appContext?.actionName ?? toolName, matchingApp ?? (appContext == null ? null : { id: appContext.connectorId, name: appContext.appName ?? appContext.connectorId }))); }
function formatToolActivityLabel(input: ToolActivityInput): string {
  const args = input.toolArguments;
  if (words(input.toolName).at(-1) === "js" && args != null && typeof args === "object" && "title" in args && typeof args.title === "string") { const title = args.title.trim().replace(/\s+/g, " "); if (title) return title.length <= 80 ? title : `${title.slice(0, 79).trimEnd()}…`; }
  if (input.source?.kind === "browserUse") return input.source.backend === "chrome" ? "Used Chrome" : "Used the browser";
  const fallback = getFallbackToolLabel(input);
  return input.completed ? fallback.replace(/^(Create|Open|Fetch|Read|Search|Send|Update)\b/, match => `${match}d`) : fallback;
}
function initializeMcpToolActivityLabels(): void {}
export { initializeMcpToolActivityLabels as i, getApprovalToolContext as n, getFallbackToolLabel as r, formatToolActivityLabel as t };
