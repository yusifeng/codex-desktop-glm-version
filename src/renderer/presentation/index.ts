import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
type ToolState = "active" | "completed" | "failed" | "failedFollowing" | "following" | string;
const labels: Record<string, [string, string, string]> = { create_chat: ["Creating chat", "Created chat", "Couldn’t create chat"], create_worktree: ["Creating worktree", "Created worktree", "Couldn’t complete worktree setup"], fork_chat: ["Forking chat", "Forked chat", "Couldn’t fork chat"], list_chats: ["Listing chats", "Listed chats", "Couldn’t list chats"], read_chat: ["Reading chat", "Read chat", "Couldn’t read chat"], send_message: ["Sending message to chat", "Sent message to chat", "Couldn’t send message to chat"], wait_chats: ["Waiting for chats", "Waited for chats", "Couldn’t wait for chats"] };
function a(tool: string, state: ToolState): string { const set = labels[tool] ?? ["Working", "Completed", "Couldn’t complete action"]; if (state === "active") return set[0]; if (state === "failed" || state === "failedFollowing") return set[2]; return set[1]; }
function i(input: { started?: number; total?: number }): string { return `${input.started ?? 0} of ${input.total ?? 0}`; }
function o(state: ToolState): "danger" | "neutral" | "success" { return state.startsWith("failed") ? "danger" : state === "completed" || state === "following" ? "success" : "neutral"; }
function r(value: string): string { return value.replaceAll("_", " ").replace(/^./, character => character.toUpperCase()); }
function s(input: { state: ToolState; tool: string }): { label: string; tone: "danger" | "neutral" | "success" } { return { label: a(input.tool, input.state), tone: o(input.state) }; }
function t({ state = "active", tool = "unknown", progress }: { state?: ToolState; tool?: string; progress?: { started?: number; total?: number } }): unknown { const status = s({ state, tool }); return jsx().jsxs("div", { role: "status", "data-tone": status.tone, children: [status.label, progress == null ? null : ` · ${i(progress)}`] }); }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function n(): void {}
export { a, i, n, o, r, s, t };
