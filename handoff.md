# Handoff（终局版）：从「结构等价」到「完全反编译 + 可读工程」

2026-10-05 构建/启动回归修复：main-app transform-only 输出统一补齐 Node ESM 的 `.js` 相对导入，并将
`@chunk/*` 改写为实际 chunk 相对路径；bootstrap vendor 兼容导出改用稳定局部绑定，补回 preserved main
对 `bootstrap/protocol/app-protocol.js` 的历史路径 facade。已用临时独立 Electron profile 实测主窗口 frame
加载与 app-server `initialize_handshake_result` 均成功；`npm run build`、`verify`、`typecheck` 通过。

2026-10-05 T2/A2 继续批次：annotation metadata 序列化后的 UTF-8 byte quota 判定纯策略已抽至
`src/main/browser-page-preload/annotation-byte-quota-policy.ts`；control payload adapter 仅保留
schema 清洗与 JSON 编排。新增 `scripts/test-preload-annotation-byte-quota-policy.mjs` 覆盖 3 项
ASCII、中文边界与超额断言；原 annotation runtime 回归 45 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation hit name 的 trim 非空、长度与安全文本约束纯策略已抽至
`src/main/browser-page-preload/annotation-name-policy.ts`；control payload adapter 仅保留 clone、
schema 清洗与 response 编排。新增 `scripts/test-preload-annotation-name-policy.mjs` 覆盖 3 项合法、
空白与控制字符断言；原 annotation runtime 回归 45 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation hit id 的非空、长度与安全文本约束纯策略已抽至
`src/main/browser-page-preload/annotation-id-policy.ts`；control payload adapter 仅保留 clone、
schema 清洗与 response 编排。新增 `scripts/test-preload-annotation-id-policy.mjs` 覆盖 4 项合法、
空值、超长与控制字符断言；原 annotation runtime 回归 45 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation metadata value 的 null/boolean/finite-number/safe-string
约束纯策略已抽至 `src/main/browser-page-preload/annotation-metadata-value-policy.ts`；control payload
adapter 仅保留 clone、key/schema 清洗与 response 编排。新增
`scripts/test-preload-annotation-metadata-value-policy.mjs` 覆盖 5 项合法值、长度与控制字符断言；
原 annotation runtime 回归 45 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation hit 矩形的 finite/positive 几何校验纯策略已抽至
`src/main/browser-page-preload/annotation-rect-policy.ts`；control payload adapter 仅保留 clone、
schema 清洗与 response 编排。新增 `scripts/test-preload-annotation-rect-policy.mjs` 覆盖 3 项合法、
零宽与 NaN 坐标断言；原 annotation runtime 回归 45 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation payload 的 role 长度与动态 pattern 校验纯策略已抽至
`src/main/browser-page-preload/annotation-role-policy.ts`；control payload adapter 仅保留 schema
清洗与 response 编排。新增 `scripts/test-preload-annotation-role-policy.mjs` 覆盖 3 项合法、超长与
pattern 拒绝断言；原 annotation runtime 回归 45 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation payload 的 metadata key 格式约束纯策略已抽至
`src/main/browser-page-preload/annotation-metadata-key-policy.ts`；control payload adapter 仅保留
schema 清洗与 response 编排。新增 `scripts/test-preload-annotation-metadata-key-policy.mjs` 覆盖 3 项
合法 key、带空格 key 与非法标点断言；原 annotation runtime 回归 45 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation payload 的控制字符/格式字符安全文本判定纯策略已抽至
`src/main/browser-page-preload/annotation-safe-text-policy.ts`；control payload adapter 仅保留
schema 清洗与 response 编排。新增 `scripts/test-preload-annotation-safe-text-policy.mjs` 覆盖 3 项
普通文本、Unicode 文本与控制字符断言；原 annotation runtime 回归 45 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation controls 的 JSON serialization、function/symbol/bigint
拒绝与 UTF-8 byte quota 纯策略已抽至 `src/main/browser-page-preload/annotation-controls-serialization-policy.ts`；
control payload adapter 仅保留 schema 清洗与 response 编排。新增
`scripts/test-preload-annotation-controls-serialization-policy.mjs` 覆盖 2 项数据序列化/不安全值断言；
原 annotation runtime 回归 45 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation control metadata 的 own-descriptor、key/类型/长度限制
纯策略已抽至 `src/main/browser-page-preload/annotation-control-metadata-policy.ts`；control payload
adapter 仅保留 hit/response/serialization 编排。新增
`scripts/test-preload-annotation-control-metadata-policy.mjs` 覆盖 3 项有效/长度/undefined 值断言；
原 annotation runtime 回归 45 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation payload 的 plain own-data record clone 与 prototype/key
安全门禁已抽至 `src/main/browser-page-preload/annotation-record-clone-policy.ts`；control payload
adapter 仅保留 hit/metadata schema 清洗与 serialization。新增
`scripts/test-preload-annotation-record-clone-policy.mjs` 覆盖 3 项复制、key quota 与危险 key
断言；原 annotation runtime 回归 45 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation surface response envelope 的 type/registration/custom-rendering
投影已抽至 `src/main/browser-page-preload/annotation-response-envelope-policy.ts`；control payload
adapter 仅保留 hit/metadata 清洗与 serialization。新增
`scripts/test-preload-annotation-response-envelope-policy.mjs` 覆盖 1 项默认 envelope 断言；
原 annotation runtime 回归 45 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation surface hit-test request 的 type/requestId/finite-point
校验纯策略已抽至 `src/main/browser-page-preload/annotation-hit-test-request-policy.ts`；control
payload adapter 仅保留序列化、metadata/hit 清洗与 response envelope。新增
`scripts/test-preload-annotation-hit-test-request-policy.mjs` 覆盖 3 项有效/空 ID/非有限坐标断言；
原 annotation runtime 回归 45 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation surface protocol 的 response discriminant 列表已抽至
`src/main/browser-page-preload/annotation-protocol-response-policy.ts`；protocol builder 仅保留
schema shape 组装。新增 `scripts/test-preload-annotation-protocol-response-policy.mjs` 覆盖 1 项
稳定 response-type 列表断言；原 protocol 回归 6 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation surface protocol 的 IPC channel、deadline、payload/ID
limits 与 role pattern 常量已抽至 `src/main/browser-page-preload/annotation-protocol-channels.ts`；
protocol builder 仅保留 schema shape 构造。新增 `scripts/test-preload-annotation-protocol-channels.mjs`
覆盖 3 项 channel/limit/metadata 投影断言；原 protocol 回归 6 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation mode toggle 的 destroyed/capability/agent-control/user-activation
资格门禁已抽至 `src/main/browser-page-preload/annotation-mode-toggle-eligibility.ts`；command policy
仅保留 envelope 投影与 clear-request 判定。新增
`scripts/test-preload-annotation-mode-toggle-eligibility.mjs` 覆盖 3 项允许/销毁/无用户激活断言；
原 mode-controller 回归 5 项、build 与 typecheck 已通过。

