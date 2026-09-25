# app-shared-7b9edc1bfb7f.js 深度分析报告（渲染进程核心 chunk）

> 分析对象：`/Users/david/Workspace/ppio_github/chatgpt-desktop-src/app/webview/assets/app-shared-7b9edc1bfb7f.js`
> 5,074,126 字节 / 116,314 行 / rolldown 打包 ES module（React Compiler 输出，`.c(N)` memo cache 到处可见）
> 分析方式：全只读。全部结论来自 grep/awk/python 区段扫描 + 关键区段精读，并与参考仓库 `/tmp/codex-refs/decode-codex/restored/` 及主进程重写 `src/main/preload/electron-bridge.ts` 交叉验证。
> 报告日期：2026-09-25

---

## 1. 导出面统计

文件末尾从 **第 113,127 行** 到文件尾是唯一的 `export { ... }` 语句。

| 指标 | 值 |
|---|---|
| 导出总数 | **3,185** |
| 重复导出别名 | 0 |
| `Letter+digit` 形态（H3/V3/W3 风格） | 130 |
| `lowercase+digit`（a0/b1 风格） | 131 |
| `_` 前缀（_0/_A 风格） | 56 |
| `Letter+$`（a$/b$ 风格） | 52 |
| 其余短别名（1–3 字符） | 2,702 |
| 其他 | 114 |

外部消费方式（例，`index-e0f46c018fe4.js`）：
```js
import { H3 as n, V3 as r, W3 as i } from "./app-shared-7b9edc1bfb7f.js"
```

### 1.1 关键导出别名的语义（已逐一回溯到定义）

| 导出别名 | 局部名 | 定义行 | 语义 |
|---|---|---|---|
| `W3` | `z` | 553 | **VS Code / Electron 消息桥单例初始化**（`VscodeHostMessageBridge.getInstance()`，见 §3.1）——被 index chunk 引入做 bootstrap，属最高频导出之一 |
| `H3` | `ce` | 630 | Vite modulepreload helper 初始化（`ie='modulepreload'`，CSP nonce 处理） |
| `V3` | `se` | 630 区 | modulepreload 依赖数组函数（`__vite__mapDeps` 配套） |
| `I3` | `B` | — | （未逐一确认，位于 bootstrap 群） |
| `N3` | `Se` | — | react-dom client 导出群（`createRoot` 区，8788） |
| `e6` | `o` | — | rolldown-runtime 再导出（hooks 命名空间） |
| `Dt` | `uDt` | 111,942 | **图标资产** `sites-light-32`（说明大量 `Letter+digit` 导出其实是 icon 定义） |
| `Et` | `fDt` | 111,968 | **图标资产** `circle-info-light-12` |

要点：导出面中 **约 600+ 个是图标资产**（`name: \`...\`` 共 676 处、`ink: {` 635 处），几百个是 vendor 库再导出，真正业务语义的导出集中在 runtime/settings/routes/主题几大区。

---

## 2. 区段地图（行范围 + 证据）

### 2.1 总览表

