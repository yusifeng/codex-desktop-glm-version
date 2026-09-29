// personal-finance-page —— Finances 入口、账户连接、仪表盘与历史会话。

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/index-ymUnTRBB";
import "@rchunk/dist-e0bb3d63cc62";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/tabs";
import "@rchunk/app-connect-modal";
import "@rchunk/use-chatgpt-composer-controller";
import "@rchunk/conversation";
import * as plaidLinkChunk from "@rchunk/plaid-link";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type FinanceTab = "dashboard" | "chats" | "accounts" | "transactions";
type QueryResult<Value> = {
  data?: Value;
  error?: unknown;
  fetchNextPage?(): Promise<unknown> | unknown;
  hasNextPage?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  isPending?: boolean;
  refetch?(): Promise<unknown> | unknown;
};
interface FinanceLink { id: string; institution_name?: string | null; status?: string | null }
interface FinanceWidget { can_hide?: boolean; id: string; title?: string | null; value?: string | null }
interface FinanceConversation { create_time?: string | null; id: string; snippet?: string | null; title?: string | null; update_time?: string | null }
interface FinanceRuntime {
  $3(): void;
  BX<Value>(descriptor: unknown, accountId?: string | null, options?: { enabled?: boolean }): QueryResult<Value>;
  I3(): JsxRuntime;
  LX(scope: unknown): unknown;
  ZI: unknown;
  e6: (() => ReactRuntime) & ReactRuntime;
}
interface InitialRuntime {
  BW: unknown;
  HW: unknown;
  LW: unknown;
  MW: unknown;
  N6t(): { accountId?: string | null };
  Pzt: string;
  Ygn: (props: { replace?: boolean; to: string }) => unknown;
  a_n(pattern: string): { params?: { tab?: string } } | null;
  o_n(): (path: string, options?: { replace?: boolean }) => void;
}
interface PlaidRuntime {
  n(): void;
  r(scope: unknown, options: { accountId: string; linkId?: string; returnTo?: string }): Promise<boolean>;
}
type PanelComponent = (props: Record<string, unknown>) => unknown;

