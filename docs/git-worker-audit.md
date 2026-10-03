# Git worker 逐段审计

## 已抽取边界

当前已从入口物理迁出并接回的业务边界包括：main-RPC client（约
90,524-90,605）、parentPort 消息/生命周期分发（入口尾部），以及 Git 命令
白名单与错误分类（约 53,478-54,100，对应 `worker/git-errors.ts`）。这些
模块均以 CommonJS helper 形式由 `worker.ts` 加载，并有独立回归断言；其余
business 区段仍按下表保持审计标记，不能视为已完成。

WSL 平台的纯输出解析（约 47,122-47,584 中的 UTF-16/UTF-8 解码、活动发行版
识别与排序）也已迁至 `worker/platform-wsl.ts`；仍需继续迁移的是其命令执行、
缓存和宿主生命周期副作用。

远程 host 的 SSH 展示名、终端命令端口/identity 解析（原入口约
88,590-88,646）已迁至 `worker/remote-host-config.ts`。模块只保留字段校验、
别名优先级、IPv6 bracket 与 `-p`/`-i` 命令行规则，入口仍负责原始 host
对象装配；行为由 `scripts/test-worker-remote-host-config.mjs` 覆盖。

Git 命令统计初始化、变更请求来源判定、host cache key 和 exit-code bucket
（原入口约 65,498-65,559、65,614-65,628）已迁至
`worker/git-observability.ts`，原 `z1`/`gpe`/`B1`/`ype`/`K1` 别名接回；untracked
cache outcome 状态更新也已迁出，行为由 `scripts/test-worker-git-observability.mjs`
覆盖；进程 executable 的 `process.kind` 分类也已迁至同一模块，保留入口的
operation 属性和 telemetry 组装；GitHub CLI operation、SSH operation 与 Git
subprocess wrapper 的有限集合分类也由同一模块提供，入口保留 command telemetry
组装。

Git query key、host id、路径归一化、UTF-8 字节长度、query host 匹配、watched
path overlap、可缓存命令判定、fsmonitor cache key、配置值解析、daemon feature
判定和平台支持判定（原入口约 65,338-65,439、65,616-66,136）已迁至 `worker/git-query-utils.ts`，由
`scripts/test-worker-git-query-utils.mjs` 覆盖。

Git repository watcher 的路径/状态策略已迁至 `worker/git-watch-paths.ts`：
`isWithinPath`、锁文件过滤、worktree topology marker 匹配、可选状态合并、变更路径归一化、
Git 内部路径过滤、working-tree 变更集合合并、recovery 判定、repo-changed 事件 payload、
watch retry backoff、Git operation state mapping、watch target state initialization、change emission deduplication
和 `ENOENT`/`ENOTDIR` 缺失判断（原入口约 77,417-77,438、77,381-77,393、77,545-77,580）。原 watcher 通过
同名适配函数接回，行为由 `scripts/test-worker-git-watch-paths.mjs` 覆盖。

本轮继续抽取 metadata refresh 路径筛选策略：`selectGitMetadataRefreshPaths`
负责将空变更集合映射到 common dir，并只接受 refs/heads/remotes、info、worktrees
及 worktree 子目录的直接变化；`GitRepoWatcher.refreshMetadataDirectories` 已接回
该 helper，异步 session 刷新流程仍保留在入口。本轮进一步抽取
`getGitWorkingTreeWatchRefreshAction`，将 ignore policy 刷新后的 skip/apply/restart
决策从异步生命周期中分离；changed-path handler、retry timer 与 session close 决策共覆盖 67 项断言。
`refreshWorkingTreeWatchPolicy`
仍负责等待 policy/session、dispose/restart 与事件副作用。

Git ignore policy（原 `Xye`，约 76,500-76,620）已迁移至
`src/main/worker/git-ignore-policy.ts`，入口通过 `GitIgnorePolicy` 接回；generation
快照、read 去重、refresh timer、recovery 状态和 dispose 等行为由
`scripts/test-worker-git-ignore-policy.mjs` 覆盖，共 10 项断言。GitRepoWatcher
仍保留 session 创建、重启和文件事件副作用。

`GitRepoManager.handleRequestWithContext` 的连续只读请求分支（`origin-url`、
`origin-and-roots`、`worktree-shell-environment`、`worktree-owner`、
`default-remote-branch`、`merge-base`、current/upstream/default/base branch 与
branch-ahead、recent-branches、branch-exists、create-branch、resolve worktree starting ref、
branch commits 与 review commit line counts，原约 77,560-78,050）已迁移至
`src/main/worker/git-read-request-handlers.ts`；原入口继续负责取消信号、Git 可用性
检查、telemetry 和响应包装。`scripts/test-worker-git-read-request-handlers.mjs`
覆盖 repository unavailable 与正常结果，共 21 项断言。

