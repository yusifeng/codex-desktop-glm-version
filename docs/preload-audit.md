# `browser-page-preload.ts` 逐段审计

本轮新增 `annotation-edit-editor-controller.ts`：真实接回 Wy 的 `Ye` edit-editor lifecycle，保留 runtime target/map、design projection、preview close、host IPC、viewport refresh 与 React editor state 的原始副作用顺序。focused test：`scripts/test-preload-annotation-edit-editor-controller.mjs`。

另新增 `annotation-comment-preview-controller.ts`，真实接回 Wy 的 `Xe` comment-preview lifecycle，保留 target resolution、preview state、viewport refresh 与 host IPC 顺序。

另新增 `annotation-design-editor-open-controller.ts`，真实接回 Wy 的 `Ze` design-editor lifecycle，保留 DOM anchor normalization、card viewport projection、target registry、IPC 与 editor state 顺序。

另新增 `annotation-virtual-selection-editor-controller.ts`，真实接回 Wy 的 `et` virtual-selection editor lifecycle，保留 editor-open gate、preview close、design controls、modifier/hover cleanup 与 create-editor IPC/state 顺序。

另新增 `annotation-create-anchor-update-controller.ts`，真实接回 Wy 的 `ut` create-editor anchor update/cancel lifecycle，保留 cancel cleanup、multi-select gate、anchor serialization、IPC、viewport 与 editor state 顺序。

另新增 `annotation-interaction-reset-controller.ts`，真实接回 Wy 的 `mt` 全量 interaction reset lifecycle，保留 preview、modifier、pointer、selection、editor、generation、viewport 与 drag cleanup 顺序。

另新增 `annotation-hover-fallback-controller.ts`，真实接回 Wy 的 `tt` DOM hover/click fallback lifecycle，保留 editor/mode gate、跨 frame hit-test、anchor projection 与 hover/open 分支。

另新增 `annotation-site-request-dispatch-controller.ts`，真实接回 Wy 的 `Qe` site-annotation request dispatcher，保留 editor gate、Range text anchor 与 element anchor 两条跨 frame 路由。

另新增 `annotation-comment-preview-close-controller.ts`，真实接回 Wy 的 `$e`/`ft` preview close lifecycle，保留 host close IPC 与本地 preview state 清理顺序。

另新增 `annotation-editor-anchor-restore-controller.ts`，真实接回 Wy 的 `vt` restore-editor anchor lifecycle，保留当前 frame target map 解析与 editor state 写入。

另新增 `annotation-element-editor-open-controller.ts`，真实接回 Wy 的 `qe` create-from-element editor lifecycle，保留 DOM clear、anchor normalize、preview close、design/target、IPC 与 editor cleanup 顺序。

新增 `src/main/preload/pip-video-decoder-controller.ts`，真实接回 PIP WebCodecs registry lifecycle：关键帧建 decoder、配置 rollover、decode、error/stop/layout cleanup；`pip-video-decoder.ts` 继续持有 IPC/window bridge owner。

新增 `src/main/preload/system-theme-variant-controller.ts`，真实接回 preload 初始主题注入、document readiness observer、系统主题 IPC 更新、订阅 fan-out 与 cleanup；`index.ts` 继续持有 Electron IPC/contextBridge owner。

### 增量抽取：annotation element metadata projection

Annotation element metadata payload（原 `nd`，5120-7259 业务工具段）的 rect、颜色、字体、style
列表、尺寸与 tag 投影已迁移至 `src/main/browser-page-preload/annotation-element-metadata-projection.ts`；
DOM/style 读取通过依赖注入。新增 3 项 focused assertions，build 与 typecheck 已通过。

### 增量抽取：annotation element path policy

Annotation element ancestor tag path（原 `Sc`，3863-5049 业务工具段）的深度上限、html/body
终止与字符串拼接已迁移至 `src/main/browser-page-preload/annotation-element-path-policy.ts`；
父节点读取通过依赖注入。新增 3 项 focused assertions，build 与 typecheck 已通过。

### 增量抽取：annotation nearby-text policy

Annotation nearby text 的直接 label、语义容器回退与元素资格判定（原 `xc`，3863-5049 业务工具段）已迁移至
`src/main/browser-page-preload/annotation-nearby-text-policy.ts`；DOM 查询通过依赖注入保留。新增 3 项
focused assertions，build 与 typecheck 已通过。

### 增量抽取：annotation accessible label policy

Annotation target label 的 aria-label、文本 fallback 与 tagName 投影（原 `yc`，3863-5049
业务工具段）已迁移至 `src/main/browser-page-preload/annotation-accessible-label-policy.ts`；
读取器通过依赖注入保留。新增 3 项 focused assertions，build 与 typecheck 已通过。

### 增量抽取：annotation element label policy

Annotation element label 的 root tag fallback、文本规范化与 80 字符截断（原 `bc`，5120-7259
业务工具段）已迁移至 `src/main/browser-page-preload/annotation-element-label-policy.ts`；root
判定通过入口注入。新增 3 项 focused assertions，build 与 typecheck 已通过。

### 增量抽取：annotation document-root policy

`documentElement/body` 根节点身份判定（原 `rc`，5120-7259 业务工具段）已迁移至
`src/main/browser-page-preload/annotation-document-root-policy.ts`；入口注入当前 document
保留语义。新增 3 项 focused assertions，build 与 typecheck 已通过。

### 增量抽取：annotation anchor root policy

顶层 `html/body` element anchor 判定（原 `rd`，5120-7259 业务工具段）已迁移至
`src/main/browser-page-preload/annotation-anchor-root-policy.ts`；新增 3 项 focused assertions，
build 与 typecheck 已通过。

### 增量抽取：annotation anchor candidate score policy

Annotation anchor 候选评分（原 `gd`，5120-7259 业务工具段）的名称/附近文本/标题/路径权重与
几何距离惩罚已迁移至 `src/main/browser-page-preload/annotation-anchor-candidate-score.ts`；
DOM 查询通过依赖注入保留。新增 3 项 focused assertions，build 与 typecheck 已通过。

### 增量抽取：annotation frame document URL policy

Frame document URL 的空路径、当前页与 frame `src` 回退选择（原 `pd`，5120-7259 业务工具段）已迁移至
`src/main/browser-page-preload/annotation-frame-document-url.ts`；页面 URL 与 frame 元素判定通过
依赖注入保留。新增 3 项 focused assertions，build 与 typecheck 已通过。

### 增量抽取：annotation scroll offset policy

Text anchor 的 scrollX 偏移判定（原 `_u`，5120-7259 业务工具段）已迁移至
`src/main/browser-page-preload/annotation-scroll-offset.ts`；仅非 fixed text anchor 返回窗口
scrollX，其余返回 0。新增 3 项 focused assertions，build 与 typecheck 已通过。

### 增量抽取：annotation direct-text preview policy

Annotation direct text preview 的文本节点筛选、空白规范化与 80 字符截断（原 `vd`，5120-7259
业务工具段）已迁移至 `src/main/browser-page-preload/annotation-direct-text-preview.ts`；root
element 判定由入口注入。新增 3 项 focused assertions，build 与 typecheck 已通过。

### 增量抽取：annotation URL parser reuse

Annotation frame/document URL 的 throwing-safe parser（原 `yd`，5120-7259 业务工具段）已复用
`annotation-url-parser-policy.parseAnnotationUrl`，删除 preload 重复 try/catch 实现；既有 URL
parser focused regression、build 与 typecheck 已通过。

### 增量抽取：annotation anchor clamp reuse

Annotation anchor point 投影使用的 `bd` clamp helper（5120-7259 业务工具段）已复用
`annotation-surface-geometry.clampAnnotationCoordinate`，删除重复实现；geometry regression、
build 与 typecheck 已通过。

### 增量抽取：annotation anchor point projection policy

Annotation anchor point 到目标 rect 的比例投影（原 `hd`，5120-7259 业务工具段）已迁移至
`src/main/browser-page-preload/annotation-anchor-point-projection.ts`；保留零尺寸中心回退、
显式 x 与比例 clamp 语义。新增 3 项 focused assertions，build 与 typecheck 已通过。

### 增量抽取：annotation frame URL policy

Annotation frame URL 匹配（原 `hu`，5120-7259 业务工具段）的 optional-expected 与 exact href
判定已迁移至 `src/main/browser-page-preload/annotation-frame-url-policy.ts`；入口保留兼容委托。
新增 3 项 focused assertions，build 与 typecheck 已通过。

### 增量抽取：annotation adopted stylesheet target policy

adoptedStyleSheets 目标容器判定（原 `tu`，5120-7259 业务工具段）已迁移至
`src/main/browser-page-preload/annotation-adopted-stylesheet-target.ts`；入口保留兼容委托，
维持 Document 与带 host 的 DocumentFragment 资格边界。新增 3 项 focused assertions，build
与 typecheck 已通过。

### 增量抽取：annotation CSS highlight capability policy

CSS Highlights API 能力探测（原 `eu`，5120-7259 业务工具段）已迁移至
`src/main/browser-page-preload/annotation-highlight-capability.ts`；入口保留兼容委托，
严格检查 CSS highlights、Highlight 构造器及 CSSStyleSheet.replaceSync。新增 focused test
覆盖完整能力与缺失能力，共 2 项断言；build 与 typecheck 已通过。

### 增量抽取：annotation comment count policy

Annotation comments 的非空判定与数量投影（原 `ss/cs`，3863-5049 业务工具段）已迁移至
`src/main/browser-page-preload/annotation-comment-count.ts`；入口保留兼容委托。新增 focused
test 覆盖空/非空列表与数量，共 3 项断言；build 与 typecheck 已通过。

### 增量抽取：annotation viewport scale policy

Annotation viewport scale 的 inverse-scale fallback（原 `xs`，3863-5049 业务工具段）已迁移至
`src/main/browser-page-preload/annotation-viewport-scale.ts`；入口兼容委托保留 `null`/非正值回退
为 1 的语义。focused test 覆盖缺省、零值与正常 scale，共 3 项；build 与 typecheck 已通过。

### 增量抽取：annotation anchor equality policy

Annotation anchor 判等（原 `Fs`，3863-5049 业务工具段）的公共字段、scroll-container、
virtual/element/region/text 判别联合比较已迁移至 `src/main/browser-page-preload/annotation-anchor-equality.ts`；
入口保留兼容委托。`scripts/test-preload-annotation-anchor-equality.mjs` 覆盖 element 相等/运行时 ID
差异与 region 语义，共 3 项断言；build 与 typecheck 已通过。

### 增量抽取：annotation coordinate clamp reuse

Annotation 几何的通用数值 clamp（原 `Ps`，3863-5049 业务工具段）已接回
`annotation-surface-geometry.ts` 的 `clampAnnotationCoordinate`，消除 preload 重复实现；
现有 geometry regression（30 项）、build 与 typecheck 已通过。

### 增量抽取：annotation rect scaling reuse

Annotation tooltip/anchor 的 rect scaling helper（原 `Ms`，3863-5049 业务工具段）已接回
既有 `annotation-surface-geometry.ts` 的 `scaleAnnotationRect` 纯策略；preload 入口仅保留
兼容委托，避免重复实现。现有 geometry focused regression 覆盖 scale 的坐标与尺寸投影，
build 与 typecheck 已通过。

### 增量抽取：annotation scroll-container equality policy

Annotation anchor scroll-container 快照相等性判定（原 `Ns`，3863-5049 业务工具段）已迁移至
`src/main/browser-page-preload/annotation-scroll-container-equality.ts`；入口保留兼容委托，
对缺省列表、selector、scrollLeft/scrollTop 逐项比较。新增
`scripts/test-preload-annotation-scroll-container-equality.mjs` 覆盖 3 项 focused assertions，
build 已通过。

### 增量抽取：annotation tooltip position policy

Annotation metadata tooltip 的 anchor/viewport 几何投影（原 `Ss`，3863-4050 业务工具段）已迁移至
`src/main/browser-page-preload/annotation-tooltip-position.ts`。该纯策略保留 viewport scale、zoom
缩放、上方优先/下方回退和水平边界 clamp；入口仅保留兼容委托。`scripts/test-preload-annotation-tooltip-position.mjs`
覆盖正常、上方空间不足和右边界三项断言，build 与 typecheck 已通过。

### 增量抽取：annotation marker position policy

Annotation marker 同点横向分散策略（原 `Ts`，3863-4050 业务工具段）已迁移至
`src/main/browser-page-preload/annotation-marker-position.ts`。该纯策略按四舍五入坐标
分组、按固定间距展开并限制在 viewport 横向边界内；入口保留常量注入与兼容委托。
`scripts/test-preload-annotation-marker-position.mjs` 覆盖单点、普通重复点与左边界聚集
共 3 项断言，build 已通过。

### 增量抽取：annotation design CSS rule policy

Annotation design CSS 规则生成（原 `Cs`/`Es`/`Ds`，3863-4050 业务工具段）已迁移至
`annotation-design-styles.ts`：变更声明筛选、`!important` 规则序列化、design-group
selector 转义及多规则拼接均为纯策略；入口保留兼容委托。`scripts/test-preload-annotation-design-css.mjs`
覆盖 4 项 focused assertions，annotation runtime、build 与 typecheck 均通过。

### 增量抽取：annotation color normalization policy

Annotation design color normalization（原 `ws` 及 `Os`/`ks`/`As`/`js`，3863-4050
业务工具段）已迁移至 `src/main/browser-page-preload/annotation-color-policy.ts`。该模块
保留短/长 hex、rgb/rgba（含 alpha 百分比）解析、通道裁剪与大写 hex 输出；入口 `ws`
通过窄委托接回，未知文本仍原样返回。`scripts/test-preload-annotation-color-policy.mjs`
覆盖 5 项 focused assertions，原 annotation runtime 回归与 build/typecheck 均通过。

### 增量抽取：annotation preload initialization lifecycle

批注 preload 的 host-message listener、secure-context policy 初始化、DOMContentLoaded 一次性
挂载与 pagehide listener 注册已迁移至 `src/main/browser-page-preload/annotation-preload-lifecycle.ts`。
入口继续负责状态和副作用依赖组装；`scripts/test-preload-annotation-preload-lifecycle.mjs` 覆盖
loading/complete 文档、同源安全上下文与 listener 注册，共 8 项 focused assertions。

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

