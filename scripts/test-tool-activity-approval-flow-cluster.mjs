import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__toolFlowTest = { apps: [], plugins: [], refreshedApps: [], refreshedPlugins: [], bridges: [], consents: [], enabledApps: [], enabledPlugins: [], installs: [], openedAutomations: [], openedUrls: [], startConnectionResult: null, mcpCatalog: {}, mcpResource: {}, mcpResourceRefetches: 0, jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "tool-flow-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\/mcp-tool-activity-label$/ }, () => ({ path: path.join(ROOT, "src/renderer/mcp-tool-activity-label/index.ts") })); build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__toolFlowTest.jsx;export const LX=()=>({value:'scope'});export const ZI={};export const BX=(descriptor)=>descriptor?.kind==='mcp-catalog'?globalThis.__toolFlowTest.mcpCatalog:{};export const e6=()=>({useRef:value=>({current:value}),useState:value=>[value,()=>{}]});export const n4=()=>({formatMessage:(descriptor,values)=>descriptor.defaultMessage.replace(/\\{([A-Za-z0-9_]+)\\}/g,(_,key)=>String(values?.[key]??`{${key}}`))});" : importPath === "app-initial" ? "export const Wgn=value=>({response:value});export const Ugn=(scope,hostId)=>({replyWithMcpServerElicitationResponse:async(conversationId,requestId,response)=>globalThis.__toolFlowTest.bridges.push({conversationId,hostId,requestId,response})});export const GEt=()=>({data:globalThis.__toolFlowTest.apps,hardRefetchAppsList:async()=>globalThis.__toolFlowTest.refreshedApps});export const N4t=()=>({availablePlugins:globalThis.__toolFlowTest.plugins,refetch:async()=>({availablePlugins:globalThis.__toolFlowTest.refreshedPlugins})});export const Vwt=()=>({setPluginEnabled:async input=>globalThis.__toolFlowTest.enabledPlugins.push(input)});export const U2=()=>({installPlugin:async(input,options)=>globalThis.__toolFlowTest.installs.push({input,options})});export const Y3t=async input=>globalThis.__toolFlowTest.consents.push(input);export const l6t=async()=>globalThis.__toolFlowTest.startConnectionResult;export const Lr=()=>({isAppConnectCallbackClaimed:()=>false});export const uXt=({result,isCodexAppsServer})=>result?.type==='error'||(isCodexAppsServer&&result?.businessFailed===true);export const PU={kind:'mcp-catalog'};export const LU=()=>({...globalThis.__toolFlowTest.mcpResource,refetch:()=>{globalThis.__toolFlowTest.mcpResourceRefetches++}});export const TU=({renderData})=>({kind:renderData?.presentation??'inline',renderData});export const WH=props=>({type:'mcp-widget-renderer',props});export const IH=props=>({type:'mcp-widget-lifecycle',props});" : importPath === "use-app-connect-flow" ? "export const n=options=>({handleOpenAppUrl:url=>globalThis.__toolFlowTest.openedUrls.push(url),handleConnectApp:async()=>options?.onExternalConnectStarted?.(),handleAppConnectOAuthStarted:()=>options?.onExternalConnectStarted?.(),isAppConnectPending:()=>false});export const t=()=>{};" : importPath === "apps-availability" ? "export const n=()=>({setAppEnabled:async input=>globalThis.__toolFlowTest.enabledApps.push(input)});" : importPath === "app-connect-modal" ? "export const t=()=>null;" : importPath === "open-automation-side-panel-tab" ? "export const n=input=>globalThis.__toolFlowTest.openedAutomations.push(input);export const t=()=>{};" : importPath === "tool-activity-disclosure" ? "export const n=()=>{};export const t=({children,summary,status})=>({type:'disclosure',props:{children,summary,status}});" : importPath === "webmcp-tool-calls" ? "export const n=()=>{};export const t=metadata=>metadata?.['codex/toolSurface']?.webMcpCalls??[];" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const values = []; const collect = value => { if (typeof value === "string") values.push(value); else if (value != null && typeof value === "object") { const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); } }; collect(node); return values.join(" "); }
const flush = () => new Promise(resolve => setImmediate(resolve));
const intl = { formatMessage(descriptor) { return descriptor.defaultMessage; } };
const interpolatingIntl = { formatMessage(descriptor, values) { return descriptor.defaultMessage.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, key) => String(values?.[key] ?? `{${key}}`)); } };

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
assert.equal(labels.t({ toolName: "github_create_issue", matchingApp: { id: "github", name: "GitHub" }, toolArguments: { title: "Renderer crash" }, intl: interpolatingIntl }), "Creating issue “Renderer crash”");
assert.equal(labels.t({ toolName: "github_search_issues", matchingApp: { id: "github", name: "GitHub" }, completed: true, toolResult: { type: "success", structuredContent: { issues: [{ id: 1 }, { id: 2 }] } }, intl: interpolatingIntl }), "Searched issues (2)");
assert.equal(labels.t({ toolName: "github_search_issues", matchingApp: { id: "github", name: "GitHub" }, completed: true, toolArguments: { query: "is:open crash" }, toolResult: { type: "success", structuredContent: { issues: [{ id: 1 }] } }, intl: interpolatingIntl }), "Searched issues “is:open crash”");
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
assert.match(text(approval.s({ conversationId: "c", hostId: "h", requestId: "r", auth: { connector: { connector_name: "Slack" } } })), /Slack/);
const bridgedConnector = approval.s({ conversationId: "bridge-c", hostId: "bridge-h", requestId: "bridge-r", auth: { connector: { connector_name: "Slack" } } });
const bridgedConnectorForm = find(bridgedConnector, node => node.type === "form");
const bridgeCount = globalThis.__toolFlowTest.bridges.length;
bridgedConnectorForm.props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(globalThis.__toolFlowTest.bridges.length, bridgeCount);
bridgedConnectorForm.props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(globalThis.__toolFlowTest.bridges.length, bridgeCount);
assert.match(text(approval.a({ conversationId: "c", hostId: "h", requestId: "r", suggestion: { tool_title: "Calendar" } })), /Calendar/);
const consentReplies = [];
const consentUi = approval.s({ conversationId: "consent-c", hostId: "h", requestId: "consent-r", auth: { connector: { connector_id: "drive", connector_name: "Drive", connection_consent: { origin: "drive.example", scopes: [{ scope: "read", label: "Read files" }] } } }, onReply(value) { consentReplies.push(value); } });
find(consentUi, node => node.type === "form").props.onSubmit({ preventDefault() {} });
await flush();
assert.equal(globalThis.__toolFlowTest.consents.at(-1).connectorId, "drive");
assert.deepEqual(consentReplies, ["accept"], "scope consent accepts only after the authorization request resolves");
globalThis.__toolFlowTest.startConnectionResult = { kind: "oauth-started", redirectUrl: "https://oauth.example" };
globalThis.__toolFlowTest.refreshedApps = [];
const oauthReplies = [];
const oauthUi = approval.s({ conversationId: "oauth-c", hostId: "h", requestId: "oauth-r", auth: { connector: { connector_id: "slack", connector_name: "Slack", auth_reason: "missing_link" } }, onReply(value) { oauthReplies.push(value); } });
const oauthForm = find(oauthUi, node => node.type === "form");
oauthForm.props.onSubmit({ preventDefault() {} });
await flush();
assert.deepEqual(oauthReplies, [], "starting OAuth must not accept the elicitation");
oauthForm.props.onSubmit({ preventDefault() {} });
await flush();
assert.deepEqual(oauthReplies, [], "Continue must not accept while connector readiness is false");
globalThis.__toolFlowTest.refreshedApps = [{ id: "slack", isAccessible: true, isEnabled: true }];
oauthForm.props.onSubmit({ preventDefault() {} });
await flush();
assert.deepEqual(oauthReplies, ["accept"], "Continue accepts after refreshed connector readiness is true");
globalThis.__toolFlowTest.apps = [{ id: "calendar", name: "Calendar", isAccessible: true, isEnabled: false }];
globalThis.__toolFlowTest.refreshedApps = [{ id: "calendar", name: "Calendar", isAccessible: true, isEnabled: true }];
const connectorSuggestionReplies = [];
const connectorSuggestionUi = approval.a({ conversationId: "tool-c", hostId: "h", requestId: "tool-r", suggestion: { tool_id: "calendar", tool_name: "Calendar", tool_type: "connector", suggest_type: "enable" }, onReply(value) { connectorSuggestionReplies.push(value); } });
const connectorSuggestionForm = find(connectorSuggestionUi, node => node.type === "form");
connectorSuggestionForm.props.onSubmit({ preventDefault() {} });
await flush();
assert.equal(globalThis.__toolFlowTest.enabledApps.at(-1).appId, "calendar");
assert.deepEqual(connectorSuggestionReplies, [], "enabling a connector does not accept before readiness refresh");
connectorSuggestionForm.props.onSubmit({ preventDefault() {} });
await flush();
assert.deepEqual(connectorSuggestionReplies, ["accept"]);
globalThis.__toolFlowTest.plugins = [{ displayName: "Plugin", plugin: { id: "plugin", installed: false, enabled: false } }];
globalThis.__toolFlowTest.refreshedPlugins = [{ displayName: "Plugin", plugin: { id: "plugin", installed: true, enabled: true } }];
const pluginReplies = [];
const pluginUi = approval.a({ conversationId: "plugin-c", hostId: "h", requestId: "plugin-r", suggestion: { tool_id: "plugin", tool_name: "Plugin", tool_type: "plugin", suggest_type: "install" }, onReply(value) { pluginReplies.push(value); } });
const pluginForm = find(pluginUi, node => node.type === "form");
pluginForm.props.onSubmit({ preventDefault() {} });
await flush();
assert.equal(globalThis.__toolFlowTest.installs.length, 1);
assert.deepEqual(pluginReplies, [], "plugin installation does not accept before readiness refresh");
pluginForm.props.onSubmit({ preventDefault() {} });
await flush();
assert.deepEqual(pluginReplies, ["accept"]);
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
assert.equal(find(activeUi, node => node.props?.["data-tool-status"] === "active").props["aria-label"], "Read issue");
assert.equal(find(activeUi, node => node.type === "disclosure").props.status, "running");
const completeUi = items.t({ item: { ...activeItem, completed: true, result: { type: "success", raw: { id: 42 } } } });
assert.equal(find(completeUi, node => node.props?.["data-tool-status"] === "success").props["data-tool-status"], "success");
assert.match(find(completeUi, node => node.type === "pre").props.children, /"id": 42/);
const failedUi = items.t({ item: { ...activeItem, result: { type: "error", error: "Denied" } } });
assert.equal(find(failedUi, node => node.type === "pre").props.children, "Denied");
const completedWithoutResultUi = items.t({ item: { ...activeItem, completed: true } });
assert.equal(find(completedWithoutResultUi, node => node.props?.["data-tool-status"] === "success").props["data-tool-status"], "success");
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
assert.equal(find(businessFailureUi, node => node.props?.["data-tool-status"] === "error").props["data-tool-status"], "error");
assert.equal(find(businessFailureUi, node => node.type === "pre").props.children, "Tool failed");
globalThis.__toolFlowTest.mcpResource = { data: { resource: { uri: "ui://github/issue", mimeType: "text/html", text: "<main>Issue</main>" }, heightHint: 320, prefersBorder: true } };
const appUi = items.t({ renderMcpApps: true, shouldAutoExpandMcpApp: true, toolActivityTurnKey: "turn:tool", item: { ...activeItem, completed: true, invocationResourceUri: "ui://github/issue", automaticApprovalReviews: [{ decision: "allow" }] } });
assert.equal(find(appUi, node => node.props?.["data-mcp-app-resource-uri"] === "ui://github/issue").props["data-mcp-app-state"], "open");
assert.equal(find(appUi, node => node.type === "mcp-widget-renderer").props.resource.data.uri, "ui://github/issue");
assert.equal(find(appUi, node => node.type === "mcp-widget-lifecycle").props.isInlineRequested, true);
assert.match(text(find(appUi, node => node.props?.["data-automatic-approval-reviews"] === true)), /allow/);
assert.equal(find(appUi, node => node.props?.["data-tool-activity-turn-key"] === "turn:tool").props["data-tool-activity-turn-key"], "turn:tool");
const appDisabledUi = items.t({ renderMcpApps: false, shouldAutoExpandMcpApp: true, item: { ...activeItem, completed: true, invocationResourceUri: "ui://github/issue", result: { type: "success", raw: { ok: true } } } });
assert.equal(find(appDisabledUi, node => node.props?.["data-mcp-app-resource-uri"] != null), undefined);
assert.match(find(appDisabledUi, node => node.type === "pre").props.children, /"ok": true/);
globalThis.__toolFlowTest.mcpCatalog = { data: { resources: [{ server: "github", tool: "github_read_issue", resourceUri: "ui://catalog/issue" }] } };
globalThis.__toolFlowTest.mcpResource = { data: { resource: { uri: "ui://catalog/issue", mimeType: "text/html", text: "<main>Catalog issue</main>" } } };
const catalogAppUi = items.t({ renderMcpApps: true, shouldAutoExpandMcpApp: true, item: { ...activeItem, completed: true } });
assert.equal(find(catalogAppUi, node => node.props?.["data-mcp-app-resource-uri"] === "ui://catalog/issue").props["data-mcp-app-presentation"], "inline");
globalThis.__toolFlowTest.mcpResource = { isPending: true };
const pendingAppUi = items.t({ renderMcpApps: true, shouldAutoExpandMcpApp: true, item: { ...activeItem, completed: true, invocationResourceUri: "ui://pending" } });
assert.equal(find(pendingAppUi, node => node.props?.["data-mcp-app-pending"] === true).props.role, "status");
globalThis.__toolFlowTest.mcpResource = { error: new Error("Resource read failed") };
const errorAppUi = items.t({ renderMcpApps: true, shouldAutoExpandMcpApp: true, item: { ...activeItem, completed: true, invocationResourceUri: "ui://error", result: { type: "success", raw: { fallback: "resource-error" } } } });
assert.equal(find(errorAppUi, node => node.props?.["data-mcp-app-error"] === true), undefined);
assert.match(find(errorAppUi, node => node.type === "pre").props.children, /resource-error/);
globalThis.__toolFlowTest.mcpResource = { data: { resource: { uri: "ui://large", mimeType: "text/html", text: "x".repeat(1_000_001) } } };
const largeAppUi = items.t({ renderMcpApps: true, shouldAutoExpandMcpApp: true, item: { ...activeItem, completed: true, invocationResourceUri: "ui://large", result: { type: "success", raw: { fallback: "resource-too-large" } } } });
assert.equal(find(largeAppUi, node => node.props?.["data-mcp-app-too-large"] === true), undefined);
assert.match(find(largeAppUi, node => node.type === "pre").props.children, /resource-too-large/);
globalThis.__toolFlowTest.mcpCatalog = {};
globalThis.__toolFlowTest.mcpResource = {};
const webMcpUi = items.t({ item: { ...activeItem, completed: true, source: { kind: "browserUse", backend: "iab" }, result: { type: "success", raw: { _meta: { "openai/pageUrl": "https://example.test", "codex/toolSurface": { kind: "browserUse", webMcpCalls: [{ kind: "invokeTool", name: "search_site", title: "Search site", inputJson: "{\"q\":\"docs\"}", outputJson: "{\"count\":1}" }] } } } } } });
assert.equal(find(webMcpUi, node => node.props?.["data-webmcp-call"] === "invokeTool").props["data-webmcp-call"], "invokeTool");
assert.match(text(webMcpUi), /Search site/);
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
