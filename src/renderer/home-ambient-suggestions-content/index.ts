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
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/onboarding-mail-provider";
import "@rchunk/ambient-suggestion-apps";
import "@rchunk/new-chat-suggestion-source-debug-state";
import "@rchunk/color-icon";
import "@rchunk/home-suggestion-surface";
import "@rchunk/book-open";
import "@rchunk/new-chat-page-suggestions-eligibility";

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

/**
 * HomeAmbientSuggestionsContent（原 `Zi` → `xi`）。生成建议未启用、项目根
 * 缺失或资格查询尚未选出来源时不显示；curated 模式呈现 taxonomy，generated
 * 模式默认为 list。每个条目都保留原三类启动动作的执行语义。
 */
function HomeAmbientSuggestionsContent(
  props: HomeAmbientSuggestionsContentProps,
): HomeAmbientSuggestionsView | null {
  const state = props.runtimeState;
  if (!props.generatedSuggestionsEnabled || props.projectRoot == null || state == null || state.hidden === true) {
    return null;
  }

  const source = state.source;
  if (source == null && state.starterPrompt == null) return null;
  const categories = source === "curated" ? (state.curatedCategories ?? [...DEFAULT_CATEGORIES]) : [];
  const supplemental = state.generatedSuggestions ?? [];
  const rawSuggestions = state.starterPrompt == null ? supplemental : [state.starterPrompt, ...supplemental];
  const projectRoot = props.projectRoot ?? null;
  const disabled = state.isAgentModePending === true || state.isLoading === true;
  const suggestions = rawSuggestions.map((suggestion) => ({
    ...suggestion,
    disabled,
    execution: createExecutionPlan(suggestion, props.hostId, projectRoot),
  }));
  const surface: AmbientSuggestionSurface = props.plan === "chatgpt_work" ? "chatgpt_work" : "codex";
  const layout = props.topLevelLayout ?? (source === "generated" ? "list" : "cards");

  return {
    kind: "home-ambient-suggestions",
    surface,
    domain: deriveDomain(state.selectedModel, state.selectedModelDisplayName),
    headline: state.headline ?? null,
    layout,
    loading: state.isLoading === true,
    refreshable: source === "generated",
    activeSuggestionId: state.activeSuggestionId ?? null,
    categories,
    suggestions,
    prioritizedSupplementalItemIds: surface === "chatgpt_work" ? ["learn-writing-style"] : [],
  };
}

export { HomeAmbientSuggestionsContent };
