// 尚未逆向重写的渲染进程 chunk 的类型声明。
//
// 源码里写作 `import ... from "@rchunk/<语义名>"` 的导入由
// scripts/renderer-chunk-manifest.mjs 映射为对输出 chunk
// （app/webview/assets/<文件名>）的 external import。已重写的 chunk 直接声明其
// 命名导出；未重写的 chunk 以发布版的压缩导出名提供（导入时重命名使用），
// 语义由 docs/renderer-app-shared-analysis.md 等分析文档逐步标注。

declare module "@rchunk/rolldown-runtime" {
  export const n: unknown; // 共享运行时的 lazy 辅助（__vite__mapDeps 场景）
  export const o: () => void; // 通用懒初始化包装器
}

declare module "@rchunk/app-shared" {
  export const k: unknown;
  export const db: (props: Record<string, unknown>) => unknown;
  /** parseConfigError（恢复会话失败时提取 config.toml 定位）。 */
  export const hG: (error: unknown) => {
    column?: number;
    detail: string;
    filePath?: string;
    line?: number;
  } | null;
  /** isTransportUnavailableError（识别宿主传输断开）。 */
  export const oY: (error: unknown) => boolean;
  export const OK: (url: string) => string;
  export const PK: (value: string) => boolean;
  /** isWorkspacePath（目标应用发现前的本地路径判定）。 */
  export const NK: (value: string) => boolean;
  /** getPathBasename（来源面板的本地文件标签）。 */
  export const II: (path: string) => string;
  /** getMcpAppId（从 MCP 调用 id 提取稳定 app id）。 */
  export const eU: (callId: string) => string;
  export interface SafeParseSuccess<T> {
    success: true;
    data: T;
  }
  export interface SafeParseFailure {
    success: false;
  }
  export interface SafeParseSchema<T> {
    catch(fallback: T): SafeParseSchema<T>;
    parse(value: unknown): T;
    safeParse(value: unknown): SafeParseSuccess<T> | SafeParseFailure;
  }
  export interface OptionalSchema<T> extends SafeParseSchema<T | undefined> {
    optional(): OptionalSchema<T>;
  }
  export interface NullishSchema<T> extends SafeParseSchema<T | null | undefined> {
    nullish(): NullishSchema<T>;
  }
  export interface StringSchema extends SafeParseSchema<string> {
    min(length: number): StringSchema;
    nullable(): OptionalSchema<string | null>;
    optional(): OptionalSchema<string>;
  }
  export interface ObjectSchema<T extends Record<string, unknown>>
    extends SafeParseSchema<T> {
    loose(): ObjectSchema<T>;
    nullish(): NullishSchema<T>;
    optional(): OptionalSchema<T>;
  }
  export interface NumberSchema extends SafeParseSchema<number> {
    optional(): OptionalSchema<number>;
  }
  export interface BooleanSchema extends SafeParseSchema<boolean> {
    nullish(): NullishSchema<boolean>;
  }
  export interface RecordSchema<Key extends string, Value>
    extends SafeParseSchema<Record<Key, Value>> {
    nullish(): NullishSchema<Record<Key, Value>>;
  }
  export const H4: <T extends Record<string, unknown>>(
    shape: Record<string, SafeParseSchema<unknown>>,
  ) => ObjectSchema<T>;
  export const R4: <T>(value: T) => OptionalSchema<T>;
  export const q4: () => StringSchema;
  export const V4: () => NumberSchema;
  export const k4: () => BooleanSchema;
  // app-shared/ui/button.ts（内部 n8/a8/pot；压缩导出 Qh/Yh/Xh）。
  export type ButtonColor =
    | "accent" | "accentInverse" | "accentSubtle" | "activity"
    | "activityStop" | "activitySuccess" | "cardAction"
    | "composerPrimary" | "composerSurface" | "conversationFollowup"
    | "danger" | "dangerSolid" | "ghost" | "ghostAccent"
    | "ghostActive" | "ghostMuted" | "ghostOutline" | "ghostSecondary"
    | "ghostTertiary" | "ghostUserMessage" | "headerUpgrade"
    | "mediaOverlay" | "mediaSolid" | "mediaSubtle" | "outline"
    | "outlineActive" | "outlineCard" | "outlineGhost"
    | "outlineGhostMuted" | "outlineSurface" | "primary" | "secondary"
    | "segmentedInsetSelected" | "segmentedSelected" | "selectTrigger"
    | "shareDestination" | "successSolid" | "tinted" | "upgrade";
  export type ButtonSize =
    | "actionSm" | "activityOption" | "auth" | "beaconAction"
    | "beaconCarousel" | "cardAction" | "compact" | "composer"
    | "composerAuxiliary" | "composerPermissions" | "composerPill"
    | "composerSm" | "composerSmLabel" | "composerWithBadge"
    | "conversationFollowup" | "default" | "detailAction" | "dialog"
    | "dialogAction" | "dialogGhost" | "dragHandle" | "entityHeader"
    | "entityRowAction" | "formatToolbar" | "formatToolbarIcon"
    | "giftCard" | "headerUpsell" | "icon" | "iconCircle"
    | "iconCircleSm" | "iconLarge" | "iconMd" | "iconSm"
    | "imageToolbar" | "inline" | "inputControl" | "inputIcon"
    | "inputSegment" | "inputSelect" | "large" | "medium" | "menuRow"
    | "paginationDot" | "panelAction" | "promotionalAction"
    | "promotionalLink" | "settingsSelect" | "shareDestination"
    | "surveyOption" | "tabStripAction" | "toolbar";
  export interface ButtonProps extends Record<string, unknown> {
    as?: "a" | "button";
    allowShrink?: boolean;
    children?: unknown;
    className?: string;
    color?: ButtonColor;
    contentLayout?: "balanced" | "default";
    disabled?: boolean;
    focusRing?: "default" | "inset" | "none";
    href?: string;
    loading?: boolean;
    radius?: "default" | "extraLarge" | "full" | "large" | "small";
    size?: ButtonSize;
    spinnerVariant?: "default" | "rays";
    type?: "button" | "reset" | "submit";
    uniform?: boolean;
  }
  export interface LoadingSpinnerProps extends Record<string, unknown> {
    animationDurationMs?: number;
    className?: string;
    containerClassName?: string;
    variant?: "default" | "rays";
  }
  export const Qh: (props: LoadingSpinnerProps) => unknown;
  export const Xh: (props: Omit<ButtonProps, "as">) => unknown;
  export const Yh: (props: ButtonProps) => unknown;
  /** Outbound identity provider brand icon assets. */
  export const Bt: IconAssetPreset;
  export const Vt: IconAssetPreset;
  export const an: IconAssetPreset;
  /** initializeChevronAsset（面包屑分隔符资源初始化器）。 */
  export const Xd: () => void;
  /** initializeButton（app-shared/ui/button.ts，内部 c8）。 */
  export const Zh: () => void;
  export interface MoreButtonClickEvent {
    stopPropagation(): void;
  }
  export interface MoreButtonProps
    extends Omit<
      ButtonProps,
      "children" | "color" | "onClick" | "size" | "uniform"
    > {
    label: string;
    onClick?: (event: MoreButtonClickEvent) => void;
    size?: ButtonSize;
    iconClassName?: string;
    uniform?: boolean;
  }
  /** MoreButton（app-shared/ui/more-button.ts，内部 q_t）。 */
  export const gu: (props: MoreButtonProps) => unknown;
  /** initializeMoreButton（内部 X_t）。 */
  export const _u: () => void;
  export type AlertLevel = "info" | "success" | "warning" | "danger";
  export type AlertVariant = "default" | "successNeutral" | "dangerSolid";
  export interface AlertIconProps {
    className?: string;
  }
  export interface AlertProps {
    actions?: unknown;
    actionsInline?: boolean;
    announce?: boolean;
    className?: string;
    level?: AlertLevel;
    fullWidth?: boolean;
    children?: unknown;
    icon?: (props: AlertIconProps) => unknown;
    leading?: unknown;
    onRemove?: (event: unknown) => void;
    richColors?: boolean;
    testId?: string;
    variant?: AlertVariant;
  }
  /** Alert（app-shared/ui/alert.ts，内部 Ilt）。 */
  export const om: (props: AlertProps) => unknown;
  /** initializeAlert（内部 Rlt）。 */
  export const sm: () => void;
  export interface ToastAction {
    label: unknown;
    loading?: boolean;
    onClick(): void;
  }
  export interface ToastProps {
    description?: unknown;
    leading?: unknown;
    level: AlertLevel;
    onClose?: (event: unknown) => void;
    primaryAction?: ToastAction;
    secondaryAction?: ToastAction;
    testId?: string;
    title?: unknown;
    variant?: AlertVariant;
  }
  /** initializeToastStyles（app-shared/ui/toast.ts，内部 Ult）。 */
  export const im: () => void;
  /** Toast（内部 Wlt）。 */
  export const nm: (props: ToastProps) => unknown;
  /** initializeToast（内部 qlt）。 */
  export const rm: () => void;
  /** useIsMounted（app-shared/runtime/mounted-state.ts，内部 Spt）。 */
  const useIsMounted: () => () => boolean;
  export { useIsMounted as if };
  /** initializeMountedState（内部 Tpt）。 */
  export const rf: () => void;
  export interface SandboxPartitionOptions {
    persist?: boolean;
  }
  export interface SandboxOriginOptions {
    requireSkybridge?: boolean;
  }
  export interface SandboxEntryUrlOptions {
    locale: string;
    scheme?: "https" | "codex-sandbox";
    subdomain: string;
  }
  export interface SandboxInitializationOptions {
    initId: string;
    sandboxId: string;
    sourceUrl: string;
  }
  export type ResourceActivity = "read" | "created" | "updated";
  export interface SandboxResourceActivity {
    id: string;
    url: string;
    title?: string;
    mimeType?: string;
    activities: ResourceActivity[];
  }
  export type SandboxResourceActivitiesResult =
    | { status: "absent" }
    | { status: "invalid" }
    | { status: "valid"; resources: SandboxResourceActivity[] };
  /** getSandboxResourceUri（app-shared/runtime/sandbox-url.ts，内部 pVe）。 */
  export const QH: (metadata: unknown) => string | null;
  /** areSandboxMethodsAllowed（内部 _Ve）。 */
  export const JH: (methods: readonly unknown[]) => boolean;
  /** createSandboxEntryUrl（内部 SVe）。 */
  export const WH: (options: SandboxEntryUrlOptions) => string;
  /** attachSandboxInitialization（内部 wVe）。 */
  export const UH: (options: SandboxInitializationOptions) => string;
  /** getSandboxInitId（内部 TVe）。 */
  export const GH: (value?: string | null) => string | null;
  /** parseSandboxResourceActivities（内部 MVe）。 */
  export const RH: (
    metadata: unknown,
  ) => SandboxResourceActivitiesResult;
  /** createSandboxPartition（app-shared/runtime/sandbox-url.ts，内部 xVe）。 */
  export const KH: (
    sandboxId: string,
    options?: SandboxPartitionOptions,
  ) => string;
  /** getTrustedSandboxOrigin（内部 CVe）。 */
  export const qH: (
    value: string | URL,
    options?: SandboxOriginOptions,
  ) => string | null;
  /** initializeSandboxUrls（内部 XV）。 */
  export const YH: () => void;
  /** initializeErrorValueToString（app-shared/runtime/error-rate-limit.ts，内部 zVe）。 */
  export const FH: () => void;
  /** errorValueToString（内部 RVe）。 */
  export const IH: (value: unknown) => string | undefined;
  export interface MinimumIntervalGateOptions {
    minIntervalMs: number;
  }
  export interface MinimumIntervalGate {
    readonly minIntervalMs: number;
    canPass(now?: number): boolean;
    mark(now?: number): void;
    tryPass(now?: number): boolean;
  }
  export interface MinimumIntervalGateConstructor {
    new (options: MinimumIntervalGateOptions): MinimumIntervalGate;
  }
  /** MinimumIntervalGate（内部 BVe）。 */
  export const NH: MinimumIntervalGateConstructor;
  /** initializeMinimumIntervalGate（内部 QV）。 */
  export const PH: () => void;
  export interface PathValue {
    path: string;
  }
  export interface PreviewablePathValue extends PathValue {
    fsPath?: string;
    startLine?: number | null;
  }
  /** isDirectoryPath（app-shared/runtime/file-predicates.ts，内部 GBe）。 */
  export const bU: (value: PathValue) => boolean;
  /** isRichFilePath（内部 KBe）。 */
  export const xU: (value: PreviewablePathValue) => boolean;
  /** isMissingFileError（内部 JBe）。 */
  export const _U: (value: unknown) => boolean;
  /** initializeMissingFileError（内部 IV）。 */
  export const gU: () => void;
  /** isLibraryFileId（内部 XBe）。 */
  export const hU: (value: string) => boolean;
  /** initializeLibraryFileId（内部 ZBe）。 */
  export const mU: () => void;
  export type WorktreeUpstreamRefreshMode = "never" | "best-effort";
  export interface GlobalStateSetting<T> {
    agentAccess: "hidden" | "read-write";
    default: T;
    description: string;
    hostStorage: { kind: "global-state"; key: string };
    key: string;
    schema: import("zod").ZodType<T>;
  }
  export interface WorktreeSettings {
    upstreamRefreshMode: GlobalStateSetting<WorktreeUpstreamRefreshMode>;
    autoCleanupEnabled: GlobalStateSetting<boolean>;
    keepCount: GlobalStateSetting<number>;
  }
  export interface ResolvedWorktreeSettings {
    worktreesRoot: string;
    autoCleanupEnabled: boolean;
    keepCount: number;
  }
  /** worktreeSettings（app-shared/runtime/worktree-settings.ts，内部 MV）。 */
  export const TU: WorktreeSettings;
  /** initializeWorktreeSettings（内部 NV）。 */
  export const wU: () => void;
  /** resolveWorktreeSettings（内部 WBe）。 */
  export const SU: (
    values?: Readonly<Record<string, unknown>> | null,
  ) => ResolvedWorktreeSettings;
  /** initializeGitAndWorktreeSettings（内部 PV）。 */
  export const CU: () => void;
  export type PullRequestMergeMethod = "merge" | "squash";
  export type GitReviewMode = "full" | "last-turn-only";
  export type GitSettingAgentAccess = "read-write" | "read-only";
  export interface GitGlobalStateSetting<TDefault, TStored = TDefault> {
    agentAccess: GitSettingAgentAccess;
    default: TDefault;
    description: string;
    hostStorage: { kind: "global-state"; key: string };
    key: string;
    schema: import("zod").ZodType<TStored>;
  }
  export interface GitSettings {
    branchPrefix: GitGlobalStateSetting<string>;
    alwaysForcePush: GitGlobalStateSetting<boolean>;
    createPullRequestAsDraft: GitGlobalStateSetting<boolean>;
    pullRequestMergeMethod: GitGlobalStateSetting<PullRequestMergeMethod>;
    reviewMode: GitGlobalStateSetting<GitReviewMode>;
    showSidebarPrIcons: GitGlobalStateSetting<boolean | undefined, boolean>;
    worktreeRoot: GitGlobalStateSetting<string>;
    commitInstructions: GitGlobalStateSetting<string>;
    pullRequestInstructions: GitGlobalStateSetting<string>;
    pullRequestWatchAutoMerge: GitGlobalStateSetting<boolean>;
    pullRequestWatchInstructions: GitGlobalStateSetting<string>;
  }
  /** gitSettings（app-shared/runtime/git-settings.ts，内部 AV）。 */
  export const EU: GitSettings;
  /** initializeGitSettings（内部 jV）。 */
  export const DU: () => void;
  export interface AmbientSuggestionSetting<T> {
    agentAccess: "read-write";
    default: T;
    description: string;
    hostStorage: { kind: "global-state"; key: string };
    key: string;
    schema: import("zod").ZodType<T>;
  }
  export interface AmbientSuggestionSettings {
    enabled: AmbientSuggestionSetting<boolean>;
  }
  /** ambientSuggestionSettings（app-shared/runtime/ambient-suggestion-settings.ts，内部 _U）。 */
  export const Tz: AmbientSuggestionSettings;
  /** initializeAmbientSuggestionSettings（内部 vU）。 */
  export const Ez: () => void;
  export type CheckboxState = boolean | "indeterminate";
  export type CheckboxVariant = "default" | "secondary" | "overlay" | "checklist";
  export interface CheckboxClickEvent {
    defaultPrevented?: boolean;
  }
  export interface CheckboxProps extends Record<string, unknown> {
    checked?: CheckboxState;
    className?: string;
    defaultChecked?: CheckboxState;
    disabled?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    onClick?: (event: CheckboxClickEvent) => void;
    variant?: CheckboxVariant;
  }
  /** Checkbox（app-shared/ui/checkbox.ts，内部 Nmt）。 */
  export const Ad: (props: CheckboxProps) => unknown;
  /** initializeCheckbox（内部 Imt）。 */
  export const jd: () => void;
  export type LazyComponent<Props extends Record<string, unknown>> = (
    props: Props,
  ) => unknown;
  export interface LazyComponentOptions<Props extends Record<string, unknown>> {
    errorFallback?: unknown | LazyComponent<Props>;
    fallback?: unknown;
    propagateLoadError?: boolean;
    suspendToParent?: boolean;
  }
  /** createLazyComponent（app-shared/ui/lazy-component.ts，内部 cct）。 */
  export const Jm: <Props extends Record<string, unknown>>(
    load: () => Promise<LazyComponent<Props>>,
    options?: LazyComponentOptions<Props>,
  ) => LazyComponent<Props>;
  /** initializeLazyComponent（内部 sct）。 */
  export const Xm: () => void;
  export const Ym: (text: string, event?: unknown) => void;
  export interface QueryOptionsShape {
    queryKey: readonly unknown[];
  }
  export interface InfiniteQueryOptionsShape extends QueryOptionsShape {
    initialPageParam: unknown;
  }
  /** queryOptions（app-shared/runtime/query-options.ts，内部 eJe）。 */
  export const pL: <Options extends QueryOptionsShape>(options: Options) => Options;
  /** initializeQueryOptions（内部 tJe）。 */
  export const fL: () => void;
  /** infiniteQueryOptions（内部 nJe）。 */
  export const uL: <Options extends InfiniteQueryOptionsShape>(options: Options) => Options;
  /** initializeInfiniteQueryOptions（内部 rJe）。 */
  export const dL: () => void;
  /** mutationOptions（内部 fJe）。 */
  export const nL: <Options extends Record<string, unknown>>(options: Options) => Options;
  /** initializeMutationOptions（内部 pJe）。 */
  export const tL: () => void;
  export interface QueryFunctionContext<
    QueryKey extends readonly unknown[] = readonly unknown[],
  > {
    queryKey: QueryKey;
    signal: AbortSignal;
    meta?: Record<string, unknown>;
  }
  export interface UseQueryOptions<
    QueryFnData,
    QueryError = Error,
    Data = QueryFnData,
    QueryKey extends readonly unknown[] = readonly unknown[],
  > extends Record<string, unknown> {
    queryKey: QueryKey;
    queryFn?: (
      context: QueryFunctionContext<QueryKey>,
    ) => Promise<QueryFnData> | QueryFnData;
    enabled?: boolean | ((query: unknown) => boolean);
    select?: (data: QueryFnData) => Data;
    throwOnError?: boolean | ((error: QueryError, query: unknown) => boolean);
  }
  export interface UseQueryResult<Data, QueryError = Error> {
    data: Data | undefined;
    error: QueryError | null;
    isError: boolean;
    isFetching: boolean;
    isLoading: boolean;
    isPending: boolean;
    isSuccess: boolean;
    refetch(options?: { cancelRefetch?: boolean }): Promise<UseQueryResult<Data, QueryError>>;
    status: "error" | "pending" | "success";
  }
  export interface MutationFunctionContext {
    client: unknown;
    meta?: Record<string, unknown>;
    mutationKey?: readonly unknown[];
  }
  export interface MutationCallbacks<Data, MutationError, Variables, Context> {
    onError?(
      error: MutationError,
      variables: Variables,
      context: Context | undefined,
      mutation: MutationFunctionContext,
    ): Promise<unknown> | unknown;
    onSettled?(
      data: Data | undefined,
      error: MutationError | null,
      variables: Variables,
      context: Context | undefined,
      mutation: MutationFunctionContext,
    ): Promise<unknown> | unknown;
    onSuccess?(
      data: Data,
      variables: Variables,
      context: Context | undefined,
      mutation: MutationFunctionContext,
    ): Promise<unknown> | unknown;
  }
  export interface UseMutationOptions<
    Data,
    MutationError = Error,
    Variables = void,
    Context = unknown,
  > extends MutationCallbacks<Data, MutationError, Variables, Context>,
      Record<string, unknown> {
    mutationFn?: (
      variables: Variables,
      context: MutationFunctionContext,
    ) => Promise<Data> | Data;
    mutationKey?: readonly unknown[];
    onMutate?(
      variables: Variables,
      context: MutationFunctionContext,
    ): Promise<Context> | Context;
  }
  export type MutationArguments<Variables, Callbacks> = Variables extends void
    ? [variables?: Variables, callbacks?: Callbacks]
    : [variables: Variables, callbacks?: Callbacks];
  export interface UseMutationResult<
    Data,
    MutationError = Error,
    Variables = void,
    Context = unknown,
  > {
    data: Data | undefined;
    error: MutationError | null;
    isError: boolean;
    isIdle: boolean;
    isPending: boolean;
    isSuccess: boolean;
    mutate(
      ...arguments_: MutationArguments<
        Variables,
        MutationCallbacks<Data, MutationError, Variables, Context>
      >
    ): void;
    mutateAsync(
      ...arguments_: MutationArguments<
        Variables,
        MutationCallbacks<Data, MutationError, Variables, Context>
      >
    ): Promise<Data>;
    reset(): void;
    status: "error" | "idle" | "pending" | "success";
    variables: Variables | undefined;
  }
  /** useQuery（app-shared 内嵌 QueryObserver，内部 Xqe）。 */
  export const _L: <
    QueryFnData,
    QueryError = Error,
    Data = QueryFnData,
    QueryKey extends readonly unknown[] = readonly unknown[],
  >(
    options: UseQueryOptions<QueryFnData, QueryError, Data, QueryKey>,
    queryClient?: unknown,
  ) => UseQueryResult<Data, QueryError>;
  /** initializeUseQuery（内部 Zqe）。 */
  export const gL: () => void;
  /** initializeDynamicConfiguration（feature experiment 配置依赖）。 */
  export const D: () => void;
  /** initializeDialogRuntime（对话框基础依赖）。 */
  export const I: () => void;
  /** useMutation（app-shared 内嵌 MutationObserver，内部 uJe）。 */
  export const iL: <
    Data,
    MutationError = Error,
    Variables = void,
    Context = unknown,
  >(
    options: UseMutationOptions<Data, MutationError, Variables, Context>,
    queryClient?: unknown,
  ) => UseMutationResult<Data, MutationError, Variables, Context>;
  /** initializeUseMutation（内部 dJe）。 */
  export const rL: () => void;
  export type AppgenInteractionSource =
    | "CODEX_APPGEN_INTERACTION_SOURCE_UNSPECIFIED"
    | "CODEX_APPGEN_INTERACTION_SOURCE_SITES"
    | "CODEX_APPGEN_INTERACTION_SOURCE_LIBRARY"
    | "CODEX_APPGEN_INTERACTION_SOURCE_SITE_DETAILS"
    | "CODEX_APPGEN_INTERACTION_SOURCE_AT_MENTION"
    | "CODEX_APPGEN_INTERACTION_SOURCE_RESPONSE_CARD"
    | "UNRECOGNIZED";
  export interface AppgenInteractionSources {
    readonly CODEX_APPGEN_INTERACTION_SOURCE_UNSPECIFIED:
      "CODEX_APPGEN_INTERACTION_SOURCE_UNSPECIFIED";
    readonly CODEX_APPGEN_INTERACTION_SOURCE_SITES:
      "CODEX_APPGEN_INTERACTION_SOURCE_SITES";
    readonly CODEX_APPGEN_INTERACTION_SOURCE_LIBRARY:
      "CODEX_APPGEN_INTERACTION_SOURCE_LIBRARY";
    readonly CODEX_APPGEN_INTERACTION_SOURCE_SITE_DETAILS:
      "CODEX_APPGEN_INTERACTION_SOURCE_SITE_DETAILS";
    readonly CODEX_APPGEN_INTERACTION_SOURCE_AT_MENTION:
      "CODEX_APPGEN_INTERACTION_SOURCE_AT_MENTION";
    readonly CODEX_APPGEN_INTERACTION_SOURCE_RESPONSE_CARD:
      "CODEX_APPGEN_INTERACTION_SOURCE_RESPONSE_CARD";
    readonly UNRECOGNIZED: "UNRECOGNIZED";
  }
  /** appgenInteractionSources（app-shared/runtime/appgen-interaction-source.ts，内部 wq）。 */
  export const Hk: AppgenInteractionSources;
  export type AppgenInteractionAction =
    | "CODEX_APPGEN_INTERACTION_ACTION_UNSPECIFIED"
    | "CODEX_APPGEN_INTERACTION_ACTION_CREATE_SITE_CLICKED"
    | "CODEX_APPGEN_INTERACTION_ACTION_EDIT_WITH_CHAT_CLICKED"
    | "CODEX_APPGEN_INTERACTION_ACTION_ANALYTICS_OPENED"
    | "CODEX_APPGEN_INTERACTION_ACTION_SETTINGS_OPENED"
    | "CODEX_APPGEN_INTERACTION_ACTION_PAGE_VIEWED"
    | "CODEX_APPGEN_INTERACTION_ACTION_MENTION_SUGGESTIONS_LOADED"
    | "UNRECOGNIZED";
  export interface AppgenInteractionActions {
    readonly CODEX_APPGEN_INTERACTION_ACTION_UNSPECIFIED:
      "CODEX_APPGEN_INTERACTION_ACTION_UNSPECIFIED";
    readonly CODEX_APPGEN_INTERACTION_ACTION_CREATE_SITE_CLICKED:
      "CODEX_APPGEN_INTERACTION_ACTION_CREATE_SITE_CLICKED";
    readonly CODEX_APPGEN_INTERACTION_ACTION_EDIT_WITH_CHAT_CLICKED:
      "CODEX_APPGEN_INTERACTION_ACTION_EDIT_WITH_CHAT_CLICKED";
    readonly CODEX_APPGEN_INTERACTION_ACTION_ANALYTICS_OPENED:
      "CODEX_APPGEN_INTERACTION_ACTION_ANALYTICS_OPENED";
    readonly CODEX_APPGEN_INTERACTION_ACTION_SETTINGS_OPENED:
      "CODEX_APPGEN_INTERACTION_ACTION_SETTINGS_OPENED";
    readonly CODEX_APPGEN_INTERACTION_ACTION_PAGE_VIEWED:
      "CODEX_APPGEN_INTERACTION_ACTION_PAGE_VIEWED";
    readonly CODEX_APPGEN_INTERACTION_ACTION_MENTION_SUGGESTIONS_LOADED:
      "CODEX_APPGEN_INTERACTION_ACTION_MENTION_SUGGESTIONS_LOADED";
    readonly UNRECOGNIZED: "UNRECOGNIZED";
  }
  export type SwitchSize = "default" | "sm";
  export type SwitchTone = "accent" | "neutral";
  export interface SwitchEvent {
    defaultPrevented?: boolean;
    preventDefault?(): void;
    stopPropagation?(): void;
  }
  export interface SwitchProps extends Record<string, unknown> {
    checked: boolean;
    onChange(checked: boolean): void;
    disabled?: boolean;
    className?: string;
    id?: string;
    ariaLabel?: string;
    size?: SwitchSize;
    tone?: SwitchTone;
    trackClassName?: string;
    thumbClassName?: string;
    onClick?: (event: SwitchEvent) => void;
  }
  /** Switch（app-shared/ui/switch.ts，内部 Kdt）。 */
  export const Lf: (props: SwitchProps) => unknown;
  /** initializeSwitch（内部 Zdt）。 */
  export const Rf: () => void;
  export const nf: () => void;
  export const on: () => void;
  export const tf: (props: Record<string, unknown>) => unknown;
  export const zt: () => void;
  export const Ht: () => void;
  export type SettingsRowVariant =
    | "default" | "featured" | "recommendation" | "stacked" | "nested";
  export type SettingsRowSize = "default" | "compact";
  export interface SettingsControlAriaProps {
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
  }
  export type SettingsControl =
    | ((props: SettingsControlAriaProps) => unknown)
    | string
    | number
    | bigint
    | boolean
    | symbol
    | object
    | null;
  export interface SettingsRowProps {
    label?: unknown;
    labelSizing?: "grow" | "fixed";
    description?: unknown;
    control?: SettingsControl;
    icon?: unknown;
    className?: string;
    id?: string;
    size?: SettingsRowSize;
    variant?: SettingsRowVariant;
    verticalAlignment?: "center" | "start";
  }
  export interface SettingsDescriptionProps {
    children?: unknown;
  }
  export interface SettingsFieldRowProps {
    children?: unknown;
    compactLabelInset?: boolean;
    label?: unknown;
    valueAlignment?: "start" | "end";
    variant?: "default" | "compact";
  }
  export interface SettingsActionRowProps {
    actions?: unknown;
    ariaLabel?: string;
    className?: string;
    description?: unknown;
    disabled?: boolean;
    edgeRounding?: "row" | "none";
    icon?: unknown;
    label?: unknown;
    onClick?: (event: unknown) => void;
    onFocus?: (event: unknown) => void;
    onPointerEnter?: (event: unknown) => void;
    trailing?: unknown;
    variant?: "default" | "recommendation" | "nested";
  }
  /** initializeSettingsRows（app-shared/ui/settings-row.ts，内部 myt）。 */
  export const al: () => void;
  /** SettingsDescription（内部 lyt）。 */
  export const il: (props: SettingsDescriptionProps) => unknown;
  /** SettingsFieldRow（内部 dyt）。 */
  export const nl: (props: SettingsFieldRowProps) => unknown;
  /** SettingsRow（内部 cyt）。 */
  export const rl: (props: SettingsRowProps) => unknown;
  /** SettingsActionRow（内部 uyt）。 */
  export const tl: (props: SettingsActionRowProps) => unknown;
  export type SettingsGroupOverflow = "hidden" | "visible";
  export type SettingsGroupVariant =
    | "default"
    | "metered"
    | "secondary"
    | "form"
    | "recommendation";
  export type SettingsGroupDecoration = "daybreak";
  export interface SettingsGroupProps {
    children?: unknown;
    className?: string;
    contentOverflow?: SettingsGroupOverflow;
    dividers?: boolean;
    variant?: SettingsGroupVariant;
    decoration?: SettingsGroupDecoration;
  }
  /** settingsDividerClassName（app-shared/ui/settings-group.ts，内部 hyt）。 */
  export const $c: string;
  /** initializeSettingsDividers（内部 gyt）。 */
  export const el: () => void;
  /** SettingsGroup（内部 byt）。 */
  export const Zc: (props: SettingsGroupProps) => unknown;
  /** initializeSettingsGroup（内部 Cyt）。 */
  export const Qc: () => void;
  export interface StylePropertyMap {
    getPropertyValue(name: string): string;
    removeProperty(name: string): string;
    setProperty(name: string, value: string): void;
  }
  export interface StylePropertyTarget {
    style: StylePropertyMap;
  }
  export type StylePropertyValues = Record<
    string,
    string | null | undefined
  >;
  /** syncStyleProperties（app-shared/ui/dom-style.ts，内部 wyt）。 */
  export const Yc: (
    element: StylePropertyTarget,
    properties: StylePropertyValues,
  ) => void;
  /** initializeStylePropertySync（内部 Tyt）。 */
  export const Xc: () => void;
  /** initializeStylePropertyRuntime（内部 Eyt）。 */
  export const Jc: () => void;
  export interface DialogLayoutProps extends Record<string, unknown> {
    children?: unknown;
    className?: string;
  }
  export type DialogSize =
    | "default" | "large" | "narrow" | "feature" | "catalogDetail"
    | "beacon" | "compact" | "wide" | "share" | "feedback"
    | "xwide" | "xwideTall" | "xxwide" | "xxxwideTall"
    | "editor" | "square" | "sheet";
  export type DialogVariant =
    | "default" | "chatgpt" | "beacon" | "beaconModal"
    | "promotional" | "catalog" | "centeredText";
  export interface DialogProps extends Record<string, unknown> {
    children?: unknown;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    modal?: boolean;
    triggerContent?: unknown;
    triggerAsChild?: boolean;
    triggerRef?: unknown;
    contentClassName?: string;
    contentOverflow?: "hidden" | "visible";
    contentPosition?: "centered" | "inline";
    contentProps?: Record<string, unknown>;
    dialogCloseClassName?: string;
    closeButtonSize?: "default" | "large";
    dialogCloseLabel?: string;
    headerActions?: unknown;
    overlayClassName?: string;
    portalContainer?: unknown;
    radius?: "default" | "compact";
    showDialogClose?: boolean;
    shouldIgnoreClickOutside?: boolean;
    shouldStopPointerDownPropagation?: boolean;
    unstyledContent?: boolean;
    viewportSized?: boolean;
    variant?: DialogVariant;
    size?: DialogSize;
  }
  export interface DialogHeaderProps extends DialogLayoutProps {
    icon?: unknown;
    iconClassName?: string;
    iconBackgroundClassName?: string;
    title?: unknown;
    titleSize?: "dialog" | "lg" | "base" | "sm";
    titleClassName?: string;
    subtitle?: unknown;
    subtitleSize?: "base" | "sm";
    subtitleTone?: "secondary" | "tertiary";
    subtitleClassName?: string;
  }
  export interface DialogBodyProps extends DialogLayoutProps {
    as?: "div" | "form";
    size?: "viewport" | "full" | "tall";
    variant?: "default" | string;
  }
  export interface DialogFooterProps extends DialogLayoutProps {
    expandSingleButton?: boolean;
  }
  export interface DialogSectionProps extends DialogLayoutProps {
    spacing?: "default" | "large";
  }
  /** DialogHeader（app-shared/ui/dialog-layout.ts，内部 Xot）。 */
  export const Ah: (props: DialogHeaderProps) => unknown;
  /** Dialog（内部 Vot）。 */
  export const Ih: (props: DialogProps) => unknown;
  /** DialogTitle（内部 Hot）。 */
  export const Rh: (
    props: DialogLayoutProps & { variant?: DialogVariant },
  ) => unknown;
  /** DialogDescription（内部 Uot）。 */
  export const Lh: (props: DialogLayoutProps) => unknown;
  /** initializeDialog（内部 Jot）。 */
  export const zh: () => void;
  /** DialogBody（内部 Zot）。 */
  export const Oh: (props: DialogBodyProps) => unknown;
  /** DialogFooter（内部 Qot）。 */
  export const kh: (props: DialogFooterProps) => unknown;
  /** DialogSection（内部 est）。 */
  export const jh: (props: DialogSectionProps) => unknown;
  /** DialogFormRow（内部 tst）。 */
  export const Nh: (props: DialogLayoutProps) => unknown;
  /** DialogFieldStack（内部 nst）。 */
  export const Mh: (props: DialogLayoutProps) => unknown;
  /** initializeDialogLayout（内部 ost）。 */
  export const Ph: () => void;
  /** Dialog actions 的标准 footer class。 */
  export const Dh: string;
  /** Error / minus / success 状态图标。 */
  export const Lo: (props: Record<string, unknown>) => unknown;
  export const Ud: (props: Record<string, unknown>) => unknown;
  export const wc: (props: Record<string, unknown>) => unknown;
  export const Qc: () => void;
  export const Wd: () => void;
  export const Ro: () => void;
  /** Motion 与 check-control 初始化器。 */
  export const Tc: () => void;
  export const a$: () => void;
  /** AnimatePresence 与 motion 初始化面。 */
  export const d$: (props: Record<string, unknown>) => unknown;
  export const f$: () => void;
  export const YQ: () => void;
  /** prefers-reduced-motion hook。 */
  export const XQ: () => boolean | null;
  export const xD: () => void;
  /** Menu 当前选中项的 check icon asset。 */
  export const bD: IconAssetPreset;
  export interface ReactRef<T> {
    current: T;
  }
  export interface ReactRuntime {
    Children: {
      map<T, R>(children: T | readonly T[], mapper: (child: T) => R): R[];
      toArray(children: unknown): unknown[];
    };
    Fragment: unknown;
    createElement(
      component: unknown,
      props: Record<string, unknown>,
    ): unknown;
    createContext<T>(defaultValue: T): { Provider: unknown; Consumer: unknown };
    useContext<T>(context: unknown): T;
    lazy<Props extends Record<string, unknown>>(
      loader: () => Promise<{ default: (props: Props) => unknown }>,
    ): (props: Props) => unknown;
    use<T>(context: unknown): T;
    useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
    useEffectEvent?<Callback extends (...args: never[]) => unknown>(callback: Callback): Callback;
    useInsertionEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
    useCallback<Callback extends (...arguments_: never[]) => unknown>(
      callback: Callback,
      dependencies: readonly unknown[],
    ): Callback;
    useId(): string;
    useLayoutEffect(
      effect: () => void | (() => void),
      dependencies?: readonly unknown[],
    ): void;
    useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T;
    useRef<T>(initialValue: T): ReactRef<T>;
    useState<T>(initialValue: T | (() => T)): [T, (value: T | ((current: T) => T)) => void];
    useSyncExternalStore<Snapshot>(
      subscribe: (listener: () => void) => () => void,
      getSnapshot: () => Snapshot,
      getServerSnapshot?: () => Snapshot,
    ): Snapshot;
    [key: string]: unknown;
  }
  // React 兼容导出（e6 为可延迟初始化、也可直接访问的 React 模块命名空间）。
  export const e6: (() => ReactRuntime) & ReactRuntime;
  // virtualized-turn-list 消费的压缩导出面（语义见该模块头注释）：
  /** initializeJsxRuntimeLazy（rolldown lazy 辅助）。 */
  export const $3: () => void;
  /** Multi-agent Home banner analytics events. */
  export const AM: unknown;
  export const OM: unknown;
  export const kM: unknown;
  /** initializeIntlRuntime（localized banner/message 基础设施）。 */
  export const fI: () => void;
  /** initializeMountedState（mounted callback hook 依赖）。 */
  export const AT: () => void;
  export const $h: () => void; // i8：资源按钮依赖初始化器
  export const $r: () => void; // Rwt：skills-light-16 图标初始化器
  export const $K: string;
  export const $O: {
    FIVE_SECONDS: number;
    FIVE_MINUTES: number;
    INFINITE: number;
    ONE_MINUTE: number;
    THIRTY_SECONDS: number;
  };
  export type QueryKey = readonly unknown[];
  /** hashQueryKey（app-shared/runtime/query-structural-utils.ts）。 */
  export const AZ: (queryKey: QueryKey) => string;
  export const Am: {
    kind: "browser";
    loadDetachedRenderer(): Promise<unknown>;
  }; // alt：分离窗口的 browser 内容渲染器
  export const BI: (path: string) => string; // wJe：路径规范化后转小写
  export const BK: (path: string) => boolean; // Rz：是否为绝对路径
  export interface QueryReadOptions {
    enabled?: boolean;
  }
  export interface SubscribableSignal<T> {
    get(): T;
    subscribe(listener: () => void): () => void;
  }
  export interface BoundAtomSignal<T> {
    atom: unknown;
    store: {
      get(atom: unknown): T;
      sub(atom: unknown, listener: () => void): () => void;
    };
  }
  export type ReadableSignal<T> =
    | BoundAtomSignal<T>
    | SubscribableSignal<T>
    | ScopedSignal<unknown, T>
    | ScopedDerivedSignal<unknown, T>
    | ScopedExternalSignal<unknown, T>
    | T;
  export interface CallableSignalFamily<Param, T> {
    (parameter: Param): ReadableSignal<T>;
  }
  export type SignalFamily<Param, T> =
    | CallableSignalFamily<Param, T>
    | ScopedDerivedFamily<unknown, Param, T>
    | ScopedExternalSignalFamily<unknown, Param, T>
    | ScopedMutationFamily<unknown, Param, unknown, unknown, unknown, unknown>
    | ScopedQueryFamily<unknown, Param, unknown, unknown>
    | ScopedInfiniteQueryFamily<unknown, Param, unknown, unknown, unknown>
    | ScopedSignalFamily<unknown, Param, T>;
  /** useSignalFamilyValue（app-shared/runtime/atom-signal.ts）。 */
  export const BX: {
    <Param, Data, QueryError>(
      family: ScopedQueryFamily<unknown, Param, Data, QueryError>,
      parameter: Param,
      options?: QueryReadOptions,
    ): ScopedQueryResult<Data, QueryError>;
    <Param, Page, PageParam, QueryError>(
      family: ScopedInfiniteQueryFamily<unknown, Param, Page, PageParam, QueryError>,
      parameter: Param,
      options?: QueryReadOptions,
    ): ScopedInfiniteQueryResult<Page, PageParam, QueryError>;
    <Param, Data, MutationError, Variables, Context>(
      family: ScopedMutationFamily<unknown, Param, Data, MutationError, Variables, Context>,
      parameter: Param,
      options?: QueryReadOptions,
    ): ScopedMutationResult<Data, MutationError, Variables, Context>;
    <Param, T>(
      family: SignalFamily<Param, T>,
      parameter: Param,
      options?: QueryReadOptions,
    ): T;
  };
  /** useSignalFamilyMember（app-shared/runtime/atom-signal.ts，内部 uMe）。 */
  export const zX: {
    <Param, Data, QueryError>(
      family: ScopedQueryFamily<unknown, Param, Data, QueryError>,
      parameter: Param,
    ): BoundAtomSignal<ScopedQueryResult<Data, QueryError>>;
    <Param, Page, PageParam, QueryError>(
      family: ScopedInfiniteQueryFamily<unknown, Param, Page, PageParam, QueryError>,
      parameter: Param,
    ): BoundAtomSignal<ScopedInfiniteQueryResult<Page, PageParam, QueryError>>;
    <Param, Data, MutationError, Variables, Context>(
      family: ScopedMutationFamily<unknown, Param, Data, MutationError, Variables, Context>,
      parameter: Param,
    ): BoundAtomSignal<ScopedMutationResult<Data, MutationError, Variables, Context>>;
    <Param, T>(
      family: SignalFamily<Param, T>,
      parameter: Param,
    ): ReadableSignal<T>;
  };
  /** appgenInteractionActions（app-shared/runtime/appgen-interaction-action.ts，内部 bq）。 */
  export const Bk: AppgenInteractionActions;
  export type AppgenInteractionPage =
    | "CODEX_APPGEN_INTERACTION_PAGE_UNSPECIFIED"
    | "CODEX_APPGEN_INTERACTION_PAGE_ANALYTICS"
    | "CODEX_APPGEN_INTERACTION_PAGE_SETTINGS"
    | "CODEX_APPGEN_INTERACTION_PAGE_DATABASE"
    | "UNRECOGNIZED";
  export interface AppgenInteractionPages {
    readonly CODEX_APPGEN_INTERACTION_PAGE_UNSPECIFIED:
      "CODEX_APPGEN_INTERACTION_PAGE_UNSPECIFIED";
    readonly CODEX_APPGEN_INTERACTION_PAGE_ANALYTICS:
      "CODEX_APPGEN_INTERACTION_PAGE_ANALYTICS";
    readonly CODEX_APPGEN_INTERACTION_PAGE_SETTINGS:
      "CODEX_APPGEN_INTERACTION_PAGE_SETTINGS";
    readonly CODEX_APPGEN_INTERACTION_PAGE_DATABASE:
      "CODEX_APPGEN_INTERACTION_PAGE_DATABASE";
    readonly UNRECOGNIZED: "UNRECOGNIZED";
  }
  /** appgenInteractionPages（app-shared/runtime/appgen-interaction-page.ts，内部 Cq）。 */
  export const Vk: AppgenInteractionPages;
  export type KnownServiceTierKind = "fast" | "ultrafast";
  export interface ModelServiceTier extends Record<string, unknown> {
    id: string;
    name?: string;
  }
  export interface ServiceTierModel extends Record<string, unknown> {
    defaultServiceTier?: string | null;
    serviceTiers?: readonly ModelServiceTier[] | null;
  }
  /** PRIORITY_SERVICE_TIER（app-shared/runtime/service-tiers.ts，内部 tKe）。 */
  export const Dz: "priority";
  /** FAST_SERVICE_TIER（内部 nKe）。 */
  export const Oz: "fast";
  /** classifyServiceTier（内部 YGe）。 */
  export const Az: (
    id: string,
    name?: string | null,
  ) => KnownServiceTierKind | null;
  /** findFastServiceTier（内部 ZGe）。 */
  export const kz: (
    model: ServiceTierModel | null | undefined,
  ) => ModelServiceTier | null;
  /** supportsServiceTier（内部 QGe）。 */
  export const Pz: (
    model: ServiceTierModel | null | undefined,
    tier: string | null | undefined,
  ) => boolean;
  /** resolveServiceTierId（内部 $Ge）。 */
  export const jz: (
    model: ServiceTierModel | null | undefined,
    tier: string | null | undefined,
  ) => string | null;
  /** resolveSelectedServiceTier（内部 eKe）。 */
  export const Mz: (
    model: ServiceTierModel | null | undefined,
    selectedTier: string | null | undefined,
    enabled?: boolean,
  ) => string | null;
  /** initializeServiceTiers（内部 gU）。 */
  export const Nz: () => void;
  /** useIsDarkTheme（app-shared/runtime/theme.ts，内部 H6）。 */
  export const fg: () => boolean | null;
  /** initializeThemeSubscription（内部 U6）。 */
  export const dg: () => void;
  /** BROWSER_FORM_FILL_PATH（app-shared/runtime/request-protocol.ts，内部 Fze）。 */
  export const gW: "/flora/browser/form-fill";
  /** CODEX_SURFACE_HEADER（内部 Ize）。 */
  export const _W: "X-Codex-Surface";
  /** ATTACH_AUTH_HEADER（内部 Lze）。 */
  export const fW: "X-OpenAI-Attach-Auth";
  /** ATTACH_DESKTOP_SURFACE_HEADER（内部 Rze）。 */
  export const pW: "X-OpenAI-Attach-Desktop-Surface";
  /** ATTACH_DEVICE_CHECK_TOKEN_HEADER（内部 zze）。 */
  export const mW: "X-OpenAI-Attach-DeviceCheck-Token";
  /** ATTACH_INTEGRITY_STATE_HEADER（内部 Bze）。 */
  export const hW: "X-OpenAI-Attach-Integrity-State";
  /** EXPECTED_ACCOUNT_ID_HEADER（内部 Vze）。 */
  export const vW: "X-OpenAI-Expected-Account-Id";
  /** initializeRequestProtocol（内部 iV）。 */
  export const CW: () => void;
  export type SitesSharingSource =
    | "CODEX_SITES_SHARING_SOURCE_UNSPECIFIED"
    | "CODEX_SITES_SHARING_SOURCE_LIBRARY"
    | "CODEX_SITES_SHARING_SOURCE_LIBRARY_ACCESS_BADGE"
    | "CODEX_SITES_SHARING_SOURCE_SITES"
    | "CODEX_SITES_SHARING_SOURCE_SITES_ACCESS_BADGE"
    | "CODEX_SITES_SHARING_SOURCE_SETTINGS"
    | "CODEX_SITES_SHARING_SOURCE_CONVERSATION_RESOURCE"
    | "CODEX_SITES_SHARING_SOURCE_IN_APP_BROWSER"
    | "UNRECOGNIZED";
  export interface SitesSharingSources {
    readonly CODEX_SITES_SHARING_SOURCE_UNSPECIFIED:
      "CODEX_SITES_SHARING_SOURCE_UNSPECIFIED";
    readonly CODEX_SITES_SHARING_SOURCE_LIBRARY:
      "CODEX_SITES_SHARING_SOURCE_LIBRARY";
    readonly CODEX_SITES_SHARING_SOURCE_LIBRARY_ACCESS_BADGE:
      "CODEX_SITES_SHARING_SOURCE_LIBRARY_ACCESS_BADGE";
    readonly CODEX_SITES_SHARING_SOURCE_SITES:
      "CODEX_SITES_SHARING_SOURCE_SITES";
    readonly CODEX_SITES_SHARING_SOURCE_SITES_ACCESS_BADGE:
      "CODEX_SITES_SHARING_SOURCE_SITES_ACCESS_BADGE";
    readonly CODEX_SITES_SHARING_SOURCE_SETTINGS:
      "CODEX_SITES_SHARING_SOURCE_SETTINGS";
    readonly CODEX_SITES_SHARING_SOURCE_CONVERSATION_RESOURCE:
      "CODEX_SITES_SHARING_SOURCE_CONVERSATION_RESOURCE";
    readonly CODEX_SITES_SHARING_SOURCE_IN_APP_BROWSER:
      "CODEX_SITES_SHARING_SOURCE_IN_APP_BROWSER";
    readonly UNRECOGNIZED: "UNRECOGNIZED";
  }
  /** sitesSharingSources（app-shared/runtime/sites-sharing-source.ts，内部 Eq）。 */
  export const DF: SitesSharingSources;
  export type SitesSharingAction =
    | "CODEX_SITES_SHARING_ACTION_OPENED"
    | "UNRECOGNIZED";
  export interface SitesSharingActions {
    readonly CODEX_SITES_SHARING_ACTION_OPENED:
      "CODEX_SITES_SHARING_ACTION_OPENED";
    readonly UNRECOGNIZED: "UNRECOGNIZED";
  }
  /** Sites 分享弹窗打开事件及 action 枚举。 */
  export const EF: AnalyticsEventDescriptor<string>;
  export const TF: SitesSharingActions;
  export interface AnalyticsEventDescriptor<Type extends string> {
    readonly $type: Type;
  }
  /** FAST_MODE_ANNOUNCEMENT_CTA_CLICKED（app-shared/runtime/fast-mode-analytics-events.ts，内部 RX）。 */
  export const mj: AnalyticsEventDescriptor<
    "protobuf_analytics_events.v1.CodexFastModeAnnouncementCtaClicked"
  >;
  /** FAST_MODE_ANNOUNCEMENT_DISMISSED（内部 zX）。 */
  export const hj: AnalyticsEventDescriptor<
    "protobuf_analytics_events.v1.CodexFastModeAnnouncementDismissed"
  >;
  /** FAST_MODE_ANNOUNCEMENT_VIEWED（内部 BX）。 */
  export const gj: AnalyticsEventDescriptor<
    "protobuf_analytics_events.v1.CodexFastModeAnnouncementViewed"
  >;
  /** FAST_MODE_BANNER_CTA_CLICKED（内部 VX）。 */
  export const _j: AnalyticsEventDescriptor<
    "protobuf_analytics_events.v1.CodexFastModeBannerCtaClicked"
  >;
  /** FAST_MODE_BANNER_DISMISSED（内部 HX）。 */
  export const vj: AnalyticsEventDescriptor<
    "protobuf_analytics_events.v1.CodexFastModeBannerDismissed"
  >;
  /** FAST_MODE_BANNER_VIEWED（内部 UX）。 */
  export const yj: AnalyticsEventDescriptor<
    "protobuf_analytics_events.v1.CodexFastModeBannerViewed"
  >;
  /** initializeIconAsset（app-shared/ui/icons/icon-preset.ts，内部 g3）。 */
  export const C_: () => void;
  /** initializeOpenPluginIcon（迁移插件入口图标初始化器）。 */
  export const Ls: () => void;
  /** Open plugin 图标资源。 */
  export const Is: IconAssetPreset;
  export const wl: () => void;
  export const Tl: IconAssetPreset;
  export const sw: (props: Record<string, unknown>) => unknown;
  export const FQ: unknown;
  /** initializeMaitaiRuntime（app-shared/runtime/atom-signal.ts）。 */
  export const FX: () => void;
  /** 永远拒绝的 queryFn，用于缺少必要参数时阻止请求。 */
  export const FZ: (
    context: ScopedQueryFunctionContext,
  ) => Promise<never>;
  /** useSignalValue（app-shared/runtime/atom-signal.ts）。 */
  export const HX: <T>(
    signal: ReadableSignal<T>,
    options?: QueryReadOptions,
  ) => T;
  export interface JsxRuntime {
    Fragment: unknown;
    jsx(component: unknown, props: unknown, key?: string | number): unknown;
    jsxs(component: unknown, props: unknown, key?: string | number): unknown;
  }
  /** getJsxRuntime（返回 React JSX runtime）。 */
  export const I3: () => JsxRuntime;
  /** ReactDOM client runtime used by the renderer entry point. */
  export const N3: () => { createRoot(element: HTMLElement): { render(node: unknown): void } };
  /** releaseSignalFamilyMember（释放指定 family parameter 的 retained state）。 */
  export const _Z: <Param>(
    scope: MaitaiScopeApi<unknown>,
    family: SignalFamily<Param, unknown>,
    parameter: Param,
  ) => void;
  export const IQ: unknown;
  export const JQ: unknown;
  export const K2: () => void;
  /** initializeDialogComponents（Wallet enrollment 对话框依赖）。 */
  export const g4: () => void;
  /** initializeMotionRuntime（Wallet enrollment 动画依赖）。 */
  export const jZ: () => void;
  /** motion components（Wallet enrollment 过渡容器）。 */
  export const o$: { div: unknown; span: unknown };
  /** initializeComposerEditorState（CME Home 入口依赖）。 */
  export const Eu: () => void;
  /** CME 图标组件。 */
  export const Vb: (props: IconAssetProps) => unknown;
  /** Composer mention/plugin state reader。 */
  export const wu: {
    getState(editorState: unknown): { active?: boolean } | undefined;
  };
  /** Extensions 图标组件。 */
  export const AS: (props: IconAssetProps) => unknown;
  /** 生成站点在连接应用列表与详情中的图标资源。 */
  export const Ot: IconAssetPreset;
  export const zw: IconAssetPreset;
  /** Apple 账号连接图标。 */
  export const R_: (props: IconAssetProps) => unknown;
  /** browser-profile-import 图标依赖初始化器。 */
  export const lw: () => void;
  /** ChatGPT 标志组件。 */
  export const ty: (props: Record<string, unknown>) => unknown;
  /** 插件技能来源图标组件。 */
  export const rC: (props: Record<string, unknown>) => unknown;
  export interface SimpleIconProps extends Record<string, unknown> {
    className?: string;
  }
  /** Permission dropdown 的 chevron 与选中图标。 */
  export const cy: (props: SimpleIconProps) => unknown;
  export const iy: (props: SimpleIconProps) => unknown;
  /** 下拉菜单使用的向下箭头。 */
  export const sy: (props: SimpleIconProps) => unknown;
  /** Report 图标组件（内部 F9e）。 */
  export const mb: (props: Record<string, unknown>) => unknown;
  /** query runtime 初始化器。 */
  export const Z3: () => void;
  /** renderer logger。 */
  export const Q3: {
    error(message: string, details?: Record<string, unknown>): void;
    info(message: string, details?: Record<string, unknown>): void;
    warning(message: string, details?: Record<string, unknown>): void;
  };
  export interface ScopeRetainOptions {
    autoDispose?: boolean | number;
    max?: number;
  }
  export interface MaitaiScope<T = unknown> {
    __scopeBrand: string;
    getKey?: (value: T) => string;
    id: symbol;
    parent?: MaitaiScope<unknown>;
    retain?: ScopeRetainOptions;
  }
  export interface CreateScopeOptions<T> {
    key?: (value: T) => string;
    parent?: MaitaiScope<unknown>;
    retain?: ScopeRetainOptions;
  }
  /** createScope（app-shared/runtime/atom-signal.ts，内部 nke）。 */
  export const UZ: <T = unknown>(
    brand: string,
    options?: CreateScopeOptions<T>,
  ) => MaitaiScope<T>;
  export interface QueryClientProviderProps {
    children?: unknown;
    queryClient?: unknown;
  }
  export interface ScopeProviderProps<T> {
    children?: unknown;
    scope: MaitaiScope<T>;
    value?: T;
  }
  /** QueryClientProvider（app-shared/runtime/atom-signal.ts，内部 Xje）。 */
  export const GX: (props: QueryClientProviderProps) => unknown;
  /** ScopeProvider（app-shared/runtime/atom-signal.ts，内部 $je）。 */
  export const UX: <T>(props: ScopeProviderProps<T>) => unknown;
  /** initializeScopeProviderRuntime（内部 rL）。 */
  export const KX: () => void;
  /** Codex Web 入口（内部 _Me）。 */
  export const NX: "https://chatgpt.com/codex";
  export interface ParsedCodexDeepLink {
    destination: string;
    url: URL;
  }
  /** parseCodexDeepLink（app-shared/runtime/codex-links.ts，内部 vMe）。 */
  export const jX: (input: string | URL) => ParsedCodexDeepLink | null;
  export interface CodexDelegationPayload {
    input: string;
    sourceThreadId: string;
  }
  export interface CodexToolOutput {
    name: string;
    namespace: string;
    output: unknown;
  }
  /** parseCodexDelegation（app-shared/runtime/codex-links.ts，内部 xMe）。 */
  export const AX: (output: string) => CodexDelegationPayload | null;
  /** extractCodexDelegationToolOutput（内部 bMe）。 */
  export const OX: (toolOutput: CodexToolOutput) => string | null;
  /** initializeCodexWebUrl（内部 _L）。 */
  export const PX: () => void;
  /** initializeCodexDelegationParser（内部 yMe）。 */
  export const MX: () => void;
  export type CodexMicroIdleTimeout =
    | "off"
    | "30-seconds"
    | "1-minute"
    | "3-minutes"
    | "10-minutes"
    | "30-minutes"
    | "1-hour";
  export type CodexMicroStatus =
    | "awaiting-approval"
    | "awaiting-response"
    | "error"
    | "idle"
    | "off"
    | "unread"
    | "working";
  export interface CodexMicroConfig {
    analogStick: Record<string, unknown>;
    encoder: Record<string, unknown>;
    encoderMode: "composer-navigation" | "reasoning" | "conversation-scroll" | "custom";
    separateMicrophoneKeys: boolean;
    slots: Record<string, unknown>;
    version: 1;
    voiceButtonMode: "push-to-talk" | "realtime";
  }
  export interface AutoReviewConfig {
    autoReview?: { requiredOnModels?: readonly string[] };
  }
  /** Codex Micro idle timeout schema（内部 vL）。 */
  export const CX: import("zod").ZodType<CodexMicroIdleTimeout>;
  /** Codex Micro config schema（内部 AL）。 */
  export const SX: import("zod").ZodType<CodexMicroConfig>;
  /** Codex Micro task sort schema（内部 TL）。 */
  export const bX: import("zod").ZodType<"pinned" | "recent" | "priority" | "custom">;
  /** Codex Micro agent key ids（内部 NMe）。 */
  export const vX: readonly ["AG00", "AG01", "AG02", "AG03", "AG04", "AG05"];
  /** Codex Micro voice button mode schema（内部 wL）。 */
  export const wX: import("zod").ZodType<"push-to-talk" | "realtime">;
  /** Codex Micro encoder mode schema（内部 CL）。 */
  export const xX: import("zod").ZodType<
    "composer-navigation" | "reasoning" | "conversation-scroll" | "custom"
  >;
  /** Default Codex Micro config（内部 jL）。 */
  export const yX: CodexMicroConfig;
  /** Composer submit modes（内部 NL）。 */
  export const gX: readonly ["enter", "cmdIfMultiline", "cmdAlways"];
  /** getCodexMicroIdleTimeoutMs（内部 TMe）。 */
  export const TX: (timeout: CodexMicroIdleTimeout) => number | null;
  /** getCodexMicroStatusColor（内部 EMe）。 */
  export const EX: (status: CodexMicroStatus) => number;
  /** isAutomatedReviewSource（内部 IL）。 */
  export const lX: (source: unknown) => boolean;
  /** isAutoReviewRequiredForModel（内部 FMe）。 */
  export const uX: (
    config: AutoReviewConfig | null | undefined,
    model: string | null | undefined,
  ) => boolean;
  /** initializeCodexMicroConfig（内部 ML）。 */
  export const DX: () => void;
  export type ApprovalPolicy = string | Record<string, unknown>;
  export type ApprovalsReviewer = "user" | "auto_review" | "guardian_subagent";
  export type SandboxMode = "danger-full-access" | "read-only" | "workspace-write";
  export type PermissionPreset =
    | "read-only"
    | "auto"
    | "granular"
    | "guardian-approvals"
    | "full-access"
    | "custom";
  export type BuiltInPermissionPreset = Exclude<PermissionPreset, "custom">;
  export interface ActivePermissionProfile {
    id: string;
    extends: string | null;
  }
  export interface ReadOnlySandboxPolicy {
    type: "readOnly";
    networkAccess: boolean;
  }
  export interface WorkspaceWriteSandboxPolicy {
    type: "workspaceWrite";
    writableRoots: string[];
    excludeSlashTmp: boolean;
    excludeTmpdirEnvVar: boolean;
    networkAccess: boolean;
  }
  export interface DangerFullAccessSandboxPolicy {
    type: "dangerFullAccess";
  }
  export interface ExternalSandboxPolicy {
    type: "externalSandbox";
  }
  export type SandboxPolicy =
    | ReadOnlySandboxPolicy
    | WorkspaceWriteSandboxPolicy
    | DangerFullAccessSandboxPolicy
    | ExternalSandboxPolicy;
  export interface RuntimePermissionState {
    activePermissionProfile: ActivePermissionProfile | null;
    runtimeWorkspaceRoots?: string[];
    sandboxPolicy: SandboxPolicy;
    approvalPolicy: ApprovalPolicy;
    approvalsReviewer?: ApprovalsReviewer;
  }
  export interface SandboxWorkspaceWriteConfig {
    writable_roots?: readonly string[];
    exclude_slash_tmp?: boolean;
    exclude_tmpdir_env_var?: boolean;
    network_access?: boolean;
  }
  export interface PermissionCliConfig extends Record<string, unknown> {
    sandbox_mode?: SandboxMode | null;
    sandbox_workspace_write?: SandboxWorkspaceWriteConfig;
    approval_policy?: ApprovalPolicy | null;
    approvals_reviewer?: ApprovalsReviewer | null;
    features?: Record<string, unknown> | null;
  }
  export interface PermissionRequirements {
    allowedPermissionProfiles?: Record<string, boolean> | null;
    allowedSandboxModes?: readonly SandboxMode[] | null;
    allowedApprovalPolicies?: readonly ApprovalPolicy[] | null;
    allowedApprovalsReviewers?: readonly ApprovalsReviewer[] | null;
  }
  /** detectPermissionPreset（app-shared/runtime/permission-profiles.ts，内部 LMe）。 */
  export const nX: (state: RuntimePermissionState) => PermissionPreset | null;
  /** getBooleanFeatureFlag（内部 RMe）。 */
  export const dX: (
    config: PermissionCliConfig | null | undefined,
    feature: string,
  ) => boolean | undefined;
  /** getPermissionRuntimeSelector（内部 VMe）。 */
  export const oX: (
    state: RuntimePermissionState,
  ) => { sandboxPolicy: SandboxPolicy } | { permissions: string };
  /** getRuntimeWorkspaceRoots（内部 HMe）。 */
  export const aX: (state: RuntimePermissionState) => string[];
  /** getAvailablePermissionPresets（内部 KMe）。 */
  export const mX: (
    requirements: PermissionRequirements | null | undefined,
    config: PermissionCliConfig | null | undefined,
  ) => PermissionPreset[];
  /** selectPreferredPermissionPreset（内部 qMe）。 */
  export const hX: (presets: readonly PermissionPreset[]) => PermissionPreset;
  /** listAllowedPermissionPresets（内部 YMe）。 */
  export const pX: (
    requirements: PermissionRequirements | null | undefined,
  ) => BuiltInPermissionPreset[];
  /** isPermissionPresetAllowed（内部 XMe）。 */
  export const cX: (
    preset: BuiltInPermissionPreset,
    requirements: PermissionRequirements | null | undefined,
  ) => boolean;
  /** createWorkspaceWritePermissionState（内部 LL）。 */
  export const tX: (
    workspaceRoots: string[],
    config?: SandboxWorkspaceWriteConfig,
    approvalPolicy?: ApprovalPolicy | null,
    approvalsReviewer?: ApprovalsReviewer,
    activePermissionProfile?: ActivePermissionProfile | null,
  ) => RuntimePermissionState;
  /** createReadOnlyPermissionState（内部 RL）。 */
  export const eX: (
    approvalPolicy?: ApprovalPolicy | null,
    approvalsReviewer?: ApprovalsReviewer,
    activePermissionProfile?: ActivePermissionProfile | null,
  ) => RuntimePermissionState;
  /** createPermissionStateForPreset（内部 zL）。 */
  export const $Y: (
    preset: PermissionPreset,
    workspaceRoots: string[],
    config?: PermissionCliConfig | null,
  ) => RuntimePermissionState;
  /** resolveApprovalsReviewer（内部 $Me）。 */
  export const rX: (
    config: PermissionCliConfig | null | undefined,
  ) => ApprovalsReviewer;
  /** inferPermissionPresetFromConfig（内部 tNe）。 */
  export const iX: (
    config: PermissionCliConfig | null | undefined,
    defaultPreset?: PermissionPreset,
  ) => PermissionPreset | null;
  /** isGuardianApprovalEnabled（内部 BL）。 */
  export const fX: (
    config: PermissionCliConfig | null | undefined,
  ) => boolean | undefined;
  /** initializePermissionProfiles（内部 UL）。 */
  export const sX: () => void;
  export interface SuggestionModelSelection {
    selectedModel?: string | null;
    selectedModelDisplayName?: string | null;
  }
  export type SuggestionTarget = "science";
  /** getSuggestionTarget（app-shared/runtime/suggestion-targeting.ts，内部 dNe）。 */
  export const JY: (
    selection: SuggestionModelSelection,
  ) => SuggestionTarget | null;
  /** isScienceSuggestionModel（内部 fNe）。 */
  export const XY: (selection: SuggestionModelSelection) => boolean;
  /** initializeSuggestionTargeting（内部 KL）。 */
  export const YY: () => void;
  export type ReasoningEffort =
    | "none" | "minimal" | "low" | "medium"
    | "high" | "xhigh" | "max" | "ultra";
  export interface ReasoningEffortOption extends Record<string, unknown> {
    reasoningEffort: ReasoningEffort;
  }
  export interface AutomationModel extends Record<string, unknown> {
    model: string;
    isDefault?: boolean;
    defaultReasoningEffort?: ReasoningEffort | null;
    supportedReasoningEfforts?: readonly ReasoningEffortOption[];
  }
  export interface AutomationModelPreference {
    model?: string | null;
    reasoningEffort?: ReasoningEffort | null;
  }
  export interface AutomationDefinition extends AutomationModelPreference {
    kind?: string;
  }
  export interface AutomationModelSelection {
    model: string;
    reasoningEffort: ReasoningEffort | null;
  }
  export interface RemoteModelConfiguration {
    automationModel: string;
    ephemeralGenerationModel: string;
    ambientSuggestionsModel: string;
    ambientSuggestionsSafetyModel: string;
  }
  /** parseRemoteModelConfiguration（app-shared/runtime/automation-models.ts，内部 CNe）。 */
  export const UY: (value: unknown) => RemoteModelConfiguration;
  /** initializeRemoteModelConfiguration（内部 ZL）。 */
  export const HY: () => void;
  /** isHeartbeatAutomation（内部 TNe）。 */
  export const zY: (automation: unknown) => automation is AutomationDefinition;
  /** normalizeAutomationExecutionEnvironment（内部 ENe）。 */
  export const BY: (environment: unknown) => "worktree" | "local";
  /** findAutomationModel（内部 QL）。 */
  export const FY: (
    models: readonly AutomationModel[],
    model: string | null | undefined,
  ) => AutomationModel | null;
  /** resolveSupportedReasoningEffort（内部 $L）。 */
  export const LY: (options: {
    model: AutomationModel | null | undefined;
    reasoningEffort: ReasoningEffort | null | undefined;
  }) => ReasoningEffort | null;
  /** resolveAutomationModelSelection（内部 ONe）。 */
  export const IY: (options: {
    automation: AutomationModelPreference;
    models: readonly AutomationModel[];
    defaultModel?: string | null;
  }) => AutomationModelSelection;
  /** initializeAutomationModels（内部 nR）。 */
  export const RY: () => void;
  export interface HeartbeatPrompt {
    automationId: string | null;
    currentTimeIso: string;
    instructions: string;
  }
  export interface AutomationInputItem extends Record<string, unknown> {
    type: string;
    text?: string;
  }
  export interface AutomationToolOutput extends Record<string, unknown> {
    namespace?: string;
    name?: string;
    output?: unknown;
  }
  /** parseHeartbeatPrompt（app-shared/runtime/automation-heartbeat.ts，内部 rR）。 */
  export const kY: (source: string) => HeartbeatPrompt | null;
  /** parseHeartbeatInput（内部 RNe）。 */
  export const AY: (
    input: readonly AutomationInputItem[] | null | undefined,
  ) => HeartbeatPrompt | null;
  /** initializeHeartbeatInputParser（内部 zNe）。 */
  export const OY: () => void;
  /** extractAutomationUpdateOutput（内部 BNe）。 */
  export const EY: (
    toolOutput: AutomationToolOutput | null | undefined,
  ) => string | null;
  /** initializeAutomationUpdateOutputParser（内部 aR）。 */
  export const DY: () => void;
  export interface MaitaiScopeApi<T = unknown> {
    readonly queryClient: unknown;
    readonly query: {
      getOrFetch<Result>(query: unknown, ...parameters: unknown[]): Promise<Result>;
      snapshot<Data, QueryError>(
        query: ScopedQuerySignal<unknown, Data, QueryError>,
      ): {
        cancel(): Promise<void>;
        setData(data: Data): void;
      };
      [key: string]: unknown;
    };
    readonly scope: MaitaiScope<T>;
    readonly value: T;
    get<Value>(signal: ScopedSignal<unknown, Value>): Value;
    get<Data, QueryError>(
      signal: ScopedQuerySignal<unknown, Data, QueryError>,
    ): ScopedQueryResult<Data, QueryError>;
    get<Page, PageParam, QueryError>(
      signal: ScopedInfiniteQuerySignal<unknown, Page, PageParam, QueryError>,
    ): ScopedInfiniteQueryResult<Page, PageParam, QueryError>;
    get<Param, Page, PageParam, QueryError>(
      family: ScopedInfiniteQueryFamily<unknown, Param, Page, PageParam, QueryError>,
      parameter: Param,
    ): ScopedInfiniteQueryResult<Page, PageParam, QueryError>;
    get<Param, Data, QueryError>(
      family: ScopedQueryFamily<unknown, Param, Data, QueryError>,
      parameter: Param,
    ): ScopedQueryResult<Data, QueryError>;
    get<Param, Value>(
      family: ScopedDerivedFamily<unknown, Param, Value>,
      parameter: Param,
    ): Value;
    get<Param, Value>(
      family: ScopedSignalFamily<unknown, Param, Value>,
      parameter: Param,
    ): Value;
    get<Data, MutationError, Variables, Context>(
      signal: ScopedMutationSignal<unknown, Data, MutationError, Variables, Context>,
    ): ScopedMutationResult<Data, MutationError, Variables, Context>;
    get<Param, Data, MutationError, Variables, Context>(
      family: ScopedMutationFamily<unknown, Param, Data, MutationError, Variables, Context>,
      parameter: Param,
    ): ScopedMutationResult<Data, MutationError, Variables, Context>;
    get<Value>(signal: ScopedDerivedSignal<unknown, Value>): Value;
    get<Param, Data, QueryError>(
      family: ScopedQueryFamily<unknown, Param, Data, QueryError>,
      parameter: Param,
    ): ScopedQueryResult<Data, QueryError>;
    get<Param, Value>(
      family: ScopedDerivedFamily<unknown, Param, Value>,
      parameter: Param,
    ): Value;
    get<Param, Value>(
      family: ScopedExternalSignalFamily<unknown, Param, Value>,
      parameter: Param,
    ): Value;
    get<Param, Value>(
      family: ScopedSignalFamily<unknown, Param, Value>,
      parameter: Param,
    ): Value;
    get<Value = unknown>(signal: unknown, ...parameters: unknown[]): Value;
    getOwnValue<Value>(scope: MaitaiScope<Value>): Value;
    set<Value>(
      signal: ScopedSignal<unknown, Value>,
      value: Value | ((current: Value) => Value),
    ): void;
    set<Param, Value>(
      family: ScopedSignalFamily<unknown, Param, Value>,
      parameter: Param,
      value: Value | ((current: Value) => Value),
    ): void;
    set(signal: unknown, value: unknown, ...parameters: unknown[]): void;
    watch(effect: (scope: MaitaiScopeApi<T>) => void | (() => void)): () => void;
    when(predicate: (scope: MaitaiScopeApi<T>) => boolean): Promise<void>;
    [key: string]: unknown;
  }
  export interface ScopedSignalInitializerContext<T = unknown> {
    readonly queryClient: unknown;
    readonly scope: MaitaiScopeApi<T>;
  }
  export interface ScopedSignalOptions<TScope, TValue> {
    getServerSnapshot?: () => TValue;
    isEqual?: (previous: TValue, next: TValue) => boolean;
    onMount?: (
      setSelf: (value: TValue | ((current: TValue) => TValue)) => void,
      scope: MaitaiScopeApi<TScope>,
    ) => void | (() => void);
  }
  export interface ScopedSignal<TScope, TValue> {
    cache: "signal";
    debugLabel?: string;
    scope: MaitaiScope<TScope>;
  }
  export interface ScopedDerivedSignalOptions<TValue> {
    isEqual?: (previous: TValue, next: TValue) => boolean;
  }
  export type ScopedExternalSignalCleanup =
    | (() => void)
    | { [Symbol.dispose](): void }
    | void;
  export interface ScopedExternalSignalContext<TScope, TValue>
    extends DerivedScopedSignalContext<TScope> {
    set(value: TValue | ((current: TValue) => TValue)): void;
  }
  export interface ScopedDerivedSignal<TScope, TValue> {
    cache: "cached";
    debugLabel?: string;
    scope: MaitaiScope<TScope>;
  }
  export type ScopedExternalSignal<TScope, TValue> = ScopedDerivedSignal<
    TScope,
    TValue
  >;
  export interface ScopedExternalSignalFamily<TScope, Param, TValue> {
    autoDisposeMs: number;
    debugLabel?: string;
    kind: "readable-family";
    scope: MaitaiScope<TScope>;
  }
  export interface ScopedQueryFunctionContext {
    client: ScopedQueryClient;
    meta?: unknown;
    queryKey: readonly unknown[];
    signal: AbortSignal;
  }
  export interface ScopedInfiniteQueryFunctionContext<TPageParam>
    extends ScopedQueryFunctionContext {
    direction: "backward" | "forward";
    pageParam: TPageParam;
  }
  export interface InfiniteQueryData<TPage, TPageParam = unknown> {
    pageParams: TPageParam[];
    pages: TPage[];
  }
  export interface ScopedQueryOptions<TData, TError = Error> {
    enabled?: boolean | ((query: unknown) => boolean);
    initialData?: TData | (() => TData);
    meta?: unknown;
    queryFn?: (context: ScopedQueryFunctionContext) => Promise<TData> | TData;
    queryKey: readonly unknown[];
    refetchInterval?: number | false;
    refetchOnMount?: boolean | "always";
    refetchOnWindowFocus?: boolean | "always";
    retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
    staleTime?: number;
    throwOnError?: boolean | ((error: TError) => boolean);
  }
  export interface ScopedInfiniteQueryOptions<TPage, TPageParam, TError = Error>
    extends Omit<
      ScopedQueryOptions<InfiniteQueryData<TPage, TPageParam>, TError>,
      "initialData" | "queryFn"
    > {
    getNextPageParam?(
      lastPage: TPage,
      allPages: TPage[],
      lastPageParam: TPageParam,
      allPageParams: TPageParam[],
    ): TPageParam | null | undefined;
    getPreviousPageParam?(
      firstPage: TPage,
      allPages: TPage[],
      firstPageParam: TPageParam,
      allPageParams: TPageParam[],
    ): TPageParam | null | undefined;
    initialData?: InfiniteQueryData<TPage, TPageParam> | (() => InfiniteQueryData<TPage, TPageParam>);
    initialPageParam: TPageParam;
    maxPages?: number;
    queryFn?(context: ScopedInfiniteQueryFunctionContext<TPageParam>): Promise<TPage> | TPage;
  }
  export interface ScopedQueryState<TData, TError> {
    data?: TData;
    dataUpdatedAt?: number;
    error?: TError | null;
    fetchStatus?: "fetching" | "idle" | "paused";
    isInvalidated?: boolean;
    status?: "error" | "pending" | "success";
  }
  export interface ScopedQueryCache {
    subscribe?(listener: (event: unknown) => void): () => void;
  }
  export interface ScopedQueryClient {
    fetchQuery?<TData>(options: ScopedQueryOptions<TData, unknown>): Promise<TData>;
    getQueryCache?(): ScopedQueryCache;
    getQueryData?<TData>(queryKey: readonly unknown[]): TData | undefined;
    getQueryState?<TData, TError>(
      queryKey: readonly unknown[],
    ): ScopedQueryState<TData, TError> | undefined;
    setQueryData?<TData>(queryKey: readonly unknown[], data: TData): void;
  }
  export interface ScopedQueryResult<TData, TError = Error> {
    data: TData | undefined;
    error: TError | null;
    fetchStatus: "fetching" | "idle" | "paused";
    isEnabled: boolean;
    isError: boolean;
    isFetching: boolean;
    isLoading: boolean;
    isPending: boolean;
    isRefetching: boolean;
    isStale: boolean;
    isSuccess: boolean;
    refetch(): Promise<ScopedQueryResult<TData, TError>>;
    status: "error" | "pending" | "success";
  }
  export interface ScopedInfiniteQueryResult<TPage, TPageParam, TError = Error>
    extends ScopedQueryResult<InfiniteQueryData<TPage, TPageParam>, TError> {
    fetchNextPage(): Promise<ScopedInfiniteQueryResult<TPage, TPageParam, TError>>;
    fetchPreviousPage(): Promise<ScopedInfiniteQueryResult<TPage, TPageParam, TError>>;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    isFetchingNextPage: boolean;
    isFetchingPreviousPage: boolean;
  }
  export interface ScopedMutationContext {
    client: unknown;
    meta?: unknown;
    mutationKey?: readonly unknown[];
  }
  export interface ScopedMutationCallbacks<TData, TError, TVariables, TContext> {
    onError?(
      error: TError,
      variables: TVariables,
      context: TContext | undefined,
      mutation: ScopedMutationContext,
    ): Promise<unknown> | unknown;
    onSettled?(
      data: TData | undefined,
      error: TError | null,
      variables: TVariables,
      context: TContext | undefined,
      mutation: ScopedMutationContext,
    ): Promise<unknown> | unknown;
    onSuccess?(
      data: TData,
      variables: TVariables,
      context: TContext | undefined,
      mutation: ScopedMutationContext,
    ): Promise<unknown> | unknown;
  }
  export interface ScopedMutationOptions<TData, TError, TVariables, TContext>
    extends ScopedMutationCallbacks<TData, TError, TVariables, TContext> {
    meta?: unknown;
    mutationFn?(
      variables: TVariables,
      context: ScopedMutationContext,
    ): Promise<TData> | TData;
    mutationKey?: readonly unknown[];
    onMutate?(
      variables: TVariables,
      context: ScopedMutationContext,
    ): Promise<TContext> | TContext;
  }
  export interface ScopedMutationResult<TData, TError, TVariables, TContext> {
    data: TData | undefined;
    error: TError | null;
    isError: boolean;
    isIdle: boolean;
    isPending: boolean;
    isSuccess: boolean;
    mutate(
      variables: TVariables,
      callbacks?: ScopedMutationCallbacks<TData, TError, TVariables, TContext>,
    ): void;
    mutateAsync(
      variables: TVariables,
      callbacks?: ScopedMutationCallbacks<TData, TError, TVariables, TContext>,
    ): Promise<TData>;
    status: "error" | "idle" | "pending" | "success";
    variables: TVariables | undefined;
  }
  export interface ScopedQuerySignal<TScope, TData, TError = Error> {
    cache: "cached";
    debugLabel?: string;
    getOptions(
      context: DerivedScopedSignalContext<TScope>,
    ): ScopedQueryOptions<TData, TError>;
    queryKind: "query";
    scope: MaitaiScope<TScope>;
  }
  export interface ScopedInfiniteQuerySignal<TScope, TPage, TPageParam, TError = Error> {
    cache: "cached";
    debugLabel?: string;
    getOptions(
      context: DerivedScopedSignalContext<TScope>,
    ): ScopedInfiniteQueryOptions<TPage, TPageParam, TError>;
    queryKind: "infinite";
    scope: MaitaiScope<TScope>;
  }
  export interface ScopedMutationSignal<TScope, TData, TError, TVariables, TContext> {
    cache: "cached";
    debugLabel?: string;
    getOptions(
      context: DerivedScopedSignalContext<TScope>,
    ): ScopedMutationOptions<TData, TError, TVariables, TContext>;
    scope: MaitaiScope<TScope>;
  }
  export interface ScopedMutationFamily<
    TScope,
    Param,
    TData,
    TError,
    TVariables,
    TContext,
  > {
    autoDisposeMs: number;
    debugLabel?: string;
    getOptions(
      parameter: Param,
      context: DerivedScopedSignalContext<TScope>,
    ): ScopedMutationOptions<TData, TError, TVariables, TContext>;
    kind: "readable-family";
    scope: MaitaiScope<TScope>;
  }
  export interface ScopedDerivedFamilyOptions<Param, TValue> {
    autoDispose?: boolean | number;
    excludeFieldsFromKey?: readonly string[];
    isEqual?: (previous: TValue, next: TValue) => boolean;
    key?: (parameter: Param) => unknown;
    owner?: (parameter: Param) => unknown;
  }
  export type ScopedQueryFamilyOptions<Param> = Omit<
    ScopedDerivedFamilyOptions<Param, unknown>,
    "isEqual"
  >;
  export type ScopedMutationFamilyOptions<Param> = ScopedQueryFamilyOptions<Param>;
  export interface ScopedSignalFamilyOptions<Param> {
    autoDispose?: boolean | number;
    excludeFieldsFromKey?: readonly string[];
    key?: (parameter: Param) => unknown;
    owner?: (parameter: Param) => unknown;
  }
  export interface ScopedSignalFamilyScopeApi<TScope, Param>
    extends MaitaiScopeApi<TScope> {
    readonly key: Param;
  }
  export interface ScopedSignalFamilyValueOptions<TScope, Param, TValue> {
    getServerSnapshot?: (parameter: Param) => TValue;
    isEqual?: (previous: TValue, next: TValue) => boolean;
    onMount?: (
      setSelf: (value: TValue | ((current: TValue) => TValue)) => void,
      scope: ScopedSignalFamilyScopeApi<TScope, Param>,
    ) => void | (() => void);
  }
  export interface DerivedScopedSignalContext<T = unknown> {
    readonly queryClient: unknown;
    readonly scope: MaitaiScopeApi<T>;
    get<Value>(signal: ScopedSignal<unknown, Value>): Value;
    get<Data, QueryError>(
      signal: ScopedQuerySignal<unknown, Data, QueryError>,
    ): ScopedQueryResult<Data, QueryError>;
    get<Page, PageParam, QueryError>(
      signal: ScopedInfiniteQuerySignal<unknown, Page, PageParam, QueryError>,
    ): ScopedInfiniteQueryResult<Page, PageParam, QueryError>;
    get<Data, MutationError, Variables, Context>(
      signal: ScopedMutationSignal<unknown, Data, MutationError, Variables, Context>,
    ): ScopedMutationResult<Data, MutationError, Variables, Context>;
    get<Param, Data, MutationError, Variables, Context>(
      family: ScopedMutationFamily<unknown, Param, Data, MutationError, Variables, Context>,
      parameter: Param,
    ): ScopedMutationResult<Data, MutationError, Variables, Context>;
    get<Value>(signal: ScopedDerivedSignal<unknown, Value>): Value;
    get<Param, Data, QueryError>(
      family: ScopedQueryFamily<unknown, Param, Data, QueryError>,
      parameter: Param,
    ): ScopedQueryResult<Data, QueryError>;
    get<Param, Value>(
      family: ScopedDerivedFamily<unknown, Param, Value>,
      parameter: Param,
    ): Value;
    get<Param, Value>(
      family: ScopedExternalSignalFamily<unknown, Param, Value>,
      parameter: Param,
    ): Value;
    get<Param, Value>(
      family: ScopedSignalFamily<unknown, Param, Value>,
      parameter: Param,
    ): Value;
    get<Value = unknown>(reader: unknown, ...parameters: unknown[]): Value;
  }
  export interface ScopedDerivedFamily<TScope, Param, TValue> {
    autoDisposeMs: number;
    debugLabel?: string;
    kind: "readable-family";
    scope: MaitaiScope<TScope>;
  }
  export interface ScopedQueryFamily<TScope, Param, TData, TError = Error> {
    autoDisposeMs: number;
    debugLabel?: string;
    getOptions(
      parameter: Param,
      context: DerivedScopedSignalContext<TScope>,
    ): ScopedQueryOptions<TData, TError>;
    kind: "readable-family";
    queryKind: "query";
    scope: MaitaiScope<TScope>;
  }
  export interface ScopedInfiniteQueryFamily<TScope, Param, TPage, TPageParam, TError = Error> {
    autoDisposeMs: number;
    debugLabel?: string;
    getOptions(
      parameter: Param,
      context: DerivedScopedSignalContext<TScope>,
    ): ScopedInfiniteQueryOptions<TPage, TPageParam, TError>;
    kind: "readable-family";
    queryKind: "infinite";
    scope: MaitaiScope<TScope>;
  }
  export interface ScopedSignalFamily<TScope, Param, TValue> {
    autoDisposeMs: number;
    debugLabel?: string;
    kind: "signal-family";
    scope: MaitaiScope<TScope>;
  }
  /** useScope（app-shared/runtime/atom-signal.ts，内部 mMe）。 */
  export const LX: <T>(scope: MaitaiScope<T>) => MaitaiScopeApi<T>;
  export const P3: unknown;
  /** replaceEqualDeep（app-shared/runtime/query-structural-utils.ts）。 */
  export const PZ: <T>(previous: unknown, next: T) => T;
  export const QI: () => void;
  /** Sites 卡片操作区图标与菜单依赖。 */
  export const _O: () => void;
  export const Vs: () => void;
  export const pO: () => void;
  export const xE: () => void;
  export interface IconAssetPreset {
    body: string;
    capabilities: readonly string[];
    canvas: { height: number; viewBox: string; width: number };
    name: string;
    optical?: Record<string, unknown>;
    paint: Record<string, unknown>;
  }
  export interface IconAssetProps extends Record<string, unknown> {
    alignment?: "composite" | "foreground";
    asset: IconAssetPreset;
    idPrefix?: string;
    label?: string;
  }
  /** IconAsset（app-shared/ui/icons/icon-preset.ts）。 */
  export const S_: (props: IconAssetProps) => unknown;
  /** edit icon asset（Site detail toolbar）。 */
  export const jT: IconAssetPreset;
  /** Sites 卡片操作区图标 assets。 */
  export const Bs: IconAssetPreset;
  export const fO: IconAssetPreset;
  export const gO: IconAssetPreset;
  export const bE: IconAssetPreset;
  /** Site access state 的 public 图标及初始化器。 */
  export const A_: (props: SimpleIconProps) => unknown;
  export const j_: () => void;
  /** dismiss icon asset（worktree onboarding banner）。 */
  export const ig: IconAssetPreset;
  /** close icon asset（Home Beacon banner）。 */
  export const cw: IconAssetPreset;
  /** Sidebar panel attachment animation assets and initializers. */
  export const Fs: unknown;
  export const Ix: unknown;
  export const Lx: unknown;
  export const Ms: () => void;
  export const Ns: unknown;
  export const Ps: () => void;
  export const lg: (props: Record<string, unknown>) => unknown;
  export const nS: unknown;
  export const rS: unknown;
  export const ug: () => void;
  export const ag: () => void;
  /** Worktree onboarding analytics event descriptor。 */
  export const MA: unknown;
  /** check icon asset（Wallet enrollment 成功态）。 */
  export const vD: IconAssetPreset;
  /** Automation fallback icon（未设置 emoji 的 schedule row）。 */
  export const wy: (props: Record<string, unknown>) => unknown;
  export interface MessageDescriptor {
    id: string;
    defaultMessage?: string;
    description?: string | Record<string, unknown>;
  }
  export type MessagePrimitive = boolean | Date | null | number | string | undefined;
  export type MessageValue =
    | MessagePrimitive
    | ((chunks: readonly unknown[]) => unknown);
  export type MessageValues = Record<string, MessageValue>;
  export interface IntlShape {
    locale?: string;
    textComponent?: unknown;
    formatDate(
      value: string | number | Date,
      options?: Intl.DateTimeFormatOptions,
    ): string;
    formatMessage(
      descriptor: MessageDescriptor,
      values?: MessageValues,
      options?: { ignoreTag?: boolean },
    ): string | readonly unknown[];
    formatMessage(
      descriptor: MessageDescriptor,
      values?: Record<string, unknown>,
      options?: { ignoreTag?: boolean },
    ): string;
    formatNumber(value: number, options: Intl.NumberFormatOptions): string;
    formatNumberToParts(
      value: number,
      options: Intl.NumberFormatOptions,
    ): Intl.NumberFormatPart[];
    formatRelativeTime(
      value: number,
      unit: Intl.RelativeTimeFormatUnit,
      options?: Intl.RelativeTimeFormatOptions,
    ): string;
    formatTime(value: string | number | Date, options?: Intl.DateTimeFormatOptions): string;
  }
  export interface FormattedMessageProps extends MessageDescriptor {
    values?: MessageValues;
    children?: (chunks: readonly unknown[]) => unknown;
    tagName?: unknown;
    ignoreTag?: boolean;
  }
  export interface ToastManager {
    danger(
      message: string,
      options?: { errorAnalytics?: { toastId: string } },
    ): void;
    success(message: string): void;
  }
  export interface TextSelectionLike {
    readonly $from?: { nodeBefore?: { isText?: boolean; text?: string } };
    readonly from: number;
  }
  export const Ct: () => void;
  export const dw: IconAssetPreset;
  export const n4: () => IntlShape;
  export const pk: ScopedSignal<unknown, ToastManager>;
  export const rQ: {
    atEnd(document: unknown): TextSelectionLike;
    create(document: unknown, position: number): TextSelectionLike;
  };
  export const wt: IconAssetPreset;
  export const Yd: IconAssetPreset;
  export const Xi: unknown;
  /** FormattedMessage（app-shared/ui/intl.ts，内部 Gg）。 */
  export const Y2: (props: FormattedMessageProps) => unknown;
  /** defineMessages（内部 oae）。 */
  export const G2: <const Messages extends Record<string, MessageDescriptor>>(
    messages: Messages,
  ) => Messages;
  /** defineMessage（内部 sae）。 */
  export const W2: <const Descriptor extends MessageDescriptor>(
    descriptor: Descriptor,
  ) => Descriptor;
  export const Yi: () => void;
  /** AppScope（app-shared/runtime/atom-signal.ts，内部 YW）。 */
  export const ZI: MaitaiScope<Record<string, unknown>>;
  export const __: unknown;
  export const b_: unknown; // React use（ait）
  export const ek: () => void;
  export const fk: unknown;
  export const g_: () => void;
  /** initializeClassNames（app-shared/ui/class-names.ts，内部 Eh）。 */
  export const h4: () => void;
  export const i$: unknown;
  export const iW: (path: string) => string;
  export const lk: () => void;
  export const wL: () => void;
  /** shell executable 到用户可见标签的映射。 */
  export const RR: Record<string, string>;
  /** 读取指定宿主能力开关。 */
  export const VJ: (capabilities: unknown, capability: string) => boolean;
  export const oq: string;
  export type TooltipSide = "top" | "right" | "bottom" | "left";
  export type TooltipAlign = "start" | "center" | "end";
  export type TooltipVariant =
    | "tooltip" | "rich" | "coachmark" | "unstyled"
    | "floating-navigation-rail";
  export type TooltipColor = "default" | "surface" | "inverse";
  export type TooltipOpenWhen =
    | "always" | "trigger-overflows" | "visibility-target-hidden";
  export interface TooltipEvent {
    currentTarget?: unknown;
    defaultPrevented?: boolean;
    key?: string;
    pointerType?: string;
    preventDefault?(): void;
    stopPropagation?(): void;
  }
  export interface TooltipProps extends Record<string, unknown> {
    children?: unknown;
    tooltipContent?: unknown;
    shortcut?: string;
    disabled?: boolean;
    delayOpen?: boolean;
    delayDuration?: number;
    getDelayDuration?: (event: TooltipEvent, duration: number) => number;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    triggerPopupOpen?: boolean;
    disableHoverOpen?: boolean;
    closeOnTriggerClick?: boolean;
    closeOnTriggerBlur?: boolean;
    closeOnPointerLeave?: boolean;
    closeOnWindowBlur?: boolean;
    triggerAsChild?: boolean;
    cloneCustomTrigger?: boolean;
    triggerRef?: unknown;
    triggerElement?: unknown;
    positioningElement?: unknown;
    forceMount?: boolean;
    selectable?: boolean;
    interactive?: boolean;
    keyboardNavigation?: boolean;
    scaleAvailableSizeWithZoom?: boolean;
    disablePadding?: boolean;
    color?: TooltipColor;
    variant?: TooltipVariant;
    side?: TooltipSide;
    sideOffset?: number;
    align?: TooltipAlign;
    alignOffset?: number;
    flipAlignment?: boolean;
    tooltipClassName?: string;
    tooltipBodyClassName?: string;
    tooltipId?: string;
    tooltipMaxWidth?: string | number;
    openWhen?: TooltipOpenWhen;
    portalContainer?: unknown;
    className?: string;
  }
  /** Tooltip（app-shared/ui/tooltip.ts，内部 M3）。 */
  export const o_: (props: TooltipProps) => unknown;
  /** initializeTooltip（内部 U3）。 */
  export const c_: () => void;
  export interface MenuEvent {
    defaultPrevented?: boolean;
    key?: string;
    metaKey?: boolean;
    ctrlKey?: boolean;
    preventDefault(): void;
    stopPropagation(): void;
    currentTarget?: { select?(): void };
  }
  export interface MenuBaseProps extends Record<string, unknown> {
    children?: unknown;
    className?: string;
    disabled?: boolean;
  }
  export interface MenuContentProps extends MenuBaseProps {
    align?: "start" | "center" | "end";
    sideOffset?: number;
    size?: "default" | "large" | "descriptive" | "select";
    surface?: "menu" | "panel" | "glass" | "chatgpt" | "bare";
    variant?: "default" | "attached" | "picker";
    style?: Record<string, unknown>;
  }
  export interface MenuItemProps extends MenuBaseProps {
    asChild?: boolean;
    href?: string;
    onClick?: (event: MenuEvent) => void;
    onSelect?: (event: MenuEvent) => void;
    isActive?: boolean;
    focusableWhenDisabled?: boolean;
    leftIcon?: unknown;
    rightIcon?: unknown;
    keyboardShortcut?: unknown;
    rightText?: unknown;
    SubText?: unknown;
    tone?: "default" | "danger";
    variant?: "default" | "hint" | "label" | "display" | "detail" | "unstyled";
    allowWrap?: boolean;
    subTextAllowWrap?: boolean;
    textOverflow?: "ellipsis" | "fade";
    tooltipText?: unknown;
    tooltipDisabled?: boolean;
    tooltipSide?: TooltipSide;
    tooltipAlign?: TooltipAlign;
    tooltipOpenWhen?: TooltipOpenWhen;
  }
  export interface MenuCheckboxItemProps extends MenuBaseProps {
    checked?: boolean;
    closeOnSelect?: boolean;
    href?: string;
    indicator?: "checkmark" | "switch";
    leftIcon?: unknown;
    onSelect?: (event: MenuEvent) => void;
    SubText?: unknown;
  }
  export interface MenuRadioItemProps extends MenuBaseProps {
    value?: string;
    href?: string;
    icon?: unknown;
    SubText?: unknown;
    variant?: "default" | "icon" | "swatch" | "chatgpt";
  }
  export interface MenuInputProps extends Record<string, unknown> {
    className?: string;
    onKeyDown?: (event: MenuEvent) => void;
  }
  export interface MenuSearchInputProps extends MenuInputProps {
    inputClassName?: string;
    sticky?: boolean;
    trailingContent?: unknown;
    variant?: "default" | "inset";
  }
  export interface MenuElement {
    type: unknown;
    props: Record<string, unknown>;
  }
  export interface MenuComponents {
    Trigger: (props: MenuBaseProps) => unknown;
    Content: (props: MenuContentProps) => unknown;
    Item: (props: MenuItemProps) => unknown;
    ItemSlot: (props: MenuBaseProps) => unknown;
    CheckboxItem: (props: MenuCheckboxItemProps) => unknown;
    RadioGroup: (props: MenuBaseProps) => unknown;
    RadioItem: (props: MenuRadioItemProps) => unknown;
    ItemIcon: (
      props: MenuBaseProps & { size?: "xs" | "sm" | "base" | "md" },
    ) => unknown;
    Input: (props: MenuInputProps) => unknown;
    SearchInput: (props: MenuSearchInputProps) => unknown;
    Separator: (
      props: MenuBaseProps & { variant?: "default" | "chatgpt" },
    ) => unknown;
    SectionLabel: (props: MenuBaseProps) => unknown;
    Message: (
      props: MenuBaseProps & {
        tone?: "muted" | "error";
        compact?: boolean;
        centered?: boolean;
        variant?: "default" | "chatgpt";
      },
    ) => unknown;
    Title: (props: MenuBaseProps) => unknown;
    SubmenuItem: (props: {
      trigger: MenuElement;
      children?: unknown;
      isDefaultOpen?: boolean;
      onOpenChange?: (open: boolean) => void;
    }) => unknown;
    FlyoutSubmenuItem: (props: MenuItemProps) => unknown;
    Group: (props: MenuBaseProps) => unknown;
    Section: (props: MenuBaseProps) => unknown;
  }
  /** Menu（app-shared/ui/menu.ts，内部 O7）。 */
  export const jf: MenuComponents;
  /** initializeMenu（内部 jft）。 */
  export const If: () => void;
  export type DropdownContentWidth =
    | "icon" | "xs" | "sm" | "menuNarrow" | "menu" | "menuFixed"
    | "menuBounded" | "menuWide" | "sidebar" | "workspace" | "panel"
    | "panelWide" | "panelExtraWide";
  export type DropdownContentMaxHeight =
    | "compact" | "list" | "tall" | "composerPlugins";
  export interface DropdownEvent {
    defaultPrevented?: boolean;
    preventDefault?(): void;
    stopPropagation?(): void;
  }
  export interface DropdownMenuProps extends Record<string, unknown> {
    triggerButton: MenuElement;
    disabled?: boolean;
    children?: unknown;
    modal?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    dir?: "ltr" | "rtl";
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    sideOffset?: number;
    alignOffset?: number;
    contentRef?: unknown;
    onContentFocus?: (event: DropdownEvent) => void;
    onContentKeyDownCapture?: (event: DropdownEvent) => void;
    onContentPointerDownCapture?: (event: DropdownEvent) => void;
    onContentPointerEnter?: (event: DropdownEvent) => void;
    onContentPointerLeave?: (event: DropdownEvent) => void;
    onOpenAutoFocus?: (event: DropdownEvent) => void;
    onCloseAutoFocus?: (event: DropdownEvent) => void;
    onEscapeKeyDown?: (event: DropdownEvent) => void;
    contentClassName?: string;
    contentVariant?: "default" | "attached" | "picker";
    contentStyle?: Record<string, unknown>;
    size?: "default" | "large" | "descriptive" | "select";
    surface?: "menu" | "panel" | "glass" | "chatgpt" | "bare";
    contentWidth?: DropdownContentWidth;
    matchTriggerWidth?: boolean;
    contentMaxHeight?: DropdownContentMaxHeight;
    portalContainer?: unknown;
  }
  /** DropdownMenu（app-shared/ui/dropdown-menu.ts，内部 xft）。 */
  export const kf: (props: DropdownMenuProps) => unknown;
  export type ContextMenuItemType =
    | "item" | "checkbox" | "radio" | "label" | "separator";
  export interface ContextMenuMessage {
    id: string;
    defaultMessage?: string;
  }
  export interface ContextMenuItem {
    id: string;
    type?: ContextMenuItemType;
    message?: ContextMenuMessage;
    messageValues?: Record<string, unknown>;
    tooltipMessage?: ContextMenuMessage;
    tooltipMessageValues?: Record<string, unknown>;
    checked?: boolean;
    closeOnSelect?: boolean;
    icon?: unknown;
    accelerator?: string;
    enabled?: boolean;
    href?: string;
    onClick?: (event: ContextMenuEvent) => void;
    onSelect?: () => void;
    selectAfterClose?: boolean;
    tone?: "default" | "danger";
    submenu?: ContextMenuItem[];
  }
  export interface PreparedContextMenuItem extends ContextMenuItem {
    nativeLabel: string;
    nativeTooltip?: string;
    submenu?: PreparedContextMenuItem[];
  }
  export interface ContextMenuEvent {
    altKey?: boolean;
    ctrlKey?: boolean;
    defaultPrevented?: boolean;
    key?: string;
    metaKey?: boolean;
    shiftKey?: boolean;
    target?: unknown;
    currentTarget?: unknown;
    preventDefault(): void;
    stopPropagation(): void;
  }
  export interface ContextMenuCloseEvent {
    defaultPrevented: boolean;
    preventDefault(): void;
  }
  export interface ContextMenuProps extends Record<string, unknown> {
    items?: ContextMenuItem[];
    getItems?: () => ContextMenuItem[] | Promise<ContextMenuItem[]>;
    children: MenuElement;
    trigger?: "click" | "contextmenu";
    disableNative?: boolean;
    align?: "start" | "center" | "end";
    contentWidth?: "menu" | "trigger" | number | string;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
    onCloseAutoFocus?: (event: ContextMenuCloseEvent) => void;
    renderItem?: (item: PreparedContextMenuItem) => unknown;
    shortcuts?: Record<string, string>;
    awaitBeforeOpen?: boolean;
    onBeforeOpen?: () => void | Promise<void>;
  }
  /** ContextMenu（app-shared/ui/context-menu.ts，内部 Ift）。 */
  export const Df: (props: ContextMenuProps) => unknown;
  /** initializeContextMenu（内部 Kft）。 */
  export const Of: () => void;
  /** createDerivedFamily（app-shared/runtime/atom-signal.ts，内部 Sje）。 */
  export const rZ: <TScope, Param, TValue>(
    scope: MaitaiScope<TScope>,
    derive: (
      parameter: Param,
      context: DerivedScopedSignalContext<TScope>,
    ) => TValue,
    options?: ScopedDerivedFamilyOptions<Param, TValue>,
  ) => ScopedDerivedFamily<TScope, Param, TValue>;
  /** createExternalSignal（app-shared/runtime/atom-signal.ts，内部 vje）。 */
  export const dZ: <TScope, TValue>(
    scope: MaitaiScope<TScope>,
    initialValue:
      | TValue
      | ((context: DerivedScopedSignalContext<TScope>) => TValue),
    subscribe: (
      context: ScopedExternalSignalContext<TScope, TValue>,
    ) => ScopedExternalSignalCleanup | PromiseLike<ScopedExternalSignalCleanup>,
    options?: ScopedDerivedSignalOptions<TValue>,
  ) => ScopedExternalSignal<TScope, TValue>;
  /** createExternalSignalFamily（app-shared/runtime/atom-signal.ts，内部 xje）。 */
  export const iZ: <TScope, Param, TValue>(
    scope: MaitaiScope<TScope>,
    initialValue:
      | TValue
      | ((
          parameter: Param,
          context: DerivedScopedSignalContext<TScope>,
        ) => TValue),
    subscribe: (
      parameter: Param,
      context: ScopedExternalSignalContext<TScope, TValue>,
    ) => ScopedExternalSignalCleanup | PromiseLike<ScopedExternalSignalCleanup>,
    options?: ScopedDerivedFamilyOptions<Param, TValue>,
  ) => ScopedExternalSignalFamily<TScope, Param, TValue>;
  /** createDerivedSignal（app-shared/runtime/atom-signal.ts，内部 PI）。 */
  export const sZ: <TScope, TValue>(
    scope: MaitaiScope<TScope>,
    derive: (context: DerivedScopedSignalContext<TScope>) => TValue,
    options?: ScopedDerivedSignalOptions<TValue>,
  ) => ScopedDerivedSignal<TScope, TValue>;
  /** createQuerySignal（app-shared/runtime/atom-signal.ts，内部 Bje）。 */
  export const eZ: <TScope, TData, TError = Error>(
    scope: MaitaiScope<TScope>,
    getOptions: (
      context: DerivedScopedSignalContext<TScope>,
    ) => ScopedQueryOptions<TData, TError>,
  ) => ScopedQuerySignal<TScope, TData, TError>;
  /** createQueryFamily（app-shared/runtime/atom-signal.ts，内部 Vje）。 */
  export const QX: <TScope, Param, TData, TError = Error>(
    scope: MaitaiScope<TScope>,
    getOptions: (
      parameter: Param,
      context: DerivedScopedSignalContext<TScope>,
    ) => ScopedQueryOptions<TData, TError>,
    options?: ScopedQueryFamilyOptions<Param>,
  ) => ScopedQueryFamily<TScope, Param, TData, TError>;
  /** createInfiniteQuerySignal（app-shared/runtime/atom-signal.ts，内部 zje）。 */
  export const tZ: <TScope, TPage, TPageParam, TError = Error>(
    scope: MaitaiScope<TScope>,
    getOptions: (
      context: DerivedScopedSignalContext<TScope>,
    ) => ScopedInfiniteQueryOptions<TPage, TPageParam, TError>,
  ) => ScopedInfiniteQuerySignal<TScope, TPage, TPageParam, TError>;
  /** createInfiniteQueryFamily（app-shared/runtime/atom-signal.ts，内部 Hje）。 */
  export const XX: <TScope, Param, TPage, TPageParam, TError = Error>(
    scope: MaitaiScope<TScope>,
    getOptions: (
      parameter: Param,
      context: DerivedScopedSignalContext<TScope>,
    ) => ScopedInfiniteQueryOptions<TPage, TPageParam, TError>,
    options?: ScopedQueryFamilyOptions<Param>,
  ) => ScopedInfiniteQueryFamily<TScope, Param, TPage, TPageParam, TError>;
  /** createMutationSignal（app-shared/runtime/atom-signal.ts，内部 Wje）。 */
  export const YX: <
    TScope,
    TData,
    TError = Error,
    TVariables = void,
    TContext = unknown,
  >(
    scope: MaitaiScope<TScope>,
    getOptions: (
      context: DerivedScopedSignalContext<TScope>,
    ) => ScopedMutationOptions<TData, TError, TVariables, TContext>,
  ) => ScopedMutationSignal<TScope, TData, TError, TVariables, TContext>;
  /** createMutationFamily（app-shared/runtime/atom-signal.ts，内部 Uje）。 */
  export const JX: <
    TScope,
    Param,
    TData,
    TError = Error,
    TVariables = void,
    TContext = unknown,
  >(
    scope: MaitaiScope<TScope>,
    getOptions: (
      parameter: Param,
      context: DerivedScopedSignalContext<TScope>,
    ) => ScopedMutationOptions<TData, TError, TVariables, TContext>,
    options?: ScopedMutationFamilyOptions<Param>,
  ) => ScopedMutationFamily<TScope, Param, TData, TError, TVariables, TContext>;
  export type ClassDictionary = Record<string, unknown>;
  export interface ClassArray extends Array<ClassValue> {}
  export type ClassValue =
    | ClassArray
    | ClassDictionary
    | bigint
    | boolean
    | null
    | number
    | string
    | undefined;
  /** classNames（app-shared/ui/class-names.ts，内部 J）。 */
  export const m4: (...values: ClassValue[]) => string;
  /** getRetainedScopeState（app-shared/runtime/atom-signal.ts，内部 dje）。 */
  export const mZ: <T>(
    activeScope: MaitaiScopeApi<unknown>,
    scope: MaitaiScope<T>,
    key: unknown,
  ) => MaitaiScopeApi<T> | null;
  export const n$: unknown;
  /** createSignalFamily（app-shared/runtime/atom-signal.ts，内部 bje）。 */
  export const oZ: <TScope, Param, TValue>(
    scope: MaitaiScope<TScope>,
    initialValue:
      | TValue
      | ((parameter: Param, context: DerivedScopedSignalContext<TScope>) => TValue),
    signalOptions?: ScopedSignalFamilyValueOptions<TScope, Param, TValue>,
    familyOptions?: ScopedSignalFamilyOptions<Param>,
  ) => ScopedSignalFamily<TScope, Param, TValue>;
  /** createScopedSignal（app-shared/runtime/atom-signal.ts，内部 kI）。 */
  export const pZ: <TScope, TValue>(
    scope: MaitaiScope<TScope>,
    initialValue:
      | TValue
      | ((context: ScopedSignalInitializerContext<TScope>) => TValue),
    options?: ScopedSignalOptions<TScope, TValue>,
  ) => ScopedSignal<TScope, TValue>;
  export interface AnimationPlaybackControls {
    stop(): void;
  }
  export const qQ: (
    from: number,
    to: number,
    options: {
      duration: number;
      ease: readonly [number, number, number, number];
      onComplete(): void;
      onUpdate(value: number): void;
    },
  ) => AnimationPlaybackControls;
  /** initializeQueryRuntime（查询客户端与 React bridge 的基础装配）。 */
  export const qm: () => void;
  export const r$: unknown;
  export const t$: unknown;
  export const x_: unknown; // useIconScaleContext（_3）
  export const y_: unknown;
  export const G4: <Key extends string, Value>(
    key: SafeParseSchema<Key>,
    value: SafeParseSchema<Value>,
  ) => RecordSchema<Key, Value>;
  export const Gs: unknown; // jbt：pin-window-light-16 IconAsset
  export const H3: () => void; // detachedWindow 入口的 preload helper
  export const RI: {
    (): void;
    (...segments: string[]): string;
  }; // nG：路径工具惰性初始化器与初始化后的 join 实现
  /** Vite preload helper：预取依赖后执行动态 import。 */
  export const V3: <Loaded>(
    load: () => Promise<Loaded>,
    dependencies: readonly string[],
    importerUrl: string,
  ) => Promise<Loaded>;
  export const VI: (path: string) => string; // QW：路径分隔符规范化
  export interface RendererHostMessage extends Record<string, unknown> {
    type: string;
  }
  export type RendererHostMessageReply = (
    type: string,
    payload: Record<string, unknown>,
  ) => void;
  export type RendererHostMessageHandler<
    Message extends RendererHostMessage = RendererHostMessage,
  > = (message: Message, reply: RendererHostMessageReply) => void;
  export interface RendererMessageApi {
    postMessage(message: RendererHostMessage): void;
    getState<T = unknown>(): T | undefined;
    setState<T>(state: T): void;
  }
  export interface RendererHostMessageBridge {
    dispatchMessage(type: string, payload: Record<string, unknown>): void;
    dispatchHostMessage(message: RendererHostMessage): void;
    hasHandledBufferedMessage(message: object): boolean;
    startTestWindowMessageListener(): never;
    stopWindowMessageListener(): void;
    reset(): void;
    subscribe<Message extends RendererHostMessage>(
      type: string,
      handler: RendererHostMessageHandler<Message>,
    ): () => void;
  }
  /** renderer 消息桥单例（app-shared/runtime/message-bridge.ts，内部 re）。 */
  export const G3: RendererHostMessageBridge;
  /** useElectronMessageHandler（内部 ee）。 */
  export const K3: <Message extends RendererHostMessage>(
    type: string,
    handler: RendererHostMessageHandler<Message>,
    dependencies?: readonly unknown[],
  ) => void;
  /** VscodeHostMessageBridge 构造器（内部 R）。 */
  export const U3: {
    new (): RendererHostMessageBridge;
    getInstance(): RendererHostMessageBridge;
    instance: RendererHostMessageBridge | null;
  };
  /** renderer 消息 API（内部 E）。 */
  export const X3: RendererMessageApi;
  /** initializeRendererMessageApi（内部 D）。 */
  export const Y3: () => void;
  /** parseWindowMessageCached（内部 O）。 */
  export const q3: (event: MessageEvent) => RendererHostMessage | null;
  /** initializeHostMessageBridge（内部 z）。 */
  export const W3: () => void;
  /** 独立窗口页面的路径编码、Quick Chat 枚举与调试菜单策略。 */
  export const UB: (conversationId: string) => string;
  export const lY: (conversationId: string) => string;
  export const XN: {
    readonly CODEX_QUICK_CHAT_SURFACE_WINDOW: string;
  };
  export const qN: {
    readonly CODEX_QUICK_CHAT_LIFECYCLE_ACTION_CLOSED: string;
  };
  export const Cq: {
    allowDebugMenu(environment: unknown): boolean;
  };
  export const l3: (left: unknown, right: unknown) => boolean; // Yt：lodash isEqual
  export const zI: unknown;
  // 5.1MB 应用核心：RPC 桥、状态/信号、路由、主题、i18n、UI 基础件。
  // 导出面（数千个压缩名）待 renderer-app-shared-analysis.md 完成后语义化。
  // 目前以 any 占位，重写完成后本声明会移除（源码直接导出真类型）。
  export const _any: any;
}

declare module "@rchunk/portable-attachment-thumbnail" {
  export type PortableAttachmentImportKind =
    | "csv"
    | "docx"
    | "ipynb"
    | "pdf"
    | "pptx"
    | "tex"
    | "tsv"
    | "xlsx";
  export interface PortableAttachmentThumbnailRequest {
    importKind: PortableAttachmentImportKind | null;
    readBytes(signal: AbortSignal): Promise<Uint8Array>;
    signal: AbortSignal;
    size?: number;
  }
  export interface PortableAttachmentThumbnailResult {
    byteLength?: number;
    dataUrl: string | null;
    reason?: "overloaded" | "timeout" | "unsupported";
  }
  export const renderPortableAttachmentThumbnail: (
    request: PortableAttachmentThumbnailRequest,
  ) => Promise<PortableAttachmentThumbnailResult>;
}

declare module "@rchunk/portable-thumbnail-pdf-runtime" {
  export const getPdfjs: () => Promise<{
    GlobalWorkerOptions: { workerSrc?: string };
  }>;
}

declare module "@rchunk/portable-thumbnail-fonts" {
  export const arePopcornSpreadsheetFontsReady: () => boolean;
  export const ensurePopcornSpreadsheetFontsLoaded: () => Promise<void>;
}

declare module "@rchunk/portable-thumbnail-font-face-sources" {
  export const getPopcornCarlitoFontFaceSourcesFromDocument: () => unknown[];
  export const getPopcornFontDebugState: () => unknown;
  export const installPopcornFontFaces: (
    fonts: readonly unknown[],
  ) => Promise<void>;
}

declare module "@rchunk/thumbnail-worker-font-faces" {
  export interface FontFaceSource { family: string; format: string; src: string; style: string; unicodeRange?: string; weight: string; }
  export const getPopcornCarlitoFontFaceSourcesFromDocument: () => FontFaceSource[];
  export const getPopcornFontDebugState: () => Record<string, unknown>;
  export const installPopcornFontFaces: (fonts: readonly FontFaceSource[]) => Promise<void>;
}

declare module "@rchunk/thumbnail-worker-shape-presets" {
  export const installPresetShapeDefinitions: () => void;
}

declare module "@rchunk/thumbnail-worker-presentation-model" {
  export interface PresentationSlide {
    frame: { height: number; width: number };
  }
  export interface PresentationDocument {
    slides: { items: PresentationSlide[] };
  }
  export const Presentation: {
    load(value: unknown): PresentationDocument;
  };
  export const Workbook: {
    fromCSV(text: string, options?: { separator: string }): Promise<unknown> | unknown;
    load(value: unknown): unknown;
  };
  export const drawSlideToCtx: (
    slide: PresentationSlide,
    presentation: PresentationDocument,
    context: OffscreenCanvasRenderingContext2D,
    resources: readonly unknown[],
  ) => Promise<void> | void;
}

declare module "@rchunk/thumbnail-worker-workbook-renderer" {
  export const renderWorkbook: (
    workbook: unknown,
    options: {
      center: "A1";
      headers: false;
      height: number;
      scale: 1;
      sheetIndex: 0;
      width: number;
    },
  ) => Promise<Blob> | Blob;
}

declare module "@rchunk/thumbnail-worker-walnut-reader" {
  export interface WalnutReaderExports {
    DocxReader: { ExtractDocxProto(bytes: Uint8Array, includeUnknown: false): Uint8Array };
    PptxReader: { ExtractSlidesProto(bytes: Uint8Array, includeUnknown: false): Uint8Array };
    XlsxReader: { ExtractXlsxProto(bytes: Uint8Array, includeUnknown: false): Uint8Array };
  }
  export const getPopcornWalnutReaderExports: (
    resourceBaseUrl: URL,
  ) => Promise<WalnutReaderExports>;
}

declare module "@rchunk/thumbnail-worker-presentation-proto" {
  export const Presentation: { decode(bytes: Uint8Array): unknown };
}

declare module "@rchunk/thumbnail-worker-document-proto" {
  export const Document: { decode(bytes: Uint8Array): unknown };
}

declare module "@rchunk/thumbnail-worker-document-model" {
  export interface ThumbnailDocumentModel {
    pagePaintContext: {
      chartsById: unknown;
      pageBackgroundFill: unknown;
      themeMap: unknown;
    };
  }
  export const DocumentModel: {
    load(value: unknown): ThumbnailDocumentModel;
  };
}

declare module "@rchunk/thumbnail-worker-document-renderer" {
  import type { ThumbnailDocumentModel } from "@rchunk/thumbnail-worker-document-model";
  export interface ThumbnailDocumentPage {
    heightPx: number;
    widthPx: number;
  }
  export const layoutDocumentPages: (
    document: ThumbnailDocumentModel,
    context: OffscreenCanvasRenderingContext2D,
  ) => ThumbnailDocumentPage[];
  export const preloadDocumentImageBitmaps: (
    document: ThumbnailDocumentModel,
    pages: readonly ThumbnailDocumentPage[],
  ) => Promise<ReadonlyMap<unknown, ImageBitmap>>;
  export const paintRenderedDocumentPage: (
    context: OffscreenCanvasRenderingContext2D,
    page: ThumbnailDocumentPage,
    themeMap: unknown,
    chartsById: unknown,
    pageBackgroundFill: unknown,
    images: ReadonlyMap<unknown, ImageBitmap>,
    selection: undefined,
    options: { drawPageOutline: false },
  ) => void;
}

declare module "@rchunk/thumbnail-worker-spreadsheet-proto" {
  export const Workbook: { decode(bytes: Uint8Array): unknown };
}

declare module "@rchunk/thumbnail-worker-pdf-runtime" {
  export const GlobalWorkerOptions: { workerPort?: Worker };
  export const getDocument: (options: {
    CanvasFactory: new () => unknown;
    data: Uint8Array;
    disableFontFace: true;
    isEvalSupported: false;
  }) => {
    destroy(): Promise<void>;
    promise: Promise<{
      getPage(pageNumber: 1): Promise<{
        getViewport(options: { scale: number }): { height: number; width: number };
        render(options: {
          canvas: null;
          canvasContext: OffscreenCanvasRenderingContext2D;
          viewport: { height: number; width: number };
        }): { promise: Promise<void> };
      }>;
    }>;
  };
}

declare module "@rchunk/app-initial" {
  export const aa: (props: Record<string, unknown>) => unknown;
  export const oa: (props: Record<string, unknown>) => unknown;
  export const Yg: (props: Record<string, unknown>) => unknown;
  export const gb: (props: Record<string, unknown>) => unknown;
  export const bRt: (
    scope: unknown,
    imageFile: unknown,
    signal: AbortSignal,
  ) => Promise<Blob & { name: string }>;
  export const yRt: () => void;
  export const BGt: (blob: Blob) => Blob | Promise<Blob>;
  export const Dan: (blob: Blob) => Promise<string>;
  export const KGt: (
    fileId: string,
    options: { downloadIntent: boolean },
  ) => Promise<Blob>;
  /** 恢复会话相关信号与宿主服务适配器。 */
  export const B8t: (
    scope: unknown,
    identity: { hostId: string; threadId: string },
    error: unknown,
  ) => boolean;
  export const DZt: unknown;
  export const Jmn: (error: unknown) => boolean;
  export const VZt: unknown;
  export const Vsn: (scope: unknown, hostId: string) => unknown;
  export const Yon: (
    scope: unknown,
    conversationId: string,
    options: { allowProjectSourceRoots: boolean },
  ) => Promise<unknown>;
  export const o0t: unknown;
  export const p4: (conversationId: string | null) => { activeMode?: unknown };
  export const ul: (error: unknown) => boolean;
  export const au: (props: Record<string, unknown>) => unknown;
  export const ddn: new (options: Record<string, unknown>) => unknown;
  export const oJt: (...arguments_: unknown[]) => Record<string, string>;
  export const pdn: () => void;
  export const su: () => void;
  export const A_: (entry: Record<string, unknown>) => boolean;
  export const A9t: (input: Record<string, unknown>) => boolean;
  export const D9t: (input: Record<string, unknown>) => boolean;
  export const E9t: () => void;
  export const Fut: () => void;
  export const Grn: (text: unknown, preserve: boolean) => { content: string; removed: boolean };
  export const H9t: (resourcePath: string) => boolean;
  export const Hnn: () => void;
  export const Knn: () => void;
  export const Krn: () => void;
  export const Put: (input: Record<string, unknown>) => Array<Record<string, unknown>>;
  export const T9t: (input: Record<string, unknown>) => Array<Record<string, unknown>>;
  export const V9t: () => void;
  export const bQt: unknown;
  export const ein: () => void;
  export const i$t: unknown;
  export const k9t: () => void;
  export const k_: () => void;
  export const nWt: () => void;
  export const tin: (turn: Record<string, unknown>) => boolean;
  export const w9t: (artifacts: unknown) => unknown[];
  export const yhn: (input: Record<string, unknown>) => { artifactScanContent: unknown };
  export const AUt: () => void;
  export const CUt: () => void;
  export const DUt: (mutations: MutationRecord[]) => boolean;
  export const EUt: (input: Record<string, unknown>) => void;
  export const OUt: (text: string, start: number, end: number) => unknown;
  export const PUt: (input: Record<string, unknown>, signal?: AbortSignal) => Promise<Record<string, unknown> | null>;
  export const SUt: (text: string, query: string, limit: number) => { offsets: Array<{ end: number; start: number }>; totalMatches: number };
  export const TUt: (element: Element, selected: boolean) => void;
  export const _D: () => void;
  export const _Ut: (turnKey: string, unitId: string) => string;
  export const gUt: (location: Record<string, unknown>) => string;
  export const gmn: () => void;
  export const hUt: (container: ParentNode, options: { includeShadowRoots: boolean }) => void;
  export const iD: unknown;
  export const jUt: (text: string, range: { end: number; start: number }) => { end: number; start: number };
  export const kUt: (text: string, query: string, limit: number) => { offsets: Array<{ end: number; start: number }>; totalMatches: number };
  export const tD: unknown;
  export const wUt: unknown;
  export const xUt: (input: { container: ParentNode; includeShadowRoots?: boolean; matchId: string }) => Element | null;
  export const yUt: () => HTMLElement;
  export const Brn: (serverName: string) => string;
  export const Drn: () => void;
  export const Ern: (input: Record<string, unknown>) => Record<string, unknown> | null;
  export const F9t: (content: unknown) => Record<string, unknown> | null;
  export const I9t: () => void;
  export const M9t: (toolName: string) => string;
  export const M_n: (tree: unknown, visitor: (...arguments_: unknown[]) => void) => void;
  export const N9t: () => void;
  export const P9t: (call: Record<string, unknown>) => boolean;
  export const P_n: () => void;
  export const Vrn: () => void;
  export const ZGt: (input: { url: string }) => Record<string, unknown> | null;
  export const _hn: (content: unknown) => unknown[];
  export const dmn: (input: { attachments: unknown[]; input: unknown[] }) => Array<Record<string, unknown>>;
  export const fmn: () => void;
  export const hmn: () => void;
  export const j9t: (toolName: string) => string;
  export const mmn: (attachment: Record<string, unknown>) => string;
  export const non: (markdown: string) => unknown;
  export const pnn: (turn: Record<string, unknown>, call: Record<string, unknown>) => Record<string, unknown>;
  export const ton: () => void;
  export const vhn: () => void;
  export const wrn: () => void;
  export const yrn: string;
  // 15MB 聚合块：应用启动逻辑 + Shiki 语法 grammars + math/learning blocks。
  export type ConnectorCatalogApp =
    import("@rchunk/app-info").ConnectorApp & {
      pluginDisplayNames: string[];
    };
  export interface ConnectorAppsQueryOptions {
    appIds: string[];
    hostId?: string;
  }
  export interface ConnectorAppsQueryResult {
    data?: ConnectorCatalogApp[];
    isFetching: boolean;
    isPending: boolean;
    refetch(): unknown;
  }
  /** initializeConnectorAppsQuery（内部 Emn）。 */
  export const B$: () => void;
  /** useConnectorAppsQuery（内部 Omn）。 */
  export const V$: (
    options: ConnectorAppsQueryOptions,
  ) => ConnectorAppsQueryResult;
  export interface MultiAgentFeature {
    enabled?: boolean;
    name?: string;
  }
  export interface UsageQueryData {
    rate_limit_reset_credits?: { available_count?: number };
  }
  export interface UsageQueryResult {
    data?: UsageQueryData | null;
    isLoading?: boolean;
  }
  export interface RateLimitResetDialogProps extends Record<string, unknown> {
    initialAvailableCount: number;
    isRateLimitReached: boolean;
    onResetComplete(): void;
  }
  export const dun: <Value>(
    key: string,
    initialValue: Value,
    options?: {
      coerceStoredValue?(value: unknown): Value;
    },
  ) => import("@rchunk/app-shared").ScopedSignal<
    Record<string, unknown>,
    Value
  >;
  export const Dt: () => Promise<unknown>;
  export const Et: () => void;
  export const FG: unknown;
  export const IG: unknown;
  export const PG: () => void;
  export const ngn: <Value = unknown>(key: string, fallback?: Value) => Value;
  /** initializePreferenceRuntime（偏好信号运行时初始化器）。 */
  export const rgn: () => void;
  export const kI: () => unknown;
  export const jyt: (host: unknown) => { hostId: string };
  export const nN: () => boolean;
  export const ont: import("@rchunk/app-shared").ScopedQueryFamily<
    Record<string, unknown>,
    string,
    MultiAgentFeature[]
  >;
  export const Gfn: (
    key: "composer_prefill",
  ) => [
    unknown,
    (value: { text: string }) => void,
  ];
  export const cnt: (options: { hostId: string }) => {
    mutateAsync(input: {
      enabled: boolean;
      featureName: string;
    }): Promise<unknown>;
  };
  export const ugn: string;
  export const f0t: import("@rchunk/app-shared").ReadableSignal<UsageQueryResult>;
  export const i5: (
    data: UsageQueryData | null,
  ) => { remainingPercent: number } | null;
  export interface TelemetrySession {
    getContext?(): {
      user?: { customIDs?: { account_id?: string | null } };
    };
  }
  export const lfn: () => TelemetrySession | undefined;
  export const rfn: (context: unknown, experimentId: string) => Experiment;
  export const $M: (
    experiment: unknown,
    options: {
      currentAccount: Account | undefined;
      disableExposureLog: boolean;
    },
  ) => { config: { remainingThresholdPercent: number } };
  export const vP: ManagedDialogComponent<RateLimitResetDialogProps>;
  export const Kot: (props: { className?: string }) => unknown;
  export const n6: (props: { className?: string }) => unknown;
  export const r6: () => void;
  export interface WorkspaceState {
    cwd: string;
    hostId: string;
    isCodexWorktree?: boolean;
    kind: string;
  }
  export interface ProjectKey {
    cwd: string;
    hostId: string;
  }
  export type ProjectRunMode = "local" | "remote" | string;
  export const mdt: import("@rchunk/app-shared").ReadableSignal<WorkspaceState>;
  export const Vfn: (hostId: string) => unknown;
  export const kst: (project: ProjectKey) => ProjectKey;
  export const Q4: import("@rchunk/app-shared").SignalFamily<
    ProjectKey,
    ProjectRunMode
  >;
  export const kht: import("@rchunk/app-shared").MaitaiScope<
    Record<string, unknown>
  >;
  export interface ComposerEditorLike {
    focus?(): void;
    hasText(): boolean;
    view: { state: unknown };
  }
  export const $Bt: () => void;
  export const HZ: () => ComposerEditorLike;
  export const M9: () => void;
  export const N9: (query: string) => boolean;
  export const NIt: import("@rchunk/app-shared").ScopedSignalFamily<
    Record<string, unknown>,
    unknown,
    unknown[]
  >;
  export const RIt: () => void;
  export const UZ: <Value>(
    value: Value | undefined,
    predicate: (value: Value) => boolean,
  ) => boolean;
  export const VZ: () => void;
  export const Vln: (planType: unknown) => boolean;
  export const Xet: import("@rchunk/app-shared").ScopedSignalFamily<
    Record<string, unknown>,
    { name: string },
    { isCapable?: boolean }
  >;
  export const YBt: import("@rchunk/app-shared").ReadableSignal<{
    data?: Array<{ system_hint?: string }>;
  }>;
  export const Zet: () => void;
  export const b2: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    currentModes: unknown,
    nextModes: string[],
  ) => void;
  export const v2: import("@rchunk/app-shared").ScopedSignal<
    Record<string, unknown>,
    unknown
  >;
  export const vln: () => void;
  export const y2: () => void;
  export const yln: (search: string) => boolean;
  export const Wln: (plan: unknown) => boolean;
  export const eun: (
    scope: import("@rchunk/app-shared").MaitaiScope<Record<string, unknown>>,
    queryName: string,
    getOptions: (domain: string | null) => {
      enabled: boolean;
      params?: { domain: string };
      retry: number;
      staleTime: number;
    },
  ) => unknown;
  export const t3: import("@rchunk/app-shared").ReadableSignal<string>;
  export const pdt: () => void;
  export const Rht: () => void;
  export const uun: () => void;
  /** initializeOffers（套餐优惠状态初始化器）。 */
  export const aI: () => void;
  /** promotionPlanName（从促销 metadata 提取锁定套餐）。 */
  export const eI: (metadata: unknown) => string | null;
  export const jst: () => void;
  export const x3: () => void;
  export const Lb: {
    delete: import("@rchunk/app-shared").MessageDescriptor;
    unarchive: import("@rchunk/app-shared").MessageDescriptor;
  };
  export const Rb: () => void;
  export interface CompactFormDialogProps extends Record<string, unknown> {
    children?: unknown;
    footer?: unknown;
    onClose(): void;
    onSubmit(): void;
    size: "compact" | string;
    subtitle?: unknown;
    title: unknown;
  }
  export const Kat: (props: CompactFormDialogProps) => unknown;
  export const qat: () => void;
  export interface ProductAnalytics {
    logProductEvent(
      event: unknown,
      payload: { link: OnboardingLegalLink },
    ): void;
    flush(timeoutMs: number): Promise<void>;
    submitCodexAnalyticsEvent?(event: {
      action: string;
      eventKind: string;
      metadata: Record<string, unknown>;
      threadId: string;
      turnId: string;
    }): void;
  }
  export type OnboardingLegalLink =
    | "terms"
    | "privacy"
    | "korea-addendum";
  export const As: () => void;
  export const Cpn: import("@rchunk/app-shared").ScopedSignal<
    Record<string, unknown>,
    ProductAnalytics
  >;
  export const an: {
    readonly ACCESS_FLOW_ENTRY_ACTION_TYPE_PAGE_LOADED: string;
  };
  export const on: {
    readonly ACCESS_FLOW_ENTRY_POINT_AUTH_LOGIN_PAGE: string;
  };
  export const sn: {
    readonly ACCESS_FLOW_ENTRY_TRIGGER_AUTOMATIC: string;
  };
  const accessFlowEntryEvent: unknown;
  export { accessFlowEntryEvent as in };
  export const mn: () => void;
  export const cc: () => void;
  export const sc: {
    count(
      namespace: string,
      metric: string,
      fields: Record<string, string>,
    ): void;
  };
  export const Ds: unknown;
  export const Es: {
    CODEX_CHATGPT_ONBOARDING_LEGAL_LINK_TERMS: "terms";
    CODEX_CHATGPT_ONBOARDING_LEGAL_LINK_PRIVACY: "privacy";
    CODEX_CHATGPT_ONBOARDING_LEGAL_LINK_KOREA_ADDENDUM: "korea-addendum";
  };
  export const HNt: {
    FullscreenOnboarding: string;
    HomeAnnouncement: string;
  };
  export interface HomeAnnouncementCandidate {
    content: unknown;
    id?: string;
    isEligible: boolean;
    isLoading: boolean;
    pageContextClaim?: unknown;
  }
  export interface FastModeHomeCandidate extends HomeAnnouncementCandidate {
    fastModeModel: import("@rchunk/app-shared").ServiceTierModel | null;
    setHasSeenFastModeHomeBanner(seen: boolean): void;
    setServiceTier(
      tier: string,
      source: "home_banner",
    ): Promise<unknown> | unknown;
  }
  export interface HomeAnnouncementOverrides {
    fastModeCandidate?: FastModeHomeCandidate;
    homeAnnouncementCandidates?: HomeAnnouncementCandidate[];
  }
  /** Home 公告测试/实验覆盖入口。 */
  export const D0t: () => HomeAnnouncementOverrides;
  /** Home 的 rate-limit-reset 候选。 */
  export const CNt: {
    (): HomeAnnouncementCandidate;
    (beacon: unknown): boolean;
  };
  export const Fk: (entryPoint: string) => (() => unknown) | null | undefined;
  export interface WeeklyRecapCandidate {
    availableCount: number;
    dismiss(): void;
    isEligible: boolean;
    isLoading: boolean;
  }
  export const Nk: () => WeeklyRecapCandidate;
  export const qk: () => boolean | undefined;
  export const kNt: (beacon: unknown) => unknown;
  export const sbt: (options: {
    hideFirstNewThreadOnboardingPromos: boolean;
    pathname: string;
  }) => boolean;
  export const vN: unknown;
  export const JNt: () => void;
  export type SetupCodexStep = "role" | "task" | "complete";
  export interface SetupCodexStepArguments {
    step: SetupCodexStep;
  }
  /** setupCodexStepArgumentsSchema（内部 id）。 */
  export const C_n: import("zod").ZodType<SetupCodexStepArguments>;
  /** initializeOnboardingInteractiveTools（内部 ad）。 */
  export const b_n: () => void;
  export interface GeneratedImageContextMenuImage {
    alt?: string;
    filename?: string;
    id?: string;
    kind?: unknown;
    previewSrc?: string;
    src: string;
    tabTitle?: string;
  }
  export interface GeneratedImageContextMenuIntl {
    formatMessage(
      descriptor: {
        defaultMessage: string;
        description?: string;
        id: string;
      },
      values?: Record<string, unknown>,
    ): string;
  }
  export interface GeneratedImageContextMenuOptions {
    chatGptConversationId?: string;
    displaySrc?: string;
    hostId?: string;
    image: GeneratedImageContextMenuImage;
    imageAssetResolver?: unknown;
    intl: GeneratedImageContextMenuIntl;
    onAddToChat?: () => boolean | void;
    onDownloaded?: () => void;
  }
  export interface GeneratedImageContextMenuItem {
    id:
      | "add-to-chat"
      | "copy-image"
      | "download-a-copy"
      | "open-in-file-manager";
    message: unknown;
    onSelect(): void;
  }
  /** initializeGeneratedImageContextMenu（内部 Dho）。 */
  export const QB: () => void;
  /** getGeneratedImageContextMenuItems（内部 Cho）。 */
  export const ZB: (
    scope: unknown,
    options: GeneratedImageContextMenuOptions,
  ) => GeneratedImageContextMenuItem[];
  export interface ExternalLinkConfirmationDialogProps {
    clickModifiers?: unknown;
    disposition?: unknown;
    href: string;
    hostId?: string;
    initiator?: unknown;
    onClose(): void;
    onDownload?: () => void;
    onOpen?: () => boolean | void;
    openTarget?: unknown;
    openTargetIntent?: unknown;
    originHostId?: string;
    presentationIntent?: unknown;
    source?: string;
    useExternalBrowser?: boolean;
  }
  /** initializeExternalLinkConfirmationDialog（内部 xEi）。 */
  export const ist: () => void;
  /** ExternalLinkConfirmationDialog（内部 yEi）。 */
  export const rst: (props: ExternalLinkConfirmationDialogProps) => unknown;
  export interface McpAppFollowUpConfirmation {
    canConfirm?: boolean;
    context?: Record<string, unknown>;
    description?: unknown;
    footerLeadingContent?: unknown;
    imageUrls?: string[];
    onCancel(): void;
    onConfirm(prompt: string): void;
    prompt: string;
    title?: unknown;
  }
  export interface McpAppFollowUpConfirmationDialogProps {
    confirmation?: McpAppFollowUpConfirmation | null;
  }
  /** initializeMcpAppFollowUpConfirmationDialog（内部 vHa）。 */
  export const AX: () => void;
  /** McpAppFollowUpConfirmationDialog（内部 lHa）。 */
  export const kX: (
    props: McpAppFollowUpConfirmationDialogProps,
  ) => unknown;
  export interface TrustedContactNoThanksDialogProps {
    dismissOnDoneWithoutOptOut?: boolean;
    onClose(): void;
    onDone(): void;
    onOpenSettings(): void;
    open: boolean;
  }
  /** TrustedContactNoThanksDialog（内部 SOo）。 */
  export const vL: (props: TrustedContactNoThanksDialogProps) => unknown;
  /** initializeTrustedContactNoThanksDialog（内部 DOo）。 */
  export const yL: () => void;
  export interface PublicationTermsNoticeProps {
    showWhenUnseen?: boolean;
  }
  /** PublicationTermsNotice（内部 asc）。 */
  export const dl: (props: PublicationTermsNoticeProps) => unknown;
  /** initializePublicationTermsNotice（内部 csc）。 */
  export const fl: () => void;
  export interface SkillDetailsDialogProps extends Record<string, unknown> {
    onClose(): void;
    skillId: string;
  }
  /** loadSkillDetails（内部 n9o）。 */
  export const _E: () => Promise<
    (props: SkillDetailsDialogProps) => unknown
  >;
  /** initializeSkillDetails（内部 a9o）。 */
  export const gE: () => void;
  /** 当前宿主 ID signal。 */
  export const Dyt: import("@rchunk/app-shared").ReadableSignal<string>;
  export interface ArtifactPreviewOptions extends Record<string, unknown> {
    artifactTemplateSkill?: unknown;
    hostId: string;
    isPreview?: boolean;
    tabId?: string;
    title?: string;
  }
  /** openArtifactPreview。 */
  export const Ult: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>,
    path: string,
    options: ArtifactPreviewOptions,
  ) => void;
  /** artifact preview、automation routes 与 Home prefill 状态初始化器。 */
  export const Hlt: () => void;
  export const itn: () => void;
  export const byt: () => void;
  // rpc chunk 转发的四个符号（fnt/hnt/mnt/pnt 的压缩导出名）：
  export const fnt: unknown; // appHost：服务容器宿主
  export const hnt: () => Promise<void>; // initializeAppHostServices
  export const mnt: () => void; // 懒初始化器（遥测/基础设施装配）
  export const pnt: {
    customAvatars: {
      installPet?: (request: Record<string, unknown>) => Promise<{ id: string }>;
      previewPetInstall?: (request: Record<string, unknown>) => Promise<Record<string, unknown> & { spriteVersionNumber: number }>;
    };
    hotkeyWindowHotkeys?: {
      open(options: { path: string }): void;
    };
    quickChatWindow?: {
      addToComposer(content: unknown): Promise<void>;
      rendererReady(conversationId: string | null): void;
    };
    appInfo: {
      get(): Promise<{ chatGptDesktopAuthOrigin?: string | null }>;
    };
    chatGptBrowserSession?: {
      cancelProbe(probeId: string): void;
      getLookupEligibility(): Promise<BrowserSessionEligibility>;
      probe(
        probeId: string,
        desktopSessionUrl: string,
        securityLevel: string,
        onDebugEvent?: (event: {
          details?: Record<string, unknown>;
          source: "renderer";
          stage: string;
        }) => void,
      ): Promise<BrowserSessionProfile | null>;
    };
    codexMicro?: {
      getInputMonitoringPermissionStatus(): Promise<
        "denied" | "granted" | "unavailable"
      >;
      openInputMonitoringSettings(): Promise<void> | void;
      ownsPrimaryWindow(): Promise<boolean>;
    };
    systemPermissions: {
      openNotificationSettings(): Promise<void>;
      showPermissionSettingsAppInFinder?(): Promise<void>;
    };
    openIn: {
      detectTarget(options: { target: string }): Promise<{ available: boolean }>;
      loadTargetIcon(options: { target: string }): Promise<{ icon: unknown }>;
    };
    browserUsePermissions?: {
      clearPrewarmedThreads(): Promise<void>;
      updateIabHistoryApprovalMode(value: unknown): Promise<unknown>;
      updateOriginRules(value: unknown): Promise<unknown>;
      updateWebMcpEnabled(value: unknown): Promise<unknown>;
    };
  }; // appServices：已解析的服务集合
  export const $en: import("@rchunk/app-shared").MaitaiScope<
    Record<string, unknown>
  >; // zb：RouteScope atom
  export interface WorkspaceFileContextMenuOptions
    extends Record<string, unknown> {
    artifactNavigationTarget?: unknown;
    attachmentPreviewOrigin?: unknown;
    column?: number;
    cwd?: string;
    endLine?: number;
    hostId?: string;
    isAttachmentPreview?: boolean;
    line?: number;
    onOpenTargetSelected?(target: string | null, bundleId?: string): void;
    openInSidePanel?: boolean;
    openMode?: "workspace" | string;
    path: string;
  }
  export const Jut: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>,
    options: WorkspaceFileContextMenuOptions,
  ) => Promise<import("@rchunk/app-shared").ContextMenuItem[]>;
  export const Yut: () => void;
  export const Gut: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>,
    options: WorkspaceFileContextMenuOptions,
  ) => Promise<import("@rchunk/app-shared").ContextMenuItem[]>;
  export const qut: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>,
    options: WorkspaceFileContextMenuOptions,
  ) => void;
  export const Kut: () => void;
  export interface ArtifactTemplateSkill extends Record<string, unknown> {
    description?: unknown;
    name?: string;
    path: string;
    templateId?: string | null;
    title?: string;
  }
  export type ArtifactTemplateComponent = (
    props: Record<string, unknown>,
  ) => unknown;
  export const X3: (
    skill: ArtifactTemplateSkill,
    options: { renderCustomSvgAsImage: boolean; size: "large" },
  ) => ArtifactTemplateComponent;
  export const M5t: (skill: ArtifactTemplateSkill) => string | null;
  export const S5t: (
    skill: ArtifactTemplateSkill,
    templateKind: string,
  ) => string | null;
  export const k5t: (templateKind: string) => boolean;
  export const $Wt: (skill: ArtifactTemplateSkill) => unknown;
  export const kft: (options: {
    disposition?: "current-tab" | "new-tab";
    href: string;
    initiator: "open_in_browser_bridge";
    openTarget?: "external-browser" | "in-app-browser";
    originHostId?: string;
  }) => void;
  export interface TemplateViewerProps extends Record<string, unknown> {
    description?: unknown;
    icon?: unknown;
    isOpen: boolean;
    onOpenChange(open: boolean): void;
    title: unknown;
    titleText: string;
  }
  export interface TemplateViewerContentProps extends Record<string, unknown> {
    hostId: string;
    isOpen: boolean;
    skillPath: string;
    titleText: string;
  }
  export const YY: (props: TemplateViewerProps) => unknown;
  export const JY: (props: TemplateViewerContentProps) => unknown;
  export const O3t: ArtifactTemplateComponent;
  export const E3t: ArtifactTemplateComponent;
  export const w3t: ArtifactTemplateComponent;
  export const f3t: ArtifactTemplateComponent;
  export const O5t: () => void;
  export const w5t: () => void;
  export const D3t: () => void;
  export const T3t: () => void;
  export const k3t: () => void;
  export const p3t: () => void;
  export const $3: () => void;
  export const QY: () => void;
  export const P5t: () => void;
  export const bS: Record<string, unknown>; // Bms：侧面板 UI 组件注册表
  export const C: unknown; // XXc：PermissionsModeDropdown 懒加载组件
  export const CS: unknown; // ems：侧面板 List 组件
  export const P0t: <T>(items: readonly T[] | null | undefined, iteratee?: ((item: T) => unknown) | string) => T[]; // zDn：lodash uniqBy
  export const fhn: (left: { connector_id?: unknown; link_id?: unknown; auth_reason?: unknown; connection_consent?: unknown; requested_scopes?: unknown[] }, right: { connector_id?: unknown; link_id?: unknown; auth_reason?: unknown; connection_consent?: unknown; requested_scopes?: unknown[] }) => boolean; // mmt：connector approval 等价判定
  export const gmn: <T>(items: readonly T[] | null | undefined, iteratee: ((item: T) => PropertyKey) | string) => Record<PropertyKey, T[]>; // wm：lodash groupBy
  export const wfn: () => void; // BMt：URL 解析辅助初始化器
  export const BPt: any;
  export const Iht: any;
  export const Rht: any;
  export const kht: any;
  export const zPt: any;
  export const $ln: (key: string, parameters?: unknown) => readonly unknown[];
  export const Qln: <Result = unknown>(
    event: string,
    payload?: unknown,
  ) => Promise<Result>;
  export const aun: () => void;
  export const nun: () => void;
  export const oun: (queryClient: unknown, key: unknown) => Promise<unknown>;
  export const q3t: unknown;
  export const $3t: () => string;
  export const $i: (...arguments_: unknown[]) => unknown;
  export const Qi: () => void;
  export const Ji: () => void;
  export const Yi: (...arguments_: unknown[]) => unknown;
  export const fH: (...arguments_: unknown[]) => Promise<unknown>;
  export const uH: () => void;
  export const s6t: () => void;
  export const $4t: () => void;
  export const Bfn: () => void;
  export const HEt: () => void;
  export const M6t: () => void;
  export const MEt: any;
  export interface GptResource {
    gizmo: {
      author?: { user_id: string };
      current_user_permission?: {
        can_preview_business_agent_tools?: boolean | null;
        can_read?: boolean;
        can_view_config?: boolean;
        can_write?: boolean;
      } | null;
      display: { name: string };
      gizmo_type: string;
      live_version?: number | null;
      migrated_plugin_id?: string | null;
      share_recipient?: string | null;
      workspace_id?: string | null;
    };
  }
  export interface Account {
    account_user_id?: string | null;
    account_user_role?: string | null;
    id: string;
    plan_type?: string | null;
    structure: "personal" | "workspace" | string;
  }
  export interface WorkspacePermissions {
    allow_third_party_gpts?: string;
    permissions?: string[];
  }
  export interface Experiment {
    get<T>(key: string, fallback: T): T;
  }
  /** 动态实验配置 signal family。 */
  export const m0t: import("@rchunk/app-shared").ScopedSignalFamily<
    Record<string, unknown>,
    string,
    Experiment
  >;
  export const Dln: import("@rchunk/app-shared").ScopedQueryFamily<
    Record<string, unknown>,
    string,
    WorkspacePermissions
  >;
  export const fN: import("@rchunk/app-shared").ScopedQueryFamily<
    Record<string, unknown>,
    string,
    GptResource
  >;
  export const mfn: import("@rchunk/app-shared").ScopedSignalFamily<
    Record<string, unknown>,
    string,
    boolean
  >;
  export const pfn: () => void;
  export const N6t: () => {
    accountId?: string | null;
    authMethod?: string | null;
    hasChatGptToken?: boolean;
    isLoading?: boolean;
    planAtLogin?: unknown;
    userId?: string | null;
  };
  /** 是否由全局状态抑制订阅 onboarding。 */
  export const Gzt: () => boolean;
  export const _N: () => boolean;
  export const E4: () => boolean;
  export const gN: () => void;
  export const C4: () => void;
  export const QAt: () => void;
  export const tjt: (input: {
    projectType: "remote" | "local";
    scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>;
  }) => void;
  export interface SidebarChecklistItemState extends Record<string, unknown> {
    action?: string;
    completed?: boolean;
    id: string;
    isAutoSubmitEnabled?: boolean;
    label?: string;
    message?: string | import("@rchunk/app-shared").MessageDescriptor;
    pluginMentions?: Array<{ pluginId: string }>;
    prompt?: string;
    snapshot?: { iconAppId?: string; label?: string; type?: string };
    threadId?: string;
  }
  export interface SidebarChecklistAccountState {
    collapsed?: boolean;
    dismissed?: boolean;
    expired?: boolean;
    items?: SidebarChecklistItemState[];
  }
  export const xwt: import("@rchunk/app-shared").ReadableSignal<unknown | null>;
  export const bwt: import("@rchunk/app-shared").ReadableSignal<unknown | null>;
  export const uwt: (
    accountCollection: unknown,
    accountId: string,
    debugOverride: unknown,
  ) => SidebarChecklistAccountState | null;
  export const ke: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    accountId: string,
  ) => void;
  export const vwt: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    accountId: string,
    collapsed: boolean,
  ) => void;
  export const cwt: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    accountId: string,
  ) => void;
  export const Qgn: () => void;
  /** 桌面认证 URL、会话启动和浏览器 session 探测依赖。 */
  export interface DesktopLoginSession {
    cancel(): Promise<void>;
    getStartResult(): Promise<Record<string, unknown>>;
    waitForCompletion(): Promise<unknown>;
    [Symbol.dispose](): void;
  }
  export interface DesktopLoginStartResult extends Record<string, unknown> {
    completion: Promise<unknown>;
  }
  export interface BrowserSessionEligibility extends Record<string, unknown> {
    arm64: boolean;
    browserHasVisibleWindow: boolean;
    browserIsRunning: boolean;
    deviceCheck: boolean;
    eligible: boolean;
    macOS: boolean;
  }
  export interface BrowserSessionProfile extends Record<string, unknown> {
    id?: string;
  }
  export const Bgn: () => void;
  export const Eon: () => void;
  export const Lfn: () => void;
  export const Wgn: () => void;
  export const Ifn: import("@rchunk/app-shared").ScopedSignalFamily<
    unknown,
    string,
    unknown
  >;
  export const Ton: () => Error;
  export const Ugn: (
    scope: unknown,
    hostId: unknown,
  ) => {
    createChatGptLoginSession(options: {
      appBrand?: "chatgpt";
      useHostedLoginSuccessPage: boolean;
      useStreamlinedLogin?: boolean;
    }): DesktopLoginSession;
    hydrateBackgroundThreads(
      ids: string[],
      options?: { includeTurns?: boolean },
    ): Promise<void>;
    sendRequest(method: string, parameters: unknown): Promise<unknown>;
  };
  export const Vgn: () => {
    StableID: { get(key: unknown): string };
  };
  export const zgn: unknown;
  export const _s: () => void;
  export const gs: unknown;
  export const hs: unknown;
  /** 浏览器认证 handoff 与 Magic Link 的 URL、Cookie 和会话依赖。 */
  export interface CookieStore {
    getCookie(name: string): string | undefined;
    setCookie(
      name: string,
      value: string,
      options?: { path?: string; sameSite?: "lax" | "strict" | "none" },
    ): void;
  }
  export const Pun: (flow: "login" | string) => URL;
  export const Run: () => void;
  export const Rx: (
    url: string,
    parameters: Record<string, string>,
    signal: AbortSignal,
    flow?: string,
  ) => Promise<{ ok: true; url: string } | { ok: false }>;
  export const dJt: () => void;
  export const uJt: () => string;
  export const Ycn: () => CookieStore;
  export const bfn: () => void;
  export const yfn: () => {
    auth: { reauthenticationParams: Record<string, string> };
    authStatus: string;
  };
  /** Quick Chat 与 debug 独立窗口的路由、会话和分析依赖。 */
  export interface QuickChatSessionState extends Record<string, unknown> {
    hasConversation: boolean;
  }
  export const Evt: () => void;
  export const W_: () => void;
  export const bX: () => void;
  export const i_: () => void;
  export const oqt: () => void;
  export const G_: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>,
    event: {
      action: string;
      hasConversation: boolean;
      source: string;
      surface: string;
    },
  ) => void;
  export const aqt: (conversationId: string) => string;
  export const h_: import("@rchunk/app-shared").ReadableSignal<QuickChatSessionState | null>;
  export const sqt: (conversationId: string) => boolean;
  export const xvt: () => void;
  export const yX: (props: { children?: unknown; value: string }) => unknown;
  export const Oun: () => unknown;
  /** new-thread-panel-page 依赖的面板状态、Composer 与空状态组件。 */
  export const Dht: () => void;
  export const Du: () => void;
  export const Oht: import("@rchunk/app-shared").ReadableSignal<unknown>;
  export const cln: () => void;
  export const Aet: () => void;
  export interface EmptyStateProps extends Record<string, unknown> {
    actions?: unknown;
    className?: string;
    description?: unknown;
    illustration?: unknown;
    illustrationSize?: "icon" | string;
    title: unknown;
  }
  export const ket: (props: EmptyStateProps) => unknown;
  export const rht: () => void;
  export const p0t: () => void;
  export const Vzt: () => void;
  export interface DialogScope {
    get<Value>(signal: unknown): Value;
  }
  export type ManagedDialogComponent<Props extends Record<string, unknown>> = (
    props: Props & { onClose(): void },
  ) => unknown;
  /** isDialogOpen（内部 Hzt）。 */
  export const Hzt: <Props extends Record<string, unknown>>(
    scope: DialogScope,
    component: ManagedDialogComponent<Props>,
  ) => boolean;
  /** initializePepperOnboarding（Pepper Beacon modal 状态依赖）。 */
  export const Sqt: () => void;
  /** Pepper onboarding 使用的当前账户 ID signal。 */
  export const U6t: import("@rchunk/app-shared").ReadableSignal<string | null>;
  /** 从当前 scope 关闭指定 dialog component。 */
  export const zzt: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    component: (props: Record<string, unknown>) => unknown,
  ) => void;
  export const ifn: () => void;
  export const mN: () => void;
  export const l1: () => void;
  export const afn: (experimentId: string) => Experiment;
  export const ofn: (gateId: string) => boolean;
  export interface RouterLocationState {
    hash: string;
    key?: string;
    pathname: string;
    search: string;
    state: unknown;
  }
  export type RouterDestination =
    | string
    | Pick<RouterLocationState, "hash" | "pathname" | "search">;
  export const i_n: () => RouterLocationState;
  export const d_n: () => [URLSearchParams, (next: URLSearchParams) => void];
  export const Fx: (
    target?: string | null,
    fallback?: string | null,
    context?: string,
  ) => string;
  export const Ix: () => void;
  export const o_n: () => (
    destination: RouterDestination,
    options?: { replace?: boolean; state?: unknown },
  ) => void;
  export interface PrefetchableRoute {
    prefetch(): unknown;
  }
  export const $gn: (
    pattern: string,
    pathname: string,
  ) => Record<string, string> | null;
  export const l_n: () => {
    conversationId?: string | null;
    postId?: string | null;
    projectId?: string | null;
  };
  export const Xgn: (props: Record<string, unknown>) => unknown;
  export const Ygn: (props: {
    replace?: boolean;
    state?: unknown;
    to: RouterDestination;
  }) => unknown;
  export const WT: PrefetchableRoute;
  export const KT: PrefetchableRoute;
  export const GT: PrefetchableRoute;
  export const qT: PrefetchableRoute;
  export const JT: () => void;
  export const Pan: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>,
    event: {
      action: import("@rchunk/app-shared").AppgenInteractionAction;
      projectId: string;
      source: import("@rchunk/app-shared").AppgenInteractionSource;
    },
  ) => void;
  export const cnn: (projectId: string) => string;
  export const inn: (projectId: string) => string;
  export const Nan: () => void;
  export const lnn: () => void;
  export const i3t: (props: { className?: string }) => unknown;
  export const a3t: () => void;
  export type UniqueValuesFunction = <Value>(
    values: readonly Value[],
  ) => Value[];
  export const z2t: () =>
    | UniqueValuesFunction
    | { default: UniqueValuesFunction };
  export const uht: (
    accountId?: string,
    options?: { preview?: boolean },
  ) => { data: Account | undefined; isLoading: boolean };
  export const Uzt: <Props extends Record<string, unknown>>(
    scope: DialogScope,
    component: ManagedDialogComponent<Props>,
    props: Props,
  ) => void;
  export const u1: (pluginId: string, navigate: (path: string) => void) => void;
  export const mun: import("@rchunk/app-shared").ReadableSignal<string | null>;
  export interface AppgenConversationIntl {
    locale: string;
    formatMessage(
      descriptor: import("@rchunk/app-shared").MessageDescriptor,
      values?: Record<string, unknown>,
    ): string;
  }
  export const mpn: import("@rchunk/app-shared").ReadableSignal<AppgenConversationIntl>;
  export interface BeaconLifecycleMetadata {
    conversationId?: string;
    messageId?: string;
    suppressLifecycle?: boolean;
  }
  export const $Nt: (input: {
    activeClaims: unknown;
    isCurrentHomeBeacon: boolean;
    isHomepageTakeoverOwner: boolean;
    isPageContextUpsellSuppressionEnabled: boolean;
  }) => boolean;
  export const DNt: () => void;
  export const GNt: import("@rchunk/app-shared").ReadableSignal<boolean>;
  export const KNt: (input: {
    activeClaims: unknown;
    isPageContextUpsellSuppressionEnabled: boolean;
  }) => Set<unknown>;
  export const ONt: (input:
    | {
        accountId: string;
        beacon: unknown;
        eventType: "view";
      }
    | {
        beacon: unknown;
        eventCtaId?: string;
        eventType: "click" | "view";
        accountId?: string;
        metadata: BeaconLifecycleMetadata;
      }
  ) => void;
  export const SNt: (beacon: unknown) => boolean;
  export const WNt: { NonLegalBanners: unknown };
  export const YNt: import("@rchunk/app-shared").ReadableSignal<unknown>;
  export const ZNt: import("@rchunk/app-shared").ReadableSignal<boolean>;
  export const bNt: (beacon: unknown) => boolean;
  export const ePt: string;
  export const iPt: () => void;
  export const nPt: import("@rchunk/app-shared").ReadableSignal<boolean>;
  export const cs: unknown;
  export const ds: unknown;
  export const fs: Readonly<Record<string, unknown>>;
  export const ls: Readonly<Record<string, unknown>>;
  export const ms: () => void;
  export const ps: Readonly<Record<string, unknown>>;
  export const ss: Readonly<Record<string, unknown>>;
  export const us: Readonly<Record<string, unknown>>;
  export interface CodexMicroAppInfo {
    appIconMedium?: string | null;
    appName?: string;
    version?: string;
  }
  export const $C: import("@rchunk/app-shared").ReadableSignal<{
    status?: string;
  }>;
  export const aw: () => void;
  export const c$t:
    & import("@rchunk/app-shared").ReadableSignal<{ data?: CodexMicroAppInfo }>
    & import("@rchunk/app-shared").ScopedSignal<
      Record<string, unknown>,
      { data?: CodexMicroAppInfo }
    >;
  export const ew: import("@rchunk/app-shared").ReadableSignal<string>;
  export const fw: import("@rchunk/app-shared").ScopedSignal<
    Record<string, unknown>,
    boolean
  >;
  export const l$t: () => void;
  export const l2: (props: Record<string, unknown>) => unknown;
  /** AnnouncementModal 及 Wallet 标记组件依赖。 */
  export const u2: () => void;
  export const s3t: () => void;
  export const o3t: (props: { className?: string }) => unknown;
  export const mw: () => void;
  export const nw: import("@rchunk/app-shared").ReadableSignal<boolean>;
  export const tw: import("@rchunk/app-shared").ReadableSignal<unknown>;
  export interface FinanceConnectorApp {
    canonicalAppId?: string | null;
    plugin?: {
      availability?: string;
      disabledReason?: string;
      enabled?: boolean;
      installPolicy?: string;
    };
  }
  export interface FinanceMarketplacePlugin {
    displayName: string;
    pluginId: string;
  }
  export interface PluginInstallRequestState {
    kind: string;
    requestId?: string;
  }
  export const Fzt: (name: string) => import("@rchunk/app-info").AppInfo;
  export const HW: unknown;
  export const Izt: () => void;
  export const L2: () => void;
  export const Mzt: unknown;
  export const NOt: (input: {
    messageMetadata: Record<string, unknown>;
    prompt: string;
    systemHints: unknown[];
  }) => unknown;
  export const POt: () => void;
  export const R2: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    plugin: {
      displayName: string;
      remoteMarketplaceName: string;
      remotePluginId: string;
    },
    callbacks: {
      hostId: string;
      onCancel(): void;
      onError(): void;
      onSuccess(): void;
    },
  ) => boolean;
  export const UW: () => void;
  export const WW: unknown;
  export const _fn: unknown;
  export const f2t: (state: PluginInstallRequestState) => PluginInstallRequestState;
  export const fW: unknown;
  export const g2t: () => void;
  export const hW: () => void;
  export const hfn: unknown;
  export const i4t: () => void;
  export const jW: () => void;
  export const jzt: string;
  export const ly: unknown;
  export const n4t: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    options: { productContext: string; signal: AbortSignal },
  ) => Promise<FinanceConnectorApp[]>;
  export const q6t: (canonicalAppId: string) => string;
  export const uy: () => void;
  export const v2t: unknown;
  export const yNt: (beacon: unknown) => boolean;
  export const zW: unknown;
  export interface SidebarDictationOptions {
    enabled: boolean;
    getSurroundingText(): string;
    onStartError(): void;
    onTranscriptInsert(transcript: string): void;
    onTranscriptSend(transcript: string): void;
    onTranscribeError(): void;
    onUnsupported(): void;
  }
  export interface SidebarDictationState {
    canRetryDictation: boolean;
    hostCapability?: unknown;
    isDictating: boolean;
    isDictationStarting: boolean;
    isTranscribing: boolean;
    retryDictation(): void;
    startDictation(): void;
    stopDictation(): void;
    transcriptionAction?: unknown;
    waveformCanvasRef?: unknown;
  }
  export const BQ: () => void;
  export const J: () => void;
  export const RQ: (current: string, transcript: string) => string;
  export const Rrt: () => void;
  export const Urt: (props: Record<string, unknown>) => unknown;
  export const X: () => void;
  export const Y: () => boolean;
  export const Z: (options: SidebarDictationOptions) => SidebarDictationState;
  export const _t: (props: Record<string, unknown>) => unknown;
  export const vt: (props: Record<string, unknown>) => unknown;
  export const yt: () => void;
  export const ANt: () => void;
  export const Ae: () => (destination: unknown) => void;
  export const FNt: (
    scope: unknown,
    beacon: unknown,
    input: {
      navigationMethod: string;
      page: unknown;
      pageIndex: number;
    },
  ) => void;
  export const Mdn: string;
  export const Ndn: () => void;
  export const TNt: (beacon: unknown) => boolean;
  export const gln: (conversation: unknown) => unknown;
  export const jNt: (
    scope: unknown,
    input: Record<string, unknown>,
  ) => void;
  export const wNt: (beacon: unknown) => boolean;
  export const jan: string;
  export const snn: (projectId: string) => string;
  export const HWt: (input: { projectId: string; title: string }) => string;
  export const _pn: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>,
    route: string,
    options: { state: Record<string, unknown> },
  ) => void;
  export const gpn: () => void;
  export const GWt: () => void;
  export const ppn: () => void;
  export const Man: () => void;
  export interface ApiClient {
    getResponse(path: string, options?: unknown): Promise<Response>;
    safeDelete<Response = unknown>(path: string, options?: unknown): Promise<Response>;
    safeGet<Response>(path: string, options?: unknown): Promise<Response>;
    safePatch<Response>(path: string, options?: unknown): Promise<Response>;
    safePost<Response = unknown>(path: string, options?: unknown): Promise<Response>;
  }
  /** initializeApiClient（内部 API transport 初始化器）。 */
  export const cJt: () => void;
  /** 账户隔离的应用 API client。 */
  export const rJt: ApiClient;
  /** initializeImmutableState（Immer producer 依赖初始化器）。 */
  export const Zhn: () => void;
  /** produceImmutable（基于 recipe 生成不可变状态副本）。 */
  export const Qhn: <Value>(
    value: Value,
    recipe: (draft: Value) => void,
  ) => Value;
  export interface ProjectSourceFile extends Record<string, unknown> {
    file_id?: string;
    id?: string;
    processingState?: unknown;
  }
  export interface ChatGptProject extends Record<string, unknown> {
    files: ProjectSourceFile[];
    gizmo: {
      current_user_permission?: { can_write?: boolean };
    };
  }
  export const cjt: import("@rchunk/app-shared").ScopedQueryFamily<
    Record<string, unknown>,
    string,
    ChatGptProject
  >;
  export const ux: () => unknown;
  export const eUt: (canWrite: boolean | undefined, context: unknown) => boolean;
  export const dp: (file: ProjectSourceFile) => unknown | null;
  export const ujt: () => void;
  export const pp: () => void;
  export const lx: () => void;
  /** Browser profile import 的完成状态 signals。 */
  export const Gx: import("@rchunk/app-shared").ScopedSignal<
    Record<string, unknown>,
    boolean
  >;
  export const Jx: import("@rchunk/app-shared").ScopedSignal<
    Record<string, unknown>,
    number
  >;
  export const Kx: (result: unknown) => boolean;
  /** Browser profile import 分析协议使用的枚举值注册表。 */
  export type BrowserProfileImportAnalyticsEnumTable = Readonly<
    Record<string, unknown>
  >;
  export const Bs: BrowserProfileImportAnalyticsEnumTable;
  export const Fs: BrowserProfileImportAnalyticsEnumTable;
  export const Gs: BrowserProfileImportAnalyticsEnumTable;
  export const Hs: BrowserProfileImportAnalyticsEnumTable;
  export const Is: BrowserProfileImportAnalyticsEnumTable;
  export const Ls: BrowserProfileImportAnalyticsEnumTable;
  export const Rs: BrowserProfileImportAnalyticsEnumTable;
  export const Us: BrowserProfileImportAnalyticsEnumTable;
  export const Ws: BrowserProfileImportAnalyticsEnumTable;
  export const zs: BrowserProfileImportAnalyticsEnumTable;
  /** Browser profile import 分析事件描述符。 */
  export const Vs: unknown;
  /** 将结构化字段发送到 Maitai 分析管道。 */
  export const xpn: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    event: unknown,
    fields: Record<string, unknown>,
  ) => void;
  export const Ks: () => void;
  export const ypn: () => void;
  export const Ux: (result: { status?: string } | null | undefined) => boolean;
  export const Wx: (
    result:
      | { status?: string; imported?: number }
      | null
      | undefined,
  ) => boolean;
  export const Slt: () => boolean;
  export const Let: (props: Record<string, unknown>) => unknown;
  export const Ret: () => void;
  export const Xl: () => void;
  export const xlt: () => void;
  export const qx: () => void;
  /** Appgen/Sites query 子系统。 */
  export type AppgenQueryKey = readonly unknown[];
  export interface AppgenProject extends Record<string, unknown> {
    id: string;
    screenshot_url?: string | null;
    slug?: string;
    title?: string;
  }
  export interface AppgenDatabaseTableRows extends Record<string, unknown> {
    offset: number;
    rows: readonly Record<string, unknown>[];
  }
  export interface AppgenAccessUpdate extends Record<string, unknown> {
    access_mode?: unknown;
    allowed_tenant_group_ids?: readonly string[] | null;
    allowed_user_emails?: readonly string[] | null;
    allowed_workspace_group_ids?: readonly string[] | null;
    editor_changes?: Record<string, unknown> | null;
    optimistic_user?: Record<string, unknown> | null;
    viewer_changes?: Record<string, unknown> | null;
  }
  export interface AppgenQueryClient {
    invalidateQueries(options: {
      exact?: boolean;
      queryKey: readonly unknown[];
      refetchType?: string;
    }): Promise<unknown>;
  }
  export type AppgenQueryFamily<Param = string, Data = Record<string, unknown>> =
    import("@rchunk/app-shared").ScopedQueryFamily<
      Record<string, unknown>,
      Param,
      Data
    >;
  export type AppgenMutationFamily<Variables = unknown, Data = unknown> =
    import("@rchunk/app-shared").ScopedMutationFamily<
      Record<string, unknown>,
      string,
      Data,
      Error,
      Variables,
      unknown
    >;
  export const Bin: AppgenQueryKey;
  export const Vin: AppgenQueryKey;
  export const Hin: AppgenQueryKey;
  export const Uin: AppgenQueryKey;
  export const Win: AppgenQueryKey;
  export const Gin: AppgenQueryKey;
  export const Kin: AppgenQueryKey;
  export const qin: AppgenQueryKey;
  export const Jin: AppgenQueryKey;
  export const Yin: AppgenQueryKey;
  export const Xin: AppgenQueryKey;
  export const Zin: AppgenQueryKey;
  export const Qin: AppgenQueryFamily<string | null>;
  export const $in: AppgenMutationFamily<{ hostname: string }>;
  export const ean: AppgenMutationFamily<string>;
  export const tan: AppgenQueryFamily;
  export const nan: AppgenMutationFamily<void, { project_id: string; was_deleted: boolean }>;
  export const ran: AppgenQueryFamily;
  export const ian: import("zod").ZodType<
    | {
        chatgpt_conversation_id?: string | null;
        codex_thread_id?: string | null;
      }
    | null
    | undefined
  >;
  export const aan: AppgenQueryFamily<string, AppgenProject>;
  export const oan: AppgenMutationFamily<string>;
  export const san: AppgenMutationFamily<string>;
  export const can: import("@rchunk/app-shared").ScopedQuerySignal<
    Record<string, unknown>,
    { customDomains: boolean; database: boolean; slugChange: boolean }
  >;
  export const lan: AppgenMutationFamily<AppgenAccessUpdate>;
  export const uan: AppgenMutationFamily<Record<string, unknown>>;
  export const dan: AppgenMutationFamily<Record<string, unknown>, AppgenProject>;
  export const fan: <Result>(
    toolName: string,
    args: Record<string, unknown>,
    schema: import("zod").ZodType<Result>,
    options?: {
      expectedErrorTypes?: readonly string[];
      resultMetaKey?: string;
    },
  ) => Promise<Result>;
  export const pan: (
    projectId: string,
    slug: string,
  ) => Promise<{ available: boolean; slug: string; status: string }>;
  export const man: (projectId: string, update: AppgenAccessUpdate) => boolean;
  export const han: (projectId: string) => Promise<AppgenProject>;
  export const gan: (page: AppgenDatabaseTableRows) => number;
  export const van: (
    client: AppgenQueryClient,
    projectIds: readonly string[],
  ) => Promise<void>;
  export const yan: (update: AppgenAccessUpdate | null | undefined) => boolean;
  export const ban: (
    projectId: string,
    bindingName?: string | null,
  ) => import("@rchunk/app-shared").UseQueryResult<Record<string, unknown>>;
  export const xan: (projectId: string) => (bindingName: string | null) => Promise<void>;
  export const San: (params: {
    bindingName?: string | null;
    offset: number;
    projectId: string;
    tableName?: string | null;
  }) => import("@rchunk/app-shared").UseQueryResult<AppgenDatabaseTableRows>;
  export const Can: (options?: {
    enabled?: boolean;
    includeEditable?: boolean;
  }) => unknown;
  export const wan: (
    screenshotUrl?: string | null,
  ) => import("@rchunk/app-shared").UseQueryResult<string>;
  export const _an: () => void;
  export interface ExternalLinkProps extends Record<string, unknown> {
    children?: unknown;
    className?: string;
    href: string;
    initiator: string;
  }
  /** 带桌面端外链路由与分析上下文的链接组件。 */
  export const Jot: (props: ExternalLinkProps) => unknown;
  export const Xot: () => void;
  export const ql: (props: Record<string, unknown>) => unknown;
  export const Hln: (planType: unknown) => boolean;
  export const uP: (timestamp: number | null) => Date;
  export const jTt: string;
  export const Oft: (input: {
    disposition?: "new-tab";
    event: unknown;
    href: string;
    initiator: "open_in_browser_bridge";
    openTarget?: "external-browser";
  }) => void;
  export interface AnnouncementProps extends Record<string, unknown> {
    content: unknown;
    customCtas?: unknown;
    icon?: unknown;
    stackOnNarrow?: boolean;
    title: unknown;
    variant: "announcement" | string;
    wrapCtas?: boolean;
  }
  export const n7: (props: AnnouncementProps) => unknown;
  export const Dft: () => void;
  export const E6t: () => { platform: string };
  export const a7: () => void;
  export const i7: (props: Record<string, unknown>) => unknown;
  export const RS: () => void;
  export const T6t: () => void;
  export const yZ: () => void;
  export const eEt: () => void;
  export const r7: () => void;
  export const sP: () => void;
  export type SubscriptionPlan = "go" | "plus" | "prolite" | "pro";
  export interface SubscriptionPaymentIntent {
    client_secret?: string | null;
    id: string;
    next_action_type?: unknown;
  }
  export type SubscriptionUpdateResult =
    | { status: "complete" | "pending" }
    | {
        status: "payment_method_failed";
        payment_method_failure_detail?: string | null;
        payment_method_failure_reason?: string | null;
        pending_update_invoice_id?: string;
        pending_update_payment_intent_id?: string;
      }
    | {
        status: "requires_action";
        payment_intent: SubscriptionPaymentIntent;
        pending_update_invoice_id?: string;
      }
    | {
        status: "setup_required";
        setup_intent_client_secret: string;
      };
  export interface UpdateSubscriptionInput {
    accountId: string;
    expectedAccountId: string;
    paymentMethodId?: string | null;
    promoCampaign?: string | null;
    promoCode?: string | null;
    setupIntentId?: string;
    signal?: AbortSignal;
    updatedPlan: SubscriptionPlan;
  }
  export interface ClearPendingSubscriptionUpdateInput {
    accountId: string;
    expectedAccountId: string;
    expectedPaymentIntentId?: string;
    pendingUpdateInvoiceId?: string;
  }
  export class Sdn extends Error {
    readonly errorCode?: string;
    readonly status: number;
  }
  /** 提交订阅套餐更新。 */
  export const NF: (
    input: UpdateSubscriptionInput,
  ) => Promise<SubscriptionUpdateResult>;
  /** 清除服务器上的待处理订阅更新。 */
  export const jF: (
    input: ClearPendingSubscriptionUpdateInput,
  ) => Promise<void>;
  export const kF: () => void;
  export const wdn: () => void;
  export const CT: () => void;
  export const KG: () => void;
  export const X7: () => void;
  export const l9: (props: Record<string, unknown>) => unknown;
  export const qG: {
    (props: Record<string, unknown>): unknown;
    Body: unknown;
    Close: unknown;
    Content: unknown;
    Description: unknown;
    Footer: unknown;
    Header: unknown;
    Title: unknown;
  };
  /** defineMessages（订阅与定价消息描述）。 */
  export const TT: {
    (): void;
    <
      const Messages extends Record<
        string,
        import("@rchunk/app-shared").MessageDescriptor
      >,
    >(
      messages: Messages,
    ): Messages;
  };
  export const wT: () => void;
  export interface CurrencyAmountInput {
    amount: number;
    currencyCode: string;
    currencyFractionDigits: number;
    intl: import("@rchunk/app-shared").IntlShape;
  }
  /** 使用应用 locale 格式化货币金额。 */
  export const TI: (input: CurrencyAmountInput) => string | null | undefined;
  /** 订阅产品类型到内部 plan 值的稳定映射。 */
  export const Pdn: {
    readonly GO: "go";
    readonly PLUS: "plus";
    readonly PROLITE: "prolite";
    readonly PRO: "pro";
  };
  export const Rln: () => void;
  export const iN: (
    user: { locale?: string | null } | string | null | undefined,
  ) => { locale?: string | null } | null | undefined;
  export const sN: () => void;
  /** initializeThreadState（pending-onboarding 依赖的线程索引初始化器）。 */
  export const Ftn: () => void;
  /** 当前用户 ID signal。 */
  export const _un: import("@rchunk/app-shared").ReadableSignal<string | null>;
  /** 按 thread ID 读取线程记录的 signal family。 */
  export const Ltn: import("@rchunk/app-shared").SignalFamily<
    string,
    unknown | null
  >;
  export const F7: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    resource: unknown,
  ) => void;
  export const Jet: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    mode: "chat" | string,
  ) => void;
  export const ytn: (gizmoIdOrSlug: string) => string;
  export const Sun: () => void;
  export const Het: () => void;
  export const P7: () => void;
  export const xtn: () => void;
  export const X4t: (app: unknown) => unknown;
  export const oDt: () => void;
  export const sDt: (input: { hostId: string }) => boolean;
  export const $sn: () => void;
  export const Oln: () => void;
  export const fgn: () => void;
  export const dgn: string;
  export const Sln: unknown;
  export const Ysn: unknown;
  /** PR 自动修复侧栏、heartbeat 与 worktree 查询依赖。 */
  export const FCt: () => void;
  export const Gvt: (
    scope: unknown,
    definition: unknown,
    options: Record<string, unknown>,
  ) => unknown;
  export const HZt: () => void;
  export const dg: () => void;
  export const ICt: (value: unknown) => boolean;
  export const QCt: unknown;
  export const Wvt: () => void;
  export const ZCt: () => void;
  export const _vt: () => void;
  export const fg: (definition: {
    open: (...arguments_: unknown[]) => unknown;
    restore: (...arguments_: unknown[]) => Promise<boolean>;
  }) => unknown;
  export const gvt: (scope: unknown, tabId: string) => string | null | undefined;
  export const hsn: (value: unknown) => boolean;
  export const mg: () => void;
  export const msn: () => void;
  export const pg: unknown;
  export const wQt: unknown;
  export const zZt: unknown;
  export const GYt: () => void;
  export const LYt: (input: Record<string, unknown>) => unknown;
  export const PCt: string;
  export const zYt: () => Record<string, unknown>;
  export const Bcn: (
    get: (signal: unknown, parameter?: unknown) => unknown,
    setting: { key: string },
  ) => unknown;
  export const Con: () => void;
  export const Gcn: unknown;
  export const Gsn: readonly unknown[];
  export const Jht: (...arguments_: unknown[]) => unknown;
  export const Jsn: readonly unknown[];
  export const Kht: (...arguments_: unknown[]) => readonly unknown[];
  export const Ksn: readonly unknown[];
  export const Ucn: (
    scope: unknown,
    setting: { key: string },
    value: unknown,
  ) => Promise<void>;
  export const Vcn: () => void;
  export const _cn: () => void;
  export const _on: (host: unknown) => string;
  export const lcn: unknown;
  export const mcn: unknown;
  export const qht: () => void;
  export const won: (service: string) => {
    request(input: {
      method: string;
      params: Record<string, unknown>;
      signal?: AbortSignal;
    }): Promise<unknown>;
  };
  /** Pull request revision/checks 基础依赖。 */
  export const $v: (props: Record<string, unknown>) => unknown;
  export const Hg: () => void;
  export const Vg: (props: Record<string, unknown>) => unknown;
  export const ey: () => void;
  export const Gy: unknown;
  export const Xy: (
    method: string,
    parameters: unknown,
    options: { signal: AbortSignal; source: string },
  ) => Promise<unknown>;
  export const Yy: () => void;
  export const gy: unknown;
  export const i5t: () => void;
  export const nrn: () => void;
  export const qy: () => void;
  export const t5t: (account: unknown) => unknown;
  export const dat: () => void;
  export const uat: (props: {
    className?: string;
    linesAdded: number;
    linesRemoved: number;
  }) => unknown;
  /** git-review 基础层：unified patch 解析与初始化。 */
  export const XO: (patch: string) => Array<{
    additions: number;
    deletions: number;
    firstAdditionLine?: number | null;
    firstDeletionLine?: number | null;
  }>;
  export const YO: () => void;
  /** virtualized file diff 控制器。 */
  export class hvn {
    top?: number | null;
    getLinePosition(
      line: number,
      side: string,
    ): { height: number; top: number } | null | undefined;
    setSelectedLines(
      selection: unknown,
      options: { notify: boolean },
    ): void;
  }
  export const L_n: () => void;
  export const PSn: string;
  /** git live-query hook。 */
  export const Kan: () => void;
  export const Yan: (
    host: unknown,
    roots: ReadonlyArray<{ root: string }>,
    queryName: string,
    getParameters: (root: { root: string }) => Record<string, unknown>,
    operationSource: string,
    options: Record<string, unknown>,
  ) => unknown;
  /** PR query key 与 query 对象。 */
  export const By: (...arguments_: unknown[]) => unknown;
  export const Hy: () => void;
  export const Vy: (...arguments_: unknown[]) => unknown;
  export const Cy: unknown;
  export const Sy: unknown;
  export const _y: (...arguments_: unknown[]) => unknown;
  export const by: unknown;
  export const gy: unknown;
  export const vy: (...arguments_: unknown[]) => unknown;
  export const xy: unknown;
  export const yy: () => void;
  /** Git origins query。 */
  export const CSt: () => void;
  export const SSt: unknown;
  /** Review file source tab 与 workspace tab 同步。 */
  export const $st: unknown;
  export const Qst: (...arguments_: unknown[]) => unknown;
  export const Xst: (...arguments_: unknown[]) => unknown;
  export const Zst: () => void;
  export const ect: (...arguments_: unknown[]) => unknown;
  export const cut: () => void;
  export const lut: (...arguments_: unknown[]) => unknown;
  export const sut: (...arguments_: unknown[]) => unknown;
  // scroll-to-match 依赖：CUt=查找器装配器 xUt=matchId 元素查找器
  export const CUt: unknown;
  export const xUt: unknown;
  export const _any: any;
}

declare module "@rchunk/app-shared" {
  export const $I: (options: unknown) => unknown;
}

declare module "@rchunk/app-initial" {
  export const Gv: () => { selectedHostId: string };
}

declare module "@rchunk/cloud-environment-queries" {
  export interface CloudEnvironment {
    id?: string;
    slug?: string;
    label: string;
    description?: string;
    repos: string[];
    permissions?: { can_delete?: boolean; can_write?: boolean };
    machine_id?: string;
    setup?: string | string[];
    maintenance_setup?: string | string[];
    env_vars?: Record<string, string>;
    [key: string]: unknown;
  }
  export interface EnvironmentForm {
    label: string;
    description: string;
    machineId: string;
    setupCommands: string;
    maintenanceSetupCommands: string;
    repositoryId: string;
    [key: string]: unknown;
  }
  export const i: (query: string) => unknown;
  export const t: import("@rchunk/app-shared").ScopedSignalFamily<unknown, string, unknown>;
  export const l: import("@rchunk/app-shared").ScopedSignal<unknown, unknown>;
  export const p: import("@rchunk/app-shared").ScopedSignal<unknown, unknown>;
  export const u: import("@rchunk/app-shared").ScopedSignal<unknown, unknown>;
  export const f: import("@rchunk/app-shared").ScopedSignal<unknown, unknown>;
  export const x: (environment?: CloudEnvironment | null, fallbackConnectorId?: string | null) => EnvironmentForm;
  export const w: (form: EnvironmentForm) => Record<string, string>;
  export const v: (form: EnvironmentForm, canChangeMachine: boolean, currentMachineId: string) => boolean;
  export const y: (form: EnvironmentForm) => Record<string, unknown>;
}

declare module "@rchunk/cloud-environments-settings-page" {
  export const CloudEnvironmentsSettingsPage: () => unknown;
}

declare module "@rchunk/local-environments-settings-page" {
  export const LocalEnvironmentsSettings: () => unknown;
}

declare module "@rchunk/personal-vault-settings" {
  export type VaultNamespace = "not_sensitive" | "sensitive";
  export interface PersonalVaultEntry { envVar?: string | null; id: string; name: string; namespace: VaultNamespace; targets?: string[] }
  export interface PersonalVaultSettingsProps { entries?: readonly PersonalVaultEntry[]; error?: string | null; isLoading?: boolean; onAdd?(namespace: VaultNamespace): void; onBack(): void; onDelete?(entry: PersonalVaultEntry): void; onEdit?(entry: PersonalVaultEntry): void }
  export const PersonalVaultSettings: (props: PersonalVaultSettingsProps) => unknown;
}

declare module "@rchunk/artifact-preview-page-navigation" {
  export interface PageNavigationOptions { containerRef: { current: Element | null }; initialPage?: number; isPageLayoutReady: boolean; onPageChange?(page: number): void; pageSelector: string; totalPages: number; }
  export interface PageNavigation { currentPage: number; goToPage(page: number, behavior?: ScrollBehavior): void; goToNextPage(): void; goToPreviousPage(): void; }
  export const n: (options: PageNavigationOptions) => PageNavigation;
  export const t: () => void;
}

declare module "@rchunk/keyboard-shortcuts-dialog" {
  export interface KeyboardShortcutItem { description?: string; id: string; section: string; shortcutLabels: string[]; title: string; }
  export const KeyboardShortcutsDialog: (props: { commands?: readonly KeyboardShortcutItem[]; onOpenChange(open: boolean): void }) => unknown;
}

declare module "@rchunk/keyboard-shortcuts-gate";
declare module "@rchunk/keyboard-shortcut-command-order";

declare module "@rchunk/changelog-modal" {
  export interface ChangelogPost { bodyMarkdown: string; date: string; image?: string | null; summary?: string | null; title: string; url: string; version?: string | null; }
  export const ChangelogModal: (props: { onClose(): void; post: ChangelogPost }) => unknown;
}

declare module "@rchunk/chatgpt-sites" {
  export const a: () => void;
  export const i: Readonly<Record<string, string>>;
  export const n: Readonly<Record<string, string>>;
  export const r: Readonly<{ $type: "protobuf_analytics_events.v1.ChatgptSitesResponseCardViewed" }>;
  export const t: Readonly<{ $type: "protobuf_analytics_events.v1.ChatgptSitesInteraction" }>;
}
declare module "@rchunk/duplicate-agent" { export interface AgentManagementService { canDelete?(agentId: string): boolean; canDuplicate?(agentId: string): boolean; clone?(agentId: string, name: string): Promise<{ id: string }>; delete?(agentId: string): Promise<void>; invalidate?(keys: readonly unknown[]): void; navigateToAgent?(agentId: string): void; notify?(tone: "danger" | "success", message: string): void } export const a: (props: { agentId: string; onClose(): void; onDeleted?(): void; service?: AgentManagementService }) => unknown; export const i: () => void; export const n: (props: { onSelect(): void }) => unknown; export const o: () => void; export const r: (props: { agentId: string; onSelect(): void; service?: AgentManagementService }) => unknown; export const t: (props: { agentId: string; agentName: string; onClose(): void; service?: AgentManagementService }) => unknown }
declare module "@rchunk/use-visible-settings-sections" {
  export type SettingsSurface = "chatGpt" | "codex" | "codexLocal" | "codexOrWorkLocal" | "chatGptOrCodex";
  export interface SettingsSection { disabled?: boolean; externalUrl?: string; label: string; slug: string; surface?: SettingsSurface }
  export interface VisibleSettingsOptions { buildFlavor?: "chatgpt" | "codex" | "work"; isLocalHost?: boolean; labels?: Partial<Record<string, string>>; sections?: readonly SettingsSection[] }
  export const a: string;
  export const i: () => void;
  export const n: (options?: VisibleSettingsOptions) => SettingsSection[];
  export const o: Readonly<Record<"account" | "securitySettings", { href: string; label: string }>>;
  export const r: (slug: string, platform?: string) => { commandAsset: string; component: string; navigation: { ariaHidden: boolean } };
  export const s: () => void;
  export const t: () => void;
}

declare module "@rchunk/create-output-menu" {
  export type ArtifactKind = "document" | "presentation" | "spreadsheet" | "site";
  export interface CreateOutputActions { availableArtifactKinds: readonly ArtifactKind[]; createArtifact(kind: ArtifactKind): boolean | void; isLoadingApps?: boolean; appsError?: unknown; retryApps?(): void; }
  export const ChatGptCreateOutputMenu: (props: { composerActions: CreateOutputActions; defaultOpen?: boolean }) => unknown;
}

declare module "@rchunk/add-source-menu" {
  export interface AddSourceActions { canOpenFileDialog: boolean; canOpenLibraryPicker: boolean; openFileDialog(): boolean | void; openLibraryPicker(): boolean | void; openPluginDirectory?(): void; }
  export const ChatGptAddSourceMenu: (props: { composerActions: AddSourceActions; conversationId: string; defaultOpen?: boolean; shouldBlockExternalEgress?: boolean }) => unknown;
}

declare module "@rchunk/settings-command-menu-section-items" {
  export interface VisibleSettingsSection { disabled?: boolean; externalUrl?: string; label: string; slug: string; }
  export const VisibleSettingsCommandMenuSectionItems: (props: { close(): void; isSelectedHostLocal: boolean; selectedHostId: string; sections?: readonly VisibleSettingsSection[]; onNavigate?(path: string): void; onOpenExternal?(url: string): void }) => unknown;
}

declare module "@rchunk/agent-menu" {
  export interface WorkspaceAgentSummary { icon?: string | null; id: string; name: string; }
  export const n: () => void;
  export const t: (props: Record<string, unknown> & { agent: WorkspaceAgentSummary; isPublished: boolean }) => unknown;
}

declare module "@rchunk/conversation-move-menu-items" {
  export interface ConversationSummary { conversation_origin?: string; id: string; memory_scope?: string | null; }
  export interface ProjectSummary { id: string; name: string; ownerId?: string; projectOnly?: boolean; }
  export const n: () => void;
  export const t: (props: Record<string, unknown> & { conversation: ConversationSummary; onMove(projectId: string | null): Promise<void> | void }) => unknown;
}

declare module "@rchunk/work-mode-upsell-modal" {
  export const WorkModeUpsellModal: (props: { accountKind?: "business" | "personal"; isLoading?: boolean; onClose(): void; onUpgrade(event: unknown, plan: "business" | "personal"): void }) => unknown;
}
declare module "@rchunk/quiet-hours-active-dialog" {
  export const QuietHoursActiveDialog: (props: { accountId: string; userId: string; timeZone: string; nextAllowedAt?: Date | null; eligible?: boolean; onClose(): void }) => unknown;
}
declare module "@rchunk/model-picker-upsell-modal" {
  export interface ModelPickerUpsellModel { displayName: string; model: string; defaultReasoningEffort?: string; }
  export interface ModelPickerUpsellStatus { model_picker_upsell?: { title?: string; message?: string; ctas?: Array<{ id: string; label: string }> } | null; }
  export const ModelPickerUpsellModal: (props: { model: ModelPickerUpsellModel; rateLimitStatus: ModelPickerUpsellStatus; onClose(): void; onRestorePickerFocus?(): void; onSelectCta?(id: string): void }) => unknown;
}
declare module "@rchunk/first-limit-dialog" {
  export type FirstLimitPresentation = { variant: "thinking" | "instant"; resetDay: "today" | "later"; resetTime: Date } | { variant: "plan_intro" | "limit_reached" };
  export const FirstLimitDialog: (props: { presentation: FirstLimitPresentation; onClose(): void; onUpgradeAfterClose?(presentation: FirstLimitPresentation): void }) => unknown;
}
declare module "@rchunk/remote-connection-editor-modal" {
  export interface RemoteConnectionDraft { displayName: string; host: string; hostId: string; port?: number; user?: string; }
  export const RemoteConnectionEditorModal: (props: { connection?: RemoteConnectionDraft | null; hostId: string; isLoading?: boolean; isSaving?: boolean; onClose(): void; onSave?(connection: RemoteConnectionDraft): Promise<void> | void }) => unknown;
}

declare module "@rchunk/epic-launch-contracts";
declare module "@rchunk/shield-check";
declare module "@rchunk/app-initial" { export const B6t: unknown; }
declare module "@rchunk/epic-launch-page" { export const EpicLaunchPage: () => unknown; }
declare module "@rchunk/browser-auth-error-page" { export const BrowserAuthErrorPage: () => unknown; }
declare module "@rchunk/demo-tools-setup-page" { export const DemoToolsSetupPage: () => unknown; }
declare module "@rchunk/app-connect-oauth-callback-page" {
  export interface AppConnectCallbackResult { appId?: string; error?: string; success: boolean; }
  export const AppConnectOAuthCallbackPage: (props?: { completeCallback?(parameters: URLSearchParams): Promise<AppConnectCallbackResult> }) => unknown;
}

declare module "@rchunk/pull-request-code-review-navigation-core" {
  export const C: (...arguments_: unknown[]) => void;
  export const S: (...arguments_: unknown[]) => void;
  export const _: symbol;
  export const a: symbol;
  export const b: (...arguments_: unknown[]) => void;
  export const c: symbol;
  export const d: symbol;
  export const f: symbol;
  export const g: symbol;
  export const h: symbol;
  export const i: () => void;
  export const l: symbol;
  export const m: symbol;
  export const n: () => void;
  export const o: symbol;
  export const p: symbol;
  export const r: (...arguments_: unknown[]) => void;
  export const s: symbol;
  export const t: (scope: { value?: { pathname?: string } }, request: Record<string, unknown>, path: string) => string;
  export const u: symbol;
  export const v: (...arguments_: unknown[]) => void;
  export const x: (...arguments_: unknown[]) => void;
  export const y: (...arguments_: unknown[]) => void;
}

declare module "@rchunk/pull-request-revision-queries-core" {
  export const a: unknown;
  export const i: unknown;
  export const n: () => void;
  export const r: unknown;
  export const t: (...arguments_: unknown[]) => unknown;
}

declare module "@rchunk/diff-summary" {
  export interface FileDiffSummary {
    additions: number;
    deletions: number;
  }
  export const n: () => void;
  export const t: (files: readonly FileDiffSummary[]) => {
    fileCount: number;
    hasChanges: boolean;
    linesAdded: number;
    linesDeleted: number;
  };
}

declare module "@rchunk/pull-request-detail-model" {
  export const a: (...arguments_: unknown[]) => unknown;
  export const c: () => void;
  export const i: (...arguments_: unknown[]) => unknown;
  export const l: unknown;
  export const n: (...arguments_: unknown[]) => unknown;
  export const o: (...arguments_: unknown[]) => unknown;
  export const r: (...arguments_: unknown[]) => unknown;
  export const s: () => void;
  export const t: (...arguments_: unknown[]) => unknown;
}

declare module "@rchunk/full-content-metadata" {
  export interface DiffContentBlock {
    additionLineIndex: number;
    additions: number;
    deletionLineIndex: number;
    deletions: number;
    lines: number;
    type: string;
    [key: string]: unknown;
  }
  export interface DiffHunk {
    additionCount: number;
    additionStart: number;
    deletionCount: number;
    deletionStart: number;
    hunkContent: DiffContentBlock[];
    splitLineCount: number;
    unifiedLineCount: number;
    [key: string]: unknown;
  }
  export interface PartialDiffMetadata {
    additionLines: string[];
    cacheKey?: string | null;
    deletionLines: string[];
    hunks: DiffHunk[];
    name: string;
    newObjectId?: string | null;
    prevObjectId?: string | null;
    [key: string]: unknown;
  }
  export const n: () => { lines: never[]; type: "success" };
  export const r: () => void;
  export const t: (
    metadata: PartialDiffMetadata,
    deletionLines: string[],
    additionLines: string[],
    options?: { ignoreWhitespace?: boolean },
  ) => (PartialDiffMetadata & {
    isPartial: false;
    splitLineCount: number;
    unifiedLineCount: number;
  }) | null;
}

declare module "@rchunk/subscription-update-plan" {
  export type SubscriptionPlanSlug =
    | "chatgptgoplan"
    | "chatgptplusplan"
    | "chatgptprolite"
    | "chatgptpro";
  /** 将订阅更新 API 的 plan slug 转回前端套餐值。 */
  export const n: (
    slug: string,
  ) => import("@rchunk/app-initial").SubscriptionPlan | undefined;
  /** 初始化订阅更新套餐依赖。 */
  export const r: () => void;
  /** 将前端套餐值转换为订阅更新 API 的 plan slug。 */
  export const t: (
    plan: import("@rchunk/app-initial").SubscriptionPlan,
  ) => SubscriptionPlanSlug | undefined;
}

declare module "@rchunk/confirm-subscription-upgrade" {
  export interface StripeClient {
    confirmCardPayment(
      clientSecret: string,
    ): Promise<import("@rchunk/stripe-payment-confirmation").StripeConfirmationResult>;
    confirmPayment(input: {
      clientSecret: string;
      confirmParams: { return_url: string };
      redirect: "if_required";
    }): Promise<import("@rchunk/stripe-payment-confirmation").StripeConfirmationResult>;
    confirmPixPayment(
      clientSecret: string,
    ): Promise<import("@rchunk/stripe-payment-confirmation").StripeConfirmationResult>;
    confirmSetup(input: {
      clientSecret: string;
      confirmParams: { return_url: string };
      redirect: "if_required";
    }): Promise<import("@rchunk/stripe-payment-confirmation").StripeSetupResult>;
  }
  export interface UpgradeScope {
    get(
      signal: import("@rchunk/app-shared").ReadableSignal<string | null>,
    ): string | null;
  }
  export interface ConfirmUpgradeOptions {
    accountId: string;
    isActive(): boolean;
    isPaymentMethodRecoveryEnabled?: boolean;
    isPendingUpdateError(error: unknown): boolean;
    mandateRecovery?: boolean;
    onSubmit?(): void;
    paymentMethodId?: string | null;
    promoCampaign?: string | null;
    promoCode?: string | null;
    revalidatePaymentMethod(): Promise<boolean>;
    signal?: AbortSignal;
    stripe: StripeClient;
    updatedPlan: import("@rchunk/app-initial").SubscriptionPlan;
    userId: string;
    willRenew: boolean;
  }
  export type UpgradeResult =
    | { status: "complete" | "pending" | "closed" | "unknown" }
    | { status: "setup_required"; setupIntentClientSecret: string }
    | {
        status: "payment_method_failed";
        reason: string;
        detail?: string | null;
        source: "update" | "confirmation";
      }
    | { status: "request_failed"; error: Error };
  export const n: () => void;
  export const r: () => void;
  export const t: (
    scope: UpgradeScope,
    options: ConfirmUpgradeOptions,
  ) => Promise<UpgradeResult>;
}

declare module "@rchunk/app-primary" {
  /** Pull-request comment markdown renderer and initializer. */
  export const af: () => void;
  const PullRequestMarkdownRenderer: (props: Record<string, unknown>) => unknown;
  export { PullRequestMarkdownRenderer as if };
  /** 初始化模型与 reasoning-effort 翻译表。 */
  export const cc: () => void;
  /** reasoning-effort 到本地化消息描述的映射。 */
  export const lc: Record<
    string,
    import("@rchunk/app-shared").MessageDescriptor
  >;
  export const gf: () => void;
  export const hf: (text: string) => Array<Record<string, unknown>>;
  /** new-thread-panel-page 初始化面与实验配置。 */
  export const P: () => void;
  export const ds: unknown;
  export const dt: () => void;
  export const ko: () => void;
  export const r: () => void;
  export const rt: () => void;
  export const us: string;
  export const Oo: (props: { children?: unknown }) => unknown;
  export const c: (props: { variant?: string }) => unknown;
  export const l: () => void;
  export const nt: (props: { children?: unknown; className?: string }) => unknown;
  export const o: (props: { className?: string }) => unknown;
  export const s: () => void;
  export const ut: (props: {
    onLocalConversationCreated(conversationId: string): void;
    selectedProject: unknown;
    showWorkspaceDropdownInUtilityBar: boolean;
  }) => unknown;
  export const gc: () => void;
  export const hc: (...arguments_: unknown[]) => unknown;
  export interface BeaconSelectionParameter {
    accountId: string | null;
    locale: string;
    pathname: string;
    product: string;
    shouldFetch: boolean;
    shouldSuppressFocusedModal: () => boolean;
    visitKey: string;
  }
  export type BeaconSelectionCleanupParameter = Omit<
    BeaconSelectionParameter,
    "shouldFetch"
  >;
  export interface BeaconSelection {
    beacon?: import("@rchunk/home-beacon").HomeBeaconRecord;
    status: "idle" | "pending" | "selected";
  }
  export const Dh: () => void;
  export const Eh: (
    isHomepageTakeover: boolean,
    pageContext: unknown,
  ) => { isPending: boolean; isUnavailable: boolean };
  export const Fh: () => boolean;
  export const Ih: (input: {
    accountId: string;
    locale: string;
    navigationKey?: string;
    pathname: string;
    product: string;
  }) => string;
  export const Lh: () => void;
  export const Mh: () => void;
  export const Nh: import("@rchunk/app-shared").SignalFamily<
    BeaconSelectionCleanupParameter,
    unknown
  >;
  export const Ph: () => void;
  export const Th: unknown;
  export const bh: () => void;
  export const jh: import("@rchunk/app-shared").SignalFamily<
    BeaconSelectionParameter,
    BeaconSelection
  >;
  export const wh: import("@rchunk/app-shared").ScopedSignal<
    Record<string, unknown>,
    Set<string>
  >;
  export const co: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    pluginId: string,
  ) => Promise<import("@rchunk/app-initial").FinanceMarketplacePlugin | null>;
  export const lo: () => void;
  export const $m: (url: string) => boolean;
  export const Hm: unknown;
  export const Hp: string;
  export const Km: () => void;
  export const Up: () => void;
  export const Vp: () => void;
  export const _h: (
    scope: unknown,
    accountId: string,
    beacon: unknown,
  ) => void;
  export const th: () => void;
  export const vh: (
    scope: unknown,
    accountId: string,
    beacon: unknown,
  ) => void;
  export const xh: (
    scope: unknown,
    accountId: string,
    beacon: unknown,
    metadata?: unknown,
  ) => void;
  export const yh: (input: {
    actionId: string;
    beaconId: string;
  }) => string;
  /** Announcement modal 候选来源注册表。 */
  export const Qp: import("@rchunk/app-shared").ScopedSignal<
    Record<string, unknown>,
    Map<string, { candidate: unknown; source: string }>
  >;
  export const em: () => void;
  export const Sc: () => void;
  export const Tc: (input: {
    deviceStatus?: string;
    hasEverBeenDetected: boolean;
    onboardingState: unknown;
  }) => boolean;
  export const xc: import("@rchunk/app-shared").ScopedSignal<
    Record<string, unknown>,
    "complete" | "pending" | string
  >;
  export interface BannerAction {
    ariaLabel?: string;
    disabled?: boolean;
    icon?: unknown;
    label?: unknown;
    onClick(): void;
  }
  export interface BannerProps extends Record<string, unknown> {
    description?: unknown;
    dismissAction?: BannerAction;
    leadingVisual?: unknown;
    primaryAction?: BannerAction;
    title?: unknown;
  }
  export const Sm: (props: BannerProps) => unknown;
  export const Cg: (...arguments_: unknown[]) => unknown;
  export const wg: () => void;
  export type AnnouncementStatus = "eligible" | "ineligible" | "loading";
  export const $p: (state: {
    isEligible: boolean;
    isLoading: boolean;
  }) => AnnouncementStatus;
  export const Ne: (props: {
    entries: import("@rchunk/app-initial").HomeAnnouncementCandidate[];
    trackVisibility?: boolean;
  }) => unknown;
  export const Ch: (
    product?: string,
    options?: { shouldSuppressFocusedModal?: () => boolean },
  ) => import("@rchunk/home-beacon").HomeBeaconResult;
  export const Cm: () => void;
  export interface LibraryFilePickerDialogProps
    extends Record<string, unknown> {
    analytics?: unknown;
    attachmentTarget?: "chat" | string;
    attachedFileCount?: number;
    attachedFileIds?: ReadonlySet<string | undefined>;
    attachedLibraryFileIds?: ReadonlySet<string>;
    disabled?: boolean;
    onAttachFiles?: (files: unknown[]) => void;
    onAttachSharedItems?: (items: unknown[]) => void;
    onCloseAutoFocus?: (event: unknown) => void;
    onOpenChange(open: boolean): void;
    onUploadFiles?: (files: unknown[]) => void;
    open: boolean;
    sharedAttachmentState?: {
      fileIds?: ReadonlySet<string>;
      folderIds?: ReadonlySet<string>;
    };
  }
  export const no: () => void;
  export const to: (props: LibraryFilePickerDialogProps) => unknown;
  export interface SurfaceClaimProps extends Record<string, unknown> {
    children: unknown;
    claim: unknown;
  }
  export const Ah: () => void;
  export const kh: (props: SurfaceClaimProps) => unknown;
  export const Jp: (props: Record<string, unknown>) => unknown;
  export const Yp: () => void;
  export interface GptMigrationVisitKey {
    gizmoId: string;
    visitKey: string;
  }
  export const Ip: import("@rchunk/app-shared").ScopedSignalFamily<
    Record<string, unknown>,
    GptMigrationVisitKey,
    boolean
  >;
  export const Pp: import("@rchunk/app-shared").ScopedSignalFamily<
    Record<string, unknown>,
    GptMigrationVisitKey,
    boolean
  >;
  export const Lp: () => void;
  export const Mp: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    visit: GptMigrationVisitKey,
  ) => void;
  export const Np: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    visit: GptMigrationVisitKey,
  ) => void;
  export const Bf: () => void;
  export const Hh: () => void;
  export interface ArtifactTypeDefinition {
    artifact: { label: string; pluginId: string };
  }
  export const Bh: Record<
    "document" | "spreadsheet" | "presentation",
    ArtifactTypeDefinition
  >;
  /** Site live URL 的主机名展示格式化器。 */
  export const xf: (liveUrl?: string | null) => string | null;
  export const yf: (currentUrl: string, candidateUrl: string) => boolean;
  export const Sf: () => void;
  export const Rf: (input: {
    defaultPrompt: string | null;
    pluginDisplayName: string;
    pluginId: string;
  }) => string;
  export const d: () => void; // O9：项目选择器依赖初始化器
  export const n: () => void;
  export const t: unknown;
  export const fc: (props: Record<string, unknown>) => unknown;
  export const mc: () => void;
  export const pc: (props: Record<string, unknown>) => unknown;
  export const _any: any;
}

declare module "@rchunk/form-runtime";
declare module "@rchunk/color-palette";
declare module "@rchunk/automation-dialog";
declare module "@rchunk/schedule-draft" {
  export type ScheduleMode = "custom" | "daily" | "hourly" | "monthly" | "weekdays" | "weekly";
  export type Weekday = "FR" | "MO" | "SA" | "SU" | "TH" | "TU" | "WE";
  export interface ScheduleConfig { customRrule: string; intervalHours: number; intervalMinutes: number | null; mode: ScheduleMode; monthDay: number; oneTimeDate?: string; oneTimeSeconds?: number; time: string; untilDate?: string; untilTime?: string; weekdays: Weekday[] }
  export interface AutomationRecord { default_timezone?: string; id: string; is_enabled: boolean; next_run_times: string[]; prompt: string; schedule: string; schedule_components: { by_day?: string | null; by_hour?: number | null; by_minute?: number | null; by_month_day?: number | null; frequency: string; start_time?: string | null }; schedule_time_of_day?: "morning" | "afternoon" | "evening" | "night" | null; target_time_utc?: string | null; thread_mode?: string | null; timing_mode?: string | number; title: string }
  export interface AutomationDraft { id: string; kind: "cron"; name: string; prompt: string; rawRrule: string | null; scheduleConfig: ScheduleConfig; scheduleDirty: boolean; status: "ACTIVE" | "PAUSED"; threadMode?: string | null }
  export interface AutomationUpdateRequest { default_timezone?: string; is_enabled: boolean; prompt: string; schedule: string; thread_mode?: string | null; timing_mode?: string | number; title: string }
  export const a: (time: string) => "morning" | "afternoon" | "evening" | "night";
  export const c: () => void;
  export const i: (automation: AutomationRecord, draft: AutomationDraft, now: Date) => "end-past" | "past" | "too-far" | null;
  export const l: (automation: AutomationRecord, config: ScheduleConfig, mode: ScheduleMode) => ScheduleConfig;
  export const n: (automation: AutomationRecord) => AutomationDraft;
  export const o: (automation: AutomationRecord) => Date | null;
  export const r: (automation: AutomationRecord, draft: AutomationDraft) => AutomationUpdateRequest;
  export const s: (automation: AutomationRecord, draft: AutomationDraft) => boolean;
  export const t: Readonly<{ morning: "09:00"; afternoon: "14:00"; evening: "18:00"; night: "22:00" }>;
}
declare module "@rchunk/schedule-fields" {
  import type { AutomationDraft, AutomationRecord } from "@rchunk/schedule-draft";
  export interface AutomationItem { automation: AutomationRecord & { canManage?: boolean; conversation_id?: string | null; conversation_origin?: string | null; source_conversation_id?: string | null; initial_conversation_id?: string | null; status?: string }; teamId?: string | null }
  export interface AutomationSuggestion { suggested_automation_type?: string; system_hint?: string | null; user_message: string }
  export interface AutomationModel { slug: string; thinkingEffort?: string | null; versionId?: string }
  export interface AutomationOperationScope { accountId?: string | null; getDefaultModel?(origin?: string): AutomationModel; logEvent?(event: Record<string, unknown>): void; markConversationRead?(conversationId: string): Promise<void> | void; navigate?(location: { pathname: string; search?: string }, options?: { state?: unknown }): void; runAutomation?(input: { automationId: string; conversationId: string; model: AutomationModel; prompt: string; signal: AbortSignal }): Promise<{ conversationId?: string; serverConversationId?: string } | null>; startSuggestion?(input: { conversationId: string; forceUseSearch?: boolean; model: AutomationModel; prompt: string; signal: AbortSignal; suggestedAutomationType?: string; systemHints: string[] }): Promise<{ conversationId?: string; serverConversationId?: string } | null>; subscribeAccount?(listener: (accountId: string | null | undefined) => void): () => void; updateAutomation?(automationId: string, request: import("@rchunk/schedule-draft").AutomationUpdateRequest, signal: AbortSignal): Promise<AutomationRecord> }
  export const a: (scope: AutomationOperationScope, item: AutomationItem, navigate?: AutomationOperationScope["navigate"], options?: { source?: "editor" | "scheduled_page"; state?: unknown }) => void;
  export const c: (scope: AutomationOperationScope, input: { conversationId: string; conversationOrigin?: string; suggestion: AutomationSuggestion; signal: AbortSignal }) => Promise<string>;
  export const d: (scope: AutomationOperationScope, item: AutomationItem) => Promise<void>;
  export const f: (policy: { preferredModel?: AutomationModel; versionOptions?: Array<{ id?: string; model?: AutomationModel }> } | null | undefined, origin?: string) => AutomationModel | undefined;
  export const g: (scope: AutomationOperationScope, input: { item: AutomationItem; destination: "conversation" | "editor"; source: "editor" | "scheduled_page" }) => void;
  export const h: (scope: AutomationOperationScope) => void;
  export const i: () => void; export const l: (item: AutomationItem) => string | null; export const m: () => void; export const n: () => void;
  export const o: (scope: AutomationOperationScope, input: { automation: AutomationItem["automation"]; conversationId: string; conversationOrigin?: string; signal: AbortSignal }) => Promise<string>;
  export const p: () => void;
  export const r: (scope: AutomationOperationScope, signal: AbortSignal) => { signal: AbortSignal; dispose(): void };
  export const s: (scope: AutomationOperationScope, input: { automation: AutomationRecord & { canManage?: boolean; status?: string }; draft: AutomationDraft; signal: AbortSignal }) => Promise<AutomationRecord>;
  export const t: (props: { automation: AutomationRecord; draft: AutomationDraft; onChange(draft: AutomationDraft): void; sharedPreview?: boolean }) => unknown;
  export const u: () => void;
}
declare module "@rchunk/automation-frequency-section";
declare module "@rchunk/platform-ui-kit-provider";
declare module "@rchunk/navigation-blocker";
declare module "@rchunk/automation-share-dialog";
declare module "@rchunk/date-picker-runtime";
declare module "@rchunk/binary-preview-source" { export interface BinaryPreviewSource { contentsBase64?: string | null; cwd?: string | null; environmentId?: string; hostId?: string; isError?: boolean; isLoading?: boolean; kind: "git" | "worktree"; mimeType?: string | null; path?: string; ref?: string } export const a: () => void; export const i: (props: { children?: unknown }) => unknown; export const n: (source?: BinaryPreviewSource | null) => { dataUrl: string | null; isError: boolean; isLoading: boolean }; export const o: (props: { after?: unknown; before?: unknown; className?: string; showAfterOnly?: boolean }) => unknown; export const r: (props: { className?: string }) => unknown; export const s: () => void; export const t: () => void }
declare module "@rchunk/surface" {
  export interface MetadataEntry { key: string; value: string | string[] }
  export interface SurfaceProps { background?: "normal" | "subtle"; children?: unknown; className?: string; overflow?: "auto" | "clip" }
  export interface MarkdownSurfaceProps { conversationId?: string | null; cwd?: string | null; enableMetadataPreview?: boolean; hideCodeBlocks?: boolean; hostId?: string; isStreaming?: boolean; markdown: string }
  export const i: () => void;
  export const n: (props: SurfaceProps) => unknown;
  export const r: (props: MarkdownSurfaceProps) => unknown;
  export const t: (props: { entries: MetadataEntry[] }) => unknown;
}
declare module "@rchunk/pdf-preview-diff" { export const PdfPreviewDiff: (props: { currentPage?: number; error?: string | null; isLoading?: boolean; leftLabel?: string; rightLabel?: string; totalPages?: number; onNextPage?(): void; onPreviousPage?(): void }) => unknown; }
declare module "@rchunk/tiny-invariant" { export const n: (condition: unknown, message?: string) => asserts condition; export const t: () => void }
declare module "@rchunk/conversation-diff-comments" { export interface ConversationDiffComment { id?: string; path?: string | null; text?: string; [key: string]: unknown } export interface ConversationDiffCommentService { getComments?(conversationId: string): ConversationDiffComment[]; getModelComments?(conversationId: string): ConversationDiffComment[]; setComments?(conversationId: string, comments: ConversationDiffComment[]): void } export const n: (conversationId: string, service?: ConversationDiffCommentService) => { comments: ConversationDiffComment[]; modelComments: ConversationDiffComment[]; setComments(next: ConversationDiffComment[]): void }; export const t: () => void; }
declare module "@rchunk/artifact-preview-header" { export const n: () => void; export const r: (action: (() => Promise<void> | void) | undefined) => Promise<{ ok: boolean; error?: string }>; export const t: (props: { canDownload?: boolean; downloading?: boolean; openTargets?: Array<{ id: string; label: string }>; title?: string; onDownload?(): Promise<void> | void; onOpen?(targetId: string): void; onReveal?(): void }) => unknown; }
declare module "@rchunk/compact-empty-state" { export const n: () => void; export const t: (props: { actions?: unknown; className?: string; contentClassName?: string; description?: unknown; icon: unknown; title: unknown }) => unknown }
declare module "@rchunk/file-viewer-frame" { export const n: () => void; export const t: (props: { className?: string; filePath: string; fileViewer: { hostId?: string; [key: string]: unknown }; lifetime?: unknown; mcpAppId: string; recipient?: unknown }) => unknown }
declare module "@rchunk/text-file-editor-tab-content" { export interface TextFileEditorProps { content?: string; editor: { kind: "pierre" | "code" | string }; filePath: string; isActive?: boolean; language?: string; onDraftChange?(content: string): void; onSaveChange?(saved: boolean): void; onUnsavedChangesChange?(unsaved: boolean): void; readOnly?: boolean; tabId: string } export const i: () => void; export const n: () => void; export const r: (environmentId: string, cwd: string) => string; export const t: (props: TextFileEditorProps) => unknown; }
declare module "@rchunk/codemirror-state-runtime"; declare module "@rchunk/codemirror-view-runtime"; declare module "@rchunk/codemirror-commands-runtime"; declare module "@rchunk/codemirror-language-runtime"; declare module "@rchunk/text-editor-merge-runtime";
declare module "@rchunk/read-saved-plan-content" { export interface ReadSavedPlanContentInput { hostId: string; path: string; save?: (() => boolean | Promise<boolean>) | null } export const n: (input: ReadSavedPlanContentInput) => Promise<string>; export const t: () => void }
declare module "@rchunk/gate";
declare module "@rchunk/File";
declare module "@rchunk/file-blank";
declare module "@rchunk/detail-section-state" { export const n: () => void; export const t: (props: Record<string, unknown> & { children?: unknown; className?: string; tone?: "danger" | "secondary" }) => unknown }
declare module "@rchunk/pull-request-revision-queries";
declare module "@rchunk/commit";
declare module "@rchunk/open-pull-request-fix-automation-panel";
declare module "@rchunk/pull-request-detail-query" { export interface PullRequestDetail { additions?: number; baseBranch?: string | null; canMerge?: boolean; checks?: Array<{ id?: string; link?: string | null; name: string; status: "failing" | "neutral" | "passing" | "pending" | "skipped" | "unknown" }>; ciStatus?: string; deletions?: number; headBranch?: string | null; isAuthor?: boolean; isDraft?: boolean; mergeBlocker?: string | null; number?: number; repo?: string; state?: string; title?: string; url?: string } export const C: () => void; export const S: (props: Record<string, unknown>) => unknown; export const _: (props: Record<string, unknown>) => unknown; export const a: () => void; export const b: (props: Record<string, unknown>) => unknown; export const c: (props: Record<string, unknown>) => unknown; export const d: () => void; export const f: (props: Record<string, unknown>) => unknown; export const g: (props: Record<string, unknown>) => unknown; export const h: (props: Record<string, unknown>) => unknown; export const i: (props: Record<string, unknown>) => unknown; export const l: () => void; export const m: (props: Record<string, unknown>) => unknown; export const n: (props: Record<string, unknown>) => unknown; export const o: () => void; export const p: () => void; export const r: () => void; export const s: Readonly<{ key: "pull-request-repository-compatibility" }>; export const t: (props: Record<string, unknown>) => unknown; export const u: (input: Record<string, unknown>) => string | null; export const v: () => void; export const x: () => void; export const y: () => unknown; }
declare module "@rchunk/pull-request-code-review" { export const PullRequestCodeReview: (props: { baseBranch?: string | null; headBranch?: string | null; headRevision?: string | null; request?: unknown }) => unknown; }
declare module "@rchunk/pull-request-route" { export const PullRequestsRoute: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/pull-request-tab-content" { export const PullRequestWorkspaceTab: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/auto-review-approval-nudge" { export const AutoReviewApprovalNudge: (props: { conversationId: string; hostId: string; learnMoreUrl?: string; onDismiss?(input: { conversationId: string; hostId: string }): void; onEnable?(input: { conversationId: string; hostId: string }): Promise<void> | void }) => unknown; }
declare module "@rchunk/editor-diff-page" { export const EditorDiffPage: (props?: { conversationId?: string | null; diffContent?: string | null; error?: string | null; initialViewType?: "split" | "unified"; richPreviewEnabled?: boolean }) => unknown; }
declare module "@rchunk/review-slash-command-submenu-registration" { export const ReviewSlashCommandSubmenuRegistration: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/debug-modal" { export const DebugModal: (props: { initialRect?: Partial<{ height: number; width: number; x: number; y: number }>; onClose(): void; viewport?: { height: number; width: number } }) => unknown; }
declare module "@rchunk/pet-install-modal-host" { export const PetInstallModalHost: (props: Record<string, unknown> & { onClose(): void }) => unknown; }
declare module "@rchunk/subscription-renewal-dialog" { export const SubscriptionRenewalDialog: (props: Record<string, unknown> & { onClose(): void }) => unknown; }
declare module "@rchunk/upgrade-plan-dialog" { export const UpgradePlanDialog: (props: Record<string, unknown>) => unknown; export const UpgradePlanDialogModal: (props: Record<string, unknown> & { onClose(): void }) => unknown; }
declare module "@rchunk/voice-personalization-dialog" { export const VoicePersonalizationDialog: (props: Record<string, unknown> & { accountId: string; onBack(): void; onClose(): void; onComplete(): void }) => unknown; }
declare module "@rchunk/slides-outline-template-picker" { export const SlidesOutlineTemplatePicker: (props: Record<string, unknown> & { onOpenChange(open: boolean): void; onSelect(template: unknown): void; open: boolean }) => unknown; }
declare module "@rchunk/avatar-mascot-button" { export const a: () => void; export const c: Readonly<Record<string, number | string>>; export const d: Readonly<Record<string, unknown>>; export const f: Readonly<{ duration: 0.22; ease: readonly number[] }>; export const i: Readonly<Record<string, string>>; export const l: Readonly<Record<string, number | string>>; export const m: () => void; export const n: (props: { notificationBadge: string | number }) => unknown; export const o: Readonly<Record<string, string>>; export const p: (pixels: number) => string; export const r: () => void; export const s: () => void; export const t: (props: { ariaLabel?: string; className?: string; lookFrame?: number | null; notificationBadge?: string | number | null; source?: string; state?: "idle" | "jumping" | "running" | "waving"; style?: Record<string, unknown>; transientState?: "idle" | "jumping" | "running" | "waving"; onContextMenu?(event: unknown): void }) => unknown; export const u: Readonly<Record<string, unknown>>; }
declare module "@rchunk/codex-pet-assets" { export const n: () => void; export const t: Readonly<Record<"bsod" | "codex" | "dewey" | "fireball" | "hoots" | "null-signal" | "rocky" | "seedy" | "stacky", string>>; }
declare module "@rchunk/use-avatar-options" { export interface AvatarOption { id: string; label?: string; source?: string; type?: "builtin" | "cloud" | "custom" } export interface AvatarOptionsInput { avatarDirectory?: string | null; cloudAvatars?: readonly AvatarOption[]; includeCloudPets?: boolean; isError?: boolean; isFetching?: boolean; isLoading?: boolean; localAvatars?: readonly AvatarOption[]; selectedAvatarId?: string | null } export const n: (input?: AvatarOptionsInput) => { avatarDirectory: string | null; avatarOptions: AvatarOption[]; isError: boolean; isFetching: boolean; isLoading: boolean }; export const t: () => void; }
declare module "@rchunk/pet-install-state" {
  export interface PetPreview { spriteVersionNumber: number; [key: string]: unknown }
  export interface PetRequest extends Record<string, unknown> { description?: string; imageUrl: string; name: string; spriteVersionNumber?: number }
  export type PetInstallState = null | (PetRequest & { installedAvatarId?: string; preview?: PetPreview; status: "installError" | "installed" | "installing" | "loading" | "previewError" | "ready" });
  export interface PetStateKey { value: PetInstallState }
  export interface PetStateScope { get<Value>(key: PetStateKey): Value; set(key: PetStateKey, value: PetInstallState): void }
  export const a: (scope: PetStateScope, request: PetRequest, preview?: (request: PetRequest) => Promise<PetPreview>) => Promise<void>;
  export const i: PetStateKey;
  export const n: () => void;
  export const r: (scope: PetStateScope, refresh: () => Promise<unknown>, install?: (request: PetRequest) => Promise<{ id: string }>) => Promise<void>;
  export const t: (scope: PetStateScope) => void;
}
declare module "@rchunk/subscription-plan-status" {
  export type SubscriptionPlan = "free" | "go" | "plus" | "pro" | "prolite" | string;
  export interface SubscriptionPlanStatusAccount { account: { plan_type: SubscriptionPlan }; entitlement: { cancels_at?: string | null; expires_at?: string | null; is_delinquent?: boolean; renews_at?: string | null; scheduled_plan_change?: { changes_at?: string | null; plan_type: SubscriptionPlan } | null }; last_active_subscription: { will_renew: boolean } }
  export const n: (props: { account: SubscriptionPlanStatusAccount; renewalPrice?: unknown; scheduledCadence?: string | null; showProLevels?: boolean }) => unknown;
  export const r: () => void;
  export const t: (input: { plan: SubscriptionPlan; showProLevels?: boolean }) => string;
}
declare module "@rchunk/format-amount" {
  export interface AmountFormatter { formatNumber(value: number, options: Intl.NumberFormatOptions): string }
  export const n: () => void;
  export const t: (intl: AmountFormatter, amount: number, currencyCode: string) => string;
}
declare module "@rchunk/chatgpt-subscription-events";
declare module "@rchunk/pricing-plan-comparison" { export type PricingPlan = "free" | "go" | "plus" | "prolite" | "pro" | "self_serve_business" | "self_serve_business_usage_based" | string; export const i: () => void; export const n: () => void; export const r: (currentPlan: PricingPlan, targetPlan: PricingPlan, interval?: "month" | "year") => string | null; export const t: (props: { currentPlan: PricingPlan; offers?: Record<string, { price?: string }>; plans?: PricingPlan[]; billingInterval?: "month" | "year"; onSelectPlan?(plan: PricingPlan, checkoutUrl: string | null): void }) => unknown; }
declare module "@rchunk/voice-configuration-manager" { export type VoiceMode = "wingman" | "advanced" | "standard"; export interface VoicePolicyConfig { rollout_policy?: "unavailable" | "available_opt_in" | "available_default"; rollout_version?: number; unavailable_upsell_policy?: string; wingman_model_name?: string; wingman_model_picker_default_display_name?: string; wingman_model_picker_alternative_options?: Array<{ display_name?: string; slug: string }>; incall_voice_model_picker_available?: boolean } export interface VoiceScope { policy?: VoicePolicyConfig; selectedVoiceMode?: VoiceMode; selectedPolicyVersion?: number; authenticated?: boolean; potatoHint?: boolean; unsupportedContext?: boolean } export const a: () => void; export const i: { readPolicyConfig(scope: VoiceScope): VoicePolicyConfig; shouldShowWingmanComingSoon(scope: VoiceScope, sessionType: string): boolean; wingmanModelName(scope: VoiceScope): string; wingmanDisplayName(scope: VoiceScope, slug?: string | null): string; policyVersion(scope: VoiceScope): number | undefined; isInCallVoiceModelPickerAvailable(scope: VoiceScope): boolean; policyResolvedVoice(scope: VoiceScope): VoiceMode | undefined; isWmOptionAvailable(scope: VoiceScope): boolean; getBaseVoiceOptions(scope: VoiceScope): Array<{ modelSlug: string; voiceModel: VoiceMode }>; sessionType(mode?: string): "no-microphone" | "vp"; speakingListeningTrigger(mode?: string): "energy" | "server" }; export const n: () => void; export const o: (value: string) => boolean; export const r: (scope: VoiceScope) => boolean; export const t: (pathname: string) => string | undefined; }
declare module "@rchunk/chatgpt-voices-query" { export interface VoiceResponse { voices: Array<{ description?: string | null; name?: string | null; preview_url?: string; voice: string }>; [key: string]: unknown } export const n: { getOptions(input: { spoken_language?: string | null; voice_mode?: string }, context?: { accountId?: string | null; defaultLanguage?: string }): { queryKey: readonly unknown[]; queryFn(): Promise<VoiceResponse>; select(response: VoiceResponse): VoiceResponse & { voices: Array<{ description: string; name: string; orbTreatment: string; previewUrl?: string; slug: string }> }; staleTime: 0; refetchOnMount: "always"; retryOnMount: true } }; export const r: () => void; export const t: readonly ["chatgpt-settings-voices"] }
declare module "@rchunk/library-item-actions" { export interface LibraryActionNode { downloadUrl?: string; file_id?: string | null; id: string; kind: "directory" | "file"; mime_type?: string | null; name: string; parent_directory_id?: string | null; requestHeaders?: Record<string, string> } export interface LibraryActionSelection { canDelete?: boolean; canDownload?: boolean; canMove?: boolean; canRename?: boolean; canRestore?: boolean; node: LibraryActionNode } export type LibraryItemAction = { type: "delete"; permanently?: boolean } | { type: "download"; analyticsContext?: unknown } | { type: "move"; directoryId: string | null } | { type: "rename"; name: string } | { type: "restore" }; export interface LibraryItemActionScope { api: { delete(path: string, input?: Record<string, unknown>): Promise<{ success?: boolean }>; patch(path: string, input?: Record<string, unknown>): Promise<unknown>; post(path: string, input?: Record<string, unknown>): Promise<unknown> }; download?(node: LibraryActionNode): Promise<void> | void; invalidate?(action: LibraryItemAction): Promise<void> | void; notifyError?(message: string): void } export const i: (scope: LibraryItemActionScope, item: LibraryActionSelection, action: LibraryItemAction, skipInvalidation?: boolean) => Promise<boolean>; export const n: Map<string, boolean>; export const r: (scope: LibraryItemActionScope, items: LibraryActionSelection[], action: LibraryItemAction) => Promise<string[]>; export const t: () => void }
declare module "@rchunk/library-trash-analytics" { export interface LibraryTrashAnalyticsScope { get?(key: unknown): unknown; log?(event: Record<string, unknown>): void } export const a: { value: string }; export const i: (scope: LibraryTrashAnalyticsScope, items: Array<{ node: { id: string } }>) => void; export const n: (scope: LibraryTrashAnalyticsScope, sessionId: string, interactionType: string, error: unknown) => void; export const r: (scope: LibraryTrashAnalyticsScope, items: Array<{ node: { id: string } }>) => void; export const t: () => void }
declare module "@rchunk/source-dashed-border" { export const n: () => void; export const t: (props: { isDragActive?: boolean }) => unknown }
declare module "@rchunk/analytics-runtime" { export interface SharedPromptAnalytics { promptTextLength: number; shareId?: string; sourceConversationIsWorkMode?: boolean } export interface SharedPromptAnalyticsScope { log?(descriptor: string, payload: Record<string, unknown>): void } export const a: (scope: SharedPromptAnalyticsScope) => void; export const i: (scope: SharedPromptAnalyticsScope, shared: SharedPromptAnalytics, submittedLength?: number) => void; export const n: (scope: SharedPromptAnalyticsScope, result: "failure" | "success", payload?: Record<string, unknown>) => void; export const r: (scope: SharedPromptAnalyticsScope, shared: SharedPromptAnalytics) => void; export const t: () => void }
declare module "@rchunk/chatgpt-projects-runtime" { export const a: Readonly<{ $type: "protobuf_analytics_events.v1.ChatgptProjectSettingsSaveInitiated" }>; export const i: Readonly<{ $type: "protobuf_analytics_events.v1.ChatgptProjectSettingsSaveFailed" }>; export const n: Readonly<{ $type: "protobuf_analytics_events.v1.ChatgptProjectSettingsOpened" }>; export const o: () => void; export const r: Readonly<{ $type: "protobuf_analytics_events.v1.ChatgptProjectSettingsSaveCompleted" }>; export const t: Readonly<{ $type: "protobuf_analytics_events.v1.ChatgptProjectFileLimitUpgradeClicked" }> }
declare module "@rchunk/cadence-events" {
  export type BillingCadence = "monthly" | "yearly";
  export interface BillingCadenceState { annualPrice: { amount: number; tax?: number }; annualSavingsAmount: number; annualSavingsPercentage: number; billingCurrency: string; currentCadence: BillingCadence; displayPricingSource: string; effectiveNextCadence: BillingCadence; isAcquisitionCandidate: boolean; isRetentionCandidate: boolean; monthlyPrice: { amount: number; tax?: number }; renewalDate: Date; requiresReactivation: boolean; scheduledCadence: BillingCadence | null }
  export const a: (state: BillingCadenceState, target: BillingCadence) => string;
  export const c: (invoice?: { amount_due?: { amount?: number }; renewal_date?: string | null } | null) => boolean;
  export const i: (account: Record<string, unknown>, subscription: Record<string, unknown> | null, pricing: Record<string, unknown> | null, now?: number) => BillingCadenceState | null;
  export const n: (scope: { log?(event: Record<string, unknown>): void }, event: Record<string, unknown>) => void;
  export const o: () => void;
  export const r: (error: unknown, target: BillingCadence) => string;
  export const s: (account: Record<string, unknown>) => boolean;
  export const t: () => void;
}
declare module "@rchunk/add-payment-method" {
  export interface AddedPaymentMethod { billingDetails?: Record<string, unknown>; paymentMethodId?: string; token?: string }
  export interface AddPaymentMethodProps { accountId: string; error?: string | null; isLoading?: boolean; isSubmitting?: boolean; onClose(): void; onCloseAutoFocus?(): void; onRetry?(): void; onSubmit?(input: { accountId: string; billingName: string; cardComplete: boolean }): Promise<AddedPaymentMethod | void> | AddedPaymentMethod | void; onSuccess?(method?: AddedPaymentMethod): void }
  export const n: () => void;
  export const t: (props: AddPaymentMethodProps) => unknown;
}
declare module "@rchunk/billing-form-options" { export interface BillingExperimentReader { getLayer(id: string): { get<Value>(key: string, fallback: Value): Value }; getDynamicConfig(id: string): { get<Value>(key: string, fallback: Value): Value } } export const n: () => void; export const r: { readonly AddressElement: "AddressElement"; readonly Elements: "Elements"; readonly ExpressCheckoutElement: "ExpressCheckoutElement"; readonly PaymentElement: "PaymentElement" }; export const t: (experiments: BillingExperimentReader, context?: { checkoutSessionId?: string; email?: string; isNewStripeCustomer?: boolean; minimalBillingAddress?: Record<string, unknown>; useMinimalBillingAddress?: boolean }) => { checkoutSessionId?: string; defaultValues?: { billingDetails: { email: string } }; isGooglePayEnabled: boolean; isNewStripeCustomer?: boolean; minimalBillingAddress?: Record<string, unknown>; paymentElementLayoutMode: string; paymentMethodOrder?: string[]; shouldHidePaymentElementName: boolean; useMinimalBillingAddress?: boolean }; }
declare module "@rchunk/delinquent-upgrade-preparation" {
  export interface DelinquentUpgradePreparationInput extends Record<string, unknown> { accountId: string; hasPromotion?: boolean; initialPlan: string; pricingInfo?: unknown; updatedPlan: string; userId: string }
  export const n: () => void;
  export const r: (input: DelinquentUpgradePreparationInput) => Promise<Record<string, unknown> | null>;
  export const t: (error: unknown) => string | undefined;
}
declare module "@rchunk/payment-method-display" {
  export interface DisplayPaymentMethod extends Record<string, unknown> { card?: { brand?: string; last4?: string }; cashapp?: { cashtag?: string }; custom?: { payment_method_type?: string; provider?: string }; ideal?: { bank?: string }; kr_card?: { brand?: string; last4?: string }; link?: { email?: string }; paypal?: { payer_email?: string }; sepa_debit?: { last4?: string }; type: string; upi?: { vpa?: string } }
  export const n: () => void;
  export const t: (method: DisplayPaymentMethod) => { description: unknown; label: unknown };
}
declare module "@rchunk/edit-payment-method" {
  export interface EditablePaymentMethod { billing_details?: { address?: Record<string, unknown>; name?: string | null }; card?: { brand?: string; exp_month?: number; exp_year?: number; last4?: string }; id: string }
  export interface EditPaymentMethodProps { accountId: string; error?: string | null; isLoading?: boolean; isSubmitting?: boolean; method?: EditablePaymentMethod | null; methodId: string; now?: Date; onClose(): void; onCloseAutoFocus?(): void; onRetry?(): void; onSave?(input: { accountId: string; billingName: string; expMonth: number; expYear: number; methodId: string }): Promise<void> | void }
  export const n: () => void;
  export const t: (props: EditPaymentMethodProps) => unknown;
}
declare module "@rchunk/subscription-recovery-events" {
  export interface SubscriptionRecoveryEventScope { logProductEvent?(descriptor: string, payload: Record<string, unknown>): void }
  export const n: () => void;
  export const r: (scope: SubscriptionRecoveryEventScope, action: "shown" | "dismissed" | "cta_clicked", payload?: Record<string, unknown>) => void;
  export const t: (scope: SubscriptionRecoveryEventScope, action: "shown" | "dismissed" | "pay_now_clicked" | "requires_action" | "payment_failed" | "payment_error" | "payment_succeeded", payload?: Record<string, unknown>) => void;
}
declare module "@rchunk/project-share-model" {
  export interface ProjectShareCapabilities extends Record<string, boolean | undefined> { can_read?: boolean; can_share?: boolean; can_view_config?: boolean; can_write?: boolean }
  export type ProjectShareSubject = { capabilities: ProjectShareCapabilities; type: 1; user_email?: string; user_id: string; user_name?: string } | { capabilities: ProjectShareCapabilities; group_id: string; group_name?: string; type: 2 } | { capabilities: ProjectShareCapabilities; type: 3 | 4 } | { capabilities: ProjectShareCapabilities; type: 10; user_email: string };
  export const a: () => void;
  export const c: (subject: ProjectShareSubject) => string;
  export const i: (project: { gizmo: { id: string; short_url?: string } }) => string;
  export const l: (subject: ProjectShareSubject, accountId?: string) => Record<string, unknown>;
  export const n: (subjects: readonly ProjectShareSubject[]) => "link" | "private" | "workspace_link";
  export const o: (previous: readonly ProjectShareSubject[], next: readonly ProjectShareSubject[]) => boolean;
  export const r: (project: Record<string, unknown> | null | undefined, account: Record<string, unknown> | null | undefined, policy?: Record<string, unknown> | null) => { canInvite: boolean; canListWorkspaceMembers: boolean; canManage: boolean; canOpen: boolean; canShareWorkspaceLink: boolean };
  export const s: (subject: ProjectShareSubject) => string | undefined;
  export const t: Readonly<Record<"chat" | "edit", ProjectShareCapabilities>>;
}
declare module "@rchunk/builder-analytics" {
  export interface BuilderAnalyticsScope { get?<Value>(key: symbol): Value; set?<Value>(key: symbol, value: Value): void; track?(schema: { $type: string }, payload: Record<string, unknown>): void }
  export const a: Readonly<Record<string, string>>; export const c: Readonly<Record<string, string>>; export const i: Readonly<Record<string, string>>; export const l: Readonly<Record<string, string>>;
  export const n: (scope: BuilderAnalyticsScope, payload: Record<string, unknown>) => void;
  export const o: Readonly<Record<string, string>>; export const r: Readonly<Record<string, string>>; export const s: Readonly<Record<string, string>>;
  export const t: () => void; export const u: () => void;
}
declare module "@rchunk/read-error" { export const n: () => void; export const t: (props: { children?: unknown; loading?: boolean; onRetry?(): void }) => unknown }
declare module "@rchunk/animated-segmented-toggle" {
  export interface AnimatedSegmentedToggleProps { animateSelection?: boolean; ariaLabel: string; className?: string; onSelect(id: string): void; options: Array<{ ariaLabel?: string; id: string; label: unknown }>; selectedId: string; size?: "compact" | "default" }
  export const n: () => void;
  export const t: (props: AnimatedSegmentedToggleProps) => unknown;
}
declare module "@rchunk/radio-group" {
  export interface RadioGroupProps extends Record<string, unknown> { __isWidget?: boolean; children?: unknown; className?: string; direction?: "column" | "row"; disabled?: boolean; onChange?(value: string): void; value?: string }
  export interface RadioItemProps extends Record<string, unknown> { block?: boolean; children?: unknown; className?: string; disabled?: boolean; id?: string; required?: boolean; value: string }
  export interface RadioGroupComponent { (props: RadioGroupProps): unknown; Item(props: RadioItemProps): unknown }
  export const n: RadioGroupComponent;
  export const r: () => void;
  export const t: () => void;
}
declare module "@rchunk/cme-state" { export interface CmeIdentity { accountId: string; userId: string } export interface CmeScope { currentIdentity?(): CmeIdentity | null; invalidate?(key: string, identity: CmeIdentity): Promise<unknown> | unknown; setData?(key: string, identity: CmeIdentity, data: unknown): void; download?(blob: Blob, filename: string): void } export const a: (scope: CmeScope, identity: CmeIdentity, calendarYear: number) => Promise<void>; export const c: (scope: CmeScope, identity: CmeIdentity, request: Record<string, unknown>) => Promise<unknown>; export const i: { evaluate(identity?: CmeIdentity | null): CmeIdentity | null }; export const l: (scope: CmeScope, identity: CmeIdentity, request: Record<string, unknown>) => Promise<unknown>; export const n: { getOptions(identity: CmeIdentity, current?: CmeIdentity | null): Record<string, unknown> }; export const o: () => void; export const r: { getOptions(identity: CmeIdentity, current?: CmeIdentity | null): Record<string, unknown> }; export const s: (scope: CmeScope, identity: CmeIdentity, conversationId: string) => Promise<void>; export const t: { getOptions(identity: CmeIdentity, current?: CmeIdentity | null): Record<string, unknown> } }
declare module "@rchunk/format-bytes" { export const n: () => void; export const t: (bytes: number, intl: { formatNumber(value: number, options: Intl.NumberFormatOptions): string }) => string }

declare module "@rchunk/dictionary-dialog" {
  export interface DictionaryWord { id: string; text: string; }
  export const DictionaryDialog: (props: Record<string, unknown> & { accountId: string; onClose(): void; userId: string; words?: DictionaryWord[] }) => unknown;
}
declare module "@rchunk/library-item-dialogs" {
  export const ConfirmLibraryItemsDialog: (props: Record<string, unknown> & { accountId: string; entries: Array<Record<string, unknown>>; onClose(): void; userId: string }) => unknown;
  export const RenameLibraryItemDialog: (props: Record<string, unknown> & { accountId: string; entry: Record<string, unknown>; onClose(): void; userId: string }) => unknown;
}
declare module "@rchunk/library-move-dialog" { export const MoveLibraryItemsDialog: (props: Record<string, unknown> & { accountId: string; entries: Array<Record<string, unknown>>; onClose(): void; onMoved(ids: string[]): void; userId: string }) => unknown; }
declare module "@rchunk/chatgpt-project-create-dialog" { export const ChatGptProjectCreateDialog: (props: Record<string, unknown> & { onClose(): void }) => unknown; }
declare module "@rchunk/chatgpt-project-add-sources-dialog" { export const ChatGptProjectAddSourcesDialog: (props: Record<string, unknown> & { onClose(): void; onFilesSelected(files: File[]): void; projectId: string }) => unknown; }
declare module "@rchunk/profile-share-dialog-content" { export const ProfileShareDialogContent: (props: Record<string, unknown> & { accountId: string; onClose(): void; userId: string }) => unknown; }
declare module "@rchunk/scheduled-task-share-dialog" { export const ScheduledTaskShareDialog: (props: Record<string, unknown> & { automation: { id: string; prompt: string }; onClose(): void }) => unknown; }
declare module "@rchunk/image-prompt-share-dialog" { export const ImagePromptShareDialog: (props: Record<string, unknown> & { accountId: string; onClose(): void; shareSessionId: string; sourceContent: { prompt: string; title: string }; userId: string }) => unknown; }
declare module "@rchunk/chatgpt-project-settings-modal" { export const ChatGptProjectSettingsModal: (props: Record<string, unknown> & { accountId: string; onClose(): void; project: Record<string, unknown> }) => unknown; }
declare module "@rchunk/profile-showcase-editor" { export const ProfileShowcaseEditor: (props: Record<string, unknown> & { accountId: string; onClose(): void; savedItems: Array<Record<string, unknown>>; userId: string }) => unknown; }
declare module "@rchunk/billing-cadence-dialog" { export const BillingCadenceDialog: (props: Record<string, unknown> & { accountId: string; entryPoint: string; onClose(): void; state: Record<string, unknown> }) => unknown; }
declare module "@rchunk/subscription-recovery-dialog" { export const RecoveryDialog: (props: Record<string, unknown> & { accountId: string; onClose(): void; onComplete(): void; planName: string }) => unknown; }
declare module "@rchunk/subscription-cancellation-dialog" { export const CancellationDialog: (props: Record<string, unknown> & { account: Record<string, unknown>; accountId: string; onClose(): void }) => unknown; }
declare module "@rchunk/credit-reload-dialog-host" { export const CreditReloadDialogHost: (props: Record<string, unknown> & { onClose(): void; source: string; variant: string }) => unknown; }
declare module "@rchunk/product-report-dialog" { export const ProductReportDialog: (props: Record<string, unknown> & { onClose(): void; product: Record<string, unknown> }) => unknown; }
declare module "@rchunk/chatgpt-project-share-dialog" { export const ChatGptProjectShareDialog: (props: Record<string, unknown> & { accountId: string; onClose(): void; projectId: string }) => unknown; }
declare module "@rchunk/workspace-agent-schedules-dialog" { export const WorkspaceAgentSchedulesDialog: (props: Record<string, unknown> & { accountId: string; agentId: string; onClose(): void }) => unknown; }
declare module "@rchunk/cme-dialog" { export const CmeDialog: (props: Record<string, unknown> & { onClose(): void }) => unknown; }
declare module "@rchunk/browser-browsing-data-dialog" {
  export const a: (props: { download: Record<string, unknown> }) => unknown;
  export const c: (props: { download: Record<string, unknown>; reducedMotion?: boolean }) => unknown;
  export const d: (platform: "linux" | "macOS" | "windows") => string;
  export const f: () => void;
  export const i: (service: Record<string, unknown> | null, onError: (error: Error) => void) => Record<string, unknown>;
  export const l: (props: Record<string, unknown>) => unknown;
  export const n: () => void;
  export const o: (props: Record<string, unknown> & { label: string; onClick(): void }) => unknown;
  export const r: () => void;
  export const s: (props: { download: Record<string, unknown> }) => unknown;
  export const t: (props: Record<string, unknown> & { onClose(): void }) => unknown;
  export const u: () => void;
}
declare module "@rchunk/chronicle-permissions-dialog" {
  export const S: () => void; export const _: () => void; export const a: () => string; export const b: () => void;
  export const c: () => string; export const d: () => string; export const f: () => void; export const g: (...args: unknown[]) => Promise<void>;
  export const h: unknown; export const i: () => string; export const l: () => string; export const m: unknown; export const n: () => void;
  export const o: () => string; export const p: unknown; export const r: () => string; export const s: () => string;
  export const t: (props: Record<string, unknown> & { onClose(): void }) => unknown; export const u: () => string;
  export const v: (...args: unknown[]) => Promise<boolean>; export const x: (error: unknown) => string; export const y: (props: Record<string, unknown>) => unknown;
}
declare module "@rchunk/review-file-source-breadcrumb" {
  export const a: () => void; export const c: () => void; export const d: (line: number, lineCount: number) => number; export const i: () => void; export const l: (contents: string) => number; export const n: () => void; export const o: (element: HTMLElement, line: number, character: number) => boolean; export const r: (props: Record<string, unknown>) => unknown; export const s: (props: Record<string, unknown>) => unknown; export const t: (props: Record<string, unknown>) => unknown; export const u: (value: string, lineCount?: number) => number | null;
}
declare module "@rchunk/review-file-tree-side-pane" { export interface ReviewFile { additions?: number; comments?: number; deletions?: number; generated?: boolean; path: string; status?: string } export const a: (props: Record<string, unknown>) => unknown; export const c: (input: Record<string, unknown>) => { commentProps: Record<string, unknown> }; export const i: () => void; export const n: () => void; export const o: () => void; export const r: (props: Record<string, unknown>) => unknown; export const s: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/review-file-source-item" { export type PreviewKind = "audio" | "image" | "pdf" | "presentation" | "spreadsheet" | "text" | "video" | "word-document"; export interface ReviewFileSourceProps { contents?: string | null; contentKind?: string | null; cwd?: string | null; error?: unknown; headerActions?: unknown; hideFileNavigation?: boolean; hostId?: string; isActive?: boolean; isLoading?: boolean; onOpenLocation?(location: unknown): void; onSelectFile?(path: string, options?: { preview?: boolean }): void; path?: string | null; renderSlots?(slots: { content: unknown; headerRows: unknown[] }): unknown; workspaceRoot?: string | null; workspaceRoots?: string[] } export const n: () => void; export const t: (props: ReviewFileSourceProps) => unknown; }
declare module "@rchunk/editable-review-file-source-tab-content" { export const EditableReviewFileSourceTabContent: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/diff-source" {
  export interface DiffHunk { hunkId: string; lineEnd: number; lineMapping?: "contiguous" | string; lineSpans?: Array<{ end: number; lineEnd: number; lineStart: number; side?: "left" | "right" | "unified"; start: number }>; lineStart: number; text: string }
  export interface DiffFile { hunks: DiffHunk[]; path: string }
  export const i: (props: { path: string; skipFindHighlight?: boolean }) => (element: Element | null) => void; export const n: () => void; export const r: () => void;
  export const t: (input: { contextId: string; getFiles(): DiffFile[]; preserveScrollBeforeResultClear?: boolean; scrollAdapter: Record<string, unknown> }) => Record<string, unknown>;
}
declare module "@rchunk/code-diff-context-menu" {
  export const a: (input: Record<string, unknown>) => Record<string, unknown>; export const c: (...arguments_: unknown[]) => Promise<void>; export const d: (props: Record<string, unknown>) => unknown; export const f: () => void; export const i: (...arguments_: unknown[]) => Promise<unknown>; export const l: (props: Record<string, unknown>) => unknown; export const m: () => void; export const n: () => void; export const o: () => void; export const p: (props: Record<string, unknown>) => unknown; export const r: Readonly<{ key: "preferred-open-target" }>; export const s: (...arguments_: unknown[]) => Promise<void>; export const t: (props: Record<string, unknown>) => unknown; export const u: () => void;
}
declare module "@rchunk/automation-editor-dialog" {
  import type { AutomationDraft, AutomationRecord } from "@rchunk/schedule-draft";
  import type { AutomationItem } from "@rchunk/schedule-fields";
  export interface AutomationEditorItem extends Omit<AutomationItem, "automation"> { automation: AutomationRecord & { canDelete?: boolean; canManage?: boolean; conversation_id?: string | null; display_emoji?: string | null; executor?: string; status?: string } }
  export const a: () => void; export const d: () => void; export const h: () => void; export const l: () => void; export const n: () => void; export const p: () => void; export const s: () => void;
  export const c: (props: { triggers?: Array<{ connector_type?: string; id: string; presentation?: { display_name?: string; icon_url?: string } }> | null; onOpenTrigger?(trigger: Record<string, unknown>): void; showUnavailableConditions?: boolean }) => unknown;
  export const f: (props: { automationId: string; children?(content: unknown): unknown; presentation?: "detail-footer" | "editor-footer" | "inline" | "run-result"; sites?: Array<{ project_id: string; title: string }>; onOpenSite?(projectId: string): void }) => unknown;
  export const i: (props: Record<string, unknown> & { onClose(): void; title: unknown }) => unknown;
  export const m: (props: Record<string, unknown>) => unknown;
  export const o: (props: Record<string, unknown> & { item: AutomationEditorItem }) => unknown;
  export const r: (props: Record<string, unknown> & { item: AutomationEditorItem; onClose(): void }) => unknown;
  export const t: (props: { conversationId?: string | null; item: AutomationEditorItem; onClose(): void; presentation?: "dialog" | "panel"; ref?: unknown; relatedActions?: unknown }) => unknown;
  export const u: (props: Record<string, unknown> & { item: AutomationEditorItem }) => unknown;
}
declare module "@rchunk/cloud-automation-detail-panel" {
  import type { AutomationEditorItem } from "@rchunk/automation-editor-dialog";
  export const a: (props: Record<string, unknown>) => unknown; export const c: () => void; export const i: () => void; export const n: () => void; export const o: () => void;
  export const r: (props: Record<string, unknown> & { name: string }) => unknown;
  export const s: (props: Record<string, unknown>) => unknown;
  export const t: (props: { item: AutomationEditorItem; onClose(): void; onOpenConversation?(): void; onSaved?(automation: unknown): void; showRunResults?: boolean }) => unknown;
}
declare module "@rchunk/share-analytics";
declare module "@rchunk/create-pull-request-modal-content";

declare module "@rchunk/report-dialog-core" {
  export const n: () => void;
  export const t: (props: Record<string, unknown> & {
    loadReasons(context: { signal: AbortSignal }): Promise<unknown>;
    onClose(): void;
    queryKey: readonly unknown[];
    submitReport(input: Record<string, unknown>): Promise<unknown>;
    title: unknown;
  }) => unknown;
}

declare module "@rchunk/codex-thread-report-dialog" {
  export const n: () => void;
  export const t: (props: Record<string, unknown> & {
    onClose(): void;
    reportEntityType: string;
    threadId: string;
  }) => unknown;
}

declare module "@rchunk/remote-connection-editor-dialog" {
  export const i: () => void;
  export const n: () => void;
  export const r: (props: Record<string, unknown>) => unknown;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/scheduled-shared-task-dialog-core" {
  export const n: () => void;
  export const t: (props: { postId: string; onClose(): void }) => unknown;
}

declare module "@rchunk/plugin-share-dialog-core" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/remote-connection-editor-draft" {
  export const n: (input: {
    draft: Record<string, unknown>;
    editingHostId?: string;
    existingConnections: Array<Record<string, unknown>>;
  }) => unknown[];
  export const r: () => void;
}

declare module "@rchunk/billing-queries" {
  export const i: (context: { queryClient: { invalidateQueries(input: { queryKey: unknown[] }): Promise<unknown> | unknown } }, accountId: string) => Promise<void>;
  export const n: () => void;
  export const r: (accountId: string) => Record<string, unknown>;
  export const t: (accountId: string) => Record<string, unknown>;
}
declare module "@rchunk/billing-query-error" {
  export const n: () => void;
  export const t: (props: { onRetry(): void }) => unknown;
}
declare module "@rchunk/stripe-client" {
  export const n: () => void;
  export const r: (accountId: string) => Record<string, unknown>;
  export const t: (dark: boolean) => Record<string, unknown>;
}
declare module "@rchunk/billing-state" {
  export const i: (method: { id: string; type?: string; card?: { exp_month?: number; exp_year?: number } }, now?: Date) => boolean;
  export const n: (state: { entitlement: { has_active_subscription?: boolean }; last_active_subscription?: { purchase_origin_platform?: string } }) => "app_store" | "google_play_store" | "partner_managed" | null;
  export const r: () => void;
  export const t: (input: { paymentMethod: { id: string }; defaultPaymentMethodId?: string; autoReloadPaymentMethodId?: string; autoReloadResolved: boolean }) => boolean;
}
declare module "@rchunk/billing-pricing" {
  export const n: () => void;
  export const t: (input: { country?: string; currency?: string; isPricingEnabled(gate: string): boolean; signal?: AbortSignal }) => Promise<Record<string, unknown>>;
}
declare module "@rchunk/subscription-queries" {
  export const a: (accountId: string, scope: Record<string, unknown> | undefined, isPricingEnabled: (gate: string) => boolean) => Record<string, unknown>;
  export const i: () => void;
  export const n: (...arguments_: unknown[]) => { amount: number; currency?: string; period: string } | undefined;
  export const o: (accountId: string) => Record<string, unknown>;
  export const r: (scope?: Record<string, unknown>) => string | null;
  export const t: { safeParse(value: unknown): { success: boolean; data: unknown } };
}
declare module "@rchunk/billing-events" {
  export const n: (store: Record<string, unknown>, error: Error) => void;
  export const r: (store: Record<string, unknown>, event: { name: string; metadata?: Record<string, unknown> }) => void;
  export const t: () => void;
}
declare module "@rchunk/card-tile" {
  export const n: () => void;
  export const t: (props: { actions?: unknown; badges?: unknown[]; className?: string; description?: unknown; disabled?: boolean; icon?: unknown; isHighlighted?: boolean; onClick?(): void; presentation?: "card" | "catalog" | "featured" | "ranked" | "related" | "row"; title: unknown; tooltip?: unknown }) => unknown;
}
declare module "@rchunk/plugin-settings-url" {
  export const i: () => void;
  export const n: (input: {
    appId: string;
    installUrl?: string | null;
    remotePluginId?: string | null;
  }) => string;
  export const r: (pluginId: string, version?: number) => string;
  export const t: () => void;
}
declare module "@rchunk/cloud-environment-queries";

declare module "@rchunk/create-pull-request-modal-content" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}
declare module "@rchunk/automation-dialog" {
  export const a: () => void;
  export const i: (props: Record<string, unknown>) => unknown;
  export const n: (props: Record<string, unknown>) => unknown;
  export const r: (props: Record<string, unknown>) => unknown;
  export const t: (props: Record<string, unknown>) => unknown;
}
declare module "@rchunk/plan-downgrade-dialog-core" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}
declare module "@rchunk/create-project-dialog-core" {
  export const n: (props: Record<string, unknown>) => unknown;
  export const r: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}
declare module "@rchunk/gpt-about-dialog-core" {
  export const a: (...arguments_: unknown[]) => string;
  export const c: () => void;
  export const i: (resource: Record<string, unknown>) => string;
  export const n: () => void;
  export const o: (resource: Record<string, unknown>) => string | null;
  export const r: (...arguments_: unknown[]) => unknown;
  export const s: (...arguments_: unknown[]) => boolean;
  export const t: (props: Record<string, unknown>) => unknown;
}
declare module "@rchunk/create-dialog" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/pepper-persona";
declare module "@rchunk/computer-use-app-approvals-query";
declare module "@rchunk/use-home-directory" {
  export interface HomeDirectoryQueryResult {
    data?: { homeDirectory?: string };
    error?: unknown;
    isLoading?: boolean;
  }
  export const n: (hostId?: string | null) => string | undefined;
  export const r: (hostId?: string | null) => HomeDirectoryQueryResult;
  export const t: () => void;
}
declare module "@rchunk/voice-personalization-dialog-entry" {
  export const loadVoicePersonalizationDialog: (
    ...arguments_: unknown[]
  ) => Promise<unknown>;
}
declare module "@rchunk/connector-post-connect-dialog" {
  export const ConnectorPostConnectDialog: (props: {
    connectorName?: string;
    onClose?(): void;
    onContinue?(): void;
    open?: boolean;
  }) => unknown;
}

declare module "@rchunk/thread-handoff-modal" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}
declare module "@rchunk/codex-mobile-setup-dialog" {
  export const a: () => void;
  export const c: { key: string; defaultValue: string };
  export const i: (props: Record<string, unknown>) => unknown;
  export const l: () => void;
  export const n: () => void;
  export const o: (step: string) => string;
  export const r: (step: string) => string;
  export const s: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/app-connect-modal" {
  export const a: (input: Record<string, unknown[]>) => string[];
  export const c: (input: { connectorId: string; disableExposureLog?: boolean; statsigClient?: unknown }) => boolean;
  export const d: (input: Record<string, unknown[]>) => string[];
  export const f: (input: { connectorId: string }) => string[];
  export const h: () => void;
  export const i: (value: unknown) => string;
  export const l: (app: { description?: string; id: string; name: string }) => string;
  export const m: (connectorId: string, connectorIds: string[]) => string | null;
  export const n: () => void;
  export const o: (connectorId: string) => string[];
  export const p: (connectorId: string, links: string[]) => string[];
  export const r: () => void;
  export const s: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
  export const u: () => void;
}

declare module "@rchunk/app-main" {}

declare module "@rchunk/use-git-submodule-paths" {
  export const _any: any;
}

declare module "@rchunk/git-branch-switcher" {
  export interface HostConfig { id: string; [key: string]: unknown }
  export interface RepositoryTarget { cwd: string; hostConfig: HostConfig; hostId?: string; repo?: string | null; root?: string | null }
  export interface BranchSwitcherProps {
    align?: "start" | "center" | "end"; cwd: string; gitRoot?: string | null; hostConfig: HostConfig;
    isLoading?: boolean; isReadOnly?: boolean; open?: boolean; shouldShow?: boolean;
    side?: "top" | "right" | "bottom" | "left"; onOpenChange?(open: boolean): void; onSelectBranch?(branch: string): void;
    [key: string]: unknown;
  }
  export const a: (props: { showSetPrefix?: boolean }) => unknown;
  export const c: (root: string | null | undefined, hostConfig: HostConfig, operationSource: string, options?: Record<string, unknown>) => Record<string, unknown>;
  export const d: () => void;
  export const f: (target: RepositoryTarget | null, operationSource: string) => { mutationKey: unknown[]; mutationFn(input: { branch: string }): Promise<Record<string, unknown>> };
  export const g: () => void;
  export const h: (target: RepositoryTarget | null | undefined) => string;
  export const i: () => void;
  export const l: () => void;
  export const m: () => void;
  export const n: () => void;
  export const o: (props: { showSetPrefix?: boolean }) => unknown;
  export const p: (props: Record<string, unknown>) => unknown;
  export const r: (target: RepositoryTarget | null, operationSource: string) => { mutationKey: unknown[]; mutationFn(input: { branch: string; mode?: string }): Promise<Record<string, unknown>> };
  export const s: (input: { cwd?: string | null; enabled: boolean; hostConfig: HostConfig; operationSource: string; preserveRemoteRefs?: boolean; query: string }) => string;
  export const t: (props: BranchSwitcherProps) => unknown;
  export const u: (root: string | null | undefined, hostConfig: HostConfig, operationSource: string, options?: Record<string, unknown>) => Record<string, unknown>;
}

declare module "@rchunk/dock" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/create-dialog" {
  export const _any: any;
}

declare module "@rchunk/use-create-git-repository" {
  export const _any: any;
}

declare module "@rchunk/worktree-environment-dropdown" {
  export interface StartingState { branchName?: string; remoteRef?: string; type: "branch" | "working-tree" }
  export interface Environment { configPath: string | null; name: string }
  export const a: (props: { categoryLabel?: unknown; className?: string; icon?: unknown; value: unknown; valueClassName?: string }) => unknown;
  export const c: () => void;
  export const i: () => void;
  export const n: () => void;
  export const o: () => void;
  export const r: (props: Record<string, unknown>) => unknown;
  export const s: (props: { branchSource?: "worktree" | "repository"; className?: string; gitRootOverride?: string | null; hostConfig: { id: string; [key: string]: unknown }; side?: "top" | "right" | "bottom" | "left"; startingState: StartingState; setStartingState(value: StartingState): void }) => unknown;
  export const t: (props: { align?: "start" | "center" | "end"; className?: string; environments: Environment[]; hasError?: boolean; isLoading?: boolean; labelClassName?: string; repairConfigPath?: string | null; selectedConfigPath?: string | null; showDefaultOption?: boolean; showIcon?: boolean; side?: "top" | "right" | "bottom" | "left"; workspaceRoot: string; onOpenSettings?(): void; onSelectConfigPath?(configPath: string | null): void }) => unknown;
}

declare module "@rchunk/color-icon" {
  export const n: () => void;
  export const t: (props: { className?: string; name: string; title?: string }) => unknown;
}

declare module "@rchunk/connector-logo-stack" {
  export const n: () => void;
  export const t: (props: {
    ariaLabel?: string;
    children?: unknown;
    size?: "medium" | "small";
    surface?: "default" | "white";
  }) => unknown;
}

declare module "@rchunk/onboarding-mail-provider" {
  export type MailProvider = "google" | "microsoft" | "other";
  export const a: (provider: MailProvider, plan: unknown) => MailProvider;
  export const i: (pluginId: string, provider: MailProvider) => string;
  export const n: (email: string | null | undefined) => string | null;
  export const o: () => void;
  export const r: (input: {
    debugOverride?: MailProvider | null;
    detectedProvider?: MailProvider | null;
    emailDomain?: string | null;
    isError?: boolean;
  }) => MailProvider | null;
  export const t: unknown;
}

declare module "@rchunk/onboarding-entrypoint" {
  export type OnboardingLoginEntrypoint = string | undefined;
  export const n: import("@rchunk/app-shared").ScopedSignal<
    Record<string, unknown>,
    OnboardingLoginEntrypoint
  >;
  export const t: () => void;
}

declare module "@rchunk/pending-onboarding" {
  export interface PendingOnboarding {
    accountId: string | null;
    userId: string | null;
    [key: string]: unknown;
  }
  export const n: import("@rchunk/app-shared").ScopedDerivedFamily<
    Record<string, unknown>,
    string | null,
    PendingOnboarding | null
  >;
  export const r: import("@rchunk/app-shared").ScopedSignal<
    Record<string, unknown>,
    Map<string, PendingOnboarding>
  >;
  export const t: () => void;
}

declare module "@rchunk/external-agent-config-import-flow" {
  export const openExternalAgentImport: (
    ...arguments_: unknown[]
  ) => Promise<unknown>;
}

declare module "@rchunk/use-imported-setup-opportunity" {
  export const ft: (
    item: { label?: string },
    intl: import("@rchunk/app-shared").IntlShape,
  ) => string | undefined;
  export const pt: <Item extends { id: string }>(input: {
    items: Item[];
    locale: string;
    mailProvider: unknown;
    plan: unknown;
    representativeRole: string | null;
    taskDefinitions: Record<
      string,
      import("@rchunk/sidebar-onboarding-checklist-task-config").OnboardingTaskDefinition
    >;
  }) => Item[];
  export const _any: any;
}

declare module "@rchunk/sidebar-onboarding-checklist" {
  export const SidebarOnboardingChecklist: (props: {
    accountId?: string | null;
    className?: string;
    isVisible?: boolean;
  } & Record<string, unknown>) => unknown;
}

declare module "@rchunk/sidebar-onboarding-checklist-task-config" {
  export interface OnboardingTaskDefinition extends Record<string, unknown> {
    instructions?: string;
    is_auto_submit_enabled?: boolean;
    messages: {
      label: import("@rchunk/app-shared").MessageDescriptor;
      prompt: import("@rchunk/app-shared").MessageDescriptor;
    };
    origin: "checked_in" | "remote";
    pluginSlots?: Record<string, string>;
  }
  /** initializeRemoteTaskConfig。 */
  export const a: () => void;
  /** useRemoteTaskDefinitions。 */
  export const c: (options?: {
    disableExposureLog?: boolean;
  }) => Record<string, OnboardingTaskDefinition>;
  /** initializeCandidateTaskConstants。 */
  export const m: () => void;
  /** initializePermissionPromptState。 */
  export const v: () => void;
}

declare module "@rchunk/dialog-launcher-core" {
  export const n: (
    scope: import("@rchunk/app-initial").DialogScope,
    service:
      | import("@rchunk/browser-profile-import-dialog").BrowserProfileImportService
      | null
      | undefined,
    entryPoint: import("@rchunk/browser-profile-import-analytics").BrowserProfileImportEntryPoint,
    flowId?: string,
  ) => boolean;
  export const t: () => void;
}

declare module "@rchunk/realtime-voice-launch-surface" {
  export const n: () => void;
  export const t: (props: {
    error?: string | null;
    microphonePermissionDenied?: boolean;
    onBack?(): void;
    onOpenSettings?(): void;
    phase?: "connecting" | "connected" | "failed";
    threadLocator?: { conversationId: string; hostId: string } | null;
  }) => unknown;
}

declare module "@rchunk/realtime-voice-motion" {
  export const i: () => void;
  export const n: { duration: number; ease: readonly number[] };
  export const r: { duration: number };
  export const t: { duration: number; ease: readonly number[] };
}
declare module "@rchunk/use-realtime-voice-native-overlay-transition-enabled" {
  export const n: () => boolean;
  export const t: () => void;
}
declare module "@rchunk/realtime-voice-handoff-target" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}
declare module "@rchunk/realtime-voice-stage-layout" {
  export const a: () => void;
  export const i: string;
  export const n: string;
  export const o: (props: Record<string, unknown>) => unknown;
  export const r: string;
  export const s: () => void;
  export const t: string;
}
declare module "@rchunk/quick-chat-obstacles" {
  export const a: (callback: () => void) => () => void;
  export const c: (...arguments_: unknown[]) => string | null;
  export const d: (...arguments_: unknown[]) => string | null;
  export const f: () => void;
  export const i: (element: HTMLElement | null) => (() => void) | undefined;
  export const l: (...arguments_: unknown[]) => number;
  export const n: () => string;
  export const o: () => unknown;
  export const r: () => void;
  export const s: () => void;
  export const t: () => DOMRect[];
  export const u: (...arguments_: unknown[]) => { x: number; y: number };
}
declare module "@rchunk/quick-chat-frame" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}
declare module "@rchunk/quick-chat-drop-zones" {
  export const n: (props?: Record<string, unknown>) => unknown;
  export const r: () => void;
  export const t: (destination: "bottom" | "left" | "right", size: number) => Record<string, number>;
}
declare module "@rchunk/remote-hosted-pip-anchor-bridge" {
  export const i: () => void;
  export const n: (scale?: number) => {
    computeLayout(input: Record<string, unknown>): Record<string, unknown>;
    setCodexHomeAvailable(available: boolean): void;
    stop(): void;
  };
  export const r: string;
  export const t: () => void;
}

declare module "@rchunk/codex-app-home-beacon-announcement-core" {
  export interface BeaconAnnouncementProps extends Record<string, unknown> {
    accountId: string;
    actionAccountId: string;
    analyticsContext: {
      placement: string;
      productExperience: "chat" | "work";
      treatment?: unknown;
    };
    beacon: unknown;
  }
  export const n: (props: BeaconAnnouncementProps) => unknown;
  export const r: () => void;
  export const t: (props: BeaconAnnouncementProps) => unknown;
}

declare module "@rchunk/pca-connector-eligibility" {
  export interface PcaActionSupport {
    diagnostic?: { actionEnum: string; actionId: string; reason: string };
    status: "pending" | "supported" | "unavailable" | "unsupported";
  }
  export interface PcaActionSupportInput extends Record<string, unknown> {
    actionItems: readonly Array<{ action_v2: { action_enum?: string; connector_id?: string; items?: unknown[]; [key: string]: unknown }; description?: string | null; id: string; label?: string | null; type?: string }>;
    context: Record<string, unknown> & { getHandlerStatus?(action: unknown): "missing" | "pending" | "supported" | "unavailable"; supportedActionEnums?: readonly string[] };
    referencedActionIds?: string[];
    variant: "banner" | "carousel" | "inline" | "modal" | "takeover";
  }
  export const a: () => void;
  export const c: (props: Record<string, unknown>) => unknown;
  export const d: () => void;
  export const i: (input: PcaActionSupportInput) => PcaActionSupport;
  export const l: () => void;
  export const n: () => void;
  export const o: (props: {
    connectorId?: string;
    onOpenChange(open: boolean): void;
    pcaResumeTarget?: unknown;
  }) => unknown;
  export const r: { getOptions(connectorIds: readonly string[], context: { fetchConnector(id: string): Promise<{ authType?: string; status?: string }> }): { enabled: boolean; queryKey: readonly unknown[]; queryFn(): Promise<Set<string>>; retry: false; staleTime: number } };
  export const s: () => void;
  export const t: (actions: PcaActionSupportInput["actionItems"]) => string[];
  export const u: (options: { isAccountPending?: boolean; isWorkspaceMemoryLoading?: boolean; onMemoryUpdateError?(): void; onMemoryUpdateSuccess?(message: string): void; trustedAccountId?: string | null; userId?: string | null }) => (action: PcaActionSupportInput["actionItems"][number]) => "pending" | "supported" | "unavailable" | undefined;
}

declare module "@rchunk/country-codes" {
  export const n: () => void;
  export const t: Set<string>;
}

declare module "@rchunk/google-logo" {
  export const n: () => void;
  export const t: (props?: Record<string, unknown>) => unknown;
}

declare module "@rchunk/access-splash" {
  export interface AccessSplashProps {
    accessMessage: unknown;
    description: unknown;
    learnMoreLabel: unknown;
    learnMoreUrl: string;
    title: unknown;
  }
  export const n: () => void;
  export const t: (props: AccessSplashProps) => unknown;
}

declare module "@rchunk/lock" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/codex-local-access-splash" {
  export const CodexLocalAccessSplash: () => unknown;
}

declare module "@rchunk/work-mode-access-splash" {
  export const WorkModeAccessSplash: (props: {
    modeToggle?: unknown;
  }) => unknown;
}

declare module "@rchunk/pepper-onboarding-modal" {
  export const PepperOnboardingModal: (
    props: import("@rchunk/beacon-modal").PepperOnboardingBeaconModalProps,
  ) => unknown;
  export const _any: any;
}

declare module "@rchunk/beacon-modal" {
  export interface PepperOnboardingBeaconModalProps
    extends Record<string, unknown> {
    accountId: string;
    onClose(): void;
  }
  export const PepperOnboardingBeaconModal: (
    props: PepperOnboardingBeaconModalProps,
  ) => unknown;
}

declare module "@rchunk/chatgpt-work-home-page-core" {
  export const n: () => void;
  export const t: (props: {
    additionalDeveloperInstructions?: string;
    initialPrompt?: string;
    onSubmit?(input: {
      developerInstructions?: string;
      prompt: string;
    }): Promise<unknown> | unknown;
    onTaskSuggestionSelected?(suggestion: string): void;
    renderHomeContent?(context: { setPrompt(value: string): void }): unknown;
    suggestions?: string[];
  }) => unknown;
}

declare module "@rchunk/checkout-policy" {
  export const A: (input: string | URLSearchParams, output: URLSearchParams) => URLSearchParams;
  export const C: (kind: string, checkout: Record<string, unknown>, override?: boolean) => boolean;
  export const D: (input: { isStandaloneCredit: boolean; intentType?: string; paymentMethodType?: string | null }) => boolean;
  export const E: (checkout: Record<string, unknown>, context: Record<string, unknown>) => string | undefined;
  export const O: (input: string | URLSearchParams) => string | null;
  export const S: () => void;
  export const T: (checkout: Record<string, unknown>, context?: { fromiOSWebview?: boolean }) => boolean;
  export const _: (input: Record<string, unknown>) => Record<string, unknown>;
  export const a: (sessionId: string, selection: Record<string, unknown>, amounts?: Record<string, unknown> | null) => Record<string, unknown>;
  export const b: (input: { audience: string; checkoutFrom?: string | null; setupFailed?: boolean; source?: string | null }) => "desktop_handoff" | "workspace_billing" | "personal_usage";
  export const c: (input: Record<string, unknown>) => { monthlyAmount: number; yearlyAmount: number } | null;
  export const d: (plan?: string) => string;
  export const f: (checkout: Record<string, unknown>) => string;
  export const g: (checkout: Record<string, unknown>, query: string | URLSearchParams) => Record<string, unknown>;
  export const h: (total: Record<string, unknown>) => number | null;
  export const i: (id: string, intentType?: string) => boolean;
  export const j: (url: string, input: string | URLSearchParams) => string;
  export const k: () => void;
  export const l: (checkout: Record<string, unknown>, query: string | URLSearchParams, allowedPath?: string) => string | null;
  export const m: (currency: string) => number | undefined;
  export const n: { Standard: "standard"; CodexTeam: "codex_team"; StandaloneCredit: "standalone_credit"; RateLimitReset: "codex_rate_limit_reset" };
  export const o: (...arguments_: unknown[]) => Record<string, unknown> | null;
  export const p: (status?: string | null) => string;
  export const r: string;
  export const s: (input: Record<string, unknown>) => boolean;
  export const t: string;
  export const u: (error: unknown) => string | undefined;
  export const v: (source: string) => "workspace" | "personal" | "unknown";
  export const w: (input: Record<string, unknown>) => boolean;
  export const x: (checkout: Record<string, unknown>) => boolean;
  export const y: (checkout: Record<string, unknown>) => { invoiceTotalMinorUnits: number; amountDueMinorUnits: number; currency: string };
}
declare module "@rchunk/checkout-dialog-fields" {
  export const a: (props: Record<string, unknown>) => unknown;
  export const c: (input: Record<string, unknown>) => string | null;
  export const i: (props: Record<string, unknown>) => unknown;
  export const l: () => void;
  export const n: (props: Record<string, unknown>) => unknown;
  export const o: () => void;
  export const r: (props: Record<string, unknown>) => unknown;
  export const s: (input: Record<string, unknown>) => string | null;
  export const t: (props: { discountPercent: number }) => unknown;
}
declare module "@rchunk/checkout-error" {
  export const a: (props: { kind: "billing" | "payment"; loading?: boolean; error?: Error | null; onRetry(): void }) => unknown;
  export const i: () => void;
  export const n: (code: string) => string | undefined;
  export const o: () => void;
  export const r: (error: unknown) => string;
  export class t extends Error { status?: number; errorCode?: string; constructor(message: string, options?: { status?: number; errorCode?: string }); }
}
declare module "@rchunk/account-action-integrity";
declare module "@rchunk/checkout-session";
declare module "@rchunk/checkout-confirm-latency" {
  export const a: (email: string | null | undefined, fallback?: string) => { checkoutEmail: string; hasCheckoutEmail: boolean; defaultEmail: string };
  export const c: () => void;
  export const d: (path: string) => void;
  export const f: (previousId: string, checkoutSessionId: string) => void;
  export const i: RegExp;
  export const l: (checkoutSessionId: string, quantity: number | null) => void;
  export const m: () => void;
  export const n: (input: Record<string, unknown>) => { durationMs: number; checkoutSessionId?: string } | undefined;
  export const o: () => void;
  export const p: (props: Record<string, unknown>) => unknown;
  export const r: () => void;
  export const s: (checkoutSessionId: string, params: URLSearchParams, audience: string, setupFailed: boolean) => string;
  export const t: (checkout: Record<string, unknown>, confirm: () => Promise<{ type: string }>) => Promise<{ type: string }>;
  export const u: (checkoutSessionId: string, params: URLSearchParams) => void;
}

declare module "@rchunk/checkout-page-core" {
  export const n: (props: { returnPath?: string; url: string; onOpenExternal?(url: string): void }) => unknown;
  export const r: () => void;
  export const t: (props: { accountId?: string | null; checkoutSessionId?: string | null; error?: string | null; loading?: boolean; processorEntity?: string | null; returnPath?: string; search?: string; userId?: string | null; hostedCheckoutUrl?: string | null; onOpenExternal?(url: string): void; onRetry?(): void }) => unknown;
}

declare module "@rchunk/billing-icons";
declare module "@rchunk/prop-types-runtime" { export interface Validator { (...arguments_: unknown[]): void; isRequired: Validator } export interface PropTypesRuntime { PropTypes: PropTypesRuntime; any: Validator; array: Validator; arrayOf(): Validator; bool: Validator; checkPropTypes(): void; number: Validator; object: Validator; oneOf(): Validator; resetWarningCache(): void; string: Validator; [key: string]: unknown } export const t: () => PropTypesRuntime }
declare module "@rchunk/stripe-payment-element-options" { export interface PaymentElementOptions { billingDetails?: Record<string, unknown>; defaultValues?: Record<string, unknown>; fields?: Record<string, unknown>; wallets?: Record<string, unknown>; [key: string]: unknown } export interface PaymentElementOverrides { checkoutSessionId?: string; isGooglePayEnabled?: boolean; isNewStripeCustomer?: boolean; minimalBillingAddress?: Record<string, unknown>; paymentElementLayoutMode?: "accordion" | "auto" | "tabs"; paymentMethodOrder?: string[]; shouldHidePaymentElementName?: boolean; useMinimalBillingAddress?: boolean } export const n: () => void; export const r: (id: unknown) => id is string; export const t: (options?: PaymentElementOptions, overrides?: PaymentElementOverrides) => Record<string, unknown> }
declare module "@rchunk/tax-types";

declare module "@rchunk/credit-purchase-page-core" {
  export const n: () => void;
  export const t: (props?: {
    accountId?: string;
    audience?: "personal" | "workspace";
    currencyCode?: string;
    defaultQuantity?: number;
    maximum?: number;
    minimum?: number;
    onComplete?(result: unknown): void;
    userId?: string;
  }) => unknown;
}

declare module "@rchunk/plugin-request-empty-state" {
  export interface PluginSummary { id: string; installed?: boolean; name: string; description?: string; marketplaceName?: string; [key: string]: unknown }
  export interface PluginRecord { plugin: PluginSummary; logoDarkPath?: string; logoPath?: string; [key: string]: unknown }
  export interface PluginDirectoryConfig { categoryIds: string[]; collapsedCategoryIds: string[]; sections: Array<{ id: string; pluginIds: string[] }> }
  export const A: (input: { creatorPath: string; includeStarterPrompt: boolean; kind: "plugin" | "skill" }) => string;
  export const C: { key: string; defaultValue: string }; export const D: (props: { children?: unknown; hostId: string; mode?: string; source?: string }) => unknown;
  export const E: { key: string; defaultValue: string | null }; export const M: () => void; export const O: () => void; export const S: () => void;
  export const T: { key: string; defaultValue: string }; export const _: () => void; export const a: (props: { errorMessage?: string | null; isPageLoading?: boolean }) => unknown;
  export const b: () => void; export const c: (props: { plugins: PluginRecord[] } & Record<string, unknown>) => unknown; export const d: () => void;
  export const f: (props: { plugins?: PluginRecord[]; onOpenPluginDetails?(plugin: PluginRecord): void }) => unknown; export const g: (props: Record<string, unknown>) => unknown;
  export const h: () => void; export const i: () => void; export const j: { key: string; defaultValue: boolean }; export const k: string; export const l: () => void;
  export const m: (props: { plugins: PluginRecord[] } & Record<string, unknown>) => unknown; export const n: () => void; export const o: () => void; export const p: () => void;
  export const r: (props: { initialSuggestion?: string; onClose?(): void; onSubmit?(suggestion: string): void }) => unknown;
  export const s: (props: { id?: string; plugins: PluginRecord[] } & Record<string, unknown>) => unknown; export const t: (props: { onRequestPlugin?(): void }) => unknown;
  export const u: (props: { banner?: { browserFamily: string; displayName: string; installUrl: string } | null; onDismiss?(): void; onInstall?(): void }) => unknown;
  export const v: (props: { phase?: "installing" | "loading"; progressPercent?: number }) => unknown; export const w: { key: string; defaultValue: boolean };
  export const x: (value: unknown) => PluginDirectoryConfig; export const y: () => void;
}
declare module "@rchunk/plugins-store-page" {
  export interface StorePlugin { categoryIds?: string[]; description?: string; directory?: "openai" | "personal" | "workspace"; id: string; installed?: boolean; name: string; [key: string]: unknown }
  export const i: () => void; export const n: () => void;
  export const r: (props?: { children?: unknown; initialTab?: "plugins" | "skills"; onBrowseTabSelect?(tab: "plugins" | "skills"): void }) => unknown;
  export const t: (props?: { category?: string | null; directory?: "openai" | "personal" | "workspace"; hostId?: string; onInstall?(plugin: StorePlugin): void; onOpenPlugin?(plugin: StorePlugin): void; plugins?: StorePlugin[]; query?: string; selectedPlugin?: StorePlugin | null }) => unknown;
}
declare module "@rchunk/plugins-page-section" {
  export interface Skill { id: string; name: string; description?: string; shortDescription?: string; path?: string; scope?: string; [key: string]: unknown }
  export interface InstalledSkill { skill: Skill; [key: string]: unknown }
  export interface Plugin { isBuiltIn?: boolean; marketplaceDisplayName?: string; marketplaceName?: string; marketplacePath?: string; name: string; origin?: string | null; path?: string; scope?: string; [key: string]: unknown }
  export interface App { description?: string | null; displayName?: string; id?: string; isAccessible?: boolean; name: string; shortDescription?: string | null; type?: string; [key: string]: unknown }
  export const A: () => void; export const C: (input: { installedSkills: InstalledSkill[]; recommendedSkills: Skill[] }) => InstalledSkill[];
  export const D: (skills: InstalledSkill[]) => InstalledSkill[]; export const E: (input: { installedRecommendedSkillIds: Set<string>; installedSkillMatchKeys: Set<string>; skills: Skill[] }) => Skill[];
  export const F: (props: Record<string, unknown> & { id: string }) => unknown; export const I: () => void; export const M: undefined;
  export const N: () => void; export const O: () => void; export const P: (props: Record<string, unknown> & { sections: Array<{ id: string; title: unknown }> }) => unknown;
  export const S: (input: { skills: Skill[]; query: string }) => Skill[]; export const T: (input: { recommendedSkills?: Skill[] | null; skills: InstalledSkill[] }) => InstalledSkill[];
  export const _: (input: { pluginResultKeys: string[]; skillResultKeys: string[]; tab: string }) => string[] | undefined;
  export const a: () => void; export const b: (input: { skills: InstalledSkill[]; query: string }) => InstalledSkill[]; export const c: (config: unknown) => Set<string>;
  export const d: () => void; export const f: (plugin: Plugin, names: Set<string>) => boolean; export const g: (input: { currentTab: string; isCurrentTabLoading: boolean; isManagePage: boolean; isPluginsEnabled: boolean; tabCounts: Record<string, number> }) => string;
  export const h: (apps: App[]) => { installedApps: App[]; discoverApps: App[] }; export const i: (props: { hostId: string; plugin: Plugin; size?: string }) => unknown;
  export const j: () => void; export const k: () => void; export const l: (input: { installedSkills: InstalledSkill[]; skill: Skill }) => Skill | null;
  export const m: (input: { installedSkillMatchKeys: Set<string>; skill: Skill }) => boolean; export const n: (props: Record<string, unknown>) => unknown;
  export const o: (skills: InstalledSkill[]) => Set<string>; export const p: (plugin: Plugin, names: Set<string>) => boolean; export const r: () => void;
  export const s: (config: unknown) => Set<string>; export const t: (props: Record<string, unknown>) => unknown; export const u: (plugin: Plugin) => string;
  export const v: (input: { query: string; suggestions?: App[] | null }) => App[]; export const w: (apps: App[]) => App[];
  export const x: (input: { configuredMarketplaceNames: Set<string>; marketplaces: Plugin[]; query: string }) => Plugin[]; export const y: (input: { apps: App[]; query: string }) => App[];
}
declare module "@rchunk/plugin-detail-view" {
  export interface DetailPlugin { summary: { description?: string; id?: string; installed?: boolean; name: string; remotePluginId?: string; [key: string]: unknown }; [key: string]: unknown }
  export const a: (input: { size?: "large" | "small"; hasLargeIcon?: boolean; smallClassName?: string; largeFallbackClassName?: string }) => string;
  export const c: () => void; export const i: () => void; export const n: () => void; export const o: () => void;
  export const r: (props: { actionLabel?: unknown; displayName?: string; onSkillsUpdated?(success: boolean): void; skill: { description?: string; installed?: boolean; name: string; path?: string; [key: string]: unknown } }) => unknown;
  export const s: (props: { cardActions?: unknown; cardDescription?: unknown; cardIcon?: unknown; cardTitle: unknown; modalBody?: unknown; modalDescription?: unknown; modalFooter?: unknown; modalHeaderActions?: unknown; modalTitle?: unknown; onOpenPreview?(): void }) => unknown;
  export const t: (input: { state: "loading" } | { errorMessage?: string; state: "error" } | { description?: string; state: "missing" } | ({ plugin: DetailPlugin; presentation?: "dialog" | "page"; state: "ready" } & Record<string, unknown>)) => unknown;
}
declare module "@rchunk/hosted-plugin-creation-actions" {
  export interface HostedCreateAction { canCreateMcpApp?: boolean; canUploadArchive?: boolean; onCreate?(mode: "archive" | "mcp"): void }
  export interface CreationMenuProps { canCreatePlugin?: boolean; canCreateSkill?: boolean; currentBrowseTab?: "plugins" | "skills"; hostedCreateAction?: HostedCreateAction; isCreatingPlugin?: boolean; isPluginCreatorDisabledByAdmin?: boolean; mode?: "browse" | "manage"; onAddMarketplace?(): void; onAddMcpServer?(): void; onCreatePlugin?(): void; onCreateSkill?(): void }
  export const a: (props: CreationMenuProps) => unknown; export const i: () => void; export const n: () => void;
  export const o: (props: CreationMenuProps & { breadcrumb?: unknown; hostSelector?: unknown; onExitManageMode?(): void }) => unknown;
  export const r: (props: { canCreatePlugin?: boolean; children(input: { canCreatePlugin: boolean; isCreatingPlugin: boolean; isPluginCreatorDisabledByAdmin: boolean; onCreatePlugin?(): void }): unknown; onCreatePlugin?(): void }) => unknown;
  export const s: () => void; export const t: (props: { children(input: { canCreatePlugin: boolean; canCreateSkill: boolean; isPluginCreatorDisabledByAdmin: boolean; onCreatePlugin?(): void; onCreateSkill?(): void }): unknown; enabled?: boolean; onCreatePlugin?(): void; onCreateSkill?(): void }) => unknown;
}
declare module "@rchunk/plugin-setup" {
  export interface SetupApp { id: string; isAccessible?: boolean; [key: string]: unknown }
  export interface SetupPlugin { canonicalAppId?: string | null; marketplaceName?: string; plugin: { id: string; installed?: boolean; name?: string; [key: string]: unknown }; [key: string]: unknown }
  export interface SetupResult { appsRequiringConnection: SetupApp[]; importedPlugins: Array<{ app: SetupApp; plugin: SetupPlugin }> }
  export const a: (app: SetupApp, plugin: SetupPlugin) => boolean; export const i: () => void; export const n: { key: string }; export const r: () => void;
  export const t: (input: { inputsResult: Record<string, unknown>; pluginDirectory: { errorMessage?: string | null; isLoading: boolean; plugins: SetupPlugin[]; refetch(): void } }) => unknown;
}
declare module "@rchunk/profile-lock" { export const n: () => void; export const t: (props?: { className?: string; title?: string }) => unknown; }
declare module "@rchunk/browser-extension-setup-messages" {
  export interface BrowserExtensionMessage { defaultMessage: string; description: string; id: string }
  export const n: (browserFamily: string) => BrowserExtensionMessage; export const r: () => void; export const t: (browserFamily: string) => BrowserExtensionMessage;
}
declare module "@rchunk/category-plugins-query" {
  export interface CategoryPlugin { id: string; remotePluginId?: string; [key: string]: unknown }
  export const n: () => void; export const t: (input: { categorySlug: string; hostId: string; searchQuery?: string; visibility?: { hiddenPluginIds?: Set<string> } }) => Record<string, unknown>;
}
declare module "@rchunk/hosted-plugin-create-dialog" {
  export const HostedPluginCreateDialog: (props: { canCreateMcpApp: boolean; canUploadArchive: boolean; initialMode?: "archive" | "mcp"; isPending?: boolean; onAppCreated?(app: Record<string, unknown>): void; onArchiveCreated?(plugin: Record<string, unknown>): void; onClose(): void }) => unknown;
}
declare module "@rchunk/mcp-oauth-runtime" {
  export interface DropzoneOptions {
    accept?: Record<string, string[]>;
    disabled?: boolean;
    multiple?: boolean;
    noClick?: boolean;
    noKeyboard?: boolean;
    onDrop?(acceptedFiles: File[], rejectedFiles: unknown[]): void;
    onError?(error: unknown): void;
  }
  export interface DropzoneResult {
    getInputProps(props?: Record<string, unknown>): Record<string, unknown>;
    getRootProps(props?: Record<string, unknown>): Record<string, unknown>;
    inputRef: { current: { disabled?: boolean; isConnected?: boolean } | null };
    open(): void;
  }
  export const n: (options: DropzoneOptions) => DropzoneResult;
  export const t: () => void;
}
declare module "@rchunk/plugins-page" { export const i: () => void; export const n: () => void; export const r: (props: Record<string, unknown>) => unknown; export const t: (props: Record<string, unknown>) => unknown; }

declare module "@rchunk/skills-page-core" {
  interface Skill {
    description?: string;
    id: string;
    installed?: boolean;
    name: string;
    [key: string]: unknown;
  }
  interface SkillsPageProps {
    initialQuery?: string;
    initialTab?: "plugins" | "skills";
    onInstall?(skill: Skill): Promise<unknown>;
    onOpen?(skill: Skill): void;
    skills?: Skill[];
  }
  export const n: () => unknown;
  export const r: () => void;
  export const t: (props?: SkillsPageProps) => unknown;
}

declare module "@rchunk/browser-login-handoff-page-core" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/local-conversation-page" {
  export const n: (props: Record<string, unknown>) => unknown;
  export const r: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/chatgpt-conversation-page-core" {
  export interface ChatGptProject { id: string; name: string; icon?: unknown; shared?: boolean }
  export interface ConversationTurn { id: string; role: "assistant" | "system" | "user"; text?: string; pending?: boolean; [key: string]: unknown }
  export interface ConversationHeaderProps { breadcrumbHeader?: unknown; isCloudTask?: boolean; isTemporaryChat?: boolean; project?: ChatGptProject | null; startActions?: unknown; title?: string | null; workTitle?: string | null }
  export interface HeaderToolbarProps { allowsThreadContentOverlap?: boolean; project?: ChatGptProject | null; startActions?: unknown; workTitle?: string | null }
  export interface ConversationLayoutProps { children?: unknown; conversationId: string; header?: unknown; isArchivedPreview?: boolean; rightPanel?: unknown; title?: string | null }
  export interface ConversationContentProps { archivedPreviewFooter?: unknown; composer?: unknown; conversationId: string; emptyState?: unknown; error?: string | null; header?: unknown; isArchivedPreview?: boolean; isCloudTask?: boolean; isLoading?: boolean; isReadOnly?: boolean; isRestricted?: boolean; isStreaming?: boolean; isTemporaryChat?: boolean; onAddFiles?(files: readonly File[]): void; onRetry?(): void; project?: ChatGptProject | null; rightPanel?: unknown; sharedConversationId?: string | null; title?: string | null; turns?: readonly ConversationTurn[] }
  export interface ChatGptConversationPageProps extends Omit<ConversationContentProps, "conversationId"> { conversationId?: string | null; redirectTo?: string }
  export interface ChatGptSharedConversationPageProps extends Omit<ConversationContentProps, "conversationId" | "sharedConversationId"> { conversationId?: string | null; onReport?(conversationId: string): void; sharedConversationId?: string | null }
  export interface ShareConversationButtonProps { conversationId: string; isReady?: boolean; isRestricted?: boolean; isStreaming?: boolean; onShare?(conversationId: string): void }
  export const a: (props: ConversationLayoutProps) => unknown;
  export const c: () => void;
  export const d: (props?: { conversationId?: string; onReport?(conversationId: string): void }) => unknown;
  export const f: () => void;
  export const i: (props?: ChatGptConversationPageProps) => unknown;
  export const l: (props?: { authMethod?: string; chatGptAccessStatus?: string; children?: unknown; isWorkOnlyChatDisabled?: boolean }) => unknown;
  export const m: () => void;
  export const n: (props: ConversationHeaderProps) => unknown;
  export const o: (props: ShareConversationButtonProps) => unknown;
  export const p: (props: HeaderToolbarProps) => unknown;
  export const r: (props: { children?: unknown }) => unknown;
  export const s: (props?: ChatGptSharedConversationPageProps) => unknown;
  export const t: (props: ConversationContentProps) => unknown;
  export const u: () => void;
}

declare module "@rchunk/conversation-screen" {
  export interface SeatAccessState { accountId?: string; canSwitchToWork?: boolean; email?: string; isCapable?: boolean; isLoading?: boolean; status?: "allowed" | "restricted" | "unknown"; userId?: string }
  export interface SeatAccessScreenProps extends SeatAccessState { modeToggle?: unknown; onRequestAccess?(): void; onSwitchToWork?(): void }
  export interface SeatAccessGateProps extends SeatAccessState { children?: unknown; enabled?: boolean; modeToggle?: unknown; onRequestAccess?(): void; onSwitchToWork?(): void }
  export const n: (props?: SeatAccessScreenProps) => unknown;
  export const r: () => void;
  export const t: (props: SeatAccessGateProps) => unknown;
}
declare module "@rchunk/conversation-summary" {
  export type AutomationStatus = "active" | "completed" | "paused";
  export interface AutomationSummary { id: string; display_schedule?: string | null; is_enabled: boolean; last_run_time?: string | null; next_run_times: string[]; schedule_components: { end_date?: string | null; frequency: string; start_time?: string | null }; timing_mode?: string; updated_at: string }
  export interface AutomationSummaryItem { automation: AutomationSummary }
  export interface AutomationGroups { active: AutomationSummaryItem[]; recent: AutomationSummaryItem[]; paused: AutomationSummaryItem[]; completed: AutomationSummaryItem[] }
  export const a: (items: readonly AutomationSummaryItem[], now: number, pausedAt?: Record<string, number>) => AutomationGroups;
  export const i: (automation: AutomationSummary) => AutomationStatus;
  export const n: () => void;
  export const o: () => void;
  export const r: (...groups: Array<readonly AutomationSummary[] | null | undefined>) => AutomationSummaryItem[];
  export const t: (props: { item: AutomationSummaryItem; now?: Date; runPhase?: "executing" | "starting" | null; status?: AutomationStatus }) => unknown;
}
declare module "@rchunk/archived-conversation-preview-footer" {
  export interface ArchivedConversationPreviewFooterProps { conversationId: string; kind: "chatgpt" | "cloud" | "local"; onDone?(): void; onError?(error: unknown): void; onRecover?(input: { conversationId: string; kind: "chatgpt" | "cloud" | "local" }): Promise<void> | void; restored?: boolean; restoring?: boolean }
  export const n: () => void;
  export const t: (props: ArchivedConversationPreviewFooterProps) => unknown;
}
declare module "@rchunk/chatgpt-sources-message" {
  export interface MessageDescriptor { id: string; defaultMessage: string; description: string }
  export const a: () => void;
  export const i: MessageDescriptor;
  export const n: Readonly<Record<"plugin" | "skill", MessageDescriptor>>;
  export const r: Readonly<Record<"apps" | "files" | "links" | "memory" | "more" | "skills" | "web", MessageDescriptor>>;
  export const t: Readonly<Record<"generalMemory" | "userInstructions" | "userMemory", MessageDescriptor>>;
}
declare module "@rchunk/chatgpt-gizmo-header" {
  export interface ChatGptGizmo { id: string; name: string; canWrite?: boolean; isMigratedPlugin?: boolean; isPinned?: boolean }
  export interface ChatGptGizmoHeaderProps { conversationId?: string | null; gizmo?: ChatGptGizmo | null; gizmoId: string; onAbout?(gizmo: ChatGptGizmo): void; onEdit?(gizmo: ChatGptGizmo): void; onPinChange?(gizmo: ChatGptGizmo, pinned: boolean): Promise<void> | void; onReport?(gizmo: ChatGptGizmo): void }
  export const n: (props: ChatGptGizmoHeaderProps) => unknown;
  export const r: () => void;
  export const t: (props: ChatGptGizmoHeaderProps & { gizmo: ChatGptGizmo }) => unknown;
}
declare module "@rchunk/chatgpt-temporary-chat-ui" {
  export interface TemporaryChatToggleProps { conversationId?: string | null; isIndicator?: boolean; isTemporaryChat: boolean; onToggle?(temporary: boolean): void }
  export interface TemporaryChatOnboardingProps { children?(eligible: boolean): unknown; isEligible?: boolean; isLoading?: boolean; isTemporaryChat: boolean; onAcknowledge?(): Promise<void> | void }
  export const i: () => void;
  export const n: (props: TemporaryChatOnboardingProps) => unknown;
  export const r: (props: TemporaryChatToggleProps) => unknown;
  export const t: (props?: Pick<TemporaryChatToggleProps, "onToggle">) => unknown;
}
declare module "@rchunk/cloud-browser-preview" {
  export interface CloudBrowserScreenshot { browser_conversation_id?: string | null; hostname?: string | null; image_asset_pointer: { asset_pointer: string }; src?: string | null; tool_summary?: string | null }
  export const n: () => void;
  export const t: (props: { conversationId: string; liveView?: unknown; onOpen?(): void; onSelect?(index: number): void; screenshots: readonly CloudBrowserScreenshot[]; variant?: "compact" | "expanded" }) => unknown;
}
declare module "@rchunk/chatgpt-sources-side-panel-tab" {
  export type ChatGptSourceKind = "app" | "file" | "link" | "memory" | "skill" | "web";
  export interface ChatGptSource { attribution?: string | null; conversationContextType?: "general_memory" | "past_conversation" | "user_instructions" | "user_memory" | null; href?: string | null; key: string; kind: ChatGptSourceKind; label: string; memoryId?: string | null; snippet?: string | null; url?: string | null }
  export interface ChatGptSourcesSidePanelTabProps { conversationId?: string | null; inputCount?: number; isLoading?: boolean; onDeleteMemory?(source: ChatGptSource): Promise<void> | void; onOpenSource?(source: ChatGptSource): void; presentation?: "side-panel" | "summary"; shouldBlockExternalEgress?: boolean; sourceAccountId?: string | null; sources: readonly ChatGptSource[] }
  export const ChatGptSourcesSidePanelTab: (props: ChatGptSourcesSidePanelTabProps) => unknown;
  export const ChatGptSummarySourcesCount: (props: { inputCount?: number; sourceAccountId?: string | null; sources: readonly ChatGptSource[] }) => unknown;
}
declare module "@rchunk/open-audio-summary-dialog" {
  export interface AudioSummaryDialogRequest { conversationId: string; format?: "executive_briefing" | "podcast" | "study_guide"; instructions?: string }
  export const openAudioSummaryDialog: (host: { openDialog?(id: string, request: AudioSummaryDialogRequest): void }, conversationId: string) => void;
}
declare module "@rchunk/open-conversation-files" {
  export interface ConversationFilesRequest { accountId?: string | null; conversationId?: string | null; userId?: string | null; [key: string]: unknown }
  export const openConversationFiles: (host: { accountId?: string | null; userId?: string | null; openPanel?(panel: { id: string; kind: string; props: ConversationFilesRequest; target: "right"; title: string }): void }, request?: ConversationFilesRequest) => void;
}
declare module "@rchunk/chatgpt-about-you-summary-panel" { export const MemorySummaryDialog: typeof import("@rchunk/about-you-summary").n }
declare module "@rchunk/chatgpt-saved-memories-panel" { export const SavedMemoriesDialog: (props: Record<string, unknown>) => unknown }
declare module "@rchunk/chatgpt-personalization-route";
declare module "@rchunk/chatgpt-entity-side-panel-tab" {
  export interface EntityPanelParameters { memorySource?: string | null; sourceId?: string | null; [key: string]: unknown }
  export const ChatGptEntitySidePanelTab: (props: { conversationId: string; params: EntityPanelParameters; renderEntity?(input: { conversationId: string; flushTop: boolean; params: EntityPanelParameters }): unknown }) => unknown;
}

declare module "@rchunk/plugin-detail-page-core" {
  export const _: <T>(value: T) => T; export const a: () => void; export const b: (plugin: { id?: string; name: string }) => string;
  export const c: <T>(value: T) => T; export const d: (plugin: { id?: string; installed?: boolean }) => boolean; export const f: <T>(value: T) => T;
  export const g: (plugin: { id?: string; name: string }) => string; export const h: <T>(value: T) => T; export const i: () => void;
  export const l: (plugin: { id?: string; name: string }) => string; export const m: <T>(value: T) => T;
  export const n: (props: Record<string, unknown>) => unknown;
  export const o: (props: Record<string, unknown>) => unknown; export const p: <T>(value: T) => T;
  export const r: () => void;
  export const s: <T>(value: T) => T;
  export const t: (props: Record<string, unknown>) => unknown;
  export const u: <T>(value: T) => T; export const v: <T>(value: T) => T; export const x: <T>(value: T) => T; export const y: <T>(value: T) => T;
}

declare module "@rchunk/app-connect-link-navigation"; declare module "@rchunk/plugin-connector-setup";
declare module "@rchunk/use-plugin-scheduled-tasks";
declare module "@rchunk/apps-availability" { export interface AvailableApp { id: string; isEnabled: boolean; name?: string } export interface AppsAvailabilityOptions { apps?: AvailableApp[]; hostId?: string; invalidate?(queryKey: readonly unknown[]): Promise<unknown> | unknown; notify?(tone: "danger" | "success", message: string): void; readApps?(): AvailableApp[] | undefined; writeConfig?(input: { edits: Array<{ keyPath: string; mergeStrategy: "upsert"; value: boolean }>; hostId: string }): Promise<{ status?: string }>; writeOptimistic?(apps: AvailableApp[]): void } export const n: (options?: AppsAvailabilityOptions) => { isUpdating: boolean; setAppEnabled(update: { appId: string; appName?: string; enabled: boolean }): Promise<void>; updatingAppId: string | null }; export const t: () => void }
declare module "@rchunk/prepare-plugin-creator";
declare module "@rchunk/app-card" { export interface AppRestriction { isUserEditable?: boolean; keyPath: string; kind?: "app" | "tool"; origin?: { name?: { type?: string } } } export interface AppTool { configRestriction?: AppRestriction | null; disabledReason?: string | null; isEnabled?: boolean; name: string } export interface AppCardProps { app: { description?: string | null; id: string; name: string; tools?: readonly AppTool[] }; appRestriction?: AppRestriction | null; connectedAccountEmail?: string | null; disabled?: boolean; isConnectingApp?: boolean; onConnect?(): void; onDisconnectApp?(): void; onOpenAppTools?(): void; onSetAppEnabled?(enabled: boolean): void; showInstallAction?: boolean } export const a: (props: { appId?: string; isAppDisabledWithoutRestriction?: boolean; tool: AppTool }) => unknown; export const i: (props: { children: unknown; isControlDisabled?: boolean; tooltipContent?: unknown }) => unknown; export const n: () => void; export const o: () => void; export const r: (props: { restriction: AppRestriction; surface: "card" | "dialog" }) => string; export const t: (props: AppCardProps) => unknown; }
declare module "@rchunk/api" {
  export interface PluginArchiveFile { arrayBuffer(): Promise<ArrayBuffer>; name: string; size: number; type?: string }
  export interface HostedPluginRecord extends Record<string, unknown> { can_refresh_from_source?: boolean; id: string }
  export const a: (file: Pick<PluginArchiveFile, "name" | "size">) => "size" | "type" | null;
  export const i: (pluginId: string, accountId: string, signal?: AbortSignal) => Promise<HostedPluginRecord | null>;
  export const n: (accountId: string, file: PluginArchiveFile) => Promise<string>;
  export const o: () => void;
  export const r: (pluginId: string, accountId: string) => Promise<Blob>;
  export const s: (pluginId: string, accountId: string, file: PluginArchiveFile) => Promise<void>;
  export const t: (pluginId: string, accountId: string, signal?: AbortSignal) => Promise<boolean>;
}
declare module "@rchunk/chatgpt-file-upload" {
  export const ChatGptFileUploadIncompleteError: new (...arguments_: unknown[]) => Error;
  export const MAX_CHATGPT_UPLOAD_SIZE_BYTES: number;
  export const MAX_CONCURRENT_CHATGPT_FILE_UPLOADS: number;
  export const createChatGptFile: (...arguments_: unknown[]) => unknown;
  export const processChatGptFileUploadStream: (...arguments_: unknown[]) => unknown;
  export const uploadChatGptConversationFile: (...arguments_: unknown[]) => unknown;
  export const uploadChatGptFileBytes: (...arguments_: unknown[]) => unknown;
  export const uploadChatGptProjectFiles: (...arguments_: unknown[]) => unknown;
}
declare module "@rchunk/share-menu-item" {
  export interface SharePlugin { can_publish_to_workspace?: boolean; can_share_to_workspace?: boolean; canonical_app_id?: string | null; creator_account_user_id?: string | null; discoverability?: string | null; installPolicy?: string; installed?: boolean; is_deletable_workspace_plugin?: boolean; scope?: "GLOBAL" | "USER" | "WORKSPACE"; source?: { type?: string }; workspace_id?: string | null; [key: string]: unknown }
  export interface ShareAccount { account_user_id?: string; account_user_role?: string; id: string; structure: "personal" | "workspace" }
  export const _: () => void; export const a: (input: Record<string, unknown>) => Record<string, unknown>; export const b: () => void; export const c: (input: Record<string, unknown>) => unknown;
  export const d: (props: Record<string, unknown>) => unknown; export const f: (props: { children?: unknown; measurement?: unknown }) => unknown; export const g: (props: { onCopyLink(): Promise<boolean>; color?: string; size?: string }) => unknown;
  export const h: () => void; export const i: (scope: unknown, input: { pluginId: string }, accountId: string, share?: Record<string, unknown> | null) => Promise<unknown>; export const l: () => void;
  export const m: (props: { onCopyLink(): Promise<boolean>; onOpenChange(open: boolean): void; open: boolean; pluginName: string }) => unknown; export const n: () => void;
  export const o: (input: { pluginShareUrl?: string | null; shareContext?: { shareUrl?: string | null } | null; savedShareUrl?: string | null; configuredShareUrl?: string | null }) => string | null | undefined;
  export const p: () => void; export const r: () => void; export const s: () => void; export const t: (props: { canShare?: boolean; onShare?(): void }) => unknown;
  export const u: (plugin: SharePlugin) => boolean; export const v: (input: { plugin: SharePlugin; account: ShareAccount; userId?: string | null }) => boolean; export const y: (input: { plugin: SharePlugin; account: ShareAccount; canPublish: boolean }) => boolean;
}
declare module "@rchunk/thread-overflow-menu" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/local-conversation-side-chat" { export const i: { id: string; isAvailable(routeKind: string): boolean }; export const n: () => void; export const r: (input: Record<string, unknown>, open?: (input: Record<string, unknown>) => Promise<unknown> | unknown) => Promise<Record<string, unknown>>; export const t: { displayName: string; defaultValue: Record<string, unknown> | null }; }
declare module "@rchunk/local-conversation-git-actions" { export const i: () => void; export const n: () => void; export const r: (props: { phase: string }) => unknown; export const t: (props: Record<string, unknown> & { target: { hostId: string } }) => unknown; }
declare module "@rchunk/open-in-google-drive-menu-item" { export const a: (path: string) => "document" | "presentation" | "spreadsheet" | null; export const c: (input: Record<string, unknown>) => void; export const i: () => void; export const n: () => unknown; export const o: () => void; export const r: (props: { onOpen?(): void; path?: string; targetType?: "document" | "presentation" | "spreadsheet" }) => unknown; export const s: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/registered-conversation-thumbnail";
declare module "@rchunk/plugin-share-dialogs-runtime" {
  export interface HostedPlugin extends Record<string, unknown> {
    id: string;
    release: { display_name: string };
    scope: "USER" | string;
  }
  export const PluginDeleteDialog: (props: {
    accountId: string;
    onClose(): void;
    onDeleted(): Promise<void> | void;
    plugin: HostedPlugin;
  }) => unknown;
  export const PluginUploadDialog: (props: {
    accountId: string;
    onClose(): void;
    onUpdated?(): void;
    pluginId: string;
  }) => unknown;
}
declare module "@rchunk/loading-page";
declare module "@rchunk/plugin-share-dialog-entry";
declare module "@rchunk/terminal-workspace-warning-state" { export interface WorkspaceTarget { hostId?: string | null; workspaceRoot?: string | null } export interface TerminalWarningInput { binding?: WorkspaceTarget | null; currentTarget: WorkspaceTarget; currentWorkspaceRoots: readonly string[]; dismissedTarget?: WorkspaceTarget | null } export interface TerminalWarningState { dismissedTarget: WorkspaceTarget | null; dismiss(target: WorkspaceTarget): void; reset(): void } export const n: (input: TerminalWarningInput) => boolean; export const r: TerminalWarningState; export const t: () => void }
declare module "@rchunk/thread-shell-runtime" {
  export type TerminalPanel = "bottom" | "right";
  export interface ThreadTerminalContext { conversationId: string; conversationTitle?: string; cwd?: string | null; hostId?: string }
  export interface TerminalSession { context: ThreadTerminalContext; id: string; panel: TerminalPanel; snapshot?: unknown }
  export interface TerminalScope { activePanel?: TerminalPanel; context?: ThreadTerminalContext | null; defaultTerminalLocation?: TerminalPanel; sessions: TerminalSession[]; terminalHidden?: boolean }
  export const a: (scope: TerminalScope) => void;
  export const c: (scope: TerminalScope) => boolean;
  export const d: { getId(session: TerminalSession): string; getTitle(session: TerminalSession): string; open(scope: TerminalScope, sessionId?: string, panel?: TerminalPanel, options?: { snapshot?: unknown }): string | null; preloadExisting(scope: TerminalScope, sessionId: string, snapshot: unknown): Promise<boolean> };
  export const f: (scope: TerminalScope) => void;
  export const i: (scope: TerminalScope, input: { panel: TerminalPanel; sessionId: string; snapshot: unknown }) => void;
  export const l: (scope: TerminalScope) => TerminalPanel;
  export const m: (scope: TerminalScope) => () => void;
  export const n: () => void;
  export const o: (scope: TerminalScope, panel: TerminalPanel, replaceTabId?: string) => void;
  export const p: (scope: TerminalScope, panel?: TerminalPanel) => void;
  export const r: (scope: TerminalScope, sessionId?: string, panel?: TerminalPanel, options?: { snapshot?: unknown }) => string | null;
  export const s: (scope: TerminalScope) => void;
  export const t: (scope: TerminalScope) => boolean;
  export const u: (scope: TerminalScope) => boolean;
}
declare module "@rchunk/artifact-viewer";
declare module "@rchunk/thread-scroll-layout" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/thread-app-shell-chrome" { export const n: () => void; export const t: (props: Record<string, unknown> & { threadType: "local" | "new" | "remote" }) => unknown; }
declare module "@rchunk/thread-user-message-navigation-rail-app" { export const AppThreadUserMessageNavigationRail: (props: { items: Array<{ bookmarked?: boolean; id: string; preview?: unknown; title?: string; [key: string]: unknown }>; onBookmarkChange?(item: Record<string, unknown>, bookmarked: boolean): void; onPreviewItem?(item: Record<string, unknown>): void; onRevealItem?(item: Record<string, unknown>): void }) => unknown; }
declare module "@rchunk/thread-usage-breakdown" { export const n: (props: { usage: Record<string, unknown>; title?: unknown; showCostUsd?: boolean }) => unknown; export const r: () => void; export const t: (input: { dimension: "model" | "reasoning_effort" | "speed"; value?: string | null }) => string; }
declare module "@rchunk/chatgpt-conversation-transcript" { export const n: () => void; export const t: (props: Record<string, unknown> & { conversationId: string }) => unknown; }
declare module "@rchunk/conversation-ui" { export const i: () => void; export const n: (props: Record<string, unknown>) => unknown; export const r: (props: Record<string, unknown>) => unknown; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/find-plugin-mcp-extension-view"; declare module "@rchunk/control-group"; declare module "@rchunk/filter";
declare module "@rchunk/plugin-connected-account-links"; declare module "@rchunk/plugin-disabled-reason";
declare module "@rchunk/plugin-connected-account-links" {
  export const i: () => void; export const n: () => void;
  export const r: (props: { ariaLabel: string; icon?: unknown }) => unknown;
  export const t: (links: Array<{ connector_id: string; id: string; visibility?: string }>, connectorId: string) => Array<{ connector_id: string; id: string; visibility?: string }>;
}
declare module "@rchunk/plugin-disabled-reason" {
  export const a: (props: { credits: number; showRequirements?: boolean }) => unknown;
  export const i: () => void; export const n: () => void; export const o: () => void;
  export const r: (input: { disabledReason?: string | null; fallback: string; intl: import("@rchunk/app-shared").IntlShape }) => string;
  export const t: (props: { children?: unknown; disabledReason?: string | null }) => unknown;
}
declare module "@rchunk/find-plugin-mcp-extension-view" { export const n: () => void; export const t: (plugin: { summary: { id: string }; apps: Array<{ id: string }>; mcpServers: Array<{ name?: string; server?: string }> } | null, views: Array<{ appId?: string; pluginId?: string; server?: string }>) => unknown; }
declare module "@rchunk/use-plugin-scheduled-tasks" { export const n: (input: { hostId: string; capable?: boolean; enabled?: boolean; tasks?: unknown[] }) => unknown[] | undefined; export const t: () => void; }
declare module "@rchunk/prepare-plugin-creator" { export const n: (scope: { get<T>(signal: unknown): T }, signal: AbortSignal, options?: { hostId?: string }) => Promise<{ pluginId: string; setupStarted: boolean } | null>; export const t: () => void; }
declare module "@rchunk/plugin-connector-setup" { export const n: () => void; export const r: (input: Record<string, unknown>) => Promise<void>; export const t: (input: Record<string, unknown>) => void; }
declare module "@rchunk/requested-plugin-connection" {
  export const n: (input: { appConnectOptions?: Record<string, unknown>; requestedConnectorId?: string | null; requiresAppSetup?: boolean; fetchConnector?(connectorId: string): Promise<{ description?: string | null; name: string; status?: string }>; fetchLink?(connectorId: string): Promise<{ auth_status?: string | null } | null> }) => Promise<{ kind: "ready" | "unavailable" } | { app: { category: null; description: string | null; id: string; installUrl: null; name: string }; kind: "needsAuth" }>;
  export const t: () => void;
}
declare module "@rchunk/recommended-skill-statsig-overrides" { export const n: () => void; export const r: (value?: unknown) => Record<string, string>; export const t: (overrides: Record<string, string>, skillId: string) => string | undefined; }
declare module "@rchunk/profile-plugin-details" { export const ProfilePluginDetails: (props: { invocation: { plugin_id?: string | null; plugin_name: string }; onClose(): void; onCloseAutoFocus?(): void; plugin?: { id?: string; name: string; [key: string]: unknown } | null; searchResults?: Array<Record<string, unknown>>; searchError?: Error | null; searchLoading?: boolean }) => unknown; }
declare module "@rchunk/plugin-showcase-skill-details" { export const PluginShowcaseSkillDetails: (props: { item: { description?: string; pin: { artifact_id: string }; title?: string }; onClose(): void; onInstall?(skill: Record<string, unknown>): Promise<void> | void; skill?: Record<string, unknown> | null; skillsAccess?: boolean }) => unknown; }
declare module "@rchunk/skill-data" {
  export const getSkillName: (skill: { id: string; name?: string }) => string; export const getSkillSafetyStatus: (skill: Record<string, unknown>, config?: { blockUnsafe?: boolean }) => "blocked" | "needs-review" | null;
  export const setSkillInstalled: (scope: unknown, skill: Record<string, unknown>, installed: boolean) => Promise<Record<string, unknown>>;
  export const skillDetail$: { key: string }; export const skillFile$: { key: string }; export const skillSafetyConfig$: { key: string }; export const skillsAccess$: { key: string }; export const skillsCollection$: { key: string };
}
declare module "@rchunk/use-plugin-installation" { export const installPlugin: (plugin: { id: string; name?: string; [key: string]: unknown }, installer?: (plugin: { id: string; name?: string; [key: string]: unknown }) => Promise<unknown>) => Promise<unknown>; }
declare module "@rchunk/browser-skill-files" {
  export interface BrowserSkillFileRange { length: number; start: number; }
  export interface BrowserSkillWithFiles extends Record<string, unknown> {
    check_sum_hash?: string | null;
    files: Record<string, BrowserSkillFileRange | undefined>;
    id: string;
    permissions?: { can_read?: boolean };
    sediment_id?: string | null;
  }
  export const n: () => void;
  export const r: import("@rchunk/app-shared").ScopedQueryFamily<
    Record<string, unknown>,
    { path: string; skill: BrowserSkillWithFiles },
    string
  >;
  export const t: (
    accountId: string,
    skill: BrowserSkillWithFiles,
    path: string,
    signal?: AbortSignal,
  ) => Promise<ArrayBuffer>;
}
declare module "@rchunk/showcase-items" {
  export type ShowcaseItem = { kind: "site"; site: { description?: string | null; thumbnail_url?: string | null; title: string } } | { kind: "pin"; pin: { description?: string | null; icon?: string | null; title: string } };
  export const n: () => void;
  export const t: (item: ShowcaseItem) => { description: string | null; icon: unknown; title: string };
}

declare module "@rchunk/mcp-extension-view-page-core" {
  export const i: () => void;
  export const n: () => void;
  export const r: () => unknown;
  export const t: (props?: {
    deepLink?: string;
    locationState?: unknown;
    mcpAppId?: string;
    path?: string;
    view?: {
      entrypoint?: { type?: string };
      id?: string;
      title?: string;
      [key: string]: unknown;
    } | null;
    views?: Array<{
      entrypoint?: { type?: string };
      id?: string;
      title?: string;
      [key: string]: unknown;
    }>;
  }) => unknown;
}

declare module "@rchunk/mcp-view-surface" {
  export const n: () => void;
  export const t: (props: { isLoading?: boolean; loadingContent?: unknown; partition?: string; showBackButton?: boolean; src: string; webviewRef?(element: unknown): void }) => unknown;
}

declare module "@rchunk/diff-preview-content" {
  export const DiffHighlightPreloader: (props: { fileDiff: unknown }) => unknown;
  export const DiffPreviewContent: (props: { diff: { metadata?: unknown }; displayPath?: string; linesAdded?: number; linesRemoved?: number; onOpen?(event?: unknown): void }) => unknown;
}
declare module "@rchunk/ansi-block" {
  export const n: () => void;
  export const t: (props: { children?: string | null; className?: string }) => unknown;
}
declare module "@rchunk/shell-label" {
  export const n: () => void;
  export const t: (command: string) => string | null;
}
declare module "@rchunk/stripe-pure" {
  export interface StripeInstance {
    _registerWrapper?(metadata: {
      name: string;
      startTime: number;
      version: string;
    }): void;
  }
  export interface LoadStripe {
    (
      publishableKey: string,
      ...arguments_: unknown[]
    ): Promise<StripeInstance | null>;
    setLoadParameters(parameters: { advancedFraudSignals: boolean }): void;
  }
  export const n: () => void;
  export const r: LoadStripe;
  export const t: () => void;
}
declare module "@rchunk/shiki-highlight-provider" {
  export const ShikiHighlightProvider: (props: { children?: unknown }) => unknown;
}
declare module "@rchunk/codex-diff-css" {
  export const _: <Arguments extends unknown[], Result>(callback: (...arguments_: Arguments) => Result) => (...arguments_: Arguments) => Result;
  export const a: () => void;
  export const c: (children: unknown, shadowHtml?: string | null) => unknown;
  export const d: () => void;
  export const f: () => null;
  export const g: () => void;
  export const h: () => ((element: HTMLElement, options: unknown, state: unknown) => unknown) | undefined;
  export const i: unknown;
  export const l: Readonly<Record<string, string | number>>;
  export const m: () => void;
  export const n: (options: { alignCommentGutter?: boolean; includeDiffHeader?: boolean; includeSimpleLineSeparators?: boolean; rootSelector: string; surface: string; useReviewLineInfoSeparators?: boolean }) => string;
  export const o: () => unknown;
  export const p: (props: { children?: unknown; createEditor(element: HTMLElement, options: unknown, state: unknown): unknown }) => unknown;
  export const r: () => void;
  export const s: () => void;
  export const t: (usePrimarySurface: boolean, kind: string) => string;
  export const u: Readonly<Record<string, string>>;
}
declare module "@rchunk/diff-worker-runtime" { export const parser: unknown; }
declare module "@rchunk/diff-worker-algorithm" { export const parser: unknown; }
declare module "@rchunk/diff-worker-model" { export const parser: unknown; }
declare module "@rchunk/diff-worker-renderer" { export const parser: unknown; }
declare module "@rchunk/diff-worker-utils" { export const parser: unknown; }
declare module "@rchunk/pull-request-actions" {
  export const _: (input: { currentComments: Array<Record<string, unknown>>; nextComments: Array<Record<string, unknown>> }) => Array<Record<string, unknown>>;
  export const a: symbol;
  export const c: symbol;
  export const d: symbol;
  export class f extends Error { reason: string; constructor(reason: string, cause?: unknown); }
  export const g: (input: { comments: Array<Record<string, unknown>>; filePaths: string[]; workspaceRoot?: string }) => Map<string, number>;
  export const h: (revision: string, comment: Record<string, unknown>) => { commentKey: string; revision: string };
  export const i: symbol;
  export const l: symbol;
  export const m: () => void;
  export const n: symbol;
  export const o: symbol;
  export const p: (input: Record<string, unknown>) => Promise<string>;
  export const r: symbol;
  export const s: symbol;
  export const t: () => void;
  export const u: symbol;
  export const v: () => void;
}
declare module "@rchunk/pull-request-revision-tab" {
  export const PullRequestRevisionTab: (props: { request?: unknown; title?: string; unavailableReason?: string }) => unknown;
}
declare module "@rchunk/registered-pull-request-thumbnail" {
  export const RegisteredPullRequestThumbnail: (props: { props?: { request?: Record<string, unknown>; status?: string; checks?: unknown[] }; title?: string }) => unknown;
}
declare module "@rchunk/virtualized-file-diff-line-position";
declare module "@rchunk/thread-user-message-navigation-rail-app";
declare module "@rchunk/revision-review-unavailable-message";
declare module "@rchunk/pull-request-checks-summary";

declare module "@rchunk/detail-page" {
  export const n: (props: { children?: unknown }) => unknown;
  export const r: () => void;
  export const t: string;
}

declare module "@rchunk/skills-page-grid" {
  export const n: (props: Record<string, unknown>) => unknown;
  export const r: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/chatgpt-cme" {
  export const n: {
    readonly $type: "protobuf_analytics_events.v1.ChatgptCmeHomeEntryClicked";
  };
  export const r: () => void;
  export const t: {
    readonly $type: "protobuf_analytics_events.v1.ChatgptCmeClaimSubmitted";
  };
}

declare module "@rchunk/home-entry-point" {
  export const CmeHomeEntryPoint: () => unknown;
}

declare module "@rchunk/pca-connector-action" {
  export const n: () => void;
  export interface PcaResumeTarget { capturedLeafId: string; capturedModel?: string; capturedPromptId: string; connectorId: string; includeConnectorSystemHintAfterLink?: boolean; kind: "chatgpt-pca-beacon"; serverConversationId: string; triggerTurnAfterLink?: boolean }
  export interface PcaActionScope { activeLinks?(connectorId: string): Promise<boolean>; conversation?(conversationId: string): Promise<{ currentLeafId: string; mapping: Record<string, { message?: Record<string, unknown> | null; parent?: string | null }> } | null>; get?<Value>(reader: unknown, ...parameters: unknown[]): Value; getConversationId?(conversationId: string): string | null; getLeafId?(conversationId: string): string | null; getMapping?(conversationId: string): Record<string, { message?: Record<string, unknown> | null; parent?: string | null }> | null; log?(event: string, payload: Record<string, unknown>): void; submitTurn?(input: Record<string, unknown>): Promise<unknown> }
  export const r: (scope: PcaActionScope, resumeTarget: unknown) => Promise<unknown>;
  export const t: (scope: PcaActionScope, options: { connectorId: string; conversationId: string; includeConnectorSystemHint?: boolean; triggerTurnAfterLink?: boolean }) => PcaResumeTarget | null;
}

declare module "@rchunk/codex-app-home-beacon-connect-modal" {
  export interface CodexAppHomeBeaconConnectModalProps {
    connectorId: string;
    onOpenChange(open: boolean): void;
    pcaResumeTarget?: unknown;
  }
  export const CodexAppHomeBeaconConnectModal: (
    props: CodexAppHomeBeaconConnectModalProps,
  ) => unknown;
}

declare module "@rchunk/app-connect-modal-by-id" {
  export interface AppConnectModalByIdProps extends Record<string, unknown> {
    connectorId: string;
    hostId?: string;
    onOpenChange(open: boolean): void;
  }
  export interface ConnectorLoadStateProps {
    isPending: boolean;
    isFetching: boolean;
    onOpenChange(open: boolean): void;
    onRetry(): void;
  }
  export const n: (props: AppConnectModalByIdProps) => unknown;
  export const r: () => void;
  export const t: (props: ConnectorLoadStateProps) => unknown;
}

declare module "@rchunk/use-app-connect-flow" {
  export interface AppConnectFlowOptions {
    connect?(app: { id: string; isAccessible?: boolean; name?: string }, options?: Record<string, unknown>): Promise<{ kind?: string; redirectUrl?: string } | null>;
    getPending?(appId: string, hostId: string, target?: Record<string, unknown>): { appConnectOptions?: Record<string, unknown>; hostId?: string; oauthState?: string; resumeTarget: Record<string, unknown> & { kind: string } } | null;
    hostId?: string;
    marketplaceAnalytics?: unknown;
    onConnectStarted?(app: { id: string; isAccessible?: boolean; name?: string }): void;
    onExternalConnectStarted?(app: { id: string; isAccessible?: boolean; name?: string }): void;
    openExternal?(url: string): void;
    savePending?(pending: Record<string, unknown>): string | null | void;
    clearPending?(input: { hostId: string; oauthState?: string }): void;
  }
  export interface AppConnectFlow {
    connectingApp: { id: string; isAccessible?: boolean; name?: string } | null;
    connectingOptions?: Record<string, unknown>;
    clearConnectingApp(): void;
    clearPendingAppConnect(input: Record<string, unknown>): void;
    handleAppConnected(appId: string): void;
    handleAppConnectOAuthStarted(event: Record<string, unknown>): string | null | void;
    handleConnectApp(app: { id: string; isAccessible?: boolean; name?: string }, options?: Record<string, unknown>): Promise<void>;
    handleExternalConnectStarted(app: { id: string; isAccessible?: boolean; name?: string }, target?: Record<string, unknown>): void;
    handleOpenAppUrl(url?: string | null): void;
    isAppConnectPending(appId: string, target?: Record<string, unknown>): boolean;
    isAppReauthPending(appId: string): boolean;
  }
  export const n: (options?: AppConnectFlowOptions) => AppConnectFlow;
  export const t: () => void;
}

declare module "@rchunk/app-connect-modal" {
  export type ConnectorAuthReason = "missing_link" | "reauth_required";
  export interface AppConnectModalProps extends Record<string, unknown> {
    app: import("@rchunk/app-info").AppInfo;
    connectorAuth?: {
      authReason: ConnectorAuthReason;
      linkId?: string;
    };
    isReconnecting?: boolean;
    onConnected?(): void;
    onOAuthStarted?(event: Record<string, unknown>): void;
    onOpenChange(open: boolean): void;
    reauthLinkId?: string;
  }
  export const n: () => void;
  export const t: (props: AppConnectModalProps) => unknown;
}

declare module "@rchunk/app-info" {
  export interface ConnectorApp extends Record<string, unknown> {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
    iconUrlDark?: string;
    distributionChannel?: unknown;
    installUrl?: string;
    pluginDisplayNames?: string[];
  }
  export interface AppInfo extends Record<string, unknown> {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
    logoUrlDark?: string;
    iconAssets: null;
    iconDarkAssets: null;
    distributionChannel?: unknown;
    branding: null;
    appMetadata: null;
    labels: null;
    installUrl?: string;
    isAccessible: boolean;
    isEnabled: boolean;
    pluginDisplayNames: string[];
  }
  export const n: () => void;
  export const t: (app: ConnectorApp) => AppInfo;
}

declare module "@rchunk/pasted-link-connect-modal" {
  export interface LibraryPastedLinkConnectModalProps {
    app: import("@rchunk/app-info").ConnectorApp;
    area: unknown;
    onConnected(): void;
    onOpenChange(open: boolean): void;
    reauthLinkId?: string;
  }
  export const LibraryPastedLinkConnectModal: (
    props: LibraryPastedLinkConnectModalProps,
  ) => unknown;
}

declare module "@rchunk/use-codex-worktrees" {
  export interface CodexWorktreesQueryResult {
    data?: { worktrees?: unknown[] };
    isError?: boolean;
    isLoading?: boolean;
  }
  export const n: (
    host: unknown,
    surface: string,
    options: { enabled: boolean },
  ) => CodexWorktreesQueryResult;
  export const a: unknown;
  export const i: (
    scope: unknown,
    hostId: string,
    setting: { key: string },
    value: unknown,
  ) => Promise<void>;
  export const r: () => void;
  export const t: () => void;
}

declare module "@rchunk/pull-request-fix-automation" {
  export const a: (input: Record<string, unknown>) => Promise<unknown>;
  export const i: (automation: Record<string, unknown>) => Promise<unknown>;
  export const n: () => void;
  export const o: (preferences: {
    autoMerge: boolean;
    instructions: string;
  }) => Promise<unknown[]>;
  export const r: (automation: { status?: string } | null | undefined) => boolean;
  export const t: (
    automations: readonly Record<string, unknown>[] | null | undefined,
    pullRequestUrl: string | null | undefined,
  ) => unknown;
}

declare module "@rchunk/app-shared" {
  export interface ArraySchema<Value> extends SafeParseSchema<Value[]> {
    transform<Output>(transformer: (values: Value[]) => Output): SafeParseSchema<Output>;
  }
  export const E4: <Value>(schema: SafeParseSchema<Value>) => ArraySchema<Value>;
  export const Z4: () => StringSchema;
  export const tU: () => string;
  export const bS: (props: Record<string, unknown>) => unknown;
  export const qv: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/app-initial" {
  export const Bzt: import("@rchunk/app-shared").ReadableSignal<boolean>;
  export const Kzt: <Props extends Record<string, unknown>>(
    component: ManagedDialogComponent<Props>,
  ) => boolean;
  export const Rzt: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
  ) => void;
  export const Wzt: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    blocking: boolean,
  ) => void;
  export const qzt: <Props extends Record<string, unknown>>(
    component: ManagedDialogComponent<Props>,
  ) => Props | null;
  export const xun: import("@rchunk/app-shared").ReadableSignal<boolean>;
  export const RVt: import("@rchunk/app-shared").SignalFamily<
    string,
    Record<string, unknown> | null
  >;
  export const uHt: () => void;
  export const fnn: () => void;
  export const mnn: (
    turn: Record<string, unknown>,
    requests: unknown,
    options: {
      includeTurnDiff: boolean;
      isBackgroundSubagentsEnabled: boolean;
      preserveServerUserMessages?: boolean;
      projectionBudget: {
        fits(value: unknown): boolean;
        select<Value>(
          values: readonly Value[],
          predicate?: (value: Value) => boolean,
          limit?: number,
        ): Value[];
      };
    },
  ) => Record<string, unknown>;
  export const d2: () => void;
  export const h2: () => (input: { prefillPrompt: string }) => void;
  export const Ir: () => void;
  export const Lr: () => {
    isAppConnectPending(
      connectorId: string,
      resumeTarget: unknown,
      hostId?: string,
    ): boolean;
    markAppConnectOAuthPending(
      event: Record<string, unknown>,
    ): unknown;
  };
  export const cW: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    requestId: string,
    result: Record<string, unknown>,
  ) => void;
  export const lW: () => void;
  export const uW: import("@rchunk/app-shared").ReadableSignal<unknown>;
  export const Gdt: () => void;
  export const LR: (props: {
    icon: unknown;
    monochrome?: boolean;
  }) => unknown;
  export const Mk: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    fields: { view: unknown },
  ) => void;
  export const RR: () => void;
  export const Wdt: (action: Record<string, unknown>) => unknown;
  export const kk: () => void;
  export interface WorkspaceAccount {
    isDeactivated?: boolean;
    isPersonalWorkspace?: boolean;
    plan_type?: unknown;
    [key: string]: unknown;
  }
  export interface WorkspaceAccountsResponse {
    accounts?: WorkspaceAccount[];
    [key: string]: unknown;
  }
  export const Ox: (
    response: WorkspaceAccountsResponse | null | undefined,
  ) => WorkspaceAccount[];
  export const iht: () => {
    data?: WorkspaceAccountsResponse | null;
  };
  export const mC: import("@rchunk/app-shared").SignalFamily<
    { accountId: string | null; userId: string | null },
    { data?: { email: string; email_domain_type?: string | null } | null }
  >;
}

declare module "@rchunk/conversation-markdown" {
  export class a {
    truncated: boolean;
    constructor(limit: { maxChars: number; truncationMarker: string });
    append(value: string): void;
    toString(): string;
  }
  export const i: (input: {
    cwd: string | null;
    markdownLimit: { maxChars: number; truncationMarker: string };
    projectlessOutputDirectory: string | null;
    turn: Record<string, unknown>;
  }) => string | null;
  export const o: () => void;
  export const r: (
    title: string | null,
    limit: { maxChars: number; truncationMarker: string },
  ) => string;
  export const t: () => void;
}

declare module "@rchunk/workspace-discovery" {
  export const a: { getOptions(userId: string | null): Record<string, unknown> };
  export const c: (value: { email: string; email_domain_type?: string | null }) => boolean;
  export const i: () => void;
  export const l: () => void;
  export const n: () => void;
  export const o: () => void;
  export const r: Readonly<{ $type: "protobuf_analytics_events.v1.ChatgptWorkspaceDiscoveryModalShown" }>;
  export const s: "oai/apps/hasSeenWorkspaceDiscoveryFirstLogin";
  export const t: (props: { accessibleWorkspaces?: Array<{ id: string; imageUrl?: string | null; name: string }>; discoverableWorkspaces?: Array<{ id: string; image_url?: string | null; name: string; requested?: boolean }>; email?: string; loading?: boolean; mode?: "blocking" | "dismissible"; onClose?(): void; onRequest?(workspace: { id: string; image_url?: string | null; name: string; requested?: boolean }): Promise<void> | void; section?: "both" | "discoverable" | "existing" }) => unknown;
  export const u: (token: string | null | undefined, nowMs: number) => boolean;
}

declare module "@rchunk/view-frame" {
  export const n: () => void;
  export const t: (props: { className?: string; deepLink?: string; lifetime?: "app" | "component"; mcpAppId?: string; onClose?(): void; sessionId?: string; view?: { id?: string; title?: string; url?: string; [key: string]: unknown } }) => unknown;
}

declare module "@rchunk/modal-controller-state" {
  export const closeAllModals: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
  ) => void;
  export const closeModal: typeof import("@rchunk/app-initial").zzt;
  export const hasAnyModalOpen$: import("@rchunk/app-shared").ReadableSignal<boolean>;
  export const isModalOpen: typeof import("@rchunk/app-initial").Hzt;
  export const openModal: typeof import("@rchunk/app-initial").Uzt;
  export const setModalBlocking: typeof import("@rchunk/app-initial").Wzt;
  export const useHasAnyModalOpen: () => boolean;
  export const useIsModalOpen: typeof import("@rchunk/app-initial").Kzt;
  export const useModalState: typeof import("@rchunk/app-initial").qzt;
}

declare module "@rchunk/announcement-modal-source-bridge" {
  export const n: () => void;
  export const t: (props: { candidate: unknown; source: string }) => unknown;
}

declare module "@rchunk/chatgpt-user-context" {
  export const n: () => void;
  export const t: import("@rchunk/app-shared").ScopedQuerySignal<
    Record<string, unknown>,
    Record<string, unknown>
  >;
}

declare module "@rchunk/request-context" {
  export const n: () => void;
  export const r: import("@rchunk/app-shared").ScopedDerivedFamily<
    Record<string, unknown>,
    {
      context: { conversationId: string; messageId: string };
      product: { cite?: boolean };
    },
    { isSourceCatalog: boolean; rewrittenQueries?: string[] }
  >;
  export const t: (
    scope: { get(signal: unknown, parameter: string): unknown },
    position: { conversationId: string; messageId: string },
    product: { cite?: boolean },
  ) => { isSourceCatalog: boolean; rewrittenQueries?: string[] };
}

declare module "@rchunk/promo-funnel-context" {
  export interface PromoFunnelCheckoutContext {
    accountId?: string;
    location: string;
    organizationId?: string;
    promoCampaignId?: string;
    promoCode?: string;
    referralCode?: string;
  }
  export const n: () => void;
  export const r: (context: PromoFunnelCheckoutContext) => void;
  export const t: () => PromoFunnelCheckoutContext | null;
}

declare module "@rchunk/mcp-quick-action-dialog" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/app-initial" {
  export const Ict: (...arguments_: unknown[]) => unknown;
  export const Pct: () => void;
  export const gAt: (...arguments_: unknown[]) => Promise<unknown>;
  export const mAt: () => void;
  export const fvt: (...arguments_: unknown[]) => unknown;
  export const hvt: (...arguments_: unknown[]) => unknown;
  export const f2: (...arguments_: unknown[]) => unknown;
  export const m2: (...arguments_: unknown[]) => Promise<unknown>;
  export const p2: (...arguments_: unknown[]) => boolean;
  export const FR: (...arguments_: unknown[]) => unknown;
  export const IR: (...arguments_: unknown[]) => Promise<boolean>;
  export const MR: () => void;
  export const NR: string;
  export const PR: (...arguments_: unknown[]) => unknown;
  export const Qen: () => void;
  export const jct: () => void;
  export const B4t: () => void;
  export const U3t: () => void;
  export const V3t: (value: unknown) => unknown | null;
  export const Y9t: () => void;
  export const q9t: (value: unknown) => string;
  export const z4t: (value: unknown) => unknown;
}

declare module "@rchunk/conversation-markdown" {
  export const n: (input: Record<string, unknown>) => string;
}

declare module "@rchunk/open-thread-pull-request-code-tab" {
  export const n: (...arguments_: unknown[]) => { tabId: string; placement: string; status: "opened" };
  export const t: () => void;
}

declare module "@rchunk/open-local-conversation-subagents-panel" {
  export const n: (...arguments_: unknown[]) => unknown;
  export const t: () => void;
}

declare module "@rchunk/thread-app-shell-chrome" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/open-local-conversation-sources-side-panel-tab" {
  export const n: (...arguments_: unknown[]) => unknown;
  export const t: () => void;
}

declare module "@rchunk/open-local-conversation-background-terminal-tab" {
  export const n: (...arguments_: unknown[]) => unknown;
  export const t: () => void;
}

declare module "@rchunk/chatgpt-conversation-transcript" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/conversation-ui" {
  export const i: () => void;
  export const n: (props: Record<string, unknown>) => unknown;
  export const r: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/local-conversation-webmcp-tools-model" {
  export const i: () => void;
  export const n: (...arguments_: unknown[]) => unknown[];
  export const r: (...arguments_: unknown[]) => Map<string, unknown[]>;
  export const t: (url: string) => string | null;
}

declare module "@rchunk/local-conversation-sources-signals" {
  export const i: import("@rchunk/app-shared").SignalFamily<string, unknown>;
  export const n: () => void;
  export const r: import("@rchunk/app-shared").SignalFamily<string, unknown>;
  export const t: import("@rchunk/app-shared").SignalFamily<string, unknown>;
}

declare module "@rchunk/open-thread-pull-request-side-panel-tab" {
  export const i: (...arguments_: unknown[]) => Promise<boolean>;
  export const n: (...arguments_: unknown[]) => boolean;
  export const r: (...arguments_: unknown[]) => boolean;
  export const t: () => void;
}

declare module "@rchunk/thread-right-panel-state" {
  export const toggleThreadSidePanel: (...arguments_: unknown[]) => unknown;
}

declare module "@rchunk/conversation-markdown-entry" {
  export const renderConversationMarkdown: (
    input: Record<string, unknown>,
  ) => string;
}

declare module "@rchunk/chatgpt-conversation-updates-runtime" {
  export const refetchChatGptConversation: (
    ...arguments_: unknown[]
  ) => Promise<unknown>;
}

declare module "@rchunk/thread-panel-state" {
  export const activateThreadPanelTab: (...arguments_: unknown[]) => unknown;
  export const getThreadPanelTabController: (...arguments_: unknown[]) => unknown;
}

declare module "@rchunk/local-conversation-summary-panel-image-preview" {
  export const n: () => void;
  export const t: (value: unknown) => unknown | null;
}

declare module "@rchunk/thread-side-panel-tabs" {
  export const n: (
    scope: unknown,
    tabType: unknown,
    reveal?: boolean,
    options?: Record<string, unknown>,
  ) => boolean;
  export const r: (
    scope: unknown,
    tabType: unknown,
    options?: Record<string, unknown>,
  ) => boolean;
  export const t: () => void;
}

declare module "@rchunk/conversation-navigation-state" {
  export const n: import("@rchunk/app-shared").ScopedSignalFamily<
    Record<string, unknown>,
    unknown,
    boolean
  >;
  export const t: () => void;
}

declare module "@rchunk/worktree-onboarding-state" {
  export interface UseWorktreeOnboardingStateOptions {
    enabled: boolean;
    entryPoint: string;
    isLocalModeRemote?: boolean;
  }
  export const n: (
    options: UseWorktreeOnboardingStateOptions,
  ) => { isEligible: boolean };
  export const r: import("@rchunk/app-shared").ScopedSignal<
    Record<string, unknown>,
    "dismissed" | "eligible" | "succeeded"
  >;
  export const t: () => void;
}

declare module "@rchunk/browser-profile-import-availability" {
  export const n: import("@rchunk/app-shared").ScopedSignal<unknown, boolean>;
  export const t: () => void;
}

declare module "@rchunk/browser-profile-import-analytics" {
  export type BrowserProfileImportEntryPoint = string;
  export interface BrowserProfileImportAttemptContext {
    attemptIndex: number;
    flowId: string;
    windowsChromeAdminApprovalNoticeAcknowledged: boolean;
    windowsChromeAdminApprovalNoticeRequired: boolean;
  }
  export interface BrowserProfileImportRequest {
    importCookies?: boolean;
    importExtensions?: boolean;
    importPasswords?: boolean;
    source: "atlas" | "chrome";
  }
  export const a: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    entryPoint: BrowserProfileImportEntryPoint,
    flowId: string,
  ) => void;
  export const c: typeof a;
  export const i: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    entryPoint: BrowserProfileImportEntryPoint,
    details: Record<string, unknown>,
  ) => void;
  export const n: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    entryPoint: BrowserProfileImportEntryPoint,
    request: BrowserProfileImportRequest,
    context: BrowserProfileImportAttemptContext,
    result?: unknown,
  ) => void;
  export const o: typeof a;
  export const r: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    entryPoint: BrowserProfileImportEntryPoint,
    request: BrowserProfileImportRequest,
    context: BrowserProfileImportAttemptContext,
  ) => void;
  export const s: typeof a;
  export const t: () => void;
}

declare module "@rchunk/browser-profile-import-dialog" {
  export interface BrowserProfileImportService
    extends import("@rchunk/browser-profile-import-query").BrowserProfileImportService {
    importBrowserProfile(request: Record<string, unknown>): Promise<unknown>;
  }
  export interface BrowserProfileImportDialogProps extends Record<string, unknown> {
    entryPoint: string;
    flowId: string;
    onClose(): void;
    service: BrowserProfileImportService;
  }
  export const BrowserProfileImportDialogModal: (
    props: BrowserProfileImportDialogProps,
  ) => unknown;
}

declare module "@rchunk/browser-profile-import-query" {
  export type BrowserProfileSource = "atlas" | "chrome";
  export type BrowserProfileImportKind =
    | "cookies"
    | "extensions"
    | "history"
    | "passwords";
  export interface ImportableBrowserProfile extends Record<string, unknown> {
    appName: string;
    hasExtensions?: boolean;
    profileDirectoryName?: string;
    profileName?: string;
    profilePath: string;
    source: BrowserProfileSource;
  }
  export interface BrowserProfileImportSignals extends Record<string, unknown> {}
  export interface BrowserProfileImportService {
    getImportSignals(): Promise<BrowserProfileImportSignals>;
    listImportableBrowserProfiles(): Promise<ImportableBrowserProfile[]>;
  }
  export const a: (props: {
    className?: string;
    source: BrowserProfileSource;
  }) => unknown;
  export const c: Record<string, import("@rchunk/app-shared").MessageDescriptor>;
  export const d: () => void;
  export const i: () => void;
  export const l: () => void;
  export const n: (
    service: BrowserProfileImportService | null | undefined,
    enabled: boolean,
  ) => import("@rchunk/app-shared").UseQueryOptions<BrowserProfileImportSignals>;
  export const o: (props: { sources: BrowserProfileSource[] }) => unknown;
  export const r: (
    profiles: Array<{ source: BrowserProfileSource }>,
  ) => BrowserProfileSource[];
  export const s: () => void;
  export const t: (
    service: BrowserProfileImportService | null | undefined,
    enabled: boolean,
  ) => import("@rchunk/app-shared").UseQueryOptions<ImportableBrowserProfile[]>;
  export const u: (props: {
    className?: string;
    kind: BrowserProfileImportKind;
  }) => unknown;
}

declare module "@rchunk/browser-profile-import-cookies-icon" {
  export const n: () => void;
  export const t: (props: { className?: string }) => unknown;
}

declare module "@rchunk/browser-profile-import-history-icon" {
  export const n: () => void;
  export const t: (props: { className?: string }) => unknown;
}

declare module "@rchunk/generated-image-context-menu" {
  export const getGeneratedImageContextMenuItems: (
    scope: unknown,
    options: import("@rchunk/app-initial").GeneratedImageContextMenuOptions,
  ) => import("@rchunk/app-initial").GeneratedImageContextMenuItem[];
}

declare module "@rchunk/create-project-dialog-core" {
  export interface CreateProjectDialogProps {
    initialRequest?: Record<string, unknown> | null;
    onClose(): void;
  }
  export const r: () => void;
  export const t: (props: CreateProjectDialogProps) => unknown;
}

declare module "@rchunk/create-project-dialog-entry" {
  export const CreateProjectDialog: (
    props: import("@rchunk/create-project-dialog-core").CreateProjectDialogProps,
  ) => unknown;
}

declare module "@rchunk/library-file-picker-dialog" {
  export const LibraryFilePickerDialog: (
    props: import("@rchunk/app-primary").LibraryFilePickerDialogProps,
  ) => unknown;
}

declare module "@rchunk/appgen-settings-page" {
  export interface AppgenEnvironmentDraft { buildCommand?: string; outputDirectory?: string; rootDirectory?: string }
  export interface AppgenSettingsPageProps { environment?: AppgenEnvironmentDraft | null; error?: string | null; initialEnvironmentDraft?: AppgenEnvironmentDraft; initialTitle?: string; isLoading?: boolean; onDeleted(): void; onSave?(input: { environment: AppgenEnvironmentDraft; title: string }): Promise<void> | void; projectId: string; siteUrl?: string | null }
  export const n: (props: AppgenSettingsPageProps) => unknown;
  export const r: () => void;
  export const t: (props: AppgenSettingsPageProps) => unknown;
}

declare module "@rchunk/appgen-settings-dialog" {
  export interface AppgenSettingsDialogProps extends Record<string, unknown> {
    onClose(): void;
    projectId: string;
  }
  export const AppgenSettingsDialog: (
    props: AppgenSettingsDialogProps,
  ) => unknown;
}

declare module "@rchunk/appgen-share-dialog" {
  export interface AppgenShareDialogProps extends Record<string, unknown> {
    projectId: string;
    source: import("@rchunk/app-shared").SitesSharingSource;
  }
  export const AppgenShareDialog: (props: AppgenShareDialogProps) => unknown;
}

declare module "@rchunk/open-appgen-share-dialog" {
  export interface OpenAppgenShareDialogOptions
    extends Record<string, unknown> {
    source: import("@rchunk/app-shared").SitesSharingSource;
  }
  export const n: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>,
    projectId: string,
    options: OpenAppgenShareDialogOptions,
  ) => void;
  export const t: () => void;
}

declare module "@rchunk/dialog-action" {
  export interface DialogPrimaryAction {
    label?: unknown;
    onClick: () => void;
    type?: "button" | "reset" | "submit";
  }
  export interface DialogActionProps {
    actions: Record<"invite" | "share", DialogPrimaryAction>;
    cancelAction?: { disabled?: boolean; onClick: () => void };
    disabled?: boolean;
    hasPendingAccessChange: boolean;
    hasPendingInvitees: boolean;
    idleActions?: unknown;
    isSaving?: boolean;
    size?: import("@rchunk/app-shared").ButtonSize;
  }
  export const n: () => void;
  export const t: (props: DialogActionProps) => unknown;
}

declare module "@rchunk/permission-dropdown" {
  export type PermissionValue = string | number;
  export interface PermissionOption<Value extends PermissionValue> {
    ariaLabel?: string;
    description?: string | null;
    disabled?: boolean;
    tooltipText?: unknown;
    value: Value;
  }
  export interface PermissionDropdownProps<Value extends PermissionValue> {
    disabled?: boolean;
    onChange?: (value: Value) => void;
    onRemoveAccess?: () => void;
    options: readonly PermissionOption<Value>[];
    removeLabel?: unknown;
    renderLabel: (value: Value) => unknown;
    value: Value;
    variant?: "default" | "inline";
  }
  export const n: () => void;
  export const t: <Value extends PermissionValue>(
    props: PermissionDropdownProps<Value>,
  ) => unknown;
}

declare module "@rchunk/appgen-site-card" {
  export interface AppgenSiteCardProps {
    liveUrl?: string | null;
    onOpenSettings?: () => void;
    settingsHref?: string | null;
    title: string;
  }
  export const n: () => void;
  export const t: (props: AppgenSiteCardProps) => unknown;
}

declare module "@rchunk/building" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/create-remote-project-modal" {
  export interface RemoteProjectRequest extends Record<string, unknown> {
    mode?: "pick" | string;
  }
  export interface CreateRemoteProjectModalProps {
    initialRequest?: RemoteProjectRequest;
  }
  export const CreateRemoteProjectModal: (
    props?: CreateRemoteProjectModalProps,
  ) => unknown;
}

declare module "@rchunk/location-permission-denied-dialog" {
  export interface LocationPermissionDeniedDialogProps {
    onClose(): void;
  }
  export const ChatGptLocationPermissionDeniedDialog: (
    props: LocationPermissionDeniedDialogProps,
  ) => unknown;
}

declare module "@rchunk/plugin-skill-preview" {
  export interface PluginSkillPreviewProps extends Record<string, unknown> {
    description?: unknown;
    footer?: unknown;
    headerActions?: unknown;
    icon?: unknown;
    onClose(): void;
    onCloseAutoFocus?: unknown;
    pluginId: string;
    shouldBlockExternalEgress: boolean;
    skillName: string;
    title: unknown;
  }
  export const n: () => void;
  export const r: (contents?: string | null) => unknown;
  export const t: (props: PluginSkillPreviewProps) => unknown;
}

declare module "@rchunk/chatgpt-skill-source-dialog" {
  export interface ChatGptSkillSource {
    label: string;
    pluginId?: string;
    pluginName?: string;
    skillId?: string;
  }
  export interface ChatGptSkillSourceDialogProps {
    onClose(): void;
    shouldBlockExternalEgress: boolean;
    source: ChatGptSkillSource;
  }
  export const ChatGptSkillSourceDialog: (
    props: ChatGptSkillSourceDialogProps,
  ) => unknown;
}

declare module "@rchunk/gpt-about-dialog-core" {
  export const n: () => void;
  export const t: (props: {
    accountId?: string;
    gizmo: { id: string; short_url?: string | null };
    isOwnerAndWorkspaceAllowsSpecific: boolean;
    onClose(): void;
    onStartChat(selected: {
      gizmo: { id: string; short_url?: string | null };
    }): void;
  }) => unknown;
}

declare module "@rchunk/gpt-header-about-dialog" {
  export const GptHeaderAboutDialog: (props: {
    accountId?: string;
    onClose(): void;
    resource: { id: string; short_url?: string | null };
  }) => unknown;
}

declare module "@rchunk/python-analysis-details" {
  export interface PythonAnalysisItem extends Record<string, unknown> {
    id: string;
  }
  export interface PythonAnalysisDetailsProps {
    item: PythonAnalysisItem;
  }
  export const n: () => void;
  export const t: (props: PythonAnalysisDetailsProps) => unknown;
}

declare module "@rchunk/python-analysis-dialog" {
  export interface PythonAnalysisDialogProps {
    items: import("@rchunk/python-analysis-details").PythonAnalysisItem[];
    onClose(): void;
    onCloseAutoFocus?: (event: unknown) => void;
  }
  export const PythonAnalysisDialog: (
    props: PythonAnalysisDialogProps,
  ) => unknown;
}

declare module "@rchunk/report-dialog-core" {
  export interface ReportReason {
    id: string;
    [key: string]: unknown;
  }
  export interface ReportDialogProps extends Record<string, unknown> {
    loadReasons: () => Promise<ReportReason[]>;
    onClose: () => void;
    queryKey: readonly unknown[];
    submitReport: (input: {
      details: string;
      reason: ReportReason;
    }) => Promise<void>;
    title: unknown;
  }
  export const n: () => void;
  export const t: (props: ReportDialogProps) => unknown;
}

declare module "@rchunk/gpt-report-dialog" {
  export interface GptReportDialogProps extends Record<string, unknown> {
    accountId: string;
    resource: import("@rchunk/gpt-report-menu-item").GptResource & {
      gizmo: { display: { name: string }; id: string };
    };
    onClose?: () => void;
  }
  export const GptReportDialog: (props: GptReportDialogProps) => unknown;
}

declare module "@rchunk/codex-thread-report-dialog" {
  export type ReportEntityType =
    | "conversation"
    | "connector"
    | "project"
    | "share_link"
    | string;
  export interface AdReportAdapter {
    loadReasons(signal: AbortSignal): Promise<unknown>;
    queryKey?: readonly unknown[];
    submit(
      reason: { details?: string; id: string },
      additionalFields: unknown,
    ): Promise<void>;
    title?: unknown;
  }
  export interface CodexThreadReportDialogProps
    extends Record<string, unknown> {
    adReport?: AdReportAdapter;
    chatGptMessageId?: string;
    connectorId?: string;
    contentClassName?: string;
    onBackToFeedback?: () => void;
    onClose(): void;
    productArea?: string;
    reportEntityType: ReportEntityType;
    reportReasonsEntityType?: ReportEntityType;
    reportRequest?: (
      path: string,
      init?: Record<string, unknown>,
    ) => Promise<{ json(): Promise<unknown>; ok: boolean }>;
    successBody?: unknown;
    threadId: string;
    title?: unknown;
  }
  export const n: () => void;
  export const t: (props: CodexThreadReportDialogProps) => unknown;
}

declare module "@rchunk/chatgpt-project-report-dialog" {
  export interface ChatGptProject {
    gizmo: {
      display: { name: string };
      id: string;
    };
  }
  export interface ChatGptProjectReportDialogProps {
    accountId: string;
    onClose(): void;
    project: ChatGptProject;
  }
  export const ChatGptProjectReportDialog: (
    props: ChatGptProjectReportDialogProps,
  ) => unknown;
}

declare module "@rchunk/gpt-report-menu-item" {
  export interface GptResource extends Record<string, unknown> {
    gizmo: {
      id: string;
      share_recipient?: string | null;
      tags?: readonly string[];
    };
  }
  export interface GptReportMenuItemProps {
    resource: GptResource;
    onSelect?: () => void;
  }
  export const n: () => void;
  export const t: (props: GptReportMenuItemProps) => unknown;
}

declare module "@rchunk/file-already-exists-dialog" {
  export interface ProjectFileAlreadyExistsDialogProps {
    fileName: string;
    onClose(): void;
    onConfirm(): void;
  }
  export const ProjectFileAlreadyExistsDialog: (
    props: ProjectFileAlreadyExistsDialogProps,
  ) => unknown;
}

declare module "@rchunk/pending-edits-dialog" {
  export interface PendingEditsDialogProps {
    onCancel(): void;
    onConfirm(): void;
    open: boolean;
  }
  export const n: () => void;
  export const t: (props: PendingEditsDialogProps) => unknown;
}

declare module "@rchunk/settings-unsaved-changes-dialog" {
  export interface SettingsUnsavedChangesDialogProps {
    onClearPendingNavigation(): void;
    pendingNavigation?: (() => void) | null;
  }
  export const n: () => void;
  export const t: (props: SettingsUnsavedChangesDialogProps) => unknown;
}

declare module "@rchunk/chatgpt-saved-memory-source-delete-dialog" {
  export interface ChatGptSavedMemorySourceDeleteDialogProps {
    onClose(): void;
    onConfirm(): void;
    title: string;
  }
  export const ChatGptSavedMemorySourceDeleteDialog: (
    props: ChatGptSavedMemorySourceDeleteDialogProps,
  ) => unknown;
}

declare module "@rchunk/my-gpt-delete-dialog" {
  export const MyGptDeleteDialog: (...args: any[]) => any;
}

declare module "@rchunk/source-file-delete-dialog" {
  export interface ChatGptProjectFileDeleteDialogProps {
    fileId: string;
    onClose(): void;
    onDelete(): void;
    projectId: string;
    title: string;
  }
  export const ChatGptProjectFileDeleteDialog: (
    props: ChatGptProjectFileDeleteDialogProps,
  ) => unknown;
}

declare module "@rchunk/codex-thread-report-dialog-entry" {
  export const CodexThreadReportDialog: (
    props: import("@rchunk/codex-thread-report-dialog").CodexThreadReportDialogProps,
  ) => unknown;
}

declare module "@rchunk/trusted-contact-no-thanks-dialog" {
  export const TrustedContactNoThanksDialog: (
    props: import("@rchunk/app-initial").TrustedContactNoThanksDialogProps,
  ) => unknown;
}

declare module "@rchunk/external-link-confirmation-dialog" {
  export const ExternalLinkConfirmationDialog: (
    props: import("@rchunk/app-initial").ExternalLinkConfirmationDialogProps,
  ) => unknown;
}

declare module "@rchunk/mcp-app-follow-up-confirmation-dialog" {
  export const McpAppFollowUpConfirmationDialog: (
    props: import("@rchunk/app-initial").McpAppFollowUpConfirmationDialogProps,
  ) => unknown;
}

declare module "@rchunk/chatgpt-image-upload-reminder-dialog-core" {
  export interface ChatGptImageUploadReminderDialogProps {
    onAcknowledge(): void;
    overlayClassName?: string;
  }
  export const n: () => void;
  export const t: (
    props: ChatGptImageUploadReminderDialogProps,
  ) => unknown;
}

declare module "@rchunk/chatgpt-image-upload-reminder-dialog-entry" {
  export const ChatGptImageUploadReminderDialog: (
    props: import("@rchunk/chatgpt-image-upload-reminder-dialog-core").ChatGptImageUploadReminderDialogProps,
  ) => unknown;
}

declare module "@rchunk/shuffle" {
  export const t: <T>(
    items: ArrayLike<T> | Record<string, T> | null | undefined,
  ) => T[];
}

declare module "@rchunk/departments" {
  export interface DepartmentIdentity { accountId: string; userId: string }
  export interface DepartmentOnboarding extends Record<string, unknown> { departments: string[]; role: string }
  export interface DepartmentScope { currentIdentity?(): DepartmentIdentity | null; invalidate?(queryKey: readonly unknown[]): Promise<unknown> | unknown; setOnboardingData?(identity: DepartmentIdentity, data: DepartmentOnboarding): void }
  export const a: "oai/apps/hasSeenOnboarding";
  export const i: { getOptions(identity: DepartmentIdentity): Record<string, unknown> };
  export const n: () => void;
  export const o: (scope: DepartmentScope, identity: DepartmentIdentity, signal?: AbortSignal) => Promise<void>;
  export const r: (scope: DepartmentScope, identity: DepartmentIdentity, signal?: AbortSignal) => Promise<void>;
  export const s: (scope: DepartmentScope, identity: DepartmentIdentity, onboarding: DepartmentOnboarding, systemMessage?: Record<string, unknown> | null, signal?: AbortSignal) => Promise<void>;
  export const t: Record<string, string[]>;
}

declare module "@rchunk/ambient-suggestion-apps" {
  export const a: unknown;
  export const i: unknown;
  export const n: unknown;
  export const r: () => void;
  export const t: unknown;
}

declare module "@rchunk/new-chat-suggestion-source-debug-state" {
  export const a: unknown;
  export const c: () => void;
  export const d: unknown;
  export const f: unknown;
  export const i: unknown;
  export const l: unknown;
  export const n: unknown;
  export const o: unknown;
  export const p: unknown;
  export const r: unknown;
  export const s: unknown;
  export const t: () => void;
  export const u: unknown;
}

declare module "@rchunk/home-suggestion-surface" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/composer-banners" { export const ComposerBanners: unknown; }
declare module "@rchunk/usage" { export const n: (props: { canShowUsageBanners?: boolean; imageGenerationLimit?: boolean; modelName?: string; resetAt?: string | number | Date | null; showModelLimit?: boolean; showWorkspaceUsageLimit?: boolean; showUpsell?: boolean; onDismissImageGenerationLimit?(): void }) => unknown; export const t: () => void; }
declare module "@rchunk/task-announcement-candidates" {
  export interface TaskAnnouncementCandidatesProps {
    conversationId?: string | null;
    currentModel?: string | null;
    replacementModel?: string | null;
    suppressed?: boolean;
    turnId?: string | null;
    onDismiss?(): void;
    onSwitchModel?(model: string): Promise<unknown> | unknown;
  }
  export const TaskAnnouncementCandidates: (
    props?: TaskAnnouncementCandidatesProps,
  ) => unknown;
}
declare module "@rchunk/popup" {
  export interface AddressSuggestionPreview { selectionEnd: number; selectionStart: number; value: string }
  export interface AddressSuggestion { ariaLabel?: string; canBeDefault?: boolean; content?: unknown; deleteAction?: { label: string; run(): boolean }; id: string; isEmphasized?: boolean; isExistingDestination?: boolean; preview?: { inline?: AddressSuggestionPreview | null; selected?: AddressSuggestionPreview | null }; renderKey?: string; textMatch?: "exact" | "prefix" | "substring" }
  export interface AddressSuggestionResult { isRetained?: boolean; suggestions: AddressSuggestion[] }
  export interface AddressSuggestionQuery extends AddressSuggestionPreview { preventInlineAutocomplete?: boolean }
  export interface AddressSuggestionSource { getSuggestions(value: string): AddressSuggestionResult | null; id: string; start?(query: AddressSuggestionQuery, changed: () => void): void; stop?(reason: string, resetComposition: boolean): void; subscribe?(changed: () => void): (() => void) | void }
  export interface AddressSuggestionSnapshot { displayedSelectedIndex: number; isKeyboardSelection: boolean; isSelectedSuggestionMissing: boolean; preview: AddressSuggestionPreview | null; query: string | null; selectedIndex: number; selectedSuggestion: AddressSuggestion | null; suggestions: AddressSuggestion[] }
  export class r { subscribe(listener: () => void, sources?: AddressSuggestionSource[]): () => void; getSnapshot(sources?: AddressSuggestionSource[]): AddressSuggestionSnapshot; start(query: AddressSuggestionQuery, sources: AddressSuggestionSource[]): void; stop(reason: string, resetComposition: boolean): void; moveSelection(offset: number, sources?: AddressSuggestionSource[]): void; deleteSuggestion(suggestion: AddressSuggestion, sources?: AddressSuggestionSource[]): boolean; hasKeyboardSelection(): boolean; setComposing(value: boolean): void; setPreventInlineAutocompleteOnNextChange(value: boolean): void; shouldPreventInlineAutocompleteOnNextChange(): boolean; consumePreventInlineAutocompleteOnNextChange(): boolean; isAutocompleteSelection(value: string, selectionStart: number, selectionEnd: number, sources?: AddressSuggestionSource[]): boolean }
  export const i: () => void;
  export const n: () => void;
  export const t: (props: { label: string; listboxId: string; suggestions: AddressSuggestion[]; selectedIndex: number; onDelete?(suggestion: AddressSuggestion): void; onDeleteBlur?(target: EventTarget | null): void; onSelect(suggestion: AddressSuggestion): void }) => unknown;
}
declare module "@rchunk/browser-address-suggestion-overlay" { export const BrowserAddressSuggestionOverlay: unknown; }
declare module "@rchunk/home-beacon" {
  export interface BeaconMessageIdentity {
    conversationId: string;
    messageId: string;
    suppressLifecycle?: boolean;
  }
  export interface HomeBeaconRecord extends Record<string, unknown> {
    beacon_id: string;
    custom_fields?: {
      show_after_onboarding?: boolean;
      [key: string]: unknown;
    };
  }
  export interface HomeBeaconResult {
    accountId: string | null;
    beacon: HomeBeaconRecord | null;
    containerBeacon: HomeBeaconRecord | null;
    isEligible: boolean;
    isLoading: boolean;
    shouldSuppressVanillaPromos: boolean;
  }
  export const n: (
    scope: {
      get(signal: unknown): Set<string>;
      set(
        signal: unknown,
        update: (current: Set<string>) => Set<string>,
      ): void;
    },
    accountId: string,
    beacon: HomeBeaconRecord,
    message: BeaconMessageIdentity | null,
  ) => boolean;
  export const r: (
    product?: string,
    options?: { shouldSuppressFocusedModal?: () => boolean },
  ) => HomeBeaconResult;
  export const t: () => void;
}

declare module "@rchunk/home-beacon-finance" {
  export interface ConnectPersonalFinanceOptions {
    accountId: string;
    beacon: unknown;
    onConversationStarted(conversation: unknown): void;
    signal: AbortSignal;
    suppressAnalytics?: boolean;
  }
  export const connectPersonalFinanceFromHomeBeacon: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    options: ConnectPersonalFinanceOptions,
  ) => Promise<boolean>;
}

declare module "@rchunk/conversation-start" {
  export const n: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    input: {
      accountId: string;
      forceOnboarding: boolean;
      prompt: string;
      requireServerConversation: boolean;
      signal: AbortSignal;
      userCompletionMessages?: unknown;
    },
  ) => Promise<unknown>;
  export const t: () => void;
}

declare module "@rchunk/plaid-link" {
  export interface PlaidScope { queryClient?: unknown; startPlaid?(input: { accountId: string; linkId?: string; receivedRedirectUri?: string; returnTo: string; signal?: AbortSignal }): Promise<{ connected: boolean; publicToken?: string }> }
  export const i: (scope: PlaidScope, options: { accountId: string; linkToken: string; oauthStateId: string; signal?: AbortSignal }) => Promise<{ plaidErrorCode?: string; publicToken?: string; type: "completed" | "exited" }>;
  export const n: () => void;
  export const r: (
    scope: PlaidScope,
    options: {
      accountId: string;
      linkId?: string;
      receivedRedirectUri?: string;
      returnTo?: string;
      signal?: AbortSignal;
    },
  ) => Promise<boolean>;
  export const t: (accountId: string) => string;
}
declare module "@rchunk/catalog" { export interface ComposerTipContext { browserExtensionInstalled?: boolean; capabilities?: Iterable<string>; notificationOnboardingResolved?: boolean; notificationPermissionStatus?: string } export interface ComposerTip { action: { type: "navigate" | "open-notification-settings"; path?: string }; actionLabel: string; badgeLabel: string; content: string; id: string; isEligible(context: ComposerTipContext): boolean } export const n: () => void; export const t: (campaignId: string) => ComposerTip | null; }
declare module "@rchunk/composer-tip" { export const useComposerTip: unknown; }
declare module "@rchunk/codex-micro-mini-games" {
  export const a: (game: { game: string } | null) => Array<Record<string, unknown>> | null;
  export const c: Record<string, unknown>;
  export const d: (id: string, element: HTMLElement, onLastRemoved?: () => void) => () => void;
  export const i: (...arguments_: unknown[]) => Record<string, unknown>;
  export const l: (input: { act: number; key: string }) => boolean;
  export const n: import("@rchunk/app-shared").ScopedSignal<unknown, unknown>;
  export const o: (random?: () => number) => "asteroids" | "brick-breaker" | "snake";
  export const r: () => string | null;
  export const s: () => void;
  export const t: (scope: { set(signal: unknown, value: unknown): void }) => void;
  export const u: (game: { game?: string } | null, input: { act: number; key: string }) => boolean;
}
declare module "@rchunk/codex-micro-mini-game-composer" { export const CodexMicroMiniGameComposer: unknown; }
declare module "@rchunk/wheel-swipe-gesture" {
  export const n: () => void;
  export class t {
    activeSwipe: Record<string, unknown> | null;
    begin(event: { deltaY: number; timeStamp: number }, idleMs: number): void;
    isContinuation(event: { deltaY: number; timeStamp: number }): boolean;
  }
}
declare module "@rchunk/right-panel-composer-overlay" { export const n: () => void; export const t: unknown; }

declare module "@rchunk/new-chat-page-suggestions-eligibility" {
  export const a: () => void;
  export const i: unknown;
  export const n: (hostId: string) => readonly string[];
  export const o: unknown;
  export const r: unknown;
  export const t: unknown;
}

declare module "@rchunk/option-carousel" {
  export interface OptionCarouselProps {
    ariaInvalid?: boolean;
    ariaLabel?: string;
    backLabel: string;
    children?: unknown;
    forwardLabel: string;
    header?: unknown;
    layout?: "form" | "gallery";
    role?: string;
    shouldUseReducedMotion?: boolean;
  }
  export const n: () => void;
  export const t: (props: OptionCarouselProps) => unknown;
}

declare module "@rchunk/recent-uploads" {
  export const _any: any;
}

declare module "@rchunk/chatgpt-image-home" {
  export const _any: any;
}

declare module "@rchunk/image-suggestions-core" {
  export const t: unknown;
}

declare module "@rchunk/browser-skills-state" {
  export interface BrowserSkill {
    creator_id?: string | null;
    display_name?: string | null;
    enabled?: boolean;
    id: string;
    name?: string;
    permissions?: { can_read?: boolean; can_write?: boolean };
    safety_check_status?: string | null;
    safety_scan?: { risk_score?: number | null } | null;
    surfaces?: string[] | null;
    updated_at?: string;
    [key: string]: unknown;
  }
  export interface SafetySettings { blockedScore: number; enabledFrom: string; warningScore: number; }
  export const _: (skill: BrowserSkill) => string;
  export const a: import("@rchunk/app-shared").ScopedDerivedSignal<unknown, SafetySettings>;
  export const b: (skill: BrowserSkill, surface: string) => boolean;
  export const c: import("@rchunk/app-shared").ScopedDerivedSignal<unknown, boolean>;
  export const d: import("@rchunk/app-shared").ScopedDerivedSignal<unknown, { accountId: string; isWorkspace: boolean; userId: string } | null>;
  export const f: import("@rchunk/app-shared").ScopedDerivedSignal<unknown, boolean>;
  export const g: (skill: BrowserSkill, enabled: boolean) => boolean;
  export const h: (skill: BrowserSkill, userId: string) => boolean;
  export const i: unknown;
  export const l: import("@rchunk/app-shared").ScopedDerivedSignal<unknown, boolean>;
  export const m: string;
  export const n: () => void;
  export const o: unknown;
  export const p: import("@rchunk/app-shared").ScopedDerivedSignal<unknown, { enableWorkspace: boolean; individuals: boolean; workspace: boolean }>;
  export const r: (scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>, skill: BrowserSkill, enabled: boolean) => Promise<boolean>;
  export const s: import("@rchunk/app-shared").ScopedDerivedSignal<unknown, boolean | null>;
  export const t: (scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>, skill: BrowserSkill) => Promise<void>;
  export const u: import("@rchunk/app-shared").ScopedQueryFamily<Record<string, unknown>, string, BrowserSkill[]>;
  export const v: (skill: BrowserSkill, settings: SafetySettings) => "blocked" | "needsReview" | null;
  export const y: () => void;
}

declare module "@rchunk/skill-icon-source" {
  export const a: () => void;
  export const i: (skill: { icon_small?: string | null }) => string | null;
  export const n: (skill: Record<string, unknown>, dark: boolean) => string;
  export const o: (skill: Record<string, unknown>, search: string) => boolean;
  export const r: () => void;
  export const s: <T extends { id: string; name: string; updated_at: string }>(skills: T[]) => T[];
  export const t: (skill: Record<string, unknown>, dark: boolean) => string;
}

declare module "@rchunk/text-bubble-figure-light" {
  export const E: string; export const F: string; export const G: string;
  export const L: string; export const N: string; export const O: string;
  export const S: string; export const U: string; export const V: string;
  export const b: string; export const c: string; export const f: string;
  export const g: string; export const i: string; export const j: string;
  export const k: string; export const m: string; export const n: string;
  export const o: string; export const q: string; export const u: string;
  export const v: string; export const w: string; export const z: string;
}

declare module "@rchunk/browser-skills-composer" {
  export const BrowserSkillsComposer: unknown;
}

declare module "@rchunk/use-chatgpt-composer-controller" {
  export const n: unknown;
  export const t: () => void;
}

declare module "@rchunk/primary-composer-at-mention-list" {
  export const PrimaryComposerAtMentionList: unknown;
}

declare module "@rchunk/values" {
  export const n: <T>(array: T[], size?: number) => T[];
  export const t: <T>(
    value: Record<string, T> | null | undefined,
  ) => T[];
}

declare module "@rchunk/followup-suggestions" {
  export const SketchHomeSuggestions: unknown;
}

declare module "@rchunk/sketch-composer-state" {
  export const createSketchComposerState: unknown;
}

declare module "@rchunk/composer-project-picker-content" {
  export const ComposerProjectPickerContent: unknown;
}

declare module "@rchunk/composer-work-home-plugins-control" {
  export const ComposerWorkHomePluginsControl: unknown;
}

declare module "@rchunk/composer-provider" {
  export const a: unknown;
  export const i: () => void;
  export const n: () => void;
  export const o: () => void;
  export const r: unknown;
  export const t: unknown;
}

declare module "@rchunk/composer-action-bar-run-location-dropdown" {
  export const ComposerActionBarRunLocationDropdown: unknown;
}

declare module "@rchunk/home-suggestion-list" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/home-composer-announcement-candidates" {
  export interface HomeComposerAnnouncementCandidatesProps {
    beaconProduct?: "chatgpt" | "work_tab";
    entryPoint: string;
    renderCandidates?: (
      candidates: import("@rchunk/composer-announcement-slot").ComposerAnnouncementCandidate[],
    ) => unknown;
    shouldHideOnboardingPromos: boolean;
  }
  export const HomeComposerAnnouncementCandidates: (
    props: HomeComposerAnnouncementCandidatesProps,
  ) => unknown;
}
declare module "@rchunk/announcement-entry-points" {
  export interface CandidateState {
    dismiss(): void;
    isEligible: boolean;
    isLoading: boolean;
  }
  export const _: () => void;
  export const a: () => void;
  export const c: () => void;
  export const d: () => void;
  export const f: (options?: { enabled?: boolean }) => CandidateState & {
    markShown(): void;
    replay(): void;
  };
  export const g: (
    intervals: readonly { endMs: number; startMs: number }[],
    nowMs?: number,
  ) => boolean;
  export const h: (
    histories: readonly {
      completedAtMs: number | string;
      successes: readonly unknown[];
    }[],
    status: { latestImportedAtMs?: number | null },
  ) => number | null;
  export const i: (options?: { enabled?: boolean }) => CandidateState & {
    openGiftCredits(): void;
  };
  export const l: () => void;
  export const m: () => void;
  export const n: () => void;
  export const o: (options?: { enabled?: boolean }) => CandidateState & {
    markShown(): void;
    openImport(): void;
    providerId: null;
  };
  export const p: (props: Record<string, unknown>) => unknown;
  export const r: () => void;
  export const s: (props: Record<string, unknown>) => unknown;
  export const t: (props?: Record<string, unknown>) => unknown;
  export const u: (scope: unknown) => Promise<void>;
  export const v: (props: Record<string, unknown>) => unknown;
  export const y: () => void;
}

declare module "@rchunk/task-announcement-state";
declare module "@rchunk/entry-point-availability";
declare module "@rchunk/computer-history-plugin-icon" {
  export const n: () => void;
  export const t: string;
}
declare module "@rchunk/run-external-agent-import-command" {
  export const runExternalAgentImportCommand: (
    scope: unknown,
    source: "home_beacon",
  ) => Promise<unknown>;
}
declare module "@rchunk/worktree-onboarding-banner-controller" {
  export const WorktreeOnboardingBannerController: () => unknown;
}

declare module "@rchunk/thread-scroll-controller-context-value" {
  export const n: () => void;
  export const r: () => unknown;
  export const t: unknown;
}

declare module "@rchunk/composer-browser-skills-state" {
  export const r: any;
  export const t: () => void;
}

declare module "@rchunk/home-task-suggestions-core" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/home-starter-prompts" {
  export const _any: any;
}

declare module "@rchunk/home-composer-mode-toggle-core" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/browser-composer-disclaimer-core" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/sketch-composer-host-core" {
  export const n: unknown;
  export const r: () => void;
  export const t: unknown;
}

declare module "@rchunk/drawing-size-slider" {
  export const n: () => void;
  export const t: (props: { "aria-label": string; className?: string; disabled?: boolean; forceExpanded?: boolean; max: number; min: number; name?: string; onInteractionEnd?(): void; onInteractionStart?(): void; onValueChange(value: number): void; preserveTextFocus?: boolean; title?: string; value: number }) => unknown;
}

declare module "@rchunk/sketch" {
  export const l: unknown;
  export const n: (options: unknown) => any;
  export const o: () => void;
  export const t: () => void;
}

declare module "@rchunk/right-panel-composer-overlay-alignment" {
  export const n: unknown;
  export const r: unknown;
  export const t: () => void;
}

declare module "@rchunk/composer-overlay" {
  export const HomeComposerOverlay: unknown;
}

declare module "@rchunk/above-composer-fixed-content-surface" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/first-app-connect-ambient-suggestions" {
  export const n: unknown;
  export const t: () => void;
}

declare module "@rchunk/home-suggestion-staggered-item" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/home-artifact-template-card" {
  export interface ArtifactSkill extends Record<string, unknown> {
    description?: unknown;
    name?: string;
    path: string;
    templateId?: string | null;
    title?: string;
  }
  export interface HomeArtifactTemplateCardProps
    extends Record<string, unknown> {
    deleteDisabled?: boolean;
    hostId: string;
    isGoogleDriveGallery?: boolean;
    isSelected?: boolean;
    onBeforeView?(): void;
    onDelete?(): void;
    onEdit?(): void;
    onUse(): void;
    showAddOverlay?: boolean;
    skill: ArtifactSkill;
    sourceUrl?: string | null;
    templateKind: string;
    useLabel?: string;
  }
  export const n: () => void;
  export const t: (props: HomeArtifactTemplateCardProps) => unknown;
}

declare module "@rchunk/home-artifact-templates" {
  export interface ArtifactTemplatePickerProps
    extends Record<string, unknown> {
    canUseTemplateAttachments?: boolean;
    onAddFileAssetAttachment?: (input: {
      assetUrl: string;
      label: string;
    }) => Promise<{ path: string } | null | undefined>;
    placement?: "top" | "bottom" | string;
  }
  export const ArtifactTemplatePicker: (
    props: ArtifactTemplatePickerProps,
  ) => unknown;
}

declare module "@rchunk/queries" {
  export const i: () => void;
  /** subscriptionAccountQueryOptions（账户与订阅权益查询）。 */
  export const n: <QueryData = unknown>(
    accountId: string,
  ) => import("@rchunk/app-shared").UseQueryOptions<QueryData>;
  export const r: unknown;
  export const t: unknown;
}

declare module "@rchunk/pricing-promotions" {
  export interface PromotionDuration {
    num_periods: number;
    period: "hour" | "month" | "year";
  }
  export interface PromotionMetadata {
    credit_grant?: { amount?: number | string | null };
    discount: { amount?: number; percentage?: number };
    duration?: PromotionDuration;
    id?: string;
    metadata?: { plan_name?: string };
    no_auto_renewal_at_discount_end?: boolean;
    plan_type_change?: string;
    schedule?: {
      period?: "hour" | "month" | "year";
      start_after_num_periods?: number;
    };
    summary?: string;
  }
  export const a: (
    plan: "go" | "plus",
    currentPlan: string,
    promotion?: PromotionMetadata | null,
  ) => PromotionMetadata | null;
  export const c: (input: {
    eligiblePromoCampaignId?: string;
    plan: "go" | "plus";
    promoCampaignId?: string;
    suppressGoFallback?: boolean;
  }) => string | undefined;
  export const d: (input: {
    daysUntilPlanRenews?: number;
    daysUntilSubscriptionCancelAt?: number;
  }) => Date | null;
  export const f: () => void;
  export const h: Record<
    string,
    import("@rchunk/app-shared").MessageDescriptor
  >;
  export const i: (input: {
    eligibleGoPromoCampaignId?: string;
    eligiblePlusPromoCampaignId?: string;
    promoCampaignHandoffId?: string;
    requestedPromoCampaignId?: string | null;
    shouldAutoApplyPlusOneMonthFreePromo?: boolean;
  }) => string | undefined;
  export const l: (input: Record<string, unknown>) => Record<string, unknown>;
  export const m: () => void;
  export const n: "plus-1-month-free-for-go";
  export const o: (
    useConfiguredCopy: boolean,
    copy?: string,
  ) => import("@rchunk/app-shared").MessageDescriptor;
  export const p: (promotion?: PromotionMetadata | null) => boolean;
  export const r: "plus-1-month-free";
  export const s: (
    plan: "go" | "plus",
    campaignId: string | undefined,
    intl: import("@rchunk/app-shared").IntlShape,
  ) => (PromotionMetadata & Record<string, unknown>) | null;
  export const t: "go-1-month-free";
  export const u: (
    intl: import("@rchunk/app-shared").IntlShape,
    duration: PromotionDuration,
  ) => string | readonly unknown[];
}

declare module "@rchunk/plan-names" {
  export interface PlanNameInput {
    initialPlanType?: string;
    planType: string;
    updatedPlanType?: string;
  }
  export const n: (input: PlanNameInput) => string | null;
  export const r: () => void;
  export const t: Record<
    "free" | "go" | "plus" | "pro" | "team",
    import("@rchunk/app-shared").MessageDescriptor
  >;
}

declare module "@rchunk/pricing" {
  export interface FormattedPrice {
    currencyCodeLabel: string | null;
    formatted: string;
    parts: Intl.NumberFormatPart[];
  }
  export interface FormatPriceInput {
    amount?: number | null;
    currencyCode: string;
    intl: {
      formatNumber(value: number, options: Intl.NumberFormatOptions): string;
      formatNumberToParts(
        value: number,
        options: Intl.NumberFormatOptions,
      ): Intl.NumberFormatPart[];
    };
    minorUnitExponent?: number;
  }
  export const n: (input: FormatPriceInput) => FormattedPrice | null;
  export const r: () => void;
  export const t: (input: FormatPriceInput) => string | null;
}

declare module "@rchunk/offer-notice" {
  export const i: () => void;
  export const n: (props: {
    billingInterval: "month" | "year";
    currencySign: string;
    currentPlanName?: string | null;
    formattedDiscountedCost: string;
    fullPriceResumeDateFormatted: string;
    planCost: string;
    planName: string;
    renewalDateFormatted: string;
  }) => unknown;
  export const r: (props: {
    currencyCode?: string;
    currencySign?: string;
    currentPlanName: string;
    planCost?: string | null;
    planName: string;
    renewalDateFormatted?: string | null;
    useTreatmentContentStyle?: boolean;
  }) => unknown;
  export const t: (props: {
    closeLabel: unknown;
    isDarkMode?: boolean;
    message: unknown;
    onClose(): void;
    open: boolean;
    portalClassName?: string;
    retry?: { label: unknown; onClick(): void };
    testId?: string;
    title: unknown;
  }) => unknown;
}

declare module "@rchunk/stripe-payment-confirmation" {
  export type StripeFailureReason =
    | "authentication_failed"
    | "expired_card"
    | "incorrect_cvc"
    | "incorrect_number"
    | "insufficient_funds"
    | "invalid_cvc"
    | "missing_payment_method"
    | "other"
    | "payment_method_declined"
    | "payment_method_unavailable";
  export interface StripeError {
    code?: string | null;
    decline_code?: string | null;
    message?: string;
    reason?: string;
  }
  export interface StripePaymentIntent {
    last_payment_error?: StripeError | null;
    status: string;
  }
  export interface StripeConfirmationResult {
    error?: StripeError;
    paymentIntent?: StripePaymentIntent;
  }
  export interface StripeSetupResult {
    error?: StripeError;
    setupIntent?: { id: string; status: string };
  }
  export const a: (error: StripeError) => StripeFailureReason;
  export const i: "lock_timeout";
  export const n: (
    paymentIntent: StripePaymentIntent,
  ) => StripeFailureReason | null;
  export const o: () => void;
  export const r: () => void;
  export const t: (input: {
    confirmPaymentIntent: () => Promise<StripeConfirmationResult>;
    shouldRetry: () => boolean;
  }) => Promise<StripeConfirmationResult>;
}

declare module "@rchunk/wallet-onboarding-announcement-modal" {
  export const WalletOnboardingAnnouncementModal: (props: {
    animationMode?: "animate" | "fanned" | "tucked";
    animationSpeed?: "normal" | "slow";
    dismissAnnouncement(): void;
    footer?: unknown;
    isSettingUpWallet?: boolean;
    onSetUpWallet(): void;
  }) => unknown;
}

declare module "@rchunk/wallet-onboarding-announcement-content" {
  export interface WalletEnrollmentView {
    hostId: string;
    server: unknown;
    serverTools: Array<{ name: string }>;
    tool: { name: string };
  }
  export const WalletOnboardingAnnouncement: (props: {
    dismissAnnouncement(): void;
    enrollmentView: WalletEnrollmentView;
  }) => unknown;
}

declare module "@rchunk/realtime-voice-home-announcement" {
  export interface RealtimeVoiceHomeAnnouncementContentProps
    extends Record<string, unknown> {
    entryPoint: "chatgpt" | "codex" | string;
    onDismiss(): void;
    onStart(): void;
    orbSrc?: string;
  }
  export const RealtimeVoiceHomeAnnouncementContent: (
    props: RealtimeVoiceHomeAnnouncementContentProps,
  ) => unknown;
}

declare module "@rchunk/subscription-onboarding-content" {
  export interface StudentAccount {
    accountUserId?: string;
    discount?: {
      discount_expires_at?: string | null;
      promo_campaign_id?: string;
    } | null;
    id?: string;
    isPaidPlus?: boolean;
  }
  export interface TourAction {
    action: "finish" | "try_feature";
    pageId: string;
  }
  export interface TourProps extends Record<string, unknown> {
    Frame: unknown;
    featurePageIds?: string[];
    onAction(event: TourAction): void;
    onOpenChange(open: boolean): void;
    open: boolean;
  }
  export interface CheckoutThemeFrameProps extends Record<string, unknown> {
    className?: string;
    isDarkMode?: boolean;
  }
  export const _: () => void;
  export const a: (account: StudentAccount) => void;
  export const c: () => void;
  export const d: (props: CheckoutThemeFrameProps) => unknown;
  export const f: () => void;
  export const g: string[];
  export const h: string[];
  export const i: () => void;
  export const l: (props: TourProps) => unknown;
  export const m: () => void;
  export const n: (account: StudentAccount | null) => boolean;
  export const o: (account: StudentAccount) => boolean;
  export const p: (props: TourProps) => unknown;
  export const r: (account: StudentAccount) => boolean;
  export const s: (props: TourProps) => unknown;
  export const t: () => void;
  export const u: () => void;
  export const v: (props: TourProps) => unknown;
  export const y: () => void;
}

declare module "@rchunk/subscription-onboarding" {
  export interface OnboardingAction extends Record<string, unknown> {
    action?: string;
    pageId: string;
  }
  export interface HomeCandidate {
    content: unknown;
    id: "subscription-onboarding";
    isEligible: boolean;
    isLoading: boolean;
    trackVisibility: boolean;
  }
  export type RenderCandidates = (candidates: HomeCandidate[]) => unknown;
  export interface SubscriptionOnboardingProps
    extends Record<string, unknown> {
    canCreateImage?: boolean;
    canPresent: boolean;
    canStartConversation: boolean;
    homeCandidates?: (renderCandidates: RenderCandidates) => unknown;
    onAction?(event: OnboardingAction): void;
    onClosed?(): void;
    onCreateImage?(): void;
    onInteraction?(event: OnboardingAction): void;
    onOpenFileDialog?(): void;
    onPresented?(): void;
    onSelectIntelligence?(level: "pro" | "standard"): void;
    onStartConversation?(
      initialStage: string,
      onComplete: () => void,
    ): Promise<unknown> | unknown;
    onStartSite?(): void;
    onStartVoice?(): void;
    renderCandidates: RenderCandidates;
  }
  export const SubscriptionOnboarding: (
    props: SubscriptionOnboardingProps,
  ) => unknown;
}

declare module "@rchunk/subscription-update-dialog" {
  export interface PaymentMethod {
    card_brand?: string | null;
    card_last4?: string | null;
  }
  export interface SubscriptionPreview {
    amount_due: {
      amount: number;
      amount_excluding_tax: number;
      tax_amount: number;
    };
    currency: string;
    positive_line_item_total: number;
    renewal_date?: string | number | Date | null;
  }
  export interface PricingInfo {
    currencyCode: string;
    minorUnitExponent: number;
    monthlyAmounts: Record<string, number>;
  }
  export interface SavedCardSubscriptionUpdate {
    fullyCoveredByWallet?: boolean;
    kind: "saved_card_upgrade";
    minorUnitExponent: number;
    paymentMethod?: PaymentMethod;
    paymentMethodLabel?: string;
    preview: SubscriptionPreview;
    promotionDisclaimer?: unknown;
    updatedPlan: import("@rchunk/subscription-update-plan").SubscriptionPlanSlug;
    upgrade?: { promoCampaign?: string | null };
  }
  export interface ScheduledSubscriptionUpdate {
    currentPlan?: string;
    kind: "scheduled_downgrade";
    preview: Pick<SubscriptionPreview, "renewal_date">;
    updatedPlan: import("@rchunk/subscription-update-plan").SubscriptionPlanSlug;
  }
  export interface RenewalSubscriptionUpdate {
    renewal: Record<string, unknown>;
  }
  export interface SubscriptionUpdateDialogProps {
    disableConfirm?: boolean;
    error?: unknown;
    isUpdating?: boolean;
    onBack?(): void;
    onCancel(): void;
    onConfirm(): void;
    onGoToWeb?(): void;
    onOpenChange(open: boolean): void;
    onShown?(): void;
    pricingInfo?: PricingInfo | null;
    scheduledPrice?: import("@rchunk/pricing").FormattedPrice | null;
    subscriptionUpdate:
      | RenewalSubscriptionUpdate
      | SavedCardSubscriptionUpdate
      | ScheduledSubscriptionUpdate;
  }
  export const n: () => void;
  export const t: (props: SubscriptionUpdateDialogProps) => unknown;
}

declare module "@rchunk/codex-home-announcements-current" {
  export const i: () => void;
  export const n: (props: {
    entryPoint: string;
    hasSeparateCodexAnnouncements?: boolean;
    homeComposerMode: "chat" | "work" | string;
    isLocalModeRemote?: boolean;
    selectedCustomGptId?: string | null;
  }) => unknown;
  export const r: () => void;
  export const t: (props: {
    homeRunLocationRemoteProject?: unknown;
    includeGitCheckoutWarning?: boolean;
  }) => unknown;
}

declare module "@rchunk/codex-home-announcements-current-entry" {
  export const CodexHomeAnnouncements: import("@rchunk/codex-home-announcements-current")["t"];
  export const HomeComposerAnnouncements: import("@rchunk/codex-home-announcements-current")["n"];
}

declare module "@rchunk/codex-home-announcements" {
  export interface AnnouncementCandidate {
    content: unknown;
    id?: string;
    isEligible: boolean;
    isLoading: boolean;
    pageContextClaim?: unknown;
    trackVisibility?: boolean;
  }
  export interface HomeAnnouncementCompositionProps {
    entries: AnnouncementCandidate[];
    fallbackContent?: unknown;
    product?: string;
    renderCandidates?: (candidates: AnnouncementCandidate[]) => unknown;
    shouldHideOnboardingPromos: boolean;
  }
  export interface HomeComposerAnnouncementsProps {
    entryPoint: string;
    homeComposerMode: "chat" | "work" | string;
    renderCandidates?: (candidates: AnnouncementCandidate[]) => unknown;
    selectedCustomGptId?: string | null;
  }
  export interface CodexHomeAnnouncementsProps {
    composerEntries?: AnnouncementCandidate[];
    fallbackContent?: unknown;
    homeRunLocationRemoteProject?: unknown;
    includeGitCheckoutWarning?: boolean;
    renderCandidates?: (candidates: AnnouncementCandidate[]) => unknown;
    shouldHideOnboardingPromos: boolean;
  }
  export const a: () => void;
  export const i: (props: HomeAnnouncementCompositionProps) => unknown;
  export const n: (props: HomeComposerAnnouncementsProps) => unknown;
  export const o: () => void;
  export const r: () => void;
  export const t: (props: CodexHomeAnnouncementsProps) => unknown;
}

declare module "@rchunk/codex-home-announcements-entry" {
  export const HomeComposerAnnouncements: unknown;
}

declare module "@rchunk/workspace-renewal-payment" {
  export interface WorkspaceRenewalPaymentCandidate {
    content: unknown;
    gracePeriodEnd: string | null;
    id: "workspace-renewal-payment";
    isEligible: boolean;
    isLoading: boolean;
  }
  export const n: () => WorkspaceRenewalPaymentCandidate;
  export const t: () => void;
}

declare module "@rchunk/workspace-renewal-state" {
  export interface WorkspaceRenewalSubscription extends Record<string, unknown> {
    became_delinquent_timestamp?: string | null;
    grace_period_end_timestamp?: string | null;
    is_delinquent?: boolean;
    will_renew?: boolean;
  }
  export const n: () => void;
  export const r: import("@rchunk/app-shared").ScopedQueryFamily<
    Record<string, unknown>,
    string | null,
    WorkspaceRenewalSubscription
  >;
  export const t: (
    subscription: WorkspaceRenewalSubscription | null | undefined,
    now: Date,
  ) => string | null;
}

declare module "@rchunk/home-announcement-state" {
  export interface AnnouncementEligibility {
    isEligible: boolean;
    isLoading: boolean;
  }
  export interface RateLimitResetEligibility extends AnnouncementEligibility {
    availableCount: number;
    dismiss(): void;
  }
  export interface MultiAgentHomeAnnouncementProps {
    onTryNow?: () => void;
  }
  export interface RateLimitResetHomeAnnouncementProps {
    availableCount: number;
    onDismiss(): void;
  }
  export const a: () => void;
  export const c: () => void;
  export const d: () => void;
  export const f: () => void;
  export const i: () => void;
  export const l: () => void;
  export const n: () => RateLimitResetEligibility;
  export const o: () => void;
  export const r: (props: RateLimitResetHomeAnnouncementProps) => unknown;
  export const s: (props: MultiAgentHomeAnnouncementProps) => unknown;
  export const t: () => void;
  export const u: () => AnnouncementEligibility;
}

declare module "@rchunk/home-announcement-slot" {
  export interface HomeAnnouncementEntry {
    content?: unknown;
    isEligible: boolean;
    isLoading: boolean;
    pageContextClaim?: unknown;
  }
  export interface HomeAnnouncementSlotProps {
    entries: HomeAnnouncementEntry[];
    trackVisibility?: boolean;
  }
  export const n: () => void;
  export const t: (props: HomeAnnouncementSlotProps) => unknown;
}

declare module "@rchunk/announcement-modal-source-bridge" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/banner" {
  export const n: () => void;
  export const t: (props: { gizmoId: string }) => unknown;
}

declare module "@rchunk/gpt-plugin-migration-banner-content" {
  export const GptPluginMigrationBannerContent:
    | ((props: { gizmoId: string }) => unknown)
    | null;
}

declare module "@rchunk/chat-choice-view" {
  export type ChatChoiceAccessState =
    | "allowed"
    | "denied"
    | "error"
    | "pending";
  export interface ChatChoiceViewProps {
    accessState: ChatChoiceAccessState;
    gptName: string;
    onKeepUsingGpt?: () => void;
    onRetry?: () => void;
    onUsePlugin(): void;
  }
  export const n: () => void;
  export const t: (props: ChatChoiceViewProps) => unknown;
}

declare module "@rchunk/chatgpt-onboarding-dialog" {
  export interface ChatGptOnboardingDialogProps {
    country: string;
    onContinue(): void;
    onShown(): void;
  }
  export const ChatGptOnboardingDialog: (
    props: ChatGptOnboardingDialogProps,
  ) => unknown;
}

declare module "@rchunk/gpt-plugin-migration-dialog" {
  export const GptPluginMigrationDialog: import("@rchunk/app-shared").LazyComponent<{
    resource: import("@rchunk/app-initial").GptResource;
  } & Record<string, unknown>>;
}

declare module "@rchunk/plan-downgrade-dialog-core" {
  export interface PlanDowngradeDialogProps extends Record<string, unknown> {
    onClose(): void;
  }
  export const n: () => void;
  export const t: (props: PlanDowngradeDialogProps) => unknown;
}

declare module "@rchunk/plugin-share-dialog-core" {
  export interface PluginShareDialogProps extends Record<string, unknown> {
    onClose(): void;
  }
  export const n: () => void;
  export const t: (props: PluginShareDialogProps) => unknown;
}

declare module "@rchunk/scheduled-shared-task-dialog-core" {
  export interface ScheduledSharedTaskDialogProps extends Record<string, unknown> {
    onClose(): void;
  }
  export const n: () => void;
  export const t: (props: ScheduledSharedTaskDialogProps) => unknown;
}

declare module "@rchunk/mcp-extension-quick-action-dialog-core" {
  export interface McpExtensionQuickActionDialogProps
    extends Record<string, unknown> {
    onClose(): void;
  }
  export const n: () => void;
  export const t: (props: McpExtensionQuickActionDialogProps) => unknown;
}

declare module "@rchunk/ecosystem-widget-queries" {
  export const n: () => void;
  export const t: (input: Record<string, unknown>) => Record<string, unknown>;
}
declare module "@rchunk/connect-plugins-submenu-item" {
  export const n: () => void;
  export const t: (props: {
    connectedCount?: number;
    disabled?: boolean;
    onConnect(): void;
  }) => unknown;
}
declare module "@rchunk/use-search-plugins" {
  export interface SearchablePlugin { id: string; name: string; description?: string; }
  export const n: () => void;
  export const t: (plugins: readonly SearchablePlugin[], query: string) => SearchablePlugin[];
}
declare module "@rchunk/plugin-skill-queries" {
  export const a: (pluginId: string, skillName: string) => Record<string, unknown>;
  export const i: () => void;
  export const n: (connector: Record<string, unknown>) => string | null;
  export const r: (pluginId: string) => Record<string, unknown>;
  export const t: (pluginId: string, skillName: string) => Record<string, unknown>;
}
declare module "@rchunk/canonical-plugin-query" {
  export const n: () => void;
  export const t: (appId: string, accountId: string | null) => Record<string, unknown>;
}
declare module "@rchunk/plugin-picker-menu-content" {
  export const a: (plugins: readonly Record<string, unknown>[]) => string[];
  export const i: () => void;
  export const n: (props: Record<string, unknown>) => unknown;
  export const o: (plugins: readonly Record<string, unknown>[], id: string) => Record<string, unknown>[];
  export const r: (plugins: readonly Record<string, unknown>[]) => string[];
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/gpt-plugin-migration-failure" {
  export interface MigrationFailedFile extends Record<string, unknown> {
    file_id?: string;
    message?: string;
    type: "knowledge_file" | "profile_picture" | string;
  }
  export interface MigrationIssue extends Record<string, unknown> {
    message?: string;
    resource: { id?: string; name?: string; type: string };
  }
  export interface MigrationUploadedFile extends Record<string, unknown> {
    file_id?: string;
    file_response_type?: string;
    name?: string;
  }
  export interface MigrationFailureValue {
    failedFiles: MigrationFailedFile[];
  }
  export const i: import("@rchunk/app-shared").ScopedSignalFamily<
    Record<string, unknown>,
    string,
    MigrationFailureValue | null
  >;
  export const n: () => void;
  export const r: () => void;
  export const t: (props: {
    failedFiles: MigrationFailedFile[];
    files?: MigrationUploadedFile[];
    issues?: MigrationIssue[];
    migrationSucceeded: boolean;
  }) => unknown;
}

declare module "@rchunk/gpt-management-url" {
  export const n: () => void;
  export const t: (path: string) => string;
}

declare module "@rchunk/automation-delete-confirmation-dialog" {
  export interface AutomationDeleteConfirmationDialogProps {
    isPending: boolean;
    name: string;
    onCancel(): void;
    onConfirm(): void;
    open: boolean;
  }
  export const n: () => void;
  export const t: (
    props: AutomationDeleteConfirmationDialogProps,
  ) => unknown;
}

declare module "@rchunk/delete-archived-chats-dialog" {
  export type DeleteArchivedChatsState =
    | { kind: "all"; threads: readonly unknown[] }
    | { kind: "project"; threads: readonly unknown[] }
    | { kind: "single"; threads: readonly unknown[] };
  export interface DeleteArchivedChatsDialogProps {
    isDeleting?: boolean;
    onConfirm(): void;
    onOpenChange(open: boolean): void;
    state: DeleteArchivedChatsState | null;
  }
  export const n: () => void;
  export const t: (props: DeleteArchivedChatsDialogProps) => unknown;
}

declare module "@rchunk/migrated-plugin-access" {
  export const a: () => void;
  export const i: (
    account: import("@rchunk/app-initial").Account | null | undefined,
    workspaceGate: boolean,
    permissions?: string[],
  ) => boolean;
  export const n: import("@rchunk/app-shared").ScopedQueryFamily<
    Record<string, unknown>,
    string,
    boolean
  >;
  export const o: (input: {
    resource: import("@rchunk/app-initial").GptResource;
    account: import("@rchunk/app-initial").Account | null;
    accountId: string | null;
    permissions?: string[];
  }) => boolean;
  export const r: (input: {
    resource: import("@rchunk/app-initial").GptResource;
    account: import("@rchunk/app-initial").Account | null;
    accountId: string | null;
    userId: string | null;
    enabled: boolean;
    allowMigrated?: boolean;
  }) => boolean;
  export const t: () => void;
}

declare module "@rchunk/gpt-plugin-migration-notices" {
  export interface MigrationNoticeProps {
    onDismiss?: () => void;
    onMigrate?: () => void;
    surface: string;
  }
  export interface RetirementNoticeProps {
    actionPlacement?: "inline" | "below";
    currentGpt?: boolean;
    onExplore?: (event: unknown) => void;
  }
  export interface WorkspacePluginsBlockedNoticeProps {
    deadline?: number;
    onKeepUsingGpt?: () => void;
    surface: "directory" | "gpt" | "migrated";
  }
  export const i: () => void;
  export const n: (props: MigrationNoticeProps) => unknown;
  export const r: (props: RetirementNoticeProps) => unknown;
  export const t: (props: WorkspacePluginsBlockedNoticeProps) => unknown;
}

declare module "@rchunk/migrated-plugin-notice" {
  export type MigratedPluginPresentation = "notice" | "row";
  export interface MigratedPluginNoticeProps {
    gptName?: string;
    onClose?: () => void;
    pluginId: string;
    presentation?: MigratedPluginPresentation;
  }
  export const n: (props: {
    onOpen(): void;
    presentation?: MigratedPluginPresentation;
  }) => unknown;
  export const r: () => void;
  export const t: (props: MigratedPluginNoticeProps) => unknown;
}

declare module "@rchunk/gpt-plugin-retirement" {
  export interface LocalizedUser {
    locale?: string | null;
  }
  export const n: (
    user: LocalizedUser | string | null | undefined,
    urlTemplate: string,
  ) => string;
  export const r: () => void;
  export const t: (value: string) => number;
}

declare module "@rchunk/computer-history-suggestion-prompt" {
  export const n: unknown;
  export const r: () => void;
  export const t: unknown;
}

declare module "@rchunk/computer-history-query" {
  export const a: () => void;
  export const r: unknown;
}

declare module "@rchunk/computer-history-suggestions" {
  export const a: () => void;
  export const i: unknown;
  export const n: unknown;
  export const r: unknown;
  export const t: unknown;
}

declare module "@rchunk/suggestion-card" {
  export const n: () => void;
  export const t: unknown;
}

declare module "@rchunk/composer-announcement-slot" {
  export interface ComposerAnnouncementCandidate {
    content: unknown;
    id?: string;
    isEligible: boolean;
    isLoading: boolean;
    pageContextClaim?: unknown;
    trackVisibility?: boolean;
  }
  export interface ComposerAnnouncementSlotProps {
    area: "home" | string;
    candidates: ComposerAnnouncementCandidate[];
  }
  export const i: () => void;
  export const n: () => void;
  export const r: unknown;
  export const t: (props: ComposerAnnouncementSlotProps) => unknown;
}

declare module "@rchunk/rpc" {
  export const _any: any;
}

declare module "@rchunk/split-items-into-render-groups" {
  export const n: (items: unknown[], status: unknown, mode: string) => Record<string, unknown>;
  export const t: () => void;
}

declare module "@rchunk/agent-activity-units" {
  export const S: unknown;
  export const c: unknown;
  export const d: unknown;
  export const f: unknown;
  export const l: unknown;
  export const n: () => void;
  export const r: unknown;
}

declare module "@rchunk/thread-virtualizer" {
  export const a: (...args: any[]) => any;
  export const i: (...args: any[]) => any;
  export const n: (...args: any[]) => any;
  export const o: () => void;
  export const r: (...args: any[]) => any;
  export const t: (...args: any[]) => any;
}

declare module "@rchunk/scroll-to-match" {
  export const n: (input: { container: ParentNode; includeShadowRoots?: boolean; matchId: string; signal?: AbortSignal }) => Promise<void>;
  export const r: () => Promise<void>;
  export const t: () => void;
}

declare module "@rchunk/highlight-selectors" {
  export const n: (matches: unknown[]) => Map<string, unknown[]>;
  export const r: () => void;
  export const t: (matches: unknown[]) => Map<string, unknown[]>;
}

declare module "@rchunk/katex-renderer" {
  const katex: { renderToString(source: string, options?: Record<string, unknown>): string };
  export default katex;
}

declare module "@rchunk/local-conversation-turn" {
  export const a: unknown;
  export const c: () => void;
  export const i: () => void;
  export const n: () => void;
  export const o: () => void;
  export const r: unknown;
  export const s: unknown;
  export const t: unknown;
}

declare module "@rchunk/local-conversation-thread" {
  export const _: () => void;
  export const a: unknown;
  export const c: () => void;
  export const d: () => void;
  export const f: unknown;
  export const g: unknown;
  export const h: () => void;
  export const i: unknown;
  export const l: unknown;
  export const m: unknown;
  export const n: unknown;
  export const o: unknown;
  export const p: () => void;
  export const r: unknown;
  export const s: () => void;
  export const t: unknown;
  export const u: unknown;
}

declare module "@rchunk/virtualized-turn-list" {
  export const a: unknown;
  export const c: () => void;
  export const d: unknown;
  export const f: () => void;
  export const i: unknown;
  export const l: unknown;
  export const m: () => void;
  export const n: () => void;
  export const o: unknown;
  export const p: unknown;
  export const r: () => void;
  export const s: () => void;
  export const t: unknown;
  export const u: unknown;
}

declare module "@rchunk/detached-entry" {
  export const initializeDetachedWindow: () => Promise<{ [Symbol.dispose](): void }>;
}

declare module "@rchunk/index-entry" {}

// npm 依赖（react 等）：发布包内无 node_modules，实际符号由共享 chunk 提供。
// 重写模块应经 @rchunk/app-shared 引用；此处仅为 tsc 提供最小 React 类型面，
// 待工程接入真实 @types/react 后移除。
declare module "react" {
  export = React;
  namespace React {
    export type ReactNode = any;
    export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
    export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
    export function useMemo<T>(factory: () => T, deps?: unknown[]): T;
    export function useRef<T>(initial: T): { current: T };
    export function useCallback<T extends (...args: any[]) => any>(fn: T, deps?: unknown[]): T;
    export function createContext<T>(defaultValue: T): { Provider: any; Consumer: any; displayName?: string };
    export function useContext<T>(context: { Provider: any; Consumer: any }): T;
    export const Suspense: any;
    export const Fragment: any;
    export function createElement(...args: any[]): any;
    export const version: string;
  }
}

declare module "@rchunk/above-composer-fixed-content-surface" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/agent-activity-item" {
  export const n: unknown;
  export const r: (a: unknown, b: unknown) => boolean;
  export const t: (item: unknown) => { grouping?: string; item?: unknown } | null;
}

declare module "@rchunk/appgen-access" {
  export interface AppgenAccessGroup extends Record<string, unknown> {
    id: string;
    source?: "tenant" | "workspace" | string;
  }
  export interface AppgenAccessUser extends Record<string, unknown> {
    account_user_id: string;
    email?: string | null;
  }
  export interface AppgenAccessPolicy extends Record<string, unknown> {
    access_mode: string;
    allowed_account_user_ids: string[];
    allowed_editors?: AppgenAccessUser[];
    allowed_groups?: AppgenAccessGroup[];
    allowed_tenant_group_ids: string[];
    allowed_users?: AppgenAccessUser[];
    allowed_workspace_group_ids: string[];
    current_user_role?: string;
    external_visitor_count?: number;
  }
  export interface AppgenEditableAccessPolicy extends AppgenAccessPolicy {
    allowed_groups: AppgenAccessGroup[];
    allowed_users: AppgenAccessUser[];
  }
  export interface AppgenAccessSummary {
    accessMode: string;
    groupCount: number;
    userCount: number;
  }
  export interface AppgenAccessModeOption {
    disabled: boolean;
    value: string;
  }
  export interface AppgenAccessUpdate extends Record<string, unknown> {
    allowed_tenant_group_ids?: string[];
    allowed_user_emails?: string[];
    allowed_workspace_group_ids?: string[];
    editor_changes?: {
      add_editor_account_user_ids?: string[];
      remove_editor_account_user_ids?: string[];
    };
  }
  export interface BuildAppgenAccessUpdateInput {
    accessGroups: AppgenAccessGroup[];
    allowedUserEmails: Array<string | null | undefined>;
    canManageInvitees: boolean;
    editorAccountUserIds?: string[];
    existingGroups: AppgenAccessGroup[];
    knownAccessGroups: AppgenAccessGroup[];
    removedEditorAccountUserIds?: string[];
    selectedGroups: AppgenAccessGroup[];
  }
  export const a: (input: {
    accessGroups: AppgenAccessGroup[];
    accessPolicy: AppgenEditableAccessPolicy;
    group: AppgenAccessGroup;
    knownAccessGroups: AppgenAccessGroup[];
  }) => AppgenAccessUpdate;
  export const c: (summary: AppgenAccessSummary) => boolean;
  export const i: (input: BuildAppgenAccessUpdateInput) => AppgenAccessUpdate;
  export const n: (input: {
    availableAccessModes?: string[] | null;
    currentAccessMode: string;
    isWorkspaceAccount: boolean;
  }) => AppgenAccessModeOption[];
  export const o: (
    accessPolicy: AppgenEditableAccessPolicy,
    accountUserId: string,
  ) => AppgenAccessUpdate;
  export const r: (
    accessPolicy: AppgenAccessPolicy | null | undefined,
  ) => AppgenAccessSummary;
  export const s: () => void;
  /** isOwner（Site access policy 的 current user 是否为 owner）。 */
  export const t: (site: {
    current_user_role?: string;
  } | null | undefined) => boolean;
}

declare module "@rchunk/appgen-access-state-messages" {
  export interface AccessStateIconProps extends Record<string, unknown> {
    accessPolicy?: import("@rchunk/appgen-access").AppgenAccessPolicy | null;
    accessState?: import("@rchunk/appgen-access").AppgenAccessSummary;
  }
  export type AccessStateMessage =
    | import("@rchunk/app-shared").MessageDescriptor
    | undefined;
  export const a: (props: AccessStateIconProps) => unknown;
  export const i: () => void;
  export const n: (
    state: import("@rchunk/appgen-access").AppgenAccessSummary,
  ) => AccessStateMessage;
  export const o: () => void;
  export const r: (
    state: import("@rchunk/appgen-access").AppgenAccessSummary,
  ) => AccessStateMessage;
  export const t: (
    state: import("@rchunk/appgen-access").AppgenAccessSummary,
  ) => AccessStateMessage;
}

declare module "@rchunk/appgen-automations-state" {
  export interface SiteAutomationAttachment extends Record<string, unknown> {
    automation_ids?: string[];
    id?: string;
  }
  export interface AutomationBacklinksResponse extends Record<string, unknown> {
    sites: unknown[];
  }
  export const n: import("@rchunk/app-shared").ScopedQueryFamily<
    Record<string, unknown>,
    string,
    AutomationBacklinksResponse
  >;
  export const r: () => void;
  export const t: import("@rchunk/app-shared").ScopedQueryFamily<
    Record<string, unknown>,
    string[],
    SiteAutomationAttachment[]
  >;
}

declare module "@rchunk/appgen-automations-page" {
  export const AppgenAutomationsPage: () => unknown;
}

declare module "@rchunk/appgen-database-page" {
  export const AppgenDatabasePage: (...args: any[]) => any;
}

declare module "@rchunk/chart-stores" {
  export type ChartPartition = Record<string, unknown>;
  export type ChartStateUpdate<State> = State | ((current: State) => State);
  export interface ChartExternalStore<State> {
    <Selection = State>(selector?: (value: State) => Selection): Selection;
    getInitialState(): State;
    getState(): State;
    setState(update: ChartStateUpdate<State>, replace?: boolean): void;
    subscribe(listener: (next: State, previous: State) => void): () => void;
  }
  export interface ChartStores {
    useNameToIdStore: ChartExternalStore<ChartPartition>;
    useWidgetStateStore: ChartExternalStore<ChartPartition>;
  }
  export interface ChartRuntimeContext {
    activeBreakpoints: readonly unknown[];
    errorMode: "throw";
    flags: Record<string, unknown>;
    getActiveBreakpointValue<Value>(value: { default: Value }): Value;
    streaming: false;
    theme: unknown;
    useNameToIdStore: ChartExternalStore<ChartPartition>;
    useWidgetStateStore: ChartExternalStore<ChartPartition>;
    [key: string]: unknown;
  }
  export const n: () => void;
  export const r: () => ChartStores;
  export const t: (
    theme: unknown,
    stores: ChartStores,
    flags?: Record<string, unknown>,
  ) => ChartRuntimeContext;
}

declare module "@rchunk/appgen-query" {
  export const APPGEN_ACCESS_GROUPS_QUERY_KEY: typeof import("@rchunk/app-initial").Bin;
  export const APPGEN_CUSTOM_DOMAINS_QUERY_KEY: typeof import("@rchunk/app-initial").Vin;
  export const APPGEN_DATABASE_OVERVIEW_QUERY_KEY: typeof import("@rchunk/app-initial").Hin;
  export const APPGEN_DATABASE_TABLE_ROWS_QUERY_KEY: typeof import("@rchunk/app-initial").Uin;
  export const APPGEN_EDITABLE_PROJECTS_QUERY_KEY: typeof import("@rchunk/app-initial").Win;
  export const APPGEN_ENVIRONMENT_QUERY_KEY: typeof import("@rchunk/app-initial").Gin;
  export const APPGEN_PENDING_SLUG_CHANGE_QUERY_KEY: typeof import("@rchunk/app-initial").Kin;
  export const APPGEN_PROJECTS_QUERY_KEY: typeof import("@rchunk/app-initial").qin;
  export const APPGEN_PROJECT_QUERY_KEY: typeof import("@rchunk/app-initial").Jin;
  export const APPGEN_SCREENSHOT_QUERY_KEY: typeof import("@rchunk/app-initial").Yin;
  export const APPGEN_SLUG_AVAILABILITY_QUERY_KEY: typeof import("@rchunk/app-initial").Xin;
  export const APPGEN_TOOL_AVAILABILITY_QUERY_KEY: typeof import("@rchunk/app-initial").Zin;
  export const appgenAccessGroupsQuery$: typeof import("@rchunk/app-initial").Qin;
  export const appgenAddCustomDomainMutation$: typeof import("@rchunk/app-initial").$in;
  export const appgenChangeSlugMutation$: typeof import("@rchunk/app-initial").ean;
  export const appgenCustomDomainsQuery$: typeof import("@rchunk/app-initial").tan;
  export const appgenDeleteProjectMutation$: typeof import("@rchunk/app-initial").nan;
  export const appgenEnvironmentQuery$: typeof import("@rchunk/app-initial").ran;
  export const appgenLatestEditContextSchema: typeof import("@rchunk/app-initial").ian;
  export const appgenProjectQuery$: typeof import("@rchunk/app-initial").aan;
  export const appgenRefreshCustomDomainMutation$: typeof import("@rchunk/app-initial").oan;
  export const appgenRemoveCustomDomainMutation$: typeof import("@rchunk/app-initial").san;
  export const appgenToolAvailabilityQuery$: typeof import("@rchunk/app-initial").can;
  export const appgenUpdateAccessMutation$: typeof import("@rchunk/app-initial").lan;
  export const appgenUpdateEnvironmentMutation$: typeof import("@rchunk/app-initial").uan;
  export const appgenUpdateProjectTitleMutation$: typeof import("@rchunk/app-initial").dan;
  export const callSitesTool: typeof import("@rchunk/app-initial").fan;
  export const checkAppgenSlugAvailability: typeof import("@rchunk/app-initial").pan;
  export const discardQueuedAppgenAccessUpdate: typeof import("@rchunk/app-initial").man;
  export const fetchAppgenProject: typeof import("@rchunk/app-initial").han;
  export const getNextAppgenDatabaseTableRowsOffset: typeof import("@rchunk/app-initial").gan;
  export const invalidateAppgenProjectQueries: typeof import("@rchunk/app-initial").van;
  export const isIncrementalAppgenUserAccessUpdate: typeof import("@rchunk/app-initial").yan;
  export const useAppgenDatabaseOverview: typeof import("@rchunk/app-initial").ban;
  export const useAppgenDatabaseRefresh: typeof import("@rchunk/app-initial").xan;
  export const useAppgenDatabaseTableRows: typeof import("@rchunk/app-initial").San;
  export const useAppgenProjects: typeof import("@rchunk/app-initial").Can;
  export const useAppgenScreenshotSrc: typeof import("@rchunk/app-initial").wan;
}

declare module "@rchunk/appgen-disabled-tooltip" {
  export const n: () => void;
  export const t: (props: { disabledBy?: string | null }) => unknown;
}

declare module "@rchunk/appgen-card-layout" {
  export interface AppgenCardElementProps extends Record<string, unknown> {
    children?: unknown;
    className?: string;
  }
  export interface AppgenCardThumbnailLayoutProps
    extends AppgenCardElementProps {
    aspectRatio?: string;
    viewMode: "grid" | "list";
  }
  export interface AppgenCardTitleProps extends AppgenCardElementProps {
    viewMode: "grid" | "list";
  }
  export const a: () => void;
  export const i: (props: AppgenCardElementProps) => unknown;
  export const n: (props: AppgenCardThumbnailLayoutProps) => unknown;
  export const r: (props: AppgenCardTitleProps) => unknown;
  export const t: (props: AppgenCardElementProps) => unknown;
}

declare module "@rchunk/sites-default-thumbnail" {
  export interface SiteCardActionsProps {
    canManage?: boolean;
    disabled?: boolean;
    disabledBy?: string | null;
    onEdit(mode: "edit" | "publish"): void;
    projectId: string;
    projectTitle: string;
    surface: "library" | "sites";
    unpublished?: boolean;
    viewMode: "grid" | "list";
  }
  export interface DefaultSiteThumbnailAssetProps
    extends Record<string, unknown> {
    "aria-hidden"?: boolean;
    className?: string;
  }
  export const a: (props: SiteCardActionsProps) => unknown;
  export const i: () => void;
  export const n: () => void;
  export const o: () => void;
  export const r: (props: DefaultSiteThumbnailAssetProps) => unknown;
  export const t: (props: DefaultSiteThumbnailAssetProps) => unknown;
}

declare module "@rchunk/appgen-project-row" {
  export interface AppgenProjectThumbnailProps {
    aspectRatio?: string;
    screenshotUrl?: string | null;
    viewMode: "grid" | "list";
  }
  export const n: () => void;
  export const t: (props: AppgenProjectThumbnailProps) => unknown;
}

declare module "@rchunk/start-appgen-conversation" {
  export type StartAppgenRequest =
    | {
        assetType:
          | "document"
          | "spreadsheet"
          | "presentation"
          | "pdf"
          | "image";
        cloudLibraryEnabled?: boolean;
        type: "create-asset";
      }
    | { type: "create" }
    | {
        latestEditContext?: unknown;
        liveUrl?: string | null;
        projectId: string;
        projectTitle: string;
        type: "edit";
      }
    | { projectId: string; projectTitle: string; type: "publish" };
  export interface ConversationLaunchOptions extends Record<string, unknown> {
    activeProject?: unknown;
    libraryFileCreation?: boolean;
    prefillPrompt?: string;
    startInSidebar?: boolean;
  }
  export const n: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>,
    startConversation: (options: ConversationLaunchOptions) => void,
    request: StartAppgenRequest,
    options?: Record<string, unknown>,
  ) => void;
  export const t: () => void;
}

declare module "@rchunk/appgen-site-detail-layout" {
  export interface AppgenSiteDetailSite {
    current_user_role?: string;
    current_live_url?: string | null;
    disabled_by?: string | null;
    id: string;
    latest_edit_context?: unknown;
    screenshot_url?: string | null;
    slug: string;
    status?: string;
    title: string;
  }
  export const n: () => void;
  export const t: (props: {
    children(site: AppgenSiteDetailSite): unknown;
    prefetchTab?(
      tab: "analytics" | "automations" | "database" | "settings",
    ): Promise<unknown>;
    projectId: string;
    selectedTab: "analytics" | "automations" | "database" | "settings";
  }) => unknown;
}

declare module "@rchunk/toolbar-breadcrumb" {
  export type BreadcrumbAncestor =
    | { content: unknown; id: string }
    | { id: string; label: unknown; onClick(): void };
  export interface ToolbarBreadcrumbProps {
    ancestors: BreadcrumbAncestor[];
    current?: unknown;
    textSm?: boolean;
  }
  export const n: () => void;
  export const t: (props: ToolbarBreadcrumbProps) => unknown;
}

declare module "@rchunk/appgen-site-detail-route" {
  export const AppgenSiteDetailRoute: () => unknown;
}

declare module "@rchunk/appgen-publication-terms-route" {
  export interface AppgenPublicationTermsRouteProps {
    children?: unknown;
  }
  export const AppgenPublicationTermsRoute: (
    props: AppgenPublicationTermsRouteProps,
  ) => unknown;
}

declare module "@rchunk/appgen-browser-site-core" {
  export interface BrowserSiteEntry extends Record<string, unknown> {
    alternateUrls?: Array<string | null | undefined> | null;
    type: string;
    url?: string | null;
  }
  export const n: () => void;
  export const t: <Site extends BrowserSiteEntry>(
    sites: readonly Site[],
    currentUrl: string,
  ) => Site | null;
}

declare module "@rchunk/appgen-browser-site-entry" {
  export const getAppgenBrowserSiteForUrl: typeof import("@rchunk/appgen-browser-site-core").t;
}

declare module "@rchunk/appgen-settings-page-entry" {
  export const AppgenSettingsPage: typeof import("@rchunk/appgen-settings-page").n;
}

declare module "@rchunk/appgen-change-slug-dialog" {
  export const AppgenChangeSlugDialog: (...args: any[]) => any;
}

declare module "@rchunk/appgen-access-entry" {
  export const canManageAppgenProject: typeof import("@rchunk/appgen-access").t;
  export const getAppgenAccessModeOptions: typeof import("@rchunk/appgen-access").n;
  export const getAppgenAccessState: typeof import("@rchunk/appgen-access").r;
  export const getAppgenAccessUpdate: typeof import("@rchunk/appgen-access").i;
  export const getAppgenAccessUpdateWithoutGroup: typeof import("@rchunk/appgen-access").a;
  export const getAppgenAccessUpdateWithoutUser: typeof import("@rchunk/appgen-access").o;
  export const isAppgenAccessOwnerOnly: typeof import("@rchunk/appgen-access").c;
}

declare module "@rchunk/artifact-feedback-button" {
  const _default: unknown;
  export default _default;
}
declare module "@rchunk/secret-scope" {
  export type SecretScope = "environment" | "user_provided";
  export interface SecretValueInputProps { id: string; value: string; ariaLabel: string; invalid?: boolean; describedBy?: string; hasSavedValue?: boolean; saved?: boolean; optional?: boolean; personal?: boolean; scopeControl?: unknown; onFocus?(): void; onBlur?(): void; onChange(value: string): void; }
  export const a: (props: SecretValueInputProps) => unknown; export const c: () => void; export const i: () => void; export const n: () => void; export const o: () => void;
  export const r: (props: SecretValueInputProps & { configuration?: { configId?: string }; namespace: "sensitive" | "not_sensitive"; name: string; savedStatus?: "saved" | "ambiguous" | "unavailable"; onRetry?(): void }) => unknown;
  export const s: (props: SecretValueInputProps) => unknown;
  export const t: (props: { name: string; source: SecretScope; disabled?: boolean; attached?: boolean; onChange(scope: SecretScope): void }) => unknown;
}
declare module "@rchunk/personal-secret-dialog" {
  export type SecretNamespace = "not_sensitive" | "sensitive";
  export type SecretTarget = { type: "all_environment_configs" } | { type: "environment_config_ids"; ids: string[] };
  export interface PersonalSecret { id: string; name: string; env_var: string; target?: SecretTarget; }
  export interface PersonalSecretDialogProps { accountId: string; userId: string; initialNamespace: SecretNamespace; secret?: PersonalSecret | null; deleting?: boolean; onClose(namespace: SecretNamespace): void; }
  export const PersonalSecretDialog: (props: PersonalSecretDialogProps) => unknown;
}
declare module "@rchunk/entry-type" {
  export const n: () => void;
  export const t: (props: { namespace: "not_sensitive" | "sensitive" }) => unknown;
}
declare module "@rchunk/play-outline" {
  export interface IconProps { className?: string; [key: string]: unknown; }
  export const i: () => void; export const n: () => void;
  export const r: (props: IconProps) => unknown; export const t: (props: IconProps) => unknown;
}
declare module "@rchunk/environment-change-messages" {
  export const n: () => void;
  export const t: Record<string, { id: string; defaultMessage: string; description: string }>;
}
declare module "@rchunk/pending-environment-onboarding" {
  export interface PendingEnvironmentOnboarding { accountId: string; userId: string; [key: string]: unknown; }
  export const n: import("@rchunk/app-shared").ScopedDerivedFamily<Record<string, unknown>, string | null, PendingEnvironmentOnboarding | null>;
  export const r: import("@rchunk/app-shared").ScopedSignal<Record<string, unknown>, Map<string, PendingEnvironmentOnboarding>>;
  export const t: () => void;
}
declare module "@rchunk/cloud-preferences" {
  export interface PathTemplateVariable { value: string; example: string; char_count: number; }
  export type PathTemplateError = "bracket-mismatch" | "invalid-characters" | "invalid-pattern" | "leading-slash" | "missing-pattern" | "too-long";
  export const a: () => unknown; export const i: () => unknown;
  export const n: (template: string, maxLength: number, variables: readonly PathTemplateVariable[]) => PathTemplateError | null;
  export const o: () => unknown; export const r: () => void;
  export const t: (template: string, variables: readonly PathTemplateVariable[]) => string;
}
declare module "@rchunk/settings-row-disclosure" {
  export interface SettingsRowDisclosureProps { children: unknown; content: unknown; contentId: string; expanded: boolean; }
  export const n: () => void;
  export const t: (props: SettingsRowDisclosureProps) => unknown;
}
declare module "@rchunk/environment-configuration-fields" {
  export interface EnvironmentIssue { code: string; field?: string; message?: string; valuesSaved?: boolean; }
  export interface EnvironmentVariable { name: string; value: string; optional?: boolean; }
  export interface EnvironmentSecret { id: string | number; name: string; value: string; source?: "environment" | "user_provided"; serverId?: string | null; isMissing?: boolean; injectionTarget?: { type: string; name?: string; domain?: string | null }; }
  export interface EnvironmentDraft { access?: "organization" | "private"; maintenanceSetupScript?: string; networkDomains?: string[]; networkEnabled?: boolean; networkPreset?: "all" | "none" | "package_managers"; outboundIdentityRequirements?: unknown[]; repositories?: string[]; setupScript?: string; [key: string]: unknown; }
  export const i: () => void; export const n: () => void;
  export const r: (props: { disabled?: boolean; domains: string[]; onChange(domains: string[]): void; issues?: EnvironmentIssue[] }) => unknown;
  export const t: (props: Record<string, unknown> & { draft: EnvironmentDraft; onDraftChange(change: Partial<EnvironmentDraft>): void; secrets: EnvironmentSecret[]; setSecrets(secrets: EnvironmentSecret[]): void }) => unknown;
}
declare module "@rchunk/diff-file-view" { export interface DiffFile { name?: string; path?: string; contents?: string; additions?: number; deletions?: number } export interface DiffFileViewProps { className?: string; edit?: boolean; file: DiffFile; lineAnnotations?: readonly { line: number; label?: string }[]; onEditChange?(contents: string): void; onEditComplete?(contents: string): "accept" | "reject" | void; selectedLines?: readonly number[]; style?: Record<string, unknown> } export const n: () => void; export const t: (props: DiffFileViewProps) => unknown; }
declare module "@rchunk/outbound-identity-connection-dialog" {
  export interface OutboundIdentityConnection extends Record<string, unknown> {
    connection_id: string;
    display_name?: string;
    provider_kind: "azure" | "aws" | "gcp";
  }
  export const OutboundIdentityConnectionDialog: (props: {
    connection?: OutboundIdentityConnection | null;
    isOpen: boolean;
    onClose(): void;
    onSubmit(input: Record<string, unknown>): Promise<{
      data?: OutboundIdentityConnection;
      error?: string;
      ok: boolean;
      status?: number;
    }>;
  }) => unknown;
}
declare module "@rchunk/code-editor-runtime" { export const n: () => void; export const t: unknown; }
declare module "@rchunk/outbound-identity-error" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/publish-actions" {
  export interface PublishActionButtonProps { children: unknown; disabled?: boolean; loading?: boolean; tooltipContent?: unknown; color?: "primary" | "secondary"; onClick?(): void; }
  export interface EnvironmentPublishActionsProps { conversationId: string; children?: unknown; onReview?(): void; hasPendingVpn?: boolean; }
  export const i: () => void; export const n: () => void;
  export const r: (props: PublishActionButtonProps) => unknown;
  export const t: (props: EnvironmentPublishActionsProps) => unknown;
}
declare module "@rchunk/environment-setup-tab-panel" {
  export interface EnvironmentSetupTabPanelProps { conversationId: string; onClose?(): void; }
  export const EnvironmentSetupTabPanel: (props: Record<string, unknown>) => unknown;
}
declare module "@rchunk/app-initial" {
  export const $m: import("@rchunk/app-shared").ScopedSignalFamily<Record<string, unknown>, string, unknown>;
  export const Bm: import("@rchunk/app-shared").ScopedSignalFamily<Record<string, unknown>, string, unknown>;
  export const Fm: import("@rchunk/app-shared").ScopedSignalFamily<Record<string, unknown>, string, unknown>;
  export const Gm: import("@rchunk/app-shared").ScopedSignalFamily<Record<string, unknown>, string, unknown>;
  export const Jpt: import("@rchunk/app-shared").ScopedSignalFamily<Record<string, unknown>, string, unknown>;
  export const Km: import("@rchunk/app-shared").ScopedSignalFamily<Record<string, unknown>, string, unknown>;
  export const Kpt: import("@rchunk/app-shared").ScopedSignalFamily<Record<string, unknown>, string, unknown>;
  export const Ypt: import("@rchunk/app-shared").ScopedSignalFamily<Record<string, unknown>, string, unknown>;
  export const pmt: import("@rchunk/app-shared").ScopedSignalFamily<Record<string, unknown>, string, unknown>;
}
declare module "@rchunk/side-panel" {
  export const r: import("@rchunk/app-shared").ScopedSignal<Record<string, unknown>, boolean>;
}
declare module "@rchunk/validation-message" {
  export type EnvironmentValidationError = "missing-key" | "invalid-key" | "reserved-key" | "duplicate" | "missing-value" | "invalid-value";
  export const n: (props: { error: EnvironmentValidationError }) => unknown; export const r: () => void; export const t: (props: { name: string }) => unknown;
}
declare module "@rchunk/allowed-domains-input" {
  export interface EnvironmentSaveIssue { code: string; field?: string; message?: string; valuesSaved?: boolean; }
  export const a: () => void;
  export const i: (props: { issues: readonly EnvironmentSaveIssue[] }) => unknown;
  export const n: () => void;
  export const r: (props: { issue: EnvironmentSaveIssue }) => unknown;
  export const t: (props: { disabled?: boolean; domains: readonly string[]; value: string; onChange(domains: string[]): void; onInputChange(value: string): void; showErrors?: boolean; purpose?: "network" | "secret"; readOnly?: boolean; otherDomainCount?: number }) => unknown;
}
declare module "@rchunk/environment-entry-input" {
  export type EnvironmentParseFailure = { ok: false; reason: "duplicate" | "limit" | "malformed"; line: number };
  export type EnvironmentParseResult = { ok: true; entries: Map<string, string> } | EnvironmentParseFailure;
  export const a: () => unknown; export const i: () => void;
  export const n: (source: string, maxKeyLength: number, unavailableNames?: readonly string[], existingNames?: readonly string[]) => EnvironmentParseResult;
  export const o: () => void;
  export const r: (props: { limit: number; entryCount: number; onAddKey(key: string, restoreFocus: (element?: { focus?(): void } | null) => void): void; onImport(source: string): EnvironmentParseResult; onPendingChange(pending: boolean): void }) => unknown;
  export const t: () => void;
}
declare module "@rchunk/environment-variable-row" {
  export interface EnvironmentVariable { name: string; value: string; optional?: boolean; serverId?: string; source?: string; }
  export const n: () => void;
  export const t: (props: { variable: EnvironmentVariable; configuration?: unknown; keyError?: string | null; valueError?: string | null; onChange(variable: EnvironmentVariable): void; onDelete(): void }) => unknown;
}
declare module "@rchunk/environment-secret-row" {
  export interface EnvironmentSecret { id: number; name: string; value: string; source?: string; requested?: boolean; injectionTarget?: { type: "environment_variable"; name: string; domain?: string } | { type: "http_header"; name: string; domain?: string }; }
  export const n: () => void;
  export const t: (props: { secret: EnvironmentSecret; secrets: readonly EnvironmentSecret[]; issues?: readonly string[]; configuration?: unknown; readOnly?: boolean; disabled?: boolean; onChange(secret: EnvironmentSecret): void; onDelete(): void }) => unknown;
}
declare module "@rchunk/personal-secrets-service" {
  export interface PersonalSecretsIssue { namespace: "sensitive" | "not_sensitive"; env_var: string; code: string; id?: string; error?: string; }
  export interface PersonalSecretsPreflight { issues: PersonalSecretsIssue[]; }
  export interface PersonalSecretsSelection { accountId: string; userId: string; config: { id: string; name?: string }; preflightPersonalSecrets?(input: { accountId: string; userId: string; configId: string }): Promise<{ ok: boolean; data?: PersonalSecretsPreflight }>; }
  export const n: (selection: PersonalSecretsSelection) => Promise<PersonalSecretsPreflight | null>;
  export const t: () => void;
}
declare module "@rchunk/environment-variables-batch-dialog" {
  import type { EnvironmentVariable } from "@rchunk/environment-variable-row";
  export const EnvironmentVariablesBatchDialog: (props: { initialVariables: readonly EnvironmentVariable[]; unavailableNames: readonly string[]; hasConflict?: boolean; configuration?: unknown; onClose(): void; onSave(variables: EnvironmentVariable[]): void }) => unknown;
}
declare module "@rchunk/environment-batch-secrets-dialog" {
  import type { EnvironmentSecret } from "@rchunk/environment-secret-row";
  export const EnvironmentBatchSecretsDialog: (props: { initialSecrets: readonly EnvironmentSecret[]; hasConflict?: boolean; requireValues?: boolean; configuration?: unknown; onClose(): void; onLocalSave(secrets: EnvironmentSecret[]): void }) => unknown;
}
declare module "@rchunk/personal-secrets-dialog" {
  import type { PersonalSecretsPreflight, PersonalSecretsSelection } from "@rchunk/personal-secrets-service";
  export const PersonalSecretsDialog: (props: { selection: PersonalSecretsSelection; initialPreflight: PersonalSecretsPreflight | null; isCurrent(): boolean; onClose(): void; requestPersonalSecrets?(input: { namespace: "sensitive" | "not_sensitive"; secrets: { env_var: string; name: string; value: string }[] }): Promise<boolean> }) => unknown;
}

declare module "@rchunk/artifact-originating-turn" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/conversation-blocks" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/diff-summary" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/generated-image-output-visibility" {
  export const a: (items: unknown[]) => boolean;
  export const i: (paths: unknown[]) => boolean;
  export const n: (input: Record<string, unknown>) => { images?: unknown[] } | null;
  export const r: () => void;
  export const t: (...arguments_: unknown[]) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/google-chrome" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/google-drive-resource-icon" {
  export const n: () => void;
  export const t: (props: {
    className?: string;
    resourceKind: "document" | "drive" | "presentation" | "spreadsheet";
  }) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-automation-side-panel-tab" {
  export const a: (...args: any[]) => any;
  export const i: (request: {
    projectId: string;
    prompt: string;
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>;
    title: string;
  }) => void;
  export const n: (...args: any[]) => any;
  export const r: (...args: any[]) => any;
  export const t: () => void;
}

declare module "@rchunk/open-in-button" {
  export const n: () => void;
  export const t: (props: {
    analyticsClickSource?: string;
    artifactRef?: string;
    hostId?: string;
    kind?: string;
    onDownload?(): void;
    onOpen?(): void;
    threadId?: string;
    title?: string;
    variant?: "menu" | "title";
  }) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-in-google-drive-menu-item" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/skill-exploration-labels" {
  export const a: (command: string) => "create" | "update" | null;
  export const c: (summary: Record<string, unknown> | null | undefined) => boolean;
  export const i: (input: { kind: "create" | "update"; isFinished: boolean; isLeadingSegment: boolean; intl?: unknown }) => string;
  export const l: (status?: string) => boolean;
  export const n: () => void;
  export const o: (content?: Array<{ type?: string; text?: string }>) => "explicit" | "soft" | "none";
  export const r: (input: { summary: Record<string, unknown> }) => boolean;
  export const s: () => void;
  export const t: (input: { summary: Record<string, unknown> }) => Record<string, unknown> | null;
  export const u: { activeCreating: string; activeUpdating: string };
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/turn-preview-body-items" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-app-connect-flow" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-target-apps" {
  export interface TargetApp extends Record<string, unknown> {
    appPath?: string | null;
    available?: boolean;
    default?: boolean;
    id: string;
    kind?: string;
    resolvedIcon?: unknown;
    target: string;
  }
  export interface OpenTargetOptions extends Record<string, unknown> {
    appPath?: string;
    column?: number;
    line?: number;
    openMode?: string;
    path?: string;
    persistPreferred?: boolean;
  }
  export interface UseTargetAppsOptions extends Record<string, unknown> {
    cwd?: string;
    deferEnrichment?: boolean;
    hostId?: string;
    openPath?: string;
    turnId?: string;
  }
  export const n: () => void;
  export const r: (options: UseTargetAppsOptions) => {
    availableTargets: string[];
    canLoadTargets: boolean;
    hasLoadedTargets: boolean;
    isLoadingTargets: boolean;
    mode: unknown;
    open(target: string, options: OpenTargetOptions): void;
    preferredTarget: string | null;
    targets: TargetApp[];
  };
  export const t: (props: {
    cwd?: string;
    delayMs?: number;
    hostId?: string;
    openPath?: string;
  }) => null;
}

declare module "@rchunk/user-message" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/workspace-file-context-menu-trigger" {
  export const n: () => void;
  export const t: (props: {
    children: import("@rchunk/app-shared").MenuElement;
  } & import("@rchunk/app-initial").WorkspaceFileContextMenuOptions) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/workspace-file-tab-context-menu" {
  export const getWorkspaceFileTabContextMenuItems: typeof import("@rchunk/app-initial").Gut;
  export const prefetchWorkspaceFileTabContextMenuItems: typeof import("@rchunk/app-initial").qut;
}

declare module "@rchunk/hooks" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks-settings-copy" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks-settings-model" {
  export const p: () => void;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-implementation-request" {
  export const n: () => void;
  export const r: (input: string) => boolean;
  export const t: string;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/timestamps" {
  export const a: () => void;
  export const i: (turnTimestamps: unknown[]) => Array<number | null>;
  export const n: (...arguments_: unknown[]) => string;
  export const r: (...arguments_: unknown[]) => Record<string, unknown>;
  export const t: (...arguments_: unknown[]) => number;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/Icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/assert-never" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/patch-diff-stats" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/presentation" { export type PresentationToolState = "active" | "completed" | "failed" | "failedFollowing" | "following" | string; export const a: (tool: string, state: PresentationToolState) => string; export const i: (input: { started?: number; total?: number }) => string; export const n: () => void; export const o: (state: PresentationToolState) => "danger" | "neutral" | "success"; export const r: (value: string) => string; export const s: (input: { state: PresentationToolState; tool: string }) => { label: string; tone: "danger" | "neutral" | "success" }; export const t: (props: { state?: PresentationToolState; tool?: string; progress?: { started?: number; total?: number } }) => unknown; }

declare module "@rchunk/result-card" {
  export const n: (props: { details: Record<string, unknown>; notice?: unknown; onOpenRepository?(): void; title?: string }) => unknown;
  export const r: () => void;
  export const t: typeof n;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/tool-activity-disclosure" {
  export const i: () => { elementHeightPx: number; elementRef(element: { scrollHeight?: number } | null): void };
  export const n: () => void;
  export const r: () => void;
  export const t: (props: { children?: unknown; defaultExpanded?: boolean; icon?: unknown; indentContent?: boolean; onExpand?(): void; status?: "complete" | "error" | "running"; summary: unknown }) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/artifact-file-preview-icon" {
  export const n: () => void;
  export const t: (props: { getImagePreviewSrc?(path: string): string | null | undefined; iconClassName?: string; imageClassName?: string; path: string }) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/automation-delete-confirmation-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/bookmarked-thread-user-message-navigation" {
  export const n: () => void;
  export const t: (props: { bookmarkKey?: string; enabled?: boolean; getItems(): Array<{ id: string; label?: string; bookmarked?: boolean; [key: string]: unknown }>; onBookmarkChange?(item: Record<string, unknown>): void; onPreviewItem?(item: Record<string, unknown>): void; onRevealItem?(item: Record<string, unknown>): void }) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/command-execution-command" {
  export interface CommandExecution {
    command: string;
    commandActions: Array<{ command?: string | null } | null>;
  }
  export const n: () => void;
  export const t: (execution: CommandExecution) => string;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/conversation-source" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/creation-target-query" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/environment-labels" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/git-action-new-branch-field" {
  export type CommitBlockedReason = "changes-loading" | "changes-unavailable" | "no-changes";
  export type PushBlockedReason = "branch-missing" | "nothing-to-push" | "push-status-loading";
  export type PullRequestBlockedReason = "branch-missing" | "checking-existing-pr" | "default-branch-checked-out" | "default-branch-missing" | "gh-auth-required" | "gh-cli-missing" | "no-git-repository" | "pull-request-exists" | "pull-request-source-loading" | "pull-request-source-unavailable" | "push-status-loading" | "upstream-missing";
  export type GitNextStep = "commit-push-and-create-pr" | "push-and-create-pr" | "create-pr";
  export interface PushStatus { branch?: string | null; commitsAhead: number; defaultBranch?: string | null; gitRoot?: string | null; upstreamRef?: string | null }
  export interface NewBranchFieldProps { branchAlreadyExists?: boolean; disabled?: boolean; placeholder?: string; value: string; onChange(value: string): void }
  export const $: (props: { blockedStep?: { kind: "commit" | "create-pr" | "push"; reason: string } | null }) => unknown;
  export const A: () => void;
  export const B: () => void;
  export const C: () => null;
  export const D: (scope: { set(...args: unknown[]): void }, options?: { defaultToDraft?: boolean }) => void;
  export const E: (scope: { set(...args: unknown[]): void }) => void;
  export const F: unknown;
  export const G: (input: { ignoreNothingToPush?: boolean; pushStatus?: PushStatus }) => PushBlockedReason | null;
  export const H: (input: Record<string, unknown>) => { canCommitPushAndCreatePullRequest: boolean; canCreatePullRequest: boolean; canPushAndCreatePullRequest: boolean };
  export const I: unknown;
  export const J: (results: Array<{ files: Array<{ additions?: number | null; deletions?: number | null; path: string; previousPath?: string | null }>; type: "success" | "error" } | null | undefined>) => { files: Array<{ additions: number; deletions: number; path: string }>; totalAdditions: number; totalDeletions: number } | null;
  export const K: () => void;
  export const L: unknown;
  export const M: (scope: { set(...args: unknown[]): void }, target: unknown) => void;
  export const N: (target: { cwd: string; hostId: string }) => { cwd: string; hostId: string };
  export const O: (scope: { set(...args: unknown[]): void }) => void;
  export const P: (input: { hasSomeUncommittedChanges: boolean; isChangesLoading: boolean; isChangesUnavailable: boolean }) => CommitBlockedReason | null;
  export const Q: (props: { reason?: CommitBlockedReason | null }) => unknown;
  export const R: unknown;
  export const S: () => Promise<void>;
  export const T: unknown;
  export const U: (input: Record<string, unknown>) => { kind: "commit" | "create-pr" | "push"; reason: string } | null;
  export const V: () => null;
  export const W: typeof G;
  export const X: (input: { canCommitPushAndCreatePullRequest: boolean; canCreatePullRequest: boolean; canPushAndCreatePullRequest: boolean; createsBranch: boolean; includeLocalChanges: boolean }) => GitNextStep;
  export const Y: () => void;
  export const Z: () => void;
  export const _: () => null;
  export const a: () => { run(kind: "commit" | "create-pr"): Promise<boolean> };
  export const at: () => void;
  export const b: () => null;
  export const c: (value: { target: unknown }) => unknown;
  export const d: (props: Record<string, unknown>) => unknown;
  export const et: (props: { reason?: PushBlockedReason | null }) => unknown;
  export const f: () => void;
  export const g: () => null;
  export const h: (input: { currentBranch?: string | null; storedThreadBranch?: string | null }) => string;
  export const i: () => { run(kind: "commit" | "create-pr"): Promise<boolean> };
  export const it: () => null;
  export const j: (target: { cwd: string; hostId: string }) => void;
  export const k: { key(value: { target: { cwd: string; hostId: string } }): string };
  export const l: (phase: string) => string;
  export const m: (scope: { set(...args: unknown[]): void }) => void;
  export const n: () => void;
  export const nt: (target: { cwd: string; hostConfig: { id: string; [key: string]: unknown } }) => { cwd: string; hostConfig: { id: string; [key: string]: unknown }; operationSource: string };
  export const o: () => void;
  export const p: unknown;
  export const q: (path: string, results: Array<{ files: Array<{ additions?: number | null; deletions?: number | null; path: string; previousPath?: string | null }>; type: "success" | "error" } | null | undefined>) => { linesAdded: number; linesRemoved: number } | null;
  export const r: () => void;
  export const rt: () => void;
  export const s: (input: { baseBranch?: string | null; filePaths: string[]; headBranch?: string | null; pullRequestInstructions?: string | null; uncommittedDiff?: string | null }) => string;
  export const t: (props: NewBranchFieldProps) => unknown;
  export const tt: () => void;
  export const u: () => void;
  export const v: () => void;
  export const w: (value: { target: unknown }) => unknown;
  export const x: typeof U;
  export const y: () => null;
  export const z: unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/git-action-review-state" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-analytics-attribution" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/commit-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-git-recent-branches" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/layout" {
  export interface TextLayoutOptions { tabSize?: number; whiteSpace?: "normal" | "pre" | "pre-wrap" }
  export interface TextLayout { font: string; options: TextLayoutOptions; text: string }
  export const n: (layout: TextLayout, maxWidth: number, lineHeight: number) => { height: number; lineCount: number };
  export const r: (text: string, font: string, options?: TextLayoutOptions) => TextLayout;
  export const t: () => void;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-artifacts-signals" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-external-resource-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-git-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-plan-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-side-chat" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-summary-panel-image-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-thread-turn-entries" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-webmcp-tools-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-environment-editor" {
  export type Platform = "darwin" | "linux" | "win32";
  export type ActionIcon = "tool" | "run" | "debug" | "test";
  export interface EnvironmentAction { id: string; name: string; icon: ActionIcon; command: string; platform: Platform | null; }
  export interface PlatformScripts { darwin: string; linux: string; win32: string; }
  export interface LocalEnvironmentDraft { actions: EnvironmentAction[]; cleanupPlatformScripts: PlatformScripts; cleanupScript: string; name: string; setupPlatformScripts: PlatformScripts; setupScript: string; }
  export const _: () => void; export const a: (props: Record<string, unknown>) => unknown; export const c: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  export const d: () => EnvironmentAction; export const f: (input: Record<string, unknown>) => LocalEnvironmentDraft; export const g: (props: { icon: ActionIcon; className?: string }) => unknown;
  export const h: () => void; export const i: () => void; export const l: () => void; export const m: ReadonlyArray<{ value: ActionIcon; message: { defaultMessage: string } }>;
  export const n: () => void; export const o: () => void; export const p: () => void; export const r: () => unknown; export const s: () => void;
  export const t: (props: Record<string, unknown>) => unknown; export const u: Record<string, { defaultMessage: string }>;
}

declare module "@rchunk/local-environment-workflow-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/lock" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-picker-chevron-down-sm" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-terminal-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-sources-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-code-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pending-onboarding" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugin-picker-menu-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/publish-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-detail-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-fix-workflow" {
  export interface PullRequestTarget { cwd: string; hostId: string; root: string }
  export interface PullRequestCheck { link?: string | null; name: string; status: string; workflow?: string | null; [key: string]: unknown }
  export interface ReviewComment {
    authorLogin?: string | null;
    body: string;
    isResolved?: boolean;
    line?: number | null;
    path?: string | null;
    replies?: Array<{ authorLogin?: string | null; body: string }>;
    reviewThreadId?: string;
    side?: string | null;
    startLine?: number | null;
    startSide?: string | null;
  }
  export interface CommentAttachment {
    content: Array<{ content_type: "text"; text: string }>;
    localPullRequestCommentGuidance?: string;
    localWorkspaceRoot?: string;
    position: { line: number; path: string; side: string; start_line?: number; start_side?: string };
    reviewThreadId?: string;
    type: "comment";
  }
  export interface MergeConflict { baseBranch: string; headBranch: string; number: number; repo?: string | null; url: string }
  export interface PullRequestRepairState {
    pullRequestChecks: PullRequestCheck[];
    pullRequestMergeConflict: MergeConflict | null;
    pullRequestRepair: { pullRequestNumber: number | null; target: PullRequestTarget } | null;
  }
  export interface RepairScope extends import("@rchunk/app-shared").MaitaiScopeApi<unknown> { focusComposer?(): void }
  export interface PullRequestStatus {
    activityItems: ReviewComment[];
    checks: PullRequestCheck[];
    mergeBlocker?: "conflicts" | "unknown" | string | null;
    number?: number | null;
    repo?: string | null;
    url?: string | null;
  }
  export const C: () => void;
  export const S: () => void;
  export const T: () => void;
  export const _: (scope: RepairScope, input: { baseBranch: string | null; comments: ReviewComment[]; conversationId: string | null; focusComposer: boolean; headBranch: string | null; number: number | null; repo?: string | null; target: PullRequestTarget }) => boolean;
  export const a: (scope: RepairScope, conflict: MergeConflict | null) => void;
  export const b: () => void;
  export const c: (scope: RepairScope, conflict: MergeConflict | null, target: PullRequestTarget) => boolean;
  export const d: (comments: ReviewComment[]) => ReviewComment[];
  export const f: (input: { baseBranch?: string | null; conversationId?: string | null; headBranch?: string | null; prNumber?: number | null }) => string | null;
  export const g: (scope: RepairScope, input: { commentAttachment: CommentAttachment; conversationId: string | null; guidance: string }) => boolean;
  export const h: (scope: RepairScope, input: { baseBranch: string | null; commentAttachments: CommentAttachment[]; conversationId: string | null; headBranch: string | null; number: number | null; repo?: string | null; target: PullRequestTarget }) => boolean;
  export const i: (scope: RepairScope, input: { attached: boolean; checks: PullRequestCheck[]; pullRequestNumber: number; target: PullRequestTarget }) => boolean;
  export const l: (left: PullRequestTarget, right: PullRequestTarget) => boolean;
  export const m: import("@rchunk/app-shared").ScopedDerivedSignal<Record<string, unknown>, PullRequestTarget | null>;
  export const n: (check: PullRequestCheck) => string;
  export const o: (scope: RepairScope, input: { baseBranch: string | null; checks: PullRequestCheck[]; headBranch: string | null; number: number | null; repo?: string | null; target: PullRequestTarget }) => boolean;
  export const p: () => void;
  export const r: () => void;
  export const s: (scope: RepairScope, input: { baseBranch: string | null; conversationId: string | null; headBranch: string | null; pullRequestStatus: PullRequestStatus; target: PullRequestTarget }) => boolean;
  export const t: (input: { baseBranch: string; headBranch: string; number: number; repo?: string | null; target: PullRequestTarget }) => string;
  export const u: (attachment: CommentAttachment) => string;
  export const v: (scope: RepairScope, input: { comment: CommentAttachment; conversationId?: string | null; target: PullRequestTarget; workspaceRoots?: string[] }) => CommentAttachment;
  export const w: () => void;
  export const x: (props: Record<string, unknown>) => unknown;
  export const y: (props: Record<string, unknown>) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-status-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/profile-view" { export interface ProfileStat { key: "currentStreakDays" | "longestStreakDays" | "longestTaskDurationMs" | "peakTokens" | "totalTextTokens" | string; label?: string; value: number } export interface ProfileViewProps { Layout?: (props: { children?: unknown }) => unknown; activities?: readonly { id: string; label: string; timestamp?: string }[]; avatarId?: string | null; error?: Error | null; isProfileV2Enabled?: boolean; onAvatarChanged?(avatarId: string): void; onUsernameChanged?(username: string): void; stats?: readonly ProfileStat[]; today?: Date | string; username?: string } export const n: () => void; export const t: (props: ProfileViewProps) => unknown; }
declare module "@rchunk/profile-site-details";
declare module "@rchunk/workspace-agent-detail-query" {
  export interface WorkspaceAgentQueryContext { accountId?: string | null; enabled?: boolean }
  export const a: { getOptions(input: { agentId: string; fileId?: string | null; fileName?: string; mimeType?: string | null; sizeBytes?: number | null; updatedAt?: string | null }, context?: WorkspaceAgentQueryContext): Record<string, unknown> };
  export const c: (accountId: string, connectorId: string) => Record<string, unknown>;
  export const d: () => void;
  export const i: { getOptions(agentId: string, context?: WorkspaceAgentQueryContext): Record<string, unknown> };
  export const l: (reference: { connector_identifier: { connector_id?: string; type: string } }) => string | null;
  export const n: { getOptions(agentId: string, context?: WorkspaceAgentQueryContext): Record<string, unknown> };
  export const o: { getOptions(input: { agentId: string; channel: { channelId?: string; linkId?: string; type: string } }, context?: WorkspaceAgentQueryContext): Record<string, unknown> };
  export const r: { getOptions(connectorIds: readonly string[], context?: WorkspaceAgentQueryContext): Record<string, unknown> };
  export const s: (input: { accountId: string; connectorIds: readonly string[]; enabled?: boolean }) => Record<string, unknown>;
  export const t: () => void;
  export const u: (input: { accountId: string; agentId: string; versionScope: string; enabled?: boolean }) => Record<string, unknown>;
}

declare module "@rchunk/profile-page" {
  export interface ProfilePageProps { today?: Date | string; username?: string; editPaneOpen?: boolean; header?: unknown; children?: unknown; onUsernameChanged?(username: string): void; }
  export const ProfilePage: (props: ProfilePageProps) => unknown;
}
declare module "@rchunk/browser-plugin-share-page" {
  export const BrowserPluginSharePage: (props: { shareKey?: string; resolvedPluginId?: string; isLoading?: boolean; error?: string; search?: string }) => unknown;
}
declare module "@rchunk/codex-mobile-page" {
  export const CodexMobilePage: (props: { isMfaSetupRequiredError?: boolean; isMfaSetupRequiredFetching?: boolean; mfaSetupRequired?: boolean; remoteControlStatus?: "connected" | "disconnected" | "pending"; setupStepDebugOverride?: string; onManageConnections?(): void; onClose?(): void }) => unknown;
}
declare module "@rchunk/plan-summary-page" {
  export const PlanSummaryPage: (props: { state?: { planContent?: string; conversationId?: string; hostId?: string } | null }) => unknown;
}
declare module "@rchunk/gpt-chat-page" {
  export const GptChatPage: (props: { gpt?: { id: string; name?: string; description?: string; short_url?: string | null } | null; isLoading?: boolean; errorStatus?: number; pathname?: string; search?: string; hash?: string; onRetry?(): void }) => unknown;
}
declare module "@rchunk/open-source-licenses-page" {
  export const OpenSourceLicensesPage: (props: { noticesText?: string | null; isLoading?: boolean; state?: { licensesBackPath?: unknown } | null; onBack?(path: string): void }) => unknown;
}
declare module "@rchunk/plugin-mcp-app-deep-link-page" {
  export interface McpExtensionView { entrypoint?: string; pluginId?: string; plugin_id?: string; serverName?: string; toolName?: string; tool_name?: string; url?: string; }
  export const PluginMcpAppDeepLinkPage: (props: { entrypoint?: string; pluginId?: string; toolName?: string; views?: readonly McpExtensionView[]; isLoading?: boolean; activationState?: "active" | "inactive" | "unavailable" }) => unknown;
}
declare module "@rchunk/asb-conversation-page" {
  export const AsbConversationPage: (props: { conversationId?: string; hostId?: string; title?: string; archived?: boolean; readOnly?: boolean; children?: unknown; onRename?(title: string): void; onArchive?(): void }) => unknown;
}
declare module "@rchunk/hotkey-window-thread-page" {
  export const HotkeyWindowThreadPage: (props: { conversationId?: string; title?: string; projectLabel?: string; mainWindowPath?: string; children?: unknown; onBack?(): void }) => unknown;
}
declare module "@rchunk/workspace-agent-detail-page" {
  export interface WorkspaceAgentDetailData { agent: { id: string; name?: string; description?: string }; latest_published_version?: { id?: string; version?: number; [key: string]: unknown } | null; }
  export const WorkspaceAgentDetailPage: (props: { agentId?: string; useLegacyRoute?: boolean; data?: WorkspaceAgentDetailData | null; isLoading?: boolean; errorStatus?: number; onRetry?(): void; onOpenLegacy?(): void }) => unknown;
}

declare module "@rchunk/datadog-rum-browser" { const rum: unknown; export default rum; }
declare module "@rchunk/browser-mfa-jwt" {
  export const n: (token: string, options?: { header?: boolean }) => Record<string, unknown>;
  export const t: () => void;
}
declare module "@rchunk/browser-mfa-session" {
  export const a: (url: string, signal?: AbortSignal) => Promise<boolean>;
  export const i: (ignoreMfaRequirement?: boolean) => Promise<boolean>;
  export const n: () => void;
  export const r: (error: unknown) => boolean;
  export const t: (accountId: string) => {
    gcTime: 0;
    queryFn(context: { signal: AbortSignal }): Promise<unknown>;
    queryKey: [string, string];
    refetchOnWindowFocus: false;
    retry: false;
    staleTime: 0;
  };
}
declare module "@rchunk/mobile-age-verification-page" {
  export type MobileAgeVerificationStatus = "loading" | "active" | "success" | "cancelled" | "error";
  export const MobileAgeVerificationPage: (props: { inquiryId?: string; status?: MobileAgeVerificationStatus; errorCode?: string; errorStatus?: string; onStart?(): void; onResult?(url: string): void }) => unknown;
}
declare module "@rchunk/browser-mobile-handoff-page" {
  export type MobileHandoffStatus = "loading" | "account_changed" | "unavailable" | "ready";
  export const BrowserMobileHandoffPage: (props: { status?: MobileHandoffStatus; redirectTo?: string; onContinue?(url: string): void }) => unknown;
}
declare module "@rchunk/browser-mfa-enroll-page" {
  export type MfaEnrollStatus = "loading" | "ready" | "reauthenticate" | "email_required" | "error";
  export const BrowserMfaEnrollPage: (props: { status?: MfaEnrollStatus; token?: string; factor?: "passkey" | "totp"; appName?: string; redirectPath?: string; onReauthenticate?(): void; onRetry?(): void }) => unknown;
}
declare module "@rchunk/browser-mfa-disable-page" {
  export type MfaDisableStatus = "loading" | "ready" | "reauthenticate" | "disabled" | "no_default" | "error";
  export const BrowserMfaDisablePage: (props: { status?: MfaDisableStatus; onDisable?(): void; onReauthenticate?(): void; onRetry?(): void; onReturn?(): void }) => unknown;
}
declare module "@rchunk/browser-logout-page" {
  export type BrowserLogoutStatus = "confirm" | "pending" | "error" | "complete";
  export const BrowserLogoutPage: (props: { email?: string; status?: BrowserLogoutStatus; logoutAllDevices?: boolean; onConfirm?(): void; onCancel?(): void }) => unknown;
}
declare module "@rchunk/verify-guardian-page" {
  export type GuardianVerificationPhase = "loading" | "refreshing" | "active" | "pending" | "canceled" | "error" | "refresh-error" | "redirect";
  export const VerifyGuardianPage: (props: { accountId?: string; userId?: string; phase?: GuardianVerificationPhase; onRetry?(): void; onReturn?(): void }) => unknown;
}
declare module "@rchunk/verify-age-page" {
  export type AgeVerificationPhase = "loading" | "refreshing" | "active" | "pending" | "canceled" | "error" | "refresh-error" | "redirect";
  export const VerifyAgePage: (props: { accountId?: string; userId?: string; phase?: AgeVerificationPhase; onRetry?(): void; onReturn?(): void }) => unknown;
}
declare module "@rchunk/icloud-hosted-page" {
  export type ICloudHostedStatus = "loading" | "ready" | "unavailable" | "finished";
  export interface ICloudHostedPageProps { status?: ICloudHostedStatus; service?: "mail" | "calendar"; userId?: string; accountId?: string; children?: unknown; onReturn?(result: "connected" | "cancelled" | "unavailable"): void; }
  export const ICloudHostedPage: (props: ICloudHostedPageProps) => unknown;
  export const ICloudHostedCompletionPage: (props: Pick<ICloudHostedPageProps, "onReturn">) => unknown;
}

declare module "@rchunk/feedback-legal-notice" { export const n: () => void; export const t: () => unknown; }
declare module "@rchunk/feedback-form-dialog" {
  export interface FeedbackOption { id: string; label: string | { defaultMessage?: string; [key: string]: unknown }; }
  export interface FeedbackFormValue { selectedOptionId: string; details: string; }
  export const n: () => void;
  export const t: (props: { belowFreeformContent?: unknown; closeOnSubmit?: "after-submit" | "immediate"; freeformFeedbackRequired?: boolean; hideFreeformInput?: boolean; initialDetails?: string; initialSelectedOptionId?: string | null; onClose(): void; onOptionSelect?(value: FeedbackFormValue): void; onSubmit(value: FeedbackFormValue): boolean | void | Promise<boolean | void>; options: readonly FeedbackOption[]; size?: "wide" | "xxwide" }) => unknown;
}
declare module "@rchunk/feedback-upload" {
  export type FeedbackUploadStatus = "uploading" | "uploaded" | "incomplete" | "disabled" | "failed" | "unconfirmed";
  export interface FeedbackUploadUpdate { correlationId?: string; status: FeedbackUploadStatus; onDismiss(): void; onRetry?(): void; }
  export const startFeedbackUpload: (options: { scope?: unknown; hostId?: string; initialCorrelationId?: string; internalSlackMessage?: string; submit(): Promise<string | undefined>; onStatusChange?(update: FeedbackUploadUpdate): void; onUploadError?(error: unknown): void }) => { dismiss(): void; completion: Promise<FeedbackUploadStatus> };
}
declare module "@rchunk/submit-feedback" {
  export interface FeedbackAppInfo { version: string; buildNumber?: string; buildFlavor?: string; }
  export interface FeedbackTransport { upload(input: { classification: string; reason: string; threadId?: string; includeLogs: boolean; extraLogFiles?: readonly string[]; tags: Record<string, unknown> }): Promise<{ threadId: string }>; createDesktopLogArchive?(input: { hostId: string; includeBrowserTabs: boolean; includeDesktopLogs: boolean; includeNativeHostDiagnostics: boolean; includeProcessMemoryDiagnostics: boolean }): Promise<{ archiveId: string; filePaths: string[] }>; deleteDesktopLogArchive?(archiveId: string): Promise<void>; remove?(path: string): Promise<void>; }
  export const n: (options: { scope?: unknown; attachmentPaths?: readonly string[]; classification: string; description: string; extraTags?: Record<string, unknown>; hostId?: string; includeDesktopLogArchive?: boolean; includeBrowserTabs?: boolean; includeLogs?: boolean; includeNativeHostDiagnostics?: boolean; appInfo?: FeedbackAppInfo; threadId?: string; runtimeBundleVersion?: string | null; transport: FeedbackTransport }) => Promise<{ feedbackId: string }>;
  export const t: () => void;
}
declare module "@rchunk/submit-artifact-feedback" {
  import type { FeedbackAppInfo, FeedbackTransport } from "@rchunk/submit-feedback";
  export const submitArtifactFeedback: (scope: unknown, context: { appInfo?: FeedbackAppInfo; artifactType: string; classification: string; description: string; fileFormat: string; fileSizeBytes?: number; hostId?: string; path?: string; planType?: string; threadId?: string; metadata?: { authoringTurnCount?: number; modelConfigurations?: readonly string[]; connectorIds?: readonly string[]; connectorNames?: readonly string[]; pluginIds?: readonly string[]; skillIds?: readonly string[]; platform?: string; skillPluginConnectorUsageCollected?: boolean; generatedSourcePaths?: readonly string[] }; transport: FeedbackTransport }, answers: { attachArtifact: boolean; includeLogs: boolean; influences: readonly string[]; rating: string; timeSaved?: string | null }) => Promise<{ feedbackId: string }>;
}
declare module "@rchunk/thumb-mixed" { const thumbMixed: unknown; export default thumbMixed; }
declare module "@rchunk/artifact-feedback-dialog" {
  export type ArtifactFeedbackRating = "better" | "same" | "worse";
  export type ArtifactFeedbackInfluence = "content" | "visual_quality" | "time_saved" | "other";
  export type ArtifactFeedbackTimeSaved = "under_15_minutes" | "15_to_under_60_minutes" | "1_to_under_4_hours" | "4_to_under_8_hours" | "8_hours_or_more";
  export interface FeedbackArtifact { artifactType: string; fileFormat: string; label: string; path?: string | null; allowArtifactAttachment?: boolean; }
  export interface ArtifactFeedbackValue { attachArtifact: boolean; details: string; includeLogs: boolean; influences: ArtifactFeedbackInfluence[]; rating: ArtifactFeedbackRating; timeSaved: ArtifactFeedbackTimeSaved | null; }
  export interface ArtifactFeedbackDialogProps { artifacts: readonly FeedbackArtifact[]; onClose(): void; onSubmit(value: ArtifactFeedbackValue, artifact?: FeedbackArtifact): boolean | Promise<boolean>; showArtifactSelector?: boolean; }
  export const ArtifactFeedbackDialog: (props: ArtifactFeedbackDialogProps) => unknown;
}
declare module "@rchunk/artifact-feedback-button" {
  import type { ArtifactFeedbackDialogProps, ArtifactFeedbackValue, FeedbackArtifact } from "@rchunk/artifact-feedback-dialog";
  export const n: () => void;
  export const t: (props: { artifacts: readonly FeedbackArtifact[]; fileSizeBytes?: number; hostId?: string; showArtifactSelector?: boolean; variant?: "icon" | "text" | "manualEditHeader"; onOpenFeedback?(input: { artifacts: readonly FeedbackArtifact[]; showArtifactSelector: boolean; Dialog: (props: ArtifactFeedbackDialogProps) => unknown; submit(value: ArtifactFeedbackValue, artifact?: FeedbackArtifact): Promise<boolean> }): void; onSubmit?(value: ArtifactFeedbackValue, artifact: FeedbackArtifact): Promise<boolean> | boolean; onError?(error: unknown): void }) => unknown;
}
declare module "@rchunk/subscription-platform-dialog" {
  export type SubscriptionManagementSource = "app_store" | "google_play_store" | "partner_managed";
  export const SubscriptionPlatformDialog: (props: { account: { account: { plan_type?: string | null } }; managementSource: SubscriptionManagementSource; showProLevels?: boolean; onClose(): void; onOpenStore?(url: string): void }) => unknown;
}
declare module "@rchunk/project-folder-consent-dialog" {
  export const ProjectFolderConsentDialog: (props: { folders: readonly string[]; hostName?: string | null; explicitlyUntrusted?: boolean; onConfirm(): void; onClose(): void }) => unknown;
}
declare module "@rchunk/feedback-submission-dialog" {
  export type FeedbackClassification = "bug" | "bad-result" | "good-result" | "safety_check" | "research-failure" | "high-ram-usage" | "other";
  export interface FeedbackSubmission { classification: FeedbackClassification; description: string; extraTags: undefined; includeBrowserTabs: boolean; includeLogs: boolean; }
  export const FeedbackSubmissionDialog: (props: { additionalOptionsEnabled?: boolean; browserTabsAvailable?: boolean; chatGptConversationAvailable?: boolean; initialDetails?: string; initialExtraTags?: readonly string[]; logsAvailable?: boolean; processMemoryDiagnosticsAvailable?: boolean; onClose(): void; onSubmit(value: FeedbackSubmission): void }) => unknown;
}
declare module "@rchunk/delete-thread-dialog" {
  export const DeleteThreadDialog: (props: { conversationId: string; hostId?: string; returnFocusTo?: HTMLElement | null; onClose(): void; onDelete?(input: { threadId: string; hostId?: string }): Promise<void> | void; onError?(error: unknown): void }) => unknown;
}
declare module "@rchunk/browser-site-annotation-permission-dialog" {
  export const BrowserSiteAnnotationPermissionDialog: (props: { hostname: string; isExitingAnnotationMode?: boolean; onRespond(allowed: boolean): Promise<boolean> | boolean; onCloseAutoFocus?(): void; onError?(error: unknown): void }) => unknown;
}
declare module "@rchunk/habitat-automation-migration-state" { const migrationState: unknown; export default migrationState; }
declare module "@rchunk/business-checkout-switch-workspace-dialog" {
  export const BusinessCheckoutSwitchWorkspaceDialog: (props: { workspaceId: string; pending?: boolean; error?: string | null; onClose(): void; onSwitch?(workspaceId: string): Promise<void> | void; onError?(error: unknown): void }) => unknown;
}
declare module "@rchunk/personal-workspace-access-blocked-dialog" {
  export interface ManagedWorkspace { workspaceAccountId: string; workspaceName?: string | null; isPersonalWorkspace?: boolean; isDeactivated?: boolean; }
  export const PersonalWorkspaceAccessBlockedDialog: (props: { workspaceId: string; authGeneration?: string; workspaces?: readonly ManagedWorkspace[]; isLoading?: boolean; hasLoadError?: boolean; openingWorkspaceId?: string | null; switchError?: string | null; onRetry?(): void; onSelect?(workspaceId: string): Promise<void> | void; onClose(): void }) => unknown;
}
declare module "@rchunk/stable-worktree-status-dialog" {
  export type WorktreeSetupPhase = "queued" | "preparing" | "creating" | "failed" | "complete";
  export interface PendingStableWorktree { id: string; hostId?: string; label: string; launchMode?: string; phase: WorktreeSetupPhase; phaseLabel?: string; sourceWorkspaceRoot?: string; worktreeGitRoot?: string | null; worktreeWorkspaceRoot?: string | null; localEnvironmentConfigPath?: string | null; }
  export const StableWorktreeStatusDialog: (props: { pendingWorktreeId: string; pendingWorktree?: PendingStableWorktree | null; onClose(): void; onCancel?(id: string): void; onRetry?(id: string): void; onEditEnvironment?(worktree: PendingStableWorktree): void; onAutoFix?(worktree: PendingStableWorktree): Promise<void> | void }) => unknown;
}
declare module "@rchunk/habitat-automation-migration-prompt" {
  export type AutomationMigrationStatus = "available" | "declined" | "migrating" | "error" | "complete" | "unavailable";
  export const HabitatAutomationMigrationPrompt: (props?: { accountId?: string | null; userId?: string | null; visibility?: "open" | "dismissed"; state?: { status: AutomationMigrationStatus; pendingCount?: number; migratedCount?: number; consentAccepted?: boolean } | null; isPending?: boolean; onDecline?(): void; onMigrate?(): void }) => unknown;
}

declare module "@rchunk/app-shared" {
  /** invokeDesktopBridgePromise（桌面桥 Promise 规范化）。 */
  export const UI: <Result>(request: Promise<Result>, signal?: AbortSignal) => Promise<Result>;
  /** Archived conversation unarchive icon。 */
  export const V_: (props: Record<string, unknown>) => unknown;
  /** 是否为 client conversation id。 */
  export const rJ: (conversationId: string) => boolean;
  export const Hy: (props: Record<string, unknown>) => unknown;
  /** Codex Micro command registry。 */
  export const Ep: () => void;
  export interface RegisteredCommand extends Record<string, unknown> {
    commandMenuGroupKey?: string | null;
    id: string;
    kind: string;
    requiredAccess?: "codexLocal" | "codexOrWorkLocal";
  }
  /** command menu 分组排序。 */
  export const Dp: string[];
  /** realtime voice command 判定。 */
  export const Gp: (commandId: string) => boolean;
  /** getCommand（按 id 查询 Codex command registry）。 */
  export const Np: (commandId: string) => RegisteredCommand | null;
  /** unified tab strip command ids。 */
  export const kp: string[];
  /** command requiredAccess 校验。 */
  export const zp: (
    command: RegisteredCommand,
    access: { codexLocal: boolean; workLocal: boolean },
  ) => boolean;
  export const Xp: Array<Record<string, unknown> & { id: string; kind: string }>;
  export const qp: (command: Record<string, unknown>, platform: string) => boolean;
  /** Editable plan icon dependencies。 */
  export const Nu: () => void;
  export const Pu: IconAssetPreset;
  /** Text file storage helpers。 */
  export const jU: unknown;
  export const lW: number;
  export const uW: (bytes: Uint8Array) => Promise<string>;
  /** React Query client hooks。 */
  export const CL: () => {
    getQueryData(queryKey: readonly unknown[]): unknown;
    invalidateQueries(options: { queryKey: readonly unknown[] }): Promise<unknown>;
  };
  export const SL: () => void;
  /** Read-only code block used by Python analysis details。 */
  export const $d: (props: Record<string, unknown>) => unknown;
  export const ef: () => void;
  /** Code highlighting theme configuration. */
  export const Cz: { darkCodeThemeId: string; lightCodeThemeId: string };
}

declare module "@rchunk/app-initial" {
  /** account check 查询 key。 */
  export const cdn: (accountId: string) => readonly unknown[];
  export const ldn: () => void;
  /** 当前 active conversation session 及其初始化器。 */
  export const A1t: () => void;
  export const M1t: import("@rchunk/app-shared").ReadableSignal<{
    locator: { conversationId: string; hostId: string };
    phase: string;
    sessionId: string;
  }>;
  /** Saved-memory API and citation feedback state。 */
  export const $K: import("@rchunk/app-shared").SignalFamily<
    { accountId: string; citationUuid: string; conversationId: string; messageId?: string | null },
    { feedback?: unknown } | null
  >;
  export const Ozt: () => void;
  export const Tzt: (error: unknown) => string | null | undefined;
  export const eq: () => void;
  export const udn: ApiClient;
  export const ydn: () => void;
  /** Desktop fetch bridge used by legacy browser-skill downloads. */
  export const _dn: {
    getInstance(): {
      fetch(input: string, init?: RequestInit): Promise<{
        arrayBuffer(): Promise<ArrayBuffer>;
      }>;
    };
  };
  /** Target-app query, loader and open mutation contracts. */
  export const _ft: () => void;
  export const hft: unknown;
  export const mft: () => void;
  export const vft: {
    getOptions(parameters: Record<string, unknown>): {
      queryKey: readonly unknown[];
      [key: string]: unknown;
    };
  };
  export const yft: (
    parameters: Record<string, unknown>,
    signal?: AbortSignal,
  ) => Promise<{
    availableTargets?: string[];
    mode?: unknown;
    preferredTarget?: string | null;
    targets: Array<{
      appPath?: string | null;
      available?: boolean;
      id: string;
      kind?: string;
      target: string;
      [key: string]: unknown;
    }>;
  }>;
  /** Browser-use origin policy parsing and query dependencies. */
  export interface ParsedBrowserOrigin {
    canonicalKey: string;
    canonicalPattern: string;
    hostname: string;
  }
  export const Asn: (url: string) => ParsedBrowserOrigin | null;
  export const Fsn: (pattern: ParsedBrowserOrigin, hostname: string) => boolean;
  export const Kdn: (layers: unknown) => { name: string; config?: Record<string, unknown> } | null;
  export const Msn: (pattern: string) => ParsedBrowserOrigin | null;
  export const Nsn: (pattern: string) => ParsedBrowserOrigin | null;
  export const Xdn: () => void;
  export const Ydn: (layerName: string) => string | null;
  export const bsn: () => void;
  export const ksn: (pattern: ParsedBrowserOrigin, origin: ParsedBrowserOrigin) => boolean;
  export const sun: () => (queryKey: readonly unknown[]) => Promise<void>;
  export const tun: (
    scope: import("@rchunk/app-shared").MaitaiScope<Record<string, unknown>>,
    command: string,
    options: Record<string, unknown>,
  ) => unknown;
  /** Browser MFA access token bridge. */
  export const Vun: () => Promise<{ accessToken: string } | null>;
  /** Outbound identity connection form dependencies. */
  export const $W: () => void;
  export const Jat: (props: Record<string, unknown>) => unknown;
  export const QW: (props: Record<string, unknown>) => unknown;
  export const Xat: (props: Record<string, unknown>) => unknown;
  export const Yat: {
    parse(value: unknown): Record<string, unknown>;
  };
  export const bmt: () => void;
  export const xmt: () => void;
  /** Cloud environment connector constants。 */
  export const Jr: string;
  export const Kr: string;
  export const Yr: () => void;
  /** Computer-use capability dependencies。 */
  export const $fn: () => void;
  export const Qfn: (get: unknown, key: string) => unknown;
  export const Su: (input: {
    remoteControlConnectionsState: unknown;
    slingshotEnabled: boolean;
  }) => boolean;
  export const xu: () => void;
  /** Feature configuration hook。 */
  export const ufn: (featureId: string) => Experiment;
  /** Chat tab title metadata state。 */
  export const Xct: import("@rchunk/app-shared").ScopedSignal<unknown, string | null>;
  export const Yct: () => void;
  /** Local conversation subagents panel state。 */
  export const GZt: unknown;
  export const ag: (definition: { open: (...arguments_: unknown[]) => unknown }) => unknown;
  export const cg: () => void;
  export const ig: () => void;
  export const kZt: unknown;
  export const og: string;
  export const qvt: {
    tabById$: unknown;
    tabStateById$: unknown;
    activeTab$?: unknown;
    closeTab?(tabId: string): void;
    updateTab?(tabId: string, update: Record<string, unknown>): void;
  };
  export const sg: (parentConversationId: string) => string;
  export const wZt: unknown;
  /** Side-panel definition registry and environment setup state。 */
  export const FDt: () => void;
  export const IDt: (
    kind: string,
    component: unknown,
    options: Record<string, unknown>,
  ) => unknown;
  export const Ebt: () => void;
  export const Otn: unknown;
  export const Utn: unknown;
  export const vbt: unknown;
  export const vvt: (scope: unknown, placement: string) => boolean;
  export const wtn: import("@rchunk/app-shared").MaitaiScope<unknown>;
  /** Automation side-panel registration and query dependencies。 */
  export const Fg: string;
  export const Ig: () => void;
  export const Ng: () => void;
  export const Pg: (definition: {
    open: (...arguments_: unknown[]) => unknown;
    restore: (...arguments_: unknown[]) => Promise<boolean>;
  }) => unknown;
  export const Vvt: { tabStateById$: unknown };
  export const stt: () => void;
  export const ttt: unknown;
  export const zg: (directiveKey: string) => string;
  export const hEt: () => void;
  export const mEt: (commandId: string) => boolean;
  /** Sentinel account-action integrity constants。 */
  export const AKt: () => void;
  export const DKt: { sentinelToken: string; timing: string };
  /** Codex Micro visibility predicate。 */
  export const Ovt: (element: HTMLElement) => boolean;
  /** Text file storage encoding and routing dependencies。 */
  export const Fon: (value: string) => string;
  export const Non: (value: string) => Uint8Array;
  export const Oyt: () => void;
  export const kyt: unknown;
  /** Project color palette definitions。 */
  export const TM: () => void;
  export const xM: Record<string, { swatchClassName: string }>;
  /** Shiki provider theme and diff preferences. */
  export const CW: (theme: unknown) => "dark" | "light";
  export const GO: unknown;
  export const Kcn: (settingId: string) => unknown;
  export const SW: () => unknown;
  export const VO: () => void;
  export const r_t: (theme: unknown, colorScheme: "dark" | "light") => { name: string };
  export const wk: () => void;
  export const xW: () => void;
  /** Browser Skills authentication and experiment dependencies. */
  export const G6t: () => void;
  export const K6t: unknown;
  export const gfn: unknown;
  export const vfn: unknown;
  export const yun: unknown;
}

declare module "@rchunk/app-primary" {
  export const hn: unknown;
}

declare module "@rchunk/verify-descendant" {
  export const n: (
    scope: unknown,
    input: {
      hostId: string;
      hydrateMissingAncestors: boolean;
      parentConversationId: string;
      selectedConversationId: string;
    },
  ) => boolean | Promise<boolean>;
  export const t: () => void;
}

declare module "@rchunk/open-sources-side-panel-tab" {
  export const n: (
    scope: unknown,
    definition: unknown,
    props: unknown,
    title: string,
    openerTabId?: string,
    trailingContent?: unknown,
  ) => void;
  export const t: () => void;
}

declare module "@rchunk/local-conversation-sources-side-panel-tab-core" {
  export const LocalConversationSourcesSidePanelTab: (
    props: Record<string, unknown>,
  ) => unknown;
}

declare module "@rchunk/registered-sources" {
  export const RegisteredLocalSourcesThumbnail: (
    props: Record<string, unknown>,
  ) => unknown;
}

declare module "@rchunk/environment-setup-tab-panel" {
  export const EnvironmentSetupTabPanel: (
    props: Record<string, unknown>,
  ) => unknown;
}

declare module "@rchunk/site-automation-setup-state" {
  export const n: unknown;
  export const t: () => void;
}

declare module "@rchunk/automation-side-panel-tab-core" {
  export const AutomationSidePanelTabIcon: (
    props: Record<string, unknown>,
  ) => unknown;
}

declare module "@rchunk/persona-runtime" {
  const persona: {
    Client: new (options: {
      inquiryId: string;
      onCancel(): void;
      onComplete(): void;
      onError(): void;
      onLoad(): void;
    }) => { destroy(): void; open(): void };
  };
  export default persona;
}

declare module "@rchunk/chatgpt-tasks-runtime" {
  export const a: Readonly<Record<string, string>>;
  export const i: Readonly<Record<string, string>>;
  export const n: Readonly<{ $type: "protobuf_analytics_events.v1.ChatgptTasksEvent" }>;
  export const o: Readonly<Record<string, string>>;
  export const r: Readonly<Record<string, string>>;
  export const s: () => void;
  export const t: Readonly<Record<string, string>>;
}

// Conversation workflow, source panels, and local-workspace foundations.
declare module "@rchunk/app-shared" {
  export const HI: (...segments: string[]) => string;
  export const IK: (left: string, right: string) => boolean;
  export const NU: (alias: string) => string;
  export const WK: (...segments: string[]) => string;
  export const YF: unknown;
  export const _H: (
    value: string,
  ) => { host: string; owner: string; repo: string } | null;
  export const hq: (server: unknown) => boolean;
  export const lZ: (
    scope: unknown,
    factory: (...arguments_: unknown[]) => unknown,
    options?: unknown,
    familyOptions?: Record<string, unknown>,
  ) => unknown;
  export const zU: (hostId: string) => boolean;
}

declare module "@rchunk/app-primary" {
  export const Bl: (props: Record<string, unknown>) => unknown;
  export const Ur: (
    scope: unknown,
    conversationId: string,
    hostId: string,
  ) => boolean | Promise<boolean>;
  export const Vl: () => void;
  export const Wr: () => void;
  export const mn: () => void;
  export const pn: unknown;
}

declare module "@rchunk/app-initial" {
  export const $b: unknown;
  export const $4t: () => void;
  export const Ag: unknown;
  export const AXt: () => void;
  export const Af: (
    scope: unknown,
    hostId: string,
    capability: unknown,
    projectName: string,
  ) => Promise<unknown>;
  export const Bst: () => void;
  export const C3: (scope: unknown) => void;
  export const Cg: (...arguments_: unknown[]) => unknown;
  export const Chn: (thread: unknown) => string | null;
  export const Dg: () => void;
  export const Dhn: (history: unknown) => { entries: unknown[] } | null;
  export const Dlt: (props: Record<string, unknown>) => unknown;
  export const Dpn: () => void;
  export const Eg: (conversationId: string, terminalId: string) => string;
  export const F_t: unknown;
  export const Ff: () => void;
  export const Fin: (conversation: unknown) => Array<Record<string, unknown>>;
  export const GEt: (input: Record<string, unknown>) => { data?: unknown[] };
  export const If: (scope: unknown, capability: unknown) => Promise<void>;
  export const Iin: () => void;
  export const J9t: (path: string) => string;
  export const L9t: (mimeType?: string | null) => unknown;
  export const MQt: unknown;
  export const MXt: () => void;
  export const Mg: () => void;
  export const NXt: unknown;
  export const Nzt: unknown;
  export const OZt: unknown;
  export const O_t: () => void;
  export const Og: () => void;
  export const Olt: () => void;
  export const PXt: () => void;
  export const PQt: unknown;
  export const Pf: (data: unknown, action: string) => unknown;
  export const Pnn: (agentPath: unknown) => string | null;
  export const Qb: () => void;
  export const ROt: (
    scope: unknown,
    options: Record<string, unknown>,
  ) => Promise<unknown>;
  export const RQt: unknown;
  export const Sg: unknown;
  export const TQt: unknown;
  export const Tct: (scope: unknown) => void;
  export const Tfn: (left: unknown[], right: unknown[]) => boolean;
  export const Tg: unknown;
  export const Thn: (source: unknown) => Record<string, unknown> | null;
  export const UBt: unknown;
  export const Vst: unknown;
  export const X4: unknown;
  export const YVt: unknown;
  export const Zen: { PLAN: string; SOURCES?: string };
  export const _Qt: unknown;
  export const _Z: () => void;
  export const al: (...arguments_: unknown[]) => unknown;
  export const arn: () => void;
  export const bg: (definition: Record<string, unknown>) => unknown;
  export const cl: () => void;
  export const cm: () => void;
  export const d9t: (turn: unknown) => string | null | undefined;
  export const dHt: (status: unknown) => boolean;
  export const ecn: unknown;
  export const f9t: () => void;
  export const fon: (
    options: Record<string, unknown> | null | undefined,
    defaultStaleTime: number | null,
  ) => Record<string, unknown>;
  export const gZ: (props: Record<string, unknown>) => unknown;
  export const gon: () => void;
  export const h_t: import("@rchunk/app-shared").SignalFamily<string, string | null>;
  export const ict: () => void;
  export const il: (...arguments_: unknown[]) => unknown;
  export const irn: (turn: unknown) => {
    editedFilePaths: string[];
    outputFilePaths: string[];
  };
  export const jOt: (scope: unknown, conversationId: string) => void;
  export const jQt: unknown;
  export const jXt: (options: Record<string, unknown>) => {
    fromTarget$: unknown;
  };
  export const jcn: unknown;
  export const jg: (conversationId: string) => string;
  export const jin: (conversation: unknown) => unknown;
  export const kXt: unknown;
  export const kf: () => void;
  export const kg: (definition: Record<string, unknown>) => unknown;
  export const lQt: unknown;
  export const m_t: () => void;
  export const n$t: unknown;
  export const n0: () => void;
  export const ncn: unknown;
  export const oct: unknown;
  export const ojt: () => void;
  export const ol: unknown;
  export const rQt: unknown;
  export const rl: (...arguments_: unknown[]) => unknown;
  export const sQt: unknown;
  export const sjt: (title: string) => string;
  export const sl: unknown;
  export const sm: unknown;
  export const t$t: unknown;
  export const t0: (props: Record<string, unknown>) => unknown;
  export const u9t: (turn: unknown) => string | null | undefined;
  export const uct: unknown;
  export const vZt: unknown;
  export const vat: number;
  export const w$t: (items: unknown[]) => unknown[];
  export const wVt: unknown;
  export const wct: () => void;
  export const wg: (definition: Record<string, unknown>) => unknown;
  export const xat: (options: { fallbackFontSizePx: number }) => unknown;
  export const xct: (scope: unknown, appId: string) => void;
  export const xg: unknown;
  export const yZt: unknown;
  export const yat: () => void;
  export const yg: () => void;
  export const z9t: (url: string) => unknown;
}

declare module "@rchunk/webmcp-tool-calls" {
  export const n: () => void;
  export const t: (metadata: unknown) => unknown[];
}

declare module "@rchunk/google-drive-resource-icon" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/local-conversation-external-resources" {
  export type ExternalResourceActivity = "provided" | "read" | "created" | "updated";
  export interface ExternalResourceProvider {
    id: string;
    logoUrl: string | null;
    logoUrlDark: string | null;
    name: string;
    pluginDisplayNames: string[];
  }
  export interface ExternalResource extends Record<string, unknown> {
    activities: ExternalResourceActivity[];
    isSource: boolean;
    key: string;
    mimeType: string | null;
    openInitiator: "markdown_link_click" | "mcp_app_resource";
    provider: ExternalResourceProvider | null;
    title: string;
    url: string;
  }
  export const a: (source: ExternalResource) => boolean;
  export const i: (source: ExternalResource) => boolean;
  export const n: (...arguments_: unknown[]) => ExternalResource[];
  export const r: () => void;
  export const t: (url: string) => string | null;
}

declare module "@rchunk/local-conversation-summary-panel-sources-model" {
  export const a: () => void;
  export const i: (...arguments_: unknown[]) => {
    externalSources: Array<Record<string, unknown>>;
    webSearchSource: unknown;
  };
  export const n: (...arguments_: unknown[]) => unknown[];
  export const r: (...arguments_: unknown[]) => unknown;
  export const t: (...arguments_: unknown[]) => unknown[];
}

declare module "@rchunk/text-file-storage" {
  export const n: () => void;
  export const r: (input: {
    filePath: string;
    hostId: string;
  }) => Promise<{ content: string }>;
}

declare module "@rchunk/editable-plan-tab" {
  export const i: unknown;
  export const n: (...arguments_: unknown[]) => boolean;
  export const o: () => void;
  export const r: unknown;
  export const t: () => void;
}

declare module "@rchunk/layout" {
  export const n: (...arguments_: unknown[]) => { lineCount: number };
  export const r: (...arguments_: unknown[]) => unknown;
  export const t: () => void;
}

declare module "@rchunk/open-target" {
  export const n: (...arguments_: unknown[]) => unknown;
  export const r: () => void;
  export const t: (...arguments_: unknown[]) => unknown;
}

declare module "@rchunk/realtime-voice-handoff-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-launch-surface" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-motion" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-stage-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/remote-hosted-pip-anchor-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/result-values" {
  export const a: () => void;
  export const i: (props: { script?: string }) => unknown;
  export const n: (props: { detail?: boolean; workspaceName?: string }) => unknown;
  export const o: { queryKey: string[] };
  export const r: (props: { configuration?: unknown; requirement: { connection_id: string; display_name?: string } }) => unknown;
  export const s: () => void;
  export const t: (props: { policy: { type: "disabled" | "unrestricted" } | { type: "restricted"; egress_rules: Array<{ host: string }>; presets?: string[] } }) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/runtime" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-keys" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/setup-artwork" {
  export const n: string;
  export const t: () => void;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-handoff-modal" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-pin-shortcut-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-scroll-layout" {
  export const n: () => void;
  export const t: (props: { children?: unknown; footer?: unknown }) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/page-layout" {
  export interface PageLayoutProps {
    children?: unknown;
    embedded?: boolean;
    showFooter?: boolean;
    title: unknown;
  }
  export const n: () => void;
  export const t: (props: PageLayoutProps) => unknown;
}

declare module "@rchunk/auth-handoff-page" {
  export type AuthHandoffResult = { ok: true; url: string } | { ok: false };
  export interface AuthHandoffPageProps {
    onRetry(): void;
    pending: boolean;
    result?: AuthHandoffResult;
  }
  export const n: () => void;
  export const t: (props: AuthHandoffPageProps) => unknown;
}

declare module "@rchunk/use-hotkey-window-detail-layout" {
  export interface HotkeyWindowDetailLayout {
    canCollapseToHome: boolean;
    mainWindowPath: string;
    title: unknown;
  }
  export const n: () => void;
  export const r: (layout: HotkeyWindowDetailLayout) => void;
  export const t: unknown;
}

declare module "@rchunk/quick-chat-window" {
  export const n: () => void;
  export const t: (props: {
    canPopOut?: boolean;
    onAddToComposer?(conversationId: string): void;
    onClose?(): void;
    onConversationSelect?(conversationId: string): void;
    onPopOut?(): void;
    onViewAll?(): void;
    session: Record<string, unknown>;
    variant?: "floating" | "window";
  }) => unknown;
}

declare module "@rchunk/portable-thumbnail-font-face-source-runtime" {
  export interface FontFaceSource { family: string; format: string; src: string; style: string; unicodeRange?: string; weight: string; }
  export const i: (fonts: readonly FontFaceSource[]) => Promise<void>;
  export const n: () => Record<string, unknown>;
  export const r: () => void;
  export const t: () => FontFaceSource[];
}

declare module "@rchunk/portable-thumbnail-font-runtime" {
  export const a: () => void;
  export const i: () => void;
  export const n: () => Promise<void>;
  export const r: () => void;
  export const t: () => boolean;
}

declare module "@rchunk/portable-thumbnail-pdf-document" {
  export const n: () => void;
  export const r: (props: { fileDataUrl: string }) => { loadedFileDataUrl: string | null; loadState: "error" | "loading" | "ready"; loadStateFileDataUrl: string; numPages: number; pageViewportSize: { height: number; width: number } | null; pdfDocument: unknown | null };
  export const t: () => Promise<{ GlobalWorkerOptions: { workerSrc: string }; getDocument(options: { data: Uint8Array }): unknown }>;
}

declare module "@rchunk/portable-thumbnail-font-metrics" {
  export interface FontDescriptor { family: string; stretch?: string; style?: string; weight?: string } export interface TextMetricsLike { actualBoundingBoxAscent?: number; actualBoundingBoxDescent?: number; fontBoundingBoxAscent?: number; fontBoundingBoxDescent?: number } export interface FontMetrics { ascentEm: number; descentEm: number; lineGapEm: number; measuredAtPx: number }
  export const a: (listener: () => void) => () => void; export const c: () => void; export const i: () => void; export const n: { getFontKey(font: FontDescriptor): string; getMetrics(font: FontDescriptor): FontMetrics; getMetricsForSize(font: FontDescriptor, size: number): { ascentPx: number; descentPx: number; lineGapPx: number }; reset(): void; dispose(): void }; export const o: (cap: TextMetricsLike, descender: TextMetricsLike, size?: number) => FontMetrics; export const r: () => OffscreenCanvasRenderingContext2D; export const s: (value: number) => number; export const t: (font: FontDescriptor, size: number) => string;
}
declare module "@rchunk/thumbnail-worker-font-metrics" {
  export { type FontDescriptor, type FontMetrics, type TextMetricsLike } from "@rchunk/portable-thumbnail-font-metrics"; export const a: typeof import("@rchunk/portable-thumbnail-font-metrics").o; export const i: typeof import("@rchunk/portable-thumbnail-font-metrics").a; export const n: { getFontKey(font: import("@rchunk/portable-thumbnail-font-metrics").FontDescriptor): string; getMetrics(font: import("@rchunk/portable-thumbnail-font-metrics").FontDescriptor): import("@rchunk/portable-thumbnail-font-metrics").FontMetrics; reset(): void; dispose(): void }; export const o: (value: number) => number; export const r: () => OffscreenCanvasRenderingContext2D; export const s: () => void; export const t: typeof import("@rchunk/portable-thumbnail-font-metrics").t;
}
declare module "@rchunk/portable-pdfjs-runtime" {
  export const AbortException: unknown; export const AnnotationEditorLayer: unknown; export const AnnotationEditorParamsType: unknown; export const AnnotationEditorType: unknown; export const AnnotationEditorUIManager: unknown; export const AnnotationLayer: unknown; export const AnnotationMode: unknown; export const AnnotationType: unknown; export const CSSConstants: unknown; export const ColorPicker: unknown; export const DOMSVGFactory: unknown; export const DrawLayer: unknown; export const FeatureTest: unknown; export const ImageKind: unknown; export const InvalidPDFException: unknown; export const MathClamp: unknown; export const OPS: unknown; export const OutputScale: unknown; export const PDFDataRangeTransport: unknown; export const PDFDateString: unknown; export const PDFWorker: unknown; export const PasswordResponses: unknown; export const PermissionFlag: unknown; export const PixelsPerInch: unknown; export const RenderingCancelledException: unknown; export const ResponseException: unknown; export const SignatureExtractor: unknown; export const SupportedImageMimeTypes: unknown; export const TextLayer: unknown; export const TouchManager: unknown; export const Util: unknown; export const VerbosityLevel: unknown; export const XfaLayer: unknown; export const applyOpacity: unknown; export const build: unknown; export const createValidAbsoluteUrl: unknown; export const fetchData: unknown; export const findContrastColor: unknown; export const getFilenameFromUrl: unknown; export const getPdfFilenameFromUrl: unknown; export const getRGB: unknown; export const getUuid: unknown; export const getXfaPageViewport: unknown; export const isDataScheme: unknown; export const isPdfFile: unknown; export const isValidExplicitDest: unknown; export const noContextMenu: unknown; export const normalizeUnicode: unknown; export const renderRichText: unknown; export const setLayerDimensions: unknown; export const shadow: unknown; export const stopEvent: unknown; export const updateUrlHash: unknown; export const version: unknown;
  export const GlobalWorkerOptions: { workerSrc: string };
  export const getDocument: (options: { data: Uint8Array }) => unknown;
}

declare module "@rchunk/pdfjs-core" {
  export const AbortException: unknown; export const AnnotationEditorLayer: unknown; export const AnnotationEditorParamsType: unknown; export const AnnotationEditorType: unknown; export const AnnotationEditorUIManager: unknown; export const AnnotationLayer: unknown; export const AnnotationMode: unknown; export const AnnotationType: unknown; export const CSSConstants: unknown; export const ColorPicker: unknown; export const DOMSVGFactory: unknown; export const DrawLayer: unknown; export const FeatureTest: unknown; export const GlobalWorkerOptions: { workerSrc: string }; export const ImageKind: unknown; export const InvalidPDFException: unknown; export const MathClamp: unknown; export const OPS: unknown; export const OutputScale: unknown; export const PDFDataRangeTransport: unknown; export const PDFDateString: unknown; export const PDFWorker: unknown; export const PasswordResponses: unknown; export const PermissionFlag: unknown; export const PixelsPerInch: unknown; export const RenderingCancelledException: unknown; export const ResponseException: unknown; export const SignatureExtractor: unknown; export const SupportedImageMimeTypes: unknown; export const TextLayer: unknown; export const TouchManager: unknown; export const Util: unknown; export const VerbosityLevel: unknown; export const XfaLayer: unknown; export const applyOpacity: unknown; export const build: unknown; export const createValidAbsoluteUrl: unknown; export const fetchData: unknown; export const findContrastColor: unknown; export const getDocument: (options: { data: Uint8Array }) => unknown; export const getFilenameFromUrl: unknown; export const getPdfFilenameFromUrl: unknown; export const getRGB: unknown; export const getUuid: unknown; export const getXfaPageViewport: unknown; export const isDataScheme: unknown; export const isPdfFile: unknown; export const isValidExplicitDest: unknown; export const noContextMenu: unknown; export const normalizeUnicode: unknown; export const renderRichText: unknown; export const setLayerDimensions: unknown; export const shadow: unknown; export const stopEvent: unknown; export const updateUrlHash: unknown; export const version: unknown;
}

declare module "@rchunk/diff-worker-algorithm-parser" {
  export const n: unknown;
  export const t: () => void;
}
declare module "@rchunk/diff-worker-model-parser" {
  export const n: unknown;
  export const t: () => void;
}
declare module "@rchunk/diff-worker-renderer-parser" {
  export const n: unknown;
  export const t: () => void;
}
declare module "@rchunk/diff-worker-runtime-parser" {
  export const n: unknown;
  export const t: () => void;
}
declare module "@rchunk/diff-worker-utils-parser" {
  export const n: unknown;
  export const t: () => void;
}

declare module "@rchunk/katex-runtime" {
  export const c: () => void;
  export const l: {
    renderToString(source: string, options?: Record<string, unknown>): string;
  };
}

declare module "@rchunk/content-quick-chat-overlay" {
  export const i: () => void;
  export const n: () => void;
  export const r: { defaultValue: "compact"; key: string };
  export const t: (props: {
    children?: unknown;
    composerOnly?: boolean;
    hasElicitation?: boolean;
    onStop?(): void;
    renderTranscript?: (() => unknown) | null;
    statusState?: string;
    title?: string;
    titleContent?: unknown;
    workingStatus?: string;
  }) => unknown;
}

declare module "@rchunk/chatgpt-image-lightbox" { export interface LightboxImage { alt?: string; sourceLabel?: string; sourceUrl?: string; src: string } export const n: () => void; export const t: (props: { currentIndex?: number; images: LightboxImage[]; onClose(): void; onNavigate?(index: number): void; onRetry?(): void }) => unknown; }

declare module "@rchunk/panel" {
  export const n: () => void;
  export const t: (props: {
    clientAnalyticsHistory: readonly unknown[];
    conversationIdOverride: string | null;
    onClose(): void;
    showHeader: boolean;
  }) => unknown;
}

declare module "@rchunk/use-element-in-view" {
  export interface ElementInViewOptions {
    container: Element | null;
    target: Element | null;
  }
  export const n: (options: ElementInViewOptions) => boolean;
  export const t: () => void;
}

declare module "@rchunk/timestamp-separator" {
  export const i: () => void;
  export const n: () => void;
  export const r: (props: {
    children?: unknown;
    className?: string;
    isVisible: boolean;
  }) => unknown;
  export const t: (props: { nowMs?: number; sentAtMs: number }) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/triangle-warning" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-git-config-value" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-local-conversation-sources" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-realtime-voice-native-overlay-transition-enabled" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-resume-conversation-if-needed" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/worktree-setup-auto-fix" {
  export interface PendingWorktree {
    attempt: number;
    errorMessage?: string | null;
    hostId: string;
    id: string;
    launchMode: "fork-conversation" | "start-conversation";
    localEnvironmentConfigPath?: string | null;
    phase: "queued" | "creating" | "setting-up" | "worktree-ready" | "failed";
    setupOutputText: string;
    sourceCollaborationMode?: unknown;
    sourceWorkspaceRoot: string;
    sourceWorkspaceRoots: string[];
    startConversationParamsInput: Record<string, unknown> & { workspaceRoots: string[] };
    startingState: Record<string, unknown> & { type: string; remoteRef?: string | null };
    worktreeGitRoot?: string | null;
    worktreeOutputText: string;
    worktreeWorkspaceRoot?: string | null;
  }
  export const i: () => void;
  export const n: () => void;
  export const r: (props: {
    children?: unknown;
    isConversationStartFailed?: boolean;
    isConversationStarting?: boolean;
    onContinueWithoutUpdating?: () => void;
    pendingWorktree: PendingWorktree;
    upstreamRefreshMode?: "best-effort" | "never" | "required";
  }) => unknown;
  export const t: (input: {
    createPendingWorktree(options: Record<string, unknown>): unknown;
    intl: import("@rchunk/app-shared").IntlShape;
    pendingWorktree: PendingWorktree;
    scope: unknown;
    serviceTier: unknown;
  }) => Promise<unknown>;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/file-diff" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-writing-block-directive-renderer" {
  export interface WritingBlockDirective { content?: string; id?: string; metadata?: { recipients?: string[]; subject?: string }; title?: string; variant?: "document" | "email" | string }
  export interface CodexWritingBlockDirectiveRendererProps { directive: WritingBlockDirective; editable?: boolean; onBlur?(): void; onContentChange?(content: string): void; onRecipientChange?(recipients: string[]): void; onSubjectChange?(subject: string): void; render?(content: string): unknown }
  export const CodexWritingBlockDirectiveRenderer: (props: CodexWritingBlockDirectiveRendererProps) => unknown;
  const _default: unknown;
  export default _default;
}
declare module "@rchunk/editable-writing-block" { export interface EmailMetadata { bcc?: string; cc?: string; recipient?: string; subject?: string } export interface ToneSection { content: string; id: string; tone: string; [key: string]: unknown } export interface EditableWritingBlockProps { activeToneSectionId?: string; content?: string; editorKey?: string; emailMetadata?: EmailMetadata; externalContentUpdate?: { content: string; source?: string } | null; isEditable?: boolean; isInteractionDisabled?: boolean; onContentChange?(content: string): void; onEmailMetadataChange?(metadata: EmailMetadata): void; onToneSectionSelect?(id: string): void; proseMirrorStore?: unknown; render?(input: { renderView(props?: Record<string, unknown>): unknown; state: WritingBlockViewState }): unknown; testId?: string; title?: string; toneSections?: readonly ToneSection[] | null; variant?: "document" | "email" | string } export interface WritingBlockChangeState { changes: { text: string } | null; dismissed?: "copy" | "error"; expiresAt?: number | null; isStreaming: boolean; persistsUntilEdit: boolean } export interface WritingBlockChangeController { dismiss(reason: "copy" | "error"): void; getState(): WritingBlockChangeState | null; setState(state: WritingBlockChangeState | null): void } export interface WritingBlockViewState { activeToneSectionId?: string; content: string; isEditable: boolean; selectedToneSection?: ToneSection; toneSections: readonly ToneSection[] } export const a: { get(key: string): WritingBlockChangeController; clear(): void }; export const i: () => void; export const n: () => void; export const r: (scope: unknown, key: string) => void; export const t: (props: EditableWritingBlockProps) => unknown }
declare module "@rchunk/writing-block-app-capabilities" { export interface WritingBlockAppCapabilitiesProps extends import("@rchunk/editable-writing-block").EditableWritingBlockProps { conversationId?: string; context?: Record<string, unknown>; enableAiTools?: boolean; isExpanded?: boolean; isReadOnly?: boolean; librarySaveControls?: unknown; isStreaming?: boolean; messageId?: string; onAskForChanges?(content: string): void; onBeforeDocumentExport?(): Promise<void> | void; onOpenVersionHistory?(): void; onSuggestedFollowup?(prompt: string): void; renderFrame?(content: unknown): unknown; serverConversationId?: string; showMagicEditAction?: boolean; suggestedFollowupIneligibilityReason?: string | null; userEditedWritingBlock?: boolean; writingBlockId?: string; writingBlockIndex?: number } export const n: () => void; export const t: (props: WritingBlockAppCapabilitiesProps) => unknown }
declare module "@rchunk/writing-block-floating-slash-menu";
declare module "@rchunk/writing-block-copy-button";
declare module "@rchunk/chatgpt-writing-block-ai-tools";
declare module "@rchunk/slides-outline-template-picker";
declare module "@rchunk/writing-block-content-update" { export interface ToneSection { content: string; id: string; tone: string; [key: string]: unknown } export interface ToneSectionControllerInput { isPersistenceReady: boolean; isStreaming: boolean; metadata?: { active_option_id?: unknown } | null; onPersistSelection?(id: string): void; storedActiveToneSectionId?: string | null; toneSections?: readonly ToneSection[] | null } export interface ToneSectionController { activeToneSectionId?: string; displayedToneSections: readonly ToneSection[]; selectToneSection(id: string): void } export interface ContentUpdateInput { nextContent: string; toneSectionId?: string | null; toneSections?: readonly ToneSection[] | null } export const a: () => void; export const i: () => void; export const n: <T extends Record<string, unknown>>(metadata: T, toneSections: readonly ToneSection[] | null | undefined) => T & { tone_sections?: Array<{ content: string; id: string; label: string }> }; export const o: (input: ToneSectionControllerInput) => ToneSectionController; export const r: (sections: readonly ToneSection[] | null | undefined, id: string | null | undefined) => { id?: string; index?: number; isOriginal: boolean }; export const t: (input: ContentUpdateInput) => { activeToneSectionId?: string; content: string; toneSections?: readonly ToneSection[] | null } }
declare module "@rchunk/writing-block-directive-renderer" { export interface ContentReference { id?: string; replacement?: string; text?: string } export interface ToneSection { content: string; id: string; tone: string; [key: string]: unknown } export interface ParsedWritingBlock { bodyContent: string; content: string; emailMetadata: { bcc?: string; cc?: string; recipient?: string; subject?: string }; id?: string; metadata?: Record<string, unknown>; title?: string; toneSections?: ToneSection[]; variant?: string } export interface WritingBlockDirectiveProps { attributes?: Record<string, unknown>; contentReferences?: readonly ContentReference[]; isStreaming?: boolean; rawText?: string | null; renderExtension?(block: ParsedWritingBlock): unknown; renderPersisted?(block: ParsedWritingBlock): unknown; testId?: string } export const a: <T extends { content: string; edited?: boolean; locallyEdited?: boolean; metadata?: Record<string, unknown> }>(block: T, context: { contentReferences?: readonly ContentReference[]; isStreaming?: boolean }) => T; export const c: (input: { content: string; metadata?: Record<string, unknown>; preserveEmptySections?: boolean }) => ToneSection[] | undefined; export const i: (metadata: Record<string, unknown> | undefined, context: { contentReferences?: readonly ContentReference[]; isStreaming?: boolean }) => Record<string, unknown> | undefined; export const l: () => void; export const n: () => void; export const o: () => void; export const r: (content: string, context: { contentReferences?: readonly ContentReference[]; isStreaming?: boolean }) => string; export const s: (value: unknown) => Record<string, unknown> | undefined; export const t: (props: WritingBlockDirectiveProps) => unknown }

declare module "@rchunk/app-initial" {
  export const GRt: (...arguments_: unknown[]) => unknown;
  export const HRt: new (...arguments_: unknown[]) => Error;
  export const JRt: (...arguments_: unknown[]) => unknown;
  export const KRt: () => void;
  export const URt: number;
  export const WRt: number;
  export const XRt: (...arguments_: unknown[]) => unknown;
  export const YRt: (...arguments_: unknown[]) => unknown;
  export const qRt: (...arguments_: unknown[]) => unknown;
  export const kHt: () => unknown;
}

declare module "@rchunk/active-tool-activity-label" {
  export const n: () => void;
  export const t: (activity: Record<string, unknown>) => { activityKey?: string; icon: string; message: string; values?: Record<string, string> };
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/book-open" {
  export const n: () => void;
  export const t: (props?: Record<string, unknown>) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/computer-use-native-app-metadata" {
  export const n: (reference: ({ kind: "appId"; appId: string; metadata?: Record<string, unknown> } | { kind: "displayName"; displayName: string; metadata?: Record<string, unknown> } | null)) => Record<string, unknown> | null;
  export const t: () => void;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/diff-preview-tooltip" {
  export const n: () => void;
  export const t: (props: { children?: unknown; diff: { metadata?: unknown }; disabled?: boolean; displayPath?: string; linesAdded?: number; linesRemoved?: number; onOpen?(): void }) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/elicitation-events" {
  export const n: (store: { emit?(event: Record<string, unknown>): void }, event: Record<string, unknown>, action: string) => void;
  export const r: (...arguments_: unknown[]) => (() => void) | undefined;
  export const t: () => void;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/exec-shell-container" {
  export const n: () => void;
  export const r: (props?: Record<string, unknown>) => unknown;
  export const t: ((props: { command: string; cwd?: string; footer?: unknown; isInProgress?: boolean; output: string; surface?: "default" | "plain" }) => unknown) & {
    Footer(props: { exitCode?: number; isInProgress?: boolean; isSuccess?: boolean; wasInterrupted?: boolean }): unknown;
  };
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks-settings-route" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-app-analytics" {
  export const n: () => void;
  export const t: (app: Record<string, unknown> | null | undefined) => string | undefined;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-activity-label" {
  export interface McpToolIntl { formatMessage(descriptor: { defaultMessage: string; description?: string; id?: string }, values?: Record<string, unknown>): string }
  export interface MatchingMcpApp { id: string; name: string; pluginDisplayNames?: string[] }
  export interface McpToolActivityInput { appContext?: { actionName?: string; appName?: string; connectorId: string } | null; completed?: boolean; intl: McpToolIntl; matchingApp?: MatchingMcpApp | null; nativeDesktopAppMetadata?: { name?: string } | null; platform?: string; serverName?: string | null; source?: { backend?: string; kind?: string } | null; toolArguments?: unknown; toolName: string; toolResult?: unknown }
  export const i: () => void;
  export const n: (input: { approval: { connector_id: string; connector_name?: string | null; tool_name?: string | null; tool_params?: unknown; tool_title?: string | null }; matchingApp?: MatchingMcpApp | null }) => string | null;
  export const r: (input: Pick<McpToolActivityInput, "appContext" | "matchingApp" | "toolName">) => string;
  export const t: (input: McpToolActivityInput) => string;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-approval-message" {
  export interface McpApprovalReplyProps { conversationId: string; hostId: string; requestId: string; onReply?(reply: "accept" | "decline"): Promise<void> | void }
  export const a: (props: McpApprovalReplyProps & { suggestion: { tool_name?: string; tool_title?: string } }) => unknown;
  export const c: () => void; export const d: (props: { authorization: { origin: string; scopes: Array<{ label: string; scope: string }> } }) => unknown; export const f: () => void; export const i: () => void;
  export const l: (props: { description?: unknown; icon?: unknown; isPrimaryActionLoading?: boolean; primaryActionLabel: string; secondaryActionLabel?: string; showDeclineShortcut?: boolean; title: unknown; onDecline(): void; onPrimaryActionClick?(): void; onSubmit(): void }) => unknown;
  export const n: () => void; export const o: (props: McpApprovalReplyProps & { title?: string; message?: string }) => unknown; export const r: (props: McpApprovalReplyProps & { action: { message?: string; url: string } }) => unknown; export const s: (props: McpApprovalReplyProps & { auth: { connector?: { connector_name?: string }; reason?: string } }) => unknown; export const t: (props: { message: { descriptor?: { defaultMessage?: string }; values?: Record<string, unknown>; url?: string } }) => unknown; export const u: () => void;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-item-content" {
  export interface McpToolItem { appContext?: { actionName?: string; appName?: string; connectorId: string } | null; callId: string; invocation: { arguments?: unknown; server?: string | null; tool: string }; result?: { error?: string; raw?: unknown; type: "error" | "success" } | null; threadId?: string }
  export const a: () => null; export const c: () => void; export const d: (input: { pluginId?: string | null; plugins: Array<{ composerIconPath?: string; logoPath?: string; plugin: { id: string; name?: string } }>; serverName?: string | null }) => { alt: string; logoUrl?: string } | null; export const f: () => void; export const i: () => void; export const l: (props: { fallback?: unknown; item: McpToolItem }) => unknown; export const n: () => void; export const o: () => void;
  export const r: (props: { automations: Array<{ id: string; isEnabled?: boolean; nextRunAt?: string | null; scheduleLabel?: string | null; title: string }>; onOpen?(id: string): void }) => unknown;
  export const s: (props: { automation: { id: string; isEnabled?: boolean; nextRunAt?: string | null; scheduleLabel?: string | null; title: string }; onOpen?(id: string): void }) => unknown;
  export const t: (props: { expandedContentOnly?: boolean; hostId?: string; item: McpToolItem; matchingApp?: import("@rchunk/mcp-tool-activity-label").MatchingMcpApp | null; onExpand?(): void; summary?: string | null }) => unknown;
  export const u: () => void;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/partition" {
  export const t: <Value>(values: Value[], predicate: (value: Value, index: number) => boolean) => [Value[], Value[]];
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-summary-item-content" {
  export const a: (props: { disabled?: boolean; rating?: "down" | "up" | null; variant?: "imageOverlay" | "imageTurn" | "response"; onRate(rating: "down" | "up" | null): void }) => unknown;
  export const i: () => void; export const n: () => void; export const o: () => void; export const r: (onFeedback: (details: string, rating: "down" | "up") => void) => (rating: "down" | "up", details?: string) => void;
  export const t: (props: { conversationId: string; cwd?: string | null; hideCodeBlocks?: boolean; item: { content: string }; showOpenButton?: boolean; title?: string; turnId?: string; onOpen?(content: string): void }) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/undo" {
  export const n: () => void;
  export const t: (props?: Record<string, unknown>) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/artifact-file-preview-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/automation-delete-confirmation-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/bookmarked-thread-user-message-navigation" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/command-execution-command" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/conversation-source" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/creation-target-query" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/environment-labels" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/git-action-new-branch-field" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-artifacts-signals" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-external-resource-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-git-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-plan-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-side-chat" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-summary-panel-image-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-thread-turn-entries" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-webmcp-tools-model" {
  const _default: unknown;
  export default _default;
}

// @rchunk/local-environment-editor is declared above with its semantic API.

declare module "@rchunk/local-environment-workflow-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/lock" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-picker-chevron-down-sm" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-terminal-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-sources-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-code-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pending-onboarding" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugin-picker-menu-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/publish-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-detail-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-fix-workflow" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-status-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-handoff-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-launch-surface" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-motion" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-stage-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/remote-hosted-pip-anchor-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/result-values" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/runtime" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-keys" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/setup-artwork" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-handoff-modal" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-pin-shortcut-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-scroll-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/timestamp-separator" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/triangle-warning" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-git-config-value" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-local-conversation-sources" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-realtime-voice-native-overlay-transition-enabled" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-resume-conversation-if-needed" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/worktree-setup-auto-fix" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/file-diff" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-writing-block-directive-renderer" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/active-tool-activity-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/book-open" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/computer-use-native-app-metadata" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/diff-preview-tooltip" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/elicitation-events" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/exec-shell-container" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks-settings-route" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-app-analytics" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-activity-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-approval-message" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-item-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/partition" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-summary-item-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/undo" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/artifact-file-preview-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/automation-delete-confirmation-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/bookmarked-thread-user-message-navigation" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/command-execution-command" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/conversation-source" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/creation-target-query" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/environment-labels" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/git-action-new-branch-field" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-artifacts-signals" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-external-resource-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-git-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-plan-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-side-chat" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-summary-panel-image-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-thread-turn-entries" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-webmcp-tools-model" {
  const _default: unknown;
  export default _default;
}

// @rchunk/local-environment-editor is declared above with its semantic API.

declare module "@rchunk/local-environment-workflow-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/lock" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-picker-chevron-down-sm" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-terminal-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-sources-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-code-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pending-onboarding" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugin-picker-menu-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/publish-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-detail-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-fix-workflow" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-status-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-handoff-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-launch-surface" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-motion" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-stage-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/remote-hosted-pip-anchor-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/result-values" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/runtime" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-keys" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/setup-artwork" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-handoff-modal" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-pin-shortcut-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-scroll-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/timestamp-separator" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/triangle-warning" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-git-config-value" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-local-conversation-sources" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-realtime-voice-native-overlay-transition-enabled" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-resume-conversation-if-needed" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/worktree-setup-auto-fix" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/file-diff" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-writing-block-directive-renderer" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/active-tool-activity-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/book-open" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/computer-use-native-app-metadata" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/diff-preview-tooltip" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/elicitation-events" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/exec-shell-container" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks-settings-route" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-app-analytics" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-activity-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-approval-message" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/mcp-tool-item-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/partition" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-summary-item-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/undo" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/artifact-file-preview-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/automation-delete-confirmation-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/bookmarked-thread-user-message-navigation" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/command-execution-command" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/conversation-source" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/creation-target-query" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/environment-labels" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/git-action-new-branch-field" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-artifacts-signals" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-external-resource-icon" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-git-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-plan-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-side-chat" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-summary-panel-image-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-thread-turn-entries" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-webmcp-tools-model" {
  const _default: unknown;
  export default _default;
}

// @rchunk/local-environment-editor is declared above with its semantic API.

declare module "@rchunk/local-environment-workflow-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/lock" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-picker-chevron-down-sm" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-terminal-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-sources-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-code-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pending-onboarding" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugin-picker-menu-content" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/publish-actions" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-detail-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-fix-workflow" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-status-label" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-handoff-target" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-launch-surface" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-motion" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/realtime-voice-stage-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/remote-hosted-pip-anchor-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/result-values" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/runtime" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-keys" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/setup-artwork" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/side-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-handoff-modal" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-pin-shortcut-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-scroll-layout" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/timestamp-separator" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/triangle-warning" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-git-config-value" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-local-conversation-sources" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-realtime-voice-native-overlay-transition-enabled" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/use-resume-conversation-if-needed" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/worktree-setup-auto-fix" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/file-diff" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-writing-block-directive-renderer" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/gitlab-merge-request-form-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chat-tab-metadata-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/content-quick-chat-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/delete-archived-chats-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/document-title" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/latest-turn-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-stream-role-product-event" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-and-reasoning-effort-translations" {
  export interface ReasoningEffortTranslationProps {
    effort: string;
  }
  export const n: () => void;
  export const t: (props: ReasoningEffortTranslationProps) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-agent" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-subagents-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/right-panel-composer-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-app-shell-chrome" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-emoji" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-overflow-menu" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-panel-toggle-button" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-usage-breakdown" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chat-tab-metadata-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/content-quick-chat-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/delete-archived-chats-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/document-title" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/latest-turn-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-stream-role-product-event" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-and-reasoning-effort-translations" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-agent" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-subagents-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/right-panel-composer-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-app-shell-chrome" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-emoji" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-overflow-menu" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-panel-toggle-button" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-usage-breakdown" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chat-tab-metadata-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/content-quick-chat-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/delete-archived-chats-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/document-title" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/latest-turn-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-stream-role-product-event" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-and-reasoning-effort-translations" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-agent" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-subagents-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/right-panel-composer-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-app-shell-chrome" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-emoji" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-overflow-menu" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-panel-toggle-button" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-usage-breakdown" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chat-tab-metadata-bridge" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/content-quick-chat-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/delete-archived-chats-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/document-title" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/latest-turn-preview" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/local-conversation-stream-role-product-event" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/model-and-reasoning-effort-translations" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-background-agent" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-local-conversation-subagents-panel" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-thread-pull-request-side-panel-tab" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/right-panel-composer-overlay" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-app-shell-chrome" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-emoji" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-overflow-menu" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-panel-toggle-button" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/thread-usage-breakdown" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/theme-font-face-loader" {
  export const n: (
    fontFace: import("@rchunk/theme-font-family").ThemeFontFace,
  ) => Promise<boolean>;
  export const r: (selections: readonly Record<string, unknown>[]) => Promise<void>;
  export const t: () => void;
}

declare module "@rchunk/modulepreload-polyfill" {
  export const t: () => void;
}

declare module "@rchunk/theme-font-family" {
  export interface ThemeFontFace {
    family: string;
    fullName: string;
    postscriptName: string;
  }
  export const a: (fontFace: ThemeFontFace) => string;
  export const i: (fontFamily: string) => string;
  export const n: (fontFamily: string) => string;
  export const o: (
    fontFamily: string | null | undefined,
    fontFace: ThemeFontFace | null | undefined,
  ) => string | null | undefined;
  export const r: (fontFamily?: string | null) => string | undefined;
  export const s: () => void;
  export const t: (
    fontFamily: string | null | undefined,
    fontFace: ThemeFontFace,
  ) => boolean;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chatgpt-accent-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/dock-icon-setting-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/import-settings-gate" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/middle-truncated-text" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/notifications-settings" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/app-primary" {
  /** updateAccountSetting: updates one account-scoped ChatGPT setting. */
  export const Gp: (
    scope: unknown,
    accountId: string,
    setting: string,
    value: unknown,
  ) => Promise<unknown>;
  /** initializeAccountSettings: prepares account-setting mutations. */
  export const Wp: () => void;
}

declare module "@rchunk/permissions-mode-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugins-settings-row" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/settings-route-state" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chatgpt-accent-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/dock-icon-setting-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/import-settings-gate" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/middle-truncated-text" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/notifications-settings" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/permissions-mode-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugins-settings-row" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/settings-route-state" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chatgpt-accent-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/dock-icon-setting-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/import-settings-gate" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/middle-truncated-text" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/notifications-settings" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/permissions-mode-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugins-settings-row" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/settings-route-state" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chatgpt-accent-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/dock-icon-setting-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/import-settings-gate" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/middle-truncated-text" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/notifications-settings" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/permissions-mode-visibility" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plugins-settings-row" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/settings-route-state" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/file-diff-alt" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-browser" {
  export interface SecurityQrCodeApi {
    create(value: string | Uint8Array, options?: Record<string, unknown>): unknown;
    toCanvas(...arguments_: unknown[]): Promise<unknown> | void;
    toDataURL(...arguments_: unknown[]): Promise<string> | void;
    toString(value: string | Uint8Array, options?: Record<string, unknown>): Promise<string>;
  }
  export const t: SecurityQrCodeApi;
}

declare module "@rchunk/security-client" {
  export interface SecurityQuery {
    queryFn(context: { signal?: AbortSignal }): Promise<unknown>;
    queryKey: string[];
    refetchOnWindowFocus?: "always";
    retry: false;
    staleTime: number;
  }
  export interface SecurityQueries {
    addPassword: SecurityQuery;
    changePassword: SecurityQuery;
    cyber: SecurityQuery;
    linkedApps: SecurityQuery;
    mfa: SecurityQuery;
    protection: SecurityQuery;
    sessions: SecurityQuery;
  }
  export interface SecurityApiClient {
    safeGet(path: string, options: Record<string, unknown>): Promise<unknown>;
  }
  export const n: (accountId: string) => SecurityQueries;
  export const r: SecurityApiClient;
  export const t: () => void;
}

declare module "@rchunk/linked-app-logo" {
  export interface LinkedApplicationLogoProps {
    app: { client_app_type?: string; logo_uri?: string | null; name: string };
    borderless?: boolean;
    size?: "detail" | "list";
  }
  export interface AccountConnectionLogoProps {
    app: {
      name: string;
      type: "apple" | "codex_cli" | "kakao_talk" | "oai_apps" | "viber";
    };
    borderless?: boolean;
  }
  export const n: (props: LinkedApplicationLogoProps) => unknown;
  export const r: () => void;
  export const t: (props: AccountConnectionLogoProps) => unknown;
}

declare module "@rchunk/security-messages" {
  export const n: () => void;
  export const t: {
    description: import("@rchunk/app-shared").MessageDescriptor;
    title: import("@rchunk/app-shared").MessageDescriptor;
  };
}

declare module "@rchunk/security-shared" {
  export interface SecuritySubpageProps {
    action?: unknown;
    children?: unknown;
    onBack(): void;
    subtitle?: unknown;
    title: unknown;
  }
  export interface SecurityLoadingStateProps {
    isError: boolean;
    onRetry(): void;
  }
  export interface SecurityConfirmationDialogProps {
    children?: unknown;
    confirmLabel: unknown;
    informational?: boolean;
    isError?: boolean;
    isPending?: boolean;
    onClose(): void;
    onConfirm(): void;
    title: unknown;
  }
  export const i: () => void;
  export const n: (props: SecurityLoadingStateProps) => unknown;
  export const r: (props: SecuritySubpageProps) => unknown;
  export const t: (props: SecurityConfirmationDialogProps) => unknown;
}

declare module "@rchunk/security-src" {
  export interface SecurityPermissionMessage {
    defaultMessage: string;
    description: string;
    id: string;
  }
  export const a: (scope: string) => SecurityPermissionMessage | undefined;
  export const i: (scope: string) => SecurityPermissionMessage | undefined;
  export const n: Record<string, SecurityPermissionMessage | undefined>;
  export const o: () => void;
  export const r: Record<string, SecurityPermissionMessage>;
  export const t: () => void;
}

declare module "@rchunk/security-tabs" {
  export interface SecurityTabItem {
    closeLabel?: string;
    icon?: unknown;
    key: string;
    name: unknown;
    onClose?(): void;
    panelId?: string;
  }
  export interface SecurityTabsProps {
    activationMode?: "automatic" | "manual";
    ariaLabel?: string;
    ariaLabelledBy?: string;
    className?: string;
    fill?: boolean;
    onSelect(key: string): void;
    scrollable?: boolean;
    selectedKey: string;
    tabListRef?: unknown;
    tabs: SecurityTabItem[];
    variant?:
      | "browse"
      | "filter"
      | "inset"
      | "page"
      | "pill"
      | "profile"
      | "segmented"
      | "toolbar"
      | "underline";
  }
  export const n: () => void;
  export const t: (props: SecurityTabsProps) => unknown;
}

declare module "@rchunk/sidebar-panel" {
  export interface SidebarPanelDictationRenderState {
    dictationButton: unknown;
    isBusy: boolean;
    isDictating: boolean;
    recordingOverlay: unknown;
  }
  export interface SidebarPanelDictationProps {
    children(state: SidebarPanelDictationRenderState): unknown;
    onBusyChange?(busy: boolean): void;
    onChange(value: string): void;
    onSubmit(value: string): void;
    tooltipPortalContainer?: Element | null;
    value: string;
  }
  export const a: (props: SidebarPanelDictationProps) => unknown;
  export const i: Record<string, unknown>;
  export const n: (children: unknown, open: boolean) => unknown;
  export const o: () => void;
  export const r: () => void;
  export const t: () => void;
}

declare module "@rchunk/confirmation" {
  export const LockdownConfirmation: (props: {
    disablesDeveloperMode: boolean;
    isPending: boolean;
    onClose(): void;
    onConfirm(): void;
  }) => unknown;
}

declare module "@rchunk/history" {
  export const SecurityHistorySettings: (props: {
    accountId: string;
    onBack(): void;
  }) => unknown;
}

declare module "@rchunk/order-yubikey-dialog" {
  export const OrderYubikeyDialog: (props: {
    accountId: string;
    onClose(): void;
  }) => unknown;
}

declare module "@rchunk/security-keys" {
  export interface SecurityKeysIconProps extends Record<string, unknown> {
    className?: string;
  }
  export const n: () => void;
  export const t: (props: SecurityKeysIconProps) => unknown;
}

declare module "@rchunk/use-resume-conversation-if-needed" {
  export interface ResumeConversationState {
    hasResumeFailed: boolean;
    isResuming: boolean;
    isUnavailable: boolean;
    isWriterConflict: boolean;
    retryResume(): void;
  }
  export const n: (
    conversationId: string | null,
    threadAccess: "shared" | "private" | string,
  ) => ResumeConversationState;
  export const t: () => void;
}

declare module "@rchunk/settings-route-state" {
  export const a: (value: unknown) => {
    hasValue: boolean;
    workspaceRoot: string | null;
  };
  export const i: (value: unknown) => boolean;
  export const n: (value: unknown) => boolean;
  export const o: () => void;
  export const r: (value: unknown) => string | null;
  export const t: (value: unknown) => boolean;
}

declare module "@rchunk/settings-host-dropdown" {
  export interface SettingsHostDropdownProps {
    align?: "center" | "end" | "start";
    connectedRemoteConnections: Array<{ displayName: string; hostId: string }>;
    contentWidth?: string;
    disabled?: boolean;
    includeLocalHost?: boolean;
    localIcon?: unknown;
    localLabel?: string;
    onSelectHost(hostId: string): void;
    selectedHostId: string;
    showConnectedIndicator?: boolean;
    triggerVariant?: "filter" | "selected-host";
  }
  export const n: () => void;
  export const t: (props: SettingsHostDropdownProps) => unknown;
}

declare module "@rchunk/personalization-state" {
  export interface ReferencePhoto extends Record<string, unknown> {
    created_at: string;
    id: string;
    kind: string;
  }
  export const a: (accountId: string) => Record<string, unknown>;
  export const i: () => void;
  export const n: () => void;
  export const o: (
    photos: ReferencePhoto[] | null | undefined,
    kind?: string | null,
  ) => ReferencePhoto | null;
  export const r: unknown;
  export const s: (scope: unknown, input: Record<string, unknown>) => Promise<ReferencePhoto>;
  export const t: unknown;
}

declare module "@rchunk/plugins-settings-row" {
  export const n: () => void;
  export const t: (props: { hostId: string }) => unknown;
}

declare module "@rchunk/settings-loading-row" {
  export const n: () => void;
  export const t: (props: { children?: unknown }) => unknown;
}

declare module "@rchunk/dock-icon-setting-visibility" {
  export const n: () => void;
  export const t: (props: {
    buildFlavor?: string;
    dockIconPreviews: unknown;
    platform: string;
  }) => unknown;
}

declare module "@rchunk/import-settings-gate" {
  export const n: () => void;
  export const t: string;
}

declare module "@rchunk/chronicle-settings" {
  export const n: () => void;
  export const t: string;
}

declare module "@rchunk/memory-manager-gate" {
  export const n: () => void;
  export const t: () => string;
}

declare module "@rchunk/hooks-settings-copy" {
  export const a: () => void;
  export const i: (value: string | null | undefined) => string | null;
  export const n: (eventName: string, intl: import("@rchunk/app-shared").IntlShape) => string | undefined;
  export const r: (index: number, intl: import("@rchunk/app-shared").IntlShape) => string;
  export const t: (eventName: string, intl: import("@rchunk/app-shared").IntlShape) => string | undefined;
}

declare module "@rchunk/hooks-settings-model" {
  export const a: (hooks: Array<Record<string, unknown>>, eventName: string) => Array<Record<string, unknown>>;
  export const c: (...arguments_: unknown[]) => string[] | undefined;
  export const d: (...arguments_: unknown[]) => unknown;
  export const f: (...arguments_: unknown[]) => string | null | undefined;
  export const i: (...arguments_: unknown[]) => Array<Record<string, unknown>>;
  export const l: (...arguments_: unknown[]) => Array<Record<string, unknown>>;
  export const m: (hook: Record<string, unknown>) => boolean;
  export const n: (...arguments_: unknown[]) => { issueCount: number; needsReview: number };
  export const o: (hooks: Array<Record<string, unknown>>) => number;
  export const p: () => void;
  export const r: (...arguments_: unknown[]) => Array<Record<string, unknown>>;
  export const s: (...arguments_: unknown[]) => string[];
  export const t: "__unknown__";
  export const u: (...arguments_: unknown[]) => Record<string, unknown> | null;
}

declare module "@rchunk/computer-history-query" {
  export const a: () => void;
  export const i: unknown;
  export const n: unknown;
  export const r: unknown;
  export const t: string[];
}

declare module "@rchunk/chronicle-service-queries" {
  export const C: () => Record<string, unknown>;
  export const S: () => void;
  export const _: (...arguments_: unknown[]) => Record<string, unknown>;
  export const a: () => void;
  export const b: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
  export const c: unknown;
  export const d: unknown;
  export const f: () => void;
  export const g: () => Record<string, unknown>;
  export const h: () => void;
  export const i: unknown;
  export const l: unknown;
  export const m: (settings: Record<string, unknown>) => Record<string, unknown>;
  export const n: unknown;
  export const o: unknown;
  export const p: (settings: Record<string, unknown>, bundleIdentifier: string) => boolean;
  export const r: unknown;
  export const s: unknown;
  export const t: unknown;
  export const u: unknown;
  export const v: () => void;
  export const x: (...arguments_: unknown[]) => Promise<void>;
  export const y: (...arguments_: unknown[]) => void;
}

declare module "@rchunk/recent-uploads" {
  export const n: () => void;
  export const r: unknown;
  export const t: (record: { file_id: string }) => Promise<Record<string, unknown>>;
}

declare module "@rchunk/chatgpt-image-home" {
  export const a: Record<string, string>;
  export const i: { $type: string };
  export const n: { $type: string };
  export const o: () => void;
  export const r: { $type: string };
  export const t: Record<string, string>;
}

declare module "@rchunk/virtual-try-on" {
  export const C: () => void;
  export const S: Record<string, string>;
  export const _: { $type: string };
  export const a: { $type: string };
  export const b: Record<string, string>;
  export const c: { $type: string };
  export const d: { $type: string };
  export const f: Record<string, string>;
  export const g: Record<string, string>;
  export const h: { $type: string };
  export const i: Record<string, string>;
  export const l: Record<string, string>;
  export const m: Record<string, string>;
  export const n: { $type: string };
  export const o: Record<string, string>;
  export const p: { $type: string };
  export const r: Record<string, string>;
  export const s: { $type: string };
  export const t: { $type: string };
  export const u: { $type: string };
  export const v: Record<string, string>;
  export const x: { $type: string };
  export const y: { $type: string };
}

declare module "@rchunk/chatgpt-desktop-auth-url" {
  export const a: (options: Record<string, unknown>) => Promise<unknown>;
  export const i: () => void;
  export const n: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
  ) => string | undefined;
  export const r: () => void;
  export const t: (options: Record<string, unknown>) => string;
}

declare module "@rchunk/codex-mobile-setup-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-mobile-setup-flow" {
  export interface RemoteControlClient { clientId: string; name?: string }
  export type RemoteControlStatus = "disabled" | "errored" | "connecting" | "connected";
  export type MobileSetupStep = "initial" | "allow-host" | "mfa-required" | "waiting" | "connected" | "dismiss";
  export const a: (input: { initialRemoteControlStatus?: RemoteControlStatus; isMfaSetupRequiredError?: boolean; mfaSetupRequired?: boolean; remoteControlStatus?: RemoteControlStatus; setupStepDebugOverride?: string }) => boolean;
  export const c: Readonly<{ refetchInterval: 1000; staleTime: 0 }>;
  export const d: (clients: RemoteControlClient[] | null | undefined, existingClientIds: Set<string>) => "connected" | "dismiss" | null;
  export const f: (clients: RemoteControlClient[] | null | undefined, localClientId: string | null | undefined) => RemoteControlClient[] | undefined;
  export const i: () => void; export const l: () => void; export const n: () => void; export const o: () => void;
  export const p: (clients: RemoteControlClient[] | null | undefined, existingClientIds: Set<string>) => boolean;
  export const r: (input: { isMfaSetupRequiredError?: boolean; mfaSetupRequired?: boolean; remoteControlStatus?: RemoteControlStatus }) => "initial" | "mfa-required" | undefined;
  export const s: Readonly<{ staleTime: 30000 }>;
  export const t: (props: { initialStep?: MobileSetupStep | null; remoteControlHostEnabled?: boolean; clients?: RemoteControlClient[] | null; existingClientIds?: Set<string>; localRemoteControlClientId?: string | null; setupInProgress?: boolean; showAllowHostError?: boolean; showStartSetupError?: boolean; variant?: "dialog" | "page"; onAllowHost?(): void; onClose(): void; onSkip?(): void; onStartSetup?(): void }) => unknown;
  export const u: (input: { remoteControlHostEnabled?: boolean; hasEnrolledRemoteControlClient?: boolean }) => MobileSetupStep;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/onboarding-login-content" {
  export type LoginMethodState =
    | { status: "loading" | "error" | "unsupported" }
    | { status: "ready"; api: boolean; chatgpt: boolean };
  export const a: () => void;
  export const i: () => void;
  export const n: () => void;
  export const o: import("@rchunk/app-shared").ScopedDerivedFamily<
    Record<string, unknown>,
    string,
    LoginMethodState
  >;
  export const r: (props: { hostId: string }) => unknown;
  export const t: (props: {
    allowApiKey: boolean;
    allowChatGpt: boolean;
    apiKeySecondaryActionLabel: unknown;
    apiKeyValue: string;
    isApiKeyEntryVisible: boolean;
    isApiKeySignInPending: boolean;
    isChatGptSignInPending: boolean;
    onApiKeySecondaryAction(): void;
    onApiKeySubmit(): void;
    onApiKeyValueChange(value: string): void;
    onChatGptSignIn(): void;
    onShowApiKeyEntry(): void;
  }) => unknown;
}

declare module "@rchunk/remote-connection-editor-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/remote-connection-editor-draft" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-micro-analog-action-title" {
  export const n: () => void;
  export const t: (
    action: Record<string, unknown>,
    skills: readonly Record<string, unknown>[],
    intl: import("@rchunk/app-shared").IntlShape,
  ) => string;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-micro-commands" {
  export const i: () => void;
  export const n: (commandId: string) => Record<string, unknown> | null;
  export const r: (commandId: string) => number | null;
  export const t: Array<Record<string, unknown>>;
}

declare module "@rchunk/codex-micro-bridge" {
  export const CodexMicroBridge: () => null;
}

declare module "@rchunk/codex-micro-keyboard-surface" {
  export interface KeycapDefinition {
    icon: string;
    id: string;
  }
  export interface AgentSlotPreview {
    selected?: boolean;
    status?: import("@rchunk/app-shared").CodexMicroStatus;
    threadKey?: string | null;
    title?: string | null;
  }
  export const a: () => void;
  export const c: (props: { children?: unknown; className?: string }) => unknown;
  export const d: readonly string[];
  export const f: number;
  export const i: (props: { children?: unknown; className?: string }) => unknown;
  export const l: (props: { className?: string; keycap: KeycapDefinition }) => unknown;
  export const n: (props: {
    ariaLabel?: string;
    isPressed?: boolean;
    pulse?: "clockwise" | "counterclockwise" | null;
  }) => unknown;
  export const o: (props: {
    assignmentTitle?: string | null;
    isPressed?: boolean;
    keycap?: KeycapDefinition | null;
    onClick?: () => void;
    position: number;
    showTooltip?: boolean;
    slot?: AgentSlotPreview | null;
  }) => unknown;
  export const p: () => void;
  export const r: () => unknown;
  export const s: () => void;
  export const t: (props: {
    className?: string;
    joystick: { angle: number; distance: number };
  }) => unknown;
  export const u: () => void;
}

declare module "@rchunk/codex-micro-joystick-feedback" {
  export type Direction = "up" | "right" | "down" | "left";
  export interface JoystickEvent { angle: number; distance: number }
  export interface Feedback {
    action: Record<string, unknown> | null;
    direction: Direction;
    event: JoystickEvent;
    gameActivationProgress?: number;
    status: "game-gesture" | "tracking" | "triggered" | "unassigned" | "unavailable";
    visible: boolean;
  }
  export const a: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    update: {
      activeDirection: Direction | null;
      enabled: boolean;
      event: JoystickEvent;
      executionStatus?: Feedback["status"] | null;
      mapping: Partial<Record<Direction, Record<string, unknown> | null>>;
      previousActiveDirection: Direction | null;
    },
  ) => Feedback;
  export const i: (scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>) => void;
  export const n: (scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>) => void;
  export const o: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    event: JoystickEvent,
    progress: number,
  ) => void;
  export const r: () => void;
  export const t: import("@rchunk/app-shared").ScopedSignal<Record<string, unknown>, Feedback>;
}

declare module "@rchunk/codex-micro-joystick-hud" {
  export const CodexMicroJoystickHud: () => unknown;
}

// @rchunk/play-outline is declared above with its semantic icon props.

declare module "@rchunk/codex-micro-layout" {
  export type KeycapAction =
    | { type: "command"; command: string }
    | { type: "composer-text"; label: string; text: string }
    | { type: "custom-shortcut" }
    | { type: "external-url"; label: string; url: string }
    | { type: "named"; label: string };
  export interface KeycapDefinition {
    action: KeycapAction;
    icon: string;
    id: string;
    size: "single" | "double";
  }
  export interface SlotConfig extends Record<string, unknown> {
    action?:
      | { type: "command"; commandId: string }
      | { type: "composer-text"; label: string; text: string }
      | { type: "skill"; skillName: string; skillPath?: string };
    commandId?: string;
    keycapId: string;
  }
  export const a: (slot: SlotConfig) => Record<string, unknown> | null;
  export const c: <T extends import("@rchunk/app-shared").CodexMicroConfig>(config: T, key: string, value: unknown) => T;
  export const d: (keycap: KeycapDefinition) => string[];
  export const f: () => void;
  export const i: (value: unknown) => import("@rchunk/app-shared").CodexMicroConfig;
  export const l: (
    config: import("@rchunk/app-shared").CodexMicroConfig,
    slotId: string,
    assignment: SlotConfig,
  ) => import("@rchunk/app-shared").CodexMicroConfig;
  export const n: (slotId: string) => KeycapDefinition[];
  export const o: () => void;
  export const r: (keycapId: string) => KeycapDefinition;
  export const s: <T extends import("@rchunk/app-shared").CodexMicroConfig>(config: T, key: string, value: unknown) => T;
  export const t: (value: string) => string | null;
  export const u: KeycapDefinition[];
}

declare module "@rchunk/codex-micro-onboarding-animation" {
  export type CodexMicroAgentStatus =
    | "awaiting-approval"
    | "awaiting-response"
    | "error"
    | "idle"
    | "unread"
    | "working";
  export interface CodexMicroAnimationAgentSlot {
    id: number;
    selected: false;
    status: CodexMicroAgentStatus;
    threadKey: null;
    title: null;
  }
  export interface CodexMicroOnboardingAnimationFrame {
    actionKeycapIds: string[];
    agentSlots: CodexMicroAnimationAgentSlot[];
  }
  export const a: (
    scope: { set(signal: unknown, value: unknown): void },
    reducedMotion: boolean,
  ) => () => void;
  export const c: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    input: {
      flowId: string;
      inputMonitoringPermissionState: string;
      screen: string;
      step: string;
    },
  ) => void;
  export const i: () => void;
  export const n: import("@rchunk/app-shared").ScopedDerivedSignal<
    unknown,
    CodexMicroAnimationAgentSlot[] | null
  >;
  export const o: () => void;
  export const r: (elapsedMs: number) => CodexMicroOnboardingAnimationFrame;
  export const s: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    device: { status: string },
    transition: string | null,
    transport: string | null,
    previouslyDetected: boolean,
  ) => void;
  export const t: import("@rchunk/app-shared").ScopedDerivedSignal<
    unknown,
    CodexMicroOnboardingAnimationFrame | null
  >;
}

declare module "@rchunk/codex-micro-onboarding-host" {
  export const CodexMicroOnboardingHost: (props: {
    dismissAnnouncement(): void;
  }) => unknown;
}

declare module "@rchunk/codex-micro-slot-signals" {
  export type AgentKeyId = "AG00" | "AG01" | "AG02" | "AG03" | "AG04" | "AG05";
  export interface ThreadAssignment { hostId: string; threadKey: string; title?: string | null }
  export type AgentAssignment = ThreadAssignment | { commandId: string; type: "command" }
    | { keycapId: string; skillName: string; type: "skill" } | null;
  export type AgentAssignments = Record<AgentKeyId, AgentAssignment>;
  export interface AgentSlot {
    id: number;
    selected: boolean;
    status: import("@rchunk/app-shared").CodexMicroStatus;
    threadKey: string | null;
    title: string | null;
  }
  export const a: () => void;
  export const c: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    agentKeyId: AgentKeyId,
    assignment: AgentAssignment,
  ) => void;
  export const d: (index: number) => AgentKeyId | null;
  export const f: () => void;
  export const i: (state: Record<string, unknown>) => string;
  export const l: (...arguments_: unknown[]) => boolean;
  export const n: import("@rchunk/app-shared").ScopedDerivedSignal<Record<string, unknown>, AgentSlot[]>;
  export const o: AgentAssignments;
  export const p: (...arguments_: unknown[]) => void;
  export const r: () => void;
  export const s: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
    agentKeyId: AgentKeyId,
    clientThreadId: string,
  ) => boolean;
  export const t: import("@rchunk/app-shared").ScopedDerivedSignal<Record<string, unknown>, Record<string, unknown>>;
  export const u: import("@rchunk/app-shared").ScopedSignal<Record<string, unknown>, AgentAssignments>;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/command-messages" {
  export interface CommandMessageIntl { formatMessage(descriptor: { defaultMessage: string; description: string; id: string }, values?: Record<string, unknown>): string }
  export interface CommandMessage extends Record<string, unknown> { descriptionIntlId?: string; electron?: { menuTitleIntlId: string }; id?: string; titleIntlId?: string }
  export const n: (command: CommandMessage, intl: CommandMessageIntl, petEnabled?: boolean) => string;
  export const r: () => void;
  export const t: (command: CommandMessage, intl: CommandMessageIntl, override?: { description?: string; title?: string }, petEnabled?: boolean) => { description: string; title: string };
}

declare module "@rchunk/keyboard-shortcuts-search-input" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/about-you-summary" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chatgpt-user-context" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chronicle-service-queries" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chronicle-settings" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/memory-manager-gate" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/saved-memories" {
  const _default: unknown;
  export default _default;
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/chatgpt-saved-memory-state" {
  export const i: () => void;
  export const n: unknown;
  export const r: (scope: unknown, input: Record<string, unknown>) => Promise<void>;
  export const t: unknown;
}

declare module "@rchunk/saved-memory-history" { export interface SavedMemoryVersion { content?: string | null; createdAt?: string | Date; id: string; isCurrent?: boolean } export const SavedMemoryHistoryDialog: (props: { error?: string | null; isLoading?: boolean; onClose(): void; onDelete?(version: SavedMemoryVersion): Promise<void> | void; onRestore?(version: SavedMemoryVersion): Promise<void> | void; versions?: SavedMemoryVersion[] }) => unknown; }

declare module "@rchunk/animated-icon" {
  export const n: () => void;
  export const t: (props: {
    animation: "automation" | "hello" | "loader" | "memory" | "sidebar-finances" | "sidebar-images" | "sidebar-library" | "sidebar-more" | "sidebar-new-chat" | "sidebar-plugins" | "sidebar-projects" | "sidebar-search" | "sidebar-tasks";
    animated?: boolean;
    className?: string;
    color?: string;
    fallbackIcon?: unknown;
    loop?: boolean;
    onComplete?(): void;
    onReady?(): void;
  }) => unknown;
}

declare module "@rchunk/animated-icon-svg";
declare module "@rchunk/hello-icon";
declare module "@rchunk/loader-icon";
declare module "@rchunk/memory-footnote-icon";
declare module "@rchunk/sidebar-finances-icon";
declare module "@rchunk/sidebar-images-icon";
declare module "@rchunk/sidebar-library-icon";
declare module "@rchunk/sidebar-more-icon";
declare module "@rchunk/sidebar-new-chat-icon";
declare module "@rchunk/sidebar-plugins-icon";
declare module "@rchunk/sidebar-projects-icon";
declare module "@rchunk/sidebar-search-icon";
declare module "@rchunk/sidebar-tasks-icon";

declare module "@rchunk/about-you-summary" {
  interface AboutYouOptions {
    accountId: string;
    contextualHint?: string;
    signal?: AbortSignal;
    source?: string;
    [key: string]: unknown;
  }
  export const a: (options: AboutYouOptions, endpoint?: string) => Promise<Record<string, unknown>>;
  export const i: () => void;
  export const n: (props: AboutYouOptions & { forceRefresh?: boolean; onClose(): void }) => unknown;
  export const o: (payload: Record<string, unknown>, options: AboutYouOptions) => Promise<Record<string, unknown>>;
  export const r: (accountId: string | null, options?: AboutYouOptions) => Promise<Record<string, unknown>>;
  export const t: (props: AboutYouOptions & { forceRefresh?: boolean; onClose(): void; onDeleteAndTurnOffMemory?(): Promise<void> }) => unknown;
}

declare module "@rchunk/notifications-settings" {
  interface NotificationSettings {
    permissionsEnabled: boolean;
    questionsEnabled: boolean;
    sound?: string;
    turnMode: "off" | "unfocused" | "always";
  }
  interface NotificationSettingsProps {
    loading?: boolean;
    onChange?(settings: NotificationSettings): void;
    settings?: Partial<NotificationSettings>;
    soundOptions?: readonly string[];
  }
  export const n: (props?: NotificationSettingsProps & { available?: boolean }) => unknown;
  export const r: () => void;
  export const t: (props: NotificationSettingsProps) => unknown;
}

declare module "@rchunk/settings-host-dropdown" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/settings-loading-row" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/personalization-state" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/virtual-try-on" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/browser-use-origin-state-queries" {
  export const C: () => void;
  export const D: (configuration?: Record<string, unknown> | null) => boolean;
  export const E: (configuration: Record<string, unknown> | null | undefined, capability: string) => boolean;
  export const S: (configuration?: Record<string, unknown> | null) => boolean;
  export const T: (configuration: Record<string, unknown> | null | undefined, mode?: "iab" | "extension" | "cdp") => boolean;
  export const _: () => void;
  export const a: () => import("@rchunk/app-shared").UseMutationResult<unknown, Error, unknown>;
  export const b: (configuration?: Record<string, unknown> | null) => Array<{ decision: "allow" | "deny"; pattern: Record<string, unknown> }>;
  export const c: () => import("@rchunk/app-shared").UseMutationResult<unknown, Error, { approvalMode: unknown; kind: unknown }>;
  export const d: (hostId?: string) => import("@rchunk/app-shared").UseMutationResult<unknown, Error, unknown>;
  export const f: () => import("@rchunk/app-shared").UseMutationResult<unknown, Error, unknown>;
  export const g: (policy: Record<string, unknown> | null | undefined, capability: string) => unknown;
  export const h: (value?: Record<string, unknown> | null) => Record<string, unknown> | null;
  export const i: () => void;
  export const l: (options: { hostId: string }) => import("@rchunk/app-shared").UseMutationResult<unknown, Error, unknown>;
  export const m: () => void;
  export const n: import("@rchunk/app-shared").ScopedDerivedFamily<unknown, string, "unsupported" | "loading" | "error" | "supported">;
  export const o: () => import("@rchunk/app-shared").UseMutationResult<unknown, Error, unknown>;
  export const p: (...arguments_: unknown[]) => Promise<void>;
  export const r: (dataTypes: unknown) => Promise<unknown>;
  export const s: () => import("@rchunk/app-shared").UseMutationResult<unknown, Error, unknown>;
  export const t: unknown;
  export const u: () => import("@rchunk/app-shared").UseMutationResult<unknown, Error, unknown>;
  export const v: (entry: { pattern: Record<string, unknown> }, url: string) => boolean;
  export const w: (configuration: Record<string, unknown> | null | undefined, url: string, capability: string) => boolean;
  export const x: (configuration?: Record<string, unknown> | null) => Array<{ pattern: string; policy: Record<string, unknown> }>;
  export const y: (entry: { pattern: string }, url: string) => boolean;
}

declare module "@rchunk/diff-comment-card" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-readonly-comment" {
  export const a: () => void;
  export const i: (props: { children?: unknown }) => unknown;
  export const n: (props: { comment: Record<string, unknown>; filePath?: string; line?: number; side?: string }) => unknown;
  export const o: (login: string | null | undefined, size: number, hostname?: string) => string | null;
  export const r: () => void;
  export const s: () => void;
  export const t: (props: { authorAvatarUrl?: string; authorLogin?: string; body?: string; createdAt?: string; url?: string }) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/review-row" {
  export const n: () => void;
  export const t: (props: { authorAvatar?: unknown; children?: unknown; disabled?: boolean; loading?: boolean; layout?: "inline" | "card"; showSubmit?: boolean; submitLabel?: string; submitType?: "button" | "submit"; onSubmit?(): void }) => unknown;
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/diff-core" {
  export const n: () => void;
  export const t: ReadonlyArray<Readonly<Record<string, unknown>>>;
}

declare module "@rchunk/file-diff-alt" {
  export const i: () => void;
  export const n: () => void;
  export const r: (props: { children?: unknown }) => unknown;
  export const t: (props: { alignCommentGutter?: boolean; fileDiff: unknown; lineDiffType?: string; [key: string]: unknown }) => unknown;
}

declare module "@rchunk/file-diff-presentation-core" {
  export const i: (input?: { diffStyle?: string; lineDiffType?: string }) => { diffStyle: string; lineDiffType: string; hunkSeparators: string };
  export const n: () => void;
  export const r: () => void;
  export const t: (props: { fileDiff: unknown; diffStyle?: string; lineDiffType?: string; hunkSeparators?: string; onPostRender?(): void; [key: string]: unknown }) => unknown;
}

declare module "@rchunk/register-pierre-themes" {
  export const a: () => { setRenderOptions(options: { lineDiffType: string; theme: string }): unknown } | null;
  export const i: () => void;
  export const n: unknown;
  export const o: { LRUMap: new <Key, Value>(limit?: number, entries?: Iterable<[Key, Value]>) => MapLike<Key, Value> };
  export const r: (props: { children?: unknown; highlighterOptions: Record<string, unknown>; poolOptions: Record<string, unknown> }) => unknown;
  export const t: () => void;

  interface MapLike<Key, Value> extends Iterable<[Key, Value]> {
    readonly limit: number; readonly size: number; clear(): void; delete(key: Key): Value | undefined;
    entries(): IterableIterator<[Key, Value]>; find(key: Key): Value | undefined; get(key: Key): Value | undefined;
    has(key: Key): boolean; keys(): IterableIterator<Key>; set(key: Key, value: Value): this;
    shift(): [Key, Value] | undefined; toJSON(): Array<{ key: Key; value: Value }>; values(): IterableIterator<Value>;
  }
}

declare module "@rchunk/open-pull-request-fix-automation-panel-core" {
  export const n: (...arguments_: unknown[]) => unknown;
  export const r: (...arguments_: unknown[]) => Promise<boolean>;
  export const t: () => void;
}

declare module "@rchunk/pull-request-code-review-core" {
  export interface DiffControls {
    diffMode: "left" | "right" | "split" | "unified"; expanded: boolean; hideWhitespace: boolean;
    loadFullFilesEnabled: boolean; richPreviewEnabled: boolean; wordDiffsEnabled: boolean; wrap: boolean;
    onSelectDiffMode(mode: "left" | "right" | "split" | "unified"): void; onToggleExpanded(): void;
    onToggleHideWhitespace(): void; onToggleLoadFullFiles(): void; onToggleRichPreview(): void;
    onToggleWordDiffs(): void; onToggleWrap(): void;
  }
  export const a: (props: { copyGitApplyCommandDisabled?: boolean; diffControls: DiffControls; refreshGitQueriesDisabled?: boolean; showCopyGitApplyCommand?: boolean; showHideWhitespace?: boolean; showLoadFullFiles?: boolean; showRefreshGitQueries?: boolean; onClickCopyGitApplyCommand?(): void; onRefreshGitQueries?(): void }) => unknown;
  export const c: () => void;
  export const i: () => void;
  export const n: () => void;
  export const o: () => void;
  export const r: (props: { diff: { metadata?: { additionLines?: unknown }; [key: string]: unknown }; [key: string]: unknown }) => unknown;
  export const s: (props: { bottomInset?: "actions" | "composer" | null; children(width: number): unknown; className?: string; disableScrollAnchoring?: boolean; isFileTreeOpen?: boolean; [key: string]: unknown }) => unknown;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/pull-request-comment" {
  export const S: (...arguments_: unknown[]) => void;
  export const _: unknown;
  export const a: () => void;
  export const b: (...arguments_: unknown[]) => void;
  export const c: unknown;
  export const d: () => void;
  export const f: () => void;
  export const g: unknown;
  export const h: unknown;
  export const i: (props: Record<string, unknown>) => unknown;
  export const l: () => void;
  export const m: unknown;
  export const n: () => void;
  export const o: (props: Record<string, unknown>) => unknown;
  export const p: unknown;
  export const r: (props: Record<string, unknown>) => unknown;
  export const s: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
  export const u: (props: Record<string, unknown>) => unknown;
  export const v: (...arguments_: unknown[]) => void;
  export const x: (...arguments_: unknown[]) => void;
  export const y: (...arguments_: unknown[]) => void;
}
declare module "@rchunk/arrow-curved-right" { const _default: unknown; export default _default; }
declare module "@rchunk/review-file-tree-pane" {
  export const a: () => void;
  export const c: () => void;
  export const d: (event: { composedPath(): EventTarget[] }) => string | null;
  export const f: () => void;
  export const i: (source: string | null | undefined, options?: { basePath?: string | null }) => ((path: string) => "set" | "unset" | "unspecified" | null) | null;
  export const l: (props: Record<string, unknown>) => unknown;
  export const n: (props: Record<string, unknown>) => unknown;
  export const o: (input: { cwd?: string | null; gitCommonDir?: string | null; gitRoot?: string | null; hostId: string; paths: string[] }) => { hasLinguistGeneratedAttributes: boolean; hasUnhandledAttributesFiles: boolean; isReady: boolean; paths: Set<string> };
  export const r: () => void;
  export const s: (props: Record<string, unknown>) => unknown;
  export const t: () => unknown;
  export const u: () => void;
}
declare module "@rchunk/text-shorter" { const _default: unknown; export default _default; }
declare module "@rchunk/code-diff" {
  export interface ParsedDiffFile { additions: number; deletions: number; hunks: string[]; path: string; status: "added" | "deleted" | "modified" | "renamed" }
  export const a: (diff: string) => ParsedDiffFile[];
  export const c: (path: string) => string;
  export const i: (props: { diff?: string; files?: ParsedDiffFile[]; viewType?: "split" | "unified"; onSelectFile?(path: string): void }) => unknown;
  export const l: typeof i;
  export const n: () => void;
  export const o: () => void;
  export const r: () => void;
  export const s: () => void;
  export const t: typeof i;
  export const u: () => void;
}
declare module "@rchunk/review-preferences-model" {
  export const a: () => void;
  export const c: unknown;
  export const d: unknown;
  export const l: unknown;
  export const o: unknown;
  export const u: unknown;
}
declare module "@rchunk/review-diff-virtualizer-metrics" { const _default: unknown; export default _default; }
declare module "@rchunk/pull-request-error-description" { const _default: unknown; export default _default; }

declare module "@rchunk/diff-comment-card" {
  export const n: (props: {
    action?: unknown;
    children?: unknown;
    footer?: unknown;
  }) => unknown;
  export const r: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/file-diff" {
  export const FileDiff: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/pull-request" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/pull-request-status-label" {
  export const n: () => void;
  export const t: (props: {
    status: "closed" | "draft" | "merged" | "open";
  }) => unknown;
}

declare module "@rchunk/permission-request-model" {
  export type PermissionPath =
    | { type: "path"; path: string }
    | { type: "glob_pattern"; pattern: string }
    | { type: "special"; value: { kind: "root" | "minimal" | "tmpdir" | "slash_tmp" } | { kind: "project_roots"; subpath?: string | null } | { kind: "unknown"; path: string; subpath?: string | null } };
  export interface PermissionRequest {
    network?: unknown;
    fileSystem?: { entries?: Array<{ access: "read" | "write"; path: PermissionPath }> } | null;
  }
  export type PermissionGroup =
    | { kind: "network" }
    | { kind: "fileSystem"; access: "read" | "write" | "readWrite"; paths: string[] };
  export const n: () => void;
  export const t: (request: PermissionRequest) => PermissionGroup[];
}

declare module "@rchunk/voice-preferences" {
  type VoiceScope = Record<string, unknown>;
  type VoicePreference<Value> = import("@rchunk/app-shared").ScopedSignal<VoiceScope, Value>;
  export const a: () => number | undefined;
  export const c: VoicePreference<string> | undefined;
  export const i: (value: unknown) => number;
  export const n: VoicePreference<boolean> | undefined;
  export const o: () => void;
  export const r: () => "none" | "asr" | "volume" | undefined;
  export const s: VoicePreference<null> | undefined;
  export const t: VoicePreference<number> | undefined;
}

declare module "@rchunk/chatgpt-subagent-final-response-query" {
  export interface SubagentFinalResponseInput {
    activationId: string | null;
    conversationId: string | null;
    isTurnLive: boolean;
    threadId: string | null;
  }
  export const n: () => void;
  export const t: import("@rchunk/app-shared").ScopedQueryFamily<
    Record<string, unknown>,
    SubagentFinalResponseInput,
    string | null
  > | undefined;
}

declare module "@rchunk/library-file-metadata" {
  export interface LibraryFileMetadata extends Record<string, unknown> { id: string; }
  export interface AbortSignalLike { throwIfAborted(): void; }
  export const n: () => void;
  export const t: (fileId: string, accountId: string, signal: AbortSignalLike) => Promise<LibraryFileMetadata>;
}

declare module "@rchunk/offer-queries" {
  export interface Promotion extends Record<string, unknown> {
    is_eligible?: boolean;
    metadata?: unknown;
  }
  export interface PromotionSelectionInput {
    accountId?: string | null;
    promoCode?: string | null;
    planName: string;
    promotion?: Promotion | null;
    isLoading: boolean;
    error?: unknown;
  }
  export const i: (input: { accountId?: string | null; promoCode?: string | null; planName: string }) => unknown;
  export const n: (input: { accountId: string; code: string; kind: string; signal: AbortSignal }) => Promise<Promotion>;
  export const r: () => void;
  export const t: (input: PromotionSelectionInput) => { lockedProPlanName: string | null; proPromotionPending: boolean; proSelectionBlocked: boolean };
}

// Latest-turn preview and local conversation sources panel cluster.
declare module "@rchunk/app-shared" {
  export const Cf: (props: Record<string, unknown>) => unknown;
  export const Tf: (props: Record<string, unknown>) => unknown;
  export const xf: (props: Record<string, unknown>) => unknown;
  export const HF: unknown;
  export const UF: {
    CODEX_SOURCES_SECTION_TYPE_MCP_TOOL_CALLS: string;
    CODEX_SOURCES_SECTION_TYPE_WEB_PAGES: string;
    CODEX_SOURCES_SECTION_TYPE_WEB_SEARCHES: string;
  };
  export const qT: import("@rchunk/app-shared").IconAssetPreset;
}

declare module "@rchunk/app-initial" {
  export const Dbt: unknown;
  export const Ebt: () => void;
  export const Fbt: unknown;
  export const bbt: (key: string, expanded: boolean) => Record<string, boolean>;
  export const wbt: (value: unknown, key: true | string) => boolean;
  export const G3: unknown;
  export const W3: (props: Record<string, unknown>) => unknown;
  export const tn: import("@rchunk/app-shared").ReadableSignal<boolean>;
  export const xpn: (
    scope: unknown,
    analytics: unknown,
    event: { appName?: string; itemCount: number; sectionType: string },
  ) => void;
}

declare module "@rchunk/app-primary" {
  export const Io: {
    Body: (props: Record<string, unknown>) => unknown;
    DisclosureBody: (props: Record<string, unknown>) => unknown;
    DisclosureRow: (props: Record<string, unknown>) => unknown;
    Item: (props: Record<string, unknown>) => unknown;
  };
  export const pf: unknown;
}

declare module "@rchunk/conversation-blocks" {
  export const v: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/open-pending-site-preview" {
  export const OpenPendingSitePreview: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/site-preview-persistence-bridge" {
  export const SitePreviewPersistenceBridge: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/registered-conversation-thumbnail-core" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/local-conversation-webmcp-tools-model" {
  export const i: () => void;
  export const r: <Call extends Record<string, unknown>>(
    calls: Call[],
  ) => Array<{ calls: Call[]; name: string }>;
  export const t: (url: string) => string | null;
}

declare module "@rchunk/local-conversation-external-resource-icon" {
  export const i: () => void;
  export const n: () => void;
  export const r: (source: Record<string, unknown>) => string | undefined;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/use-local-conversation-sources" {
  export const n: (conversationId: string, hostId: string) => Record<string, unknown>;
  export const t: () => void;
}

declare module "@rchunk/mcp-tool-item-content" {
  export const n: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/registered-conversation-thumbnail" {
  export const RegisteredConversationThumbnail: (
    props: Record<string, unknown>,
  ) => unknown;
}

declare module "@rchunk/app-shared" {
  export const Ib: (props: Record<string, unknown>) => unknown;
  export const mg: (path: string) => (props: Record<string, unknown>) => unknown;
  export const wy: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/app-initial" {
  export const Rl: (
    scope: unknown,
    tab: { projectId: string; title: string; type: "appgen-app"; url: string },
  ) => boolean;
  export const _Bt: (scope: unknown, conversationId: string) => boolean;
  export const Hl: unknown;
  export const Lbt: unknown;
  export const Vl: (projectId: string, previewId: string, revision: unknown) => void;
  export const zl: (projectId: string | null) => { isOpen?: boolean; projectId: string } | null;
  export const Xd: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/conversation-thumbnail-ui" {
  export const n: () => void;
  export const t: (props: { draft?: string; requestExcerpt?: string | null; responseExcerpt?: string | null; statusState: { type: "error" | "idle" | "loading"; unread?: boolean; unreadCount?: number }; title: string; waitingFor?: "waitingOnApproval" | "waitingOnUserInput" | null }) => unknown;
}

declare module "@rchunk/cloud-automation-detail-panel" {
  export const r: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/automation-editor-dialog" {
  export const a: () => void;
  export const c: (props: Record<string, unknown>) => unknown;
  export const d: () => void;
  export const f: (props: Record<string, unknown>) => unknown;
  export const h: () => void;
  export const i: <Value>(value: Value) => Value;
  export const l: () => void;
  export const m: (props: Record<string, unknown>) => unknown;
  export const n: () => void;
  export const o: (props: Record<string, unknown>) => unknown;
  export const p: () => void;
  export const r: (event: { preventDefault(): void }) => void;
  export const s: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
  export const u: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/local-conversation-thread-entry" {
  export const LocalConversationSideChatTab: (
    props: Record<string, unknown>,
  ) => unknown;
}

declare module "@rchunk/avatar-overlay-debug-state" { export const n: () => void; export const t: { value: boolean } }
declare module "@rchunk/comment-mode-coachmark-state" { export const i: () => void; export const n: () => void; export const r: { value: boolean }; export const t: string }
declare module "@rchunk/thread-panel-secondary-state" {
  export interface BrowserProfileTargetRules { domains?: string[]; urls?: string[] }
  export interface BrowserProfileDiscoveryInput { bannerAlreadyVisible?: boolean; bannerDismissedAtMs?: number | null; experimentAvailable?: boolean; experimentEnabled?: boolean; hasImported?: boolean; hasLoadedBrowserPage?: boolean; hasSeenBanner?: boolean; hasSeenModal?: boolean; isModalExperimentAssignment?: boolean; isPanelSettled?: boolean; isVisible?: boolean; modalDismissedAtMs?: number | null; nowMs: number; profiles?: readonly unknown[] | null; profilesQuerySucceeded?: boolean; serviceAvailable?: boolean }
  export const a: "178837158"; export const c: { value: number | null }; export const d: (input: BrowserProfileDiscoveryInput) => { cooldownEndsAtMs: number | null; presentation: "banner" | "modal" | null; shouldDiscoverProfiles: boolean }; export const f: { value: boolean }; export const h: (rules: BrowserProfileTargetRules, candidate: string) => boolean; export const i: "target_specific_urls"; export const l: (scope: { set<Value>(state: { value: Value }, value: Value): void }) => void; export const m: () => void; export const n: "1161538056"; export const o: (scope: { set<Value>(state: { value: Value }, value: Value): void }) => void; export const p: { value: boolean }; export const r: "show_modal"; export const s: { value: number | null }; export const t: 86400000; export const u: (scope: { set<Value>(state: { value: Value }, value: Value): void }) => void;
}
declare module "@rchunk/browser-session-queries";
declare module "@rchunk/tab-address-input" { import type { AddressSuggestionSource } from "@rchunk/popup"; export interface TabAddressInputProps { addressValue: string; allowEmptySuggestions?: boolean; className?: string; currentAddress?: string; id: string; isAddressEditing?: boolean; isVisible?: boolean; placeholder?: string; sources: AddressSuggestionSource[]; submittedAddressStillPending?: boolean; onAddressValueChange(value: string): void; onCancelAddressEditing?(): void; onCommitAddress(address: string): void; onEnsureAddressEditing?(): void; onFind?(): void; onFinishAddressEditing?(): void; onStartAddressEditing?(): void; onStopAddressEditing?(): void } export const n: () => void; export const t: (props: TabAddressInputProps) => unknown }
declare module "@rchunk/tab-input" {
  export interface TabInputContext { conversationId?: string | null; id: string; navigate(address: string, preserveEditing?: boolean): void; panelTarget?: string; stopEditing?(): void; value?: string }
  export interface TabInputProps extends Record<string, unknown> { addressValue?: string; conversationId?: string | null; id: string; onNavigate(address: string, preserveEditing?: boolean): void; onStopAddressEditing?(): void; panelTarget?: string; providers?: Array<(scope: unknown, context: TabInputContext) => Record<string, unknown>>; scope?: unknown; sources?: Array<Record<string, unknown>> }
  export const n: () => void; export const t: (props: TabInputProps) => unknown;
}
declare module "@rchunk/view-control-labels" {
  export interface ViewControlLabelContext { intl: { formatMessage(descriptor: { defaultMessage: string; description: string; id: string }): string }; tabIds: readonly string[]; view: "chat" | "full" | "split" | string }
  export interface ViewControlLabelState { evaluate(context: ViewControlLabelContext): string }
  export const n: ViewControlLabelState; export const r: ViewControlLabelState; export const t: () => void;
}
declare module "@rchunk/thread-tab-entity" { export const RegisteredChatGptEntityThumbnail: (props: { conversationId: string; draft?: string; requestExcerpt?: string | null; responseExcerpt?: string | null; statusState?: { type: "error" | "idle" | "loading"; unread?: boolean; unreadCount?: number }; title: string; waitingFor?: "waitingOnApproval" | "waitingOnUserInput" | null }) => unknown }

declare module "@rchunk/app-initial" {
  /** initializeSearchInput（通用 SearchInput 组件依赖）。 */
  export const mT: () => void;
  /** SearchInput（键盘快捷键检索输入框）。 */
  export const pT: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/keyboard-shortcuts-gate" {
  export const n: () => void;
  export const t: string | undefined;
}

declare module "@rchunk/app-connect-link-navigation" {
  export const n: (url: string) => boolean;
  export const t: () => void;
}

declare module "@rchunk/epic-launch-contracts" {
  export const n: string | undefined;
  export const r: () => void;
  export const t: string | undefined;
}

declare module "@rchunk/codex-analytics-attribution" {
  export const n: import("@rchunk/app-shared").ScopedDerivedSignal<
    Record<string, unknown>,
    { threadId: string; turnId: string } | null
  > | undefined;
  export const t: () => void;
}

declare module "@rchunk/control-group" {
  export interface ControlGroupProps { children?: unknown; className?: string; }
  export const n: () => void;
  export const t: (props: ControlGroupProps) => unknown;
}

declare module "@rchunk/outbound-identity-error" {
  export interface OutboundIdentityErrorProps { error: { error?: string; status?: number }; }
  export const n: () => void;
  export const t: (props: OutboundIdentityErrorProps) => unknown;
}

declare module "@rchunk/keyboard-shortcut-command-order" {
  export interface CommandAccess { codexLocal: boolean; workLocal: boolean; }
  export interface CommandVisibilityOptions extends Record<string, unknown> {
    browserEnabled?: boolean;
    commandAccess: CommandAccess;
    platform?: string;
  }
  export interface ShortcutCommand extends Record<string, unknown> {
    commandMenuGroupKey?: string | null;
    id: string;
    kind: string;
    requiredAccess?: "codexLocal" | "codexOrWorkLocal";
  }
  export const a: (command: ShortcutCommand, options: Omit<CommandVisibilityOptions, "browserEnabled" | "platform">) => boolean;
  export const i: (commandId: string, options: CommandVisibilityOptions) => boolean;
  export const n: () => void;
  export const r: () => void;
  export const t: (left: ShortcutCommand, right: ShortcutCommand) => number;
}

declare module "@rchunk/keyboard-shortcuts-search-input" {
  export interface KeyboardShortcutsSearchInputProps extends Record<string, unknown> {
    ariaLabel?: string;
    autoFocus?: boolean;
    isSearchingByKeystrokes?: boolean;
    onValueChange(value: string): void;
    placeholder?: string;
    trailingContent?: unknown;
    value: string;
  }
  export const n: () => void;
  export const t: (props: KeyboardShortcutsSearchInputProps) => unknown;
}

declare module "@rchunk/arrow-curved-right" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/arrow-rotate-ccw" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/bar-chart-icon" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/document-search-icon" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/file-blank-icon" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/filter" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/filter-alt" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/filter-alt-badged" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/folder-light-icon" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/hand-icon" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/plus-sm-icon" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/reddit-logo" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/shield-check" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/text-shorter" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/thumb-mixed" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }
declare module "@rchunk/twitter-logo" { export const n: () => void; export const t: (props: Record<string, unknown>) => unknown; }

declare module "@rchunk/command-menu-availability" {
  export const n: () => void;
  export const t: (context: Record<string, unknown>) => boolean;
}
declare module "@rchunk/command-menu-client" {
  export const i: (...args: unknown[]) => Record<string, Record<string, unknown>>;
  export const n: (contact: Record<string, unknown>, fallbackName: string) => Record<string, unknown> | null;
  export const r: () => void;
  export const t: (accountId: string) => Record<string, string>;
}
declare module "@rchunk/command-menu-holdout" {
  export interface CommandMenuDynamicConfig { details?: { reason?: string }; get(key: string, fallback: boolean): boolean; }
  export const n: () => void;
  export const t: (client: { getDynamicConfig?(id: string): CommandMenuDynamicConfig }) => boolean;
}
declare module "@rchunk/command-menu-queries" {
  export const a: (options: Record<string, unknown>) => Record<string, unknown>;
  export const c: (options: Record<string, unknown>) => Record<string, unknown>;
  export const i: (options: Record<string, unknown>) => Record<string, unknown>;
  export const l: (options: Record<string, unknown>) => Record<string, unknown>;
  export const n: (options: Record<string, unknown>) => Record<string, unknown>;
  export const o: (options: Record<string, unknown>) => Record<string, unknown>;
  export const r: (options: Record<string, unknown>) => Record<string, unknown>;
  export const s: (options: Record<string, unknown>) => Record<string, unknown>;
  export const t: () => void;
  export const u: (options: Record<string, unknown>) => Record<string, unknown>;
}
declare module "@rchunk/command-menu-search-results" {
  export const a: () => void;
  export const i: () => void;
  export const n: (options: Record<string, unknown>) => Record<string, unknown>;
  export const o: (items: Array<Record<string, unknown>>, libraryItemId: string) => Array<Record<string, unknown>>;
  export const r: Array<Record<string, unknown>>;
  export const t: () => void;
}
declare module "@rchunk/popcorn-icons";
declare module "@rchunk/popcorn-manual-edit-header-controls" { export const a: () => void; export const i: (props: { title: unknown; trailingContent?: unknown }) => unknown; export const n: (props: { ariaLabel: string; children?: unknown; trailingContent?: unknown }) => unknown; export const o: (props: Record<string, unknown> & { as?: string; children?: unknown; className?: string }) => unknown; export const r: () => unknown; export const s: () => void; export const t: (props: { activeLabel?: string; children?: unknown; disabled?: boolean; expanded?: boolean; label: string; onClick?(): void; pressed?: boolean; showActiveBackground?: boolean; size?: "compact" | "default"; testId?: string }) => unknown }
declare module "@rchunk/artifact-annotation-batch-controls" { export interface ArtifactBatchAnnotation { id: string; prompt?: string; selected?: boolean } export interface ArtifactAnnotationControlsProps { annotations?: ArtifactBatchAnnotation[]; busy?: boolean; currentIndex?: number; onAcceptAll?(): void; onCancel?(): void; onNavigate?(index: number): void; onSend?(annotations: ArtifactBatchAnnotation[]): Promise<void> | void; onStop?(): Promise<void> | void; onUndo?(): void } export const a: (props: ArtifactAnnotationControlsProps) => unknown; export const i: typeof a; export const n: () => void; export const o: typeof a; export const r: typeof a; export const s: typeof a; export const t: typeof a; }
declare module "@rchunk/artifact-annotation-comment" { export interface ArtifactAnnotationComment extends Record<string, unknown> { localArtifactAnnotationContext?: { annotationId?: string; artifactKind: "document" | "presentation" | "site" | "spreadsheet"; label?: string; path: string }; localArtifactAnnotationMetadata?: { target?: Record<string, unknown> & { type: string } }; position: { line: number }; text?: string } export const a: (input: { currentComments: ArtifactAnnotationComment[]; path: string; previousComments: ArtifactAnnotationComment[] }) => string[]; export const i: (comments: ArtifactAnnotationComment[]) => Array<Record<string, unknown>>; export const n: (comments: ArtifactAnnotationComment[], path: string) => ArtifactAnnotationComment[]; export const o: () => void; export const r: (comments: ArtifactAnnotationComment[]) => number; export const s: (comments: ArtifactAnnotationComment[], path: string) => ArtifactAnnotationComment[]; export const t: (input: Record<string, unknown>) => ArtifactAnnotationComment | undefined }
declare module "@rchunk/artifact-preview-status" { export const n: (status: string) => unknown; export const t: () => void }
declare module "@rchunk/artifact-preview-zoom" { export const a: (x1: number, y1: number, x2: number, y2: number) => number; export const i: (zoomPercent: number, wheelDelta: number) => number; export const n: (value: number) => number; export const o: () => void; export const r: (input: { initialDistance: number; initialZoomPercent: number; nextDistance: number }) => number; export const t: readonly number[] }
declare module "@rchunk/artifact-tab-content-electron" { export interface ArtifactTabContentProps { annotations?: Array<{ id: string; prompt?: string }>; content?: unknown; error?: string | null; isLoading?: boolean; kind?: "document" | "presentation" | "site" | "spreadsheet" | "text"; status?: string; title?: string; version?: string | null; onClose?(): void; onDownload?(): void; onRequestEdit?(prompt: string): void; onRetry?(): void } export const a: (props: ArtifactTabContentProps) => unknown; export const i: typeof a; export const n: typeof a; export const o: typeof a; export const r: typeof a; export const s: typeof a; export const t: typeof a; }
declare module "@rchunk/app-connect-availability" { export interface AppConnectAvailabilityInput { appId: string; availableAppIds?: Iterable<string>; companionConnectorIds: string[]; connectors?: Array<{ id: string; [key: string]: unknown }>; getLink?(id: string): Promise<unknown>; primaryLink?: unknown } export const i: (input: AppConnectAvailabilityInput) => Promise<Array<{ id: string; [key: string]: unknown }>>; export const n: typeof i; export const r: () => void; export const t: () => void }
declare module "@rchunk/cloud-file-preview" { export const t: () => void }
declare module "@rchunk/editor-header" { export interface EditorHeaderControls { annotationControl?: unknown; commentsControl?: unknown; editingControls?: unknown; navigationControl?: unknown; supplementalActions?: unknown; zoomControl?: unknown } export const n: (props: { onOpenChange(open: boolean): void; open: boolean }) => unknown; export const r: () => void; export const t: (props: { actions?: unknown; annotationControlPlacement?: "editing" | "review"; commentsControl?: unknown; contentFade?: boolean; controls: EditorHeaderControls; downloadControl?: unknown; downloadPending?: boolean; onClose?(): void; onDownload?(): void; onShare?(): void; tabId?: string; title?: unknown }) => unknown }
declare module "@rchunk/editor-header-controls" { export interface EditorHeaderControls { annotationControl: unknown; commentsControl: unknown; editingControls: unknown; navigationControl: unknown; supplementalActions: unknown; zoomControl: unknown } export const n: () => void; export const t: EditorHeaderControls }
declare module "@rchunk/artifact-entry" { export const n: () => Promise<unknown>; export const r: () => Promise<unknown>; export const t: () => void }
declare module "@rchunk/multiplayer-document-runtime";
declare module "@rchunk/writing-block-surface" {
  export interface WritingBlockSurfaceProps { children?: unknown; className?: string; header?: unknown; leadingContent?: unknown; style?: Record<string, string | number> }
  export interface WritingBlockRegionProps { children?: unknown; className?: string }
  export const a: () => void;
  export const i: () => void;
  export const n: (props: WritingBlockSurfaceProps) => unknown;
  export const o: Record<string, string>;
  export const r: (props: WritingBlockRegionProps) => unknown;
  export const t: (props: WritingBlockRegionProps) => unknown;
}
declare module "@rchunk/vite-browser-external" { const browserExternal: unknown; export default browserExternal }
declare module "@rchunk/artifact-workbook-model-runtime";
declare module "@rchunk/artifact-document-model-runtime";
declare module "@rchunk/artifact-presentation-model-runtime";
declare module "@rchunk/artifact-spreadsheet-model-runtime";
declare module "@rchunk/popcorn-presentation-panel" { export interface PresentationSlide { id: string; title?: string; thumbnailUrl?: string } export interface PopcornPresentationController { getSelectedSlideIndex(): number; selectSlide(index: number): void; setZoom(zoom: number): void } export interface PopcornElectronPresentationPanelProps { annotationsEnabled?: boolean; className?: string; footerContent?: unknown; headerCenterContent?: unknown; headerRightContent?: unknown; headerTitleContent?: unknown; initialSelectedSlideIdx?: number; initialSourceBytes?: Uint8Array; initialSourceFormat?: string; initialZoom?: number; isEditing?: boolean; onControllerReady?(controller: PopcornPresentationController): void; onImportError?(error: Error): void; onImportReady?(): void; onInteractionAttempt?(): void; onPresentationEdit?(): void; renderHeader?(parts: Record<string, unknown>): unknown; renderLayout?(parts: Record<string, unknown>): unknown; slides?: readonly PresentationSlide[]; theme?: string; title?: string } export const PopcornElectronPresentationPanel: (props: PopcornElectronPresentationPanelProps) => unknown }
declare module "@rchunk/popcorn-workbook-panel" { export interface WorkbookSheet { cells?: readonly (readonly unknown[])[]; id: string; name: string } export interface PopcornWorkbookController { getActiveSheetName(): string | undefined; setActiveSheetName(name: string): void; setSelectedAddress(address: string): void; setZoom(zoom: number): void } export interface PopcornElectronWorkbookPanelProps { className?: string; headerCenterContent?: unknown; headerRightContent?: unknown; headerTitleContent?: unknown; initialSelectedAddress?: string; initialSourceBytes?: Uint8Array; initialSourceFormat?: string; initialZoom?: number; isEditing?: boolean; onControllerReady?(controller: PopcornWorkbookController): void; onImportError?(error: Error): void; onImportReady?(): void; onInteractionAttempt?(): void; renderHeader?(parts: Record<string, unknown>): unknown; renderLayout?(parts: Record<string, unknown>): unknown; sheets?: readonly WorkbookSheet[]; theme?: string; title?: string; toolbarHidden?: boolean } export const PopcornElectronWorkbookPanel: (props: PopcornElectronWorkbookPanelProps) => unknown }
declare module "@rchunk/popcorn-document-panel" { export interface DocumentPage { content?: string; id: string; title?: string } export interface PopcornElectronDocumentPanelProps { annotationsEnabled?: boolean; artifactSearchEnabled?: boolean; className?: string; documentProtoVersion?: number; enablePageNavigation?: boolean; headerRightContent?: unknown; headerTitleContent?: unknown; initialPageIndex?: number; initialSourceBytes?: Uint8Array; initialSourceFormat?: string; initialZoom?: number; isEditing?: boolean; navigationTarget?: { pageNumber: number; requestId: string }; onImportError?(error: Error): void; onImportReady?(): void; pages?: readonly DocumentPage[]; renderHeader?(parts: Record<string, unknown>): unknown; renderHeaderZoomControl?(zoom: number): unknown; renderLayout?(parts: Record<string, unknown>): unknown; theme?: string; title?: string; zoomToFitLabel?: string } export const PopcornElectronDocumentPanel: (props: PopcornElectronDocumentPanelProps) => unknown }
declare module "@rchunk/artifact-workbook-runtime"; declare module "@rchunk/artifact-source-bootstrap"; declare module "@rchunk/text-underline-icon"; declare module "@rchunk/drawing-frame-geometry"; declare module "@rchunk/floating-ui-modifiers"; declare module "@rchunk/popcorn-electron-surface-style"; declare module "@rchunk/draw-presence-label"; declare module "@rchunk/presentation-review-utils"; declare module "@rchunk/d3-ordinal-runtime"; declare module "@rchunk/tableau10-palette"; declare module "@rchunk/spreadsheet-utils"; declare module "@rchunk/spreadsheet-address-utils"; declare module "@rchunk/popcorn-chart-hover-tooltip"; declare module "@rchunk/freeze-panes"; declare module "@rchunk/workbook-review-utils"; declare module "@rchunk/artifact-document-core";
declare module "@rchunk/docx-preview-panel" {
  export interface DocumentPreviewPage { alt?: string; id?: string | number; src?: string; text?: string }
  export interface DocxPreviewPanelProps { currentPage?: number; error?: string | null; fileName?: string; isLoading?: boolean; libraryFileId?: string; onClose?(): void; onDownload?(): void; onOpenInLibrary?(libraryFileId: string): void; onPageChange?(page: number): void; onRetry?(): void; onZoomChange?(zoom: number): void; pages?: readonly DocumentPreviewPage[]; title?: string; zoom?: number }
  export const DocxPreviewPanel: (props: DocxPreviewPanelProps) => unknown;
}
declare module "@rchunk/notebook-preview-panel" {
  export interface NotebookCell { cellType?: "code" | "markdown" | "raw"; executionCount?: number | null; id?: string; outputs?: readonly unknown[]; source?: string | readonly string[] }
  export interface NotebookPreviewPanelProps { cells?: readonly NotebookCell[]; error?: string | null; fileName?: string; isLoading?: boolean; onClose?(): void; onDownload?(): void; onRetry?(): void; title?: string }
  export const NotebookPreviewPanel: (props: NotebookPreviewPanelProps) => unknown;
}
declare module "@rchunk/pdf-preview-panel" {
  export interface PdfPreviewPage { alt?: string; height?: number; id?: string | number; src?: string; width?: number }
  export interface PdfPreviewPanelProps { currentPage?: number; error?: string | null; fileName?: string; isLoading?: boolean; libraryFileId?: string; onClose?(): void; onDownload?(): void; onOpenInLibrary?(libraryFileId: string): void; onPageChange?(page: number): void; onRetry?(): void; onZoomChange?(zoom: number): void; pages?: readonly PdfPreviewPage[]; title?: string; zoom?: number }
  export const PdfPreviewPanel: (props: PdfPreviewPanelProps) => unknown;
}
declare module "@rchunk/library-json-preview" { export interface LibraryJsonPreviewProps { content: string; fileName: string } export const LibraryJsonPreview: (props: LibraryJsonPreviewProps) => unknown }
declare module "@rchunk/annotation-comment-editor-card";
declare module "@rchunk/popcorn-review-bar-overlay";
declare module "@rchunk/docx-preview-runtime";
declare module "@rchunk/codemirror-json-runtime";
declare module "@rchunk/chatgpt-code-block-highlighting";
declare module "@rchunk/multiplayer-note" { export const MultiplayerNote: (props: { content?: string | null; error?: string | null; isLoading?: boolean; name?: string; onClose(): void }) => unknown; }
declare module "@rchunk/multiplayer-writing-block" { export const MultiplayerWritingBlock: (props: { content?: string | null; name?: string; onOpen?(): void }) => unknown; }
declare module "@rchunk/file-preview" { export const ChatGptSearchFilePreview: (props: { accountId: string; authenticatedAccountId: string; authenticatedUserId?: string; item: { cloudFile: { name: string }; [key: string]: unknown }; onClose(): void; renderPreview?(item: { cloudFile: { name: string }; [key: string]: unknown }): unknown; sessionReady?: boolean; userId: string }) => unknown }
declare module "@rchunk/header-content-fade" { export const i: () => void; export const n: () => void; export const r: (props: { libraryFileId?: string; onNavigate?(): void; parentDirectoryId?: string }) => null; export const t: (kind: string) => "artifact" | "surface" | undefined }
declare module "@rchunk/artifact-layout" { export const n: () => void; export const t: (props: { content: unknown; header: unknown; headerPlacement?: string; renderLayout?(parts: { content: unknown; header: unknown; headerPlacement?: string }): unknown }) => unknown }
declare module "@rchunk/lazy-version-history" { export const n: (props: { children?: unknown; loader?: () => Promise<unknown>; variant?: "chatgpt" | "library" }) => unknown; export const r: () => void; export const t: typeof n }
declare module "@rchunk/library-cloud-file-preview" { export interface LibraryCloudFile { fileId: string; fileName: string; favorite?: boolean; kind?: string | null; sizeBytes?: number | null } export interface LibraryCloudFilePreviewProps { error?: string | null; file: LibraryCloudFile; isLoading?: boolean; maxLocalTaskBytes?: number; preview?: unknown; onAsk?(file: LibraryCloudFile): void; onClose?(): void; onDownload?(file: LibraryCloudFile): Promise<void> | void; onFavoriteChange?(favorite: boolean): void; onRetry?(): void; onShare?(file: LibraryCloudFile): void } export type LibraryCloudFilePreviewComponent = (props: LibraryCloudFilePreviewProps) => unknown; export const a: LibraryCloudFilePreviewComponent; export const c: () => void; export const i: LibraryCloudFilePreviewComponent; export const n: LibraryCloudFilePreviewComponent; export const o: () => void; export const r: () => void; export const s: LibraryCloudFilePreviewComponent; export const t: LibraryCloudFilePreviewComponent; }
declare module "@rchunk/library-file-display-title" { export const n: () => void; export const t: (name: string, kind: string | null | undefined, intl: { formatMessage(descriptor: { defaultMessage: string; id: string }, values?: Record<string, string>): string }) => string }
declare module "@rchunk/library-file-download" { export interface DownloadableLibraryFile { downloadUrl?: string; file_name: string; requestHeaders?: Record<string, string> } export const a: () => void; export const i: (file: DownloadableLibraryFile, signal?: AbortSignal) => Promise<string>; export const n: (file: DownloadableLibraryFile, signal?: AbortSignal) => Promise<Response>; export const r: (file: DownloadableLibraryFile, signal?: AbortSignal) => Promise<Uint8Array>; export const t: (file: DownloadableLibraryFile) => Promise<void> }
declare module "@rchunk/reset-image-library-state" { export const n: (queryClient: { resetQueries(options: { predicate(query: { queryKey: readonly unknown[] }): boolean; queryKey: readonly unknown[] }): Promise<unknown> | unknown }, fileIds?: readonly string[] | null) => Promise<unknown> | unknown; export const t: () => void }
declare module "@rchunk/saved-entities-data" { export const savedEntitiesApi$: unknown; export const savedEntityStatus$: unknown }
declare module "@rchunk/file-preview-version-history" { export const ChatGptFilePreviewVersionHistory: typeof import("@rchunk/version-history").t; export const LibraryFilePreviewVersionHistory: typeof import("@rchunk/version-history").n }
declare module "@rchunk/library-file-preview-kind" { export interface PreviewableLibraryFile { file_name: string; library_file_category?: string | null; mime_type?: string | null } export const i: () => void; export const n: (file: PreviewableLibraryFile) => string | null; export const r: (file: PreviewableLibraryFile) => "artifact" | "html" | "image" | "markdown" | "pdf" | "text" | "unsupported"; export const t: (input: { fileId: string; mimeType?: string | null; sourceUrl?: string | null }) => string | null }
declare module "@rchunk/library-file-preview-loading" { export const n: () => void; export const t: () => unknown }
declare module "@rchunk/library-multiplayer-access" { export interface LibraryAccessState { accountFeatures?: readonly string[]; access: "allowed" | "denied" | "loading"; featureGateEnabled?: boolean; isInternal?: boolean; isLoadingAccount?: boolean; sharedContentGateEnabled?: boolean } export const n: { evaluate(state: LibraryAccessState): boolean }; export const r: { evaluate(state: LibraryAccessState): boolean }; export const t: () => void }
declare module "@rchunk/loading-controls" { export const n: () => void; export const t: (props: { paginated: boolean }) => import("@rchunk/editor-header-controls").EditorHeaderControls }
declare module "@rchunk/open-image-preview" { export interface ImagePreviewTarget { alt?: string; id?: string; sourceUrl?: string; src: string } export const openChatGptSearchImagePreview: (image: ImagePreviewTarget, images?: ImagePreviewTarget[], service?: { open(input: { image: ImagePreviewTarget; images: ImagePreviewTarget[]; index: number }): void }) => { image: ImagePreviewTarget; images: ImagePreviewTarget[]; index: number }; }
declare module "@rchunk/open-in-library-item" { export const n: () => void; export const t: (props: { disabled?: boolean; libraryFileId: string; onOpen?(path: string): void }) => unknown }
declare module "@rchunk/artifact-presentation";
declare module "@rchunk/presentation-annotation-coachmark" { export const n: () => void; export const t: (props: { children?: unknown; onDismiss(): void; open: boolean }) => unknown }
declare module "@rchunk/presentation-annotation-cursor-coachmark" { export const i: () => void; export const n: () => void; export const r: Readonly<Record<"document" | "pdf" | "presentation" | "spreadsheet", { defaultMessage: string; id: string }>>; export const t: (props: { children?: unknown; contentSelector?: string; message: { defaultMessage?: string; id?: string }; onDismiss(): void; open: boolean }) => unknown }
declare module "@rchunk/preview-layout" { export const n: () => void; export const t: (props: { assetName: string; bottomContent?: unknown; children?: unknown; contentOwnsHeader?: boolean; endContent?: unknown; headerVariant?: "default" | "document"; onClose(): void; titleEndContent?: unknown }) => unknown }
declare module "@rchunk/render-file-children" { export interface FileLineAnnotation { id?: string | number; line?: number; [key: string]: unknown } export const n: <FileValue>(props: { file: FileValue; getAnnotationSlotName?(annotation: FileLineAnnotation): string; getHoveredLine?(): number | null; lineAnnotations?: FileLineAnnotation[]; renderAnnotation?(annotation: FileLineAnnotation): unknown; renderCustomHeader?(file: FileValue): unknown; renderGutterUtility?(getHoveredLine?: () => number | null): unknown; renderHeaderFilenameSuffix?(file: FileValue): unknown; renderHeaderMetadata?(file: FileValue): unknown; renderHeaderPrefix?(file: FileValue): unknown }) => unknown; export const t: () => void }
declare module "@rchunk/spreadsheet-editor";
declare module "@rchunk/version-history" { export interface LibraryFileVersion { created_at?: string; id: string; is_current?: boolean; label?: string } export interface VersionHistoryProps { error?: string | null; file: { libraryFileId: string }; hasNextPage?: boolean; isLoading?: boolean; onLoadMore?(): void; onRestore?(version: LibraryFileVersion): void; versions?: LibraryFileVersion[] } export const n: (props: VersionHistoryProps) => unknown; export const r: () => void; export const t: (props: VersionHistoryProps) => unknown }

declare module "@rchunk/command-menu-dialog" {
  export interface CommandMenuDialogProps extends Record<string, unknown> {
    close(): void;
    search: string;
    setSearch(value: string): void;
  }
  export const CommandMenuDialog: (props: CommandMenuDialogProps) => unknown;
}

declare module "@rchunk/chatgpt-search-dialog" {
  export type SearchFilter = "all" | "chats" | "documents" | "images" | "projects";
  export interface ChatGptSearchDialogProps extends Record<string, unknown> {
    close(): void;
    search: string;
    searchFilter: SearchFilter;
    setSearch(value: string, filter?: SearchFilter): void;
  }
  export const ChatGptSearchDialog: (props: ChatGptSearchDialogProps) => unknown;
}

declare module "@rchunk/skill-share-dialog-runtime" {
  export const a: () => void;
  export const c: (group: { id: string; name: string }) => Record<string, unknown>;
  export const d: (...args: unknown[]) => Promise<boolean>;
  export const f: (...args: unknown[]) => Promise<Record<string, unknown>>;
  export const i: (...args: unknown[]) => Promise<void>;
  export const l: (error: unknown) => "FORCE_CREATE" | "UPDATE_EXISTING" | null;
  export const n: () => void;
  export const o: (...args: unknown[]) => Promise<boolean>;
  export const r: (...args: unknown[]) => Promise<void>;
  export const s: (props: Record<string, unknown>) => unknown;
  export const t: (props: Record<string, unknown>) => unknown;
  export const u: () => void;
}

declare module "@rchunk/ad-control-dialog-runtime" {
  export const A: (content: Record<string, unknown>) => Array<Record<string, unknown>>;
  export const C: (formatter: Record<string, unknown>) => { sendLabel: string; title: string };
  export const D: () => void;
  export const E: (url: string) => string | null;
  export const O: (props: Record<string, unknown>) => unknown;
  export const S: (value: unknown) => boolean;
  export const T: (value: string) => string;
  export const _: () => void;
  export const a: () => void;
  export const b: (event: { preventDefault(): void }) => void;
  export const c: (props: Record<string, unknown>) => Record<string, unknown>;
  export const d: () => void;
  export const f: () => void;
  export const g: () => void;
  export const h: () => void;
  export const i: () => void;
  export const j: () => void;
  export const k: () => void;
  export const l: () => void;
  export const m: () => void;
  export const n: () => unknown;
  export const o: Record<string, string>;
  export const p: () => void;
  export const r: () => unknown;
  export const s: () => void;
  export const t: (props: Record<string, unknown>) => unknown;
  export const u: () => void;
  export const v: () => void;
  export const w: () => void;
  export const x: () => void;
  export const y: () => unknown;
}
