# main-C-Mhak1n.ts R6 深度分析（75,000-95,000 行）

目标：`src/main/main-C-Mhak1n.ts` 的 75,000-95,000 行（粗扫 §8 的 R6 区域）。
来源：macOS ChatGPT.app（Codex 桌面版 v26.917.71314）主进程 chunk。
方法：与 `docs/bootstrap-analysis.md` / `docs/main-analysis-r1-r2.md` 同一方法论——200-400 行窗口采样 + 关键区域（类定义头、区域边界、顶层副作用语句）精读；所有行号经 `grep -n` 核实。结论标注置信度：**直接证据** = grep/原文引用支撑；**采样推断** = 窗口采样得出，需下游复核。

**工具坑（沿用粗扫 §9.2）**：本机 grep 为 ugrep 7.8.4，BRE `\|` 多模式静默失效。本文所有多模式扫描均用 `-E 'a|b'` 完成。

## 0. 总览与对粗扫的三个重要修正

1. **修正一：75,000-79,277 是 vendored `yaml`（eemeli/yaml）库，且其真实起点远在 73,181 之前**。75,000 行正落在 yaml 的 tag 定义区（`PA`=seq tag、`FA`=string tag、`IA`=nullTag、`LA`=boolTag、`RA`=float tag……）。yaml 库从更早的行就开始（`Symbol.for('yaml.alias')` 等在 73,181-73,188，属 R5 尾部），本区间的 yaml 段是它的中后段：tag/collection/stringify（~73,000-77,55x）→ **CST 解析器 Lexer/Parser（~77,553-79,276）**。区间结束的直接证据：79,262-79,277 的 `Dj = e.t(...)` 是 yaml 的**总聚合导出模块**（`e.parse/e.parseAllDocuments/e.parseDocument/e.stringify/e.visit/e.visitAsync` + `Composer/Document/Schema/YAMLError/...` 全量 re-export）。**R5/R6 边界（75,000）切在 vendored yaml 中间——本区间 79,278 之前不派发应用重写，直接引 npm `yaml`。** 应用代码仅在 79,588 `sM`（memory-summary frontmatter 解析）用 `(0, Dj.parse)(t[1])` 消费该库（直接证据）。
2. **修正二：87,723-91,982 是第二块 vendored 带（minipass + tar）**，不是应用代码。粗扫把 88,960 `UIe(...)`、90,917/91,980 `lR(...)` 列为「未识别的应用级顶层副作用」——**均属 vendored tar 的内部装配**：`HIe = Object.defineProperty`/`UIe = (e,t) => {...}` 是 rolldown 的 `__export` helper（87,723-87,725 直接证据）；`ZI = Symbol('EOF')`/`QI = Symbol('maybeEmitEnd')`/`$I = Symbol('emittedEnd')`…（87,729-87,762）是 **minipass** 的私有 Symbol 表；`kL/ZIe` Pipe 类、`AL` Minipass 基类（87,780 `class extends w.EventEmitter`）逐字符对应 minipass 源码。tar 部分：`ER` Header（88,989 `class`，89,036 `ustar\x0000` 魔数直接证据）、`SR/wLe/CR/wR/TR` 类型码表（88,964-88,986 `OldFile/SymbolicLink/GNUDumpDir/...`）、`Wz` yallist 双向链表节点（90,529）、`eRe/tRe/gB/_B` create/replace/append 工厂（90,874-90,915）、`_z = lR(...)`（89,788）、`mV = lR(...)` + `lR(mV.syncFile, ...)`（91,964/91,980，即粗扫点名的 4 变体调用）——**tar@6 的函数族结构**（`tar.c/tar.r/tar.u/tar.x` 每个导出 syncFile/asyncFile/syncNoFile/asyncNoFile 四变体）。**重写时直接 `npm i minipass tar`，本带不派发。**
3. **修正三：粗扫对 R6 主题的行号锚点整体前移约 1,000-2,000 行**。由于 vendored yaml 实际占到 79,277，应用代码从 79,278 开始：export-logs 在 **80,875-80,997**（不是「80,000s 起始」）、demo-tools 在 **81,135-81,189**（粗扫的 81,135 精确命中 `Hje` 类）、external-agent-import 从 **81,974**（`Qje` devicecheck）延续到 87,723、global-hotkey 在 **92,791-93,419**、saved-custom-sections 在 **93,646-94,533**（94,235 `tBe` 精确命中）。另外粗扫把「claude-cowork-import / detached-window / conversational-onboarding / cross-instance lock / artifact-template / automation_update tool」都漏在主题清单外，它们占本区间约 4,000 行。

**本区间应用的 3 个导出中的 2 个**（`URe` 92,249 / `TV` 92,380，导出名 `t`/`n`）完整调用链见 §3.8。

---

## 1. 区域地图（行区间，每子区域 ≤1500 行）

