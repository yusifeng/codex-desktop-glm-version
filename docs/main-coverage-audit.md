# Main chunk 全量覆盖审计

## 2026-11-01 Library projectless-output backend restoration

新增 `files/library-files-backend.ts`，补齐上一批 Library 安全访问层的 upstream owner：projectless thread 分页、assignment/projectless admission、
missing-thread promise/negative TTL cache、8-way existence lookup、workspace hint/default/configured roots、WSL path projection、shared output attribution、
realpath/symlink containment、递归文件 metadata 扫描和 generated-images allowlist 均迁入同一 backend。WindowContext 的 workspace scope 与 Library RPC
consumer 均改接 factory，主 chunk 约 260 行旧实现删除；42 条 focused 状态/文件系统/分页/缓存/接线断言通过，防空壳审计扩至 49 条。

## 2026-11-01 desktop host/file services and dictation audio restoration

新增 `files/desktop-file-services.ts`，整体迁出 app-server client registry、file attachment temp persistence、validated renderer/native file drag、
Library allowlisted realpath/file-identity access、private preview lifecycle、serialized Quick Look/Electron thumbnail generation 及 RPC facade。同步将
`dictation/audio.ts` 从未接线且固定返回 `null` 的 partial skeleton 恢复为真实 CoreAudio route/device/property-buffer owner，并由 WindowContext 的
现有 consumers 真实消费两组 factory。主 chunk 约 425 行旧实现物理删除；54 条 focused 文件系统/拖拽/CoreAudio/接线断言通过，防空壳审计扩至
44 条。

## 2026-11-01 Electron message handler restoration

新增完整 `window/electron-message-handler.ts`，迁出真实 `r$e` 的 56-method message owner：app-server request/response routing、shared-object
subscriptions、dynamic tools、project/worktree lifecycle、browser host/session coordination、sampler、power-save/system-focus、window restore、默认 workspace
创建及 cleanup 均保留；主 chunk 原 class/helper 区约 1,830 行删除并替换为显式依赖工厂。48 条 focused 行为/结构/接线断言通过，防空壳审计扩至
36 条；迁移同时修正 sampler logger 的反编译参数遮蔽。

## 2026-11-01 browser session registry and route host restoration

新增完整 `browser-use/session-registry.ts`，将此前删除的 30-member partial skeleton 替换为真实 `cX` registry 与其唯一创建的 `ZYe`
BrowserUseHost。session capture/bind/reassign/local-Work adoption、window/page/guest snapshots、debug ledger、route/host disposal、cursor/download/page
notifications、native-pipe backend startup/disposal 和 host page/viewport/navigation delegation 均迁入同一状态 owner；主 chunk 原 class/helper 区约
1,258 行删除。39 条 focused 断言执行 route/page/host/native-pipe lifecycle，防空壳审计扩至 32 条。

## 2026-11-01 browser comment controller owner restoration

新增完整 `browser-sidebar/browser-comment-controller.ts`，替代此前已删除的 8-member partial skeleton，并迁出真实 `hGe` 的 59-method/
68-member controller：popup claim、runtime/overlay message routing、comment/design editor、multi-anchor、direct/saved screenshot、CDP provenance、
runtime snapshot sync、waiter/abort/WeakMap 状态与 close cleanup 均保留。依赖边界显式复用 overlay owner、browser delegate 和既有 anchor/design/
screenshot helpers，不复制 thread/page 状态。主 chunk 原 class 约 1,597 行删除；36 条 focused 行为/结构/接线断言通过，防空壳审计扩至 29 条。

## 2026-11-01 browser comment overlay lifecycle owner restoration

新增完整 `browser-sidebar/browser-comment-overlay-manager.ts`，替代此前已删除的 11-member/no-op skeleton，并迁出真实 `JWe` 的
session/open/prepare、renderer window claim、owner focus/visibility、preview/editor interactivity、annotation selection input、conversation transfer、
dismiss/close、placement geometry、listener/timer cleanup 与 anomaly ledger。主 chunk 原 class/helper 连续区约 1,058 行删除，`hGe` 真实 consumer
继续通过兼容绑定构造；42 条 focused lifecycle/结构/接线断言和 26 条防空壳断言通过。

## 2026-11-01 Linux applications and desktop-entry owner restoration

新增 `platform/linux-applications.ts`，完整接管 XDG data/application roots、desktop entry 解析与显示门控、TryExec、GIO content-type/MIME、
默认浏览器、应用去重、icon theme/inheritance/pixmaps 及 realpath containment。主 chunk 原 `iO…vO` 约 336 行实现已替换为具名 runtime；
`util/app-paths.ts` 原永远返回 null 的 Linux icon stub 同时改接真实 resolver。24 条 focused 断言使用临时 XDG 目录和 fake GIO 执行主要分支。

## 2026-11-01 OpenInService owner restoration

新增完整 `misc/open-in-service.ts`，把打开目标的发现/缓存、worker 参数、图标与目标 enrichment、偏好读取和持久化、URL/system-default、
browser panel、远端路径、本地目录、Office/native document、编辑器与文件管理器路由全部迁入具名 owner。WindowContext 的真实 consumer 已改接
该 owner，主 chunk 原 `f6e…k0` helpers 与 `N0` class 共约 372 行重复实现删除；42 条 focused 行为/接线断言和 23 条防空壳断言通过。

## 2026-11-01 thread edit and fork lifecycle restoration

将 `threads/operations.ts` 从 338 行 facade 恢复为真实运行 owner：edit 现执行 follower 委托、owner/settings gate、latest-message/in-progress
校验、revert/rollback、profile 权限合成与 turn restart；fork 现恢复版本/history gate、trace、notification deferral、conversation materialization、
canonical history、metadata/token-budget/thread-reference 继承、side-conversation boundary、resume/project/placement 同步和 projectless 收养。
新增 `threads/fork-placement.ts` 接管本地 saved-section 相对顺序、app-server section replica/rollback 及手动 project order；同时统一
token-budget storage key。主 chunk `tx…Iye` 573 行旧副本物理删除，focused suite 执行 48 条行为/接线/旧定义缺席断言，cleanup 扩至 165 条。

## 2026-11-01 maybe-resume state machine consolidation

主 chunk 后续仍消费的 `xx/Cx` 已分别改接 `resolveResumeCwd` 与 `mergePermissionSettings`；resume 主状态机由
`AppServerConversationManager` 直接消费 `threads/maybe-resume.ts` 的完整实现。原 `xx…Cx` 与 `Rye…zx` 两段约 1,195 行重复实现删除，涵盖
writer closing retry、timeline/paginated/durable history 装载、ownership 竞态、workspace/permissions 合并、goal hydration 和失败恢复。
focused suite 执行 56 条 helper/早退/接线断言，conversation cleanup 增至 149 条。

## 2026-11-01 thread archive and history support owner consolidation

`threads/archive.ts` 已从薄弱的动态调用 facade 恢复为具名、类型化 archive lifecycle：context 装配、local/remote inactive fallback、desktop
thread-attachments admission、managed/configured worktree root 判定、canonical cwd 回退、no-rollout fallback、thread-missing metadata 清理、pin placement
撤销和 unarchive ownership 顺序均与原实现对齐。相邻 `turns/history-boundaries.ts`、`threads/state-normalization.ts`、
`threads/stream-roles.ts::SubscriptionRegistry` 与 item-notification tail invalidation 已有真实 consumer；主 chunk `qge…hb` 约 445 行重复区物理删除。
focused coverage 为 archive 46、history support 34、conversation cleanup 137 条断言。

## 2026-11-01 canonical history and history request runtime consolidation

主 chunk 的 canonical island/entity 访问、tail history 构建、boundary topology/gap、conversation turn 应用与定位，以及 items/turns/timeline
分页、durable host 全量装载、resume snapshot merge/reconcile 已统一改接 `turns/canonical-history.ts` 与 `turns/history-requests.ts`。
原 `Eg…Gge` 连续区约 1,312 行物理删除，外部仍用的 `Eg/Og/kg/Ag/Ng/Pg/p_/m_/Ug/w_/j_/Hge/N_/P_/Gge`
运行时符号均直接绑定命名导出；71 条 focused 断言覆盖 topology、boundary、canonical/legacy 访问、分页游标、timeline 保留和 resume 对账，
124 条 cleanup 断言锁定旧定义缺席。

## 2026-11-01 turn/item merge owner consolidation

主 chunk 的 item id/text 对齐、snapshot/prepend 锚点插入、memoryCitation 保留、turn id 分段插入、resume pagination reconnect、终态保护、
steering orphan recovery 和 automation params/message 判定已统一改接 `turns/item-merge.ts`。`bg/xg/Sg/Cg/xge/wg/Sge/Cge/Tg/wge`
约 246 行旧实现物理删除；该 owner 现同时服务主运行 chunk、canonical history、history requests/reader/policy 与 maybe-resume，不再存在双轨状态。
focused suite 以 39 条断言执行关键合并分支，并通过 107 条 conversation subowner cleanup 接线审计。

## 2026-11-01 catalog, eviction and steering owner consolidation

主 chunk 的 local thread catalog projection 已改接 `thread-catalog/schema.ts`；conversation eviction、一次性 update handle、stream role equality
以及 steering message opening/upsert/orphan recovery/server acceptance 改由既有完整 owner 服务真实 consumer。新增
`threads/reference-capability.ts` 并同步接入 archive/AppServer manager，消除三处 storage key 构造分叉。旧 `she…_he`、`Oh…Jhe`、
`yge…yg` 约 205 行物理删除；conversation subowner suite 新增 23 条 wiring/lifecycle 断言至 96 条，catalog store/sync 回归通过。

## 2026-11-01 untrusted app input and generated image evidence owners

将此前仅做字符串拼接的 `conversations/untrusted-input.ts` 与只统计表层图片的 `image-placeholders.ts` 恢复为完整 owner：严格解析 app sender/
message/model-context attachment，校验受支持 base64 image data URL，生成并认证 text-element placeholder，按 UTF-8 字节范围防止可见文本篡改；
browser/PDF comment evidence 现按 element/region/text/virtual、多选与目标文案生成，并能把 prompt comment sections 与相邻 image/localImage 反向
匹配后从 raw user text 剥离。主 chunk 同时接回 `prompts/section-markers.ts` 和 `turns/steering-merge.ts` 的构造/匹配 consumer，约 650 行旧副本
删除；47 条 focused 断言覆盖 encode/decode、拒绝路径、图片配对、占位清理与 wiring。

## 2026-11-01 startup state, recovery and platform owners

新增 `startup/react-devtools-extension.ts`、`legacy-remote-control-config.ts`、`app-server/sqlite-recovery.ts`、
`sqlite-state-reconciliation.ts`、`startup/child-process-gone-diagnostics.ts` 与 `bundled-git-environment.ts`，并将既有
`misc/remote-control-state.ts` 接回全部真实 consumer。恢复的边界包括按 profile/数字版本发现扩展、config batchWrite ledger、恢复提示的启用前
排队/去重/串行、SQLite threads/edges/dynamic-tools 原子合并与 rollout cwd 修复、GPU/audio/launch-failed 分类及 60 秒日志限流，以及 patched
OpenAI Git 检测和 bundle env 注入。主 chunk `Ou…Oue` 约 536 行连续旧实现已删除；48 条 focused 断言覆盖行为、事务与启动接线。

## 2026-11-01 project local-data migration owner

新增 `projects/local-data-migrations.ts`，以明确的 LocalProject/RemoteProject/store/migration 类型恢复六个按序 migration：remote string project、
automation targets、legacy local projects、automation remap、browser download cleanup 与 metadata repair；保留每个新 automation project 的即时 flush
及 migration ledger 的逐项 flush。启动 consumer 已改接 `runLocalDataMigrations`/`clearLegacyBrowserDownloadHistoryOnStartup`，旧 `ece…Du`
约 634 行删除；focused suite 执行 30 个状态与接线断言。

## 2026-11-01 avatar overlay and remote-hosted PIP owner consolidation

`avatar-overlay/composition-surface.ts`、`realtime.ts`、`geometry.ts` 与 `pip.ts` 已直接接回启动装配和 WindowContext，PIP 工厂显式注入视频频道；
主 chunk `zu…Nd` 约 1,076 行几何、窗口常量、PIP visibility/native-video/host lifecycle 副本物理删除。迁移审计修复 semantic PIP
活动 add/remove 判定、complete/invalidate turn、两类 native handler、targeted refresh、active-thread dedupe、host/thread rebinding 及 interaction/placement 参数透传；focused
suite 执行 visibility ledger、macOS handler 安装、聚焦 host 注册和 native call 去重，并锁定旧定义缺席。

## 2026-11-01 dev process lifecycle and installer attribution owners

新增 `startup/dev-process-lifecycle.ts` 接管 `Yoe/Xoe/Zoe/Qoe`，保持 signal 0 的 ESRCH 特判、父进程轮询一次性 dispose、will-quit cleanup
和 webview process-group fallback；`misc/installer-attribution.ts` 的安全文件读取 owner 直接接回 `au` consumer。主 chunk `Hoe…au` 约 199 行
删除，内嵌且无剩余 consumer 的 tray 文案常量一并清理。focused suite 验证所有进程与 marker 分支及启动 wiring。

## 2026-11-01 startup attribution and PIP turn lifecycle owners

新增 `startup/app-entry-attribution.ts` 与 `computer-use/pip-turn-lifecycle.ts`，分别接管原 `Foe` 激活归因状态机和 `Noe/Poe` turn cleanup；
`browser-use/migration.ts` 与 `computer-use/app-resolution.ts` 的既有完整实现同步接回。主 chunk `rl…il`、`Coe…Voe` 两段约 300 行旧实现
删除。focused suite 覆盖 installer 首次归因、deep-link/foreground generation、source attribution、completed/failed PIP 分流及 unsubscribe 返回契约。

## 2026-11-01 native app, PIP and browser navigation owners

`windows/native-app-icons.ts` 现直接服务全部 Windows icon/Sky addon/PIP/Chrome focus consumer；新增 `browser-use/navigation-restriction.ts`
接管原先未独立落地的 `Qc/$c/Vae/Hae/Uae/Wae`，并复用语义 link-opening 本地 URL 判定与 site-data chrome URL 开关。主 chunk
`kae…Wae` 约 1,173 行旧实现删除。focused suite 验证 local subframe、blank-like URL、active policy、block callback、平台门控及 native-video
addon 参数转发。

## 2026-11-01 computer-use runtime chain consolidation

`computer-use/native-pipe-service.ts`、`browser-use/thread-config.ts`、`misc/automation-thread-config.ts` 及两层 codex-app-tools config 已接管
原 `To…cs` 连续运行链，启动区只保留命名导出绑定。约 1,185 行 selection/schema/server/client/config 重复实现物理删除；focused suite
实际验证非 Windows client 不误启 helper、plugin 变化触发无 reload 同步、自动化线程优先复用 pending reconcile selection，以及 local/remote
codex_app enabled 覆盖分支。

## 2026-11-01 bundled plugin orchestrator and archive owner consolidation

`plugins/orchestrator.ts` 现作为启动区唯一 bundled plugin 编排 owner，`chrome-native-host-sync.ts` 的 cache watcher 和 marketplace descriptor
清单也直接接回。主 chunk `al…hl` 约 793 行旧 descriptor/orchestrator/watcher/Chronicle archive 副本删除；`listObservedPluginStates`
转为正式导出以保持仍存在的注入 consumer。focused suite 验证 dev reconcile 状态键去重、pending 链、两类 thread config 同步、观察状态，
并在临时目录中执行 Chronicle skill/marker 归档及 SHA-256 metadata 写回。

## 2026-11-01 plugin marketplace runtime owner consolidation

本批把 `plugins/marketplace.ts`、`chrome-native-host-sync.ts`、`cua-repl-config.ts` 与 `computer-use/app-resolution.ts` 作为一条运行链接回，
覆盖 marketplace 选择/物化/install/reconcile/remote sync、stale cache、managed marker、native-host/skill 同步、CUA REPL 配置以及 Sky app
路径/env 判定。主 chunk 的 `Di…Sne` 和 `wa…wo` 连续旧实现删除；`reconcileMarketplaceRoot` 补成正式导出供现存远端 consumer 使用。
focused suite 执行真实配置文件原子更新，并验证关键选择、脱敏和安装分支及所有 runtime wiring。

## 2026-11-01 browser runtime resolution owner consolidation

`plugins/browser-runtime-resolution.ts` 现独立拥有 bundled plugin 根目录/强制重载、Chrome 渠道、PATH 与 Windows 应用发现、商店链接、
Chromium profile/扩展检测，以及 computer-use/visualize bundled 内容变体。main 仍在应用 opener、marketplace 与 materialization 真实路径上
消费这些导出；原连续 `Cne…Qne` 和 `$ne…tre` 定义物理删除。focused suite 不只做静态 wiring 检查，还在临时文件系统中执行 executable
解析、sibling fallback、live skill 删除、manifest variant 写回和 audio skill 注入。

## 2026-11-01 dynamic app tools and host services native-pipe owners

新增 `native-pipe/dynamic-app-tools-server.ts` 与 `host-services-server.ts`，分别接管原 `Hse/Use/Wse/tu/Gse` 和 `Hce/Uce/Wce`。两者保留 8MiB
frame limit、0600 权限、peer/socket diagnostics、JSON-RPC invalid/error contract；dynamic tool owner 额外保留 allowlisted namespace projection、
type-stable cancellation key、AbortController 无响应取消和 dispose fan-out，host services 保留 unsupported/empty result 语义。desktop startup consumers
已直接调用语义工厂并显式注入 peer authorizer，旧定义与 `ql/Ql/Bl` 兼容别名删除；真实 socket focused suite 覆盖 list/call/invalid 与 service branches。

## 2026-11-01 native-pipe foundation and browser server restoration

主 chunk 的 Browser Use RPC/config 与 `Bl…zse` 共约 925 行 JSON-RPC admission、command dispatch、framing、stream decoder、pipe client/server、
Chrome provider discovery、socket routing、路径清理与 macOS peer authorization 已由 `browser-use/rpc-client.ts`、`native-pipe/protocol.ts`、
`server.ts`、`peer-socket-authorizer.ts` 替代；保留旧 dynamic-app-tools/node-repl consumer
所需的三个兼容绑定，定义主体物理删除。原 `browser-use/native-pipe-server.ts` 的 dependency-only skeleton 同步恢复为真实生产 owner，补齐日志、
schema admission、失败清理和 async close，main 的 Browser Session Registry 改接语义工厂并删除 `JYe`。focused suites 覆盖帧拆包、分片、超限、
真实 socket client-id 路由、事件转发、WebMCP guard、启动失败与 consumer absence。

## 2026-11-01 turn control large-batch consolidation

本批一次核对并删除约 1,300 行连续旧 owner：runtime/workspace state 推导、turn 权限与 dispatch、unconfirmed submission、turn start、steer/stop。
AppServerConversationManager 已真实消费 `workspace-resolution.ts`、`turn-dispatch.ts`、`turn-steer.ts`；focused suite 锁定语义导出、consumer wiring
与压缩定义缺席。相邻 session-recorder 四个别名也被直接命名 consumer 替代。

## 2026-11-01 conversation/realtime/automation large-batch consolidation

本批不按微小 owner 拆提交，一次核对并移除 2,489 行 dead duplicate：realtime parser/state、stream replay buffer、goal resume、notification
deferral、unread/prewarm、conversation creation helpers、queued-follow-up factory、turn-context 全链和 marked/push 副本。`eCe` 唯一远端 consumer
改接 `controlFallbackValue`；原未迁出的 `xwe` 落为 `automations/inbox-items.ts`，桌面启动改接 `InboxItemsFacade`；push consumer 改接
`notifications/push-registration.ts`。focused suites 覆盖 realtime XML、三类 deferral owner、queued factory、control fallback 与 inbox lifecycle。

## 2026-10-31 server request owner restoration

