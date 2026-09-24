# bootstrap-C4dRql4x.ts 结构分析

目标文件：`src/main/bootstrap-C4dRql4x.ts`（25,626 行，rolldown 打包产物经 prettier 格式化，无 sourcemap）。
来源：macOS ChatGPT.app（Codex 桌面版 v26.917.71314）的 app.asar 主进程引导 chunk。
所有行号均经 `grep -n` / 直接读取核实，可直接用于按行区间派发重写任务。

顶部导入（1-40 行）：

- rolldown 运行时（`./rolldown-runtime-CPUxUITh.js`，绑定名为 `e`）
- `./desktop-open-path-queue-DpR9n1cN.js`（绑定 `t`，只在 24953 行 `t.a()` 读 argv）
- `./src-DldfpmrL.js`（shared chunk，绑定 `n`，全文件最大的外部依赖）
- `./logger-DkO6GWbX.js`（绑定 `r`，`r.i()` 取 logger、`r.n()` 取根 logger、`r.o()`/`r.t()` 是日志安装/格式化）
- `./src-C9YLnbgY.js`（main-shared，绑定 `i`，未在本文件大量使用）
- `electron`（绑定 `o`，经 `e.a()` interop）及约 25 个 node 内置模块（url/util/path/os/crypto/fs/fs-promises/stream/timers-promises/zlib/readline/perf_hooks/module/worker_threads/diagnostics_channel/child_process 等）

外部 chunk `n`（src-DldfpmrL.js）提供：`n.cu`（build flavor 枚举）、zod 类（`n.Of()` string、`n.Cf()` number、`n.wf()` object、`n.Df()` discriminated-union 等）、`n.rf`（另一套 zod 实例，用于 global-state schema）、`n.ko`/`n.Ro`/`n.zo`/`n.Oi`（codex home / flavor 工具）、`n.o()`（startup config 客户端）、`n.ft`（Datadog logger）、`n.pt`（Datadog transport）、`n.Uf`（EventEmitter 基类）、sqlite 相关（`n.si`/`n.oi`/`n.ai`/`n.Hn`/`n.jn`）、IPC/tracing 桥（`n.na`/`n.kc`/`n.ta`）、`n.ac`…重写时需要先把 shared chunk 的导出映射表整理出来（待确认：可从 `src-DldfpmrL.js` 的 `exports.` 段反查）。

---

## 1. 区域地图

