# Main chunk 全量覆盖审计

## 已抽取边界

当前已有可执行语义 helper 接回 main 入口：delegation/account helpers
（入口早期工具带）以及 URL trust predicates（原 172,625-172,665，对应
`main-app/util/url-trust.ts`）。两者均保留原别名调用面并有行为断言；表中
其余 `semantic/business` 区段仍表示待继续物理迁出或已由既有模块覆盖。

worker-main session 的非空对象判定（原 `V9`，174,295）已迁移至
`main-app/worker/rpc-message-predicates.ts`，入口保留兼容别名；RPC predicate focused
suite 新增 4 项对象形状断言。

app 协议 URL 的内部 frame 与协议判定（原 `nst/F9`，173,804-173,817）已迁移至同一
`main-app/util/url-trust.ts`，入口仅保留兼容委托；URL trust focused suite 新增 5 项断言。
webview 入口文件路径计算（原 `tst`，173,782）已迁移至
`bootstrap/protocol/app-protocol.ts`，由 `scripts/test-main-webview-entry-path.mjs`
覆盖 3 项路径断言。

窗口错误页 HTML 模板（原 `Pot`，172,619-172,637）已迁移至
`src/main/main-app/window/error-page-html.ts`，应用名通过参数注入；由
`scripts/test-main-window-error-page.mjs` 覆盖 4 项模板断言。
renderer 崩溃恢复的纯判定（原窗口管理器方法内联，173,740-173,758）已迁移至
`main-app/window/renderer-recovery-policy.ts`；reload、timer 和错误日志副作用仍保留在入口，
由 6 项 focused 断言覆盖。
renderer dev-origin、app/file webview entry 与 sender-frame trust 判定已迁移至
`src/main/main-app/window/renderer-frame-trust.ts`；入口仅保留 Electron sender/moduleDir 适配，
由 `scripts/test-main-renderer-frame-trust.mjs` 覆盖 11 项 URL、origin、frame identity 断言。

线程 metadata 的 emoji 校验和不可变更新（原 172,689-172,708）已迁移至
`src/main/main-app/thread-metadata.ts`，入口通过 `Aot`/`jot` 兼容别名接回，
由 `scripts/test-main-thread-metadata.mjs` 覆盖。

窗口外观策略（原 173,919-174,081）中的 overlay 判定、平台/尺寸策略、背景材质、
vibrancy、frameless options 已迁移至 `src/main/main-app/window-appearance.ts`；
原入口通过 `I9/rst/ist/ast/ost/sst/L9/cst/R9` 兼容调用，system theme 归一化也已迁移；几何相关的 `A9/j9`
仍保留在入口，另已迁出 `A9` traffic-light geometry 和 `j9` title-bar overlay，行为由
`scripts/test-main-window-appearance.mjs` 覆盖。
BrowserWindow appearance options 的纯策略（原 `z9`）也已迁移到同一模块，入口保留兼容委托。

审计对象：`.reference/originals/main/main-C-Mhak1n.ts`（原始 main chunk）。

## 结论摘要

- 初始审计基线 `wc -l` 为 **176,978 行**；截至 2026-10-06 当前原始入口为 **176,438 行**（已物理删除 540 行语义实现）。下表区间沿用基线行号作为证据索引；继续抽取时必须以当前符号/行为重新定位，不能把历史末行号当作当前文件行号。
- `semantic` 表示已有可读实现位于 `src/main/main-app/` 或 `src/main/shared/`，原始行只作为对照证据；`business-preserved` 表示已确认是业务代码但仍由 transform-only 原入口承载，需后续抽取；`vendor-preserved` 表示第三方库或其必要粘合层，保留原始实现；`generated` 表示 rolldown/CJS 包装器、导出表或不可单独赋予业务含义的生成代码。
- R1-R12 的逐段证据仍是本报告的依据：`docs/main-analysis-r1-r2.md`、`docs/main-analysis-r3.md` … `docs/main-analysis-r11-r12.md`。本报告把这些报告的局部表提升为全文件覆盖索引。
- 当前 `scripts/chunk-manifest.mjs` 仍将 `main` 标为 PRESERVED。因而表中 `semantic` 是“语义模块覆盖/对应关系”，不等于 main 原文件已经从构建中移除。

## 连续行区间映射

