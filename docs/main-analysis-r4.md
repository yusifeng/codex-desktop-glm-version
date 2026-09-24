# main-C-Mhak1n.ts R4 深度分析（45,000-60,000 行）

目标：`src/main/main-C-Mhak1n.ts` 的 45,000-60,000 行（R4）。任务主题为「conversation 服务层 + 审批流」。
来源：macOS ChatGPT.app（Codex 桌面版 v26.917.71314）主进程 chunk。
方法：与 `docs/main-analysis-coarse.md` / `docs/bootstrap-analysis.md` / `docs/main-analysis-r1-r2.md` 同一方法论——200-400 行窗口采样 + 关键区域（类头、区域边界、副作用语句、实例化点）精读；所有行号经 `grep -n` 核实。结论标注置信度：**直接证据** = grep/原文引用支撑；**采样推断** = 窗口采样得出，需下游复核。

**工具坑（沿用粗扫 §9.2）**：本机 grep 为 ugrep 7.8.4，BRE `\|` 多模式静默失效。本文所有多模式扫描均用 `-E 'a|b'` 或分开单模式完成。

## 0. 总览与四个对粗扫的重要修正

1. **修正一：vendored 带比粗扫估计的大得多，且不止 marked 一个库。** 粗扫 §7 标注 marked 为 ~44,570-47,035；实际该带是 **4 个库的连续栈**（直接证据）：
   - **marked**（44,556-46,543）：`Bx()` getDefaults（44,556，含 `hooks` 字段）→ escape/splitCells 等 helpers（44,921-45,004）→ `wS` Lexer（45,005）→ `ES` Parser（45,880，v13+ 起 Renderer 已并入 Parser：`space()/code()` 渲染方法直接在 Parser 类上）→ `DS` TextRenderer（46,056）→ `kS` Hooks（46,256，`passThroughHooks` 静态集合）→ `AS` Marked 类（46,292）→ 静态绑定（46,514-46,543）。版本判定 **marked v13+**（Hooks 类 + Renderer/Parser 合并形态，直接证据；精确版本号未提取，置信度中高）。
   - **moo**（46,544-47,033）：`Dbe = e.t(...)` CJS 包装，`e.moo = n()` UMD 尾（46,550 直接证据）。
   - **alea**（47,034-47,094）：`FS = {exports:{}}` + IIFE，`t.exports ? ... : this.alea = a`（47,092 直接证据）。被 marked-directive 用来给扩展名生成随机后缀（`jbe(t).int32()`，47,330）。
   - **marked-directive**（47,095-47,355）：`IS = PS.default.compile({...})` JS tokenizer（47,097）、attrs states `RS`（47,174）、`Wbe`（47,227）、`Xbe` directive extension 工厂（47,327，`:::`/`::`/`:` 三级 marker 表 47,322）。
   之后 47,356-47,661 是**应用层对 directive 扩展的定制**（见 §1），47,662 起才是普通应用代码。
2. **修正二：56,944-61,587 是完整 vendored `@statsig/js-client`，粗扫完全漏检，且跨过 60,000 边界延伸到 R5。** 证据：56,944 `bw = e.t(...)` 起连续 **61 个 `e.t()` 惰性 CJS 模块**；57,236 `https://api.oaistatsig.com/v1`、57,238 `https://statsigcdn.openai.com/v1`（OpenAI 私有 endpoint）；57,005 `statsig::diagnostics`、58,933-58,935 `statsig::config_exposure/gate_exposure/layer_exposure`；61,533 `StatsigClient` 组装（`Yw = e.t(...)` 61,548-61,587）。粗扫漏检原因与 vscode-jsonrpc 带（§9.1）相同：该带是 2 空格缩进的 `e.t()` 惰性模块，顶层 `var/function` grep 模式失配。**应用侧尾巴**：`Xw` gate/config 名表（61,516-61,593，`codex-app-cross-host-handoff`/`codex-app-project-tools`/`codex_rollout_multi_agent_mode` 等 9 个 gate + 2 个 config，直接证据）+ `Zw` zod schema（61,594）+ `hTe()` 默认值工厂（61,599）——这些在 60,000 之后，归 R5 处理但语义上属于本区域的 statsig 接线。**R4/R5 派发边界必须改为 61,587**（61,516-61,604 的应用尾巴划给 R5 或并入 statsig 接线模块）。
3. **修正三：审批流（40,043）完全在 R3，未延伸进 45,000。** `eye = 'Automatic approval review rejected too many approval requests for this turn'`（40,043）是顶层字符串常量，消费者 `tye/nye/rye/iye/aye` 全部在 40,044-40,113 内闭合（直接证据：`tye` 函数体 40,044-40,057，`nye` 40,058-40,077，`rye` 40,078-40,085，`iye` 40,086-41,012 附近）。R3 的最后一个函数 `Wye`（thread resume 大函数，43,549-44,464）+ resume 辅助 `Fx/Ix/Lx/Gye/Kye/Rx/zx`（44,465-44,555）结束于 marked 边界 44,556 之前。**R4 内没有审批流代码**；审批流深析归 R3。
4. **修正四：54,072 `Lhe()` 已确认——immer patch 机制初始化器，无可观察副作用。** `Lhe` 定义于 28,469（R3 immer vendored 带内）。函数体（28,469-28,700 附近）：`process.env.NODE_ENV !== 'production'` 时向 `Dm` 数组 push 4 条 patch 错误消息字符串（`Sets cannot have "replace" patches.` 等），随后定义 `applyPatches` 使用的内部函数集合并挂到模块闭包。**无 I/O、无 Electron、无定时器、无网络**——粗扫 §9.5 对该调用的担忧解除。但它不是死代码：conversation 状态更新（`Pm` patch 机制，R3 28,300 一带）依赖这些错误消息注册。重写为正常 immer npm 依赖后，`Lhe()` 调用与 28,469 定义整体消失（immer 包内已含）。**置信度：高**（函数体已精读）。
5. **修正五：粗扫的「55,000-60,000 大方法总管类」边界不准。** 总管类 `rw` 实际在 **54,073-56,076**（2,004 行、237 个方法/存取器，直接证据）；56,077-56,943 是 marked 扩展/realtime 录制/语音时间账本应用层，56,944 起即 statsig vendored。`rw` 的内部结构（threadStore/subagentTopology/evictConversation 等字段）与粗扫采样一致，但它不是「千行方法」堆积——而是 237 个中小方法的巨型门面（最大方法 ~200 行）。

