// 尚未逆向重写的渲染进程 chunk 的类型声明。
//
// 源码里写作 `import ... from "@rchunk/<语义名>"` 的导入由
// scripts/renderer-chunk-manifest.mjs 映射为对输出 chunk
// （app/webview/assets/<文件名>）的 external import。已重写的 chunk 直接声明其
// 命名导出；未重写的 chunk 以发布版的压缩导出名提供（导入时重命名使用），
// 语义由 docs/renderer-app-shared-analysis.md 等分析文档逐步标注。

declare module "@rchunk/rolldown-runtime" {
  export const n: unknown; // 共享运行时的 lazy 辅助（__vite__mapDeps 场景）
  export const o: () => void; // 通用懒初始化包装器
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
  export const $h: () => void; // i8：资源按钮依赖初始化器
  export const $r: () => void; // Rwt：skills-light-16 图标初始化器
  export const $K: string;
  export const Am: {
    kind: "browser";
    loadDetachedRenderer(): Promise<unknown>;
  }; // alt：分离窗口的 browser 内容渲染器
  export const BI: (path: string) => string; // wJe：路径规范化后转小写
  export const BK: (path: string) => boolean; // Rz：是否为绝对路径
  export const BX: any;
  export const Bk: Record<string, string>; // bq：Appgen interaction action 枚举
  export const C_: unknown;
  export const FQ: unknown;
  export const FX: any;
  export const HX: unknown; // Maitai query 订阅 store 工厂（oMe）
  export const I3: unknown; // jsx runtime
  export const IQ: unknown;
  export const JQ: unknown;
  export const K2: unknown;
  export const W2: (descriptor: unknown) => unknown;
  export const LX: unknown;
  export const P3: unknown;
  export const QI: () => void;
  export const S_: unknown; // IconAsset（h3）
  export const Xi: unknown;
  export const Y2: unknown; // FormattedMessage
  export const Yi: unknown;
  export const ZI: any;
  export const __: unknown;
  export const b_: unknown; // React use（ait）
  export const fk: unknown;
  export const g_: unknown;
  export const h4: unknown;
  export const i$: unknown;
  export const iW: (path: string) => string;
  export const lk: unknown;
  export const wL: () => void;
  export const oq: string;
  export const rZ: any;
  export const m4: unknown; // intl message（J）
  export const mZ: any;
  export const n$: unknown;
  export const pZ: any; // createDerivedFamily（kI）
  export const qQ: unknown;
  export const qm: unknown;
  export const r$: unknown;
  export const t$: unknown;
  export const x_: unknown; // useIconScaleContext（_3）
  export const y_: unknown;
  export const G4: unknown;
  export const Gs: unknown; // jbt：pin-window-light-16 IconAsset
  export const H3: () => void; // detachedWindow 入口的 preload helper
  export const RI: () => void; // nG：路径 dirname 依赖初始化器
  export const V3: unknown; // detachedWindow preload 依赖表
  export const VI: (path: string) => string; // QW：路径分隔符规范化
  export const W3: () => void; // detachedWindow 所需 app-shared 初始化器
  export const l3: (left: unknown, right: unknown) => boolean; // Yt：lodash isEqual
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
  export const $en: unknown; // zb：RouteScope atom
  export const bS: Record<string, unknown>; // Bms：侧面板 UI 组件注册表
  export const C: unknown; // XXc：PermissionsModeDropdown 懒加载组件
  export const CS: unknown; // ems：侧面板 List 组件
  export const P0t: <T>(items: readonly T[] | null | undefined, iteratee?: ((item: T) => unknown) | string) => T[]; // zDn：lodash uniqBy
  export const fhn: (left: { connector_id?: unknown; link_id?: unknown; auth_reason?: unknown; connection_consent?: unknown; requested_scopes?: unknown[] }, right: { connector_id?: unknown; link_id?: unknown; auth_reason?: unknown; connection_consent?: unknown; requested_scopes?: unknown[] }) => boolean; // mmt：connector approval 等价判定
  export const gmn: <T>(items: readonly T[] | null | undefined, iteratee: ((item: T) => PropertyKey) | string) => Record<PropertyKey, T[]>; // wm：lodash groupBy
  export const wfn: () => void; // BMt：URL 解析辅助初始化器
  export const BPt: any;
  export const Iht: any;
  export const Rht: any;
  export const kht: any;
  export const zPt: any;
  export const $ln: (key: string) => readonly unknown[];
  export const Qln: (event: string, payload: unknown) => Promise<unknown>;
  export const aun: () => void;
  export const nun: () => void;
  export const oun: (queryClient: unknown, key: unknown) => Promise<unknown>;
  export const q3t: unknown;
  export const s6t: () => void;
  export const $4t: () => void;
  export const Bfn: () => void;
  export const HEt: () => void;
  export const M6t: () => void;
  export const MEt: any;
  export const N6t: () => { isLoading: boolean; userId?: string | null };
  export const X4t: (app: unknown) => unknown;
  export const oDt: () => void;
  export const sDt: (input: { hostId: string }) => boolean;
  // scroll-to-match 依赖：CUt=查找器装配器 xUt=matchId 元素查找器
  export const CUt: unknown;
  export const xUt: unknown;
  export const _any: any;
}

