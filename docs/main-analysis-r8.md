# main-C-Mhak1n.ts R8 深度分析（107,000-125,000 行）

目标：`src/main/main-C-Mhak1n.ts` 的 107,000-125,000 行（R8）。
来源：macOS ChatGPT.app（Codex 桌面版 v26.917.71314）主进程 chunk。
方法：与 `docs/main-analysis-r7.md` 同一方法论——200-400 行窗口采样 + 关键区域（类定义头、区域边界、副作用语句、实例化点、巨类方法清单）精读；所有行号经 `grep -n` 核实。结论标注置信度：**直接证据** = grep/原文引用支撑；**采样推断** = 窗口采样得出，需下游复核。

**工具坑（沿用粗扫 §9.2）**：本机 grep 为 ugrep 7.8.4，BRE `\|` 多模式静默失效。本文所有多模式扫描均用 `-E 'a|b'` 或分开单模式完成。另注意：本区函数参数大量使用单字母 `e/t/n/r/i`，`n.*` 成员访问的 grep 计数有**局部变量遮蔽噪声**（如 `n.get`/`n.map`/`n.set` 多为遮蔽），本文只采信无法被遮蔽解释的符号（`n.Uf`/`n.Ba`/`n.iu`/`n.wf` 等 schema 与常量类）。

## 0. 总览与对粗扫的重要修正

1. **vendored zod v4 带精确结束于 109,474；应用代码实际起点 109,475（直接证据）**。R7 已确认起点 106,858（`_q` 错误载体类）。R8 侧的收尾结构：
   - 109,415 `CJ.create`（ZodReadonly 工厂）是最后一个 zod 类静态方法；
   - 109,419-109,454 `ZodFirstPartyTypeKind` enum IIFE（`(e.ZodString = 'ZodString'), ... (e.ZodReadonly = 'ZodReadonly')`，36 个 typeName 直接证据）；
   - 109,456-109,474 zod 实例工厂**快捷绑定** var 链（rolldown 把应用侧 zod 用法提升为短绑定）：`Z = Vq.create`（string）、`Q = Hq.create`（number）、`TJ = Wq.create`（boolean）、`EJ = Xq.create`（jsonValue）、`DJ = $q.create`（array）、`$ = tJ.create`（object）、`OJ = nJ.create`（union）、`kJ = xKe.create`、`wKe = oJ.create`（tuple，`LJ = wKe([Q(), Q()])` 109,691 直接证据）、`AJ = SKe.create`（record，`AJ(TJ())` 109,486）、`jJ = uJ.create`、`MJ = fJ.create`（enum）；穿插 7 条**匿名丢弃 `.create` 表达式语句**（109,458/109,460/109,462/109,465/109,468/109,471/109,474——`bJ.create, Uq.create` 等，未被引用的 zod 工厂经 tree-shaking 后的残留，重写时删除）；
   - 109,475 起 `var NJ = $({ id: Z(), description: Z() }), TKe = ..., PJ = $({ family..., type: EKe })`——**browser-use 工具 schema 带开始**（应用代码，直接证据）。
   粗扫 §7 估计「~106,858-110,745」过宽——110,745 已是应用类。R8 应用代码共约 **15,700 行**（109,475-125,160）。
2. **修正一：`$J`（110,745）不是「transport」，是 browser 级 capability 基类**（粗扫 §3.3 置信度高但语义错）。直接证据：`$J = class { transport; browserId; documentationApi; info; ... async documentation() }`——4 字段 + id getter + documentation() 查询，共 15 行。`eY`（110,760）是 tab 级同构基类（多一个 tabId）。真正的「transport 实现」不在 R8：capability 的 `transport.send({command})` 由 native pipe 承接——`JYe`（113,009，R8）把 `DYe` API 实现包装成 pipe server，协议类 `ite`（2,662，R2，`class extends kn`）与 `ql`/`Ql`（13,563/13,806，R2）在 R2 区。R8 定义的是 **capability/command 层**（schema + 命令工厂 + capability 类 + 注册表），不是传输层。
3. **修正二：`YJe`（111,111）是 WebMCP tab capability，不是泛「页面代理」**。直接证据：`YJe = class extends eY`，`fetchTools()` 解析 `webmcp_list_tools` 命令（`NKe`）返回 `{description, call}` 冻结对象——`call(name, input)` 走 `webmcp_invoke_tool`（`IKe`）。它是「页面里的 WebMCP 工具」代理。
4. **修正三：IAB lifecycle 巨类 `tQe` 实际在 119,181-121,303（~2,120 行），不在 115,000s**（粗扫把 115,000-120,000 笼统标为 IAB lifecycle）。115,000-119,180 是它的**辅助函数带**（页面状态构造/导航阶段观察/media indicator/权限提示/截图缓存等 ~150 个自由函数 + 5 个小类）。
5. **修正四：123,334 `r$e` 不只是「系统焦点状态」**（粗扫 §3.3）。直接证据：`r$e` 是 **electron-message-handler 巨类**（123,334-125,110，~1,780 行，logger `r.i('electron-message-handler')` 123,320）：~60 字段依赖容器 + `handleMessage`（123,631-124,666，**150+ 个消息 case**，直接证据）+ 构造器（123,395-123,528，powerMonitor 5 事件接线、new iQe/cX/bke/tQe/SQe）+ ~40 个方法。系统焦点状态（`setSystemFocusState` 125,023、`isSystemSuspended/isScreenLocked`）只是其中一个小组件。它是全 app renderer→main 消息分发的**第二个中枢**（第一个是 R7 的 `PBe` fetch handler；两者消息面不同：PBe 是 `fetch` 协议，r$e 是 `a.At` 通道上的结构化消息）。
6. **修正五：content-tracing 在 122,092-122,416，worktree-service 在 122,503-123,286**（粗扫笼统标 120,000s）。两者之间 122,417-122,502 是 worktree-**cleanup** 判定函数群（`BQe = r.r('worktree-cleanup-service')` 122,417）；122,092 之前（121,305-122,091）是消息端点 `kZ`、project-folder-picker、electron-sampler 与 sampler-manager。
7. **本区间应用代码没有模块加载期的可观察副作用**（直接证据：列 0 表达式语句扫描，109,475-125,160 仅命中 zod schema 构造与两个 capability 注册表 Map 构造，见 §5）。所有 Electron 接线（powerMonitor、contentTracing、powerSaveBlocker、setInterval、SWe webview 钩子）都发生在**构造器/工厂被调用时**——消费者是 R10/R11 的 WindowContext（159,161-160,111）与 R11 的菜单装配（163,354/163,892）。

---

## 1. 区域地图（行区间，每子区域 ≤1500 行）

