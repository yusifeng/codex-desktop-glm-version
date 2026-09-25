# 渲染进程入口链与窗口/路由地图（逆向分析报告）

> 分析对象：`/Users/david/Workspace/ppio_github/chatgpt-desktop-src/app/webview/`（产物 bundle，只读分析）
> 交叉验证：`/Users/david/Workspace/ppio_github/codex-desktop-glm-version/src/main/`（main 进程重写模块）
> 参考仓库：`/tmp/codex-refs/decode-codex/restored/`（老版本还原源码）
> 日期：2026-09-25

---

## 1. 完整入口链

### 1.1 主入口：index.html → index-e0f46c018fe4.js

```
index.html (#root, 内置 startup-loader shimmer 动画)
  ├─ modulepreload: rolldown-runtime-2d059c5e81f4.js
  ├─ modulepreload: modulepreload-polyfill-f3909396b544.js
  ├─ modulepreload + stylesheet: app-shared-7b9edc1bfb7f.js / .css
  └─ <script type="module"> assets/index-e0f46c018fe4.js (949 B)
```

`index-e0f46c018fe4.js` 的完整内容职责（证据：文件全文，949 B）：

```js
function a() {
  return e(async () => {
    i(), n(),                     // app-shared 里的两个初始化函数 (H3/V3)
    await r(() => import("./rpc-971deaddf2c2.js"), ...),      // 先加载 rpc
    await r(() => import("./app-main-be230e7e4f5a.js"), ...)  // 再加载 app-main
  })();
}
function o() { t(), await a(); }  // modulepreload polyfill → a()
await o();
```

加载顺序是**串行**的：`i() → n() → import(rpc) → import(app-main)`。

### 1.2 rpc-971deaddf2c2.js（168 B）—— 极薄的 re-export

```js
import { fnt as e, hnt as t, mnt as n, pnt as r } from "./app-initial-51da50e6c6e3.js";
n();  // sU() —— 初始化 app-initial 内部模块
export { e as appHost, r as appServices, t as initializeAppHostServices };
```

**rpc chunk 本身不建立任何连接**。它强制 app-initial 求值其 `sU`（导出名 `mnt`），并向外暴露三个符号：
- `appHost`（`wGi` = `sbe(xGi)`，AppHost 包装实例）
- `appServices`（`oU` = 服务表：`appActions / appUpdates / clientCoordination / downloads / …`）
- `initializeAppHostServices`（`CGi`）

即「rpc chunk」实际是 **AppHost/RPC 服务引导的触发点**：加载它 = 触发 app-initial 的模块初始化（`sU`），并让后续模块能拿到 `appServices` 引用。真正的 Electron bridge RPC（`window.electronBridge`）在 app-initial 内部通过 preload 注入。

### 1.3 app-main-be230e7e4f5a.js（516 B）—— React root 挂载

```js
function u() {
  return e(() => {
    if (r(), o = n(), a(),      // r()=e6(Z: React), n()=N3(createRoot), a()=Et(jqc: renderer 初始化)
        t(),                    // t()=I3(K: jsx runtime)
        s = document.getElementById(`root`),
        !s) throw Error(`Root container not found`);
    c = window,
    c.__codexRoot ?? (c.__codexRoot = createRoot(s)),   // 幂等：挂在 window.__codexRoot
    l = c.__codexRoot,
    i().then((e2) => l.render(e2));                     // i()=Dt(_qc: 异步组件工厂) → render
  })();
}
u();
```

`a()`（= `jqc`，在 app-initial 内）先跑，说明 **app-main 的 render 前置依赖是 app-initial 的 `jqc()` 初始化**。

### 1.4 app-initial-51da50e6c6e3.js（15 MB，213,774 行）—— 主体

15MB 的构成：
- **绝大部分是 Shiki 语言 grammar**（`__vite__mapDeps` 数组前 ~2000 项全是 `abap-…js / actionscript-3-…js / cpp-…js` 等语言高亮 chunk 的依赖表）+ Tree-sitter/CodeMirror/语言数据 + Sentry/OpenTelemetry SDK + react-router/signals 等合并模块。
- **真正的应用启动逻辑集中在文件末尾区段（约 L211,300–L211,374）和 L117,600–L117,720 两个区段**（见 §2）。
- **路由表（react-router `<Route>` 树）位于 L194,492–L194,700 的 `Vtc()` 初始化函数**（见 §4）。

