# main-C-Mhak1n.ts R1+R2 深度分析（1-20,000 行）

目标：`src/main/main-C-Mhak1n.ts` 的 1-20,000 行（R1=1-1,000 + R2=1,000-20,000）。
来源：macOS ChatGPT.app（Codex 桌面版 v26.917.71314）主进程 chunk。
方法：与 `docs/main-analysis-coarse.md` / `docs/bootstrap-analysis.md` 同一方法论——200-400 行窗口采样 + 关键区域（类定义头、区域边界、副作用语句）精读；所有行号经 `grep -n` 核实。结论标注置信度：**直接证据** = grep/原文引用支撑；**采样推断** = 窗口采样得出，需下游复核。

**工具坑（沿用粗扫 §9.2）**：本机 grep 为 ugrep 7.8.4，BRE `\|` 多模式静默失效。本文所有多模式扫描均用 `-E 'a|b'` 或分开单模式完成。

## 0. 总览与两个对粗扫的重要修正

1. **修正一：955-2411 行是 vendored `@tanstack/query-core`（v5）**，不是应用代码。粗扫把这一带当「杂项工具带」（§2 定义密度表 0-4999 桶 315 处），深析发现其中包含完整的 QueryClient/QueryCache/MutationCache/Query/Mutation/focusManager/onlineManager/notifyManager/CancelledError/retryer/Removable/query 无限分页 behavior。证据：`focusManager`（visibilitychange 订阅，974-1010）、`onlineManager`（online/offline 事件，1319-1356）、`CancelledError` 带 revert/silent（1362）、gcTime/Removable（1443-1481）、infinite query 的 `pages/pageParams/getNextPageParam`（1462-1530）、`QueryClient` 构造 `queryCache || new Mee()`（2218）——TanStack Query v5 核心源码结构逐一对应（直接证据）。应用侧在 **63,124**（`#e = new Nee({...})`，AppServer 区）实例化 QueryClient——不在本区间。**重写时直接引 npm `@tanstack/query-core`，本区间 955-2411 不派发重写。**
2. **修正二：vendored 字符实体数据从 19,113 行即开始**，而非粗扫估计的 ~21,000。19,113-19,169 是 `parse-entities`/`decode-named-character-reference` 的字符分类工具（Ud 计数、kue legacy 实体点分表 19,121、Wd windows-1252 表 19,135、Gd/Aue/jue/Kd 字符分类 19,155-19,168），19,170-21,298 是 `qd` 命名字符实体大表（AElig/AMP/... 直接证据），21,299 `Jd` 查表 + 21,302 `Nue` 报错串（"Named character references must be terminated by a semicolon"，与粗扫 §7 的 21,312 特征串同一序列）。**R2/R3 边界（20,000）正好切在这张表中间**——派发时 19,113 起归 vendored，不归 R2 应用深析。
3. 本区间（1-20,000）**没有模块加载期的可观察副作用**（无 Electron 事件接线、无 fs I/O、无定时器；唯一的列 0 表达式语句是 12,919 的 `xl.flatMap(...)` 纯数据推导）。粗扫 §6 点名的 `Pm(ih,...)` 在 28,300，不在本区间，本区间无同类调用。详见 §5。

---

## 1. 区域地图（行区间，每子区域 ≤1500 行）