紧随其后的 status/review 请求分支（`status-summary`、`branch-diff-stats`、
`review-summary`、`review-source-line-counts`、`review-diff`、`review-search`、
`review-patch`）已迁移至 `src/main/worker/git-review-request-handlers.ts`。入口仍负责
请求级取消信号、response/performance 包装和最终 telemetry；helper 保留 attribution、
repository unavailable、stale snapshot 与 generic-error fallback 语义，由
`scripts/test-worker-git-review-request-handlers.mjs` 的 15 项断言覆盖。

`refreshWorktreeDirectories` 的 worktree watch target 增删差集已抽取为
`partitionGitWorktreeWatchPaths`；helper 只计算 stale/new 路径，target 的 dispose、
directory watch 创建和 session 启动仍由入口负责。worker watch path 回归现覆盖 70 项断言。

`GZ` 的平台 shell descriptor 映射已迁移至 `worker/shell-config.ts`：入口仍负责
PowerShell 探测、环境变量读取和进程执行；helper 只决定 executable、参数、脚本
扩展名及 `posix`/`powershell`/`cmd` 类型，由 shell config 回归脚本覆盖。

审计对象：`.reference/originals/main/worker.ts`（90,836 行，当前构建产物的 CommonJS worker
入口）。审计原则是先按连续区间归属，再决定是否抽取；`business` 表示包含
Codex/git-worker 协议、配置、状态或业务错误处理，`vendored` 表示第三方库
实现或其 bundler 胶水，`generated-infra` 表示 RPC/传输基础设施，行为应保持
原样但不应被误报为 git 业务。

## 逐段归属

