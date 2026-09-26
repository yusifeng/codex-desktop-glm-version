// home-entry-point —— Home composer 下方的 CME 快捷入口。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as cmeChunk from "@rchunk/chatgpt-cme";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;
const cme = cmeChunk as Record<string, any>;

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
  jsxs(type: unknown, props: Record<string, unknown>): unknown;
}

let jsx: JsxRuntime | null = null;
let cmeEligibilitySignal: unknown = Symbol("cme-home-entry-point");
let initialized = false;

function editorIsEmpty(editor: any): boolean {
  return (
    !editor.hasText() &&
    appShared.wu?.getState(editor.view.state)?.active !== true
  );
}

function CmeHomeEntryPoint(): unknown {
  initializeCmeHomeEntryPoint();
  const scope = appShared.LX(appInitial.kht);
  const editor = appInitial.HZ?.();
  const editorReady = appInitial.UZ?.(editor, editorIsEmpty) ?? true;
  const account = appInitial.uht?.() ?? {};
  const eligible = appShared.HX?.(cmeEligibilitySignal) === true;
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
    ]);
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
  const Button = appShared.Yh ?? "button";
  const Message = appShared.Y2;
  const Icon = appShared.Vb;
  return renderer.jsx("div", {
    className: "mt-11 flex justify-center max-md:hidden",
    children: renderer.jsxs(Button, {
      color: "outlineGhost",
      radius: "full",
      size: "large",
      onClick,
      children: [
        Icon == null ? null : renderer.jsx(Icon, {}),
        renderer.jsx(Message, {
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
  appShared.FX?.();
  appShared.K2?.();
  appInitial.Qgn?.();
  appInitial.ket?.();
  appInitial.RIt?.();
  appInitial.$Bt?.();
  appInitial.y2?.();
  appInitial.vln?.();
  appInitial.rht?.();
  appShared.Eu?.();
  appInitial.VZ?.();
  appShared.Zh?.();
  appShared.lw?.();
  appInitial.M9?.();
  appInitial.ypn?.();
  appInitial.Rht?.();
  appInitial.Rln?.();
  jsx ??= typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
  cmeEligibilitySignal =
    appShared.sZ?.(
      appInitial.kht,
      ({ get }: { get(signal: unknown, key?: unknown): any }) =>
        get(appInitial.Xet, { name: "chatgpt.cme" }).isCapable &&
        get(appInitial.NIt, get(appInitial.v2)).length === 0 &&
        get(appInitial.YBt).data?.some(
          (entry: { system_hint?: string }) => entry.system_hint === "cme",
        ) === true,
    ) ?? cmeEligibilitySignal;
}

initializeCmeHomeEntryPoint();

export { CmeHomeEntryPoint };
