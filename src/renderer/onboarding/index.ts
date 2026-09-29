import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as documentTitleChunk from "@rchunk/document-title";

type StateUpdater<Value> = Value | ((previous: Value) => Value);
type ChecklistStep = "sidebar" | "pin" | "try";
type SampleKind = "email" | "inventory" | "report";
type AnalyticsAction = "checklist_step_selected" | "sample_selected" | "sidebar_clicked" | "step_viewed";
type AnalyticsStep = "open_sidebar" | "page" | "pin_extension" | "sample_email" | "sample_gallery" | "sample_inventory" | "sample_report";

interface ReactRuntime {
  useEffect?(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useId?(): string;
  useRef<Value>(initialValue: Value): { current: Value };
  useState<Value>(initialValue: Value | (() => Value)): [Value, (next: StateUpdater<Value>) => void];
}
interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface IntlShape { formatMessage(message: { defaultMessage: string; id: string }, values?: Record<string, unknown>): string }
interface ExtensionState { isExtensionPinned: boolean; isSidePanelOpen: boolean }
interface SelectedStep { automaticStep: ChecklistStep; selectedStep: ChecklistStep }
interface ChecklistItem { completed: boolean; enabled: boolean; label: string; step: ChecklistStep }
interface AnalyticsScope {}
interface AnalyticsPayload { action: string; step: string }

const sharedRuntime = appSharedChunk as unknown as {
  $3?(): void;
  HX?<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  LX?(scope: unknown): AnalyticsScope;
  YI?(): string;
  ZI?: unknown;
  dZ?<Value>(scope: unknown, initialValue: Value, setup: (context: { set(value: Value): void }) => void, options: { isEqual(left: Value, right: Value): boolean }): unknown;
  e6(): ReactRuntime;
  n4?(): IntlShape;
};
const initialRuntime = appInitialChunk as unknown as {
  XFt?: unknown;
  YFt?: Partial<Record<string, string>>;
  ZFt?: Partial<Record<string, string>>;
  pIt?(): void;
  xpn?(scope: AnalyticsScope, event: unknown, payload: AnalyticsPayload): void;
  ypn?(): void;
};
const titleRuntime = documentTitleChunk as unknown as { r?(): void; t?: (props: { title: string }) => unknown };
const { $3: initializeSharedRuntime, HX: useSignalValue, I3: getJsxRuntime, LX: useAnalyticsScope, YI: getUserAgent, ZI: applicationScope, dZ: createScopedSignal, e6: getReactRuntime, n4: useIntl } = sharedRuntime;
const { XFt: analyticsEvent, YFt: actionConstants, ZFt: stepConstants, pIt: initializeAnalytics, xpn: trackAnalytics, ypn: initializeOnboardingAnalytics } = initialRuntime;
const { r: initializeDocumentTitle, t: DocumentTitle } = titleRuntime;

initializeSharedRuntime?.();
initializeAnalytics?.();
initializeOnboardingAnalytics?.();
initializeDocumentTitle?.();

const React = getReactRuntime();
const jsx = getJsxRuntime();
const defaultExtensionState: ExtensionState = { isExtensionPinned: false, isSidePanelOpen: false };
const extensionStateSignal = createScopedSignal?.(applicationScope, defaultExtensionState, () => undefined, {
  isEqual: (left, right) => left.isExtensionPinned === right.isExtensionPinned && left.isSidePanelOpen === right.isSidePanelOpen,
}) ?? "extension-onboarding-state";
const actionNames: Record<AnalyticsAction, string> = {
  checklist_step_selected: actionConstants?.CHATGPT_WORK_CHROME_ONBOARDING_ACTION_CHECKLIST_STEP_SELECTED ?? "checklist_step_selected",
  sample_selected: actionConstants?.CHATGPT_WORK_CHROME_ONBOARDING_ACTION_SAMPLE_SELECTED ?? "sample_selected",
  sidebar_clicked: actionConstants?.CHATGPT_WORK_CHROME_ONBOARDING_ACTION_SIDEBAR_CLICKED ?? "sidebar_clicked",
  step_viewed: actionConstants?.CHATGPT_WORK_CHROME_ONBOARDING_ACTION_STEP_VIEWED ?? "step_viewed",
};
const stepNames: Record<AnalyticsStep, string> = {
  open_sidebar: stepConstants?.CHATGPT_WORK_CHROME_ONBOARDING_STEP_OPEN_SIDEBAR ?? "open_sidebar",
  page: stepConstants?.CHATGPT_WORK_CHROME_ONBOARDING_STEP_PAGE ?? "page",
  pin_extension: stepConstants?.CHATGPT_WORK_CHROME_ONBOARDING_STEP_PIN_EXTENSION ?? "pin_extension",
  sample_email: stepConstants?.CHATGPT_WORK_CHROME_ONBOARDING_STEP_SAMPLE_EMAIL ?? "sample_email",
  sample_gallery: stepConstants?.CHATGPT_WORK_CHROME_ONBOARDING_STEP_SAMPLE_GALLERY ?? "sample_gallery",
  sample_inventory: stepConstants?.CHATGPT_WORK_CHROME_ONBOARDING_STEP_SAMPLE_INVENTORY ?? "sample_inventory",
  sample_report: stepConstants?.CHATGPT_WORK_CHROME_ONBOARDING_STEP_SAMPLE_REPORT ?? "sample_report",
};
const checklistAnalyticsStep: Record<ChecklistStep, AnalyticsStep> = { sidebar: "open_sidebar", pin: "pin_extension", try: "sample_gallery" };
const sampleAnalyticsStep: Record<SampleKind, AnalyticsStep> = { email: "sample_email", inventory: "sample_inventory", report: "sample_report" };

function browserName(userAgent: string): string {
  if ((typeof navigator !== "undefined" && "brave" in navigator) || userAgent.includes("Brave/")) return "Brave";
  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("OPR/") || userAgent.includes("Opera/")) return "Opera";
  if (userAgent.includes("Vivaldi/")) return "Vivaldi";
  return "Chrome";
}
function format(message: string, values?: Record<string, unknown>): string {
  if (useIntl == null) return values?.browser == null ? message : message.replace("{browser}", String(values.browser));
  return useIntl().formatMessage({ defaultMessage: message, id: message }, values);
}
function record(scope: AnalyticsScope, action: AnalyticsAction, step: AnalyticsStep): void { trackAnalytics?.(scope, analyticsEvent, { action: actionNames[action], step: stepNames[step] }); }
function automaticStep(state: ExtensionState, usesMenuPinning: boolean): ChecklistStep {
  if (state.isSidePanelOpen && state.isExtensionPinned) return "try";
  if (state.isSidePanelOpen && !usesMenuPinning) return "pin";
  return "sidebar";
}
function button(label: string, options: { ariaCurrent?: string; checked?: boolean; disabled?: boolean; onClick(): void }): unknown {
  return jsx.jsx("button", { type: "button", "aria-current": options.ariaCurrent, "aria-disabled": options.disabled || undefined, "aria-pressed": options.checked, disabled: options.disabled, onClick: options.onClick, children: label });
}
function InstructionPanel({ browser, isPinStep, onOpenSidebar, usesMenuPinning }: { browser: string; isPinStep: boolean; onOpenSidebar(): void; usesMenuPinning: boolean }): unknown {
  const image = isPinStep ? usesMenuPinning ? "pin-menu" : "pin-sidebar" : "open-sidebar";
  const title = isPinStep ? `Add ChatGPT to your ${browser} toolbar` : "Open the ChatGPT extension";
  const description = usesMenuPinning ? "Pin ChatGPT in the Extensions menu, then click ChatGPT in your toolbar to open the sidebar" : isPinStep ? "Pin the extension so you can open ChatGPT quickly from every tab" : `Click the Extensions icon in your ${browser} toolbar, then select ChatGPT. Or click the sidebar button below.`;
  return jsx.jsxs("section", { "aria-label": title, "data-image": image, children: [jsx.jsx("h2", { children: title }), jsx.jsx("p", { children: description }), !isPinStep && !usesMenuPinning ? jsx.jsx("button", { type: "button", "data-chatgpt-extension-action": "open-side-panel", onClick: onOpenSidebar, children: "Open sidebar" }) : null] });
}
function SampleGallery({ onTry }: { onTry(kind: SampleKind): void }): unknown {
  const samples: Array<{ description: string; kind: SampleKind; title: string }> = [
    { description: "Write a reply, follow-up, or new message in the tone you choose", kind: "email", title: "Draft an email" },
    { description: "Summarize a customer research report and identify key decisions", kind: "report", title: "Summarize a report" },
    { description: "Update sold-out products and add a new item", kind: "inventory", title: "Update an inventory system" },
  ];
  return jsx.jsxs("section", { "aria-label": "Try ChatGPT on sample work", children: [jsx.jsx("h2", { children: "Try ChatGPT on sample work" }), ...samples.map((sample) => jsx.jsxs("article", { "data-sample": sample.kind, children: [jsx.jsx("h3", { children: sample.title }), jsx.jsx("p", { children: sample.description }), jsx.jsx("button", { type: "button", "data-chatgpt-extension-action": "open-side-panel", onClick: () => onTry(sample.kind), children: `Try ${sample.title}` })] }, sample.kind))] });
}
function SampleModal({ kind, onClose }: { kind: SampleKind; onClose(): void }): unknown {
  const [inventoryItems, setInventoryItems] = React.useState(3);
  const [saved, setSaved] = React.useState(false);
  const titles: Record<SampleKind, string> = { email: "Reply to Samuel's message", inventory: "Update an inventory system", report: "Q2 Customer Research" };
  return jsx.jsxs("div", { role: "dialog", "aria-label": titles[kind], children: [
    jsx.jsx("h2", { children: titles[kind] }),
    kind === "email" ? jsx.jsxs("div", { children: [jsx.jsx("p", { children: "Hi! Can you share a concise project update?" }), jsx.jsx("textarea", { "aria-label": "Email reply", defaultValue: "Thanks, Samuel — I'll send an update today." })] }) : null,
    kind === "report" ? jsx.jsxs("div", { children: [jsx.jsx("h3", { children: "Executive summary" }), jsx.jsx("p", { children: "Focused onboarding helped participants complete a useful first task faster." }), jsx.jsx("h3", { children: "Key points" })] }) : null,
    kind === "inventory" ? jsx.jsxs("div", { children: [jsx.jsx("p", { children: `Products: ${inventoryItems}` }), jsx.jsx("button", { type: "button", onClick: () => { setInventoryItems((count) => count + 1); setSaved(false); }, children: "Add product" }), inventoryItems > 3 ? jsx.jsx("button", { type: "button", onClick: () => { setInventoryItems(3); setSaved(false); }, children: "Undo" }) : null, saved ? jsx.jsx("p", { role: "status", children: "Saved" }) : null] }) : null,
    kind === "inventory" ? jsx.jsx("button", { type: "button", onClick: () => setSaved(true), children: "Done" }) : null,
    jsx.jsx("button", { type: "button", onClick: onClose, children: kind === "inventory" ? "Close" : "Done" }),
  ] });
}