语义 `Pye` 原为不读取真实 options 的空 handler。现恢复审批请求入队/事件、user input synthesis、option/context picker、codex_app pending
tool admission/invalid response、dynamic execution、elicitation parse/auto-approval/dedupe 与同步响应。hydration 新增共用 dynamic tool validator，
item-synthesis 补齐未完成 userInputResponse；focused suites 覆盖关键分支。旧 `Pye` 与无剩余 consumer 的 `Ghe` schema/parser 簇删除。

## 2026-10-31 goal todo carryover subscription restoration

语义 `ib` 原先错误地尝试从不存在的 requestClient 订阅通用通知，完全漏掉旧 owner 的 plan carryover 状态机。本轮恢复 plan capture、
continuation turn 克隆、inferred/forced admission、goal identity 与 user item invalidation、archive/delete cleanup，以及终态 todo pending 化；
focused suite 覆盖跨 turn 深拷贝和 completion 状态转换，旧 `ib` 删除。

## 2026-10-31 synthetic worktree turn and canonical append restoration

旧 `Ry/Hy/Uy` 的语义 skeleton 曾把新 synthetic turn 错设为 inProgress，且 canonical-history 的 `appendConversationTurn` 仅由 consumer
动态读取、实际未导出。本轮恢复 completed turn 全字段、权限继承、latest-turn append 与 canonical live-tail island 创建；三个 consumer
全部改用真实命名导出，主 chunk 唯一旧调用接回语义 owner 后删除 `Ry/Hy/Uy`。新增 focused suite 覆盖 legacy/canonical append。

## 2026-10-31 realtime timeline reducer restoration

语义 outer reducer 原先完全漏掉旧 `jy`，导致 canonical voice timeline 不记录 turn/item/realtime 生命周期与 transcript delta。本轮恢复完整
timeline upsert/replacement，focused suite 验证 turnStarted entry；删除 old `Yve/jy`，但保留仍有独立主 chunk consumer 的 realtime
item parser/text builder，后续接线时再删除。

## 2026-10-31 notification item reducer restoration

item reducer 现覆盖 started/completed 的 turn 定位、steering、collab/image、compaction、计时、terminal 与 subagent 副作用，并恢复 auto-review/
strict/guardian/MCP progress。focused suite 验证 command start/completion 和 automatic review；删除 old `ky/Ay`、review helper 与已由
`delta-queues.ts`/`item-notifications.ts` 真实消费替代的死 delta queue，保留仍有主 chunk consumer 的 realtime parser 与 `jy`。

## 2026-10-31 notification turn completion restoration

`turn/completed` 现恢复旧 `tb` 的 drain/replay、terminal cleanup、plan metrics/implementation、automation decision、goal continuation、unread 与
completion event 顺序；focused suite 验证状态、unread 和 snapshot。完成后删除旧 `tb`、其专用 automation/hook helpers 以及无 consumer 的
旧 synthetic helpers；仍被主 chunk consumer 使用的 `Ry/Hy/Uy` 保留，避免越界删除。

## 2026-10-31 notification turn reducer restoration

在 outer reducer 接回后，本轮继续恢复除 completed 外的 turn 通知：started 会重绑/合成 turn、投影最新配置、完成旧 plan implementation、
清理跨 turn plan requests 并广播 snapshot；diff/plan/safety/hook/reroute/error 使用真实 updateTurnState consumer。

## 2026-10-31 notification reducer outer owner repair

语义 `nb` 原先绕过 follower mutation gate、resume/start buffer、turn observation、lifecycle 与 item stream，仅 emit 后处理三类 archive 方法。
本轮恢复旧 outer reducer 顺序及完整 thread notification 子 reducer，接回现有 ItemNotificationHandler/open-file/realtime consumers，删除 main
旧 `nb/rb`；focused suite 验证 reconnect、buffer/ignore、settings/status、delta、realtime 与 fs fan-out。
随后补齐 `serverRequest/resolved` 的三类 request completion，并删除已由 semantic reducer 覆盖的旧 `My/Ny/Py`。

## 2026-10-31 interrupt owner repair

语义 `Ove/Ave` 原先只找 legacy active turn、单发 interrupt，且 descendant 无状态门或远端 fallback；这会漏 canonical turn、mismatch retry、
Node REPL 清理与未装载 subagent。本轮恢复旧 `my…jve` 控制流并删除 main 旧簇，focused suite 覆盖正常 interrupt、服务端 active-turn
错位重试、idle terminal cleanup、本地 descendant 与远端 `listThreadTurns/interruptTurn` 回退。

## 2026-10-31 search-match hydration owner repair

语义 `bve` 原先是单行 `broadcastConversationSnapshot` 占位，搜索结果打开时不会加载 cursor 周边 turns、补齐目标 item 或放置 canonical
history island。本轮恢复旧 `bve/xve/Sve` 的双向分页、权限投影、时间/anchor 排序、island merge 与错误语义，删除 main 旧簇；focused
suite 构造真实 canonical search match，验证 entity、island 与 snapshot 均落地。

## 2026-10-31 archived preview owner cleanup

语义 `ArchivedThreadPreviewRead` 与旧 `yve` 行为逐支一致，但原模块反向导入 re-export 它的 `history-policy.ts`，形成不必要的 CJS cycle；
同时 semantic `uy` 直接取最后 island，弱于旧 `Eg` 的 exhausted-tail 门。本轮内聚 preview helper、统一 exhausted-tail 判定并删除 main
旧 `vve/yve/uy` 死簇；focused suite 锁定非 exhausted island 只保留本地 draft 与循环依赖消失。

## 2026-10-31 fork rollback and history owner repair

`threads/fork-rollback.ts` 原实现仅循环 legacy pagination、清空少量字段并过滤 `state.turns`，遗漏 follower revision 同步、bounded durable、
canonical history、read-response projection 与 thread metadata。本轮按旧 owner 恢复完整 load/rollback/revert 流，并发现 manager wrapper 将
ownerClientId/revision/timeout 参数整体错位的实际缺陷；修正后删除 main 旧七函数簇，以 focused suite 覆盖 legacy/canonical 与同步路径。

## 2026-10-31 fork and follower dispatch owner repair

`threads/operations.ts` 的 `uve` 原先无条件直接 `thread/fork`，漏掉旧 AppServer 兼容所需的 complete history、target 定位、rollback 应用、
fork synthetic item 与 synchronization failure 合并；follower dispatcher 也仅覆盖少数请求。本轮恢复两条完整控制流，修正 complete-history
判断对不存在 manager 方法的调用，删除 main 旧 `uve/dve`，并以 focused suite 锁定现代/旧版 fork 及 follower start/settings/interrupt/history。

## 2026-10-31 open-file watch registry repair

语义 `OpenFileWatchRegistry` 原先在 MCP watch start 失败后保留错误资源状态，pending ignore 永不清理，且异步失败可能删除已替换 watch。
本轮恢复旧 rollback/scheduling/identity guard，保持 AppServer manager 真实 consumer 并删除 main `sve/cve/oy/sy` 重复簇；focused suite
覆盖 watch/unwatch、change messages、ignore window 与回滚 wiring。

## 2026-10-31 thread execution state projection repair

语义 `ove/ry/iy` 原先只看 legacy turns，且遗漏 misalignment policy violation 和 turn configuration。本轮改用 canonical-history owners，
恢复旧 resume/runtime/unconfirmed 判定与 model/effort/service-tier precedence，将 main consumers 接回并删除旧定义；focused suite 覆盖
canonical active turn 和完整 execution snapshot。

## 2026-10-31 follower delegation owner repair

语义 `ave` 原先省略 settings wait、owner-role gate 与 local compact fallback，并把底层 null 包成 truthy `{result:null}`，导致 owner recovery
后 compact 静默丢失。本轮恢复旧 `ny/ave` 完整控制流、修正泛型返回约束，将 main `ny` consumers 接回并删除旧定义；focused suite 覆盖
正常委托、owner 丢失恢复、本地接管和成功不重复执行。

## 2026-10-31 attachment upload owner cleanup

`attachments/upload.ts` 的 `FileAttachmentUploader/ThreadGoalAttachmentDirectories` 已由 AppServer manager 使用，但 registry 读取原先只校验
root prefix，弱于旧 `UUID/filename` 约束。本轮恢复严格 managed-path 判定并删除主 chunk 无引用 `q_e…ive` 簇；focused suite 覆盖 direct/
SFTP、超限错误、同名命名、owned directory 和 manager wiring。

## 2026-10-31 main approval synthesis wiring

修复 semantic owner 后，本轮补齐主 chunk 实际仍调用的 `Yv/Xv/L_e/Zv/Qv` 兼容面，将 plan implementation、自动 elicitation、MCP 与
permission request 合成 consumers 接回；其余旧符号仅在旧簇内部互调。完成接线后删除 `Uv…W_e` 整簇，focused suite 覆盖安全门、
timeline upsert、兼容 require 与全部旧函数消失。

## 2026-10-31 request item-synthesis owner repair

`requests/item-synthesis.ts` 原为结构占位，实际 manager consumer 会跳过 follower delegation、MCP safety/equivalent connector auth 与正确
dynamic option-picker response，自动 user-verification 更会立即伪报 accepted。本轮恢复旧 `M_e…W_e` 核心语义，manager 直接使用完整
auto-approve factory，修正 elicitation item 参数错位并删除主 chunk 死 `G_e/K_e`；focused suite 覆盖 owner/follower、user input、dynamic tool、
unsafe MCP 与 wiring。

## 2026-10-31 ThreadStore local helper cleanup

主 chunk `T_e/Iv/E_e` 已无任何读取；等价的 history invalidation 与 recency comparator 位于语义 `ThreadStore`，分别由 canonical patch
notification 和 recent conversation sorting 真实消费。本轮删除三个旧符号，focused suite 锁定旧符号消失及两个调用点。

## 2026-10-31 transcript snapshot/delta cleanup

`threads/hydration.ts` 已完整承接旧 `C_e/Nv/w_e/Pv/Fv`，并由 `ThreadStore` 的 transcript reset/patch 路径真实消费；旧主 chunk 簇
仅内部互调且无外部引用，本轮整体删除。focused suite 锁定稀疏 item slots、snapshot 索引、同引用无变化与 null previous reset。

## 2026-10-31 fork conversation skeleton wiring

主 chunk 的 fork result 仍调用旧 `Ov(Av(...))`，而 `ThreadStore` 已真实消费 `threads/hydration.ts` 的 conversation skeleton 与 mode
projection。本轮将该 consumer 接回；由于旧 `Av(thread,startKind,hostId,mode,recognition)` 忽略 hostId、语义版采用四参数签名，调用点
同步移除多余 hostId，避免 mode 错位。旧 `Ov…Mv` 簇删除，focused suite 锁定 mode、skeleton 与调用签名。

## 2026-10-31 timeline item predicate cleanup

`threads/timeline-index.ts` 已提供旧 `_v/vv/__e/yv/bv/xv/Sv` 的逐函数等价实现，并由 `ThreadItemIndex` 与 hydration 真实消费；旧主 chunk
定义已无引用，本轮删除该死簇。focused suite 执行验证 terminal transient、automation、message/activity/reasoning 与两类 create-thread
判定，并锁定旧符号不再回流。

## 2026-10-31 pending interaction owner repair

`threads/hydration.ts` 原先使用不存在的 `request_user_input/setup_codex` 名称、未验证 onboarding 参数且把所有 environment input 都视为
pending。本轮恢复旧 schemas 对应的严格验证与 invalid response，将 main `fv/pv/mv` consumers 接回并删除旧 `fv…h_e` 簇；focused
suite 覆盖环境输入、onboarding、setup step 与 complete 非 pending 分支。

## 2026-10-31 subagent metadata and ancestry wiring

`threads/hydration.ts` 已覆盖旧 `f_e/av/p_e/m_e/ov/sv/cv/lv/uv/dv`，但 receiver propagation 的 semantic 版本只遍历 legacy turns。
本轮修复为 canonical/legacy `forEachTurn`，将 main register/ancestry consumers 全部接回并删除旧簇；focused suite 覆盖 canonical
receiverThreads 更新、parent/descendant/subagent 与 surfaceability。

## 2026-10-31 hydration input and turn projection wiring

`threads/hydration.ts` 已完整实现旧 `o_e…iv` 的 attachment/image/read-response/turn projection 链，本轮将 main 的 `X_/Z_/$_/ev/tv/nv/iv`
真实 consumers 接回并删除旧 schemas、parsers 与 private transforms；focused suite 覆盖附件、image src、cwd、permissions、timestamps、
collab receiver projection 和 turn defaults。

## 2026-10-31 automation and thread-error owner unification

main 的 `J_/n_e/Y_` 与 `automation-detector.ts` 重复，ThreadStore 又保留了只识别 Error.code/字面 regex 的 thread-not-found 分支。
本轮统一两类 consumers 到 semantic owners，删除旧 heartbeat helpers/detector 与无引用 meta snapshot 簇；focused suites 新增 heartbeat、
automation input、gRPC error 和 ThreadStore alias 证据。

## 2026-10-31 thread projection and errors owner wiring

`threads/projection.ts` 的 summary/subagent/title/time/environment helpers 与 `misc/thread-errors.ts` 已有真实 semantic consumers，本轮将
main 剩余 `V_/H_/$ge/Cv/wv/v_e/Tv/Ev/Dv/me/Xt` consumers 统一接回并删除旧重复簇；focused suite 覆盖 skeleton、投影、版本门、
gRPC thread-not-found 与 interrupt response。

## 2026-10-31 canonical voice history owner unification

conversation creation 原先把不存在的 `projectionModule.isCanonicalVoiceHistory` 强转后直接调用，是实际 thread creation 崩溃点。本轮将
creation、hydration/thread-store、maybe-resume、projection 与 main `q_` 全部统一到 `automation-detector.ts` 的版本门实现，并删除旧
`q_`；focused suite 覆盖 fork/history/version 四重 gate 和所有关键 wiring。

## 2026-10-31 thread start/resume config owner repair

`src/main/main-app/threads/start-config.ts` 的 `gx/xye` 原先仅复制输入或返回调试对象，导致新建与 resume 丢失 base config、shell policy、
dynamic tools、instructions、personality、permission preservation 与 token-budget semantics。本轮恢复完整组合链，conversation creation、
AppServer resume 与 main `mx/yx` consumers 统一接回，删除旧 `ux…Cye` 约 480 行簇；focused suite 锁定配置合并与双 consumer wiring。

## 2026-10-31 default turn config owner repair

`src/main/main-app/threads/start-config.ts` 的 `wye` 原为只存内存变量且写入错误 schema 的占位实现。本轮恢复 Copilot bypass、ChatGPT
account/auth gate、fast-mode requirement、profile 合并、model tier fallback、串行 profile-aware config writes 与 model/effort 双写；
AppServer manager consumer 保持接回并删除主 chunk 旧 `wye`，focused suite 覆盖读取门控、写串行化和变更通知折叠。

## 2026-10-31 thread settings patch owner repair

`src/main/main-app/threads/patch-classification.ts` 原先把 metrics 压成三个非原始字段，并丢失 collaboration mode/effort 合并、permission
profile 映射与 last-turn model-change ledger。本轮恢复旧 `D_e/O_e/zv/Bv/Vv/k_e/A_e/j_e/Hv` 的完整语义，AppServer manager、
conversation creation 与主 chunk consumers 统一接到该模块，删除旧 199 行簇；focused suite 覆盖字段投影、模型往返与全量 metrics。

## 2026-10-31 manual context compaction owner repair

`src/main/main-app/threads/context-compaction.ts` 原先只遍历 legacy `conversation.turns`，会漏掉 canonical history，且不会删除清空后的
本地 in-progress 占位 turn。本轮改为复用 `findDraftTurn/removeTurn`，恢复旧 `Bve` 的双历史路径与最后 draft 清理语义；真实 AppServer
manager consumer 保持接回，主 chunk 无引用的 `Sy/Bve` 簇删除，focused suite 覆盖计数、source 消费、canonical 定位和空 turn 移除。

## 2026-10-31 thread history policy owner repair

`src/main/main-app/threads/history-policy.ts` 的旧 `Cve` 占位实现已替换为 `AUTOMATION_DETECTOR`、`mergeTurnLists`、
`projectItems/projectTurns/attachmentsFromInput` 的真实组合，并由 AppServer manager 消费；本轮删除主 chunk 无引用的 `Cve/wve/Tve`
簇。focused suite 锁定 policy identity、projection delegation、merge options、oldest attachments、limit 分支与 manager wiring。

## 2026-10-31 conversation stream subscription cleanup

`src/main/main-app/app-server/stream-subscription.ts` 的 `ConversationStreamSubscription` 已由语义 AppServer manager 与
queued-follow-ups 使用，主 chunk `Sm/Cm` 已无引用。本轮删除旧 102 行重复 owner；focused suite 覆盖 fallback、using dispose、
幂等 cleanup、RPC broken、背压期间串行消费及 changes 合并。

## 2026-10-31 app-server operation handle cleanup

`src/main/main-app/app-server/operation-handle.ts` 的 `AppServerOperationHandle/CancellableOperationHandle` 已由语义
`AppServerConversationManager` 的 login/device-code/sandbox consumers 使用；主 chunk `Lv/Rv` 已无引用。本轮删除旧 27 行重复
classes；focused suite 覆盖 start result、completion/null、cancel/dispose abort 与真实 manager wiring。

## 2026-10-31 desktop feature availability owner wiring

`src/main/main-app/misc/availability.ts` 已完整覆盖旧 `_r/kte/vr/yr/br/xr/Sr/Cr/wr/Tr/Er/Ate/Dr/Or/jte/kr/Ar/Mte`。
本轮接回 main 所有读/写/订阅 consumers，删除旧 187 行 schema+mutable ledger，避免已迁模块形成第二状态源；focused suite 覆盖
loading→ready、两类通知/退订、无差异更新、Windows override、Dev strict JSON、platform gate 与 startup wiring。

## 2026-10-31 browser-use autocomplete/menu owner wiring

`src/main/main-app/browser-use/autocomplete.ts` 已覆盖旧 `PD/yke/bke/xke/Ske/FD/ID/Cke/wke/LD`。本轮修复 favicon promise
cache、RPC using scope 与 menu stream cleanup 三处偏差，接回 startup/WindowContext/BrowserHost 三个消费面并删除旧 361 行簇；
focused suite 覆盖菜单投影、同 favicon 去重、异步更新、data HTML 过滤、静默关闭释放与关键 wiring。

## 2026-10-31 desktop environment owner wiring

`src/main/main-app/desktop/environment.ts` 已覆盖旧 `lt/ut/iEe/aEe/wT/TT/oEe/sEe/ET/cEe/DT`，保留共享的 flavor wrappers
供 startup 使用。本轮新增轻量 `api/browser-auth-operations.ts`、修正 macOS medium icon 为 `getAppIconMedium`，接回 WindowContext、
about dialog 与 startup icon consumers；focused suite 覆盖 OS/flavor、Sky icon、auth commit/failure、旧 symbols 与全部关键 wiring。

## 2026-10-31 cloud environment filesystem owner wiring

`src/main/main-app/cloud/environment-fs.ts` 已完整覆盖旧 `nH/Wze/rH/iH`。本轮导出并接回 hosted-thread-files 与 durable binary
fetch 两个消费面，删除主 chunk 97 行 schema/service/helpers；focused suite 覆盖 base64、executor guard、absolute/file URL root、
sample limit、越界/symlink 拒绝、hidden filter/sort、旧 symbols 消失与双 consumer wiring。

## 2026-10-31 browser-use execution host owner wiring

`src/main/main-app/browser-use/execution-host.ts` 已完整覆盖旧 `ute/dte/fte/pte/mte/hte/gte/_te`。本轮接回 Git worker target
装配并删除主 chunk 197 行 owner/adapter/handle/batcher 簇；focused suite 覆盖 stat snapshot、路径去重/全失效 flush、promise cleanup、
child dispose/wait、registry cache、旧 symbols 消失与真实 wiring。

## 2026-10-31 Computer Use config writer wiring