| 行区间 | 类型 | 语义名 | 概述 |
|---|---|---|---|
| 1-40 | 应用 | module 头 | require 导入与 interop 绑定 |
| 41-50 | 应用 | codex-url 解析头 | `te()` 解析 `codex:`/`codex-dev:` 协议 URL |
| 51-73 | 应用 | 杂项小工具 | `ne`（migration announcement 键）、`re` identity、`ie` debounce |
| 74-76 | 应用 | libfile 名校验 | `ae()`：`libfile-xxx` 文件名（deep link 库文件用） |
| 77-129 | 应用 | Sentry breadcrumb 截断 | `pe/he/ge`：2KiB breadcrumb 数据截断（`de` 常量、`ce/le/ue` 限额） |
| 84 | — | **Sentry DSN** | `fe = https://...@o33249.ingest.us.sentry.io/4510999349821440` |
| 91-93 | 应用 | release 名格式化 | `me()`：`codex@${version}` |
| 130-188 | 应用 | TOML 设置编解码 | `ye/be/xe/Se/k/Ce`：zod schema ↔ TOML 值互转（null 约束校验） |
| 189-254 | 应用 | 启动阶段状态机 | `we`（阶段名数组）、`Te` class（bootstrap→host_ready→…→background_ready，含 subscribe/whenReached/dispose）、`Ee` abort 错误转换 |
| 255-268 | 应用 | 错误上报门面 | `De` 空实现 + `Oe()` 构造 report/reportNonFatal/reportFatal |
| 269-300 | 应用 | 日志级别 | `ke/Ae` 级别比较、`je` 按 build flavor 决定默认级别（`CODEX_MAX_LOG_LEVEL` 覆盖）、`Me` 解析 |
| 301-433 | 应用 | Intel-on-AppleSilicon 警告 | `Ke/qe/Je/Ye` + NativeIntl 依赖：x64 包跑在 AS 上时弹窗询问退出 |
| 309-433 | 应用 | NativeIntl | `A/He`（缓存状态）、`Ue/We/Ge`：native-menu-locales JSON 加载与 `Ve` zod schema |
| 434-3240 | **vendored** | mime-db | `Qe` 惰性数据：约 2800 行 IANA/apache MIME 类型表（`e.n(() => {...})` 惰性求值，`e.r` re-export） |
| 3241-3317 | **vendored** | mime-types | `$e`（mime-db 转发）、`et` 惰性模块：`charset/contentType/extension/lookup`（3249-3308 定义，`tt = et()` 3310 行取实例） |
| 3318-3514 | 应用 | app:// 协议处理器 | `lt()`（registerSchemesAsPrivileged）、`ut/dt/ft/pt/mt/ht/gt/_t/vt/yt/bt/xt/St/Ct/wt/Tt/Et/Dt`：`app://-` 与 `app://fs` 自定义协议、路径穿越防护、Range 请求（音视频流） |
| 3515-3541 | 应用 | 应用网络需求 | `Ot`（随机 session id）、`kt/At`（app-server 版本常量与 zod schema）、`jt/Mt` restricted 网络策略判定 |
| 3581-3734 | 应用 | Desktop 网络策略 | `Nt` class：session 级 webRequest 拦截、`fetch/request` 门面、requirements 刷新（连 app-server） |
| 3725-3735 | 应用 | 包元数据候选 | `Pt()`：resourcesPath/app.asar、cwd、electron 目录下的 package.json 候选列表 |
| 3736-3747 | 应用 | 包元数据读取 | `j(e,{candidates,parse})`：从 package.json 读 `codex*` 字段（注意：**不是 glob 库**，是纯 JSON 读取；任务描述中 3736 的 glob 猜测不成立） |
| 3748-3851 | 应用 | build flavor 模型 | `Ft` logger、`It` flavor 列表、`Lt` Windows store 配置、`M` 对象：resolve/parse/shouldIncludeSparkle/shouldIncludeWindowsUpdater/…/allowDevtools、`Rt/zt/Bt/Vt` 谓词 |
| 3852-3867 | 应用 | bundle id | `Ht()`：flavor → `com.openai.codex.*` |
| 3868-3930 | 应用 | build number & appcast state | `Ut/Wt/Gt/Kt`（懒 build number）、`qt`、`Jt` zod、`Yt` class：production-appcast-bootstrap.json 读写（installationId、backendAppcastEnabled） |
| 3931-5170 | **vendored** | @opentelemetry/api | `$t`~`Hn` 约 30 个 `e.t()` CommonJS 模块：VERSION `1.9.0`（3987）、registerGlobal/getGlobal（4036-4067）、DiagAPI、Baggage、context、metrics、propagation、trace、Noop 实现；5163-5169 组装 default export |
| 5171-9390 | **vendored** | @opentelemetry/core + sdk-trace | `Jn`~`Ws` 惰性区：SUPPRESS_TRACING（5182）、W3CBaggagePropagator（5236）、时钟（5275）、属性消毒（5291）、env 解析（5382-5409）、semconv 常量（~7000-7448）、hiring-time 工具（7510-7565）、CompositePropagator（7579）、TraceState（7627）、 ALWAYS-ON/OFF sampler（7698-7710）、SpanLimits/idGenerator（7759+）、Resource（7996+）、日志桥（8108+）、`F` 惰性 init（8074，见副作用表）、semver+semver-coerce（8386-8518，regex 特征 `(?<version>(?<major>0|[1-9]\d*)…` 8496）、shimmer（8555-8599 patch/unpatch/massWrap）、InstrumentationBase（8603-8671）、node_modules 名提取（8673-8690）、RPC 传输序列化（8686+）、`g`（9119+）全局 tracer/meter/propgator holder |
| 9382-9390 | 应用(聚合) | OTel 惰性 init | `Ws = e.n(() => { ho(), Fs(), Ls(), zs(), Ds(), Hs() })`——@sentry/core 的 OTel 依赖聚合块 |
| 9391-15866 | **vendored** | @sentry/core 10.29.0 | `R`（`__SENTRY_DEBUG__`）、`z` globalThis、`Gs = '10.29.0'`（9387）…console 打桩（9401-9449）、debug 辅助（9477+）、is、client、server runtime、DSC、envelope/serialization（12100+）、scope（11786+）、tracing/span（10516+）、session（10793+）、bunyan/pino loggers（13000+）、`_c` NodeClient 相关（14200+）、`_y`/`ch`/`wh`/`Hy`/`Xv`/`fy`/`yv` 等集成（14900-15860）、`ry`（15856）= base64 内嵌的 `@sentry/node-core` local-variables worker 脚本（解码头注释 `@sentry/node-core 10.29.0 (3529d46)`） |
| 15867-16891 | **vendored** | @sentry/node 10.29.0 | `ay`（15860 起 lazy）…http instrumentation、`ly` NodeClient、`hy`/`Cy`（OnUnhandledRejection 16169 / ChildProcess 16224 集成）、`Dy`（16290）等 |
| 16860-16916 | **vendored** | @sentry/opentelemetry | SentrySpanProcessor/SentryPropagator/SentryContextManager（`o_` 14597）、`Jy`（~16905-16916）把 Sentry 接到全局 OTel（`J.trace.setGlobalTracerProvider` 等） |
| 16931-18907 | **vendored** | @sentry/electron 7.5.0 | `Zy`（webContents id→url/title map，16943 `app.on('web-contents-created')` 接线在 `Qy()` 内）、`eb/tb` breadcrumbs 过滤（16958）、`ob = '7.5.0'`（17088）、`sb = 'sentry.javascript.electron'`、minidump 解析（17376-17462 MDMP 头/stream）、`mx`（SentryMinidump，17561-17694）、`nb`（ElectronBreadcrumbs 16994）、`rb`（OnUncaughtException 17046）、`wx`（PreloadInjection 17796）、`Tx`（MainProcessSession 17812）、`Ax`（AdditionalContext 17867）、`Nx`（ElectronNet 17993）、`Ix`（ChildProcess 18019）、`Lx`（Screenshots 18071）、`Hx`（RendererProfiling 18112）、`Ux`（NormalizePaths 18144）、`Gx`（ElectronContext 18162）、`qx`（GpuContext 18207）、electron 栈解析器（18228-18311，`uc(tS,[Yx,…])` 18263）、ANR（`hS/gS` RendererEventLoopBlock 18379-18459）、electron transport（18463-18509）、offline store（18510-18577）、IPC（Protocol/Classic 18725-18793）、utility process 代理（18797-18849）、`ZS` 默认集成列表（18850-18876）、`QS` init（18877-18907） |
| 18917-18976 | **vendored** | TS helper | `tC()`：`using`/`Symbol.asyncDispose` 降级 helper（tslib 风格） |
| 18977-19105 | 应用 | Owl 浏览器崩溃计数 | `nC/rC/iC/aC`（顶层可变状态）+ `oC` class（EventEmitter 订阅）+ `uC~yC`：minidump `_sidecar.json` 读取，`mC({…})` 构造 beforeSend 钩子（19043-19123） |
| 19124-19227 | 应用 | desktop Sentry 初始化 | `xC`（gzip promisify）、`SC(e)` fetch transport（走网络策略 `e.fetch`）、`CC` 采样率、`TC/EC/DC/OC`（顶层可变状态：ready promise、captureException 门面、启动配置快照——`OC` 19159-19166 在**模块加载时**读 `M.resolve()`、`Kt.value`、`o.app.getVersion()`）、`kC` 初始化（19167-19222：`QS()` 调 @sentry/electron init）、`AC/jC` |
| 19228-19267 | 应用 | 生成失败遥测 | `jC()`（19167 内）+ `MC` 日志目录解析（mac/win/linux 路径） |
| 19268-19553 | 应用 | 文件日志 | `NC/PC/FC/IC/LC` 常量、`RC/zC/BC/VC/HC/UC/WC/GC/KC/qC/JC/YC`：分日目录、段轮转、backpressure、EPIPE 容忍、`r.o()` 安装全局 logger |
| 19554-19633 | 应用 | Linux 包更新器 | `XC`（deepEqual interop）、`ZC`（linux-package-metadata.json）、`QC`、`ew` class（LinuxPackageUpdater）、`tw/nw/rw`（版本比较） |
| 19634-19738 | 应用 | Owl relaunch 策略 | `iw/aw/ow/sw/cw` 常量、`uw/dw/fw` zod、`pw()`（`process._linkedBinding('electron_browser_owl_update_policies')`）、`mw/hw/gw/_w/vw/yw/bw/xw/Sw/Cw/ww`：relaunch 通知窗口计算 |
| 19739-19793 | 应用 | IPC 频道名 & API 端点 | `Tw~Yw`（`codex_desktop:*` 频道名表）、`Xw/Zw`、`Qw/$w/eT/nT`（UA、CODEX_APP_VERSION、API base URL） |
| 19778-19886 | 应用 | 后端认证请求 | `tT`（Sign-in Error）、`iT/aT/oT/sT/cT/lT/uT/dT/fT/pT`：Bearer/Account-Id/Fedramp 头、401 重试、workspace routing |
| 19886-19937 | 应用 | production appcast | `mT/hT/gT/_T/vT/yT/bT/xT`：backend appcast URL 构造与 build version 比较 |
| 19938-19942 | 应用 | Windows 更新等待 | `ST/CT()`：uptime<61s 时等待 |
| 19943-20408 | 应用 | Windows MSIX 更新器 | `wT` logger、`TT`（createRequire）、`DT` class（manifest 校验、下载 sha256、stage/install、native addon `OT()` 20409）、`yT/bT/xT` 版本比较 |
| 20409-20423 | 应用 | Windows native addon 加载 | `OT()`：`windows-updater.node` |
| 20424-20479 | 应用 | Store manifest 门控 | `kT/AT/jT/MT/NT/PT`：store manifest schema/拉取/决策 |
| 20480-20877 | 应用 | Windows Store 更新器 | `FT` logger、`IT` class（trySilentDownloadStoreUpdates 等） |
| 20878-20990 | 应用 | Windows 组合更新器 | `LT` class：store + msix fallback |
| 20991-21862 | 应用 | Sparkle/统一更新管理 | `RT`（createRequire）、`zT/BT/VT/HT/UT/WT` 常量、`GT()`（`SPARKLE_UPDATE_INTERVAL_MINUTES`）、`KT` class **SparkleManager**（21004-21862：in-app updates policy 门、initializeWindowsUpdater/initializeLinuxPackageUpdater/initializeMacSparkle、relaunch notice、forced update、executable identity）、`qT/JT` |
| 21863-21980 | 应用 | 浏览器表单填充遥测 | `YT/XT/ZT/QT/$T/eE/tE`：browser-auth operations 记账（`TE` 频道）、`nE` conversational-onboarding schema（21957）、21980 顶层 `({...}).parse(...)`（丢弃结果的 schema 验证） |
| 21993-22015 | **vendored** | lodash clamp | `aE`（基础 clamp `e.t()` 模块）、`oE`（clamp with toNumber）、`sE` interop |
| 22016-22121 | 应用 | 窗口放置吸附 | `cE/lE` 位置枚举、`uE/dE` zod、`fE/pE/mE/hE/gE/_E/vE/yE`：九宫格吸附算法 |
| 22122-22296 | 应用 | global-state 键 & schema | `bE~XE` 全部 state 键名、`ZE/QE` 常量、`eD/tD/nD/rD/iD/aD/oD` zod schema、`sD/cD` |
| 22297-22516 | 应用 | GlobalState 存储 | `lD` class（读/写/debounce/flush/backup）、`uD/dD/fD/pD/mD/hD/gD/_D/vD/yD`：原子写、.bak、win32 EPERM 重试（`QE = [100,200,400]`） |
| 22512-22516 | 应用 | 主题 | `bD()`：nativeTheme.themeSource |
| 22517-22762 | 应用 | SettingsStore（TOML） | `xD/SD/CD/wD/TD/ED` class（config.toml desktop 段 + app-server configClient batchWrite）、`DD/OD/kD/AD/jD/MD` legacy migration |
| 22763-22832 | 应用 | 启动环境装配 | `ND/PD`、`FD()`（Windows home 标记）、`ID/LD/RD/zD`（framework 开关读写）、**`BD({moduleDir})`**：codex home、globalState、settingsStore、WSL 检测、theme 应用 |
| 22833-22850 | 应用 | 启动变更检测 | `VD` class（settings/custom checks） |
| 22851-22863 | 应用 | hex 解码 | `HD/UD`（OTel spanId 编码用） |
| 22864-23027 | **vendored** | OTLP JSON 序列化 | `WD/GD/KD/qD/JD/YD/XD/ZD/QD/$D/eO/tO/nO/rO/iO/aO/oO/sO/cO/lO/uO/dO/fO/pO`：OTLP span/resource JSON 编码（`pO.serializeRequest` 23017） |
| 23028-23187 | 应用 | desktop OTEL tracing | `F()`（23028，第二处 OTel init）、`mO`（propagator 实例）等顶层可变状态、`xO`（23136-23149：NodeTracerProvider 装配 + `n.na()` 注入 shared chunk 的 tracing 桥）、`SO/CO/wO/TO/EO/DO/OO`（采样率/exporter 门面） |
| 23188-23200 | 应用 | 网站报告开关 | `kO(e)`：session.setWebsiteReportingEnabled 绑定 analytics |
| 23201-23361 | 应用 | **jO() 装配函数（核心）** | `AO`（单例缓存）、`jO(e)`：创建 `Nt` 网络策略、startup config `n.o()`、`VD` 启动策略、analytics → `kC`（Sentry）、`xO`（OTel）、`Oe` 错误上报、Datadog transport/logger、`YC` 日志安装、`lt()` 协议注册、`Yt` appcast store、`KT` SparkleManager、`Te` 启动阶段、以及 second-instance / sparkle-bridge 回调注入点；**注意它是惰性单例，且函数体在首次调用时才产生副作用** |
| 23362-23414 | 应用 | URL 门控 | `MO/NO/PO/FO`：http/https 白名单 |
| 23415-23864 | 应用 | deep link 解析 | `IO/LO/RO/zO/BO/VO/…/QO` 常量、`$O/Z/Q/ek/tk`（主解析器：codex:// 全路由 → {kind} 结构）、`nk~xk` 各 kind 解析、`ok/sk/ck`（argv → route） |
| 23836-23838 | 应用 | 单实例锁判定 | `Sk()`：是否需要 requestSingleInstanceLock |
| 23839-23964 | 应用 | deep link 队列管理 | `Ck()`：open-url/argv/协议注册/待处理队列 flush |
| 23965-24004 | 应用 | Chromium 开关 & userData | `wk()`（`CODEX_ELECTRON_CHROMIUM_SWITCHES` JSON）、`Tk()`（userData 路径）、`Ek()`（.app bundle 路径） |
| 24001-24092 | 应用 | 旧版 ChatGPT.app 迁移 | `Dk/Ok/kk/Ak/jk/Mk/Nk`：codesign 校验、launchctl bootout、rename |
| 24092-24586 | 应用 | DMG 安装器流程 | `Pk~Rk/zk`、`Bk()`（**Applications 安装 gate**）、`Vk/Hk/Uk/Wk/Gk/Kk`（安装窗口、ditto 复制、open）、`cA()`（内嵌安装窗口 HTML/CSS/JS，24511-24585） |
| 24587-24590 | 应用 | 路径包含判断 | `lA()` |
| 24591-24600 | 应用 | Owl UA 开关 | `uA/dA/fA()`（packaged 时的 owl-scoped-user-agent） |
| 24601-24625 | 应用 | Dock tile 修复 | `pA/mA/hA/gA()`：launch-services-helper |
| 24626-24839 | 应用 | SQLite 恢复流程 | `_A~CA` 常量、`wA/TA/EA/DA/OA/kA/AA/jA/MA/NA/PA/FA/IA/LA/RA/zA/BA/VA/HA/UA/WA/GA`：state db 打不开时 Retry/BackUp-and-Rebuild 对话框 + 备份迁移 |
| 24840-24851 | 应用 | window-all-closed | `KA/qA()/JA()`（`qA` 在 25389 被调用） |
| 24852-24865 | 应用 | Windows contained core gate | `YA()`（读 codexWindowsAppContainedCore）、`XA()`（`n.Hn` 注册 core） |
| 24866-24899 | 应用 | OEM Custom.data | `ZA/QA/$A()`：microsoft.system.package.metadata 读取 |
| 24900-24919 | 应用 | 更新错误分类 | `ej` zod、`$` class（reason/httpStatus）、`tj()` |
| 24920-25303 | 应用 | Windows 主运行时框架 | `nj/rj/ij/aj` 常量、`oj/sj/cj`（顶层可变状态：pinned 包、enabled 标志、listeners）、`lj/uj/dj/fj/pj/mj/hj/bj/_j/xj/Sj/Cj`：PrimaryRuntime 框架下载/安装/激活 |
| 25304-25323 | 应用 | 框架校验工具 | `xj/Sj/Cj`（身份校验、family 名、HTTPS 校验） |
| 25324-25329 | 应用 | 常量 | `wj`（WebRTC field trials）、`Tj`（更新对话框按钮文案） |
| 25330-25331 | **副作用** | Owl shell 断言 | `if (process.versions.electron != null && typeof o.app.showTaskManager != 'function') throw` |
| 25332-25366 | 应用 | 启动失败对话框 | `Ej(e)`：Install Update / Check for Updates / Quit |
| 25367-25377 | **副作用** | 启动配置快照 | `Dj/Oj/kj/Aj`（读 flavor、windows distribution、版本） |
| 25378-25411 | **副作用** | 命令行开关 | 见 §5 |
| 25412-25493 | **副作用** | 引导主流程 | 单实例锁 → whenReady → FD → Intel 警告 → Bk → EA → Windows gates → sparkle init → 动态 require `./main-C-Mhak1n.js` → 失败兜底 |
| 25494-25626 | 应用 | exports 表 | 全部导出重命名映射（含一个 `Object.defineProperty` getter，25494-25599） |

