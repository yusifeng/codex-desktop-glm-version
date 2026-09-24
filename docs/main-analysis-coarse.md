# main-C-Mhak1n.ts 粗结构扫描（coarse scan）

目标文件：`src/main/main-C-Mhak1n.ts`（176,978 行，约 5.7MB，rolldown 打包产物经 prettier 格式化，无 sourcemap）。
来源：macOS ChatGPT.app（Codex 桌面版 v26.917.71314）的 app.asar 主进程主体 chunk。
方法：grep/采样粗扫，不逐行精读。所有行号均经 `grep -n` 核实；标注为「采样推断」的结论置信度低，标注为「直接证据」的结论有 grep 输出或原文引用支撑。

**工具坑（影响复现，务必注意）**：本机 `grep` 实为 ugrep 7.8.4，BRE 的 `\|` 分隔多模式**不生效且不报错**（返回空结果）。复现本文扫描时，多模式必须用 `-E 'a|b'` 或分开单模式 `-F` 扫描。本文所有数据均用单模式 `-F` 或 `-E 'a|b'` 重新核实过。

---

## 0. 模块定位（直接证据）

- 本 chunk 是**叶子模块**：全文件只有 3 个导出（见 §5），被 `bootstrap-C4dRql4x.ts:25481-25483` 动态 require 并调用：
  ```js
  let { runMainAppStartup: e } = await Promise.resolve().then(() => require("./main-C-Mhak1n.js"));
  await e();
  ```
- `runMainAppStartup` = `Ust`（定义于 175,822 行），是 bootstrap 完成后的**主应用启动总入口**。
- `src/main/types/chunk-modules.d.ts` 与 `src/main/bootstrap/desktop-runtime.ts` 也引用本文件名（类型声明/运行时清单）。

---

## 1. 头部 require 区（1-66 行，直接证据）

| 绑定 | 模块 | 说明 |
|---|---|---|
| `e` | `./rolldown-runtime-CPUxUITh.js` | rolldown 运行时（`e.a` interop、`e.t` CJS 包装、`e.n` 惰性） |
| `t` | `./desktop-open-path-queue-DpR9n1cN.js` | open-path 队列 |
| `n` | `./src-DldfpmrL.js` | **shared chunk，最大外部依赖**（zod 实例 `n.Of/n.Cf/n.wf/n.Ef/n.jf`、EventEmitter 基类 `n.Uf`、stdio transport `n.dn`、`n.Wr` 阶段聚合等） |
| `r` | `./logger-DkO6GWbX.js` | logger（`r.i()` 取具名 logger、`r.r()` 具名、`r.n()` 根 logger、`r.a()` 具名） |
| `i` | `./src-C9YLnbgY.js` | main-shared（`i.Emitter` 等） |
| `a` | `./bootstrap-C4dRql4x.js` | **bootstrap chunk**（`a.x()` 取启动装配单例、`a.in` build flavor、`a.fn` 协议注册、`a.u`、`a.Xt` 等）——main 大量回调 bootstrap 的装配产物 |
| `o` | `./electron-resources-path-BDLw2lp0.js` | resources path |
| `s` | `./dist-wQAv1pJP.js` | dist chunk |

node 内置（`let` 绑定，均经 `e.a()` interop）：`node:url`、`electron`（绑定 `l`，**全文件 Electron API 都走 `l.`**）、`node:util`、`path`、`node:os`、`node:path`、`node:crypto`、`node:fs`、`node:fs/promises`、`node:buffer`、`node:stream`、`node:events`、`node:net`、`node:timers/promises`、`fs`、`node:process`、`assert`、`events`、`buffer`、`node:child_process`、`node:stream/promises`、`zlib`、`node:readline`、`node:perf_hooks`、`node:string_decoder`、`node:worker_threads`、`node:http`、`node:module`、`node:zlib`（第二次，绑定 `te`）、`node:tls`、`node:assert`（绑定 `H`）、`node:path/posix`、`node:inspector`。

---

## 2. 顶层定义密度分布（每 5000 行一桶，直接证据）

`grep -nE '^(async )?function [A-Za-z_$]|^class [A-Za-z_$]|^(var|let|const) [A-Za-z_$]'` 命中 4,518 处：