| 行区间 | 类型 | 语义名 | 概述 |
|---|---|---|---|
| 1-66 | 应用 | module 头 | 9 个 chunk require（e/t/n/r/i/a/o/s）+ ~35 个 node 内置（见粗扫 §1） |
| 66-322 | 应用 | delegation/plan/账号/线程杂项 | `<codex_delegation>` 解析 `ae/oe/se`（67-78）；OpenAI 员工/plan 白名单 `ce/le/ue/de`（81-93，`plus/pro/business/team/self_serve_business_prolite/self_serve_business_usage_based` 直接证据）；活动事件分发器 `fe`（100）；账号相等判定 `W`（116）；`G = e.a(n.Ld())`（121）与 `pe=6e4` 限速常量；thread_not_found 判定 `me/ge`（123-138）；去重缓存类 `he`（139，lookups+nextPruneAtMs）；节 section 分页适配器 `Se`（196）；renderer 窗口键解析 `Ee/Oe`（326-347，`codex-renderer-window:` 前缀） |
| 348-912 | 应用 | 下载/链接/工作区/键名杂项 | Office 扩展名 `ke`、下载文件名清洗 `je`、大文件阈值 `K`（348-363）；avatar/PIP 弹簧与布局常量 `Me/Ne/Fe`（359-394，采样推断）；open-in-app 判定 `ze..Je`（365-503）；浏览器会话路由/restore 键 `Qe..$e/et/tt/nt..rt`（505-543）；git URL→owner/repo 解析 `dt/ft/pt/mt`（544-601）；projectless 工作区指令文案 `vt`（603-621）；日期目录 `wt/St`、目录名生成 `Ct`（622-640）；projectless 目录创建 `Tt..Dt`（646-692）；速率限制器 `jt`（732-748）；滚动窗口 Mt/Nt、shell 显示名 `Pt`（749-762）；线程 workspace-state/client-id/tab-routes/resume 键 `Lt..ree`（765-786）；自定义 TOML 序列化器 `Wt..Xt`（794-912，`[[section]]` 块 + nan/inf/date/bigint 处理，写 app-server 环境配置用，采样推断） |
| 913-952 | 应用 | app-server 连接注册表 | `cee`：connections(hostId)/subscribers，addConnection/removeConnection/subscribe；在 159,296 被 `new cee()` 实例化（直接证据） |
| 955-2411 | **vendored** | @tanstack/query-core v5 | 见 §0 修正一与 §2。`Zt` Subscribable(955)、`Qt` focusManager(974)、`lee/$t` timeoutManager(1003+)、`hn` isServer(1224)、`xee` Deferred(1230)、`Cee` NotifyManager 工厂(1256)、`gn` notifyManager 单例(1315)、`_n` onlineManager 单例(1319)、`wee` retryDelay(1356)、`yn` CancelledError(1362)、`bn` Retryer(1367)、`xn` Removable(1443)、`Tee` infiniteQueryBehavior(1462)、`Dee` Query(1532)、`kee` Mutation(1853)、`jee` MutationCache(2039)、`Mee` QueryCache(2131)、`Nee` QueryClient(2208) |
| 2412-2554 | 应用 | worktree 驱逐 + turn 锁 | `Pee = Date.parse('2026-02-21...')`(2413) 迁移分界；`Iee/Lee/Ree` worktree 候选筛选(2415-2455)；`zee=12e4/Bee=6e5` + `Vee` turn 启动/会话锁管理器(2460-2522)；app-server SQLite configWarning 解析 `Gee/Kee/qee`(2523-2553) |
| 2555-2957 | 应用 | browser-use RPC 客户端 + 执行宿主包装 | `Dn='browser/config.toml'` 及 BROWSER_USE_* 环境变量常量(2555-2566)；`kn` JSON-RPC 风格请求/事件多路复用基类(2567)；`ite extends kn` browser-use 客户端(moveMouse/webMcpToolInvoked)(2662-2733)；命令分派 `lte`(2762)；命名管道路径 `In`(2771，win32 `\\.\pipe\codex-browser-use` / unix `/tmp/codex-browser-use` 直接证据)；`fte` 按 hostId 的进程 spawn 注册表(2774)、`pte` spawn 包装(2802)、`mte` 进程等待包装(2864)、`hte` 会话+批量变更包装(2888)；stat 快照 `_te..Zn`(2958-3083) |
| 3084-3264 | 应用 | devicecheck attestation | `$n` logger(3084)、`er='devicecheck.node'` 原生 addon(3085)；平台/架构判定 `rr/ir`(3088-3093)；attestation 请求构造 `ar/or/sr/cr`(3094-3173)；CBOR 编码 `lr/ur/dr/Ste..gr`(3174-3236)；base64url `Ote`(3237) |
| 3265-3703 | 应用 | desktop feature availability | 特性开关 schema `_r`(3265-3355，ambientSuggestions/browserPane/computerUse/skysight/... 60+ 键直接证据)；状态 `vr/yr/br/xr/Sr/Cr`(3358-3370)；读取器 `Tr/Er/Ate/Dr`(3372-3401)；schema 校验 `Or/jte`(3402-3421)；配置加载 `Ar/Mte/jr/Mr`(3422-3505，环境覆盖 `wr='CODEX_ELECTRON_DESKTOP_FEATURE_OVERRIDES'` 直接证据)；启动阶段辅助 `zr/Br/Vr`(3526-3581)；`Hr` app-server 连接包装(3582)；ambient suggestions 后台刷新 `Ur/Ite`(3594-3701)；`Wr/Gri` projectRoot(3701-3704) |
| 3704-4561 | 应用 | artifact session 宿主 | `Gr='@oai/artifact-tool'` 及 host-daemon/host-client 路径(3704-3707)；`Yr` ARTIFACT_SESSION_HOST_* env 键表(3721-3735)；`Hte` ArtifactSessionHostLifecycle 类(3737，logger `r.r('ArtifactSessionHostLifecycle')` 直接证据)；runtime 世代安装 `Xr/Ute..Kte`(4182-4360，runtime-generations 目录 + chmod 448 直接证据)；readyFile 等待 `Yte`(4371)；codex/node/node-repl 路径解析 `fi/pi/mi/hi`(4442-4559)；`ai/oi` mjs 入口探测(4395-4431) |
| 4560-4693 | 应用 | artifact-session 线程配置 | `gi='artifact_session'`、`ine='@oai/artifact-tool/artifact-session/service'`(4560-4562)；node-repl 注入脚本模板 `sne`（内嵌 `Object.defineProperty(globalThis,"artifactSession",...)`，4567-4576）；server_instructions JSON `cne`(4577-4589)；配置应用 `vi`(4590)；thread config `lne/une/xi/Si/Ci/wi/fne/Ti/Ei`(4640-4693) |
| 4694-4790 | 应用 | 特性桥接 + computer-use 应用路径 | `pne` browserSessionRegistry→setBrowserUseNativePipeEnabled 桥(4694)；marketplace kinds `Di`(4707)；bundled agent 名单 `Oi`(4712-4719)；`ki/Ai` marketplace 查找(4717-4728)；`ji='Codex Computer Use.app'`(4729)；canonical service 路径解析 `Ni/yne/bne/Li/Ri/zi`(4737-4790) |
| 4790-5452 | 应用 | CUA REPL 配置 + bundled 资源 + 浏览器运行时 | cua_repl `.mcp.json` 写入 `Bi/Vi/Sne`(4790-4836)；`Cne/Hi/Ui/Ene/Tne` bundled plugins 资源路径(4836-4905)；windows 路径常量 `Qi`(4940)；chrome profile 探测 `Ine..la`(4960-5044)；扩展商店 URL `pa/Bne/ma/Vne/Hne`(5066-5101)；chrome 安装迁移 `ha/ga/Gne/Kne/qne/Jne`(5142-5214)；`_a/va` 安装执行(5217-5269)；profile 洗选 `ya/ba/Yne/xa/Xne/Sa/Zne/Qne`(5300-5400)；录音技能注入片段 `$ne`（含 `sky.start_audio_recording` 代码示例，5402-5412 直接证据）；音频开关 `Ca/tre`(5416-5452) |
| 5452-6738 | 应用 | **插件市场（marketplace）核心** | 物化键 `wa/Ta/nre/Ea/Da/Oa`(5452-5490)；`Pa = r.r('BundledPluginsMarketplace')`(5491)；总体协调 `Fa`(5493)；安装归因错误分类 `za/Ba`(5934-5958)；逐插件安装 `La/Ra/lre/Ha/Ua/ure/dre`(5818-6244)；安装流水线 `fre/pre/mre`(6242-6311)；skills/extension-ids 同步 `Wa..Za/Qa`(6312-6402)；状态计数 `_re/eo/to`(6415-6428)；**reconcile 核心 `vre`**(6429-6738，chrome 插件 store 同步 + copy_chrome_plugin_app_server_codex_runtime 阶段直接证据) |
| 6739-7127 | 应用 | chrome 原生宿主同步 | 路径脱敏 `no/yre/bre`(6739-6760)；卸载请求 `ro`(6761)；runtime 解析 `lo`(6981)；dev 覆盖 `Ere`(7001)；host 安装 `fo/po/mo/ho/go/_o/vo/yo/bo/xo/So`(6986-7119)；插件 surface 映射 `Co`(7120，`control-in-app-browser/control-chrome/computer-use` 直接证据)；`wo` 按 marketplace 装原生宿主(7127) |
| 7181-7998 | 应用 | **browser-use 选择与线程配置** | `To = r.r('BrowserUseSelection')`、`Eo` WeakMap(7181-7182)；选择计算 `Do`(7183-7230，backends=iab/chrome、computerUse、cuaReplSurfaces 直接证据)；`kre` backends 谓词(7258)；`ko='native_pipe'` + 工具 schema `Ao/Are/jre/Mre`(7279-7406)；JSON-RPC 消息 schema `zre/No/Bre`(7407-7429)；`Po = r.i('computer-use-native-pipe-server')`(7430)；服务端工厂 `Wre/qre`(7437-7743)；客户端 `Lo/Ro/$re/eie/tie/nie`(7744-7780)；`zo='--previous-notify'` codex notify 配置改写 `iie..uie`(7779-7855)；客户端单例 `Uo/Wo/fie/pie`(7861-7998) |
| 7999-8222 | 应用 | browser-use 线程配置续 | `Go='NODE_REPL_HOST_SERVICES_PIPE_PATH'/mie`(7999)；`Ko = r.r('BrowserUseThreadConfig')`(8003)；配置应用 `qo/bie`(8009-8181)；受信路径 `Sie`、`Yo/Xo` WeakMap(8193-8195)；`wie extends n.Uf` 插件变更后同步(8210-8218)；`Qo/Tie`（写入 `browser/config.toml` + full_cdp_access_enabled/webmcp_enabled 直接证据，8219-8307） |
| 8223-8737 | 应用 | computer-use 配置 + codex-app-tools | `Eie/$o`(8308-8333)；`Die='computerUseOverlay.usingComputer'`(8334)；config.json 写入队列 `ts`(8342)；本地化/主题 config 写入 `Iie/ns/Lie..is`(8352-8453)；`as='CODEX_APP_TOOLS_PIPE_PATH'` + codex_app MCP 配置 `Jie/Xie/os/Zie/ss`(8457-8564)；hostConfig 判定 `J/us/ds/Qie`(8574-8624)；remark-directive 输出约束模板 `eae`(8636-8692)；自动化权限求解 `fs/ps/ms/hs`(8693-8737) |
| 8738-9982 | 应用 | **automations 子系统** | 常量 `nae/gs/_s/rae/iae/vs/ys/aae`(8725-8734)；`xs = r.i('automations')`(8735)；rrule 调度 `ws/sae/Ts/Es`(8738-8805)；运行 `cae/lae/Ds/uae/dae/fae/pae/mae`(8806-9164)；turn 执行 `Os/ks/As/js/gae/_ae/vae/yae/Ms/bae/xae/Sae/Cae/wae/Tae/Ns`(9165-9805)；线程通知 `Ps/Eae/Dae/Oae/Fs`(9806-9982) |
| 9983-11091 | 应用 | windows 原生应用图标（sky addon） | 截图 schema `kae`(9983)；图标提取 `Pae/Fae/Rs/zs`(9990-10075)；**`Bs='sky.node'` addon 加载器 `Vs`**(10076-10085，`native/sky-addon/build/Release-<arch>/sky.node` 直接证据)；LRU `Lae/Rae`、缓存 `Hs`、schema `Bae`(10086-10101)；图标函数族 `Us..Wne`(10102-5452 顺序碎片)；app icon 元数据解析 `Fc`(10970-11004)；字节序 helpers `Ic/Vc/Hc/Uc`(11000-11092) |
| 11093-11378 | 应用 | 浏览器站点数据 + local→bundled 迁移 | persist 前缀 `Wc`(11095)、SIWC cookie 名 `Kc`(11098-11107)；语言设置 `Yc`、cookie 清理 `Xc`、站点数据清理 `Zc`(11110-11150)；IAB 开关 `el/tl/nl`(11151-11157)；`Vae` options 类(11158)；`rl = r.r('BrowserUseLocalToBundledMigration')` + `qae..$ae`(11203-11319)；bundled 插件描述符清单 `al`(11323-11377，`n.Ll.codexAppTools/browser/chrome/chromeDev/.../computerUse/messages/recordAndReplay/latex/notebook/pullRequests` 直接证据) |
| 11412-12113 | 应用 | **bundled plugins 编排器** | `ol = r.i('bundled-plugins')`(11412)；工厂 `ioe`(11417-11947，含 ssh 远端 reconcile、chrome 扩展状态同步、marketplace 描述符装配)；`ll/ul`(11948)；`dl = r.i('chrome-native-host-cache-watcher')` + watcher `aoe`(11961-12046)；skills/chronicle 归档 `ooe/loe/fl..hl`(12047-12113) |
| 12115-12245 | 应用 | 分块消息 + codex-app-config | `ChunkedMessageSender` logger(12117)；`moe` 注册 `l.ipcMain.on(a.Ct,...)` ack 通道(12164-12170)；`gl = r.i('codex-app-config')`(12171)；codex-app/config.json 读取/校验 `xoe/vl/boe`(12171-12229)；错误对话框 `yl/Soe`(12230-12245) |
| 12368-12548 | 应用 | **managed computer-use** | `Coe='CODEX_ELECTRON_SKIP_COMPUTER_USE_CANONICAL_REFRESH'`(12368)；canonical 刷新 `Toe`(12370)；**`Eoe` managed-computer-use-service 类**(12377-12506，logger 直接证据，spawn `SkyComputerUseService`、appshots/computerUse/skysight 开关)；`Ooe/koe/Aoe/bl` CUA 应用路径解析(12524-12548) |
| 12549-12918 | 应用 | skysight 录制 + 激活归因 + 文件关联 | **`joe/Moe` skysight 录制服务管理器**(12549-12748，skysightStart/Stop 状态机 + 旧 chronicle skill 归档直接证据)；**`Foe` 激活回执管理器**(12749-12917，deep-link/notification 激活去重 + installer install_id 归因；175,957 `new Foe(...)` 在启动区消费，直接证据)；**文件关联表 `xl`**(12863-12918，CSV/DOCX/PPTX/TSV/... advertiseOnLinux)；派生 `Ioe`(12918-12919) |
| 12920-13138 | 应用 | argv 打开 + dock menu | 扩展名集合 `Loe/Sl`(12920-12923)；argv 项目路径提取 `Cl/Roe/zoe/Boe/Voe`(12924-12957)；dev 父进程看护 `Hoe..Qoe`(12959-13037，CODEX_ELECTRON_DEV_PARENT_PID 轮询父进程存活否则 app.quit)；trayMenu 文案常量(13038-13054)；**`ose` DockMenuManager**(13056-13105，`l.app.dock?.setMenu` 直接证据)；菜单构造 `sse/Rl/zl`(13107-13137) |
| 13139-13797 | 应用 | **native pipe 帧协议 + 服务端** | **`Bl` 帧超限错误**(13139)；`cse` 单连接客户端(13146-13239)；帧编码 `Vl`(13240)；**`lse` 帧解码器**(13246-13329，4 字节长度前缀 + Buffer 解析，fse=8,388,608 上限 13351 直接证据)；工具 `use/Hl/Ul/dse`(13330-13350)；管道发现/客户端 `_se/vse/yse/bse/xse/Gl/Sse/Cse/wse/ql`(13438-13562)；**`Tse` NativePipeServer 类**(13577-13734，`E.default.createServer` + socketPeerAuthorizer)；管道目录 `jse/Mse/Nse/Pse/Xl`(13738-13797) |
| 13799-13987 | 应用 | 对端鉴权 + dynamic-app-tools 管道 | `Fse='CODEX_BROWSER_USE_PEER_AUTHORIZATION'/Ise='browser-use-peer-authorization.node'`(13799-13800)；**`Ql` 对端鉴权工厂**(13806-13842，打包态强制鉴权、`_handle.fd` 提取)；`zse` fd 提取(13843)；**`$l = r.i('dynamic-app-tools-native-pipe')`** + JSON-RPC schema `Bse/Vse` + 服务端 `Hse/Uce/Wse/tu/Gse`(13847-13981)；`Kse='in_app_browser'` 可用性 `Jse/Yse`(13988-14017) |
| 14019-14105 | 应用 | installer 归因 | attribution JSON schema `nu/Zse/Qse`(14019-14034)；**`$se extends n.Uf`** 安装归因读取/确认(14041-14088，O_NOFOLLOW/权限位校验直接证据)；`iu` 单例 + `au()`（`~/Library/Application Support/com.openai.codex.installer`，14089-14105 直接证据） |
| 14106-14335 | 应用 | projects 状态读取器 | project schema `ece/ou/tce/nce/rce/ice/ace`(14121-14212)；local projects 迁移 `oce/sce`(14153-14212)；状态读取 helpers `su/lce/uce/cu/lu/fce/uu/du/pce/fu/mce/pu/mu/hce/hu/gu/gce/_u`(14213-14335) |
| 14336-14753 | 应用 | **数据迁移（global-state）** | `vu = r.i('automation-project-migration')` + `bce/xce/Sce/Cce`(14336-14435)；`yu` promisify、`Tce/bu/Ece/Dce/Oce` local projects 修复(14437-14521)；`xu = r.i('remote-project-migration')` + `Su/Ace/Cu..Tu`(14523-14704)；**迁移清单 `Pce`**（2026-07-13/14 六项）+ 执行器 `Fce/Ice` + `Du`(14706-14752，完成标记 `a.B`、下载历史清理 `a.W` 直接证据) |
| 14755-14876 | 应用 | remote-control 状态 + node-repl host 管道 | **`Ou/ku/Au` 顶层可变状态**(14755-14757)；`Lce/ju/Rce/Mu/zce/Bce` remote control enabled/会话管理(14758-14790)；`Nu = r.i('node-repl-host-services-native-pipe')` + ensureService schema `Vce/Hce/Uce`(14792-14871) |
| 14878-14978 | 应用 | react-devtools 扩展 | `Fu = r.i('react-devtools-extension')`、`Iu='fmkadmapgofadopljbjfkapdkoienihi'`(14878-14879)；Chrome/Edge profile 探测加载 `Gce..Xce`(14880-14955)；`Zce` remote_control config 迁移(14959) |
| 14980-15032 | 应用 | computer-use 活动跟踪 | toolSurface schema `Qce/$ce/Lu`(14980-14990)；`ele` app-server 通知订阅（item/started→turn/completed→thread/* 映射线程活跃，14992-15030） |
| 15033-15673 | 应用 | avatar overlay realtime + 几何 | `tle=3e4`；**`rle` RealtimeVoiceController**(15036-15261，logger `avatar-overlay-realtime`，session reservation/launch 超时直接证据)；语音控制器注册表 `Ru/ile/zu`(15035,15263-15271)；光标跟踪 `Bu/Vu/Hu/sle/cle`(15271-15327，cursorSource native/renderer、跨屏判定)；尺寸/锚点 `Uu/kle/Ale/fd..Ad`、磁吸几何 `mle/Qu/$u/hle/gle/ed/td/nd/_le/vle/yle/ble/rd/id/ad/od/sd/cd`(15331-15673) |
| 15674-18089 | 应用 | **avatar overlay 窗口管理器** | 常量 `xle='/avatar-overlay'` + 布局常量族(15674-15705)；**`Hle` 类**(15706-18089，logger `r.i('avatar-overlay')`，BrowserWindow 生命周期、nonactivatingPanelBridge、quick-chat 焦点恢复（osascript JXA 直接证据 15928-15955）、display-metrics/powerMonitor 监听、mouse passthrough/input shape、globalState 键 `a.P` 读写 17101-17828) |
| 18090-18701 | 应用 | remote-hosted PIP（画中画） | helpers `bd..jd`(18090-18168)；`Xle` tooltip 键(18171)；`oue/lue` **PIP 管理器工厂**(18181-18701，长闭包：任务可见性状态（消费 `sue`/`a.Q` 键）、browser frames、控制 tooltip、WSL 脚本 8549)；`Md/due/fue` 窗口 ensure/show(18711-18766) |
| 18778-19112 | 应用 | app-server 状态对账 + 子进程监控 + bundled git | `Pd='state_5.sqlite'` + 临时状态对账 `_ue/vue/yue/bue/xue/Sue`(18780-18957，better-sqlite3 `Vd()` 18985 直接证据)；列交集 helpers `Fd/Id/Ld/Rd/zd/Bd`(18959-18990)；**`Hd/Cue` child-process-gone 监控**(18992-19056，GPU/AudioService 可恢复分类)；**bundled git 环境装配 `Tue/Oue`**(19058-19111，resources/git 目录完整性校验 + GIT_CONFIG_SYSTEM/GIT_EXEC_PATH 直接证据) |
| 19113-20,000 | **vendored** | character-entities 数据 | `Ud` 字符计数(19113)；`kue` legacy 实体表(19121)；`Wd` windows-1252(19135)；字符分类 `Gd/Aue/jue/Kd`(19155-19168)；`qd` 命名实体表(19170-21,298，跨过 20,000 边界)；后续 21,299 `Jd` 查表、21,302+ `Nue/Yd`（parse-entities），归 R3/micromark 带处理 |

---

## 2. vendored 识别

| 包 | 版本 | 行区间 | 证据 | 置信度 |
|---|---|---|---|---|
| **@tanstack/query-core** | v5（结构对应 5.x；`_defaulted`、#私有字段、`focusManager` visibilitychange API 均为 v5 形态） | 955-2411 | `QueryClient` 构造 `queryCache \|\| new Mee()`(2218)、`mount()` 订阅 Qt/_n(2222-2224)、`CancelledError(revert/silent)`(1362)、`notifyManager` `batch/batchCalls/schedule`(1256-1314)、`updateGcTime` `hn.isServer() ? 1/0 : 3e5`(1453-1455)、infinite query `getNextPageParam/maxPages`(1462-1530) | 高 |
| **character-entities（+legacy +windows-1252）** | 与 micromark 生态同源（~2024） | 19,113-21,298（R2 内 19,113-20,000） | `AElig: 'Æ'` 等 2100+ 实体键值表(19,170 起)；legacy 表 `AElig.AMP.Aacute...`.split('.') (19,121)；windows-1252 `0: '�', 128: '€'`(19,135-19154) | 高 |

注意与粗扫 §7 的关系：粗扫将 19,113-21,000 归入「杂项工具带/R2」。实际 19,113 起即为 micromark 依赖的实体数据的一部分（粗扫 §7 的 micromark 区起点应前移至 19,113）。

**原生 addon（非 vendored，重写时需原生桥）**：
- `sky.node`（10,076 `Bs`，加载器 `Vs` 100,78：`native/sky-addon/build/Release-<arch>/sky.node`）——computer-use 录音/图标/应用信息
- `devicecheck.node`（3,085 `er`，`nr = createRequire`）——Apple DeviceCheck attestation
- `browser-use-peer-authorization.node`（13,800 `Ise`，13,808 `Rse((0,h.join)(r,'native',Ise))`）——macOS 管道对端鉴权
- `better-sqlite3`（18,985 `Vd()`：`require("better-sqlite3")`）
- windows-updater.node 等 bootstrap 侧的 addon 不在本区间

---

## 3. 子系统聚类与模块拆分方案

### 3.1 native-pipe 帧协议簇（建议模块：`native-pipe-protocol` / `native-pipe-server` / `peer-socket-authorizer`）

- 行区间：13,139-13,797（协议）+ 13,799-13,846（鉴权）
- 主要定义：`Bl`→`PipeFrameLimitError`(13139)、`cse`→`PipeClientConnection`(13146)、`Vl`→`encodeFrame`(13240)、`lse`→`FrameDecoder`(13246)、`fse`→`MAX_FRAME_BYTES=8388608`(13351)、`_se..ql`→`discoverPipeClients/connectPipe`(13438-13562)、`Tse`→`NativePipeServer`(13577)、`jse..Xl`→管道目录管理(13738-13797)、`Ql`→`createSocketPeerAuthorizer`(13806)、`zse`→`extractSocketFd`(13843)
- 该协议被四个服务复用：computer-use native pipe（`Uo/pie` 7,861+，`Po/Wre` 7,430-7,743）、dynamic-app-tools（`$l/Hse` 13,847-13,981）、node-repl host services（`Nu/Hce` 14,792-14,871）、browser-use `NODE_REPL_HOST_SERVICES_PIPE_PATH`（`Go/mie` 7,999）。**拆分时必须独立为共享模块**，否则四处复制。
- 客户端侧（7,779-7,999 + `Lo/Ro` 7,744）：`iie..uie`→notify 配置注入（写 codex CLI 的 notify 配置段），建议模块 `computer-use-notify-config`。

### 3.2 computer-use 簇（`computer-use-*`）

- `computer-use-config-writer`（8,223-8,453）：`Iie/ns/Lie/Rie/zie/Bie/Vie/Hie/Uie/Wie/Gie/rs/Kie/qie/is`——写 CUA config.json（串行队列 `ts` 8,342）+ `Die='computerUseOverlay.usingComputer'`（8,334）
- `computer-use-app-resolution`（4,729-4,790 + 12,524-12,548）：`ji/Li/Ri/zi/koe/Aoe/bl/Ooe/Coe/Toe`——解析 `Codex Computer Use.app` 路径与 canonical 刷新
- `managed-computer-use`（12,377-12,506）：`Eoe`→`ManagedComputerUseService`（spawn `SkyComputerUseService`、respawn 串行化）
- `computer-use-native-pipe`（7,437-7,761 + 7,861-7,998）：服务端 `Po/Wre/qre`、客户端 `Uo/Wo/fie/pie`、选择计算 `To/Eo/Do/Oo/kre`（7,181-7,257）
- `computer-use-selection` 建议并入上一条；`computer-use-activity-tracker`（14,980-15,032）：`ele` app-server 通知→线程活跃
- `skysight-recording`（12,549-12,748）：`joe/Moe`→`SkysightServiceManager`（skysightStart/Stop；录音技能注入在 5,402-5,452，可归此模块）
- `windows-native-app-icons`（9,983-11,091）：`Pae..Wne/Us..Ks/Bae/Hs` + sky addon 图标族（LRU `Is` 9,987）

### 3.3 插件市场簇（`bundled-plugins-*`）

- `bundled-plugins-marketplace`（5,452-6,738 核心 + 4,707-4,728 + 11,323-11,377）：`Pa/Fa/vre/Ra/La/_re/to/za/Ba`；物化键 `wa/Ta/nre/Ea/Da`
- `chrome-native-host-sync`（6,739-7,127 + 11,961-12,046）：`no..Co/wo` + `dl/aoe` cache-watcher
- `bundled-plugins-orchestrator`（11,412-11,947 + 12,047-12,113）：`ol/ioe` 大工厂（远程 ssh reconcile、chrome 扩展同步、skills 变更通知）+ chronicle 归档
- `cua-repl-config`（4,790-4,836）：`Bi/Vi/Sne` 写 cua_repl `.mcp.json`
- `browser-runtime-resolution`（4,940-5,452）：chrome profile 探测、扩展商店 URL、chrome 安装迁移（`ha/ga..qne`）、录音技能注入
- 依赖方向：orchestrator → marketplace → chrome-native-host-sync / computer-use-app-resolution；`browser-use-thread-config`（7,999-8,222：`Ko/qo/bie/wie/Qo/Tie`）读 marketplace 状态——是 fan-in 点。

### 3.4 browser-use 簇（`browser-use-*`）

- `browser-use-rpc-client`（2,555-2,773）：`kn`→`RpcChannel`、`ite`→`BrowserUseClient`、`In`→管道路径
- `browser-use-thread-config`（7,999-8,222）：写 `browser/config.toml`（full_cdp_access_enabled/webmcp_enabled）
- `browser-site-data`（11,093-11,157）：persist partition/cookie/SIWC 清理
- `browser-use-migration`（11,203-11,319）：`rl/qae..$ae` local→bundled
- `in-app-browser-availability`（13,988-14,017）：`Kse/Jse/Yse`
- `execution-host-process`（2,774-2,957）：`fte/pte/mte/hte` 进程 spawn/等待包装（browser-use 的宿主执行）

### 3.5 artifact session 簇（`artifact-session-*`）

- `artifact-session-host`（3,704-4,181）：`Hte`→`ArtifactSessionHostLifecycle`、env 键 `Yr`
- `artifact-runtime-install`（4,182-4,370）：`Xr/Ute..Kte` runtime-generations 安装
- `runtime-paths`（4,433-4,559）：`fi/pi/mi/hi`（CODEX_CLI_PATH/CODEX_BROWSER_USE_NODE_PATH 等解析，被 computer-use/browser-use 共用）
- `artifact-session-thread-config`（4,560-4,693）：`gi/sne/cne/vi/lne/une/xi..Ei`（node-repl 全局 `artifactSession` 注入模板直接证据）
- `artifact-session-bridge`（4,694）：`pne`

### 3.6 avatar overlay 簇（`avatar-overlay-*`）

- `avatar-overlay-realtime`（15,033-15,271）：`rle`→`RealtimeVoiceController`、`Ru/ile/zu` 控制器注册表
- `avatar-geometry`（15,271-15,673）：`cle`→`CursorTracker`、`mle/Qu/$u/hle/gle/ed..cd` 锚点/磁吸几何
- `avatar-overlay-window`（15,674-18,089）：`Hle`→`AvatarOverlayWindowManager`（quick-chat、显示变更、PIP 交互策略；读写 globalState 键 `a.P`）
- `remote-hosted-pip`（18,090-18,701）：`sue`→`PipTaskVisibilityStore`（18,221）、`oue/lue` PIP 管理器工厂（状态键 `a.Q`）
- avatar 弹簧/布局常量在 359-394（跨区域常量，拆分时归入 `avatar-geometry` 或独立 `avatar-constants`——采样推断）

### 3.7 automations 簇（`automations`，8,725-9,982）

- 调度 `ws/sae/Ts/Es`、执行 `cae..mae/ks..Ns`、通知 `Ps/Eae/Dae/Oae/Fs`；remark-directive 模板 `eae`（8,636）。与 marketplace 协同（自动化的 hosted 开关走 `n.zt`）。
- 建议：`automations-scheduler` + `automations-run` + `automations-notifications`，或整体一个模块（~1,250 行，单模块可行）。

### 3.8 misc 应用簇

- `delegation-protocol`（66-95）+ `account-plans`（97-120）：极小，可并入 `conversation-protocol`（下游 R3 命名）或独立
- `app-server-connection-registry`（913-952）：`cee`
- `worktree-eviction`（691-731 + 2,415-2,554）：`Iee/Lee/Ree/Vee`（turn 锁管理器 `Vee` 可独立 `turn-lock-manager`）
- `link-open-policy`（365-503）+ `browser-session-keys`（505-543）：in-app-browser 判定 `ze..Je`、partition/restore 键
- `git-url-parser`（544-601）、`projectless-workspace`（603-692）、`download-helpers`（348-363）
- `env-toml-stringifier`（794-912）：`Wt..Xt`（自定义 TOML 写出）
- `desktop-feature-availability`（3,265-3,581）：`_r/vr/br/xr/Tr/Er/Or/Ar/jr/Mr/zr/Br/Vr`
- `startup-phase-runner`（3,527-3,581 内的 `Br`）；`ambient-suggestions-refresh`（3,594-3,701）
- `devicecheck-attestation`（3,084-3,264）
- `chunked-message-sender`（12,115-12,170）：`moe` + ipcMain ack（bootstrap 频道 `a.Ct`）
- `codex-app-config`（12,171-12,245）
- `open-activation-attribution`（12,749-12,917 + 14,019-14,105）：`Foe` + `$se/iu/au`（installer install_id 归因）
- `file-associations`（12,863-12,920）+ `open-project-argv`（12,920-13,037）+ `dev-parent-watchdog`（12,959-13,037）
- `dock-menu`（13,038-13,137）：`ose`→`DockMenuManager`（注意：真正的托盘菜单在 16 万区，这里是 `app.dock.setMenu`）
- `data-migrations`（14,106-14,725）：`vu/xu/Pce/Ice`（global-state 迁移，读 `a.B/a.W` 键）
- `projects-state-readers`（14,106-14,335 的 schema/readers 部分）
- `remote-control-state`（14,755-14,790）：`Ou/ku/Au/ju/Mu/zce/Bce`
- `node-repl-host-pipe`（14,792-14,876）
- `react-devtools`（14,878-14,978）
- `app-server-state-reconcile`（18,778-18,957）+ `child-process-monitor`（18,959-19,057）+ `bundled-git`（19,058-19,112）
- `thread-state-keys`（765-912 中的键名部分：`Lt/zt/Bt/eee/Ht` 等）

---

## 4. 顶层可变状态清单

（模块级 `var/let` 且被运行时改写；类字段不算。行号核实过）

| 名 | 行 | 语义 | 读/写方 | 证据 |
|---|---|---|---|---|
| `G` | 121 | `e.a(n.Ld())` interop 产物，语义不明 | — | 低（深析时下游确认 `n.Ld`） |
| `_e` | 187 | `e.a(n.id())` interop 产物 | — | 低 |
| `Qt` / `$t` / `hn` / `gn` / `_n` | 974/1003/1224/1315/1319 | TanStack focusManager/timeoutManager/isServer/notifyManager/onlineManager 单例（vendored） | query-core 内部 + 63,124 QueryClient | 高 |
| `vr/yr/br` | ~3358-3367 | desktop feature availability 当前状态（60+ 开关） | 写：`jr/Mr`(3,456-3,505 配置加载)、`Ar`(3,422)；读：`Tr()` 全文件 | 高 |
| `xr` | 3,368 | availability 已加载标志 | `jr` 写；`Er` 读 | 高 |
| `Sr/Cr` | 3,369-3,370 | availability 变更订阅集 | `Ate/Dr`(3,380-3,400) | 高 |
| `Eo` | 7,182 | WeakMap: connection→(codexHome→computer-use 插件路径 promise) | 写 `Ore`(7,235)；删 `Oo`(7,232) | 高 |
| `Wo` | 7,862 | computer-use native pipe 客户端单例持有者 | 写 `pie`(7,866 内)；读 `fie`(7,863) | 高 |
| `Yo/Xo` | 8,194-8,195 | WeakMap: connection→串行化 promise / 关联缓存 | `Qo`(8,219) 写读 | 中 |
| `ts` | 8,342 | Map: configPath→写入队列 promise（CUA config.json 串行写） | `Vie`(8,389) | 高 |
| `Is` | 9,987 | Map LRU: bundleId→icon promise（容量 `Lae=100`） | `Pae`(9,990) 写删 | 高 |
| `Hs` | 10,089 | Map: bundleId→sky addon 查询 promise | `Us..`（10,102+） | 高 |
| `el` | 11,151 | IAB（in-app browser）可用性 flag | 写 `tl`(11,152)；读 `nl`(11,155) | 高 |
| `iu` | 14,105 | installer 归因单例（$se 实例，惰性 `au()`） | `au`(14,106)；消费在 175,957 `new Foe(...readPending())` | 高 |
| `Ou` | 14,755 | Set: remote control enabled（按 scope） | `ju`(14,761)/`Lce`(14,758) | 高 |
| `ku` | 14,756 | Set: remote control 会话活跃 scope | `Mu`(14,767)/`Rce`(14,764) | 高 |
| `Au` | 14,757 | Map: scope→会话（accountId/userId/threadIds） | `Mu`/`zce`(14,771)/`Bce`(14,782) | 高 |
| `Ru` | 15,035 | WeakMap: window→voice controller 注册表 | `ile/zu`(15,263-15,270) | 高 |
| `xl` | 12,863 | 文件关联表（const，含 advertiseOnLinux） | 只读；派生 `Ioe`(12,918) | 高 |
| `Loe` | 12,920 | Set: open-with 扩展名（const 语义） | `Sl`(12,921) | 高 |
| `Mt/Nt/Pt/Ft/It` | 755-764 | Owl go-links / 限速 / shell 名 / interop（`Ft/It` 语义不明，`e.a(n.Oo()/n.Do())`） | — | 低-中 |

---

## 5. 顶层副作用序列（模块加载即执行）

区间内列 0 非声明语句（`grep -nE '^[a-zA-Z_$!(]'` 排除声明后）仅 5 处命中，其中 4 处（4,578 `Object.defineProperty(globalThis,"artifactSession"...)`、5,407/5,410 `await sky...`、8,549 WSL 脚本）都是**模板字符串内容**，非真实语句。真实的加载期执行序列：

1. **1-66**：全部 require + `e.a()` interop 绑定（直接证据）
2. **121 / 187**：`e.a(n.Ld())`、`e.a(n.id())`——纯 interop 调用
3. **974 / 1003 / 1315 / 1319**：query-core 单例构造（`new (class extends Zt)()` 等）——window 事件监听都被 `typeof window < 'u'` 守卫，主进程下惰性不触发（直接证据 1320-1334/983-996）
4. **12,919**：`xl.flatMap(({advertiseOnLinux...}) => ...)` → `Ioe`（粗扫 §6 已列出；纯数据推导，无 I/O）
5. **12,920 / 14,755-14,757 / 9,987 / 10,089**：`new Set()/new Map()` 空容器构造
6. **logger 创建**（`r.i()/r.r()`，构造 logger 对象，无 I/O）：3,084 `$n`、3,594 `Ur`、7,181 `To`、7,430 `Po`（链内）、7,861 `Uo`、8,003 `Ko`、8,343 `Pie`（链内）、8,465 `Yie`（链内）、8,735 `xs`（链内）、9,989 `Ls`（链内）、10,853 `Nc`（链内）、11,203 `rl`、11,412 `ol`、11,961 `dl`、12,117 ChunkedMessageSender、12,171 `gl`、12,378 `Eoe`（字段初始化在实例化时）、13,804 `Zl`、13,847 `$l`、14,336 `vu`、14,523 `xu`、14,792 `Nu`、14,878 `Fu`、15,038/15,710/17,101 等 avatar 区 `r.i()` 字段（实例化时）

**结论**：R1+R2 **没有** 粗扫 §6/§9.5 担忧的「模块加载期注册/接线」语句——13,165 的 `l.ipcMain.on(a.Ct,...)` 位于 `moe()` 函数体内（调用发生在启动装配期），16,074 等 `l.app.on` 均在方法内。所有 Electron/文件系统副作用都是**调用时**发生。**置信度：高**（列 0 语句全集已枚举）。

---

## 6. 跨 chunk 依赖

### 6.1 @chunk/shared（`n.*`，src-DldfpmrL.js）——本区间主要用法

- **zod 实例族**（构造 schema 逾 200 处）：`n.Of`(string,94)/`n.gf`(bool,48)/`n.wf`(object,46)/`n.bf`(literal,25)/`n.Cf`(number,21)/`n.Mf`(unknown,15)/`n.hf`(array,12)/`n.xf`(record,11)/`n.jf`(union,8)/`n.Ef`(record str,7)/`n.df`(enum,5)/`n.vf`(discriminated-union,3)/`n.Nf`/`n.Pf`/`n.Df`/`n._f`(自定义校验)/`n.yf`(任意)——出现频次为区间内 `n.x(` 调用计数（直接证据）
- **EventEmitter 基类** `n.Uf`：被 `fte`(2774)/`pte`(2802)/`mte`(2864)/`hte`(2888)/`wie`(8210)/`$se`(14041) 直接继承
- **global-state 键对象** `n.iu.*`：PROJECT_WRITABLE_ROOTS/LOCAL_PROJECTS/SELECTED_PROJECT/REMOTE_PROJECTS/REMOTE_CWDS_BY_HOST_AND_WORKSPACE/WORKSPACE_ROOT_*/ACTIVE_*/PROJECT_ORDER/SELECTED_REMOTE_HOST_ID（14,153-14,538 密集使用）
- **codex home/flavor**：`n.Oi()`(codexHome)、`n.Ul(flavor→marketplace)`、`n.Vl`(默认 marketplace)、`n.Kl`(computer-use mcp 名)、`n.Fl`(computer-use 插件名)、`n.Rl`、`n.$l`、`n.Jl/ql`(node 路径 env)
- **插件安装工具**：`n.Bo/Kt/$t/Xt/Jt`（plugin 路径/native host 安装）
- **路径解析**：`n.In/Ln/Rn`（codex/node/node-repl CLI 路径）——`fi`(4,442) 作为默认参数注入
- **浏览器族配置** `n.Pc.*`（userDataDirectorySegments/extensionManagementUrl 等，5,381/5,066）；**bundled 插件描述符** `n.Ll.*`（11,323-11,377）
- **TOML**：`n.wi`(parse，7,807)、`n.wr/n.Er`(rrule，8,741-8,747)
- **项目/cwd 工具**：`n.Jo`(projectId 规范化,9)、`n.No`(数组键读)、`n.Ns`、`n.qo`、`n.Wo`、`n.zt`(hosted instructions)、`n.zi`(hostConfig→wsl)、`n.Hr`(平台路径 join)、`n.Bn`(win WSL 检测)、`n.Ri`(sqlite home 探测)
- **PATH/env**：`n.Yn`(读 PATH)/`n.qn.resolve`/`n.Xn`(写 PATH)（bundled git，19,085-19,103）
- **链接策略**：`n.ef`(默认 open-link preference)、`n.bl/n.xl/n.Tl/n.El`（localhost 文件判定，465-472/486-496）
- **其他**：`n.ac`(abortable promise,14,-- )、`n.tu`(computer-use server 判定,10,-- )、`n.zc`(store url)、`n.Bc`(browser family 校验)、`n.Ia`(openLinkInTargetPreference schema)、`n.Ha/n.Fa`(settings 键)、`n.Pf`、`n.ia`(spawn tracing,2,-- )