WebMCP descriptor 序列化与 descriptor 总大小/数量限制（原 30,084-30,129 行）已迁移至
`src/main/browser-page-preload/webmcp-descriptor.ts`，由协议入口注入 schema 与 policy
limits；`scripts/test-preload-webmcp-descriptor.mjs` 覆盖 schema 拒绝、inputSchema
JSON round-trip、工具数量与字节大小边界，共 5 项断言。

Annotation surface channel、feature 列表、role/id/rect/hit/response schemas
（原 6,432-6,508 行）已迁移至 `src/main/browser-page-preload/annotation-protocol.ts`。
该模块通过入口现有 schema factory 注入，原 `qd/Wd/Jd/Yd/Xd` 绑定接回；
`scripts/test-preload-annotation-protocol.mjs` 覆盖 channel、限制和 response 类型。

Annotation hit/control payload 的安全对象克隆、rect/role/id 校验、metadata 限制和序列化
（原 `Qd` 内部 6,783-6,862 行）已迁移至
`src/main/browser-page-preload/annotation-control-payload.ts`，`annotation-runtime.ts` 仅保留兼容
导出并通过窄委托接回，响应 detail payload 也由同一模块组装；`scripts/test-preload-annotation-runtime.mjs` 覆盖恶意对象、几何边界、
metadata 过滤、hit-test request 边界、annotation controls 序列化/metadata/targets、range/open-request detail、control handle lifecycle、registry payload/target parsing/index/read/pagehide lifecycle、surface element boundary、selection 渲染策略和 response JSON 形状，共 45 项行为断言。
该协议边界另由 `scripts/test-preload-annotation-control-payload.mjs` 以 20 项独立 focused assertions 覆盖，直接回归 null-prototype 克隆、恶意 descriptor/几何与 metadata 过滤、UTF-8 字节限制、hit-test request 和 response envelope。

Annotation surface 的 pagehide disposal、top-document element containment 与 selection
render gate 已迁移至 `src/main/browser-page-preload/annotation-surface-policies.ts`。
该模块仅保留不依赖 DOM 副作用的生命周期/渲染判定，`annotation-runtime.ts` 继续提供
兼容导出；`scripts/test-preload-annotation-surface-policies.mjs` 覆盖可信 pagehide、
iframe/断开元素过滤和 renderer 失败/状态变化门控，共 11 项断言。

Annotation controls registry 的生命周期实现（注册、更新、target 索引、dispose 与
可信 pagehide 清理）已迁移至 `src/main/browser-page-preload/annotation-controls-registry.ts`，
原入口 `Cf` 通过依赖注入接回；`scripts/test-preload-annotation-controls-registry.mjs`
覆盖注册、更新替换 target、覆盖顺序、dispose、target 总量限制和 pagehide 清理，共 10 项断言。
pending editor message reducer 也已迁移至 `src/main/browser-page-preload/pending-editor-message.ts`，
由 `Kb` 接回，并由 `scripts/test-preload-pending-editor-message.mjs` 覆盖 restore、close、sync
和未知消息处理，共 6 项断言。

Annotation surface feature observer（原 `Ff` 7239-7326，含 `If` 的 attachShadow hook
7327-7345）已迁移至 `src/main/browser-page-preload/annotation-surface-observer.ts`，
由 `Bb` 注入 parser、contextBridge 和 feature callback 接回；containers/metadata、shadow-root
observer、pageshow、recordUse 优先级和 dispose 由 `scripts/test-preload-annotation-surface-observer.mjs`
覆盖，共 13 项断言。

Annotation surface registry（原 `Yg` 22359-22510）已迁移至
`src/main/browser-page-preload/annotation-surface-registry.ts`，由 `t_` 接回；surface
registration、hit-test response 校验、render/cancel/clear、invalidated/disposed 和 dispose
由 `scripts/test-preload-annotation-surface-registry.mjs` 覆盖，共 9 项断言。
其 registrations、probe 去重、request counter、pending hit 与 terminal disposal 状态边界
已集中至 `annotation-surface-registry-state.ts`，并由
`scripts/test-preload-annotation-surface-registry-state.mjs` 覆盖 16 项 focused assertions。

Virtual annotation target payload（原 `n_` 22777-22800）已迁移至
`src/main/browser-page-preload/annotation-virtual-target.ts`，由设计 overlay selection
回调接回；page URL、virtual target identity、viewport point 和 rect fallback 由
`scripts/test-preload-annotation-virtual-target.mjs` 覆盖，共 6 项断言。

Surface/viewport rect clipping（原 `Qg` 22525-22535）已迁移至
`src/main/browser-page-preload/annotation-surface-geometry.ts`，由 surface registry
和入口兼容函数共同使用；viewport 边界、空交集和负坐标由
`scripts/test-preload-annotation-surface-geometry.mjs` 覆盖，共 4 项断言。
该模块同时承载 region rect union（原 `s_` 22838-22845），geometry 回归断言共 6 项。
并继续承载共享的按轴 rect intersection、rect scale、coordinate clamp 与大区域判定
（原 `A_`/`w_`/`F_`/`P_`），以及 marker 推导 viewport 和 canvas 尺寸合并
（原 `j_`/`d_`）；marker、scroll-container 和 frame 几何入口已接回，回归断言增至 30 项。

Annotation 空格键拦截策略（原 `i_` 22799-22824）已迁移至
`src/main/browser-page-preload/annotation-keyboard.ts`，由键盘 listener 入口接回；
trusted/Space、typing context、修饰键和 keydown/keyup 行为由
`scripts/test-preload-annotation-keyboard.mjs` 覆盖，共 5 项断言。

滚轮可滚动祖先选择（原 `zv`/`Bv` 23668-23689）已迁移至
`src/main/browser-page-preload/annotation-scroll-container.ts`。该模块只接收
DOM parent/style 读取器和既有轴向滚动 predicate，入口仍保留实际 scrollBy/scrollTop
副作用；`scripts/test-preload-annotation-scroll-container.mjs` 覆盖上/下边界和空起点，
共 3 项断言。

Annotation 模式的跨域 iframe pointer-events guard（原 `Vg` 22296-22354）已完整迁移至
`src/main/browser-page-preload/annotation-frame-pointer-guard.ts`。document/shadow-root 扫描、
新增节点和 load 监听、同源 frame 恢复、overlay 排除、样式所有权保护及 dispose 由 13 项断言覆盖。

Annotation overlay 的非 React runtime 尾部（原 `Jy/Yy/Xy/Zy/Qy/$y/eb/tb/nb/rb/ib`
26495-26592）已迁移至
`src/main/browser-page-preload/annotation-overlay-runtime.ts`。overlay root、hover snapshot、
当前页 design refresh、flex gap 子项、按 root 隔离的 element cache、DOM mutation、text selection、
metadata tooltip 和 region 去重均由该模块持有；原入口只保留调用点兼容代理，React `Uy/Wy/Gy/Ky/qy`
仍留在 UI 边界。`scripts/test-preload-annotation-overlay-runtime.mjs` 以 48 项行为断言覆盖该闭环。
其中 flex-container 子项 gap overlay 的目标选择、display gate、绝对定位过滤、可见 rect
和稳定 key 已进一步迁移至 `annotation-flex-gap-overlays.ts`，由
`scripts/test-preload-annotation-flex-gap-overlays.mjs` 的 7 项断言覆盖；overlay runtime
仅负责注入 DOM 依赖并保留兼容方法。

Annotation display anchor resolution（原 `Q_` 22881-22905）已迁移至
`src/main/browser-page-preload/annotation-display-anchors.ts`，入口继续注入既有 DOM resolver
与 viewport geometry；text 替换、element cache、当前页缺失 selector 过滤、additional anchor
投影和 source-index 保留由 `scripts/test-preload-annotation-display-anchors.mjs` 的 5 项断言覆盖。

Annotation site-preview layer（原 `dy/py/_y`，23543-23648）已迁移至
`src/main/browser-page-preload/annotation-preview-layer.ts`。该模块保留 preview mask 的
SVG clip-path 重建、按 element 增量维护 clip/glow DOM、border-radius 投影、viewport
尺寸缓存、stale target 清理和 dispose；dispose 进入终止态并拒绝迟到的 `update`，防止
teardown 后重新挂载 preview DOM；入口 `_y` 仅注入原 CSS、rounded-rect path 与
corner-radius 适配器。`scripts/test-preload-annotation-preview-layer.mjs` 覆盖 style/mask
装配、target 更新、圆角样式、viewport 尺寸、stale 节点清理与销毁，共 8 项断言。

Annotation comment-runtime 的异步挂载生命周期（原 `annotation-preload-runtime` 内联
mount/pending-preview/dispose 段）已迁移至
`src/main/browser-page-preload/annotation-runtime-mount.ts`。该模块保留单次挂载、异步
加载完成后的销毁竞态、pending site-preview 交接和 runtime dispose；入口只负责注入
bridge 与调用点。`scripts/test-preload-annotation-runtime-mount.mjs` 覆盖重复 mount、
preview 交接、销毁和异步竞态，共 7 项断言。

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
| 7260-7553 | `business` | annotation controls registry：`codex:register-annotation-controls`、update/dispose channel，控制项 schema、DOM MutationObserver、跨 frame target 跟踪。证据：7260-7272 常量/schema，7273-7529 `Cf` registry，7532-7551 pending editor message reducer。 | registry 生命周期已迁移至 `src/main/browser-page-preload/annotation-controls-registry.ts`，pending editor message reducer 已迁移至 `src/main/browser-page-preload/pending-editor-message.ts`，均由入口接回并有独立行为断言；仍需继续迁移后续 annotation UI/runtime 业务段。 |
| 7554-19016 | `vendor/generated` | Vite preload error wrapper（7554-7563）后为 React 19.2.7 + React DOM reconciler/runtime。证据：7565 起 `Symbol.for("react.*")`；7983、8141、18959-18973 明确版本 `19.2.7` 和 `rendererPackageName: react-dom`；19003-19015 是 React devtools hook。 | 整段保留；React reconciler 不能伪造业务源码。 |
| 19017-21896 | `vendor/generated` | TypeScript helpers、memoize、FormatJS/React Intl runtime。证据：19017 `__extends`/object spread helper；20844 `[formatjs Error`；20977、21106、21468、21649-21867 的 FormatJS API/locale fallback 文本。 | 保留 vendor；业务只依赖其公开 formatter。 |
| 21897-22290 | `vendor/generated` | React Intl 组件/provider 和 react-is compatibility layer。证据：21897-21903 React Intl assertion；21940 起 `Symbol.for("react.*")` type predicates；22266-22282 `IntlProvider`。 | 保留 vendor/runtime。 |
| 22291-26794 | `business` | 浏览器批注/设计 UI runtime：MutationObserver 监控 annotation containers/shadow roots、selection/scroll/viewport、draft marker 和 React UI component。证据：22291-22334 DOM observer；22351-22455 design control sync/reset；23900-23955 marker/metadata UI；23961-24007 scroll routing；24525-24667 animation/controls observer；26495-26592 overlay helper。 | overlay 非 React helper 已迁移至 `annotation-overlay-runtime.ts`；React render/hook assembly 与其余业务段继续按闭环迁移。 |
| 26795-26881 | `business` | frame/anchor resolution、overlay styles 和 browser comment runtime mounting prerequisites；使用 `requestAnimationFrame`、`MutationObserver`、document style attributes。 | 与 22291-26794 同一业务闭环。 |
| 26882-27185 | `business` | Electron IPC 生命周期和 context state：policy 初始化、feature resources、lazy mount、host bridge、pending replay、permission、pagehide cleanup，以及 drag/mouse navigation。 | 整个 annotation preload IPC/context 生命周期已迁移至 `annotation-preload-runtime.ts`，并复用已拆出的 permission/context/routing/input 模块；原 `Bb/Vb/Hb/Ub/Wb/Kb/qb/Yb` 与私有状态已删除。 |
| 27187-27294 | `business` | 浏览器扩展发行配置（Chrome/Edge dev/internal/prod、extension IDs、store URLs）。 | 配置数据可迁移为 typed constants；不得归类为通用 vendor。 |
| 27295-27470 | `business` | WebMCP registry shim：tool name/description/schema 校验、AbortSignal 生命周期、JSON-serializable execute/getTools/registerTool API。证据：27295-27440 registry；27442-27469 secure-context/name/result validation。 | 已完整迁移至 `webmcp-registry.ts`；被导入遮蔽的旧 `dx/fx/px/mx/hx` 实现已删除，并补齐 input JSON round-trip/context 可变性回归。 |
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
3. Annotation feature policy 初始化、controls/request/observer 创建与 dispose 已迁移至
   `src/main/browser-page-preload/annotation-feature-lifecycle.ts`；入口仅保留 state wiring、
   host message routing 与页面生命周期。11 项 focused assertions 覆盖 enable/disable、
   permission reset、所有 disposable 子系统清理及 disabled policy 分支。
4. 26912-27185 与 30132-30217 不适合先做局部 identity wrapper：它们依赖
   状态机、listener cleanup 和 contextBridge 隔离世界，必须在同一迁移批次中
   保持 channel 字符串、消息 allowlist、pagehide 行为和启动顺序。
5. 本报告没有证明 vendor 以外的业务段已经语义化；因此本报告不能作为
   `browser-page-preload` REWRITTEN 的证据，只能作为 A2 审计第一阶段交付物。

## 可复核命令

```bash
wc -l src/main/browser-page-preload.ts
rg -n 'contextBridge|ipcRenderer|Zod|react-dom|formatjs|uuidjs|WebMCP' src/main/browser-page-preload.ts
nl -ba src/main/browser-page-preload.ts | sed -n '26882,27217p'
nl -ba src/main/browser-page-preload.ts | sed -n '30084,30217p'
```

Annotation overlay 的 HTTP(S) loopback/`.localhost` URL 判定已迁移至
`src/main/browser-page-preload/local-url.ts`，原 `qg` 入口保留兼容调用面；该安全
边界由 `scripts/test-preload-local-url.mjs` 覆盖。

Annotation region drag 的 viewport 判定、drag threshold、双点 rect 与状态推进已迁移至
`annotation-surface-geometry.ts`；原全局 `Is/Ls/Rs` 与 UI 尾部 `ab/ob/sb/cb` 已删除。

### 增量抽取：annotation serialization boundary

批注名称规范化、metadata 的 prototype/descriptors/key/value/UTF-8 大小校验，以及属性
metadata JSON 解析已迁移至 `src/main/browser-page-preload/annotation-serialization.ts`。
入口仅保留 `Xo/Zo/Qo/$o` 兼容代理并注入原 Zod parsers；`scripts/test-preload-annotation-serialization.mjs`
覆盖名称、继承对象、非法 key、key 数量、JSON/字节上限等 11 项断言。
### 增量抽取：Google Docs context helpers

