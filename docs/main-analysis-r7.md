# main-C-Mhak1n.ts R7 深度分析（95,000-107,000 行）

目标：`src/main/main-C-Mhak1n.ts` 的 95,000-107,000 行（R7）。
来源：macOS ChatGPT.app（Codex 桌面版 v26.917.71314）主进程 chunk。
方法：与 `docs/bootstrap-analysis.md` / `docs/main-analysis-r1-r2.md` 同一方法论——200-400 行窗口采样 + 关键区域（类定义头、区域边界、副作用语句、实例化点）精读；所有行号经 `grep -n` 核实。结论标注置信度：**直接证据** = grep/原文引用支撑；**采样推断** = 窗口采样得出，需下游复核。

**工具坑（沿用粗扫 §9.2）**：本机 grep 为 ugrep 7.8.4，BRE `\|` 多模式静默失效。本文所有多模式扫描均用 `-E 'a|b'` 或分开单模式完成。

## 0. 总览与对粗扫的重要修正

1. **应用代码精确边界：95,000-106,857；vendored zod v4 从 106,858 起（直接证据）**。106,858 是 `var _q = class { type; schema; payload; ... }`（zod v4 core 的错误/issue 载体），紧跟 106,873 `vq` util IIFE（`assertEqual/arrayToEnum/objectKeys/find/isInteger/joinValues`，106,873-106,916 逐字符对应 zod v4 `core/util.ts`）、106,921 `yq = vq.arrayToEnum(['string','nan','number',...])`（ZodParsedType 表）。粗扫 §7 估计 ~106,858 正确。本区应用代码共约 **11,858 行**。
2. **修正一：R7 的真实主题分布与粗扫标题不符**。粗扫把 95,000-107,000 标为「browser sidebar / IAB / checkout-webview / workspace-settings-webview」，实际：
   - **95,000-100,150（约 40%）与 browser sidebar 无关**：saved-sections 尾部 + pinned threads service（95,000-95,580）、link-opening（95,582-95,859）、workspace **settings service**（95,860-96,037）、**electron-fetch-handler 巨类 `PBe`（96,206-97,879，~1,670 行）**、SFTP/avatar-overlay/快捷键杂项（97,880-98,522）、comment-mode 站点状态（98,086-98,143）。
   - browser sidebar 主体在 **98,523-103,934 + 103,935-106,033（comment controller/截图）**；
   - 三个受限 webview（ChatGPT 插件认证/checkout/workspace-settings）只占 **99,777-101,452**；
   - 下载管理与 tab 检索在 **106,034-106,857**。
   最大的单块是 `PBe`（electron-fetch-handler），粗扫完全没识别到它——它是全 app 的 **renderer→main RPC 分发中枢**（见 §3 聚类 E）。
3. **修正二：`CBe extends sBe`（95,950）不是 sidebar 继承体系，而是 workspace settings service**（粗扫 §3.3 置信度中，现修正为高）。直接证据：`sBe`（95,514，`var oBe = n.wf({userId,accountId,authMethod,stableId,policy})` 同一 var 语句）是设置服务抽象基类（`readAll/readForAgent/subscribe`）；`CBe`（95,950）`configWriteConfirmations = new xBe()`、`read/getEffective/write/writeForAgent`、报错串 `Unknown setting` / `Setting cannot be written by Codex`（95,990-95,991）、`conversationDetailMode` work-mode 策略（95,971-95,978）。实例化点 96,351：`this.settings = new CBe(settingsStore, afterWrite, statsig)`（PBe 构造函数内）。它是个「设置门面」，与 browser 无关。
4. **修正三：106,034 `FGe` 不是「等待渲染进程响应」**（粗扫 §3.3 置信度中）。直接证据：`FGe`（106,034-106,076）是 **headless 下载视图**——`new l.WebContentsView({webPreferences:{session, sandbox:true}})` → `webContents.downloadURL(url)` → 60s 超时，`consume(item, webContents)` 由下载事件认领。它被 `LGe.linkDownloads`（106,154）持有，用途是把 URL（如 checkout 侧的文件链接）在无 UI 的情况下下载。粗扫的「pending(webContents.id)+60s」描述对，语义猜错。
5. **`codex_desktop:` IPC 只有 2 处（101,838/101,846）且不是 ipcMain**：它们是 browser sidebar guest webContents 上的 **`ipc-message-sync` 同步 IPC 应答**（preload 发起）：`codex_desktop:get-browser-annotation-api-policy`（返回站点注释 API 策略，win32 用 setImmediate 延迟应答）与 `codex_desktop:get-browser-webmcp-policy`（返回 WebMCP 启用状态与限额 `maxTools/maxTotalDescriptorBytes`，101,846-101,855）。主 IPC 频道面仍在 bootstrap（见 bootstrap-analysis §E）。
6. **本区间没有模块加载期的可观察副作用**（无 Electron 事件接线、无 fs I/O、无定时器、无 logger 创建——所有 `r.i(...)` 都是惰性句柄函数，首调才建 logger）。唯一的列 0 表达式语句是 102,420 的匿名丢弃 schema（见 §5）。全部接线都发生在工厂函数被消费者调用时（`SWe`/`RUe`/`uWe`/`lUe` 等，消费者在 R8/R12）。

---

## 1. 区域地图（行区间，每子区域 ≤1500 行）

