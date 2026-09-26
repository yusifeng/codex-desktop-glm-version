// composer-overlay —— Home composer 在 quick-chat 与右侧面板 overlay 间的路由层。
// 原版：app/webview/assets/composer-overlay-4397ac448ec8.js。

import "@rchunk/app-shared";
import "@rchunk/app-primary";
import "@rchunk/right-panel-composer-overlay";
import "@rchunk/content-quick-chat-overlay";

export interface HomeComposerOverlayProps<T = unknown> {
  children(): T;
  expandComposerContentImmediately?: boolean;
  forceExpanded?: boolean;
  /** 原组件从 quick-chat context 读取；语义重写层允许显式传入。 */
  quickChatEnabled?: boolean;
}

export type HomeComposerOverlayView<T> =
  | {
      kind: "content-quick-chat-overlay";
      composerOnly: true;
      /** quick-chat overlay 自己决定何时求值。 */
      children: () => T;
    }
  | {
      kind: "right-panel-composer-overlay";
      expandComposerContentImmediately?: boolean;
      forceExpanded?: boolean;
      children: T;
    };

function HomeComposerOverlay<T>(props: HomeComposerOverlayProps<T>): HomeComposerOverlayView<T> {
  if (props.quickChatEnabled === true) {
    return {
      kind: "content-quick-chat-overlay",
      composerOnly: true,
      children: props.children,
    };
  }
  return {
    kind: "right-panel-composer-overlay",
    expandComposerContentImmediately: props.expandComposerContentImmediately,
    forceExpanded: props.forceExpanded,
    children: props.children(),
  };
}

export { HomeComposerOverlay };
