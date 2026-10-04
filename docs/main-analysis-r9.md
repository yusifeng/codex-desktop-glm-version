# main-C-Mhak1n.ts R9 深度分析（125,000-140,000 行）

目标：`src/main/main-C-Mhak1n.ts` 的 125,000-140,000 行（R9）。
来源：macOS ChatGPT.app（Codex 桌面版 v26.917.71314）主进程 chunk。
方法：与 `docs/main-analysis-coarse.md` / `docs/main-analysis-r1-r2.md` 同一方法论——200-400 行窗口采样 + 关键区域（类定义头、vendored 边界、顶层副作用语句）精读；所有行号经 `grep -n` 核实。多模式扫描一律 `-E 'a|b'`（ugrep BRE `\|` 陷阱）。置信度标注同前。

## 0. 总览与对粗扫的重要修正

1. **修正一（最重要）：vendored 区间比粗扫估计的大得多、且是两段**。粗扫认为 vscode-jsonrpc+LSP 是 129,984-135,000。实际：
   - **vendored 带 1（126,988-128,458）**：`once`+`wrappy`（126,988-127,124）、`pump`（m1e）、`get-stream`（h1e/g1e）、`fd-slicer`（v1e）、`yauzl`（b1e，127,581-128,183）、**`extract-zip`（x1e，128,186-128,277，`t.exports = async function` + `Out of bound path` 特征串直接证据）**——这是 language-server 安装器解压 zip 用的依赖链。粗扫完全漏掉这一段，把它当成应用代码。
   - **应用回插层（128,278-128,458）**：语言服务器运行时**资源清单**（pyright 1.1.413 / typescript-language-server 5.3.0 + typescript 5.9.3 / java / kotlin / rust-analyzer 2026-08-24 的 URL+sha256+sizeBytes 锁定表）——应用数据，非库。
   - **vendored 带 2（128,996-135,196）**：vscode-jsonrpc（128,996-131,960，`e.AbstractMessageWriter` 在 **130,025** 而非粗扫的 129,984——129,984 是 WriteableStreamMessageWriter 模块头）+ vscode-languageserver-protocol（131,961-135,179）+ **vscode-uri**（p$ 立即调用 135,195 + webpack IIFE 135,199-135,742，`var { URI: h$, Utils: k0e } = m$` 应用侧解构直接证据）。
2. **修正二：粗扫 §8 R9 行区间描述的「128,704 QQ hostPath」实为语言服务器命令信任解析基类**。`QQ`（128,704）是 `trustedPath/lookup/isFile` 的 LSP 命令探测基类（findTrustedCommand 的安全层：拒绝 workspace 外路径、拒绝含 `node_modules` 的路径），`hostPath` 是 host 的 path 模块（posix/win32）而非「host 路径」。
3. **修正三：粗扫 §9.5 的「135,000s 内容待确认」已确认**——135,195-135,742 是 vendored vscode-uri 的 webpack 打包 IIFE（模块 id 975 = posix path shim + URI 实现），135,743 起回到应用代码（Kotlin LSP 适配器尾巴 + language-server-manager 核心）。
4. **本区间有两个模块加载即执行的顶层副作用**（粗扫 §6 只点名了 139,940）：
   - **135,195-135,196**：`p$ = e.t(...)()` —— vscode-languageserver-protocol 的入口模块**立即调用**（尾部 `})(),` 直接证据），与应用侧 `p$.DefinitionRequest` 等直接引用一致；
   - **139,940**：`r.i('open-in-targets')` —— 创建后**丢弃**的顶层 logger（粗扫 §6 已点名；无任何效果，重写时可删）；
   - **139,947**：`g0 = c6e(process.platform)` —— 按当前平台展开 32 个 open-in 目标定义，模块加载即执行（纯数据推导，无 I/O，但 `detect` 闭包惰性）。
   除此之外（列 0 语句全集已用 `grep -nE '^[a-zA-Z_$][a-zA-Z0-9_$.]*\(|^r\.i\(|^r\.r\(|^\('` 枚举核实）**没有**模块加载期 Electron 事件接线、fs I/O 或定时器。137,164 的 `l.ipcMain.on(a.Nt,...)` 位于 `b2e()` 函数体内，172,841（启动区）才调用 `y2e()` → `b2e()`。**置信度：高**。

---

## 1. 区域地图（子区域 ≤1500 行）

