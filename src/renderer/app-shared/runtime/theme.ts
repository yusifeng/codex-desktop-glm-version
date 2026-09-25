// app-shared：主题运行时（渲染侧订阅与 system 解析）。
//
// 对应 app-shared-7b9edc1bfb7f.js 的两个区段（压缩名 → 语义）：
//   - H6/Yat/Xat/Zat/U6（94025-94060）：data-theme 订阅 hook——
//     useSyncExternalStore + MutationObserver 监听 documentElement 的
//     data-theme 属性；SSR 快照返回 null。生效值由主进程侧（chrome theme
//     切换）写入，渲染侧只订阅。
//   - sonner Toaster 内嵌实现的 theme 解析（56005-56050）：
//     appearanceTheme === 'system' 时跟随 matchMedia('(prefers-color-scheme:
//     dark)')（初始值 + change 监听，含旧版 addListener 回退）。
//
// 与 settings-schema.ts 的 appearanceTheme 设置（schema 50779-50830）配套：
// schema 定义 → 主进程写 data-theme → 渲染侧本模块订阅生效。
// 参考仓库对应物：restored/runtime/theme-appearance-runtime.ts、use-is-dark。

// ---------------------------------------------------------------------------
// data-theme 订阅（原 `H6`/`Yat`/`Xat`/`Zat`）
// ---------------------------------------------------------------------------

/** React 面（结构化子集）。 */
interface ReactLike {
  useSyncExternalStore<T>(subscribe: (onChange: () => void) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T): T;
}

function reactOf(): ReactLike {
  return (globalThis as { __RENDERER_REACT__?: ReactLike }).__RENDERER_REACT__ ?? (require("react") as unknown as ReactLike);
}

/** 当前 data-theme 快照（原 `Yat`）：'dark' → true；无属性 → null。 */
function dataThemeSnapshot(): boolean | null {
  const theme = document.documentElement.dataset.theme;
  return theme == null ? null : theme === "dark";
}

/** SSR 快照（原 `Xat`）。 */
function serverThemeSnapshot(): null {
  return null;
}

/** data-theme 订阅（原 `Zat`）：MutationObserver 只监听该属性。 */
function subscribeDataTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/**
 * 是否深色主题 hook（原 `H6`）：
 * 订阅 documentElement 的 data-theme 属性变化（由主进程 chrome theme 切换
 * 写入），未设置时返回 null。
 */
export function useIsDarkTheme(): boolean | null {
  return reactOf().useSyncExternalStore(subscribeDataTheme, dataThemeSnapshot, serverThemeSnapshot);
}

/** 当前深色状态（非 hook 形态，供非 React 消费方）。 */
export function currentIsDarkTheme(): boolean | null {
  return dataThemeSnapshot();
}

// ---------------------------------------------------------------------------
// system 主题解析（原 sonner Toaster 的 theme 逻辑，56005-56050）
// ---------------------------------------------------------------------------

/** 解析后的生效主题。 */
export type EffectiveTheme = "light" | "dark";

/**
 * appearanceTheme → 生效主题解析（原 Toaster 的初始解析）：
 * 'system' 时读 matchMedia 当前值；非 window 环境回退 'light'。
 */
export function resolveEffectiveTheme(appearanceTheme: "system" | "light" | "dark"): EffectiveTheme {
  if (appearanceTheme !== "system") return appearanceTheme;
  return typeof window < "u" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * 订阅 system 主题变化（原 Toaster 的 change 监听）：
 * 仅 appearanceTheme === 'system' 时生效；返回退订函数。
 * 旧版 matchMedia 无 addEventListener 时回退 addListener。
 */
export function subscribeSystemThemeChange(
  appearanceTheme: "system" | "light" | "dark",
  onChange: (theme: EffectiveTheme) => void,
): () => void {
  if (appearanceTheme !== "system") return () => {};
  if (typeof window > "u") return () => {};
  if (appearanceTheme === "system") {
    onChange(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  try {
    const listener = ({ matches }: MediaQueryListEvent) => {
      onChange(matches ? "dark" : "light");
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  } catch {
    const listener = ({ matches }: MediaQueryListEvent) => {
      try {
        onChange(matches ? "dark" : "light");
      } catch {}
    };
    media.addListener(listener);
    return () => media.removeListener(listener);
  }
}
