# Handoff（终局版）：从「结构等价」到「完全反编译 + 可读工程」

接回 desktop authenticated fetch owner：完整 `api/desktop-fetch.ts` 现已替代主 chunk 的 `ZTe`；renderer HTTP proxy、
authenticated JSON、trace export、download stream、abort/progress、VS Code bridge 与 dictation websocket auth 仍由同一个
32-method service 持有。真实 `WindowContext` consumer 保持 `new ZTe(...)` 调用，旧 760 行 class 已物理删除。

接回 avatar overlay 的完整 composition owner：既有 `avatar-overlay/composition-surface.ts` 与 `realtime.ts` 现已替代主
chunk 的 `Hle/rle` 和模块级 voice-controller registry。接线前修正了 renderer 消费的单数 `setElementSize` API，并恢复
starter RPC handle 的 `.dup()` 所有权语义；真实 startup、quick-chat size update 与 voice consumer 均保持原调用链，旧大类
和重复 registry 已物理删除。

修复 thread-catalog store 的长期未接线迁移：完整 `LocalThreadCatalogStore` 现已替代主 chunk 的 `hhe`，真实 catalog
factory consumer 保持 `new hhe(...)` 兼容。主 chunk 中重复的 6-table SQLite DAO、store-only schemas/upsert SQL、filter/
row-mapping helpers 已删除；仍由 thread projection 使用的 `_he/um/dm` 保留。

完成 thread-catalog 上层 owner：原 `dnt` 跨 host catalog service 已迁入 `thread-catalog/service.ts`；source attach/detach、
ownership、population lifecycle、scan-slot concurrency/fairness、host registry、page/filter/cursor validation、status/observation
publication 与 disposal 均由具名 class 持有。真实 `WindowContext` consumer 已接回，旧 class 和专属 cursor/filter helpers 删除。

开始迁出 thread-catalog 核心 owner：原 `int` 单 host sync coordinator 已迁入
`thread-catalog/sync-coordinator.ts`；full/incremental scan、offset resume/head reconciliation、notification debounce、imported
thread refresh、freshness/backoff、history pruning、foreground promotion 与 delta/invalidation publication 均由具名 class 持有。
真实跨 host `dnt` consumer 已接回，旧 class、专属 timing constants 与 scan helpers 从主 chunk 删除。

继续迁出真实 automations owner：原 `AOe` Habitat Automations service 已连同 hosted/local schema、RRULE normalization、
cloud/local projection helpers 迁入 `automations/habitat-automations-service.ts`；migration consent/owner identity、serialized
mutations、cloud save-and-verify、pagination sync、cache adoption 与 principal-change lifecycle 均由新 class 持有。真实 `NOe`
composition 和 `WindowContext` consumers 已接回，主 chunk 旧 class 与专属 helpers 删除。

saved-section manager 收尾：单用途 `aBe` state-schema predicate 已内聚到 manager factory，主 chunk 转发 helper 与反向注入删除。

完成 saved-section manager owner：原 `iBe` 已迁入 `sidebar/saved-custom-sections-manager.ts`；serialized command queue、
principal/connection-bound source capture、creation reservation、legacy import、persisted-atom write/broadcast、migration 与
reconciliation entrypoints 均由新 class 持有。真实 pinned façade consumer 已接回，旧 class body 删除。

继续迁 saved-section cluster：原 `rBe` reconciliation query owner 已迁入
`sidebar/saved-section-reconciliation.ts`，single-read guard、source/connection lifetime、list/member snapshots、conflict detection
与 commit merge/writeback 均由新 class 持有；真实 `iBe` consumer 已接回，旧 class body 删除。

继续向上迁 saved-section cluster：原 `yH` undo/redo transition owner 已迁入
`sidebar/saved-section-undo-redo-stack.ts`，scope snapshots、structure/order capture、transition sequencing 与 migration state
仍由完整 class 持有；真实 `iBe` manager consumer 已接回，旧 class body 删除。

开始迁出真实 saved-section engine：原 `$ze` 462 行 ThreadSectionServer 已迁入
`sidebar/thread-section-server.ts`，connection observation、thread lookup cache、pinned section discovery/migration、section CRUD/
move/list 与 host mutation serialization 均由新 factory class 持有；真实 pinned façade 已接回，旧 class body 删除。

清理 automations 的另一组无 consumer 假迁移：旧 `automation-update-tool.ts`、`habitat.ts`、`inbox-items.ts`、`index.ts`
形成仅内部引用的孤岛，main 从未 require；四文件已删除。真实 update executor/habitat/inbox/scheduler 仍在主 chunk，已接线的
`automations-service.ts` 与 `cron-turn-read-state.ts` 保留，避免把存在文件误记为已迁移 owner。

清理 saved-sections 的无 consumer 三文件孤岛：旧 `saved-sections-service/state/transactions.ts` 从未接入 main，且 façade
以 `{}` 强转注入 server engine，不能代表真实 `$ze/iBe`。三文件已删除；真实 generated engine/reconciliation 仍留在主
chunk并作为 `pinned-threads-service.ts` 的显式依赖。原 unwired-skeleton gate 同步升级，锁定新 PBe/ert owner 不回退为壳。

完成最大剩余 `ert` WindowContext owner 迁移：完整约 2,000 行 composition/state owner 已迁入真实
`window/window-context.ts` dependency-injected factory；app-server/host registries、projects/workspaces、fetch/message handler、
browser/realtime/artifact/automation/runtime services 与 lifecycle disposables 均由新 class 持有。真实 startup consumer 仍以
`new ert({...})` 接回，主 chunk 旧 class body 删除；focused gate 实际跑过完整同步 constructor composition。

完成主 `PBe` owner 迁移：完整 1,600+ 行 Electron fetch handler（129 handlers、constructor-owned services、settings/global
state/config helpers、VS Code dispatch/tracing/error projection）已迁入真实
`fetch-handler/electron-fetch-handler.ts` dependency-injected factory，真实 `ert` consumer 仍以 `new PBe(...)` 接回；主 chunk
旧 class body 已删除。focused gate 同时覆盖构造 ownership、direct/traced dispatch、git-source guard 与 unsupported projection。

继续拆 `PBe` 持有的真实 owner：`jH` pinned-threads façade 已迁入 `sidebar/pinned-threads-service.ts`；legacy/server
listing、pin/reorder fallback、section CRUD delegation、deduped update、saved-section callback synchronization、broadcast 与
worktree-cleanup protection 均由新 class 持有。真实 consumer 已接回，复杂 server/reconciliation 作为明确注入边界保留。

继续拆 `PBe` 持有的真实 owner：`CMe` automations service 已迁入 `automations/automations-service.ts`；cron/worktree
validation、canonical/habitat 双路径、delete cleanup/notification、native execution context、local-only 与 migration gates
均由新 class 持有。真实 `PBe` consumer 已接回，旧 class body 删除。

修正并接回此前未接线且语义有偏差的 `settings/workspace-settings-service.ts`：`CBe` settings owner、RPC
subscription、agent write-confirmation broker、work-mode access policy、third-party notices reader 与 backdrop policy 均迁入
dependency-injected runtime；真实 `PBe` consumer 已接回，旧 `sBe/cBe/xBe/SBe/RH/CBe/zH` 和 notices helpers 删除。

继续缩小 `PBe` fetch-handler 的自由依赖面：workspace directory browse/resolution/symlink-containment cluster 已迁入
`workspace/directory-browser.ts`，真实 handler consumer 已接回；local realpath containment、remote path semantics、hidden/
directory filters、stable ordering 与 parent projection 均由新 runtime 持有，旧 `OBe/kBe/ABe/jBe/UH/MBe/WH` 删除。

继续修正 fetch-handler support 的假迁移：`sftp.ts` 与 `state-writes.ts` 改为 dependency-injected runtimes，真实
upload/download、global-hotkey validation、avatar accelerator、bundled-skills root 与 persisted-atom sparse-write consumers
均已接回；旧 `RBe/zBe/QH/BBe/$H/VBe/eU/HBe/UBe/WBe` 删除，并新增行为与 source-wiring focused gate。

修正 screenshot-target 的假迁移：模块改为 Electron-free dependency-injected resolver，真实 `PBe` screenshot consumer
已接回；viewport/zoom/content-bounds/display projection、invalid/destroyed guards 与 rectangle normalization 均由新模块持有，
旧 `FBe/IBe/LBe/ZH` 删除。

global-dictation cluster 收尾：消息类型白名单与 darwin/win32 support policy 已并入 lifecycle 模块，主 chunk 的
`cat/W7/G7/fat` 删除；macOS accessibility prompt 仍以副作用依赖注入，未让新 owner 反向导入 Electron。

继续清除会制造错误完成感的死 skeleton：无任何 consumer 的 `window/window-context.ts` 与
`fetch-handler/electron-fetch-handler.ts` 已删除；它们包含 null/no-op/`not wired` 实现，而真实 `ert`/`PBe` owners 仍在
主 chunk。新增 focused gate 防止这两个 skeleton 和已删除的 startup skeleton 被重新引入。

修正此前 immediate-update-exit 的假迁移：真实 update-install consumer 现已直接接回
`app-shell/immediate-update-exit.ts`，旧 `Wst` body 已删除；无 consumer、仅占位且重复 startup owner 的
`app-shell/run-main-app-startup.ts` skeleton 同步删除，避免文档/源码继续宣称未发生的入口迁移。

随后将 `dat` global-dictation lifecycle state owner 迁入 `dictation/global-dictation-lifecycle-manager.ts`；gate/force-lock、
hold/toggle hotkey registration/release watching、cross-instance ownership、overlay/pet/in-app sessions、renderer messages、
clipboard/paste/history、abort/recovery 与 cleanup 状态均由具名 class 持有。真实 window-services consumer 已接回。

随后将 `xst` application worker runtime 迁入 `worker/worker-runtime.ts`；git/open-in 常驻 buses、IPC registration、
app-event/Sentry fan-out、git sampling/turn completion，以及 computer-use one-shot worker 与 capture-update watcher 的独立
subscription、abort、terminal update、exit/failure cleanup 均由新 owner 持有。真实 startup consumer 已接回，旧 body 删除。

继续收紧 worker runtime wiring：`Sst/Cst/wst` 三个无状态 generated aliases 已删除，start-result、event-type 与
notification-type consumers 直接使用 `worker-event-predicates.ts` 的语义 API，避免下一步 runtime 迁移携带重复 facade。

随后将 `fe` worker app-event publisher 迁入 `worker/app-event-publisher.ts`；timestamp projection、multi-subscriber fan-out
与幂等 disposal 均由具名 class 持有。真实 worker runtime consumer 已接回，旧匿名 class 已删除。

随后将 `bst` worker process/RPC manager 迁入 `worker/worker-manager.ts`；workerData/MessagePort startup、analytics/auth/
tracing updates、listener/exit lifecycle、git graceful flush、Sentry/main RPC sessions、CES cancellation/telemetry、OTel export、
typed success/error response 与 teardown 均由新 class 持有。真实 worker buses 已接回，旧 class 已删除。

随后将 `H9` worker bus owner 迁入 `worker/worker-bus.ts`；renderer/host pending requests、method/result validation、
AbortSignal cancellation、webContents lifecycle cleanup、worker-exit rejection、host listeners、performance single-recipient、
host-only 与 broadcast routing，以及 worker-manager delegation 均由新 class 持有。真实 git/open-in buses 已接回。

随后将 `$it/eat/I7/L7/nat/B7/rat/V7/iat/aat` global-dictation paste/clipboard owner 迁入
`dictation/global-paste-runtime.ts`；clipboard fingerprint/snapshot/conditional restore、pre/post timing、abort/change detection、
macOS AX menu lookup 与 AppleScript fallback、Windows SendKeys、accessibility/copy failure projection 均由新 runtime 持有。
真实 dictation controller consumers 已接回，旧 cluster 已删除。

随后将 `Fit/C7` pet/avatar global-hotkey owner 迁入 `hotkey/pet-hotkey-manager.ts`；access-state gate、command
binding resolution/reservation release、幂等注册、权限丢失时注销、press-time recheck、toggle failure logging、access subscription
与 dispose 均由新 owner 持有。真实 avatar overlay startup consumer 已接回，旧 functions 已删除。

随后将 `lit` deep-link route executor 迁入 `deep-links/route-executor.ts`；no-op routes、announcement/plugin/pet/
automation/OAuth/browser/shared/library/local-conversation/new-thread/settings/skills dispatch，lookup failure logging、review/
prompt state 与 workspace/project 子 owner 编排均由新 executor 持有。真实 `_it` navigation consumer 已接回，旧 function 删除。

随后将 `b7/uit` deep-link route actions 迁入 `deep-links/route-actions.ts`；background browser-tab 与 browser-panel
消息投影、initiator 默认值，以及 phase-flag 驱动的 plugin marketplace 查询/精确匹配均由新模块持有。真实 browser、
local-conversation、new-thread 与 plugin-install consumers 已接回，旧两个 helpers 已删除。

随后将 `git` deep-link local-project selection owner 迁入 `deep-links/local-project-selector.ts`；显式 project lookup、
root lookup/create、未知 root 广播、既有 selection 保留、global-state 更新与缺失 mutation handler 失败语义均由新 owner
持有。真实 new-thread deep-link consumer 已接回，旧 function 已删除。

随后将 `dit/fit/pit/mit/hit` deep-link workspace resolver 迁入 `deep-links/workspace-resolver.ts`；显式目录优先、
无效路径到 origin fallback、local project/fallback roots、Git origin discovery、dir/root 映射首值语义，以及规范化
host/owner/repo 匹配均由新 owner 持有。真实 new-thread deep-link consumer 已接回，旧五个 functions 已删除。

随后将 `vit` deep-link thread-host resolver 迁入 `deep-links/thread-host-resolver.ts`；origin/indexed/catalog host
优先级、catalog membership、connection availability、thread ownership lookup 与 origin/local fallback 均由新策略持有。
真实 local-conversation deep-link consumer 已接回，旧 function 已删除。

随后将 `v7/cit` application-menu support owner 迁入 `app-shell/application-menu-runtime.ts`；跨平台 accelerator alias
规范化/排序/collision comparison，以及 focus/locale/browser-state/feature consumers 共用的稳定 refresh manager 均由新模块
持有。真实 `sit/_it` consumers 已接回，旧 function/class 已删除；不完整的既有 `app-menu.ts` 骨架仍未接入。

随后将 `a7/Prt/o7/Irt/Lrt/s7` quit/cleanup runtime 迁入 `startup/quit-runtime.ts`；dev relaunch fallback、app quit、
12 秒 service cleanup、5 秒 context cleanup，以及 hotkey/dictation/context/disposables 的 immediate-exit ordering 均由
新 owner 持有。workspace policy、main IPC、normal lifecycle、micro shutdown 与 update-install consumers 全部改接可读 API，
旧 constants/functions 已删除。

随后将 `Rrt` primary main IPC router 迁入 `app-shell/main-ipc-router.ts`；avatar/PiP、update gates、desktop feature
projection、menu/plugin updates、所有 main-window routes、quit/tray/dictation/context fallback、browser sidebar/page validation、
Codex-home request、Sentry test 与 AppView MessagePort registration 均由新 owner 持有；renderer context-menu registration
也由该 owner 编排。真实 startup consumer 已接回，旧 function 与一个从未消费的 option 已删除。

随后将 `mrt/t7/hrt/n7/r7/i7/grt/_rt` platform shutdown adapter 迁入
`startup/platform-shutdown.ts`；Windows descendant kill、addon validation、10 秒 forced-exit single arm/retry logging，以及
macOS AppKit power-off observer、typed block、allow-quit callback 与 load failure logging 均由新 owner 持有。真实 app
lifecycle/update/final cleanup consumers 已接回，旧 cluster 已删除。

随后将 `J5/Y5/ort/X5/srt/crt` renderer-driven native context-menu owner 迁入
`window/renderer-context-menu.ts`；trust gate、display scale、nested SVG collection/rasterization、currentColor/template handling、
data/file/absolute/search-root icon resolution、16px resize、menu projection、single-result click/cancel 和 disposer 均由新
owner 持有。真实 main-message registration 已接回，旧 cluster 已删除。

随后将 `Frt/zrt` startup/bootstrap synchronous IPC registrar 迁入 `startup/startup-ipc.ts`；trusted/untrusted sentry
bootstrap、build flavor、shared-object snapshot、sidebar bootstrap、file drag，以及 HTTP(S) link-drag schema、receiver binding
和 failure logging 均由新 owner 持有。真实 startup registration 已接回，旧 schema/function 已删除。

随后将 `vrt..Nrt/Brt/Vrt` application lifecycle owner 迁入 `startup/application-lifecycle.ts`；privacy/system-shutdown
quit gating、local/automation/pending-worktree confirmation projection、activate attribution、menu refresh、foreground/background
events、single-shot will-quit、Windows forced-exit arm、skip-drain policy 与 ordered all-settled cleanup 均由新 owner 持有。
真实 startup consumer 已接回，旧 constants/functions 已删除。

随后将 `Hrt/Urt/Wrt/Grt/Krt/qrt/Jrt/u7/d7/f7/Yrt/Xrt/Zrt/p7/Qrt/$rt/eit/tit/m7/h7/nit/rit`
About-window owner 迁入 `app-shell/about-dialog.ts`；singleton focus、跨平台/主题图标、localized version/release copy、
HTML escaping/CSP、hardened BrowserWindow、navigation denial、content sizing、parent/work-area placement 与 failure cleanup
均由新 owner 持有。菜单复用的 `c7/l7` 保留，真实 About action 已接回，其余旧 cluster 已删除。

随后将 `Rst/zst/Bst` desktop open-path owner 迁入 `files/desktop-open-path-handler.ts`；early queue 接管、feature-ready
调度、single-flight/递归 drain、stat/classification、directory project creation/selection/broadcast/navigation、projectless
file/skill projection、browser document routing、logging、error reporting 与 cleanup 均由新 owner 持有。真实 startup consumer
已接回，旧 dead alias/function/helper 已删除。

随后将 `Dst/Ost/kst` Computer History native status-item action adapter 迁入
`computer-use/native-status-item-actions.ts`；feature/connection/service state projection、service PID ensure、worker menu-state
读取与 failure logging，以及 open/quit/stop/pause/resume/observation/clear/history/settings 全部 action routing、analytics 和
query invalidation 均由新 owner 持有。真实 tray startup consumer 已接回，旧 aliases/function 已删除。

随后将 `W9/G9/K9/q9/J9/Y9/Nst/X9/Z9/Pst/Q9/Fst/$9` tray singleton lifecycle 迁入
`tray/tray-lifecycle.ts`；native macOS status-item 分支、跨平台图标解析与 fallback、Windows distribution/package
identity、主题图标刷新、single-flight creation、readiness、will-quit/dispose 和异步取消均由新 owner 持有。真实 startup、
readiness 与 controller consumers 已接回，旧 globals/functions 已删除。focused test 覆盖各平台与竞态路径。

随后将 `Mst` native macOS status-item owner 迁入 `tray/native-status-item-controller.ts`；addon creation、event parsing、
indicator setting subscription、menu projection、native menu tracking、service-state filtering、async action/error handling、
state refresh 与 destroy/readiness 均由新 owner 持有。真实 tray construction 已接回，旧 class 已删除。
focused test 覆盖 40 项。

继续清理 `windowAppearance` wiring：`A9/j9/I9/rst/ist/ast/ost/sst/L9/cst/z9` 已只保留真实模块 delegation，
删除全部 early-return 后的 generated duplicate bodies、仅由这些死代码引用的 15 个常量，以及已无 consumer 的 `R9`。
BrowserWindow manager 的现有调用边界保持不变。新 focused test 覆盖 21 项，既有 appearance 回归 18 项。

随后将 `Oot/kot/Aot/jot` thread-metadata persistence owner 迁入 `threads/thread-metadata-service.ts`；serialized
mutation queue、read cloning、validation/update delegation、flush、rollback、rollback-error logging 与 change publication 均由
新 owner 持有。BrowserWindow manager dependency 已接回，旧 class 及两个 unreachable generated skeleton 已删除。
focused test 覆盖 33 项。

随后将 `Sot/T9/Cot` debug-window owner 迁入 `debug/debug-window-manager.ts`；conversation source/listener duplication、
RPC broken rebinding、subscription disposal、action forwarding、owner/debug webContents mapping、single-flight window creation、
origin conversation/client analytics projection 与双向 destruction cleanup 均由新 owner 持有。BrowserWindow manager 的真实
dependency 已接回，旧三 class 已删除。focused test 覆盖 39 项。

随后将 `Aat/jat` realtime-voice global hotkey owner 迁入 `realtime/voice-hotkey-manager.ts`；command binding、
register/unregister、locked-screen suppression、reservation lock polling、permission refresh、sync rollback logging 与 disposal
均由新 owner 持有。真实 realtime lifecycle consumer 已接回，旧 function/constant 已删除。focused test 覆盖 32 项。

随后将 `oat/H7/sat` global-dictation overlay window owner 迁入
`dictation/global-dictation-window-controller.ts`；lazy prewarm/create、renderer-ready handshake、start/stop/paste-failure、
recovery geometry、pointer interactivity、display listeners、focus filtering、hide/close 与 failure logging 均由新 owner 持有。
真实 global-dictation lifecycle 已接回，旧 class/constants 已删除。focused test 覆盖 37 项。

随后将 `bit/xit/Sit/Cit/wit/Tit/Eit/Dit/x7/Oit/kit` startup progress-window owner 迁入
`startup/progress-window.ts`；localized copy、安全 HTML、BrowserWindow hardening、active/inactive presentation、user quit、
load failure cleanup、programmatic disposal 与 delayed-show adapter 均由新 owner 持有。两个真实 startup consumers 已接回，
旧 cluster 已删除。focused test 覆盖 36 项。

随后将 `yit` temporary quit state owner 迁入 `startup/quit-state.ts`；prompt bypass、drain bypass、60 秒 reset、
timer replacement/unref、approved quit 与查询接口均由新 owner 持有。真实 startup construction 已接回，旧 class 已删除。
focused test 覆盖 20 项。

随后将 `lrt/urt` Electron MessagePort RPC transport 迁入 `app-server/message-port-transport.ts`；structured-clone
encoding、queued/pending receive、peer-close/error propagation、send、abort handshake 与 remote-main adapter 均由新模块
持有。AppView IPC consumer 已接回，旧 function/class 已删除。focused test 覆盖 29 项。

随后将 `Z5/drt/frt/prt/Q5/$5` native tray-menu owner 迁入 `tray/tray-menu-controller.ts`；Linux persistent menu、
Windows cached menu、macOS click suppression、ready/destroy、thread sections/overflow、usage limits、platform actions 与
quit routing 均由新 owner 持有。IPC message guard 和真实 tray construction 已接回，旧 class/helpers 已删除。
focused test 覆盖 48 项。

继续审计发现既有 `misc/dock-menu.ts` 从未接入主 chunk；现已将真实 startup consumer 改接 `DockMenuManager`，
删除旧 `Ll/ase/ose/sse/Rl/zl` 副本，并覆盖 unread/completed 去重、recent 排除、overflow submenu、Unicode 标题截断、
projectless/empty sublabel、click routing 与 darwin Dock menu 发布。focused test 覆盖 20 项。

随后将 `Cnt/wnt/Tnt/Ent/Dnt` cron-turn read-state lifecycle 迁入
`automations/cron-turn-read-state.ts`；connection/notification subscriptions、turn correlation、agent-message fallback、
notification-policy decision、unread writer、failure logging、start-failure 与 disposal 均由新 owner 持有。真实
`prepareCronTurnReadState` consumer 已接回，旧 schemas/helper/logger 已删除。focused test 覆盖 33 项。

随后将 `xnt/Snt` thread-project membership owner 迁入 `projects/thread-project-membership-owner.ts`；assignment/
projectless persistence、membership broadcasts、optional server writer/host-id commit、projectless output/workspace metadata、
removed-thread tombstones 与 global-state invalidation 均由新 owner 持有。唯一 runtime construction 已接回，旧 cluster
已删除。focused test 覆盖 27 项。

随后将 `Ont/L5/R5` thread read-state owner 迁入 `thread-read-state/thread-read-state-owner.ts`；identity/host
generation、session/writer ownership、serialized broadcasts、self/external fanout、logout clearing、legacy migration 与
dispose retirement 均由新 owner 持有。真实 composition root 已接回，旧 class/helpers 已删除。focused test 覆盖 48 项。

随后将 `att` system-fonts RPC adapter 迁入 `window/system-fonts-service.ts`；Electron systemPreferences font-family
enumeration 由新 adapter 原样转发。唯一 runtime consumer 已接回，旧 class 已删除。focused test 覆盖 8 项。

随后将 `Xnt` history-swipe navigation RPC adapter 迁入 `window/history-swipe-navigation-service.ts`；renderer origin
binding 与 window-manager state forwarding 由新 adapter 持有。唯一 runtime consumer 已接回，旧 class 已删除。
focused test 覆盖 9 项。

随后将 `Vnt/Hnt/Unt/Wnt/Gnt/Knt/V5` visualization service cluster 迁入
`visualizations/visualization-service.ts`；screenshot schema/crop/clipboard、temporary roots、relative/absolute path
authorization、realpath boundary resolution、stat/symlink guards、ENOENT fallback 与 5MB limit 均由新 owner 持有。
唯一 runtime consumer 已接回，旧 cluster 已删除。focused test 覆盖 29 项。

随后将 `Znt` host-aware GitHub request client factory 迁入 `github/github-request-client.ts`；repos/account/single-host
host discovery、default/remote config dedupe、operation-source/signal forwarding 与 main request envelope 均由新 adapter
持有。唯一 runtime consumer 已接回，旧 helper 已删除。focused test 覆盖 18 项。

随后将 `U5/W5/Ynt` app-server transport policy 迁入 `app-server/transport-policy.ts`；force-CLI override、cloud/
remote websocket URL selection、loopback proxy bypass、cloud internal-domain allowlist 与 remote SOCKS routing 均由
新 policy 持有。五个真实 consumers 已接回，旧 helpers/constant 已删除。focused test 覆盖 23 项。

随后将 `Jnt` downloads view publisher 迁入 `downloads/downloads-view-publisher.ts`；app/detached renderer queues、
initial snapshot、lifecycle ordering、state broadcast coalescing、30 秒 detached watchdog、RPC/renderer teardown 与
dispose cleanup 均由新 owner 持有。唯一 runtime construction 已接回，旧 class 已删除。focused test 覆盖 29 项。

随后将 `znt/Bnt` user-verification RPC facade/attempt 迁入 `user-verification/rpc-services.ts`；host connection lookup、
verification begin、wait/accept/cancel forwarding 与 dispose-cancel 均由新 adapters 持有。条件式 runtime consumer 已
接回，旧 classes 已删除。focused test 覆盖 15 项。

随后将 `Int/Lnt/Rnt` trigger subscription reader 迁入 `triggers/trigger-subscription-reader.ts`；strict response
schema、thread-id dedupe、100-item batching、request 前后 principal identity recheck、AbortController rollover 与 per-thread
projection 均由新 owner 持有。唯一 runtime construction/cancellation 已接回，旧 cluster 已删除。focused test 覆盖 22 项。

随后将 `Fnt` tracing RPC service 迁入 `tracing/tracing-rpc-service.ts`；trace batch export、sample-rate finite/clamp、
desktop/git-worker/persistence 三路同步，以及 recording confirm/cancel/keep-local/submit routing 均由新 adapter 持有。
唯一 runtime consumer 已接回，旧 class 已删除。focused test 覆盖 18 项。

随后将 `Nnt/Pnt/z5/B5` thread turn-summary service 迁入 `threads/thread-turn-summary-service.ts`；principal/host-key
authorization、identity hash、normalized/compact summaries、revision tombstones、delete sequencing、renderer subscriptions、
host/principal invalidation 与 dispose cleanup 均由新 owner 持有。唯一 runtime construction 已接回，旧 cluster 已删除。
focused test 覆盖 44 项。

随后将 `jnt/Mnt` thread read-state RPC facade/session 迁入 `thread-read-state/rpc-services.ts`；callback duplication、
open failure/non-ready cleanup、pre/post-open retired race、RPC-broken unsubscribe、session forwarding 与 cleanup-once
语义均由新 adapters 持有。唯一 runtime consumer 已接回，旧 classes 已删除。focused test 覆盖 32 项。

随后将 `I5` thread metadata generation service 迁入
`threads/thread-metadata-generation-service.ts`；ephemeral model resolution、title failure fallback、description
forwarding、per-host/thread summary rollover/abort、stale-result suppression 与 dispose cleanup 均由新 owner 持有。
唯一 runtime construction/disposal 已接回，旧 class 已删除。focused test 覆盖 51 项。

随后将 `Ztt/E5` thread-catalog page-slot scheduler 迁入
`thread-catalog/page-slot-scheduler.ts`；per-host serialization/throttling、foreground promotion、host generation
cancellation、background dispatch pacing、timer resolution 与 dispose cleanup 均由新 owner 持有。两个 runtime
construction paths 已接回，旧 class 已删除。focused test 覆盖 38 项。

随后将 `Xtt` thread archive service 迁入 `threads/thread-archive-service.ts`；local-only inactive archive、missing
rollout/catalog reconciliation、provisional-thread guard、archive side effects、single/all archived deletion 与 automation
refresh 均由新 owner 持有。唯一 runtime construction 已接回，旧 class 已删除。focused test 覆盖 36 项。

随后将 `C5/Gtt/Ktt/w5/T5/qtt/Jtt/Ytt` terminal command runtime 迁入
`terminal/terminal-command-runtime.ts`；跨平台 shell-kind 判定、PowerShell/cmd 路径转义、action command 换行归一化
与 cwd command wrapping 均由新 runtime 持有。terminal session manager consumer 已接回，旧 helpers 已删除。
focused test 覆盖 33 项。

随后将 `Ptt/Ftt/b5/Itt/Ltt/Rtt/ztt/Btt` local node-pty backend 迁入
`terminal/node-pty-backend.ts`；Windows console process enumeration、node-pty lazy load、PTY callbacks/I/O 与
macOS reverse process-tree SIGKILL/error aggregation 均由新 runtime 持有。terminal session manager consumer 已接回，
旧实现已删除。focused test 覆盖 45 项。

审计时修复了 terminal session manager 的运行时接线：`createTerminalSessionManagerClass(...)` 曾被误置于
`S5()` return 之后的不可达函数体内，现已恢复为模块级初始化；focused test 新增主 chunk 接线形状断言，防止
transform/typecheck 仍通过但 owner 未实际初始化的回归。

随后将 `Ott/ktt/Att/jtt/h5/g5/_5/v5/y5/Mtt/Ntt` terminal window runtime 迁入
`terminal/terminal-window-runtime.ts`；shell discovery/command/labels、terminal RPC/trace forwarding、subscription
replacement/teardown 与 terminal query escape filtering 均由新 runtime 持有。service 与 manager consumers 已接回。
focused test 覆盖 44 项。

随后将 `Ctt/m5/wtt/Ttt/Ett/Dtt` tab-drag preview service 迁入 `window/tab-drag-preview-service.ts`；platform gate、
presentation-window assembly、zoom pointer projection、visibility/fullscreen guards、strict RPC schemas 与 drag-session
fallback 均由新 owner 持有。唯一 consumer 已接回。focused test 覆盖 31 项。

随后将 `l5/ott/stt/u5/d5/f5/ctt/ltt/utt/dtt` macOS notification permission runtime 迁入
`notifications/mac-notification-permission.ts`；Darwin gate、objc bridge、center cache、concurrent RunLoop ref-count、
native errors 与 lifecycle logging 均由新 owner 持有。唯一 consumer 已接回。focused test 覆盖 27 项。

随后将 `c5/ntt/rtt/itt` system audio spectrum runtime 迁入 `capture/system-audio-spectrum-service.ts`；macOS
version gate、lazy capture singleton、renderer subscriptions、levels backpressure 与 load/error/RPC teardown 均由新
owner 持有。唯一 runtime consumer 已接回，旧实现已删除。focused test 覆盖 34 项。