2026-10-05 T2/A2 继续批次：annotation host message 的 forwarded 类型集合与判定纯策略已抽至
`src/main/browser-page-preload/annotation-forwarded-message-policy.ts`；routing adapter 仅保留
mounted/pre-mount action 选择。新增 `scripts/test-preload-annotation-forwarded-message-policy.mjs`
覆盖 2 项 forward/ignore 断言；原 host-message routing 回归 34 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation host message 的 queued-editor 类型集合与判定纯策略已抽至
`src/main/browser-page-preload/annotation-message-queue-policy.ts`；routing adapter 仅保留
mounted/pre-mount action 选择。新增 `scripts/test-preload-annotation-message-queue-policy.mjs`
覆盖 2 项 queue/非-queue 类型断言；原 host-message routing 回归 34 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation event detail 的 own data-property 读取策略已抽至
`src/main/browser-page-preload/annotation-event-field-policy.ts`；event-details adapter 仅保留
CustomEvent/detail 形状判定与 payload 构造。新增 `scripts/test-preload-annotation-event-field-policy.mjs`
覆盖 2 项 own/inherited property 断言；原 event-details 回归 6 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation target label 的 tag/accessibility 文案投影已抽至
`src/main/browser-page-preload/annotation-target-label-policy.ts`；label adapter 仅保留
DOM 元素与 accessible-label 依赖编排。新增 `scripts/test-preload-annotation-target-label-policy.mjs`
覆盖 2 项有/无 accessible label 断言；原 target-label 回归 3 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation theme 的 prefers-color-scheme 纯投影已抽至
`src/main/browser-page-preload/annotation-theme-policy.ts`；theme adapter 仅保留窗口媒体查询
依赖编排。新增 `scripts/test-preload-annotation-theme-policy.mjs` 覆盖 3 项 dark/light/fallback
断言；原 theme 回归 3 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation viewport override 的尺寸合并纯策略已抽至
`src/main/browser-page-preload/annotation-viewport-merge-policy.ts`；override adapter 仅保留
泛型输入与可选 viewport 编排。新增 `scripts/test-preload-annotation-viewport-merge-policy.mjs`
覆盖 2 项空 override/覆盖尺寸断言；原 viewport-override 回归 3 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation wheel delta 的 line/page/default 单位换算纯策略已抽至
`src/main/browser-page-preload/annotation-wheel-delta-policy.ts`；wheel adapter 仅保留事件输入
与 viewport 依赖编排。新增 `scripts/test-preload-annotation-wheel-delta-policy.mjs` 覆盖 2 项
line/page 单位断言；原 wheel-delta 回归 3 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation visible-text 的片段拼接与长度截断纯策略已抽至
`src/main/browser-page-preload/annotation-visible-text-policy.ts`；collector 仅保留 TreeWalker、
可见性与 range 相交副作用。新增 `scripts/test-preload-annotation-visible-text-policy.mjs`
覆盖 2 项首片段/拼接截断断言；原 visible-text 回归 3 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git host handoff transfer 的 copied rollout path 安全边界校验已迁移至 `src/main/worker/git-handoff-transfer-policy.ts`；transfer runtime 保留 host path/codexHome、read/write 与 cleanup I/O 编排。新增 `scripts/test-worker-git-handoff-transfer-policy.mjs` 覆盖 4 项 focused assertions；原 transfer 回归 19 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation containment 的跨 frame ancestor 解析纯策略已抽至
`src/main/browser-page-preload/annotation-containment-frame-policy.ts`；containment policy 仅保留
parent/position/containment 门禁编排。新增 `scripts/test-preload-annotation-containment-frame-policy.mjs`
覆盖 2 项有效/缺失 frame 断言；原 containment 回归 5 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：managed worktree discovery 的 legacy/named parent-child 命名模式与 marker 常量已迁移至 `src/main/worker/git-managed-worktree-discovery-policy.ts`；discovery runtime 保留 filesystem stat/readDirectory、path normalization 与 Git metadata 编排。新增 `scripts/test-worker-git-managed-worktree-discovery-policy.mjs` 覆盖 8 项 focused assertions；原 discovery 回归 52 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation frame stability 的 parent-frame chain 纯判定已抽至
`src/main/browser-page-preload/annotation-frame-chain-policy.ts`；frame stability 仅保留首层
annotation-element 解析与 chain policy 编排。新增 `scripts/test-preload-annotation-frame-chain-policy.mjs`
覆盖 2 项稳定/断裂链路断言；原 frame-stability 回归 5 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git submodule path discovery 的 `.gitmodules` config 输出解析、路径归一化与去重已迁移至 `src/main/worker/git-submodule-paths-policy.ts`；submodule runtime 保留 stat/abort、Git config I/O、query/cache 编排。新增 `scripts/test-worker-git-submodule-paths-policy.mjs` 覆盖 3 项 focused assertions；原 submodule 回归 15 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git repository identity 的 remote URL port 归一化与 repository full-name 投影已迁移至 `src/main/worker/git-repository-identity-policy.ts`；identity runtime 保留 origin query/cache、remote parsing 与 worktree ID I/O 编排。新增 `scripts/test-worker-git-repository-identity-policy.mjs` 覆盖 4 项 focused assertions；原 identity 回归 28 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation frame pointer guard 的 saved pointer-style 快照与 observed
root 集合已抽至 `src/main/browser-page-preload/annotation-frame-pointer-guard-state.ts`；guard 仅
保留跨 frame 安装、样式副作用与 MutationObserver 编排。新增
`scripts/test-preload-annotation-frame-pointer-guard-state.mjs` 覆盖 5 项状态断言；原 guard
回归 13 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git thread config 的 JSON/schema 解析与失败分类已迁移至 `src/main/worker/git-thread-config-policy.ts`；thread-config runtime 保留 config file discovery、host 文件 I/O、schema warning 与写入编排。新增 `scripts/test-worker-git-thread-config-policy.mjs` 覆盖 3 项 focused assertions；原 thread-config 回归 11 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git safe attribute filter 的 filter driver 解析、基础 attribute overrides 与安全清理 override 构造已迁移至 `src/main/worker/git-safe-attribute-filters-policy.ts`；safe-filter runtime 保留 query/cache、Git config I/O、generation invalidation 与 signal 编排。新增 `scripts/test-worker-git-safe-attribute-filters-policy.mjs` 覆盖 5 项 focused assertions；原 safe-filter 回归 18 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation display selections 的稳定 selection-key 投影已抽至
`src/main/browser-page-preload/annotation-selection-display-key.ts`；display projector 仅保留
resolve/clip/class 与 source-index 编排。新增 `scripts/test-preload-annotation-selection-display-key.mjs`
覆盖 2 项 element/region key 断言；原 display-selections 回归 7 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git stable metadata request 的 Git-init watcher ensure/dispose/none 动作判定已迁移至 `src/main/worker/git-stable-metadata-policy.ts`；request handler 保留 stable metadata I/O、watcher side effects 与 result encoding。新增 `scripts/test-worker-git-stable-metadata-policy.mjs` 覆盖 6 项 focused assertions；原 request-handler 回归 3 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation marker view 的共享非 element anchor 基础投影已抽至
`src/main/browser-page-preload/annotation-marker-base-projection.ts`；marker view-state 仅保留
text/region/virtual 分支与 element 刷新编排。新增 `scripts/test-preload-annotation-marker-base-projection.mjs`
覆盖 3 项 theme/viewport/additional-anchor 断言；原 marker view-state 回归 12 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation display anchors 的 text-anchor 展示投影已抽至
`src/main/browser-page-preload/annotation-text-display-projection.ts`；display resolver 仅保留
element/region anchor 解析与 cache/viewport 编排。新增
`scripts/test-preload-annotation-text-display-projection.mjs` 覆盖 2 项默认/替换 anchor 断言；
原 display-anchors 回归 5 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git handoff shared-base 的 destination fetch target 选择已迁移至 `src/main/worker/git-handoff-shared-base-policy.ts`；shared-base runtime 保留 commit existence、merge-base、fetch Git I/O 与日志编排。新增 `scripts/test-worker-git-handoff-shared-base-policy.mjs` 覆盖 3 项 focused assertions；原 shared-base 回归 27 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation viewport 的 visualViewport offset/scale 纯投影已抽至
`src/main/browser-page-preload/annotation-visual-viewport-policy.ts`；viewport state 仅保留窗口
尺寸/scroll 编排与可选投影。新增 `scripts/test-preload-annotation-visual-viewport-policy.mjs`
覆盖 3 项默认/非默认输入断言；原 viewport-state 回归 3 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git handoff rollback 的 branch/stash restore 错误聚合策略已迁移至 `src/main/worker/git-handoff-rollback-policy.ts`；rollback runtime 保留 checkout/stash/remove worktree 副作用与异常吞吐。新增 `scripts/test-worker-git-handoff-rollback-policy.mjs` 覆盖 4 项 focused assertions；原 rollback 回归 19 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git handoff destination 的当前分支/default branch/可 detach clean commit 到 checkout target 的纯策略已迁移至 `src/main/worker/git-handoff-destination-policy.ts`；destination runtime 保留 repository cache invalidation、status/head 查询与 checkout I/O 编排。新增 `scripts/test-worker-git-handoff-destination-policy.mjs` 覆盖 4 项 focused assertions；原 destination 回归 19 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation page identity 的 throwing-safe URL parser 已抽至
`src/main/browser-page-preload/annotation-url-parser-policy.ts`；URL equivalence policy 仅保留
协议/路径/查询投影。新增 `scripts/test-preload-annotation-url-parser-policy.mjs` 覆盖 3 项有效、
无效与非字符串输入断言；原 URL 回归 8 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git branch metadata 的 `refs/heads/` 本地分支引用剥离与 branch normalizer 接口已迁移至 `src/main/worker/git-branch-metadata-policy.ts`；metadata runtime 保留 repository、snapshot 与 default-remote 查询编排。新增 `scripts/test-worker-git-branch-metadata-policy.mjs` 覆盖 3 项 focused assertions；原 branch-metadata 回归 27 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation anchor 的 document-kind/page-url 识别纯策略已抽至
`src/main/browser-page-preload/annotation-document-kind-policy.ts`；anchor viewport policy 仅保留
当前页面与尺寸门禁编排。新增 `scripts/test-preload-annotation-document-kind-policy.mjs`
覆盖 3 项 Google Docs/URL/无效输入断言；原 anchor viewport policy 回归 7 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation preview visibility 的 ancestor walk 纯投影已抽至
`src/main/browser-page-preload/annotation-ancestor-policy.ts`；visibility predicate 仅保留
document/frame 与 popover 边界编排。新增 `scripts/test-preload-annotation-ancestor-policy.mjs`
覆盖 3 项自身/后代/反向关系断言；原 preview visibility 回归 3 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git config mutation 的 refresh-root 判定已迁移至 `src/main/worker/git-config-request-policy.ts`；config request handler 保留 repository/config I/O 与 mutation 编排。新增 `scripts/test-worker-git-config-request-policy.mjs` 覆盖 4 项 focused assertions；原 config handler 回归 5 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git push 的 porcelain status line 解析与 failure 分类已迁移至 `src/main/worker/git-push-policy.ts`；push request handler 保留 remote discovery、参数拼装、Git I/O 与 exec output 编排。新增 `scripts/test-worker-git-push-policy.mjs` 覆盖 9 项 focused assertions；原 push handler 回归 17 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation preview visibility 的 top-modal 边界投影已抽至
`src/main/browser-page-preload/annotation-modal-boundary-policy.ts`；visibility predicate 仅保留
document/frame boundary 与 popover 几何判定。新增 `scripts/test-preload-annotation-modal-boundary-policy.mjs`
覆盖 3 项 modal focus/单项/空输入断言；原 preview visibility 回归 3 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git branch create 的 local branch 名称归一化与 ref namespace 校验已迁移至 `src/main/worker/git-branch-create-policy.ts`；branch-create runtime 保留 branchExists、Git branch/switch、synced config 与错误编排。新增 `scripts/test-worker-git-branch-create-policy.mjs` 覆盖 5 项 focused assertions；原 branch-create 回归 62 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git review commit queries 的 commit/numstat 输出解析与 commits/output size limits 已迁移至 `src/main/worker/git-review-commit-queries-policy.ts`；query runtime 保留 comparison、query/cache、Git I/O 与 signal 编排，并兼容既有 parser dependency 形态。新增 `scripts/test-worker-git-review-commit-queries-policy.mjs` 覆盖 6 项 focused assertions；原 commit-query 回归 36 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation pointer selection 的 active drag 与 terminal 状态已抽至
`src/main/browser-page-preload/annotation-pointer-selection-state.ts`；pointer coordinator 仅保留
命中/选择和高亮副作用，dispose 后迟到 pointer 事件继续被拒绝。新增
`scripts/test-preload-annotation-pointer-selection-state.mjs` 覆盖 6 项状态断言；原 pointer
selection 回归 18 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation preload message queue 的 mounted/destroyed 生命周期与
sync/text/editor 缓冲状态已抽至 `src/main/browser-page-preload/annotation-preload-message-queue-state.ts`；
queue 仅保留消息合并、消费顺序与重放副作用。新增
`scripts/test-preload-annotation-preload-message-queue-state.mjs` 覆盖 10 项状态断言；原 queue
回归 8 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git review patch 的 unknown/error/success response projection 已迁移至 `src/main/worker/git-review-patch-policy.ts`；patch runtime 保留 comparison、query/cache、untracked collection 与 snapshot 编排。新增 `scripts/test-worker-git-review-patch-policy.mjs` 覆盖 3 项 focused assertions；原 patch 回归 33 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git review file diff 的未跟踪 symlink/submodule unified-diff 格式化已迁移至 `src/main/worker/git-review-file-diff-policy.ts`；file-diff runtime 保留 stat/process/Git I/O、snapshot 与 query 编排。新增 `scripts/test-worker-git-review-file-diff-policy.mjs` 覆盖 5 项 focused assertions；原 file-diff 回归 33 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation control handle 的 terminal disposed 状态已抽至
`src/main/browser-page-preload/annotation-control-handle-state.ts`；handle 仅保留 payload
校验/emit 副作用，重复 dispose 与销毁后 update 均受状态门禁。新增
`scripts/test-preload-annotation-control-handle-state.mjs` 覆盖 4 项状态断言；原 handle 回归
8 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git review metadata finalize 的 untracked file/raw entry/stat projection 已迁移至 `src/main/worker/git-review-metadata-finalize-policy.ts`；finalize runtime 保留 working-tree metadata 查询、dedupe、revision attach 与排序编排。新增 `scripts/test-worker-git-review-metadata-finalize-policy.mjs` 覆盖 2 项 focused assertions；原 finalize 回归 25 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation mode controller 的 active/disposed 状态已抽至
`src/main/browser-page-preload/annotation-mode-controller-state.ts`；controller 仅保留主世界
listener、controls 注册与记录副作用，dispose 后迟到事件和重复 dispose 均被状态门禁。新增
`scripts/test-preload-annotation-mode-controller-state.mjs` 覆盖 7 项状态断言；原 mode-controller
回归 5 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation permission controller 的单飞 pending request 与 terminal
状态已抽至 `src/main/browser-page-preload/annotation-permission-request-state.ts`；controller 仅保留
权限请求/结果副作用，reset/dispose 仍会解析在途请求为 false 并拒绝迟到结果。新增
`scripts/test-preload-annotation-permission-request-state.mjs` 覆盖 8 项状态断言；原 permission
controller 回归 18 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git review patch sections 的默认 byte/concurrency limits、section 非空归一化与 limit 投影已迁移至 `src/main/worker/git-review-patch-sections-policy.ts`；patch sections runtime 保留并发读取、顺序 flush、大小限制与错误编排。新增 `scripts/test-worker-git-review-patch-sections-policy.mjs` 覆盖 5 项 focused assertions；原 patch-sections 回归 15 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git review metadata 的 untracked path 选择、omitted-file 投影与 metadata merge 纯策略已迁移至 `src/main/worker/git-review-metadata-policy.ts`；metadata utils 保留 diff 解析、rename/revision 与异步 I/O 编排。新增 `scripts/test-worker-git-review-metadata-policy.mjs` 覆盖 5 项 focused assertions；原 metadata-utils 回归 37 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation preview controller 的 mounted-preview disposer 与 terminal
状态已抽至 `src/main/browser-page-preload/annotation-preview-controller-state.ts`；controller 仅保留
预览替换和 disposer 副作用，销毁时仍先释放当前 preview 并拒绝后续挂载。新增
`scripts/test-preload-annotation-preview-controller-state.mjs` 覆盖 6 项状态断言；原 controller
回归 6 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git review branch stats 的 repository operation marker 与 git-dir 路径构造策略已迁移至 `src/main/worker/git-review-branch-stats-policy.ts`；review stats 运行时保留 stat/Git metadata、diff 与 rename reconcile 编排。新增 `scripts/test-worker-git-review-branch-stats-policy.mjs` 覆盖 4 项 focused assertions；原 branch-stats 回归 33 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git path status 的 porcelain 输出分类（tracked/untracked/ignored）已迁移至 `src/main/worker/git-path-status-policy.ts`；path-status 运行时保留 Git I/O、query/cache 与 repository 编排。新增 `scripts/test-worker-git-path-status-policy.mjs` 覆盖 3 项 focused assertions；原 path-status 回归 31 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git origin discovery 的候选目录去重与本地平台/path API 资格判定已迁移至 `src/main/worker/git-origin-discovery-policy.ts`；origin discovery 运行时保留 stat、Git metadata、origin 查询与失败告警编排。新增 `scripts/test-worker-git-origin-discovery-policy.mjs` 覆盖 8 项 focused assertions；原 origin-discovery 回归 11 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git current-branch 的 HEAD/symbolic-HEAD 响应到 branch/detached/unknown 状态投影已迁移至 `src/main/worker/git-current-branch-policy.ts`；运行时保留 generation 重试、缓存失效与 Git I/O，并保持有效 HEAD 时不触发 symbolic 查询。新增 `scripts/test-worker-git-current-branch-policy.mjs` 覆盖 5 项 focused assertions；原 current-branch 回归 26 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git ref resolution 的 object-id 校验与 stdout 归一化已迁移至 `src/main/worker/git-ref-resolution-policy.ts`；ref query 入口保留缓存、Git I/O 与 SHA normalizer 编排。新增 `scripts/test-worker-git-ref-resolution-policy.mjs` 覆盖 11 项 focused assertions；原 ref-resolution 回归 20 项与 build 已通过。typecheck 受并行 annotation-surface-observer 未提交改动中的 `disposed` 标识错误阻塞，已告知主代理。

2026-10-05 A1 继续批次：Git nearest-ancestor branch 的候选分支归一化与最短 ancestor 选择策略已迁移至 `src/main/worker/git-nearest-ancestor-branch-policy.ts`；运行时仅保留 compare-ahead 并发查询与 I/O 编排。新增 `scripts/test-worker-git-nearest-ancestor-branch-policy.mjs` 覆盖 5 项 focused assertions；原 nearest-ancestor 回归 10 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git recent branches 的 limit 归一化、Git 输出分支名投影与查询参数构造已迁移至 `src/main/worker/git-recent-branches-policy.ts`；运行时保留 query/cache/Git I/O 与 live-generation 清理编排。新增 `scripts/test-worker-git-recent-branches-policy.mjs` 覆盖 8 项 focused assertions；原 recent-branches 回归 26 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation preload disposal 的 transient/terminal 生命周期状态已抽至
`src/main/browser-page-preload/annotation-preload-disposal-state.ts`；普通能力切换仍可重复执行
feature dispose → preview clear → capability reset，而 pagehide 使用 terminal dispose 单向终止并
忽略迟到 teardown。新增 `scripts/test-preload-annotation-preload-disposal-state.mjs` 覆盖 7 项
状态断言；原 disposal focused test 扩展至 10 项，build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation comment-runtime 异步挂载的 `mountStarted`、pending preview、
mounted runtime 与 destroyed 终态已抽至 `src/main/browser-page-preload/annotation-runtime-mount-state.ts`；
mount coordinator 仅保留动态加载、preview 交接和 runtime dispose 副作用，加载失败仍可重试而
pagehide 后不可重挂载。新增 `scripts/test-preload-annotation-runtime-mount-state.mjs` 覆盖 10 项
状态断言；原 runtime-mount 回归 9 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation feature graph 的 controls registry、site request queue、
feature observer 与 mode-controller disposer 引用状态已抽至
`src/main/browser-page-preload/annotation-feature-graph-state.ts`；feature lifecycle 仅保留
generation 初始化、刷新销毁顺序与副作用编排。新增
`scripts/test-preload-annotation-feature-graph-state.mjs` 覆盖引用写入、读取与 clear 共 9 项
断言；原 feature-lifecycle 回归 15 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation surface observer 的 metadata-requested 与 terminal dispose
状态已抽至 `src/main/browser-page-preload/annotation-surface-observer-state.ts`；observer 仅保留
DOM/ShadowRoot 扫描、feature reconciliation 与 listener 副作用，重复 metadata 请求与迟到
pagehide 回调均受状态门禁。新增 `scripts/test-preload-annotation-surface-observer-state.mjs`
覆盖 9 项状态断言；原 observer 回归 14 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation overlay mutation observer 的 terminal dispose gate 已抽至
`src/main/browser-page-preload/annotation-overlay-observer-state.ts`；observer 仅保留 mutation
过滤与 disconnect 副作用，重复 teardown 与迟到 mutation callback 均被终态拒绝。新增
`scripts/test-preload-annotation-overlay-observer-state.mjs` 覆盖 4 项状态断言；原 observer
回归 9 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation shadow-root observer 的 roots 集合与 terminal dispose 状态
已抽至 `src/main/browser-page-preload/annotation-shadow-root-observer-state.ts`；observer 仅保留
MutationObserver/attachShadow 扫描副作用，销毁后迟到回调不会重新观察 shadow root 或触发变更。
新增 `scripts/test-preload-annotation-shadow-root-observer-state.mjs` 覆盖 10 项状态断言；原
observer 回归 4 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation preview scheduler 的 candidate/visible 集合、RAF handle 与
terminal dispose 状态已抽至 `src/main/browser-page-preload/annotation-preview-scheduler-state.ts`；
scheduler 仅保留 Resize/IntersectionObserver 与 RAF 副作用，销毁时仍取消在途 frame。新增
`scripts/test-preload-annotation-preview-scheduler-state.mjs` 覆盖 8 项状态断言；原 scheduler
回归 5 项、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation preview layer 的节点缓存、serialized snapshot 与 terminal
dispose 状态已抽至 `src/main/browser-page-preload/annotation-preview-layer-state.ts`；layer 仅保留
SVG/DOM 节点创建、几何投影与副作用清理。新增 `scripts/test-preload-annotation-preview-layer-state.mjs`
覆盖 7 项状态断言；原 layer 回归 10 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：live-query performance operation 的方法白名单与结果映射已迁移至
`src/main/worker/git-performance-operation-policy.ts`；observability runtime 仅保留性能结果字段、
失败原因与采样编排。新增 `scripts/test-worker-git-performance-operation-policy.mjs` 覆盖 6 项
focused assertions；build、typecheck 与现有 observability 回归 99 项已通过。

