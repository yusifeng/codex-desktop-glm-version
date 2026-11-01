import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/security-browser";
import "@rchunk/settings-route-state";
import "@rchunk/security-messages";
import "@rchunk/confirmation";
import "@rchunk/history";
import "@rchunk/order-yubikey-dialog";
import { n as createSecurityQueries, t as initializeSecurityClient } from "@rchunk/security-client";
import { i as initializeSecurityShared, n as SecurityLoadingState } from "@rchunk/security-shared";
import { r as initializeLinkedAppLogo, n as LinkedAppLogo } from "@rchunk/linked-app-logo";
import { n as initializeSecurityTabs } from "@rchunk/security-tabs";
import { t as initializeSecurityPermissions } from "@rchunk/security-src";

interface QueryResult<Value> { data?: Value; isError?: boolean; isLoading?: boolean; isPending?: boolean; refetch?(): void }
interface MfaData { mfa_enabled_v2?: boolean; phone_number?: string | null; push_factor_enabled?: boolean }
interface Session { current?: boolean; device_name?: string; id: string; ip_address?: string; last_active_at?: string }
interface LinkedApp { id: string; logo_url?: string | null; name?: string }
interface SecurityProps {
  accountId?: string | null;
  onDisconnectApp?(app: LinkedApp): void;
  onLogoutSession?(session: Session): void;
  onOpenAdvancedProtection?(): void;
  onOpenDeveloperMode?(): void;
  onOpenLockdownMode?(): void;
  onOpenLoginConnections?(): void;
}
const shared = appSharedChunk as unknown as {
  HX?<Value>(signal: unknown): Value;
  I3(): import("@rchunk/app-shared").JsxRuntime;
  _L?<Value>(options: unknown): QueryResult<Value>;
};
const initial = appInitialChunk as unknown as { U6t?: unknown };
let jsx: import("@rchunk/app-shared").JsxRuntime;
let initialized = false;

function initializeSecuritySettings(): void {
  if (initialized) return;
  initializeSecurityClient();
  initializeSecurityShared();
  initializeLinkedAppLogo();
  initializeSecurityTabs();
  initializeSecurityPermissions();
  jsx = shared.I3();
  initialized = true;
}
function Row(props: { action?: unknown; description?: unknown; icon?: unknown; label: unknown }): unknown {
  return jsx.jsxs("div", { className: "flex min-h-14 items-center gap-3 px-4 py-3", children: [props.icon, jsx.jsxs("div", { className: "min-w-0 flex-1", children: [jsx.jsx("div", { className: "font-medium", children: props.label }), props.description == null ? null : jsx.jsx("div", { className: "text-sm text-secondary", children: props.description })] }), props.action] });
}
function Action(props: { children: unknown; onClick?(): void }): unknown { return jsx.jsx("button", { type: "button", onClick: props.onClick, children: props.children }); }
function Section(props: { children: unknown; title: unknown }): unknown { return jsx.jsxs("section", { className: "rounded-xl border", children: [jsx.jsx("h2", { className: "border-b px-4 py-3 font-semibold", children: props.title }), props.children] }); }
function query<Value>(options: unknown, fallback?: Value): QueryResult<Value> { return shared._L?.<Value>(options) ?? { data: fallback, isLoading: false }; }

export function ChatGptSecuritySettings(props: SecurityProps = {}): unknown {
  initializeSecuritySettings();
  const accountId = props.accountId ?? (initial.U6t != null ? shared.HX?.<string | null>(initial.U6t) : null);
  if (accountId == null) return jsx.jsx("div", { "data-security-settings-empty": true });
  const queries = createSecurityQueries(accountId);
  const mfa = query<MfaData>(queries.mfa);
  const sessions = query<{ sessions?: Session[] }>(queries.sessions, { sessions: [] });
  const linkedApps = query<{ applications?: LinkedApp[] }>(queries.linkedApps, { applications: [] });
  const protection = query<Record<string, unknown>>(queries.protection);
  const loading = mfa.isLoading || sessions.isLoading || linkedApps.isLoading || protection.isLoading;
  const failed = mfa.isError || sessions.isError || linkedApps.isError || protection.isError;
  if (loading || failed) return jsx.jsx(SecurityLoadingState, { isError: failed === true, onRetry: () => { mfa.refetch?.(); sessions.refetch?.(); linkedApps.refetch?.(); protection.refetch?.(); } });
  const mfaEnabled = mfa.data?.mfa_enabled_v2 === true;
  return jsx.jsxs("main", { "data-settings-page": "security", "data-account-id": accountId, children: [
    jsx.jsx("h1", { children: "Security" }),
    jsx.jsx(Section, { title: "Sign-in security", children: [
      jsx.jsx(Row, { label: "Multi-factor authentication", description: mfaEnabled ? "On" : "Add an extra layer of security", action: jsx.jsx(Action, { children: mfaEnabled ? "Manage" : "Enable" }) }),
      jsx.jsx(Row, { label: "Login connections", description: "Manage the ways you sign in", action: jsx.jsx(Action, { onClick: props.onOpenLoginConnections, children: "Manage" }) }),
      jsx.jsx(Row, { label: "Advanced protection", description: "Stronger protection for high-risk accounts", action: jsx.jsx(Action, { onClick: props.onOpenAdvancedProtection, children: "Manage" }) }),
    ] }),
    jsx.jsx(Section, { title: "Active sessions", children: (sessions.data?.sessions ?? []).map((session) => jsx.jsx(Row, { label: session.device_name ?? "Unknown device", description: [session.ip_address, session.last_active_at].filter(Boolean).join(" · "), action: session.current ? "Current" : jsx.jsx(Action, { onClick: () => props.onLogoutSession?.(session), children: "Log out" }) }, session.id)) }),
    jsx.jsx(Section, { title: "Connected apps", children: (linkedApps.data?.applications ?? []).map((app) => jsx.jsx(Row, { icon: jsx.jsx(LinkedAppLogo, { app: { name: app.name ?? app.id, logo_uri: app.logo_url } }), label: app.name ?? app.id, action: jsx.jsx(Action, { onClick: () => props.onDisconnectApp?.(app), children: "Disconnect" }) }, app.id)) }),
    jsx.jsx(Section, { title: "Advanced", children: [
      jsx.jsx(Row, { label: "Developer mode", action: jsx.jsx(Action, { onClick: props.onOpenDeveloperMode, children: "Manage" }) }),
      jsx.jsx(Row, { label: "Lockdown mode", action: jsx.jsx(Action, { onClick: props.onOpenLockdownMode, children: "Manage" }) }),
    ] }),
  ] });
}