| 行区间 | 类型 | 语义名 | 概述 |
|---|---|---|---|
| 125,000-125,122 | 应用 | （R8 尾巴）浏览器窗口总管方法 + 杂项 | `getPrimaryWindow/restoreShowAndFocusWindow/updatePowerSaveBlocker/setSystemFocusState/syncPowerSaveBlocker/sendCustomPrompts/sendAppServerResponseToView/sendSharedObjectUpdate/shouldUseWslPaths/getSettingsStore` + `iQ`（thread-browser-tabs-v1 键判定）+ `i$e`（win32 审批/elicitation 弹窗激活去重判定）——属于 R8 窗口总管类的方法尾部，本区间只取边界 |
| 125,123-125,188 | 应用 | **app-server 执行宿主注册表** | `a$e`：hosts Map + defaultHostId，`App server client for host ID ... not found` 报错（159,161 被 `new a$e()` 实例化）；`o$e` clipboard 图片 mime→扩展名表；`s$e` extends n.Uf：countFolderFiles/persistImageFileToTemp（codex-clipboard-*）；`c$e/l$e`：macOS startFileDrag 原生桥（sky addon `Vs` 惰性加载，`aQ` 顶层单例缓存） |
| 125,189-125,495 | 应用 | **workspace 文件服务** | `u$e=41943040`(40MB 缩略上限)/`d$e=512`(尺寸上限)/`f$e=16`(并发上限)/`oQ=5e3`(超时)；`p$e` extends n.Uf 大类：createDirectory/createTemporaryFile/downloadCopy/getDownloadsFolderIcon/getMetadata/#e native 缩略图（darwin `nativeImage.createThumbnailFromPath` + 远端 head -c + qlmanage 无关，docx/pdf/pptx/xlsx magic 校验，125,249-125,328）/read（text/blob/auto 表示）/saveCopy/write（etag 冲突检测）；helper `sQ`（.chatgptdownload 原子写 + chmod 保留）/`cQ/m$e/h$e/lQ/uQ/dQ/fQ/pQ/mQ`（路径解析：本地 realpath vs 远端 platformPath，`mQ` 处理 workspaceRoot 重新挂接） |
| 125,496-125,585 | 应用 | 文件拖拽服务 | `g$e` schema（hostId+path）；`_$e` extends n.Uf：prepareDrag（getFileIcon 预取）+ startDrag（origin.startDrag 或 fallback `c$e` 原生拖拽） |
| 125,541-125,683 | 应用 | **macOS 内建麦克风名探测（CoreAudio）** | 四字符常量表 `gQ/y$e/b$e/x$e/S$e/C$e/w$e/vQ/T$e/E$e/D$e/O$e`（`TQ(e)` 四字符码打包器直接证据）；`k$e` 类（logger `r.r('dictation-audio')`）：getBuiltInMicrophoneName；`A$e/j$e/bQ/xQ/SQ/CQ/wQ`：AudioObjectGetPropertyData 缓冲区协议；`M$e/N$e`：动态 `import('objc-js')` + CoreAudio framework 绑定，`yQ` 顶层单例缓存 |
| 125,684-126,047 | 应用 | **dictation 转写历史** | `P$e=20` 上限、`F$e='transcription-history.jsonl'`（全局转写历史，codexHome 下）；`EQ/L$e/DQ/R$e/OQ/kQ`：全局 JSONL 读写（原子写 + chmod 384）；`AQ='metadata.json'`、`z$e=/^(\d{10})\.chunk$/`、`B$e/V$e/H$e/U$e/jQ` zod schema；`W$e` 大类（#e Map + `r.r('dictation-history')`）：appendChunk（`.chunk` 硬链接原子里写 `#f`）/finalize/setTranscript/list/readAudio/download（G$e mime→扩展名）/delete/#a 启动恢复（recording→interrupted，全局历史回收）/`#o` 串行队列；`MQ` errno 判定 |
| 126,048-126,346 | 应用 | **cloud terminal（临时云终端）** | `K$e`：environment/info → 有效 cwd 探测；`NQ` 类：sessionPromise 包装的云 PTY 后端（StringDecoder、serializeWrites、写队列）；`q$e` 输出 schema；`J$e`：`command/exec` + `command/exec/write/terminate` + `command/exec/outputDelta` 通知多路复用（stty cols/rows + `bE()` 登录 shell 探测脚本（66,110 定义）、TERM=xterm-256color、1MiB outputBytesCap 上限，126,189-126,257 直接证据）；`Y$e` extends n.Uf：hotkeyWindowLifecycleManager 的 origin 门面（open/collapseToHome/transitionDone/homeDrag*）；`X$e` extends n.Uf：watchRelease（macOS 修饰键释放等待） |
| 126,347-126,754 | 应用 | **library files（文件库）** | `PQ = r.i('library-files')`；`Z$e`：generated_images 目录；`Q$e`：配置的 projectless 输出目录聚合（WSL 路径转换 `Vn`）；`$$e/e1e/FQ`：目录树扫描（realpath 反 symlink + `fH` 前缀包含判定）；`IQ` 路径归一；`LQ=8/RQ=3e4/zQ`(WeakMap)：projectless thread 存在性探测（readThread + 30s 负缓存）；`t1e` 类：appServerConnection+globalState+settingsStore 后端（THREAD_PROJECTLESS_OUTPUT_DIRECTORIES/THREAD_WORKSPACE_ROOT_HINTS/PROJECTLESS_THREAD_IDS/THREAD_PROJECT_ASSIGNMENTS 全局状态键 + `n.Fa.projectlessWorkspaceRoot` settings）；`BQ`：localThreadIds+workspaceRoots 装配；`r1e` 类：**打开白名单文件**（lstat+realpath 双校验、dev/ino/st_ino TOCTOU 防御、O_NOFOLLOW、mkdtemp 预览拷贝）；`i1e/a1e/o1e/s1e/c1e`：缩略图（qlmanage -t 5s 超时 + nativeImage fallback）；`l1e` extends n.Uf：LibraryFilesService 门面 |
| 126,755-126,951 | 应用 | **local environments + thread catalog 源授权** | `u1e` extends n.Uf：executionHostRegistry 的环境列表/读/写配置（`n.K/n.q/n.R` 透传）；`d1e` 大类：threadCatalogSyncManager + principal 的授权门面——`chatgpt:{accountId}:{userId}` 账号源 acquire/dispose lease、app-server population lease、`a.en()` span 包装、onRpcBroken 重置、[Symbol.dispose] 清理（159,938 被 `new d1e(...)` 实例化） |
| **126,988-127,124** | **vendored** | `once`+`wrappy` | `f1e`=wrappy（126,988）、`VQ`=once（127,014，`onceStrict` 特征直接证据） |
| **127,124-127,292** | **vendored** | `pump`+`fd-slicer` | `m1e`=pump（127,124）、`h1e`=get-stream buffer 模块（127,185）、`g1e`=get-stream（127,208，MaxBufferError 127,225）、`_1e`=fd-slicer queue（127,248，pending/max/listeners/hold 直接证据）、`v1e`=fd-slicer（127,292，createFromBuffer/createFromFd/FdSlicer） |
| **127,581-128,183** | **vendored** | **`yauzl`** | `b1e`（127,581）：open/fromFd/fromBuffer/validateFileName/dosDateTimeToDate/ZipFile（127,591-127,596 直接证据），127,582 require("zlib")，cp437 解码表 128,164 `☺☻♥♦♣♠...` 直接证据 |
| **128,186-128,277** | **vendored** | **`extract-zip`** | `x1e`（128,186）：`i.t()('extract-zip')` debug logger + Out of bound path 128,210 + __MACOSX/ 过滤 + symlink/externalFileAttributes 模式位直接证据；`S1e = e.a(x1e())` |
| 128,278-128,458 | 应用 | **语言服务器运行时资源锁定清单** | `C1e`（pyright 1.1.413 tgz sha256）、`w1e`（typescript-language-server 5.3.0 + typescript 5.9.3）、`T1e+E1e+D1e`（java-language-server 0.1.2 + 平台 config）、`HQ=9e5` 下载超时、`O1e`（kotlin-server 0.0.6 vsix，六平台 ~390MB，JetBrains CDN）、`k1e`（rust-analyzer 2026-08-24 六平台 gz/zip）——全部 URL+sha256+sizeBytes 锁定（直接证据 128,281-128,458） |
| 128,459-128,703 | 应用 | **language-server runtime 安装器** | `A1e`：runtime spec 工厂（python/typescript/java/kotlin/rust → expectedPaths+version）；`j1e = r.i('language-server-runtime-installer')`、`M1e=3e5` 下载超时、`N1e` runtime.json schema；`P1e` 类：cacheRoot（默认 `~/.cache/codex-runtimes/language-servers`）、getRuntimeRoot（in-flight 去重 + 失败回退 getCachedRuntimeRoot）、markRuntimeExpired、install（`.{id}-install-{uuid}` 临时目录 → runtime.json → expectedPaths 校验 → `.previous-{uuid}` 备份交换）；`F1e`：单资源下载+解压（gzip 流 / zip 经 `S1e` / tar 经 `yRe`(91,824 lR 系) + chmod 493）；`I1e`：fetch + sha256+sizeBytes 流式校验（AbortSignal.timeout）；`L1e/UQ/WQ/GQ`：runtime.json 校验 helpers；`R1e/KQ/qQ/JQ/z1e/YQ`：本地 runtime 根解析（isLocal + 平台家族匹配 + `o.t` resources 路径 → `n.Ln` node 路径） |
| 128,704-128,995 | 应用 | **LSP 命令信任解析（QQ 基类）+ java provider** | `B1e=1e4`、`V1e=1048576`（node 脚本 1MiB 上限）、`XQ='__CODEX_LANGUAGE_SERVER__='`（/bin/sh -lc command -v 输出哨兵前缀）；`ZQ`：按平台家族选 `U1e`(windows)/`H1e`(unix)；**`QQ` 基类**：trustedPath（绝对路径 + 非 node_modules + workspace 内/外二分）、lookup（codexHome cwd spawn 64KiB cap）、isFile；`H1e`：`/bin/sh -lc` + printf 哨兵 findTrustedCommand、getNodeModuleLaunchCommand（shebang `#!.*node` + 1MiB 上限）、getDirectLaunchCommand（非本地经 `exec "$@"`）；`U1e`：where.exe + .bat/.cmd 特判；`W1e`（java workspaceConfiguration）、`G1e`（平台 config 目录）、`K1e=1e4/$Q=262144`、`q1e` 类（jdtls provider：equinox launcher jar + config.ini + `--add-opens` 参数组 + `X1e` java>=21 版本探测）、`J1e/Y1e`（java/python3 陪跑命令构造）、`X1e`：java -version ≥21 |
| **128,996-131,960** | **vendored** | **vscode-jsonrpc** | `e$`=is（128,996）、`t$`=messages（129,028）、`n$`=vscode-ws-jsonrpc 的 socket（129,258）、`Z1e/r$`=utils.timer/console（129,509/129,519）、`i$`=events Emitter（129,535，**shared 的 `i.Emitter` 消费方**）、`a$`= cancellation（129,626）、`Q1e`=ral（129,692）、`o$`=encoding（129,751，applicationJson）、`$1e`=messageReader（129,794，129,849 `e.AbstractMessageReader`）、`e0e`=messageWriter（129,982，**130,025 `e.AbstractMessageWriter`**）、`t0e`=（130,082）、`n0e`（130,196）、`s$`=connection（131,158，131,156 `e.createMessageConnection`）、`r0e`=（131,595，131,891 `vscode-jsonrpc-${e}-sock` win32 管道名直接证据）、`c$`=main（131,737，131,964 `e.createMessageConnection = S`） |
| **131,961-131,968** | **vendored** | jsonrpc main 的 CJS 出口 | `l$ = e.t((e,t) => { t.exports = c$(); })`（131,966）——`x$ = l$()` 在 135,968 被应用侧解出 |
| **131,969-135,179** | **vendored** | **vscode-languageserver-protocol** | `u$`=vscode-languageserver-textdocument（131,969，975-模块式 AMD 包装，InlayHint/SemanticTokens/TextDocument 导出列表 131,977-131,986 直接证据）；`d$`=protocol registration（133,496，ProtocolRequestType）；`f$`=is（133,538）；`i0e`~`w0e`=lsp 各命名空间（133,587-134,177，约 30 个 e.t 模块：a0e/o0e/s0e/c0e/l0e/u0e/d0e/f0e/p0e/m0e/h0e/g0e/_0e/v0e/y0e/b0e/x0e/S0e/C0e/w0e/T0e）；`E0e`=protocol3.16（135,103）；`D0e`=protocol（135,114）；`O0e`=main createProtocolConnection（135,162，__exportStar 打包直接证据）；`p$ = e.t(...)()`（135,195，**立即调用**） |
| **135,199-135,742** | **vendored** | **vscode-uri**（webpack IIFE） | `(() => { "use strict"; var e = { 975: (e) => {...posix path shim...} }`（135,199-135,203 直接证据），`m$ = r`（135,741），`})();`（135,742）；`var { URI: h$, Utils: k0e } = m$`（135,743 应用侧解构） |
| 135,743-135,966 | 应用 | **Kotlin LSP 适配器** | `A0e=3e4` 请求超时；`g$` 重试方法表（Definition/Hover/Implementation/References/TypeDefinition）；`j0e`：capabilities→{hover, locationKinds}；`_$`：请求包装（30s 超时 + ContentModified 一次性重试）；`M0e/v$/y$/N0e/P0e/b$`：LSP 位置/文件 URI↔host path 转换 + hover 内容 markdown 解析；`F0e` 类（id=`kotlin-lsp`，downloadedExecutablePaths 记账、classifyProcessExit code===7 → `expired-build`、findSessionOptions 写 workspace.json）；`I0e`：Kotlin workspace JSON 生成 |
| 135,968-136,470 | 应用 | **language-server-manager 核心** | `x$ = l$()`（jsonrpc 实例）；`L0e=12e4` 空闲关停、`R0e=1e3` 退出等待；`z0e` 类：**LSP 会话**（connection+process+hostPath+capabilities，didOpen/didChange/didClose 文档同步、documentRequests 串行队列、scheduleIdleShutdown、stop({reason: idle_timeout/process_exit/disposed})）；`B0e`：**会话启动器**（findCommand → findSessionOptions/findInitializationOptions → host.spawn → `p$.createProtocolConnection(StreamMessageReader, StreamMessageWriter)`（136,089-136,091 直接证据）→ ConfigurationRequest/WorkspaceFolders/Registration/ApplyWorkspaceEdit（`The Codex file viewer is read-only`）→ initialize → initialized → 初始化失败分类）；`V0e/H0e`：退出码竞争/stderr 排空；`U0e` kind→method 表；**`W0e` 类（logger `r.i('language-server-manager')`，136,181）**：sessions Map（key=`hostId\0providerId\0workspaceRoot`）、getSession/startSession（expired-build → markLocalRuntimeExpired → 重启一次）、capabilities/hover/locations/dispose；provider 类：`Z0e`（typescript-language-server）、`G0e`（pyright，PATH 白名单 env）、`S$`（rust-analyzer 配置禁表）、`q0e`（rust-analyzer，rustc --print sysroot 探测 `J0e`）、`Y0e`（sourcekit-lsp，macOS xcrun）、`K1e/X0e`（X0e 即 sourcekit 类） |
| 136,472-136,716 | 应用 | **LSP 服务门面 + managed worktree 服务** | `Q0e` extends n.Uf：**LanguageServerService 门面**（providers 装配 [Z0e/G0e/q1e/F0e/q0e/X0e] + W0e；capabilities/locations/hover({hostId}) → findExecutionHost 委托；159,519 `new Q0e(...)`）；`$0e` extends n.Uf：**ManagedWorktreeService**（createForThread：pendingCreations Map 去重 + thread/attachment/add + setOwnerThread；removeFromThread：attachment/list 分页定位 + archiveAttachedWorktree；cleanupForArchivedThread：`pendingCreations` 等待后 handleArchiveCleanup；`threadAttachments` app-server 版本 feature gate `n.Wu`） |
| 136,717-137,052 | 应用 | **MCP app sandbox：guest 加固** | `D$='mcp_app_sandbox'`、`O$ = r.i('mcp-app-sandbox')`；`k$` 统一日志（initId/origin/ownerWebContentsId/sandboxId）；`t2e/n2e/r2e/i2e/A$/j$/M$/N$`：URL/协议判定（about:/blob:/data:/https:/wss:/devtools:/codex-sandbox:、localhost dev 放行）；`a2e`：**guest webContents 加固接线**（will-navigate/will-frame-navigate/will-redirect 拦截、did-frame-navigate 首帧哨兵、did-fail-load、preload-error、render-process-gone、context-menu 仅 DevTools、setWindowOpenHandler 一律 deny、鼠标侧键/加速键 → navigateBack/Forward `r.getAccelerators/r.run`）；`P$='web-sandbox.oaiusercontent.com'`、`F$`（dev 环境 CODEX_MCP_APP_SANDBOX_URL）、`I$='/mcp-app.html'`、`o2e=8` 资产预热上限、`s2e` 资产路径正则；`L$` Map：**shell 预热状态**（warming/warm + 刷新）；`c2e/l2e/u2e/R$/z$/B$/V$`：skybridge 协议取数（`l.net.fetch` force-cache + `n.as(url,{requireSkybridge})` + 资产预抓） |
| 137,053-137,160 | 应用 | sandbox：UA/语言头伪装 + 全局 webRequest 钩子 | `d2e`（Chrome 版本号正则）、`f2e`（剔除 Electron/应用名产品 token）、`p2e/m2e/H$/U$`：Accept-Language/sec-ch-ua/sec-ch-ua-platform 头改写；`W$` 全局只装一次标志、`G$` WeakSet（session 幂等）；`h2e()`：defaultSession.webRequest.onBeforeSendHeaders（codex-sandbox/asset URL → UA 改写）；`g2e`：**per-session 加固装配**（protocol.handle(`n.$o` codex-sandbox) → 缓存回放、setPermissionRequestHandler/CheckHandler（local-network- 前缀 sandboxId 特判 `K$` + 剪贴板写需 `E$` 用户手势）、will-download 一律 cancel、applicationNetwork.addSessionRestriction + webRequest.onBeforeSendHeaders UA 改写）；`q$()`：系统语言 q 值串 |
| 137,154-137,435 | 应用 | sandbox：attach 生命周期 | `_2e`（sandbox-preload.js 路径）、`v2e=3e4` attach 等待、`J$/Y$/X$`（ipcMain 只装一次标志 + guest 状态注册表 + attach 挂起注册表）；`y2e()`：h2e + b2e（启动入口，172,841 调用）；`b2e()`：**ipcMain.on(a.Nt) guest init 校验**（unknown_guest/origin_mismatch/init_id_mismatch/port_count_mismatch/owner_destroyed → postMessage(a.kt) 转交 owner，频道名 `codex_desktop:mcp-app-sandbox-guest-message`/`-host-message` 见 bootstrap 19,745-19,746 直接证据）；`x2e` init 消息校验；`Z$`：owner+sandboxId+initId → guest webContents 查找；**`S2e`**：will-attach-webview/did-attach-webview 钩子（partition 校验 `n.is`/sandboxId `n.cs`/initId `n.ns`/persist: 限制 `connection-[a-f0-9]{48}`/session.fromPartition + g2e + C2e 挂起注册 + webPreferences 锁死 sandbox:true/nodeIntegration:false 等）；`C2e/w2e/Q$/$$/T2e`：attach 30s 过期账本；`e1/E2e/D2e`（D2e extends n.Uf：clearData 清 `n.Qo` 持久分区 + connection-* 分区、consumeUserGesture `E$` 手势消费） |
| 137,436-137,782 | 应用 | **原生命令崩溃归因（Sentry）** | `O2e` item/completed schema（commandExecution：status inProgress/completed/failed/declined，source agent/userShell/unifiedExec*）；`k2e` 退出码→信号表（-4 SIGILL…139 SIGSEGV）、`A2e` 输出正则归因；`t1` env 赋值哨兵正则；`j2e=2e3` metadata 超时；`M2e`：**registerInternalNotificationHandler 工厂**（159,583 消费，dedupeKey 去重）；`P2e/I2e/L2e/R2e/z2e/n1/r1/i1/B2e`：**shell 语法切分器**（r1：引号/续行/;/|/& 分隔 → n1 `n.er` 再切 → B2e 可执行名归一 python/node/git/pdfinfo/pdftoppm/soffice）+ primary-runtime 路径归因（`fH` 前缀包含判定）；`F2e`：captureMessage('Native command crashed')（component: codex-execution） |
| 137,783-138,213 | 应用 | **desktop-session 浏览器探测（probe）** | `G2e/o1/K2e/q2e/s1/c1/J2e` 路径常量；`l1 = n.cu.allowDebugMenu('prod')`；`Y2e` 回调参数白名单；`Z2e/Q2e/$2e` schema；**`e4e` extends n.Uf：BrowserSessionProbe**（getLookupEligibility（macOS+arm64+浏览器可见窗口+deviceCheck）、probe(securityLevel high|low)：127.0.0.1 随机端口 http 回调 server + `a4e` PKCE + `r4e` challenge（deviceCheck token）→ shell.openExternal({activate:false}) → sourceWindow setAlwaysOnTop 抢回焦点 + `U2e` 50ms 轮询焦点回拉 → i4e code 兑换 profile）；`u1` debug log（prod 关闭）；`t4e` 回调 URL 校验（/browser-session 路径 + 单值参数）；`n4e/d1/f1/p1`：query 参数解析/avatar https 校验；`H2e/W2e`：sky addon getDefaultWebBrowserState（`a1` 顶层单例缓存，135,968 区同模式） |
| 138,215-138,470 | 应用 | **open-in 目标模型 + 自定义处理器** | `m1`：扩展名→macOS bundleId 表（Preview/QuickTime/Archive Utility/Sketch/Figma/Photoshop/Word/Excel/…直接证据 138,232-138,285）；`c4e` html 扩展名集；`l4e` bundleId 查找；`h1/g1/u4e/_1`：macOS/非 macOS 平台文件判定；`d4e/v1`：目标决策（fileManager/systemDefault 回退）；`f4e`：ssh hostConfig schema；`p4e/y1/b1/x1/S1/C1/m4e/h4e/w1/g4e`：远程 host 显示名/端口解析（b1 读 `n.cn` hostConfig 键）；`T1/E1/D1`：host 平台过滤（remote-control → win32 fileManager、ssh → supportsSsh）；`_4e='apps/'`、`O1` apps 路径补 `/`；`v4e='app://fs'+y4e='/@fs'`、`b4e='apps/vscode.png'` 默认图标；`x4e` 自定义 handler id 正则；**`k1 = r.i('open-in-targets')`（138,418）**；`S4e/C4e`：customFileHandlers schema（path/json_argument/json_stdin 三种输入 → `Zi` spawn）；`w4e/T4e/E4e/D4e/O4e/k4e/A1`：图标解析（file: URL/apps:/data:image/app://fs 编码） |
| 138,522-138,900 | 应用 | **open-in 目标构造工厂** | `j1='/Applications'`、`M1=~/Applications`、`N1` 两目录；`P1` 双目录展开；`F1/I1/L1`：.app 探测（appName 前缀模糊匹配）；`R1`：`--goto path:line:col`；`z1/A4e/B1`：**VS Code remote open**（`ssh-remote+{alias}` authority + vscode-remote:// URI）；`V1/H1/U1`：目标定义工厂（per-platform label/icon/detect/args/env/open/supportsSsh）；`K1`：remote → z1，否则 --goto；`G1`：linux .desktop → gio launch；`W1/lO(71,373)`：PATH/桌面文件查找；`j4e`（Antigravity）、`N4e`（BBEdit）、**`F4e`（terminal）**：`q1` 通用终端工厂（darwin open -a + linux commandNames 探测 + `J1` 每终端 --working-directory 参数矩阵（kitty/ghostty/konsole/alacritty/gnome-terminal/x-terminal-emulator）+ `L4e` EDITOR 集成（e0()=R4e VISUAL/EDITOR/nvim/vim/nano/less 探测））；win32 wt.exe/`$1` cmd start；`V4e/aa`：win32 PATH 修正 |
| 138,902-139,940 | 应用 | **open-in 目标清单（32 个）** | `q4e/Y4e`（vscode/cursor）、`H4e/U4e`：JSON 参数与转义、`Q4e`（devin）、`r0`（emacs +line:col）、`$4e`（emacs）、`M3e`（jetbrains 家族：IntelliJ/PyCharm/WebStorm/CLion/GoLand/RubyMine/Android Studio/RustRover，JetBrains Toolbox scripts 目录探测 139,453）、`n6e`（sublime）、`s3e`（githubDesktop）、`F3e`（systemDefault 平台默认查看器）、`e3e`（fileManager：Finder/File Explorer/file-manager，`Xi`(4,894) reveal 参数、`i0` showItemInFolder/openPath、`n3e` 最近存在祖先）、`i3e`（gitBash）、`l3e`（iterm2）、`A3e`（kitty）、`r3e`（ghostty）、`J3e`（warp）、`$3e`（windowsTerminal）、`h3e`（trae）、`g3e`（nova）、`_3e`（zed，`o6e` .app Contents/MacOS 切分 + `r6e/i6e/a6e` 探测）、`v3e`（vim/`z4e` fallback 表）、`y3e`（visualStudio）、`b3e`（xcode）、`x3e`（zed 备用）、`S3e`（sublime-merge）、`R3e`（windsurf）等——由 `s6e`（139,906-139,939）32 元素清单逐一注册 |
| 139,941-139,999 | 应用 | **open-in 平台展开 + 调用 API** | **`r.i('open-in-targets')`（139,940，顶层副作用：创建即丢弃的 logger）**；`c6e(platform)`：s6e → platforms[platform] flatMap；`g0 = c6e(process.platform)`（139,947，模块加载即执行的派生常量）；`l6e`：readShortcutLink；`u6e`：编辑器判定；**`d6e`**：open-in 主入口（target 查找 → detect → open/args + `Zi` spawn）；`f6e`：目标→renderer 序列化（id/label/icon/kind/hidden/supportsSsh）；`_0 = r.i('open-in-targets')`（139,995）+ `v0 = new WeakMap()`；`y0/b0/x0`：目标列表/桌面文件降级/自定义目标参数解析（140,005 前后） |

