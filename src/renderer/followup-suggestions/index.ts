// followup-suggestions —— Sketch 完成后的首页 follow-up suggestions。
// 原版：app/webview/assets/followup-suggestions-822629129cd6.js。

import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/home-suggestion-surface";
import "@rchunk/values";

export interface SketchFollowupSuggestion {
  id: string;
  title: string;
  prompt_text: string;
  system_hints?: string[] | null;
}

export interface SketchHomeSuggestionsProps {
  mode?: string;
  items?: SketchFollowupSuggestion[] | null;
  uploadId?: string | null;
  hasText?: boolean;
  random?: () => number;
  onClearSketchState?(): void;
  onSetPromptText?(text: string): void;
  onSetSystemHints?(hints: string[]): void;
  onFocus?(): void;
  onTrackSelection?(input: { suggestionId: string; position: number }): void;
}

function chooseSample<T>(items: T[], count: number, random: () => number): T[] {
  const pool = [...items];
  const result: T[] = [];
  while (pool.length > 0 && result.length < count) {
    result.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return result;
}

function selectSketchFollowupSuggestions(
  items: SketchFollowupSuggestion[],
  random: () => number,
): SketchFollowupSuggestion[] {
  const valid = items.filter((item) => item.title.trim() && item.prompt_text.trim());
  const primary = valid.find((item) => ["make_art", "make-it-art"].includes(item.id.replace(/,$/, ""))) ?? valid[0];
  const animation = valid.find((item) => item.id === "animate_drawing");
  if (primary == null) return [];
  return [
    primary,
    ...chooseSample(valid.filter((item) => item !== primary && item !== animation), 2, random),
    ...(animation != null && animation !== primary ? [animation] : []),
  ];
}

function SketchHomeSuggestions(props: SketchHomeSuggestionsProps) {
  if (props.uploadId == null || props.items == null || props.items.length === 0) return null;
  const items = selectSketchFollowupSuggestions(props.items, props.random ?? Math.random);
  if (items.length === 0) return null;
  return {
    kind: "sketch-home-suggestions" as const,
    composerMode: props.mode ?? "chat",
    layout: "list" as const,
    showCloseAction: false,
    items: items.map((item, index) => ({
      id: item.id,
      label: item.title,
      disabled: false,
      icon: item.id.replace(/,$/, ""),
      select: () => {
        if (props.hasText === true || props.uploadId == null) return false;
        props.onClearSketchState?.();
        props.onSetPromptText?.(item.prompt_text);
        props.onSetSystemHints?.(item.system_hints ?? []);
        props.onFocus?.();
        props.onTrackSelection?.({ suggestionId: item.id, position: index });
        return true;
      },
    })),
  };
}

export { SketchHomeSuggestions };
