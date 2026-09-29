# 渲染进程 Chunk 分类报告（renderer-classification）

- 生成时间：2026-09-25T19:05:16
- 分析对象：`app/webview/assets/` 全部 **11,201** 个 `.js` chunk（总计 302.2MB）
- 方法：文件名模式（Vite/rolldown 混合 hash 命名）+ 内容签名（grep 标志串）+ import 图（manifest edges）三重证据；全部只读。
- 图方向：`edges[chunk] = 该 chunk import 的 chunk 列表`（正向 import）。

## 一、总体分类统计

| 类别 | chunk 数 | 体积 | 判定证据（置信度） |
|---|---:|---:|---|
| lucide-icon | 6535 | 2.31MB | `import createLucideIcon`（两份核心：`lucide-createLucideIcon-c0d201` 与 `createLucideIcon-BrIFp4GW`）；lucide- 前缀 3,274 个 + kebab名-6位bundleId-hash12 第二副本 + 再导出 facade 壳（高） |
| locale | 128 | 130.41MB | 文件名=语言 tag；内容为 `defaultMessage`/`"ConversationTurn.*"` 翻译键或运行时字典（高） |
| math-learning-blocks | 1481 | 15.83MB | `visualization-*`(904)/`type-*`(209)/`examples-*`(552) 定义数学/物理教学卡片（如 `GAY_LUSSACS_LAW`、`initialValues`、`kind: "number"`），依赖 `chatgpt_math_blocks-*`（高） |
| vendor:diagram-mermaid | 294 | 16.42MB | mermaid 全家桶：`chunk-XXXXXX` 内部模块（ImperativeState）、`*Diagram-ZJ3FMSHR` 图定义、`dagre-*` 布局、`render-X3XFXER2`(elkjs)、独立 rolldown-runtime-7467d20d835c（高） |
| shiki-grammar | 225 | 7.38MB | `{"displayName":"ABAP"...}` TextMate 语法 JSON，含 scopeName/patterns/repository（高） |
| shiki-theme | 135 | 2.89MB | `"tokenColors"` VSCode 主题 JSON（everforest/catppuccin 等）（高） |
| editor-doc | 28 | 11.00MB | `presentation-*`/`workbook-*`/`PopcornElectron*`（幻灯片/表格编辑器）+ `walnut-*-decoder.worker`（高） |
| vendor:mapbox | 8 | 6.69MB | 文件名 mapbox-*；`mapbox-gl-rtl-text.min` 内嵌 base64 字体（高） |
| vendor:valdi-sdk | 6 | 2.41MB | 内容含 `valdi_core/src/`、`collaborative_editor/src/` 源码路径（Valdi mini-app 平台 SDK：CompilerIntrinsics/experiment-service/document 等 6 个）（高） |
| vendor:dist-libs | 38 | 1.25MB | `dist-*` 家族 39 个，CodeMirror 等第三方 dist 模块（中：家族特征明确但单个文件归属库不完全确定） |
| vendor:recharts | 2 | 3.49MB | BarChart/ComposedChart bundle：`recharts`、`CartesianGrid`、`XAxis` 字符串 + d3/eventemitter3 依赖（高） |
| vendor:katex | 3 | 0.72MB | 文件名 katex-* / `define("katex"`（高） |
| vendor:pdfjs | 3 | 1.17MB | pdf-*；`AnnotationEditorLayer`/`getDocument`（高） |
| vendor:datadog | 3 | 0.09MB | `datadog-rum.browser`/`datadogProfiler`/`datadogRecorder`（高） |
| vendor:d3 | 42 | 0.21MB | d3 模块名 stem（linear/ordinal/band/expand…）且不依赖 app-shared（高） |
| vendor:eventemitter3 | 1 | 0.08MB | 文件名（高） |
| vendor:tanstack-form | 2 | 0.10MB | `useForm-`（tanstack form）、`with-selector-`（use-sync-external-store）（高） |
| vendor:lottie | 1 | 0.26MB | `lottie_light-*`（高） |
| vendor:three | 2 | 0.71MB | `three.module-`、`OrbitControls-`（高） |
| vendor:mathlive | 1 | 1.11MB | `mathlive.min-`（MathLive 数学输入，1.1MB）（高） |
| runtime-worker | 3 | 17.82MB | `runtime.worker-*` ×3（valdi_core 沙箱运行时，17.8MB）（高） |
| data | 2 | 0.17MB | base64/wasm 数据主导（`wasm-7a831618` 内嵌 wasm、wreath-* base64）（高） |
| build-runtime | 2 | 0.00MB | rolldown-runtime ×2（主 + mermaid 子运行时）+ modulepreload polyfill（高） |
| app-hub | 8 | 30.48MB | index-e0f46 → rpc + app-initial(15MB, 引用 2,284 chunk) → app-shared(5.1MB 核心) + app-primary/app-main/register-CNkVP8uC(7.1MB markdown 注册枢纽)（高） |
| app-code | 2248 | 49.22MB | 其余：真正的 Codex 桌面 GUI 逻辑（见分簇） |
| **合计** | **11201** | **302.22MB** | |

