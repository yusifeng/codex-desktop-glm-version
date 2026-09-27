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
    refetch(): Promise<UseQueryResult<Data, QueryError>>;
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
  export const xD: () => void;
  /** Menu 当前选中项的 check icon asset。 */
  export const bD: IconAssetPreset;
  export interface ReactRef<T> {
    current: T;
  }
  export interface ReactRuntime {
    Children: {
      toArray(children: unknown): unknown[];
    };
    Fragment: unknown;
    createElement(
      component: unknown,
      props: Record<string, unknown>,
    ): unknown;
    createContext<T>(defaultValue: T): { Provider: unknown; Consumer: unknown };
    lazy<Props extends Record<string, unknown>>(
      loader: () => Promise<{ default: (props: Props) => unknown }>,
    ): (props: Props) => unknown;
    use<T>(context: unknown): T;
    useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
    useEffectEvent?<Callback extends (...args: never[]) => unknown>(callback: Callback): Callback;
    useId(): string;
    useLayoutEffect(
      effect: () => void | (() => void),
      dependencies?: readonly unknown[],
    ): void;
    useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T;
    useRef<T>(initialValue: T): ReactRef<T>;
    useState<T>(initialValue: T): [T, (value: T | ((current: T) => T)) => void];
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
  export const $O: { ONE_MINUTE: number; THIRTY_SECONDS: number };
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
    name: string;
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
  export const zY: (automation: AutomationDefinition) => boolean;
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
  export const Yi: unknown;
  /** AppScope（app-shared/runtime/atom-signal.ts，内部 YW）。 */
  export const ZI: MaitaiScope<Record<string, unknown>>;
  export const __: unknown;
  export const b_: unknown; // React use（ait）
  export const ek: () => void;
  export const fk: unknown;
  export const g_: unknown;
  /** initializeClassNames（app-shared/ui/class-names.ts，内部 Eh）。 */
  export const h4: () => void;
  export const i$: unknown;
  export const iW: (path: string) => string;
  export const lk: () => void;
  export const wL: () => void;
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
  export const G4: unknown;
  export const Gs: unknown; // jbt：pin-window-light-16 IconAsset
  export const H3: () => void; // detachedWindow 入口的 preload helper
  export const RI: () => void; // nG：路径 dirname 依赖初始化器
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
  export const ensurePopcornSpreadsheetFontsLoaded: () => Promise<void>;
}

declare module "@rchunk/portable-thumbnail-font-face-sources" {
  export const getPopcornCarlitoFontFaceSourcesFromDocument: () => unknown[];
}

declare module "@rchunk/thumbnail-worker-font-faces" {
  export const installPopcornFontFaces: (fonts: readonly unknown[]) => Promise<void>;
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
  ) => import("@rchunk/app-shared").ScopedSignal<
    Record<string, unknown>,
    Value
  >;
  export const ngn: <Value>(key: string, fallback: Value) => Value;
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
  export const lfn: () => unknown;
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
  export const t3: import("@rchunk/app-shared").ReadableSignal<string>;
  export const pdt: () => void;
  export const Rht: () => void;
  export const uun: () => void;
  export const jst: () => void;
  export const x3: () => void;
  export const Lb: {
    delete: import("@rchunk/app-shared").MessageDescriptor;
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
  export const CNt: () => HomeAnnouncementCandidate;
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
    systemPermissions: {
      openNotificationSettings(): Promise<void>;
    };
  }; // appServices：已解析的服务集合
  export const $en: import("@rchunk/app-shared").MaitaiScope<
    Record<string, unknown>
  >; // zb：RouteScope atom
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
    href: string;
    initiator: "open_in_browser_bridge";
    openTarget: "in-app-browser";
    originHostId: string;
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
  export const O5t: () => void;
  export const w5t: () => void;
  export const D3t: () => void;
  export const T3t: () => void;
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
  export const $ln: (key: string) => readonly unknown[];
  export const Qln: (event: string, payload: unknown) => Promise<unknown>;
  export const aun: () => void;
  export const nun: () => void;
  export const oun: (queryClient: unknown, key: unknown) => Promise<unknown>;
  export const q3t: unknown;
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
  export const rht: () => void;
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
    pathname: string;
    search: string;
    state: unknown;
  }
  export type RouterDestination =
    | string
    | Pick<RouterLocationState, "hash" | "pathname" | "search">;
  export const i_n: () => RouterLocationState;
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
  export const l_n: () => { projectId?: string | null };
  export const Xgn: (props: Record<string, unknown>) => unknown;
  export const Ygn: (props: {
    replace?: boolean;
    to: string;
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
    formatMessage(
      descriptor: import("@rchunk/app-shared").MessageDescriptor,
      values?: Record<string, unknown>,
    ): string;
  }
  export const mpn: import("@rchunk/app-shared").ReadableSignal<AppgenConversationIntl>;
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
    safeGet<Response>(path: string, options?: unknown): Promise<Response>;
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
  export const TT: () => void;
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
  // scroll-to-match 依赖：CUt=查找器装配器 xUt=matchId 元素查找器
  export const CUt: unknown;
  export const xUt: unknown;
  export const _any: any;
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
  export const Cg: (props: { children?: unknown }) => unknown;
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
  export const _any: any;
}

