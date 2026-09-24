# bootstrap 重写合同（agent 必读）

本文档约定 `src/main/bootstrap-C4dRql4x.ts`（只读源文件，25,626 行）拆分为
`src/main/bootstrap/` 下真实源码的规则。结构分析见 `docs/bootstrap-analysis.md`。

## 源文件顶层绑定映射（读原文件时对照）

```
e  = rolldown 打包运行时（e.a interop、e.n 惰性 init）——重写时忽略
t  = @chunk/desktop-open-path-queue（t.a() = takePendingUrls）
n  = @chunk/shared（单字母导出，见 src/main/types/chunk-modules.d.ts）
r  = @chunk/logger（r.i=记忆化 tag logger、r.n=getLogger、r.o=setLogger、r.t=formatLogTags）
i  = @chunk/main-shared（很少用）
o  = electron（app/dialog/protocol/…）
a=node:url  s=node:util  c=path  l=node:os  u=node:path  d=node:crypto
f=node:fs  p=node:fs/promises  m=node:stream  h=node:timers/promises
g=fs  _=stream  v=util  y=node:child_process  b=url  x=zlib
S=node:readline  C=perf_hooks  w=module  T=worker_threads
E=node:diagnostics_channel  D=diagnostics_channel  O=node:worker_threads  ee=node:zlib
```

注意：`o`、`c`、`l`、`u`、`f`、`p`、`b`、`E`、`D` 等经 `e.a()` interop 过，
原代码常写 `o.app`、`u.default.join`——重写时直接 `import { app } from "electron"`、
`import { join } from "node:path"`。

## vendored 库

`src/main/bootstrap/vendor.ts`（@ts-nocheck）保留了内嵌的第三方库（Sentry、
OpenTelemetry、mime-db 等），符号维持压缩名。需要引用时：

```ts
import { QS as sentryElectronInit, ob as sentryElectronVersion } from "../vendor";
```

vendor 的导出清单由集成方在集成阶段统一补齐——**tsc 报「../vendor 没有导出某符号」
是预期的，忽略即可**，但务必在最终报告里列出你 import 的全部 vendor 符号。

## 模块表与跨模块符号约定

模块路径（相对 `src/main/bootstrap/`）与关键导出的语义名。跨模块 import 时
以本表为准（其他 agent 正在并行写这些模块，tsc 报「模块不存在/无此导出」
先忽略，并在报告里列出你 import 了哪些跨模块符号）。

