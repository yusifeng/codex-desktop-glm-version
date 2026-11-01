// home-ambient-suggestions-content —— 首页环境建议的查询、编排与启动边界。
//
// 原版：app/webview/assets/home-ambient-suggestions-content-a1c4fe488b63.js
//（113KB / 2,894 行）。
//
// 唯一导出：HomeAmbientSuggestionsContent（原 `Zi`）。原 chunk 聚合：
//   - generated / curated / default / starter-prompt 四类建议源；
//   - Create / Research / Automate 三层 drill-in taxonomy；
//   - mail provider、已安装插件、app mentions 与可用工具能力；
//   - fill-composer / connect-plugin-onboarding / start-thread 三种动作；
//   - suggestion impression、accept、refresh、dismiss 与错误 toast。

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import "@rchunk/onboarding-mail-provider";
import "@rchunk/ambient-suggestion-apps";
import * as suggestionStateChunk from "@rchunk/new-chat-suggestion-source-debug-state";
import "@rchunk/color-icon";
import * as homeSuggestionSurfaceChunk from "@rchunk/home-suggestion-surface";
import "@rchunk/book-open";
import "@rchunk/new-chat-page-suggestions-eligibility";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

export type AmbientSuggestionSurface = "chatgpt_work" | "codex";
export type AmbientSuggestionSource = "curated" | "default" | "generated";
export type AmbientSuggestionLayout = "cards" | "list";

export interface FillComposerAction {
  type: "fill-composer";
}

export interface ConnectPluginAction {
  type: "connect-plugin-onboarding";
  pluginId: string;
}

export interface StartThreadAction {
  type: "start-thread";
  initialTitle?: string;
  skillNameToMention?: string;
  elicitationPluginIds?: string[];
}

export type AmbientSuggestionAction = FillComposerAction | ConnectPluginAction | StartThreadAction;

export interface AmbientSuggestionItem {
  id: string;
  title: string;
  prompt: string;
  source: AmbientSuggestionSource;
  analyticsType?: string;
  appIds?: string[];
  homeAction: AmbientSuggestionAction;
  showArtifactTemplates?: boolean;
}

export interface AmbientSuggestionCategory {
  id: string;
  title: string;
  starterPrompt: string;
  tasks: AmbientSuggestionItem[];
}

export interface AmbientSuggestionRuntimeState {
  activeSuggestionId?: string | null;
  curatedCategories?: AmbientSuggestionCategory[];
  generatedSuggestions?: AmbientSuggestionItem[];
  starterPrompt?: AmbientSuggestionItem | null;
  headline?: string | null;
  hidden?: boolean;
  isAgentModePending?: boolean;
  isLoading?: boolean;
  mailProvider?: string | null;
  selectedModel?: string | null;
  selectedModelDisplayName?: string | null;
  source?: "curated" | "generated" | null;
}

export interface HomeAmbientSuggestionsContentProps {
  generatedSuggestionsEnabled: boolean;
  hostId: string;
  onLocalConversationCreated(conversationId: string): void | Promise<void>;
  plan?: string | null;
  projectRoot?: string | null;
  routeEntryKey?: string | null;
  topLevelLayout?: AmbientSuggestionLayout;
  /** 语义重写层显式输入；真实组件从 query/store/feature flags 组合得到。 */
  runtimeState?: AmbientSuggestionRuntimeState;
}

export interface AmbientSuggestionExecutionPlan {
  action: AmbientSuggestionAction["type"];
  hostId: string;
  projectRoot: string | null;
  prompt: string;
  markAccepted: boolean;
  installPluginId?: string;
  threadSource?: "ambient_suggestion_task";
  turnTrigger?: "ambient_suggestion_task";
}

export interface AmbientSuggestionViewItem extends AmbientSuggestionItem {
  disabled: boolean;
  execution: AmbientSuggestionExecutionPlan;
}

export interface HomeAmbientSuggestionsView {
  kind: "home-ambient-suggestions";
  surface: AmbientSuggestionSurface;
  domain: string;
  headline: string | null;
  layout: AmbientSuggestionLayout;
  loading: boolean;
  refreshable: boolean;
  activeSuggestionId: string | null;
  categories: AmbientSuggestionCategory[];
  suggestions: AmbientSuggestionViewItem[];
  prioritizedSupplementalItemIds: string[];
}

