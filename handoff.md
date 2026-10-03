# Handoff（终局版）：从「结构等价」到「完全反编译 + 可读工程」

> 本文档是最终 handoff。前一阶段（消费驱动的语义化）已按 DoD 验收完成：
> 全部门禁绿、被消费的导出 100% 语义化、所有 chunk 已分类。
> **本阶段把验收标准从「消费面语义化」升级为「完全反编译」**：仓库里不再
> 存在未分类的压缩业务代码，且工程本身达到「新人可读、可导航、可一键
> 验证」的状态。本文做完，整个项目即为真正的完全反编译。
> 双轨构建、批次流程、坑纪律沿用旧版（git 历史可查），并发上限 5 subagent。
> 所有路径相对 `/Users/david/Workspace/ppio_github/codex-desktop-glm-version`。

## 当前进度快照（2026-10-03）

本轮已完成 worker/preload/main 逐段审计、shared 692 导出全量分类、renderer
三大 hub 内部审计、tsconfig 排除、测试索引、README 更新，以及 smoke/e2e
验证说明。worker 的 main-RPC 边界已提取为 `src/main/worker/rpc-client.ts`
并接回入口，静态门禁全绿；smoke 已实际验证主窗口加载、renderer 致命错误
过滤和 app-server 初始化握手，且对慢启动增加了 15 秒宽限轮询。

后续增量已实际接回：worker 入口消息分发与 Git 错误分类、preload WebMCP
协议、main delegation/account 与 URL trust helpers、WSL 输出解析，均有独立
回归断言；worker 的 remote host SSH 展示名/identity 解析也已抽取为
`src/main/worker/remote-host-config.ts`，并由 6 项行为断言覆盖；preload 的
deployment channel/policy 配置已抽取为 `src/main/browser-page-preload/deployment-channel.ts`，
由 8 项行为断言覆盖；main 的 thread metadata emoji 校验和不可变更新已抽取为
`src/main/main-app/thread-metadata.ts`，由 6 项行为断言覆盖；worker 的 Git
命令统计/变更来源/cache key/exit-code/untracked cache outcome 纯函数已抽取为
`src/main/worker/git-observability.ts`，由 10 项行为断言覆盖；worker 的 Git
query key、host id、路径归一化和 UTF-8 字节长度已抽取为
`src/main/worker/git-query-utils.ts`，并补充 query host 匹配和 watched path overlap，
由 16 项行为断言覆盖，并补充可缓存 Git 命令判定、fsmonitor cache key、配置
值解析、fsmonitor daemon feature 判定、平台支持判定和请求取消策略判定。
preload 的 Chrome/Edge 扩展发行配置已抽取为
`src/main/browser-page-preload/extension-distribution.ts`，由 5 项行为断言覆盖；
preload 的 WebMCP registry shim 已抽取为
`src/main/browser-page-preload/webmcp-registry.ts`，由 7 项行为断言覆盖；main
窗口外观策略已抽取为 `src/main/main-app/window-appearance.ts`，并包含 traffic-light
geometry/title-bar overlay，由 12 项行为断言覆盖；preload annotation surface
协议 schema 已抽取为 `src/main/browser-page-preload/annotation-protocol.ts`，由 6 项
行为断言覆盖；annotation hit payload 安全清洗已抽取为
`src/main/browser-page-preload/annotation-runtime.ts`，由 14 项行为断言覆盖。

**尚未宣称终局完成**：worker/preload/main/hub 中仍有已审计但尚未逐段物理
迁出的业务区段；它们在审计表中有明确行号和保留理由，后续语义化必须继续
遵守双轨构建与导出契约。B2 已将主进程原始对照 chunk 移至
`.reference/originals/main/`，并由构建脚本按历史输出文件名重新编译；
`src/webview/assets/` 仍通过 tsconfig 显式排除。

---

## 一、为什么还没「完全」反编译（2026-10-03 审计结论）

前一阶段的方法论是**消费驱动**：只语义化被重写代码实际 import 的导出。
这保证了结构等价与门禁，但留下了五处「整体保留、未逐段审计」的压缩原版，
以及五处工程可读性缺口。**它们不是待办清单的尾巴，而是「完全反编译」
与「结构等价完成」之间的全部差距。**

### A. 仍是压缩原版的业务代码（5 处）

| # | 位置 | 体量 | 现状 | 问题 |
|---|---|---|---|---|
| A1 | `.reference/originals/main/worker.ts`（git-worker） | **90,836 行** | 整体 PRESERVED，已完成逐段审计并开始分批抽取 | Git RPC 面、session 生命周期仍有大量业务区段待迁移 |
| A2 | `.reference/originals/main/browser-page-preload.ts` | **30,217 行** | 整体 PRESERVED，已完成逐段审计并抽取 WebMCP | annotation/design runtime 等业务区段仍待迁移 |
| A3 | main chunk 未消费区域 | 原版 177K 行 vs 语义 133K | 已完成全量覆盖审计 | 仍需继续物理迁移 business-preserved 区段 |
| A4 | shared 未消费导出 | **330 个**（692 总量 − 362 已消费） | 未分类 | 其中 vendor（lodash shim 等）与真实业务混杂；A1/A2 语义化后消费面会增长，联动出现新缺口 |
| A5 | renderer 三大 hub 内部 | app-shared 4.8MB / app-initial 14.3MB / app-primary 3.1MB | 仅 343 个被消费导出类型化 | hub 内部未消费的应用逻辑仍是压缩（app-initial 里有 i18n 核心等真实业务，也有大量 micromark/zod/valdi 胶水） |

