// Interactive poll widget renderer and action controller. Release chunk: renderer-60f4bb7aa0fd.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as pollWidgetChunk from "@rchunk/index-ymUnTRBB";
import * as pollRuntimeChunk from "@rchunk/dist-e0bb3d63cc62";
import * as appInitialChunk from "@rchunk/app-initial";
import * as persistenceChunk from "@rchunk/view-state-persistence";

interface PollState extends Record<string, unknown> {
  lifecycle?: string;
  is_creator?: boolean;
  is_unfurl_preview?: boolean;
  action_pending?: boolean;
  role_loading?: boolean;
  can_vote?: boolean;
  question?: unknown;
}
interface PollStore {
  getState(): PollState;
  setState(state: PollState): void;
  subscribe(listener: (state: PollState) => void): () => void;
}
interface PollAction {
  type: string;
  payload?: unknown;
}
interface Persistence {
  markInteraction(): void;
  setItem(key: unknown, value: string): void;
  flush(force?: boolean): Promise<void>;
  hydrate(input: Record<string, unknown>): void;
  getSnapshot(): string | null;
  dispose(): void;
}
interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>): unknown;
}
interface ReactRuntime {
  useState<Value>(factory: () => Value): [Value];
  useLayoutEffect(effect: () => void, dependencies: unknown[]): void;
  useEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  useEffectEvent(callback: () => void): () => void;
}
interface Scope {
  value: { pathname: string };
  get(signal: unknown): {
    danger(message: string, options: Record<string, unknown>): void;
  };
  query: {
    cancel(key: unknown, input: unknown): Promise<void>;
    invalidate(key: unknown, input: unknown): Promise<void>;
  };
}
interface SharedRuntime {
  $3(): unknown;
  BX(signal: unknown, parameter: string): string | null;
  FX(): void;
  G4(...schemas: unknown[]): { parse(value: unknown): PollState };
  I3(): JsxRuntime;
  I4(): unknown;
  K2(): void;
  LX(context: unknown): Scope;
  Q3: { warning(message: string, detail: unknown): void };
  Y2: unknown;
  Yh: unknown;
  Z3(): void;
  Zh(): void;
  e6(): ReactRuntime;
  g4(): void;
  lk(): void;
  n4(): { formatMessage(descriptor: Record<string, string>): string };
  pk: unknown;
  q4(): unknown;
}
interface InitialRuntime {
  $en: unknown;
  $gn(
    pattern: string,
    pathname: string,
  ): { params: { postId?: string } } | null;
  B0(): void;
  F0: Record<string, string>;
  Gkt(
    scope: Scope,
    conversationId: string,
    flush: (force?: boolean) => Promise<void>,
  ): (() => void) | undefined;
  I0: Record<string, string>;
  Kun(): void;
  L0: unknown;
  M6t(): void;
  N0: Record<string, string>;
  N6t(): {
    isLoading: boolean;
    userId?: string;
    accountId?: string;
    authMethod?: string;
  };
  P0: Record<string, string>;
  Qgn(): void;
  Run(): void;
  Uzt(scope: Scope, signal: unknown, input: Record<string, unknown>): void;
  Vzt(): void;
  Wkt(): void;
  _R(): void;
  aL(): void;
  cJt(): void;
  hH(): void;
  iL: unknown;
  itn(): void;
  mH: unknown;
  rJt: {
    safePost(
      path: string,
      options: Record<string, unknown>,
    ): Promise<{ status: string; status_message?: string; data?: PollState }>;
  };
  uHt(): void;
  wVt: unknown;
  xR: unknown;
  xpn(...args: unknown[]): void;
  ypn(): void;
  z0: Record<string, string>;
}
interface PersistenceRuntime {
  d: unknown;
  n(): void;
  r(): void;
  t(input: {
    messageId: string;
    widgetRefId: string;
    initial: Record<string, unknown>;
    onError(error: unknown): void;
  }): Persistence;
}
interface WidgetRuntime {
  r: unknown;
}
interface DistRuntime {
  t(): void;
}

const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as InitialRuntime;
const persistenceRuntime = persistenceChunk as unknown as PersistenceRuntime;
const widgetRuntime = pollWidgetChunk as unknown as WidgetRuntime;
const distRuntime = pollRuntimeChunk as unknown as DistRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
let stateSchema: { parse(value: unknown): PollState };
const actionTypes = new Set([
  "interactive_poll_initialize",
  "interactive_poll_publish",
  "interactive_poll_vote",
  "interactive_poll_refresh",
]);