> 说明：lucide 有**两份副本**（`lucide-` 前缀主副本 + 无前缀 kebab 名第二副本，后者服务于 app-initial/register 等枢纽）。locale 共 113 种语言、128 个文件（同语言一般 2 份：react-intl 消息 + 运行时字典）。

## 二、app-initial（15MB）里装了什么

`app-initial-51da50e6c6e3.js` 直接引用 2,284 个 chunk，构成如下：

| 被引用类别 | 数量 | 体积 |
|---|---:|---:|
| app-code | 1191 | 19.62MB |
| lucide-icon(第二副本) | 683 | 24.53MB |
| shiki-grammar | 219 | 7.34MB |
| shiki-theme | 70 | 1.36MB |
| locale | 65 | 123.01MB |
| vendor:d3 | 16 | 0.08MB |
| vendor:dist-libs | 12 | 0.73MB |
| math-learning-blocks | 10 | 0.20MB |
| editor-doc | 5 | 0.64MB |
| vendor:recharts | 2 | 3.49MB |
| vendor:datadog | 2 | 0.05MB |
| vendor:katex | 2 | 0.38MB |
| vendor:mapbox | 2 | 2.62MB |
| vendor:diagram-mermaid | 2 | 0.00MB |
| vendor:valdi-sdk | 1 | 0.00MB |
| vendor:eventemitter3 | 1 | 0.08MB |
| vendor:tanstack-form | 1 | 0.10MB |

结论：**app-initial 本质是“全局依赖聚合器”**——15MB 自身代码里最主要的可识别内容是 micromark/markdown 管线、zod schema、valdi 平台胶水；它的 2,284 个引用里 683 个是 lucide 第二副本图标（24.5MB）、65 个 locale（123MB）、563 个数学教学块、219 个 shiki grammar、70 个主题。真正属于应用启动逻辑的 app-code 引用仅 654 个（18.8MB），其中体积最大的是：`i18n-147d032388be`（1.6MB，国际化核心）、`mcp-tool-activity-label`、`response-883c9a267b7e`（valdi 平台表单）、`avatar-overlay-native-page`、`browser-6350a2274cdd`、`onboarding-page`、`highlight-code`、`view-state-persistence`、`library-page`、`review-file-tree-pane`、`profile`、`editor-370fecef1630` 等。

## 三、应用代码 chunk 语义分簇

应用代码共 **2248** 个 chunk，**49.22MB**。按文件名语义分簇（含 app-shared/app-primary 等枢纽内的逻辑，但枢纽本体单列）：

