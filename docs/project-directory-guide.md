# 反编译工程目录与源码分层

本工程是从 macOS ChatGPT/Codex 桌面应用发布包恢复出的 TypeScript 工程。目录按“可维护语义源码、保真兼容源码、构建产物、原版证据、运行外壳”分层。日常功能开发应优先修改 `src/main` 与 `src/renderer`；`app` 是构建结果，`.reference` 是审计证据，`shell` 是应用容器。

## 总体目录

```text
codex-desktop-glm-version/
├── src/                         # 反编译和重建后的源码
│   ├── main/                    # Electron 主进程语义源码
│   ├── main-recovered/          # 主进程保真组合根
│   ├── renderer/                # 前端 UI 语义源码
│   ├── renderer-preserved/      # 前端第三方和生成代码边界
│   ├── renderer-recovered/      # 历史路由兼容清单
│   └── webview/                 # 发布版前端 chunk 的 transform-only 源码
├── app/                         # 构建后的 app.asar 运行树
├── shell/                       # macOS ChatGPT.app/Electron 外壳
├── .reference/                  # 未修改的原版发布内容
├── scripts/                     # 构建、审计、测试、E2E 和打包脚本
├── docs/                        # 逆向分析与工程说明
├── package.json                 # 开发命令和依赖
├── tsconfig.json                # TypeScript 配置
└── README.md                    # 项目入口说明
```

## 源码所有权层级

### `src/main`

`src/main` 是 Electron 主进程的可维护源码，负责窗口、IPC、文件、终端、Git、浏览器、通知、插件、自动化和后台服务，不直接绘制 React UI。

```text
src/main/
├── early-bootstrap/             # Electron 最早期入口
├── bootstrap/                   # 主进程启动和依赖装配
├── preload/                     # 主窗口 preload bridge
├── sandbox-preload/             # MCP/沙箱窗口 preload
├── browser-page-preload/        # IAB 页面注入和 Computer Use
├── worker/                      # Git 与后台 Worker
├── device-service/              # 外接设备服务
├── shared/                      # 主进程共享类型和工具
├── main-app/                    # 主进程业务主体
└── types/                       # chunk 接口与类型声明
```

`src/main/main-app` 已按业务拆分，主要子系统包括：

- `app-server`：Codex app-server 通信与请求路由。
- `auth`：登录、认证和账号状态。
- `browser`、`browser-sidebar`、`browser-use`：内置浏览器、IAB 和 Computer Use。
- `conversation`、`conversations`、`threads`、`turns`：会话和运行状态。
- `terminal`：终端与 PTY 生命周期。
- `github`、`projects`、`workspace`：GitHub、项目和工作区。
- `automations`、`plugins`：自动化与插件系统。
- `files`、`attachments`：文件、附件、预览和拖放。
- `window`、`windows`：Electron 窗口管理。
- `notifications`、`settings`、`security`：通知、设置与安全策略。
- `remote`、`remote-control`：远程执行与控制。
- `mcp-sandbox`：MCP 沙箱和网络边界。

修改桌面后台行为时，优先在相应 `src/main/main-app/<子系统>` 中寻找 owner。

### `src/main-recovered`

`src/main-recovered` 保存主进程大型发布 chunk 的保真组合根，例如 `main-C-Mhak1n.ts`、`worker.ts` 和 `browser-page-preload.ts`。

这些文件负责维持原版入口、初始化顺序和导出契约，并直接参与构建。已经抽取出的业务逻辑位于 `src/main`，所以新增或修改业务行为时应优先编辑 `src/main`，避免继续把实现堆回大型组合根。

### `src/renderer`

`src/renderer` 是前端 React/Renderer 的主要可维护源码。每个语义目录通常以 `index.ts` 为入口，由构建脚本重新 bundle 成原发布版对应的 hashed chunk。

主要功能簇如下：