declare module "@rchunk/app-primary" {
  export const Bf: () => void;
  export const Rf: (input: { defaultPrompt: string; pluginDisplayName: string; pluginId: string }) => unknown;
  export const d: () => void; // O9：项目选择器依赖初始化器
  export const n: () => void;
  export const t: unknown;
  export const _any: any;
}

declare module "@rchunk/app-main" {
  export const _any: any;
}

declare module "@rchunk/use-git-submodule-paths" {
  export const _any: any;
}

declare module "@rchunk/git-branch-switcher" {
  export const _any: any;
}

declare module "@rchunk/dock" {
  export const _any: any;
}

declare module "@rchunk/create-dialog" {
  export const _any: any;
}

declare module "@rchunk/use-create-git-repository" {
  export const _any: any;
}

declare module "@rchunk/worktree-environment-dropdown" {
  export const _any: any;
}

declare module "@rchunk/color-icon" {
  export const _any: any;
}

declare module "@rchunk/connector-logo-stack" {
  export const _any: any;
}

declare module "@rchunk/onboarding-mail-provider" {
  export const a: (...args: any[]) => any;
  export const n: (...args: any[]) => any;
  export const o: (...args: any[]) => any;
  export const r: (...args: any[]) => any;
  export const t: (...args: any[]) => any;
  export const _any: any;
}

declare module "@rchunk/external-agent-config-import-flow" {
  export const openExternalAgentImport: (...args: any[]) => Promise<unknown>;
  export const _any: any;
}

declare module "@rchunk/use-imported-setup-opportunity" {
  export const _any: any;
}

declare module "@rchunk/sidebar-onboarding-checklist-task-config" {
  export const _any: any;
}

declare module "@rchunk/ambient-suggestion-apps" {
  export const a: unknown;
  export const i: unknown;
  export const n: unknown;
  export const r: () => void;
  export const t: unknown;
}

declare module "@rchunk/new-chat-suggestion-source-debug-state" {
  export const a: unknown;
  export const c: () => void;
  export const d: unknown;
  export const f: unknown;
  export const i: unknown;
  export const l: unknown;
  export const n: unknown;
  export const o: unknown;
  export const p: unknown;
  export const r: unknown;
  export const s: unknown;
  export const t: () => void;
  export const u: unknown;
}

