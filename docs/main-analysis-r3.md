# main-C-Mhak1n.ts 深析 — R3 区域（26,500-45,000）：thread/conversation 存储核心

目标文件：`src/main/main-C-Mhak1n.ts`（176,978 行）。本篇覆盖 **R3 = 26,500-45,000**，实际核实区间为 26,000-45,010（含边界带）。
方法：与 `docs/bootstrap-analysis.md` 同构——grep -n 核实行号 + 200-400 行窗口精读 + 类头/区域边界/副作用点逐个确认。所有行号均经 `grep -n` / `sed -n` 直接核实；置信度标注：[高]=直接证据（引用原文），[中]=结构推断（有强上下文证据），[低]=采样推断。

**重要边界修正（对粗扫 §8 R3 区间的修订）**：

1. **vendored micromark 实际延伸到 26,445**，不是 26,000。26,000-26,445 是 micromark-extension-gfm 系（footnote/strikethrough/`kme`=SpliceBuffer/table/tasklist）+ `zme()`=gfm() 组合工厂（26,442）。R3 派发时应把这段划给 micromark vendored 带，或随本区处理但不参与重写。
2. **vendored marked 实际从 44,556 开始**（`Bx()` defaults、44,570 `Vx = Bx()`），不是 44,570。R3 应用代码止于 **44,555**；45,000-45,010 已是 marked `Gx` 正则表内部。
3. 链式 `var` 声明内部藏有 **18 个类**（`grep -nE ' = class'` 补扫，见 §1），粗扫的 `^var` 顶层模式漏掉了它们——包括 R3 关键类 `Sm`（app-server 流订阅）、`Ah`（会话事件总线）、`Khe`（账号认证）、`Xge`（订阅注册表）等。

---

## 1. 区域地图