> 139,941-139,999 的函数延续到 140,000 之后（140,151 `logger = r.i('open-in-service')` 归 R10），R9/R10 边界 140,000 切在 open-in targets 与 open-in service 之间，位置合理。

---

## 2. vendored 识别（精确边界）

| 包 | 行区间 | 出口绑定 | 证据 | 置信度 |
|---|---|---|---|---|
| **once** + **wrappy** | 126,988-127,124 | `f1e`(wrappy)/`VQ`(once) | `onceStrict`、`Function wrapped with `once` shouldn't be called more than once` 127,046 直接证据 | 高 |
| **pump** | 127,124-127,185 | `m1e` | `pump requires two streams per minimum` 127,179 直接证据；内部消费 VQ/p1e | 高 |
| **get-stream** | 127,185-127,292 | `h1e`(buffer 模块)/`g1e`(主) | MaxBufferError 127,225、getBufferedValue/getBufferedLength 127,225 | 高 |
| **fd-slicer** | 127,292-127,581 | `v1e` | createFromBuffer/createFromFd/FdSlicer/BufferSlicer 127,301-127,304 直接证据；`_1e` 为其内部 queue 模块 127,248-127,292 | 高 |
| **yauzl** | 127,581-128,183 | `b1e` | `validateFileName/dosDateTimeToDate/ZipFile` 127,596-127,597、zlib require 127,583、cp437 表 128,164 | 高 |
| **extract-zip** | 128,186-128,277 | `x1e`→`S1e` interop | `i.t()('extract-zip')` debug、`Out of bound path` 128,210、__MACOSX/ 128,211 | 高 |
| **vscode-jsonrpc** | 128,996-131,968 | `c$` main → `l$` | 129,849 `e.AbstractMessageReader`、130,025 `e.AbstractMessageWriter`（**非粗扫的 129,984**——该行是 messageWriter 模块头 `e0e = e.t(...)`）、131,891 `vscode-jsonrpc-${e}-sock`、131,964 `e.createMessageConnection = S` | 高 |
| **vscode-languageserver-textdocument** | 131,969-133,496 | `u$` | 131,981 `t.TextDocument = t.EOL = ...` AMD 包装导出列表直接证据 | 高 |
| **vscode-languageserver-protocol** | 133,496-135,196 | `d$/f$/i0e~T0e/E0e/D0e/O0e` → `p$` | ProtocolRequestType0/RegistrationType 133,510-133,524、createProtocolConnection 135,179、`p$ = e.t(...)()` 135,195 立即调用 | 高 |
| **vscode-uri** | 135,199-135,742 | IIFE → `m$` | 135,201 模块表 `{ 975: (e) => {...posix path...} }`、135,741 `m$ = r`、应用侧 135,743 `var { URI: h$, Utils: k0e } = m$` | 高 |