| 行区间 | 类型 | 语义名 | 概述 |
|---|---|---|---|
| 95,000-95,317 | 应用 | saved-sections 尾部（跨 R6/R7 边界） | `kH`（94,941 thread 键）、`AH`（94,944 pendingDeletion 投影）、`rBe`（94,962 查询对象：readList/readMembers/commitList/commitMembers + `Symbol.dispose`，hostId 越界守卫串 95,068）。本簇起点在 R6（94,121 `gH`），R6/R7 边界（95,000）切在 `rBe` 类体中间——派发时建议整簇 94,121-95,317 归 R6 |
| 95,318-95,581 | 应用 | pinned threads service | `aBe`(95,318)、`jH`（95,321，`class extends n.Uf`，list/set/setOrder：本地 pin + app-server pin 双轨，`01984de2-8f74-7c91-a3b2-5c5e937cf318` 内置 section id 直接证据）、`oBe` work-mode schema(95,507)、`sBe` 设置服务基类(95,514)、`cBe` 退订句柄(95,569)。实例化：96,360 `new jH(...)` |
| 95,582-95,859 | 应用 | link-opening | `MH` http(s) 判定(95,582)、`NH = r.i('link-opening')`(95,590)、Slack 链接提升原生 app（`lBe slack://`、`uBe` archives 正则、`gBe` slack.com/api/auth.findTeam 解析 + `PH` team_id 缓存、`_Be`/`yBe`/`bBe` 判定，95,591-95,858）、**`IH` 打开链接总入口**（95,600-95,753：openTarget 决策 → codex deep link → slack 原生 → `toggle-browser-panel` inline 消息 → shell.openExternal；被 100,588/101,172/121,072/124,569/140,259 复用） |
| 95,860-96,037 | 应用 | workspace settings service | `xBe`（95,860 agent 设置写确认 broker：pending/listeners/subscriptions + abort 信号，`Settings service unavailable.` 串）、`SBe` 退订句柄(95,934)、**`CBe extends sBe`**（95,950-96,025 设置服务门面，见 §0 修正二）、`zH` 账号匹配(96,026)、`BH` 系统 backdrop 探测(96,033) |
| 96,038-96,194 | 应用 | third-party-notices + 目录/路径工具 | `VH = 'THIRD_PARTY_NOTICES.txt'`(96,038)、`HH` 候选路径(96,040)、`TBe` pnpm workspace 根探测(96,050)、`EBe` dev 重新生成(96,059)、`DBe` 读取(96,070)、`OBe/kBe/ABe` **remote-workspace-directory-entries**（app-serverClient 上的 stat/readdir + 符号链接/workspaceRoot 越界校验，96,082-96,173）、`jBe/UH/MBe/WH` 路径规范化(96,174-96,193)、`GH = !!process.env.WSL_DISTRO_NAME`(96,194) |
| 96,195-97,879 | 应用 | **electron-fetch-handler（`PBe` 巨类）** | `KH = r.i('electron-fetch-handler')`(96,195)、`qH` 禁写 state 键(96,196)、`JH/NBe` global-dictation 热键 stub(96,197-96,203)、`YH`(96,204)、`XH` Not-implemented 错误(96,205)、**`PBe` 类（96,206-97,879）**：~45 个构造参数的依赖容器 + 38 个方法 + `handlers` 分发表（96,417 起，**150+ 个 kebab-case RPC 方法名**：workspace-root-options、worktree-*、git-*、remote-control-*、automations、settings-read/write、apply-patch、mcp-codex-config、download-internal-plugins、third-party-notices、computer-use-*、node-repl-* 等，直接证据）。实例化：159,611 `this.fetchHandler = new PBe(...)`（WindowContext，R10/R11 区） |
| 97,880-98,085 | 应用 | 杂项：截图几何/SFTP/全局热键/skills/global-state 工具 | `FBe/IBe/LBe/ZH` 截图目标 display/frame 计算(97,880-97,916)、`RBe/zBe/QH/BBe/$H` **SFTP 批处理上传/下载**（spawn sftp -b -，97,918-97,961）、`VBe/eU` OS 全局快捷键校验(97,963-97,977)、`HBe` bundled skills root(97,978)、`UBe/WBe` global-state 稀疏对象写（maxEntries/maxBytes 驱逐，97,986-98,015）、`GBe/tU/KBe` avatar-overlay 消息分派(98,016-98,084) |
| 98,086-98,143 | 应用 | comment-mode 站点状态 | `qBe` schema(98,085)、`nU = r.i('browser-sidebar-comment-mode-site-status')`(98,086)、**`ZBe` 工厂**（98,090-98,143：`/aura/site_status` 后端查询 + 24h 缓存 Map + in-flight 去重；`QBe` 空实现降级 98,144）、`rU/$Be` hostname 规范化(98,147-98,159)。消费者：123,491（R8 IAB manager） |
| 98,160-98,522 | 应用 | 浏览器 zoom/键匹配工具 | `iU..aU` Ctrl+/-/0 zoom 命令判定(98,160-98,187)、`rVe/iVe/aVe` 修饰键/键名映射表(98,188-98,218)、`oU/sU/oVe` **accelerator 字符串 ↔ 输入事件匹配器**（CmdOrCtrl/Command/Ctrl/Alt/Option 解析，98,219-98,340）、`uVe/uU/dU/fU/pU/mU/hU/dVe/gU/_U/fVe/vU/yU` **app-shell 键盘分派**（terminal 聚焦/undo-redo/image-preview zoom/browser-sidebar-command/close-active-app-shell-tab，98,341-98,522） |
| 98,523-99,762 | 应用 | browser-sidebar：图片附件 + 错误页 + 页面状态 | `pVe = r.i('browser-sidebar-manager')`(98,523) + `bU` WeakMap(98,524)；`mVe` 图片附件挂起(98,525)、`xU` session.fetch 图片→dataUrl→`browser-sidebar-image-attachment`(98,540)、`CU/vVe` 工具(98,627-98,640)；`wU` 截图尺寸约束(98,641)、`EU/DU` 注释/浏览快照切换(98,648-98,673)；vendored lodash.escape（98,674-98,687，见 §2）；i18n 消息 id 常量带（98,688-98,746，`browserSidebar.contextMenu.*`/`loadError.*` 直接证据）+ 2 个内嵌 base64 图标(98,745-98,746)；错误页工厂 `MU/wHe/THe/EHe/NU/PU/FU/IU/DHe/OHe`（98,747-99,159，**内嵌完整 HTML+CSS+JS 模板**，`about:blank#codex-browser-sidebar-attach-token` 协议 99,211）；序列化/导航工具 `LU/kHe/RU/zU/AHe/BU/VU`(99,161-99,209)、`jHe/HU/MHe/NHe`（viewport env `CODEX_BROWSER_USE_DEFAULT_VIEWPORT_SIZE`、debugger 颜色同步 `Emulation.setEmulatedMedia` + 1s 超时，99,210-99,257）、`GU/PHe/KU/qU/JU/YU/XU/ZU/QU/$U/eW/tW/nW/FHe/rW/iW/aW/IHe/oW/sW/cW/lW/LHe` 导航历史/页面状态工具（99,258-99,460） |
| 99,464-99,787 | 应用 | browser-sidebar page store | `zHe = r.i('browser-sidebar-page-store')`(99,464)、`uW/UHe/WHe` zod schema（99,468-99,497）、**`GHe` 持久化 store**（99,498-99,662：entries Map + maxBytes 64MiB/maxPages 100 + JSON 落盘 `browser-sidebar-page-states.json`）、**`YHe` 门面**（99,682-99,787：enablePersistence/reassociate/deleteOwned/persistWindowBeforeShutdown/registerWindowShutdown——窗口 close/query-session-end 时落盘）、`XHe` 工厂(99,788)、`ZHe` 冷恢复快照(99,791)。消费者：119,251（R8） |
| 99,788-100,157 | 应用 | first-party-plugin authenticated ChatGPT webview | `EW = r.i('first-party-plugin-authenticated-chatgpt-webview')`(99,977)、`DW/OW/kW` 状态(99,978-99,980)、`AW/jW` partition 判定(99,981-99,986)、**`lUe` will-attach-webview 钩子工厂**（99,987-100,022：partition 前缀 `st = 'codex-first-party-plugin-authenticated-chatgpt-'`（526 行定义）→ 强制 sandbox/contextIsolation 等加固）、**`uUe` webContents 装配**（100,023-100,137：导航白名单锁 + `setWindowOpenHandler` deny + destroyed 时清 cookies（`OW` promise 链）、`about:blank?toUrl=&accountId=` bootstrap 解析 `dUe`）、**`xW` 认证 handoff**（99,833-99,874：清 `_account*` cookies → `sUe` link-session（页面内 fetch 或 POST extraHeaders）→ 写路由 cookies）、`aUe` accounts/check v4 查询(99,878)、`CW` planType 轮询(99,902)、`oUe/sUe/wW/TW` JWT exp 解析(99,910-99,969)、`cUe/MW` origin 守卫(99,970-99,976)。消费者：173,316（R12） |
| 100,158-101,086 | 应用 | **checkout-webview** | `NW = r.i('checkout-webview')`(100,158) + 5 个模块级 Map/Set/WeakMap（100,159-100,163，见 §4）；URL 常量带（`pay.openai.com`、`pm-redirects.stripe.com`、paypal set、`/checkout/`、`/payments/success*`，100,164-100,193）；**`IUe` webPreferences 加固**（100,194-100,217，partition ∈ codex-checkout/codex-credit-*/codex-pricing-*）、`GW/KW/LUe/zUe` partition/呈现判定(100,218-100,289)、**`RUe` attach 工厂**（100,241-100,286：will-attach-webview 队列 + did-attach 分派 `BUe`；消费者 173,282 R12）、**`BUe` 会话状态机**（100,290-100,591：个人订阅更新轮询（`WW` 退避表 0,500×20,15s,30s）、business 完成、credit/rate-limit-reset 完成、`onReturnToCodex`、auth token 预取 `z/R/qUe`）、**`VUe` CDP 网络观察**（100,613-100,713：debugger attach 1.3 + Network.enable，监听 Stripe `payment_intents/*/confirm`（credit payment confirmed）与 `/backend-api/subscriptions/update`（plan 变更））、`GUe/JW/YW/FW` 预热/串行队列(100,595-100,801)、URL 谓词群 `eG..gG..aWe/_G`(100,802-101,086，全部围绕 chatgpt.com origin `ie`（66 行定义）) |
| 101,087-101,452 | 应用 | **workspace-settings-webview** | `vG = r.i('workspace-settings-webview')`(101,087) + 4 个状态容器（101,088-101,091，见 §4）；**`uWe` attach 工厂**（101,111-101,153：partition 前缀 `at = 'codex-workspace-settings-'`（518 行定义）→ 加固 → `dWe`）；**`dWe` 会话装配**（101,154-101,288：导航守卫（`/api/auth/`、`/checkout/`、`/admin` 白名单）、外部链接走 `IH` external-browser、destroyed 清 cookies、**reload 重试循环**（`wG` 1s 退避，101,183-101,286）、`fWe` auth handoff(101,293)、`DG` live 计数(101,289)）；`OG/kG/AG` bootstrap URL 解析/守卫(101,318-101,357)；`jG/pWe/mWe` webview adoption 标记(101,358-101,364)、**`hWe` 同步 IPC 应答器**（101,365-101,407：`returnValue` 异步回填 + destroyed/render-process-gone 清理）、`MG` internal 判定(101,408)、`gWe/_We/vWe/yWe/NG/PG` **webview 路由属性解析**（101,411-101,452：`data-browser-sidebar-conversation-id`/`browser-tab-id` 属性 → {conversationId, browserTabId}；partition `persist:codex-browser-app-route:` 解码；`yWe` partition 尾部 `:host:` 世代解析） |
| 101,453-101,956 | 应用 | **browser-sidebar webview attach 协调（`SWe`）** | `FG = r.i('browser-sidebar-manager')`(101,453)、owl adoption lease 常量 `IG/bWe`(101,454-101,455)、`LG/RG` 状态(101,456-101,457)、**`xWe` browser settings webview 白名单表**（101,458-101,478：4 个 {allowedNavigationUrls, canOpenPopup, partition} 条目，含 chrome-extension/chrome-settings 弹窗规则、browserExtensions 开关）；**`SWe` 巨型工厂**（101,479-101,956，~475 行）：owner webContents 上装 `will-attach-webview`/`did-attach-webview`/`before-input-event`——**IAB 生命周期准入控制核心**（`IAB_LIFECYCLE` 日志前缀 46 处直接证据）：owl adoption lease 校验、browser settings webview 路由校验、admitBrowserTab、页面持久化 restore/storageId 协调（`data-browser-sidebar-page-restore` = none/required）、hostGeneration/rendererInstanceId 陈旧检测、拒绝路径全部 `t.preventDefault()` + recordDebugEvent；did-attach 装上 **`ipc-message-sync` 同步 IPC**（101,837-101,856，§0 修正五）；返回清理函数（101,943-101,954）。消费者：120,846（R8 IAB manager） |
| 101,957-102,257 | 应用 | browser settings webview 运行时 | `CWe/wWe` webPreferences 装配（101,957-101,971，partition `Jc('app')`（11,107 定义））、`zG` 通用加固（101,972-101,987）、`TWe` 白名单匹配(101,988)、`EWe/DWe` 实例注册 + `setWindowOpenHandler`(101,997-102,030)、`BG` 主题同步队列(102,031)、`OWe/kWe/VG` 主题变体广播(102,039-102,055)、**`AWe` 导航门**（102,056-102,112：will-frame-navigate/will-navigate/will-redirect/did-navigate 全套 preventDefault + 回退 loadURL）、`UG/MWe/WG/GG/KG/qG/NWe/PWe/FWe/IWe` 实例 id / adoption 工具(102,112-102,175)、**`BWe` browser session 配置类**（102,179-102,234：`fromPartition(Jc('app'), {permissionHandling:'browser'})` + 权限处理器 + downloadStore.registerSession + **applicationNetwork.addSessionRestriction**（mainFrame URL 门控 + `chatgpt.com/codex/deeplink` 重定向解析 `VWe`，102,235-102,257）） |
| 102,258-102,577 | 应用 | pending-open 跟踪 + anchor schema | `JG = r.i('browser-sidebar-manager')`(102,258)、`UWe` 类（102,260-102,405：waitForOpen + 15s 超时 + debug 快照）、`XG` role schema(102,406)、`WWe` hit schema(102,411)、**102,420 匿名丢弃 schema 语句**（§5）、`QG/GWe` virtual anchor 几何 schema(102,427-102,454)、`KWe` anchor 几何校验(102,455)、**`$G/eK/tK/nK/rK` anchor 重定位**（102,477-102,546：element/virtual anchor 合并、runtimeElementId/elementPath 匹配）、`iK/aK` URL 等价（origin+pathname+search，102,547-102,577） |
| 102,578-103,934 | 应用 | **comment overlay 窗口管理** | `oK/sK/qWe` 常量(102,578-102,580)、**`JWe` 类**（102,581-103,461，~880 行：`overlaysByKey` Map + nextSessionId；`prepare/open` 创建/复用 overlay BrowserWindow、`positionOverlayWindow`/`syncOwnerRenderer`、`applyWindowInteractivityPolicy`（setIgnoreMouseEvents forward）、`scheduleEditorShowVerification`（setTimeout(0) 后验证可见性并 reportNonFatal `Browser comment overlay lifecycle anomaly`，103,412-103,460））；几何工具 `cK..SK`（103,462-103,635：hide/show/hideCount、`XWe` 布局计算（`n.Qc` placement）、owner+browser bounds 联合矩形）；**注释 schema 带 `CK..jK`**（103,636-103,934：create/edit/design 模式、element/region/text anchor、google-docs documentContext、textLocator dom/form-control、selectionRects、annotationControls） |
| 103,935-105,571 | 应用 | **browser-sidebar comment controller** | `PK = r.i('browser-sidebar-comment-controller')`(103,935)、常量 `FK=32/IK=16/LK=1280/RK=768/cGe=1024`(103,937-103,941)、CSS 规则 schema（`zK/BK/pGe/mGe`，103,946-103,974）、**`hGe` 类**（103,975-105,571，~1,600 行：windowManager/errorReporter/delegate/hostId + `overlayManager = new JWe`；`handleAnnotationEditorMessage` 分派 6 种 runtime/overlay 消息（103,995-104,016）；`prepare` overlay 状态（104,017+）；design editor/CSS scrub（105,185）；**截图管线**：`captureBrowserScreenshot`（capturePage + crop/resize）、`captureSavedCommentScreenshot`（`browser-sidebar-runtime-prepare-comment-screenshot` → waitForRuntimeCommentScreenshotReady（超时 reportNonFatal `Timed out waiting for browser comment screenshot`）→ 回写 snapshot.comments + `compactThreadCommentScreenshotsIfNeeded`，105,193-105,283）、`captureSavedDesignChangeScreenshot`（annotation 截图，105,284+）；`runtimeCommentScreenshotWaiters` Map）。实例化：119,349（R8） |
| 105,572-106,033 | 应用 | 截图压缩工具 | `gGe` compact 化（nativeImage.createFromDataURL + crop/resize，105,572-105,603）、`_Ge/VK/HK/UK/vGe/yGe/WK` 裁剪/缩放（marker viewport rect ∪ annotation rect + padding FK/IK、上限 LK/RK，105,604-105,722）、`qK..$K/xGe..AGe/eq/jGe/MGe/NGe/PGe` 设计变更/CSS 反序列化与快照工具（105,723-106,033，`data-codex-browser-design-group` 串 103,942） |
| 106,034-106,076 | 应用 | headless 下载视图（`FGe`） | 见 §0 修正三。`pending` Map（webContents.id → {options, view, finish}）、`download(session, options)`、`consume(item, webContents)` URL 匹配认领 |
| 106,077-106,520 | 应用 | 下载事件接线 + download store（`LGe`） | `nq=200`(106,077)、**`IGe` will-download 处理器**（106,078-106,149：agent 下载/用户下载分流（非用户且非 browser-use 下载 → preventDefault+cancel）、`downloadStore.start`、browser-use 下载状态通知 `notifyBrowserUseDownloadChange`、updated/done 状态映射）；**`LGe` 类**（106,150-106,520，~370 行：`liveDownloads`/`unacknowledgedDownloadIds`/`activeSavePaths`/`linkDownloads = new FGe`；`getRestartBlockers() → ['download.active']`、clearHistory/searchHistory（Electron native history + `clearData({dataTypes:['downloads']})`）、`reserveSavePath` 唯一文件名、快照序列化队列 `snapshotReadQueue`）；`rq/RGe/iq/aq` 状态映射/openPath(106,521-106,547)。实例化：119,249（R8） |
| 106,521-106,857 | 应用 | find-in-page + 浏览器快捷键 + tab mentions | `oq/sq/cq/lq/uq/zGe/dq/fq/pq` **find-in-page 状态机**（106,548-106,620：`browser-sidebar-command open-find`、findInPage/stopFindInPage、`browser-sidebar-find-state` 消息）；`BGe/VGe` 命令表（106,621-106,634，nextTab/previousTab/focusBrowserAddressBar/quickChat/...）；**`HGe` before-input-event 工厂**（106,635-106,698：closeTab/closeOtherTabs/`CmdOrCtrl+.` comment 模式切换）；`UGe/WGe` 守卫(106,699-106,714)、`mq` accelerator 映射表（106,715-106,742，`n.At` keymap 解析）、`GGe/hq/gq/KGe` 快捷键匹配(106,743-106,782)、**`qGe` 类 iabTabMentions**（106,783-106,831：按窗口 threads 搜索候选 + `n.Uc/n.Vc` mention schema 校验；实例化 119,193 R8）、`JGe/YGe/XGe` 排序/过滤(106,832-106,857) |
| 106,858-110,745 | **vendored** | zod v4 | 见 §2。**R7 应用代码止于 106,857** |