| 行区间 | 类型 | 语义名 | 概述 |
|---|---|---|---|
| 26,000-26,445 | **vendored** | micromark GFM 尾 | footnote 定义（25,914-26,032）、strikethrough（`Ome` 25,991）、`kme`=SpliceBuffer（26,068，micromark-util-subtokenize）、table（`jme` 26,111+）、tasklist（`Fme/Lme` 26,394/26,398）、`zme()`=gfm 扩展组合（26,442） |
| 26,445-26,622 | 应用 | markdown 纯文本化 + prompt 标记 | `Bme = s.t()`（dist chunk 惰性 HTML parser，`.parse().structuredText`）、`Vp()`=plainTextFromMarkdown（线程标题提取，走 `Jfe` remark + gfm 扩展 + script/style 剥离）、`Zme()`=打了 autolink 补丁的 gfm、26,561-26,598 prompt 分节标记常量（`# Files mentioned by the user:`、`# Diff comments:`、`# Browser comments:`、`# Selected text:`、`# Failing PR checks:`、response-annotations 解析 `Xp/$me`） |
| 26,624-27,590 | 应用 | local_thread_catalog SQLite 存储层 | zod schema（`che/dhe/fhe/uhe`，26,628-26,658）、`mhe`=巨型 upsert SQL（26,659-26,758，`ON CONFLICT(host_id,thread_id)` + observation_sequence 水位）、`um/dm` 线程→catalog 行映射与标题生成（26,759/26,788）、**`hhe` 类（26,796-27,530）**、helper `fm/pm/ghe/_he/mm`（27,531-27,590） |
| 27,591-27,981 | 应用 | 桌面通知服务 + 杂项 | `hm` 通知音文件名表、`vhe`=macOS Group Container 路径、`yhe = r.i('desktop-notifications')`（27,593）、`gm/_m/vm` 通知音解析/staging（27,594-27,621）、**`bhe` 类（27,622-27,880）**、`xhe`=app 适配器（27,882-27,879 范围内，getVersion/onShutdown）、常量带（27,880 前：`ym=3e4`、`She='codex_cloud'`、`bm=12e4`、`Che` Windows sandbox 超时文案、`whe=12e5`、`The=3e5`、`xm` 多窗口提示文案、`Ehe=5e3`）、**`Sm extends n.Uf`（27,880-27,981）**+`Cm` |
| 27,983-28,626 | **vendored** | immer | `wm/Tm/Em/Dm`（27,983-27,990，`Symbol.for('immer-nothing')` 等）、draft proxy 全套函数（27,991-28,232）、`ih`=proxy handler 表 + `ah`（28,235-28,299）、**28,300 副作用**（见 §5）、`Ihe`=Immer 类（28,340-28,438）、`uh/dh/fh`、`Lhe()`=Patches 插件装载（28,469-28,620）、`ph = new Ihe()` 单例（28,623-28,626） |
| 28,630-28,724 | 应用 | 动态 app 工具 schema | `Bhe='request_environment_input'`、`gh` zod（environment 授权请求）、`Vhe` zod、`_h='request_option_picker'`、`vh='request_onboarding_input'`、`yh='setup_codex_step'`、`xh/Hhe/Uhe/Whe/Sh` zod、`Ch/wh/Ghe/Th/Eh` 校验与分发、`Dh`（read_thread 能力判定，读插件配置）、`Oh`（thread-reference capability 键） |
| 28,725-29,528 | 应用 | 会话生命周期协调 | **`kh` 类（28,725-28,757）**=会话驱逐协调器、**`Ah` 类（28,758-29,160）**=会话事件总线（30+ 种 listener）、`jh`=branded loginId zod（29,161）、**`Khe` 类（29,161-29,515）**=账号认证服务、**`qhe extends n.Uf`（29,516-29,528）**=一次性回调句柄 |
| 29,529-30,065 | 应用 | 非信任输入编码 + 图像占位 | `Jhe` 流角色相等、`Mh` threadId 提取、`Nh='codex-untrusted-app-input:'`、`Ih` zod（29,552-29,585）、`Xhe`（untrusted_input function_call 合成）、`Zh` 反解、29,661-30,065 浏览器/PDF 评论图像占位文案生成与正则（`rge` 8 个 RegExp、`mge`/`<<ImageDisplayed>>`、`ige/age/oge` 匹配清除） |
| 30,067-31,330 | 应用 | turn/item 合并引擎 | steering user message 匹配/回填（`fg/vge/yge/bge/vg/gg/_g`）、`bg` 通用 item 合并（30,188，`preferIncomingItems`）、canonical turnHistory **islands/entitiesByKey 模型**的访问器群（30,428-30,533：`Eg/Dg/Og/kg/Ag/zg/Ig/Lg/Rg/Pg/Fg`）、`kge/Age/jge/Mge`、`Bg/Nge/Pge`（压缩相关）、`t_`（30,876 async，恢复边界页）、`xge`（30,292 大函数，patch 应用） |
| 31,331-31,981 | 应用 | 条目分页 + turn 合成 | **`Bge` 类（31,331-31,566）**=turn items 分页加载器、`T_/E_/D_/O_` turn 追加/查找、`k_`（31,683）定位并修改 turn、`A_/Vge`、`j_`（31,694 async 大函数，turn 合并）、`Hge`、`M_=5`、`Wge`、`N_`（31,850，durable host 的 thread/turns/list 包装）、`P_`（31,870，timeline 源读取）、`Gge` |
| 31,982-32,446 | 应用 | 历史读取门面 + 状态规范化 | **`Kge` 类（31,982-32,352）**=ConversationHistoryReader（timeline/compact/paginated/full 四种源）、`qge/F_/I_/L_`（island 边界句柄匹配）、`R_/Jge/z_/B_`（线程状态规范化 + 日期强制） |
| 32,447-32,943 | 应用 | app-server 流状态 | **`Yge` 类（32,447-32,890）**=owner/follower 流角色、IPC patch 广播、follower 重连宽限、**`Xge` 类（32,892-32,943）**=分层订阅注册表（threadId→scope→field→listeners） |
| 32,988-33,603 | 应用 | 线程摘要投影 + automation 解析 | `V_`（32,988，summary→conversation 骨架）、`H_/Zge/Qge/U_/$ge/W_` subagent 元数据、`G_`（33,065，thread 摘要投影）、`K_` 摘要相等、`q_`（cliVersion≥'threadTimeline' 门）、`J_/n_e/r_e/i_e/a_e` heartbeat/automation 消息解析、`Y_`（33,184，automation 判定器，兼作 turnMergePolicy）、`o_e/s_e/c_e/l_e/X_`、`u_e/Z_/Q_`（image src 规范化，33,263）、`$_/ev/tv/nv/d_e/rv` turn 参数推断（权限/模型/cwd）、`av/p_e/m_e/f_e` collab receiver threads、`ov/sv/cv/lv/uv` 父线程链、`fv` 动态工具调用分发（33,462） |
| 33,604-33,857 | 应用 | timeline/活动索引 | **`g_e` 类（33,604-33,857）**：`timelinePositions` WeakMap + `indexes` WeakMap，增量维护 itemTimeline 位置与 turn status/activity/progress/createdThreadCalls 索引（基于 patch 流增量重建） |
| 33,858-34,506 | 应用 | hydration 投影 + 摘要谓词 | item 类型谓词群（`_v/vv/__e/yv/bv/xv/Sv/Cv`）、`wv/v_e/Tv/Ev` 标题/时间工具、`y_e/Dv` 环境配置选择、`Ov`（33,955，thread→conversation state）、`b_e`（34,009 async，hydrate 线程批量读）、`x_e`（34,074 async，thread/list 全量分页）、`kv/Av/jv`、`S_e`（34,144，upsertConversationFromThread 核心）、`w_e`（34,313，patch 级 conversation diff 计算）、`Pv/Fv` |
| 34,507-36,469 | 应用 | **ThreadStore/ConversationStore 门面** | **`T_e` 类（34,507-36,469，约 1,960 行）**：conversations Map、`threadItemIndex = new g_e(...)`、`threadFieldReaders/turnFieldReaders/transcriptAccess`、`subscriptions = new Xge(...)`、threadSummaries/recent/pinned/hydration/标题持久化/归档抑制/搜索（`searchThreads` 35,681）/collab 线程等约 90 个方法 |
| 36,470-37,136 | 应用 | patch 分类 + 操作句柄 + plan 合成 | `Iv/E_e`（36,470/36,499，patch→fullReset/entityKeys 分类）、**`Lv extends n.Uf`（36,502-36,516）**=app-server 操作句柄、`Rv extends Lv`（36,517，可 cancel）、`D_e`（36,529，流指标聚合）、`O_e/zv/Bv/Vv/k_e/A_e/j_e/Hv/Uv/Wv` collab mode/模型更新、`M_e/N_e/P_e/F_e` turn 状态更新 helpers、`Gv/Kv`、`qv='item/plan/requestImplementation'`（36,839）、`Jv/Yv/Xv/L_e/R_e/Zv/Qv/z_e/$v/B_e/V_e/ey/H_e/U_e/W_e` elicitation/permissionRequest/userInputResponse 合成 + browser-use/messages 自动批准规则 |
| 37,137-37,502 | 应用 | elicitation 自动批准 + 附件 | **`G_e extends n.Uf`（37,137-37,188）**=elicitation 自动批准流、`K_e`（37,189）工厂、**`q_e extends n.Uf`（37,241-37,248）**=dispose 句柄、`J_e/Y_e/X_e/Z_e` pasted-text 附件文件名/正则/zod、`Q_e`=FileAttachmentTooLargeError（37,259）、`$_e`=附件上传器（37,268，fs/writeFile base64 或直传）、`ty/eve/tve/nve`、`rve` uuid 正则（37,502） |
| 37,503-38,099 | 应用 | 文件 watch + fork + 回滚 | **`ive` 类（37,503-37,543）**=thread goal 附件目录管理、`ny/ave` async、`ove/ry/iy/ay=5e3`、**`sve` 类（37,669-37,865）**=打开文件/MCP 资源 watch（变更消息、忽略窗口）、`cve/oy/sy`、`lve='0.143.0-alpha.32'`（37,875）、`uve`（37,876 async，fork 任意 turn，按版本选路径）、`dve`（37,960 async）、`fve`（38,100，rollback→resume 状态应用）、`pve`（38,133，revert turns→islands 修剪）、`mve=305e3`、`hve/gve/_ve`（38,177-38,268，完整历史装载） |
| 38,100-38,677 | 应用 | 归档预览 + 历史策略 | `cy/ly`、`vve` zod（38,301）、**`yve extends n.Uf`（38,305-38,478）**=归档线程预览读（maxTurns/maxItemsPerTurn 限额）、`uy/dy=5/bve/xve/Sve`、`Cve`（38,627，turnMergePolicy 聚合对象）、`wve`（38,643，user/assistant 文本提取）、`Tve`（38,672，限额判定）、`fy=108e5` |
| 38,678-39,469 | 应用 | 非活跃退订 + delta 队列 + item 分发 | **`Dve` 类（38,678-39,055）**=InactiveThreadUnsubscriber、`my/hy/gy/_y/Ove/kve/Ave/jve/vy/Mve=2e4/yy/Nve=16`（39,056-39,287，输出截断/摘要文本工具）、**`Fve` 类（39,288-39,401）**=rAF 批量文本 delta 队列、`Ive`（39,402）=输出 delta 队列变体、`xy/Lve` |
| 39,470-39,826 | 应用 | item 通知分发器 | **`Rve` 类（39,470-39,826）**：handleNotification 大 switch——`item/agentMessage/delta`、`item/plan/delta`、`item/reasoning/*`、`item/commandExecution/outputDelta/terminalInteraction`、`item/fileChange/patchUpdated` → delta 队列 + threadStore 状态更新；terminal input buffers |
| 39,827-40,442 | 应用 | 手动压缩 + 自动审批审查 | `zve`、`Sy='pending-manual-context-compaction'`（39,836）、**`Bve` 类（39,837-39,879）**=手动压缩计数/合成项管理、`Vve/Hve/Uve/Cy/wy/Wve/Gve/Ty/Kve/qve/Ey/Jve/Yve`（39,880-39,979，realtime delegation/handoff 解析）、`Xve/Dy/Zve/Qve/$ve`（39,980-40,042，审批审查事件→snake_case 序列化）、`eye/tye/nye/rye/iye/aye/Oy`（40,043-40,115，审查事件应用 + strictReviewNotice + tooManyDenials 警告） |
| 40,443-41,277 | 应用 | 通知→状态应用层 | `Ny/Py`（thread/status/goal 类通知）、`Fy/Iy/Ly/Ry` 合成 item（forkedFromConversation/remoteTaskCreated/worktreeInit）、`zy/By/Vy` plan 实现合成、`Hy/Uy/Wy/Gy/Ky/qy/Jy...$y`（40,567-40,712）、`ky`（40,116，**item/started 等核心通知处理大 switch**）、`eb/tb/nb/rb/ib/ab/ob`（40,713-41,277，turn 启动/完成/删除/归档操作） |
| 41,278-41,478 | 应用 | 归档/取消归档流程 | **`sb = class extends Error`（41,278）**=UnarchivedConversationLoadError、`cb/lb` zod、`ub`（41,286，archiveConversation 入口）、`db`（41,314，unarchive）、`fb`（41,348，归档执行：pin 保存/worktree 清理/pendingThreadArchives/广播）、`pb/mb/hb`、`gb`（41,444，**side conversation boundary 系统提示词**全文）、`_b/vb/yb/bb`（41,455-41,478，token_budget history notes 配置） |
| 41,479-41,850 | **vendored** | lodash 模块束 | `xb/Sb/Cb/wb/Tb/Eb/Db/Ob/kb/...` 约 30 个 `e.t()` CJS 模块（forEach/assign 系列/getSymbolsIn/copyArray/cloneBuffer/...），**依赖 shared chunk 的 lodash 内部件**（`n.dc()/n.Bd()/n.uc()/n.Kd()/n.Xd()/n.mc()/n.qd()/n.Jd()/n._c()`，41,486+）。本区代码以 `(0, G.default)(...)`（=line 121 `G = e.a(n.Ld())`，isEqual）、`(0, It.default)(...)`、`(0, pp.default)(...)`（=24,788 `pp = e.a(n.dr())`，memoize，`{max, promise}` 选项）等形式被全文件消费 |
| 41,851-42,205 | 应用 | sidebar 自定义分区 | `Wb..sye`（41,851-41,986，sections CRUD 纯函数）、`Qb/$b`、`ex`（读 global-state 键 `sidebar-custom-sections-v3`）、`cye`（fork placement 判定）、`lye/uye`（global-state / app-server sections 写）、`tx/dye` |
| 42,206-42,478 | 应用 | workspace/shell-env 配置 + 提示词 | `fye/nx/pye`（projectless Documents/Codex 路径识别）、`rx/ix/ax`（cwd/sandbox 解析）、`ox/sx`（profile 合并）、`hye='update_running_summary'`+`cx`（pet activity pill 提示词）+ **42,256 丢弃式 zod 副作用**、`lx`（**writing blocks 格式契约提示词全文**）、`ux/gye/_ye/vye/dx/yye/fx/px`（shell_environment_policy 解析） |
| 42,479-43,548 | 应用 | 线程启动配置 + 生命周期操作 | `mx/hx`（42,361/42,376，service tier + `n.Yo` 组装线程配置）、`bye/_x/vx/yx`、`xye`（42,521，conversation start/hydration 策略工厂）、`Sye/Cye`（service tier 读）、`wye`（42,728，service tier read/write + copilot auth 判定）、`Tye/bx/Eye`（42,793-42,907，resume 辅助）、`xx/Dye/Sx/Oye/kye/Cx`、`Aye='0.146.0-alpha.7'`（42,940）、`Mye/wx/Tx/Nye/Pye/Fye/Iye/Lye/Rye/zye/Bye/Ex/Vye/Dx/Ox/kx/Ax/jx/Mx/Nx/Hye/Px/Uye`（42,942-43,548，fork/resume/projectless 创建等操作群） |
| 43,549-44,555 | 应用 | **maybeResume 巨函数** | `Wye`（43,549-44,455，async，~900 行：resume 状态机——stream 角色/窗口活跃性判定、权限派生（`Rx` 来源标注）、bounded cloud history、writer-conflict 恢复、archived session 抑制）、`Fx/Ix/Lx/Gye/Kye/Rx/zx`（44,465-44,554，resume helpers：writable roots、cwd 去重、sandbox 摘要） |
| 44,556-45,010+ | **vendored** | marked（起点） | `Bx()`=defaults（44,556）、`Vx = Bx()`（44,570）+`Hx` setter、`Ux`、`Wx` regex builder、`Gx` 正则表（44,586+）、`wS`=Lexer（45,005，R4 区间内） |

