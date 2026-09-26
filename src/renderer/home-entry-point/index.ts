// home-entry-point —— Home composer 下方的 CME 快捷入口。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as cmeChunk from "@rchunk/chatgpt-cme";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;
const cme = cmeChunk as Record<string, any>;

const {
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
} = appShared;
const { sZ: createDerivedSignal } = appSharedChunk;

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
  const scope = useSignalScope(appInitial.kht);
  const editor = appInitial.HZ?.() as ComposerEditor | undefined;
  const editorReady = appInitial.UZ?.(editor, editorIsEmpty) ?? true;
  const account = appInitial.uht?.() ?? {};
  const eligible = useSignalValue(cmeEligibilitySignal) === true;
  const location = appInitial.i_n?.() ?? { search: "" };
  if (
    appInitial.N9?.("(width < 48rem)") ||
    !appInitial.Vln?.(account.data?.plan_type) ||
    !eligible ||
    !editorReady ||
    appInitial.yln?.(location.search)
  ) {
    return null;
  }
  const onClick = () => {
    const accountCheck = scope.queryClient?.getQueryData?.([
      "accounts",
      "check",
    ]) as AccountCheckResult | undefined;
    if (
      scope.get(cmeEligibilitySignal) &&
      accountCheck?.account_ordering?.[0] === account.data?.id
    ) {
      appInitial.b2?.(scope, scope.get(appInitial.v2), ["cme"]);
      editor?.focus?.();
      appInitial.xpn?.(scope, cme.n, {});
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
  cme.r?.();
  initializeSignalRuntime?.();
  initializeIntl?.();
  appInitial.Qgn?.();
  appInitial.ket?.();
  appInitial.RIt?.();
  appInitial.$Bt?.();
  appInitial.y2?.();
  appInitial.vln?.();
  appInitial.rht?.();
  initializeComposerEditorState?.();
  appInitial.VZ?.();
  initializeButton?.();
  initializeImportIcons?.();
  appInitial.M9?.();
  appInitial.ypn?.();
  appInitial.Rht?.();
  appInitial.Rln?.();
  jsx ??= resolveRuntime<JsxRuntime>(jsxRuntime);
  cmeEligibilitySignal =
    createDerivedSignal(
      appInitial.kht,
      ({ get }) =>
        get<{ isCapable?: boolean }>(appInitial.Xet, {
          name: "chatgpt.cme",
        }).isCapable === true &&
        get<unknown[]>(appInitial.NIt, get(appInitial.v2)).length === 0 &&
        get<{ data?: Array<{ system_hint?: string }> }>(appInitial.YBt).data?.some(
          (entry: { system_hint?: string }) => entry.system_hint === "cme",
        ) === true,
    );
}

initializeCmeHomeEntryPoint();

export { CmeHomeEntryPoint };