---

## 2. vendored 识别

| 包 | 行区间 | 证据 | 处理建议 |
|---|---|---|---|
| **zod v4** | **106,858-110,745**（跨 R7/R8 边界；R7 内只有开头 106,858-107,000） | 106,858 `var _q = class {type;schema;payload}`（core error 载体）→ 106,873 `(function(e){e.assertEqual...arrayToEnum...})(vq||={})` util IIFE → 106,921 `yq = vq.arrayToEnum(['string','nan',...])`；粗扫 §3.4 的 `Pq`(107,237)/`Vq`(107,573 ZodString) 等在 107,000 之后 | npm `zod@v4`，不重写 |
| lodash.escape（经 rolldown `e.t()` 惰性 CJS） | 98,674-98,687 | `bVe = e.t((e,t)=>{ t.exports = n.yt()({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}) })` + `xVe` html-escaper 结构（`n.od()` 解码器 + `[&<>"']/g`），`OU = e.a(xVe())` interop | npm `lodash.escape` 或内联 3 行实现；`OU` 仅用于错误页 HTML 模板转义 |

除这两块外，R7 全部为应用代码（直接证据：所有顶层定义均引用 `n.*`/`l.*`/`a.*` 应用符号，无第三方库特征串）。

---

## 3. 子系统聚类与模块拆分方案

