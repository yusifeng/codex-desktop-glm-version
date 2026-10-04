# `browser-page-preload.ts` 逐段审计

## 已抽取边界

WebMCP 协议闭环（原 30,084-30,216 行）已迁移至
`src/main/browser-page-preload/webmcp-protocol.ts`，由原 preload 通过
CommonJS 依赖注入接回。schema、policy gate、刷新生命周期和两条
contextBridge 路径均有 VM smoke 覆盖；其余 preload business 区段仍保持
原文件并按下表审计。

deployment channel 与 WebMCP policy channel 配置（原 27,471-27,503 行）已迁移至
`src/main/browser-page-preload/deployment-channel.ts`，原入口保留 `gx`/`yx`/`bx`
兼容别名并直接调用 helper；`scripts/test-preload-deployment-channel.mjs` 覆盖
解析、内部 channel、debug menu、React Scan 和 policy channel。

Chrome/Edge 扩展发行配置（原 27,187-27,294 行）已迁移至
`src/main/browser-page-preload/extension-distribution.ts`，原入口保留 `cx`
配置别名；`scripts/test-preload-extension-distribution.mjs` 覆盖 dev/internal/prod
分发列表、store 分发类型和输出模式。

WebMCP registry shim（原 27,295-27,470 行）已迁移至
`src/main/browser-page-preload/webmcp-registry.ts`，原入口的 `dx` 工厂接回该
模块；注册、枚举、stale registration、AbortSignal、JSON 输入/结果校验由
`scripts/test-preload-webmcp-registry.mjs` 覆盖。

WebMCP descriptor 序列化与 descriptor 总大小/数量限制（原 30,084-30,129 行）已迁移至
`src/main/browser-page-preload/webmcp-descriptor.ts`，由协议入口注入 schema 与 policy
limits；`scripts/test-preload-webmcp-descriptor.mjs` 覆盖 schema 拒绝、inputSchema
JSON round-trip、工具数量与字节大小边界，共 5 项断言。

Annotation surface channel、feature 列表、role/id/rect/hit/response schemas
（原 6,432-6,508 行）已迁移至 `src/main/browser-page-preload/annotation-protocol.ts`。
该模块通过入口现有 schema factory 注入，原 `qd/Wd/Jd/Yd/Xd` 绑定接回；
`scripts/test-preload-annotation-protocol.mjs` 覆盖 channel、限制和 response 类型。

Annotation hit/control payload 的安全对象克隆、rect/role/id 校验、metadata 限制和序列化
（原 `Qd` 内部 6,783-6,862 行）已迁移至
`src/main/browser-page-preload/annotation-control-payload.ts`，`annotation-runtime.ts` 仅保留兼容
导出并通过窄委托接回，响应 detail payload 也由同一模块组装；`scripts/test-preload-annotation-runtime.mjs` 覆盖恶意对象、几何边界、
metadata 过滤、hit-test request 边界、annotation controls 序列化/metadata/targets、range/open-request detail、control handle lifecycle、registry payload/target parsing/index/read/pagehide lifecycle、surface element boundary、selection 渲染策略和 response JSON 形状，共 45 项行为断言。

Annotation surface 的 pagehide disposal、top-document element containment 与 selection
render gate 已迁移至 `src/main/browser-page-preload/annotation-surface-policies.ts`。
该模块仅保留不依赖 DOM 副作用的生命周期/渲染判定，`annotation-runtime.ts` 继续提供
兼容导出；`scripts/test-preload-annotation-surface-policies.mjs` 覆盖可信 pagehide、
iframe/断开元素过滤和 renderer 失败/状态变化门控，共 11 项断言。

Annotation controls registry 的生命周期实现（注册、更新、target 索引、dispose 与
可信 pagehide 清理）已迁移至 `src/main/browser-page-preload/annotation-controls-registry.ts`，
原入口 `Cf` 通过依赖注入接回；`scripts/test-preload-annotation-controls-registry.mjs`
覆盖注册、更新替换 target、覆盖顺序、dispose、target 总量限制和 pagehide 清理，共 10 项断言。
pending editor message reducer 也已迁移至 `src/main/browser-page-preload/pending-editor-message.ts`，
由 `Kb` 接回，并由 `scripts/test-preload-pending-editor-message.mjs` 覆盖 restore、close、sync
和未知消息处理，共 6 项断言。

Annotation surface feature observer（原 `Ff` 7239-7326，含 `If` 的 attachShadow hook
7327-7345）已迁移至 `src/main/browser-page-preload/annotation-surface-observer.ts`，
由 `Bb` 注入 parser、contextBridge 和 feature callback 接回；containers/metadata、shadow-root
observer、pageshow、recordUse 优先级和 dispose 由 `scripts/test-preload-annotation-surface-observer.mjs`
覆盖，共 13 项断言。

Annotation surface registry（原 `Yg` 22359-22510）已迁移至
`src/main/browser-page-preload/annotation-surface-registry.ts`，由 `t_` 接回；surface
registration、hit-test response 校验、render/cancel/clear、invalidated/disposed 和 dispose
由 `scripts/test-preload-annotation-surface-registry.mjs` 覆盖，共 9 项断言。

Virtual annotation target payload（原 `n_` 22777-22800）已迁移至
`src/main/browser-page-preload/annotation-virtual-target.ts`，由设计 overlay selection
回调接回；page URL、virtual target identity、viewport point 和 rect fallback 由
`scripts/test-preload-annotation-virtual-target.mjs` 覆盖，共 6 项断言。