| 原始行区间 | 主分类 | 语义/保留归属 | 证据与当前边界 |
|---:|---|---|---|
| 1-952 | semantic/business | `main-app` 基础工具、线程/工作区、app-server 注册表 | R1-R2 §1；对应 `workspace/`、`threads/`、`conversation/`、`app-server/` |
| 953-2,411 | vendor-preserved | `@tanstack/query-core` v5 | R1-R2 §0/§1；`QueryClient`、`QueryCache`、`MutationCache` 完整库实现 |
| 2,412-19,112 | semantic/business | worktree/turn 锁、browser-use、artifact-session、插件市场、automations、native pipe、avatar/PIP | R1-R2 §1；对应 `workspace/`, `browser-use/`, `artifact-session/`, `plugins/`, `automations/`, `native-pipe/`, `avatar-overlay/` |
| 19,113-26,445 | vendor-preserved | `character-entities`、`parse-entities`、micromark GFM 扩展 | R1-R2 §1；R3 §0/§1；命名实体表和 `gfm()` 工厂均为上游库数据/代码 |
| 26,446-27,982 | semantic/business | markdown、thread/conversation 存储前置逻辑 | R3 §1/§3；对应 `markdown/`, `thread-catalog/`, `conversation/` |
| 27,983-28,626 | vendor-preserved | `immer` | R3 §2；`Symbol.for('immer-nothing')`、draft proxy、patch 插件 |
| 28,627-41,478 | semantic/business | conversation 状态、turn/item、审批、通知、归档 | R3 §1/§3；对应 `conversations/`, `turns/`, `requests/`, `notifications/`, `threads/` |
| 41,479-41,850 | vendor-preserved | lodash CJS 模块束 | R3 §2；`forEach/assign/getSymbolsIn/cloneBuffer` 等上游模块 |
| 41,851-44,555 | semantic/business | ThreadStore 门面、历史/fork/rollback、请求合成 | R3 §3；对应 `thread-catalog/`, `conversation/`, `requests/` |
| 44,556-47,355 | vendor-preserved | `marked`、`moo`、`alea`、`marked-directive` | R3 §2、R4 §0/§1；均有上游包特征和独立导出表 |
| 47,356-56,943 | semantic/business | conversation service 门面、认证/审批、流与实时录制 | R4 §1/§3；对应 `conversation/`, `auth/`, `requests/`, `streams/`, `realtime/` |
| 56,944-61,587 | vendor-preserved | `@statsig/js-client` v3.33.4 | R4 §0/§1、R5 §0；`StatsigClient`、`api.oaistatsig.com`、61 个惰性 CJS 模块 |
| 61,588-69,715 | semantic/business | desktop-fetch、app-server、account/statsig、automations、browser-use | R5 §1/§3；对应 `api/`, `app-server/`, `account/`, `automations/`, `browser-use/` |
| 69,716-69,869 | vendor-preserved | lodash `orderBy` 子集 | R5 §0/§1；六个 `e.t()` CJS 模块，仅供扩展图标排序 |
| 69,870-73,180 | semantic/business | browser sidebar、平台/环境、桌面设置与迁移 | R5 §3；对应 `browser-sidebar/`, `platform/`, `workspace/`, `settings/`, `desktop/` |
| 73,181-79,294 | vendor-preserved | `yaml` v2.x | R5 §0、R6 §0/§1；从 `yaml.alias` 符号到 `Composer/Document/parse/stringify` 聚合出口 |
| 79,295-87,722 | semantic/business | memory summaries、导入、hotkey、feedback、detached window、工具与云文件 | R6 §0/§3；对应 `computer-use/`, `import/`, `hotkey/`, `feedback/`, `window/`, `cloud/` |
| 87,723-91,982 | vendor-preserved | `minipass` + `tar` | R6 §0/§2；`Minipass`、tar Header/type/append 工厂，粗扫中的副作用点均属库内部装配 |
| 91,983-106,857 | semantic/business | hotkey、saved sections、link opening、workspace、fetch handler、browser sidebar/webview/comment/download | R6 §3、R7 §1/§3；对应 `hotkey/`, `sidebar/`, `browser/`, `fetch-handler/`, `browser-sidebar/` |
| 106,858-109,474 | vendor-preserved | `zod` v4 | R7 §0/§1、R8 §0/§1；错误载体、schema 工厂、`ZodFirstPartyTypeKind` 完整实现 |
| 109,475-126,987 | semantic/business | browser-use/IAB、native pipe、MCP sandbox、open-in、library/dictation | R8 §1/§3、R9 §3；对应 `browser-use/`, `native-pipe/`, `browser/`, `files/`, `dictation` 相关目录 |
| 126,988-128,458 | vendor-preserved | once/wrappy、pump、get-stream、fd-slicer、yauzl、extract-zip | R9 §0/§2；language-server runtime 解压依赖链 |
| 128,459-128,995 | semantic/business | language-server runtime installer/trust 前置 | R9 §3；对应 `language-server/` |
| 128,996-135,742 | vendor-preserved | vscode-jsonrpc、languageserver-protocol、textdocument、vscode-uri | R9 §0/§2；`AbstractMessageReader/Writer`、`createProtocolConnection`、URI IIFE |
| 135,743-146,159 | semantic/business | language-server manager/providers、MCP sandbox、open-in、primary runtime、projects、realtime voice | R9 §3、R10 §3；对应 `language-server/`, `browser/`, `desktop/`, `realtime/`, `workspace/` |
| 146,160-146,592 | vendor-preserved | `ssh-config` | R10 §0/§1；directive/tokenizer/`SSHConfig` parse/stringify |
| 146,593-148,655 | semantic/business | remote connection discovery/manager、artifact/session glue | R10 §3；对应 `remote-control/`, `artifact-session/`, `app-server/` |
| 148,656-152,559 | vendor-preserved | `lib0` + Yjs library core | R10 §0/§1；应用接缝从 152,560 起，库内 polyfill/decoder/GC 不派发 |
| 152,560-168,047 | semantic/business | artifact documents、notifications/permissions、terminal、thread catalog、window context、tray/menu、deep links、appshot/dictation | R10 §3、R11-R12 §3；对应 `artifact-session/`, `notifications/`, `desktop/`, `thread-catalog/`, `window/`, `app-shell/`; appshot 双修饰键策略 164,768-164,779 已迁至 `main-app/hotkey/appshot-shortcut.ts`，入口仍保留薄委托 |
| 168,048-172,419 | vendor-preserved | string-width/cli-truncate/picocolors、mime-db、electron-dl、electron-context-menu | R11-R12 §0/§2；172,009 下载管理和 172,094 菜单实现是上游包，168,718-168,834 的唯一文件名粘合逻辑保留在同一边界内 |
| 172,420-176,978 | semantic/business | 下载服务尾部、窗口管理、worker 装配、启动编排 | R11-R12 §3；对应 `files/`, `window/`, `worker-*`、`app-shell/`、`startup-*`；启动顺序是当前未迁出入口边界 |