Google Docs/Sheets URL 识别、文档/表格 ID 与 tab 参数解析、标题/选中文本规范化，
以及 document context payload 组装（原 3966-4021、5162-5184）已迁移至
`src/main/browser-page-preload/google-docs-context.ts`。入口保留 `hs/gs/_s/vs/ys/bs`
兼容别名并委托 helper；9 项行为断言覆盖普通/发布 URL、query/hash tab、跨域拒绝、
Sheets ID 和 context 文本规范化。

### 增量抽取：annotation document context

文档上下文运行时（原 `Xl`，5162-5184）已迁移至
`src/main/browser-page-preload/annotation-document-context.ts`。该模块保留 Google Docs
判定、跨 window selection 与 active input selection 回退、frame document 安全访问、
可见文本 TreeWalker 过滤、viewport 相交判断和 2,000 字符上限；入口通过依赖注入保留
原 `Xl` API 与 `isGoogleDocsAnchor` 静态判定。`scripts/test-preload-annotation-document-context.mjs`
覆盖 element/region context、跨域拒绝、selection 回退和可见文本采样，共 14 项断言。

### 增量抽取：annotation surface element boundary

annotation surface 注册与 MutationObserver 清理共用的顶层元素判定已迁移为
`isValidAnnotationSurfaceElement`：要求 HTMLElement、非 iframe、已连接、归属
当前 document 且 root node 为当前 document。压缩入口仅保留注册生命周期、事件
调度与回调执行；该策略由 annotation runtime 回归断言覆盖。

Annotation shadow-root discovery observer（原 `Ng` 22064-22116）已迁移至 `src/main/browser-page-preload/annotation-shadow-root-observer.ts`，保留动态 shadow-root 注册、失效清理、annotation selector 变更通知与 attachShadow 事件监听；由 `scripts/test-preload-annotation-shadow-root-observer.mjs` 覆盖 4 项断言。

Annotation surface IPC event dispatch/response-event 判定（原 `Xg` 22415-22417 及其 `Yg` 注入）已迁移至 `src/main/browser-page-preload/annotation-surface-events.ts`，保留 bubbling、JSON detail 序列化和 `CustomEvent` 类型判定；由 `scripts/test-preload-annotation-surface-events.mjs` 覆盖 5 项断言。

Annotation editor default-mode meta lookup（原 `Iy` 24484-24492）已迁移至 `src/main/browser-page-preload/annotation-editor-default-mode.ts`，保留 meta selector、允许值过滤及缺失 head/content 的安全回退；由 `scripts/test-preload-annotation-editor-default-mode.mjs` 覆盖 3 项断言。

Annotation overlay 的条件 class-name 归一化与拼接（原 `cv/lv` 23340-23356）已迁移至
`src/main/browser-page-preload/annotation-class-names.ts`；两个 cursor 组件改用语义入口，
原压缩 helper 已物理删除。`scripts/test-preload-annotation-class-names.mjs` 以 9 项断言覆盖
字符串/数字、递归数组、对象 map、falsey 过滤、非支持 primitive 与原有 `for-in` 语义。

Annotation controls 的 running-animation ancestor/frame 判定（原 `Dy` 24375-24386）已迁移至
`src/main/browser-page-preload/annotation-motion.ts`；入口仅保留 DOM 依赖适配，
`scripts/test-preload-annotation-motion.mjs` 覆盖自身、ancestor、frame、idle 与 null 边界。

Annotation controls 的 candidate/frame 稳定性判定（原 `Ey` 24365-24373）已迁移至
`src/main/browser-page-preload/annotation-frame-stability.ts`；入口注入 anchor/frame 依赖，
由 `scripts/test-preload-annotation-frame-stability.mjs` 覆盖顶层、嵌套 frame、anchor mismatch、
非 iframe 与 null 边界。

Annotation controls 的 containment ancestor 判定（原 `Oy` 24383-24410）已迁移至
`src/main/browser-page-preload/annotation-containment.ts`；入口注入 DOM/CSS 依赖，
由 `scripts/test-preload-annotation-containment.mjs` 覆盖祖先命中、无关 target、position/contain 边界与 null。

Annotation design draft text 的最新变更选择（原 `Zv` 23790-23796）已迁移至
`src/main/browser-page-preload/annotation-draft-text.ts`；入口保留 DOM 更新副作用，
由 `scripts/test-preload-annotation-draft-text.mjs` 覆盖空输入、未变化项、倒序选择与缺失 previous 值。

Annotation design draft target 收集与缓存（原 `Jv` 23394-23413）已迁移至
`src/main/browser-page-preload/annotation-draft-runtime.ts`；入口保留 draft attribute
写回和已存在 DOM 节点清理，模块注入 frame/document、URL、target resolver 与连接状态
适配器，维持跨 frame/page 过滤、target cache 复用及同一元素多 draft attribute 合并。
由 `scripts/test-preload-annotation-draft-runtime.mjs` 覆盖 target 聚合、frame/page
过滤和 cache 复用，共 4 项行为断言。

Annotation design draft attribute token 解析（原 `ny` 23797-23802）已迁移至
`src/main/browser-page-preload/annotation-attribute-tokens.ts`；入口保留属性读写副作用，
由 `scripts/test-preload-annotation-attribute-tokens.mjs` 覆盖缺失、空值与多空白 token。

Annotation design snapshot 的字段投影（原 `cy` 23871-23888）已迁移至
`src/main/browser-page-preload/annotation-design-snapshot.ts`；入口保留 live annotation 编排，
由 `scripts/test-preload-annotation-design-snapshot.mjs` 覆盖稳定字段投影与纯函数重入。

Annotation design target label 生成（原 `ly` 23889-23896）已迁移至
`src/main/browser-page-preload/annotation-target-label.ts`；入口注入 accessible-label 解析，
由 `scripts/test-preload-annotation-target-label.mjs` 覆盖 tag fallback、可访问名称与空标签。

Annotation pointer wheel delta 归一化（原 `Lv` 23669-23675）已迁移至
`src/main/browser-page-preload/annotation-wheel-delta.ts`；入口保留滚动副作用，
由 `scripts/test-preload-annotation-wheel-delta.mjs` 覆盖 line/page/pixel 三种 delta mode。

Annotation scroll boundary 方向判定（原 `Vv` 23704-23707）已迁移至
`src/main/browser-page-preload/annotation-scroll-boundary.ts`；入口保留容器滚动副作用，
由 `scripts/test-preload-annotation-scroll-boundary.mjs` 覆盖起点、终点、可滚动与 zero delta。

Annotation overflow 值判定（原 `tc/nc` 4244-4249）已迁移至
`src/main/browser-page-preload/annotation-overflow.ts`；入口的 frame clipping 与 scroll-container
判定改用语义入口，原 helper 已物理删除；由 `scripts/test-preload-annotation-overflow.mjs` 覆盖
scrollable/clipping/visible 三类值。

Annotation theme variant 读取（原 `f_` 22830-22832）已迁移至
`src/main/browser-page-preload/annotation-theme.ts`；入口仅注入 window.matchMedia，
由 `scripts/test-preload-annotation-theme.mjs` 覆盖 dark/light 与缺失 matchMedia。

Annotation viewport size 读取（原 `p_` 22833-22835）已迁移至
`src/main/browser-page-preload/annotation-viewport.ts`；入口仅注入 window 尺寸，
由 `scripts/test-preload-annotation-viewport.mjs` 覆盖正常与零尺寸。

Annotation viewport state 读取（原 `C_` 22902-22913）已迁移至
`src/main/browser-page-preload/annotation-viewport-state.ts`；入口仅注入 window/visualViewport，
由 `scripts/test-preload-annotation-viewport-state.mjs` 覆盖基础、偏移与默认 visual viewport。

Annotation viewport override 合并（原 `g_` 22858-22860）已迁移至
`src/main/browser-page-preload/annotation-viewport-override.ts`；入口保留布局编排，
由 `scripts/test-preload-annotation-viewport-override.mjs` 覆盖 null identity、尺寸覆盖与非变异。

### 增量抽取：annotation text input target

Annotation 文本输入目标的 `HTMLInputElement` 类型白名单与 `HTMLTextAreaElement` 判定（原 `Ju`）
已迁移至 `src/main/browser-page-preload/annotation-input-target.ts`；入口仅保留兼容委托，
由 `scripts/test-preload-annotation-input-target.mjs` 覆盖 6 项行为断言。

### 增量抽取：annotation range selection validation

DOM Range 的文本节点遍历、selection offset 边界、`assignedSlot`/parent fallback 与可见性
判定（原 `Od`，6226-6270）已迁移至
`src/main/browser-page-preload/annotation-range-validation.ts`。入口只注入浏览器 DOM
适配器和既有 `B` 可见性策略，保留 range/intersectsNode 语义；
`scripts/test-preload-annotation-range-validation.mjs` 覆盖多文本节点、不可见父节点和
range 根为文本节点三项行为断言。该边界不包含 React/vendor runtime，也不移动选择状态机
或 DOM 副作用。

### 增量抽取：annotation target element resolution

Annotation 命中目标元素的 parent 链解析与可交互/文本区域阈值判断（原 `sl/cl`，4690-4714）
已迁移至 `src/main/browser-page-preload/annotation-target-element-resolver.ts`。入口仅注入
owner document、DOM parent/rect、tag/role 和既有文本标签读取器；目标选择、副本 fallback
和 48x24/24x16 阈值保持不变。`scripts/test-preload-annotation-target-element-resolver.mjs`
覆盖小尺寸按钮、文本容器 fallback 和无目标三项行为断言。

### 增量抽取：annotation selector generation

Annotation 元素 selector 生成（原 `Oc`，4415-4441）已迁移至
`src/main/browser-page-preload/annotation-selector-generator.ts`。该 helper 保留 id、
class、同标签 `nth-of-type`、shadow-root 唯一性检查和四层普通路径限制；入口只注入
DOM 读取器、CSS token escape 与既有 unique-selector predicate。由
`scripts/test-preload-annotation-selector-generator.mjs` 覆盖 id、unique 和 class fallback
三项行为断言。

### 增量抽取：annotation hit target resolution

Annotation frame/DOM 命中目标的 ancestor 解析（原 `il`，4620-4655）已迁移至
`src/main/browser-page-preload/annotation-hit-target-resolver.ts`。该 helper 保留
`oai-annotatable` 的 viewport/point/checkVisibility 过滤、text-container 的 `null`、
普通 container 的 documentElement fallback，以及未命中时的 `undefined` 三态协议；入口
仅注入 DOM/frame 读取器。`scripts/test-preload-annotation-hit-target-resolver.mjs`
覆盖命中、点位越界 fallback 和 text-container 三项行为断言。

### 增量抽取：annotation frame hit testing

Annotation 点命中在 shadow root 与 iframe 间递归解析（原 `lc/cc`，4197-4220）已迁移至
`src/main/browser-page-preload/annotation-frame-hit-test.ts`。该 helper 保留 frame policy
回调的 `undefined` 继续递归、`null` denied sentinel、iframe rect 坐标换算和 shadow-root
命中优先级；入口仅注入 DOM/frame 读取器。`scripts/test-preload-annotation-frame-hit-test.mjs`
覆盖 iframe 递归、policy deny 和 shadow-root 三项行为断言。

### 增量抽取：annotation frame tree traversal

Annotation iframe/shadow-root 元素递归与窗口去重遍历（原 `zc/uc`，4524-4540）已迁移至
`src/main/browser-page-preload/annotation-frame-tree.ts`。该 helper 保留 shadow-root 深度
遍历、iframe 顺序、窗口 Set 去重和缺失 document/window 的跳过语义；入口仅注入 DOM/frame
读取器。`scripts/test-preload-annotation-frame-tree.mjs` 覆盖嵌套 frame、shadow frame 和
循环窗口三项行为断言。

### 增量抽取：annotation shadow selector resolution

跨 shadow-root 的 `shadow:selector>>>selector` 解析（原 `Ec`，4382-4392）已迁移至
`src/main/browser-page-preload/annotation-shadow-selector-resolver.ts`；入口保留普通 selector
兼容、逐级 shadowRoot 校验和最终 element 类型边界。focused test 覆盖 shadow 链、普通
selector 与缺失终点三项行为。

### 增量抽取：annotation container ancestor resolution

Annotation text/container ancestor 查找（原 `rl`，4572-4581）已迁移至
`src/main/browser-page-preload/annotation-container-ancestor.ts`；入口通过 composed parent
适配器接回，保留 text-container 元素、普通 container/未命中 `null` 协议。focused test
覆盖三项行为。

### 增量抽取：annotation scroll-container discovery

从命中元素向 composed parent 链收集 scroll-container descriptor（原 `Mc`，4428-4441）
已迁移至 `src/main/browser-page-preload/annotation-scroll-container-discovery.ts`。入口保留
selector 生成和 clipping policy 注入，`Pc` 的事件监听副作用仍留在 preload；focused test
覆盖 includeElement、selector/offset 收集和无 clipping 三项行为。

### 增量抽取：annotation scroll listener lifecycle

Annotation scroll-container listener 注册与 cleanup（原 `Pc`，4457-4468）已迁移至
`src/main/browser-page-preload/annotation-scroll-listener.ts`。该模块保留 frame-path 过滤、
descriptor selector 解析、Set 去重和成对移除 listener；入口只注入 frame/DOM 查询与事件
适配器。focused test 覆盖去重注册与 cleanup。

### 增量抽取：annotation visibility predicate

批注 selection 使用的 visibility/display/content-visibility/opacity ancestor predicate
已迁移至 `src/main/browser-page-preload/annotation-visibility.ts`；入口仅注入
`getComputedStyle` 与 parent traversal，`scripts/test-preload-annotation-visibility.mjs`
覆盖可见、隐藏祖先和自身 visibility 边界，共 3 项断言。

### 增量抽取：annotation preview rounded geometry

annotation feature preview 的 CSS 圆角解析、半径缩放/约束和 SVG rounded-rect path
组装已迁移至 `src/main/browser-page-preload/annotation-preview-geometry.ts`。入口仅保留
SVG DOM 节点创建与 backdrop 更新副作用，`scripts/test-preload-annotation-preview-geometry.mjs`
覆盖百分比/像素圆角、双值半径、超界缩放和最终 path 语义，共 3 项断言。

