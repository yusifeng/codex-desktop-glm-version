# Git worker 逐段审计

Review section changes 的纯策略（错误响应 envelope、gitlink SHA 解析及 cwd/repository 路径归一化）
位于 `src/main/worker/git-review-section-policy.ts`，由
`scripts/test-worker-git-review-section-policy.mjs` 覆盖；入口模块仅负责 repository、Git diff
与 patch 删除等副作用。

> 下方 1-90,836 的覆盖区间以初始审计提交 `423b40b1` 中的
> `.reference/originals/main/worker.ts` 为基线。后续语义模块持续从该文件物理迁出，
> 当前行号会前移；历史区间用于证明原始代码归属，继续提取时必须按符号/行为重新定位，
> 不得把它们直接当作当前文件行号。

## 已抽取边界

当前已从入口物理迁出并接回的业务边界包括：main-RPC client（约
90,524-90,605）、parentPort 消息/生命周期分发（入口尾部），以及 Git 命令
白名单与错误分类（约 53,478-54,100，对应 `worker/git-errors.ts`）。这些
模块均以 CommonJS helper 形式由 `worker.ts` 加载，并有独立回归断言；其余
business 区段仍按下表保持审计标记，不能视为已完成。

WSL 平台的纯输出解析、命令参数构造与 quiet-list fallback（约 47,122-47,584 中的
UTF-16/UTF-8 解码、活动发行版识别、排序与 fallback 选择）已迁至 `worker/platform-wsl.ts`；入口
仍负责 spawn/exec 副作用、缓存和宿主生命周期。

远程 host 的 SSH 展示名、终端命令端口/identity 解析（原入口约
88,590-88,646）已迁至 `worker/remote-host-config.ts`。模块只保留字段校验、
别名优先级、IPv6 bracket 与 `-p`/`-i` 命令行规则，入口仍负责原始 host
对象装配；行为由 `scripts/test-worker-remote-host-config.mjs` 覆盖。

Git 命令统计初始化、变更请求来源判定、host cache key 和 exit-code bucket
（原入口约 65,498-65,559、65,614-65,628）已迁至
`worker/git-observability.ts`，原 `z1`/`gpe`/`B1`/`ype`/`K1` 别名接回；untracked
cache outcome 状态更新也已迁出，行为由 `scripts/test-worker-git-observability.mjs`
的 99 项断言覆盖；进程 executable 的 `process.kind` 分类也已迁至同一模块，保留入口的
operation 属性和 telemetry 组装；GitHub CLI operation、SSH operation 与 Git
subprocess wrapper 的有限集合分类也由同一模块提供，入口保留 command telemetry
组装。Git performance 的 operation/result/outcome/failure reason 归一化、untracked cache
状态、采样策略和 index size bucket 亦已完整迁入该模块；原
`w6`/`kye`/`Aye`/`jye`/`Mye`/`Nye`/`Pye`/`Fye`/`Lye`/`Rye`/`T6` 实现及
`C6`/`Eye` 阈值常量已从入口物理删除。

worktree 缓存失效使用的 host-aware 路径包含判定已迁移至
`src/main/worker/git-path-containment.ts`；入口 `FZ` 仅保留兼容委托，由 5 项断言覆盖 root、子路径和越界路径。

桌面 prompt context 的包裹与可选 instruction section 拼接已迁移至
`src/main/worker/prompt-context-format.ts`；入口 `Ede/Ide` 保留兼容委托，由 5 项断言覆盖 trim、空段和顺序拼接。

Windows Git executable resolution and command adaptation（原 `vbe`/`ybe`/`bbe`/`xbe`/
`K6`，约 71,574-71,609）已迁移至 `src/main/worker/git-executable.ts`。该模块保留
PATH 大小写覆盖、`where.exe` 候选顺序、resolver cache、`ComSpec` 及 `.cmd/.bat`
包装规则；worker 入口仅保留平台调用委托，由 6 项行为断言覆盖 WSL/POSIX 早退、环境
合并、Git 路径解析和 Windows command wrapper。

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

Git watcher ignore-source discovery 已迁移至 `src/main/worker/git-ignore-discovery.ts`：
保留 system/global/local/worktree config 来源、旧 Git 129 fallback、include 与
`core.excludesfile` 路径解析，以及 ignored directory 对 tracked descendant/ancestor 的排除。
原 `Uye`/`O6`/`qye`、专用常量及仅由该算法使用的 bundled lower-bound 链
`Wye`/`Gye`/`Kye`/`k6` 已删除，由 37 项命令、解析、平台路径和筛选断言覆盖。

`GitRepoManager.handleRequestWithContext` 的连续只读请求分支（`origin-url`、
`origin-and-roots`、`worktree-shell-environment`、`worktree-owner`、
`default-remote-branch`、`merge-base`、current/upstream/default/base branch 与
branch-ahead、recent-branches、branch-exists、create-branch、resolve worktree starting ref、
branch commits 与 review commit line counts，原约 77,560-78,050）已迁移至
`src/main/worker/git-read-request-handlers.ts`；原入口继续负责取消信号、Git 可用性
检查、telemetry 和响应包装。`scripts/test-worker-git-read-request-handlers.mjs`
覆盖 repository unavailable 与正常结果，共 21 项断言。

上述 branch commits/review commit line counts 的 comparison、query cache、Git log 与
record/numstat 解析已进一步迁移至 `src/main/worker/git-review-commit-queries.ts`；原
`T3`/`H_e`/`U_e` 与 commit 数量/输出大小常量已删除。36 项断言覆盖缓存参数、命令矩阵、
100 commit 上限、binary/malformed numstat、unsafe integer 和不完整 commit record。

Branch metadata 的 repository 定位、current/default branch 并行读取、detached snapshot
回退和 local branch ref 规范化已迁移至 `src/main/worker/git-branch-metadata.ts`；原
`E3`/`W_e` 已删除，synced-branch state 复用同一规范化入口。27 项断言覆盖仓库缺失、
current branch 优先、snapshot fallback、默认 remote 空值和并行启动语义。

Branch-ahead 的 commit-count query、ancestor 快路径、remote/upstream/default branch 与
merge-base 回退已迁移至 `src/main/worker/git-branch-ahead.ts`；原 `D3` 与 class 内联算法已删除，
class 仅保留组合根代理。41 项断言覆盖 cache 参数、命令顺序、空值与全部 fallback 分支。

Clone state 的 shallow repository 与 partial-clone config 并行探测、config entry 解析和
`GIT_NO_LAZY_FETCH` 环境保护已迁移至 `src/main/worker/git-clone-state.ts`；原 `A3`/`Z_e`/`Q_e`
已删除。29 项断言覆盖命令参数、并行启动、promisor truthy 值、filter/config 识别与失败降级。

Safe attribute filter override 的 config discovery、driver 去重、override 参数组装、query cache 与
generation 竞争重试已迁移至 `src/main/worker/git-safe-attribute-filters.ts`；原 `lme`/`ume`/`e2`/`dme`
已删除，全部消费者改用语义入口。18 项断言覆盖 parser、query 参数、signal、invalidate/retry 和错误。

Tracked uncommitted diff 的 index context、临时 index 复制、`git add -u`、cached diff、错误日志与
`finally` cleanup 已迁移至 `src/main/worker/git-uncommitted-diff.ts`；原 `b0`/`x0`/`S0` 已删除，
worktree starting state 与 commit-message diff 均改用语义入口。28 项断言覆盖命令与失败矩阵。

Commit-message diff 的 staged patch、repository 缺失、safe-filter 失败与 tracked-uncommitted
分支编排已迁移至 `src/main/worker/git-commit-message-diff.ts`；原 `X_e` 已删除，repository-read
handler 直接注入语义入口。11 项断言覆盖分支选择、参数透传和既有无内部 signal 行为。

Managed worktree discovery 的 root/boundary 去重、无 symlink 目录读取、legacy/named
目录识别、候选复检与 `.git` 文件验证已迁移至
`src/main/worker/git-managed-worktree-discovery.ts`；原 `R$`/`jfe`/`Ofe`/`kfe`/`G_e`/`K_e`
已删除，平台路径转换仍由窄依赖注入。52 项断言覆盖路径去重、失败隔离、命名规则、
symlink 拒绝、legacy 兼容与 named worktree 验证。

紧随其后的 status/review 请求分支（`status-summary`、`branch-diff-stats`、
`review-summary`、`review-source-line-counts`、`review-diff`、`review-search`、
`review-patch`）已迁移至 `src/main/worker/git-review-request-handlers.ts`。入口仍负责
请求级取消信号、response/performance 包装和最终 telemetry；helper 保留 attribution、
repository unavailable、stale snapshot 与 generic-error fallback 语义，由
`scripts/test-worker-git-review-request-handlers.mjs` 的 15 项断言覆盖。

review diff 共用的 quoted-path C escape/octal 解码、`diff --git`/combined header 路径解析、
rename patch 重写、路径 quoting 与 hunk 增删行统计已迁移至
`src/main/worker/git-diff-text.ts`。原 `Iz`/`Lz`/`Rz`/`zz` 与
`Rge`/`zge`/`z4`/`H4`/`U4`/`W4` 已删除，由 33 项 UTF-8、malformed header、
binary diff、rename 和多 hunk 断言覆盖。

Review file diff 的 cached blob query、跨平台 symlink target 读取与 hash，以及 regular file、
symlink、submodule 三类 untracked patch 生成已迁移至
`src/main/worker/git-review-file-diff.ts`；原 `R4`/`B4`/`V4` 已删除。33 项断言覆盖
query key/options、POSIX/Windows 命令、no-newline marker、binary diff 和错误映射。

Review comparison 的 merge-conflict/commit-parent/HEAD 查询、branch/commit/worktree source 参数、
empty-tree fallback 以及 untracked/unmerged 扫描已迁移至
`src/main/worker/git-review-comparison.ts`；原 `Bge`/`G4`/`Vge`/`K4`/`q4`/`J4`/`X4`/`Z4`/`Q4`/`Hge`
与 `Y4` 已删除。53 项断言覆盖 query cache 参数、SHA 校验、source 矩阵、repository fallback、
untracked 上限与 unmerged 路径过滤。

Review diff 的请求路径规范化、tracked/untracked 并发聚合、250ms diff query、unified diff 分片与
rename blob fallback 已迁移至 `src/main/worker/git-review-diffs.ts`；原
`$4`/`Uge`/`Wge`/`Gge`/`Kge`/`qge`/`Jge`/`e3` 已删除。41 项断言覆盖 query 参数、
失败映射、whitespace 空 diff、request path 保留与 branch/unstaged rename 边界。

Review patch/search 共用的非空 section 合并、untracked diff 八路并发、输入顺序提交、首错停止与
64 MiB 总量限制已迁移至 `src/main/worker/git-review-patch-sections.ts`；原 `q_e`/`O3` 已删除。
15 项断言覆盖乱序完成、空 section、读取失败、字节计数优先、精确上限与超限错误。

Review patch 的 comparison、cached tracked diff、untracked section 并发合成、错误映射与 snapshot
read 已迁移至 `src/main/worker/git-review-patch.ts`；原 `k3`/`J_e`/`Y_e` 已删除，commit-message
diff 的 staged fallback 也复用该语义入口。33 项断言覆盖 cache、并行、失败、output-limit 和 UTF-8。

Review working-tree metadata 的 per-file generation cache、批量 stat/hash、目录/symlink/regular
分流、untracked `--no-index` metadata 分批与旧 Git fallback 已迁移至
`src/main/worker/git-review-working-tree-metadata.ts`；原 `Xge` class、十五个 helper、并发/分批
常量及 capability `WeakSet` 已删除。55 项断言覆盖 batch lifecycle、SHA 校验、NUL parser、
旧 Git 降级、临时目录 cleanup、generation cache 和三类文件 metadata。

Review metadata 的 raw/numstat NUL parser、change-kind/revision、unmerged 去重、rename 合并、
untracked 限额与 metadata 组合已迁移至 `src/main/worker/git-review-metadata-utils.ts`；原
`s3`/`u3`/`h3`/`g3`/`S_e`/`_3`/`v3`/`C_e`/`w_e`/`b3`/`x3`/`T_e`/`E_e`
已删除。37 项断言覆盖 parser、binary stats、rename/untracked 重组、revision fallback 与状态矩阵。

Branch diff stats 的 repository operation marker 防护、comparison/status/untracked metadata 汇总、
rename stats 修正与 omission 结果已迁移至 `src/main/worker/git-review-branch-stats.ts`；原
`f_e`/`p_e`/`o3`/`h_e` 与 marker 常量已删除。33 项断言覆盖 conservative busy 判定、
依赖失败短路、untracked omission、rename reconciliation 与聚合结果。

Review metadata diff 的 cached raw/numstat query、tracked path 选择、whitespace 过滤和 staged
rename 推断/重组已迁移至 `src/main/worker/git-review-metadata-diff.ts`；原
`y_e`/`d3`/`f3`/`p3`/`m3` 与 512-path 常量已删除。42 项断言覆盖 query key/options、
source/path 矩阵、路径上限回退、raw entry 可见性、blob diff 失败与 rename metadata 修复。

Review metadata 的 working-tree 最终补全与 untracked metadata 合成已迁移至
`src/main/worker/git-review-metadata-finalize.ts`；原 `x_e`/`y3` 已删除。25 项断言覆盖空输入、
重复路径、缺失 metadata 默认值、零 OID 定向补全、untracked 标记、revision 参数透传与排序。

Review section 的 stage/unstage/revert 编排、revision 防陈旧校验和 untracked gitlink 清理已迁移至
`src/main/worker/git-review-section-changes.ts`；原 `D_e`/`O_e`/`k_e`/`A_e`/`S3` 已删除。
56 项断言覆盖路径归一化、diff/revision 失败、双阶段 staged revert、gitlink HEAD/dirty 校验、
删除成功与 partial-success 降级。

