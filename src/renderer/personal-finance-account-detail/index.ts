// personal-finance-account-detail —— Finances 账户侧栏中的 Ledger MCP 详情。
// 原版：app/webview/assets/account-detail-8b86d3b0adfc.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as widgetQueriesChunk from "@rchunk/chatgpt-ecosystem-widget-queries";
import * as conversationChunk from "@rchunk/conversation";

void runtimeChunk;

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

interface ReactRuntime {
  useRef<T>(value: T): { current: T };
}

interface QueryResult<Data> {
  data?: Data;
  isError: boolean;
  refetch(): Promise<unknown> | unknown;
}

interface AppSharedBindings {
  $3(): void;
  BX<Parameter, Data>(query: unknown, parameter: Parameter): QueryResult<Data>;
  FX(): void;
  I3(): JsxRuntime;
  K2(): void;
  LX(scope: unknown): { queryClient: { invalidateQueries(input: { queryKey: unknown[] }): Promise<unknown> } };
  Qh: unknown;
  Y2: unknown;
  Yh: unknown;
  e6(): ReactRuntime;
}

interface AppInitialBindings {
  FH(input: { accountId: string; signal: AbortSignal }): { handleRequest(request: ToolRequest): Promise<unknown> };
  Izt: unknown;
  M6t(): void;
  N6t(): { accountId: string | null };
  PH: unknown;
  Qgn(): void;
  gln(conversation: unknown): string | null;
  itn(): void;
  jzt: string;
  lq: unknown;
  o_n(): () => void;
  oqt(): void;
  rqt(): string;
  ugn: string;
}

interface WidgetQueryBindings {
  n(): void;
  t: unknown;
}

interface ConversationBindings {
  n(): void;
  t(input: { accountId: string; prompt: string; onConversationStarted(value: unknown): void }): Promise<void>;
}

interface LedgerWidget {
  appId: string;
  request: Record<string, unknown>;
  toolResult?: { content: unknown[] };
}

interface ToolRequest {
  method?: string;
  params?: { name?: unknown };
}

export interface PersonalFinanceAccountDetailProps extends Record<string, unknown> {
  accountId: string;
  accountSelection: unknown;
  onClose(): void;
}

const {
  $3: initializeRuntime,
  BX: useQuery,
  FX: initializeSignals,
  I3: getJsxRuntime,
  K2: initializeComponents,
  LX: useScope,
  Qh: LoadingSpinner,
  Y2: FormattedMessage,
  Yh: Button,
  e6: getReactRuntime,
} = appSharedChunk as unknown as AppSharedBindings;
const {
  FH: createRequestHandler,
  Izt: appScope,
  M6t: initializeWidgetHost,
  N6t: useAccountRoute,
  PH: WidgetHost,
  Qgn: initializeRouter,
  gln: getConversationId,
  itn: initializePersonalFinance,
  jzt: ledgerConnectorId,
  lq: financeAccountSensitivityFamily,
  o_n: useClosePanel,
  oqt: initializeConversationLauncher,
  rqt: createConversationId,
  ugn: ledgerHostId,
} = appInitialChunk as unknown as AppInitialBindings;
const { n: initializeWidgetQueries, t: ledgerWidgetQuery } =
  widgetQueriesChunk as unknown as WidgetQueryBindings;
const { n: initializeConversation, t: startConversation } =
  conversationChunk as unknown as ConversationBindings;

initializeRuntime();
initializeSignals();
initializeComponents();
initializeRouter();
initializePersonalFinance();
initializeWidgetHost();
initializeConversationLauncher();
initializeWidgetQueries();
initializeConversation();

const React = getReactRuntime();
const jsx = getJsxRuntime();

