# main-C-Mhak1n.ts R10 深度分析（140,000-156,100 行）

目标：`src/main/main-C-Mhak1n.ts` 的 R10 区域。按粗扫 §8 划分名义区间为 140,000-155,000；实际深析覆盖 **140,000-156,100**——因为终端子系统（`node-pty` 动态 require 155,315、会话管理类 `Wtt` 155,386）与 `ThreadArchiveService`（`Xtt` 156,075）是同一语义连续带，155,000 的边界切在终端类中间，**派发边界应移至 156,100**（`Xtt` 类体归 R11 处理或随本区，见 §7 风险 1）。
来源：macOS ChatGPT.app（Codex 桌面版 v26.917.71314）主进程 chunk。
方法：与 `docs/main-analysis-coarse.md` / `main-analysis-r1-r2.md` 同一方法论——200-400 行窗口采样 + 关键区域（类定义头、vendored 边界、副作用语句、装配点）精读；所有行号经 `grep -n` 核实。结论标注置信度：**直接证据** = grep/原文引用支撑；**采样推断** = 窗口采样得出，需下游复核。

**工具坑（沿用）**：ugrep 7.8.4 BRE `\|` 静默失效，多模式一律 `-E 'a|b'` 或分开 `-F`。

## 0. 总览与对粗扫的三点修正

1. **修正一：145,000-146,160 不是「usage limit 控制流」区**。粗扫依据的 `simulate-usage-limit-approaching-for-debug` 字符串（145,011）其实是 **realtime voice 控制消息的一个 debug 分支**（`L8e.control()` 的 switch case，直接证据），不是独立子系统。145,000-146,160 实际是 realtime voice 簇的尾部（usage-limit 模拟只是 voice 会话控制协议的一条消息）。本区间不存在独立的 usage-limit 子系统。
2. **修正二：146,160-146,592 是 vendored `ssh-config`**（粗扫描认精确边界 ~146,100-146,900）。精确边界：**146,160**（`G2` DIRECTIVE/COMMENT/EMPTY enum IIFE，`var H2 = /\s/` 146,182 等）起，**146,592**（`Z2 = r.i('remote-connections/discovery')` 之前，`X2` stringify 函数结束）止。146,160 之前（146,100-146,159）是 `Y8e` RealtimeVoiceThreadTitleCoordinator 的尾部。
3. **修正三：Yjs vendored 的应用层边界**。Yjs 库本体 **149,743**（`[yjs] Tried to remove event handler...`）- **152,559**（`w8[T8] = !0` 重复导入标记结束），**152,560 `bet = 8388608` 起即应用层**（artifact-document 存储，zod schema `Eet` 152,580 起）——粗扫的「153,121 valid Yjs v2 update」只是应用层调用 Yjs 校验函数 `S9e` 的字符串。Yjs 应用层 = 152,560-153,460（artifact document store）。

本区间（140,000-156,100）**没有模块加载期的可观察副作用**（详 §5）：所有 Electron API / fs / spawn / node-pty / objc-js 调用都在方法体内、发生在装配或 RPC 调用期；仅有的列 0 语句是 vendored 内部 IIFE（146,190 enum、148,709-149,201 lib0 polyfill、152,540-152,559 Yjs 标记）。

---

## 1. 区域地图（子区域 ≤1500 行）

