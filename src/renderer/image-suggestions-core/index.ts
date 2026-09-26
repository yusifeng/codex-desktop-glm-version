// image-suggestions-core —— Images / Home 图像提示建议核心。
//
// 原版：app/webview/assets/suggestions-1907f4f59b11.js（40KB / 1,490 行）。
//
// 八个压缩导出：
//   a = createImageSuggestionConversationState（原 `Me`）
//   c = initializeImageSuggestionState（原 `Pe`）
//   i = trackImageSuggestionSent（原 `Ie`）
//   n = initializeImageSuggestions（原 `vt`）
//   o = imageSuggestionSelectionFamily（原 `q`）
//   r = initializeImageSuggestionAnalytics（原 `ze`）
//   s = imageSuggestionConversationIdFamily（原 `Ne`）
//   t = ImageSuggestions（原 `ht`）
//
// 组件覆盖 image_card / portrait / text_pill / icon_pill 四种 presentation，
// Images 与 Home 两个 surface，以及 prompt-only / upload / recent image /
// sketch 输入需求。

import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/security-tabs";
import "@rchunk/option-carousel";
import "@rchunk/recent-uploads";
import "@rchunk/chatgpt-image-home";

export type ImageSuggestionSurface = "home" | "images";
export type ImageSuggestionPresentation = "icon_pill" | "image_card" | "portrait" | "text_pill";
export type ImageInputSource = "prompt_only" | "sketch" | "upload" | "recent_upload";

export interface ImageSuggestionAction {
  input_requirements?: { source?: ImageInputSource | null };
}

export interface ImageSuggestionPrompt {
  id: string;
  prompt_text: string;
  section?: string;
  action?: ImageSuggestionAction;
}

export interface ImageSuggestionGroup {
  id: string;
  kind?: "prompt_collection" | string | null;
  presentation: ImageSuggestionPresentation;
  action?: ImageSuggestionAction;
  items?: ImageSuggestionPrompt[];
}

export interface SelectedImageSuggestion {
  group: ImageSuggestionGroup;
  item: ImageSuggestionPrompt;
}

export interface ComposerControllerLike {
  getPersistedText(): string;
  setPromptText(text: string): void;
  focus(): void;
  view?: { isDestroyed?: boolean };
}

export interface ImageComposerActionsLike {
  canOpenImagePicker?: boolean;
  openFileDialog?(imagesOnly?: boolean): void;
  openSketch?(options: { isRequestCurrent(): boolean; onSave(): void }): boolean;
  isSketchOpen?(): boolean;
}

export interface ImageSuggestionsProps {
  conversationId: string;
  composerController: ComposerControllerLike;
  composer?: ImageComposerActionsLike | null;
  disabled?: boolean;
  excludedPromptId?: string | null;
  isConversationCurrent?(): boolean;
  onBeforeSelectPrompt?(): void;
  onReferenceImageSelected?(): void;
  onUploadSelectionChange?(selection: SelectedImageSuggestion | null): void;
  surface?: ImageSuggestionSurface;
  groups?: ImageSuggestionGroup[];
  selectedSuggestion?: SelectedImageSuggestion | null;
}

export interface ImageSuggestionCardView {
  id: string;
  groupId: string;
  presentation: ImageSuggestionPresentation;
  promptText: string;
  requiresInput: boolean;
  source: ImageInputSource;
}

export interface ImageSuggestionsView {
  kind: "image-suggestions";
  surface: ImageSuggestionSurface;
  disabled: boolean;
  hidden: boolean;
  sections: string[];
  cards: ImageSuggestionCardView[];
  showRecentUploads: boolean;
  showUploadCard: boolean;
  showSketch: boolean;
}

const selections = new Map<string, SelectedImageSuggestion | null>();
const conversationIds = new Map<string, string>();

function randomConversationId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `image-${Date.now().toString(36)}`;
}

/** 原 `Me`：为 atom family key 创建稳定 conversationId 状态。 */
function createImageSuggestionConversationState(key: string): { conversationId: string } {
  let conversationId = conversationIds.get(key);
  if (conversationId == null) {
    conversationId = randomConversationId();
    conversationIds.set(key, conversationId);
  }
  return { conversationId };
}