---

## 2. vendored 库识别

| 包 | 版本 | 行区间 | 证据 |
|---|---|---|---|
| mime-db | （数据无版本号；约 2024 版，含 `application/3gpphal+json` 等新类型） | 434-3240 | `Qe = e.n(() => { Ze = { "application/1d-interleaved-parityfec": … } })`；IANA/apache source 字段结构 |
| mime-types | （与 mime-db 配套，~2.1.x） | 3241-3317 | `et` 惰性模块导出 `charset/charsets/contentType/extension/extensions/lookup/types`；`r = /^\s*([^;\s]*)(?:;|\s|$)/`（3247）与 mime-types 源码一致的优先级表 `["nginx","apache",undefined,"iana"]`（3287） |
| @opentelemetry/api | 1.9.0 | 3931-5170 | `e.VERSION = '1.9.0'`（3987）；`Symbol.for('opentelemetry.js.api.1')`（4036）；DiagAPI/BaggageImpl/propagation 结构 |
| @opentelemetry/core（+ sdk-trace 相关片段） | （PR `Pr` 未直接标注；与 api 1.9.0 同代，~2.x） | 5171-9390 | W3CBaggagePropagator（5236）、`hrTime`（7510-7565）、semconv 常量 `METRIC_*`（7350-7448）、`ATTR_TELEMETRY_SDK_NAME: 'opentelemetry'`（7498）；CompositePropagator（7579）；日志桥 `F`（8074） |
| semver（+ semver/functions 子集） | ~7.x | 8386-8518 | 完整 semver regex（8496）、范围比较逻辑、`No` hyphen/tilde/caret 展开（8442-8470）；特征 `(?<version>(?<major>0|[1-9]\d*)\.(?<minor>…)` |
| shimmer | ~0.5.x | 8555-8599 | `__original/__unwrap/__wrap` patch 模式（8546-8550）；`is/as/os/ss` 与 require('shimmer') 源码逐行一致 |
| @sentry/core | 10.29.0 | 9391-15866 | `Gs = '10.29.0'`（9387）；`__SENTRY__.version`（9391-9398）；`Xs = 'Sentry Logger '`（9402）；`/sentryWrapped/`（9484）；`t.version = t.version || '10.29.0'` |
| @sentry/node | 10.29.0 | 15867-16891 | `ry`（15856）base64 开头解码为 `// @sentry/node-core 10.29.0 (3529d46) | https://github.com/getsentry/sentry-javascript *`（LocalVariables worker 脚本） |
| @sentry/opentelemetry（node） | 10.29.0 | 16860-16916（+14597 `o_` class extends `ar`） | `@sentry/opentelemetry`, `10.29.0` 字符串（14768 getTracer） |
| @opentelemetry/instrumentation-undici | 0.19.0 | 16584-16860 | `e.PACKAGE_VERSION = '0.19.0'`、`e.PACKAGE_NAME = '@opentelemetry/instrumentation-undici'`（16585-16586） |
| @sentry/electron | 7.5.0 | 16931-18907 | `ob = '7.5.0'`、`sb = 'sentry.javascript.electron'`（17088-17089）；ElectronBreadcrumbs/SentryMinidump/MainProcessSession 集成名与 sentry-electron 7.x 一致；`sentry-electron-renderer-id`（17129） |
| TS `using` 降级 helper（tslib 风格，编译器注入） | — | 18917-18976 | `SuppressedError`/`Symbol.asyncDispose` polyfill（18919-18933） |
| lodash（clamp 等单函数） | 4.x | 21993-22015 | `aE`/`oE` 两个 `e.t()` CJS 模块，与 lodash `clamp`/`numberToNaN` 实现一致 |
| OTLP JSON exporter（@opentelemetry/otlp-transformer 片段或应用内实现） | 待确认 | 22851-23027 | `pO.serializeRequest/deserializeResponse`、`useLongBits`、resourceSpans 结构 |