> 建议模块名 kebab-case；「定义」列出压缩名 → 建议语义名。所有消费者行号在 R7 之外（R8/R10/R12），标注供派发对照。

### A. saved-sections / pinned threads（跨 R6 边界）

| 项 | 内容 |
|---|---|
| 行区间 | 94,121-95,581（R7 侧 95,000-95,581；建议整簇归 R6 或独立模块） |
| 建议模块 | `threads/pinned-threads-service.ts` + `threads/saved-sections-query.ts` |
| 主要定义 | `jH`(PinnedThreadsService)、`rBe`(SavedSectionQuery)、`oBe`(WorkModeAccessSchema)、`$ze/iBe`（app-server pin 适配，94,x00-95,318 内） |
| 说明 | 本地 pin（globalState `n.iu.PINNED_THREAD_IDS`）与 app-server pin 双轨合并；`persisted-atom-updated` 广播（95,310）。构造点 96,360（PBe） |

### B. link-opening

| 项 | 内容 |
|---|---|
| 行区间 | 95,582-95,859 |
| 建议模块 | `browser/link-opening.ts` + `browser/slack-native-handoff.ts` |
| 主要定义 | `IH`(openLinkInPreferredTarget)、`NH`(logger)、`PH`(slackTeamCache)、`mBe/_Be/yBe/bBe/gBe/LH/hBe`(slack 判定/解析) |
| 消费者 | 100,588 / 101,172 / 121,072 / 124,569 / 140,259（checkout、workspace-settings、R8/R10 复用） |

