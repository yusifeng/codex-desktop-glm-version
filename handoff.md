# Handoff：ChatGPT/Codex 桌面版（v26.917.71314）macOS 客户端源码还原

> 本文档是交接 prompt，也是 goal 说明。请通读全文再动手；所有「必须/禁止」
> 都是前一轮工作中真实踩过的坑。

---

## 一、使命（Objective）

把 macOS `ChatGPT.app`（Codex 桌面版，Electron + React 19）从解包 ASAR 的
编译产物**还原为可迭代的真实源码**——语义化命名 + 真实模块结构，而不是
"格式化过的 minified 代码"。

**核心验收标准（不可妥协）：** 每个"已重写" chunk 的构建产物与官方发布版
**结构等价**——import 依赖集合一致 + ESM 导出符号面一致（由 verify 脚本
机器验证）。语义源码与逐字节兼容的双轨并存，任意比例混合可构建出完整 app。

**优先级（用户明确指定）：GUI 优先（renderer 网页界面部分）**。即：
主窗口 HTML 界面（消息流、composer、设置页、侧边栏、内置浏览器等）
> 主进程逻辑（main）> 共享库（shared）> 其余 chunk。
main 和 shared 的"已消费 API"层已基本完成（见下），接下来的主战场是 renderer。

---

## 二、两个仓库与目录约定

- **工作仓库**：`/Users/david/Workspace/ppio_github/codex-desktop-glm-version`
  （git 管理，main 分支，124+ commits，工作树保持干净）
- **只读参考**：`/Users/david/Workspace/ppio_github/chatgpt-desktop-src`
  ——未修改的 asar 解包目录（verify 脚本默认从这里取"官方原始产物"）
  **绝对不要改动这个目录**。
- 参考仓库（只读，价值有限）：`/tmp/codex-refs/decode-codex/restored/`
  可用作部分模块边界的地图（如 conversations/composer 的组件划分思路）；
  `codex-analysis` 已确认无 renderer 内容，可忽略。

关键路径：
| 路径 | 内容 |
|---|---|
| `src/main/` | 主进程语义源码（bootstrap/main-app/shared…） |
| `src/main/src-DldfpmrL.ts` | shared chunk（692 导出）的格式化原版（**只读对照**，勿改） |
| `src/main/main-C-Mhak1n.ts` | main chunk 的格式化原版（同上） |
| `src/renderer/<语义名>/` | 已重写 renderer chunk 的语义源码 |
| `src/webview/assets/` | 其余 renderer chunk 的"原版格式化"形态（transform-only） |
| `src/main/types/chunk-modules.d.ts` | 未重写 main/shared 导出的 TS 声明（压缩别名 → any/语义类型） |
| `src/renderer/types/rchunk-modules.d.ts` | 未重写 renderer chunk 的 `@rchunk/*` 声明 |
| `scripts/` | 构建与验证流水线（见第四节） |
| `docs/` | 分析文档与导出地图（见第五节） |

---

## 三、当前状态（截至交接时）

### 2026-09-29 当前状态（优先以本节为准）

交接后的 renderer 主线已经完成 composer、sidebar 和当前登记清单的大批重写，
但尚未完成全量 app-code：

- `REWRITTEN`：1128 个语义 chunk；`verify-renderer` 为 1128/1128。
- `PRESERVED_ASSETS`：63 个经审计的 vendor/generated/data/worker 资产，继续
  使用 transform-only 轨道，不伪造业务源码。
- `INCREMENTAL_HUBS`：12 个聚合边界。`app-shared/app-initial/app-primary` 按
  实际消费面类型化；构建器合并出的 Popcorn、imported-setup、checkout hub
  由消费审计锁定，禁止无声明的压缩导出扩张。
- `node scripts/audit-renderer-tail.mjs` 的 0 pending **只表示当前 `CHUNKS` 登记集
  内部无悬空项**，不能当成全量 renderer 完成证明。
- 全量 `docs/renderer-app-chunks.json` 有 2247 个 app-code 文件；必须运行
  `node scripts/audit-renderer-app-coverage.mjs` 查看真实覆盖与剩余数量。当前为
  1138/2247 tracked、1109 pending；composer 47/47、sidebar 12/12、terminal 6/6、
  browser 19/19、settings 70/70、dialogs-menus 108/108、home-onboarding 40/40 与
  git-github-worktree 63/63 已覆盖；conversation-thread 当前 101/101，pages-routes
  92/92；animations 7/7、observability-cloud 8/8、auth-profile 13/13 也已收官，
  hooks 24/24、skills-plugins-mcp 30/30、panels 20/20、charts-ui 17/17 已收官；
  editor-docs 为 38/42，artifact-preview 为 47/53。
