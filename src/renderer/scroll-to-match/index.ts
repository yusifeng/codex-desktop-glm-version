// scroll-to-match —— 会话内搜索命中的滚动定位。
//
// 原版：app/webview/assets/scroll-to-match-baaa6728db7d.js（1.5KB）。
//
// 三个导出（压缩名 → 语义）：
//   - r（waitForTwoFrames）：双 rAF 等待（布局 + 绘制各一帧）
//   - n（scrollToMatch）：在容器内查找 matchId 元素并平滑居中；未命中时
//     rAF 轮询 + 1500ms 超时 + AbortSignal 取消；命中即 scrollIntoView
//     （block: center）
//   - t（懒初始化器）：触发依赖 chunk 的查找器装配（CUt）

/** 双 rAF 等待（原 `r`）。 */
function waitForTwoFrames(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

/** 元素查找面（app-initial 的 xUt/n 语义：按 matchId 查找）。 */
type MatchFinder = (request: { container: ParentNode; matchId: string; includeShadowRoots?: boolean }) => (Element & { scrollIntoView(arg: { block: string; behavior: string }): void }) | null;

// 原版依赖：app-initial 的 CUt（懒初始化器 t()）/xUt（查找器 n）。
// 此处以注入面承接——app-initial 重写完成后替换为真实 import。
import { CUt as initializeMatchFinderDependencies, xUt as findMatchElement } from "@rchunk/app-initial";

const matchFinder: MatchFinder = findMatchElement as MatchFinder;

/** 懒初始化器（原 `t`）：触发 app-initial 的查找器装配（CUt）。 */
function initializeScrollToMatch(): void {
  (initializeMatchFinderDependencies as () => void)?.();
}

/**
 * 滚动到搜索命中（原 `i`/导出 `n`）：
 * 容器内按 matchId 查找（含 shadow root），命中 → scrollIntoView 居中；
 * 未命中 → rAF 轮询直到命中/超时（默认 1500ms）/中止信号。
 */
function scrollToMatch({
  container,
  matchId,
  includeShadowRoots,
  scrollBehavior = "smooth",
  signal,
  timeoutMs = 1500,
}: {
  container: ParentNode;
  matchId: string;
  includeShadowRoots?: boolean;
  scrollBehavior?: ScrollBehavior;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<void> {
  const find = () => matchFinder?.({ container, matchId, includeShadowRoots }) ?? null;
  if (signal?.aborted) return Promise.resolve();
  const immediate = find();
  if (immediate != null) {
    immediate.scrollIntoView({ block: "center", behavior: scrollBehavior });
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    let rafId: number | null = null;
    let timeoutId: ReturnType<typeof window.setTimeout> | null = null;
    const cleanup = () => {
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      signal?.removeEventListener("abort", onAbort);
    };
    const settle = (element?: Element & { scrollIntoView(arg: { block: string; behavior: string }): void }) => {
      cleanup();
      element?.scrollIntoView({ block: "center", behavior: scrollBehavior });
      resolve();
    };
    const onAbort = () => {
      settle();
    };
    const poll = () => {
      if (signal?.aborted) {
        settle();
        return;
      }
      const element = find();
      if (element != null) {
        settle(element);
        return;
      }
      rafId = window.requestAnimationFrame(poll);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    timeoutId = window.setTimeout(() => {
      settle();
    }, timeoutMs);
    rafId = window.requestAnimationFrame(poll);
  });
}

// 原版压缩导出名（chunk 间契约）：n=scrollToMatch r=waitForTwoFrames t=懒初始化器
export { scrollToMatch as n, waitForTwoFrames as r, initializeScrollToMatch as t };