随后将 `Zet/Qet` shortcut capture service/session 迁入 `window/shortcut-capture-service.ts`；focused-window gate、
native bare-modifier capture、promise rollover 与 blur/navigation/renderer teardown cleanup 均由新 owner 持有。
唯一 runtime consumer 已接回，旧 classes 已删除。focused test 覆盖 35 项。

随后将 `Jet/Yet/Xet` notifications service 迁入 `notifications/notifications-service.ts`；sound preview/import、
window focus、notification action forwarding 与 dismiss routing 均由新 owner 持有。focused test 覆盖 16 项。

随后将 `s5/$et/ett` SSH connection registration 迁入 `remote/ssh-connection-registration.ts`；alias validation、
metadata/fast resolution、catalog/auto-connect persistence、refresh、existing identity reuse 与 removal cleanup 均由新
owner 持有。唯一 runtime consumer 已接回，旧 schema/class 已删除。focused test 覆盖 20 项。

随后将 `Met/Het` artifact disposable RPC adapters 迁入 `artifacts/artifact-rpc-services.ts`；external-document
activate/unbind 与 artifact-session append/dirty/readAsset/unsubscribe forwarding 及 dispose cleanup 均由新 owners
持有。两个 runtime factories 已接回，旧 classes 已删除。focused test 覆盖 15 项。

随后将 `Det` artifact document store、durable schemas 与全部独占 persistence/hash/compaction/materialization helpers
迁入 `artifacts/artifact-document-store.ts`；record integrity、atomic temp writes、idempotent append、update collision、
compaction、clean-session refresh 与 materialization journal/reconciliation 均由新 owner 持有。唯一 runtime consumer
已接回，旧 594 行实现已删除。focused test 覆盖 36 项。

随后将 `h4/g4/_4/K5e/q5e/v4/J5e/Y5e/X5e/Z5e/Q5e/y4/$5e/e7e/b4/t7e/n7e` artifact documents
owner 迁入 `artifacts/artifact-documents.ts`；strict schemas、workspace/exact binding、realpath/hash guards、per-file
serialization、append/refresh/subscription、staged-file recovery 与 materialization two-phase commit 均由新 owner
持有。唯一 runtime consumer 已接回，旧实现已删除。focused test 覆盖 31 项。

随后将 `B5e/V5e/H5e/U5e/W5e/m4/G5e` remote host-config projection 与 request-user-input RPC owner 迁入
`remote/host-config-runtime.ts`；SSH/WSL/Remote Control config shape、transport commands、label/defaults 与
surface-scoped activity/presentation/snooze forwarding 均由新 runtime 持有。真实 consumers 已接回，旧实现已
删除。focused test 覆盖 22 项。

随后将 `R5e/z5e` remote RPC adapters 迁入 `remote/remote-rpc-services.ts`；environment rename forwarding、hosted
PIP task/presentation/layout forwarding、native-video per-conversation ref-count 与 origin teardown cleanup 均由新
owners 持有。两个 runtime consumers 已接回，旧 classes 已删除。focused test 覆盖 27 项。

随后将 `M5e/N5e/P5e/d4/F5e/I5e/L5e/f4/p4` remote-control device-key client 迁入
`remote/remote-control-device-key-client.ts`；native addon lazy load、key CRUD、connection/enrollment payload
allowlist、audience/scopes、nonce/digest validation、domain separation 与签名 bytes/base64 projection 均由新 owner
持有。唯一 runtime consumer 已接回，旧实现已删除。focused test 覆盖 25 项。

随后将 `D5e/O5e/k5e/A5e/j5e/u4` remote connections handler 迁入
`remote/remote-connections-handler.ts`；SSH/WSL/Remote Control refresh generations、catalog reconcile、auto-connect、
connect/disconnect、saved schema migration/backfill、analytics identity、enrollment/auth state、远程目录投影与
authoritative-host cleanup 均由新 owner 持有。唯一 runtime consumer 已接回，旧 876 行实现已删除；通用 SSH
config parser 未混入业务 owner。focused test 覆盖 43 项。

随后将 `Y8e/z2` realtime voice thread-title coordinator 迁入
`realtime/voice-thread-title-coordinator.ts`；session correlation、post-session title generation、source/target
connection retirement、principal/account/policy invalidation、guarded app-server client、默认标题保护与 abort/dispose
cleanup 均由新 owner 持有。唯一 runtime consumer 已接回，旧 class/helper 已删除。focused test 覆盖 43 项。

随后将 `L2/H8e/U8e/W8e/G8e/K8e/q8e/J8e/R2` realtime presentation coordinator cluster 迁入
`realtime/presentation-coordinator.ts`；surface registration/eligibility/anchor、preferred surface、main↔overlay
handoff、dock/fade/native transition、focus grace timers、toast/offset/visibility/motion 与 subscription cleanup 均由
新 owner 持有。`G8e.create` 唯一 consumer 已接回，旧约 500 行 cluster 已删除。focused test 覆盖 38 项。

随后将 `z8e/B8e/V8e/I2` multi-agent activity service 迁入
`realtime/multi-agent-activity-service.ts`；per-thread newest-first 去重缓存、100 条上限、session-id 条件 reset、
host disconnect 清理、initial/update snapshot 与 RPC-broken/unsubscribe/dispose 均由新 owner 持有。唯一 runtime
consumer 已接回，旧 classes/helper 已删除。focused test 覆盖 24 项。

随后将 `I8e/L8e/R8e/F2` realtime voice host coordinator cluster 迁入
`realtime/voice-host-coordinator.ts`；renderer claim/publish/control、mute intent queue/ack、native microphone mute、
dictation/delegation、screen capture、transfer/cancel、orphan/terminate/release、restart blockers 与 subscriber cleanup
均由新 owner 持有。`L8e.create` 唯一 consumer 已接回，旧 483 行 cluster 已删除。focused test 覆盖 40 项。

随后将 `F8e` app-server realtime event bridge、notification/multi-agent schemas 与独占 projection/key helpers
整簇迁入 `realtime/app-server-event-bridge.ts`；connection registry lifecycle、session/turn/item/transcript/handoff、
transport loss、agent-message presentations、created-thread/subagent/delegation 与 multi-agent activity projection
均由新 owner 持有。唯一 runtime consumer 已接回，旧 624 行 cluster 已删除。focused test 覆盖 38 项。

随后将 `b8e/C8e/w8e` realtime voice-history owner/service/subscription 与独占 projection helpers 整簇迁入
`realtime/voice-history.ts`；session/transcript/turn/presentation ledger、live projection、restore interruption、
ephemeral non-persistence/tombstone、matching subscriber broadcast、RPC-broken/unsubscribe/dispose 均保持原语义。
唯一 runtime consumer 已接回，旧约 600 行状态机已删除。focused test 覆盖 35 项。

随后将 `y8e` realtime memory-summary RPC owner 迁入 `realtime/memory-summary.ts`；Codex home/platform path
并发解析、execution-host remote file read、whitespace-empty 与 read failure 归一化均由新 class 持有。唯一
realtime consumer 已接回，旧 class 已删除；它与 CUA 多文件 ambient summaries 协议不同，未错误合并。
focused test 覆盖 12 项。

随后将 `p8e/m8e/h8e/v2/g8e/y2/_8e/b2/v8e` realtime continuity history cluster 迁入
`realtime/continuity-history.ts`；schema parse/fallback、Codex home path、trim/truncate、per-thread max-items、
newline JSON write 与跨实例串行写队列/失败恢复均由新 file-backed owner 持有。唯一 voice runtime consumer
已接回，旧 schema/helpers/class 已删除。focused test 覆盖 22 项。

随后将 `l8e/u8e/d8e/f8e` AirPods microphone-mute cluster 迁入
`realtime/airpods-microphone-mute.ts`；packaged/dev native addon 路径、macOS 14+ capability、mute acknowledge、
power-resume/capture-change single-immediate recovery、异常日志与 idempotent stop cleanup 均由新 runtime 持有。
voice feature-gate consumer 已真实接回，旧 loader/helper/class 已删除。focused test 覆盖 30 项。

随后将 `s8e/c8e` quick-chat 与 realtime per-window RPC adapters 迁入
`window/interaction-rpc-services.ts`；quick-chat origin forwarding、realtime starter registration、active/stopping
stop guard、ephemeral-history gate 与 session lifecycle forwarding 均保持原语义。两个真实 service-map consumer
已接回，旧 classes 已删除。focused test 覆盖 24 项。

随后将 `o8e` ProjectsManager、独占 `m2` order merge 与六个 request schemas 整体迁入
`projects/projects-manager.ts`；local/remote CRUD、order serialization/backend propagation、appearance、storage/root
projection、thread membership recovery delegation 与 renderer broadcasts 均由新 owner 持有。唯一 runtime
consumer 已真实接回，旧约 450 行 class/schema/helper 已删除。focused test 覆盖 45 项。

随后将 `t8e/n8e` thread membership inference cluster 迁入
`projects/thread-membership-inference.ts`；project-root/canonical alias 索引、workspace hint 恢复、同 basename
Git-origin 排歧、分页 thread 扫描、existing/excluded/projectless gate 与 projectless fallback 均由新算法模块
持有。ProjectsManager 唯一调用点已接回，旧 helpers 已删除。focused test 覆盖 28 项。

随后将 `Z6e/Q6e/$6e/X6e` project-folder consent cluster 整体迁入
`projects/project-folder-consent.ts`；config trust parse、folder 去重分组、focused-window 复用、等待窗口订阅、
confirm 串行队列、abort race、RPC-broken 与 webContents destroy cleanup 均保持在同一 runtime。主 manager 与
per-window service consumer 已真实接回，旧 schema/classes 已删除。focused test 覆盖 34 项。

随后将 `p2` local project cache 迁入 `projects/local-project-cache.ts`；local project snapshot、create/delete
投影、partial metadata update、updatedAt 语义与 appearance normalization 均由新 owner 持有。两个 runtime
consumer 已真实接回，旧 class 已删除；共享 `jr/Rr` helpers 保持单一实现并注入。focused test 覆盖 21 项。

随后将 `Y6e` host app-server projects owner 整体迁入
`projects/host-app-server-projects.ts`；project pagination/migration、legacy↔server ID 映射、create/import/update/
move/delete、60 秒可恢复删除窗口、排序写入、thread membership 同步与 connection lifetime 均由新 owner 持有。
主入口只保留依赖装配，真实 `new Y6e(...)` consumer 不变，旧 465 行 class 已物理删除；共享 `H6e/d2`
保持单一实现并注入。focused test 覆盖 46 项。

随后将 `K6e` pending project deletion scheduler 迁入
`projects/pending-project-deletion-scheduler.ts`；per-project timer ownership、account identity resume/stop、
deleteAfter scheduling、失败日志与 30 秒 retry backoff 均由新 owner 持有，`Y6e` 已真实接回并删除旧 class。
focused test 覆盖 20 项。

随后将 `W6e` thread-project assignment writer 迁入
`thread-catalog/thread-project-assignment-writer.ts`；observe/refresh/adopt、local↔server project 映射、
metadata write、projectless membership cache 与 paginated migration 均由新 owner 持有。共享 keyed queue `d2`
仍单一留在 main 供 `Y6e` 复用并注入新 class，旧 `W6e` 已删除。focused test 覆盖 22 项。

随后将 `V6e` projectless directory chooser 迁入 `workspace/projectless-directory-chooser.ts`；owner-aware
dialog、configured default root、absolute/WSL validation、real-directory/non-symlink 与 RWX permission gate 均由
新 owner 持有，唯一 runtime consumer 已接回。无 consumer 且包含多个简化伪实现的 `misc/project-sync.ts`
已物理删除；其余真实 project-sync owners 仍在 main 待逐批迁移。focused test 覆盖 18 项。

随后将 `z6e` process-memory snapshot cache 与 app-server descendant classifier 迁入
`startup/process-memory-snapshot-cache.ts`；5 秒 cache、single-flight promise、main/electron/app-server/rollout/
other RSS 分类与 summary projection 均由新 owner 持有，全局 `Qnt` consumer 已接回并删除旧 class/helper。
focused test 覆盖 22 项。

随后将 `L6e` primary-runtime host 迁入 `misc/primary-runtime-host.ts`；install/repair/diagnostics、feature
promise cache、progress broadcast、update poller 装配、Windows restore subscription/retry 与 polling cleanup
由真实 owner 持有。main 唯一 consumer 已接回，旧 class 和从未接回的 `misc/primary-runtime.ts` 伪实现均已
物理删除。focused test 覆盖 24 项。

随后将 `O6e` primary-runtime update poller 迁入 `misc/primary-runtime-update-poller.ts`；startup/scheduled/
manual 三类触发、shared-object feature gate、jitter hour scheduling、single-flight/checkRequested 合并、cache
status projection 与 install trigger/payload 均由新 owner 持有，真实 `L6e` host 已接回并删除旧 class。
focused test 覆盖 28 项。

随后将 `w6e` plugin incentives client、其 schemas、JWT identity predicate 与 process-wide receipt set 整簇
迁入 `plugins/incentives-client.ts`；local/host 双 token 校验、response 后 identity recheck、401 单次 refresh、
404/409/invalid response projection、request timeout/abort 与 dispose 均保持原语义，runtime consumer 已真实接回。
focused test 覆盖 27 项。

随后将 `d1e` thread-catalog authorization wrapper 迁入 `thread-catalog/authorized-service.ts`；本地/ChatGPT
host authorization、population/account-source leases、principal generation 竞态、status/observation RPC
subscription cleanup 与 dispose 顺序均由新 owner 持有，唯一 runtime consumer 已真实接回并删除旧 class。
focused test 覆盖 25 项。

随后将原先空壳的 `workspace/files.ts` 替换为真实 `p$e` owner；local/remote path resolution、metadata、
bounded text/blob reads、etag conflict writes、temporary preview lifecycle、save/download copy、macOS thumbnail
queue/timeout/overload 和 dispose cleanup 均由新 class 持有。共享路径/atomic-write helpers 仍单一保留在 main
供 file-drag consumer 复用，并显式注入新 owner；旧 class 已物理删除。focused test 覆盖 26 项。

随后将原先仅有注释和空方法的 `dictation/history.ts` 补成真实 file-backed owner，并将 `W$e` 及其
legacy global-history helpers 从 main 物理删除。chunk 去重/排序、metadata 原子写与 fsync、录音恢复、
20 条清理、audio read/download、transcript/finalize/delete 和 global dictation JSONL bridge 均由单一
`DictationHistoryService` 持有；runtime 和 global dictation consumer 已真实接回。focused test 覆盖 29 项。

随后将 `XQe` WorktreeService 整体迁入 `workspace/worktree-service.ts`；pending creation 状态机、
worker path/setup/stream 订阅、新生 worktree 保护、archive owner 转移、managed worktree、自动清理规划、
失败通知与 restart blockers 继续由同一个语义 owner 持有。main 的 per-host registry 已真实构造新 class，
原 31 个方法、4 组状态容器及输出/取消/operation-source helpers 已物理删除；focused test 覆盖 34 项。

随后将 `NQ` command-session backend 整体迁入 `terminal/command-session-backend.ts`；session acquisition、
UTF-8 streaming decoder、write coalescing/serialization、resize/terminate、exit/error projection 与 dispose
竞态均由新 owner 持有，cloud terminal 唯一 consumer 已真实接回并删除旧 class。focused test 覆盖 19 项。

随后将 `OZ` remote-localhost browser navigation 转发迁入 `remote-localhost-navigation.ts`；local/durable/
SSH host 分流、localhost port gate、app-server port-forward、URL host/port 重写与失败日志降级由语义 forwarder
持有，`r$e.forwardBrowserNavigationUrl` 唯一 consumer 已真实接回并删除旧函数。focused test 覆盖 13 项。

随后将 `kZ` WebContents host adapter 整体迁入 `app-server/web-contents-host-client.ts`；critical send、
background-throttled avatar thread filtering、destroy subscription fanout、focus/blur subscription ownership 与
listener cleanup 均由语义 class 持有。main 中 5 个真实 consumer 继续经稳定别名构造该 class，旧实现已删除；
focused test 覆盖 25 项过滤、发送、订阅和接回断言。

随后将 `iQe` project-folder picker 整体迁入 `workspace/project-folder-picker.ts`；local/remote 分流、
Electron directory dialog、Finder hidden-files preference timeout、source normalize/stat、project create/select/
rename 与 renderer add/pick/navigate 回执均由新 owner 持有。`r$e` 继续以原三参构造真实消费 factory，旧
class 与 timeout 常量已删除。focused test 覆盖 25 项 local/remote/dialog/settings/接回断言。

随后将 `vQe` main-thread jank timer owner 迁入 `main-thread-jank-sampler.ts`，保留 100ms tick、900ms
drift threshold、10 次上限、suspend/resume baseline 重置、幂等 start/stop listener cleanup 与 snapshot reset；
SamplerManager 的唯一 consumer 现显式注入 Electron powerMonitor、clock 与 timer，旧 class/default options 已删除。
focused test 覆盖 22 项 timer/lifecycle/cap/接回断言。

随后将 `uQe` Electron performance snapshot owner 及其独占 command/root aggregation helpers 迁入
`electron-performance-snapshot-collector.ts`；renderer process grouping/ranking、working-set delta、main/renderer
CPU snapshot、descendant kind/root/command/rank fields 与跨 snapshot delta 均由新 owner 持有，原 320 余行实现
已删除并由 startup runtime 唯一 consumer 真实接回。focused test 覆盖 35 项聚合、delta、internal-field 与
结构接回断言。

本轮继续收口 IAB/browser-sidebar 组合根相邻 owner：站点 annotation feature availability/settings/runtime
projection 已迁入 `site-annotation-feature-controller.ts`，permission request 的 pending identity、导航/销毁取消、
同 hostname 批量完成与 settings 持久化已迁入 `site-annotation-permission-controller.ts`；原 `$Ze/eQe`
内联 class 已物理删除并由 `tQe` 真实实例化新 owner。focused tests 共 56 项。复核确认当前 `tQe`
剩余主体是 15 个已迁 controller/service 的构造顺序、共享 owner 状态和对外委托面；若整体搬迁需重新注入
上百个 chunk 私有符号，因此登记为 preserve-coupled 组合根，不再制造 facade。

随后确认 app-primary `po` 的闭包 registry 实为 app-shared 公共 `wu` plugin-state reader；home
artifact templates 已显式注入真实 owner 并直连 `isActiveEntity`。semantic/hub 交叉集合现仅剩
共享同一 browser registry owner 的 `Rs/Us`。

随后解开 app-primary `Hi` 的跨 hub browser-comment 判型链：typed helper 现完整保留 annotation
origin、五类 legacy local browser 字段和 tab metadata 匹配，detached-browser host 不再读取 `Hi`。
semantic/hub 交叉集合仅剩依赖私有 registry 的 `po/Rs/Us`。

随后对全部 `semantic-business-logic` 分类与 hub consumer 做交叉审计，接回 subagent
recency 排序和 detached-browser annotation projection，清除 app-primary `_n` 与 app-shared
`wJ` 读取。`po/Rs/Us` 仍依赖 hub 私有 registry，保留为显式例外，不做循环依赖式伪迁移。

随后扩展到 namespace 解构扫描，接回 appgen URL、home beacon key、artifact skill-kind、image
system hints、appgen plugin prompt 与 wallet query-key serialization 共 7 条 consumer；清除
`xf/yh/vg/iu/Rf/AZ` hub 读取。`extract-skill-kind` 补齐真实 ProseMirror `type.name` 结构，
stable JSON 仅排序 plain object、保留 Date 的 `toJSON`。`po` 因依赖 hub 私有 registry 暂不误接。

随后完成 app-shared semantic consumer 扫描发现的全部 3 个真实遗漏：pull-request-fix/resume
错误路径改用 `format-error-message`，Codex Micro keyboard 改用 `status-to-color`，artifacts/source-summary/
workspace-selection、terminal、image restoration 与 text thumbnail 改用 `get-path-basename`。basename
helper 同步补齐发布版的 Windows extended-path、UNC 与反斜杠规范化；9 个 consumer 不再读取
`IH/EX/II`。

同批 renderer 全量构建还修复了 4 个发布依赖边：为 `sort-bar-visualization` 登记既有
motion proxy 资产别名；为 WebMCP model 与 native sandbox 保留原 hub side-effect 边；并将 lazy
size-capture 精确绑定到其原始 `chunk-Y2CYZVJY-24cce454fd91.js`，避免误用同名 modern runtime。
`build-renderer` 与 `verify-renderer` 均恢复为 1874/1874，等价性验证 0 failures。

本轮修复 renderer 语义模块未真实接回的问题：`app-primary` 的 `w2/Ur` conversation readiness
此前虽已迁入 `ensure-conversation-ready.ts`，但唯一真实 consumer
`open-local-conversation-background-agent` 仍调用混淆 hub 导出。现 consumer 已直接使用语义 helper，
通过 app-initial 的 conversation store、hydrator、message projection 与 completed-history predicate
保持原 resumed/history 分支，并移除 `Ur` import/declaration。focused suite 扩至 14 项，覆盖空但已完成
history 的直接成功路径与真实接回证据。

本轮清理 preload/sandbox-preload 迁移后遗留的 CommonJS 兼容分支：
`sandbox-guest-policy`、view-message router、connect-app-host、system-theme、PIP decoder/frame subscription
与 worker-message subscription 共 7 个模块已确认只有 ESM import consumer，删除无消费的条件式
`module.exports`，消除 esbuild 的 ESM/CommonJS 混用警告。7 组 focused tests、typecheck、verify-chunks
与 12203/12203 全量 build check 均通过。

本轮继续收口 tQe annotation interaction：annotation ingress、comment/design mode、presentation
suspension、dragged-image state 与 overlay actions 已迁入
`src/main/main-app/browser-sidebar/browser-annotation-interaction-controller.ts`，删除原内联实现约 218 行，
focused test 为 `scripts/test-main-browser-annotation-interaction-controller.mjs`（21 项）。同时修正
page-command controller 的 history clone 依赖，将 `rW/WX/GX` 显式注入，避免运行时依赖原文件作用域。

随后完成 tQe 两个完整子系统迁移：browser persistence/冷恢复（删除旧 `yZe/bZe`）迁入
`browser-page-persistence-controller.ts`，presentation/owner sync 与 presented-state lookup 迁入
`browser-presentation-sync-controller.ts`，均保留 focused tests；tQe 剩余主要为窗口/thread materialization
与 runtime/disposal 编排。

本轮继续完成 tQe 两个完整 owner：browser-use route actions 已迁入
`browser-use-route-controller.ts`，comment-mode entry orchestration 已迁入
`browser-comment-mode-controller.ts`；两者均删除原 tQe inline owner 并保留 focused tests。共享的
`mXe/hXe/OX` 等仍被其他生命周期路径使用的顶层 helper 保留，不计为 route owner 残留。

随后完成 tQe window/thread state owner：close/transfer、window state、thread state 创建/销毁、页面 lookup
与 detached-window 选择已迁入 `browser-window-thread-state-controller.ts`，旧 inline 实现已物理删除；并修正
page host lifecycle 中 registerHost 的 conversation/tab 参数顺序。focused test 为
`scripts/test-main-browser-window-thread-state-controller.mjs`（6 项）。

随后完成 tQe 的 page materialization 与 runtime projection owner：冷恢复、页面对象构造、生命周期更新、
thread/runtime snapshot 同步与 comment snapshot 已分别迁入 `browser-page-materialization-controller.ts` 和
`browser-runtime-sync-controller.ts`，并保留 focused tests；其 page lifecycle helper 已由
`browser-page-lifecycle-helpers-controller.ts` 接管，后续 binding owner 已完成静态接回。

随后完成导航/command context 与 WebContents/page binding owner：页面 command context、历史导航、受限导航与
browser error page 已迁入 `browser-navigation-context-controller.ts`，`bindPageToWebview` 已迁入
`browser-page-webview-binding-controller.ts`；两批均保留 focused tests，并在 main-C 中真实接回。

本轮进一步完成 binding owner 的静态迁移：原 generated `uZ` 的 WebContents attach、navigation/media/input/
context-menu、window-open、restore、crash/unresponsive、destroy/dispose 事件图已整体迁入
`browser-page-webview-binding-controller.ts`，并从 main-C 删除原约 1000 行实现；不再通过 generated facade 或动态执行。
同时将 runtime lifecycle helper 的 attach、comment dismiss、error/navigation、reload、zoom/device metrics 与交互适配
迁入 `browser-page-lifecycle-helpers-controller.ts`。focused tests 分别覆盖 binding lifecycle 结构断言与 5 项 helper assertions。

最后将 tQe 的 page WebContents identity lookup 迁入 `browser-page-lookup-controller.ts`，tQe 仅保留委托；focused
test 覆盖 live page identity 与 missing page 两种结果。

本轮继续收口 tQe host policy/diagnostics：in-app browser admission/session、settings webview mount/theme、owner
accelerator refresh、debug snapshot/feedback/debug-tab、MCP completion cleanup、browser-use navigation restriction
与 site bootstrap/persistence wrappers 已迁入 `browser-host-policy-controller.ts`，并在 main-C 中真实接回。
同时修复 `isPrimaryWindowPersistenceOwner` 的错误残实现，改为基于 page persistence controller 的 primary-owner 判断；
focused test 为 `scripts/test-main-browser-host-policy-controller.mjs`（17 项）。

本轮将 tQe 的 page command/host orchestration 迁移至
`src/main/main-app/browser-sidebar/browser-page-command-controller.ts`，真实接回 history、focused command、
reload/clear/scroll/find/site-info、reset/stop/audio/print/suspend、host transfer、zoom/navigate/screenshot/debugger
控制流，删除原 464 行；focused test 为 `scripts/test-main-browser-page-command-controller.mjs`（11 项）。

本轮将 `Sat` hotkey-window presentation controller 及独占 support 带整体迁移至
`src/main/main-app/hotkey/hotkey-window-controller.ts`，保留 home/thread 双窗、transition/generation、
placement/bounds、drag/snap/haptic、mouse passthrough、route 与 dispose 生命周期，原 main 删除 993 行。
`Eat` 继续通过三参契约真实注入该 controller；focused test 为 `scripts/test-main-hotkey-window-controller.mjs`
（20 项）。A3 当前剩余主 owner 为 `tQe` IAB/browser-sidebar manager。

本轮继续并行清理 A3 hotkey/Appshot 链路：

- cross-platform capture-request owner 已真实接回 `capture-requests.ts`，删除原 199 行
  pending/retry/timeout/abort/update 实现；focused 49 项。
- `Eat` hotkey-window lifecycle 迁入 `hotkey-window-lifecycle-manager.ts`，删除原 329 行，
  保留 keymap/gate/registration/lock/retry/controller/delegation/attribution 完整状态机；focused 57 项。
- `Wit` Windows native capture bridge 与独占 helper 迁入 `windows-native-capture-bridge.ts`，
  删除原 526 行，保留 transport/hotkey/capture/handshake/file-safety/dispose 生命周期；focused 28 项。

本轮将 A3 三个完整 owner 并行迁出并真实接回：

- `DYe` browser-use API runtime 迁入 `src/main/main-app/browser-use/iab-api.ts`，替换未接回 skeleton，
  保留 109 方法、21 个状态容器和 Symbol API，删除原 class 1,371 行；focused 40 项。
- `Qot` BrowserWindow manager 迁入 `src/main/main-app/window/browser-window-manager.ts`，
  保留 window/webContents/message/primary/create/register/appearance/focus/recovery 全生命周期，
  删除原 class 1,022 行；focused 33 项。
- `Pit` Appshot hotkey manager 迁入 `src/main/main-app/hotkey/appshot-hotkey-manager.ts`，
  保留 registration、Windows flight、destination route、priority lease 与 dispose，删除原 class 236 行；
  focused 47 项。

本轮将原 `Wtt` terminal session manager 整体迁移至
`src/main/main-app/terminal/terminal-session-manager.ts` 并真实接回；session/conversation registry、
pending create/abort、owner listener、action restart、buffer snapshot、create/attach/transfer/write/resize/close、
local/remote/durable backend 与 dispose 全部由新 owner 持有，原 class 删除 618 行。
`ztt` 经复核是 node-pty I/O adapter 而非 session manager，继续作为依赖注入保留。
focused test 为 `scripts/test-main-terminal-session-manager.mjs`（33 项）。

右侧文件预览终局复核已从 `connected-file-preview-tab` 真实 route 追到
`LibraryCloudFilePreview` 及内容 consumer。本轮补齐 image、PDF/blob、sandboxed HTML、
MarkdownSurface、text、JSON 与 Google Workspace provider iframe 的真实渲染，
并为 PDF object URL 保留 generation/revoke/dispose；artifact 路由继续接入
`ArtifactTabContent`。loading/error/unsupported/40 MiB/missing-size/download、取消和 stale completion
均有可执行证据。focused renderer 22、state 24、loader 15、artifact flow 86 项通过。
至此右侧文件“显示预览”专属 owner 已清零；剩余为通用 composer/attachment、
favorite/breadcrumb 与共享 header 基础设施。

本轮将 `Vet` 剩余 artifact session host owner 整体迁移至
`src/main/main-app/remote-artifact/artifact-session-host-service.ts` 并真实接回；connection single-flight、
reconciliation、external-document routing、native snapshot/kind/capability 和最终 child/client disposal 均由新
service 持有，原 `Vet` class 已整体删除，仅保留构建别名与依赖适配。focused test 为
`scripts/test-main-artifact-session-host-service.mjs`（37 项）。至此 `Vet` 语义 owner 已清零；A3 下一最大
可迁边界为 `ztt` terminal session manager。

本轮将 Wy 剩余的 controller disposal、reconciliation、global input、hover refresh、
editor/anchor observation、interaction visibility、highlight/screenshot-ready 生命周期迁入
`annotation-controller-lifecycle.ts` 与 `annotation-runtime-effect-lifecycle.ts`，并将 Ky popover/RAF owner
迁入 `annotation-interaction-layer-component.ts`；保留 hook 顺序、重复 screenshot cleanup、
RAF retry/cancel 与 popover cleanup，从原文件删除约 194 行。focused test 为
`scripts/test-preload-annotation-runtime-lifecycle.mjs`（20 项）。至此 A2 annotation React owner
已无未迁出的大型业务/生命周期主体，Wy 剩余为状态声明、依赖 adapter 与语义 owner 组合。

本轮将 `Vet` 的完整 artifact subscription/session 子 owner 迁移至
`src/main/main-app/remote-artifact/artifact-subscription-manager.ts` 并真实接回；删除原约 250 行
subscription map、host open/close、append/read/dirty、event/flush、RPC broken 与 drain 实现，`Vet` 仅保留
host connection/native/external-document 编排。focused test 为
`scripts/test-main-artifact-subscription-manager.mjs`（50 项）。

本轮将 Wy 的 DOM interaction setup 与 command facade 迁入
`src/main/browser-page-preload/annotation-interaction-command-facade.ts`，以单一自定义 hook
真实接回；保留 30 个 callback/effect-event/effect 的 hook 顺序、site request subscription、
DOM interaction enable/clear/dispose 与 23 个 command 出口，删除 Wy 约 148 行内联主体。
focused test 为 `scripts/test-preload-annotation-interaction-command-facade.mjs`（15 项）。

本轮将原 `xZe` browser tab working-set/activity manager 整体迁移至
`src/main/main-app/browser-sidebar/browser-tab-working-set-manager.ts`，真实接回 IAB manager 唯一 consumer，
并删除旧 owner 与专用候选排序/筛选 helper；保留单调 activity 序列、per-window selection、30 分钟保护、
32-tab budget、expiry timer 与 suspension telemetry。focused test 为
`scripts/test-main-browser-tab-working-set-manager.mjs`（41 项）。