## generated / CJS 包装器处理

rolldown 的 `e.t/e.r/e.a/e.n` 包装、模块编号表、`__export`/`__toCommonJS` helper 和 re-export 出口在上述业务/供应商区间内交错出现，不能按单行拆成业务模块。它们统一标记为 `generated`，证据来自各 R 文档的“跨 chunk 依赖”和 CJS 形态说明；其职责是保持官方 chunk 的加载顺序与 CJS 导出面。对应的入口仍由 `scripts/chunk-manifest.mjs` 的 `main` PRESERVED 条目承载。

## 仍未提取的业务边界

本审计确认 main 原文件的业务内容已按主题对应到 `main-app/`，但**没有宣称 main chunk 已完成物理迁出**。后续抽取必须优先处理以下边界：

1. `172,420-176,978` 的启动编排（尤其窗口/worker 装配）需要保持副作用顺序，适合先拆成薄入口 + 可测试的 `startup/` 模块。
2. `135,743-146,159` 的 language-server 与 remote/artifact 装配仍包含动态 require、原生 host 和进程生命周期，需逐个核对 CJS 导出再登记 REWRITTEN。
3. `109,475-126,987` 的 IAB/MCP sandbox 与 `152,560-168,047` 的窗口/终端簇跨越 Electron 生命周期，不能仅凭导出消费量判断完成。
4. vendor 区间的 npm 替换只能在行为验证后进行；在未完成等价验证前，继续走 transform-only 是有意的 `preserved` 状态，不是遗漏。

### A3 增量抽取：DeviceCheck attestation

原 `devicecheck-attestation`（3,084-3,264）已迁移至
`src/main/main-app/security/device-check.ts`，入口仅保留压缩别名兼容导入。该模块保留
darwin/win32 平台门控、Apple Silicon 能力探测、native addon token 生成与四类失败码，
并将 DeviceCheck token 的 CBOR/base64url 编码集中到可读实现；logger、addon 和信号采集均
可注入。`scripts/test-main-device-check.mjs` 覆盖平台/架构矩阵、能力探测异常、成功 token、
不可用与 native 失败日志、请求过滤及 token 生成，共 13 项 focused assertions。

该抽取不触碰窗口、worker 或 preload 生命周期；原 `main-C-Mhak1n.ts` 的 DeviceCheck
实现已删除并由语义模块接回，language-server、IAB/MCP sandbox 与启动装配边界仍保持
business-preserved，A3 不宣称完成。

### A3 增量抽取：remote host display helpers

open-in target 的远程主机展示与 SSH 命令解析纯函数（原 `x1/S1/C1/m4e/h4e/w1/g4e`，
138100-138123）已迁移至 `src/main/main-app/open-target/remote-host.ts`。模块只处理
标识符回退、SSH alias、命令行端口/identity 检测以及 IPv6 host 加括号，不触碰
Electron、文件系统或目标进程启动；入口通过窄委托保留原 helper 名称和调用顺序。由
`scripts/test-main-remote-host.mjs` 覆盖 11 项标识符、端口、identity 与 IPv6 边界断言。

### A3 增量抽取：open-in target host filtering

open-in target 的本地/SSH host 过滤策略（原 `T1/E1/D1`，138110-138143）已迁移至
`src/main/main-app/open-target/target-filter-policy.ts`。模块通过注入 host 类型判定、
远程主机标签和平台参数，保留 Windows file-manager、本地 host、SSH-capable target 与
Zed alias 的过滤语义；入口只负责压缩别名/schema 适配，不触碰 Electron 或目标进程。
`scripts/test-main-target-filter-policy.mjs` 覆盖 8 项本地、远程、缺失 alias 和 ID 过滤断言。

### A3 增量抽取：open-in target input policy

