# Handoff（终局版）：从「结构等价」到「完全反编译 + 可读工程」

> 本文档是最终 handoff。前一阶段（消费驱动的语义化）已按 DoD 验收完成：
> 全部门禁绿、被消费的导出 100% 语义化、所有 chunk 已分类。
> **本阶段把验收标准从「消费面语义化」升级为「完全反编译」**：仓库里不再
> 存在未分类的压缩业务代码，且工程本身达到「新人可读、可导航、可一键
> 验证」的状态。本文做完，整个项目即为真正的完全反编译。
> 双轨构建、批次流程、坑纪律沿用旧版（git 历史可查），并发上限 6 subagent
> （实际执行仍受当前运行环境并发槽限制）。
> 所有路径相对 `/Users/david/Workspace/ppio_github/codex-desktop-glm-version`。

## 当前进度快照（2026-10-04）

本轮已完成 worker/preload/main 逐段审计、shared 692 导出全量分类、renderer
三大 hub 内部审计、tsconfig 排除、测试索引、README 更新，以及 smoke/e2e
验证说明。worker 的 main-RPC 边界已提取为 `src/main/worker/rpc-client.ts`
并接回入口，静态门禁全绿；smoke 已实际验证主窗口加载、renderer 致命错误
过滤和 app-server 初始化握手，且对慢启动增加了 15 秒宽限轮询。