- `node scripts/audit-app-shared-consumption.mjs`：341 个实际消费导出均有语义
  声明，0 missing、0 any、0 direct namespace use。
- main 结构验证 11/11；TypeScript 错误基线已经从 139 降至 73。

2026-09-29 已完成 terminal/browser 运行时批次：terminal panel bootstrap、终端
thumbnail/background thumbnail、ASCII canvas/engine、browser voice availability、
site actions state、扩展连接状态说明和 browser settings visibility。专项行为测试
34/34；`mark-session-create` 按实际消费的 `dt/ft/n/r/t` 登记为增量 hub，未复制
其余未消费 voice 聚合导出。

2026-09-29 已继续完成 terminal panel 与 terminal tab，覆盖会话创建/注册、键盘
控制序列、粘贴、云端环境状态、本地 workspace root 切换和 shell 感知的 `cd`
命令。专项行为测试 29/29；renderer 全量门禁 981/981、main 11/11、tsc 73。
`xterm-window-zoom` 按真实副作用消费登记为第 11 个增量 hub，terminal 全量覆盖
达到 6/6。

2026-09-29 已完成 browser address shortcut，语义化浏览器标签 mention 的挂载、
失焦消退、宿主指针事件、metadata 更新与 overlay 状态传递。专项行为测试 15/15；
renderer 全量门禁 982/982，browser 覆盖达到 15/19。

2026-09-29 已完成 site edit route，恢复站点编辑入口对可复用 ChatGPT/Codex
会话的探测、恢复与导航，并在不可复用时携带预填 prompt 回退首页；有效站点上下文
还会重新打开 live URL。专项行为测试 16/16；renderer 全量门禁 983/983，browser
覆盖达到 16/19。

2026-09-29 已完成 site preview，恢复预览 iframe 生命周期、可信站点来源校验、
annotation 消息与捕获预算、导航/刷新/标注/分享/关闭控件，以及 loading/error
状态。专项行为测试 20/20；renderer 全量门禁 984/984，browser 覆盖达到 17/19。

2026-09-29 已完成 browser use settings，恢复宿主可用性、通用浏览器偏好、自动填充
与密码、扩展、下载和站点设置分区，以及 history/downloads/extensions 等子路由的
可见性门控与回退导航；设置写入、下载目录选择和清理数据错误提示均接回宿主运行时。
专项行为测试 19/19；renderer 全量门禁 985/985，browser 覆盖达到 18/19。

2026-09-29 已完成 symbol browser，恢复 emoji/icon 双模式、全文搜索、受限可选集、
最近使用、分类导航、键盘移动、受控查询、图标颜色和选中态。新增生成器从发布资产
机械提取 1898 个 Unicode emoji（含旗帜与 ZWJ 序列），避免复制压缩组件实现。专项
行为测试 18/18；renderer 全量门禁 986/986，browser 覆盖达到 19/19。

2026-09-29 已完成 settings 第一批五个缺口：debug settings 恢复 Chrome 调试页与
六个 GPU tearing 隔离开关；cloud preferences 恢复 diff 视图、branch format 校验、
预览和保存反馈；storage settings 恢复容量进度、Files/Images 汇总、Library 导航与
埋点；connector settings redirect 恢复 canonical plugin 跳转和非 canonical 连接
modal 兜底；profile settings 恢复 CME 医疗资质表单、校验与保存 toast。专项行为测试
108/108；renderer 全量门禁 991/991、main 11/11、tsc 73，settings 覆盖达到 52/70。

2026-09-29 已完成 settings 第二批四个缺口：Appshots 恢复可用性门控、双键热键、
目标会话、音效与演示视频；Code Review 恢复个人/安全审查触发策略、严重级别与 credits
偏好；Usage Code Review 恢复 7/30 天用量查询、五类图表、priority 补差与情绪汇总；
Worktrees Settings 恢复管理摘要、状态、关联会话、打开/新聊天、清理与刷新。专项行为
测试 98/98；renderer 全量门禁 995/995、main 11/11、tsc 73，settings 覆盖达到
56/70。`activity-chart` 发布包暴露 43 个图表聚合导出，当前仅消费 `H/U/n/t`，因此
按第 12 个 typed-consumer-surface hub 登记，未复制未消费图表实现。

2026-09-29 已完成 settings 第三批：Git settings 恢复 review mode、branch prefix、
merge/force-push/draft PR、指令与 PR watcher automation；Safety settings 恢复 quiet/study
schedule 编辑、校验、未保存变更与保存反馈；Keyboard Shortcuts 恢复搜索、分组排序、
平台键位、冲突、清除/替换与重置。并补齐 662B 的 legacy study hours schedule 三函数
叶子依赖。专项行为测试 90/90；renderer 999/999、main 11/11、tsc 73，settings 59/70。