`src/main/main-app/computer-use/config-writer.ts` 已完整覆盖旧 `Die/Oie/kie/Aie/jie/es/Mie/Nie/ts/Pie/Fie/Iie/ns/Lie/Rie/zie/Bie/Vie/Hie/Uie/Wie/Gie/rs/Kie/qie/is`。
本轮移除未使用且会引入 marketplace 循环加载的 automation 转发，接回 settings/fetch/startup consumers 并删除旧 123 行簇；
focused suite 覆盖四个触发键、主题/颜色/locale direction、串行队列/原子清理静态证据、alias 与三条真实 wiring。

## 2026-10-31 Browser Settings storage/API owner wiring

`src/main/main-app/browser-use/origin-state.ts` 的 `RemoteBrowserSettings`/`BrowserConfigFile` 与旧 `uke/pke` 均为 5 members。
本轮复用已加载模块接回 BrowserSettingsSync 的两个真实依赖并删除旧 classes；focused suite 覆盖 remote read/PATCH body/principal、
config path/ENOENT、成员面与真实 wiring。

## 2026-10-31 BrowserUseOriginState class wiring

`src/main/main-app/browser-use/origin-state.ts` 的 `BrowserUseOriginState` 与旧 `XOe` 均为 7 members。本轮复用已加载模块接回
`WindowContext.browserUsePermissions` 并删除旧 class，保留仍有其他 consumer 的 helper 簇；focused suite 覆盖 WebMCP/history
forwarding、origin rules write/project、class 面与真实 wiring。

## 2026-10-31 computer-use notify config wiring

`src/main/main-app/computer-use/notify-config.ts` 已覆盖旧 `zo/Bo/rie/iie/aie/oie/sie/Vo/cie/lie/uie/Ho/die`。本轮把
`unwrapPreviousNotifyChain` 修为递归后接回 native-pipe consumer，删除主 chunk 96 行旧簇；focused suite 覆盖双层 helper 链、
custom/null、跨行旧 notify 替换、数组等价、alias 与真实 wiring。

## 2026-10-31 browser-use site data wiring

`src/main/main-app/browser-use/site-data.ts` 已完整覆盖旧 `Wc/Gc/Kc/qc/Jc/Yc/Xc/Zc/el/tl/nl`。本轮接回 partition/session/
startup/navigation consumers，删除两个旧定义簇，并把 navigation policy 的直接 `el` 读取改为 `nl()`；focused suite 覆盖 URL 编码、
语言去重、cookie URL/flush、siteData 映射、timeRange、共享 ledger 与关键 wiring。

## 2026-10-31 ManagedComputerUseService wiring

`src/main/main-app/computer-use/managed-service.ts` 与旧 `Eoe` 均为 24 members，并包含旧 `Doe` process/zombie probe。本轮
接回 startup consumer，删除主 chunk 146 行旧簇；focused suite 覆盖 disabled guard、首次 spawn、live reuse/invalidation、
stale clear、respawn pid/callback、dispose 与 executable path。

## 2026-10-31 computer-use activity tracker wiring

`src/main/main-app/computer-use/activity-tracker.ts` 已完整覆盖旧 `Qce/$ce/Lu/ele`。本轮接回 startup notification consumer 并
删除旧 53 行簇；focused suite 覆盖原生 computer-use、toolSurface metadata、状态去重、turn completion、thread deletion、
onTaskDeleted、dispose 退订/清场与真实 wiring。

## 2026-10-31 in-app browser availability wiring

`src/main/main-app/browser-use/availability.ts` 已完整覆盖旧 `Kse/qse/Jse/Yse`。本轮接回 startup registry consumer 并删除
旧 30 行簇；focused suite 覆盖多页 cursor、100 limit、disabled 命中、Deferred resolve、请求异常 true fallback/warning 与真实 wiring。

## 2026-10-31 cross-instance lock owner wiring

`src/main/main-app/util/cross-instance-lock.ts` 已覆盖旧 `AN/cje/lje/uje/dje/fje/pje/jN/mje/hje/MN/gje/_je/vje/NN/PN/FN/IN/yje/bje/LN/xje/RN`。
本轮修正 claim 竞态后接回 global dictation/hotkey window 两个 lifecycle consumer，删除主 chunk 119 行旧簇；focused suite
覆盖 owner-change 拒绝、force takeover、active higher-priority 拒绝、claim cleanup 与双 consumer wiring。

## 2026-10-31 macOS launch-services owner wiring

`src/main/main-app/mac/launch-services.ts` 已覆盖旧 `Oj/kj/Aj/jj/Mj/Nj/Pj/Fj/Ij/Lj/Rj/zj/Bj/Vj`。本轮补齐动态
`listApplicationsForFile(argument)` 并修正 download notification 的 void 返回后，接回 open-target、browser scan、workspace file、
dock icon 等真实 consumers，删除主 chunk 旧 67 行簇；focused suite 锁定 helper argv/schema、void 返回、五个 alias 与关键 wiring。

## 2026-10-31 computer-use memory summaries wiring

`src/main/main-app/computer-use/memory-summaries.ts` 已完整覆盖旧 `Hj…lM`。本轮将五个查询导出接回 `WindowContext` 的
ChronicleService history/app resolver，并删除主 chunk 240 行重复簇；focused suite 覆盖 10min/6h 文件协议、活跃区间排序、
bundle-id 去重/后台过滤/异常 fallback、五个 alias 与三条 history wiring。

## 2026-10-31 CodexMicroHostService owner wiring

新增 `src/main/main-app/device/codex-micro-host-service.ts`，迁出旧 `Qk/$k/eA/tA/nA/rA/iA/cA` addon probe 与 host service，
保留 `lA` 大型 lifecycle manager。focused suite 锁定 11-member owner，并覆盖跨平台 permission fallback、granted/denied/error、
primary/locked ownership、keys/lighting forwarding、settings URL 与 `WindowContext` 真实 wiring。

## 2026-10-31 BrowserSourceOwnerRegistry wiring

新增 `src/main/main-app/window/browser-source-owner-registry.ts`，完整迁出旧 `rje/ije/EN/DN` 122 行簇。focused suite 锁定
14/6/3-member class 面，并覆盖 account filtering、same-origin replacement、reveal/show、subscription 首次 publish、disposal 与
`WindowContext` 真实 wiring。

## 2026-10-31 QueryCacheHostService owner wiring

新增 `src/main/main-app/window/query-cache-host-service.ts`，用显式注入 shared host base 与 plugin cache invalidator 的 factory
替代旧 `BO`，避免把 main 私有 cache ledger 隐式复制进语义模块。focused suite 锁定 500ms base constructor 参数、host/plugins/base
调用顺序、非 plugins 分支与 `WindowContext` 真实 wiring。

## 2026-10-31 ClipboardService owner wiring

新增 `src/main/main-app/clipboard/service.ts`，与旧 `VO` 精确保持 3 members。本轮接回 `WindowContext` 的真实 clipboard RPC
consumer 并删除旧 class；focused suite 覆盖 macOS bookmark 完整/空值、非 macOS fallback、文本读写与真实 wiring。

## 2026-10-31 ChronicleService owner wiring

`src/main/main-app/chronicle/service.ts` 与旧 `IO` 均为 25 members，并完整包含 `LO/RO` rollback aggregation。本轮接回
`WindowContext` consumer，删除旧 137 行 class/helper 簇；focused suite 覆盖 state、enable config、pause/resume、history、pending
permission 分支与真实 wiring。

## 2026-10-31 BrowserFamilyService owner wiring

`src/main/main-app/platform/browser-family.ts` 与旧 `MO` 均为 7 members。本轮修正非 Dev compatible-extension resolver 的
`undefined` 返回语义，接回 `WindowContext` chromiumBrowser consumer，并删除旧 `AO/jO/MO/NO/PO/FO` 85 行簇；focused suite
覆盖 installed families、extension status/banner、settings/URL forwarding 与真实 wiring。

## 2026-10-31 Windows account owner wiring

`src/main/main-app/platform/windows-account.ts` 已完整覆盖旧 `yO/bO/xO/SO/CO/wO/TO/EO/DO/OO/kO`。本轮以压缩名兼容别名
接回默认浏览器注册表、workspace capabilities、system metrics 与 startup provider consumers，删除主 chunk 59 行重复 addon
加载门面；focused suite 覆盖 platform fallback、admin/standard、diagnostics success/error 与所有关键 wiring。

## 2026-10-31 desktop log archive owner wiring

`src/main/main-app/feedback/desktop-log-archive.ts` 已覆盖原 `kRe…TV`，但审计发现 Windows system diagnostics 仍为 null 占位；
本轮改接 `platform/windows-account.ts#getWindowsSystemDiagnostics`，恢复旧 `CO()` 行为后，将 `URe/TV/wV` 接回 module exports 与
fetch-handler consumer，并删除主 chunk 496 行重复归档簇。focused suite 覆盖 wrapper/null、archive ledger 删除和 export wiring。

## 2026-10-31 Computer Use settings owner wiring

`src/main/main-app/computer-use/approvals.ts` 与旧 `nje` 都有 17 members，但原语义类错误地以 `setCuaAppshotSoundEnabled`
替代了真实 `openChromeExtensionInstallPage`。本轮修正方法面，公开复用 `plugins/browser-runtime-resolution.ts` 的语义
`openChromeExtensionSettings`，接回 `WindowContext` consumer；同时把 `electron-fetch-handler` 的 `tje` 注入接到语义
`setCuaAppshotSoundEnabled` 导出，删除旧 `bM…tje` 453 行重复 I/O 簇。focused suite 覆盖方法面、关键 forwarding 与双 consumer wiring。

## 2026-10-31 avatar pet install owner wiring

`src/main/main-app/avatar/pet-install.ts` 的 `PetInstallManager`/`AvatarManager` 与旧 `wje/Eje` 均为 7 members。本轮接回
bootstrap `Eje` consumer，删除旧 schema、redirect/type/size body validation 与两个 class 的 114 行重复簇；focused suite 覆盖
preview/install 参数与 prepared asset 传递、avatar state/id load、manager forwarding 和 wiring。

## 2026-10-31 export-logs duplicate cleanup

接回语义 `DebugService` 后，主 chunk 的 `Rje` 已无 consumer，`HN/Dje/Oje/kje/Aje/jje/Mje/Nje/Pje/Fje/Ije/Lje` 也只在
该旧簇内部互相引用。本轮删除 126 行重复实现；`src/main/main-app/debug/export-logs.ts` 继续持有日期范围、session 文件筛选、
save dialog 与时间戳归并管道，focused suite 覆盖时间排序、稳定 untimed 排序、空输入和旧符号清除。

## 2026-10-31 DebugService owner wiring

`src/main/main-app/debug/export-logs.ts` 的 `DebugService` 与旧 `zje` 均为 19 members。本轮接回 `WindowContext` 的真实 debug
RPC consumer 并删除旧 class；focused suite 覆盖日志导出参数、browser snapshot/tab owner、debug window、ChatGPT conversation
source/action/subscription、memory diagnostics unavailable stub 与 bootstrap wiring。

## 2026-10-31 demo tools owner wiring

`src/main/main-app/debug/export-logs.ts` 已完整实现原 `Bje/Hje/Uje/Wje` 的 demo backend、lifecycle、per-origin service 与工厂。
本轮接回 `WindowContext` 的真实 consumer 并删除旧 121 行簇；focused suite 锁定 5/9/8 members，并验证 packaged/build flavor/
platform 三重 gate 与 bootstrap wiring。

## 2026-10-31 thread workspace duplicate cleanup

语义 `AppServerConversationManager` 已直接导入并构造 `ProjectlessConversations` 与 `ThreadWorkspaceStorage`；主 chunk 旧
`owe/swe` 的出现次数均仅为定义一次。成员数分别精确对齐 28/12，本轮删除 `tw/owe/nw/swe` 重复 284 行簇；focused suite
验证 projectless load/save/hints/removal、workspace writable roots/assignment/factory 以及 manager 的真实 consumer wiring。

## 2026-10-31 OpenInService skeleton removal

审计 `src/main/main-app/misc/open-in-service.ts` 时发现其 `OpenInService` 只有 6 个成员，而真实 `N0` 有 16 个；现有实现的
`getTargets` 甚至始终使用空 available set，并缺失 open、preferred target 写入、remote path/host、native app discovery 与 inline
browser panel 路由。文件无任何 runtime consumer，本轮删除该 270 行假迁移并加入 skeleton regression gate；真实 `N0` 保持不动。

## 2026-10-31 Artifact Session host lifecycle wiring

`src/main/main-app/artifact-session/host-lifecycle.ts` 的 44-member `ArtifactSessionHostLifecycle` 与 `runtime-install.ts` 已覆盖原
`Hte` 及 `Gr..Xte` 的 runtime pinning、daemon readiness、admission、viewer reconciliation、retry、进程终止和文件权限 helper。
本轮接回 startup `Hte.start(...)` 真实 consumer 并删除旧 729 行簇；focused suite 锁定完整成员面、参数 guard、不可用状态与幂等 disposal。

## 2026-10-31 conversational onboarding owner wiring

既有 `src/main/main-app/onboarding/conversational-onboarding.ts` 已完整实现原 `kN` 的 25-member owner，但 bootstrap 仍导出旧类。
本轮接回 `WindowContext` 的真实 consumer，删除旧 class 与专属 `aje/ON/oje/sje`；focused suite 覆盖 local-host gate、completion
登记/回填/状态、thread deletion notification、stale request lifetime、幂等静态 disposal 与真实 consumer wiring。

## 2026-10-31 Published Statsig owner wiring

既有 `src/main/main-app/account/statsig-adapter.ts` 已完整实现原 `STe` 的 19-member publication owner，但 bootstrap 仍导出旧类。
本轮接回 `WindowContext` 的真实 consumer，删除旧 class 与专属 `Qw/gTe/_Te/nT/rT`；focused suite 覆盖空 payload 默认值、
repository publication replacement、identity epoch invalidation、listener unsubscribe、client shutdown 与 disposable cleanup。

## 2026-10-31 Browser Settings Sync owner wiring

既有 `src/main/main-app/browser-use/origin-state.ts` 已完整实现原 `_ke` 的 34-member 双向同步 owner，但 bootstrap 仍导出旧类。
本轮接回 `WindowContext` 的真实 consumer，删除旧 class 与专属 `MD/ND/vke/hke/gke/jD`；focused suite 覆盖首次远端投影、
revision patch、本地写入、串行 callback、dispose/generation guard，并锁定真实 startup wiring。

## 2026-10-31 IAB tab mentions owner wiring

既有 `src/main/main-app/browser-sidebar/iab-tab-mentions.ts` 已完整实现原 `HOe` 的 24-member owner，但 bootstrap 仍导出旧类。
本轮接回 `WindowContext` 的真实 browserTabs consumer，删除旧 class 与 `iD/aD/UOe/WOe/GOe`；focused suite 覆盖双源搜索、
Chrome liveness/focus、provider lifecycle、invalidation 和 disposal。

## 2026-10-31 stream-recovery duplicate cleanup

语义 `AppServerConversationManager` 已直接导入并构造 `StreamRecovery` 与 `TurnStartObservations`，主 chunk 旧 `cSe/lSe` 已无
consumer。成员数分别精确对齐 18/20，本轮删除两个死重复 class；focused suite 验证 turn-start capture 到 accepted/completed
投递及 observer disposal，并锁定真实 manager wiring。

## 2026-10-31 realtime recording cluster wiring

既有 `src/main/main-app/realtime/session-recorder.ts` 已完整实现 `kwe/Awe/mw/Lwe`，但此前 main 仍保留重复 schema、recorder、
rollout embed helpers 与 SQLite ledger。本轮接回 feedback/startup/voice-history consumers 并删除旧簇；focused suite 验证
RecordingGate generation、RealtimeSessionRecorder generation retirement/root path、VoiceTimelineLedger transaction/idempotency/sequence。

## 2026-10-31 Skysight service manager wiring

既有 `src/main/main-app/skysight/service-manager.ts` 已完整实现原 `Moe` 的 24-member recorder state machine，但此前无 main
consumer。本轮将真实 startup `new Moe(...)` 接到 `SkysightServiceManager`，删除旧 `joe/Moe`；focused suite 覆盖 enable、
pause/resume、disable、settings/history、失败 rollback 与未关闭 segment 拒绝。

## 2026-10-31 hosted AppServerManager registry owner

原 `LEe` 已迁入 `src/main/main-app/app-server/hosted-manager-registry.ts`，bootstrap 继续以 `LEe` 导出该语义 factory class。
模块保留 connection registry subscription、identity generation/readiness、异步 manager creation race、principal/account 更新、
listener fan-out 和 resource retirement；focused suite 覆盖 add/refresh/context replacement/remove/dispose 全生命周期。

## 2026-10-31 saved-section transition owner

原 `tBe` 已迁入 `src/main/main-app/sidebar/saved-section-transition.ts`，真实 `SavedSectionUndoRedoStack` 仍通过生成别名注入并
构造该 32-member owner。模块保留 transition/current/source guards、replica reservation/save/discard、thread membership scope、
migration list/thread snapshots、completion conflict 检查与 disposal cleanup；focused suite 覆盖成功路径、越界拒绝与退休行为。

## 2026-10-31 native notification manager owner

原 `bhe` 与 `gm/_m/vm` sound helpers 已迁入 `src/main/main-app/notifications/native-notification-manager.ts`。startup 继续构造
17-member manager，既有 NotificationsService 继续消费同一组 sound resolver；focused suite 覆盖 dedupe、click/action/reply、
completed-thread projection、dismissal、unsupported host 与跨平台 sound path/command。

## 2026-10-31 download store owner

原 `LGe` 连同 `FGe/IGe/rq/RGe/iq/aq` 已迁入 `src/main/main-app/downloads/download-store.ts`，真实 browser host 继续通过
`new LGe(options)` 构造语义 factory class。模块保留 native/live history 合并、save path 冲突处理、download lifecycle、未确认
集合上限、browser-use 准入与 link-download 临时 WebContentsView；focused suite 锁定 49 members、状态转换、历史映射及准入行为。

## 2026-10-31 ConversationEventBus owner cleanup

`src/main/main-app/conversations/event-bus.ts` 已由语义 `AppServerConversationManager` 直接构造并消费。对照主 chunk 旧 `Ah`
发现既有压缩模块缺失 request `isCurrent()` 短路，以及 capture 期间 listener 被注销后的即时 disposer 回收；本轮恢复完整
83-member 状态/API 与事件顺序，物理删除旧 class。focused suite 覆盖 keyed callbacks、conversation reset、stream role、multi-method
notification、stale request、注销竞态和 observer 错误隔离。

## 2026-10-31 conversation subowner duplicate cleanup

语义 `AppServerConversationManager`/`ThreadStore` 已真实构造 `ConversationHistoryReader`、`TurnItemsPaginationLoader`、
`ThreadItemIndex`、`InactiveThreadUnsubscriber`、`ItemNotificationHandler` 与 `SubagentTopology`。主 chunk 旧
`Bge/Kge/g_e/Dve/Rve/ySe` 及只服务旧 topology 的 `bSe/_Se/vSe` 已物理删除。接线审计发现原 semantic inactive owner 只有
9/28 members，已补齐 inactivity tracking、TTL/容量淘汰、passive hydration、retry/runtime-status 与完整 cleanup；focused suite
锁定 class members、关键状态投影和真实 wiring。

## 2026-10-31 conversation creation cluster cleanup

`src/main/main-app/conversation/conversation-creation.ts` 的 `ConversationParamsBuilder` 与 `ConversationCreationExecutor` 已由
语义 `AppServerConversationManager` 真实消费，主 chunk 旧 `FSe/ISe/LSe/CC/RSe` 因而只剩内部互相引用。本轮物理删除重复
创建/预热簇；focused suite 验证 initial-daybreak 乐观写与失败回滚、paginated history mode 和 manager wiring。

## 2026-10-31 account-auth lifecycle cleanup

`src/main/main-app/conversation/app-server-manager.ts` 已直接导入并构造 `auth/account-auth.ts` 的 `AccountAuthService`，主 chunk
旧 `Khe` 因而无任何 consumer，本轮物理删除其 355 行 class。语义 owner 保留 API-key/ChatGPT/device-code login、remote
port-forward、Windows sandbox setup timeout/retry、auth/MCP notification fan-out 与 disposal；focused suite 覆盖登录完成和回调。

