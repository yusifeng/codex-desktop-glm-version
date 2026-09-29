import "@rchunk/rolldown-runtime";
import {
  $3 as initializeJsxRuntime,
  I3 as getJsxRuntime,
  Qh as LoadingSpinner,
  Yh as Button,
  e6 as getReactRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  type Account,
  o_n as useNavigate,
  uht as useAccount,
} from "@rchunk/app-initial";
import "@rchunk/app-primary";
import {
  n as initializeSuggestionList,
  t as HomeSuggestionList,
} from "@rchunk/home-suggestion-list";
import {
  n as initializeAppConnectModal,
  t as AppConnectModal,
} from "@rchunk/app-connect-modal";
import {
  n as useAppConnectFlow,
  t as initializeAppConnectFlow,
} from "@rchunk/use-app-connect-flow";
import "@rchunk/chatgpt-tasks-runtime";
import "@rchunk/home-task-suggestions-core";
import {
  n as initializeWorkHomeCore,
  t as WorkHomeCore,
} from "@rchunk/chatgpt-work-home-page-core";
import "@rchunk/chatgpt-user-context";

interface WorkConversation {
  activityText?: string | null;
  backend?: "app-server" | "chatgpt";
  id: string;
  recencyAt?: number;
  running?: boolean;
  summary?: string | null;
  title?: string | null;
}

interface PromptDestination {
  developer_message?: string | null;
  prompt: string;
  show_prompt_on_hover?: boolean;
  type: "prompt";
}

interface ConnectorDestination {
  connector_id: string;
  type: "connector";
}

interface ConversationDestination {
  conversation_id: string;
  type: "conversation";
}

type SuggestionDestination =
  ConnectorDestination | ConversationDestination | PromptDestination;

interface WorkSuggestion {
  action_type?: string;
  description?: string | null;
  destination_metadata?: SuggestionDestination | null;
  disabled?: boolean;
  emoji?: string | null;
  id: string;
  item_type: string;
  producer?: string;
  title: string;
}

interface Snapshot<Data> {
  data?: Data;
  error?: string | null;
  loading?: boolean;
}

interface WorkComposer {
  getText?(): string;
  setText?(text: string): void;
  submit?(options?: { developerInstructions?: string }): Promise<void> | void;
}

interface LighthouseWorkService {
  dismissConversation(accountId: string, item: WorkConversation): Promise<void>;
  loadConversations(
    accountId: string,
    workspaceId: string | null,
  ): Promise<readonly WorkConversation[]>;
  loadSuggestions(accountId: string): Promise<readonly WorkSuggestion[]>;
  recordSuggestionInteraction(
    item: WorkSuggestion,
    interaction: "clicked" | "dismissed" | "viewed",
  ): Promise<void>;
}

interface LighthouseWorkHomePageProps {
  account?: Account;
  canUseWork?: boolean;
  composer?: WorkComposer;
  conversationsSnapshot?: Snapshot<readonly WorkConversation[]>;
  displayName?: string | null;
  homepageTakeover?: boolean;
  onOpenLocalConversation?(item: WorkConversation): void;
  service?: LighthouseWorkService;
  suggestionsAllowed?: boolean;
  suggestionsSnapshot?: Snapshot<readonly WorkSuggestion[]>;
  takeoverTarget?: unknown;
}

