# Handoff（终章）：剩余 goal 的收尾清单

> 本文档是 goal 的 handoff prompt，接替上一版（GUI 优先阶段，已验收完成）。
> 双轨构建、验证流水线、坑纪律**全部继续有效**（压缩收录于第四节，完整
> 历史见 git log 的旧版 handoff）。本文只写增量：还剩什么、按什么顺序、
> 怎么验收。所有路径相对
> `/Users/david/Workspace/ppio_github/codex-desktop-glm-version`。
> 并发约束：最多 5 个 subagent。

---

## 一、使命与当前完成度（2026-09-30 收官后快照）

原始 goal 顺序【bootstrap 808KB → main 5.5MB 按子系统拆 → shared 2.1MB
→ 其余】，核心验收标准不变：每个 REWRITTEN chunk 的构建产物与官方发布版
结构等价（import/require 依赖集合 + 导出符号面，verify 脚本机器验证），
语义源码与 transform-only 双轨并存可构建完整 app。

| 侧 | 状态 | 证据（命令可复跑） |
|---|---|---|
| bootstrap | ✅ 完成 | 全量重写 |
| main（5.5MB） | ✅ 结构性完成 | R1-R12 全区落地、133K 行语义源码、typecheck 0 错误、verify-chunks 11/11。深度打磨为可选项（T6） |
| shared（2.1MB，692 导出） | ⚠️ **剩 49 个已消费未语义化别名**，集中在 process-exec、sql-git-registry、streams | 本文 T1 附实时统计脚本 |
| renderer GUI | ✅ **业务 chunk 0 pending** | verify-renderer 1874/1874；coverage 2247/2247；app-shared 消费 343/343（0 any） |
| 其余独立 chunk | ❌ **6 个未重写**（transform-only） | T2-T5 |

**GUI 完成度的准确回答（接手者必读，防止回头翻 GUI）：**
业务代码层面不差了。三个"深度注意点"是**设计决定或可选项，不是待办**：

1. `INCREMENTAL_HUBS`（12+ 个聚合边界）按**实际消费面**语义化——被消费的
   导出全类型化，hub 内部未消费的压缩导出不语义化。这是登记在
   `scripts/renderer-chunk-manifest.mjs` 的机制，勿扩张。
2. `PRESERVED_ASSETS`（426 个 vendor/generated/data/worker 资产）刻意保留
   原资产，**禁止**给它们伪造业务源码（CodeMirror/Lottie/pdf.js/编辑器/
   locale/lucide/shiki/math-blocks/教学模型生成物等）。
3. renderer 已冻结：**禁止任何"顺手优化/补齐/重构"**——那是已验收工作。
   verify-renderer 数字只应因 renderer 变更而变，正常应恒为 1874/1874。

---

## 二、剩余任务清单（按此顺序执行）

### T1 · shared 剩余分区收尾（49 别名）★ 首选，方法完全成熟

数据源：`docs/shared-export-map.json`（导出名 → 内部符号 + 行号）。
先运行下面的权威脚本拿最新缺口清单。它只解析实际来自
`@chunk/shared` 的 import，避免把其它 chunk 中的 `as` 误计入 shared；
数字以脚本输出为准（本文快照为 49）：

```bash
node scripts/audit-shared-consumption.mjs
```

分区速览（当前快照）：process-exec 20、sql-git-registry 15、streams 14、mcp-2 0、lowlevel-export-shim 0、unlocated 0；schema-primitives 30（zod
builder 链式族——**沿用 `src/main/shared/zod-facade.ts` 既有门面，勿重造**）、
sql-git-registry 22、mcp-rpc 22、streams 17、lowlevel-export-shim 19
（单字母 lodash/runtime shim）、misc 7、tail 6（单字母重导出壳）、
unlocated 5（定位器没找到的，需 grep `src/main/src-DldfpmrL.ts` 内部符号）、
mcp-2 4。

方法闭环：查行号 → 读原文区段 → 语义重写到 `src/main/shared/<语义名>.ts`
→ 兼容导出别名（`export { X as 压缩名 }`）→ `chunk-modules.d.ts` 从
`any` 声明改为 `export { 语义名 as 压缩名 } from "../../shared/<模块>";`
→ 纯逻辑模块写行为自测（20+ 断言，ts⨯ 直接跑）→ typecheck 0 保持 →
按簇一 commit。范式参考：`src/main/shared/sandbox-permissions.ts`、
`automation-settings.ts`（带自测的完整闭环样板）。

### T2 · 独立 chunk：git-worker（`src/main/worker.ts`，90,836 行）★ 最大件

- manifest 条目 `"git-worker": "worker.js"`，CJS worker。先确认加载形态
  （worker_threads / hidden window）再定拆分粒度。
- **先做 vendored 识别**（版本号/npm 包名/UA 字符串三证据）：90K 行里
  预计有大量 libgit/依赖库。能锁定的保留原版（可给 `scripts/chunk-manifest.mjs`
  加 PRESERVED Map，模仿 renderer 的登记模式并写理由），只语义化业务部分
  （git 操作的 RPC 面、session 生命周期）。
- 重写后加入 CHUNKS + REWRITTEN，`verify-chunks.mjs` 会自动比对
  requires/exports（worker 是 CJS，比对逻辑已支持）。
