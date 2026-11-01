// ChatGPT Work task suggestions below the Home composer. The release owner
// combines the account-scoped native query, composer activation, background
// task submission, interaction recording, and the Home suggestion surface.

import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as homeStarterPromptsChunk from "@rchunk/home-starter-prompts";
import * as homeSuggestionSurfaceChunk from "@rchunk/home-suggestion-surface";
import type { JsxRuntime, MaitaiScopeApi, ReactRuntime } from "@rchunk/app-shared";

type HomeTaskSuggestionMode = "chat" | "local" | string;
type WorkRunLocation = "cloud" | "local" | null;
type Scope = MaitaiScopeApi<Record<string, unknown>>;

interface PromptDestinationMetadata {
  auto_send?: boolean;
  auto_send_in_background?: boolean;
  entrypoint?: string;
  prompt: string;
  show_prompt_on_hover?: boolean;
  type: "prompt";
}
interface ConnectorDestinationMetadata { type: "connector" }
interface RawHomeTaskSuggestion {
  action_metadata?: { prompt?: string; system_hints?: unknown[] } | null;
  destination_metadata?: PromptDestinationMetadata | ConnectorDestinationMetadata | null;
  emoji?: string | null;
  icon_paths?: Record<string, string | undefined>;
  id: string;
  item_type: string;
  logging_metadata?: { app_id?: string; suggestion_id?: string } | null;
  title: string;
}
interface HomeTaskSuggestion {
  emoji?: string | null;
  iconDarkUrl?: string;
  iconUrl?: string;
  id: string;
  isScheduledAutomation: boolean;
  item: RawHomeTaskSuggestion;
  prompt: string;
  title: string;
}
interface QueryResult<Value> { data?: Value; isLoading?: boolean }
interface ComposerController {
  cancelPendingSubmit?(): void;
  focus(): void;
  hasText(): boolean;
  requestSubmitWhenReady?(ready: () => boolean): void;
  setPromptText(text: string): void;
  view?: { isDestroyed?: boolean };
}
interface HomeTaskSuggestionsProps {
  generatedSuggestionsEnabled?: boolean;
  hostId: string;
  mode: HomeTaskSuggestionMode;
  onSelect?(suggestion: HomeTaskSuggestion): void;
  prepareDestination?(destination: string): void | Promise<void>;
  projectId?: string | null;
  showClinicalHomeSuggestions?: boolean;
  showGenericSuggestions?: boolean;
  workRunLocation?: WorkRunLocation;
}
interface ScopeWithQuery extends Scope {
  queryClient: {
    cancelQueries(input: { queryKey: unknown[] }): Promise<unknown> | void;
    invalidateQueries(input: { queryKey: unknown[] }): Promise<unknown> | void;
    setQueriesData(input: { queryKey: unknown[] }, update: (value: RawHomeTaskSuggestion[] | undefined) => RawHomeTaskSuggestion[] | undefined): void;
  };
}
interface SharedBindings {
  BX<Value>(family: unknown, parameter: unknown, options?: { enabled?: boolean }): QueryResult<Value>;
  HX<Value>(signal: unknown): Value;
  I3: JsxRuntime | (() => JsxRuntime);
  LX(scope: unknown): ScopeWithQuery;
  QX?(scope: unknown, factory: (parameter: { hostId: string; mode: string }, context: { get<Value>(signal: unknown): Value }) => Record<string, unknown>): unknown;
  ZI: unknown;
  e6: ReactRuntime | (() => ReactRuntime);
  n4?(): { formatMessage(descriptor: { defaultMessage: string; id?: string }): string };
  pZ?<Value>(scope: unknown, initialValue: Value): unknown;
  pk?: unknown;
  sZ?<Value>(scope: unknown, derive: (context: { get<T>(signal: unknown): T }) => Value): unknown;
}
interface InitialBindings {
  HZ?(): ComposerController;
  Sln?: unknown;
  b2?(scope: Scope, conversationId: string, hints: string[]): void;
  gln?(conversation: unknown): string;
  gln?(conversation: unknown): string;
  kht?: unknown;
  o_n?(): (destination: string) => void;
  pnt?: {
    ambientSuggestions?: {
      getChatGptComposerItems(input: { entrypoint: string; hostId: string }): Promise<RawHomeTaskSuggestion[]>;
      recordChatGptComposerItemInteraction(input: { entrypoint: string; hostId: string; interactionType: string; item: RawHomeTaskSuggestion }): Promise<unknown>;
    };
  };
  xpn?(scope: Scope, event: unknown, payload: Record<string, unknown>): void;
  v2?: unknown;
}
interface PrimaryBindings {
  Sg?(): { headline?: { message_body?: string } | null };
  eu?(scope: Scope, input: Record<string, unknown>): Promise<unknown>;
}

