# Git worker 逐段审计

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
的 99 项断言覆盖；进程 executable 的 `process.kind` 分类也已迁至同一模块，保留入口的
operation 属性和 telemetry 组装；GitHub CLI operation、SSH operation 与 Git
subprocess wrapper 的有限集合分类也由同一模块提供，入口保留 command telemetry
组装。Git performance 的 operation/result/outcome/failure reason 归一化、untracked cache
状态、采样策略和 index size bucket 亦已完整迁入该模块；原
`w6`/`kye`/`Aye`/`jye`/`Mye`/`Nye`/`Pye`/`Fye`/`Lye`/`Rye`/`T6` 实现及
`C6`/`Eye` 阈值常量已从入口物理删除。

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

repository/file read 请求（`repository-identity`、`commit-message-diff`、`submodule-paths`、
`cat-file`、`blame-file`、`index-info`、`config-value`）已迁移至
`src/main/worker/git-repository-read-request-handlers.ts`。模块保留 repository unavailable、
指定 review snapshot 失效时的逐请求 unknown error、abort wrapper 与精确参数收窄；turn-diff
capture 因依赖 watcher readiness 回调仍保留在入口。对应回归脚本由 15 项断言覆盖。

turn diff capture 的 start/complete 请求编排已迁移至
`src/main/worker/git-turn-diff-request-handlers.ts`。模块显式接收 `isRepoWatched`，入口继续
拥有 `watchesByKey`、ready/recovery 状态和 response 包装；capture helper 的参数收窄与 watcher
判定透传由 `scripts/test-worker-git-turn-diff-request-handlers.mjs` 的 8 项断言覆盖。

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
### 增量抽取：Git operation marker paths

`GitRepoWatcher.getGitOperationState` 只读取六个 Git 状态标记文件，路径拼接
已迁移到 `src/main/worker/git-watch-paths.ts` 的
`createGitOperationMarkerPaths`，入口保留异步读取和状态映射。该边界覆盖
`CHERRY_PICK_HEAD`、`MERGE_HEAD`、`REBASE_HEAD`、`rebase-merge`、
`rebase-apply`、`REVERT_HEAD`，由 worker git watch path 回归脚本断言。