后续增量已实际接回：worker 入口消息分发与 Git 错误分类、preload WebMCP
协议、main delegation/account 与 URL trust helpers、WSL 输出解析与命令参数构造，均有独立
回归断言；worker 的 remote host SSH 展示名/identity 解析也已抽取为
`src/main/worker/remote-host-config.ts`，并由 6 项行为断言覆盖；preload 的
worker Windows/POSIX shell descriptor 策略已抽取为 `src/main/worker/shell-config.ts`，
由 8 项行为断言覆盖，PowerShell 路径发现也已接回入口；preload 的
deployment channel/policy 配置已抽取为 `src/main/browser-page-preload/deployment-channel.ts`，
由 8 项行为断言覆盖；main 的 thread metadata emoji 校验和不可变更新已抽取为
`src/main/main-app/thread-metadata.ts`，由 6 项行为断言覆盖；worker 的 Git
命令统计/变更来源/cache key/exit-code/untracked cache outcome 纯函数已抽取为
`src/main/worker/git-observability.ts`，由 99 项行为断言覆盖；其中包含 process
executable 分类，以及 performance operation/result/outcome/failure reason、采样策略与
index size bucket；原 `w6`/`kye`/`Aye`/`jye`/`Mye`/`Nye`/`Pye`/`Fye`/`Lye`/`Rye`/`T6`
实现和 `C6`/`Eye` 阈值常量已删除；worker 的 Git
query key、host id、路径归一化和 UTF-8 字节长度已抽取为
`src/main/worker/git-query-utils.ts`，并补充 query host 匹配和 watched path overlap，
由 16 项行为断言覆盖，并补充可缓存 Git 命令判定、fsmonitor cache key、配置
值解析、fsmonitor daemon feature 判定、平台支持判定、请求取消、Git 可用性和 in-flight 跟踪策略判定。
Git repository watcher 的路径归属与缺失状态策略（内部路径、锁文件过滤、worktree
topology marker、变更路径归一化、Git 内部路径过滤、working-tree 变更集合合并、recovery
判定、repo-changed 事件 payload、watch retry backoff、Git operation state mapping、watch target
state initialization、change emission deduplication、操作标记路径表、可选状态合并）
已抽取为 `src/main/worker/git-watch-paths.ts`，并新增 metadata refresh 路径筛选
策略 `selectGitMetadataRefreshPaths` 与启动 promise 后的 retry 决策，回归断言增至
70 项；新增 `partitionGitWorktreeWatchPaths` 负责 worktree watch target 的 stale/new
路径差集计算；异步 watcher/session
生命周期仍在继续拆分。本轮新增 `getGitWorkingTreeWatchRefreshAction`，覆盖
ignore policy 刷新后的 skip/apply/restart 纯决策，回归断言增至 51 项；异步
dispose/restart 与 session timer 副作用仍保留在入口。
Git ignore policy 的 generation/read/refresh/recovery 状态机已抽取为
`src/main/worker/git-ignore-policy.ts`，由 10 项行为断言覆盖；watcher 的 session
创建与 dispose 副作用仍保留在入口。
Git watcher ignore-source 的 config discovery、旧 Git fallback、include/excludes 路径解析和
tracked-path-aware ignored directory 筛选已迁移至
`src/main/worker/git-ignore-discovery.ts`；原三个 helper、两个常量及专用 bundled lower-bound
链已删除，由 37 项断言覆盖。
worker `handleRequestWithContext` 的 origin/roots、shell environment、owner、default
remote branch 与 merge-base 只读请求已迁移至 `src/main/worker/git-read-request-handlers.ts`，
并扩展至 current/upstream/default/base branch、branch-ahead、recent-branches 与 branch-exists
查询，由 17 项行为断言覆盖；
并继续覆盖 create-branch、resolve worktree starting ref、branch commits 与 review commit
line counts，由 21 项行为断言覆盖；其余 Git request cases 和 dispatcher 生命周期仍在入口。
Branch commits/review commit line counts 的 comparison、query cache、Git log 与 record/numstat
解析已进一步迁移至 `src/main/worker/git-review-commit-queries.ts`；原三个 helper 与两个阈值常量
已删除，由 36 项断言覆盖。
Branch metadata 的 repository 定位、current/default branch 并行读取、detached snapshot 回退与
local branch ref 规范化已迁移至 `src/main/worker/git-branch-metadata.ts`；原两个压缩实现已删除，
synced-branch state 复用同一规范化入口，由 27 项断言覆盖。
Branch-ahead 的 commit-count query、ancestor 快路径、remote/upstream/default branch 与 merge-base
回退已迁移至 `src/main/worker/git-branch-ahead.ts`；原底层 helper 与 class 内联算法已删除，
由 41 项断言覆盖。
Clone state 的 shallow repository 与 partial-clone config 并行探测、config entry 解析和
`GIT_NO_LAZY_FETCH` 环境保护已迁移至 `src/main/worker/git-clone-state.ts`；原三个压缩
常量/实现已删除，由 29 项断言覆盖。
Safe attribute filter override 的 config discovery、driver 去重、override 参数组装、query cache 与
generation 竞争重试已迁移至 `src/main/worker/git-safe-attribute-filters.ts`；原四个压缩
常量/实现已删除，全部消费者改用语义入口，由 18 项断言覆盖。
Tracked uncommitted diff 的 index context、临时 index 复制、`git add -u`、cached diff、错误日志与
`finally` cleanup 已迁移至 `src/main/worker/git-uncommitted-diff.ts`；原三个压缩实现已删除，
worktree starting state 与 commit-message diff 均改用语义入口，由 28 项断言覆盖。
Commit-message diff 的 staged patch、repository 缺失、safe-filter 失败与 tracked-uncommitted
分支编排已迁移至 `src/main/worker/git-commit-message-diff.ts`；原压缩实现已删除，
repository-read handler 直接注入语义入口，由 11 项断言覆盖。
Git index info 的 git-dir 定位、index mtime 与缺失/读取失败降级已迁移至
`src/main/worker/git-index-info.ts`；nearest ancestor branch 的候选规范化、并行 ahead comparison
与稳定最短距离选择已迁移至 `src/main/worker/git-nearest-ancestor-branch.ts`；原四个压缩实现已删除，
两模块各由 10 项断言覆盖。
Recent branches 的固定 100 条 local-ref 查询、short-lived/live 两类缓存、失败与取消降级、
watch generation 竞态清理已迁移至 `src/main/worker/git-recent-branches.ts`；原三个压缩
常量/实现已删除，default branch、普通请求和 live-query 消费者均已接回，由 26 项断言覆盖。
Repository identity 的 effective origin 查询、watcher-aware cache、取消回退、remote name/port
规范化与 worktree id 组装已迁移至 `src/main/worker/git-repository-identity.ts`；原压缩常量/实现
已删除，repository-read 与 turn-diff capture 消费者均已接回，由 28 项断言覆盖。
Submodule paths 的 `.gitmodules` 缺失快路径、可取消 stat、config 查询、路径规范化与稳定去重
已迁移至 `src/main/worker/git-submodule-paths.ts`；原压缩实现已删除，由 15 项断言覆盖。
Cat-file 的四请求批量上限、5 MiB 对象限制、batch 协议解析、输出截断尾部重试、snapshot
一致性与限长磁盘 fallback 已迁移至 `src/main/worker/git-cat-file.ts`；原入口、十二个 helper
及专用常量已删除，由 43 项断言覆盖。
Blame file 的 repository-relative containment、query cache、Git 输出限制、porcelain metadata
复用、GitHub login 与 web URL 推导已迁移至 `src/main/worker/git-blame-file.ts`；原入口、七个
helper 与专用常量已删除，由 29 项断言覆盖。
Worktree list 的 query cache、porcelain record、branch/detached head 与 locked/prunable 状态解析
已迁移至 `src/main/worker/git-worktree-list.ts`；原两个压缩实现已删除，由 14 项断言覆盖。
Ref SHA 的 object ID 校验、query cache、fresh 精确失效、rev-parse 错误与 SHA branding 已迁移至
`src/main/worker/git-ref-resolution.ts`；原两个压缩实现已删除，全部下游消费者改用语义名称，
由 20 项模块断言和 branch/review/turn-diff/handoff/snapshot 回归覆盖。
Current branch 的 HEAD/symbolic fallback、branch/detached/unknown 状态、15 秒 snapshot cache 与
head generation 防陈旧重试已迁移至 `src/main/worker/git-current-branch.ts`；原六个压缩实现和
专用常量已删除，全部 watcher/request/branch/handoff 消费者改用语义名称，由 26 项断言覆盖。
Remote branch 的 ordered remotes、local/remote default branch、main/master fallback、upstream
ref 与 remote tracking branch 查询已迁移至 `src/main/worker/git-remote-branches.ts`；原九个
压缩实现和专用常量已删除，全部下游消费者改用语义名称，由 44 项断言覆盖。
Left/right commit counts 的 query cache、Git 输出解析与四态 ahead 分类已迁移至
`src/main/worker/git-branch-comparison.ts`；原两个压缩实现已删除，nearest ancestor、starting
ref 与 synced-branch state 消费者改用语义名称，由 21 项断言覆盖。
Worktree starting ref 的 local/remote ref 规范化、upstream ahead 选择、remote 候选、
`ls-remote` 验证、fetch 与 fresh ref 复检已迁移至
`src/main/worker/git-worktree-starting-ref.ts`；原七个压缩实现/错误类已删除，由 27 项断言覆盖。
Worktree create 的 branch/default/working-tree 起始引用选择、remote-ref 强制刷新、最长 remote
名称匹配，以及 tracked binary diff 并行收集已迁移至
`src/main/worker/git-worktree-starting-state.ts`；原压缩编排已删除，由 27 项断言覆盖。
Git config 的普通/缓存读取、local/worktree 参数映射、缺失值兼容、worktreeConfig 自动启用重试，
以及 worktree 删除使用的 local environment config path 直读已迁移至
`src/main/worker/git-config-scope.ts`；原六个压缩 helper 和专用键常量已删除，由 49 项断言覆盖。
Git root/common-dir 的本地路径预检、新版单命令快速读取、旧版双命令 fallback、非仓库识别与
专用降级错误已迁移至 `src/main/worker/git-root-resolution.ts`；原三个压缩读取函数、判定 helper、
错误类与日志常量已删除，由 43 项断言覆盖。
Git dir/path 与 index/shared-index 的 query cache、相对路径解析、stat fingerprint 和 WeakMap
缓存已迁移至 `src/main/worker/git-path-resolution.ts`；原七个压缩 helper 与缓存已删除，全部
diff/watch/automation 消费者改用语义入口，由 36 项断言覆盖。
Untracked/path-status 的 porcelain 解析、目录展开、嵌套仓库过滤，以及 tracked/path-status
短缓存已迁移至 `src/main/worker/git-path-status.ts`；原六个压缩查询函数已删除，untracked cache、
snapshot 与 ignore discovery 消费者改用语义入口，由 31 项断言覆盖。
Worktree 删除的 per-host 三并发门控、local environment cleanup、Git remove 与 force 模式
文件系统兜底已迁移至 `src/main/worker/git-worktree-delete.ts`；原四个压缩函数及 limiter 状态/
常量已删除，快照、请求去重与 unwatch 策略仍由上层负责，由 37 项断言覆盖。
Local environment setup/cleanup 的平台脚本选择、shell wrapper、环境差异捕获、流式日志、取消与
临时目录生命周期已迁移至 `src/main/worker/git-local-environment.ts`；原 runtime、十八个 helper
及专用状态已删除，worktree create/delete 消费者改用语义入口，由 76 项断言覆盖。
Worktree create 的 upstream refresh 前置检查、credential config 透传、隔离 fetch 环境、双 signal
取消和 Git progress 流解码已迁移至 `src/main/worker/git-worktree-upstream-refresh.ts`；原 runtime、
两个 helper 及进度状态常量已删除，create 编排改用语义入口，由 53 项断言覆盖。
Worktree create 的 `AGENTS.override.md`、`.worktreeinclude` 与 local-environment 配置复制已迁移至
`src/main/worker/git-worktree-copy-files.ts`；原八个 helper 与三个专用常量已删除，保留 symlink
拒绝、exclusive copy、16 并发与 local/remote host 分支，由 43 项断言覆盖。
Worktree snapshot 的 repository size guard 已迁移至 `src/main/worker/git-repository-size.ts`；
`count-objects -v` 查询/缓存/解析、字节格式化与 200 MiB 上限不再留在入口，原六个 helper 和专用
常量已删除，由 25 项断言覆盖。
Worktree 的 root-relative cwd、根目录解析/创建、命名校验、路径计算与冲突目录预留已迁移至
`src/main/worker/git-worktree-path-allocation.ts`；create 与 resolve-worktree 消费者共用语义入口，
原五个 helper、日志和 marker 常量已删除，由 34 项断言覆盖。
Worktree shell environment 配置的 Git path 解析、JSON/schema 读取、ENOENT/其他错误分流、格式化
写入与删除已迁移至 `src/main/worker/git-worktree-shell-environment.ts`；原日志/文件名常量和四个
压缩实现已删除，create 与只读请求消费者改用语义入口，由 25 项断言覆盖。
Worktree create 的远端起点自动 tracking branch 创建/清理，以及创建后实际本地分支解析已迁移至
`src/main/worker/git-worktree-branch-tracking.ts`；原三个压缩实现已删除，通用 branch-exists
helper 现由 branch creation 语义模块共享，取消回滚与 synced-branch 初始化消费者改用语义入口，
由 31 项断言覆盖。
Worktree checkout 的 safe-filter、upstream refresh、detached add、working-tree diff/untracked 恢复、
tracking branch 与失败 cleanup 主编排已迁移至 `src/main/worker/git-worktree-checkout.ts`；原
`zme`/`Bme`/`Hme` 与专用日志状态已删除，由 44 项断言覆盖。
Worktree create 的 repository/root 解析、命名目录预留、checkout、辅助文件复制、synced config、
local environment setup、失败容忍与 shell environment 持久化完整编排已迁移至
`src/main/worker/git-worktree-create.ts`；原 `V2` 与专用 encoder 状态已删除，由 52 项断言覆盖。
Repository status summary 的 tracked porcelain/rename 解析、generation query cache、snapshot/abort
包装、safe-filter fallback 与 untracked 合并已迁移至 `src/main/worker/git-status-summary.ts`；原四个
压缩实现已删除，review/handoff/request 消费者改用语义入口，由 26 项断言覆盖。
Merge-base 的 cached HEAD query、Git 128 ref-check、ordered remote/upstream 候选生成、ref 验证与
direct fallback 已迁移至 `src/main/worker/git-merge-base.ts`；原五个压缩实现已删除，
review/branch-ahead/read-request 消费者改用语义入口，由 35 项断言覆盖。
Branch creation 的 local branch existence、250ms commit-tree query、普通创建、unborn HEAD fallback
与 synced/worktree 模式编排已迁移至 `src/main/worker/git-branch-create.ts`；原五个压缩实现已删除，
worktree/handoff/snapshot/read-request 消费者改用语义入口，由 62 项断言覆盖。
Git apply patch 的输出路径分类、patch 路径解析、临时 index、现有路径预暂存、参数/状态映射与
cleanup 已迁移至 `src/main/worker/git-apply-patch.ts`；原五个压缩实现已删除，apply-changes、
review-section、worktree checkout 与请求分发消费者改用语义入口，由 62 项断言覆盖。
Git common/worktree repository 与 review snapshot models 的 origin cache、generation、abort/stale
保护、配置读写和 query invalidation 已迁移至 `src/main/worker/git-repository-models.ts`；原四个
压缩 class 实现已删除，manager 仅保留 identity map 与 stable metadata 生命周期，由 142 项断言覆盖。
Managed worktree discovery 的 root/boundary 去重、无 symlink 目录读取、legacy/named 目录识别、
候选复检与 `.git` 文件验证已迁移至 `src/main/worker/git-managed-worktree-discovery.ts`；原六个
压缩实现已删除，平台路径转换通过窄依赖保留，由 52 项断言覆盖。
status summary、branch diff stats、review summary/source line counts/diff/search/patch 已迁移至
`src/main/worker/git-review-request-handlers.ts`，由 15 项行为断言覆盖正常、repository
unavailable、stale snapshot 与 fallback 路径；repository identity、file reads 等其余
Git request cases 和 dispatcher 生命周期仍在入口。
Review diff 共用的 quoted-path escape/octal 解码、diff header 路径解析、rename patch 重写、
路径 quoting 与增删行统计已迁移至 `src/main/worker/git-diff-text.ts`；原十个 helper 已删除，
由 33 项断言覆盖。
Review file diff 的 blob query、跨平台 symlink target/hash 与 regular/symlink/submodule 三类
untracked patch 已迁移至 `src/main/worker/git-review-file-diff.ts`；原三个 helper 已删除，
由 33 项断言覆盖。
Review comparison 的 merge-conflict/commit-parent/HEAD 查询、branch/commit/worktree source 参数、
empty-tree fallback 以及 untracked/unmerged 扫描已迁移至
`src/main/worker/git-review-comparison.ts`；原十个 helper 与 empty-tree 常量已删除，由 53 项断言覆盖。
Review diff 的请求路径规范化、tracked/untracked 并发聚合、250ms diff query、unified diff 分片与
rename blob fallback 已迁移至 `src/main/worker/git-review-diffs.ts`；原八个 helper 已删除，
由 41 项断言覆盖。
Review patch/search 共用的非空 section 合并、untracked diff 八路并发、输入顺序提交、首错停止与
64 MiB 总量限制已迁移至 `src/main/worker/git-review-patch-sections.ts`；原两个压缩 helper 已删除，
由 15 项断言覆盖。
Review patch 的 comparison、cached tracked diff、untracked section 并发合成、错误映射与 snapshot
read 已迁移至 `src/main/worker/git-review-patch.ts`；原三个压缩 helper 已删除，commit-message diff
的 staged fallback 复用同一入口，由 33 项断言覆盖。
Review working-tree metadata 的 per-file generation cache、批量 stat/hash、目录/symlink/regular
分流、untracked `--no-index` metadata 分批与旧 Git fallback 已迁移至
`src/main/worker/git-review-working-tree-metadata.ts`；原 class、十五个 helper 与四个专用状态/阈值
已删除，由 55 项断言覆盖。
Review metadata 的 raw/numstat NUL parser、change-kind/revision、unmerged 去重、rename 合并、
untracked 限额与 metadata 组合已迁移至 `src/main/worker/git-review-metadata-utils.ts`；原十三个
helper 已删除，由 37 项断言覆盖。
Branch diff stats 的 repository operation marker 防护、comparison/status/untracked metadata 汇总、
rename stats 修正与 omission 结果已迁移至 `src/main/worker/git-review-branch-stats.ts`；原四个
helper 与 marker 常量已删除，由 33 项断言覆盖。
Review metadata diff 的 cached raw/numstat query、tracked path 选择、whitespace 过滤和 staged
rename 推断/重组已迁移至 `src/main/worker/git-review-metadata-diff.ts`；原五个 helper 与 512-path
常量已删除，由 42 项断言覆盖。
Review metadata 的 working-tree 最终补全与 untracked metadata 合成已迁移至
`src/main/worker/git-review-metadata-finalize.ts`；原两个 helper 已删除，由 25 项断言覆盖。
Review section 的 stage/unstage/revert 编排、revision 防陈旧校验和 untracked gitlink 清理已迁移至
`src/main/worker/git-review-section-changes.ts`；原五个 helper 已删除，由 56 项断言覆盖。
synced branch/state 与 overwrite repository 编排已迁移至
`src/main/worker/git-synced-branch-request-handlers.ts`，由 11 项行为断言覆盖；overwrite
成功后的 metadata/live-query refresh root 仍显式交回入口，cache/watch 生命周期未混入该模块。
Overwrite repository 的 commit-tree、source reset、target update-ref/index/worktree restore，以及
deleted-path 分块 clean 已迁移至 `src/main/worker/git-synced-branch-overwrite.ts`；原四个压缩实现
已删除，由 24 项命令顺序、失败映射与 warning 降级断言覆盖。
Synced-branch state 的配置/conflict 状态、checked-out worktree 定位、commit/working-tree 快照、
ahead counts 与双侧 numstat 已迁移至 `src/main/worker/git-synced-branch-state.ts`；原八个压缩实现
和状态常量已删除，由 23 项缓存、解析、状态组装与错误日志断言覆盖。
Synced-branch config 的 Git-dir 路径、JSON/schema 解析、静默读取降级、格式化写入与 watcher
路径解析已迁移至 `src/main/worker/git-synced-branch-config.ts`；原日志/文件名常量和六个压缩实现已删除，
branch metadata、state、worktree/branch create 和 watcher 消费者均改用语义入口，由 28 项断言覆盖。
repository identity、commit-message diff、submodule paths、cat-file、blame、index info 与
config value 已迁移至 `src/main/worker/git-repository-read-request-handlers.ts`，由 15 项行为
断言覆盖 repository/snapshot 缺失和参数透传。
turn diff capture start/complete 编排已迁移至
`src/main/worker/git-turn-diff-request-handlers.ts`，由 8 项行为断言覆盖；watcher ready/recovery
状态所有权仍留在入口，并通过显式 `isRepoWatched` 回调注入。
Turn-diff snapshot 的 reviewSnapshot cache、porcelain status、clean HEAD tree 快路径和临时 index
staging/write-tree 已迁移至 `src/main/worker/git-turn-diff-snapshot.ts`；原五个压缩实现已删除，
由 21 项解析、命令、缓存和错误断言覆盖。
Turn-diff capture/checkpoint 的 ref retain/release、diff 生成、recent checkpoint、TTL pruning、
checkpoint 串行队列和 start/complete 生命周期已迁移至 `src/main/worker/git-turn-diff-capture.ts`；
原十二个压缩实现、共享 Map 与常量已删除，由 19 项状态、错误和 cleanup 断言覆盖。
Automation writable roots 的 worktree/source root、common dir 与 index/`.git` fallback 已迁移至
`src/main/worker/git-automation-writable-roots.ts`；原 `_ye` 已删除，由 9 项路径矩阵断言覆盖。
Git live-query 的 trace 选择/link 合并和 repository change 刷新矩阵已迁移至
`src/main/worker/git-live-query-policy.ts`；原四个压缩策略函数与常量已删除，由 101 项断言覆盖；
timer、abort 与 shared-run 生命周期仍留在入口。
Git init watcher 的双 watch、git path detection、session close/dispose race、metadata 缺失降级和
指数重连已迁移至 `src/main/worker/git-init-watcher.ts`；原压缩类与常量已删除，由 35 项断言覆盖。
Git live-query registry 的 subscription/generation、debounce/retry、shared-query coalescing、
repository serialization、consumer abort、recovery 与 branch dependency 引用计数已迁移至
`src/main/worker/git-live-query-registry.ts`；原压缩类和三个常量已删除，由 41 项断言覆盖。
Git watcher performance 的窗口分桶、累计计数、raw-event 阈值 flush 和 timer 清理已迁移至
`src/main/worker/git-watcher-performance.ts`；原压缩类与常量已删除，由 18 项断言覆盖。
Git watcher metadata prefetch 的批量 `rev-parse`、输出校验、query cache 回填、git dir 与
metadata 路径解析已迁移至 `src/main/worker/git-watcher-metadata.ts`；原
`zye`/`Bye`/`Vye`/`E6` 已删除，由 48 项断言覆盖。
stable metadata 与 Git read cache invalidation 已迁移至
`src/main/worker/git-cache-request-handlers.ts`，由 17 项行为断言覆盖严格副作用顺序、异常
短路及 live-query refresh 的 fire-and-forget 时序。
`git-init-repo` 的 cwd 校验、命令执行、错误优先级与 metadata invalidation 已完整迁移至
`src/main/worker/git-init-request-handler.ts`，原压缩实现已删除，由 11 项行为断言覆盖。
Git push 的 remote 选择、参数组装、porcelain 错误分类、exec output 与成功 refresh root 已完整
迁移至 `src/main/worker/git-push-request-handler.ts`，原四个压缩函数已删除，由 17 项行为断言覆盖。
Git checkout 的 local/remote/detached ref 解析、stash/rollback、冲突路径分类、cache invalidation
与成功 refresh root 已完整迁移至 `src/main/worker/git-checkout-request-handler.ts`，原五个压缩
函数实现已删除（`t4` 保留薄兼容适配器），由 16 项行为断言覆盖。
Git commit 的 repository/staging、nothing-to-commit、commit SHA 与 refresh-root 时序，以及
attribution 清洗、co-author trailer 去重和 trailer block 换行规则已迁移至
`src/main/worker/git-commit-request-handler.ts`；原七个 message helper 与默认 attribution 常量已删除，
由 48 项行为断言覆盖。
Origin discovery 的去重、平台路径判定、Git marker 向上查找、metadata/root/origin 组合和失败
隔离已完整迁移至 `src/main/worker/git-origin-discovery.ts`，原七个压缩函数已删除，由 11 项断言覆盖。
`set-config-value` 的参数透传和 refresh-root 规则已迁移至
`src/main/worker/git-config-request-handler.ts`，由 5 项行为断言覆盖 worktree-local 特例。
Worktree snapshot/state 的候选目录、snapshot commit、路径 inspection、managed-state 状态机与
snapshot 后删除失败策略已迁移至 `src/main/worker/git-worktree-snapshot.ts`，原四个压缩函数已删除，
由 22 项断言覆盖。
Worktree snapshot 打包的文件枚举、index 指纹稳定读、tracked/untracked 合并、目录展开与
8KB literal pathspec 分批已迁移至 `src/main/worker/git-worktree-files.ts`；原九个 helper 和
两个常量已删除，由 32 项断言覆盖。
Worktree owner 的 `codex-thread.json` 定位、schema 解析、读写与 owner 更新已迁移至
`src/main/worker/git-thread-config.ts`；原三个实现函数已删除，两个旧符号只保留薄适配器，
由 11 项行为断言覆盖。
Thread worktree resolution 的 metadata 快路径、owner fallback、候选排序、子路径映射与 dirty
检查已迁移至 `src/main/worker/git-worktree-resolution.ts`；原六个实现函数已删除，dispatcher
仅保留 envelope 和现有 query/cache 依赖注入，由 22 项行为断言覆盖。
Git watch 请求层的 init-watch dispose、watch-repo tracing/reuse、live-query recovery/unwatch，
以及长生命周期 `subscribe-live-query` 的 metadata coalescing、abort、subscribe/unsubscribe 与
releaseWatch `finally` 已迁移至 `src/main/worker/git-watch-request-handlers.ts`，由 25 项行为断言覆盖。
Git apply changes/patch/review-section 三类 mutation 的参数注入、partial apply 判定与 refresh-root
规则已迁移至 `src/main/worker/git-apply-request-handlers.ts`，由 11 项行为断言覆盖。
其中 `apply-changes` 的 merge-base、binary diff、目标路径预暂存、临时 index 与结果映射已进一步
迁移至 `src/main/worker/git-apply-changes.ts`；原六个底层压缩 helper 已删除，由 31 项断言覆盖。
Worktree cancel/list/owner/restore/delete 和三类 thread handoff 请求编排已迁移至
`src/main/worker/git-worktree-request-handlers.ts`；owner 写入容错、progress event、跨 host cache
失效与 transfer cleanup 由 45 项行为断言覆盖，底层 move/snapshot 算法继续分批迁移。
Host handoff transfer 的临时目录、跨 host 文件复制与 cleanup 路径安全边界已迁移至
`src/main/worker/git-handoff-transfer.ts`；原三个压缩实现已删除，由 19 项 POSIX/Windows
路径与传输断言覆盖。
Handoff branch/stash 的分支 commit 检查、创建/强制更新、stash SHA 映射和 apply/pop/drop
已迁移至 `src/main/worker/git-handoff-branch.ts`；原五个压缩实现和调用名已删除，由 34 项
命令与错误语义断言覆盖。
Handoff rollback 的 branch/stash、source worktree 和新建/复用 host worktree 恢复已迁移至
`src/main/worker/git-handoff-rollback.ts`；原四个压缩实现和调用名已删除，由 19 项回滚顺序与
异常传播断言覆盖。
Host handoff destination checkout 的干净 commit、默认分支选择和安全 detach 判定已迁移至
`src/main/worker/git-handoff-destination.ts`；原两个压缩实现和调用名已删除，由 19 项状态与
checkout 断言覆盖。
Host handoff 的 repository metadata 重试、commit 存在性检查与 shared-base fetch fallback
已迁移至 `src/main/worker/git-handoff-shared-base.ts`；原三个压缩实现和调用名已删除，由 27 项
本地/远程重试、默认分支、merge-base 与多 remote 回退断言覆盖。
Host handoff 的完整跨 host 主编排已迁移至 `src/main/worker/git-host-handoff.ts`；原 `Pve/Q3`
实现已删除，参数校验、snapshot/bundle 快慢路径、新建与复用 worktree、progress、rollback 和
`finally` 清理由 48 项行为断言覆盖。
Move-to-local 的分支占用检查、source detach/stash、local dirty guard、branch checkout、stash
迁移与双侧回滚已迁移至 `src/main/worker/git-move-to-local.ts`；原 `zve` 实现已删除，由 31 项
成功、失败、warning 与异常恢复断言覆盖。
Move-to-worktree 的 local/target checkout、双 stash 迁移、created-worktree cleanup 与分阶段回滚
已迁移至 `src/main/worker/git-move-to-worktree.ts`；原 `Bve` 实现已删除，由 26 项断言覆盖。
Git branch search 的 query 规范化、ref pattern、local/remote ref 解析和 branch-name 去前缀
已迁移至 `src/main/worker/git-branch-search.ts`；原五个压缩 helper 已删除，由 16 项断言覆盖。
Git branch search 的 query-cache、local-first/remote fallback、流式输出解码、limit abort 与父 signal
传播已迁移至 `src/main/worker/git-branch-search-runtime.ts`；原三个异步压缩实现已删除，由 15 项
缓存参数、分片、去重、限额和取消断言覆盖。
preload 的 Chrome/Edge 扩展发行配置已抽取为
`src/main/browser-page-preload/extension-distribution.ts`，由 5 项行为断言覆盖；
preload annotation overlay 的 loopback/localhost URL 安全策略已抽取为
`src/main/browser-page-preload/local-url.ts`，由 9 项行为断言覆盖；
preload 的 WebMCP registry shim 已抽取为
`src/main/browser-page-preload/webmcp-registry.ts`；旧压缩实现已物理删除，并由 9 项行为断言覆盖；main
preload 的 WebMCP descriptor 序列化与数量/字节限制已抽取为
`src/main/browser-page-preload/webmcp-descriptor.ts`，由 5 项行为断言覆盖。
窗口外观策略已抽取为 `src/main/main-app/window-appearance.ts`，并包含 traffic-light
system theme 归一化策略，新增 3 项 focused 断言。
BrowserWindow appearance options 的纯策略（原 `z9`）也已迁移至该模块，新增 3 项 focused 断言。
geometry/title-bar overlay，由 12 项行为断言覆盖；preload annotation surface
协议 schema 已抽取为 `src/main/browser-page-preload/annotation-protocol.ts`，由 6 项
行为断言覆盖；annotation hit payload 安全清洗、surface 元素安全边界与 selection
渲染策略已抽取为 `src/main/browser-page-preload/annotation-runtime.ts`，由 45 项
行为断言覆盖；annotation controls registry 的注册、更新、target 索引、dispose
与可信 pagehide 清理由 `src/main/browser-page-preload/annotation-controls-registry.ts`
承载，并由 10 项行为断言覆盖。
pending editor message reducer 已进一步抽取为 `src/main/browser-page-preload/pending-editor-message.ts`，
并由 6 项行为断言覆盖。
annotation surface feature observer（DOM/shadow-root 扫描、feature 状态、pageshow 与
dispose 生命周期）已抽取为 `src/main/browser-page-preload/annotation-surface-observer.ts`，
annotation shadow-root discovery observer（原 `Ng` 22064-22116）已进一步迁移至 `src/main/browser-page-preload/annotation-shadow-root-observer.ts`，由 4 项行为断言覆盖动态 shadow-root 注册、失效清理、annotation selector 变更通知与 attachShadow 事件监听。
annotation surface IPC event dispatch/response-event 判定（原 `Xg` 22415-22417）已迁移至 `src/main/browser-page-preload/annotation-surface-events.ts`，保留 bubbling、JSON detail 序列化和 `CustomEvent` 判定，由 5 项行为断言覆盖。
annotation editor default-mode meta lookup（原 `Iy` 24484-24492）已迁移至 `src/main/browser-page-preload/annotation-editor-default-mode.ts`，保留 meta selector、允许值过滤及缺失 head/content 的安全回退，由 3 项行为断言覆盖。
worker shell 环境输出 delimiter/ANSI 解析与大小写不敏感环境变量读取已迁移至 `src/main/worker/shell-environment-parser.ts`，由 5 项行为断言覆盖 newline/NUL 分隔、转义清理、边界错误与环境键查找。
worker Windows Git executable resolution、PATH 大小写覆盖与 `.cmd/.bat` command wrapper 已迁移至 `src/main/worker/git-executable.ts`，入口通过窄委托接回，由 6 项行为断言覆盖平台早退、环境合并、where 候选与 ComSpec 包装。
main worker bus 的启动结果与事件类型纯谓词已迁移至
`src/main/main-app/worker/worker-event-predicates.ts`，入口保留 `Sst/Cst/wst` 兼容委托，
由 `scripts/test-main-worker-event-predicates.mjs` 覆盖 8 项断言；worker 启动与 IPC
副作用仍保留在原入口。
worker-main RPC 的方法白名单、取消消息和请求消息校验已迁移至
`src/main/main-app/worker/rpc-message-predicates.ts`，入口保留 `gst/_st/vst` 兼容委托，
由 `scripts/test-main-worker-rpc-message-predicates.mjs` 覆盖 10 项断言；RPC 调度与
worker 生命周期仍保留在原入口。
workspace startup policy checker（原 `Tst`）已迁移至
`src/main/main-app/startup/workspace-policy-checker.ts`，保留登录状态、generation
竞态、app-quitting 守卫和一次性重启通知语义，由
`scripts/test-main-workspace-policy-checker.mjs` 覆盖 7 项异步断言。
workspace policy restart dialog（原 `Est`，175,026-175,046）已迁移至
`src/main/main-app/startup/workspace-policy-restart-dialog.ts`，由
`scripts/test-main-workspace-policy-restart-dialog.mjs` 覆盖同步展示、格式化文案、错误降级及始终执行 quit approval/退出顺序。
main 托盘图标候选路径解析（原 `Fst/$9`，175,431-175,471）已迁移至
`src/main/main-app/startup/tray-icon-paths.ts`，由 `scripts/test-main-tray-icon-paths.mjs` 覆盖平台、flavor、打包与开发路径组合。
computer-use worker RPC handler（原 `Lst`）已迁移至
`src/main/main-app/worker/computer-use-rpc-handler.ts`，入口只保留服务 PID 管理副作用，
由 `scripts/test-main-computer-use-rpc-handler.mjs` 覆盖 5 项断言。
computer-use history scope/clear action 常量及 application-session 时间区间策略（原
`Dst/Ost` 与 `kst` 内联计算）已迁移至
`src/main/main-app/computer-use/history-scope-actions.ts`，由
`scripts/test-main-history-scope-actions.mjs` 覆盖 10 项断言；入口仍保留 native status
tray ready 状态谓词已迁移至 `src/main/main-app/tray/tray-readiness.ts`，由
`scripts/test-main-tray-readiness.mjs` 覆盖 5 项断言。
item 的 Electron、worker 与导航副作用。
由 13 项行为断言覆盖；main 启动 flavor/platform flags 与阶段计时策略已抽取为
`src/main/main-app/startup/startup-policy.ts`；路径扩展名分类、debug Chrome page 和 remote-hosted
PIP 进程号策略也已接回该模块，由 17 项矩阵与边界断言覆盖。
main 更新即时退出清理（原 `Wst`，176,933-176,955）已抽取为
`src/main/main-app/app-shell/immediate-update-exit.ts`，通过注入式依赖保留进程树清理、
异步 cleanup、窗口销毁、错误告警与 `app.exit(0)` 顺序，由
`scripts/test-main-immediate-update-exit.mjs` 覆盖行为断言；Ust 其余启动装配仍在入口。
启动清理等待与超时原语（原 `s7/Lrt`，161,783-161,788、175,938）已抽取为
`src/main/main-app/startup/cleanup-timeout.ts`，保留 cleanup 成功、拒绝和超时均完成的关停语义，
由 `scripts/test-main-cleanup-timeout.mjs` 覆盖 4 项断言；具体清理副作用仍由入口注入。
启动阶段延迟展示进度窗口的 timer、异步 show、取消及 cleanup 竞态已迁移至
`src/main/main-app/startup/delayed-progress-window.ts`，由
`scripts/test-main-delayed-progress-window.mjs` 覆盖 5 项时序断言。
启动参数中的可打开文件类型、`file://` 归一化、绝对路径/深链过滤、`--open-project`
跳过和去重 descriptor 已抽取为 `src/main/main-app/files/open-path-arguments.ts`，
入口仅保留兼容别名；desktop open-path 的 directory、HTML browser-document 与普通 file 分类也已接回同一模块，由 `scripts/test-main-open-path-arguments.mjs` 覆盖 17 项断言。
annotation surface registry（surface registration、hit-test、render/cancel/clear 与
dispose）已抽取为 `src/main/browser-page-preload/annotation-surface-registry.ts`，
由 9 项行为断言覆盖。
virtual annotation target payload 组装已抽取为
`src/main/browser-page-preload/annotation-virtual-target.ts`，由 6 项行为断言覆盖。
surface/viewport rect clipping 已抽取为
`src/main/browser-page-preload/annotation-surface-geometry.ts`，由 4 项行为断言覆盖。
其中也承载 region rect union，geometry 回归断言增至 6 项。
共享的按轴 rect intersection、rect scale、coordinate clamp 与大区域判定也已迁入同一模块，
marker/scroll/frame 入口直接接回，geometry 回归断言增至 14 项。
Region drag 的 viewport 判定、4px threshold、双点 rect 与持续拖拽状态也已迁入 geometry 模块；
原 `Is/Ls/Rs/ab/ob/sb/cb` 七个压缩函数已删除，geometry 回归断言增至 24 项。
annotation 空格键拦截与输入保护策略已抽取为
`src/main/browser-page-preload/annotation-keyboard.ts`，由 5 项行为断言覆盖。
annotation 模式的跨域 iframe pointer-events guard 已完整迁移至
`src/main/browser-page-preload/annotation-frame-pointer-guard.ts`，由 13 项行为断言覆盖
document/shadow-root 扫描、动态 frame、load 恢复、overlay 排除和 dispose 样式所有权。
浏览器图片拖拽与鼠标前进/后退输入桥已迁移至
`src/main/browser-page-preload/browser-input-bridge.ts`，由 22 项行为断言覆盖 trusted-event、
capture phase、图片来源优先级、active drag 状态与宿主消息协议。
annotation permission 的请求去重、request-id 配对、invoke 失败与 reset 生命周期已迁移至
`src/main/browser-page-preload/annotation-permission-controller.ts`，由 14 项行为断言覆盖。
annotation context 初始状态、host sync 默认值/布尔归一化与 comment-mode 判定已迁移至
`src/main/browser-page-preload/annotation-context-state.ts`，由 24 项行为断言覆盖。
annotation host message 的 pre-mount/mounted allowlist 与路由决策已迁移至
`src/main/browser-page-preload/annotation-host-message-routing.ts`，由 34 项行为断言覆盖。
annotation preload 的 policy 初始化、feature resources、lazy mount、host bridge、pending replay 与
pagehide cleanup 已完整迁移至 `src/main/browser-page-preload/annotation-preload-runtime.ts`；原八个
压缩入口函数及其私有状态已删除，由 20 项集成行为断言覆盖。
annotation overlay 的 root、hover/design refresh、flex gap、element cache、mutation、selection、
tooltip 与 region 去重非 React runtime 已迁移至
`src/main/browser-page-preload/annotation-overlay-runtime.ts`；原十一段压缩实现改为薄入口代理，
缓存状态移入模块内部，由 48 项行为断言覆盖。
annotation serialization boundary（名称规范化、metadata descriptor/key/value 与 UTF-8 大小限制、
属性 metadata JSON 解析）已迁移至 `src/main/browser-page-preload/annotation-serialization.ts`，
入口保留兼容代理，由 11 项行为断言覆盖。