### C. workspace settings service

| 项 | 内容 |
|---|---|
| 行区间 | 95,860-96,037（+ sBe 基类 95,514-95,568） |
| 建议模块 | `settings/settings-service.ts` + `settings/agent-write-confirmations.ts` |
| 主要定义 | `sBe`(SettingsServiceBase)、`CBe`(WorkspaceSettingsService)、`xBe`(AgentWriteConfirmationBroker)、`SBe/cBe`(UnsubscribeHandle)、`zH`(accountMatches) |
| 消费者 | PBe 构造（96,351）、PBe handlers `settings-read/settings-write/set-setting` |

### D. 目录列举 / notices / 路径工具

| 项 | 内容 |
|---|---|
| 行区间 | 96,038-96,194 |
| 建议模块 | `fs/remote-directory-listing.ts` + `platform/third-party-notices.ts` |
| 主要定义 | `OBe/kBe/ABe`(listRemoteDirectoryEntries)、`VH/HH/TBe/EBe/DBe`(thirdPartyNotices)、`jBe/UH/MBe/WH`(posixPath 工具)、`GH`(isWslDistro) |

### E. electron-fetch-handler（`PBe`，本区最大单块）

| 项 | 内容 |
|---|---|
| 行区间 | 96,195-97,879 |
| 建议模块 | `rpc/electron-fetch-handler.ts`（可再拆 `rpc/handlers/` 按域分组：worktree/git/remote-control/automations/settings/computer-use/node-repl/...） |
| 主要定义 | `PBe`(ElectronFetchHandler)、`XH`(NotImplementedInElectronError)、`KH`(logger)、`qH`(protectedGlobalStateKeys)、`NBe`(dictationHotkeyStub) |
| 结构 | 依赖容器字段 ~45 个（96,207-96,266）+ 方法 38 个 + `handlers` 表（96,417 起，150+ kebab-case 方法：`worktree-create-managed`、`git-push`、`set-remote-control-connections-enabled`、`automation-run-now`、`settings-write`、`apply-patch`、`download-internal-plugins`、`computer-use-start-capture`、`node-repl-active-execs-kill`、`third-party-notices`、`upload-local-file-over-sftp`...直接证据）+ `runGitOperation` 包装（97,850-97,878，`n.W` git 操作源校验） |
| 消费者 | 159,611（WindowContext `this.fetchHandler = new PBe(...)`） |
| 备注 | 构造参数巨多（依赖注入），拆分时建议改为显式 options 对象；`a.in.allowDebugMenu`（build flavor）在 97,785/97,847 被用于 debug chrome pages 门控 |

### F. 杂项工具带

| 项 | 内容 |
|---|---|
| 行区间 | 97,880-98,522（除 B 外） |
| 建议模块 | `browser/screenshot-destination.ts`（FBe）、`fs/sftp-transfer.ts`（QH/RBe/zBe）、`hotkeys/os-global-shortcut-validation.ts`（VBe/eU）、`skills/bundled-skills-root.ts`（HBe）、`state/sparse-state-write.ts`（WBe）、`avatar/overlay-message-dispatch.ts`（KBe）、`browser/comment-mode-site-status.ts`（ZBe/QBe，98,086-98,159）、`keyboard/accelerator-matcher.ts`（oU/sU/oVe + rVe/iVe/aVe 表）、`keyboard/app-shell-input-dispatch.ts`（uVe/uU 群） |

### G. browser-sidebar 核心（状态/错误页/持久化）

| 项 | 内容 |
|---|---|
| 行区间 | 98,523-99,787 |
| 建议模块 | `browser-sidebar/image-attachments.ts`（mVe/xU/CU/bU）、`browser-sidebar/annotation-snapshot.ts`（EU/DU）、`browser-sidebar/error-page.ts`（MU/wHe/THe/OHe + i18n 常量 + base64 图标 + HTML 模板，可独立 `error-page.html.ts`）、`browser-sidebar/navigation-state.ts`（GU/qU 群 + NHe viewport）、`browser-sidebar/page-store.ts`（GHe/YHe/XHe + uW/UHe/WHe schema） |
| 消费者 | 119,251（XHe → browserPageSnapshots） |

### H. 三个受限 webview（认证类）

| 项 | 内容 |
|---|---|
| 行区间 | 99,788-101,452 |
| 建议模块 | `webviews/chatgpt-auth.ts`（lUe/uUe/xW/aUe/CW/oUe/sUe/cUe）、`webviews/checkout.ts`（IUe/RUe/BUe/VUe/GUe + URL 谓词群 eG..gG）、`webviews/workspace-settings.ts`（uWe/dWe/fWe/OG/kG/AG） |
| 公共模式 | 三者结构同构：partition 前缀判定（`st`/`codex-checkout|codex-credit-|codex-pricing-`/`at`）→ will-attach-webview 加固（zG 同款 sandbox 模板，101,972）→ did-attach 装配（导航白名单 + setWindowOpenHandler deny）→ destroyed 清 cookies（WeakMap promise 链）。**建议抽公共 `webviews/attach-hardening.ts`**（zG/IUe/lWe 的加固块逐字段一致，直接证据 99,994-100,008 / 100,201-100,214 / 101,122-101,132） |
| 消费者 | 173,282/173,309/173,316（R12 window-manager 装配） |

### I. IAB webview 生命周期（attach 协调 + browser settings webview）

| 项 | 内容 |
|---|---|
| 行区间 | 101,411-102,257 |
| 建议模块 | `browser-sidebar/webview-route-attrs.ts`（gWe/_We/vWe/yWe/NG/PG）、`browser-sidebar/attach-coordinator.ts`（SWe + IG/bWe/LG/RG + hWe + MG + jG/pWe/mWe）、`browser-sidebar/browser-settings-webview.ts`（xWe/CWe/wWe/TWe/EWe/DWe/BG/AWe/OWe/VG）、`browser/browser-session-config.ts`（BWe + VWe） |
| 消费者 | 120,846（R8 `SWe({...})`）；`codex_desktop:` 同步 IPC 在此（101,838/101,846） |

### J. comment overlay + comment controller + 截图