### 6.2 logger chunk（`r.*`）

`r.i(name)` / `r.r(name)` 具名 logger（见 §5 列表，27 个具名）；`r.n()` 根 logger（14,-- Zce 默认参、18,-- 多处）。名称即子系统指纹，与粗扫 §4 一致。

### 6.3 bootstrap chunk（`a.*`，对照 bootstrap-export-table.txt）

| 导出符号 | bootstrap 名 | 区间内用法 | 行号 |
|---|---|---|---|
| `a.in` | build flavor 模型 `M` | 40 处：`a.in.resolve()`、`a.in.Prod`、`a.in.isInternal()`、`a.in.shouldIncludeBrowserUsePeerAuthorization()`、`a.in.readFromPackageMetadata()` | 3,425/4,617/4,770/13,806 等 |
| `a.P` | globalState 键（`XE`，avatar 布局状态） | avatar overlay 窗口状态持久化 | 17,101/17,164/17,327/17,820/17,828 |
| `a.Q` | globalState 键（PIP 任务可见性） | `sue` 构造/commit | 18,227/18,270 |
| `a.B` | `kE`（迁移完成 id 集合键） | `Ice` 迁移执行器 | 14,750 |
| `a.W` | `Hw`（下载历史键） | `Du` 清理 | 14,753 |
| `a.Ct` | `Dw`（IPC 频道） | `moe` chunked-message ack `l.ipcMain.on(a.Ct,...)` | 12,165 |
| `a.bn` | `je`（browserTabId 解析） | renderer 窗口键解析 | 342 |
| `a.x()` | `jO` 装配单例 | **不在本区间**（唯一命中 175,839） | — |

