# R8-R12 完整性审计报告

方法：深析文档区域地图 × main-app 149 模块全文关键词匹配。
结论：R8-R10 有 ~25 个主题簇未落地（subagent 交付的是 R1-R5 主题的部分模块 + 会话/设置簇）；
R11-R12 的窗口总管/菜单/启动装配属于 main 块的收尾装配区。

## R8（107,000-125,122）：browser-use/IAB/locator/capability/CDP/registry

| 状态 | 主题 | 命中 |
|---|---|---|
| ❌ | browser-use 工具 schema 带（WebMCP/download/print/tabs/playwright_locator_* 20 命令） | 0/3 |
| ❌ | locator 引擎 JJ 类（~585 行） | 0/3 |
| ◐ | capability 层（botDetection/browserAuth/pageAssets/visibility/viewport） | 1/4 |
| ❌ | IAB browser-use API 巨类 DYe（~1,370 行/60 方法） | 0/3 |
| ❌ | CDP target 适配 + native pipe server JYe | 0/2 |
| ❌ | browser-session-registry cX（~1,130 行） | 0/2 |
| ❌ | IAB manager 辅助带（路由/分析/冷恢复） | 0/2 |
| ❌ | incomplete-navigation service | 0/2 |
| ✅ | media indicator + auto-auth | 1/2 |

## R9（125,000-128,458+）：workspace 文件/听写/云终端/文件库/LS 资源

| 状态 | 主题 | 命中 |
|---|---|---|
| ❌ | 执行宿主注册表 a$e + clipboard + macOS 拖拽 | 0/2 |
| ❌ | workspace 文件服务（缩略图/读/写/etag/.chatgptdownload） | 0/2 |
| ❌ | 文件拖拽服务 | 0/2 |
| ❌ | macOS CoreAudio 麦克风探测 | 0/2 |
| ✅ | dictation 转写历史（transcription-history.jsonl + .chunk 硬链接） | 1/2 |
| ✅ | cloud terminal（PTY 后端 + outputDelta 多路复用） | 1/2 |
| ✅ | library files（TOCTOU 防御 + qlmanage 缩略图） | 2/2 |
| ❌ | local environments + thread catalog 授权 | 0/2 |
| ❌ | 语言服务器资源锁定（pyright/ts-ls/java/kotlin/rust-analyzer） | 0/3 |

## R10（140,000-142,735+）：open-in/runtime 安装/项目同步

| 状态 | 主题 | 命中 |
|---|---|---|
| ❌ | open-in targets + OpenInService | 0/2 |
| ❌ | Owl runtime 特性 + incentives | 0/2 |
| ❌ | 插件列表 + workspace 依赖工具 | 0/2 |
| ❌ | primary runtime 安装器 | 0/2 |
| ❌ | primary-runtime-host | 0/2 |
| ❌ | projectless 目录选择器 | 0/2 |
| ❌ | 线程项目分配写入器 | 0/2 |
| ❌ | 待删除项目调度器 | 0/2 |
| ❌ | host-app-server-projects | 0/2 |
| ❌ | 本地项目缓存后端 | 0/2 |