interface Scope {
  get<Value>(signal: unknown, parameter?: unknown): Value;
  set(signal: unknown, parameter: unknown, value?: unknown): void;
}
interface SharedBindings {
  BX<Value>(signal: unknown, parameter: unknown, options?: { enabled?: boolean }): Value;
  HX<Value>(signal: unknown): Value;
  I3: JsxRuntime | (() => JsxRuntime);
  LX(scope: unknown): Scope;
  ZI: unknown;
  e6: ReactRuntime | (() => ReactRuntime);
  pk?: unknown;
}
interface ComposerController {
  focus(): void;
  hasText(): boolean;
  setPromptText(text: string): void;
}
interface InitialBindings {
  HZ?(): ComposerController;
  Sln?: unknown;
  kht?: unknown;
  xpn?(scope: Scope, event: unknown, payload: Record<string, unknown>): void;
}
interface PrimaryBindings {
  Sg?(): { headline?: { message_body?: string } | null };
  eu?(scope: Scope, input: Record<string, unknown>): Promise<{ conversationId?: string } | null>;
}
interface SuggestionStateBindings {
  a?: unknown;
  c?(): void;
  d?(scope: Scope, params: Record<string, unknown>, suggestionId: string, status: string): void;
  f?(scope: Scope, params: Record<string, unknown>, suggestionId: string, status: string): void;
  p?: unknown;
  t?(): void;
}

const shared = appSharedChunk as unknown as SharedBindings;
const initial = appInitialChunk as unknown as InitialBindings;
const primary = appPrimaryChunk as unknown as PrimaryBindings;
const suggestionState = suggestionStateChunk as unknown as SuggestionStateBindings;
const HomeSuggestionSurface = (homeSuggestionSurfaceChunk as unknown as { t?: unknown }).t;
let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;

const DEFAULT_CATEGORIES: readonly AmbientSuggestionCategory[] = [
  {
    id: "create",
    title: "Create a file or build a site",
    starterPrompt: "Create a ",
    tasks: [
      {
        id: "new-chat-page-create-document",
        title: "Create a new document",
        prompt: "Create a new document ",
        source: "default",
        homeAction: { type: "fill-composer" },
        showArtifactTemplates: true,
      },
      {
        id: "new-chat-page-create-spreadsheet",
        title: "Create a new spreadsheet",
        prompt: "Create a new spreadsheet ",
        source: "default",
        homeAction: { type: "fill-composer" },
        showArtifactTemplates: true,
      },
      {
        id: "new-chat-page-create-presentation",
        title: "Create a new presentation",
        prompt: "Create a new presentation ",
        source: "default",
        homeAction: { type: "fill-composer" },
        showArtifactTemplates: true,
      },
      {
        id: "new-chat-page-create-site",
        title: "Create a new website",
        prompt: "Create a new website ",
        source: "default",
        homeAction: { type: "fill-composer" },
      },
    ],
  },
  {
    id: "research",
    title: "Research and plan next steps",
    starterPrompt: "Figure out next steps ",
    tasks: [
      {
        id: "new-chat-page-research-topic",
        title: "Figure out next steps for a topic I’m exploring",
        prompt: "Figure out next steps for a topic I’m exploring ",
        source: "default",
        homeAction: { type: "fill-composer" },
      },
      {
        id: "new-chat-page-research-options-and-tradeoffs",
        title: "Figure out next steps after comparing options",
        prompt: "Figure out next steps after comparing options ",
        source: "default",
        homeAction: { type: "fill-composer" },
      },
      {
        id: "new-chat-page-plan-upcoming-meeting",
        title: "Figure out next steps for an upcoming meeting",
        prompt: "Figure out next steps for an upcoming meeting ",
        source: "default",
        homeAction: { type: "fill-composer" },
      },
      {
        id: "new-chat-page-plan-strategy-or-roadmap",
        title: "Figure out next steps for a strategy or project",
        prompt: "Figure out next steps for a strategy or project ",
        source: "default",
        homeAction: { type: "fill-composer" },
      },
    ],
  },
  {
    id: "automate",
    title: "Automate routine and recurring work",
    starterPrompt: "Automate ",
    tasks: [
      {
        id: "new-chat-page-automate-recurring-report",
        title: "Automate a recurring report",
        prompt: "Automate a recurring report ",
        source: "default",
        homeAction: { type: "fill-composer" },
      },
      {
        id: "new-chat-page-automate-morning-prep",
        title: "Automate my morning prep",
        prompt: "Automate my morning prep ",
        source: "default",
        homeAction: { type: "fill-composer" },
      },
    ],
  },
] as const;