`synced-branch`、`synced-branch-state` 与 `overwrite-repo` 的请求编排已迁移至
`src/main/worker/git-synced-branch-request-handlers.ts`。模块保留 repository unavailable
默认值、底层错误透传和 overwrite dependency 覆盖顺序，并把非 `command-error` 结果对应的
refresh root 显式交回入口；入口后续仍按原 finally 顺序清理 metadata/untracked cache 并刷新
live query。`scripts/test-worker-git-synced-branch-request-handlers.mjs` 由 11 项断言覆盖。

`overwrite-repo` 的底层 Git 算法已迁移至 `src/main/worker/git-synced-branch-overwrite.ts`；
原 `Vve/Uve/Wve/Gve` 实现和 clean chunk 常量已删除。模块保留 tree SHA 校验、synthetic commit、
source hard reset、target ref/index/worktree restore、deleted-path 分块 clean 与 warning-only 降级，
由 24 项断言覆盖命令分支、错误优先级和 fallback output。

Synced-branch state 的配置/conflict 状态、checked-out worktree 定位、commit/working-tree 快照、
ahead counts、双侧 numstat query 与最终响应组装已迁移至
`src/main/worker/git-synced-branch-state.ts`；原 `Zve/a6/Qve/$ve/o6/eye/tye/rye` 和状态常量已删除。
23 项断言覆盖 query cache、binary numstat、checked-out/unchecked 分支、SHA 校验与 warning 边界。

### 增量抽取：Synced branch config

Synced-branch config 的 Git-dir 路径、JSON/schema 解析、任意读取错误静默降级、格式化写入与
watcher 路径解析已迁移至 `src/main/worker/git-synced-branch-config.ts`。原 `j2`/`M2`/`N2`/
`Yme`/`P2`/`Xme`/`F2`/`Zme` 已删除；schema 由入口窄依赖注入，branch metadata、state、
worktree/branch create 和 watcher 消费者改用语义入口，由 28 项独立模块断言覆盖。

repository/file read 请求（`repository-identity`、`commit-message-diff`、`submodule-paths`、
`cat-file`、`blame-file`、`index-info`、`config-value`）已迁移至
`src/main/worker/git-repository-read-request-handlers.ts`。模块保留 repository unavailable、
指定 review snapshot 失效时的逐请求 unknown error、abort wrapper 与精确参数收窄；turn-diff
capture 因依赖 watcher readiness 回调仍保留在入口。对应回归脚本由 15 项断言覆盖。

turn diff capture 的 start/complete 请求编排已迁移至
`src/main/worker/git-turn-diff-request-handlers.ts`。模块显式接收 `isRepoWatched`，入口继续
拥有 `watchesByKey`、ready/recovery 状态和 response 包装；capture helper 的参数收窄与 watcher
判定透传由 `scripts/test-worker-git-turn-diff-request-handlers.mjs` 的 8 项断言覆盖。

turn-diff capture 的两个 Git 请求分支已进一步收敛至
`src/main/worker/git-turn-diff-request-dispatch.ts`。dispatcher 只负责方法选择和结果 envelope，
capture 参数编排仍由 request-handlers 持有；未知方法返回 `handled: false`，由
`scripts/test-worker-git-turn-diff-request-dispatch.mjs` 覆盖 4 项入口契约断言。

Turn-diff snapshot 的 reviewSnapshot generation cache、porcelain v1 `-z` 状态解析、无变化时
`HEAD^{tree}` 快路径，以及 tracked/untracked 变化的临时 index staging/write-tree 已迁移至
`src/main/worker/git-turn-diff-snapshot.ts`；原 `s6/iye/aye/oye/c6` 已删除。21 项断言覆盖
状态配置、tree SHA 校验、临时 index 参数、malformed output 和 snapshot read 边界。

Turn-diff capture/checkpoint 的 ref retain/release、bounded diff、recent checkpoint 查询、TTL pruning、
checkpoint scope 串行队列和 start/complete 生命周期已迁移至
`src/main/worker/git-turn-diff-capture.ts`；原 `uye/dye/fye/pye/mye/p6/m6/h6/hye/g6/gye/_6/v6`
实现、共享 Map 与常量已删除。19 项断言覆盖错误分类、ref cleanup、start state 和 checkpoint retention。

Automation writable roots 的 worktree/source repository 定位、common dir 解析，以及 index/`.git`
fallback 已迁移至 `src/main/worker/git-automation-writable-roots.ts`；原 `_ye` 已删除。9 项断言覆盖
absolute/relative common dir、重复 root 抑制和 repository 缺失边界。

Git live-query 的 trace sampled 优先级、最多四条 link 去重合并，以及 query method 对 repository
change type 的刷新矩阵已迁移至 `src/main/worker/git-live-query-policy.ts`；原 `b6/x6/S6/Tye` 与
link 上限常量已删除。其纯策略由 101 项矩阵与 trace 断言覆盖，manager 的 timer/abort/shared-run
生命周期仍保留在入口。

Git init watcher 的 workspace/metadata 双 watch、git path detection、session close、dispose race、
missing metadata 降级与 250ms-5s reconnect backoff 已迁移至
`src/main/worker/git-init-watcher.ts`；原 `yye` 类及退避常量已删除，由 35 项生命周期断言覆盖。

Git live-query registry 的 subscription state、generation/waiter、local debounce、error retry、
shared-query coalescing、repository serialization、consumer abort、recovery 与 branch dependency
引用计数已迁移至 `src/main/worker/git-live-query-registry.ts`；原 `wye` 类及三个时序常量已删除。
41 项断言覆盖 tracked/complete 发布、stale 抑制、三次重试、共享执行和恢复去重。
本轮进一步将 subscription state 构造和 repository/shared-run/branch dependency key 规范化迁移至
`src/main/worker/git-live-query-state.ts`；registry 仅保留异步刷新和事件副作用，新增 7 项 focused
assertions 覆盖 generation、初始状态及 key 稳定性。

Live-query 的本地分支依赖判定与引用计数更新已进一步迁移至
`src/main/worker/git-live-query-branch-dependency.ts`；该模块只负责
`review-summary`/`branch-diff-stats`/`branch-commits` 的 branch 参数规范化和计数增减，registry
仍持有 Map、刷新与事件副作用。新增 8 项 focused assertions 覆盖 refs/heads 规范化、非 branch
查询过滤、空值与引用计数清理。

Git watcher performance 的 10 秒窗口、维度分桶、累计计数、512 raw-event 提前 flush 与 timer
清理已迁移至 `src/main/worker/git-watcher-performance.ts`；原 `Iye` 类及专用常量已删除，由 18 项
聚合、阈值和 timer 断言覆盖。

Git watcher 启动时的 metadata prefetch 已迁移至
`src/main/worker/git-watcher-metadata.ts`：单次 `rev-parse` 读取 git dir、HEAD、index、
synced-branch path 和 symbolic HEAD，并在输出合法时回填四个 query cache；相对路径继续按
repository root 或 git dir 解析。原 `zye`/`Bye`/`Vye`/`E6` 已删除，由 48 项缓存短路、
输出校验、POSIX/Windows 路径与 detached/branch 断言覆盖。

`invalidate-stable-metadata` 与 `invalidate-git-read-caches` 已迁移至
`src/main/worker/git-cache-request-handlers.ts`。helper 严格保持 repository lookup、可选
untracked cache invalidation、short-lived cache clear、可选 live-query refresh 的顺序；最后一步
仍为 fire-and-forget，不等待 refresh Promise。17 项回归断言覆盖正常路径、pending refresh 与
各阶段同步异常短路。

`stable-metadata` 请求的 Git-init watcher 三态控制已迁移至
`src/main/worker/git-stable-metadata-request-handler.ts`。入口只注入 metadata manager、watcher
生命周期与 `X(...)` envelope；缺失 metadata 时继续区分 `watchForGitInit=true/false`，命中 metadata
时仍按原协议清理 watcher 并只返回 `root/commonDir`。`scripts/test-worker-git-stable-metadata-request-handler.mjs`
覆盖三种 watch/metadata 组合，共 3 项断言。

`git-init-repo` 的完整业务实现已迁移至 `src/main/worker/git-init-request-handler.ts`，原压缩
`Rhe` 函数已删除。模块保留 workspace root trim/空值校验、`git init` 参数、stderr/stdout/
default 错误优先级和成功后的 stable metadata invalidation，由 11 项断言覆盖。

Git push 的完整请求实现（原 `tge` 及 `Qhe`/`$he`/`ege`）已迁移至
`src/main/worker/git-push-request-handler.ts`，压缩实现已删除。模块保留 force/upstream/refspec
参数顺序、default/fallback remote 选择、porcelain/stdio 错误分类、exec output 和成功 refresh root，
由 17 项行为断言覆盖。

Git checkout 的完整实现（原 `jhe`/`Mhe`/`t4`/`Fhe`/`n4`）已迁移至
`src/main/worker/git-checkout-request-handler.ts`，压缩实现已删除，仅保留供 worktree/handoff
内部调用的薄 `t4` 兼容适配器。模块保留 local/remote/
detached ref 解析、stash 状态、失败 rollback、working-tree conflict paths、exec output、两类
read-cache invalidation 与成功 refresh root，由 16 项行为断言覆盖。

`commit` case 的 repository lookup、可选 staging、nothing-to-commit 分类、commit SHA 读取及
refresh-root 时序已迁移至 `src/main/worker/git-commit-request-handler.ts`；attribution 默认值/清洗、
co-author trailer 去重与 trailer block 换行规则也已并入该模块，原
`N_e`/`P_e`/`F_e`/`I_e`/`L_e`/`R_e`/`z_e` 和默认 attribution 常量已删除。48 项行为断言
覆盖 staging 后失败刷新差异，以及空值、大小写、正则字符和 trailer 边界。

Origin discovery 的目录去重、平台路径快速判定、向上查找 `.git`/`HEAD`、stable metadata/
root/origin 组合与单目录失败隔离已完整迁移至 `src/main/worker/git-origin-discovery.ts`；原
`u4`/`Zhe`/`rge`/`ige`/`age`/`oge`/`sge` 已删除，11 项断言覆盖 local/remote 与失败路径。

`set-config-value` 已迁移至 `src/main/worker/git-config-request-handler.ts`，保留 repository 参数
透传及成功时 refresh-root 规则；worktree scope 的 `codex.localEnvironmentConfigPath` 明确不刷新，
由 5 项行为断言覆盖。

Worktree snapshot/state 的候选目录过滤、snapshot ref/commit 查找、路径 inspection 和
`available/gone/restorable/unavailable` 状态机已迁移至
`src/main/worker/git-worktree-snapshot.ts`；snapshot 后删除的失败策略也已并入，原
`k4`/`Mve`/`V3`/`V_e` 已删除。22 项断言覆盖 snapshot 成功、普通失败抛出、
`settings-delete-targeted` 降级和 force 透传。

Worktree snapshot 打包前的文件枚举已迁移至 `src/main/worker/git-worktree-files.ts`：
保留 query cache、index 指纹双读、最多两次稳定读取、tracked/untracked 合并、目录型
untracked 展开、8KB literal pathspec 分批，以及 index 变化时的单命令 fallback。原
`Ege`/`Dge`/`Oge`/`P4`/`kge`/`Age`/`F4`/`jge`/`I4` 与两个专用常量已删除，
由 32 项缓存、命令、错误和一致性断言覆盖。

Worktree owner 的 `codex-thread.json` 定位、schema 解析、读取、写入与 owner 更新已迁移至
`src/main/worker/git-thread-config.ts`。原 `f4`/`uge`/`dge` 实现已删除，`p4`/`m4` 仅保留
worktree/handoff 内部调用所需的薄适配器；11 项断言覆盖格式、缺失文件与无 repository 错误。

Thread worktree resolution 的 current-thread 快路径、owner fallback、候选时间排序、workspace
路径映射与 tracked/untracked dirty 检查已完整迁移至
`src/main/worker/git-worktree-resolution.ts`。原 `fge`/`h4`/`pge`/`g4`/`mge`/`hge` 已删除，
dispatcher 继续持有 envelope 与 query/cache 依赖；22 项断言覆盖关键选择与取消语义。

Git watch 请求层的 init-watch dispose、watch-repo tracing/reuse、live-query recovery/unwatch，
以及 `subscribe-live-query` 的 metadata coalescing、abort、subscription 与 releaseWatch `finally`
状态机已迁移至 `src/main/worker/git-watch-request-handlers.ts`，25 项断言覆盖该完整请求边界。
订阅请求在 metadata/watch ready 之后的 `commonDir`、root 与 recovery 默认值选择已进一步迁移至
`src/main/worker/git-watch-subscription-policy.ts`；handler 仅保留生命周期与 registry 副作用，
由 `scripts/test-worker-git-watch-subscription-policy.mjs` 的 3 项断言覆盖缺省与显式 recovery。

`apply-changes`、`apply-patch` 与 `apply-review-section-changes` 的参数注入、partial-apply
成功判定及 refresh-root 规则已迁移至 `src/main/worker/git-apply-request-handlers.ts`；dispatcher
继续持有 envelope 与 finally cache/live-query refresh，由 11 项断言覆盖。

`apply-changes` 的底层 merge-base、binary diff、目标路径预暂存、临时 index 和 apply 结果映射
已迁移至 `src/main/worker/git-apply-changes.ts`；原 `Ige`/`Nge`/`L4`/`Pge`/`Fge`/`Lge`
已删除。31 项断言覆盖 merge-base/diff 失败、空 diff、路径存在性、无 index 降级、stage warning、
command error 与 partial success。