| 行范围 | 区段 | 标志性证据 |
|---|---|---|
| 1–18 | chunk 头：`__vite__mapDeps` + 14 个 import | `./core-cd4391224cfa.js`、`./rolldown-runtime-2d059c5e81f4.js`、`./page-268e2fb6d880.js`、`./options-menu-view-*`、`./cookies-*`、`./profile-*` 等 |
| 20–830 | **React 19 core** | `Symbol.for(\`react.transitional.element\`)`（20）、`Component/PureComponent`（`isPureReactComponent`）、`__COMPILER_RUNTIME`（210）、hooks 群（312–408，`useSyncExternalStore`） |
| **470–640** | **RPC/消息桥（VS Code 风格）** | `window.electronBridge`（480）、`sendMessageFromView`（481）、`codex-message-from-view`（490）、`codex-host-chunked-message-v1`（328/531）、`VscodeHostMessageBridge` 类（553–640） |
| 648–778 | Vite modulepreload helper | `modulepreload`、`vite:preloadError`、CSP nonce |
| 680–778 | 键盘事件规范化 | keyCode→key 映射表（`8:Backspace`…）、`getEventKey` |
| 770–1234 | jsx runtime + react 共享内部 | `react.transitional.element`（770/1234） |
| 813–8668 | scheduler + react-dom | `unstable_scheduleCallback`（906–8668）、Fiber（6602–6639） |
| 8788–9460 | **react-dom client** | `createRoot`（8788）、`__REACT_DEVTOOLS_GLOBAL_HOOK__`（8780）、`checkDCE`（8795） |
| 9461–18942 | **zod v4 全量** | `ZodEncodeError`（9500）、`$ZodTransform`（11566）、JSON Schema 生成（17054）、`ZodTransform`（17705）、pipe（18099） |
| 18942–19445 | Intl DateTimeFormat skeleton 解析 | `` `Y/u/U/r` (year) patterns are not supported ``（19390 区） |
| 20490–21848 | **formatjs / react-intl 核心** | `[formatjs Error: ...]`（20490）、`@formatjs/intl-pluralrules`（20593）、`IntlMessageFormat.__parse`（20696）、`[@formatjs/intl Error ...]`（20761）、`eslint-plugin-formatjs`（20979）、`@formatjs/intl-displaynames`（21115）、`@formatjs/intl-listformat`（21149） |
| 21355–21400 | react-is | `AsyncMode/ConcurrentMode/ForwardRef`（21397） |
| 21848–27100 | **radix primitives 群** | `data-state`（25 处）、`asChild`/Slot（21450 区）、`data-radix-focus-guard`、focus-visible（22057–22241） |
| 2268–2435 | 热键工具 | `keydown`、keyCode 表 |
| 23231–23800 | framer-motion | `motion`、`useSpring`、AnimatePresence（24351 区） |
| 24946 | ResizeObserver singleton | `new ResizeObserver(jle)` |
| 27156–28500 | **floating-ui + popper** | `useFloating`（27156）、`computePosition`、flip/shift/offset（27192–27343）、popper（27917–28345） |
| 27633 | IntersectionObserver | `new IntersectionObserver` |
| 27182–113,118（交错） | **图标资产大区**（635 个 icon 定义） | `name: \`arrow...\``（27182 起）、`ink: { x: … }`（28573 起，至 113,118 `wine-and-cloche-light-16`） |
| 28995–31000 | a11y 工具 | `aria-hidden`（45 处）、focus 管理 |
| 32000–39600 | **prosemirror**（model/state/transform） | `Mark.fromJSON`（33490 区）、`RangeError(\`Invalid input for Mark.fromJSON\`)`、`ResolvedPos`（35995 区）、`NodeSelection`、`Transform` |
| **39600–42600** | **自研 atom/signal 运行时（"Maitai"）+ TanStack Query core** | `Error(\`no atom init\`)`、`atom not writable`（40042 区）、`createAtomReadTracker`（40499）、`Cannot start a nested Maitai signal transaction`（40542）、`maitai.withQueryReadOptions` 等 5 个 Symbol（42403）、`Missing query client`（42300 区）、`queryHash`（42302） |
| 42600–44500 | query 续 + codex 协议 | `content_type: \`text\``（44267 区）、thread/conversation 语义 |
| 44500–46300 | **杂项 runtime 常量 + CSS-in-JS + 桥消息类型** | `vscode-capn-rpc-message`/`vscode-capn-rpc-connect`（45516）、`codex-renderer-window:` windowId（45490）、`inbox-items-changed`（45574）、`.element-metadata-tooltip` CSS（45440–45470）、sentry（45805）、**hostStorage 键表**（45840–45900，见 §3.2）、`persist:codex-browser-app` 等 zustand persist 键（46239）、`/settings/browser-use/*` 路由（46239） |
| 46300–48400 | browser/PDF/PR 业务常量 | `chrome://settings/*`、`persist:codex-*` |
| **48338–48400** | **settings 定义 helper** | `DV`（hostStorage kind:`configuration`）、`OV`（`global-state`）、`kV`（`persisted-atom`） |
| **48400–52500** | **settings schema 大区**（zod=83/74、`agentAccess: read-write` 137 处） | `appearanceTheme`（50779）、`appearanceLightChromeTheme`（50787）、`appearanceDiffMarkerStyle`（50815）、git 设置键（`git-pull-request-merge-method` 等）、`sansFontSize`/`codeFontSize`（50820 区） |
| **50230–50520** | **路由表 + deep-link 解析** | `clientThreadId` zod schema（50239–50247）、`client-new-thread:` 前缀（45574 区定义，50247 使用）、`codex://` skills/plugins/mcp-app 解析（50270–50420）、**路由常量表**（50434–50442，见 §3.3） |
| 52001–54000 | hooks + query + zod 混合 | `stub`（52500 区）、thread/browser panel tabs |
| 54001–56220 | **sonner toast + analytics** | `sonner`（55582–56216）、`logEvent/trackEvent`（55519）、`Notifications` aria label（56000） |
| **56011–56045** | **system 主题解析**（sonner Toaster 内） | `matchMedia(\`(prefers-color-scheme: dark)\`)`、`system → dark/light` |
| 56302 | sentry | `[Ss]entry` |
| 58000–88800 | 图标资产（`ink: {}` 密集区） | 大量 `center/anchors/optical` 结构 |
| 88800–90280 | react-compiler 组件（memo=20） | `onBlur`、SVG path 组件 |
| **90282–93081** | **mime-db 全表** | `"application/3gpdash-qoe-report+xml"`（90282）至 `"x-shader/x-vertex"`（93081） |
| **94030–94060** | **data-theme 订阅 hook** | `MutationObserver` 监听 `document.documentElement` 的 `data-theme` 属性，`useSyncExternalStore` 返回 `theme === 'dark'`（§3.4） |
| 94040–98400 | icons + browser tool 组件 | `browser tool=12`、`menuTitle: \`Previous Chat\``（98000 区） |
| **98400–104500** | **UI 组件群**（hooks=82、radix=10） | tabs（98356）、**`window.electronBridge?.showContextMenu`**（100364/100451）、code block 组件（`data-markdown-copy`、`"data-theme": O10` 101400）、sticky action bar |
| 104500–113,118 | 图标资产续 | `capabilities: [\`icon\`]`（108000）、`sites-light-32`（111942）、`paw-light-16`（113041） |
| 113,127–116,313 | export 语句（3,185 个导出） | `export { … as H3, … }` |