2026-10-05 A1 继续批次：review working-tree metadata 的有界异步 worker 调度与首个失败
传播已迁移至 `src/main/worker/git-review-working-tree-worker-policy.ts`；metadata runtime
仅保留不同工作负载的并发上限与错误消息，新增 `scripts/test-worker-git-review-working-tree-worker-policy.mjs`
覆盖顺序消费、并发上限与 cause 传播共 3 项 focused assertions。focused metadata 回归 55 项、build、verify 与 typecheck 已通过。

2026-10-05 A1 继续批次：live-query worker 的 recent-branches 分页上限已迁移至
`src/main/worker/git-live-query-limit-policy.ts`；handler 仅保留查询编排与 watcher 读取，
新增 `scripts/test-worker-git-live-query-limit-policy.mjs` 覆盖默认值、上下界与正常值共 6 项
focused assertions。focused handler/policy tests、verify 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git ignore-source watch 的路径集合相等判定与变更后重启门禁已迁移至
`src/main/worker/git-ignore-source-watch-policy.ts`；runtime 仅保留 watcher 注册、会话销毁/启动
与异步副作用编排。新增 `scripts/test-worker-git-ignore-source-watch-policy.mjs` 覆盖 6 项 focused
assertions；focused test、verify 与 typecheck 已通过。

2026-10-05 A5 继续批次：app-primary 未消费导出 `ig`（`tO`，4279--4288）的云执行不可用原因
纯策略已迁移至 `src/renderer/app-primary/runtime/derive-cloud-unavailable-reason.ts`，hotkey
home-page 语义源码改为直接消费；新增 `scripts/test-app-primary-derive-cloud-unavailable-reason.mjs`
覆盖 remote project、pull request、context、account 与可用云共 5 项断言。逐行分类证据登记后
app-primary reviewedCount 提升至 213；hub audit 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation pointer-selection 的拖拽终止生命周期已补齐；公开
`dispose` 现为幂等终态，销毁后拒绝 pointer down/move/up/cancel 与 selection 更新，内部重启拖拽仍使用临时清理。
`scripts/test-preload-annotation-pointer-selection.mjs` 扩展至 18 项 focused assertions；build check、
focused test 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation surface registry 的注册表、probe 去重、hit-test request
计数、pending hit 与终止态已抽至 `src/main/browser-page-preload/annotation-surface-registry-state.ts`；
registry 入口仅保留 DOM/MutationObserver、请求响应与几何副作用，销毁后迟到响应与新请求均被状态门禁。
新增 `scripts/test-preload-annotation-surface-registry-state.mjs` 覆盖 16 项 focused assertions；
surface registry 回归通过，typecheck 通过；build check 仍受现有 `git-branch-search.ts` 的
`Unexpected "*"` 预存错误阻塞。

2026-10-05 A1 继续批次：Git branch search 的纯策略边界已进一步拆至
`src/main/worker/git-branch-search-policy.ts`；branch-search 兼容入口仅保留策略转出，runtime
继续负责 Git I/O、流式扫描与 query 编排。新增 `scripts/test-worker-git-branch-search-policy.mjs`
覆盖 15 项 focused assertions；build 与 typecheck 已通过。

2026-10-05 A5 继续批次：app-primary 生成运行时初始化边界 `Ds`/`Ea`/`Bi`/`Dn`
（`ZK`/`OQ`/`G1`/`j6`，37715--37738、58890--58898、74300--74307、93984--93996）完成逐行分类；
均为相邻 voice-command、composer style、browser-mode 与 review runtime 的 lazy bootstrap，
无独立 renderer named consumer 或 teardown owner，登记为 generated-local。`docs/renderer-hub-line-classification.json`
app-primary reviewedCount 提升至 211；hub audit 与 focused classification test 已通过。

2026-10-05 A2 继续批次：annotation controls registry 的记录表、弱引用 target 索引、总 target
配额与终止态已抽至 `src/main/browser-page-preload/annotation-controls-registry-state.ts`；registry
入口仅保留 DOM 事件、payload 解析与副作用适配，销毁后迟到的 register/update/remove 均被拒绝。
新增 `scripts/test-preload-annotation-controls-registry-state.mjs` 覆盖 20 项 focused assertions；
annotation registry 回归、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git synced-branch state 的 `--numstat` 输出解析与空 diff 统计
已迁移至 `src/main/worker/git-synced-branch-state-policy.ts`；state runtime 仅保留 query、Git I/O、
worktree 快照与 diff 编排。新增 `scripts/test-worker-git-synced-branch-state-policy.mjs` 覆盖 6 项
focused assertions，并保留原 synced-branch-state 回归覆盖。

2026-10-05 A5 继续批次：app-primary 账户额度提示区未消费导出 `Pm`（`CA`，6490--6498）已抽取为 `account-spend-key.ts`，明确账户/额度/重置时间投影及空值边界；新增 `scripts/test-app-primary-account-spend-key.mjs` 覆盖 4 项 focused assertions。逐行分类证据登记后 reviewedCount 提升至 207；hub audit、focused classification 与策略测试已通过。

2026-10-05 A2 继续批次：annotation site-request 的 pending/page-hidden/disposed 状态边界已抽至
`src/main/browser-page-preload/annotation-site-request-state.ts`；`annotation-site-requests` 仅保留
事件、权限与 subscriber 编排，并明确销毁后 `subscribe` 的 no-op unsubscribe 与迟到回调门禁。
新增 `scripts/test-preload-annotation-site-request-state.mjs` 覆盖 23 项 focused assertions；build、
focused tests 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git config scope 的 local/worktree flag 映射、缺失值兼容判定与错误消息格式化纯策略已迁移至 `src/main/worker/git-config-scope-policy.ts`；`git-config-scope.ts` 仅保留 Git/query 编排与 worktreeConfig 自动启用重试。新增 `scripts/test-worker-git-config-scope-policy.mjs` 覆盖 6 项 focused assertions；原 49 项 config-scope 回归、build 与 typecheck 已通过。

2026-10-05 A5 继续批次：app-primary selection overlay 未消费导出 `Pr`/`r`（`Z3`/`$3`，91668--91680）完成逐行分类；`Z3` 为相邻 overlay 的 DOMRect 交集纯辅助，`$3` 为 overflow-style 依赖与允许集合初始化，均无独立 renderer named consumer 或 teardown owner，登记为 generated-local。`docs/renderer-hub-line-classification.json` app-primary reviewedCount 提升至 201（总记录 202）；hub audit 与 focused classification test 已通过。

2026-10-05 A2 继续批次：annotation mode controller 的终止生命周期边界已补齐；dispose 现在
幂等，首次销毁后会关闭主世界 listener 与 controls，迟到事件以及重复 dispose 均不会再次驱动
状态或释放副作用。`scripts/test-preload-annotation-mode-controller.mjs` 新增重复 dispose
focused assertion；build、verify 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git repository size 的 `count-objects` 解析、字节数计算、可读格式化与
超限错误消息纯策略已迁移至 `src/main/worker/git-repository-size-policy.ts`；运行时保留缓存、Git
I/O 与仓库读取编排。新增 `scripts/test-worker-git-repository-size-policy.mjs` 覆盖 6 项 focused
assertions；原 25 项 repository-size 回归、build 与 typecheck 已通过。

2026-10-05 A5 继续批次：app-primary 邮件撰写生成区未消费导出 `Rd`/`zd`/`Md`/`Nd`/`Ld`/`Ud`
（`RMe`/`zMe`/`VMe`/`HMe`/`WMe`/`qMe`，17397--17529）完成逐行分类；这些纯投影/格式化辅助函数
均无独立 renderer named consumer 或 teardown owner，登记为 generated-local-helper。`docs/renderer-hub-line-classification.json`
记录数提升至 200（app-primary reviewedCount 199）；hub audit 与 focused classification test 已通过。

2026-10-05 A1 继续批次：Git blame porcelain 的作者登录名提取、提交元数据缓存与行记录投影
纯策略已迁移至 `src/main/worker/git-blame-file-policy.ts`；blame 运行时保留仓库路径、Git
查询、origin URL 与错误生命周期编排，并继续兼容导出解析 helper。新增
`scripts/test-worker-git-blame-file-policy.mjs` 覆盖 5 项 focused assertions；原 29 项
blame-file 回归、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git turn-diff capture 的 checkpoint/capture ref 命名、时间戳解析、TTL
过期判定与最新 checkpoint 选择已迁移至 `src/main/worker/git-turn-diff-capture-policy.ts`；capture
运行时保留 Git ref、diff 与 checkpoint 队列编排。新增
`scripts/test-worker-git-turn-diff-capture-policy.mjs` 覆盖 9 项 focused assertions；原 19 项
turn-diff capture 回归与 build、typecheck 已通过。

2026-10-05 A2 继续批次：annotation surface observer 的异步 teardown 边界已补齐；
`dispose` 后迟到的 MutationObserver、Shadow DOM attach 与 pageshow 回调现在均受终态门禁，
不会重新扫描 DOM 或广播 feature 状态。`scripts/test-preload-annotation-surface-observer.mjs`
扩展至 14 项 focused assertions；build、typecheck 与 focused test 已通过。

2026-10-05 A1 继续批次：Git remote branch discovery 的 remote HEAD/default branch 解析、remote
名称排序与 conventional fallback 纯策略已迁移至 `src/main/worker/git-remote-branches-policy.ts`；
运行时保留 query/Git I/O 与异步短路编排。新增 `scripts/test-worker-git-remote-branches-policy.mjs`
覆盖 10 项 focused assertions；原 44 项 remote-branches 回归、build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation permission controller 的终止生命周期边界已补齐；新增幂等
`dispose`，终态拒绝后续权限请求/结果回调并解析 pending 为 `false`，pagehide 终止路径接入
该 dispose，避免 preload runtime teardown 后异步权限请求再次驱动状态。`scripts/test-preload-annotation-permission-controller.mjs`
扩展至 18 项 focused assertions；build、typecheck 与 focused test 已通过。

2026-10-05 A5 继续批次：app-primary markdown 编辑器未消费导出 `Tu`（`TB`，21849--21856）已抽取为 `insert-selection-marker.ts`，明确安全位置解析、marker 序列化与失败边界；新增 `scripts/test-app-primary-create-editor-selection-range.mjs` 覆盖 ownerDocument 回退及 Range 投影。逐行分类证据登记后 reviewedCount 提升至 190；hub audit 与 focused classification 验证通过。

2026-10-05 A2 继续批次：annotation preload bridge 的 teardown 终止边界已补齐；新增幂等
`dispose`，pagehide 时解除 mounted host subscriber、清空 sync/text/editor pending buffer，
并拒绝销毁后的消息缓冲、订阅与 host invoke，避免异步回调在 preload runtime teardown 后继续
驱动状态。`scripts/test-preload-annotation-preload-bridge.mjs` 扩展至 22 项 focused assertions；
build、verify 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git status summary 的 porcelain `-z` 输出解析（staged/unstaged
计数、rename/copy 前序路径与未跟踪过滤）已迁移至
`src/main/worker/git-status-summary-policy.ts`；summary 运行时仅保留缓存、Git I/O 与
query 生命周期编排。新增 `scripts/test-worker-git-status-summary-policy.mjs` 覆盖 4 项
focused assertions；原 9 项 status-summary 回归继续验证完整生命周期。

2026-10-05 A2 继续批次：annotation preview layer 的 teardown 终止边界已补齐；`dispose`
现在幂等并将 layer 标记为终止态，迟到的 `update` 不再重建 clip/glow/mask 节点，避免
pagehide 或异步 preview 回调在 runtime teardown 后重新挂载 DOM。`scripts/test-preload-annotation-preview-layer.mjs`
扩展至 10 项 focused assertions；build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git local-environment 的环境解析/差异策略、shell wrapper 生成、平台脚本选择与标签判定已迁移至 `src/main/worker/git-local-environment-policy.ts`；运行时仅保留平台探测、文件/进程 I/O 与日志生命周期。新增 `scripts/test-worker-git-local-environment-policy.mjs` 覆盖 8 项 focused assertions；原 76 项 local-environment 回归继续通过，build 与 typecheck 已通过。

2026-10-05 A5 继续批次：app-primary 未消费导出 `aAe`/`Jm` 的 action displayability
纯策略已迁移至 `src/renderer/app-primary/runtime/is-displayable-action.ts`；新增
`scripts/test-app-primary-is-displayable-action.mjs` 覆盖 primary/secondary、问卷反馈排除、
缺省 action 与未知类型边界，共 5 项断言。逐行分类证据登记后 reviewedCount 提升至 189。

2026-10-05 A5 继续批次：逐行核对 app-primary markdown 编辑器相邻的三条生成边界：
`nPe`（公开别名 `wu`，21837--21842）selection 到 DOM Range 的投影、`EB`（公开别名
`Eu`，21893--21897）编辑器依赖 lazy bootstrap，以及 `OB`（公开别名 `xu`，21914--21918）
markdown parser bootstrap。三者均无独立 renderer named consumer 或 teardown owner，已登记
generated-local 分类；`docs/renderer-hub-line-classification.json` reviewedCount 提升至 188，
audit 与 focused hub classification 验证通过。

2026-10-05 A2 继续批次：annotation preview controller 的 teardown 终止边界已补齐；`dispose`
现在幂等并将 controller 标记为终止态，后续 `setPreview` 不再重新挂载，避免 pagehide/异步回调
在 runtime teardown 后残留预览。`scripts/test-preload-annotation-preview-controller.mjs` 扩展至
6 项 focused assertions；build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git review diff 的 fallback error、rename header 判定与多文件
diff 切片纯策略已迁移至 `src/main/worker/git-review-diff-policy.ts`；review diff 入口仅保留
Git 查询与文件编排，新增 `scripts/test-worker-git-review-diff-policy.mjs` 覆盖 4 项 focused
assertions；build 与 typecheck 已通过。