Surface/viewport rect clipping（原 `Qg` 22525-22535）已迁移至
`src/main/browser-page-preload/annotation-surface-geometry.ts`，由 surface registry
和入口兼容函数共同使用；viewport 边界、空交集和负坐标由
`scripts/test-preload-annotation-surface-geometry.mjs` 覆盖，共 4 项断言。
该模块同时承载 region rect union（原 `s_` 22838-22845），geometry 回归断言共 6 项。
并继续承载共享的按轴 rect intersection、rect scale、coordinate clamp 与大区域判定
（原 `A_`/`w_`/`F_`/`P_`），以及 marker 推导 viewport 和 canvas 尺寸合并
（原 `j_`/`d_`）；marker、scroll-container 和 frame 几何入口已接回，回归断言增至 30 项。

Annotation 空格键拦截策略（原 `i_` 22799-22824）已迁移至
`src/main/browser-page-preload/annotation-keyboard.ts`，由键盘 listener 入口接回；
trusted/Space、typing context、修饰键和 keydown/keyup 行为由
`scripts/test-preload-annotation-keyboard.mjs` 覆盖，共 5 项断言。

滚轮可滚动祖先选择（原 `zv`/`Bv` 23668-23689）已迁移至
`src/main/browser-page-preload/annotation-scroll-container.ts`。该模块只接收
DOM parent/style 读取器和既有轴向滚动 predicate，入口仍保留实际 scrollBy/scrollTop
副作用；`scripts/test-preload-annotation-scroll-container.mjs` 覆盖上/下边界和空起点，
共 3 项断言。

Annotation 模式的跨域 iframe pointer-events guard（原 `Vg` 22296-22354）已完整迁移至
`src/main/browser-page-preload/annotation-frame-pointer-guard.ts`。document/shadow-root 扫描、
新增节点和 load 监听、同源 frame 恢复、overlay 排除、样式所有权保护及 dispose 由 13 项断言覆盖。

Annotation overlay 的非 React runtime 尾部（原 `Jy/Yy/Xy/Zy/Qy/$y/eb/tb/nb/rb/ib`
26495-26592）已迁移至
`src/main/browser-page-preload/annotation-overlay-runtime.ts`。overlay root、hover snapshot、
当前页 design refresh、flex gap 子项、按 root 隔离的 element cache、DOM mutation、text selection、
metadata tooltip 和 region 去重均由该模块持有；原入口只保留调用点兼容代理，React `Uy/Wy/Gy/Ky/qy`
仍留在 UI 边界。`scripts/test-preload-annotation-overlay-runtime.mjs` 以 48 项行为断言覆盖该闭环。
其中 flex-container 子项 gap overlay 的目标选择、display gate、绝对定位过滤、可见 rect
和稳定 key 已进一步迁移至 `annotation-flex-gap-overlays.ts`，由
`scripts/test-preload-annotation-flex-gap-overlays.mjs` 的 7 项断言覆盖；overlay runtime
仅负责注入 DOM 依赖并保留兼容方法。

Annotation display anchor resolution（原 `Q_` 22881-22905）已迁移至
`src/main/browser-page-preload/annotation-display-anchors.ts`，入口继续注入既有 DOM resolver
与 viewport geometry；text 替换、element cache、当前页缺失 selector 过滤、additional anchor
投影和 source-index 保留由 `scripts/test-preload-annotation-display-anchors.mjs` 的 5 项断言覆盖。

Annotation site-preview layer（原 `dy/py/_y`，23543-23648）已迁移至
`src/main/browser-page-preload/annotation-preview-layer.ts`。该模块保留 preview mask 的
SVG clip-path 重建、按 element 增量维护 clip/glow DOM、border-radius 投影、viewport
尺寸缓存、stale target 清理和 dispose；入口 `_y` 仅注入原 CSS、rounded-rect path 与
corner-radius 适配器。`scripts/test-preload-annotation-preview-layer.mjs` 覆盖 style/mask
装配、target 更新、圆角样式、viewport 尺寸、stale 节点清理与销毁，共 8 项断言。

Annotation comment-runtime 的异步挂载生命周期（原 `annotation-preload-runtime` 内联
mount/pending-preview/dispose 段）已迁移至
`src/main/browser-page-preload/annotation-runtime-mount.ts`。该模块保留单次挂载、异步
加载完成后的销毁竞态、pending site-preview 交接和 runtime dispose；入口只负责注入
bridge 与调用点。`scripts/test-preload-annotation-runtime-mount.mjs` 覆盖重复 mount、
preview 交接、销毁和异步竞态，共 7 项断言。

审计对象：`.reference/originals/main/browser-page-preload.ts`（30,217 行）。

审计日期：2026-10-03。

## 结论

该文件不是单一业务模块，而是 Electron browser-page preload 的 bundle：

- 业务段实现浏览器批注/评论运行时、DOM 选择与定位、设计标记、WebMCP
  注册和 `ipcRenderer`/`contextBridge` 协议。
- vendor/generated 段包含 Zod、React 19.2.7、React DOM 19.2.7、React Intl
  和 UUID 实现。它们通过 bundle 内部闭包加载，不能用同名空函数替代。
- Electron 入口只在第 43 行引入 `electron`；业务 IPC 的实际调用点集中在
  26912-27185、30132-30217，协议常量在 6432-6435、30084-30131。

本轮只完成逐段审计和证据登记，没有把压缩代码改写成“看似可读”的空壳。
`browser-page-preload` 仍应作为 transform-only chunk 保留，后续语义化必须
按业务协议闭环迁移并以输出导出/运行时行为验证。

## 逐段清单

