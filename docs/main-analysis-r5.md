# main-C-Mhak1n.ts R5 深度分析（60,000-75,000 行）

目标：`src/main/main-C-Mhak1n.ts` 的 60,000-75,000 行（粗扫 R5：认证 / app-server 连接 / checkout / automations）。
来源：macOS ChatGPT.app（Codex 桌面版 v26.917.71314）主进程 chunk。
方法：与 `docs/main-analysis-coarse.md` / `docs/bootstrap-analysis.md` / `docs/main-analysis-r1-r2.md` 同一方法论——200-400 行窗口采样 + 关键区域（类定义头、区域边界、副作用语句）精读；所有行号经 `grep -n` 核实。结论标注置信度：**直接证据** = grep/原文引用支撑；**采样推断** = 窗口采样得出，需下游复核。

**工具坑（沿用粗扫 §9.2 / R1-R2 §0）**：本机 grep 为 ugrep 7.8.4，BRE `\|` 多模式静默失效，本文全部用 `-E 'a|b'` 或单模式 `-F`。另注意：**列 0 顶层定义 grep 会漏掉「多绑定 var 链」中缩进 2 格的 continuation 绑定**（如 63,644 `hEe = class`、72,935 `lA = class`）——本区有 57 处，已用 `^  [A-Za-z_$]+ = (class|async function|function)` 补扫（直接证据）。

## 0. 总览与对粗扫的四个重要修正

1. **修正一：60,000-61,578 是 vendored Statsig JS SDK（js-mono v3.33.4）的尾部**，不是应用代码。粗扫 §2 将 60,000-64,999 计为「认证/app-server（69 定义）」低估了 vendored 占比。完整 vendored 区间为 **56,944-61,578**（R4 侧 56,944-60,000 + R5 侧 60,000-61,578），证据：56,951 `[Statsig]` log 前缀、57,236 `https://api.oaistatsig.com/v1`、57,268 `e.SDK_VERSION = '3.33.4'`、60,035-61,577 共 22 个 `e.t()` CJS 模块包装器（`rTe`~`mTe`，`qw`/`Yw` 为 client 入口 re-export，直接证据）。应用侧 statsig 适配层从 **61,579**（`Xw` gate 名单常量）开始。**重写时直接引 npm `@statsig/js-client`（或对应 js-mono 包），60,000-61,578 不派发。**
2. **修正二：63,547 `kT` 不是「checkout/付费认证」**。`checkout` 字符串在本区间 **0 命中**（grep -F 核实；checkout-webview 在 R7 的 100,000s）。`kT` 实为 **AppServer 云后端 HTTP API 客户端**：构造注入 `getDesktopAuthToken`，把 `wss://codex-cloud-backend.chatgpt.com/`（63,542 `lEe`）转成 https origin 后经 `l.net.fetch` 发 Bearer 认证请求（63,547-63,595 直接证据）。它被 63,644 `hEe`（websocket+http 混合 transport）、72,680（`Kk` environmentConfig 客户端）、161,063（AppServer 装配区）三处消费。
3. **修正三：本区间还有两段粗扫未发现的 vendored**：① **lodash 子集 69,716-69,869**（`Tke`~`Mke` 六个 `e.t()` CJS 模块：forEach/forEach-iterative/map/sortBy/compareMultiple/orderBy，`Nke = e.a(Mke())` interop，供 69,877 `RD` 扩展图标挑选 `orderBy` 使用）；② **yaml 库 73,181-79,294**（R5 内 73,181-75,000，跨过 75,000 边界延续到 79,294 `Dj` 聚合模块；证据：73,182-73,188 `Symbol.for('yaml.alias'/'yaml.document'/'yaml.map'/'yaml.pair'/'yaml.scalar'/'yaml.seq'/'yaml.node.type')`、79,259-79,283 `e.Composer/Document/Schema/YAMLError/.../parse/parseDocument/stringify/visit` 导出表，直接证据）。**R5/R6 派发边界应改为 73,181**，73,181-79,294 整体归 vendored yaml 带。
4. **修正四：粗扫的「automations」在 R5 是 habitat 迁移层，与 R2 的 automations 执行引擎是两码事**。R5 的 67,683 `AOe`（logger `habitat-automations` 67,692）做的是云端 automations → 本地 habitat 的 enrollment/迁移/同步（消费 bootstrap globalState 键 `a.M` = `electron-automations-habitat-migration-state`、`a.N` = `electron-automations-installation-id`，直接证据 67,708/67,724/67,955-67,974）；本地 cron 调度/执行在 R2 的 8,725-9,982。

本区间（60,000-75,000）合计 15,000 行：vendored 约 **3,551 行**（statsig 尾 1,579 + lodash 154 + yaml 1,819 到 75,000 截断），**应用代码约 11,450 行**。

---

## 1. 区域地图（行区间，每子区域 ≤1500 行）