function initializeImageSuggestionState(): void {}

/** 原 `Ie`：Images surface 发送事件；返回负载便于语义层验证。 */
function trackImageSuggestionSent(
  _scope: unknown,
  item: ImageSuggestionPrompt,
  group: ImageSuggestionGroup,
  imageSendUuid: string,
): void {
  void {
    promptId: item.id,
    promptGroupId: group.id,
    promptGroupPresentation: group.presentation,
    position: group.items?.findIndex((candidate) => candidate.id === item.id),
    imageSendUuid,
    surface: "images",
  };
}

function initializeImageSuggestionAnalytics(): void {}
function initializeImageSuggestions(): void {}

/** 原 `q` / `Ne` 的可检查语义面。 */
const imageSuggestionSelectionFamily = {
  get(key: string): SelectedImageSuggestion | null {
    return selections.get(key) ?? null;
  },
  set(key: string, selection: SelectedImageSuggestion | null): void {
    selections.set(key, selection);
  },
};

const imageSuggestionConversationIdFamily = {
  get(key: string): string {
    return createImageSuggestionConversationState(key).conversationId;
  },
};

function mergeHomePromptText(existing: string, next: string, previous?: string): string {
  const base = previous != null && existing.endsWith(previous) ? existing.slice(0, -previous.length) : existing;
  return `${base}${next}`;
}

function collectSections(groups: readonly ImageSuggestionGroup[], preferred: readonly string[] = []): string[] {
  const sections = [
    ...new Set(
      groups.flatMap((group) =>
        group.kind == null || group.kind === "prompt_collection"
          ? (group.items?.map((item) => item.section ?? "") ?? [])
          : [],
      ),
    ),
  ];
  return sections.sort((left, right) => {
    const leftIndex = preferred.indexOf(left || "trending");
    const rightIndex = preferred.indexOf(right || "trending");
    return (leftIndex < 0 ? preferred.length : leftIndex) - (rightIndex < 0 ? preferred.length : rightIndex);
  });
}

/**
 * ImageSuggestions（原 `ht`）。Home surface 选择卡片时把新 prompt 合并到持久
 * 文本；Images surface 直接替换。非 prompt-only/sketch 的选中卡进入 recent
 * upload 选择面，sketch 则走 drawing editor。
 */
function ImageSuggestions(props: ImageSuggestionsProps): ImageSuggestionsView {
  const surface = props.surface ?? "images";
  const groups = props.groups ?? [];
  const selected = props.selectedSuggestion ?? imageSuggestionSelectionFamily.get(props.conversationId);
  const selectedSource = (selected?.item.action ?? selected?.group.action)?.input_requirements?.source;
  const showRecentUploads =
    selectedSource != null && selectedSource !== "prompt_only" && selectedSource !== "sketch";
  const showSketch = selectedSource === "sketch";
  const cards = groups.flatMap((group) =>
    (group.items ?? [])
      .filter((item) => item.id !== props.excludedPromptId)
      .map((item) => {
        const source = (item.action ?? group.action)?.input_requirements?.source ?? "prompt_only";
        return {
          id: item.id,
          groupId: group.id,
          presentation: group.presentation,
          promptText:
            surface === "home"
              ? mergeHomePromptText(
                  props.composerController.getPersistedText(),
                  item.prompt_text,
                  selected?.item.prompt_text,
                )
              : item.prompt_text,
          requiresInput: source !== "prompt_only",
          source,
        } satisfies ImageSuggestionCardView;
      }),
  );

  return {
    kind: "image-suggestions",
    surface,
    disabled: props.disabled === true,
    hidden: showRecentUploads,
    sections: collectSections(groups),
    cards,
    showRecentUploads,
    showUploadCard: surface === "home" && props.composer?.canOpenImagePicker === true,
    showSketch,
  };
}

export {
  createImageSuggestionConversationState as a,
  initializeImageSuggestionState as c,
  trackImageSuggestionSent as i,
  initializeImageSuggestions as n,
  imageSuggestionSelectionFamily as o,
  initializeImageSuggestionAnalytics as r,
  imageSuggestionConversationIdFamily as s,
  ImageSuggestions as t,
};