- 参考 `docs/main-rewrite-contract.md` 的 main 侧双轨契约。

### T3 · browser-page-preload（`src/main/browser-page-preload.ts`，30,217 行）

browser page 侧的沙箱 preload 桥。已有先例：`preload.js`/`sandbox-preload.js`
已在 main REWRITTEN 中，验证方式相同。与 `src/main/main-app/browser-use/`
（Iab API、session registry 等）语义强相关，动笔前先读该目录。

### T4 · 两个 mini shared（各 ~500 行，半天量级）

`src-BSoROW9v.ts`（worker-shared，597 行）、`src-C9YLnbgY.ts`
（main-shared，525 行）。独立小 chunk，各自登记 CHUNKS/REWRITTEN。

### T5 · css-selector 与 file-type 双核（先审计再动手）

- `css-selector`（`src/main/dist-wQAv1pJP.ts`）：**注意它不纯是 vendor**——
  `src/main/shared/rpc-core.ts` 的 RpcTarget 基类就来自这个 chunk
  （`E ? E.RpcTarget : class{}`）。它是混装的 dist 运行时（RPC 基座 +
  可能的 selector 逻辑）：先逐段审计，RPC 基座部分语义化接入 rpc-core，
  vendor 部分登记保留。
- `file-type-main`/`file-type-worker`（core-B-w7xKIn / core-DlTZhmo0，各
  ~2K 行）：大概率是 file-type npm 包（magic bytes 表特征）——判定 vendored
  则保留登记，不伪造源码。

### T6 · main 深度打磨（可选，最后做）

main 结构性完成 ≠ 逐行语义化（133K 语义行 vs 177K 原版行，gap 主要是
原版内嵌 vendored 与低频路径）。可选动作：对照 `docs/main-analysis-r*.md`
的区域清单做一次"main-C-Mhak1n.ts 未消费区域审计"，列出仍为原样的大段，
逐段判定 vendored 保留 / 补语义化，报告落盘 `docs/`。
**这是唯一允许回头碰 main 的入口**；做完即可宣布整个 goal 收官。

---

## 三、验收命令与完成判据

每批次收口用既有工具（约 16 秒）：

```bash
npm run verify-renderer-cluster -- --test scripts/test-<cluster>.mjs \
  --module <module>:<assertions>   # 批次门禁（tsc 基线 --tsc-baseline 0）
node scripts/verify-renderer.mjs   # 应恒为 1874/1874
node scripts/verify-chunks.mjs     # 随 main REWRITTEN 增长全绿
npm run typecheck                  # 当前 0 错误，任何新增必须修复
node scripts/audit-app-shared-consumption.mjs  # renderer 侧保持 343/343
```

**整个 goal 的 Definition of Done：**

1. T1 完成：第一节的统计脚本输出 TOTAL = 0（已消费别名 0 个 any 承接）。
2. T2-T5 完成：`scripts/chunk-manifest.mjs` 的每个 CHUNKS 条目要么在
   REWRITTEN、要么在带理由的保留登记中，无未分类项。
3. 全部验收命令绿。
4. （可选）T6 审计报告落盘。

达成 1-3 即原始 goal【bootstrap → main → shared → 其余】收官。

---

## 四、方法论与纪律（浓缩，旧版 handoff 全文见 git 历史）

**双轨构建**：REWRITTEN chunk 由 esbuild 打包、输出文件名与发布版逐字符
一致；其余 chunk transform-only 逐字节保真；两轨任意比例混合可构建完整
app。renderer 靠 `@rchunk/*` 缝合，main 靠 `@chunk/*`。

**批次流程（2026-09-27 起）**：一个业务批次一 commit（10-25 模块），批次内
只跑受影响模块的定向测试，批次收口统一 `verify-renderer-cluster` 全门禁。
不为凑数字硬塞无关模块，但同流程/共享 mock 的模块优先合并。

**坑（全部真实事故）**：
1. shell cwd 每条命令后重置——一律前缀
   `cd /Users/david/Workspace/ppio_github/codex-desktop-glm-version && `。
2. Bash/Write 工具做 HTML 实体解码：`&` 实体字面量会被写坏，用
   `chr(38)` 拼接或 python 修复脚本绕过。
3. verify 失败九成是导出别名/依赖集合没对齐——脚本批量 diff，别目测。
4. 不"顺手重构"原版行为：语义与原版逐例一致，包括看起来怪的实现；
   自测失败先怀疑断言再怀疑实现。
5. 禁止改 `../chatgpt-desktop-src` 与 `.reference/app-original`（只读参考）。
6. typecheck 当前基线 0；只减不增，新增必须修复。
7. commit 中文，写清符号映射、diff 核实结论、自测断言数。

---

## 五、快速开始（第一条指令）

```bash
cd /Users/david/Workspace/ppio_github/codex-desktop-glm-version && \
node scripts/verify-renderer.mjs && node scripts/verify-chunks.mjs && \
npm run typecheck && git status --short
```

健康值：1874/1874、11/11（T2-T5 推进中数字增长）、typecheck 0、工作树
干净。然后从 **T1（shared 九小分区）** 开始——跑第一节内嵌统计脚本拿
实时清单，按 process-exec → schema-primitives → sql-git-registry 的顺序
逐簇清零。