Worktree 请求层已迁移至 `src/main/worker/git-worktree-request-handlers.ts`：upstream refresh 取消、
Codex/普通 worktree 列表、owner 设置、restore 后 owner 写入容错、delete 后 unwatch、三种 handoff
progress event、跨 host destination cache 的 `finally` 失效和 transfer cleanup 均由该模块持有；
底层 snapshot/move 算法继续通过窄依赖注入。45 项断言覆盖成功、容错和异常路径。

Host handoff transfer 的临时目录定位、同 host 免复制/跨 host 文件复制和 cleanup 路径安全边界
已迁移至 `src/main/worker/git-handoff-transfer.ts`；原 `J3/Z3/Fve` 实现已删除。cleanup 只允许
删除 `<codexHome>/handoffs/<单层 id>/rollout.jsonl` 的父目录，19 项断言覆盖 POSIX、Windows、
跨目录和 traversal 路径。

Handoff branch/stash 的分支存在与 commit 一致性检查、创建/强制更新、object-id stash ref
解析以及 apply/pop/drop 已迁移至 `src/main/worker/git-handoff-branch.ts`；原
`H3/U3/Ive/W3/Nve` 五个实现及其压缩调用名已删除。34 项断言覆盖命令序列、错误输出优先级、
默认 mode 和 stash SHA 映射。

Handoff rollback 的通用 branch/stash 恢复、source worktree 恢复，以及新建/复用 host worktree
回滚已迁移至 `src/main/worker/git-handoff-rollback.ts`；原 `$3/e6/K3/q3` 四个实现与调用名已删除。
19 项断言覆盖错误累计顺序、可忽略 cleanup/checkout 失败和必须继续传播的复用 worktree 失败。

Host handoff destination checkout 的干净 commit 解析、默认分支选择与安全 detach 判定已迁移至
`src/main/worker/git-handoff-destination.ts`；原 `Lve/G3` 实现和调用名已删除。19 项断言覆盖
status 异常降级、已切离 handoff branch、默认分支 checkout、同分支 detach 和 checkout 错误映射。

Host handoff 的 repository metadata 重试、commit 存在性检查与 shared-base fetch fallback
已迁移至 `src/main/worker/git-handoff-shared-base.ts`；原 `Y3/X3/Rve` 实现和调用名已删除。
27 项断言覆盖本地错误不重试、远程 git-root 错误单次重试、禁用 lazy fetch 的 commit 检查、
destination head/merge-base 快路径、默认分支 fetch、多 remote fallback 与最终 warning。

Host handoff 的完整跨 host 主编排已迁移至 `src/main/worker/git-host-handoff.ts`；原 `Pve/Q3`
实现已删除。模块通过窄依赖注入保留 snapshot/bundle 快慢路径、新建与复用 worktree、progress
状态、destination checkout 回滚，以及 source/destination ref 和传输目录的 `finally` 清理。
48 项断言覆盖参数与 metadata 错误、两类传输路径、复用 worktree stash、分支/checkout/reset
失败回滚、unexpected error 和成功/失败 cleanup。

Move-to-local 的完整编排已迁移至 `src/main/worker/git-move-to-local.ts`；原 `zve` 实现已删除。
模块保留 branch checked-out-elsewhere 防护、source detach/stash、local dirty guard、目标分支创建与
checkout、stash apply/drop warning，以及 local/source 两侧的条件回滚顺序。31 项断言覆盖参数、
占用、detach/status/branch/apply 错误、无 stash 快路径、drop warning 与 unexpected error。

Move-to-worktree 的完整编排已迁移至 `src/main/worker/git-move-to-worktree.ts`；原 `Bve` 实现已删除。
模块保留 default-branch guard、local/target checkout progress、source/target 双 stash、drop warning、
apply 失败恢复和 created-worktree 条件 cleanup。26 项断言覆盖参数、成功/跳过路径及分阶段回滚。

Git branch search 的 query 规范化、case-insensitive ref pattern、local/remote ref 解析与 branch-name
去前缀已迁移至 `src/main/worker/git-branch-search.ts`；原 `Jve/n6/Yve/r6/Xve` 五个 helper 已删除，
由 16 项断言覆盖 heads 快路径、最长合法 anchor、Kelvin sign、remote HEAD 和嵌套 branch。

Git branch search 的异步执行层已迁移至 `src/main/worker/git-branch-search-runtime.ts`；原
`Kve/t6/qve` 实现已删除。模块保留 250ms query cache、local-first 限额、remote fallback、
TextDecoder 流式分片、结果去重、limit internal abort 和父 signal reason 传播，由 15 项断言覆盖。

`refreshWorktreeDirectories` 的 worktree watch target 增删差集已抽取为
`partitionGitWorktreeWatchPaths`；helper 只计算 stale/new 路径，target 的 dispose、
directory watch 创建和 session 启动仍由入口负责。worker watch path 回归现覆盖 70 项断言。

`GZ` 的平台 shell descriptor 映射已迁移至 `worker/shell-config.ts`：入口仍负责
环境变量读取和进程执行；PowerShell 路径发现与 helper 的 executable、参数、脚本
扩展名及 `posix`/`powershell`/`cmd` 类型均已迁移，入口只保留窄依赖注入，
由 shell config 回归脚本覆盖。

Command/shortcut registry 的纯策略边界已迁移至
`src/main/shared/command-registry-policy.ts`：鼠标快捷键判定、命令冲突组、跨平台
accelerator 归一化与 modified-Enter 判定由该模块提供，`command-registry.ts` 保留
命令定义、keymap 读写及副作用编排；9 项 focused 断言覆盖跨平台与冲突边界。

Command capability 的 required-access 与 shortcut-configurable 判定已进一步迁移至
`src/main/shared/command-capability-policy.ts`；命令 registry 仅保留定义索引与 keymap
编排，7 项 focused 断言覆盖 codex/work-local、VS Code-only 与鼠标快捷键边界。

子进程环境清洗已迁移至 `worker/platform-env.ts`：入口不再持有 Crashpad/Electron
注入变量黑名单，所有 WSL、Git、shell 与 editor 子进程统一通过窄 `sanitizeChildProcessEnv`
适配器复制并过滤环境。过滤键按大小写不敏感匹配且不修改调用方对象，由
`scripts/test-worker-platform-env.mjs` 的 6 项断言覆盖；平台命令执行和环境合并副作用仍留在入口。

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
| 38,230-43,985 | `preserved-coupled` | 38,230 起仍与前置 Zod runtime 的 schema builder 紧邻；约 43,300-43,985 的 deep-link/auth/browser-tab/runtime-bundle manifest schema 只有原 worker 内声明，当前 `src/main/worker` 没有对应消费入口。 | 暂不抽取，避免制造未接回的 facade；待真实 request handler 消费点出现后按 schema 子组迁移，并保留对 Zod runtime 的窄依赖。 |
| 43,986-46,600 | `generated-infra` | `globalThis[Symbol(\`workers-module\`)]`、`RpcTarget`、session/stub、Readable/WritableStream RPC hook；职责是跨线程对象序列化和取消，不包含 git 操作 | 作为 RPC 基础设施登记保留或单独迁移；不可把 `RpcTarget` 等空实现替换为 identity |
| 46,601-47,121 | `vendored` | `ipaddr.js` 原文特征：`ipaddr: cannot match CIDR`、`IPv4`/`IPv6`、`subnetMatch`、CIDR 解析 | 保留 vendor，行 46,643-47,111 是完整 ipaddr 实现 |
| 47,122-47,584 | `preserved-coupled` | WSL/Codex home 解析与 Windows 命令执行混合，明确调用 `wslpath`、`wsl.exe --status/--list`，并共享 `[execWindowsCommand]`/`[wsl]` 日志与错误路径。 | 暂不抽取；现有 `src/main/worker/host-path-policy.ts` 仅覆盖路径 predicate，不能替代 exec、错误和日志生命周期。待 platform command owner 明确后再迁移。 |
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

当前 `scripts/chunk-manifest.mjs` 只能以整文件登记 `git-worker` 的 PRESERVED；分段理由需以本表维护，不能把整文件登记误读为所有 business 区间均已语义化。
本轮新增 `isCancelableGitRequest`、`shouldCheckGitAvailability` 与 `isGitRequestTracked`，迁移请求取消、
本地 Git 可用性和 in-flight 跟踪策略表；`rbe` 入口保留生成实现作为对照，行为由 worker query utility
接管并由 27 项断言覆盖。Git manager/watch/session
主路由仍待继续拆分。
`scripts/chunk-manifest.mjs` 当前只支持整 chunk 的 `PRESERVED` Map，不支持按行号登记；因此以下
区间先在本审计中登记为 `preserved-coupled`，不能伪装成 chunk manifest 的独立分段：

- `preserved-coupled`: 38,230-43,985（Zod/跨入口 schema、无当前消费入口）、47,122-47,584（WSL exec/logging coupling）；

### Worker business-preserved blocker evidence（2026-10-06）

复核两个最早未闭合候选：原 worker 约 48,152-49,999 的 SQLite migration/schema 在当前源码由
`src/main/main-app/thread-catalog/store.ts` 真实消费（`local_thread_catalog_hosts` 的 INSERT/SELECT/DELETE），
因此在 worker 中另建 `state` facade 会造成重复 owner；应继续由 main thread-catalog store 负责。
约 53,200-53,477 的 connector/browser-auth/MCP schema 则只有原 worker 内 Zod 声明，当前 `src/main/worker`
没有对应 request consumer；`browser_auth_challenge_id` 的现有消费位于 shared elicitation protocol，不能把
worker schema 单独迁出而不改变 Zod dependency boundary。两段均无可安全闭合的 worker 纯策略边界，保留
`preserved-coupled`，待真实 owner/request handler 明确后再迁移。

完成 T1 后应改成分段登记（若 chunk manifest 增加分段机制）：

- `vendor`: 1-34,560、34,561-38,229、46,601-47,121、47,585-48,151、
  50,000-52,899、52,900-53,199、54,101-55,350、56,421-61,150、
  85,966-86,130；
- `generated-infra`: 43,986-46,600；
- `worker-entry`: 90,661-90,836；
- 其余已确认 business 区间必须由语义模块覆盖，不能继续以整文件 preserve 规避审计；上述两段只有在消费入口与 owner 明确后再转 semantic。

本报告只做审计和边界确定，不宣称 T1 语义化已完成。下一步应以第一个
`xDe`/入口协议闭环为基线，迁移后运行 `verify-chunks`、`typecheck`，再根据
新增 import 运行 `audit-shared-consumption`。

### 增量抽取：Git index info 与 nearest ancestor branch

Git index info 的 git-dir 定位、index mtime 读取以及 ENOENT/其他读取失败降级已迁移至
`src/main/worker/git-index-info.ts`。Nearest ancestor branch 的候选 trim/去重、排除当前分支、
并行 ahead comparison 和输入顺序稳定的最短距离选择已迁移至
`src/main/worker/git-nearest-ancestor-branch.ts`。原 `eve`/`tve`/`nve`/`rve` 已删除，
repository read 与 request dispatcher 分别注入窄依赖，两模块各由 10 项断言覆盖。

### 增量抽取：Recent branches query

Recent branches 的固定 100 条 local-ref 查询、250ms short-lived cache、watch-scoped live cache、
失败/取消降级以及 generation 变化后的旧 key 清理已迁移至
`src/main/worker/git-recent-branches.ts`。原 `j3`/`M3`/`N3` 已删除，default branch 回退、
普通请求和 live-query 三处消费者均注入现有 query/runGit 能力，由 26 项断言覆盖。

### 增量抽取：Branch search request boundary

`search-branches` 请求的 host-scoped repository 解析与参数组装已迁移至
`src/main/worker/git-branch-search-request-handler.ts`。该边界保留原有默认 limit（20）、
`preserveRemoteRefs` 透传、AbortSignal 传播以及 `getWorktreeRepositoryForRoot` 的 host
绑定；分支扫描、query cache 和 ref 过滤仍由 `git-branch-search-runtime.ts` 负责。原
`handleSearchBranches` 仅保留响应封装和窄依赖注入，并由
`scripts/test-worker-git-branch-search-request-handler.mjs` 覆盖默认参数、显式 limit、
repository 解析和结果透传。

### 增量抽取：Repository identity

Repository identity 的 effective origin 查询、watcher-aware config cache、取消后的直接读取回退、
remote URL/name/默认端口规范化与 worktree id 组装已迁移至
`src/main/worker/git-repository-identity.ts`。原 `ive`/`P3` 已删除，repository-read 与 turn-diff
capture 两个消费者均注入窄依赖，由 28 项断言覆盖。

### 增量抽取：Submodule paths

Submodule paths 的 `.gitmodules` 缺失快路径、可取消 stat、Git config 查询、路径分隔符规范化
与稳定去重已迁移至 `src/main/worker/git-submodule-paths.ts`。原 `gve` 已删除，repository-read
消费者注入现有 query/runGit/path 能力，由 15 项断言覆盖。

### 增量抽取：Cat-file batch reads

Cat-file 的四请求批量上限、5 MiB 对象限制、batch 二进制协议解析、输出截断后的尾部递归重试、
snapshot 一致性边界与限长磁盘 fallback 已迁移至 `src/main/worker/git-cat-file.ts`。原 `Sve`、
十二个专用 helper、五个专用常量及共享声明中的独占对象上限已删除，repository-read 消费者
只注入 Git 执行能力，由 43 项断言覆盖。

### 增量抽取：Blame file reads

