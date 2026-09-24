# main-C-Mhak1n.ts R11+R12 深度分析（155,000-176,978 行，含文件尾）

目标：`src/main/main-C-Mhak1n.ts` 的 155,000-176,978 行（R11=155,000-170,000 + R12=170,000-176,978）。
来源：macOS ChatGPT.app（Codex 桌面版 v26.917.71314）主进程 chunk。
方法：同 `docs/main-analysis-coarse.md` / `main-analysis-r1-r2.md`——200-400 行窗口采样 + 关键区域精读（**Ust 函数体 175,822-176,953 全读**、Pst/Wst/ert 构造器/cit/prt/yit/Qot/bst 精读）；所有行号经 `grep -n` 核实。置信度标注：**直接证据** = grep/原文引用；**采样推断** = 窗口采样。

**工具坑（沿用粗扫 §9.2）**：本机 grep 为 ugrep 7.8.4，BRE `\|` 多模式静默失效，本文全部多模式用 `-E 'a|b'`。

## 0. 总览与对粗扫的关键修正/确认

1. **粗扫 §9.6 确认：175,549 `new l.Tray(...)` 不是模块加载期副作用**。它位于 `Pst(e)`（175,510-175,589，托盘/原生状态项工厂）函数体内，仅在 `runMainAppStartup`（Ust）内部被调用：Windows/Linux 在启动序列中段直接创建（176,412 `(P || process.platform === 'linux') && Ge()`，`Ge`→`Pst`）；**macOS 不创建 Tray**，改走 `Mst`（175,359）原生菜单栏状态项（native status item，经 native addon），且仅在用户从渲染进程开启「菜单栏图标」时才创建（`Ke`→Rrt 的 `setMacMenuBarEnabled` 回调，176,403-176,411 / 176,650）。详见 §5.2。置信度：高（调用链逐行核实）。
2. **粗扫 §9.5 确认：164,854 `w7('SkCu')` 无可观察副作用**。`w7`（164,847）是 fourCharCode 转换器（4 字符串→32 位整数，macOS OSType 惯用法）；164,854-164,865 是一条**逗号表达式语句**，12 次调用（`SkCu/SndR/RspT/ReqD/ClVn/----/errn/errs/tdta/utf8/kpid/long`）结果全部丢弃；紧随其后的 164,867-164,891 又是一条丢弃表达式（`r.i('computer-use-capture-native-bridge')` logger 构造 + 两个 zod schema 构造，均未赋值）。两段都是打包器 tree-shaking 残留（常量表被摇掉、调用被当作潜在副作用保留）。纯计算/纯构造，无 I/O、无 Electron 调用。置信度：高（完整语句已读）。
3. **修正粗扫 §2/§8：159,096-160,999 才是 WindowContext 主体**。粗扫把 `WindowContext` 归到 158,896 `Jnt`；实际 `Jnt` 只是 downloads 广播器（也挂 `r.r('WindowContext')` logger），真正的 WindowContext 巨类是 **`ert`（159,096-160,999，~1,900 行）**，其构造器（159,171-159,921，~750 行）是全文件最大的 DI 装配面。工厂函数 `art`（161,148）在 Ust 176,107 被调用。
4. **修正粗扫 §4「本 chunk 不建 Worker」**：174,564 `f = new B.Worker(t, {...})`（`B` = node:worker_threads interop 绑定，t = `__dirname/worker.js`）。粗扫 `new Worker` grep 失配是因为绑定名 `B.`。worker 宿主管理类 `H9`（174,709，logger `worker-manager`），git/open-in/computer-use 三种 worker 按需拉起。
5. **vendored 带比粗扫估计的大得多**：168,048-172,084 连续 ~4,000 行几乎全是 vendored（string-width/cli-truncate/picocolors + 完整 mime-db 第二份 + is-plain-obj/sort-keys + electron-dl + electron-context-menu），粗扫只标了 171,900-172,400 的 mime 变体。见 §2。
6. 本区间是**全文件的收口**：唯一的 chunk 导出 `runMainAppStartup`（Ust）在这里把前 155,000 行的所有子系统装配成运行中的应用（装配面见 §3.9/§7.2）。

---

## 1. 区域地图（子区域 ≤1500 行）