| 项 | 内容 |
|---|---|
| 行区间 | 102,258-106,033 |
| 建议模块 | `browser-sidebar/pending-open-tracker.ts`（UWe）、`browser-sidebar/anchor-schema.ts`（WWe/QG/GWe/KWe + $G..aK anchor 重定位）、`browser-sidebar/comment-overlay-manager.ts`（JWe + cK..SK 几何）、`browser-sidebar/comment-schema.ts`（CK..jK）、`browser-sidebar/comment-controller.ts`（hGe，可再拆出截图管线）、`browser-sidebar/screenshot-crop.ts`（gGe..WK） |
| 消费者 | 119,349（new hGe）、103,990（new JWe，hGe 内部） |

### K. 下载管理 + find-in-page + tab mentions

| 项 | 内容 |
|---|---|
| 行区间 | 106,034-106,857 |
| 建议模块 | `downloads/headless-download-view.ts`（FGe）、`downloads/download-store.ts`（LGe + IGe + rq/RGe/iq/aq）、`browser-sidebar/find-in-page.ts`（oq..pq）、`keyboard/browser-shortcuts.ts`（HGe/mq/GGe/hq + BGe/VGe）、`browser-sidebar/tab-mentions.ts`（qGe/JGe/YGe/XGe） |
| 消费者 | 119,193/119,249（R8：iabTabMentions、downloadStore） |

---

## 4. 顶层可变状态清单

> 全部为 `var` 声明的模块级容器（绑定本身不再赋值，容器内容可变）。无 `let` 型顶层可变绑定。logger（`r.i(...)` 返回惰性函数句柄）不算副作用状态，但列出以完整。

| 名 | 行号 | 类型 | 语义 | 读写方 |
|---|---|---|---|---|
| `PH` | 95,596 | Map | slack workspace domain → team_id 缓存（3s 超时请求） | `gBe` 写（95,820），`LH/gBe` 读 |
| `GH` | 96,194 | boolean | `!!process.env.WSL_DISTRO_NAME`——模块加载期求值的 WSL 标志 | `YH`/PBe `shouldUseWslPaths`、`n.Oi({preferWsl:GH})`（96,299） |
| `qH` | 96,196 | Set | 禁止 renderer 直写的 global-state 键（PROJECT_ORDER） | PBe `set-global-state/set-configuration`（97,176/97,207）只读 |
| `bU` | 98,524 | WeakMap | webContents → 图片附件挂起状态 {abort, pending, suspension} | `mVe/CU/xU` |
| `DW` | 99,978 | WeakSet | 已标记为 first-party ChatGPT 的 session | `lUe`（will-attach 标记）、`jW/KW` 判定 |
| `OW` | 99,979 | WeakMap | session → cookie 清理 promise 链（串行化 clearStorageData） | `uUe`（destroyed 清理） |
| `PW` | 100,159 | Map | session → checkout webview 挂载计数 | `YW`（100,605） |
| `FW` | 100,160 | WeakMap | session → 预热 URL | `GUe`（100,771） |
| `IW` | 100,161 | Map | session → 串行操作队列 | `JW`（100,595） |
| `LW` | 100,162 | Set | checkout/credit/pricing session 集合 | `IUe` 写、`KW` 读 |
| `RW` | 100,163 | WeakMap | owner webContents → partition → presented URL | `LUe`（100,228）写、`zUe` 读 |
| `yG` | 101,088 | Map | session → workspace-settings live 计数 | `DG`（101,289） |
| `bG` | 101,089 | Map | session → cookie 清理 promise 链 | `dWe/x`（101,239-101,253） |
| `xG` | 101,090 | WeakSet | workspace-settings session 集合 | `uWe` 写、`EG` 读 |
| `SG` | 101,091 | WeakMap | owner → presented partitions（Set） | `lWe`（101,103）写、`isPresented` 读 |
| `jG` | 101,358 | WeakSet | 已装 did-attach 跟踪的 sidebar webContents（防重复装 IPC） | `SWe`（101,835-101,837） |
| `LG` | 101,456 | WeakSet | 已跟踪的 sidebar webContents（同上，另一维度） | `SWe` |
| `RG` | 101,457 | WeakMap | webContents → 主题（颜色方案）同步 promise 链 | `BG`（102,031）写、`VG` 触发 |
| logger 句柄 | — | — | `NH`(95,590)、`KH`(96,195)、`nU`(98,086)、`pVe`(98,523)、`UU`(99,213)、`zHe`(99,464)、`EW`(99,977)、`NW`(100,158)、`vG`(101,087)、`FG`(101,453)、`JG`(102,258)、`PK`(103,935) | `r.i(name)` 惰性创建；同 subsystem 多处（browser-sidebar-manager 5 个句柄：pVe/UU/FG/JG + coarse 计 12 处）——重写时合并为单一 logger 实例 |

类内可变状态（同样需要迁移）：`GHe.entries`（99,502）、`YHe.deletedBrowserStorageIds/enabledBrowserStorageIds`、`UWe.requests`（102,262）、`JWe.overlaysByKey/nextSessionId`（102,584-102,585）、`hGe.runtimeCommentScreenshotWaiters`（103,984）、`FGe.pending`（106,035）、`LGe.liveDownloads/activeSavePaths/unacknowledgedDownloadIds/snapshotReadQueue`（106,155-106,166）、`qGe.invalidationListeners`（106,785）。

---

## 5. 顶层副作用序列

**本区间没有模块加载期的可观察副作用**（直接证据：awk 列 0 非声明语句扫描，95,000-106,857 仅命中模板字符串续行与下述一条）。逐项：

| 行号 | 语句 | 语义 |
|---|---|---|
| 96,194 | `var GH = !!process.env.WSL_DISTRO_NAME` | 模块加载期 env 读取（无副作用，但拆分后注意求值时机不变即可） |
| 98,674-98,687 | `bVe = e.t(...)` / `xVe = e.t(...)` / `OU = e.a(xVe())` | rolldown 惰性 CJS 模块（lodash.escape）；`e.t` 包装 memoized initializer，重写为 ESM 后消失 |
| 102,420 | `n.wf({ type: n.df(['registered','invalidated','disposed','rendering-failed','result']), registrationId: VC, ... });` | **匿名丢弃 schema 表达式语句**——构造结果不绑定任何变量、不被引用（紧邻的 `WWe`(102,411) 与 `QG`(102,427) 才是被用的）。疑似源码中类型级声明（`satisfies`/未使用 const）经压缩后的残留；重写时直接删除（无运行时影响，直接证据） |
| 106,873 / 106,918 | `(function(e){...})((vq ||= {}))`、`(function(e){...})((ZGe ||= {}))` | vendored zod v4 内部 IIFE（R7 边界之外，随 npm 包消失） |