Blame file 的 repository-relative containment、250ms query cache、30s/20MiB Git 限制、porcelain
metadata 复用、GitHub noreply login 与 repository web URL 推导已迁移至
`src/main/worker/git-blame-file.ts`。原 `whe`、七个专用 helper 与三个专用常量已删除，
repository-read 消费者注入路径/query/remote URL 能力，由 29 项断言覆盖。

### 增量抽取：Worktree list

Worktree list 的 250ms query、porcelain record parser、branch/detached head、locked/prunable 状态
已迁移至 `src/main/worker/git-worktree-list.ts`。原 `$2`/`bhe` 已删除，class request wrapper
继续负责 repository 缺失时返回空列表，由 14 项断言覆盖。

### 增量抽取：Ref SHA resolution

Git object ID 校验、ref-sha query、fresh 精确失效、rev-parse 错误与 SHA branding 已迁移至
`src/main/worker/git-ref-resolution.ts`。原 `M0`/`N0` 已删除，worker 中 branch/review/turn-diff/
handoff/snapshot 等全部消费者改用语义名称，由 20 项模块断言及六组下游回归覆盖。

### 增量抽取：Current branch reads

Current branch 的 HEAD/symbolic fallback、branch/detached/unknown 状态、15 秒 snapshot cache、
head generation 防陈旧重试与精确 query invalidation 已迁移至
`src/main/worker/git-current-branch.ts`。原 `w0`/`T0`/`Mpe`/`E0`/`D0`/`O0` 与专用常量
`C0` 已删除，worker 中 watcher、handoff、branch metadata/ahead 与 request handler 消费者
全部改用语义名称，由 26 项模块断言覆盖。

### 增量抽取：Remote branch queries

Remote branch 的 ordered remotes、local/remote default branch、main/master fallback、upstream ref
与 remote tracking branch 查询已迁移至 `src/main/worker/git-remote-branches.ts`。原
`Npe`/`k0`/`Ppe`/`j0`/`P0`/`k2`/`Gme`/`Kme`/`qme` 与专用 `v0` 常量已删除，
default branch、starting ref、handoff、push 与 branch metadata/ahead 消费者全部改用语义名称，
由 44 项模块断言覆盖。

### 增量抽取：Branch comparison

Left/right commit counts 的 query cache、`rev-list --left-right --count`、宽松整数解析与
equal/left-ahead/right-ahead/diverged 状态分类已迁移至
`src/main/worker/git-branch-comparison.ts`。原 `A0`/`Fpe` 已删除，nearest ancestor、starting
ref 与 synced-branch state 消费者改用语义名称，由 21 项模块断言覆盖。

### 增量抽取：Worktree starting ref

Worktree starting ref 的 local/remote ref 规范化、upstream ahead 选择、remote 候选生成、
`ls-remote` 验证、fetch 与 fresh ref 复检已迁移至
`src/main/worker/git-worktree-starting-ref.ts`。原 `F0`/`I0`/`Lpe`/`L0`/`Rpe`/`zpe`/`R0`
已删除，repository-read、worktree create 与 handoff 消费者改用语义名称，由 27 项断言覆盖。

### 增量抽取：Worktree starting state

Worktree create 的 branch/default/working-tree 起始引用选择、remote-ref 强制刷新、最长 remote
名称匹配，以及 tracked binary diff 并行收集与错误映射已迁移至
`src/main/worker/git-worktree-starting-state.ts`。原 `Ipe` 已删除，入口只保留现有能力的显式依赖
接线，由 27 项断言覆盖。

### 增量抽取：Git config scope

Git config 的普通/缓存读取、local/worktree scope 参数映射、缺失值兼容、worktreeConfig 自动启用
重试，以及 worktree 删除使用的 `codex.localEnvironmentConfigPath` 直读已迁移至
`src/main/worker/git-config-scope.ts`。原 `Bpe`/`Vpe`/`Hpe`/`Hhe`/`Uhe`/`Ghe` 与专用键常量已删除，
repository 方法、origin URL 读取和 worktree cleanup 改用语义入口，由 49 项断言覆盖。

### 增量抽取：Git root resolution

Git root/common-dir 的本地路径预检、新版 `--path-format=absolute` 单命令读取、旧版双命令
fallback、非仓库识别与专用降级错误已迁移至 `src/main/worker/git-root-resolution.ts`。原
`Bhe`/`Vhe`/`hhe`/`a4`、`o4` 错误类及 `zhe` 日志常量已删除；manager 保留 memoization、trace
与 stable metadata cache 生命周期，由 43 项断言覆盖。

### 增量抽取：Git path and index resolution

Git dir/path 与 index/shared-index 的 query cache、相对路径解析、stat fingerprint 和 repository
WeakMap 缓存已迁移至 `src/main/worker/git-path-resolution.ts`。原 `u0`/`d0`/`f0`/`m0`/`Tpe`/
`Epe`/`h0` 与 `p0` 缓存已删除，diff、watcher、thread config、automation 与 index-info 消费者
全部改用语义入口，由 36 项断言覆盖。

### 增量抽取：Git path status

Untracked/path-status 的 porcelain v1 NUL 解析、目录型 untracked 展开、嵌套仓库过滤，以及
tracked/path-status 的 250ms query cache 已迁移至 `src/main/worker/git-path-status.ts`。原
`t2`/`n2`/`mme`/`r2`/`hme`/`i2` 已删除，untracked cache、snapshot、watcher ignore discovery
消费者改用语义入口，由 31 项断言覆盖。

### 增量抽取：Worktree delete primitive

Worktree 删除的 per-host 三并发 semaphore、local environment cleanup、Git remove 与 force 模式
文件系统兜底已迁移至 `src/main/worker/git-worktree-delete.ts`。原 `ome`/`$0`/`sme`/`cme`、
`Q0` Map 及 `ame`/`Z0` 常量已删除；快照、请求去重、unwatch 和 rollback 错误映射仍由上层负责，
由 37 项断言覆盖。

### 增量抽取：Local environment scripts

Local environment setup/cleanup 的平台脚本选择、shell wrapper、环境变量差异捕获、流式日志、
取消与临时目录生命周期已迁移至 `src/main/worker/git-local-environment.ts`。原
`Gpe`/`Kpe`/`B0`、环境解析与 wrapper helper，以及 `z0`/`Upe`/`Wpe` 专用状态已删除；
worktree create 与 delete cleanup 消费者改用语义 runtime，并由 76 项独立模块断言覆盖。

### 增量抽取：Worktree upstream refresh

Worktree create 的 upstream refresh 前置检查、system/global credential config 透传、隔离 fetch
环境、双 signal 取消、超时状态与 Git progress 流解码已迁移至
`src/main/worker/git-worktree-upstream-refresh.ts`。原 `Ime`/`Lme`/`Rme`、`Nme` 日志与
`C2`/`Pme`/`Fme`/`w2` 专用状态已删除，create 编排改用语义 runtime，并由 53 项独立模块断言覆盖。

### 增量抽取：Worktree auxiliary file copy

Worktree create 的 `AGENTS.override.md`、`.worktreeinclude` 和选中 local-environment 配置发现与复制
已迁移至 `src/main/worker/git-worktree-copy-files.ts`。原 `ihe`/`ahe`/`ohe`/`H2`/`U2`/`she`/
`W2`/`G2`/`K2` 及 `R2`/`z2`/`rhe` 专用常量已删除；模块保留 symlink 路径拒绝、exclusive copy、
16 并发、ignored/tracked 判定与 remote host 回退，由 43 项独立模块断言覆盖。

### 增量抽取：Repository size guard

Worktree snapshot 的 repository size guard 已迁移至 `src/main/worker/git-repository-size.ts`：
`count-objects -v` 的 raw-root/250ms query 两条读取路径、输出解析、字节格式化和 200 MiB 上限均由
语义模块持有。原 `q2`/`uhe`/`dhe`/`fhe`/`phe`/`mhe` 与 `Dpe` 常量已删除，snapshot 消费者注入
现有 query/runGit 能力，由 25 项独立模块断言覆盖。

### 增量抽取：Worktree path allocation

Worktree 的 root-relative cwd query、默认/显式 worktrees 根目录解析、macOS metadata 创建、名称
校验、Git/workspace 路径计算，以及命名冲突时最多六次的目录预留已迁移至
`src/main/worker/git-worktree-path-allocation.ts`。原 `D2`/`Wme`/`lhe`/`L$`/`Afe`、`Ume` 日志和
`Tfe` marker 常量已删除；create 与 resolve-worktree 消费者共用语义入口，由 34 项断言覆盖。

### 增量抽取：Worktree shell environment config

Worktree shell environment 配置的 Git path 解析、JSON/schema 读取、ENOENT 与其他读取错误分流、
格式化写入和删除已迁移至 `src/main/worker/git-worktree-shell-environment.ts`。原 `I2`/`Qme`/
`L2`/`ehe`/`the`/`nhe` 已删除；schema 由入口窄依赖注入，create 与只读请求消费者改用语义
入口，由 25 项独立模块断言覆盖。

### 增量抽取：Worktree branch tracking

Worktree create 的远端起点自动 tracking branch 创建/强制清理、fresh ref cache refresh，以及创建后
实际本地分支解析已迁移至 `src/main/worker/git-worktree-branch-tracking.ts`。原 `Vme`/`E2`/`che`
已删除；通用 `O2` branch-exists helper 仍由入口和 create-branch 请求共享，取消回滚与
synced-branch 初始化消费者改用语义入口，由 31 项独立模块断言覆盖。

### 增量抽取：Worktree checkout

Worktree checkout 的 safe attribute filter、upstream refresh、starting state/untracked 并行读取、
detached `worktree add`、working-tree diff 与 untracked 文件恢复、tracking branch 和失败 cleanup
主编排已迁移至 `src/main/worker/git-worktree-checkout.ts`。原 `zme`/`Bme`/`Hme` 与 `T2` 专用
日志状态已删除，上层 create 只保留路径分配和 setup/config 生命周期，由 44 项独立断言覆盖。

### 增量抽取：Worktree create orchestration

Worktree create 的 repository/root 解析、命名目录预留、checkout、辅助文件复制、synced config、
local environment 选择/setup、失败容忍和 shell environment 持久化完整编排已迁移至
`src/main/worker/git-worktree-create.ts`。原 `V2` 与 `B2` encoder 状态已删除；host handoff 与
create-worktree 请求消费者共用语义入口，由 52 项独立模块断言覆盖。

### 增量抽取：Repository status summary

Repository status summary 的 tracked porcelain v1 NUL/rename 解析、generation query cache、
review snapshot 与 request signal 组合、safe-filter/Git fallback、失败 query 精确失效和 untracked
合并已迁移至 `src/main/worker/git-status-summary.ts`。原 `J2`/`Y2`/`ghe`/`_he` 已删除；
review、handoff 与 status-summary 请求消费者改用语义入口，由 26 项独立模块断言覆盖。

### 增量抽取：Merge-base resolution

Merge-base 的 cached HEAD query、Git 128 ref-check、HEAD/requested ref 存在性检查、ordered
remote/upstream 候选生成、稳定去重、ref 验证与 direct fallback 已迁移至
`src/main/worker/git-merge-base.ts`。原 `X2`/`vhe`/`Z2`/`yhe`/`Q2` 已删除；review、
branch-ahead 和 read-request 消费者改用语义入口，由 35 项独立模块断言覆盖。

### 增量抽取：Branch creation

Local branch existence、commit tree query、普通分支创建、unborn HEAD fallback，以及 synced/worktree
两种 create-branch 编排已迁移至 `src/main/worker/git-branch-create.ts`。原 `O2`/`A2`/`r4`/`Ihe`/
`Lhe` 已删除；worktree tracking、worktree create、handoff/snapshot 与 read-request 消费者共用语义
入口。模块保留单层 `refs/heads/` 规范化、250ms tree cache、start-point fallback 门控与原错误映射，
由 62 项独立模块断言覆盖。

### 增量抽取：Git apply patch runtime

Git apply 的 stdout/stderr 路径结果解析、patch header 路径提取、临时 index、现有目标路径预暂存、
`--3way`/binary/revert/target 参数编排、结果状态映射与临时目录 cleanup 已迁移至
`src/main/worker/git-apply-patch.ts`。原 `Ame`/`x2`/`S2`/`jme`/`Mme` 已删除；apply-changes、
review-section、worktree checkout 与请求分发消费者共用语义入口。模块保留并行 stat 的完成顺序、
取消边界和预暂存命令非零结果不阻断 apply 的既有语义，由 62 项独立模块断言覆盖。

### 增量抽取：Git repository models

Common repository 的 origin URL memoization、review snapshot 的 generation/abort/stale 保护，以及
worktree repository 的 query client、配置读写、read generation 和精确 cache invalidation 已迁移至
`src/main/worker/git-repository-models.ts`。原 `Whe`/`s4`/`c4`/`Khe` class 实现已删除；manager
继续持有 repository identity map 与 stable metadata 生命周期，通过语义 class 构造实例。模块保留
24 小时零参数 origin cache、快照前后双检、working-tree path 选择性失效及 topology/local-ref 早退，
由 142 项独立模块断言覆盖。

### 增量抽取：Git operation marker paths

`GitRepoWatcher.getGitOperationState` 只读取六个 Git 状态标记文件，路径拼接
已迁移到 `src/main/worker/git-watch-paths.ts` 的
`createGitOperationMarkerPaths`，入口保留异步读取和状态映射。该边界覆盖
`CHERRY_PICK_HEAD`、`MERGE_HEAD`、`REBASE_HEAD`、`rebase-merge`、
`rebase-apply`、`REVERT_HEAD`，由 worker git watch path 回归脚本断言。

### 增量抽取：GitHub pull request summary batcher

