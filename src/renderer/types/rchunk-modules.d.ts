// 尚未逆向重写的渲染进程 chunk 的类型声明。
//
// 源码里写作 `import ... from "@rchunk/<语义名>"` 的导入由
// scripts/renderer-chunk-manifest.mjs 映射为对输出 chunk
// （app/webview/assets/<文件名>）的 external import。已重写的 chunk 直接声明其
// 命名导出；未重写的 chunk 以发布版的压缩导出名提供（导入时重命名使用），
// 语义由 docs/renderer-app-shared-analysis.md 等分析文档逐步标注。

declare module "@rchunk/rolldown-runtime" {
  export const n: unknown; // 共享运行时的 lazy 辅助（__vite__mapDeps 场景）
}

declare module "@rchunk/app-shared" {
  // React 兼容导出（e6 = react 模块命名空间，含 createContext/use 等）。
  export const e6: {
    createContext<T>(defaultValue: T): { Provider: unknown; Consumer: unknown };
    use<T>(context: unknown): T;
    [key: string]: unknown;
  };
  // virtualized-turn-list 消费的压缩导出面（语义见该模块头注释）：
  export const $3: unknown; // rolldown lazy 辅助
  export const BX: unknown;
  export const C_: unknown;
  export const FQ: unknown;
  export const FX: unknown;
  export const HX: unknown; // Maitai query 订阅 store 工厂（oMe）
  export const I3: unknown; // jsx runtime
  export const IQ: unknown;
  export const JQ: unknown;
  export const K2: unknown;
  export const LX: unknown;
  export const P3: unknown;
  export const QI: unknown;
  export const S_: unknown; // IconAsset（h3）
  export const Xi: unknown;
  export const Y2: unknown; // FormattedMessage
  export const Yi: unknown;
  export const ZI: unknown;
  export const __: unknown;
  export const b_: unknown; // React use（ait）
  export const fk: unknown;
  export const g_: unknown;
  export const h4: unknown;
  export const i$: unknown;
  export const lk: unknown;
  export const m4: unknown; // intl message（J）
  export const n$: unknown;
  export const pZ: unknown; // createDerivedFamily（kI）
  export const qQ: unknown;
  export const qm: unknown;
  export const r$: unknown;
  export const rZ: unknown; // createSignalFamily（Sje）
  export const t$: unknown;
  export const x_: unknown; // useIconScaleContext（_3）
  export const y_: unknown;
  export const zI: unknown;
  // 5.1MB 应用核心：RPC 桥、状态/信号、路由、主题、i18n、UI 基础件。
  // 导出面（数千个压缩名）待 renderer-app-shared-analysis.md 完成后语义化。
  // 目前以 any 占位，重写完成后本声明会移除（源码直接导出真类型）。
  export const _any: any;
}

declare module "@rchunk/app-initial" {
  // 15MB 聚合块：应用启动逻辑 + Shiki 语法 grammars + math/learning blocks。
  // rpc chunk 转发的四个符号（fnt/hnt/mnt/pnt 的压缩导出名）：
  export const fnt: unknown; // appHost：服务容器宿主
  export const hnt: () => Promise<void>; // initializeAppHostServices
  export const mnt: () => void; // 懒初始化器（遥测/基础设施装配）
  export const pnt: unknown; // appServices：已解析的服务集合
  // scroll-to-match 依赖：CUt=查找器装配器 xUt=matchId 元素查找器
  export const CUt: unknown;
  export const xUt: unknown;
  export const _any: any;
}

declare module "@rchunk/app-primary" {
  export const _any: any;
}

declare module "@rchunk/app-main" {
  export const _any: any;
}

declare module "@rchunk/rpc" {
  export const _any: any;
}

declare module "@rchunk/split-items-into-render-groups" {
  export const n: unknown;
  export const t: unknown;
}

declare module "@rchunk/agent-activity-units" {
  export const S: unknown;
  export const c: unknown;
  export const d: unknown;
  export const f: unknown;
  export const l: unknown;
  export const r: unknown;
}

declare module "@rchunk/index-entry" {
  export const _any: any;
}

// npm 依赖（react 等）：发布包内无 node_modules，实际符号由共享 chunk 提供。
// 重写模块应经 @rchunk/app-shared 引用；此处仅为 tsc 提供最小 React 类型面，
// 待工程接入真实 @types/react 后移除。
declare module "react" {
  export = React;
  namespace React {
    export type ReactNode = any;
    export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
    export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
    export function useMemo<T>(factory: () => T, deps?: unknown[]): T;
    export function useRef<T>(initial: T): { current: T };
    export function useCallback<T extends (...args: any[]) => any>(fn: T, deps?: unknown[]): T;
    export function createContext<T>(defaultValue: T): { Provider: any; Consumer: any; displayName?: string };
    export function useContext<T>(context: { Provider: any; Consumer: any }): T;
    export const Suspense: any;
    export const Fragment: any;
    export function createElement(...args: any[]): any;
    export const version: string;
  }
}

declare module "@rchunk/above-composer-fixed-content-surface" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/agent-activity-item" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/appgen-access" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/appgen-access-state-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/appgen-automations-state" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/artifact-feedback-button" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/artifact-originating-turn" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/conversation-blocks" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/diff-summary" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/generated-image-output-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/google-chrome" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/google-drive-resource-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-appgen-share-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-automation-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-in-button" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-in-google-drive-menu-item" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/skill-exploration-labels" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/turn-preview-body-items" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-app-connect-flow" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-target-apps" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/user-message" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/workspace-file-context-menu-trigger" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks-settings-copy" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks-settings-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-implementation-request" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/timestamps" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/Icon" {
  const _default: unknown;
  export default _default;
}