**尚未宣称终局完成**：worker/preload/main/hub 中仍有已审计但尚未逐段物理
迁出的业务区段；它们在审计表中有明确行号和保留理由，后续语义化必须继续
遵守双轨构建与导出契约。B2 已将主进程原始对照 chunk 移至
`.reference/originals/main/`，并由构建脚本按历史输出文件名重新编译；
`src/webview/assets/` 仍通过 tsconfig 显式排除。

---

## 一、为什么还没「完全」反编译（2026-10-03 审计结论）

前一阶段的方法论是**消费驱动**：只语义化被重写代码实际 import 的导出。
这保证了结构等价与门禁，但留下了四处「整体保留、未逐段物理迁出」的业务代码面，
以及五处工程可读性缺口；shared 692 导出全量分类已经完成。**它们不是待办清单的尾巴，而是「完全反编译」
与「结构等价完成」之间的全部差距。**

### A. 四处压缩业务代码面 + 一处 shared 分类面

| # | 位置 | 体量 | 现状 | 问题 |
|---|---|---|---|---|
| A1 | `.reference/originals/main/worker.ts`（git-worker） | **82,510 行** | 整体 PRESERVED，已完成逐段审计并开始分批抽取 | Git RPC 面、session 生命周期仍有大量业务区段待迁移 |
| A2 | `.reference/originals/main/browser-page-preload.ts` | **29,270 行** | 整体 PRESERVED，已完成逐段审计并抽取 WebMCP 与多段 annotation runtime | React render/hook assembly 等业务区段仍待迁移 |
| A3 | main chunk 未消费区域 | 原版 177K 行 vs 语义 133K | 已完成全量覆盖审计 | 仍需继续物理迁移 business-preserved 区段 |
| A4 | shared 导出全量分类 | **692 个** | 已完成全量分类 | `docs/shared-full-classification.md` 为每个导出登记 semantic 或 preserved vendor/generated/legacy 归属；`audit-shared-consumption` 当前 `TOTAL: 0` |
| A5 | renderer 三大 hub 内部 | app-shared 4.8MB / app-initial 14.3MB / app-primary 3.1MB | 已完成构成审计与消费契约审计 | 现有 343/343 仅证明消费面；全量分类门禁尚未实现，仍有未消费业务逻辑待物理迁出 |