| 行区间 | 定义数 | 密度解读 |
|---|---|---|
| 0-4999 | 315 | 头部 require + 大量小函数/常量（杂项工具带） |
| 5000-9999 | 230 | computer-use / native pipe / artifact session |
| 10000-14999 | 250 | browser-use / plugins / codex-app-config / dock |
| 15000-19999 | **84** | avatar-overlay + BrowserWindow 装配（大函数区） |
| 20000-24999 | 194 | micromark vendored（tokenizer 对象字面量多） |
| 25000-29999 | 213 | micromark 尾 + thread DB + immer vendored |
| 30000-34999 | 193 | conversation state 核心 |
| 35000-39999 | 104 | conversation/turn + EventEmitter 类群 |
| 40000-44999 | 152 | approval review / turn 流程 |
| 45000-49999 | 111 | marked vendored + conversation services |
| 50000-54999 | 90 | conversation services |
| 55000-59999 | **34** | **超大方法类区**（conversation/thread 总管，千行方法） |
| 60000-64999 | 69 | 认证 / app-server（同样偏大方法） |
| 65000-69999 | 187 | checkout / automations / transports |
| 70000-74999 | 92 | fetch handler / download / 小 EventEmitter 类群 |
| 75000-79999 | 63 | computer-use capture |
| 80000-84999 | **272** | export-logs / demo-tools（碎函数密集） |
| 85000-89999 | 145 | external-agent-import / AppServer 装配 |
| 90000-94999 | 128 | global hotkey / saved sections / feedback archive |
| 95000-99999 | 165 | browser-sidebar 管理器类群 |
| 100000-104999 | 139 | checkout-webview / workspace-settings-webview |
| 105000-109999 | 196 | 下载管理 + **zod vendored 开始**（107,233） |
| 110000-114999 | 141 | browser-use transport + zod vendored 尾 |
| 115000-119999 | 112 | IAB 生命周期 / sidebar（大方法） |
| 120000-124999 | **46** | browser 窗口总管（大方法） |
| 125000-129999 | 75 | language-server runtime / library files |
| 130000-134999 | **0** | **vendored IIFE 缩进区**（vscode-jsonrpc + LSP protocol，顶层模式完全失配，见 §8 风险） |
| 135000-139999 | **226** | LSP manager / MCP sandbox / open-in（碎函数密集） |
| 140000-144999 | 90 | primary runtime / projects / realtime voice |
| 145000-149999 | 78 | usage limit + ssh-config vendored + lib0 vendored |
| 150000-154999 | 49 | Yjs vendored + notifications/permissions 服务 |
| 155000-159999 | 61 | terminal(node-pty) / thread archive / WindowContext |
| 160000-164999 | 78 | 菜单/托盘/快捷键/更新管理器 |
| 165000-169999 | 63 | haptics / shutdown / 命令系统 |
| 170000-174999 | 49 | window-manager 总管 + mime vendored |
| 175000-176978 | **24** | **启动流程 Ust + Tray 实例化 + exports** |

**名字风格结论（采样推断，置信度低）**：与 bootstrap 不同，本文件各区域混淆名风格（2-4 字母）无明显分界规律，不能靠名字段切区域；可靠分界来自 vendored 库特征串与 logger 名。

---

## 3. 类清单（131 个顶层 `var X = class`，全部经 grep 核实行号；用途为类体头部 ≤30 行采样推断）

### 3.1 头部/杂项带（100-45005）

| 行 | 名 | 基类 | 推断用途 | 置信度 |
|---|---|---|---|---|
| 100 | `fe` | — | subscribe/emit handler Set，事件分发器 | 高（直接证据：subscribe/emit 方法） |
| 139 | `he` | — | nextPruneAtMs，修剪/清理调度 | 中 |
| 196 | `Se` | — | adapter 包装 | 低 |
| 732 | `jt` | — | windowMs 字段，速率限制器 | 高 |
| 913 | `cee` | — | （空采样） | 低 |
| 1362 | `yn` | Error | `CancelledError`（revert/silent 字段） | 高 |
| 1443 | `xn` | — | 抽象基类（被 Dee/kee 继承） | 高 |
| 1532 | `Dee` | xn | — | 低 |
| 1853 | `kee` | xn | — | 低 |
| 2039 | `jee` | `Zt` | config + Set + Map + 计数器（限流/去重类） | 中 |
| 2131 | `Mee` | `Zt` | config + Map | 中 |
| 4694 | `pne` | — | browserSessionRegistry 依赖 | 中 |
| 8210 | `wie` | **n.Uf** | EventEmitter 子系统 | 高 |
| 11158 | `Vae` | — | options | 低 |
| 12377 | `Eoe` | — | `logger = r.i('managed-computer-use-service')` | 高 |
| 12749 | `Foe` | — | 多参构造 | 低 |
| 13139 | `Bl` | Error | native pipe 帧超限错误 | 高 |
| 13246 | `lse` | — | 构造参 4294967295，序号/ID 生成 | 中 |
| 13577 | `Tse` | — | — | 低 |
| 15298 | `cle` | — | cursorSource/pointerAnchor 坐标（computer-use 光标） | 中 |
| 18221 | `sue` | — | stateStore.getStored，状态条目管理 | 中 |
| 22466 | `Dde` | — | left/right 双栈（编辑缓冲？） | 中 |
| 26068 | `kme` | — | `this.map = []`，有序 map | 低 |
| 26796 | `hhe` | — | **db + hostId + hostKind('local'/'ssh')，thread DB 主类** | 高 |
| 27622 | `bhe` | — | logger 字段 | 低 |
| 28340 | `Ihe` | — | `this.produce = ...`，immer 包装 | 中 |
| 28725 | `kh` | — | params + `case 'archive'`，归档处理 | 中 |
| 31331 | `Bge` | — | client/policy/inFlightLoads/queuedPreviews，预览加载管理 | 中 |
| 31982 | `Kge` | — | client | 低 |
| 32447 | `Yge` | — | **app-server manager stream**（attached 守卫、onFollowingChanged） | 高 |
| 33604 | `g_e` | — | timelinePositions Map，timeline 索引 | 高 |
| 34507 | `T_e` | — | threadItemIndex/parseUrl/getTurn，conversation 读取门面 | 高 |
| 36502 | `Lv` | **n.Uf** | EventEmitter | 高 |
| 37137 | `G_e` | **n.Uf** | EventEmitter | 高 |
| 37241 | `q_e` | **n.Uf** | EventEmitter | 高 |
| 39470 | `Rve` | — | logger 字段 | 低 |
| 41278 | `sb` | Error | **UnarchivedConversationLoadError** | 高 |
| 45005 | `wS` | — | **marked Lexer（vendored）** | 高 |