| 行号 | 归属 | 证据与判定 | 处理边界 |
|---|---|---|---|
| 1-34,560 | `vendored` | OpenTelemetry API/SDK、instrumentation 和 Sentry 实现；可见 `@opentelemetry/api` 版本 `1.9.0`（约 159 行）、`@sentry/opentelemetry`（约 14,148 行）及多个 `PACKAGE_NAME` instrumentation 模块 | 保留 vendor；不要将 telemetry SDK 重命名成 git 业务模块 |
| 34,561-38,229 | `vendored` | Zod 实现及 JSON Schema 生成器；导出集合包含 `ZodType`、`ZodObject`、`ZodUnion` 等（约 38,000 行） | 保留第三方 schema runtime；业务 schema 仅在后续区间抽取 |
| 38,230-43,985 | `business` | Codex worker 使用的浏览器、host、设置和消息 schema；包含 browser family 配置、`runCodexInWindowsSubsystemForLinux`、git 设置键以及 `worker` 请求数据约束 | 这是首个明确业务段，应拆为 `worker/config`、`worker/protocol` 或等价模块；保留对 Zod runtime 的窄依赖 |
| 43,986-46,600 | `generated-infra` | `globalThis[Symbol(\`workers-module\`)]`、`RpcTarget`、session/stub、Readable/WritableStream RPC hook；职责是跨线程对象序列化和取消，不包含 git 操作 | 作为 RPC 基础设施登记保留或单独迁移；不可把 `RpcTarget` 等空实现替换为 identity |
| 46,601-47,121 | `vendored` | `ipaddr.js` 原文特征：`ipaddr: cannot match CIDR`、`IPv4`/`IPv6`、`subnetMatch`、CIDR 解析 | 保留 vendor，行 46,643-47,111 是完整 ipaddr 实现 |
| 47,122-47,584 | `business` | WSL/Codex home 解析和 Windows 命令执行；明确调用 `wslpath`、`wsl.exe --status/--list`，日志含 `[execWindowsCommand]` 与 `[wsl]` | 可抽为 `worker/platform/wsl.ts`；保留 Windows/WSL 错误和日志语义 |
| 47,585-48,151 | `vendored` | TOML lexer/parser：`Invalid TOML document`、转义、数组/表、控制字符和嵌套深度检查 | 保留 parser runtime；业务配置读取只能依赖其公开入口 |
| 48,152-49,999 | `business` | SQLite migration 与 host/automation 数据模型；包含 `automations` 表、`rrule` 默认值、`host_kind IN ('local','ssh','wsl','remote-control','chatgpt')` 等领域值 | 应抽为 `worker/state` 或复用现有 shared SQL 模块；迁移 SQL 必须逐条保留 |
| 50,000-52,899 | `vendored` | RFC 5545 recurrence 实现：`RRule`、`rruleset`、`DTSTART`、`FREQ`、`BYDAY`、`UNTIL` 等完整库符号 | 保留 recurrence vendor；上一区间的 automation 代码只调用适配层 |
| 52,900-53,199 | `vendored` | memoizee 依赖实现：`promise`、`dispose`、`maxAge`、`refCounter` 等缓存插件 | 保留 vendor |
| 53,200-53,477 | `business` | 浏览器认证/connector/MCP approval schema，含 `connector_id`、`tool_name`、`browser_auth_challenge_id` 等业务字段 | 抽为 worker 协议 schema；不能与 Zod runtime 混为 vendor |
| 53,478-54,100 | `business` | Git CLI 命令白名单与错误分类；可见 `invalid_config`、`authentication`、`repository_missing`、`corrupt_repository`、`remote_transport` 等 Codex 错误类别 | 抽为 `worker/git/errors.ts` 和 `worker/git/commands.ts`，保持正则和分类优先级 |
| 54,101-55,350 | `vendored` | execa/cross-spawn 进程流胶水：`spawnedKill`、`setupTimeout`、`makeAllStream`、`MaxBufferError`、stdin/stdout/stderr 聚合 | 保留进程库；git 业务只应调用窄适配器 |
| 55,351-56,420 | `business` | Windows shell/runtime 选择，`powershell`、`pwsh`、`commandPrompt`、`gitBash`、`wsl` 路径和环境处理 | 抽为 `worker/platform/shell.ts`；与 47,122-47,584 合并时保留平台分支 |
| 56,421-61,150 | `vendored` | SOCKS/HTTP/WebSocket 底层实现；包括 WebSocket frame、`Sec-WebSocket-*`、proxy handshake、`ws` client/server 常量 | 保留 `ws` vendor；不要把 WebSocket 协议实现当作 worker RPC 业务 |
| 61,151-63,050 | `business` | Codex command/shortcut/keyboard capability schema 和 browser command 描述，含 `reloadBrowserPage`、`openBrowserTab`、`navigateBrowserBack` 等 | 可抽为 worker command registry；与 renderer command 定义保持字段兼容 |
| 63,051-65,199 | `business` | git command telemetry/error normalization；构造 `app_version`、`version`、git command 统计及 Datadog/browser telemetry 事件字段 | 抽为 git observability 适配层；Sentry/Datadog SDK 本体仍保留 |
| 65,200-80,999 | `business` | Git manager、repository/read cache、watch/session 生命周期、status/diff/branch/worktree/commit 请求处理；核心迹象是 `gitManager`、`watchesByKey`、`ensureWatching`、`invalidateGitReadCachesForTurn`、`handleRequest` 及 git 方法名 | 这是 T1 的主要语义化目标，应按 `worker/git/manager.ts`、`worker/git/watch.ts`、`worker/git/requests.ts` 拆分；不可整体以“worker_threads 启动协议”保留 |
| 81,000-83,323 | `business` | GitHub/review/patch 辅助请求：GitHub GraphQL mutation、review threads、repository snapshot/file reads；可见 `requestGitHub`、`review-summary`、`branch-diff-stats` 等业务方法 | 抽为 git review/request handlers；依赖 git manager 的窄接口 |
| 83,324-83,635 | `business` | computer-use capture worker request dispatcher；`watchUpdates`、capture update 和服务状态请求 | 与 git 子系统分离，归 `worker/computer-use`；不是 vendor |
| 83,636-84,079 | `business` | `uCe`/`dCe`/`fCe` host factory、git worker API 组装、ignore-source watcher 入口 | 抽为 worker host assembly；保留 `Git hosts require a main RPC connection` 约束 |
| 84,080-84,548 | `business` | 进程/telemetry 生命周期、Sentry 初始化、worker RPC transport、flush/analytics 更新辅助函数 | 可抽为 `worker/lifecycle.ts`，但不得改变 dispose/flush 顺序 |
| 84,549-85,965 | `business` | execution host、git command telemetry、computer-use adapter 等运行时适配器 | 按职责拆分；其中只调用第三方 SDK 的薄适配器可登记为业务胶水 |
| 85,966-86,130 | `vendored` | MIME 数据表（`application/toml` 及大量 IANA media types） | 纯数据 vendor，保留原表 |
| 86,131-90,660 | `business` | browser/host platform descriptors、Git Bash/GitHub Desktop discovery、workspace path helpers、parcel watcher wrapper | 抽为 `worker/platform` 与 `worker/watch`; 平台候选路径属于产品行为，不能标成 vendor |
| 90,661-90,836 | `worker-entry` | `workerData` 解构、`parentPort` 校验、`xDe` main-RPC client、`parentPort.on('message')` dispatch、git/computer-use worker 构造；请求类型含 `worker-request`, `worker-request-cancel`, `worker-flush-and-exit` | **精确保留边界**。入口只保留线程启动协议和 message loop；业务实现应由前述模块提供。`worker_threads` require 与 `parentPort` 生命周期不可移除 |