| 行区间 | 类型 | 语义名 | 概述 |
|---|---|---|---|
| 75,000-79,277 | **vendored** | yaml（中后段：tags + CST/Lexer/Parser + 聚合导出） | 接 R5 尾部的 vendored yaml；`Dj` 聚合模块 79,244-79,277 导出全部 yaml API。应用侧仅 79,588 消费 `Dj.parse` |
| 79,278-79,468 | 应用 | launch-services-helper 封装 | `Oj/kj/Aj/jj/Mj`（zod schema：appPath/bundleId/displayName/isDefault）；`Nj/Pj/Fj/Ij` 走 helper 子命令（`list-web-url-handlers`/`app-for-bundle-id`/`notify-download-complete`）；`Lj/Rj/Vj/zj/Bj` set-app-icon（macOS 串行队列 `kj`） |
| 79,355-79,466 | 应用 | ambient memory summaries 读取 | `Hj` 文件名正则（10min/6h memory-summary.md）、`Gj/Kj/qj` schema、`Jj` Apple 系统进程黑名单（com.apple.dock 等 9 项）、`Yj/Xj/Zj/Qj/$j/eM/tM/nM/rM/iM/aM/oM/sM/cM/lM` 目录扫描 + frontmatter YAML 解析 + Promise 缓存 `qj` |
| 79,469-79,595 | 应用 | 应用清单（bundles → icon/浏览器标记） | `eM()` 默认 resolveApplication（`Pj` helper 优先、`n.A` fallback）、`nM` web 浏览器清单（`n.P`）、`Qj` 全量应用枚举（去重 + iconDataURL + isWebBrowser） |
| 79,596-79,795 | 应用 | **computer-use capture 请求管理** | 顶层状态 `uM = new Map()`（requestId → 进行中的 capture 记录）；`dM = r.i('computer-use-capture-handler')`（79,597）；`fM=12e4` 超时；核心 `pM`（macOS worker 路径：requestComputerUseWorker `start`，权限 pending 重试）、`hM`（Windows native bridge 路径：windowsCaptureNativeBridge.startCapture）、`mM`（final update）、`gM/_M/vM/yM`（update 分发/完成清理/失败上报/超时定时器） |
| 79,795-79,896 | 应用 | computer-use TOML 白名单迁移 | `bM/xM/SM` schema + 区段正则；`CM`（config.toml 的 `[computer_use.windows.always_allowed_app_ids]` → JSON 迁移）；`wM/TM/EM/DM/OM/kM/AM/jM/MM/NM/PM`（读/写 config.toml，`n.wi/Yt` 是 shared chunk 的 TOML 编解码） |
| 79,897-80,131 | 应用 | CUA app 审批存储 | `FM='ComputerUseAppApprovals.json'`、`zM='2DC432GLL2.com.openai.sky.CUAService'`（Group Containers 路径）；win32 走 config.toml（复用 `wM/TM`）、darwin 走 JSON；`HM/UM/WM/GM/KM/qM/JM/YM/XM/ZM/QM/$M/eN/tN` + 图标缓存 `VM` |
| 80,132-80,270 | 应用 | Messages（iMessage）读写审批 | `nN='MessagesReadDecisions.json'`（readAccessPolicy askPerChat/allow*，`rN` schema）、`fN='MessagesSendApprovals.json'`（allowAllChats + approvedChats）；`iN/aN/oN/sN/cN/lN/uN/dN/mN/hN/gN/_N/vN/yN`；仅 darwin（`dN/yN` 非 darwin 返回 null） |
| 80,271-80,417 | 应用 | CUA 图标 / 锁定模式 / soundMode | `BAe/VAe/bN/HAe/UAe`（sips 转 PNG + Info.plist icon 解析）；`WAe/GAe` **Codex Computer Use Installer** 子命令封装（`install/uninstall/status`，12e4 超时）；`YAe/XAe/ZAe/xN/SN/QAe` locked-use 状态与开关（`NSComputer` named image）；`CN/wN/TN/$Ae/eje/tje`（`defaults read/write com.openai.sky.CUAService`） |
| 80,247-80,417 | 应用 | **CUA 设置服务类** `nje` | `class extends n.Uf`，`requestComputerUseWorker` 单依赖，门面方法 getAppApprovals/messages* 系列/getSoundMode/getLockedUseState/setLockedUseEnabled/openChromeExtensionInstallPage；159,173 被 AppServer 总管实例化为 `computerUseSettings`（直接证据） |
| 80,418-80,444 | 应用 | 本地文件访问检查 | `DN`（owner key JSON 序列化）、`aje/ON`（desktop/documents/downloads 三目录 R_OK/W_OK/X_OK probe） |
| 80,445-80,652 | 应用 | **conversational-onboarding 服务** `kN` | `class extends n.Uf`，`logger = r.r('conversational-onboarding')`（80,452）；expectTaskCompletion/clearTaskCompletionExpectation/completeTask（写 globalState `a.lt` + `electron-conversational-onboarding-completions-v1`，键值直接证据 80,495/80,504）；createDesktopNote/createSampleChart（`wx` 排他写 .txt）；getSystemAppearance（`defaults read AppleInterfaceStyleSwitchesAutomatically`）；requestComputerUsePermissions/requestDesktopRoot/requestLocalFilesAccess |
| 80,653-80,759 | 应用 | **跨实例文件锁** | `AN` 名字枚举（custom-runtime/global-dictation/hotkey-window）、`cje=1e3` 心拍、`lje='.claim'`、`uje='owner.json'`、`dje=5e3` stale 判定、`fje` 临时锁路径、`pje` owner schema；核心 `jN`（lock+心拍+onLost），`mje/hje/MN/gje/_je/vje/NN/PN/FN/IN/yje/bje/LN/xje/RN`（claim 目录协议、pid 存活探测 `process.kill(pid,0)`） |
| 80,760-80,842 | 应用 | **宠物（pet）安装管理** | `Sje`（301/302/303/307/308 重定向拒绝）、`Cje`（png/webp）、`zN` spritesheet schema（https 强制、20MiB 上限）；`wje` PetInstallManager（preview/install，`n.vt` spritesheet 校验、`n.ht` installPreparedPet）；`BN/Tje` 下载与限长；`Eje` class extends n.Uf（executionHostRegistry 门面：load/loadAvatar/previewPetInstall/installPet） |
| 80,843-80,874 | 应用 | avatar 管理器工厂 | `Eje` 之外，区间尾 80,874 是下一个 logger |
| 80,875-80,997 | 应用 | **export-logs** | `VN = r.i('export-logs')`（80,874）；`HN/Dje/Oje/kje/Aje/jje/Mje/Nje/Pje/Fje/Ije/Lje/Rje`——按 scope（today/last7days/session）枚举 `a.Xt()`（bootstrap 的 logRootDir）下的日志文件、showSaveDialog、按行首时间戳归并排序、写 .txt |
| 80,998-81,134 | 应用 | **debug 服务** `zje` | `class extends n.Uf`（debugWindowManager/browserHostManager/origin/windowManager 四依赖）；exportLogs→`Rje`、getBrowserSnapshot/openBrowserTabOwner、ChatGpt conversations 注册/订阅/动作；memory 系列全部抛 `Memory diagnostics are unavailable`（该构建不含内存诊断）；160,051 被 AppServer 总管装配为 `debug`（直接证据） |
| 81,135-81,189 | 应用 | **demo-tools** | `Hje` DemoTools 门面（`logger = r.r('demo-tools')` 81,136，createService/getSetup/openDemoBuild/dispose）；`Bje` 后端（`UN='/Applications/ChatGPT.app'` + `prod-internal` track 校验 + `/usr/bin/open -n` 以 `.codex-demo` HOME/独立 userData 启动）；`Vje` DMG URL（oaisidekickupdates blob）；`Uje` per-origin service；`Wje` 工厂（packaged+非 Dev+darwin 才启用，159,306 消费直接证据） |
| 81,190-81,283 | 应用 | **预热窗口槽** `GN` | 单 slot 窗口缓存（entry {cancelled,promise,window}，prewarm/get/take/takeReady/clear/peek/runWhenAvailable/createTakenWindow）；`KN` 关窗 |
| 81,284-81,939 | 应用 | **分离窗口（detached window）管理器** | `Gje=2e3/Kje=3e4` 常量；`qje` 预热器（primary window 存活才填充，`initialRoute: a.yn`、appearance detached、960x720）；`Jje` **DetachedWindowManager**（windows Map、handoffs Map、open/moveTab/restore/suspend/focus/setAlwaysOnTop/setTitle/setChrome/close/dispose 全生命周期状态机，phase: opening→presenting→detached/restoring→restored）；`Yje` per-origin service（81,878）、`Xje` handoff dispose 句柄（81,930）；159,928 被实例化（直接证据） |
| 81,941-82,006 | 应用 | devicecheck cookie 管理 `Qje` | `qN='_devicecheck'`（81,939）、`Zje=6e4`；cookie changed 监听 + ensureCookie/attachToken（`x-sentinel-dc` 头 + oai-did）/registerCookie（POST bundle_id+device_token）；159,724 被装配为 `deviceCheckCookieManager`（直接证据） |
| 82,007-82,021 | 应用 | callId 去重 `eMe` | `class extends n.Uf`，claimedCallKeys Set（容量 `$je=1024` FIFO 淘汰），tryClaimExecution |
| 82,022-82,082 | 应用 | artifact-template-picker 配置 | `JN/iMe`（`mcp_servers.openai_artifact_template_picker` 注入 + `CODEX_ARTIFACT_TEMPLATE_SKILLS` env，限额 `tMe=100/nMe=24e3/rMe=600`）、`YN` 技能名优先级 |
| 82,083-82,295 | 应用 | automation_update zod schema 群 | `aMe..hMe/_Me/lP` **automation_update 工具的完整 zod schema 群**（RRULE/heartbeat/cron/status/notificationPolicy 校验文案内嵌，直接证据 82,083-82,180） |
| 82,193-82,195 | **副作用** | automation schema 顶层语句 | 见 §5 |
| 82,196-82,509 | 应用 | automation_update 执行器 | `vMe='automation_update'`；`yMe/bMe`（heartbeat/cron 输入构造）、`uP`（工具回执 contentItems）、`dP`（mode 归一 suggested_*→连字符）、`fP`（superRefine）、`xMe` **executeAutomationUpdateTool 主体**（create/update/delete 三分支 + mutation 记账 + host_error/missing_automation 分类）；`pP/mP/SMe` 错误文案 |
| 82,410-82,660 | 应用 | habitat automations 服务门面 `CMe` | `class extends n.Uf`（globalState/appServerConnectionRegistry/habitatAutomationsService 三依赖）；create/update/delete 走 `n.yr/n.Vr/n.xr/n.br`（shared chunk 存取）或 habitat 服务；executeUpdateTool/executeNativeUpdateTool（迁移期封锁文案）；注意复用 R2 的 `ms/hs/fs/ps`（8,693-8,737 automation 权限求解） |
| 82,510-82,660 | 应用 | 路径比较/跨平台 fs 工具 | `hP/gP/_P/vP/yP`（win32/posix 混合路径相等与包含判定）；`wMe/TMe/bP/EMe/DMe`（skill 名清洗 + remote MCP server 聚合）；`xP`（限额读文件，64KiB 分块）；`SP/CP/wP/TP/EP/DP/OP`（JSON 读取/写文件/递归枚举/isFile/isDir/exists） |
| 82,661-84,626 | 应用 | **Claude Cowork 导入器**（碎函数密集区） | 见 §3.4 拆分 |
| 84,627-86,195 | 应用 | **Claude Cowork 会话/transcript 导入引擎** | 见 §3.4 拆分 |
| 86,196-86,771 | 应用 | external-agent-import provider 工厂 + 路径适配 | `OI = r.i('external-agent-import')`（86,196）；`XFe` provider 工厂（detect/import 两入口）；`ZFe/QFe/$Fe`（detect=发现 cowork 市场+会话，import=复制+rollout 写入+回执）；`rIe/kI/iIe/aIe/oIe/sIe/AI/cIe/jI/lIe/MI/NI/mIe/PI/FI` host/路径适配（WSL）；`hIe=12e4`；`vIe/yIe/bIe/xIe/SIe/CIe/RI/zI/BI/VI/HI/wIe/TIe/EIe/UI/DIe/OIe/WI/GI/kIe` detect/import 流水线 |
| 86,772-87,722 | 应用 | external-agent 导入记录 + 项目分配 | `AIe='external_agent_session_imports.json'`、`KI/qI` 空态、`MIe/NIe/PIe/JI/FIe/IIe/LIe` 导入历史统计；`RIe` connector 名→codexAppId 映射（figma/github/gmail/google calendar/google drive/linear/notion/slack，8 项直接证据）；`YI = r.i('external-agent-import')`（87,577，第二个 logger 名）；`VIe` 导入后项目注册/窗口通知（87,578-87,722） |
| 87,723-91,982 | **vendored** | minipass + tar（详见 §2） | rolldown `__export` helper、minipass Symbol/类、tar header/types/list/parse/write/replace/append 全家桶 |
| 91,983-92,248 | 应用 | chrome native host 诊断 + 进程内存快照 | `TRe/kRe/_V/ARe/jRe/MRe/NRe/PRe/FRe/vV/yV/IRe/LRe/RRe/zRe`——`kRe`（91,999，读 chrome native host manifest + chrome-native-hosts-v2 + plugins/cache 目录展开诊断）；`RRe` 进程表快照（`n.rn()` 列进程、codexProcessDepth 归属）；`LRe→zRe` JSON Buffer 化。tar 相关 helper `IRe`（native host kind→路径：`n.Al/n.jl/n.Ml`） |
| 92,242-92,248 | 应用 | **feedback 归档头** | `BRe = promisify(te.gzip)`、`bV = r.i('feedback-desktop-log-archive')`（92,243）、`xV=512`（tar block）、`VRe=2/HRe=3`（归档日数：当前日+2 天回溯，用于 `GRe` 分片循环）、`SV=209,714,176`（分片上限 ~200MiB）、`CV = new Map()`（archiveId→目录，顶层可变状态） |
| 92,249-92,479 | 应用 | **导出 `URe`（exports.t）+ `wV` + 导出 `TV`（exports.n）** | 见 §3.8 完整调用链 |
| 92,480-92,664 | 应用 | latex artifact 编译 | `YRe=6e4` 超时；`QRe/$Re/EV/eze/tze/nze/rze`——优先 latex 插件 `scripts/compile_latex.py`（python/python3 回退），再退 tectonic（`-X compile --untrusted`）；`ize/aze` 定位已安装 latex 插件（marketplace `local` source） |
| 92,665-92,789 | 应用 | **download-internal-plugins** | `oze = r.i('download-internal-plugins')`；`DV = new WeakMap()`（错误节流）；`cze` schema；`lze`（调 shared `n.Z` 下载内部插件市场 → `addMarketplace`（`openai-internal-testing` 校验）→ `config/mcpServer/reload`）；`uze/dze/fze`；`pze/mze/hze`（**ripgrep 搜索兜底**：`n.tt` + `n.zn(resourcesPath)` rg 定位） |
| 92,770-92,789 | 应用 | 快捷键规范化前奏 | `OV/gze/_ze`（键盘布局映射替换：KeyA→a、Digit1→1） |
| 92,790-93,040 | 应用 | **bare-modifier 快捷键监视（macOS）** | `kV='bare-modifier-monitor'` native helper 路径；顶层状态 `AV/jV/MV`；`vze/yze/bze/xze` 修饰键别名表（fn/leftoption/doublecommand… 30+ 项直接证据）；`Sze`（注册 bare 修饰键监听→spawn helper `--key`，`--immediate/--cancellable/--trigger-on-release`）、`NV`（set suspended）、`Cze/PV`（权限请求 `--request-permission`）、`FV`（`--release-modifiers [--persistent]` 释放监视）、`IV/LV/RV/zV/wze/Tze/Eze/Dze/Oze/BV/VV/kze`（协议行解析、helper 路径发现） |
| 93,041-93,418 | 应用 | **globalShortcut 快捷键层** | `HV/Aze` 修饰键集合；顶层状态 `UV`（已注册 hotkey Set）、`WV = r.i('global-hotkey')`（93,044）、`GV`（mac 键盘布局 map）、`KV`（挂起计数）；`jze`（挂起域：suspendAll→unregister 全部，恢复时重注册）；`qV` **registerGlobalHotkey**（generation 守卫 + registrationHotkey 重算）；`Mze/Fze` mac 布局变更重注册；`JV/YV/XV/Nze/Pze/ZV`（注册/校验/规范）；`Ize` **PowerShell GetAsyncKeyState 轮询脚本**（93,216-93,284 内嵌模板，`__KEY_GROUP_SPEC__` 占位）；`Lze/Rze` win 键码映射；`QV/$V/eH/zze/tH/Bze/Vze/Hze/Uze` **global dictation release watcher**（darwin `FV`、win32 powershell 轮询、其余平台抛错） |
| 93,419-93,657 | 应用 | 云环境 fs 服务 `Wze` | `nH` fs/getMetadata schema；`class extends n.Uf`（sendRequest 单依赖）：getRoot（cwd 解析，file: URL→path）、readFile（base64）、getMetadata（+内容嗅探 `n.Rs`）、readDirectory（workspaceRoot 越界防护）；160,225 被装配为 `hostedThreadFiles`（直接证据） |
| 93,658-93,670 | 应用 | 原生应用图标提取 | `aH/oH/Gze/sH/Kze/qze/Jze/cH`——plutil 提 CFBundleIconFile、sips/qlmanage 转 PNG、nativeImage.toDataURL；97,427 消费 `native-desktop-app-icon`（直接证据） |
| 93,671-93,713 | 应用 | keymap 工具 | `cH/lH`（`n.Ct()` keymap bindings 查询）、`Yze/uH`（`n.Tt` 设定 command 快捷键，仅在无绑定时）、`dH`（keymap vs legacy 优先级） |
| 93,714-93,722 | 应用 | win32 网络盘判定 | `Xze`（`n.Dl/n.xl/n.bl` UNC/盘符判定 + persistent ACL 探测 `wO`——R2 windows-file-copy 区 helper） |
| 93,723-93,732 | 应用 | 路径工具 | `fH`（相对路径包含）、`pH`（WSL `/a|b` 盘符路径重定位）；143,034/97,485 消费（直接证据） |
| 93,733-93,745 | 应用 | lodash uniq（vendored 单函数） | `Zze = e.t(...)` require lodash 的 uniq；`mH = e.a(Zze())`；95501 使用 |
| 93,746-95,000+ | 应用 | **saved-custom-sections（保存的分区/置顶线程）** | 见 §3.9 拆分（93,746 延续过 95,000 边界，`rBe` 94,962、`jH` 95,321 属 R7 开头，但语义上与 `iBe/$ze` 同簇，本文化归说明） |