### 增量抽取：annotation preview visibility boundaries

annotation feature preview 的 fullscreen、modal、popover 可见性边界选择已迁移至
`src/main/browser-page-preload/annotation-preview-visibility.ts`。入口仅注入既有的
composed-parent、element 与 frame/window 适配器；模块保留跨 shadow root/frame 的 ancestor
判定、top-modal 选择及 popover 矩形遮挡语义，`scripts/test-preload-annotation-preview-visibility.mjs`
覆盖 modal 内外目标与边界过滤，共 3 项断言。

### 增量抽取：annotation preview observer/RAF scheduler

annotation feature preview 的 ResizeObserver/IntersectionObserver candidate queue、RAF 调度和
dispose cleanup 已迁移至 `src/main/browser-page-preload/annotation-preview-scheduler.ts`。入口仍注入
页面元素判定与 frame callback，并保留 MutationObserver、跨 frame 观察和 controls registry wiring；
模块负责候选集合与可见集合的一致性、observer 回调触发 invalidate，以及取消待处理 RAF。
`scripts/test-preload-annotation-preview-scheduler.mjs` 覆盖 candidate 注册、intersection/resize
触发、RAF 执行和 observer cleanup，共 5 项断言。

### 增量抽取：annotation request context validation

open-annotation 的 secure-context/active-editor 门控、serialized Range 重建、目标元素与
viewport 可见性校验已迁移至 `src/main/browser-page-preload/annotation-request-context.ts`。
入口仍负责事件 payload 与页面运行时适配；模块保留 Range 文本一致性、排除元素、frame/owner
document 和 open-tweaks 权限语义。`scripts/test-preload-annotation-request-context.mjs`
覆盖权限矩阵、Range 重建、元素/Range 可见性与边界拒绝，共 8 项断言。

### 增量抽取：annotation design-control preview sync

design-control preview 的目标索引、当前/原始视图值切换、虚拟 target key、跨 frame/page
有效性校验和旧 preview 的 reset 差分已迁移至
`src/main/browser-page-preload/annotation-design-control-sync.ts`。入口 `Rg` 仅注入页面 URL、
frame document、默认 control 值和 `CustomEvent` dispatch 适配器；DOM 事件副作用与 React
component assembly 仍保留在入口边界。`scripts/test-preload-annotation-design-control-sync.mjs`
覆盖初次 preview、幂等同步、original-view 回退、stale/reset、断开 target、URL 失配、virtual
target 和 agent-control 清理，共 8 项断言。

### 增量抽取：annotation open-request IPC lifecycle

`codex:open-annotation` 的 permission/pending request 生命周期已迁移至
`src/main/browser-page-preload/annotation-site-requests.ts`。模块保留同步与异步 permission
结果的竞态保护、subscriber 延迟挂载、Escape/pagehide 清理、BFCache pageshow 恢复，以及
dispose 时的四个 DOM listener 移除；入口仅保留事件 payload/target/range 解析和既有
`Dd` 语义适配。`scripts/test-preload-annotation-site-requests.mjs` 覆盖 listener 注册与
清理、permission resolve/reject、pagehide/keydown 竞态、stale-state 重验证和 subscriber
重放，共 12 项断言。

### 增量抽取：annotation request permission/context policy

`codex:open-annotation` 的 secure-context、agent/editor 状态门控，以及 element/range target
的 owner-document、连接状态、viewport 可见性、range 文本与序列化路径重建已迁移至
`src/main/browser-page-preload/annotation-request-context.ts`。入口仅注入页面 DOM、可见矩形、
range anchor 与既有 selection-validation 适配器；`annotation-site-requests.ts` 继续负责
permission pending、subscriber、pagehide 与 IPC 生命周期。`scripts/test-preload-annotation-request-context.mjs`
覆盖 permission gate、range path 重建/拒绝、element center/offscreen/excluded 以及 range
viewport/text 校验，共 8 项断言。

### 增量抽取：annotation anchor state/payload transformations

批注 anchor 的 element/region/virtual/text 状态构造、live selection 包装、editor payload
投影、状态拆分/合并、元素重解析与 selection 替换已迁移至
`src/main/browser-page-preload/annotation-anchor-state.ts`。入口仅保留页面 DOM 查找、主题/viewport
读取和 anchor refresh 适配；React marker/render 编排仍留在原边界。`scripts/test-preload-annotation-anchor-state.mjs`
覆盖四类 anchor、additional selection、payload element、state merge、live-element fallback
和 primary replacement，共 10 项断言。

### 增量抽取：annotation preload bridge IPC/context boundary

preload 与挂载后的批注 runtime 之间的 bridge 已迁移至
`src/main/browser-page-preload/annotation-preload-bridge.ts`。模块集中负责 host-message
订阅/重放、pending editor/text-selection 缓冲、control target 查询，以及 editor 生命周期
消息到 IPC 的转发；入口继续注入 state、registry 和 request queue，保持原有权限与销毁语义。
`scripts/test-preload-annotation-preload-bridge.mjs` 覆盖缓冲重放、editor 状态转发、request
清理和 capability gate，共 7 项断言。

### 增量抽取：annotation host-message dispatcher

host 到 preload 的批注消息动作（permission、preview、sync、selection、editor queue/close）已迁移至
`src/main/browser-page-preload/annotation-host-message-dispatcher.ts`。dispatcher 只负责动作到
bridge/runtime 回调的协议映射，状态、权限对象与页面生命周期仍由
`annotation-preload-runtime.ts` 持有，避免把副作用错误地提升为全局状态。由
`scripts/test-preload-annotation-host-message-dispatcher.mjs` 覆盖 7 项行为断言，包括 capability
gate、sync payload 和 editor queue 清理。

### 增量抽取：annotation anchor/frame geometry

批注 overlay 使用的 frame/scroll-container clipping、跨 frame element geometry、region anchor
构造、marker viewport point 与缩放后的 box style 已迁移至
`src/main/browser-page-preload/annotation-anchor-geometry.ts`。入口仅保留既有 DOM/frame 依赖的
注入和兼容函数名委托；跨 frame、scroll offset、viewport clamp 与 box style 语义由
`scripts/test-preload-annotation-anchor-geometry.mjs` 覆盖，共 3 项断言。

### 增量抽取：annotation selection control boundary

指针选区控制元素门控（原 `By`）已迁移至
`src/main/browser-page-preload/annotation-selection.ts`。模块只负责沿 DOM 父链识别
`input/button/select/audio/video` 并委托 text-input 判定；入口保留 `By` 兼容包装，
由 `scripts/test-preload-annotation-selection.mjs` 覆盖普通节点、文本输入、原生按钮和
嵌套节点共 4 项断言。

### 增量抽取：annotation page URL identity boundary

批注 anchor、frame 路由与草稿 marker 共用的页面 URL 解析及同页判定已迁移至
`src/main/browser-page-preload/annotation-url.ts`。模块保留 HTTP(S) 的 origin/path/query
比较、file URL 的 pathname/query 比较、hash 忽略和无效/opaque URL 的精确回退；入口只保留
`fd`/`md` 兼容委托。`scripts/test-preload-annotation-url.mjs` 覆盖协议、query、hash、file
路径和 invalid URL 边界，共 8 项断言。

### 增量抽取：annotation mode controller boundary

批注模式 API 的跨世界 listener 安装、可用性门控、使用事件转发与 dispose 清理（原 `$d`
协调器）已迁移至 `src/main/browser-page-preload/annotation-mode-controller.ts`。入口仅保留
`contextBridge.executeInMainWorld`、原有 `ef` controls 注册器和 DOM event 适配；模块测试覆盖
controls 注册失败、main-world listener 安装、事件转发及 dispose 后的 late event，共 5 项断言。

### 增量抽取：annotation pointer selection controller

批注拖拽文本选区的 pointer lifecycle（原 `Ry` 23897-23945）已迁移至
`src/main/browser-page-preload/annotation-pointer-selection.ts`。模块只协调跨 frame
命中、selection highlight、cursor/selection 样式、pointer-id 与 trusted-event 门控，入口
继续注入既有 DOM/frame 适配器和副作用；`scripts/test-preload-annotation-pointer-selection.mjs`
覆盖拖拽开始/移动/结束、selection 回传、highlight 清理及 blocked target，共 11 项断言。

### 增量抽取：annotation preview controller boundary

批注站点预览的替换与销毁生命周期（原 `wy` 23562-23571）已迁移至
`src/main/browser-page-preload/annotation-preview-controller.ts`。模块仅负责当前预览的
单实例 dispose、替换挂载和对象/函数两种 teardown 形态；dispose 后控制器进入终止态，拒绝
后续预览挂载，避免 pagehide 后异步回调重新创建 overlay。DOM overlay、observer、RAF 调度与
渲染副作用仍由既有 `Ty`/preview layer 负责。`scripts/test-preload-annotation-preview-controller.mjs`
覆盖预览替换、空值清理、显式 dispose、对象 teardown 与终止态，共 6 项断言。

### 增量抽取：annotation display selection projection

批注 overlay 的 additional-selection 投影（原 `J_` 22849-22873）已迁移至
`src/main/browser-page-preload/annotation-display-selections.ts`。模块只负责
resolved anchor 的 live rect 选择、可见区域裁剪、class/page 标记、稳定 key 与
selection index；DOM/frame 解析和 geometry 仍由入口注入，避免将 React render assembly
提升到独立模块。`scripts/test-preload-annotation-display-selections.mjs` 覆盖 element、
region、virtual 三类 selection、clip/no-clip、border radius、source index 与 page marker，
共 7 项断言。

### 增量抽取：annotation design styles boundary

设计批注的 computed-style 声明收集、声明合并、direct-text draft、style provenance
投影和 create/edit/design target 匹配已迁移至
`src/main/browser-page-preload/annotation-design-styles.ts`。入口仅保留原 `ls/us/ds/fs/ps/ms`
兼容委托；DOM 文本读取仍由入口提供元素对象，React render 与设计变更副作用未移入该模块。
`scripts/test-preload-annotation-design-styles.mjs` 覆盖样式值归一化、previousValue 保留、
混合文本拒绝、provenance 投影和三种 target mode，共 9 项断言。

Annotation design-editor state projection（原 `sy/cy`）已迁移至
`src/main/browser-page-preload/annotation-design-editor-state.ts`。模块集中负责 design target
的 stable id、anchor/control/declaration/text/provenance/label 投影，以及 virtual target 的
安全回退；入口仍注入 DOM snapshot、control value 和 target-label 读取，React render/hook
assembly 与副作用保持在原边界。`scripts/test-preload-annotation-design-editor-state.mjs`
覆盖 element/virtual target、stable id、text/provenance/label 与 viewport/theme 字段，共 6 项断言。

### 增量抽取：annotation host sync state boundary

批注 host sync 消息对能力关闭、agent 控制清理、preview/request 清理以及 comment-mode
transition 的状态编排已迁移至 `src/main/browser-page-preload/annotation-sync-state.ts`。
入口仅注入既有 feature lifecycle、runtime mount 和状态解析器，仍保留 DOM event dispatch
等副作用；`scripts/test-preload-annotation-sync-state.mjs` 覆盖正常模式切换、能力关闭和
agent 控制清理，共 7 项行为断言。

### 增量抽取：annotation pagehide lifecycle boundary

annotation preload 的 pagehide 生命周期已迁移至 `src/main/browser-page-preload/annotation-pagehide.ts`。
模块保留 preview 总是清理、trusted 事件才重置权限、persisted 页面不销毁，以及最终销毁时的
feature/runtime dispose、DOMContentLoaded 与 host-message listener 移除顺序；入口仅注入既有
runtime/feature 副作用。`scripts/test-preload-annotation-pagehide.mjs` 覆盖不可信、persisted、
正常销毁与空事件四类边界，共 8 项断言。

### 增量抽取：annotation event detail boundary

批注 range/open-request detail 的稳定 payload 组装，以及 CustomEvent detail/own-property
读取已迁移至 `src/main/browser-page-preload/annotation-event-details.ts`。入口的
`annotation-runtime.ts` 仅保留兼容 re-export；该边界不改变事件副作用或 React/UI 编排，
由 `scripts/test-preload-annotation-event-details.mjs` 覆盖 range/open-request 投影、
own-property 防原型污染读取与空 detail 回退，共 6 项断言。

### 增量抽取：annotation metadata tooltip projection

annotation hover metadata tooltip 的 tag、size、color、font 行投影已迁移至
`src/main/browser-page-preload/annotation-metadata-tooltip.ts`；React surface 仅保留
本地化文案、布局与 DOM 渲染，`Nv` 组件通过语义模块消费稳定行模型。由
`scripts/test-preload-annotation-metadata-tooltip.mjs` 覆盖空快照、行顺序、值保留与
存在性判定，共 5 项断言。

### 增量抽取：annotation overlay mutation observer lifecycle

annotation overlay 对页面 DOM 的 mutation 监听、overlay 自身 mutation 过滤与幂等 teardown 已迁移至
`src/main/browser-page-preload/annotation-overlay-observer.ts`；`annotation-overlay-runtime.ts` 只保留
依赖适配和兼容调用入口。`scripts/test-preload-annotation-overlay-observer.mjs` 覆盖 observer 注册、
overlay 内部过滤、页面 mutation、空批次、非 Node target、幂等 dispose 与 dispose 后回调抑制。

### 增量抽取：annotation overlay region suppression policy

overlay runtime 在 editor 创建 region 时对重叠 annotation 的隐藏判定已迁移至
`src/main/browser-page-preload/annotation-overlay-policies.ts`。模块只接收 editor
selection 与 anchor equality 适配器，覆盖 active annotation、text editor、create/edit
模式及 additional anchors；`scripts/test-preload-annotation-overlay-policies.mjs`
提供 7 项 focused assertions。

### 增量抽取：annotation anchor viewport policy

annotation anchor 的当前页面判定（含 Google Docs anchor 兼容）与大矩形阈值策略已迁移至
`src/main/browser-page-preload/annotation-anchor-viewport-policy.ts`；原 preload 仅保留页面
URL/DOM 依赖注入，`scripts/test-preload-annotation-anchor-viewport-policy.mjs` 覆盖 Google Docs、
同页/异页、空 anchor 与 viewport 阈值边界，共 7 项断言。

### 增量抽取：annotation surface feature state