2026-10-05 A5 继续批次：逐行核对 app-primary markdown 编辑器附近的三条生成边界：
`oPe`（公开别名 `Cu`，21878--21892）magic-selection 文档切片与 marker offset、`sPe`
（公开别名 `Su`，21898--21900）Markdown 文件 stem 归一化、`cPe`（公开别名 `bu`，
21901--21912）浅层 heading 投影。三者均无独立 renderer named consumer 或 teardown owner，
已登记 generated-local 分类；`docs/renderer-hub-line-classification.json` reviewedCount
提升至 185，audit 与 focused hub classification 验证通过。

2026-10-05 A1 继续批次：Git apply-patch 的纯解析边界（patch 输出结果路径分类与 diff
路径提取）已迁移至 `src/main/worker/git-apply-patch-policy.ts`；apply 入口仅保留仓库、临时
index、Git I/O 与清理副作用，兼容导出继续接回。新增
`scripts/test-worker-git-apply-patch-policy.mjs` 覆盖 4 项 focused assertions；build 与
typecheck 已通过。

2026-10-05 A1 继续批次：Git review comparison 的 source→diff 参数判定、merge-base/default
branch 回退、commit parent 与 HEAD SHA 校验已迁移至
`src/main/worker/git-review-comparison-policy.ts`；入口保留仓库查询与 Git I/O 编排，新增
`scripts/test-worker-git-review-comparison-policy.mjs` 覆盖 8 项 focused assertions；build、verify、typecheck 已通过。

2026-10-05 A5 继续批次：逐行核对 app-primary 未消费区的三条生成边界：`r9e`（公开别名
`Ei`，78101--78113）模板 journey runtime，`yF`（公开别名 `Cf`，15649--15654）composer
lazy bootstrap，以及 `fk`（公开别名 `Dh`，5019--5025）homepage takeover portal/context
bootstrap。三者均无独立 renderer named consumer 或 teardown owner，已登记 generated-local
分类；`docs/renderer-hub-line-classification.json` reviewedCount 提升至 182，audit 与 focused
hub classification 验证通过。

2026-10-05 A2 继续批次：annotation design-control sync 的 teardown 生命周期边界已补齐；新增幂等 `dispose`，在销毁时恢复已应用的 control preview，并拒绝后续 target 绑定与同步，避免 runtime teardown 后残留设计预览。`scripts/test-preload-annotation-design-control-sync.mjs` 扩展至 11 项 focused assertions；build 与 typecheck 已通过。

2026-10-05 A2 继续批次：annotation comment-runtime 异步挂载失败后的生命周期边界已补齐；
`annotation-runtime-mount` 在动态加载失败且页面未销毁时重置单次挂载闸门，允许后续重试，
同时保持 pagehide/dispose 后的终态不可重挂载。`scripts/test-preload-annotation-runtime-mount.mjs`
新增 transient-load-failure retry focused assertions；build check 与 focused test 已通过。

2026-10-05 A1 继续批次：Git watcher acquire 的请求取消门禁与可复用 watcher
选择判定已迁移至 `src/main/worker/git-watch-acquire-policy.ts`；acquire 入口仅保留
watcher 引用计数、异步启动与 release 副作用，新增 `scripts/test-worker-git-watch-acquire-policy.mjs`
覆盖 6 项 focused assertions；typecheck 已通过。

2026-10-05 A2 继续批次：annotation overlay runtime 的 element-cache 生命周期边界已补齐；
新增幂等 `dispose` 清理所有 per-root cache，销毁后拒绝复用旧缓存，避免 mounted overlay
runtime teardown 后残留元素引用。`scripts/test-preload-annotation-overlay-runtime.mjs`
新增 dispose/reuse 回归，现覆盖 48 项 focused assertions；build check 与 focused test 已通过。

2026-10-05 A2 继续批次：annotation feature lifecycle 的 policy refresh 重入边界已补齐；
`initialize` 在同一 preload 生命周期内接收新 policy 时先完整 dispose 旧 controls registry、
site-annotation request queue、feature observer 与 mode controller，再创建新 generation，避免
跨 policy 的 listener/状态泄漏。`scripts/test-preload-annotation-feature-lifecycle.mjs`
新增 refresh/reinitialization 回归，共 15 项 focused assertions；已通过 build 与 typecheck。

2026-10-05 A1 继续批次：Git file content 的仓库越界判定与 `git show` object ref
构造已迁移至 `src/main/worker/git-file-content-policy.ts`；读取入口仅保留仓库、Git
与 MIME I/O 编排，新增 `scripts/test-worker-git-file-content-policy.mjs` 覆盖 8 项
POSIX/Windows 路径与 HEAD/index 边界断言。

2026-10-05 A1 继续批次：GitHub pull-request summary 的分页 GraphQL 查询构造已迁移至
`src/main/worker/github-pull-request-summary-policy.ts`；summary batcher 仅保留请求/分页编排，
新增 `scripts/test-worker-github-pull-request-summary-query.mjs` 覆盖多仓库、游标与 JSON 编码边界，
共 8 项 focused assertions；已通过 build、verify-chunks 与 typecheck。

2026-10-05 A2 继续批次：annotation preload runtime 的跨回调生命周期状态（destroyed、
permission、site-feature capability、active editor）已抽至
`src/main/browser-page-preload/annotation-preload-state.ts`；runtime 仅保留状态 wiring 与
feature/DOM 副作用。新增 `scripts/test-preload-annotation-preload-state.mjs` 覆盖默认值、
严格布尔归一化、snapshot 隔离和销毁复位，共 12 项 focused assertions。

2026-10-05 A2 继续批次：annotation preload policy 初始化的能力/控制/交互模式状态投影已抽至
`src/main/browser-page-preload/annotation-preload-policy-state.ts`；runtime 仅保留 feature
lifecycle 初始化与状态写回。新增 `scripts/test-preload-annotation-preload-policy-state.mjs`
覆盖 enabled/site-feature 能力门控、布尔归一化、comment/browse 模式及空输入边界。

最新增量：worker review section changes 的错误响应、gitlink SHA 提取与相对路径归一化判定已迁移至
`src/main/worker/git-review-section-policy.ts`；入口仅保留 Git I/O 与 patch 副作用编排，新增
`scripts/test-worker-git-review-section-policy.mjs` 覆盖 7 项 focused assertions。

最新增量：GitHub pull-request revision 的 contents 路径编码与 bounded base64/UTF-8
文本判定已迁移至 `src/main/worker/github-pull-request-revision-policy.ts`；revision handler
仅保留 GitHub 请求、账户校验与并发副作用，由 `scripts/test-worker-github-pull-request-revision-policy.mjs`
覆盖 7 项 focused assertions。

最新增量：annotation permission controller 的请求去重、request-id 配对、host invoke
失败与 reset 取消 pending 生命周期补齐独立 focused 回归，由
`scripts/test-preload-annotation-permission-controller.mjs` 覆盖 14 项状态边界断言。

最新增量：worker 的 Windows/WSL 主机路径判定与转换已迁移至
`src/main/worker/host-path-policy.ts`；入口仅保留兼容别名接回，覆盖 WSL mounted path、Windows/UNC、
WSL UNC distro、盘符与 extended UNC 归一化，新增 `scripts/test-worker-host-path-policy.mjs`
提供 12 项 focused assertions。

最新增量：worker Linux `.desktop` 应用发现的条目可见性、DBus/Exec 要求、TryExec 门控与
元数据投影已迁移至 `src/main/worker/linux-desktop-entry-policy.ts`；入口继续负责目录遍历、
文件读取、可执行探测和进程启动副作用，新增 `scripts/test-worker-linux-desktop-entry-policy.mjs`
提供 5 项 focused assertions。

最新增量：worker review working-tree diff metadata 的 batched/no-index Git 输出解析与
路径归属校验已迁移至 `src/main/worker/git-review-working-tree-metadata-policy.ts`；入口仅保留
异步批处理与 Git I/O 编排，新增 `scripts/test-worker-git-review-working-tree-metadata-policy.mjs`
覆盖 4 项 focused assertions。

最新增量：annotation preload bridge 的挂载前消息缓冲、挂载后重放、host listener
订阅/解除订阅及 editor active 状态副作用已迁移并补齐 focused 回归；桥接层仍保留
IPC 与 registry/request 依赖适配，由 `scripts/test-preload-annotation-preload-bridge.mjs`
覆盖 16 项生命周期/状态边界断言。

最新增量：annotation preload 的初始化生命周期（host-message IPC listener、secure-context
policy 同步、DOMContentLoaded 一次性 runtime mount 与 pagehide listener 注册）已迁移至
`src/main/browser-page-preload/annotation-preload-lifecycle.ts`；入口仅保留依赖组装和状态副作用，
由 `scripts/test-preload-annotation-preload-lifecycle.mjs` 覆盖 loading/complete、同源安全上下文
与 listener 注册，共 8 项 focused assertions。

最新增量：worker review working-tree metadata 的未跟踪路径批处理上限与 Git
兼容性降级判定已迁移至 `src/main/worker/git-review-working-tree-policy.ts`；入口仅保留异步
批处理编排，新增 `scripts/test-worker-git-review-working-tree-policy.mjs` 覆盖 7 项 focused
断言，原 55 项 metadata 回归继续通过。

最新增量：GitHub pull-request board 的列表参数、远端仓库候选归一化与 CI/merge 状态判定已迁移至 `src/main/worker/github-pull-request-board-policy.ts`；board handler 仅保留 GitHub 请求与仓库副作用编排，并由 `scripts/test-worker-github-pull-request-board-policy.mjs` 覆盖 13 项 focused assertions。

> 本文档是最终 handoff。前一阶段（消费驱动的语义化）已按 DoD 验收完成：
> 全部门禁绿、被消费的导出 100% 语义化、所有 chunk 已分类。
> **本阶段把验收标准从「消费面语义化」升级为「完全反编译」**：仓库里不再
> 存在未分类的压缩业务代码，且工程本身达到「新人可读、可导航、可一键
> 验证」的状态。本文做完，整个项目即为真正的完全反编译。
> 双轨构建、批次流程、坑纪律沿用旧版（git 历史可查），并发上限 6 subagent
> （实际执行仍受当前运行环境并发槽限制）。
> 所有路径相对 `/Users/david/Workspace/ppio_github/codex-desktop-glm-version`。

## 当前进度快照（2026-10-04）

本轮 A2 增量补强 preload annotation context state：同步消息解析现在对空值/非对象输入安全降级，缺省交互模式与 agent 控制位保持明确默认值；新增 `scripts/test-preload-annotation-context-state.mjs` 的 19 项 focused assertions，覆盖初始状态、能力位同步、注释模式判定及空消息边界。

最新增量：annotation preload 的 pagehide 生命周期（preview 清理、trusted/persisted 判定、权限重置、feature/runtime dispose 与监听器移除）已迁移至 `src/main/browser-page-preload/annotation-pagehide.ts`；入口仅保留依赖适配，由 `scripts/test-preload-annotation-pagehide.mjs` 覆盖 8 项生命周期断言。

GitHub Pull Request summary 的身份 key 规范化、取消 reader 过滤、状态映射与 pending-check
判定已迁移至 `src/main/worker/github-pull-request-summary-policy.ts`；batcher 仅保留 GraphQL
分页与结果编排。新增 `scripts/test-worker-github-pull-request-summary-policy.mjs` 覆盖 9 项
纯策略断言，原 summary handler 回归测试继续验证批处理边界。

最新增量：Annotation controls 的弱引用 target 索引、排序绑定、去绑定与有效 target 收集已迁移至
`src/main/browser-page-preload/annotation-control-targets.ts`；runtime 仅保留兼容导出，由
`scripts/test-preload-annotation-control-targets.mjs` 覆盖 10 项生命周期断言。

Git watcher close 的幂等 dispose、cache invalidation、registry removal 与 unwatched
事件 envelope 已迁移至 `src/main/worker/git-watch-close.ts`；入口仅保留 host/repository
适配，由 `scripts/test-worker-git-watch-close.mjs` 覆盖 8 项生命周期断言。

live-query refresh generation 的 dirty/trigger/retry 重置、generation 分配、trace
合并与 completion waiter 注册已迁移至 `src/main/worker/git-live-query-refresh-plan.ts`；registry
仅负责对选中 subscription 调用计划并安排 timer，由
`scripts/test-worker-git-live-query-refresh-plan.mjs` 覆盖 9 项行为断言。

Git watcher setup 的 per-host 串行排队、index size bucket 采样、ready/close 竞态与 origin-query 清理已迁移至 `src/main/worker/git-watch-setup.ts`；入口仅保留 host/path、watcher 启动、repository cache 与 close 副作用，由 `scripts/test-worker-git-watch-setup.mjs` 覆盖 11 项生命周期断言。

本轮已完成 worker/preload/main 逐段审计、shared 692 导出全量分类、renderer
三大 hub 的消费契约审计与全量 manifest 门禁、tsconfig 排除、测试索引、README 更新，以及 smoke/e2e
验证说明。worker 的 main-RPC 边界已提取为 `src/main/worker/rpc-client.ts`
并接回入口，静态门禁全绿；smoke 已实际验证主窗口加载、renderer 致命错误
过滤和 app-server 初始化握手，且对慢启动增加了 15 秒宽限轮询。