### 2.2 值得注意的"不在场证明"

- **react-router 本体不在本 chunk**：`MemoryRouter/useNavigate/matchRoutes` 全部 0 命中，位于 `app-initial-51da50e6c6e3.js`（15MB，25251–25442 行，`REACT_ROUTER_ERROR`、`DataRouter` 等 context）。app-shared 只含**路由表/URL 解析/RouteLocation 语义**。
- **jotai/zustand/immer 本体不在场**：`zustand` 仅 2 处命中且为误报性质；持久化走自研 persisted-atom + zustand `persist:` localStorage 键（见 §3.2）。参考仓库中 jotai-runtime 是老版本形态，当前版本已演进为内嵌 Maitai。
- **shiki/katex/mermaid/xterm 不在场**：`shiki` 3 处命中均为主题名字符串，本体在其他 chunk。

---

## 3. 四大重点机制

### 3.1 RPC 桥（renderer ↔ main）

**架构：VS Code webview 风格的消息桥，而非传统 IPC invoke RPC。** 所有 renderer→main 通信都是"发消息"，请求/响应语义由上层（query 体系）在消息类型上实现。

#### 出站（view → host）
`D()`（行 477–496）构造 `E`（即参考仓库的 `vscodeApiF`）：
```js
postMessage: (e10) => {
  let n10 = window.electronBridge;
  if (n10?.sendMessageFromView) {
    n10.sendMessageFromView(r11).catch(...)   // ① Electron preload 注入的 IPC 通道
    t10 = true;
  }
  let r10 = new CustomEvent(`codex-message-from-view`, { detail: e10 });  // ② 同窗口 CustomEvent（供同页 host 模拟层/测试用）
  t10 && (r10.__codexForwardedViaBridge = true);  // 防双发标记
  window.dispatchEvent(r10);
}
```