2026-09-29 已完成 settings 第四批：Hooks settings 恢复项目根目录探测、来源列表、
详情、启停、信任、受管状态、打开配置与刷新；Import settings 恢复可用性门控、来源
选择、导入进度/历史、失败重试、Hooks 导航与自动同步；Pets route 恢复内置/自定义
宠物、预览、Mini 禁用、尺寸与显隐桥接；Voice settings 恢复麦克风、语言、语音可用性、
选择试听、保存与快捷键；Trusted Contact 恢复资格、邀请、不可用、重发、取消/移除和
personal note 流程。专项行为测试 139/139；renderer 1004/1004、main 11/11、tsc 73，
 settings 64/70。

2026-09-29 已完成 settings 第五批：Agent settings 恢复主机配置层、审批、sandbox、
web search、reasoning、实验功能与运行时依赖诊断；Billing settings 恢复资格、计划、
钱包、付款方式和订阅管理；Computer History 恢复启停/暂停、权限、指示器、历史加载、
单项删除与分时段清理；Computer Use 恢复宿主可用性、应用授权、扩展状态、home 目录、
声音与锁定使用；Parental Controls 恢复资格、家庭成员、邀请、深链和只读 child 视图；
Settings Page 恢复主机切换、可见分区、路由与未保存变更。专项行为测试 202/202；renderer
1010/1010、main 11/11、tsc 73，settings 达到 70/70。同期确认两个 `gitGraph-*` 是
Mermaid/Langium 生成包装器，改列为 preserved vendor，app-code 总数校正为 2248。

2026-09-29 已完成 renderer GUI 第六批：Options Menu 恢复浏览器菜单、zoom、页面动作、
清理数据与扩展列表/触发/固定/管理；Onboarding Page 恢复首次登录 gate、角色、设置和完成
步骤；Extension Onboarding 恢复多浏览器检测、侧栏/固定 checklist、样例与 inventory 流程；
Thread Goal 侧栏恢复草稿、revert、快捷保存和 materialize/cleanup；Queued Message List 恢复
暂停/继续、编辑/删除/side chat、拖拽重排和多类型附件摘要。专项行为测试 221/221；renderer
1015/1015、tsc 对本批零新增。dialogs-menus 108/108、home-onboarding 40/40 已全覆盖，
conversation-thread 推进至 93/102。

2026-09-29 已完成 renderer GUI 第七批：Local Conversation Subagents Panel 恢复 active/done
分组、状态/耗时、选择和详情；Background Terminal Tab 恢复 command output 聚合、snapshot
回退、订阅和已读状态；Thread Context 与 Side Panel Tabs facade 将线程 host/git/cwd signals 及
MCP/timeline/sandbox 侧栏动作恢复为语义导出；Select Workspace Page 恢复候选目录、全选、
Add project 与宿主事件；Offer Page 恢复身份 gate、资格查询和个人/团队结账跳转。专项行为
测试 179/179；renderer 1021/1021、main 11/11、tsc 73，conversation-thread 97/102、
pages-routes 52/92。

2026-09-29 已完成 renderer GUI 第八批：Background Agent entry 恢复 hydrated/background
agent 打开动作与 tab 类型；MCP App Thread Side Panel 恢复宿主 frame 容器；Trusted Contact
Link Page 恢复邀请/接受/拒绝/移除流程；Remote Conversation Page 恢复 main/hotkey 布局、
transcript/composer、review 和归档预览；CFC Plan Page 恢复 clinician 身份、登录、资格、
workspace 和条款流程。医疗验证 `messages-*` 经审计仅包含 intl 文案表，改列 preserved data。
专项行为测试 120/120；renderer 1026/1026、main 11/11、tsc 73，conversation-thread
100/101，仅余大型 review 工作台；pages-routes 54/92。

2026-09-29 已完成 renderer GUI 第九批：Chat Seat Access Screen entry 保留 conversation
screen 初始化与公开入口；Images Page 恢复账户隔离的图片会话、composer、拖放和 suggestion
提交；PayPal Checkout Page 恢复账户校验、promo、实验 gate、checkout session 与跳转；Checkout
Verify Page 恢复 continuation/offer、三次轮询、成功/失败/账户错配分支；Connect Screen Fill
恢复原始 SVG path、尺寸、viewBox、currentColor 与 props 覆盖语义；My GPTs Page 恢复 mine/shared
分页、草稿/发布导航、迁移/删除权限和 migrated 禁用态。专项行为测试 226/226；renderer
1032/1032、main 11/11，本批模块 tsc 零新增，pages-routes 推进至 60/92。