GitHub pull request summary 的按账号批量去重、50ms debounce、最多 60 条请求分批、检查项分页
及 abort reader 过滤已迁移至 `src/main/worker/github-pull-request-summary.ts`。原 `_Se`/`gSe`
批处理实现已删除；入口仅保留账户校验与语义 handler 注入，GraphQL 失败继续降级为
`unavailable`，登录不一致、not-found、HEAD revision 竞争和最多 20 页检查项的既有语义保持不变。
`scripts/test-github-pull-request-summary.mjs` 覆盖基本 not-found/批处理路径，共 2 项断言。

### 增量抽取：Editor open arguments

终端编辑器行列参数与 macOS Terminal/Kitty/Ghostty/iTerm2 启动命令生成已迁移至
`src/main/worker/terminal-open-policy.ts`；入口继续负责 `$EDITOR` 探测、命令执行和失败 fallback。
`scripts/test-worker-terminal-open-policy.mjs` 覆盖行列参数、shell 传递、AppleScript 转义和未知
终端拒绝，共 11 项断言。

编辑器打开参数的远程 host 判定、普通 `--goto` 参数、VS Code remote URI 编码、folder/file URI
及带行列号的远程参数已迁移至 `src/main/worker/editor-open-args.ts`。入口继续负责编辑器探测、
进程启动和 remote-control 拒绝；纯参数构造由 9 项独立断言覆盖。

Open-in target 的平台描述符合并、跨平台 target 构造与 editor SSH 能力矩阵已进一步迁移至
`src/main/worker/open-in-target-descriptors.ts`。原 `t9` 实现已删除，`n9`/`r9` 仅保留
对语义工厂的薄委托；编辑器探测、Linux `.desktop` 启动与进程副作用仍留在入口。
`scripts/test-worker-open-in-target-descriptors.mjs` 以 12 项断言覆盖字段覆盖优先级、缺失平台、
hidden 继承、SSH 标记、默认参数及 Linux open 回调绑定。

Editor target 的 JetBrains 参数、Zed SSH URI 与行列位置追加策略已迁移至
`src/main/worker/editor-target-args.ts`；入口继续负责编辑器发现和进程执行，
`scripts/test-worker-editor-target-args.mjs` 覆盖 9 项参数/URI/行列断言（含 TextMate txmt URI）。

GitHub exact-revision review 的 diff/file handlers（`eSe`/`tSe`）已迁移至
`src/main/worker/github-pull-request-revision.ts`：SHA/path 校验、账号校验、diff API、
base/head 文件并行读取、1 MiB/UTF-8/NUL 安全限制，以及按 host 的双并发 semaphore 均由
语义模块负责；入口仅保留 API 适配。`scripts/test-github-pull-request-revision.mjs`
覆盖成功路径与空路径，共 6 项断言。

### 增量抽取：GitHub pull request board

`gh-pr-board` 的仓库候选推导、open/merged 查询编排、CLI 参数构造及 PR 状态映射已迁移至
`src/main/worker/github-pull-request-board.ts`；入口仅保留 host、GitHub CLI 与 Git manager
适配，原 `Vxe/N8/Hxe/P8/F8/Wxe/I8/Gxe/Kxe/qxe` 业务实现不再留在入口。新增
`scripts/test-github-pull-request-board.mjs`，共 6 项断言。

本轮将 53,200-53,477 协议 schema 的 elicitation/approval 归一化纯函数迁至
`src/main/shared/elicitation-protocol.ts`；`misc-runtime` 仅保留兼容 re-export，
URL 安全校验、browser auth、OpenAI form、tool suggestion 与 MCP tool call 形状由
`scripts/test-worker-elicitation-protocol.mjs` 的 6 项断言覆盖。

Git sparse pathspec 的不支持错误分类与 `git add` 失败结果构造已迁移至
`src/main/worker/git-pathspec-policy.ts`；入口仍保留重试编排，
`scripts/test-worker-git-pathspec-policy.mjs` 覆盖 5 项错误分类/结果字段断言。

Git/session 工作目录权限错误与 Git 超时错误判定已迁移至
`src/main/worker/git-session-error-policy.ts`；session 生命周期与实际 Git 调用仍在入口，
`scripts/test-worker-git-session-error-policy.mjs` 覆盖 6 项分类断言。

### 增量抽取：Git request cancellation lifecycle

`handleRequestWithContext` 的 request cancellation 状态转移已迁移至
`src/main/worker/git-request-lifecycle.ts`：请求开始时登记可取消/不可取消集合，处理
请求开始前的取消竞态，完成时清理状态，以及对运行中请求执行 abort。入口仅保留
`AbortController` 创建、性能事件和实际请求编排；`scripts/test-git-request-lifecycle.mjs`
覆盖 queued/active/uncancelable 三类边界，共 11 项断言。

`list-worktrees` 请求的 repository 可空解析与 worktree 列表委派已迁移至
`src/main/worker/git-worktree-list-request-handler.ts`；入口仅保留 Git manager 与
列表查询依赖注入，缺失 repository 仍稳定返回空数组。`scripts/test-git-worktree-list-request-handler.mjs`
覆盖存在/缺失仓库两条路径，共 5 项断言。

Git review read request 的状态摘要、branch diff stats、review summary、source line counts、
review diff/search/patch 已统一接入 `src/main/worker/git-review-read-dispatch.ts`；入口继续
负责 review I/O、性能结果和响应包装，`scripts/test-worker-git-review-read-dispatch.mjs`
覆盖 8 项 request/result 契约断言。
### 增量抽取：Linux terminal 参数策略

Linux 终端命令到工作目录参数的纯映射（含 shell fallback 命令拼接与安全 quoting）已迁移至
`src/main/worker/linux-terminal-args.ts`；worker 入口仅保留路径归一化和环境读取，6 项断言覆盖 kitty、ghostty、konsole、常规终端及 shell fallback。

### 增量抽取：Worktree create request lifecycle

`create-worktree` 请求的 upstream refresh controller 注册/身份保护清理、path/setup/log 三类流事件、
请求取消后的事件抑制，以及成功/失败 worker envelope 映射已迁移至
`src/main/worker/git-worktree-create-request.ts`。入口 class 的 `handleCreateWorktree` 实现已删除，
请求 dispatcher 只注入现有 create runtime、host、signal、emit 与 controller registry；24 项 focused
断言覆盖默认/显式 synced-branch 选项、事件字段、失败映射和并发 controller 替换边界。

### 增量抽取：Worktree create request dispatch

`create-worktree` 方法选择与请求结果转发已迁移至
`src/main/worker/git-worktree-create-dispatch.ts`。入口仅保留协议分支、依赖装配和后续性能/响应处理，
实际 controller 生命周期、事件流和成功/失败 envelope 继续由
`git-worktree-create-request.ts` 负责；`scripts/test-worker-git-worktree-create-dispatch.mjs`
覆盖方法匹配、参数转发、结果 envelope 与未知方法旁路，共 5 项断言。

`stable-metadata` 方法选择与结果转发已迁移至
`src/main/worker/git-stable-metadata-dispatch.ts`；Git-init watcher 的缺失 metadata 三态策略仍由
`git-stable-metadata-request-handler.ts` 保持，`scripts/test-worker-git-stable-metadata-dispatch.mjs`
覆盖成功编码、watcher ensure 和未知方法旁路，共 5 项断言。

### 增量抽取：Worktree lifecycle scheduling

Worktree 删除/恢复的 host+path 去重、删除 promise 清理，以及恢复操作的串行排队与失败后继续策略已迁移至
`src/main/worker/git-worktree-lifecycle.ts`。入口保留实际 snapshot/delete/restore 副作用，只注入运行回调；
12 项 focused 断言覆盖同 key 复用、跨 host 隔离、restore 排队、失败恢复和 map cleanup。

### 增量抽取：Worktree list request dispatch

`list-worktrees` 的只读请求分派已迁移至 `src/main/worker/git-worktree-list-dispatch.ts`。
入口继续提供 host、取消信号及实际 worktree 查询回调，语义模块仅负责请求方法匹配与参数转发；
`scripts/test-worker-git-worktree-list-dispatch.mjs` 覆盖成功转发、host/signal 保持及未知方法旁路，
共 3 项断言。

### 增量抽取：Codex worktree discovery request dispatch

`codex-worktrees` 的只读请求分派已迁移至 `src/main/worker/git-codex-worktree-dispatch.ts`。
入口继续注入 Git manager、执行 host、取消信号和 managed-worktree discovery 回调；语义模块只负责
方法匹配、`worktreesRoot` 转发及 `{ worktrees }` 响应 envelope，发现失败仍由入口保持原有错误映射。
`scripts/test-worker-git-codex-worktree-dispatch.mjs` 覆盖成功结果、manager/host/root/signal 契约、
未知方法旁路与发现失败传播，共 4 项断言。

### 增量抽取：Worktree resolution request dispatch

`resolve-worktree-for-thread` 的只读请求分派已迁移至
`src/main/worker/git-worktree-resolution-dispatch.ts`。入口继续提供 Git manager、host、取消信号、
managed-worktree discovery、thread config 与状态读取等窄依赖；语义模块仅负责方法匹配、参数转发和
结果 envelope，保持原有工作区选择与未提交变更判定。`scripts/test-worker-git-worktree-resolution-dispatch.mjs`
覆盖成功转发、参数保持及未知方法旁路，共 3 项断言。

### 增量抽取：Worktree owner-thread mutation dispatch

`set-worktree-owner-thread` 的 repository 定位、host/manager/signal 注入与 owner thread
写入已迁移至 `src/main/worker/git-worktree-owner-dispatch.ts`。入口仅保留请求错误协议
（失败统一映射为 `Failed to set thread worktree owner`）和 worker response envelope；旧的
worktree request handler 仅保留兼容适配器，确保 restore/历史调用路径不变。
`scripts/test-worker-git-worktree-owner-dispatch.mjs` 覆盖成功结果、manager/host/root/thread/signal
参数保持、未知方法旁路及写入失败传播，共 6 项断言。

### 增量抽取：Worktree mutation/lifecycle dispatch

restore/delete、upstream refresh cancel、thread handoff（local/worktree/host-worktree）及 host
handoff cleanup 的方法选择与 request-id 进度转发已迁移至
`src/main/worker/git-worktree-mutation-dispatch.ts`。入口仅保留协议响应 envelope（move handoff
继续返回原始结果，其余操作保持 `ok` 包装）；实际生命周期、去重、owner 更新和 host cache
副作用仍由 `git-worktree-request-handlers.ts` 注入执行。`scripts/test-worker-git-worktree-mutation-dispatch.mjs`
覆盖 restore/delete/move 成功路径及未知方法旁路，共 6 项断言。

### 增量抽取：Git watcher reference release lifecycle

GitRepoManager 的 watcher 引用释放边界已迁移至 `src/main/worker/git-watch-lifecycle.ts`。
该模块保持 ref-count 递减、setup 成功或失败后的 close 调度，以及零引用/空 watcher 的早退；
入口仍负责实际 watcher dispose 与 `git-repo-unwatched` 事件副作用。
`scripts/test-worker-git-watch-lifecycle.mjs` 覆盖多引用保留、最终释放、setup reject 和零引用早退，
共 5 项断言。

### 增量抽取：Git watcher index bucket lookup

Git 性能事件使用的 host-aware repository index size bucket 判定已迁移至
`src/main/worker/git-watch-index-bucket.ts`。helper 仅负责按 host、根路径包含关系选择
watcher bucket，并对 host 不匹配或越界路径返回 `unknown`；入口仍保留 path module 选择和
watcher 集合生命周期。`scripts/test-worker-git-watch-index-bucket.mjs` 覆盖同根、子路径、
越界路径与 host 隔离，共 4 项断言。

2026-10-06 增量：上述 host/root bucket 选择已物理迁移至
`src/main/worker/git-watch-index-bucket-policy.ts`；兼容入口仅保留转出，新增 policy focused
回归，watcher 集合与 telemetry 生命周期仍留在运行时。

### 增量抽取：Worktree synced-branch setup projection

Worktree 创建时的 synced-branch 是否配置及 local branch ref 投影已由
`src/main/worker/git-worktree-branch-setup-policy.ts` 的 `resolveSyncedBranchSetup`
统一承载；create runtime 仅保留 commit-tree 查询和 config 写入副作用。新增 ref 投影与
跳过条件断言，既有 worktree create 生命周期保持不变。

Worktree 创建时 resolved/configured local-environment path 的优先级与空值投影已迁移至
`src/main/worker/git-worktree-environment-policy.ts`；create runtime 仍负责异步解析、Git
config 写入与 setup 副作用，由 4 项 focused assertions 覆盖 resolved、fallback、empty 与
null 边界。

Worktree setup script 的 failed/error fallback 文案投影已迁移至
`src/main/worker/git-worktree-setup-policy.ts`；setup runtime 仍负责读取配置、执行脚本、日志
与 shell-environment I/O，由 5 项 focused assertions 覆盖成功、显式错误和默认错误文案。

Setup 输出的 shell-environment remove/write 分支判定已迁移至
`src/main/worker/git-worktree-shell-environment-policy.ts`；runtime 仅保留持久化 I/O，
由 4 项 focused assertions 覆盖缺失、null、空对象与有效环境。

Setup script 的 original/worktree workspace 环境变量覆盖构造已迁移至
`src/main/worker/git-worktree-setup-environment-policy.ts`；runtime 仅保留执行副作用，
由 3 项 focused assertions 覆盖独立、空值和同名变量边界。

Core Git RPC method 的 availability/create-branch/git-origins 白名单已迁移至
`src/main/worker/git-core-request-policy.ts`；dispatcher 仅保留参数编排与 Git I/O，新增 4 项
focused classification assertions。