#### 入站（host → view）
- `window.addEventListener("message", …)` → `O()`（行 502）做来源校验 + **分块消息重组**：
  - 分块协议 marker：`codex-host-chunked-message-v1`，字段 `transferId`/`sequence`/`kind: chunk|start|end`/`tokens[]`（行 328 的校验函数）。
  - 每收到一块调用 `window.electronBridge?.acknowledgeChunkedMessage?.(transferId, sequence)` 回执（行 512）。
- `VscodeHostMessageBridge`（class `R`，行 553–640，单例 `getInstance()`）：
  - `handlers: Map<type, Set<handler>>`；`subscribe(type, handler)` 返回退订函数。
  - **缓冲消息机制**：`mcp-request-delivery`、`mcp-response`、`personal-workspace-access-blocked` 三类消息在无订阅者时先入 `bufferedMessages`，订阅时回放（行 565 的 `L = new Set([...])`）。
  - `dispatchMessage(type, payload)` = 出站 postMessage；`dispatchHostMessage(msg)` = 入站分发。
- React 绑定：`ee()`（行 545，即参考仓库 `useElectronMessageHandler`）——`useEffectEvent` 包装 handler，`useEffect` 内 `bridge.subscribe(type, stableHandler)`。

#### RPC 方法面（消息类型枚举，已 grep 验证）
| 类型 | 行 | 用途 |
|---|---|---|
| `log-message` | 483 | 日志上报（桥发送失败时静默） |
| `mcp-request-delivery` / `mcp-response` | 565 | MCP 请求投递/响应（缓冲） |
| `personal-workspace-access-blocked` | 565 | 工作区访问拦截通知（缓冲） |
| `vscode-capn-rpc-message` / `vscode-capn-rpc-connect` | 45516 | capn RPC 会话通道（带 `sessionId`） |
| `codex-message-from-view` | 490 | 同窗口转发 CustomEvent |
| `codex-host-chunked-message-v1` | 328/531 | host→view 分块传输协议 |
| `browser-sidebar-web-contents-pointer-down` | 99291 | browser sidebar 指针事件 |
| `inbox-items-changed` | 45574 | inbox 变更通知 |
| `persisted-atom-state` | 45878 | persisted atom 状态同步（见 §3.2） |
| `showContextMenu`（bridge 方法） | 100364/100451 | 原生右键菜单（`window.electronBridge?.showContextMenu?.(template)`） |
| `codex-renderer-window:browserCommentPopup:<convId\0tabId>:<sessionId>` | 45484 | 弹窗 window 寻址 |

**交叉验证（高可信）**：`/Users/david/Workspace/ppio_github/codex-desktop-glm-version/src/main/preload/electron-bridge.ts` 中逐一存在 `sendMessageFromView(message: {type: string; …}): Promise<void>`（34 行）、`acknowledgeChunkedMessage(transferId, sequence)`（32 行）、`showContextMenu(options)`（40 行，走 `ipcRenderer.invoke(SHOW_CONTEXT_MENU, …)` 122 行）。渲染侧桥 API 与 preload 完全对齐。

**query 层**：TanStack Query core 内嵌（行 42300 区，`QueryClient` class、`queryHash`、`defaultQueryOptions`、`Missing queryFn: '${queryHash}'`）。queryFn 不在本 chunk 定义，由各功能 chunk 提供（`queryFn` 在全 assets 目录的 `options-menu-view`、`security-settings` 等 chunk 中出现）。Maitai 通过 `maitai.withQueryReadOptions` Symbol 与 query 结果做 atom 化集成（§3.2）。

