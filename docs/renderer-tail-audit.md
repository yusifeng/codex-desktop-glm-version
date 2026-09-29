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

截至 2026-09-29，尾部审计为 1331 rewritten / 86 preserved / 12 incremental hubs / 0
semantic tail pending；全量 app-code 覆盖为 1364/2247 tracked、883 pending，其中
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
