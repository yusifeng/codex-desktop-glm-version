# Handoff：ChatGPT/Codex 桌面版（v26.917.71314）macOS 客户端源码还原

> 本文档是交接 prompt，也是 goal 说明。请通读全文再动手；所有「必须/禁止」
> 都是前一轮工作中真实踩过的坑。

---

## 一、使命（Objective）

把 macOS `ChatGPT.app`（Codex 桌面版，Electron + React 19）从解包 ASAR 的
编译产物**还原为可迭代的真实源码**——语义化命名 + 真实模块结构，而不是
"格式化过的 minified 代码"。

**核心验收标准（不可妥协）：** 每个"已重写" chunk 的构建产物与官方发布版
**结构等价**——import 依赖集合一致 + ESM 导出符号面一致（由 verify 脚本
机器验证）。语义源码与逐字节兼容的双轨并存，任意比例混合可构建出完整 app。

**优先级（用户明确指定）：GUI 优先（renderer 网页界面部分）**。即：
主窗口 HTML 界面（消息流、composer、设置页、侧边栏、内置浏览器等）
> 主进程逻辑（main）> 共享库（shared）> 其余 chunk。
main 和 shared 的"已消费 API"层已基本完成（见下），接下来的主战场是 renderer。

---

## 二、两个仓库与目录约定

- **工作仓库**：`/Users/david/Workspace/ppio_github/codex-desktop-glm-version`
  （git 管理，main 分支，124+ commits，工作树保持干净）
- **只读参考**：`/Users/david/Workspace/ppio_github/chatgpt-desktop-src`
  ——未修改的 asar 解包目录（verify 脚本默认从这里取"官方原始产物"）
  **绝对不要改动这个目录**。
- 参考仓库（只读，价值有限）：`/tmp/codex-refs/decode-codex/restored/`
  可用作部分模块边界的地图（如 conversations/composer 的组件划分思路）；
  `codex-analysis` 已确认无 renderer 内容，可忽略。

关键路径：
| 路径 | 内容 |
|---|---|
| `src/main/` | 主进程语义源码（bootstrap/main-app/shared…） |
| `src/main/src-DldfpmrL.ts` | shared chunk（692 导出）的格式化原版（**只读对照**，勿改） |
| `src/main/main-C-Mhak1n.ts` | main chunk 的格式化原版（同上） |
| `src/renderer/<语义名>/` | 已重写 renderer chunk 的语义源码 |
| `src/webview/assets/` | 其余 renderer chunk 的"原版格式化"形态（transform-only） |
| `src/main/types/chunk-modules.d.ts` | 未重写 main/shared 导出的 TS 声明（压缩别名 → any/语义类型） |
| `src/renderer/types/rchunk-modules.d.ts` | 未重写 renderer chunk 的 `@rchunk/*` 声明 |
| `scripts/` | 构建与验证流水线（见第四节） |
| `docs/` | 分析文档与导出地图（见第五节） |

---

## 三、当前状态（截至交接时）

### 2026-09-29 当前状态（优先以本节为准）

交接后的 renderer 主线已经完成 composer、sidebar 和当前登记清单的大批重写，
但尚未完成全量 app-code：

- `REWRITTEN`：984 个语义 chunk；`verify-renderer` 为 984/984。
- `PRESERVED_ASSETS`：50 个经审计的 vendor/generated/data/worker 资产，继续
  使用 transform-only 轨道，不伪造业务源码。
- `INCREMENTAL_HUBS`：11 个聚合边界。`app-shared/app-initial/app-primary` 按
  实际消费面类型化；构建器合并出的 Popcorn、imported-setup、checkout hub
  由消费审计锁定，禁止无声明的压缩导出扩张。
- `node scripts/audit-renderer-tail.mjs` 的 0 pending **只表示当前 `CHUNKS` 登记集
  内部无悬空项**，不能当成全量 renderer 完成证明。