注意事项：
- **识别手法**：本区 vendored 全部是 `Xxx = e.t((e, t) => {...})` 的 CJS 模块包装（列 0/列 2 `  xxx = e.t(` 形态），顶层 grep 的 `^var/^function` 完全失配（粗扫 §9.1 的坑）。可靠识别模式：`grep -nE '= e\.t\(\('`（56 处命中即 56 个 CJS 模块）+ 缩进 4 格的 `e.AbstractMessageWriter = c` 式导出绑定。
- **版本**：kotlin server URL 指向 `kotlin-server/262.9593.0`、rust-analyzer `2026-08-24`（应用数据但可佐证构建时间 ~2026-09）；jsonrpc/LSP 为 vscode-jsonrpc 8.x 形态（MessageReader partial message timer、ParameterStructures.byName）。版本号采样推断，置信度中。
- LSP protocol 内部 133,587-134,177 的 30 个小模块（i0e~T0e）逐个对应 LSP 命名空间（completion/documentSymbol/workspaceFolders/inlayHint/...），重写时整段由 npm `vscode-languageserver-protocol` 提供，不逐模块拆。

---

## 3. 子系统聚类与拆分方案

### 3.1 language-server 簇（建议 4 个模块）

| 模块 | 行区间 | 主要定义（压缩名→语义名） |
|---|---|---|
| **`language-server-runtime-installer`** | 128,278-128,703（清单+安装器；不含 vendored 依赖链） | `C1e/w1e/T1e/E1e/D1e/O1e/k1e`→RUNTIME_MANIFESTS（pyright/ts-ls+ts/java/kotlin/rust-analyzer，URL+sha256 锁定表）、`HQ/M1e`→超时常量、`A1e`→getRuntimeSpec、`j1e`→installer logger、`P1e`→LanguageServerRuntimeInstaller 类、`F1e`→extractResource、`I1e`→downloadWithDigest、`L1e/UQ/WQ/GQ`→runtime.json helpers、`R1e/KQ/qQ/JQ/z1e/YQ`→local runtime root resolvers |
| **`language-server-command-trust`** | 128,704-128,995 | `QQ`→TrustedCommandResolver 基类（workspace 越界/node_modules 拒绝）、`H1e`→UnixResolver（/bin/sh -lc + `__CODEX_LANGUAGE_SERVER__=` 哨兵）、`U1e`→WindowsResolver（where.exe/.bat/.cmd）、`ZQ`→getResolver、`XQ/B1e/V1e`→常量、`q1e`→JdtlsProvider（java，equinox launcher/config.ini/`--add-opens` 参数）、`W1e/G1e/K1e/$Q`→java config、`X1e`→javaVersionAtLeast21、`J1e/Y1e`→命令陪跑 |
| **`language-server-providers`** | 135,743-136,469（kotlin/pyright/rust/sourcekit/ts）+ 128,833 起 java | `F0e`→KotlinLspProvider（workspace.json 生成 `I0e`）、`G0e`→PyrightProvider（PATH 白名单 env）、`q0e`→RustAnalyzerProvider（sysroot 探测 `J0e`、`S$` 禁索引配置）、`X0e`→SourceKitProvider（xcrun、`Y0e` 配置）、`Z0e`→TypeScriptLanguageServerProvider（`C$` node_modules 路径组）、`q1e`→JdtlsProvider |
| **`language-server-manager`** | 135,743-136,470 核心（providers 之外）+ 136,472-136,540 门面 | `x$`→jsonrpc 实例、`z0e`→LanguageServerSession（文档同步/串行请求/空闲关停）、`B0e`→startSession（协议连接装配+initialize 握手）、`V0e/H0e`→等待 helpers、`U0e/g$`→方法表、`_$`→requestWithTimeoutAndRetry（ContentModified 重试）、`M0e/v$/y$/N0e/P0e/b$`→URI/hover 转换、`W0e`→LanguageServerManager（sessions Map、expired-build 重启一次）、`Q0e`→LanguageServerService（n.Uf 门面，providers 数组装配点） |