open-in target 的应用资源路径归一化、内置 app 路径校验、data-image 校验和跨平台绝对路径
判定（原 `O1/D4e/O4e/A1`，138145-138164）已迁移至
`src/main/main-app/open-target/target-input-policy.ts`。模块仅接受路径字符串与注入的
path API，不触碰文件系统、Electron 或目标进程；入口保留原有压缩别名与平台调用边界。
`scripts/test-main-target-input-policy.mjs` 覆盖 9 项 app 资源、恶意路径、图片协议和
POSIX/Windows 路径断言。

### A3 增量抽取：open-in target selection policy

open-in target 的请求目标选择与 Windows file-manager fallback（原 `d4e/v1`，138046-138070）
已迁移至 `src/main/main-app/open-target/target-selection-policy.ts`。模块通过显式注入
请求目标、偏好目标、过滤状态、平台 fallback 和默认查看器策略，保留用户显式目标优先级、
过滤后回退与 Windows 默认 file-manager 语义；入口只负责压缩别名适配。由
`scripts/test-main-target-selection-policy.mjs` 覆盖 8 项优先级、平台和 fallback 断言。

### A3 增量抽取：open-in target launch arguments

编辑器跳转参数、VS Code remote URI 与 remote 命令参数组装（原 `R1/A4e/B1`，138305-138335）
已迁移至 `src/main/main-app/open-target/target-launch-args.ts`。模块只生成参数数组和
编码后的 remote URI，通过显式 location/platform 输入保持 Windows、普通编辑器和远程 workspace
语义；入口仍负责 host 配置解析与进程启动。`scripts/test-main-target-launch-args.mjs`
覆盖 6 项普通/Windows/远程 URI 与 folder 参数断言。

### A3 增量抽取：open-in target descriptor policy

跨平台 open-in target descriptor 的元数据合并与平台描述符构造（原 `V1/H1`，
138340-138403）已迁移至 `src/main/main-app/open-target/target-descriptor-policy.ts`。
该模块只处理 label/icon/kind/hidden 及平台字段的纯对象组合，包括通用平台描述符和
编辑器 target 的 args/open 注入，不触碰平台探测、文件系统或目标进程启动；入口保留
压缩别名并继续提供具体 detect/args/open 回调。由
`scripts/test-main-target-descriptor-policy.mjs` 覆盖字段回退、平台选择和空平台边界。

### A3 增量抽取：language-server protocol helpers

language-server 的 LSP 能力摘要、Location URI/path 转换与 hover 内容归一化（原
`j0e/M0e/v$/y$/N0e/P0e/b$`，135496-135620）已迁移至
`src/main/main-app/language-server/protocol-helpers.ts`。模块通过显式注入 path/URI
实现和 MarkupContent 判定，保留 POSIX、Windows、UNC 路径以及 fenced Markdown
signature/documentation 的原语义；入口只保留压缩别名委托，不触碰 LSP session、进程
生命周期或 host 解析。`scripts/test-main-language-server-protocol-helpers.mjs`
覆盖 8 项能力、路径、Location 与 hover 归一化断言。

### A3 增量抽取：language-server command trust policy

语言服务器启动前的可执行文件信任边界与确定性命令参数策略（原
`QQ/H1e/U1e`，128,444-128,557）已迁移至
`src/main/main-app/language-server/command-trust.ts`。该模块保留原始的
workspace 外路径准入、`node_modules` 拒绝、Unix lookup 哨兵解析、Windows
`where.exe` 后缀筛选、远程 Unix `exec "$@"` wrapper，以及 Windows
`.cmd/.bat` 的 node_modules 脚本路径组装；lookup/stat/spawn 等 I/O 和
LSP session 生命周期仍由入口 provider 持有。`scripts/test-main-language-server-command-trust.mjs`
覆盖 10 项路径安全、输出解析与命令构造断言。

### 下一条低风险抽取建议（审计增量）

优先抽取 `175,802-175,889` 中 Ust 的启动形态判定和阶段计时器（不包含
Electron/worker 副作用）：

该边界现已迁移至 `src/main/main-app/startup/startup-policy.ts`：
`resolveStartupFlavorFlags` 接回 `Ust` 的 flavor/platform flags，
`createStartupPhaseTracker` 接回阶段 elapsed/trace 记录；
`collectStartupPathExtensions`、`shouldEnableDebugChromePages` 与
`resolveRemoteHostedPipProcessIdentifier` 进一步接回启动前后的路径分类、debug page 和 PIP
进程号策略；`scripts/test-main-startup-policy.mjs` 覆盖 17 项矩阵、计时和边界断言。

- `175,824-175,859` 的 `S/C/w/T/E` 是纯 build-flavor/platform 映射，输入仅为
  `buildFlavor`、`process.platform` 和环境状态；可落为 `resolveStartupFlavorFlags`
  并用矩阵断言覆盖 Dev/Agent/Prod + darwin/win32/linux。
- `175,849-175,859` 的 `M` 计时闭包只写 `phaseElapsedMs` 并调用 logger，可抽为
  注入 `now`/`trace` 的 `createStartupPhaseTracker`；保持 `background` 时不写阶段
  累计的原语义。