| 行区间 | 类型 | 语义名 | 概述 | 证据 |
|---|---|---|---|---|
| 140,000-140,470 | 应用 | open-in targets/偏好 | 目标命令探测 `S0`、偏好读写 `w0/T0/E0/D0/O0`、可用目标表 `k0`、Office 应用映射 `m6e`(.pptx/.xlsx→MS Office)、目标元数据组装 `P0/g6e/_6e/F0/v6e`；`N0`→`OpenInService`（logger `open-in-service` 140,151，detectTarget/getTargets） | 高 |
| 140,470-140,638 | 应用 | Owl runtime 特性 + incentives API | `y6e` Electron runtime 特性开关桥（setRuntimeFeatures）、`z0` 复位、`b6e`→`SpanCpuSamplingBridge`（性能采样 RPC 转发）、`x6e/S6e/C6e` incentives（campaign claims/enroll）zod schema、`w6e`→`IncentivesService`（read/enroll/listClaims/checkIdentity，JWT `V0` 校验） | 高 |
| 140,638-140,716 | 应用 | 插件列表 + workspace 依赖工具 | `T6e`→`PluginListService`（app-server `plugin/installed`）、`H0` logger `workspace-dependencies-tool`、`D6e` `load_workspace_dependencies` 工具实现（local-only，返回 runtime 依赖说明） | 高 |
| 140,716-141,605 | 应用 | **primary runtime 安装器** | `W0` logger `install-primary-runtime`；`G0=36e5/K0=3e4` 轮询间隔；`q0`（进行中安装 Map）/`J0`（串行链）；`Y0` 取消、`X0/Z0` statsig 特性检测、`O6e`→`PrimaryRuntimeUpdatePoller`（startup/scheduled/manual 触发、shouldPoll/runNow）；`Q0` 安装入口（bundle+postInstall 两段错误归并）、`$0` 结果日志、`e2` skills reload、`t2/k6e` marketplace 同步到 `~/.cache/codex-runtimes`、`n2/A6e` skills 同步、`a2/i2` 错误上报、`P6e` 安装去重+postInstall promise、`F6e/c2` 依赖状态诊断、`l2` runtime selection 日志、`I6e` 修复重装、`u2` local-only 守卫 | 高 |
| 141,606-141,879 | 应用 | **primary-runtime-host** | `L6e`→`PrimaryRuntimeHost`（logger `primary-runtime-host` 141,612；install/cancel/diagnoseDependencies/executeLoadDependenciesTool/resetDependencies/getUpdateStatus/runUpdateNow；`startUpdatePolling` 订阅 sharedObjectRepository + setInterval K0；连接恢复 `#t` 含 N6e restore 流程） | 高 |
| 141,880-141,944 | 应用 | projectless 目录选择器 | `V6e`→`ProjectlessDirectoryChooser`（dialog.showOpenDialog + R_OK/W_OK/X_OK 校验、拒绝 symlink） | 高 |
| 141,945-142,075 | 应用 | 线程项目分配写入器 | `W6e`→`ThreadProjectAssignmentWriter`（observe/refresh/adopt/write/syncAssignment/migrate；`d2` 串行化 helper、`H6e` 项目排序 diff、`U6e=100/f2=8` 分页批量） | 高 |
| 142,076-142,207 | 应用 | 待删除项目调度器 | `K6e`→`PendingProjectDeletionScheduler`（logger `pending-app-server-project-deletions` 142,152；`G6e=3e4`、timers Map、deleteAfterMs 到期执行 finish） | 高 |
| 142,208-142,672 | 应用 | **host-app-server-projects** | `Y6e`→`HostAppServerProjects`（logger `host-app-server-projects` 142,212；legacy↔server 项目 ID 映射、thread/started+turn/completed 通知触发 assignment 同步、project create/import/update/move/delete、initializeProjects 迁移、`J6e` Symbol 排序键；`Nt=6e4` 删除窗口） | 高 |
| 142,673-142,735 | 应用 | 本地项目缓存后端 | `p2`→`LocalProjectCache`（globalState LOCAL_PROJECTS/PROJECT_APPEARANCES 直读写，projectBackend 默认实现） | 高 |
| 142,736-142,833 | 应用 | 项目文件夹信任确认 | `X6e` schema、`Z6e`→`ProjectFolderConsentService`（config/read trust_level 比对、渲染端确认回调、destroyed/render-process-gone 清理；`Q6e/$6e` 订阅句柄小类） | 高 |
| 142,834-142,981 | 应用 | 未分配线程归因 | `t8e`（affectedRootPaths→扫描线程→按 git origin/cwd 归属项目或标记 projectless，`e8e=8` 并发、`n8e` 根匹配表）、`m2` 排序合并 | 高 |
| 142,982-143,447 | 应用 | **projects-manager** | `o8e`→`ProjectsManager`（logger `projects-manager` 143,006；local/remote 项目 CRUD、appearance、projectOrder 串行写、workspace roots、confirmProjectFolders 网关、assignUnassignedThreadsBeforeProjectRootsChange；schema `r8e/h2/g2/i8e/_2/a8e`） | 高 |
| 143,448-143,539 | 应用 | composer/realtime RPC 门面 | `s8e`→`ComposerRpcFacade`（controller origin 适配）、`c8e`→`RealtimeComposerFacade`（registerRealtimeStarter/requestRealtimeStart/markEphemeral） | 高 |
| 143,540-143,657 | 应用 | AirPods 静音 + 语音连续性 | `l8e` createRequire、`u8e/d8e` airpods-mute.node 加载 + macOS>=23 门卫、`f8e`→`AirPodsMicrophoneMuteService`（logger `airpods-microphone-mute` 143,542；powerMonitor resume 恢复、capture-changed 事件）、`p8e='realtime-voice-continuity.json'`、`g8e`→`VoiceContinuityStore`（串行写 `v2` promise 链）、`y2/_8e/b2/v8e` 读写 helper | 高 |
| 143,658-144,184 | 应用 | 语音投影（timeline 记录） | `y8e`→`VoiceSummaryReader`（memories/memory_summary.md）、`b8e`→`VoiceTimelineProjection`（bem-turn/item/presentation/transcript/handoff 事件→ledger 记录；ephemeral 线程不落盘 `yw`）、`x8e/x2/S2/S8e/C2/w2` 记录映射、`C8e`→`RealtimeVoiceTimelineService`（subscribe/markEphemeral/forgetEphemeral，`w8e` 订阅句柄） | 高 |
| 144,185-144,466 | 应用 | 语音多代理活动投影 | `E8e/D8e` collabAgentToolCall/subAgentActivity schema、`O8e/k8e/T2` 事件映射、`F8e`→`RealtimeVoiceEventBus`（app-server 通知 `P8e` 13 个 method→session/bem/transcript 事件；连接注册表订阅、agentMessages 增量 presentation 发布 `n.wo` 解析） | 高 |
| 144,467-145,357 | 应用 | **realtime-voice-host-coordinator** | `L8e`→`RealtimeVoiceHostCoordinator`（logger `realtime-voice-host-coordinator` 144,887；claim/publish/release/control/transfer/captureScreenContext/getRestartBlockers/subscribe；native 麦克风静音集成、orphaned/terminating 清理状态机、`I8e` 初始快照、`R8e/F2` 句柄） | 高 |
| 145,358-145,465 | 应用 | 语音多代理活动订阅服务 | `z8e=100`、`B8e`→`MultiAgentActivityService`（activities 环形缓存 + 订阅分发；`V8e/I2` 句柄） | 高 |
| 145,466-145,928 | 应用 | 语音呈现表面协调器 | `H8e=180/U8e=50/W8e=250` 时序常量、`G8e`→`VoicePresentationSurfaceCoordinator`（main-thread/global-overlay/in-window 表面注册与切换、dock/fade 动画编排 overlayMotion、`L2` 初始态；`K8e/q8e/J8e/R2` 句柄与比较） | 高 |
| 145,929-146,159 | 应用 | 语音线程标题生成 | `Y8e`→`RealtimeVoiceThreadTitleCoordinator`（logger 145,979；session-ended 后经 `n.a` 标题模型 fork 线程生成标题/description，abort 状态机；`z2` 键） | 高 |
| **146,160-146,592** | **vendored** | **ssh-config** | `G2` enum IIFE(146,190)、`H2/U2/W2/Z8e/Q8e/$8e` 正则、`K2` IdentityFile 类 directive 表、`Y2`→`SSHConfig`（extends Array：parse/stringify/compute/find/remove/append/prepend，`e5e` match criteria 求值含 spawnSync nslookup/exec）、`t5e` 手写 tokenizer、`X2` stringify | 高 |
| 146,593-146,774 | 应用 | **ssh 别名发现** | `Z2` logger `remote-connections/discovery`、`i5e`（colima 排除）/`a5e`（github.com 排除）集合、`Q2/o5e/e4`（Host 指令+Include 递归收集别名）、`$2`（`ssh -G -F` 解析 hostname/port/identity）、`s5e/t4/c5e/l5e/n4/u5e/d5e` 解析 helpers | 高 |
| 146,775-147,148 | 应用 | remote-control OAuth 设备授权 | `r4` clientId、`f5e` issuer、`m5e=[1455,1457]` 回调端口、`y5e` PKCE 流程（S256 code_challenge）、`b5e/x5e/o4/S5e/s4/C5e` URL/token 构造、`w5e` 本地 HTTP 回调服务器（含 `T5e` 内联授权成功 HTML 页 + `c4` 响应 helper） | 高 |
| 147,149-147,975 | 应用 | **remote-connections 管理器** | `l4` logger `remote-connections/window-context`、`E5e=250` 连接间隔、`D5e`→`RemoteConnectionsHandler`（ssh/remote-control/wsl 三源 reconcile、autoConnect、enrollment 授权、重命名/删除环境、目录浏览、`k5e/A5e/O5e/j5e` helpers、`u4` ~/.ssh/config 路径） | 高 |
| 147,976-148,028 | 应用 | remote-control 设备密钥 | `M5e` createRequire、`N5e='remote-control-device-key.node'`、`F5e`→`RemoteControlDeviceKeyClient`（createDeviceKey/signDeviceKey；`I5e/L5e/f4/p4` payload 校验） | 高 |
| 148,029-148,110 | 应用 | 远程呈现 RPC 门面 | `R5e`→`RemoteControlEnvironmentFacade`（renameIfDefault）、`z5e`→`RemotePresentationFacade`（PIP 任务控制：showTask/hideTask/nativeVideo 订阅计数、destroyed/did-navigate 释放） | 高 |
| 148,111-148,262 | 应用 | 主机描述符 + 请求输入自动解决 | `B5e='(remote) '`、`V5e/H5e/U5e/W5e/m4` ssh/remote-control/wsl 主机描述符组装、`G5e`→`RequestUserInputAutoResolutionFacade`（recordConversationActivity/snooze） | 高 |
| 148,263-148,655 | 应用 | **artifact 文档会话服务** | `h4/g4/_4/K5e/q5e/v4/J5e/Y5e/X5e` zod schema（find/adopt/read/append/refreshCleanSession/materialize）、`Z5e`→`ArtifactDocumentService`（workspaceRoot 授权+realpath 校验、per-path 串行、listener 通知、materialize 两段提交）、`Q5e` 句柄、`y4/$5e`（staged 原子写 + fsync 目录）、`e7e/b4/t7e/n7e` helper | 高 |
| **148,656-149,763** | **vendored** | **lib0** | `x4/S4/C4/r7e/w4/T4/i7e/E4/a7e` map/set/array 工具、`o7e`→`Observable`、`j4/M4/s7e/c7e/l7e/N4` number/string 工具、148,709-148,715 polyfill 副作用、`D7e` webcrypto、`M7e` performance、`T3` isMac、`O3('production')` 149,167、`A7e()` 149,201、`h9e`(159,758 附近 ds/sv 结构) 149,763 实例化 | 高 |
| **149,764-152,559** | **vendored** | **Yjs** | `n6/r6/g6` GC 相关 149,764+、`v6` UpdateDecoder 150,068、`q3` 149,508 附近、150,328 "Add Yjs type to a document"、152,540-152,559 重复导入守卫；应用层引用 `S9e`(150,082 mergeUpdates 校验)/`T9e`(150,122 mergeUpdates) | 高 |
| 152,560-153,460 | 应用 | **Yjs 应用层：artifact document 存储** | `bet=8388608/xet=128` 压缩阈值、`E8/D8` hash 正则、`Eet` 存储记录 schema、`k8/A8/j8`（串行 Map / 失败目录 Set）、`Det`→`ArtifactDocumentStore`（find/adopt/read/append/refreshCleanSession/beginMaterialization/finishMaterialization；commit 保留 512、checkpoint 压缩、原子写 `B8`、`ket` 记录不变量校验、`M8/N8/Oet/P8/F8/I8/L8/R8/z8/V8/H8/U8/W8/G8/K8/q8/J8/Y8` helper） | 高 |
| 153,461-153,965 | 应用 | **artifact-session-host-service** | `X8/Aet` binding schema、`jet`→`ExternalDocumentBindingRegistry`（bind/handleCall capture/apply）、`Met` 句柄、`Pet/Net` native snapshot schema、`Fet`→`ArtifactNativeOpenService`（getTargets/performFileAction/readSnapshot，mkdtemp 探测）、`Z8/zet` RPC method 常量表、`Vet`→`ArtifactSessionHostService`（logger 153,463；连接纪元管理、订阅 open/close、appendUpdate/markDirty/readAsset、host→viewer 回调分发、dispose）；`Uet` 动态 import host client 模块；`Wet/Get/Q8/$8/e5/t5/Ket/n5/qet/r5/i5/a5/o5` 结果校验 helper | 高 |
| 153,966-154,323 | 应用 | **notifications-service** | `Jet` execFile promisify、`Yet` 音频 schema、`Xet`→`NotificationsService`（logger `notifications-service` 154,096；show/hide 转发 desktopNotificationManager、previewSound（afplay/win32）、importSound（afinfo 校验 ≤10MB）、激活聚焦恢复 `#r/#n/#i`） | 高 |
| 154,324-154,523 | 应用 | ssh 连接注册 + 启动阶段上报 | `s5/$et` schema、`ett`→`SshConnectionRegistrationService`（logger `ssh-connection-registration` 154,327；add/remove 写 CODEX_MANAGED_REMOTE_CONNECTIONS）、`ttt`→`StartupPhasesRpcFacade`（whenReady/reach/bufferPhase，主窗口替换守卫） | 高 |
| 154,524-154,585 | 应用 | macOS 通知权限（objc-js） | `ntt/rtt/itt`（SpectrumCapture 订阅，动态 require `./capture-DaZJeQgG.js` 154,556）、`ctt/ltt`（objc-js UNUserNotificationCenter requestAuthorization）、`utt/dtt`（RunLoop + 单例 `u5`、运行计数 `d5/f5`）、`att`→`FontFamiliesFacade` | 高 |
| 154,586-154,767 | 应用 | **system-permissions-service** | `p5` logger 154,654、`ytt`→`SystemPermissionsService`（notification/microphone 权限查询与请求、打开系统设置面板 darwin/win32、showPermissionSettingsAppInFinder `a.m()`） | 高 |
| 154,768-155,038 | 应用 | 标签拖拽 cue 呈现窗口 | `btt` data: URL、`Ctt`→`DragCuePresentationWindow`（透明 BrowserWindow + capturePage + 16ms 跟随光标）、`Ett/Dtt` 门面（`m5/wtt/Ttt` schema） | 高 |
| 155,039-155,103 | 应用 | 终端 RPC 门面 | `Ott/ktt/Att/jtt/h5/g5/_5/v5/y5` shell 探测（win32 PowerShell/CMD/GitBash/WSL）、`Mtt`→`TerminalRpcFacade`（attach/create/write/resize/runAction/subscribe，tracing `n.aa`） | 高 |
| 155,104-155,315 | 应用 | 终端输出清洗 + win32 控制台 | `Ntt`（OSC/CSI 转义剥离，过滤 cwd 查询应答）、`Ptt/Ftt/b5/Itt/Ltt`（PowerShell GetConsoleProcessList 内联脚本，`Rtt` createRequire 155,315） | 高 |
| 155,316-155,385 | 应用 | **node-pty 后端** | `ztt`→`NodePtyBackend`（静态 create：`Rtt('node-pty')` 动态 require 155,319；dispose 时 darwin 逆序 SIGKILL 进程树 `n.nn`） | 高 |
| 155,386-156,074 | 应用 | **集成终端会话管理器** | `Vtt=16e3` 缓冲、`Htt=100`、`x5='xterm-256color'`、`Utt` 空后端、`S5` 会话键、`Wtt`→`TerminalManager`（sessions/pendingCreates/listenersByOwnerId/sessionsByWindowConversation；createOrAttach/attach/write/resize/runAction/close/transferSessionOwnership/getRestartBlockers；local（node-pty）/remote（`NQ` startProcessSession）/durable（environmentBackend）三种后端；`C5/Gtt/Ktt/w5/T5/qtt/Jtt` shell 命令构造、`Ytt` shellKind 判定） | 高 |
| 156,075-156,100 | 应用 | ThreadArchiveService（头部） | `Xtt` 类头（logger `ThreadArchiveService` 156,079；构造参数 executionHostRegistry/appServerConnectionRegistry/localThreadCatalogSyncCoordinator）；类体延伸入 R11 区间 | 高 |