### 3.2 状态管理

**核心：自研 signal/atom 库，内部代号 "Maitai"**（行 39600–42600），jotai 风格 API + scope（scoped atom/family）+ 与 TanStack Query 的深度集成。

证据链：
- `Error(\`Cannot start a nested Maitai signal transaction\`)`（40542）
- `Symbol(\`maitai.withQueryReadOptions\`)`、`maitai.evictFamilyMemberInternal`、`maitai.resolveFamilyMemberInternal`、`maitai.familyDisposalInternal`、`maitai.disposeFamilyValueInternal`（42403）
- atom 原语：`GN`（39628）、`KN`（39892）= atom 构造（`atom not writable`/`no atom init` 错误）
- `EP`（40492）= atom read tracker 门面：`createAtomReadTracker / createSnapshot / createSubscriberAtom / markDerivedAtom / recordDerivedQueryResult / withCurrentRead`
- 事务（40540 `Pke`）：`record/get/set/undo/redo/isReplaying`，异常时逆序回滚——完整的事务语义
- scope 体系（参考仓库 `boundaries/app-scope` + `runtime/scope-signal-runtime.tsx` 对应）：`appScopeRoot`、`createScopedScope('ThreadScope', {key, parent, retain:{max:20}})`、`createScopedAtom/createDerivedScopedAtom/createScopedResolver`

**持久化（三层）**：
1. **persisted-atom**（自研）：settings 定义 helper `kV` → `hostStorage: {kind: 'persisted-atom', key}`（48365）；状态经消息 `persisted-atom-state`（45878）与 host 同步。hostStorage 键表（45840–45900）含 ~60 个键：`selected-project`、`pinned-thread-ids`、`sidebar-thread-metadata`、`project-appearances`、`remote-projects`、`worktree-keep-count`、`dock-icon-preference`、`reduced-motion-preference` 等。
2. **configuration / global-state**：`DV`（kind:`configuration`）/`OV`（kind:`global-state`）——写往主进程设置存储。
3. **zustand persist（localStorage）**：`persist:codex-browser-app`、`persist:codex-contact-info-settings`、`persist:codex-password-manager-settings`、`persist:codex-site-settings`、`persist:codex-browser-app-route:`（46239/46565）——browser-use 内嵌浏览器的本地持久化。

**API 形态**（结合参考仓库 `runtime/signal-state-runtime.ts` + `persisted-signal/signals.ts`）：
```ts
createAtom(initial) / useAtom(atom)            // jotai 风格
createScopedAtom(scope, init, {onMount})       // scope 键控 atom（ThreadScope/RouteScope）
createDerivedScopedAtom(scope, fn)
createPersistedAtomSignal(storageKeyForScopeKey, defaultValue)  // onMount 时双向同步 storage
signal(value) / effect / batch                 // preact/signals 风格原语（39742 区）
```

### 3.3 路由

**react-router 本体在 `app-initial-51da50e6c6e3.js`**（MemoryRouter + 全部 hooks）。app-shared 内是**路由常量表 + URL/deep-link 解析 + RouteLocation 语义**：

路由表（行 50434–50442，`KH()` 初始化器）：
```
/hotkey-window                       /hotkey-window/new-thread
/hotkey-window/thread/:conversationId
/hotkey-window/remote/:taskId
/debug          /global-dictation
/chatgpt/quick-chat  /chatgpt/quick-chat-prewarm  /chatgpt/quick-chat/:conversationId
/share/:sharedConversationId  /share/e/:sharedConversationId
/skills/plugins  /skills/manage/plugins/:pluginId
/plugins/:pluginId
/mcp-app/:server/:toolName  /mcp-app/plugins/:pluginId/:toolName
/settings/plugins/:server/:toolName
/local/:conversationId  /ca/:conversationId
/remote/:taskId
```