declare module "@rchunk/app-main" {
  export const _any: any;
}

declare module "@rchunk/use-git-submodule-paths" {
  export const _any: any;
}

declare module "@rchunk/git-branch-switcher" {
  export const _any: any;
}

declare module "@rchunk/dock" {
  export const _any: any;
}

declare module "@rchunk/create-dialog" {
  export const _any: any;
}

declare module "@rchunk/use-create-git-repository" {
  export const _any: any;
}

declare module "@rchunk/worktree-environment-dropdown" {
  export const _any: any;
}

declare module "@rchunk/color-icon" {
  export const _any: any;
}

declare module "@rchunk/connector-logo-stack" {
  export const _any: any;
}

declare module "@rchunk/onboarding-mail-provider" {
  export type MailProvider = "google" | "microsoft" | "other";
  export const a: (provider: MailProvider, plan: unknown) => MailProvider;
  export const n: (...args: any[]) => any;
  export const o: (...args: any[]) => any;
  export const r: (...args: any[]) => any;
  export const t: (...args: any[]) => any;
  export const _any: any;
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
  export const openExternalAgentImport: (...args: any[]) => Promise<unknown>;
  export const _any: any;
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
  export const t: unknown;
  export const _any: any;
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
  export const a: any;
  export const c: any;
  export const d: any;
  export const i: (...args: any[]) => any;
  export const l: any;
  export const n: any;
  export const o: any;
  export const r: any;
  export const s: any;
  export const t: any;
  export const u: any;
}

declare module "@rchunk/country-codes" {
  export const _any: any;
}

declare module "@rchunk/google-logo" {
  export const _any: any;
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

declare module "@rchunk/chatgpt-cme" {
  export const n: unknown;
  export const r: () => void;
}

declare module "@rchunk/home-entry-point" {
  export const CmeHomeEntryPoint: () => unknown;
}

declare module "@rchunk/pca-connector-action" {
  export const n: () => void;
  export const r: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<
      Record<string, unknown>
    >,
    resumeTarget: unknown,
  ) => Promise<unknown>;
  export const t: (
    scope: import("@rchunk/app-shared").MaitaiScopeApi<
      Record<string, unknown>
    >,
    options: Record<string, unknown>,
  ) => unknown;
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
    hostId?: string;
    marketplaceAnalytics?: unknown;
    onConnectStarted?(appId: string): void;
    onExternalConnectStarted?(appId: string): void;
  }
  export interface AppConnectFlow {
    handleAppConnected(appId: string): void;
    handleAppConnectOAuthStarted(event: Record<string, unknown>): void;
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
  export const _any: any;
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
    surface: "home_page",
    options: { enabled: boolean },
  ) => CodexWorktreesQueryResult;
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
  export interface AppgenSettingsPageProps extends Record<string, unknown> {
    onDeleted(): void;
    projectId: string;
  }
  export const n: () => unknown;
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
  export const r: () => void;
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
  export const t: <T>(items: T[]) => T[];
}

declare module "@rchunk/departments" {
  export const a: (...args: any[]) => any;
  export const i: unknown;
  export const n: () => void;
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
declare module "@rchunk/usage" { export const n: () => void; export const t: unknown; }
declare module "@rchunk/task-announcement-candidates" { export const TaskAnnouncementCandidates: unknown; }
declare module "@rchunk/popup" { export const i: unknown; export const n: () => void; export const r: unknown; export const t: unknown; }
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
  export const connectPersonalFinanceFromHomeBeacon: (...args: any[]) => Promise<boolean>;
}

declare module "@rchunk/conversation-start" {
  export const n: (...args: any[]) => Promise<any>;
  export const t: () => void;
}

declare module "@rchunk/plaid-link" {
  export const n: () => void;
  export const r: (...args: any[]) => Promise<boolean>;
}
declare module "@rchunk/catalog" { export const n: () => void; export const t: unknown; }
declare module "@rchunk/composer-tip" { export const useComposerTip: unknown; }
declare module "@rchunk/codex-micro-mini-games" { export const _any: any; }
declare module "@rchunk/codex-micro-mini-game-composer" { export const CodexMicroMiniGameComposer: unknown; }
declare module "@rchunk/wheel-swipe-gesture" { export const n: () => void; export const t: unknown; }
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
  export const _any: any;
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
  export const a: any;
  export const b: any;
  export const c: any;
  export const d: any;
  export const f: any;
  export const g: any;
  export const n: any;
  export const s: any;
  export const u: any;
  export const v: any;
  export const y: any;
}

