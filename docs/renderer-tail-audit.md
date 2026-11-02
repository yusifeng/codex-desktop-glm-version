# Renderer 尾部资产审计

2026-11-02 Settings plan/query runtime recovery：Usage 不再依赖默认隐藏或静态 plan，现从真实 usage
query、credit balance 与 `dS` plan hook 读取 visible/loading/plan；Analytics、enterprise label、Consumer
View 和 Code Review 按发布版 plan predicate、experiment gate 与 activity query 组合。Profile 接回实时
visibility/loading contract，Trusted Contact 则执行 account-scoped enabled query，并在 loading/error 时保持
正确的 route redirect 语义。同批修复两个此前会在真实请求时暴露的契约错误：`command-menu-client.i`
恢复发布 ABI `(userId, accountId)`，query key 和两个 account header 不再错用 user id；Code Review query
恢复 `/wham/analytics/daily-code-review-metrics` 的真实 queryFn、日期范围、auth/scope/polling 规则。
新增 focused 24 项，既有 Usage/Profile/Trusted Contact 229 项、typecheck、strict hub、1,912-script index、
1,888/1,888 build/verify 均通过。其余 feature-specific Settings 展示差异继续按各 owner 审计，不据此
宣称整项目完成。

2026-11-02 Settings eligibility recovery：`use-visible-settings-sections` 在 surface/host 路由之外恢复了
发布版 section eligibility 的确定性关闭矩阵，并按发布顺序将 eligibility 与 surface/remote-host 做 AND，
不再让局部 `visible=true` 越过宿主限制。Account/Voice capability、Appshots、notifications/parental auth、
Import experiment/remote mode、Codex Micro availability 和 Debug gate 现均读取真实公共 ABI；pending/error
状态会阻止过早重定向并控制 route content。focused settings application cluster 从 44 增至 61 项断言，
typecheck 与 strict hub gate 通过。该批当时尚缺的 Usage/Analytics/Profile/Trusted Contact plan/query
组合已由上面的 follow-up 恢复；这条保留为阶段性历史记录。

2026-11-02 Codex Home announcements runtime recovery：`codex-home-announcements-current` 不再把
`D0t` initializer 误当生产 override hook，也不再插入发布候选序列不存在的 synthetic recap entry。
Home 候选现在执行全局 disabled signal、focused-source context、gift/voice/import/worktree/history/replay
串行门控；产品 Beacon 会排在六个 vanilla candidates 之前，并按 `shouldSuppressVanillaPromos` 及
`show_after_onboarding` 控制后续展示，同时恢复 composer-text/voice actions。Codex Home Fast Mode
会从真实 model query、model settings、tier policy、persisted seen-state 和 personalized estimate ABI
构造候选并调用真实 tier mutation。focused suite 由 12 增至 18 项；typecheck 与 strict hub gate
（新增公开消费 app-shared 1、app-initial 6、app-primary 1，0 invalid）通过。该批恢复候选状态机和
生产行为，不把尚未恢复的特殊 Beacon modal 分类/完整发布视觉组合计作完成。

2026-11-02 Automations/settings live-state recovery batch（进行中）：`automations-page` 的生产路径不再
默认落到空 `presentation`。页面现在通过发布 ABI `app-shared.BX/HX` 与
`app-initial.Xet/yun/QCt/itt/MC` 读取 local/cloud capability、当前 account、本地/云端任务、
运行历史、未读状态和 retry/mark-all-read 操作，并把历史记录按 automation id 接回详情页；测试注入
仍只用于 focused contract。`use-visible-settings-sections` 同时不再把 build flavor 静态写死为 Codex，
而是读取发布版 `LS/gmn/Sht/htt` surface signals、`Wgn` host-aware plugin visibility 与 `MT` 默认路由。
本批随后接回 local `iun(automation-create|update|delete|run-now)` mutation factory 和原版
`Ftt/Vtt/Btt` request builders；cloud create/update/delete 则恢复 `dtt/ptt/att` mutation signals 与
`htt` request serializer。生产页面的创建/编辑保存、立即运行、暂停/恢复和删除不再是无回调按钮。
follow-up 又按发布 ABI 恢复了历史会话 archive/unarchive、单条 mark-read/mark-unread、会话导航和
inbox query invalidation；批量归档使用独立 settled 结果，单条失败不会中断其余记录。Habitat migration
owner 的公开契约也已纠正为 `n=query signal`、`r=consent visibility signal`、`t=lazy initializer`，页面会读取
真实迁移 query 并为当前 account/user 打开 consent state。focused automations 40 项、automation infrastructure
cluster、settings cluster 44 项、typecheck、strict hub gate、1,911-script index、1,888/1,888 renderer
verify 和 12,448/12,448 full check 通过。发布页面更丰富的 detail/editor 视觉组合仍需继续恢复，因此不把这些运行链路已接通误报为
Automations 全量完成。

2026-11-02 Hub public-ABI correction batch：消费审计现在区分 TypeScript 类型成员与真实运行时引用，
并校验每个命名/namespace consumer 确实存在于 Hub 的公开 export table。审计发现此前多个恢复模块
误把发布 chunk 内部的压缩局部名当作公共 alias；已修正 Codex Home announcement、Home Beacon、
sidebar onboarding、worktrees/hooks/general/plugin settings 等运行路径，并删除 automations/settings
中不存在的注入契约。严格真实消费数为 app-shared 370/3,185、app-initial 1,481/8,204、
app-primary 168/917，三者均为 0 unreviewed、0 invalid consumers。该校验已进入 renderer 正式构建，
会在写入 packaged assets 前拒绝无效 ESM binding；manifest strict gate 同样拒绝无效 consumer。
这里修复的是运行时 ABI 与证据可信度，并不把 automations 或 settings 的静态 fallback 误报为完整恢复。

2026-11-02 Hub coupled-runtime extraction batch：修正 namespace destructuring 审计器允许
`[\s\S]*?` 跨越前一个对象解构的问题；这类跨 hub 串线曾把 app-shared/app-initial 的别名
错误算进后续 hub。真实消费面现在为 app-shared 375/3,185、app-initial 1,483/8,204、
app-primary 177/917，三者仍为 0 unreviewed。迁移同时不再停留在纯函数：browser-comment
tab URL reactive state、context/handler 注册、按 tab 接受、readiness listener、timeout、AbortSignal 与 submit promise
整个耦合状态簇已恢复到 `app-primary-browser-comment-runtime`，并打包进既有
`source-annotation-host-registry` owner；app-primary 内部注册和 detached annotation consumer
使用同一模块实例，公开别名 `Bs/Gs/Hs/Ks/Rs/Us/Vs` 均有精确语义 owner。路径 basename 与会话
readiness 也已从 hub 直接消费切到 TypeScript owner。focused 22 项、typecheck、12,448/12,448
build-check、1,888/1,888 renderer verify 和 11/11 main verify 通过。

2026-11-02 Hub evidence/usage contract batch：修正聚合 hub 消费审计器把正则字面量中的
`\w` 二次转义的问题；真实命名、namespace destructuring 与 typed-cast 消费数现在分别为
app-shared 432/3,185、app-initial 1,621/8,204、app-primary 214/917，三者仍为 0 unreviewed。
exhaustive manifest 与 classification gate 复用同一消费解析器，避免两套统计互相矛盾。
`renderer-hub-line-classification.json` 同时移除 838 条历史重复记录（494 个重复 key），严格
gate 以后拒绝重复 key，并要求每个 `semantic-business-logic` 的公开 alias、内部 source symbol
与记录源码区间精确对应；29 个因格式化行号漂移的 semantic 区间已按真实定义修复，skill
label 的 `go/ho` 错位也已纠正。核对过程中发现 `usage` 把 `app-primary.Pm` 误声明成百分比
getter；发布实现实际是 rate-limit warning 的 account/spend/reset cache key。当前 owner 改为直接
消费 `accountSpendKey`，dismissal key 和阈值类型恢复发布契约，focused usage/checkout 50 项通过。
全量 typecheck、main build-check、renderer source/semantic gates、1,888/1,888 renderer verify 与
11/11 main verify 均通过。这一批提高 hub 剩余证据可信度，但 3 个大型 hub 仍是后续迁移边界。

2026-11-02 Conversation route source closure 收官批次：最后 35 个 compatibility
模块（157,630 格式化行、约 5.8 MB）不再作为 `src/renderer-recovered/conversation-route`
发布 JS 图参与运行。Activity/Billing/Imported setup 保留发布依赖顺序，但 Recharts/D3 与
visualization shim 副作用边已由 preserved TypeScript source 提供；Google Logo 和 Unicode layout 改由已有语义 TypeScript owner
输出；其余 33 个经过审计的 Recharts/D3、Three、date/phone/form、QR、generated icon/image
边界迁到 `src/renderer-preserved/route-runtime/*.ts`，由 renderer build 明确编译。source-build gate
同时要求 compatibility=0、preserved manifest/磁盘/TypeScript 编译三者一致。当前构建报告
`0/0 recovered compatibility`、`33/33 preserved vendor/generated`、`1888/1888 rewritten`；这清除了
conversation-route 的原始 JS 运行回退，但 preserved main/renderer 的其余清单与完整 E2E 矩阵仍需继续。

2026-11-02 Realtime voice 收官批次：`mark-session-create` 与
`realtime-voice-controls-surface` 的合计 8,209 行发布 owner 已进入直接 TypeScript 源构建，
不再由 `exact.js` 或构建时回拷拥有输出。为避免在 69/41 项短导出均有真实消费者时引入行为
漂移，本批保持发布行为，恢复 voice availability、session create/reset/timing、command dispatch，
以及浮动 voice/pet/quick-chat 控件、几何布局、activity 与无障碍文案契约；新增专项 ABI/source
contract，并通过 typecheck、604 个 semantic overrides 和 renderer source build。严格 exact owner
清单由 2 个 / 8,209 行降至 0。这里的“严格清零”只表示 renderer exact owner 清零，**不等于
完整项目已经反编译完成**；preserved main/renderer 的其余边界和完整 E2E 矩阵仍按总目标继续处理。

2026-11-02 Artifact source bootstrap 大批次：`artifact-source-bootstrap` 不再保留
15,318 行发布版 owner。可维护 TypeScript 恢复 artifact header/layout/zoom、worker transport、
external store、viewport camera、hidden textarea、文本 layout/hit-test/selection、pointer click、
image upload、insert menu 与 alignment icons；约 12,000 行 Office preset shape 纯数据拆为
可再生的 checked-in TypeScript 模块，运行时不再回拷原 JS，同时继续向 workbook runtime
安装完整 shape catalog。发布版 79 项短导出 ABI 保持不变，新增 50 项 focused contract，
并通过 build/verify。严格剩余由 3 个 / 23,539 行降至 2 个 / 8,221 行。

2026-11-02 Popcorn 编辑器 surface 大批次：`text-underline-icon` 与
`popcorn-electron-surface-style` 不再保留合计 10,191 行发布版 owner。可维护 TypeScript
恢复 presentation/document toolbar、shape/font/color inspector、页码导航与 underline 图标；
同时恢复 sortable 几何策略、批注 marker/ordinal/collision、drawing stroke/crop/screenshot、
评论/presence UI、artifact badge、格式控件、CRDT bootstrap/restore 和 Codex surface theme。
发布版 37/65 项短导出 ABI 保持不变，新增 58 项 focused contract，并通过三个既有
Popcorn/panel suites、source-build、semantic override 与 typecheck。严格剩余由
5 个 / 33,730 行降至 3 个 / 23,539 行。

2026-11-02 Checkout session 大批次：`checkout-session` 不再保留 5,299 行发布版 owner。
可维护 TypeScript 恢复 checkout return processor/session schema、plan 映射、币种 minor-unit
格式化、折扣与年付节省、billing interval、Business standard/premium seat 默认值/边界/line-item
映射、促销 query/request、legacy metadata、checkout verify URL，以及 purchase/success 路由实际使用的
CheckoutShell、错误、表单和 summary 组件。60 项短导出 ABI 保持不变，并新增 focused contract。
严格剩余由 6 个 / 39,029 行降至 5 个 / 33,730 行。

2026-11-02 Imported setup 大批次：`use-imported-setup-opportunity` 不再保留
7,139 行发布版聚合 owner。可维护 TypeScript 恢复侧栏 checklist 的特殊动作、远端任务定义、
plugin slot/mention、可持久化 snapshot 与 prompt/instructions 替换；导入后 setup 恢复 foreground
时间窗/provider 过滤、Apps/Plugins 规范化名称关联、MCP 鉴权、Hooks/MCP/connector 检测、
Apps/MCP/Hooks 分栏状态和 initial-tab/loading/error 决策。发布版 74 项短导出 ABI 继续保留，
新增 focused contract 并通过 sidebar/onboarding、source-build、semantic override 与 typecheck。
严格剩余由 7 个 / 46,168 行降至 6 个 / 39,029 行。

2026-11-02 Analytics 大批次：`activity-chart` 与 `billing-analytics` 不再保留
12,817 行发布版 owner。Activity Chart 不再内嵌混杂的 Recharts 子集，改为可维护的
TypeScript/SVG 运行时，恢复 area/bar/stacked-bar、日期范围、可隐藏/隔离图例、键盘焦点、
tooltip、单位格式、loading/error/empty/update 状态以及 release 的 43 项短导出 ABI；D3 曲线与
BarChart 等已审计 vendor 边界继续保持发布依赖边。Billing Analytics 重新接入真实
`/wham/usage/plan_limit_history` 查询，覆盖账户隔离、5 分钟缓存/轮询、7/30 天、5 小时与
周周期、feature/model/product/surface/turn-trigger 分组、top-three+Other 合并、用量卡片和
重试/空态。新增 34 项 owner contract，typecheck、source-build、semantic override 与
1,888/1,888、0 failures 结构校验通过。严格剩余由 9 个 / 58,985 行降至
7 个 / 46,168 行。

2026-11-02 Xterm runtime 大批次：`xterm-window-zoom` 不再保留发布 bundle 中
12,237 行嵌入式 xterm.js/FitAddon/WebLinksAddon 与混杂的桌面桥。第三方边界恢复为与发布
API 匹配的官方 pinned packages（`@xterm/xterm@5.5.0`、`@xterm/addon-fit@0.10.0`、
`@xterm/addon-web-links@0.11.0`），本地 TypeScript 保留 ANSI/CSS theme、styled output
snapshot、增量/replace writer、字体加载、外链与窗口缩放 mouse-coordinate bridge。
新增 32 项 owner contract，并通过 25 项 output-panel runtime、source-build、semantic override
与 typecheck。严格剩余由 10 个 / 71,222 行降至 9 个 / 58,985 行。

2026-11-02 Onboarding/Git action 大批次：`onboarding-page` 与
`git-action-new-branch-field` 已从 release-faithful owner 迁到可维护 TypeScript，
一次删除 15,778 行原始 owner。Onboarding 不以旧版 42 项标准流程测试作为完成依据，
额外对照发布 chunk 恢复 Finance 数据源连接、Rosalind、Teen welcome/interests/prompts、
Windows sandbox、外部 agent migration 以及它们的完成结果持久化，focused 覆盖扩到
70 项；Git action 复用已恢复的 workflow state、blocked-reason/capability、diff summary、
prompt 与 branch field 语义，并将错误的 default import 改为真实 side-effect 契约。
两套 focused suites 共 138 项断言，source-build、semantic override 与 typecheck 通过。
严格剩余由 12 个 / 87,000 行降至 10 个 / 71,222 行。

2026-11-02 Account dialogs/review model 大批次：`app-connect-modal`、
`gpt-about-dialog-core` 与 `review-preferences-model` 已从 release-faithful owner
迁到可维护 TypeScript，一次删除 8,032 行原始 owner。前两者在上一轮已恢复
Google/Microsoft bundle、OAuth/直连/失败回调、OverflowFade，以及 GPT loading/error、
capability、related GPT/start-chat 契约；本轮补齐 Review chunk 的真实三类 owner：diff comment
annotation/draft model、file-tree icon config/resolver/sprite runtime，以及三个持久化 review preferences。
同时纠正旧实现 19 个短导出中把 icon resolver 当 mutation、DOM line extractor 当 line key、
preferences signals 当 initializer 的错位。三套 focused suites 共 97 项断言，typecheck、`npm run check`、
renderer source-build 与 1,888/1,888、0 failures 结构校验通过。严格剩余由
15 个 / 95,020 行降至 12 个 / 87,000 行。

2026-11-02 Thread panel/Quick Chat 大批次：`thread-panel-toggle-button` 与
`content-quick-chat-overlay` 已从 release-faithful owner 迁到可维护 React/TypeScript，
一次删除 7,084 行原始 owner。Thread panel 纠正发布短导出 `b`（layout bridge initializer）
与 `p`（lazy SideChat component）被旧测试固化的错位，恢复 runtime-derived launcher actions、
artifact list、new-tab/panel surfaces、dropdown/context menu、三段 toolbar 与 layout lifecycle；
Quick Chat 恢复 portal、ResizeObserver geometry、main-content reservation、dock/presentation/minimize、
Escape、drag-edge 与 transcript/composer 生命周期。新增 35 项 focused assertions，并通过既有
thread right-panel 与 23 项 quick-chat/window clusters、typecheck、renderer source-build 及
1,888/1,888、0 failures 结构校验。严格剩余由 17 个 / 102,104 行降至
15 个 / 95,020 行。

2026-11-02 Git/thread interaction 大批次：`git-branch-switcher`、
`local-conversation-git-actions` 与 `thread-handoff-modal` 已从 release-faithful owner
迁到可维护 TypeScript，一次删除 6,342 行原始 owner。此批纠正旧语义实现中被测试固化的
短导出错位：发布版 `p` 恢复为 Commit Modal、`r` 恢复为 BranchList，query initializer、
status/recent-branch 查询与 BranchSwitcher 重新接回；conversation actions 恢复 summary menu、
command registration、commit/push/PR/branch workflow，handoff 恢复 local checkout 与 managed
worktree 两个方向、branch/workspace/host payload、校验、pending/error 生命周期。新增 30 项
focused assertions，并通过既有 68 项 Git/worktree cluster、44 项 dialog cluster、typecheck、
renderer source-build 与 1,888/1,888、0 failures 结构校验。严格剩余由 20 个 / 108,446 行
降至 17 个 / 102,104 行。

2026-11-02 Composer runtime 大批次：`codex-micro-mini-game-composer`、
`right-panel-composer-overlay` 与 `sketch-composer-host-core` 已从 release-faithful owner
迁到可维护 React/TypeScript，一次删除 4,823 行原始 owner。Codex Micro 不再是通用 canvas
占位动画，现恢复 Markdown/字形关卡、Asteroids/Brick Breaker/Snake 三套独立物理状态机、
摇杆/HID 输入、得分/碰撞与 ResizeObserver/RAF 生命周期；Right Panel 恢复 browser-tab/runtime
signal 投影、default/compact/expanded 模式、reveal/hide handle、wheel gesture、portal、焦点与几何观察；
Sketch 修正原实现把 `sketch.t` 错接为画布的问题，接回真实 `sketch.o` canvas 与 `sketch.l`
snapshot hook，并恢复工具/形状/颜色/尺寸、移动端切换、undo/redo、保存门禁、discard 和 attachment
transition。三套 focused suites 共 87 项断言、test-index、typecheck 及删除 owner 后的 renderer source-build
通过；同时补齐受影响语义 owner 的发布依赖边，完整结构校验达到 1,888/1,888、0 failures。
严格剩余由 23 个 / 113,269 行降至 20 个 / 108,446 行。

2026-11-02 MCP tool activity/approval 大批次：`mcp-tool-activity-label` 已从
10,030 行发布版 owner 迁出。语义源码保留发布版 928 个 activity descriptor 与 167 个
approval descriptor（ID 和 ICU default message 全覆盖），恢复 Figma、Gmail、Google Calendar、
Google Drive、GitHub、Linear、Notion、Slack 的参数校验、上下文模板选择、URL/日期/计数和值投影；
Browser Use fallback 也重新经过 `intl.formatMessage`，不再绕过本地化。专项 cluster 增加跨应用
上下文审批、发布 descriptor 数量及禁止 `exact.js` 回退门禁；同时修正上一批暴露的 connector
definition 与 GPT resource 类型收窄。严格剩余由 24 个 / 123,299 行降至
23 个 / 113,269 行。