- 该边界不触碰 `app.whenReady()`、协议注册、window services 或 worker-bus，因而
  不改变启动副作用顺序；验证入口为 `node scripts/build.mjs --check`、
  `node scripts/verify-chunks.mjs`、`npm run typecheck -- --pretty false`，并新增
  `scripts/test-main-startup-policy.mjs` 的矩阵断言。

这是当前启动区最适合作为下一批的物理迁出点；`Ust` 的其余区段仍需按 G1-G12
副作用边界拆分，不应一次性重写。

## 审计复核

### 增量抽取：更新即时退出清理

原 `Wst`（176,933-176,955）已迁移至
`src/main/main-app/app-shell/immediate-update-exit.ts`，入口层通过
`run-main-app-startup.ts` 的窄代理接入。该模块以依赖注入方式保留
`markAppQuitting`、Windows 进程树清理、异步 cleanup、未销毁窗口销毁、错误告警
以及 `app.exit(0)` 的顺序和 finally 语义；不直接导入 Electron。由
`scripts/test-main-immediate-update-exit.mjs` 覆盖正常顺序、进程树失败、cleanup
失败、非 Error 失败和始终退出等 4 组断言。原入口仍负责传入真实副作用，Ust
其余启动装配保持在原边界内。

### 增量抽取：启动打开文件参数

可打开文件类型、`file://` 归一化、绝对路径/深链过滤、`--open-project` 跳过与去重
descriptor 已迁移至 `src/main/main-app/files/open-path-arguments.ts`（原
12,855-12,948、启动消费点 175,698 与 176,281-176,313）。入口仅保留兼容别名并继续
负责窗口与 deep-link 副作用；`scripts/test-main-open-path-arguments.mjs` 覆盖 13 项
平台、URL、扩展名、过滤与去重断言；desktop open-path 的 directory、HTML browser-document 与普通 file 分类另由 4 项 stat-kind 边界断言覆盖。

### 增量抽取：更新退出策略

启动阶段延迟展示进度窗口的 timer、异步 show、取消及 cleanup 竞态已迁移至
`src/main/main-app/startup/delayed-progress-window.ts`；入口继续注入真实窗口创建，
由 `scripts/test-main-delayed-progress-window.mjs` 覆盖 5 项时序断言。

启动更新分支的纯策略判定已迁移至
`src/main/main-app/startup/quit-for-update-policy.ts`：立即退出路径只调用更新退出，
普通路径严格先允许临时退出再触发更新退出；入口继续注入 `quitState` 与真实退出副作用。
由 `scripts/test-main-quit-for-update-policy.mjs` 覆盖 2 项顺序断言。

### 增量抽取：worker bus 事件谓词

worker bus 装配附近的 `Sst/Cst/wst` 纯谓词（原 175,015-175,023）已迁移至
`src/main/main-app/worker/worker-event-predicates.ts`，入口保留兼容别名并委托
`isWorkerStartResult`、`isWorkerEventType` 与 `isWorkerNotificationType`。这些谓词
不触碰 worker 启动、IPC 或 Electron 副作用，由
`scripts/test-main-worker-event-predicates.mjs` 覆盖 8 项结果/事件类型断言。

### 增量抽取：worker invocation sampler

原 `pst`（173,975-173,985）的 Git worker invocation 总数与 30 秒滚动窗口快照已迁移至
`src/main/main-app/worker/invocation-sampler.ts`。模块通过注入 rolling-window counter 保留
原始计数/时间参数语义，入口仅负责传入既有 `jt` 实现；worker bus、telemetry 与退出生命周期
仍由原 owner 持有，由 `scripts/test-main-worker-invocation-sampler.mjs` 覆盖空快照、连续记录、
时间戳传递和计数结果共 4 项断言。

### 增量抽取：Dock icon preference policy

`dst` 窗口服务工厂中的 build-flavor Dock icon preference 选择已迁移至
`src/main/main-app/startup/startup-policy.ts` 的 `resolveDockIconPreference`。该策略只读取
flavor、允许的 flavor 集合和注入的设置 getter；nativeTheme、dock、nativeImage 与窗口图标
更新仍由窗口服务 owner 负责。`scripts/test-main-dock-icon-policy.mjs` 覆盖已配置、缺省、Agent
固定默认值、未知 flavor 与空允许集合共 5 项断言。

### 增量抽取：open-in shortcut-link cache

`xst` worker assembly 中 `read-shortcut-link` 的按路径缓存与 `{ icon, target }` 投影已迁移至
`src/main/main-app/worker/shortcut-link-cache.ts`。模块通过注入 `shell.readShortcutLink`
保持平台 I/O 在入口，open-in RPC handler 仍负责方法分派与错误语义；由
`scripts/test-main-shortcut-link-cache.mjs` 覆盖同路径命中缓存、不同路径重新读取和字段投影共
4 项断言。

### 增量抽取：tray icon name policy

托盘装配使用的 Windows dark/light icon 名称与 macOS template 名称已从 main chunk 的 `bT/xT`
迁移至 `src/main/main-app/startup/tray-icon-paths.ts`；flavor 到 Agent/default 图标名映射保持
纯函数，路径拼接与 nativeImage 读取仍由入口负责。`scripts/test-main-tray-icon-names.mjs`
覆盖 template、Agent 和普通 flavor 三项断言。