- 全量 `docs/renderer-app-chunks.json` 有 2250 个 app-code 文件；必须运行
  `node scripts/audit-renderer-app-coverage.mjs` 查看真实覆盖与剩余数量。当前为
  983/2250 tracked、1267 pending；composer 47/47、sidebar 12/12、terminal 6/6
  已覆盖，browser 17/19、settings 47/70。
- `node scripts/audit-app-shared-consumption.mjs`：326 个实际消费导出均有语义
  声明，0 missing、0 any、0 direct namespace use。
- main 结构验证 11/11；TypeScript 错误基线已经从 139 降至 73。

2026-09-29 已完成 terminal/browser 运行时批次：terminal panel bootstrap、终端
thumbnail/background thumbnail、ASCII canvas/engine、browser voice availability、
site actions state、扩展连接状态说明和 browser settings visibility。专项行为测试
34/34；`mark-session-create` 按实际消费的 `dt/ft/n/r/t` 登记为增量 hub，未复制
其余未消费 voice 聚合导出。

2026-09-29 已继续完成 terminal panel 与 terminal tab，覆盖会话创建/注册、键盘
控制序列、粘贴、云端环境状态、本地 workspace root 切换和 shell 感知的 `cd`
命令。专项行为测试 29/29；renderer 全量门禁 981/981、main 11/11、tsc 73。
`xterm-window-zoom` 按真实副作用消费登记为第 11 个增量 hub，terminal 全量覆盖
达到 6/6。

2026-09-29 已完成 browser address shortcut，语义化浏览器标签 mention 的挂载、
失焦消退、宿主指针事件、metadata 更新与 overlay 状态传递。专项行为测试 15/15；
renderer 全量门禁 982/982，browser 覆盖达到 15/19。

2026-09-29 已完成 site edit route，恢复站点编辑入口对可复用 ChatGPT/Codex
会话的探测、恢复与导航，并在不可复用时携带预填 prompt 回退首页；有效站点上下文
还会重新打开 live URL。专项行为测试 16/16；renderer 全量门禁 983/983，browser
覆盖达到 16/19。

2026-09-29 已完成 site preview，恢复预览 iframe 生命周期、可信站点来源校验、
annotation 消息与捕获预算、导航/刷新/标注/分享/关闭控件，以及 loading/error
状态。专项行为测试 20/20；renderer 全量门禁 984/984，browser 覆盖达到 17/19。

因此，下面“27 个 chunk / composer 与 app-shared 待推进”等数字是初始交接快照，
但“继续处理全量应用代码”的任务仍然有效。优先从全量覆盖审计中的 settings、
pages-routes、browser、settings 等真实缺口继续；增量 hub 只在出现真实消费者时拆出
语义 API，不为未消费导出制造占位源码。完整依据见
`docs/renderer-tail-audit.md`。

### 已完成

**Bootstrap + Main（主进程）：** 169 个 .ts 文件。bootstrap chunk 全量重写；
main chunk 按区域 R1-R12 全部落地（fetch-handler 128 RPC、browser-use 五件套、
window-context、dictation、菜单/启动序列等），文档
`docs/main-analysis-r1..r12.md` + `docs/main-r8-r12-audit.md`。

**Shared chunk（692 导出）：** 26 个语义模块落地于 `src/main/shared/`
（keymap-menus/agent-instructions/chunked-message/telemetry/structured-generation/
sandbox-permissions/automation-settings/app-constants/app-server-version/
browser-context/browser-tab-mentions/http-headers/app-config/host-config/
wsl-paths/…），**201 个压缩别名已语义化**。两大区（settings-threads 226、
hosts-wsl-plugins 176）的"被消费别名"已 100% 语义化；剩余小分区
（schema-primitives 36 / lowlevel-shim 41 / sql-git-registry 37 / mcp-rpc 34 /
process-exec 30 / streams 21 等，合计约 151 个已消费别名）待做，
方法论完全同前（用 `docs/shared-export-map.json` 定位 → 逐符号核实导出目标
→ 写语义模块 → d.ts 转发）。