2026-09-29 已完成 renderer GUI 第十批：Workspace Settings Webview 恢复资格/路由 gate、
账户切换清理、指数退避与 webview analytics；Checkout Webview 恢复 pricing/credits 预热缓存、
分级重试、导航白名单与 presentation bridge；Create Workspace Page 恢复 provisioning 恢复、
resume/create/close 选择、团队 seat/promo checkout 与 token-auth 动态边；Purchase Page 恢复
plan/credits/identity gate、账户订阅错误、团队 owner/seat、promo/referral 及 hosted/custom checkout。
专项行为测试 192/192；renderer 1036/1036、main 11/11、tsc 73，pages-routes 64/92。

2026-09-29 已完成 renderer GUI 第十一批：GPT Discovery 恢复 Public/Workspace 视图、
分类与搜索、creator/directory 分页、详情开聊和 My GPTs gate；Hotkey Window Home 恢复
workspace/projectless/remote 派生、local/cloud/worktree 模式、environment/branch/permissions、
composer、pointer、拖拽与浮层感知布局；Login Route 恢复浏览器账号探测/换号、Google/
Microsoft/signup/API key、可取消登录、链接复制、workspaceRecovery 回跳、错误分类和 Snake
入口。专项行为测试 122/122；renderer 1039/1039、main 11/11、tsc 73，app-shared 332 个
消费导出全部语义化，pages-routes 67/92。

2026-09-29 已完成 renderer GUI 第十二批：Standalone Elicitation Page 恢复 URL 参数校验、
host/user 缺失、连接失效与重试、通用 MCP elicitation、browser auth 标题、选项/字段/必填
校验、密码显隐、accept/decline、skip/cancel 以及成功/跳过/不可用/错误态。专项行为测试
47/47；renderer 1040/1040、main 11/11、tsc 73，pages-routes 68/92。

2026-09-29 已完成 renderer GUI 第十三批：CFC Verification 恢复 enrollment 轮询、NPI
预验证、Persona 启动/取消/完成、延期 workspace 恢复、条款确认、Quorum workspace 创建与
账户切换，并拆出可独立清理的 Persona inquiry/SDK 启动器；Ads Controls 恢复可用性门禁、
历史/主题分页、个性化、免费降额广告选择、删除确认和 Plus 外链；Shared Post 恢复 prompt/
conversation/image 分享加载、错误、自动提交、图片选择、composer 与导航；Global Dictation
恢复麦克风/录音/转写、取消重试、paste fallback、窗口与 pointer 交互。专项行为测试 188/188；
renderer 1045/1045、main 11/11、tsc 73，pages-routes 72/92。

2026-09-29 已完成 renderer GUI 第十四批：Gift Card Redemption 恢复登录/账户/地区/
workspace owner 资格、16 位 PIN 与可选 20 位卡号校验、integrity 请求、兑换错误分类、
序列号展示、billing 刷新与升级/继续；Lighthouse Work Home 恢复账户/workspace gate、
个人与工作上下文、follow-up 会话、建议、connector 流程和 takeover；Browser Skill Editor
恢复权限/校验、文件编辑上传、冲突处理、保存/分享/下载/删除及未保存拦截；Appgen Analytics
恢复项目 gate、Overview/Traffic/Events、7/30 天窗口、指标/流量/事件查询、空态与 refetch。
专项行为测试 170/170；renderer 1049/1049、main 11/11、tsc 73，pages-routes 76/92。
同期为构建器新增 `IMPORT_ALIASES` 解析轨道，将历史语义依赖名精确映射回原发布文件名，
不膨胀 `CHUNKS`/覆盖统计；并修复 9 处既有导出或依赖边漂移，结构验证保持全绿。

2026-09-29 已完成 renderer GUI 第十五批：Scheduled Tasks 恢复加载/错误/重试、状态筛选、
分页、建议任务、权限、详情/编辑/分享与导航；Detached Browser 恢复宿主注册、toolbar/
webview 同步、消息转发、窗口 transfer、异常与幂等卸载；Pricing Plan 恢复账户/计划 gate、
促销、外部 checkout、in-app preview、升级降级确认与网页回退；Checkout Success 恢复个人/
Business 路由、履约重试、wallet、workspace access、图片下载与 auto-top-up 警告；Security
Route 恢复插件/管理员/主机 gate、扫描/发现/仓库列表、新扫描提交与错误空态。专项行为测试
184/184；renderer 1054/1054、main 11/11、tsc 73，pages-routes 81/92。