```text
src/renderer/
├── app-main/、app-shell/         # 前端入口和整体应用布局
├── local-conversation-*/        # Codex 本地聊天页面
├── chatgpt-conversation-*/      # ChatGPT 会话页面
├── conversation-blocks/         # Markdown、代码、工具结果和消息块
├── composer-*/                  # 输入框、操作栏、模式和上下文选择
├── settings*/                   # 设置页面和设置路由
├── browser-*/                   # 内置浏览器和 IAB UI
├── terminal-*/                  # 终端 UI
├── git-*、worktree-*/           # Git 与 Worktree UI
├── plugins-*、skill-*/          # 插件和 Skill 页面
├── artifact-*/                  # 文档、表格、幻灯片等 Artifact
├── pull-request-*/              # PR 与代码审查
├── automation-*/                # 自动化任务页面
├── voice-*                      # 语音模式
├── app-shared/                  # 前端共享运行时
├── app-initial/                 # 初始化聚合运行时
└── app-primary/                 # 主界面聚合运行时
```

聊天区域的核心层次是：

```text
local-conversation-page
└── local-conversation-thread
    ├── local-conversation-turn
    │   └── conversation-blocks
    └── composer-* 输入区域
```

修改页面、组件、交互和样式时，优先进入 `src/renderer`，不要直接修改 `app/webview/assets` 中的构建结果。

### `src/renderer-preserved`

`src/renderer-preserved/route-runtime` 保存 33 个经过审计的第三方或生成代码边界，包括 React Redux、Three.js、Recharts、D3、DatePicker 和 phone-number-input 等依赖。

这些模块：

- 不是未完成的第一方业务代码；
- 文件名和局部变量可能仍保留发布版形态；
- 从仓库内的 TypeScript 构建，不会回退读取原版发布 JS；
- 通常只做 TypeScript 到 ESM 的单文件转换，不进行语义重组。

除非要替换第三方库或重构生成代码边界，否则不应修改这里。

### `src/renderer-recovered`

`src/renderer-recovered/conversation-route` 记录曾经由发布代码提供的会话路由兼容图。当前 manifest 已为空，表示第一方应用模块都已经拥有 `src/renderer` source owner。

该目录现在主要用于记录完成状态和阻止发布 JS fallback 回流，不是日常开发目录。

### `src/webview`

`src/webview/assets` 保存发布版前端 hashed chunks 的 transform-only TypeScript，另外还有 Service Worker 源码。

这里包含：

- 第三方运行时与语言定义；
- 图标、SVG、可视化数据和学习模型数据；
- Worker 与生成代码；
- 动态 import 依赖；
- 构建前的原版 ESM chunk 形态。

构建时会先把这些文件转换到 `app/webview/assets`，之后再用 `src/renderer` 的语义实现覆盖相同输出。它是完整构建所需的保真资产库，但不是主要产品开发目录，也不能把文件数量直接等同于尚未完成的业务模块数量。

## 构建产物与运行容器

### `app`

`app` 是准备写入 `app.asar` 的可运行树。

```text
app/
├── package.json                 # Electron 应用元数据
├── .vite/build/                 # 主进程构建产物
├── webview/
│   ├── index.html               # 主窗口入口
│   ├── detached-window.html     # 分离窗口入口
│   ├── assets/                  # Renderer 运行时 JS/CSS
│   ├── images/
│   └── service-worker/
├── node_modules/                # 运行时和原生依赖
└── native-menu-locales/         # 原生菜单翻译
```

`app/.vite/build/*.js` 与 `app/webview/assets/*.js` 是生成物，下一次构建会覆盖，不能作为长期源码修改点。

### `shell`

`shell/ChatGPT.app` 是实际启动的 macOS 应用外壳。

```text
shell/ChatGPT.app/Contents/
├── MacOS/                       # 原生可执行文件
├── Frameworks/                  # Electron/Owl/Sparkle
├── PlugIns/                     # Dock 等原生插件
└── Resources/
    ├── app.asar                 # 重新打包的应用代码
    ├── app.asar.unpacked/       # 不能进入 asar 的原生内容
    ├── native/
    ├── plugins/
    ├── skills/
    └── *.lproj                  # macOS 本地化资源
```