## 2026-10-31 browser-session registry partial migration removal

删除无 runtime consumer 的 `src/main/main-app/browser-use/session-registry.ts` 及其 focused test。该文件只有 30 个 members，
真实 `cX` 有 64 个；缺少 window/session route ownership、native-pipe enablement、browser host/page lifecycle、download/cursor
events、window/page snapshots 与 route disposal。真实 owner 仍保留在主 chunk，unwired-owner gate 已锁定该部分 façade 不得回归。

## 2026-10-31 browser comment controller skeleton removal

删除无 runtime consumer 的 `src/main/main-app/browser-sidebar/comment-controller.ts`。该文件只有 8 个 members，真实 `hGe`
有 68 个；仅实现 screenshot waiter/compaction 局部逻辑，缺少 overlay/runtime/design editor/message routing、截图管线与同步
职责。真实 owner 仍保留在主 chunk，unwired-owner gate 已锁定该 skeleton 不得回归。

## 2026-10-31 browser comment overlay skeleton removal

删除从未被 main 或其他 runtime 模块消费的 `src/main/main-app/browser-sidebar/comment-overlay-manager.ts`。该文件只有 11 个
members，而真实 `JWe` 有 42 个；核心 `prepare()` 是显式 no-op，缺少 preview/anchor/selection/dismiss/session/geometry/window
lifecycle。真实 owner 仍保留在主 chunk，unwired-owner gate 已锁定该 skeleton 不得回归。

## 2026-10-31 AppServerConversationManager owner

既有 `src/main/main-app/conversation/app-server-manager.ts` 已接回真实 host assembly、inbox listener 与 disposal consumers，
替代原 `rw`。新 owner 持有 ThreadStore、stream roles、queued follow-ups、turn start/resume/archive/auth/settings/read-state 与
20+ 子 owner 的 composition/disposal；299 个 class members 数量对齐，旧私有 `e/t` 已语义化，内部 ChatGPT auth API 使用
一致的 `ChatGPT` 拼写，主 chunk 旧 2,004 行 class 已删除。

## 2026-10-31 ThreadStore owner

既有 `src/main/main-app/threads/thread-store.ts` 已接回真实 conversation manager consumer，替代原 `T_e`。新 owner 保留
conversation/thread maps、canonical/legacy history、field subscriptions、recent summaries、hydration、title/read/archive state、
transcript changes 与 subagent status evidence。接线审计发现并补回 `registerThreadMetadata` 方法，两处内部 registration 现会先
记录 thread availability；132 个 class members 与原 owner 对齐，主 chunk 旧 1,963 行 class 已删除。

## 2026-10-31 app-server stream-role owner

既有 `src/main/main-app/threads/stream-roles.ts` 的 `AppServerManagerStreamState` 已接回真实 conversation manager consumer，
替代原 `Yge`。新 owner 保留 owner/follower role state、revision waiters、snapshot/patch publication、follower reconnect grace、
window activity、transport callbacks 与 reset/disposal cleanup；53 个 class members 与原 owner 对齐，主 chunk 旧 445 行 class
已删除。

## 2026-10-31 queued follow-ups owner

既有 `src/main/main-app/conversation/queued-follow-ups.ts` 的 `QueuedFollowUpsCoordinator` 已接回真实 `USe` factory，替代
原 `VSe`。新 owner 保留 local/server/follower queue precedence、serialized writes、broadcast reconciliation、automatic-turn
deferrals、queue/steer/start dispatch、execution subscriptions 与 retirement cleanup；56 个 class members 与原 owner 对齐，
主 chunk 旧 739 行 class 已删除。

## 2026-10-31 SSH app-server transport owner

既有 `src/main/main-app/app-server/transports.ts` 的 `AppServerTransportSshWebsocket` 已接回真实 transport factory 与 remote
installer consumers，替代原 `VE`。新 owner 保留 shell-env loading/proxy-command dependency、remote Codex version discovery/
installation、SSH websocket proxy stream、connect timeout/error projection、stream disposal 与 startup serialization；29 个
class member 与原 owner 对齐，主 chunk 旧 650 行 class 已删除。

## 2026-10-31 detached-window owner cluster

既有 `src/main/main-app/window/detached-window-manager.ts` 已接回真实 consumers，替代原 `GN/qje/Jje/Yje/Xje/Qje/eMe`。
完整 cluster 保留预热 slot/queue、open/present/detach/restore 状态机、source/receiver handoff、toolbar/chrome projection、
thread handoff lease、DeviceCheck cookie/token lifecycle 与 1024-entry call-id claim ledger；7 个 class 的公开 member 集合与
原 owner 对齐，主 chunk 重复实现已删除。

## 2026-10-31 desktop authenticated fetch owner

既有 `src/main/main-app/api/desktop-fetch.ts` 的完整 `DesktopFetchService` 已接回真实 `WindowContext` consumer，替代原
`ZTe`。新 owner 保留 renderer HTTP proxy、authenticated JSON、OTel trace export、download stream、abort/progress、header/
URL/auth policy、VS Code request bridge 与 dictation websocket credential projection；32 个 class member 与原 owner 对齐，
主 chunk 旧 760 行 class 已删除。

## 2026-10-31 avatar overlay composition owner

既有 `src/main/main-app/avatar-overlay/composition-surface.ts` 和 `realtime.ts` 已接回真实 main consumer，替代原 `Hle/rle`
及重复 WeakMap registry。新 owner 保留 overlay/PIP window lifecycle、geometry、quick-chat element sizing、native app icons、
presentation 与 realtime voice session/starter 生命周期；接线前校正 `setElementSize` 公共方法名，并恢复 start/cancel RPC
handle 的 `.dup()` 后持有、仅释放副本语义。真实 startup 仍构造该 owner，旧 class/registry 已从主 chunk 删除。

## 2026-10-31 local thread catalog store wiring correction

既有 `src/main/main-app/thread-catalog/store.ts` 是完整的 6-table SQLite DAO，但此前从未被 main require；本轮将真实
`hhe` consumer 接到 `LocalThreadCatalogStore`。host registration、sync state、cursor/manual pages、scan checkpoint、observation
sequence、pending title、missing-candidate reconciliation、revision 与 BEGIN IMMEDIATE transaction 均由语义模块持有；主
chunk 重复 class、store-only schemas/upsert SQL、filter/row helpers 已删除，`_he/um/dm` projection chain 保留。

## 2026-10-31 cross-host thread catalog service

原 `dnt` 已迁入 `src/main/main-app/thread-catalog/service.ts`。新 owner 保留 source attach/detach 与 owner counts、population
lifecycle、per-host serialization、四路 scan admission 与 interactive/background fairness、host registry、page/filter/manual-order/
cursor validation、status/thread observation publication 和 disposal；真实 `WindowContext` consumer 仍构造该 class，旧 class、
cursor encoding/filter normalization/fingerprint 等专属 helpers 已从主 chunk 删除。

## 2026-10-31 thread catalog sync coordinator

原 `int` 已迁入 `src/main/main-app/thread-catalog/sync-coordinator.ts`。新 owner 保留 full/incremental scan、offset
checkpoint resume、head overlap reconciliation、freshness/failure backoff、foreground promotion、notification coalescing、imported
thread refresh、history pruning、delta/invalidation publication 与 disposal；真实 `dnt.attachSource()` 仍构造该 class，旧
class body、专属 timing constants、watermark/anchor helpers 已从主 chunk 删除。

## 2026-10-31 Habitat Automations owner

原 `AOe` 已迁入 `src/main/main-app/automations/habitat-automations-service.ts`。新 dependency-injected owner 保留 migration
consent 与 persisted owner identity、mutation serialization、hosted create/update/delete、save 后独立读取校验、分页同步、local
cache adoption、principal-change invalidation 和 RRULE/local-configuration projection；真实 `NOe` composition 仍构造该 class，
`WindowContext`、automations façade 与 startup sync consumers 均保持原调用链，主 chunk 旧 class/schema/helpers 已物理删除。

## 2026-10-31 saved-section manager helper cleanup

单用途 `aBe` saved-state schema predicate 已内聚到 manager factory；主 chunk 转发 helper 与反向 dependency injection 删除。

## 2026-10-31 saved custom sections manager

原 `iBe` manager 已迁入 `src/main/main-app/sidebar/saved-custom-sections-manager.ts`。新 class 保留 serialized command queue、
principal/connection-bound source capture、creation reservations、legacy import、persisted-atom write/broadcast、migration 与
reconciliation entrypoints；真实 pinned façade consumer 已接回，主 chunk 旧 class body 已删除。

## 2026-10-31 saved-section reconciliation owner

原 `rBe` reconciliation query owner 已迁入 `src/main/main-app/sidebar/saved-section-reconciliation.ts`。新 class 保留
single-read guard、source/connection lifetime、list/member snapshots、conflict detection 与 commit merge/writeback；真实 `iBe`
manager consumer 已接回，主 chunk 旧 class body 已删除。

## 2026-10-31 saved-section undo/redo owner

原 `yH` undo/redo transition owner 已迁入 `src/main/main-app/sidebar/saved-section-undo-redo-stack.ts`。新 factory class
保留 scoped before/after snapshots、structure/order capture、transition serialization 与 migration state；真实 `iBe` manager
consumer 已接回，主 chunk 旧 class body 已删除。

## 2026-10-31 thread section server owner

原 `$ze` 462 行 ThreadSectionServer 已迁入 `src/main/main-app/sidebar/thread-section-server.ts`。新 dependency-injected class
保留 connection observation、thread lookup caches、pinned section discovery/migration、section CRUD/move/list 与 host mutation
serialization；真实 `pinned-threads-service.ts` façade 已接回，主 chunk 旧 class body 已删除。

## 2026-10-31 automations unwired island removal

删除仅彼此引用、从未被 main require 的 `automation-update-tool.ts`、`habitat.ts`、`inbox-items.ts`、`index.ts` 假迁移孤岛。
真实 update executor、habitat migration、inbox façade 与 scheduler 仍在主 chunk；已真实接线的 `automations-service.ts` 和
`cron-turn-read-state.ts` 保留。unwired-owner gate 已扩展，防止四个孤岛以“可读但无 consumer”形态回归。

## 2026-10-31 saved-sections unwired island removal

删除从未有 consumer 的 `saved-sections-service.ts`、`saved-sections-state.ts`、`saved-sections-transactions.ts` 三文件孤岛；
其中 façade 以 `{}` 强转注入 server engine，属于不可运行的假迁移。真实 `$ze/iBe` engine/reconciliation 仍在主 chunk，
并由已接线的 `pinned-threads-service.ts` 显式注入。unwired-owner gate 同步改为验证 PBe/ert 真实 factories 与主 wiring。

## 2026-10-31 WindowContext owner

原 `ert` 完整约 2,000 行 owner 已迁入 `src/main/main-app/window/window-context.ts`。新 dependency-injected factory 持有
app-server/host registries、projects/workspaces、fetch/message handler、browser/realtime/artifact/automation/runtime services 与
lifecycle disposables；真实 startup consumer 仍通过 `new ert({...})` 接回，主 chunk 旧 class body 已删除。focused suite 用
universal boundary doubles 实际执行完整同步 composition constructor，并锁定 60+ 个 owned fields 非占位实现。

## 2026-10-31 Electron fetch handler owner

原 `PBe` 完整 1,600+ 行 owner 已迁入 `src/main/main-app/fetch-handler/electron-fetch-handler.ts`。新 dependency-injected
factory 持有 129 个 handlers、constructor-owned settings/automations/pinned services、global-state/config helpers 与 VS Code
dispatch/tracing/error projection；真实 `ert` consumer 仍通过 `new PBe(...)` 接回，主 chunk 旧 class body 已删除。对定义在
composition 之后的 screenshot resolver 使用 lazy closure 注入，避免 factory 初始化期 TDZ/undefined capture。

## 2026-10-31 pinned threads service façade

`PBe` 构造器持有的原 `jH` 已迁入 `src/main/main-app/sidebar/pinned-threads-service.ts`。新 class 保留 legacy/server
listing、pin/reorder fallback、section CRUD delegation、deduped section updates、saved-section callback synchronization、window
broadcast 与 worktree cleanup protection；真实 consumer 已接回，旧 class body 已删除。

## 2026-10-31 automations service owner

`PBe` 构造器持有的原 `CMe` 已迁入 `src/main/main-app/automations/automations-service.ts`。新 class 保留 cron/worktree
validation、canonical/habitat 双路径、delete cleanup 与 run-update notification、native context lifetime、local-only 与 habitat
migration gates；真实 consumer 已接回，旧 class body 已删除。

## 2026-10-31 workspace settings service wiring correction

既有 `settings/workspace-settings-service.ts` 未接线，且错误假设 RPC stream 为 `.send()`、改变 open-link fallback 与 schema
failure 语义；本轮重写为 dependency-injected runtime 并接回真实 `PBe` consumer。新模块持有 settings base/read-all/
agent projection、RPC subscription、write-confirmation broker、work-mode policy、third-party notices 与 backdrop policy；旧
`sBe/cBe/xBe/SBe/RH/CBe/zH` 及 notices helpers 已删除。

## 2026-10-31 workspace directory browser

`PBe` 前置的 workspace directory browse/resolution/symlink-containment cluster 已迁入
`src/main/main-app/workspace/directory-browser.ts` 并接回真实 handler。local realpath containment、remote path semantics、
hidden/directory filters、directory-first stable ordering 与 parent projection 均保留；旧 `OBe/kBe/ABe/jBe/UH/MBe/WH`
已删除。

## 2026-10-31 fetch-handler support runtime wiring correction

既有 `sftp.ts`/`state-writes.ts` 同样未接回真实 consumers；本轮将两者改为 dependency-injected runtime，接回 SFTP
upload/download、global-hotkey validation、avatar accelerator、bundled-skills root 与 persisted-atom sparse writes。旧
`RBe/zBe/QH/BBe/$H/VBe/eU/HBe/UBe/WBe` 已删除；focused suite 同时覆盖行为与主 chunk source wiring。

## 2026-10-31 screenshot-target wiring correction

既有 `screenshot-target.ts` 未接回且直接导入 Electron；本轮改为 dependency-injected resolver，并将真实 `PBe`
screenshot consumer 接回。新模块持有 viewport/zoom/content-bounds/display projection、invalid/destroyed guards 和 rectangle
normalization；旧 `FBe/IBe/LBe/ZH` 已删除。

## 2026-10-31 global-dictation policy cleanup

消息白名单与 platform support policy 已并入 `global-dictation-lifecycle-manager.ts`，旧 `cat/W7/G7/fat` 删除；
accessibility permission prompt 继续由 composition 注入，保持模块无 Electron import 与原副作用时机。

## 2026-10-31 unwired owner skeleton removal

删除无 consumer 的 `window/window-context.ts` 与 `fetch-handler/electron-fetch-handler.ts`：两者仅是 null/no-op/throwing
skeleton，未替代主 chunk 中真实 `ert`/`PBe` owners。focused gate 同时锁定真实 owners 仍为 authoritative，并防止三个
已删除的 unwired skeleton 被重新加入。

## 2026-10-31 immediate-update wiring correction

此前 `immediate-update-exit.ts` 虽存在但真实 `Wst` consumer 未接回；本轮已将 update-install 路径直接接到
`cleanupForImmediateQuitOnUpdate`，注入 process-tree cleanup、window enumeration、warning 与 unconditional exit，旧 `Wst`
删除。同时删除无 consumer 且重复 startup owner 的 `run-main-app-startup.ts` skeleton。

## 2026-10-31 global-dictation lifecycle manager

原 `dat` 已迁入 `src/main/main-app/dictation/global-dictation-lifecycle-manager.ts`。新具名 class 保留 gate/force-lock、
hold/toggle hotkey registration 与 release watching、cross-instance lock、overlay/pet/in-app session 状态机、renderer protocol、
clipboard/paste/history、abort/recovery 与 cleanup；真实 window-services consumer 已接回，旧 class body 已删除。

## 2026-10-31 application worker runtime

原 `xst` 已迁入 `src/main/main-app/worker/worker-runtime.ts`。新 owner 保留 git/open-in 常驻 buses、trusted IPC
registration、app-event/Sentry fan-out、git sampling/turn completion，以及 computer-use one-shot 与 capture-update watcher
两套独立 lifecycle、abort、terminal update、worker-exit/failure cleanup；真实 startup consumer 已接回，旧 body 已删除。

## 2026-10-31 worker predicate wiring cleanup

`Sst/Cst/wst` 三个仅转发的 generated aliases 已删除；worker runtime 直接使用
`worker-event-predicates.ts` 的 start-result、event-type 与 notification-type 语义 exports，未保留重复 facade。

## 2026-10-31 worker app-event publisher

原 `fe` 已迁入 `src/main/main-app/worker/app-event-publisher.ts`。新具名 class 保留 timestamp projection、multi-subscriber
fan-out 与幂等 subscription disposal；真实 worker runtime consumer 已接回，旧匿名 class 已删除。

## 2026-10-31 worker process/RPC manager

原 `bst` 已迁入 `src/main/main-app/worker/worker-manager.ts`。新 class 保留 workerData/MessagePort construction、
analytics/auth/tracing propagation、git graceful flush、Sentry/main RPC session lifecycle、CES cancellation/telemetry、OTel export、
success/error response projection 与 exit cleanup；真实 worker buses 已接回，旧 class 已删除。

## 2026-10-31 worker bus owner

原 `H9` 已迁入 `src/main/main-app/worker/worker-bus.ts`。新 class 保留 renderer/host pending request maps、response
method/result validation、AbortSignal cancellation、webContents/worker-exit cleanup、host subscriptions、performance event single
recipient、host-only/broadcast routing 与 worker-manager delegation；真实 git/open-in bus consumers 已接回，旧 class 已删除。

## 2026-10-31 global-dictation paste runtime

原 `$it/eat/I7/L7/nat/B7/rat/V7/iat/aat` 已迁入 `src/main/main-app/dictation/global-paste-runtime.ts`。新 runtime
保留 clipboard fingerprint/snapshot/format restore、pre/post paste timing、abort/change guards、macOS AX paste-menu discovery 与
AppleScript fallback、Windows SendKeys，以及 accessibility/copy/paste failure projection；真实 dictation consumers 已接回。

## 2026-10-31 pet/avatar global-hotkey owner

原 `Fit/C7` 已迁入 `src/main/main-app/hotkey/pet-hotkey-manager.ts`。新 owner 保留 access readiness/entitlement gate、
command keybinding resolution/release、幂等注册、权限丢失时注销、press-time access recheck、toggle failure logging、access-state
subscription 与 dispose；真实 avatar overlay startup consumer 已接回，旧 functions 已删除。

## 2026-10-31 deep-link route executor

原 `lit` 已迁入 `src/main/main-app/deep-links/route-executor.ts`。新 executor 保留所有 parsed-route dispatch、plugin
lookup failure logging、pet/OAuth/browser 消息、automation/search URL、local-conversation existence/review/prompt/host navigation，
以及 new-thread workspace/project 编排；真实 `_it` navigation consumer 已接回，旧 function 已删除。

## 2026-10-31 deep-link route actions

原 `b7/uit` 已迁入 `src/main/main-app/deep-links/route-actions.ts`。新模块保留 background browser-tab/browser-panel
消息形状、initiator 默认值，以及 plugin-list phase flag、marketplace path/name 与 plugin-name 精确匹配；真实 browser、
local-conversation、new-thread 与 plugin-install consumers 已接回，旧 helpers 已删除。

## 2026-10-31 deep-link local-project selector

原 `git` 已迁入 `src/main/main-app/deep-links/local-project-selector.ts`。新 owner 保留显式 project lookup、root-based
lookup/create、未知 workspace root 广播、既有 local selection identity 保留、global-state mutation/broadcast，以及缺失
mutation handler 的失败语义；真实 new-thread deep-link consumer 已接回，旧 function 已删除。

## 2026-10-31 deep-link workspace resolver

原 `dit/fit/pit/mit/hit` 已迁入 `src/main/main-app/deep-links/workspace-resolver.ts`。新 resolver 保留显式目录优先、
无效 path 到 origin fallback、local project roots/fallback roots、Git `origin-and-roots` 请求、dir/root 首映射语义，
以及 exact URL 或规范化 host/owner/repo 匹配；真实 new-thread deep-link consumer 已接回，旧 functions 已删除。