surface observer 对 containers、metadata 与 metadata-with-targets 的 feature 归并和互斥切换已迁移至
`src/main/browser-page-preload/annotation-surface-feature-state.ts`。该模块只处理计数/请求状态到
稳定 feature 列表的纯转换；DOM/ShadowRoot MutationObserver、副作用清理和 feature 广播仍由
`annotation-surface-observer.ts` 负责。`scripts/test-preload-annotation-surface-feature-state.mjs`
覆盖首次启用、metadata target 切换、请求保活、清空和幂等路径，共 10 项断言。

### 增量抽取：annotation interaction path policy

批注指针运行时对 overlay root、interaction blocker 和 marker composed-path 的判定已迁移至
`src/main/browser-page-preload/annotation-interaction-policy.ts`。该模块只接收元素/ShadowRoot/
event path 适配器，入口保留 DOM 类型判断与历史 `gl`/`Cl`/`xl` 兼容代理；
`scripts/test-preload-annotation-interaction-policy.mjs` 覆盖 root、ancestor、shadow-host、
blocker 与 marker 边界，共 8 项 focused assertions。

### 增量抽取：annotation editor view-state boundary

批注编辑器从 pointer 命中创建 anchor state，以及当前页面/可见裁剪失败时的 placement
回退已迁移至 `src/main/browser-page-preload/annotation-editor-view-state.ts`。模块仅接收
viewport、DOM rect、anchor builder 和 clipping 适配器；原 preload 的 `tv`/`nv` 入口保留
浏览器依赖注入。`scripts/test-preload-annotation-editor-view-state.mjs` 覆盖 fixed anchor、
viewport/theme 投影、同页保留、异页回退和不可见时跳过 clipping，共 7 项断言。

### 增量抽取：annotation marker view-state boundary

批注 marker、草稿 anchor 与编辑 comment 的 viewport/theme/marker-point 投影已迁移至
`src/main/browser-page-preload/annotation-marker-view-state.ts`。模块仅接收 viewport、DOM
rect、live-element 和 anchor resolver 适配器；原 preload 的 `rv`/`iv`/`av`/`ov` 入口保留
兼容代理及浏览器副作用。`scripts/test-preload-annotation-marker-view-state.mjs` 覆盖
element、region、design draft、additional-anchor projection、comment 缺失与主题回退，共 12 项 focused assertions。

### 增量抽取：annotation UI mode state boundary

React annotation surface 使用的 `annotationUiModePolicy` 状态投影已集中至
`src/main/browser-page-preload/annotation-ui-mode-policy.ts`。模块只负责 interaction mode、
suspended 与 capability flag 的稳定归一化：suspended 仅在 comment mode 生效，capability
字段只接受严格布尔值并对 null/malformed state 安全回退；React/render 与事件副作用仍留在
原 preload 边界。`scripts/test-preload-annotation-ui-mode-policy.mjs` 覆盖 comment/browse、
null、malformed 输入，共 5 项 focused assertions。

### 增量抽取：annotation sync transition lifecycle

Region overlay/highlight class policy 已迁移至 `src/main/browser-page-preload/annotation-region-class-policy.ts`；
Google Docs 当前页与大矩形门控通过注入式依赖复用，入口保留渲染副作用。由
`scripts/test-preload-annotation-region-class-policy.mjs` 覆盖 overlay/highlight 正常与回退边界。

host sync 对 capability 关闭、agent 控制、comment/suspended 退出，以及 marker/selection 清理的
生命周期门控已迁移至 `src/main/browser-page-preload/annotation-sync-transition.ts`。现有
`annotation-sync-state.ts` 仅负责调用该策略并执行注入的 dispose/clear 副作用；由
`scripts/test-preload-annotation-sync-transition.mjs` 覆盖正常、能力关闭、暂停、browse 与空消息边界，
共 19 项 focused assertions。

### 增量抽取：annotation preload lifecycle state boundary

preload runtime 跨回调共享的 `destroyed`、permission、site feature capability 与 active-editor
标志已迁移至 `src/main/browser-page-preload/annotation-preload-state.ts`。模块严格归一化布尔
状态并提供隔离 snapshot；runtime 继续负责 feature/runtime/DOM 副作用编排。由
`scripts/test-preload-annotation-preload-state.mjs` 覆盖默认状态、状态更新、snapshot 隔离与
销毁复位，共 12 项 focused assertions。

### 增量抽取：annotation overlay element-cache lifecycle

overlay runtime 按 root host 维护的 element cache 及其 dispose 清理边界已迁移至
`src/main/browser-page-preload/annotation-element-cache.ts`。模块负责缓存复用、统一清空与
销毁后隔离新缓存；overlay runtime 继续注入 DOM 解析和渲染副作用。由
`scripts/test-preload-annotation-element-cache.mjs` 覆盖 host 复用、跨 host 隔离、dispose
清理及销毁后访问，共 9 项 focused assertions。

### 增量抽取：annotation preload disposal lifecycle

preload runtime 的 feature graph、preview overlay 与 capability flag 的统一销毁顺序已迁移至
`src/main/browser-page-preload/annotation-preload-disposal.ts`。模块保留可重复 teardown
语义，并保证 feature dispose → preview clear → capability reset 的状态边界；pagehide 与
host-sync/重初始化仍由 runtime 编排。`scripts/test-preload-annotation-preload-disposal.mjs`
覆盖顺序、终止标记与重复销毁，共 6 项 focused assertions。
### 增量抽取：annotation preload message queue lifecycle

挂载前 host sync、文本选区与 editor 消息的缓冲、合并及一次性重放边界已迁移至
`src/main/browser-page-preload/annotation-preload-message-queue.ts`。bridge 继续负责 IPC
listener 注册与挂载订阅，但队列独立维护 mounted/disposed 状态、prepareMount 清理和
dispose 后隔离，避免异步 host 消息在 runtime 销毁后重新注入。由
`scripts/test-preload-annotation-preload-message-queue.mjs` 覆盖覆盖写入、editor 合并、
一次性重放、prepareMount 与销毁后抑制，共 8 项 focused assertions。

### 增量抽取：annotation pointer-selection teardown lifecycle

批注指针选区控制器的拖拽状态与页面销毁边界已补齐至
`src/main/browser-page-preload/annotation-pointer-selection.ts`：公开 `dispose` 现为幂等终态，
销毁后拒绝新的 pointer down/move/up/cancel 与 selection 更新，同时保留内部重启拖拽时的临时清理。
由 `scripts/test-preload-annotation-pointer-selection.mjs` 覆盖销毁后的调用门禁及重复 dispose，
共 18 项 focused assertions。
### 增量抽取：annotation element visibility policy

Annotation element visibility 的 ancestor display/visibility/opacity gate 与 optional `checkVisibility` 判定（原 `_d`，5120-7259 业务工具段）已迁移至 `src/main/browser-page-preload/annotation-element-visibility-policy.ts`；DOM/style 读取通过依赖注入。新增 3 项 focused assertions，build 与 typecheck 已通过。

### 增量抽取：annotation fixed-position policy

Annotation element 的 fixed/sticky ancestor 判定（原 `Ac`）已迁移至 `src/main/browser-page-preload/annotation-fixed-position-policy.ts`；owner window、body 边界、parent traversal 与 computed `position` 均通过依赖注入，`id` 入口保留兼容委托。新增 4 项 focused assertions。

### 增量抽取：annotation element metadata attributes

Annotation element 的 top-frame/document-root/HTML eligibility 与 `oai-annotatable`、`oai-annotation-metadata` 属性 projection（原 `od`）已迁移至 `src/main/browser-page-preload/annotation-element-metadata-attributes.ts`；入口仅注入 DOM eligibility、rect 与 attribute parsers。新增 3 项 focused assertions。

### 增量抽取：annotation frame offset policy

跨 iframe 的 frame offset 递归累积（原 `Ic`）已迁移至 `src/main/browser-page-preload/annotation-frame-offset-policy.ts`；入口仅注入 frame element、owner window 与 rect 读取，保留顶层/无效 frame 的零偏移语义。新增 3 项 focused assertions。

### 增量抽取：annotation element-like policy

批注 DOM 元素兼容判定（原 `F`）已迁移至 `src/main/browser-page-preload/annotation-element-like-policy.ts`；入口仅注入 owner-window constructors 与 element node type，保留跨 realm HTMLElement/Node fallback 语义。新增 4 项 focused assertions。

### 增量抽取：annotation iframe element policy

跨 realm iframe element 判定（原 `ac`）已迁移至 `src/main/browser-page-preload/annotation-iframe-element-policy.ts`；保留 HTMLIFrameElement 与 `tagName`/`contentWindow` fallback。新增 4 项 focused assertions。

### 增量抽取：annotation iframe window policy

iframe contentWindow 的可用 document boundary（原 `sc`）已迁移至 `src/main/browser-page-preload/annotation-iframe-window-policy.ts`；保留非 iframe、空 document 与跨源异常的 null 语义。新增 4 项 focused assertions。

### 增量抽取：annotation clipping boundary policy

元素 overflow/overflowX/overflowY 的 clipping boundary 判定（原 `Kc`）已迁移至 `src/main/browser-page-preload/annotation-clipping-boundary-policy.ts`；入口仅注入 computed style 与既有 overflow policy。新增 3 项 focused assertions。

### 增量抽取：annotation shadow-root policy

shadow root boundary 的 DocumentFragment/host/shadowRoot 一致性判定（原 `Uc`）已迁移至 `src/main/browser-page-preload/annotation-shadow-root-policy.ts`；入口仅注入 node type 与 element 判定。新增 4 项 focused assertions。

### 增量抽取：annotation unique selector policy

元素 root 内 selector 唯一匹配判定（原 `Wc`）已迁移至 `src/main/browser-page-preload/annotation-unique-selector-policy.ts`；入口仅注入 root 查询、queryAll 与唯一性判断。新增 4 项 focused assertions。

### 增量抽取：annotation queryable root policy

Document/DocumentFragment queryable root 结构判定（原 `Gc`）已迁移至 `src/main/browser-page-preload/annotation-queryable-root-policy.ts`。新增 4 项 focused assertions。

### 增量抽取：annotation document access policy

frame window 的安全 document 读取（原 `oc`）已迁移至 `src/main/browser-page-preload/annotation-document-access-policy.ts`；保留跨源异常返回 null 的边界。新增 3 项 focused assertions。

### 增量抽取：annotation frame element resolver

frame path selector 到 iframe element 的解析与类型校验（原 `Tc`）已迁移至 `src/main/browser-page-preload/annotation-frame-element-resolver.ts`；入口仅注入 selector resolver 与 iframe predicate。新增 3 项 focused assertions。

### 增量抽取：annotation frame document resolver

frame path 到 document 的解析（原 `Dc`）已迁移至 `src/main/browser-page-preload/annotation-frame-document-resolver.ts`；入口仅注入 window path resolver，保留失败返回 null 语义。新增 2 项 focused assertions。

### 增量抽取：annotation frame path projection

嵌套 window 到 frame selector path 的反向 projection（原 `ec`）已迁移至 `src/main/browser-page-preload/annotation-frame-path-projection.ts`；保留缺失 iframe/selector/owner window 时返回 null。新增 3 项 focused assertions。

### 增量抽取：annotation text normalization

批注文本的 whitespace collapse、trim 与长度上限 projection（原 `Vl`）已迁移至 `src/main/browser-page-preload/annotation-text-normalization.ts`；入口保留 2000 字符 cap。新增 3 项 focused assertions。

### 增量抽取：annotation range viewport intersection

Range 内容 client rect 与 viewport rect 的相交判定（原 `Kl`）已迁移至 `src/main/browser-page-preload/annotation-range-viewport-intersection.ts`；入口仅注入 Range/rect adapters。新增 2 项 focused assertions。

### 增量抽取：annotation visible-text element policy

visible text candidate 的 excluded ancestor 与 computed style gate（原 `Wl`）已迁移至 `src/main/browser-page-preload/annotation-visible-text-element-policy.ts`；保留 script/style/template/hidden/aria-hidden 过滤与 display/visibility/opacity 判定。新增 3 项 focused assertions。

### 增量抽取：annotation active text input policy

activeElement 的 input type/textarea eligibility（原 `Hl`）现真实委托至既有 `annotation-input-target.ts`；入口仅注入 owner window 与允许的 text input types，新增 3 项 focused assertions。

visible-text document 读取（原 `Ul`）现真实复用 `annotation-document-access-policy.ts`；保留跨源异常返回 null，新增 2 项 focused assertions。

### 增量抽取：annotation owner-window policy

元素 ownerDocument.defaultView 与 fallback window 选择（原 `Gl`）已迁移至 `src/main/browser-page-preload/annotation-owner-window-policy.ts`；入口保留 owner-window fallback。新增 2 项 focused assertions。

### 增量抽取：annotation rect intersection policy

Range/client rect 与 viewport rect 的边界相交 predicate（原 `L`）已迁移至 `src/main/browser-page-preload/annotation-rect-intersection-policy.ts`；新增 2 项 focused assertions。

### 增量抽取：annotation HTML element policy

visible-text TreeWalker 的跨 realm HTMLElement 判定（原 `I`）已迁移至 `src/main/browser-page-preload/annotation-html-element-policy.ts`；入口保留 owner-window/fallback constructor 语义。新增 3 项 focused assertions。

### 增量抽取：annotation range text length

Range 内容到 end boundary 的安全 text length projection（原 `ru`）已迁移至 `src/main/browser-page-preload/annotation-range-text-length.ts`；保留 Range 异常返回 null。新增 2 项 focused assertions。

### 增量抽取：annotation text offset projection

文本 offset 到 TreeWalker text node/offset 的定位（原 `iu`）已迁移至 `src/main/browser-page-preload/annotation-text-offset-projection.ts`；保留负 offset 与超出文本返回 null。新增 3 项 focused assertions。

### 增量抽取：annotation highlight context policy

CSS highlight range 的 style root/owner window/capability context 解析（原 `Ql`）已迁移至 `src/main/browser-page-preload/annotation-highlight-context-policy.ts`；保留非 style root 与 capability 不支持时返回 null。新增 2 项 focused assertions。

### 增量抽取：annotation client rect projection

client rect 的数量上限、零尺寸过滤与 `{x,y,width,height}` projection（原 `Vu`）已迁移至 `src/main/browser-page-preload/annotation-client-rect-projection.ts`；默认保留 1000 rect cap。新增 2 项 focused assertions。

### 增量抽取：annotation text security policy