---

## 2. app-initial 内应用启动逻辑的区段定位（带证据）

### 2.1 区段 A：`SGi` / `CGi` / `sU`（AppHost 与服务装配）—— L117,603–L117,627

```
117603 function SGi() {           // 单例初始化：AppHost 容器类 bGi + 实例 xGi
117620 async function CGi() {     // initializeAppHostServices：等待 services 并逐项启动
         wGi = sbe(xGi), oU = await wGi.services,
         oU.threadReadState → initialize
         oU.statsig → Brt(...)
         oU.clientCoordination → mFn(...)
         oU.terminal → qrt(...)
         oU.devboxService（引用触发）
117624 function sU() {            // rpc chunk 调的 n()：Hrt/nf/SGi/xFn/Foe
```

### 2.2 区段 B：`jqc` / `_qc` / `bqc` / `lqc`（渲染器启动序列）—— L211,301–L211,374

- **`jqc`（= app-main 里的 `a()`，L211,351）**：一次性初始化，证据要点：
  - `document.documentElement.dataset.codexWindowType = "electron"`、`dataset.windowType = "electron"`、`dataset.codexOs`、`dataset.codexWindowChrome`
  - `V_.start(kqc, Aqc, true, dL ?? location.pathname)`（启动计时器，`kqc` = 从 `initialRoute`/pathname 推导的初始路由 `uVt(...)`）
  - `window.electronBridge?.getPreloadStartedAtMs()`、`getSentryInitOptions` → **确认与 preload 的 electronBridge 对接**
  - `pagehide` → `RBc/OGi/Aat/V_.dispose`（telemetry flush + dispose）
  - 全局 `error` / `unhandledrejection` → `dispatchMessage("log-message", …)`（desktop-notifications）
- **`_qc`（= app-main 里的 `i()`，L211,320）**：真正的启动编排：
  ```js
  async function _qc() {
    vqc(),                                 // TGi(): Sentry/OTel tracer 初始化 + V_.start
    await xqc();                           // （当前为空异步占位）
    e10 = (Tqc ? Wec.prefetch() : srs())   // Tqc=eg() 判定 avatar-overlay 窗口 →
                                           //   avatar: 预取 AvatarOverlayNativePage
                                           //   primary: srs() = AuthedRoute+AppLayoutRoute+HomeComposerRoute
    await CGi(),                           // 等 AppHost services 就绪
    p9i(), yqc(),                          // host_services_ready + telemetry flush
    !Tqc && e10 != null && await e10,      // 主窗口等首屏页面 chunk 预取完成
    return bqc();                          // → lqc(React StrictMode + <App> 组件)
  }
  ```
- **`bqc`（L211,333）**：返回 `jsx(lqc, { startupReady })`，其中 `startupReady` 绑定 `oU.startup.whenReady()`（等 main 进程 host 启动完成再标 `host_startup_ready`）。
- **`lqc`（L211,301）**：StrictMode + ErrorBoundary(name:"App") + `<zKc startupReady>`；`startupReady` 未就绪时包 Suspense(fallback:`Startup`)；挂载后 ref 回调 `V_.markInitializationPhase("renderer_ready")`。
- **`srs`（主窗口首屏预取，L170,694）**：`Promise.all([AuthedRoute.prefetch(), HomeComposerRoute.prefetch()])` —— 即首屏三 chunk：`authed-route-6fd5c2ed960f.js` + `home-composer-route-a340373310ac.js`（含 AppLayoutRoute）。

**结论：app-initial 15MB 里「真正的启动逻辑」= 末尾 ~70 行（L211,301–211,374）+ L117,603–117,627 服务装配 + L194,492 起 Vtc() 路由表；其余体积为语法高亮 grammar、遥测 SDK、UI 基础库。**

---