---

## 2. vendored 识别（精确边界）

| 包 | 行区间 | 边界证据 | 置信度 |
|---|---|---|---|
| **ssh-config**（npm `ssh-config`） | **146,160-146,592** | 起：146,160 `H2 = /\s/` 正则族 + 146,190 `G2` enum IIFE（`(function (e) { (e[(e.DIRECTIVE=1)]=...)`）+ 146,195 `K2 = ['IdentityFile','LocalForward','RemoteForward','DynamicForward','CertificateFile']`；止：146,592 `Z2 = r.i('remote-connections/discovery')` 前一行（`X2` stringify 结束于 146,591） | 高 |
| **lib0** | **148,656-149,763** | 起：148,656 `x4 = () => new Map()`（此前 148,655 是应用函数 `n7e`）；内部：148,709 `Number.isNaN;`（引用以强制 no-tree-shake）、148,713/148,715 polyfill 元组、149,067 `_.webcrypto.subtle`、149,167 `O3('production')`、149,201 `A7e()`；止：149,763 `((e, t) => new h9e(e, t))(a9e(), new Map())`（Yjs DeletedSet 构造，149,764 `n6 = (e,t)=>...` 已是 Yjs GC 代码） | 高 |
| **Yjs** | **149,764-152,559** | 起：149,743 `[yjs] Tried to remove event handler...`（在该区间内）；确认应用层引用 `S9e`(150,082)/`T9e`(150,122) mergeUpdates；150,328 `Add Yjs type to a document`；止：152,540-152,559 `w8[T8]`（`__ $YJS$ __`）重复导入守卫；**152,560 `bet = 8388608` 起是应用层**（artifact 存储 schema `Eet` 152,580） | 高 |