---

## 2. vendored 识别

| 包 | 行区间 | 证据 | 置信度 |
|---|---|---|---|
| micromark-extension-gfm（+ micromark-util-subtokenize 的 SpliceBuffer） | 26,000-26,445（micromark 主体带 21,000-26,000 的自然延续） | `kme` 类体内 `this.map`/`consume`（SpliceBuffer 特征）；`Ome` strikethrough resolveAll；`zme = e => hf([ume(), bme(), Ome(e), Mme(), Ime()])`（26,442）= micromark-extension-gfm 的 `gfm()` 原型；`Fme = { name: 'tasklistCheck', tokenize: Lme }`（26,394） | 高 |
| **immer** | 27,983-28,626 | `wm = Symbol.for('immer-nothing')`（27,983）、`Tm/Em` immer-draftable/immer-state symbol、`Ihe` 类 = Immer 主类（`this.produce = ...`、`createDraft/finishDraft/applyPatches`）、`Lhe()` 内 `jhe('Patches', {...})` 插件注册 | 高 |
| **lodash（模块束）** | 41,479-41,850 | `var xb = e.t((e, t) => { function n(e, t) {...} t.exports = n })` 逐字对应 lodash `forEach`；后续 `Sb/Cb/wb`（baseAssign 系列）、`Tb`（getSymbolsIn）、`Ob`（copyArray index 保留）、`kb`（cloneBuffer）。**注意：这是 lodash 的 CJS 分模块形态，且其内部依赖（`n.dc/n.Bd/...`）来自 shared chunk 的另一份 lodash**——两份 lodash 拼合 | 高 |
| marked | 44,556-47,035（起点 44,556，`Vx = Bx()` 44,570；粗扫标 44,570，实际前 14 行 defaults 工厂也是 marked） | `Bx()` 返回 `{async:false, breaks:false, extensions:null, gfm:true, hooks:null, pedantic:false, ...}` = marked `getDefaults()`；`Gx` 正则表 44,586+；`wS` Lexer 45,005 | 高 |

**结论：R3 区间内共 4 段 vendored**（micromark 尾 ~445 行、immer ~644 行、lodash ~372 行、marked 头 455+ 行），合计约 **1,900 行**；应用代码约 16,600 行。重写时 immer/lodash/marked 直接 `npm install immer/lodash/marked`，micromark 系与 21,000-26,000 主带一起引上游。

另有两处「半 vendored」需要注意（不建议机械丢弃）：
- 27,880 `Sm`（app-server conversation stream 订阅包装，`extends n.Uf`）虽然和通知服务同链声明，但是**应用代码**（262,144 字节背压合并、`a.en()` using-scope、`Cm` dup 检测）[高]。
- 26,445-26,558 的 markdown 纯文本化（`Vp/Zme/Hp`）是对 micromark/mdast 的**应用层封装**（标题提取 + script/style 剥离 + autolink previous 补丁），是应用代码 [高]。

---

## 3. 子系统聚类与模块拆分方案

> 建议模块名 kebab-case；「定义」列出 minified 名 → 建议语义名。R3 的所有类在 54,078-54,436（conversation manager，R4 区间）和 161,190-161,213（通知/catalog 装配，R10 区间）实例化——R3 本身是**纯定义区**，装配在别处（见 §7 风险 1）。

### A. thread catalog 存储层（SQLite）

| 聚类 | 行区间 | 建议模块 | 主要定义 | 置信度 |
|---|---|---|---|---|
| catalog schema + row 映射 | 26,624-26,795 | `thread-catalog/schema` | `she`(MAX_TITLE_LEN=80), `cm`('local'), `che`(sourceKind zod), `dhe`(row zod), `fhe`(sync state zod), `uhe`(scan checkpoint zod), `phe`(默认进度), `mhe`(upsert SQL), `um`(thread→entry 映射，过滤 ephemeral/chatgpt_hidden/parent/ambient_suggestions/pull_request_fix_automation), `dm`(displayTitle 生成) | 高 |
| catalog DAO | 26,796-27,530 | `thread-catalog/store` | **`hhe`→LocalThreadCatalogStore**：constructor 注册 host（`local_thread_catalog_hosts`/`sync_state` INSERT OR IGNORE）、`listHostIds/readThreadHostId/readSyncState/readEntry/readEntries(≤100)/readThreadCount(≤501)/readPage`(cursor+manual+CTE 三分支)/`readManualPage/readScanCheckpoint/beginScan/applyScanPage/completeScan/abortScan/pauseScan/applyObservedEntry/applyObservedTitle/applyAuthoritativeRemoval/pruneEntriesOlderThan/pruneHost/upsertEntries/readStoredEntry/nextObservationSequence/bumpCatalogRevision/readCatalogRevision/runInTransaction(BEGIN IMMEDIATE)` | 高 |
| catalog 查询 helper | 27,531-27,590 | `thread-catalog/store`（同文件） | `fm`(project/origin 过滤子句), `pm`(cwd 前缀去重), `ghe`(尾分隔符规范), `_he`(source 解析), `mm`(row→entry，chatgpt/本地双形态) | 高 |