Node-only Git RPC method 白名单已迁移至 `src/main/worker/git-node-request-policy.ts`；dispatcher
仅保留 host、signal 与依赖注入，新增 5 项 focused classification assertions。

Worktree snapshot read RPC 的 `worktree-snapshot-ref`/`managed-worktree-state` 方法白名单已迁移至
`src/main/worker/git-worktree-snapshot-read-policy.ts`；dispatcher 仅保留 snapshot 查询依赖，
新增 3 项 focused classification assertions。

Worker entry control-message 分类（RPC、生命周期通知、request/cancel）已迁移至
`src/main/worker/entry-message-policy.ts`；entry dispatcher 仍负责 parentPort 回调副作用，
新增 5 项 focused assertions。

Live-query shared wait 的 trace span/link 附加门禁已迁移至 `shouldAttachSharedTrace`；run
runtime 仅保留 trace link 组装与异步执行，由 4 项 focused assertions 覆盖 null、同 trace、跨
trace 与已有 link 边界。

Live-query shared run 的最终 consumer abort 门禁已迁移至 `shouldAbortSharedRun`；runtime 仅
负责 AbortController 副作用，由 4 项 focused assertions 覆盖零/负数与有消费者边界。

Live-query shared run 的 aborted/reuse 判定已迁移至 `canReuseSharedRun`；runtime 仅负责 map
生命周期与异步执行，由 4 项 focused assertions 覆盖缺失、默认、活跃与已 abort 状态。

Shell argument 的安全 token 判定已迁移为 `isShellSafeToken`，quote/join runtime 仅保留编码
与拼接；新增 4 项 focused assertions 覆盖合法、空值、空格和 quote 兼容边界。

### 增量抽取：Git watcher acquire lifecycle

`GitRepoManager.ensureWatching` 的 watch session 复用、引用计数、abort 释放和 start 失败清理已迁移至
`src/main/worker/git-watch-acquire.ts`。入口仍持有 `watchesByKey`、`createRepoWatch` 和实际
`unwatchRepo` 副作用；helper 仅协调 session 生命周期，由 `scripts/test-worker-git-watch-acquire.mjs`
覆盖 open-watch 复用、幂等 release、queued abort 和 start rejection，共 8 项断言。

Git init watcher 的重连与 session-ready 纯策略已进一步迁移至
`src/main/worker/git-init-watcher-policy.ts`：连接关闭/监听失败的重连判定、指数退避上限及
root/git 双 session 就绪判定不再与异步 watcher 副作用混在一起；`GitInitWatcher` 仍保留
watch 创建、dispose、stat 与 debounce 生命周期。`scripts/test-worker-git-init-watcher.mjs`
新增 8 项策略断言（总计 43 项）。

Git init watcher 的 workspace 变更路径筛选已迁移至
`src/main/worker/git-init-watcher-path-policy.ts`：空/缺失事件批次的保守触发、`.git` 根路径
及其子路径匹配、分隔符边界与跨平台字符串校验不再内联于 watcher callback；异步 debounce、
watch session 和 stat 副作用仍留在 `GitInitWatcher`。`scripts/test-worker-git-init-watcher-path-policy.mjs`
覆盖 7 项路径断言。

### 增量抽取：Live-query request handler

GitRepoManager 的 live-query 业务编排（status/review summary、branch diff stats、branch 查询与
worktree 列表）已迁移至 `src/main/worker/git-live-query-handler.ts`。语义模块通过窄依赖接收
repository、watch 状态、Git 查询和中间结果回调；worker 入口仅负责 manager/watcher 绑定、
性能依赖注入和 `runLiveQuery` 生命周期边界，watch session、live-query registry 与实际 Git I/O
仍保留在入口。`scripts/test-worker-git-live-query-handler.mjs` 覆盖 tracked/untracked 中间结果、
stats 双阶段执行、watch-aware recent/default branch、未知方法旁路，共 5 项断言。

### 增量抽取：Worktree handoff request boundary

worktree handoff 的进度事件、local/worktree/host-worktree 转移参数装配，以及跨 host
transfer cleanup 已迁移至 `src/main/worker/git-worktree-handoff-dispatch.ts`。该边界只负责
handoff 语义与目标 host cache invalidation；restore/delete/cancel 生命周期仍由 request handler
保留，实际迁移副作用继续通过窄依赖注入。`scripts/test-worker-git-worktree-handoff-dispatch.mjs`
覆盖 progress operation id/direction、跨 host cleanup 与 cache invalidation，共 6 项断言。

### 增量抽取：Git request invalidation policy

worker 请求完成后的仓库缓存失效策略已迁移至
`src/main/worker/git-request-invalidation-policy.ts`。该模块集中处理 mutation method
判定、exact/host 失效目标与 cwd/root 优先级解析；入口仍负责实际缓存失效、Git manager
和 host 生命周期副作用。`scripts/test-worker-git-request-invalidation-policy.mjs`
覆盖 mutation/readonly、cwd/root 优先级、exact/host 目标与 commit 条件，共 7 项断言。
Git watcher session 生命周期纯策略已进一步收敛至
`src/main/worker/git-watch-session-policy.ts`：指数重连退避、retry timer 单例门控、session close
稳定阈值、恢复后重试条件均由独立模块提供，`git-watch-paths.ts` 仅复用语义入口；新增 8 项
focused assertions 覆盖 disposed、generation、session matching 与 delay cap 边界。

### 增量抽取：live-query run coordinator

共享 live-query 执行边界已迁移至 `src/main/worker/git-live-query-run-coordinator.ts`。
该模块负责 repository queue 串接、shared-run 去重、tracked result fan-out、abort 驱动的
consumer 清理、deferred completion 与 trace-link 包装；`git-live-query-registry.ts` 仅保留
订阅状态、刷新调度和结果发布，并通过窄依赖委托 session/cache 执行边界。
`scripts/test-worker-git-live-query-run-coordinator.mjs` 覆盖 shared 去重、tracked fan-out、
完成清理与底层单次执行，共 6 项断言。

### 增量抽取：Git ignore-source watch reconciliation

Git watcher ignore-source 的 stale target 清理、路径集合更新、变更路径触发的 session 重启，
以及新 ignore source 的 handler/session 注册已迁移至
`src/main/worker/git-ignore-source-watch.ts`。worker 入口继续持有 watch target、session
副作用和路径 API，并通过窄依赖注入；`scripts/test-worker-git-ignore-source-watch.mjs`
覆盖旧 source 更新、新 source 注册、changed-path 清理与 session start，共 5 项断言。
### 增量抽取：Live-query subscription lifecycle

live-query registry 的订阅取消、refresh timer 调度和 refresh waiter 清理已迁移至
`src/main/worker/git-live-query-subscription-lifecycle.ts`。registry 仍保留 subscription
map、generation/retry 状态和实际 refresh 编排；新模块只接收 timer、订阅状态与 refresh
回调，保持取消时 abort、定时刷新以及完成时 waiter 唤醒的原有顺序。
`scripts/test-worker-git-live-query-subscription-lifecycle.mjs` 覆盖立即刷新、延迟刷新、
订阅取消和 waiter 清理，共 10 项断言。

Git 文件内容读取的 repository-relative path 校验、HEAD/index ref 选择、二进制 Git 输出
读取、空结果降级与 MIME 投影已迁移至 `src/main/worker/git-file-content.ts`。模块通过窄依赖
接收 repository lookup、platform path、Git 执行与 MIME 检测；调用方仍负责 Node worker
host 绑定和响应 envelope。`scripts/test-worker-git-file-content.mjs` 覆盖 HEAD ref、路径越界、
空内容及 MIME 结果，共 4 项断言。

Live-query 单次 generation 的 abort、tracked/complete 发布、错误重试与 waiter 清理已迁移至
`src/main/worker/git-live-query-refresh.ts`。registry 仅负责状态映射、依赖注入和调度；新模块
保留 generation 竞态保护及 retry trace 合并顺序，由
`scripts/test-worker-git-live-query-refresh.mjs` 覆盖 6 项行为断言。

Live-query refresh generation 的 dirty/trigger/retry 重置、generation 分配、trace 合并与
completion waiter 注册已迁移至 `src/main/worker/git-live-query-refresh-plan.ts`。registry
仅负责对选中 subscription 调用计划并安排 timer，避免在异步 refresh 编排中重复维护状态
转换；`scripts/test-worker-git-live-query-refresh-plan.mjs` 覆盖 9 项行为断言。

Live-query fan-out 的 host/commonDir/root/change-type 与 recovery/repository 选择策略已迁移至
`src/main/worker/git-live-query-selection-policy.ts`。registry 只保留 refresh 编排和状态副作用，
避免在订阅状态管理中重复内联筛选；`scripts/test-worker-git-live-query-selection-policy.mjs`
覆盖 repo-change、recovery、repository 三类选择，共 6 项行为断言。

Live-query 完成事件的 `git-live-query-updated` envelope（generation、recovery、subscription
identity、result 与可选 trace）已迁移至 `src/main/worker/git-live-query-events.ts`；registry 只保留
发布时机与 emit 副作用，由 `scripts/test-worker-git-live-query-events.mjs` 的 4 项断言覆盖。

Computer-use capture worker 的 update continuation policy 已迁移至
`src/main/worker/computer-use-capture-policy.ts`；metadata/AX text 会继续轮询，带 transition
snapshot 的 screenshot 与 completed/failed 会停止轮询，入口仍保留 worker service、日志、事件
发射和递归副作用。`scripts/test-worker-computer-use-capture-policy.mjs` 覆盖 7 项协议断言。

Git watcher setup 的 per-host 串行排队、index size bucket 采样、watcher ready/close 竞态与
origin-query 清理已迁移至 `src/main/worker/git-watch-setup.ts`；入口仅注入 host/path、watcher
启动、repository cache 与 close 副作用，由 `scripts/test-worker-git-watch-setup.mjs` 覆盖 11 项
生命周期断言。watcher 本身和 worker host 绑定仍保留在入口。

Git repository watcher 的 close 副作用（幂等 closing promise、repository cache invalidation、
watcher dispose、registry removal 与 `git-repo-unwatched` envelope）已迁移至
`src/main/worker/git-watch-close.ts`；入口仅注入 host、repository/cache 与 logger 适配，
由 `scripts/test-worker-git-watch-close.mjs` 覆盖 8 项生命周期断言。

### 增量抽取：Live-query subscription setup boundary

live-query 订阅前的 repository metadata 查询、pending-metadata trace 关联、watcher 复用/启动
及 setup trace envelope 已迁移至 `src/main/worker/git-live-query-subscription-setup.ts`。
`git-watch-request-handlers.ts` 现在仅保留订阅注册、abort 等待、取消和 watcher 引用释放副作用，
由 `scripts/test-worker-git-watch-request-handlers.mjs` 增至 30 项断言，并直接覆盖 setup helper
的 metadata、trace 与 release contract。

### 增量抽取：Live-query registry refresh boundary

registry 级 repo-change、recovery 与 repository mutation 刷新选择已迁移至
`src/main/worker/git-live-query-registry-refresh.ts`。新模块集中维护 selection、recovery
deduplication、active trace 与 refresh trigger contract；registry 仅保留 states、timer、
subscription 与 run coordinator 所有权。`scripts/test-worker-git-live-query-registry-refresh.mjs`
覆盖 repo-change fan-out、recovery state transition、跨 subscription recovery 去重及
repository refresh，共 12 项断言。

### 增量抽取：Git request context policy

Git worker 请求的 telemetry/context 投影已迁移至
`src/main/worker/git-request-context-policy.ts`：按请求方法选择 cwd/root、提取 review
source，并统一识别 error/success=false/command-error 结果。该边界保持纯函数，不触碰
worker I/O 或请求生命周期；`scripts/test-worker-git-request-context-policy.mjs` 覆盖
12 项 root/source/cwd/failure 断言。

### 增量抽取：Worker host path policy

Windows/WSL 主机路径判定与转换（WSL mounted path、Windows/UNC、WSL UNC distro、盘符与
extended UNC 归一化）已迁移至 `src/main/worker/host-path-policy.ts`。入口仅保留兼容别名并
继续负责调用方的平台副作用；`scripts/test-worker-host-path-policy.mjs` 覆盖 12 项路径
边界断言。

Linux `.desktop` 应用条目的 Hidden/Type/DBus、OnlyShowIn/NotShowIn、TryExec 与元数据
投影策略已迁移至 `src/main/worker/linux-desktop-entry-policy.ts`；入口仍负责目录遍历、文件
读取、可执行文件探测与进程启动副作用。`scripts/test-worker-linux-desktop-entry-policy.mjs`
覆盖 5 项可见性、DBus、TryExec 与默认名称断言。

### 增量抽取：Worktree list request boundary

Git remote branch discovery 的纯解析与排序边界已迁移至
`src/main/worker/git-remote-branches-policy.ts`：remote HEAD ref、`remote show` 默认分支、
remote 名称排序及 main/master conventional fallback 均由纯策略承载；运行时仍保留 query
cache、Git I/O 与异步短路编排。`scripts/test-worker-git-remote-branches-policy.mjs`
覆盖 10 项 focused assertions，原 44 项 remote-branches 回归继续通过。

`list-worktrees` 请求的 repository 可空解析与列表委派已迁移至
`src/main/worker/git-worktree-list-request-handler.ts`。helper 只接收 Git manager、host、
signal 与列表查询依赖；缺失 repository 稳定返回空数组，入口继续持有请求 envelope、取消
与 Git I/O 生命周期。`scripts/test-worker-git-worktree-list-request-handler.mjs` 覆盖存在与
缺失 repository、参数和 signal 透传，共 5 项 focused assertions。

