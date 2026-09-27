import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/avatar-mascot-button";
import "@rchunk/pet-install-state";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface Session { description?: string | null; error?: string | null; name: string; preview?: unknown; status: "installError" | "installed" | "installing" | "loading" | "previewError" | "ready" }
interface Props { onClose(): void; onInstall?(): Promise<void> | void; session?: Session | null }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function PetInstallModalHost({ onClose, onInstall, session }: Props): unknown { if (session == null) return null; const ready = session.status === "ready" || session.status === "installError", busy = session.status === "installing"; const body = session.status === "loading" ? `Loading ${session.name}` : session.status === "previewError" ? `Unable to load ${session.name}` : session.status === "installed" ? `Installed ${session.name}` : session.preview ?? `${session.name} preview`; return jsx().jsxs("dialog", { open: true, "aria-busy": busy || undefined, children: [jsx().jsx("h2", { children: session.status === "installed" ? `Installed ${session.name}` : `Install ${session.name}?` }), session.description == null ? null : jsx().jsx("p", { children: session.description }), jsx().jsx("div", { children: body }), session.error == null ? null : jsx().jsx("p", { role: "alert", children: session.error }), jsx().jsxs("footer", { children: [jsx().jsx("button", { type: "button", disabled: busy, onClick: onClose, children: session.status === "installed" ? "Done" : "Cancel" }), session.status === "installed" ? null : jsx().jsx("button", { type: "button", disabled: !ready || busy, onClick: () => void onInstall?.(), children: busy ? "Installing…" : session.status === "installError" ? "Try again" : "Install" })] })] }); }
export { PetInstallModalHost };