### 3.2 conversation services / 认证 / app-server（49597-74999）

| 行 | 名 | 基类 | 推断用途 | 置信度 |
|---|---|---|---|---|
| 49597 | `cSe` | — | deps | 低 |
| 49998 | `pSe` | — | params | 低 |
| 50115 | `bC` | — | — | 低 |
| 50671 | `TSe` | — | logger + 3 参 | 低 |
| 51290 | `CC` | — | params | 低 |
| 54020 | `swe` | — | storage | 中 |
| 54073 | `rw` | **n.Uf** | EventEmitter | 高 |
| 56344 | `xwe` | — | broadcaster，事件广播 | 中 |
| 56547 | `Awe` | — | enabled/generation，开关代际 | 中 |
| 56881 | `Lwe` | — | **db，conversation DB** | 高 |
| 61706 | `STe` | **n.Uf** | EventEmitter | 高 |
| 61975 | `DTe` | — | db | 高 |
| 62141 | `lT` | Error | status/cause/errorCode，后端 API 错误 | 高 |
| 62209 | `BTe` | — | globalState | 中 |
| 62291 | `hT` | Error | **Authenticated desktop fetch failed** | 高 |
| 63405 | `aEe` | **n.Uf** | browserAuthOperations（浏览器表单认证） | 高 |
| 63477 | `oEe` | **n.Uf** | 同上配套 | 高 |
| 63547 | `kT` | — | **getDesktopAuthToken + options，checkout/付费认证** | 高 |
| 63778 | `vEe` | — | `logger = r.r('app-server-feature-enablement')` | 高 |
| 63937 | `bEe` | — | errorReporter | 中 |
| 64058 | `xEe` | — | connection + assertCurrent/assertLifetimeCurrent，连接生命周期守卫 | 中 |
| 64914 | `IEe` | **n.Uf** | fetchHandler | 高 |
| 66308 | `VE` | — | **`logger = r.r('AppServerTransportSshWebsocket')`** | 高 |
| 67219 | `QDe` | — | options + `stdioTransport = new n.dn(e)`，app-server stdio transport | 高 |
| 67606 | `yOe` | **n.Uf** | hotkeysService + requestFinalUpdateImpl | 高 |
| 68306 | `IOe` | **n.Uf** | origin/windowManager/updateCapability | 中 |
| 68353 | `ROe` | **n.Uf** | manager/origin | 中 |
| 68683 | `UOe` | **n.Uf** | unsubscribeOnce（订阅包装器） | 高 |
| 69575 | `Cke` | **n.Uf** | autocomplete/owner | 中 |
| 70017 | `BD` | **n.Uf** | unsubscribeOnce | 高 |
| 70128 | `Uke` | **n.Uf** | disposeSubscription | 高 |
| 70144 | `Wke` | — | origin | 低 |
| 70221 | `Kke` | **n.Uf** | EventEmitter | 高 |
| 70574 | `Yke` | **n.Uf** | disposeSubscription | 高 |
| 70812 | `nAe` | **n.Uf** | manager/origin/getCurrentPageUrl | 中 |
| 70921 | `iAe` | **n.Uf** | **downloadStore/origin/registerView，下载管理** | 高 |
| 70994 | `sAe` | — | globalState | 中 |
| 71844 | `IO` | **n.Uf** | EventEmitter（大区开头） | 高 |

> 68683-70574 一串 unsubscribeOnce/disposeSubscription 小类是「订阅句柄适配层」——把各种 dispose 形态统一成 `n.Uf` EventEmitter（采样推断，置信度中）。

### 3.3 capture / hotkey / sidebar / browser（80247-128704）

| 行 | 名 | 基类 | 推断用途 | 置信度 |
|---|---|---|---|---|
| 80247 | `nje` | **n.Uf** | requestComputerUseWorker | 高 |
| 80843 | `Eje` | **n.Uf** | computer-use 相关 | 高 |
| 80999 | `zje` | **n.Uf** | computer-use 相关 | 高 |
| 81135 | `Hje` | — | `logger = r.r('demo-tools')` | 高 |
| 81190 | `GN` | — | createWindow 依赖 | 中 |
| 82409 | `CMe` | **n.Uf** | 多参 EventEmitter | 高 |
| 90529 | `Wz` | — | list 字段 | 低 |
| 94235 | `tBe` | **n.Uf** | `#e = r.i('saved-custom-sections')` | 高 |
| 94535 | `yH` | **n.Uf** | sidebar 相关 | 高 |
| 94962 | `rBe` | **n.Uf** | sidebar 相关 | 高 |
| 95321 | `jH` | **n.Uf** | sidebar 相关 | 高 |
| 95860 | `xBe` | **n.Uf** | sidebar 相关 | 高 |
| 95950 | `CBe` | `sBe` | sidebar 继承体系（sBe 为内部基类，非顶层声明） | 中 |
| 99682 | `YHe` | — | store | 低 |
| 106034 | `FGe` | — | pending(webContents.id) + 60s 超时，等待渲染进程响应 | 中 |
| 106150 | `LGe` | — | **liveDownloads/'download.active'，下载快照管理** | 高 |
| 106783 | `qGe` | — | windows | 中 |
| 106858 | `_q` | — | type/schema/payload，zod 错误载体（vendored zod 区开头） | 中 |
| 110745 | `$J` | — | **transport/browserId/documentationApi/info，browser-use 传输** | 高 |
| 111111 | `YJe` | `eY` | browserId/documentation/info/tabId/transport，browser-use 页面代理 | 高 |
| 118943 | `$Ze` | — | options | 低 |
| 121330 | `kZ` | — | — | 低 |
| 123334 | `r$e` | — | **setSystemFocusState('suspended'/'screen-locked')，系统焦点/锁屏状态**（powerMonitor 消费者） | 高 |
| 125123 | `a$e` | — | defaultHostId，host 注册表 | 高 |
| 126099 | `NQ` | — | — | 低 |
| 126287 | `Y$e` | **n.Uf** | lifecycleManager/origin | 高 |
| 128704 | `QQ` | — | context/hostPath（language-server host？） | 中 |