const shared = appSharedChunk as unknown as SharedBindings;
const initial = appInitialChunk as unknown as InitialBindings;
const primary = appPrimaryChunk as unknown as PrimaryBindings;
const HomeSuggestionSurface = (homeSuggestionSurfaceChunk as unknown as { t?: unknown }).t;
const ClinicalStarterPrompts = (homeStarterPromptsChunk as unknown as { ClinicalStarterPrompts?: unknown }).ClinicalStarterPrompts;

let React: ReactRuntime;
let jsx: JsxRuntime;
let taskSuggestionAccountIdSignal: unknown;
let pendingSuggestionKeysSignal: unknown;
let taskSuggestionQueryFamily: unknown;
let initialized = false;

function normalizeTaskSuggestions(items: readonly RawHomeTaskSuggestion[]): HomeTaskSuggestion[] {
  return items.flatMap((item) => {
    const destination = item.destination_metadata;
    let prompt = destination?.type === "prompt" ? destination.prompt : undefined;
    if (destination?.type === "connector") prompt = item.action_metadata?.prompt;
    if (item.item_type === "chat_home_curated" || item.title.trim() === "" || !prompt?.trim()) return [];
    return [{
      item,
      emoji: item.emoji,
      iconDarkUrl: item.icon_paths?.["64_1x_dark"],
      iconUrl: item.icon_paths?.["64_1x"],
      id: item.logging_metadata?.suggestion_id ?? item.id,
      isScheduledAutomation: item.item_type === "automation_suggestion",
      prompt,
      title: item.title,
    }];
  });
}

function startsInBackground(suggestion: HomeTaskSuggestion): boolean {
  const destination = suggestion.item.destination_metadata;
  return (suggestion.item.item_type === "task_suggestion" || suggestion.item.item_type === "automation_suggestion") &&
    destination?.type === "prompt" && destination.auto_send_in_background === true;
}

function normalizeIconUrl(url: string | undefined): string | undefined {
  return url?.startsWith("/") ? new URL(url, "https://chatgpt.com").href : url;
}

function initializeTaskSuggestionQueries(): void {
  if (taskSuggestionAccountIdSignal != null) return;
  taskSuggestionAccountIdSignal = shared.sZ?.(shared.ZI, ({ get }) => get<{ accountId?: string | null }>(initial.Sln).accountId) ?? { key: "chatgpt-task-suggestions-account-id" };
  pendingSuggestionKeysSignal = shared.pZ?.(shared.ZI, new Set<string>()) ?? { key: "chatgpt-task-suggestions-pending" };
  taskSuggestionQueryFamily = shared.QX?.(shared.ZI, ({ hostId, mode }, { get }) => {
    const accountId = get<string | null>(taskSuggestionAccountIdSignal);
    return {
      enabled: accountId != null,
      queryKey: ["chatgpt-task-suggestions", accountId, hostId, mode],
      queryFn: async () => normalizeTaskSuggestions(await initial.pnt?.ambientSuggestions?.getChatGptComposerItems({ entrypoint: mode, hostId }) ?? []),
      retry: false,
      staleTime: 60_000,
    };
  }) ?? { key: "chatgpt-task-suggestions-query" };
}

