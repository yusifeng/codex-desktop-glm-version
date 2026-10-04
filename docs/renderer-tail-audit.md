# Renderer 尾部资产审计

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
`popcorn-electron-surface-style` 的发布资产分别暴露 79、37、65 个压缩导出，
但 renderer 语义源码对三者全部只有副作用导入。它们是打包器形成的跨模块聚合
边界，而不是 181 个值得复制的业务 API。`scripts/test-renderer-incremental-hubs.mjs`
固定原资产、导出数量和消费方式；若未来出现命名导入，该测试会立即失败，届时应
只把实际消费的能力拆成语义源码并补充精确声明。

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

本轮进一步将 `app-primary` 未消费导出 `w2`（公开别名 `Ur`，约 80576 行）的
conversation readiness 三态策略迁移至
`src/renderer/app-primary/runtime/ensure-conversation-ready.ts`：缺失会 hydrate
后递归确认，未 resumed 或无 messages 会加载更早历史，其余情况直接完成。该模块
保留 Promise/`true` 返回契约，不接管 UI 初始化副作用；
`scripts/test-renderer-conversation-ready.mjs` 覆盖 10 项状态与回调断言。

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
