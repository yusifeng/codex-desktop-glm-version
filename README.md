# codex-desktop-glm-version

从 macOS 版 ChatGPT.app（Codex 桌面应用）的 `app.asar` 还原出的 **TypeScript 源码工程**。

原始应用信息（保留自 asar 内的 `app/package.json`）：

| 字段 | 值 |
| --- | --- |
| 包名 | `openai-codex-electron`（productName: Codex） |
| 版本 | 26.917.71314（build 10954，prod flavor） |
| 原始工程形态 | pnpm monorepo 子包（大量 `workspace:*` 依赖） |
| 构建工具链 | Electron 42.3.0 + Vite 8.2.0（rolldown）+ electron-forge 7.11.2 + TypeScript 7.0.2 |
| 关键运行时依赖 | better-sqlite3、node-pty、@worklouder/device-kit-oai、objc-js、@sentry/electron、yjs、zod、vscode-jsonrpc 等（完整清单见 `app/package.json`） |

## 还原方式（重要）

官方发布包**没有 sourcemap**（文件里有 `sourceMappingURL` 注释，但 `.map` 在发布时被剔除），JS 经过压缩混淆（局部变量是 `e61`/`t10` 这类名字），模块边界与类型信息在构建时已丢失。因此「逐字节还原 OpenAI 的原始仓库」不可能；本工程采用的方式是**渐进式逆向重写**，源码分两层：

**第 1 层：已重写的 chunk（`src/main/<语义名>/`）——真实源码**

真实的模块化 TypeScript：有命名、有类型、有注释，用 esbuild 打包回官方的 chunk 文件名。目前 21 个主进程 chunk 中已重写 9 个（入口链 + preload + 日志等基础设施），见下表。改这些代码就是正常迭代。

**第 2 层：未重写的 chunk（`src/main/<chunk 文件名>.ts`）——格式化原版**

发布代码经 prettier 格式化的逐字保留（带 `// @ts-nocheck`），仅做 TS→JS 转换，输出与发布版逐字节一致。重写一个 chunk 时：新建 `src/main/<语义名>/`，逐段把对应旧文件重写成真实源码，删掉旧文件，在 `scripts/chunk-manifest.mjs` 的 `REWRITTEN` 里登记，然后 `npm run build && npm run verify`。

两层可以任意比例混合：重写一个 chunk 不需要同时动它的依赖方或被依赖方——chunk 间的兼容靠「导出面保持不变」（见下）。

### 重写约定（继续还原时必须遵守）

- **导出面兼容**：未重写的 chunk 仍以发布版的单字母名引用其他 chunk（如 `require("./logger-DkO6GWbX.js").r`）。所以重写后的 chunk 在语义导出之外**必须保留原版的单字母导出别名**（`export { createTaggedLogger as r }`），全部消费方重写完毕后才可移除。
- **跨 chunk 引用**写 `import ... from "@chunk/<语义名>"`，构建时映射为对输出 chunk 的运行时 require（`scripts/build.mjs` 的 `chunk-imports` 插件）。尚未重写的 chunk 的类型声明在 `src/main/types/chunk-modules.d.ts`。
- **CJS 循环依赖**：esbuild 的 CJS 输出会替换 `module.exports` 对象（原版是在 `exports` 上定义惰性 getter）。已重写的 chunk 目前都不参与 require 环；后续重写参与环的 chunk 时要检查加载顺序。
- 每次重写后跑 `npm run build && npm run verify`（对比原始产物的 require 依赖图与导出符号面）与 `npm run typecheck`。

## 目录结构

```
├── src/                          # 源码（编辑这里）
│   ├── main/
│   │   ├── types/chunk-modules.d.ts  # 未重写 chunk 的 @chunk/* 类型声明
│   │   ├── <语义名>/              # 已重写 chunk 的真实源码（见下表）
│   │   └── <chunk 文件名>.ts      # 未重写 chunk（格式化原版，@ts-nocheck）
│   └── webview/                  # 渲染进程（11202 个 chunk，全部未重写）
├── app/                          # asar 运行树（payload 提交；*.js 由 build 生成，gitignore）
│   ├── package.json              #   原版应用的 package.json（入口 .vite/build/early-bootstrap.js）
│   ├── node_modules/             #   原生模块（better-sqlite3、node-pty、objc-js、device-kit 等）
│   ├── native-menu-locales/      #   原生菜单多语言文案
│   ├── .vite/build/              #   [生成] 主进程 chunk
│   └── webview/                  #   渲染进程静态资源 + [生成] JS
├── .reference/app-original/      # 未修改的 asar 解包（gitignore，verify 的对照基准）
├── scripts/
│   ├── chunk-manifest.mjs        # chunk 清单：语义名 ↔ 输出文件名，REWRITTEN 列表
│   ├── restore-ts.mjs            # app/**/*.js → src/**/*.ts 机械恢复（跳过已重写 chunk）
│   ├── build.mjs                 # build：transform（未重写）+ bundle（已重写）
│   ├── verify-chunks.mjs         # 已重写 chunk 与原始产物的结构等价验证
│   ├── pack.sh                   # build + 打包 app/ 为 asar 装进 shell
│   ├── setup-shell.sh            # 从 /Applications/ChatGPT.app 克隆 shell/ChatGPT.app
│   └── run.sh                    # 启动（复用 ~/.codex 账号）
├── package.json                  # 开发工具链（esbuild、prettier、typescript、electron 类型）
└── tsconfig.json
```

## 主进程 chunk 地图