function PersonalFinanceAccountDetail(props: PersonalFinanceAccountDetailProps): unknown {
  const route = useAccountRoute();
  if (route.accountId !== props.accountId) {
    return jsx.jsxs("div", {
      className: "flex h-full flex-col items-center justify-center gap-3",
      role: "status",
      children: [
        jsx.jsx(FormattedMessage, {
          id: "personalFinance.accountDetail.accountChanged",
          defaultMessage: "This account is no longer selected",
        }),
        jsx.jsx(Button, {
          color: "secondary",
          onClick: props.onClose,
          children: jsx.jsx(FormattedMessage, {
            id: "personalFinance.accountDetail.closeUnavailable",
            defaultMessage: "Close",
          }),
        }),
      ],
    });
  }
  return jsx.jsx(AccountDetailHost, props, `${props.accountId}:${String(props.accountSelection)}`);
}

function AccountDetailHost({ accountId, accountSelection, onClose }: PersonalFinanceAccountDetailProps): unknown {
  const scope = useScope(appScope);
  const closePanel = useClosePanel();
  const controller = React.useRef(new AbortController());
  const conversationId = React.useRef(createConversationId());
  const sensitivity = useQuery(financeAccountSensitivityFamily, accountId).data;
  const widget = useQuery<{ accountId: string; connectorId: string; hostId: string; template: string }, LedgerWidget>(
    ledgerWidgetQuery,
    { accountId, connectorId: ledgerConnectorId, hostId: ledgerHostId, template: "internal://ledger" },
  );

  if (widget.data == null) {
    return jsx.jsx("div", {
      className: "flex h-full flex-col items-center justify-center gap-3",
      role: "status",
      children: widget.isError
        ? jsx.jsxs(jsx.Fragment, {
            children: [
              jsx.jsx(FormattedMessage, {
                id: "personalFinance.accountDetail.loadError",
                defaultMessage: "Your account details couldn’t be loaded",
              }),
              jsx.jsx(Button, {
                color: "secondary",
                onClick: () => void widget.refetch(),
                children: jsx.jsx(FormattedMessage, {
                  id: "personalFinance.accountDetail.retry",
                  defaultMessage: "Try again",
                }),
              }),
            ],
          })
        : jsx.jsx(LoadingSpinner, { className: "icon-sm" }),
    });
  }

  const request = {
    appUri: `connectors://${ledgerConnectorId}`,
    chatGptConversationId: conversationId.current,
    template: "internal://ledger",
    toolName: "",
    toolInput: {},
    viewParams: {
      route: "account_detail",
      accountSelection,
      accountDetailSource: "mattress_accounts_tab",
      hideHeader: true,
      loadingState: "detail",
      enableTargetedReply: true,
      sensitive_values_hidden: sensitivity,
    },
  };
  const handleRequest = async (toolRequest: ToolRequest): Promise<unknown> => {
    const result = await createRequestHandler({ accountId, signal: controller.current.signal }).handleRequest(toolRequest);
    if (toolRequest.method === "tools/call" && ["resync_linked_account", "remove_account", "remove_linked_account"].includes(String(toolRequest.params?.name))) {
      await scope.queryClient.invalidateQueries({ queryKey: ["personal-finance", accountId] });
    }
    return result;
  };
  const requestTargetedReply = async (prompt: string): Promise<void> => {
    let nextConversationId: string | null = null;
    await startConversation({ accountId, prompt, onConversationStarted: (value) => { nextConversationId = getConversationId(value); } });
    if (nextConversationId != null && !controller.current.signal.aborted) {
      closePanel();
      onClose();
    }
  };

  return jsx.jsx(WidgetHost, {
    conversationId: conversationId.current,
    hostId: ledgerHostId,
    lifetime: "component",
    mcpAppId: widget.data.appId,
    showDialogTitle: false,
    result: {
      ...widget.data,
      request,
      toolResult: widget.data.toolResult ?? { content: [] },
      mcpAppHostAdapter: {
        displayMode: "sidebar",
        onRequestClose: onClose,
        handleRequest,
        requestTargetedReply,
      },
    },
  });
}

export { PersonalFinanceAccountDetail };