2026-11-02 Connector/GPT contract reconstruction（owner 尚未迁出）：继续逐函数对照
`app-connect-modal` 与 `gpt-about-dialog-core` 发布源码后，确认现有 TypeScript 并非可删除
owner 的完成态。App Connect 原先 15 个导出中多项映射错位，Google/Microsoft companion
列表、bundle gate、connector lookup、post-connect launcher、OAuth/直连/失败回调形状及
OverflowFade passive scroll/ResizeObserver 契约现已校正；GPT About 原先把 query-key、阻断
原因和初始化器误写成名称/作者 helper，且真实 `gizmo` props 会崩溃，现已恢复 discovery/search
query keys、tag 优先级、resource/loading/error/capability/related-GPT/start-chat surface。新增两套
focused contract suites 共 62 项断言，全量 `npm run check` 通过。由于两个大组件尚未覆盖发布版
全部数据查询、菜单、pin/report/migration 与动态 post-connect dialog 分支，本批不删除原始 owner，
严格剩余仍为 24 个 / 123,299 行，避免把“主要路径已修正”误报为“完整反编译”。

2026-11-02 Environment/About You runtime 大批次：
`cloud-environments-settings-page`、`local-environments-settings-page`、
`local-environment-editor` 与 `about-you-summary` 已从 release-faithful owner 迁出，
一次删除 10,857 行原始 owner。Cloud 路由保留 list/search/pagination、
detail/create/edit、permissions、reset/delete 与 query/mutation 状态；Local 路由保留 host
选择、cloud/local tab、catalog/editor/personal-vault，editor 保留 TOML serialization、
platform scripts/actions 验证、revision conflict 与保存后 cache invalidation。About You 保留
account header、stream/cancel/abort/fallback、section update/correction/delete 与 memory disable 契约。
Focused environment/pages、local environment、memory/notifications 和 dialog suites 通过；
严格剩余清单由 28 个 / 134,156 行降至 24 个 / 123,299 行。

2026-11-02 Device/personalization/AppGen settings 大批次：
`codex-micro-settings`、`personalization-settings` 与 `appgen-settings-page` 已从
release-faithful owner 迁到真实 React/TypeScript，一次删除 12,446 行原始 owner。
Codex Micro 现从 app services 读取真实 device service，恢复 connection/permission、
layout/agent source/single-tap keys、lighting/auto-off 与 microphone action 交互；
Personalization 恢复 account/personalization gate、loading/error/unavailable、about-you、memory、
Computer History、reference photos、base style 与 agent instructions；AppGen 修正原占位实现
一直保存初始值的错误，恢复受控 title/root/build/output draft、async saving、
loading/error、slug/open/delete 动作。Focused suite 31 项、typecheck 通过；
严格剩余清单由 31 个 / 146,602 行降至 28 个 / 134,156 行。

2026-11-02 General/remote settings 大批次：`general-settings` 与
`remote-connections-settings` 已从 release-faithful owner 迁到可维护 React/TypeScript，
一次删除 14,930 行原始 owner。General 恢复主设置、外观、发送键行为、
follow-up queue、防休眠、快捷键与 Windows/WSL agent environment，并校正
六个发布导出的真实映射；Remote 恢复 SSH、WSL、remote-control 列表、
loading/error、refresh/add/edit 与 mobile pairing 交互。Focused suite 31 项、
settings leaf 78 项、test-index 与 typecheck 通过；严格剩余清单由
33 个 / 161,532 行降至 31 个 / 146,602 行。

2026-11-02 Security settings owner：`security-settings` 已从 release-faithful owner
迁至真实 React 页面，删除 5,964 行原始 owner。恢复 account signal fallback、按账户隔离的
MFA/sessions/linked-apps/advanced-protection 查询、并行 loading/error/retry、MFA 状态、活动会话
登出、连接应用断开以及 login connections/developer/lockdown/advanced-protection 入口；页面状态
由查询结果直接派生，不再返回静态 `{kind, props}` view-model。security flow cluster 40 项与
typecheck 通过；严格剩余清单由 34 个 / 167,496 行降至 33 个 / 161,532 行。

2026-11-02 Settings runtime contract 批次：`use-visible-settings-sections` 与
`settings-plugin-selection` 已从 release-faithful owner 迁到 TypeScript，一次删除 5,092 行
原始 owner。前者修正原占位实现最关键的跨 chunk 契约：`n` 现在接收 requested slug、local
host 状态和 host id，并返回 visible/navigation section、active fallback、redirect、pending
render 和 enterprise usage label 的完整路由结果；同时恢复 external-settings 和 section asset
契约。后者修正此前完全错位的六个压缩导出：`a` 为 Browser Use 设置区、`r` 为插件控制区、
`n` 为 marketplace 候选选择，保留 loading/error/unsupported、插件 disclosure/app/install/
toggle/uninstall 与 unavailable 分支。`computer-use-settings` 同步删除把 marketplace resolver
误当 origin permission mutation 的调用。focused suites 覆盖 settings route 44 项、plugin selection
25 项、computer use 52 项及 settings page 26 项；严格剩余清单由 36 个 / 172,588 行降至
34 个 / 167,496 行。

2026-11-02 Home suggestions 大批次：`home-task-suggestions-core`、
`image-suggestions-core`、`home-ambient-suggestions-content` 与
`work-onboarding-suggestions` 已从 release-faithful `exact.js` 迁至可维护 TypeScript，
一次删除 8,090 行原始 owner。Task suggestions 恢复账户/host 隔离查询、native
view/click/dismiss interaction、Cloud background task、destination preparation、system hint、
auto-submit 与成功/失败 toast；Images 恢复 scoped draft family、账户/用户隔离 catalog/styles
查询、style suggestion 合并、四种 card presentation、Home prompt 原位替换、impression/selection/send
analytics、sketch request guard、upload/recent-photo 分支；Ambient suggestions 恢复 generated/curated
来源、taxonomy drill-in、composer/start-thread 动作、接受状态与曝光/选择 analytics；Work onboarding
恢复资格门控、temporal/legacy API、静态 fallback、三卡 carousel、Try/Tried conversation linkage、
dismiss/retry 与完成 analytics。focused suites 分别达到 Home/announcement 59 项、Images 66 项，
source-build 在删除 owner 后覆盖 36 个剩余 exact owners。严格剩余清单由 40 个 / 180,678 行
降至 36 个 / 172,588 行。

2026-11-02 route owner 大批次：`usage`、`notifications-settings` 与
`announcement-entry-points` 已从 release-faithful `exact.js` 迁至可维护 TypeScript。
Usage 恢复账户/用户隔离、warning/blocking/image/model 分支、backend upsell、fallback model
conversation notice 与 `turn/started` 清理；Notifications 恢复本地持久化偏好、macOS
系统/自定义声音、预览/错误 toast、ChatGPT account gate、带 `ChatGPT-Account-ID` 的 GET/PATCH、
optimistic cache/rollback/abort cleanup 及 teen-safety 联系方式过滤；Home announcements 恢复
Computer History 派生状态、Replay 按账户曝光、external import 30/60 天冷却与 provider
个性化、gift credits 7/14/30 天冷却及一次性曝光。focused suites 覆盖 50、60、36 项断言；
严格剩余清单由 43 个 / 183,586 行降至 40 个 / 180,678 行。这里的“迁移”仅指已删除
对应原始 owner 并通过 source-build/语义门禁的模块，不再把分类或占位实现计作完成。

2026-10-31 A5 composer plugin-state consumer：确认 app-primary `po` 闭包捕获的 `Ec` 即
app-shared 已公开且已有消费者的 `wu` plugin-state reader；home artifact templates 现直接调用
`isActiveEntity(wu, editorState)`。semantic/hub 交叉集合缩至同属 browser registry owner 的
`Rs/Us` 两项。

2026-10-31 A5 browser-comment consumer：继续展开 app-primary `Hi` 的跨 hub 依赖，确认其完整
语义为 annotation origin 规范化、legacy local browser 字段回退与 `browserTabId` 匹配；现已收进
`is-browser-comment-for-tab` 并由 detached-browser host 直接消费。semantic/hub 交叉集合仅剩依赖
私有 registry 的 `po/Rs/Us`。

2026-10-31 A5 semantic consumer 交叉审计：在 namespace 批次后继续核对所有
`semantic-business-logic` 分类与 hub 消费集合，接回 `sort-by-recency` 和
`project-annotation-items` 两条真实 consumer。对应 app-primary `_n` 与 app-shared `wJ`
读取已清零；同批发现的 `po/Rs/Us` 仍依赖 hub 私有 registry，未制造注入原 hub 函数的伪迁移。

2026-10-31 A5 namespace consumer 扫描：继续接回 `format-browser-url`（2 consumers）、
`format-beacon-action-key`、`extract-skill-kind`、`normalize-system-hints`、
`create-prefilled-plugin-prompt` 与 `stable-json-stringify`。后两项同时补齐 ProseMirror `type.name`
节点与 plain-object-only JSON 排序语义。对应 `xf/yh/vg/iu/Rf/AZ` namespace 读取已清零；`po`
仍依赖 hub 内部 registry，未伪装成可直接替换的纯函数。

2026-10-31 A5 app-shared consumer 扫描：现存 semantic-business-logic 模块与真实 named hub import
交叉检查后，确认并接回最后 3 个遗漏能力：`format-error-message`（2 consumers）、`status-to-color`
（1 consumer）与 `get-path-basename`（6 consumers，含 namespace 解构）。对应 `IH/EX/II` hub
读取已清零；basename 实现补齐发布版的 extended drive、UNC 和反斜杠规范化，focused suites
分别为 8、5、18 项。

2026-10-31 A5 consumer 接回与依赖边复核：`app-primary` 的 `w2/Ur` readiness policy 已由
`open-local-conversation-background-agent` 真实消费语义 helper，并使用 resumed、message projection 与
completed-history 三项原始判定。全量 renderer 构建同时发现并修复 `sort-bar-visualization` 缺失的
motion proxy alias，以及 WebMCP/native-sandbox 的 hub side-effect 边；lazy size-capture 使用独立的
`chunk-Y2CYZVJY-24cce454fd91.js`，不再误解析到 modern 同名 runtime。最终 1874/1874 构建、
1874/1874 等价性验证（0 failures）通过。

2026-10-15 A5 右侧文件预览终局复核：真实 route 为 `connected-file-preview-tab -> LibraryCloudFilePreview -> LibraryFilePreviewBody`。新增 `preview-render-model.ts`、`binary-preview-url.ts` 与 `provider-preview-policy.ts`，将发布 chunk `Gn/Kn/qn/ar` 中仍未物理迁出的显示分支接回：image 使用实际 URL 渲染，PDF bytes 生成并回收 object URL，HTML 使用 sandboxed `srcDoc` iframe，Markdown 接入 `MarkdownSurface`，JSON 使用 `LibraryJsonPreview`，text 使用可聚焦文本面，artifact 继续交给已有 `ArtifactTabContent`，Google Workspace provider-owned 预览使用 no-referrer sandbox iframe。loading/error/unsupported/40 MiB/missing-size/download 状态、AbortController、generation guard 与 stale completion suppression 均有真实 consumer。focused renderer 22、state 24、loader 15、artifact flow 86 项通过。至此右侧文件的“显示预览”专属 owner 可核验清零；原 chunk 剩余边界属于通用 composer/attachment materialization、favorite/breadcrumb 和共享 header 基础设施，不再是文件内容 renderer。

2026-10-14 A5 文件预览内容批次：`library-cloud-file-preview` 已接入真实内容加载器。
artifact/PDF 等二进制预览通过既有 `library-file-download` bytes reader，HTML/Markdown/Text
通过 text reader，统一保留 AbortController、generation guard、过期请求抑制和错误状态；
artifact 交给 `ArtifactTabContent`，JSON 交给 `LibraryJsonPreview`，普通文本使用可聚焦的
`pre`，并为没有显式回调但有 URL 的文件提供默认下载。新增 loader 15 项断言，预览状态
24 项和 artifact 应用流 86 项回归均通过。

2026-10-13 A5 文件预览批次：`library-cloud-file-preview` 的主体分派不再使用四态占位实现。
发布资产 `Gn` 中的 40 MiB 图片上限、未知大小、pending/error/hidden、artifact/PDF、
HTML/Markdown/Text 与 unsupported 决策已迁移至
`src/renderer/library-cloud-file-preview/preview-state.ts`，并由真实
`LibraryCloudFilePreview` route/page consumer 使用。主入口同时接受发布契约的
`item.cloudFile` 和既有直接 `file` 契约；focused suite 覆盖 24 项状态、类型推断与入口断言，
原内联 `previewState` 已删除。

最后一轮 renderer 清扫不再把 `CHUNKS - REWRITTEN` 直接解释为待手写源码。
`scripts/renderer-chunk-manifest.mjs` 现在维护两条互斥轨道：

- `REWRITTEN`：已落地语义源码，构建并验证导出面和依赖边。
- `PRESERVED_ASSETS`：经人工核对属于 vendor、生成模型、worker 或纯数据，继续
  使用发布版 transform-only 资产，绝不计入已重写数量。
- `INCREMENTAL_HUBS`：`app-shared/app-initial/app-primary` 及构建器合并出的
  Popcorn/Artifact 聚合包按实际消费导出逐个语义化，不复制整个聚合 bundle。

运行 `node scripts/audit-renderer-tail.mjs` 会检查保留项已登记、原资产存在、理由
合法并且没有与 `REWRITTEN` 重叠，同时打印真正剩余的人工语义化模块。

本轮保留类别覆盖 CodeMirror、Lottie、D3、DOCX、Datadog、PDF.js、KaTeX、
TanStack Form、QR Code、OAuth 客户端、protobuf/文档模型、thumbnail/diff worker、
presentation/workbook/spreadsheet 编辑器和纯 SVG/persona/icon 数据。该结论遵循
`renderer-classification.md` 的“第三方/纯数据直接跳过”和“巨型 vendored 编辑器
复用原资产”原则。

`node scripts/audit-app-shared-consumption.mjs` 使用 TypeScript AST 收集 renderer
语义源码对 `@rchunk/app-shared` 的 named import、namespace 解构和直接成员访问，
再与所有 declaration merge 块交叉检查。门禁要求每个实际消费导出都有声明、
声明不含 `any`，并且消费侧不存在直接 namespace 成员访问。

`artifact-source-bootstrap`、`text-underline-icon` 和
`popcorn-electron-surface-style` 的发布资产分别暴露 79、37、65 个压缩导出。
三者现有 renderer 消费仍主要是副作用边，但这不再被当作“已完成”的替代证据：
三者均已迁移为可维护语义源码并由 focused contract 固定 ABI 和行为；其中
`artifact-source-bootstrap` 的大型 shape catalog 被明确拆成可再生纯数据，而不是发布 JS 回退。
`scripts/test-renderer-incremental-hubs.mjs` 同时固定 rewritten 分类、发布导出数量和消费方式。

`node scripts/audit-renderer-hub-classification.mjs` 对 `app-shared`、`app-initial`
和 `app-primary` 的发布 export 表与 `src/renderer` 的实际命名消费做交叉分类：
命名消费计入 `consumed`，仅副作用导入单独计数，剩余别名明确列为
`unconsumed`。当前门禁报告三座 hub 仍有大量未消费业务表面（这正是 A5 的物理
迁移缺口），因此 `--strict` 预期失败；不允许把“export 表已登记”误报成“hub
已完成语义化”。审计同时识别 namespace import 的解构绑定（例如
`const { Sm: AnnouncementShell } = appPrimaryChunk`），按左侧公开别名计入真实
消费；这避免把 typed binding table 误报成 zero-consumer。`scripts/test-renderer-hub-classification.mjs` 固定三座 hub
均存在消费面且保留未消费缺口，防止以后通过删除审计来掩盖尾部。

本轮对 `app-primary` 再做一次实现级、逐行抽样，而不是按压缩别名数量猜测迁移
边界。发布资产 `app-primary-d66705000d76.ts:5758-5770` 中的 `rA`/`nA`（公开
别名 `$m`/未稳定导出别名）虽是看起来纯粹的 URL predicate，但 `rA` 只作为同段的
`tAe`（foreground image 选择器）内部实现使用；`src/renderer` 没有对应的
named consumer，复制它会制造一个没有真实调用面的伪语义模块。该行簇登记为
`zero-consumer-scope-aware-formatter`/`generated-local-helper`，继续保留 hub
边界，待出现真实调用者后再抽取。相邻的 `eAe`/`tA` 还依赖 action-v2 状态和
runtime policy，也不满足独立输入/输出契约，不能以 URL 字符串 helper 名义拆出。

因此本轮没有为 A5 强行增加一个新 runtime 文件；`audit-renderer-hub-classification`
仍明确显示 app-primary 的大部分 export 未被命名消费，属于待按真实 consumer
逐个收敛的物理缺口，而非可以用占位导入清零的数字。focused classification suite
同时锁定以上 `rA`/`nA` 无 named consumer 的审计结论，防止后续只为降低计数而伪造
消费边。

本轮将上述结论落入 `docs/renderer-hub-line-classification.json` 的逐行证据：
`$m`/`rA` 标记为 `zero-consumer-scope-aware-formatter`，`Qm`/`nA` 标记为
`generated-local-helper`，并由审计脚本校验公开别名、source symbol、行号窗口和
现存模块路径。该登记只提高可复核性，不改变 `unconsumed` 计数，也不制造虚假的
named consumer。

同一证据表新增 app-primary 的公开别名 `Ad`/`YMe`：它是收件人、抄送与密送的
display projection，内部依赖相邻的 `NI`/`MI` 解析器和 `RI` 的 email 正则初始化；
renderer 没有独立 named consumer，因而登记为 `generated-local-helper` 并保留在
hub 边界。该结论由 `scripts/test-renderer-hub-classification.mjs` 校验 alias、
source symbol、行号窗口和现存资产路径，避免把未拥有的邮件 UI facade 误报为已迁移。

`app-primary` 的 panel visibility 入口已将纯策略部分迁移至
`src/renderer/app-primary/runtime/panel-target-policy.ts`。该模块保留
`bottom-panel` / `right-panel` 优先级、可用 tab 过滤和无候选时返回 `null` 的
原始行为；入口只继续调用聚合 hub 的初始化器。`scripts/test-renderer-panel-target-policy.mjs`
通过独立 bundle 对 fallback、preferred 组合做行为断言，避免把初始化副作用
误当作可迁移策略。

本轮进一步将 `app-primary` 导出 `w2`（公开别名 `Ur`，约 80576 行）的
conversation readiness 三态策略迁移至
`src/renderer/app-primary/runtime/ensure-conversation-ready.ts`：缺失会 hydrate
后递归确认，未 resumed 或既无 messages 又未完成 history 会加载更早历史，其余情况直接完成。该模块
保留 Promise/`true` 返回契约，不接管 UI 初始化副作用。2026-10-31 复核发现语义模块此前尚未接回真实
consumer；现已由 `open-local-conversation-background-agent` 直接调用，并通过 `vZt/Ugn/Pin/Lin` 注入原
conversation store、hydrator、message projection 与 completed-history 判定，删除该入口对 `Ur` 的依赖。
`scripts/test-renderer-conversation-ready.mjs` 覆盖 14 项策略与真实接回断言。

本轮对一个具体未消费导出做了实现级判定：`app-shared` 的 `qhe`（公开别名
`U$`，原始定义行约 91,xxx）与其懒初始化器 `Jhe`（公开别名 `W$`）是
`chat-bubble-rounded-rectangle-text-light-20` 图标资产，而不是业务 helper。
`src/renderer/app-shared/ui/icons/manifest.json` 已有对应 `var/init` 记录，且
`chat-bubble-rounded-rectangle-text-light-20.ts` 已由 `createIconPreset` 提供可读
语义实现；当前 renderer 没有命名消费者，故不能把该导出强行计入业务迁移，继续
保留为 generated icon surface。该证据也说明 A5 的 unconsumed 数量包含已语义化
但暂无消费者的图标，不应仅按数量批量迁移。