declare module "@rchunk/skill-icon-source" {
  export const n: () => void;
  export const r: unknown;
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
  export const n: unknown;
  export const t: unknown;
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
  export const i: (options: {
    enabled: boolean;
  }) => import("@rchunk/app-initial").HomeAnnouncementCandidate;
  export const o: (options: {
    enabled: boolean;
  }) => import("@rchunk/app-initial").HomeAnnouncementCandidate;
  export const s: (options: {
    enabled: boolean;
  }) => import("@rchunk/app-initial").HomeAnnouncementCandidate;
  export const t: () => void;
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
  export const t: unknown;
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
  export const f: () => void;
  export const m: () => void;
  export const n: string;
}

declare module "@rchunk/plan-names" {
  export interface PlanNameInput {
    initialPlanType: string;
    planType: string;
    updatedPlanType: string;
  }
  export const n: (input: PlanNameInput) => string | null;
  export const r: () => void;
}

declare module "@rchunk/pricing" {
  export interface FormattedPrice {
    currencyCodeLabel?: string | null;
    formatted?: string | null;
    parts?: Intl.NumberFormatPart[];
  }
  export interface FormatPriceInput {
    amount: number;
    currencyCode: string;
    intl: import("@rchunk/app-shared").IntlShape;
    minorUnitExponent: number;
  }
  export const n: (input: FormatPriceInput) => FormattedPrice;
}

declare module "@rchunk/offer-notice" {
  export const i: () => void;
  export const n: (props: Record<string, unknown>) => unknown;
  export const r: (props: Record<string, unknown>) => unknown;
}

declare module "@rchunk/stripe-payment-confirmation" {
  export interface StripeError {
    code?: string;
    message?: string;
    reason?: string;
  }
  export interface StripePaymentIntent {
    id?: string;
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
  export const a: (error: StripeError) => string;
  export const i: string;
  export const n: (paymentIntent: StripePaymentIntent) => string | null;
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
  export const n: unknown;
  export const t: unknown;
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
  export const n: unknown;
  export const r: unknown;
  export const t: () => void;
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

declare module "@rchunk/index-entry" {
  export const _any: any;
}

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
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/open-in-google-drive-menu-item" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/skill-exploration-labels" {
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
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/user-message" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/workspace-file-context-menu-trigger" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks-settings-copy" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/hooks-settings-model" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/plan-implementation-request" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/timestamps" {
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

declare module "@rchunk/presentation" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/result-card" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/tool-activity-disclosure" {
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

declare module "@rchunk/local-environment-editor" {
  const _default: unknown;
  export default _default;
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

declare module "@rchunk/local-environment-editor" {
  const _default: unknown;
  export default _default;
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

declare module "@rchunk/local-environment-editor" {
  const _default: unknown;
  export default _default;
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

declare module "@rchunk/local-environment-editor" {
  const _default: unknown;
  export default _default;
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
  export const r: unknown;
  export const t: unknown;
}

declare module "@rchunk/modulepreload-polyfill" {
  export const t: unknown;
}

declare module "@rchunk/theme-font-family" {
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
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-client" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/linked-app-logo" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-messages" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-shared" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-src" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/security-tabs" {
  export const n: () => void;
  export const t: (props: {
    ariaLabel: string;
    onSelect(key: string): void;
    selectedKey: string;
    tabs: Array<{ key: string; name: unknown; panelId: string }>;
    variant?: string;
  }) => unknown;
}

declare module "@rchunk/confirmation" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/history" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/order-yubikey-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/chatgpt-desktop-auth-url" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-mobile-setup-dialog" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-mobile-setup-flow" {
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
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-micro-commands" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/codex-micro-keyboard-surface" {
  export const a: any;
  export const c: any;
  export const d: any;
  export const f: any;
  export const i: any;
  export const l: any;
  export const n: any;
  export const o: any;
  export const p: any;
  export const r: any;
  export const s: any;
  export const t: any;
  export const u: any;
}

declare module "@rchunk/codex-micro-layout" {
  export const o: any;
  export const r: (...args: any[]) => any;
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
    scope: unknown,
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
    scope: unknown,
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

declare module "@rchunk/codex-micro-slot-signals" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/command-messages" {
  const _default: unknown;
  export default _default;
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
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/diff-comment-card" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/pull-request-readonly-comment" {
  const _default: unknown;
  export default _default;
}

declare module "@rchunk/review-row" {
  const _default: unknown;
  export default _default;
}