function initializeHomeTaskSuggestions(): void {
  if (initialized) return;
  initializeTaskSuggestionQueries();
  React = typeof shared.e6 === "function" ? shared.e6() : shared.e6;
  jsx = typeof shared.I3 === "function" ? shared.I3() : shared.I3;
  (homeSuggestionSurfaceChunk as unknown as { n?(): void }).n?.();
  initialized = true;
}

async function recordInteraction(scope: ScopeWithQuery, hostId: string, mode: string, suggestion: HomeTaskSuggestion, interaction: "dismiss" | "select" | "view"): Promise<void> {
  const accountId = scope.get<string | null>(taskSuggestionAccountIdSignal);
  const queryKey = ["chatgpt-task-suggestions", accountId, hostId, mode];
  const remove = () => {
    void scope.queryClient.cancelQueries({ queryKey });
    scope.queryClient.setQueriesData({ queryKey }, (items) => items?.filter((item) => item.id !== suggestion.item.id));
  };
  if (interaction === "select") remove();
  const bridge = initial.pnt?.ambientSuggestions;
  if (bridge == null) throw new Error("ChatGPT task suggestions are unavailable on this host");
  await bridge.recordChatGptComposerItemInteraction({
    entrypoint: mode,
    hostId,
    interactionType: { dismiss: "dismissed", select: "clicked", view: "viewed" }[interaction],
    item: suggestion.item,
  });
  if (interaction === "dismiss") remove();
  if (interaction !== "view") void scope.queryClient.invalidateQueries({ queryKey });
}