| 行区间 | 类型 | 语义名 | 概述 |
|---|---|---|---|
| 107,000-109,474 | **vendored** | zod v4 尾段 | R7 边界延续：`Pq`(107,237)/`Vq`(107,573 ZodString) 等 44 类尾段 + 109,419-109,454 ZodFirstPartyTypeKind enum IIFE + 109,456-109,474 工厂快捷绑定（`$`/`Z`/`Q`/`TJ`/`EJ`/`DJ`/`OJ`/`AJ`/`wKe`/`jJ`/`MJ`）。**应用代码起点 109,475** |
| 109,475-110,116 | 应用 | browser-use 工具 schema 带 | WebMCP（`MKe = 'webmcp_list_tools'` 109,544、`FKe = 'webmcp_invoke_tool'` 109,559、`FJ` 工具描述 schema 109,532）、download（`DKe` handoff/deliverable 109,502）、print（`zKe` pdf/md/xlsx/csv/docx/pptx 109,638）、tabs（`EKe` iab/extension/cdp 109,477）、navigate、screenshot、**~20 个 `playwright_locator_*` 命令**（`KKe` click 109,800 / `YKe` dblclick / `QKe` download_media / `tqe` fill / `rqe` press / `oqe` press_sequentially / `lqe` wait_for / `fqe` count / `gqe` select_option / `yqe` set_checked / `Sqe` is_visible / `Tqe` is_enabled / `Oqe` all_text_contents / `jqe` text_content / `Pqe` inner_text / `Lqe` get_attribute / `Bqe` read_all，各配 `*Ke` 工厂函数）；110,038-110,116 selector 工具（`UJ` RegExp source getter 缓存、`WJ` isRegExp、`GJ`/`qqe`/`KJ`/`Jqe`/`Yqe` selector 解析/序列化） |
| 110,117-110,744 | 应用 | locator 引擎（`JJ` 类） | `qJ = Symbol('browserAuthSelectorDetails')`（110,116）、**`JJ` 类（110,117-110,701，~585 行）**：Playwright 风格 locator——click/dblclick/selectOption/fill/type/pressSequentially/press/setChecked/check/uncheck/waitFor/count/all/textContent/innerText/getAttribute/isVisible/isEnabled/allTextContents/evaluate/evaluateAll/downloadMedia + 组合器 locator/first/last/nth/and/or/filter/getByRole/getByText/getByLabel/getByPlaceholder/getByTestId + collectionReadCache（`cachedRead`）；110,702-110,744 selector 字符串序列化（`YJ`/`XJ`/`ZJ`/`QJ`/`Zqe`/`Qqe`/`$qe`/`eJe`/`tJe`——`internal:role=`/`internal:text=`/`internal:label=`/`internal:attr=[placeholder=...]`/`internal:testid=` 语法，直接证据） |
| 110,745-111,421 | 应用 | browser-use capability 层 | **`$J` browser 基类**（110,745-110,759）/ **`eY` tab 基类**（110,760-110,779）；`tY`/`nY` capability 工厂（110,780/110,789，`{capability, info, internalOnly}` → `{create, info}`）；tab capability 群：`oJe` **botDetection**（110,807，id 直接证据）、`_Je`/`yJe` **cdp**（110,866-110,907，`pJe = 'tab_cdp_events'`）、`kJe` **browserAuth**（110,969-110,990，`oY` selector 名正则 110,914）、`dY` **pageAssets**（111,073，`UJe = 'tab_page_assets_list'`、`lY` 资源类型 111,026）、**`YJe` WebMCP tab**（111,111-111,150，fetchTools/call）；browser capability 群：`aYe` **management**（111,225-111,269，windows/tabs/tabGroups/bookmarks 四个 `createNamespace` Proxy + `browser_management_call`/`get_audit_trail` 命令 111,166/111,172）、`wY` **visibility**（111,296，`browser_visibility_get/set` 111,276/111,288）、`FY` **viewport**（111,343，`browser_viewport_reset/set` 111,323/111,335）；注册表：`ZJe([yJe, oJe, kJe, dY, fY])`（111,162，tab capability Map）、`uYe([aYe, wY, FY])`（111,362，browser capability Map）；`hYe`（111,376）经 `lte`（2,762，R1 命令分发器）把 visibility/viewport 命令路由到 IAB host（`vYe` handlers 111,402-111,421） |
| 111,422-112,805 | 应用 | **IAB browser-use API 巨类（`DYe`）** | 常量带（111,422-111,434：`IY = 'about:blank'`、超时 `yYe` 15s/`bYe` 20s/`xYe` 1500/`SYe` 3s/`CYe` 1s/`wYe` 16/`TYe` 10s、`EYe = 'tabs_content'`）；`LY = r.i('browser-use-iab-api')`（111,431）、下载 Symbol 协议（`RY` addBrowserUseDownloadChangeListener / `zY` consumeAllowedBrowserUseDownload / `BY` notifyBrowserUseDownloadChange，111,432-111,434）；**`DYe` 类（111,435-112,805，~1,370 行）**：~30 个 Map/Set 字段（tabsById/tabRuntimesById/tabIdsByPageKey/debuggerListeners/pageStateListeners/debuggerTargetSessionsByTabId/cachedCdpExpressions/cdpEventListeners/downloadChangeListeners/allowedDownloadGrantsByWebContentsId/cursorArrivalWaitersByMoveSequence/selectedTabIdsByRouteKey/hostsByRouteKey/usedTurnIdsByConversationId...）+ ~60 方法（ping/addCdpEventListener/addPageEventListener/notifyWebMcpToolInvoked/notifyPageEvent/notifyCursorArrived/ensureBrowserUseSession/getRequiredBrowserHost/updateTabsForSession/pruneMissingTabs/serializeTab/closeTab/releaseTab/acquirePageCapturePaintLease/recordBrowserUseTurn/registerDebuggerListener/emitCdpEvent/debuggerSessionIdForTarget/pruneExpiredAllowedDownloadGrants...，直接证据方法清单）；实例化：114,076（cX.ensureBackendForSession 内 `new DYe(...)`） |
| 112,806-113,093 | 应用 | CDP target 适配 + native pipe server 工厂 | `OYe`（112,806，Target.get* 命令白名单）、`kYe`/`VY`（targetId 构造 `browser-use-iab-tab:${cdpTabId}`）、`HY`/`AYe`（TargetInfo 伪造——把 IAB tab 伪装成 CDP page target）、`UYe`..`rX`（112,828-112,998，CDP 命令改写/会话路由工具群）；**`JYe` native pipe server 工厂（113,009-113,093）**：`iX = r.i('browser-use-native-pipe-server')`（112,999）、帧上限 `GYe` 8MiB/`KYe` 64MiB、`qYe` schema（112,002，session_id/turn_id/tabId/toolName）、`ql(...)`（R2）建管道 → `new ite(a, e, {...})`（2,662，R2 协议类）→ 挂 `addCdpEventListener/addCdpDetachListener/addPageEventListener/[RY]` 四路转发 → 返回 `{pipePath, dispose}`。`Bl`（13,139，R2 帧超限错误）在 113,067 被 catch |
| 113,094-114,348 | 应用 | **browser-session-registry（`cX` + `ZYe`）** | `aX = r.i('browser-session-registry')`（113,094）、`oX` identity（113,095）、`YYe` backend state 工厂（113,098）、`XYe = 200` debug 事件上限、`sX = 'local-chatgpt:'`（113,102，本地 Work session id 前缀）；**`cX` 类（113,103-114,233，~1,130 行）**：sessionRoutes/backendStatesBySessionId/backendDisposalsBySessionId/pendingLocalWorkSessionIds/hostsByRouteKey/debugEvents/windows；方法 recordDebugEvent/getDebugSnapshot/setBrowserUseNativePipeEnabled/prepareLocalWorkSessionRoute/cancelPendingLocalWorkSessionRoute/captureSessionRoute（`IAB_LIFECYCLE` 日志前缀，113,172/113,183/113,206 直接证据）/**ensureBackendForSession**（114,058：`new DYe` + `JYe` 启动 pipe backend）/moveBackendSession/disposeBackendForSession/canServeSession/getBrowserUseHost；**`ZYe` route 状态类（114,234-114,348）**：registry/conversationId/windowId/openingPagePromisesByBrowserTabId + delegate 转发方法群（openPageForBrowserUse/setBrowserUseActive/setBrowserUseCursor/closePageForBrowserUse...） |
| 114,349-115,558 | 应用 | IAB manager 辅助函数带 A | `lX`/`uX` route key（114,349/114,352）、`QYe = r.i('browser-sidebar-manager')`（114,355）、tab 生命周期 analytics（`$Ye`/`dX`/`eXe`/`fX`/`tXe`/`nXe`，`IAB_TAB_ANALYTICS` 前缀 114,380 直接证据）、thread/window 状态查找（`pX`/`mX`/`hX`/`gX`/`rXe`/`iXe`/`aXe`/`_X`）、窗口状态决策（`oXe`/`vX`/`sXe`/`cXe`/`bX`/`lXe` openPageForBrowserUse 路由、`uXe` close、`xX`/`SX`/`dXe`/`fXe`/`CX`/`wX`/`TX`/`EX`/`pXe`/`DX`/`mXe`/`hXe`/`OX`/`gXe`/`kX`）、`_Xe = r.i('browser-sidebar-manager')`（115,218）、窗口同步（`AX`/`vXe`/`jX`/`yXe`/`bXe`/`xXe`/`SXe`/`CXe` 115,294）、cold-restore 决策（`TXe`/`NX`/`EXe`/`PX`/`DXe`/`OXe`/`kXe`/`AXe`/`jXe`/`MXe`/`NXe`/`PXe`/`FX`/`IX` 115,307-115,558） |
| 115,559-115,845 | 应用 | incomplete-navigation service + 导航阶段观察 | `FXe = r.i('in-app-browser-incomplete-navigation-service')`（115,559）、`LX = []` delivery 栈（115,560，§4）、**`IXe` 类 extends n.Uf**（115,561-115,594：subscribe/unsubscribe/Symbol.dispose，`a.en()` async context 115,574）、`RX` 投递（115,595）、`zX` tab 判定（115,600）、`LXe` 页面 UI 动作装配（115,603，onBack/onForward/onReload/onComment...）；`HXe = 6e4`（115,768）、`HX = 'main-frame-navigation-stage-changed'`（115,769）、`UXe` 导航阶段计时器工厂（115,770-115,830：60s phase 超时观察）、`WXe` 接线（115,831）、`UX = r.i(...)`（115,846）、`GXe`/`KXe`（115,847/115,855） |
| 115,846-116,128 | 应用 | media indicator + auto-auth 导航 | `KX` media indicator 状态机（115,949-116,028：isAudible/isCapturingUserMedia，2s/5s/1s 超时去抖 `XXe`/`ZXe`/`QXe`）；`$X = r.i('browser-sidebar-manager')`（116,148）、owl 事件常量（`eZ` = '-owl-native-contents-close'、`tZ` = 'being-captured-state-changed'、`nZ`/`rZ`/`iZ`，116,149-116,153）、`aZe` 注释模式映射（116,157）、**`iZe` auto-auth 导航**（116,129-116,147：`getToken` → `Tr().autoAuthForSites` → 带 token 重载，`tZe` header 名）、`rZe` site bootstrap token 工厂（116,068-116,128：`.chatgpt.site`/`.appgardenapps.dev` 后缀判定，直接证据） |
| 116,129-118,943 | 应用 | IAB manager 辅助函数带 B（页面状态机） | `sZ`/`cZ` WeakMap（116,156/116,164，§4）；页面状态构造 `lZ`（116,194，~30 字段默认值）、`oZe` fresh/`sZe` cold-restore（116,165/116,179）、`cZe` materialize（116,225）、**`uZ` webContents attach（116,250-117,134，~880 行：initialNavigationSync/debuggerSync/mediaIndicator 接线）**、`lZe`/`uZe` 导航同步（117,135-117,355）、`dZe`/`dZ`/`fZe`/`fZ` loadError 处理（117,356-117,480）、`pZ`/`mZ`/`pZe`/`mZe` observer 注册（117,441-117,480，sZ/cZ 读写方）、**`hZe = r.i('browser-window-transfer')` + `gZe` 窗口转移**（117,481-117,574：`createWebViewTransfer` token 协议、`moved`/`not-moved`/`closed` 状态机，Owl 专有 API）、`_Ze = 5e3`、**`vZe` page-host-lifecycle 类**（117,576-118,083：transferToWindow/registerRendererSession/registerHost/attachWebview，`IAB_LIFECYCLE rejected stale browser sidebar attach` 117,632 直接证据）、`bZe` cold-restore 快照恢复（118,084-118,115）、`hZ = 32` tab 预算、**`xZe` tabBudget 类**（118,118-118,287：activeConversationByWindow/selectedTabsByWindow/workingSetExpiryTimers、enforceDetachedPageBudget、suspend 保护）、`CZe` MCP tool call schema（118,306）、`wZe`/`TZe`/`EZe`/`DZe`/`OZe`/`kZe`（118,307-118,370，MCP tool call 完成回执/usage 通知）、`vZ`/`AZe` site_annotation_features_changed schema（118,371-118,393）、`yZ` hostname 规范化（118,394）、`bZ`/`jZe`/`MZe` WebMCP 工具表校验（118,398-118,414，maxTools/maxTotalDescriptorBytes 限额）、`NZe`/`FZe`/`IZe`/`LZe`（118,415-118,494）、**`RZe` browser-sidebar-command 分发**（118,495-118,585：navigate/go-back/go-forward/reload/stop/print/capture-screenshot/step-zoom/reset-zoom/set-zoom-percent/open-find/set-find-query/find-next/find-previous/close-find/set-interaction-mode/set-design-modifier-pressed/set-original-view-enabled/discard-pending-annotations/add-annotations-to-composer/select-comment，直接证据）、`zZe`/`BZe` page-info dialog（118,586-118,611）、**`xZ` 截图缓存 WeakMap**（118,612，§4）、`HZe` 截图获取（118,616-118,673：capturePage stayHidden + 缓存失效条件 navigationVersion/url/presented）、`UZe`/`WZe` 裁剪缩放（118,674-118,692，608×320 上限）、`wZ`/`GZe`/`KZe` schema（118,693-118,703）、`YZe` 剪贴板截图（118,874）、`XZe` screenshot-copy 消息（118,878）、`ZZe`/`QZe` scroll 注入 JS（118,917-118,942） |
| 118,943-119,180 | 应用 | site annotation features + permissions + preload 路径 | **`$Ze` 类（118,943-119,064）**：apiEnabled/availabilityListeners/getPolicy（siteAnnotationFeaturesEnabled/siteAnnotationPermissionGranted/canUseTweaks/isAgentControllingBrowser/isAnnotationModeActive）/setApiEnabled/handlePageEvent（`n.Ba.disabledSiteAnnotationHostnames`/`siteAnnotationPermissionAnsweredHostnames` 设置键，直接证据）；**`eQe` 类（119,065-119,178）**：pending Map + request/respond/cancel/refresh/canRequest（权限请求生命周期：`Promise.withResolvers` + did-start-navigation/destroyed/render-process-gone 清理，直接证据）；`EZ = (0, h.join)(__dirname, 'browser-page-preload.js')`（119,179，**preload chunk 路径**）、`DZ = 'In-app browser is unavailable.'`（119,180） |
| 119,181-121,303 | 应用 | **IAB browser host manager 巨类（`tQe`）** | logger `r.i('browser-sidebar-manager')`（119,187）；字段（119,182-119,238）：windows Map/inAppBrowserFeatureEnabled/reportedBrowserAdmissionDenials/iabTabMentions = new qGe/tabBudget/browserUseOpenRequests/browserUseNavigationRestriction = new Vae/activeDraggedImagesByOwnerWebContentsId/comments/siteBootstrapController = new AbortController/permissionPrompts = new qZe/siteAnnotationFeatures/siteAnnotationPermissions/browserPageSnapshots/browserPageHostLifecycle/browserSessionService；构造器（119,239-119,400+）：默认参 `r = J`('local')、`i = QBe()`(98,144 R7)、`a = new cX()`、`o = NHe()`(99,218 R7 viewport)；**new LGe（downloadStore 119,249）/ new XHe（pageSnapshots 119,251）/ new BWe（browserSessionService 119,252）/ new hGe（comments 119,349，R7 comment controller）/ new qZe（permissionPrompts 119,206）/ new $Ze（siteAnnotationFeatures 119,374）/ new eQe（siteAnnotationPermissions 119,381）/ new xZe（tabBudget 119,278）/ new vZe（pageHostLifecycle 119,287）**；`SWe({...})` webview 生命周期接线（120,846，R7 工厂，preloadPath: EZ 120,887）；方法 ~130 个（119,274-121,303，直接证据方法清单）：admitBrowserTab/syncView/sync/syncOwner/isBrowserPresentedForConversation/getDebugSnapshot/getFeedbackDiagnostics/getBrowserUseRouteActionHelpers/openBrowserPanelWithoutAnimation/setBrowserUseActiveForRoute/onMcpToolCallCompleted/setBrowserUseCursorForRoute/activateBrowserUseNavigationRestriction/goBack/**cloneTab**/goForward/getActiveVisiblePageForWindow/getVisiblePageForWebContents/getReloadTargetForWindow/runFocusedVisiblePageCommand/closeFocusedVisibleBrowserTab/reloadActiveVisiblePage/scroll/runPageCommand/openFind/openSiteInfo/setFindQuery/findNext/findPrevious/closeFind/reload/reset/stop/getCurrentPageWebContents/getExtensionActionMenuTarget/getWebMcpInspectorData/setAudioMuted/print/suspend/browserWebviewDestroyed/registerWebviewHost/registerWebviewHostSession/setZoomPercent/stepZoom/resetZoom/navigate/refreshCursor/setThreadZoomPercent/queuePageDeviceMetricsSync/queuePageDebuggerSync/queuePageColorSchemeSync/setInteractionMode/startCommentAtPoint/startDesignEditAtPoint/requestCommentMode/clearComments/discardPendingAnnotations/addAnnotationsToComposer/**disposeWindowState**（121,246：persistWindowBeforeShutdown + browserUseOpenRequests.rejectForOwner + tabBudget.handleWindowClosed + browserSessionRegistry.handleWindowClosed）/getDetachedWindowStates/getPageWindowState/getLiveWindowState/getFocusedOwnerWebContents/getFocusedWindowState/getPreferredWindowStateForConversation/resolveBrowserUseOpenRequests；实例化：123,487（r$e 构造器） |
| 121,305-121,330 | 应用 | remote-localhost-navigation | `nQe = r.i('remote-localhost-navigation')`（121,304）、`OZ` 远程 host localhost 端口转发（121,305-121,329：`startRemoteLocalhostPortForward`，durable host 返回原样） |
| 121,330-121,430 | 应用 | webContents 消息端点（`kZ` 类） | **`kZ` 类（121,330-121,430）**：webContents/chunkedMessageSender/browserWindow/ownsBackgroundThread/destroyedListeners/focusChangedListeners；**`send` 的 background throttling 过滤**（121,345-121,369：getBackgroundThrottling 时只放行 mcp-request/mcp-notification 且 `ownsBackgroundThread(hostId, threadId)` 必须为真，直接证据）；sendCritical/isDestroyed/isFocused/onDestroyed/onFocusChanged。实例化：124,670/124,342/124,410/124,464/160,398（r$e handleMessage 与 R10/R11） |
| 121,431-121,777 | 应用 | project-folder-picker + electron-sampler | `rQe = 100`/`iQe` 类（121,432-121,553，logger `r.i('project-folder-picker')` 121,436：createOrSelectProject，remote host 走 `remote-workspace-root-requested` 消息）；`uQe` 类（121,559-121,776，logger `r.i('electron-sampler')` 121,563：collectSnapshotFields/collectPerformanceSpanCpuSnapshot，进程/内存采样）。实例化：123,448（iQe）、159,791（uQe） |
| 121,777-122,092 | 应用 | sampler-manager | CPU 采样聚合（`dQe`/`AZ`/`jZ`/`fQe`/`pQe`/`MZ` 121,777-121,890：main/renderer CPU%、host descendant 进程分组）；**`vQe` main-thread jank sampler 类**（121,900-121,944：100ms tick + `hQe = 900`ms 阈值计数 + powerMonitor suspend/resume 感知）；**`SQe` 类（121,948-122,091，logger `r.i('sampler-manager')`）**：appStateHeartbeat = setInterval 30s（121,968，unref）、appStateSnapshotRequestById = new n.Sc TTL map（121,958）、appStateTriggerMinIntervalGate = new ct（121,959，527 行 R1 类）、performanceCpuSamplingById、requestAppStateSnapshot/handleAppStateSnapshotResponse（`electron-app-state-snapshot-request/-response` 消息 + desktopSentry breadcrumb）。实例化：123,519（r$e 构造器） |
| 122,093-122,416 | 应用 | **content-tracing** | `CQe = r.i('content-tracing')`（122,092）、`wQe` GPU/内存快照（122,093-122,155：getAppMetrics/getGPUFeatureStatus/getGPUInfo）、`TQe`（122,156）；**模块级 pending 状态**（122,159-122,222，§4）：`PZ`/`FZ` confirm/upload resolver、`RZ` 状态机（'idle'）、`zZ` 开始时间、`BZ` 格式标志、`VZ` buffer 轮询 timer、`HZ` toggle handler；`EQe`/`DQe`/`OQe`/`kQe`/`AQe`/`jQe`（122,161-122,192，resolver 对）；`IZ = r.i('content-tracing')`（122,193）、`MQe` 菜单 label 表（122,194-122,213，i18n messageId 直接证据）、`LZ = 'toggle-trace-recording'`（122,214）、`NQe = process.env.CODEX_TRACE_SHORTCUT != null`（122,215）、`PQe`/`FQe` trace categories（122,216-122,217）；**`IQe` 菜单项工厂**（122,223-122,337：idle→awaiting-start-confirmation→recording→saving→awaiting-upload-details→uploading 状态机，`l.contentTracing.startRecording/stopRecording` 122,243/122,258，buffer 满 0.99 自动停 `GZ` 122,395-122,410）；`UZ` 广播（122,338）、`LQe` 菜单触发（122,341）、**`RQe` 上传**（122,345-122,388：**动态 `require('./upload-D8KNqeRP.js')`** 122,347 + 重试对话框）；`WZ` 状态切换（122,389）、`GZ` buffer 轮询（122,395）、`KZ` label（122,411）、`zQe`（122,414）。消费者：163,354 `Ze = IQe({...})`（R11 菜单装配）、163,892 `UZ(y)`、124,270 `LQe()`（toggle-trace-recording 消息）、158,575-158,581 confirm resolver（R11） |
| 122,417-123,319 | 应用 | **worktree-service** | `BQe = r.r('worktree-cleanup-service')`（122,417）、`VQe = 432e6`（122,418，5 天清理缓冲）；cleanup 判定群（122,419-122,502）：`qZ` thread metadata（updatedAt/mtime/isInProgress）、`JZ` pinned ids、`HQe` pinned worktree 判定、`UQe` readFailed 守卫、`WQe` 配置（`n.ms` + autoCleanupEnabled）、`GQe` 缓冲期（`a.$` = WORKTREE_CLEANUP_BUFFER_START_MS_KEY，122,483）、`KQe`/`YZ` workspace root 内判定、`qQe` unpackaged override；**`XQe` 类（122,513-123,286，logger `r.i('worktree-service')` 122,512）**：statesById/newbornWorktreeRoots/newbornWorktreeRootsByStreamId/cancelledWorktreeStreamIds/workerEventSubscriptions = new n.Wr/cleanupRunning/cleanupPending；构造器订阅 git worker 事件（create-worktree-path/setup-started/stream 122,524-122,538）；方法 create/handleCreateWorktreePath（newborn 保护 123,203）/forgetNewbornWorktreeStream/handleCreateWorktreeStream（输出 decode `QZ` 32KB 截断 123,287-123,297）/addWorkspaceRoots（`global-state-updated` 广播 123,249-123,261）/notifyFailure（turnMode 通知设置门控 123,263-123,275）/publish/updateEntry；`$Z` 输出追加（123,298）、`ZQe` AbortError（123,303）、`QQe` cleanup reason 映射（123,306-123,319，worktree_settings_delete/archive_cleanup/auto_cleanup 等，直接证据）。实例化：123,594（r$e.ensureWorktreeService 内 `new XQe`） |
| 123,320-125,110 | 应用 | **electron-message-handler 巨类（`r$e`）** | 前置常量（123,320-123,333）：`eQ = r.i('electron-message-handler')`、onboarding 窗口尺寸 `tQ` 560/`$Qe` 1090/`e$e` 760/`nQ` 0.9、`rQ`/`t$e`、`n$e` 尺寸判定；**`r$e` 类（123,334-125,110，~1,780 行）**：~60 字段（hostId/appServerClient/windowManager/chunkedMessageSender/avatarOverlayManager/appServerConnectionRegistry/fetchWrapper/globalState/projectsManager/sharedObjectRepository/desktopNotificationManager/errorReporter/desktopSentry/inboxManager/settingsStore/sharedObjectSubscribers/primaryWindowRestoreBounds/primaryWindowMode/**powerSaveBlockerId/isSystemSuspended/isScreenLocked**/powerSaveBlockingWebContentsIds/displaySleepBlockingWebContentsIds/pluggedInRemoteControlPowerSaveWebContentsIds/pendingDynamicToolsForThreadStartRequests/dynamicAppToolResponses = new IT（64,022 R5）/samplerManager/projectFolderPicker/**worktreeServicesByHostId**/browserSessionRegistry/browserHostManager/browserAutocompleteCoordinator = new bke（69,356 R5）/automationSchedulerController）；构造器（123,395-123,528）：**powerMonitor 5 事件接线**（on-ac/on-battery/suspend/resume/lock-screen/unlock-screen 123,458-123,467）、new iQe/cX/bke/**tQe**/SQe、ensureWorktreeService；**`handleMessage`（123,631-124,666，150+ case，直接证据清单见 §3.J）**；方法群（123,529-125,110）：getWorktreeService/createOrSelectProject/setAutomationSchedulerController/getBrowserHostManager/startPerformanceSpanCpuSampling/deletePersistedBrowserConversation/getAppServerConnection/ensureWorktreeService/publishPendingWorktrees/waitForDynamicAppToolResponse/discardDynamicAppToolResponse/cancelDynamicAppToolResponse/sendMessageToOrigin/requestDynamicToolsForThreadStart/requestHostedAutomationsAvailabilityForThreadStart/requestDynamicToolsAndHostedAutomationAppForThreadStart/resolvePendingDynamicToolsForThreadStartRequestsForOrigin/handleDynamicToolsForThreadStartResponse/sendPersistedAtomState/updatePersistedAtomState/broadcastPersistedAtomUpdate/deletePersistedAtomStateKeys/resetPersistedAtomState/skipOnboardingWorkspace/sanitizeDefaultProjectName/findAvailableDefaultWorkspaceRoot/createDefaultWorkspaceRoot/folderExists/initializeDefaultWorkspace/revealWindowsReviewRequest/getPrimaryWindow/restoreShowAndFocusWindow/updatePowerSaveBlocker/**setSystemFocusState**（125,023-125,042：suspended/screen-locked → `windowManager.setSystemFocusSuppressed` + `electron-window-focus-changed` 广播）/syncPowerSaveBlocker（125,043：prevent-display-sleep vs prevent-app-suspension 仲裁）/sendCustomPrompts/sendMessageToView（`a.At` = MESSAGE_FOR_VIEW 通道）/sendAppServerResponseToView/sendSharedObjectUpdate/shouldUseWslPaths（`n.zi`）/getSettingsStore/dispose（125,028：powerMonitor off + samplerManager.dispose + worktreeServices dispose）。实例化：**159,794**（R10/R11 WindowContext `this.messageHandler = new r$e(...)`） |
| 125,111-125,160 | 应用 | host registry + clipboard 文件服务（R8 尾，跨 R9 边界） | `iQ` route key 判定（125,111，`thread-browser-tabs-v1:`/`thread-tab-routes-v1:` 前缀）、`i$e` win32 approval 例外（125,114-125,122：`item/commandExecution/requestApproval`/`mcpServer/elicitation/request`）、**`a$e` appServerClient registry 类**（125,123-125,143：defaultHostId + hosts Map + add/get/getMaybe/remove）、`o$e` mime 扩展 Map（125,144-125,149）、**`s$e` clipboard/文件附件服务类 extends n.Uf**（125,150-125,160+：countFolderFiles（`n.$`）/persistImageFileToTemp（`codex-clipboard-${uuid}` 临时文件）/createTemporaryFile/downloadCopy）。实例化：159,161（executionHostRegistry = new a$e）、160,111（fileAttachments = new s$e）。**s$e 类体延伸过 125,160 进入 R9 区（p$e workspace file service 125,188 起）** |

---

## 2. vendored 识别

| 包 | 行区间 | 证据 | 处理建议 |
|---|---|---|---|
| **zod v4** | **106,858-109,474**（R8 内 107,000-109,474；R7 内 106,858-107,000） | 类段至 109,415 `CJ.create`（ZodReadonly）；109,419-109,454 ZodFirstPartyTypeKind enum IIFE（36 个 `e.ZodXxx = 'ZodXxx'` 直接证据）；109,456-109,474 工厂快捷绑定（rolldown 把应用侧 zod 用法提升为短绑定） | npm `zod@v4`，不重写。**注意**：109,456-109,474 的快捷绑定（`$`/`Z`/`Q`/`TJ`/`EJ`/`DJ`/`OJ`/`kJ`/`wKe`/`AJ`/`jJ`/`MJ`）是 vendored 与应用之间的粘合层，应用代码（browser-use schema 带）大量使用——重写时对应 `z.object`/`z.string`/`z.number`/`z.boolean`/`z.jsonValue`/`z.array`/`z.union`/`z.tuple`/`z.record`/`z.enum`；其间 7 条匿名 `.create` 丢弃语句（109,458/109,460/109,462/109,465/109,468/109,471/109,474）是 tree-shaking 残留，删除 |

除 zod 外，**R8 区间（109,475-125,160）没有任何其他 vendored 库**（直接证据：全部顶层定义引用 `n.*`/`l.*`/`a.*` 应用符号；110,117 的 `JJ` locator 类虽是 Playwright 风格 API，但是应用自写实现——selector 语法 `internal:role=` 是 Playwright 约定，代码本身非 vendored，置信度高）。

**zod 双实例警告（沿用 R7 §7.11，本区更严重）**：browser-use 工具 schema 带（109,475-111,421）全部用 **vendored zod v4**（`$`/`Z`/`Q`/`MJ`/`_q` 命令载体）；IAB sidebar schema（`wZ`/`GZe`/`KZe`/`AZe`/`NZe`/`qYe` 118,306-118,703）用 **shared chunk 的 `n.*` zod**（v3 风格）。两套在同一区域混用，重写时必须显式区分。

---

## 3. 子系统聚类与模块拆分方案

> 建议模块名 kebab-case；「定义」列出压缩名 → 建议语义名。消费者行号在 R8 之外时标注供派发对照。

### A. browser-use 工具协议层（schema + locator + capability）

| 项 | 内容 |
|---|---|
| 行区间 | 109,475-111,421 |
| 建议模块 | `browser-use/tool-commands.ts`（schema + 命令工厂，可按 webmcp/tabs/navigate/screenshot/locator_* 分文件）、`browser-use/selector-engine.ts`（UJ/WJ/GJ/qqe/KJ/Jqe/Yqe + YJ..tJe 序列化）、`browser-use/locator.ts`（JJ 类）、`browser-use/capabilities/`（tab: botDetection/cdp/browserAuth/pageAssets/webmcp；browser: management/visibility/viewport）、`browser-use/capability-registry.ts`（tY/nY/ZJe/uYe） |
| 主要定义 | `JJ`(Locator)、`$J`(BrowserCapability)、`eY`(TabCapability)、`YJe`(WebMcpTabCapability)、`aYe`(ManagementCapability)、`wY`(VisibilityCapability)、`FY`(ViewportCapability)、`oJe`(BotDetectionCapability)、`yJe`(CdpCapability)、`kJe`(BrowserAuthCapability)、`dY`(PageAssetsCapability)、`_q`(Command 载体，vendored zod 区)、`FJ`(WebMcpToolDescriptor)、`hYe`/`vYe`（内置命令分发/handlers，经 `lte` 2,762 R1） |
| 说明 | 命令对象模式：每个命令 = `{type 字符串常量, payload schema, create(payload) → new _q(type, schema, payload)}`；`_q.parse()` 在接收端校验。`JJ.locator()` 链式选择器 + `collectionReadCache` 读缓存。management capability 用 `Proxy` 把 `windows.tabs(x)` 动态路由到 `invoke(namespace, method, ...args)`（111,248-111,263） |

### B. IAB browser-use API（`DYe`）

| 项 | 内容 |
|---|---|
| 行区间 | 111,422-112,805（+ CDP target 适配 112,806-112,998） |
| 建议模块 | `browser-use/iab-api.ts`（DYe 类）+ `browser-use/cdp-target-adapter.ts`（OYe..rX） |
| 主要定义 | `DYe`(IabBrowserUseApi)、`LY`(logger)、`RY`/`zY`/`BY`（下载 Symbol 协议——与 R7 `LGe`/`IGe` 下载事件对接）、`HY`/`AYe`（TargetInfo 伪造）、`VY`（targetId 构造） |
| 说明 | DYe 是 browser-use 后端在 IAB 侧的实现：tab 注册表 + CDP debugger 会话管理 + 页面事件 + 下载授权（`allowedDownloadGrantsByWebContentsId` 10s 过期 `TYe`）+ 光标到达等待（`cursorArrivalWaitersByMoveSequence`）。被 `cX.ensureBackendForSession` 实例化（114,076） |

### C. native pipe server 接线（`JYe`）

| 项 | 内容 |
|---|---|
| 行区间 | 112,999-113,093 |
| 建议模块 | `browser-use/native-pipe-server.ts` |
| 主要定义 | `JYe`(createBrowserUseNativePipeServer)、`iX`(logger)、`qYe`(WebMcpToolInvoked schema) |
| 依赖 | `ql`/`Ql`/`ite`/`Bl`（13,563/13,806/2,662/13,139，**R2 native pipe 区**——拆分时与 R2 agent 核对） |
| 说明 | 每个 browser-use session 一个 pipe server 实例（`cX.backendStatesBySessionId`），4 路事件转发（CDP event/detach/page event/download change）+ `onMoveMouseError`/`onWebMcpToolInvoked` 回调 |

### D. browser-session-registry（`cX` + `ZYe`）

| 项 | 内容 |
|---|---|
| 行区间 | 113,094-114,348 |
| 建议模块 | `browser-use/session-registry.ts`（cX）+ `browser-use/route-state.ts`（ZYe） |
| 主要定义 | `cX`(BrowserSessionRegistry)、`ZYe`(BrowserUseRouteState)、`aX`(logger)、`sX`('local-chatgpt:' 前缀)、`YYe`(backend state 工厂) |
| 说明 | session→window 路由 + native pipe backend 生命周期（`setBrowserUseNativePipeEnabled` 开关时批量 dispose/ensure）+ debug 事件环形缓冲（200 条）。`ZYe` 是 route 的 delegate 门面，把 `registry.getDelegate()`（= tQe）的方法按 route 参数化 |

### E. IAB manager 辅助带（页面状态机）

| 项 | 内容 |
|---|---|
| 行区间 | 114,349-119,180 |
| 建议模块 | `browser-sidebar/tab-lifecycle-analytics.ts`（$Ye/dX/eXe/fX/tXe/nXe）、`browser-sidebar/state-lookup.ts`（pX..jXe 群）、`browser-sidebar/window-state.ts`（yXe/bXe/xXe/SXe/oXe/vX）、`browser-sidebar/cold-restore.ts`（TXe..IX + bZe）、`browser-sidebar/incomplete-navigation.ts`（IXe/LX/RX）、`browser-sidebar/navigation-phase-observer.ts`（UXe/WXe）、`browser-sidebar/media-indicator.ts`（KX）、`browser-sidebar/auto-auth.ts`（iZe/rZe）、`browser-sidebar/page-state.ts`（lZ/oZe/sZe/cZe/uZ）、`browser-sidebar/navigation-sync.ts`（lZe/uZe/dZe/dZ/fZe/fZ）、`browser-sidebar/resize-observers.ts`（pZ/mZ/pZe/mZe + sZ/cZ）、`browser-sidebar/window-transfer.ts`（gZe + hZe logger）、`browser-sidebar/page-host-lifecycle.ts`（vZe）、`browser-sidebar/tab-budget.ts`（xZe）、`browser-sidebar/command-dispatch.ts`（RZe + wZe..kZe）、`browser-sidebar/screenshot.ts`（xZ/HZe/UZe/WZe/YZe/XZe/ZZe/QZe）、`browser-sidebar/site-annotation-features.ts`（$Ze）、`browser-sidebar/site-annotation-permissions.ts`（eQe）、`browser-sidebar/permission-prompts.ts`（qZe 118,704 + wZ/GZe/KZe schema） |
| 主要定义 | 见 §1 对应行；关键：`uZ`（webContents attach，~880 行）、`gZe`（窗口转移）、`vZe`（host lifecycle）、`xZe`（tab 预算 32/18e5）、`RZe`（命令分发 22 个命令）、`HZe`（截图缓存） |
| 消费者 | tQe（本区 F）与 r$e（本区 J） |

### F. IAB browser host manager（`tQe`，本区最大单块）

| 项 | 内容 |
|---|---|
| 行区间 | 119,181-121,303（~2,120 行） |
| 建议模块 | `browser-sidebar/browser-host-manager.ts`（可再拆：窗口状态管理 / browser-use 路由 / 导航与缩放 / 注释模式 / find-in-page / 调试快照） |
| 主要定义 | `tQe`(BrowserHostManager / IabManager)、`EZ`(browserPagePreloadPath)、`DZ` |
| 组合根 | 构造器内 new：`LGe`(downloadStore，R7 106,150)、`XHe`(pageSnapshots，R7 99,788)、`BWe`(browserSessionService，R7 102,179)、`hGe`(comments，R7 103,975)、`qGe`(iabTabMentions，R7 106,783)、`qZe`(permissionPrompts)、`$Ze`/`eQe`(siteAnnotation)、`xZe`(tabBudget)、`vZe`(pageHostLifecycle)、`Vae`(navigationRestriction，**R2 11,158**)；`SWe`（R7 101,479 attach 协调器）接线 120,846 |
| 消费者 | 123,487（r$e 构造器 `new tQe(...)`）；`cX.setDelegate({...})` 在 tQe 构造器内（119,302，直接证据）——session registry 的 delegate 即 tQe 的方法子集 |

### G. 消息端点 + project picker + samplers

| 项 | 内容 |
|---|---|
| 行区间 | 121,305-122,092 |
| 建议模块 | `browser-sidebar/remote-localhost-navigation.ts`（OZ/nQe）、`messaging/webcontents-endpoint.ts`（kZ）、`projects/folder-picker.ts`（iQe）、`telemetry/electron-sampler.ts`（uQe）、`telemetry/sampler-manager.ts`（SQe + vQe + dQe/AZ/fQe/pQe/MZ） |
| 主要定义 | `kZ`(WebContentsEndpoint)、`iQe`(ProjectFolderPicker)、`uQe`(ElectronSampler)、`SQe`(SamplerManager)、`vQe`(MainThreadJankSampler) |
| 消费者 | kZ：124,342/124,410/124,464/124,670（r$e handleMessage）、160,398（R10/R11）；iQe：123,448；uQe：159,791；SQe：123,519 |

### H. content-tracing

| 项 | 内容 |
|---|---|
| 行区间 | 122,093-122,416 |
| 建议模块 | `telemetry/content-tracing.ts`（IQe + WZ/GZ/KZ/UZ/LQe + 状态机）+ `telemetry/trace-upload.ts`（RQe——或直接归 upload chunk 消费侧） |
| 主要定义 | `IQe`(createTraceRecordingMenuItem)、`wQe`(collectRuntimeHealthSnapshot)、`EQe/DQe/OQe/kQe/AQe/jQe`(pending confirm/upload resolver 对)、`RZ/zZ/BZ/VZ/HZ`（模块级状态机，§4） |
| 消费者 | 163,354（R11 菜单装配 `Ze = IQe({...})`）、163,892（`UZ(y)` 初始广播）、124,270（`LQe()`，toggle-trace-recording 消息）、158,575-158,581（R11 renderer confirm 回填：`DQe()/OQe()/AQe()/jQe()`） |
| 跨 chunk | `RQe` 动态 `require('./upload-D8KNqeRP.js')`（122,347）——**upload chunk**（重写树 `src/main/upload/`）导出 `uploadTraceRecording` |

### I. worktree-service

| 项 | 内容 |
|---|---|
| 行区间 | 122,417-123,319 |
| 建议模块 | `worktree/worktree-cleanup.ts`（qZ/JZ/HQe/UQe/WQe/GQe/KQe/YZ/qQe + BQe logger）+ `worktree/worktree-service.ts`（XQe + QZ/$Z/ZQe/QQe） |
| 主要定义 | `XQe`(WorktreeService)、`qZ`(collectThreadMetadata)、`GQe`(isWithinCleanupBuffer)、`QZ`(appendCappedOutput，32KB 截断 + 关键行保留 `YQe` 122,504-122,510)、`QQe`(cleanupReasonToAnalyticsName) |
| 依赖 | git worker 事件（`subscribeGitWorkerEvent('create-worktree-path'|'create-worktree-setup-started'|'create-worktree-stream')`，worker 在 shared/其他 chunk）、`n.Wr`(disposables)、`a.$`(WORKTREE_CLEANUP_BUFFER_START_MS_KEY)、`n.iu`(PINNED_THREAD_IDS/WORKTREE_AUTO_CLEANUP_UNPACKAGED_OVERRIDE_ENABLED/LOCAL_PROJECTS/PROJECT_ORDER/SELECTED_PROJECT) |
| 消费者 | 123,594（r$e.ensureWorktreeService 内 new XQe，按 hostId 缓存于 worktreeServicesByHostId） |

### J. electron-message-handler（`r$e`，第二大巨类）

| 项 | 内容 |
|---|---|
| 行区间 | 123,320-125,110（~1,780 行） |
| 建议模块 | `messaging/electron-message-handler.ts`（r$e 主体）+ 按域拆 handler 文件：`messaging/handlers/browser-sidebar.ts`（~60 case）、`handlers/global-dictation.ts`（12 case）、`handlers/worktree.ts`（6 case）、`handlers/persisted-atoms.ts`、`handlers/mcp.ts`（mcp-request/notification/response）、`handlers/onboarding-workspace.ts`、`handlers/trace.ts`、`power/system-focus-state.ts`（setSystemFocusState/syncPowerSaveBlocker/updatePowerSaveBlocker + powerMonitor 接线） |
| 主要定义 | `r$e`(ElectronMessageHandler)、`eQ`(logger)、`n$e`(onboardingWindowSize)、`iQ`(isBrowserTabRouteKey)、`i$e`(win32ApprovalException) |
| handleMessage case 清单（150+，直接证据 123,638-124,651） | checkout/workspace-settings-webview-presentation-changed、open-codex-bundle、reload-bundled-plugins、debug-window-*、remote-hosted-pip-*、set-telemetry-user、ready、open-in-main-window、open-browser-in-main-window、open-current-main-window、open-in-new-window、mac-menu-bar-enabled-changed、electron-avatar-overlay-*、electron-sparkle-gates-changed、electron-desktop-features-changed、**global-dictation-*（12 个）**、power-save-blocker-set、local-thread-activity-changed、electron-set-window-mode、inbox-*（3）、archive-thread、unarchive-thread、dynamic-tools-for-thread-start-response、persisted-atom-sync-request、persisted-atom-update、persisted-atom-reset、browser-sidebar-owner-sync、browser-sidebar-sync、browser-settings-webview-*（3）、browser-sidebar-webview-destroyed、**browser-use-session-route-capture**、browser-use-session-activity-ended、browser-use-cursor-arrived、open-browser-tab、browser-sidebar-tweaks/annotation-multi-select/site-annotation-api-enabled-changed、**browser-sidebar-command（内层 22 子 case：navigate/capture-screenshot/set-interaction-mode/...）**、browser-sidebar-runtime-*（14：open-comment-preview/close-comment-preview/cancel-editor/open-editor/open-design-editor/comment-screenshot-ready/update-anchor/annotation-suspension/design-modifier-state/image-drag-*/mouse-navigation/focus-editor/exit-comment-mode/toggle-annotation-mode/request-annotation-permission）、browser-sidebar-attach-dragged-image、browser-sidebar-comment-overlay-*（10）、browser-sidebar-design-overlay-*（3）、codex-runtimes-config-changed、heartbeat-automation-thread-state-changed、codex-app-server-restart、debug-run-eval-control-*（2）、set-primary-runtime-install-release、**toggle-trace-recording**、log-message、electron-app-state-snapshot-*（2）、shared-object-subscribe/unsubscribe/set、**mcp-request**（124,312，大 case）、thread-prewarm-start、mcp-request-abandon、mcp-notification、mcp-response、fetch、cancel-fetch、pending-worktree-*（6）、show-diff、show-plan-summary、update-diff-if-open、electron-add/create/pick/update-workspace-root-option（4）、electron-onboarding-skip-workspace、open-in-browser、electron-set-badge-count、view-focused、quit-app、tray-menu-threads-changed、keyboard-layout-map-changed、app-shell-shortcut-state-changed、subagent-thread-full-fidelity-changed、electron-window-focus-request、electron-window-zoom-changed、worker-request(-cancel)、navigate-in-new-editor-tab、open-vscode-command、open-extension-settings、open-keyboard-shortcuts、show-settings、install-wsl、open-config-toml |
| 构造器接线 | powerMonitor on-ac/on-battery/suspend/resume/lock-screen/unlock-screen（123,458-123,467）；new iQe/cX/bke/tQe/SQe；settingsStore.onDidChange(disabledSiteAnnotationHostnames)（123,515）；ensureWorktreeService（123,527） |
| 消费者 | 159,794（WindowContext `this.messageHandler = new r$e(...)`，R10/R11 区） |