本轮 A3 增量新增 main 的 DeviceCheck attestation 语义模块
`src/main/main-app/security/device-check.ts`，覆盖平台/架构能力判定、native addon
token 生成、失败码和 CBOR/base64url token 编码；原入口仅保留兼容别名接回，
`scripts/test-main-device-check.mjs` 提供 13 项 focused assertions。该项不改变启动、
worker 或 preload 生命周期，language-server、IAB/MCP sandbox 与启动装配仍未完全迁出，
因此不宣称 A3 完成。

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
Worktree create 请求生命周期已迁移至 `src/main/worker/git-worktree-create-request.ts`：入口不再持有
upstream refresh controller 注册/清理、三类 stream event 与响应 envelope 映射，24 项 focused 断言
覆盖取消抑制、成功/失败结果及并发 controller 身份保护；底层 checkout/setup runtime 继续由既有
`git-worktree-create.ts` 承担。
Worktree delete/restore 的 promise 生命周期调度已迁移至 `src/main/worker/git-worktree-lifecycle.ts`，覆盖
同 host+path 去重、restore 串行化、失败后继续和状态清理；入口仅保留实际副作用回调，由 12 项 focused
断言覆盖。
Worktree mutation request 的协议方法分类已迁移至 `src/main/worker/git-worktree-request-policy.ts`，dispatcher
仅负责选择后的业务调用；restore/delete/cancel/host-handoff 等 7 个方法和未知方法回退由 11 项 focused
断言覆盖。
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
Git worker 的 upstream/default/base/current/recent branch request runtime 编排已进一步迁移至
`src/main/worker/git-branch-request-runtime.ts`；入口仅保留 manager/host/signal 与底层 query
依赖注入，由 `scripts/test-worker-git-branch-request-runtime.mjs` 覆盖 8 项边界断言。
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
Live-query recovery 的 metadata 查询、host/root 绑定与缺失仓库短路已进一步迁移至
`src/main/worker/git-live-query-recovery.ts`，由 3 项 focused assertions 覆盖；watch request
handler 仅保留协议编排与依赖注入。
其 subscription state 构造、repository/shared-run cache key 与 branch dependency key 已进一步迁移至
`src/main/worker/git-live-query-state.ts`，由 7 项 focused assertions 覆盖；registry 仍负责异步
refresh、abort、retry 与事件副作用。
Live-query 的本地分支依赖判定与引用计数更新已进一步迁移至
`src/main/worker/git-live-query-branch-dependency.ts`，由 8 项 focused assertions 覆盖
`refs/heads/` 规范化、非 branch 查询过滤、空值和引用计数清理；registry 仍保留 Map、刷新与
事件副作用。
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
`finally` 清理由 48 项行为断言覆盖；参数契约验证另由
`src/main/worker/git-host-handoff-validation.ts` 提供，并由 8 项 focused 断言覆盖。
Move-to-local 的分支占用检查、source detach/stash、local dirty guard、branch checkout、stash
迁移与双侧回滚已迁移至 `src/main/worker/git-move-to-local.ts`；原 `zve` 实现已删除，由 31 项
成功、失败、warning 与异常恢复断言覆盖。
Move-to-worktree 的 local/target checkout、双 stash 迁移、created-worktree cleanup 与分阶段回滚
已迁移至 `src/main/worker/git-move-to-worktree.ts`；原 `Bve` 实现已删除，由 26 项断言覆盖。
Move-to-worktree 的 source/target branch 参数校验与 default-branch 安全门禁已进一步迁移至
`src/main/worker/git-move-to-worktree-policy.ts`；破坏性 checkout/stash 编排入口仅保留 I/O
与 rollback，新增 `scripts/test-worker-git-move-to-worktree-policy.mjs` 覆盖 6 项断言。
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
annotation control handle 的 update/dispose 生命周期已迁移至
`src/main/browser-page-preload/annotation-control-handle.ts`，由 8 项 focused assertions 覆盖，runtime 仅保留兼容导出。
annotation controls 的 DOM target 归一化、文档归属、去重与数量上限已迁移至
`src/main/browser-page-preload/annotation-control-target-validation.ts`，由 6 项 focused
断言覆盖，runtime 仅保留兼容导出。
annotation controls 的完整 payload/patch JSON 解析已迁移至
`src/main/browser-page-preload/annotation-controls-parser.ts`，由 6 项 focused 断言覆盖，runtime 仅保留兼容导出。
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
annotation control payload 的独立安全边界回归已补齐：`scripts/test-preload-annotation-control-payload.mjs`
以 20 项 focused assertions 直接覆盖 null-prototype 克隆、恶意 descriptor/几何与 metadata 过滤、
UTF-8 字节限制、hit-test request 和 response envelope；兼容聚合入口仍保留原有 45 项回归。
annotation display anchor resolution（原 `Q_` 22881-22905）已迁移至
`src/main/browser-page-preload/annotation-display-anchors.ts`，入口继续注入既有 DOM resolver
与 viewport geometry；text 替换、element cache、当前页缺失 selector 过滤、additional anchor
投影和 source-index 保留由 `scripts/test-preload-annotation-display-anchors.mjs` 的 5 项断言覆盖。

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
| A5 | renderer 三大 hub 内部 | app-shared 4.8MB / app-initial 14.3MB / app-primary 3.1MB | 已完成构成审计、消费契约审计与 manifest 门禁 | 当前 manifest 仍报告 10990 个 unreviewed 导出；已迁移的纯策略逐批减少，剩余未消费业务逻辑仍待物理迁出 |

### B. 工程可读性缺口（5 处）

| # | 问题 | 现状 |
|---|---|---|
| B1 | tsconfig 吞 586 万行 transform-only 文件 | **已完成**：`exclude: ["src/webview/assets"]` 已生效，语义源码继续纳入 typecheck |
| B2 | 原版对照文件已迁出 | 10 个主进程原始 chunk 位于 `.reference/originals/main/`，`scripts/build.mjs` 映射回历史输出名并已通过 build/verify/smoke |
| B3 | README 过时 | **已完成**：README 记录 11 个主进程重写 chunk、1874 个 renderer chunks、双轨构建和验证入口 |
| B4 | 测试脚本无索引 | **已完成**：`scripts/test-index.md` 当前索引全部 1136 个 `scripts/test-*.mjs` 脚本 |
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
   "全量分类"，保持现有语义消费声明不回退。
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
4. **测试索引（已完成）**：`scripts/test-*.mjs` 全部 1136 个脚本已登记至
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
同一模块现同时负责 `git add` 失败结果的稳定构造，focused assertions 扩展至 5 项，
覆盖错误分类及结果字段。
Git/session 的工作目录权限错误与 Git 超时判定已迁移至
`src/main/worker/git-session-error-policy.ts`，由 6 项 focused assertions 覆盖；入口继续负责
session 生命周期和实际 Git 调用。
Git review 搜索的路径标签、上下文片段与大小写不敏感匹配限额已迁移至
`src/main/worker/git-review-search-utils.ts`，由 7 项 focused assertions 覆盖（含跨 chunk 行解码）；入口继续负责
Git 查询、文件读取与 review 编排。
Git read-only request dispatch 的 `origin-url`、`origin-and-roots`、`worktree-shell-environment`、
`worktree-owner`、`default-remote-branch` 与 `merge-base` 分支已全部接入
`src/main/worker/git-read-request-dispatch.ts`，由 8 项 focused assertions 覆盖；入口继续负责
取消/性能追踪、Git I/O、class 生命周期与响应包装。
Git branch read request family 已新增 `src/main/worker/git-branch-read-dispatch.ts`，先将
`current-branch`、`current-branch-snapshot`、`upstream-branch`、`branch-ahead-count`、
`default-branch` 与 `base-branch` 分支全部接入入口 dispatcher；由 7 项 focused assertions
覆盖，入口继续保留 class/I/O/取消与结果包装边界。
Git review read family 已新增 `src/main/worker/git-review-read-dispatch.ts`，将
`status-summary`、`branch-diff-stats`、`review-summary`、`review-source-line-counts`、
`review-diff`、`review-search` 与 `review-patch` 全部接入统一 dispatcher；由 8 项 focused
assertions 覆盖，入口继续保留 I/O、性能结果与响应包装。
Repository read family 已新增 `src/main/worker/git-repository-read-dispatch.ts`，将
`clone-state`、`branch-metadata` 与 `branch-exists` 接入 dispatcher；由 4 项 focused assertions
覆盖，入口继续保留 host/signal、Git manager、I/O 与结果包装。
Branch extra read family 已新增 `src/main/worker/git-branch-extra-read-dispatch.ts`，将
`recent-branches`、`resolve-worktree-starting-ref`、`branch-commits` 与 `review-commit-line-counts`
接入 dispatcher；由 5 项 focused assertions 覆盖，入口继续保留 Git I/O、缓存与性能副作用。
Worktree read family 已新增 `src/main/worker/git-worktree-read-dispatch.ts`，将
`search-branches` 与 `nearest-ancestor-branch` 接入 dispatcher；由 3 项 focused assertions
覆盖，入口继续保留 Git manager、repository 查询、signal、I/O 与结果包装。
Repository content family 已新增 `src/main/worker/git-repository-content-dispatch.ts`，将
`repository-identity`、`commit-message-diff`、`submodule-paths`、`cat-file`、`blame-file`、
`index-info` 与 `config-value` 接入 dispatcher；由 8 项 focused assertions 覆盖，入口继续
保留 repository I/O、signal、缓存与结果包装。
Synced branch family 已新增 `src/main/worker/git-synced-branch-dispatch.ts`，将
`synced-branch`、`synced-branch-state` 与 `overwrite-repo` 接入 dispatcher；由 4 项 focused
assertions 覆盖，`overwrite-repo` 的 `refreshRoot` 副作用仍由入口处理。
Cache/watch family 已新增 `src/main/worker/git-cache-watch-dispatch.ts`，将稳定 metadata/read
cache 失效、init-watch dispose、watch/subscribe/recover/unwatch 与 git-init 共 8 个分支接入
dispatcher；入口继续保留 trace、依赖构造、结果包装与生命周期副作用。
Git apply mutation family 已新增 `src/main/worker/git-apply-dispatch.ts`，将 `apply-changes`、
`apply-patch` 与 `apply-review-section-changes` 接入 dispatcher；由 4 项 focused assertions
覆盖，入口继续保留 refreshRoot、缓存刷新、性能追踪和结果包装。
Git mutation family 已新增 `src/main/worker/git-mutation-dispatch.ts`，将 `push`、
`checkout-branch`、`commit` 与 `set-config-value` 接入 dispatcher；由 5 项 focused assertions
覆盖，入口继续保留 refreshRoot、缓存清理、性能追踪与结果包装。
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
Annotation viewport size 读取（原 `p_`）已抽取为
`src/main/browser-page-preload/annotation-viewport.ts`，入口注入 window 尺寸；由 2 项断言覆盖
正常与零尺寸。
Annotation viewport state 读取（原 `C_`）已抽取为
`src/main/browser-page-preload/annotation-viewport-state.ts`，入口注入 window/visualViewport；由 3 项断言覆盖
基础、偏移与默认 visual viewport。
Annotation viewport override 合并（原 `g_`）已抽取为
`src/main/browser-page-preload/annotation-viewport-override.ts`，入口保留布局编排；由 3 项断言覆盖
null identity、尺寸覆盖与非变异。
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
main renderer 的 dev-origin、app/file webview entry 与 sender-frame trust 判定已迁移至
`src/main/main-app/window/renderer-frame-trust.ts`；入口保留 Electron sender/moduleDir 适配，
由 11 项 focused assertions 覆盖 URL、origin、frame identity 与 file entry 边界。

Annotation design draft target 收集与缓存（原 `Jv` 23394-23413）已迁移至
`src/main/browser-page-preload/annotation-draft-runtime.ts`，入口保留 draft attribute
写回和 DOM 清理副作用；由 4 项行为断言覆盖 target 聚合、frame/page 过滤和 cache 复用。

Annotation preview controller 的单实例替换与 teardown 生命周期（原 `wy` 23562-23571）已迁移至
`src/main/browser-page-preload/annotation-preview-controller.ts`；dispose 后进入终止态并拒绝
后续预览挂载，入口继续保留 `Ty` 的 DOM overlay、observer 与 RAF 副作用。由
`scripts/test-preload-annotation-preview-controller.mjs` 覆盖函数/对象 teardown、替换、空值清理
与终止态，共 6 项断言。

Annotation display selection projection（原 `J_` 22849-22873）的 additional-selection
rect/class/page/index 投影已迁移至 `src/main/browser-page-preload/annotation-display-selections.ts`；
入口仅注入 anchor/frame resolver、visible clipping 与 geometry 适配，React render assembly
仍保留在原边界。由 `scripts/test-preload-annotation-display-selections.mjs` 覆盖 7 项断言。

Annotation feature policy lifecycle（原 preload `initializeFeatures`/`disposeFeatures`）已迁移至
`src/main/browser-page-preload/annotation-feature-lifecycle.ts`；入口仅保留 policy state、
IPC toggle 与 host-message wiring。controls、site-request、feature observer、mode controller
的 enable/disable 和 teardown 由 11 项 focused assertions 覆盖；React/DOM runtime 仍保留在
原边界。

Annotation design styles boundary（原 `ls/us/ds/fs/ps/ms`）已迁移至
`src/main/browser-page-preload/annotation-design-styles.ts`，覆盖 computed-style 声明收集与合并、
direct-text draft、style provenance 投影和 create/edit/design target 匹配；入口保留原兼容委托，
由 `scripts/test-preload-annotation-design-styles.mjs` 的 9 项断言覆盖。

Annotation flex-gap overlay projection（原 overlay runtime 内联 flex 子项投影）已进一步迁移至
`src/main/browser-page-preload/annotation-flex-gap-overlays.ts`；目标选择、flex display gate、
绝对/固定定位过滤、可见 rect 与稳定 key 均由注入式 DOM 依赖承载，overlay runtime 仅保留
兼容调用代理。`scripts/test-preload-annotation-flex-gap-overlays.mjs` 覆盖 7 项行为断言。

Annotation design-editor state projection（原 `sy/cy`）已迁移至
`src/main/browser-page-preload/annotation-design-editor-state.ts`；stable id、anchor/control/
declaration/text/provenance/target-label/viewport 投影由纯协调器负责，DOM snapshot、control
读取与 React render assembly 仍由入口注入或保留。由
`scripts/test-preload-annotation-design-editor-state.mjs` 覆盖 6 项 focused assertions。

Annotation metadata tooltip 的稳定行投影（原 React `Nv` 组件内联的 tag/size/color/font
字段读取）已迁移至 `src/main/browser-page-preload/annotation-metadata-tooltip.ts`；入口仅
保留本地化 label、布局和 DOM/React 渲染，并由
`scripts/test-preload-annotation-metadata-tooltip.mjs` 覆盖 5 项 focused assertions。

Git live-query 完成事件的稳定 envelope（generation、recovery、subscription identity、result
与可选 trace）已迁移至 `src/main/worker/git-live-query-events.ts`；registry 仅保留发布时机与
emit 副作用，由 `scripts/test-worker-git-live-query-events.mjs` 覆盖 4 项断言。
Live-query recent/default branch 的 watcher recovery 到 `live` 查询选项映射已迁移至
`src/main/worker/git-live-query-watch-options.ts`，由 6 项 focused assertions 覆盖缺失 watcher、
正常 watcher 与 recovery watcher；handler 仅保留查询编排。

Annotation overlay 的页面 mutation observer 生命周期已迁移至
`src/main/browser-page-preload/annotation-overlay-observer.ts`；overlay 自身 mutation 过滤、页面
mutation 刷新和幂等 teardown 不再内联于 overlay runtime，由
`scripts/test-preload-annotation-overlay-observer.mjs` 覆盖 9 项 focused assertions。

