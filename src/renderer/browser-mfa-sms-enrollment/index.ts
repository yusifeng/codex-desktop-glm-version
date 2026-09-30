import * as RuntimeChunk from "@rchunk/rolldown-runtime";
import * as SharedChunk from "@rchunk/app-shared";
import * as InitialChunk from "@rchunk/app-initial";
import * as PageLayoutChunk from "@rchunk/page-layout";
import * as MetadataChunk from "@rchunk/phone-metadata-argument-wrapper";
import * as SecurityClientChunk from "@rchunk/security-client";
import * as SessionChunk from "@rchunk/browser-mfa-session";

type EntrySource = "beacon" | "post-totp" | "security-recommendations";
type Step = "intro" | "phone" | "verify" | "success";
interface LocationLike { pathname: string; search: string; hash: string }
interface Props { initialStep?: Step; initialChallenge?: string | null; initialReauthenticationReason?: string | null; location?: LocationLike; auth?: { accountId?: string; email?: string; userId?: string }; onNavigate?(location: LocationLike): void }
interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown }

const jsx = (SharedChunk as unknown as { I3(): JsxRuntime }).I3();
void RuntimeChunk; void InitialChunk; void PageLayoutChunk; void MetadataChunk; void SecurityClientChunk; void SessionChunk;
function parseEntry(value: string | null): EntrySource | null { return value === "beacon" || value === "post-totp" || value === "security-recommendations" ? value : null; }
function parseEnrollmentLocation(location: LocationLike): { source: EntrySource | null; returnTo: LocationLike } { const params = new URLSearchParams(location.search); const source = parseEntry(params.get("entry")); params.delete("mfa_sms_enrollment"); if (source != null) params.delete("entry"); const search = params.toString(); return { source, returnTo: { pathname: source === "security-recommendations" || source === "post-totp" ? "/settings/security" : location.pathname, search: search ? `?${search}` : "", hash: location.hash } }; }

function BrowserMfaSmsEnrollment(props: Props = {}): unknown {
  const initialApi = InitialChunk as unknown as { M6t?(): Props["auth"]; i_n?(): LocationLike };
  const auth = props.auth ?? initialApi.M6t?.() ?? {};
  const location = props.location ?? initialApi.i_n?.() ?? { pathname: "/", search: "", hash: "" };
  const entry = parseEnrollmentLocation(location);
  const step = props.initialStep ?? (entry.source === "security-recommendations" ? "phone" : "intro");
  return jsx.jsx("main", { "data-account-id": auth.accountId, "data-entry-source": entry.source ?? "legacy", "data-step": step, challenge: props.initialChallenge ?? null, reauthenticationReason: props.initialReauthenticationReason ?? null, returnTo: entry.returnTo, onDismiss: () => { props.onNavigate?.(entry.returnTo); } });
}

export { BrowserMfaSmsEnrollment };