### K. host registry + clipboard 文件服务（R8 尾）

| 项 | 内容 |
|---|---|
| 行区间 | 125,111-125,160（s$e 类体越过 125,160 进入 R9） |
| 建议模块 | `app-server/client-registry.ts`（a$e）、`fs/clipboard-attachments.ts`（s$e + o$e）、`messaging/route-keys.ts`（iQ/i$e） |
| 主要定义 | `a$e`(AppServerClientRegistry)、`s$e`(ClipboardFileService)、`o$e`(mimeExtensionMap) |
| 消费者 | 159,161/160,111（WindowContext） |
| 边界警告 | **R8/R9 边界（125,000）切在 r$e 类体（至 125,110）与 s$e 类体（至 ~125,185）中间**——派发时建议 123,320-125,185 整簇归 R8，R9 从 p$e（125,188）起 |

---

## 4. 顶层可变状态清单

> R8 的顶层可变状态集中在 content-tracing 状态机（模块级单例）与少数 WeakMap。`let` 型可变绑定 4 个（PZ/FZ/RZ/HZ 组内）。logger 句柄（`r.i(...)` 惰性）不算副作用状态，但列出以完整。

| 名 | 行号 | 类型 | 语义 | 读写方 |
|---|---|---|---|---|
| `LX` | 115,560 | Array | incomplete-navigation delivery 函数栈（`IXe.subscribe` push / `unsubscribe` splice） | `IXe`（115,582/115,586）写、`RX`（115,596）读栈顶 |
| `sZ` | 116,156 | WeakMap | webContents → resize observer 注册项 {observer, handleDestroyed} | `pZe`（117,473）写、`mZe`（117,476）读/删、117,471 配对清理 |
| `cZ` | 116,164 | WeakMap | webContents → layout observer（`dZ` 117,359 使用） | `dZ`（117,365-117,366）写、`fZe` 读 |
| `xZ` | 118,612 | WeakMap | page → 截图缓存 {navigationVersion, webContents, url, completedAt, lastPresentedSequence, presented, result} | `HZe`（118,636 读 / 118,667 写 / 118,669 失效删除） |
| `PZ` | 122,159 | null \| resolver | trace 开始确认 pending promise resolver | `EQe`（122,164）写、`DQe`/`OQe`（122,170/122,175）消费 |
| `FZ` | 122,160 | null \| resolver | trace 上传详情 pending promise resolver | `kQe`（122,181）写、`AQe`/`jQe`（122,186/122,191）消费 |
| `RZ` | 122,218 | string | content-tracing 状态机（'idle'/'recording'/'awaiting-start-confirmation'/'saving'/'awaiting-upload-details'/'uploading'） | `WZ`（122,391）写、`zQe`（122,415）读、`IQe` 闭包读写 |
| `zZ` | 122,219 | null \| number | trace 开始时间戳 | `IQe`（122,248/122,262/122,304） |
| `BZ` | 122,220 | null \| truthy | trace 输出格式标志（pftrace vs json） | `IQe`（122,256/122,261/122,319）——采样推断：与 extension backend 协商相关 |
| `VZ` | 122,221 | null \| timer | trace buffer 使用率轮询 timer（1s，unref） | `GZ`（122,409）写、`WZ`（122,390）clear |
| `HZ` | 122,222 | null \| fn | 当前 toggle handler（菜单项 click 与 `LQe` 共享） | `IQe`（122,327）写、`LQe`（122,343）读 |
| `NQe` | 122,215 | boolean | `process.env.CODEX_TRACE_SHORTCUT != null`——模块加载期 env 读取 | `IQe`（122,331）读 |
| `EZ` | 119,179 | string | `join(__dirname, 'browser-page-preload.js')`——模块加载期求值的 preload 路径 | `tQe` 构造（120,887 preloadPath / 120,943 browserPagePreloadPath） |
| logger 句柄 | — | — | `LY`(111,431)、`iX`(112,999)、`aX`(113,094)、`QYe`(114,355)、`_Xe`(115,218)、`CXe`(115,294)、`FXe`(115,559)、`UX`(115,846)、`$X`(116,148)、`hZe`(117,481)、`JZe`(118,873)、`eQ`(123,320)、`nQe`(121,304)、`IZ`/`CQe`(122,193/122,092)、`BQe`(r.r, 122,417)、`ZZ`(122,512) | `r.i(name)` 惰性创建；**browser-sidebar-manager 在 R8 内 8 个句柄**（QYe/_Xe/CXe/UX/$X + tQe 内 119,187 + vZe 内 117,579 + 118,873 JZe screenshot）——重写时合并为单一 logger 实例 |