区间内无其他完整 vendored 库。注意三个原生 addon / 外部模块动态加载点（非 vendored，重写需原生桥/依赖声明）：

- `node-pty`：155,315 `Rtt = createRequire(__filename)` + 155,319 `Rtt('node-pty')`（**惰性**，首次 create 终端时才加载）
- `airpods-mute.node`：143,568 `l8e(...)`（打包态 `native/airpods-mute.node`，`u8e()` 惰性）
- `remote-control-device-key.node`：148,025 `M5e` + `F5e.getAddon()` 惰性（`resourcesPath/native/` 下）
- `objc-js`：154,600/154,648 `await import('objc-js')`（动态 ESM import，mac 通知权限）
- `./capture-DaZJeQgG.js`：154,556 动态 require（SpectrumCapture，**跨 chunk 动态依赖**）
- `@oai/*` host client 模块：153,966 `Uet` `await import(pathToFileURL(e.hostClientModulePath))`（运行时安装的 primary runtime 内模块）

---

## 3. 子系统聚类与拆分方案

建议模块名 kebab-case；「定义」列出压缩名 → 语义名。

### 3.1 open-in 与杂项服务（140,000-140,716）

- `open-in-targets`（140,000-140,470）：`b0/x0/S0/C0/p6e/w0/T0/E0/D0/O0/k0/m6e/h6e/P0/g6e/_6e/F0/v6e/I0/L0` + `N0`→`OpenInService`（粗扫把 139,940 的 `r.i('open-in-targets')` 归 R9——实际 open-in 主体在 R10 这段；R9 侧的 open-in 代码是其上游）
- `owl-runtime-features`（140,470-140,492）：`y6e/z0/R0`
- `span-cpu-sampling-bridge`（140,493-140,508）：`b6e`
- `incentives-service`（140,509-140,637）：`x6e/S6e/C6e/w6e/V0`（409 行内聚）
- `plugin-list-service`（140,638-140,669）：`T6e`
- `workspace-dependencies-tool`（140,670-140,715）：`H0/E6e/D6e/U0`