`scripts/pack.sh` 会把 `app` 打成 `app.asar` 写入这里，`scripts/run.sh` 启动这个应用并复用本机账号环境。

## 原版证据与工程工具

### `.reference`

`.reference/app-original` 保存未修改的原版 `app.asar` 解包内容，`.reference/originals/main` 保存主进程原始 chunk 对照。

它们用于：

- 对比导出符号和依赖图；
- 核对恢复实现与发布版行为；
- 为审计和回归测试提供证据。

`.reference` 不是当前应用的 runtime fallback，构建不应从这里复制发布 JS 作为运行实现。

### `scripts`

`scripts` 同时承载构建工具和回归测试。关键入口包括：

- `build.mjs`：全量构建主进程和 Renderer。
- `build-renderer.mjs`：构建前端语义 owner 与保留边界。
- `chunk-manifest.mjs`：主进程语义名到发布文件名的映射。
- `renderer-chunk-manifest.mjs`：Renderer 语义名到发布文件名的映射。
- `verify-chunks.mjs`：主进程结构与导出契约验证。
- `verify-renderer.mjs`：Renderer chunk 验证。
- `pack.sh`：构建并生成 `app.asar`。
- `run.sh`：启动本地应用。
- `e2e-packaged-critical.mjs`：真实打包应用的关键 E2E。
- `test-*.mjs`：各业务子系统的回归测试与防回退门禁。

### `docs`

`docs` 保存主进程拆分记录、Renderer chunk 分类、共享 Hub 审计、Preload 审计、Git Worker 审计和 E2E 说明。项目终局状态以 `docs/completion-audit-2026-11-01.md` 为准。

## 从源码到运行应用的数据流

```text
src/main
src/main-recovered
        └── build.mjs ───────────────> app/.vite/build

src/webview/assets
        └── transform ───────────────> app/webview/assets

src/renderer
src/renderer-preserved
        └── build-renderer.mjs ──────> app/webview/assets
                                         │
                                         └── pack.sh ──> shell/ChatGPT.app/Contents/Resources/app.asar
```

语义 Renderer 构建最后执行，因此会覆盖 transform-only 阶段生成的同名旧 chunk，确保可维护 owner 成为最终运行实现。

## 开发时如何选择目录

| 目标 | 应修改的位置 |
| --- | --- |
| 修改聊天页面和消息样式 | `src/renderer/local-conversation-*`、`conversation-blocks` |
| 修改输入框和 Composer | `src/renderer/composer-*`、`local-conversation-thread` |
| 修改设置页面 | `src/renderer/*settings*`、`settings-page` |
| 修改应用外壳、侧栏和导航 | `src/renderer/app-shell`、`sidebar-*` |
| 修改内置浏览器 UI | `src/renderer/browser-*` |
| 修改窗口、IPC 和后台服务 | `src/main/main-app` |
| 修改 Preload 或页面注入 | `src/main/preload`、`src/main/browser-page-preload` |
| 查看第三方或生成边界 | `src/renderer-preserved`、`src/webview/assets` |
| 查看构建结果 | `app` |
| 查看原版对照 | `.reference` |
| 修改打包与启动流程 | `scripts/pack.sh`、`scripts/run.sh`、`shell` |

## 修改纪律

1. 正常功能开发优先修改 `src/main` 和 `src/renderer`。
2. 不直接维护 `app/.vite/build` 或 `app/webview/assets` 中的生成 JS。
3. 不把 `.reference` 当成运行时依赖。
4. 不随意删除 `src/webview/assets`，其中包含动态依赖和生成边界。
5. 不把 `renderer-preserved` 视为未完成业务代码。
6. 修改后至少运行与改动范围相匹配的 typecheck、build/check、验证脚本和打包 E2E。