**Renderer（GUI，主战场）：27 个 chunk 已重写并通过验证**，
`node scripts/verify-renderer.mjs` → `27/27`：

- 会话核心链：`local-conversation-thread`(561KB) / `local-conversation-turn`
  (146KB) / `conversation-blocks` / `conversation-markdown` /
  `virtualized-turn-list` / `thread-virtualizer` / `user-message` /
  `agent-activity-*` / `turn-preview-body-items` / `local-conversation-page`
- 设置页六个：general/security/remote-connections/codex-micro/
  personalization/settings-plugin-selection + review-preferences-model +
  settings-search-documents(559KB 纯数据，生成器提取)
- 基础设施：rpc / thread-scroll-controller / scroll-to-match / timestamps /
  assert-never / split-items / detachedWindow + detached-entry（第二 HTML 入口）
- 运行时六模块（`src/renderer/app-shared/runtime/`）：message-bridge
  （VS Code webview 风格分块协议 `codex-host-chunked-message-v1`）/
  routes（84 路由 + codex:// deep-link）/ settings-schema（69 项）/
  theme / persisted-atom / atom-signal（Maitai）
- 图标生成器：`scripts/generate-icons.mjs`（568 个 icon 模块）

**质量门基线（交接时）：**
- `npx tsc --noEmit` → 139 个错误，**全部是预期类别**（TS2307/2305/2304，
  即"未重写 chunk 的声明缺失"），这是正常状态，不是回归。
  新增任何非预期错误都必须修复。
- `node scripts/verify-renderer.mjs` → 27/27
- `node scripts/verify-chunks.mjs` → 11/11（main 侧已重写 chunk）

### Renderer 还剩什么（按 GUI 优先级）

总量：11,201 个 chunk / 302MB，其中**真正需要人工还原的应用代码只有
2,250 个 chunk / 49.22MB**（app-code）。其余是第三方/纯数据，
**直接跳过**：locale 128 个（123MB）、lucide 图标 6535 个、shiki
grammar/theme、math-learning-blocks 1481 个、mermaid、mapbox、
runtime.worker、editor-doc 的 presentation/workbook 编辑器（巨型 vendored）。
完整分类与优先级见 `docs/renderer-classification.md`（必读，尤其第四节）。

推荐的下一步顺序（P0 → P2）：

- **P0 composer 输入区簇**（47 chunk）：`composer-utility-bar` /
  `suggestions` / `home-ambient-suggestions-content`…——GUI 核心的下半屏
- **P0 app-shared(5.1MB) 剩余应用逻辑**：27 个已验证 chunk 已覆盖其 runtime
  骨架，但 query key/store/UI 基础组件仍有大量未语义化导出
  （消费型 chunk 以 `@rchunk/app-shared` 的 any 声明承接，
  `src/renderer/types/rchunk-modules.d.ts` 共 2,312 行，逐个语义化的
  方式与 main 侧 chunk-modules.d.ts 完全相同）
- **P1 sidebar + home-onboarding**（52 chunk）：`sidebar-onboarding-checklist` /
  `onboarding-page` / `library-page`…
- **P1 dialogs-menus**（108 chunk）：`options-menu-view` / `DatePicker` /
  `codex-mobile-setup-dialog`…页面结构清晰、还原性价比高
- **P1 pages-routes**（92 chunk）：`avatar-overlay-native-page` /
  `security-route` / `profile`…配合 `docs/renderer-routes.json`（84 路由）
- **P1 browser 内置浏览器 + terminal**（25 chunk）
- **P1 git-github-worktree**（65 chunk）：review/diff/PR UI
- **P2 artifact-preview / markdown-render / charts-ui**：vendor 桥接层优先
- **P3 / 跳过**：appgen-valdi-platform（Valdi mini-app，实验性商业功能）、
  connectors、以及所有纯 vendor/locale/data chunk

---

## 四、核心方法论（必须严格遵循）

### 双轨构建