---

## 2. vendored 库识别

| 包 | 版本 | 行区间 | 证据 | 置信度 |
|---|---|---|---|---|
| **yaml**（eemeli/yaml） | ~2.x | 73,000 之前 -79,277（本区间 75,000-79,277） | `Dj` 聚合导出模块 79,244-79,277：`e.parse/parseAllDocuments/parseDocument/stringify/visit/visitAsync` + `Composer/Document/Schema/YAMLError/YAMLParseError/YAMLWarning/Alias/Pair/Scalar/YAMLMap/YAMLSeq/Lexer/LineCounter/Parser`（与 yaml 2.x index.ts 导出面逐一对应）；`%YAML` directive 处理 73,375；`YAMLParseError('YAMLParseError', ...)` 76,060 | 高 |
| **minipass** | ~7.x | 87,723-88,000 左右（AL 类定义起点，块延续至 tar 内部） | `ZI = Symbol('EOF')`/`QI = Symbol('maybeEmitEnd')`/`$I = Symbol('emittedEnd')`/`eL/tL/nL/rL/iL/aL/oL/sL...` 全套私有 Symbol（87,729-87,762 与 minipass/index.js 逐行一致）；`AL = class extends w.EventEmitter` + `Encoding and objectMode may not be used together`（87,795 附近）；`kL/ZIe` Pipe 类（proxyErrors/end） | 高 |
| **tar**（isaacs/node-tar） | v6 | 88,940-91,982（tar 主体）+ 90,917/91,980 工厂装配 | `ustar\x0000` 魔数读写（89,036/89,091）；`PaxHeader/` 92,223；`wR` 类型码 Map（`OldFile/GNUDumpDir/SparseFile/TapeVolumeHeader` 等 21 项，88,974）；`lR` 四变体工厂模式 + `eRe/tRe`（create/replace）+ `mV`（append）+ `_z`（extract）；`gB/_B` 的 `@file` 语义（tar@6 独有） | 高 |
| lodash（uniq 单函数） | 4.x | 93,733-93,744 | `Zze = e.t((e,t) => {... t.exports = i})` + `mH = e.a(Zze())`，uniq 实现（`n.tn()` baseUniq 包装） | 高 |
| rolldown 运行时 helpers（非库，机械代码） | — | 87,723-87,725 | `HIe = Object.defineProperty`/`UIe = (e,t) => { for (var n in t) HIe(e, n, {get: t[n], enumerable: !0}) }`——`__export` helper，88,960 `UIe({}, {...})` 是 tar 顶层导出绑定 | 高 |

