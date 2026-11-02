import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

interface BusinessContext {
  businessName?: string | null;
  conversationStarters?: string[];
  disablePrefill?: boolean;
  interactionId?: string;
  logoUrl?: string | null;
  notice?: string | null;
  showConversationStarters?: boolean;
  showDisclosureModal?: boolean;
}
export type ConversationStarterState =
  | { status: "ready"; context: BusinessContext }
  | ({ status: "failed" | "loading" } & BusinessContext);
interface BoundaryProps {
  conversationId: string;
  fallback?: unknown;
  state?: ConversationStarterState | null;
}
interface EmptyStateProps extends BoundaryProps {
  onStarterPromptSelect?(prompt: string): void;
}
interface SharedRuntime {
  BX?<Value>(family: unknown, parameter: unknown): Value;
  I3(): JsxRuntime;
  Y2?: unknown;
  e6(): ReactRuntime;
  [key: string]: unknown;
}
interface InitialRuntime {
  QKt?: unknown;
  rot?: unknown;
  n7?: unknown;
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as InitialRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;

function initializeConversationUi(): void {
  if (initialized) return;
  for (const initialize of [
    shared.$3,
    shared.FX,
    shared.K2,
    initial.iot,
    initial.r7,
    shared.Zh,
    shared.zh,
    shared.Ph,
  ]) {
    if (typeof initialize === "function") (initialize as () => void)();
  }
  React = shared.e6();
  jsx = shared.I3();
  initialized = true;
}

function useBusinessState(
  props: BoundaryProps,
): ConversationStarterState | null {
  initializeConversationUi();
  return props.state !== undefined
    ? props.state
    : (shared.BX?.<ConversationStarterState | null>(
        initial.QKt,
        props.conversationId,
      ) ?? null);
}

function message(
  id: string,
  defaultMessage: string,
  description: string,
  values?: Record<string, unknown>,
): unknown {
  return shared.Y2 == null
    ? defaultMessage
    : jsx.jsx(shared.Y2, { id, defaultMessage, description, values });
}

function businessName(name?: string | null): unknown {
  return name?.trim()
    ? name
    : message(
        "chatgpt.ads.business_agent.disclosure.fallback_name",
        "Business Agent",
        "Fallback title for a Business Agent conversation when no business name is available",
      );
}

function disclosure(context: BusinessContext): unknown {
  const name = context.businessName?.trim();
  const body = name
    ? message(
        "chatgpt.ads.business_agent.disclosure.named.body",
        "Messages you send in this chat may be shared with {businessName}",
        "Business Agent data-sharing disclosure with a supplied business name",
        { businessName: name },
      )
    : message(
        "chatgpt.ads.business_agent.disclosure.unnamed.body",
        "Messages you send in this chat may be shared with the business operating this Business Agent",
        "Business Agent data-sharing disclosure without a supplied business name",
      );
  const content = jsx.jsxs("div", {
    className: "flex flex-col gap-1",
    children: [
      jsx.jsx("strong", { children: businessName(context.businessName) }),
      context.notice?.trim()
        ? jsx.jsx("p", { children: context.notice })
        : null,
      jsx.jsx("p", { children: body }),
    ],
  });
  const Callout = initial.n7;
  return typeof Callout === "function"
    ? jsx.jsx(Callout, { variant: "callout", layout: "vertical", content })
    : jsx.jsx("aside", {
        className: "business-agent-disclosure",
        children: content,
      });
}

function BusinessLogo({
  context,
  size,
}: {
  context: BusinessContext;
  size: "lg" | "sm";
}): unknown {
  const Logo = initial.rot;
  if (typeof Logo === "function")
    return jsx.jsx(Logo, {
      alt: "",
      name: context.businessName ?? null,
      size,
      src: context.logoUrl ?? null,
    });
  return context.logoUrl == null
    ? null
    : jsx.jsx("img", {
        alt: "",
        className: size === "lg" ? "h-12 w-12" : "h-6 w-6",
        src: context.logoUrl,
      });
}

function ConversationContextBanner({
  className,
  conversationId,
  state: supplied,
}: BoundaryProps & { className?: string }): unknown {
  const state = useBusinessState({ conversationId, state: supplied });
  if (state?.status !== "ready") return null;
  return jsx.jsx("div", {
    className: [
      "mx-auto flex w-[min(100%,var(--thread-content-max-width))] min-w-0 flex-col gap-3 px-panel",
      className,
    ]
      .filter(Boolean)
      .join(" "),
    "data-interaction-id": state.context.interactionId,
    children: disclosure(state.context),
  });
}

function BusinessAgentHeading({
  state,
}: {
  state: ConversationStarterState;
}): unknown {
  const context = state.status === "ready" ? state.context : state;
  return jsx.jsxs("div", {
    className: "flex min-w-0 items-center gap-2 select-none",
    children: [
      jsx.jsx(BusinessLogo, { context, size: "sm" }),
      jsx.jsx("span", {
        className: "truncate",
        children: businessName(context.businessName),
      }),
    ],
  });
}

function DisclosureModal({ context }: { context: BusinessContext }): unknown {
  const [open, setOpen] = React.useState(context.showDisclosureModal === true);
  if (!open) return null;
  const close = (event?: { preventDefault?(): void }) => {
    event?.preventDefault?.();
    setOpen(false);
  };
  return jsx.jsx("dialog", {
    open: true,
    className: "business-agent-disclosure-modal",
    children: jsx.jsxs("form", {
      onSubmit: close,
      children: [
        jsx.jsx("h2", { children: businessName(context.businessName) }),
        disclosure(context),
        jsx.jsx("button", {
          type: "submit",
          children: message(
            "chatgptConversations.businessAgent.disclosureContinue",
            "Continue",
            "Dismiss the Business Agent data-sharing disclosure",
          ),
        }),
      ],
    }),
  });
}

function BusinessAgentEmptyState({
  onStarterPromptSelect,
  state,
}: {
  onStarterPromptSelect?(prompt: string): void;
  state: ConversationStarterState;
}): unknown {
  const context = state.status === "ready" ? state.context : state;
  const starters =
    state.status === "ready" && context.showConversationStarters
      ? context.conversationStarters?.slice(0, 4)
      : undefined;
  const status =
    state.status === "ready"
      ? disclosure(state.context)
      : jsx.jsx("div", {
          "aria-live": "polite",
          role: state.status === "failed" ? "alert" : "status",
          children:
            state.status === "failed"
              ? message(
                  "chatgptConversations.businessAgent.unavailable",
                  "This Business Agent is unavailable. Please return to the ad and try again",
                  "Business Agent interaction creation failure",
                )
              : message(
                  "chatgptConversations.businessAgent.loading",
                  "Opening Business Agent…",
                  "Business Agent interaction creation status",
                ),
        });
  return jsx.jsxs("div", {
    className:
      "mx-auto flex w-[min(100%,var(--thread-content-max-width))] min-w-0 flex-col items-center gap-3 px-panel text-center",
    children: [
      jsx.jsx(BusinessLogo, { context, size: "lg" }),
      jsx.jsx("h1", {
        className: "heading-xl font-normal text-default select-none",
        children: businessName(context.businessName),
      }),
      status,
      starters != null &&
      (starters.length > 1 ||
        (starters.length === 1 &&
          state.status === "ready" &&
          state.context.disablePrefill === true))
        ? jsx.jsx("div", {
            className: "mt-3 flex flex-wrap justify-center gap-2 select-none",
            children: starters.map((prompt) =>
              jsx.jsx(
                "button",
                {
                  disabled: onStarterPromptSelect == null,
                  onClick: () => onStarterPromptSelect?.(prompt),
                  type: "button",
                  children: prompt,
                },
                prompt,
              ),
            ),
          })
        : null,
    ],
  });
}

function ConversationStarterBoundary(props: BoundaryProps): unknown {
  const state = useBusinessState(props);
  return state == null ||
    (state.status === "ready" && !state.context.showConversationStarters)
    ? (props.fallback ?? null)
    : jsx.jsx(BusinessAgentHeading, { state });
}

function ConversationEmptyState(props: EmptyStateProps): unknown {
  const state = useBusinessState(props);
  if (state == null) return props.fallback ?? null;
  const content =
    state.status === "ready" && !state.context.showConversationStarters
      ? jsx.jsxs("div", {
          className: "flex w-full min-w-0 flex-col gap-3",
          children: [
            jsx.jsx(ConversationContextBanner, {
              conversationId: props.conversationId,
              state,
            }),
            props.fallback,
          ],
        })
      : jsx.jsx(BusinessAgentEmptyState, {
          state,
          onStarterPromptSelect: props.onStarterPromptSelect,
        });
  return jsx.jsxs(jsx.Fragment, {
    children: [
      content,
      state.status === "ready"
        ? jsx.jsx(
            DisclosureModal,
            { context: state.context },
            state.context.interactionId,
          )
        : null,
    ],
  });
}

initializeConversationUi();
export {
  initializeConversationUi as i,
  ConversationStarterBoundary as n,
  ConversationEmptyState as r,
  ConversationContextBanner as t,
};
