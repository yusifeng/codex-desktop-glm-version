// home-suggestion-staggered-item —— Home suggestion 进入/退出时的错峰动效。
// 原版：app/webview/assets/home-suggestion-staggered-item-832765849b4a.js。

import "@rchunk/app-shared";
import "@rchunk/app-initial";

export type HomeSuggestionStaggerVariant = "card" | "feed" | string;

export interface HomeSuggestionStaggeredItemProps<T = unknown> {
  className?: string;
  children: T;
  index: number;
  variant: HomeSuggestionStaggerVariant;
  /** 原组件分别从 reduce-motion 与 presence hooks 获取。 */
  reduceMotion?: boolean;
  present?: boolean;
}

function HomeSuggestionStaggeredItem<T>(props: HomeSuggestionStaggeredItemProps<T>) {
  const reduceMotion = props.reduceMotion === true;
  const present = props.present ?? true;
  const feed = props.variant === "feed";
  const card = props.variant === "card";
  const delay = reduceMotion ? 0 : feed ? Math.min(props.index, 5) * 0.09 : props.index * 0.025;
  const duration = reduceMotion ? 0 : feed ? 0.34 : 0.15;

  return {
    kind: "home-suggestion-staggered-item" as const,
    className: props.className,
    inert: !present,
    ariaHidden: !present || undefined,
    animate: { opacity: 1, transform: "translateY(0)" },
    initial: reduceMotion
      ? false
      : { opacity: 0, transform: `translateY(${card ? 8 : 4}px)` },
    exit: feed ? { opacity: 0, transition: { duration: reduceMotion ? 0 : 0.12 } } : undefined,
    transition: { delay, duration, ease: [0.23, 1, 0.32, 1] as const },
    children: props.children,
  };
}

function initializeHomeSuggestionStaggeredItem(): void {}

export {
  initializeHomeSuggestionStaggeredItem as n,
  HomeSuggestionStaggeredItem as t,
};
