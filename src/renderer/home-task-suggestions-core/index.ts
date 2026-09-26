// home-task-suggestions-core —— 首页 Work 任务建议核心。
//
// 原版：app/webview/assets/home-task-suggestions-e29a02e9b466.js
//（26.8KB / 1,004 行）。
//
// 四个导出（压缩名 → 语义）：
//   i = taskSuggestionAccountIdSignal（原 `X`）
//   n = initializeHomeTaskSuggestions（原 `Pn`）
//   r = initializeTaskSuggestionQueries（原 `fn`）
//   t = HomeTaskSuggestions（原 `hn`）

import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/home-suggestion-surface";
import "@rchunk/home-starter-prompts";

export type HomeTaskSuggestionMode = "chat" | "local" | string;
export type WorkRunLocation = "cloud" | "local" | null;

export interface PromptDestinationMetadata {
  type: "prompt";
  prompt: string;
  entrypoint?: string;
  auto_send?: boolean;
  auto_send_in_background?: boolean;
  show_prompt_on_hover?: boolean;
}

export interface ConnectorDestinationMetadata {
  type: "connector";
}

export interface RawHomeTaskSuggestion {
  id: string;
  title: string;
  item_type: string;
  emoji?: string | null;
  destination_metadata?: PromptDestinationMetadata | ConnectorDestinationMetadata | null;
  action_metadata?: {
    prompt?: string;
    system_hints?: unknown[];
  } | null;
  icon_paths?: Record<string, string | undefined>;
  logging_metadata?: {
    app_id?: string;
    suggestion_id?: string;
  } | null;
}

export interface HomeTaskSuggestion {
  item: RawHomeTaskSuggestion;
  emoji?: string | null;
  iconDarkUrl?: string;
  iconUrl?: string;
  id: string;
  isScheduledAutomation: boolean;
  prompt: string;
  title: string;
}

export interface HomeTaskSuggestionsRuntimeState {
  accountId?: string | null;
  composerEmpty?: boolean;
  headline?: string | null;
  navigationIdle?: boolean;
  pendingSuggestionIds?: string[];
  rawSuggestions?: RawHomeTaskSuggestion[];
  showFollowUpSketchSuggestion?: boolean;
  clinicalExperimentEnabled?: boolean;
  clinicalPluginLoading?: boolean;
  clinicalPluginError?: boolean;
}

export interface HomeTaskSuggestionsProps {
  generatedSuggestionsEnabled?: boolean;
  hostId: string;
  mode: HomeTaskSuggestionMode;
  onSelect?(suggestion: HomeTaskSuggestion): void;
  projectId?: string | null;
  prepareDestination?(destination: string): void | Promise<void>;
  workRunLocation?: WorkRunLocation;
  showGenericSuggestions?: boolean;
  showClinicalHomeSuggestions?: boolean;
  /** 语义重写层显式输入；真实组件从 stores/query/portal contexts 读取。 */
  runtimeState?: HomeTaskSuggestionsRuntimeState;
}

export interface HomeTaskSuggestionActionPlan {
  type: "fill-composer" | "start-background-thread";
  autoSend: boolean;
  destination: string;
  prompt: string;
  requiresCloud: boolean;
}

export interface HomeTaskSuggestionViewItem {
  id: string;
  label: string;
  disabled: boolean;
  emoji: string | null;
  iconUrl: string | null;
  iconDarkUrl: string | null;
  tooltipPrompt: string | null;
  action: HomeTaskSuggestionActionPlan;
}

export interface HomeTaskSuggestionsView {
  kind: "home-task-suggestions";
  composerMode: HomeTaskSuggestionMode;
  headline: string | null;
  layout: "list";
  showCloseAction: false;
  items: HomeTaskSuggestionViewItem[];
  clinicalPortal: {
    enabled: boolean;
    showStarterPrompts: boolean;
  } | null;
}

/** 原 `X`：当前 ChatGPT task suggestions 查询所使用的账号。 */
const taskSuggestionAccountIdSignal = {
  key: "chatgpt-task-suggestions-account-id",
};

