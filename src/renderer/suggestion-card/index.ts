// suggestion-card —— 首页 suggestion 的可访问卡片按钮。
// 原版：app/webview/assets/suggestion-card-f3fce61476bd.js。

import "@rchunk/app-shared";

export interface SuggestionCardProps<TIcon = unknown, TTooltip = unknown> {
  description?: string | null;
  disabled?: boolean;
  icon: TIcon;
  keyboardShortcut?: string | null;
  label: string;
  tooltipContent?: TTooltip;
  onClick?(): void;
  /** React useId 的确定性替代，便于 SSR/测试层保持 aria 关联。 */
  id?: string;
}

let nextSuggestionCardId = 0;

function SuggestionCard<TIcon, TTooltip>(props: SuggestionCardProps<TIcon, TTooltip>) {
  const id = props.id ?? `suggestion-card-${++nextSuggestionCardId}`;
  const descriptionId = `${id}-description`;
  const labelId = `${id}-label`;
  return {
    kind: "suggestion-card" as const,
    role: "button" as const,
    type: "button" as const,
    disabled: props.disabled === true,
    ariaLabelledBy: labelId,
    ariaDescribedBy: props.description == null ? undefined : descriptionId,
    icon: props.icon,
    keyboardShortcut: props.keyboardShortcut ?? null,
    label: { id: labelId, text: props.label },
    description: props.description == null
      ? null
      : { id: descriptionId, text: props.description, lineClamp: 2 },
    tooltip: {
      content: props.tooltipContent,
      maxWidth: "min(24rem, var(--radix-tooltip-content-available-width), calc(100vw - 16px))",
    },
    activate: () => {
      if (props.disabled !== true) props.onClick?.();
    },
  };
}

function initializeSuggestionCard(): void {}

export { initializeSuggestionCard as n, SuggestionCard as t };