### 3.4 zod vendored（107,237-110,745，不深析）

`Pq`(107,237 PropertyPath)、`Lq`(107,290)、`Tq`(107,186)、`Vq`(107,573 ZodString)~`$q`(108,383)、`tJ`(108,479)~`yJ`(109,360)、`SKe/CKe`(108,865/108,993)、`xq`(107,067) 等 **44 个类**——zod v4 完整 vendored（`ZodString` typeName 特征串 107,973、109,419 直接证据）。`107,233` 行起出现 zod 内部工具（errToObj/toString IIFE）。

### 3.5 终端 / 归档 / 窗口 / 菜单 / 启动（154524-176978）

| 行 | 名 | 基类 | 推断用途 | 置信度 |
|---|---|---|---|---|
| 154524 | `rtt` | **n.Uf** | EventEmitter（终端区开头） | 高 |
| 155103 | `Mtt` | **n.Uf** | terminalManager 依赖 | 高 |
| 155386 | `Wtt` | — | **sessions/'terminal.session'/pendingCreates + globalState + shell preference，集成终端会话管理** | 高 |
| 156075 | `Xtt` | **n.Uf** | **`logger = r.r('ThreadArchiveService')`** | 高 |
| 157879 | `Ont` | — | — | 低 |
| 158320 | `jnt` | **n.Uf** | owner | 中 |
| 158561 | `Fnt` | **n.Uf** | setGitWorkerTracingSampleRate，tracing 采样控制 | 高 |
| 158896 | `Jnt` | — | **`logger = r.r('WindowContext')`** | 高 |
| 159059 | `Xnt` | **n.Uf** | windowManager/origin | 高 |
| 161484 | `urt` | — | 私有字段 #e | 低 |
| 161535 | `prt` | — | **tray/onOpenMainWindow/onTrayMenuOpenNewThread/onTrayMenuSendFeedback，托盘菜单管理** | 高 |
| 163930 | `cit` | — | **buildMenu，应用菜单构建** | 高 |
| 164396 | `yit` | — | **allowQuitWithoutPrompt/skipDrainBeforeQuit，退出守卫** | 高 |
| 166612 | `gat` | — | **`logger = r.r('composer-snap-haptics')`** | 高 |
| 168725 | `Xat` | Error | Max tries reached（重试耗尽，路径重试） | 中 |
| 168764 | `eot` | Error | placeholder 缺失错误 | 中 |
| 172803 | `Qot` | — | **commandId:'closeTab'/keymapState，app shell 命令定义** | 高 |
| 174414 | `hst` | **n.Uf** | EventEmitter（window-manager 区） | 高 |

**`extends n.Uf` 统计**：131 个类中 44 个直接继承 shared chunk 的 EventEmitter 基类 `n.Uf`，遍布全文件——与 bootstrap 中 `n.Uf` 是同一基类（直接证据）。

---

## 4. 地标字符串分布（子系统 → 行号热点，均 grep -n 核实）