function deriveDomain(model: string | null | undefined, displayName: string | null | undefined): string {
  return displayName == null || displayName.length === 0 ? (model ?? "default") : `${model ?? "default"}:${displayName}`;
}

function createExecutionPlan(
  suggestion: AmbientSuggestionItem,
  hostId: string,
  projectRoot: string | null,
): AmbientSuggestionExecutionPlan {
  switch (suggestion.homeAction.type) {
    case "fill-composer":
      return { action: "fill-composer", hostId, projectRoot, prompt: suggestion.prompt, markAccepted: true };
    case "connect-plugin-onboarding":
      return {
        action: "connect-plugin-onboarding",
        hostId,
        projectRoot,
        prompt: suggestion.prompt,
        markAccepted: suggestion.source === "generated",
        installPluginId: suggestion.homeAction.pluginId,
      };
    case "start-thread":
      return {
        action: "start-thread",
        hostId,
        projectRoot,
        prompt: suggestion.prompt,
        markAccepted: true,
        threadSource: "ambient_suggestion_task",
        turnTrigger: "ambient_suggestion_task",
      };
  }
}

function initializeAmbientSuggestions(): void {
  if (initialized) return;
  React = typeof shared.e6 === "function" ? shared.e6() : shared.e6;
  jsx = typeof shared.I3 === "function" ? shared.I3() : shared.I3;
  suggestionState.c?.();
  suggestionState.t?.();
  (homeSuggestionSurfaceChunk as unknown as { n?(): void }).n?.();
  initialized = true;
}

function normalizeGeneratedSuggestion(value: Record<string, unknown>): AmbientSuggestionItem | null {
  const id = typeof value.id === "string" ? value.id : null;
  const prompt = typeof value.prompt === "string" ? value.prompt : null;
  const title = typeof value.title === "string" ? value.title : prompt;
  if (id == null || prompt == null || title == null) return null;
  const rawAction = value.homeAction as Record<string, unknown> | undefined;
  let homeAction: AmbientSuggestionAction = { type: "fill-composer" };
  if (rawAction?.type === "start-thread") {
    homeAction = {
      type: "start-thread",
      initialTitle: typeof rawAction.initialTitle === "string" ? rawAction.initialTitle : undefined,
      skillNameToMention: typeof rawAction.skillNameToMention === "string" ? rawAction.skillNameToMention : undefined,
      elicitationPluginIds: Array.isArray(rawAction.elicitationPluginIds) ? rawAction.elicitationPluginIds.filter((item): item is string => typeof item === "string") : undefined,
    };
  } else if (rawAction?.type === "connect-plugin-onboarding") {
    const plugin = rawAction.plugin as { id?: string } | undefined;
    homeAction = { type: "connect-plugin-onboarding", pluginId: plugin?.id ?? "" };
  }
  return {
    analyticsType: typeof value.analyticsType === "string" ? value.analyticsType : undefined,
    appIds: Array.isArray(value.appIds) ? value.appIds.filter((item): item is string => typeof item === "string") : undefined,
    homeAction,
    id,
    prompt,
    showArtifactTemplates: value.showArtifactTemplates === true,
    source: value.source === "default" || value.source === "curated" ? value.source : "generated",
    title,
  };
}