### 3.2 primary runtime 簇（140,716-141,879）

- `primary-runtime-installer`（140,716-141,605）：`W0`(logger)/`G0/K0/q0/J0`(状态)/`Y0/X0/Z0/O6e/Q0/$0/e2/t2/k6e/n2/A6e/j6e/M6e/r2/i2/a2/N6e/o2/s2/P6e/F6e/c2/l2/I6e/u2`。核心不变量：安装按 `JSON.stringify({forceReinstall,requireWindowsFramework,release,runtimeOptions,target})` 键去重（`q0` Map，141,418），postInstall promise 链全局串行（`J0`，141,498）。
- `primary-runtime-host`（141,606-141,879）：`L6e`→`PrimaryRuntimeHost`。装配点 159,573 `new L6e(...)`。
- 依赖：`n.An`(installRuntime)/`n.Cn`(cacheStatus)/`n.wn`(依赖探测)/`n.xn`(版本)/`n.kn`(runtimeSource)/`n.jn`(framework 激活) 全部来自 shared chunk——**primary runtime 的执行核心在 shared**，本区只是轮询/编排/日志壳。

### 3.3 projects 簇（141,880-142,981）

- `projectless-directory-chooser`（141,880-141,944）：`V6e`
- `thread-project-assignments`（141,945-142,075）：`W6e/d2/H6e/U6e/f2`
- `pending-project-deletions`（142,076-142,207）：`K6e/G6e`
- `host-app-server-projects`（142,208-142,672）：`Y6e/J6e/q6e/Nt`
- `local-project-cache`（142,673-142,735）：`p2`
- `project-folder-consent`（142,736-142,833）：`Z6e/Q6e/$6e/X6e`
- `thread-assignment-backfill`（142,834-142,981）：`t8e/n8e/m2/e8e`
- `projects-manager`（142,982-143,447）：`o8e` + schema 族
- 装配点 159,193（`new o8e(...)` 十一个构造参数，直接证据）；`Snt`（157,725，threadProjectAssignments 适配器）是其上游。

### 3.4 realtime voice 簇（143,448-146,159）

- `airpods-microphone-mute`（143,540-143,597）：`f8e/u8e/d8e/l8e`
- `voice-continuity-store`（143,598-143,657）：`g8e/p8e/v2/y2/_8e/b2/v8e`
- `voice-summary-reader`（143,640-143,657 头部）：`y8e`
- `voice-timeline-projection`（143,658-144,237）：`b8e/C8e/x8e/x2/S2/S8e/C2/w2/w8e/T8e`
- `realtime-voice-event-bus`（144,238-144,876）：`F8e/P8e/D8e/E8e/A8e/O8e/k8e/T2/E2/k2/A2/N8e/M8e/N2/P2/j2`（app-server `thread/realtime/*` 通知 → 内部事件总线）
- `realtime-voice-host-coordinator`（144,877-145,465）：`L8e/I8e/R8e/F2`（claim/control/transfer 状态机 + `simulate-usage-limit-approaching-for-debug` 控制消息即在此，145,011——**粗扫的 usage-limit 主题其实是这个 debug 分支**）
- `multi-agent-activity-service`（145,358-145,465）：`B8e/z8e/V8e/I2`
- `voice-presentation-surface-coordinator`（145,466-145,951）：`G8e/L2/H8e/U8e/W8e/K8e/q8e/J8e/R2`
- `voice-thread-title-coordinator`（145,952-146,159）：`Y8e/z2`
- `composer/realtime RPC 门面`（143,448-143,539）：`s8e/c8e`（每 webContents origin 的转发壳）
- 装配点 159,397-159,411（`F8e/C8e/B8e/Y8e/L8e.create/G8e.create` 一串，直接证据）。

### 3.5 remote connections 簇（146,593-148,110）

- `ssh-alias-discovery`（146,593-146,774）：`Z2/Q2/o5e/e4/$2/s5e/t4/c5e/l5e/n4/u5e/d5e`（消费 vendored `Y2.parse`）
- `remote-control-oauth`（146,775-147,148）：`r4/f5e/p5e/m5e/i4/h5e/g5e/_5e/a4/v5e/y5e/b5e/x5e/o4/S5e/s4/C5e/w5e/c4/T5e`（PKCE + 本地 1455/1457 端口回调服务器）
- `remote-connections-handler`（147,149-147,975）：`D5e`（核心类）+ `O5e/k5e/A5e/j5e/u4/E5e`。装配点 159,549。
- `remote-control-device-key`（147,976-148,028）：`F5e/M5e/N5e/P5e/d4/I5e/L5e/f4/p4`
- `remote-presentation-facade`（148,029-148,110）：`R5e/z5e`
- `host-descriptors`（148,190-148,262 尾段）：`B5e/V5e/H5e/U5e/W5e/m4`
- `request-user-input-facade`（148,263-148,286）：`G5e`

### 3.6 artifact documents 簇（Yjs 应用层，148,263-153,965）

- `artifact-document-schemas`（148,287-148,325 + 152,560-152,596）：`h4/g4/_4/K5e/q5e/v4/J5e/Y5e/X5e` + `bet/xet/E8/D8/Cet/wet/O8/Tet/Eet`
- `artifact-document-service`（148,326-148,655）：`Z5e`→`ArtifactDocumentService`（授权/路径校验/串行/订阅分发）+ `Q5e/y4/$5e/e7e/b4/t7e/n7e`。装配点 159,489。
- `artifact-document-store`（152,596-153,460）：`Det`→`ArtifactDocumentStore`（JSON 文件持久化 + Yjs update/checkpoint 压缩 + 原子写 + 不变量校验）+ `k8/A8/j8/M8/N8/Oet/P8/ket/F8/I8/L8/R8/z8/B8/V8/H8/U8/W8/G8/K8/q8/J8/Y8`。装配点 159,503。**这是 Yjs 之上的应用代码**（`S9e` 校验 update、`T9e` merge 压缩 checkpoint）。
- `external-document-bindings`（153,139-153,310）：`jet/Met/X8/Aet`
- `artifact-native-open`（153,311-153,460）：`Fet/Iet/Let/Ret/Net/Pet`
- `artifact-session-host-service`（153,461-153,965）：`Vet/Z8/zet/Bet/Uet/Wet/Get/Q8/$8/e5/t5/Ket/n5/qet/r5/i5/a5/o5`。装配点 159,981。