declare module "@rchunk/home-suggestion-surface" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/composer-banners" { export const ComposerBanners: unknown; }
declare module "@rchunk/usage" { export const n: () => void; export const t: unknown; }
declare module "@rchunk/task-announcement-candidates" { export const TaskAnnouncementCandidates: unknown; }
declare module "@rchunk/popup" { export const i: unknown; export const n: () => void; export const r: unknown; export const t: unknown; }
declare module "@rchunk/browser-address-suggestion-overlay" { export const BrowserAddressSuggestionOverlay: unknown; }
declare module "@rchunk/home-beacon" { export const n: () => void; export const t: unknown; }
declare module "@rchunk/catalog" { export const n: () => void; export const t: unknown; }
declare module "@rchunk/composer-tip" { export const useComposerTip: unknown; }
declare module "@rchunk/codex-micro-mini-games" { export const _any: any; }
declare module "@rchunk/codex-micro-mini-game-composer" { export const CodexMicroMiniGameComposer: unknown; }
declare module "@rchunk/wheel-swipe-gesture" { export const n: () => void; export const t: unknown; }
declare module "@rchunk/right-panel-composer-overlay" { export const n: () => void; export const t: unknown; }

declare module "@rchunk/new-chat-page-suggestions-eligibility" {
  export const a: () => void;
  export const i: unknown;
  export const n: (hostId: string) => readonly string[];
  export const o: unknown;
  export const r: unknown;
  export const t: unknown;
}

declare module "@rchunk/option-carousel" {
  export const _any: any;
}

declare module "@rchunk/recent-uploads" {
  export const _any: any;
}

declare module "@rchunk/chatgpt-image-home" {
  export const _any: any;
}

declare module "@rchunk/image-suggestions-core" {
  export const t: unknown;
}

declare module "@rchunk/browser-skills-state" {
  export const a: any;
  export const b: any;
  export const c: any;
  export const d: any;
  export const f: any;
  export const g: any;
  export const n: any;
  export const s: any;
  export const u: any;
  export const v: any;
  export const y: any;
}

declare module "@rchunk/skill-icon-source" {
  export const n: () => void;
  export const r: unknown;
}

declare module "@rchunk/browser-skills-composer" {
  export const BrowserSkillsComposer: unknown;
}

declare module "@rchunk/use-chatgpt-composer-controller" {
  export const n: unknown;
  export const t: () => void;
}

declare module "@rchunk/primary-composer-at-mention-list" {
  export const PrimaryComposerAtMentionList: unknown;
}

declare module "@rchunk/values" {
  export const n: unknown;
  export const t: unknown;
}

declare module "@rchunk/followup-suggestions" {
  export const SketchHomeSuggestions: unknown;
}

declare module "@rchunk/sketch-composer-state" {
  export const createSketchComposerState: unknown;
}

declare module "@rchunk/composer-project-picker-content" {
  export const ComposerProjectPickerContent: unknown;
}

declare module "@rchunk/composer-work-home-plugins-control" {
  export const ComposerWorkHomePluginsControl: unknown;
}

declare module "@rchunk/composer-provider" {
  export const a: unknown;
  export const i: () => void;
  export const n: () => void;
  export const o: () => void;
  export const r: unknown;
  export const t: unknown;
}

declare module "@rchunk/composer-action-bar-run-location-dropdown" {
  export const ComposerActionBarRunLocationDropdown: unknown;
}

declare module "@rchunk/home-suggestion-list" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/home-composer-announcement-candidates" { export const HomeComposerAnnouncementCandidates: unknown; }
declare module "@rchunk/codex-home-announcements" { export const _any: any; }
declare module "@rchunk/worktree-onboarding-state" { export const _any: any; }
declare module "@rchunk/announcement-entry-points" { export const _any: any; }
declare module "@rchunk/realtime-voice-home-announcement" { export const _any: any; }
declare module "@rchunk/worktree-onboarding-banner-controller" { export const _any: any; }

declare module "@rchunk/thread-scroll-controller-context-value" {
  export const n: () => void;
  export const r: () => unknown;
  export const t: unknown;
}

declare module "@rchunk/composer-browser-skills-state" {
  export const r: any;
  export const t: () => void;
}

declare module "@rchunk/home-task-suggestions-core" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/home-starter-prompts" {
  export const _any: any;
}

declare module "@rchunk/home-composer-mode-toggle-core" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/browser-composer-disclaimer-core" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/sketch-composer-host-core" {
  export const n: unknown;
  export const r: () => void;
  export const t: unknown;
}