2026-09-29 已完成 renderer GUI 第十六批：Projects Index 恢复项目列表、搜索、空态、
菜单与页面标题；Avatar Overlay Native 恢复实时语音悬浮窗、工具活动、权限请求、交互切换
与 handoff；Library 恢复访问门禁、URL 搜索/分类/回收站、列表状态、打开/恢复/上传和按类型
懒加载预览与操作对话框；Onboarding Route 恢复工作区门禁、角色/部门问卷、personalization
持久化、示例 tour、跳过与完成导航。专项行为测试 143/143；renderer 1058/1058、main
11/11、tsc 73，pages-routes 85/92。

2026-09-29 已完成 renderer GUI 第十七批并收官 pages-routes：Meetings 恢复会议列表、
搜索筛选、详情/摘要/转录、分享反馈、Calendar 连接与日历视图；GPT Builder 恢复草稿字段、
校验、自动保存、knowledge、能力开关、预览和发布；Personal Finance 恢复连接 onboarding、
Dashboard/Chats/Accounts/Transactions、敏感值、记忆和实体侧栏；Health 恢复资格/年龄门禁、
连接、Home/Records/Chats/Accounts、composer 和 starter prompts；Usage Settings 恢复 URL tab、
计划/价格/限额/credits/reset/services 与三个懒加载分区；ChatGPT Project Home 恢复邀请、
Chats/Sources、项目操作和五类懒对话框；Workspace Agent Builder 恢复 apps/model/capabilities、
starter prompts、版本历史、Slack、草稿保存/发布/删除与权限。专项行为测试 353/353；renderer
1065/1065、main 11/11、tsc 73，pages-routes 92/92。

2026-09-29 已完成 renderer 小簇收口批次：Review Thread Side Panel 恢复 PR/branch/last-turn/
uncommitted/staged/committed 来源、Git 初始化、stage/unstage/revert、文件导航搜索、刷新、命令
复制和 large-diff 模式，使 conversation-thread 达到 101/101；Deep Research Fill 与
Members Filled 恢复原 SVG 与 props 覆盖；Regex Search Worker 恢复全局正则、匹配上限和
LaTeX 命令/分组范围处理，使 search-command-menu 达到 5/5；PCA Connector Action Entry
恢复 eager 初始化与 action 重导出，使 connectors 达到 5/5。专项测试 129/129；renderer
1070/1070、main 11/11、tsc 73。

2026-09-29 已完成 hooks/animations/observability/auth-profile 批次：补齐 stable callback、
reduced motion、Escape dismiss、learning block 布局/拖拽与 floating-window pointer
interactivity；恢复 AnimatedIcon 公共入口与 frequency visual motion；恢复 remote PiP frame
filter worker、remote middleware，并将 sentry dark 明确登记为主题数据资产；补齐 ChatGPT
token auth、Plan tab、profile store 与 browser-extension profile 初始化入口。专项测试源码
105/105，运行时行为断言 228 条；renderer 1085/1085、main 11/11、tsc 73，新增 any 0。
animations、observability-cloud、auth-profile 均已全覆盖，hooks 仅余 external-agent import
setup actions。

2026-09-29 已完成 hooks/plugins/panels/charts 原语批次：收官 external-agent import setup
actions 与 skills-plugins-mcp 六项，恢复插件创建/安装、legacy video loader、source/tweaks
toolbar；panels 补齐 text editor entry、tab helpers、control/frame/visibility、plan entry、
xterm output 与 cloud browser 实时控制，只余 MCP elicitation 与 pending request 两个大块；
charts-ui 补齐 BarChartFill 与 chart colors，并将 graphlib 双版本、Chart.js zoom 和 GraphQL
entry 明确归入第三方保留轨道。专项测试源码 64/64、行为断言 327 条；renderer
1102/1102、main 11/11、tsc 73，新增 any 0。hooks 24/24、skills-plugins-mcp 30/30，
panels 18/20，charts-ui 10/17。

2026-09-29 已完成 panels 收官与 charts-ui 第二批：恢复 MCP server elicitation request
panel、pending request item panel、图表表达式求值/采样、PieChart、Epic chart indicator
和 ChartWidget，并将 Datadog Session Replay telemetry 明确登记为 vendor 保留资产。专项
行为测试 137/137；renderer 全量门禁 1108/1108、main 11/11、tsc 73，新增 any 0。
panels 达到 20/20，charts-ui 达到 15/17，仅余 chart content reference 与 interactive chart。

2026-09-29 已收官 charts-ui 并推进 editor-docs/artifact-preview：恢复 chart content
reference 与 interactive chart，覆盖图表解析、表格/TSV、PNG 下载、交互采样、几何叠加、
拖点和缩放；恢复 Markdown/DIL writing block、composer annotation editor，并补齐七个
artifact preview 初始化/重导出入口。四个 75–171B 的 editor worker/entry 转发壳经审计
登记为 generated/worker 保留资产。专项断言 195 条；renderer 1120/1120、tsc 73，
charts-ui 达到 17/17，editor-docs 34/42，artifact-preview 43/53。