（其余 `a.*` 命中为局部变量遮蔽——区间内 `a` 大量被用作函数参数名，解读时需逐处甄别；上表已剔除假命中。）

### 6.4 其他 chunk

- `o.t(...)` resources-path 解析：9 处（8,352/9,991/13,815 等）
- `i.*`（main-shared src-C9YLnbgY）：本区间**未发现可靠用法**（`i.data/i.x` 等命中均为参数遮蔽；`i.Emitter` 最早出现在 130,002）——采样推断，置信度中
- `s.*`（dist chunk）、`t.*`（open-path-queue）：区间内命中多为局部变量遮蔽，未确认直接依赖（低置信度，下游按需复核）

---

## 7. 拆分风险

1. **vendored 边界两处修正必须落进派发计划**（§0）：955-2411 query-core 与 19,113-20,000(+21,298) 实体表。若按「应用区域」切给重写 agent 而不剔除这两带，会白白派发 ~1,700 行机械代码，且 query-core 的重写极易出错。query-core 的应用接线在 63,124（R6/AppServer 区）——拆分后须以 npm `@tanstack/query-core` 提供 `Nee(QueryClient)/Dee(Query)/Mee(jee)(Cache)/Qt/_n/gn` 等对接面。
2. **20,000 边界切在 `qd` 实体表中间**（19,170-21,298）：R2 与 R3 的派发边界应改为 19,113（把整段实体数据+parse-entities 归 micromark vendored 带）。
3. **名字冲突（重写命名陷阱）**：
   - `iu`（14,105，installer 归因单例）vs `n.iu`（global-state 键对象）——同名不同物；
   - `si`（4,446，NODE_REPL env 键）vs 粗扫提到 shared chunk 的 `n.si`（sqlite）；
   - `ts`（8,342，CUA config 写队列）vs 顶层 `te`（zlib 绑定）；
   - `kn`（2,567，browser-use RPC 基类）与后续区域 LSP vendored 的类名风格无分界规律（粗扫 §2 结论）。
   重写时必须建立「压缩名→语义名」对照并全局检索同名。