/** 原 `ln`：丢弃 curated、空标题和无 prompt 条目，并统一 API 形态。 */
function normalizeTaskSuggestions(items: readonly RawHomeTaskSuggestion[]): HomeTaskSuggestion[] {
  return items.flatMap((item) => {
    const destination = item.destination_metadata;
    let prompt = destination?.type === "prompt" ? destination.prompt : undefined;
    if (destination?.type === "connector") prompt = item.action_metadata?.prompt;
    if (item.item_type === "chat_home_curated" || item.title.trim() === "" || !prompt?.trim()) return [];
    return [
      {
        item,
        emoji: item.emoji,
        iconDarkUrl: item.icon_paths?.["64_1x_dark"],
        iconUrl: item.icon_paths?.["64_1x"],
        id: item.logging_metadata?.suggestion_id ?? item.id,
        isScheduledAutomation: item.item_type === "automation_suggestion",
        prompt,
        title: item.title,
      },
    ];
  });
}

/** 原 `Tn`：只有 task/automation prompt destination 可请求后台自动发送。 */
function startsInBackground(suggestion: HomeTaskSuggestion): boolean {
  const { item_type: itemType, destination_metadata: destination } = suggestion.item;
  return (
    (itemType === "task_suggestion" || itemType === "automation_suggestion") &&
    destination?.type === "prompt" &&
    destination.auto_send_in_background === true
  );
}

/** 原 `En`：主机返回的站内相对图标统一解析到 chatgpt.com。 */
function normalizeIconUrl(url: string | undefined): string | null {
  if (url == null) return null;
  return url.startsWith("/") ? new URL(url, "https://chatgpt.com").href : url;
}

function actionPlanFor(
  suggestion: HomeTaskSuggestion,
  fallbackDestination: string,
): HomeTaskSuggestionActionPlan {
  const destination = suggestion.item.destination_metadata;
  const background = startsInBackground(suggestion);
  return {
    type: background ? "start-background-thread" : "fill-composer",
    autoSend: destination?.type === "prompt" && destination.auto_send === true,
    destination: destination?.type === "prompt" ? (destination.entrypoint ?? fallbackDestination) : fallbackDestination,
    prompt: suggestion.prompt,
    requiresCloud: background,
  };
}

function initializeTaskSuggestionQueries(): void {}
function initializeHomeTaskSuggestions(): void {
  initializeTaskSuggestionQueries();
}

/**
 * HomeTaskSuggestions（原 `hn`/`_n`）。Generic 区最多取三条，composer 非空、
 * 导航/附件处理中或查询不可用时隐藏；后台条目保留 Cloud 限制。Clinical
 * starter prompts 通过 follow-up portal 独立呈现。
 */
function HomeTaskSuggestions(props: HomeTaskSuggestionsProps): HomeTaskSuggestionsView | null {
  const state = props.runtimeState;
  const showGeneric = props.showGenericSuggestions !== false;
  const showClinical = props.showClinicalHomeSuggestions === true;
  if (state == null) return null;

  const clinicalEligible =
    showClinical &&
    props.mode !== "chat" &&
    state.clinicalExperimentEnabled === true &&
    state.clinicalPluginError !== true;
  const clinicalPortal = showClinical
    ? {
        enabled: true,
        showStarterPrompts:
          clinicalEligible &&
          state.clinicalPluginLoading !== true &&
          state.navigationIdle !== false,
      }
    : null;

  const suggestionsDisabled =
    state.composerEmpty === false || state.navigationIdle === false || props.generatedSuggestionsEnabled === false;
  const suggestions =
    showGeneric && !suggestionsDisabled && state.accountId != null
      ? normalizeTaskSuggestions(state.rawSuggestions ?? []).slice(0, 3)
      : [];
  if (suggestions.length === 0 && state.headline == null && clinicalPortal == null) return null;

  const pendingIds = new Set(state.pendingSuggestionIds ?? []);
  const fallbackDestination = props.mode;
  return {
    kind: "home-task-suggestions",
    composerMode: props.mode,
    headline: state.headline ?? null,
    layout: "list",
    showCloseAction: false,
    items: suggestions.map((suggestion) => {
      const destination = suggestion.item.destination_metadata;
      return {
        id: suggestion.id,
        label: suggestion.title,
        disabled: pendingIds.has(suggestion.id),
        emoji: suggestion.emoji?.trim() || null,
        iconUrl: normalizeIconUrl(suggestion.iconUrl),
        iconDarkUrl: normalizeIconUrl(suggestion.iconDarkUrl),
        tooltipPrompt:
          destination?.type === "prompt" && destination.show_prompt_on_hover === true
            ? suggestion.prompt
            : null,
        action: actionPlanFor(suggestion, fallbackDestination),
      };
    }),
    clinicalPortal,
  };
}

export {
  taskSuggestionAccountIdSignal as i,
  initializeHomeTaskSuggestions as n,
  initializeTaskSuggestionQueries as r,
  HomeTaskSuggestions as t,
};