### 增量抽取：Worktree file enumeration policy

Worktree snapshot 文件枚举中的 NUL 路径解析、porcelain untracked 状态投影、literal pathspec
字节分批、index fingerprint 与缺失文件判定已迁移至
`src/main/worker/git-worktree-files-policy.ts`。`git-worktree-files.ts` 继续持有 Git 命令、stat、
稳定性重试和 fallback 生命周期，并复用这些纯策略；
`scripts/test-worker-git-worktree-files-policy.mjs` 覆盖 11 项 focused assertions。

### Worker state/schema owner recheck (2026-10-06)

48,152-49,999 的 SQLite host/automation schema 仍没有 worker state consumer。host registry
的 `local_thread_catalog_hosts` INSERT/SELECT/DELETE 由
`src/main/main-app/thread-catalog/store.ts` 持有；automation 的 `rrule` 默认值与调度投影
由 `src/main/shared/automation-settings.ts`、`automation-registry.ts` 及 main automations
运行时消费。worker 内另建 state facade 会重复迁移 owner 并分裂 schema/migration 版本，故该
区段继续标记为 preserved-coupled，等待明确 worker request boundary。

### Worker host assembly owner recheck (2026-10-06)

83,636-84,079 的 host factory/worker API assembly 目前没有可独立接回的纯构造 owner：
`git-worktree-request-handlers.ts`、`git-worktree-handoff-dispatch.ts` 等消费者直接注入
`createExecutionHost`，并同时持有 host、Git manager、main RPC 与 handoff/ignore-source
watch 生命周期。`git-ignore-source-watch.ts` 已抽出可验证 reconciliation policy，但 factory
本身仍是组合根；继续拆分会重复 host identity 或改变 RPC/watch 初始化顺序，本轮保留 assembly
边界。

### Worker command registry owner recheck (2026-10-06)

61,151-63,050 的 command/shortcut/browser command 定义当前实际 owner 是
`src/main/shared/command-registry.ts`，其 policy 子边界由
`command-registry-policy.ts` 与 `command-capability-policy.ts` 消费；renderer/menu/keyboard
调用方直接依赖 shared registry，`src/main/worker` 没有对应 command request handler。将完整
registry 复制到 worker 会破坏 shared command identity，故仅保留已迁移的 shared policy，暂不
新增 worker facade。

### Worker platform boundary recheck (2026-10-06)

当前 worker 的平台相关窄入口已有真实 consumer：`worker.ts:110` 接回
`git-local-environment`，`worker.ts:130` 接回 `shell-config`，`worker.ts:136` 接回
`platform-env`；三者均有 focused regression，并由入口继续持有 platform/process I/O。
复核原始 55,351-56,420 与 86,131-90,660 区段后，剩余逻辑仍分别耦合 Windows shell/runtime
副作用及 Git Bash/GitHub Desktop discovery、workspace watcher 生命周期，未发现新的可独立
接回纯策略边界；本轮不重复制造 facade。

### 增量抽取：Git watcher path partition policy

watcher discovered path 的 stale/new 集合分区已迁移至
`src/main/worker/git-watch-path-partition-policy.ts`。`git-watch-paths.ts` 继续持有 watcher
session、dispose 与注册副作用；`scripts/test-worker-git-watch-path-partition-policy.mjs`
覆盖 2 项稳定分区断言。

Worktree copy 的 NUL-separated path 投影已迁移至 `src/main/worker/git-worktree-copy-path-policy.ts`；
`git-worktree-copy-files.ts` 继续持有 stat、symlink guard、copy 与 cleanup 副作用，
`scripts/test-worker-git-worktree-copy-path-policy.mjs` 覆盖 1 项解析断言。
Agent override path 的 Git `ls-files -z` 过滤已迁移至 `src/main/worker/git-worktree-copy-policy.ts`；
入口继续负责 Git I/O、失败处理与 copy 生命周期，`scripts/test-worker-git-worktree-copy-policy.mjs`
覆盖 1 项稳定去重/后缀匹配断言。
`.worktreeinclude` 的 ignored/included path 交集与稳定去重也已迁移至同一 policy；入口继续
负责双 Git 查询、存在性检查与 copy 生命周期，focused assertions 增至 2 项。

Watcher optional repository-state 的 tri-state boolean aggregation 已迁移至
`src/main/worker/git-watch-boolean-policy.ts`；`git-watch-paths.ts` 继续持有 watcher 状态、
timer 与 recovery 副作用，`scripts/test-worker-git-watch-boolean-policy.mjs` 覆盖 3 项 true/null/false 断言。
`createGitOperationState` 仍额外组合 rebase head/merge/apply 三类 marker，并与 watch refresh
action 共用 tri-state 结果；它不是独立字段投影，继续由 `git-watch-paths.ts` owner 持有。
其余 `git-watch-paths.ts` 的 operation marker path、affected working-tree path 与 metadata
refresh selection 均依赖 platform path API、Git dir topology 和 watcher handler state；迁移任一
函数都会复制 path normalization/handler 生命周期，当前无更窄安全边界。

`resolveWorktreeLocalEnvironmentConfig` 仍跨 source/target host stat、Git tracking/ignore 查询、
symlink guard、copy 与 fallback 顺序；该请求边界共享本地/远程 host 语义和文件副作用，当前
没有不改变 I/O 顺序的独立纯 policy。

### Worker read/working-tree residual owner review (2026-10-06)

`git-read-request-handlers.ts` 当前只负责将 cwd/root、Git manager、host 与 abort signal 注入
已有语义模块；缺失 repository 的 null/empty contract 属于 request lifecycle。`git-review-working-
tree-metadata.ts` 的剩余实现共享 review snapshot、临时目录、Git diff、并发 worker 与 metadata
merge 顺序，已有 working-tree policy 覆盖纯投影；本轮未发现可独立接回的新 policy。

### Worker git-cat-file residual owner review (2026-10-06)

`git-cat-file.ts` 的 OID 可查询、content/error envelope、disk error 与 batch-error 判定已由
现有 `git-cat-file-*policy.ts` 模块接回并有 focused regressions。剩余 batch parser、stream
prefix、disk read 与 retry 递归共享 byte limits、review snapshot、host I/O 和失败重试顺序，
当前没有可独立接回且不复制这些 owner 的新纯策略边界。

### Execution/computer-use adapter owner recheck (2026-10-06)

84,549-85,965 的 execution host 与 computer-use adapter 目前只作为 runtime glue 被入口和
对应 service 消费：execution host 由 worktree/handoff handlers 注入，capture continuation
则已由 `computer-use-capture-policy.ts` 提供纯判断，入口仍持有 service、日志、事件发射和
递归副作用。该区段没有独立于 host/service identity 的新策略边界，继续保留 adapter owner。

### Worker telemetry owner recheck (2026-10-06)

63,051-65,199 的 Git command telemetry/error normalization 已由
`src/main/worker/git-observability.ts` 接回，并由 request/read handlers 注入 operation、
host cache key、exit bucket 与 failure classification。OpenTelemetry/Sentry/Datadog SDK
仍由基础设施与 worker lifecycle owner 管理；当前没有可在不重复 SDK 生命周期的情况下新增
worker policy 边界。

### Git manager/watch/request owner recheck (2026-10-06)

65,200-80,999 的主区段已形成可核验的三类 owner：`git-repository-models.ts` 持有
repository identity/cache model，`git-watch-*` 与 `git-live-query-*` 持有 watcher/session
生命周期，request handlers/dispatch 则持有方法与取消协议。现有 policy 已通过窄依赖注入
接回这些 owner；剩余 manager 状态（memoization、timer、abort、trace）跨越多个 consumer，
没有新的单一纯策略边界可安全拆出，本轮不制造重复 manager facade。

### Worker entry protocol boundary recheck (2026-10-06)

90,661-90,836 继续作为精确保留边界：`workerData`/`parentPort` 校验、main-RPC client
初始化及 `worker-request`、`worker-request-cancel`、`worker-flush-and-exit` message loop
仍由入口持有；`entry-dispatcher` 只负责控制消息分类，request dispatch 则接回现有
core/node/snapshot/live-query handlers。该边界已有 entry-dispatcher 与 request-dispatch
focused regressions，移出入口会改变线程启动或 flush/exit 顺序，当前不再拆分。

### WSL command owner recheck (2026-10-06)

47,122-47,584 中的纯输出/argv 边界已经由 `src/main/worker/platform-wsl.ts` 覆盖：UTF-16/UTF-8
解码、active distro 识别、eligible distro 排序、fallback 选择和 `wsl.exe` argv 构造均有
focused regression。剩余 `wslpath`/`wsl.exe --status|--list` 执行仍共享 Windows command
spawn、日志和错误处理；当前没有可脱离 exec owner 的新策略，继续保持 preserved-coupled。

### Worker GitHub/review owner recheck (2026-10-06)

81,000-83,323 的 GitHub/review 区段当前已由真实 request consumers 接回：
`git-node-request-dispatch.ts` 处理 `github-request`，`git-review-read-dispatch.ts` 处理
review/status/branch-diff/read 家族，`github-pull-request-board.ts` 与 revision/summary
模块分别持有 GitHub API、CLI 与批处理副作用。剩余逻辑依赖 host、Git manager、性能结果和
响应包装，未发现可脱离这些 owner 的新纯策略边界；继续保持现有窄 policy/handler 拆分。

### Worker protocol-schema owner recheck (2026-10-06)

对 38,230-43,985 与 53,200-53,477 的协议 schema 做了 consumer 复核：当前
`src/main/worker` 没有 deep-link/browser-tab/runtime-bundle 或 connector/MCP schema 的
request handler；`browser_auth_challenge_id` 的实际 owner 是
`src/main/shared/elicitation-protocol.ts`，由 shared elicitation/approval normalization
消费，而非 worker。将这些声明复制到 worker 会产生未接回 facade，故继续保留原始 schema
边界，待真实 worker request consumer 出现后再按子组迁移。

### Worker lifecycle/transport boundary recheck (2026-10-06)

原 84,080-85,965 的 lifecycle/transport 边界已对照当前入口复核：`entry-dispatcher.ts` 仅
投影 `sentry-user-update`、`flush`、`analytics` 与 RPC request/cancel 分类，真实 consumer
仍在 worker entry 中串接 Sentry、analytics flush、request registry 和 `parentPort` 响应。
这些动作共享 dispose/flush 顺序与线程生命周期；现有 `scripts/test-worker-entry-dispatcher.mjs`
覆盖 8 项 dispatch 断言。因此该区段当前没有可在不重排副作用的情况下独立接回的纯策略，保留
现有窄 dispatcher 边界。

### Worker turn-diff residual owner review (2026-10-06)

`git-turn-diff-capture.ts` 的 status/abort/error 与 request envelope 判定已由
`git-turn-diff-capture-policy.ts`、`git-turn-diff-status-policy.ts` 接回；剩余实现共享 review
snapshot generation、Git diff、abort signal、telemetry 与 response completion 顺序，当前无新的
独立纯策略边界。

### Worker branch/cache runtime owner review (2026-10-06)

Branch search 的 request handler/runtime 已分离，剩余 `queryGitBranchRefs` 绑定 query cache、
Git host、abort signal 与异步 ref 扫描；cache request handlers 直接执行 stable-metadata/read-cache
invalidation 副作用。当前未发现不复制 cache/lifecycle owner 的新纯策略边界。

### Worker repository/review request owner review (2026-10-06)

`git-repository-read-request-handlers.ts` 与 `git-review-request-handlers.ts` 已是窄 request
consumer；两者剩余逻辑分别绑定 repository availability、Git read cache、review snapshot、
abort/performance envelope 与 response wrapping。当前没有可脱离 request lifecycle 的新纯 policy。