配套机制：
- **deep-link 解析**（50270–50420）：`codex:` / `codex-dev:` 协议，hostname `skills`/`plugins`/`mcp-app`/`settings`，query 参数 `marketplacePath`/`remoteMarketplaceName`/`pluginName`/`mode`/`hostId`；plugin id 正则 `plugins_[0-9a-f]{32}` / `Plugin_…` / `plugin_name@scope`。
- **thread id 语义**：`client-new-thread:` 前缀 = 客户端草稿线程（50247 `yFe` 校验）；zod schema `oGe`（50434 区）：`conversationId`(UUID)、`diffFilter: branch|last-turn`、`view: review`、`reviewPath`——即 `/codex://threads/<uuid>?view=review&path=…` 的 review 深链。
- **RouteLocation**（参考仓库 `runtime/persisted-signal/routes.ts` 逐字对应）：`routeKind: home | new-thread-panel | local-thread | remote-thread | chatgpt-thread | other`，`parseRouteLocation({pathname, routeTemplate, search})`，projectContext 从 `?projectId&hostId` 解析。MemoryRouter 接入点在 app-initial 的 `AppRouterProvider`（参考仓库 `app-shell/app-router-provider.tsx`：`<MemoryRouter unstable_useTransitions={false}>`）。

### 3.4 主题

三层结构：

1. **设置 schema**（50779–50830，`DV` 定义，写主进程 configuration）：
   - `appearanceTheme`: `system|light|dark`（default `system`）
   - `appearanceLightChromeTheme` / `appearanceDarkChromeTheme`（chrome 主题预设）
   - `appearanceLightCodeThemeId` / `appearanceDarkCodeThemeId`（default `CODEX`）
   - `appearanceDiffMarkerStyle`: `color|symbols`
   - `sansFontSize` 11–16（default 14）、`codeFontSize` 8–24（default 12）
   - 全部带 `agentAccess: 'read-write'` + `description`（可被 agent 读写）
2. **生效检测**：`H6()`（94030–94060）——`useSyncExternalStore` + `MutationObserver` 监听 `document.documentElement` 的 **`data-theme` 属性**，返回 `theme === 'dark'`。即"谁写 data-theme"在 host/主进程侧（chrome theme 切换），渲染侧只订阅。
3. **system 解析**（56011–56045，sonner Toaster 内联实现，与参考仓库 `use-is-dark` 同构）：`matchMedia('(prefers-color-scheme: dark)')`，`appearanceTheme === 'system'` 时跟随系统并监听 change 事件。
4. 补充：`project-appearances`（45850，按项目覆盖外观）；titlebar 染色 `--codex-titlebar-tint` CSS 变量（参考仓库 `theme-appearance-runtime.ts`）；chrome 主题预设清单见参考仓库 `themes/`（absolutely/linear/notion/sentry/vercel/matrix/temple/lobster/proof 各 dark/light 变体）。

---

## 4. 与参考仓库 /tmp/codex-refs/decode-codex/restored/ 的对照

`IMPORT_MAP.json`（2,669 个 chunk 条目）中**没有**当前 hash `7b9edc1bfb7f` 的条目——参考仓库对应的是老一代 bundle（`app-initial~app-main~…-ClqKjb2h.js` 等），但**机制层完全一致**，且大量字符串逐字匹配，可信度高。

