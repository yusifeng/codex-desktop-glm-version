import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__toolFlowTest = { bridges: [], openedAutomations: [], jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "tool-flow-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\/mcp-tool-activity-label$/ }, () => ({ path: path.join(ROOT, "src/renderer/mcp-tool-activity-label/index.ts") })); build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__toolFlowTest.jsx;export const LX=()=>({value:'scope'});export const ZI={};export const n4=()=>({formatMessage:(descriptor,values)=>descriptor.defaultMessage.replace(/\\{([A-Za-z0-9_]+)\\}/g,(_,key)=>String(values?.[key]??`{${key}}`))});" : importPath === "app-initial" ? "export const Wgn=value=>({response:value});export const Ugn=(scope,hostId)=>({replyWithMcpServerElicitationResponse:async(conversationId,requestId,response)=>globalThis.__toolFlowTest.bridges.push({conversationId,hostId,requestId,response})});export const uXt=({result,isCodexAppsServer})=>result?.type==='error'||(isCodexAppsServer&&result?.businessFailed===true);" : importPath === "open-automation-side-panel-tab" ? "export const n=input=>globalThis.__toolFlowTest.openedAutomations.push(input);export const t=()=>{};" : importPath === "tool-activity-disclosure" ? "export const n=()=>{};" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
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
assert.equal(labels.r({ toolName: "github_mcp_server_github_read_issue", matchingApp: { id: "github", name: "GitHub" } }), "Read issue");
assert.equal(labels.t({ toolName: "browser_open", source: { kind: "browserUse", backend: "chrome" }, intl }), "Used Chrome");
assert.equal(labels.t({ toolName: "browser_open", source: { kind: "browserUse", backend: "iab" }, intl }), "Used the browser");
assert.equal(labels.t({ toolName: "js", toolArguments: { title: "  Inspect   page " }, intl }), "Inspect page");
assert.equal(labels.t({ toolName: "js", toolArguments: { title: "x".repeat(90) }, intl }).length, 80);
assert.equal(labels.t({ toolName: "foo_js", toolArguments: { title: "Do not use title" }, intl }), "Foo js");
assert.equal(labels.t({ toolName: "browser_run_code_unsafe", intl }), "Running JavaScript");
assert.equal(labels.t({ toolName: "browser_run_code_unsafe", completed: true, intl }), "Ran JavaScript");
assert.equal(labels.t({ toolName: "github_create_issue", matchingApp: { id: "github", name: "GitHub" }, intl }), "Creating issue");
assert.equal(labels.t({ toolName: "github_create_issue", matchingApp: { id: "github", name: "GitHub" }, completed: true, intl }), "Created issue");
assert.equal(labels.t({ toolName: "github_read_issue", matchingApp: { id: "github", name: "GitHub" }, completed: true, intl }), "Read issue");
assert.equal(labels.t({ toolName: "github_send_comment", matchingApp: { id: "github", name: "GitHub" }, completed: true, intl }), "Send comment");
assert.equal(labels.t({ toolName: "github_add_comment_to_issue", matchingApp: { id: "github", name: "GitHub" }, completed: true, intl }), "Added comment");
assert.equal(labels.t({ toolName: "gmail_batch_read_email", matchingApp: { id: "gmail", name: "Gmail" }, intl }), "Reading emails");
assert.equal(labels.t({ toolName: "github_list_repositories_by_affiliation", matchingApp: { id: "github", name: "GitHub" }, completed: true, intl }), "Listed repositories");
assert.equal(labels.t({ toolName: "google_calendar_batch_read_event", matchingApp: { id: "google_calendar", name: "Google Calendar" }, intl }), "Reading events");
assert.equal(labels.t({ toolName: "slack_search_public_and_private", matchingApp: { id: "slack", name: "Slack" }, completed: true, intl }), "Searched messages");
assert.equal(labels.t({ toolName: "github_create_issue", matchingApp: { id: "github", name: "GitHub" }, toolResult: { type: "error", error: "denied" }, intl }), "Creating issue");
for (const [id, name, tool, active, completed] of [
  ["browser", "Browser", "browser_run_code_unsafe", "Running JavaScript", "Ran JavaScript"],
  ["figma", "Figma", "figma_create_new_file", "Creating Figma file", "Created Figma file"],
  ["gmail", "Gmail", "gmail_send_email", "Sending email", "Sent email"],
  ["google_calendar", "Google Calendar", "google_calendar_create_event", "Creating event", "Created event"],
  ["google_drive", "Google Drive", "google_drive_upload_file", "Uploading file", "Uploaded file"],
  ["linear", "Linear", "linear_save_issue", "Saving issue", "Saved issue"],
  ["notion", "Notion", "notion_update_page", "Updating page", "Updated page"],
  ["sites", "Sites", "sites_create_site", "Creating site", "Created site"],
  ["slack", "Slack", "slack_send_message", "Sending message", "Sent message"],
  ["vercel", "Vercel", "vercel_list_deployments", "Listing deployments", "Listed deployments"],
  ["wallet", "Wallet", "wallet_generate_cryptogram_from_saved_card", "Generating payment credential", "Generate payment credential"],
]) {
  const matchingApp = { id, name };
  assert.equal(labels.t({ toolName: tool, matchingApp, intl }), active);
  assert.equal(labels.t({ toolName: tool, matchingApp, completed: true, intl }), completed);
}
const githubApproval = labels.n({ approval: { connector_id: "github", tool_name: "github.create_issue", tool_params: { title: "Bug" } } });
assert.equal(githubApproval.descriptor.id, "localConversation.mcpToolApproval.github.create_issue.context_v3");
assert.equal(githubApproval.values.title, "Bug");
assert.equal(githubApproval.values.hasTitle, "yes");
assert.equal(githubApproval.values.hasRepository, "no");
const gmailApproval = labels.n({ approval: { connector_id: "gmail", tool_name: "gmail.send_email", tool_params: { account_id: "internal", subject: "Status update" } } });
assert.equal(gmailApproval.descriptor.id, "localConversation.mcpToolApproval.gmail.send_email.fallback");
assert.equal(gmailApproval.descriptor.defaultMessage, "Allow Gmail to send an email?");
assert.match(labels.n({ approval: { connector_id: "figma", tool_name: "figma.use_figma", tool_params: { description: "Move button" } } }).descriptor.id, /figma\.use_figma/);
assert.match(labels.n({ approval: { connector_id: "gmail", tool_name: "gmail.apply_labels_to_emails", tool_params: { add_label_names: ["Work"] } } }).descriptor.id, /gmail\.apply_labels_to_emails/);
const linearApproval = labels.n({ approval: { connector_id: "linear", tool_name: "linear.save_issue", tool_params: { id: "issue-id", title: "Fix crash", project: null, assignee: "Ada" } } });
assert.equal(linearApproval.values.action, "update");
assert.equal(linearApproval.values.hasTitle, "yes");
assert.equal(linearApproval.values.projectChange, "clear");
assert.equal(linearApproval.values.assigneeChange, "set");
assert.equal(labels.n({ approval: { connector_id: "github", tool_name: "github.check_repo_initialized" } }), null);
assert.equal(labels.n({ approval: { connector_id: "gmail", connector_name: "Gmail", tool_title: "gmail.read_email" } }), null);
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
find(urlUi, node => node.type === "button" && node.props?.color === "outline").props.onClick();
assert.equal(replies[0], "decline");
const acceptedUrlUi = approval.r({ conversationId: "c", hostId: "h", requestId: "r2", action: { message: "Sign in", url: "https://example.test" }, onReply(value) { replies.push(value); } });
const acceptedUrlForm = find(acceptedUrlUi, node => node.type === "form");
acceptedUrlForm.props.onSubmit({ preventDefault() {} });
assert.equal(replies.length, 1);
acceptedUrlForm.props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(replies[1], "accept");
assert.match(text(approval.s({ conversationId: "c", hostId: "h", requestId: "r", auth: { connector: { connector_name: "Slack" } } })), /Connect Slack/);
const bridgedConnector = approval.s({ conversationId: "bridge-c", hostId: "bridge-h", requestId: "bridge-r", auth: { connector: { connector_name: "Slack" } } });
const bridgedConnectorForm = find(bridgedConnector, node => node.type === "form");
const bridgeCount = globalThis.__toolFlowTest.bridges.length;
bridgedConnectorForm.props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(globalThis.__toolFlowTest.bridges.length, bridgeCount);
bridgedConnectorForm.props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.deepEqual(globalThis.__toolFlowTest.bridges.at(-1), { conversationId: "bridge-c", hostId: "bridge-h", requestId: "bridge-r", response: { response: "accept" } });
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
const completeUi = items.t({ item: { ...activeItem, completed: true, result: { type: "success", raw: { id: 42 } } } });
assert.equal(completeUi.props["data-tool-status"], "success");
assert.match(find(completeUi, node => node.type === "pre").props.children, /"id": 42/);
const failedUi = items.t({ item: { ...activeItem, result: { type: "error", error: "Denied" } } });
assert.equal(find(failedUi, node => node.type === "pre").props.children, "Denied");
const completedWithoutResultUi = items.t({ item: { ...activeItem, completed: true } });
assert.equal(completedWithoutResultUi.props["data-tool-status"], "success");
const circular = { id: 1 };
circular.self = circular;
assert.doesNotThrow(() => items.t({ item: { ...activeItem, result: { type: "success", raw: circular } } }));
const bigintUi = items.t({ item: { ...activeItem, result: { type: "success", structuredContent: { count: 12n } } } });
assert.match(find(bigintUi, node => node.type === "pre").props.children, /12n/);
const blocksUi = items.t({ item: { ...activeItem, result: { type: "success", content: [
  { type: "text", text: "hello", annotations: { audience: ["user"], priority: 1 } },
  { type: "image", mimeType: "image/png", data: "aW1hZ2U=" },
  { type: "audio", mimeType: "audio/mpeg", data: "YXVkaW8=" },
  { type: "resource_link", uri: "file:///tmp/report", name: "report" },
  { type: "embedded_resource", resource: { uri: "file:///tmp/data", mimeType: "text/plain", text: "payload", annotations: { lastModified: "today" } } },
] } } });
assert.match(text(blocksUi), /Annotations: audience=user; priority=1/);
assert.equal(find(blocksUi, node => node.type === "img").props.src, "data:image/png;base64,aW1hZ2U=");
assert.equal(find(blocksUi, node => node.type === "audio").props.preload, "metadata");
assert.match(text(blocksUi), /Read report/);
assert.match(text(blocksUi), /URI\s+file:\/\/\/tmp\/data/);
assert.match(text(blocksUi), /payload/);
const jsonTextUi = items.t({ item: { ...activeItem, result: { type: "success", content: [{ type: "text", text: '{"answer":42}' }] } } });
assert.match(find(jsonTextUi, node => node.type === "pre").props.children, /"answer": 42/);
const mixedResult = { type: "success", content: [{ type: "text", text: "duplicate" }, { type: "resource_link", uri: "file:///tmp/source", name: "source" }], structuredContent: { result: 1 } };
const mixedUi = items.t({ item: { ...activeItem, result: mixedResult } });
assert.match(text(mixedUi), /duplicate/);
assert.match(text(mixedUi), /"result": 1/);
const hiddenTextUi = items.t({ hideTextBlocksWithStructuredContent: true, item: { ...activeItem, result: mixedResult } });
assert.doesNotMatch(text(hiddenTextUi), /duplicate/);
assert.match(text(hiddenTextUi), /Read source/);
const businessFailureUi = items.t({ item: { ...activeItem, completed: true, invocation: { ...activeItem.invocation, server: "codex_apps" }, result: { type: "success", businessFailed: true, raw: { error: "denied" } } } });
assert.equal(businessFailureUi.props["data-tool-status"], "error");
assert.equal(find(businessFailureUi, node => node.type === "pre").props.children, "Tool failed");
let opened;
const automations = items.r({ automations: [{ id: "one", title: "Daily", scheduleLabel: "9 AM" }, { id: "two", title: "Weekly", isEnabled: false }], onOpen(id) { opened = id; } });
assert.equal(all(automations, node => node.type === "button").length, 2);
find(automations, node => node.type === "button").props.onClick();
assert.equal(opened, "one");
assert.match(text(automations), /Daily\s+· 9 AM/);
const defaultAutomation = items.r({ conversationId: "conversation", automations: [{ id: "auto", title: "Default open" }] });
find(defaultAutomation, node => node.type === "button").props.onClick();
assert.equal(globalThis.__toolFlowTest.openedAutomations.at(-1).automationId, "auto");
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

console.log("tool activity, approval, and item-content cluster assertions passed");
