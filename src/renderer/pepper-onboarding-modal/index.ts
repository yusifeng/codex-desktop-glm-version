import "@rchunk/rolldown-runtime";
import "@rchunk/pepper-persona";
import "@rchunk/chatgpt-accent-messages";
import "@rchunk/voice-personalization-dialog-entry";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient, rJt as apiClient } from "@rchunk/app-initial";

interface PepperOnboardingModalProps { accountId: string; initialAccent?: string; initialStep?: number; onClose(): void; onComplete?(): void; open?: boolean }
interface PepperApi { safePatch(path: string, options: Record<string, unknown>): Promise<unknown> }
const jsx = getJsxRuntime();
const React = getReactRuntime();
const client = apiClient as unknown as PepperApi;
const STEPS = ["Welcome", "Choose your style", "Create", "Personalize", "Wellbeing"];
function PepperOnboardingModal({ accountId, initialAccent = "blue", initialStep = 0, onClose, onComplete, open = true }: PepperOnboardingModalProps): unknown {
  const [step, setStep] = React.useState(Math.max(0, Math.min(STEPS.length - 1, initialStep)));
  const [accent, setAccent] = React.useState(initialAccent);
  const [saving, setSaving] = React.useState(false);
  if (!open) return null;
  const continueFlow = async () => {
    if (saving) return;
    if (step < STEPS.length - 1) { setStep(current => current + 1); return; }
    setSaving(true);
    try { await client.safePatch("/accounts/{account_id}/settings", { parameters: { path: { account_id: accountId } }, requestBody: { accent_color: accent } }); onComplete?.(); onClose(); } finally { setSaving(false); }
  };
  return jsx.jsxs("dialog", { open: true, children: [jsx.jsx("p", { children: `${step + 1} of ${STEPS.length}` }), jsx.jsx("h2", { children: STEPS[step] }), step === 1 ? jsx.jsxs("label", { children: ["Theme color", jsx.jsx("select", { value: accent, onChange: (event: { currentTarget: { value: string } }) => setAccent(event.currentTarget.value), children: ["blue", "green", "purple", "orange", "black"].map(color => jsx.jsx("option", { value: color, children: color }, color)) })] }) : jsx.jsx("p", { children: "Make ChatGPT feel more like yours." }), jsx.jsxs("footer", { children: [jsx.jsx("button", { type: "button", onClick: onClose, children: "Close" }), jsx.jsx("button", { type: "button", disabled: saving, onClick: continueFlow, children: step === STEPS.length - 1 ? "Finish" : "Continue" })] })] });
}
function initializePepperOnboarding(): void { initializeApiClient(); }
initializePepperOnboarding();
export { PepperOnboardingModal };