**重写策略**：`yaml`、`minipass`、`tar`、`lodash` 直接 `npm install`；应用对它们的消费点极少且集中：
- yaml：`sM`（79,588，frontmatter 解析）——`import { parse } from 'yaml'` 一行替代。
- tar：`ER` Header（92,434 `new ER({...}).encode(i)`）与 gzip 管道（92,445-92,456）——手写 tar 头编码或引 `tar` 的 Header。
- lodash uniq：`hH`（93,741）一处。

---

## 3. 子系统聚类与模块拆分方案

> 建议模块名 kebab-case；「定义」列 minified 名 → 建议语义名。本区间无循环依赖风险高的簇；跨簇引用主要经参数注入。

### 3.1 computer-use-capture（建议：`computer-use/capture-requests` + `computer-use/approvals` + `computer-use/messages-approvals` + `computer-use/locked-use`）

- **capture-requests**（79,596-79,795）：`uM`→`pendingCaptures`、`dM`→`captureLogger`、`fM`→`CAPTURE_TIMEOUT_MS`、`pM`→`startMacCapture`、`hM`→`startWindowsCapture`、`mM`→`requestFinalCaptureUpdate`、`gM`→`dispatchCaptureUpdate`、`_M`→`finishCapture`、`vM`→`failCapture`、`yM`→`armCaptureTimeout`。调用方在 R7 区（97,403/97,416：按平台选 `hM`/`pM`，直接证据）。更新通过 `windowManager.sendInlineMessageForView(origin, {type: 'computer-use-capture-updated', ...})` 回渲染层。
- **approvals**（79,795-79,896 + 79,897-80,131）：`bM/xM/SM/CM/wM/TM/EM/DM/OM/kM/AM/jM/MM/NM/PM`→`windowsAlwaysAllowedStore`（config.toml 段迁移）；`FM…tN/VM`→`cuaAppApprovalsStore`（win32 TOML / darwin Group Containers JSON 双格式）。
- **messages-approvals**（80,132-80,270）：`nN/rN/iN…yN`→`messagesReadDecisionsStore`、`fN/pN/mN…yN`→`messagesSendApprovalsStore`（均仅 darwin）。
- **locked-use + icons + soundMode**（80,271-80,417）：`WAe/GAe/QAe`→`cuaInstallerCli`、`YAe/XAe/ZAe/xN/SN`→`lockedUseState`、`CN/wN/TN/$Ae/eje/tje`→`cuaDefaults`、`BAe/VAe/bN/HAe/UAe`→`macAppIconPng`。
- 服务门面 `nje`（80,247）→`ComputerUseSettingsService`：159,173 由 AppServer 总管实例化（`this.computerUseSettings = new nje(...)`）。

### 3.2 ambient memory summaries（建议：`computer-use/memory-summaries`）

79,355-79,595：`Hj`→`MEMORY_SUMMARY_FILENAME_RE`、`Uj/Wj`→`sixHour/48h` 常量、`Gj/Kj`→`frontmatterSchema/suggestionSchema`、`qj`→`frontmatterCache`、`Jj`→`APPLE_PROCESS_BLOCKLIST`、`Yj/Xj/Zj`→`listAmbientSummaries/newSuggestions/activeIntervals`、`Qj/$j`→`listApplications/listApplicationsByBundleIds`、`eM/tM/nM`→`resolveApplication/listWebBrowsers`、`rM/iM/aM/oM/sM/cM/lM`→`parseName/listDir/summaries/readFrontmatter/normalizeAppEntry/isEnoent`。CUA worker 每 10min/6h 写出 memory-summary.md，本模块解析出「ambient suggestions」（应用清单+建议卡），供会话建议 UI 使用（采样推断：消费方在渲染层/R7）。

### 3.3 launch-services-helper 门面（建议：`mac/launch-services`）

79,278-79,354：`Nj/Pj/Fj/Ij`→`listWebUrlHandlers/appForBundleId/…/notifyDownloadComplete`、`Lj`→`setAppIcon`（串行队列 `kj`）、`zj/Bj/Rj/Vj`→`invokeHelper/helperPath/resolveAppBundle`。复用 bootstrap 的 `launch-services-helper` 二进制（`native/launch-services-helper` 两候选路径）。dock 菜单修复（bootstrap `mA`）与本簇共享同一 helper（R2 已见 `gA`）。

### 3.4 claude-cowork-import（碎函数密集区 #1，建议拆 4 个模块）

这是 82,661-86,195 的主体（约 3,500 行、~380 个顶层定义，平均每 9 行一个函数——全 chunk 密度最高的区间，粗扫「80,000s 272 defs」的主要贡献者其实是这一簇）。按数据流拆：

