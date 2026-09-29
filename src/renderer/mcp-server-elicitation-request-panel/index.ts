import "@rchunk/rolldown-runtime";
import {
  $3 as initializeSharedRuntime,
  BX as useSignalFamilyValueImport,
  I3 as getJsxRuntime,
  K2 as initializeUiRuntime,
  LX as useScope,
  Y2 as FormattedMessage,
  Yh as Button,
  ZI as appScope,
  e6 as getReactRuntime,
  type JsxRuntime,
} from "@rchunk/app-shared";
// @ts-expect-error The compressed elicitation runtime surface is registered centrally.
import { Th as autoResolutionSignal, Ugn as getHostManager, Wgn as createElicitationResponse, pnt as desktopBridge, uen as toComputerUseApprovalRequest } from "@rchunk/app-initial";
import "@rchunk/app-primary";
import { i as initializeMcpToolActivityLabel } from "@rchunk/mcp-tool-activity-label";
import {
  a as ToolSuggestionRequest,
  c as initializeMcpToolApprovalMessages,
  i as initializeMcpToolApprovalCards,
  o as initializeMcpToolApprovalActions,
  r as UrlActionRequest,
  s as ConnectorAuthRequest,
} from "@rchunk/mcp-tool-approval-message";
import {
  n as initializeRequestPanel,
  r as UnsupportedOpenAiFormRequest,
  t as FormElicitationRequest,
} from "@rchunk/request-panel";
import { n as initializeComputerUseApprovalRequestCard, t as ComputerUseApprovalRequestCard } from "@rchunk/computer-use-app-approval-request-card";

interface ReactHooks {
  useCallback<Callback extends (...parameters: never[]) => unknown>(
    callback: Callback,
    dependencies: readonly unknown[],
  ): Callback;
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useRef<Value>(initialValue: Value): { current: Value };
  useState<Value>(initialValue: Value): [Value, (next: Value | ((value: Value) => Value)) => void];
}

interface PendingRequest {
  elicitation: Elicitation;
  request: { params: { turnId?: string | null } };
  requestId: string;
}

interface PanelProps {
  conversationId: string;
  hostId: string;
  pendingRequest: PendingRequest;
}

interface BaseElicitation {
  kind: string;
  serverName?: string;
}

interface GenericElicitation extends BaseElicitation {
  kind: "generic";
  message: string;
  metadata?: unknown;
  persist?: string[];
  serverName: string;
  toolParams?: Record<string, unknown>;
}

interface McpToolCallElicitation extends BaseElicitation {
  approval: {
    connector_id?: string | null;
    connector_name?: string | null;
    message?: string;
    persist?: string[];
    tool_name?: string;
    tool_params?: Record<string, unknown>;
  };
  kind: "mcpToolCall";
}

interface UserVerificationElicitation extends BaseElicitation {
  description?: string;
  kind: "userVerification";
  serverName: string;
  title?: string;
}

interface BrowserAuthElicitation extends BaseElicitation {
  browserAuth: unknown;
  challengeId: string;
  kind: "browserAuth";
}

interface FormElicitation extends BaseElicitation {
  kind: "formElicitation" | "openaiForm" | "legacyOpenAIForm";
  [key: string]: unknown;
}

interface UnsupportedFormElicitation extends BaseElicitation {
  kind: "unsupportedOpenAIForm";
  serverName: string;
}

interface ToolSuggestionElicitation extends BaseElicitation {
  kind: "toolSuggestion";
  suggestion: unknown;
}

interface ConnectorAuthElicitation extends BaseElicitation {
  kind: "connectorAuth";
  [key: string]: unknown;
}

interface UrlActionElicitation extends BaseElicitation {
  kind: "urlAction";
  [key: string]: unknown;
}

type Elicitation =
  | GenericElicitation
  | McpToolCallElicitation
  | UserVerificationElicitation
  | BrowserAuthElicitation
  | FormElicitation
  | UnsupportedFormElicitation
  | ToolSuggestionElicitation
  | ConnectorAuthElicitation
  | UrlActionElicitation;

interface AutoResolutionState {
  requestId: string;
  resolutionState: { deadlineMs?: number; status: string };
}