本轮将 Wy 的 runtime collections/current-page target projection 迁入
`src/main/browser-page-preload/annotation-current-page-target-projection.ts`并真实接回；
集中 page comment 过滤、text-anchor observation 复用、live comment/design target、element cache
及 scroll/mutation observation 策略。focused test 为
`scripts/test-preload-annotation-current-page-target-projection.mjs`（14 项）。

本轮将 Wy 顶层 32 个长生命 controller 的构造与依赖适配迁入
`src/main/browser-page-preload/annotation-controller-registry.ts`，真实接回唯一 consumer，
并删除原约 440 行内联 registry 主体；保留 hook/构造顺序、host message、RAF 注入
与后置 callback 的延迟闭包语义。focused test 为
`scripts/test-preload-annotation-controller-registry.mjs`（12 项）。

本轮将原 `vZe` browser page host lifecycle 整体迁移至
`src/main/main-app/browser-sidebar/browser-page-host-lifecycle.ts`，真实接回 IAB manager 唯一 consumer，
并删除旧约 309 行 owner；保留 renderer/host generation、webview attach/rebind、session-state、suspension、
teardown/finalize race 与 pending attach cleanup。focused test 为
`scripts/test-main-browser-page-host-lifecycle.mjs`（65 项）。

本轮将原 `Fet` native artifact file service 的完整生命周期迁移至
`src/main/main-app/remote-artifact/native-artifact-file-service.ts`，真实接回 `Vet` 唯一 consumer，
并删除旧 class 与专用 target helpers；保留 target discovery/projection、临时文件权限与清理、
download/open/show-in-folder 路由及 snapshot 文件一致性/大小校验。focused test 为
`scripts/test-main-native-artifact-file-service.mjs`（40 项）。

本轮将 Wy 的 highlight projection 与最终 root composition 迁移至 `annotation-highlight-render-owner.ts` 并真实接回；保留 text-preview bridge、highlight geometry/style、suspension gate、interaction layer 与根属性渲染。focused test 为 `scripts/test-preload-annotation-highlight-render-owner.mjs`（12 项）。

本轮将原 `jet` external document binding registry 的完整生命周期迁移至
`src/main/main-app/remote-artifact/external-document-binding-registry.ts`，真实接回 artifact session
manager 的唯一 consumer，并删除旧实现；保留 RPC endpoint ownership、capability connect、单线程 activation、
capture/apply callback routing、broken-RPC cleanup、host unbind 与 registry dispose。focused test 为
`scripts/test-main-external-document-binding-registry.mjs`（43 项）。

本轮将 Wy 的 host-message subscription lifecycle 迁移至 `annotation-host-message-controller.ts` 并真实接回；保留 dispatcher action wiring、sync state、editor close/restore 与 viewport scheduler cleanup 顺序，删除原约 68 行内联 effect。focused test 为 `scripts/test-preload-annotation-host-message-controller.mjs`（12 项）。

本轮将原 `ytt` system permissions service 整体迁移至
`src/main/main-app/startup/system-permissions-service.ts`，真实接回 startup RPC service 唯一 consumer，
并删除旧实现及专用 URL constants；保留通知状态映射、macOS 麦克风授权、通知请求等待、三类系统设置
跳转、Finder 定位与错误降级。focused test 为
`scripts/test-main-system-permissions-service.mjs`（55 项）。

本轮将 Wy 的 overlay render composition 迁移至 `annotation-overlay-content-renderer.ts` 并真实接回；保留 region、highlight、selection cursor、text selection、flex/metadata、draft/saved marker 与交互回调，删除原约 110 行内联 JSX-runtime 主体。focused test 为 `scripts/test-preload-annotation-overlay-content-renderer.mjs`（12 项）。

本轮将 Wy 的 active view/draft matching/marker/region/text-preview 投影迁移至 `annotation-active-runtime-state.ts` 并真实接回；保留 multi-select link、原页面 marker 策略、active geometry 与 text preview，删除原约 90 行内联投影。focused test 为 `scripts/test-preload-annotation-active-runtime-state.mjs`（12 项）。

本轮将原 `ttt` startup renderer coordinator 的完整 phase 生命周期迁移至
`src/main/main-app/startup/startup-renderer-coordinator.ts`，真实接回 startup RPC service 唯一 consumer，
并删除旧实现；保留 content-ready/primary replacement race、host-ready 前有序 buffering、startup/window
双订阅及 origin-destroy cleanup。focused test 为
`scripts/test-main-startup-renderer-coordinator.mjs`（46 项）。

本轮将原 `Dtt` tab-drag session 的完整 RPC/presentation 生命周期迁移至
`src/main/main-app/window/tab-drag-session.ts`，真实接回 `Ett.prepare()` consumer，并删除旧实现；保留
nullable cue schema、single-load gate、owner bounds/grab-offset 校验、freeze 坐标投影、异步 dispose race
与 presentation 失败清理。focused test 为 `scripts/test-main-tab-drag-session.mjs`（51 项）。

本轮将 Wy 的 screenshot/render/draft-marker/overlay-style 投影迁移至 `annotation-overlay-runtime-state.ts` 并真实接回；保留 linked draft selection、截图 geometry、metadata/flex-gap、draft marker 与 comment cursor policy，删除原约 100 行内联投影。focused test 为 `scripts/test-preload-annotation-overlay-runtime-state.mjs`（10 项）。

本轮将原 `Ctt` tab-drag presentation window 的完整 Electron 窗口生命周期迁移至
`src/main/main-app/window/tab-drag-presentation-window.ts`，真实接回 `Ett.create()` factory，并删除原约
180 行内嵌实现；保留 isolated document/snapshot 注入、cue 串行更新、capture readiness、pointer-follow、
freeze、3 秒 operation timeout 与 closed/dispose 清理。focused test 为
`scripts/test-main-tab-drag-presentation-window.mjs`（47 项）。

本轮将 Wy 的 text-anchor observation layout effect 迁移至 `annotation-anchor-observation-controller.ts` 并真实接回；保留当前页筛选、RAF 合并、viewport/frame resize/scroll、scroll-container、mutation observer 与 cleanup 顺序，删除原约 66 行内联编排。focused test 为 `scripts/test-preload-annotation-anchor-observation-controller.mjs`（9 项）。

本轮将原 `kat` Quick Chat window manager 的完整窗口预热/打开生命周期迁移至
`src/main/main-app/startup/quick-chat-window-manager.ts`，真实接回 startup 唯一 consumer，并删除原约
190 行内嵌实现；保留 per-origin prewarm、lazy window claim/release、renderer route-ready handshake、
超时/closed/origin-destroyed 清理、display work-area 定位裁剪和 manager dispose。
focused test 为 `scripts/test-main-quick-chat-window-manager.mjs`（40 项）。

本轮将 Wy 的完整 pointer interaction effect 迁移至 `annotation-pointer-interaction-controller.ts` 并真实接回；保留跨 frame listener、hover、pointer selection、region drag、click/contextmenu/wheel、Escape/修饰键与 cleanup 顺序，删除原 394 行内联主体。focused integration test 为 `scripts/test-preload-annotation-pointer-interaction-controller.mjs`（13 项）。

本轮将原 `SQe` sampler manager 的完整 startup/window health 生命周期迁移至
`src/main/main-app/startup/sampler-manager.ts`，真实接回 main app 唯一 consumer，并删除原约 140 行
内嵌实现；模块保留 app-state heartbeat/trigger gate、request/WebContents identity、host/browser/stdio/jank
快照富化、jank 日志与 Sentry breadcrumb、performance-span CPU sampling 和 dispose 清理。
focused test 为 `scripts/test-main-sampler-manager.mjs`（38 项）。

本轮将 `GitRepoWatcher.emitRepoChanged()` 的完整 coalesced emission 生命周期迁移至
`src/main/worker/git-repo-change-emission-controller.ts`，真实接回 worker consumer，并删除原 40 行内嵌
实现；controller 保留 raw-event count 消费、working-tree path snapshot/reset、operation state、disposed
gate、worker event emit、未知 HEAD ref 恢复、日志与 finally completion。focused test 为
`scripts/test-worker-git-repo-change-emission-controller.mjs`（19 项）。

本轮将 `GitManager.createRepoWatch()` 的完整 watch factory 生命周期迁移至
`src/main/worker/git-repo-watch-factory.ts`，真实接回 worker consumer，并删除原 78 行内嵌实现；factory
保留 repository 单 owner、watch identity/raw-event/recovery 状态、cache/live-query callbacks、local-only
ignore source、backend host binding、watcher options、初始 watch record 与 origin-query cleanup。focused test
为 `scripts/test-worker-git-repo-watch-factory.mjs`（31 项）。

本轮新增 `annotation-hover-refresh-controller.ts`，真实接回 Wy 的 comment hover/viewport refresh lifecycle；保留 resize flushSync、capture-phase scroll、debounce 与 cleanup 顺序，删除原独立 effect 内联实现。focused test 为 `scripts/test-preload-annotation-hover-refresh-controller.mjs`（6 项）。

本轮将 R9 `W0e` language-server manager 的完整 session 生命周期迁移至
`src/main/main-app/language-server/language-server-manager.ts`，真实接回 `Q0e` consumer 并删除
原 172 行内嵌实现；保留 host/provider/workspace single-flight、request routing、失败回收、
expired managed runtime 标记/重试和 manager dispose。focused test 为
`scripts/test-main-language-server-manager.mjs`（39 项）。

本轮将 `GitRepoWatcher.startWatchSession()` 的完整单 target session runtime 迁移至
`src/main/worker/git-repo-watch-session-runtime.ts`，真实接回 worker consumer，并删除原 93 行内嵌实现；
controller 保留 metadata stat/missing gate、ignore snapshot 捕获、working-tree/metadata backend 选择、
watch event 闭包、generation/dispose/registration race、session attach/close、恢复事件、metadata refresh
与失败 retry 顺序。focused test 为 `scripts/test-worker-git-repo-watch-session-runtime.mjs`（18 项），
build 与相邻 session start/close 测试通过；typecheck 仍受并行 preload 改动的既有
`getViewportSelection` 类型错误阻断。

本轮将右侧 Library 文件预览的状态解析与主体分派整体迁移至
`src/renderer/library-cloud-file-preview/preview-state.ts`，真实接回
`LibraryCloudFilePreview` 的 route/page consumer；覆盖图片 40 MiB 上限、未知大小、
pending/error/hidden，以及 artifact/PDF、HTML/Markdown/Text、unsupported 分支，删除原四态
内联占位实现。`scripts/test-library-cloud-file-preview-state.mjs` 覆盖 24 项 focused assertions。

本轮将 annotation editor/comment-preview 的 anchor 投影、host update、text/element state 回写，以及
visual viewport、跨 frame、scroll-container 与 text-anchor observer 生命周期整体迁移至
`annotation-editor-anchor-sync-controller.ts`，真实接回 `Wy`；focused test 为
`scripts/test-preload-annotation-editor-anchor-sync-controller.mjs`。

本轮新增 `browser-permission-prompt-registry.ts`，真实接回 browser sidebar manager 的权限提示
registry；完整迁移 pending prompt、renderer subscription、presentation generation/跨窗口 transfer、
response/system-settings validation 与 closed/destroyed/RPC-broken cleanup 生命周期，并删除 main chunk
内原 `qZe` 实现。focused test 为 `scripts/test-main-browser-permission-prompt-registry.mjs`（25 项）。

本轮将 `GitRepoWatcher.start()` 的完整启动生命周期迁移至 `git-repo-watcher-start-controller.ts`，真实接回 worker consumer，并删除原 125 行内嵌实现；controller 保留重复启动恢复、metadata prefetch/fallback、watch target 拓扑装配、disposed race、session 并发启动和首次 metadata reconcile 顺序。focused test 为 `scripts/test-worker-git-repo-watcher-start-controller.mjs`（25 项），typecheck/build/verify-chunks 通过。

本轮将已有的 `git-file-content.ts` 真正接回 worker `fCe` 的 `readGitFileBinary` consumer，删除原 worker 内无 consumer 的 `dCe` 实现；保留 repository lookup、platform path、Git 执行、MIME 检测与异常降级顺序。focused test 为 `scripts/test-worker-git-file-content.mjs`（4 项），typecheck/build/verify-chunks 通过。

本轮继续将 Linux ignore-source watcher 的绝对路径/目录遍历、symlink 跟随、ELOOP 防护和缺失路径降级迁移至 `git-ignore-source-targets.ts`，真实接回 `watchIgnoreSources.getWatchTargets`，删除原 worker `mCe` 实现。focused test 为 `scripts/test-worker-git-ignore-source-targets.mjs`（5 项）。

本轮继续将 computer-use capture worker 的异步 update polling、terminal continuation、失败降级与 update emit 顺序迁移至 `computer-use-capture-update-loop.ts`，真实接回 `sCe.readCaptureUpdates`；focused test 为 `scripts/test-worker-computer-use-capture-update-loop.mjs`（2 项）。

本轮新增 `dynamic-app-tool-pending-responses.ts`，真实接回 `HostRequestRouter` 的动态 app-tool response registry；保留 duplicate identity、success/error/invalid route、cancel/discard 与 dispose rejection，focused test 为 `scripts/test-dynamic-app-tool-pending-responses.mjs`。

本轮新增 `parcel-watcher-runtime.ts`，真实接回 worker Parcel watcher 的 root/supplemental subscription、directory-check queue、串行 subscription operation、close/closed deferred 与 error/root-deleted lifecycle；focused test 为 `scripts/test-worker-parcel-watcher-runtime.mjs`。

2026-10-12 A5 consumer recheck：classification manifest `UNREVIEWED: 0`，113 条 semantic entry 对应 112 个 runtime module，代表性 helper 已确认真实 consumer；`format-annotation-summary`、`merge-conflict-state`、`select-mode-descriptor`、`parse-browser-target-id`、`is-path-within-roots` 等仅保留 focused contract 与 semantic module，不制造伪 consumer。

本轮新增 `app-server-request-lifecycle-controller.ts`，真实接回 `AppServerRequestSender.send` 的 prewarm/normal dispatch、timeout abandon、failure notification 与 cleanup lifecycle；focused test 为 `scripts/test-app-server-request-lifecycle-controller.mjs`。

本轮新增 `thread-goal-hydration-registry.ts`，真实接回 `AppServerConversationManager` 的 per-conversation goal hydration generation、stale-token gate、archive cancel 与 dispose clear；focused test 为 `scripts/test-thread-goal-hydration-registry.mjs`。

本轮新增 `thread-read-state-controller.ts`，真实接回 `createHostThreadReadState` 的 unread-thread subscription、retired retry、identity guard、pending event reconcile、异步 set 与 dispose lifecycle；focused test 为 `scripts/test-thread-read-state-controller.mjs`。

本轮新增 `annotation-element-editor-open-controller.ts`，真实接回 Wy 的 `qe` create-from-element editor lifecycle；focused test 为 `scripts/test-preload-annotation-element-editor-open-controller.mjs`。

本轮新增 `pip-video-decoder-controller.ts`，真实接回 preload PIP WebCodecs registry lifecycle；focused test 为 `scripts/test-preload-pip-video-decoder-controller.mjs`。

本轮新增 `system-theme-variant-controller.ts`，真实接回 preload 主题注入/observer/订阅生命周期；focused test 为 `scripts/test-preload-system-theme-variant-controller.mjs`。

本轮新增 `worker-message-subscription-controller.ts`，真实接回 preload worker IPC subscription registry；focused test 为 `scripts/test-preload-worker-message-subscription-controller.mjs`。
该 focused test 直接导入 TS controller，运行命令为 `node --experimental-strip-types scripts/test-preload-worker-message-subscription-controller.mjs`。

本轮新增 `view-message-router-controller.ts`，真实接回 preload `MESSAGE_FOR_VIEW` event routing；focused test 为 `scripts/test-preload-view-message-router-controller.mjs`，运行同样使用 `node --experimental-strip-types`。

A3 main 新增 `turn-start-inflight-registry.ts`，真实接回 `createExecuteTurnStart` 的 per-conversation promise dedup/settle cleanup；focused test 为 `scripts/test-main-turn-start-inflight-registry.mjs`。

本轮新增 `connect-app-host-controller.ts`，真实接回 preload `connect-app-host` MessagePort transfer listener；controller 管理 source/type guard、IPC transfer 与幂等 dispose，focused test 为 `scripts/test-connect-app-host-controller.mjs`（运行：`node --experimental-strip-types scripts/test-connect-app-host-controller.mjs`）。

本轮新增 `thread-settings-update-registry.ts`，真实接回 `AppServerConversationManager.runThreadSettingsUpdate` 的 per-conversation 串行队列、前序失败吞并、identity-safe cleanup、wait 与 dispose clear；focused test 为 `scripts/test-thread-settings-update-registry.mjs`（运行：`node --experimental-strip-types scripts/test-thread-settings-update-registry.mjs`）。

本轮新增 `pip-video-frame-subscription-controller.ts`，真实接回 preload PIP 视频帧 IPC listener；保持 stopped/frame 分流顺序并提供幂等 removeListener dispose，focused test 为 `scripts/test-pip-video-frame-subscription-controller.mjs`（运行：`node --experimental-strip-types scripts/test-pip-video-frame-subscription-controller.mjs`）。

本轮新增 `annotation-edit-editor-controller.ts`，真实接回 Wy 的 `Ye` edit-editor callback。controller 注入 target map、comment/anchor/design projection 与 host/React side effects，保持 `close preview -> open editor IPC -> viewport refresh -> editor state -> clear preview` 顺序；focused test 为 `scripts/test-preload-annotation-edit-editor-controller.mjs`。

同轮新增 `annotation-comment-preview-controller.ts`，真实接回 Wy 的 `Xe` comment-preview callback；focused test 为 `scripts/test-preload-annotation-comment-preview-controller.mjs`。

同轮新增 `annotation-design-editor-open-controller.ts`，真实接回 Wy 的 `Ze` design-editor callback；focused test 为 `scripts/test-preload-annotation-design-editor-open-controller.mjs`。

同轮新增 `annotation-virtual-selection-editor-controller.ts`，真实接回 Wy 的 `et` virtual-selection editor callback；focused test 为 `scripts/test-preload-annotation-virtual-selection-editor-controller.mjs`。

同轮新增 `annotation-create-anchor-update-controller.ts`，真实接回 Wy 的 `ut` create-editor anchor update/cancel callback；focused test 为 `scripts/test-preload-annotation-create-anchor-update-controller.mjs`。

同轮新增 `annotation-interaction-reset-controller.ts`，真实接回 Wy 的 `mt` 全量 interaction reset callback；focused test 为 `scripts/test-preload-annotation-interaction-reset-controller.mjs`。

同轮新增 `annotation-hover-fallback-controller.ts`，真实接回 Wy 的 `tt` DOM hover/click fallback callback；focused test 为 `scripts/test-preload-annotation-hover-fallback-controller.mjs`。

同轮新增 `annotation-site-request-dispatch-controller.ts`，真实接回 Wy 的 `Qe` site-annotation request dispatcher；focused test 为 `scripts/test-preload-annotation-site-request-dispatch-controller.mjs`。

同轮新增 `annotation-comment-preview-close-controller.ts`，真实接回 Wy 的 `$e`/`ft` preview close lifecycle；focused test 为 `scripts/test-preload-annotation-comment-preview-close-controller.mjs`。

同轮新增 `git-init-recovery-controller.ts`，真实接回 `GitManager.handleGitInit`；controller 保留 handled-set、
metadata refresh、watch-git-metadata 重启、desired-key 竞态与 finally/catch 回收顺序；focused test 为
`scripts/test-worker-git-init-recovery-controller.mjs`。

同轮新增 `git-init-metadata-refresh-controller.ts`，真实接回 `GitManager.refreshGitInitMetadata`；controller 保留
stable metadata invalidation、按 watch key single-flight 复用与 promise identity cleanup；focused test 为
`scripts/test-worker-git-init-metadata-refresh-controller.mjs`。

同轮新增 `git-init-metadata-apply-controller.ts`，真实接回 `GitManager.refreshGitInitMetadataOnce`；controller 保留
stable metadata 应用、旧 watcher 释放、repository watch 建立、desired-key superseded 回退与 HEAD invalidation
event 顺序；focused test 为 `scripts/test-worker-git-init-metadata-apply-controller.mjs`。

同轮新增 `git-init-watch-session-controller.ts`，真实接回 `GitInitWatcher.startWatch`；controller 保留 host watch
创建、disposed race、session 注册、watch-error 清理与 reconnect 顺序；focused test 为
`scripts/test-worker-git-init-watch-session-controller.mjs`。

同轮新增 `git-metadata-refresh-batch-controller.ts`，真实接回 `GitRepoWatcher.processMetadataRefreshBatch`；
controller 保留 metadata target 筛选、recovery dispose/restart、missing target 补启动与 worktree refresh 的
原始 Promise.all 顺序；focused test 为 `scripts/test-worker-git-metadata-refresh-batch-controller.mjs`。

2026-10-06 A5 export-table 交叉审计：app-shared 未复核导出 `$` 反解为内部 `LDt`/`RDt`（源码 121786 起始），确认为 generated `book-open-moon-star-light-20` SVG icon initializer，依赖共享 icon registry/lazy asset lifecycle，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 继续批次：app-shared 未消费导出 `$$`（内部 `OT`，源码 38506--38526）的 SVG local-id/reference prefix policy 已迁移至 `src/renderer/app-shared/runtime/prefix-svg-local-ids.ts`；新增 `scripts/test-app-shared-prefix-svg-local-ids.mjs` 覆盖 4 项 focused assertions，纯策略无 React/store/lifecycle 副作用。

2026-10-06 A5 export-table 交叉审计：app-shared 未复核导出 `$S` 反解为内部 `Nnt`/`m3e`（源码 86045--86047），确认为 generated `slides-light-20` SVG icon initializer，依赖共享 icon registry/lazy asset lifecycle，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-shared 未复核导出 `$R` 反解为内部 `UU`（源码 68857），确认为 generated protocol/runtime descriptor，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-shared 未复核导出 `$Q` 反解为内部 `KA`（源码 43912），确认为 generated runtime initializer，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Hm` 反解为内部 `lA`（源码 6036），确认为 generated beacon-action symbol/feature-state wiring，无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Hc` 反解为内部 `oVe`（源码 31072），确认为 generated JSX component/UI composition，无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Gu` 反解为内部 `xR`（源码 18605），确认为 generated store/runtime callback，无 standalone renderer policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Go` 反解为内部 `sJ`（源码 40154），确认为 generated composer runtime initializer，耦合 stores/hooks、无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Gg` 反解为内部 `NE`（源码 78091），确认为 generated runtime helper，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Gf` 反解为内部 `vP`（源码 13897），确认为 generated store atom/constant-false selector，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Ga` 反解为内部 `KX`（源码 52728），确认为 generated protobuf analytics descriptor `ChatgptModelPickerEvent`，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Fh` 反解为内部 `qO`（源码 4774），确认为 generated constant-false capability callback，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Fi` 反解为内部 `A5e`（源码 75492），确认为读取多组 generated atoms/signals 的 React hook，无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Eg` 反解为内部 `eD`（源码 3723），确认为 generated cursor CSS configuration constant，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Es` 反解为内部 `nq`（源码 37812），确认为 generated signal/store selector，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Er` 反解为内部 `$2`（源码 82698），确认为 generated callback constant/internal orchestration，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Dg` 反解为内部 `tD`（源码 3724），确认为 generated numeric configuration constant，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Cs` 反解为内部 `oq`（源码 37925），确认为 generated runtime initializer，无 standalone renderer policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-primary 未复核导出 `Bh` 反解为内部 `wO`（源码 4505），确认为 generated runtime configuration object，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-shared 未复核导出 `$P` 反解为内部 `nJ`（源码 75188），确认为 generated enum/protocol schema surface，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-shared 未复核导出 `$M` 反解为内部 `LZ`（源码 75915），确认为 generated protobuf analytics descriptor `CodexPdfPreviewViewed`，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 export-table 交叉审计：app-shared 未复核导出 `$N` 反解为内部 `_J`（源码 75398），确认为 generated analytics/protocol enum initializer，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 实现级交叉审计：app-primary 未复核导出 `Da`（内部 `TQ`，源码 58873--58876）确认为 generated React context；唯一 consumer 为同 hub 内部 `useContext(TQ)`（60350），无独立 pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 交叉审计：app-shared 未复核导出 `$L`（内部 `pqe`，源码 69360）确认为依赖 generated prefix `mqe` 的 route URL formatter；无独立 renderer consumer/稳定 owner，补充 `preserved-coupled` 证据。

2026-10-06 A5 审计登记：app-shared 未消费导出 `$K`（内部 `Oz`，源码 62136）确认为 generated computer-history route constant/protocol contract，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `$J`（内部 `SR`，源码 61065）确认为 generated app-server version initializer/protocol constants，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `$I`（内部 `hJe`，源码 70024）确认为 generated path/runtime initializer，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `$H`（内部 `WV`，源码 65504）确认为 generated analytics/runtime initializer，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `$F`（内部 `xQ`，源码 75958）确认为 protobuf analytics event descriptor，属 generated telemetry schema、无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `$E`（内部 `$1`，源码 81016）确认为 generated alias-chain runtime initializer，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `$C`（内部 `Btt`，源码 89364）确认为 generated store/query registry initialization，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `$A`（内部 `oK`，源码 73954）确认为 generated `CodexDictationEndReason` protocol enum，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `$D`（内部 `t1`，源码 79044）确认为 generated runtime initializer，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `$4`（内部 `ote`，源码 23900）确认为 generated context accessor，依赖内部 schema/runtime state、无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `$3`（内部 `c`，源码 1523--1530）确认为 React reconciler dehydrated-fiber inspector，属内部 runtime infrastructure、无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `H4`（内部 `G`，源码 24042）确认为 generated validation object constructor，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `H3`（内部 `ce`，源码 1721）确认为 generated reconciler fiber hook，触及内部 renderer state、无独立业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `H1`（内部 `lC`，源码 34502--34504）确认为 generated SVG/DOM runtime tag predicate，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `Bz`（内部 `Bz`，源码 70120）确认为 generated platform-specific path normalization adapter，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Ft`（内部 `T5`，源码 103473）确认为 generated command React context initializer，无 standalone pure renderer policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Nf`（内部 `XP`，源码 15020）确认为 generated localization/error-message resolver，缺少独立 consumer boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Jf`（内部 `dP`，源码 13866）确认为 generated store mutation helper，属 coupled runtime orchestration、无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `B4`（内部 `Np`，源码 24026）确认为 generated validation schema constructor，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `D0`（内部 `kle`，源码 33364）确认为 generated gesture configuration helper，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `J1`（内部 `iC`，源码 34351--34353）确认为 generated gesture runtime initializer，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `J3`（内部 `I`，源码 722）确认为 generated runtime registry initializer，持有 WeakMap/internal constants、无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `Gz`（内部 `iU`，源码 67994）确认为 generated timeout constant initializer，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `B1`（内部 `uC`，源码 34525--34527）确认为 generated gesture runtime initializer，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `A1`（内部 `bC`，源码 34942）确认为 generated gesture runtime event-listener helper，耦合 lifecycle/options、无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `A4`（内部 `Qp`，源码 24183）确认为 generated schema callback wrapper，属 validation infrastructure、无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Hn`（内部 `lJ`，源码 40182）确认为 category selector React component，JSX/store-bound、无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Em`（内部 `RA`，源码 8532）确认为 model settings React component，读取 generated signals/stores/lifecycle state、无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Ii`（内部 `a0`，源码 75570）确认为 app state generated initializer，耦合 stores/hooks/lifecycle registrations、无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `In`（内部 `n6`，源码 91898）确认为 voice/composer generated runtime initializer，耦合 stores/hooks/lifecycle state、无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Gr`（内部 `Zet`，源码 80588）确认为 hotkey-window navigation handler，协调 generated stores/routing/副作用、无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Et`（内部 `cpt`，源码 104505--104509）确认为 artifact follow-up action builder，依赖 generated analytics/event constructors、无 standalone pure renderer policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Hf`（内部 `NP`，源码 14825）确认为 app bootstrap initializer，耦合 generated services/stores、无 standalone renderer 业务语义，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Fo`（内部 `FJ`，源码 41548）确认为 composer setup initializer，耦合 generated hooks/context、无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `Fq`（内部 `LFe`，源码 61850）确认为 pet-control React UI component，无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Jt`（内部 `qX`，源码 52682）确认为 generated enum initializer，无 standalone renderer 业务语义，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Oi`（内部 `O0`，源码 77307）确认为 generated conversation UI initializer，无 standalone renderer 业务语义，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Og`（内部 `qE`，源码 3660--3664）确认为 appearance-dependent SVG icon JSX component，无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Ha`（内部 `oZ`，源码 53338--53342）确认为 localized-content React renderer，含 JSX 分支且无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Gi`（内部 `T1`，源码 70859）确认为 React/store-bound comment-action UI component，无 standalone pure policy boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Gp`（内部 `rM`，源码 10539--10549）确认为 generated query-state patch/rollback orchestration，缺少独立 consumer boundary，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Gd`（内部 `TI`，源码 17375）确认为 mutating generated query/cache flush helper，无 standalone renderer 业务语义，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `E4`（内部 `Pp`，源码 24035）确认为 generated schema object constructor，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `F4`（内部 `Rp`，源码 24061）确认为 generated intersection-schema constructor，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Gt`（内部 `e5`，源码 101126）确认为 generated runtime initializer，无 standalone renderer 业务语义，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `G1`（内部 `sC`，源码 34466--34468）确认为 generated CSS motion-property list initializer，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `D1`（内部 `wC`，源码 35058--35060）确认为 generated resize-animation bookkeeping initializer，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `A0`（内部 `sS`，源码 33308--33310）确认为 generated gesture runtime 的 pointer-event primary-button initializer，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `E3`（内部 `ft`，源码 2198--2202）确认为 generated renderer fiber host-instance extractor，依赖 reconciler tags/error contract，无独立业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `Hq`（内部 `DFe`，源码 61728）确认为依赖 generated layout offset table 的 notification offset helper，无独立 renderer consumer，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `C0`（内部 `OS`，源码 33618）确认为 generated geometry-default initializer，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Gn`（内部 `o3`，源码 86955）确认为仅调用邻接 generated setup routines 的 initializer，无 standalone renderer 业务策略，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Fu`（内部 `hB`，源码 21587）确认为仅负责邻接 generated modules/global runtime wiring 的 initializer，无 standalone renderer 业务语义，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-primary 未消费导出 `Fl`（内部 `zH`，源码 25982）确认为 generated feature wiring 的 constant-false capability stub，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `C4`（内部 `jp`，源码 24017）确认为 generated schema accessor，依赖内部 validation registry，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `C2`（内部 `rv`，源码 30055--30057）确认为 generated runtime identity passthrough，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `D3`（内部 `lt`，源码 2172--2177）确认为 generated renderer bookkeeping cleanup helper，无独立业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `D4`（内部 `Cte`，源码 23954）确认为 generated schema lookup，依赖内部 validation registry，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `I4`（内部 `tm`，源码 24215）确认为 generated validation composed-schema helper，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `J4`（内部 `Yp`，源码 24163）确认为 generated validation template-literal schema constructor，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `G4`（内部 `Bp`，源码 24068）确认为 generated validation schema-record constructor，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `Ip`（内部 `fut`，源码 103032）确认为 generated command-schema `descriptionIntlId` field guard，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `Im`（内部 `Zct`，源码 100305）确认为委托 generated normalization 的 nullable collection helper，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `Hp`（内部 `mut`，源码 103043）确认为读取 generated command metadata 的 shortcut-scope predicate，无独立 renderer consumer，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `I_`（内部 `H4`，源码 89448）确认为 generic SVG data-URI encoder，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `Gq`（内部 `TFe`，源码 61728--61739）确认为 artifact-annotation comment builder，与 generated annotation constructor/origin/content schema 强耦合，无独立 renderer consumer，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `HJ`（内部 `wPe`，源码 61129）确认为依赖 generated version constants/semantic-version helpers 的 app-server compatibility predicate，无独立 renderer consumer，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `GJ`（内部 `vPe`，源码 61097--61099）确认为 generated app-server version status wrapper，依赖相邻 parser/comparator 且无独立 renderer consumer，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `BI`（内部 `wJe`，源码 70096）确认为委托 generated path normalization 的 lowercased path-key wrapper，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `HK`（内部 `Iz`，源码 62197）确认为低层 Windows drive-path regex wrapper，与相邻 generated path utilities 强耦合，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `Fz`（内部 `UGe`，源码 68071）确认为 generated feature wiring 的 constant-false predicate，无独立 renderer 语义归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `G2`（内部 `oae`，源码 29102）确认为 generic identity infrastructure，无 renderer 业务语义或独立 consumer，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `CJ`（内部 `UPe`，源码 61319）确认为 generated annotation batch enum lookup/fallback，无独立 renderer 业务归属，登记 `preserved-coupled`。