### B. 工程可读性缺口（5 处）

| # | 问题 | 现状 |
|---|---|---|
| B1 | tsconfig 吞 586 万行 transform-only 文件 | `include: src/**/*.ts` 未排除 `src/webview/assets/`，typecheck 约 44 秒 |
| B2 | 原版对照文件已迁出 | 10 个主进程原始 chunk 位于 `.reference/originals/main/`，`scripts/build.mjs` 映射回历史输出名并已通过 build/verify/smoke |
| B3 | README 过时 | **已完成**：README 记录 11 个主进程重写 chunk、1874 个 renderer chunks、双轨构建和验证入口 |
| B4 | 测试脚本无索引 | **已完成**：`scripts/test-index.md` 当前索引 567 个 `scripts/test-*.mjs` 脚本 |
| B5 | 端到端验证深度浅 | **已完成**：smoke 验证主窗口 HTML 加载、app-server 握手，并过滤 renderer 致命错误；关键日志采用宽限轮询 |

---

## 二、任务清单（按序执行；每项完成后更新本表状态）

### T1 · git-worker 逐段审计与业务语义化（A1，最大件）★

1. **审计先行**：对 `src/main/worker.ts` 做逐段扫描，产出
   `docs/git-worker-audit.md`：每一段标注 `business`（git 操作 RPC 面、
   session/生命周期、协议处理）或 `vendored`（libgit 绑定、HTTP/stream
   库、node 依赖），附行号区间与判定证据（包名/版本号/UA 特征）。
2. **业务段语义化**：按既有闭环写入 `src/main/worker/`（或按子系统拆
   `src/main/worker/<子系统>/`），兼容导出对齐，登记 REWRITTEN。
   verify-chunks 已支持 CJS requires/exports 比对。
3. **vendored 段**：保留原版并逐段登记理由（扩展 chunk-manifest 的
   PRESERVED Map 为分段理由，或新建 `docs/` 审计文档承载）。
4. **worker_threads 启动协议**确实不可拆的部分（入口薄层）保留原样，
   在审计文档写明"保留边界"的精确行号。
5. 完成后重跑 `node scripts/audit-shared-consumption.mjs`——新消费的
   shared 导出会出现缺口，转入 T3 清零。

### T2 · browser-page-preload 审计与业务语义化（A2）

同 T1 方法：审计 `docs/preload-audit.md` → contextBridge IPC 协议、
schema、消息处理语义化到 `src/main/browser-page-preload/`；内嵌
runtime/vendor 保留登记。参考已重写的 `preload/`、`sandbox-preload/`
两个先例的验证方式。

### T3 · shared 未消费导出全量分类（A4，与 T1/T2 联动）

1. 对 330 个未消费导出逐一判定：`business`（语义化到
   `src/main/shared/<模块>.ts`，方法同前）或 `vendor/generated`
   （登记保留理由）。判定依据：导出符号的原文实现是否含业务语义
   （协议/状态/配置）vs 纯库转发（lodash/ms/debug shim）。
2. T1/T2 语义化产生的新消费缺口随做随清；本任务完成判据是
   **692 个导出全部有归属**：语义化声明或保留登记，二选一，无未分类。
3. 产出 `docs/shared-full-classification.md`（692 行清单 + 归属 + 证据）。

### T4 · main chunk 未消费区域审计（A3，原可选 T6 转正）

1. 对照 `docs/main-analysis-r1..r12.md` 的区域清单，对
   `src/main/main-C-Mhak1n.ts` 做逐段覆盖审计：每段标注已被哪个语义
   模块覆盖 / 仍为原样 / 属 vendored。
2. 仍为原样的**业务段**补语义化（预计很少——R1-R12 已全区落地，
   gap 应主要是 vendored 与低频路径，但必须以审计报告证实，不能沿用断言）。
3. 产出 `docs/main-coverage-audit.md`，含"原版行号区间 → 语义模块/
   保留理由"映射表。

### T5 · renderer hub 内部审计与语义化（A5）

1. **app-shared（4.8MB）**：对未被消费的导出做实现级审计。产出
   `docs/app-shared-internal-audit.md`：业务逻辑（store/query/UI 基础
   组件）语义化进 `src/renderer/app-shared/`（已有 runtime 六模块骨架，
   按分区扩展）；vendor/胶水登记。**注意**：语义化后
   `audit-app-shared-consumption.mjs` 的口径要从"消费驱动"升级为
   "全量分类"，保持 343/343 不回退。