`-webkit-text-security` 的 masked-text 判定（原 `Bu`）已迁移至 `src/main/browser-page-preload/annotation-text-security-policy.ts`；入口仅注入 computed style property 读取。新增 3 项 focused assertions。

### 增量抽取：annotation shadow-host policy

shadow host root 的 DocumentFragment/host eligibility 与 host projection（原 `Lu`/`Iu`）已迁移至 `src/main/browser-page-preload/annotation-shadow-host-policy.ts`；保留宽松 host 语义，与严格 `Uc` policy 区分。新增 3 项 focused assertions。

### 增量抽取：annotation range fixed-position policy

Range/element 的 fixed/sticky ancestor 判定（原 `Ru`）已迁移至 `src/main/browser-page-preload/annotation-range-fixed-position-policy.ts`；入口仅注入 element/shadow host/parent/style/body adapters。新增 3 项 focused assertions。

### 增量抽取：annotation transform policy

selection/mirror geometry 的 ancestor transform/rotate 判定（原 `Wu`）已迁移至 `src/main/browser-page-preload/annotation-transform-policy.ts`；保留 matrix skew/rotate 过滤与 shadow host traversal。新增 3 项 focused assertions。

### 增量抽取：annotation rect clip intersection

selection/mirror geometry 的 client rect 交集 projection（原 `Gu`）已迁移至 `src/main/browser-page-preload/annotation-rect-clip-intersection.ts`；保留边界接触返回 null。新增 2 项 focused assertions。

### 增量抽取：annotation control default value

annotation design control 的 default/current fallback 与 color/select/range/toggle 默认值 projection（原 `tf`）已迁移至 `src/main/browser-page-preload/annotation-control-default-value.ts`。新增 5 项 focused assertions。

### 增量抽取：annotation sidebar editor transition

sidebar runtime editor message 的 select/create/restore/close/sync 状态 transition（原 `Lf`）已迁移至 `src/main/browser-page-preload/annotation-sidebar-editor-transition.ts`；入口保留状态 reducer 接回。新增 3 项 focused assertions。

### 增量抽取：annotation sidebar target policy

annotation control target 是否位于 sidebar comments root（含 shadow root）的 containment 判定（原 `Of`）已迁移至 `src/main/browser-page-preload/annotation-sidebar-target-policy.ts`。新增 3 项 focused assertions。

### Runtime owner 复核

`annotation-runtime.ts` 仅聚合既有策略/target/parser；`annotation-preload-runtime.ts`、surface/overlay/pointer-selection runtime 均绑定 listener、observer、IPC 或 dispose 生命周期，当前没有可安全脱离 owner 的新增纯策略边界。

### 增量抽取：annotation rect bounds projection

selection rect 集合的 bounding box 聚合（原 `Ku`）已迁移至 `src/main/browser-page-preload/annotation-rect-bounds-projection.ts`。新增 1 项 focused assertion。

### 增量抽取：annotation rect point projection

selection rect 集合首/末端 anchor point projection（原 `qu`）已迁移至 `src/main/browser-page-preload/annotation-rect-point-projection.ts`；保留空集合零点语义。新增 3 项 focused assertions。

### 增量抽取：annotation mirror mutation policy

mirror DOM MutationRecord 的 childList/marker 过滤（原 `Uu`）已迁移至 `src/main/browser-page-preload/annotation-mirror-mutation-policy.ts`；入口仅注入 element 与 marker attribute 判定。新增 3 项 focused assertions。

### 增量抽取：annotation input selection policy

active text input 的 selectionStart/selectionEnd 有效区间判定（原 `Ju`）已迁移至 `src/main/browser-page-preload/annotation-input-selection-policy.ts`；入口复用 text-input policy。新增 3 项 focused assertions。

### 增量抽取：annotation visible element rect

element connected/visible/positive rect 与 frame offset projection（原 `cd`）已迁移至 `src/main/browser-page-preload/annotation-visible-element-rect.ts`；入口仅注入 visibility/rect/frame adapters。新增 3 项 focused assertions。

### 增量抽取：annotation composed parent policy

assigned slot、parent element 与 shadow-root host 的 composed parent traversal（原 `ic`）已迁移至 `src/main/browser-page-preload/annotation-composed-parent-policy.ts`；入口仅注入 DOM parent/root 适配。新增 4 项 focused assertions。

### 增量抽取：annotation event propagation policy

annotation event 的 preventDefault/stopPropagation/stopImmediatePropagation 边界（原 `Jc`）已迁移至 `src/main/browser-page-preload/annotation-event-propagation-policy.ts`；入口保留 preventDefault 开关。新增 2 项 focused assertions。

### 增量抽取：annotation scroll-container offset

按 anchor 保存的 scroll container selector 计算当前滚动偏移差（原 `Nc`）已迁移至 `src/main/browser-page-preload/annotation-scroll-container-offset.ts`；入口仅注入 selector resolver、元素判定与 scroll 读取。新增 3 项 focused assertions。

### 增量抽取：annotation frame point projection

跨 frame 坐标点加法 projection（原 `Lc`）已迁移至 `src/main/browser-page-preload/annotation-frame-point-projection.ts`；入口保留 frame offset 读取，仅委托点坐标合成。新增 2 项 focused assertions。
### 增量抽取：annotation cleanup guard

Annotation runtime 的安全 cleanup guard（原 `Hc`，4485-4489）已迁移至
`src/main/browser-page-preload/annotation-cleanup.ts`；入口保留兼容调用面，继续吞掉
cleanup callback 异常。focused test 覆盖正常执行与异常隔离。

### 增量抽取：annotation popover policy

Popover connected/open/show/hide 状态转换（原 `_c/vc`，4331-4350）已迁移至
`src/main/browser-page-preload/annotation-popover-policy.ts`；入口仅注入 DOM 方法读取器，
保留 hide-first、异常隔离和 close no-op 语义。focused test 覆盖 open/close 行为。
### 增量抽取：annotation cursor style cleanup

Cursor style cleanup（原 `pc`，4292-4297）已迁移至
`src/main/browser-page-preload/annotation-cursor-style-cleanup.ts`；入口保留 cursor restore、
按 attribute 查询和逐个 style remove 语义。focused test 覆盖 restore 与多 style cleanup。
### 增量抽取：annotation cursor tree cleanup

跨 frame 的 cursor style 清理遍历（原 `mc`，4295-4301）已迁移至
`src/main/browser-page-preload/annotation-cursor-tree-cleanup.ts`；入口仅注入窗口收集、
安全 document 读取和单 document cleanup，保留跨域 document 跳过语义。focused test 覆盖
多窗口清理与缺失 document。
### 增量抽取：annotation owner window resolution

元素 owner document 的 window 解析（原 `Fc`，4424-4426）已迁移至
`src/main/browser-page-preload/annotation-owner-window.ts`；入口保留 owner-window 缺失时的
当前 window fallback。focused test 覆盖 owner window 与 fallback 两项行为。
### 增量抽取：annotation element frame path

元素 owner window 到 annotation frame path 的 projection（原 `Cc`，4343-4345）已迁移至
`src/main/browser-page-preload/annotation-element-frame-path.ts`；入口仅注入 owner-window 与
既有 frame-path policy，保持跨 frame path 结果。focused test 覆盖 owner window projection。
### 增量抽取：annotation anchor selector projection

元素到稳定 annotation anchor selector 的 projection（原 `Rc`，4440-4442）已迁移至
`src/main/browser-page-preload/annotation-anchor-selector.ts`；入口固定使用 unique selector
模式并复用 selector generator。focused test 覆盖 selector consumer 与 options 传递。
### 增量抽取：annotation popover target lookup

从 annotation root shadowRoot 查找 popover target 并调用既有 open policy（原 `gc`，4320-4323）
已迁移至 `src/main/browser-page-preload/annotation-popover-target.ts`；入口保留 attribute
selector 和缺失 shadowRoot 的 false 语义。focused test 覆盖成功、selector 传递与空 root。
### 增量抽取：annotation event target policy

事件 composedPath target 命中与 interaction-blocked gate（原 `bl`，4688-4691）已迁移至
`src/main/browser-page-preload/annotation-event-target-policy.ts`；入口复用既有 blocked
policy，保留 target 缺失与 blocked 两态。focused test 覆盖命中和阻断。
### 增量抽取：annotation point target projection

页面坐标到 frame-local point 并解析 annotation target 的 projection（原 `pl`，4600-4606）
已迁移至 `src/main/browser-page-preload/annotation-point-target.ts`；入口保留 hit-test、frame
offset 和 `Sl` target policy 注入。focused test 覆盖 offset projection 与 target consumer。

### 增量抽取：annotation text target projection

文本模式 point hit-test 与 container ancestor 解析（原 `fl`，4593-4595）已迁移至
`src/main/browser-page-preload/annotation-text-target.ts`；入口仅注入 `hl` hit-test 和
`rl` container policy，保留空命中返回 `null` 语义。focused test 覆盖命中 target 与空结果。

### 增量抽取：annotation anchor path projection

跨 document/shadow-root 组装稳定 anchor selector path（原 `kc`，4379-4392）已迁移至
`src/main/browser-page-preload/annotation-anchor-path.ts`；入口仅注入 selector generator、
root 判定与 shadow separator，保留单 selector、嵌套 `shadow:...>>>...` 及失败返回 `null` 语义。
focused test 覆盖 document root、shadow path 与 selector 失败。

### 增量抽取：annotation point scroll-container projection

按 frame window 坐标点命中元素并收集 scroll-container（原 `jc`，4399-4403）已迁移至
`src/main/browser-page-preload/annotation-point-scroll-containers.ts`；入口注入
`elementFromPoint`、元素判定和既有 scroll-container discovery，保留能力缺失、非元素命中时的空数组语义。
focused test 覆盖命中、空命中与非元素结果。

### 增量抽取：annotation frame window resolver

按 frame selector path 解析嵌套 iframe window（原 `wc`，4343-4353）已迁移至
`src/main/browser-page-preload/annotation-frame-window-resolver.ts`；入口仅注入根 window/document、
frame element resolver 与安全 window/document 读取，保留空路径返回根 window、路径失败返回 `null` 语义。
focused test 覆盖空路径、单级成功与缺失 frame。

### 增量抽取：annotation live-anchor equality

运行中 annotation record 的 live element/virtual/element/region anchor equality（原 `ol`，4547-4571）
已迁移至 `src/main/browser-page-preload/annotation-live-anchor-equality.ts`；入口保留 live element
优先判等及 frame path、selector、region rect 字段比较。focused test 覆盖 virtual、live element 与 selector mismatch。

### 增量抽取：annotation anchor selection merge

active annotation 的 primary/additional anchor 合并与重复 anchor 删除策略（原 `al`，4537-4545）
已迁移至 `src/main/browser-page-preload/annotation-anchor-selection-merge.ts`；入口仅注入既有
live-anchor equality，保留 virtual anchor、include 开关、追加与删除 primary 的状态语义。focused test 覆盖追加、virtual 重置与重复删除。

### 增量抽取：annotation hit-target fallback

命中目标解析在主策略返回 `undefined` 时回退到普通 target（原 `nl`，4518-4521）已迁移至
`src/main/browser-page-preload/annotation-hit-target-fallback.ts`；入口注入既有 `il` 主解析与
`sl` fallback，保留 `undefined` fallback、显式 `null` 直返语义。focused test 覆盖两种分支。

### 增量抽取：annotation selector token environment policy

CSS selector token 的 page-level `CSS.escape` 能力探测与 fallback（原 `qc`，4483-4484）已迁移至
`src/main/browser-page-preload/annotation-selector-token-policy.ts`；入口注入 CSS escape getter
与既有 token escaping，保留 CSS API 可用与缺失时的结果。focused test 覆盖两种环境。

### 增量抽取：annotation cursor style state

按 document 保存 cursor 原值、隐藏 cursor 并在状态未被外部改写时恢复（原 `Bc/Vc`，4440-4456）
已迁移至 `src/main/browser-page-preload/annotation-cursor-style-state.ts`；入口保留 WeakMap 生命周期、
跨元素切换时先恢复旧状态及外部样式改写保护。focused test 覆盖 apply/restore 与外部改写。

### 增量抽取：annotation marker pointer-events lifecycle

命中 marker 时临时禁用其 pointer-events，并在 `pl` 成功或异常后恢复（原 `yl`，4629-4642）
已迁移至 `src/main/browser-page-preload/annotation-marker-pointer-events.ts`；入口保留 marker
查询、逐元素样式保存与 try/finally 恢复语义。focused test 覆盖正常执行与异常恢复。

### 增量抽取：annotation pointer target mode

pointer event 在 marker 命中与普通坐标命中之间的分派（原 `vl`，4600-4602）已迁移至
`src/main/browser-page-preload/annotation-pointer-target-mode.ts`；入口仅注入 marker predicate、
marker resolver 与 point resolver，保留 marker 与普通 point 两条调用路径。focused test 覆盖两种分支。

### 增量抽取：annotation target projection policy

overlay 排除、root/container 特殊处理及 design/annotation fallback 的最终 target projection（原 `Sl`，4648-4653）
已迁移至 `src/main/browser-page-preload/annotation-target-projection-policy.ts`；入口仅注入既有 overlay、root、
container 与 hit-target policies，保留 null、design fallback 和 annotation gating 语义。focused test 覆盖四项分支。

### 增量抽取：annotation marker event policy

页面 marker event 的 composed-path adapter（原 `xl`，4634-4643）已迁移至
`src/main/browser-page-preload/annotation-marker-event-policy.ts`；入口仅注入 marker attribute
与既有 `isAnnotationMarkerEvent` policy，保留 marker 命中与未命中语义。focused test 覆盖两种结果。

### 增量抽取：annotation overlay element policy

页面 overlay element 的 composed/shadow-root 判定 adapter（原 `gl`，4608-4620）已迁移至
`src/main/browser-page-preload/annotation-overlay-element-policy.ts`；入口仅注入 root id 与既有
overlay policy，保留 overlay 命中与普通元素未命中语义。focused test 覆盖两种结果。

### 增量抽取：annotation interaction blocker policy

页面 interaction-blocker 的 composed-path adapter（原 `Cl`，4668-4677）已迁移至
`src/main/browser-page-preload/annotation-interaction-blocker-policy.ts`；入口仅注入 blocker
attribute 与既有 interaction policy，保留 blocked/unblocked 结果。focused test 覆盖两种结果。

### 增量抽取：annotation popover trigger policy