2026-10-06 A5 审计登记：app-shared 未消费导出 `EJ`（内部 `KPe`，源码 61332）确认为通用 generated-schema/collection 非空 helper，无独立 renderer 业务归属，登记 `preserved-coupled`，不伪造 facade。

2026-10-06 A5 继续批次：app-shared 未消费导出 `II`（内部 `DJe`，源码 70115--70118）的路径 basename 投影已迁移至 `src/renderer/app-shared/runtime/get-path-basename.ts`；新增 focused test 覆盖尾部分隔符、单段路径与全分隔符。

2026-10-06 A5 继续批次：app-shared 未消费导出 `Gf`（内部 `Odt`，源码 103765--103768）的 dropdown overlay side 规范化已迁移至 `src/renderer/app-shared/runtime/normalize-dropdown-overlay-side.ts`；DOM 查找保留边界，新增 focused test 覆盖 top、bottom 与非法值。

2026-10-06 A5 继续批次：app-shared 未消费导出 `EG`（内部 `sRe`，源码 63491）的搜索查询优先级策略已迁移至 `src/renderer/app-shared/runtime/get-query-priority.ts`；新增 focused test 覆盖空白与实质查询。

2026-10-06 A5 继续批次：app-shared 未消费导出 `EL`（内部 `zqe`，源码 69565）的 Windows drive-letter/UNC 绝对路径判定已迁移至 `src/renderer/app-shared/runtime/is-absolute-path.ts`；新增 focused test 覆盖 drive-letter、UNC 与相对路径。

2026-10-06 A5 继续批次：app-shared 未消费导出 `FL`（内部 `kqe`，源码 69498）的 change-entry 路径投影已迁移至 `src/renderer/app-shared/runtime/get-change-path.ts`；新增 focused test 覆盖 move update、无目标回退与非 update。

2026-10-06 A5 继续批次：app-shared 未消费导出 `FJ`（内部 `NR`，源码 61258--61263）的 annotation origin 规范化策略已迁移至 `src/renderer/app-shared/runtime/normalize-annotation-origin.ts`；新增 focused test 覆盖支持 origin 与未知值回退。

2026-10-06 A5 继续批次：app-shared 未消费导出 `Gp`（内部 `lut`，源码 103020--103024）的 realtime voice command 识别策略已迁移至 `src/renderer/app-shared/runtime/is-realtime-voice-command.ts`；新增 focused test 覆盖入口命令、命名空间命令和普通命令。

2026-10-06 A5 继续批次：app-primary 未消费导出 `wd`（内部 `VI`，源码 17617--17619）的邮件收件人组非空判定已迁移至 `src/renderer/app-primary/runtime/has-recipient-contacts.ts`；新增 `scripts/test-app-primary-has-recipient-contacts.mjs` 覆盖 3 项 focused assertions，纯策略无 JSX/store/network/lifecycle 副作用。

2026-10-06 T2/A2 继续批次：annotation element metadata payload projection 已迁移至
`src/main/browser-page-preload/annotation-element-metadata-projection.ts`；原 `nd` 入口保留兼容委托，
新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation element ancestor path projection 已迁移至
`src/main/browser-page-preload/annotation-element-path-policy.ts`；原 `Sc` 入口保留兼容委托，
新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation nearby-text direct/context fallback 已迁移至
`src/main/browser-page-preload/annotation-nearby-text-policy.ts`；原 `xc` 入口保留兼容委托，
新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation accessible label 的 aria/text/tag 投影已迁移至
`src/main/browser-page-preload/annotation-accessible-label-policy.ts`；原 `yc` 入口保留兼容委托，
新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation element label projection 已迁移至
`src/main/browser-page-preload/annotation-element-label-policy.ts`；原 `bc` 入口保留兼容委托，
新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation document-root (`documentElement/body`) 判定已迁移至
`src/main/browser-page-preload/annotation-document-root-policy.ts`；原 `rc` 入口保留兼容委托，
新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：顶层 annotation anchor root（html/body）判定已迁移至
`src/main/browser-page-preload/annotation-anchor-root-policy.ts`；原 `rd` 入口保留兼容委托，
新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation anchor candidate score 的字段权重与距离惩罚已迁移至
`src/main/browser-page-preload/annotation-anchor-candidate-score.ts`；原 `gd` 入口保留兼容委托，
新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation frame document URL 选择策略已迁移至
`src/main/browser-page-preload/annotation-frame-document-url.ts`；原 `pd` 入口保留兼容委托，
新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation scroll offset 的 text/non-fixed 判定已迁移至
`src/main/browser-page-preload/annotation-scroll-offset.ts`；原 `_u` 入口保留兼容委托，
新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation direct-text preview 的文本节点筛选、规范化与长度上限
已迁移至 `src/main/browser-page-preload/annotation-direct-text-preview.ts`；原 `vd` 入口保留兼容
委托，新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation URL parser `yd` 已复用
`annotation-url-parser-policy.parseAnnotationUrl`，删除 preload 重复实现；既有 parser regression、
build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation anchor `bd` clamp helper 已复用
`annotation-surface-geometry.clampAnnotationCoordinate`，删除 preload 重复实现；geometry
regression、build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation anchor point projection（比例、零尺寸中心回退、clamp）
已迁移至 `src/main/browser-page-preload/annotation-anchor-point-projection.ts`；原 `hd` 入口保留
兼容委托，新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation frame URL optional/exact href policy 已迁移至
`src/main/browser-page-preload/annotation-frame-url-policy.ts`；原 `hu` 入口保留兼容委托，
新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation adoptedStyleSheets target predicate 已迁移至
`src/main/browser-page-preload/annotation-adopted-stylesheet-target.ts`；原 `tu` 入口保留
兼容委托，新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation CSS Highlights API capability predicate 已迁移至
`src/main/browser-page-preload/annotation-highlight-capability.ts`；原 `eu` 入口保留兼容委托，
新增 2 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation comment count 的非空判定与数量投影已迁移至
`src/main/browser-page-preload/annotation-comment-count.ts`；原 `ss/cs` 入口保留兼容委托，
新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation viewport inverse-scale fallback 已迁移至
`src/main/browser-page-preload/annotation-viewport-scale.ts`；原 `xs` 入口保留兼容委托，
新增 3 项 focused assertions，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation anchor equality 的公共字段与 virtual/element/region/text
判别联合比较已迁移至 `src/main/browser-page-preload/annotation-anchor-equality.ts`；原 `Fs` 入口保留
兼容委托。新增 focused test 3 项，build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation coordinate clamp helper `Ps` 已复用
`annotation-surface-geometry.clampAnnotationCoordinate`，删除 preload 重复 inline 实现；
geometry regression、build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation rect scaling helper `Ms` 已接回既有
`annotation-surface-geometry.ts` 的 `scaleAnnotationRect` 纯策略，删除 preload 重复内联实现；
geometry focused regression、build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation scroll-container 快照相等性纯策略已迁移至
`src/main/browser-page-preload/annotation-scroll-container-equality.ts`；原 `Ns` 入口保留
兼容委托。新增 focused test 覆盖缺省、相等和滚动偏移差异，build 已通过。

2026-10-06 T2/A2 继续批次：annotation metadata tooltip 的 anchor/viewport 几何投影、上方优先
与下方回退已迁移至 `src/main/browser-page-preload/annotation-tooltip-position.ts`；原 `Ss` 入口
保留兼容委托。新增 `scripts/test-preload-annotation-tooltip-position.mjs` 覆盖 3 项 focused
assertions；build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation marker position 的重复点分组、固定间距横向展开
与 viewport 边界 clamp 已迁移至 `src/main/browser-page-preload/annotation-marker-position.ts`；
原 `Ts` 入口保留兼容委托。新增 `scripts/test-preload-annotation-marker-position.mjs` 覆盖
3 项 focused assertions；build 与 marker focused test 已通过。

2026-10-06 T2/A2 继续批次：annotation design CSS helper（变更声明筛选、design-group
selector 转义、`!important` 规则生成与多规则拼接）已迁移至
`src/main/browser-page-preload/annotation-design-styles.ts`；原 `Cs`/`Es`/`Ds` 入口保留
兼容委托。新增 `scripts/test-preload-annotation-design-css.mjs` 覆盖 4 项断言；annotation
runtime 45 项、build 与 typecheck 已通过。

2026-10-06 T2/A2 继续批次：annotation design color normalization（hex/rgb/rgba 解析、
alpha 百分比、通道裁剪与大写输出）已从 preload business helper 抽取至
`src/main/browser-page-preload/annotation-color-policy.ts`；原 `ws` 入口保留兼容委托，
未知颜色文本仍原样返回。新增 `scripts/test-preload-annotation-color-policy.mjs` 覆盖 5 项
focused assertions；annotation runtime 45 项、build 与 typecheck 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `Pd`（内部 `jI`，源码 11830--11841）的联系人
recipient/cc/bcc 规范化纯策略已迁移至 `src/renderer/app-primary/runtime/normalize-recipient-contacts.ts`；
结构化联系人校验与 legacy 分隔字段回退解析均无 JSX、store 或生命周期副作用。新增
`scripts/test-app-primary-normalize-recipient-contacts.mjs` 覆盖 3 项 focused assertions；manifest
unreviewed 导出由 10928 降至 10927，focused test 与 typecheck 已通过。

2026-10-06 A5 继续批次：app-primary 导出 `$`（内部 `ogt`，源码 66291--66300）的项目搜索排序纯策略
已迁移至 `src/renderer/app-primary/runtime/rank-projects-by-query.ts`；该策略负责 query trim、最佳匹配
分数、零分过滤与稳定降序排序，通过注入 scorer 避免携带 hub 依赖。新增
`scripts/test-app-primary-rank-projects-by-query.mjs` 覆盖 3 项 focused assertions；build/typecheck
与 focused test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `mp`（内部 `rje`，源码 8227--8229）的 compact-window
布局分支纯判定已迁移至 `src/renderer/app-primary/runtime/is-compact-window-enabled.ts`；新增
`scripts/test-app-primary-is-compact-window-enabled.mjs` 覆盖 2 项 focused assertions，typecheck 与
focused test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `Tp`（内部 `VM`，源码 8072--8078）的 model
reasoning-effort 选择纯策略已迁移至 `src/renderer/app-primary/runtime/select-model-reasoning-efforts.ts`；
新增 focused test 2 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 审计登记：app-initial 零消费导出 `A0/M0/T0`（内部 `lTa/uTa/dTa`，源码 4916）
确认是订阅套餐状态转换的纯 mapper/predicate，但当前没有真实 renderer consumer，且契约由相邻
subscription/payment generated surface 持有；三项登记为 `preserved-coupled`，不伪造无消费 semantic facade。

2026-10-06 A5 继续批次：app-shared 未消费导出 `DJ`（内部 `GPe`，源码 45304--45306）的 queued
design-change 纯判定已迁移至 `src/renderer/app-shared/runtime/has-queued-design-change.ts`；新增
focused test 2 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-shared 未消费导出 `EY`（内部 `BNe`，源码 44783--44790）的 automation
update output envelope 纯识别策略已迁移至 `src/renderer/app-shared/runtime/is-automation-update-output.ts`；
新增 focused test 2 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-shared 未消费导出 `EX`（内部 `EMe`，源码 44304--44316）的 activity
status-to-color 纯映射已迁移至 `src/renderer/app-shared/runtime/status-to-color.ts`；新增 focused
test 3 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-shared 未消费导出 `wJ`（内部 `rFe`，源码 45373--45386）的 annotation
item projection 纯策略已迁移至 `src/renderer/app-shared/runtime/project-annotation-items.ts`；新增
focused test 2 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-shared 未消费导出 `yW`（内部 `Dze`，源码 47687--47689）的
case-insensitive object-key lookup 纯策略已迁移至 `src/renderer/app-shared/runtime/find-case-insensitive-key.ts`；
新增 focused test 2 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-shared 未消费导出 `wp`（内部 `jut`，源码 98909--98911）的 whitespace
token normalizer 已迁移至 `src/renderer/app-shared/runtime/split-whitespace-tokens.ts`；新增 focused
test 2 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-shared 未消费导出 `BL`（内部 `Eqe`，源码 51896--51898）的 strict
semantic-version validator 已迁移至 `src/renderer/app-shared/runtime/is-semver.ts`；新增 focused test
3 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-shared 未消费导出 `FK`（内部 `wIe`，源码 46069--46075）的 http(s)
URL 与 hostname allowlist 纯策略已迁移至 `src/renderer/app-shared/runtime/is-http-url.ts`；新增 focused
test 3 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-shared 未消费导出 `xU`（内部 `KBe`，源码 48497--48500）的 document
preview path 纯判定已迁移至 `src/renderer/app-shared/runtime/is-document-preview-path.ts`；新增
focused test 3 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-shared 未消费导出 `zG`（内部 `FLe`，源码 46598--46601）的 link
display-title 纯投影已迁移至 `src/renderer/app-shared/runtime/derive-link-display-title.ts`；新增
`scripts/test-app-shared-derive-link-display-title.mjs` 覆盖 2 项 focused assertions，typecheck 与
focused test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `ot`（内部 `b7`，源码 66215--66223）的 layout-motion
variant 纯投影已迁移至 `src/renderer/app-primary/runtime/derive-layout-motion-variant.ts`；新增 focused
test 2 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `wl`（内部 `ORe`，源码 18664--18673）的 local-thread
branch search preview 纯策略已迁移至 `src/renderer/app-primary/runtime/derive-branch-search-preview.ts`；
新增 focused test 2 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `ah`（内部 `Xke`，源码 4831--4833）的 handoff
return-target 选择纯策略已迁移至 `src/renderer/app-primary/runtime/select-handoff-return-target.ts`；
新增 focused test 2 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `br`（内部 `Nnt`，源码 49108--49110）的 manual
approval threshold fallback 纯策略已迁移至 `src/renderer/app-primary/runtime/resolve-manual-approval-threshold.ts`；
schema parse 通过注入隔离，新增 focused test 3 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `rm`（内部 `kj`，源码 7502--7504）的 connector ID
映射查找纯策略已迁移至 `src/renderer/app-primary/runtime/lookup-connector-id.ts`；新增 focused test
2 项断言，typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `um`（内部 `aj`，源码 6847--6855）的 keyboard
shortcut 文案纯策略已迁移至 `src/renderer/app-primary/runtime/format-keyboard-shortcut.ts`；新增
`scripts/test-app-primary-format-keyboard-shortcut.mjs` 覆盖 3 项 focused assertions，typecheck 与
focused test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `Sd`（内部 `nNe`，源码 11981--11983）的消息发送
完成判定纯策略已迁移至 `src/renderer/app-primary/runtime/is-sent-message.ts`；新增
`scripts/test-app-primary-is-sent-message.mjs` 覆盖 3 项 focused assertions，typecheck 与 focused
test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `gp`（内部 `ije`，源码 8230--8234）的 handoff
direction 选择纯策略已迁移至 `src/renderer/app-primary/runtime/select-handoff-direction.ts`；新增
`scripts/test-app-primary-select-handoff-direction.mjs` 覆盖 3 项 focused assertions，typecheck 与
focused test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `bp`（内部 `oje`，源码 8242--8244）的 handoff branch
资格纯策略已迁移至 `src/renderer/app-primary/runtime/should-use-handoff-branch.ts`；新增
`scripts/test-app-primary-should-use-handoff-branch.mjs` 覆盖 3 项 focused assertions，typecheck 与
focused test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `ff`（内部 `lMe`，源码 10801--10805）的 chatgpt/local
thread route identity 纯判定已迁移至 `src/renderer/app-primary/runtime/matches-thread-route.ts`；新增
`scripts/test-app-primary-matches-thread-route.mjs` 覆盖 3 项 focused assertions，typecheck 与 focused
test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `vt`（内部 `pmt`，源码 62417--62425）的文件输入
accept-pattern 展开纯策略已迁移至 `src/renderer/app-primary/runtime/resolve-accepted-file-extensions.ts`；
支持 dotted extension、MIME wildcard、exact MIME 与 `*/*` unrestricted 边界。新增
`scripts/test-app-primary-resolve-accepted-file-extensions.mjs` 覆盖 3 项 focused assertions，
typecheck 与 focused test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `oh`（内部 `qke`，源码 116452--116454）的 query
参数判定纯策略已迁移至 `src/renderer/app-primary/runtime/has-query-param-value.ts`；新增
`scripts/test-app-primary-has-query-param-value.mjs` 覆盖 3 项 focused assertions，typecheck 与
focused test 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `ui`（内部 `Y0`，源码 46040--46054）的 comment
attachment 分组纯策略已迁移至 `src/renderer/app-primary/runtime/partition-comment-attachments.ts`；
annotation/design-tweak/diff 分类通过注入 predicate 保持顺序且不携带 hub 生命周期。新增
`scripts/test-app-primary-partition-comment-attachments.mjs`，focused test 与 typecheck 已通过。

2026-10-06 A5 继续批次：app-primary 未消费导出 `yh`（内部 `jke`，源码 4509--4511）的 beacon/action
复合 key 纯格式化策略已迁移至 `src/renderer/app-primary/runtime/format-beacon-action-key.ts`；新增
`scripts/test-app-primary-format-beacon-action-key.mjs` 覆盖 2 项 focused assertions，typecheck 与
focused test 已通过。

2026-10-05 构建/启动回归修复：main-app transform-only 输出统一补齐 Node ESM 的 `.js` 相对导入，并将
`@chunk/*` 改写为实际 chunk 相对路径；bootstrap vendor 兼容导出改用稳定局部绑定，补回 preserved main
对 `bootstrap/protocol/app-protocol.js` 的历史路径 facade。已用临时独立 Electron profile 实测主窗口 frame
加载与 app-server `initialize_handshake_result` 均成功；`npm run build`、`verify`、`typecheck` 通过。

2026-10-06 A3 继续批次：IAB session boundary 补齐 `session_id` 请求别名归一化与空 session 拒绝；
`IabSessionRoute` 显式声明可选 `session_id`，新增 `scripts/test-main-iab-api-boundary.mjs` 两项
focused assertions（总计 7 项）。IAB 生命周期与真实 backend consumer 未扩张；build、focused test 与
typecheck 已通过。

2026-10-06 A3 继续批次：browser-session-registry 的 route capture/resolve/dispose、backend
ensure/move/dispose 与 page record lookup 状态组补齐 focused contract；新增
`scripts/test-main-browser-session-registry.mjs` 覆盖 17 项路由、幂等复用、迁移、页面 snapshot/torn-down/released 与清理断言。
真实 IAB backend 建立/pipe 生命周期未扩张；build、focused test 与 typecheck 已通过。

2026-10-06 A3 继续批次：`BrowserSessionRegistry` 增加可注入 `createBackend(sessionId)` 工厂；默认仍兼容 `api:null`，注入时保留 api/pipeDispose，ensure 幂等复用、move 迁移与 dispose 清理均有 17 项断言覆盖。该工厂为真实 native-pipe 接回留下明确依赖注入口，但不宣称 backend 生命周期已全部迁出。

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

2026-10-06 A5 继续批次：app-primary 未消费导出 `og`（内部 `yke`，源码 3939--3941）的 cloud/local
execution target 判定纯策略已迁移至 `src/renderer/app-primary/runtime/is-local-execution-target.ts`；
新增 `scripts/test-app-primary-is-local-execution-target.mjs` 覆盖 3 项 focused assertions，typecheck
与 focused test 已通过。

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
Git ignore policy 的 generation/read/refresh/recovery/dispose 状态机已抽取为
`src/main/worker/git-ignore-policy.ts` 并由 watcher 真实消费；旧 `Xye` 完整实现及专用 retry delay
常量已删除。37 项 lifecycle 断言覆盖并发 read、stale generation、失败退避、恢复通知与 dispose
barrier；watcher 的 session
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
main worker assembly 的 invocation sampler（原 `pst`，173,975-173,985）已迁移至
`src/main/main-app/worker/invocation-sampler.ts`；入口通过注入既有 rolling-window counter
实现保持 30 秒窗口、总调用数与显式时间戳语义，worker bus/telemetry 生命周期仍由入口持有，
由 `scripts/test-main-worker-invocation-sampler.mjs` 覆盖 4 项断言。
main window-services assembly 的 Dock icon preference flavor 策略已迁移至
`src/main/main-app/startup/startup-policy.ts` 的 `resolveDockIconPreference`；入口继续持有
nativeTheme、dock/nativeImage 与窗口图标更新副作用，由
`scripts/test-main-dock-icon-policy.mjs` 覆盖 5 项 flavor/default/fallback 断言。
main `xst` worker assembly 的 open-in `read-shortcut-link` 按路径缓存与结果投影已迁移至
`src/main/main-app/worker/shortcut-link-cache.ts`；入口继续注入 `shell.readShortcutLink` 并
持有 RPC 方法分派/生命周期，由 `scripts/test-main-shortcut-link-cache.mjs` 覆盖 4 项断言。
main tray startup 的 Windows dark/light icon 名称与 macOS template 名称策略（原 `bT/xT`）已迁移至
`src/main/main-app/startup/tray-icon-paths.ts`；入口继续持有路径探测、nativeImage 与 tray 生命周期，
由 `scripts/test-main-tray-icon-names.mjs` 覆盖 3 项断言。
main startup/window icon 的 build-flavor 到 icon base-name 映射（原 `ST`）已迁移至
`src/main/main-app/startup/icon-flavor-policy.ts`，窗口、托盘、metadata 与 icon preview 消费者
均已接回；路径探测和 nativeImage 副作用仍由入口持有，由
`scripts/test-main-icon-flavor-policy.mjs` 覆盖 6 项断言。
同一模块进一步接管原 `CT` 的 flavor-specific dark/light Codex asset filename 后缀，metadata
与 window-services consumer 使用 `resolveFlavorIconAssetNames`，focused suite 增至 9 项断言。
窗口服务中 Dev local-only outline 与其他 flavor packaged/local fallback 的候选 projection 已
接入 `resolveWindowIconResource`，路径存在性和 Electron icon 更新仍由 `dst` 持有，icon focused
suite 增至 12 项断言。
main worker manager 的 `ces-telemetry` HTTP request/response projection（原 `mst`）已迁移至
`src/main/main-app/worker/telemetry-request.ts`；入口继续持有 analytics gate、cancel map 与
worker 生命周期，由 `scripts/test-main-telemetry-request.mjs` 覆盖 4 项网络投影断言。
Sentry worker RPC transport 的 enabled/client/transport fallback（原 `hst.sendEnvelope`）已迁移至
`src/main/main-app/worker/sentry-envelope-transport.ts`；class 适配层和 worker 生命周期仍由入口
持有，由 `scripts/test-main-sentry-envelope-transport.mjs` 覆盖 4 项断言。
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
| A5 | renderer 三大 hub 内部 | app-shared 4.8MB / app-initial 14.3MB / app-primary 3.1MB | 已完成构成审计、消费契约审计与 manifest 门禁（现已纳入 `$` 生成别名） | 当前 `audit-renderer-hub-classification.mjs --strict` 为 0 unreviewed；未消费导出均已逐项分类，剩余语义化仍需按 owner 物理迁移 |

### B. 工程可读性缺口（5 处）

| # | 问题 | 现状 |
|---|---|---|
| B1 | tsconfig 吞 586 万行 transform-only 文件 | **已完成**：`exclude: ["src/webview/assets"]` 已生效，语义源码继续纳入 typecheck |
| B2 | 原版对照文件已迁出 | 10 个主进程原始 chunk 位于 `.reference/originals/main/`，`scripts/build.mjs` 映射回历史输出名并已通过 build/verify/smoke |
| B3 | README 过时 | **已完成**：README 记录 11 个主进程重写 chunk、1874 个 renderer chunks、双轨构建和验证入口 |
| B4 | 测试脚本无索引 | **已完成**：`scripts/test-index.md` 当前索引全部 1452 个 `scripts/test-*.mjs` 脚本；`npm run audit-test-index` 校验数量、缺失、失效与重复项 |
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
4. **测试索引（已完成）**：`scripts/test-*.mjs` 全部 1452 个脚本已登记至
   `scripts/test-index.md`，并按近期语义提取套件和现有套件分组；
   `npm run audit-test-index` 防止数量、缺失、失效或重复项回归。

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
2026-10-06 A5 逐段复核：app-shared 导出 `A`（source `cOt`，122146-122150）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `O`（source `uOt`，122177-122181）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `E`（source `fOt`，122208-122212）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `C`（source `mOt`，122235-122239）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `x`（source `gOt`，122266-122270）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `b`（source `vOt`，122297-122301）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `h`（source `SOt`，122359-122363）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `p`（source `wOt`，122390-122394）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `d`（source `EOt`，122421-122425）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `c`（source `AOt`，122483-122487）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `a`（source `MOt`，122510-122514）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `r`（source `POt`，122541-122545）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `t`（source `IOt`，122572-122576）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-shared 导出 `_`（source `bOt`，122328-122332）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A3 继续批次：IAB API 真实边界已补齐 constructor/options、`ping`、browser session route 校验（含 `session_id` 兼容字段）、request safe fields、metadata、host lookup、turn 记录/清理、tab lookup、route cleanup、WebMCP invocation route ownership/activity 标记与 native page event→tab 映射，并由 `scripts/test-main-iab-api-boundary.mjs` 覆盖 17 项断言；完整 CDP/tab/session 生命周期仍保留在类边界内，未伪拆成 facade。
2026-10-06 A5 逐段复核：app-shared 导出 `u`（source `OOt`，122452-122456）确认是 shared icon registry 的 memoized asset initializer；生成 SVG metadata 注册与 lazy asset 生命周期由 generated surface 持有，登记为 `preserved-coupled`。
2026-10-06 A3 继续批次：browser-session-registry 已补齐 route capture/resolve/dispose、按 conversationId 的 route lookup、backend ensure 幂等/迁移/销毁与 page record snapshot/torn-down/released cleanup 状态边界；`scripts/test-main-browser-session-registry.mjs` 覆盖 17 项断言。IAB/CDP/native-pipe 的完整生命周期仍保留在原类边界。
2026-10-06 A3 继续批次：native pipe server 补齐原始回调契约：`onWebMcpToolInvoked`、CDP event、CDP detach、page event 与 download change，并统一使用 IAB download listener Symbol；`scripts/test-main-native-pipe-server.mjs` 覆盖 WebMCP 回调、帧上限、四路发送、超大帧忽略、普通错误传播与两次 dispose 清理共 13 项断言。

2026-10-06 A1 T1 继续批次：Git watcher telemetry 的 host/root index-size bucket 选择已物理迁移至 `src/main/worker/git-watch-index-bucket-policy.ts`；兼容入口仅保留转出，watcher 集合与 telemetry 生命周期仍由运行时编排。新增 `scripts/test-worker-git-watch-index-bucket-policy.mjs` 覆盖 4 项 focused assertions。

2026-10-06 A1 T1 继续批次：Worktree 创建的 synced-branch setup 条件与 local branch ref 投影已统一迁移到 `resolveSyncedBranchSetup`；create runtime 仅保留 commit-tree 查询和 config 写入副作用。`scripts/test-worker-git-worktree-branch-setup-policy.mjs` 增加 2 项投影/跳过断言，原 10 项回归继续通过。

2026-10-06 A1 T1 继续批次：Worktree 创建的 resolved/configured local-environment path 优先级与空值投影已迁移至 `src/main/worker/git-worktree-environment-policy.ts`；create runtime 仍保留异步解析、Git config 写入和 setup 副作用。新增 `scripts/test-worker-git-worktree-environment-policy.mjs` 覆盖 4 项 focused assertions。

2026-10-06 A1 T1 继续批次：Worktree setup script 的 failed/error fallback 文案投影已迁移至 `src/main/worker/git-worktree-setup-policy.ts`；setup runtime 仍保留配置读取、脚本执行、日志与 shell-environment I/O。新增 `scripts/test-worker-git-worktree-setup-policy.mjs` 覆盖 5 项 focused assertions。

2026-10-06 A1 T1 继续批次：Setup 输出的 shell-environment remove/write 分支判定已迁移至 `src/main/worker/git-worktree-shell-environment-policy.ts`；runtime 仅保留持久化 I/O。新增 `scripts/test-worker-git-worktree-shell-environment-policy.mjs` 覆盖 4 项 focused assertions。

2026-10-06 T4 coverage audit：复核 `main-C-Mhak1n.ts` 175,890-176,978 启动装配区间；tray、computer-use/browser-use、app-server registry、plugin reconcile、窗口事件监听与 disposable ownership 交织，当前无可独立迁移且能证明副作用顺序不变的纯策略边界。已将证据与 `business-preserved` 结论写入 `docs/main-coverage-audit.md`，下一步需先建立单一服务构造/注册顺序 harness。

2026-10-06 T4 coverage audit：复核 `main-C-Mhak1n.ts` 172,420-175,889 worker/window 装配区间；窗口 Electron listeners 与 `bst/H9` Worker/MessageChannel、RPC session、error/exit、flush/dispose 生命周期交织。已有窄 predicates 已覆盖，其余无新的可证实纯策略边界；证据与 `business-preserved` 结论已写入 `docs/main-coverage-audit.md`，后续需先建立 worker spawn/dispose 顺序 harness。

2026-10-06 T4 coverage audit 校准：当前 `.reference/originals/main/main-C-Mhak1n.ts` 为 176,438 行（初始基线 176,978，已删除 540 行语义实现）；审计文档已明确历史区间仅作证据索引，后续必须按当前符号重新定位。仓库无独立 `audit-main-coverage` 命令，本轮不宣称额外覆盖完成。

2026-10-06 T4 回归证据：`test-main-startup-policy.mjs` 17 项、`test-main-immediate-update-exit.mjs` 4 项、`test-main-delayed-progress-window.mjs` 5 项通过；仅证明已迁出策略/时序模块，不改变剩余启动装配 business-preserved 结论。

2026-10-06 A1 T1 继续批次：Setup script 的 original/worktree workspace 环境变量覆盖构造已迁移至 `src/main/worker/git-worktree-setup-environment-policy.ts`；runtime 仅保留执行副作用。新增 `scripts/test-worker-git-worktree-setup-environment-policy.mjs` 覆盖 3 项 focused assertions。

2026-10-06 A1 T1 继续批次：Core Git RPC method 的 availability/create-branch/git-origins 白名单已迁移至 `src/main/worker/git-core-request-policy.ts`；dispatcher 仅保留参数编排与 Git I/O。新增 `scripts/test-worker-git-core-request-policy.mjs` 覆盖 4 项 focused classification assertions。

2026-10-06 A1 T1 继续批次：Node-only Git RPC method 白名单已迁移至 `src/main/worker/git-node-request-policy.ts`；dispatcher 仅保留 host、signal 与依赖注入。新增 `scripts/test-worker-git-node-request-policy.mjs` 覆盖 5 项 focused classification assertions。