- 依赖方向：Q0e → W0e → {providers} → {command-trust QQ/ZQ、runtime-installer KQ/qQ/R1e}；vendored jsonrpc/LSP/vscode-uri 是 W0e/B0e 的底座。所有 LSP 子进程经 `host.spawn`（执行宿主抽象，本地/ssh/云统一）。
- 159,518-159,522 装配点：`new P1e({fetchImpl: l.net.fetch})` → `new Q0e(getExecutionHost, dataRoot, installer, onLocalRuntimeExpired)`。

### 3.2 library files 簇（2 个模块）

| 模块 | 行区间 | 主要定义 |
|---|---|---|
| **`library-files`** | 126,347-126,754 | `PQ`→logger、`Q$e`→collectOutputDirectories（配置聚合）、`$$e/e1e/FQ`→scanOutputFiles（realpath 反 symlink 树扫描）、`BQ`→getProjectlessWorkspaceInfo、`n1e/zQ/LQ/RQ`→thread 存在性负缓存、`t1e`→LibraryBackend（globalState 键 + appServerConnection）、`r1e`→LibraryFileAccess（O_NOFOLLOW + dev/ino 双校验 + mkdtemp 预览）、`s1e/c1e`→ThumbnailGenerator（qlmanage）、`l1e`→LibraryFilesService（n.Uf 门面） |
| **`dictation-history`** | 125,684-126,047 | `W$e`→DictationHistoryStore（chunk 硬链接原子里写、启动恢复、20 条上限、全局 transcription-history.jsonl 合并）、`EQ/L$e/DQ/R$e/OQ`→全局 JSONL、`k$e/A$e/j$e/bQ/xQ/SQ/CQ/wQ/M$e/N$e/TQ/yQ`→CoreAudio 内建麦克风探测（objc-js） |