function createPollController(input: {
  conversationId: string | null;
  messageId: string;
  widgetRefId: string;
  sharedPostId: string | null;
  initialState: PollState;
  sync: unknown;
  onShare(state: PollState): void;
  onError(error: unknown): void;
  beforeVote(): Promise<void>;
  afterVote(): Promise<void>;
}) {
  let store: PollStore | undefined;
  let unsubscribe: (() => void) | undefined;
  let state = input.initialState;
  let applying = false;
  let acting = false;
  let hydrationKey = JSON.stringify({
    state: input.initialState,
    sync: input.sync,
  });
  let abortController = new AbortController();
  const persistence = persistenceRuntime.t({
    messageId: input.messageId,
    widgetRefId: input.widgetRefId,
    initial: persisted(input.initialState, input.sync),
    onError: input.onError,
  });
  function persisted(root: PollState, sync: unknown) {
    return {
      conversationId: input.conversationId,
      root,
      sync,
      readOnly:
        input.sharedPostId != null ||
        root.lifecycle !== "draft" ||
        root.is_creator !== true,
    };
  }
  function update(next: PollState) {
    applying = true;
    store?.setState(next);
    applying = false;
    state = store?.getState() ?? next;
  }
  function connect(nextStore: PollStore) {
    unsubscribe?.();
    store = nextStore;
    if (abortController.signal.aborted) abortController = new AbortController();
    update(state);
    unsubscribe = store.subscribe((next) => {
      if (!applying && !acting && next.action_pending !== true) {
        state = next;
        if (next.lifecycle === "draft" && next.is_creator === true) {
          persistence.markInteraction();
          persistence.setItem(persistenceRuntime.d, JSON.stringify(next));
        }
      }
    });
  }
  return {
    connect,
    activate() {
      if (store && abortController.signal.aborted) connect(store);
    },
    flush: persistence.flush,
    hydrate(nextState: PollState, sync: unknown) {
      if (acting) return;
      const key = JSON.stringify({ state: nextState, sync });
      if (
        key === hydrationKey ||
        (state.lifecycle === "published" && nextState.lifecycle === "draft")
      )
        return;
      hydrationKey = key;
      persistence.hydrate(persisted(nextState, sync));
      const snapshot = persistence.getSnapshot();
      update(
        snapshot == null ? nextState : stateSchema.parse(JSON.parse(snapshot)),
      );
    },
    async onAction(action: PollAction) {
      if (
        abortController.signal.aborted ||
        !store ||
        acting ||
        state.is_unfurl_preview === true
      )
        return;
      if (action.type === "share") {
        input.onShare(state);
        return;
      }
      if (!actionTypes.has(action.type)) return;
      const signal = abortController.signal;
      const previous = state;
      acting = true;
      store.setState({ action_pending: true });
      try {
        if (
          input.sharedPostId != null &&
          action.type !== "interactive_poll_vote"
        )
          throw new Error("Only voting is available on shared polls");
        await persistence.flush();
        if (action.type === "interactive_poll_vote") await input.beforeVote();
        signal.throwIfAborted();
        const payload = stateSchema.parse(action.payload ?? {});
        const response =
          input.sharedPostId == null
            ? await initial.rJt.safePost("/widget_server_action", {
                signal,
                requestBody: {
                  action_type: action.type,
                  payload,
                  conversation_id: input.conversationId,
                  message_id: input.messageId,
                  ref_id: input.widgetRefId,
                },
              })
            : await initial.rJt.safePost("/widget_server_action/public", {
                signal,
                requestBody: {
                  action_type: action.type,
                  payload,
                  ref_id: input.widgetRefId,
                  public_action_context: {
                    surface_type: "shared_post",
                    surface_id: input.sharedPostId,
                  },
                },
              });
        signal.throwIfAborted();
        if (response.status !== "success")
          throw new Error(response.status_message ?? "Poll action failed");
        const data = response.data;
        update({
          ...(previous.lifecycle === "draft" &&
          data?.lifecycle !== "published" &&
          action.type !== "interactive_poll_publish"
            ? {
                is_creator: data?.is_creator ?? previous.is_creator,
                role_loading: false,
              }
            : data),
          action_pending: false,
        });
        persistence.hydrate(persisted(state, undefined));
      } catch (error) {
        if (!signal.aborted) {
          update({ ...previous, action_pending: false, role_loading: false });
          input.onError(error);
        }
      } finally {
        acting = false;
        if (!signal.aborted && action.type === "interactive_poll_vote")
          await input.afterVote();
      }
    },
    dispose() {
      abortController.abort();
      unsubscribe?.();
      persistence.dispose();
    },
  };
}

