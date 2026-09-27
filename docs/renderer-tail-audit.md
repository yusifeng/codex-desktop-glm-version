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