类内可变状态（同样需要迁移，采样列举）：`DYe.tabsById/debuggerListeners/allowedDownloadGrantsByWebContentsId/cursorArrivalWaitersByMoveSequence`（111,438-111,465）、`cX.sessionRoutes/backendStatesBySessionId/debugEvents`（113,109-113,117）、`ZYe.openingPagePromisesByBrowserTabId`（114,238）、`IXe.delivery`（115,562）、`vZe.attachedWebviewHosts/lifecycleSequence`（117,578-117,580）、`xZe.activeConversationByWindow/selectedTabsByWindow/workingSetExpiryTimersByWindow`（118,122-118,124）、`$Ze.apiEnabled/availabilityListeners`（118,945-118,946）、`eQe.pending`（119,068）、`tQe.windows/lastSyncedWindowId/browserUseOpenRequests/activeDraggedImagesByOwnerWebContentsId`（119,189-119,199）、`SQe.appStateHeartbeat/appStateSnapshotRequestById/performanceCpuSamplingById`（121,957-121,960）、`XQe.statesById/newbornWorktreeRoots/cancelledWorktreeStreamIds/cleanupRunning`（122,515-122,521）、`r$e.sharedObjectSubscribers/primaryWindowRestoreBounds/powerSaveBlockerId/isSystemSuspended/isScreenLocked/powerSave*WebContentsIds/pendingDynamicToolsForThreadStartRequests/worktreeServicesByHostId`（123,355-123,394）。