另：45,000-45,004 是 R3 函数 `Ebe`（marked helpers 之一）的尾行——R4 实际有效起点是 45,005（`wS` Lexer）。

---

## 1. 区域地图（行区间，每子区域 ≤1500 行）

| 行区间 | 类型 | 语义名 | 概述 |
|---|---|---|---|
| 45,000-45,004 | (R3 尾) | marked helpers 尾 | `Ebe` 函数尾行；45,000 边界切在 marked 带内部 |
| 44,556-45,004 | **vendored** | marked 前段 | `Bx` getDefaults（44,556）、`Vx` defaults 单例（44,570）、`Hx` setDefaults（44,571）、`Gx` regex 表（44,586）、escape/splitCells helpers `yS..Ebe`（44,921-45,004） |
| 45,005-45,879 | **vendored** | marked Lexer | `wS` 类（45,005-45,879） |
| 45,880-46,543 | **vendored** | marked Parser/TextRenderer/Hooks/Marked | `ES` Parser（45,880）、`DS` TextRenderer（46,056）、`kS` Hooks（46,256）、`AS` Marked（46,292）、静态绑定 `MS/OS/TS`（46,514-46,543） |
| 46,544-47,033 | **vendored** | moo lexer | `Dbe = e.t(...)`（46,544-47,033） |
| 47,034-47,094 | **vendored** | alea PRNG | `FS` CJS IIFE（47,034-47,094）、`Abe/jbe` interop（47,095-47,096） |
| 47,095-47,355 | **vendored** | marked-directive | `IS` JS-object tokenizer（47,097）、`Mbe/Nbe/LS/Hbe`（47,114-47,173）、attrs states `RS`（47,174）、`Ube`（47,198）、directive tokenizer `Wbe/Gbe/Kbe/qbe/zS/Jbe`（47,227-47,321）、marker 表 `Ybe`（47,322）、extension 工厂 `Xbe`（47,327） |
| 47,356-47,661 | 应用 | **codex directive 定制层** | 转义哨兵 `BS/VS/HS/US/WS/GS`（`__codex_directive_*`，47,356-47,361）；`KS = cxe()` 容错 directive 扩展（47,363，包 Xbe 并加 fenced-block 保护 `txe` 与属性预扫描 `Qbe`）；`qS/$be/exe/txe` fenced/属性预处理（47,370-47,438）；`JS/nxe/rxe/YS/ixe/axe/XS/oxe/sxe` token 后处理（47,439-47,561）；`ZS/hxe` 字符分类（47,656-47,661） |
| 47,662-47,815 | 应用 | **writing blocks** | `QS='codex_apps_writing_block_edits'`、分块上限 `gxe=800`、marked 实例 `_xe = new AS({...KS, breaks, gfm})`（47,664）；`yxe/bxe/xxe` 块 id/哈希（47,673-47,700）；`eC` 从历史 turn 提取 `:::writing` 块并注入 additionalContext（47,701-47,789）；`tC/nC/Sxe/Cxe` 合并/分块（47,790-47,815） |
| 47,816-48,306 | 应用 | **turn 提交流程** | `wxe` safety_buffer_retry（47,816-47,890，model/list + thread/revert|rollback）；`Txe` follow-up 消息（47,891-47,995）；`Exe`（47,996-48,264，含 Promise.race + Symbol.dispose）；`Dxe` continuation turn（48,265-48,306） |
| 48,307-48,422 | 应用 | runtime 家族比较 + workspace state | `rC=['luna','terra','sol']`、`Oxe` 版本 regex（48,307-48,308）；`kxe/Axe/iC/jxe/aC` 家族/版本比较（48,309-48,343）；`oC/Mxe/Nxe/Pxe/sC/Fxe/Ixe/Lxe/cC/Rxe/zxe/Bxe/lC` workspace state schema 与推导（48,344-48,421，`explicitRequestOnly` 48,422） |
| 48,423-48,760 | 应用 | **startTurn 准备（权限/工作区）** | `Vxe` 大函数（48,423-48,751，permission selection/workspace roots/环境解析）；`Hxe/Uxe/Wxe/uC/Gxe/Kxe/qxe/Jxe/Yxe/Xxe/dC/fC/pC/mC/Zxe` 请求准备辅助（48,752-48,892） |
| 48,893-49,333 | 应用 | **turn 派发核心** | `Yxe`（48,893-48,924）；`hC/Qxe` turn 启动主流程（49,019-49,333，follower 委托 `ny` + owner 校验 + `updateConversationState`） |
| 49,334-49,596 | 应用 | **steer turn** | `gC='SteerTurnInactiveError'/$xe='NoActiveTurn'`（49,334-49,335）；`eSe/tSe/_C` 错误判定（49,336-49,350）；`nSe` berry-display turnId regex（49,351）；`rSe` steer 主流程（49,352-49,504）；`vC/iSe/aSe/oSe` 辅助（49,505-49,596） |
| 49,597-49,948 | 应用 | **cSe StreamRecovery** | 断线重连 resume 重试状态机：generation/pendingConversationIds/retryTimers/retryDelayMs/unconfirmedMissingConversationIds；`markAllConversationsNeedResumeAfterReconnect`（49,647）、`onResumeAttemptSettled` 指数退避（49,685+，上限 6e4） |
| 49,949-50,243 | 应用 | turn 观测 + realtime 状态 + resume 缓冲 | `uSe/dSe/fSe`（49,949-49,997）；`pSe` RealtimeThreadState（49,998-50,110，订阅 `thread/realtime/started|closed`、`thread/started`，handleItemAdded 合成 steering 消息）；`yC/bC` ResumeNotificationBuffer（50,111-50,150）；`mSe` 缓冲重放去重（50,151-50,243） |
| 50,244-50,566 | 应用 | 通知去重 + **ySe SubagentTopology** + 版本 gate | `xC/SC/hSe/gSe`（50,244-50,260）；`_Se='0.143.0-alpha.16'` app-server 版本 gate（50,261，`bSe` 50,567）；`ySe` 后代线程发现（50,264-50,566：spawnAgent/collabAgentToolCall 扫描 `getKnownSubagentDescendantThreads`） |
| 50,567-50,670 | 应用 | thread goal resume | `bSe` 版本判定（50,567）；`xSe` realtime resume + `thread/goal/set`（50,570-50,610）；`CSe/wSe` goal turn 合成（50,611-50,670） |
| 50,671-51,198 | 应用 | **通知延迟/未读/prewarm** | `TSe` ThreadStartedNotificationDeferral（50,671-51,198 内，buffer/pendingStarts）；`kSe/ASe/jSe/MSe/NSe`（50,903-51,198）；`PSe` thread settings 键集合（51,005，14 个 `codex_internal_*`/`features.*` 键直接证据）；`ESe` UnreadTurnState（50,763-50,807）；`OSe` PrewarmedThreadManager（50,808-50,902，`DSe=285` TTL） |
| 51,199-52,567 | 应用 | **conversation 创建/排队** | `FSe/ISe` 创建参数组装（51,026-51,198）；`LSe` createConversation（51,199-51,289）；`CC` ConversationParamsBuilder（51,290-51,441：buildNewConversationParams/buildThreadCodexConfig/prepareConversation/preparePrewarm）；`RSe` prewarm 执行器（51,442-51,828）；`VSe` QueuedFollowUps 队列协调器（51,829-52,567，`extends n.Uf`，messages/pending/rerun 状态机）；`TC/HSe/USe` 队列工厂（52,568-52,588，USe 组装 VSe） |
| 52,568-53,633 | 应用 | **turn 上下文组装（schema 带）** | 附件去重 `EC/WSe/DC/GSe/OC/KSe/qSe`（52,694-52,786）；标题截断 `JSe=80/kC/AC`（52,769-52,790）；文本 schema `jC/MC/NC/PC/FC/IC/LC/XSe/RC/ZSe/QSe/$Se`（52,795-52,912）；annotation 控件 `eCe/zC/BC/nCe/VC/HC/rCe`（52,913-53,027）；浏览器 tab 提及上限 `iCe/oCe`（53,029-53,040）；行号/评论格式化 `UC/sCe/cCe/WC/GC/lCe/uCe`（53,041-53,075）；上下文文案常量 `dCe..zCe`（53,076-53,290，`## Prior conversation with Codex:` 等直接证据）；坐标 `KC/qC/JCe/JC/YC/YCe`（53,158-53,245）；`XCe` buildAdditionalContext 主函数（53,246-53,428）；`ZCe/QCe/XC/ZC/QC`（53,429-53,445）；`$C/$Ce/ewe/ew/twe/nwe/rwe` pasted-text/注释（53,544-53,633） |
| 53,634-53,788 | 应用 | queued message prepare + 门面 | `iwe` queued message prepare（53,634-53,760）；`awe` queued messages 门面（53,761-53,787）；`tw` zod（53,788） |
| 53,789-54,071 | 应用 | projectless 会话/工作区存储 | `owe` ProjectlessConversations（53,789-54,016：conversationIds/outputDirectoryHints/saveConversationId/removeConversation/loadThreadPathHints）；`nw` parentThreadId 解析（54,017）；`swe` ThreadWorkspaceStorage（54,020-54,071：`thread-writable-roots`/`thread-project-assignments` globalState 读写） |
| 54,072 | **副作用** | `Lhe()` | immer patch 机制初始化（见 §0 修正四） |
| 54,073-56,076 | 应用 | **rw = AppServerConversationManager 总管类** | `var rw = class extends n.Uf`（54,073）。2,004 行、237 方法。字段含 threadStore/subagentTopology/pagination/streamState/streamRecovery/turnCoordinator/prewarmedThreadManager/realtimeThreadState/resumeNotificationBuffer/threadWorkspaceStorage/projectlessConversations 等（54,074-54,118 直接证据）。方法组归类见 §3.2。**实例化点：64,825（R5 app-server 连接装配，每 host 连接一个实例）**；`static dispose`（54,121）、`static addTurnStartRequestedListener`（54,776） |
| 56,077-56,343 | 应用 | **marked 扩展层 II（math/citation/inbox-item）** | `cwe/lwe` `【...†L...】` codex-file-citation 解析（56,077-56,088）；`iw/uwe` skill-mention `$[...]`/`@file` regex（56,089-56,092）；`aw` math 块/行内扩展（56,096-56,191）；`hwe` Codex marked 选项集（56,192-56,265：KS directive + skillMention + codexAutolink `codex://` + codexDirective + math）；`vwe = new AS(hwe)`（56,306）；`ywe/uw/bwe` inbox-item `:::inbox-item` 提取（56,307-56,343） |
| 56,344-56,403 | 应用 | xwe InboxItemsFacade | automations inbox 门面：`bindTurnCompletions`（经 `rw.addTurnStartRequestedListener` 静态口挂接，56,358 直接证据）、persistAndNotify/markRead/markUnread；`n.w/n.x/n.b/n.fu.CHANGED` shared inbox API |
| 56,404-56,479 | 应用 | **push notification 注册** | `dw=[1e3,5e3]` 重试表（56,404）；`Cwe` APNS 注册（56,406-56,460：`l.pushNotifications.registerForAPNSNotifications()` 56,415 + `l.net.fetch` POST `/notifications/subscription/register` 56,417，**本区域唯二 Electron API 使用点**）；`wwe` 注销（56,461-56,479） |
| 56,480-56,943 | 应用 | **realtime 会话录制 + 语音时间账本** | `fw = r.r('RealtimeSessionRecorder')`（56,480）；`pw/Twe/Ewe/Owe` realtime 事件 schema（56,481-56,532）；`kwe` feedback 日志读取（56,533）；`Awe` RecordingGate 开关代际（56,547-56,559）；`mw` RealtimeSessionRecorder（56,560-56,879：`realtime-sessions/` 目录 JSONL 写、`getRootDirectory`、flush）；`Nwe/Fwe/Iwe` voice timeline schema（56,816-56,880）；`yw` 校验器（56,877）；`Lwe` VoiceTimelineLedger（56,881-56,943：`thread_timeline_ledger` 表 BEGIN IMMEDIATE/COMMIT/ROLLBACK 事务，**消费点 159,400** `new C8e(v, new Lwe(y))` 语音历史） |
| 56,944-60,000(+61,587) | **vendored** | **@statsig/js-client** | 61 个 `e.t()` 惰性模块（56,944-61,587）：Log/StatsigGlobal/EventBatch/BatchQueue/EventSender/FlushInterval/NetworkFallbackResolver/NetworkCore/FlushCoordinator/PendingEvents/UrlConfiguration/PrecomputedEvaluationsContextHandle/DataAdapterCore/ErrorBoundary/StatsigClientBase/V1|V2InitializeContainer/default。应用尾巴 `Xw/Zw/hTe`（61,516-61,604）在 60,000 后，归 R5 |

