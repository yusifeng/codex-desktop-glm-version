// Blocking ChatGPT ads-consent boundary. Release chunk: consent-1e345bc20d6a.js.
import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as controlDialogChunk from "@rchunk/ad-control-dialog-runtime";
import * as adsControlsStateChunk from "@rchunk/ads-controls-state";

type ConsentSelection = "personalized" | "non_personalized";
type ConsentState = { status: "loading" | "inactive" } | { status: "required"; accountId: string; variant: string; isTwoStep: boolean };
interface Scope { get(signal: unknown): unknown; set(signal: unknown, value: unknown): void }
interface Getter { (signal: unknown, parameter?: unknown): unknown }
interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface ReactRuntime { useRef<T>(value: T): { current: T }; useState<T>(value: T): [T, (value: T) => void] }
interface SharedRuntime {
  $3(): unknown; FX(): void; HX<T>(signal: unknown): T; I3(): JsxRuntime; Ih: unknown; K2(): void; LX(signal: unknown): Scope; Oh: unknown; QI(): void; Rh: unknown; Yh: unknown; ZI: unknown; Zh(): void;
  dZ(signal: unknown, read: (context: { get: Getter }) => unknown, subscribe: (context: { get: Getter; set(signal: unknown): void }) => void | (() => void)): unknown;
  e6(): ReactRuntime; fg(): boolean; h4(): void; iL(options: { mutationFn(selection: ConsentSelection): Promise<boolean>; onSuccess(saved: boolean): void }): { mutate(selection: ConsentSelection): void; isPending: boolean; data?: boolean };
  m4(...classes: Array<string | false | null | undefined>): string; n4(): unknown; rL(): void; sZ(signal: unknown, read: (context: { get: Getter }) => ConsentState): unknown; zh(): void;
}
interface InitialRuntime {
  $qt(): void; Bqt: Record<string, unknown>; Dqt(value: unknown): { enabled: boolean; variant?: string; isTwoStep: boolean }; Oqt(): void; Qgn(): void; Sqt(): void; Sun(): void; U6t: unknown; Xet: unknown; Zet(): void; _un: unknown; bqt: unknown; gfn: unknown; i_n(): { pathname: string }; mfn: unknown; pfn(): void; vfn: unknown; xpn(scope: Scope, signal: unknown, event: Record<string, unknown>): void; ypn(): void; zqt: unknown;
}
interface ControlDialogRuntime { a(): void; d(formatter: unknown, variant: string): unknown; i(): void; n: unknown; o: { scope: string }; s(): void; u: unknown }
interface AdsControlsStateRuntime { a(scope: Scope, accountId: string, setting: { feature: string; value: boolean }, source: string): Promise<boolean>; i(): void }
const shared = sharedChunk as unknown as SharedRuntime;
const initial = initialChunk as unknown as InitialRuntime;
const controlDialog = controlDialogChunk as unknown as ControlDialogRuntime;
const adsControlsState = adsControlsStateChunk as unknown as AdsControlsStateRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
let consentStateSignal: unknown;
let initialized = false;
const firstAdImage = new URL("consent-modal-villa-8440051c898b.png", import.meta.url).href;
const secondAdImage = new URL("consent-modal-restaurant-2888e7130740.png", import.meta.url).href;

function readConsentState(get: Getter): ConsentState {
  const capability = get(initial.Xet, { name: "chatgpt.ads" }) as { isLoading?: boolean; isCapable?: boolean };
  const accountId = get(initial.U6t);
  if (capability.isLoading) return { status: "loading" };
  if (!capability.isCapable || typeof accountId !== "string") return { status: "inactive" };
  const settings = get(initial.bqt) as { isLoading?: boolean; data?: { bazaarConsentRequired?: boolean; bazaarPersonalizationUnavailable?: boolean } };
  const configClient = get(initial.gfn) as { getValues?(): unknown } | null;
  const config = configClient == null ? null : initial.Dqt(configClient.getValues?.());
  const bypass = Boolean(get(initial.mfn, "3274900344"));
  const suppress = Boolean(get(initial.vfn));
  if (settings.isLoading || config == null || suppress) return { status: "loading" };
  if (config.variant == null || (!bypass && (!config.enabled || settings.data?.bazaarConsentRequired !== true || settings.data.bazaarPersonalizationUnavailable))) return { status: "inactive" };
  return { status: "required", accountId, variant: config.variant, isTwoStep: config.isTwoStep };
}

function recordShown(scope: Scope, accountId: string): void {
  const state = scope.get(consentStateSignal) as ConsentState;
  if (state.status !== "required" || state.accountId !== accountId) return;
  initial.xpn(scope, initial.zqt, { action: initial.Bqt.CHATGPT_ADS_CONSENT_MODAL_ACTION_TYPE_MODAL_SHOWN, consentRequired: true, selectionPreselected: false });
}