2026-09-29 已继续推进 editor-docs/artifact-preview：恢复 artifact tab shell、selected
text annotation editor、detached browser annotation host、source annotation registry、
Mermaid code editor、binary classification metrics、video lightbox 与 Mermaid preview core。
专项断言 213 条；renderer 1128/1128、tsc 73，app-shared 消费声明 341/341。
editor-docs 达到 38/42，artifact-preview 达到 47/53。

因此，下面“27 个 chunk / composer 与 app-shared 待推进”等数字是初始交接快照，
但“继续处理全量应用代码”的任务仍然有效。下一步继续处理 editor-docs 与
artifact-preview 的真实缺口；增量 hub 只在出现真实消费者时拆出
语义 API，不为未消费导出制造占位源码。完整依据见
`docs/renderer-tail-audit.md`。

### 已完成

**Bootstrap + Main（主进程）：** 169 个 .ts 文件。bootstrap chunk 全量重写；
main chunk 按区域 R1-R12 全部落地（fetch-handler 128 RPC、browser-use 五件套、
window-context、dictation、菜单/启动序列等），文档
`docs/main-analysis-r1..r12.md` + `docs/main-r8-r12-audit.md`。

**Shared chunk（692 导出）：** 26 个语义模块落地于 `src/main/shared/`
（keymap-menus/agent-instructions/chunked-message/telemetry/structured-generation/
sandbox-permissions/automation-settings/app-constants/app-server-version/
browser-context/browser-tab-mentions/http-headers/app-config/host-config/
wsl-paths/…），**201 个压缩别名已语义化**。两大区（settings-threads 226、
hosts-wsl-plugins 176）的"被消费别名"已 100% 语义化；剩余小分区
（schema-primitives 36 / lowlevel-shim 41 / sql-git-registry 37 / mcp-rpc 34 /
process-exec 30 / streams 21 等，合计约 151 个已消费别名）待做，
方法论完全同前（用 `docs/shared-export-map.json` 定位 → 逐符号核实导出目标
→ 写语义模块 → d.ts 转发）。

**Renderer（GUI，主战场）：27 个 chunk 已重写并通过验证**，
`node scripts/verify-renderer.mjs` → `27/27`：

- 会话核心链：`local-conversation-thread`(561KB) / `local-conversation-turn`
  (146KB) / `conversation-blocks` / `conversation-markdown` /
  `virtualized-turn-list` / `thread-virtualizer` / `user-message` /
  `agent-activity-*` / `turn-preview-body-items` / `local-conversation-page`
- 设置页六个：general/security/remote-connections/codex-micro/
  personalization/settings-plugin-selection + review-preferences-model +
  settings-search-documents(559KB 纯数据，生成器提取)
- 基础设施：rpc / thread-scroll-controller / scroll-to-match / timestamps /
  assert-never / split-items / detachedWindow + detached-entry（第二 HTML 入口）
- 运行时六模块（`src/renderer/app-shared/runtime/`）：message-bridge
  （VS Code webview 风格分块协议 `codex-host-chunked-message-v1`）/
  routes（84 路由 + codex:// deep-link）/ settings-schema（69 项）/
  theme / persisted-atom / atom-signal（Maitai）
- 图标生成器：`scripts/generate-icons.mjs`（568 个 icon 模块）

**质量门基线（交接时）：**
- `npx tsc --noEmit` → 139 个错误，**全部是预期类别**（TS2307/2305/2304，
  即"未重写 chunk 的声明缺失"），这是正常状态，不是回归。
  新增任何非预期错误都必须修复。
- `node scripts/verify-renderer.mjs` → 27/27
- `node scripts/verify-chunks.mjs` → 11/11（main 侧已重写 chunk）

### Renderer 还剩什么（按 GUI 优先级）

总量：11,201 个 chunk / 302MB，其中**真正需要人工还原的应用代码只有
2,250 个 chunk / 49.22MB**（app-code）。其余是第三方/纯数据，
**直接跳过**：locale 128 个（123MB）、lucide 图标 6535 个、shiki
grammar/theme、math-learning-blocks 1481 个、mermaid、mapbox、
runtime.worker、editor-doc 的 presentation/workbook 编辑器（巨型 vendored）。
完整分类与优先级见 `docs/renderer-classification.md`（必读，尤其第四节）。

推荐的下一步顺序（P0 → P2）：

- **P0 composer 输入区簇**（47 chunk）：`composer-utility-bar` /
  `suggestions` / `home-ambient-suggestions-content`…——GUI 核心的下半屏