| 语义名 | 输出 chunk | 作用 | 状态 |
| --- | --- | --- | --- |
| `early-bootstrap/` | early-bootstrap.js | Electron 入口：排队 open-path 事件后异步加载 bootstrap | ✅ 已重写 |
| `electron-resources-path/` | electron-resources-path-BDLw2lp0.js | resources 路径解析（支持环境变量覆盖） | ✅ 已重写 |
| `desktop-open-path-queue/` | desktop-open-path-queue-DpR9n1cN.js | 启动早期的 open-file/open-url 事件队列 | ✅ 已重写 |
| `logger/` | logger-DkO6GWbX.js | 日志（BufferLogger/脱敏/格式化） | ✅ 已重写 |
| `capture/` | capture-DaZJeQgG.js | 系统音频频谱捕获子进程管理 | ✅ 已重写 |
| `upload/` | upload-D8KNqeRP.js | content trace 录制上报 | ✅ 已重写 |
| `windows-file-copy/` | windows-file-copy-B0DNtkPq.js | Windows 加密目录复制降级 | ✅ 已重写 |
| `sandbox-preload/` | sandbox-preload.js | MCP 沙箱 guest 侧 preload | ✅ 已重写 |
| `preload/` | preload.js | 主窗口 preload：electronBridge、Sentry IPC、PIP 视频解码 | ✅ 已重写 |
| `bootstrap` | bootstrap-C4dRql4x.js | 主进程引导：Sentry、自动更新（808KB） | 待重写 |
| `main` | main-C-Mhak1n.js | 主进程主体：窗口/菜单/IPC/账号（5.5MB） | 待重写 |
| `git-worker` | worker.js | git 操作 worker（vscode-jsonrpc，2.8MB） | 待重写 |
| `shared` | src-DldfpmrL.js | 主进程共享库：内嵌 zod、which 解析等（2.1MB） | 待重写 |
| `css-selector` | dist-wQAv1pJP.js | css-select 选择器引擎（网页内容提取） | 待重写（vendored 库） |
| `file-type-main` / `file-type-worker` | core-B-w7xKIn.js / core-DlTZhmo0.js | file-type 文件魔数检测 ×2 | 待重写（vendored 库） |
| `device-service` | service-CtZiLFyH.js | 设备服务（device-kit 生命周期） | 待重写 |
| `worker-shared` / `main-shared` | src-BSoROW9v.js / src-C9YLnbgY.js | 小型共享库 | 待重写 |
| `browser-page-preload` | browser-page-preload.js | 浏览器页面注入 preload（computer use，855KB） | 待重写 |
| `bundler-runtime` | rolldown-runtime-CPUxUITh.js | rolldown 打包运行时 | 不需要重写 |

## 使用

```bash
npm install          # esbuild、prettier、typescript、electron 类型（跳过二进制下载）
npm run build        # 全量构建：src/ → app/
npm run verify       # 已重写 chunk 与原始产物的结构等价验证
npm run typecheck    # tsc --noEmit
npm run check        # 未重写文件的 TS/JS 语义一致性检查
npm run setup        # 从 /Applications/ChatGPT.app 克隆 shell 并打包（首次）
npm run pack         # build + 打包 asar
./scripts/run.sh     # 启动（复用 ~/.codex 的账号与会话）
```

工作流：改 `src/` → `npm run verify` → `npm run pack` → `./scripts/run.sh`。

启动原理：应用拒绝原生 Electron（校验 "Owl" shell），`run.sh` 在关闭了 asar 完整性校验 fuse 的官方 bundle 克隆里加载重新打包的 `app.asar`，使用独立的 Electron profile（`Codex (local-src)`），可与官方安装版并存。

## 后续还原路线

按依赖与价值排序的推进方向：

1. **`bootstrap`（808KB）** → **`main`（5.5MB，按子系统拆模块）**：主进程核心，改动最常发生的地方；
2. **`shared`（2.1MB）**：被所有主进程模块依赖，重写后可以给 `@chunk/shared` 的单字母导出换成语义命名；
3. **`git-worker` / `device-service` / `browser-page-preload`**；
4. **webview（11202 个 chunk）**：参照 decode-codex 的做法（见下）按依赖树从入口推进，图标类小 chunk 可保持机械恢复。

**参考仓库**（版本较旧，仅用于命名/结构参照，一切以本仓库实际代码为准）：

- `github.com/JimLiu/decode-codex` —— 同为 Codex 桌面应用的反混淆工程（v26.707），有 3000+ 已还原文件与 IMPORT_MAP 溯源映射、以及一条多阶段反混淆流水线（detect → smart-rename → polish → quality-gate）；
- `github.com/huyansheng3/codex-analysis` —— v26.506 的安全向逆向分析，含按子系统组织的重建源码与 IPC 通道文档。

注意：不同版本间 chunk 哈希名全部不同，参考仓库的文件不能直接搬运，需要按导出面/内容相似度对齐后逐个核验。

## 验证状态

- `npm run typecheck`：通过（含 9 个已重写 chunk 的全部源码，electron 42.3.0 类型）。
- `npm run verify`：9 个已重写 chunk 与官方原始产物的 require 依赖图、导出符号面全部一致。
- 未重写 chunk 的构建输出与发布版逐字节一致（`build --check` 0 语义分歧）。
- 重写时的语义对照靠逐行核对原版产物（`.reference/app-original`）；运行行为最终以 `npm run pack` 后 `./scripts/run.sh` 的冒烟测试为准。

## 声明

本仓库是对官方发布产物的逆向重写，仅供学习研究。原始应用的版权归 OpenAI 所有；请不要用于再分发或绕过官方服务的用途。