### B. 工程可读性缺口（5 处）

| # | 问题 | 现状 |
|---|---|---|
| B1 | tsconfig 吞 586 万行 transform-only 文件 | **已完成**：`exclude: ["src/webview/assets"]` 已生效，语义源码继续纳入 typecheck |
| B2 | 原版对照文件已迁出 | 10 个主进程原始 chunk 位于 `.reference/originals/main/`，`scripts/build.mjs` 映射回历史输出名并已通过 build/verify/smoke |
| B3 | README 过时 | **已完成**：README 记录 11 个主进程重写 chunk、1874 个 renderer chunks、双轨构建和验证入口 |
| B4 | 测试脚本无索引 | **已完成**：`scripts/test-index.md` 当前索引全部 731 个 `scripts/test-*.mjs` 脚本 |
| B5 | 端到端验证深度浅 | **已完成**：smoke 验证主窗口 HTML 加载、app-server 握手，并过滤 renderer 致命错误；关键日志采用宽限轮询 |

---

## 二、任务清单（按序执行；每项完成后更新本表状态）

### T1 · git-worker 逐段审计与业务语义化（A1，最大件）★

1. **审计先行**：对 `.reference/originals/main/worker.ts` 做逐段扫描，产出
   `docs/git-worker-audit.md`：每一段标注 `business`（git 操作 RPC 面、
   session/生命周期、协议处理）或 `vendored`（libgit 绑定、HTTP/stream
   库、node 依赖），附行号区间与判定证据（包名/版本号/UA 特征）。