## 3. detached-window.html 入口链

```
detached-window.html (#root, 透明背景, 无 startup-loader)
  └─ <script type="module"> assets/detachedWindow-1eedcac94c8e.js (1.2 KB)
       └─ 动态 import ./entry-d8508ad25dff.js (7 KB)
            ├─ theme-font-face-loader / theme-font-family（字体主题）
            └─ export initializeDetachedWindow (U)
```

`detachedWindow-*.js`：
```js
let { initializeDetachedWindow } = await import("./entry-d8508ad25dff.js");
let t2 = await e2();
window.addEventListener(`pagehide`, () => t2[Symbol.dispose](), { once: true });
// catch → window.close()
```

`entry-d8508ad25dff.js` 的 `U()` 流程（证据：L130–L190）：
1. `services.detachedWindows` → `getContentKind()`（目前注册表里只有 `kind: "browser"`）
2. `A[kind].loadDetachedRenderer()` → `import("./page-268e2fb6d880.js").mountDetachedBrowserPage`
3. `getRequest()` 拿标题/chrome/toolbarState；root 拆成两块：`TitleBar`（可拖拽 header + pin/alwaysOnTop + focus source 按钮）+ 内容容器
4. `document.documentElement.dataset.codexWindowType = "electron"`；应用 locale/direction/theme appearance CSS 变量 + 字体

**与主窗口的差异**：
| | 主窗口 | detached window |
|---|---|---|
| 入口 | index.html → index-*.js → rpc + app-main | detached-window.html → detachedWindow-*.js → entry-*.js |
| 加载 chunk | app-initial (15MB) 全量 + app-shared | 只加载 app-shared + 7KB entry + 按需 mountDetachedBrowserPage |
| React root | `window.__codexRoot`，完整 CodexApp/路由 | 自建 createRoot，仅 TitleBar + 单一内容 kind |
| 路由 | 完整 RouteLocation 体系 | 无路由，content kind 驱动 |
| main 侧创建 | `createWindow({appearance:"primary", initialRoute:"/"})` | `createWindow({appearance:"detached", initialRoute:"/detached-window"})` |