| 原版行号 | 判定 | 内容和证据 | 处理边界 |
|---:|---|---|---|
| 1-43 | `vendor/generated` + 入口 | Rolldown CJS helper（`Object.create`、getter re-export、lazy module wrapper）；第 43 行唯一顶层 Node/Electron 依赖 `require("electron")`。 | 保留 bundle helper；入口依赖不能移除。 |
| 44-3862 | `vendor` | Zod 4 core 风格实现：`_zod` trait/def、`ZodString`/`ZodObject`/`ZodPipe`/`ZodCustom` 等构造器，以及 JSON Schema 转换。典型证据：44-81 的 schema class factory、2480-2676 的 JSON Schema 处理、3500-3852 的 `Zod*` 构造器。 | 不能按业务 schema 单独替换；它是 preload 内部 schema 运行时。 |
| 3863-5049 | `business` | 安全序列化和浏览器上下文/批注协议基础：`Xo`/`Zo`/`Qo`/`$o` 限制可传输对象，3900-3917 声明 2 KiB/6 keys/256 字符限制；4313 起是 DOM/window、selection、element snapshot、viewport 和 annotation anchor 工具；6432-6435 声明 IPC event 名。 | 业务逻辑必须和 annotation schema 一起迁移，不能只迁 helper。 |
| 5050-5119 | `vendor` | UUID v4 生成器：`crypto.getRandomValues`、`randomUUID`、byte layout；5084 行包含 uuidjs 文档 URL，5101-5113 是标准 v4 写入逻辑。 | 保留或改为显式依赖，禁止 identity stub。 |
| 5120-7259 | `business` | 页面文档上下文、Google Docs 检测、元素/文本/可见区域采样、批注 surface 和请求验证。证据：5167-5237 的 document context class；6169 起 annotation request schema；6400-6849 的事件校验、surface hit-test、selection/render 回调。 | 这是可提取的业务核心，但需保留 frame/shadow-root/timeout 语义。 |
| 7260-7553 | `business` | annotation controls registry：`codex:register-annotation-controls`、update/dispose channel，控制项 schema、DOM MutationObserver、跨 frame target 跟踪。证据：7260-7272 常量/schema，7273-7529 `Cf` registry，7532-7551 pending editor message reducer。 | registry 生命周期已迁移至 `src/main/browser-page-preload/annotation-controls-registry.ts`，pending editor message reducer 已迁移至 `src/main/browser-page-preload/pending-editor-message.ts`，均由入口接回并有独立行为断言；仍需继续迁移后续 annotation UI/runtime 业务段。 |
| 7554-19016 | `vendor/generated` | Vite preload error wrapper（7554-7563）后为 React 19.2.7 + React DOM reconciler/runtime。证据：7565 起 `Symbol.for("react.*")`；7983、8141、18959-18973 明确版本 `19.2.7` 和 `rendererPackageName: react-dom`；19003-19015 是 React devtools hook。 | 整段保留；React reconciler 不能伪造业务源码。 |
| 19017-21896 | `vendor/generated` | TypeScript helpers、memoize、FormatJS/React Intl runtime。证据：19017 `__extends`/object spread helper；20844 `[formatjs Error`；20977、21106、21468、21649-21867 的 FormatJS API/locale fallback 文本。 | 保留 vendor；业务只依赖其公开 formatter。 |
| 21897-22290 | `vendor/generated` | React Intl 组件/provider 和 react-is compatibility layer。证据：21897-21903 React Intl assertion；21940 起 `Symbol.for("react.*")` type predicates；22266-22282 `IntlProvider`。 | 保留 vendor/runtime。 |
| 22291-26794 | `business` | 浏览器批注/设计 UI runtime：MutationObserver 监控 annotation containers/shadow roots、selection/scroll/viewport、draft marker 和 React UI component。证据：22291-22334 DOM observer；22351-22455 design control sync/reset；23900-23955 marker/metadata UI；23961-24007 scroll routing；24525-24667 animation/controls observer；26495-26592 overlay helper。 | overlay 非 React helper 已迁移至 `annotation-overlay-runtime.ts`；React render/hook assembly 与其余业务段继续按闭环迁移。 |
| 26795-26881 | `business` | frame/anchor resolution、overlay styles 和 browser comment runtime mounting prerequisites；使用 `requestAnimationFrame`、`MutationObserver`、document style attributes。 | 与 22291-26794 同一业务闭环。 |
| 26882-27185 | `business` | Electron IPC 生命周期和 context state：policy 初始化、feature resources、lazy mount、host bridge、pending replay、permission、pagehide cleanup，以及 drag/mouse navigation。 | 整个 annotation preload IPC/context 生命周期已迁移至 `annotation-preload-runtime.ts`，并复用已拆出的 permission/context/routing/input 模块；原 `Bb/Vb/Hb/Ub/Wb/Kb/qb/Yb` 与私有状态已删除。 |
| 27187-27294 | `business` | 浏览器扩展发行配置（Chrome/Edge dev/internal/prod、extension IDs、store URLs）。 | 配置数据可迁移为 typed constants；不得归类为通用 vendor。 |
| 27295-27470 | `business` | WebMCP registry shim：tool name/description/schema 校验、AbortSignal 生命周期、JSON-serializable execute/getTools/registerTool API。证据：27295-27440 registry；27442-27469 secure-context/name/result validation。 | 已完整迁移至 `webmcp-registry.ts`；被导入遮蔽的旧 `dx/fx/px/mx/hx` 实现已删除，并补齐 input JSON round-trip/context 可变性回归。 |
| 27471-27503 | `business` | deployment channel enum (`Dev`/`Agent`/`Nightly`/`Prod`) 与 WebMCP policy IPC channel `codex_desktop:get-browser-webmcp-policy`。 | 配置/协议常量，属于业务。 |
| 27504-30083 | `vendor` | 第二份 Zod 3 runtime（本仓库 package-lock 锁定 `zod-3.25.76`）。证据：27504 `assertNever`/enum helpers；27626 `ZodError`；28071 standard vendor `zod`；30021-30054 Zod typeName enum。 | 保留内部 runtime；不能把 schema methods 替换成空对象。 |
| 30084-30217 | `business` | WebMCP descriptor schemas、descriptor byte-size limits、policy gate、navigation/pagehide refresh、`contextBridge.exposeInMainWorld`/`executeInMainWorld`，以及最终 startup (`sC`, zoom limits, `Bb`, `tx`, `Zb`)。证据：30084-30129 schema/limits；30132-30215 IPC + contextBridge；30217 启动顺序。 | A2 的第二个核心协议段；启动顺序是保留边界。 |