- **REWRITTEN chunk**：语义源码 → `scripts/build-renderer.mjs` 用 esbuild
  打成单个 ESM chunk。输出文件名必须与发布版**逐字符一致**
  （如 `rpc-971deaddf2c2.js`），即 chunk 清单里的 value。
- **其余 chunk**：transform-only——原版 JS 原样放 `src/webview/assets/`，
  只保证与发布版逐字节一致，**不改名不改内容**。
- 两轨由 import 图缝合：重写 chunk 里对未重写 chunk 的依赖写成
  `import ... from "@rchunk/<语义名>"`（tsconfig 路径由
  `src/renderer/types/rchunk-modules.d.ts` 声明；esbuild 构建时经
  chunkImportPlugin 改写回 `./<发布文件名>` 相对路径）。

### 单个 renderer chunk 的重写闭环（每一块都走全流程）

1. **登记**：`scripts/renderer-chunk-manifest.mjs` 的 `CHUNKS` 加
   `"语义名": "发布文件名"`，`REWRITTEN` 加语义名。
2. **定位导出**：用 `docs/renderer-app-shared-export-map.json` /
   `docs/renderer-app-initial-export-map.json`（导出名 → 内部符号 + 行号）
   找到该 chunk 的全部导出与依赖；`docs/renderer-chunk-manifest.json`
   是全量 11,201 chunk 的原始 import 邻接表（edges），重写前先查它拿到
   该 chunk 的精确依赖集合（verify 比对的正是这个集合）；纯数据 chunk
   用生成器脚本提取（参照 `scripts/generate-icons.mjs` 的平衡括号提取法）。
3. **语义重写**：读原版（`src/webview/assets/<发布文件名>.js` 或
   `.reference/app-original/`），按真实结构命名（组件/类型/hook 的真实语义），
   写入 `src/renderer/<语义名>/`。
4. **兼容导出对齐（最容易翻车）**：原版 chunk 的导出是压缩名
   （如 `export { computeTurnLayout as t }`）。重写版必须**逐一对齐**：
   `export { computeTurnLayout as t, ... }`——verify 脚本比对的就是
   ESM 导出的对外符号名。
5. **import 依赖集合对齐**：verify 还比对 chunk 对 `./xxx.js` 的全部
   import 集合。漏依赖（如 Icon、file-diff-alt）或多写都会挂。
   遇到大量对齐时用一次性 python 脚本批量 diff，别手抠。
6. **验证**：`node scripts/verify-renderer.mjs` 必须全绿；
   `npx tsc --noEmit` 不得超出基线错误集。
7. **提交**：一次 chunk 一 commit，中文 commit message 写清
   符号映射与行为自测结果。

### 行为自测（强烈建议，不止 verify）

对纯逻辑模块（非 React 组件）写一次性 tsx 脚本跑真实行为
（参照历史：command-registry 的 keymap 状态机、sandbox-permissions 的
档构造/降级、chunked-message 的协议全链、wsl-paths 的路径换算——
每模块 20-40 例断言）。React 组件 chunk 以 verify + tsc 为准即可。

---

## 五、必读文档（按顺序）

1. `docs/renderer-classification.md` —— 11,201 chunk 全量分类 + GUI 优先级
2. `docs/renderer-app-shared-analysis.md` —— renderer 运行时六机制解析
3. `docs/renderer-entry-and-routes.md` + `docs/renderer-routes.json` ——
   入口链（index → rpc → app-main createRoot）与 84 路由
4. `scripts/renderer-chunk-manifest.mjs` 头部注释 —— 双轨契约
5. `docs/shared-export-map.json` —— shared 692 导出地图（若继续 shared）
6. `docs/main-rewrite-contract.md` / `docs/bootstrap-rewrite-contract.md`

已重写 renderer chunk 的实际源码是最好的范式，**动笔前先读 1-2 个**：
- 小而完整：`src/renderer/rpc/index.ts`、`timestamps/index.ts`
- 中型带兼容别名：`src/renderer/thread-virtualizer/index.ts`
- 大型组件：`src/renderer/local-conversation-turn/index.ts`、
  `local-conversation-thread/index.ts`

