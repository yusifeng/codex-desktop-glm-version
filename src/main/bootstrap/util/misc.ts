// 杂项小工具：migration 公告键、identity、trailing-edge debounce、libfile 名校验。
// 对应 bootstrap-C4dRql4x.ts 51-78 行（ne/re/ie/ae/se）。

/** 旧版 ChatGPT.app 迁移公告「已完成」的 global-state 键（原 ne）。 */
export const MIGRATION_ANNOUNCEMENT_KEY = "chatgpt-migration-announcement-completed-v1";

/** detached-window 渲染路由（原 se；deep link 与渲染入口选择使用）。 */
export const DETACHED_WINDOW_ROUTE = "/detached-window";

/** 原样返回入参（原 re）。 */
export function identity<T>(value: T): T {
  return value;
}

export interface DebouncedFunction<A extends unknown[]> {
  (...args: A): void;
  /** 取消尚未触发的调用并丢弃暂存的参数。 */
  cancel(): void;
}

/**
 * trailing-edge debounce（原 ie）：每次调用重置计时器，delayMs 后用最后一次
 * 调用的参数执行 fn；期间可通过 cancel() 取消。
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
): DebouncedFunction<A> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: A | null = null;
  const debounced = (...args: A) => {
    pendingArgs = args;
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      const args = pendingArgs;
      pendingArgs = null;
      if (args != null) fn(...args);
    }, delayMs);
  };
  debounced.cancel = () => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
    pendingArgs = null;
  };
  return debounced;
}

/** 是否为合法的 `libfile[-_]xxx` 库文件名（deep link 库文件用，原 ae）。 */
export function isLibfileName(name: string): boolean {
  return /^libfile[-_][A-Za-z0-9_-]+$/.exec(name)?.[0] === name;
}
