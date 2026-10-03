// 尚未逆向重写的 chunk 的类型声明。
//
// 源码里写作 `import ... from "@chunk/<语义名>"` 的导入由 scripts/chunk-manifest.mjs
// 映射为对输出 chunk（app/.vite/build/<文件名>）的运行时 require。已重写的 chunk
// 直接声明其命名导出；未重写的 chunk 仍以发布版的单字母导出名提供（语义见注释），
// 导入时用 `import { t as createDesktopLogArchive } from "@chunk/main"` 的方式重命名。

declare module "@chunk/desktop-open-path-queue" {
  export type OpenFilesHandler = (paths: string[]) => void;

  /** 取走所有排队的 open-url 链接（标记 URL 队列已就绪）。 */
  export function takePendingUrls(): string[];
  /** 设置文件处理器并取走排队文件；handler 为空或已设置时无操作。 */
  export function setOpenFilesHandler(handler: OpenFilesHandler): string[];
  /** 文件路径入队（有 handler 时直接回调）。 */
  export function enqueueOpenFiles(paths: string[]): boolean;
  /** 注册 open-file / open-url 早期监听（返回反注册函数）。 */
  export function installEarlyOpenPathListeners(enabled: boolean): () => void;
  /** 释放文件处理器。 */
  export function releaseOpenFilesHandler(handler: OpenFilesHandler): void;
}

declare module "@chunk/logger" {
  export interface LogTags {
    safe: Record<string, unknown>;
    sensitive?: Record<string, unknown>;
  }
  export type LogLevel = "trace" | "debug" | "info" | "warning" | "error";
  export interface Logger {
    trace(message: string, tags?: LogTags): void;
    debug(message: string, tags?: LogTags): void;
    info(message: string, tags?: LogTags): void;
    warning(message: string, tags?: LogTags): void;
    error(message: string, tags?: LogTags): void;
    log(level: LogLevel, message: string, tags?: LogTags): void;
    dispose?(): void;
  }
  export function setLogger(logger: Logger): void;
  export function getLogger(): Logger;
  export function createTaggedLogger(tag: string): Logger;
  export function memoizedTaggedLogger(tag: string): () => Logger;
  export function createElapsedTimestampLogger(tag: string): Logger;
  export function formatLogTags(tags: Record<string, unknown>): string;
}