declare module "@rchunk/drawing-size-slider" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/sketch" {
  export const l: unknown;
  export const n: (options: unknown) => any;
  export const o: () => void;
  export const t: () => void;
}

declare module "@rchunk/right-panel-composer-overlay-alignment" {
  export const n: unknown;
  export const r: unknown;
  export const t: () => void;
}

declare module "@rchunk/composer-overlay" {
  export const HomeComposerOverlay: unknown;
}

declare module "@rchunk/above-composer-fixed-content-surface" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/first-app-connect-ambient-suggestions" {
  export const n: unknown;
  export const t: () => void;
}

declare module "@rchunk/home-suggestion-staggered-item" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/computer-history-suggestion-prompt" {
  export const n: unknown;
  export const r: () => void;
  export const t: unknown;
}

declare module "@rchunk/computer-history-query" {
  export const a: () => void;
  export const r: unknown;
}

declare module "@rchunk/computer-history-suggestions" {
  export const a: () => void;
  export const i: unknown;
  export const n: unknown;
  export const r: unknown;
  export const t: unknown;
}

declare module "@rchunk/suggestion-card" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/composer-announcement-slot" {
  export const i: () => void;
  export const n: () => void;
  export const r: unknown;
  export const t: unknown;
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
  export const n: () => void;
  export const r: unknown;
}

declare module "@rchunk/thread-virtualizer" {
  export const a: (...args: any[]) => any;
  export const i: (...args: any[]) => any;
  export const n: (...args: any[]) => any;
  export const o: () => void;
  export const r: (...args: any[]) => any;
  export const t: (...args: any[]) => any;
}

declare module "@rchunk/scroll-to-match" {
  export const n: unknown;
  export const r: unknown;
  export const t: () => void;
}

declare module "@rchunk/local-conversation-turn" {
  export const a: unknown;
  export const c: () => void;
  export const i: () => void;
  export const n: () => void;
  export const o: () => void;
  export const r: unknown;
  export const s: unknown;
  export const t: unknown;
}

declare module "@rchunk/local-conversation-thread" {
  export const _: () => void;
  export const a: unknown;
  export const c: () => void;
  export const d: () => void;
  export const f: unknown;
  export const g: unknown;
  export const h: () => void;
  export const i: unknown;
  export const l: unknown;
  export const m: unknown;
  export const n: unknown;
  export const o: unknown;
  export const p: () => void;
  export const r: unknown;
  export const s: () => void;
  export const t: unknown;
  export const u: unknown;
}

declare module "@rchunk/virtualized-turn-list" {
  export const a: unknown;
  export const c: () => void;
  export const d: unknown;
  export const f: () => void;
  export const i: unknown;
  export const l: unknown;
  export const m: () => void;
  export const n: () => void;
  export const o: unknown;
  export const p: unknown;
  export const r: () => void;
  export const s: () => void;
  export const t: unknown;
  export const u: unknown;
}