### 3.7 notifications / permissions 簇（153,966-154,767）

- `notifications-service`（153,966-154,323）：`Xet/Jet/Yet`（+ `Zet/Qet` 154,324-154,327 附近的屏幕捕获门面，实为 `Zet`→`ScreenCaptureFacade`/`Qet`→`FocusedWindowCaptureSession`，含 sky addon `Vs` modifier capture 154,296）
- `ssh-connection-registration`（154,324-154,406）：`ett/s5/$et`。装配点 160,078。
- `startup-phases-rpc-facade`（154,407-154,523）：`ttt`
- `mac-notification-permission`（154,524-154,585）：`ntt/rtt/itt/ctt/ltt/utt/dtt/att/u5/d5/f5/c5`
- `system-permissions-service`（154,586-154,767）：`ytt/ftt/ptt/mtt/htt/gtt/_tt/vtt/p5`
- `drag-cue-presentation`（154,768-155,038）：`Ctt/Ett/Dtt/btt/m5/wtt/Ttt`

### 3.8 terminal 簇（155,039-156,074）

- `shell-resolution`（155,039-155,103）：`Ott/ktt/Att/jtt/h5/g5/_5/v5/y5`
- `terminal-output-filter`（155,190-155,248）：`Ntt`
- `windows-console-process-list`（155,248-155,314）：`Ptt/Ftt/b5/Itt/Ltt`
- `node-pty-backend`（155,315-155,384）：`ztt/Rtt/Btt`
- `terminal-manager`（155,386-156,074）：`Wtt/Vtt/Htt/x5/Utt/S5/C5/Gtt/Ktt/w5/T5/qtt/Jtt/Ytt`。装配点 159,530（7 个注入依赖）。RPC 门面 `Mtt`（155,103-155,189），装配点 160,214。
- `ThreadArchiveService`（156,075 起）：`Xtt`，装配点 159,484；**类体大部分在 156,075 之后（R11 侧），本区只含头部**。

---

## 4. 顶层可变状态清单（模块级、被运行时改写）

| 名 | 行 | 语义 | 读/写方 | 证据 |
|---|---|---|---|---|
| `R0` | 140,470 | Owl runtime 特性当前值 `{}` | `y6e.setRuntimeFeatures` 写 / `z0` 复位 | 高 |
| `B0` | 140,527 | Set：已确认收据的 incentives campaign id | `w6e.acknowledgeReceipt` | 高 |
| `q0` | 140,719 | Map：进行中 primary runtime 安装（键=安装参数 JSON） | `P6e/Y0` 写删；`F6e` 读 | 高 |
| `J0` | 140,720 | Promise：安装 postInstall 全局串行链 | `P6e` 写（141,498） | 高 |
| `v2` | 143,598 | Promise：voice continuity 文件写串行链 | `g8e.record` 写 | 高 |
| `u5` | 154,594 | objc-js UNUserNotificationCenter 单例（let，惰性） | `dtt` 写（154,650） | 高 |
| `d5`/`f5` | 154,595-154,596 | RunLoop 运行计数 / 停止句柄 | `utt` 写 | 高 |
| `c5` | 154,518 | SpectrumCapture 单例（let，动态 require 后赋值） | `itt` 构造器写（154,558） | 高 |
| `k8` | 152,596 | Map：artifact document 按路径串行链 | `M8` 写删 | 高 |
| `A8`/`j8` | 152,597-152,598 | Set：已 fsync 目录 / 写失败文件（断电恢复标记） | `B8` 写 | 高 |
| `I8e` | 144,876 | voice coordinator 初始快照常量（const 语义，只读） | `L8e.getSnapshot` 默认值 | 高 |

（`Mt/Nt/Pt/Ae/pe` 等 R1-R2 区间常量在本区被引用但定义在区外：`Nt=6e4` 删除窗口 142,331、`Ae=268435456` 大小上限 153,379/`K()`。）

## 5. 顶层副作用序列（模块加载即执行）

区间内列 0 非声明语句全集中（`grep -nE '^[a-zA-Z_$!(]'` 排除声明后）：

1. **146,190** `(function (e) {...})((G2 ||= {}))` — ssh-config enum IIFE（vendored，纯数据）
2. **148,709-149,201** lib0 polyfill 引用序列（`Number.isNaN;`、`(Number.isNaN, Number.parseInt)`、`(String.fromCodePoint, c7e(65535))`、`F4 && F4.decode(...)`、`_.webcrypto.subtle;`、`Promise.all.bind(Promise)`、`typeof navigator < 'u' && ...`、try/catch 块 149,086、`O3('production')` 149,167、`A7e()` 149,201）——全部无外部可观察副作用（引用表达式 + polyfill 探测）
3. **149,763** `((e, t) => new h9e(e, t))(a9e(), new Map())` — Yjs DeletedSet 实例化（vendored 内部）
4. **152,540-152,559** Yjs 重复导入检查（`console.error` 仅重复导入时触发；`w8[T8] = !0` 写全局标记——**这是本区间唯一的真实全局副作用**，防止 Yjs 双实例）

**应用代码（140,000-148,655 + 152,560-156,100）零加载期副作用**：所有 `l.*` Electron 调用、fs、spawn、`Rtt('node-pty')`、`await import('objc-js')`、`l8e(airpods-mute.node)`、HTTP 服务器（`w5e`）均在方法体内。logger 创建（`r.i/r.r` 21 处，§1 表）只构造对象。**置信度：高**（列 0 语句全集已枚举；`sed` 窗口复核 148,598-152,590 全段无应用代码）。