declare module "@chunk/shared" {
  // src-DldfpmrL.js —— 主进程共享库（尚未逆向重写）。
  // 692 个导出按发布版的压缩名提供；类型暂为 any，注释标注内部符号名。
  // 已识别语义的导出给了精确类型。shared 重写后本声明会逐步语义化并最终移除。
  export interface Schema<T = any> {
    safeParse(input: unknown): { success: boolean; data: T };
  }
  export interface NumberSchema<T = any> extends Schema<T> {
    positive(): NumberSchema<T>;
    min(n: number): NumberSchema<T>;
    max(n: number): NumberSchema<T>;
  }
  export interface ArraySchema<T = any> extends Schema<T> {
    length(n: number): ArraySchema<T>;
  }
  export const $: any; // 内部符号: Qie
  export const $c: any; // 内部符号: Px
  export const $d: any; // 内部符号: qh
  export { NODE_REPL_TRUSTED_SERVICES_ENV_KEY as $l } from "../../shared/app-constants";
  export { shellQuote as $n } from "../../shared/misc-runtime";
  export const $r: any; // 内部符号: sI
  export const $t: any; // 内部符号: _2
  export { threadIdOf as $u } from "../../shared/browser-context";
  export { resolveApplication as A } from "../../shared/fs-diagnostics";
  export { createDeferred as Ac } from "../../shared/http-headers";
  export { normalizeApprovalsReviewer as Ad } from "../../shared/sandbox-permissions";
  export { Af } from "../../shared/zod-facade";
  export { buildWslEnvDirective as Ai } from "../../shared/wsl-paths";
  export { CHROME_DEV_PLUGIN_NAME as Al } from "../../shared/app-constants";
  export const An: any; // 内部符号: jX
  export const Ao: any; // 内部符号: gO
  export const Ar: any; // 内部符号: LB
  export const As: any; // 内部符号: IT
  export { acceleratorsForCommand as At } from "../../shared/command-registry";
  export const Au: any; // 内部符号: Ly
  export const B: any; // 内部符号: Yae
  export const Ba: any; // 内部符号: zA
  export { isKnownBrowserFamily as Bc } from "../../shared/browser-tab-mentions";
  export const Bd: any; // 内部符号: Zg
  export { AbortableFetchDispatcher as Bf } from "../../shared/rpc-core";
  export { sanitizedProcessEnv as Bi } from "../../shared/wsl-paths";
  export { VISUALIZE_PLUGIN_NAME as Bl } from "../../shared/app-constants";
  export { Bn } from "../../shared/runtime-state";
  export const Br: any; // 内部符号: oB
  export { HEADER_ATTACH_AUTH as Bs } from "../../shared/http-headers";
  export { agentInstructionsForThread as Bt } from "../../shared/agent-instructions";
  export { normalizeAppVersion as Bu } from "../../shared/app-server-version";
  export const C: any; // 内部符号: Pse
  export const Cc: any; // 内部符号: SC
  export { remoteModelSlugs as Cd } from "../../shared/automation-settings";
  // 注：zod builder 导出（Cf/Of 等）在 main-app 重写中被大量链式调用
  // （.trim()/.int()/.refine()/.catchall() 等），d.ts 无法完整还原 zod 的 builder 面，
  // 故放宽为 any；内部符号名见原粗扫/深析文档。
  export { Cf } from "../../shared/zod-facade";
  export const Ci: any; // 内部符号: ZM
  export { joinPath as Cl } from "../../shared/app-constants";
  export const Cn: any; // 内部符号: OX
  export const Co: any; // 内部符号: Mk
  export const Cr: any; // 内部符号: cB
  export { isDurableHost as Cs } from "../../shared/host-config";
  export { readKeymapSync as Ct } from "../../shared/command-registry";
  export const Cu: any; // 内部符号: Xy
  export const D: any; // 内部符号: cse
  export const Da: any; // 内部符号: tj
  export { configOverrideKeyForVersion as Dc } from "../../shared/app-config";
  export { permissionsForProfile as Dd } from "../../shared/sandbox-permissions";
  export { Df } from "../../shared/zod-facade";
  export { appServerFileSystem as Di } from "../../shared/wsl-paths";
  export { toPosixPath as Dl } from "../../shared/app-constants";
  export const Dn: any; // 内部符号: oX
  export const Dr: any; // 内部符号: mB
  export const Ds: any; // 内部符号: jT
  export { WEBVIEW_THREAD_COMMANDS as Dt } from "../../shared/command-registry";
  export const Du: any; // 内部符号: Py
  export const E: any; // 内部符号: _se
  export { dynamicAppToolResultSchema as Ec } from "../../shared/app-config";
  export const Ed: any; // 内部符号: j_
  export { Ef } from "../../shared/zod-facade";
  export const Ei: any; // 内部符号: DM
  export { stripDriveLetterSlash as El } from "../../shared/app-constants";
  export { primaryRuntimeDiagnostics as En } from "../../shared/mcp-runtime";
  export const Eo: any; // 内部符号: PO
  export const Er: any; // 内部符号: kB
  export { isRemoteHostConfig as Es } from "../../shared/host-config";
  export { WEBVIEW_FOCUS_TAB_COMMANDS as Et } from "../../shared/command-registry";
  export const Eu: any; // 内部符号: Jy
  export { readPlistValue as F } from "../../shared/fs-diagnostics";
  export { buildChromiumExtensionManagementUrl as Fc } from "../../shared/browser-tab-mentions";
  export { permissionSetAllowed as Fd } from "../../shared/sandbox-permissions";
  export { Ff } from "../../shared/zod-facade";
  export { getInteractivePathFromWslBash as Fi } from "../../shared/wsl-paths";
  export { COMPUTER_USE_PLUGIN_NAME as Fl } from "../../shared/app-constants";
  export const Fn: any; // 内部符号: xY
  export const Fo: any; // 内部符号: HD
  export const Fr: any; // 内部符号: CB
  export const Fs: any; // 内部符号: bT
  export { COMMAND_DEFINITIONS as Ft } from "../../shared/command-registry";
  export { parseElementName as Fu } from "../../shared/browser-context";
  export const G: any; // 内部符号: k5
  export const Ga: any; // 内部符号: kA
  export { deserializeBrowserTabMention as Gc } from "../../shared/browser-tab-mentions";
  export { Gd } from "../../shared/zod-facade";
  export const Gi: any; // 内部符号: cre
  export { CODEX_CLI_PATH_ENV_KEY as Gl } from "../../shared/app-constants";
  export { Gn } from "../../shared/runtime-state";
  export const Go: any; // 内部符号: aD
  export const Gr: any; // 内部符号: NI
  export { shouldAttachAuthHeaders as Gs } from "../../shared/http-headers";
  export const Gt: any; // 内部符号: Y2
  export { supportsRecencySortKey as Gu } from "../../shared/app-server-version";
  export const H: any; // 内部符号: q5
  export { mentionsWithinBudget as Hc } from "../../shared/browser-tab-mentions";
  export const Hd: any; // 内部符号: Ug
  export { RpcStubLike as Hf } from "../../shared/rpc-core";
  export { isWslUncPath as Hi } from "../../shared/wsl-paths";
  export { buildAutoInstallOptOutKey as Hl } from "../../shared/app-constants";
  export { setWindowsCoreRoot as Hn } from "../../shared/mcp-runtime";
  export { pathApiForPlatform as Hr } from "../../shared/sql-git-registry";
  export { HEADER_INTEGRITY_STATE as Hs } from "../../shared/http-headers";
  export { permissionsForInstructions as Ht } from "../../shared/agent-instructions";
  export { normalizeWindowsStoreBuildVersion as Hu } from "../../shared/app-server-version";
  export { resolveChromePaths as I } from "../../shared/fs-diagnostics";
  export { browserFamilyForProgId as Ic } from "../../shared/browser-tab-mentions";
  export { availablePermissionProfileKinds as Id } from "../../shared/sandbox-permissions";
  export { If } from "../../shared/zod-facade";
  export const Ii: any; // 内部符号: hre
  export const Il: any; // 内部符号: Pb
  export { resolveCodexPath as In } from "../../shared/mcp-runtime";
  export const Io: any; // 内部符号: BD
  export const Ir: any; // 内部符号: wB
  export { isGitSource as Is } from "../../shared/host-config";
  export { ChunkedMessageSender as It } from "../../shared/chunked-message";
  export { BROWSER_CONTEXT_KINDS as Iu } from "../../shared/app-config";
  export const J: any; // 内部符号: dae
  export const Jc: any; // 内部符号: oS
  export const Jd: any; // 内部符号: kg
  export { changeTouchesVisualizationArtifact as Ji } from "../../shared/browser-context";
  export { NODE_REPL_COMMAND_ENV_KEY as Jl } from "../../shared/app-constants";
  export const Jn: any; // 内部符号: eJ
  export const Jo: any; // 内部符号: tD
  export const Jr: any; // 内部符号: hI
  export { wantsIntegrityState as Js } from "../../shared/http-headers";
  export const Jt: any; // 内部符号: h2
  export { parseVersionOutput as Ju } from "../../shared/app-server-version";
  export const K: any; // 内部符号: pae
  export const Ka: any; // 内部符号: SA
  export { hasValidUnicode as Kc } from "../../shared/browser-tab-mentions";
  export const Kd: any; // 内部符号: Mg
  export const Ki: any; // 内部符号: Nj
  export { COMPUTER_USE_MCP_SERVER_NAME as Kl } from "../../shared/app-constants";
  export { spawnProcess as Kn } from "../../shared/mcp-runtime";
  export const Kr: any; // 内部符号: MI
  export { wantsDesktopSurface as Ks } from "../../shared/http-headers";
  export const Kt: any; // 内部符号: U2
  export { supportsPaginatedHistory as Ku } from "../../shared/app-server-version";
  export const L: any; // 内部符号: toe
  export const La: any; // 内部符号: WA
  export { findDistribution as Lc } from "../../shared/browser-tab-mentions";
  export { deepEquals as Ld } from "../../shared/sandbox-permissions";
  export { Lf } from "../../shared/zod-facade";
  export { setShouldSpawnInsideWsl as Li } from "../../shared/wsl-paths";
  export { BUNDLED_PLUGIN_DESCRIPTORS as Ll } from "../../shared/app-constants";
  export { resolveNodePath as Ln } from "../../shared/mcp-runtime";
  export const Lo: any; // 内部符号: RD
  export const Lr: any; // 内部符号: fB
  export const Ls: any; // 内部符号: iT
  export { resolveRealpaths as Lt } from "../../shared/realpath";
  export { parseBrowserContextKind as Lu } from "../../shared/browser-context";
  export { listInstalledApplications as M } from "../../shared/fs-diagnostics";
  export const Ma: any; // 内部符号: XA
  export { candidateLimitForQuery as Mc } from "../../shared/browser-tab-mentions";
  export { sandboxModeOfPolicy as Md } from "../../shared/sandbox-permissions";
  export { Mf } from "../../shared/zod-facade";
  export { wslDistroName as Mi } from "../../shared/wsl-paths";
  export { CHROME_PLUGIN_NAME as Ml } from "../../shared/app-constants";
  export { resolveNodeModuleDirs as Mn } from "../../shared/mcp-runtime";
  export const Mo: any; // 内部符号: nO
  export const Mr: any; // 内部符号: pB
  export const Ms: any; // 内部符号: xT
  export { menuTitleForCommand as Mt } from "../../shared/command-registry";
  export const Mu: any; // 内部符号: zy
  export const N: any; // 内部符号: Doe
  export const Na: any; // 内部符号: YA
  export { dedupeTabCandidates as Nc } from "../../shared/browser-tab-mentions";
  export { permissionParamsOf as Nd } from "../../shared/sandbox-permissions";
  export { Nf } from "../../shared/zod-facade";
  export { resolveWslDistro as Ni } from "../../shared/wsl-paths";
  export { CODEX_APP_TOOLS_PLUGIN_NAME as Nl } from "../../shared/app-constants";
  export { resolveWindowsComputerUseHelperPath as Nn } from "../../shared/mcp-runtime";
  export const No: any; // 内部符号: JD
  export const Nr: any; // 内部符号: SB
  export { normalizeProjectPath as Ns } from "../../shared/host-config";
  export { commandAvailableForAccess as Nt } from "../../shared/command-registry";
  export const Nu: any; // 内部符号: Cy
  export const O: any; // 内部符号: ise
  export const Oc: any; // 内部符号: TC
  export { readOnlyPermissions as Od } from "../../shared/sandbox-permissions";
  export { Of } from "../../shared/zod-facade";
  export { resolveCodexHome as Oi } from "../../shared/wsl-paths";
  export { stripDrivePrefix as Ol } from "../../shared/app-constants";
  export { resolveRuntimeInstallRoot as On } from "../../shared/mcp-runtime";
  export const Or: any; // 内部符号: uB
  export { isSshHostConfig as Os } from "../../shared/host-config";
  export { findCommandDefinition as Ot } from "../../shared/command-registry";
  export const Ou: any; // 内部符号: Yy
  export { listWebBrowsers as P } from "../../shared/fs-diagnostics";
  export { BROWSER_FAMILY_CONFIGS as Pc } from "../../shared/browser-tab-mentions";
  export { isAutomaticApprovalsReviewer as Pd } from "../../shared/sandbox-permissions";
  export { Pf } from "../../shared/zod-facade";
  export const Pi: any; // 内部符号: mre
  export { COMPUTER_HISTORY_PLUGIN_NAME as Pl } from "../../shared/app-constants";
  export { resolveWindowsComputerUseHelperTransportModulePath as Pn } from "../../shared/mcp-runtime";
  export const Po: any; // 内部符号: GD
  export const Pr: any; // 内部符号: KB
  export const Ps: any; // 内部符号: ST
  export { isMouseAccelerator as Pt } from "../../shared/command-registry";
  export { parseElementMetadata as Pu } from "../../shared/browser-context";
  export { pluginsDirectoryOf as Q } from "../../shared/fs-diagnostics";
  export const Qc: any; // 内部符号: Hx
  export const Qd: any; // 内部符号: Zh
  export const Qi: any; // 内部符号: Tj
  export const Ql: any; // 内部符号: wb
  export const Qn: any; // 内部符号: XK
  export const Qo: any; // 内部符号: CE
  export const Qr: any; // 内部符号: ZF
  export { joinBackendApiPath as Qs } from "../../shared/http-headers";
  export const Qt: any; // 内部符号: g2
  export { isValidSemver as Qu } from "../../shared/app-server-version";
  export const R: any; // 内部符号: noe
  export { chromeExtensionIdsForChannel as Rc } from "../../shared/browser-tab-mentions";
  export const Rd: any; // 内部符号: i_
  export { Rf } from "../../shared/zod-facade";
  export { shouldSpawnInsideWsl as Ri } from "../../shared/wsl-paths";
  export { UNIFIED_COMPUTER_USE_PLUGIN_NAME as Rl } from "../../shared/app-constants";
  export { resolveNodeReplPath as Rn } from "../../shared/mcp-runtime";
  export const Rr: any; // 内部符号: TB
  export { agentInstructions as Rt } from "../../shared/agent-instructions";
  export { formatSemanticVersion as Ru } from "../../shared/app-server-version";
  export const S: any; // 内部符号: Fse
  export const Sc: any; // 内部符号: DC
  export { DEFAULT_MODELS as Sd } from "../../shared/automation-settings";
  export { Sf } from "../../shared/zod-facade";
  export const Si: any; // 内部符号: eN
  export { joinHostPath as Sl } from "../../shared/app-constants";
  export { resolveInstalledRuntime as Sn } from "../../shared/mcp-runtime";
  export const So: any; // 内部符号: kk
  export const Sr: any; // 内部符号: dB
  export const Ss: any; // 内部符号: AT
  export { readKeymap as St } from "../../shared/command-registry";
  export const Su: any; // 内部符号: Uy
  export const T: any; // 内部符号: Dse
  export const Tc: any; // 内部符号: CC
  export { AGENT_MODE_BY_HOST_ID_KEY as Td } from "../../shared/automation-settings";
  export { Tf } from "../../shared/zod-facade";
  export const Ti: any; // 内部符号: EM
  export { toForwardSlashes as Tl } from "../../shared/app-constants";
  export const Tn: any; // 内部符号: kX
  export const To: any; // 内部符号: WO
  export const Tr: any; // 内部符号: AB
  export const Ts: any; // 内部符号: PT
  export { updateKeymapBinding as Tt } from "../../shared/command-registry";
  export const Tu: any; // 内部符号: Ry
  export const U: any; // 内部符号: B5
  export const Ua: any; // 内部符号: FA
  export const Uc: any; // 内部符号: hS
  export const Ud: any; // 内部符号: Hg
  export { RpcTarget as Uf } from "../../shared/rpc-core";
  export { isWslPath as Ui } from "../../shared/wsl-paths";
  export { marketplaceNameForFlavor as Ul } from "../../shared/app-constants";
  export { setCoreGate as Un } from "../../shared/mcp-runtime";
  export const Uo: any; // 内部符号: sD
  export { localPathForHost as Ur } from "../../shared/sql-git-registry";
  export const Us: any; // 内部符号: Nw
  export const Ut: any; // 内部符号: U4
  export { parseSemanticVersion as Uu } from "../../shared/app-server-version";
  export const V: any; // 内部符号: Jae
  export const Va: any; // 内部符号: RA
  export { BROWSER_PLUGIN_DESCRIPTORS as Vc } from "../../shared/browser-tab-mentions";
  export const Vd: any; // 内部符号: Xg
  export { RpcConnectionLike as Vf } from "../../shared/rpc-core";
  export { windowsToWslPath as Vi } from "../../shared/wsl-paths";
  export { DEFAULT_MARKETPLACE_NAME as Vl } from "../../shared/app-constants";
  export { recordExecutableResolution as Vn } from "../../shared/mcp-runtime";
  export const Vr: any; // 内部符号: HB
  export { HEADER_DESKTOP_SURFACE as Vs } from "../../shared/http-headers";
  export { collectScheduledTemplates as Vt } from "../../shared/agent-instructions";
  export { buildMsixPackageIdentity as Vu } from "../../shared/app-server-version";
  export const W: any; // 内部符号: z5
  export const Wa: any; // 内部符号: PA
  export { tabDedupeKey as Wc } from "../../shared/browser-tab-mentions";
  export const Wd: any; // 内部符号: Rg
  export { connectRpc as Wf } from "../../shared/rpc-core";
  export const Wi: any; // 内部符号: Pj
  export { isBundledMarketplaceName as Wl } from "../../shared/app-constants";
  export { Wn } from "../../shared/runtime-state";
  export { DisposableBag as Wr } from "../../shared/sql-git-registry";
  export { HEADER_SURFACE as Ws } from "../../shared/http-headers";
  export { toWebSocketUrl as Wt } from "../../shared/ws-url";
  export { appServerSupportsFeature as Wu } from "../../shared/app-server-version";
  export { INTERNAL_TESTING_MARKETPLACE as X } from "../../shared/fs-diagnostics";
  export const Xc: any; // 内部符号: nS
  export const Xd: any; // 内部符号: Dg
  export { NODE_REPL_MCP_SERVER_NAME as Xl } from "../../shared/app-constants";
  export const Xn: any; // 内部符号: $q
  export const Xr: any; // 内部符号: gI
  export { errorKindOf as Xs } from "../../shared/http-headers";
  export const Xt: any; // 内部符号: v2
  export const Xu: any; // 内部符号: Bv
  export const Y: any; // 内部符号: fae
  export const Yc: any; // 内部符号: eS
  export const Yd: any; // 内部符号: Og
  export const Yi: any; // 内部符号: Aj
  export { NODE_REPL_REQUEST_META_ENV_KEY as Yl } from "../../shared/app-constants";
  export const Yn: any; // 内部符号: Qq
  export const Yo: any; // 内部符号: $E
  export const Yr: any; // 内部符号: _I
  export { expectedAccountIdOf as Ys } from "../../shared/http-headers";
  export const Yt: any; // 内部符号: W2
  export { isSupportedAppServerVersion as Yu } from "../../shared/app-server-version";
  export const Z: any; // 内部符号: eae
  export const Za: any; // 内部符号: rA
  export const Zc: any; // 内部符号: tS
  export const Zd: any; // 内部符号: xg
  export const Zl: any; // 内部符号: Cb
  export { loadLoginShellEnv as Zn } from "../../shared/mcp-runtime";
  export const Zr: any; // 内部符号: aI
  export { hasHeader as Zs } from "../../shared/http-headers";
  export const Zt: any; // 内部符号: m2
  export { compareSemver as Zu } from "../../shared/app-server-version";
  export const _: any; // 内部符号: v9
  export const _a: any; // 内部符号: Une
  export const _c: any; // 内部符号: KC
  export { reasoningEffortSchema as _d } from "../../shared/automation-settings";
  export { _f } from "../../shared/zod-facade";
  export { principalOfToken as _i } from "../../shared/sql-git-registry";
  export { stripWindowsExtendedPrefix as _l } from "../../shared/app-constants";
  export const _n: any; // 内部符号: _Q
  export const _o: any; // 内部符号: Hk
  export const _r: any; // 内部符号: WB
  export { DURABLE_HOST_ID as _s } from "../../shared/host-config";
  export { listCustomAvatars as _t } from "../../shared/pet-spritesheet";
  export const _u: any; // 内部符号: Gy
  export const a: any; // 内部符号: Wce
  export const aa: any; // 内部符号: wj
  export { jsonSchema as ac } from "../../shared/app-config";
  export const ad: any; // 内部符号: hv
  export { af } from "../../shared/zod-facade";
  export const ai: any; // 内部符号: JF
  export const al: any; // 内部符号: wx
  export const an: any; // 内部符号: I1
  export const ao: any; // 内部符号: sk
  export const ar: any; // 内部符号: uK
  export const as: any; // 内部符号: RE
  export const at: any; // 内部符号: Sie
  export { getAtomStateDefault as au } from "../../shared/app-constants";
  export const b: any; // 内部符号: Lse
  export const ba: any; // 内部符号: oj
  export const bc: any; // 内部符号: NC
  export { isCronAutomation as bd } from "../../shared/automation-settings";
  export { bf } from "../../shared/zod-facade";
  export const bi: any; // 内部符号: dN
  export { isWindowsPath as bl } from "../../shared/app-constants";
  export const bn: any; // 内部符号: pX
  export const bo: any; // 内部符号: Vk
  export const br: any; // 内部符号: UB
  export { hostIdOfEnvId as bs } from "../../shared/host-config";
  export { firstAcceleratorSync as bt } from "../../shared/command-registry";
  export { POPUP_WINDOW_SIZE as bu } from "../../shared/app-constants";
  export const c: any; // 内部符号: Ace
  export const cc: any; // 内部符号: hw
  export const cd: any; // 内部符号: sv
  export { cf } from "../../shared/zod-facade";
  export { openSqlite as ci } from "../../shared/sql-git-registry";
  export const cl: any; // 内部符号: Tx
  export const cn: any; // 内部符号: i1
  export const co: any; // 内部符号: nk
  export const cr: any; // 内部符号: EW
  export const cs: any; // 内部符号: PE
  export { COMMIT_PULL_REQUEST_GENERATION_BUNDLE as ct } from "../../shared/structured-generation";
  export { BuildFlavor as cu } from "../../shared/app-constants";
  export const d: any; // 内部符号: lce
  export const da: any; // 内部符号: dj
  export const dc: any; // 内部符号: tw
  export { parseAutomationUpdateOutput as dd } from "../../shared/automation-settings";
  export { df } from "../../shared/zod-facade";
  export const di: any; // 内部符号: IP
  export const dl: any; // 内部符号: Ax
  export const dn: any; // 内部符号: GQ
  declare const do_: any; // 内部符号: wk（保留字导出）
  export { do_ as "do" };
  export { requireMemoize as dr } from "../../shared/misc-runtime";
  export const ds: any; // 内部符号: iE
  export { emailDomainProvider as dt } from "../../shared/telemetry";
  export const du: any; // 内部符号: nb
  export const ea: any; // 内部符号: yj
  export const ec: any; // 内部符号: Sw
  export { identity as ed } from "../../shared/app-server-version";
  export { DEFAULT_OPEN_TARGET_PREFERENCE as ef } from "../../shared/automation-settings";
  export const ei: any; // 内部符号: cI
  export const el: any; // 内部符号: bx
  export const en: any; // 内部符号: G1
  export { shellSplit as er } from "../../shared/misc-runtime";
  export const es: any; // 内部符号: LE
  export const et: any; // 内部符号: Zie
  export { buildNodeReplMcpConfig as eu } from "../../shared/app-config";
  export { isPathlike as f } from "../../shared/tail-runtime";
  export const fa: any; // 内部符号: Gne
  export const fc: any; // 内部符号: $C
  export { parseHeartbeatFromBlocks as fd } from "../../shared/automation-settings";
  export { ff } from "../../shared/zod-facade";
  export const fi: any; // 内部符号: SP
  export const fl: any; // 内部符号: cx
  export const fn: any; // 内部符号: QQ
  export const fo: any; // 内部符号: Ok
  export { AppServerSshSetupError as fr } from "../../shared/process-exec";
  export const fs: any; // 内部符号: tE
  export { TelemetryClient as ft } from "../../shared/telemetry";
  export { INBOX_ITEM_CHANGE as fu } from "../../shared/app-constants";
  export const g: any; // 内部符号: nce
  export const gc: any; // 内部符号: qC
  export { notificationPolicySchema as gd } from "../../shared/automation-settings";
  export { gf } from "../../shared/zod-facade";
  export const gi: any; // 内部符号: CP
  export { isSamePath as gl } from "../../shared/app-constants";
  export const gn: any; // 内部符号: vQ
  export const go: any; // 内部符号: Dk
  export { classifyComputerUsePermission as gr } from "../../shared/process-exec";
  export const gs: any; // 内部符号: ZT
  export { readCustomAvatar as gt } from "../../shared/pet-spritesheet";
  export { ANNOTATION_FLOWS as gu } from "../../shared/browser-context";
  export const h: any; // 内部符号: b9
  export const ha: any; // 内部符号: fj
  export const hc: any; // 内部符号: JC
  export const hd: any; // 内部符号: B_
  export { hf } from "../../shared/zod-facade";
  export const hi: any; // 内部符号: wP
  export const hl: any; // 内部符号: sx
  export const hn: any; // 内部符号: xQ
  export const ho: any; // 内部符号: Ck
  export { classifyComputerUseError as hr } from "../../shared/process-exec";
  export const hs: any; // 内部符号: QT
  export { installCustomPet as ht } from "../../shared/pet-spritesheet";
  export { isValidThreadId as hu } from "../../shared/browser-context";
  export const i: any; // 内部符号: Kce
  export const ic: any; // 内部符号: Aw
  export { last as id } from "../../shared/app-config";
  declare const if_: any; // 内部符号: ph（保留字导出）
  export { if_ as "if" };
  export const ii: any; // 内部符号: eI
  export const il: any; // 内部符号: Sx
  declare const in_: any; // 内部符号: v1（保留字导出）
  export { in_ as "in" };
  export const ir: any; // 内部符号: dK
  export const is: any; // 内部符号: IE
  export const it: any; // 内部符号: bie
  export { STATE_KEYS as iu } from "../../shared/app-constants";
  export const j: any; // 内部符号: Aoe
  export { isCloudRequirementsAuthError as jc } from "../../shared/app-config";
  export { runtimeWorkspaceRootsOf as jd } from "../../shared/sandbox-permissions";
  export { jf } from "../../shared/zod-facade";
  export { wslToWindowsPath as ji } from "../../shared/wsl-paths";
  export { CHROME_INTERNAL_PLUGIN_NAME as jl } from "../../shared/app-constants";
  export { jn } from "../../shared/runtime-state";
  export const jr: any; // 内部符号: GB
  export { GIT_SOURCE_HEADER_KEY as js } from "../../shared/host-config";
  export { defaultAcceleratorsForCommand as jt } from "../../shared/command-registry";
  export const ju: any; // 内部符号: Iy
  export const k: any; // 内部符号: Uoe
  export { raceWithAbortSignal as kc } from "../../shared/http-headers";
  export { workspaceWritePermissions as kd } from "../../shared/sandbox-permissions";
  export { kf } from "../../shared/zod-facade";
  export { resolveExecutionCodexHome as ki } from "../../shared/wsl-paths";
  export const kl: any; // 内部符号: Db
  export const kn: any; // 内部符号: EX
  export const ko: any; // 内部符号: xO
  export const kr: any; // 内部符号: jB
  export const ks: any; // 内部符号: MT
  export { firstAcceleratorForCommand as kt } from "../../shared/command-registry";
  export const ku: any; // 内部符号: By
  export const l: any; // 内部符号: T9
  export const lc: any; // 内部符号: cw
  export const ld: any; // 内部符号: ov
  export { lf } from "../../shared/zod-facade";
  export const li: any; // 内部符号: TP
  export const ll: any; // 内部符号: Ox
  export const ln: any; // 内部符号: a1
  export const lo: any; // 内部符号: Tk
  export { elicitationForTurn as lr } from "../../shared/misc-runtime";
  export { PULL_REQUEST_GENERATION_BUNDLE as lt } from "../../shared/structured-generation";
  export const lu: any; // 内部符号: tb
  export const m: any; // 内部符号: y9
  export const ma: any; // 内部符号: Kne
  export const mc: any; // 内部符号: XC
  export { AUTOMATION_MISSING_ERROR as md } from "../../shared/automation-settings";
  export { mf } from "../../shared/zod-facade";
  export const mi: any; // 内部符号: EP
  export const ml: any; // 内部符号: px
  export const mn: any; // 内部符号: wQ
  export const mo: any; // 内部符号: jk
  export { AppServerRequestDeliveryError as mr } from "../../shared/process-exec";
  export { telemetryIntakeUrl as mt } from "../../shared/telemetry";
  export { broadcastVersionOf as mu } from "../../shared/browser-context";
  export const n: any; // 内部符号: Yce
  export const nc: any; // 内部符号: jw
  export const nd: any; // 内部符号: Cv
  export const nf: any; // 内部符号: bte
  export const ni: any; // 内部符号: oI
  export const nl: any; // 内部符号: _x
  export const nn: any; // 内部符号: x1
  export { parseMarkdownPathLinks as nr } from "../../shared/misc-runtime";
  export const ns: any; // 内部符号: BE
  export { TextGenerator as nt } from "../../shared/structured-generation";
  export { isNodeReplSandboxPlatform as nu } from "../../shared/app-config";
  export { StartupConfigClient as o } from "../../shared/tail-runtime";
  export const oa: any; // 内部符号: hj
  export { configKeyPath as oc } from "../../shared/app-config";
  export { unescapeHtml as od } from "../../shared/app-config";
  export { of } from "../../shared/zod-facade";
  export const oi: any; // 内部符号: GF
  export const ol: any; // 内部符号: Cx
  export const on: any; // 内部符号: l1
  export const oo: any; // 内部符号: ik
  export { requestErrorOf as or } from "../../shared/misc-runtime";
  export const os: any; // 内部符号: jE
  export const ot: any; // 内部符号: H8
  export { BROWSER_PLUGIN_NAME as ou } from "../../shared/app-constants";
  export const p: any; // 内部符号: tce
  export const pc: any; // 内部符号: ZC
  export { NO_FUTURE_RUNS_ERROR as pd } from "../../shared/automation-settings";
  export { pf } from "../../shared/zod-facade";
  export const pi: any; // 内部符号: xP
  export const pl: any; // 内部符号: mx
  export const pn: any; // 内部符号: CQ
  export const po: any; // 内部符号: Ak
  export { WebSocketReadyState as pr } from "../../shared/process-exec";
  export { TelemetryHttpTransport as pt } from "../../shared/telemetry";
  export const pu: any; // 内部符号: $y
  export const q: any; // 内部符号: x5
  export const qc: any; // 内部符号: sS
  export const qd: any; // 内部符号: jg
  export { visualizationDateOf as qi } from "../../shared/browser-context";
  export { NODE_REPL_MODULE_DIR_ENV_KEY as ql } from "../../shared/app-constants";
  /** 按名字解析 PATH 上的可执行文件（带缓存），找不到返回 undefined。 */
  export { executableResolver as qn } from "../../shared/mcp-runtime";
  export const qr: any; // 内部符号: AI
  export { wantsDeviceCheckToken as qs } from "../../shared/http-headers";
  export const qt: any; // 内部符号: A2
  export { APP_SERVER_UNSUPPORTED_PREFIX as qu } from "../../shared/app-server-version";
  export const r: any; // 内部符号: Gce
  export const ra: any; // 内部符号: Ej
  export { composeDefaultEnableFeatures as rc } from "../../shared/app-config";
  export const rd: any; // 内部符号: bv
  export { rf } from "../../shared/zod-facade";
  export const ri: any; // 内部符号: nI
  export const rl: any; // 内部符号: vx
  export const rn: any; // 内部符号: S1
  export const ro: any; // 内部符号: Jk
  export { unescapeMarkdownPunctuation as rr } from "../../shared/misc-runtime";
  export const rs: any; // 内部符号: FE
  export { PullRequestMessageGenerator as rt } from "../../shared/structured-generation";
  export const ru: any; // 内部符号: mb
  export const s: any; // 内部符号: jce
  export const sa: any; // 内部符号: gj
  export const sc: any; // 内部符号: gw
  export const sd: any; // 内部符号: fv
  export { sf } from "../../shared/zod-facade";
  export const si: any; // 内部符号: KF
  export const sl: any; // 内部符号: Dx
  export const sn: any; // 内部符号: o1
  export const so: any; // 内部符号: ak
  export const sr: any; // 内部符号: FW
  export const ss: any; // 内部符号: NE
  export { COMMIT_MESSAGE_GENERATION_BUNDLE as st } from "../../shared/structured-generation";
  export { BROWSER_USE_PLUGIN_NAME as su } from "../../shared/app-constants";
  export { workspaceAuthErrorOf as t } from "../../shared/tail-runtime";
  export { composeFeatureOverrides as tc } from "../../shared/app-config";
  export { InMemoryInterceptor as td } from "../../shared/app-config";
  /** 线程状态 → RGB 颜色码（内部符号 Cte，switch 返回各状态颜色常量）。 */
  export { colorForThreadStatus as tf } from "../../shared/browser-context";
  export const ti: any; // 内部符号: tI
  export const tl: any; // 内部符号: xx
  export const tn: any; // 内部符号: W1
  export const tr: any; // 内部符号: jK
  export const ts: any; // 内部符号: zE
  export { searchFileNames as tt } from "../../shared/file-search";
  export { isComputerUseServerName as tu } from "../../shared/app-constants";
  export const u: any; // 内部符号: dce
  export const ua: any; // 内部符号: Wne
  export const uc: any; // 内部符号: iw
  export { parseAppBrand as ud } from "../../shared/app-config";
  export { uf } from "../../shared/zod-facade";
  export const ui: any; // 内部符号: LP
  export const ul: any; // 内部符号: jx
  export const un: any; // 内部符号: r1
  export const uo: any; // 内部符号: Ek
  export const ur: any; // 内部符号: cW
  export { runStructuredGeneration as ut } from "../../shared/structured-generation";
  export { COWORK_MARKETPLACE_NAME as uu } from "../../shared/app-constants";
  export const v: any; // 内部符号: Qse
  export const va: any; // 内部符号: Hne
  export const vc: any; // 内部符号: GC
  export { findModel as vd } from "../../shared/automation-settings";
  export { vf } from "../../shared/zod-facade";
  export { chatGptAccountOfToken as vi } from "../../shared/sql-git-registry";
  export { isPosixAbsolutePath as vl } from "../../shared/app-constants";
  export const vn: any; // 内部符号: ZY
  export const vo: any; // 内部符号: Rk
  export const vr: any; // 内部符号: xB
  export const vs: any; // 内部符号: TT
  export { validatePetSpritesheet as vt } from "../../shared/pet-spritesheet";
  export const vu: any; // 内部符号: Vy
  export const w: any; // 内部符号: Nse
  export const wa: any; // 内部符号: Rne
  export const wc: any; // 内部符号: bC
  export { EMPTY_AMBIENT_SUGGESTIONS as wd } from "../../shared/automation-settings";
  export { wf } from "../../shared/zod-facade";
  export const wi: any; // 内部符号: YM
  export { normalizeUncPath as wl } from "../../shared/app-constants";
  export const wn: any; // 内部符号: TX
  export const wo: any; // 内部符号: JO
  export const wr: any; // 内部符号: MB
  export const ws: any; // 内部符号: NT
  export { resetKeybindings as wt } from "../../shared/command-registry";
  export const wu: any; // 内部符号: jy
  export const x: any; // 内部符号: Ise
  export const xc: any; // 内部符号: FC
  export { isHeartbeatAutomation as xd } from "../../shared/automation-settings";
  export { xf } from "../../shared/zod-facade";
  export const xi: any; // 内部符号: sN
  export { isUncPath as xl } from "../../shared/app-constants";
  export const xn: any; // 内部符号: CX
  export const xo: any; // 内部符号: Fk
  export const xr: any; // 内部符号: RB
  export const xs: any; // 内部符号: kT
  export { acceleratorsForCommandSync as xt } from "../../shared/command-registry";
  export const xu: any; // 内部符号: Zy
  export const y: any; // 内部符号: s9
  export const ya: any; // 内部符号: cj
  export const yc: any; // 内部符号: MC
  export { effectiveModelForAutomation as yd } from "../../shared/automation-settings";
  export { yf } from "../../shared/zod-facade";
  export const yi: any; // 内部符号: CN
  export { isNotNetworkUncPath as yl } from "../../shared/app-constants";
  export const yn: any; // 内部符号: XY
  export const yo: any; // 内部符号: Bk
  export const yr: any; // 内部符号: VB
  export const ys: any; // 内部符号: DT
  export const yt: any; // 内部符号: C8
  export const yu: any; // 内部符号: Hy
  export const z: any; // 内部符号: i7
  export const za: any; // 内部符号: VA
  export { getBrowserFamilyStoreUrls as zc } from "../../shared/browser-tab-mentions";
  export const zd: any; // 内部符号: Qg
  export { ABORTED as zf } from "../../shared/rpc-core";
  export { shouldUseWslPaths as zi } from "../../shared/wsl-paths";
  export { USER_WRITING_PLUGIN_NAME as zl } from "../../shared/app-constants";
  export { resolveRipgrepPath as zn } from "../../shared/mcp-runtime";
  export const zr: any; // 内部符号: qB
  export const zs: any; // 内部符号: sT
  export { withHeartbeatInstructions as zt } from "../../shared/agent-instructions";
  export { parseAppVersionAsDate as zu } from "../../shared/app-server-version";
  export {
    remoteControlEnrollmentAccountMismatch as $a,
    parseSharedJson as $i,
    sandboxScheme as $o,
    parseApiResponse as $s,
    agentAccessVisible as Aa,
    getBundledPluginCachePath as Bo,
    normalizeThreadOrders as Ca,
    defaultModeSettingsForHost as Do,
    findSettingDescriptor as Ea,
    settingsDescriptor as Fa,
    appearanceSettings as Ha,
    pluginsConfigSchema as Ho,
    openLinkPreference as Ia,
    chromeTabFocusSchema as Ja,
    compareProjects as Ko,
    mapSettingValue as Oa,
    hostValueMap as Oo,
    defaultModeSettings as Pa,
    keychainErrorOf as Qa,
    mapValuesModule as Ra,
    flavorDirectoryName as Ro,
    hostEnvironmentState as Rs,
    pluginState as Sa,
    shellEnvFlagKey as Ta,
    extractBundleOperationErrorCode as Vo,
    joinProjectRootsAsCwd as Wo,
    normalizeWorktreeRoot as Xa,
    turnSummaryKind as Xi,
    permissionSelectionToRequestFields as Xo,
    tabsLivenessSchema as Ya,
    turnRequestStripper as Zi,
    errorToMessage as Zo,
    parseStoredJson as ca,
    enrollmentRecordSchema as eo,
    archiveUndoDurationMs as ga,
    withSpawnTracing as ia,
    queueContextPredicate as io,
    sourceSettings as ja,
    hostValueMap as jo,
    SETTING_DESCRIPTORS as ka,
    unknownSchema as la,
    isNotificationMethod as ls,
    readDesktopTomlSection as ms,
    installSharedTracingBridge as na,
    queueContextError as no,
    sourceKinds as pa,
    isAddedFileAttachment as ps,
    tabMentionSearchSchema as qa,
    errorToSpanAttributes as ta,
    parseJwt as to,
    isMcpMethodNotFoundError as us,
    isAllowedAttachmentType as xa,
    appNameForFlavor as zo
  } from "../../shared/hosts-runtime";
  export const qo: any; // 内部符号: iD
}
declare module "@chunk/electron-resources-path" {
  // electron-resources-path-BDLw2lp0.js —— 已重写 chunk（src/main/electron-resources-path/）。
  export interface ElectronResourcesPathInput {
    env: Record<string, string | undefined>;
    resourcesPath: string;
  }
  /** 解析 resources 目录（CODEX_ELECTRON_RESOURCES_PATH 覆盖，否则 resourcesPath）。 */
  export function resolveElectronResourcesPath(input: ElectronResourcesPathInput): string;
}

