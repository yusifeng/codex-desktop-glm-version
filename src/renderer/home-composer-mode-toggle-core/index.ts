// home-composer-mode-toggle-core —— 首页 Chat / Work 模式切换控件。
//
// 原版：app/webview/assets/home-composer-mode-toggle-ceb4980e314e.js
//（9.1KB / 303 行）。
//
// 两个导出：n = initializeHomeComposerModeToggle（原 `j`），
// t = HomeComposerModeToggle（原 `C`）。

import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";

export type HomeComposerMode = "chat" | "work";

export interface HomeComposerModeToggleProps {
  className?: string;
  autoFocusSelected?: boolean;
  value: HomeComposerMode;
  onValueChange(value: HomeComposerMode): void;
  onSelectedAutoFocus?(): void;
  onTransitionComplete?(): void;
  disabled?: boolean;
  workRequiresUpgrade?: boolean;
  emphasizeWorkUpgrade?: boolean;
  /** 原组件从 reduce-motion hook 读取；语义层允许显式注入。 */
  reduceMotion?: boolean;
}

export interface HomeComposerModeOptionView {
  value: HomeComposerMode;
  label: "Chat" | "Work";
  tooltip: string;
  selected: boolean;
  disabled: boolean;
  autoFocus: boolean;
  requiresUpgrade: boolean;
  emphasized: boolean;
  activate(): void;
}

export interface HomeComposerModeToggleView {
  kind: "home-composer-mode-toggle";
  ariaLabel: "Composer mode";
  className?: string;
  indicator: {
    x: string;
    durationSeconds: number;
  };
  upgradePopoverEnabled: boolean;
  options: [HomeComposerModeOptionView, HomeComposerModeOptionView];
}

const INDICATOR_POSITION: Record<HomeComposerMode, string> = {
  chat: "calc((0% - 0px) * var(--mode-toggle-direction))",
  work: "calc((100% - 17px) * var(--mode-toggle-direction))",
};

function initializeHomeComposerModeToggle(): void {}

/**
 * HomeComposerModeToggle（原 `C`）：Chat/Work 双按钮共享滑动 indicator；Free/
 * Go 计划点击锁定的 Work 时启用 upgrade popover，disabled 时两项都不可操作。
 */
function HomeComposerModeToggle(props: HomeComposerModeToggleProps): HomeComposerModeToggleView {
  const disabled = props.disabled === true;
  const requiresUpgrade = props.workRequiresUpgrade === true;
  const autoFocus = props.autoFocusSelected === true;

  const activate = (mode: HomeComposerMode) => {
    if (disabled || props.value === mode) return;
    props.onValueChange(mode);
  };

  const chat: HomeComposerModeOptionView = {
    value: "chat",
    label: "Chat",
    tooltip: "Ask questions and explore ideas",
    selected: props.value === "chat",
    disabled,
    autoFocus: autoFocus && props.value === "chat",
    requiresUpgrade: false,
    emphasized: false,
    activate: () => activate("chat"),
  };
  const work: HomeComposerModeOptionView = {
    value: "work",
    label: "Work",
    tooltip: "Get tasks done with your files and apps",
    selected: props.value === "work",
    disabled,
    autoFocus: autoFocus && props.value === "work",
    requiresUpgrade,
    emphasized: requiresUpgrade && props.emphasizeWorkUpgrade === true && props.value !== "work",
    activate: () => activate("work"),
  };

  return {
    kind: "home-composer-mode-toggle",
    ariaLabel: "Composer mode",
    className: props.className,
    indicator: {
      x: INDICATOR_POSITION[props.value],
      durationSeconds: props.reduceMotion === true ? 0 : 0.3,
    },
    upgradePopoverEnabled: requiresUpgrade && props.value === "chat" && !disabled,
    options: [chat, work],
  };
}

export { initializeHomeComposerModeToggle as n, HomeComposerModeToggle as t };