`hhe` 的 SQL 表面（直接证据，全在类体内）：`local_thread_catalog`、`local_thread_catalog_sync_state`、`local_thread_catalog_hosts`、`local_thread_catalog_scan_checkpoints`、`local_thread_catalog_scan_entries`、`local_thread_catalog_metadata`；索引名 `local_thread_catalog_cwd_created_idx/cwd_updated_idx/origin_updated_idx/project_updated_idx`。**db 句柄由构造函数注入**（`constructor(e, t=cm, n=t===cm?'local':'ssh')`），SQLite 打开不在本区（§7 风险 5）。

### B. 桌面通知 + 流订阅包装

| 聚类 | 行区间 | 建议模块 | 主要定义 | 置信度 |
|---|---|---|---|---|
| 通知音/路径 | 27,591-27,621 | `notifications/sound` | `hm`(文件名表), `vhe`(Group Container), `gm`(wav 路径), `_m`(linux canberra/win powershell 播放), `vm`(macOS staging 目录) | 高 |
| 通知服务 | 27,622-27,880 | `notifications/desktop-notifications` | **`bhe`→DesktopNotificationsService**：`showNotification`（去重 1e3、actions≤4、macOS 声音 staging 后再 show、reply）、`playBundledNotificationSound`、`dismissByConversationId/NavigationPath/NotificationId`、`emitCompletedThreadsChanged`；依赖 `l.Notification`、`Vp` 标题纯文本化 | 高 |
| app 适配器 | 27,882-27,879 | `notifications/app-adapter`（或并入调用方） | `xhe`→HostProcessAdapter（getVersion/before-quit） | 高 |
| 流订阅包装 | 27,880-27,981 | `app-server/stream-subscription` | **`Sm`→ConversationStreamSubscription**（`extends n.Uf`）：静态 `subscribeConversation`（262,144 字节排队上限、错误 reset、`a.en()` using-scope、`i(t)` 消费）、`subscribe`；`Cm`(dup 能力检测) | 高 |

### C. 会话状态基座（事件总线 + 驱逐 + 认证）

| 聚类 | 行区间 | 建议模块 | 主要定义 | 置信度 |
|---|---|---|---|---|
| 会话驱逐 | 28,725-28,757 | `conversations/eviction` | **`kh`→ConversationEvictionCoordinator**：archive/archive-notification/delete/discard 四原因 → 12 个下游清理（clearPersistedUnreadState/suppressArchivedConversation/removeThreadSummary/invalidateResumeState/inactiveThreadUnsubscriber/itemStreamState/manualContextCompactions/unread/resumeNotificationBuffer/threadStartedNotificationDeferral/removeConversationStoreEntries） | 高 |
| 会话事件总线 | 28,758-29,160 | `conversations/event-bus` | **`Ah`→ConversationEventBus**：turnStartRequested（capture 语义）、queuedMessageExecution、initialTitle、acceptedHistory、conversationCallbacks/Removed/State/Patch、streamRole(Callbacks/State/FollowersChanged)、anyConversation(Meta)、threadSummaries、threadListInvalidated、openFileChange、turnCompleted/InterruptStarted/Steered、approvalRequest/Resolved、realtimeThreadCreated/HandoffAttributed、userInputRequest、threadArchived/Unarchived/Deleted、notificationCallbacks（按 method） | 高 |
| 账号认证 | 29,161-29,515 | `auth/account-auth` | `jh`(branded loginId zod), **`Khe`→AccountAuthService**：`account/login/start`（apiKey/chatgpt/chatgptDeviceCode）、`cancelLogin`、remote login port forward、`windowsSandbox/setupStart`（whe=20min 超时、The=5min 冷却）、`handleNotification`（mcpServer/oauthLogin、account/updated、account/login/completed、windowsSandbox/setupCompleted）、`logoutWithoutServer`（cloud_requirements_auth_error 触发） | 高 |
| 回调句柄 | 29,516-29,528 | `util/dispose-handle` | `qhe`→UpdateHandle（update/Symbol.dispose） | 高 |

> 注意：`Khe`（认证）出现在 R3 而非粗扫判定的 R5（60,000-75,000 认证区）——R5 是传输/checkout 侧，RPC 级账号生命周期在此。重写归档时两处应合并到一个 auth 域 [高]。

### D. 输入编码与内容占位

| 聚类 | 行区间 | 建议模块 | 主要定义 | 置信度 |
|---|---|---|---|---|
| 非信任 app 输入 | 29,529-29,751 | `conversations/untrusted-input` | `Jhe`(流角色相等), `Mh`(threadId 提取), `Nh`(占位前缀), `Ph/Ih`(zod), `Xhe`(→untrusted_input function_call + text_elements 占位), `Zhe`(反解), `Lh/Rh`(UTF-8 字节长度) | 高 |
| 评论图像占位 | 29,752-30,065 | `conversations/image-placeholders` | `zh..eg`（9 类文案生成：element/region/text/virtual/graphics/PDF point），`tg='<image>'`, `rg..rge`(8 个匹配正则), `ige/age/oge/sge/cge/lge/mge/lg/ug/dg/gge/_ge`(匹配/清除/重写), `vh` 归一化 | 高 |
| 动态 app 工具 | 28,630-28,724 | `tools/dynamic-app-tools` | `Bhe/gh/Vhe`（request_environment_input 授权 schema）、`_h/vh/yh/bh`（option_picker/onboarding/setup_codex_step）、`xh/Hhe/Uhe/Whe/Sh` zod、`Ch/wh` 校验、`Ghe` 分发器、`Th/Eh` 响应包装、`Dh`（read_thread 能力）、`Oh`（capability 键） | 高 |

### E. turn/item 引擎（R3 最大聚类）

| 聚类 | 行区间 | 建议模块 | 主要定义 | 置信度 |
|---|---|---|---|---|
| steering 消息合并 | 30,067-30,187 | `turns/steering-merge` | `fg`(pending/accepted 匹配), `vge`(image 容差比较), `yge`(opening user message 判定), `bge`(steered 条目构造), `vg`(回填 serverUserMessageId), `gg/_g`(孤儿回收), `yg/pg/mg/hg` 谓词 | 高 |
| item 通用合并 | 30,188-30,291 | `turns/item-merge` | `bg`(append/replace + preferIncomingItems + memoryCitation 保留), `xg/Sg/Cg`(merge 核心与差异检测) | 高 |
| canonical history 访问器 | 30,428-30,533 + 31,567-31,687 | `turns/canonical-history` | **islands/entitiesByKey 模型**：`Eg`(尾 island), `Tge/Ege/Dge`(实体展开), `Dg`(全量实体), `Og`(turns 视图), `kg`(merge 后视图), `Ag`(按 turnId 查), `jg`(长度), `Pg/Fg`(末 turn 查找), `Ig/Lg/Rg`(历史完备判定), `zg`(倒序查找), `T_/E_/D_/O_/k_/A_`(turn 追加/定位/修改) | 高 |
| app-server 历史请求 | 31,239-31,330 + 31,824-31,981 | `turns/history-requests` | `C_`(`thread/items/list`), `w_`(11 参，`thread/turns/list`+items 并取), `N_`(durable host 包装), `P_`(timeline 源), `M_=5`, `Wge`, `Gge`, `j_`(31,694 大合并函数), `Hge` | 高 |
| 条目分页 | 31,331-31,566 | `turns/item-pagination` | **`Bge`→TurnItemsPaginationLoader**：inFlightLoads 去重、并发 preview≤2、checkpoint 续读、reconnect 游标处理 | 高 |
| 历史门面 | 31,982-32,446 | `turns/history-reader` | **`Kge`→ConversationHistoryReader**：`listThreadTurns`（timeline/compact/paginated/full 分派 + beginHistoryPage trace）、`loadConversationHistoryBoundaryPage/loadRemainingConversationTurns/loadBackgroundThreadHistoryPage`; `qge/F_/I_/L_`(边界句柄), `R_/Jge/z_/B_`(状态规范化+日期强制) | 高 |
| 状态投影 | 32,988-33,603 | `threads/projection` | `V_`(骨架), `G_`(摘要投影), `K_`(相等), `q_`(版本门), `J_/n_e/...`(heartbeat), `Y_`(automation 判定), `$_/ev/tv/nv`(turn 参数推断), `av/p_e`(collab receiver), `ov/sv/lv/uv`(父链), `H_/Zge/Qge` | 高 |
| 流角色 | 32,447-32,943 | `app-server/stream-state` | **`Yge`→AppServerManagerStreamState**：attach() 注册 transport 五回调、owner/follower 角色表、`broadcastIpcStatePatches`、follower 重连宽限、snapshot/patch 计数指标、`shouldIgnoreThreadMutationAsFollower`（turn/item/thread 前缀白名单）、`Xge`→SubscriptionRegistry | 高 |
| timeline 索引 | 33,604-33,857 | `threads/timeline-index` | **`g_e`→ThreadItemIndex**：timelinePositions/indexes WeakMap、patch 增量维护、status/activity/progress/createdThreadCalls 读取 | 高 |