---

## 2. vendored 识别

| 包 | 版本 | 行区间 | 证据 | 置信度 |
|---|---|---|---|---|
| **marked** | v13+（Hooks 类 + Renderer 并入 Parser 的形态；精确版本未提取） | 44,556-46,543 | `Bx()` getDefaults 含 `hooks` 字段（44,558-44,68）；`kS` Hooks `passThroughHooks`（46,256-46,291）；`ES` Parser 直接含 `space()/code()` 渲染方法（45,880+）；`Please report this to https://github.com/markedjs/marked`（46,502） | 高 |
| **moo** | ~1.6 | 46,544-47,033 | `Dbe = e.t((e,t)=>{...define([],n):typeof t=='object'&&t.exports?(t.exports=n()):(e.moo=n())...})` UMD（46,545-46,551）；sticky/global/multiline regex 校验、`errorTypes` 等 moo 源码结构 | 高 |
| **alea** | ~1.x | 47,034-47,094 | `2091639` 常数、`t.exports ? (t.exports = a) : (this.alea = a)`（47,092）；`int32/double/quick/state` API（47,065-47,077） | 高 |
| **marked-directive** | ~2.x | 47,095-47,355 | `:::`/`::`/`:` 三级 marker（47,322-47,326）；`level: 'container'/'block'/'inline'`（47,323-47,325）；attrs `{...}` 解析 states（47,174-47,197） | 高 |
| **@statsig/js-client** | 未提取（SDK_VERSION 串在带内，未定位） | 56,944-61,587 | `api.oaistatsig.com/v1`、`statsigcdn.openai.com/v1`（57,236-57,238）；`statsig::config_exposure/gate_exposure/layer_exposure`（58,933-58,935）；`StatsigClient`（61,533）；61 个连续 `e.t()` 模块 | 高 |