interface Props {
  widget: unknown;
  state: PollState;
  widgetRefId: string;
  messageId: string;
  turn: {
    conversationId: string;
    isStreaming?: boolean;
    dilViewState?: { widgetSync?: Record<string, unknown> };
  };
  theme?: unknown;
  customCss?: string;
}
function InteractivePoll(props: Props): unknown {
  const scope = shared.LX(initial.$en);
  const session = initial.N6t();
  const serverId = shared.BX(initial.wVt, props.turn.conversationId);
  const sharedPostId =
    initial.$gn("/s/:postId", scope.value.pathname)?.params.postId ?? null;
  if (session.isLoading || (serverId == null && sharedPostId == null))
    return jsx.jsx(initial.mH, { state: props.state });
  const sync = props.turn.dilViewState?.widgetSync?.[props.widgetRefId];
  const onError = (error: unknown) => {
    shared.Q3.warning("Interactive poll action failed", {
      safe: {},
      sensitive: { error },
    });
    scope.get(shared.pk).danger(
      shared.n4().formatMessage({
        id: "chatgptConversations.interactivePoll.actionFailed",
        defaultMessage: "Your poll change couldn’t be saved. Please try again",
        description:
          "Error after publishing, saving, or voting on an interactive poll fails",
      }),
      {
        errorAnalytics: {
          toastId: "chatgptConversations.interactivePoll.actionFailed",
        },
      },
    );
  };
  const [controller] = React.useState(() =>
    createPollController({
      conversationId: serverId,
      messageId: props.messageId,
      widgetRefId: props.widgetRefId,
      sharedPostId,
      initialState: props.state,
      sync,
      onError,
      onShare: () => undefined,
      beforeVote: async () => {
        if (sharedPostId != null) await scope.query.cancel(initial.xR, session);
      },
      afterVote: async () => {
        if (sharedPostId != null)
          await scope.query.invalidate(initial.xR, session);
      },
    }),
  );
  React.useLayoutEffect(
    () => controller.hydrate(props.state, sync),
    [controller, props.state, sync],
  );
  const flushOnPageHide = React.useEffectEvent(() => {
    void controller.flush(true).catch(onError);
  });
  React.useEffect(() => {
    controller.activate();
    window.addEventListener("pagehide", flushOnPageHide);
    return () => {
      window.removeEventListener("pagehide", flushOnPageHide);
      controller.dispose();
    };
  }, [controller, flushOnPageHide]);
  const widget = jsx.jsx(widgetRuntime.r, {
    theme: props.theme,
    customCss: props.customCss,
    initialState: props.state,
    streaming: props.turn.isStreaming,
    widget: props.widget,
    onLoad: controller.connect,
    onAction: controller.onAction,
    onError,
  });
  const login =
    sharedPostId != null &&
    session.authMethod !== "chatgpt" &&
    props.state.can_vote !== true
      ? jsx.jsx(shared.Yh, {
          onClick: initial.Kun,
          children: jsx.jsx(shared.Y2, {
            id: "chatgptConversations.interactivePoll.login",
            defaultMessage: "Log in to vote",
            description:
              "Button to log in before voting in a shared poll when anonymous voting is unavailable",
          }),
        })
      : null;
  return jsx.jsxs("div", {
    className: "my-3 flex w-full flex-col gap-3",
    "data-testid": "interactive-poll",
    children: [widget, login],
  });
}

function initialize(): void {
  shared.$3();
  initial.B0();
  distRuntime.t();
  shared.FX();
  React = shared.e6();
  shared.K2();
  initial.Qgn();
  initial.Run();
  initial.M6t();
  shared.Zh();
  initial.Vzt();
  shared.lk();
  initial.ypn();
  initial.itn();
  shared.Z3();
  initial.aL();
  initial.uHt();
  initial.Wkt();
  initial._R();
  persistenceRuntime.r();
  shared.g4();
  initial.cJt();
  persistenceRuntime.n();
  stateSchema = shared.G4(shared.q4(), shared.I4());
  initial.hH();
  jsx = shared.I3();
}
initialize();

export { InteractivePoll };