| 模块 | 行区间 | 主要定义（压缩名→语义名） |
|---|---|---|
| `import/cowork-import-history` | 82,530-82,660 + 82,661-82,968 | `kP`→`IMPORT_HISTORY_FILENAME`、`OMe/AMe/jMe/AP/jP/MMe/NMe/FMe/IMe`→schema+读写 `claude-cowork-import-history.json`（records/projects/accountSetupItems/connectorCandidates 四账本）；`RP/zP/BP/WMe`→instruction header/skill 白名单常量 |
| `import/cowork-mcp-plugins` | 82,969-84,626（中部） | `iNe/aNe/oNe/sNe/cNe/tF…fNe…pNe/mNe/nF/hNe/gNe`→`importAccountSetup`（cowork_settings.json/cowork_account_settings.json → AGENTS.md/config.toml）；`rF…oF/sF/cF/lF/SNe/uF/dF/fF`→插件清单导入（`.local-plugins/.remote-plugins`、MCP server 条目 `CNe`（bash/bun/deno/node 运行时白名单）、`IPe`（csv/doc/html/… 文件扩展白名单））；`FPe/ePe/tPe/…/cPe/sPe/lPe/uPe/dPe`→serverEntry 规范化/manifest 重写 |
| `import/cowork-discovery` | 83,989-85,912 | `wF/TF/EF`→`PROVIDER_ID='claude-cowork'`/detection 归一；`fPe/pPe/mPe/hPe/DF/gPe/OF/_Pe/kF/AF/jF/MF/vPe/yPe/bPe/xPe/SPe/NF/CPe/wPe/TPe/EPe`→项目/无项目空间发现（`DPe` 十个标准相对路径：plugins.json/skills/agents.json/cowork_settings.json…；`OPe` Claude Extensions 目录）；`PF/RF/zF/BF`→**安全预算**（directoryEntries 2e4/durationMs 1e4/transcriptBytes 64MiB…）；`IF/LF`→`CoworkHistoryLimitError/CoworkHistoryReadError`；`VF/kPe/APe/jPe/GF/PPe/KF/FPe/WF`→session manifest/config surface 汇总 |
| `import/cowork-transcripts` | 84,627-86,195 | `rI/eFe/cI/lI/tFe…uFe`→transcript jsonl 解析（`oI` 单 transcript、`$Pe` 消息级读取限额、`hFe` turn 组装、`sFe/lFe` 用户 turn 映射）；`eI…nI/XPe`→rollout 文件产物命名与写入；`pI/dFe/fFe/pFe/mFe/gFe/_Fe/vFe/yFe/hI/gI/bFe/xFe/SFe/CFe/wFe`→**Codex rollout JSONL 编码**（thread item 前缀、图像附 role/state/text/timestamp 字段直接证据 85,429）；`TFe/EFe/_I/xI/SI/OFe/CI/wI/kFe/AFe/TI/jFe/MFe/NFe`→去重（contentSha256/importHistory 判定）与 include 过滤（`BP`→`DEFAULT_INCLUDE={agents,config,sessions}`）；`EI`→`writeQueue`（PFe/IFe/LFe/RFe/zFe/DI/BFe/VFe/HFe/UFe/WFe/GFe/KFe/qFe/JFe` 队列化写 rollout + projects 登记） |

调用链：`FFe`（85,953，detect 总入口）→ `VF`（discovery）→ `_I`（85,667，import 编排）→ `zFe`（85,959，带 callbacks 的批量导入）→ `zI/RI`（87,282/87,325，attemptId 回执）。

### 3.5 external-agent-import（建议：`import/external-agent` + `import/external-agent-registry`）

- **86,196-86,771 provider 工厂**：`OI/LI/YI`→同名 logger ×3；`XFe`→`createExternalAgentImportProvider`（detect/import）；`ZFe/QFe/$Fe`→cowork provider 实现（detect=市场修复 `nF`+`FFe`；import=`zFe`+`$Fe` 回执）；`rIe/kI/iIe/aIe/oIe/sIe/AI/cIe/jI/lIe/MI/NI/mIe/PI/FI`→WSL/desktop 路径适配与 codexHome 解析（`hIe=12e4` 进程超时）。
- **86,772-87,722 注册/回执层**：`AIe`→`SESSION_IMPORTS_FILENAME`、`MIe/NIe`→claude-code 已导入统计（经 app-server `n.Di` 远端读 `external_agent_session_imports.json`）；`IIe/LIe`→cowork 统计（本地 fs）；`JI/PIe/FIe`→聚合；`RIe/BIe`→connector appId 映射；`VIe`→导入后项目注册 + 窗口通知（97,105 消费 `"external-agent-imported-connectors"` 工具名，直接证据）。
- **detect/import 流水线**（86,707-87,282）：`_Ie/vIe/yIe/bIe/xIe/SIe`→阶段化发现（`RI/zI` attempt 记账、`CIe` 进度回调）。

### 3.6 conversational-onboarding + cross-instance-lock + pet（建议各自独立小模块）

- `onboarding/conversational-onboarding`（80,445-80,652）：`kN`→`ConversationalOnboardingService`、`sje`→`threadIdSchema`。globalState 键 `a.lt`（completions 列表）与字面量键 `electron-conversational-onboarding-completions-v1`（80,495/80,504）。
- `util/cross-instance-lock`（80,653-80,759）：`jN`→`acquireCrossInstanceLock`（claim 目录 + owner.json + 心跳 + pid 存活）。锁名枚举 `AN`（custom-runtime/global-dictation/hotkey-window）——注意与 global dictation/hotkey 簇（93,041+）和 primary runtime（R10）的联动。
- `avatar/pet-install`（80,760-80,874）：`wje`→`PetInstallManager`、`Eje`→`AvatarManager`（executionHostRegistry 门面）、`zN/BN/Tje`→spritesheet 校验/下载。

### 3.7 export-logs / debug / demo-tools / detached-window（建议各一模块）

- `debug/export-logs`（80,875-80,997）：`VN`→`exportLogsLogger`、`Rje`→`exportLogs`（scope today/last7days/session；读 `a.Xt()` bootstrap logRootDir；`Lje` 按时间戳归并）。**碎函数拆分策略**：该簇函数天然是「日期桶→文件名→saveDialog→读取→排序→写出」纯管道，直接合并为 2 个函数（collectLogFiles + mergeAndWrite）即可消除 8 个碎函数。
- `debug/debug-service`（80,998-81,134）：`zje`→`DebugService`（per-origin RPC 门面）。memory 诊断方法全抛错——**该 flavor 不含内存诊断，重写时保留同样形 stub**。
- `demo/demo-tools`（81,135-81,189）：`Hje`→`DemoTools`、`Bje`→`ChatGptAppDemoBackend`、`Wje`→`createDemoTools` 工厂（仅 packaged 非 Dev darwin）、`Vje`→`demoDmgUrl`。
- `window/detached-window-manager`（81,190-82,058）：`GN`→`PrewarmSlot`、`qje`→`DetachedWindowPrewarmer`、`Jje`→`DetachedWindowManager`、`Yje`→`DetachedWindowService`（per-origin）、`Xje`→`ThreadHandoffLease`。**这是本区间最难的状态机**（open/restore 双向 moveTab、suspend/resume、always-on-top 恢复、prewarm 复用），建议整类迁移不加拆分，配注释说明 phase 流转。
- `devicecheck/cookie-manager`（82,059-82,105）：`Qje`→`DeviceCheckCookieManager`、`eMe`→`CallIdClaimRegistry`。

### 3.8 feedback 归档（导出 URe/TV，建议：`feedback/desktop-log-archive`）——完整调用链

**这是本 chunk 仅有的 3 个导出中的 2 个（`exports.t = URe`、`exports.n = TV`，文件尾 176,978 绑定）**，已被重写的 upload chunk 消费（`src/main/upload/index.ts:10` `import { t as createDesktopLogArchive, n as deleteDesktopLogArchive } from "@chunk/main"`，105/145 行调用）。**重写时的对外契约**（`src/main/types/chunk-modules.d.ts:771-782`）：

```ts
export const t: (now?: Date, extraPaths?: string[],
  opts?: { includeDesktopLogs?: boolean }) =>
  Promise<{ archiveId: string; filePaths: string[] } | null>;
export const n: (archiveId: string) => Promise<boolean>;
```

内部结构与调用链（92,242-92,479，全部直接证据）：

```
URe(now, extraPaths, {includeDesktopLogs})         [92,249] exports.t
 └─ wV(now, extraPaths, {                          [92,257] createFeedbackArchive（真正实现）
      buildFlavor: a.in.resolve(),                 ← bootstrap chunk：build flavor
      includeDesktopLogs, includeNativeHostDiagnostics:!1, includeWindowsSystemDiagnostics:!1 })
     ├─ d = a.Xt()                                 ← bootstrap：desktop logRootDir
     ├─ f = (win32 && includeLogs && includeWindowsDiag) ? CO() : null
     │                                            ← R5 区 71,718 的 windows-system-diagnostics
     ├─ m = 3 天(HRe=3)日志文件枚举：WRe(dir) 读目录 → 过滤 codex-desktop-*.log
     │    （qRe 构造 yyyy/mm/dd 桶路径 [92,470]；当天优先排序 a.on=appSessionId [92,317]）
     ├─ g = includeNativeHostDiagnostics ? kRe(buildFlavor) [91,999→92,001]
     │    （chrome native host manifest + plugins/cache 诊断快照，91,999-92,238）
     ├─ v = includeProcessMemoryDiagnostics ? LRe(now) [92,186]（进程内存表 JSON）
     ├─ y = getAppServerDiagnostics?.()（外部注入，本调用点未传）
     ├─ x = n.En()                                 ← shared chunk：primary runtime 诊断
     ├─ T = mkdtemp('codex-feedback-desktop-log-archive-')
     ├─ GRe(fileEntries, T, now) [92,407]          ← 分片打包
     │    ├─ BRe = promisify(te.gzip)             [92,242] 空尾块 gzip
     │    ├─ KRe(entry, now, tmpTar) [92,432]      ← 单文件 tar 头编码：
     │    │    new ER({path,mode:420,uid:0,gid:0,size,mtime,type:'File'}).encode(i)
     │    │    （ER = vendored tar 的 Header 类 88,989）+ createGzip 管道
     │    └─ 每片 ≤ SV=209,714,176 字节，命名 codex-desktop-app-logs-YYYYMMDD[-N].tar.gz
     │       （JRe 日期戳 [92,478]）
     ├─ w 快照直接 writeFile（primary-runtime-diagnostics.json / chrome-native-host-paths.json /
     │    process-memory-diagnostics.json / app-server-diagnostics.json / windows-system-diagnostics.json）
     └─ 成功：CV.set(randomUUID(), T)；返回 {archiveId, filePaths}
        失败：rm -rf T 后 rethrow

