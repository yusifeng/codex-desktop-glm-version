# main 重写合同（R1+R2 部分，agent 必读）

本文档约定 `src/main/main-C-Mhak1n.ts`（只读，177,000 行）拆分为
`src/main/main-app/` 下真实源码的规则。分析依据 `docs/main-analysis-r1-r2.md`
（R1+R2 深析，含全部聚类的行区间与符号映射）。

## 源文件顶层绑定映射

```
e  = rolldown 打包运行时（e.a interop、e.t CJS 模块、e.n 惰性 init）——重写时忽略
t  = @chunk/desktop-open-path-queue
n  = @chunk/shared（单字母导出，见 src/main/types/chunk-modules.d.ts）
r  = @chunk/logger（r.i=记忆化 tag logger、r.n=getLogger、r.o=setLogger、r.t=formatLogTags）
i  = @chunk/main-shared（src-C9YLnbgY.js，ms 等小工具）
a  = @chunk/bootstrap（已重写！128 个兼容导出，语义名见 docs/bootstrap-export-table.txt
     与 src/main/bootstrap/index.ts 的导出块——优先用语义名 import，如
     import { MESSAGE_FROM_VIEW } from "@chunk/bootstrap" 不行（bootstrap 的
     兼容导出是单字母名），重写 main-app 模块时用：
     import { Pt as MESSAGE_FROM_VIEW } from "@chunk/bootstrap"
     即按字母导入+重命名为语义名；bootstrap 侧语义名在后续移除兼容层时切换）
o  = @chunk/electron-resources-path（resolveElectronResourcesPath）
s  = @chunk/css-selector（dist-wQAv1pJP.js，未重写，css-select 引擎）
l  = electron（经 e.a interop，原代码写 l.app/l.BrowserWindow）
c=node:url  d=node:util  f=path  p=node:os  h=node:path  _=node:crypto
v=node:fs  b=node:fs/promises  S=node:buffer  C=node:stream  w=node:events
T=node:net  D=node:timers/promises  O=fs  k=node:process  j=assert
M=events  N=buffer  P=node:child_process  F=node:stream/promises  I=zlib
L=node:readline  R=node:perf_hooks  z=node:string_decoder  B=node:worker_threads
V=node:http  ee=node:module  te=node:zlib  ne=node:tls  H=node:assert
re=node:path/posix
```

## vendored 带（不重写，重写时引 npm 或从 vendor 引）

R1+R2 区间内：
- 955-2,411 `@tanstack/query-core` v5（Nee/Mee/jee 等）——应用侧 63,124 实例化（区间外）
- 19,113-21,298 字符实体数据 + parse-entities（micromark 依赖链）

## 模块表（R1+R2，路径相对 `src/main/main-app/`）

按 r1-r2 深析 §3 的聚类。跨模块 import 以深析的语义命名为准；
其他 agent 并行重写相邻簇，tsc 报「模块不存在/无此导出」先忽略并记录。