2. **业务段语义化**：按既有闭环写入 `src/main/worker/`（或按子系统拆
   `src/main/worker/<子系统>/`），兼容导出对齐，登记 REWRITTEN。
   verify-chunks 已支持 CJS requires/exports 比对。
3. **vendored 段**：保留原版并逐段登记理由（扩展 chunk-manifest 的
   PRESERVED Map 为分段理由，或新建 `docs/` 审计文档承载）。
4. **worker_threads 启动协议**确实不可拆的部分（入口薄层）保留原样，
   在审计文档写明"保留边界"的精确行号。
5. 完成后重跑 `node scripts/audit-shared-consumption.mjs`——新消费的
   shared 导出会出现缺口，转入 T3 清零。

### T2 · browser-page-preload 审计与业务语义化（A2）

同 T1 方法：审计 `docs/preload-audit.md` → contextBridge IPC 协议、
schema、消息处理语义化到 `src/main/browser-page-preload/`；内嵌
runtime/vendor 保留登记。参考已重写的 `preload/`、`sandbox-preload/`
两个先例的验证方式。

### T3 · shared 导出全量分类（A4，已完成；与 T1/T2 联动）

1. 对全部 692 个导出逐一判定：`business`（语义化到
   `src/main/shared/<模块>.ts`，方法同前）或 `vendor/generated`
   （登记保留理由）。判定依据：导出符号的原文实现是否含业务语义
   （协议/状态/配置）vs 纯库转发（lodash/ms/debug shim）。