## IPC/contextBridge 协议证据

| 行号 | API/channel | 语义 |
|---:|---|---|
| 43 | `require("electron")` | preload 获得 `ipcRenderer`、`contextBridge`、`webFrame`。 |
| 6432-6435 | `codex_desktop:message-for-view`, `codex_desktop:browser-sidebar-runtime-message`, `codex_desktop:browser-page-event`, `codex_desktop:get-browser-annotation-api-policy` | 批注/侧边栏双向消息、feature event 和 policy 查询。 |
| 26913-26955 | `on`, `sendSync`, `send`, `invoke` | 初始化 policy、feature reporting、toggle annotation mode。 |
| 26960-26971 | `pagehide` + `removeListener` | 非持久页面销毁 listener/runtime，属于生命周期协议。 |
| 27014-27021 | `invoke(Bd, message)` | 页面向 host 发送 editor/navigation/image-drag 命令。 |
| 27023-27058 | `on(zd, handler)` | host-to-page message allowlist 和订阅清理。 |
| 27096-27110 | permission request | request id 配对、拒绝时 resolve false，避免悬挂 promise。 |
| 27502 | `codex_desktop:get-browser-webmcp-policy` | WebMCP policy sync 查询。 |
| 30135, 30150-30156 | policy/limits/event | WebMCP enable gate、descriptor limits 和 change notification。 |
| 30171-30214 | `exposeInMainWorld` / `executeInMainWorld` / internal override | 将受限 WebMCP API 暴露给主世界，并包装 AbortSignal。 |
| 30217 | startup call order | WebMCP、zoom、annotation runtime、mouse/drag listeners 的固定初始化顺序。 |

## Schema 证据

业务 schema 不应和 vendor schema 混淆：

- 6169-6179：annotation request input schema。
- 6437-6464：site annotation feature event schema。
- 6467-6509：annotation response/metadata/role limits。
- 7268-7272、7230-7257：annotation control schema 和 callback uniqueness/type checks。
- 30084-30106：WebMCP descriptor/annotations schema。
- 30107-30129：max tools、max descriptor bytes 的边界检查。

## 保留与迁移建议

1. 保留 1-43、44-3862、5050-5119、7554-22290、27504-30083 的
   vendor/generated runtime；登记理由应引用本报告的行号，不应只写“preload vendor”。
2. 将 3863-5049、5120-7553、22291-27470、30084-30217 视为业务候选区，
   以 annotation IPC 和 WebMCP IPC 为两个闭环逐步迁移。
3. Annotation feature policy 初始化、controls/request/observer 创建与 dispose 已迁移至
   `src/main/browser-page-preload/annotation-feature-lifecycle.ts`；入口仅保留 state wiring、
   host message routing 与页面生命周期。11 项 focused assertions 覆盖 enable/disable、
   permission reset、所有 disposable 子系统清理及 disabled policy 分支。
4. 26912-27185 与 30132-30217 不适合先做局部 identity wrapper：它们依赖
   状态机、listener cleanup 和 contextBridge 隔离世界，必须在同一迁移批次中
   保持 channel 字符串、消息 allowlist、pagehide 行为和启动顺序。
5. 本报告没有证明 vendor 以外的业务段已经语义化；因此本报告不能作为
   `browser-page-preload` REWRITTEN 的证据，只能作为 A2 审计第一阶段交付物。

## 可复核命令

```bash
wc -l src/main/browser-page-preload.ts
rg -n 'contextBridge|ipcRenderer|Zod|react-dom|formatjs|uuidjs|WebMCP' src/main/browser-page-preload.ts
nl -ba src/main/browser-page-preload.ts | sed -n '26882,27217p'
nl -ba src/main/browser-page-preload.ts | sed -n '30084,30217p'
```

Annotation overlay 的 HTTP(S) loopback/`.localhost` URL 判定已迁移至
`src/main/browser-page-preload/local-url.ts`，原 `qg` 入口保留兼容调用面；该安全
边界由 `scripts/test-preload-local-url.mjs` 覆盖。

Annotation region drag 的 viewport 判定、drag threshold、双点 rect 与状态推进已迁移至
`annotation-surface-geometry.ts`；原全局 `Is/Ls/Rs` 与 UI 尾部 `ab/ob/sb/cb` 已删除。

### 增量抽取：annotation serialization boundary

批注名称规范化、metadata 的 prototype/descriptors/key/value/UTF-8 大小校验，以及属性
metadata JSON 解析已迁移至 `src/main/browser-page-preload/annotation-serialization.ts`。
入口仅保留 `Xo/Zo/Qo/$o` 兼容代理并注入原 Zod parsers；`scripts/test-preload-annotation-serialization.mjs`
覆盖名称、继承对象、非法 key、key 数量、JSON/字节上限等 11 项断言。
### 增量抽取：Google Docs context helpers