补充对 `app-primary` 的实现级抽样：公开别名 `d`（当前消费者统一命名为
`appPrimaryInit`）并不是可安全拆出的业务 helper。它只在语义 chunk 中以副作用
初始化器形式被引用（22 个消费者均为 `void appPrimaryInit`），对应发布 chunk 的
内部实现跨越多个 UI、query 和 lazy-registration 初始化段，且没有独立输入/输出
契约。因而本轮将其归类为 `aggregation-runtime`，保留原始 hub 依赖，不伪造一个
只会执行部分注册的语义模块；后续只有在能从单一消费者证明完整初始化边界时才迁移。

`app-initial` 的公开别名 `C` 也完成了实现级判定。export map 将它定位到内部
`XXc`；现有声明与消费者证据表明它是 PermissionsModeDropdown 的 lazy component
句柄，而 13 个主要消费者都将其重命名为 `appInitialInit` 并仅保留副作用依赖，
没有调用参数或返回值契约。这属于由 bundler 合并进 initial hub 的 lazy-registration
边界，不是纯业务 helper；在 PermissionsModeDropdown 本体已经由独立语义 chunk
承接的前提下，`C/XXc` 继续归类为 `aggregation-runtime`，避免重复实现或破坏注册顺序。

`use-imported-setup-opportunity` 同样是 74 导出的构建聚合边界，但当前仅消费
`ft/pt`。消费侧已经分别命名为 `resolveImportedSetupLabel` 与
`projectImportedSetupItems`，声明也固定为具体函数签名；审计禁止扩大该表面。
`checkout-session` 的 60 个导出当前没有命名消费者，仅作为 checkout 簇的副作用
依赖边保留。二者都由同一 hub 测试锁定，避免为未使用的压缩导出制造占位源码。

`billing-analytics` 与 `mark-session-create` 也采用消费面增量策略。前者只承接设置页
实际使用的 billing analytics API；后者虽然发布资产包含完整 voice 会话运行时，
当前 browser voice availability 只消费 `dt/ft/n/r/t`，因此仅为这五个符号提供
精确声明，禁止为了提高重写数量复制 138KB 的未消费聚合实现。

`xterm-window-zoom` 是 terminal panel 的第三方终端聚合边界，当前语义源码只需要
它的副作用初始化，不直接消费压缩导出。因此它与其他构建聚合包一样登记为
incremental hub，由消费审计阻止未来绕过语义声明直接扩张。

`activity-chart` 是 Usage Code Review 消费的图表聚合边界。发布资产包含 43 个图表
组件和工具导出，当前设置页只消费日期范围控件、ActivityChart 组件及两个初始化器
`H/U/n/t`；因此沿用 typed-consumer-surface 策略，只声明实际消费面。

截至 2026-09-29，尾部审计为 1741 rewritten / 159 preserved / 12 incremental hubs / 0
semantic tail pending；全量 app-code 覆盖为 1847/2247 tracked、400 pending，其中
terminal 6/6、browser 19/19、settings 70/70、dialogs-menus 108/108、home-onboarding
40/40、git-github-worktree 63/63，conversation-thread 101/101，pages-routes 92/92；
animations 7/7、observability-cloud 8/8、auth-profile 13/13、hooks 24/24、
skills-plugins-mcp 30/30、panels 20/20、charts-ui 17/17、editor-docs 42/42、
artifact-preview 53/53、markdown-render 24/24、appgen-valdi-platform 78/78 已覆盖。editor-docs 最后一批恢复 detached browser annotation
controls、image markup editor、visualization annotation editor 与 quick-chat writing block
adapter；四个输出均通过精确依赖/导出验证，未把其 dependency-only 叶子别名误计入
全量覆盖。artifact-preview 最后一批恢复 artifact session、text document、Mermaid
editable、library note/image preview 与 image side panel；360° panorama renderer 继续通过
动态 `IMPORT_ALIASES` 指向发布资产，不把 dependency-only 模块计入覆盖。
markdown-render 最后一批恢复 Markdown entry、code block/editor、code execution 与 10 个
registered thumbnail；highlight.js、i18n locale bundle 和 TextMate grammar shim 保留在
vendor/generated 轨道。appgen-valdi-platform 最后一批恢复 Automations 页面、航班搜索表单、
个人财务账户页、workspace agent 页面、环境设置 review、voice DSP / code execution lazy entry，
以及 favorite、note、restore、library route 等小型入口；19 个语义 chunk 均由精确导出与
依赖验证覆盖。Valdi finance bundle、产品干预运行时、DIL response runtime 与 note data URI
等 5 个大型生成/vendor 资产继续走保留轨道。四组专项测试共 126 条断言；renderer
1171/1171、tsc 73。下一批转入 rpc-bridge，当前 30/410 tracked、380 pending。
rpc-bridge 第一批完成 35 个非 model 尾部的逐文件审计，恢复 array helper、文件树、
坐标/角度/数值格式化、analytics query string 与 browser profile import NUX 等 10 个
语义叶子；Datadog、KaTeX、remark-math、photo-sphere-viewer、Lucide barrel、WASM binary
等 15 个明确 vendor/generated 资产进入保留轨道。专项测试 49 条断言；renderer
1181/1181，rpc-bridge 当前 55/410 tracked、355 pending。另已完成 345 个 model chunk
的结构化审计：其中 343 个包含公式、归一化、模拟或派生状态逻辑，必须分批语义重写，
不能按文件名前缀批量 preserve；仅 2 个纯静态模型数据候选可继续核验保留策略。
rpc-bridge 第二批按体积恢复 30 个最小教学模型，覆盖化学、生物、经济、物理、数学与
环境科学主题；每个模型均保留原始初始化边、压缩导出面、输入归一化、公式和派生状态。
三组专项测试共 236 条断言；renderer 1211/1211、tsc 73，rpc-bridge 当前 85/410
tracked、325 pending。
rpc-bridge 第三批继续恢复 30 个低复杂度教学模型，新增会计、财政政策、生态、化学、
统计、供应链、密码学和劳动力市场等主题。三组专项测试共 249 条断言；renderer
1241/1241、tsc 73，rpc-bridge 当前 115/410 tracked、295 pending。
rpc-bridge 第四批恢复 30 个教学模型，新增溶液性质、整数运算、内分泌反馈、概率统计、
生物循环、微观/宏观经济、数据库事务与矩阵运算等主题。三组专项测试共 275 条断言；
renderer 1271/1271、tsc 73，rpc-bridge 当前 145/410 tracked、265 pending。
rpc-bridge 第五批再恢复 30 个教学模型，覆盖国际贸易与价格管制、条件反射、数组与
指针、SQL 聚合、电子传递链与 GPCR、气体定律、酸碱与化学计量等主题。三组专项测试
共 277 条断言；renderer 1301/1301、tsc 73，rpc-bridge 当前 175/410 tracked、
235 pending。
rpc-bridge 第六批恢复 30 个教学模型，新增商业周期、税收补贴、组合数学与几何、
计算机网络与数字逻辑、生物调节、数据库连接、算法复杂度、质量控制和电磁化学等
主题。三组专项测试共 306 条断言；renderer 1331/1331、tsc 73，rpc-bridge 当前
205/410 tracked、205 pending。
rpc-bridge 第七批恢复 30 个教学模型，覆盖流行病学、化学平衡与电化学、货币市场、
概率分布、生物免疫与生态、数列与函数、机器学习分类、视觉生理和有机构象等主题。
三组专项测试共 299 条断言；renderer 1361/1361、tsc 73，rpc-bridge 当前
235/410 tracked、175 pending。
rpc-bridge 第八批恢复 30 个教学模型，新增溶解度与缓冲体系、反应速率和酶抑制、
统计检验、遗传图谱、电子表格函数、环境风险、区块链、运动学与相图等主题。三组
专项测试共 314 条断言；renderer 1391/1391、tsc 73，rpc-bridge 当前 265/410
tracked、145 pending。
rpc-bridge 第九批恢复 30 个教学模型，覆盖集合与数列、导数定理、计算机算法与体系结构、
光谱和反应动力学、概率统计、人口生态、机器学习、生理周期及会计成本流等主题。三组
专项测试共 318 条断言；renderer 1421/1421、tsc 73，rpc-bridge 当前 295/410
tracked、115 pending。
rpc-bridge 第十批恢复 30 个教学模型，新增统计分布与假设检验、化学依数性和电磁学、
数据结构与调度、数据库建模、遗传与生理系统、材料力学、污染治理及音符编辑等主题。
三组专项测试共 328 条断言；renderer 1451/1451、tsc 73，rpc-bridge 当前
325/410 tracked、85 pending。
rpc-bridge 第十一批恢复 30 个教学模型，覆盖相关分析、统计检验、遗传与消化系统、
有机与无机化学、能源与元素循环、排序和关键路径、地形、光学及运动图像等主题。
三组专项测试共 347 条断言；renderer 1481/1481、tsc 73，rpc-bridge 当前
355/410 tracked、55 pending。
rpc-bridge 第十二批恢复 30 个教学模型，新增分类指标、生命科学过程、概率推断、
数值积分、数列与微积分、数据结构、生态经济及物理化学等主题；同时为 adaptive
slider、数学 tokenizer、null guard 与 numerical integration 恢复精确发布依赖别名。
三组专项测试共 302 条断言；renderer 1511/1511、tsc 73，rpc-bridge 当前
385/410 tracked、25 pending。
rpc-bridge 收官批次恢复最后 20 个语义模块，覆盖排序、几何、数值积分、生理与统计
模型，并将两个原纯数据候选经消费者审计改判为语义小模块；另对 5 个大型聚合运行时
依据真实消费者、副作用和动态依赖证据走 generated preserve 轨道。三组专项测试共
228 条断言；renderer 1531/1531、tsc 73，rpc-bridge 达到 410/410。当前剩余
678 个全量缺口全部位于 misc-ui-utils（275/953）。
misc-ui-utils 已完成 678 个缺口的三分区结构化审计，并由全局验证器证明原顺序覆盖、
无重复、无遗漏。分类为 semantic-small 274、semantic-business-logic 66、
aggregation-runtime 123、generated-icon-or-data 161、vendor-generated-preserve 54；
首批已恢复 30 个 rewrite 模块，覆盖 Mermaid railroad/radar/packet/treemap 初始化包装器、
stable callback、空值与计划事件工具，以及 18 个教学模型和 template 入口。三组专项
测试共 198 条断言，既有 Hook 回归另有 42 条断言；renderer 1561/1561、tsc 73，
misc-ui-utils 当前 305/953 tracked、648 pending。剩余动作分布为 rewrite 284、
preserve 215、incremental-hub 110、进一步消费者审计 39。下一阶段继续从高消费者基础
工具和明确生成资产两端并行收敛，不按图标或文件名前缀批量登记。
第二批继续恢复 30 个 rewrite 模块，覆盖数论、化学、生物、物理、统计、数据结构教学
模型，以及 math、USD formatter、extends 与 pane layout 基础工具。三组专项测试共 220 条
断言；renderer 1591/1591、tsc 73，misc-ui-utils 当前 335/953 tracked、618 pending。
剩余动作分布为 rewrite 254、preserve 215、incremental-hub 110、进一步消费者审计 39。
第三批继续恢复 30 个教学模型，覆盖环境科学、数字逻辑、声学、生态、病毒生命周期、
分子作用力、实验设计、统计分布、化学结构、电路、网络过载与辐射安全。三组专项测试
共 200 条断言；renderer 1621/1621、tsc 73，misc-ui-utils 当前 365/953 tracked、588
pending。剩余动作分布为 rewrite 224、preserve 215、incremental-hub 110、进一步消费者
审计 39。
第四批恢复 30 个 rewrite 模块，覆盖光学与 LaTeX 工具、力学、电学、生态、统计、算法、
回归与微分方程教学模型；同时以逐文件证据登记 11 个语法定义入口和 1 个 Hammer 入口为
preserved vendor。三组 rewrite 专项测试共 203 条断言，preserve 专项验证 12 个包装器；
renderer 1651/1651、tsc 73，misc-ui-utils 当前 407/953 tracked、546 pending。剩余动作
分布为 rewrite 194、preserve 203、incremental-hub 110、进一步消费者审计 39。
第五批恢复 30 个 rewrite 模块，覆盖热力学、化学、生物、几何、统计、经济、力学和
电磁学模型，并将第二个 math 变体独立恢复为 lazy runtime；另登记 14 个纯静态教学规格
与 2 个视觉资产为 preserved data/generated。三组 rewrite 专项测试共 214 条断言，
preserve 专项验证 16 个资产；renderer 1681/1681、tsc 73，misc-ui-utils 当前 453/953
tracked、500 pending。剩余动作分布为 rewrite 164、preserve 187、incremental-hub 110、
进一步消费者审计 39。
第六批恢复 30 个 rewrite 模块，覆盖 U18 日志、电阻归一化、x-like 标识符、可信联系人
布局、RTP transform worker 及 24 个教学模型；另登记 19 个生成图标入口和 1 个 audio
worklet 为 preserved。三组 rewrite 专项测试共 236 条断言，preserve 专项验证 20 个资产；
renderer 1711/1711、tsc 73，misc-ui-utils 当前 503/953 tracked、450 pending。剩余动作
分布为 rewrite 134、preserve 167、incremental-hub 110、进一步消费者审计 39。
第七批恢复 30 个 rewrite 模块，覆盖 subagents tab 路由恢复、三个几何 template 变体及
物理、化学、生理、统计教学模型；另登记 19 个生成图标和 1 个 Lucide 工厂为 preserved。
三组 rewrite 专项测试共 235 条断言，preserve 专项验证 20 个资产；renderer 1741/1741、
tsc 73，misc-ui-utils 当前 553/953 tracked、400 pending。剩余动作分布为 rewrite 104、
preserve 147、incremental-hub 110、进一步消费者审计 39。
第八批恢复 30 个 rewrite 模块，覆盖 sandbox 连接、Mermaid size capture 双变体、
library/file preview、低亮 AST、按钮与响应式图片、数值积分、几何基础工具及物理/化学/
统计教学模型；另登记 20 个生成图标、语法主题和 vendor 小入口为 preserved。三组
rewrite 专项测试共 301 条断言，preserve 专项验证 20 个资产；renderer 1771/1771、
tsc 73，misc-ui-utils 当前 603/953 tracked、350 pending。剩余动作分布为 rewrite 74、
preserve 127、incremental-hub 110、进一步消费者审计 39。
第九批恢复 30 个 rewrite 模块，覆盖广告 placement/hydration、文件预览与 thumbnail、
交互采样、语音 worklet、Katex/数学解析、subagents/plan/background terminal 路由恢复、
beacon surface 与 preload bridge；另登记 20 个静态图片、语法/主题数据、生成 UI 和
vendor 运行时为 preserved。三组 rewrite 专项测试共 235 条断言，preserve 专项验证
20 个资产；renderer 1801/1801、tsc 73，misc-ui-utils 当前 653/953 tracked、300
pending。剩余动作分布为 rewrite 44、preserve 107、incremental-hub 110、进一步消费者
审计 39。
第十批处理显式剩余的 10 个 rewrite 候选，覆盖 model picker power slider、thinking
toggle、triangle visual language、analytics metric helpers、生命科学 helix 背景、TSRX
types/JSX grammar、shopping/browser open handler、followup shelf 与 family notification
surface；另按逐文件证据登记 33 个图片、语法/主题数据、生成 UI/可视化及 Three/Rough/
Redux/Silero 等 vendor 运行时为 preserved。新增 rewrite 专项测试共 128 条断言，
preserve 专项验证 33 个资产；renderer 1811/1811、tsc 73，misc-ui-utils 当前 696/953
tracked、257 pending。剩余动作分布为 rewrite 34、preserve 74、incremental-hub 110、
进一步消费者审计 39。
第十一批恢复剩余 34 个明确 rewrite 模块，覆盖 adaptive slider、数学分类/方程/几何、
ODE 内容解析、购物详情缓存、sandbox/webview、workspace access/layout、voice commentary
与 onboarding/announcement 等业务表面；同时将剩余 74 个逐文件证据明确的插画、图标、
语法/主题、worker、Cytoscape/Yjs/.NET/Lodash 等生成或 vendor 资产全部登记为 preserved。
三组 rewrite 专项测试共 270 条断言，preserve 专项验证 74 个资产；renderer 1845/1845、
tsc 73，misc-ui-utils 当前 804/953 tracked、149 pending。明确 rewrite/preserve 队列已
清空，剩余动作分布为 incremental-hub 110、进一步消费者审计 39。
第十二批首先完成 39 个消费者不明确项的真实消费审计：21 个改判为 rewrite、8 个改判为
preserve、10 个改判为 incremental-hub。本段已恢复 ProductTag、pricing upgrade、
computer-use approval、conversation snapshot、image markup export、business-agent draft、
clinician verification、library trash、parental-control notifications、Windows tab open 与
project import prompt 共 11 个模块，并登记 8 个生成 UI/vendor/无操作 facade 资产为
preserved。三组 rewrite 专项测试共 148 条断言，preserve 专项验证 8 个资产；renderer
1856/1856、tsc 73，misc-ui-utils 当前 823/953 tracked、130 pending。消费者审计队列已
清空，剩余动作分布为 rewrite 10、incremental-hub 120。
第十二批第二段恢复剩余 10 个明确 rewrite 模块：subscription payment announcement、
workspace seat banner、ChatGPT header upgrade、ads consent boundary、conversation header、
workspace recovery gate、Mermaid image rendering、imagegen request form、browser MFA SMS
enrollment 与 workspace auto-generated name。三组专项测试共 112 条断言；renderer
1866/1866、tsc 73，misc-ui-utils 当前 833/953 tracked、120 pending。明确 rewrite 队列
已经清空，剩余动作全部为 incremental-hub 120。
incremental-hub 收官批次对 120 个剩余入口/聚合运行时逐项核对真实消费者、精确依赖与
导出面：恢复 graceful URI decoder、voice DSP state、parental-control notification observer、
personal-secrets preflight、conversation beacon banner、两代 color channel parser 与
media-device contracts 共 8 个语义模块；112 个纯生成插画/语法入口、Mermaid parser
bootstrap、worker model、initializer facade、locale/learning registry 和大型编译
UI/voice/persistence surface 进入 audited preserve。六组专项验证共 1077 条断言；renderer
1874/1874、tsc 73，misc-ui-utils 达到 953/953，app-code 覆盖 2247/2247、0 pending。
医疗验证
`messages-*` 仅包含静态 intl 文案表，已改列 `data:intl-messages`。两个文件名
含 `gitGraph` 的小型 chunk 已确认属于 Mermaid/Langium 生成服务包装器，归入
`vendor:diagram-mermaid`，不再误算为应用代码。尾部 0 pending 仍不能替代全量覆盖审计。

构建器另维护 `IMPORT_ALIASES`：它只负责把语义源码中的历史依赖别名解析为原始发布
文件名，用于恢复精确 import 边，不把这些别名加入 `CHUNKS`，因此不会虚增 rewritten
数量或全量覆盖率。新增别名时仍必须由 `verify-renderer.mjs` 核对最终依赖集合。

注意：`audit-renderer-tail.mjs` 只审计已经登记进 `CHUNKS` 的集合，不能证明
`docs/renderer-app-chunks.json` 中的 2247 个 app-code 文件已经全部处理。全量覆盖
必须以 `node scripts/audit-renderer-app-coverage.mjs` 为准；它会报告当前 manifest
覆盖数以及 composer/sidebar/settings/pages-routes 等优先簇的真实剩余数量。
本轮将 `app-initial` 的真实业务 helper `jFn`（公开别名 `w$t`）迁出 hub：实现仅
执行 `items.filter(item => item != null)`，5 个 conversation/webmcp、artifact 与
source consumer 已改用 `src/renderer/app-initial/runtime/flatten-conversation-items.ts`
中的泛型语义函数。该边界无初始化副作用、输入输出契约明确，并由
`scripts/test-app-initial-flatten-conversation-items.mjs` 的 4 项行为断言覆盖；原
hub 导出仍保留以兼容未迁移调用方。