## 2026-10-31 deep-link thread-host resolver

原 `vit` 已迁入 `src/main/main-app/deep-links/thread-host-resolver.ts`。新策略保留 origin/indexed/catalog host 优先级、
catalog membership、app-server connection availability、thread ownership lookup，以及 origin/local fallback；真实
local-conversation deep-link consumer 已接回，旧 function 已删除。

## 2026-10-31 application-menu support runtime

原 `v7/cit` 已迁入 `src/main/main-app/app-shell/application-menu-runtime.ts`。新模块保留跨平台 Electron accelerator
alias 规范化、排序与 collision/exclusion comparison，以及 focus/locale/browser-state/feature consumers 共用的 refresh manager；
真实 `sit/_it` consumers 已接回，旧 function/class 已删除。不完整的 `app-menu.ts` 骨架仍明确保持未接入。

## 2026-10-31 quit and bounded-cleanup runtime

原 `a7/Prt/o7/Irt/Lrt/s7` 已迁入 `src/main/main-app/startup/quit-runtime.ts`。新 runtime 保留 dev relaunch
fallback、app quit、12 秒 service cleanup、5 秒 context cleanup，以及 hotkey/dictation/context/disposables 的 immediate-exit
ordering；workspace policy、main IPC、normal lifecycle、micro shutdown 与 update-install consumers 均已改接，旧 cluster 删除。

## 2026-10-31 primary main IPC router

原 `Rrt` 已迁入 `src/main/main-app/app-shell/main-ipc-router.ts`。新 owner 保留 avatar/PiP、update gates、desktop feature
projection、menu/plugin updates、main-window/browser routes、quit/tray/dictation/context fallback、browser sidebar/page validation、
Codex-home request、Sentry test、AppView MessagePort registration 与 renderer context-menu orchestration；真实 startup consumer
已接回，旧 function 和一个从未被 router 消费的 composition option 已删除。

## 2026-10-31 platform shutdown adapters

原 `mrt/t7/hrt/n7/r7/i7/grt/_rt` 已迁入 `src/main/main-app/startup/platform-shutdown.ts`。新 owner 保留 Windows
descendant kill、native addon validation、10 秒 forced-exit single arm 与 failure retry/logging，以及 macOS AppKit
power-off observer、typed block、allow-quit callback 和 dynamic-load failure logging；真实 lifecycle/update/final cleanup
consumers 已接回，旧 cluster 已删除。

## 2026-10-31 renderer-driven native context menu

原 `J5/Y5/ort/X5/srt/crt` 已迁入 `src/main/main-app/window/renderer-context-menu.ts`。新 owner 保留 IPC trust gate、
display scale normalization、nested SVG collection/rasterization、currentColor/template handling、data/file/absolute/search-root
icon resolution、16px resize、nested Electron menu projection、single-result click/cancel 与 handler disposer；真实 main-message
registration 已接回，旧 cluster 已删除。

## 2026-10-31 startup synchronous IPC registrar

原 `Frt/zrt` 已迁入 `src/main/main-app/startup/startup-ipc.ts`。新 registrar 保留 trusted/untrusted sentry bootstrap、
build flavor、shared-object snapshot、initial sidebar bootstrap、file drag，以及 HTTP(S) link-drag validation、原 sender receiver
binding 与 native drag failure logging；真实 startup registration 已接回，旧 schema/function 已删除。

## 2026-10-31 application lifecycle owner

原 `vrt..Nrt/Brt/Vrt` 已迁入 `src/main/main-app/startup/application-lifecycle.ts`。新 owner 保留 privacy/system-shutdown
quit gating、local chats/active automations/pending worktrees 的 confirmation copy projection、activate attribution、menu refresh、
foreground/background app events、single-shot will-quit、packaged Windows forced-exit arm、skip-drain policy，以及 global/settings/
micro/tracing/context/disposables 的 ordered all-settled cleanup；真实 startup consumer 已接回，旧 constants/functions 已删除。

## 2026-10-31 About window owner

原 `Hrt/Urt/Wrt/Grt/Krt/qrt/Jrt/u7/d7/f7/Yrt/Xrt/Zrt/p7/Qrt/$rt/eit/tit/m7/h7/nit/rit` 已迁入
`src/main/main-app/app-shell/about-dialog.ts`。新 owner 保留 singleton focus/restore、macOS/Windows/Linux 与主题图标、
localized version/release 文案、HTML escaping/CSP、BrowserWindow hardening、navigation denial、dynamic content sizing、
parent/work-area placement 与 load failure cleanup；菜单仍复用的 `c7/l7` 留在 composition，真实 About action 已接回。

## 2026-10-31 desktop open-path owner

原 `Rst/zst/Bst` 已迁入 `src/main/main-app/files/desktop-open-path-handler.ts`。新 owner 保留 macOS early queue
接管、feature-ready subscription、single-flight/递归 drain、stat/classification、directory dedupe 与 project creation/selection、
global/window broadcasts、projectless files/skill install projection、browser documents、extension logging、failure reporting 和
listener cleanup；真实 startup consumer 已接回，旧 dead alias/function/helper 已删除。

## 2026-10-31 Computer History native status-item actions

原 `Dst/Ost/kst` 已迁入 `src/main/main-app/computer-use/native-status-item-actions.ts`。新 adapter 保留 feature、connection、
managed-service 与 recorder 状态 projection，service PID ensure、worker menu-state 读取和 failure logging，以及
open-thread、quit、stop application、pause/resume、observation policy、clear history、history/settings navigation 的 action
routing、analytics 与 query invalidation；真实 tray startup consumer 已接回，旧 aliases/function 已删除。

## 2026-10-31 tray singleton lifecycle

原 `W9/G9/K9/q9/J9/Y9/Nst/X9/Z9/Pst/Q9/Fst/$9` 已迁入 `src/main/main-app/tray/tray-lifecycle.ts`。新 owner
保留 native macOS status-item 分支、macOS template/Linux resize/Windows theme-aware 图标策略与 fallback、distribution/package
identity、single-flight creation、readiness、will-quit/dispose、主题 listener cleanup 和异步创建取消；真实 startup、readiness
与 controller consumers 已接回，旧 globals/functions 已删除。

## 2026-10-31 native macOS status-item owner

原 `Mst` 已迁入 `src/main/main-app/tray/native-status-item-controller.ts`。新 owner 保留 addon creation、event parsing、
indicator setting subscription、menu projection、native menu tracking、service-state filtering、async action/error handling、
state refresh 与 destroy/readiness；真实 tray construction 已接回，旧 class 已删除。

## 2026-10-31 window-appearance wiring skeleton cleanup

`A9/j9/I9/rst/ist/ast/ost/sst/L9/cst/z9` 现仅保留对 `main-app/window-appearance.ts` 的真实 delegation；已删除
所有 early-return 后的 generated duplicate bodies、仅由死代码引用的 15 个常量，以及无剩余 consumer 的 `R9`。
BrowserWindow manager 依赖签名和调用边界不变。

## 2026-10-31 thread-metadata persistence owner

原 `Oot/kot/Aot/jot` 已迁入 `src/main/main-app/threads/thread-metadata-service.ts`。新 owner 保留 serialized mutation
queue、read cloning、validation/update delegation、flush、rollback、rollback-error logging 与 change publication；真实
BrowserWindow manager dependency 已接回，旧 class 和两个 early-return 后的 unreachable generated skeleton 已删除。

## 2026-10-31 debug-window owner

原 `Sot/T9/Cot` 已迁入 `src/main/main-app/debug/debug-window-manager.ts`。新 owner 保留 conversation source/listener
duplication、RPC broken rebinding、subscription disposal、action forwarding、owner/debug webContents mapping、single-flight
window creation、origin conversation/client analytics projection 与双向 destruction cleanup；真实 BrowserWindow manager
dependency 已接回，旧三 class 已删除。

## 2026-10-31 realtime-voice hotkey owner

原 `Aat/jat` 已迁入 `src/main/main-app/realtime/voice-hotkey-manager.ts`。新 owner 保留 command binding、global hotkey
register/unregister、locked-screen press suppression、reservation-driven 250ms lock polling、permission refresh、apply/sync/toggle
failure logging 与 disposal；真实 realtime lifecycle consumer 已接回，旧 function/constant 已删除。

## 2026-10-31 global-dictation window owner

原 `oat/H7/sat` 已迁入 `src/main/main-app/dictation/global-dictation-window-controller.ts`。新 owner 保留 lazy
prewarm/create、renderer-ready handshake、start/stop/paste-failure、recovery geometry、pointer interactivity、display
reposition/cleanup、focused in-app filtering、hide/close 与 creation failure logging；真实 lifecycle 已接回，旧 cluster 已删除。

## 2026-10-31 startup progress-window owner

原 `bit/xit/Sit/Cit/wit/Tit/Eit/Dit/x7/Oit/kit` 已迁入 `src/main/main-app/startup/progress-window.ts`。新 owner
保留 sqlite/app-server localized copy、安全 HTML、BrowserWindow hardening、active/inactive presentation、user quit guard、
load failure cleanup、programmatic disposal 与 delayed-show adapter；两个真实 startup consumers 已接回，旧 cluster 已删除。

## 2026-10-31 temporary quit-state owner

原 `yit` 已迁入 `src/main/main-app/startup/quit-state.ts`。新 owner 保留 prompt bypass、drain bypass、60 秒自动 reset、
timer replacement/unref、mark-approved 和状态查询；真实 startup construction 已接回，旧 class 已删除。

## 2026-10-31 MessagePort RPC transport

原 `lrt/urt` 已迁入 `src/main/main-app/app-server/message-port-transport.ts`。新模块保留 structured-clone encoding、
queued/pending receive、null peer-close、port close error、send guard、abort null handshake/close/error retention，以及
`n.Vf(...).getRemoteMain()` adapter；AppView IPC consumer 已接回，旧 function/class 已删除。

## 2026-10-31 native tray-menu owner

原 `Z5/drt/frt/prt/Q5/$5` 已迁入 `src/main/main-app/tray/tray-menu-controller.ts`。新 owner 保留 Linux persistent menu、
Windows cached menu、macOS mouse/click/right-click suppression、ready/destroy、running/unread/pinned/recent sections、
overflow submenu、usage limits、new chat/feedback/open/quit actions 与 Unicode title truncation；IPC guard 和真实 tray
construction 均已接回，旧 cluster 已删除。

## 2026-10-31 dock-menu wiring repair

既有 `src/main/main-app/misc/dock-menu.ts` 虽已包含完整可读实现，主 chunk 却仍实例化旧 `ose`。现已将真实 startup
consumer 改接 `DockMenuManager`，删除旧 `Ll/ase/ose/sse/Rl/zl` 副本；行为覆盖 unread/completed path 去重、recent
排除、三条直排与 overflow submenu、Unicode 标题截断、projectless/empty sublabel、click routing 及 darwin Dock
menu 发布。

## 2026-10-31 cron-turn read-state lifecycle

原 `Cnt/wnt/Tnt/Ent/Dnt` 已迁入 `src/main/main-app/automations/cron-turn-read-state.ts`。新 owner 保留连接前置检查、
connection/notification subscription 生命周期、无 context 与 automation context 两条 turn correlation 路径、final/fallback
agent message、notification policy decision、unread writer、异步 failure logging、start failure 和 terminal disposal；真实
`prepareCronTurnReadState` consumer 已接回，旧 cluster 已删除。

## 2026-10-31 thread-project membership owner

原 `xnt/Snt` 已迁入 `src/main/main-app/projects/thread-project-membership-owner.ts`。新 owner 保留 assignment/projectless
global-state persistence、membership broadcasts、optional server writer 与 host-id post-commit、initial server project lookup、
projectless output/workspace metadata updates、removed-thread WeakMap tombstone 和 batched invalidation；唯一 runtime
construction 已接回，旧 schema/class 已删除。

## 2026-10-31 thread read-state owner

原 `Ont/L5/R5` 已迁入 `src/main/main-app/thread-read-state/thread-read-state-owner.ts`。新 owner 保留 identity/host
generation invalidation、context capture、renderer session 与 background writer ownership、serialized local/broadcast
writes、self/external fanout、logout identity clearing、legacy unread-state adoption/cleanup 与 dispose retirement；真实
composition root 已接回，旧 class/identity-key/default-state helpers 已删除。

## 2026-10-31 system-fonts service

原 `att` 已迁入 `src/main/main-app/window/system-fonts-service.ts`。新 RPC adapter 保留 Electron
`systemPreferences.getFontFamilies()` 的原始 return/promise forwarding；唯一 runtime consumer 已接回，旧 class 已删除。

## 2026-10-31 history-swipe navigation service

原 `Xnt` 已迁入 `src/main/main-app/window/history-swipe-navigation-service.ts`。新 renderer-scoped adapter 保留
origin identity 与 window-manager history swipe state forwarding；唯一 runtime consumer 已接回，旧 class 已删除。

## 2026-10-31 visualization service

原 `Vnt/Hnt/Unt/Wnt/Gnt/Knt/V5` 已整簇迁入 `src/main/main-app/visualizations/visualization-service.ts`。新 owner
保留 screenshot schema/crop/Windows bitmap clipboard、temporary roots、relative/absolute visualization path allowlist、
realpath boundary resolution、ancestor/file stat 与 symlink guards、ENOENT candidate fallback 和 5MB content limit；唯一
runtime consumer 已接回，旧 schemas/class/helpers 已删除。

## 2026-10-31 host-aware GitHub request client

原 `Znt` 已迁入 `src/main/main-app/github/github-request-client.ts`。新 adapter 保留 repos/account/single-host
参数的 host-id discovery、default host inclusion、config-id dedupe/order、operation source 与 AbortSignal forwarding，
以及 `github-request` main envelope；唯一 runtime consumer 已接回，旧 helper 已删除。

## 2026-10-31 app-server transport policy

原 `U5/W5/Ynt` 已迁入 `src/main/main-app/app-server/transport-policy.ts`。新 policy 保留
`CODEX_APP_SERVER_FORCE_CLI` override、cloud websocket_url/local-derived URL、localhost/IPv4/IPv6 loopback proxy bypass、
cloud internal API domain allowlist 与 remote-host SOCKS5 routing；五个真实 consumers 已接回，旧 helpers 已删除。

## 2026-10-31 downloads view publisher

原 `Jnt` 已迁入 `src/main/main-app/downloads/downloads-view-publisher.ts`。新 owner 保留 per-app-view lifecycle queue、
detached view serial queue/initial snapshot、state broadcast coalescing、30 秒 publish watchdog、RPC-broken/destroyed/
render-process-gone cleanup、failure isolation 与 dispose；唯一 runtime construction 已接回，旧 class 已删除。

## 2026-10-31 user-verification RPC services

原 `znt/Bnt` 已迁入 `src/main/main-app/user-verification/rpc-services.ts`。新 adapters 保留 per-host connection lookup、
conversation/request verification begin、wait/accept/cancel forwarding 与 dispose 时取消 attempt；条件式 runtime
consumer 已接回，旧 classes 已删除。

## 2026-10-31 trigger subscription reader

原 `Int/Lnt/Rnt` 已整簇迁入 `src/main/main-app/triggers/trigger-subscription-reader.ts`。新 owner 保留 strict
subscription schema、thread-id dedupe、100-item POST batching、request 前后 account/user identity recheck、captured-signal
abort checks、controller rollover 与 per-thread result projection；真实 construction/cancellation 已接回，旧 cluster 已删除。

## 2026-10-31 tracing RPC service

原 `Fnt` 已迁入 `src/main/main-app/tracing/tracing-rpc-service.ts`。新 adapter 保留 trace batch export、non-finite/
range sample-rate normalization、desktop runtime/git worker/global-state 三路更新顺序，以及 trace recording confirm、
cancel、keep-local 与 upload payload routing；唯一 runtime consumer 已接回，旧 class 已删除。

## 2026-10-31 thread turn-summary service

原 `Nnt/Pnt/z5/B5` 已整簇迁入 `src/main/main-app/threads/thread-turn-summary-service.ts`。新 owner 保留
principal/host-key authorization recheck、principal identity hashing、summary normalization/limits、compact-summary pairing、
revision tombstones、delete revision sequencing、renderer subscription cleanup、host/principal invalidation 与 dispose；唯一
runtime construction 已接回，旧 class/subscription/key helpers 已删除。

## 2026-10-31 thread read-state RPC services

原 `jnt/Mnt` 已迁入 `src/main/main-app/thread-read-state/rpc-services.ts`。新 adapters 保留 callback dup/using-scope、
owner open failure/non-ready cleanup、ready session wrapping、retired-before-wrapper race、RPC-broken unsubscribe、set/
clearForLogout forwarding，以及 callback cleanup-once；唯一 runtime consumer 已接回，旧 classes 已删除。

## 2026-10-31 thread metadata generation service

原 `I5` 已迁入 `src/main/main-app/threads/thread-metadata-generation-service.ts`。新 owner 保留 ephemeral model
config lookup、title/description generation forwarding、title failure logging/null fallback、per-host/thread summary
request replacement/abort、aborted-result suppression、non-abort error logging 与 static dispose；真实 construction/disposal
均已接回，旧 class 已删除。

## 2026-10-31 thread-catalog page-slot scheduler

原 `Ztt/E5` 已迁入 `src/main/main-app/thread-catalog/page-slot-scheduler.ts`。新 owner 保留 per-host page dispatch
serialization/throttling、global background delay、foreground promotion、host generation invalidation、pending timer
resolution、cancel-all 与 idempotent dispose；默认及显式两个 runtime constructions 已接回，旧 class 已删除。

## 2026-10-31 thread archive service

原 `Xtt` 已迁入 `src/main/main-app/threads/thread-archive-service.ts`。新 owner 保留 local-host gate、inactive rollout
archive result handling、missing-thread/provisional-thread validation、catalog removal/notification、archive side effects，
以及 single/all archived deletion 后的 automation-run refresh；唯一 runtime construction 已接回，旧 class 已删除。

## 2026-10-31 terminal command runtime

原 `C5/Gtt/Ktt/w5/T5/qtt/Jtt/Ytt` 已迁入
`src/main/main-app/terminal/terminal-command-runtime.ts`。新 runtime 保留 Windows shell basename/kind 判定、
PowerShell single-quote 与 cmd double-quote escaping、shell-specific cwd switching、CRLF/LF command normalization，
以及 WSL 固定 LF 行为；terminal session manager 的两个真实 injections 已接回，旧 helpers 已删除。

## 2026-10-31 local node-pty backend

原 `Ptt/Ftt/b5/Itt/Ltt/Rtt/ztt/Btt` 已整簇迁入
`src/main/main-app/terminal/node-pty-backend.ts`。新 runtime 保留 Windows PowerShell/GetConsoleProcessList 枚举、
sanitized environment、node-pty lazy require/spawn/callback/I/O，以及 macOS reverse process-tree SIGKILL、ESRCH 忽略、
首个非 ESRCH error 聚合和 finally root kill；terminal session manager 的真实 backend injection 已接回，旧实现已删除。

## 2026-10-31 terminal session manager wiring repair

复核真实 consumer 时发现 `createTerminalSessionManagerClass(...)` 被误留在 `S5()` return 后的不可达函数体内；
现已恢复为模块级 `Wtt` 初始化，并在既有 terminal-session-manager focused test 中加入主 chunk 结构断言。
该断言专门覆盖 TypeScript/build 可通过但运行时 factory 未执行的接线回归。

## 2026-10-31 terminal window runtime

原 `Ott/ktt/Att/jtt/h5/g5/_5/v5/y5/Mtt/Ntt` 已整簇迁入
`src/main/main-app/terminal/terminal-window-runtime.ts`。新 runtime 保留跨平台 shell discovery/command/label、
renderer-scoped terminal attach/create/trace/control、subscription replacement/RPC-broken/origin cleanup 与 terminal
query escape filtering；真实 service consumer 和后续 manager helper injections 均已接回，旧实现已删除。

## 2026-10-31 tab-drag preview service