| 簇 | chunk 数 | 体积 | 代表文件 |
|---|---:|---:|---|
| misc-剩余UI/工具 | 953 | 15,354.6KB | learning-block-9a37c1b2cdda.js, cytoscape.esm-9c90b5045aa0.js, cytoscape.esm-1029c72ddab6.js |
| rpc-bridge 运行时桥接/全局store | 410 | 3,911.7KB | wasm-7a831618ae1c.js, wasm-12d145e3c759.js, index-BR4tusjh-9e987eecc013.js |
| pages-routes 页面/路由 | 92 | 3,706.9KB | avatar-overlay-native-page-910b190b3a21.js, security-route-a9075c0a0fdd.js, library-page-d23eecab1f03.js |
| settings 设置页 | 70 | 3,235.6KB | _virtual_settings-search-documents-d81257e4909b.js, remote-connections-settings-12e860fd2983.js, security-settings-2da2a3b205ab.js |
| appgen-valdi-platform App生成平台 | 78 | 2,823.5KB | product-intervention-notice-846d1e2feea6.js, response-883c9a267b7e.js, checkout-page-4a1ddf45d850.js |
| editor-docs 富文本/文档编辑 | 42 | 2,619.2KB | sketch-559c02939086.js, document-model-d51fb9528b57.js, spreadsheet-83d23b306ef9.js |
| conversation-thread 会话/消息流 | 102 | 2,593.4KB | local-conversation-thread-c6e40fdd6d59.js, conversation-blocks-3f59e850f9fb.js, chatgpt-conversation-page-5973e560922b.js |
| dialogs-menus 对话框/菜单 | 108 | 2,572.6KB | options-menu-view-260b98308bf3.js, DatePicker-14d6de970c7c.js, codex-mobile-setup-dialog-bf03c0869420.js |
| artifact-preview 产物/预览 | 53 | 2,238.4KB | artifact-source-bootstrap-583ed8de587e.js, viewer-22044df35298.js, docx-preview-8513c2dacad2.js |
| markdown-render Markdown/代码高亮 | 24 | 2,164.8KB | i18n-147d032388be.js, highlight-code-7c4c2ef3d4d8.js, chatgpt-code-block-5f1819755161.js |
| git-github-worktree 代码协作 | 63 | 1,553.0KB | review-file-tree-pane-d59081dc4b8c.js, pull-request-detail-query-bec089c5268f.js, pull-request-code-review-5ce1a9c20ee4.js |
| skills-plugins-mcp 技能/工具 | 30 | 1,216.2KB | mcp-tool-activity-label-87ba9ef42b0b.js, plugin-detail-view-514feb8d1f55.js, plugin-installation-content-a311dd9d483e.js |
| home-onboarding 首页/引导 | 40 | 1,005.0KB | onboarding-page-905dd8894724.js, subscription-onboarding-dcd9d9af0fe0.js, app-connect-modal-7b842fd077d6.js |
| panels 面板 | 20 | 776.7KB | panel-3f0c2778c5e0.js, pending-request-item-panel-32378914c639.js, chatgpt-sources-side-panel-tab-de643adc6524.js |
| composer 输入区/提示词 | 47 | 719.4KB | composer-utility-bar-a9b94a95b731.js, home-ambient-suggestions-content-a1c4fe488b63.js, suggestions-92e2efd3926f.js |
| browser 内置浏览器 | 19 | 680.1KB | browser-6350a2274cdd.js, browser-use-settings-8fbddd7915df.js, site-preview-6eb9e2987caf.js |
| charts-ui 图表/可视化UI | 17 | 516.0KB | interactive-chart-31b1f4c7f58e.js, activity-chart-816f6e49aa7a.js, build-graph-data-ee6e0d8e135a.js |
| animations 动画/视效 | 7 | 488.4KB | animated-icon-svg-6d0bf1a76c25.js, pricing-promotions-f189cca8afba.js, animated-icon-ac1b587a8839.js |
| auth-profile 账号/计划 | 13 | 343.8KB | profile-2f0975511066.js, plan-summary-item-content-748d84eee508.js, chatgpt-desktop-auth-url-622e1078fa12.js |
| hooks use-* | 24 | 325.6KB | use-imported-setup-opportunity-fe980a908289.js, use-external-agent-import-setup-actions-c839faa9dba2.js, use-chatgpt-command-menu-search-results-a4e46e3b77d3.js |
| sidebar 侧边栏 | 12 | 191.8KB | sidebar-onboarding-checklist.electron-acd50317871a.js, sidebar-images-icon-31c3c9b58364.js, sidebar-onboarding-checklist-task-config-2c7fbbcf69d8.js |
| terminal 终端 | 6 | 99.7KB | use-ascii-engine-dea3f8f79bb0.js, terminal-panel-b26695cb7733.js, terminal-tab-c813278916e5.js |
| observability-cloud 遥测/云服务 | 8 | 40.2KB | cloud-environment-queries-fe64a79d8109.js, analytics-363d04057f73.js, remote-hosted-pip-anchor-bridge-f37bd14c6951.js |
| connectors 连接器 | 5 | 34.3KB | pca-connector-eligibility-7ce0bc520ad2.js, pca-connector-action-47815707c640.js, plugin-connector-setup-82057011f9b6.js |
| search-command-menu 搜索/命令面板 | 5 | 9.8KB | keyboard-shortcuts-search-input-04829b7a13df.js, regex-search.worker-93adb92b59ce.js, document-search-d1a8a918aa84.js |

