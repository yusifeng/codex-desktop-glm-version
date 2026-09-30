import * as RuntimeChunk from "@rchunk/rolldown-runtime";
import * as SharedChunk from "@rchunk/app-shared";
import * as InitialChunk from "@rchunk/app-initial";

interface ImportItem { cwd?: string | null; description?: string; itemType: string; name?: string }
interface Runtime { detect(): Promise<ImportItem[]>; importItems(items: ImportItem[]): Promise<void>; onError?(error: unknown): void; onSuccess?(items: ImportItem[]): void; workspaceRoot?: string | null }
interface Props { runtime?: Runtime }
interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface ReactRuntime { useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void; useState<Value>(initial: Value): [Value, (next: Value | ((previous: Value) => Value)) => void] }
interface SharedApi { I3(): JsxRuntime; Y2: unknown; Yh: unknown; e6(): ReactRuntime }
interface InitialApi { detectExternalAgentConfig?(): Promise<ImportItem[]>; importExternalAgentConfig?(items: ImportItem[]): Promise<void>; projectImportWorkspaceRoot?: string | null }

const shared = SharedChunk as unknown as SharedApi;
const initial = InitialChunk as unknown as InitialApi;
const jsx = shared.I3();
const React = shared.e6();
void RuntimeChunk;

function itemKey(item: ImportItem): string { return `${item.itemType}:${item.cwd ?? "home"}:${item.name ?? item.description ?? ""}`; }
function defaultRuntime(): Runtime { return { workspaceRoot: initial.projectImportWorkspaceRoot, detect: () => initial.detectExternalAgentConfig?.() ?? Promise.resolve([]), importItems: (items) => initial.importExternalAgentConfig?.(items) ?? Promise.resolve() }; }
function message(id: string, defaultMessage: string): unknown { return jsx.jsx(shared.Y2, { id, defaultMessage }); }

function ProjectImportPromptHost({ runtime = defaultRuntime() }: Props = {}): unknown {
  const [items, setItems] = React.useState<ImportItem[] | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [status, setStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  React.useEffect(() => {
    let active = true;
    if (runtime.workspaceRoot == null) { setItems([]); return () => { active = false; }; }
    runtime.detect().then((detected) => { if (!active) return; const unique = [...new Map(detected.filter(item => item.cwd != null).map(item => [itemKey(item), item])).values()]; setItems(unique); setSelected(new Set(unique.map(itemKey))); }).catch((error) => { if (active) { setItems([]); setStatus("error"); runtime.onError?.(error); } });
    return () => { active = false; };
  }, [runtime]);
  if (runtime.workspaceRoot == null || items == null || items.length === 0) return null;
  const chosen = items.filter(item => selected.has(itemKey(item)));
  const submit = async (): Promise<void> => { if (chosen.length === 0 || status === "running") return; setStatus("running"); try { await runtime.importItems(chosen); setStatus("success"); runtime.onSuccess?.(chosen); } catch (error) { setStatus("error"); runtime.onError?.(error); } };
  return jsx.jsxs("section", { role: "dialog", "aria-modal": true, "data-project-import-status": status, children: [
    jsx.jsx("h2", { children: message("externalAgentConfig.projectImport.title", "Select settings to import") }),
    jsx.jsx("p", { children: message("externalAgentConfig.projectImport.subtitle.appName", "Found useful settings from another agent app") }),
    jsx.jsx("div", { children: items.map(item => { const key = itemKey(item); return jsx.jsxs("label", { children: [jsx.jsx("input", { type: "checkbox", checked: selected.has(key), disabled: status === "running", onChange: (event: { currentTarget: { checked: boolean } }) => setSelected(previous => { const next = new Set(previous); event.currentTarget.checked ? next.add(key) : next.delete(key); return next; }) }), item.name ?? item.description ?? item.itemType] }, key); }) }),
    jsx.jsx(shared.Yh, { color: "primary", disabled: chosen.length === 0, loading: status === "running", onClick: submit, children: message("externalAgentConfig.projectImport.confirm", "Continue") }),
  ] });
}

export { ProjectImportPromptHost };