interface HostManager {
  beginUserVerification?(conversationId: string, requestId: string, provider: unknown): Promise<UserVerificationAttempt>;
  replyWithMcpServerElicitationResponse(
    conversationId: string,
    requestId: string,
    response: unknown,
  ): Promise<unknown>;
}

interface UserVerificationAttempt {
  cancel(): Promise<unknown>;
  dispose?(): void;
  wait(): Promise<{ error?: unknown; status: string }>;
  [Symbol.dispose]?(): void;
}

interface DesktopElicitationBridge {
  requestUserInputAutoResolution: {
    snooze(request: { conversationId: string; hostId: string; requestId: string }): void;
  };
  userVerification?: unknown;
}

const useSignalFamilyValue = useSignalFamilyValueImport as unknown as (
  signal: unknown,
  key: { conversationId: string; hostId: string },
) => AutoResolutionState | null | undefined;

let initialized = false;
let jsx: JsxRuntime;
let react: ReactHooks;

function message(id: string, defaultMessage: string, values?: Record<string, unknown>): unknown {
  return jsx.jsx(FormattedMessage, { id, defaultMessage, values });
}

function responsePayload(decision: string, payload?: unknown): unknown {
  return (createElicitationResponse as unknown as (
    decision: string,
    payload: unknown,
  ) => unknown)(decision, payload ?? null);
}

function getManager(scope: unknown, hostId: string): HostManager {
  return getHostManager(scope, hostId) as unknown as HostManager;
}

function extractReason(metadata: unknown): string | null {
  if (metadata == null || Array.isArray(metadata) || typeof metadata !== "object" || !("reason" in metadata)) return null;
  const reason = (metadata as { reason?: unknown }).reason;
  return typeof reason === "string" && reason.trim().length > 0 ? reason.trim() : null;
}

function stripReason(messageText: string, reason: string | null): string {
  const trimmed = messageText.trim();
  if (reason == null) return trimmed;
  const suffix = `Reason: ${reason}`;
  if (!trimmed.endsWith(suffix)) return trimmed;
  const title = trimmed.slice(0, -suffix.length).trim();
  return title.length > 0 ? title : trimmed;
}

function humanize(name: string): string {
  const normalized = name.trim().replace(/^connector[_-]/, "");
  if (normalized.length === 0) return "MCP server";
  return normalized
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function isBrowserSource(value: string | null | undefined): boolean {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean)
    .join("-")
    .replace(/^connector-/, "");
  return normalized === "browser" || normalized === "browser-use" || normalized.includes("chrome");
}

function browserPersistentApproval(elicitation: Elicitation): { origin: string; reason: string | null; source: string } | null {
  let metadata: unknown;
  let persist: string[] | undefined;
  let source: string | null | undefined;
  if (elicitation.kind === "generic") {
    metadata = elicitation.metadata;
    persist = elicitation.persist;
    source = elicitation.serverName;
  } else if (elicitation.kind === "mcpToolCall") {
    if (elicitation.approval.tool_name !== "access_browser_origin") return null;
    metadata = elicitation.approval.tool_params;
    persist = elicitation.approval.persist;
    source = elicitation.approval.connector_name ?? elicitation.approval.connector_id;
  } else {
    return null;
  }
  if (!persist?.includes("always") || !isBrowserSource(source) || metadata == null || typeof metadata !== "object") return null;
  const origin = (metadata as { origin?: unknown }).origin;
  const reason = (metadata as { reason?: unknown }).reason;
  return typeof origin === "string" && origin.trim().length > 0
    ? { origin: origin.trim(), reason: typeof reason === "string" && reason.trim().length > 0 ? reason.trim() : null, source: source ?? "Browser" }
    : null;
}

