# app-primary 内部审计记录

本记录先登记一个可复核的、未被语义源码消费的业务辅助导出，避免把
“未消费”误报成已经迁移。

| 原版位置 | 导出别名 | 实现 | 消费证据 | 分类/处置 |
|---|---|---|---|---|
| `src/webview/assets/app-primary-d66705000d76.ts:9002-9004` | `vm` | `vAe(value) { return value?.supported !== false; }`，对 capability 对象执行默认可用判断 | `rg -n "vAe\\(" src/webview/assets/app-primary-d66705000d76.ts` 仅命中定义；语义源码没有 `@rchunk/app-primary` 的 `vm` 命名消费 | `business-helper / semantic`；已迁移为 `src/renderer/capability-default-availability/index.ts`，原 hub 导出暂保留以维持结构等价。 |

复核命令：

```sh
rg -n "vAe\\(" src/webview/assets/app-primary-d66705000d76.ts
node scripts/audit-renderer-hub-classification.mjs --list
```

截至本记录，审计结果为 `app-primary: 3/914 consumed`；`vm` 仍位于
`unconsumed` 集合中，但其实现已有语义源码归属，由 5 项行为断言覆盖。

本轮进一步抽出 app-primary `I7`（公开别名 `Rf`）的纯预填插件 mention helper，
实现落在 `src/renderer/app-primary/runtime/create-prefilled-plugin-prompt.ts`，
真实 consumer `computer-history-suggestion-prompt` 已切换语义导入；`Bf` 初始化器
仍保留在 hub 以维持预填 prompt runtime 的初始化顺序。测试
`scripts/test-app-primary-create-prefilled-plugin-prompt.mjs` 覆盖 3 项契约。