| 子系统 | 特征串 | 命中 | 热点行区间（每 5000 行桶计数） |
|---|---|---|---|
| IPC 频道 | `codex_desktop:` | 2 | 仅 100,838 / 100,846（`get-browser-annotation-api-policy`、`get-browser-webmcp-policy`）。**IPC 频道名表不在此 chunk**（bootstrap 19,739-19,793 的 `Tw~Yw` 才是频道表；本 chunk 主要经 bootstrap/shared 的桥接） |
| ipcMain | `ipcMain` | 20 | 10,000s:1、135,000s:3、**160,000s:14**、175,000s:2——ipcMain 句柄注册集中在菜单/托盘区与启动区 |
| 窗口管理 | `BrowserWindow` | 96 | 15,000s:13、100,000s:15、115,000s:7、120,000s:14、160,000s:16、170,000s:16 |
| window-all-closed | `window-all-closed` | **0** | 事件接线在 bootstrap（24,840-24,851），本 chunk 无此串 |
| 托盘 | `Tray` | 70 | **160,000s:51**（管理类 prt 161,535 + cachedWindowsTrayMenu 161,625-161,643）、170,000s:3、175,000s:9（`new l.Tray` 实例化在 **175,549**，启动区内） |
| 菜单 | `Menu` | 273 | **160,000s:133**（applicationMenu: new lOe 160,004、Menu.buildFromTemplate 161,474/161,625/161,639/161,643）、175,000s:50、95,000s:19、10,000s:18（dock menu 13,104）、136,863（LSP 弹窗） |
| deep link | `codex://` | 4 | 10,000s:1、145,000s:1、160,000s:2；`deepLink` 串 5 处集中在 **175,000s:4**（启动区 flushPendingDeepLinks，见 §6） |
| 单实例 | `second-instance` | 1 | （具体行未定位；requestSingleInstanceLock / setAsDefaultProtocolClient 均为 0——在 bootstrap） |
| 账号/认证 | `auth` | 247 | 60,000s:40、65,000s:32、135,000s:25(vendored LSP 内)、145,000s:25、95,000s:14、100,000s:16 |
| | `Account` | 62 | **65,000s:33**、60,000s:8、125,000s:7、95,000s:6 |
| | `Account-Id` | 3 | 65,000s / 95,000s / 160,000s 各 1 |
| | `plan` | 81 | 40,000s:30（turn 审批计划？）、170,000s:17、35,000s:7、60,000s:7 |
| | `oauth` | 10 | （分散） |
| 插件 | `plugin` | 402 | **5,000s:173**、10,000s:56、80,000s:63、85,000s:22、160,000s:20 |
| | `marketplace` | 380 | **5,000s:259**、10,000s:67、0s:15——**插件市场子系统集中在 5,000-10,000** |
| worker | `worker_threads` | 1 | 仅头部 require（L12 附近）；`new Worker` 0——**本 chunk 不建 Worker**（git worker 等经其他机制） |
| app-server | `app-server` | 55 | 65,000s:11、60,000s:5、15,000s:6、140,000s:8 |
| | `AppServer` | 197 | 95,000s:51、160,000s:27、140,000s:21、45,000s:19、40,000s:16、120,000s:18、85,000s:20 |
| 更新 | `sparkle`/`Sparkle` | 32 | **160,000s:15**（更新 UI/relaunch）、65,000s:6；`autoUpdater` 0（更新器本体在 bootstrap KT class） |
| 通知 | `Notification` | 200 | 130,000s:161（vendored LSP 的 JSON-RPC Notification 概念，非系统通知）、25,000s:48、155,000s:23、150,000s:24、50,000s:30、40,000s:16 |
| 快捷键 | `globalShortcut` | 5 | 90,000s:5（`global-hotkey` logger 90,000s 内）；`Shortcut` 79：**160,000s:28**、170,000s:10、95,000s:8 |
| 对话 | `conversation` | 1,169 | **核心大区 25,000-60,000**（35,000s:151、50,000s:119、30,000s:97、40,000s:108、45,000s:67）+ **110,000-125,000**（115,000s:233、110,000s:222、120,000s:126）+ 155,000s:47 |
| 协议注册 | `protocol.handle` | 1 | 135,000s:1（LSP 相关）；registerSchemesAsPrivileged 0（在 bootstrap `lt()`） |
| SQLite | `sqlite`/`SQLite` | 10 | 15,000s:7、160,000s:3、155,000s:1、170,000s:1、175,000s:2——**sqlite 内核在 shared chunk（n.si/oi/ai/Hn/jn），本 chunk 只有引用** |
| 电源 | `powerMonitor` | 25 | 120,000s:15（r$e 焦点状态类消费）、15,000s:4、140,000s:2、165,000s:2 |
| 终端 | `xterm-256color` | 2 | 126,250（cloud terminal env）、155,376；`node-pty` 1 处：**155,319** `Rtt('node-pty')` 动态 require |
| 系统偏好 | `systemPreferences` | 8 | 165,000s:4、170,000s:4 |

**logger 名录（`r.i(...)`/`r.r(...)`，共 60+ 个具名 logger，子系统指纹，直接证据）**：按 5000 桶聚类——
- 0-10k：`ambient-suggestions-background-refresh`、`devicecheck-attestation`、`computer-use-config/-native-pipe(-server)`、`automations`
- 10-15k：`automation-project-migration`、`browser-use-native-pipe-peer-authorizer`、`browser-use-pip`、`bundled-plugins`、`chrome-native-host-cache-watcher`、`codex-app-config`、`dynamic-app-tools-native-pipe`、`managed-computer-use-service`、`node-repl-host-services-native-pipe`、`react-devtools-extension`、`remote-project-migration`
- 15-20k：`avatar-overlay`、`avatar-overlay-realtime`
- 25k：`desktop-notifications`
- 60-70k：`electron-fetch-handler/-wrapper`、`host-app-server-storage`、`habitat-automations`、`remote-control-websocket`
- 75-100k：`computer-use-capture-handler`、`export-logs`、`external-agent-import`、`download-internal-plugins`、`feedback-desktop-log-archive`、`global-hotkey`、`saved-custom-sections`
- 95-125k：`browser-sidebar-manager`(12 处)、`-comment-mode-site-status`、`-page-store`、`-screenshot`、`-comment-controller`、`browser-session-registry`、`browser-use-iab-api`、`browser-use-native-pipe-server`、`browser-window-transfer`、`in-app-browser-incomplete-navigation-service`、`first-party-plugin-authenticated-chatgpt-webview`、`link-opening`、`checkout-webview`、`workspace-settings-webview`、`content-tracing`、`electron-message-handler`、`electron-sampler`、`project-folder-picker`、`remote-localhost-navigation`、`sampler-manager`、`worktree-service`
- 125-140k：`language-server-runtime-installer`、`library-files`、`language-server-manager`、`mcp-app-sandbox`、`open-in-targets`
- 140-150k：`install-primary-runtime`、`open-in-service`、`primary-runtime-host`、`projects-manager`、`realtime-voice-host-coordinator`
- 150-160k：`artifact-session-host-service`、`mac-notification-permission`、`notifications-service`、`ssh-connection-registration`、`system-permissions-service`、`cron-turn-read-state`
- 160-176k：`computer-use-capture-native-bridge`、`windows-capture-native-bridge`、`mac-system-shutdown`、`sparkle`、`window-manager`、`startup`（175,000s，`r.a('startup')`）