注意与粗扫 §7 的关系：粗扫只标了 marked ~44,570-47,035。实际 vendored 带为 44,556-47,355（四个库），且 56,944-61,587 的 statsig 完全漏检。**本区间应用代码仅 ~47,356-56,943（约 9,600 行）+ 61,516-61,604 尾巴。**

statsig 的应用接线（消费 `Xw` gate 表与 StatsigClient 的代码）在 60,000 之后（`publishedStatsig` 见 159,402 一带 R10），R5/R10 深析覆盖。

---

## 3. 子系统聚类与模块拆分方案

### 3.1 markdown 簇（`markdown/*`）

- `markdown/codex-directives`（47,356-47,661 + 56,077-56,343，两段合并）：`KS`→`codexDirectiveExtension`（容错 tokenizer 包装 + fenced 保护）、`BS/VS/HS/US/WS/GS`→转义哨兵、`cwe/lwe`→`parseFileCitation`（`【path†L12-L34】`）、`aw`→`mathExtension`、`hwe`→`codexMarkedOptions`（skillMention/codexAutolink/codexDirective/math 组合）、`_xe`→`writingBlocksMarked`、`vwe`→`inboxItemsMarked`。
  **注意**：`KS` 被 47,664（writing blocks）和 56,202（inbox 扩展集）两处消费——两段必须共享同一个 directive 扩展模块，否则行为漂移。
- `markdown/writing-blocks`（47,662-47,815）：`eC`→`extractWritingBlockContext`、`yxe/bxe/xxe`→块 id/哈希、`Cxe`→`chunkByBytes`（800 字节分块）、`QS`→上下文键名。
- marked/moo/alea/marked-directive（44,556-47,355）**不派发重写**，引 npm：`marked`、`marked-directive`（其 deps 自带 moo/alea）。

### 3.2 conversation 服务簇（`conversation/*`）——rw 门面的支撑层

`rw`（54,073-56,076）是整个区域的 fan-in 汇点：47,662-54,071 的几乎全部自由函数都以 manager 实例为首参（如 `Ly(this,...)` 54,882、`fve(this,...)` 55,225、`M_e(this.getApprovalActionContext(),...)` 55,810）。拆分方案：