## 6. 跨 chunk 依赖

### 6.1 @chunk/shared（`n.*`，src-DldfpmrL.js）

本区是 shared chunk 的**重消费区**（`n.*` 命中 95+ 种符号）。关键分组：

- **primary runtime 执行核心**（installer 只是编排壳）：`n.An`(installRuntime)/`n.Cn`(getCacheStatus)/`n.wn`(依赖探测)/`n.xn`(installedBundleVersion)/`n.kn`(runtimeSource)/`n.jn`(framework 激活)/`n.yn`(runtime 名)/`n.Ka`(默认 runtimeOptions)/`n.bn`(target)/`n.ec`(workspace_dependencies 特性键)/`n.Tn`(runtime root)
- **global-state 键 `n.iu.*`**：THREAD_PROJECT_ASSIGNMENTS/PROJECTLESS_THREAD_IDS/LOCAL_PROJECTS/REMOTE_PROJECTS/PROJECT_ORDER/PINNED_PROJECT_IDS/PROJECT_APPEARANCES/SELECTED_PROJECT/APP_SERVER_PROJECTS_MIGRATION_BY_HOST/APP_SERVER_PENDING_PROJECT_DELETIONS_BY_HOST/APP_SERVER_PROJECT_ID_BY_LEGACY_PROJECT_ID_BY_HOST/CODEX_MANAGED_REMOTE_CONNECTIONS/REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID/REMOTE_CONNECTION_ANALYTICS_ID_BY_HOST_ID/REMOTE_PROJECT_CONNECTION_BACKFILL_COMPLETED（projects/remote 簇全走这套键）
- **app-server 类型与工具**：`n.$u`(threadId 解析)/`n.ua`/`n.pa`(sourceKinds)/`n.ir/n.ar`(通知参数解析)/`n.Wu`(版本比较)/`n.wo`(agentMessage presentation 解析)/`n.oa`(assignment 记录重算)/`n.sa`(assignment 相等)/`n.a`(标题模型生成)/`n.Wr`(阶段聚合)/`n.Hf`(listener 适配)/`n.Eo`(voice transcript ledger，R3 定义)
- **路径/主机**：`n.zi`(hostConfig→pathImpl)/`n.Es`(isRemote)/`n._l`(path 归一)/`n.zi/n.Hi/n.Vi`(WSL 路径转换)/`n.ys`(ssh hostId)/`n.ws`(isRemoteControl)/`n.ks`(isWsl)/`n.vs`(wsl kind)/`n.cn`(ssh hostConfig 键)/`n.Ss`(ssh 命令构造)/`n.xs`(wsl hostId)/`n.Ii/n.Pi`(WSL distro 探测)/`n.Jn`(默认 shell)/`n.Bi`(env 清洗)/`n.$n`(shell 引用)/`n.nn`(进程树)/`n.Ns`(cwd 归一)/`n.aa`(tracing span)/`n.Zo`(错误序列化)
- **zod 实例族**（~120 处 schema）：`n.Of/wf/Cf/gf/hf/df/bf/jf/vf/Ef/if/ff/Lf/Lo` 等，同 R1-R2 报告 §6.1
- **webcrypto/文本**：vendored lib0 内 `D7e = _.webcrypto.getRandomValues.bind(...)`（149,067）依赖 node:crypto 绑定 `_`

### 6.2 logger chunk（`r.*`）

区间内 21 个具名 logger（全部直接证据，见 §1 表）：`open-in-service`/`workspace-dependencies-tool`/`install-primary-runtime`/`primary-runtime-host`/`pending-app-server-project-deletions`/`host-app-server-projects`/`projects-manager`/`airpods-microphone-mute`/`realtime-voice-host-coordinator`/`RealtimeVoiceThreadTitleCoordinator`/`remote-connections/discovery`/`remote-connections/window-context`/`artifact-session-host-service`/`notifications-service`/`ssh-connection-registration`/`mac-notification-permission`/`system-permissions-service`/`ThreadArchiveService`。

### 6.3 bootstrap chunk（`a.*`，对照 bootstrap-export-table.txt）

| 导出符号 | 区间内用法 | 行号 |
|---|---|---|
| `a.in` | build flavor 模型：`resolve()/isInternal()/values` | 140,143/141,393/141,396/141,539/141,558/141,573/141,735/154,671 |
| `a.rn` | flavor→bundleId 排除集 | 140,143 |
| `a.t()` | windows framework gate | 141,396/141,557 |
| `a.i(flavor, platform)` | framework 资格判定 | 141,396/141,558/141,735 |
| `a.r` | installFrameworkPackage 句柄 | 141,427 |
| `a.o` | framework root 激活 | 141,466 |
| `a.en()` | RPC 调用包装器（49 处，voice/artifact 分发都用） | 144,229 等全区间 |
| `a.Qt` | Sentry enabled flag | 154,455 |
| `a.m()` | 权限设置 app 路径 | 154,756 |

（`a.x()` 装配单例不在本区间直接调用——R10 类全部在 159,190-160,240（R11 侧的 DI 装配函数）实例化，见 §7 风险 1。）

### 6.4 其他 chunk / 动态依赖

- `o.t({env, resourcesPath})`：resources path 解析（141,537，bundled git 路径）
- `./capture-DaZJeQgG.js`：动态 require（154,556，SpectrumCapture）——**重写时需独立模块**
- `node-pty`/`objc-js`/`airpods-mute.node`/`remote-control-device-key.node`/host client 模块（§2 尾）
- 上游区内引用：`NQ`（remote 进程会话，128,704 定义于 R9）、`Lwe`（conversation DB，56,881 R4）、`Vs`（sky addon，10,076 R2）、`yw`（ephemeral ledger，R3/R4 侧）、`bE()`（shell 命令构造，R1-R2 侧）

## 7. 拆分风险