所有 Electron 接线（`will-attach-webview`/`did-attach-webview`/`before-input-event`/`ipc-message-sync`/download 事件）都发生在**工厂函数被调用时**：`SWe`（消费者 120,846）、`RUe`（173,282）、`uWe`（173,309）、`lUe`（173,316）、`IGe`（R8 内接 will-download）、`registerWindowShutdown`（R8）。这与 bootstrap「模块加载即接线」的模式相反——R7 是纯库区，副作用全部延迟到装配期。

---

## 6. 跨 chunk 依赖

### 6.1 @chunk/shared（`n.*`，绑定自 `./src-DldfpmrL.js`）

R7 内 `n.*` 成员访问约 1,030 处（采样统计）。主要依赖面：

| 类别 | 符号 | 用途 |
|---|---|---|
| zod schema 工厂 | `n.wf/Ef/Of/Cf/Mf/gf/bf/df/hf/pf/Af/Sf/vf` | 本区 ~60 个 schema 定义（注意：**shared chunk 的 zod 是 v3 风格实例**，与 106,858 起 vendored zod v4 是两套——R7 应用代码全部用 `n.*` 那套） |
| EventEmitter | `n.Uf` | 6 个类基类（rBe/jH/xBe/SBe/sBe/cBe） |
| 设置目录 | `n.ka/n.Aa/n.Ea/n.Oa/n.Ia/n.ja/n.Fa/n.Ba` | 设置键定义/agent 可写集/强制转换（CBe、PBe set-setting） |
| global-state | `n.iu`（PINNED_THREAD_IDS/THREAD_WORKSPACE_ROOT_HINTS/PROJECT_ORDER/DEBUG_CHROME_PAGES_ENABLED...） | jH、PBe |
| app-server 文件系统 | `n.Di`（stat/readdir/mkdir/writeFile）、`n.Es/n.Os`（remote/ssh host 判定）、`n.zi/n.Oi`（wsl/codexHome） | OBe、PBe |
| browser 白名单 | `n.el/n.nl/n.il/n.sl/n.rl/n.ol/n.ll/n.tl`、`n.is` | xWe 表、SWe partition 判定 |
| keymap/命令 | `n.jt/n.At/n.kt/n.Ot/n.Et` | yU/HGe/mq/hq 快捷键解析 |
| 其他 | `n.Cu`(deepEqual)、`n.qn`(which)、`n.Bi`(env 序列化)、`n.$u`(threadId)、`n.Ht`(权限自动拒绝)、`n.Lt`(canonicalPaths)、`n.W`(git 操作校验)、`n.Ns`(cwd 规范化)、`n.U`(操作源)、`n.L`(config 读)、`n.lu`(NEW_TAB_PAGE)、`n.xa/n.Sa`(image/filename 判定)、`n._u/n.vu/n.yu`(annotation 限额)、`n.Pu/n.Fu`(element metadata 转换)、`n.Uc/n.Vc/n.qc/n.Jc`(iab mention schema/favicon)、`n.Qc`(overlay placement)、`n.Dl/n.Tl/n.El/n.bl/n.xl`（R1 的 URL 门控） | 分散 |

### 6.2 @chunk/logger（`r.*`）

`r.i(name)` × 12（见 §4 logger 表）。无 `r.r`/`r.n`/`r.a` 用法（本区全部走 `r.i` 惰性句柄）。

### 6.3 @chunk/bootstrap（`a.*`）

| 符号 | 行号证据 | 语义 |
|---|---|---|
| `a.bn` | 95,673 / 101,417 / 101,426 | browserTabId 工厂（`a.bn('manual:'+uuid)`、`a.bn(n)`） |
| `a.v` | 98,132?（gBe 内 `a.v(n)` 102,243? —— 实际 102,243 `a.v(n)`（chatgpt deeplink url 解码）） | URL 验证/规范化（`return a.v(n)`，VWe 内） |
| `a.g` | 96,499 | app 协议 scheme（`${a.g(l.app.isPackaged)}://connector/oauth_callback`） |
| `a.vt` | 98,128 | app-server 代理 fetch（ZBe 站点状态查询） |
| `a.hn` | 99,291 | intl formatMessage（错误页 i18n） |
| `a.en` | 95,547 / 95,901 | async context store（`a.en()` 的 `.u/.e/.d`——`AsyncLocalStorage` 风格包装，sBe subscribe 与 xBe 内） |
| `a.vn` | 96,286 | 默认 errorReporter（PBe 构造参数默认值） |
| `a.J` | 95,307 / 95,313 | global-state 键常量（jH 的 persisted atom key） |
| `a.At` | 18 处（106,025 等） | renderer 消息通道名（`webContents.send(a.At, {...})`） |
| `a.Tt/a.Et/a.Kt` | 98,089 | desktopApiOptions（originator/devApiBaseUrl/prodApiBaseUrl，XBe 默认值） |
| `a.in` | 97,785 / 97,847 | build flavor 模块（`a.in.allowDebugMenu(a.in.resolve())`） |
| `a.j` | 97,850 附近 | 主题应用（appearanceTheme side effect，PBe applySettingSideEffects） |

### 6.4 其他 chunk

- `i.*`（main-shared `src-C9YLnbgY.js`）：本区无直接成员调用（`i.session` 等命中均为局部变量遮蔽；`i.Emitter` 0 处）。
- `o.*`（electron-resources-path）：~93 处命中多为局部遮蔽；未发现对 chunk `o` 的确定调用（低置信度，重写时按 import 静态检查）。
- `t.*`（desktop-open-path-queue）：0（粗扫确认全文件仅 24,953 一处）。
- `s.*`（dist chunk）：未发现确定调用。

### 6.5 同 chunk 跨区域引用（R1/R2/R8/R10/R12）

| 符号 | 定义行（区域） | 在 R7 的用途 |
|---|---|---|
| `ie`（chatgpt.com/codex base URL） | 66（R1） | `bW()`=origin（bW 99,830）、`kW`、`zW` checkout 路径前缀 |
| `Qe/$e/et/tt/nt/at/st`（partition/restore 常量群） | 505-526（R1） | vWe/yWe/NG 路由解析；`at`/`st` 是 workspace-settings/chatgpt webview partition 前缀 |
| `We/Ge/Ke/Ze`（URL 门控） | 437-496（R1） | IH 的 openTarget 决策（Ke 95,645）、`We(f)` 校验（95,685） |
| `Tr()`（desktop feature availability） | 3,372（R2） | IH/FH/xWe 的 browserPane/browserExtensions/webMcp 开关 |
| `Jc`（browser session partition 名工厂） | 11,107（R2） | CWe/wWe/BWe 的 `Jc('app')` |
| `ls`（本地 host 配置） | R2/R3 | PBe `getWorkspaceRootOptions(t === 'local' ? ls : ...)`（96,420） |
| `XHe/GHe/YHe/hGe/JWe/LGe/qGe/SWe/RUe/uWe/lUe/ZBe/IGe` 等的**消费者** | 119,193-119,349（R8 浏览器窗口总管）、120,846（R8）、159,611（R10/R11 WindowContext）、173,282-173,316（R12） | R7 是被调用方——R8 的 IAB manager 是 R7 各工厂的 composition root |
| `PBe` 构造依赖（CMe automations、Vee 锁、fze/lze 插件下载、JV/QV accelerator 校验、`ns`、`Fie`、`tl`） | R2/R4/R6 等 | PBe handlers 引用——拆 PBe 时需跨区核对这些符号 |