---

## 5. 顶层副作用序列

**本区间应用代码没有模块加载期的可观察副作用**（直接证据：列 0 表达式语句扫描 + 逐条核对）。全部条目：

| 行号 | 语句 | 语义 | 置信度 |
|---|---|---|---|
| 107,000-109,454 | zod v4 类定义/静态绑定/enum IIFE | vendored 内部（随 npm 包消失） | 高 |
| 109,486-109,501 | `(PJ.extend({...}), $({}), DJ(PJ), $({id: Z()}), ...)` —— **~20 个匿名丢弃 schema 表达式语句**（var 链续行的括号表达式） | 与 R7 102,420 同型：构造结果不绑定、不被引用（紧邻的 `NJ`/`TKe`/`PJ`/`kKe`/`FJ` 才是被用的）。疑似源码类型级声明经压缩后的残留；**重写时直接删除（无运行时影响）** | 高（逐条核对该区间所有列 0 语句均为 schema 构造） |
| 111,162 | `ZJe([yJe, oJe, kJe, dY, fY])` | tab capability 注册表 Map 构造（纯内存，无 I/O） | 高 |
| 111,362 | `uYe([aYe, wY, FY])` | browser capability 注册表 Map 构造（纯内存） | 高 |
| 111,366 | `$({ side_effects: DJ(Z()) }).passthrough()` | 匿名丢弃 schema（同 109,486 群） | 高 |
| 122,215 | `NQe = process.env.CODEX_TRACE_SHORTCUT != null` | 模块加载期 env 读取（无副作用，拆分后保持求值时机即可） | 高 |
| 119,179 | `EZ = (0, h.join)(__dirname, 'browser-page-preload.js')` | 模块加载期路径拼接（无副作用） | 高 |