| 聚类 | 行区间 | 建议模块 | 主要定义（压缩名→语义名） |
|---|---|---|---|
| turn 提交 | 47,816-48,306 | `conversation/turn-submission` | `wxe`→`retrySafetyBufferedTurn`、`Txe`→`sendFollowUpMessage`、`Exe`→`submitTurnWithTimeout`、`Dxe`→`startContinuationTurn` |
| steer | 49,334-49,596 | `conversation/turn-steer` | `rSe`→`steerTurn`、`aSe`→`sendSteerRequest`、`oSe`→`waitForActiveTurnId`、`eSe/tSe/_C`→错误分类 |
| turn 派发 | 48,423-49,333 | `conversation/turn-dispatch` | `Vxe`→`resolveTurnPermissionsAndWorkspace`、`qxe`→`prepareTurnRequest`、`Yxe`→`prepareTurnSession`、`hC/Qxe`→`executeTurnStart`（与 R3 `ny` follower 委托协作） |
| workspace/权限 | 48,307-48,422 + 54,017-54,071 | `conversation/workspace-resolution` + `conversation/thread-workspace-storage` | `kxe/Axe/iC/jxe/aC`→runtime 家族比较（luna/terra/sol）、`Ixe/Bxe/zxe`→workspace state 推导、`owe`→`ProjectlessConversations`、`swe`→`ThreadWorkspaceStorage`（globalState 键 `thread-writable-roots`/`thread-project-assignments`/`thread-projectless-output-directories`/`thread-workspace-root-hints`） |
| 断线恢复 | 49,597-50,243 | `conversation/stream-recovery` | `cSe`→`StreamRecovery`（重试状态机）、`bC`→`ResumeNotificationBuffer`、`mSe`→`replayBufferedNotifications` |
| realtime 状态 | 49,998-50,110 + 50,567-50,670 | `conversation/realtime-thread-state` | `pSe`→`RealtimeThreadState`、`fSe`→`buildRealtimeSteerMessage`、`xSe`→`resumeRealtimeThreadGoal` |
| subagent 拓扑 | 50,244-50,566 | `conversation/subagent-topology` | `ySe`→`SubagentTopology`（spawnAgent/collabAgentToolCall 扫描）、`_Se/bSe`→app-server 版本 gate（**0.143.0-alpha.16，具名常量保留**） |
| 通知延迟/未读/prewarm | 50,671-51,198 | `conversation/notification-deferral` + `conversation/unread-state` + `conversation/prewarm` | `TSe`→`ThreadStartedNotificationDeferral`、`ESe`→`UnreadTurnState`、`OSe`→`PrewarmedThreadManager`（TTL 285s） |
| conversation 创建 | 51,199-52,567 | `conversation/conversation-creation` + `conversation/queued-follow-ups` | `CC`→`ConversationParamsBuilder`、`LSe`→`createConversation`、`RSe`→`PrewarmExecutor`、`VSe`→`QueuedFollowUpsCoordinator`（extends n.Uf）、`USe`→`createQueuedFollowUps`、`PSe`→`THREAD_SETTING_KEYS` |
| turn 上下文 | 52,568-54,016 | `conversation/turn-context`（~1,450 行，可再按 schema/格式化拆两半） | `XCe`→`buildAdditionalContext`、`qSe/OC/KSe`→附件/截图归一、`QC`→`formatCommentAttachment`、`jC..zCe`→schema/文案常量带 |
| **rw 总管** | 54,073-56,076 | `conversation/app-server-manager`（核心，建议再拆，见下） | `rw`→`AppServerConversationManager` |

### 3.3 rw（AppServerConversationManager）方法组归类（237 方法，直接证据：方法名 grep 提取）

拆分建议：单文件 2,004 行超 1,500 行约束，按方法组拆为 partial/mixin 或保留单类但分文件登记：

| 方法组（数量） | 代表方法 | 建议归属 |
|---|---|---|
| 生命周期（~6） | constructor/assertActive/`static dispose`/collectAppStateMetrics | `app-server-manager` 核心 |
| resume/stream 所有权（~14） | resumeThread/resumeConversation/getStreamRole/setConversationStreamRole/markDurableAeonStopped/markAllConversationsNeedResumeAfterReconnect | `manager-resume`（委托 `cSe` streamRecovery） |
| turn 执行（~12） | startTurn/steerTurn/startEmptyTurn/sendFollowUpMessage/interruptConversation/retrySafetyBufferedTurn/editLastUserTurn/handleThreadFollowerRequest | `manager-turns`（委托 §3.2 turn-* 模块） |
| 历史/读取（~16） | readThread/listThreadTurns/loadOlderConversationTurnsPage/getCompleteConversationTurns/readRecentThreadMessages/readConversationContext | `manager-reads` |
| 列表/summary（~14） | refreshRecentConversations/hydratePinnedThreads/hydrateBackgroundThreads/searchThreads/listAllThreads/getThreadSummaries/activateThreadSummary | `manager-threads` |
| subagent（~4） | getSubagentDescendantSnapshot/discoverSubagentDescendantSnapshot/reconcileSubagentDescendantSnapshot/interruptSubagentDescendants | 委托 `ySe` |
| 归档/fork（~14） | archiveConversation/unarchiveConversation/deleteArchivedConversation/performArchiveConversation/suppressArchivedConversation/forkConversationFromLatest/forkConversationFromTurn/finishPullRequestFixForkSetup | `manager-archive-fork` |
| 审批/动态工具（~12） | getApprovalActionContext/replyWithCommandExecutionApprovalDecision/replyWithFileChangeApprovalDecision/replyWithPermissionsRequestApprovalResponse/replyWithUserInputResponse/replyWithOptionPickerResponse/getDynamicToolRequest/replyWithDynamicToolResponse/beginUserVerification/replyWithMcpServerElicitationResponse | `manager-approvals`（审批流本体在 R3 40,044-41,000，这里是**决策回执侧**） |
| 认证（~13） | loginWithApiKey/createChatGptLoginSession/loginWithChatGpt/logout/logoutWithoutServer/getAccount/getAuthMethod | `manager-auth`（委托 R5 认证层） |
| settings/权限（~8） | updateThreadSettingsForNextTurn/updateThreadPermissions/updateThreadSettings/runThreadSettingsUpdate/waitForPendingThreadSettingsUpdate | `manager-settings` |
| 附件（~12） | uploadLocalFileAttachments/createFileAttachment/createPastedTextAttachment/writeThreadGoalAttachment/copyLocalFileAttachment | `manager-attachments` |
| workspace（~9） | getThreadWorkspaceState/commitThreadWorkspaceTransition/mergeThreadWritableRoots/replaceThreadWritableRoots/createProjectlessThreadWorkspace/isProjectlessConversation | 委托 `swe/owe` |
| 事件订阅（~30） | addConversationCallback/addNotificationCallback/addTurnCompletedListener/addApprovalRequestListener/… | `manager-events`（事件中枢是 R3 28,758 的 `Ah` 类，`events = new Ah()` 54,078） |
| 未读/prewarm/杂项（~30+） | markConversationAsRead/setConversationUnreadState/saveReadState/prewarmConversation/clearPrewarmedThreads/broadcastConversationSnapshot/registerWindowActivity | 核心保留 |