---

## 5. 导出表（直接证据）

文件尾 176,978 行是**唯一的应用级导出语句**：

```js
((exports.n = TV), (exports.runMainAppStartup = Ust), (exports.t = URe));
```

| 导出名 | 符号 | 定义行 | 用途 |
|---|---|---|---|
| `runMainAppStartup` | `Ust` | 175,822 | **主应用启动总入口**（bootstrap 25,483 调用） |
| `t` | `URe` | 92,249 | 导出日志归档：`collectDesktopDiagnostics` 风格——`wV(...)` 组装 desktop logs + native host/windows diagnostics，返回 `{archiveId, filePaths}` |
| `n` | `TV` | 92,380 | 删除 feedback 桌面日志归档目录（`CV` Map 记账，`bV()` logger `feedback-desktop-log-archive`） |

其余 `exports.` 命中（127,017 / 127,243-246 / 171,978 / 171,983 / 171,997）全部是 vendored 库内部的 `t.exports`（CJS 模块.exports），不属于 chunk 导出表。**导出表仅 3 项**——派发重写时接口面极小。

---

## 6. 顶层副作用序列（列 0 非声明语句，grep 核实行号；语义多为采样推断）

应用级（值得深析）：

| 行 | 语句 | 说明 | 置信度 |
|---|---|---|---|
| 1-66 | require + `e.a()` interop 绑定 | 模块头 | 高 |
| 12,919 | `xl.flatMap(({advertiseOnLinux...}) => ...)` | mime 类型 Linux 广告列表推导（vendored mime 内部） | 中 |
| 28,300 | `Pm(ih, (e,t) => {...})` | 未识别的注册调用（**深析时确认**） | 低 |
| 28,649 | `n.Ef(n.Of(), n.yf()).parse(n.Rf(gh)), ...` | 加载期 zod schema 验证（丢弃结果，防御性校验） | 高 |
| 54,072 | `Lhe()` | 顶层函数调用（**深析时确认**） | 低 |
| 82,193-82,195 | `_Me.transform(dP)` + `n.yf().parse(n.Rf(lP,...))` | schema 变换 + 加载期验证 | 中 |
| 88,960 | `UIe(...)`（多行调用） | 未识别（**深析时确认**） | 低 |
| 90,917 / 91,980 | `lR(...)`（91,980 传 syncFile/asyncFile 4 变体） | 文件操作绑定注册（采样推断） | 低 |
| 111,162 | `ZZe([yJe, oJe, kJe, dY, fY])` | browser-use 组件装配 | 中 |
| 111,362/111,366 | `uYe([aYe, wY, FY])`、`$({side_effects: DJ(Z())}).passthrough()` | schema 装配 + 加载期验证 | 中 |
| 139,940 | `r.i('open-in-targets')` | **应用级顶层 logger 创建**（模块加载即执行） | 高 |
| 164,854 | `w7('SkCu')` | 未识别（**深析时确认**，疑似命令/键注册） | 低 |
| 168,135/168,138 | `Object.keys(u9.modifier)`、`[...Nat, ...Pat]` | 键位修饰符表展开 | 低 |
| 172,094 | `if (typeof u.default == 'string') throw TypeError('Not running in an Electron environment!')` | **Electron 环境守卫**（加载期断言） | 高 |
| 175,549 | `r = new l.Tray(...)` | **Tray 实例化**——但位于 `Ust` 调用链内还是模块加载期执行，需深析确认（175,549 在函数 `Ust` 定义 175,822 **之前**，大概率在某函数体内，非模块加载期） | 中 |
| 176,978 | exports 绑定 | 导出表 | 高 |

vendored 库内部（机械代码，无需深析）：21,537（`({}).hasOwnProperty`）、24,962/25,023（`Tpe.peek`/`Ape.peek` 补丁）、25,550-25,551（micromark autolink keycode 初始化 for 循环）、28,654、46,517/46,543（marked options 绑定）、47,035（`FS.exports` 扩展）、106,873/106,918/107,233（zod IIFE 与 `xq.create` 等 30+ 处 `Xq.create = ...` 静态方法绑定，107,067-110,745）、135,199（LSP IIFE）、146,190（ssh-config enum IIFE）、148,709-149,201（lib0 polyfill + `O3('production')` + `A7e()`）、149,763（lib0 实例化）、152,540-152,560（Yjs 重复导入检查）。