Google Docs/Sheets URL 识别、文档/表格 ID 与 tab 参数解析、标题/选中文本规范化，
以及 document context payload 组装（原 3966-4021、5162-5184）已迁移至
`src/main/browser-page-preload/google-docs-context.ts`。入口保留 `hs/gs/_s/vs/ys/bs`
兼容别名并委托 helper；9 项行为断言覆盖普通/发布 URL、query/hash tab、跨域拒绝、
Sheets ID 和 context 文本规范化。

### 增量抽取：annotation document context

文档上下文运行时（原 `Xl`，5162-5184）已迁移至
`src/main/browser-page-preload/annotation-document-context.ts`。该模块保留 Google Docs
判定、跨 window selection 与 active input selection 回退、frame document 安全访问、
可见文本 TreeWalker 过滤、viewport 相交判断和 2,000 字符上限；入口通过依赖注入保留
原 `Xl` API 与 `isGoogleDocsAnchor` 静态判定。`scripts/test-preload-annotation-document-context.mjs`
覆盖 element/region context、跨域拒绝、selection 回退和可见文本采样，共 14 项断言。

### 增量抽取：annotation surface element boundary

annotation surface 注册与 MutationObserver 清理共用的顶层元素判定已迁移为
`isValidAnnotationSurfaceElement`：要求 HTMLElement、非 iframe、已连接、归属
当前 document 且 root node 为当前 document。压缩入口仅保留注册生命周期、事件
调度与回调执行；该策略由 annotation runtime 回归断言覆盖。

Annotation shadow-root discovery observer（原 `Ng` 22064-22116）已迁移至 `src/main/browser-page-preload/annotation-shadow-root-observer.ts`，保留动态 shadow-root 注册、失效清理、annotation selector 变更通知与 attachShadow 事件监听；由 `scripts/test-preload-annotation-shadow-root-observer.mjs` 覆盖 4 项断言。

Annotation surface IPC event dispatch/response-event 判定（原 `Xg` 22415-22417 及其 `Yg` 注入）已迁移至 `src/main/browser-page-preload/annotation-surface-events.ts`，保留 bubbling、JSON detail 序列化和 `CustomEvent` 类型判定；由 `scripts/test-preload-annotation-surface-events.mjs` 覆盖 5 项断言。

Annotation editor default-mode meta lookup（原 `Iy` 24484-24492）已迁移至 `src/main/browser-page-preload/annotation-editor-default-mode.ts`，保留 meta selector、允许值过滤及缺失 head/content 的安全回退；由 `scripts/test-preload-annotation-editor-default-mode.mjs` 覆盖 3 项断言。

Annotation overlay 的条件 class-name 归一化与拼接（原 `cv/lv` 23340-23356）已迁移至
`src/main/browser-page-preload/annotation-class-names.ts`；两个 cursor 组件改用语义入口，
原压缩 helper 已物理删除。`scripts/test-preload-annotation-class-names.mjs` 以 9 项断言覆盖
字符串/数字、递归数组、对象 map、falsey 过滤、非支持 primitive 与原有 `for-in` 语义。

Annotation controls 的 running-animation ancestor/frame 判定（原 `Dy` 24375-24386）已迁移至
`src/main/browser-page-preload/annotation-motion.ts`；入口仅保留 DOM 依赖适配，
`scripts/test-preload-annotation-motion.mjs` 覆盖自身、ancestor、frame、idle 与 null 边界。

Annotation controls 的 candidate/frame 稳定性判定（原 `Ey` 24365-24373）已迁移至
`src/main/browser-page-preload/annotation-frame-stability.ts`；入口注入 anchor/frame 依赖，
由 `scripts/test-preload-annotation-frame-stability.mjs` 覆盖顶层、嵌套 frame、anchor mismatch、
非 iframe 与 null 边界。

Annotation controls 的 containment ancestor 判定（原 `Oy` 24383-24410）已迁移至
`src/main/browser-page-preload/annotation-containment.ts`；入口注入 DOM/CSS 依赖，
由 `scripts/test-preload-annotation-containment.mjs` 覆盖祖先命中、无关 target、position/contain 边界与 null。

Annotation design draft text 的最新变更选择（原 `Zv` 23790-23796）已迁移至
`src/main/browser-page-preload/annotation-draft-text.ts`；入口保留 DOM 更新副作用，
由 `scripts/test-preload-annotation-draft-text.mjs` 覆盖空输入、未变化项、倒序选择与缺失 previous 值。

Annotation design draft target 收集与缓存（原 `Jv` 23394-23413）已迁移至
`src/main/browser-page-preload/annotation-draft-runtime.ts`；入口保留 draft attribute
写回和已存在 DOM 节点清理，模块注入 frame/document、URL、target resolver 与连接状态
适配器，维持跨 frame/page 过滤、target cache 复用及同一元素多 draft attribute 合并。
由 `scripts/test-preload-annotation-draft-runtime.mjs` 覆盖 target 聚合、frame/page
过滤和 cache 复用，共 4 项行为断言。

Annotation design draft attribute token 解析（原 `ny` 23797-23802）已迁移至
`src/main/browser-page-preload/annotation-attribute-tokens.ts`；入口保留属性读写副作用，
由 `scripts/test-preload-annotation-attribute-tokens.mjs` 覆盖缺失、空值与多空白 token。