### F. ThreadStore 门面

| 聚类 | 行区间 | 建议模块 | 主要定义 | 置信度 |
|---|---|---|---|---|
| hydration 投影 | 33,858-34,506 | `threads/hydration` | item 谓词群、`Ov`(thread→state)、`b_e`(批量 hydrate，并发≤2)、`x_e`(全量 list)、`S_e`(upsertFromThread)、`w_e`(patch diff)、`kv`(listState)、`Dv`(环境配置选择) | 高 |
| **存储门面** | 34,507-36,469 | `threads/thread-store`（可再拆 `thread-store/`、`thread-store-titles.ts`、`thread-store-hydration.ts`，各 <900 行） | **`T_e`→ThreadStore**：约 90 方法 40 字段。字段：conversations/archiveStateByConversationId/threadsById/loadedTurnsByHistory/timelineByIslands/legacyTurnIdentitiesByTurns/turnEntityKeysByConversationId/threadItemIndex(g_e)/turnFieldReaders/threadFieldReaders/transcriptAccess/subscriptions(Xge)/threadReadStates/backgroundThreadLookups(`new he()`=R1 的 139 行可重试缓存)/threadSummaries/recentConversationIds/pinnedConversationIds/pendingThreadTitlesById/confirmedThreadTitlesById/pendingThreadTitleWrites/lastAnySnapshotById/getCachedDisplayThreadTitle(memoize max:500)/readHydrationThreadMemoized(memoize promise)/hydrationGeneration/appliedHydrationResults。方法群：setConversation(35,038 大函数)/setThreadTitle/persistThreadTitle/updateConversationState/updateTurnState/refreshRecentConversations/observeCatalogThreads/hydratePinned|Active|Background|ArchivedThreads/setPinnedThreadIds/listAllThreads/listArchivedThreads/searchThreads/readThread/upsertConversationFromThread/runRecentConversationRefresh/hydrateThreads(36,037)/replaceThreadSummaries/upsertRecentConversationState/loadThreadHydrationState 等 | 高 |
| patch 分类 + 指标 | 36,470-36,760 | `threads/patch-classification` | `Iv`(patch→fullReset/entityKeys), `E_e`(recency 排序), `Lv/Rv`(操作句柄), `D_e`(流指标), `O_e/zv/Bv/Vv/k_e/A_e/j_e/Hv/Uv/Wv`(collab/model 更新), `M_e/N_e/P_e/F_e/Gv/Kv` | 中 |

### G. 请求/审批合成层

| 聚类 | 行区间 | 建议模块 | 主要定义 | 置信度 |
|---|---|---|---|---|
| elicitation/permission 合成 | 36,839-37,136 | `requests/item-synthesis` | `qv/I_e`(plan 请求), `Jv/Yv/Xv`, `L_e/R_e`(browser-use access_browser_origin + messages send_message 自动批准规则), `Zv/Qv/$v`(elicitation/permissionRequest/userInputResponse 条目合成), `B_e/V_e`, `ey/H_e/U_e/W_e` | 高 |
| elicitation 自动批准 | 37,137-37,248 | `requests/elicitation-auto-approve` | **`G_e`→AutoApprovedElicitationFlow**（host.begin + accept/cancel + 取消订阅）、`K_e`(工厂，含 `n.lr` 审批分类)、`q_e`(dispose 句柄) | 高 |
| 附件上传 | 37,249-37,543 | `attachments/upload` | `Q_e`(FileAttachmentTooLargeError), `$_e`→FileAttachmentUploader（fs/writeFile base64、限额 getMaxDirectTransferBytes）, `ive`→ThreadGoalAttachmentDirectories（fs/createDirectory/remove + 目录归属校验）, `ty/eve/tve/nve/rve` | 高 |
| 文件 watch | 37,544-37,865 | `files/open-file-watches` | `ny/ave/ove/ry/iy/ay`, **`sve`→OpenFileWatchRegistry**（reviewFiles/openFiles/mcpResources 三来源、ignoreChangesUntil、watch 变更消息）、`cve/oy/sy` | 高 |

### H. 历史完整性 + fork/rollback + resume

| 聚类 | 行区间 | 建议模块 | 主要定义 | 置信度 |
|---|---|---|---|---|
| fork + rollback | 37,866-38,268 | `threads/fork-rollback` | `lve`('0.143.0-alpha.32' 版本门), `uve`(fork 任意 turn，版本/分页模式双路径), `dve`, `fve`(rollback→状态应用), `pve`(revertedTurns→islands 修剪+边界重置), `mve/hve/gve/_ve`(完整历史装载) | 高 |
| 归档预览 + 提取策略 | 38,269-38,677 | `threads/history-policy` | `cy/ly`, `vve` zod, **`yve`→ArchivedThreadPreviewRead**（`extends n.Uf`，maxTurns≤100/maxItemsPerTurn≤500，thread_not_found→missing）, `uy/dy/bve/xve/Sve`, `Cve`(turnMergePolicy 聚合), `wve`(user/assistant 文本提取), `Tve`(限额), `fy=108e5` | 高 |
| resume 巨函数 | 43,549-44,555 | `threads/maybe-resume`（建议再按 状态判定/权限派生/执行 三段拆） | `Wye`→maybeResumeConversation：窗口活跃性/stream 角色判定、`Rx` 权限来源标注（explicit/thread_settings/latest_turn/current_permissions/default）、`Ax`(runtimeWorkspaceRoots 合并)、bounded cloud history、writer-conflict→`zye` 恢复、`session ... is archived.`→suppress、resume 失败回滚 resumeState；helpers `Fx/Ix/Lx/Gye/Kye/Rx/zx` | 高 |
| 启动配置 | 42,479-43,548 | `threads/start-config` + `threads/operations` | `mx/hx`(service tier + `n.Yo` 配置组装), `xye`(start/hydration 策略工厂), `wye`(service tier 读写 + copilot auth), `Aye`('0.146.0-alpha.7'), `Mye/wx/Tx/Nye/Pye/.../Uye`(fork/resume/projectless 操作群) | 高 |

### I. 通知应用层（app-server notification → 状态）