原 `Ctt/m5/wtt/Ttt/Ett/Dtt` 已迁入 `src/main/main-app/window/tab-drag-preview-service.ts`。新 owner 保留
Darwin/Windows gate、presentation-window timer/electron 装配、zoom-aware pointer projection、visibility/fullscreen gate、
strict point/load/cue schemas 与 drag-session creation failure fallback；唯一 consumer 已接回，旧 cluster 已删除。

## 2026-10-31 macOS notification permission runtime

原 `l5/ott/stt/u5/d5/f5/ctt/ltt/utt/dtt` 已迁入
`src/main/main-app/notifications/mac-notification-permission.ts`。新 runtime 保留 Darwin gate、objc-js lazy bridge、
notification-center cache、并发请求共享 RunLoop ref-count、native error projection 与 request lifecycle logging；唯一
runtime consumer 已接回，旧 globals/functions 已删除。

## 2026-10-31 system audio spectrum service

原 `c5/ntt/rtt/itt` 已迁入 `src/main/main-app/capture/system-audio-spectrum-service.ts`。新 runtime 保留 macOS
14.2+ gate、SpectrumCapture lazy singleton、per-renderer subscription、levels backpressure，以及 load/error/RPC-broken/
renderer teardown cleanup；唯一 runtime consumer 已接回，旧 function/classes/shared singleton 已删除。

## 2026-10-31 shortcut capture service

原 `Zet/Qet` 已迁入 `src/main/main-app/window/shortcut-capture-service.ts`。新 owner 保留 focused-window gate、
bare-modifier native capture、next-modifier promise rollover，以及 blur/navigation/destroy/render-process-gone 时的
native capture、keyboard hook、listeners 与 waiter cleanup；唯一 runtime consumer 已接回，旧 classes 已删除。

## 2026-10-31 notifications service

原 `Jet/Yet/Xet` 已迁入 `src/main/main-app/notifications/notifications-service.ts`。新 owner 保留跨平台声音预览、
macOS 自定义声音导入/校验、窗口恢复聚焦、通知 action RPC 转发与 dismiss 路由；唯一 consumer 已接回。

## 2026-10-31 SSH connection registration

原 `s5/$et/ett` 已迁入 `src/main/main-app/remote/ssh-connection-registration.ts`。新 owner 保留 alias schema、
metadata resolve/fast path、saved catalog 与 auto-connect persistence、foreground/background refresh、existing alias
identity reuse 与 remove cleanup；唯一 runtime consumer 已接回，旧 schema/class 已删除。

## 2026-10-31 artifact RPC services

原 `Met/Het` 已迁入 `src/main/main-app/artifacts/artifact-rpc-services.ts`。新 adapters 保留 external document
activate/unbind 与 artifact-session append/dirty/readAsset/unsubscribe 转发，并保持 dispose 直接触发资源释放的原始
语义；两个 runtime factories 已接回，旧 classes 已删除。

## 2026-10-31 artifact document store

原 `bet/xet/E8/D8/Cet/wet/O8/Tet/Eet/k8/A8/j8/Det/M8/N8/Oet/P8/ket/F8/I8/L8/R8/z8/B8/V8/H8/U8/W8/G8/K8/q8/J8/Y8`
已整簇迁入 `src/main/main-app/artifacts/artifact-document-store.ts`。新 owner 保留 durable schema/hash validation、
per-record serialization、atomic temp-file writes、adopt/find/read、update idempotency/collision、retention/compaction、
clean-session refresh 与 materialization prepare/reconcile/finish journal；唯一 runtime consumer 已接回，旧实现已删除。

## 2026-10-31 artifact documents owner

原 `h4/g4/_4/K5e/q5e/v4/J5e/Y5e/X5e/Z5e/Q5e/y4/$5e/e7e/b4/t7e/n7e` 已整簇迁入
`src/main/main-app/artifacts/artifact-documents.ts`。新 owner 保留 strict request schemas、workspace/exact-file
授权、realpath/hash 重验、per-path serialization、adopt/read/append/refresh、subscriber broadcast/cleanup、pending
staged-file recovery 与 materialization 两阶段提交/冲突/大小限制；唯一 runtime consumer 已接回，旧实现已删除。

## 2026-10-31 remote host-config runtime

原 `B5e/V5e/H5e/U5e/W5e/m4/G5e` 已迁入 `src/main/main-app/remote/host-config-runtime.ts`。新 runtime
保留 SSH/WSL/Remote Control catalog-to-host-config projection、SSH transport args、WSL commands、remote label 与
per-surface request-user-input activity/presentation/snooze forwarding；三个真实 consumers 已接回，旧实现已删除。

## 2026-10-31 remote RPC services

原 `R5e/z5e` 已迁入 `src/main/main-app/remote/remote-rpc-services.ts`。新 adapters 保留 remote-control 默认名
修正转发、hosted PIP task/presentation/layout 转发、per-conversation native-video 引用计数，以及 origin destroyed/
navigate/render-process-gone 时的 listener 与残余订阅清理；两个 runtime consumers 已接回，旧 classes 已删除。

## 2026-10-31 remote-control device-key client

原 `M5e/N5e/P5e/d4/F5e/I5e/L5e/f4/p4` 已迁入
`src/main/main-app/remote/remote-control-device-key-client.ts`。新 owner 保留 native addon lazy load/cache、默认
hardware-only key、connection/enrollment audience/scopes、nonce 与 SHA-256 digest 校验、canonical payload field
allowlist、domain-separated UTF-8 signing bytes 与 base64 projection；唯一 runtime consumer 已接回，旧实现已删除。

## 2026-10-31 remote connections handler

原 `D5e/O5e/k5e/A5e/j5e/u4` 已整簇迁入
`src/main/main-app/remote/remote-connections-handler.ts`。新 owner 保留 SSH/WSL/Remote Control catalog refresh
generation、shared-state reconciliation、auto-connect sequencing、connection create/connect/disconnect、saved schema
migration/backfill、analytics IDs、remote-control enrollment/auth 状态、远程目录浏览与 authoritative host reconciliation；
唯一 runtime consumer 已接回，旧 876 行实现已物理删除。SSH config 通用 parser 保持独立。

## 2026-10-31 realtime voice thread title coordinator

原 `Y8e/z2` 已迁入 `src/main/main-app/realtime/voice-thread-title-coordinator.ts`。新 owner 保留 session-id
correlation、结束后标题生成、source/target connection lifetime guards、registry/principal/account retirement、
execution-policy readiness/变更中止、guarded generation client、默认标题覆盖限制、失败日志与 pending generation
cleanup；唯一 runtime consumer 已接回，旧 class/helper 已物理删除。

## 2026-10-31 realtime presentation coordinator

原 `L2/H8e/U8e/W8e/G8e/K8e/q8e/J8e/R2` 已整簇迁入
`src/main/main-app/realtime/presentation-coordinator.ts`。新 owner 保留 static factory contract、surface
registration/anchor/eligibility、preferred and requested surface selection、main-thread/global-overlay/in-window
handoff、dock/fade/native accessory motion、focus grace/fallback/wait timers、toast/offset/visibility publishing 与
RPC/surface disposal；唯一 runtime consumer 已接回，旧实现已物理删除。

## 2026-10-31 multi-agent activity service

原 `z8e/B8e/V8e/I2` 已迁入 `src/main/main-app/realtime/multi-agent-activity-service.ts`。新 owner 保留
per-realtime-thread newest-first ID dedupe、100-entry retention、session-start reset、matching session end/failure reset、
host disconnect cache/session cleanup、initial/push snapshots 与 RPC broken/unsubscribe/dispose lifecycle；唯一 runtime
consumer 已接回，旧实现已物理删除。

## 2026-10-31 realtime voice host coordinator

原 `I8e/L8e/R8e/F2` 已整簇迁入 `src/main/main-app/realtime/voice-host-coordinator.ts`。新 owner 保留
static `{rpc, dispose}` contract、single renderer claim、snapshot publication、microphone/output intent queues、native
microphone companion、dictation/real-delegation forwarding、screen capture race gates、transfer handoff、orphan stop、
host-disconnect terminate、release/restart blockers 与 subscriber RPC cleanup；唯一 runtime consumer 已接回，旧实现
已物理删除。

## 2026-10-31 app-server realtime event bridge

原 `F8e`、`E8e/D8e/.../P8e` notification schemas 与 `O8e/k8e/T2/j2/M2/N2/P2` projection/key helpers
已整簇迁入 `src/main/main-app/realtime/app-server-event-bridge.ts`。新 owner 保留 connection registry add/remove、
session correlation/awaiting-close、BEM turn/item timestamps、transcript/handoff normalization、agent-message inline
presentation detection、created-thread/subagent/real-delegation 与 multi-agent activity projection、transport-lost/error/
closed lifecycle；唯一 runtime consumer 已接回，旧实现已物理删除。

## 2026-10-31 realtime voice history ledger

原 `b8e/C8e/w8e` 及独占 `x8e/x2/S2/S8e/C2/w2/T8e` helpers 已整簇迁入
`src/main/main-app/realtime/voice-history.ts`。新 runtime 保留 durable timeline append、transcript accumulator、
session/turn/item/presentation projection、restore-time interrupted/failed sealing、ephemeral in-memory records 与
forget tombstone、live transcript merge、locator-matched subscriber updates、RPC broken/unsubscribe/dispose cleanup；
唯一 voice-history service consumer 已接回，旧实现已物理删除。

## 2026-10-31 realtime memory summary reader

原 `y8e` 已迁入 `src/main/main-app/realtime/memory-summary.ts`。新 RPC owner 保留 execution-host Codex home 与
platform path 并发解析、remote filesystem read、空白内容/null 与失败/null projection；唯一 runtime consumer
已接回，旧 class 已物理删除。现有 `computer-use/memory-summaries.ts` 属于 CUA 多文件 ambient protocol，未重复。

## 2026-10-31 realtime continuity history

原 `p8e/m8e/h8e/v2/g8e/y2/_8e/b2/v8e` 已整簇迁入
`src/main/main-app/realtime/continuity-history.ts`。新 owner 保留 file schema validation/empty fallback、Codex home
path、message trim/truncate、per-thread tail retention、directory creation/newline JSON write、process-wide serialized
write queue 与 rejection recovery；唯一 realtime consumer 已接回，旧实现已物理删除。

## 2026-10-31 AirPods microphone mute companion

原 `l8e/u8e/d8e/f8e` 已整簇迁入 `src/main/main-app/realtime/airpods-microphone-mute.ts`。新 runtime
保留 native addon packaged/dev resolution、Darwin kernel capability gate、addon callback forwarding、mute ack、
resume/capture-changed recovery coalescing、restart/forward failure logging、pending immediate cancellation 与
idempotent stop；realtime voice feature-gate consumer 已接回，旧实现已物理删除。

## 2026-10-31 window interaction RPC services

原 `s8e/c8e` 已迁入 `src/main/main-app/window/interaction-rpc-services.ts`。新 adapters 保留 quick-chat
controller/origin forwarding、realtime starter stop guard、active voice stop、ephemeral locator 标记与 start/cancel/
complete/unregister lifecycle；service map 中的两个运行时构造点均已接回，旧 classes 已物理删除。

## 2026-10-31 projects manager owner

原 `o8e`、独占 project-order merge `m2` 与 `r8e/h2/g2/i8e/_2/a8e` request schemas 已整簇迁入
`src/main/main-app/projects/projects-manager.ts`。新 owner 保留 local/remote project CRUD、duplicate/root consent、
serialized order writes、backend move/order/delete undo、appearance、storage/workspace projection、membership inference
delegation和 renderer global-state/workspace broadcasts；唯一运行时构造点已接回，旧实现已物理删除。

## 2026-10-31 thread membership inference

原 `t8e/n8e` 已迁入 `src/main/main-app/projects/thread-membership-inference.ts`。新模块保留 affected root
normalization、canonical host identity alias、project root winner selection、workspace hint 批量回读、同 basename
Git origin 排歧、app-server thread pagination、既有/排除/projectless gate，以及 assign/projectless recovery
projection；ProjectsManager 唯一调用点真实接回，旧实现已物理删除。

## 2026-10-31 project folder consent cluster

原 `X6e` schema、`Z6e` manager、`Q6e` RPC service 与 `$6e` subscription 已整簇迁入
`src/main/main-app/projects/project-folder-consent.ts`。新 runtime 保留 config trust parse、normalized folder
dedupe、trusted skip、unknown/untrusted prompt grouping、focused-window selection、late subscription wait、confirm
serialization、AbortSignal race、RPC broken 和 destroyed/render-process-gone cleanup；真实 manager 与窗口 service
consumer 均已接回，旧实现已物理删除。

## 2026-10-31 local project cache

原 `p2` 已迁入 `src/main/main-app/projects/local-project-cache.ts`。新 owner 保留 local-host identity、persisted
project snapshot、create/delete、partial name/root update、updatedAt 与 appearance projection；两个 runtime
consumer 均直接构造新 class，旧实现已删除。共享 `jr/Rr` 仍服务其他项目读取/写入路径，故保持单一实现并注入。

## 2026-10-31 host app-server projects owner

原 `Y6e` 已整体迁入 `src/main/main-app/projects/host-app-server-projects.ts`。新 owner 保留 project list
pagination、legacy/server ID persistence、local cache migration、project CRUD/order、recoverable delayed deletion、
thread assignment migration/observation 与 connection/membership AbortController 生命周期；主入口只做显式依赖装配，
运行时 consumer 仍直接构造该 class，旧实现已物理删除。`H6e` project-order diff 与 `d2` keyed queue 仍被
相邻装配复用，故保持单一实现并注入，没有复制状态 owner。

## 2026-10-31 pending project deletion scheduler

原 `K6e` 已迁入 `src/main/main-app/projects/pending-project-deletion-scheduler.ts`。新 owner 保留 persisted
pending deletion map、active identity 切换、timer replace/stop、deleteAfter delay、失败日志与 30 秒 retry；
`Y6e` 直接构造新 class，旧实现已物理删除。

## 2026-10-31 thread project assignment writer

原 `W6e` 已迁入 `src/main/main-app/thread-catalog/thread-project-assignment-writer.ts`。新 owner 保留 keyed
serialization、thread read/observe/adopt、local/server project ID 映射、projectless membership、metadata write
与 paginated assignment migration；`Y6e` 继续真实构造新 class。`d2` 仍被 host manager 共享，故单一保留并
注入，旧 class 已物理删除。

## 2026-10-31 projectless directory chooser

原 `V6e` 已迁入 `src/main/main-app/workspace/projectless-directory-chooser.ts`。新 owner 保留 BrowserWindow
owner-aware open dialog、configured/default root、absolute path 与 WSL validation、lstat real-directory/
non-symlink 检查和 R/W/X access gate；runtime 唯一 consumer 直接实例化新 class，旧实现已删除。无 consumer
且行为不完整的 `misc/project-sync.ts` skeleton 同时删除，其余真实 sync owners 未被误标为已迁。

## 2026-10-31 process memory snapshot cache

原 `z6e` 与独占 ancestor helper `B6e` 已迁入
`src/main/main-app/startup/process-memory-snapshot-cache.ts`。新 owner 保留 5 秒 snapshot cache、并发
single-flight、main process projection 以及 electron/app-server/rollout/other RSS 分类；全局 runtime consumer
`Qnt` 直接实例化新 class，旧实现已物理删除。

## 2026-10-31 primary runtime host

原 `L6e` 已迁入 `src/main/main-app/misc/primary-runtime-host.ts`。新 owner 保留 local-only install/cancel/
repair、dependency diagnostics/tool、feature promise cache、progress fanout、update poller wiring、Windows framework
restore/retry 与 subscriber/timer cleanup；main 唯一 consumer 直接实例化新 class。旧 class 以及无 consumer、
行为错误的 `misc/primary-runtime.ts` skeleton 已物理删除。

## 2026-10-31 primary runtime update poller

原 `O6e` 已迁入 `src/main/main-app/misc/primary-runtime-update-poller.ts`。新 owner 保留 static/dynamic
feature gates、startup/scheduled/manual update policy、hourly jitter persistence、single-flight 与 immediate-check
合并、cache status 分支、install trigger/payload 和 failure logging；真实 `L6e` host 直接构造新 class，旧实现
已物理删除。既有 `misc/primary-runtime.ts` 仍含未接回 host/installer skeleton，后续继续整簇替换。

## 2026-10-31 plugin incentives client

原 `w6e`、`x6e/S6e/C6e` schemas、`V0` JWT identity predicate 与 `B0` receipt owner 已整簇迁入
`src/main/main-app/plugins/incentives-client.ts`。新 owner 保留双端 token identity gate、401 refresh、
404 unavailable、409 capacity、response 后身份漂移取消、receipt 去重与 AbortController dispose；唯一 runtime
consumer 直接实例化新 class，旧实现已物理删除。

## 2026-10-31 authorized thread catalog service

原 `d1e` 已迁入 `src/main/main-app/thread-catalog/authorized-service.ts`。新 owner 保留 ChatGPT host
authorization、principal/account source generation gate、population/source lease ownership、status/observation
callback filtering、RPC-broken cleanup 与完整 dispose lifecycle；runtime 唯一 consumer 直接实例化新 class，
旧实现已物理删除。

## 2026-10-31 workspace file service owner

原 `p$e` 已迁入 `src/main/main-app/workspace/files.ts`，替换此前未接回的 skeleton。新 owner 保留
temporary-file set/dispose、native thumbnail serialization/timeout/remote sampling、bounded read、text/blob
projection、etag conflict write、save/download copy 与 Downloads icon；main 唯一 runtime consumer 已真实接回。
`fQ/pQ/mQ` 路径解析仍被相邻 file-drag service 共用，故保持单一实现并注入新 owner，未复制状态或逻辑。

## 2026-10-31 dictation history owner

原 `W$e` 和独占 `EQ/L$e/DQ/R$e/OQ/kQ/G$e/MQ` helpers 已迁入
`src/main/main-app/dictation/history.ts`，替换此前未接回的 skeleton。新 owner 保留 schema validation、
serialized initialization、chunk hard-link 去重、metadata/download 原子落盘与 fsync、interrupted recovery、
20 条容量清理、legacy global-history 导入/回写以及 query invalidation；main runtime 与 global dictation
recordHistoryText 均直接消费新实现。

## 2026-10-31 WorktreeService owner

原 `XQe` 已整体迁入 `src/main/main-app/workspace/worktree-service.ts`。新 owner 保留 pending worktree
状态机、worker event subscriptions、stream output routing、newborn/cancelled root 保护、archive cleanup 与
owner transfer、managed create/delete、自动清理 planning/recheck、notification 和 restart blocker 语义；
main 的 per-host service registry 直接实例化 factory，旧 31 个方法和独占 helpers 已物理删除。

## 2026-10-31 command session backend

原 `NQ` command-session owner 已迁入 `src/main/main-app/terminal/command-session-backend.ts`；异步 session、
UTF-8 delta decode、write scheduling/serialization、resize/terminate、exit/error 和 dispose lifecycle 均由语义
class 持有，cloud-terminal 唯一 consumer 直接实例化 factory，旧 class 已物理删除。

## 2026-10-31 remote localhost navigation

原 `OZ` 已迁入 `src/main/main-app/browser-sidebar/remote-localhost-navigation.ts`；local/durable/SSH host
分流、localhost port 识别、remote port-forward、URL rewrite 和失败降级均由语义 forwarder 持有，main 唯一
consumer 直接调用新实现，旧函数已物理删除。

## 2026-10-31 WebContents host client

原 `kZ` adapter 已整体迁入 `src/main/main-app/app-server/web-contents-host-client.ts`。新 owner 保留普通/
critical chunked send、background-throttled window 对非 owned thread 消息的过滤、destroy listener fanout、
focus/blur listener 单一注册与最后订阅 cleanup；main 的 5 个 consumer 经稳定别名直接构造语义 class，旧
class 已物理删除。

## 2026-10-31 project folder picker