Live-query subscription setup 的 repository metadata 查询、pending trace 关联与 watcher
复用/启动已迁移至 `src/main/worker/git-live-query-subscription-setup.ts`；入口仅保留订阅
注册、abort 等待、取消和 watcher 引用释放副作用。`scripts/test-worker-git-watch-request-handlers.mjs`
现覆盖 30 项断言，并直接验证 setup helper 的 metadata、trace 与 release contract。

Annotation interaction path policy 已迁移至 `src/main/browser-page-preload/annotation-interaction-policy.ts`；
overlay root、interaction blocker 与 marker composed-path 的 DOM 判定由注入式策略承载，原 preload
保留 `gl`/`Cl`/`xl` 兼容代理。`scripts/test-preload-annotation-interaction-policy.mjs` 覆盖 8 项断言。

Annotation selector token escaping 已迁移至
`src/main/browser-page-preload/annotation-selector-token.ts`；元素 selector path、shadow selector
与 scroll-container selector 共用 CSS token 转义策略，入口保留 `qc` 兼容委托并注入 `CSS.escape`
能力；由 `scripts/test-preload-annotation-selector-token.mjs` 覆盖 5 项 focused assertions。

Git request cancellation telemetry envelope 已迁移至 `src/main/worker/git-request-cancellation.ts`；
入口的 queued-cancel 与 in-flight abort 两条生命周期路径共用统一的 canceled/result-disposition/
queue-duration 字段投影，避免重复的遥测组装逻辑。`scripts/test-worker-request-cancellation.mjs`
覆盖 9 项 focused assertions；请求取消、性能追踪与 Git I/O 副作用仍由入口保留。

Git worker response envelope 已迁移至 `src/main/worker/git-response-envelope.ts`；入口不再内联
worker-response 的 id/method/result 与可选 trace/emittedAt 投影，协议字段顺序与缺省语义保持不变。
`scripts/test-worker-git-response-envelope.mjs` 覆盖 6 项 focused assertions；消息发送副作用与
trace 采集仍由 worker 入口保留。

Annotation scroll-container clip projection 已迁移至
`src/main/browser-page-preload/annotation-anchor-clip-policy.ts`；元素包含块判定、CSS overflow
读取与 viewport clip 相交由注入式策略承载，anchor geometry 入口仅保留 document/window DOM
适配。`scripts/test-preload-annotation-anchor-clip-policy.mjs` 覆盖 5 项 focused assertions。

Annotation mode toggle 的 capability、user-activation、agent-control 与销毁态门禁，以及稳定的
page-to-host IPC command envelope 已迁移至
`src/main/browser-page-preload/annotation-mode-command-policy.ts`；preload runtime 仅保留
feature lifecycle、pending-request 清理和 IPC 副作用，由
`scripts/test-preload-annotation-mode-command-policy.mjs` 覆盖 8 项 focused assertions。

Annotation editor view-state boundary 已迁移至
`src/main/browser-page-preload/annotation-editor-view-state.ts`：pointer 命中后的 anchor state
投影、viewport/theme 字段和当前页面可见性/placement 回退由 7 项 focused assertions 覆盖；
原 preload `tv`/`nv` 仅保留 DOM/geometry 适配。

Git-init metadata watcher 失败后的 stat/recovery 判定已迁移至
`src/main/worker/git-init-watcher-recovery.ts`；watcher 入口仅保留 session dispose、日志与
重连副作用，由 `scripts/test-worker-git-init-watcher-recovery.mjs` 覆盖存在目录、非目录、
缺失路径与权限错误四类边界。

Worktree create 的本地环境 setup 生命周期（环境读取、setup failure policy、shell environment
写回/清理与稳定日志）已迁移至 `src/main/worker/git-worktree-setup.ts`；create 入口仅保留
路径/checkout 编排与兼容适配，由 `scripts/test-worker-git-worktree-setup.mjs` 覆盖 9 项断言。
Annotation marker/draft/comment view-state 的 additional-anchor 投影已统一迁移至
`src/main/browser-page-preload/annotation-additional-anchor-projection.ts`；marker runtime
不再在三条投影路径内重复处理 viewport/projector 回退，由
`scripts/test-preload-annotation-additional-anchor-projection.mjs` 覆盖 5 项 focused assertions。

Annotation document context 的 viewport visible-text 收集已迁移至
`src/main/browser-page-preload/annotation-visible-text.ts`；TreeWalker、可见元素过滤、
range 相交与 2,000 字符上限不再与 Google Docs context class 混杂，document-context 入口仅
保留页面判定与依赖适配，由 `scripts/test-preload-annotation-visible-text.mjs` 覆盖 3 项
focused assertions，原 `annotation-document-context` 回归测试继续通过。

Annotation UI mode state boundary（原 React `annotationUiModePolicy`）已登记至
`src/main/browser-page-preload/annotation-ui-mode-policy.ts`；comment/suspended 门控与
site-annotation/tweaks capability 的严格布尔归一化集中在纯状态投影中，非 comment 模式不会
泄漏 suspended 状态，入口继续保留 React/render 副作用。由
`scripts/test-preload-annotation-ui-mode-policy.mjs` 覆盖 comment/browse、null 与 malformed
输入，共 5 项 focused assertions。

2026-10-05 A1 增量：Git worker 子进程观测的 executable/GitHub/SSH 意图分类及 Git/process
telemetry envelope 已迁移至 `src/main/worker/git-process-observability-policy.ts`；
`git-observability.ts` 保留观测编排与兼容导出。新增
`scripts/test-worker-git-process-observability-policy.mjs`，覆盖 11 项 focused assertions；
已通过 build 与 typecheck。
2026-10-05 A2 增量：annotation host sync 的 capability/agent/comment-suspended 生命周期门控已抽至
`src/main/browser-page-preload/annotation-sync-transition.ts`，统一 dispose、request/preview 清理、
marker 与 selection 清理判定；`annotation-sync-state.ts` 接回该策略并保留既有副作用顺序。
新增 `scripts/test-preload-annotation-sync-transition.mjs`，覆盖正常、能力关闭、暂停、browse 与空消息边界，
共 19 项 focused assertions。
2026-10-05 A2 继续批次：annotation region overlay/highlight class policy 已抽至
`src/main/browser-page-preload/annotation-region-class-policy.ts`，入口仅保留页面/矩形依赖与渲染编排；
新增 `scripts/test-preload-annotation-region-class-policy.mjs`，覆盖 overlay/highlight 的 Google Docs
大矩形门控与普通回退，共 4 项 focused assertions。
2026-10-05 A5 继续批次：app-primary 新增 `Ah`/`ok`、`Bm`/`pA`、`Bf`/`LP`、`Bd`/`RI` 四条逐行分类证据，均判定为生成局部 bootstrap/initializer（无独立 named consumer 或 teardown 边界），登记于 `docs/renderer-hub-line-classification.json`。`scripts/test-renderer-hub-classification.mjs` reviewedCount 从 164 同步至 168；审计脚本保持 74/914 consumed、840 unconsumed。

2026-10-05 A5 继续批次：app-primary 未消费导出 `Eo`/`hY` 的模式化 composer placeholder formatter 已迁移至 `src/renderer/app-primary/runtime/format-composer-placeholder.ts`；逻辑仅通过注入的 locale formatter 投影 chat/Codex/Work 文案，无 JSX、store 或生命周期副作用。新增 `scripts/test-app-primary-format-composer-placeholder.mjs` 覆盖 chat agent、Codex、Work、未知模式与空 agent 边界，共 5 项断言；兼容导出仍保留在 hub，逐行分类证据登记后 reviewedCount 从 174 提升至 175。

2026-10-05 A5 继续批次：app-shared 未消费导出 `hBe`/`$U` 的合并冲突状态纯策略已迁移至 `src/renderer/app-shared/runtime/merge-conflict-state.ts`；逻辑仅规范化 `mergeable` 与 `mergeStateStatus` 并投影冲突 banner 状态，无 JSX、store 或生命周期副作用。新增 `scripts/test-renderer-merge-conflict-state.mjs` 覆盖大小写、冲突优先级、未知值与空输入共 6 项断言；兼容导出仍保留在 hub，逐行分类证据登记；app-primary reviewedCount 保持 175。

2026-10-05 A5 继续批次：app-primary 未消费区新增 `rO`/`ng`、`aO`/`rg`、`lO`/`eg`、`mO`/`Yh` 四条逐行分类证据，分别判定为生成局部 composer mode policy、默认快照 bootstrap、查询 bootstrap 与 plugin context bootstrap；均无独立 named consumer 或 teardown 边界，登记于 `docs/renderer-hub-line-classification.json`。`scripts/test-renderer-hub-classification.mjs` reviewedCount 从 175 提升至 179；审计脚本消费计数保持 74/914，未消费区继续显式保留。

2026-10-05 A1 增量：Git worker 请求 context 投影（root/cwd、review source 与 failure 结果判定）抽至 `src/main/worker/git-request-context-policy.ts`，由 `scripts/test-worker-git-request-context-policy.mjs` 覆盖 12 项断言；已通过 build、verify-chunks 与 typecheck。

2026-10-05 A1 增量：`list-worktrees` 请求的 repository 可空解析与列表委派边界已由
`src/main/worker/git-worktree-list-request-handler.ts` 独立承载；入口继续负责请求 envelope、取消
与 Git I/O 生命周期。新增 `scripts/test-worker-git-worktree-list-request-handler.mjs`，覆盖存在/缺失
repository、参数与 signal 透传，共 5 项 focused assertions。

2026-10-05 A2 继续批次：annotation overlay runtime 按 root host 的 element cache 与统一 dispose
清理已迁移至 `src/main/browser-page-preload/annotation-element-cache.ts`；新增
`scripts/test-preload-annotation-element-cache.mjs`，覆盖缓存复用/隔离、销毁清理及销毁后
新缓存边界，共 9 项 focused assertions。

2026-10-05 A2 继续批次：annotation preload 的 feature graph、preview overlay 与 capability
flag 统一销毁顺序已迁移至 `src/main/browser-page-preload/annotation-preload-disposal.ts`；
新增 `scripts/test-preload-annotation-preload-disposal.mjs`，覆盖 feature dispose → preview
clear → capability reset 顺序及重复销毁，共 6 项 focused assertions；已通过 typecheck、verify。

2026-10-05 A1 增量：worktree snapshot 文件枚举中的 NUL 路径解析、porcelain untracked 投影、
literal pathspec 字节分批、index fingerprint 与 ENOENT 判定已抽至
`src/main/worker/git-worktree-files-policy.ts`；`git-worktree-files.ts` 保留 Git I/O、稳定性重试和
fallback 生命周期。新增 `scripts/test-worker-git-worktree-files-policy.mjs`，覆盖 11 项 focused assertions。

2026-10-05 A2 继续批次：annotation design-control sync 的 target 弱引用、当前 design 生成、
已应用 preview 映射与 disposed 终态已抽至
`src/main/browser-page-preload/annotation-design-control-sync-state.ts`；同步器仅保留页面
target 判定、preview diff 与 dispatch 副作用。新增
`scripts/test-preload-annotation-design-control-sync-state.mjs` 覆盖 target 保留/裁剪、applied
替换、clear 与幂等 dispose，共 12 项 focused assertions；原
`scripts/test-preload-annotation-design-control-sync.mjs` 11 项回归、build check、verify 与
typecheck 均通过。
2026-10-05 A2 继续批次：annotation feature lifecycle 的刷新判定已抽至 `annotation-feature-lifecycle-state.ts`，将 controls/request/observer/mode 四类资源是否存在的真实 teardown 边界变为可复用纯策略；新增 `scripts/test-preload-annotation-feature-lifecycle-state.mjs` 覆盖空图与各资源单独存在的 6 项断言。feature lifecycle 入口现消费该策略，focused lifecycle/state 测试与后续 verify/typecheck 待本批次完成后复核。
2026-10-05 A2 继续批次：annotation preload bridge 的 mounted subscriber 与 terminal dispose 状态已抽至 `annotation-preload-bridge-state.ts`；bridge 仅保留 IPC listener、消息队列及订阅副作用。新增 `scripts/test-preload-annotation-preload-bridge-state.mjs` 覆盖挂载、清理、终态幂等与终态拒绝重挂载，共 11 项 focused assertions。
2026-10-05 A5 继续批次：app-primary Box library 文件预览导出 `Jd`（`FMe`，17195--17208）已抽取为 `resolve-box-file-preview.ts`，保留 external-box ID/provider/MIME 校验及 Box Notes/普通文件 URL 投影；新增 `scripts/test-app-primary-resolve-box-file-preview.mjs` 覆盖 5 项 focused assertions。逐行分类证据登记后 reviewedCount 提升至 216；hub audit 与 focused classification test 已通过。
2026-10-05 A2 继续批次：annotation preload 启动阶段的 secure-context/top-frame policy sync 与 DOMContentLoaded mount gate 已抽至 `annotation-preload-startup-policy.ts`；`annotation-preload-lifecycle.ts` 仅保留 listener 注册、IPC policy 读取与 mount/pagehide 编排。新增 `scripts/test-preload-annotation-preload-startup-policy.mjs`，覆盖安全上下文、top-frame、loading/complete 与空输入边界，共 9 项 focused assertions；已通过 build、preload lifecycle 回归、verify 与 typecheck。
2026-10-05 A1 继续批次：Git branch-ahead 的 remote upstream 归一化、远端 ancestor revision、默认分支 revision 与 ahead range 参数构造已迁移至 `src/main/worker/git-branch-ahead-policy.ts`；branch-ahead 运行时保留 repository/Git/query 编排。新增 `scripts/test-worker-git-branch-ahead-policy.mjs` 覆盖 12 项 focused assertions；原 branch-ahead 回归 41 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Git clone state 的配置行解析与 partial-clone 识别策略已迁移至 `src/main/worker/git-clone-state-policy.ts`；clone state 运行时保留 shallow/config 并行 Git 查询与状态投影。新增 `scripts/test-worker-git-clone-state-policy.mjs` 覆盖 17 项 focused assertions；原 clone-state 回归 29 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：automation writable roots 的 common-dir 路径解析与 index/.git fallback 已迁移至 `src/main/worker/git-automation-writable-roots-policy.ts`；运行时保留 worktree/source repository 查询及 writable-root 编排。新增 `scripts/test-worker-git-automation-writable-roots-policy.mjs` 覆盖 6 项 focused assertions；原回归 9 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：checkout failure 的 overwrite-conflict 输出解析、去重路径收集与错误分类已迁移至 `src/main/worker/git-checkout-conflict-policy.ts`；checkout handler 保留 ref 解析、stash/rollback、Git checkout 与缓存失效副作用。新增 `scripts/test-worker-git-checkout-conflict-policy.mjs` 覆盖 5 项 focused assertions；原 checkout handler 回归 16 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：Windows Git executable 的大小写不敏感环境读取、PATH 覆盖检测与进程环境合并策略已迁移至 `src/main/worker/git-executable-policy.ts`；executable resolver 保留 Windows where 查询、缓存与命令重写流程。新增 `scripts/test-worker-git-executable-policy.mjs` 覆盖 6 项 focused assertions；原 executable 回归 6 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：commit message 的 attribution 默认值、Co-authored-by trailer 识别/去重及 trailer block 拼接策略已迁移至 `src/main/worker/git-commit-message-policy.ts`；commit handler 保留 repository 查询、stage/commit Git I/O、失败回滚与缓存编排。新增 `scripts/test-worker-git-commit-message-policy.mjs` 覆盖 6 项 focused assertions；原 commit handler 回归 48 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：merge-base fallback 的 remote/upstream candidate ref 构造、remote-prefixed branch 特判与顺序去重已迁移至 `src/main/worker/git-merge-base-policy.ts`；merge-base 运行时保留 query、resolveRef 与 Git merge-base I/O 编排。新增 `scripts/test-worker-git-merge-base-policy.mjs` 覆盖 4 项 focused assertions；原 merge-base 回归 35 项、build 与 typecheck 已通过。