declare module "@rchunk/detached-entry" {
  export const initializeDetachedWindow: () => Promise<{ [Symbol.dispose](): void }>;
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
  export const n: unknown;
  export const r: (a: unknown, b: unknown) => boolean;
  export const t: (item: unknown) => { grouping?: string; item?: unknown } | null;
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

declare module "@rchunk/assert-never" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/patch-diff-stats" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/presentation" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/result-card" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/tool-activity-disclosure" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/artifact-file-preview-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/automation-delete-confirmation-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/bookmarked-thread-user-message-navigation" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/command-execution-command" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/conversation-source" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/creation-target-query" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/environment-labels" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/git-action-new-branch-field" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-artifacts-signals" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-external-resource-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-git-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-plan-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-side-chat" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-summary-panel-image-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-thread-turn-entries" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-webmcp-tools-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-environment-editor" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-environment-workflow-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/lock" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-picker-chevron-down-sm" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-terminal-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-sources-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-code-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pending-onboarding" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugin-picker-menu-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/publish-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-detail-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-fix-workflow" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-status-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-handoff-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-launch-surface" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-motion" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-stage-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/remote-hosted-pip-anchor-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/result-values" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/runtime" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-keys" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/setup-artwork" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-handoff-modal" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-pin-shortcut-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-scroll-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/timestamp-separator" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/triangle-warning" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-git-config-value" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-local-conversation-sources" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-realtime-voice-native-overlay-transition-enabled" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-resume-conversation-if-needed" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/worktree-setup-auto-fix" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/file-diff" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-writing-block-directive-renderer" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/active-tool-activity-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/book-open" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/computer-use-native-app-metadata" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/diff-preview-tooltip" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/elicitation-events" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/exec-shell-container" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks-settings-route" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-app-analytics" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-activity-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-approval-message" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-item-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/partition" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-summary-item-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/undo" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/artifact-file-preview-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/automation-delete-confirmation-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/bookmarked-thread-user-message-navigation" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/command-execution-command" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/conversation-source" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/creation-target-query" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/environment-labels" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/git-action-new-branch-field" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-artifacts-signals" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-external-resource-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-git-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-plan-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-side-chat" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-summary-panel-image-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-thread-turn-entries" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-webmcp-tools-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-environment-editor" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-environment-workflow-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/lock" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-picker-chevron-down-sm" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-terminal-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-sources-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-code-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pending-onboarding" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugin-picker-menu-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/publish-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-detail-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-fix-workflow" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-status-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-handoff-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-launch-surface" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-motion" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-stage-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/remote-hosted-pip-anchor-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/result-values" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/runtime" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-keys" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/setup-artwork" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-handoff-modal" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-pin-shortcut-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-scroll-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/timestamp-separator" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/triangle-warning" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-git-config-value" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-local-conversation-sources" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-realtime-voice-native-overlay-transition-enabled" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-resume-conversation-if-needed" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/worktree-setup-auto-fix" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/file-diff" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-writing-block-directive-renderer" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/active-tool-activity-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/book-open" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/computer-use-native-app-metadata" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/diff-preview-tooltip" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/elicitation-events" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/exec-shell-container" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks-settings-route" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-app-analytics" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-activity-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-approval-message" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-item-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/partition" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-summary-item-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/undo" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/artifact-file-preview-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/automation-delete-confirmation-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/bookmarked-thread-user-message-navigation" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/command-execution-command" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/conversation-source" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/creation-target-query" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/environment-labels" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/git-action-new-branch-field" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-artifacts-signals" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-external-resource-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-git-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-plan-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-side-chat" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-summary-panel-image-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-thread-turn-entries" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-webmcp-tools-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-environment-editor" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-environment-workflow-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/lock" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-picker-chevron-down-sm" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-terminal-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-sources-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-code-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pending-onboarding" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugin-picker-menu-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/publish-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-detail-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-fix-workflow" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-status-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-handoff-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-launch-surface" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-motion" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-stage-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/remote-hosted-pip-anchor-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/result-values" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/runtime" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-keys" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/setup-artwork" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-handoff-modal" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-pin-shortcut-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-scroll-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/timestamp-separator" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/triangle-warning" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-git-config-value" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-local-conversation-sources" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-realtime-voice-native-overlay-transition-enabled" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-resume-conversation-if-needed" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/worktree-setup-auto-fix" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/file-diff" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-writing-block-directive-renderer" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/active-tool-activity-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/book-open" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/computer-use-native-app-metadata" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/diff-preview-tooltip" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/elicitation-events" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/exec-shell-container" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks-settings-route" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-app-analytics" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-activity-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-approval-message" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-item-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/partition" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-summary-item-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/undo" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/artifact-file-preview-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/automation-delete-confirmation-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/bookmarked-thread-user-message-navigation" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/command-execution-command" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/conversation-source" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/creation-target-query" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/environment-labels" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/git-action-new-branch-field" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-artifacts-signals" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-external-resource-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-git-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-plan-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-side-chat" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-summary-panel-image-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-thread-turn-entries" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-webmcp-tools-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-environment-editor" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-environment-workflow-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/lock" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-picker-chevron-down-sm" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-terminal-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-sources-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-code-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pending-onboarding" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugin-picker-menu-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/publish-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-detail-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-fix-workflow" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-status-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-handoff-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-launch-surface" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-motion" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-stage-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/remote-hosted-pip-anchor-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/result-values" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/runtime" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-keys" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/setup-artwork" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-handoff-modal" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-pin-shortcut-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-scroll-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/timestamp-separator" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/triangle-warning" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-git-config-value" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-local-conversation-sources" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-realtime-voice-native-overlay-transition-enabled" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-resume-conversation-if-needed" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/worktree-setup-auto-fix" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/file-diff" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-writing-block-directive-renderer" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/gitlab-merge-request-form-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chat-tab-metadata-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/content-quick-chat-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/delete-archived-chats-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/document-title" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/latest-turn-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-stream-role-product-event" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-and-reasoning-effort-translations" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-agent" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-subagents-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/right-panel-composer-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-app-shell-chrome" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-emoji" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-overflow-menu" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-panel-toggle-button" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-usage-breakdown" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chat-tab-metadata-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/content-quick-chat-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/delete-archived-chats-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/document-title" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/latest-turn-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-stream-role-product-event" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-and-reasoning-effort-translations" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-agent" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-subagents-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/right-panel-composer-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-app-shell-chrome" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-emoji" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-overflow-menu" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-panel-toggle-button" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-usage-breakdown" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chat-tab-metadata-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/content-quick-chat-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/delete-archived-chats-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/document-title" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/latest-turn-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-stream-role-product-event" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-and-reasoning-effort-translations" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-agent" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-subagents-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/right-panel-composer-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-app-shell-chrome" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-emoji" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-overflow-menu" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-panel-toggle-button" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-usage-breakdown" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chat-tab-metadata-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/content-quick-chat-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/delete-archived-chats-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/document-title" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/latest-turn-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-stream-role-product-event" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-and-reasoning-effort-translations" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-agent" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-subagents-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/right-panel-composer-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-app-shell-chrome" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-emoji" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-overflow-menu" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-panel-toggle-button" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-usage-breakdown" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/theme-font-face-loader" {
  export const r: unknown;
  export const t: unknown;
}