function BrowserPersistentApprovalCard({
  conversationId,
  hostId,
  request,
  requestId,
}: {
  conversationId: string;
  hostId: string;
  request: { origin: string; reason: string | null; source: string };
  requestId: string;
}): unknown {
  const scope = useScope(appScope);
  const [waiting, setWaiting] = react.useState(false);
  const reply = react.useCallback(
    (decision: string, persist?: string) => {
      setWaiting(true);
      void getManager(scope, hostId)
        .replyWithMcpServerElicitationResponse(
          conversationId,
          requestId,
          responsePayload(decision, persist == null ? null : { persist }),
        )
        .finally(() => setWaiting(false));
    },
    [conversationId, hostId, requestId, scope],
  );
  return jsx.jsxs("section", {
    "data-panel-kind": "browser-persistent-approval",
    className: "flex flex-col gap-3 rounded-xl border border-default p-4",
    children: [
      jsx.jsx("h3", { children: message("composer.browserWebsiteAccess.title.chatgpt", "Allow ChatGPT to access {origin}?", { origin: request.origin }) }),
      request.reason == null ? null : jsx.jsx("p", { className: "text-sm text-secondary", children: request.reason }),
      jsx.jsx("p", { className: "text-sm text-secondary", children: request.source }),
      jsx.jsxs("div", { className: "flex gap-2", children: [
        jsx.jsx(Button, { color: "ghost", disabled: waiting, onClick: () => reply("decline"), children: message("composer.approval.deny", "Deny") }),
        jsx.jsx(Button, { color: "secondary", disabled: waiting, onClick: () => reply("accept", "session"), children: message("composer.approval.allowConversation", "Allow this conversation") }),
        jsx.jsx(Button, { color: "primary", disabled: waiting, onClick: () => reply("accept", "always"), children: message("composer.approval.allowAlways", "Always allow") }),
      ] }),
    ],
  });
}

function valuePreview(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || value == null) return String(value);
  return JSON.stringify(value, null, 2) ?? "";
}

function GenericApprovalCard({
  conversationId,
  elicitation,
  hostId,
  requestId,
}: {
  conversationId: string;
  elicitation: GenericElicitation | McpToolCallElicitation;
  hostId: string;
  requestId: string;
}): unknown {
  const scope = useScope(appScope);
  const submitted = react.useRef(false);
  const [showAll, setShowAll] = react.useState(false);
  const isGeneric = elicitation.kind === "generic";
  const reason = isGeneric ? extractReason(elicitation.metadata) : extractReason(elicitation.approval.tool_params);
  const rawTitle = isGeneric ? elicitation.message : elicitation.approval.message ?? "Tool call needs your approval";
  const title = stripReason(rawTitle, reason);
  const params = Object.entries(isGeneric ? elicitation.toolParams ?? {} : elicitation.approval.tool_params ?? {});
  const persist = isGeneric ? elicitation.persist ?? [] : elicitation.approval.persist ?? [];
  const visibleParams = showAll ? params : params.slice(0, 4);
  const reply = react.useCallback(
    (decision: string, persistMode?: string) => {
      if (submitted.current) return;
      submitted.current = true;
      void getManager(scope, hostId)
        .replyWithMcpServerElicitationResponse(
          conversationId,
          requestId,
          responsePayload(decision, decision === "accept" && persistMode != null ? { persist: persistMode } : null),
        )
        .catch(() => { submitted.current = false; });
    },
    [conversationId, hostId, requestId, scope],
  );
  return jsx.jsxs("section", {
    "data-panel-kind": elicitation.kind,
    className: "flex flex-col gap-3 rounded-xl border border-default p-4",
    children: [
      jsx.jsx("h3", { children: title }),
      reason == null ? null : jsx.jsx("p", { className: "text-sm text-secondary", children: reason }),
      jsx.jsx("dl", {
        className: "grid gap-2 text-sm",
        children: visibleParams.map(([name, value]) => jsx.jsxs("div", { children: [
          jsx.jsx("dt", { className: "font-medium", children: humanize(name) }),
          jsx.jsx("dd", { className: "whitespace-pre-wrap break-words", children: valuePreview(value) }),
        ] }, name)),
      }),
      params.length > 4 ? jsx.jsx(Button, { color: "ghost", onClick: () => setShowAll((current) => !current), children: showAll ? "Show fewer items" : `Show ${params.length - 4} more items` }) : null,
      jsx.jsxs("div", { className: "flex justify-end gap-2", children: [
        jsx.jsx(Button, { color: "ghost", onClick: () => reply("decline"), children: message("composer.approval.deny", "Deny") }),
        persist.includes("always") ? jsx.jsx(Button, { color: "secondary", onClick: () => reply("accept", "always"), children: message("composer.approval.always", "Always allow") }) : null,
        jsx.jsx(Button, { color: "primary", onClick: () => reply("accept", persist.includes("session") ? "session" : undefined), children: message("composer.approval.allow", "Allow") }),
      ] }),
    ],
  });
}