**所有 Electron/定时器/事件接线都在构造器或工厂被调用时**：
- `r$e` 构造器（123,395-123,528）：powerMonitor ×5、settingsStore.onDidChange、new cX/bke/tQe/SQe/iQe、ensureWorktreeService——消费者 159,794（WindowContext，R10/R11）；
- `tQe` 构造器（119,239+）：new LGe/XHe/BWe/hGe/qZe/$Ze/eQe/xZe/vZe/Vae + `SWe`（120,846）webview 生命周期接线——消费者 123,487；
- `SQe` 构造器：`setInterval` 30s heartbeat（121,968，unref）+ `mainThreadJankSampler.start()`（121,972，内部 powerMonitor ×2 + setInterval 100ms unref）；
- `JYe`（native pipe server）：`ql(...)` 建管道——消费者 `cX.ensureBackendForSession`（114,058）；
- `IQe`（content-tracing 菜单项工厂）：**不启动录制**，只构造菜单项描述符；`contentTracing.startRecording` 在 click 处理器内（122,243）——消费者 163,354（R11 菜单装配）。

这与 R7 的「纯库区、副作用延迟到装配期」模式一致；与 bootstrap「模块加载即接线」相反。

---

## 6. 跨 chunk 依赖

### 6.1 @chunk/shared（`n.*`，绑定自 `./src-DldfpmrL.js`）