2. T1/T2 语义化产生的新消费缺口随做随清；本任务完成判据是
   **692 个导出全部有归属**：语义化声明或保留登记，二选一，无未分类。
3. 已产出 `docs/shared-full-classification.md`（692 个导出清单 + 归属 + 证据），当前 `audit-shared-consumption` 为 `TOTAL: 0`。

### T4 · main chunk 未消费区域审计（A3，原可选 T6 转正）

1. 对照 `docs/main-analysis-r1..r12.md` 的区域清单，对
   `.reference/originals/main/main-C-Mhak1n.ts` 做逐段覆盖审计：每段标注已被哪个语义
   模块覆盖 / 仍为原样 / 属 vendored。
2. 仍为原样的**业务段**补语义化（预计很少——R1-R12 已全区落地，
   gap 应主要是 vendored 与低频路径，但必须以审计报告证实，不能沿用断言）。
3. 产出 `docs/main-coverage-audit.md`，含"原版行号区间 → 语义模块/
   保留理由"映射表。

### T5 · renderer hub 内部审计与语义化（A5）

1. **app-shared（4.8MB）**：对未被消费的导出做实现级审计。产出
   `docs/app-shared-internal-audit.md`：业务逻辑（store/query/UI 基础
   组件）语义化进 `src/renderer/app-shared/`（已有 runtime 六模块骨架，
   按分区扩展）；vendor/胶水登记。**注意**：语义化后
   `audit-app-shared-consumption.mjs` 的口径要从"消费驱动"升级为
   "全量分类"，保持 343/343 不回退。
