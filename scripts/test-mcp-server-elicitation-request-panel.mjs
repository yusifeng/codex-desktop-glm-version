import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/mcp-server-elicitation-request-panel/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
let sourceAssertions = 0;
const sourceCheck = (value, message) => { assert.ok(value, message); sourceAssertions += 1; };
const dependencies = [...new Set([...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map((match) => match[1]))].sort();
sourceCheck(JSON.stringify(dependencies) === JSON.stringify(["app-initial","app-primary","app-shared","computer-use-app-approval-request-card","mcp-tool-activity-label","mcp-tool-approval-message","request-panel","rolldown-runtime"]), "preserves all eight static dependencies");
sourceCheck(!/import\s*\(/.test(source), "has no dynamic dependency");
sourceCheck(!/\bany\b/.test(source), "does not introduce an explicit unsafe type");
sourceCheck(!/\b[A-Za-z]+Chunk\s*\./.test(source), "does not consume namespace members");
sourceCheck(source.includes("useCallback") && source.match(/react\.useEffect\(/g)?.length === 1, "uses stable callbacks and only the verification cleanup effect");

const state = (globalThis.__mcpElicitationPanelTest = {
  autoResolution: null, bridge: { requestUserInputAutoResolution: { snooze: (request) => state.snoozes.push(request) } },
  cleanup: null, computerRequest: null, initializers: [], manager: null, replies: [], setState: [], snoozes: [],
});
const render = (type, props, key) => typeof type === "function" ? type(props) : ({ type, props, key });
const jsx = { Fragment: "Fragment", jsx: render, jsxs: render };
const react = {
  useCallback: (callback) => callback,
  useEffect: (effect) => { state.cleanup = effect(); },
  useRef: (value) => ({ current: value }),
  useState: (value) => [value, (next) => state.setState.push(typeof next === "function" ? next(value) : next)],
};
state.manager = {
  replyWithMcpServerElicitationResponse: async (conversationId, requestId, response) => { state.replies.push({ conversationId, requestId, response }); },
};
state.jsx = jsx; state.react = react;
const marker = (name) => `export const ${name}=()=>globalThis.__mcpElicitationPanelTest.initializers.push('${name}');`;
const mocks = new Proxy({
  "app-shared": `
    const s=globalThis.__mcpElicitationPanelTest;
    export const $3=()=>s.initializers.push('$3'); export const K2=()=>s.initializers.push('K2');
    export const BX=()=>s.autoResolution; export const I3=()=>s.jsx; export const e6=()=>s.react; export const LX=()=>({id:'scope'}); export const ZI={id:'app-scope'};
    export const Y2='FormattedMessage'; export const Yh='Button';
  `,
  "app-initial": `
    const s=globalThis.__mcpElicitationPanelTest; export const Th={id:'auto-resolution'}; export const Ugn=()=>s.manager;
    export const Wgn=(decision,payload)=>({decision,payload}); export const pnt=s.bridge; export const uen=()=>s.computerRequest;
  `,
  "mcp-tool-activity-label": marker("i"),
  "mcp-tool-approval-message": `export const a='ToolSuggestion';export const r='UrlAction';export const s='ConnectorAuth';${marker("c")}${marker("i")}${marker("o")}`,
  "request-panel": `export const r='UnsupportedForm';export const t='FormRequest';${marker("n")}`,
  "computer-use-app-approval-request-card": `export const t='ComputerUseRequest';${marker("n")}`,
}, { get(target, key) { return target[key] ?? "export {};"; } });
const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "mcp-elicitation-panel-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ loader: "js", contents: mocks[importPath] }));
  } }],
});
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let runtimeAssertions = 0;
const runtimeCheck = (value, message) => { assert.ok(value, message); runtimeAssertions += 1; };
const props = (elicitation, requestId = "request-1") => ({ conversationId: "conversation-1", hostId: "host-1", pendingRequest: { elicitation, request: { params: { turnId: "turn-1" } }, requestId } });
runtimeCheck(Object.keys(module).sort().join(",") === "n,t", "preserves both exact public exports");
runtimeCheck(state.initializers.join(",") === "$3,K2,i,c,i,o,n,n", "initializes all published dependency surfaces once");
module.n(); runtimeCheck(state.initializers.length === 8, "keeps initialization idempotent");

let view = module.t(props({ kind: "generic", serverName: "connector_browser_use", message: "Approval", metadata: { origin: "https://example.com", reason: "Needed for search" }, persist: ["always"] }));
runtimeCheck(view.props["data-panel-kind"] === "browser-persistent-approval" && view.props.children[0].props.children.props.values.origin === "https://example.com", "routes persistent browser access to the dedicated approval card");
view.props.children[3].props.children[2].props.onClick(); await Promise.resolve(); runtimeCheck(state.replies.at(-1).response.decision === "accept" && state.replies.at(-1).response.payload.persist === "always", "replies with global persistent approval");

