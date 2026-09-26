// wallet-onboarding-announcement-content —— Wallet 卡片 enrollment 状态机与 VGS sandbox host。
// 原版：app/webview/assets/wallet-onboarding-announcement-content-28d619ce7d4e.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as walletModalChunk from "@rchunk/wallet-onboarding-announcement-modal";
import { buildWalletEnrollmentHtml } from "./wallet-enrollment-html";
import type {
  IntlShape,
  JsxRuntime,
  MaitaiScopeApi,
  ReadableSignal,
  ScopedQueryFamily,
  ScopedSignalFamily,
} from "@rchunk/app-shared";

void runtimeChunk;

interface EnrollmentView {
  hostId: string;
  server: unknown;
  serverTools: WalletTool[];
  tool: { name: string };
}

interface WalletTool {
  name: string;
}

interface ResourceIdentity {
  context: unknown;
  identity:
    | { kind: "connector"; connectorId: string }
    | { kind: string; connectorId?: string };
}

interface WalletToolResult {
  isError?: boolean;
  structuredContent?: unknown;
}

interface WalletRegistration {
  id: string;
  optionIds: Set<string>;
}

interface WalletBootstrapState {
  attempt: number;
  metadata: Record<string, unknown> | null;
  retry: number;
  status: "error" | "loading" | "ready";
}

interface WalletWebview extends HTMLElement {
  destroy?(): void;
}

interface WalletBridge {
  notifyMcpAppsHostContext(input: { hostContext: unknown }): Promise<unknown>;
  runWidgetCode(input: Record<string, unknown>): AsyncIterable<unknown>;
  setTheme(input: { theme: string }): Promise<unknown>;
  setWidgetData(input: Record<string, unknown>): Promise<unknown>;
}

interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useEffectEvent?<Callback extends (...args: never[]) => unknown>(callback: Callback): Callback;
  useId(): string;
  useLayoutEffect(
    effect: () => void | (() => void),
    dependencies: readonly unknown[],
  ): void;
  useRef<T>(value: T): { current: T };
  useState<T>(
    value: T,
  ): [T, (value: T | ((previous: T) => T)) => void];
}

interface WalletEnrollmentResourceProps {
  active: boolean;
  enrollmentAttempt: number;
  enrollmentView: EnrollmentView;
  onComplete(): void;
  onPreparationError(): void;
  onPrepared(): void;
  preparing: boolean;
  targetElement: HTMLElement | null;
}

interface WalletEnrollmentSandboxProps extends WalletEnrollmentResourceProps {
  resourceIdentity: ResourceIdentity;
}

interface WalletEnrollmentDialogProps {
  completed: boolean;
  dismissAnnouncement(): void;
  onBack(): void;
  onRetry(): void;
  preparationFailed?: boolean;
  setSandboxTarget(element: HTMLElement | null): void;
}

interface WalletSourceQueryParameter {
  identity: ResourceIdentity["identity"];
  locale?: string;
  widgetDomain: null;
}