2. **app-initial（14.3MB）**：先做构成审计（参照
   `docs/renderer-classification.md` 第二节：2,284 个引用中 683 lucide、
   65 locale、219 shiki…真正的 app 逻辑约 654 个引用/18.8MB）。对其中
   **未被任何已重写 chunk 消费的 app 逻辑**（如 i18n 核心
   `i18n-147d032388be`、view-state-persistence）逐个语义化；聚合胶水
   （micromark/zod/valdi）登记保留。
3. **app-primary（3.1MB）**：同法审计。
4. **红线不变**：PRESERVED_ASSETS 的 426 个资产禁止伪造源码；
   INCREMENTAL_HUBS 机制在本任务中被"全量分类"取代——hub 从
   "按消费面"升级为"按审计分类"，登记集同步更新。
5. verify-renderer 全程保持绿；hub 语义化走既有 chunk 闭环。

### T6 · 工程可读性（B1-B4）

1. **tsconfig 瘦身**：`"exclude": ["src/webview/assets"]`（transform-only
   不参与类型检查）。排除后 typecheck 基线应保持 0；若出现新错误，
   说明有语义源码偷偷依赖了原版类型——修复依赖而不是恢复 include。
2. **原版对照迁出**：把 `src/main/src-DldfpmrL.ts`、`main-C-Mhak1n.ts`、
   `worker.ts`、`browser-page-preload.ts`、`core-*.ts`、`dist-*.ts`、
   `src-BSoROW9v.ts`、`src-C9YLnbgY.ts` 迁至 `.reference/originals/`
   （或加 tsconfig exclude + 构建脚本同步改路径）。verify 脚本对照
   `../chatgpt-desktop-src` 的逻辑不受影响。**迁移后 build/verify 全套
   必须复跑确认。**
3. **README 重写**：反映真实状态（11+1874 REWRITTEN、双轨机制、
   目录导览、验证命令、架构图一页：主进程模型/renderer 入口链/
   chunk 拓扑）。读者定位：第一次打开仓库的工程师，10 分钟内知道
   "这是什么、怎么构建、去哪里改"。
4. **测试索引**：`scripts/test-*.mjs` 567 个脚本建 `scripts/test-index.md`
   （或 npm script `test:all` 串行 runner + 按簇分组清单），并标注
   哪些是历史一次性脚本、哪些是长期回归套件。

### T7 · 端到端验证升级（B5）

1. `scripts/smoke-test.sh` 升级：pack 后启动，除"不崩"外至少验证：
   主窗口 HTML 加载（webContents 日志/标题断言）、renderer 无致命
   console error、一条核心 RPC 往返（如 settings read）。
2. 产出 `docs/e2e-verification.md` 记录验证步骤与结果快照。

---

## 三、终局 Definition of Done（全部达成 = 完全反编译）

1. **A1-A5 清零**：五处压缩原版全部完成逐段审计，审计文档落盘
   （git-worker/preload/main 覆盖/shared 全量分类/hub 内部），
   业务段语义化、vendor 段带证据登记，**仓库内不存在无归属的
   压缩业务代码**。
2. **shared 692 导出全量分类**：语义化或保留登记，二选一，0 未分类。
3. **B1-B5 全部完成**：tsconfig 瘦身生效、原版对照迁出 src/、
   README 反映真实状态、测试有索引、端到端验证升级并通过。
4. **全部门禁绿**：verify-renderer、verify-chunks、typecheck 0、
   audit-shared-consumption TOTAL 0、audit-app-shared-consumption
   （口径升级后）无缺口、smoke-test 通过。
5. handoff.md 本身更新为「项目完成」终态快照。

达成以上即宣布：**整个项目完全反编译——语义源码 + 可读工程结构**。

---

## 四、方法论与坑纪律（沿用，全文见 git 历史 handoff）

- 双轨构建 / chunk 闭环七步 / 批次流程（`verify-renderer-cluster`）不变。
- 坑：cwd 每条命令重置（一律 `cd .../codex-desktop-glm-version && `）；
  Bash/Write 的 HTML 实体解码（用 chr(38) 拼接绕过）；verify 失败先查
  导出别名/依赖集合；不重构原版行为；禁改 `../chatgpt-desktop-src`；
  typecheck 基线 0 只减不增；commit 中文带符号映射与自测数。
- **本阶段新增纪律**：审计文档是第一产出——先有逐段判定与证据，
  再动手语义化；「保留」必须给到行号区间级理由，不接受整文件一句话。

## 五、快速开始

```bash
cd /Users/david/Workspace/ppio_github/codex-desktop-glm-version && \
node scripts/verify-renderer.mjs && node scripts/verify-chunks.mjs && \
npm run typecheck && node scripts/audit-shared-consumption.mjs
```

健康值：1874/1874、11/11、typecheck 0、TOTAL 0。后续继续处理审计表中
标记为 `business-preserved` 的区段；不得把审计文档或 preserved 登记误当成
业务语义化完成。