2026-10-06 A1 T1 继续批次：Worktree snapshot read RPC 的 `worktree-snapshot-ref`/`managed-worktree-state` 方法白名单已迁移至 `src/main/worker/git-worktree-snapshot-read-policy.ts`；dispatcher 仅保留 snapshot 查询依赖。新增 `scripts/test-worker-git-worktree-snapshot-read-policy.mjs` 覆盖 3 项 focused classification assertions。

2026-10-06 A1 T1 继续批次：Worker entry control-message 分类（RPC、生命周期通知、request/cancel）已迁移至 `src/main/worker/entry-message-policy.ts`；entry dispatcher 仍负责 parentPort 回调副作用。新增 `scripts/test-worker-entry-message-policy.mjs` 覆盖 5 项 focused assertions。

2026-10-06 A1 T1 继续批次：Live-query shared wait 的 trace span/link 附加门禁已迁移至 `shouldAttachSharedTrace`；run runtime 仅保留 trace link 组装与异步执行。新增 `scripts/test-worker-git-live-query-trace-policy.mjs` 覆盖 4 项 focused assertions。

2026-10-06 A1 T1 继续批次：Live-query shared run 的最终 consumer abort 门禁已迁移至 `shouldAbortSharedRun`；runtime 仅负责 AbortController 副作用。新增 `scripts/test-worker-git-live-query-abort-policy.mjs` 覆盖 4 项 focused assertions。

2026-10-06 A1 T1 继续批次：Live-query shared run 的 aborted/reuse 判定已迁移至 `canReuseSharedRun`；runtime 仅负责 map 生命周期与异步执行。新增 `scripts/test-worker-git-live-query-reuse-policy.mjs` 覆盖 4 项 focused assertions。

2026-10-06 A1 T1 继续批次：Shell argument 的安全 token 判定已迁移为 `isShellSafeToken`；quote/join runtime 仅保留编码与拼接。新增 `scripts/test-worker-shell-safe-token.mjs` 覆盖 4 项 focused assertions。
2026-10-06 A5 逐段复核：app-primary 导出 `yd`（source `F3`，90189-90193）确认是生成 runtime lazy bootstrap，调用 O_e 初始化相邻依赖；bootstrap 顺序与 ownership 与 app-primary 生命周期耦合，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-primary 导出 `Cm`（source `ZA`，8966-8970）确认是 generated renderer lazy bootstrap，按顺序初始化 YA、renderer/style/routing/context 依赖并捕获 React runtime；注册顺序与 renderer ownership 耦合 app-primary 生命周期，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-primary public 导出 `Dr`（source `e4`，82694-82698；bundle 内部局部名 `yb`）确认是 generated lazy SVG component initializer，调用 Ni 并捕获 Q2 React runtime 后渲染 icon surface；renderer bootstrap 与 component ownership 耦合 app-primary 生命周期，登记为 `preserved-coupled`。
2026-10-06 A5 逐段复核：app-primary 导出 `xm`（source `ej`，8972-8976）确认是 generated lazy SVG icon initializer，经 Ni 初始化并捕获 Q2 React runtime 后渲染图标组件；renderer bootstrap 与 component ownership 耦合 app-primary 生命周期，登记为 `preserved-coupled`。
2026-10-06 A5 继续批次：app-shared 未消费导出 `xU`（内部 `KBe`，源码 48497--48500）的 document
preview path 纯判定已迁移至 `src/renderer/app-shared/runtime/is-document-preview-path.ts`；新增
focused test 3 项断言，typecheck 与 focused test 已通过。manifest unreviewed 导出当前为 10964。

2026-10-06 A2 继续批次：preload 未消费导出 `rd` 的顶层 `html/body` annotation anchor root 判定已迁移至
`src/main/browser-page-preload/annotation-anchor-root-policy.ts`；新增 focused test 3 项断言，build/typecheck
与 focused test 已通过。

2026-10-06 manifest 复核：逐项核对 `src/main/worker` 中未在审计表逐名出现的入口；均已有对应 policy/dispatch 或生命周期测试，`shell-quoting`/`open-target-path` 为已接回原 worker 的窄入口。未发现新的未消费 business helper，本轮不新增 facade。

2026-10-06 T4 复核：WindowManager 的 `isHotkeyWindowThread`/`isAvatarOverlayWindow`/`shouldSyncPersistedAtom` 虽为候选纯判定，但依赖私有 appearance map、BrowserWindow lookup 与同类 message fan-out；当前无可接回的可读 WindowManager owner。已在 main coverage audit 登记，暂不制造 facade。

2026-10-06 worker/main consumer 复核：确认当前 bundle 的 entry-dispatcher、snapshot-read、core/node request dispatch、shell quoting 与 open-target policy 均有真实 `worker.ts` require 接回；live-query run 与 host-handoff progress 由对应 runtime 消费且有回归。未发现未消费 helper，本轮无新增 facade。