| 模块 | 簇 | 关键导出（压缩名→语义名） |
| --- | --- | --- |
| `native-pipe/protocol.ts` | 3.1 | `Bl`→PipeFrameLimitError、`Vl`→encodeFrame、`lse`→FrameDecoder、`fse`→MAX_FRAME_BYTES |
| `native-pipe/server.ts` | 3.1 | `cse`→PipeClientConnection、`Tse`→NativePipeServer、`_se..ql`→discoverPipeClients/connectPipe、`jse..Xl`→管道目录管理 |
| `native-pipe/peer-socket-authorizer.ts` | 3.1 | `Ql`→createSocketPeerAuthorizer、`zse`→extractSocketFd |
| `computer-use/notify-config.ts` | 3.1 | `iie..uie`→notify 配置注入 |
| `computer-use/config-writer.ts` | 3.2 | CUA config.json 写入（串行队列 `ts`） |
| `computer-use/app-resolution.ts` | 3.2 | `Codex Computer Use.app` 路径解析与 canonical 刷新 |
| `computer-use/managed-service.ts` | 3.2 | `Eoe`→ManagedComputerUseService |
| `computer-use/native-pipe-service.ts` | 3.2 | 服务端 `Po/Wre/qre`、客户端 `Uo/Wo/fie/pie`、选择计算 |
| `computer-use/activity-tracker.ts` | 3.2 | `ele` app-server 通知→线程活跃 |
| `skysight/service-manager.ts` | 3.2 | `joe/Moe`→SkysightServiceManager + 录音技能注入 |
| `windows/native-app-icons.ts` | 3.2 | `Pae..Wne` 图标族 + sky addon（LRU `Is`） |
| `plugins/marketplace.ts` | 3.3 | `Pa/Fa/vre/Ra/La/_re/to/za/Ba`、物化键 |
| `plugins/chrome-native-host-sync.ts` | 3.3 | `no..Co/wo` + cache-watcher |
| `plugins/orchestrator.ts` | 3.3 | `ol/ioe` 大工厂（ssh reconcile、chrome 同步、skills 通知）+ chronicle |
| `plugins/cua-repl-config.ts` | 3.3 | `Bi/Vi/Sne` 写 .mcp.json |
| `plugins/browser-runtime-resolution.ts` | 3.3 | chrome profile 探测、扩展商店 URL、安装迁移 |
| `browser-use/rpc-client.ts` | 3.4 | `kn`→RpcChannel、`ite`→BrowserUseClient、`In`→管道路径 |
| `browser-use/thread-config.ts` | 3.4 | browser/config.toml 写入 |
| `browser-use/site-data.ts` | 3.4 | persist partition/cookie 清理 |
| `browser-use/migration.ts` | 3.4 | local→bundled 迁移 |
| `browser-use/availability.ts` | 3.4 | `Kse/Jse/Yse` |
| `browser-use/execution-host.ts` | 3.4 | `fte/pte/mte/hte` 进程 spawn 包装 |
| `artifact-session/host-lifecycle.ts` | 3.5 | `Hte`→ArtifactSessionHostLifecycle |
| `artifact-session/runtime-install.ts` | 3.5 | runtime-generations 安装 |
| `avatar-overlay/*.ts` | 3.6 | 见深析 §3.6 |
| `automations/index.ts` | 3.7 | cron 执行引擎（8,725-9,982） |
| `misc/delegation.ts` | 3.8 | 67-93 `<codex_delegation>` 解析 + plan 列表 |
| `misc/availability.ts` | 3.8 | `vr/br/xr/Sr/Cr`（3,358-3,370） |
| `misc/installer-attribution.ts` | 3.8 | `iu` 单例（14,105） |
| `misc/remote-control-state.ts` | 3.8 | `Ou/ku/Au`（14,755） |
| `misc/dock-menu.ts` | 3.8 | 13,038-13,137 |

（R3+ 的模块表待各区域深析返回后补充；跨区间引用先记录待确认。）

## 硬性规则（同 bootstrap 合同）

1. **语义逐行等价**：所有分支、await 顺序、错误处理、竞态时序保持原样。
   懒求值（`Tr()/au()/Ql()/Vs`）必须保持懒。
2. 真实命名 + 中文 JSDoc；类型尽量补全，不确定用 unknown/宽松类型。
3. 不改 `chunk-manifest.mjs`、构建脚本、`main-C-Mhak1n.ts`（只读）。
4. 不跑 build；`npx tsc --noEmit` 忽略：其他未完成模块的缺导出、
   `main-C-Mhak1n.ts` 自身的错误。其余错误必须修复。
5. **@chunk/bootstrap 的消费**：`a.<字母>` → `import { <字母> as <语义名> } from "@chunk/bootstrap"`。
6. **同名异义陷阱**（深析 §7）：`iu`（installer 单例）≠ `n.iu`（state 键对象）等，重命名前先核对深析的可变状态清单。
7. 报告必须列出：模块清单与行数、导出符号、import 的跨模块符号、语义不确定点（行号+疑点）。