注意：**任务描述中猜测 3736 行 `function j(...)` 是 glob/路径匹配库——不成立**。它只是「从候选 package.json 读取字符串字段」的小工具（3736-3747，调用方 3771 `j('codexBuildFlavor')`、25376 `j('codexBuildCommit')` 等）。文件中没有 picomatch/zip 库特征。

---

## 3. 应用代码子系统聚类

> 建议模块名均为 kebab-case；「定义」列出该区间的关键顶层绑定（minified 名 → 建议语义名）。

### A. 基础设施

| 聚类 | 行区间 | 建议模块 | 主要定义 |
|---|---|---|---|
| breadcrumb 截断 | 77-129 + 91-93 | `sentry/breadcrumb-truncation` | `pe`(beforeBreadcrumb), `he`, `ge`, `me`(releaseName), 常量 `ce/le/ue/de` |
| TOML 设置编解码 | 130-188 | `settings/toml-codec` | `ye`(toJson), `be`(fromJson), `xe/Se/k/Ce` |
| 启动阶段状态机 | 189-254 | `startup/startup-phases` | `we`(PHASES), `Te`(StartupPhases), `Ee` |
| 错误上报门面 | 255-268 | `telemetry/error-reporter` | `De`(noopReporter), `Oe`(createErrorReporter) |
| 日志级别 | 269-300 | `logging/log-level` | `ke/Ae/je/Me` |
| NativeIntl | 301-433 | `intl/native-intl` | `oe/ve? no`(Ve schema), `A/He`(state), `Ue`(configureNativeIntl), `We`(requireNativeIntl), `Ge`(NativeIntl), `Ke/qe/Je/Ye`(intel warning) |
| app:// 协议 | 3318-3514 | `protocol/app-protocol` | `nt~Dt` + `lt`(registerPrivilegedSchemes), `ut`(webviewDir), `ft`(rendererUrl), `ht`(installAppProtocolHandler) |
| 网络策略 | 3515-3734 | `net/network-policy` | `Ot`(sessionId), `kt/At/jt/Mt`, `Nt`(NetworkPolicy class), `Pt`(packageJsonCandidates) |
| 包元数据 | 3725-3747 | `metadata/package-metadata` | `Pt`, `j`(readPackageMetadata) |
| build flavor | 3748-3867 | `build-info/build-flavor` | `Ft/It/Lt/M`(BuildFlavor 对象), `Ht`(bundleIdentifier), `Rt/zt/Bt/Vt` |
| build number / appcast state | 3868-3930 | `build-info/build-number` + `updater/production-appcast-state` | `Ut/Wt/Gt/Kt`, `qt/Jt/Yt`(ProductionAppcastState) |
| deepEqual 工具 | 19554 (`XC`) | `util/deep-equal` | `XC`（`n.Ld()` interop，全文件比较用） |

### B. 遥测（Sentry / OTel / 日志 / Datadog）