R8 内 `n.*` 真实引用（排除单字母参数遮蔽噪声后的主要面）：

| 类别 | 符号 | 用途（行号证据） |
|---|---|---|
| zod schema 工厂（**v3 风格实例**，与 vendored v4 并存，见 §2 警告） | `n.wf/n.Of/n.Cf/n.bf/n.df/n.hf/n.gf/n.Mf/n.jf` | IAB sidebar schema：`qYe`(113,002)、`wZ/GZe/KZe`(118,693-118,695)、`KZe`(118,695 权限应答)、`AZe`(118,372 site annotation)、`NZe`(118,415 webmcp annotations) |
| EventEmitter 基类 | `n.Uf` | `IXe`(115,561)、`s$e`(125,150) |
| 设置键 | `n.Ba` | siteAnnotationPermissionAnsweredHostnames/disabledSiteAnnotationHostnames（118,971/119,053）、downloadDirectory/promptForDownloadLocation/turnMode（123,507/123,510/123,264）、primaryNumberShortcutTarget（`n.Ia` 123,503） |
| global-state 键 | `n.iu` | PINNED_THREAD_IDS（122,457）、WORKTREE_AUTO_CLEANUP_UNPACKAGED_OVERRIDE_ENABLED（122,501）、LOCAL_PROJECTS/PROJECT_ORDER/SELECTED_PROJECT（123,251-123,257） |
| 路径/目录 | `n.Ns`(cwd 规范化，8 处 122,708-124,959)、`n.G`(路径规范化，122,464/122,468/122,494-122,496)、`n.zi`(wsl 判定，125,104)、`n.Di`(app-server fs stat/mkdir，122,431/125,201) |
| host 判定 | `n.Es`(remote host，125,224)、`n.Os`(ssh，121,315) |
| 集合工具 | `n.Wr`(disposables 聚合，122,519)、`n.Sc`(TTL map，121,958)、`n.Ct`(keymap state，119,246/123,501) |
| browser 常量 | `n.lu`(tab type WEB，115,601/117,296)、`n.gu`(annotation mode BATCH/QUICK，116,158) |
| 其他 | `n.V`(worktreeId from path，123,207/122,723/122,906/122,915)、`n.$`(countFolderFiles，125,156)、`n.ms`(desktop config 解析，122,479)、`n.ef`? | 部分为采样推断 |

### 6.2 @chunk/logger（`r.*`）

`r.i(name)` × 14 个名字（§4 表）+ `r.r('worktree-cleanup-service')`（122,417，**r.r 直接创建**，非惰性——与 r.i 不同，模块加载期即建 logger，但 logger 创建本身无外部副作用）。无 `r.n`/`r.a` 用法。

### 6.3 @chunk/bootstrap（`a.*`）——语义名对照重写树 `src/main/bootstrap/`

| 符号 | 重写语义名 | R8 用途（行号证据） |
|---|---|---|
| `a.on` | `appSessionId`（`bootstrap/net/network-policy`） | cX 构造默认参（113,118）、r$e 构造（123,468 `new cX(a.on, S, ...)`） |
| `a.in` | `BuildFlavor` | cX 构造默认参（113,118 `a.in.Dev`） |
| `a.hn` | `requireNativeIntl`（intl formatMessage） | content-tracing 对话框/菜单 i18n（122,270/122,357/122,412） |
| `a.en` | `tC`（vendor，async context store） | IXe.subscribe 的 AsyncLocalStorage 风格包装（115,574-115,580 `.u/.e/.d`） |
| `a.$` | `WORKTREE_CLEANUP_BUFFER_START_MS_KEY` | `GQe` 清理缓冲起点（122,483） |
| `a.At` | `MESSAGE_FOR_VIEW` | **renderer 消息通道名**：sendMessageToView/sendCritical（124,826/125,073）、browser-sidebar-runtime-capture-text-selection（116,696）、mcp-response 转发（124,078） |
| `a.vt` | `authedFetch` | site bootstrap token 获取（116,089，rZe 内） |

### 6.4 electron（`l.*`）

`l.powerMonitor`（123,458-123,467 r$e 接线；121,897-121,921 vQe jank sampler；125,048 syncPowerSaveBlocker）、`l.contentTracing`（122,243/122,258/122,398）、`l.powerSaveBlocker`（125,052-125,054）、`l.app`（getAppMetrics/getGPUFeatureStatus/getGPUInfo/commandLine/getVersion/getPath，122,094-122,153/123,498）、`l.BrowserWindow`（113,194/118,602/121,884/122,284/125,036）、`l.clipboard`（118,876）、`l.dialog`（122,271/122,358）、`l.Menu`（122,342）、`l.screen`（124,685）、`l.shell`（122,292/122,386）。

### 6.5 动态 chunk 依赖

| chunk | 引用点 | 用途 |
|---|---|---|
| `./upload-D8KNqeRP.js` | 122,347（`RQe` 内动态 require） | `uploadTraceRecording`——trace 上传（重写树 `src/main/upload/`） |
| `./browser-page-preload.js` | 119,179（`EZ` 路径）→ 120,887/120,943 | IAB webview preload（**路径注入**，本区不解析内容；preload↔main 通信面见 §6.6） |

### 6.6 与 browser-page-preload chunk 的通信面（R8 侧）

- `a.At`（MESSAGE_FOR_VIEW）通道上的结构化消息：`browser-sidebar-*`（tab-lifecycle/usage/browser-use-state/tab-capture-state/find-state/screenshot-copied 等）、`electron-app-state-snapshot-request/-response`（121,984/122,014）、`trace-recording-state-changed/-uploaded`（122,339/122,307）、`electron-window-focus-changed`（125,030/125,038）、`global-state-updated`（123,250）、`workspace-root-options-updated`（123,260）、`open-browser-tab`（114,668）、`remote-workspace-root-requested`（121,443）；
- `handleMessage` 的 150+ case（§3.J）就是 preload 转发的 renderer→main 消息面——**这是 preload chunk 频道表必须对齐的契约**（R7 侧 PBe handlers 表是另一个契约，两者共同构成完整 RPC 面）；
- `kZ.send` 的 background throttling 过滤（121,345-121,369）决定后台线程窗口能收到哪些消息——preload 侧无感知，纯 main 侧策略。

### 6.7 同 chunk 跨区域引用