TV(archiveId)                                      [92,380] exports.n
 └─ CV.get(archiveId) → CV.delete → rm -rf 目录 → true/false
    （失败仅 bV().warning('Failed to remove feedback desktop log archive.')）
```

顶层状态 `CV`（92,248）是 archiveId→临时目录的唯一记账；**URe 与 TV 必须落在同一模块**，否则状态割裂。日志文件名 `codex-desktop-${a.on}-*`（`a.on` = bootstrap 25,583 `exports.on = Ot`，bootstrap 3515 的随机 session id UUID）——`wV` 的 session 过滤逻辑（92,318 `currentSession` 排序）依赖它。

vendored 依赖仅两点：tar `ER` Header（→ `npm i tar` 后用 `tar.Header` 或手写 512 字节头）与 `te.gzip/createGzip`（node:zlib，保留）。`kRe/LRe/CO` 三个诊断收集器是**同簇上游**，应与归档同模块或由 `feedback/` 子目录收纳（CO 在 R5 区 71,718，拆分时归 windows-diagnostics 模块、被本模块 import）。

### 3.9 saved-custom-sections（建议：`sidebar/saved-sections-*` 三模块）

93,746-95,000+（`rBe` 94,962 与 `jH` 95,321 延入 R7 区间，语义同簇）：

| 模块 | 行区间 | 主要定义 |
|---|---|---|
| `sidebar/saved-sections-state`（纯状态变换） | 93,746-94,533 | `Zze/mH`→lodash uniq；`Qze`→`threadIdSchema`；`$ze`→`ThreadSectionServer`（93,659，threadSection/list/create/update/delete/move 的 app-server RPC 门面 + pinned 段发现 + legacy 迁移记账：`n.iu.PINNED_THREAD_IDS`/`APP_SERVER_MIGRATED_PINNED_THREAD_IDS_BY_HOST` 两 globalState 键直接证据 93,741/94,089）；`gH`→`isJsonRpcCode`；`_H/eBe`→`applySectionCommand/reduceSectionState`（create/rename/delete/collapse/reorder/move/remove/reorderItems/replaceItem/resolvePendingDeletion 9 种命令的 reducer）；`nBe`→`HOST_SYNCED_COLLECTIONS`；`bH/CH/xH/SH/wH`（95,000 后）→diff/裁剪/比较 |
| `sidebar/saved-sections-transactions` | 94,235-94,534 | `tBe`→`SectionTransition`（私有字段 ×14；listSections/createSection/updateSection/setThreadSection/saveReplica/completeMigration/undo 的事务边界 + replica 冲突判定 + Symbol.dispose 回滚）；`ve`→PINNED_SECTION_UUID `01984de2-8f74-7c91-a3b2-5c5e937cf318`（188 行定义，93,746 区间字面量复用直接证据） |
| `sidebar/saved-sections-service` | 94,535-95,000+ | `yH`→`SectionUndoRedoStack`（94,535，undo/redo + transition 签发 + mac 布局无关的 hostSectionIds 修补）；`iBe`→`SavedCustomSectionsManager`（95,077，applySavedCustomSectionCommand/beginSavedCustomSectionReconciliation/beginSavedCustomSectionMigration/importLegacySavedCustomSections，95,335 被 AppServer 总管实例化为 `savedCustomSections`）；`rBe`→`SectionReconciliation`（94,962）；`jH`→`PinnedThreadsService`（95,321，96,360 实例化 `pinnedThreadsService`） |

注意 `tBe` 的 logger `#e = r.i('saved-custom-sections')`（94,236，粗扫锚点精确）。`$ze`/`iBe`/`jH` 的装配点都在 95,000 之后的 AppServer 总管类（159,000 区），即 R7/R11 的 61706 大类——**拆分时 saved-sections 三模块只导出类，装配留给 app-server 模块**。

### 3.10 global-hotkey（建议：`hotkey/global-shortcut` + `hotkey/bare-modifier-monitor` + `hotkey/dictation-release-watcher`）

- **global-shortcut**（93,041-93,418 前半 + 92,770-92,789）：`UV/GV/KV`→`registeredHotkeys/macLayoutMap/suspendCount`；`jze`→`suspendGlobalHotkeys`（挂起域引用计数，卸载/全部重注册）；`qV`→`registerGlobalHotkey`（不可重入：同 registrationHotkey 拒绝；bare 修饰键转 `Sze`）；`ZV/Fze/Mze`→`doRegister/refreshMacLayout/onMacLayoutChanged`；`JV`→`validateHotkey`（错误文案 5 种直接证据）；`OV/gze/_ze`→`remapForLayout`。消费方 96,644-96,651（globalDictationHold/Toggle 命令绑定）、165,815/167,482（`cH('globalDictationHold')` 等）。
- **bare-modifier-monitor**（92,790-93,040）：`kV`→`BARE_MODIFIER_MONITOR` native helper；spawn 协议（`--key/--immediate/--cancellable/--trigger-on-release/--release-modifiers/--persistent/--request-permission`，stdout 行协议 `ready/down/up/cancel/permission-denied`）；`Sze/FV/Cze/PV/NV` 注册/释放/权限/suspend。仅 darwin。
- **dictation-release-watcher**（93,216-93,412）：`Ize`→PowerShell 脚本模板（GetAsyncKeyState 轮询，10ms 间隔）；`QV/$V/eH/tH/Bze/Uze` 校验/watch（win32 powershell / darwin `FV` / 其余抛 `Global dictation hotkey release watching is not supported.`）。
- 三者共享修饰键别名表 `vze/yze/Lze/Rze`（建议独立 `hotkey/accelerator-normalize`）。

### 3.11 download-internal-plugins + latex + 云 fs + 杂项工具（建议各一小模块）

- `plugins/download-internal-plugins`（92,665-92,789）：`lze`→`downloadInternalPlugins`（`n.Z` 下载→`addMarketplace`→reload MCP）；`pze`→ripgrep 兜底搜索（`n.tt`+`n.zn`）。
- `latex/compile`（92,480-92,664）：`QRe`→`compileLatexArtifact`（compile_latex.py → tectonic 两级回退，60s 超时，`TECTONIC_UNTRUSTED_MODE`）。
- `cloud/environment-fs`（93,419-93,657）：`Wze`→`CloudEnvironmentFsService`（fs/getMetadata/fs/readFile/fs/readDirectory RPC 包装 + workspaceRoot 越界防护）。
- `util/app-icons`（93,658-93,670）：`oH`→`appIconDataUrl`（plutil+sips/qlmanage）。
- `util/keymap`（93,671-93,713）：`cH/lH`→`lookupCommandHotkey`、`Yze/uH/dH`→`setCommandHotkey/setIfUnbound/preferKeymap`。
- `util/win32-paths`（93,714-93,732）：`Xze/fH/pH`→网络盘判定/路径包含/WSL 重定位。

---

## 4. 顶层可变状态清单

> 拆模块时这些必须显式化（独立 state 模块或类成员）。全部 grep 核实行号。

| 名 | 行号 | 语义 | 读写方 |
|---|---|---|---|
| `kj` | 79,287 | `Promise.resolve()` set-app-icon 串行队列 | `Lj`（唯一写方） |
| `qj` | 79,369 | Map<file, Promise>：memory-summary frontmatter 缓存 | `aM/oM` |
| `uM` | 79,596 | Map<requestId, captureRecord>：进行中的 computer-use capture | `pM/hM/gM/_M/vM/yM/mM` |
| `VM` | 79,903 | Map<platform:bundleId, appMeta>：CUA 审批应用图标缓存 | `ZM/QM` |
| `Sje/Cje` | 80,760/80,761 | Set：pet spritesheet 允许的重定向码/内容类型（只读常量） | `BN/Tje` |
| `CV` | 92,248 | **Map<archiveId, tmpdir>：feedback 日志归档记账**（导出函数的生命线） | `wV`（set）、`TV`（get/delete） |
| `DV` | 92,668 | WeakMap<errorReporter, Map<version, ts>>：下载失败上报节流（60s 窗口 `sze`） | `uze` |
| `AV/jV` | 92,792/92,793 | Set：活跃 bare-modifier 监听键 / suspend 回调 | `Sze/wze/NV` |
| `MV` | 92,794 | bare-modifier 挂起标志 | `NV/wze` |
| `UV` | 93,043 | Set<hotkeyRecord>：已注册 globalShortcut 记录 | `qV/ZV/jze/Fze` |
| `GV` | 93,045 | mac 键盘布局 map（或 null） | `Mze/Pze/OV/Fze` |
| `KV` | 93,046 | global hotkey 挂起计数 | `jze` |
| `CNe/IPe/RIe/HV/Aze` | 83,371/84,834/87,553/93,041/93,042 | 常量 Set/Map（运行时不变，但注意 `RIe` connector 映射属 external-agent 域） | 各自只读 |
| `EI` | 85,913 | `Promise.resolve()` rollout 写串行队列 | `PFe/LFe`（写侧） |
| `Wze` 内 `#i` 等类私有 | — | 均为类成员，无泄漏 | — |