| 聚类 | 行区间 | 建议模块 | 主要定义 |
|---|---|---|---|
| desktop Sentry init | 19124-19267 | `telemetry/desktop-sentry` | `xC/SC/CC/TC/EC/DC/OC`, `kC`(initDesktopSentry), `AC`(pruneOversizedScope), `jC`(reportLaunchFailures) |
| Owl crash counter | 18977-19123 | `telemetry/owl-crash-counter` | `nC/rC/iC/aC/oC/sC/cC/lC/uC~yC`, `mC`(makeMinidumpBeforeSend) |
| 文件日志 | 19228-19553 | `logging/file-logger` | `MC`(defaultLogRoot), `NC~LC`, `RC/VC/HC/UC/WC/GC/KC/qC/JC/YC` |
| OTel tracing 装配 | 23028-23187 + 22864-23027 | `telemetry/otel-tracing` | `pO`(OTLP serializer), `mO/hO/gO/_O/vO/yO`(state), `xO`(setupTracing), `SO/CO/wO/TO/EO/DO/OO`, `kO`(bindWebsiteReporting) |

### C. 更新管理

| 聚类 | 行区间 | 建议模块 | 主要定义 |
|---|---|---|---|
| Linux 包更新器 | 19554-19633 | `updater/linux-package-updater` | `ZC/QC/ew`(LinuxPackageUpdater), `tw/nw/rw` |
| Owl relaunch 策略 | 19634-19738 | `updater/relaunch-policy` | `iw~cw`, `uw/dw/fw`, `pw/mw/hw/gw/_w/vw/yw/bw/xw/Sw/Cw/ww` |
| production appcast URL | 19886-19937 | `updater/backend-appcast` | `mT/hT/gT/_T/vT/yT/bT/xT` |
| Windows MSIX 更新器 | 19943-20423 | `updater/windows-msix-updater` | `ST/CT/wT/TT/DT/OT/yT/bT/xT` |
| Windows Store 更新器 | 20424-20877 | `updater/windows-store-updater` | `kT/AT/jT/MT/NT/PT/FT/IT` |
| Windows 组合更新器 | 20878-20990 | `updater/windows-combined-updater` | `LT` |
| SparkleManager（统一门面） | 20991-21869 | `updater/sparkle-manager` | `RT/zT~WT/GT/KT`(SparkleManager), `qT/JT` |
| 启动失败对话框 | 25324-25366 | `updater/startup-failure-dialog` | `wj/Tj`, `Ej` |

### D. 状态与设置

| 聚类 | 行区间 | 建议模块 | 主要定义 |
|---|---|---|---|
| 表单填充遥测 | 21863-21992 | `state/browser-auth-operations` | `YT/XT/ZT/QT/$T/eE/tE`, `nE/rE/iE` |
| 窗口放置吸附 | 22016-22121 | `window/placement-snapping` | `cE/lE/uE/dE/fE/pE/mE/hE/gE/_E/vE/yE`（lodash `sE` 除外） |
| GlobalState | 22122-22516 | `state/global-state` | `bE~XE`(STATE_KEYS), `ZE/QE/eD~sD/cD`, `lD`(GlobalState), `uD~yD`, `bD`(applyTheme) |
| SettingsStore | 22517-22762 | `settings/settings-store` | `xD/SD/CD/wD/TD/ED`, `DD/OD/kD/AD/jD/MD` |
| 启动环境装配 | 22763-22850 | `startup/startup-context` | `ND/PD/FD/ID/LD/RD/zD/BD`(createStartupContext), `VD`(StartupChanges) |

### E. deep link / IPC

| 聚类 | 行区间 | 建议模块 | 主要定义 |
|---|---|---|---|
| IPC 频道名 & API 端点 | 19739-19793 | `ipc/channels` + `api/endpoints` | `Tw~Yw/Xw/Zw/Qw/$w/eT` |
| 后端认证请求 | 19778-19886 | `api/authed-fetch` | `tT/nT/rT/iT/aT/oT/sT/cT/lT/uT/dT/fT/pT` |
| deep link 解析 | 23362-23864 | `deeplinks/parse` | `MO~QO/$O/Z/Q/ek/tk/nk~xk/ok/sk/ck` |
| deep link 队列 | 23836-23964 | `deeplinks/manager` | `Sk`(needsSingleInstanceLock), `Ck`(createDeepLinkManager) |
| URL 白名单 | 23362-23378 | `net/url-gate` | `MO/NO/PO/FO` |

### F. 平台/安装 gate

| 聚类 | 行区间 | 建议模块 | 主要定义 |
|---|---|---|---|
| Chromium 开关 & userData | 23965-24004 | `startup/command-line` + `startup/user-data` | `wk`, `Tk`, `Ek` |
| 旧版 ChatGPT.app 迁移 | 24001-24092 | `platform/legacy-chatgpt-relocation` | `Dk/Ok/kk/Ak/jk/Mk/Nk` |
| DMG 安装器 | 24092-24590 | `platform/applications-installer` | `Pk~Rk/zk/Bk/Vk/Hk/Uk/Wk/Gk/Kk/qk/Jk/Yk/Xk/Zk/Qk/$k/eA/tA/nA/rA/iA/aA/oA/sA/cA/lA` |
| Owl UA / Dock tile | 24591-24625 | `platform/owl-tweaks` | `uA/dA/fA`, `pA/mA/hA/gA` |
| SQLite 恢复 | 24626-24839 | `platform/sqlite-recovery` | `_A~CA`, `wA/TA/EA/DA/~GA` |
| window-all-closed | 24840-24851 | `app/window-all-closed` | `KA/qA/JA` |
| Windows contained core | 24852-24899 | `platform/windows-oem` | `YA/XA/ZA/QA/$A` |
| 更新错误分类 | 24900-24950 | `updater/update-errors` | `ej/$/tj` |
| Windows 主运行时框架 | 24920-25323 | `platform/windows-runtime-framework` | `nj/rj/ij/aj/oj/sj/cj/lj/uj/dj/fj/pj/mj/hj/bj/_j/xj/Sj/Cj` |
| Intel 警告（见 A） | 370-433 | `platform/intel-launch-warning` | `Ke/qe/Je` |

### G. 核心

| 聚类 | 行区间 | 建议模块 | 主要定义 |
|---|---|---|---|
| jO 装配（composition root） | 23201-23361 | `startup/desktop-runtime` | `AO`(singleton), `jO`(createDesktopRuntime)：网络策略、Sentry、OTel、Datadog、日志、协议注册、SparkleManager、second-instance 队列 |
| 引导主流程 | 25330-25493 | `main.ts`（bootstrap 入口） | `Dj/Oj/kj/Aj/Mj`, `Ej`, 尾部 whenReady 流程 |

---

## 4. 顶层可变状态清单

> `var/let` 且非函数/类/常量字面量，或明显是惰性占位的绑定。拆模块时这些必须放进独立 state 模块或作为类成员。