2. **app-initial（14.3MB）**：先做构成审计（参照
   `docs/renderer-classification.md` 第二节：2,284 个引用中 683 lucide、
   65 locale、219 shiki…真正的 app 逻辑约 654 个引用/18.8MB）。对其中
   **未被任何已重写 chunk 消费的 app 逻辑**（如 i18n 核心
   `i18n-147d032388be`、view-state-persistence）逐个语义化；聚合胶水
   （micromark/zod/valdi）登记保留。
3. **app-primary（3.1MB）**：同法审计。
4. **红线不变**：PRESERVED_ASSETS 的 426 个资产禁止伪造源码；
   INCREMENTAL_HUBS 机制在本任务中被"全量分类"取代——hub 从
   "按消费面"升级为"按审计分类"，登记集同步更新。
5. verify-renderer 全程保持绿；hub 语义化走既有 chunk 闭环。

### T6 · 工程可读性（B1-B4）

1. **tsconfig 瘦身（已完成）**：`"exclude": ["src/webview/assets"]` 已生效
   （transform-only 不参与类型检查），typecheck 基线保持 0；后续若出现新错误，
   说明有语义源码偷偷依赖了原版类型——修复依赖而不是恢复 include。
2. **原版对照迁出（已完成）**：10 个主进程原始 chunk 已迁至
   `.reference/originals/main/`，构建脚本按历史输出文件名重新编译；后续修改映射时必须复跑
   build/verify 全套，且 `../chatgpt-desktop-src` 对照逻辑不得受影响。
3. **README 重写（已完成）**：反映真实状态（11+1874 REWRITTEN、双轨机制、
   目录导览、验证命令、架构图一页：主进程模型/renderer 入口链/
   chunk 拓扑）。读者定位：第一次打开仓库的工程师，10 分钟内知道
   "这是什么、怎么构建、去哪里改"。
4. **测试索引（已完成）**：`scripts/test-*.mjs` 全部 731 个脚本已登记至
   `scripts/test-index.md`，并按近期语义提取套件和现有套件分组。

### T7 · 端到端验证升级（B5，已完成）

1. `scripts/smoke-test.sh` 已升级：pack 后启动，除"不崩"外至少验证：
   主窗口 HTML 加载（webContents 日志/标题断言）、renderer 无致命
   console error、一条核心 RPC 往返（如 settings read）。
2. 已产出 `docs/e2e-verification.md`，记录验证步骤与结果快照。

---

## 三、终局 Definition of Done（全部达成 = 完全反编译）

1. **A1-A5 清零**：四处压缩业务代码面与一处 shared 分类面全部完成逐段审计，审计文档落盘
   （git-worker/preload/main 覆盖/shared 全量分类/hub 内部），
   业务段语义化、vendor 段带证据登记，**仓库内不存在无归属的
   压缩业务代码**。
2. **shared 692 导出全量分类**：语义化或保留登记，二选一，0 未分类。
3. **B1-B5 全部完成**：tsconfig 瘦身生效、原版对照迁出 src/、
   README 反映真实状态、测试有索引、端到端验证升级并通过。
4. **全部门禁绿**：verify-renderer、verify-chunks、typecheck 0、
   audit-shared-consumption TOTAL 0、audit-app-shared-consumption
   （口径升级后）无缺口、smoke-test 通过。
5. handoff.md 本身更新为「项目完成」终态快照。

达成以上即宣布：**整个项目完全反编译——语义源码 + 可读工程结构**。

---

## 四、方法论与坑纪律（沿用，全文见 git 历史 handoff）

- 双轨构建 / chunk 闭环七步 / 批次流程（`verify-renderer-cluster`）不变。
- 坑：cwd 每条命令重置（一律 `cd .../codex-desktop-glm-version && `）；
  Bash/Write 的 HTML 实体解码（用 chr(38) 拼接绕过）；verify 失败先查
  导出别名/依赖集合；不重构原版行为；禁改 `../chatgpt-desktop-src`；
  typecheck 基线 0 只减不增；commit 中文带符号映射与自测数。
- **本阶段新增纪律**：审计文档是第一产出——先有逐段判定与证据，
  再动手语义化；「保留」必须给到行号区间级理由，不接受整文件一句话。

## 五、快速开始

```bash
cd /Users/david/Workspace/ppio_github/codex-desktop-glm-version && \
node scripts/verify-renderer.mjs && node scripts/verify-chunks.mjs && \
npm run typecheck && node scripts/audit-shared-consumption.mjs
```

健康值：1874/1874、11/11、typecheck 0、TOTAL 0。后续继续处理审计表中
标记为 `business-preserved` 的区段；不得把审计文档或 preserved 登记误当成
业务语义化完成。

### 增量抽取：GitHub pull request summary batcher

Command/shortcut registry 的纯策略边界已抽取到
`src/main/shared/command-registry-policy.ts`（鼠标快捷键、冲突组、跨平台 accelerator
归一化与 modified-Enter 判定），入口保留命令表、keymap IO 与写入副作用；由 9 项
focused assertions 覆盖。

Command capability 的 required-access 与 shortcut-configurable 判定已抽取到
`src/main/shared/command-capability-policy.ts`，入口保留命令索引与 keymap 编排；由 7 项
focused assertions 覆盖 codex/work-local、VS Code-only 与鼠标快捷键边界。

GitHub PR summary 的按账号批量去重、debounce、GraphQL 检查分页与 abort 语义已迁移至
`src/main/worker/github-pull-request-summary.ts`，入口仅保留 `gh-pr-summary` 适配与账户校验。
新增 `scripts/test-github-pull-request-summary.mjs`，覆盖 2 项基础断言；整体 handoff 仍未完成。

GitHub exact-revision review 的 diff/file handlers 已迁移至
`src/main/worker/github-pull-request-revision.ts`，入口仅保留 API 适配；SHA/path、账号、
文件大小/编码安全限制和 host 并发语义由 6 项断言覆盖，整体 handoff 仍未完成。

编辑器打开参数的远程 host 判定、VS Code remote URI 与 folder/file/`--goto` 参数构造已迁移至
`src/main/worker/editor-open-args.ts`，由 9 项独立断言覆盖；编辑器发现与进程执行副作用仍留在入口。