2026-10-05 A1 继续批次：ignore discovery 的 Git config path 输出校验与已排序路径的 lower-bound 插入位置策略已迁移至 `src/main/worker/git-ignore-discovery-policy.ts`；运行时保留 config 查询、origin 解析及文件路径投影。新增 `scripts/test-worker-git-ignore-discovery-policy.mjs` 覆盖 3 项 focused assertions；build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：worker RPC request lifecycle 的 tracked/uncancelable 状态、启动前取消排队、运行中 abort 与 finish 清理协议已迁移至 `src/main/worker/git-request-lifecycle-policy.ts`；原 lifecycle 入口仅保留兼容转出。新增 `scripts/test-worker-git-request-lifecycle-policy.mjs` 覆盖 8 项 focused assertions；原 `test-git-request-lifecycle.mjs` 回归 11 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：host handoff progress 的 active-step 状态与 started/completed/failed 终态清理协议已迁移至 `src/main/worker/git-host-handoff-progress-policy.ts`；handoff 入口仅保留兼容转出。新增 `scripts/test-worker-git-host-handoff-progress-policy.mjs` 覆盖 6 项 focused assertions；原回归 `test-worker-git-host-handoff-progress.mjs` 10 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：Git worker response envelope 的 trace 可选投影与 emittedAtMs 默认/显式时间戳协议已迁移至 `src/main/worker/git-response-envelope-policy.ts`；原 envelope 入口仅保留兼容转出。新增 `scripts/test-worker-git-response-envelope-policy.mjs` 覆盖 3 项 focused assertions；原回归 `test-worker-git-response-envelope.mjs` 6 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：host handoff RPC 的 source rollout/branch 必填约束与 destination worktree roots 成对协议已迁移至 `src/main/worker/git-host-handoff-validation-policy.ts`；原 validation 入口仅保留兼容转出。新增 `scripts/test-worker-git-host-handoff-validation-policy.mjs` 覆盖 5 项 focused assertions；原回归 8 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：Git request cancellation telemetry 的 queue duration 裁剪、取消 disposition 与稳定字段 envelope 已迁移至 `src/main/worker/git-request-cancellation-policy.ts`；取消入口仅保留兼容转出。新增 `scripts/test-worker-git-request-cancellation-policy.mjs` 覆盖 3 项 focused assertions；原回归 `test-worker-request-cancellation.mjs` 9 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：worker RPC 方法的 cancelability 与 telemetry tracking 分类白名单已迁移至 `src/main/worker/git-request-classification-policy.ts`；query utils 保留 availability 判定及查询/路径策略。新增 `scripts/test-worker-git-request-classification-policy.mjs` 覆盖 8 项 focused assertions；原 query utility 回归 27 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：fsmonitor 配置值 true/false/unknown 解析与 local/remote host 平台支持判定已迁移至 `src/main/worker/git-fsmonitor-policy.ts`；query utils 保留 daemon feature 检测及查询缓存策略。新增 `scripts/test-worker-git-fsmonitor-policy.mjs` 覆盖 11 项 focused assertions；原 query utility 回归 27 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：Git command cacheability 的命令/参数白名单（status、refs、config、remote/worktree 查询及受限 cat-file/ls-files）已迁移至 `src/main/worker/git-cache-command-policy.ts`；query utils 保留 query key、fsmonitor 与路径 overlap 策略。新增 `scripts/test-worker-git-cache-command-policy.mjs` 覆盖 12 项 focused assertions；原 query utility 回归 27 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：Git watcher 路径规范化与 watched/changed 前缀 overlap 判定已迁移至 `src/main/worker/git-path-overlap-policy.ts`；query utils 保留 query key、cacheability 与 fsmonitor 策略。新增 `scripts/test-worker-git-path-overlap-policy.mjs` 覆盖 6 项 focused assertions；原 query utility 回归 27 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：Git fsmonitor daemon capability 输出的严格 feature 行识别已迁移至 `src/main/worker/git-fsmonitor-feature-policy.ts`；query utils 保留 query key、cacheability、路径与环境策略。新增 `scripts/test-worker-git-fsmonitor-feature-policy.mjs` 覆盖 5 项 focused assertions；原 query utility 回归 27 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：Git query key 与 fsmonitor cache key 的 host/root/operation 组合、环境字段排序及 GIT_INDEX_FILE 排除协议已迁移至 `src/main/worker/git-query-key-policy.ts`；query utils 保留 cacheability、路径与环境判定策略。新增 `scripts/test-worker-git-query-key-policy.mjs` 覆盖 3 项 focused assertions；原 query utility 回归 27 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：Git query key 的 `git` namespace 与 host-scoped 匹配协议已迁移至 `src/main/worker/git-query-match-policy.ts`；query utils 保留 key 构造、cacheability、路径与环境策略。新增 `scripts/test-worker-git-query-match-policy.mjs` 覆盖 6 项 focused assertions；原 query utility 回归 27 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：Git 输出 UTF-8 字节长度计算策略已迁移至 `src/main/worker/git-output-size-policy.ts`，确保多字节文本按字节计量；query utils 保留查询与路径协议。新增 `scripts/test-worker-git-output-size-policy.mjs` 覆盖 4 项 focused assertions；原 query utility 回归 27 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：local/mutation/request-cancelability 组合得到 availability-check 的策略已迁移至 `src/main/worker/git-availability-policy.ts`；query utils 保留 request classification 与查询键/缓存策略。新增 `scripts/test-worker-git-availability-policy.mjs` 覆盖 4 项 focused assertions；原 query utility 回归 27 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：repository index stat 的 mtime 到稳定 `lastModified` 响应投影（有限数值保留、缺失/异常归零）已迁移至 `src/main/worker/git-index-info-policy.ts`；index info 入口保留 git-dir/stat 查询与异常日志副作用。新增 `scripts/test-worker-git-index-info-policy.mjs` 覆盖 5 项 focused assertions；原回归 10 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：Git process telemetry 的 exit code bucket（null、1/2/128/129 与 other）映射已迁移至 `src/main/worker/git-exit-code-policy.ts`；observability 保留命令计数与 telemetry 编排。新增 `scripts/test-worker-git-exit-code-policy.mjs` 覆盖 7 项 focused assertions；原 observability 回归 99 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：observability 的 mutating request kind/source 分类集合已迁移至 `src/main/worker/git-mutation-classification-policy.ts`；observability 保留 telemetry 聚合与命令统计编排。新增 `scripts/test-worker-git-mutation-classification-policy.mjs` 覆盖 5 项 focused assertions；原 observability 回归 99 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：observability host cache identity 的稳定字段投影已迁移至 `src/main/worker/git-host-cache-key-policy.ts`，排除无关 hostConfig 字段并保留 host/config 关键字段顺序；observability 保留 telemetry 聚合编排。新增 `scripts/test-worker-git-host-cache-key-policy.mjs` 覆盖 3 项 focused assertions；原 observability 回归 99 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：branch comparison 的 `rev-list --left-right --count` 两列解析与 equal/left-ahead/right-ahead/diverged 状态协议已迁移至 `src/main/worker/git-branch-comparison-policy.ts`；comparison 入口保留 query/Git I/O 编排。新增 `scripts/test-worker-git-branch-comparison-policy.mjs` 覆盖 7 项 focused assertions；原回归 21 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：turn diff snapshot 的 NUL 分隔 porcelain status 解析与 tracked/untracked 投影已迁移至 `src/main/worker/git-turn-diff-status-policy.ts`；snapshot 入口保留 status 查询、临时 index 与 stage 副作用。新增 `scripts/test-worker-git-turn-diff-status-policy.mjs` 覆盖 4 项 focused assertions；原回归 21 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：Git argv 中 `-c key=value` 前置项跳过、已知 Git subcommand 白名单与 unknown fallback 解析已迁移至 `src/main/worker/git-subcommand-policy.ts`；git-errors 保留错误分类正则。新增 `scripts/test-worker-git-subcommand-policy.mjs` 覆盖 5 项 focused assertions；原 git-errors 回归 5 项、build 与 typecheck 已通过。

2026-10-05 A5 T5 继续批次：app-primary 的前景图片 URL 选择策略（功能开关、深色变体优先与 URL 校验）已迁移至 `src/renderer/app-primary/runtime/select-foreground-image-url.ts`；新增 `scripts/test-app-primary-select-foreground-image-url.mjs` 覆盖 4 项 focused assertions，并登记 `Ym` 源码 5765-5769 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-05 A5 T5 继续批次：app-primary 的 recency 排序策略（复制输入后按 `recencyAtMs` 降序、缺失值按零处理）已迁移至 `src/renderer/app-primary/runtime/sort-by-recency.ts`；新增 `scripts/test-app-primary-sort-by-recency.mjs` 覆盖 3 项 focused assertions，并登记 `_n/Kct` 源码 97179-97181 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-05 B5 回归补强：`scripts/smoke-test.sh` 默认改用每次运行独立临时 Electron profile，仍支持 `CODEX_SMOKE_USER_DATA_PATH` 覆盖；实测 build/pack 后主窗口 frame、app-server handshake 与 renderer fatal 过滤均通过，避免历史单实例锁导致误报超时。

2026-10-05 A1 T1 继续批次：cat-file 请求的全零 OID 不可查询、非零 OID 可查询判定已迁移至 `src/main/worker/git-cat-file-policy.ts`；cat-file 入口保留 batch 查询、大小限制与错误投影。新增 `scripts/test-worker-git-cat-file-policy.mjs` 覆盖 6 项 focused assertions；原 cat-file 回归 43 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：cat-file 命令结果 code=128 的 not-found 与其他 code 的 unknown 错误分类已迁移至 `src/main/worker/git-cat-file-error-policy.ts`；cat-file 入口保留 batch 查询与大小限制编排。新增 `scripts/test-worker-git-cat-file-error-policy.mjs` 覆盖 4 项 focused assertions；build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：cat-file unknown error envelope 的稳定 `{type:error,error.type:unknown}` 构造已迁移至 `src/main/worker/git-cat-file-error-envelope-policy.ts`；cat-file 入口保留 batch parser 与错误重试编排。新增 `scripts/test-worker-git-cat-file-error-envelope-policy.mjs` 覆盖 2 项 focused assertions；cat-file policy 回归 6 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：cat-file 批量内容按换行边界拆分（保留换行、去除末尾空段）已迁移至 `src/main/worker/git-cat-file-content-policy.ts`；cat-file 入口保留 batch framing、大小限制与错误编排。新增 `scripts/test-worker-git-cat-file-content-policy.mjs` 覆盖 4 项 focused assertions；cat-file policy 回归 6 项、build 与 typecheck 已通过。

2026-10-05 A5 T5 继续批次：app-primary 的文件扩展名许可策略（无配置时放行、按点后缀大小写不敏感匹配）已迁移至 `src/renderer/app-primary/runtime/has-allowed-file-extension.ts`；新增 `scripts/test-app-primary-has-allowed-file-extension.mjs` 覆盖 4 项 focused assertions，并登记 `bt/mmt` 源码 106735-106737 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-05 A5 T5 继续批次：app-primary 的 capability 支持 predicate（缺省视为支持、仅显式 `false` 禁用）已迁移至 `src/renderer/app-primary/runtime/is-capability-supported.ts`；新增 `scripts/test-app-primary-is-capability-supported.mjs` 覆盖 4 项 focused assertions，并登记 `vm/vAe` 源码 9002-9004 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-05 A5 T5 继续批次：app-primary 的 handoff branch 投影策略（按 source/target conversation ID 与 handoff direction 选择分支并应用 fallback）已迁移至 `src/renderer/app-primary/runtime/select-handoff-branch.ts`；新增 `scripts/test-app-primary-select-handoff-branch.mjs` 覆盖 4 项 focused assertions，并登记 `hp/QM` 源码 11272-11276 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-05 A1 T1 继续批次：git diff hunk 中新增/删除行计数与 binary patch null 投影已迁移至 `src/main/worker/git-diff-line-count-policy.ts`；diff text 入口保留路径解析、rename 重写与文本编排。新增 `scripts/test-worker-git-diff-line-count-policy.mjs` 覆盖 4 项 focused assertions；原 diff-text 回归 33 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：Git diff quoted-path parser 的八进制 digit 与三位八进制 escape 判定已迁移至 `src/main/worker/git-diff-octal-policy.ts`；diff text 入口保留 quoted path、header 与 rename 解析。新增 `scripts/test-worker-git-diff-octal-policy.mjs` 覆盖 9 项 focused assertions；原 diff-text 回归 33 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：Git diff header 的 combined (`diff --cc`/`diff --combined`) 与普通 `diff --git` 分流判定已迁移至 `src/main/worker/git-diff-header-policy.ts`；diff text 入口保留各类路径解析与 rename 重写。新增 `scripts/test-worker-git-diff-header-policy.mjs` 覆盖 5 项 focused assertions；原 diff-text 回归 33 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：cat-file batch failure 的单请求 output-limit `too-large`、多请求/普通 Git code 错误 envelope 分类已迁移至 `src/main/worker/git-cat-file-batch-error-policy.ts`；cat-file 入口保留 batch framing、retry 与 I/O 编排。新增 `scripts/test-worker-git-cat-file-batch-error-policy.mjs` 覆盖 4 项 focused assertions；cat-file policy 回归 6 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：cat-file disk fallback 的 ENOENT、No such file、cannot open 与 not found 文本 classifier 已迁移至 `src/main/worker/git-cat-file-disk-error-policy.ts`；cat-file 入口保留磁盘读取与 fallback envelope 编排。新增 `scripts/test-worker-git-cat-file-disk-error-policy.mjs` 覆盖 6 项 focused assertions；cat-file policy 回归 6 项、build 与 typecheck 已通过。