function UserVerificationCard({
  conversationId,
  elicitation,
  hostId,
  requestId,
}: {
  conversationId: string;
  elicitation: UserVerificationElicitation;
  hostId: string;
  requestId: string;
}): unknown {
  const scope = useScope(appScope);
  const activeAttempt = react.useRef<UserVerificationAttempt | null>(null);
  const [waiting, setWaiting] = react.useState(false);
  react.useEffect(() => () => {
    const attempt = activeAttempt.current;
    activeAttempt.current = null;
    attempt?.cancel().catch(() => undefined);
    attempt?.[Symbol.dispose]?.();
    attempt?.dispose?.();
  }, []);
  const decline = react.useCallback(() => {
    const attempt = activeAttempt.current;
    activeAttempt.current = null;
    attempt?.cancel().catch(() => undefined);
    attempt?.[Symbol.dispose]?.();
    attempt?.dispose?.();
    void getManager(scope, hostId).replyWithMcpServerElicitationResponse(conversationId, requestId, responsePayload("cancel"));
  }, [conversationId, hostId, requestId, scope]);
  const approve = react.useCallback(() => {
    if (activeAttempt.current != null) return;
    const bridge = desktopBridge as unknown as DesktopElicitationBridge;
    const provider = bridge.userVerification;
    const manager = getManager(scope, hostId);
    if (provider == null || manager.beginUserVerification == null) {
      decline();
      return;
    }
    setWaiting(true);
    void manager.beginUserVerification(conversationId, requestId, provider).then(async (attempt) => {
      activeAttempt.current = attempt;
      const result = await attempt.wait();
      if (result.status === "failed") await manager.replyWithMcpServerElicitationResponse(conversationId, requestId, responsePayload("cancel"));
    }).catch(() => manager.replyWithMcpServerElicitationResponse(conversationId, requestId, responsePayload("cancel"))).finally(() => {
      const attempt = activeAttempt.current;
      activeAttempt.current = null;
      attempt?.[Symbol.dispose]?.();
      attempt?.dispose?.();
      setWaiting(false);
    });
  }, [conversationId, decline, hostId, requestId, scope]);
  return jsx.jsxs("section", {
    "data-panel-kind": "userVerification",
    onKeyDown: (event: { key: string; preventDefault(): void; stopPropagation(): void }) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); decline(); } },
    children: [
      jsx.jsx("h3", { children: elicitation.title ?? "Identity verification requested" }),
      jsx.jsx("p", { children: elicitation.description ?? `Requested by ${elicitation.serverName}` }),
      waiting ? jsx.jsx("div", { role: "status", children: "Waiting for verification…" }) : null,
      jsx.jsxs("div", { children: [
        jsx.jsx(Button, { color: "ghost", disabled: waiting, onClick: decline, children: "Cancel" }),
        jsx.jsx(Button, { color: "primary", disabled: waiting, onClick: approve, children: "Continue" }),
      ] }),
    ],
  });
}

function BrowserAuthCard({ conversationId, elicitation, hostId, requestId }: { conversationId: string; elicitation: BrowserAuthElicitation; hostId: string; requestId: string }): unknown {
  const scope = useScope(appScope);
  const onRespond = react.useCallback(
    (result: { fillStatus: string }) => getManager(scope, hostId).replyWithMcpServerElicitationResponse(conversationId, requestId, responsePayload(result.fillStatus === "submitted" ? "accept" : "decline")),
    [conversationId, hostId, requestId, scope],
  );
  return jsx.jsx("browser-auth-request", { ...elicitation, conversationId, hostId, requestId, onRespond });
}