worker 子进程环境清洗已抽取为 `src/main/worker/platform-env.ts`，统一过滤
Crashpad/Electron 注入变量并保持大小写不敏感、非变异语义，由
`scripts/test-worker-platform-env.mjs` 的 6 项断言覆盖；平台命令执行和环境合并副作用仍留在入口。
worker open-in target 的平台描述符合并、跨平台 target 构造与 editor SSH 能力矩阵已迁移至
`src/main/worker/open-in-target-descriptors.ts`；原 `t9` 已删除，`n9/r9` 仅保留薄委托，
由 12 项 focused assertions 覆盖字段覆盖、缺失平台、hidden、默认参数与 Linux open 绑定。
worker editor target 参数构造已迁移至 `src/main/worker/editor-target-args.ts`，覆盖
JetBrains 参数、Zed SSH URI、TextMate txmt URI 与行列位置追加，由 9 项 focused assertions 覆盖。
worker Windows `PATH`/`Path` 环境键合并策略已迁移至
`src/main/worker/windows-command-env.ts`，由 6 项 focused assertions 覆盖；入口继续负责
命令执行与平台环境注入。
Linux `.desktop` `[Desktop Entry]` 键值解析已迁移至
`src/main/worker/linux-desktop-entry-parser.ts`，由 5 项 focused assertions 覆盖；入口继续负责
文件发现、读取和进程启动副作用。
平台安装项的稳定排序策略已迁移至 `src/main/worker/platform-entry-order.ts`，由 3 项 focused
assertions 覆盖；入口继续负责平台目录发现与安装副作用。
WSL open-in 的 `wsl.exe` 参数组装已迁移至 `src/main/worker/wsl-open-target-args.ts`，由 3 项
focused assertions 覆盖；入口继续负责 WSL 发现、进程执行和错误处理。
macOS `.app/Contents/MacOS` bundle 可执行路径提取已迁移至
`src/main/worker/mac-app-path.ts`，由 3 项 focused assertions 覆盖；入口继续负责 bundle 探测
与进程启动。
worker 可执行候选的扩展名与 Windows `.cmd/.bat/.exe` fallback 已迁移至
`src/main/worker/executable-candidate.ts`，由 4 项 focused assertions 覆盖；入口继续负责
文件系统探测和进程启动。
Git sparse pathspec 不支持错误的 fallback 判定已迁移至
`src/main/worker/git-pathspec-policy.ts`，由 4 项 focused assertions 覆盖；入口继续负责
`git add` 重试编排与文件系统副作用。
worker 终端编辑器行列参数与 macOS Terminal/Kitty/Ghostty/iTerm2 启动命令生成已迁移至
`src/main/worker/terminal-open-policy.ts`；入口保留 `$EDITOR` 探测、进程执行和 fallback，
新增 11 项 focused assertions。
worktree 缓存失效的 host-aware 路径包含判定已抽取为 `src/main/worker/git-path-containment.ts`，
入口 `FZ` 保留兼容委托，由 5 项行为断言覆盖 local/remote 路径与边界。
桌面 prompt context 包裹与可选 instruction section 拼接已抽取为 `src/main/worker/prompt-context-format.ts`，
入口 `Ede/Ide` 保留兼容委托，由 5 项行为断言覆盖 trim、空段与顺序。
WSL active distro fallback 与 `wsl.exe` command argv 构造已补充迁移至
`src/main/worker/platform-wsl.ts`，由 7 项 WSL 平台断言覆盖；实际进程执行与日志副作用仍在入口。

GitHub pull-request board 的仓库候选、查询参数、open/merged 编排和状态映射已迁移至
`src/main/worker/github-pull-request-board.ts`；入口仅保留 host/GitHub CLI/Git manager 适配，
由 `scripts/test-github-pull-request-board.mjs` 的 6 项断言覆盖。整体 handoff 仍未完成。

- worker 协议 schema 的 elicitation/approval 归一化已迁至 `shared/elicitation-protocol.ts`，保留 `misc-runtime` 兼容导出并由 6 项行为断言覆盖。
Linux terminal 参数策略已抽取为 `src/main/worker/linux-terminal-args.ts`，入口仅保留平台环境与路径适配；新增 6 项 focused 断言并同步测试索引。
Annotation text input target 的 `HTMLInputElement` 类型白名单与 textarea 判定已抽取为
`src/main/browser-page-preload/annotation-input-target.ts`，入口 `Ju` 保留兼容委托；由
`scripts/test-preload-annotation-input-target.mjs` 覆盖 6 项行为断言。
Annotation overlay 的条件 class-name 归一化/拼接（原 `cv/lv`）已抽取为
`src/main/browser-page-preload/annotation-class-names.ts`，两个 cursor 组件改用语义入口，
原压缩 helper 已物理删除；由 9 项行为断言覆盖递归数组、对象 map 与 falsey 过滤。
Annotation controls 的 running-animation ancestor/frame 判定（原 `Dy`）已抽取为
`src/main/browser-page-preload/annotation-motion.ts`，入口只保留 DOM 依赖适配；由 5 项断言覆盖
自身、祖先、frame、idle 与 null 边界。
Annotation controls 的 candidate/frame 稳定性判定（原 `Ey`）已抽取为
`src/main/browser-page-preload/annotation-frame-stability.ts`，入口注入 anchor/frame 依赖；由 5 项断言覆盖
顶层、嵌套 frame、anchor mismatch、非 iframe 与 null 边界。
Annotation controls 的 containment ancestor 判定（原 `Oy`）已抽取为
`src/main/browser-page-preload/annotation-containment.ts`，入口注入 DOM/CSS 依赖；由 5 项断言覆盖
祖先命中、无关 target、position/contain 边界与 null。
Annotation design draft text 的最新变更选择（原 `Zv`）已抽取为
`src/main/browser-page-preload/annotation-draft-text.ts`，入口保留 DOM 更新副作用；由 4 项断言覆盖
空输入、未变化项、倒序选择与缺失 previous 值。
Annotation design draft attribute token 解析（原 `ny`）已抽取为
`src/main/browser-page-preload/annotation-attribute-tokens.ts`，入口保留属性读写副作用；由 3 项断言覆盖
缺失、空值与多空白 token。
Annotation design snapshot 的字段投影（原 `cy`）已抽取为
`src/main/browser-page-preload/annotation-design-snapshot.ts`，入口保留 live annotation 编排；由 2 项断言覆盖
稳定字段投影与纯函数重入。
Annotation design target label 生成（原 `ly`）已抽取为
`src/main/browser-page-preload/annotation-target-label.ts`，入口注入 accessible-label 解析；由 3 项断言覆盖
tag fallback、可访问名称与空标签。
Annotation pointer wheel delta 归一化（原 `Lv`）已抽取为
`src/main/browser-page-preload/annotation-wheel-delta.ts`，入口保留滚动副作用；由 3 项断言覆盖
line/page/pixel 三种 delta mode。
Annotation scroll boundary 方向判定（原 `Vv`）已抽取为
`src/main/browser-page-preload/annotation-scroll-boundary.ts`，入口保留容器滚动副作用；由 5 项断言覆盖
起点、终点、可滚动与 zero delta。
Annotation overflow 值判定（原 `tc/nc`）已抽取为
`src/main/browser-page-preload/annotation-overflow.ts`，frame clipping 与 scroll-container 消费者已接回；
原 helper 已删除，由 11 项断言覆盖 scrollable/clipping/visible 值。
Annotation theme variant 读取（原 `f_`）已抽取为
`src/main/browser-page-preload/annotation-theme.ts`，入口注入 window.matchMedia；由 3 项断言覆盖
dark/light 与缺失 matchMedia。
app-primary 的 capability 默认可用判定（原 `vm`/`vAe`）已迁移为
`src/renderer/capability-default-availability/index.ts`，由 5 项行为断言覆盖；原 hub
导出暂保留以维持结构等价，已不再是无归属业务实现。
main 的 app 协议 URL frame/protocol 判定（原 `nst/F9`）已迁移至
`src/main/main-app/util/url-trust.ts`，由 URL trust focused suite 新增 5 项断言覆盖。
main webview 入口文件路径计算（原 `tst`）已迁移至
`src/main/bootstrap/protocol/app-protocol.ts`，由 3 项 focused 断言覆盖。
桌面 open-path 的 stat-kind 分类现由入口委托
`src/main/main-app/files/open-path-arguments.ts` 的 `classifyDesktopOpenPath`，保留真实 stat、
warning 日志与后续窗口副作用；已有 17 项 focused 断言覆盖 directory、HTML browser-document、
普通 file 与缺失路径边界。
main 窗口错误页 HTML 模板（原 `Pot`）已迁移至
`src/main/main-app/window/error-page-html.ts`，由 4 项 focused 断言覆盖。
renderer 崩溃恢复的纯判定已迁移至
`src/main/main-app/window/renderer-recovery-policy.ts`，reload/timer 副作用仍留在入口，新增 6 项断言。
main worker session 的 `V9` 非空对象判定已并入
`src/main/main-app/worker/rpc-message-predicates.ts`，RPC predicate suite 新增 4 项断言。