| 参考仓库路径 | 对应 app-shared 区段 | 匹配证据 | 可信度 |
|---|---|---|---|
| `boundaries/vscode-api.ts`（414 行） | 470–640 消息桥 + query/mutation facade | `dispatchMessage(type, payload)` → `postMessage({type, …})` 形态一致；`VscodeHostMessageBridge` 类名/单例/subscribe 完全同构 | 高 |
| `runtime/vscode-message-runtime.ts`、`runtime/electron-bridge-dispatch.ts`、`runtime/use-electron-message-handler.ts` | 同上 | `useEffectEvent` 包装 + `[bridge, messageType, …extraDeps]` 依赖数组逐字对应 | 高 |
| `runtime/persisted-signal/`（routes/signals/route-ids/browser-tabs/types） | 50230–50520 路由区 + Maitai 区 | 路由模板 `/local/:conversationId`、`/hotkey-window/thread/:conversationId`、`/remote/:taskId` 逐字匹配；`client-new-thread:` 前缀、ThreadScope/RouteScope、`retain max:20` | 高 |
| `utils/persisted-atom.ts` + `utils/persisted-atom-store.tsx` + `runtime/persisted-state-provider.tsx` | 48338–48400（DV/OV/kV）+ 45840–45900 键表 | `hostStorage: {kind: 'persisted-atom', key}`（48365）与 `kV` helper 输出逐字一致 | 高 |
| `runtime/theme-appearance-runtime.ts` / `theme-preference-runtime.ts` | 50770–50830 + 56000 区 + 94030 区 | `useIsDarkMode`/`resolveColorScheme`/`--codex-titlebar-tint`；设置键 `theme`/appearanceTheme | 高 |
| `runtime/rpc-query-runtime.ts` + `boundaries/rpc.facade.ts` | query 层（42300 区）+ windowId 寻址（45482） | `defineRpcQuery/useRpcQuery`、`dispatchWindowRpcAction`、`currentWindowId='current'` | 中高（facade 是占位实现） |
| `runtime/shared-object-host-runtime/` | hostStorage 键表（45840） | `remote-projects`、`codex-managed-remote-connections`、`selected-remote-host-id` 等键逐字匹配 | 高 |
| `vendor/jotai-runtime.tsx` | Maitai 区（39600–42600） | API 形态一致，但当前版本已内嵌演进（错误信息从 jotai 风格变为 maitai 命名）——**老版本是 jotai facade，新版本是真实实现** | 中 |
| `vendor/react-router.ts` | **不对应**（本体在 app-initial chunk） | — | — |
| `vendor/react-intl.tsx` | 18942–21848 | formatjs 错误字符串逐字 | 高 |
| `app-shell/app-router-provider.tsx` | MemoryRouter 接入（在 app-initial） | `unstable_useTransitions: false` | 高 |
| `settings/`（appearance-settings.tsx 等） | 48400–52500 settings schema | `agentAccess`/`description`/`key`/`schema` 字段结构一致 | 高 |
| `themes/`（13 个预设） | chrome theme schema（TV） | 预设名与 `appearanceLight/DarkChromeTheme` 对应 | 中高 |

**结论**：参考仓库的 `runtime/`、`boundaries/vscode-api.ts`、`persisted-signal/`、`settings/`、`themes/` 就是 app-shared 的老版本语义化还原，可作为还原命名与文件组织的**首选蓝本**；差异点主要是（a）状态库从 jotai facade 演进为内嵌 Maitai 实现，（b）react-router 移到了 app-initial chunk。

---

## 5. 建议拆分方案（src/renderer/）

按区段边界拆为以下语义模块（行段 → 目标文件）：