| 聚类 | 行区间 | 建议模块 | 主要定义 | 置信度 |
|---|---|---|---|---|
| delta 队列 | 39,288-39,401 + 39,402 | `streams/delta-queues` | `Mve=2e4/by=24/Pve=8/yy`(截断), **`Fve`→TextDeltaQueue**(rAF 帧分 flush、drain 帧), `Ive`→OutputDeltaQueue | 高 |
| 退订器 | 38,678-39,055 | `threads/inactive-unsubscriber` | **`Dve`→InactiveThreadUnsubscriber**（inactive owner 检查周期 Eve=15s?、keptLoaded、passiveHydrations） | 高 |
| item 分发 | 39,470-39,826 | `streams/item-notifications` | **`Rve`→ItemNotificationHandler**（delta 类入队、terminalInteraction 回放、fileChange patchUpdated 应用） | 高 |
| 手动压缩 | 39,827-39,879 | `threads/context-compaction` | **`Bve`→ManualContextCompactionTracker**（pending 计数 + `pending-manual-context-compaction` 合成项） | 高 |
| 审批审查 | 39,880-40,442 | `approvals/automatic-review` | `Xve/Dy/Zve`(状态/来源/协议枚举), `Qve/$ve`(snake_case 序列化), `eye/tye/nye/rye/iye/aye`(事件应用 + strictReviewNotice + autoReviewInterruptionWarning) | 高 |
| 通知大 switch | 40,443-41,277 | `streams/notifications-apply`（可拆 `notifications-thread.ts`/`notifications-turn.ts`） | `Ny/Py`(thread/*), `ky`(item/started 等), `Fy/Iy/Ly/Ry`(合成 item), `zy/By/Vy`(plan), `Hy...$y/eb/tb/nb/rb/ib/ab/ob`(turn 生命周期) | 高 |

### J. 归档流程 + sidebar + workspace 配置

| 聚类 | 行区间 | 建议模块 | 主要定义 | 置信度 |
|---|---|---|---|---|
| 归档/取消归档 | 41,278-41,455 | `threads/archive` | `sb`→UnarchivedConversationLoadError, `ub`→archiveConversation, `db`→unarchiveConversation, `fb`→performArchive（pin 位置保存、worktree 清理 `getManagedWorktreeCleanup`、无 rollout 回退 `archiveInactiveThread`、`storage.writeValue(Oh(t), void 0)` 清 capability）, `gb`(side conversation 系统提示词) | 高 |
| sidebar 分区 | 41,851-42,205 | `sidebar/custom-sections` | `Wb..sye`(CRUD 纯函数), `ex`(读 `sidebar-custom-sections-v3`), `cye`(placement), `lye/uye`(写回 + app-server sections `createSection`) | 高 |
| workspace/shell-env | 42,206-42,478 | `workspace/config` | `fye/nx/pye`(projectless 路径), `rx/ix/ax`(cwd/sandbox), `ox/sx`(profile 合并), `ux/gye/_ye/vye/dx/yye/fx/px`(shell_environment_policy), `hye/cx/lx`(提示词常量——`lx` 为 writing blocks 契约，建议独立 `prompts/` 文件) | 高 |

### 属于本区间的 `extends n.Uf` 类群（粗扫 §3.1 说 44 个中的 6 个）

| 行 | 名 | 语义 | 置信度 |
|---|---|---|---|
| 27,880 | `Sm` | ConversationStreamSubscription（静态工厂 + 262KB 背压合并） | 高 |
| 29,516 | `qhe` | UpdateHandle（update/Symbol.dispose 回调句柄） | 高 |
| 36,502 | `Lv` | AppServerOperationHandle（getStartResult/waitForCompletion） | 高 |
| 37,137 | `G_e` | AutoApprovedElicitationFlow | 高 |
| 37,241 | `q_e` | DisposableHandle | 高 |
| 38,305 | `yve` | ArchivedThreadPreviewRead | 高 |

（`Rv extends Lv`（36,517）间接继承 n.Uf。）

---

## 4. 顶层可变状态清单

R3 区间（26,445-44,555）**没有应用级顶层 `let` 可变状态**——所有可变状态都在类字段里。顶层绑定的完整清单：

| 名 | 行号 | 语义 | 读写方 | 置信度 |
|---|---|---|---|---|
| `Bme` | 26,445 | `s.t()` dist chunk 惰性 HTML parser（`.parse(html).structuredText`，疑似 parse5/linkedom 封装） | `Hp`（markdown 纯文本化） | 高 |
| `Jme` | 26,463 | `Zme()` 求值结果——打了 autolink 补丁的 gfm 扩展实例（模块加载期构建，之后只读） | `Vp` | 高 |
| `hm/vhe` | 27,591-27,592 | 通知音文件名表 / macOS Group Container 常量 | `gm/vm/bhe` | 高 |
| `yhe` | 27,593 | `r.i('desktop-notifications')` logger 工厂（加载期创建） | `bhe` 构造（`logger = yhe()`） | 高 |
| `ym/She/bm/Che/whe/The/xm/Ehe` | 27,880 前后 | 超时常量（30s/20min/2min/20min/5min…）与文案 | `Khe`/resume 区 | 高 |
| `Jm` | 28,131 | **immer 插件注册表**（`var Jm;`，`jhe(name, plugin)` 写入） | `Lhe()`/`qm('Patches')`/`qm('MapSet')`（vendored 内部） | 高 |
| `ph` | 28,623 | **immer 单例**（`new Ihe()`，模块加载期创建） | `mh/Rhe/zhe`（produce/produceWithPatches/applyPatches 绑定）；全区 700+ 处 `mh(...)` 调用 | 高 |
| `mh/Rhe/zhe` | 28,624-28,626 | `ph.produce` 等 bound 方法（全文件共享的 produce 入口） | 所有 conversation 状态更新（`hh(...)`=produce冻结包装、`updateConversationState` 内） | 高 |
| `Bhe/gh/Vhe/_h/vh/yh/bh` | 28,630-28,654 | 动态工具名常量 + zod schema | `Ghe/Dh/fv` | 高 |
| `xh/Hhe/Uhe/Whe/Sh` | 28,655-28,724 | 选项/onboarding zod schema | `Ch/wh/Ghe` | 高 |
| `jh` | 29,161 | branded zod（loginId） | `Khe` | 高 |
| `Nh/Ph/Fh/Ih` | 29,547-29,585 | untrusted input 常量 + zod | `Xhe/Zhe` | 高 |
| `tg/rg/ig/Qhe/$he/ege/tge/nge/rge` | 29,742-29,751 | `<image>` 占位 + 8 个文案匹配正则（g 标志，**有状态正则对象**——`lastIndex` 跨调用共享，重写时注意 `age` 中循环 replace 的顺序依赖） | `age/oge` | 高 |
| `Y_` | 33,184 | automation 判定器对象（isAutomationAssistantMessage/isAutomationUserInput）兼 turnMergePolicy | `vv/kg/Cve/Bge/T_e` | 高 |
| `u_e` | 33,263 | image src 白名单正则 | `Q_` | 高 |
| `fy/Eve/py` | 38,675-38,677 | 归档预览超时（3h）/检查间隔（15s）/上限常量 | `Dve` | 中 |
| `Mve/Nve/by/Pve` | 39,269-39,287 | 20k 字符上限/16/24/8 帧常量 | `yy/Fve` | 高 |
| `Sy` | 39,836 | `'pending-manual-context-compaction'` 合成项 id | `Bve/zve` | 高 |
| `Xve/Dy/Zve` | 39,980-39,982 | 审查状态/命令来源/网络协议枚举映射 | `Qve/$ve` | 高 |
| `eye` | 40,043 | too-many-denials 文案 | `rye` | 高 |
| `cb/lb` | 41,280-41,281 | error.message zod | `hb/mb` | 高 |
| `gb/_b/vb` | 41,444-41,456 | side conversation 提示词 / 扩展不支持错误 / token-budget 前缀 | `yb/bb` | 高 |
| `xb/Sb/Cb/...` | 41,479-41,850 | vendored lodash 模块（`e.t()` 惰性 CJS） | 全文件 `(0, G.default)` 等 | 高 |
| `Qb/$b/Hb/Ub/Vb` | 41,987-42,205 区间 | sidebar zod + global-state 键名 | `ex/cye/uye` | 高 |
| `fye/mye` | 42,206/42,238 | projectless 路径正则 / profile zod | `nx/sx` | 高 |
| `hye/cx/lx` | 42,251-42,261 | update_running_summary 名 + 两条系统提示词 | resume/start 配置 | 高 |
| `lve/Aye` | 37,875/42,940 | app-server 版本字符串（'0.143.0-alpha.32' / '0.146.0-alpha.7'）——**功能开关的版本门**，重写时需集中管理 | `uve`/sidebar sections | 高 |
| `Vx` | 44,570 | marked defaults（`Hx(e)` 可变 setter——vendored marked 内部） | marked | 高 |

---

## 5. 顶层副作用序列（模块加载即执行）

| 行号 | 语句 | 语义 | 置信度 |
|---|---|---|---|
| 26,463 | `Jme = Zme()`（var 链内求值） | **构建打了 autolink 补丁的 gfm micromark 扩展**（遍历 text constructs、WeakMap 包装 previous）。加载期执行，纯内存对象构建，无 I/O | 高 |
| 27,593 | `yhe = r.i('desktop-notifications')`（var 链内求值） | 创建具名 logger 工厂（本区唯一 logger 创建点）。加载期执行，仅 logger chunk 内部记账 | 高 |
| **28,300-28,313** | `(Pm(ih, (e,t) => { ah[e] = function(){...} }), ah.deleteProperty = function(...){...}, ah.set = function(...){...})` | **粗扫 §9.5 未识别副作用——已确认为 immer 内部**：`Pm` 是 immer 的对象键遍历器，此处把 `ih`（对象 draft proxy handler）的方法复制到 `ah`（数组 draft proxy handler）并改写首参解包（`arguments[0] = arguments[0][0]`）+ deleteProperty/set 的数字键校验。**纯 vendored immer 内部，无应用可观察副作用；引上游 immer 后整体消失** | 高 |
| 28,623-28,626 | `var ph = new Ihe(), mh = ph.produce, Rhe = ph.produceWithPatches.bind(ph), zhe = ph.applyPatches.bind(ph)` | 创建全局 immer 单例并绑定 produce。`Ihe` 构造纯内存。引上游 immer 后由 `import { produce } from 'immer'` 替代 | 高 |
| **28,649-28,650** | `(n.Ef(n.Of(), n.yf()).parse(n.Rf(gh)), n.Ef(n.Of(), n.yf()).parse(n.Rf(Vhe)))` | 丢弃结果的 zod parse：对两个动态工具 schema 自身的 JSON 做校验（类型断言副作用，粗扫已标记）。无外部效果 | 高 |
| 28,657 | `[...bh]` | 丢弃的数组展开（TS 编译产物，无效果） | 高 |
| 42,256-42,261 | `n.wf({ summary: n.Of().trim().min(1).max(50).regex(/^[^\r\n]+$/) });`（裸语句） | 丢弃的 zod schema 构造（update_running_summary 参数 schema 的类型断言）。**粗扫未记录的新副作用**。无外部效果 | 高 |
| 44,570 | `Vx = Bx()` | marked defaults 构建（vendored） | 高 |

**结论：R3 无任何 I/O 型加载期副作用**——所有副作用是内存对象构建（扩展实例、immer 单例、logger 工厂）或丢弃式 schema 校验。SQL 打开、IPC 注册、窗口操作全部延迟到实例化点（54,000+ / 161,000+，属 R4/R10）。

---

## 6. 跨 chunk 依赖

### @chunk/shared（`n.*`，src-DldfpmrL.js）

本区消费的 **chunk 级导出**（剔除局部变量名撞名后，按用途分组；行号为区内代表性使用点）：

| 类别 | 符号 | 语义 | 代表行 |
|---|---|---|---|
| zod | `n.Of/Cf/Mf/hf/wf/Df/Ef/df/gf/bf/yf` | string/number/nullable/array/object/discriminated-union/record/enum/boolean/literal/unknown + `n.Rf`（schema→JSON）、`n.Of().brand()`（29,161） | 全区 |
| id 工具 | `n.$u` | threadId 规范化（94 处，全区最高频） | 全区 |
| 版本门 | `n.Wu`（能力比较）、`n.Qu/n.Zu`（版本判定）、`n.pa`（默认 sourceKinds） | cliVersion 能力开关 | 33,151/41,457/34,074 |
| hostId | `n._s`（'durable' 云端 host）、`n.Cs` | durable 判定 | 32,012/38,672 |
| 错误 | `n.Zo`（错误消息提取）、`n.$i`（错误码）、`n.jc`（cloud_requirements_auth_error 判定） | 43,990/38,436/29,180 |
| 并发 | `n.Ac()`（Promise.withResolvers） | 37,152 等 |
| 审批 | `n.lr`（审批请求分类：mcpToolCall/generic/connectorAuth）、`n.tu`、`n.cr`（connector 相等） | 36,861/36,865 |
| 权限 | `n.kd`（默认权限）、`n.Nd/n.jd`（权限参数展开）、`n.ps`（addedFiles 过滤）、`n.Od()`（默认 sandboxPolicy） | 33,294/30,178/33,294/42,236 |
| 路径 | `n._l`（路径规范化）、`n.gl`（路径等价） | 42,225/42,530 |
| 图像 | `n.vl/n.wl/n.Tl`（URL 判定/解码） | 33,265 |
| 配置组装 | **`n.Yo`**（buildThreadConfig：model/serviceTier/permissions/instructionOverrides → config）、`n.nc/n.ic`（feature overrides 合并） | 42,387/42,422 |
| global-state | `n.wa/n.Ca`（sidebar-project-thread-orders 更新/解析） | 42,018 |
| 状态判定 | `n.fs`（本地附件判定） | 37,276 |
| EventEmitter | `n.Uf`（6 个类直接继承） | §3 表 |
| lodash 部件 | `n.dc/Bd/uc/Kd/Xd/mc/qd/Jd/_c`（copyObject/baseAssign/keys/getSymbols/getProto/...）+ `n.Ld`（isEqual，经 line 121 `G = e.a(n.Ld())` interop）+ `n.dr`（memoize，经 24,788 `pp` interop） | 41,486+/全区 |
| 其他 | `n.ro`（composerAttachmentLayout 枚举）、`n.fd`（automation userInput 解析） | 29,567/33,186 |

### @chunk/bootstrap（`a.*`）

本区**唯一的 bootstrap 依赖是 `a.en()`**（27,901、27,952，均在 `Sm` 静态方法内）：`var n = a.en(); let e = n.u(i(t)); ... n.e = e; ... finally { n.d(); }`——这是 TS `await using` 降级 helper（bootstrap 导出表 `en → tC`，即 bootstrap 18,917-18,976 的 using/asyncDispose 降级区）。重写为原生 ESM + TS 后此依赖消失 [高]。

### @chunk/logger（`r.*`）

仅 `r.i('desktop-notifications')`（27,593）一处；其余 logger 全部经构造参数注入（`params.logger`）[高]。

### @chunk/dist（`s.*`）

仅 `s.t()`（26,445，`Bme` HTML parser 惰性 require）一处 [高]。

### @chunk/main-shared（`i.*`）

本区无 chunk 级 `i.*` 消费（grep 命中均为局部变量）[高]。

### 本区向外的输出（被 R4/R10 消费）

R3 是定义区，产出即类与函数：54,078-54,436 装配（R4 的 conversation manager 构造函数）消费 `Ah/kh/Khe/T_e/Kge/Bve/Yge/Dve/Rve/$_e/ive/sve`；161,190-161,213 装配消费 `xhe/bhe/hhe`（`oe = n.si()` 为 null 时 catalog 关闭：`se = oe == null ? null : (e,t) => new hhe(oe, e, t)`）；51,905 消费 `Sm`；55,688-55,695 消费 `yve/Lv/Rv`（loginWithChatGPT 句柄）。

---

## 7. 拆分风险

1. **装配在区外（最大结构性风险）**：R3 全部类都在 54,078-54,436（conversation manager，R4）和 161,190-161,213（`art()` DI 装配，R10）实例化，构造参数对象极宽（`T_e` 的 params 有 parseUrl/readQueuedMessages/host/workspace 等 20+ 项；`Wye` 依赖 manager/workspace/historyPolicy/canAcquireOwnership/isCurrentResumeAttempt/setHydrationCleanup）。**重写顺序上必须先锁定 R4 manager 的装配面，R3 模块按其接口反推构造参数类型**；否则会产生循环 import（thread-store ↔ manager）。
2. **canonical turnHistory（islands/entitiesByKey）是贯穿性数据模型**：30,428-30,533 的访问器（`Og/kg/Ig/Eg...`）、`g_e` 增量索引、`w_e` patch diff、`pve` islands 修剪、`Iv/zve` patch 分类全部围绕它。拆分时这些必须进同一个 `turns/canonical-history` 域或共享 `types` 模块，且**新旧两套模型并存**（`e.turnHistory?.kind === 'canonical'` 与 legacy `e.turns` 双路径，每个访问器都有分支）——重写时极易漏掉 legacy 分支。
3. **immer produce 全局单例语义**：全区 700+ 处 `mh(...)`（= `ph.produce`）与 `hh(x)`（freeze 包装）依赖 immer 的 `autoFreeze_` 默认开启 + patches 插件懒注册（`Lhe()` 首次调用才装 `Patches`）。引上游 immer 时注意：`immer` 默认 autoFreeze 在 Electron 主进程可用，但 `produceWithPatches/applyPatches` 的行为必须与 vendored 版本对齐（vendored 版含 `useStrictIteration` 选项，上游 10.x 的 `Immer` 构造选项同名，可直接映射）。
4. **有状态 g 正则**：29,745 `rge` 数组中的 8 个正则带 `g` 标志且在 `age` 的循环 `replace` 中共享 `lastIndex`——若重写时改变调用顺序或并发使用会产生错位。建议重写为每次新建或用 `String.matchAll` 局部正则。
5. **SQLite 打开时序（与 bootstrap recoverSqliteState 的关系）**：`hhe` 构造要求 `db != null`；`oe = n.si()`（161,212）从 shared chunk 取**已打开的 state db 句柄**。该句柄的可用性由 bootstrap 主流程 25,440 的 `EA(Aj)`（SQLite 恢复流程：Retry/BackUp-and-Rebuild 对话框）保证——**main chunk 加载前 state db 必已打开或恢复失败已退出**。因此 `hhe` 不需要自己的打开/迁移路径，但重写时 `thread-catalog/store` 模块**必须容忍 `n.si()` 返回 null**（161,213 的 `se = oe == null ? null : ...` 分支：catalog 功能整体禁用而非崩溃）。`hhe` 构造函数内的两条 `INSERT OR IGNORE`/`ON CONFLICT` 语句（26,807-26,820）是**首次使用时建 host 行**，表结构 DDL 不在本 chunk（在 shared chunk 或 bootstrap 的迁移代码中）——重写时需从 shared chunk 侧找到 `local_thread_catalog*` 的建表语句。
6. **循环依赖风险点**：
   - `T_e`（thread-store）↔ `Rve`（item 分发）/`Dve`（退订）/`Kge`（历史读取）互持引用——当前靠构造参数注入（R4 装配时先建 `T_e` 再建其余），重写为 ESM 后保持同样的注入方向即可无环；
   - `Vp`（标题纯文本化）→ `Jfe/sme/Bpe/Wue`（remark/mdast 扩展，定义于 21,000-26,000 micromark 带内或其应用封装）→ `ae`（`<codex_delegation>` 解析，R1 的 69-90）——markdown 工具链横跨 R1/R3/micromark 带，建议独立 `markdown/` 域；
   - `kh`（驱逐）引用 `manualContextCompactions`(Bve)/`itemStreamState`(Rve)/`inactiveThreadUnsubscriber`(Dve) 等十余个兄弟子系统——全部经 `params` 注入，保持。
7. **版本门字符串散落**：`lve='0.143.0-alpha.32'`（37,875）、`Aye='0.146.0-alpha.7'`（42,940）、`n.Wu(t,'threadTimeline')`（33,151）、`n.Wu(t,'tokenBudgetHistoryNotes')`（41,457）——app-server 版本比较散布在 fork/sidebar/voice-history 三处。重写时应集中到 `app-server/capabilities` 模块，避免升级版本时漏改。
8. **`Wye`（maybeResume，43,549-44,455，~900 行单函数）**：内部 5 层 try/catch + 显式 `s()`（isCurrentResumeAttempt）守卫 + 大量 logger 快照。建议按「前置检查 → 配置派生（Rx/Ax）→ 请求发送 → 状态应用 → 错误恢复（zye/suppress）」拆 4-5 个函数；**必须保留 `isCurrentResumeAttempt` 的每次 await 后复查语义**（多处 `!s() || (...throw)` 短路链），这是取消正确性的核心。
9. **`T_e` 1,960 行**：字段初始化里有两个 memoize（`getCachedDisplayThreadTitle` max:500、`readHydrationThreadMemoized` promise 模式）依赖 lodash `memoize`（`pp = e.a(n.dr())`）。拆分时这两个缓存的生命周期（随 store 实例）不能变成模块级，否则跨测试/重连泄漏。`lastAnyOrderKey/lastMetaSnapshotById` 等快照字段是广播去重的关键，重命名时保持「上次快照」语义。
10. **两份 lodash**：shared chunk 的 lodash 部件（`n.dc` 等）+ 本区 41,479 的 `e.t()` CJS lodash 模块束并存。重写时统一为单一 `lodash-es` 依赖，删除 41,479-41,850，把 `(0, G.default)`（isEqual）、`(0, It.default)`（findLast 类）、`(0, pp.default)`（memoize，实为带 `{max,promise}` 选项的 memoize 库，**需确认 `n.dr` 上游**——选项形态像 `micro-memoize`/`lru-memoize` 而非 lodash.memoize）替换为显式 import。
11. **`bhe` 通知服务的平台分支**：macOS 走 Group Container 声音 staging（异步 mkdtemp/copyFile/rename 链），linux/win32 走 canberra/powershell 子进程（`P.spawn`，`P` 为 node:child_process interop）。重写时保持「staging 完成后才 show」的顺序（当前 `stageNotificationSoundIfNeeded().then(() => f())`）。
12. **`Khe`（账号认证）位置反直觉**：在 R3 而非 R5。R4/R5 派发时注意：R4 的 manager（54,273 `new Khe(...)`）在此实例化；R5 的 62,291 `hT`（Authenticated desktop fetch failed）是另一层。重写归档时 auth 域要合并两处。

---

## 附：与粗扫结论的差异清单

| 粗扫结论 | 本篇修订 | 证据 |
|---|---|---|
| micromark 带 21,000-26,000 | 延伸到 26,445（GFM 扩展 + SpliceBuffer + table + tasklist + gfm() 工厂） | 26,068/26,111/26,394/26,442 |
| marked 起点 ~44,570 | 44,556（`Bx()` defaults 工厂） | 44,556-44,570 |
| 28,300 `Pm(ih,...)` 未识别 | **immer 数组 draft proxy 方法补丁**（vendored 内部副作用，无应用效果） | 28,235-28,313 原文 |
| `hhe`（26,796）「db+hostId，thread DB 主类」 | 精确为 **LocalThreadCatalogStore**：sidebar/最近会话列表的 catalog（6 张表 + 扫描 checkpoint + 观察序列水位），**不是** conversation 内容存储（turns/items 存在 app-server 侧/rollout，桌面侧只缓存） | 类体 SQL |
| 34,507 `T_e`「conversation 读取门面」 | 实为 **ThreadStore**（读+写+hydration+标题持久化+搜索+订阅广播），R3 的核心单体 | 方法清单 §3.F |
| 32,447 `Yge`「app-server manager stream」 | 精确为 AppServerManagerStreamState：owner/follower 流角色 + IPC patch 广播 + follower 重连宽限 | 类体 |
| 37,137/37,241 `n.Uf` 类群 | `G_e`=elicitation 自动批准流、`q_e`=dispose 句柄（非 manager） | 类体 |
| 44 个 extends n.Uf 中本区间 | 6 个（Sm/qhe/Lv/G_e/q_e/yve）+ Rv 间接 | grep |
| 未发现 26,000-26,500 边界带归属 | 26,000-26,445 vendored micromark；26,445-26,558 应用 markdown 工具；26,559-26,622 prompt 标记 | §1 |
| 41,479 `xb = e.t(...)`（粗扫未识别，定义为普通函数区） | **vendored lodash 模块束**（约 30 个 CJS 模块） | §2 |
