// Electron workspace-deactivation recovery gate. Release chunk: gate.electron-622b420b2745.js.
import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";

interface Account { account_id?: string; account_user_role?: string; eligible_for_reactivation?: boolean; is_deactivated?: boolean; name?: string; plan_type?: string; profile_picture_url?: string; structure: "personal" | "workspace" }
interface Workspace { account: Account; can_access_with_session?: boolean; entitlement: { has_active_subscription?: boolean } }
interface AccountsResponse { accountId?: string; userId?: string; account_ordering: string[]; accounts: Record<string, Workspace> }
interface Identity { accountId?: string | null; authMethod?: string; email?: string | null; userId?: string | null }
interface Scope { get(signal: unknown): unknown; set(signal: unknown, value: unknown): void; queryClient: { invalidateQueries(options: { queryKey: unknown[] }): void } }
interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface ReactRuntime { useRef<T>(value: T): { current: T }; useState<T>(value: T): [T, (value: T) => void] }
interface SharedRuntime { $3(): unknown; $h(): unknown; FX(): void; HX<T>(signal: unknown): T; I3(): JsxRuntime; Ih: unknown; K2(): void; LX(signal: unknown): Scope; Oh: unknown; QI(): void; Rh: unknown; Y2: unknown; Yh: unknown; ZI: unknown; Zh(): void; _L<T>(options: Record<string, unknown>): { data?: T; error?: unknown; isLoading: boolean; isFetchedAfterMount?: boolean; refetch(): Promise<{ data?: T; error?: unknown; isError: boolean }> }; e6(): ReactRuntime; lw(): void; wL(): void }
interface InitialRuntime {
  Bfn(): void; Dft(): void; Hln(planType?: string): boolean; M6t(): void; N6t(): Identity; Qgn(): void; Rln(): void; Ugn(scope: Scope, signal: unknown): { logout(): Promise<void> }; Wgn(): void; Ygn: unknown; h0(): void; i_n(): { pathname: string }; iot(): void; j6t(): { refetch(): Promise<{ data?: { accountId?: string; userId?: string }; isError: boolean }> }; k6t(): void; kft(options: { href: string; initiator: string; openTarget: string }): void; o_n(): (to: string, options?: { replace?: boolean }) => Promise<void> | void; p0(options: { accountId: string; url: string }): string; pdn(): void; rot(): void; udn: { safeGet(path: string, options: Record<string, unknown>): Promise<unknown>; safePost(path: string, options: Record<string, unknown>): Promise<unknown> }; ugn: unknown;
}
interface AppPrimaryRuntime { bc: unknown; dc: unknown; uc: unknown; yc(): void }
interface RecoveryActions { chooseWorkspace?(): Promise<void>; isCurrentAccount(accountId: string, userId: string): Promise<boolean>; openCheckout(workspace: Workspace, signal: AbortSignal): Promise<void>; openCustomerPortal(url: string): void; switchWorkspace?(workspace: Workspace, signal: AbortSignal): Promise<boolean> }
const shared = sharedChunk as unknown as SharedRuntime;
const initial = initialChunk as unknown as InitialRuntime;
const appPrimary = appPrimaryChunk as unknown as AppPrimaryRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
const accountsApiVersion = "v4-2023-04-27";
const recoveryPath = "/workspace/deactivated";

function recoveryAction(workspace: Workspace | undefined): "customer_portal" | "checkout" | null {
  const account = workspace?.account;
  if (account?.structure !== "workspace" || account.is_deactivated !== true || account.account_user_role !== "account-owner" || !initial.Hln(account.plan_type) || account.eligible_for_reactivation !== true || workspace?.can_access_with_session === false) return null;
  return workspace.entitlement.has_active_subscription === true ? "customer_portal" : "checkout";
}
function isActiveWorkspace(workspace: Workspace): boolean { return workspace.account.account_id != null && workspace.account.is_deactivated !== true && (workspace.can_access_with_session !== false || workspace.account.structure === "personal"); }
function isRecoverableWorkspace(workspace: Workspace): boolean { return workspace.account.account_id != null && recoveryAction(workspace) != null; }
function translated(id: string, defaultMessage: string, description: string): unknown { return jsx.jsx(shared.Y2, { id, defaultMessage, description }); }