const { $3: initializeRuntime, BX: useQuery, I3: getJsxRuntime, LX: useScope, ZI: AppScope, e6: getReactRuntime } = appSharedChunk as unknown as FinanceRuntime;
const { BW: contentQuery, HW: entitlementQuery, LW: linksQuery, MW: chatsQuery, N6t: useAccountRoute, Pzt: financeBasePath, Ygn: Navigate, a_n: matchRoute, o_n: useNavigate } = appInitialChunk as unknown as InitialRuntime;
const { n: initializePlaid, r: connectPlaid } = plaidLinkChunk as unknown as PlaidRuntime;

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
function initializePersonalFinancePage(): void {
  if (initialized) return;
  initializeRuntime();
  initializePlaid();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

function currentTab(): FinanceTab {
  const value = matchRoute(financeBasePath + "/:tab")?.params?.tab;
  return value === "accounts" || value === "chats" || value === "transactions" ? value : "dashboard";
}

function useDynamicPanel(loader: () => Promise<PanelComponent>, enabled: boolean): { component: PanelComponent | null; error: boolean } {
  const [component, setComponent] = React.useState<PanelComponent | null>(null);
  const [error, setError] = React.useState(false);
  React.useEffect(() => {
    if (!enabled || component != null) return;
    let active = true;
    loader().then((next) => { if (active) setComponent(() => next); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [component, enabled, loader]);
  return { component, error };
}

async function loadAccountsPanel(): Promise<PanelComponent> {
  const module = await import("@rchunk/accounts-valdi");
  return module.PersonalFinanceAccountsValdi as PanelComponent;
}
async function loadTransactionsPanel(): Promise<PanelComponent> {
  const module = await import("@rchunk/transactions");
  return module.PersonalFinanceTransactions as PanelComponent;
}
async function loadEntityPanel(): Promise<PanelComponent> {
  const module = await import("@rchunk/chatgpt-entity-side-panel-tab");
  return module.ChatGptEntitySidePanelTab as PanelComponent;
}

function Loading(): unknown { return jsx.jsx("div", { role: "status", children: "Loading your finances…" }); }
function ErrorState({ onRetry }: { onRetry?(): void }): unknown {
  return jsx.jsxs("section", { children: [
    jsx.jsx("p", { role: "alert", children: "Your financial information couldn’t be loaded" }),
    onRetry == null ? null : jsx.jsx("button", { type: "button", onClick: onRetry, children: "Try again" }),
  ] });
}

function ChatsView({ query }: { query: QueryResult<{ pages?: Array<{ items?: FinanceConversation[] }> }> }): unknown {
  if (query.isLoading) return jsx.jsx(Loading, {});
  if (query.isError) return jsx.jsx(ErrorState, { onRetry: () => { void query.refetch?.(); } });
  const conversations = query.data?.pages?.flatMap((page) => page.items ?? []) ?? [];
  if (conversations.length === 0) return jsx.jsx("p", { children: "No finance conversations yet" });
  return jsx.jsxs("section", { children: [
    jsx.jsx("ul", { children: conversations.map((conversation) => jsx.jsx("li", { children: jsx.jsxs("a", { href: "/c/" + conversation.id, children: [
      jsx.jsx("strong", { children: conversation.title ?? "Finance conversation" }),
      conversation.snippet == null ? null : jsx.jsx("span", { children: conversation.snippet }),
      conversation.update_time == null && conversation.create_time == null ? null : jsx.jsx("time", { children: conversation.update_time ?? conversation.create_time }),
    ] }) }, conversation.id)) }),
    query.hasNextPage ? jsx.jsx("button", { type: "button", disabled: query.isFetchingNextPage === true, onClick: () => { void query.fetchNextPage?.(); }, children: query.isFetchingNextPage ? "Loading…" : "Load more" }) : null,
  ] });
}

function Dashboard({ accountId, hidden, onConnect, onOpenEntity, onToggleWidget, sensitiveValuesHidden, widgets }: {
  accountId: string;
  hidden: Set<string>;
  onConnect(linkId?: string): void;
  onOpenEntity(widget: FinanceWidget): void;
  onToggleWidget(id: string): void;
  sensitiveValuesHidden: boolean;
  widgets: FinanceWidget[];
}): unknown {
  const visible = widgets.filter((widget) => !hidden.has(widget.id));
  return jsx.jsxs("section", { "data-account-id": accountId, children: [
    visible.length === 0 ? jsx.jsx("p", { children: "Your dashboard is ready for financial insights" }) : jsx.jsx("div", { children: visible.map((widget) => jsx.jsxs("article", { "data-widget-id": widget.id, children: [
      jsx.jsx("h2", { children: widget.title ?? "Financial overview" }),
      jsx.jsx("p", { children: sensitiveValuesHidden ? "••••" : widget.value ?? "No data yet" }),
      jsx.jsx("button", { type: "button", onClick: () => onOpenEntity(widget), children: "View details" }),
      widget.can_hide === false ? null : jsx.jsx("button", { type: "button", onClick: () => onToggleWidget(widget.id), children: "Hide widget" }),
    ] }, widget.id)) }),
    jsx.jsx("button", { type: "button", onClick: () => onConnect(), children: "Connect another account" }),
  ] });
}

function FinancePage({ accountId }: { accountId: string | null }): unknown {
  const navigate = useNavigate();
  const scope = useScope(AppScope);
  const tab = currentTab();
  const entitlement = useQuery<{ finances?: boolean }>(entitlementQuery, accountId);
  const enabled = entitlement.data?.finances === true;
  const links = useQuery<{ links?: FinanceLink[] }>(linksQuery, accountId, { enabled });
  const content = useQuery<{ content_state?: string; widgets?: FinanceWidget[] }>(contentQuery, accountId, { enabled });
  const chats = useQuery<{ pages?: Array<{ items?: FinanceConversation[] }> }>(chatsQuery, accountId, { enabled: enabled && tab === "chats" });
  const [connectionStarting, setConnectionStarting] = React.useState(false);
  const [sensitiveValuesHidden, setSensitiveValuesHidden] = React.useState(true);
  const [hiddenWidgets, setHiddenWidgets] = React.useState<Set<string>>(() => new Set());
  const [manageOpen, setManageOpen] = React.useState(false);
  const [memoriesOpen, setMemoriesOpen] = React.useState(false);
  const [selectedEntity, setSelectedEntity] = React.useState<FinanceWidget | null>(null);
  const [transactionsVisited, setTransactionsVisited] = React.useState(tab === "transactions");
  React.useEffect(() => { if (tab === "transactions") setTransactionsVisited(true); }, [tab]);
  const accountPanel = useDynamicPanel(loadAccountsPanel, enabled && tab === "accounts");
  const transactionsPanel = useDynamicPanel(loadTransactionsPanel, enabled && transactionsVisited);
  const entityPanel = useDynamicPanel(loadEntityPanel, selectedEntity != null);

  if (entitlement.isLoading) return jsx.jsx(Loading, {});
  if (!enabled || accountId == null) return jsx.jsx(Navigate, { replace: true, to: "/" });
  if (links.isLoading || content.isLoading || links.isFetching || content.isFetching) return jsx.jsx(Loading, {});
  if (links.isError || content.isError) return jsx.jsx(ErrorState, { onRetry: () => { void Promise.all([links.refetch?.(), content.refetch?.()]); } });

  const connectedLinks = links.data?.links ?? [];
  const widgets = content.data?.widgets ?? [];
  const connect = (linkId?: string): void => {
    if (connectionStarting) return;
    setConnectionStarting(true);
    void connectPlaid(scope, { accountId, linkId, returnTo: financeBasePath }).finally(() => setConnectionStarting(false));
  };
  const selectTab = (next: FinanceTab): void => {
    if (next === tab) return;
    navigate(next === "dashboard" ? financeBasePath : financeBasePath + "/" + next, { replace: true });
  };
  const toggleWidget = (id: string): void => setHiddenWidgets((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  let contentView: unknown;
  const onboarding = tab === "dashboard" && connectedLinks.length === 0 && (content.data?.content_state == null || content.data.content_state === "empty");
  if (onboarding) contentView = jsx.jsxs("section", { children: [
    jsx.jsx("h2", { children: "A new way to manage your finances" }),
    jsx.jsx("p", { children: "Securely connect your accounts for help with spending, subscriptions, balances, and investments." }),
    jsx.jsx("button", { type: "button", disabled: connectionStarting, onClick: () => connect(), children: connectionStarting ? "Connecting…" : "Connect Finances" }),
    jsx.jsx("p", { children: "ChatGPT can make mistakes and isn’t a licensed investment adviser or authorized to prepare tax returns." }),
  ] });
  else if (tab === "dashboard") contentView = jsx.jsx(Dashboard, { accountId, hidden: hiddenWidgets, onConnect: connect, onOpenEntity: setSelectedEntity, onToggleWidget: toggleWidget, sensitiveValuesHidden, widgets });
  else if (tab === "chats") contentView = jsx.jsx(ChatsView, { query: chats });
  else if (tab === "accounts") contentView = accountPanel.error ? jsx.jsx(ErrorState, {}) : accountPanel.component == null ? jsx.jsx(Loading, {}) : jsx.jsx(accountPanel.component, { accountId, connectionStarting, onConnectAccount: connect });
  else contentView = null;

  const TransactionsPanel = transactionsPanel.component;
  const EntityPanel = entityPanel.component;
  return jsx.jsxs("main", { children: [
    jsx.jsxs("header", { children: [
      jsx.jsx("h1", { children: "Finances" }),
      jsx.jsx("nav", { "aria-label": "Finance views", children: (["dashboard", "chats", "accounts", "transactions"] as const).map((value) => jsx.jsx("button", { type: "button", "aria-current": tab === value ? "page" : undefined, onClick: () => selectTab(value), children: value[0].toUpperCase() + value.slice(1) }, value)) }),
      jsx.jsxs("div", { "aria-label": "More options", children: [
        jsx.jsx("button", { type: "button", onClick: () => setSensitiveValuesHidden((value) => !value), children: sensitiveValuesHidden ? "Show values" : "Hide values" }),
        jsx.jsx("button", { type: "button", onClick: () => setManageOpen(true), children: "Manage institutions" }),
        jsx.jsx("button", { type: "button", onClick: () => setMemoriesOpen(true), children: "View financial memories" }),
        jsx.jsx("a", { href: "https://help.openai.com/en/articles/20001222-finances-in-chatgpt", children: "Help Center" }),
      ] }),
    ] }),
    contentView,
    transactionsVisited ? jsx.jsx("section", { hidden: tab !== "transactions", children: transactionsPanel.error ? jsx.jsx(ErrorState, {}) : TransactionsPanel == null ? jsx.jsx(Loading, {}) : jsx.jsx(TransactionsPanel, { accountId, isActive: tab === "transactions" }) }) : null,
    manageOpen ? jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: "Manage institutions" }), connectedLinks.length === 0 ? jsx.jsx("p", { children: "No financial accounts connected yet" }) : connectedLinks.map((link) => jsx.jsxs("section", { children: [jsx.jsx("span", { children: link.institution_name ?? "Financial institution" }), jsx.jsx("button", { type: "button", onClick: () => connect(link.id), children: "Reconnect" })] }, link.id)), jsx.jsx("button", { type: "button", onClick: () => setManageOpen(false), children: "Close" })] }) : null,
    memoriesOpen ? jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: "Financial memories" }), jsx.jsx("p", { children: "Review information ChatGPT remembers for finance conversations." }), jsx.jsx("button", { type: "button", onClick: () => setMemoriesOpen(false), children: "Close" })] }) : null,
    selectedEntity != null ? EntityPanel == null ? jsx.jsx(Loading, {}) : jsx.jsx(EntityPanel, { conversationId: "mattress-ledger-widget", params: { category: "ledger_detail_sidebar", widgetId: selectedEntity.id, sensitive_values_hidden: sensitiveValuesHidden } }) : null,
  ] });
}

function PersonalFinancePage(): unknown {
  const { accountId = null } = useAccountRoute();
  return jsx.jsx(FinancePage, { accountId }, accountId ?? "personal-finance");
}

initializePersonalFinancePage();
export { PersonalFinancePage };