const defaultService: LighthouseWorkService = {
  async dismissConversation(_accountId, item) {
    if (item.backend === "app-server") return;
    const response = await fetch(
      `/conversation/${encodeURIComponent(item.id)}/async-status`,
      {
        body: JSON.stringify({ status: null }),
        headers: { "content-type": "application/json" },
        method: "POST",
      },
    );
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
  },
  async loadConversations() {
    const response = await fetch("/inbox/items?unread_only=true&limit=100");
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    const payload = (await response.json()) as {
      items?: readonly WorkConversation[];
    };
    return payload.items ?? [];
  },
  async loadSuggestions() {
    const response = await fetch("/composer/items?limit=20&entrypoint=work");
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    const payload = (await response.json()) as {
      items?: readonly WorkSuggestion[];
    };
    return payload.items ?? [];
  },
  async recordSuggestionInteraction(item, interaction) {
    const response = await fetch("/composer/items/interactions", {
      body: JSON.stringify({
        entrypoint: "work",
        id: item.id,
        interaction_type: interaction,
        item_type: item.item_type,
        producer: item.producer,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
  },
};

let React: ReactRuntime;
let jsx: JsxRuntime;

function greeting(displayName?: string | null): string {
  const firstName = displayName?.trim().split(/\s+/)[0] ?? "";
  const safeName =
    firstName.includes("@") || /^\d+$/.test(firstName)
      ? ""
      : firstName.replace(/[^a-zA-ZÀ-ž]+/g, "");
  const hour = new Date().getHours();
  const period =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return safeName ? `${period}, ${safeName}` : period;
}

function WorkStatus(props: {
  error?: string | null;
  loading?: boolean;
}): unknown {
  if (props.loading) {
    return jsx.jsxs("div", {
      role: "status",
      children: [
        jsx.jsx(LoadingSpinner, {}),
        jsx.jsx("span", { children: "Loading Work…" }),
      ],
    });
  }
  if (props.error) {
    return jsx.jsx("p", {
      role: "status",
      children: "Some chats couldn't be refreshed",
    });
  }
  return null;
}

function CatchUpList(props: {
  error?: string | null;
  items: readonly WorkConversation[];
  onDismiss(item: WorkConversation): void;
  onOpen(item: WorkConversation): void;
}): unknown {
  const [expanded, setExpanded] = React.useState(false);
  const sorted = [...props.items].sort(
    (left, right) =>
      (right.recencyAt ?? 0) - (left.recencyAt ?? 0) ||
      left.id.localeCompare(right.id),
  );
  const visible = expanded ? sorted : sorted.slice(0, 5);
  const listItems = visible.map((item) => ({
    disabled: false,
    dismissLabel: `Mark ${item.title || "New chat"} as read`,
    id: item.id,
    label: `${item.title || "New chat"}${item.activityText || item.summary ? ` · ${item.activityText || item.summary}` : item.running ? " · Working on it" : ""}`,
    onClick: () => props.onOpen(item),
    onDismiss: item.running ? undefined : () => props.onDismiss(item),
  }));
  return jsx.jsxs(React.Fragment, {
    children: [
      jsx.jsx("p", {
        children: sorted.length
          ? `You have ${sorted.length} ${sorted.length === 1 ? "chat" : "chats"} to check in on`
          : "What would you like to work on?",
      }),
      props.error ? jsx.jsx(WorkStatus, { error: props.error }) : null,
      jsx.jsx(HomeSuggestionList, { composerMode: "work", items: listItems }),
      sorted.length > 5
        ? jsx.jsx(Button, {
            children: expanded ? "Show less" : `${sorted.length - 5} more`,
            onClick: () => setExpanded((value) => !value),
          })
        : null,
    ],
  });
}

function Suggestions(props: {
  accountId: string;
  composer: WorkComposer;
  error?: string | null;
  items: readonly WorkSuggestion[];
  navigate: ReturnType<typeof useNavigate>;
  service: LighthouseWorkService;
}): unknown {
  const [pendingIds, setPendingIds] = React.useState<readonly string[]>([]);
  const [hiddenIds, setHiddenIds] = React.useState<readonly string[]>([]);
  const [actionError, setActionError] = React.useState(false);
  const connectFlow = useAppConnectFlow();
  const suggestions = props.items
    .filter(
      (item) =>
        item.item_type !== "unread_automation" &&
        item.destination_metadata != null &&
        !hiddenIds.includes(item.id),
    )
    .slice(0, 3);
  const act = async (item: WorkSuggestion, dismiss: boolean): Promise<void> => {
    if (pendingIds.includes(item.id)) return;
    setPendingIds((current) => [...current, item.id]);
    setActionError(false);
    try {
      if (dismiss) {
        await props.service.recordSuggestionInteraction(item, "dismissed");
        setHiddenIds((current) => [...current, item.id]);
        return;
      }
      const destination = item.destination_metadata;
      if (destination?.type === "prompt") {
        props.composer.setText?.(destination.prompt);
        await props.composer.submit?.({
          developerInstructions: destination.developer_message ?? undefined,
        });
      } else if (destination?.type === "conversation") {
        props.navigate(`/c/${encodeURIComponent(destination.conversation_id)}`);
      } else if (destination?.type === "connector") {
        await connectFlow.handleConnectApp(
          { id: destination.connector_id, name: item.title },
          { forceInApp: true },
        );
      }
      await props.service.recordSuggestionInteraction(item, "clicked");
      setHiddenIds((current) => [...current, item.id]);
    } catch {
      setActionError(true);
    } finally {
      setPendingIds((current) => current.filter((id) => id !== item.id));
    }
  };
  if (suggestions.length === 0 && !props.error) return null;
  return jsx.jsxs(React.Fragment, {
    children: [
      jsx.jsxs("section", {
        "aria-label": "Suggested for you",
        children: [
          jsx.jsx("h2", { children: "Suggested for you" }),
          props.error
            ? jsx.jsx("p", {
                role: "status",
                children: "Suggestions couldn't be refreshed",
              })
            : null,
          actionError
            ? jsx.jsx("p", {
                role: "alert",
                children: "Couldn't complete this action. Please try again",
              })
            : null,
          jsx.jsx(HomeSuggestionList, {
            composerMode: "work",
            items: suggestions.map((item) => ({
              disabled: pendingIds.includes(item.id) || item.disabled === true,
              id: item.id,
              label:
                item.action_type === "connect_connector" &&
                item.description?.trim()
                  ? item.description
                  : item.title,
              onClick: () => void act(item, false),
              onDismiss: () => void act(item, true),
              trailing:
                item.destination_metadata?.type === "connector"
                  ? "Connect"
                  : null,
            })),
          }),
        ],
      }),
      jsx.jsx(AppConnectModal, {
        app: connectFlow.connectingApp,
        onConnected: connectFlow.clearConnectingApp,
        onOAuthStarted: connectFlow.handleAppConnectOAuthStarted,
        onOpenChange: (open: boolean) => {
          if (!open) connectFlow.clearConnectingApp();
        },
        waitForConnectedHandler: true,
      }),
    ],
  });
}

function WorkHomeContent(props: {
  account: Account;
  composer: WorkComposer;
  displayName?: string | null;
  homepageTakeover?: boolean;
  onOpenLocalConversation?(item: WorkConversation): void;
  service: LighthouseWorkService;
  suggestionsAllowed: boolean;
  conversationsSnapshot?: Snapshot<readonly WorkConversation[]>;
  suggestionsSnapshot?: Snapshot<readonly WorkSuggestion[]>;
  takeoverTarget?: unknown;
}): unknown {
  const navigate = useNavigate();
  const [conversations, setConversations] = React.useState<
    readonly WorkConversation[]
  >(props.conversationsSnapshot?.data ?? []);
  const [conversationLoading, setConversationLoading] = React.useState(
    props.conversationsSnapshot?.loading ?? props.conversationsSnapshot == null,
  );
  const [conversationError, setConversationError] = React.useState<
    string | null
  >(props.conversationsSnapshot?.error ?? null);
  const [suggestions, setSuggestions] = React.useState<
    readonly WorkSuggestion[]
  >(props.suggestionsSnapshot?.data ?? []);
  const [suggestionsError, setSuggestionsError] = React.useState<string | null>(
    props.suggestionsSnapshot?.error ?? null,
  );
  const workspaceId =
    props.account.structure === "personal" ? null : props.account.id;
  React.useEffect(() => {
    if (props.conversationsSnapshot != null) return;
    setConversationLoading(true);
    props.service
      .loadConversations(props.account.id, workspaceId)
      .then(setConversations)
      .catch(() => setConversationError("refresh-error"))
      .finally(() => setConversationLoading(false));
  }, [
    props.account.id,
    props.conversationsSnapshot,
    props.service,
    workspaceId,
  ]);
  React.useEffect(() => {
    if (!props.suggestionsAllowed || props.suggestionsSnapshot != null) return;
    props.service
      .loadSuggestions(props.account.id)
      .then(setSuggestions)
      .catch(() => setSuggestionsError("refresh-error"));
  }, [
    props.account.id,
    props.service,
    props.suggestionsAllowed,
    props.suggestionsSnapshot,
  ]);
  const dismiss = (item: WorkConversation): void => {
    if (item.running) return;
    setConversations((current) =>
      current.filter((value) => value.id !== item.id),
    );
    props.service.dismissConversation(props.account.id, item).catch(() => {
      setConversationError("dismiss-error");
      setConversations((current) =>
        current.some((value) => value.id === item.id)
          ? current
          : [...current, item],
      );
    });
  };
  const open = (item: WorkConversation): void => {
    dismiss(item);
    if (item.backend === "app-server" && props.onOpenLocalConversation)
      props.onOpenLocalConversation(item);
    else navigate(`/c/${encodeURIComponent(item.id)}`);
  };
  return jsx.jsxs("main", {
    className: "lighthouse-work-home-page",
    children: [
      jsx.jsxs("div", {
        children: [
          props.homepageTakeover
            ? null
            : jsx.jsxs("div", {
                children: [
                  jsx.jsx("h1", { children: greeting(props.displayName) }),
                  conversationLoading && conversations.length === 0
                    ? jsx.jsx(WorkStatus, { loading: true })
                    : jsx.jsx(CatchUpList, {
                        error: conversationError,
                        items: conversations,
                        onDismiss: dismiss,
                        onOpen: open,
                      }),
                  props.suggestionsAllowed
                    ? jsx.jsx(Suggestions, {
                        accountId: props.account.id,
                        composer: props.composer,
                        error: suggestionsError,
                        items: suggestions,
                        navigate,
                        service: props.service,
                      })
                    : null,
                ],
              }),
          props.takeoverTarget,
        ],
      }),
      jsx.jsx("div", {
        "data-testid": "work-composer",
        children: props.composer,
      }),
    ],
  });
}

function LighthouseWorkHomePage(
  props: LighthouseWorkHomePageProps = {},
): unknown {
  const accountQuery = useAccount(undefined, { preview: false });
  const account = props.account ?? accountQuery.data;
  const composer = props.composer ?? {};
  if (props.canUseWork === false) {
    return jsx.jsxs("main", {
      children: [
        jsx.jsx("p", {
          role: "alert",
          children: "You don't have access to Work in this workspace.",
        }),
        jsx.jsx("div", { "data-testid": "work-composer", children: composer }),
      ],
    });
  }
  if (account == null) {
    return jsx.jsxs("main", {
      children: [
        jsx.jsx(WorkStatus, { loading: true }),
        props.takeoverTarget,
        jsx.jsx("div", { "data-testid": "work-composer", children: composer }),
      ],
    });
  }
  const service = props.service ?? defaultService;
  return jsx.jsx(WorkHomeCore, {
    renderHomeContent: () =>
      jsx.jsx(WorkHomeContent, {
        account,
        composer,
        conversationsSnapshot: props.conversationsSnapshot,
        displayName: props.displayName,
        homepageTakeover: props.homepageTakeover,
        onOpenLocalConversation: props.onOpenLocalConversation,
        service,
        suggestionsAllowed: props.suggestionsAllowed !== false,
        suggestionsSnapshot: props.suggestionsSnapshot,
        takeoverTarget: props.takeoverTarget,
      }),
  });
}

initializeJsxRuntime();
initializeSuggestionList();
initializeAppConnectModal();
initializeAppConnectFlow();
initializeWorkHomeCore();
React = getReactRuntime();
jsx = getJsxRuntime();

export { LighthouseWorkHomePage };