declare module "@chunk/main" {
  // main-C-Mhak1n.js —— 主进程主体。
  /** 创建桌面日志归档（feedback desktop log archive）。 */
  export const t: (
    now?: Date,
    extraPaths?: string[],
    opts?: { includeDesktopLogs?: boolean },
  ) => Promise<{ archiveId: string; filePaths: string[] } | null>;
  /** 删除桌面日志归档。 */
  export const n: (archiveId: string) => Promise<boolean>;
  export const runMainAppStartup: unknown;
}

declare module "@chunk/bootstrap" {
  // bootstrap-C4dRql4x.js —— 已重写 chunk（src/main/bootstrap/，见
  // chunk-manifest.mjs 的 REWRITTEN）。兼容导出（单字母名，如 "in"/"R"/"bn"）
  // 与语义导出均由真实源码提供，直接转发真实模块的导出面。
  // `export *` 不转发字符串命名的导出（TS 限制），128 个兼容导出逐个转发
  //（语义名见 docs/bootstrap-export-table.txt 与 bootstrap/index.ts 的映射）。
  export { "$" as "$" } from "../../bootstrap/index";
  export { "$t" as "$t" } from "../../bootstrap/index";
  export { "A" as "A" } from "../../bootstrap/index";
  export { "At" as "At" } from "../../bootstrap/index";
  export { "B" as "B" } from "../../bootstrap/index";
  export { "Bt" as "Bt" } from "../../bootstrap/index";
  export { "C" as "C" } from "../../bootstrap/index";
  export { "Ct" as "Ct" } from "../../bootstrap/index";
  export { "D" as "D" } from "../../bootstrap/index";
  export { "Dt" as "Dt" } from "../../bootstrap/index";
  export { "E" as "E" } from "../../bootstrap/index";
  export { "Et" as "Et" } from "../../bootstrap/index";
  export { "F" as "F" } from "../../bootstrap/index";
  export { "Ft" as "Ft" } from "../../bootstrap/index";
  export { "G" as "G" } from "../../bootstrap/index";
  export { "Gt" as "Gt" } from "../../bootstrap/index";
  export { "H" as "H" } from "../../bootstrap/index";
  export { "Ht" as "Ht" } from "../../bootstrap/index";
  export { "I" as "I" } from "../../bootstrap/index";
  export { "It" as "It" } from "../../bootstrap/index";
  export { "J" as "J" } from "../../bootstrap/index";
  export { "Jt" as "Jt" } from "../../bootstrap/index";
  export { "K" as "K" } from "../../bootstrap/index";
  export { "Kt" as "Kt" } from "../../bootstrap/index";
  export { "L" as "L" } from "../../bootstrap/index";
  export { "Lt" as "Lt" } from "../../bootstrap/index";
  export { "M" as "M" } from "../../bootstrap/index";
  export { "Mt" as "Mt" } from "../../bootstrap/index";
  export { "N" as "N" } from "../../bootstrap/index";
  export { "Nt" as "Nt" } from "../../bootstrap/index";
  export { "O" as "O" } from "../../bootstrap/index";
  export { "Ot" as "Ot" } from "../../bootstrap/index";
  export { "P" as "P" } from "../../bootstrap/index";
  export { "Pt" as "Pt" } from "../../bootstrap/index";
  export { "Q" as "Q" } from "../../bootstrap/index";
  export { "Qt" as "Qt" } from "../../bootstrap/index";
  export { "R" as "R" } from "../../bootstrap/index";
  export { "Rt" as "Rt" } from "../../bootstrap/index";
  export { "S" as "S" } from "../../bootstrap/index";
  export { "St" as "St" } from "../../bootstrap/index";
  export { "T" as "T" } from "../../bootstrap/index";
  export { "Tt" as "Tt" } from "../../bootstrap/index";
  export { "U" as "U" } from "../../bootstrap/index";
  export { "Ut" as "Ut" } from "../../bootstrap/index";
  export { "V" as "V" } from "../../bootstrap/index";
  export { "Vt" as "Vt" } from "../../bootstrap/index";
  export { "W" as "W" } from "../../bootstrap/index";
  export { "Wt" as "Wt" } from "../../bootstrap/index";
  export { "X" as "X" } from "../../bootstrap/index";
  export { "Xt" as "Xt" } from "../../bootstrap/index";
  export { "Y" as "Y" } from "../../bootstrap/index";
  export { "Yt" as "Yt" } from "../../bootstrap/index";
  export { "Z" as "Z" } from "../../bootstrap/index";
  export { "Zt" as "Zt" } from "../../bootstrap/index";
  export { "_" as "_" } from "../../bootstrap/index";
  export { "_n" as "_n" } from "../../bootstrap/index";
  export { "_t" as "_t" } from "../../bootstrap/index";
  export { "a" as "a" } from "../../bootstrap/index";
  export { "an" as "an" } from "../../bootstrap/index";
  export { "at" as "at" } from "../../bootstrap/index";
  export { "b" as "b" } from "../../bootstrap/index";
  export { "bn" as "bn" } from "../../bootstrap/index";
  export { "bt" as "bt" } from "../../bootstrap/index";
  export { "c" as "c" } from "../../bootstrap/index";
  export { "cn" as "cn" } from "../../bootstrap/index";
  export { "ct" as "ct" } from "../../bootstrap/index";
  export { "d" as "d" } from "../../bootstrap/index";
  export { "dn" as "dn" } from "../../bootstrap/index";
  export { "dt" as "dt" } from "../../bootstrap/index";
  export { "en" as "en" } from "../../bootstrap/index";
  export { "et" as "et" } from "../../bootstrap/index";
  export { "f" as "f" } from "../../bootstrap/index";
  export { "fn" as "fn" } from "../../bootstrap/index";
  export { "ft" as "ft" } from "../../bootstrap/index";
  export { "g" as "g" } from "../../bootstrap/index";
  export { "gn" as "gn" } from "../../bootstrap/index";
  export { "gt" as "gt" } from "../../bootstrap/index";
  export { "h" as "h" } from "../../bootstrap/index";
  export { "hn" as "hn" } from "../../bootstrap/index";
  export { "ht" as "ht" } from "../../bootstrap/index";
  export { "i" as "i" } from "../../bootstrap/index";
  export { "in" as "in" } from "../../bootstrap/index";
  export { "it" as "it" } from "../../bootstrap/index";
  export { "j" as "j" } from "../../bootstrap/index";
  export { "jt" as "jt" } from "../../bootstrap/index";
  export { "k" as "k" } from "../../bootstrap/index";
  export { "kt" as "kt" } from "../../bootstrap/index";
  export { "l" as "l" } from "../../bootstrap/index";
  export { "ln" as "ln" } from "../../bootstrap/index";
  export { "lt" as "lt" } from "../../bootstrap/index";
  export { "m" as "m" } from "../../bootstrap/index";
  export { "mn" as "mn" } from "../../bootstrap/index";
  export { "mt" as "mt" } from "../../bootstrap/index";
  export { "n" as "n" } from "../../bootstrap/index";
  export { "nn" as "nn" } from "../../bootstrap/index";
  export { "nt" as "nt" } from "../../bootstrap/index";
  export { "o" as "o" } from "../../bootstrap/index";
  export { "on" as "on" } from "../../bootstrap/index";
  export { "ot" as "ot" } from "../../bootstrap/index";
  export { "p" as "p" } from "../../bootstrap/index";
  export { "pn" as "pn" } from "../../bootstrap/index";
  export { "pt" as "pt" } from "../../bootstrap/index";
  export { "q" as "q" } from "../../bootstrap/index";
  export { "qt" as "qt" } from "../../bootstrap/index";
  export { "r" as "r" } from "../../bootstrap/index";
  export { "rn" as "rn" } from "../../bootstrap/index";
  export { "rt" as "rt" } from "../../bootstrap/index";
  export { "s" as "s" } from "../../bootstrap/index";
  export { "sn" as "sn" } from "../../bootstrap/index";
  export { "st" as "st" } from "../../bootstrap/index";
  export { "t" as "t" } from "../../bootstrap/index";
  export { "tn" as "tn" } from "../../bootstrap/index";
  export { "tt" as "tt" } from "../../bootstrap/index";
  export { "u" as "u" } from "../../bootstrap/index";
  export { "un" as "un" } from "../../bootstrap/index";
  export { "ut" as "ut" } from "../../bootstrap/index";
  export { "v" as "v" } from "../../bootstrap/index";
  export { "vn" as "vn" } from "../../bootstrap/index";
  export { "vt" as "vt" } from "../../bootstrap/index";
  export { "w" as "w" } from "../../bootstrap/index";
  export { "wt" as "wt" } from "../../bootstrap/index";
  export { "x" as "x" } from "../../bootstrap/index";
  export { "xt" as "xt" } from "../../bootstrap/index";
  export { "y" as "y" } from "../../bootstrap/index";
  export { "yn" as "yn" } from "../../bootstrap/index";
  export { "yt" as "yt" } from "../../bootstrap/index";
  export { "z" as "z" } from "../../bootstrap/index";
  export { "zt" as "zt" } from "../../bootstrap/index";
}
declare module "@chunk/windows-file-copy" {
  // windows-file-copy-B0DNtkPq.js —— 已重写 chunk（src/main/windows-file-copy/）。
  /** 复制目录；源目录加密且目标盘不支持加密时回退为「解密后复制」。 */
  export function copyDirectoryAllowDecryptedDestinationOnEncryptionFailure(input: {
    copy: () => Promise<void>;
    source: string;
    destination: string;
  }): Promise<void>;
  /** 复制文件；同上的加密回退策略。 */
  export function copyFileAllowDecryptedDestinationOnEncryptionFailure(input: {
    copy: () => Promise<void>;
    source: string;
    destination: string;
  }): Promise<void>;
}
declare module "@chunk/main-shared" {
  // src-C9YLnbgY.js —— 主进程小工具 chunk（尚未逆向重写）。
  // deep-equal（fast-equals CJS 模块；main-C 中 `G = e.a(n.Ld())` 后
  // `(0, G.default)(a, b)` 的来源，即深度相等比较）。
  const deepEqual: (a: unknown, b: unknown) => boolean;
  export default deepEqual;
  /** 与 util.isDeepStrictEqual 同源的深度严格相等（fast-equals re-export）。 */
  export const isDeepStrictEqual: (a: unknown, b: unknown) => boolean;
}