装配点：159,510-159,526（`new p$e`、`new k$e`、`new W$e`、`new t1e`+`new l1e`）。

### 3.3 MCP app sandbox 簇（3 个模块）

当前 guest preload 的 URL、initId 与 MessagePort 白名单校验已迁移到
`src/main/sandbox-preload/sandbox-guest-policy.ts`；`sandbox-preload/index.ts` 仅保留
window/message 生命周期与 IPC 所有权转交。该策略由
`scripts/test-main-mcp-sandbox-guest-policy.mjs` 的 10 项断言覆盖，显式验证
协议/端口/凭据拒绝、Skybridge 路径约束、initId 字符集及 required/optional port 集合。

| 模块 | 行区间 | 主要定义 |
|---|---|---|
| **`mcp-app-sandbox-shell`** | 136,933-137,052（shell 预热） | `P$/F$/I$/o2e/s2e`→shell 常量、`L$`→prewarmState Map、`c2e/l2e/u2e/R$/z$/B$/V$`→skybridge 取数（web-sandbox.oaiusercontent.com、/mcp-app.html） |
| **`mcp-app-sandbox-session`** | 137,053-137,435（UA 改写 + attach 生命周期） | `H$/U$/f2e/p2e/m2e/q$`→header 改写、`W$/G$`→幂等标志、`h2e/g2e/K$`→session 加固装配、`D$/O$/k$`→日志、`a2e/t2e/n2e/r2e`→guest 导航拦截、`y2e/b2e/x2e/Z$`→ipcMain init 通道（a.Nt→a.kt）、`S2e/C2e/w2e/Q$/$$/T2e`→will-attach/did-attach webview 钩子与 30s 挂起账本、`D2e`→McpAppSandboxService（n.Uf 门面：clearData/consumeUserGesture）、`e1/E2e`→sandboxId schema |
| **`mcp-app-sandbox-gesture`** | 136,717-136,735 + 137,390-137,435 部分 | `T$/E$`→5s 用户手势记账（WeakMap + performance.now），被 sandbox 权限（剪贴板）与 desktop-session probe 共用 |

调用链（直接证据）：启动区 172,841 `y2e()`（h2e+b2e 全局钩子）与 173,266 `S2e(window, allowNonMcpAppSandboxWebviews, {...})`（每个 owner window 挂 webview 钩子）；160,231 `new D2e(origin)` 装配为 mcpAppSandbox 服务。

### 3.4 open-in 簇（3 个模块）

| 模块 | 行区间 | 主要定义 |
|---|---|---|
| **`open-in-targets`** | 138,215-139,947 | `m1`→MACOS_BUNDLE_IDS、`d4e/v1`→target decision、`p4e/y1/...`→ssh host 显示名、`S4e/C4e`→customFileHandlers、`w4e`→icon resolution、`V1/H1/U1/q1`→目标工厂、`K1`→vscode args、`z1/B1`→vscode-remote URI、`s6e`→32 目标清单（vscode/cursor/windsurf/antigravity/devin/sublime/emacs/vim/nova/zed/trae/xcode/visualStudio + jetbrains 家族 + terminals: terminal/iterm2/kitty/ghostty/warp/windowsTerminal/gitBash + fileManager/systemDefault/githubDesktop/sublime-merge + `e3e` fileManager 含 WSL `n.ji` 路径转换）、`c6e/g0`→平台展开、`d6e`→openIn 调用入口、`f6e/y0/b0/x0`→序列化与降级、`u4e`→editor 判定 |
| **`open-in-probe`**（desktop-session 浏览器会话探测） | 137,783-138,213 | `e4e`→BrowserSessionProbe（PKCE+challenge+deviceCheck+127.0.0.1 回调 server+焦点回拉 `U2e`）、`r4e/i4e/a4e/o4e/t4e/n4e`、`l1/u1` debug 门、`Y2e` 参数白名单 |
| **`native-crash-attribution`** | 137,436-137,782 | `M2e`→createCrashWatcher（159,583 消费）、`P2e/I2e/L2e/R2e/z2e/n1/r1/i1/B2e`→shell 切分与 primary-runtime 归因、`F2e`→captureMessage |

装配点：159,547 `J$e(...)`（cloud terminal）、159,583 `M2e({...})`、160,136 `new e4e(...)`、140,203/140,423（R10 区消费 u4e/l4e）。

### 3.5 杂项小模块

- **`execution-host-registry`**（125,123-125,188）：`a$e`（159,161 实例化）、`s$e` clipboard 图片落盘。
- **`workspace-file-service`**（125,189-125,585）：`p$e` 类（缩略图/读/写/下载）、`_$e` 文件拖拽、`sQ` 原子下载写。
- **`cloud-terminal`**（126,048-126,346）：`NQ/J$e/Y$e/X$e`（155,975 NQ、159,950 Y$e 实例化）。
- **`thread-catalog-authz`**（126,755-126,951）：`u1e/d1e`。
- 注意：125,000-125,122 是 R8 窗口总管类的方法尾巴（`setSystemFocusState` 等），派发时归 R8，勿重复。

---

## 4. 顶层可变状态清单

（模块级 `var/let` 且被运行时改写；类字段/闭包不算。行号已核实）

| 名 | 行 | 语义 | 读/写方 | 置信度 |
|---|---|---|---|---|
| `aQ` | 125,165 | sky addon startFileDrag 句柄单例（undefined=未试/null=失败/对象=成功） | `l$e` 写读 | 高 |
| `yQ` | 125,577 | objc-js CoreAudio 绑定单例（`??=` 惰性） | `M$e/N$e` | 高 |
| `zQ` | 126,472 | WeakMap: appServerConnection→Map(threadId→{expiresAt,promise})（30s 负缓存） | `n1e` | 高 |
| `L$` | 136,946 | Map: shell URL→{promise,state:'warming'/'warm',refreshing}（MCP sandbox 预热状态） | `u2e/c2e/R$` | 高 |
| `W$` | 137,054 | defaultSession webRequest 钩子已装标志（`h2e` 幂等） | `h2e` | 高 |
| `G$` | 137,055 | WeakSet: session→已加固（`g2e` 幂等） | `g2e` | 高 |
| `J$` | 137,157 | ipcMain(a.Nt) 已装标志（`b2e` 幂等） | `b2e/y2e` | 高 |
| `Y$` | 137,158 | Map: session→[{viewInstanceId,state,timeout}]（attach 30s 挂起账本） | `C2e/w2e/$$/T2e` | 高 |
| `X$` | 137,159 | Map: guestWebContentsId→sandbox state（guest 注册表） | `b2e/S2e/Z$` | 高 |
| `a1` | 137,771 | sky addon getDefaultWebBrowserState 句柄单例 | `W2e` | 高 |
| `m1` | 138,232 | const Map 扩展名→bundleId（运行时只读，语义上不可变） | `l4e` | 高 |
| `w$` | 136,716 | WeakMap: webContents→激活时间戳（用户手势记账） | `T$/E$` | 高 |
| `g0` | 139,947 | 当前平台的 open-in 目标展开（模块加载即执行一次，之后只读） | `c6e` 派生；`d6e` 等 | 高 |
| `v0` | 139,996 | WeakMap（open-in 上下文，140,000 后消费） | R10 区 | 中 |
| `p$/m$/x$` | 135,195/135,741/135,968 | vendored LSP protocol/jsonrpc 的 interop 出口（立即调用产生，之后只读） | 应用侧 `p$./h$/x$.` | 高 |