### 增量抽取：worker RPC 消息谓词

worker-main RPC 的允许方法、取消消息与请求消息校验（原 174,312-174,329）已迁移至
`src/main/main-app/worker/rpc-message-predicates.ts`，入口保留 `gst/_st/vst` 兼容委托。
模块只负责对象形状和方法白名单判断，不触碰 RPC 调度或 worker 生命周期；由
`scripts/test-main-worker-rpc-message-predicates.mjs` 覆盖 10 项断言。

### 增量抽取：workspace startup policy checker

原 `Tst`（175,020-175,058）的登录竞态、startup policy 变更探测和一次性重启通知状态机
已迁移至 `src/main/main-app/startup/workspace-policy-checker.ts`。入口只注入 quit state、
认证/配置查询、重启提示和错误日志，保持通知取消、generation 防竞态与 app-quitting
守卫；由 `scripts/test-main-workspace-policy-checker.mjs` 覆盖 7 项异步状态断言。

### 增量抽取：computer-use worker RPC handler

原 `Lst`（175,486-175,496）的 computer-use service PID 请求编排已迁移至
`src/main/main-app/worker/computer-use-rpc-handler.ts`。入口仅注入服务确保/失效副作用，
保留 invalidate 返回空对象、service-pid 返回进程号、ces-telemetry 拒绝和未知方法
返回 undefined 的语义；由 `scripts/test-main-computer-use-rpc-handler.mjs` 覆盖 5 项断言。

computer-use history scope/clear action 常量（原 `Dst/Ost`，175,045-175,058）及
`application_session` 的有界时间区间构造已迁移至
`src/main/main-app/computer-use/history-scope-actions.ts`，入口保留兼容对象并使用
`historyScopeAction`/`historyClearRange` 做映射与时间区间计算；由
`scripts/test-main-history-scope-actions.mjs` 覆盖常量、映射、缺失起点、相同端点和
当前时间 fallback 等 10 项断言。

```sh
wc -l .reference/originals/main/main-C-Mhak1n.ts
node scripts/verify-chunks.mjs
node scripts/audit-shared-consumption.mjs
```

本报告只新增审计证据，不改变源码、构建路径或 chunk manifest；它是 T4 的覆盖基线，后续每次抽取应在表中把对应区间的 `business-preserved`/`generated` 更新为具体语义模块，并保留原始行号引用。

### T4 覆盖复核：175,890-176,978 启动装配暂不迁移

本轮对 `Ust` 后半段启动装配进行了逐段复核。该区间同时交织 Electron app/window 生命周期、tray
初始化（`Pst/Ge`）、computer-use/browser-use service 构造、app-server connection registry
订阅、插件 reconcile、focus/quit 事件监听与 disposable 注册；例如 175,900-176,050 在同一
异步路径中创建 tray、注册 `will-quit`、安装菜单 action，并在失败时执行 `he()` fallback，
176,100-176,500 又继续注册多个服务和 browser/IAB activity callbacks。上述逻辑共享 startup
flags、`I` disposable 栈和窗口 manager，抽出任一局部函数都会改变副作用顺序或 cleanup ownership。

结论：该区间当前没有可独立闭合且不改变副作用顺序的纯策略边界；保留为
`business-preserved`，并以本节作为 coverage audit 证据。下一次抽取前必须先建立针对单一服务
构造/注册顺序的 focused harness，不得以 facade 或无消费 policy 减少覆盖区间。

### T4 覆盖复核：172,420-175,889 worker/window 装配边界

该前半段已复核：172,420-173,700 的窗口管理包含 BrowserWindow/WebContents 的 navigate、focus、
display 与 render-process 监听；173,700-174,330 的 `bst/H9` worker manager 同时创建
`Worker`/`MessageChannel`、登记 sentry/main RPC session、处理 message/error/exit，并在 dispose
时发送 `worker-flush-and-exit` 后等待退出。174,330-175,889 继续混合 worker bus、tray/window
事件与启动阶段 wiring。已有 URL-trust、window-appearance、RPC/event predicates 等窄策略已单独
覆盖；除此之外，剩余逻辑都依赖 Electron 对象、跨 worker listener 集合或共享 disposable 顺序。

结论：本区间没有新的可证实独立纯策略边界。继续拆分会把 WorkerManager/window lifecycle
副作用伪装成 facade，故维持 `business-preserved`，并要求后续以 worker spawn/dispose 顺序
harness 为前置证据。

### T4 当前快照校准

`wc -l .reference/originals/main/main-C-Mhak1n.ts` 当前结果为 176,438；仓库没有独立
`audit-main-coverage` 命令，覆盖证据由本报告的基线表、逐段审计记录和 focused tests 共同维护。
因此本轮未把历史 `176,978` 末端区间误报为当前未审计代码；后续增量应先更新符号定位，再补
对应区间证据。

本轮可迁移边界回归证据：`test-main-startup-policy.mjs` 17 项、
`test-main-immediate-update-exit.mjs` 4 项、`test-main-delayed-progress-window.mjs` 5 项均通过；
这些测试验证已迁出的策略/时序模块，不改变对剩余启动装配区间 `business-preserved` 的结论。