下一个 `app-initial` 消费面 `dun`（内部 `Xg`，语义名
`createPersistedState/createPersistedSignal`）经实现级检查暂不迁移：它不是单纯的
业务计算 helper，而是把 `Szt` 持久化注册、`xo` scoped signal resolution、存储
coercion、`publishDelayMs` 延迟发布和 `bf/Oat` 持久化写入串成一个状态工厂。当前
至少 6 个 settings/overlay/slot consumer 依赖同一 identity 与 side-effect 顺序。
若脱离 app-initial 仅复制函数体，会丢失 signal scope 与持久化 runtime；因此登记为
`aggregation-runtime`，待先抽出 typed persistence runtime contract 后再迁移，避免
制造行为相似但生命周期不等价的伪 helper。

本轮进一步将 `app-initial` 的纯业务 URL 边界 `Asn`（内部 `SWt`）迁出为
`src/renderer/app-initial/runtime/parse-http-url.ts` 的 `parseHttpUrl`：仅解析并
允许 `http:`/`https:`，对非法 URL 或非 Web 协议返回 `null`。`browser-use-origin-
state-queries` 的 3 个调用点已切换到语义导入；该函数无 hub 初始化或持久化副作用，
由 `scripts/test-app-initial-parse-http-url.mjs` 的 4 项断言覆盖。原始导出保留以
兼容尚未迁移的其他调用面。

同一纯策略链的 `Fsn`（内部 `dWt`）现由上述 runtime 导出的
`domainMatchesPattern` 承接；它仅执行规范化 hostname 与 exact/subdomain/wildcard
匹配，策略模块的 2 个调用点已切换，测试扩展为 7 项断言覆盖大小写、子域和 apex
排除行为。

`ksn`（内部 `CWt`）也已并入该语义 runtime 的 `originPatternsMatch`：它只比较
protocol、port 并复用 hostname pattern 匹配，不携带 hub 生命周期；测试扩展为 9 项
断言，覆盖协议/端口不匹配拒绝。

同模块的 `Nsn`（内部 `wWt`，`parseNetworkPattern`）暂不直接复制：虽然主体无
副作用，但它同时执行 scheme/authority 分隔、IPv6 bracket 与端口合法性、URL
协议检查、`%2a` wildcard 解码，以及返回 `canonicalKey`、`canonicalPattern`、
嵌套 hostname pattern 的兼容对象组装。当前网络规则读取会把该对象再交给既有
`ParsedOrigin`/域匹配链；在没有先定义独立的 typed `NetworkPattern` contract 前，
复制函数体容易保留字符串结果却改变嵌套字段形状，故登记为 `protocol-parser`
分类，后续需以对象契约测试驱动迁移。

同一策略模块中的 `Msn`（内部 `uWt`）也已迁为
`src/renderer/app-initial/runtime/parse-origin-pattern.ts` 的 `parseOriginPattern`。
该函数及其 hostname/wildcard 规范化链只做确定性字符串解析，不触碰 signal、query
或持久化 runtime；策略模块的 5 个调用点已切换到语义导入，并由
`scripts/test-app-initial-parse-origin-pattern.mjs` 的 4 项断言覆盖。原 hub 导出仍
保留，供其他尚未迁移的消费面使用。

另审计 `Ydn`（内部 `Qh`，`configurationLayerPath`）：实现本身是纯映射，但其
输入契约是带 `type`/`file`/`dotCodexFolder` 字段的 layer 对象，而当前 renderer
调用点先取 writable layer 的 `name` 再传入。该对象/字符串形状差异不能靠复制函数
体安全消除，暂登记为 `config-layer-contract`，待配置层类型统一后再迁移并补路径
映射契约测试。

本轮再将 app-initial `$ln`（内部 `i_`）的纯 command query-key 构造器迁为
`src/renderer/app-initial/runtime/create-command-query-key.ts`。browser-use 的
origin-state query 已切换到语义导入；该函数只组装稳定的 `vscode` 前缀、command、
可选 cache key 与序列化 params，无初始化副作用，由
`scripts/test-app-initial-create-command-query-key.mjs` 的 3 项断言覆盖。

本轮进一步将 app-initial 的 Electron command membership policy（公开别名 `mEt`，
内部 `Gzr`）迁为 `src/renderer/app-initial/runtime/electron-command-policy.ts`。
原实现只是检查 Electron command registry 的静态 handler map 是否包含给定 id；
handler 注册、host message 和快捷键副作用仍由 `hEt` 初始化器留在 hub。`codex-
micro-commands` 的命令列表过滤已切换语义 predicate，并由
`scripts/test-app-initial-electron-command-policy.mjs` 锁定 25 个注册 id、正负成员
边界共 4 项断言。

本轮再将 `Kdn`（内部 `KNt`）的 writable configuration layer 选择逻辑迁为
`selectWritableConfigurationLayer`。该函数仅按 `name.type === "user"` 选择最后一个
layer，对空/无匹配输入返回 `null`，browser-use mutation 已切换语义导入，并由
`scripts/test-app-initial-select-writable-configuration-layer.mjs` 的 3 项断言覆盖。

另审计 `ugn`（内部 `df`，`defaultHostId`）：表面值为 `"local"`，但它由
`ff()` 初始化器与同一阶段的 `kit` 别名共同注册；renderer 使用的是初始化后的
host identity，而非独立业务常量。为避免在不同 bootstrap 顺序下复制出脱离 runtime
的字符串，登记为 `initialization-constant`，暂不迁移。

本轮另将 app-initial `Jsn`（内部 `Av`）的配置查询 key 常量迁为
`src/renderer/app-initial/runtime/configuration-query-key.ts` 的语义导出
`configurationQueryKey`。它仅提供稳定的 `['config', 'user']` 前缀，browser-use
配置查询调用面已切换导入，并由 `scripts/test-app-initial-configuration-query-key.mjs`
的 2 项断言覆盖；原 hub 导出保留兼容其他消费者。

切换到 `pull-request-query-key` 簇后，`By`（内部 `h3`）的 pull-request identity
归一化计算虽为纯函数，但当前 renderer 没有命名消费者，只有 façade re-export；其
配套 `Vy`（内部 `RTs`）还绑定 hub 内部 query-key builder 与 provider 分支。该面
登记为 `zero-consumer-query-facade`，暂不为零消费导出制造语义占位，待出现真实
consumer 后再按 identity/query-key 契约迁移。

本轮在 `creation-target-query` 簇将 app-shared `_H`（内部 `rHe`）迁为
`src/renderer/app-shared/runtime/parse-git-remote-url.ts`。该完整纯 parser 支持 URL
与 SCP-style remote、嵌套 owner path 和 `.git` 后缀，并拒绝 Windows 本地路径及
无效 remote；2 个 creation-target 调用点已切换语义导入，由
`scripts/test-app-shared-parse-git-remote-url.mjs` 的 4 项断言覆盖。

在 `local-conversation-webmcp-tools-model` 簇，app-shared `hq`（内部 `YFe`）也已迁为
`src/renderer/app-shared/runtime/is-web-mcp-server.ts`。它是独立纯 predicate，仅将
`node_repl` 与 `cua_repl` 识别为 Web MCP server；consumer 已切换语义导入，并由
`scripts/test-app-shared-is-web-mcp-server.mjs` 的 4 项断言覆盖。

`review-file-source-tab` 簇的 `Xst`（内部 `axi`，`getReviewFileSourceTabId`）也已做
实现级检查：主体是 tab-id formatter，但环境分支会调用 `oxi(scope, options)` 取得
environmentId，且当前 renderer 只有 façade re-export、没有真实调用者。该面登记为
`zero-consumer-scope-aware-formatter`，待出现 consumer 并明确 scope/environment 契约
后再迁移，避免复制出只覆盖 host/path 分支的残缺 helper。

`vite-browser-external` 簇的 `kHt`（内部 `tlr`，consumer 名
`createBrowserExternal`）经实现级检查是 bundler 生成的空 CommonJS module factory：
函数体仅令 `module.exports = {}`，随后 consumer 立即调用并默认导出。它不是业务
helper，登记为 `vendor-generated-preserve`，保留原 hub 边以维持打包器 external
语义，不制造手写空对象模块。

`conversation-markdown` 簇的 app-shared `VI`/`zI`（consumer 名
`normalizeSeparatorsImport`/`isAbsolutePathLikeImport`）经检查已无真实调用：模块内
已有 `normalizeSeparators` 与 `isAbsolutePathLike` 的语义实现，hub 导入仅通过
`void` 维持兼容依赖边。同组 `BI`/`RI`/`iW` 也仅为 preserve 引用。该面登记为
`semantic-local-replacement`，不应把 void import 误计为待复制的业务 helper。

在 `keyboard-shortcut-command-order` 簇，app-shared `Gp`/`lut` 与 `zp`/`sut` 已迁为
`src/renderer/app-shared/runtime/command-visibility-predicates.ts`。二者分别是纯
realtime voice command 识别与 required-access 判定；consumer 已切换语义导入，由
`scripts/test-app-shared-command-visibility-predicates.mjs` 的 6 项断言覆盖。

`tun`（内部 `a_`，`createCommandQueryFamily`）也完成实现级审计：其函数体把
command、query config、params/cache key 与 app-server `queryFn`、response priority
和 query runtime 绑定，并非可脱离上下文的 key/计算 helper。当前 consumer 依赖该
factory 返回的 query family 生命周期，登记为 `query-runtime-factory`，待先定义
typed query contract 后再迁移。

本轮补充 app-primary `T`（内部 `f9`，`projectKind`/Git-target predicate）的逐行证据：
实现会先按 project id 查找 workspace，再结合 `gitRepos` 数量、project kind 与 creation
target kind 判定是否支持 Git。发布 alias 当前没有 renderer 的命名 consumer，只有生成 hub
内部使用；因此登记为 `zero-consumer-project-kind-predicate`，保留原实现并记录
`docs/renderer-hub-line-classification.json` 的 114934-114942 行范围，待出现真实
project-target owner 后再迁移，避免复制出脱离 workspace contract 的伪 helper。

切换到 `local-conversation-plan-model` 后，`sjt`（内部 `fN`，
`normalizePlanTitle`）经实现级检查也不属于简单字符串清洗：它委托 `Gp` 的 markdown
预处理、directive extensions 与 AST 渲染，再做空白归一化。plan consumer 依赖这些
markdown 语义，故登记为 `markdown-runtime`，待先定义稳定的 title normalization
contract 后再迁移。

本轮继续处理 `sandbox-url` 簇：`native-code-execution-sandbox` 原先从
`@rchunk/app-shared` 取得 `KH`/`YH`（`createSandboxPartition` 与初始化钩子），现已
直接导入 `src/renderer/app-shared/runtime/sandbox-url.ts` 的语义实现。该切换覆盖真实
sandbox consumer，保留同一 partition 格式与初始化行为；既有 sandbox URL focused
suite 另增加 consumer import 边界断言。

本轮再将 app-initial 的 canonical-history 纯访问器 `Dhn`（内部 `cp`）迁为
`src/renderer/app-initial/runtime/canonical-history.ts` 的
`getCanonicalHistoryEntries`。它只读取 `islands` 的最新项，并在其
`newerBoundary.status === "exhausted"` 时返回完整岛屿；否则返回 `null`。真实的
`artifact-originating-turn` consumer 已切换语义导入，focused suite 覆盖完整、加载中、
空历史和空输入四种边界。

本轮将 app-primary 的跨 realm DOM 元素判定 `Jc`（内部 `fW`）迁为
`src/renderer/app-primary/runtime/is-element.ts` 的 `isElement`。实现优先使用元素所属
window 的 `HTMLElement`/`Node` 构造器，并保留 nodeType、ownerDocument、tagName 与
`getBoundingClientRect` 的 fallback 契约，因此 iframe/shadow document 中的元素不会因
host realm 不同而误判。`tweaks-toolbar-view` 已切换到语义导入，原 hub 仍保留
`Jc` 以兼容其他聚合边。`scripts/test-app-primary-is-element.mjs` 覆盖 null/空对象、
跨 realm 形状、文本节点拒绝及 consumer import 边界共 4 项断言。

本轮继续从 `app-primary` 的未消费纯 URL helper `bF`（公开别名 `xf`）抽出
`src/renderer/app-primary/runtime/format-browser-url.ts` 的
`formatBrowserUrl`。它只负责解析绝对 URL 并稳定组装 host/path，可显式保留或省略
query/hash；`detached-browser-annotation-controls` 已改用该语义入口并保持原有紧凑
host/path 展示契约，非法输入仍由调用方回退原始字符串。`scripts/test-renderer-browser-url.mjs`
覆盖根路径、query/hash、紧凑模式、非法 URL 与空值 5 项断言。原 hub 导出继续保留
以兼容尚未迁移调用方。

本轮将 `app-initial` 的已命名消费 predicate `dHt`（公开别名，内部实现 `PA`）迁出
为 `src/renderer/app-initial/runtime/is-terminal-conversation-status.ts` 的
`isTerminalConversationStatus`。实现只对 `active-async-turn`、`active-tpp-turn` 和
`streaming` 返回 `true`，对 `error`、`idle` 及未知状态返回 `false`；
`conversation-start` 已切换语义导入，保留原 hub 导出以兼容其他调用面。
`scripts/test-app-initial-terminal-conversation-status.mjs` 覆盖 7 项状态断言。

本轮继续将 app-primary 的纯 payload helper `tPe`（公开别名 `Du`）迁为
`src/renderer/app-primary/runtime/normalize-suggested-followups.ts` 的
`normalizeSuggestedFollowups`。实现只读取 `suggested_followups` 数组，过滤无效项、
裁剪 prompt/title 空白并保持原始 source index，最多返回三个建议；不引入 primary
hub 的 UI 注册副作用。`conversation-followup-shelf` 新增可选的
`suggestedFollowups` 输入并通过该语义入口装配展示项，已有结构化 `suggestions` 输入
优先级与渲染行为保持不变。`scripts/test-app-primary-normalize-suggested-followups.mjs`
覆盖无效 payload、空标题回退、索引保留与三项上限共 4 项断言。

本轮再将 app-primary 的 Appgen 站点 URL 匹配策略 `aMe`（公开别名 `yf`）迁为
`src/renderer/app-primary/runtime/is-site-url-match.ts` 的 `isSiteUrlMatch`。该策略
仅比较协议/端口、规范化 ChatGPT team/public 站点主机别名，并按边界安全地匹配站点
路径及其子路径；站点浏览器真实 consumer 已切换语义导入，初始化入口仍保留原
`Sf` 以维持 hub 的启动契约。`scripts/test-app-primary-is-site-url-match.mjs`

本轮继续将 app-primary 的 annotation/comment attachment 摘要格式化函数 `iKe`
（公开别名 `is`，约 38527 行）迁为
`src/renderer/app-primary/runtime/format-annotation-summary.ts`。模块保留设计 tweak
并入 annotation 数量、混合摘要和空摘要分支，通过显式 formatter/message 参数隔离
国际化与 hub 初始化。`scripts/test-app-primary-format-annotation-summary.mjs`
覆盖混合、空和单类三条路径。
覆盖主机别名、尾斜杠、路径前缀边界、非法 URL 与端口隔离共 5 项断言。

本轮再将 app-primary 的纯预填插件 mention helper `I7`（公开别名 `Rf`）迁为
`src/renderer/app-primary/runtime/create-prefilled-plugin-prompt.ts` 的
`createPrefilledPluginPrompt`。它只拼接 `plugin://` mention URL、按原实现转义
反斜杠和右括号，并裁剪可选 prompt；`computer-history-suggestion-prompt` 已切换
到语义导入，保留 `Bf` 初始化器所需的 hub 生命周期。由
`scripts/test-app-primary-create-prefilled-plugin-prompt.mjs` 的 3 项断言覆盖
插件 ID 空白、Markdown 转义与空 prompt 边界。

本轮再将 app-primary 的 plan surface 数据属性常量 `V5`（公开别名 `Ct`）迁为
`src/renderer/app-primary/runtime/plan-selection-surface.ts` 的
`PLAN_SELECTION_SURFACE_ATTRIBUTE`。`plan-tab-content` 现在直接消费语义常量，仍
保留 `H5`（公开别名 `wt`）初始化器以维持聚合 hub 的注册顺序；该边界不复制任何
React 或 signal runtime。`scripts/test-app-primary-plan-selection-surface.mjs`
覆盖语义导入边界和属性值契约共 2 项断言。

本轮补齐 app-primary 已迁出纯 helper 的逐行 hub 证据：`Jc`/`fW` 对应跨 realm
`isElement`，`xf`/`bF` 对应浏览器 URL 格式化，`yf`/`aMe` 对应站点 URL 边界匹配，
`Du`/`tPe` 对应 suggested-followups 归一化。四段均标记为
`semantic-business-logic`，分别指向语义 runtime 文件；行号与 source symbol 由
`scripts/audit-renderer-hub-classification.mjs` 校验，避免将已有迁移误报成未审计 hub
导出。

本轮继续补齐 app-primary 的状态 formatter 逐行证据：`IAe`（公开别名 `$p`，约
10340 行）仅将 `isLoading` 与 `isEligible` 投影为 `loading`/`eligible`/`ineligible`
三态字符串。它没有独立 renderer named consumer，也不拥有 signal、DOM 或初始化副作用，
因此归类为 `generated-local-helper` 并保留在聚合 hub；分类记录由
`scripts/audit-renderer-hub-classification.mjs` 校验。

本轮继续补齐 app-primary URL/action 小簇的逐行证据：`tA`（公开别名 `Zm`，5751--5753
行）只判断 `open_local_url` 的 `/tasks` 特殊路径，并且仅被相邻的 `eAe` URL 投影调用。
它没有独立 renderer named consumer；为避免制造无主 facade，归类为
`generated-local-helper` 并保留在聚合 hub。该行范围、source symbol 与分类由
`scripts/audit-renderer-hub-classification.mjs` 机器校验。

本轮修正 hub 消费审计对另一种真实 renderer 边界的识别：许多组件将聚合
namespace 先收窄为 `chunk as unknown as { alias?: ... }` 的契约对象，再通过该
局部契约调用运行时。此前审计只识别 `chunk.alias`、named import 与解构左值，
会把这些明确的类型契约误报为 unconsumed。审计器现在逐个解析这种 cast object
的顶层导出键，并将其计为 named consumer；focused test 对三类 hub 设置消费数量
回归下限，同时继续保留未消费导出和逐行证据门禁。

本轮继续补齐 app-primary 的 selection overlay 样式逐行证据：`JE`（公开别名 `Ag`，
3686--3711 行）根据 hover/selection 外观、fill-only 分支与 zoom scale 计算边框、填充、
阴影和 dashed 样式。它与相邻 annotation SVG 及 selection overlay renderer 共享内部
生命周期，renderer 没有独立 named consumer；因此登记为 `generated-local-helper` 并保留
在聚合 hub，避免制造无主 styling facade。行范围、source symbol 和分类由
`scripts/audit-renderer-hub-classification.mjs` 机器校验，focused suite 同时锁定 `Ag`
仍属于 unconsumed surface。

本轮再补齐 app-primary 计划购买动作的逐行证据：`jA`（公开别名 `Am`，6788--6807
行）只按 workspace 所有权、plan tier 与 Pro 购买暂停状态映射升级、加购额度或通知
owner 动作，并依赖相邻生成的 `Gm` enum。它只在 hub 内部计划购买流程消费，没有独立
renderer named consumer；因此登记为 `generated-local-helper` 并保留聚合 hub，避免制造
无主 billing facade。该行范围、source symbol 与分类由
`scripts/audit-renderer-hub-classification.mjs` 机器校验。

