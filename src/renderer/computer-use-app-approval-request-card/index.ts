// Native Computer Use app approval card. Release chunk: computer-use-app-approval-request-card-63cdc4e7642f.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
  jsxs(type: unknown, props: Record<string, unknown>): unknown;
  Fragment: unknown;
}
interface ReactRuntime {
  useRef<T>(initial: T): { current: T };
  useState<T>(initial: T): [T, (value: T) => void];
}
interface IntlRuntime {
  formatMessage(message: Record<string, unknown>): string;
}
interface Store {
  set(key: unknown, value: unknown): void;
}
interface ApprovalRequest {
  appDisplayName: string;
  connectorName: string;
  persistModes: string[];
  riskLevel?: string;
  subtitle?: string;
}
interface ApprovalActions {
  approveLabel: unknown;
  isLoading: boolean;
  leadingAction?: { label: unknown; onClick(): void };
  onApprove(): void;
  onDeny(): void;
}
interface ApprovalCardProps {
  actions: ApprovalActions;
  headerContent: unknown;
  subtitle?: unknown;
  title: unknown;
}
interface Props {
  ApprovalCard(props: ApprovalCardProps): unknown;
  conversationId: string;
  hostId: string;
  onRequestSettled(result: "accept" | "decline"): void;
  request: ApprovalRequest;
  requestId: string;
}
interface SharedRuntime {
  I3(): JsxRuntime;
  e6(): ReactRuntime;
  LX(scope: unknown): Store;
  HX<T>(signal: unknown): T | undefined;
  n4(): IntlRuntime;
  ZI: unknown;
  S_: unknown;
  Zw: unknown;
  Y2: unknown;
  [key: string]: unknown;
}
interface InitialRuntime {
  Ugn(
    store: Store,
    hostId: string,
  ): {
    replyWithMcpServerElicitationResponse(
      conversationId: string,
      requestId: string,
      response: unknown,
    ): Promise<unknown>;
  };
  Whn(
    decision: "accept" | "decline",
    metadata: { persist: string } | null,
  ): unknown;
  cen: unknown;
  ngn(key: string, fallback: boolean): boolean;
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as InitialRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
let computerUsePluginIcon: string;
let iconInitialized = false;
let moduleInitialized = false;

function callInitializers(
  runtime: Record<string, unknown>,
  names: string[],
): void {
  for (const name of names) {
    const initializer = runtime[name];
    if (typeof initializer === "function") (initializer as () => void)();
  }
}

function initializeComputerUsePluginIcon(): void {
  if (iconInitialized) return;
  iconInitialized = true;
  computerUsePluginIcon = new URL(
    "computer-use-plugin-icon-5eae5ff78888.png",
    import.meta.url,
  ).href;
}

function initializeComputerUseAppApprovalRequestCard(): void {
  if (moduleInitialized) return;
  moduleInitialized = true;
  callInitializers(shared as unknown as Record<string, unknown>, [
    "$3",
    "e6",
    "FX",
    "K2",
    "C_",
    "QI",
  ]);
  callInitializers(initial as unknown as Record<string, unknown>, [
    "wfn",
    "Wgn",
    "rgn",
    "len",
  ]);
  initializeComputerUsePluginIcon();
  React = shared.e6();
  jsx = shared.I3();
}

function ComputerUseAppApprovalRequestCard({
  ApprovalCard,
  conversationId,
  hostId,
  onRequestSettled,
  request,
  requestId,
}: Props): unknown {
  initializeComputerUseAppApprovalRequestCard();
  const store = shared.LX(shared.ZI);
  const intl = shared.n4();
  const hasApproved =
    shared.HX<boolean>(initial.cen) ??
    initial.ngn("has-approved-computer-use-app", false);
  const requestKey = JSON.stringify([hostId, conversationId, requestId]);
  const activeRequest = React.useRef<string | null>(null);
  const [loadingKey, setLoadingKey] = React.useState<string | null>(null);
  const elevatedRisk = request.riskLevel === "high";
  const subtitle =
    [
      hasApproved === false
        ? intl.formatMessage({
            id: "composer.computerUseAppApproval.disclosure",
            defaultMessage:
              "Computer Use lets ChatGPT use apps on your computer. It may take screenshots of app contents while working. You can choose which apps ChatGPT can access, stop actions at any time, and control whether screenshots are used for training.",
            description:
              "First-use disclosure explaining native Computer Use app access, screenshot capture, and user controls, shown until the user approves an app",
          })
        : undefined,
      request.subtitle,
    ]
      .filter(Boolean)
      .join("\n\n") || undefined;

  const settle = (decision: "accept" | "decline", persist?: string | null) => {
    if (activeRequest.current === requestKey) return;
    activeRequest.current = requestKey;
    setLoadingKey(requestKey);
    if (decision === "accept") store.set(initial.cen, true);
    initial
      .Ugn(store, hostId)
      .replyWithMcpServerElicitationResponse(
        conversationId,
        requestId,
        initial.Whn(
          decision,
          decision === "accept" && persist != null ? { persist } : null,
        ),
      )
      .then(
        () => onRequestSettled(decision),
        () => {
          if (activeRequest.current === requestKey) {
            activeRequest.current = null;
            setLoadingKey(null);
          }
        },
      );
  };

  const headerContent = elevatedRisk
    ? jsx.jsxs(jsx.Fragment, {
        children: [
          jsx.jsx(shared.S_, {
            className: "shrink-0 text-warning",
            "aria-hidden": false,
            asset: shared.Zw,
          }),
          jsx.jsx("span", {
            className: "font-medium text-warning",
            children: jsx.jsx(shared.Y2, {
              id: "composer.mcpToolCallApproval.elevatedRiskLabel",
              defaultMessage: "Elevated Risk",
              description:
                "Header label for elevated-risk MCP approval requests",
            }),
          }),
        ],
      })
    : jsx.jsxs(jsx.Fragment, {
        children: [
          jsx.jsx("img", {
            alt: "",
            className: "icon-sm rounded-[3px] object-contain",
            draggable: false,
            src: computerUsePluginIcon,
          }),
          jsx.jsx("span", { children: request.connectorName }),
        ],
      });
  const title = jsx.jsx(shared.Y2, {
    id: "composer.computerUseAppApproval.title.chatgpt",
    defaultMessage: "Allow ChatGPT to use {appDisplayName}?",
    description:
      "Title asking whether ChatGPT may use an app through Computer Use",
    values: { appDisplayName: request.appDisplayName },
  });
  const leadingAction = request.persistModes.includes("always")
    ? {
        label: jsx.jsx(shared.Y2, {
          id: "composer.computerUseAppApproval.action.alwaysApprove",
          defaultMessage: "Always allow",
          description:
            "Button label for always approving Computer Use access to an app",
        }),
        onClick: () => settle("accept", "always"),
      }
    : undefined;
  return jsx.jsx(ApprovalCard, {
    headerContent,
    title,
    subtitle:
      subtitle == null
        ? undefined
        : jsx.jsx("span", {
            className: "whitespace-pre-line",
            children: subtitle,
          }),
    actions: {
      isLoading: loadingKey === requestKey,
      leadingAction,
      approveLabel: jsx.jsx(shared.Y2, {
        id: "composer.computerUseAppApproval.action.approve",
        defaultMessage: "Allow this conversation",
        description:
          "Primary action label for approving Computer Use access to an app",
      }),
      onApprove: () =>
        settle(
          "accept",
          request.persistModes.includes("session") ? "session" : null,
        ),
      onDeny: () => settle("decline"),
    },
  });
}

export {
  initializeComputerUsePluginIcon as i,
  initializeComputerUseAppApprovalRequestCard as n,
  computerUsePluginIcon as r,
  ComputerUseAppApprovalRequestCard as t,
};