桌面 open-path 的 stat-kind 分类现由入口委托 `src/main/main-app/files/open-path-arguments.ts` 的
`classifyDesktopOpenPath`，保留真实 stat、warning 日志与后续窗口副作用；已有 17 项 focused
断言覆盖 directory、HTML browser-document、普通 file 与缺失路径边界。

原 `Fst/$9`（175,431-175,471）的托盘图标候选路径解析已迁移至
`src/main/main-app/startup/tray-icon-paths.ts`；平台/flavor、打包 resources 与开发仓库路径组合由
`scripts/test-main-tray-icon-paths.mjs` 覆盖，nativeImage 读取与 Electron fallback 仍留在入口。

### 增量抽取：global shortcut validation policy

全局快捷键注册前的纯校验（修饰键/非修饰键约束、平台错误文案与 bare-modifier 分流）已迁移至
`src/main/main-app/hotkey/global-shortcut-policy.ts`。原 `global-shortcut.ts` 仅注入已有
bare-modifier predicates，继续持有 Electron `globalShortcut` 注册、native helper、权限请求和
挂起/恢复副作用；`scripts/test-main-global-shortcut-policy.mjs` 覆盖 6 项 focused assertions。
该 policy 同时承载 mac keyboard layout 的单键 accelerator remap；`updateMacKeyboardLayout`
仍负责更新布局状态、触发全量重注册及失败回滚，新增 3 项映射/保留边界断言。
该 policy 还承载 dictation release-watch 的平台可用性判定；实际 native helper/PowerShell
spawn、release callback 与 dispose 仍留在入口，新增 3 项 platform boundary assertions。
mac modifier helper-name projection 也已迁移至该 policy；release watcher 仍保留 helper
进程创建与释放副作用，新增 2 项去重/未知 token 边界断言。
win32 modifier VK 分组投影也已迁移至该 policy；PowerShell spawn、输出解析和 release/dispose
仍由入口负责，新增 2 项 platform/empty-group 边界断言。
accelerator 的空白、连字符、下划线与大小写规范化也已迁移至该 policy，新增 1 项规范化断言。
accelerator token 分割（空段过滤与 trim）也已迁移至该 policy，新增 1 项分割边界断言。
bare/unsupported accelerator 分流判定也已迁移至该 policy，入口继续负责注册分支与 helper
生命周期，新增 2 项 unsupported/bare 边界断言。
bare-modifier platform gate 也已迁移至该 policy，入口继续负责 helper 注册与权限请求，新增 2 项平台边界断言。
注册 accelerator 的 platform/layout gate 也已迁移至该 policy，入口继续负责 Electron 注册与
失败回滚，新增 2 项 darwin/win32 映射边界断言。

### T4 下一候选复核：main-app 几何/窗口模块

global shortcut 相邻的 `avatar-overlay/geometry.ts`、tray 与窗口辅助模块已是独立 consumer
模块；剩余函数依赖 Electron `screen`、BrowserWindow、display/work-area 状态或共享窗口
生命周期。复核未发现比现有 geometry/policy 模块更小且能保留副作用顺序的新纯边界，本轮不再
制造 facade。

### 增量抽取：workspace policy restart dialog

原 `Est`（175,026-175,046）的 workspace policy 重启提示已迁移至
`src/main/main-app/startup/workspace-policy-restart-dialog.ts`。模块通过注入国际化、应用名、同步对话框、quit approval 与退出回调，保留提示失败后的 warning 语义以及始终执行 `markQuitApproved`/退出的顺序；入口仅负责 Electron/quit 适配，由 `scripts/test-main-workspace-policy-restart-dialog.mjs` 覆盖正常展示和失败降级路径。

### 增量抽取：启动清理超时原语

原 `s7/Lrt`（161,783-161,788、175,938）的异步清理等待与超时竞态已迁移至
`src/main/main-app/startup/cleanup-timeout.ts`，由 `scripts/test-main-cleanup-timeout.mjs`
覆盖成功、拒绝和超时路径共 4 项断言；具体清理副作用与超时常量仍由入口注入。

tray ready 状态谓词（原 `Z9`，175,280-175,282）已迁移至
`src/main/main-app/tray/tray-readiness.ts`，入口保留兼容函数并隔离 tray 对象可选调用；
由 `scripts/test-main-tray-readiness.mjs` 覆盖 5 项状态/空值断言。

### 增量抽取：Artifact Session host 环境装配

Artifact Session 宿主启动过程中的 daemon 路径、socket/ready 文件、认证 token 与受信任服务环境
装配已迁移至 `createArtifactSessionHostEnvironment`（`src/main/main-app/artifact-session/host-lifecycle.ts`）。
生命周期类仍负责 runtime pinning、临时目录清理和进程副作用，仅将确定性的环境/连接描述构造抽出；由
`scripts/test-main-artifact-session-host-environment.mjs` 覆盖路径、环境键、transaction key 与 viewer token
等 6 项断言。