原 `iQe` project-folder picker 已整体迁入 `src/main/main-app/workspace/project-folder-picker.ts`。新 owner
保留 remote request 路由、本地 Electron directory dialog、Finder hidden-files preference 的 100ms timeout、
source normalize/stat、project create/select/rename 与 renderer 回执顺序；`r$e` 的唯一构造点直接实例化
语义 factory，旧 class 和专用 timeout 常量已物理删除。

## 2026-10-31 main-thread jank sampler

原 `vQe` 定时器状态 owner 已迁入 `src/main/main-app/startup/main-thread-jank-sampler.ts`；100ms tick、
900ms drift 判定、10 次计数上限、system suspend/resume baseline、listener/interval cleanup 与 snapshot reset
均由语义 class 持有。main 的 SamplerManager 装配点显式注入真实 Electron/timer dependencies，旧 class 与
default options 已物理删除。

## 2026-10-31 Electron performance snapshot owner

原 `uQe` 与其独占 `jZ/fQe/pQe/MZ` helpers 已整体迁入
`src/main/main-app/startup/electron-performance-snapshot-collector.ts`。新 owner 保留 renderer WebContents
按 OS process 聚合、working-set 排名与跨 snapshot delta、performance-span CPU snapshot、descendant process
kind/root/command/rank 字段、internal build command disclosure gate 和 child-process delta；startup 唯一 consumer
直接实例化语义 factory，main 中旧 class/helper 已物理删除。

## 2026-10-31 IAB 组合根复核

`tQe` 相邻的两个独立状态 owner 已完成物理迁移：`$Ze` 的站点 annotation feature availability、
disabled-host settings、runtime/thread projection 由 `site-annotation-feature-controller.ts` 持有；`eQe` 的
permission pending map、request identity、navigation/render/owner teardown、同 hostname 响应与 settings
写回由 `site-annotation-permission-controller.ts` 持有。main 入口仅保留依赖适配和真实实例化，旧 class
主体已删除。

当前 `tQe` 剩余 428 行由约 104 行构造装配和 controller 委托面构成，顺序连接 page command、route、
comment、annotation、materialization、runtime、navigation、webview binding、host policy、presentation、
window/thread state、persistence、tab budget 与 page-host lifecycle，并共享同一 `windows`、session registry、
page lifecycle 和 cleanup owner。把该组合根整体移入独立模块会要求重新暴露上百个 chunk 私有依赖；拆出
构造片段又会复制 owner/初始化顺序。因此将剩余 `tQe` 标记为 preserve-coupled composition root，而非待迁
业务 owner；后续继续扫描其相邻独立 class 和其他 main 区段。

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

### 增量抽取：flavor icon base-name policy

main chunk 的 `ST` flavor 到 icon base-name 映射已迁移至
`src/main/main-app/startup/icon-flavor-policy.ts`，并接回窗口图标、托盘图标、app metadata
与系统 icon preview 的消费者。模块只接受 flavor policy 注入，不包含路径探测或 nativeImage
副作用；`scripts/test-main-icon-flavor-policy.mjs` 覆盖 Agent/Nightly/Alpha/Beta/Dev 与未知
flavor 共 6 项断言。

同一 startup icon policy 还接管了原 `CT` 的 flavor-specific dark/light Codex asset filename
后缀，metadata 与 window-services consumers 已改用 `resolveFlavorIconAssetNames`；路径读取与
nativeImage 仍留在原 owner。上述 focused suite 现覆盖 9 项 base-name/asset-name 断言。
窗口服务中 Dev local-only outline 与其他 flavor packaged/local fallback 的候选 projection 也已
接入 `resolveWindowIconResource`，路径存在性和 Electron icon 更新仍由 `dst` 持有；上述 focused
suite 现覆盖 12 项 icon policy assertions。

### 增量抽取：worker telemetry request projection

worker manager 的 `ces-telemetry` HTTP 请求与响应投影（原 `mst`，173,937-173,947）已迁移至
`src/main/main-app/worker/telemetry-request.ts`。模块通过注入 network、request URL builder 与
AbortSignal 保留 POST headers/body、成功 body cancel 和失败 response text 语义；RPC cancel map、
analytics gate 与 worker 生命周期仍由原 owner 持有。`scripts/test-main-telemetry-request.mjs`
覆盖成功/失败状态、body cancel、header 与 URL 传递共 4 项断言。

Sentry worker RPC transport 的 enabled/client/transport fallback（原 `hst.sendEnvelope`）已迁移至
`src/main/main-app/worker/sentry-envelope-transport.ts`；class 适配层仍由入口持有，focused
`scripts/test-main-sentry-envelope-transport.mjs` 覆盖 disabled、missing transport、successful
send 与 403 fallback 共 4 项断言。

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

`createExecuteTurnStart` 的 per-conversation in-flight promise 去重与 identity-safe settle cleanup 已迁移至 `src/main/main-app/conversation/turn-start-inflight-registry.ts`；turn 核心观察、状态更新与 rollback 仍由 `turn-dispatch.ts` 持有。focused test：`scripts/test-main-turn-start-inflight-registry.mjs`。

`createHostThreadReadState` 的 unread-thread subscription、retired retry、identity/host-key guard、pending event
reconcile、异步 set 与 dispose lifecycle 已迁移至 `src/main/main-app/conversation/thread-read-state-controller.ts`；
`host-assembly.ts` 删除旧的内嵌实现，仅保留 assembly consumer。focused test：`scripts/test-thread-read-state-controller.mjs`。

`AppServerRequestSender.send` 的 prewarm/normal dispatch、timeout abandon、failure notification 与 cleanup lifecycle
已迁移至 `src/main/main-app/conversation/app-server-request-lifecycle-controller.ts`；sender 仅保留 host/connection
依赖注入和 listener fan-out。focused test：`scripts/test-app-server-request-lifecycle-controller.mjs`。

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

### 增量抽取：browser permission prompt registry 生命周期

R8 browser sidebar manager 中原 `qZe`（118,428-118,590）的完整权限提示 registry 已迁移至
`src/main/main-app/browser-sidebar/browser-permission-prompt-registry.ts`。模块持有 pending prompt 与
renderer subscription 两组状态，保留 orphan 自动 dismiss、snapshot 数组/记录复制、mount generation
同步、跨窗口 transfer 时 UUID 轮换、page/host/renderer/navigation identity gate、response action 与
geolocation accuracy 校验，以及 prompt closed、owner destroyed、RPC broken 和显式 dispose 的清理顺序。

原 main consumer 继续注入既有 `wZ/GZe/KZe` schemas、`crypto.randomUUID`、`n.Uf` RPC target adapter
与 `browserPageHostLifecycle.findPageStateForWebContentsId`，main chunk 内旧 `qZe` 实现已删除。
`scripts/test-main-browser-permission-prompt-registry.mjs` 覆盖 25 项 registry 生命周期断言。

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

### 增量抽取：native status item menu projection

macOS `Mst.refreshMenu` 的菜单状态 JSON projection 已迁移至
`src/main/main-app/startup/native-status-item-menu.ts`，由
`projectNativeStatusItemMenuState` 统一保留 app/feature/label/thread 字段与顺序。原入口仅
负责 native addon 的 `updateStatusItemMenuState` 副作用、i18n label 获取和状态生命周期；
`scripts/test-main-native-status-item-menu.mjs` 覆盖完整 payload 与线程快照隔离断言。

`Qot.createWindow` 的 BrowserWindow constructor options projection 已迁移至
`src/main/main-app/startup/browser-window-options.ts`，保留 bounds/title/icon/background、
platform menu-bar、appearance options、minimum size 与 webPreferences 字段语义；窗口创建后
的 Electron event/listener、navigation、registration 与 cleanup 生命周期仍由 `Qot` 持有。
`scripts/test-main-browser-window-options.mjs` 覆盖完整字段与可选 x/y/icon/menu-bar 边界。

language-server Kotlin runtime 的 `workspace.json` 配置 projection 已迁移至
`src/main/main-app/language-server/kotlin-workspace-config.ts`，由 Kotlin session setup 的
文件写入 consumer 真实调用；host path、runtime discovery、directory/file I/O 与 process
生命周期仍由 language-server owner 持有。`scripts/test-main-kotlin-workspace-config.mjs`
覆盖完整配置字段和不同 workspace root 的实例隔离。

### 增量抽取：language-server manager 生命周期

R9 原 `W0e`（135,633-135,804）的完整 language-server manager 已迁移至
`src/main/main-app/language-server/language-server-manager.ts`。模块持有按
`hostId + providerId + normalized workspace root` 建立的 pending/session promise registry，保留
capabilities/hover/locations 路由、unsupported/empty 日志、请求失败后的 session dispose、空结果的
identity-safe cache cleanup、session stop 后 key 回收，以及 manager dispose 对 pending session 的异步清理。

managed runtime 的 `expired-build` 分支继续保持首次 runtime id 单次 mark/notification、随后重新启动，
以及二次 expired 日志；原 `Q0e` consumer 注入 providers、`B0e` process/LSP transport、协议 method、
hover normalization 与 logger，main chunk 内旧 `W0e` 实现已删除。`B0e` 仍拥有 spawn 与 JSON-RPC
initialize，`z0e` 仍拥有单 session 文档同步/idle timeout，owner 边界没有复制。
`scripts/test-main-language-server-manager.mjs` 覆盖 39 项 focused assertions。

### 增量抽取：sampler manager 生命周期

R8/startup 原 `SQe`（121,519-121,626）的完整 app-state 与 performance sampling manager 已迁移至
`src/main/main-app/startup/sampler-manager.ts`。模块拥有 heartbeat timer、pending snapshot request
registry 和 performance-span sampling map，保留 non-heartbeat throttle、primary window focus/readiness
检查、renderer request/WebContents identity gate、host/browser/stdio/jank 字段富化、main-thread jank
attention 日志、Sentry breadcrumb，以及 WebContents destroyed 与 manager dispose 的清理顺序。

原 main app 唯一 consumer 注入既有 Electron sampler、`n.Sc` TTL registry、`ct` interval gate、
`vQe` jank sampler、app-server stdio stats、BrowserWindow attention projection 和 window manager；main chunk
内旧 `SQe` 实现已删除。`scripts/test-main-sampler-manager.mjs` 使用 esbuild 临时 bundle，覆盖 38 项
heartbeat/trigger/response/enrichment/performance-sampling/dispose focused assertions。

### 增量抽取：Quick Chat window manager 生命周期

R10/window 原 `kat`（166,893-167,087）的完整 Quick Chat window manager 已迁移至
`src/main/main-app/startup/quick-chat-window-manager.ts`。模块拥有 per-origin prewarm registry、claimed
prewarm set、pending route-ready window registry 与提前 ready id set，保留 lazy window create/take、
origin identity 替换、renderer conversation identity handshake、ready timeout/closed 清理、打开失败回收，
以及 manager dispose 对 prewarm/claimed/pending window 的完整释放。

原 startup 唯一 consumer 注入既有 `GN` lazy holder、`WindowManager.createWindow`、route builder、
`BrowserWindow.fromWebContents`、display work-area、logger 与真实 timer；main chunk 内旧 `kat` 实现已删除。
窗口仍按 owner content bounds 将 popover 右下角投影到匹配 display，并保持最小 400 px 与 work-area clamp。
`scripts/test-main-quick-chat-window-manager.mjs` 使用 esbuild 临时 bundle，覆盖 40 项 focused assertions。

### 增量抽取：tab-drag presentation window 生命周期

R10/window 原 `Ctt`（153,897-154,082）的完整 tab-drag presentation owner 已迁移至
`src/main/main-app/window/tab-drag-presentation-window.ts`。模块创建并拥有透明、不可交互的 Electron
BrowserWindow，保留 isolated data document 加载、snapshot markup/image decode、最新 cue generation
串行应用、非空 capture readiness、cursor-relative 定位去重、16ms pointer-follow 与一次性 freeze。

原 `Ett.create()` consumer 注入真实 BrowserWindow、screen cursor 和 timer adapters，`Dtt` 继续负责
owner bounds 与 RPC schema 校验；main chunk 内旧 `Ctt`、data URL 和 timeout constants 已删除。
load/show 的 3 秒 timeout、load/execute/capture 异常降级、closed 事件与显式 dispose 均释放 interval 和窗口。
`scripts/test-main-tab-drag-presentation-window.mjs` 使用 esbuild 临时 bundle，覆盖 47 项 focused assertions。

### 增量抽取：tab-drag session 生命周期

R10/window 原 `Dtt`（154,119-154,230）的完整 tab-drag RPC session 已迁移至
`src/main/main-app/window/tab-drag-session.ts`。模块拥有 presentation lifetime 与 single-load 状态，保留
ready/updateCue/load/show/freeze/dispose 调用面、load 前 ready gate、load 中 dispose race、presentation
false/rejection 清理，以及 owner content bounds 对 snapshot size/grab offset 的约束。

原 `Ett.prepare()` consumer 继续使用既有 `Ttt/wtt/m5` schemas，并以 parse adapters 注入，因此 nullable
cue 与字段范围语义未复制；presentation 由上批迁移的 `TabDragPresentationWindow` 提供。main chunk 内旧
`Dtt` 实现已删除。`scripts/test-main-tab-drag-session.mjs` 使用 esbuild 临时 bundle，覆盖 51 项 focused
assertions，包括 bounds 边界、invalid payload、一次性 load、异步销毁竞态和 freeze 坐标投影。

### 增量抽取：startup renderer coordinator 生命周期

R10/startup 原 `ttt`（153,538-153,642）的完整 renderer startup phase coordinator 已迁移至
`src/main/main-app/startup/startup-renderer-coordinator.ts`。模块拥有 content-ready 状态、严格有序的
renderer phase buffer、startup-phase subscription 与 primary-window subscription，保留 `whenReady()` 对
primary renderer replacement/origin destroyed 的 AbortError race，以及最终 primary identity 复核。

原 startup RPC service 唯一 consumer 注入现有 `primaryWindowContentReady.promise`、startup phase tracker、
WindowManager、origin WebContents 与 Sentry gate；main chunk 内旧 `ttt` 实现已删除。buffer 继续要求
`renderer_ready -> first_content_visible -> background_ready`，并在 startup-ready 与 host-ready 同时满足后
flush；切换 primary 或销毁 origin 会取消两组订阅并永久停用 coordinator。
`scripts/test-main-startup-renderer-coordinator.mjs` 覆盖 46 项 focused assertions。

### 增量抽取：system permissions service

R10/startup 原 `ytt`（153,684-153,787）的完整 renderer-facing system permissions service 已迁移至
`src/main/main-app/startup/system-permissions-service.ts`。模块保留 Electron notification permission 到
enabled/disabled/not-determined 的映射、macOS microphone pre/post 状态与 request result、Windows/macOS
设置 URL 分流、未知通知权限时触发 native request 后等待 2 秒，以及 screen-recording/accessibility/Finder
操作的 platform gate 与逐方法错误日志。

原 startup RPC service 唯一 consumer 注入现有 Objective-C notification request helper、Electron
Notification/systemPreferences/shell、permission app path、build-flavor availability gate 与 logger；native
RunLoop helper 仍由原 owner 持有。main chunk 内旧 `ytt` 和仅由其消费的 URL constants 已删除。
`scripts/test-main-system-permissions-service.mjs` 使用 esbuild 临时 bundle，覆盖 55 项平台矩阵、授权结果、
URL/等待顺序与异常降级 focused assertions。

### 增量抽取：external document binding registry 生命周期

R10/remote-artifact 原 `jet`（152,279-152,389）的完整 external document binding registry 已迁移至
`src/main/main-app/remote-artifact/external-document-binding-registry.ts`。模块拥有 binding map 与 RPC endpoint
副本，保留 capability-specific host connect、artifact/binding id 创建、RPC broken cleanup、单 thread identity
约束、activation single-flight/失败重试，以及 capture/apply callback 的 schema、abort 与结果释放顺序。

原 artifact session manager `Vet` consumer 注入现有 `Met` binding wrapper、`X8/Aet` schemas、
`crypto.randomUUID` 与带 connection epoch 校验的 host caller；main chunk 内旧 `jet` 实现已删除。显式 unbind、
activation 中关闭、host unbind 失败和 registry dispose 继续幂等释放两端 RPC endpoint。
`scripts/test-main-external-document-binding-registry.mjs` 使用 esbuild 临时 bundle，覆盖 43 项 bind、activation、
callback routing、retry、broken-RPC 与 dispose focused assertions。

### 增量抽取：native artifact file service 生命周期

R10/remote-artifact 原 `Fet`（152,330-152,438）的完整 native artifact file service 已迁移至
`src/main/main-app/remote-artifact/native-artifact-file-service.ts`。模块拥有 artifact kind 对应的临时探测文件、
native/system-default target 投影与稳定 SHA-256 id、snapshot 临时副本权限，以及 open/show/download action
路由；成功 open 保留外部应用所需文件，失败路径和 target discovery 均清理临时目录。

原 artifact session manager `Vet` consumer 注入现有 native snapshot publisher、artifact kind resolver、
open-target/download services、local host id 与 256 MiB 上限；main chunk 内旧 `Fet` 及专用 `Net/Let/Ret`
helpers 已删除。snapshot 读取继续校验普通文件、声明长度、最大大小与实际读取长度。
`scripts/test-main-native-artifact-file-service.mjs` 使用 esbuild 临时 bundle，覆盖 40 项 discovery、projection、
temporary-file ownership、action routing、cleanup 与 snapshot validation focused assertions。

### 增量抽取：browser page host lifecycle

R8/IAB 原 `vZe`（117,310-117,619）的完整 browser page host lifecycle 已迁移至
`src/main/main-app/browser-sidebar/browser-page-host-lifecycle.ts`。模块拥有 renderer instance 与 host generation
交接、attached webview host identity、全局 lifecycle sequence、pending attach cleanup、页面 suspend 请求和
teardown/finalize 状态机；stale attach、跨 route rebind 与 transfer-close 均保留原拒绝或收尾顺序。

原 IAB/browser-sidebar manager `tQe` 唯一 consumer 注入现有 persistence/session registry、page binding、
window/thread lookup、transfer helper、tab budget 与 telemetry adapters；main chunk 内旧 `vZe` 和专用 5 秒
incomplete-navigation constant 已删除。`scripts/test-main-browser-page-host-lifecycle.mjs` 使用 esbuild 临时
bundle，覆盖 65 项 renderer replacement、host registration、attach/rebind、session projection、suspension、
teardown race、page disposal 与 transfer focused assertions。

### 增量抽取：browser tab working-set manager 生命周期

R8/IAB 原 `xZe`（117,543-117,730）的完整 tab working-set/activity manager 已迁移至
`src/main/main-app/browser-sidebar/browser-tab-working-set-manager.ts`。模块拥有全局单调 activity sequence/time、
per-window active conversation 与 selected-tab working set、30 分钟 selection protection、per-window expiry
timer，以及 32 个 live-detached renderer 的 suspension budget。

候选选择继续按 inactive-secondary、inactive-selected、current-thread-secondary 排序，再以 activity sequence
和 tab id 稳定破局；active/presented/browser-use/capture/audio/loading/restoring/download 全部保护条件、恢复或
pending-suspension barrier、debug event payload 与 window-close timer cleanup 均保留。原 `tQe` consumer 直接
实例化新 manager，main chunk 内旧 `xZe`、`hZ/gZ` 和专用 `_Z/SZe` 已删除。
`scripts/test-main-browser-tab-working-set-manager.mjs` 使用 esbuild 临时 bundle，覆盖 41 项 focused assertions。

### 增量抽取：artifact subscription manager 生命周期

R10/remote-artifact `Vet` 内完整 subscription/session 子 owner 已迁移至
`src/main/main-app/remote-artifact/artifact-subscription-manager.ts`。新 manager 拥有 subscription id/map、
update/flush RPC endpoint 副本、host open/close identity、append/read-asset/mark-dirty 路由、event delivery、
flush context 与 connection epoch 校验，以及 RPC broken、unsubscribe 和 service drain 的清理顺序。