| 行区间 | 类型 | 语义名 | 概述 |
|---|---|---|---|
| 60,000-61,578 | **vendored** | statsig js-mono v3.33.4 尾部 | `e.t()` 模块链 `rTe`~`mTe`：DataAdapterCachePrefix(60,035)、空模块(60,040)、_makeTypedGet(60,043)、StatsigClient 实现 `mTe`(60,990-61,546)、入口 re-export `qw`(60,121)/`Yw`(61,547)。SDK 版本 3.33.4（57,268） |
| 61,579-62,088 | 应用 | statsig 应用适配层 + 线程摘要 DB | gate/config 名单 `Xw`(61,579，`codex-app-cross-host-handoff`/`codex-share-thread` 等 9 键)、toolCatalog schema `Zw`(61,594)、默认值 `hTe`(61,599)、实验覆盖 `Qw/gTe/_Te/$w/eT/vTe/yTe/bTe`、override adapter `xTe`(61,652)、DJB2 比较 `tT`(61,703)、**`STe` PublishedStatsig 类**(61,706-61,870，repository 订阅 + `statsig_evaluations` 发布 + identity epoch)、stableId 存储 `iT/CTe`(61,893-61,922)、线程摘要 sqlite `aT=2/oT/wTe/TTe/ETe/DTe`(61,923-62,087，`thread_turn_summaries` 表 + `codex-thread-summaries.db`) |
| 62,089-63,390 | 应用 | **认证 fetch 层（R5 核心）** | `cT` 从 JWT 提取账号信息(62,089，`https://api.openai.com/auth`/`profile` claims)、**`lT` ApiFetchError**(62,141，status/cause/errorCode)、auth 状态机 `MTe/NTe/PTe/FTe`(62,149-62,192：attachAuth 判定→token 获取→账号变更 409→401 重试判定)、OIS 完整性令牌 `uT/ITe/LTe/dT/RTe/zTe/BTe`(62,194-62,254，`X-OAI-IS`/`X-OAI-IS-Update` + `ois1.` 正则 + globalState `a.U`)、URL 脱敏 `VTe/fT/HTe/pT`(62,233-62,281，`:param` 归一)、logger `mT = r.i('electron-fetch-wrapper')`(62,282)、**`hT` AuthenticatedDesktopFetchError**(62,291，`Authenticated desktop fetch failed (N)`)、`WTe` 下载失败错误(62,298)、常量 `GTe='vscode://codex/'`/`KTe='/codex/dictation-stream-connect-info'`/`XTe=12e4`(62,301-62,309)、**`ZTe` DesktopFetchService 类**(62,310-63,068，~760 行：fetchAuthenticatedJson/exportTraceBatch/getDownloadStream/handleRequest/fetchHttp/performDesktopFetch/prepareFetchInit/handleVsCodeFetchRequest/handleDictationStreamConnectInfoRequest/logFetchTiming/performProgressRequest)、计时 `gT`(63,070)、header 快照 `QTe`(63,073)、errorCode 提取 `_T`(63,082)、账号 schema `$Te/vT/yT`(63,086-63,123)、**`eEe` AccountInputs 类**(63,123-63,330，内部 `new Nee()` TanStack QueryClient + `/wham/accounts/check` + workspace settings 缓存)、`tEe`(63,332 退订包装)、`nEe`(63,345 composer items 桥)、`rEe`(63,368 主窗口 appActions 桥) |
| 63,391-63,404 | 应用 | browser-auth 操作记账 | `iEe`(63,391)：用 bootstrap `a.dt`（串行 update helper）+ globalState `a.I`（`electron-browser-auth-operations`）包装 browserAuthOperations——**与 bootstrap 21,863-21,992 的 `state/browser-auth-operations` 是同一持久化键的两端** |
| 63,405-63,541 | 应用 | 桌面元信息 + 图标 | **`aEe` BrowserAuthServices 类**(63,405，`services` getter 注 browserAuthOperations)、tray/应用图标 helpers `bT/xT/ST/CT/wT/TT`(63,414-63,476，按 `a.in` flavor 选 `icon-chatgpt[-nightly|-alpha|-beta]`)、**`oEe` DesktopEnvironment 类**(63,477-63,512，version/buildNumber/buildFlavor/osName/appIconMedium/dockIconPreviews/preloadAttribution)、图标 dataURL `sEe/ET/cEe/DT`(63,506-63,541，nativeImage resize 128) |
| 63,542-63,777 | 应用 | **AppServer 云后端 HTTP 客户端 + 混合 transport** | `lEe='wss://codex-cloud-backend.chatgpt.com/'`(63,542)、`uEe = new n.td()`(63,543，**顶层可变**：shared chunk 的 in-memory config 拦截器单例，12,4325 消费)、`OT` Long-lived host 描述(63,544)、**`kT` AppServerHttpClient 类**(63,547-63,595，getAuthToken/fetch→https 化校验→`l.net.fetch`)、分页 schema `AT/jT/MT`(63,596-63,604)、只读方法 schema `dEe/fEe/pEe/NT/PT/FT/mEe`(63,605-63,643，`thread/read`/`model/list`/`collaborationMode/list`/`account/rateLimits/read`/`thread/realtime/listVoices`/`thread/turns/list`/`thread/items/list`)、**`hEe` HybridWebsocketHttpTransport 类**(63,644-63,763：包装 websocket transport，把 dEe 命中的只读请求改走 `kT` HTTP GET，账号变更防护)、`gEe/_Ee`(63,765-63,777 实验开关组装) |
| 63,778-64,711 | 应用 | **app-server host 装配层** | **`vEe` AppServerFeatureEnablement 类**(63,778-63,872，logger `app-server-feature-enablement` 63,781，按 hostId 订阅连接 + statsig 变更→`experimentalFeature/enablement/set` + `rollout/compress`)、`yEe` threadStream 广播 handler 工厂(63,873-63,936，`thread-stream-following-changed`/`thread-stream-state-changed`/`client-status-changed`/`ipc-connection-reset` 5 个 broadcast handler)、**`bEe` ThreadReadStateContext 类**(63,937-64,054，errorReporter + getThreadReadStateContext + assertCurrent)、`LT` key 格式化(64,055)、**`xEe` HostRequestRouter 类**(64,058-64,187，server/native 请求路由 + 动态 app tool + prewarm)、worktree 候选 `SEe`(64,188)、host context `CEe`(64,197-64,260)、**`wEe` createHostThreadReadState**(64,261-64,366，闭包状态机：session open/unread 集合/重试)、`TEe=3e4`(64,367)、**`EEe` AppServerRequestSender 类**(64,368-64,480，sendRequest/prewarmThreadStart/超时 abandon/生命周期监听)、host services `DEe`(64,481-64,555，queuedMessages 锁 + port forward + archive)、prompt 限额 `RT=65536/zT/BT/OEe/kEe`(64,556-64,594)、execution settings `AEe`(64,595)、**`jEe` createHostExecutionConfig**(64,616-64,711，readSettings/readCodexConfig/readDeveloperInstructions/history 开关) |
| 64,712-65,142 | 应用 | host-app-server 存储桥 + 管理器注册表 | `MEe = r.i('host-app-server-storage')`(64,712)、`NEe`(64,713-64,778，persisted-atom 读写 `a.J` + globalState 白名单更新 + QUEUED_FOLLOW_UPS)、catalog 订阅 `PEe/FEe`(64,779-64,913)、**`IEe` CodexHomeService 类**(64,914-64,922，fetchHandler.readCodexHome 转发)、**`LEe` HostedAppServerManagerRegistry 类**(64,923-65,142，按 hostId 的 manager 实例注册表：identity 变更 retire、连接状态刷新、listener 分发) |
| 65,143-66,068 | 应用 | **remote control（远程环境控制）** | 错误类 `VT/HT/UT`(65,143-65,145)、环境 CRUD `BEe/VEe/HEe/WT/UEe/GT/KT/qT/JT/YT`(65,146-65,277，`/codex/remote/control/environments` REST + 分页递归)、logger `XT = r.i('remote-control-websocket')`(65,278)、`ZT=['remote_control_controller_websocket']`/`GEe='codex.remote_control.enroll'`/`QT=300`/`KEe='after-first-unlock-device-key-v1'`(65,279-65,304)、step-up token schema `qEe/$T`(65,286-65,304)、**`JEe` RemoteControlWebsocketTransport 类**(65,305-65,338，extends shared `n.Ut`：handshake→enrollClient→authorizeDeviceKeyChallenge)、`YEe/XEe`(65,339-65,383 授权检查)、auth identity 解析 `eE/tE/nE/rE/sE/cE/lE/eDe/tDe/nDe/uE/rDe/iDe/dE`(65,384-65,830，JWT claims→header 账号比对)、enrollment 查找 `fE/aDe/oDe/pE/sDe/cDe/lDe`(65,831-65,905)、device key `uDe/mE/dDe/hE/gE/fDe`(65,877-66,068，`allow_os_protected_nonextractable` 创建/签名/挑战校验) |
| 66,070-66,141 | 应用 | Codex CLI 安装脚本 | `_E='https://chatgpt.com/codex/install.sh'`/`pDe`(66,070-66,071)、平台判定 `mDe`/脚本生成 `hDe`(66,072-66,090)、`gDe='codex'`/PATH/CODEX_HOME 片段(66,091-66,093)、shell 引用 `vE/yE/bE`(66,094-66,133)、`yDe/bDe/xDe/xE` CLI 路径解析(66,134-66,141，`CODEX_CLI_PATH` env) |
| 66,143-66,306 | 应用 | **shell 环境加载 + SSH 常量** | npm env 清洗 `CDe/wDe/SE`(66,143-66,157)、`TDe=5e3`/`CE`(66,158-66,159，**顶层可变** `wE/TE/EE`)、**`DE` loadShellEnv**(66,166-66,242，`n.Zn({interactive:!0})` 登录 shell env + 超时 + 缓存)、超时表 `AE`(66,246-66,253，localSshConfigProbe/proxyWebSocketOpen/remoteLoginShellCommandMinimum/remoteCodexInstall/shellEnvLoad)、SSH 常量 `ADe='ws://codex-app-server/rpc'`/`jDe/jE/ME/NE`(app-server-control 目录、日志、agent sock 转发)/`PE`(BatchMode)/`FE=86`/`IE=8`/`LE`(66,254-66,270)、ssh 参数 `RE/zE/BE/MDe`(66,271-66,306) |
| 66,308-67,188 | 应用 | **AppServerTransportSshWebsocket** | **`VE` 类**(66,308-66,958，~650 行：connect→shell env 等待→ssh -G proxycommand 探测→ensureRemoteAppServer（codex 路径探测/版本校验/nohup 启动 app-server --listen unix://）→`new n._n(ADe,{createConnection})` ws over ssh proxy stream→心跳 `n.hn`→`n.gn` 包装；installCodex/killCodexProcess/getInstalledCodexVersion；错误 `n.fr` stage 化)、ws open 等待 `NDe`(66,959)、transport 工厂 `HE`(66,985，`CODEX_APP_SERVER_FORCE_CLI` 门 + sshConnection 提取)、ssh key `PDe/FDe/UE/WE`(66,999-67,024)、proxycommand 解析 `IDe/GE/LDe/RDe/KE/zDe/BDe/VDe/HDe/UDe/WDe/GDe/KDe`(67,027-67,188，shell 词法解析 + PATH 依赖判定)、超时执行 `qE`(67,175) |
| 67,190-67,399 | 应用 | **WSL stdio transport + 更新对话框** | WSL 命令构造 `qDe/JDe/YDe/XDe/ZDe/JE`(67,190-67,218，`wsl.exe -d <distro> -- /usr/bin/bash -lc` + codex 探测)、**`QDe` AppServerTransportWslStdio 类**(67,219-67,251，`new n.dn(e)` shared stdio transport + 版本校验 `n.Yu`)、更新文案 `$De~oOe`(67,252-67,259)、resume state schema `sOe`(67,260，`n.rf` zod)、**`cOe` UpdateCapability 类**(67,266-67,335，sparkleManager 桥 + `takeResumeState` 读 `a.J[Ht]` + macOS 安装确认对话框)、**`lOe` ApplicationMenuSnapshot 类**(67,336-67,369，Menu.getApplicationMenu 快照 + invokeItem)、菜单扁平 `YE`(67,370) |
| 67,400-67,682 | 应用 | codex-app-config 应用 + 环境信息 | `uOe = r.i('codex-app-config/apply')`(67,400)、remote 声明应用 `dOe/fOe/pOe/mOe/hOe`(67,401-67,583，managed remote connections + auto-connect + project order)、helpers `gOe/XE/_Oe/vOe`(67,584-67,605)、**`yOe` HotkeysCapability 类**(67,606-67,627)、环境常量 `bOe~TOe`(67,628-67,639，`Intl.DateTimeFormat().resolvedOptions().timeZone` **加载期求值**)、`EOe/DOe`(67,640-67,651 屏幕/locale 快照)、execution target schema `OOe`(67,652-67,682) |
| 67,683-68,231 | 应用 | **habitat-automations（云端自动化迁移）** | **`AOe` HabitatAutomations 类**(67,683-68,151，~470 行：logger `habitat-automations` 67,692、enrollment status/migrationPromise/syncPromise 串行队列、`localAutomationHabitatMigration` 开关、`item/completed` 通知触发 sync、principal change 处理)、装配 `NOe/POe/FOe`(68,240-68,304，`registerInternalAuthenticatedPrincipalChangeHandler` + cron 完成后 unsubscribe)、cron/heartbeat 转换 `$E/eD/tD/jOe/nD`(68,152-68,231，rrule `n.wr/n.Er` + `local_configuration` 解析) |
| 68,233-68,938 | 应用 | 杂项服务类群 + browser-use 配置文件 | `rD = r.i('habitat-automations')`、schema `MOe`(68,233-68,239)、`IOe` UpdateCapabilityService(68,306)、`LOe` mac swipe 订阅(68,318)、**`ROe` AvatarOverlayScrollHostService**(68,353-68,661，logger `AvatarOverlayScrollHostService` 68,371 + `Native swipe input` 68,373)、`zOe/BOe/VOe/HOe`(68,369-68,430)、providerInfo 序列化 `iD/aD`(68,662-68,682)、**`UOe` UnsubscribeOnce**(68,683)、extension 校验 `WOe/GOe/KOe`(68,695-68,704)、**`qOe = r.r('BrowserUseOriginState')`**(68,705)、规则 schema `JOe/oD/YOe`(68,706-68,715)、**`XOe` BrowserUseOriginState 类**(68,716-68,760，updateWebMcpEnabled/updateOriginRules，写 `browser/config.toml` 经 `sD~vD` 家族 68,761-68,938：`n.Oi()` codexHome + `n.wi` TOML parse + 原子写) |
| 68,939-69,353 | 应用 | browser settings 同步 | approval schema `CD/wD/TD/ED`(68,943-68,987)、`DD='/wham/browser/settings'`/`OD=15e3`(68,988-68,989)、**`uke` RemoteBrowserSettings 类**(68,990-69,021，远端 read/update + expected_revision)、规则映射 `dke/fke`(69,022-69,031)、**`pke` BrowserConfigFile 类**(69,032-69,092，`browser/config.toml` 文件层：读 `n.wi`、写 TOML `Yt` + tmp+rename 原子写)、默认值 `kD/AD/mke`(69,093-69,119)、`hke=6e4/gke=200/jD`(69,120-69,122)、**`_ke` BrowserSettingsSync 类**(69,123-69,353，30s 轮询 + 文件 watcher + 远端同步双向投影 `vke`) |
| 69,354-69,715 | 应用 | IAB 自动补全 + 扩展菜单 | `PD` data: URL 正则(69,354)、`yke=128`(69,355)、**`bke` AutocompleteManager 类**(69,356-69,596，ownerStates Map + createController + acceptToken + faviconRequests)、**`wke` ExtensionActionMenus 类**(69,597-69,715，badge/图标/菜单项管理) |
| 69,716-69,869 | **vendored** | lodash 子集 | `Tke`(forEach)/`Eke`(forEach r=n.za())/`Dke`(map)/`Oke`(sortBy)/`kke`(compareMultiple)/`Ake`/`jke`(baseFlatten)/`Mke`(orderBy) 六个 `e.t()` CJS 模块 + `Nke = e.a(Mke())` interop(69,870) |
| 69,870-70,993 | 应用 | **browser sidebar per-origin 服务群** | 图标挑选 `Pke/RD`(69,871-69,894，`Nke` orderBy 32px 最近图标)、扩展动作快照 `Fke/Ike`(69,895-69,941)、评论锚点 `Lke/Rke/zke/Bke/Vke`(69,942-69,982)、**`BD` UnsubscribeOnce**(70,017)、扩展事件订阅 `VD`(70,030)、扩展可用性 `HD`(70,044)、缩放换算 `UD`(70,051)、favicon 缓存 `WD/GD`(70,070-70,077)、favicon 订阅 `Hke/Uke`(70,078-70,143)、**`Wke` AnnotationFeaturePreview**(70,144-70,220，did-start-navigation 清理 + `a.At` 频道 send)、**`Kke` BrowserPageService 类**(70,221-70,573，per-origin 门面：runPageCommand/permission prompts/annotations/comments/thumbnail/restore)、**`Yke`**(70,574)/`Xke` BrowsingDataService(70,583-70,701，clearBrowsingData/summary/favicon/topSites)、`Zke/JD/Qke`(70,702-70,743，`Qke` sidebar 命令→window/task 路由表)、`$ke/eAe/tAe`(70,744-70,808，toolbar service 工厂)、**`nAe`**(70,812，getCurrentPageUrl)、**`iAe` DownloadService 类**(70,921-70,989，downloadStore 桥：acknowledge/cancel/pause/resume/chooseDownloadDirectory/searchHistory)、`aAe`(70,977)、`oAe/sAe` ExtensionRecentlyUsed(70,990-71,116，globalState `electron-browser-extension-recently-used`) |
| 70,994-71,365 | 应用 | **项目文件下载（project mirror）** | `pAe` 下载编排(71,117-71,211，staging 目录 + previous 回滚 + sha256 校验 + AGENTS.md 生成 `wAe`)、`mAe` 单文件流下载(71,185-71,212)、`rO`(71,213)、`hAe/gAe/_Ae/vAe/yAe/bAe/xAe/SAe/CAe/wAe/TAe/EAe/kAe/AAe`(71,217-71,364，manifest 读写 + 文件名清洗 + AGENTS.md 模板，`This directory is a local mirror of the ChatGPT project` 直接证据 71,303)、`QD` 错误类(71,057)/`fAe`(71,079)、`OAe` ProjectMirrorService(71,328-71,365) |
| 71,366-71,843 | 应用 | **Linux 桌面应用枚举（gio/XDG）** | `iO` execFile promisify(71,366)、`jAe=1e3` 缓存 TTL(71,367)、`aO/oO/MAe/sO` 正则与后缀(71,368-71,371)、`cO` 缓存(71,372，**顶层可变**)、`lO/NAe/uO`(71,373-71,401，`gio mime x-scheme-handler/https` + desktop 文件枚举)、`PAe/FAe/IAe/LAe/dO/fO/pO/mO/hO/RAe/zAe`(71,401-71,690，XDG icon theme 解析 + flatpak/snapd 目录 + .desktop 解析)、`gO/_O/vO`(71,678-71,701) |
| 71,702-72,000 | 应用 | **Windows 账户/注册表 + Chronicle + 浏览器族** | `yO='HKCU\'`(71,702)、`bO` createRequire(71,703)、admin 判定 `SO/CO`(71,705-71,725)、ACL/网络盘/注册表 `wO/TO/EO/DO/OO`(71,726-71,753)、**`kO` windows-account.node 加载器**(71,754-71,761，`native/windows-account.node` + `xO` 模块缓存)、browserFamily schema `AO`(71,761)、注册表路径 `jO`(71,762)、**`MO` BrowserFamilyService 类**(71,763-71,843，getInstalledBrowserFamilies/getExtensionStatus/installBanner/openSettings)、默认浏览器 `NO/PO/FO`(71,803-71,843)、**`IO` ChronicleService 类**(71,844-71,980，skysight chronicle enable/disable/pause/history，`config/value/write` `chronicle` 键)、回滚 `LO/RO`(71,981-72,000) |
| 71,981-72,660 | 应用 | **OIC outbound identity + environment setup schema** | `zO=500`(71,981)、**`BO` HostQueryCache 类**(71,982-72,014，extends shared `n.p`，invalidateHostQueryCache + plugins 通道 `Oo` )、**`VO` ClipboardService**(72,015-72,030，clipboard + mac bookmark)、OIC schema `HO/UO/WO/GO/KO/qO/JO/YO/XO/ZO/QO/$O/ek/tk/nk/rk/ik/ak/ok/sk/ck/lk`(72,031-72,165，`oic_` connection id + subject_template `oai:v1:oic:{connection_id}` + azure/aws/gcp provider + JWT claims 白名单)、模板解析 `uk/dk`(72,146-72,166)、environment setup schema `fk/pk/mk/hk/gk/_k/vk/yk/bk/xk/Sk/Ck/Dk/Ok/kk`(72,167-72,528，`environment-setup-server-configs-v1` + network policy + vault secrets + draft/approve 流程) |
| 72,529-72,958 | 应用 | **environmentConfig 客户端 + 输入监控权限** | **`Vk` EnvironmentConfigClient 基类**(72,529-72,661，delete/saveEnvironmentValue/list/approve 操作 + zod 校验)、路径构造 `Hk`(72,662)、`Uk=8192/Wk=512/Gk`(72,673-72,675)、**`Kk` EnvironmentConfigService 类**(72,676-72,834，`new kT(e,t)` httpClient + 认证一致校验 + operation 轮询 + 诊断)、`Yk/Xk/Zk`(72,836-72,858，`item/tool/requestUserInput` 自动 resolution snooze + `a.J` persisted atom `fk` 键)、**input-monitoring 权限**：`Qk='input-monitoring-permission.node'`/`$k`(72,859-72,860)、`eA` createRequire(72,861)、`tA/nA/rA`(72,862-72,891，macOS `hasInputMonitoringPermission` addon 探测)、`iA` 系统偏好 URL(72,892) |
| 72,892-73,180 | 应用 | **CodexMicro 设备服务（硬件伴侣）** | `iA` 系统偏好 URL(72,892)、`oA=250` 轮询间隔(72,894)、`sA` 初始设备状态(72,895，`{status:'not-detected',transport:null,...}`)、**`cA` CodexMicroHostService 类**(72,896-72,934，logger `CodexMicroHostService` 72,900 直接证据：getInputMonitoringPermissionStatus/ownsPrimaryWindow（powerMonitor idle state）/updateAgentThreadKeys/updateLighting)、**`lA` CodexMicroServiceManager 类**(72,935-73,180，~245 行：**动态 require `./service-CtZiLFyH.js`** 73,022 `CodexMicroService`、deviceState 生命周期状态机（not-detected/detected/connected/error + transport handoff）、HID/joystick 事件转发、session lock monitor、`codex-micro-device-state-changed` 广播) |
| 73,181-75,000 | **vendored** | yaml（`yaml` npm 包 v2.x） | `uA`~`YA` 等 40+ 个 `e.t()` CJS 模块（73,181 `Symbol.for('yaml.alias')` 起，75,481 `YA` YAMLSet，……延续到 79,240 `Dj` 聚合导出 Composer/Document/Schema/parse/parseDocument/stringify/visit）。R5 只含其前 ~1,819 行；**整段 73,181-79,294 归 vendored，派发时划给 R6 侧一并剔除** |

---

## 2. vendored 识别

| 包 | 版本 | 行区间（R5 内） | 证据 | 置信度 |
|---|---|---|---|---|
| **@statsig/js-client（js-mono 构建）** | 3.33.4 | 60,000-61,578（完整带 56,944-61,578） | 57,268 `e.SDK_VERSION = '3.33.4'`、57,236 `https://api.oaistatsig.com/v1`、57,238 `https://statsigcdn.openai.com/v1`、60,035-61,577 22 个 `e.t()` 模块（`mTe` StatsigClient 主体 60,990）、59,502 `e.StatsigClientBase = class` | 高 |
| **lodash（子集）** | 4.x | 69,716-69,869 | `Tke`(forEach)、`Dke`(map)、`Oke`(sortBy)、`Mke`(orderBy) 与 lodash 源码逐行一致；`n.Vd()/n.za()/n.qr()/n.cc()/n.sc()` 为 shared chunk 内的 lodash内部依赖 interop；消费点仅 69,877 `RD`（扩展图标 orderBy） | 高 |
| **yaml** | 2.x | 73,181-75,000（完整带 73,181-79,294） | 73,182-73,188 `Symbol.for('yaml.alias'/'yaml.document'/'yaml.map'/'yaml.pair'/'yaml.scalar'/'yaml.seq'/'yaml.node.type')`；79,259-79,283 导出表 `e.Composer/Document/Schema/YAMLError/YAMLParseError/YAMLWarning/Alias/Pair/Scalar/YAMLMap/YAMLSeq/Lexer/LineCounter/Parser/parse/parseAllDocuments/parseDocument/stringify/visit/visitAsync`；消费点 79,579 `(0, Dj.parse)(t[1])`（R6 侧） | 高 |

注意：粗扫 §7 未列出这三段（statsig 尾部被计入 60,000s 应用桶、lodash/yaml 完全漏检）。**ws 库不在本区间**——`VE` 用的 `n._n`（WebSocket）、`n.hn`（心跳）、`n.gn`（wrapper）、`n.Ut`（连接基类）、`n.dn`（stdio transport）都是 shared chunk（src-DldfpmrL.js，46,465 `kWebSocket`、47,314 frame 上限报错、48,161 `WebSocket is not open` 直接证据）的导出，即 **ws vendored 在 shared chunk**，R5 只是消费方。

---

## 3. 子系统聚类与模块拆分方案

> 建议模块名均为 kebab-case；「定义」列出压缩名 → 建议语义名。行区间含边界误差 ±10 行。

### 3.1 认证 fetch 层（`api/desktop-fetch`，62,089-63,390 + 63,391-63,404，~1,300 行）

- `cT`→`readAccountInfoFromToken`(62,089)、`lT`→`ApiFetchError`(62,141)、`MTe`→`resolveAuthState`(62,149)、`NTe`→`loadAuthToken`(62,160)、`PTe`→`attachAuthHeaders`(62,179)、`FTe`→`shouldRetryAfter401`(62,191)、`uT/ITe/LTe/dT/RTe/zTe`→`ois`（integrity state 令牌族）、`BTe`→`IntegrityStateStore`(62,209，globalState `a.U`)、`VTe/fT/HTe/pT`→`urlRedaction`(62,233-62,281)、`hT`→`AuthenticatedDesktopFetchError`(62,291)、`WTe`→`FileDownloadError`(62,298)、**`ZTe`→`DesktopFetchService`**(62,310-63,068，本区最大单体类 ~760 行)、`gT/QTe/_T`→metrics helpers、`$Te/vT/yT`→accounts schema、`eEe`→`AccountInputs`(63,123)、`tEe/nEe/rEe`→服务桥、`iEe`→`createBrowserAuthOperations`(63,391)。
- **`ZTe` 内部建议再拆**：`fetchAuthenticatedJson`+`exportTraceBatch`+`getDownloadStream`（高层 API）与 `performDesktopFetch`+`prepareFetchInit`+`performProgressRequest`（低层管道：auth 状态机→workspace 路由 `a._t`→`applicationNetwork.fetch`→401 刷新重试→metrics）可分两个文件。
- 与 bootstrap `api/authed-fetch` 的关系见 §6.3。

### 3.2 AppServer 连接层（`app-server/*`）

| 聚类 | 行区间 | 建议模块 | 主要定义 |
|---|---|---|---|
| 云后端 HTTP 客户端 | 63,542-63,763 | `app-server/cloud-backend-client` | `lEe`→`CLOUD_BACKEND_WS_URL`、`OT`→`longLivedHostDescriptor`、`kT`→`AppServerHttpClient`、`AT/jT/MT/dEe/fEe/pEe/NT/PT/FT/mEe`→readOnlyMethod schemas、`hEe`→`HybridWebsocketHttpTransport` |
| 特性开关下发 | 63,765-63,936 | `app-server/feature-enablement` | `gEe/_Ee`→enablement 组装、`vEe`→`AppServerFeatureEnablement`、`yEe`→`createThreadStreamBroadcastHandlers` |
| host 装配 | 63,937-64,711 | `app-server/host-assembly`（可再拆 2-3 个文件） | `bEe`→`ThreadReadStateContext`、`LT`、`xEe`→`HostRequestRouter`、`SEe/CEe`→host context、`wEe`→`createHostThreadReadState`、`EEe`→`AppServerRequestSender`、`DEe`→`createHostServices`、`AEe`→`readExecutionSettings`、`jEe`→`createHostExecutionConfig`、`RT/zT/BT/OEe/kEe`→prompt schema |
| 存储桥 + 注册表 | 64,712-65,142 | `app-server/host-storage` | `NEe`→`createHostStorage`、`PEe/FEe`→catalog 订阅、`IEe`→`CodexHomeService`、`LEe`→`HostedAppServerManagerRegistry` |
| **transport 家族** | 66,143-67,365 | `app-server/transport-ssh-websocket`（66,143-67,188 + 66,308 `VE`）+ `app-server/transport-wsl-stdio`（67,190-67,365） | shell env：`DE`→`loadShellEnv`、`CDe/SE`→npm env 清洗；ssh：`AE/ADe/jDe/jE/ME/NE/PE/FE/IE/LE`→常量、`RE/zE/BE/MDe`→ssh args、**`VE`→`AppServerTransportSshWebsocket`**、`NDe`→`waitForWebsocketOpen`、`HE`→`createTransport`（工厂）、`IDe~KDe`→proxycommand 解析、`qE`→`withTimeout`；WSL：`qDe~JE`→wsl 命令构造、**`QDe`→`AppServerTransportWslStdio`** |
| 远程控制连接 | 65,143-66,068 | `remote-control/client` + `remote-control/device-key` + `remote-control/websocket-transport` | `VT/HT/UT`→错误类、`BEe~YT`→environments REST、**`JEe`→`RemoteControlWebsocketTransport`**、`rE`→`enrollClient`（enroll/refresh challenge 双流程）、`fE/pE`→enrollment 查找、`gE/fDe`→device key proof、`eDe/tDe/nDe`→step-up token 校验 |

### 3.3 账号/statsig（`account/*`，61,579-62,088）

- `account/statsig-adapter`(61,579-61,922)：`Xw`→`STATSIG_GATE_NAMES`、`Zw`→`toolCatalogSchema`、`hTe`→`defaultToolCatalog`、`xTe`→`createOverrideAdapter`、`tT`→`nameMatches`、**`STe`→`PublishedStatsig`**、`iT/CTe`→stableId。
- `account/thread-summaries-store`(61,923-62,087)：`aT`→`SCHEMA_VERSION`、`oT`→`db`（顶层可变单例）、`wTe`→`getThreadSummariesDb`、`TTe`→`migrate`、`ETe`→`dbFileName`、`DTe`→`ThreadTurnSummariesStore`。
- 与 63,123 `eEe` AccountInputs 合并考虑为 `account/account-inputs`。

### 3.4 桌面元信息（`desktop/environment`，63,405-63,541）

- `aEe`→`BrowserAuthServices`、`oEe`→`DesktopEnvironment`（get() 返回 version/buildNumber/buildFlavor/osName/appIconMedium/dockIconPreviews）、`bT/xT/ST/CT/wT/TT/sEe/ET/cEe/DT`→`app-icons`（可独立 `desktop/app-icons.ts`）。

### 3.5 automations（`automations/habitat`，67,683-68,304）

- **`AOe`→`HabitatAutomations`**（enrollment/migration/sync 串行队列）、`NOe`→`registerHabitatAutomations`、`POe`→`localAutomationOps`、`FOe`→`unsubscribeCompletedAutomation`、`$E/eD/tD/jOe/nD`→`automationRecordConverters`（cron/heartbeat + rrule）。
- 依赖方向：habitat → appServerClient + globalState（`a.N/a.M`）+ fetch；被 R2 的 automations 执行引擎间接协作（R2 触发 cron，R5 的 `FOe` 在完成后退订）。

### 3.6 browser-use 配置与设置同步（`browser-use/*`，68,233-69,353）

- `browser-use/origin-state`(68,683-68,938)：`UOe`、`qOe`、`XOe`→`BrowserUseOriginState`、`sD~vD`→config.toml 读写族（`n.Oi()` codexHome）。
- `browser-use/settings-sync`(68,943-69,353)：`uke`→`RemoteBrowserSettings`、`pke`→`BrowserConfigFile`、`_ke`→`BrowserSettingsSync`、`kD/AD`→defaults。
- `browser-use/autocomplete`(69,354-69,715)：`bke`→`AutocompleteManager`、`wke`→`ExtensionActionMenus`。

### 3.7 browser sidebar per-origin 服务（`browser-sidebar/*`，69,870-71,365）

- `browser-sidebar/page-service`(70,017-70,808)：`BD/VD/HD/UD/WD/GD/Hke/Uke/Wke/Kke/Yke/Xke/Zke/JD/Qke/$ke/eAe/tAe/nAe`。
- `downloads/download-service`(70,921-71,116)：`iAe`→`DownloadService`、`aAe`、`oAe/sAe`→`ExtensionRecentlyUsed`。
- `downloads/project-mirror`(70,994-71,365)：`QD/fAe/OAe/pAe/mAe/rO/hAe~AAe`（staging/回滚/sha256/AGENTS.md）。

### 3.8 平台枚举（`platform/*`，71,366-72,000 + 72,892-73,180）

- `platform/linux-apps`(71,366-71,701)：`iO~vO`（gio/XDG/flatpak/snapd）。
- `platform/windows-account`(71,702-71,761)：`yO/bO/SO/CO/wO/TO/EO/DO/OO/kO`（windows-account.node addon）。
- `platform/browser-family`(71,762-71,843)：`AO/jO/MO/NO/PO/FO`。
- `chronicle/service`(71,844-72,000)：`IO`→`ChronicleService`、`LO/RO`→rollback。
- `device/codex-micro`(72,892-73,180)：`sA/oA/cA`→`CodexMicroHostService`、`lA`→`CodexMicroServiceManager`（动态 require `./service-CtZiLFyH.js`）。
- `permissions/input-monitoring`(72,836-72,958)：`Yk/Xk/Zk`（requestUserInput snooze）、`Qk/$k/eA/tA/nA/rA/iA`（input-monitoring addon）。

### 3.9 OIC / environment setup（`environments/*`，71,981-72,835）

- `environments/outbound-identity`(72,031-72,166)：`HO/UO/WO/GO/KO/qO/JO/YO/XO/ZO/QO/$O/ek~lk/uk/dk`。
- `environments/setup-schemas`(72,167-72,528)：`fk~kk`。
- `environments/config-client`(72,529-72,835)：`Vk`→`EnvironmentConfigClient`、`Hk/Uk/Wk/Gk`、**`Kk`→`EnvironmentConfigService`**（`new kT` httpClient）。

### 3.10 杂项（`desktop/*`）

- `desktop/update-capability`(67,252-67,369)：`$De~oOe` 更新文案、`sOe` resume schema、`cOe`→`UpdateCapability`、`lOe`→`ApplicationMenuSnapshot`。
- `desktop/codex-app-config-apply`(67,400-67,605)：`uOe/dOe/fOe/pOe/mOe/hOe/gOe/XE/_Oe/vOe`（remote 声明应用 + auto-connect）。
- `desktop/hotkeys-capability`(67,606-67,682)：`yOe/EOe/DOe/OOe`（含环境快照）。
- `desktop/clipboard`(72,015-72,030)：`VO`→`ClipboardService`。
- `desktop/host-query-cache`(71,981-72,014)：`BO`→`HostQueryCache`（extends shared `n.p`）。
- `avatar/scroll-host`(68,306-68,430)：`IOe/LOe/ROe/zOe/BOe/VOe/HOe`。

---

## 4. 顶层可变状态清单

（模块级 `var/let` 且被运行时改写；行号核实过。注意本区大量「状态」在类字段/闭包内，不在此列）

| 名 | 行号 | 语义 | 读/写方 | 证据 |
|---|---|---|---|---|
| `oT` | 61,922 | thread-summaries sqlite 数据库懒单例（`null`=未开） | 写：`wTe`(61,923)；读：`DTe` 构造方 | 高 |
| `uEe` | 63,543 | shared chunk `n.td()`（in-memory config 拦截器）单例——拦截 `thread/read`（带 `:` 的 thread id）与缺 environmentId 的 `command/exec`/`fs/*` 请求 | 写：无（构造即固定）；读：124,325 `uEe.send(t.request)`（MCP sandbox 区） | 高 |
| `CE` | 66,159 | `CODEX_ELECTRON_USER_DATA_PATH` 存在时的 `CODEX_HOME` 快照（加载期求值） | 读：`DE/DDe`(66,185-66,204) | 高 |
| `wE` | 66,160 | shell env 加载 in-flight promise 缓存 | 写/读：`DE`(66,170-66,197) | 高 |
| `TE` | 66,161 | shell env 加载超时档位缓存 | 同上 | 高 |
| `EE` | 66,162 | shell env 最近结果缓存（`loaded` 短路） | 写：`kDe`(66,243)；读：`DE`(66,167) | 高 |
| `LE` | 66,269 | Map：ssh proxycommand 解析结果缓存（key=命令串） | 读：`IDe`(67,027) | 高 |
| `xO` | 71,704 | windows-account.node addon 模块缓存 | 写/读：`kO`(71,754-71,761) | 高 |
| `cO` | 71,372 | Linux .desktop 枚举缓存（key=目录+desktop 列表，TTL `jAe=1e3`） | 写/读：`pO`(71,564-71,583) | 高 |
| `WD` | 70,070 | WeakMap: webContents→Map(size→refcount)，favicon 订阅去重 | `Hke`(70,078-70,143) | 高 |
| `qD` | 70,193 | WeakMap: viewportSize promise→{complete}，viewport 等待取消 | `Gke`(70,194-70,220) | 高 |
| `ZD` | 70,989 | WeakMap: globalState→`sAe`（扩展最近使用单例） | `oAe`(70,990) | 高 |
| `Nke` | 69,870 | `e.a(Mke())` lodash orderBy interop（vendored，加载期求值） | `RD`(69,877) | 高 |

类内静态/字段可变状态（同样需注意）：`ZTe.abortControllers`(Map)、`ZTe.traceExportEnabled`（懒缓存）、`VE.hasConnected/installedCodexVersion`、`QDe.installedCodexVersion`、`eEe` 的 `#e`（QueryClient）、`AOe.operationTail/migrationPromise/syncPromise`、`lA.deviceState/servicePromise/sessionLockMonitor`。

---

## 5. 顶层副作用序列（模块加载即执行）

区间内列 0 非声明语句仅 4 处命中，全部是**模板字符串内容**（66,115-66,121 SSH 脚本、71,303-71,312 AGENTS.md 模板、74,163 yaml fold 正则），非真实语句。真实的加载期执行序列：

1. **60,000-61,578**：vendored statsig 的 `e.t()` 包装器定义（惰性，首次引用才执行）——非业务副作用。
2. **61,594**：`Zw = n.wf({...})` zod schema 构造（纯）。
3. **62,282 / 62,088 / 63,781(字段) / 64,712 / 65,278 / 67,400 / 68,233 / 68,705**：logger 创建（`r.i('electron-fetch-wrapper')`、`r.i('electron-fetch-handler')`、`r.r('app-server-feature-enablement')`（实例化时）、`r.i('host-app-server-storage')`、`r.i('remote-control-websocket')`、`r.i('codex-app-config/apply')`、`r.i('habitat-automations')`、`r.r('BrowserUseOriginState')`）——构造 logger 对象，无 I/O。
4. **63,543**：`uEe = new n.td()`——shared chunk 拦截器实例构造（纯）。
5. **66,143**：`CDe = new Set([...])`、**66,159** `CE = process.env...?.trim() ? process.env.CODEX_HOME : void 0`（**加载期读环境变量**，重写时保持模块级 const 语义即可）、66,269 `LE = new Map()`。
6. **66,246-66,270**：常量表（`AE` 超时表、`ADe/jDe/jE/ME/NE/PE/FE/IE`）纯数据。
7. **67,627**：`TOe = Intl.DateTimeFormat().resolvedOptions().timeZone`——**加载期调用 Intl**（重写时注意：若模块被提前 import，时区读取时机不变即无碍）。
8. **69,716-69,869**：lodash `e.t()` 包装器（惰性）；**69,870** `Nke = e.a(Mke())`——**加载期执行** interop 并实例化 orderBy。
9. **70,070/70,193/70,989/71,372**：`new WeakMap()/new Map()/null` 空容器。
10. **71,366**：`iO = (0, d.promisify)(P.execFile)`——promisify 包装（纯）。
11. **72,959**：`sA = {status:'not-detected',...}` 纯数据；72,963 `oA=250`。
12. **73,181-75,000**：yaml `e.t()` 包装器（惰性）。

**结论**：R5 **没有**模块加载期的 Electron 事件接线 / fs I/O / 定时器 / 网络副作用。所有连接、订阅、轮询（`_ke.start()` 的 `setInterval`、`lA` 的 sessionLockMonitor、`ZTe` 的 fetch）都在**实例方法被启动流程调用时**发生。实例化点集中在 159,262-161,063（AppServer 装配区，属 R10/R11 侧）与 72,680（`Kk` 内）。**置信度：高**（列 0 语句全集已枚举 + 关键类构造函数逐个核验无 ipcMain/app.on）。

---

## 6. 跨 chunk 依赖

### 6.1 @chunk/shared（`n.*`，src-DldfpmrL.js）——R5 主要用法

- **zod 实例族**（本区 schema 构造 ~150 处）：`n.Of/n.Cf/n.gf/n.wf/n.hf/n.jf/n.Ef/n.df/n.vf/n.Df/n.bf/n.xf/n.Mf/n.Pf/n.Sf/n._f/n.Af/n.mf/n.rf`（69,021 `sOe` 用第二套 zod `n.rf.*`）。
- **EventEmitter 基类** `n.Uf`：本区 30+ 个类直接继承（`STe/CTe/eEe/tEe/nEe/rEe/aEe/oEe/IEe/LEe/cOe/lOe/AOe/IOe/ROe/zOe/BOe/HOe/UOe/XOe/Cke/BD/Uke/Kke/Yke/nAe/iAe/aAe/fAe/OAe/MO/IO/BO/VO/Vk`）。
- **连接/传输设施**（shared chunk 内含 vendored ws + stdio）：`n.dn`→stdio transport（67,221 `new n.dn(e)`）、`n._n`→WebSocket（66,341 `new n._n(ADe,{createConnection})`）、`n.hn`→websocket 心跳、`n.gn`→websocket wrapper、`n.Ut`→websocket 连接基类（65,305 `JEe extends n.Ut`）、`n.pr`→readyState 枚举（63,705 `n.pr.Open`）、`n.Wn`→not-ready 错误、`n.fr`→ssh setup 错误（stage 化）、`n.p`→query cache 基类（72,002 `BO extends n.p`）。
- **版本/路径工具**：`n.Yu`（app-server 版本兼容判定，66,547/67,226）、`n.qu`（版本不符文案）、`n.Ju`（版本串解析）、`n.$n`（shell 单引号转义，66,521 等 30+ 处）、`n.Fi`（WSL 路径转换）、`n.Kn`（进程 spawn 包装，66,476/67,228）、`n.Oi()`（codexHome，68,754 等）、`n.wi`（TOML parse，68,779）、`n.Zn`（登录 shell env，66,193）、`n.Ta`（env 键）、`n.er`（shell 词法解析，67,125）、`n.qn.resolve`（PATH 查找，67,166）。
- **身份/token**：`n._i`（token→principal）、`n.vi`（token claims）、`n.Gs/n.Ys/n.Zs`（auth 判定，62,150-62,153）、`n.t`（workspace 授权错误提取，62,801）、`n.$s`（errorCode 提取，62,357）、`n.kc`（abortable promise 包装，本区 ~20 处）、`n.Qa`（keychain 错误判定，65,845）、`n.eo`（enrollment schema，65,837）、`n.$a`（错误码，65,281）、`n.bs`（hostId 构造，65,243）、`n.ys`（ssh alias→hostId，67,431）、`n.Wt`（ws url 构造，65,322）。
- **app-server 通知/请求**：`n.ls`（通知方法白名单，64,078）、`n.ed/n.$u`（id/threadId 构造）、`n.Wu`（版本特性判定，63,894）、`n.Ku/Gu`（分页/排序特性，64,383-64,389）、`n.rc`（defaultEnableFeatures 合成，61,838）、`n.tc`（feature overrides 合成，64,606/64,689）、`n.fi/li/mi/di/ui`（composer items，63,350-63,366）、`n.oc`（config keyPath，71,973）、`n.m`（clientCoordination，68,299）、`n.k`（node-repl kill，64,522）、`n.sr`（parseUrl，64,531）、`n.ga`（archiveUndoDurationMs，64,532）、`n.gr`（错误分类，71,887）、`n.bd/Ns/va/Ca/Ex`（projects 工具，67,410/68,213/64,823-64,829）。
- **globalState 键对象** `n.iu.*`：CODEX_MANAGED_REMOTE_CONNECTIONS/REMOTE_PROJECTS/PROJECT_ORDER/REMOTE_CONNECTION_MAX_RETRY_ATTEMPTS/REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID/QUEUED_FOLLOW_UPS/THREAD_WRITABLE_ROOTS/THREAD_PROJECTLESS_OUTPUT_DIRECTORIES/SIDEBAR_PROJECT_THREAD_ORDERS（67,401-64,770 密集）。
- **浏览器族/插件**：`n.Pc`（browser family 配置）、`n.Bc`（family 校验）、`n.Rc`（extension ids）、`n.Ul/Al/on`（marketplace/插件路径，71,824-71,836）、`n.Ic`（ProgId→family，71,817）、`n.Bu`（semver 解析，63,488/67,385）。
- **其他**：`n.Wr`（disposable 聚合）、`n.td`（in-memory 拦截器）、`n.ci/oi`（sqlite open，61,925）、`n.to`（JWT parse，65,711）、`n.Cs`（hostId 判定，72,839）、`n.$u/n.ed`、`n.qr/za/cc/sc/Vd/cd`（lodash 内部 interop，69,717-69,858）。

### 6.2 logger chunk（`r.*`）

具名 logger（模块级）：`electron-fetch-handler`(62,088 `jTe`)、`electron-fetch-wrapper`(62,282 `mT`)、`remote-control-websocket`(65,278 `XT`)、`host-app-server-storage`(64,712 `MEe`)、`codex-app-config/apply`(67,400 `uOe`)、`habitat-automations`(68,233 `rD`，类内同名字段 67,692)。类字段 logger：`app-server-feature-enablement`(63,781)、`AppServerTransportSshWebsocket`(66,311)、`environmentConfig`(72,678)、`CodexMicroHostService`(72,900)、`CodexMicroServiceManager`(72,937)、`BrowserUseOriginState`(68,705)、`BrowserSettingsSync`(69,095)、`AvatarOverlayScrollHostService`(68,371)。`r.n()` 根 logger（换行拆分调用形态 `r\n.n()`）：66,212（shell env 加载失败 warning，`DDe` 内）、72,869（input monitoring 权限检查失败 warning，`tA` 内）。

### 6.3 bootstrap chunk（`a.*`）与 bootstrap authed-fetch 的关系

对照 `docs/bootstrap-export-table.txt`（导出名→bootstrap 压缩名）核实：

| main 侧 `a.*` | bootstrap 名 | bootstrap 语义 | R5 用法（行号） |
|---|---|---|---|
| `a.in` | `M` | build flavor 模型 | 20 处：`ST/CT/bT` 图标选择、`MO` 浏览器族、`FO` dev 插件（63,414-71,838） |
| `a.en` | `tC` | **TS `using`/asyncDispose 降级 helper** | 13 处：RPC 结果推送模式 `r.u(...)/r.e/r.d()`（69,906/70,078/70,744 等） |
| `a.xt` | `rT` | API URL 构造（`n.Qs(nT(e), t)`：base+path） | 6 处：`ZTe.exportTraceBatch`(62,381)、`JEe` handshake(65,321)、`iDe`(65,777) |
| `a.J` | `wE` | globalState 键 `electron-persisted-atom-state` | 6 处：`NEe`(64,717)、`cOe.takeResumeState`(67,405)、`Yk/Xk`(72,847)、`jEe`(64,625) |
| `a.At` | `Ew` | IPC 频道 `codex_desktop:message-for-view` | 5 处：`Wke`(70,211) 等 sidebar send |
| `a.N` | `LE` | `electron-automations-installation-id` | `AOe`(67,708/67,724/67,968) |
| `a.M` | `RE` | `electron-automations-habitat-migration-state` | `AOe`(67,955-67,974) |
| `a.mt` | `cT` | attachAuthHeaders（Bearer/Account-Id/Fedramp/originator） | `PTe`(62,188)、`kT.fetch`(63,560)、`JEe`(65,319) |
| `a.ht` | `oT` | workspace URL 重写（backendOrigin + routing override） | `JEe`(65,322)、`iDe`(65,779) |
| `a.yt` | `uT` | token→accountId | `Kk`(72,684)、`PTe`(62,186) |
| `a.vt` | `aT` | **authedFetch（bootstrap 的认证请求管道）** | `WT`(65,188)、`jOe` 附近 68,121 |
| `a.pt` | `tT` | SignInError | `WT`(65,190)、`rE`(65,417) |
| `a._t` | `sT` | workspace auth 一致校验（AbortError） | `ZTe.performDesktopFetch`(62,741)、`JEe`(65,319)、`rE`(65,417) |
| `a.gt` | `lT` | attachOriginatorHeaders（originator/UA） | `ZTe.exportTraceBatch`(62,382) |
| `a.U` | `VE` | `electron-integrity-state-envelope` | `BTe`(62,218-62,227) |
| `a.Y` | `PE` | `electron-remote-control-client-enrollments` | `oDe/sDe/cDe`(65,837-65,868) |
| `a.z` | `XE` | `electron-codex-app-config-applied-remote-declarations` | `dOe/fOe/hOe`(67,404-67,515) |
| `a.I` | `TE` | `electron-browser-auth-operations` | `iEe`(63,398) |
| `a.nn` | `Kt` | build number 懒 getter | `oEe`(63,490)、`cOe`(67,386) |
| `a.an` | `j` | 设置读取（`codexReleaseChannel`） | `cOe`(67,387) |
| `a.hn` | `We` | NativeIntl 实例（formatMessage） | `cOe.installUpdate`(67,300-67,335) |
| `a.l` | `$A` | OEM Custom.data 读取（preloadAttribution） | `oEe`(63,495) |
| `a.dt` | `dn` | 串行化 update helper（`updateAndPersist` 包装） | `iEe`(63,392) |

（R5 窗口内其余 `a.length/a.push/a.body` 等命中均为局部变量/属性遮蔽，已剔除。）

**`lT`/`hT` 与 bootstrap 19,778-19,86 authed-fetch 的关系——分层而非重复**（直接证据）：

1. **bootstrap `api/authed-fetch`（`tT/nT/rT/iT/aT/oT/sT/cT/lT/uT`）是「轻量直连管道」**：`aT`（main 侧 `a.vt`）= getBackendRequestAuth → 附加头（`cT`=main `a.mt`）→ `o.net.fetch` → 401 刷新重试一次。服务对象是 bootstrap 自身（appcast/sparkle）与 main 中**简单的后端 REST**（R5 的 remote-control environments REST `WT`、OIC）。
2. **main R5 的 `ZTe`（DesktopFetchService）是「桌面全功能 fetch 服务」**：面向 renderer 的 HTTP 请求代理（`fetchHttp`/`handleRequest`）+ 认证 JSON API（`fetchAuthenticatedJson`）+ trace 导出 + 下载流 + vscode/dictation 特判。它**不复用** `a.vt` 管道，而是自带更重的状态机（`MTe/NTe/PTe/FTe`：attachAuth 判定→cached/loaded/refreshed token→账号变更 409→401 重试→workspace 路由）。
3. **两套共享同一批底层语义函数**（都从 bootstrap import）：header 附加 `a.mt`、workspace 路由 `a.ht`/`a._t`、URL 构造 `a.xt`、token 解析 `a.yt`。即 **header/workspace 语义单点在 bootstrap，fetch 管道有两套**：轻量（bootstrap `aT`）与全功能（main `ZTe`）。错误类型也分层：bootstrap 用 `tT`（SignInError，main 侧 `a.pt`）+ DOMException；main 自定义 `lT`（ApiFetchError，62,141）与 `hT`（AuthenticatedDesktopFetchError，62,291）。
4. **重写建议**：把 header 附加/workspace 路由/token 解析保留在 `api/authed-fetch`（bootstrap 侧已规划），main 的 `ZTe` 拆为 `api/desktop-fetch-service` 并 import 上述函数；`lT/hT` 归 main 侧错误模块。切勿把两套管道合并成一个——`ZTe` 的 abortControllers/metrics/progress/observer 语义是 bootstrap 管道没有的。

### 6.4 其他 chunk

- `o.t(...)` resources-path：72,760（windows-account.node 探测）、72,886（input-monitoring addon）。
- `i.*`（main-shared）：本区未发现可靠用法（命中为参数遮蔽）——采样推断，置信度中。
- 动态 require：72,935 `lA` → `./service-CtZiLFyH.js`（CodexMicro 硬件服务，**重写时这是一个新的子 chunk**）。

---

## 7. 拆分风险

1. **vendored 边界三处修正必须落进派发计划**（§0）：60,000-61,578 statsig、69,716-69,869 lodash、73,181-79,294 yaml（R5/R6 边界应从 75,000 改到 73,181，yaml 整段划出）。statsig 的应用接线在 61,579-61,922（`STe` PublishedStatsig）+ 159,262 实例化——重写时以 npm `@statsig/js-client@3.33.4` 提供 `StatsigClient`，应用侧只需重写 `Xw/Zw/xTe/STe` 适配层。
2. **连接生命周期是本区最大风险**：
   - `ZTe.performDesktopFetch` 的 auth 状态机有**三个失败短路**（账号变更 409 `account_changed`、workspace 路由 432、401 刷新重试），且 workspace 模式下 response body 要 `pipeThrough(TransformStream)` 挂 abort signal（62,800-62,806）——重写时顺序错一处就会泄漏 body 或丢 abort。
   - `VE`（ssh websocket）的 `connect()` 有**快路径**（`hasConnected` 时直接 connectToRemoteAppServer，失败才 ensureRemoteAppServer）与 shell env 等待（proxycommand 依赖 PATH 时阻塞）——懒求值语义必须保留。
   - `LEe`（HostedAppServerManagerRegistry）以 identity/连接事件 retire 实例，`eEe`（AccountInputs）内部 QueryClient 在 identity 变更时 `clear()`——两处都与 TanStack Query 的 vendored（955-2,411）耦合，重写后需引 npm `@tanstack/query-core` 对接。
3. **懒求值**：`oT`（61,922 thread-summaries db 首用时 open+migrate）、`kO`（71,754 windows-account.node 首用时加载）、`nA`（72,875 input-monitoring addon 首用时加载）、`ZTe.traceExportEnabled`（首用时读 app-server 配置）、`VE/QDe.installedCodexVersion`（缓存远端版本探测）、`pO`（71,564 Linux desktop 枚举 1s TTL 缓存）、`DE`（66,166 shell env：in-flight 去重 + loaded 短路 + 超时档位）。任何改成 import-time 求值的重写都会改变失败时机与日志时序。
4. **与 R3/R4 的依赖方向**：R5 的 host 装配层（`xEe/EEe/wEe/LEe`）消费 R3 的 conversation/stream 类型（`rw` thread 总管在 64,830 被构造——`rw` 定义在 R4 区 54,073 附近）、`cee` 连接注册表（913，R1）。方向单一：R5 → R3/R4 的存储与流原语；反向只有 R3 的 `Yge` app-server stream（32,447）消费 R5 的 transport 工厂 `HE`（经 159,296 装配注入，非直接 import）。重写时保持「transport/装配在上、存储在下」即可无环。
5. **globalState 键扇入**：R5 读写 `a.J`（persisted atom）、`a.I`（browser auth ops）、`a.N/a.M`（automations）、`a.U`（integrity）、`a.Y`（remote control enrollments）、`a.z`（app-config declarations）六个 bootstrap 键——这些键的 schema 分散在两侧（bootstrap 21,944-22,516 定义 schema，main 消费），重写契约需先锁定 bootstrap 侧 `state/global-state` 的键表。
6. **名字冲突（重写命名陷阱）**：main 的 `lT/hT`（fetch 错误）与 bootstrap 的 `lT`（attachOriginatorHeaders）/`hT`（backend appcast）同名不同物；`kT` 在 bootstrap 是 store manifest 门控（20,424），在 main 是 AppServerHttpClient；`nT/rT/oT/sT/cT` 等在两个 chunk 各有一套。重写时必须按模块前缀消歧。
7. **`uEe` 跨区消费**：63,543 定义、124,325（MCP sandbox 区，R9 侧）消费——shared chunk 拦截器单例是 R5↔R9 的隐藏耦合点，重写时应提升为显式注入（AppServer 装配处传入）。
8. **`iEe` 与 bootstrap browser-auth-operations 是同一持久化键的两端**：bootstrap 21,863-21,992 记账（renderer 表单填充遥测）、main 63,391 提交（browser sign-in recovery）。拆分后两边都要 import 同一个 `state/browser-auth-operations` 模块，防止键名漂移。
9. **平台专属路径难本地验证**：`VE` 的远端 ssh 脚本（login shell 探测/csh/fish/nu 分派 66,094-66,133）、`QDe` 的 WSL、`kO` 的 windows-account.node、`tA` 的 input-monitoring addon——macOS 环境只能静态重写 + 类型检查；ssh 脚本的 shell 引用（`vE` 单引号转义）建议逐字符对拍。
10. **`hEe` 混合 transport 的账号防护**：read 前后各验一次 token principal（63,687-63,715），中途账号变更要报 `App server account changed`——重写时勿省略第二次校验（TOCTOU 防护）。

---

## 8. 给下游派发的建议

- 应用代码约 11,450 行，按 §3 聚类可拆 20+ 个模块，最大单体是 `ZTe`（~760 行，建议拆 2 个文件）与 `VE`（~650 行）、`AOe`（~470 行）、`lA`（~245 行）。
- 优先派发顺序建议：① `api/desktop-fetch-service`（认证核心，阻塞 renderer 代理与账号输入）→ ② `app-server/transport-*`（阻塞 AppServer 装配区 159,000s 的重写）→ ③ `remote-control/*` → ④ 其余服务类群可并行。
- 每个模块任务描述应附：行区间（§1）、压缩名→语义名（§3）、顶层状态（§4）。
- 60,000-61,578、69,716-69,869、73,181-79,294 三带**不派发**（引上游库）。