### Worker manifest 复核（2026-10-06）

当前 `src/main/worker` 中未在本表逐名出现的入口均已核对其消费边界：
`git-host-handoff-progress.ts`、`git-worktree-snapshot-read-dispatch.ts`、`entry-dispatcher.ts`、
`git-core-request-dispatch.ts`、`git-node-request-dispatch.ts` 与 `git-live-query-run.ts` 均由
对应 policy/dispatch 或生命周期测试覆盖；`shell-quoting.ts` 与 `open-target-path-policy.ts`
是已接回原 worker 的窄策略入口。复核未发现新的未消费 business helper，也未新增 facade；剩余
main/worker 生命周期仍按原始入口边界保留。

### T4 纯函数候选复核：WindowManager predicates

当前入口仍包含 `isHotkeyWindowThread`、`isAvatarOverlayWindow` 与
`shouldSyncPersistedAtom`（现行源码约 172,540-172,610）。它们表面上是纯判定，但实际读取
WindowManager 私有 `windowAppearances`/`BrowserWindow.fromWebContents` 状态，并由同一类的
message fan-out 与 Electron window lifecycle 消费；仓库没有可接回该类的可读 WindowManager
owner。按“真实 consumer 才迁移”规则，本轮不新建 policy facade；待 WindowManager owner
物理迁出后再以注入 map/window lookup 建立 focused harness。

### Worker/main consumer 接回证据（2026-10-06）

当前 bundle 的 `worker.ts:8` 接回 `entry-dispatcher`，`worker.ts:162` 接回
`git-worktree-snapshot-read-dispatch`，`worker.ts:164-165` 接回 node/core request dispatch，
`worker.ts:58` 接回 shell quoting，`worker.ts:173` 接回 open-target path policy。live-query run
由 live-query coordinator 直接消费；host-handoff progress 由 handoff runtime 接回。上述入口均
已有 focused regression，没有未消费的可读 helper 可安全迁移；该证据支持维持当前 preserve 边界。

### 增量抽取：browser-use origin policy

browser-use rule update 的 origin 规范化（缺省 https、仅允许 http/https、投影 URL origin）已迁移至
`src/main/main-app/browser-use/origin-policy.ts`。`origin-state.ts` 继续持有 config.toml 读写、
规则集合更新与日志副作用；`scripts/test-main-browser-use-origin-policy.mjs` 覆盖 4 项协议、端口、
非法 scheme 与空值断言。
规则集合输入的 trim/类型过滤/稳定去重也已迁移至同一 policy，新增 1 项去重边界断言。
allowed/denied rule kind 互换也已迁移至该 policy，规则更新副作用仍由 origin-state 持有，新增 2 项映射断言。
browser-use config path 的 home/filename 组合也已迁移至该 policy，origin-state 继续负责文件存在、读取、解析与写回副作用，新增 1 项路径断言。
TOML 解析结果的 plain-object 形状判定也已迁移至该 policy，origin-state 继续负责解析失败日志与状态写回，新增 2 项形状断言。
approval/history mode 的 config↔desktop/TOML 映射也已迁移至该 policy，origin-state 继续持有
配置加载、更新与持久化副作用，新增 5 项默认/disabled/反向映射断言。
规则 section 的 kind-set 读取与稳定去重也已迁移至该 policy，origin-state 继续持有 rule
decision 与写回副作用，新增 1 项投影断言。
rule membership 判定也已迁移至该 policy，origin-state 继续负责 denied 优先的 decision
组合，新增 2 项命中/缺失断言。
denied-over-allowed 的 rule decision 组合也已迁移至该 policy，origin-state 继续负责 resource
section 选择与批量更新副作用，新增 2 项优先级断言。
add 前 origin 的精确匹配优先/规范化/非法输入拒绝也已迁移至该 policy，origin-state 继续负责
resource section 选择与规则写回，新增 2 项解析断言。
origin resource 到 TOML section key 的映射也已迁移至该 policy，origin-state 继续负责 config
访问和规则更新，新增 1 项 full_cdp 映射断言。
transfer approval key 映射与 global persistent approval enterprise gate 也已迁移至该 policy，
origin-state 继续持有异步配置/策略检查副作用，新增 2 项断言。

### T4 origin-state 剩余边界复核

`applyRuleUpdate`/`computeRuleUpdates` 直接 mutate config，并依赖 denied/allowed decision、
remote update 顺序与 resource section 选择；`projectOriginState` 又组合多 section、approval
mode 与 enterprise settings。两者当前没有可独立接回且不改变 mutation/批量更新顺序的窄纯边界，
继续保留在 origin-state owner。

### T4 候选复核：browser-sidebar error pages

`browser-sidebar/error-pages.ts` 同时持有图片附件 WeakMap 的 suspend/resume、WebContents
session.fetch/abort 生命周期、annotation snapshot 模式切换、国际化错误内容和 interstitial
HTML 模板。错误抑制、URL 归一与文案判定虽为纯函数，但由同一模块的附件与窗口事件 consumer
直接组合；当前没有可独立接回且不复制模板/状态 owner 的窄边界，暂不拆分。