### 3.4 其他簇

- `automations/inbox-items`（56,344-56,403）：`xwe`→`InboxItemsFacade`（经 `rw.addTurnStartRequestedListener` 静态口 + shared `n.w/n.x/n.b/n.fu` inbox API）。实例化 161,207（R12 启动装配）。
- `notifications/push-registration`（56,404-56,479）：`Cwe`→`registerPushNotifications`、`wwe`→`deregisterPushNotifications`。**本区域唯一触碰 Electron（`l.pushNotifications`/`l.net.fetch`）的模块**。
- `realtime/session-recorder`（56,480-56,943）：`fw` logger、`Awe`→`RecordingGate`、`mw`→`RealtimeSessionRecorder`（JSONL 落盘 `realtime-sessions/`）、`Lwe`→`VoiceTimelineLedger`（SQLite `thread_timeline_ledger` 表）。实例化 161,197-161,199（R12）。
- `telemetry/statsig-wiring`（61,516-61,604，**在 60,000 后**）：`Xw`→gate/config 名表、`Zw`→schema、`hTe`→`defaultStatsigValues`。派发时归 R5 或独立小任务。

---

## 4. 顶层可变状态清单

（模块级 `var/let` 且被运行时改写；类字段不算。行号核实过）

| 名 | 行 | 语义 | 读/写方 | 证据 |
|---|---|---|---|---|
| `Vx` | 44,570 | marked defaults 单例 | 写：`Hx`（44,572，setOptions）；读：marked 内部（`options: e || Vx` 45,883 等） | 高（vendored marked 内部） |
| `KS` | 47,363 | codex directive 扩展实例（`cxe()` 构造，const 后不再变） | 读：`_xe`（47,664）、`hwe`（56,202） | 高 |
| `_xe` | 47,664 | writing-blocks 用 Marked 实例 | 读：`eC`（47,712 `_xe.lexer`） | 高 |
| `vxe/$S` | 47,665-47,672 | writing block 字段 zod schema（const） | 读：`eC` | 高 |
| `PSe` | 51,005 | thread settings 白名单 Set（14 键，const） | 读：`FSe`（51,021） | 高 |
| `iw/uwe/dwe` | 56,089-56,092 | skill-mention/文件引用 regex（const） | 读：`fwe`（56,093）、`cw`（56,273 附近） | 高 |
| `aw/hwe` | 56,096/56,192 | math 扩展/codex marked 选项（const 对象字面量） | 读：`vwe = new AS(hwe)`（56,306） | 高 |
| `vwe` | 56,306 | inbox/citation 用 Marked 实例 | 读：`ywe`（56,308） | 高 |
| `dw` | 56,404 | push 注册重试延迟表 `[1e3,5e3]`（const） | 读：`Cwe/wwe` | 高 |
| `Nwe/Fwe/Iwe` | 56,816-56,880 | voice timeline zod schema（const） | 读：`yw`/`Lwe` | 高 |
| `Xw/Zw` | 61,516/61,594 | statsig gate 名表/schema（const；**60,000 后**） | 读：`hTe`、R10 `publishedStatsig` | 高 |

**结论**：与 R1+R2 不同，本区域**没有模块级可变应用状态**（无 `let` 惰性缓存、无运行时改写的 Map/Set 单例）。全部状态都在类实例内（`rw` 的 40+ 实例字段、`cSe` 的 retryTimers 等）。唯一被改写的顶层 `var` 是 vendored marked 的 `Vx`。置信度：高（`let` 顶层绑定 grep 为空 + 逐个核实）。

---

## 5. 顶层副作用序列（模块加载即执行）

区间内列 0 非声明语句全集（`grep -nE '^[a-zA-Z_$(!{(]'` 排除声明后，逐条核实）：