declare module "@chunk/css-selector" {
  // dist-wQAv1pJP.js —— 未重写（css-select 引擎 + 惰性 HTML DOM parser 模块）。
  // t：rolldown 惰性 CJS 模块访问器——调用一次返回 parser 模块对象，其
  // parse(html) 产出带 querySelectorAll / structuredText 的 DOM 树
  // （main-C-Mhak1n.ts 26,445 `Bme = s.t()`，线程标题 markdown 纯文本化用）。
  export const t: () => {
    parse(
      html: string,
      options?: unknown,
    ): {
      querySelectorAll(selector: string): { remove(): void }[];
      structuredText: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

// main chunk 内嵌 vendored 库的临时声明（main 集成阶段会提取 main-vendor.ts）。
declare module "@main-vendor/statsig" {
  // @statsig/js-client（js-mono v3.33.4）入口的三符号（原 main chunk `Yw`）。
  export class StatsigClient {
    constructor(sdkKey: string, user: unknown, options?: unknown);
    dataAdapter: { setData(data: string): void };
    initializeSync(opts?: unknown): { success: boolean };
    getContext(): { user: unknown; values: unknown };
    shutdown(): void;
  }
  /** PublishedStatsig 持有的 client 形状（实际是上面的 StatsigClient）。 */
  export type StatsigClientLike = {
    dataAdapter: { setData(data: string): void };
    initializeSync(opts?: unknown): { success: boolean };
    getContext(): { user: unknown; values: unknown };
    shutdown(): void;
  };
  export function djb2Hash(value: string): string;
  export function makeTypedGet(name: string, value: unknown): (key: string) => unknown;
}

// main chunk 内嵌 vendored yaml（eemeli/yaml ~2.x）的临时声明（73,181-79,294 带）。
// 集成阶段提取 main-vendor.ts 时替换；长期方案为 npm i yaml。
declare module "@main-vendor/yaml" {
  export function parse(input: string): unknown;
  export function parseAllDocuments(input: string): unknown[];
  export function parseDocument(input: string): unknown;
  export function stringify(value: unknown): string;
}