坐标命中后排除 overlay 并触发 annotation popover（原 `_l`，4619-4622）已迁移至
`src/main/browser-page-preload/annotation-popover-trigger-policy.ts`；入口注入 point hit-test、
overlay predicate 与 popover opener，保留空命中/overlay 跳过语义。focused test 覆盖三种结果。

### 增量抽取：annotation text-anchor observation targets

React annotation runtime 的文本 anchor 观察目标规划（原 `du`，4959-5031）已迁移至
`src/main/browser-page-preload/annotation-text-anchor-observation-targets.ts`；模块仅根据
frame path、text locator、shadow-root/ancestor 关系构造 mutation、input、scroll 与 frame
目标集合，并保留 unresolved 标记。入口继续持有 MutationObserver、事件监听、RAF 调度与
dispose 生命周期。focused test 覆盖已解析 target、缺失 frame 与 shadow fallback。

### 增量抽取：annotation runtime collection projection

React annotation runtime 顶层 comments/page/design 派生集合（原 `Wy` 内 `Pe/Fe/ze/Be/Ve/He/Ue`）
已迁移至 `src/main/browser-page-preload/annotation-runtime-collection-projection.ts`；模块负责
comment index、当前页过滤、active design change 替换、original-view/tweaks gate 与 design-mode
判定，入口继续持有 DOM anchor resolution、React effects 与 watcher 生命周期。focused test 覆盖
active change replacement、original-view、tweaks disabled、design-mode 与 empty collection。

### 增量抽取：annotation marker record projection

React annotation runtime 的 marker record 列表构建（原 `Wy` 内 `Rt`）已迁移至
`src/main/browser-page-preload/annotation-marker-record-projection.ts`；模块负责 comment number
映射、primary/additional anchor 展开、virtual 过滤、selection source index、live element 注入、
marker point 投影与稳定 key，入口继续负责 marker point 聚合及 React render/UI 生命周期。focused
test 覆盖 virtual/missing-point 过滤、primary live-id、selection index 与 key 生成。

### 增量抽取：annotation active-view projection

React annotation runtime 的 selected-id 到 comment/design active view 派生（原 `Wy` 内
`wt/Tt/M/Et/Dt/Ot`）已迁移至 `src/main/browser-page-preload/annotation-active-view-projection.ts`；
模块保留 comment 优先、design fallback、display annotation 列表与 active-selection gate，入口
继续持有 anchor resolution、effects 与 render 生命周期。focused test 覆盖 comment/design/missing/null
selection 分支。

### 增量抽取：annotation text preview state

React annotation runtime 的文本 selection preview 分支（原 `Wy` 内 `Jt/Yt/Xt/Zt`）已迁移至
`src/main/browser-page-preload/annotation-text-preview-state.ts`；模块负责 active/draft/selected
text anchor 优先级、suspended/marker-visible gate、resolved anchor 与 selection-rect fallback，
入口继续持有 CSS Highlight 的 `useLayoutEffect` 生命周期。focused test 覆盖 active、draft、selected、
hidden、suspended 与 unresolved fallback。

### 增量抽取：annotation screenshot payload projection

React annotation runtime 的 screenshot-ready payload 派生（原 `Wy` 内 `rn/Bt/Vt/Ht`）已迁移至
`src/main/browser-page-preload/annotation-screenshot-payload-projection.ts`；模块负责 selection、
active highlight 与 additional highlight rect union，以及 comment marker index 的 zoom-normalized
point，入口继续持有 requestAnimationFrame、host IPC 与 screenshot effect 生命周期。focused test
覆盖 active/null、union rect 输入、comment marker index 与 zoom 投影。

### 增量抽取：annotation region record projection

React annotation runtime 的 region overlay records（原 `Wy` 内 `qt`）已迁移至
`src/main/browser-page-preload/annotation-region-record-projection.ts`；模块负责 marker-visible/
active-comment gate、suppression 判定、region-only anchor 展开与稳定 key，入口继续持有 DOM
geometry、React render 与 overlay 生命周期。focused test 覆盖 enabled/disabled、suppressed、
非 region 过滤及多 region key。

### 增量抽取：annotation overlay style projection

React annotation runtime 的 zoom/viewport overlay CSS style map（原 `Wy` 内 `mn/hn`）已迁移至
`src/main/browser-page-preload/annotation-overlay-style-projection.ts`；模块负责 zoom transform、
viewport scale 与 marker/metadata CSS variables，入口继续负责 comment-mode 的 cursor/pointerEvents
后缀与 React render 生命周期。focused test 覆盖 zoom=1、zoomed 与 scaled variable/size cases。

### 增量抽取：annotation draft marker state

React annotation runtime 的 create-anchor draft marker point/number 派生（原 `Wy` 内 `dn/pn`）已迁移至
`src/main/browser-page-preload/annotation-draft-marker-state.ts`；模块负责 active/original/virtual gate、
marker point adapter 与新 comment number/匹配 comment number 选择，入口继续持有 DOM marker resolver 与
React render 生命周期。focused test 覆盖新 comment、matched comment、active-selection 与 virtual anchor。

### 增量抽取：annotation render-state projection

React annotation runtime 中 flex-gap overlays、metadata/draft hover、remove-hover、cursor mode 与 hotspot
的无副作用分支（原 `Wy` 内 `an/on/sn/cn/ln/un`）已迁移至
`src/main/browser-page-preload/annotation-render-state-projection.ts`；入口继续注入 overlay runtime、DOM
snapshot 与 geometry 输入，保留 React render 生命周期。focused test 覆盖 active gate、metadata 条件、
remove-hover、text/add/comment mode 与 hotspot 选择。

### 增量抽取：annotation active geometry projection

React annotation runtime 的 active primary/additional anchor payload 与 screenshot-skip gate（原 `Wy` 内
`Ut/Wt/Gt`）已迁移至 `src/main/browser-page-preload/annotation-active-geometry-projection.ts`；入口继续
注入 live element/frame resolver 与 page predicate，保留 DOM geometry、React render 与 screenshot effect
生命周期。focused test 覆盖 comment/design/text 分支、缺失 primary、additional live element 与 original page。

### 增量抽取：annotation highlight state projection

React annotation runtime 的 active/editor/hover highlight 分支与 linked additional highlights（原 `Wy` 内
`Qt/nn/$t/en/tn`）已迁移至 `src/main/browser-page-preload/annotation-highlight-state-projection.ts`；模块
只组合注入的 `nd/dd/c_/J_` geometry adapters，入口继续持有 DOM 读取与 React render 生命周期。focused test
覆盖 active element/region、create element、hover snapshot、virtual/metadata fallback 与 remove-hover gate。

### 增量抽取：annotation runtime sync state

`Wy` host sync handler 中 React context state 的字段归一化（原 `r(...)` updater）已迁移至
`src/main/browser-page-preload/annotation-runtime-sync-state.ts`；zoom-change RAF、host subscription、
cleanup 与后续 state side effects 仍由入口持有。focused test 覆盖 boolean gates、默认 mode/scale 与
comments/intl payload 保留。

### 增量抽取：annotation viewport refresh scheduler

`Wy` 的 `lt` 单帧 viewport refresh 控制器（取消前一 RAF、排队 `T(C_())`、subscription cleanup 取消未执行
帧）已迁移至 `src/main/browser-page-preload/annotation-viewport-refresh-scheduler.ts`；入口继续持有 React
state setter 与 host subscription 生命周期。focused test 覆盖 coalescing、dispose cancellation 与 post-dispose
no-op。

### 增量抽取：annotation anchor observation lifecycle

`Wy` 的 visualViewport、跨 frame resize/scroll、scroll-container、overlay mutation 与 text-anchor observer
注册/清理顺序已迁移至 `src/main/browser-page-preload/annotation-anchor-observation-lifecycle.ts`；入口继续
注入 `dc/Pc/tb/du` 与 geometry callbacks，保留 React effect 依赖与 frame DOM owner。focused test 覆盖
viewport listener、frame/text observer registration、dispose idempotence 与 cleanup 顺序。

### 增量抽取：annotation pointer event lifecycle

`Wy` 跨 frame pointer/keyboard/click/wheel/blur 事件的注册与注销集合已迁移至
`src/main/browser-page-preload/annotation-pointer-event-lifecycle.ts`；入口继续持有事件 handler closure、
`Te.disposeFrame` 与 `dc` frame lifecycle。focused test 覆盖 15 个 listener 的顺序、capture 参数与对称清理。

### 增量抽取：Wy host message dispatcher

`Wy` 的 host message type 分发、capability guard 与 callback 顺序已迁移至
`src/main/browser-page-preload/annotation-wy-host-message-dispatcher.ts`；state/ref/IPC 副作用均由入口注入，
保留 sync、screenshot、editor、design、selection、restore 分支语义。focused test 覆盖 sync 顺序、design
capability guard、multi-select guard 与 unknown message。

### 增量抽取：annotation screenshot-ready controller

`Wy` screenshot-ready effect 的 active-id 去重、RAF 调度/取消与 unmount dispose 已迁移至
`src/main/browser-page-preload/annotation-screenshot-ready-controller.ts`；入口每次 effect update 注入
当前 `gn`，避免 stale screenshot payload，host IPC payload 仍由 React effect callback 组装。focused test
覆盖 null reset、重复 ID、cleanup cancellation 与 dispose race。

### 增量抽取：annotation text-highlight controller

`Wy` CSS Highlight `Yt` 的 apply/replace/cleanup 生命周期已迁移至
`src/main/browser-page-preload/annotation-text-highlight-controller.ts`；入口继续注入 `pu` adapter，
保留 `useLayoutEffect` 时序与 CSS Highlight/stylesheet DOM owner。focused test 覆盖 anchor replacement、
null cleanup、重复 dispose 与 disposed update gate。

### A2 scope correction

早期条目中的“pointer/frame-anchor lifecycle 未完成”是当时的阶段性快照；当前已由
`annotation-anchor-observation-lifecycle.ts`、`annotation-pointer-event-lifecycle.ts`、
`annotation-wy-host-message-dispatcher.ts`、`annotation-screenshot-ready-controller.ts` 与本次
`annotation-text-highlight-controller.ts` 覆盖。剩余范围是各 callback 的业务 state/DOM/IPC 副作用 owner，
不是 listener 注册/注销或 RAF/CSS Highlight teardown 机制。

### 增量抽取：annotation editor-close controller

`Wy` host close-editor 分支的 interaction/ref/state cleanup 顺序与 target-matched editor reset 已迁移至
`src/main/browser-page-preload/annotation-editor-close-controller.ts`；入口继续注入 `flushSync`、React
setters、DOM interaction registry 与 IPC-adjacent cleanup。focused test 覆盖 callback 顺序、flush 边界与
target mismatch 保留 editor state。

### 增量抽取：annotation suspension notifier

`Wy` 的 annotation suspension host-IPC 去重与 comment-mode guard（原 `bt` effect event）已迁移至
`src/main/browser-page-preload/annotation-suspension-notifier.ts`；入口继续注入 host bridge sender，并保留
keyboard event handler 对 `ve.current` 的同步语义。focused test 覆盖 browse/comment guard、重复值、reset
与 dispose。

### 增量抽取：annotation design-modifier notifier

`Wy` 24891 design-modifier host-IPC effect 的 derived pressed 去重与 dispose gate 已迁移至
`src/main/browser-page-preload/annotation-design-modifier-notifier.ts`；入口继续计算 comment mode、空编辑器、
`canUseTweaks` 与 modifier state，notifier 仅负责保持原始 `false` 初值、状态变化通知和 unmount 后抑制。
focused test 覆盖初始 false、true/false 变化、重复值与 dispose 后更新。

### 增量抽取：annotation selection-modifier notifier

`Wy` 四个 pointer/drag/click 回调中重复的 `browser-sidebar-runtime-annotation-selection-modifier-state`
消息构造已迁移至 `src/main/browser-page-preload/annotation-selection-modifier-notifier.ts`；回调继续拥有
`be.current`/`Oe`/anchor 与 shift-key 业务判定，notifier 保留原始每次发送语义，仅在 runtime dispose 后抑制。
`scripts/test-preload-annotation-selection-modifier-notifier.mjs` 覆盖重复值仍发送、值切换与 dispose gate。

### 增量抽取：annotation hover-sync controller

`Wy` 的 `syncHover` 指针模式更新、DOM hover 优先级、React pointer/hover state 与 fallback overlay
派生已物理迁移至 `src/main/browser-page-preload/annotation-hover-sync-controller.ts`；入口继续注入
`Te`、DOM interaction registry、React setters 以及 `pl`/`Yy`/`ss` 业务解析函数，保留 host sync 的
条件与副作用顺序。focused test 覆盖 browse guard、fallback hover、DOM hover 优先级、pointer mode
清理与 dispose gate。

### 增量抽取：annotation pointer-mode sync controller

`Wy` 的 host `syncPointerMode` callback（`nt`）已迁移至
`src/main/browser-page-preload/annotation-pointer-mode-sync-controller.ts`；入口继续注入 DOM
interaction registry 的 `setEnabled`/`invalidate`，保留 annotation API、comment、suspension、agent
控制和 zoom 变化判定。focused test 覆盖启用/禁用、zoom invalidate、agent gate 与 dispose gate。

### 增量抽取：annotation comment-interaction disposal controller

`Wy` host sync 的 `disposeCommentInteraction` 分支固定的 interaction、modifier、pointer、hover、selection、
transient、generation 与 drag 清理顺序已迁移至
`src/main/browser-page-preload/annotation-comment-interaction-disposal-controller.ts`；入口继续注入
各 React/ref/DOM 清理 owner。focused test 覆盖完整顺序与重复 dispose 行为。

### 增量抽取：annotation prepared-screenshot controller

`Wy` prepared screenshot comment 的 prepare、active-comment reconcile、clear 与 dispose 生命周期已迁移至
`src/main/browser-page-preload/annotation-prepared-screenshot-controller.ts`；入口继续注入 React state
setter，host clear-preview IPC（`ft`）仍保持独立语义。focused test 覆盖保留、过期清理、主动清理与
dispose gate。

### 增量抽取：worker Git watch session start controller

`GitRepoWatcher.tryStartWatchSession` 的 disposed/registered gate、session dispose 等待、start promise 去重、
generation race、retry scheduling 与 promise cleanup 已迁移至
`src/main/worker/git-watch-session-start-controller.ts`；worker 继续注入 `startWatchSession` Git I/O owner。
由 `scripts/test-worker-git-watch-session-start-controller.mjs` 覆盖初次启动、dispose 等待与 retry 分支。