Annotation design snapshot 的字段投影（原 `cy` 23871-23888）已迁移至
`src/main/browser-page-preload/annotation-design-snapshot.ts`；入口保留 live annotation 编排，
由 `scripts/test-preload-annotation-design-snapshot.mjs` 覆盖稳定字段投影与纯函数重入。

Annotation design target label 生成（原 `ly` 23889-23896）已迁移至
`src/main/browser-page-preload/annotation-target-label.ts`；入口注入 accessible-label 解析，
由 `scripts/test-preload-annotation-target-label.mjs` 覆盖 tag fallback、可访问名称与空标签。

Annotation pointer wheel delta 归一化（原 `Lv` 23669-23675）已迁移至
`src/main/browser-page-preload/annotation-wheel-delta.ts`；入口保留滚动副作用，
由 `scripts/test-preload-annotation-wheel-delta.mjs` 覆盖 line/page/pixel 三种 delta mode。

Annotation scroll boundary 方向判定（原 `Vv` 23704-23707）已迁移至
`src/main/browser-page-preload/annotation-scroll-boundary.ts`；入口保留容器滚动副作用，
由 `scripts/test-preload-annotation-scroll-boundary.mjs` 覆盖起点、终点、可滚动与 zero delta。

Annotation overflow 值判定（原 `tc/nc` 4244-4249）已迁移至
`src/main/browser-page-preload/annotation-overflow.ts`；入口的 frame clipping 与 scroll-container
判定改用语义入口，原 helper 已物理删除；由 `scripts/test-preload-annotation-overflow.mjs` 覆盖
scrollable/clipping/visible 三类值。

Annotation theme variant 读取（原 `f_` 22830-22832）已迁移至
`src/main/browser-page-preload/annotation-theme.ts`；入口仅注入 window.matchMedia，
由 `scripts/test-preload-annotation-theme.mjs` 覆盖 dark/light 与缺失 matchMedia。

Annotation viewport size 读取（原 `p_` 22833-22835）已迁移至
`src/main/browser-page-preload/annotation-viewport.ts`；入口仅注入 window 尺寸，
由 `scripts/test-preload-annotation-viewport.mjs` 覆盖正常与零尺寸。

Annotation viewport state 读取（原 `C_` 22902-22913）已迁移至
`src/main/browser-page-preload/annotation-viewport-state.ts`；入口仅注入 window/visualViewport，
由 `scripts/test-preload-annotation-viewport-state.mjs` 覆盖基础、偏移与默认 visual viewport。

Annotation viewport override 合并（原 `g_` 22858-22860）已迁移至
`src/main/browser-page-preload/annotation-viewport-override.ts`；入口保留布局编排，
由 `scripts/test-preload-annotation-viewport-override.mjs` 覆盖 null identity、尺寸覆盖与非变异。

### 增量抽取：annotation text input target

Annotation 文本输入目标的 `HTMLInputElement` 类型白名单与 `HTMLTextAreaElement` 判定（原 `Ju`）
已迁移至 `src/main/browser-page-preload/annotation-input-target.ts`；入口仅保留兼容委托，
由 `scripts/test-preload-annotation-input-target.mjs` 覆盖 6 项行为断言。

### 增量抽取：annotation range selection validation

DOM Range 的文本节点遍历、selection offset 边界、`assignedSlot`/parent fallback 与可见性
判定（原 `Od`，6226-6270）已迁移至
`src/main/browser-page-preload/annotation-range-validation.ts`。入口只注入浏览器 DOM
适配器和既有 `B` 可见性策略，保留 range/intersectsNode 语义；
`scripts/test-preload-annotation-range-validation.mjs` 覆盖多文本节点、不可见父节点和
range 根为文本节点三项行为断言。该边界不包含 React/vendor runtime，也不移动选择状态机
或 DOM 副作用。

### 增量抽取：annotation visibility predicate

批注 selection 使用的 visibility/display/content-visibility/opacity ancestor predicate
已迁移至 `src/main/browser-page-preload/annotation-visibility.ts`；入口仅注入
`getComputedStyle` 与 parent traversal，`scripts/test-preload-annotation-visibility.mjs`
覆盖可见、隐藏祖先和自身 visibility 边界，共 3 项断言。

### 增量抽取：annotation preview rounded geometry

annotation feature preview 的 CSS 圆角解析、半径缩放/约束和 SVG rounded-rect path
组装已迁移至 `src/main/browser-page-preload/annotation-preview-geometry.ts`。入口仅保留
SVG DOM 节点创建与 backdrop 更新副作用，`scripts/test-preload-annotation-preview-geometry.mjs`
覆盖百分比/像素圆角、双值半径、超界缩放和最终 path 语义，共 3 项断言。

### 增量抽取：annotation preview visibility boundaries

annotation feature preview 的 fullscreen、modal、popover 可见性边界选择已迁移至
`src/main/browser-page-preload/annotation-preview-visibility.ts`。入口仅注入既有的
composed-parent、element 与 frame/window 适配器；模块保留跨 shadow root/frame 的 ancestor
判定、top-modal 选择及 popover 矩形遮挡语义，`scripts/test-preload-annotation-preview-visibility.mjs`
覆盖 modal 内外目标与边界过滤，共 3 项断言。

### 增量抽取：annotation preview observer/RAF scheduler

annotation feature preview 的 ResizeObserver/IntersectionObserver candidate queue、RAF 调度和
dispose cleanup 已迁移至 `src/main/browser-page-preload/annotation-preview-scheduler.ts`。入口仍注入
页面元素判定与 frame callback，并保留 MutationObserver、跨 frame 观察和 controls registry wiring；
模块负责候选集合与可见集合的一致性、observer 回调触发 invalidate，以及取消待处理 RAF。
`scripts/test-preload-annotation-preview-scheduler.mjs` 覆盖 candidate 注册、intersection/resize
触发、RAF 执行和 observer cleanup，共 5 项断言。

