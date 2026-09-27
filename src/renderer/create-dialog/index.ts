import "@rchunk/rolldown-runtime";
import "@rchunk/app-primary";
import "@rchunk/setup-artwork";
import "@rchunk/pending-onboarding";
import "@rchunk/plugin-settings-url";
import "@rchunk/cloud-environment-queries";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";

interface CreateDialogProps { initialMode?: "local" | "cloud"; initialName?: string; initialRepository?: string; onClose(): void; onCreate(input: { mode: "local" | "cloud"; name: string; repository?: string }): Promise<unknown>; open?: boolean }
const jsx = getJsxRuntime();
const React = getReactRuntime();
function CreateDialog({ initialMode = "local", initialName = "", initialRepository = "", onClose, onCreate, open = true }: CreateDialogProps): unknown {
  const [mode, setMode] = React.useState<"local" | "cloud">(initialMode);
  const [name, setName] = React.useState(initialName);
  const [repository, setRepository] = React.useState(initialRepository);
  const [saving, setSaving] = React.useState(false);
  if (!open) return null;
  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (saving || name.trim() === "") return;
    setSaving(true);
    try { await onCreate({ mode, name: name.trim(), repository: repository.trim() || undefined }); onClose(); } finally { setSaving(false); }
  };
  return jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: "Create" }), jsx.jsxs("form", { onSubmit: submit, children: [jsx.jsxs("fieldset", { children: [jsx.jsxs("label", { children: [jsx.jsx("input", { type: "radio", name: "create-mode", value: "local", checked: mode === "local", onChange: () => setMode("local") }), "Local workspace"] }), jsx.jsxs("label", { children: [jsx.jsx("input", { type: "radio", name: "create-mode", value: "cloud", checked: mode === "cloud", onChange: () => setMode("cloud") }), "Cloud environment"] })] }), jsx.jsxs("label", { children: ["Name", jsx.jsx("input", { value: name, onChange: (event: { currentTarget: { value: string } }) => setName(event.currentTarget.value) })] }), mode === "cloud" ? jsx.jsxs("label", { children: ["Repository", jsx.jsx("input", { value: repository, onChange: (event: { currentTarget: { value: string } }) => setRepository(event.currentTarget.value) })] }) : null, jsx.jsxs("footer", { children: [jsx.jsx("button", { type: "button", disabled: saving, onClick: onClose, children: "Cancel" }), jsx.jsx("button", { type: "submit", disabled: saving || name.trim() === "", children: "Create" })] })] })] });
}
function initializeCreateDialog(): void { initializeApiClient(); }
export { initializeCreateDialog as n, CreateDialog as t };