**类内静态/实例状态（拆分时随类走）**：`$ze.pendingHostMutations/pendingMigrationMarkers`（93,665-93,667，Map/Set）；`tBe.#l/#u/#g`（replica 映射/创建事务/线程 ID 缓存）；`Jje.windows/handoffs`（81,411-81,412）；`GN.entry`。

---

## 5. 顶层副作用序列

**本区间（79,278-95,000）应用代码只有 2 处模块加载即执行的语句**；粗扫点名的 88,960 `UIe(...)`、90,917/91,980 `lR(...)` 全部在 vendored tar 带内，属库装配，重写引 npm 后消失。

| 行号 | 语句 | 语义 | 置信度 |
|---|---|---|---|
| 82,193 | `_Me.transform(dP);` | **丢弃结果的表达式语句**——对 automation_update 的 zod schema `_Me` 施加 `dP` 变换并丢弃。与 82,180 `lP = hMe.transform(dP)` 重复，疑似打包器从「`const X = ...` 类型注解」产生的死代码 | 高（原文直接证据；语义为类型断言遗留，无运行时影响） |
| 82,295 | `n.yf().parse(n.Rf(lP, { io: 'input', reused: 'ref' }));` | **加载期 zod schema 自检**（丢弃结果）：把 automation_update 输入 schema `lP` 经 `n.Rf`（zod-to-json-schema）转换后用 `n.yf()`（jsonSchema 实例）parse 校验——即「确保 schema 可序列化成 JSON Schema 给模型端」。与 bootstrap 28,649、21980 的同款语句一致。**副作用：模块加载时执行一次 zod 校验（纯 CPU，无 I/O、无事件）** | 高 |
| 87,723-87,762 | `HIe/UIe` helper + minipass Symbol 表 | rolldown `__export` helper 与 minipass 私有 Symbol 常量绑定（vendored） | 高 |
| 88,960 | `UIe({}, { code: () => TR, isCode: () => SR, isName: () => wLe, name: () => wR, normalFsTypes: () => CR })` | tar 顶层导出绑定（vendored，粗扫 §9.5 点名项——**结论：无业务副作用**） | 高 |
| 90,917 / 91,980 | `lR(eRe, tRe, ..., (e,t)=>{...})` / `lR(mV.syncFile, mV.asyncFile, mV.syncNoFile, mV.asyncNoFile, (e,t=[])=>{ mV.validate?.(e,t); TRe(e) })` | tar c/r 工厂注册与 `tar.u`（append）validate 钩子挂接（vendored，粗扫点名的「syncFile/asyncFile 4 变体」即此——**结论：无业务副作用**） | 高 |

另有一类**「加载期求值的常量」易漏**（非语句但求值时读环境）：

- 79,355 `Hj`（正则）、79,369 `qj`、92,795-92,837 `vze/yze/bze/xze`（修饰键别名大 Map）、93,216-93,284 `Ize`（PowerShell 脚本模板串）——纯数据，无副作用。
- 79,596 `uM`、92,248 `CV`、92,792-92,794、93,043-93,046 —— 空 Map/Set/计数初始化。
- 92,242 `BRe = (0, d.promisify)(te.gzip)` —— promisify 包装，无 I/O。
- **无任何 Electron 事件接线、无 fs I/O、无定时器**在模块加载期发生（与 R1+R2 结论一致：副作用集中在启动流程 `Ust` 与各服务构造函数内）。

---

## 6. 跨 chunk 依赖

### 6.1 @chunk/shared（`n.*`，src-DldfpmrL.js）

本区间高频消费点（按簇）：
- zod：`n.wf/hf/Ef/Of/Cf/gf/df/bf/Df/vf/xp/Nf/jf/Mf`（schema 构造，遍布 automation/cowork/hotkey/sections）
- TOML：`n.wi`（parse）/`Yt`（stringify，79,890 `MM`/`kM`）——computer-use 白名单与 AGENTS.md 段读写
- Electron app 侧数据：`n.A`（appPath 解析 79,471/79,980）、`n.P`（applications 列表）、`n.j`（isBackgroundApp）、`n.F`（plist 读 CFBundleIconFile 80,153）、`n.Ys/J`s（R2 sky addon 图标，10,201/10,220）
- 自动化存储：`n.yr/Vr/xr/br/md/ei`（CMe 82,462-82,489 直接证据）
- 导入器：`n.Z`（插件下载）、`n.Ho`（config schema）、`n.Q/Bo/Ul/X`（codexHome/marketplace 路径族，92,642-92,660）
- 远端 fs/app-server：`n.Di`（remote file read 87,491）、`n.Kt/Gt/qt`（chrome host 路径 92,005）、`n.rn`（进程表 92,020）、`n.En`（primary runtime 诊断 92,299）、`n.Tt/Ct`（keymap 读写 93,690/93,672）、`n.tt/zn`（ripgrep 92,757）、`n.Rs`（内容嗅探 93,483）、`n.Kn`（spawn 包装 92,573/92,593）、`n.vt/ht/_t/gt`（pet spritesheet/install/loadAvatar 80,800/80,806/80,848）
- 路径判定：`n.Dl/xl/bl/Ui/El/f`（win32 网络/WSL 93,716-93,725）、`n.Cs/hu/Qu/be`（host/线程工具 93,685-93,747）
- zod-json-schema：`n.Rf/yf`（82,295 自检）
- 置顶线程 globalState 键：`n.iu.PINNED_THREAD_IDS`（93,741）、`n.iu.APP_SERVER_MIGRATED_PINNED_THREAD_IDS_BY_HOST`（94,089）

### 6.2 @chunk/logger（`r.*`）

`r.i`（memoized tagged）：`computer-use-capture-handler`(79,597)、`export-logs`(80,874)、`external-agent-import`(86,196/86,706/87,577 ×3)、`feedback-desktop-log-archive`(92,243)、`download-internal-plugins`(92,666)、`global-hotkey`(93,044)、`saved-custom-sections`(94,236，类私有字段)；`r.r`（具名）：`conversational-onboarding`(80,452)、`demo-tools`(81,136)；`r.n()`（根 logger）：bare-modifier/dictation 告警（92,956/93,004/93,396）。

### 6.3 @chunk/bootstrap（`a.*`）

- `a.Xt()`：desktop logRootDir（80,970 `Rje`、92,275 `wV`）——export-logs 与 feedback 归档的根路径来源
- `a.on`：appSessionId UUID（80,968 `jje` session 过滤、92,318 `wV` currentSession 排序、92,328 文件名）
- `a.in.resolve()`：build flavor（92,271 `wV`）
- `a.an`：package.json codex 字段读取（81,151 `Bje.#e` codexBuildFlavor/codexReleaseChannel）
- `a.lt`：conversational-onboarding completions globalState 键（80,495/80,504/80,514）
- `a.yn`：detached 窗口 initialRoute（81,384/81,540）
- `a.ut`：automation 参数 schema（80,509 `#r`）
- `a.en`：异步资源守卫（81,672/81,742 `using` 降级）
- `a.B/a.W` 等迁移完成标记在 R2 的 147,06 区已见，本区间无直接消费

### 6.4 与已重写 chunk 的关系

