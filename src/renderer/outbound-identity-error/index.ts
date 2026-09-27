import { $3 as getCompilerRuntime, I3 as getJsxRuntime, K2 as initializeInternationalization, Y2 as FormattedMessage } from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

export interface OutboundIdentityErrorValue { error?: string; status?: number; }
export interface OutboundIdentityErrorProps { error: OutboundIdentityErrorValue; }

let jsxRuntime: ReturnType<typeof getJsxRuntime> | undefined;
function messageForError(error: OutboundIdentityErrorValue): unknown {
  if (error.status === 403) return jsxRuntime?.jsx(FormattedMessage, { id: "restricted.environmentSetup.oic.accessError", defaultMessage: "You do not have access to this operation, or outbound identity is unavailable for this workspace", description: "Explains denied outbound identity operations, including unavailable connections and disabled workspace rollout" });
  if (error.status === 409) return jsxRuntime?.jsx(FormattedMessage, { id: "restricted.environmentSetup.oic.conflictError", defaultMessage: "This connection changed while you were editing. Close and reopen it to load the current settings before saving", description: "Recovery instructions when an outbound identity edit uses an old configuration version" });
  if (error.status === 400 || error.error === "invalid-request") return jsxRuntime?.jsx(FormattedMessage, { id: "restricted.environmentSetup.oic.configurationError", defaultMessage: "Check the provider fields, subject template, and custom claims. Claims must be a JSON object with string values and cannot replace reserved claims", description: "Validation error for an outbound identity configuration" });
  if (error.error === "authentication" || error.status === 401) return jsxRuntime?.jsx(FormattedMessage, { id: "restricted.environmentSetup.oic.authenticationError", defaultMessage: "Your signed-in account changed or is unavailable. Sign in to this workspace and try again", description: "Authentication error when the account changes during outbound identity management" });
  return jsxRuntime?.jsx(FormattedMessage, { id: "restricted.environmentSetup.oic.requestError", defaultMessage: "Outbound identity is unavailable. Reload the connections and check whether your change was saved before trying again", description: "Recovery for an unavailable outbound identity request whose write outcome may be unknown" });
}
function OutboundIdentityError({ error }: OutboundIdentityErrorProps): unknown {
  return jsxRuntime?.jsx("p", { role: "alert", className: "text-sm text-danger select-none", children: messageForError(error) });
}

let initialized = false;
function initializeOutboundIdentityError(): void {
  if (initialized) return;
  initialized = true;
  getCompilerRuntime();
  initializeInternationalization();
  jsxRuntime = getJsxRuntime();
}

export { initializeOutboundIdentityError as n, OutboundIdentityError as t };
