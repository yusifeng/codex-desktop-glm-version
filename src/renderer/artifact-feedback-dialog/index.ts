import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/feedback-legal-notice";
import "@rchunk/google-drive-resource-icon";
import "@rchunk/artifact-file-preview-icon";

export type ArtifactFeedbackRating = "better" | "same" | "worse";
export type ArtifactFeedbackInfluence = "content" | "visual_quality" | "time_saved" | "other";
export type ArtifactFeedbackTimeSaved = "under_15_minutes" | "15_to_under_60_minutes" | "1_to_under_4_hours" | "4_to_under_8_hours" | "8_hours_or_more";
export interface FeedbackArtifact { artifactType: string; fileFormat: string; label: string; path?: string | null; allowArtifactAttachment?: boolean }
export interface ArtifactFeedbackValue { attachArtifact: boolean; details: string; includeLogs: boolean; influences: ArtifactFeedbackInfluence[]; rating: ArtifactFeedbackRating; timeSaved: ArtifactFeedbackTimeSaved | null }
export interface ArtifactFeedbackDialogProps { artifacts: readonly FeedbackArtifact[]; onClose(): void; onSubmit(value: ArtifactFeedbackValue, artifact?: FeedbackArtifact): boolean | Promise<boolean>; showArtifactSelector?: boolean }

let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
const ratings: [ArtifactFeedbackRating, string][] = [["better", "Better than what I would’ve made"], ["same", "About the same"], ["worse", "Worse than what I would’ve made"]];
const influenceOptions: [ArtifactFeedbackInfluence, string][] = [["content", "Content"], ["visual_quality", "Visual quality"], ["time_saved", "Time saved"], ["other", "Other"]];
const timeOptions: [ArtifactFeedbackTimeSaved, string][] = [["under_15_minutes", "Less than 15 minutes"], ["15_to_under_60_minutes", "15 minutes to under 1 hour"], ["1_to_under_4_hours", "1 to under 4 hours"], ["4_to_under_8_hours", "4 to under 8 hours"], ["8_hours_or_more", "8 hours or more"]];

function ArtifactFeedbackDialog(props: ArtifactFeedbackDialogProps): unknown {
  const runtime = ensureJsx();
  const [artifactKey, setArtifactKey] = ReactRuntime.useState(props.artifacts[0]?.path ?? props.artifacts[0]?.label ?? "");
  const [rating, setRating] = ReactRuntime.useState<ArtifactFeedbackRating | null>(null);
  const [influences, setInfluences] = ReactRuntime.useState<ArtifactFeedbackInfluence[]>([]);
  const [timeSaved, setTimeSaved] = ReactRuntime.useState<ArtifactFeedbackTimeSaved | null>(null);
  const [details, setDetails] = ReactRuntime.useState("");
  const [attachArtifact, setAttachArtifact] = ReactRuntime.useState(true);
  const [includeLogs, setIncludeLogs] = ReactRuntime.useState(true);
  const [submitting, setSubmitting] = ReactRuntime.useState(false);
  const [submitError, setSubmitError] = ReactRuntime.useState(false);
  const artifact = props.artifacts.find(item => (item.path ?? item.label) === artifactKey) ?? props.artifacts[0];
  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (rating == null || submitting) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const accepted = await props.onSubmit({ attachArtifact: (artifact?.allowArtifactAttachment ?? true) && attachArtifact, details: details.trim(), includeLogs, influences, rating, timeSaved }, artifact);
      if (accepted) props.onClose();
    } catch { setSubmitError(true); }
    finally { setSubmitting(false); }
  };
  const toggleInfluence = (value: ArtifactFeedbackInfluence) => setInfluences(current => {
    const selected = current.includes(value);
    if (value === "time_saved" && selected) setTimeSaved(null);
    return selected ? current.filter(item => item !== value) : [...current, value];
  });
  return runtime.jsx("dialog", { open: true, className: "artifact-feedback-dialog", "aria-busy": submitting, children: runtime.jsxs("form", { onSubmit: submit, children: [runtime.jsx("h1", { children: "Help our team improve ChatGPT" }), props.showArtifactSelector ? runtime.jsx("select", { "aria-label": "Artifact", disabled: submitting, value: artifactKey, onChange: (event: { currentTarget: { value: string } }) => setArtifactKey(event.currentTarget.value), children: props.artifacts.map(item => runtime.jsx("option", { value: item.path ?? item.label, children: item.label }, item.path ?? item.label)) }) : null, runtime.jsxs("fieldset", { disabled: submitting, children: [runtime.jsx("legend", { children: "How does the experience of making this file compare to what you would’ve made yourself?" }), ...ratings.map(([value, label]) => runtime.jsxs("label", { children: [runtime.jsx("input", { checked: rating === value, type: "radio", name: "rating", value, onChange: () => setRating(value) }), label] }, value))] }), runtime.jsxs("fieldset", { disabled: submitting, children: [runtime.jsx("legend", { children: "What influenced your rating? (optional)" }), ...influenceOptions.map(([value, label]) => runtime.jsx("button", { type: "button", role: "checkbox", "aria-checked": influences.includes(value), onClick: () => toggleInfluence(value), children: label }, value))] }), runtime.jsx("select", { "aria-label": "How much time did ChatGPT save you on this file? (optional)", disabled: submitting || !influences.includes("time_saved"), value: timeSaved ?? "", onChange: (event: { currentTarget: { value: string } }) => setTimeSaved((event.currentTarget.value || null) as ArtifactFeedbackTimeSaved | null), children: [runtime.jsx("option", { value: "", children: "Select an estimate" }), ...timeOptions.map(([value, label]) => runtime.jsx("option", { value, children: label }, value))] }), runtime.jsx("textarea", { "aria-label": "How else could we improve? (optional)", disabled: submitting, placeholder: "Share details", value: details, onChange: (event: { currentTarget: { value: string } }) => setDetails(event.currentTarget.value) }), runtime.jsxs("label", { children: [runtime.jsx("input", { type: "checkbox", checked: attachArtifact, disabled: submitting || artifact?.allowArtifactAttachment === false, onChange: (event: { currentTarget: { checked: boolean } }) => setAttachArtifact(event.currentTarget.checked) }), "Attach created file to feedback"] }), runtime.jsxs("label", { children: [runtime.jsx("input", { type: "checkbox", checked: includeLogs, disabled: submitting, onChange: (event: { currentTarget: { checked: boolean } }) => setIncludeLogs(event.currentTarget.checked) }), "Include current ChatGPT session logs"] }), submitError ? runtime.jsx("p", { role: "alert", children: "We couldn’t submit your feedback. Try again." }) : null, runtime.jsx("p", { className: "feedback-legal-notice", children: "Your feedback can be used to improve ChatGPT." }), runtime.jsx("button", { type: "submit", disabled: rating == null || submitting, children: submitting ? "Submitting…" : "Submit" })] }) });
}

export { ArtifactFeedbackDialog };