| 名 | 行号 | 语义 | 读写方 |
|---|---|---|---|
| `A` | 310 | NativeIntl 当前缓存（repoRoot/locale/nativeIntl） | `Ue/We`（intl 模块） |
| `He` | 311 | `Ue` 的调用代际计数 | `Ue` |
| `Ut` | 3868 | build number 懒缓存（`void 0`=未读） | `Kt.value`（getter），`Gt` |
| `Zy` | 16931 | webContentsId → {id,url,title} 映射（Sentry breadcrumbs） | `Qy/$y`（vendored sentry-electron，建议整块保留） |
| `Mb` | 17287 | Sentry session store（`kb` 实例） | `Pb/Fb/Lb/Rb/zb/Vb/Hb` |
| `Nb` | 17288 | session 读取 promise | `Pb/zb/Vb` |
| `Ib` | 17299 | session 定时器句柄 | `Lb/Rb/Hb` |
| `Bx` | 18106 | renderer profile 缓存（`Ph` LRU） | `Vx/Hx` |
| `jS` | 18624 | launch context tags 缓存 | `MS` |
| `NS` | 18637 | 已注册 renderer id set | `FS/GS/WS` |
| `PS` | 18637 | rendererId → webContentsId map | `FS/WS` |
| `LS` | 18666 | DSN publicKey 缓存 | `RS` |
| `rC` | 18978 | Owl crash counter 当前 delivery 回调 | `oC/cC/lC` |
| `iC` | 18979 | delivery in-flight 标志 | `lC` |
| `aC` | 18980 | 累计 crash 计数 | `sC/lC` |
| `TC` | 19156 | Sentry ready `Promise.withResolvers()` | `kC`（resolve） |
| `EC` | 19157 | 同上 promise | 导出（供等待） |
| `DC` | 19158 | captureException/captureMessage/setUser 门面（**初始化前**为局部对象，`kC` 后由 `QS` 全局替换语义） | `jO` 内 `Oe`、`oC`、`RS` |
| `OC` | 19159-19166 | **模块加载即求值**的 Sentry 启动配置快照（sessionId `Ot`、buildFlavor `M.resolve()`、buildNumber `Kt.value`、appVersion `o.app.getVersion()`、traceSampleRate、dsn） | `kC`、`xO` |
| `HC` | 19288 | file-logger 实例序号 | `UC` |
| `KA` | 24840 | window-all-closed 的自定义检查（默认 `() => false`） | `qA/JA` |
| `oj` | 24955 | pinned framework 包缓存（Map） | `gj/_j`（windows-runtime-framework） |
| `sj` | 24956 | primary runtime frameworks enabled 标志 | `lj/uj/pj` |
| `cj` | 24957 | enabled 变更监听器集合 | `uj/dj` |
| `mO` | 23029 | 全局 propagator 实例（OTel） | `xO`、`n.na` 回调 |
| `hO` | 23030 | trace exporter 回调 | `SO/EO` |
| `gO` | 23031 | NodeTracerProvider 实例 | `xO/DO` |
| `_O` | 23032 | 当前 sampler | `xO/CO` |
| `vO` | 23033 | trace 采样率 | `CO/wO/TO` |
| `yO` | 23034 | 是否 electron-main 进程标志 | `xO/EO` |
| `AO` | 23201 | **jO() 单例**（整个 desktop runtime 装配结果） | `jO`（唯一写方），`Ej`/尾部主流程读 `sparkleManager` 等 |
| `Dj/Oj/kj/Aj/Mj` | 25367-25404 | 引导主流程的配置快照（isMacOS、buildFlavor、windows flavor、版本元数据、needsLock） | 尾部主流程 |

类内静态可变状态（同样需要注意）：`Kt.value`（3879-3883 getter 懒加载 build number）。

---

## 5. 顶层副作用序列

非声明的顶层语句（按行号；`e.n(()=>{...})` 声明的惰性 init 不算，列出的是**模块加载即执行**的调用）：

| 行号 | 语句 | 语义 |
|---|---|---|
| 2-40 | 一系列 `require` + `e.a()` interop | 加载 chunk 依赖（rolldown runtime、shared chunks、electron、node 内置） |
| 25330-25331 | `if (process.versions.electron != null && typeof o.app.showTaskManager != 'function') throw Error('Codex requires the Owl app shell…')` | **Owl shell 断言**：必须在带 Owl 补丁的 Electron 里运行 |
| 25367-25377 | `var Dj = process.platform === 'darwin', Oj = M.resolve(), kj = …, Aj = {appVersion, buildFlavor, buildCommit}` | 读 build flavor（env `BUILD_FLAVOR` → package.json `codexBuildFlavor` → NODE_ENV 默认）、Windows 分发 flavor、版本元数据 |
| 25378-25379 | `for (let e of wk({buildFlavor: Oj, env: process.env})) o.app.commandLine.appendSwitch(e.name, e.value)` | 应用 dev-only Chromium 开关（`CODEX_ELECTRON_CHROMIUM_SWITCHES` JSON） |
| 25380 | `o.app.commandLine.appendSwitch('force-fieldtrials', wj)` | WebRTC DTLS1.3 field trials |
| 25381-25382 | `for (let e of fA({isPackaged})) …appendSwitch` | Owl scoped user-agent 开关（packaged 时） |
| 25383-25388 | `jj`（disable-blink-features set）→ add `ReplacedNormalFlowStackingInlinePaint` → remove/appendSwitch | Blink 特性禁用 |
| 25389 | `qC()` | stdout/stderr 挂 EPIPE/EBADF 容忍的 error handler（`__codexIgnoreConsoleWriteErrors`） |
| 25390 | `qA()` | `app.on('window-all-closed')`：非 Windows 下 quit |
| 25391 | `o.app.setName(n.zo(kj))` | 按 flavor 设置应用名 |
| 25392-25395 | `o.app.setPath('userData', Tk({appDataPath, buildFlavor: kj, env}))` | userData 路径（`Codex` / `Codex (flavor)` / agent run id） |
| 25396-25399 | win32 时：`delete process.env.CODEX_WINDOWS_REGISTERED_CORE/CODEX_WINDOWS_SANDBOX_PACKAGE_FAMILY`、`o.app.setAppUserModelId(Ht(kj))` | Windows 标识清理 |
| 25400-25404 | `var Mj = Sk({isMacOS: Dj, isPackaged, hasExplicitUserDataPath})` | 计算是否需要单实例锁 |
| 25405-25411 | `if (Mj && !o.app.requestSingleInstanceLock()) { log; o.app.exit(0) }` | **单实例锁**：第二实例直接退出 |
| 25413-25418 | `else` 分支：`mA() && log('Repaired renamed Dock tile')` | macOS Dock tile 修复（`launch-services-helper`） |
| 25419 | `let e = jO(Oj)` | **首次装配 desktop runtime**（触发 jO 全部内部副作用：Sentry init、OTel、Datadog、日志安装、`lt()` registerSchemesAsPrivileged、SparkleManager 构造） |
| 25420-25423 | `Mj && o.app.on('second-instance', (t,n) => e.queueSecondInstanceArgs(n))` | 第二实例 argv 转发队列 |
| 25424-25492 | `o.app.whenReady().then(async () => { … })` | **主启动流程**，逐步： |
| 25427 | `process.platform === 'win32' && o.app.isPackaged && (await FD())` | Windows home 目录标记（`.desktop-created`） |
| 25428-25439 | `!(await qe({appName, environment}))` → `o.app.quit(); return` | Intel-on-AppleSilicon 警告：用户选 Quit 则退出 |
| 25440 | `if ((await Bk()) \|\| !(await EA(Aj))) return` | ① `Bk()`：macOS Applications 安装 gate（DMG 首次安装/源 DMG 清理，安装成功则旧实例 quit）；② `EA(Aj)`：SQLite state runtime 打开 + 损坏恢复（Retry/Rebuild 对话框），失败返回 false |
| 25441-25457 | `a = YA()`（Windows contained core）、`s = fj(Oj, platform)`（primary framework gate）、`c`；`a\|\|s` 时 `RD(ID(n.Oi()), (await $A()) != null)` → `c = e.core; n.Un(e.core); uj(e.primary)`（异常则回滚并 warning `windows_runtime_framework_gate_hydration_failed`） | Windows 运行时框架 gate 状态水化（global-state 开关 + OEM Custom.data） |
| 25458-25463 | `l = {phase: 'bootstrap-import-main'}`；`a` 时读 `OT()?.getCurrentPackageFamily()` 写 `process.env.CODEX_WINDOWS_SANDBOX_PACKAGE_FAMILY` | 供 Sentry tag / sandbox 用 |
| 25464 | `await i.initialize()`（`i` = sparkleManager） | 更新器初始化（含 in-app updates policy 5 分钟超时） |
| 25464-25474 | `a && c && XA()`（注册 contained core）；`a \|\| s` 时 log `windows_core_runtime_launch_selected` | Windows core 启动选择 |
| 25475-25480 | `await pj({buildFlavor: Oj}).catch(… warning windows_primary_runtime_framework_activation_failed …)` | Windows PrimaryRuntime 框架激活 |
| 25481-25484 | `const {runMainAppStartup: e} = await Promise.resolve().then(() => require('./main-C-Mhak1n.js')); await e()` | **动态加载主应用 chunk**（真正的 app 启动逻辑在 main-C-Mhak1n.js） |
| 25485-25491 | catch 兜底：destroy 所有窗口、`error` log、`t.captureException`（desktopSentry）、`await i.startUpdaterAfterStartupFailure()`、`await Ej(e)`（失败对话框：Install Update / Check / Quit；win32 递归重试） | 启动失败恢复路径 |
| 25494-25626 | `exports.$ = kE …`（数百个导出赋值 + 1 个 `Object.defineProperty` getter `pn`） | chunk 导出表（供 main-C-Mhak1n.js 消费） |