### 6.6 与 browser-page-preload chunk 的关系

preload 路径以**参数**形式流入 R7（`SWe({preloadPath: g, ...})` 101,494 → `CWe({preloadPath: n})` 101,957 → `r.preload = n` 101,960），本区不解析路径本身（preloadPath 由 R8 调用方注入）。**通信面**（preload↔main）在本区的体现：
- `codex_desktop:get-browser-annotation-api-policy` / `codex_desktop:get-browser-webmcp-policy`（同步 IPC，101,838/101,846）；
- `a.At` 通道上的 `browser-sidebar-runtime-*` 消息（106,025-106,031：open-design-editor-at-point / create-comment-from-selection；105,235/105,280/105,296：prepare/clear-comment-screenshot）；
- `before-input-event` 的 `HGe`（消费 preload 转发的键盘事件形态 `{type:'keyDown', key, code, alt, control, meta, shift, isAutoRepeat}`）。
browser-page-preload chunk（855KB，未重写）的频道表需与这些消息名对齐；`hWe`（101,365）的 `ipc-message-sync` 异步回填模式（`e.returnValue` 先占位、监听器更新）是 preload 侧同步 IPC 的契约，重写时必须保留语义。

---

## 7. 拆分风险

1. **webview 生命周期时序（最大风险）**：`SWe`（101,479）是 IAB 生命周期的准入闸门，`will-attach-webview` 中 `t.preventDefault()` 的**每个拒绝分支**（adoption lease 失配、storageId/restore intent 不一致、hostGeneration 陈旧、pendingTeardown）都对应一种真实故障模式（日志前缀 `IAB_LIFECYCLE` 46 处）。重写时不能合并/简化这些守卫；`queueMicrotask` 内销毁 adopted webContents（101,515-101,523）的顺序敏感。
2. **owl adoption lease 跨进程协议**：`IG = 'owl-webcontents-adoption-lease'` / `bWe = 'owl-webcontents-adopted-web-contents-id'`（101,454-101,455）是与 Owl shell（魔改 Electron）协商 webcontents 跨窗口迁移的属性协议；`NWe/PWe/yWe` 解析 `:host:` 世代。这是 Owl 专有 API 面（bootstrap-analysis 待确认清单同源），重写时需要 Owl shell 补丁面清单。
3. **三个认证 webview 的 session 全局状态**：`PW/IW/LW/yG/bG/xG/SG` 等模块级 Map/WeakMap（§4）跨工厂调用共享——同一 partition 的多次 attach 依赖 `YW/DG` 计数与 `JW` 串行队列的配对（+1/-1）。拆分时若把这些状态搬进类实例，必须保证「一个 session 一个实例」，否则 cookie 清理链（`OW/bG`）会乱序。
4. **下载与重启阻塞**：`LGe.getRestartBlockers()` 返回 `['download.active']`（106,152）接入退出流程；`IGe` 对非用户下载 `preventDefault()+cancel()` 的策略（106,096-106,099）是 browser-use 下载安全边界，重写时不能放宽。`FGe` 的 60s 超时与 `consume` 的 URL 匹配（`getURLChain()[0]`）配对，缺一即泄漏 WebContentsView。
5. **同步 IPC 异步回填**（`hWe`，101,365-101,407）：`e.returnValue` 在事件监听器内被**延迟赋值**（win32 需 `setImmediate`，101,842-101,844），依赖 Electron 同步 IPC 的「事件返回后读取 returnValue」语义。重写成 `ipcMain.handle` 不可行（这是 `ipc-message-sync`，renderer 侧 preload 同步等待）。
6. **CDP debugger 附加的互斥**：`GU`（99,225，颜色同步）与 `VUe`（100,613，checkout 网络观察）都会 `debugger.attach('1.3')`，各自维护「是否自己附加」标志并在退出时 detach（99,247/100,691）。同一 webContents 上叠加两个观察者时序敏感；重写时建议统一 debugger 会话管理器。
7. **键盘分派的平台矩阵**：`oU/sU/oVe`（accelerator 匹配）+ `iVe/aVe` 表 + `HGe` 的命令优先级（closeTab vs closeOtherTabs vs app-shell tab shortcut，106,743-106,758 的 `GGe` 仲裁）是纯行为等价问题，无类型保护，需要表驱动重写 + 逐 case 对照（darwin 的 `Command+Shift+G` vs win `Shift+F3`，106,703）。
8. **`PBe` 是全 app RPC 面**：150+ handler 方法是 renderer fetch 协议的契约（方法名即 URL path）。拆分/重命名任何 handler 都会破坏 renderer；建议机械保留方法名，先做依赖注入结构化（45 构造参数 → options 对象），行为零变更。
9. **saved-sections 边界跨越**：R6/R7 分界（95,000）切在 `rBe` 类体中间。派发重写时 94,121-95,581 应整簇给一个 agent（建议归 R6 侧或独立），否则 `jH`/`rBe`/`iBe`/`$ze` 的私有字段协作会被拆散。
10. **错误页内嵌资源**：98,688-99,159 的 i18n 常量 + base64 图标 + ~300 行 HTML/CSS/JS 模板是自包含资产，建议整体搬移为独立资源文件，不要试图重构模板内部 JS（其 `<\/script>` 转义与 `VU` JSON 注入消毒是安全相关，99,202-99,209）。
11. **zod 双实例**：R7 应用代码用 shared chunk 的 `n.*` zod（v3 风格），106,858 起 vendored zod v4 是另一套（供 app-server/R8 的 browser-use schema 用）。重写时两套并存需显式区分，不能统一 import 一个 zod（版本行为差异：`strict/refine/loose`）。

## 待确认清单（下游复核）

- `a.J`（95,307）在 bootstrap 导出表中的语义名（persisted atom key，可能是 `STATE_KEY_SAVED_CUSTOM_SECTIONS` 类）。
- `a.At`（renderer 消息通道）与 bootstrap `Tw~Yw` 频道表的对应关系。
- `i.*`（main-shared）与 `o.*`（resources-path）在本区是否真的零调用（§6.4，grep 遮蔽噪声大，建议重写时用 lint no-unused-imports 验证）。
- `PBe` handlers 表的完整方法名清单（本区 grep 到 150+，建议 dump 成机器可读清单作为 renderer↔main 契约附件）。
- `xWe` 白名单表（101,458-101,478）中 `n.el/n.nl/n.il/n.sl/n.rl/n.ol/n.ll/n.tl` 的具体 URL/partition 值（在 shared chunk，需 shared 导出映射表完成后回填）。