function HomeAmbientSuggestionsContent(props: HomeAmbientSuggestionsContentProps): unknown {
  initializeAmbientSuggestions();
  const scope = shared.LX(initial.kht ?? shared.ZI);
  const composer = initial.HZ?.();
  const params = { domain: "default", hostId: props.hostId, projectRoot: props.projectRoot };
  const query = suggestionState.a == null ? undefined : shared.BX<{ data?: { file?: { currentSuggestionIds?: string[]; suggestions?: Record<string, unknown>[] } }; isError?: boolean; isLoading?: boolean; isPending?: boolean }>(suggestionState.a, params, { enabled: props.generatedSuggestionsEnabled && props.projectRoot != null });
  const pending = suggestionState.p == null ? undefined : shared.BX<Record<string, unknown>[] | undefined>(suggestionState.p, params);
  const state = props.runtimeState;
  const queryItems = pending ?? query?.data?.file?.suggestions?.filter((item) => item.status === "pending") ?? [];
  const generated = state?.generatedSuggestions ?? queryItems.flatMap((item) => {
    const normalized = normalizeGeneratedSuggestion(item);
    return normalized == null ? [] : [normalized];
  });
  const source = state?.source ?? (props.generatedSuggestionsEnabled && generated.length > 0 ? "generated" : "curated");
  const categories = source === "curated" ? state?.curatedCategories ?? [...DEFAULT_CATEGORIES] : [];
  const supplemental = state?.starterPrompt == null ? generated : [state.starterPrompt, ...generated];
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(null);
  const activeCategory = categories.find((category) => category.id === activeCategoryId);
  const suggestions = activeCategory?.tasks ?? supplemental;
  const disabled = state?.isAgentModePending === true || state?.isLoading === true || query?.isLoading === true || query?.isPending === true;
  const surface: AmbientSuggestionSurface = props.plan === "chatgpt_work" ? "chatgpt_work" : "codex";
  const layout = props.topLevelLayout ?? (source === "generated" ? "list" : "cards");
  const visibleIds = suggestions.map((item) => item.id).join(",");
  const previousVisibleIds = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (visibleIds === "" || previousVisibleIds.current === visibleIds) return;
    previousVisibleIds.current = visibleIds;
    initial.xpn?.(scope, "ambient_suggestions_impression", { promptCount: suggestions.length, promptIds: visibleIds, surface });
  }, [scope, suggestions.length, surface, visibleIds]);
  if (state?.hidden === true || composer?.hasText() === true) return null;
  if (source === "generated" && props.projectRoot == null) return null;

  const markAccepted = (suggestion: AmbientSuggestionItem) => {
    if (suggestion.source === "default") suggestionState.f?.(scope, params, suggestion.id, "accepted");
    else suggestionState.d?.(scope, params, suggestion.id, "accepted");
  };
  const activate = async (suggestion: AmbientSuggestionItem, index: number) => {
    if (disabled) return;
    try {
      switch (suggestion.homeAction.type) {
        case "fill-composer":
        case "connect-plugin-onboarding":
          composer?.setPromptText(suggestion.prompt);
          composer?.focus();
          markAccepted(suggestion);
          break;
        case "start-thread": {
          if (props.projectRoot == null || primary.eu == null) return;
          const created = await primary.eu(scope, {
            elicitationPluginIds: suggestion.homeAction.elicitationPluginIds,
            hostId: props.hostId,
            initialTitle: suggestion.homeAction.initialTitle,
            projectRoot: props.projectRoot,
            prompt: suggestion.prompt,
            skillName: suggestion.homeAction.skillNameToMention,
            threadSource: "ambient_suggestion_task",
            turnTrigger: "ambient_suggestion_task",
          });
          if (created?.conversationId != null) await props.onLocalConversationCreated(created.conversationId);
          markAccepted(suggestion);
          break;
        }
      }
      initial.xpn?.(scope, "ambient_suggestion_selected", { action: suggestion.homeAction.type, promptId: suggestion.id, promptIndex: index, promptType: suggestion.analyticsType ?? suggestion.source, surface });
    } catch {
      scope.get<{ danger?(message: string, options?: unknown): void } | undefined>(shared.pk)?.danger?.("Unable to start this suggestion", { errorAnalytics: { toastId: "home.ambientSuggestions.startError" }, id: "ambient-suggestion-start-error" });
    }
  };
  const items = suggestions.map((suggestion, index) => ({
    disabled,
    id: suggestion.id,
    label: suggestion.title,
    onClick: () => void activate(suggestion, index),
    tooltipContent: suggestion.prompt,
  }));
  const categoryItems = categories.map((category) => ({ disabled, id: category.id, label: category.title, onClick: () => { composer?.setPromptText(category.starterPrompt); setActiveCategoryId(category.id); }, tooltipContent: category.starterPrompt }));
  if (HomeSuggestionSurface == null || (items.length === 0 && categoryItems.length === 0 && state?.headline == null && primary.Sg?.().headline?.message_body == null)) return null;
  return jsx.jsxs("div", { className: "flex min-w-0 flex-col gap-3", children: [
    activeCategory == null ? null : jsx.jsx("button", { onClick: () => setActiveCategoryId(null), type: "button", children: "Back" }),
    jsx.jsx(HomeSuggestionSurface, {
      headline: state?.headline ?? primary.Sg?.().headline?.message_body,
      hideSuggestions: false,
      isRefreshing: false,
      items: activeCategory == null && source === "curated" ? categoryItems : items,
      layout,
      showCloseAction: source === "curated",
    }),
    query?.isError ? jsx.jsx("div", { role: "alert", children: "Suggestions could not be loaded" }) : null,
  ] });
}

export { HomeAmbientSuggestionsContent };
