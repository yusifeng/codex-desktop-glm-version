# Renderer 尾部资产审计

最后一轮 renderer 清扫不再把 `CHUNKS - REWRITTEN` 直接解释为待手写源码。
`scripts/renderer-chunk-manifest.mjs` 现在维护两条互斥轨道：

- `REWRITTEN`：已落地语义源码，构建并验证导出面和依赖边。
- `PRESERVED_ASSETS`：经人工核对属于 vendor、生成模型、worker 或纯数据，继续
  使用发布版 transform-only 资产，绝不计入已重写数量。

运行 `node scripts/audit-renderer-tail.mjs` 会检查保留项已登记、原资产存在、理由
合法并且没有与 `REWRITTEN` 重叠，同时打印真正剩余的人工语义化模块。

本轮保留类别覆盖 CodeMirror、Lottie、D3、DOCX、Datadog、PDF.js、KaTeX、
TanStack Form、QR Code、OAuth 客户端、protobuf/文档模型、thumbnail/diff worker、
presentation/workbook/spreadsheet 编辑器和纯 SVG/persona/icon 数据。该结论遵循
`renderer-classification.md` 的“第三方/纯数据直接跳过”和“巨型 vendored 编辑器
复用原资产”原则。