Review metadata utils/diff/commit queries 已分别承载 rename/untracked reconciliation、metadata
diff parsing 与 commit line-count/branch query；剩余 fetch/query 函数绑定 review snapshot、Git
命令、并发与 abort signal，现有 utility/policy consumer 已覆盖纯投影，不再新增 facade。
Review comparison 的 merge-conflict path 与 empty-untracked 查询仍绑定 repository root、Git host、
snapshot/query cache 及失败包装；它们不是独立路径 predicate，继续由 comparison owner 保留。
Review patch/diffs 的 tracked diff cache、rename fallback、snapshot generation 与 worktree file
enumeration 已有对应 policy/utility；剩余 fetch/list 函数共享 Git I/O、stability retry、stat
与 query cache，当前无新的独立纯边界。
Review commit queries 的 branch commit listing 与 line-count 仍依赖 repository query client、Git
command result、review snapshot 与 abort signal；其字段 projection 已由上层 request consumer
覆盖，当前不再拆分 query owner。
Worktree starting-ref 的 local ref 规范化与 remote candidate 枚举已迁移至
`src/main/worker/git-worktree-starting-ref-policy.ts`；runtime 继续负责 upstream/remote 查询、
fetch、compare 与 resolve 副作用，`scripts/test-worker-git-worktree-starting-ref-policy.mjs`
覆盖 3 项 ref/candidate 断言。
Worktree porcelain list 的记录解析已迁移至 `src/main/worker/git-worktree-list-policy.ts`；runtime
继续负责 Git 命令、query cache 与错误处理，`scripts/test-worker-git-worktree-list-policy.mjs`
覆盖 branch/detached、locked/prunable、空记录三项解析断言。
Worktree resolution 的 comparison-root 规范化与 managed-root containment 判定已迁移至
`src/main/worker/git-worktree-resolution-policy.ts`；runtime 继续负责 metadata、owner fallback、
排序与 dirty-state 查询，`scripts/test-worker-git-worktree-resolution-policy.mjs` 覆盖 4 项路径断言。
Blame repository web URL 的 GitHub host gate 已迁移至现有 `git-blame-file-policy.ts`；runtime 继续
负责 origin 查询、remote parsing 与 URL 组装，blame policy focused assertions 增加 3 项 host 断言。
Git diff text 的 quoting/escape、header path projection 与 rename rewrite 目前仍由同一 parser owner
共享 UTF-8/octal 解码、header classification、path prefix 与 diff text rewrite 顺序；拆出任一局部
helper 会复制 parser 状态或改变 rename/header 组合语义，当前没有不制造 facade 的独立 business policy。
Git path resolution 的 git-dir/git-path/shared-index 查询继续绑定 query cache、Git rev-parse、
host path API、index fingerprint 与 shared-index fallback；这些步骤共享 repository/cache/I-O 顺序，
当前没有可独立接回而不复制 path-resolution owner 的纯策略边界。
Review section changes 的 gitlink cleanliness、repository lookup、review diff/apply-patch、cache
invalidation 与 partial-apply error contract 共享 target host、Git 状态查询及副作用顺序；现有
`git-review-section-policy.ts` 已覆盖路径/error projection，剩余 orchestration 不再拆分新 facade。
Review metadata utils 的 rename reconciliation 同时更新 raw entries、files 与 stats，并依赖
deleted-entry OID 唯一匹配、untracked path set 和 rename 覆盖顺序；拆分其中单一投影会失去跨批次
一致性，继续由 metadata utility owner 持有。
Review metadata diff 的 rename inference、raw numstat/status 解析与 metadata finalization 共享
Git diff 输出、path quoting、rename threshold 与 snapshot ordering；其跨阶段字段契约要求保持同一
diff owner，当前没有可独立接回而不复制解析状态的纯策略。
Review file diff 的 blob/working-tree/symlink/untracked 分支共享 repository snapshot、host stat、
binary/text detection、abort signal 与 diff response envelope；各分支的 fallback 顺序会影响
最终 diff kind，当前继续由 file-diff owner 保持，不新增 facade。
Review comparison 的 merge-base/merge-conflict、empty-untracked 与 snapshot comparison 共享
repository root、Git host、query cache、failure envelope 与 comparison ordering；path projection
已有 comparison policy 覆盖，剩余查询编排不形成独立纯策略。
Review patch 的 tracked diff cache、rename fallback、snapshot generation 与 worktree file
enumeration 共享 Git I/O、stability retry、stat/cache invalidation 和 response completion 顺序；
现有 patch policy 已覆盖 section projection，剩余 patch fetch/list 保持原 owner。
Review commit queries 的 branch commit listing 与 line-count 共享 repository query client、Git
command result、review snapshot、abort signal 与 response field projection；字段投影已有 request
consumer 覆盖，剩余 query orchestration 不形成独立纯策略。
Turn diff capture 的 status/abort/error policy 已抽出；剩余 snapshot generation、Git diff、abort
signal、telemetry 与 response completion 共享同一生命周期顺序，当前无新的独立纯策略边界。
Branch search runtime 的 ref scan 绑定 query cache、Git host、abort signal 与异步扫描结果；
cache request handlers 还需执行 stable-metadata/read-cache invalidation 副作用，当前没有不复制
cache/lifecycle owner 的安全纯策略边界。
Repository/review request handlers 的剩余逻辑绑定 repository availability、read cache、review
snapshot、abort/performance envelope 与 response wrapping；已有 request policy 覆盖方法分类，
不再拆出重复 request-lifecycle facade。
WSL command runtime 的 wslpath 与 wsl.exe status/list 执行仍共享 Windows command spawn、日志、
错误分类与 fallback 顺序；纯输出解码、distro 选择与 argv 构造已有 platform policy 覆盖，剩余
exec owner 不再拆分。
Worker telemetry/error normalization 仍由 command observability、performance envelope、logger
与 worker lifecycle 共同持有；独立拆分会重复 operation identity 或改变 flush/dispose 顺序，当前
无新的安全纯策略边界。
Execution/computer-use adapter 仍绑定 execution host、service identity、capture continuation、
日志与事件发射；现有 capture policy 已覆盖纯判断，剩余递归 continuation 与 service 生命周期
不适合再拆独立 worker policy。
Worker entry protocol 的 workerData/parentPort 校验、main-RPC 初始化与 request/cancel/flush
message loop 共享线程启动、request registry、response emission 及 flush/exit 顺序；dispatcher
仅负责分类，当前不再拆入口生命周期 owner。
Worker platform boundary 的 local-environment、shell-config 与 platform-env policy 已由真实
consumer 接回；剩余 Windows shell、Git Bash/GitHub Desktop discovery 与 workspace watcher
生命周期仍耦合 process/host I/O，本轮不新增 platform facade。
Worker command registry boundary 的 command/shortcut/browser command 定义实际 owner 仍是
shared command-registry；renderer/menu/keyboard 直接依赖 shared identity，worker 无对应 request
consumer，复制 registry 会破坏 identity，继续保留 shared owner。
Worker host factory/assembly 仍由 worktree/handoff handlers 组合 createExecutionHost、Git manager、
main RPC 与 ignore-source watcher 生命周期；该组合根没有独立纯构造 owner，拆分会重复 host
identity 或改变 watcher/RPC 初始化顺序，继续保留 assembly owner。
Worker protocol schema 中 deep-link/browser-tab/runtime-bundle、connector/MCP 与 elicitation
字段的实际 owner 分别在 shared protocol/elicitation consumers；当前 worker 没有对应 request
handler，复制 schema 会产生未接回 facade，继续保留 shared schema owner。
Worker lifecycle/transport boundary 的 sentry-user-update、flush、analytics 与 RPC request/cancel
分类虽可由 dispatcher 投影，真实 consumer 仍串接 Sentry、analytics flush、request registry 与
parentPort response；这些动作共享 dispose/flush 顺序，继续保留 transport owner。
Working-tree metadata 的 `mergeMetadataMaps` 虽为 Map 合并，但其覆盖顺序由 tracked/untracked
批次、并发 worker 与 rename reconciliation 共同决定；继续由 metadata owner 持有以保持结果顺序。
`git-worktree-files.ts` 的 list runtime 已将 NUL/status/pathspec/index fingerprint 与 missing-file
判定交给 `git-worktree-files-policy.ts`；剩余 Git 命令、stat、stability retry 与 fallback 仍是
单一 runtime owner，本轮无新增 policy。
Git root resolution 的 non-repository stderr 分类已迁移至 `git-root-resolution-policy.ts`；runtime
继续负责 local stat、rev-parse、Git unavailable/error logging 与 common-dir resolution，
`scripts/test-worker-git-root-resolution-policy.mjs` 覆盖 3 项分类断言。
Merge-base runtime 的 upstream/default-remote 查询、query cache、ref resolution 与 merge-base
fallback 共享 Git command exit semantics（1/128）、abort/query metadata 和 remote ordering；
现有 ref/branch policies 已覆盖参数投影，剩余异步 fallback 不形成独立纯策略。
Branch-ahead 的 `rev-list --count` stdout 数值/null 判定已迁移至现有
`git-branch-ahead-policy.ts`；runtime 继续负责 query cache、Git exit handling 与 remote/merge-base
fallback，focused policy assertions 增加 3 项。
Git config scope runtime 的 missing-value detection、scope fallback 与 worktree-config enable retry
共享 query signal、Git command errors、scope cache metadata 与 retry ordering；现有 config policies
已覆盖 scope/argument projection，剩余 config I/O 不形成独立纯策略。
Review branch stats 的 operation-marker status、tracked/untracked metadata、rename reconciliation
与 review snapshot 共享 Git dir resolution、host stat、missing-error semantics、concurrency 与
response ordering；现有 branch-stats policy 已覆盖 marker path projection，剩余 runtime 不拆 facade。
Review metadata diff parser 的 NUL field cursor 同时消费 raw status entries、rename path pairs 与
numstat records；cursor advancement、malformed-record stop semantics 与 downstream rename reconciliation
共享同一 output ordering，当前不拆出局部 parser facade。
Review commit query runtime 的 branch comparison resolution、bounded log output、snapshot/query cache
与 abort-aware line-count parsing 共享 commit ordering、normalization 与 response envelope；现有
commit-query policy 已覆盖 parser/field projection，剩余 query I/O 不形成独立纯策略。
Branch-create runtime 的 branch existence probe、commit-tree resolution、Git branch/switch 与
synced-config update 共享 query cache、ref namespace、fail-if-exists semantics 与 error envelope；
现有 branch-name/ref policy 已覆盖纯 validation，剩余 create orchestration 继续由 owner 持有。
Remote branch upstream ref 的 stdout trim/empty-to-null 投影已迁移至现有
`git-remote-branches-policy.ts`；runtime 继续负责 query cache、Git exit/abort handling，focused
policy assertions 增加 3 项。
Branch search runtime 的 ref scan 同时依赖 Git `for-each-ref` 输出、case-folded query matching、
branch deduplication、abort-aware batching 与 query cache；现有 search policy 已覆盖 text/ref
projection，剩余 scan/runtime 编排保持 owner。
Git observability runtime 的 performance outcome/reason/failure projection 共享 operation attribution、
cache hit/miss counters、logger tags 与 telemetry flush lifecycle；拆出局部 reason helper 会复制
attribution semantics，现有 performance policy 已覆盖 bucket/operation projection，继续保留 owner。
RPC client 的 method allowlist、response shape guard、request id registry、abort propagation 与
parentPort message transport 共同定义跨线程协议；拆出 guard 会复制协议 identity/registry state，
继续由 rpc-client owner 持有并由现有 transport regressions 覆盖。
Remote host config 的 SSH 字段 shape/type normalization 已迁移至
`remote-host-config-policy.ts`；display-name/SSH identity consumer 继续负责 terminal command
解析与 host formatting，command tail/port/identity 与 IPv6 bracket projection 也已归入 policy，
focused policy assertions 增至 7 项。
Synced-branch config parsing 的 JSON decode、schema validation、warning/error fallback 与 config
file read/write 共享 schema owner、Git-dir/path resolution、host file I/O 和 warning lifecycle；
当前没有不复制这些 owner 的独立纯 parser 边界。
Turn-diff snapshot 的 tree SHA trim/validation/normalization 已迁移至
`git-turn-diff-snapshot-policy.ts`；runtime 继续负责 status、Git tree resolution、temporary index
与 staging 生命周期，新增 2 项 focused assertions。
Review comparison 的 empty-untracked response projection 已迁移至现有
`git-review-comparison-policy.ts`；comparison runtime 继续负责 repository/query/snapshot I/O 与
failure wrapping，focused policy assertions 增加 1 项。
Git diff header parser 的 combined/git classification、quoted-path escape decoding、prefix stripping
与 rename rewrite 共享 parser cursor、UTF-8/octal fallback 和 downstream diff envelope；现有 header/
quote/octal policies 已覆盖局部投影，剩余 parser 组合不安全拆分。
Cat-file batch parser 的 request framing、stream prefix handling、byte limits、truncated-tail retry
与 disk fallback 共享 batch cursor、snapshot consistency、host I/O 与 recursive retry ordering；
现有 cat-file error/content/batch-error policies 已覆盖错误投影，剩余 parser 不拆分。
Live-query registry refresh 的 repo-changed event handling、recovery flag、refresh scheduling 与
waiter resolution 共享 generation/abort state、watcher coverage、timer lifecycle 与 event ordering；
现有 live-query state/watch policies 已覆盖 key/option projection，剩余 registry mutation 不拆分。
Live-query subscription lifecycle 的 cancellation、retry timer、refresh waiters 与 dispose handling
共享 subscription identity、AbortController、watcher recovery 与 registry ownership；单独拆出任一
transition 会改变 cancellation/flush 顺序，继续由 lifecycle owner 持有。
Submodule path runtime 的 `.gitmodules` missing fast path、abortable stat、Git config query、path
normalization 与 stable dedup 共享 repository query cache、host I/O、abort semantics 和 config
failure fallback；现有 submodule path policy 已覆盖 output projection，剩余 runtime 不拆 facade。
Git index-info runtime 的 git-dir resolution、platform path join、index stat 与 ENOENT/non-ENOENT
logging 共享 host/cache I/O、error telemetry 与 lastModified response projection；现有 index-info
policy 已覆盖 finite-mtime/zero fallback，剩余 runtime 不拆新边界。
Git diff text 的 line-count 已由 diff-line-count policy 接回；剩余 quoted path parser、combined
header handling、rename rewrite 与 diff text transport 共享 parser state 和 response ordering，
当前无新增独立纯策略。
Live-query branch dependency extraction 与 reference-count update 共享 query method/source gating、
refs/heads normalization、dependency key identity 与 registry mutation；已有 state/key policy 覆盖
branch dependency key projection，剩余 update lifecycle 不拆分。
Live-query updated event envelope 已由 `git-live-query-events.ts` 负责稳定字段投影；registry 仍
持有 generation completion、trace propagation、emit timing 与 recovery state，继续保持事件 owner。
Git observability 的 performance result fields 由 operation-specific result shape、stale/error
mapping、diff byte/file aggregation 与 truncation semantics 共同决定；现有 observability policy
已覆盖 operation classification/bucketing，剩余 fields aggregation 共享 telemetry envelope，暂不拆。
2026-10-11 A1 worker 增量：local shell environment 的登录 shell 探测、候选 shell fallback、NUL
environment marker 解析、CODEX_SHELL 清理与 per-host cache 已迁移至 `git-shell-environment.ts`；
worker entry 继续持有 process/host I/O、warning 与 Git local-environment runtime wiring，新增
5 项 focused assertions，typecheck/build/verify-chunks 通过。