1. **装配全部在区外（最大结构性风险，与 R3 同型）**：R10 的 15+ 个核心类在 **159,190-160,240**（R11 侧 DI 装配）实例化——`o8e`(159,193)/`L6e`(159,573)/`Wtt`(159,530)/`D5e`(159,549)/`Xtt`(159,484)/`Z5e`(159,489)/`Det`(159,503)/`Vet`(159,981)/`ett`(160,078)/`Xet`(160,238)/`Mtt`(160,214)/`F8e/C8e/B8e/Y8e/L8e/G8e`(159,397-159,411)。构造参数面极宽（`Wtt` 7 项、`o8e` 11 项、`D5e` 13 项）。**重写顺序必须先锁定 159k 装配函数的接口面，R10 模块按其反推构造参数类型**；否则产生 manager↔service 循环 import。R3 报告已确认 161,190-161,213 也引用本区间侧的 catalog sync。
2. **155,000 边界切在终端类中间**：`Wtt`(155,386-156,074) 与 `Xtt`(156,075+) 横跨边界。建议派发时把 R10 的应用区间定为 **140,000-156,074**（terminal 完整归 R10），`Xtt` 归 R11；或本区定义到 156,100 由 R11 接续，二选一并写进两区任务描述。
3. **Yjs vendored 边界 + 应用层接缝**：应用层只用了 Yjs 的两个函数 `S9e`（update 校验，150,082）与 `T9e`（mergeUpdates，150,122）。重写时引 npm `yjs`，模块面收窄为 `{ validateUpdate, mergeUpdates }` 两个语义函数；**不可**把 149,764-152,559 当应用代码派发。lib0 同理（引 `lib0`，应用直接不触及其内部）。
4. **名字冲突（重写命名陷阱）**：
   - `M2/N2/P2/j2`（144,864-144,876 voice 键函数）vs `m2`（142,970 排序合并）vs `Mtt`（终端门面）——三种大小写近形；
   - `C5`(155,998 shellKind 判定) vs `ctt`(154,643 mac 权限) vs `c4`(146,981 HTTP 响应)；
   - `v2`（voice continuity promise 链）vs vendored Yjs 内部名空间（`v6/q3/d8/S8` 等 2-4 字母短名密集，粗扫 §2 结论「名字风格无分界」在 vendored 带内尤其严重）；
   - `u5/d5/f5`（154,594-154,596 objc 单例）vs `u4/d4/f4`（146,767/148,135/148,275 oauth/device-key 校验）——一字之差、语义完全无关。
   重写时必须建立压缩名→语义名对照并全局检索同名。
5. **全局串行化单例必须保留**：`q0/J0`（primary runtime 安装去重+串行，140,719-140,720）、`v2`（voice continuity 写链，143,598）、`k8`（artifact 按路径串行，152,596）。改成每调用新建会破坏「同参数安装合并」「同文件写不交叉」的不变量；改成全局锁又会过度串行。
6. **断电恢复标记 `A8/j8`**（152,597-152,598）：`B8` 原子写失败时把文件加入 `j8`（视为 persistence 故障而非 missing），`N8` 据此区分 `missing` vs `persistence`。这是文件系统损坏语义的关键分支，重写时不要「简化」成 try/catch。
7. **惰性加载不能提前**：`Rtt('node-pty')`（155,319）、`u8e()` airpods addon（143,568）、`F5e.getAddon()`（148,025）、`dtt()` objc-js（154,648）、`Uet` host client import（153,966）都是首次调用才加载——node-pty/objc-js/原生 addon 在无终端/无 mac 权限请求的会话中永远不加载。改成 import 顶层会改变失败时机与启动内存。
8. **vendored ssh-config 的 `compute` 有进程副作用**：`e5e` match 求值会 `spawnSync`（exec criteria、nslookup canonicalize，146,214-146,221/146,316-146,328）。上游 npm 包如此；重写若自研 ssh-config 解析，**发现路径 `e4` 不调用 compute**（只 walk Host/Include），但 `$2` 用 `ssh -G` 外部命令解析——两个路径都无 spawnSync 依赖，风险低但需测试覆盖 `Include` 递归 + glob。
9. **`w5e` 本地回调服务器占用固定端口 1455/1457**（146,787）：EADDRINUSE 回退逻辑（146,896-146,905）+ 超时（默认 `h5e=6e5`）+ 成功页重定向 `codex://settings/connections`。重写需保留双端口回退与 state 校验（CSRF 防护语义）。
10. **remote-control 错误类型分支**（147,818-147,875 内 `VT/UT/HT`）：`loadRemoteControlConnections` 用 instanceof 区分 accessRequired/authRequired/clientAuthorized 写入 sharedObjectRepository 状态。这三个错误类定义在区外（R5 认证区），拆分后需显式导出，否则状态机静默退化为「unknown error」分支。
11. **voice coordinator 的 claim/orphaned/terminating 状态机**（144,877-145,357）：`#m/#h/#g/#_` 四个清理路径 + transfer 快照 `#s/#o`。任一路径漏调用 `[Symbol.dispose]()` 都会泄漏 renderer RPC 句柄。建议为该类单独写状态转移测试清单再重写。
12. **`I8e` 快照结构即公共 API**：`L8e.getSnapshot()` 在无会话时返回模块级 `I8e` 对象引用（144,876）。重写时若改为每次新建对象，renderer 端引用比较（`===`）语义改变。同理 `L2`（145,462）。

## 8. 给下游派发的建议

- 按本文件 §1 边界派发；146,160-146,592（ssh-config）、148,656-149,763（lib0）、149,764-152,559（Yjs）三带**不派发**（引上游库），但 §3.6 的 artifact-document-store（152,560-153,460）必须与 Yjs 接缝一起派发并配 `mergeUpdates` 语义测试。
- 大单体类单独派发：`Wtt`（终端，~690 行）、`D5e`（remote connections，~820 行）、`o8e`（projects manager，~465 行）、`L8e`+`G8e`（voice coordinator + surface coordinator，~1,050 行）——每个配行为测试清单（会话恢复/orphan 清理/reconcile 三源/项目迁移）。
- 派发任务描述需附：行区间（§1）、压缩名→语义名（§3）、顶层状态（§4）、装配点行号（§7.1）。