区间合计覆盖 1-90,836，无未归属行。少量区间边界落在 bundler 生成的闭包
声明上，判定以闭包内部实际内容为准；这些闭包在抽取时应连同其依赖一起移动，
不能按单个压缩变量名机械替换。

## 可直接提取的业务入口

以下入口已经具有清晰的输入/输出边界，适合作为第一批语义模块；它们不要求
先重写第三方库：

1. **worker main-RPC client**：`xDe`（约 90,532-90,605）。请求 envelope、取消、
   method 匹配、pending 清理是完整协议，可迁移至 `src/main/worker/rpc-client.ts`。
2. **入口消息分发**：约 90,676-90,836。保留 `parentPort` 绑定，但将每个
   `worker-*` 分支委托到 typed handler。
3. **git host factory**：约 83,636-84,079。`fCe` 明确注入 `gitManager`、
   `requestGitHub`、`readGitFileBinary`、watch sources，适合成为组合根。
4. **git request dispatcher**：约 65,200-80,999 和 83,000 附近的
   `handleRequest`。应先按 method case 列出契约，再拆 read-only、watch、review
   三组，避免改变缓存失效和 abort signal 传播。
5. **WSL/shell platform helpers**：47,122-47,584、55,351-56,420、
   86,131-90,660。可以先抽纯路径/命令选择函数，再迁移副作用调用。
6. **Git error classification**：约 53,478-54,100。正则表和命令白名单是
   独立纯函数，迁移后可用现有错误测试验证。
7. **SSH remote host identity/display**：约 88,590-88,646。`ssh_websocket_v0`
   配置解析、别名优先级、IPv6 bracket、`-p` 端口和 `-i` identity 规则已迁至
   `src/main/worker/remote-host-config.ts`，由
   `scripts/test-worker-remote-host-config.mjs` 覆盖，并由 worker 的 editor/remote
   open 路径直接调用。

## 保留登记建议

当前 `scripts/chunk-manifest.mjs` 的整文件 `git-worker` PRESERVED 理由不足。
本轮新增 `isCancelableGitRequest`、`shouldCheckGitAvailability` 与 `isGitRequestTracked`，迁移请求取消、
本地 Git 可用性和 in-flight 跟踪策略表；`rbe` 入口保留生成实现作为对照，行为由 worker query utility
接管并由 27 项断言覆盖。Git manager/watch/session
主路由仍待继续拆分。
完成 T1 后应改成分段登记：

- `vendor`: 1-34,560、34,561-38,229、46,601-47,121、47,585-48,151、
  50,000-52,899、52,900-53,199、54,101-55,350、56,421-61,150、
  85,966-86,130；
- `generated-infra`: 43,986-46,600；
- `worker-entry`: 90,661-90,836；
- 其余区间必须由语义模块覆盖，不能继续以整文件 preserve 规避审计。

本报告只做审计和边界确定，不宣称 T1 语义化已完成。下一步应以第一个
`xDe`/入口协议闭环为基线，迁移后运行 `verify-chunks`、`typecheck`，再根据
新增 import 运行 `audit-shared-consumption`。
### 增量抽取：Git operation marker paths

`GitRepoWatcher.getGitOperationState` 只读取六个 Git 状态标记文件，路径拼接
已迁移到 `src/main/worker/git-watch-paths.ts` 的
`createGitOperationMarkerPaths`，入口保留异步读取和状态映射。该边界覆盖
`CHERRY_PICK_HEAD`、`MERGE_HEAD`、`REBASE_HEAD`、`rebase-merge`、
`rebase-apply`、`REVERT_HEAD`，由 worker git watch path 回归脚本断言。