| 模块 | 关键导出（压缩名 → 语义名） |
| --- | --- |
| `util/misc.ts` | `ne`→MIGRATION_ANNOUNCEMENT_KEY、`re`→identity、`ie`→debounce、`ae`→isLibfileName |
| `deeplinks/codex-url.ts` | `te`→parseCodexUrl |
| `telemetry/breadcrumb-truncation.ts` | `pe`→truncateBreadcrumb |
| `settings/toml-codec.ts` | `ye`→tomlToJson、`be`→jsonToToml、`xe`→…（按语义命名） |
| `startup/startup-phases.ts` | `we`→STARTUP_PHASES、`Te`→StartupPhases（class）、`Ee`→abortErrorConverter |
| `telemetry/error-reporter.ts` | `De`→noopErrorReporter、`Oe`→createErrorReporter |
| `logging/log-level.ts` | `ke`/`Ae`/`je`/`Me`（级别比较、按 flavor 定默认级别、解析） |
| `intl/native-intl.ts` | `Ue`→configureNativeIntl、`We`→requireNativeIntl、`Ge`→NativeIntl、`Ve`→schema |
| `platform/intel-launch-warning.ts` | `Ke`/`qe`→showIntelOnAppleSiliconWarning、`Je`/`Ye` |
| `protocol/app-protocol.ts` | `lt`→registerPrivilegedAppSchemes、`ht`→installAppProtocolHandler、`ft`→resolveRendererUrl、`ut`→getWebviewDir（vendor 的 mime-types 实例 `tt` 从 ../vendor import） |
| `net/network-policy.ts` | `Nt`→NetworkPolicy（class）、`Ot`→appSessionId、`kt`/`At`/`jt`/`Mt` |
| `metadata/package-metadata.ts` | `Pt`→packageJsonCandidates、`j`→readPackageMetadataField |
| `build-info/build-flavor.ts` | `M`→BuildFlavor（对象字面量，含 resolve/parse/shouldIncludeSparkle 等）、`Ft`→logger、`Ht`→bundleIdentifier、`Rt`/`zt`/`Bt`/`Vt` |
| `build-info/build-number.ts` | `Kt`→BuildNumber（保持懒 getter 语义 `.value`）、`Ut`/`Wt`/`Gt` |
| `updater/production-appcast-state.ts` | `Yt`→ProductionAppcastState（class）、`qt`/`Jt` |
| `telemetry/owl-crash-counter.ts` | `mC`→makeMinidumpBeforeSend、`oC`→OwlCrashCounter（class）等 |
| `telemetry/desktop-sentry.ts` | `kC`→initDesktopSentry、`OC`→SENTRY_STARTUP_CONFIG（模块加载即求值，保持）、`DC`/`EC`/`TC`、`SC`→createFetchTransport、`CC`、`AC`、`jC` |
| `logging/file-logger.ts` | `MC`→defaultLogRoot、`qC`→installConsoleWriteErrorTolerance、文件日志安装函数（`r.o()` 的调用方） |
| `telemetry/otel-tracing.ts` | `xO`→setupDesktopTracing、`kO`→bindWebsiteReporting、`SO`/`CO`/`wO`/`TO`/`EO`/`DO`/`OO`、状态 `mO`/`hO`/`gO`/`_O`/`vO`/`yO` |
| `desktop-runtime.ts` | `jO`→createDesktopRuntime（惰性单例，保持 `AO` 缓存语义）、`AO`→runtimeSingleton |
| `updater/linux-package-updater.ts` | `ew`→LinuxPackageUpdater（class）、`ZC`/`QC` |
| `updater/relaunch-policy.ts` | `pw`→getOwlUpdatePolicies、relaunch 通知窗口计算 |
| `ipc/channels.ts` | `Tw`~`Yw` → 语义命名的 `codex_desktop:*` 频道常量 |
| `api/endpoints.ts` | `Qw`/`$w`/`eT` → USER_AGENT/API base URL 常量 |
| `api/authed-fetch.ts` | `rT`→authedFetch、Bearer/Account-Id 头、401 重试 |
| `updater/backend-appcast.ts` | `mT`~`xT` → backend appcast URL 构造与版本比较 |
| `updater/windows-msix-updater.ts` | `DT`→MsixUpdater（class）、`OT`→loadWindowsUpdaterAddon |
| `updater/windows-store-updater.ts` | `IT`→WindowsStoreUpdater（class） |
| `updater/windows-combined-updater.ts` | `LT`→WindowsCombinedUpdater（class） |
| `updater/update-errors.ts` | `$`→UpdateError（class）、`tj`→分类函数、`ej`→schema |
| `updater/sparkle-manager.ts` | `KT`→SparkleManager（class，统一更新门面）、`GT`→updateIntervalMinutes |
| `updater/startup-failure-dialog.ts` | `Ej`→showStartupFailureDialog、`Tj`→按钮文案 |
| `state/browser-auth-operations.ts` | （wave 2） |
| `window/placement-snapping.ts` | （wave 2） |
| `state/global-state.ts` | （wave 2）`lD`→GlobalState（class） |
| `settings/settings-store.ts` | （wave 2）`TD`→SettingsStore（class） |
| `startup/startup-context.ts` | （wave 2）`BD`→createStartupContext、`FD`、`ID`/`LD`/`RD`/`zD` |
| `startup/startup-changes.ts` | （wave 2）`VD`→StartupChanges |
| `deeplinks/parse.ts` | （wave 2）`$O`→parseDeepLink 等 |
| `deeplinks/manager.ts` | （wave 2）`Sk`→needsSingleInstanceLock、`Ck`→createDeepLinkManager |
| `net/url-gate.ts` | （wave 2）`MO`~`FO` |
| `startup/command-line.ts` | （wave 2）`wk`→chromiumSwitches |
| `startup/user-data.ts` | （wave 2）`Tk`→userDataPath、`Ek`→appBundlePath |
| `platform/legacy-chatgpt-relocation.ts` | （wave 2）`Dk`~`Nk` |
| `platform/applications-installer.ts` | （wave 2）`Bk`→ensureInstalledInApplications、`cA`→安装窗口 HTML |
| `platform/owl-tweaks.ts` | （wave 2）`fA`→owlUserAgentSwitches、`mA`→repairDockTile |
| `platform/sqlite-recovery.ts` | （wave 2）`EA`→recoverSqliteState |
| `platform/windows-oem.ts` | （wave 2）`YA`~`$A` |
| `platform/windows-runtime-framework.ts` | （wave 2）`fj`/`uj`/`pj` 等 |
| `app/window-all-closed.ts` | （wave 2）`qA`→installWindowAllClosedHandler |

## 硬性规则

1. **语义逐行等价**：所有分支、await 顺序、错误处理、竞态时序保持原样。
   懒求值（`Kt.value`、`Ot`、`OC`、`AO` 单例）必须保持懒。
2. **模块加载即求值的状态**（如 `OC`、`Ot`）保持在模块顶层初始化，报告里注明。
3. 真实命名 + 中文 JSDoc；类型尽量补全，不确定用 unknown/宽松类型。
4. 不改 `vendor.ts`、`chunk-manifest.mjs`、构建脚本、`bootstrap-C4dRql4x.ts`（只读）。
5. 不跑 build；可以跑 `npx tsc --noEmit`，**忽略**以下错误：来自 `../vendor` 的缺导出、
   来自其他尚未写完模块的缺导出、`bootstrap-C4dRql4x.ts` 自身的错误。其余错误必须修复。
6. 报告必须列出：模块清单与行数、导出符号、**import 的全部 vendor 符号**、
   import 的跨模块符号、语义不确定点（行号+疑点）。
