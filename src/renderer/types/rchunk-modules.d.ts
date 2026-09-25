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