- **P0 app-shared(5.1MB) 剩余应用逻辑**：27 个已验证 chunk 已覆盖其 runtime
  骨架，但 query key/store/UI 基础组件仍有大量未语义化导出
  （消费型 chunk 以 `@rchunk/app-shared` 的 any 声明承接，
  `src/renderer/types/rchunk-modules.d.ts` 共 2,312 行，逐个语义化的
  方式与 main 侧 chunk-modules.d.ts 完全相同）
- **P1 sidebar + home-onboarding**（52 chunk）：`sidebar-onboarding-checklist` /
  `onboarding-page` / `library-page`…
- **P1 dialogs-menus**（108 chunk）：`options-menu-view` / `DatePicker` /
  `codex-mobile-setup-dialog`…页面结构清晰、还原性价比高
- **P1 pages-routes**（92 chunk）：`avatar-overlay-native-page` /
  `security-route` / `profile`…配合 `docs/renderer-routes.json`（84 路由）
- **P1 browser 内置浏览器 + terminal**（25 chunk）
- **P1 git-github-worktree**（65 chunk）：review/diff/PR UI
- **P2 artifact-preview / markdown-render / charts-ui**：vendor 桥接层优先
- **P3 / 跳过**：appgen-valdi-platform（Valdi mini-app，实验性商业功能）、
  connectors、以及所有纯 vendor/locale/data chunk

---

## 四、核心方法论（必须严格遵循）

### 双轨构建

- **REWRITTEN chunk**：语义源码 → `scripts/build-renderer.mjs` 用 esbuild
  打成单个 ESM chunk。输出文件名必须与发布版**逐字符一致**
  （如 `rpc-971deaddf2c2.js`），即 chunk 清单里的 value。
- **其余 chunk**：transform-only——原版 JS 原样放 `src/webview/assets/`，
  只保证与发布版逐字节一致，**不改名不改内容**。
- 两轨由 import 图缝合：重写 chunk 里对未重写 chunk 的依赖写成
  `import ... from "@rchunk/<语义名>"`（tsconfig 路径由
  `src/renderer/types/rchunk-modules.d.ts` 声明；esbuild 构建时经
  chunkImportPlugin 改写回 `./<发布文件名>` 相对路径）。

### 单个 renderer chunk 的重写闭环（每一块都走全流程）

1. **登记**：`scripts/renderer-chunk-manifest.mjs` 的 `CHUNKS` 加
   `"语义名": "发布文件名"`，`REWRITTEN` 加语义名。
2. **定位导出**：用 `docs/renderer-app-shared-export-map.json` /
   `docs/renderer-app-initial-export-map.json`（导出名 → 内部符号 + 行号）
   找到该 chunk 的全部导出与依赖；`docs/renderer-chunk-manifest.json`
   是全量 11,201 chunk 的原始 import 邻接表（edges），重写前先查它拿到
   该 chunk 的精确依赖集合（verify 比对的正是这个集合）；纯数据 chunk
   用生成器脚本提取（参照 `scripts/generate-icons.mjs` 的平衡括号提取法）。
3. **语义重写**：读原版（`src/webview/assets/<发布文件名>.js` 或
   `.reference/app-original/`），按真实结构命名（组件/类型/hook 的真实语义），
   写入 `src/renderer/<语义名>/`。
4. **兼容导出对齐（最容易翻车）**：原版 chunk 的导出是压缩名
   （如 `export { computeTurnLayout as t }`）。重写版必须**逐一对齐**：
   `export { computeTurnLayout as t, ... }`——verify 脚本比对的就是
   ESM 导出的对外符号名。
5. **import 依赖集合对齐**：verify 还比对 chunk 对 `./xxx.js` 的全部
   import 集合。漏依赖（如 Icon、file-diff-alt）或多写都会挂。
   遇到大量对齐时用一次性 python 脚本批量 diff，别手抠。
6. **验证**：`node scripts/verify-renderer.mjs` 必须全绿；
   `npx tsc --noEmit` 不得超出基线错误集。
7. **提交**：一次 chunk 一 commit，中文 commit message 写清
   符号映射与行为自测结果。

### 行为自测（强烈建议，不止 verify）

对纯逻辑模块（非 React 组件）写一次性 tsx 脚本跑真实行为
（参照历史：command-registry 的 keymap 状态机、sandbox-permissions 的
档构造/降级、chunked-message 的协议全链、wsl-paths 的路径换算——
每模块 20-40 例断言）。React 组件 chunk 以 verify + tsc 为准即可。

---

## 五、必读文档（按顺序）

1. `docs/renderer-classification.md` —— 11,201 chunk 全量分类 + GUI 优先级
2. `docs/renderer-app-shared-analysis.md` —— renderer 运行时六机制解析
3. `docs/renderer-entry-and-routes.md` + `docs/renderer-routes.json` ——
   入口链（index → rpc → app-main createRoot）与 84 路由