| 行 | 语句 | 语义 | 可观察副作用 |
|---|---|---|---|
| 44,570 | `var Vx = Bx()` | marked defaults 构造 | 无（纯对象） |
| 46,517-46,541 | `MS.options = MS.setOptions = ...`、`var NS = MS.walkTokens` | marked 静态绑定 | 无（纯赋值） |
| 46,543 | `(MS.parseInline, OS.parse, TS.lex)` | 逗号表达式（求值后丢弃，rolldown tree-shake 标记风格） | 无 |
| 47,035-47,094 | `(FS.exports, (function(e){...})(FS))` | alea UMD 定义（只定义不执行 PRNG） | 无 |
| 47,363 | `KS = cxe()` | 构造 directive 扩展；内部 `Xbe()` 调 `jbe(':::').int32()` 等 alea 求值 | 无（纯计算，无 I/O） |
| 47,664 | `_xe = new AS({...KS, breaks, gfm})` | Marked 实例构造 | 无 |
| 51,005 | `PSe = new Set([...])` | 常量集合 | 无 |
| **54,072** | **`Lhe()`** | **immer patch 机制初始化**：向 `Dm` push 4 条错误消息（dev 守卫）+ 定义 applyPatches 内部函数 | **无 I/O/Electron/定时器**；但为 immer patching 正确性所必需（见 §0 修正四）。重写引 npm immer 后消失 |
| 56,091 | `RegExp(\`${iw}\|${uwe}\`, 'g')` | **丢弃表达式（死代码）**——构造后未赋值未使用，疑为重构残留 | 无 |
| 56,306 | `vwe = new AS(hwe)` | 第二个 Marked 实例 | 无 |
| 56,944-61,587 | 61 个 `e.t()` 惰性模块 | statsig vendored——**rolldown 惰性 init，加载期不执行**（`e.t()` 只注册包装，首次调用才跑） | 无 |

**结论**：R4 区域**没有模块加载期的可观察副作用**——无 Electron 接线、无 fs I/O、无定时器、无网络。粗扫 §6/§9.5 点名的 54,072 `Lhe()` 已确认为 immer 内部初始化（纯内存操作）。所有 Electron/网络活动（push 注册、realtime 录制写盘、SQLite 账本）都发生在**调用时**，由启动装配（R12 161,197-161,207）或 `rw` 方法触发。置信度：高（列 0 语句全集已枚举）。

---

## 6. 跨 chunk 依赖

### 6.1 @chunk/shared（`n.*`）——本区间主要用法（应用段 47,356-56,943）

- **zod 实例族**（schema 密集区 52,795-53,290、56,481-56,880）：`n.wf`(object)/`n.Of`(string)/`n.Cf`(number)/`n.gf`(bool)/`n.bf`(literal)/`n.hf`(array)/`n.Ef`(record)/`n.jf`(union)/`n.Df`(discriminated-union)/`n.vf`(union by method)/`n.df`(enum)/`n.Mf`(unknown)/`n.mf`/`n.yf`(any)/`n.la`/`n.rf`（第二套实例，push token schema 56,405）
- **conversation 协议**：`n.$u`(threadId 规范化)、`n.Wn`(resume not-ready 错误类)、`n.mr`(delivery 错误)、`n.Zo`(error→string)、`n.Cs`(host 判定)、`n.Gn`、`n.Wu`(app-server 版本比较)、`n.Qu/n.Zu`(版本比较)
- **workspace/路径**：`n._l`(路径归一)、`n.vl`(路径校验)、`n.kd`(默认 sandbox/approval policy)、`n.Tl/n.Ol`、`n.Hr`
- **inbox（automations）**：`n.w/n.x/n.b`(inbox items 读写)、`n.fu.CHANGED`(变更枚举)、`n.Zr`(automation guard)
- **浏览器上下文**（52,913-53,075）：`n.Pu/n.Fu`(element metadata)、`n.Lu/n.Iu`(browser context 判定)、`n.nr/n.Gc/n.rr`(frame path)、`n.Hc/n.Wc`(tab 去重)
- **SQLite**：`n.si()`(取 better-sqlite3 句柄，56,881 `Lwe` 与 159,399 消费)
- **EventEmitter 基类** `n.Uf`：`VSe`(51,829)、`rw`(54,073) 直接继承
- **工具函数 interop**：`up = e.a(n.Ra())`（mapValues，24,784）、`Qfe = e.a(n.Yi())`（posix path，24,785）、`It = e.a(n.Do())`（pick，764）、`yu = e.a(n.en())`（uniqBy，14,437）、`Bb = e.a(zb())`（omit，41,823，`zb` 为本地 `e.t` 模块）
- 其他：`n.Oi`(codexHome，56,570)、`n.ca`(thread assignment 解析，54,037)

### 6.2 logger chunk（`r.*`）

区间内仅 1 处具名 logger：`fw = r.r('RealtimeSessionRecorder')`（56,480）。其余 logger 经构造函数注入（`rw` 的 `logger` 字段由 R5 64,825 装配传入；`cSe` 等的 `deps.logger`）。

### 6.3 bootstrap chunk（`a.*`，对照 docs/bootstrap-export-table.txt）

| 导出符号 | bootstrap 名 | 区间内用法 | 行号 |
|---|---|---|---|
| `a.N` | `LE`（globalState 键：electron-automations-installation-id） | `xwe.bindTurnCompletions` 读 installationId | 56,359/56,365 |
| `a.mt` | `cT`（认证请求头） | `Cwe` push 注册加 Bearer/Account-Id 头 | 56,410 |
| `a.ht` | `oT`（authed fetch 包装） | `Cwe` | 56,411 |
| `a.xt` | `rT`（API endpoint URL 构造） | `Cwe`/`wwe` `/notifications/subscription/*` | 56,411/56,465 |
| `a.rn` | `Ht`（bundleIdentifier） | `Cwe` body `bundle_id` | 56,427 |
| `a.in` | `M`（build flavor 模型） | `Cwe` body `build: 'prod'` 判定 | 56,426-56,427 |

（区间内 `a` 大量被用作函数参数名遮蔽；上表已逐处甄别。）

### 6.4 Electron（`l.*`）

区间内仅 push 注册模块触碰（直接证据）：`l.pushNotifications.registerForAPNSNotifications()`（56,415）、`l.net.fetch`（56,417/56,472）。其余 ~9,600 行应用代码**零 Electron 依赖**——这对拆分极友好。

### 6.5 node 内置