4. **惰性求值模式必须保留**：`Tr()`/`Er()`（feature availability 访问器，3,372-3,378）、`au()`（installer 归因，14,106）、`Ql()`（peer authorizer，13,806）、`Vs`（sky addon，10,078）——均为**首次调用时**才读配置/加载原生 addon。任何把这些改成 import-time 求值的重写都会改变失败时机（例如 missing-package-build-flavor 警告 13,809 将提前触发）。
5. **WeakMap 单例键控生命周期**：`Eo`(7,182)/`Yo/Xo`(8,194)/`Ru`(15,035) 以 connection/window 对象为键做去重与串行化。重写若改为显式注册表，需要挂 dispose 钩子，否则内存语义改变。
6. **初始化顺序**：`Hle`（avatar overlay 窗口管理器）在构造时读 `l.BrowserWindow.isInputShapeSupported()`（15,712）——Electron app ready 前实例化会失败；同样 `Ql` 读 `l.app?.isPackaged`。这些类都由启动流程（Ust/17 万区）在 whenReady 后构造，模块拆分后必须保持「构造延迟到装配期」。
7. **`moe` 的 ipcMain 注册依赖 bootstrap 频道表**：`a.Ct` 需与 bootstrap-analysis.md 的 IPC 频道名（bootstrap 19,739-19,793 `Tw~Yw`）对齐后再定契约。
8. **跨簇 fan-in**：`vre`（marketplace reconcile，6,429）调用 chrome 插件 store 同步与 `n.$t`（原生宿主安装），又被 `sre/ioe`（orchestrator）和 `wie/Qo/Tie`（browser-use thread config）消费；`fi`（runtime paths，4,442）被 computer-use 与 browser-use 两簇共用。拆分后建议以 `runtime-paths` 与 `bundled-plugins-marketplace` 为底层共享模块，避免新循环依赖。
9. **帧协议常量共享**：`fse=8,388,608`（13,351）、`Fo=4`（7,431）、`Vre=8,388,608`（7,432）三处独立定义上限；`Bl` 帧错误在 13,139。拆分后应统一到 `native-pipe-protocol` 单一定义点，否则协议上限漂移。
10. **turn 锁与 worktree 驱逐的时钟参数**（`zee=12e4`/`Bee=6e5`/`Pee=2026-02-21`）是有意钉死的迁移分界——重写时作为具名常量保留并注释，勿「规范化」。

---

## 8. 给下游派发的建议

- R2 应用深析已完成，可直接按 §3 模块清单派发重写；每个模块建议在任务描述中给出：行区间（§1）、压缩名→语义名（§3）、顶层状态（§4）。
- 955-2411、19,113-21,298 两带**不派发**（引上游库）。
- 12,377-12,748（managed computer-use + skysight）、15,674-18,089（avatar overlay 窗口）是本区间两个最大的单体类，单独派发并配行为测试清单（spawn/respawn、窗口焦点恢复 JXA、display 变更）。
