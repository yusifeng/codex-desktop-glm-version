// home-entry-point —— Home composer 下方的 CME 快捷入口。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as cmeChunk from "@rchunk/chatgpt-cme";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const {
  $3: initializeJsxRuntimeLazy,
  Eu: initializeComposerEditorState,
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  I3: jsxRuntime,
  K2: initializeIntl,
  LX: useSignalScope,
  Vb: CmeIcon,
  Y2: FormattedMessage,
  Yh: Button,
  Zh: initializeButton,
  lw: initializeImportIcons,
  wu: composerMentionState,
  sZ: createDerivedSignal,
} = appSharedChunk;
const {
  $Bt: initializeAccountHints,
  HZ: useComposerEditor,
  M9: initializeMediaQuery,
  N9: matchesMediaQuery,
  NIt: selectedComposerModesSignal,
  Qgn: initializeAccountQueries,
  RIt: initializeComposerReadiness,
  Rht: initializeWorkspaceState,
  Rln: initializeAccountPlanHelpers,
  UZ: useEditorPredicate,
  VZ: initializeComposerEditorBridge,
  Vln: isEligibleCmePlan,
  Xet: accountCapabilitySignal,
  YBt: accountSystemHintsSignal,
  Zet: initializeComposerState,
  b2: setComposerModes,
  i_n: useRouterLocation,
  kht: applicationScope,
  rht: initializeAccountState,
  uht: useCurrentAccount,
  v2: composerModesSignal,
  vln: initializePlanEligibility,
  xpn: logAnalyticsEvent,
  y2: initializeComposerModeState,
  yln: hasUnsupportedHomeSearch,
  ypn: initializeAnalytics,
} = appInitialChunk;
const {
  n: cmeAnalyticsEvent,
  r: initializeCme,
} = cmeChunk;

interface JsxRuntime {
  jsx(type: unknown, props: unknown): unknown;
  jsxs(type: unknown, props: unknown): unknown;
}

interface ComposerEditor {
  focus?(): void;
  hasText(): boolean;
  view: { state: unknown };
}

interface AccountCheckResult {
  account_ordering?: string[];
}

type EligibilitySignal = import("@rchunk/app-shared").ScopedDerivedSignal<
  unknown,
  boolean
>;

function resolveRuntime<Runtime>(runtimeOrFactory: unknown): Runtime {
  return (typeof runtimeOrFactory === "function"
    ? runtimeOrFactory()
    : runtimeOrFactory) as Runtime;
}

let jsx: JsxRuntime | null = null;
let cmeEligibilitySignal = Symbol(
  "cme-home-entry-point",
) as unknown as EligibilitySignal;
let initialized = false;

function editorIsEmpty(editor: ComposerEditor): boolean {
  return (
    !editor.hasText() &&
    composerMentionState?.getState(editor.view.state)?.active !== true
  );
}

function CmeHomeEntryPoint(): unknown {
  initializeCmeHomeEntryPoint();
  const scope = useSignalScope(applicationScope);
  const editor = useComposerEditor?.() as ComposerEditor | undefined;
  const editorReady = useEditorPredicate?.(editor, editorIsEmpty) ?? true;
  const account = useCurrentAccount?.() ?? {
    data: undefined,
    isLoading: false,
  };
  const eligible = useSignalValue(cmeEligibilitySignal) === true;
  const location = useRouterLocation?.() ?? { search: "" };
  if (
    matchesMediaQuery?.("(width < 48rem)") ||
    !isEligibleCmePlan?.(account.data?.plan_type) ||
    !eligible ||
    !editorReady ||
    hasUnsupportedHomeSearch?.(location.search)
  ) {
    return null;
  }
  const onClick = () => {
    const queryClient = scope.queryClient as {
      getQueryData?<Data>(queryKey: readonly unknown[]): Data | undefined;
    };
    const accountCheck = queryClient.getQueryData?.<AccountCheckResult>([
      "accounts",
      "check",
    ]);
    if (
      scope.get(cmeEligibilitySignal) &&
      accountCheck?.account_ordering?.[0] === account.data?.id
    ) {
      setComposerModes?.(scope, scope.get(composerModesSignal), ["cme"]);
      editor?.focus?.();
      logAnalyticsEvent?.(scope, cmeAnalyticsEvent, {});
    }
  };
  const renderer = jsx as JsxRuntime;
  const ButtonComponent = Button ?? "button";
  return renderer.jsx("div", {
    className: "mt-11 flex justify-center max-md:hidden",
    children: renderer.jsxs(ButtonComponent, {
      color: "outlineGhost",
      radius: "full",
      size: "large",
      onClick,
      children: [
        CmeIcon == null ? null : renderer.jsx(CmeIcon, {}),
        renderer.jsx(FormattedMessage, {
          id: "chatgpt.composer.connector_pill.cme.button.label",
          defaultMessage: "Try Continuing Medical Education (CME)",
          description:
            "Button below the new-chat composer in a clinician workspace.",
        }),
      ],
    }),
  });
}

function initializeCmeHomeEntryPoint(): void {
  if (initialized) return;
  initialized = true;
  initializeJsxRuntimeLazy?.();
  initializeCme?.();
  initializeSignalRuntime?.();
  initializeIntl?.();
  initializeAccountQueries?.();
  initializeComposerState?.();
  initializeComposerReadiness?.();
  initializeAccountHints?.();
  initializeComposerModeState?.();
  initializePlanEligibility?.();
  initializeAccountState?.();
  initializeComposerEditorState?.();
  initializeComposerEditorBridge?.();
  initializeButton?.();
  initializeImportIcons?.();
  initializeMediaQuery?.();
  initializeAnalytics?.();
  initializeWorkspaceState?.();
  initializeAccountPlanHelpers?.();
  jsx ??= resolveRuntime<JsxRuntime>(jsxRuntime);
  cmeEligibilitySignal =
    createDerivedSignal(
      applicationScope,
      ({ get }) =>
        get<{ isCapable?: boolean }>(accountCapabilitySignal, {
          name: "chatgpt.cme",
        }).isCapable === true &&
        get<unknown[]>(selectedComposerModesSignal, get(composerModesSignal)).length === 0 &&
        get<{ data?: Array<{ system_hint?: string }> }>(accountSystemHintsSignal).data?.some(
          (entry: { system_hint?: string }) => entry.system_hint === "cme",
        ) === true,
    );
}

initializeCmeHomeEntryPoint();

export { CmeHomeEntryPoint };