| 行区间 | 类型 | 语义名 | 概述 |
|---|---|---|---|
| 155,000-155,038 | 应用(R10 尾) | 拖拽 cue 展示包装 | `Dtt`（154,991）presentation 包装（updateCue/freeze/load，avatar 拖拽 ghost）；R11 实际起点 155,039（`Ott/ktt` 终端常量） |
| 155,039-155,315 | 应用 | 终端 shell 解析（Windows） | `Att/jtt/h5/g5/_5/v5/y5`：powershell/pwsh、cmd、git-bash、wsl 探测与 shell 显示名（`Pt.wsl` 等，R1 符号）；`Mtt`(155,103) 终端视图 EventEmitter；155,248-155,313 **Windows 控制台进程清点**（内嵌 PowerShell/Add-Type P/Invoke `GetConsoleProcessList`，`Ltt`） |
| 155,315-156,075 | 应用 | 集成终端管理器 | `Rtt = createRequire`（155,315）、**`ztt` node-pty 包装类**（155,316，`Rtt('node-pty')` 动态 require，killProcessTree darwin SIGKILL 树杀）、**`Wtt` IntegratedTerminalManager**（155,386-156,003，sessions/pendingCreates/getRestartBlockers→`terminal.session`）、`Vtt=16e3` |
| 156,075-156,905 | 应用 | 线程归档服务 | **`Xtt` ThreadArchiveService**（156,075，logger 直接证据）：archiveInactiveThread（`n.Jr` 本地归档 + catalog 移除）、`C5/Gtt/Ktt/w5/T5/qtt/Jtt/Ytt` 归档辅助 |
| 156,905-157,620 | 应用 | 线程目录多源同步 | `dnt`（156,927）**threadCatalogSyncManager**：多 host 扫描存储（hosts Map/scanWaiters/full-incremental 扫描、freshness=Qtt、backoff=O5、cold retry）；`j5/unt` ChatGPT /conversations zod schema；host 源适配器 `M5`(local,157,418)/`fnt`(chatgpt,157,466) |
| 157,621-158,180 | 应用 | cron-turn 读状态 + 未读会话 | `I5`(157,621) cron-turn-read-state 类、`Dnt` 逐线程包装（157,808）、**`Ont`**（157,879）identity 键控未读会话管理（logout/identity/hosts 世代失效，globalState 键 `a.tt`）、`bnt` 等 |
| 158,181-158,896 | 应用 | thread-read-state 装配 + 触发器订阅 | `Ant`（158,189）read-state 工厂（Ont 装配 + `n.v` client-coordination 广播 `thread-read-state-changed`）、`jnt`（158,320）RPC 服务包装、`Fnt`（158,561）**内容追踪控制器**（`a.S` 导出批次、`a.E` 采样率、DQe/OQe/jQe/AQe 录制上报）、`Rnt/znt` 触发器(event-subscriptions)读取器 |
| 158,896-159,096 | 应用 | WindowContext 前置件 | `Jnt`（158,896）downloads 状态/生命周期广播器（detached views、WeakMap 队列）；`W5/Ynt` websocket URL 判定；`Xnt`(159,059) 历史滑动导航桥；`Znt` github-request 多路复用；`G5 = r.r('WindowContext')`(159,093) |
| 159,096-161,000 | 应用 | **WindowContext 巨类 `ert`** | 构造器 159,171-159,921（~50 个服务字段 DI：statsig `a.H`、appServerConnectionRegistry `cee`(913,R1)、fetchHandler、messageHandler、projectsManager、terminalManager、LSP、dictation、artifactDocuments、threadCatalogSyncManager…）；方法群 159,921-160,999（createAppHost 159,921、registerAppView 160,264、applyCodexAppConfig 160,344/160,358、registerWindow 160,393、handleMessage 160,488、createAppServerConnection 160,742、registerIpcClientForWebContents 160,970…） |
| 161,000-161,357 | 应用 | app-server 传输选择 + 认证恢复 + art 工厂 | `trt/K5`（161,001/161,003）**传输选择**：ssh-websocket `VE`/remote-control `JEe`/stdio `QDe`/cloud ws `n.pn`(+`hEe`+`kT` auth)/默认 stdio `n.dn`；`q5/nrt/rrt/irt` 认证过期恢复对话框（logout+retry 循环）；**`art`（161,148-161,356）WindowContext+ElectronMessageHandler 总工厂**（`new Awe()`、可选 `hhe` thread DB(R3)） |
| 161,357-161,484 | 应用 | 原生右键菜单 IPC + MessagePort | `J5=16` 图标上限、`ort/X5/srt` 菜单图标解析（data:/file://///apps/ 搜索根）、**`crt`（161,437）`ipcMain.handle(a.Vt)` 原生 context menu popup**、`lrt/urt`（161,480-161,531）MessagePort 结构化克隆通道（`n.Vf` remote main） |
| 161,484-161,790 | 应用 | 托盘菜单管理器 | **`prt` TrayMenuManager**（161,535-161,758）：win/linux/darwin 三平台行为（darwin 原生 popUpContextMenu + 点击抑制）、cachedWindowsTrayMenu、trayMenuThreads（running/unread/pinned/recent/usageLimits）、`Q5/$5` 菜单项构建（161,759/161,776）、`e7` 系统 Quit 菜单文案（161,786） |
| 161,790-162,144 | 应用 | 退出强杀 + macOS 关机观察 | `mrt=1e4`、`t7` armed flag；**`hrt`（161,792）killProcessDescendants（Windows updater addon `a.ft`）**、`n7` armTerminateCurrentProcess、`r7` addon 加载；**`_rt`（161,814）macOS 系统关机观察**（动态 `import('objc-js')` + NSWorkspaceWillPowerOffNotification→allowQuit）；退出确认 i18n 文案 161,842-161,857；`a7` relaunch+quit（161,858）；`Prt=12e3`；`Irt`（161,864）更新退出生命周期清理；`Lrt/s7` 超时包装；`Rrt`（161,884）见下 |
| 162,144-162,191 | 应用 | bootstrap 信息同步 IPC | **`zrt`**：`a.Rt`(bootstrapInfo：`a.Zt`+`a.St()` 版本+`a.w()` 采样率)、`a.Ft`(buildFlavor)、`a.zt`(sharedObjectSnapshot)、`a.Lt`(initialSidebarBootstrap)、`a.Ht`(startFileDrag)、`a.Ut`(link startDrag) |
| 162,191-162,478 | 应用 | 退出守卫接线 + 关于对话框 | **`Brt`（162,191）before-quit 守卫**（`nc()` 更新中防退、活跃本地会话/计划任务/pending worktree 三态确认对话框、markAppQuitting、flushTracing `a.C`+git worker、flushAndDisposeContext）；`Vrt` 确认文案组装（162,312）；**`Qrt`（162,397）关于对话框**（单例窗口 `p7`，release notes、`n.Ro` flavor 名） |
| 162,478-162,857 | 应用 | 关于对话框 HTML + 菜单命令表 | `$rt/eit/tit` 版本/更新检查 URL、`m7/h7/nit` 更新检查、**`rit`（162,539）关于框 HTML 模板**（CSP、dark/light）、`g7`（162,671）菜单命令标题 i18n 表、`iit`（162,689）Windows 菜单栏 Edit 菜单模板 |
| 162,854-163,894 | 应用 | **应用菜单构建器 `sit`** | `_7 = r.i('sparkle')`（162,854）；**`sit`（162,857-163,893，~1,000 行）**：keymap `n.Ct()`/`n.At()`/`n.Mt()`/`n.Ot()`/`n.Nt()`，命令可见性（codexLocal/workLocal access）、accelerator 归一化去重（浏览器可覆盖键 `n.Ft`）、sparkle 菜单（检查更新/安装）、debug 菜单、角色菜单（undo/cut/paste…） |
| 163,894-163,940 | 应用 | accelerator 归一化 + 菜单刷新器 | `v7`（163,894）CmdOrCtrl/Option/meta 平台归一化；**`cit`**（163,930）applicationMenuManager（buildMenu+refresh）；`y7 = r.r('codex-deep-link-navigation')`（163,939） |
| 163,940-164,396 | 应用 | **deep link 路由分发** | `lit`（163,940）route.kind 分发（applyCodexAppConfig/experienceActivation/pluginInstall/petInstall/pluginDetail/pluginMcpApp…）；`uit/dit/fit/pit/mit/hit/git/b7`（164,140-164,267）各 kind 处理器；**`_it`（164,268-164,388）deepLinks 管理器工厂**（registerProtocolClient/queueProcessArgs/queueCodexDeepLinkUrl/flushPendingDeepLinks/navigateToRoute + applicationMenuManager 组装，`a.y` 处理器工厂 164,297） |
| 164,396-164,538 | 应用 | 退出状态 + 启动进度窗口 | **`yit` QuitState**（164,396：allowQuitWithoutPrompt 60s 自复位、skipDrainBeforeQuit、markQuitApproved）；进度窗文案；**`x7`（164,429）sqlite backfill / app-server 慢启动进度 BrowserWindow**（420x176 sandbox、data: URL、close→onQuit）；`Oit`（164,485）延迟展示（`Hst=3e4` app-server）；`kit` HTML |
| 164,538-164,982 | 应用 | appshot 快捷键 + 截图校验 | `Ait='DoubleCommand'`、`Oit/kit`、**`S7` 双击 Alt/Shift 判定**（164,778）、`Fit` pet 全局热键（openAvatarOverlay，`qV/YV` 注册器）、`C7` 访问就绪判定；`w7` fourCharCode + 死代码（§0.2）；`Iit='com.openai.sky.CUAService'`、`Lit=26214400`；`Rit/zit/T7/Bit` 截图路径/mime/大小校验（须在 CUAService tmpdir 内）；`Vit` Windows Computer Use helper transport（动态 import transport module） |
| 164,982-165,566 | 应用 | Windows capture 桥 + **全局听写粘贴** | `E7/D7/O7/Hit/Uit` zod schema、`k7 = r.i('windows-capture-native-bridge')`、`A7` 超时表、**`Wit`（164,982-165,281）Windows capture bridge 生命周期**；`Git/Kit/qit/Jit` capture 更新推送；`M7/N7/P7/F7` abort 工具；**听写粘贴**：`$it`（165,377）AXPaste（objc-js + AXUIElement 遍历前台应用菜单栏找 Paste 命令，`eat/I7/L7` AX 辅助）、`nat`（165,464）粘贴主流程（clipboard 指纹 `B7` 保存/恢复 `rat/iat/V7`、OS 分支 165,556-165,563） |
| 165,566-166,455 | 应用 | 全局听写窗口控制器 + 生命周期 | `oat=16`、`H7={720,84}`；**`sat`（165,568）听写录音窗控制器**（recorderWindow 惰性 `GN`、paste-failure 恢复窗）；**全局听写生命周期管理器类**（~166,0xx-166,454：hold/toggle 热键世代、nativePet renderer webContents 跟踪、`handleTranscript`→`nat` 粘贴、`L$e` 历史、escape 注册）——即 Ust 的 `globalDictationLifecycleManager` |
| 166,455-166,710 | 应用 | 快捷键窗口 snap 引导 | `W7/G7` 可达性；**`hat`（166,482）composer-snap-guides 窗口**（1x1 透明 always-on-top、`mat` data-URL SVG 网格 166,481、`javascript:!1`）；`fat/pat/K7` composer 几何；`q7`（166,602）snap 线 CSS path 生成 |
| 166,612-166,638 | 应用 | snap 触觉反馈 | **`gat` composer-snap-haptics**（objc-js `NSHapticFeedbackManager`，darwin 惰性 load，performFeedbackPattern） |
| 166,638-167,445 | 应用 | **hotkey window 控制器** | `_at`（166,639）拖拽运动模拟（reducedMotion/releaseUntil）；**`Sat`（166,710-167,444）hotkey-window-controller**（logger 直接证据）：home/thread 双窗、mode hidden/home/threadVisible、homePlacement 持久化（globalState `hotkey-window-home-placement`）、磁吸拖拽（`a.ot/a.at/a.ct/a.it/a.st` bootstrap 几何助手 + `gat` 触觉 + `hat` 引导窗） |
| 167,445-167,984 | 应用 | hotkey window 生命周期 + 预热 | `Cat/e9/t9/wat` 工具、`Tat=1e3`；**`Eat`（167,458-167,785）hotkeyWindowLifecycleManager**（hotkeyWindowHotkey globalState 迁移、gate、注册/重试、ownershipLock）；`kat`（167,789-167,983）窗口预热管理器（r9=1280、claimedPrewarms、prewarmedRendererReady）；`jat`（167,984）realtime voice 热键（hold 语义、`YV`） |
| 168,048-168,717 | **vendored** | string-width 族 | 见 §2 |
| 168,718-168,834 | vendored+应用 | 唯一文件名 + 模板 | `Yat`(existsSync)、`Xat` Max tries reached 错误、`Zat` filename(N) 去重、`Qat/$at` 唯一路径生成、`eot` placeholder 错误、`not` 消息模板（`{filename}`）——服务于下载文件名去重（172,029） |
| 168,834-171,940 | **vendored** | mime-db 完整表（第二份） | `rot = e.r({default:()=>b9})` + `iot = e.n(...)` 惰性；`b9` 全量 IANA/apache mime 表（application/…、audio/…、video/x-flv 171,900 直接证据）；与 bootstrap 434-3317 的 mime-db 是**另一份副本**（本份为 main chunk 独立 require） |
| 171,940-172,008 | **vendored** | 排序/反查工具 | `sot` is-plain-obj、`cot` sort-keys、`lot` sort-keys-length（desc/asc）、`uot` 扩展名↔mime 反查（按扩展名后缀过滤）、`dot` interop、`pot` 文件名补扩展名（按 mime） |
| 172,009-172,093 | **vendored** | electron-dl 下载管理 | **`mot`（172,009-172,084）** will-download 处理器（badgeCount、进度条、saveAs/overwrite、openFolderWhenDone、dock.downloadFinished）、`x9`（172,085）downloadURL promise 包装 |
| 172,094-172,419 | **vendored** | electron-context-menu | 172,094 Electron 环境守卫（`typeof u.default == 'string'` throw）、`S9/hot/got/_ot` electron-is-dev、`C9/w9/vot/yot/not/bot`（learnSpelling/lookUpSelection/searchWithGoogle/cut/copy/paste + **172,357 `Jat(t,25)` 选中截断**——上带 string-width 的唯一消费者） |
| 172,419-172,646 | 应用 | debug 源注册表 + URL 信任判定 | `xot` 需同步 localStorage 键集合（prompt-history 等）、`Sot`（172,425）debug 源注册（sources/listeners、MessagePort dup）；`E9/D9/wot/Tot/Eot/Dot`（172,638-172,684）URL 等价判定（app:-host、file:、同源）——`isTrustedIpcSender` 的基础 |
| 172,646-172,803 | 应用 | 线程元数据服务 | `Oot` RGI emoji 正则、**`kot`（172,686）ThreadMetadataService**（SIDEBAR_THREAD_METADATA 持久化 + 失败回滚 + `n.iu` 键广播）、`Aot/jot` 更新合并 |
| 172,803-173,917 | 应用 | **WindowManager `Qot`** | logger `O9 = r.i('window-manager')`（172,751）；字段群 172,804-172,837（primaryWindows/WeakMap lastActive/appShellCommandKeymapState `n.Ct()`/closeTab accelerators/rendererRecoveryAttempts…）；构造器 172,838（threadMetadataService、debugWindowManager）；方法群至 173,917（sendMessageToWebContents 173,040 走 `a.At` chunked critical、createWindow/ensureWindow/showPrimaryWindow、window backdrops、zoom、appearance） |
| 173,917-174,120 | 应用 | 外观/信任判定工具 | `$ot/M9/est/N9/tst/P9/nst/F9/I9`（app: 协议/渲染 URL/信任 sender 判定，`ELECTRON_RENDERER_URL`、Mot=localhost:5175）；`rst/ist/ast/ost/sst/L9/cst/R9/z9`（4K 背板、opaque surface、模糊失焦、windowZoom 外观矩阵） |
| 174,120-174,388 | 应用 | **windowServices 工厂 `dst`** | 图标解析（resourcesPath/repoRoot icons、`ST(r)` flavor→图标名、Windows `TT`/Linux `wT`）、dock 图标偏好 `n.iu.DOCK_ICON_PREFERENCE`、windowIconPath、`lst=2e3`；Ust 175,963 调用产出 `W` |
| 174,388-174,903 | 应用 | **worker 宿主群** | `fst=3e4`；`pst` 30s 调用采样器；`mst` ces-telemetry POST（`n.mt(r)`）；`hst`（174,414）Sentry transport（经 `a.tn()`）；`yst` schema；**`bst`（174,452）worker RPC 会话基类**（sentryRpcSessions WeakMap、mainRpc）；**`H9`（174,709）worker-manager**：ensureWorker→**`new B.Worker(__dirname/worker.js)`（174,564）**、MessageChannel 双通道、`a.gn` maxLogLevel、flush-and-exit（git 11s 等待 `a.T()`） |
| 174,903-175,119 | 应用 | **worker-bus 装配 `xst`** | git worker（hostOnly/singleRecipient 事件路由 + `pst` 采样）、open-in worker（`read-shortcut-link` 缓存）、computer-use worker 按需（started→analytics 回执）、`setGitWorkerTracingSampleRate`、sentry user 分发、appEvent 总线 `fe`(R1)；Ust 176,053 调用产出 `Se` |
| 175,119-175,310 | 应用 | 工作区策略重启 + 原生状态项状态 | `Sst/Cst/wst` 判定、`U9` 文案、**`Tst`（175,139）工作区策略变更→重启提示**（account/login/updated 钩子）、`Est` 对话框+`a7` 重启；`Dst/Ost` computer-history 范围映射；**`kst`（175,196）原生状态项状态/动作装配**（statusItemMenuState、chronicle 控制、service pid） |
| 175,310-175,503 | 应用 | 原生状态项管理器 | `Ast`（175,310）Windows AUMID GUID per flavor（Nightly/InternalAlpha/PublicBeta/Prod 常量直接证据）；`jst`（175,325）原生菜单消息 schema（menu-update/open/close/quit/open-thread/computer-use/*、computer-history/*、service-state-changed）；**`Mst`（175,359-175,503）原生菜单栏状态项管理器**（native addon，经 `kst` 提供的回调） |
| 175,503-175,817 | 应用 | **托盘子系统** | 顶层状态 `W9=16/G9/K9/q9/J9/Y9/Nst`（175,497-175,503）；`X9`（175,504）getTrayController、`Z9`（175,507）canHideLastWindowToTray（`Y9 && G9?.isReady()`）、**`Pst`（175,510-175,589）托盘工厂**（macOS→`Mst`，win/linux→`new l.Tray`(175,549)+`prt`+win32 深浅色图标切换）、`Q9`（175,590）will-quit 销毁、`Fst/$9` 图标解析、`bT/xT/ST` 图标名、`Ist`（175,634）更新退出分流、`Lst`（175,646）computer-use worker 主 RPC 处理器、`Rst` html 扩展名集合、**`zst`（175,659-175,816）打开路径→项目**（消费 open-path-queue `t.r/t.i/t.t`）、`Bst`（175,817）扩展名去重 |
| 175,820-175,822 | 应用 | 启动常量 | `Vst='CODEX_ELECTRON_REMOTE_HOSTED_PIP_PROCESS_IDENTIFIER'`、`Hst=3e4`（app-server 慢启动阈值） |
| 175,822-176,953 | 应用 | **`Ust` runMainAppStartup** | 唯一关键导出；完整启动时序见 §3.9 |
| 176,954-176,977 | 应用 | `Wst` 更新即时退出清理 | markAppQuitting→`hrt()`（杀子进程树）→runCleanupBeforeImmediateExit→destroy 全部窗口→`l.app.exit(0)` |
| 176,978 | 应用 | 导出表 | `exports.n=TV`、`exports.runMainAppStartup=Ust`、`exports.t=URe`（后两者定义于 R6 区 92,249/92,380） |

---

## 2. vendored 识别

| 包 | 行区间 | 证据 | 置信度 |
|---|---|---|---|
| **string-width 族**（is-fullwidth-code-point `Mat` 168,048、picocolors 风格 ansi 表 `u9` 168,082、ansi 构造 `Fat/d9` 168,139/168,210、slice-ansi `h9/zat/Bat/Lat/Rat` 168,235-168,496、emoji regex `Gat` 168,642、string-width `g9` 168,646（Intl.Segmenter + ambiguousIsNarrow/countAnsiEscapeCodes）、cli-truncate `Jat` 168,686（position/space/preferTruncationOnSpace）） | 168,048-168,717 | API 形态逐一对应；唯一应用消费点 172,357 `Jat(t,25)`（electron-context-menu 选中文字截断） | 高 |
| **mime-db**（第二份完整副本，惰性 `e.r/e.n`） | 168,834-171,940 | `application/1d-interleaved-parityfec`(168,838)…`video/x-flv`(171,900) 全量 IANA 表；与 bootstrap 434-3,317 那份独立 | 高 |
| **is-plain-obj / sort-keys / sort-keys-length** | 171,942-171,988 | `t.exports.desc/asc`、Expected a plain object | 高 |
| **electron-dl**（will-download 管理器 `mot` + `x9` downloadURL） | 172,009-172,093 | showBadge/showProgressBar/saveAs/overwrite/openFolderWhenDone/unregisterWhenDone、`app.dock.downloadFinished`、`Qat` 唯一文件名（168,741） | 高（形态为 electron-dl v3 的 fork/内联版） |
| **electron-context-menu**（+ electron-is-dev） | 172,094-172,419 | 172,094 `Not running in an Electron environment!`（包首行惯用守卫）、`ELECTRON_IS_DEV`、learnSpelling/lookUpSelection/searchWithGoogle、`Cannot use electron-context-menu in the renderer process!`(172,376) | 高 |

注意：
- 粗扫 §7 的「mime 变体 171,900-172,400」应扩为 **168,834-172,008**（mime-db + 排序工具 + 反查），加上 172,009-172,419（electron-dl + electron-context-menu）整个 168,048-172,419 都不派发重写。
- `uot`（171,989）扩展名反查是**应用侧粘合代码**（mime-db 的用法层），若引 npm mime-db/mime-types 可一并删除。
- 非 vendored 但依赖原生/动态库：`objc-js`（165,377 AXPaste、161,817 NSWorkspace 关机观察、166,631 NSHapticFeedbackManager，均动态 import）、node-pty（155,319 动态 require）、Windows updater addon（`a.ft`，161,795-161,811）、native status item addon（Mst）。

---

## 3. 子系统聚类与模块拆分方案

### 3.1 集成终端簇（`terminal-*`，155,039-156,075）
- `terminal-shell-resolution`（155,039-155,313）：`Att/jtt/h5/g5/_5/v5/y5/Ltt`（Windows shell 探测 + PowerShell GetConsoleProcessList）
- `terminal-pty`（155,315-155,385）：`Rtt/ztt`→`PtyProcess`（node-pty 包装、darwin 进程树 SIGKILL）
- `terminal-manager`（155,386-156,075）：`Wtt`→`IntegratedTerminalManager`（会话/attach/重启阻塞项）
- 消费：`ert` 构造器注入 `terminalManager` 字段。

### 3.2 线程目录/归档簇（`thread-catalog-*`，156,075-158,180）
- `thread-archive`（156,075-156,905）：`Xtt`→`ThreadArchiveService`
- `thread-catalog-sync`（156,905-157,620）：`dnt`→`ThreadCatalogSyncStore` + host 源 `M5/fnt`（local /conversations ChatGPT API）
- `thread-read-state`（157,621-158,896）：`I5/Dnt/Ont/Ant/jnt/knt`（identity 世代化未读状态 + `n.v` 跨端广播）；`Fnt`→`ContentTracingController`、`Rnt/znt`→`TriggerSubscriptionReader`（可拆 `content-tracing` 与 `trigger-subscriptions`）
- 注意：`Ant` 依赖 `n.v`（desktop client-coordination）、`n.mu`（协议版本）；`Ont` 读写 globalState `a.tt`/`a.et`/`a.J` 相关键。

### 3.3 WindowContext 簇（`window-context-*`，158,896-161,484）
- `window-context`（159,096-160,999）：`ert`→`WindowContext`。构造器 DI 面（~50 字段）：appServerConnectionRegistry(`cee`)、publishedStatsig(`a.H`)、settings、threadReadState、messageHandler、detachedWindowManager、contentTabServiceManager、sharedObjectRepository、fetchHandler/fetchWrapper、habitatAutomationsService、projectsManager、lsp、workspaceFiles、dictationAudio/History、terminalManager、conversationExecutor、primaryRuntimeService、artifactDocuments、computerUseSettings、threadCatalogSyncManager、keyboardModifierService(`X$e`)…（159,097-159,171 字段清单直接证据）
- `window-context-downloads`（158,896-159,047）：`Jnt`→`DownloadsViewPublisher`（detached views + `a.en()` RPC 上下文逐窗推送）
- `app-server-transport-selection`（161,000-161,073）：`K5`（VE/JEe/QDe/n.pn/hEe/n.dn 分派）——跨 R5 的连接层收口点
- `auth-recovery-dialog`（161,074-161,147）：`q5/nrt/rrt/irt`
- `window-context-factory`（161,148-161,356）：`art`——Ust 的第 6 道 gate；建议与 `window-context` 同模块或显式 `createDesktopAppContext`
- `native-context-menu`（161,357-161,483）：`crt`（`a.Vt` popup）+ `urt` MessagePort 通道

### 3.4 托盘/菜单簇（`tray-*` / `menu-*`，161,484-163,940）
- `tray-menu`（161,484-161,790）：`prt`→`TrayMenuManager` + `Q5/$5/e7`
- `app-exit-force`（161,790-161,858）：`hrt/n7/r7`（Windows 强杀）——建议并入 `update-exit`（Wst 消费）
- `mac-shutdown-observer`（161,812-161,841）：`_rt`（objc-js）
- `quit-guard`（162,191-162,478 + 164,396-164,420）：`Brt`（before-quit 对话框/flush）+ `yit` QuitState + 文案 `vrt..Nrt`
- `about-dialog`（162,397-162,670）：`Qrt/rit/$rt/eit/tit/m7/h7/nit` + 单例 `p7`
- `application-menu`（162,671-163,940）：`g7/iit/sit/cit/v7`——`sit`（~1,000 行）单独派发，依赖 `n.Ct/n.At/n.Mt/n.Ot/n.Nt/n.Ft/n.Pt`（keymap/命令表，shared chunk）
- `bootstrap-info-ipc`（162,144-162,190）：`zrt`——6 个同步频道，重写时与 bootstrap 频道表对齐
- `electron-message-handlers`（161,884-162,143，`Rrt`）：`a.Pt` run-command、`a.Mt/a.jt/a.It/a.Gt/a.Ot` 等 handle/on + `crt` 挂接；**这是渲染进程命令面**，单独成模块

### 3.5 deep link 簇（`deep-links`，163,940-164,396）
- `lit` 路由分发 + `uit/dit/fit/pit/mit/hit/git/b7` 各 kind + `_it` 管理器（registerProtocolClient/queueProcessArgs/flushPendingDeepLinks）。Ust 中 `Le = _it(...)`，`Le.deepLinks.*` 是唯一对外接口。

### 3.6 appshot/听写/snap/hotkey-window 簇（164,538-167,984）
- `appshot-hotkeys`（164,538-164,778）：`Ait/S7/Fit/C7`（含 pet 全局热键 `Fit`）
- `capture-image-validation`（164,892-164,954）：`Rit/zit/T7/Bit/Vit`（CUAService tmpdir + 25MB 上限）
- `windows-capture-bridge`（164,982-165,281）：`Wit` + schema `E7/D7/O7`
- `global-dictation`（165,282-166,455）：`$it` AXPaste、`nat/B7/rat/iat/V7/aat` 剪贴板指纹粘贴、`sat` 录音窗、生命周期管理器（hold/toggle 热键、transcript→paste）——约 1,100 行，单独派发
- `composer-snap`（166,455-166,638）：`hat` 引导窗 + `mat` data-URL + `gat` 触觉 + 几何 `pat/K7/q7`
- `hotkey-window`（166,638-167,984）：`_at` 运动模拟、`Sat`→`HotkeyWindowController`（home/thread 双窗 + 磁吸，消费 bootstrap 几何 `a.ot/a.at/a.ct/a.it/a.st/a.rt`）、`Eat`→`HotkeyWindowLifecycleManager`、`kat` 预热管理器、`jat` realtime voice 热键
- 死代码：164,854-164,891（§0.2），重写时删除

### 3.7 窗口管理簇（`window-manager-*`，172,419-174,120）
- `debug-source-registry`（172,419-172,645）：`xot/Sot`
- `url-trust`（172,646-172,684）：`E9/D9/wot/Tot/Eot/Dot`——`isTrustedIpcSender` 的判定核心，**安全敏感**，单独模块 + 测试
- `thread-metadata`（172,686-172,750）：`kot`
- `window-manager`（172,751-173,917）：`Qot`→`WindowManager`（主窗/分离窗/外观/缩放/消息路由 `a.At` chunked critical/恢复尝试）
- `window-appearance`（173,917-174,118）：`$ot..z9` 外观矩阵 + `est/P9/nst/F9` 信任判定
- `window-services-factory`（174,120-174,388）：`dst`（图标/dock/图标路径 + **内部创建 Qot/dst 的/avatarOverlay/hotkeyWindow/globalDictation/appshotHotkeys 全套窗口服务**，返回 `W`；Ust gate 5）

### 3.8 worker 簇（`worker-*`，174,388-175,119）
- `worker-host`（174,388-174,903）：`bst/H9`（`new B.Worker(worker.js)`、MessageChannel、flush-and-exit、sentry user、`a.gn` 日志级别）+ `hst` Sentry transport + `mst` ces-telemetry + `pst` 采样器
- `worker-bus`（174,903-175,119）：`xst`（git/open-in/computer-use 三 worker 路由 + appEvent 总线）——Ust 产出 `Se`；`Lst`（175,646）computer-use 主 RPC 处理器

### 3.9 启动编排簇（`startup-*`，175,119-176,978）
- `workspace-policy-restart`（175,119-175,195）：`Tst/Est/U9`
- `native-status-item`（175,196-175,503）：`kst/Ast/jst/Mst`（macOS 菜单栏状态项）
- `tray`（175,503-175,633）：`X9/Z9/Pst/Q9/Fst/$9`（§5.2）
- `update-exit`（175,634-175,645 + 176,954-176,977）：`Ist/Wst`（+ `Irt` 161,864、`n7/hrt` 161,799/161,792）
- `open-paths-to-projects`（175,646-175,819）：`zst/Bst/Rst`（消费 open-path-queue `t.*`）
- **`run-main-app-startup`（`Ust`，175,822-176,953）——本 chunk 唯一关键导出，逐段时序**：

| 段 | 行 | 内容 | gate |
|---|---|---|---|
| 0 | 175,823 | `DO()`（71,742：Windows `windows-account.node` addon 注册进 shared `n.in`）、`a.u(Z9)`（把 canHideLastWindowToTray 交给 bootstrap） | — |
| 1 | 175,824-175,859 | 解构 `a.x()` 装配单例 14 项（startedAtMs/applicationNetwork/buildFlavor/desktopSentry/errorReporter/datadogLogger/maxLogLevel/startupConfig/startupPolicies/sparkleManager/startupPhases/productionAppcastStateStore/setSparkleBridgeHandlers/setSecondInstanceArgsHandler）；`S/C/w/T/E/D` flavor 能力位；`A = r.a('startup')` + 计时器 `M()`；阶段聚合 `I = new n.Wr()`（+`Zoe/Qoe`） | — |
| 2 | 175,884-175,889 | `await l.app.whenReady()`；dev→react-devtools `Gce()` | **G1 Electron ready** |
| 3 | 175,887-175,889 | `a.fn(a.ln(__dirname), applicationNetwork)` 注册 app:// 协议 | **G2 协议** |
| 4 | 175,890-175,905 | shell 环境注入 `EDe()`（win 后台、其余 await；internal+darwin 顺带 bundled git `Oue`） | **G3 shell env** |
| 5 | 175,906-175,918 | `V = await a.O({moduleDir})` 运行时上下文（globalState/settingsStore/codexHome/executionCodexHome/repoRoot/desktopRoot/preloadPath）；`a.E(ee)` 采样率；数据迁移 `Ice/Fce`（R2 的 Pce 清单）；`_ue(codexHome)` 状态对账；`kr(Ar(...))` feature availability 初始化 | **G4 运行时上下文** |
| 6 | 175,919-175,920 | locale：`a.mn(repoRoot, localeOverride)` | — |
| 7 | 175,921-175,937 | remote-hosted PIP 控制器 `U = lue(...)`（`Vst` env 注入 service pid） | — |
| 8 | 175,938-175,962 | `oe = new foe()` chunkedMessageSender；入口回执队列 `ce/le/ue`；`de = new Foe(..., await au()?.readPending())`（R2 激活归因） | — |
| 9 | 175,963-175,987 | **`W = dst({...})` windowServices 全套**（windowManager/avatarOverlayManager/hotkeyWindowLifecycleManager/globalDictationLifecycleManager/appshotHotkeysService…；`canHideLastWindowToTray: Z9`） | **G5 窗口服务可建窗** |
| 10 | 176,022-176,043 | `moe()`（a.Ct ack）、`zrt()`（6 同步频道）、`a.Bt` nativeTheme 同步、nativeTheme.updated→backdrops+`a.Wt` 广播 | — |
| 11 | 176,044-176,052 | `ye = new yit()` QuitState；更新退出 `xe` | — |
| 12 | 176,053-176,061 | **`Se = xst({...})` worker-bus**（git/open-in/computer-use） | — |
| 13 | 176,070-176,105 | `delete process.env[as]`；`Oe = Hse(...)` dynamic-app-tools 管道；`Ae = Hte.start(...)` artifact session host（均容错为 null） | — |
| 14 | 176,107-176,152 | **`je = art({...})` WindowContext + ElectronMessageHandler**（~40 个 DI 参数，含 Se 的 worker 句柄、sparkleManager、avatarOverlayManager、quitState…） | **G6 应用上下文** |
| 15 | 176,160-176,165 | `K = je.getWindowContext()`；dynamic tools pipe path 接线 | — |
| 16 | 176,170-176,197 | sparkle 桥 `y({...})`（更新状态广播/安装请求→`xe`）；`Ne = Bce(...)` 更新恢复状态（globalState `a.J`） | — |
| 17 | 176,198-176,216 | `Pe()` 本地 app-server 连接；`Fe = Jse(...)` IAB feature；`m.registerCheck`；`Ie = Tst(...)` 工作区策略监视（内部通知/配置刷新钩子） | — |
| 18 | 176,217-176,260 | `q = K.getProjectsManager()`；**`Le = _it({...})` deepLinks + applicationMenuManager**（`Te = Le.refreshApplicationMenu`） | — |
| 19 | 176,261-176,303 | locale 变更→刷新菜单/dock `we`/托盘 `X9()`/PIP locale；browser-window-focus→refreshApplicationMenu；`Le.deepLinks.registerProtocolClient()`；`t.n(Cl(process.argv))`（open-path 队列初 flush） | **G7 协议客户端注册** |
| 20 | 176,304-176,345 | second-instance handler `b(...)`（queueProcessArgs/显示窗口 `Ve`） | — |
| 21 | 176,362-176,364 | darwin：`we = new ose(...)` dock 菜单控制器（R2） | — |
| 22 | 176,365-176,412 | **托盘**：`Ge`→`Pst`（win/linux 立即；darwin 经 `Ke` 由 IPC 懒创建，§5.2） | — |
| 23 | 176,413-176,427 | `qe = pie(...)` computer-use 活动（R2）；`Ee = qe.hasActiveTurn`；`ele(...)` 活动 tracker→PIP | — |
| 24 | 176,428-176,452 | `Je = Pc(...)` browser-use 呈现；`Noe`；`Ye = aoe(...)` chrome host cache watcher（R2） | — |
| 25 | 176,453-176,504 | **`Xe = ioe({...})` bundled plugins 编排器**（R2）；ssh 连接订阅→reconcileRemoteSshHost；darwin：`be = new Moe(...)` skysight recorder | — |
| 26 | 176,505-176,565 | darwin：`Toe(...)` canonical CU 服务同步；**`H = new Eoe(...)` managed computer-use**；internal：`Hce(...)` node-repl host 管道 | — |
| 27 | 176,566-176,569 | `Qe = new pne(...)` browser-use feature 桥（R2） | — |
| 28 | 176,570-176,617 | **`$e` feature availability 再分发器**（fan-in：菜单/插件/PIP/appshot/managed service/skysight 全部经此联动） | — |
| 29 | 176,618-176,658 | **`Rrt({...})` electron message handlers**（run-command `a.Pt` + context menu + ~20 个回调注入，含 setMacMenuBarEnabled `Ke`、getTrayController `X9`）；`new Cue(...).register()`（18,993 child-process-gone） | **G8 渲染命令面** |
| 30 | 176,671-176,693 | **`Brt({...})` 退出守卫接线**（before-quit 对话框/flush tracing `a.C`/git worker/context） | — |
| 31 | 176,694-176,705 | **`et = await W.ensureWindow()` 首窗**；`Be(et, !ze)`（START_IN_BACKGROUND 则 showInactive）；`de.handleInitialWindowVisible()` | **G9 首窗可见** |
| 32 | 176,706-176,757 | `K.applyCodexAppConfigFromDisk`；**`a.p({...})` sqlite 回填/打开 gate**（onBackfillWait→`x7` 进度窗；open→`Oit` 慢启动进度窗 + `tt.connect()` + `i.whenReady()`（applicationNetwork） + `De.enable()` sqlite 恢复；`shouldHandleError: a.d`）——**返回 false 则整个 Ust return** | **G10 app-server ready（可中止）** |
| 33 | 176,758-176,784 | `_.reach('host_ready')`；`tt.getUserSavedConfiguration()`→`p.resolve` + settingsStore.initialize + `Ie.checkForChanges`；`Zce(...)` 迁移 | — |
| 34 | 176,786-176,843 | 更新退出接线 `xe = ...`（win 打包→`n7()` 武装强杀；`Ne.saveForInstall`；`Ist`→`Wst`/quit）；win：`g.prepareWindowsUpdate`（fsmonitor stop） | — |
| 35 | 176,844-176,891 | `at = pae({...})` 自动化调度器（`Br` 以 first_content_visible 相位 gate 启动）；`Ite({...})`；`n.bi/n.yi` ambient 钩子 | — |
| 36 | 176,915-176,929 | `jte/Ast` feature availability 初始应用（变化才 `$e`）；`Le.refreshApplicationMenu()`；`await Xe.waitForPendingReconcile()`；`K.startConversationExecutor()`；`A.info('Host startup critical-path phases completed')`；`K.markPrimaryWindowContentReady(j)` | **G11 菜单/插件 reconcile** |
| 37 | 176,930-176,952 | 末窗 ensure；`_.reach('window_created')`；**`me = !0`**（窗口就绪标志，之前所有 `he/ge` 均空操作）；`nt()`；**`await Le.deepLinks.flushPendingDeepLinks()`**；`M('startup complete')` | **G12 deep link flush** |

### 3.10 其余小簇
- `quit-progress-windows`（164,421-164,537）：`x7/Oit/kit`（sqlite backfill/app-server 进度窗）
- `update-resume`：`Ne = Bce(...)`（176,167，写入 `a.J` 键）——定义在 R2 区
- `windows-package-identity`：`Ast` AUMID 表（175,310）

---

## 4. 顶层可变状态清单（模块级，运行时改写；行号核实）

| 名 | 行 | 语义 | 读/写方 | 证据 |
|---|---|---|---|---|
| `p7` | 162,396 | 关于对话框单例 BrowserWindow | 写 `Qrt`(162,454)；关窗清 null(162,459) | 高 |
| `t7` | 161,791 | Windows 强杀已武装标志 | `n7`(161,802) 写；读 161,800 | 高 |
| `W9` | 175,497 | linux 托盘图标尺寸 16（const 语义） | `Fst` 读 | 高 |
| `G9` | 175,498 | 托盘/原生状态项单例（prt 或 Mst 实例） | 写 `Pst`(175,525/175,539/175,569/175,579-175,582)、`Q9`(175,591)；读 `X9/Z9` | 高 |
| `K9` | 175,499 | 托盘创建 promise（防并发） | `Pst`(175,516/175,584-175,586) | 高 |
| `q9` | 175,500 | win32 深浅色图标监听卸载器 | `Pst`(175,562)/`Q9` | 高 |
| `J9` | 175,501 | 托盘已请求标志（Pst 入口置位） | `Pst`(175,512)/`Q9` | 高 |
| `Y9` | 175,502 | 托盘就绪标志 | `Pst`(175,539/175,582)/`Q9`/`Z9` 读 | 高 |
| `Nst` | 175,503 | will-quit 监听已挂标志（惰性 `l.app.on('will-quit', Q9)`） | `Pst`(175,515) | 高 |
| `d9` | 168,210 | vendored ansi 码表（const 语义） | string-width 族 | 高 |
| `xot` | 172,419 | debug 源 localStorage 键集合（const） | `Sot` | 高 |
| `Rst` | 175,658 | html 扩展名集合（const） | `zst` | 高 |
| （Ust 闭包内）`me/he/ge/xe/H/be/we/Te/Ee/nt` | 176,018+ | 启动期闭包状态（非模块级，但跨回调共享）：`me`=窗口就绪、`H`=managed CU 服务、`be`=skysight recorder、`we`=dock 菜单、`Te`=refreshApplicationMenu、`Ee`=hasActiveTurn | 多处 | 高 |

---

## 5. 顶层副作用序列（模块加载即执行）

### 5.1 全量枚举

区间列 0 非声明语句（`grep -nE '^[a-zA-Z_$!(]'` 排除声明/模板字符串行）中，真实模块加载期执行仅 4 条：

| 行 | 语句 | 判定 |
|---|---|---|
| 164,854-164,865 | `(w7('SkCu'), …, w7('long'))` | **纯算术、结果丢弃**——tree-shaking 残留，无副作用（§0.2） |
| 164,867-164,891 | `(r.i('computer-use-capture-native-bridge'), n.vf(…), n.wf(…))` | logger + zod schema 构造、结果丢弃——纯构造，无副作用 |
| 168,135 | `Object.keys(u9.modifier);` | vendored 内部，纯 |
| 172,094 | `if (typeof u.default == 'string') throw TypeError('Not running in an Electron environment!')` | vendored electron-context-menu 守卫：主进程下恒 false，不触发 |

其余列 0 命中均为函数/类声明或模板字符串内容（PowerShell 155,251-155,298、about/csp HTML 162,560+、`mat` data-URL 166,481）。**结论：本区间（155,000-176,978）模块加载期没有任何可观察副作用（无 Electron 接线、无 I/O、无定时器）。所有 Electron 副作用都在 Ust 调用链内。置信度：高（列 0 语句全集已枚举）。**

### 5.2 优先项一：175,549 `new l.Tray(...)` 执行时机（粗扫 §9.6）

调用链（逐行直接证据）：
```
Ust (175,822)
 └─ 176,412: (P || process.platform === 'linux') && Ge()      // win/linux：启动序列段 22
     └─ Ge (176,368-176,402) → await Pst({buildFlavor, repoRoot, settingsStore,
            onOpenMainWindow, onTrayMenuOpenNewThread/RecentThread/SendFeedback, ...kst(...)})
         └─ Pst (175,510)
             ├─ J9 = !0（请求标志）
             ├─ 惰性挂 l.app.on('will-quit', Q9)（Nst 守卫，175,515）
             ├─ darwin 且宿主提供 native 状态项回调（kst 装配的 getNativeStatusItemState 等）
             │    → G9 = new Mst(...)（原生菜单栏状态项，非 Tray）        // 175,525-175,539
             └─ 其他平台 → Fst(flavor, repoRoot) 解析图标（175,548）
                  → r = new l.Tray(n.defaultIcon, win32打包? Ast(flavor) guid)  // 175,549
                  → new prt(r, ...4 个回调, a.hn(), app.getName())          // 175,569
                  → waitForReady 失败则销毁并返回 null（175,580-175,582）
```
- **Windows/Linux**：Ust 段 22 同步触发（在 deep link 协议注册 G7 之后、bundled plugins 之前）。
- **macOS**：`Ge` 不在启动时调；`Ke`（176,403-176,411）经 Rrt 注入为 `setMacMenuBarEnabled`（176,650），由渲染 IPC 触发：`true`→`Ge()`（创建 Mst 原生状态项），`false`→`Q9()`（销毁）。darwin 下普通 `l.Tray` 分支实际不可达（被 native 状态项分支拦截）。
- **销毁**：`Q9`（175,590）在 will-quit 时清 J9/Y9/q9/G9。
- 附带确认：`Z9`（canHideLastWindowToTray）在 Ust 第 0 段即交给 bootstrap（`a.u(Z9)`，175,823），并被 `dst` 接收（175,980）——关闭最后一窗到托盘的判定依赖托盘是否 ready。

### 5.3 优先项二：164,854 `w7('SkCu')`（粗扫 §9.5）
见 §0.2/§5.1——**无可观察副作用，纯打包残留，重写时直接删除**（`w7` fourCharCode 若无处引用可一并删；`Iit/Lit` 等 164,853-164,866 邻近常量服务于截图校验簇，保留）。

---

## 6. 跨 chunk 依赖

### 6.1 @chunk/shared（`n.*`）
- **EventEmitter 基类 `n.Uf`**：本区间 8 个类直接继承（`Mtt/Xtt/I5/jnt/Fnt/Rnt/kot/hst`）
- **zod 实例族**：`n.wf/Of/Cf/gf/bf/hf/jf/df/vf/Nf/if/Mf`（schema 数十处：j5/unt/Frt/yst/jst/E7/D7/O7/Hit/Uit…）
- **disposables `n.Wr`**：Ust 阶段聚合 `I`、Ant、Brt 等
- **globalState 键 `n.iu.*`**：SIDEBAR_THREAD_METADATA（kot）、DOCK_ICON_PREFERENCE（dst）
- **连接/传输**：`n.dn`（stdio transport）、`n.pn`（ws transport）、`n.Es`（本地判定）、`n.Jr`（归档）、`n.Cs/n.mn`（cloud ws）、`n.Os`（ssh hostConfig）、`n.sn`（authStatus 重试）、`n.ln`（host key）、`n.J/n.$u`（thread id）、`n.pa`（sourceKinds）
- **keymap/命令表**：`n.Ct()`（keymapState）、`n.At()`（命令 accelerators）、`n.Mt/n.Ot/n.Nt/n.Ft/n.Pt`（命令定义/可见性/浏览器可覆盖集）
- **其他**：`n.Oi()` codexHome、`n.Ar()`（活跃会话）、`n.H`（git fsmonitor，176,837）、`n.bi/n.yi`（ambient/usage 钩子）、`n.mu`（协议版本）、`n.v`（client-coordination）、`n.mt(r)`（ces 上报 URL）、`n.Wf`、`n.nn`（进程树）、`n.Bi`（win env）、`n.ws/ks`（remote-control/wsl 判定）、`n.Ro`（flavor 显示名）、`n.Gl`（CODEX_CLI_PATH env 键）、`n.Sn`（runtime paths）、`n.zo`（错误包装）

### 6.2 logger chunk（`r.*`）
具名 logger 19 个（直接证据）：`WindowContext`(2)、`ThreadArchiveService`、`thread-read-state`、`cron-turn-read-state`、`sparkle`、`codex-deep-link-navigation`、`mac-system-shutdown`、`window-manager`、`worker-manager`(2)、`worker-bus-message-handler`、`hotkey-window-controller`、`composer-snap-haptics`、`composer-snap-guides`、`ThreadMetadataService`、`ThreadTurnSummaryService`、`ThreadMetadataGenerationService`、`computer-use-capture-native-bridge`、`windows-capture-native-bridge`；另 `r.a('startup')`（175,852，Ust 专用 logger）与 `r.n()` 根 logger（散布）。

### 6.3 bootstrap chunk（`a.*`）——128 导出在本区间的消费清单

统计口径：区间内 `a.<member>` 全量 tally（140 种）剔除非导出名与 3 处局部遮蔽假阳性（`a.x`@155,036/167,974、`a.y`@155,036/167,975 为局部 rect 对象）。**共 78 个不同成员、约 140 处真实消费**（全部行号逐一核对上下文，遮蔽甄别完成）。按消费频次：

| 成员 | 次数 | 语义（依上下文/bootstrap 表） | 代表行 |
|---|---|---|---|
| `a.in` | 35 | buildFlavor 模型（resolve/Dev/Agent/Nightly/InternalAlpha/PublicBeta/Prod/isInternal/shouldIncludeSparkle/shouldIncludeUpdater/allowDevtools/allowDebugMenu/getWindowsDistributionFlavor） | 175,844-176,088 |
| `a.hn` | 10 | nativeIntl（formatMessage） | 175,928 等 |
| `a.en` | 8 | RPC 调用上下文工厂（`t.u/t.e/t.d`） | 158,968、175,169 |
| `a.tt` | 5 | globalState 键：thread-read-state 未读 | 157,952-158,164 |
| `a.rn` | 4 | bundleIdentifier(flavor) | 159,725、160,864 |
| `a.Zt` | 3 | 共享常量对象（desktopTraceSampleRate 等） | 162,150、174,457 |
| `a.Tt` | 3 | desktopOriginator（clientInfo.name） | 160,784、161,286 |
| `a.J` | 3 | globalState 键：更新恢复状态 | 158,149、176,168 |
| `a.At` | 3 | chunked-message IPC 频道（critical 消息） | 173,048、173,062 |
| `a.q` | 3 | globalState 键：macOS 推送注销 token | 161,292-161,313 |
| `a.x()` | 1 | **装配单例 getter**（Ust 头部解构 14 项） | 175,839 |
| `a.O` | 1 | 运行时上下文工厂（globalState/settingsStore/paths） | 175,906 |
| `a.u` | 1 | bootstrap setter（canHideLastWindowToTray 回填） | 175,823 |
| `a.fn`/`a.ln` | 1/1 | app:// 协议注册/模块根 | 175,888 |
| `a.mn` | 2 | locale 加载（repoRoot, locale） | 175,920、176,267 |
| `a.ft` | 2 | Windows updater addon 加载器（killProcessDescendants/armTerminate） | 161,795-161,799 |
| `a.E`/`a.S`/`a.D`/`a.C` | 2/2/1/2 | 内容追踪：设采样率/导出批次/注册回调/flush | 158,568-158,572、176,685 |
| `a.p`/`a.d` | 1/1 | sqlite 回填/打开 gate + 错误判定 | 176,714、176,754 |
| `a.Pt`/`a.Mt`/`a.jt`/`a.It`/`a.Gt`/`a.Ot`/`a.Rt`/`a.Ft`/`a.zt`/`a.Lt`/`a.Ht`/`a.Ut`/`a.Vt`/`a.Yt`/`a.Wt`/`a.Bt`/`a.Jt` | 各 1-2 | **IPC 频道族**（run-command、菜单动作、bootstrapInfo、sharedObject、sidebar、fileDrag、linkDrag、contextMenu、nativeTheme、worker 通道名 `a.Jt(workerId)`、每窗频道 `a.Yt(id)`） | 161,439-162,180、175,002、176,028 |
| `a.Kt`/`a.Et`/`a.wt`/`a.Tt` | 2/2/1/3 | desktopApiOptions（prod/dev API base、defaultServiceName、originator） | 161,242-161,286 |
| `a.y`/`a.i`/`a.s`/`a.k`/`a.A`/`a.l`/`a.m` | 1/1/1/1/1/1/1 | sparkle/更新桥（deep-link 处理器工厂、内部判定、更新检查、下载、安装、管理器 getter、release notes） | 161,885-161,955、164,297 |
| `a.H`/`a.$t`/`a.K`/`a.G`/`a.V`/`a.z` | 1/1/2/2/1/1 | WindowContext 装配类/globalState 键（statsig-state、appGlobalState 键族） | 159,232-160,355 |
| `a.nt`/`a.et` | 1/1 | 未读 zod schema / 键删除 | 158,150、158,177 |
| `a.nn` | 2 | buildNumber 统计（`.value`） | 159,588、164,370 |
| `a.xt`/`a.yt` | 1/1 | devicecheck URL / ChatGPT-Account-Id 头 | 159,730、161,036 |
| `a.ot`/`a.at`/`a.ct`/`a.it`/`a.st`/`a.rt` | 2/1/2/2/1/1 | **hotkey home 磁吸几何助手族** | 166,877-166,919 |
| `a.cn`/`a.dn`/`a.un` | 1/1/1 | webview URL 构造（mcpAppSandboxLocalDevelopment 选项）/URL 构造/srcURL 解析 | 173,528-173,805 |
| `a.tn`/`a.gn`/`a.T` | 1/1/1 | Sentry transport getter / maxLogLevel 解析 / git worker flush 谓词 | 174,416-174,549 |
| `a.an`/`a.Dt`/`a.w`/`a.St` | 1/1/1/1 | Windows 包身份解析 / windows 图标目录名 / 初始 trace 采样率 getter / appVersion | 175,545、174,255、162,150 |
| `a.A`/`a.C`…其余单次 | 各 1 | 见行号表 | — |

**未消费的 50 个导出**（128-78）本区间不出现（如 `a.$/a.B/a.N/a.P/a.Q/a.X/a._` 等）——它们在其他区域消费或已死。这是 bootstrap 兼容导出面的**最终验证数据点**：main chunk 尾部（启动收口区）是 bootstrap 导出的最重消费者，`a.in/a.hn/a.en/a.tt/a.in 族 + IPC 频道族 + 几何族`不可先行裁剪。

### 6.4 其他 chunk
- **open-path-queue `t.*`**（5 处，全在本区间！）：`t.r(isMacOS)`（175,660 支持判定）、`t.i(cb)`（175,809 取排队路径）、`t.t(cb)`（175,813 退订）、`t.n(argv)`（176,302 启动 flush、176,335 second-instance flush）——`zst` + Ust 是该 chunk 的**唯一消费区**
- **resources-path `o.t`**（7 处）：159,293/159,728/160,145/160,152/160,748/165,284/175,902（native addon/图标根解析）
- **main-shared `i.*`**：本区间**无真实消费**（`i.formatMessage` 等 8 处均为局部遮蔽；Ust 内 `i` 被 `applicationNetwork` 遮蔽——176,749 `i.whenReady()` 是 applicationNetwork）——与 R1-R2 结论一致
- **dist `s.*`**：未确认到真实消费（命中均为 `this.#s`/局部），置信度低，下游按需复核
- **desktop-service（CodexMicroService）**：不在头 8 个 require 中；`stopCodexMicro` 是 WindowContext 方法（160,545），经 `Lrt`（161,872，12s 超时包装）在退出路径调用（176,166/176,683）——**本区间与 desktop-service chunk 无直接依赖**

---

## 7. 拆分风险

### 7.1 Ust 启动时序的 gate 顺序（重写必须保序）
1. **G1-G4 严格串行**：whenReady → 协议注册（`a.fn`，渲染窗加载 app:// 的前提）→ shell env（mac/linux await，win 后台）→ `a.O` 运行时上下文。之后任何 globalState/settings 读取才合法。
2. **G5（windowServices）在 G6（WindowContext）之前**：`art` 的 DI 参数里包含 `W.avatarOverlayManager/W.hotkeyWindowLifecycleManager/W.globalDictationLifecycleManager/W.appshotHotkeysService`——windowServices 是 WindowContext 的上游。反向依赖仅一处：`ert` 构造器内的 `terminalManager` 等由 WindowContext 自建。
3. **G8（Rrt message handlers）必须在 G9（首窗）之前**——否则渲染进程加载后无命令面；G9 之后立即 `Be(et, !ze)` 显示。
4. **G10 可中止**：`a.p(...)` 返回 false 时 Ust 直接 `return`（176,756-176,757）——sqlite 回填被用户取消/错误路径下**整个启动放弃**，此时已注册的 ipcMain 监听、worker、托盘**不会清理**（进程随后退出）。重写时保留这一「泄漏即退出」语义，勿引入优雅清理死锁。
5. **`me` 标志**：G12 前所有 `he/ge`（ensureWindow/createFreshWindow）是空操作（176,018-176,020）——second-instance/托盘回调在启动完成前只排队 `ce`。任何把 `me = !0` 提前的重写都会让启动中窗口提前可创建，改变焦点竞争。
6. **两处 `L = Date.now()` 计时重置**贯穿 Ust（约 12 处），启动耗时上报 `j` 表与 `markPrimaryWindowContentReady({...j})`（176,928）是产品指标——保留 M() 语义。
7. **平台分叉**：托盘（win/linux 即时 vs darwin IPC 懒创建）、bundled git（internal+darwin）、managed CU/skysight（darwin）、windows 更新强杀（win+打包）——拆分时这些分支须留在启动编排层，不要下沉到各子系统。

### 7.2 WindowContext（ert）装配的依赖注入面
- 构造器 750 行、~50 字段、其内再 new 出 ~20 个服务（statsig `a.H`、`Y6e/p2/g8e/C8e/Lwe/p$e/P1e/L6e/BTe/uQe` 等跨区域类）——**这是全文件最大的 fan-in 点**。拆分建议：`window-context` 模块对外只暴露 `createWindowContext(options)`（即 `art` 的产物），字段注入用显式 options 对象逐项对齐，禁止隐式 import 圈。
- `art` 同时产出 `ElectronMessageHandler`（`je.getElectronMessageHandlerForWindow`）——两对象共享 `K = je.getWindowContext()`；Ust 中二者不可拆开创建（消息处理器持有上下文引用）。
- `K5` 传输选择被 `createAppServerConnection`（160,742）调用，依赖 R5 区的 `VE/JEe/QDe/hEe/kT`——跨区域契约，先锁 R5 导出再拆本区。

### 7.3 其他
1. **IPC 频道契约**：本区间注册/使用 17+ 个 bootstrap 频道（`a.Pt…a.Jt/a.Yt`）+ `a.Vt` context menu + `a.At` chunked critical。重写本区前必须完成 bootstrap 频道表（bootstrap-analysis §19,739-19,793）到这些符号的映射，否则频道名漂移。
2. **worker.js 是独立文件**（174,564 `__dirname/worker.js`）：main chunk 与 worker 的消息协议（`worker-main-rpc-request/cancel`、`worker-app-event`、`worker-git-turn-complete`、`worker-tracing-sample-rate-update`、`worker-flush-and-exit`，`gst/_st/vst` 白名单 174,425-174,450）是跨进程契约，须与 worker chunk 重写同步。
3. **名字冲突**：`Mst`（175,359 原生状态项）与 R2 区 `moe`（chunked sender 注册）风格无分界；`x9`（172,085 下载）与 Ust 内局部 `x`（startupConfig promise）；`a.tt/a.et/a.J/a.q/a.G/a.K/a.V/a.z`（globalState 键）与局部 `a` 遮蔽高发——建立压缩名→语义名对照后须逐处 grep。
4. **electron-dl / electron-context-menu 是 vendored**：直接引 npm 时注意本版 fork 了 `Qat` 唯一文件名与 `pot` mime 补扩展名逻辑（171,989-172,008 粘合层要保留）。
5. **`p7` 关于框单例**与 `Qrt` 的跨调用（菜单多处触发）是模块级状态；重写为类实例时挂在 applicationMenuManager 上。
6. **`zst`（open-paths→projects）** 是 open-path-queue chunk 的唯一消费者（`t.i/t.t/t.r`）；若移除 open-path-queue chunk，本函数是迁移点。
7. **死代码**：164,854-164,891 两条丢弃表达式，重写时删除（§5.3）。
8. **objc-js 三处动态 import**（161,817/165,377/166,631）失败均容错（warning + 降级）——重写保持 try/catch 语义，勿让 AppKit 缺失阻断启动。
9. **`yit` QuitState 的 60s 自复位**（164,404 unref 定时器）是更新安装窗口期的精确语义，勿改为永久标志。

---

## 8. 给下游派发的建议

- **优先派发**：`Ust` 启动编排（175,822-176,953 + 175,119-175,819 辅助）——它是所有模块的组装点，建议先写「启动时序集成测试骨架」再派各子系统；`ert`/`art`（§7.2）单列最大单体；`sit` 应用菜单（~1,000 行）与 `Qot` WindowManager（~1,100 行）各一个 agent。
- **不派发**：168,048-172,419 vendored 带（§2）——引 npm `string-width`/`cli-truncate`/`mime-db`/`electron-dl`/`electron-context-menu`，另写 ~20 行粘合（扩展名反查 + 唯一文件名）。
- **安全敏感单列**：`url-trust`（172,646-172,684 + 173,917-174,118 `est/P9/nst/F9`）——所有 ipcMain 入口的信任判定，配伪造 senderFrame 测试。
- **跨区域契约先行**：R5 传输类（K5 消费）、R2 的 `Foe/au/pie/ele/ioe/aoe/Moe/Eoe/Hse/Hte/lue/ose/moe/Hce`（Ust 段 8/13/21-26 消费）、bootstrap 频道表——派发 Ust 重写前先锁这三张契约。