2026-10-05 A5 T5 继续批次：app-primary 的终端命令 token 清理策略（移除空白与固定 shell 特殊字符集合）已迁移至 `src/renderer/app-primary/runtime/strip-terminal-command-token.ts`；新增 `scripts/test-app-primary-strip-terminal-command-token.mjs` 覆盖 3 项 focused assertions，并登记 `cp/fN` 源码 11809-11813 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-05 A5 T5 继续批次：app-shared 的 model slug 查找策略已迁移至 `src/renderer/app-shared/runtime/find-model-by-slug.ts`；新增 `scripts/test-app-shared-find-model-by-slug.mjs` 覆盖 3 项 focused assertions，并登记 `FY/QL` 源码 60531-60533 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-05 A5 T5 继续批次：app-shared 的新会话 slug formatter 已迁移至 `src/renderer/app-shared/runtime/create-chat-slug.ts`；新增 `scripts/test-app-shared-create-chat-slug.mjs` 覆盖 4 项 focused assertions，并登记 `AV/cUe` 源码 66886-66894 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-05 A5 T5 继续批次：app-shared 的 remote-control key formatter 已迁移至 `src/renderer/app-shared/runtime/format-remote-control-key.ts`；新增 `scripts/test-app-shared-format-remote-control-key.mjs` 覆盖 2 项 focused assertions，并登记 `FU/kBe` 源码 64878-64880 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。
2026-10-05 A1 T1 继续批次：Git diff `a/`/`b/` header 前缀剥离与非法前缀 null 判定已迁移至 `src/main/worker/git-diff-prefix-policy.ts`；diff text 入口保留 quoted path/header/rename 编排。新增 `scripts/test-worker-git-diff-prefix-policy.mjs` 覆盖 4 项 focused assertions；原 diff-text 回归 33 项、build 与 typecheck 已通过。

2026-10-05 A1 T1 继续批次：Git diff path 的特殊字符引用与反斜杠/引号/换行/回车/Tab 转义协议已迁移至 `src/main/worker/git-diff-quote-policy.ts`；diff text 入口保留 header、rename 与 parser 编排。新增 `scripts/test-worker-git-diff-quote-policy.mjs` 覆盖 5 项 focused assertions；原 diff-text 回归 33 项、build 与 typecheck 已通过。

2026-10-05 A5 T5 继续批次：app-shared 的 scroll offset clamp 策略已迁移至 `src/renderer/app-shared/runtime/clamp-scroll-offset.ts`；新增 `scripts/test-app-shared-clamp-scroll-offset.mjs` 覆盖 4 项 focused assertions，并登记 `Bq/AFe` 源码 61745-61748 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-05 A5 T5 继续批次：app-shared 的 unknown error message formatter 已迁移至 `src/renderer/app-shared/runtime/format-error-message.ts`；新增 `scripts/test-app-shared-format-error-message.mjs` 覆盖 4 项 focused assertions，并登记 `IH/RVe` 源码 65652-65662 行语义证据。该导出已由 manifest 识别为 consumed，保留现有 renderer 消费语义。

2026-10-06 A5 T5 继续批次：app-shared 的 scheduled-task key formatter 已迁移至 `src/renderer/app-shared/runtime/format-scheduled-task-key.ts`；新增 `scripts/test-app-shared-format-scheduled-task-key.mjs` 覆盖 2 项 focused assertions，并登记 `HV/RHe` 源码 66752-66754 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-06 A5 T5 继续批次：app-shared 的 notification status projection 已迁移至 `src/renderer/app-shared/runtime/derive-notification-status.ts`；新增 `scripts/test-app-shared-derive-notification-status.mjs` 覆盖 4 项 focused assertions，并登记 `Aq/RFe` 源码 61870-61878 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-06 A5 T5 继续批次：app-shared 的 managed host source predicate 已迁移至 `src/renderer/app-shared/runtime/is-managed-host-source.ts`；新增 `scripts/test-app-shared-is-managed-host-source.mjs` 覆盖 4 项 focused assertions，并登记 `HU/NBe` 源码 64893-64895 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-06 A5 T5 继续批次：app-shared 的 WSL host source predicate 已迁移至 `src/renderer/app-shared/runtime/is-wsl-host-source.ts`；新增 `scripts/test-app-shared-is-wsl-host-source.mjs` 覆盖 3 项 focused assertions，并登记 `WU/PBe` 源码 64896-64898 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。
2026-10-05 A1 T1 继续批次：review search 的大小写不敏感 offset 收集、limit cap 与 totalMatches/isCapped 投影已迁移至 `src/main/worker/git-review-search-policy.ts`；review search utils 保留 path/snippet 与 streaming decoder 策略。新增 `scripts/test-worker-git-review-search-policy.mjs` 覆盖 3 项 focused assertions；build 与 typecheck 已通过。
2026-10-06 A1 T1 继续批次：review search snippet 的 before/match/after context 截取策略已迁移至 `src/main/worker/git-review-snippet-policy.ts`；review search utils 保留 offset 搜索与 streaming decoder。新增 `scripts/test-worker-git-review-snippet-policy.mjs` 覆盖 3 项 focused assertions；build 与 typecheck 已通过。
2026-10-06 A1 T1 继续批次：review search rename-aware path formatting（同路径原值、不同路径箭头映射）已迁移至 `src/main/worker/git-review-search-path-policy.ts`；review search utils 保留 snippet、offset 与 streaming decoder。新增 `scripts/test-worker-git-review-search-path-policy.mjs` 覆盖 3 项 focused assertions；build 与 typecheck 已通过。
2026-10-06 A1 T1 继续批次：review search UTF-8 line decoder 的 chunk 拼接、换行发射与 trailing partial 保留状态机已迁移至 `src/main/worker/git-review-line-decoder-policy.ts`；review search utils 保留 offset/snippet/path 策略。新增 `scripts/test-worker-git-review-line-decoder-policy.mjs` 覆盖 3 项 focused assertions；build 与 typecheck 已通过。
2026-10-06 A1 T1 继续批次：review metadata numstat 的 `-` binary 标记、十进制值与非法输入规范化已迁移至 `src/main/worker/git-review-numstat-policy.ts`；metadata utils 保留 diff/revision I/O 与文件映射编排。新增 `scripts/test-worker-git-review-numstat-policy.mjs` 覆盖 5 项 focused assertions；build 与 typecheck 已通过。
2026-10-06 A1 T1 继续批次：review metadata 的文件 key 生成与 Git status→change kind 分类已迁移至 `src/main/worker/git-review-file-classification-policy.ts`；metadata utils 保留 revision、diff 与 rename 编排。新增 `scripts/test-worker-git-review-file-classification-policy.mjs` 覆盖 6 项 focused assertions；build 与 typecheck 已通过。

2026-10-06 A5 T5 继续批次：app-shared 的 remote-control host source predicate 已迁移至 `src/renderer/app-shared/runtime/is-remote-control-host-source.ts`；新增 `scripts/test-app-shared-is-remote-control-host-source.mjs` 覆盖 3 项 focused assertions，并登记 `BU/fV` 源码 64899-64901 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-06 A5 T5 继续批次：app-primary 的 displayable action predicate 已迁移至 `src/renderer/app-primary/runtime/has-displayable-action.ts`；新增 `scripts/test-app-primary-has-displayable-action.mjs` 覆盖 4 项 focused assertions，并登记 `qm/iAe` 源码 5995-5998 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-06 A5 T5 继续批次：app-primary 的 composer enter-behavior formatter 已迁移至 `src/renderer/app-primary/runtime/format-composer-enter-behavior.ts`；新增 `scripts/test-app-primary-format-composer-enter-behavior.mjs` 覆盖 3 项 focused assertions，并登记 `jt/Fft` 源码 103478-103484 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-06 A5 T5 继续批次：app-shared 的 SSH host kind predicate 已迁移至 `src/renderer/app-shared/runtime/is-ssh-host-kind.ts`；新增 `scripts/test-app-shared-is-ssh-host-kind.mjs` 覆盖 3 项 focused assertions，并登记 `UU/IBe` 源码 64905-64907 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-06 A5 T5 继续批次：app-shared 的 managed host source 过滤策略已迁移至 `src/renderer/app-shared/runtime/filter-managed-hosts-by-source.ts`；新增 `scripts/test-app-shared-filter-managed-hosts-by-source.mjs` 覆盖 3 项 focused assertions，并登记 `LU/jBe` 源码 64887-64890 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-06 A5 T5 继续批次：app-shared 的 remote-control host 过滤策略已迁移至 `src/renderer/app-shared/runtime/filter-remote-control-hosts.ts`；新增 `scripts/test-app-shared-filter-remote-control-hosts.mjs` 覆盖 3 项 focused assertions，并登记 `IU/MBe` 源码 64890-64892 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-06 A5 T5 继续批次：app-primary 的 beacon query 清理策略已迁移至 `src/renderer/app-primary/runtime/strip-beacon-query-params.ts`；新增 `scripts/test-app-primary-strip-beacon-query-params.mjs` 覆盖 3 项 focused assertions，并登记 `dh/Kke` 源码 5467-5473 行语义证据。Renderer hub manifest 审计显示该导出由 `unreviewed` 降为 `semantic`。

2026-10-06 A5 T5 分类批次：app-primary `vn/Bct`（源码 96922-96930）已登记为 `preserved-coupled`。该 mapper 仅将 fast/ultrafast 映射到相邻生成 bootstrap 初始化的 `HG/Rct` runtime 函数，null 返回 undefined；由于依赖无独立模块边界，保留在 generated hub，未伪造 semantic 抽取。Manifest app-primary unreviewed 由 604 降至 603。

2026-10-06 A5 T5 分类批次：app-primary `Na/fQ`（源码 57945-57954）已登记为 `preserved-coupled`。该 helper 直接注册 `document.body` 的 `MutationObserver` 并返回 disconnect teardown closure，DOM lifecycle 所有权与生成 surface 耦合，未伪造 semantic 抽取。Manifest app-primary unreviewed 由 603 降至 602。

2026-10-06 A5 T5 分类批次：app-primary `cf/dMe`（源码 16059-16071）已登记为 `preserved-coupled`。该 helper 通过 `window.dispatchEvent` 发出带 callback capture 的 `CustomEvent` 并返回异步结果，事件总线副作用与 callback ownership 和生成 surface 耦合，未伪造 semantic 抽取。Manifest app-primary unreviewed 由 602 降至 601。

2026-10-06 A5 T5 分类批次：app-primary `of/PF`（源码 16075-16087）已登记为 `preserved-coupled`。该 helper 通过 `window.dispatchEvent` 发出带 submission kind 与 onSubmitAvailability callback capture 的 `CustomEvent` 并返回捕获状态，事件总线副作用与 callback ownership 和生成 surface 耦合，未伪造 semantic 抽取。Manifest app-primary unreviewed 由 601 降至 600。

2026-10-06 A5 T5 分类批次：app-primary `lf/FF`（源码 16092-16100）已登记为 `preserved-coupled`。该 helper 注册按 conversationId/availabilityChanged 过滤的 window listener，并返回 removeEventListener teardown，注册与清理生命周期和生成 event surface 耦合，未伪造 semantic 抽取。Manifest app-primary unreviewed 由 600 降至 599。

2026-10-06 A5 T5 分类批次：app-primary `gi/H0`（源码 78323-78330）已登记为 `preserved-coupled`。该 helper 解析 DOM 节点并调用 scrollIntoView/focus，依赖生成的 w9e locator 与浏览器焦点生命周期，未伪造 semantic 抽取。Manifest app-primary unreviewed 由 599 降至 598。
2026-10-06 A5 逐段复核：app-shared 导出 `$0`（source `$b`，32365-32367）确认是生成 motion-value runtime 构造器；其对象构造、dependents/listeners 与相邻动画 bootstrap 共用生命周期，登记为 `preserved-coupled`，不抽取独立 facade。
2026-10-06 A5 逐段复核：app-shared 导出 `$1`（source `$S`，81015-81018）确认是生成 icon registry 的 document-badge lazy initializer；其共享注册、memoized bootstrap 与资产生命周期均由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `$2`（source `Hg`，28961-28975）确认由共享 intl bootstrap 初始化，组合 locale/message cache、rich-text normalization 与 formatter context；其 provider/cache 生命周期耦合 generated surface，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `e4`（source `Ug`，28948-28973）确认是 shared intl runtime bootstrap，初始化 provider 依赖并 memoize locale/message formatter state；其 setup/cache 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `Ku`（source `Ugt`，112340-112343）确认是 shared icon bootstrap 的 memoized pin asset initializer；registry ownership 与 lazy asset lifecycle 由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `Et`（source `fDt`，121403-121407）确认是 shared icon registry 的 memoized circle-info asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `Ct`（source `mDt`，121430-121434）确认是 shared icon registry 的 memoized plus-sm asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `St`（source `gDt`，121457-121461）确认是 shared icon registry 的 memoized chat-bubble-plus asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `yt`（source `vDt`，121484-121488）确认是 shared icon registry 的 memoized arrow-up-open asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `vt`（source `bDt`，121511-121515）确认是 shared icon registry 的 memoized arrow-up-open-base asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `ht`（source `SDt`，121542-121546）确认是 shared icon registry 的 memoized magnifying-glass asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `mt`（source `wDt`，121573-121577）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `dt`（source `EDt`，121604-121608）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `lt`（source `ODt`，121635-121639）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `ct`（source `ADt`，121666-121670）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `at`（source `MDt`，121697-121701）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `rt`（source `PDt`，121728-121732）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `tt`（source `IDt`，121759-121763）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `et`（source `RDt`，121786-121790）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `Q`（source `BDt`，121817-121821）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `X`（source `HDt`，121844-121848）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `q`（source `WDt`，121875-121879）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `G`（source `KDt`，121906-121910）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `U`（source `JDt`，121937-121941）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `H`（source `XDt`，121968-121972）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `B`（source `QDt`，121995-121999）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `R`（source `eOt`，122022-122026）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `I`（source `nOt`，122053-122057）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `P`（source `iOt`，122084-122088）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `M`（source `oOt`，122115-122119）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