此外，模块加载即求值但**非语句**的状态初始化（容易漏）：

- 3515 `var Ot = (0, d.randomUUID)()` — app session id
- 21980 `({...}).parse(n.Rf(nE))` — 一条丢弃结果的 zod schema 校验（疑似类型断言副作用，无运行时影响）
- 19159-19166 `OC` 初始化（读 `M.resolve()`、`Kt.value`、`o.app.getVersion()`、`process.env.CODEX_OTEL_TRACES_ENDPOINT`）
- 25367+ 的 `Dj/Oj/kj/Aj/Mj`
- 24956 `sj = !1`（primary frameworks 默认关）

而 `Ws()`（13569、16513）与 `F()`（13603、13709、…、23028）是 rolldown 的**惰性模块 init 触发器**（`e.n(() => {...})` 包装的 memoized initializer），不是业务副作用——它们只保证对应 vendored 模块（@sentry/core / OTel）在使用前完成内部变量绑定。重写为正常 ESM 后这些调用整体消失。

---

## 6. 拆分方案

### 6.1 目录建议

```
src/main/
  main.ts                        # §5 的引导主流程（25330-25493），唯一副作用入口
  desktop-runtime.ts             # jO() composition root（23201-23361）
  vendored/                      # 不重写，直接搬或 npm 依赖（见 6.2）
  build-info/                    # build-flavor / build-number / package-metadata / production-appcast-state
  protocol/                      # app-protocol（mime-types 依赖）
  net/                           # network-policy / url-gate
  intl/                          # native-intl / intel-launch-warning
  telemetry/                     # desktop-sentry / owl-crash-counter / otel-tracing
  logging/                       # file-logger / log-level
  updater/                       # sparkle-manager / windows-* / linux-package-updater / relaunch-policy / backend-appcast / update-errors / startup-failure-dialog
  state/                         # global-state / browser-auth-operations
  settings/                      # settings-store / toml-codec
  deeplinks/                     # parse / manager
  platform/                      # applications-installer / legacy-chatgpt-relocation / sqlite-recovery / windows-runtime-framework / windows-oem / owl-tweaks
  ipc/                           # channels
  api/                           # endpoints / authed-fetch
  window/                        # placement-snapping
  startup/                       # startup-context / startup-phases / command-line / user-data / window-all-closed
  util/                          # deep-equal / misc（te/re/ie/ae）
```

### 6.2 vendored 处理策略（强烈建议）

约 **14,900 行（58%）是 vendored 代码**（mime-db/mime-types/OTel api+core/semver/shimmer/@sentry core+node+electron+opentelemetry/undici instrumentation/lodash/OTLP）。这些不应参与逆向重写，而应：

1. 直接 `npm install` 对应版本：`mime-db`、`mime-types`、`@opentelemetry/api@1.9.0`、`@opentelemetry/core`、`@opentelemetry/instrumentation-undici@0.19.0`、`@sentry/electron@7.5.0`（会带入 @sentry/core/node 10.29.0）、`semver`、`lodash`。
2. 若打包体积/行为需对齐，再考虑保留 vendored 副本。`tC()`（TS using helper）与 shimmer 若无依赖可直接抄源。
3. 需要人工核对 @sentry/electron 7.5.0 与官方发布的 diff（`kC` 里对默认集成列表做了过滤：去掉 `ChildProcess/Console/SentryMinidump/ElectronMinidump`，换成自带的 `mx/Ix/wh/xh` 组合，19190-19212）。

### 6.3 应用代码模块表（行区间 → 目标模块，估算行数）

| # | 行区间 | 模块 | 约行数 |
|---|---|---|---|
| 1 | 41-404（去 vendored 无） | `util/misc.ts` + `deeplinks/codex-url.ts`（`te`）+ `sentry/breadcrumb-truncation.ts` + `settings/toml-codec.ts` | ~380 |
| 2 | 189-268 | `startup/startup-phases.ts` + `telemetry/error-reporter.ts` | ~80 |
| 3 | 269-433 | `logging/log-level.ts` + `intl/native-intel.ts` + `platform/intel-launch-warning.ts` | ~165 |
| 4 | 3318-3514 | `protocol/app-protocol.ts`（+ 安装 mime-types 依赖） | ~200 |
| 5 | 3515-3747 | `net/network-policy.ts` + `metadata/package-metadata.ts` | ~230 |
| 6 | 3748-3930 | `build-info/build-flavor.ts` + `build-info/build-number.ts` + `updater/production-appcast-state.ts` | ~180 |
| 7 | 18977-19267 | `telemetry/owl-crash-counter.ts` + `telemetry/desktop-sentry.ts` | ~290 |
| 8 | 19228-19553 | `logging/file-logger.ts` | ~325 |
| 9 | 19554-19738 | `updater/linux-package-updater.ts` + `updater/relaunch-policy.ts` | ~185 |
| 10 | 19739-19886 | `ipc/channels.ts` + `api/endpoints.ts` + `api/authed-fetch.ts` | ~150 |
| 11 | 19886-19942 | `updater/backend-appcast.ts` | ~55 |
| 12 | 19943-20990 | `updater/windows-msix-updater.ts` / `windows-store-updater.ts` / `windows-combined-updater.ts`（三个文件，各 ~400/~400/~110） | ~1050 |
| 13 | 20991-21869 | `updater/sparkle-manager.ts` | ~880 |
| 14 | 21863-21992 | `state/browser-auth-operations.ts` | ~130 |
| 15 | 22016-22121 | `window/placement-snapping.ts` | ~105 |
| 16 | 22122-22516 | `state/global-state.ts` | ~395 |
| 17 | 22517-22762 | `settings/settings-store.ts` | ~245 |
| 18 | 22763-22863 | `startup/startup-context.ts` + `startup/startup-changes.ts` | ~100 |
| 19 | 23028-23200 | `telemetry/otel-tracing.ts` | ~175 |
| 20 | 23201-23361 | `desktop-runtime.ts` | ~160 |
| 21 | 23362-23964 | `deeplinks/parse.ts` + `deeplinks/manager.ts` + `net/url-gate.ts` | ~600 |
| 22 | 23965-24004 | `startup/command-line.ts` + `startup/user-data.ts` | ~40 |
| 23 | 24001-24590 | `platform/applications-installer.ts`（含内嵌 HTML `cA`，可拆 `installer-window.html.ts`）+ `platform/legacy-chatgpt-relocation.ts` | ~590 |
| 24 | 24591-24625 | `platform/owl-tweaks.ts` | ~35 |
| 25 | 24626-24899 | `platform/sqlite-recovery.ts` + `platform/windows-oem.ts` + `app/window-all-closed.ts` | ~270 |
| 26 | 24900-25323 | `platform/windows-runtime-framework.ts` + `updater/update-errors.ts` | ~420 |
| 27 | 25324-25493 | `main.ts`（引导主流程）+ `updater/startup-failure-dialog.ts` | ~170 |

