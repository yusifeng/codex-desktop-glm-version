import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__toolFlowTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "tool-flow-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\/mcp-tool-activity-label$/ }, () => ({ path: path.join(ROOT, "src/renderer/mcp-tool-activity-label/index.ts") })); build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__toolFlowTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const values = []; const collect = value => { if (typeof value === "string") values.push(value); else if (value != null && typeof value === "object") { const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); } }; collect(node); return values.join(" "); }
const intl = { formatMessage(descriptor) { return descriptor.defaultMessage; } };

// mcp-tool-activity-label: 14
const labels = await bundle("mcp-tool-activity-label");
assert.deepEqual(Object.keys(labels), ["i", "n", "r", "t"]);
assert.equal(labels.r({ toolName: "github_create_issue", matchingApp: { id: "github", name: "GitHub" } }), "Create issue");
assert.equal(labels.r({ toolName: "connector-google-drive-search_files", matchingApp: { id: "connector-google-drive", name: "Google Drive" } }), "Search files");
assert.equal(labels.t({ toolName: "browser_open", source: { kind: "browserUse", backend: "chrome" }, intl }), "Used Chrome");
assert.equal(labels.t({ toolName: "browser_open", source: { kind: "browserUse", backend: "iab" }, intl }), "Used the browser");
assert.equal(labels.t({ toolName: "js", toolArguments: { title: "  Inspect   page " }, intl }), "Inspect page");
assert.equal(labels.t({ toolName: "js", toolArguments: { title: "x".repeat(90) }, intl }).length, 80);
assert.equal(labels.t({ toolName: "github_create_issue", matchingApp: { id: "github", name: "GitHub" }, intl }), "Create issue");
assert.equal(labels.t({ toolName: "github_create_issue", matchingApp: { id: "github", name: "GitHub" }, completed: true, intl }), "Created issue");
assert.equal(labels.n({ approval: { connector_id: "github", tool_name: "github.create_issue", tool_params: { title: "Bug" } } }), "Create issue: Bug");
assert.equal(labels.n({ approval: { connector_id: "gmail", connector_name: "Gmail", tool_title: "gmail.send_email" } }), "Send email");
assert.equal(labels.n({ approval: { connector_id: "x" } }), null);
assert.equal(labels.i(), undefined);
assert.equal(labels.r({ appContext: { actionName: "read_document", connectorId: "notion", appName: "Notion" }, toolName: "ignored" }), "Read document");

// mcp-tool-approval-message: 13
const approval = await bundle("mcp-tool-approval-message");
assert.deepEqual(Object.keys(approval), ["a", "c", "d", "f", "i", "l", "n", "o", "r", "s", "t", "u"]);
const replies = [];
const urlUi = approval.r({ conversationId: "c", hostId: "h", requestId: "r", action: { message: "Sign in", url: "https://example.test" }, onReply(value) { replies.push(value); } });
assert.match(text(urlUi), /Action required/);
assert.match(text(urlUi), /https:\/\/example.test/);
find(urlUi, node => node.type === "button" && text(node).includes("Decline")).props.onClick();
assert.equal(replies[0], "decline");
find(urlUi, node => node.type === "button" && text(node).includes("Open link")).props.onClick();
assert.equal(replies[1], "accept");
assert.match(text(approval.s({ conversationId: "c", hostId: "h", requestId: "r", auth: { connector: { connector_name: "Slack" } } })), /Connect Slack/);
assert.match(text(approval.a({ conversationId: "c", hostId: "h", requestId: "r", suggestion: { tool_title: "Calendar" } })), /Enable this tool/);
const scopes = approval.d({ authorization: { origin: "example.test", scopes: [{ scope: "read", label: "Read files" }, { scope: "write", label: "Write files" }] } });
assert.match(text(scopes), /Allow example.test to:/);
assert.equal(all(scopes, node => node.type === "li").length, 2);
assert.equal(text(approval.t({ message: { descriptor: { defaultMessage: "Continue here" } } })), "Continue here");
assert.equal(approval.o(), undefined);
assert.equal(approval.c(), undefined);
assert.equal(approval.n(), undefined);

// mcp-tool-item-content: 15
const items = await bundle("mcp-tool-item-content");
assert.deepEqual(Object.keys(items), ["a", "c", "d", "f", "i", "l", "n", "o", "r", "s", "t", "u"]);
assert.deepEqual(items.d({ pluginId: "p", plugins: [{ plugin: { id: "p", name: "Plugin" }, logoPath: "logo.png" }] }), { alt: "Plugin", logoUrl: "logo.png" });
assert.equal(items.d({ pluginId: "missing", plugins: [] }), null);
assert.equal(items.d({ pluginId: "p", serverName: "codex_apps", plugins: [{ plugin: { id: "p" } }] }), null);
const activeItem = { callId: "call", invocation: { server: "github", tool: "github_read_issue", arguments: {} } };
assert.equal(items.l({ item: activeItem, fallback: "G" }).props["aria-label"], "github");
const activeUi = items.t({ item: activeItem, matchingApp: { id: "github", name: "GitHub" } });
assert.equal(activeUi.props["data-tool-status"], "active");
assert.equal(activeUi.props["aria-label"], "Read issue");
assert.equal(find(activeUi, node => node.props?.children === "Details").type, "button");
const completeUi = items.t({ item: { ...activeItem, result: { type: "success", raw: { id: 42 } } } });
assert.equal(completeUi.props["data-tool-status"], "success");
assert.match(find(completeUi, node => node.type === "pre").props.children, /"id": 42/);
const failedUi = items.t({ item: { ...activeItem, result: { type: "error", error: "Denied" } } });
assert.equal(find(failedUi, node => node.type === "pre").props.children, "Denied");
let opened;
const automations = items.r({ automations: [{ id: "one", title: "Daily", scheduleLabel: "9 AM" }, { id: "two", title: "Weekly", isEnabled: false }], onOpen(id) { opened = id; } });
assert.equal(all(automations, node => node.type === "button").length, 2);
find(automations, node => node.type === "button").props.onClick();
assert.equal(opened, "one");
assert.match(text(automations), /Daily\s+· 9 AM/);
assert.equal(items.a(), null);

// plan-summary-item-content: 8
const plan = await bundle("plan-summary-item-content");
assert.deepEqual(Object.keys(plan), ["a", "i", "n", "o", "r", "t"]);
const ratings = [];
const ratingUi = plan.a({ rating: "up", onRate(value) { ratings.push(value); } });
find(ratingUi, node => node.props?.children === "Good response").props.onClick();
assert.equal(ratings[0], null);
find(ratingUi, node => node.props?.children === "Bad response").props.onClick();
assert.equal(ratings[1], "down");
let openedPlan;
const planUi = plan.t({ conversationId: "c", item: { content: "1. Inspect\n2. Fix" }, title: "Implementation plan", onOpen(content) { openedPlan = content; } });
assert.equal(planUi.props["aria-label"], "Implementation plan");
assert.match(text(planUi), /1. Inspect/);
find(planUi, node => node.props?.children === "Open plan").props.onClick();
assert.match(openedPlan, /2. Fix/);
assert.equal(find(plan.t({ conversationId: "c", item: { content: "Only" }, showOpenButton: false }), node => node.type === "button"), undefined);
let feedback;
plan.r((details, rating) => { feedback = { details, rating }; })("down", "Wrong");
assert.deepEqual(feedback, { details: "Wrong", rating: "down" });

console.log("50 tool activity and approval flow cluster assertions passed");