`D`(timers/promises setTimeout，56,435)、`b`(fs/promises readdir/readFile，56,622-56,633)、`h`(path join，56,569/56,639)——全部在 realtime recorder 模块内。

---

## 7. 拆分风险

1. **statsig 边界跨 60,000（最大派发风险）**：vendored 带 56,944-61,587 横跨 R4/R5 边界。若 R5 agent 从 60,000 起按应用代码派发，会撞上 e.t() 惰性模块区（顶层 grep 失配，粗扫 §9.1 同款陷阱）。**派发修正**：56,944-61,587 整段归 vendored（引 npm `@statsig/js-client`，注意其 endpoint 硬编码为 `api.oaistatsig.com`/`statsigcdn.openai.com`——需核对私有 build 是否有 patch）；R5 从 61,588 起算，`Xw/Zw/hTe`（61,594-61,604）作 statsig 接线小模块。
2. **marked 扩展层的两段共享**：`KS`（47,363）同时被 `_xe`（47,664，writing blocks）与 `hwe`（56,202，inbox/citation/math）消费，且 `hwe` 还引用 `wS.prototype.url`（56,229，直接调 marked Lexer 原型方法）。拆分后 `markdown/codex-directives` 必须是两处共同依赖；对 marked 内部原型的调用（`wS.prototype.url.call`）在升级 marked 版本时是脆弱点，需锁版本。
3. **rw 是全区域 fan-in 汇点 + 静态 API**：47,662-54,071 的自由函数几乎全部以 manager 为首参（`Ly(this,...)`/`fve(this,...)`/`M_e(this.getApprovalActionContext(),...)`），拆分后依赖方向必须保持 `app-server-manager → helpers` 单向；`rw.addTurnStartRequestedListener`（54,776 静态方法）被 `xwe`（56,358）跨模块调用——静态口需显式化为 manager 的公开事件接口（事件中枢是 R3 28,758 `Ah` 类）。
4. **与 R3 的依赖方向**：R4 大量依赖 R3 定义——`ny`(37,554 follower 委托)、`Ag/kg/Fg/Ng/hh/dg/b_/k_/h_`(30,006-33,031 turn/state 操作)、`H_`(33,031 source 解析)、`Ah`(28,758 事件中枢)、`Lhe/Pm`(immer)、`VSe` 的 `Vxe` 权限推导也回调 R3 的 `Pg` 等。方向单一（R4 → R3），无反向；但 R3 的 conversation state 原语（`updateConversationState` 的 immer patch 路径）必须先稳定，否则 R4 全部重写都要返工。`Lhe()`（54,072）在 R3 的 immer 带内定义、在 R4 调用——若 R3 先拆走 immer 而 R4 仍保留补丁机制文本，加载顺序会 break；两端必须同步切到 npm immer。
5. **rw 实例化在 R5**：`new rw({...transport: new EEe(t,...)...})`（64,825，每 app-server host 连接一个实例）。R4 定义、R5 装配——拆分后 `conversation/app-server-manager` 是 R5 `app-server-connection` 的依赖；构造参数表（hostId/transport/logger/pendingThreadArchives/sendAppServerResponse/threadExecution/ipcBridge/coordination/scheduler/storage/threadProjectAssignments/savedReadState/filesystem/runtime/settings/tracing/useTailHydration/runtimeSettings，54,153-54,175 直接证据）就是两模块的接口契约。
6. **长程消费者**：`Lwe`（56,881）在 159,400 被 R10 语音历史消费（`new C8e(v, new Lwe(y))`）；`Awe/mw/xwe` 在 161,197-161,207 被 R12 启动装配消费。拆分时这些模块的构造签名不能变。
7. **版本 gate 常量**：`_Se = '0.143.0-alpha.16'`（50,261，subagent 拓扑 gate）与 `rC = ['luna','terra','sol']`（48,307，runtime 家族序）是有意钉死的兼容分界——同 R1+R2 §7.10，作为具名常量保留并注释，勿「规范化」。
8. **死代码**：56,091 丢弃的 `RegExp(...)` 表达式——重写时可直接删除，但需确认无 V8 regex 缓存预热之类的隐性意图（置信度：删除安全，采样推断）。
9. **zod schema 带**：52,795-53,290 与 56,481-56,880 两段 schema 密集区全部基于 shared chunk 的 zod 实例族（`n.wf/n.Of/...`）。重写时这些转成真 zod schema 时要注意 `n.rf`（56,405）是**另一套实例**（global-state 用），与主实例不可混用（粗扫 bootstrap 分析 §0 已知）。
10. **审批流的归属澄清**：R4 内只有**审批决策回执**（rw 的 `replyWith*ApprovalDecision` 方法组，54,073-56,076 内）与 `getApprovalActionContext`；审批请求的接收/审查/`tooManyDenials` 判定在 R3（40,044-41,000）。两模块拆分后接口为：R3 `approval-review`（产生请求与审查）→ rw `manager-approvals`（回执 `turn/start` 等响应）。

---

## 8. 给下游派发的建议

- **不派发**（引 npm）：44,556-47,355（marked+moo+alea+marked-directive）、56,944-61,587（@statsig/js-client）。
- **派发重写**（应用段，~9,600 行 + 61,594-61,604 尾巴）按 §3 模块清单；每个模块任务描述给出：行区间（§1）、压缩名→语义名（§3）、构造参数契约（§7.5）。
- **优先级**：`conversation/app-server-manager`（rw，54,073-56,076）是本区间最大单体，建议单独派发并按 §3.3 方法组拆分交付；其依赖的 10 个支撑模块（§3.2 表）先行。
- 56,077-56,943（marked 扩展 II + realtime recorder + voice ledger）自成一体，可独立派发；注意 §7.6 的长程消费者。
- 派发 R5 时把边界从 60,000 改到 61,588（§7.1），避免 statsig 带撞车。