function McpServerElicitationRequestPanel({ conversationId, hostId, pendingRequest }: PanelProps): unknown {
  const autoResolution = useSignalFamilyValue(autoResolutionSignal, { conversationId, hostId });
  const matchingAutoResolution = autoResolution?.requestId === pendingRequest.requestId ? autoResolution : null;
  const persistentRequest = browserPersistentApproval(pendingRequest.elicitation);
  if (persistentRequest != null) return jsx.jsx(BrowserPersistentApprovalCard, { conversationId, hostId, request: persistentRequest, requestId: pendingRequest.requestId });
  const computerUseRequest = toComputerUseApprovalRequest(pendingRequest.elicitation) as unknown;
  if (computerUseRequest != null) return jsx.jsx(ComputerUseApprovalRequestCard, { conversationId, hostId, onRequestSettled: () => undefined, request: computerUseRequest, requestId: pendingRequest.requestId });
  const turnId = pendingRequest.request.params.turnId ?? undefined;
  const autoResolutionProps = matchingAutoResolution?.resolutionState.status === "scheduled" ? { deadlineMs: matchingAutoResolution.resolutionState.deadlineMs } : undefined;
  const bridge = desktopBridge as unknown as DesktopElicitationBridge;
  const onUserInteraction = matchingAutoResolution != null && matchingAutoResolution.resolutionState.status !== "snoozed"
    ? () => bridge.requestUserInputAutoResolution.snooze({ conversationId, hostId, requestId: pendingRequest.requestId })
    : undefined;
  const elicitation = pendingRequest.elicitation;
  switch (elicitation.kind) {
    case "userVerification":
      return jsx.jsx(UserVerificationCard, { conversationId, elicitation, hostId, requestId: pendingRequest.requestId }, JSON.stringify([hostId, conversationId, pendingRequest.requestId]));
    case "browserAuth":
      return jsx.jsx(BrowserAuthCard, { conversationId, elicitation, hostId, requestId: pendingRequest.requestId }, pendingRequest.requestId);
    case "formElicitation":
    case "openaiForm":
    case "legacyOpenAIForm":
      return jsx.jsx(FormElicitationRequest, { conversationId, elicitation, hostId, requestId: pendingRequest.requestId, turnId, autoResolution: autoResolutionProps, onUserInteraction: elicitation.kind === "formElicitation" ? undefined : onUserInteraction }, pendingRequest.requestId);
    case "unsupportedOpenAIForm":
      return jsx.jsx(UnsupportedOpenAiFormRequest, { conversationId, hostId, requestId: pendingRequest.requestId, serverName: elicitation.serverName }, pendingRequest.requestId);
    case "generic":
    case "mcpToolCall":
      return jsx.jsx(GenericApprovalCard, { conversationId, elicitation, hostId, requestId: pendingRequest.requestId }, pendingRequest.requestId);
    case "toolSuggestion":
      return jsx.jsx(ToolSuggestionRequest, { conversationId, hostId, requestId: pendingRequest.requestId, suggestion: elicitation.suggestion }, pendingRequest.requestId);
    case "connectorAuth":
      return jsx.jsx(ConnectorAuthRequest, { auth: elicitation, conversationId, hostId, requestId: pendingRequest.requestId }, pendingRequest.requestId);
    case "urlAction":
      return jsx.jsx(UrlActionRequest, { action: elicitation, conversationId, hostId, requestId: pendingRequest.requestId }, pendingRequest.requestId);
  }
}

function initializeMcpServerElicitationRequestPanel(): void {
  if (initialized) return;
  initialized = true;
  initializeSharedRuntime();
  initializeUiRuntime();
  initializeMcpToolActivityLabel();
  initializeMcpToolApprovalMessages();
  initializeMcpToolApprovalCards();
  (initializeMcpToolApprovalActions as unknown as () => void)();
  initializeRequestPanel();
  initializeComputerUseApprovalRequestCard();
  jsx = getJsxRuntime();
  react = getReactRuntime() as unknown as ReactHooks;
}

initializeMcpServerElicitationRequestPanel();

export {
  initializeMcpServerElicitationRequestPanel as n,
  McpServerElicitationRequestPanel as t,
};