2026-10-06 worker audit blocker evidence：复核原 worker 48,152-49,999 SQLite schema（当前真实 owner 为 `main-app/thread-catalog/store.ts`）与 53,200-53,477 connector/browser-auth/MCP Zod schema（当前无 worker request consumer）；两段均不能安全另建 worker facade，已在 `docs/git-worker-audit.md` 登记 `preserved-coupled` 理由。
2026-10-06 worker platform boundary 复核：确认 `worker.ts:110` git-local-environment、`:130` shell-config、`:136` platform-env 均为真实窄入口且有 focused regression；55,351-56,420 与 86,131-90,660 仍耦合平台副作用和 watcher 生命周期，未发现新的可独立纯策略边界，本轮不重复拆 facade。
2026-10-06 worker lifecycle/transport 复核：84,080-85,965 的 entry-dispatcher 仅投影 sentry-user-update、flush、analytics 与 request/cancel 分类；Sentry/analytics flush、request registry 和 parentPort 响应仍共享 dispose/flush 顺序与线程生命周期。entry-dispatcher focused 8 项通过，暂无安全独立 policy 边界。
2026-10-06 worker protocol-schema owner 复核：38,230-43,985 的 deep-link/browser-tab/runtime-bundle schema 与 53,200-53,477 的 connector/MCP schema 当前均无 worker request consumer；`browser_auth_challenge_id` 实际由 `src/main/shared/elicitation-protocol.ts` 消费。复制 schema 会制造未接回 facade，本轮继续保留原始边界。
2026-10-06 worker command registry owner 复核：61,151-63,050 的 command/shortcut/browser command 定义实际由 `src/main/shared/command-registry.ts` 持有，policy 由 shared command-registry/command-capability 模块消费；worker 无对应 request handler。复制完整 registry 会破坏 shared command identity，本轮不新增 worker facade。
2026-10-06 worker GitHub/review owner 复核：81,000-83,323 已由 `git-node-request-dispatch` 的 `github-request`、`git-review-read-dispatch` 及 GitHub board/revision/summary 模块真实消费；剩余逻辑绑定 host、Git manager、API/CLI、副作用与响应包装，未发现可脱离 owner 的新纯策略边界。
2026-10-06 A1 worker 增量：Git root resolution 的 non-repository stderr 分类已迁移至 `git-root-resolution-policy.ts`；runtime 继续负责 local stat、rev-parse、Git unavailable/error logging 与 common-dir resolution，新增 3 项 focused assertions，build/typecheck 通过。
2026-10-06 worker host assembly owner 复核：83,636-84,079 的 factory/API assembly 由 `git-worktree-request-handlers`、`git-worktree-handoff-dispatch` 等直接注入 `createExecutionHost`，并共享 host identity、main RPC、Git manager 与 handoff/ignore-source watch 生命周期；`git-ignore-source-watch` 已有独立 reconciliation policy，factory 本身暂无安全纯构造边界。
2026-10-06 worker state/schema owner 复核：48,152-49,999 的 `local_thread_catalog_hosts` 由 `main-app/thread-catalog/store.ts` 持有 INSERT/SELECT/DELETE；automation `rrule` 默认值与调度由 shared automation settings/registry 和 main automations 消费。worker 另建 state facade 会重复 owner 并分裂 schema/migration 版本，本轮继续 preserved-coupled。
2026-10-06 worker git-cat-file residual owner 复核：OID/content/error/disk/batch-error 纯策略已有 `git-cat-file-*policy.ts` 接回；剩余 batch parser、stream/disk read 与 retry 共享 byte limits、review snapshot、host I/O 和失败顺序，暂无新的安全纯边界。
2026-10-06 worker read/working-tree residual owner 复核：git-read-request-handlers 仅注入 cwd/root、Git manager、host、abort signal；working-tree metadata 剩余实现共享 review snapshot、临时目录、Git diff、并发 worker 与 merge 顺序，已有 policy 覆盖纯投影，本轮无新 policy。
2026-10-06 A1 worker 增量：watcher discovered path stale/new 集合分区已迁移至 `src/main/worker/git-watch-path-partition-policy.ts`；`git-watch-paths.ts` 继续持有 session/dispose/注册副作用，新增 2 项 focused assertions，build/typecheck 通过。
2026-10-06 A1 worker 增量：worktree copy 的 NUL-separated path 投影已迁移至 `git-worktree-copy-path-policy.ts`；copy-files 继续持有 stat、symlink guard、copy 与 cleanup 副作用，新增 1 项 focused assertion，build/typecheck 通过。
2026-10-06 A1 worker 增量：agent override path 的 Git `ls-files -z` 过滤已迁移至 `git-worktree-copy-policy.ts`；入口继续负责 Git I/O、失败处理与 copy 生命周期，新增 1 项 focused assertion，build/typecheck 通过。
2026-10-06 A1 worker 增量：`.worktreeinclude` ignored/included path 交集与稳定去重已接入 `git-worktree-copy-policy.ts`；入口继续负责双 Git 查询、存在性检查与 copy 生命周期，focused assertions 增至 2 项，build/typecheck 通过。
2026-10-06 A1 worker 增量：watcher optional repository-state 的 tri-state boolean aggregation 已迁移至 `git-watch-boolean-policy.ts`；入口继续持有 watcher 状态、timer 与 recovery 副作用，新增 3 项 focused assertions，build/typecheck 通过。
2026-10-06 A1 worker residual owner 复核：`createGitOperationState` 还组合 rebase head/merge/apply 三类 marker，并与 watch refresh action 共用 tri-state 结果，不是独立字段投影，继续由 `git-watch-paths.ts` 持有。
2026-10-06 A1 worker residual owner 复核：watch path 的 operation marker、affected working-tree path 与 metadata refresh selection 依赖 platform path API、Git dir topology 和 watcher handler state，暂无不复制生命周期的更窄边界。
2026-10-06 A1 worker residual owner 复核：git-turn-diff-capture 的 status/abort/error 与 envelope 判定已有 capture/status policy；剩余实现共享 review snapshot generation、Git diff、abort signal、telemetry 与 response completion 顺序，无新独立纯边界。
2026-10-06 A1 worker residual owner 复核：branch search runtime 的 queryGitBranchRefs 绑定 query cache、Git host、abort signal 与异步 ref 扫描；cache handlers 直接执行 metadata/read-cache invalidation 副作用，无新纯策略边界。
2026-10-06 A1 worker residual owner 复核：repository-read/review request handlers 已是窄 consumer；剩余分别绑定 repository availability、read cache、review snapshot、abort/performance envelope 与 response wrapping，无可脱离 request lifecycle 的新 policy。
2026-10-06 A1 worker residual owner 复核：review metadata utils/diff/commit queries 已分别承载 rename/untracked reconciliation、metadata diff parsing 与 commit line-count/branch query；剩余 fetch/query 绑定 review snapshot、Git 命令、并发与 abort，无新独立纯边界。
2026-10-06 A1 worker residual owner 复核：review comparison 的 merge-conflict path 与 empty-untracked 查询绑定 repository root、Git host、snapshot/query cache 与失败包装，继续由 comparison owner 保留。
2026-10-06 A1 worker residual owner 复核：review patch/diffs 的 tracked diff cache、rename fallback、snapshot generation 与 worktree file enumeration 已有 policy/utility；剩余 fetch/list 共享 Git I/O、stability retry、stat 与 query cache，无新独立纯边界。
2026-10-06 A1 worker residual owner 复核：review commit queries 的 branch commit listing/line-count 依赖 repository query client、Git result、review snapshot、abort signal；字段 projection 已由 request consumer 覆盖，不拆 query owner。
2026-10-06 A1 worker 增量：worktree starting-ref 的 local ref 规范化与 remote candidate 枚举已迁移至 `git-worktree-starting-ref-policy.ts`；runtime 继续负责 upstream/remote 查询、fetch、compare、resolve 副作用，新增 3 项 focused assertions，build/typecheck 通过。
2026-10-06 A1 worker 增量：worktree porcelain list 记录解析已迁移至 `git-worktree-list-policy.ts`；runtime 继续负责 Git 命令、query cache、错误处理，新增 3 项 focused assertions，build/typecheck 通过。
2026-10-06 A1 worker 增量：worktree resolution 的 comparison-root 规范化与 managed-root containment 判定已迁移至 `git-worktree-resolution-policy.ts`；runtime 继续负责 metadata、owner fallback、排序与 dirty-state 查询，新增 4 项 focused assertions，build/typecheck 通过。
2026-10-06 A1 worker 增量：blame repository web URL 的 GitHub host gate 已迁移至现有 `git-blame-file-policy.ts`；runtime 继续负责 origin 查询、remote parsing 与 URL 组装，focused assertions 增加 3 项 host 断言，build/typecheck 通过。
2026-10-06 A1 worker residual owner 复核：git-diff-text 的 quoting/escape、header path projection 与 rename rewrite 共享 UTF-8/octal 解码、header classification、path prefix 与 rewrite 顺序，未发现不制造 facade 的独立 business policy，继续由 parser owner 持有。
2026-10-06 A1 worker residual owner 复核：git-path-resolution 的 git-dir/git-path/shared-index 查询绑定 query cache、Git rev-parse、host path API、index fingerprint 与 fallback 顺序，未发现可脱离 path-resolution owner 的纯策略边界。
2026-10-06 A1 worker residual owner 复核：review section changes 的 gitlink cleanliness、repository lookup、review diff/apply-patch、cache invalidation 与 partial-apply error contract 共享 target host、Git 状态查询及副作用顺序；现有 section policy 已覆盖路径/error projection，剩余 orchestration 继续由 owner 持有。
2026-10-06 A1 worker residual owner 复核：review metadata utils 的 rename reconciliation 同时更新 raw entries/files/stats，依赖 deleted-entry OID 唯一匹配、untracked path set 与 rename 覆盖顺序，继续由 metadata utility owner 持有。
2026-10-06 A1 worker residual owner 复核：review metadata diff 的 rename inference、raw numstat/status 解析与 metadata finalization 共享 Git diff 输出、path quoting、rename threshold 与 snapshot ordering，继续由同一 diff owner 持有。
2026-10-06 A1 worker residual owner 复核：review file diff 的 blob/working-tree/symlink/untracked 分支共享 repository snapshot、host stat、binary/text detection、abort signal 与 response envelope，fallback 顺序影响最终 diff kind，继续由 file-diff owner 持有。
2026-10-06 A1 worker residual owner 复核：review comparison 的 merge-base/merge-conflict、empty-untracked 与 snapshot comparison 共享 repository root、Git host、query cache、failure envelope 与 ordering；path projection 已由 comparison policy 覆盖，剩余查询编排继续由 owner 持有。
2026-10-06 A1 worker residual owner 复核：review patch 的 tracked diff cache、rename fallback、snapshot generation 与 worktree file enumeration 共享 Git I/O、stability retry、stat/cache invalidation 与 response completion 顺序，现有 patch policy 已覆盖 projection，剩余 fetch/list 保持原 owner。
2026-10-06 A1 worker residual owner 复核：review commit queries 的 branch commit listing 与 line-count 共享 repository query client、Git command result、review snapshot、abort signal 与 response projection；字段投影已有 request consumer 覆盖，剩余 query orchestration 不形成独立纯策略。
2026-10-06 A1 worker residual owner 复核：working-tree metadata 的 mergeMetadataMaps 虽为 Map 合并，但覆盖顺序由 tracked/untracked 批次、并发 worker 与 rename reconciliation 决定，继续由 metadata owner 持有。
2026-10-06 A1 worker residual owner 复核：git-worktree-files runtime 已将 NUL/status/pathspec/index fingerprint/missing-file 判定交给 policy；剩余 Git 命令、stat、stability retry、fallback 仍是单一 runtime owner，无新增 policy。
2026-10-06 A1 worker residual owner 复核：`resolveWorktreeLocalEnvironmentConfig` 跨 source/target host stat、Git tracking/ignore、symlink guard、copy 与 fallback 顺序，继续保留为 I/O owner，暂无可安全独立 policy。
2026-10-06 WSL command owner 复核：47,122-47,584 的纯输出/argv 已由 `platform-wsl.ts` 覆盖并有 focused regression；剩余 `wslpath`/`wsl.exe --status|--list` 仍绑定 Windows command spawn、日志和错误处理，没有可脱离 exec owner 的新策略。
2026-10-06 worker entry protocol 复核：90,661-90,836 的 workerData/parentPort 校验、main-RPC 初始化及 worker-request/request-cancel/flush-and-exit message loop 仍由入口持有；entry-dispatcher 与 core/node/snapshot/live-query dispatch 已有回归，移出入口会改变线程启动或 flush/exit 顺序，本轮不拆分。
2026-10-06 Git manager/watch/request owner 复核：65,200-80,999 已由 repository model、git-watch/live-query lifecycle 与 request handlers/dispatch 分担真实 owner；剩余 memoization、timer、abort、trace 状态跨越多个 consumer，没有新的单一纯策略边界，不重复制造 manager facade。
2026-10-06 worker telemetry owner 复核：63,051-65,199 的 Git command telemetry/error normalization 已由 `git-observability.ts` 接回；OpenTelemetry/Sentry/Datadog SDK 仍由基础设施与 lifecycle owner 管理，新增 worker policy 会重复 SDK 生命周期，本轮不拆。
2026-10-06 execution/computer-use adapter owner 复核：84,549-85,965 的 execution host 由 worktree/handoff handlers 注入，capture continuation 纯判断已在 `computer-use-capture-policy.ts`；入口仍持有 service、日志、事件与递归副作用，暂无独立新策略边界。
2026-10-06 A3 main 增量：global shortcut validation 已迁移至 `src/main/main-app/hotkey/global-shortcut-policy.ts`；原 `global-shortcut.ts` 保留 Electron globalShortcut/native helper/权限与挂起恢复副作用，新增 6 项 focused assertions，build/typecheck 通过。
2026-10-06 A3 main 增量：global shortcut mac layout remap 已接入同一 `global-shortcut-policy.ts`；`updateMacKeyboardLayout` 保留布局状态、全量重注册与失败回滚副作用，新增 3 项 focused assertions，build/typecheck 通过。
2026-10-06 A3 main 增量：dictation release-watch 平台可用性判定已接入 `global-shortcut-policy.ts`；入口仍保留 native helper/PowerShell spawn、release callback 与 dispose 副作用，policy focused assertions 增至 12 项，build/typecheck 通过。
2026-10-06 A3 main 增量：mac modifier helper-name projection 已接入 `global-shortcut-policy.ts`；release watcher 仍保留 helper 进程创建/释放副作用，policy focused assertions 增至 14 项，build/typecheck 通过。
2026-10-06 A3 main 增量：win32 modifier VK 分组投影已接入 `global-shortcut-policy.ts`；入口仍负责 PowerShell spawn、输出解析与 release/dispose，policy focused assertions 增至 16 项，build/typecheck 通过。
2026-10-06 A3 main 增量：accelerator 空白/连字符/下划线/大小写规范化已接入 `global-shortcut-policy.ts`；入口继续复用该结果进行 bare/unsupported 判定，policy focused assertions 增至 17 项，build/typecheck 通过。
2026-10-06 A3 main 增量：accelerator token 分割（trim 与空段过滤）已接入 `global-shortcut-policy.ts`；入口继续复用分割结果做快捷键校验，policy focused assertions 增至 18 项，build/typecheck 通过。
2026-10-06 A3 main 增量：bare/unsupported accelerator 分流判定已接入 `global-shortcut-policy.ts`；入口仍负责注册分支与 helper 生命周期，policy focused assertions 增至 20 项，build/typecheck 通过。
2026-10-06 A3 main 增量：bare-modifier platform gate 已接入 `global-shortcut-policy.ts`；入口继续负责 helper 注册与权限请求，policy focused assertions 增至 22 项，build/typecheck 通过。
2026-10-06 A3 main 增量：registration accelerator 的 platform/layout gate 已接入 `global-shortcut-policy.ts`；入口继续负责 Electron 注册与失败回滚，policy focused assertions 增至 24 项，build/typecheck 通过。
2026-10-06 A3 main coverage 复核：browser-sidebar/error-pages 同时耦合附件 WeakMap suspend/resume、WebContents session.fetch/abort、annotation snapshot、i18n 与 interstitial HTML；错误抑制/URL/文案纯判定无法脱离同一 owner 安全接回，本轮不拆 facade。
2026-10-06 A3 main 增量：browser-use origin 规范化已迁移至 `src/main/main-app/browser-use/origin-policy.ts`；`origin-state.ts` 保留 config.toml 读写、规则更新与日志副作用，新增 4 项 focused assertions，build/typecheck 通过。
2026-10-06 A3 main 增量：browser-use rule input 的 trim/类型过滤/稳定去重已接入 `origin-policy.ts`；origin-state 继续持有配置与规则副作用，focused assertions 增至 5 项，build/typecheck 通过。
2026-10-06 A3 main 增量：browser-use allowed/denied rule kind 互换已接入 `origin-policy.ts`；origin-state 继续持有规则更新副作用，focused assertions 增至 7 项，build/typecheck 通过。
2026-10-06 A3 main 增量：browser-use config path 的 home/filename 组合已接入 `origin-policy.ts`；origin-state 继续持有文件 I/O、TOML 解析与写回副作用，focused assertions 增至 8 项，build/typecheck 通过。
2026-10-06 A3 main 增量：TOML 解析结果的 plain-object 形状判定已接入 `origin-policy.ts`；origin-state 继续持有解析失败日志与状态写回，focused assertions 增至 10 项，build/typecheck 通过。
2026-10-06 A3 main 增量：browser-use approval/history mode 的 config↔desktop/TOML 映射已接入 `origin-policy.ts`；origin-state 继续持有配置加载、更新与持久化副作用，focused assertions 增至 15 项，build/typecheck 通过。
2026-10-06 A3 main 增量：browser-use rule section 的 kind-set 读取与稳定去重已接入 `origin-policy.ts`；origin-state 继续持有 rule decision 与写回副作用，focused assertions 增至 16 项，build/typecheck 通过。
2026-10-06 A3 main 增量：browser-use rule membership 判定已接入 `origin-policy.ts`；origin-state 继续负责 denied 优先的 decision 组合，focused assertions 增至 18 项，build/typecheck 通过。
2026-10-06 A3 main 增量：browser-use denied-over-allowed rule decision 组合已接入 `origin-policy.ts`；origin-state 继续负责 resource section 选择与批量更新副作用，focused assertions 增至 20 项，build/typecheck 通过。
2026-10-06 A3 main 增量：browser-use add 前 origin 的精确匹配优先/规范化/非法输入拒绝已接入 `origin-policy.ts`；origin-state 继续负责 resource section 选择与规则写回，focused assertions 增至 22 项，build/typecheck 通过。
2026-10-06 A3 main 增量：browser-use origin resource→TOML section key 映射已接入 `origin-policy.ts`；origin-state 继续负责 config 访问与规则更新，focused assertions 增至 23 项，build/typecheck 通过。
2026-10-06 A3 main 增量：browser-use transfer approval key 映射与 global persistent approval enterprise gate 已接入 `origin-policy.ts`；origin-state 继续持有异步配置/策略检查副作用，focused assertions 增至 25 项，build/typecheck 通过。
2026-10-06 A3 main coverage 复核：origin-state 剩余 `applyRuleUpdate`/`computeRuleUpdates` 直接 mutate config，依赖 denied/allowed decision、remote update 顺序和 resource section；`projectOriginState` 组合多 section/approval/enterprise settings，暂无不改变 mutation 顺序的更小纯边界。
2026-10-06 A3 main coverage 复核：global shortcut 相邻 avatar-overlay/geometry、tray 与窗口辅助模块已是独立 consumer；剩余函数依赖 Electron screen/BrowserWindow/display 状态或共享生命周期，未发现更小且安全的新纯边界，本轮不制造 facade。
2026-10-06 T2/A2 继续批次：annotation element visibility 的 ancestor style gate 与 optional `checkVisibility` 已迁移至 `src/main/browser-page-preload/annotation-element-visibility-policy.ts`；原 `_d` 入口保留兼容委托，新增 3 项 focused assertions，build 与 typecheck 已通过。
2026-10-06 T2/A2 继续批次：annotation fixed/sticky ancestor 判定已迁移至 `src/main/browser-page-preload/annotation-fixed-position-policy.ts`；原 `Ac` 入口保留兼容委托，新增 4 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation element metadata attribute projection 已迁移至 `src/main/browser-page-preload/annotation-element-metadata-attributes.ts`；原 `od` 入口保留 eligibility/attribute parser 注入，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation frame offset 递归 projection 已迁移至 `src/main/browser-page-preload/annotation-frame-offset-policy.ts`；原 `Ic` 入口保留 frame/rect 适配，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation element-like 跨 realm DOM 判定已迁移至 `src/main/browser-page-preload/annotation-element-like-policy.ts`；原 `F` 入口保留 constructor/node type 注入，新增 4 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation iframe element 跨 realm 判定已迁移至 `src/main/browser-page-preload/annotation-iframe-element-policy.ts`；原 `ac` 入口保留 constructor/fallback 语义，新增 4 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation iframe contentWindow/document boundary 已迁移至 `src/main/browser-page-preload/annotation-iframe-window-policy.ts`；原 `sc` 入口保留异常与空 document 拒绝，新增 4 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation clipping overflow boundary 已迁移至 `src/main/browser-page-preload/annotation-clipping-boundary-policy.ts`；原 `Kc` 入口保留 computed style/overflow 注入，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation shadow-root boundary 判定已迁移至 `src/main/browser-page-preload/annotation-shadow-root-policy.ts`；原 `Uc` 入口保留 node type/element 注入，新增 4 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation unique selector match 已迁移至 `src/main/browser-page-preload/annotation-unique-selector-policy.ts`；原 `Wc` 入口保留 root/query 注入，新增 4 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation queryable root 判定已迁移至 `src/main/browser-page-preload/annotation-queryable-root-policy.ts`；原 `Gc` 入口保留 node type 语义，新增 4 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation document access boundary 已迁移至 `src/main/browser-page-preload/annotation-document-access-policy.ts`；原 `oc` 入口保留异常返回 null，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation frame element resolver 已迁移至 `src/main/browser-page-preload/annotation-frame-element-resolver.ts`；原 `Tc` 入口保留 selector/iframe 校验，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation frame document resolver 已迁移至 `src/main/browser-page-preload/annotation-frame-document-resolver.ts`；原 `Dc` 入口保留 window path 注入，新增 2 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation frame path projection 已迁移至 `src/main/browser-page-preload/annotation-frame-path-projection.ts`；原 `ec` 入口保留 iframe/selector/owner window 语义，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation text normalization projection 已迁移至 `src/main/browser-page-preload/annotation-text-normalization.ts`；原 `Vl` 入口保留 whitespace/trim/2000 cap，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation range viewport intersection 已迁移至 `src/main/browser-page-preload/annotation-range-viewport-intersection.ts`；原 `Kl` 入口保留 Range/rect 适配，新增 2 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation visible-text element policy 已迁移至 `src/main/browser-page-preload/annotation-visible-text-element-policy.ts`；原 `Wl` 入口保留 excluded ancestor/style gate，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation active text input eligibility 已真实接回 `annotation-input-target.ts`；原 `Hl` 入口保留 owner window/type gate，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：visible-text document access 已真实复用 `annotation-document-access-policy.ts`；原 `Ul` 入口保留跨源异常 null 语义，新增 2 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation owner-window policy 已迁移至 `annotation-owner-window-policy.ts`；原 `Gl` 入口保留 ownerDocument/fallback 选择，新增 2 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation rect intersection policy 已迁移至 `annotation-rect-intersection-policy.ts`；原 `L` 入口保留边界相交语义，新增 2 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation HTML element policy 已迁移至 `annotation-html-element-policy.ts`；原 `I` 入口保留跨 realm HTMLElement 判定，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation range text length projection 已迁移至 `annotation-range-text-length.ts`；原 `ru` 入口保留 Range 异常 null 语义，新增 2 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation text offset projection 已迁移至 `annotation-text-offset-projection.ts`；原 `iu` 入口保留 TreeWalker offset 边界，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation highlight context policy 已迁移至 `annotation-highlight-context-policy.ts`；原 `Ql` 入口保留 style root/owner window/capability gate，新增 2 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation client rect projection 已迁移至 `annotation-client-rect-projection.ts`；原 `Vu` 入口保留 1000 rect cap/零尺寸过滤，新增 2 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation text security policy 已迁移至 `annotation-text-security-policy.ts`；原 `Bu` 入口保留 masked-text 判定，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation shadow-host policy 已迁移至 `annotation-shadow-host-policy.ts`；原 `Lu`/`Iu` 入口保留宽松 host eligibility/projection，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation range fixed-position policy 已迁移至 `annotation-range-fixed-position-policy.ts`；原 `Ru` 入口保留 text/shadow host ancestor 判定，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation transform policy 已迁移至 `annotation-transform-policy.ts`；原 `Wu` 入口保留 matrix/rotate/shadow host 判定，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation rect clip intersection 已迁移至 `annotation-rect-clip-intersection.ts`；原 `Gu` 入口保留边界接触 null 语义，新增 2 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation control default value projection 已迁移至 `annotation-control-default-value.ts`；原 `tf` 入口保留类型默认值语义，新增 5 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation sidebar editor transition 已迁移至 `annotation-sidebar-editor-transition.ts`；原 `Lf` 入口保留 editor message reducer 语义，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation sidebar target containment 已迁移至 `annotation-sidebar-target-policy.ts`；原 `Of` 入口保留 root/shadow root 判定，新增 3 项 focused assertions。
2026-10-06 A2 runtime owner 复核：`annotation-runtime.ts` 仅聚合既有策略/target/parser 导出；`annotation-preload-runtime.ts`、surface/overlay/pointer-selection runtime 均绑定 DOM listener、observer、IPC 或 dispose 生命周期。未发现可脱离 owner 的新纯 policy，本轮不重复制造 facade。
2026-10-06 A2 runtime owner 复核补充：`annotation-surface-geometry.ts`、`annotation-selection-display-key.ts` 等 geometry/display policy 已是独立模块并由 surface/selection runtime 消费；runtime owner 剩余部分均为副作用编排，未发现新增可读纯边界。
2026-10-06 A2 audit owner evidence：preload audit 27187-27503 的 extension distribution 与 deployment channel 已分别由 `extension-distribution.ts`、`deployment-channel.ts` 真实 require 接回；剩余 22291-26794/26795-26881 UI/overlay 与 frame prerequisites 由 overlay/runtime owners 消费并绑定 observer/RAF/DOM 副作用，未新增可脱离 owner 的纯 policy。
2026-10-06 A2 WebMCP owner evidence：preload audit 27295-27470/30084-30217 的 registry、descriptor byte-size/schema 与 protocol startup 已分别由 `webmcp-registry.ts`、`webmcp-descriptor.ts`、`webmcp-protocol.ts` 真实消费；剩余逻辑绑定 secure-context、contextBridge、AbortSignal 与 pagehide 生命周期，不再重复抽 facade。
2026-10-06 A2 extension owner evidence：`scripts/test-preload-extension-distribution.mjs`、`test-preload-deployment-channel.mjs` 已登记于 `scripts/test-index.md`，并直接 require `extension-distribution.ts`/`deployment-channel.ts`；该区段已有真实 consumer 与 focused regression，无未覆盖纯策略。
2026-10-06 A2 annotation UI owner evidence：22291-26794 区段对应的 overlay/surface/pointer/preview/draft/design modules 均已有 `scripts/test-index.md` focused entries（含 observer/runtime/state/policy）；26795-26881 frame/anchor prerequisites 已由 `annotation-anchor-geometry.ts`、`annotation-preload-runtime.ts` 消费，剩余部分绑定 RAF/MutationObserver/DOM style 生命周期，无未覆盖可独立纯策略。
2026-10-06 A2 protocol owner evidence：30084-30217 WebMCP descriptor/startup 区段已由 `webmcp-descriptor.ts`/`webmcp-protocol.ts` 与 preload startup owner 消费，并有 descriptor/registry/protocol regression；`contextBridge`、secure-context、pagehide 与 zoom/startup 顺序均是不可脱离生命周期边界。
2026-10-06 A2 coverage verification：重新运行 `test-preload-extension-distribution.mjs`（5 assertions）、`test-preload-deployment-channel.mjs`（8 assertions）与 `test-preload-webmcp-descriptor.mjs`（5 assertions）均通过；对应未完成 audit 区段已有可核验 consumer/test 覆盖。
2026-10-06 A2 coverage verification follow-up：重新运行 `test-preload-webmcp-registry.mjs`（9 assertions）与 `test-preload-webmcp-descriptor.mjs`（5 assertions），并复跑 extension-distribution（5）/deployment-channel（8）回归均通过；27295-27470/30084-30217 已有真实 consumer 与 focused test，剩余逻辑绑定 secure-context、contextBridge、AbortSignal、pagehide 与 startup 顺序，无新增可安全脱离 owner 的纯策略。
2026-10-06 A2 WebMCP protocol owner coverage：新增 `scripts/test-preload-webmcp-protocol.mjs`，覆盖 secure-context/policy enabled gate 通过后的 contextBridge expose、初始 page event 与 pageshow/pagehide listener 注册（4 assertions）；协议刷新、AbortSignal、contextBridge 与 page lifecycle 仍由 `webmcp-protocol.ts` owner 持有，不拆纯 facade。
2026-10-06 A2 runtime coverage verification：重新运行 `test-preload-annotation-overlay-runtime.mjs`（48 assertions）、`test-preload-annotation-surface-observer.mjs`（14 assertions）与 `test-preload-annotation-pointer-selection.mjs`（18 assertions）均通过；对应 runtime owner 区段已有 focused coverage，无新增可脱离纯 policy。
2026-10-06 A2 controls coverage verification：重新运行 `test-preload-annotation-controls-registry.mjs`（10 assertions）与 `test-preload-pending-editor-message.mjs`（6 assertions）均通过；7260-7553 controls registry/pending reducer 区段已有真实 consumer 与 focused coverage。
2026-10-06 A2 browser input owner coverage：重新运行 `test-browser-page-preload-browser-input-bridge.mjs`（22 assertions）通过；26882-27185 的 trusted mouse-navigation/image-drag bridge 已由 `browser-input-bridge.ts` 真实接回，事件监听与 host IPC 顺序仍绑定 preload lifecycle，无新增可脱离 owner 的纯 policy。
2026-10-06 A2 document/context owner coverage：重新运行 `test-preload-annotation-document-context.mjs`（14 assertions）、`test-preload-google-docs-context.mjs`（9）、`test-preload-annotation-protocol.mjs`（6）与 `test-preload-annotation-control-payload.mjs`（20）均通过；5120-7259 的 document/Google Docs/schema/payload 边界已有真实 consumer 与 focused regression，剩余跨 frame/DOM/IPC 语义继续由原 owner 持有，未发现新可脱离纯 policy。
2026-10-06 A2 serialization/request coverage：重新运行 `test-preload-local-url.mjs`（9 assertions）、`test-preload-annotation-serialization.mjs`（11）、`test-preload-annotation-request-context.mjs`（8）、`test-preload-annotation-site-requests.mjs`（12）与 `test-preload-annotation-anchor-geometry.mjs`（3）均通过；3863-5049/5120-7259 的 URL、safe serialization、request context、permission site-request 与 anchor geometry 已有真实接回及 focused coverage，无新增可脱离 owner 的纯策略。
2026-10-06 A2 annotation UI runtime coverage：重新运行 `test-preload-annotation-overlay-runtime.mjs`（48 assertions）、`test-preload-annotation-surface-observer.mjs`（14）、`test-preload-annotation-pointer-selection.mjs`（18）、`test-preload-annotation-draft-runtime.mjs`（4）与 `test-preload-annotation-design-control-sync.mjs`（11）均通过；22291-26794 overlay/surface/pointer/draft/design owner 已有 focused regression，剩余 MutationObserver、RAF、DOM/style 与 React assembly 继续保留在生命周期 owner。
2026-10-06 A2 annotation lifecycle coverage：重新运行 `test-preload-annotation-controls-registry.mjs`（10 assertions）、`test-preload-pending-editor-message.mjs`（6）、`test-preload-annotation-preload-lifecycle.mjs`（8）、`test-preload-annotation-permission-controller.mjs`（18）与 `test-preload-annotation-mode-controller.mjs`（5）均通过；7260-7553/26882-27185 的 registry、pending、permission、mode 与 page lifecycle 已有真实 consumer/focused regression，无新增可脱离 owner 的纯策略。
2026-10-06 A2 selection/interaction coverage：重新运行 annotation selection（4 assertions）、display selections（7）、keyboard（5）、interaction policy（8）、frame-chain policy（2）与 containment（5）回归均通过；DOM selection/frame/interaction 区段已有真实 consumer 与 focused coverage，剩余 range/selection orchestration 绑定 DOM 与 lifecycle owner，不拆 facade。
2026-10-06 A2 preview/metadata coverage：重新运行 preview controller（6 assertions）、scheduler（5）、layer（10）、geometry（3）、visibility（3）、flex-gap overlays（7）与 metadata tooltip（5）回归均通过；preview/metadata/overlay projection 已有真实 consumer 与 focused coverage，剩余 RAF/DOM/React 编排继续由 lifecycle owner 持有。
2026-10-06 A2 viewport/style coverage：重新运行 viewport（2 assertions）、viewport-state（3）、scroll-boundary（5）、wheel-delta（3）、target-label（3）、theme（3）、attribute-tokens（3）与 motion（5）回归均通过；viewport/scroll/style/label/attribute policy 已有真实接回与 focused coverage，剩余滚动/动画副作用继续由 DOM lifecycle owner 持有。
2026-10-06 A2 URL/text projection coverage：重新运行 annotation URL（8 assertions）、URL parser policy（3）、document-kind policy（3）、visible-text（3）、visible-text policy（2）与 text-display projection（2）回归均通过；URL/document/text projection 已有真实 consumer 与 focused coverage，剩余 TreeWalker/DOM traversal 继续由 document owner 持有。
2026-10-06 A2 DOM selector/containment coverage：重新运行 class-names（9 assertions）、selector-token（5）、containment-frame policy（2）、ancestor policy（3）、modal-boundary policy（3）与 target-label policy（2）回归均通过；DOM selector/ancestor/frame containment gates 已有真实接回与 focused coverage，剩余跨 realm/shadow traversal 继续由 DOM owner 持有。
2026-10-06 A2 frame/target coverage：重新运行 frame-stability（5 assertions）、frame-pointer-guard（13）、frame-pointer-guard-state（5）、virtual-target（6）与 visible-element-rect（3）回归均通过；frame/target/visible-rect gates 已有真实 consumer 与 focused coverage，剩余跨 frame DOM observation 继续由 lifecycle owner 持有。
2026-10-06 T2/A2 继续批次：annotation rect bounds projection 已迁移至 `annotation-rect-bounds-projection.ts`；原 `Ku` 入口保留 rect 集合聚合，新增 1 项 focused assertion。
2026-10-06 T2/A2 继续批次：annotation rect point projection 已迁移至 `annotation-rect-point-projection.ts`；原 `qu` 入口保留首/末端与空集合语义，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation mirror mutation policy 已迁移至 `annotation-mirror-mutation-policy.ts`；原 `Uu` 入口保留 childList/marker 过滤，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation input selection policy 已迁移至 `annotation-input-selection-policy.ts`；原 `Ju` 入口复用 text-input policy，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation visible element rect projection 已迁移至 `annotation-visible-element-rect.ts`；原 `cd` 入口保留 visibility/rect/frame 适配，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation composed parent traversal 已迁移至 `src/main/browser-page-preload/annotation-composed-parent-policy.ts`；原 `ic` 入口保留 slot/parent/shadow host 顺序，新增 4 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation event propagation boundary 已迁移至 `src/main/browser-page-preload/annotation-event-propagation-policy.ts`；原 `Jc` 入口保留 preventDefault 开关及停止顺序，新增 2 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation scroll-container offset projection 已迁移至 `src/main/browser-page-preload/annotation-scroll-container-offset.ts`；原 `Nc` 入口保留 selector/scroll 适配，新增 3 项 focused assertions。
2026-10-06 T2/A2 继续批次：annotation frame point projection 已迁移至 `src/main/browser-page-preload/annotation-frame-point-projection.ts`；原 `Lc` 入口保留 frame offset 读取，新增 2 项 focused assertions。
2026-10-06 worker GitHub/review owner 复核：81,000-83,323 已由 `git-node-request-dispatch` 的 `github-request`、`git-review-read-dispatch` 及 GitHub board/revision/summary 模块真实消费；剩余逻辑绑定 host、Git manager、API/CLI、副作用与响应包装，未发现可脱离 owner 的新纯策略边界。
2026-10-06 A1 worker 增量：branch-ahead 的 `rev-list --count` stdout 数值/null 判定已迁移至现有 `git-branch-ahead-policy.ts`；runtime 继续负责 query cache、Git exit handling 与 remote/merge-base fallback，focused assertions 增加 3 项，build/typecheck 通过。
2026-10-06 A1 worker 增量：remote branch upstream ref 的 stdout trim/empty-to-null 投影已迁移至现有 `git-remote-branches-policy.ts`；runtime 继续负责 query cache、Git exit/abort handling，focused assertions 增加 3 项，build/typecheck 通过。
2026-10-06 A1 worker 增量：remote host config 的 SSH 字段 shape/type normalization 已迁移至 `remote-host-config-policy.ts`；display-name/SSH identity consumer 继续负责 terminal command 解析与 host formatting，新增 3 项 focused policy assertions，build/typecheck 通过。
2026-10-06 A1 worker 增量：remote host config 的 command tail/port/identity 与 IPv6 bracket projection 已并入 `remote-host-config-policy.ts`；consumer 继续负责 display-name/SSH identity 组装，focused policy assertions 增至 7 项，build/typecheck 通过。
2026-10-06 A1 worker 增量：turn-diff snapshot 的 tree SHA trim/validation/normalization 已迁移至 `git-turn-diff-snapshot-policy.ts`；runtime 继续负责 status、Git tree resolution、temporary index 与 staging 生命周期，新增 2 项 focused assertions，build/typecheck 通过。
2026-10-06 A1 worker 增量：review comparison 的 empty-untracked response projection 已迁移至现有 `git-review-comparison-policy.ts`；runtime 继续负责 repository/query/snapshot I/O 与 failure wrapping，focused policy assertions 增加 1 项，build/typecheck 通过。
2026-10-06 A5 继续批次：app-shared `$X/$Y/$Z/$_/$a/$b/$c/$f/$g/$i` 已完成 export-table 反解并登记为 `preserved-coupled`；对应 shared bootstrap、sandbox/plugin runtime、schema/style configuration 与 icon registry 生成面，均无独立 renderer business owner。
2026-10-06 A5 继续批次：app-shared `$j/$k/$l/$m/$n` 已完成 export-table 反解并登记为 `preserved-coupled`，分别属于 telemetry schema、generated runtime/registry、icon registry 与 plugin lifecycle surface。
2026-10-06 A5 继续批次：app-shared `$o/$p/$s/$t/$u/$v/$w/$x/$y/A$` 已完成 export-table 反解并登记 `preserved-coupled`；其中 icon initializer、bootstrap 与 schema/runtime 均没有独立 renderer business owner。
2026-10-06 A5 继续批次：app-shared `A3/AA/AB/AC/AD/AE/AF/AH/AJ/AK` 已完成源码反解并登记为 `preserved-coupled`，分别属于 generated runtime/protocol/schema/icon/annotation lifecycle surface。
2026-10-06 A5 继续批次：app-shared `AL/AM/AN/AO/AP/AQ/AT/AU/AW/Aa/Ab/Ac/Ad/Af/Ag` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-06 A5 继续批次：app-shared `Ai/Aj/Ak/Al/An/Ao/Ap/Ar/As/Au/Av/Aw/Ax/Ay/B$` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-06 A5 继续批次：app-shared `B2/B3/BA/BB/BC/BD/BE/BF/BG/BH/BJ/BM/BN/BO/BP` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-06 A5 继续批次：app-shared `BQ/BR/BS/BT/BV/BW/BZ/B_/Ba/Bb/Bc/Bd/Bf/Bg/Bh` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-06 A5 继续批次：app-shared `Bi/Bj/Bl/Bm/Bn/Bo/Bp/Br/Bs/Bu/Bv/Bw/Bx/By/C$` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-06 A5 继续批次：app-shared `C1/C3/CA/CB/CC/CD/CE/CF/CG/CH/CI/CK/CM/CN/CO` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-06 A5 继续批次：app-shared `CP/CQ/CR/CS/CT/CU/CV/CW/CX/CY/CZ/C_/Ca/Cb/Cc` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-06 A5 继续批次：app-shared `Cd/Cg/Ch/Ci/Cj/Ck/Cl/Cm/Cn/Co/Cp/Cr/Cs/Cu/Cv` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-06 A5 继续批次：app-shared `Cw/Cx/Cy/D/D$/D2/DA/DB/DC/DD/DE/DF/DG/DH/DI` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-09 A5 继续批次：app-shared `DK/DL/DM/DN/DO/DP/DQ/DR/DS/DT/DU/DV/DW/DX` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-09 A5 继续批次：app-shared `DY/DZ/D_/Da/Db/Dc/Dd/Df/Dg/Dh/Di/Dj/Dk/Dl` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-09 A5 继续批次：app-shared `Dm/Dn/Do/Dq/Dr/Ds/Du/Dv/Dw/Dx/Dy/Dz/E$/E0/E1` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-09 A5 继续批次：app-shared `E2/EA/EB/EC/ED/EE/EF/EH/EI/EK/EM/EN/EO/EP/EQ` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `ER/ES/ET/EV/EW/EX/EY/EZ/E_/Ea/Eb/Ec/Ed/Ef` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Eg/Eh/Ei/Ej/Ek/El/Em/En/Eo/Ep/Eq/Er/Es/Et/Eu` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Ev/Ew/Ex/Ey/Ez/F/F$/F0/F1/F2/F3/FA/FB/FC/FD` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `FE/FF/FG/FH/FI/FM/FN/FO/FP/FR/FS/FT/FV/FW/F_` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Fa/Fb/Fc/Fd/Ff/Fg/Fh/Fi/Fj/Fk/Fl/Fm/Fn/Fo/Fp` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Fr/Fs/Ft/Fu/Fv/Fw/Fx/Fy/G$/G0/GA/GB/GC/GD/GE/GF/GG/GH/GI/GK` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `GL/GM/GN/GO/GP/GQ/GR/GS/GT/GU/GV/GW/GX/GY/GZ` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `G_/Ga/Gb/Gc/Gd/Gg/Gh/Gi/Gj/Gk/Gl/Gm/Gn/Go/Gr` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Gt/Gu/Gv/Gw/Gx/Gy/H$/H0/H2/HA/HB/HC/HD/HE/HG` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `HH/HL/HM/HN/HO/HP/HQ/HR/HS/HT/HW/HY/HZ/H_/Ha` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Hb/Hc/Hd/Hf/Hg/Hh/Hi/Hj/Hk/Hl/Hm/Hn/Ho/Hr/Hs` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Hu/Hv/Hw/Hx/Hz/I$/I0/I1/I2/IA/IB/IC/ID/IE/IF` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `IG/IJ/IL/IM/IN/IO/IP/IR/IS/IT/IV/IW/IX/IY/IZ` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Ia/Ic/Id/Ig/Ii/Ij/Ik/Il/In/Io/Iq/Ir/Is/It/Iu` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Iv/Iw/Ix/Iy/Iz/J/J$/J0/J2/JA/JB/JC/JD/JE/JF` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `JG/JH/JI/JJ/JK/JL/JM/JN/JO/JP/JR/JS/JT/JU/JV` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `JW/JX/JY/JZ/J_/Ja/Jb/Jc/Jd/Jf/Jg/Jh/Ji/Jj/Jk` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Jl/Jn/Jo/Jp/Jq/Jr/Js/Jt/Ju/Jv/Jw/Jx/Jy/Jz/K/K$/K0/K1/K4/KA/KB/KC/KD/KE/KF/KG/KH/KI/KJ/KK` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `KL/KM/KN/KO/KP/KQ/KR/KS/KT/KU/KV/KW/KX/KY/KZ/K_/Ka/Kb/Kc/Kd/Kf/Kg/Kh/Ki/Kj/Kk/Kl/Km` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Kn/Ko/Kp/Kq/Kr/Ks/Kt/Kv/Kw/Kx/Ky/Kz/L/L$/L0/L1/L2/L3/L4/LA/LB/LC/LD/LE/LF/LG/LH/LI/LJ/LK` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `LL/LM/LN/LO/LP/LQ/LR/LS/LT/LV/LW/LY/LZ/L_/La/Lb/Lc/Ld/Lg/Li` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Lj/Lk/Ll/Lm/Ln/Lp/Lq/Lr/Ls/Lt/Lu/Lv/Lw/Lx/Ly/Lz/M$/M0/M1/M2` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `M3/M4/MA/MB/MC/MD/ME/MF/MG/MH/MI/MJ/MK/ML/MM/MN/MO/MP/MQ/MR` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `MS/MT/MU/MV/MW/MX/MY/MZ/M_/Ma/Mb/Mc/Md/Mf/Mg/Mh/Mi/Mj/Mk/Ml` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Mm/Mn/Mo/Mp/Mq/Mr/Ms/Mu/Mv/Mw/Mx/My/Mz/N/N$/N0/N1/N2/N4` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `NA/NB/NC/ND/NE/NF/NG/NH/NI/NJ/NL/NM/NN/NO/NP/NQ/NR/NS/NT/NV` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `NW/NX/NY/NZ/N_/Na/Nb/Nc/Nd/Nf/Ng/Nh/Ni/Nj/Nk/Nl/Nm/Nn/No/Nq` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Nr/Ns/Nt/Nv/Nw/Nx/Ny/Nz/O$/O0/O1/O2/O3/O4/OA/OB/OC/OD/OE/OF` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `OG/OH/OI/OJ/OL/OM/ON/OO/OP/OQ/OR/OS/OT/OU/OV/OW/OX/OY/OZ/O_` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Oa/Ob/Oc/Od/Og/Oi/Oj/Ok/Ol/Om/On/Oo/Op/Oq/Or/Os/Ou/Ov/Ow/Ox` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Oy/Oz/P$/P0/P1/P2/P4/PA/PB/PC/PD/PE/PF/PG/PH/PI/PJ/PL/PM/PN` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `PO/PP/PQ/PR/PS/PT/PU/PV/PW/PX/PY/PZ/P_/Pa/Pb/Pc/Pd/Pf/Pg/Pi` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Pj/Pk/Pl/Pm/Pn/Po/Pp/Pq/Pr/Ps/Pt/Pv/Pw/Px/Py/Pz/Q$/Q0/Q1/Q2` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Q4/QA/QB/QC/QD/QE/QF/QG/QH/QJ/QK/QL/QM/QN/QO/QP/QQ/QR/QS/QT` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `QU/QV/QW/QY/QZ/Q_/Qa/Qb/Qd/Qf/Qg/Qi/Qj/Qk/Ql/Qm/Qn/Qo/Qp/Qq` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `Qr/Qs/Qt/Qu/Qv/Qw/Qx/Qy/Qz/R$/R0/R1/R2/R3/RA/RB/RC/RD/RE/RF` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 继续批次：app-shared `RG/RJ/RK/RL/RM/RN/RO/RP/RQ/RR/RS/RT/RU/RV/RW/RX/RY/RZ/Ra/Rb` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 扩大批次：app-shared `Rc/Rd/Rg/Ri/Rj/Rk/Rl/Rm/Rn/Rp/Rq/Rr/Rs/Rt/Ru/Rv/Rw/Rx/Ry/Rz/S/S$/S0/S1/S2/S3/SA/SB/SC/SD/SE/SF/SG/SH/SI/SJ/SK/SM/SN/SO` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 扩大批次：app-shared `SP/SQ/SR/SS/ST/SV/SW/SY/SZ/Sa/Sb/Sc/Sd/Sf/Sg/Sh/Sj/Sk/Sl/Sm/Sn/So/Sp/Sq/Sr/Ss/Su/Sv/Sw/Sx/Sy/Sz/T/T$/T0/T1/T2/T3/T4/TA` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 扩大批次：app-shared `TB/TC/TD/TE/TF/TG/TH/TI/TJ/TK/TL/TM/TN/TO/TP/TQ/TR/TS/TT/TV/TW/TY/TZ/T_/Ta/Tb/Td/Tg/Th/Ti/Tj/Tk/Tl/Tm/Tn/To/Tp/Tq/Tr/Ts` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 扩大批次：app-shared `Tt/Tu/Tv/Tw/Tx/Ty/Tz/U$/U0/U1/U2/U3/U4/UA/UB/UC/UD/UE/UG/UH/UJ/UK/UL/UM/UN/UO/UP/UQ/UR/US/UT/UV/UW/UX/UY/UZ/U_/Ua/Ub/Uc` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 扩大批次：app-shared `Ud/Uf/Ug/Uh/Ui/Uj/Uk/Ul/Um/Un/Uo/Up/Uq/Ur/Us/Uu/Uv/Uw/Ux/Uy/Uz/V/V$/V0/V1/V2/VA/VB/VC/VD/VE/VF/VG/VH/VJ/VK/VL/VM/VN/VO` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-10 A5 扩大批次：app-shared `VP/VQ/VR/VS/VT/VU/VV/VW/VX/VY/VZ/Va/Vb/Vc/Vd/Vf/Vg/Vh/Vi/Vj/Vk/Vl/Vm/Vn/Vo/Vp/Vq/Vr/Vs/Vu/Vv/Vw/Vx/Vy/Vz/W/W$/W0/W1/W4` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `WA/WB/WC/WD/WE/WF/WG/WH/WI/WJ/WL/WM/WN/WO/WP/WQ/WR/WS/WT/WV/WW/WX/WY/WZ/W_/Wa/Wb/Wc/Wd/Wf/Wg/Wh/Wi/Wj/Wk/Wl/Wm/Wn/Wo/Wp` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `Wq/Wr/Ws/Wt/Wu/Wv/Ww/Wx/Wy/Wz/X$/X0/X1/X2/X3/X4/XA/XB/XC/XD/XE/XF/XG/XH/XI/XJ/XK/XL/XM/XN/XO/XP/XQ/XR/XS/XT/XU/XV/XW/XY` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `XZ/X_/Xa/Xb/Xc/Xd/Xf/Xg/Xh/Xj/Xk/Xl/Xn/Xo/Xq/Xr/Xs/Xt/Xu/Xv/Xw/Xx/Xy/Xz/Y/Y$/Y0/Y1/Y3/Y4/YA/YB/YC/YD/YE/YG/YH/YI/YJ/YK` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `YL/YM/YN/YO/YP/YQ/YR/YS/YT/YU/YV/YW/YY/YZ/Y_/Ya/Yb/Yc/Yd/Yf/Yg/Yj/Yk/Yl/Yn/Yo/Yp/Yq/Yr/Ys/Yt/Yu/Yv/Yw/Yx/Yy/Yz/Z/Z$/Z0` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `Z1/Z2/ZA/ZB/ZC/ZD/ZE/ZF/ZG/ZH/ZJ/ZK/ZL/ZM/ZN/ZO/ZP/ZQ/ZR/ZS/ZT/ZU/ZV/ZW/ZX/ZY/ZZ/Z_/Za/Zb/Zd/Zf/Zg/Zi/Zj/Zk/Zl/Zm/Zn/Zo` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `Zp/Zq/Zr/Zs/Zt/Zu/Zv/Zw/Zx/Zy/Zz/_$/_0/_1/_2/_3/_4/_A/_B/_C/_D/_E/_F/_G/_H/_I/_J/_K/_M/_N/_O/_P/_Q/_R/_S/_T/_U/_V/_W/_X` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `_Y/_Z/_a/_b/_c/_d/_f/_g/_h/_i/_j/_k/_l/_m/_n/_o/_p/_q/_r/_s/_t/_u/_v/_w/_x/_y/_z/a$/a0/a1/a2/a3/a4/aA/aB/aC/aD/aE/aF/aG` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `aH/aI/aJ/aK/aL/aM/aN/aO/aP/aQ/aR/aS/aT/aU/aV/aW/aX/aY/aZ/a_/aa/ab/ac/ad/af/ag/ah/ai/aj/ak/am/ao/ap/aq/ar/as/au/av/aw/ax` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `ay/az/b$/b0/b1/b2/b3/b4/bA/bB/bC/bE/bF/bG/bH/bI/bJ/bK/bL/bM/bN/bO/bP/bQ/bR/bT/bU/bV/bW/bX/bY/bZ/ba/bb/bc/bd/bf/bg/bh/bi` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `bj/bk/bl/bm/bn/bo/bp/bq/br/bs/bt/bu/bv/bw/bx/by/bz/c$/c0/c1/c2/c3/c4/cA/cB/cC/cD/cE/cF/cG/cH/cI/cJ/cK/cL/cM/cN/cO/cP/cQ` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `cR/cS/cT/cU/cV/cW/cX/cY/cZ/ca/cb/cc/cd/cf/cg/ch/ci/cj/cl/cm/cn/co/cp/cq/cr/cs/cu/cv/cw/cx/cy/cz/d$/d1/d2/d3/d4/dA/dB/dC` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `dw/dx/dy/dz/e$/e0/e1/e2/e3/eA/eB/eC/eD/eE/eF/eG/eH/eI/eJ/eK/eL/eM/eN/eO/eP/eQ/eR/eS/eT/eV/eW/eX/eY/e_/ea/eb/ec/ed/eg/eh` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `ei/ej/el/em/en/eo/ep/eq/er/es/eu/ev/ew/ex/ey/ez/f/f$/f1/f2/f3/f4/fA/fB/fC/fD/fE/fF/fG/fH/fJ/fK/fL/fM/fN/fO/fP/fQ/fR/fS` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `fT/fU/fV/fX/fY/fZ/f_/fa/fb/fc/fd/ff/fh/fi/fj/fl/fm/fn/fo/fp/fq/fr/fs/ft/fu/fv/fw/fx/fy/fz/g/g$/g0/g1/g2/g3/gA/gB/gC/gD` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `gE/gF/gG/gH/gI/gJ/gK/gM/gN/gO/gP/gQ/gR/gS/gT/gU/gV/gW/gX/gY/gZ/ga/gb/gc/gd/gf/gg/gh/gi/gj/gk/gl/gm/gn/go/gp/gq/gr/gs/gt` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `gu/gv/gw/gx/gy/gz/h$/h0/h1/h2/h3/hA/hB/hC/hD/hE/hF/hH/hI/hJ/hK/hL/hM/hN/hO/hP/hQ/hR/hS/hT/hU/hV/hW/hX/hY/hZ/h_/ha/hb/hc` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `hd/hf/hg/hh/hj/hk/hl/hm/hn/ho/hp/hr/hs/hu/hv/hw/hx/hy/hz/i/i0/i1/i2/i3/i4/iA/iB/iC/iD/iE/iF/iG/iH/iI/iJ/iK/iM/iN/iO/iP` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `iQ/iR/iS/iT/iU/iV/iX/iY/iZ/i_/ia/ib/ic/id/if/ig/ih/ii/ij/ik/il/im/in/io/ip/iq/ir/is/it/iu/iv/iw/ix/iz/j/j$/j0/j1/j2/j3` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `j4/jA/jB/jC/jD/jE/jF/jG/jH/jI/jJ/jK/jL/jM/jN/jO/jP/jQ/jR/jS/jT/jV/jW/jX/jY/j_/ja/jb/jc/jd/jg/ji/jj/jk/jl/jm/jn/jo/jp/jq` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `jr/js/jt/ju/jv/jw/jx/jy/jz/k$/k0/k1/k2/k3/kA/kB/kC/kD/kE/kF/kG/kH/kI/kJ/kK/kL/kM/kN/kO/kP/kQ/kR/kS/kT/kU/kV/kW/kX/kY/kZ` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `k_/ka/kb/kc/kd/kg/ki/kj/kk/kl/km/kn/ko/kq/kr/ks/kt/ku/kv/kw/kx/ky/kz/l/l$/l0/l1/l2/l4/lA/lB/lC/lD/lE/lF/lG/lI/lJ/lK/lL` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `lM/lN/lO/lP/lQ/lR/lS/lT/lU/lV/lX/l_/la/lb/lc/ld/lf/lg/lh/li/lj/ll/lm/ln/lo/lp/lq/lr/ls/lu/lv/lx/ly/lz/m/m$/m1/m2/m3/mA` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `mB/mC/mD/mE/mF/mG/mH/mI/mJ/mK/mL/mM/mN/mO/mP/mQ/mR/mS/mT/mU/mV/mW/mX/mY/m_/ma/mb/mc/md/mf/mh/mj/mk/ml/mm/mn/mo/mp/mq/mr` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `ms/mu/mv/mw/mx/my/mz/n/n0/n1/n2/n3/nA/nB/nC/nD/nE/nF/nG/nH/nI/nJ/nK/nL/nM/nN/nO/nP/nQ/nR/nS/nT/nU/nV/nW/nX/nY/nZ/n_/na` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `nb/nc/nd/ng/nh/ni/nj/nk/nm/nn/no/np/nq/nr/ns/nt/nu/nv/nw/nx/ny/nz/o/o$/o0/o1/o2/o3/o4/oA/oB/oC/oD/oE/oF/oG/oH/oI/oJ/oK` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `oL/oM/oN/oO/oP/oQ/oR/oS/oT/oU/oV/oW/oX/oa/ob/oc/od/of/og/oh/oi/oj/ok/ol/om/oo/op/or/os/ot/ou/ov/ow/ox/oy/oz/p$/p1/p2/p3` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `pA/pB/pC/pD/pE/pF/pG/pH/pI/pJ/pK/pM/pN/pO/pP/pQ/pR/pS/pT/pU/pV/pW/pX/pY/p_/pa/pb/pc/pd/pf/pg/ph/pi/pj/pl/pm/pn/po/pp/pq` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `pr/ps/pt/pu/pv/pw/px/py/pz/q$/q0/q1/q2/q3/qA/qB/qC/qD/qE/qF/qG/qH/qI/qJ/qK/qL/qM/qN/qO/qP/qR/qS/qU/qV/qW/qX/qY/qZ/q_/qa` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `qb/qc/qd/qf/qg/qh/qi/qj/qk/ql/qn/qo/qq/qr/qs/qt/qu/qw/qx/qy/qz/r0/r1/r2/r3/r4/rA/rB/rC/rD/rE/rF/rG/rH/rI/rK/rM/rN/rO/rP` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `rQ/rR/rS/rT/rU/rV/rW/rX/rY/r_/ra/rb/rc/rd/rf/rg/rh/ri/rj/rk/rm/rn/ro/rp/rq/rr/rs/ru/rv/rw/rx/ry/rz/s/s$/s0/s1/s2/s3/s4` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `sA/sB/sC/sD/sE/sF/sG/sH/sI/sJ/sK/sL/sM/sN/sO/sP/sQ/sR/sS/sT/sU/sV/sW/sX/sY/s_/sa/sb/sc/sd/sf/sg/sh/si/sj/sk/sl/sm/sn/so` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `sp/sq/sr/ss/st/su/sv/sx/sz/t0/t1/t2/t3/t4/tA/tB/tC/tD/tE/tF/tG/tH/tI/tJ/tK/tL/tM/tN/tO/tP/tQ/tR/tS/tT/tV/tW/tX/tY/tZ/t_` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `ta/tb/tc/td/tg/th/ti/tj/tk/tl/tm/tn/to/tp/tq/tr/ts/tu/tv/tw/tx/ty/tz/u$/u1/u2/u3/u4/uA/uB/uC/uD/uE/uF/uG/uH/uI/uJ/uK/uM` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `uN/uO/uP/uQ/uR/uS/uT/uU/uV/uX/uY/uZ/u_/ua/ub/uc/ud/uf/ug/uh/ui/uj/uk/ul/um/un/uo/up/uq/ur/us/ut/uu/uv/uw/ux/uy/uz/v/v$` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `v0/v1/v2/v3/v4/vA/vB/vC/vD/vE/vF/vG/vH/vI/vJ/vK/vL/vM/vN/vO/vP/vQ/vR/vS/vT/vU/vV/vY/vZ/v_/va/vb/vc/vd/vf/vg/vh/vj/vk/vl` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `vm/vn/vo/vp/vq/vr/vs/vu/vv/vw/vx/vy/vz/w/w$/w0/w1/w2/w3/w4/wA/wB/wC/wD/wE/wF/wG/wH/wI/wK/wM/wN/wO/wP/wQ/wR/wS/wT/wU/wV` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `wW/wX/wY/wZ/w_/wa/wb/wd/wf/wg/wh/wj/wk/wl/wm/wn/wo/wq/wr/ws/wt/wu/wv/ww/wx/wz/x$/x0/x1/x2/x3/x4/xA/xB/xC/xD/xE/xF/xG/xH` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `xI/xJ/xK/xL/xM/xN/xO/xP/xQ/xR/xS/xT/xV/xW/xX/xY/xZ/xa/xb/xc/xd/xg/xh/xi/xj/xk/xl/xm/xn/xo/xp/xq/xr/xs/xt/xu/xv/xw/xx/xy` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `xz/y/y$/y0/y1/y2/y3/y4/yA/yB/yC/yD/yE/yF/yG/yH/yI/yJ/yK/yL/yM/yN/yO/yP/yQ/yR/yS/yT/yU/yV/yY/yZ/ya/yb/yc/yd/yf/yg/yh/yj` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `yk/yl/ym/yn/yo/yp/yq/yr/ys/yu/yv/yw/yx/yy/yz/z/z$/z0/z1/z2/z3/z4/zA/zB/zC/zD/zE/zF/zH/zJ/zK/zL/zM/zN/zO/zP/zQ/zR/zS/zT` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 跨 bundle 批次：app-shared `zV/zW/z_/za/zb/zc/zd/zf/zg/zi/zj/zk/zl/zm/zn/zo/zp/zq/zr/zs/zu/zv/zx/zy/zz` 与 app-initial `$/$$/$$t/$0/$0t/$1/$1t/$2/$2t/$3/$3t/$4/$5/$5t/$6` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 批次：`$6t/$7/$7t/$8/$8t/$9/$9t/$A/$At/$B/$C/$Ct/$D/$Dt/$E/$Et/$F/$Ft/$G/$Gt/$H/$Ht/$I/$It/$J/$Jt/$Kt/$L/$Lt/$M/$Mt/$N/$Nt/$O/$Ot/$P/$Pt/$Q/$Qt/$R` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 批次：`$Rt/$S/$Sn/$St/$T/$Tt/$U/$Ut/$V/$Vt/$Wt/$X/$Xt/$Y/$Yt/$Z/$Zt/$_/$_n/$_t/$a/$an/$at/$bn/$bt/$c/$cn/$ct/$d/$dn/$dt/$et/$f/$ft/$g/$gn/$gt/$h/$hn/$ht` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 批次：`$i/$in/$it/$j/$jt/$k/$kt/$l/$lt/$mn/$mt/$n/$nn/$nt/$o/$on/$ot/$p/$pn/$pt/$q/$qt/$r/$rn/$rt/$s/$t/$tn/$tt/$u/$un/$ut/$vn/$vt/$w/$wt/$x/$xn/$xt/$y` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 批次：`$yn/$yt/$z/$zt/A/A$/A$t/A0t/A1/A2/A2t/A3/A3t/A4/A4t/A5/A5t/A6/A6t/A7/A7t/A8/A8t/A9/AA/AAt/AB/ABt/AC/ACn/ACt/AD/ADt/AE/AEt/AF/AFt/AG/AGt/AH` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 扩大批次：`$Ab/$Abn/$Abt/$Ac/$Acn/$Act/$Ad/$Adn/$Adt/$Aen/$Aet/$Afn/$Aft/$Agn/$Agt/$Ah/$Ahn/$Aht/$Ai/$Ain/$Ait/$Aj/$Ajt/$Ak/$Akt/$Al/$Aln/$Alt/$Am/$Amn/$Amt/$An/$Ann/$Ant/$Ao/$Aon/$Aot/$Ap/$Apn/$Apt/$Aq/$Aqt/$Ar/$Arn/$As/$Asn/$Ast/$At/$Atn/$Att/$Au/$Aut/$Av/$Avn/$Avt/$Aw/$Awt/$Ax/$Axn/$Axt/$Ay/$Ayn/$Ayt/$Az/$Azt/$B/$B$/$B$t/$B0/$B0t/$B1/$B1t/$B2/$B2t/$B3/$B3t/$B4/$B5/$B5t/$B6/$B7/$B7t/$B8/$B9/$B9t/$BA/$BAt/$BB/$BBt/$BC/$BCn/$BCt/$BD/$BDt/$BE/$BEt/$BF/$BFt/$BG/$BH/$BHt/$BI/$BIt/$BJ/$BJt/$BK/$BKt/$BLt/$BM/$BMt/$BN/$BNt/$BO/$BOt/$BP/$BQ/$BQt/$BR/$BRt/$BS/$BSn/$BSt/$BT/$BTt/$BU/$BUt/$BV/$BVt/$BW/$BWt/$BX/$BXt/$BYt/$BZ/$BZt/$B_/$B_n/$B_t/$Ba/$Ban/$Bat/$Bb/$Bbn/$Bbt/$Bc/$Bct/$Bd/$Bdn/$Bdt/$Ben/$Bet/$Bf/$Bft/$Bg/$Bgn/$Bh/$Bhn/$Bht/$Bi/$Bin/$Bit/$Bj/$Bjt/$Bk/$Bkt/$Bl/$Bln/$Blt/$Bmn/$Bmt/$Bn/$Bnn/$Bnt/$Bo/$Bon/$Bot/$Bp/$Bpn/$Bpt/$Bq/$Bqt/$Br/$Brt/$Bs/$Bsn/$Bt/$Btn/$Btt/$Bu/$But/$Bv/$Bvn/$Bvt/$Bw/$Bwt/$Bx/$Bxn/$Bxt/$Byn/$Byt` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。Manifest 未归类减少 200 项。
2026-10-11 A5 app-initial 批次：`$AHt/$AI/$AIt/$AJ/$AJt/$AK/$AL/$ALt/$AM/$AMt/$AN/$ANt/$AO/$AOt/$AP/$APt/$AQ/$AQt/$AR/$ARt/$AS/$ASn/$ASt/$AT/$ATt/$AU/$AV/$AVt/$AW/$AWt/$AX/$AY/$AYt/$AZ/$AZt/$A_n/$A_t/$Aa/$Aan/$Aat` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 批量推进：本批 500 个 alias 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 批量推进：本批 1000 个 alias 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 批量推进 B6：本批 1000 个 alias 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 批量推进 B7：本批 1000 个 alias 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 批量推进 B8：本批 1000 个 alias 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 收尾批次：本批 490 个 alias 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-primary 收尾批次：本批 490 个 alias 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 批量推进：本批 1000 个 alias 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 批量推进：本批 1000 个 alias 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 app-initial 批量推进：本批 1000 个 alias 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 扩大批次：app-shared `dD/dE/dF/dG/dH/dI/dJ/dK/dL/dM/dN/dO/dP/dQ/dR/dS/dT/dU/dV/dW/dX/dY/d_/da/dc/dd/df/dh/dj/dk/dl/dm/dn/do/dp/dq/dr/ds/du/dv` 已完成 export-table 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 分类口径收敛：补登记 app-shared 138、app-initial 514、app-primary 14 个此前被消费解析器漏识别的 generated aliases，全部完成 source-symbol 反解并登记为 `preserved-coupled`，无独立 renderer business owner。
2026-10-11 A5 分类门禁修复：`audit-renderer-hub-classification --strict` 已升级为检查所有 unconsumed alias 均有分类记录，并缓存 hub source symbols；当前三大 hub 均 `0 unreviewed`，同时 manifest `UNREVIEWED: 0`、shared consumption `TOTAL: 0`、typecheck、verify-renderer、verify-chunks 与 smoke 均通过。A1/A2/A3 的物理业务迁移仍未宣称终局完成。
2026-10-11 A1 worker 增量：local shell environment 的登录 shell 探测、候选 shell fallback、NUL environment marker 解析、CODEX_SHELL 清理与 per-host cache 已迁移至 `git-shell-environment.ts`；worker entry 继续持有 process/host I/O、warning 与 Git local-environment runtime wiring，新增 5 项 focused assertions，typecheck/build/verify-chunks 通过。A1 worker Git manager/watch/session 其余范围仍未完成。
2026-10-11 A1 worker 增量：worker IPC telemetry 的 request/response/broadcast message category 已迁移至 `src/main/worker/message-category.ts`；entry 继续持有连接计数、close 生命周期与 telemetry side effects，新增 8 项 focused assertions，typecheck/build/verify-chunks 通过。A1 其余 Git manager/watch/session 范围仍未完成。
2026-10-11 A2 preload 增量：annotation target element 的 parent-chain resolution、interactive tag/role 判定、direct-text threshold 与 fallback 已迁移至 `src/main/browser-page-preload/annotation-target-element-resolver.ts`；entry 仅保留 DOM adapter，新增 3 项 focused assertions，typecheck/build/verify-chunks 通过。React render/hook 与 frame/anchor runtime 仍未完成。
2026-10-11 A1 worker 增量：parcel watcher options 的 backend/inotify 选择、ignored glob 相对化与特殊字符转义已迁移至 `src/main/worker/parcel-watcher-options.ts`；watcher 订阅、事件和 close 生命周期仍由原 owner 持有，新增 5 项 focused assertions，typecheck/build/verify-chunks 通过。
2026-10-11 A2 preload 增量：annotation selector generation 的 id/class/nth-of-type、unique selector 检查、四层普通路径与 shadow-root 兼容已迁移至 `src/main/browser-page-preload/annotation-selector-generator.ts`；入口仅注入 DOM/escape/unique adapters，新增 3 项 focused assertions，typecheck/build/verify-chunks 通过。React render/hook 与 frame/anchor runtime 仍未完成。
2026-10-11 A1 worker 增量：parcel watcher event projection 的 changed paths、parent-directory rename handling、root deletion 和 paths-to-check 已迁移至 `src/main/worker/parcel-watcher-events.ts`；watcher emit/close/subscription 副作用仍由原 owner 持有，新增 6 项 focused assertions，typecheck/build/verify-chunks 通过。
2026-10-11 A2 preload 增量：annotation frame/DOM hit target 的 ancestor resolution、viewport/point/checkVisibility 过滤、text-container `null` 与 container/documentElement fallback 已迁移至 `src/main/browser-page-preload/annotation-hit-target-resolver.ts`；入口继续持有事件/DOM 生命周期，新增 3 项 focused assertions，typecheck/build/verify-chunks 通过。React render/hook runtime 仍未完成。
2026-10-11 A1 worker 增量：parcel watcher path containment 的 root equality、nested path 和 filesystem root boundary 已迁移至 `src/main/worker/parcel-watcher-paths.ts`；supplemental subscription 与 active directory-check 的 mutation/cleanup 仍由原 owner 持有，新增 5 项 focused assertions，typecheck/build/verify-chunks 通过。
2026-10-11 A2 preload 增量：annotation shadow-root/iframe frame hit-test 的递归、frame policy callback、denied sentinel、iframe 坐标换算与 shadow-root 优先级已迁移至 `src/main/browser-page-preload/annotation-frame-hit-test.ts`；入口保留 sentinel 到 public null 的兼容映射，新增 3 项 focused assertions，typecheck/build/verify-chunks 通过。
2026-10-11 A1 worker 修复：parcel watcher path 抽取后残留的严格祖先 consumer 已接回 `isPathBelowAnyRoot`，与包含自身的 `isPathAtOrBelowAnyRoot` 分离；path focused assertions 增至 7 项，typecheck/build/verify-chunks 通过。
2026-10-11 A2 preload 增量：annotation iframe/shadow-root frame tree traversal 与 window Set 去重已迁移至 `src/main/browser-page-preload/annotation-frame-tree.ts`；入口仅注入 document/frame adapters，新增 3 项 focused assertions，typecheck/build/verify-chunks 通过。React render/hook runtime 仍未完成。
2026-10-11 A1 worker 增量：parcel watcher missing-path error code predicate（ENOENT/ENOTDIR）已迁移至 `src/main/worker/parcel-watcher-errors.ts`；lstat/opendir I/O 与 watcher lifecycle 仍由原 owner 持有，新增 5 项 focused assertions，typecheck/build/verify-chunks 通过。
2026-10-11 A2 preload 增量：annotation 跨 shadow-root selector 解析（普通 selector、`shadow:...>>>...` 链、逐级 shadowRoot 与最终 element 校验）已迁移至 `src/main/browser-page-preload/annotation-shadow-selector-resolver.ts`；入口仅保留 DOM adapter，新增 3 项 focused assertions，typecheck/build/verify-chunks 通过。
2026-10-11 A1 worker 增量：Git request catch 的 unavailable/stale/exception disposition projection 已迁移至 `classifyGitRequestException`；入口继续持有 response、telemetry 与 sentinel identity，request-context 回归断言保留原 12 项并新增 3 项分类断言，typecheck/build/verify-chunks 通过。
2026-10-11 A2 preload 增量：annotation text/container ancestor resolution 已迁移至 `src/main/browser-page-preload/annotation-container-ancestor.ts`；入口仅注入 composed-parent 与 attribute adapters，保留 text-container 元素、普通 container/未命中 `null` 语义，新增 3 项 focused assertions，typecheck/build/verify-chunks 通过。
2026-10-11 A1 worker 增量：review-summary live-query 的 failed-command result projection 已迁移至 `projectGitReviewSummaryResult`；入口继续持有 live-query、response/telemetry 编排，新增 4 项 focused assertions，typecheck/build/verify-chunks 通过。
2026-10-11 A2 preload 增量：annotation scroll-container descriptor discovery 已迁移至 `src/main/browser-page-preload/annotation-scroll-container-discovery.ts`；入口保留 selector/clipping policy 注入与事件监听副作用，新增 3 项 focused assertions，typecheck/build/verify-chunks 通过。
2026-10-11 A1 worker 增量：open-target registry lookup 与 unknown-target error contract 已迁移至 `src/main/worker/open-target-registry.ts`；平台 detect/icon/open I/O 仍由原 owner 持有，新增 3 项 focused assertions，typecheck/build/verify-chunks 通过。
2026-10-11 A2 preload 增量：annotation scroll listener 的 frame filtering、selector resolution、listener deduplication 与 cleanup 已迁移至 `src/main/browser-page-preload/annotation-scroll-listener.ts`；入口继续持有 runtime listener 生命周期，新增 2 项 focused assertions，typecheck/build/verify-chunks 通过。
2026-10-11 A1 worker 增量：parcel/git watcher 生成的 `F6` missing-path wrapper 已删除，watcher metadata、Git path existence 与 worktree directory 三处 consumer 直接复用既有 `isMissingPathError`，保持错误分类与 I/O 顺序，typecheck/build/verify-chunks 通过。
2026-10-11 A1 worker 增量：未再引用的 generated `nbe/rbe/dbe` request policy wrappers 已删除，failure telemetry consumer 直接调用 `isGitRequestFailure`；request/cancel/telemetry lifecycle 不变，typecheck/build/verify-chunks 通过。
2026-10-11 A2 preload 增量：annotation cleanup guard 已迁移至 `src/main/browser-page-preload/annotation-cleanup.ts`；入口保留空值安全与 cleanup exception swallowing 语义，新增 2 项 focused assertions，typecheck/build/verify-chunks 通过。
2026-10-11 A3 main 增量：macOS native status item 的菜单 JSON projection 已迁移至
`src/main/main-app/startup/native-status-item-menu.ts`；`Mst` 入口继续持有 native addon 更新、
i18n label 获取与状态生命周期，新增 `scripts/test-main-native-status-item-menu.mjs` 的 2 项
focused assertions，build/typecheck/verify-chunks 通过。
2026-10-11 A3 main 增量：`Qot.createWindow` 的 BrowserWindow constructor options projection
已迁移至 `src/main/main-app/startup/browser-window-options.ts`，真实 consumer 保留 bounds、
title/icon、background、platform menu-bar、appearance options、minimum size 与 webPreferences
语义；窗口事件、navigation、registration 与 cleanup 仍由 window manager 持有。新增
`scripts/test-main-browser-window-options.mjs` 的 2 项 focused assertions，typecheck 通过；
本轮 build 受并行 worker.ts 重复符号 `o` 阻塞，需由 owner 修复后复跑全量门禁。
2026-10-11 A3 main/language-server 增量：Kotlin runtime 的 `workspace.json` 配置 projection
已迁移至 `src/main/main-app/language-server/kotlin-workspace-config.ts`，`findSessionOptions`
继续持有 host path、runtime discovery、文件 I/O 与 process 生命周期；新增
`scripts/test-main-kotlin-workspace-config.mjs` 的 2 项 focused assertions，build/typecheck/
verify-chunks 通过。
2026-10-11 A2 preload 增量：React annotation runtime 文本 anchor 观察目标规划（原 `du`）已迁移至
`src/main/browser-page-preload/annotation-text-anchor-observation-targets.ts`；入口继续持有
MutationObserver、input/scroll/frame 监听、RAF 调度与 dispose 生命周期，新增
`scripts/test-preload-annotation-text-anchor-observation-targets.mjs` 的 11 项 focused assertions，
typecheck/build/verify-chunks 通过。React render/hook 其余组合与跨 frame anchor 生命周期仍未完成。
2026-10-11 A2 preload 增量：React annotation runtime 顶层 comments/page/design 派生集合（原 `Wy`
内 `Pe/Fe/ze/Be/Ve/He/Ue`）已迁移至 `src/main/browser-page-preload/annotation-runtime-collection-projection.ts`；
入口继续持有 DOM anchor resolution、React effects 与 watcher 生命周期，新增
`scripts/test-preload-annotation-runtime-collection-projection.mjs` 的 11 项 focused assertions，
typecheck/build/verify-chunks 通过。React render/hook 其余组合与跨 frame anchor 生命周期仍未完成。
2026-10-11 A2 preload 增量：React annotation runtime marker record 列表构建（原 `Wy` 内 `Rt`）已迁移至
`src/main/browser-page-preload/annotation-marker-record-projection.ts`；入口继续持有 marker point
聚合与 React render/UI 生命周期，新增 `scripts/test-preload-annotation-marker-record-projection.mjs`
的 9 项 focused assertions，typecheck/build/verify-chunks 通过。React render/hook 其余组合与跨
frame anchor 生命周期仍未完成。
2026-10-11 A2 preload 增量：React annotation runtime zoom/viewport overlay CSS style map（原 `Wy` 内
`mn/hn`）已迁移至 `src/main/browser-page-preload/annotation-overlay-style-projection.ts`；入口继续
负责 comment-mode cursor/pointerEvents 后缀与 React render 生命周期，新增
`scripts/test-preload-annotation-overlay-style-projection.mjs` 的 9 项 focused assertions，
typecheck/build/verify-chunks 通过。React render/hook 其余组合与跨 frame anchor 生命周期仍未完成。
2026-10-11 A2 preload 增量：React annotation runtime create-anchor draft marker point/number 派生（原
`Wy` 内 `dn/pn`）已迁移至 `src/main/browser-page-preload/annotation-draft-marker-state.ts`；入口继续
持有 DOM marker resolver 与 React render 生命周期，新增 `scripts/test-preload-annotation-draft-marker-state.mjs`
的 8 项 focused assertions，typecheck/build/verify-chunks 通过。React render/hook 其余组合与跨 frame
anchor 生命周期仍未完成。
2026-10-11 A2 preload 增量：React annotation runtime flex-gap/metadata/draft hover 与 cursor mode 派生（原
`Wy` 内 `an/on/sn/cn/ln/un`）已迁移至 `src/main/browser-page-preload/annotation-render-state-projection.ts`；
入口继续注入 overlay runtime、DOM snapshot/geometry 输入并持有 React render 生命周期，新增
`scripts/test-preload-annotation-render-state-projection.mjs` 的 12 项 focused assertions，typecheck/build/
verify-chunks 通过。React render/hook 其余组合与跨 frame anchor 生命周期仍未完成。
2026-10-11 A2 preload 增量：React annotation runtime active primary/additional geometry 与 screenshot-skip
gate（原 `Wy` 内 `Ut/Wt/Gt`）已迁移至 `src/main/browser-page-preload/annotation-active-geometry-projection.ts`；
入口继续注入 live element/frame resolver 与 page predicate，保留 DOM geometry、React render 与 screenshot
effect 生命周期，新增 `scripts/test-preload-annotation-active-geometry-projection.mjs` 的 8 项 focused
assertions，typecheck/build/verify-chunks 通过。`Qt/nn` 仍直接依赖当前 DOM geometry，暂由 owner 持有。
2026-10-11 A2 preload 增量：React annotation runtime active/editor/hover highlight 分支与 linked
additional highlights（原 `Wy` 内 `Qt/nn/$t/en/tn`）已迁移至
`src/main/browser-page-preload/annotation-highlight-state-projection.ts`；模块只组合注入的
`nd/dd/c_/J_` geometry adapters，入口继续持有 DOM 读取与 React render 生命周期，新增
`scripts/test-preload-annotation-highlight-state-projection.mjs` 的 10 项 focused assertions，typecheck/
build/verify-chunks 通过。effects/RAF/host IPC 仍保留在 React owner。
2026-10-11 A2 preload 增量：`Wy` host sync handler 的 React context state 字段归一化（原 `r(...)` updater）
已迁移至 `src/main/browser-page-preload/annotation-runtime-sync-state.ts`；入口继续持有 host subscription、
zoom-change RAF、cleanup 与 state side effects，新增 `scripts/test-preload-annotation-runtime-sync-state.mjs`
的 18 项 focused assertions，typecheck/build/verify-chunks 通过。剩余 frame-anchor observer 与 effects/IPC
生命周期仍未完成。
2026-10-11 A2 preload 增量：`Wy` 的 `lt` 单帧 viewport refresh 控制器已迁移至
`src/main/browser-page-preload/annotation-viewport-refresh-scheduler.ts`；模块负责 RAF coalescing、取消与
dispose gate，入口继续持有 React state setter、host subscription 与 observer 生命周期，新增
`scripts/test-preload-annotation-viewport-refresh-scheduler.mjs` 的 7 项 focused assertions，typecheck/build/
verify-chunks 通过。剩余 pointer/frame-anchor listeners 与 IPC effects 仍由 React owner 持有。
2026-10-11 A2 preload 增量：`Wy` visualViewport、跨 frame resize/scroll、scroll-container、overlay mutation
与 text-anchor observer 注册/清理顺序已迁移至 `src/main/browser-page-preload/annotation-anchor-observation-lifecycle.ts`；
入口继续注入 `dc/Pc/tb/du` 与 geometry callbacks，保留 React effect 依赖与 frame DOM owner，新增
`scripts/test-preload-annotation-anchor-observation-lifecycle.mjs` 的 10 项 focused assertions，typecheck/build/
verify-chunks 通过。pointer event handlers 与 host IPC effects 仍由 React owner 持有。
2026-10-11 A2 preload 增量：`Wy` host message type 分发、capability guard 与 callback 顺序已迁移至
`src/main/browser-page-preload/annotation-wy-host-message-dispatcher.ts`；state/ref/IPC 副作用均由入口注入，
保留 sync、screenshot、editor、design、selection、restore 分支语义，新增
`scripts/test-preload-annotation-wy-host-message-dispatcher.mjs` 的 20 项 focused assertions，typecheck/
build/verify-chunks 通过。pointer/frame-anchor lifecycle 已拆分，剩余业务 callback 仍由 React owner 提供。
2026-10-11 A2 preload 增量：`Wy` screenshot-ready effect 的 active-id 去重、RAF 调度/取消与 unmount dispose
已迁移至 `src/main/browser-page-preload/annotation-screenshot-ready-controller.ts`；入口每次 effect update 注入
当前 `gn`，保持 screenshot payload 与 host IPC 时序，新增 `scripts/test-preload-annotation-screenshot-ready-controller.mjs`
的 9 项 focused assertions，typecheck/build/verify-chunks 通过。text-preview CSS Highlight effect 与其他
host IPC callback 仍由 React owner 持有。
2026-10-11 A2 preload 增量：`Wy` CSS Highlight `Yt` 的 apply/replace/cleanup 生命周期已迁移至
`src/main/browser-page-preload/annotation-text-highlight-controller.ts`；入口继续注入 `pu` adapter，保留
`useLayoutEffect` 时序与 CSS Highlight/stylesheet DOM owner，新增
`scripts/test-preload-annotation-text-highlight-controller.mjs` 的 8 项 focused assertions，typecheck/build/
verify-chunks 通过。A2 早期“pointer/frame-anchor lifecycle 未完成”记录为历史快照；当前 listener/observer/
RAF/CSS Highlight teardown 已覆盖，剩余为业务 callback 的 state/DOM/IPC owner。
2026-10-11 A2 preload 增量：`Wy` host close-editor 分支的 interaction/ref/state cleanup 顺序与
target-matched editor reset 已迁移至 `src/main/browser-page-preload/annotation-editor-close-controller.ts`；
入口继续注入 `flushSync`、React setters、DOM interaction registry 与 IPC-adjacent cleanup，新增
`scripts/test-preload-annotation-editor-close-controller.mjs` 的 16 项 focused assertions，typecheck/build/
verify-chunks 通过。
2026-10-11 A2 preload 增量：`Wy` annotation suspension host-IPC 去重与 comment-mode guard（原 `bt`
effect event）已迁移至 `src/main/browser-page-preload/annotation-suspension-notifier.ts`；入口继续注入 host
bridge sender，并保留 keyboard handler 对 `ve.current` 的同步语义，新增
`scripts/test-preload-annotation-suspension-notifier.mjs` 的 8 项 focused assertions，typecheck/build/
verify-chunks 通过。selection modifier state effect 仍与 pointer/keyboard handler closure 绑定。
2026-10-11 A2 preload 增量：`Wy` 24891 design-modifier host-IPC effect 的 derived pressed 去重与 dispose gate
已迁移至 `src/main/browser-page-preload/annotation-design-modifier-notifier.ts`；入口继续计算 comment mode、
空编辑器、`canUseTweaks` 与 modifier state，并保持原始 `false` 初值（首次 false 不发送）。新增
`scripts/test-preload-annotation-design-modifier-notifier.mjs` 的 8 项 focused assertions，selection modifier
state effect 仍与 pointer/keyboard handler closure 绑定。
2026-10-11 A2 preload 增量：`Wy` host close-editor 分支的 interaction/ref/state cleanup 顺序与
target-matched editor reset 已迁移至 `src/main/browser-page-preload/annotation-editor-close-controller.ts`；
入口继续注入 `flushSync`、React setters、DOM interaction registry 与 IPC-adjacent cleanup，新增
`scripts/test-preload-annotation-editor-close-controller.mjs` 的 16 项 focused assertions，typecheck/build/
verify-chunks 通过。
2026-10-11 A2 preload 增量：`Wy` 跨 frame pointer/keyboard/click/wheel/blur 事件注册与注销集合已迁移至
`src/main/browser-page-preload/annotation-pointer-event-lifecycle.ts`；入口继续持有 handler closure、
`Te.disposeFrame` 与 `dc` frame lifecycle，新增 `scripts/test-preload-annotation-pointer-event-lifecycle.mjs`
的 15 项 focused assertions，typecheck/build/verify-chunks 通过。host IPC effects 仍由 React owner 持有。
2026-10-11 A2 preload 增量：React annotation runtime selected-id active view 派生（原 `Wy` 内
`wt/Tt/M/Et/Dt/Ot`）已迁移至 `src/main/browser-page-preload/annotation-active-view-projection.ts`；入口
继续持有 anchor resolution、React effects 与 render 生命周期，新增
`scripts/test-preload-annotation-active-view-projection.mjs` 的 12 项 focused assertions，
typecheck/build/verify-chunks 通过。React render/hook 其余组合与跨 frame anchor 生命周期仍未完成。
2026-10-11 A2 preload 增量：React annotation runtime 文本 selection preview 派生（原 `Wy` 内
`Jt/Yt/Xt/Zt`）已迁移至 `src/main/browser-page-preload/annotation-text-preview-state.ts`；入口继续
持有 CSS Highlight `useLayoutEffect` 生命周期，新增 `scripts/test-preload-annotation-text-preview-state.mjs`
的 12 项 focused assertions，typecheck/build/verify-chunks 通过。React render/hook 其余组合与跨
frame anchor 生命周期仍未完成。
2026-10-11 A2 preload 增量：React annotation runtime screenshot-ready payload 派生（原 `Wy` 内
`rn/Bt/Vt/Ht`）已迁移至 `src/main/browser-page-preload/annotation-screenshot-payload-projection.ts`；
入口继续持有 requestAnimationFrame、host IPC 与 screenshot effect 生命周期，新增
`scripts/test-preload-annotation-screenshot-payload-projection.mjs` 的 7 项 focused assertions，
typecheck/build/verify-chunks 通过。React render/hook 其余组合与跨 frame anchor 生命周期仍未完成。
2026-10-11 A2 preload 增量：React annotation runtime region overlay records（原 `Wy` 内 `qt`）已迁移至
`src/main/browser-page-preload/annotation-region-record-projection.ts`；入口继续持有 DOM geometry、
React render 与 overlay 生命周期，新增 `scripts/test-preload-annotation-region-record-projection.mjs`
的 7 项 focused assertions，typecheck/build/verify-chunks 通过。React render/hook 其余组合与跨
frame anchor 生命周期仍未完成。
2026-10-11 A3 main owner 复核：`Ust` 的 `Be`/`Ve`/`He`/`Ue` 绑定 BrowserWindow 可见性、
opacity、hotkey hide、window creation、deep-link navigation、notification dismissal 与 focus
顺序；worker `H9.handleMessage`/`handleWorkerMessage` 绑定 pending/WebContents 生命周期及
postMessage/broadcast 顺序，未发现不改变副作用顺序的独立纯策略，本轮保留 owner。
2026-10-11 A3 main/language-server 增量：Rust Analyzer 初始化 options projection 已迁移至
`src/main/main-app/language-server/rust-analyzer-options.ts`；`findSessionOptions` 继续持有
tool discovery、PATH/env、sysroot spawn/stat 与 session lifecycle，新增
`scripts/test-main-rust-analyzer-options.mjs` 的 2 项 focused assertions，typecheck 通过。
本轮 build 被并行 browser-page-preload.ts 的重复符号 `Jt` 阻塞，需 owner 修复后复跑。
2026-10-11 A3 main/language-server 增量：Pyright `findSessionOptions` 的 PATH/PYTHON 环境与
可选 `pythonPath` workspace configuration projection 已迁移至
`src/main/main-app/language-server/pyright-session-options.ts`；provider 继续持有 trusted
command/platform path/runtime 探测，新增 `scripts/test-main-pyright-session-options.mjs` 的
2 项 focused assertions，typecheck 通过。
2026-10-11 A3 main/language-server 增量：TypeScript language server 的 `tsserver` initialization
payload 已迁移至 `src/main/main-app/language-server/typescript-server-options.ts`；探测与文件
存在性检查仍由 `findInitializationOptions` 持有，新增
`scripts/test-main-typescript-server-options.mjs` 的 2 项 focused assertions。
2026-10-11 A3 main/language-server 增量：Java/JDTLS `findSessionOptions` 的
`JAVA_HOME`/`JDK_HOME`/PATH 环境 projection 已迁移至
`src/main/main-app/language-server/java-session-options.ts`；trusted command、platform path
与 runtime/workspace 探测仍由 provider 持有，新增 `scripts/test-main-java-session-options.mjs`
的 2 项 focused assertions。
2026-10-11 A3 main/language-server 增量：SourceKit-LSP 固定 Swift Package Manager
initialization payload 已迁移至 `src/main/main-app/language-server/sourcekit-options.ts`；
workspace directory/path 与 process discovery 仍由 provider 持有，新增
`scripts/test-main-sourcekit-options.mjs` 的 2 项 focused assertions。
2026-10-11 A3 main startup owner 复核：`dst` 内 `D/O/k` 绑定打包/开发资源 `existsSync` fallback，
`L/R` 绑定 nativeTheme/nativeImage/Dock 与异步资源下载，`oe/se` 绑定 BrowserWindow 延迟显示
timer/show/closed cleanup，`B/Hle/Eat/Pit` 为窗口/热键/dictation/appshot manager 组装入口；
未发现不复制副作用顺序的独立 registration/config projection，本轮保留 owner。
2026-10-11 A3 app-shell/hotkey owner 复核：`L9/cst/R9/z9` 已由 window-appearance 消费；
`Eat` 依赖 startup phase/powerMonitor/connection pending，`dat` 依赖 global state/native pet
webContents，`Pit` 依赖 Windows/native bridge/settings/window manager/query invalidation；
未发现可安全独立迁移的 config/payload projection，本轮保留 manager owner。