原 `Vet` consumer 注入现有 host client connection、`Het` wrapper、document/update/asset parsers、base64 codec、
error-code 与 logger adapters；host callback/event 注册直接路由到新 manager。main chunk 已删除约 250 行旧
subscription 实现及专用 RPC method constants，dispose 继续先 drain subscriptions、关闭 host subscription，
再关闭 client。`scripts/test-main-artifact-subscription-manager.mjs` 使用 esbuild 临时 bundle，覆盖 50 项
open/collision、append/read/dirty、event/flush、connection identity、RPC broken 与 drain focused assertions。

### 增量抽取：artifact session host service 生命周期

R10/remote-artifact 原 `Vet` 的剩余 host owner 已整体迁移至
`src/main/main-app/remote-artifact/artifact-session-host-service.ts`。新 service 拥有 connection-info identity、
client single-flight creation、connect/ping reconciliation、event/host-call wiring、disconnect invalidation、
external-document capability 与 routing、native snapshot/kind/capability RPC 和错误映射，以及 child drain、
host subscription close、listener detach 与 client close 的最终清理顺序。

原 main consumer 现仅注入现有 RPC client、schema parser、logger、`ExternalDocumentBindingRegistry`、
`ArtifactSubscriptionManager` 与 `NativeArtifactFileService` adapter；旧 `Vet` class、私有状态字段和方法已整体删除，
符号仅作为 `ArtifactSessionHostService` 的构建产物别名保留。`scripts/test-main-artifact-session-host-service.mjs`
使用 esbuild 临时 bundle，覆盖 37 项 single-flight、routing、native error mapping、epoch/disconnect、dispose
和 create/dispose race focused assertions。

### 增量抽取：terminal session manager 生命周期

R10/terminal 原 `Wtt` 的完整 session manager 已迁移至
`src/main/main-app/terminal/terminal-session-manager.ts`。新 manager 拥有 session/conversation mapping、
pending create/abort、owner listener、action restart queue、buffer snapshot、create/attach/transfer/write/resize/close、
local/remote/durable backend routing 与 dispose cleanup 状态机。

原 main consumer 只保留 platform/path/environment/host/process adapter 及 `ztt` node-pty backend 注入；
`Wtt` class 原 618 行主体已删除。`ztt` 本身是约 54 行的本地 PTY backend wrapper，
不是 session manager，作为平台 I/O adapter 保留。
`scripts/test-main-terminal-session-manager.mjs` 覆盖 33 项 owner、create/attach、resize、transfer、
pending abort、restart blocker 与 dispose focused assertions。

### 增量抽取：browser-use API runtime

R8/browser-use 原 `DYe` 完整 class 已迁移至 `src/main/main-app/browser-use/iab-api.ts`，
替换旧的未接回 skeleton。新 factory 真实拥有 109 个方法、21 个 Map/Set 状态容器，
保留 tab/route/session/turn、debugger/CDP target、page event、paint lease、clipboard cleanup、cursor waiter
与 one-shot download grant 的完整生命周期。原 1,371 行 class 已删除，唯一生产构造点
通过 `createIabBrowserUseApiClass` 真实接回，三个 Symbol API 与 native pipe consumer 共享同一 identity。
`scripts/test-main-iab-api-boundary.mjs` 已改为生产 owner 回归，覆盖 40 项 lifecycle assertions。

### 增量抽取：BrowserWindow manager

R12/window 原 `Qot` 完整 class 已迁移至
`src/main/main-app/window/browser-window-manager.ts`。新 factory 持有 window/webContents registry、
ready message queue、primary selection/bounds、create/register/close、appearance/backdrop/zoom/swipe、
popup/auxiliary focus 与 renderer recovery 生命周期，并复用已迁的 options/titlebar/display/
primary/diagnostics/context-menu/recovery 语义模块。原 1,022 行 class 已删除，唯一构造点
改为 dependency factory 适配。`scripts/test-main-browser-window-manager.mjs` 覆盖 33 项 owner 与接线断言。

### 增量抽取：Appshot hotkey manager

R12/hotkey 原 `Pit` 完整 class 已迁移至
`src/main/main-app/hotkey/appshot-hotkey-manager.ts`。新 manager 拥有 persisted/default hotkey、
feature/support reconciliation、macOS/native registration、Windows down/up flight、destination routing、
renderer priority lease/timer 与 dispose cleanup。原 236 行 class 已删除，startup 唯一构造点真实接回。
`scripts/test-main-appshot-hotkey-manager.mjs` 覆盖 47 项 focused assertions。
复核同时确认 `Wit` 才是 Windows native capture bridge，与 `Pit` 的 hotkey 状态所有权独立。

### 增量接回：cross-platform capture request lifecycle

R5/computer-use 原 `uM/pM/mM/hM/gM/_M/vM/yM` pending capture owner 已切换到现有
`src/main/main-app/computer-use/capture-requests.ts` 的真实生产 consumer。Windows/mac capture 和 final-update
三个路由分别接入 `startWindowsCapture`、`startMacCapture` 和 `requestFinalCaptureUpdate`，
原 199 行 Map/timer/retry/abort/update 实现已删除。
`scripts/test-main-computer-use-capture-requests.mjs` 覆盖 49 项 duplicate/timeout/retry/final-update/
origin-destroyed/external-abort/late-result ordering assertions。

### 增量抽取：hotkey-window lifecycle manager

R12/hotkey 原 `Eat` 完整 class 已迁移至
`src/main/main-app/hotkey/hotkey-window-lifecycle-manager.ts`。新 factory 拥有 legacy/command keymap、
feature/dev gate、registration rollback、cross-instance lock/onLost、1 秒 idle retry、controller prewarm/stop/dispose、
renderer/home/drag/layout/pointer delegation 和 hotkey attribution。原 `Tat/Eat` 329 行已删除，
并注入原内联 `qV/JV/YV/jN` 以保持唯一 shortcut/lock registry。
`scripts/test-main-hotkey-window-lifecycle-manager.mjs` 覆盖 57 项 focused assertions，
并锁定实际 38 methods/15 fields 的完整 owner。

### 增量抽取：Windows native capture bridge

R12/computer-use 原 `w7..F7`/`Wit` 独占 helper 与 bridge owner 已整体迁移至
`src/main/main-app/computer-use/windows-native-capture-bridge.ts`。新 module 持有 transport single-flight/exit recovery、
target decoration、native hotkey flight、capture source/update/finally、prepare/begin/cancel handshake、
file/schema/25 MiB safety 与 release/dispose drain；main 保留原 `Git(m)` 生产 consumer。
原 526 行实现已删除，`scripts/test-main-windows-native-capture-bridge.mjs` 覆盖 28 项 focused assertions。

### 增量抽取：hotkey-window presentation controller

R12/hotkey 原 `Sat` 及其独占 layout/snap/haptic/drag support 带已整体迁移至
`src/main/main-app/hotkey/hotkey-window-controller.ts`。新 factory 拥有 home/thread 双窗创建与 generation guard、
transition ack/timeout、placement/bounds、drag/snap/haptic、mouse passthrough、route navigation 与 dispose
状态机，并保留 Eat 的三参构造契约。原 presentation subsystem 物理删除 993 行。
`scripts/test-main-hotkey-window-controller.mjs` 覆盖 20 项 prewarm/open/toggle/route/pointer/dispose assertions，
typecheck/build/verify 均通过。

### 增量抽取：IAB page command/host controller

R8/IAB 原 `tQe` 的 page command/host orchestration 已迁移至
`src/main/main-app/browser-sidebar/browser-page-command-controller.ts`。新 controller 真实持有 history clone/back/forward、
focused command routing、reload/clear/scroll/find/site-info、reset/stop/audio/print/suspend、host registration/transfer、
zoom/navigate/screenshot/debugger metrics 控制流，tQe 仅保留适配与委托。原连续业务区段删除 464 行。

### 增量抽取：IAB annotation interaction controller

R8/IAB 原 `tQe` 的 annotation ingress、comment/design mode、presentation suspension、dragged-image
状态和 comment/design overlay action 已迁移至
`src/main/main-app/browser-sidebar/browser-annotation-interaction-controller.ts`，tQe 仅保留委托与
依赖注入。focused test 为 `scripts/test-main-browser-annotation-interaction-controller.mjs`（21 项）。
page command controller 的 history clone 依赖 `rW/WX/GX` 已通过显式依赖适配接回，避免抽取后引用原文件作用域。

### 增量抽取：IAB page persistence 与 presentation sync controllers

`tQe` 的 browser persistence owner（restore/ownership/reconcile/host registration/delete）及冷恢复
helper 已迁移至 `browser-page-persistence-controller.ts`，删除旧 `yZe/bZe` 实现；focused test
为 `scripts/test-main-browser-page-persistence-controller.mjs`。

`tQe` 的 view/route presentation sync、owner sync、annotation mode sync 与 presented-state lookup
已迁移至 `browser-presentation-sync-controller.ts`，原方法仅保留委托；focused test 为
`scripts/test-main-browser-presentation-sync-controller.mjs`。

### 增量抽取：IAB browser-use route 与 comment-mode controllers

browser-use route action owner（page/tab 查询、open/close/release/dispose、visibility、viewport/capture、
wait、panel、active、WebMCP、cursor）已迁移至 `browser-use-route-controller.ts`，原 tQe 方法仅保留委托；
focused test 为 `scripts/test-main-browser-use-route-controller.mjs`。

comment-mode entry owner（interaction mode、point comment/design entry、blocklist tri-state 与 pending
activation）已迁移至 `browser-comment-mode-controller.ts`，focused test 为
`scripts/test-main-browser-comment-mode-controller.mjs`。

### 增量抽取：IAB window/thread state controller

窗口状态、thread state 创建/销毁、close/transfer、页面状态 lookup、当前窗口与 detached-window
选择已迁移至 `browser-window-thread-state-controller.ts`，删除 tQe 原 inline owner；同时修正
`registerHost` 的 conversation/tab 参数契约。focused test 为
`scripts/test-main-browser-window-thread-state-controller.mjs`，既有 host lifecycle test 更新后保持 65 项通过。
`scripts/test-main-browser-page-command-controller.mjs` 覆盖 11 项历史、焦点、缩放、快照、挂载与路由断言。

### 增量抽取：browser page materialization 与 runtime sync

`tQe` 的 cold-restore/page object materialization、页面生命周期更新与 thread/runtime snapshot projection 已迁移至
`src/main/main-app/browser-sidebar/browser-page-materialization-controller.ts` 和
`src/main/main-app/browser-sidebar/browser-runtime-sync-controller.ts`；原入口保留委托与宿主依赖注入，新增
`test-main-browser-page-materialization-controller.mjs`、`test-main-browser-runtime-sync-controller.mjs` 两组 focused
断言；其 page lifecycle helper 已由 `browser-page-lifecycle-helpers-controller.ts` 接管，WebContents binding
由后续静态 binding owner 完整接回。

随后导航/command context 与 WebContents/page binding owner 已完成：`browser-navigation-context-controller.ts`
接管页面 command context、历史导航、受限导航和 browser error page；`browser-page-webview-binding-controller.ts`
已静态接管原 generated `uZ` 的完整 `bindPageToWebview` 生命周期，包含 attach、navigation/media/input/context-menu、
window-open、restore、crash/unresponsive、destroy/dispose；main-C 原约 1000 行实现已删除，新增 focused structural
assertions。runtime lifecycle helper 的 attach 完成、comment dismiss、error/navigation、reload、zoom/device metrics
与交互适配由 `browser-page-lifecycle-helpers-controller.ts` 持有，新增 5 项 focused assertions。
page WebContents identity lookup 另迁入 `browser-page-lookup-controller.ts`，tQe 仅保留委托。

### 增量抽取：IAB host policy/diagnostics controller

`tQe` 的 in-app browser admission/session、settings webview theme/mount、owner command accelerator refresh、
debug snapshot/feedback/debug-tab、MCP completion cleanup、browser-use navigation restriction wrappers、site
bootstrap cancellation 与 persistence-owner wrappers 已迁入
`src/main/main-app/browser-sidebar/browser-host-policy-controller.ts`。`isPrimaryWindowPersistenceOwner` 现基于
`browserPersistence.isPersistenceOwner(getCurrentWindowState(owner))`，修复原残缺实现。focused test 为
`scripts/test-main-browser-host-policy-controller.mjs`（17 项）。

### A3 main 剩余大 owner（2026-10-15）

`vZe/xZe/Vet/Wtt/DYe/Pit/Qot/Eat/Wit/Sat` 均已移出，cross-platform capture-request owner 也已真实接回。
当前 tQe 只剩少量 manager-level glue（例如 `isBrowserPageWebContents`）与构造时的依赖组合；页面、导航、
WebContents binding、runtime projection、policy/diagnostics、window/thread state 等大 owner 均已迁出。`ztt` 是
保留的 node-pty I/O adapter。

### A3 main 剩余 owner 复核（2026-10-11）

重新审计 main startup/window/worker assembly 后，`Ust` 内 `Be` 直接依赖 BrowserWindow 的
visible/minimized/destroyed 状态以及 Windows opacity workaround；`Ve`/`He`/`Ue` 组合
hotkey hide、window creation、deep-link navigation、notification dismissal 与 focus 顺序。
worker `H9.handleMessage`/`handleWorkerMessage` 则同时维护 pending map、WebContents destroyed
cleanup、worker-id 校验、response resolution 与 postMessage/broadcast 顺序。上述函数均为
生命周期编排而非可脱离 owner 的纯策略；本轮未制造 facade。

Rust Analyzer 的纯初始化 options projection 已迁移至
`src/main/main-app/language-server/rust-analyzer-options.ts`；`findSessionOptions` 继续负责
tool discovery、PATH/env 组装、sysroot spawn/stat 探测与 session lifecycle，helper 仅接收
探测后的 sysroot 并构造 initialization/workspace configuration。`scripts/test-main-rust-analyzer-options.mjs`
覆盖 sysroot 与 null fallback。

Pyright `findSessionOptions` 的 PATH/PYTHON 环境与可选 `pythonPath` workspace configuration
projection 已迁移至 `src/main/main-app/language-server/pyright-session-options.ts`；原 provider
继续负责 trusted command、platform path 与 runtime directory 探测。`scripts/test-main-pyright-session-options.mjs`
覆盖 Windows 分号、POSIX 冒号及缺失 Python command。

TypeScript language server 的 `tsserver` initialization payload 已迁移至
`src/main/main-app/language-server/typescript-server-options.ts`；`findInitializationOptions`
继续负责 bundled/trusted command 探测与文件存在性检查，两个发现分支共享同一纯 projection。
`scripts/test-main-typescript-server-options.mjs` 覆盖路径与 payload 隔离。

Java/JDTLS `findSessionOptions` 的 `JAVA_HOME`/`JDK_HOME`/PATH 环境 projection 已迁移至
`src/main/main-app/language-server/java-session-options.ts`；provider 继续负责 trusted
command、platform path 与 runtime/workspace 探测。`scripts/test-main-java-session-options.mjs`
覆盖 Windows/POSIX PATH 分隔符。

SourceKit-LSP 的固定 Swift Package Manager initialization payload 已迁移至
`src/main/main-app/language-server/sourcekit-options.ts`，`findSessionOptions` 继续负责
workspace directory 创建、platform/codexHome 路径解析与 process discovery；consumer 保留
原对象复用语义。`scripts/test-main-sourcekit-options.mjs` 覆盖完整 options shape。

### 增量抽取：Native context-menu lifecycle

`Qot.installNativeContextMenu` 的图片右键菜单项投影、file URL reveal、copy/save visual-content
telemetry 与 window-close cleanup 已迁移至 `src/main/main-app/window/native-context-menu.ts`。
窗口 manager 继续注入 Electron context-menu factory、shell/window side effects 与 inspect 开关，
保持 cut/copy/paste accelerator、image/main-frame 判断及 disposer 顺序；由
`scripts/test-main-native-context-menu.mjs` 覆盖非图片旁路、file URL reveal、copy/save callbacks、
跨 frame save gate 与幂等 cleanup，共 10 项 focused assertions。

### A3 startup residual owner 复核（2026-10-11）

继续审计 `dst`（172,420-176,978）后，`D/O/k` 将打包/开发资源路径与 `existsSync` fallback
绑定，`L/R` 将 nativeTheme、nativeImage、Dock 更新和异步资源下载绑定，`oe/se` 将
BrowserWindow 延迟显示与 timer/show/closed cleanup 绑定；`B/Hle/Eat/Pit` 则是窗口、热键、
dictation 与 appshot native manager 的组装入口。上述边界均为资源或窗口生命周期编排，未发现
可独立接回且不复制副作用顺序的窄纯 projection，本轮不制造 facade。

### A3 app-shell/hotkey owner 复核（2026-10-11）

`L9/cst/R9/z9` 的窗口外观与 frameless options 已由 `window-appearance` 模块真实消费；
`Eat` 的 hotkey-window idle predicate 依赖 startup phase、powerMonitor 与各 app-server
connection pending 状态；`dat` 的 dictation force-lock 依赖 global state/native pet webContents；
`Pit` 的 appshot hotkey assembly 依赖 Windows/native bridge、settings、window manager 与 query
invalidation。上述 manager options 不能脱离 owner 而不改变生命周期/副作用顺序，本轮不制造 facade。
### 增量抽取：preload connect-app-host MessagePort 生命周期

`preload/index.ts` 的 `connect-app-host` message listener 已迁移至
`src/main/preload/connect-app-host-controller.ts`，真实接回 source/type guard、
`ipcRenderer.postMessage` 的 MessagePort ownership transfer 与幂等 listener cleanup。
focused test 为 `scripts/test-connect-app-host-controller.mjs`，运行命令为
`node --experimental-strip-types scripts/test-connect-app-host-controller.mjs`。

### 增量抽取：main thread settings update 串行生命周期

`AppServerConversationManager.runThreadSettingsUpdate` 的 per-conversation pending promise
队列已迁移至 `src/main/main-app/conversation/thread-settings-update-registry.ts`，保留前序
失败吞并、current identity cleanup、wait 与 manager dispose clear。focused test 为
`scripts/test-thread-settings-update-registry.mjs`，运行命令为
`node --experimental-strip-types scripts/test-thread-settings-update-registry.mjs`。

### 增量抽取：main thread goal hydration generation 生命周期

`AppServerConversationManager` 的 per-conversation goal hydration token registry 已迁移至
`src/main/main-app/conversation/thread-goal-hydration-registry.ts`，保留新 generation
淘汰旧 token、disposed gate、archive cancel、current identity end 与 manager dispose clear。
focused test 为 `scripts/test-thread-goal-hydration-registry.mjs`，运行命令为
`node scripts/test-thread-goal-hydration-registry.mjs`（需先完成构建）。

### 增量抽取：main dynamic app-tool response registry 生命周期

`HostRequestRouter` 的动态 app-tool pending response identity、success/error/invalid route、cancel/discard
与 dispose rejection 已迁移至 `src/main/main-app/app-server/dynamic-app-tool-pending-responses.ts`；router
继续持有请求编排与 IPC side effects。focused test 为 `scripts/test-dynamic-app-tool-pending-responses.mjs`，
覆盖 7 项 duplicate identity、路由与清理断言。

### 增量抽取：preload PIP 视频帧 IPC listener 生命周期

`pip-video-decoder.ts` 的远程 PIP 视频帧 listener 已迁移至
`src/main/preload/pip-video-frame-subscription-controller.ts`，真实接回 stopped/frame
分流与 IPC listener teardown；decoder state 与 frame side effects 仍由既有 controller/owner
持有。focused test 为 `scripts/test-pip-video-frame-subscription-controller.mjs`，运行命令为
`node --experimental-strip-types scripts/test-pip-video-frame-subscription-controller.mjs`。

### 增量抽取：Windows 窗口透明度 workaround 判定

启动编排 `Be2` 的首次显示分支中，`isWindows && !window.isVisible() &&
!window.isMinimized()` 只负责判定是否需要在 `show()` 前暂时设置 opacity。该三值判定已迁移至
`src/main/main-app/startup/window-presentation-policy.ts`，原入口仍持有
`BrowserWindow` 状态读取、`setOpacity(0)`、`show/focus` 和 `setImmediate` 恢复顺序。
由 `scripts/test-main-window-presentation-policy.mjs` 覆盖 Windows/visible/minimized 四项矩阵，
不改变窗口生命周期或副作用 owner。