function RecoveryDialog({ workspace, activeWorkspaces, recoveryWorkspaces, pending, error, onChooseWorkspace, onRecover, onSelectWorkspace }: { workspace?: Workspace; activeWorkspaces: Workspace[]; recoveryWorkspaces: Workspace[]; pending: string | null; error: boolean; onChooseWorkspace?(): void; onRecover?(): void; onSelectWorkspace(workspace: Workspace): void }): unknown {
  const action = recoveryAction(workspace);
  return jsx.jsx(shared.Ih, { open: true, showDialogClose: false, shouldIgnoreClickOutside: true, size: "compact", variant: "chatgpt", children: jsx.jsxs(shared.Oh, { as: "form", "aria-busy": pending != null, className: "gap-4 p-4 select-none", size: "viewport", variant: "chatgpt", children: [
    jsx.jsx(shared.Rh, { className: "text-lg font-normal", children: translated("workspaceRecovery.title", "Your workspace has been deactivated", "Title of the blocking workspace recovery dialog") }),
    workspace == null ? null : jsx.jsx("div", { className: "text-base", children: workspace.account.name ?? translated("workspaceRecovery.unnamedWorkspace", "Unnamed workspace", "Fallback label for a workspace whose name is missing in workspace recovery") }),
    action == null ? null : jsx.jsx(shared.Yh, { color: "outlineGhost", disabled: pending != null, loading: pending === "recover", onClick: onRecover, children: action === "customer_portal" ? "Manage subscription" : "Purchase subscription" }),
    error ? jsx.jsx("p", { role: "alert", children: translated("workspaceRecovery.error", "We couldn’t complete that request", "Failure while loading workspace recovery or performing a recovery action") }) : null,
    ...activeWorkspaces.map((candidate) => jsx.jsx(appPrimary.uc, { density: "compact", isDisabled: pending != null, isSelected: false, title: candidate.account.structure === "personal" ? "Personal account" : candidate.account.name, onSelect: () => onSelectWorkspace(candidate) }, candidate.account.account_id)),
    recoveryWorkspaces.length > 1 ? jsx.jsx(appPrimary.dc, { workspaces: recoveryWorkspaces, current: workspace, onSelect: onSelectWorkspace }) : null,
    onChooseWorkspace == null ? null : jsx.jsx(shared.Yh, { color: "ghost", disabled: pending != null, loading: pending === "choose-workspace", onClick: onChooseWorkspace, children: "Sign in to another workspace" }),
  ] }) });
}