## 四、建议的源码还原优先级

按 GUI 价值（用户可见、交互密集、不可第三方替代）排序：

- **P0** conversation-thread 会话/消息流 + composer 输入区 —— 桌面 GUI 的核心界面：消息列表、turn 渲染、输入框、suggestion。参考 restored/conversations|composer|threads。
- **P0** app-shared(5.1MB)/app-initial 中的应用逻辑 —— 全局 store、query key、RPC 桥、UI 基础组件（e6/I3 等被全量引用的导出）。一切页面的公共依赖。
- **P1** sidebar + home-onboarding + settings —— 导航骨架与首启动流程，页面结构清晰、还原性价比高。
- **P1** browser 内置浏览器 + terminal 终端 —— Codex 桌面特色功能（webview 沙箱、terminal 面板）。
- **P1** git-github-worktree 代码协作 —— review/diff/pull-request UI，与 Codex CLI 语义强相关。
- **P2** artifact-preview + editor-docs —— 产物预览（pdf/image/binary viewer）与 presentation/workbook 编辑器；后者是巨型 vendored 功能，还原成本极高、GUI 价值中等。
- **P2** markdown-render + charts-ui —— 依赖 shiki/recharts/d3/mermaid 等 vendor，界面层薄，先还原 vendor 桥接层即可。
- **P3** appgen-valdi-platform + connectors + skills-plugins-mcp —— Valdi mini-app 平台 UI（实验性商业功能，非 Codex 核心），可低优先 stub。
- **跳过** locale / lucide / shiki / math-learning-blocks / diagram / mapbox / runtime.worker —— 纯第三方或纯数据，直接用 npm 包或原资产复用，无需人工还原。

## 五、不确定项与置信度说明

- `vendor:dist-libs`（39 个 `dist-*`）：家族确定为第三方库模块（部分含 CodeMirror API），单个文件对应哪个 npm 包未逐一确认（中置信度）。
- `misc-剩余UI/工具`（app-code 未匹配语义簇的尾部长尾，多为小组件/工具函数，如 `use-element-in-view`、`avatar-*`、`stack`、`tag-*`）：全部为应用代码（高置信度），但语义簇归属靠文件名（中置信度）。
- `personas-brand-assets`（Aime/Bloop/Digit 等 PascalCase 双文件族）：被 app-initial 与 product-intervention-notice 引用，内容为带调色板的插画/头像定义（lottie/SVG 矢量数据），判为应用品牌资产而非 lucide（高置信度）。`*Fill` 单文件族为品牌填充图标。
- locale 中同一语言两份文件（如 `am-1f5…` 与 `am-4923…`）：一份为 react-intl 编译消息、一份为运行时字典，均计为 locale。
- 第二副本 lucide 图标的判定规则 = import `createLucideIcon-BrIFp4GW` 或被同 stem facade 再导出；有个别文件可能同时被 mermaid 家族引用（如 ComposedChart 的 mapDeps 列表），已按“直接 import 边”而非 mapDeps 字符串判定，避免污染（高置信度）。
