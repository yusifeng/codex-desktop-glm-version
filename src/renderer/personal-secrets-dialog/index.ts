import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { n as preflightPersonalSecrets, type PersonalSecretsIssue, type PersonalSecretsPreflight, type PersonalSecretsSelection } from "@rchunk/personal-secrets-service";

export interface PersonalSecretsDialogProps { selection: PersonalSecretsSelection; initialPreflight: PersonalSecretsPreflight | null; isCurrent(): boolean; onClose(): void; requestPersonalSecrets?(input: { namespace: "sensitive" | "not_sensitive"; secrets: { env_var: string; name: string; value: string }[] }): Promise<boolean> }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

function PersonalSecretsDialog(props: PersonalSecretsDialogProps): unknown {
  const runtime = ensureJsx();
  const [preflight, setPreflight] = ReactRuntime.useState(props.initialPreflight);
  const [values, setValues] = ReactRuntime.useState<Record<string, string>>({});
  const [saving, setSaving] = ReactRuntime.useState(false);
  const [refreshing, setRefreshing] = ReactRuntime.useState(false);
  const [saveError, setSaveError] = ReactRuntime.useState(false);
  const missing = preflight?.issues.filter(issue => issue.code === "missing") ?? [];
  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try { setPreflight(await preflightPersonalSecrets(props.selection)); setSaveError(false); }
    catch { setSaveError(true); }
    finally { setRefreshing(false); }
  };
  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (saving || !props.isCurrent()) return;
    setSaving(true);
    setSaveError(false);
    try {
      const entries = missing.filter(issue => (values[`${issue.namespace}:${issue.env_var}`] ?? "").trim()).map(issue => ({ issue, value: values[`${issue.namespace}:${issue.env_var}`].trim() }));
      const results = await Promise.all((["sensitive", "not_sensitive"] as const).map(async namespace => {
        const secrets = entries.filter(entry => entry.issue.namespace === namespace).map(entry => ({ env_var: entry.issue.env_var, name: entry.issue.env_var, value: entry.value }));
        return secrets.length === 0 || (await props.requestPersonalSecrets?.({ namespace, secrets })) === true;
      }));
      if (!props.isCurrent()) return;
      if (results.every(Boolean)) { props.onClose(); return; }
      setPreflight(await preflightPersonalSecrets(props.selection));
      setSaveError(true);
    } catch { if (props.isCurrent()) setSaveError(true); }
    finally { setSaving(false); }
  };
  return runtime.jsx("dialog", { open: true, className: "personal-secrets-dialog", "aria-busy": saving || refreshing, children: runtime.jsxs("form", { onSubmit: submit, children: [runtime.jsx("h1", { children: "Add personal secrets" }), runtime.jsx("p", { children: `${props.selection.config.name ?? "This environment"} uses these personal secrets. All values are optional.` }), saveError ? runtime.jsx("p", { role: "alert", children: "Some values could not be confirmed as saved. Retry the check or continue without adding more values." }) : null, runtime.jsx("div", { children: missing.map((issue: PersonalSecretsIssue) => { const key = `${issue.namespace}:${issue.env_var}`; return runtime.jsxs("label", { children: [`${issue.env_var} (optional)`, runtime.jsx("input", { type: "password", name: key, disabled: saving || refreshing, value: values[key] ?? "", onChange: (event: { currentTarget: { value: string } }) => setValues(current => ({ ...current, [key]: event.currentTarget.value })) })] }, key); }) }), runtime.jsxs("footer", { children: [runtime.jsx("button", { type: "button", disabled: saving || refreshing, onClick: props.onClose, children: "Continue without" }), saveError ? runtime.jsx("button", { type: "button", disabled: saving || refreshing, onClick: () => void refresh(), children: refreshing ? "Checking…" : "Retry check" }) : null, runtime.jsx("button", { type: "submit", disabled: saving || refreshing || !props.isCurrent(), children: saving ? "Saving…" : "Save and start" })] })] }) });
}

export { PersonalSecretsDialog };