2026-10-11 A1 worker 增量：Git repo-changed debounce/emit lifecycle 已物理迁移至
`src/main/worker/git-repo-change-controller.ts`（commit `7ebe836a`），真实接回 worker watcher；
controller 持有 pending count、active emission、timer 去重、完成后重排与 dispose，入口继续注入
Git operation state、event payload、telemetry 和 emit。`scripts/test-worker-git-repo-change-controller.mjs`
覆盖计数、timer/emit 和 dispose。

2026-10-11 A1 worker 增量：Git watch session retry lifecycle 已物理迁移至
`src/main/worker/git-watch-retry-controller.ts`（commit `3babe952`），并在 `0c610f08` 修正 dispose
时 target retryTimer 清理；入口继续注入 target registration 与 session start。由
`scripts/test-worker-git-watch-retry-controller.mjs` 覆盖 exponential backoff、duplicate suppression、
session/disposed race、cancel 与 cleanup。A1 剩余 session close/recovery 仍与 watcher coverage、
Git host watcher dispose、telemetry 和 event ordering 绑定，尚无安全独立边界。

2026-10-11 A1 最终 owner 复核：`GitRepoWatcher.refreshMetadataDirectories`（约 68960）绑定
`changedMetadataDirectories` 批次、单飞 `metadataRefreshPromise`、dispose/retry waiter 与 target
session dispose/start；`refreshWorktreeDirectories`（约 68995）绑定 host `readDirectory`、generation
检查、missing/stale/new target partition、`watchTargets` mutation、session cleanup/retry。generation/
waiter 单独抽取会复制 promise/Map owner 或改变 dispose/restart 顺序，本轮不新增 facade。