4. `scripts/renderer-chunk-manifest.mjs` 头部注释 —— 双轨契约
5. `docs/shared-export-map.json` —— shared 692 导出地图（若继续 shared）
6. `docs/main-rewrite-contract.md` / `docs/bootstrap-rewrite-contract.md`

已重写 renderer chunk 的实际源码是最好的范式，**动笔前先读 1-2 个**：
- 小而完整：`src/renderer/rpc/index.ts`、`timestamps/index.ts`
- 中型带兼容别名：`src/renderer/thread-virtualizer/index.ts`
- 大型组件：`src/renderer/local-conversation-turn/index.ts`、
  `local-conversation-thread/index.ts`

---

## 六、坑与纪律（前人血泪）

1. **shell cwd 每条命令后会重置**到 chatgpt-desktop-src——所有命令
   一律前缀 `cd /Users/david/Workspace/ppio_github/codex-desktop-glm-version && `。
2. **Bash/Write 工具会做 HTML 实体解码**：任何包含 `"` `&#39;`
   `&` 字面量的代码写入时会被解码破坏。绕过：用 `chr(38)` 拼接、
   或 `String.fromCharCode`、或先写 `chr(38)+'quot;'+chr(59)` 的
   python 修复脚本。（真实事故：HTML_UNESCAPES 映射连修三次。）
3. **verify 失败循环**：九成是导出别名/依赖集合没对齐。先跑
   verify 看缺哪个符号，再回源码补；用脚本比对而不是目测。
4. **不要"顺手重构"原版行为**：重写版的语义必须与原版逐例一致
   （包括看起来怪的行为，如 `qb` 路径函数的小写化、`rx` join 不剥
   子路径尾斜杠）。自测断言写错时先怀疑断言，再怀疑实现。
5. **命名空间成员不能直接进 export 块**：`export { blocks.X as Y }`
   非法——先 `const { X } = blocks` 解构。
6. **React Compiler 形态**：原版大量 `(0, X.c)(n)` memo-cache 槽位调用，
   语义版用等价的 useRef/useCallback/Memo 表达，导出面不变即可。
7. **文件名冲突**：两个不同 chunk 请求同一语义名时登记别名
   （先例：`file-diff` 与 `file-dich-diff-alt`）。
8. **commit message 用中文**，写清：别名映射表、与原版 diff 核实结论、
   自测例数。
9. **绝不改动** `../chatgpt-desktop-src` 与 `.reference/app-original`。
10. **tsc 基线**：139 个 TS2307/2305/2304 属预期；每完成一批新语义化，
    基线错误数应只减不增。修复真实错误时把新基线记进 commit。

---

## 七、快速开始（建议第一条指令）

```bash
cd /Users/david/Workspace/ppio_github/codex-desktop-glm-version && \
node scripts/verify-renderer.mjs && node scripts/verify-chunks.mjs && \
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -c "error TS"
```

健康检查应同时运行 `verify-renderer`、`verify-chunks`、TypeScript 基线、
`audit-renderer-tail.mjs`、`audit-renderer-app-coverage.mjs` 和
`audit-app-shared-consumption.mjs`。前者的 0 pending 不得替代全量覆盖审计。
下方 2026-09-27 流程更新继续有效。

### 2026-09-27 增量流程更新

当前推进已改为“业务批次一 commit、批次末统一门禁”。提交边界应覆盖一个
完整用户流程或一组共享依赖/测试夹具的模块，通常约 **10–25 个模块**；不要
因为单个文件名簇完成就中断上下文。批次内部只跑受影响模块的快速定向测试，
不反复运行 build/verify/tsc。批次收口时再统一使用：

```bash
npm run verify-renderer-cluster -- \
  --test scripts/test-<cluster>.mjs \
  --module <module-a>:<assertions> \
  --module <module-b>:<assertions>
```

`--test` 与 `--module` 均可重复，允许一个业务批次汇集多个原有小簇。该命令
会自动执行定向测试、核对测试源码实际断言数、构建 renderer、运行
renderer/main 结构验证、检查 TypeScript 基线、`git diff --check`、新增 any
以及直接 namespace chunk 消费，并输出可直接复制进 commit message 的模块
验证清单。当前 TypeScript 基线为 **73**；可用
`--tsc-baseline <count>` 显式覆盖。

完整门禁在当前机器约 16 秒；主要成本是人工收口与上下文切换。因此不要为了
追求更大的数字把无关功能硬塞进同一提交，但只要模块属于同一用户流程、共享
同一套 mock/类型声明，优先合并到同一业务批次后再验证、提交。