state.replies = []; view = module.t(props({ kind: "generic", serverName: "calendar_server", message: "Tool call needs your approval. Reason: Manage calendar", metadata: { reason: "Manage calendar" }, persist: ["session"], toolParams: { first_name: "Ada", count: 2, enabled: true, nested: { value: 1 }, extra: "hidden" } }));
runtimeCheck(view.props.children[0].props.children === "Tool call needs your approval." && view.props.children[1].props.children === "Manage calendar", "separates the generic approval title and reason");
runtimeCheck(view.props.children[2].props.children.length === 4 && view.props.children[3].props.children === "Show 1 more items", "limits compact parameters to four with a reveal action");
const genericActions = view.props.children[4].props.children; genericActions[2].props.onClick(); genericActions[2].props.onClick(); await Promise.resolve(); runtimeCheck(state.replies.length === 1 && state.replies[0].response.payload.persist === "session", "prevents duplicate approval replies and preserves session persistence");

state.computerRequest = { appId: "browser" }; view = module.t(props({ kind: "generic", serverName: "other", message: "Use computer" }, "computer-request")); runtimeCheck(view.type === "ComputerUseRequest" && view.props.request.appId === "browser", "delegates converted computer-use requests"); state.computerRequest = null;
state.autoResolution = { requestId: "form-request", resolutionState: { status: "scheduled", deadlineMs: 1234 } }; view = module.t(props({ kind: "openaiForm", serverName: "forms" }, "form-request"));
runtimeCheck(view.type === "FormRequest" && view.props.autoResolution.deadlineMs === 1234 && view.props.turnId === "turn-1", "forwards scheduled auto-resolution and turn context to forms"); view.props.onUserInteraction(); runtimeCheck(state.snoozes[0].requestId === "form-request", "snoozes auto-resolution after user interaction");
view = module.t(props({ kind: "formElicitation", serverName: "forms" }, "form-request")); runtimeCheck(view.props.onUserInteraction === undefined, "does not attach user-interaction snoozing to standard forms");
view = module.t(props({ kind: "unsupportedOpenAIForm", serverName: "legacy-server" })); runtimeCheck(view.type === "UnsupportedForm" && view.props.serverName === "legacy-server", "renders unsupported form requests");
view = module.t(props({ kind: "toolSuggestion", suggestion: { tool: "search" } })); runtimeCheck(view.type === "ToolSuggestion" && view.props.suggestion.tool === "search", "delegates tool suggestions");
view = module.t(props({ kind: "connectorAuth", serverName: "drive" })); runtimeCheck(view.type === "ConnectorAuth" && view.props.auth.kind === "connectorAuth", "delegates connector authentication");
view = module.t(props({ kind: "urlAction", url: "https://example.com" })); runtimeCheck(view.type === "UrlAction" && view.props.action.url === "https://example.com", "delegates URL actions");

state.replies = []; view = module.t(props({ kind: "browserAuth", browserAuth: { provider: "test" }, challengeId: "challenge-1" })); runtimeCheck(view.type === "browser-auth-request" && view.props.challengeId === "challenge-1", "renders browser-auth requests"); await view.props.onRespond({ fillStatus: "submitted" }); await view.props.onRespond({ fillStatus: "cancelled" }); runtimeCheck(state.replies.map((entry) => entry.response.decision).join(",") === "accept,decline", "maps browser-auth completion to accept or decline");

state.replies = []; view = module.t(props({ kind: "userVerification", serverName: "secure-server", title: "Verify identity", description: "Use biometrics" })); runtimeCheck(view.props["data-panel-kind"] === "userVerification" && view.props.children[0].props.children === "Verify identity", "renders identity verification requests"); view.props.children[3].props.children[1].props.onClick(); await Promise.resolve(); runtimeCheck(state.replies[0].response.decision === "cancel", "cancels safely when no verification provider is available");
let prevented = 0; let stopped = 0; view.props.onKeyDown({ key: "Escape", preventDefault: () => { prevented += 1; }, stopPropagation: () => { stopped += 1; } }); await Promise.resolve(); runtimeCheck(prevented === 1 && stopped === 1 && state.replies.at(-1).response.decision === "cancel", "handles Escape as an explicit verification cancellation");
runtimeCheck(typeof state.cleanup === "function", "registers verification cleanup without extra effects");
console.log(`${sourceAssertions} source assertions, ${runtimeAssertions} runtime assertions passed for MCP server elicitation request panel`);