async function saveConsent(scope: Scope, accountId: string, selection: ConsentSelection): Promise<boolean> {
  const state = scope.get(consentStateSignal) as ConsentState;
  if (state.status !== "required" || state.accountId !== accountId) return false;
  const personalized = selection === "personalized";
  const saved = await adsControlsState.a(scope, accountId, { feature: "bazaar_personalization_enabled", value: personalized }, "consent");
  if (saved) initial.xpn(scope, initial.zqt, { action: personalized ? initial.Bqt.CHATGPT_ADS_CONSENT_MODAL_ACTION_TYPE_SAVE_PERSONALIZATION_ENABLED : initial.Bqt.CHATGPT_ADS_CONSENT_MODAL_ACTION_TYPE_SAVE_PERSONALIZATION_DISABLED, consentRequired: true, personalizationEnabled: personalized, selectionPreselected: false });
  return saved;
}

function ConsentModal({ state, onSaved }: { state: Extract<ConsentState, { status: "required" }>; onSaved(): void }): unknown {
  const scope = shared.LX(shared.ZI);
  const formatter = shared.n4();
  const dark = shared.fg();
  const [selection, setSelection] = React.useState<ConsentSelection | null>(null);
  const shown = React.useRef(false);
  const mutation = shared.iL({ mutationFn: (value) => saveConsent(scope, state.accountId, value), onSuccess: (saved) => { if (saved) onSaved(); } });
  const onOpenAutoFocus = (): void => { if (!shown.current) { shown.current = true; recordShown(scope, state.accountId); } };
  const onSubmit = (event: { preventDefault(): void }): void => { event.preventDefault(); if (state.isTwoStep && selection != null && !mutation.isPending) mutation.mutate(selection); };
  const onSave = (value: ConsentSelection): void => { if (!mutation.isPending) mutation.mutate(value); };
  const content = jsx.jsx(controlDialog.u, { consentModalVariant: state.variant, isTwoStepModal: state.isTwoStep, isSaving: mutation.isPending, selection, onSelectionChange: setSelection, onSave, firstAdImage, secondAdImage, Button: shared.Yh });
  return jsx.jsx(shared.Ih, { open: true, variant: "chatgpt", size: "compact", showDialogClose: false, shouldIgnoreClickOutside: true, contentClassName: shared.m4(controlDialog.o.scope, dark && "dark"), contentProps: { "aria-describedby": undefined, onEscapeKeyDown: (event: { preventDefault(): void }) => event.preventDefault(), onOpenAutoFocus }, children: jsx.jsxs(shared.Oh, { as: "form", variant: "chatgpt", onSubmit, children: [jsx.jsx(shared.Rh, { className: "sr-only", children: controlDialog.d(formatter, state.variant) }), content, mutation.data === false ? jsx.jsx(controlDialog.n, {}) : null] }) });
}

function ChatGptAdsConsentBoundary({ children }: { children?: unknown }): unknown {
  initialize();
  const state = shared.HX<ConsentState>(consentStateSignal);
  const userId = shared.HX<string | null>(initial._un);
  const { pathname } = initial.i_n();
  if (state.status === "inactive") return jsx.jsx(jsx.Fragment, { children });
  if (state.status === "loading" || pathname.startsWith("/settings")) return null;
  if (state.status !== "required") return null;
  const [saved, setSaved] = React.useState(false);
  if (saved) return jsx.jsx(jsx.Fragment, { children });
  return jsx.jsx(ConsentModal, { state, onSaved: () => setSaved(true) }, state.accountId + ":" + userId);
}

function initialize(): void {
  if (initialized) return;
  initialized = true;
  initial.$qt(); shared.FX(); initial.Zet(); initial.Oqt(); initial.Sqt(); initial.ypn(); shared.QI(); adsControlsState.i(); initial.pfn(); controlDialog.s(); shared.rL(); shared.h4(); shared.K2(); initial.Qgn(); initial.Sun(); shared.Zh(); shared.zh(); controlDialog.a(); controlDialog.i();
  const configSignal = shared.dZ(shared.ZI, ({ get }) => { const client = get(initial.gfn) as { getValues?(): unknown } | null; return client == null ? null : initial.Dqt(client.getValues?.()); }, ({ get, set }) => { const client = get(initial.gfn) as { on?(event: string, listener: () => void): void; off?(event: string, listener: () => void): void } | null; if (client == null) return; const update = () => set(configSignal); client.on?.("values_updated", update); return () => client.off?.("values_updated", update); });
  void configSignal;
  consentStateSignal = shared.sZ(shared.ZI, ({ get }) => readConsentState(get));
  React = shared.e6();
  jsx = shared.I3();
}

initialize();
export { ChatGptAdsConsentBoundary };