function WorkspaceRecoveryController({ actions, children }: { actions: RecoveryActions; children?: unknown }): unknown {
  const scope = shared.LX(shared.ZI);
  const identity = initial.N6t();
  const { pathname } = initial.i_n();
  const marker = shared.HX<{ accountId: string; userId: string } | null>(appPrimary.bc);
  const accountId = marker?.userId === identity.userId ? marker.accountId : identity.accountId;
  const enabled = (identity.authMethod === "chatgpt" || identity.authMethod === "chatgptAuthTokens") && identity.userId != null && accountId != null && !pathname.startsWith("/checkout/");
  const query = shared._L<AccountsResponse>({ enabled, queryKey: ["workspace-recovery", "accounts-check", identity.userId, accountId], queryFn: async ({ signal }: { signal: AbortSignal }) => initial.udn.safeGet("/accounts/check/{version}", { parameters: { path: { version: accountsApiVersion } }, signal }), refetchOnMount: "always", refetchOnWindowFocus: false, retry: false, staleTime: 0 });
  const workspace = accountId == null ? undefined : query.data?.accounts[accountId];
  const blocked = marker != null || accountId != null && (query.isLoading || query.error != null || workspace?.account.is_deactivated === true);
  if (!blocked) return pathname === recoveryPath ? jsx.jsx(initial.Ygn, { replace: true, to: "/" }) : jsx.jsx(jsx.Fragment, { children });
  if (pathname !== recoveryPath && !pathname.startsWith("/checkout/")) return jsx.jsx(initial.Ygn, { replace: true, to: recoveryPath });
  if (pathname.startsWith("/checkout/")) return jsx.jsx(jsx.Fragment, { children });
  const ordered = query.data?.account_ordering.flatMap((id) => query.data?.accounts[id] == null ? [] : [query.data.accounts[id]]) ?? [];
  const active = ordered.filter(isActiveWorkspace);
  const recoverable = ordered.filter(isRecoverableWorkspace);
  const [pending, setPending] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);
  const controller = React.useRef<AbortController | null>(null);
  const run = async (id: string, operation: (signal: AbortSignal) => Promise<void>): Promise<void> => {
    if (controller.current != null) return;
    const next = new AbortController(); controller.current = next; setPending(id); setFailed(false);
    try { await operation(next.signal); } catch { if (!next.signal.aborted) setFailed(true); } finally { if (controller.current === next) { controller.current = null; setPending(null); } }
  };
  const selectWorkspace = (candidate: Workspace): void => { const id = candidate.account.account_id; if (id == null || actions.switchWorkspace == null) return; void run(id, async (signal) => { if (!await actions.switchWorkspace?.(candidate, signal)) throw Error("Workspace switch did not complete"); scope.set(appPrimary.bc, candidate.account.is_deactivated === true && identity.userId != null ? { accountId: id, userId: identity.userId } : null); }); };
  const recover = recoveryAction(workspace) == null || workspace == null ? undefined : (): void => { void run("recover", async (signal) => { if (accountId == null || identity.userId == null || !await actions.isCurrentAccount(accountId, identity.userId)) throw Error("Authenticated workspace changed during recovery"); if (recoveryAction(workspace) === "customer_portal") { const response = await initial.udn.safeGet("/payments/customer_portal", { parameters: { query: { account_id: accountId } }, signal }) as { url: string }; signal.throwIfAborted(); actions.openCustomerPortal(response.url); } else await actions.openCheckout(workspace, signal); }); };
  return jsx.jsx(RecoveryDialog, { workspace, activeWorkspaces: active, recoveryWorkspaces: recoverable, pending, error: failed || query.error != null, onChooseWorkspace: actions.chooseWorkspace == null ? undefined : () => { void run("choose-workspace", async () => actions.chooseWorkspace?.()); }, onRecover: recover, onSelectWorkspace: selectWorkspace });
}

function WorkspaceRecoveryGate({ children }: { children?: unknown }): unknown {
  initialize();
  const scope = shared.LX(shared.ZI);
  const { refetch } = initial.j6t();
  const navigate = initial.o_n();
  const actions: RecoveryActions = {
    chooseWorkspace: async () => { await initial.Ugn(scope, initial.ugn).logout(); await navigate("/login?workspaceRecovery=true", { replace: true }); },
    isCurrentAccount: async (accountId, userId) => { const result = await refetch(); return !result.isError && result.data?.accountId === accountId && result.data.userId === userId; },
    openCheckout: async (workspace) => { const accountId = workspace.account.account_id; if (accountId == null) return; const url = new URL("/pricing/", "https://chatgpt.com"); url.searchParams.set("reactivateWorkspaceId", accountId); url.hash = "team-pricing-seat-selection"; await navigate(initial.p0({ accountId, url: url.toString() })); },
    openCustomerPortal: (url) => initial.kft({ href: url, initiator: "open_in_browser_bridge", openTarget: "external-browser" }),
  };
  return jsx.jsx(WorkspaceRecoveryController, { actions, children });
}

function initialize(): void {
  if (initialized) return; initialized = true;
  shared.$3(); shared.$h(); shared.FX(); shared.K2(); shared.QI(); shared.Zh(); shared.lw(); shared.wL();
  initial.Bfn(); initial.Dft(); initial.M6t(); initial.Qgn(); initial.Rln(); initial.Wgn(); initial.h0(); initial.iot(); initial.k6t(); initial.pdn(); initial.rot(); appPrimary.yc();
  React = shared.e6(); jsx = shared.I3();
}

initialize();
export { WorkspaceRecoveryGate };
