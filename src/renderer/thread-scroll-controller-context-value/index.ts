// thread-scroll-controller-context-value —— 会话滚动控制器上下文。
//
// 原版：app/webview/assets/thread-scroll-controller-context-value-144c8345e935.js
//（412B，依赖 rolldown runtime + app-shared 的 React 导出）。
//
// 三个导出（压缩名 → 语义）：
//   - n（懒初始化器）：装配 React 引用与 context（createContext(null)）
//   - r（useThreadScrollController）：React 19 use() 消费 context；
//     缺 Provider 时抛
//     `useThreadScrollController must be used within ThreadScrollLayout`
//   - t（context 本体）：ThreadScrollLayout 提供的滚动控制器实例

import { e6 as react } from "@rchunk/app-shared";

let context: ReturnType<typeof react.createContext> | null = null;

/** 懒初始化器（原 `n`）：幂等。 */
function initializeThreadScrollControllerContext(): void {
  if (context != null) return;
  context = react.createContext(null);
}

/** 滚动控制器上下文代理（原 `t`：context 本体，懒装配后可用）。 */
const threadScrollControllerContextProxy = new Proxy(
  {},
  {
    get(_target, prop, receiver) {
      initializeThreadScrollControllerContext();
      return Reflect.get(context as object, prop, receiver);
    },
  },
);

/** useThreadScrollController（原 `r`）：必须位于 ThreadScrollLayout 内。 */
function useThreadScrollController(): unknown {
  initializeThreadScrollControllerContext();
  const value = (react as unknown as { use(ctx: unknown): unknown }).use(context);
  if (value == null) throw new Error("useThreadScrollController must be used within ThreadScrollLayout");
  return value;
}

// 原版压缩导出名（chunk 间契约）：n=懒初始化器 r=useThreadScrollController
// t=context 本体（Proxy 转发，保持原版的「先 n() 后取 t」使用序）。
export { initializeThreadScrollControllerContext as n, useThreadScrollController as r, threadScrollControllerContextProxy as t };