本轮继续补齐 app-primary 两类不同生命周期边界的逐行证据。`sk`（公开别名 `Eh`，
5014--5016 行）只把 feature availability 与 target 状态投影为 pending/unavailable，
但仅由相邻 takeover UI 组装消费；`gF`（公开别名 `Ef`，15611--15617 行）则注册
default-branch RPC、live-query 与 cache runtime，明确拥有 hub 初始化副作用。两者均无
独立 renderer named consumer，因此登记为 `generated-local-helper` 并保留原聚合边：前者
避免无主状态 facade，后者避免复制初始化顺序。focused classification suite 锁定 `Eh`/
`Ef` 仍属未消费面，并由 hub audit 校验 source symbol 与精确行范围。

本轮继续补齐 app-primary 的 CSS 能力判定逐行证据：`tke`（公开别名 `$g`，3443--3445
行）只检查 `var()` 与 `color-mix()` token，供相邻的生成式颜色管线决定是否保留 CSS
表达式。该 helper 没有独立 renderer named consumer 或 lifecycle 边界，因此登记为
`generated-local-helper` 并保留聚合 hub，避免制造无主 styling facade。分类记录由
`scripts/audit-renderer-hub-classification.mjs` 校验 source symbol 与精确行范围。

本轮继续补齐 app-primary 的 slash-command pin React surface 逐行证据：`mQe`（公开别名 `$a`，
51476--51518 行）解析本地化标题/描述并注册 Pin chat 命令，只由相邻 chat-route
分支渲染，未形成独立 renderer named consumer 或生命周期边界。因此登记为
`generated-local-react-surface` 并保留聚合 hub，避免复制 composer runtime 与 React
初始化契约；分类记录由 `scripts/audit-renderer-hub-classification.mjs` 校验 source
symbol 与精确行范围。
本轮继续补齐 app-primary repository URL projection 的逐行证据：`sst`（公开别名 `An`，
93876--93880 行）从生成的 repo-map 状态读取当前仓库 clone URL，并委托相邻 `cst` helper
执行 feature gate。该 helper 没有独立 renderer named consumer 或 repository-query 生命周期
边界，因此登记为 `generated-local-repository-url-helper` 并保留在聚合 hub，避免制造无主
repository facade；分类记录由 `scripts/audit-renderer-hub-classification.mjs` 校验 source
symbol 与精确行范围。

本轮再补齐 app-primary execution-target project-kind helper 的逐行证据：`yke`（公开别名
`og`，4290--4292 行）仅排除 cloud execution kind，供相邻 composer target projection
决定可用的本地执行目标。它没有独立 renderer named consumer 或 execution-target lifecycle
边界，因此登记为 `generated-local-project-kind-helper` 并保留在聚合 hub，避免制造无主
host-selection facade；分类记录由 `scripts/audit-renderer-hub-classification.mjs` 校验
source symbol 与精确行范围。
新增 app-primary 逐行分类证据：`$d`/`mI` 是搜索 RPC 分页与 provider 默认值的生成局部 helper；`Cr`/`Fnt` 是自动审批提醒与 coordinator threshold 的耦合流程；`$f`/`MN`、`$l`/`lV`、`$n`/`K4` 是模块初始化副作用。五者均无独立 named renderer consumer 或 teardown/lifecycle 边界，继续保留在聚合模块，避免制造无主 facade。

本轮再补齐 app-primary 搜索与标注/设备状态的局部边界证据：`Cl`/`wRe` 将 local、remote
与 ChatGPT thread identity 归一化，`Dl`/`SRe` 将相邻搜索结果整理为 pinned/recent 分组，
`$c`/`yBe` 仅从编辑锚点或矩形中心投影标注坐标，`Cc`/`EVe` 与 `wc`/`DVe` 成对切换
设备 onboarding signals。它们都没有独立 renderer named consumer、可复用 store 或 teardown
契约，属于生成模块内聚的 projection/state helper；因此继续保留在 hub，避免制造无主 identity、
search、geometry 或 device-state facade。分类记录与 source symbol/精确行范围由 hub audit
机器校验，focused suite 同时锁定这些 alias 仍在 unconsumed surface。

本轮继续补齐 app-primary 主题/颜色小簇的逐行证据：`bE`/`qg` 读取 computed-style accent
颜色，`ZOe`/`Qg` 建立主题属性与 head mutation observer，`QOe`/`Xg` 计算祖先背景对比度，
`$Oe`/`Yg` 与 `eke`/`Jg` 分别格式化 rgb/rgba 颜色，`IE`/`Zg`、`rke`/`Hg`、`ike`/`Vg`
和 `BE`/`Ug` 则初始化并选择生成的 light/dark token map。它们全部只服务相邻生成式
annotation/theme styling pipeline，没有独立 renderer named consumer 或 teardown/lifecycle
边界；因此登记为 generated-local theme/color helper 并保留在聚合 hub，避免制造无主 facade。
行范围、source symbol 与分类由 hub audit 机器校验，focused suite 锁定 9 个 alias 仍属
unconsumed surface。

本轮继续登记 app-primary 中 10 个未消费局部边界：`Fd`/`JMe` 负责收件人分隔解析，
`Dd`/`eNe` 与 `Cd`/`iNe` 负责消息状态和 metadata 读取，`Ig`/`VE` 负责标注控件循环选择，
`Ih`/`kO` 负责导航缓存 key，`El`/`QH` 负责搜索结果投影，`Bp`/`zAe` 负责 action-v2
派发，`Gm`/`rAe` 负责计划动作状态，`Gs`/`YWe` 与 `Gh`/`xke` 负责 overlay listener/state
生命周期。它们的输入契约、状态 key 和副作用顺序均只由相邻生成 surface 持有，没有独立
renderer named consumer 或可安全转移的 teardown 边界；因此登记为 generated-local
projection/state helpers 并保留在聚合 hub。分类记录、source symbol 和精确行范围由
hub audit 校验，focused suite 已锁定 10 个 alias 仍属于 unconsumed surface。
本轮补充 app-primary 的 follow-up portal 与 home announcements 生命周期证据：`K7`
（公开别名 `R`，113768--113771 行）注册 follow-up suggestion portal provider 的局部依赖；
`X7`（公开别名 `P`，113807--113830 行）注册 HomeComposerAnnouncements 的懒加载器。
两者均由相邻 route/provider 生命周期独占，没有独立 renderer named consumer 或 teardown 契约，
因此继续保留在聚合 hub；行范围、source symbol 与分类由 hub audit 机器校验。
本轮再补充 app-primary 项目下拉初始化边界：`e9`（公开别名 `M`，114056--114073 行）
注册项目下拉查询、JSX 与本地项目选项依赖，顺序由相邻 dropdown controller 生命周期持有，
没有独立 renderer named consumer 或 teardown 契约，因此继续保留在聚合 hub。
同时登记 `e_t`（公开别名 `E`，114488--114889 行）的 home starter surface；它组合 starter
prompt、temporary-chat 与 business-agent 分支，回调和子树均由相邻 home route 持有，没有独立
renderer consumer 或 teardown 边界。
本轮继续补齐 app-primary 四个真实生成边界：`i9`（公开别名 `A`）负责一次性
runtime registry/lifecycle bootstrap，`pF`（公开别名 `Af`）负责 provider setup，
`ZH`（公开别名 `Al`）负责 query/cache runtime wiring，`CB`（公开别名 `Au`）负责
消息 markup delimiter 常量初始化。四者都只在聚合 hub 内由邻近生成投影使用，没有
独立 named renderer consumer 或 teardown/lifecycle 契约；逐行证据登记在
`docs/renderer-hub-line-classification.json`，分类门禁期望数由 145 提升至 149。

本轮继续从 app-primary 未消费区补齐九个逐行边界：`$h`（`oO`）是 host capability
signal，`$s`/`$u`（`IWe`/`mNe`）是 expandable-content transition 与 markdown editor
controller，`Ai`/`Ap`/`Ar`（`x0`/`EM`/`R2`）是 retry surface、security/provider icon 的
生成式初始化或展示资产，`As`/`Bu`（`qK`/`ZR`）分别负责 attachment runtime 与 slash-menu
bootstrap，`Br`（`ltt`）负责 message/answer kind state projection。它们均没有独立 named
renderer consumer 或可安全迁移的 teardown/lifecycle 契约，继续保留在聚合 hub；逐行范围、
source symbol 与分类由 `scripts/audit-renderer-hub-classification.mjs` 校验，focused suite
将 reviewedCount 从 149 提升至 158。

本轮再补充 app-primary 消息传输状态纯策略：`HI`（公开别名 `Ed`，17663--17665
行）仅识别 `sending_in_progress` 与 `polling_final` 两个进行中状态，不触碰 JSX、store
或生命周期副作用。该边界已迁移至 `src/renderer/app-primary/runtime/message-status.ts`，
由 `scripts/test-renderer-message-status.mjs` 覆盖 6 项输入断言；由于当前 renderer
尚无独立 named consumer，`Ed` 仍登记为未消费导出，避免伪造消费边。

本轮从 app-primary 未消费区迁出收件人字段归一化 helper：`YMe`（公开别名 `Ad`，
17541--17551 行）现由 `src/renderer/app-primary/runtime/normalize-recipient-fields.ts`
承载。该语义模块保留 recipient/cc/bcc 拆分、联系人名称投影、非法地址标记及首个 Bcc
前缀行为，不引入聚合 hub 的初始化副作用；`scripts/test-app-primary-normalize-recipient-fields.mjs`
覆盖名称投影、非法地址、Bcc 前缀和空输入边界。逐行分类证据已登记，reviewedCount
由 158 提升至 160。

本轮继续从 app-primary 未消费区登记四个真实生成边界：`G$`（公开别名 `aa`）创建
request-input activity context，`rK`（公开别名 `ac`）按固定顺序装配 editor/menu 样式依赖，
`Oze`（公开别名 `al`）绑定 annotation editor UI runtime，`Mj`（公开别名 `am`）初始化
connector icon map。四者都由相邻生成 surface 独占，缺少独立 named renderer consumer 或可安全
转移的 teardown 契约，因此保留在聚合 hub；逐行 source symbol 与范围登记于
`docs/renderer-hub-line-classification.json`，reviewedCount 由 160 提升至 164。

本轮再抽取 app-primary 技能 mention 的纯 kind policy：`PD`（公开别名 `yg`，4091--4097
行）只遍历 skill/plugin mention 节点，将 `plugin://` 与 `skills/*/skill.md` 路径规范化为
稳定产品 kind，并在显式偏好命中时保持该结果。该逻辑没有 JSX、store 或生命周期副作用，
已迁至 `src/renderer/app-primary/runtime/extract-skill-kind.ts`，由
`scripts/test-app-primary-extract-skill-kind.mjs` 覆盖 5 项路径、未知 kind 与 mention 投影断言；
逐行分类记录同步写入 `docs/renderer-hub-line-classification.json`，reviewedCount 提升至 169。

本轮从 app-primary 未消费区迁出 annotation selection/hover 样式纯投影：`JE`（公开别名
`Ag`，3686--3712 行）按 appearance、fill、border、zoom 与 shadow 选项生成 inline style，
不触碰 JSX、store 或生命周期。逻辑现由 `src/renderer/app-primary/runtime/annotation-selection-style.ts`
承载，并由 `scripts/test-app-primary-annotation-selection-style.mjs` 覆盖 hover、fill-only
与缩放边界；聚合导出保留兼容，逐行分类证据登记后 reviewedCount 提升至 170。

本轮继续从 app-primary 未消费区补齐三条逐行边界证据：`dF`（公开别名 `Df`，15592--15598
行）按 panel edge 可用性选择 bottom/right 目标；`KMe`（公开别名 `Hd`，17508--17525 行）
解析逗号分隔收件人并投影联系人；`GMe`（公开别名 `Id`，17502 行）将非空收件人桶投影为
稳定对象。三者都只服务相邻生成式 panel/composer surface，没有独立 renderer named consumer
或 teardown 契约，继续保留聚合 hub；逐行 source symbol、精确范围和语义模块归属已登记于
`docs/renderer-hub-line-classification.json`，reviewedCount 由 170 提升至 173。

本轮再补齐 app-primary 插件预填提示格式化边界：`FP`（公开别名 `Rf`，14864--14866 行）
仅构造 plugin mention Markdown、执行稳定转义并裁剪可选 prompt。其逻辑已由
`src/renderer/app-primary/runtime/create-prefilled-plugin-prompt.ts` 承载，属于无 JSX、store
或生命周期副作用的纯格式化策略；聚合导出保留兼容边，逐行证据登记后 reviewedCount 由
173 提升至 174。

本轮从 app-shared 未消费区迁出合并冲突状态纯策略：`hBe`（公开别名 `$U`，64725--64730
行）规范化 `mergeable`/`mergeStateStatus`，投影 `conflicts`、`unknown` 或空状态。逻辑现由
`src/renderer/app-shared/runtime/merge-conflict-state.ts` 承载，新增
`scripts/test-renderer-merge-conflict-state.mjs` 覆盖大小写、冲突优先级、未知值与空输入共 6
项断言；聚合导出保留兼容边，逐行分类证据登记；app-primary reviewedCount 保持 175。

本轮继续核对 app-primary 未消费区的三条真实生成边界：`r9e`（公开别名 `Ei`，78101--78113）
为模板 journey runtime 的局部状态/telemetry 编排，`yF`（公开别名 `Cf`，15649--15654）
为 composer runtime 的 lazy bootstrap，`fk`（公开别名 `Dh`，5019--5025）为 homepage takeover
portal/context bootstrap。三者均无独立 renderer named consumer 或 teardown owner，已登记为
generated-local 分类并保留聚合 hub；逐行 source symbol、精确范围和证据写入
`docs/renderer-hub-line-classification.json`，app-primary reviewedCount 由 179 提升至 182。

本轮再核对 app-primary markdown 编辑器附近的三条真实生成边界：`oPe`（公开别名 `Cu`，
21878--21892）负责 magic-selection 文档切片与 marker offset 计算，`sPe`（公开别名 `Su`，
21898--21900）负责 Markdown 文件 stem 归一化，`cPe`（公开别名 `bu`，21901--21912）负责
浅层 heading 投影。三者均由相邻编辑器 surface 独占，没有独立 renderer named consumer 或
teardown/lifecycle 契约，继续保留在聚合 hub；精确范围、source symbol 与证据已登记于
`docs/renderer-hub-line-classification.json`，app-primary reviewedCount 由 182 提升至 185。

2026-10-05 A5 继续批次：app-primary markdown 编辑器未消费导出 `Tu`（`TB`，21849--21856）已抽取为 `insert-selection-marker.ts`，明确安全位置解析、marker 序列化与失败边界；新增 `scripts/test-app-primary-create-editor-selection-range.mjs` 覆盖 ownerDocument 回退及 Range 投影。逐行分类证据登记后 reviewedCount 提升至 190。
本轮继续核对 app-primary 远程引用投影边界：`RP`（公开别名 `Ff`，14873--14875）仅委托相邻生成式 URL/reference normalizer，未形成独立 renderer named consumer、store 所有权或 teardown 契约；因此登记为 generated-local-helper 并保留聚合 hub。逐行 source symbol、精确范围与证据已写入 `docs/renderer-hub-line-classification.json`，reviewedCount 提升至 191。

2026-10-05 A5 继续批次：app-primary selection overlay 未消费导出 `Pr`/`r`（`Z3`/`$3`，91668--91680）完成逐行分类。`Z3` 计算两个 DOMRect-like bounds 的交集，`$3` 注册 overlay 的 overflow-style 依赖与允许集合；二者均为相邻生成 runtime 的局部边界，无独立 renderer named consumer 或 teardown owner，继续保留聚合 hub。分类证据登记后 app-primary reviewedCount 提升至 201。

2026-10-05 A5 继续批次：从 app-primary 未消费区补充五条真实生成边界逐行证据。`Ep`（`HM`，11020--11027）校验 reasoning effort 并按支持列表回退；`Lg`（`HE`，3643--3645）是 annotation marker 邻接的空 lazy 初始化；`Fg`（`KE`，3647--3651）建立 marker 缩放/颜色常量；`Km`（`uA`，6023--6038）装配 beacon action 依赖与状态符号；`Dp`（`UM`，11038--11042）装配 model/reasoning selector 依赖。它们均无独立 renderer named consumer、store 所有权或 teardown 边界，继续保留聚合 hub。逐行分类证据已写入 `docs/renderer-hub-line-classification.json`，app-primary reviewedCount 由 201 提升至 206。

2026-10-05 A5 继续批次：app-primary 未消费导出 `ND`（公开别名 `vg`，4079--4089）补齐文档级物理迁移。该边界只遍历 ProseMirror-like 文档中的 `skillMention`/`pluginMention` 节点，并复用既有 skill-kind 路径策略选择最新或显式偏好 kind；逻辑现由 `extractSkillKindFromDocument` 承载于 `src/renderer/app-primary/runtime/extract-skill-kind.ts`，新增 `scripts/test-app-primary-extract-skill-kind-document.mjs` 覆盖最新 mention、显式偏好、空文档和未知插件回退共 4 项断言。逐行分类证据登记后 app-primary reviewedCount 由 211 提升至 212。

2026-10-05 A5 继续批次：app-primary 未消费导出 `GD`（公开别名 `ug`，4136--4138）完成逐行分类。该 helper 仅触发相邻 plan/runtime 初始化并返回 `null`，属于生成式 lazy-bootstrap 局部边界，没有独立 renderer named consumer、store 所有权或 teardown 契约，继续保留聚合 hub。逐行分类证据登记后 app-primary reviewedCount 提升至 214。
同批补充 `HD`（公开别名 `_g`，4125--4130）：它仅创建相邻 plan capability signals，属于生成式 signal 初始化，同样没有独立 renderer consumer、store 所有权或 teardown 契约。逐行分类证据登记后 reviewedCount 提升至 215。

2026-10-05 T5 manifest gate：新增 `scripts/audit-renderer-hub-manifest.mjs`，对 app-shared、app-initial、app-primary 的每个 published export 逐项输出 `consumed`、`semantic`、`preserved-coupled` 或 `unreviewed`。manifest 仅将已有源码行号证据登记为 semantic/preserved-coupled，未审计导出保持 `unreviewed`；`--strict` 在存在未审计项时失败，禁止把缺证据项目静默标绿。