每个模块均 ≤ ~900 行（SparkleManager 880 是最大块，可再按 platform-init/relaunch-policy 拆两半），满足 ≤1500 行约束。

### 6.4 依赖方向（目标：单向、无环）

```
main.ts
  → desktop-runtime → { telemetry/*, logging/*, updater/sparkle-manager,
                        protocol/app-protocol, net/network-policy, startup/* }
telemetry/desktop-sentry → { build-info, telemetry/owl-crash-counter, vendored sentry }
updater/sparkle-manager → { build-info, updater/windows-*, updater/linux-*, updater/backend-appcast }
state/global-state → （无内部依赖，仅 zod + logger chunk）
settings/settings-store → { state/global-state, settings/toml-codec, build-info/package-metadata }
deeplinks/* → { build-info/build-flavor（$O 读 isPackaged 判断 codex vs codex-dev）, api/endpoints }
platform/* → { build-info, util }
startup/startup-context → { state/global-state, settings/settings-store, net/network-policy }
```

### 6.5 风险点

1. **初始化顺序敏感（最大风险）**：
   - `o.app.setName` / `setPath('userData')`（25391-25395）必须发生在任何 `o.app.getPath('userData')` 调用之前——而 `jO()`（25419）内部就会创建 `Yt`（production appcast store，23287 读 `getPath('appData')`）和 `AC()`（19224 读 `userData`）。当前顺序是先 setName/setPath 再 jO，拆分后必须保持。
   - `lt()`（registerSchemesAsPrivileged）在 `jO()` 内（23267），而 Sentry 的 `WS()`（18738，Protocol IPC 模式时）也会调 `registerSchemesAsPrivileged` 并将其 Proxy 化——本项目用 `ipcMode: fb.Classic`（19181），不走 Protocol 路径，但重写时别引入顺序依赖。
   - `qC()`/`qA()`（25389-25390）在 command line append 之后、whenReady 之前；`wj` field trials 必须在 app ready 前生效。
   - `OC`（19159）在**模块加载时**读 `M.resolve()`/`o.app.getVersion()`——拆分后若该模块先于 userData 设置被 import，仍只是读版本，无顺序问题；但 `M.resolve()` 会触发 build-flavor 日志，注意 import 顺序变化会改变日志时序。
2. **循环引用风险**：
   - `build-info/build-flavor` ⇄ `updater/*`：`M.shouldIncludeSparkle` 被 SparkleManager 用，而 SparkleManager 构造在 `jO`；`updater/backend-appcast` 用 `api/authed-fetch` 的 `rT`（19886 `_T` 调 `rT`）而 `api/authed-fetch` 又引用 `build-flavor`（无环，但 `updater` → `api` → `build-info` 与 `updater` → `build-info` 形成扇形，注意别让 `api` 反向 import `updater`）。
   - `telemetry/desktop-sentry` 与 `net/network-policy`：`kC(e, t)` 接收 network policy 实例（transport `SC(t)` 用 `t.fetch`），`jO` 里先建 policy 再 init Sentry——方向单一，但 `owl-crash-counter` 的 `oC` class extends `n.Uf` 并被 sentry 的 beforeSend (`mC`) 读取，两模块互相不 import 即可（通过参数传递）。
   - `state/global-state` 是被 `startup-context`、`settings-store`、`windows-runtime-framework`、`deeplinks`（`TE` 键）多方读写的共享底座——必须保持零内部依赖（仅 zod + logger），否则成环。
3. **`jO()` 单例与回调注入**：`setSparkleBridgeHandlers`/`setSecondInstanceArgsHandler`（23335-23357）是 main chunk（main-C-Mhak1n.js）反向注入回调的口子。重写时应显式化为接口（如 `DesktopRuntime` 类型导出），不能改成构造参数（主流程必须先有单例才能 queue second-instance args）。
4. **懒求值语义丢失**：`Kt.value`（3881）、`Ot`、`OC` 等依赖「第一次读取时的进程状态」。特别是 `Kt.value` 在 `OC` 构造与 `jO` 内（23263 buildInfo）各读一次；保持懒 getter。
5. **vendored 边界误伤**：@sentry/electron 区间（16931-18907）里混着**应用定制**——`oC`/`sC`/`cC`/`lC`/`mC`（Owl crash counter + beforeSend，18977-19123）和 `kC`（desktop init，19167-19222）是应用代码，提取时别随 npm 包一起丢。
6. **`t`（desktop-open-path-queue chunk）仅在 24953 使用**（`t.a()`，macOS `open-url` 初始 argv）。拆分后该依赖归 `deeplinks/manager`。
7. **win32/linux 专属路径难本地验证**：Windows 更新器（~1000 行）、runtime framework（~400 行）依赖 native addon（`windows-updater.node`）与 MSIX API，macOS 环境只能做静态重写 + 类型检查，运行时行为待确认。
8. **exports 表是外部契约**：25494-25626 的导出被 main-C-Mhak1n.js 按短名消费。重写后 main chunk 也要同步重写，导出面（`desktopSentry`、`sparkleManager` 等）需要一份映射清单（可先机械导出，后续语义化）。

### 待确认清单

- shared chunk `src-DldfpmrL.js` 的导出映射（`n.cu/n.Of/n.wf/…`）——建议下一个任务分析该文件。
- `main-C-Mhak1n.js` 对本 chunk exports 的实际消费集。
- `kt = '0.154.0-alpha.1'`（3516）是 app-server 的 min 版本字符串，具体语义待 app-server 侧确认。
- @opentelemetry/core 与 OTLP 序列化（22851-23027）是否为官方 `@opentelemetry/otlp-transformer` 的裁剪版（未发现版本串）。
- `process._linkedBinding('electron_browser_owl_update_policies')`、`o.app.showTaskManager` 等 Owl 专有补丁面——需要一份 Owl shell 的 API 清单。