### 增量抽取：worker Git watch session dispose controller

`GitRepoWatcher.disposeSession` 的 generation bump、retry cancel、session/start promise 清理、session dispose
错误降级、幂等 dispose promise 与 recovery 更新已迁移至
`src/main/worker/git-watch-session-dispose-controller.ts`；worker 继续注入具体 watcher session 与日志 owner。
由 `scripts/test-worker-git-watch-session-dispose-controller.mjs` 覆盖取消、清理、错误和 promise identity。

### 增量抽取：annotation unavailable-site interaction controller

`Wy` host sync 的 `cancelUnavailableSiteInteraction` 分支已迁移至
`src/main/browser-page-preload/annotation-unavailable-site-interaction-controller.ts`；controller 保留
`Te.cancel()` 条件性标记 viewport selection、随后关闭 pointer mode 的顺序，并由入口注入 interaction
registry/ref/state owner。focused test 覆盖 cancel 返回 true/false、顺序与 dispose gate。

### 增量抽取：annotation selection-modifier controller

`Wy` 的 `setSelectionModifier` callback（`yt`）已迁移至
`src/main/browser-page-preload/annotation-selection-modifier-controller.ts`；controller 保留 modifier
active/clear、create-element/text guard、pointer/Ce guard、DOM live-element hit-test、document focus、
anchor/hover projection 与失败清理顺序，入口继续注入 React/ref/DOM owner。focused test 覆盖 disable
清理、成功命中、失败命中与 dispose gate。

### 增量抽取：annotation remove-selection controller

`Wy` 的 `removeAnnotationSelection` callback（`dt`）已迁移至
`src/main/browser-page-preload/annotation-remove-selection-controller.ts`；controller 保留 multi-select
与 create-element guard、primary/additional anchor 索引解析、`al` 投影及 `ut` 更新顺序，入口继续
注入 editor state 与 anchor update owner。focused test 覆盖有效/无效索引、能力与 target guard、dispose gate。

### 增量抽取：annotation point-retry controller

`Wy` 的 `retryCreateCommentAtPoint`/`retryOpenDesignEditorAtPoint` callbacks（`it`/`ct`）的 RAF retry 生命周期已迁移至
`src/main/browser-page-preload/annotation-point-retry-controller.ts`；controller 保留初始调度、最多两次
重试、成功短路和 dispose 时取消 pending frame，入口继续注入 `rt` point action。focused test 覆盖三次
尝试、成功短路、pending cancel 与 dispose gate。

### 增量抽取：annotation editor-restore controller

`Wy` host restore-editor 分支的 interaction、modifier、anchor point、pointer、transient、hover 与 selection-hover
清理顺序已迁移至 `src/main/browser-page-preload/annotation-editor-restore-controller.ts`；入口继续注入 React
refs/setters 与 `H_` restore adapter，保持 host restore message 的原始副作用顺序。由
`scripts/test-preload-annotation-editor-restore-controller.mjs` 覆盖顺序、message 透传与 null restore。

### 增量抽取：main window titlebar overlay sync

`Qot.installApplicationMenuTitleBarOverlaySync` 的 platform/appearance gate、nativeTheme `updated` 订阅、
初次 overlay 应用与 cleanup 已迁移至 `src/main/main-app/startup/window-titlebar-overlay-sync.ts`；window manager
继续注入 BrowserWindow 与 zoom/overlay 计算，保持原始窗口生命周期顺序。由
`scripts/test-main-window-titlebar-overlay-sync.mjs` 覆盖 gate、initial update、theme update、destroyed window
与 cleanup。

### 增量抽取：main display-change geometry refresh

`Qot.installDisplayChangeGeometryRefresh` 的 macOS display-added/removed/metrics-changed 订阅集合与 cleanup
已迁移至 `src/main/main-app/startup/display-change-geometry-refresh.ts`；window manager 继续注入现有窗口几何
刷新业务回调。由 `scripts/test-main-display-change-geometry-refresh.mjs` 覆盖三类事件、刷新转发、非 macOS gate
与注销顺序。

### 增量抽取：worker working-tree watch policy refresh

`GitRepoWatcher.refreshWorkingTreeWatchPolicy` 的 session barrier、ignore policy freshness/retry gate、apply/skip
决策与 watcher dispose/restart recovery 已迁移至
`src/main/worker/git-working-tree-watch-policy-refresh-controller.ts`；worker 继续注入 ignore policy、Git session
和 file-event owner。由 `scripts/test-worker-git-working-tree-watch-policy-refresh-controller.mjs` 覆盖 apply、skip、
restart 与 retry gate。

### 增量抽取：main web-contents diagnostics

`Qot.installWebContentsDiagnostics` 的 renderer crash/unresponsive/did-fail-load 事件订阅、fatal report、recovery
attempt reset 与 primary-window gone 通知已迁移至 `src/main/main-app/window/web-contents-diagnostics.ts`；Qot
继续注入 recovery、ready-set 和 IPC owner，保持原始事件分支顺序。由
`scripts/test-main-web-contents-diagnostics.mjs` 覆盖 crash recovery、load reset、unresponsive、failed-load
过滤与 primary 通知。

### 增量抽取：worker Git init reconnect controller

`GitInitWatcher.scheduleReconnect` 的 timer 去重、指数退避、startSessions 成功复位、失败重排与 dispose 清理已
迁移至 `src/main/worker/git-init-reconnect-controller.ts`；watcher 继续注入 session 启动与日志 owner。由
`scripts/test-worker-git-init-reconnect-controller.mjs` 覆盖退避、成功复位、去重与 dispose gate。

### 增量抽取：main primary-window tracking

`Qot.trackPrimaryWindow` 的 primary set 注册、初始 active 选择、focus/blur 时间戳更新与 change emission
已迁移至 `src/main/main-app/window/primary-window-tracking.ts`；window manager 继续注入 primary 状态容器与
事件回调，保持原有 focus/blur 顺序。由 `scripts/test-main-primary-window-tracking.mjs` 覆盖 focused/unfocused
初始状态、focus、blur 与 emission 顺序。

### 增量抽取：worker GitRepoWatcher dispose controller

`GitRepoWatcher.dispose()` 的 disposed gate、ignore policy/session 清理、repo/retry/metadata controller dispose、
watch target 与 ignore map 清空，以及 pending metadata promise 的幂等汇合已迁移至
`src/main/worker/git-repo-watcher-dispose-controller.ts`；worker 继续注入具体 session/I/O owner。由
`scripts/test-worker-git-repo-watcher-dispose-controller.mjs` 覆盖 cleanup 顺序与重复 dispose promise identity。
### 增量抽取：annotation point-selection controller

`Wy` 的 `createCommentAtPoint` callback（`rt`）点选优先级已迁移至
`src/main/browser-page-preload/annotation-point-selection-controller.ts`；controller 保留 editor focus、
captured point freshness/select/fallback、interaction registry select、DOM hit-test、anchor projection 与
`qe` open 顺序，入口继续注入当前 context 和 editor IPC/state owner。focused test 覆盖各优先级、fallback
与 dispose gate。
### 增量抽取：annotation design-point selection controller

`Wy` 的 `openDesignEditorAtPoint` callback（`st`）已迁移至
`src/main/browser-page-preload/annotation-design-point-selection-controller.ts`；controller 保留 editor
focus、captured design element/anchorState 分支、design-mode DOM hit-test、anchor projection 与 `Ze`
open 顺序，入口继续注入当前 context 和 design editor owner。focused test 覆盖各优先级、mode 透传与
dispose gate。
### 增量抽取：annotation selection-comment controller

`Wy` 的 `createCommentFromSelection` callback（`at`）selection/fallback orchestration 已迁移至
`src/main/browser-page-preload/annotation-selection-comment-controller.ts`；controller 保留 editor focus、
prepared text selection 优先级、selection ref 清理、`ou()` 回退、`gu()` 清理和 `rt`/`Je` 分支顺序，入口
继续注入当前 editor、selection 与 point retry owner。focused test 覆盖 focus、selection open、fallback retry
与 dispose gate。
### 增量抽取：annotation text-anchor editor controller

`Wy` 的 text-anchor `Je` editor-open lifecycle 已迁移至
`src/main/browser-page-preload/annotation-text-anchor-editor-controller.ts`；controller 保留 interaction
clear、comment preview close、open-editor IPC、viewport refresh、editor state、hover/selection cleanup
顺序，入口继续注入 React/ref/host owners。focused test 覆盖 text guard、preview 分支、payload/state 与
dispose gate。
### 增量抽取：annotation editor-comment reconciliation controller

`Wy` 的 `pt` editor/comment reconciliation callback 已迁移至
`src/main/browser-page-preload/annotation-editor-comment-reconciliation-controller.ts`；controller 保留
null state、design target、无 `commentId` target 与 stale comment 清理 predicate，入口继续注入 React
editor state setter。focused test 覆盖保留/清理各 target 分支与 dispose gate。
### 增量抽取：Git watcher change controller

`GitRepoWatcher.startWatchSession` 的 parcel watcher `onChange` callback 已迁移至
`src/main/worker/git-watch-change-controller.ts`；controller 保留 ignore-source 记录、metadata refresh、ignore
目录判定、handler 路径过滤、HEAD 状态清除和 repo event 分发顺序，consumer 继续注入原始 watcher 状态。
focused test 覆盖 ignore-source、working-tree/head 分发、空变更恢复事件与刷新条件。
### 增量抽取：Git init session-start controller

`GitInitWatcher.startSessions` 的 root/.git watcher startup 与 metadata 缺失 recovery 已迁移至
`src/main/worker/git-init-session-start-controller.ts`；controller 保留 root watcher 优先、metadata watcher
降级、失败时 sessions dispose、existing Git directory 检查与最终 readiness gate 顺序，consumer 继续注入
host/session/logger owner。focused test 覆盖正常双 watcher、metadata 缺失降级和失败清理。
### 增量抽取：Git init watch-session controller

`GitInitWatcher.startWatch` 的 host watch 创建、disposed race、session 注册、closed error/reconnect 生命周期已迁移至
`src/main/worker/git-init-watch-session-controller.ts`；consumer 保留原始 watch options、logger、session set 与
reconnect owner。focused test 覆盖正常注册、watch-error 清理/reconnect 与 disposed race。
### 增量抽取：Git metadata refresh batch controller

`GitRepoWatcher.processMetadataRefreshBatch` 的 metadata 目标筛选、recovery dispose/restart、missing target
补启动与 worktree topology refresh 已迁移至 `src/main/worker/git-metadata-refresh-batch-controller.ts`；consumer
保留原始两段 `Promise.all` 顺序与 watcher owner 注入。focused test 覆盖 recovery restart、retry target 跳过与
disposed gate。
### 增量抽取：Git init recovery controller

`GitManager.handleGitInit` 的 metadata refresh、watch-git-metadata 重启、desired-key 竞态 guard 与失败回收已迁移至
`src/main/worker/git-init-recovery-controller.ts`；consumer 继续注入 manager 的 watcher/metadata owner，保留
原始 handled-set、refresh 顺序和 finally/catch 清理语义。focused test 覆盖成功重启、已刷新短路与异常回收。
### 增量抽取：Git init metadata-refresh controller

`GitManager.refreshGitInitMetadata` 的 stable metadata invalidation、按 watch key single-flight 复用与 promise
cleanup 已迁移至 `src/main/worker/git-init-metadata-refresh-controller.ts`；consumer 保留原始 refresh-once
owner 与当前 promise identity 清理语义。focused test 覆盖复用、成功清理与失败清理。
### 增量抽取：Git init metadata-apply controller

`GitManager.refreshGitInitMetadataOnce` 的 stable metadata 应用、旧 watcher 释放、repository watch 建立、
desired-key superseded 回退与 HEAD invalidation event 已迁移至 `src/main/worker/git-init-metadata-apply-controller.ts`；
consumer 继续注入 manager 的 watcher、unwatch 与 event/trace owner。focused test 覆盖成功应用、metadata race
短路和 superseded unwatch。
### 增量抽取：Git init watch-desire controller

`GitManager.ensureWatchingForGitInit` 的 desired watch key 切换、旧 watcher dispose、start 结果与 failed key
回收已迁移至 `src/main/worker/git-init-watch-desire-controller.ts`；consumer 保留 manager 的 key、watcher
startup 与 disposal owner。focused test 覆盖 key 复用、正常切换和 failed cleanup。
### 增量抽取：Git init watcher-start controller

`GitManager.startGitInitWatcher` 的 watcher 构造、active ownership 注册、started/failed/superseded 结果分类与
dispose 清理已迁移至 `src/main/worker/git-init-watcher-start-controller.ts`；consumer 继续注入 GitInitWatcher
与 manager callback/logger dependencies。focused test 覆盖正常启动、failed cleanup 与 superseded 处理。
### 增量抽取：Git repo-watch event controller

`GitManager.createRepoWatch` 的 repo-change event consumer 已迁移至
`src/main/worker/git-repo-watch-event-controller.ts`；controller 保留 active watch identity guard、working-tree
path filtering/full invalidation、Git cache invalidation、live-query fanout、performance/raw-event accounting、trace
与 emit 顺序，consumer 继续注入 repository/watch owner。focused test 覆盖 filtered working-tree 与非 repo event。
### 增量抽取：Git worktree-delete lifecycle controller

`GitManager.deleteWorktreeWithLimit` 的 worktree identity、snapshot/delete operation、成功/失败日志与错误传播已迁移至
`src/main/worker/git-worktree-delete-lifecycle-controller.ts`；consumer 继续注入 snapshot/delete implementation
与 manager host owner。focused test 覆盖成功返回 identity 与失败日志/传播。
### 增量抽取：Git live-query attribution controller

`GitManager.runLiveQueryWithAttribution` 的 outer trace、request attribution、首结果计时、结果映射、异常
disposition、performance finally 与 attribution cleanup 已迁移至
`src/main/worker/git-live-query-attribution-controller.ts`；consumer 继续注入 live-query、request context 与
performance owner。focused test 覆盖 operation 结果、首结果计时和 finally cleanup。
### 增量抽取：Git performance-operation controller

`GitManager.emitGitPerformanceOperation` 的 result fields、outcome/reason attributes、sampling 与 worker-event
telemetry emission 已迁移至 `src/main/worker/git-performance-operation-controller.ts`；consumer 继续注入
manager attribution、telemetry helper 与 event emitter。focused test 覆盖成功结果的 attribution end、attributes
记录和 sampled emit。