### 增量抽取：annotation request context validation

open-annotation 的 secure-context/active-editor 门控、serialized Range 重建、目标元素与
viewport 可见性校验已迁移至 `src/main/browser-page-preload/annotation-request-context.ts`。
入口仍负责事件 payload 与页面运行时适配；模块保留 Range 文本一致性、排除元素、frame/owner
document 和 open-tweaks 权限语义。`scripts/test-preload-annotation-request-context.mjs`
覆盖权限矩阵、Range 重建、元素/Range 可见性与边界拒绝，共 8 项断言。

### 增量抽取：annotation design-control preview sync

design-control preview 的目标索引、当前/原始视图值切换、虚拟 target key、跨 frame/page
有效性校验和旧 preview 的 reset 差分已迁移至
`src/main/browser-page-preload/annotation-design-control-sync.ts`。入口 `Rg` 仅注入页面 URL、
frame document、默认 control 值和 `CustomEvent` dispatch 适配器；DOM 事件副作用与 React
component assembly 仍保留在入口边界。`scripts/test-preload-annotation-design-control-sync.mjs`
覆盖初次 preview、幂等同步、original-view 回退、stale/reset、断开 target、URL 失配、virtual
target 和 agent-control 清理，共 8 项断言。

### 增量抽取：annotation open-request IPC lifecycle

`codex:open-annotation` 的 permission/pending request 生命周期已迁移至
`src/main/browser-page-preload/annotation-site-requests.ts`。模块保留同步与异步 permission
结果的竞态保护、subscriber 延迟挂载、Escape/pagehide 清理、BFCache pageshow 恢复，以及
dispose 时的四个 DOM listener 移除；入口仅保留事件 payload/target/range 解析和既有
`Dd` 语义适配。`scripts/test-preload-annotation-site-requests.mjs` 覆盖 listener 注册与
清理、permission resolve/reject、pagehide/keydown 竞态、stale-state 重验证和 subscriber
重放，共 12 项断言。

### 增量抽取：annotation request permission/context policy

`codex:open-annotation` 的 secure-context、agent/editor 状态门控，以及 element/range target
的 owner-document、连接状态、viewport 可见性、range 文本与序列化路径重建已迁移至
`src/main/browser-page-preload/annotation-request-context.ts`。入口仅注入页面 DOM、可见矩形、
range anchor 与既有 selection-validation 适配器；`annotation-site-requests.ts` 继续负责
permission pending、subscriber、pagehide 与 IPC 生命周期。`scripts/test-preload-annotation-request-context.mjs`
覆盖 permission gate、range path 重建/拒绝、element center/offscreen/excluded 以及 range
viewport/text 校验，共 8 项断言。

### 增量抽取：annotation anchor state/payload transformations

批注 anchor 的 element/region/virtual/text 状态构造、live selection 包装、editor payload
投影、状态拆分/合并、元素重解析与 selection 替换已迁移至
`src/main/browser-page-preload/annotation-anchor-state.ts`。入口仅保留页面 DOM 查找、主题/viewport
读取和 anchor refresh 适配；React marker/render 编排仍留在原边界。`scripts/test-preload-annotation-anchor-state.mjs`
覆盖四类 anchor、additional selection、payload element、state merge、live-element fallback
和 primary replacement，共 10 项断言。

### 增量抽取：annotation preload bridge IPC/context boundary

preload 与挂载后的批注 runtime 之间的 bridge 已迁移至
`src/main/browser-page-preload/annotation-preload-bridge.ts`。模块集中负责 host-message
订阅/重放、pending editor/text-selection 缓冲、control target 查询，以及 editor 生命周期
消息到 IPC 的转发；入口继续注入 state、registry 和 request queue，保持原有权限与销毁语义。
`scripts/test-preload-annotation-preload-bridge.mjs` 覆盖缓冲重放、editor 状态转发、request
清理和 capability gate，共 7 项断言。

### 增量抽取：annotation host-message dispatcher

host 到 preload 的批注消息动作（permission、preview、sync、selection、editor queue/close）已迁移至
`src/main/browser-page-preload/annotation-host-message-dispatcher.ts`。dispatcher 只负责动作到
bridge/runtime 回调的协议映射，状态、权限对象与页面生命周期仍由
`annotation-preload-runtime.ts` 持有，避免把副作用错误地提升为全局状态。由
`scripts/test-preload-annotation-host-message-dispatcher.mjs` 覆盖 7 项行为断言，包括 capability
gate、sync payload 和 editor queue 清理。

### 增量抽取：annotation anchor/frame geometry

批注 overlay 使用的 frame/scroll-container clipping、跨 frame element geometry、region anchor
构造、marker viewport point 与缩放后的 box style 已迁移至
`src/main/browser-page-preload/annotation-anchor-geometry.ts`。入口仅保留既有 DOM/frame 依赖的
注入和兼容函数名委托；跨 frame、scroll offset、viewport clamp 与 box style 语义由
`scripts/test-preload-annotation-anchor-geometry.mjs` 覆盖，共 3 项断言。

### 增量抽取：annotation selection control boundary

指针选区控制元素门控（原 `By`）已迁移至
`src/main/browser-page-preload/annotation-selection.ts`。模块只负责沿 DOM 父链识别
`input/button/select/audio/video` 并委托 text-input 判定；入口保留 `By` 兼容包装，
由 `scripts/test-preload-annotation-selection.mjs` 覆盖普通节点、文本输入、原生按钮和
嵌套节点共 4 项断言。