declare module "@rchunk/modulepreload-polyfill" {
  export const t: unknown;
}

declare module "@rchunk/theme-font-family" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chatgpt-accent-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/dock-icon-setting-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/import-settings-gate" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/middle-truncated-text" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/notifications-settings" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/permissions-mode-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugins-settings-row" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/settings-route-state" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chatgpt-accent-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/dock-icon-setting-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/import-settings-gate" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/middle-truncated-text" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/notifications-settings" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/permissions-mode-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugins-settings-row" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/settings-route-state" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chatgpt-accent-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/dock-icon-setting-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/import-settings-gate" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/middle-truncated-text" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/notifications-settings" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/permissions-mode-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugins-settings-row" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/settings-route-state" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chatgpt-accent-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/dock-icon-setting-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/import-settings-gate" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/middle-truncated-text" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/notifications-settings" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/permissions-mode-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugins-settings-row" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/settings-route-state" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/file-diff-alt" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-browser" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-client" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/linked-app-logo" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-shared" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-src" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-tabs" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/confirmation" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/history" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/order-yubikey-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chatgpt-desktop-auth-url" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-mobile-setup-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-mobile-setup-flow" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/onboarding-login-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/remote-connection-editor-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/remote-connection-editor-draft" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-micro-analog-action-title" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-micro-commands" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-micro-keyboard-surface" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-micro-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-micro-slot-signals" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/command-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/keyboard-shortcuts-search-input" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/about-you-summary" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chatgpt-user-context" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chronicle-service-queries" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chronicle-settings" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/memory-manager-gate" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/saved-memories" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/settings-host-dropdown" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/settings-loading-row" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/personalization-state" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/virtual-try-on" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/browser-use-origin-state-queries" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/diff-comment-card" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-readonly-comment" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/review-row" {
  const _default: unknown;
  export default _default;
}