**runMainAppStartup（`Ust`，175,822 起）调用链头部（直接证据）**：
1. `DO()`、`a.u(Z9)`（bootstrap 侧状态标记）
2. 解构 `a.x()` 装配单例：applicationNetwork、buildFlavor、desktopSentry、errorReporter、datadogLogger、startupConfig、startupPolicies、sparkleManager、startupPhases、productionAppcastStateStore、setSparkleBridgeHandlers、setSecondInstanceArgsHandler
3. `await l.app.whenReady()` → react devtools（dev）→ `a.fn(a.ln(__dirname), i)` 注册 app 协议 → shell 环境注入 `EDe()` → …（175,822-176,900+ 为启动时序核心，**深析重点**）
4. 尾部（176,940 附近）：`await Le.deepLinks.flushPendingDeepLinks()`、`M('startup complete', e)`
5. `Wst({markAppQuitting, runCleanupBeforeImmediateExit})`（176,900 附近）：更新退出的清理流程——`hrt()`、销毁全部 BrowserWindow、`l.app.exit(0)`

---

## 7. vendored 库清单（机械代码，重写时直接引上游版本，不深析）

| 库 | 行区间（边界经特征串核实，端点±100 行为采样推断） | 证据 |
|---|---|---|
| micromark（markdown 解析）+ character references | ~21,000-26,000 | 21,312 `Named character references must be terminated by a semicolon`、25,543 `wwwAutolink` tokenizer、25,550 keycode 表 |
| immer | 27,983-28,400 | 27,984 `Symbol.for('immer-nothing')`、27,994 immerable 报错串、28,136 `drafts_/immer_/canAutoFreeze_` |
| marked | ~44,570-47,035 | 44,570 `Vx = Bx()`（defaults）、45,005 `wS` Lexer、46,502 markedjs 报错串、47,035 `FS.exports` |
| zod v4 | ~106,858-110,745 | 107,973/109,419 `ZodString` typeName、107,233 errToObj、44 个 `*q` 类 |
| vscode-jsonrpc | 129,984-131,900 | 129,984 `AbstractMessageWriter`、131,891 `vscode-jsonrpc-${e}-sock` 管道名 |
| vscode-languageserver-protocol | 131,900-135,000 | 131,988 `InlayHint`、133,011 `CodeActionContext`、134,225 `DocumentSelector` |
| ssh-config 解析 | ~146,100-146,900 | 146,190 DIRECTIVE/COMMENT/EMPTY enum、146,192 `IdentityFile/LocalForward/RemoteForward` |
| lib0 | 148,700-149,900 | 148,709 `Number.isNaN` polyfill 序列、149,066 `_.webcrypto.subtle` |
| Yjs | 149,900-153,121 | 149,743 `[yjs] Tried to remove event handler...`、150,328 `Add Yjs type to a document`、152,542 `Yjs was already imported`、153,121 `valid Yjs v2 update`（应用层串，说明 Yjs 用于 artifact 协同文档） |
| mime-db + mime-types（按扩展名反查） | 171,900-172,400 | 171,978 `t.exports.desc`、171,983 `asc`、171,997 `t.exports.mime`（与 bootstrap 434-3317 的 mime-db 是**另一份**按扩展名索引的变体） |

---

## 8. 粗区域划分（10 个应用区域 + vendored 带，后续每区域一个深析 agent 的派发依据）

应用代码区域（深析对象）：