---

## 六、坑与纪律（前人血泪）

1. **shell cwd 每条命令后会重置**到 chatgpt-desktop-src——所有命令
   一律前缀 `cd /Users/david/Workspace/ppio_github/codex-desktop-glm-version && `。
2. **Bash/Write 工具会做 HTML 实体解码**：任何包含 `"` `&#39;`
   `&` 字面量的代码写入时会被解码破坏。绕过：用 `chr(38)` 拼接、
   或 `String.fromCharCode`、或先写 `chr(38)+'quot;'+chr(59)` 的
   python 修复脚本。（真实事故：HTML_UNESCAPES 映射连修三次。）
3. **verify 失败循环**：九成是导出别名/依赖集合没对齐。先跑
   verify 看缺哪个符号，再回源码补；用脚本比对而不是目测。
4. **不要"顺手重构"原版行为**：重写版的语义必须与原版逐例一致
   （包括看起来怪的行为，如 `qb` 路径函数的小写化、`rx` join 不剥
   子路径尾斜杠）。自测断言写错时先怀疑断言，再怀疑实现。
5. **命名空间成员不能直接进 export 块**：`export { blocks.X as Y }`
   非法——先 `const { X } = blocks` 解构。
6. **React Compiler 形态**：原版大量 `(0, X.c)(n)` memo-cache 槽位调用，
   语义版用等价的 useRef/useCallback/Memo 表达，导出面不变即可。
7. **文件名冲突**：两个不同 chunk 请求同一语义名时登记别名
   （先例：`file-diff` 与 `file-dich-diff-alt`）。
8. **commit message 用中文**，写清：别名映射表、与原版 diff 核实结论、
   自测例数。
9. **绝不改动** `../chatgpt-desktop-src` 与 `.reference/app-original`。
10. **tsc 基线**：139 个 TS2307/2305/2304 属预期；每完成一批新语义化，
    基线错误数应只减不增。修复真实错误时把新基线记进 commit。

---

## 七、快速开始（建议第一条指令）

```bash
cd /Users/david/Workspace/ppio_github/codex-desktop-glm-version && \
node scripts/verify-renderer.mjs && node scripts/verify-chunks.mjs && \
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -c "error TS"
```

健康检查应同时运行 `verify-renderer`、`verify-chunks`、TypeScript 基线、
`audit-renderer-tail.mjs`、`audit-renderer-app-coverage.mjs` 和
`audit-app-shared-consumption.mjs`。前者的 0 pending 不得替代全量覆盖审计。
下方 2026-09-27 流程更新继续有效。

### 2026-09-27 增量流程更新

当前推进已改为“业务批次一 commit、批次末统一门禁”。提交边界应覆盖一个
完整用户流程或一组共享依赖/测试夹具的模块，通常约 **10–25 个模块**；不要
因为单个文件名簇完成就中断上下文。批次内部只跑受影响模块的快速定向测试，
不反复运行 build/verify/tsc。批次收口时再统一使用：

```bash
npm run verify-renderer-cluster -- \
  --test scripts/test-<cluster>.mjs \
  --module <module-a>:<assertions> \
  --module <module-b>:<assertions>
```

`--test` 与 `--module` 均可重复，允许一个业务批次汇集多个原有小簇。该命令
会自动执行定向测试、核对测试源码实际断言数、构建 renderer、运行
renderer/main 结构验证、检查 TypeScript 基线、`git diff --check`、新增 any
以及直接 namespace chunk 消费，并输出可直接复制进 commit message 的模块
验证清单。当前 TypeScript 基线为 **73**；可用
`--tsc-baseline <count>` 显式覆盖。

完整门禁在当前机器约 16 秒；主要成本是人工收口与上下文切换。因此不要为了
追求更大的数字把无关功能硬塞进同一提交，但只要模块属于同一用户流程、共享
同一套 mock/类型声明，优先合并到同一业务批次后再验证、提交。