- **upload chunk（`src/main/upload/index.ts`）**：消费本区间的 `exports.t = URe`/`exports.n = TV`（`createDesktopLogArchive`/`deleteDesktopLogArchive`）。upload 的 `uploadTraceRecording` 在上传 content-trace 时调 `t()` 生成日志归档、把 `filePaths` 塞进 `extraLogFiles`、finally 里调 `n()` 清理。**重写顺序约束：`feedback/desktop-log-archive` 模块必须先于/独立于 upload 模块定稿**，契约即 `chunk-modules.d.ts` 771-782 的签名（含 `now?/extraPaths?/opts.includeDesktopLogs?` 默认值语义：`now` 默认 `new Date()`、`extraPaths` 默认 `[]`、`includeDesktopLogs` 默认 true；URe 显式把 nativeHost/windowsSystem 诊断关掉、wV 默认 windowsSystem=true——见 92,250-92,253 直接证据）。
- **windows-file-copy chunk**：本区间 `Xze`（93,714）调用其 `wO`（persistent ACL 探测）与 `TO`；`fze`（92,751）强制 local host。拆分时 `util/win32-paths` import 该 chunk。
- **capture chunk（R2 computer-use 域）**：`nje` 的 `openChromeExtensionInstallPage` 直接调 R2 的 `qne`（5,195）；`pM/hM` 的 worker 请求接口（`requestComputerUseWorker`/`windowsCaptureNativeBridge`）由 R7/R11 的 AppServer 总管注入（97,403-97,416 装配点）。`Eje` 的 `n._t/n.gt` pet/avatar 安装走 shared。

### 6.5 R6 → 其他区域的应用内引用（拆分时的 import 边界）

- → R5（60,000-75,000）：`CO`（71,718 windows 系统诊断）、`ms/hs`（8,693/8,694，CMe 用）——**注意这两个其实在 R2**（8,693<20,000），`ms/hs` 归 automations 权限模块。
- → R2：`Ys/Js`（10,220/10,201 sky addon 图标）、`qne`（5,195）、`Bn/Rn`（2,978/2,984，kN createDesktopNote 的路径工具）、`Se`（196 section 分页适配器，`$ze.threadSectionEngine` 直接 `new Se(...)` 93,665——**saved-sections 依赖 R1 的 196 行 `Se` 类**）、`he`（139 去重缓存类，`$ze.readThread` 94,052 用）。
- → R7/R8（95,000+）：`iBe/$ze/jH/rBe` 的装配点（95,335/96,360/160,225）；`pM/hM` 注册点（97,403）；`oH` 工具注册（97,427 `native-desktop-app-icon`）；`dH/cH/uH` keymap 消费（165,815/167,482）；`URe/TV` 的 chunk 导出面（176,978）。
- ← R5→R6 方向：`xEe`（71,718 区 CO 的对偶）无；**本区间不被 95,000 以前的应用代码反向调用**（除 vendored），单向依赖良好。

---

## 7. 拆分风险

1. **vendored 边界误伤（最高优先）**：79,277 之前与 87,723-91,982 是纯 vendored（yaml / minipass+tar）。派发重写时这两个带**必须剔除**——尤其 87,723 带内 `HIe/UIe/AL/kL` 等 minipass 名与 88,940+ tar 名（`eRe/tRe/gB/_B/wRe/CRe/mV/TRe`）不要被应用模块误收。反之，**应用对 tar 的唯一消费是 `ER` Header（92,434）**——重写 `feedback/desktop-log-archive` 时引 `npm i tar` 的 `tar.Header` 或手写 512 字节头编码即可。
2. **导出函数契约（`URe`/`TV`）**：`exports.t/n` 是本 chunk 对外仅有的两个非启动导出，upload chunk 已按 `chunk-modules.d.ts` 契约重写并消费。注意三个语义细节：① `URe` 返回 `null`（`r.archiveId == null`）而 `wV` 返回 `{archiveId: null, filePaths: []}`；② `URe` 强制 `includeNativeHostDiagnostics:!1, includeWindowsSystemDiagnostics:!1`，`wV` 的 `includeWindowsSystemDiagnostics` 默认 `!0`——两条调用路径的诊断集合不同；③ `CV` 状态必须与两个函数同模块。此外 `URe` 的选项对象第 3 参整体可选——`new Date()`/`[]` 默认值在签名里。
3. **碎函数密集区的语义恢复**：82,661-86,195（cowork 导入，~380 defs）与 92,790-93,418（hotkey，60+ defs）密度极高且函数名全失。建议按 §3.4/§3.10 的数据流分模块，模块内再按「schema→IO→变换→编码」分层；cowork 区的 zod schema（`OMe/AMe/jMe/AP/tNe/UNe` 等）建议合并到 `import/cowork-schemas.ts` 单文件，避免 20+ 个碎 schema 散落。
4. **`Jje` DetachedWindowManager 状态机**（81,284-82,058）：phase 流转（opening→presenting→detached→restoring→restored）+ prewarm slot 复用 + `using`（`a.en()` TS asyncDispose 守卫）三重复杂度。迁移时**禁止拆散该类**；prewarm（`GN/qje`）可拆出但必须保留「attempt 与 slot 双生命周期」耦合。
5. **saved-sections 的 globalState 键**：`n.iu.PINNED_THREAD_IDS`（legacy）与 `APP_SERVER_MIGRATED_PINNED_THREAD_IDS_BY_HOST`（迁移账本）跨 `$ze/iBe/yH/jH` 四类读写，还有一个硬编码 UUID `01984de2-8f74-7c91-a3b2-5c5e937cf318`（pinned section 的保留 ID，188 定义、93,746/94,353/95,382 字面量复用）。拆三个模块时该 UUID 与迁移账本语义必须集中到 `saved-sections-state`，否则迁移幂等性（`pendingMigrationMarkers`、`markThreadMigrated` 的 flushOrThrow）会破坏。
6. **hotkey 挂起域**：`jze` 的引用计数（`KV`）+ bare-modifier 的 `MV` 两个挂起状态独立存在；恢复顺序（先 `NV(!1)` 再逐个 `ZV`）不可交换。bare-modifier monitor 是 spawn 的 native helper（`native/bare-modifier-monitor/build/Release-<arch>/`），**进程生命周期管理（`u` 闭包 + exit/error 清理）是易错点**。
7. **跨平台分支不可本地验证**：win32 路径（TOML 审批、PowerShell 释放监视、`Xze` 网络盘）、linux 无 bare-modifier；macOS-only（Messages 审批、launch-services、sips/qlmanage、CUA defaults）在非 mac 平台全部返回 null/undefined——保持这些 guard 的平台判定（`process.platform !== 'darwin' return null` 模式）逐处复刻。
8. **86,196 与 87,577 两个同名 logger `external-agent-import`**：provider 工厂层与项目分配层各持一个实例（`OI/YI`），加上 86,706 `LI`（引用同一字符串）共 3 处绑定。重写时应共享一个模块级 logger，不要造出三个。
9. **`kN` conversational-onboarding 的字面量 globalState 键**：`'electron-conversational-onboarding-completions-v1'` 是裸字符串（80,495/80,504，不走 `a.*` 键表）——重写时提升为常量，且它与 `a.lt` 键是**同一记录列表的两种投影**（completions 数组 vs 包含性检查），语义上是一个存储，勿拆两处。
10. **`Wze`/`rBe`/`jH` 跨越 95,000 边界**：本区间地图与 R7 边界在 saved-sections 簇中间相交（94,962 `rBe`、95,077 `iBe`、95,321 `jH` 在 R7 名义区间）。**派发 R7 时不要重复处理 93,746-95,334**，归本簇的三个模块；R7 从 95,335（AppServer 总管装配点）接手。

---

## 附：本区间定义密度核对

75,000-95,000 桶内顶层定义共 608 处（`/tmp/r6-defs.txt` 口径：`^(async )?function|^class|^(var|let|const)`），分布：
- 75,000-79,277（vendored yaml）：~70（CST 对象字面量碎块）
- 79,278-82,100（capture/approvals/onboarding/lock/pet/export-logs/debug/demo/detached）：~150
- 82,100-86,195（automation tool + cowork 导入 + external-agent 前半）：**~330（密度峰值）**
- 86,196-87,722（external-agent 后半）：~120
- 87,723-91,982（vendored minipass+tar）：~20（IIFE 风格，grep 失配为主，实际定义远多于此——同粗扫 §9.1 的失配现象）
- 91,983-95,000（feedback 归档/latex/internal-plugins/hotkey/sections 前半）：~160

粗扫 §2 的 80,000-84,999 桶 272 处与 85,000-89,999 桶 145 处与本口径一致（87,723 后被 vendored 稀释）。