### 增量抽取：annotation page URL identity boundary

批注 anchor、frame 路由与草稿 marker 共用的页面 URL 解析及同页判定已迁移至
`src/main/browser-page-preload/annotation-url.ts`。模块保留 HTTP(S) 的 origin/path/query
比较、file URL 的 pathname/query 比较、hash 忽略和无效/opaque URL 的精确回退；入口只保留
`fd`/`md` 兼容委托。`scripts/test-preload-annotation-url.mjs` 覆盖协议、query、hash、file
路径和 invalid URL 边界，共 8 项断言。

### 增量抽取：annotation mode controller boundary

批注模式 API 的跨世界 listener 安装、可用性门控、使用事件转发与 dispose 清理（原 `$d`
协调器）已迁移至 `src/main/browser-page-preload/annotation-mode-controller.ts`。入口仅保留
`contextBridge.executeInMainWorld`、原有 `ef` controls 注册器和 DOM event 适配；模块测试覆盖
controls 注册失败、main-world listener 安装、事件转发及 dispose 后的 late event，共 5 项断言。

### 增量抽取：annotation pointer selection controller

批注拖拽文本选区的 pointer lifecycle（原 `Ry` 23897-23945）已迁移至
`src/main/browser-page-preload/annotation-pointer-selection.ts`。模块只协调跨 frame
命中、selection highlight、cursor/selection 样式、pointer-id 与 trusted-event 门控，入口
继续注入既有 DOM/frame 适配器和副作用；`scripts/test-preload-annotation-pointer-selection.mjs`
覆盖拖拽开始/移动/结束、selection 回传、highlight 清理及 blocked target，共 11 项断言。

### 增量抽取：annotation preview controller boundary

批注站点预览的替换与销毁生命周期（原 `wy` 23562-23571）已迁移至
`src/main/browser-page-preload/annotation-preview-controller.ts`。模块仅负责当前预览的
单实例 dispose、替换挂载和对象/函数两种 teardown 形态；DOM overlay、observer、RAF
调度与渲染副作用仍由既有 `Ty`/preview layer 负责。`scripts/test-preload-annotation-preview-controller.mjs`
覆盖预览替换、空值清理、显式 dispose 与对象 teardown，共 4 项断言。

### 增量抽取：annotation display selection projection

批注 overlay 的 additional-selection 投影（原 `J_` 22849-22873）已迁移至
`src/main/browser-page-preload/annotation-display-selections.ts`。模块只负责
resolved anchor 的 live rect 选择、可见区域裁剪、class/page 标记、稳定 key 与
selection index；DOM/frame 解析和 geometry 仍由入口注入，避免将 React render assembly
提升到独立模块。`scripts/test-preload-annotation-display-selections.mjs` 覆盖 element、
region、virtual 三类 selection、clip/no-clip、border radius、source index 与 page marker，
共 7 项断言。

### 增量抽取：annotation design styles boundary

设计批注的 computed-style 声明收集、声明合并、direct-text draft、style provenance
投影和 create/edit/design target 匹配已迁移至
`src/main/browser-page-preload/annotation-design-styles.ts`。入口仅保留原 `ls/us/ds/fs/ps/ms`
兼容委托；DOM 文本读取仍由入口提供元素对象，React render 与设计变更副作用未移入该模块。
`scripts/test-preload-annotation-design-styles.mjs` 覆盖样式值归一化、previousValue 保留、
混合文本拒绝、provenance 投影和三种 target mode，共 9 项断言。

Annotation design-editor state projection（原 `sy/cy`）已迁移至
`src/main/browser-page-preload/annotation-design-editor-state.ts`。模块集中负责 design target
的 stable id、anchor/control/declaration/text/provenance/label 投影，以及 virtual target 的
安全回退；入口仍注入 DOM snapshot、control value 和 target-label 读取，React render/hook
assembly 与副作用保持在原边界。`scripts/test-preload-annotation-design-editor-state.mjs`
覆盖 element/virtual target、stable id、text/provenance/label 与 viewport/theme 字段，共 6 项断言。

### 增量抽取：annotation host sync state boundary

批注 host sync 消息对能力关闭、agent 控制清理、preview/request 清理以及 comment-mode
transition 的状态编排已迁移至 `src/main/browser-page-preload/annotation-sync-state.ts`。
入口仅注入既有 feature lifecycle、runtime mount 和状态解析器，仍保留 DOM event dispatch
等副作用；`scripts/test-preload-annotation-sync-state.mjs` 覆盖正常模式切换、能力关闭和
agent 控制清理，共 7 项行为断言。

### 增量抽取：annotation event detail boundary

批注 range/open-request detail 的稳定 payload 组装，以及 CustomEvent detail/own-property
读取已迁移至 `src/main/browser-page-preload/annotation-event-details.ts`。入口的
`annotation-runtime.ts` 仅保留兼容 re-export；该边界不改变事件副作用或 React/UI 编排，
由 `scripts/test-preload-annotation-event-details.mjs` 覆盖 range/open-request 投影、
own-property 防原型污染读取与空 detail 回退，共 6 项断言。

### 增量抽取：annotation metadata tooltip projection

annotation hover metadata tooltip 的 tag、size、color、font 行投影已迁移至
`src/main/browser-page-preload/annotation-metadata-tooltip.ts`；React surface 仅保留
本地化文案、布局与 DOM 渲染，`Nv` 组件通过语义模块消费稳定行模型。由
`scripts/test-preload-annotation-metadata-tooltip.mjs` 覆盖空快照、行顺序、值保留与
存在性判定，共 5 项断言。
