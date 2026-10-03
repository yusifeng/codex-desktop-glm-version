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

Annotation surface channel、feature 列表、role/id/rect/hit/response schemas
（原 6,432-6,508 行）已迁移至 `src/main/browser-page-preload/annotation-protocol.ts`。
该模块通过入口现有 schema factory 注入，原 `qd/Wd/Jd/Yd/Xd` 绑定接回；
`scripts/test-preload-annotation-protocol.mjs` 覆盖 channel、限制和 response 类型。

Annotation hit payload 的安全对象克隆、rect/role/id 校验、metadata 限制和序列化
（原 `Qd` 内部 6,783-6,862 行）已迁移至
`src/main/browser-page-preload/annotation-runtime.ts`，入口 `re` 通过 helper 接回，响应 detail
payload 也由同一模块组装；`scripts/test-preload-annotation-runtime.mjs` 覆盖恶意对象、几何边界、
metadata 过滤和 response JSON 形状，共 8 项行为断言。

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
| 7260-7553 | `business` | annotation controls registry：`codex:register-annotation-controls`、update/dispose channel，控制项 schema、DOM MutationObserver、跨 frame target 跟踪。证据：7260-7272 常量/schema，7273-7529 `Cf` registry，7532-7551 pending editor message reducer。 | 与主进程 `browser-sidebar-runtime-*` 消息协议成对迁移。 |
| 7554-19016 | `vendor/generated` | Vite preload error wrapper（7554-7563）后为 React 19.2.7 + React DOM reconciler/runtime。证据：7565 起 `Symbol.for("react.*")`；7983、8141、18959-18973 明确版本 `19.2.7` 和 `rendererPackageName: react-dom`；19003-19015 是 React devtools hook。 | 整段保留；React reconciler 不能伪造业务源码。 |
| 19017-21896 | `vendor/generated` | TypeScript helpers、memoize、FormatJS/React Intl runtime。证据：19017 `__extends`/object spread helper；20844 `[formatjs Error`；20977、21106、21468、21649-21867 的 FormatJS API/locale fallback 文本。 | 保留 vendor；业务只依赖其公开 formatter。 |
| 21897-22290 | `vendor/generated` | React Intl 组件/provider 和 react-is compatibility layer。证据：21897-21903 React Intl assertion；21940 起 `Symbol.for("react.*")` type predicates；22266-22282 `IntlProvider`。 | 保留 vendor/runtime。 |
| 22291-26794 | `business` | 浏览器批注/设计 UI runtime：MutationObserver 监控 annotation containers/shadow roots、selection/scroll/viewport、draft marker 和 React UI component。证据：22291-22334 DOM observer；22351-22455 design control sync/reset；23900-23955 marker/metadata UI；23961-24007 scroll routing；24525-24667 animation/controls observer；26700-26710 overlay root。 | 业务段应迁入 `src/main/browser-page-preload/`，并复用已审计 DOM/schema helper。 |
| 26795-26881 | `business` | frame/anchor resolution、overlay styles 和 browser comment runtime mounting prerequisites；使用 `requestAnimationFrame`、`MutationObserver`、document style attributes。 | 与 22291-26794 同一业务闭环。 |
| 26882-27185 | `business` | Electron IPC 生命周期和 context state：`Bb` 注册 `ipcRenderer.on/sendSync/send/invoke`，`Vb` 清理，`Hb` lazy-mount，`Ub` host message subscription，`Wb` message reducer，`Gb` permission request；drag/mouse navigation 在 27147-27185。 | 这是 A2 的核心协议段，必须逐消息迁移并保留 pagehide cleanup。 |
| 27187-27294 | `business` | 浏览器扩展发行配置（Chrome/Edge dev/internal/prod、extension IDs、store URLs）。 | 配置数据可迁移为 typed constants；不得归类为通用 vendor。 |
| 27295-27470 | `business` | WebMCP registry shim：tool name/description/schema 校验、AbortSignal 生命周期、JSON-serializable execute/getTools/registerTool API。证据：27295-27440 registry；27442-27469 secure-context/name/result validation。 | 与 30084-30217 schema/IPC bridge 一起迁移。 |
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
3. 26912-27185 与 30132-30217 不适合先做局部 identity wrapper：它们依赖
   状态机、listener cleanup 和 contextBridge 隔离世界，必须在同一迁移批次中
   保持 channel 字符串、消息 allowlist、pagehide 行为和启动顺序。
4. 本报告没有证明 vendor 以外的业务段已经语义化；因此本报告不能作为
   `browser-page-preload` REWRITTEN 的证据，只能作为 A2 审计第一阶段交付物。

## 可复核命令

```bash
wc -l src/main/browser-page-preload.ts
rg -n 'contextBridge|ipcRenderer|Zod|react-dom|formatjs|uuidjs|WebMCP' src/main/browser-page-preload.ts
nl -ba src/main/browser-page-preload.ts | sed -n '26882,27217p'
nl -ba src/main/browser-page-preload.ts | sed -n '30084,30217p'
```