```
src/renderer/
├── vendor/                          # 第三方，可直接用 npm 包替代，无需手写还原
│   ├── react/                       # 20–9460（react、react-dom、scheduler）→ npm react@19
│   ├── zod/                         # 9461–18942 → npm zod v4
│   ├── formatjs-intl/               # 18942–21848 → @formatjs/intl + intl-messageformat
│   ├── radix/                       # 21848–27100 → radix-ui primitives
│   ├── floating-ui/                 # 27156–28500 → @floating-ui/dom
│   ├── framer-motion/               # 23231–23800 → npm motion
│   ├── prosemirror/                 # 32000–39600 → prosemirror-model/state/transform
│   ├── tanstack-query/              # 42300–44500（与 Maitai 交错）→ @tanstack/query-core
│   └── mime-db/                     # 90282–93081 → npm mime-db
├── runtime/
│   ├── message-bridge/              # 470–640 → vscode-api.ts 同构（VscodeHostMessageBridge、
│   │                                #   chunked message 重组、useElectronMessageHandler、
│   │                                #   electronBridge 出站）。对照 boundaries/vscode-api.ts
│   ├── atom-signal/ (maitai)        # 39600–42600 → atom 原语、scope/family、transaction、
│   │                                #   read-tracker、query 集成 Symbol。自研核心，需完整还原
│   ├── persisted-atom/              # 48338–48400 (DV/OV/kV) + 45840–45900 hostStorage 键表 +
│   │                                #   45878 persisted-atom-state 消息。对照 utils/persisted-atom*
│   ├── routes/                      # 50230–50520 → 路由常量表、codex:// deep-link 解析、
│   │                                #   thread id (client-new-thread:)。对照 persisted-signal/routes.ts
│   ├── settings-schema/             # 48400–52500 → 全部 DV() 定义（appearance/git/browser/…）。
│   │                                #   对照 settings/ 目录
│   ├── theme/                       # 50770–50830 (schema) + 94030–94060 (data-theme observer) +
│   │                                #   56011–56045 (system 解析)。对照 theme-*-runtime.ts
│   └── browser-constants/           # 46239–46300 → chrome:// 映射、persist:codex-* 键
├── ui/
│   ├── icons/                       # 27182–113118 中全部 name/ink 定义（635 个）→ 生成
│   │                                #   assets/icons/*.ts（每个 icon 一个文件，如 uDt→sites-light-32）
│   ├── primitives/                  # 94040–104500 → tabs、context-menu（showContextMenu 桥调用）、
│   │                                #   code-block（data-theme/data-markdown-copy）、sticky action bar
│   └── toast/                       # 54001–56220 → sonner 封装 + Notifications 容器
└── index.ts                         # 113127–116313 export 表 → 按上表重导出，保持 3185个别名兼容
```

拆分顺序建议：
1. **先还原 runtime/message-bridge**（470–640，仅 ~170 行但被所有功能 chunk 依赖；与 preload/electron-bridge.ts 可双向验证）。
2. **再还原 settings-schema + routes**（字符串密集、zod 结构完整，还原难度低、价值高）。
3. **Maitai 区（39600–42600）单独作为攻坚任务**：自研库、无 npm 对应，需按错误信息/Symbol 名锚定语义逐函数还原。
4. vendor 区直接引 npm 包 + 版本对齐（react 19 compiler build、zod v4、@formatjs、radix、floating-ui、prosemirror、@tanstack/query-core、mime-db），不必逐行还原。
5. icons 用脚本从 `name: \`…\`` + `ink: {` 结构批量生成。

---

## 6. 快速参考：本报告锚定的关键行号

| 行号 | 内容 |
|---|---|
| 328 | chunked message 校验（`codex-host-chunked-message-v1`） |
| 480–496 | `window.electronBridge.sendMessageFromView` 出站 |
| 512 | `acknowledgeChunkedMessage` 回执 |
| 553–640 | `VscodeHostMessageBridge` 类 + 缓冲消息类型集 |
| 545 | `useElectronMessageHandler`（`ee`） |
| 8788 | `createRoot` |
| 40542 | `Cannot start a nested Maitai signal transaction` |
| 42403 | 5 个 `maitai.*` Symbol |
| 45516 | `vscode-capn-rpc-message` / `-connect` |
| 45840–45900 | hostStorage 持久化键表（~60 键） |
| 46239 | browser-use 设置 + `persist:codex-*` |
| 48338–48365 | `DV`/`OV`/`kV` settings 定义 helper |
| 50434–50442 | 路由常量表 |
| 50779–50830 | appearance 设置 schema |
| 55582–56216 | sonner toast |
| 56011–56045 | `prefers-color-scheme` 解析 |
| 90282–93081 | mime-db |
| 94030–94060 | `data-theme` MutationObserver hook |
| 100364/100451 | `showContextMenu` 桥调用 |
| 113127 | export 语句起点（3,185 导出） |