function HomeTaskSuggestions(props: HomeTaskSuggestionsProps): unknown {
  initializeHomeTaskSuggestions();
  const scope = shared.LX(initial.kht ?? shared.ZI);
  const composer = initial.HZ?.();
  const accountId = shared.HX<string | null>(taskSuggestionAccountIdSignal);
  const pending = shared.HX<Set<string>>(pendingSuggestionKeysSignal) ?? new Set<string>();
  const generatedEnabled = props.generatedSuggestionsEnabled !== false && props.showGenericSuggestions !== false;
  const query = shared.BX<HomeTaskSuggestion[]>(taskSuggestionQueryFamily, { hostId: props.hostId, mode: props.mode }, {
    enabled: generatedEnabled && accountId != null && composer?.hasText() === false,
  });
  const suggestions = query.data?.slice(0, 3);
  const viewed = React.useRef(new Set<string>());
  React.useEffect(() => {
    for (const suggestion of suggestions ?? []) {
      const key = `${accountId}:${props.hostId}:${props.mode}:${suggestion.item.id}`;
      if (viewed.current.has(key)) continue;
      viewed.current.add(key);
      void recordInteraction(scope, props.hostId, props.mode, suggestion, "view").catch(() => undefined);
    }
  }, [accountId, props.hostId, props.mode, scope, suggestions]);

  const headline = primary.Sg?.().headline?.message_body;
  const showClinical = props.showClinicalHomeSuggestions === true && ClinicalStarterPrompts != null;
  if (composer == null || composer.hasText() || (suggestions?.length ?? 0) === 0 && headline == null && !showClinical) return null;

  const activate = async (suggestion: HomeTaskSuggestion, index: number) => {
    const pendingKey = `${accountId}:${props.hostId}:${suggestion.item.id}`;
    if (pending.has(pendingKey) || composer.hasText()) return;
    const background = startsInBackground(suggestion);
    const toast = scope.get<{ success?(message: string, options?: unknown): void; warning?(message: string): void } | undefined>(shared.pk);
    if (background && props.workRunLocation !== "cloud") {
      toast?.warning?.("Background suggestions are only available in Cloud");
      return;
    }
    scope.set(pendingSuggestionKeysSignal, new Set([...pending, pendingKey]));
    try {
      if (background && primary.eu != null) {
        const created = await primary.eu(scope, {
          hostId: props.hostId,
          projectId: props.projectId,
          prompt: suggestion.prompt,
          suggestedAutomationType: suggestion.isScheduledAutomation ? suggestion.id : undefined,
          threadSource: "ambient_suggestion_task",
          turnTrigger: "ambient_suggestion_task",
        });
        if (created == null) throw new Error("Background suggestion did not start");
        const conversationId = (created as { conversationId?: string }).conversationId;
        toast?.success?.("Task started", conversationId == null ? undefined : {
          primaryAction: {
            label: "Open chat",
            onClick: () => initial.o_n?.()(initial.gln?.({ id: conversationId }) ?? `/c/${conversationId}`),
          },
        });
      } else {
        const destination = suggestion.item.destination_metadata?.type === "prompt"
          ? suggestion.item.destination_metadata.entrypoint ?? props.mode
          : props.mode;
        await props.prepareDestination?.(destination);
        composer.cancelPendingSubmit?.();
        composer.setPromptText(suggestion.prompt);
        const systemHint = suggestion.item.action_metadata?.system_hints?.find((value): value is string => typeof value === "string" && value.length > 0);
        const conversationId = initial.v2 == null ? null : scope.get<string | null>(initial.v2);
        if (systemHint != null && conversationId != null) initial.b2?.(scope, conversationId, [systemHint]);
        composer.focus();
        if (suggestion.item.destination_metadata?.type === "prompt" && suggestion.item.destination_metadata.auto_send === true) {
          composer.requestSubmitWhenReady?.(() => accountId === scope.get(taskSuggestionAccountIdSignal));
        }
      }
      await recordInteraction(scope, props.hostId, props.mode, suggestion, "select");
      initial.xpn?.(scope, "chatgpt_task_suggestion_selected", {
        action: background ? "start-thread" : "fill-composer",
        promptId: suggestion.id,
        promptIndex: index,
        surface: "chatgpt_work",
      });
      props.onSelect?.(suggestion);
    } catch {
      toast?.warning?.("Couldn't start suggestion. Please try again");
    } finally {
      scope.set(pendingSuggestionKeysSignal, (current: Set<string>) => {
        const next = new Set(current);
        next.delete(pendingKey);
        return next;
      });
    }
  };

  const items = suggestions?.map((suggestion, index) => {
    const destination = suggestion.item.destination_metadata;
    const emoji = suggestion.emoji?.trim();
    return {
      id: suggestion.id,
      label: suggestion.title,
      disabled: pending.has(`${accountId}:${props.hostId}:${suggestion.item.id}`),
      icon: emoji || normalizeIconUrl(suggestion.iconUrl) || null,
      logoUrl: normalizeIconUrl(suggestion.iconUrl),
      logoDarkUrl: normalizeIconUrl(suggestion.iconDarkUrl),
      tooltipContent: destination?.type === "prompt" && destination.show_prompt_on_hover === true ? suggestion.prompt : undefined,
      onClick: () => void activate(suggestion, index),
      onDismiss: () => void recordInteraction(scope, props.hostId, props.mode, suggestion, "dismiss").catch(() => undefined),
    };
  }) ?? [];
  const surface = HomeSuggestionSurface == null
    ? jsx.jsx("div", { "data-home-task-suggestions": true, children: items.map((item) => jsx.jsx("button", { disabled: item.disabled, onClick: item.onClick, children: item.label }, item.id)) })
    : jsx.jsx(HomeSuggestionSurface, {
        composerMode: props.mode,
        headline,
        items,
        layout: "list",
        showCloseAction: false,
      });
  return showClinical
    ? jsx.jsxs(jsx.Fragment, { children: [surface, jsx.jsx(ClinicalStarterPrompts, {})] })
    : surface;
}

initializeHomeTaskSuggestions();

export {
  taskSuggestionAccountIdSignal as i,
  initializeHomeTaskSuggestions as n,
  initializeTaskSuggestionQueries as r,
  HomeTaskSuggestions as t,
};