| # | 行区间 | 主题 | 证据 |
|---|---|---|---|
| **R1** | 1-1,000 | 模块头 + delegation/plan 杂项工具 | 66 行 require 区；69-90 `<codex_delegation>` 解析；82-93 plan 列表 plus/pro/business/team；100/139/196/732 小类 |
| **R2** | 1,000-20,000 | **computer-use / native pipe / artifact session / browser-use / 插件市场 / avatar overlay** | `marketplace`:5,000s:259、`plugin`:173；13,139 native pipe 帧协议（Bl 类）；10,076 `sky.node` addon、5,407 录音；12,377 managed-computer-use；13,104 dock menu；15,000s avatar-overlay、BrowserWindow:13、powerMonitor:4 |
| **R3** | 26,500-45,000 | **thread/conversation 存储核心**（跨过 micromark vendored 21,000-26,000） | 26,796 `hhe` db+hostId(local/ssh)；28,340 immer 包装；32,447 app-server stream；33,604 timeline 索引；34,507 conversation 门面；36,502/37,137/37,241 `n.Uf` 类群；41,278 UnarchivedConversationLoadError；conversation 串 30,000s:97/35,000s:151 |
| **R4** | 45,000-60,000 | **conversation 服务层 + 审批流**（跨过 marked vendored 44,570-47,035） | 40,043 `Automatic approval review rejected too many approval requests`；49,597-54,073 服务类群；54,072 顶层调用；55,000-60,000 大方法总管类（55000 行采样：threadStore/subagentTopology/evictConversation）；conversation 50,000s:119 |
| **R5** | 60,000-75,000 | **认证 / app-server 连接 / checkout / automations** | 62,141 `lT` API 错误、62,291 `hT` Authenticated desktop fetch failed；63,405/63,477 browserAuthOperations；63,547 `kT` getDesktopAuthToken；63,778 app-server-feature-enablement；66,308 AppServerTransportSshWebsocket；67,219 stdio transport；`Account` 65,000s:33、`auth` 60,000s:40；habitat-automations 65,000s |
| **R6** | 75,000-95,000 | **computer-use capture / export-logs / global hotkey / saved sections / feedback 归档**（含导出函数 URe 92,249 / TV 92,380） | 75,000s computer-use-capture-handler；80,000s export-logs（defs 272 碎函数密集）；81,135 demo-tools；85,000s external-agent-import；90,000s globalShortcut:5、global-hotkey、download-internal-plugins、saved-custom-sections(94,235) |
| **R7** | 95,000-107,000 | **browser sidebar / IAB（内置浏览器）/ checkout-webview / workspace-settings-webview** | browser-sidebar-manager 12 处；95,950 `CBe extends sBe` 继承体系；100,838/100,846 仅有的 2 个 `codex_desktop:` IPC；100,000s checkout-webview、workspace-settings-webview、BrowserWindow:15；106,034 渲染响应等待、106,150 下载管理 |
| **R8** | 110,000-125,000 | **browser-use transport / 浏览器窗口总管 / content tracing**（跨过 zod vendored 106,858-110,745） | 110,745 `$J` transport、111,111 `YJe` 页面代理；115,000s IAB lifecycle（`IAB_LIFECYCLE` 串 115,000 行采样）；120,000 行采样 goForward/getActiveVisiblePageForWindow；120,000s content-tracing/electron-message-handler/worktree-service；123,334 系统焦点状态；conversation 115,000s:233 |
| **R9** | 125,000-140,000 | **language server / library files / MCP sandbox / open-in**（跨过 vscode-jsonrpc+LSP vendored 129,984-135,000） | 125,000s language-server-runtime-installer、library-files；128,704 QQ hostPath；135,000s language-server-manager、mcp-app-sandbox、open-in-targets（139,940 顶层 logger）、ipcMain:3 |
| **R10** | 140,000-155,000 | **primary runtime / projects / realtime voice / usage limit / Yjs 应用层 / notifications / permissions / terminal** | 140,000s install-primary-runtime/primary-runtime-host/projects-manager/realtime-voice-host-coordinator；145,000 行采样 usage-limit 控制流（`simulate-usage-limit-approaching-for-debug`）；150,000s artifact-session-host-service/notifications-service/system-permissions-service/ssh-connection-registration；155,319 `node-pty` 动态 require、155,386 终端会话类、156,075 ThreadArchiveService |
| **R11** | 155,000-170,000 | **WindowContext / 菜单 / 托盘 / 快捷键 / sparkle / haptics / 退出守卫** | 158,896 WindowContext、159,059 windowManager/origin；160,004 applicationMenu、161,474/161,625-161,643 Menu.buildFromTemplate、161,535 托盘管理类（tray 字段）；160,000s Tray:51、Menu:133、Shortcut:28、sparkle:15、ipcMain:14；164,396 退出守卫；166,612 composer-snap-haptics；168,725/168,764 错误类 |
| **R12** | 170,000-176,978 | **window-manager 总管 + app shell 命令 + 启动流程 + 导出** | 170,000s window-manager logger；172,803 closeTab/keymap 命令；172,094 Electron 环境守卫；175,549 Tray 实例化；**175,822 `Ust` = runMainAppStartup 启动时序**（§6）；176,900 `Wst` 更新退出清理；176,978 exports |

> R1 很小，可并入 R2 派发；R11+R12 主题相邻（窗口/菜单/启动），也可合并派发。实际派发粒度建议 10-12 个 agent，vendored 带（§7）单独引上游库、不派深析。

---

## 9. 风险点与未决问题

1. **130,000-135,000 桶定义数为 0 是假象**：vendored vscode-jsonrpc/LSP 是缩进 4 空格的 IIFE 风格，顶层 `var/function` grep 模式完全失配。任何按「顶层定义密度」切区域的启发式都会在这里失明（直接证据：130,025 `e.AbstractMessageWriter = c` 缩进 4 格）。
2. **ugrep 陷阱**（见文首）：`\|` 静默失效。此前基于 `\|` 的多模式扫描结果为空，**不代表该地标不存在**（例如 `window-all-closed`、`new Worker`、`setAsDefaultProtocolClient` 确认为 0 是用 `-F` 单模式复核过的）。
3. **IPC 频道表不在本 chunk**：`codex_desktop:` 仅 2 处。主 IPC 面在 bootstrap（频道名表 19,739-19,793）与 preload/shared chunk。重写本 chunk 时需先完成 bootstrap 侧频道表的映射（`docs/bootstrap-analysis.md` 已覆盖）。
4. **`a.x()` 强依赖**：`Ust` 启动流程从 bootstrap 装配单例取 13+ 个句柄（applicationNetwork、sparkleManager、startupPhases 等）。main chunk 的重写契约必须先锁定 bootstrap 导出表（bootstrap-analysis 已有）。
5. **未识别的顶层副作用**：28,300 `Pm(ih,...)`、54,072 `Lhe()`、88,960 `UIe(...)`、90,917/91,980 `lR(...)`、164,854 `w7('SkCu')`——派发 R3/R4/R6/R11 深析时必须优先确认这些调用是否在模块加载期产生可观察副作用。
6. **175,549 `new l.Tray(...)` 的执行时机**：行号在 `Ust` 定义之前，按 JS 提升/顺序推断应在某函数体内（非模块加载期），但需 R12 深析确认调用链。
7. **采样推断清单**（置信度低，深析时推翻风险）：§3 表中标注「低」的 20 个类用途；R4 区域 55,000-60,000 大方法总管类的内部结构；`sBe`（95,950 被继承但非顶层声明，定义形态待查）。
8. **行数口径**：`wc -l` = 176,978；文中「177k」为约数。桶统计按 `int(line/5000)*5000`。