interface AppInitialBindings {
  $H(): void;
  Blt: ScopedSignalFamily<
    Record<string, unknown>,
    ResourceIdentity,
    string
  >;
  Fnt: { safeParse(value: unknown): { success: boolean } };
  Jdt(): void;
  KU(): void;
  Llt(): void;
  Nnt(input: Record<string, unknown>): Promise<WalletBridge>;
  Ok(input: { view: EnrollmentView }): unknown;
  Pnt(): void;
  QH(sourceUrl: string): string | null;
  Rdt(
    scope: MaitaiScopeApi<Record<string, unknown>>,
    hostId: string,
    server: unknown,
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<WalletToolResult>;
  Rlt: ScopedQueryFamily<Record<string, unknown>, unknown, ResourceIdentity["identity"]>;
  Slt(): boolean;
  Ydt(input: {
    connectorId: string | null;
    server: unknown;
    toolName: string;
    tools: WalletTool[];
  }): WalletTool;
  cXt(input: { toolResult: WalletToolResult }): unknown;
  eU: ScopedQueryFamily<
    Record<string, unknown>,
    WalletSourceQueryParameter,
    { sourceUrl: string }
  >;
  kk(): void;
  lXt(): void;
  mXt(server: unknown): boolean;
  pXt(): void;
  qU: ReadableSignal<Record<string, string>>;
  sXt(input: {
    isCodexAppsServer: boolean;
    toolResult: WalletToolResult;
  }): WalletToolResult;
  xlt(): void;
  zdt(): void;
}

const {
  $3: initializeRuntimeLazy,
  AZ: serializeQueryKey,
  Ah: Result,
  BX: useSignalFamilyValue,
  C_: initializeIconAsset,
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  Ih: Dialog,
  K2: initializeSharedComponents,
  KH: createSandboxPartition,
  LX: useSignalScope,
  Q3: logger,
  QI: initializeSharedRuntime,
  Rh: Heading,
  S_: Icon,
  Y2: FormattedMessage,
  YH: initializeSandboxUrls,
  Yh: Button,
  Z3: initializeQueryRuntime,
  ZI: applicationScope,
  e6: reactRuntime,
  g4: initializeDialogComponents,
  jZ: initializeMotionRuntime,
  n4: useIntl,
  o$: Motion,
  qH: getTrustedSandboxOrigin,
  vD: checkIconAsset,
  wL: initializeMotionPreferences,
} = appSharedChunk;
const {
  $H: initializeMcpHostApi,
  Blt: currentResourceSignal,
  Fnt: widgetRunningStatusSchema,
  Jdt: initializeToolResultMetadata,
  KU: initializeResourceSourceQuery,
  Llt: initializeResourceIdentity,
  Nnt: createWalletBridge,
  Ok: createResourceContext,
  Pnt: initializeToolInvocation,
  QH: createSandboxId,
  Rdt: invokeTool,
  Rlt: resourceIdentityQuery,
  Slt: useReducedMotion,
  Ydt: selectWalletTool,
  cXt: extractStructuredContent,
  eU: resourceSourceQuery,
  kk: initializeWidgetHost,
  lXt: initializeServerClassification,
  mXt: isCodexAppsServer,
  pXt: initializeResourceQueries,
  qU: styleVariablesSignal,
  sXt: normalizeToolResult,
  xlt: initializeWalletRuntime,
  zdt: initializeWidgetBridge,
} = appInitialChunk as unknown as AppInitialBindings;
const { WalletOnboardingAnnouncementModal: WalletModal } = walletModalChunk;

interface WalletOnboardingAnnouncementProps {
  dismissAnnouncement(): void;
  enrollmentView: EnrollmentView;
}

type EnrollmentScreen = "introduction" | "enrollment" | "success";
type PreparationStatus = "loading" | "ready" | "error";

const TOOLS = {
  retryBootstrap: "__wallet_onboarding_retry_bootstrap",
  registerCard: "__wallet_onboarding_register_vgs_card",
  requestVerification: "__wallet_onboarding_request_verification",
  verifyCard: "__wallet_onboarding_verify_card",
  finalizeCard: "__wallet_onboarding_finalize_card",
  stage: "__wallet_onboarding_stage",
} as const;

const WALLET_CSP = {
  baseUriDomains: [],
  connectDomains: [
    "https://js.verygoodvault.com",
    "https://js3.verygoodvault.com",
    "https://vgs-collect-keeper.apps.verygood.systems",
    "https://*.verygoodproxy.com",
  ],
  frameDomains: [
    "https://js.verygoodvault.com",
    "https://js3.verygoodvault.com",
    "https://vgs-collect-keeper.apps.verygood.systems",
  ],
  includeDefaultDomains: false,
  isTrusted: true,
  resourceDomains: [
    "https://js.verygoodvault.com",
    "https://js3.verygoodvault.com",
    "https://vgs-collect-keeper.apps.verygood.systems",
  ],
};

const SANDBOX_TIMEOUT_MS = 15_000;

const MESSAGES: Record<
  string,
  { id: string; defaultMessage: string; description: string }
> = {
  bootstrapError: message(
    "bootstrapError",
    "The secure card session is unavailable or expired",
    "Error shown when Wallet onboarding cannot authorize VGS Collect",
  ),
  cardNumber: message(
    "cardNumber",
    "Card number",
    "Label for the Wallet onboarding secure card-number field",
  ),
  cvc: message(
    "cvc",
    "Security code",
    "Label for the Wallet onboarding secure card-security-code field",
  ),
  cvcPlaceholder: message(
    "cvcPlaceholder",
    "3 digits",
    "Placeholder for the Wallet onboarding secure card-security-code field",
  ),
  error: message(
    "error",
    "We couldn't add this card",
    "Generic error shown when Wallet onboarding cannot add a card",
  ),
  expiration: message(
    "expiration",
    "Expiration date",
    "Label for the Wallet onboarding secure card-expiration field",
  ),
  expirationPlaceholder: message(
    "expirationPlaceholder",
    "00/00",
    "Placeholder for the Wallet onboarding secure card-expiration field",
  ),
  initializing: message(
    "initializing",
    "Preparing secure card fields…",
    "Status shown while Wallet onboarding prepares the secure card fields",
  ),
  numberPlaceholder: message(
    "numberPlaceholder",
    "16 digits",
    "Length hint shown inside the Wallet onboarding secure card-number field",
  ),
  privacy: message(
    "privacy",
    "Fully encrypted and never shared with third party apps",
    "Privacy explanation shown below Wallet onboarding secure card fields",
  ),
  retry: message(
    "retry",
    "Try again",
    "Button that retries Wallet onboarding secure-field initialization",
  ),
  retrySave: message(
    "retrySave",
    "Save to Wallet",
    "Button that retries saving a secured card to Wallet",
  ),
  saveError: message(
    "saveError",
    "Your card was secured, but Wallet couldn't save it",
    "Error shown when Wallet onboarding cannot save an already secured card",
  ),
  sendCode: message(
    "sendCode",
    "Send verification code",
    "Button to request a one-time card issuer verification code",
  ),
  submit: message(
    "submit",
    "Add card",
    "Button that submits the Wallet onboarding secure card form",
  ),
  submitting: message(
    "submitting",
    "Adding card…",
    "Status shown while Wallet onboarding adds the secured card",
  ),
  title: message(
    "title",
    "Add new card",
    "Heading for the Wallet onboarding secure card form",
  ),
  validationError: message(
    "validationError",
    "Check your card details and try again",
    "Error shown when Wallet onboarding secure fields reject card details",
  ),
  verificationCode: message(
    "verificationCode",
    "Six-digit verification code",
    "Label for the one-time code received from the card issuer",
  ),
  verificationError: message(
    "verificationError",
    "We couldn't verify this card. Try again",
    "Error shown when the card issuer rejects a verification request or code",
  ),
  verificationOption: message(
    "verificationOption",
    "Where should we send the verification code?",
    "Label for choosing a masked email address or phone number supplied by the card issuer",
  ),
  verifyCode: message(
    "verifyCode",
    "Verify and save",
    "Button to verify the card issuer's code and save it to Wallet",
  ),
};

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;

function message(name: string, defaultMessage: string, description: string) {
  return {
    id: `codexWalletOnboardingEnrollment.${name}`,
    defaultMessage,
    description,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

function parseBootstrapMetadata(value: unknown): Record<string, unknown> | null {
  if (!isObject(value) || !isObject(value.vgs_collect_bootstrap)) return null;
  const bootstrap = value.vgs_collect_bootstrap;
  return typeof bootstrap.access_token === "string" &&
    bootstrap.access_token.trim() !== "" &&
    (bootstrap.environment === "sandbox" || bootstrap.environment === "live") &&
    typeof bootstrap.vault_id === "string" &&
    bootstrap.vault_id.trim() !== ""
    ? value
    : null;
}

function parseRegistration(
  value: unknown,
): { id: string; optionIds: Set<string> } | null {
  if (
    !isObject(value) ||
    value.ok !== true ||
    typeof value.registration_id !== "string"
  )
    return null;
  if (
    value.status !== "ready_to_finalize" &&
    value.status !== "verification_required"
  )
    return null;
  if (!Array.isArray(value.verification_options)) return null;
  const optionIds = value.verification_options
    .map((option: unknown) => (isObject(option) ? option.option_id : undefined))
    .filter(
      (optionId: unknown): optionId is string => typeof optionId === "string",
    );
  return { id: value.registration_id, optionIds: new Set(optionIds) };
}

function validFinalization(value: unknown): boolean {
  return (
    isObject(value) &&
    value.ok === true &&
    isObject(value.card) &&
    typeof value.card.last4 === "string"
  );
}

function localizedMessages(intl: IntlShape): Record<string, string> {
  return Object.fromEntries(
    Object.entries(MESSAGES).map(([key, descriptor]) => [
      key,
      (() => {
        const formatted = intl.formatMessage(descriptor);
        return typeof formatted === "string"
          ? formatted
          : descriptor.defaultMessage;
      })(),
    ]),
  );
}

function WalletOnboardingAnnouncement(
  props: WalletOnboardingAnnouncementProps,
): unknown {
  initializeWalletOnboardingAnnouncementContent();
  return jsx.jsx(WalletOnboardingFlow, props, props.enrollmentView.hostId);
}

function WalletOnboardingFlow({
  dismissAnnouncement,
  enrollmentView,
}: WalletOnboardingAnnouncementProps): unknown {
  const [screen, setScreen] = React.useState(
    "introduction" as EnrollmentScreen,
  );
  const [attempt, setAttempt] = React.useState(1);
  const [setupRequested, setSetupRequested] = React.useState(false);
  const [preparationStatus, setPreparationStatus] = React.useState(
    "loading" as PreparationStatus,
  );
  const [sandboxTarget, setSandboxTarget] = React.useState(
    null as HTMLElement | null,
  );
  const foreground =
    screen === "introduction"
      ? jsx.jsx(WalletModal, {
          dismissAnnouncement,
          isSettingUpWallet: setupRequested && preparationStatus === "loading",
          onSetUpWallet: () => {
            setSetupRequested(true);
            if (preparationStatus !== "loading") setScreen("enrollment");
          },
        })
      : jsx.jsx(WalletEnrollmentDialog, {
          completed: screen === "success",
          dismissAnnouncement,
          preparationFailed: preparationStatus === "error",
          setSandboxTarget,
          onBack: () => {
            setSetupRequested(false);
            setScreen("introduction");
          },
          onRetry: () => {
            setPreparationStatus("loading");
            setAttempt((value: number) => value + 1);
          },
        });
  const active = screen === "enrollment" && preparationStatus !== "error";
  const preparing = screen !== "success" && preparationStatus !== "error";
  const enrollment = jsx.jsx(
    WalletEnrollmentResource,
    {
      active,
      enrollmentAttempt: attempt,
      enrollmentView,
      onComplete: () => setScreen("success"),
      onPreparationError: () => {
        setPreparationStatus("error");
        if (setupRequested) setScreen("enrollment");
      },
      onPrepared: () => {
        setPreparationStatus("ready");
        if (setupRequested) setScreen("enrollment");
      },
      preparing,
      targetElement: sandboxTarget,
    },
    attempt,
  );
  return jsx.jsxs(jsx.Fragment, { children: [foreground, enrollment] });
}

function WalletEnrollmentResource(props: WalletEnrollmentResourceProps): unknown {
  const context = createResourceContext({ view: props.enrollmentView });
  const identity = useSignalFamilyValue(resourceIdentityQuery, context).data;
  if (identity == null) return null;
  return jsx.jsx(
    WalletEnrollmentSandbox,
    { ...props, resourceIdentity: { context, identity } },
    serializeQueryKey([identity]),
  );
}

function WalletEnrollmentSandbox(props: WalletEnrollmentSandboxProps): unknown {
  const {
    active,
    enrollmentAttempt,
    enrollmentView,
    onComplete,
    onPreparationError,
    onPrepared,
    preparing,
    targetElement,
    resourceIdentity,
  } = props;
  const scope = useSignalScope(applicationScope);
  const intl = useIntl();
  const styleVariables = useSignalValue(styleVariablesSignal) ?? {};
  const reactId = React.useId();
  const activeRef = React.useRef(active);
  const completedWhileHidden = React.useRef(false);
  const registrationRef = React.useRef<WalletRegistration | null>(null);
  const hiddenTargetRef = React.useRef(null as HTMLElement | null);
  const bootstrapCache = React.useRef(
    new Map<string, Promise<WalletToolResult>>(),
  );
  const [bootstrapRetry, setBootstrapRetry] = React.useState(0);
  const [bootstrap, setBootstrap] =
    React.useState<WalletBootstrapState | null>(null);
  const [bridge, setBridge] = React.useState<WalletBridge | null>(null);
  const [webview, setWebview] = React.useState<WalletWebview | null>(null);
  const [sandboxReady, setSandboxReady] = React.useState(false);
  const connectorId =
    resourceIdentity.identity.kind === "connector"
      ? resourceIdentity.identity.connectorId
      : null;
  const sourceQuery = useSignalFamilyValue(resourceSourceQuery, {
    identity: resourceIdentity.identity,
    locale: intl.locale,
    widgetDomain: null,
  });
  const sourceUrl = sourceQuery.data?.sourceUrl;
  const sandboxId = sourceUrl == null ? null : createSandboxId(sourceUrl);
  const widgetId = `wallet-onboarding-${reactId}`;

  const assertCurrentAccount = () => {
    if (scope.get(currentResourceSignal, resourceIdentity) !== "current") {
      throw new Error("Wallet enrollment account changed");
    }
  };
  const invokeWalletTool = async (
    suffix: string,
    input: Record<string, unknown>,
  ) => {
    const matcher = new RegExp(`(?:^|[._])(?:wallet_)?${suffix}$`);
    const tool = enrollmentView.serverTools.find((candidate) =>
      matcher.test(candidate.name),
    );
    if (tool == null)
      throw new Error("Wallet registration tool is unavailable");
    const selected = selectWalletTool({
      connectorId,
      server: enrollmentView.server,
      toolName: tool.name,
      tools: enrollmentView.serverTools,
    });
    const result = await invokeTool(
      scope,
      enrollmentView.hostId,
      enrollmentView.server,
      selected.name,
      input,
    );
    assertCurrentAccount();
    return normalizeToolResult({
      isCodexAppsServer: isCodexAppsServer(enrollmentView.server),
      toolResult: result,
    });
  };
  const callTool = async (name: string, input: Record<string, unknown>) => {
    assertCurrentAccount();
    if (name === TOOLS.stage) {
      if (
        !isObject(input) ||
        typeof input.stage !== "string" ||
        !["fields_ready", "save", "sdk_load", "submit"].includes(input.stage) ||
        typeof input.result !== "string" ||
        !["failure", "success"].includes(input.result) ||
        typeof input.duration_ms !== "number" ||
        input.duration_ms < 0
      ) {
        throw new Error("Invalid Wallet onboarding stage event");
      }
      logger.info("wallet_onboarding_sandbox.stage", { safe: input });
      if (preparing && input.stage === "fields_ready") {
        input.result === "success" ? onPrepared() : onPreparationError();
      }
      return {};
    }
    if (name === TOOLS.retryBootstrap) {
      if (!active)
        throw new Error("Wallet onboarding enrollment is not active");
      if (!isObject(input) || Object.keys(input).length !== 0) {
        throw new Error("Invalid Wallet onboarding retry payload");
      }
      setBootstrapRetry((value: number) => value + 1);
      return {};
    }
    if (!(Object.values(TOOLS) as readonly string[]).includes(name)) {
      throw new Error("Wallet onboarding sandbox cannot call this tool");
    }
    if (
      !active &&
      (name !== TOOLS.finalizeCard || registrationRef.current == null)
    ) {
      throw new Error("Wallet onboarding enrollment is not active");
    }
    if (name === TOOLS.registerCard) {
      if (
        typeof input?.vgs_card_id !== "string" ||
        parseBootstrapMetadata(bootstrap?.metadata) == null
      ) {
        throw new Error("Wallet card enrollment is unavailable");
      }
      registrationRef.current = null;
      const result = await invokeWalletTool("register_vgs_agentic_token", {
        vgs_card_id: input.vgs_card_id,
      });
      const registration = parseRegistration(result.structuredContent);
      if (result.isError !== true && registration != null)
        registrationRef.current = registration;
      return result;
    }
    const registration = registrationRef.current;
    if (registration == null)
      throw new Error("Wallet card registration is unavailable");
    if (name === TOOLS.requestVerification) {
      if (
        typeof input?.option_id !== "string" ||
        !registration.optionIds.has(input.option_id)
      ) {
        throw new Error("Wallet verification option is unavailable");
      }
      return invokeWalletTool("request_vgs_card_verification", {
        registration_id: registration.id,
        option_id: input.option_id,
      });
    }
    if (name === TOOLS.verifyCard) {
      if (typeof input?.otp !== "string" || !/^[0-9]{6}$/.test(input.otp)) {
        throw new Error("Invalid Wallet verification code");
      }
      return invokeWalletTool("verify_vgs_card", {
        registration_id: registration.id,
        otp: input.otp,
      });
    }
    if (!isObject(input) || Object.keys(input).length !== 0) {
      throw new Error("Invalid Wallet finalization payload");
    }
    const result = await invokeWalletTool("finalize_vgs_card_registration", {
      registration_id: registration.id,
    });
    if (
      result.isError !== true &&
      validFinalization(result.structuredContent)
    ) {
      registrationRef.current = null;
      if (activeRef.current) onComplete();
      else completedWhileHidden.current = true;
    }
    return result;
  };
  const effectCallTool = React.useEffectEvent?.(callTool) ?? callTool;
  const preparationError =
    React.useEffectEvent?.(() => onPreparationError()) ??
    (() => onPreparationError());
  const flushCompletion =
    React.useEffectEvent?.(() => {
      if (active && completedWhileHidden.current) {
        completedWhileHidden.current = false;
        onComplete();
      }
    }) ?? (() => {});

  React.useLayoutEffect(() => {
    if (sandboxId == null) return;
    const element = document.createElement("webview") as unknown as WalletWebview;
    element.className = "h-full w-full overflow-hidden border-0";
    element.setAttribute("partition", createSandboxPartition(sandboxId));
    setWebview(element);
    return () => {
      element.remove();
      element.destroy?.();
      setWebview((current) => (current === element ? null : current));
    };
  }, [sandboxId]);

  React.useLayoutEffect(() => {
    activeRef.current = active;
    flushCompletion();
    if (webview == null) return;
    const target = active ? targetElement : hiddenTargetRef.current;
    if (target != null && webview.parentElement !== target)
      target.appendChild(webview);
  }, [active, webview, targetElement]);

  React.useLayoutEffect(() => {
    if (webview == null || sandboxId == null || sourceUrl == null) return;
    const origin = getTrustedSandboxOrigin(sourceUrl, { requireSkybridge: true });
    if (origin == null) {
      logger.warning("wallet_onboarding_sandbox.invalid_origin", {
        safe: {},
      });
      preparationError();
      return;
    }
    const abort = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const startedAt = performance.now();
    setSandboxReady(false);
    const theme =
      document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const html = buildWalletEnrollmentHtml(localizedMessages(intl), {
      styleVariables,
      theme,
    });
    const hostContext = createHostContext(intl.locale, styleVariables, theme);
    createWalletBridge({
      hostApiHandlers: {
        callMcp: () =>
          Promise.reject(
            new Error("Wallet onboarding sandbox cannot make MCP requests"),
          ),
        callTool: effectCallTool,
        notifyBackgroundColor() {},
        notifyEnvironmentError: preparationError,
        notifyIntrinsicHeight() {},
        notifyIntrinsicWidth() {},
        notifyNavigation() {},
        notifySecurityPolicyViolation: preparationError,
        openExternal() {},
        requestDisplayMode: () => ({ mode: "inline" }),
        sendFollowUpMessage: () =>
          Promise.reject(
            new Error("Wallet onboarding sandbox cannot send follow-ups"),
          ),
        sendInstrument() {},
        updateWidgetState() {},
      },
      origin,
      sandboxId,
      signal: abort.signal,
      sourceUrl,
      webview,
    })
      .then(async (nextBridge) => {
        if (abort.signal.aborted) return;
        setBridge(nextBridge);
        const statuses = nextBridge.runWidgetCode({
          csp: WALLET_CSP,
          displayMode: "inline",
          features: [],
          html,
          isFirstParty: false,
          isSidebarOpen: false,
          isTombstone: false,
          maxHeight: 620,
          maxWidth: 568,
          measureWidth: false,
          mcpApps: {
            hostCapabilities: { sandbox: { csp: WALLET_CSP } },
            hostContext,
            hostInfo: { name: "chatgpt" },
          },
          safeArea: { insets: { bottom: 0, left: 0, right: 0, top: 0 } },
          theme,
          toolInput: null,
          toolOutput: null,
          toolResponseMetadata: null,
          userAgent: {
            capabilities: { hover: true, touch: false },
            device: { os: "unknown", platform: "native", type: "desktop" },
          },
          viewParams: null,
          widgetId,
          widgetState: null,
        });
        timeout = setTimeout(() => {
          if (!abort.signal.aborted) {
            logger.warning("wallet_onboarding_sandbox.init_failed", {
              safe: { errorName: "TimeoutError" },
            });
            preparationError();
            abort.abort();
          }
        }, SANDBOX_TIMEOUT_MS);
        const status = await waitForRunningStatus(
          statuses,
          abort.signal,
          () => {
            clearTimeout(timeout);
            setSandboxReady(true);
            logger.info("wallet_onboarding_sandbox.initialized", {
              safe: {
                durationMs: Math.max(
                  0,
                  Math.round(performance.now() - startedAt),
                ),
              },
            });
          },
        );
        if (status === "ended" && !abort.signal.aborted) {
          clearTimeout(timeout);
          logger.warning("wallet_onboarding_sandbox.init_failed", {
            safe: { errorName: "MissingRunningStatus" },
          });
          preparationError();
        }
      })
      .catch((error: unknown) => {
        if (!abort.signal.aborted) {
          logger.warning("wallet_onboarding_sandbox.init_failed", {
            safe: {
              errorName: error instanceof Error ? error.name : "UnknownError",
            },
          });
          preparationError();
        }
      });
    return () => {
      clearTimeout(timeout);
      abort.abort();
      setSandboxReady(false);
      setBridge(null);
    };
  }, [intl, webview, sandboxId, scope, sourceUrl, widgetId]);

  React.useEffect(() => {
    if (!preparing || enrollmentAttempt === 0) return;
    const cacheKey = JSON.stringify([
      connectorId,
      enrollmentView.hostId,
      enrollmentView.server,
      enrollmentView.tool.name,
      enrollmentAttempt,
      bootstrapRetry,
    ]);
    setBootstrap({
      attempt: enrollmentAttempt,
      metadata: null,
      retry: bootstrapRetry,
      status: "loading",
    });
    let request = bootstrapCache.current.get(cacheKey);
    if (request == null) {
      const startedAt = performance.now();
      request = invokeTool(
        scope,
        enrollmentView.hostId,
        enrollmentView.server,
        enrollmentView.tool.name,
        {},
      ).then((result) => {
        logger.info("wallet_onboarding_sandbox.bootstrap", {
          safe: {
            durationMs: Math.max(
              0,
              Math.round(performance.now() - startedAt),
            ),
          },
        });
        return result;
      });
      bootstrapCache.current.set(cacheKey, request);
    }
    let stopped = false;
    const timer = setTimeout(() => {
      if (!stopped) {
        stopped = true;
        setBootstrap({
          attempt: enrollmentAttempt,
          metadata: null,
          retry: bootstrapRetry,
          status: "error",
        });
        preparationError();
      }
    }, SANDBOX_TIMEOUT_MS);
    request
      .then((result) => {
        if (stopped) return;
        const normalized =
          normalizeToolResult({
            isCodexAppsServer: isCodexAppsServer(enrollmentView.server),
            toolResult: result,
          });
        const metadata =
          extractStructuredContent({ toolResult: normalized }) ??
          normalized.structuredContent;
        const valid = parseBootstrapMetadata(metadata);
        setBootstrap({
          attempt: enrollmentAttempt,
          metadata: valid,
          retry: bootstrapRetry,
          status: valid == null ? "error" : "ready",
        });
        if (valid == null) preparationError();
      })
      .catch(() => {
        if (!stopped) {
          setBootstrap({
            attempt: enrollmentAttempt,
            metadata: null,
            retry: bootstrapRetry,
            status: "error",
          });
          preparationError();
        }
      })
      .finally(() => clearTimeout(timer));
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [
    bootstrapRetry,
    connectorId,
    enrollmentAttempt,
    enrollmentView,
    preparing,
    scope,
  ]);

  React.useEffect(() => {
    if (!sandboxReady || bridge == null) return;
    const theme =
      document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const hostContext = createHostContext(intl.locale, styleVariables, theme);
    Promise.all([
      bridge.setTheme({ theme }),
      bridge.notifyMcpAppsHostContext({ hostContext }),
    ]).catch(() => {});
  }, [styleVariables, intl.locale, sandboxReady, bridge]);

  React.useEffect(() => {
    if (!sandboxReady || bridge == null) return;
    const current =
      preparing && bootstrap?.attempt === enrollmentAttempt ? bootstrap : null;
    bridge
      .setWidgetData({
        toolInput:
          current == null
            ? null
            : {
                bootstrap_retry: current.retry,
                bootstrap_status: current.status,
                enrollment_attempt: current.attempt,
                enrollment_requested: true,
                style_variables: styleVariables,
              },
        toolOutput: null,
        toolResponseMetadata: current?.metadata ?? null,
        widgetId,
        widgetState: null,
      })
      .catch(() => {});
  }, [
    bootstrap,
    enrollmentAttempt,
    styleVariables,
    sandboxReady,
    preparing,
    bridge,
    widgetId,
  ]);

  return jsx.jsx("div", {
    ref: hiddenTargetRef,
    "aria-hidden": "true",
    className: "pointer-events-none fixed h-px w-px overflow-hidden opacity-0",
  });
}

function createHostContext(
  locale: string,
  styles: Record<string, string>,
  theme: string,
) {
  return {
    availableDisplayModes: ["inline"],
    containerDimensions: { maxHeight: 620, maxWidth: 568 },
    deviceCapabilities: { hover: true, touch: false },
    displayMode: "inline",
    locale,
    platform: "desktop",
    safeAreaInsets: { bottom: 0, left: 0, right: 0, top: 0 },
    styles: { variables: styles },
    theme,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: "chatgpt",
  };
}

async function waitForRunningStatus(
  statuses: AsyncIterable<unknown>,
  signal: AbortSignal,
  onRunning: () => void,
): Promise<"aborted" | "running" | "ended"> {
  for await (const status of statuses) {
    if (signal.aborted) return "aborted";
    const parsed = widgetRunningStatusSchema.safeParse(status);
    if (parsed?.success || (isObject(status) && status.status === "running")) {
      onRunning();
      return "running";
    }
  }
  return "ended";
}

function WalletEnrollmentDialog({
  completed,
  dismissAnnouncement,
  onBack,
  onRetry,
  preparationFailed = false,
  setSandboxTarget,
}: WalletEnrollmentDialogProps): unknown {
  const reducedMotion = useReducedMotion();
  let content: unknown;
  if (completed) {
    content = jsx.jsx(Motion.div, {
      animate: { opacity: 1, y: 0 },
      className:
        "flex min-h-0 flex-1 items-center justify-center px-6 select-none",
      initial: !reducedMotion && { opacity: 0, y: 12 },
      transition: { duration: reducedMotion ? 0 : 0.28 },
      children: jsx.jsx(Result, {
        className: "items-center text-center",
        icon: jsx.jsx(Motion.span, {
          animate: { rotate: 0, scale: 1 },
          className: "flex",
          initial: !reducedMotion && { rotate: -18, scale: 0 },
          transition: reducedMotion
            ? { duration: 0 }
            : { damping: 18, delay: 0.12, stiffness: 320, type: "spring" },
          children: jsx.jsx(Icon, {
            "aria-hidden": true,
            asset: checkIconAsset,
          }),
        }),
        iconBackgroundClassName: "bg-chart-green/20",
        iconClassName: "mx-auto text-chart-green",
        title: jsx.jsx(Heading, {
          children: jsx.jsx(FormattedMessage, {
            id: "codexWalletOnboardingEnrollmentModal.successTitle",
            defaultMessage: "Your card was successfully saved",
            description:
              "Heading shown after a card is saved during ChatGPT Wallet onboarding",
          }),
        }),
        subtitle: jsx.jsx(FormattedMessage, {
          id: "codexWalletOnboardingEnrollmentModal.successDescription",
          defaultMessage: "You’re ready to go",
          description:
            "Confirmation shown after a card is saved during ChatGPT Wallet onboarding",
        }),
      }),
    });
  } else if (preparationFailed) {
    content = jsx.jsxs("div", {
      className:
        "flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center select-none",
      children: [
        jsx.jsx(Heading, {
          children: jsx.jsx(FormattedMessage, {
            id: "codexWalletOnboardingEnrollmentModal.preparationErrorTitle",
            defaultMessage: "Unable to add your card",
            description:
              "Heading shown when Wallet onboarding cannot initialize secure card enrollment",
          }),
        }),
        jsx.jsx("p", {
          role: "alert",
          className: "text-secondary",
          children: jsx.jsx(FormattedMessage, {
            id: "codexWalletOnboardingEnrollmentModal.preparationError",
            defaultMessage: "The secure card session is unavailable or expired",
            description:
              "Error shown when Wallet onboarding cannot initialize secure card enrollment",
          }),
        }),
        jsx.jsx(Button, {
          className: "w-full justify-center",
          color: "primary",
          size: "large",
          onClick: onRetry,
          children: jsx.jsx(FormattedMessage, {
            id: "codexWalletOnboardingEnrollmentModal.retryPreparation",
            defaultMessage: "Try again",
            description:
              "Button that retries secure Wallet card-enrollment initialization",
          }),
        }),
      ],
    });
  } else {
    content = jsx.jsxs(jsx.Fragment, {
      children: [
        jsx.jsx(Heading, {
          className: "sr-only",
          children: jsx.jsx(FormattedMessage, {
            id: "codexWalletOnboardingEnrollmentModal.title",
            defaultMessage: "Add a card to ChatGPT Wallet",
            description: "Accessible title for ChatGPT Wallet card enrollment",
          }),
        }),
        jsx.jsx("div", {
          ref: setSandboxTarget,
          className: "relative min-h-0 flex-1 overflow-hidden bg-surface",
        }),
      ],
    });
  }
  const action = jsx.jsx("div", {
    className: "shrink-0 bg-surface px-6 pb-6",
    children: jsx.jsx(Button, {
      className: "w-full justify-center",
      color: completed ? "primary" : "ghostTertiary",
      size: "large",
      onClick: completed ? dismissAnnouncement : onBack,
      children: jsx.jsx(FormattedMessage, {
        id: completed
          ? "codexWalletOnboardingEnrollmentModal.continue"
          : "codexWalletOnboardingEnrollmentModal.back",
        defaultMessage: completed ? "Continue" : "Back",
        description: completed
          ? "Button that closes the ChatGPT Wallet onboarding announcement after a card is saved"
          : "Button that returns from Wallet card enrollment to the Wallet introduction",
      }),
    }),
  });
  return jsx.jsx(Dialog, {
    open: true,
    contentClassName:
      "h-[min(504px,calc(100dvh-32px))] w-[min(480px,92vw)] !rounded-[16px] !bg-surface !ring-0 !backdrop-blur-none",
    contentProps: { "aria-describedby": undefined },
    dialogCloseClassName: "z-10",
    dialogCloseLabel: jsx.jsx(FormattedMessage, {
      id: "codexWalletOnboardingEnrollmentModal.close",
      defaultMessage: "Close",
      description:
        "Accessible label for closing ChatGPT Wallet card enrollment",
    }),
    onOpenChange: (open: boolean) => {
      if (!open) dismissAnnouncement();
    },
    size: "feature",
    children: jsx.jsxs("div", {
      className: "flex h-full min-h-0 flex-col",
      children: [content, action],
    }),
  });
}

function initializeWalletOnboardingAnnouncementContent(): void {
  if (initialized) return;
  initialized = true;
  initializeRuntimeLazy();
  initializeMotionRuntime();
  initializeSignalRuntime();
  initializeMotionPreferences();
  initializeSandboxUrls();
  React = reactRuntime;
  initializeSharedComponents();
  initializeDialogComponents();
  initializeResourceIdentity();
  initializeResourceQueries();
  initializeResourceSourceQuery();
  initializeToolInvocation();
  initializeServerClassification();
  initializeMcpHostApi();
  initializeToolResultMetadata();
  initializeWidgetBridge();
  initializeWidgetHost();
  initializeSharedRuntime();
  initializeQueryRuntime();
  initializeIconAsset();
  initializeWalletRuntime();
  jsx = getJsxRuntime();
}

initializeWalletOnboardingAnnouncementContent();

export { WalletOnboardingAnnouncement };