function ExtensionOnboarding(): unknown {
  const scope = useAnalyticsScope?.(applicationScope) ?? {};
  const extensionState = useSignalValue?.<ExtensionState>(extensionStateSignal) ?? defaultExtensionState;
  const browser = browserName(getUserAgent?.() ?? (typeof navigator === "undefined" ? "" : navigator.userAgent));
  const usesMenuPinning = browser !== "Chrome";
  const derivedStep = automaticStep(extensionState, usesMenuPinning);
  const [selection, setSelection] = React.useState<SelectedStep | null>(null);
  const [sampleCompleted, setSampleCompleted] = React.useState(false);
  const [activeSample, setActiveSample] = React.useState<SampleKind | null>(null);
  const [noticeCount, setNoticeCount] = React.useState(0);
  const lastViewed = React.useRef<AnalyticsStep | null>(null);
  const selectedStep = selection?.automaticStep === derivedStep ? selection.selectedStep : derivedStep;
  const galleryReady = extensionState.isSidePanelOpen && extensionState.isExtensionPinned && selectedStep === "try";
  const viewedStep = activeSample == null ? checklistAnalyticsStep[selectedStep] : sampleAnalyticsStep[activeSample];
  React.useEffect?.(() => {
    if (lastViewed.current == null) record(scope, "step_viewed", "page");
    if (lastViewed.current !== viewedStep) { record(scope, "step_viewed", viewedStep); lastViewed.current = viewedStep; }
  }, [scope, viewedStep]);

  const sidebarCompleted = extensionState.isSidePanelOpen && (!usesMenuPinning || extensionState.isExtensionPinned);
  const items: ChecklistItem[] = [
    { completed: sidebarCompleted, enabled: true, label: usesMenuPinning ? "Open and pin the extension" : "Open the extension in the sidebar", step: "sidebar" },
    ...(usesMenuPinning ? [] : [{ completed: extensionState.isExtensionPinned, enabled: extensionState.isSidePanelOpen, label: "Pin the extension", step: "pin" } satisfies ChecklistItem]),
    { completed: sampleCompleted, enabled: extensionState.isSidePanelOpen && extensionState.isExtensionPinned, label: "Try ChatGPT on sample work", step: "try" },
  ];
  const completedCount = items.filter((item) => item.completed).length;
  const selectStep = (item: ChecklistItem): void => {
    if (!item.enabled) return;
    record(scope, "checklist_step_selected", checklistAnalyticsStep[item.step]);
    setSelection({ automaticStep: derivedStep, selectedStep: item.step });
  };
  const trySample = (kind: SampleKind): void => {
    record(scope, "sample_selected", sampleAnalyticsStep[kind]);
    setSampleCompleted(true);
    setActiveSample(kind);
    setNoticeCount((count) => count + 1);
  };
  const pageTitle = `ChatGPT for ${browser}`;
  return jsx.jsxs("main", { children: [
    DocumentTitle == null ? null : jsx.jsx(DocumentTitle, { title: pageTitle }),
    jsx.jsx("h1", { children: `Welcome to ChatGPT for ${browser}` }),
    galleryReady ? jsx.jsx("span", { className: "sr-only", "aria-live": "polite", children: "Try ChatGPT on sample work" }) : null,
    jsx.jsxs("div", { children: [
      jsx.jsxs("aside", { "aria-label": `Set up your ChatGPT ${browser} Extension`, children: [
        jsx.jsx("h2", { children: `Set up your ChatGPT ${browser} Extension` }),
        jsx.jsx("div", { role: "progressbar", "aria-label": "Setup progress", "aria-valuemin": 0, "aria-valuemax": items.length, "aria-valuenow": completedCount }),
        jsx.jsx("ol", { children: items.map((item) => jsx.jsx("li", { children: button(item.label, { ariaCurrent: selectedStep === item.step ? "step" : undefined, checked: item.completed, disabled: !item.enabled, onClick: () => selectStep(item) }) }, item.step)) }),
      ] }),
      galleryReady ? jsx.jsx(SampleGallery, { onTry: trySample }) : jsx.jsx(InstructionPanel, { browser, isPinStep: selectedStep === "pin" || usesMenuPinning, onOpenSidebar: () => record(scope, "sidebar_clicked", "open_sidebar"), usesMenuPinning }),
    ] }),
    activeSample == null ? null : jsx.jsx(SampleModal, { kind: activeSample, onClose: () => setActiveSample(null) }),
    noticeCount === 0 ? null : jsx.jsx("div", { role: "status", children: "Prompt added to side chat" }),
  ] });
}

export { ExtensionOnboarding };