main 侧交叉验证（`src/main/bootstrap/protocol/app-protocol.ts` L61–L76）：
```ts
rendererEntryForRoute(route) => route === "/detached-window" ? "detached-window.html" : "index.html"
resolveRendererUrl(route)    => `app://-/<entry>?initialRoute=<route>`
```
即：**只有 `/detached-window` 路由走独立 HTML，其余所有窗口形态（主窗口、hotkey、avatar、dictation、quick-chat、debug…）全部复用 index.html，通过 `?initialRoute=` 查询参数区分**（渲染侧 `rPt()` 读 `searchParams.get("initialRoute")`，app-initial L48,988 附近）。

---

## 4. 路由 / 页面地图

### 4.1 路由机制（与参考仓库一致）

- react-router `MemoryRouter`（`app-shell/app-router-provider.tsx` 还原件），无 URL bar。
- 渲染侧存在**两条平行的路由体系**：
  1. **`RouteLocation` 判别联合**（`routeKind`：`home | new-thread-panel | local-thread | remote-thread | chatgpt-thread | other`），由 `parseRouteLocation` 用 `matchPath` 解析 `/local/:id`、`/remote/:taskId`、`/hotkey-window/...`、`/projects`、`/`、`/extension/panel/new`（参考仓库 `runtime/persisted-signal/routes.ts`；bundle 中 `routeKind` 出现 113 次）。它驱动 signals/面板状态，不是渲染路由表。
  2. **react-router 声明式 `<Route>` 树**（bundle L194,492 `Vtc()`），真正的页面渲染表，见 4.2。

### 4.2 `<Route>` 树完整还原（bundle L194,695–L194,700，常量已解析）

顶层结构：`Btc = T5e(Rtc)`（T5e=createRoutesFromChildren 类似包装），挂在 `crs`（AuthedRoute gate）下：
`/login, /welcome, /select-workspace, /diff, /plan-summary` 平级 + `<AuthedRoute>{Itc}`。

**AuthedRoute 内主路由表**（`yd` = Route，`_d` = Navigate，`x2` = 平台 gate，`x5` = 布局 gate，`S5` = capability gate）：

| path（常量已还原） | 页面组件（chunk） | 职责 |
|---|---|---|
| `/workspace/deactivated` | （内联） | 工作区停用页 |
| `/` 、`/projects` | `kec` → `lrs(HomeComposerRoute)` + `_tc(ProjectsIndexPage)` | 首页/项目首页（home routeKind；`/projects?projectId=` → projectContext） |
| `/work` | `Aec` → worktree 切换 gate → `kec` | 工作模式首页 |
| `/g/:projectId/project` (`ken`) | `Tec` | 项目详情（ChatGPT project） |
| `/verify_age` | `Iec(VerifyAgePage)` | 年龄验证 |
| `/verify_guardian` | `Lec(VerifyGuardianPage)` | 监护人验证 |
| `/meetings/:meetingId?` (`H9o=/meetings`) | `$ns(MeetingsPage)` | 会议记录 |
| `/record`, `/record/meetings/:meetingId` | `ers` | 录音页 |
| `/images` (`L9o`) | `Rec(ImagesPage)` | 图片生成页 |
| `/gpts/mine` (`wen`) | `rtc(MyGptsPage)` | 我的 GPT |
| `/gpts` (`Cen`) | `itc(GptDiscoveryPage)` | GPT 发现 |
| `/g/:gizmoId` (`Ten`) | `otc(GptChatPage)` | GPT 会话 |
| `/gpts/create` (`O9o`) | `atc(GptBuilderPage)` | GPT 构建 |
| `/codex-access` (`J9o`) | `xec` | Codex 访问页 |
| `/global-dictation` (`at`→CB→PWe→NWe) | `ltc(GlobalDictationPage)` | 全局听写（独立窗口路由） |
| `/debug` (`vbe`→xB→MWe，需 allowDebugMenu) | `Kec(DebugWindowPage)` | 调试窗口 |
| `/extension/panel/new` | `wtc(NewThreadPanelPage)` | 扩展面板新会话（new-thread-panel routeKind） |
| `/first-run` | `Atc(FirstRunPage)` | 首次运行 |
| `/mcp-app/plugins/:pluginId/:toolName` (`hxe`→zB→KWe) | `Uec(PluginMcpAppDeepLinkPage)` | MCP App 深链 |
| `/mcp-app/:server/:toolName` (`Jpe`→jB→WWe) | `Vec(McpExtensionGlobalViewPage)` | MCP 扩展全局视图 |
| `/settings/plugins/:server/:toolName` (`vme`→kB→nGe) | `Des(Ues=LocalConversationPage)` | 本地会话页（主线程路由！） |
| `/c/:conversationId` (`MBt`) | `Mes + Zec(ChatGptConversationPage)` | ChatGPT 会话（chatgpt-thread） |
| `/g/:gizmoId/c/:conversationId` (`NBt`) | 同上 | GPT 内会话 |
| `/agents` (`Pen`) | `Oec(WorkspaceAgentsPage)` | Agent 列表 |
| `/agents/a/:agentId` (`Fen`) | `Eec(WorkspaceAgentDetailPage)` | Agent 详情 |
| `/agents/studio/new` (`Ien`) | `Dec(WorkspaceAgentBuilderPage)` | Agent 构建 |
| `/agents/studio/edit/:agentId` (`Len`) + `/channels/slack/setup` (`Ren`) | 同上 | Agent 编辑/Slack 接入 |
| `/share/:sharedConversationId` (`Gbe`)、`/share/e/:sharedConversationId` (`Due`) | `stc(ChatGptSharedConversationPage)` | 分享会话 |
| `/health` (`Xfr`) | `qts(HealthPage)` | 健康/账户页 |
| `/finances` (`Rj`) + `accounts|chats|transactions` | `ntc(PersonalFinancePage)` | 个人财务 |
| `/ledger/plaid/web/oauth_redirect` | `ttc(PersonalFinancePlaidCallbackPage)` | Plaid OAuth 回调 |
| `/connector/oauth_callback` | `zec(AppConnectOAuthCallbackPage)` | 连接器 OAuth 回调 |
| `/chatgpt_health_oauth_redirect` | `Bec(HealthOAuthCallbackPage)` | 健康 OAuth 回调 |
| `/library/*` | `mtc(LibraryPage)` | 库 |
| `/library/file/:libraryFileId` | `htc(LibraryFileRoute)` | 库文件 |
| `/chatgpt/quick-chat-prewarm` (`Fle`)、`/chatgpt/quick-chat/:conversationId` (`Cye`) | `Cec(QuickChatWindowPage)` | Quick Chat 预热/会话 |
| **`/hotkey-window`** (`Zye`→wB→MH→jH) | index: `dtc(HotkeyWindowHomePage)`；`new-thread`: `ftc`；`thread/:conversationId`: `ptc`；`remote/:taskId`: `Wes(RemoteConversationPage,{variant:"hotkey"})` | 快捷键窗口全部页面 |
| `/automations` (`ses()`) | `Sec(AutomationsLayoutPage)` | 自动化 |
| `/inbox` | Navigate→`/automations` | 收件箱（重定向） |
| `/internal/demo-tools` | `wec(DemoToolsSetupPage)` | 内部工具 |
| `/security/*` | `Dtc(SecurityRoute)` | 安全设置 |
| `/sites/library` (`N9t`) | Navigate→`/library` | 站点库重定向 |
| `/pricing-plan` (`ETa`) | `Stc(PricingPlanPage)` | 定价 |
| `/checkout/web` (`ATa`) | `Jec(CheckoutWebviewPage)` | 结账 webview |
| `/workspace-settings/web` (`Uts`) | `Xec(WorkspaceSettingsWebviewPage)` | 工作区设置 webview |
| `/skills` | `yes(SkillsPage)` | 技能列表 |
| `/skills/plugins/:pluginId` (`tie`) | `yec(SkillDetails)` | 技能详情 |
| `/skills/manage` (`ste`) + `/:pluginId` (`H`→AB→qWe) | `jtc(ManagePluginsPage)` / `Etc(ManagePluginDetailPage)` | 管理插件 |
| `/plugins` | `yes(SkillsPage)` | 插件列表 |
| `/plugins/:pluginId` (`zne`→LB) | `Ttc(PluginDetailPage)` | 插件详情 |
| `/pull-requests` | `ves(PullRequestsRoute)` | PR 列表 |
| `/pull-requests/:githubHost/:owner/:repository/:pullRequestNumber` (`Dgn`) | 同上 | PR 详情 |
| `/sites` | `ges(AppgenPage)` | Sites 列表 |
| `/sites/:projectId/edit` (`D9t`) | `aes(SiteEditRoute)` | 站点编辑 |
| `/sites/:projectId` | `ies(AppgenSiteDetailRoute)` | 站点详情 |
| `/sites/:projectId/settings` (`M9t`) | `tes(AppgenSettingsPage)` | 站点设置 |
| `/sites/:projectId/analytics` (`O9t`)、`…/analytics/events` (`k9t`) | `$9o(AppgenAnalyticsPage)` | 站点分析 |
| `/sites/:projectId/automations` (`A9t`) | `nes(AppgenAutomationsPage)` | 站点自动化 |
| `/sites/:projectId/database` (`j9t`) | `ees(AppgenDatabasePage)` | 站点数据库 |
| **`/local/:conversationId`（RouteLocation）** | `vme` 路由的 `Ues(LocalConversationPage=local-conversation-page-4e7583bd972f.js)` | 本地 Codex 会话（local-thread routeKind） |
| **`/remote/:taskId`（RouteLocation）** | `Wes(RemoteConversationPage=remote-conversation-page-9acc03bfbb05.js)` | 云端任务会话（remote-thread routeKind） |
| `/codex-mobile` | `qec(CodexMobilePage)` | Codex Micro 迷你游戏窗口 |
| `/remote-connections` | `Otc(RemoteConnectionsPage)` | 远程连接管理 |
| `/profile`、`/u/:username` | `btc(ProfilePage)` | 个人主页 |
| `/settings`（+ 约 40 个 slug 子路由：general-settings、computer-use、browser-use/*、connections/*、cloud-environments、local-environments/create、open-source-licenses、Ves 动态 slug…） | `xtc(SettingsPage)` + `b5(slug)` 各 section chunk | 设置页（每 section 一个懒 chunk） |
| `/trusted-contact/{nominee,decline,remove}` | `Ftc(TrustedContactLinkPage)` | 可信联系人 |
| **`/avatar-overlay`** | electron: `Wec(AvatarOverlayNativePage)`；browser: Navigate→`/` | 宠物悬浮窗 |
| `/login` `/welcome` `/select-workspace` `/diff` `/plan-summary` | `vtc/ytc/Ctc/Gec/gtc` | 认证前/外围页 |

未挂主路由表、由窗口直接 initialRoute 进入的：`/detached-window`（独立 HTML）、`/chatgpt/quick-chat-prewarm`（quickChat 窗口预热路由，`sk` 常量，src-DldfpmrL.ts）。

### 4.3 windowType 判定（app-initial L48,988 附近 + L211,365 `tg()`）

```js
iPt = `/avatar-overlay`                                    // eg(): 当前窗口是否 avatar overlay
aPt = [`/global-dictation`, `/global-dictation/*`, `/hotkey-window`, `/hotkey-window/*`,
       `/chatgpt/quick-chat-prewarm`, `/chatgpt/quick-chat/:conversationId`, ...]  // $h(): 特殊窗口集合
rPt(): { pathname, initialRoute: searchParams.get("initialRoute") }
```

---

## 5. 窗口形态清单（main 侧证据 + 渲染侧路由）

| 窗口形态 | appearance（main `createWindow`） | initialRoute | HTML 入口 | 加载的渲染内容 | 功能 |
|---|---|---|---|---|---|
| 主窗口 | `primary` | `/`（或深层链接） | index.html | index→rpc+app-main→app-initial 全量；首屏预取 AuthedRoute+HomeComposerRoute | 完整应用壳（sidebar+tabs+panels） |
| detached window | `detached` | `/detached-window` (`DETACHED_WINDOW_ROUTE`) | **detached-window.html** | detachedWindow→entry→`page-268e2fb6d880.js:mountDetachedBrowserPage`（content kind 注册表当前仅 `browser`） | 从主窗口"撕下"的浏览器 tab 独立窗口（TitleBar：pin/置顶/聚焦来源） |
| hotkey window（home） | `hotkeyWindowHome` | `/hotkey-window` | index.html | HotkeyWindowHomePage (hotkey-window-home-page-d0618930a305.js) | 全局快捷键唤出的快速输入条（blur 自动隐藏） |
| hotkey window（thread） | `hotkeyWindowThread` | `/hotkey-window` + 子路由 | index.html | HotkeyWindowNewThreadPage / HotkeyWindowThreadPage / RemoteConversationPage(variant:hotkey)，共用 HotkeyWindowDetailLayout | 快捷键窗口展开态（新会话/会话详情/云任务） |
| avatar overlay（宠物） | （composition-surface.ts，`AVATAR_OVERLAY_ROUTE`） | `/avatar-overlay` | index.html | AvatarOverlayNativePage (avatar-overlay-native-page-910b190b3a21.js)；启动即 `Wec.prefetch()` | 桌面宠物/PIP 悬浮窗（realtime 语音入口、quick chat 聚焦） |
| global dictation | `globalDictation` | `/global-dictation` (`ak`) | index.html | GlobalDictationPage (global-dictation-page-d455ff403b10.js) | 全局听写悬浮窗（不可聚焦） |
| quick chat | `quickChat` | `/chatgpt/quick-chat-prewarm` (`sk`) | index.html | QuickChatWindowPage/QuickChatWindow | 头像/快捷键唤出的迷你聊天窗 |
| debug window | `secondary` | `/debug` (`ik`) | index.html | DebugWindowPage (debug-window-page-3b27521dcb0c.js) | 调试窗口（需 allowDebugMenu） |
| codex mobile | — | `/codex-mobile` | index.html | CodexMicroPage (codex-mobile-page-df1688cf3774.js) | Codex Micro 迷你游戏/joystick HUD |
| browser sidebar (IAB) | （主窗口内 `<webview>`，非独立 BrowserWindow） | — | chatgpt.com 远程页 | main 侧 `will-attach-webview` 钩子（first-party-webview.ts）：强制 sandbox、独立 session partition、禁弹窗 | 内嵌浏览器侧栏 |
| projectless 生成目录 | — | （`import/cowork-discovery.ts`，本地文件系统） | — | — | 生成项目工作区 |

main 侧证据：`main-C-Mhak1n.ts` L167,159（hotkey home `initialRoute:"/hotkey-window"`）、L167,207（hotkey thread）、L16945（avatar `initialRoute:xle=/avatar-overlay`）、L81375/81537（detached `a.yn=/detached-window`）、L165,695（dictation `n.so=/global-dictation`）、L167,896（quickChat `n.ao=/chatgpt/quick-chat-prewarm`）、L172,589（debug `n.oo=/debug`）。

---

## 6. service-worker

`service-worker/events.js`（2,287 B，唯一文件）——**Web Push 通知 worker，与应用路由无关**：
- `push` → 解析 JSON payload；对所有 client `postMessage`；`new-message`/`target_url` 类型且无可见 client 时 `showNotification`（icon 默认 chatgpt.com 图标）
- `notificationclick` → 白名单（chatgpt.com / chatgpt-staging.com）内 `target_url`，或 `conversation_id` → `https://chatgpt.com/c/<id>`，聚焦/打开窗口

（它是 chatgpt.com Web 通知域的 SW，随 webview 目录分发。）

---

## 7. 建议的还原顺序

1. **入口三件套**（小而关键，先还原契约）：`index.html`（含 CSP + startup-loader CSS）、`index-e0f46c018fe4.js`（加载顺序 i→n→rpc→app-main）、`rpc-*.js`（appHost/appServices/initializeAppHostServices 三符号）。对应 `app-shell/webview-entry.ts`、`app-shell/empty-app-initializer.ts`（参考仓库已有骨架）。
2. **app-main**：`window.__codexRoot` 幂等 createRoot + `jqc()/ _qc()` 启动序列（见 §2.2 的 5 步：vqc→prefetch→CGi→yqc→bqc）。
3. **AppHost 服务装配**（§2.1 `SGi/CGi/sU`）：services 表（appActions/appUpdates/clientCoordination/downloads/threadReadState/statsig/terminal/devboxService/startup/tracing）——与 main 侧 `main-app/desktop/` 的服务一一对接。
4. **窗口入口分发**（main 侧已还原，渲染侧补）：`rendererEntryForRoute`（/detached-window → detached-window.html）+ `?initialRoute=` 读取（`rPt()`）+ windowType dataset 标记。
5. **detached-window 链**：detachedWindow-*.js → entry-d8508ad25dff.js（TitleBar + content kind 注册表 + mountDetachedBrowserPage）。
6. **路由表**：先还原 `parseRouteLocation`/RouteLocation（signals 层，参考仓库已有），再还原 `Vtc()` 的 `<Route>` 树（§4.2 表格可直接当 checklist；69 个页面 chunk 的 import 语句位于 L194,492–194,700）。
7. **特殊窗口页面**（每个都是独立懒 chunk，可并行还原）：hotkey-window 4 页、avatar-overlay、global-dictation、quick-chat、debug、codex-mobile。
8. **主窗口首屏**：AuthedRoute → AppLayoutRoute → HomeComposerRoute 三 chunk（`srs()` 预取目标），即 app-shell 的核心。
9. 最后：设置页 40+ section chunk、sites/appgen/finances/gpts 等次级页面（bundle 中懒 import 共 322 个命名页面/模块，见 renderer-routes.json）。

> app-initial 的 15MB 主体（Shiki grammars、OTel、Tree-sitter wasm）建议在还原时直接声明为外部依赖，不要手写。