2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `kg`（源码符号 `ake`，3652--3659）登记为 `preserved-coupled`。该 helper 通过 `ownerDocument.defaultView.getComputedStyle` 读取 live DOM 元素的 CSS custom property，并依赖生成式 `bE` fallback；document/window 与样式生命周期耦合于生成 surface，无法在不改变所有权边界的情况下安全抽取。Manifest app-primary unreviewed 由 598 降至 597。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `uf`（源码符号 `fMe`，16103--16120）登记为 `preserved-coupled`。该 helper 等待 availability 事件或 timeout，同时监听 AbortSignal，并在 promise settlement 时清理 window/abort/timer 监听；其 PF/FF 事件状态、取消与 teardown 所有权均耦合于生成 event surface，不能安全拆出。Manifest app-primary unreviewed 由 597 降至 596。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Tt`（源码符号 `NF`，16054--16057）登记为 `preserved-coupled`。该 lazy bootstrap 顺序初始化 `Y`、`Zy`、`en`、`jF` 副作用并捕获 `MF` store signal，承担生成 app-primary 注册与状态 wiring 生命周期；不存在独立 renderer consumer 或可安全迁移边界。Manifest app-primary unreviewed 由 596 降至 595。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Ot`（源码符号 `spt`，104478--104503）登记为 `preserved-coupled`。该 helper 观察 Du 状态并为 live DOM target 创建 IntersectionObserver，同时监听 document visibilitychange，触发 dpt side effect，并在 teardown 中 disconnect/removeEventListener；观察器与 document 生命周期所有权耦合于生成 surface。Manifest app-primary unreviewed 由 595 降至 594。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Ph`（源码符号 `YO`，4764--4839）登记为 `preserved-coupled`。该 lazy initializer 顺序执行 Y/Wl/nf/zO/GO/Zy/en 注册副作用，构造 route/product metadata，并通过 `an` 捕获 Ir 派生 reactive store；其 provider/bootstrap 顺序与共享状态所有权耦合于生成 app-primary lifecycle。Manifest app-primary unreviewed 由 594 降至 593。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Uh`（源码符号 `SO`，4468--4471）登记为 `preserved-coupled`。该 lazy initializer 运行 qi/Y/qT/Hh 注册副作用，并创建相邻 attribution state helper 使用的两个 tS-backed store signals `bO`/`xO`；初始化顺序与 store 所有权属于生成 surface lifecycle。Manifest app-primary unreviewed 由 593 降至 592。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Wh`（源码符号 `gO`，4444--4452）登记为 `preserved-coupled`。该 attribution helper 通过 ET 发出 `CODEX_NEW_CHAT_SUGGESTION_ACTION_MESSAGE_SENT` analytics event，读取 `bO` store signal 并按条件清理 attribution state；analytics side effect 与 store 所有权耦合于生成 surface。Manifest app-primary unreviewed 由 592 降至 591。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `qh`（源码符号 `hO`，4441--4443）登记为 `preserved-coupled`。该 attribution setter 直接写入由 `SO` 创建、并被相邻 analytics/cleanup helper 消费的生成式 `bO` store signal；状态所有权耦合于 app-primary lifecycle。Manifest app-primary unreviewed 由 591 降至 590。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Hh`（源码符号 `TO`，4478--4523）登记为 `preserved-coupled`。该 lazy initializer 通过 Q/sf/xh 注册四类 artifact 本地化消息，并建立被 Cke/Oke 消费的 `wO` prompt registry；intl provider/cache 初始化与 registry 所有权耦合于生成 surface。Manifest app-primary unreviewed 由 590 降至 589。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Vh`（源码符号 `Cke`，4473--4475）登记为 `preserved-coupled`。该 formatter 从生成式 `wO` registry 解析 artifact descriptor，并委托注入的 intl formatter 渲染消息、通过 Gd 解析 plugin label；registry/provider 所有权耦合于生成 surface。Manifest app-primary unreviewed 由 589 降至 588。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `zh`（源码符号 `OO`，4526--4568）登记为 `preserved-coupled`。该 lazy initializer 通过 Ni/Z 注册生成 SVG/JSX icon component，并 memoize EO/DO renderer state；JSX runtime 与 icon registry lifecycle 由 app-primary generated surface 所有。Manifest app-primary unreviewed 由 588 降至 587。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Lh`（源码符号 `LO`，4585--4693）登记为 `preserved-coupled`。该 lazy initializer 创建 Ir-backed home-visit maps/sets、auto-disposed `FO` signal 与负责 beacon lifecycle state mutation 的 `IO` class；reactive scope、disposal 与生成 runtime store 所有权均耦合于 app-primary。Manifest app-primary unreviewed 由 587 降至 586。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `df`（源码符号 `NF`，16054--16057）登记为 `preserved-coupled`。该重复 published alias 指向与 `Tt/NF` 相同的 lazy bootstrap，初始化 Y/Zy/en/jF 副作用并捕获 MF store state，注册与 store wiring 生命周期耦合于生成 surface。另登记 `vf`（源码符号 `AF`，16004--16023）：其顺序初始化 OF、fa/Wi/Zr/Qo/Y/Q/iC/ud/Vr/fe/hi/CT/Qs/Lve 并捕获 JSX renderer kF，同样保留为 coupled。Manifest app-primary unreviewed 由 586 降至 584。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `lu`（源码符号 `B8`，100269--100273）登记为 `preserved-coupled`。该 lazy bootstrap 捕获生成式 `Out` runtime handle 并初始化 Nb approval/dialog state，供后续 JSX handlers 消费；注册顺序与状态所有权耦合于 app-primary surface。Manifest app-primary unreviewed 由 584 降至 583。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Zt`（源码符号 `V8`，100274--100568）登记为 `preserved-coupled`。该 approval dialog component 读取 `document.activeElement`，构造 JSX controls/keyboard handlers，并通过生成式 Out/Nb state 与 i18n bindings 连接 approve/decline actions；DOM focus、event handler 与 dialog state ownership 耦合于 renderer surface。Manifest app-primary unreviewed 由 583 降至 582。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Qt`（源码符号 `U8`，100569--100586）登记为 `preserved-coupled`。该 lazy bootstrap 顺序初始化 approval/dialog renderer runtime（kut、B8、Vr、bV、We、hi、L8、GQ、V$、G$）并捕获 JSX renderer H8；注册顺序及 dialog/intl state ownership 耦合于 app-primary。Manifest app-primary unreviewed 由 582 降至 581。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Si`（源码符号 `i9e`，78108--78117）与 `Ti`（源码符号 `a9e`，78119--78122）登记为 `preserved-coupled`。前者通过 s9e 写入 built-in artifact-template attachment inclusion 与 journey context；后者读写 P0/F0 journey state 并发出 xle create-flow event。两者均依赖生成 store/event 生命周期，不能安全拆出。Manifest app-primary unreviewed 由 581 降至 579。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `wi`（源码符号 `t9e`，78090--78095）登记为 `preserved-coupled`。该 helper 派生 carousel kind、创建 journeyId、写入 P0 journey state 并发出 pfe event；journey store 所有权与 event 生命周期耦合于 app-primary。Manifest app-primary unreviewed 由 579 降至 578。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `bi`（源码符号 `I0`，78201--78213）登记为 `preserved-coupled`。该 state initializer 顺序运行 Gxe/Y/ld/yDe/xh/qT/Hh 注册副作用，创建 f9e identity，并分配供 artifact helpers 使用的 P0/F0 tS-backed journey signals；初始化顺序与 reactive store 所有权耦合于 app-primary。Manifest app-primary unreviewed 由 578 降至 577。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `vi`（源码符号 `L0`，78215--78217）与 `yi`（源码符号 `R0`，78218--78221）登记为 `preserved-coupled`。`L0` 调用 `_O` 清理 attribution、清空 P0 journey signal 并重置 BD；`R0` 将 I0 journey 初始化与 HD/SO runtime initializer 组合，连接 artifact、approval/dialog attribution 与共享 signals。两者均受生成 store lifecycle 与初始化顺序约束。Manifest app-primary unreviewed 由 577 降至 575。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Fn`（源码符号 `uot`，91681--91897）登记为 `preserved-coupled`。该 JSX/DOM overlay component 持有 refs/state，读取 live `getBoundingClientRect` 几何，解析 portal/target selector，并通过 effects 协调 open/close callbacks；DOM measurement、portal ownership 与 React lifecycle 耦合于生成 renderer。Manifest app-primary unreviewed 由 575 降至 574。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Do`（源码符号 `_Y`，42870--42879）登记为 `preserved-coupled`。该 lazy intl initializer 通过 Q/ir 注册 compact composer working placeholder 并 memoize gY message metadata，供生成 composer JSX 消费；intl registry/cache 所有权耦合于 app-primary。Manifest app-primary unreviewed 由 574 降至 573。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Is`（源码符号 `OK`，36862--36888）登记为 `preserved-coupled`。该 lazy bootstrap 初始化 tab/overlay runtime，并从 active tabs、bottom/right panel stores 与 fF positioning projection 派生 DK/eGe reactive state；store 依赖与 overlay lifecycle ownership 耦合于 app-primary。Manifest app-primary unreviewed 由 573 降至 572。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `kf`（源码符号 `uF`，15588--15590）登记为 `preserved-coupled`。该 panel-position resolver 委托生成式 fF/dF state projection 与 lp normalization，选择 live bottom/right overlay target；定位策略耦合于 panel/store surface。Manifest app-primary unreviewed 由 572 降至 571。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Ws`（源码符号 `CK`，36840--36843）登记为 `preserved-coupled`。该 lazy bootstrap 分配供 tab registration、watcher 与 visibility/overlay coordination 使用的 bK/xK/SK maps；registry 所有权与 cleanup lifecycle 耦合于生成 panel surface。Manifest app-primary unreviewed 由 571 降至 570。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Ks`（源码符号 `XWe`，36810--36826）登记为 `preserved-coupled`。该 async helper 在 SK 注册 watcher，等待 tab acceptance，并在 state change、timeout 或 AbortSignal 时 resolve，同时清理 listener/watcher；registry、abort 与 promise lifecycle 耦合于生成 panel surface。Manifest app-primary unreviewed 由 570 降至 569。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `ei`（源码符号 `c2`，79084--79087）登记为 `preserved-coupled`。该 lazy JSX bootstrap 捕获生成 cet runtime，注册 Q 并初始化供相邻 thread-goal component 消费的 s2 renderer binding；注册顺序与 renderer state 所有权耦合于 app-primary。Manifest app-primary unreviewed 由 569 降至 568。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Ia`（源码符号 `jF`，16038--16041）登记为 `preserved-coupled`。该 lazy bootstrap 运行 Um/sf/xh 注册副作用，供相邻 project-link/composer runtime helper 使用；生成注册顺序与 renderer/store 所有权耦合于 app-primary。Manifest app-primary unreviewed 由 568 降至 567。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `ur`（源码符号 `wrt`，84829--84859）登记为 `preserved-coupled`。该 file-picker helper 创建并 append hidden DOM input，注册 one-shot change/cancel listeners，触发 click，并在 settlement 时移除节点；浏览器 DOM ownership、event lifecycle 与 promise cleanup 天然耦合。Manifest app-primary unreviewed 由 567 降至 566。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `xd`（源码符号 `F7`，113391--113395）登记为 `preserved-coupled`。该 lazy bootstrap 初始化生成 drag/drop runtime（N7、GC、en、hgt、rq）并捕获供 file-drop overlay 使用的 JSX renderer P7；注册顺序、DOM event handling 与 renderer ownership 耦合于 app-primary。Manifest app-primary unreviewed 由 566 降至 565。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Iu`（源码符号 `Yz`，20444--21118）登记为 `preserved-coupled`。该 lazy initializer 连接生成 table-editing runtime、parser/validation constants、plugin instances、DOM/table handlers 与 cleanup callbacks；editor plugin lifecycle 与 renderer ownership 耦合于 app-primary。Manifest app-primary unreviewed 由 565 降至 564。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `zo`（源码符号 `SJ`，40673--40707）登记为 `preserved-coupled`。该 lazy bootstrap 创建基于 DOM attachment state 的 tS reactive signal，在 composer/portal nodes 安装 MutationObserver，必要时通过 window.setTimeout 延迟 setup，并在 teardown disconnect/clear timer；DOM observer ownership 与 cleanup lifecycle 耦合于 app-primary。Manifest app-primary unreviewed 由 564 降至 563。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `To`（源码符号 `bY`，43452--43493）登记为 `preserved-coupled`。该 audio helper 管理 AbortController、timeout、AudioContext、fetch/decode/resume promise chain 与 close/abort teardown，并通过 window.setTimeout 协调 stop timing；browser media、network cancellation 与 cleanup lifecycle 耦合于 app-primary。Manifest app-primary unreviewed 由 563 降至 562。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Js`（源码符号 `vK`，36776--36779）与 `Vs`（源码符号 `JWe`，36796--36799）登记为 `preserved-coupled`。`vK` 初始化 browser-tab panel renderer/runtime；`JWe` 从生成 xK registry 解析 tab submitter 并调用 async submit。两者均受 registry、renderer 与 promise lifecycle 约束。Manifest app-primary unreviewed 由 562 降至 560。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `_l`（源码符号 `cU`，28500--28544）登记为 `preserved-coupled`。该 editor overlay helper 通过 To 计算 live anchor geometry，在 active 时安装 window resize/scroll listeners，并在 teardown 中释放 geometry observer、移除两类监听；DOM measurement 与 event cleanup 耦合于 renderer lifecycle。Manifest app-primary unreviewed 由 560 降至 559。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `bl`（源码符号 `sU`，28477--28498）登记为 `preserved-coupled`。该 lazy editor bootstrap 顺序初始化生成 renderer/runtime dependencies 并捕获 JSX renderer `oU`；plugin registration 顺序与 renderer ownership 耦合于 app-primary。Manifest app-primary unreviewed 由 559 降至 558。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `el`（源码符号 `iW`，30236--30240）登记为 `preserved-coupled`。该 lazy initializer 触发生成式 vU editor-selection runtime setup，供 SBe page-selection/DOM selection projection 消费；注册顺序与 DOM selection/renderer ownership 耦合于 app-primary。Manifest app-primary unreviewed 由 558 降至 557。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `_i`（源码符号 `S9e`，78330--78351）、`hi`（源码符号 `y9e`，78309--78315）与 `mi`（源码符号 `G0`，78373--78380）登记为 `preserved-coupled`。`S9e` 通过 requestAnimationFrame/performance.now 轮询 DOM focus 并在 timeout/settlement 清理；`y9e` 管理 W0 state entry 与 identity-checked teardown；`G0` 初始化 DOM target attribute、timeout 与 W0 reactive store。三者共同构成 app-primary focus/reveal lifecycle。Manifest app-primary unreviewed 由 557 降至 554。
2026-10-06 A5 T5 分类批次：app-shared 未消费导出 `At`（源码符号 `cDt`，121345--121373）登记为 `preserved-coupled`。该 icon initializer 通过共享 icon bootstrap `X/Y` 注册 generated chevron-right SVG metadata（geometry/capabilities/path body）；registry ownership 与 lazy asset lifecycle 耦合于 generated shared surface。
2026-10-06 A5 T5 分类批次：app-shared 未消费导出 `Dt`（源码符号 `uDt`，121376--121401）登记为 `preserved-coupled`。该 icon initializer 通过 X/Y 注册 generated sites-light SVG metadata（geometry/optical bounds/capabilities/path body）；registry ownership 与 lazy asset lifecycle 耦合于 generated shared surface。
2026-10-06 A5 T5 分类批次：app-shared 未消费导出 `Mt`（源码符号 `oDt`，121314--121342）登记为 `preserved-coupled`。该 icon initializer 通过 X/Y 注册 generated chevron-right 12px SVG metadata（geometry/optical bounds/capabilities/path body）；icon registry ownership 与 lazy asset lifecycle 耦合于 generated shared surface。
2026-10-06 A5 T5 分类批次：app-shared 未消费导出 `Ut`（源码符号 `JEt`，121053--121081）登记为 `preserved-coupled`。该 icon initializer 通过 X/Y 注册 generated notebook-light SVG metadata（geometry/optical bounds/capabilities/path body）；icon registry ownership 与 lazy asset lifecycle 耦合于 generated shared surface。
2026-10-06 A5 T5 分类批次：app-shared 未消费导出 `Ei`（源码符号 `fwt`，118889--118917）登记为 `preserved-coupled`。该 gauge-light-12 icon initializer 通过 X/Y 注册 generated SVG metadata（geometry/optical bounds/capabilities/path body）；icon registry ownership 与 lazy asset lifecycle 耦合于 generated shared surface。
2026-10-06 A5 T5 分类批次：app-shared 未消费导出 `wi`（源码符号 `mwt`，118920--118949）登记为 `preserved-coupled`。该 chevron-down-chevron-up-sm-light-16 icon initializer 通过 X/Y 注册 generated SVG metadata（geometry/optical bounds/capabilities/path body）；icon registry ownership 与 lazy asset lifecycle 耦合于 generated shared surface。
2026-10-06 A5 T5 分类批次：app-shared 未消费导出 `Si`（源码符号 `gwt`，118951--118980）登记为 `preserved-coupled`。该 chevron-up-chevron-down-sm-light-16 icon initializer 通过 X/Y 注册 generated SVG metadata（geometry/optical bounds/capabilities/path body）；icon registry ownership 与 lazy asset lifecycle 耦合于 generated shared surface。
2026-10-06 A5 T5 分类批次：app-shared 未消费导出 `vi`（源码符号 `bwt`，119009--119035）登记为 `preserved-coupled`。该 emoji-face-light-16 icon initializer 通过 X/Y 注册 generated SVG metadata（geometry/optical bounds/capabilities/path body）；icon registry ownership 与 lazy asset lifecycle 耦合于 generated shared surface。
2026-10-06 A5 T5 分类批次：app-shared 未消费导出 `yi`（源码符号 `vwt`，118982--119007）登记为 `preserved-coupled`。该 minus-sm-light-20 icon initializer 通过 X/Y 注册 generated SVG metadata（geometry/optical bounds/capabilities/path body）；icon registry ownership 与 lazy asset lifecycle 耦合于 generated shared surface。
2026-10-06 A5 T5 分类批次：app-shared 未消费导出 `hi`（源码符号 `Swt`，119036--119061）、`mi`（源码符号 `wwt`，119063--119092）与 `di`（源码符号 `Ewt`，119094--119123）登记为 `preserved-coupled`。三者均为通过 X/Y 注册 generated icon SVG metadata 的 lazy initializers，registry ownership 与 lazy asset lifecycle 耦合于 generated shared surface。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Fr`（源码符号 `Ott`，81600--81629）登记为 `preserved-coupled`。该 helper 更新 composer image-comment drafts 与 imageAttachments store，并根据 cloud/local 模式启动上传 promise、进度 settlement 与失败处理；其 qg/pm/Ttt/Mtt/jtt/ktt 依赖及 teardown/上传所有权均耦合于 composer runtime，没有独立 renderer 纯策略边界。Manifest app-primary unreviewed 由 497 降至 496。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Fm`（源码符号 `EA`，6507--6511）登记为 `preserved-coupled`。该 lazy initializer 顺序执行 Y/en/fm 注册副作用，并在共享 Ir scope 上通过 Xo 创建 TA signal；初始化顺序与 signal 所有权属于生成 renderer runtime infrastructure，没有独立 business consumer。Manifest app-primary unreviewed 由 496 降至 495。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Fp`（源码符号 `SM`，10803--10814）登记为 `preserved-coupled`。该 generated signal selector 通过 `js(Ir, ...)` 读取 `SS`/`xM`/`bM`/`OS`/`by`，并由共享 `Ir` scope autoDispose；reactive store 与 feature-flag 所有权耦合于 app-primary runtime，没有独立 renderer 纯策略边界。Manifest app-primary unreviewed 由 495 降至 494。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Ho`（源码符号 `lJ`，40182 起始）登记为 `preserved-coupled`。最终 export table 反解显示 `Ho` 与已登记的 `Hn` 同指生成 React category-selector component；该组件绑定 JSX/store、layout measurement、indicator state 与 generated CSS registry，无独立 renderer 纯策略边界。Manifest app-primary unreviewed 由 494 降至 493。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Hr`（源码符号 `Qet`，80599--80601）登记为 `preserved-coupled`。该 helper 委托 generated `Tse`，并按 `u_()` 平台判定选择 `zn`/`or` URL/path adapter；其导航/runtime state 与平台适配所有权耦合于生成 surface，没有独立 renderer business owner。Manifest app-primary unreviewed 由 493 降至 492。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Ht`（源码符号 `tdt`，101176--101178）登记为 `preserved-coupled`。该 generated reset helper 写入内部 `t5` signal，并由相邻 `ndt` account/repository hydration flow 消费；signal 所有权属于生成 runtime，没有独立 renderer business owner。Manifest app-primary unreviewed 由 492 降至 491。
2026-10-06 A5 T5 分类批次：app-primary 未消费导出 `Im`（源码符号 `wA`，6503--6504）登记为 `preserved-coupled`。该 generated monotonic updater 通过 scoped setter 写入由相邻 `EA` initializer 创建的内部 `TA` signal；state ownership 与 lifecycle 耦合于 generated runtime，没有独立 renderer policy boundary。Manifest app-primary unreviewed 由 491 降至 490。
2026-10-06 A5 T5 分类批次：app-shared 未消费导出 `$`（源码符号 `LDt`/`RDt`，121786 起始）登记为 `preserved-coupled`。该 generated icon initializer 注册 `book-open-moon-star-light-20` SVG metadata，registry ownership 与 lazy asset lifecycle 耦合于 generated shared surface，没有独立 renderer business contract。
2026-10-06 A5 T5 语义化批次：app-shared 未消费导出 `$$`（源码符号 `OT`，38506--38526）的 SVG local-id/reference prefix policy 已迁移至 `src/renderer/app-shared/runtime/prefix-svg-local-ids.ts`；新增 `scripts/test-app-shared-prefix-svg-local-ids.mjs` 覆盖 4 项断言，纯策略无 React/store/lifecycle 副作用。
2026-10-06 A5 T5 分类批次：app-shared 未消费导出 `$S`（源码符号 `Nnt`/`m3e`，86045--86047）登记为 `preserved-coupled`。该 generated icon initializer 注册 `slides-light-20` SVG metadata，registry ownership 与 lazy asset lifecycle 耦合于 generated shared surface，没有独立 renderer business contract。
2026-10-06 A5 T5 分类批次：app-shared 未消费导出 `$T`（源码符号 `J0`，82869）、`$V`（源码符号 `IHe`，66738）与 `$W`（源码符号 `JRe`，63896--63903）登记为 `preserved-coupled`。`$T` 是 generated laptop-light icon registry initializer；`$V` 是插件更新协议 schema；`$W` 是 ArrayBuffer/typed-array runtime utility。三者分别耦合于 icon registry、协议 schema 与 bundled runtime infrastructure，没有独立 renderer business owner。Manifest app-shared unreviewed 由 2816 降至 2813。
2026-10-06 A5 继续批次：app-shared 未消费导出 `$X/$Y/$Z/$_/$a/$b/$c/$f/$g/$i` 已完成 export-table 反解，分别对应 shared bootstrap、sandbox/plugin runtime、schema/style configuration 与 icon registry 生成面；均无独立 renderer business owner，登记为 `preserved-coupled`。Manifest app-shared unreviewed 由 2813 降至 2803。
2026-10-06 A5 继续批次：app-shared 未消费导出 `$j/$k/$l/$m/$n` 已完成反解，分别对应 analytics descriptor、generated registry/runtime、`plus-sm-light-16` icon、plugin/runtime class 与 shared bootstrap；均登记 `preserved-coupled`，无独立 renderer business owner。Manifest app-shared unreviewed 由 2803 降至 2798。
2026-10-06 A5 继续批次：app-shared 未消费导出 `$o/$p/$s/$t/$u/$v/$w/$x/$y/A$` 已完成源码反解，分别对应 icon registry、generated bootstrap 与 schema runtime surface；均登记 `preserved-coupled`，Manifest 未归类减少 10 项。
2026-10-06 A5 继续批次：app-shared `A3/AA/AB/AC/AD/AE/AF/AH/AJ/AK` 已完成 export-table 反解并登记 `preserved-coupled`；对应 generated runtime constant、telemetry/protocol schema、route/schema surface、icon registry 与 annotation/plugin lifecycle，无独立 renderer business owner。Manifest 未归类减少 10 项。
2026-10-06 A5 继续批次：app-shared `AL/AM/AN/AO/AP/AQ/AT/AU/AW/Aa/Ab/Ac/Ad/Af/Ag` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime bootstrap、telemetry/protocol schema、image/icon registry 与 shared lifecycle helper。Manifest 未归类减少 15 项。
2026-10-06 A5 继续批次：app-shared `Ai/Aj/Ak/Al/An/Ao/Ap/Ar/As/Au/Av/Aw/Ax/Ay/B$` 已完成源码反解并登记 `preserved-coupled`；覆盖 icon registry、schema/runtime、routing filter 与 shared lifecycle helper。Manifest 未归类减少 15 项。
2026-10-06 A5 继续批次：app-shared `B2/B3/BA/BB/BC/BD/BE/BF/BG/BH/BJ/BM/BN/BO/BP` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime registry、keyboard/path/protocol、schema、icon registry 与 telemetry surface。Manifest 未归类减少 15 项。
2026-10-06 A5 继续批次：app-shared `BQ/BR/BS/BT/BV/BW/BZ/B_/Ba/Bb/Bc/Bd/Bf/Bg/Bh` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime bootstrap、schema、icon registry、telemetry/runtime 与 approval lifecycle。Manifest 未归类减少 15 项。
2026-10-06 A5 继续批次：app-shared `Bi/Bj/Bl/Bm/Bn/Bo/Bp/Br/Bs/Bu/Bv/Bw/Bx/By/C$` 已完成源码反解并登记 `preserved-coupled`；覆盖 icon/bootstrap、telemetry/schema 与 shared runtime lifecycle。Manifest 未归类减少 15 项。
2026-10-06 A5 继续批次：app-shared `C1/C3/CA/CB/CC/CD/CE/CF/CG/CH/CI/CK/CM/CN/CO` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime registry、plugin/protocol、schema、icon、telemetry 与 persisted settings surface。Manifest 未归类减少 15 项。
2026-10-06 A5 继续批次：app-shared `CP/CQ/CR/CS/CT/CU/CV/CW/CX/CY/CZ/C_/Ca/Cb/Cc` 已完成源码反解并登记 `preserved-coupled`；覆盖 telemetry/protocol、schema、icon 与 shared runtime lifecycle。Manifest 未归类减少 15 项。
2026-10-06 A5 继续批次：app-shared `Cd/Cg/Ch/Ci/Cj/Ck/Cl/Cm/Cn/Co/Cp/Cr/Cs/Cu/Cv` 已完成源码反解并登记 `preserved-coupled`；覆盖 icon/bootstrap、telemetry、schema 与 shared runtime lifecycle。Manifest 未归类减少 15 项。
2026-10-06 A5 继续批次：app-shared `Cw/Cx/Cy/D/D$/D2/DA/DB/DC/DD/DE/DF/DG/DH/DI` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime registry、route/schema、icon/bootstrap 与 sandbox/workspace lifecycle。Manifest 未归类减少 15 项。
2026-10-09 A5 继续批次：app-shared `DK/DL/DM/DN/DO/DP/DQ/DR/DS/DT/DU/DV/DW/DX` 已完成源码反解并登记 `preserved-coupled`；覆盖 protocol/runtime、telemetry、schema、icon 与 shared lifecycle surface。Manifest 未归类减少 15 项。
2026-10-09 A5 继续批次：app-shared `DY/DZ/D_/Da/Db/Dc/Dd/Df/Dg/Dh/Di/Dj/Dk/Dl` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime/bootstrap、schema、icon、style 与 telemetry surface。Manifest 未归类减少 14 项。
2026-10-09 A5 继续批次：app-shared `Dm/Dn/Do/Dq/Dr/Ds/Du/Dv/Dw/Dx/Dy/Dz/E$/E0/E1` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime/bootstrap、schema、icon、gesture 与 telemetry/protocol surface。Manifest 未归类减少 15 项。
2026-10-09 A5 继续批次：app-shared `E2/EA/EB/EC/ED/EE/EF/EH/EI/EK/EM/EN/EO/EP/EQ` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime callbacks、route/schema、icon、telemetry 与 lifecycle surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `ER/ES/ET/EV/EW/EX/EY/EZ/E_/Ea/Eb/Ec/Ed/Ef` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime、schema、icon、SVG/color 与 shared lifecycle surface。Manifest 未归类减少 14 项。
2026-10-10 A5 继续批次：app-shared `Eg/Eh/Ei/Ej/Ek/El/Em/En/Eo/Ep/Eq/Er/Es/Et/Eu` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime、schema、icon、style 与 telemetry/lifecycle surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `Ev/Ew/Ex/Ey/Ez/F/F$/F0/F1/F2/F3/FA/FB/FC/FD` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime、schema、icon、gesture 与 protocol surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `FE/FF/FG/FH/FI/FM/FN/FO/FP/FR/FS/FT/FV/FW/F_` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime、schema、icon、gesture、protocol 与 telemetry surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `Fa/Fb/Fc/Fd/Ff/Fg/Fh/Fi/Fj/Fk/Fl/Fm/Fn/Fo/Fp` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime、schema、icon、CSS、shortcut 与 telemetry surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `Fr/Fs/Ft/Fu/Fv/Fw/Fx/Fy/G$/G0/GA/GB/GC/GD/GE/GF/GG/GH/GI/GK` 已完成源码反解并登记 `preserved-coupled`；覆盖 icon、schema、runtime、platform/path 与 telemetry surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `GL/GM/GN/GO/GP/GQ/GR/GS/GT/GU/GV/GW/GX/GY/GZ` 已完成源码反解并登记 `preserved-coupled`；覆盖 error/RPC、telemetry、keyboard/runtime、protocol、icon、host/plugin 与 React context surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `G_/Ga/Gb/Gc/Gd/Gg/Gh/Gi/Gj/Gk/Gl/Gm/Gn/Go/Gr` 已完成源码反解并登记 `preserved-coupled`；覆盖 schema、icon、SVG/React runtime 与 in-app browser telemetry surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `Gt/Gu/Gv/Gw/Gx/Gy/H$/H0/H2/HA/HB/HC/HD/HE/HG` 已完成源码反解并登记 `preserved-coupled`；覆盖 icon、schema、localization/runtime、protocol 与 shared state surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `HH/HL/HM/HN/HO/HP/HQ/HR/HS/HT/HW/HY/HZ/H_/Ha` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime/bootstrap、telemetry、schema、icon、migration 与 lifecycle surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `Hb/Hc/Hd/Hf/Hg/Hh/Hi/Hj/Hk/Hl/Hm/Hn/Ho/Hr/Hs` 已完成源码反解并登记 `preserved-coupled`；覆盖 schema、icon、shortcut/query/runtime、React SVG 与 lifecycle surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `Hu/Hv/Hw/Hx/Hz/I$/I0/I1/I2/IA/IB/IC/ID/IE/IF` 已完成源码反解并登记 `preserved-coupled`；覆盖 icon、schema、DOM/React runtime、plugin route 与 telemetry surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `IG/IJ/IL/IM/IN/IO/IP/IR/IS/IT/IV/IW/IX/IY/IZ` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime/bootstrap、telemetry、schema、protocol、React projection 与 lifecycle surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `Ia/Ic/Id/Ig/Ii/Ij/Ik/Il/In/Io/Iq/Ir/Is/It/Iu` 已完成源码反解并登记 `preserved-coupled`；覆盖 icon、bootstrap/runtime 与 workspace/onboarding telemetry surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `Iv/Iw/Ix/Iy/Iz/J/J$/J0/J2/JA/JB/JC/JD/JE/JF` 已完成源码反解并登记 `preserved-coupled`；覆盖 schema、icon、animation/React runtime、plugin route 与 telemetry surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `JG/JH/JI/JJ/JK/JL/JM/JN/JO/JP/JR/JS/JT/JU/JV` 已完成源码反解并登记 `preserved-coupled`；覆盖 URL/platform/path、runtime/state、schema、icon、plugin 与 telemetry surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `JW/JX/JY/JZ/J_/Ja/Jb/Jc/Jd/Jf/Jg/Jh/Ji/Jj/Jk` 已完成源码反解并登记 `preserved-coupled`；覆盖 renderer projection、React model、runtime/bootstrap、schema、icon、shortcut 与 telemetry surface。Manifest 未归类减少 15 项。
2026-10-10 A5 继续批次：app-shared `Jl/Jn/Jo/Jp/Jq/Jr/Js/Jt/Ju/Jv/Jw/Jx/Jy/Jz/K/K$/K0/K1/K4/KA/KB/KC/KD/KE/KF/KG/KH/KI/KJ/KK` 已完成源码反解并登记 `preserved-coupled`；覆盖 icon、schema、shortcut/path/runtime、plugin route、state 与 protocol surface。Manifest 未归类减少 30 项。
2026-10-10 A5 继续批次：app-shared `KL/KM/KN/KO/KP/KQ/KR/KS/KT/KU/KV/KW/KX/KY/KZ/K_/Ka/Kb/Kc/Kd/Kf/Kg/Kh/Ki/Kj/Kk/Kl/Km` 已完成源码反解并登记 `preserved-coupled`；覆盖 error/protocol、runtime/bootstrap、schema、icon、React projection、plugin route 与 telemetry surface。Manifest 未归类减少 28 项。
2026-10-10 A5 继续批次：app-shared `Kn/Ko/Kp/Kq/Kr/Ks/Kt/Kv/Kw/Kx/Ky/Kz/L/L$/L0/L1/L2/L3/L4/LA/LB/LC/LD/LE/LF/LG/LH/LI/LJ/LK` 已完成源码反解并登记 `preserved-coupled`；覆盖 icon、schema、runtime/bootstrap、React、plugin route、path 与 telemetry surface。Manifest 未归类减少 30 项。
2026-10-10 A5 继续批次：app-shared `LL/LM/LN/LO/LP/LQ/LR/LS/LT/LV/LW/LY/LZ/L_/La/Lb/Lc/Ld/Lg/Li` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime/state、protocol、schema、icon、React/thread projection、plugin lifecycle 与 bootstrap surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `Lj/Lk/Ll/Lm/Ln/Lp/Lq/Lr/Ls/Lt/Lu/Lv/Lw/Lx/Ly/Lz/M$/M0/M1/M2` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime/state、telemetry、icon、schema、shortcut、browser registry、style 与 React runtime surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `M3/M4/MA/MB/MC/MD/ME/MF/MG/MH/MI/MJ/MK/ML/MM/MN/MO/MP/MQ/MR` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime、telemetry、protocol、schema、icon、plugin route 与 bootstrap surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `MS/MT/MU/MV/MW/MX/MY/MZ/M_/Ma/Mb/Mc/Md/Mf/Mg/Mh/Mi/Mj/Mk/Ml` 已完成源码反解并登记 `preserved-coupled`；覆盖 schema、icon、environment/runtime、React、shortcut、DOM 与 telemetry surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `Mm/Mn/Mo/Mp/Mq/Mr/Ms/Mu/Mv/Mw/Mx/My/Mz/N/N$/N0/N1/N2/N4` 已完成源码反解并登记 `preserved-coupled`；覆盖 browser/DOM runtime、icon、schema、settings、React 与 validation surface。Manifest 未归类减少 19 项。
2026-10-10 A5 继续批次：app-shared `NA/NB/NC/ND/NE/NF/NG/NH/NI/NJ/NL/NM/NN/NO/NP/NQ/NR/NS/NT/NV` 已完成源码反解并登记 `preserved-coupled`；覆盖 telemetry、plugin/runtime、schema、icon、React、state 与 project projection surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `NW/NX/NY/NZ/N_/Na/Nb/Nc/Nd/Nf/Ng/Nh/Ni/Nj/Nk/Nl/Nm/Nn/No/Nq` 已完成源码反解并登记 `preserved-coupled`；覆盖 bootstrap/config、runtime、schema、icon、React、shortcut、error 与 browser lifecycle surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `Nr/Ns/Nt/Nv/Nw/Nx/Ny/Nz/O$/O0/O1/O2/O3/O4/OA/OB/OC/OD/OE/OF` 已完成源码反解并登记 `preserved-coupled`；覆盖 icon、schema、runtime/bootstrap、React、plugin route、validation 与 protocol surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `OG/OH/OI/OJ/OL/OM/ON/OO/OP/OQ/OR/OS/OT/OU/OV/OW/OX/OY/OZ/O_` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime/state、telemetry、protocol、schema、icon、React 与 browser lifecycle surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `Oa/Ob/Oc/Od/Og/Oi/Oj/Ok/Ol/Om/On/Oo/Op/Oq/Or/Os/Ou/Ov/Ow/Ox` 已完成源码反解并登记 `preserved-coupled`；覆盖 icon、schema、bootstrap/runtime、telemetry、shortcut、browser 与 validation surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `Oy/Oz/P$/P0/P1/P2/P4/PA/PB/PC/PD/PE/PF/PG/PH/PI/PJ/PL/PM/PN` 已完成源码反解并登记 `preserved-coupled`；覆盖 schema、config、icon、React/runtime、protocol、plugin route、state 与 telemetry surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `PO/PP/PQ/PR/PS/PT/PU/PV/PW/PX/PY/PZ/P_/Pa/Pb/Pc/Pd/Pf/Pg/Pi` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime/bootstrap、schema、icon、React、project state、shortcut 与 validation surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `Pj/Pk/Pl/Pm/Pn/Po/Pp/Pq/Pr/Ps/Pt/Pv/Pw/Px/Py/Pz/Q$/Q0/Q1/Q2` 已完成源码反解并登记 `preserved-coupled`；覆盖 telemetry、icon、schema、shortcut/browser runtime、React 与 settings surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `Q4/QA/QB/QC/QD/QE/QF/QG/QH/QJ/QK/QL/QM/QN/QO/QP/QQ/QR/QS/QT` 已完成源码反解并登记 `preserved-coupled`；覆盖 validation、protocol、schema、icon、telemetry、plugin route、URL 与 state lifecycle surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `QU/QV/QW/QY/QZ/Q_/Qa/Qb/Qd/Qf/Qg/Qi/Qj/Qk/Ql/Qm/Qn/Qo/Qp/Qq` 已完成源码反解并登记 `preserved-coupled`；覆盖 host/permission、runtime/bootstrap、schema、icon、motion、protocol、telemetry 与 browser surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `Qr/Qs/Qt/Qu/Qv/Qw/Qx/Qy/Qz/R$/R0/R1/R2/R3/RA/RB/RC/RD/RE/RF` 已完成源码反解并登记 `preserved-coupled`；覆盖 icon、schema、runtime/bootstrap、React、plugin route 与 protocol surface。Manifest 未归类减少 20 项。
2026-10-10 A5 继续批次：app-shared `RG/RJ/RK/RL/RM/RN/RO/RP/RQ/RR/RS/RT/RU/RV/RW/RX/RY/RZ/Ra/Rb` 已完成源码反解并登记 `preserved-coupled`；覆盖 runtime、protocol、telemetry、schema、icon、browser/React/state surface。Manifest 未归类减少 20 项。
2026-10-10 A5 扩大批次：app-shared `Rc/Rd/Rg/Ri/Rj/Rk/Rl/Rm/Rn/Rp/Rq/Rr/Rs/Rt/Ru/Rv/Rw/Rx/Ry/Rz/S/S$/S0/S1/S2/S3/SA/SB/SC/SD/SE/SF/SG/SH/SI/SJ/SK/SM/SN/SO` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-10 A5 扩大批次：app-shared `SP/SQ/SR/SS/ST/SV/SW/SY/SZ/Sa/Sb/Sc/Sd/Sf/Sg/Sh/Sj/Sk/Sl/Sm/Sn/So/Sp/Sq/Sr/Ss/Su/Sv/Sw/Sx/Sy/Sz/T/T$/T0/T1/T2/T3/T4/TA` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-10 A5 扩大批次：app-shared `TB/TC/TD/TE/TF/TG/TH/TI/TJ/TK/TL/TM/TN/TO/TP/TQ/TR/TS/TT/TV/TW/TY/TZ/T_/Ta/Tb/Td/Tg/Th/Ti/Tj/Tk/Tl/Tm/Tn/To/Tp/Tq/Tr/Ts` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-10 A5 扩大批次：app-shared `Tt/Tu/Tv/Tw/Tx/Ty/Tz/U$/U0/U1/U2/U3/U4/UA/UB/UC/UD/UE/UG/UH/UJ/UK/UL/UM/UN/UO/UP/UQ/UR/US/UT/UV/UW/UX/UY/UZ/U_/Ua/Ub/Uc` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-10 A5 扩大批次：app-shared `Ud/Uf/Ug/Uh/Ui/Uj/Uk/Ul/Um/Un/Uo/Up/Uq/Ur/Us/Uu/Uv/Uw/Ux/Uy/Uz/V/V$/V0/V1/V2/VA/VB/VC/VD/VE/VF/VG/VH/VJ/VK/VL/VM/VN/VO` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-10 A5 扩大批次：app-shared `VP/VQ/VR/VS/VT/VU/VV/VW/VX/VY/VZ/Va/Vb/Vc/Vd/Vf/Vg/Vh/Vi/Vj/Vk/Vl/Vm/Vn/Vo/Vp/Vq/Vr/Vs/Vu/Vv/Vw/Vx/Vy/Vz/W/W$/W0/W1/W4` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `WA/WB/WC/WD/WE/WF/WG/WH/WI/WJ/WL/WM/WN/WO/WP/WQ/WR/WS/WT/WV/WW/WX/WY/WZ/W_/Wa/Wb/Wc/Wd/Wf/Wg/Wh/Wi/Wj/Wk/Wl/Wm/Wn/Wo/Wp` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `Wq/Wr/Ws/Wt/Wu/Wv/Ww/Wx/Wy/Wz/X$/X0/X1/X2/X3/X4/XA/XB/XC/XD/XE/XF/XG/XH/XI/XJ/XK/XL/XM/XN/XO/XP/XQ/XR/XS/XT/XU/XV/XW/XY` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `XZ/X_/Xa/Xb/Xc/Xd/Xf/Xg/Xh/Xj/Xk/Xl/Xn/Xo/Xq/Xr/Xs/Xt/Xu/Xv/Xw/Xx/Xy/Xz/Y/Y$/Y0/Y1/Y3/Y4/YA/YB/YC/YD/YE/YG/YH/YI/YJ/YK` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `YL/YM/YN/YO/YP/YQ/YR/YS/YT/YU/YV/YW/YY/YZ/Y_/Ya/Yb/Yc/Yd/Yf/Yg/Yj/Yk/Yl/Yn/Yo/Yp/Yq/Yr/Ys/Yt/Yu/Yv/Yw/Yx/Yy/Yz/Z/Z$/Z0` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `Z1/Z2/ZA/ZB/ZC/ZD/ZE/ZF/ZG/ZH/ZJ/ZK/ZL/ZM/ZN/ZO/ZP/ZQ/ZR/ZS/ZT/ZU/ZV/ZW/ZX/ZY/ZZ/Z_/Za/Zb/Zd/Zf/Zg/Zi/Zj/Zk/Zl/Zm/Zn/Zo` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `Zp/Zq/Zr/Zs/Zt/Zu/Zv/Zw/Zx/Zy/Zz/_$/_0/_1/_2/_3/_4/_A/_B/_C/_D/_E/_F/_G/_H/_I/_J/_K/_M/_N/_O/_P/_Q/_R/_S/_T/_U/_V/_W/_X` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `_Y/_Z/_a/_b/_c/_d/_f/_g/_h/_i/_j/_k/_l/_m/_n/_o/_p/_q/_r/_s/_t/_u/_v/_w/_x/_y/_z/a$/a0/a1/a2/a3/a4/aA/aB/aC/aD/aE/aF/aG` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `aH/aI/aJ/aK/aL/aM/aN/aO/aP/aQ/aR/aS/aT/aU/aV/aW/aX/aY/aZ/a_/aa/ab/ac/ad/af/ag/ah/ai/aj/ak/am/ao/ap/aq/ar/as/au/av/aw/ax` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `ay/az/b$/b0/b1/b2/b3/b4/bA/bB/bC/bE/bF/bG/bH/bI/bJ/bK/bL/bM/bN/bO/bP/bQ/bR/bT/bU/bV/bW/bX/bY/bZ/ba/bb/bc/bd/bf/bg/bh/bi` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `bj/bk/bl/bm/bn/bo/bp/bq/br/bs/bt/bu/bv/bw/bx/by/bz/c$/c0/c1/c2/c3/c4/cA/cB/cC/cD/cE/cF/cG/cH/cI/cJ/cK/cL/cM/cN/cO/cP/cQ` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `cR/cS/cT/cU/cV/cW/cX/cY/cZ/ca/cb/cc/cd/cf/cg/ch/ci/cj/cl/cm/cn/co/cp/cq/cr/cs/cu/cv/cw/cx/cy/cz/d$/d1/d2/d3/d4/dA/dB/dC` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `dw/dx/dy/dz/e$/e0/e1/e2/e3/eA/eB/eC/eD/eE/eF/eG/eH/eI/eJ/eK/eL/eM/eN/eO/eP/eQ/eR/eS/eT/eV/eW/eX/eY/e_/ea/eb/ec/ed/eg/eh` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `ei/ej/el/em/en/eo/ep/eq/er/es/eu/ev/ew/ex/ey/ez/f/f$/f1/f2/f3/f4/fA/fB/fC/fD/fE/fF/fG/fH/fJ/fK/fL/fM/fN/fO/fP/fQ/fR/fS` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `fT/fU/fV/fX/fY/fZ/f_/fa/fb/fc/fd/ff/fh/fi/fj/fl/fm/fn/fo/fp/fq/fr/fs/ft/fu/fv/fw/fx/fy/fz/g/g$/g0/g1/g2/g3/gA/gB/gC/gD` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `gE/gF/gG/gH/gI/gJ/gK/gM/gN/gO/gP/gQ/gR/gS/gT/gU/gV/gW/gX/gY/gZ/ga/gb/gc/gd/gf/gg/gh/gi/gj/gk/gl/gm/gn/go/gp/gq/gr/gs/gt` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `gu/gv/gw/gx/gy/gz/h$/h0/h1/h2/h3/hA/hB/hC/hD/hE/hF/hH/hI/hJ/hK/hL/hM/hN/hO/hP/hQ/hR/hS/hT/hU/hV/hW/hX/hY/hZ/h_/ha/hb/hc` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `hd/hf/hg/hh/hj/hk/hl/hm/hn/ho/hp/hr/hs/hu/hv/hw/hx/hy/hz/i/i0/i1/i2/i3/i4/iA/iB/iC/iD/iE/iF/iG/iH/iI/iJ/iK/iM/iN/iO/iP` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `iQ/iR/iS/iT/iU/iV/iX/iY/iZ/i_/ia/ib/ic/id/if/ig/ih/ii/ij/ik/il/im/in/io/ip/iq/ir/is/it/iu/iv/iw/ix/iz/j/j$/j0/j1/j2/j3` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `j4/jA/jB/jC/jD/jE/jF/jG/jH/jI/jJ/jK/jL/jM/jN/jO/jP/jQ/jR/jS/jT/jV/jW/jX/jY/j_/ja/jb/jc/jd/jg/ji/jj/jk/jl/jm/jn/jo/jp/jq` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `jr/js/jt/ju/jv/jw/jx/jy/jz/k$/k0/k1/k2/k3/kA/kB/kC/kD/kE/kF/kG/kH/kI/kJ/kK/kL/kM/kN/kO/kP/kQ/kR/kS/kT/kU/kV/kW/kX/kY/kZ` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `k_/ka/kb/kc/kd/kg/ki/kj/kk/kl/km/kn/ko/kq/kr/ks/kt/ku/kv/kw/kx/ky/kz/l/l$/l0/l1/l2/l4/lA/lB/lC/lD/lE/lF/lG/lI/lJ/lK/lL` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `lM/lN/lO/lP/lQ/lR/lS/lT/lU/lV/lX/l_/la/lb/lc/ld/lf/lg/lh/li/lj/ll/lm/ln/lo/lp/lq/lr/ls/lu/lv/lx/ly/lz/m/m$/m1/m2/m3/mA` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `mB/mC/mD/mE/mF/mG/mH/mI/mJ/mK/mL/mM/mN/mO/mP/mQ/mR/mS/mT/mU/mV/mW/mX/mY/m_/ma/mb/mc/md/mf/mh/mj/mk/ml/mm/mn/mo/mp/mq/mr` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `ms/mu/mv/mw/mx/my/mz/n/n0/n1/n2/n3/nA/nB/nC/nD/nE/nF/nG/nH/nI/nJ/nK/nL/nM/nN/nO/nP/nQ/nR/nS/nT/nU/nV/nW/nX/nY/nZ/n_/na` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `nb/nc/nd/ng/nh/ni/nj/nk/nm/nn/no/np/nq/nr/ns/nt/nu/nv/nw/nx/ny/nz/o/o$/o0/o1/o2/o3/o4/oA/oB/oC/oD/oE/oF/oG/oH/oI/oJ/oK` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `oL/oM/oN/oO/oP/oQ/oR/oS/oT/oU/oV/oW/oX/oa/ob/oc/od/of/og/oh/oi/oj/ok/ol/om/oo/op/or/os/ot/ou/ov/ow/ox/oy/oz/p$/p1/p2/p3` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `pA/pB/pC/pD/pE/pF/pG/pH/pI/pJ/pK/pM/pN/pO/pP/pQ/pR/pS/pT/pU/pV/pW/pX/pY/p_/pa/pb/pc/pd/pf/pg/ph/pi/pj/pl/pm/pn/po/pp/pq` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `pr/ps/pt/pu/pv/pw/px/py/pz/q$/q0/q1/q2/q3/qA/qB/qC/qD/qE/qF/qG/qH/qI/qJ/qK/qL/qM/qN/qO/qP/qR/qS/qU/qV/qW/qX/qY/qZ/q_/qa` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `qb/qc/qd/qf/qg/qh/qi/qj/qk/ql/qn/qo/qq/qr/qs/qt/qu/qw/qx/qy/qz/r0/r1/r2/r3/r4/rA/rB/rC/rD/rE/rF/rG/rH/rI/rK/rM/rN/rO/rP` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `rQ/rR/rS/rT/rU/rV/rW/rX/rY/r_/ra/rb/rc/rd/rf/rg/rh/ri/rj/rk/rm/rn/ro/rp/rq/rr/rs/ru/rv/rw/rx/ry/rz/s/s$/s0/s1/s2/s3/s4` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `sA/sB/sC/sD/sE/sF/sG/sH/sI/sJ/sK/sL/sM/sN/sO/sP/sQ/sR/sS/sT/sU/sV/sW/sX/sY/s_/sa/sb/sc/sd/sf/sg/sh/si/sj/sk/sl/sm/sn/so` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `sp/sq/sr/ss/st/su/sv/sx/sz/t0/t1/t2/t3/t4/tA/tB/tC/tD/tE/tF/tG/tH/tI/tJ/tK/tL/tM/tN/tO/tP/tQ/tR/tS/tT/tV/tW/tX/tY/tZ/t_` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `ta/tb/tc/td/tg/th/ti/tj/tk/tl/tm/tn/to/tp/tq/tr/ts/tu/tv/tw/tx/ty/tz/u$/u1/u2/u3/u4/uA/uB/uC/uD/uE/uF/uG/uH/uI/uJ/uK/uM` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `uN/uO/uP/uQ/uR/uS/uT/uU/uV/uX/uY/uZ/u_/ua/ub/uc/ud/uf/ug/uh/ui/uj/uk/ul/um/un/uo/up/uq/ur/us/ut/uu/uv/uw/ux/uy/uz/v/v$` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `v0/v1/v2/v3/v4/vA/vB/vC/vD/vE/vF/vG/vH/vI/vJ/vK/vL/vM/vN/vO/vP/vQ/vR/vS/vT/vU/vV/vY/vZ/v_/va/vb/vc/vd/vf/vg/vh/vj/vk/vl` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `vm/vn/vo/vp/vq/vr/vs/vu/vv/vw/vx/vy/vz/w/w$/w0/w1/w2/w3/w4/wA/wB/wC/wD/wE/wF/wG/wH/wI/wK/wM/wN/wO/wP/wQ/wR/wS/wT/wU/wV` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `wW/wX/wY/wZ/w_/wa/wb/wd/wf/wg/wh/wj/wk/wl/wm/wn/wo/wq/wr/ws/wt/wu/wv/ww/wx/wz/x$/x0/x1/x2/x3/x4/xA/xB/xC/xD/xE/xF/xG/xH` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `xI/xJ/xK/xL/xM/xN/xO/xP/xQ/xR/xS/xT/xV/xW/xX/xY/xZ/xa/xb/xc/xd/xg/xh/xi/xj/xk/xl/xm/xn/xo/xp/xq/xr/xs/xt/xu/xv/xw/xx/xy` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `xz/y/y$/y0/y1/y2/y3/y4/yA/yB/yC/yD/yE/yF/yG/yH/yI/yJ/yK/yL/yM/yN/yO/yP/yQ/yR/yS/yT/yU/yV/yY/yZ/ya/yb/yc/yd/yf/yg/yh/yj` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 扩大批次：app-shared `yk/yl/ym/yn/yo/yp/yq/yr/ys/yu/yv/yw/yx/yy/yz/z/z$/z0/z1/z2/z3/z4/zA/zB/zC/zD/zE/zF/zH/zJ/zK/zL/zM/zN/zO/zP/zQ/zR/zS/zT` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 跨 bundle 批次：app-shared `zV/zW/z_/za/zb/zc/zd/zf/zg/zi/zj/zk/zl/zm/zn/zo/zp/zq/zr/zs/zu/zv/zx/zy/zz` 与 app-initial `$/$$/$$t/$0/$0t/$1/$1t/$2/$2t/$3/$3t/$4/$5/$5t/$6` 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 40 项。
2026-10-11 A5 app-initial 批次：`$6t/$7/$7t/$8/$8t/$9/$9t/$A/$At/$B/$C/$Ct/$D/$Dt/$E/$Et/$F/$Ft/$G/$Gt/$H/$Ht/$I/$It/$J/$Jt/$Kt/$L/$Lt/$M/$Mt/$N/$Nt/$O/$Ot/$P/$Pt/$Q/$Qt/$R` 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 40 项。
2026-10-11 A5 app-initial 批次：`$Rt/$S/$Sn/$St/$T/$Tt/$U/$Ut/$V/$Vt/$Wt/$X/$Xt/$Y/$Yt/$Z/$Zt/$_/$_n/$_t/$a/$an/$at/$bn/$bt/$c/$cn/$ct/$d/$dn/$dt/$et/$f/$ft/$g/$gn/$gt/$h/$hn/$ht` 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 40 项。
2026-10-11 A5 app-initial 批次：`$i/$in/$it/$j/$jt/$k/$kt/$l/$lt/$mn/$mt/$n/$nn/$nt/$o/$on/$ot/$p/$pn/$pt/$q/$qt/$r/$rn/$rt/$s/$t/$tn/$tt/$u/$un/$ut/$vn/$vt/$w/$wt/$x/$xn/$xt/$y` 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 40 项。
2026-10-11 A5 app-initial 批次：`$yn/$yt/$z/$zt/A/A$/A$t/A0t/A1/A2/A2t/A3/A3t/A4/A4t/A5/A5t/A6/A6t/A7/A7t/A8/A8t/A9/AA/AAt/AB/ABt/AC/ACn/ACt/AD/ADt/AE/AEt/AF/AFt/AG/AGt/AH` 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 40 项。
2026-10-11 A5 app-initial 扩大批次：`$Ab/$Abn/$Abt/$Ac/$Acn/$Act/$Ad/$Adn/$Adt/$Aen/$Aet/$Afn/$Aft/$Agn/$Agt/$Ah/$Ahn/$Aht/$Ai/$Ain/$Ait/$Aj/$Ajt/$Ak/$Akt/$Al/$Aln/$Alt/$Am/$Amn/$Amt/$An/$Ann/$Ant/$Ao/$Aon/$Aot/$Ap/$Apn/$Apt/$Aq/$Aqt/$Ar/$Arn/$As/$Asn/$Ast/$At/$Atn/$Att/$Au/$Aut/$Av/$Avn/$Avt/$Aw/$Awt/$Ax/$Axn/$Axt/$Ay/$Ayn/$Ayt/$Az/$Azt/$B/$B$/$B$t/$B0/$B0t/$B1/$B1t/$B2/$B2t/$B3/$B3t/$B4/$B5/$B5t/$B6/$B7/$B7t/$B8/$B9/$B9t/$BA/$BAt/$BB/$BBt/$BC/$BCn/$BCt/$BD/$BDt/$BE/$BEt/$BF/$BFt/$BG/$BH/$BHt/$BI/$BIt/$BJ/$BJt/$BK/$BKt/$BLt/$BM/$BMt/$BN/$BNt/$BO/$BOt/$BP/$BQ/$BQt/$BR/$BRt/$BS/$BSn/$BSt/$BT/$BTt/$BU/$BUt/$BV/$BVt/$BW/$BWt/$BX/$BXt/$BYt/$BZ/$BZt/$B_/$B_n/$B_t/$Ba/$Ban/$Bat/$Bb/$Bbn/$Bbt/$Bc/$Bct/$Bd/$Bdn/$Bdt/$Ben/$Bet/$Bf/$Bft/$Bg/$Bgn/$Bh/$Bhn/$Bht/$Bi/$Bin/$Bit/$Bj/$Bjt/$Bk/$Bkt/$Bl/$Bln/$Blt/$Bmn/$Bmt/$Bn/$Bnn/$Bnt/$Bo/$Bon/$Bot/$Bp/$Bpn/$Bpt/$Bq/$Bqt/$Br/$Brt/$Bs/$Bsn/$Bt/$Btn/$Btt/$Bu/$But/$Bv/$Bvn/$Bvt/$Bw/$Bwt/$Bx/$Bxn/$Bxt/$Byn/$Byt` 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 200 项。
2026-10-11 A5 app-initial 批次：`$AHt/$AI/$AIt/$AJ/$AJt/$AK/$AL/$ALt/$AM/$AMt/$AN/$ANt/$AO/$AOt/$AP/$APt/$AQ/$AQt/$AR/$ARt/$AS/$ASn/$ASt/$AT/$ATt/$AU/$AV/$AVt/$AW/$AWt/$AX/$AY/$AYt/$AZ/$AZt/$A_n/$A_t/$Aa/$Aan/$Aat` 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 40 项。
2026-10-11 A5 app-initial 批量推进：本批 500 个 alias 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 500 项。
2026-10-11 A5 app-initial 批量推进：本批 1000 个 alias 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 1000 项。
2026-10-11 A5 app-initial 批量推进 B6：本批 1000 个 alias 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 1000 项。
2026-10-11 A5 app-initial 批量推进 B7：本批 1000 个 alias 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 1000 项。
2026-10-11 A5 app-initial 批量推进 B8：本批 1000 个 alias 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 1000 项。
2026-10-11 A5 app-initial 收尾批次：本批 490 个 alias 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 490 项。
2026-10-11 A5 app-primary 收尾批次：本批 490 个 alias 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类应归零。
2026-10-11 A5 app-initial 批量推进：本批 1000 个 alias 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 1000 项。
2026-10-11 A5 app-initial 批量推进：本批 1000 个 alias 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 1000 项。
2026-10-11 A5 app-initial 批量推进：本批 1000 个 alias 已完成 export-table 反解并登记 `preserved-coupled`。Manifest 未归类减少 1000 项。
2026-10-11 A5 扩大批次：app-shared `dD/dE/dF/dG/dH/dI/dJ/dK/dL/dM/dN/dO/dP/dQ/dR/dS/dT/dU/dV/dW/dX/dY/d_/da/dc/dd/df/dh/dj/dk/dl/dm/dn/do/dp/dq/dr/ds/du/dv` 已完成源码反解并登记 `preserved-coupled`；覆盖 shared runtime/module surface。Manifest 未归类减少 40 项。
2026-10-11 A5 分类口径收敛：补登记 app-shared 138、app-initial 514、app-primary 14 个此前被消费解析器漏识别的 generated aliases，全部完成 source-symbol 反解并登记 `preserved-coupled`。分类门禁未审计项减少 666 项。

2026-11-02 announcement/migration semantic batch：七个 live app-primary contracts 已迁入 checked-in TypeScript owners。完整 responsive Home announcement Banner presentation 现与 announcement state 同属一个 owner；GPT-to-plugin migration 的 visit/dismiss state 现与 content owner 共享 account/user-scoped signal family，避免 rebuilt chunks 各自生成状态。Strict hub manifest 当前为 app-shared 375/3,185、app-initial 1,484/8,204、app-primary 170/917 consumed，12,306 exports 中 unreviewed 为 0。app-primary 从 177 降至 170 是真实 semantic extraction；app-initial 增加 1 是 Banner owner 直接消费 Badge。Renderer verification 继续为 1,888/1,888，并逐 chunk 显式登记 intentional dependency migrations；本批不表示剩余 hub consumers 或 preserved inventories 已完成。