| 符号 | 定义行（区域） | 在 R8 的用途 |
|---|---|---|
| `lte` | 2,762（R1 命令分发器） | `hYe` 把 visibility/viewport 命令路由到 IAB host（111,377） |
| `Tr()` | 3,372（R2 desktop feature availability） | `autoAuthForSites`（116,141/116,074）、`browserExtensions`（123,475）、`unifiedTabStrip`（123,502） |
| `ql`/`Ql`/`ite`/`Bl`/`Vae` | 13,563/13,806/2,662/13,139/11,158（R2） | native pipe server/peer authorizer/协议类/帧错误/导航限制（JYe 113,018-113,067；tQe 119,218 new Vae） |
| `J` | 8,574（R2，`'local'`） | tQe/r$e/a$e 的默认 hostId（119,239/123,426/125,126） |
| `IT`/`bke` | 64,022/69,356（R5） | r$e 的 dynamicAppToolResponses / browserAutocompleteCoordinator（123,383/123,469） |
| `QBe`/`NHe`/`XHe`/`LGe`/`qGe`/`BWe`/`hGe`/`SWe`/`JWe` | 98,144/99,218/99,788/106,150/106,783/102,179/103,975/101,479/102,581（**R7**） | tQe 构造器组合（119,239-119,400）——**R8 的 tQe 是 R7 各工厂的 composition root**（与 R7 §6.5 结论闭环） |
| `ZBe` | 98,090（R7 站点状态） | tQe 构造参数 `ZBe({appServerClient})`（123,491） |
| `ct` | 527（R1 min-interval gate） | SQe appStateTriggerMinIntervalGate（121,959） |
| `He` | 412（R1 URL 端口解析） | `OZ` 远程 localhost 端口提取（121,312） |
| `WU`/`Nr`/`Lr`/`Pte`/`Fr` | 99,214/3,465/3,496/3,512/3,472（R7/R1） | browser-use-state 广播（117,556/121,556）、workspace roots 读写（123,253-123,254） |
| `qU`/`KU`/`oX` | 99,286/99,283/113,095（R7/R8） | page key/route key 构造（全 IAB 区） |
| `r$e`/`tQe`/`cX`/`kZ`/`a$e`/`s$e`/`iQe`/`uQe`/`SQe`/`XQe` 的消费者 | 159,161-160,398（R10/R11 WindowContext）、163,354/163,892（R11 菜单）、158,575（R11 trace confirm） | R8 是被调用方 |

---

## 7. 拆分风险

1. **zod 双实例混用（最大结构性风险）**：browser-use 工具 schema（109,475-111,421）用 vendored zod v4（`$`/`Z`/`MJ`/`_q.parse()`），IAB sidebar schema（118,306-118,703）用 shared chunk 的 `n.*` zod（v3 风格）。两套 API 形似（`$({})` vs `n.wf({})`）但行为不同（strict/refine/loose/passthrough）。拆分时若统一 import 一个 zod，`_q.parse()` 的错误格式与 `safeParse` 行为差异会破坏 native pipe 协议校验。建议：browser-use 协议层固定 zod v4，sidebar 层固定 shared 实例，各自显式标注。
2. **`r$e.handleMessage` 是 renderer↔main 消息契约**：150+ case 的消息名（§3.J 清单）与 preload chunk 的发送面一一对应。任何 case 名改动都会破坏 renderer。建议机械保留全部消息名，先做依赖注入结构化（26 个构造参数 → options 对象），行为零变更；case 体可按域拆文件但 switch 骨架保留。
3. **`tQe` 构造器默认参数的求值时机**：`constructor(e, t, r = J, i = QBe(), a = new cX(), o = NHe(), s = {})`（119,239）——默认参数在调用时求值，`new cX()` 意味着**不传参就会新建 registry**。实际调用（123,487）显式传入了 r$e 持有的 cX 实例。重写为 options 对象时必须保持「registry 由外注入、默认值仅用于测试」的语义，否则会出现两个 registry 各持一份 sessionRoutes。
4. **`gZe` 窗口转移是 Owl 专有 API**（117,508 `createWebViewTransfer(n.owner)` + token + `receiver.attach({kind:'browser', data:{token}})`）：webContents 跨窗口迁移协议，`moved`/`not-moved`/`closed` 三态 + `pendingWindowTransfer` 双侧记账 + 失败回滚（117,564-117,568）。与 R7 §7.2 的 owl adoption lease 同属 Owl shell 补丁面——重写需要 Owl API 清单，且失败分支的 teardown 顺序不能简化。
5. **content-tracing 模块级单例状态机**（`RZ/PZ/FZ/zZ/BZ/VZ/HZ`，§4）：菜单项工厂 `IQe`（163,354 R11 装配）、消息触发 `LQe`（124,270）、renderer confirm 回填（158,575-158,581 R11）**三个区域共享同一组模块级闭包变量**。拆分成模块后需显式导出状态机对象（或改为类），不能让三处各自持副本。`GZ` 的 1s buffer 轮询（0.99 自动停）与 `VZ` timer 的 clear 配对（122,390）时序敏感。
6. **powerMonitor 双重接线**：r$e（123,464-123,467，suspend/resume/lock-screen/unlock-screen → setSystemFocusState）与 vQe jank sampler（121,912-121,921，suspend/resume → isSuspended）各自监听。两者语义独立（焦点广播 vs jank 计数暂停），拆分时不能合并 listener；`setSystemFocusState` 的边沿检测（`r === i` 早退 125,027）依赖初始 `!isSystemSuspended && !isScreenLocked`。
7. **`kZ.send` 的 background throttling 过滤**（121,345-121,369）：后台节流窗口只放行 `mcp-request`/`mcp-notification` 且必须 `ownsBackgroundThread(hostId, threadId)`——这是后台线程窗口消息路由的核心策略，`mcp-response`/`codex-app-server-initialized`/`codex-app-server-connection-changed` 显式豁免。重写时漏掉豁免清单会导致后台线程收不到响应。
8. **`DYe` CDP debugger 会话管理与 R7 的 debugger attach 互斥**（R7 §7.6 同源风险升级）：R8 的 DYe 自行维护 `debuggerTargetSessionsByTabId/debuggerTargetIdsBySessionId` 并伪造 TargetInfo（`HY/AYe` 112,815-112,827），R7 的 `GU`（颜色同步）与 `VUe`（checkout 网络观察）也在 attach debugger。三方叠加在同一 webContents 上的 detach 时序敏感——重写建议统一 debugger 会话管理器。
9. **worktree 输出截断保真**：`QZ`（123,287-123,297）32KB 截断时用 `YQe` 关键行表（`[info] Refreshing upstream...` 等 5 行，122,504-122,510）做前缀保留——这些字符串是对 git worker 输出的**逐字匹配契约**，改动任何一边都会破坏截断语义。
10. **`xZe` tab 预算的 suspend 保护**：`hZ = 32` tab 上限 + `gZ = 18e5`（30 分钟）working set 过期 + `isTabProtectedFromSuspension`（118,144）——`enforceDetachedPageBudget` 在 restore/suspended 进行中时整体跳过（118,155-118,159）。拆分时若把预算检查改为异步，会在 restore 中途 suspend 页面。
11. **`xZ` 截图缓存失效条件**（118,636-118,648）：命中条件 = navigationVersion/webContents/url 相同 **且**（completedAt 未超 `VZe` 1s（presented 页）或 lastPresentedSequence 一致（未 presented 页））。这是「快速连续截图」的 dedup 语义，简化失效条件会返回陈旧截图。
12. **`sZ`/`cZ` observer 注册必须配对**：`pZe` 注册（117,473）与 `mZe` 注销（117,476）+ `destroyed` 事件清理（117,471）三路配对；漏配对会泄漏 ResizeObserver 或在 destroyed webContents 上调用。
13. **upload chunk 动态 require 的加载时机**：`RQe`（122,346-122,347）在 trace 停止后才动态 require——重写为静态 import 会改变包体/启动时机（原版刻意延迟加载 upload 依赖）。保持动态 import。
14. **边界跨越**：R8 名义区间 107,000-125,000，但 `r$e` 类体到 125,110、`s$e` 类体到 ~125,185。R9 派发应从 `p$e`（125,188）起；125,111-125,185（iQ/i$e/a$e/o$e/s$e）归 R8 侧 agent。同 chunk 内 `c$e`/`l$e`（125,166/125,174）是 s$e 的辅助，随 s$e 走。
15. **`handleMessage` 的 `mcp-request` 大 case**（124,312-124,395）：MCP 请求转发含 `kZ` 端点构造 + abandonment + response 路由，与 `IT`（64,022 R5 dynamicAppToolResponses）协作——跨区符号，拆分时与 R5 agent 核对。

## 待确认清单（下游复核）

- `n.V`（path → worktreeId，7 处）与 `n.$`（countFolderFiles）在 shared chunk 导出表中的语义名。
- `BZ`（122,220/122,256）的 pftrace 格式判定来源——采样推断与 extension backend（`EKe` 的 'extension' 类型）协商相关，需沿 `setTraceUploadFormat` 类调用链复核（若存在）。
- `IT`（64,022）与 `LT`（wait key 构造）的完整语义（R5 区，r$e 的 dynamicAppToolResponses 依赖）。
- `bke`（69,356）browserAutocompleteCoordinator 的 createController 协议（R5 区，r$e 构造 123,469）。
- `ite`（2,662）native pipe 协议类的帧格式与 `kn` 基类（R2 区，`JYe` 依赖）。
- upload chunk（`./upload-D8KNqeRP.js`）的完整导出面（重写树 `src/main/upload/` 是否已覆盖 `uploadTraceRecording`）。
- `handleMessage` 150+ case 的完整 dump（本区 grep 到清单见 §3.J，建议 dump 成机器可读清单与 preload chunk 的发送面对照）。
- `n.iu.WORKTREE_AUTO_CLEANUP_UNPACKAGED_OVERRIDE_ENABLED` 等 global-state 键的 shared 侧定义（shared 导出映射表完成后回填）。