2026-10-11 A1 worker 增量：Git watch session close lifecycle 已物理迁移至
`src/main/worker/git-watch-session-close-controller.ts`（commit `05baf39a`）；active-session race、
watch-error callback、session 清理、稳定阈值 retry reset、recovery update 与 retry scheduling 顺序
由 controller 持有，worker 继续注入 target/session/logger/recovery/retry callbacks。由
`scripts/test-worker-git-watch-session-close-controller.mjs` 覆盖 5 项 active/error/stable/stale race
断言。剩余 metadata refresh generation/waiter 仍与 promise、Map、Git I/O 和 dispose ordering 绑定。
2026-10-11 A1 worker 增量：metadata refresh 的 changed-path batch、single-flight waiter、首批
recovering/后续批次状态推进与 dispose 清理已物理迁移至
`src/main/worker/git-metadata-refresh-controller.ts`，真实接回 `GitRepoWatcher`；worker 仍持有
metadata target/session、worktree directory I/O、generation 与 recovery 副作用顺序。由
`scripts/test-worker-git-metadata-refresh-controller.mjs` 覆盖去重、single-flight、批次推进与
disposed gate。剩余 `refreshWorktreeDirectories` 的 readDirectory/generation/target mutation 仍为
watcher owner。

2026-10-11 A2 preload 增量：`Wy` 四个 pointer/drag/click 回调中重复的
`browser-sidebar-runtime-annotation-selection-modifier-state` host message 构造已迁移至
`src/main/browser-page-preload/annotation-selection-modifier-notifier.ts`；入口继续持有
`be.current`/`Oe`/anchor/shift-key 业务判定，notifier 保留原始每次发送语义并在 dispose 后抑制。
由 `scripts/test-preload-annotation-selection-modifier-notifier.mjs` 覆盖 6 项 focused assertions。
2026-10-11 A3 main startup 增量：窗口首次显示时 Windows opacity workaround 的纯判定已迁移至
`src/main/main-app/startup/window-presentation-policy.ts`，真实接回原 `Be2` consumer；入口继续持有
BrowserWindow 状态读取、`setOpacity(0)`、show/focus 与 `setImmediate` 恢复顺序。由
`scripts/test-main-window-presentation-policy.mjs` 覆盖 4 项 focused assertions。

2026-10-11 A1 worker 增量：`refreshWorktreeDirectories` 的完整 worktree target reconciliation 已迁移至
`src/main/worker/git-worktree-watch-refresh-controller.ts`，真实接回 `GitRepoWatcher`；controller 保留
host `readDirectory`、generation/missing gate、stale target dispose/removal、new target creation/session
start，以及 discovery failure 的 recovery/retry 顺序。由
`scripts/test-worker-git-worktree-watch-refresh-controller.mjs` 覆盖 9 项 focused assertions。

2026-10-11 A2 preload 增量：`Wy` host restore-editor 分支的 interaction、modifier、anchor point、pointer、
transient、hover 与 selection-hover 清理顺序已物理迁移至
`src/main/browser-page-preload/annotation-editor-restore-controller.ts`；入口继续注入 React refs/setters 与
`H_` restore adapter，保持原始 host message 副作用顺序。由
`scripts/test-preload-annotation-editor-restore-controller.mjs` 覆盖 12 项 focused assertions。

2026-10-11 A3 main 增量：`Qot.installApplicationMenuTitleBarOverlaySync` 的 platform/appearance gate、
nativeTheme `updated` 订阅、初次 overlay 应用与 cleanup 已物理迁移至
`src/main/main-app/startup/window-titlebar-overlay-sync.ts`；`Qot` 继续注入 BrowserWindow 与 zoom/overlay
计算，保持原始窗口生命周期顺序。由 `scripts/test-main-window-titlebar-overlay-sync.mjs` 覆盖 6 项 focused
assertions，typecheck/build/verify-chunks 通过。
2026-10-11 A2 preload 增量：`Wy` 的 `syncHover` 指针模式更新、DOM hover 命中优先级、pointer/hover
React state 与 fallback overlay 派生已物理迁移至 `src/main/browser-page-preload/annotation-hover-sync-controller.ts`；
入口通过注入 `Te.updatePointer`、DOM hover registry、`pl`/`Yy`/`ss` 与 React setters 保留原始
host-sync 条件和副作用顺序。由 `scripts/test-preload-annotation-hover-sync-controller.mjs` 覆盖
browse guard、fallback、DOM-hover 优先级、pointer cleanup 与 dispose gate。
2026-10-11 A2 preload 增量：`Wy` host `syncPointerMode` callback（`nt`）已物理迁移至
`src/main/browser-page-preload/annotation-pointer-mode-sync-controller.ts`；入口继续注入 DOM
interaction registry 的 `setEnabled`/`invalidate`，保留 annotation API、comment、suspension、agent
控制与 zoom 变化判定。由 `scripts/test-preload-annotation-pointer-mode-sync-controller.mjs` 覆盖
启用/禁用、zoom invalidate、agent gate 与 dispose gate。
2026-10-11 A2 preload 增量：`Wy` host sync 的 `disposeCommentInteraction` 分支固定的 interaction、modifier、
pointer、hover、selection、transient、generation 与 drag 清理顺序已物理迁移至
`src/main/browser-page-preload/annotation-comment-interaction-disposal-controller.ts`；入口继续注入各
React/ref/DOM 清理 owner。由 `scripts/test-preload-annotation-comment-interaction-disposal-controller.mjs`
覆盖完整顺序与重复 dispose 行为。
2026-10-11 A2 preload 增量：`Wy` prepared screenshot comment 的 prepare、active-comment reconcile、clear
与 dispose 生命周期已物理迁移至 `src/main/browser-page-preload/annotation-prepared-screenshot-controller.ts`；
入口继续注入 React state setter，host clear-preview IPC（`ft`）保持独立。由
`scripts/test-preload-annotation-prepared-screenshot-controller.mjs` 覆盖保留、过期清理、主动清理与
dispose gate。

2026-10-11 A3 main 增量：`Qot.installDisplayChangeGeometryRefresh` 的 macOS display-added/removed/
display-metrics-changed 订阅集合与 cleanup 已物理迁移至
`src/main/main-app/startup/display-change-geometry-refresh.ts`；`Qot` 继续注入现有窗口几何刷新回调，保持
display 事件与窗口关闭时的注销顺序。由 `scripts/test-main-display-change-geometry-refresh.mjs` 覆盖 5 项
focused assertions。

2026-10-11 A3 main 增量：`Qot.trackPrimaryWindow` 的 primary set 注册、初始 active 选择、focus/blur 时间戳
更新与 change emission 已物理迁移至 `src/main/main-app/window/primary-window-tracking.ts`；`Qot` 继续注入
primary 状态容器与窗口事件回调，保持原始 focus/blur 顺序。由
`scripts/test-main-primary-window-tracking.mjs` 覆盖 7 项 focused assertions。

2026-10-11 A3 main 增量：`Qot.installWebContentsDiagnostics` 的 renderer crash/unresponsive/did-fail-load
事件订阅、fatal report、recovery attempt reset 与 primary-window gone 通知已物理迁移至
`src/main/main-app/window/web-contents-diagnostics.ts`；`Qot` 继续注入 recovery、ready-set 和 IPC owner，保持
原始事件分支顺序。由 `scripts/test-main-web-contents-diagnostics.mjs` 覆盖 10 项 focused assertions。
2026-10-11 A2 preload 增量：`Wy` host sync 的 `cancelUnavailableSiteInteraction` 分支已物理迁移至
`src/main/browser-page-preload/annotation-unavailable-site-interaction-controller.ts`；controller 保留
`Te.cancel()` 条件性标记 viewport selection、随后关闭 pointer mode 的顺序，入口继续注入 interaction
registry/ref/state owner。由 `scripts/test-preload-annotation-unavailable-site-interaction-controller.mjs`
覆盖 true/false cancel、顺序与 dispose gate。
2026-10-11 A2 preload 增量：`Wy` 的 `setSelectionModifier` callback（`yt`）已物理迁移至
`src/main/browser-page-preload/annotation-selection-modifier-controller.ts`；controller 保留 modifier
active/clear、create-element/text guard、pointer/Ce guard、DOM live-element hit-test、document focus、
anchor/hover projection 与失败清理顺序，入口继续注入 React/ref/DOM owner。由
`scripts/test-preload-annotation-selection-modifier-controller.mjs` 覆盖 disable 清理、成功命中、失败
命中与 dispose gate。
2026-10-11 A2 preload 增量：`Wy` 的 `removeAnnotationSelection` callback（`dt`）已物理迁移至
`src/main/browser-page-preload/annotation-remove-selection-controller.ts`；controller 保留 multi-select
与 create-element guard、primary/additional anchor 索引解析、`al` 投影及 `ut` 更新顺序，入口继续注入
editor state 与 anchor update owner。由 `scripts/test-preload-annotation-remove-selection-controller.mjs`
覆盖有效/无效索引、能力与 target guard、dispose gate。
2026-10-11 A2 preload 增量：`Wy` 的 `retryCreateCommentAtPoint`/`retryOpenDesignEditorAtPoint` callbacks（`it`/`ct`）RAF retry 生命周期已物理
迁移至 `src/main/browser-page-preload/annotation-point-retry-controller.ts`；controller 保留初始调度、最多
两次重试、成功短路和 dispose 时取消 pending frame，入口继续注入 `rt` point action。由
`scripts/test-preload-annotation-point-retry-controller.mjs` 覆盖三次尝试、成功短路、pending cancel 与
dispose gate。

2026-10-11 A1 worker 增量：`GitRepoWatcher.dispose()` 的 disposed gate、ignore policy/session 清理、repo/retry/
metadata controller dispose、watch target 与 ignore map 清空，以及 pending metadata promise 的幂等汇合已物理
迁移至 `src/main/worker/git-repo-watcher-dispose-controller.ts`；worker 继续注入具体 session/I/O owner。由
`scripts/test-worker-git-repo-watcher-dispose-controller.mjs` 覆盖 10 项 focused assertions。

2026-10-11 A1 worker 增量：`GitRepoWatcher.disposeSession` 的 generation bump、retry cancel、session/start promise
清理、session dispose 错误降级、幂等 dispose promise 与 recovery 更新已物理迁移至
`src/main/worker/git-watch-session-dispose-controller.ts`；worker 继续注入具体 watcher session 与日志 owner。
由 `scripts/test-worker-git-watch-session-dispose-controller.mjs` 覆盖 8 项 focused assertions。
2026-10-11 A2 preload 增量：`Wy` 的 `createCommentAtPoint` callback（`rt`）点选优先级已物理迁移至
`src/main/browser-page-preload/annotation-point-selection-controller.ts`；controller 保留 editor focus、
captured point freshness/select/fallback、interaction registry select、DOM hit-test、anchor projection 与
`qe` open 顺序，入口继续注入当前 context 和 editor IPC/state owner。由
`scripts/test-preload-annotation-point-selection-controller.mjs` 覆盖各优先级、fallback 与 dispose gate。
2026-10-11 A2 preload 增量：`Wy` 的 `openDesignEditorAtPoint` callback（`st`）已物理迁移至
`src/main/browser-page-preload/annotation-design-point-selection-controller.ts`；controller 保留 editor
focus、captured design element/anchorState 分支、design-mode DOM hit-test、anchor projection 与 `Ze`
open 顺序，入口继续注入当前 context 和 design editor owner。由
`scripts/test-preload-annotation-design-point-selection-controller.mjs` 覆盖各优先级、mode 透传与
dispose gate。
2026-10-11 A2 preload 增量：`Wy` 的 `createCommentFromSelection` callback（`at`）selection/fallback
orchestration 已物理迁移至 `src/main/browser-page-preload/annotation-selection-comment-controller.ts`；controller
保留 editor focus、prepared text selection 优先级、selection ref 清理、`ou()` 回退、`gu()` 清理和
`rt`/`Je` 分支顺序，入口继续注入当前 editor、selection 与 point retry owner。由
`scripts/test-preload-annotation-selection-comment-controller.mjs` 覆盖 focus、selection open、fallback retry
与 dispose gate。

2026-10-11 A1 worker 增量：`GitRepoWatcher.refreshWorkingTreeWatchPolicy` 的 session barrier、ignore policy
freshness/retry gate、apply/skip 决策与 watcher dispose/restart recovery 已物理迁移至
`src/main/worker/git-working-tree-watch-policy-refresh-controller.ts`；worker 继续注入 ignore policy、Git
session 和 file-event owner。由 `scripts/test-worker-git-working-tree-watch-policy-refresh-controller.mjs` 覆盖
10 项 focused assertions。

2026-10-11 A1 worker 增量：`GitRepoWatcher.tryStartWatchSession` 的 disposed/registered gate、session dispose 等待、
start promise 去重、generation race、retry scheduling 与 promise cleanup 已物理迁移至
`src/main/worker/git-watch-session-start-controller.ts`；worker 继续注入 `startWatchSession` Git I/O owner。由
`scripts/test-worker-git-watch-session-start-controller.mjs` 覆盖 9 项 focused assertions。
2026-10-11 A2 preload 增量：`Wy` 的 text-anchor `Je` editor-open lifecycle 已物理迁移至
`src/main/browser-page-preload/annotation-text-anchor-editor-controller.ts`；controller 保留 interaction
clear、comment preview close、open-editor IPC、viewport refresh、editor state、hover/selection cleanup
顺序，入口继续注入 React/ref/host owners。由
`scripts/test-preload-annotation-text-anchor-editor-controller.mjs` 覆盖 text guard、preview 分支、
payload/state 与 dispose gate。
2026-10-11 A2 preload 增量：`Wy` 的 `pt` editor/comment reconciliation callback 已物理迁移至
`src/main/browser-page-preload/annotation-editor-comment-reconciliation-controller.ts`；controller 保留
null state、design target、无 `commentId` target 与 stale comment 清理 predicate，入口继续注入 React
editor state setter。由 `scripts/test-preload-annotation-editor-comment-reconciliation-controller.mjs`
覆盖保留/清理各 target 分支与 dispose gate。

2026-10-11 A1 worker 增量：`GitInitWatcher.scheduleReconnect` 的 timer 去重、指数退避、startSessions 成功复位、
失败重排与 dispose 清理已物理迁移至 `src/main/worker/git-init-reconnect-controller.ts`；watcher 继续注入
session 启动与日志 owner。由 `scripts/test-worker-git-init-reconnect-controller.mjs` 覆盖 8 项 focused
assertions。

本轮新增 `annotation-editor-anchor-restore-controller.ts`，真实接回 Wy 的 `vt` restore-editor anchor lifecycle；focused test 为 `scripts/test-preload-annotation-editor-anchor-restore-controller.mjs`。

本轮新增 `git-init-watcher-start-controller.ts`，真实接回 `GitManager.startGitInitWatcher`；controller 保留
watcher 构造、active ownership 注册、started/failed/superseded 分类与 dispose 清理；focused test 为
`scripts/test-worker-git-init-watcher-start-controller.mjs`。
# 本轮新增：git-repo-watch-event-controller

- `GitManager.createRepoWatch` 的 repo-change event consumer 已迁移至 `src/main/worker/git-repo-watch-event-controller.ts`，并移除旧的未使用 `legacyRepoWatchEvent` 死代码。
- controller 保留 active watch identity guard、working-tree path filtering/full invalidation、Git cache invalidation、live-query fanout、performance/raw-event accounting、trace 与 emit 顺序；focused test、typecheck、build、chunk/shared audit 均通过。
# 本轮新增：git-worktree-delete-lifecycle-controller

- `GitManager.deleteWorktreeWithLimit` 的 worktree identity、snapshot/delete operation、成功/失败日志与错误传播已迁移至 `src/main/worker/git-worktree-delete-lifecycle-controller.ts`。
- consumer 继续注入 snapshot/delete implementation 与 manager host owner；focused test、typecheck、build、chunk/shared audit 均通过。
# 本轮新增：git-live-query-attribution-controller

- `GitManager.runLiveQueryWithAttribution` 的 outer trace、request attribution、首结果计时、结果映射、异常 disposition、performance finally 与 attribution cleanup 已迁移至 `src/main/worker/git-live-query-attribution-controller.ts`。
- active 路径已移除旧的 `runLiveQueryWithAttributionLegacy` 死代码；focused test、typecheck、build、chunk/shared audit 均通过。
# 本轮新增：git-request-finalization-controller

- `GitManager.handleRequestWithContext` 的 request finally cleanup 已迁移至 `src/main/worker/git-request-finalization-controller.ts`，保留 untracked/read-cache invalidation、mutation cache refresh、repository/live-query refresh 与 `requestLifecycle.finish` 顺序。
- exact invalidation 异常时跳过后续 finish 的原始语义保持不变；focused test、typecheck、build、chunk/shared audit 均通过。
# 本轮新增：git-request-completion-controller

- `GitManager.handleRequestWithContext` 的 post-finalization cancellation/failure/response completion 已迁移至 `src/main/worker/git-request-completion-controller.ts`，保留 cancellation telemetry、failure outcome、response envelope、performance emission 与 worker-response emit 顺序。
- focused test、typecheck、build、chunk/shared audit 均通过。
# 本轮新增：git-request-admission-controller

- `GitManager.handleRequestWithContext` 的 request admission、tracked lifecycle begin 与 pre-cancelled cancellation telemetry/early return 已迁移至 `src/main/worker/git-request-admission-controller.ts`。
- 保留 `operation == null` 时的 canceled outcome 语义；focused test、typecheck、build、chunk/shared audit 均通过。
# 本轮新增：thread-read-state-controller

- `createHostThreadReadState` 的 host unread-thread subscription、open generation、retired retry、identity/host-key guard、pending event reconcile、异步 set 与 dispose lifecycle 已迁移至 `src/main/main-app/conversation/thread-read-state-controller.ts`。
- `host-assembly.ts` 删除旧的 156 行内嵌实现，仅保留 controller consumer/import；focused test、typecheck、build、chunk/shared audit 均通过。

# 本轮新增：native-context-menu lifecycle

- `Qot.installNativeContextMenu` 的图片右键菜单构造、file URL reveal、copy/save visual-content telemetry
  与 window-close cleanup 已迁移至 `src/main/main-app/window/native-context-menu.ts`；窗口 manager 继续注入
  Electron context-menu factory、shell/window side effects 与 inspect 开关，保持原菜单顺序、main-frame save gate
  与 disposer 顺序。
- `scripts/test-main-native-context-menu.mjs` 覆盖非图片旁路、file URL reveal、copy/save callback、跨 frame
  save gate 与幂等 cleanup，共 10 项 focused assertions；build、verify、typecheck、diff-check 均通过。

# 本轮新增：dynamic-app-tool-pending-responses registry

- `HostRequestRouter` 的动态 app-tool pending response identity、success/error/invalid route、cancel/discard
  与 dispose rejection 已迁移至 `src/main/main-app/app-server/dynamic-app-tool-pending-responses.ts`。
- `scripts/test-dynamic-app-tool-pending-responses.mjs` 覆盖 7 项 duplicate identity、路由与清理断言；build、verify、shared audit、diff-check 均通过。

# 本轮新增：parcel-watcher-runtime

- worker Parcel watcher 的 root/supplemental subscription、directory-check queue、串行 subscription operation、
  close/closed deferred 与 error/root-deleted lifecycle 已迁移至 `src/main/worker/parcel-watcher-runtime.ts`，
  `j9` 已真实接回 `startParcelWatcher`。
- `scripts/test-worker-parcel-watcher-runtime.mjs` 覆盖 8 项生命周期断言；focused、typecheck、build、verify、shared audit、diff-check 均通过。

# 本轮新增：open-in-target-command-registry

- `lCe` 的 open-in target command detection 单飞缓存已迁移至
  `src/main/worker/open-in-target-command-registry.ts`，保留
  `JSON.stringify([target, customTarget.command])` key、同 key promise 复用及 rejected probe 清理/retry；
  icon semaphore、target detection 与 worker response owner 仍由 `lCe` 持有。
- `scripts/test-worker-open-in-target-command-registry.mjs` 覆盖 7 项 key、single-flight、custom command
  隔离和失败重试断言。

# 本轮新增：Windows native app icon cache

- `qwe` 的 native app icon bounded LRU/single-flight registry 已迁移至
  `src/main/worker/windows-native-app-icon-cache.ts`；worker 继续持有 path normalization、addon loader、
  timeout 与 telemetry，保留 100 项上限、空结果/失败清理和淘汰后同 key 重建语义。
- `scripts/test-worker-windows-native-app-icon-cache.mjs` 覆盖 8 项 single-flight、identity cleanup、失败
  retry 与 LRU 断言。

# 本轮新增：GitHub user-attachment URL cache

- PR body user-attachment asset-id URL cache 已迁移至 `src/main/worker/github-user-attachment-url-cache.ts`；
  worker 保留 JWT expiry 解析与 body rewrite，cache 保留 60 秒提前失效阈值和过期 URL overwrite。
- `scripts/test-worker-github-user-attachment-url-cache.mjs` 覆盖 5 项命中、提前失效和 key 隔离断言。

### A1 扫描结论：filesystem discovery caches preserve-coupled

Linux desktop-entry `W7/CTe` 与 JetBrains Toolbox `y9/OEe` 均保留：cache key/TTL 或 memoization 绑定
XDG/platform 环境、同步 filesystem scan 和 parse/discovery owner，当前没有不复制 invalidation 状态的
独立 lifecycle 边界。

# 本轮新增：GitHub CLI rate-limit gate

- GitHub CLI secondary-rate-limit 的 per-host backoff、single-flight 等待、AbortSignal 竞态与 promise
  identity cleanup 已迁移至 `src/main/worker/github-cli-rate-limit-gate.ts`；worker 的 `Y6/X6/Mbe`
  仍持有命令执行、重试策略和结果 owner。
- `scripts/test-worker-github-cli-rate-limit-gate.mjs` 覆盖 6 项空 gate、release、abort 与 replacement
  cleanup 断言。

# 本轮新增：Git process lock registry

- Git command per-key process lock 的等待、lease `track/close`、deadline/AbortSignal gate 与 identity cleanup
  已迁移至 `src/main/worker/git-process-lock-registry.ts`；worker 仍负责 spawn、timeout 与进程 owner。
- `scripts/test-worker-git-process-lock-registry.mjs` 覆盖 7 项 release、tracked wait、abort 和 timeout 断言。

### A1 扫描结论：query fetch/fsmonitor caches preserve-coupled

w1/C1 被多个 query handler 注入并绑定 QueryClient 与 abort fan-out；`$1` fsmonitor cache 绑定 Cpe/t0、
host environment、expiry timer 和 query execution。本轮均保留，未抽 facade。

### A1 扫描结论：computer-use dispatcher preserve-coupled

`sCe` 的 capture/service RPC、response envelope、logger、service dependencies、递归 update polling 与
error emission 交织；continuation policy 已抽出，剩余 owner 生命周期本轮保留。
# 2026-10-14 继续实现记录

- renderer `library-cloud-file-preview` 已从仅状态分派推进到真实内容消费：新增可取消、带 generation guard 的 preview content loader，接入既有下载读取器、ArtifactTabContent、LibraryJsonPreview 和默认下载回调；focused loader 15、preview state 24、artifact flow 86，typecheck 通过。
- worker `GitRepoWatcher.startWatchSession` 已迁移到 `git-repo-watch-session-runtime.ts` 并真实接回，保留 metadata recovery、ignore snapshot、session close/retry 和 stale generation 语义；focused 18 项。
- preload pointer interaction controller 目前仍是未接回的草稿，不能计入完成度；下一步需要把 Wy 的 394 行 effect 精确替换并补消费端回归。
- preload global input tracking 已单独完成真实接回：Wy 的跨 frame key/mouse/blur 生命周期迁移至 `annotation-global-input-tracking.ts`，focused 8 项和 typecheck 通过；pointer selection/hover/region-drag 主 effect 仍未迁移。
- worker `GitIgnorePolicy` lifecycle 替换已收尾：`GitRepoWatcher` 继续真实实例化语义模块，旧 `Xye`
  generation/read/refresh/retry/dispose 实现及专用常量已删除；focused lifecycle coverage 扩至 37 项，
  覆盖 single-flight read、stale generation、initial/recovery backoff、recovery 通知与 dispose barrier。
- worker Git manager request classification boundary 已完成替换：live-query `resolveQueryRoot` 最后一个 consumer
  直接接回 `resolveRequestRoot`，删除 `obe`/`ube`/`B6`/`sbe`/`cbe`/`lbe` 六个 generated wrapper 及约
  170 行不可达旧 classification owner；context/invalidation focused coverage 扩至 42/50 项。
- worker Git manager stable-root cache lifecycle 已迁移至 `git-stable-root-cache.ts` 并真实接回：新 owner
  统一持有 generation gate、TTL timer、replacement token、LRU touch、容量淘汰与 clear/delete；Yhe 的
  `stableRootByKey` 和四个内联 cache 方法已删除，focused lifecycle coverage 为 25 项。
- worker Git stable-metadata retry lifecycle 已迁移至 `git-stable-metadata-retry-controller.ts` 并接回
  manager：新 owner 持有 retry Map、cooldown/expiry、timeout cached-root fallback、error normalization 与
  refresh/invalidation 计划执行；原 Map 和两个内联 throw handler 已删除，focused coverage 为 29 项。
- worker Git stable-metadata resolver lifecycle 已迁移至 `git-stable-metadata-resolver.ts` 并真实接回：新 owner
  持有 pending trace identity、combined resolve/fallback、分步 trace、generation-aware cache write 与 overlap
  cleanup；manager 删除原 pending trace Map 和内联 async workflow，focused coverage 为 20 项。
- worker Git manager app/turn cache lifecycle 已迁移至 `git-manager-cache-lifecycle.ts` 并真实接回：新 owner
  持有 background/foreground 状态、turnComplete invalidation、selected worktree/commonDir fan-out 与 unknown
  commonDir fallback；manager 删除 background flag 和两个内联 workflow，focused coverage 为 16 项。
- worker Git repository/worktree registry 已整体迁移至 `git-repository-registry.ts` 并真实接回：新 owner
  持有三个 registry Map、local root normalization、get/create identity、commonDir mapping/clear，以及
  host/cwd/mutation/repo-change cache invalidation；manager 删除 93 行旧 owner，focused coverage 为 43 项。
- worker Git watch registry/setup/git-init coordination 已整体迁移至 `git-watch-registry-controller.ts` 并真实接回：
  新 owner 持有 watch/setup Map、active/desired init watch、handled watcher 与 refresh single-flight 状态，统一
  current-watch/setup/init recovery/dispose 竞态；manager 删除六个旧字段和内联协调，focused coverage 为 55 项。
- worker GitRepoWatcher residual state/event owner 已迁移至 `git-repo-watcher-state-controller.ts` 并真实接回：
  新 owner 持有 targets、ignore-source、pending paths、head-ref/git-dir 状态，统一 discovery/reconcile、policy
  refresh、batching、repo-change emission 与 clear；旧 watcher 删除 157 行，focused coverage 为 41 项。
- worker `ibe.handleRequestWithContext` 的 77-case request dispatch 已整体迁移至
  `git-worker-request-dispatcher.ts` 并真实接回：原 376 行 switch 已删除，case 顺序及 await/response/performance/
  refresh/error 语义保持不变；consumer 剩余 context/admission/finalize/completion wiring，focused coverage 为 22 项。
- worker `ibe.handleRequestWithContext` 的剩余 293 行 request runtime 已整体迁移至
  `git-worker-request-runtime.ts`：context bags、admission、availability、dispatch、catch、finally 与 completion
  顺序均由新 owner 持有，manager method 仅余 3 行稳定委托；runtime focused coverage 为 17 项。
- A1 Git manager/watch/session 全局 owner 复核完成：明确大型 lifecycle/controller 待迁清单清零；host assembly、
  transport、query/fsmonitor 与 command/filesystem I/O 等已登记 preserve-coupled 组合根不计为未完成 owner。