类内字段但值得注意：`P1e.installs`（in-flight 安装去重）、`W0e.sessions/expiredLocalRuntimes`、`F0e.downloadedExecutablePaths`、`d1e.sourceGeneration`（账号源世代号）。

---

## 5. 顶层副作用序列（模块加载即执行）

列 0 非声明语句全集（`grep -nE '^[a-zA-Z_$][a-zA-Z0-9_$.]*\(|^r\.i\(|^r\.r\(|^\('` 枚举）：

1. **125,111-125,185 区间**：无列 0 副作用（`a$e/s$e` 等 var 链初始化仅 new Map/Set/字面量）。
2. **135,195-135,196**：`p$ = e.t((e, t) => { t.exports = O0e(); })()` —— **vendored LSP protocol 入口立即调用**（沿链初始化全部 LSP 模块；无 I/O）。
3. **135,199-135,742**：vscode-uri webpack IIFE **立即执行**（模块注册表 + `m$ = r`；无 I/O）。
4. **139,940**：`r.i('open-in-targets')` —— 创建即丢弃的顶层 logger（粗扫 §6 已点名；**唯一效果是 logger 工厂可能的自增计数**，重写时删除）。
5. **139,947**：`g0 = c6e(process.platform)` —— 32 目标 × platforms 展开（纯数据推导；`F1/I1/L1` 等 detect 闭包内的 existsSync 都在调用时才执行）。
6. logger 创建（构造对象、无 I/O）：`PQ`(126,347 library-files)、`j1e`(128,517 language-server-runtime-installer)、`O$`(136,718 mcp-app-sandbox)、`k1/P4e/u3e/_0`(138,418/138,728/139,208/139,995 open-in-targets)、类字段 logger：`r.r('dictation-audio')`(125,572)/`r.r('dictation-history')`(125,773)/`r.i('language-server-manager')`(136,181)。

**运行时（启动期）才触发的接线**（模块加载期不发生，供启动区（R12）对照）：172,841 `y2e()`（ipcMain a.Nt + defaultSession webRequest）、173,266 `S2e(...)`（每窗口 webview 钩子）、159,518-159,583（P1e/Q0e/M2e 装配）。**结论：R9 的模块加载副作用极轻，重写时唯一需要保真的是 import 顺序上 LSP protocol/vscode-uri 的出口在消费方之前初始化（ESM import 语义天然满足）。**

---

## 6. 跨 chunk 依赖

### 6.1 @chunk/shared（`n.*`，src-DldfpmrL.js）

- **执行宿主/文件系统抽象**（本区最大 fan-in）：`n.Di`（mkdir/copyFile/stat/readFile/readFileSampleBytes/readFileBase64/writeFileBuffer）、`n.Es`（isLocalHost）、`n.zi`（isWsl）、`n.El`（wsl→win 路径）、`n.f`（路径判定）、`n.K/n.q/n.R`（环境读写）、`n.Ln`（node 路径）、`n.qn.resolve`、`n.Bi`（净化 env）、`n.bc`（readFile→Buffer?）、`n.xc`（spawn 结果解析）、`n.kc`（abortable）、`n.Zo`（错误串）、`n.er`（shell split）
- **globalState 键** `n.iu.*`：THREAD_PROJECTLESS_OUTPUT_DIRECTORIES / THREAD_PROJECT_ASSIGNMENTS / PROJECTLESS_THREAD_IDS / THREAD_WORKSPACE_ROOT_HINTS（126,530-126,560）；settings `n.Fa.projectlessWorkspaceRoot`
- **sandbox 工具**：`n.ss`（isOaiusercontent? hostname 判定）、`n.as`（URL→origin）、`n.is`（partition 解析）、`n.cs`（sandboxId 校验）、`n.ns`（initId）、`n.ts`（sandboxId 派生）、`n.os`（portNames 校验）、`n.Qo`（持久分区名）、`n.rs`（分区名构造）、`n.$o`（codex-sandbox scheme）、`n.es`（shared 子域 URL）
- **open-in**：`n.Ia.customFileHandlers.schema`、`n.cn`（hostConfig 键）、`n.As`（isWslHost）、`n.Os`（isSshHost?）、`n.ji`（win→wsl 路径）、`n.wl/n.Tl`（路径→fs URI）、`n.$n`（shell 引用）、`n.cu.allowDebugMenu`
- **app-server**：`n.Wu`（feature gate 版本比较）、`n.Cs`（isManagedHost?）、`n.$u`（threadId 规范化）、`n.yc`（输出转换）
- **zod 实例族** `n.Of/wf/Cf/gf/hf/df/bf/ff/...`（schema 构造 ~25 处）

### 6.2 logger chunk（`r.*`）

`r.i/r.r` 具名 logger 共 10 个（见 §5.6）；`r.n()` 根 logger（126,689/125,725 dictation 全局历史警告）。

### 6.3 bootstrap chunk（`a.*`，对照 bootstrap-export-table.txt）

| 导出 | bootstrap 名 | R9 用法 | 行 |
|---|---|---|---|
| `a.Nt` | `jw` = `codex_desktop:mcp-app-sandbox-guest-message` | ipcMain.on guest init | 137,167 |
| `a.kt` | `Mw` = `codex_desktop:mcp-app-sandbox-host-message` | postMessage 转交 owner | 137,196 |
| `a.en()` | span（`a.en()/t.u()/t.e()/t.d()`） | thread catalog 授权 span 包装 | 126,886+ |

（区间内其余 `a` 命中均为参数遮蔽，已剔除。）

### 6.4 其他 chunk 与跨区

- `o.t({env, resourcesPath})`（electron-resources-path）：128,693/137,773（runtime node 路径、sky addon）。
- `mp = e.a(n.z())`（24,789）：mac转义正则（137,024 excludedUserAgentProducts 清理）。
- `i.t()('extract-zip')`（128,187）：debug logger 工厂（main-shared 的 debug 工具）。
- **`i.Emitter`**（shared 的 `n.Uf` 之外的另一个 Emitter，src-C9YLnbgY）：被 vendored `i$` 模块（129,535）消费——**这是 R1-R2 报告中「`i.Emitter` 最早出现在 130,002」的确切落点**（i$ 在 129,535，消费在 129,545/129,548 附近；粗扫的 130,002 是后续消费）。
- **与 git-worker chunk 的关系（重要修正）**：粗扫交接说 git worker 是 vscode-jsonrpc 的「另一消费方」。核实结果：**`src/main/worker.ts`（90,836 行）不含 vscode-jsonrpc**（grep `AbstractMessageReader|createMessageConnection|StreamMessageReader` 0 命中；仅 2 处 `Content-Length` 是 WebSocket 426 响应/HTTP 头，语义无关）。worker.ts 只有 `rpc.jsonrpc.version` 等 **OpenTelemetry semantic-conventions 属性名**（1,963-1,970）。**vscode-jsonrpc/LSP 在整个代码库中的消费方只有本区的 language-server-manager（`x$ = l$()`，`p$.createProtocolConnection`，136,089-136,091）一处**。git worker（bootstrap 15,891 `new O.Worker(data:base64 URL)`）与 R9 无共享代码——拆分 vendored jsonrpc/LSP 时无跨 chunk 牵连。置信度：高（worker.ts 全文件特征串扫描）。
- 区间外 helper（重写映射时需跨区 import）：`Yi/Xi/Zi/na/ta/ra/sa/ia/aa`（4,881-5,023 PATH/spawn 工具）、`fH`（93,630 前缀包含判定）、`Vn/zn`（2,981-2,987 WSL 路径转换）、`xt`（627 workspace roots）、`bE`（66,110 登录 shell 探测脚本）、`lO`（71,373 桌面文件查找）、`Ij`（79,305 下载完成通知）、`fT`（62,255 URL 脱敏）、`oU`（98,219 加速键匹配）、`K/je/Ae`（348-364 大文件上限/文件名清洗）、`Vs`（10,078 sky addon 加载器）、`yRe`（91,824 tar 提取）、`FV`（X$e watchRelease 用的修饰键等待）。

---

## 7. 拆分风险

1. **vendored 边界修正必须落进派发计划**（§0/§2）：126,988-128,458（once→extract-zip 链）与 128,996-135,742（jsonrpc+LSP+vscode-uri）共 **~8,200 行不派发重写**，直接引 npm：`once`、`pump`、`get-stream`、`fd-slicer`、`yauzl`、`extract-zip`、`vscode-jsonrpc`、`vscode-languageserver-protocol`、`vscode-uri`。若按粗扫区间派发会把 ~3,500 行（126,988-128,458）当成应用代码白白重写。注意 `extract-zip` 对 `yauzl/fd-slicer/get-stream/once` 是 npm 依赖关系，一揽子引入即可。
2. **LSP 连接生命周期（最高风险）**：
   - `z0e`（session）构造在 `B0e` 内部，连接创建（createProtocolConnection）→ initialize 握手 → 返回 session 三步**非原子**；中途失败的路径有三条（g.dispose() + V0e 等退出码 + classifyProcessExit 分类），java 的 `expired-build`（kotlin code===7）还有**重启一次**逻辑（`W0e.startSession` 里 `expiredLocalRuntimes` 去重防止死循环）。重写必须保持「失败 → 分类 → 至多重启一次」的状态机，否则 kotlin 过期 build 会循环拉起。
   - `z0e` 的 `stop()` 有三条触发路径（idle_timeout 120s / process_exit / dispose()），且构造即挂 `t.wait().then(...)`——**进程退出回调可能在 initialize 之前到达**，当前代码靠 `disposed` 标志幂等。重写时连接对象的生命周期状态机建议显式建模（starting/started/disposed）。
   - `_$`（requestWithTimeoutAndRetry）的 ContentModified 重试**只重试一次**（`r=!1` 递归参数），且仅限 `g$` 五个 location 方法。别「泛化」成通用重试。
   - stderr 排空（`H0e`）看起来多余，删掉可能导致某些 LSP（jdtls）写 stderr 阻塞。
3. **文档同步队列的顺序性**：`z0e.requestForDocument` 用 `documentRequests` promise 链把 didOpen/didChange 与实际请求串行化，且每次 `syncDocument` 先 close 其他文档（单文档模型）。hover/locations 依赖这个不变量。重写用 async queue 时要保持 FIFO + 每次全量 close 其他 URI 的行为。
4. **QQ 命令信任层是安全边界**：trustedPath 拒绝 workspace 外、拒绝 node_modules、非本地经 `/bin/sh -lc 'exec "$@"'` 间接执行、`__CODEX_LANGUAGE_SERVER__=` 哨兵防 PATH 输出注入、shebang+1MiB 限制防 node 模块逃逸。重写时这些判定**逐条保留并补测试**，任何「简化」都会引入 RCE 面（LSP 是把用户 workspace 的文件路径传给任意可执行文件的通路）。
5. **MCP sandbox 的幂等标志与注册表**：`W$/G$/J$` 三个顶层标志保证全局钩子（defaultSession webRequest、ipcMain a.Nt）只装一次；`X$/Y$` 两个 Map 是 guest 生命周期账本（30s 挂起超时 + destroyed 清理 `T2e`）。拆成 ES 模块后这些**必须仍是模块级单例**，且 `y2e()`/`S2e()` 的调用点（启动区）不能重复执行——重写建议改为显式 `ensureXxx()` 单例函数而非 import 副作用。
6. **ipcMain 频道契约**：`a.Nt/a.kt` 对应 bootstrap 19,745-19,746 的 `codex_desktop:mcp-app-sandbox-guest-message/-host-message`。本 chunk 的 ipcMain 直接注册仅此一处（粗扫统计 R9 ipcMain:3 为 137,164-137,167 的三行同链）。与 preload/sandbox-preload.ts 的 MessageChannel ports 语义（ports 数 = portNames+1）必须对齐。
7. **open-in 目标表是数据不是代码**：`s6e` 32 目标 + per-platform detect/args 闭包，重写时按「目标注册表」建模；`m1` bundleId 表、`q1` 终端工厂的参数矩阵（kitty/ghostty/konsole…）逐一保留。`g0` 在模块加载时按 process.platform 展开——若改成函数调用，注意 `l4e`（bundleId）与平台判定 `b0`（.desktop 降级）仍需传入同一份展开结果。
8. **用户手势共享**：`T$/E$`（5s WeakMap 手势）被 sandbox（clipboard-sanitized-write 权限）与 desktop-session probe（consumeUserGesture）共用；native-crash 归因的 shell 切分器 `r1/n1` 是独立实现，**不要**与 shared 的 `n.er` 混用（`n1` 是 `n.er` 的 try/catch 包装，语义不同）。
9. **名字冲突（重写命名陷阱）**：`p$`/`m$`/`x$`（vendored 出口）vs 应用同名风格 `S$`（rust 配置）/`w$`（手势 WeakMap）/`Y$`（attach 账本）/`X$`（guest 注册表）/`W$`（幂等标志）/`L$`（预热状态）；`QQ`（信任基类）vs `qQ`（runtime 路径）vs `q1e`（jdtls）vs `q1`（终端工厂）；`m1`（bundleId 表）vs `M1`（~/Applications）；`F1`（app 探测）vs `f1`（query bool）vs `F1e`（资源下载）vs `F$`（dev URL）。必须逐个建压缩名→语义名对照。
10. **dictation 硬链接写**：`W$e.#f` 用 `link(tmp, target)` + EEXIST 短路实现幂等追加（chunk 序号占位 10 位补零），`#p` 的 metadata.json 原子写 + fsync（`#h`）。Windows 下 fsync 目录被跳过（`#h` 平台判定）。这些文件系统细节是崩溃恢复语义的一部分，重写别改成简单 writeFile。
11. **135,195 `p$ = ...()()` 立即调用**：vendored 出口在模块加载时即初始化（CJS 语义）。改 ESM 后 import 顺序天然满足，但若有人把 LSP protocol 的引入改成惰性 getter，`p$.DefinitionRequest` 等顶层常量引用（`g$`、`U0e`、`S$` 同类）会在 TDZ 报错——这些常量表引用了 protocol 的 method 字符串，必须保持非惰性。
12. **粗扫 §6 的「128,704 QQ hostPath」表述已在派发材料中传播**——修正为「LSP 命令信任解析基类」（§0.2），避免下游按「host 路径注册表」误解。
