import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiCalls = [];
const apiResponses = [];
globalThis.__workspaceAgentManagementTest = {
  api: {
    async safeGet(url, options) {
      apiCalls.push(["get", url, options]);
      return apiResponses.shift() ?? {};
    },
    async safePost(url, options) {
      apiCalls.push(["post", url, options]);
      return apiResponses.shift() ?? {};
    },
  },
  decodeJwt(token) {
    if (token === "invalid") throw new Error("invalid jwt");
    return JSON.parse(token);
  },
  jsx: {
    Fragment: "Fragment",
    jsx(type, props, key) {
      return typeof type === "function"
        ? type(props ?? {})
        : { type, props: props ?? {}, key };
    },
    jsxs(type, props, key) {
      return typeof type === "function"
        ? type(props ?? {})
        : { type, props: props ?? {}, key };
    },
  },
};

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "workspace-agent-management-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: importPath }) => {
              if (importPath === "rolldown-runtime")
                return {
                  contents:
                    "export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};",
                  loader: "js",
                };
              if (importPath === "app-shared")
                return {
                  contents: `
            export const I3=()=>globalThis.__workspaceAgentManagementTest.jsx;
            export const $O={FIVE_MINUTES:300000,ONE_MINUTE:60000};
            export const FX=()=>{}; export const QI=()=>{}; export const ek=()=>{}; export const ZI={}; export const pL=value=>value;
            const family=(_scope,factory)=>{const result=parameter=>parameter;result.getOptions=(parameter,context={})=>factory(parameter,{get:signal=>signal==='account-id'?(context.accountId??null):signal==='enabled'?(context.enabled!==false):undefined});return result};
            export const QX=family; export const XX=family;`,
                  loader: "js",
                };
              if (importPath === "app-initial")
                return {
                  contents: `
            export const rJt=globalThis.__workspaceAgentManagementTest.api;
            export const udn=globalThis.__workspaceAgentManagementTest.api;
            export const _dn={getInstance:()=>({fetch:(url,options)=>fetch(url,options)})};
            export const Bw='enabled'; export const mun='account-id';
            export const XGt=value=>/^https?:\\/\\//.test(value)?value:null; export const aJt=value=>value; export const oJt=()=>({Authorization:'Bearer test'});
            export const Sun=()=>{}; export const YGt=()=>{}; export const cJt=()=>{}; export const gmn=()=>{}; export const pdn=()=>{}; export const ydn=()=>{}; export const zw=()=>{};`,
                  loader: "js",
                };
              if (importPath === "browser-mfa-jwt")
                return {
                  contents:
                    "export const n=globalThis.__workspaceAgentManagementTest.decodeJwt;",
                  loader: "js",
                };
              return { contents: "export {};", loader: "js" };
            },
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

function walk(node, visit) {
  if (node == null || typeof node !== "object") return;
  visit(node);
  const children = node.props?.children;
  if (Array.isArray(children))
    children.flat(Infinity).forEach((child) => walk(child, visit));
  else walk(children, visit);
}
function find(node, predicate) {
  let result;
  walk(node, (value) => {
    if (result == null && predicate(value)) result = value;
  });
  return result;
}
function all(node, predicate) {
  const result = [];
  walk(node, (value) => {
    if (predicate(value)) result.push(value);
  });
  return result;
}
function text(node) {
  const values = [];
  walk(node, (value) => {
    const children = value.props?.children;
    if (typeof children === "string") values.push(children);
  });
  return values.join(" ");
}

// workspace-discovery: 19
const discovery = await bundle("workspace-discovery");
assert.deepEqual(Object.keys(discovery), [
  "a",
  "c",
  "i",
  "l",
  "n",
  "o",
  "r",
  "s",
  "t",
  "u",
]);
assert.equal(discovery.s, "oai/apps/hasSeenWorkspaceDiscoveryFirstLogin");
assert.equal(
  discovery.r.$type,
  "protobuf_analytics_events.v1.ChatgptWorkspaceDiscoveryModalShown",
);
assert.equal(
  discovery.c({ email: "ada@example.com", email_domain_type: "company" }),
  true,
);
assert.equal(
  discovery.c({ email: "ada@example.com", email_domain_type: "social" }),
  false,
);
assert.equal(discovery.c({ email: "ada@example.com" }), false);
assert.equal(
  discovery.c({ email: "not-an-email", email_domain_type: "company" }),
  false,
);
const discoveryOptions = discovery.a.getOptions("user-1");
assert.deepEqual(discoveryOptions.queryKey, ["workspace-discovery", "user-1"]);
assert.equal(discovery.a.getOptions(null).enabled, false);
apiResponses.push({ workspaces: [{ id: "w", name: "Workspace" }] });
assert.equal((await discoveryOptions.queryFn({})).workspaces[0].id, "w");
assert.equal(apiCalls.at(-1)[1], "/accounts/discoverable-workspaces");
const now = Date.now();
assert.equal(
  discovery.u(
    JSON.stringify({ pwd_auth_time: Math.floor((now - 5_000) / 1_000) }),
    now,
  ),
  true,
);
assert.equal(
  discovery.u(JSON.stringify({ pwd_auth_time: now - 5_000 }), now),
  true,
);
assert.equal(
  discovery.u(
    JSON.stringify({ pwd_auth_time: Math.floor((now - 20_000) / 1_000) }),
    now,
  ),
  false,
);
assert.equal(discovery.u("invalid", now), false);
let requested,
  discoveryClosed = 0;
const discoveryUi = discovery.t({
  accessibleWorkspaces: [{ id: "a", name: "Acme" }],
  discoverableWorkspaces: [{ id: "b", name: "Beta" }],
  email: "ada@example.com",
  mode: "dismissible",
  onClose() {
    discoveryClosed++;
  },
  onRequest(workspace) {
    requested = workspace.id;
  },
});
assert.equal(
  discoveryUi.props["aria-label"],
  "Join and launch your workspaces",
);
assert.equal(
  all(discoveryUi, (node) => node.props?.role === "listitem").length,
  2,
);
find(discoveryUi, (node) => node.props?.children === "Request").props.onClick();
assert.equal(requested, "b");
find(discoveryUi, (node) => node.props?.children === "Close").props.onClick();
assert.equal(discoveryClosed, 1);

// workspace-agent-detail-query: 27
const details = await bundle("workspace-agent-detail-query");
details.t();
assert.deepEqual(Object.keys(details), [
  "a",
  "c",
  "d",
  "i",
  "l",
  "n",
  "o",
  "r",
  "s",
  "t",
  "u",
]);
assert.equal(
  details.l({
    connector_identifier: { type: "CONNECTOR_ID", connector_id: "drive" },
  }),
  "drive",
);
assert.equal(
  details.l({
    connector_identifier: { type: "BUILT_IN", connector_id: "drive" },
  }),
  null,
);
const appOptions = details.s({
  accountId: "account",
  connectorIds: ["z", "a", "z"],
});
assert.deepEqual(appOptions.queryKey, [
  "workspace-agent",
  "apps",
  "account",
  ["a", "z"],
]);
apiResponses.push(
  {
    recommended_apps: [
      { id: "a", subtitle: "Recommended description", disabled_by_admin: true },
    ],
    workspace_apps: [{ id: "a", subtitle: "Ignored duplicate" }, { id: "b" }],
    public_apps: [],
  },
  {
    apps: [
      {
        id: "a",
        name: "Alpha",
        description: "  Primary description  ",
        logo_url: "alpha.png",
      },
      { id: "b", name: "Beta" },
      { id: "z", name: "Zeta" },
    ],
    missing_app_ids: ["missing"],
  },
);
const apps = await appOptions.queryFn({});
assert.deepEqual(
  apps.apps.map((app) => app.id),
  ["a", "b", "z"],
);
assert.equal(apps.apps[0].description, "Primary description");
assert.equal(apps.apps[0].source, "recommended");
assert.equal(apps.apps[0].disabledByAdmin, true);
assert.equal(apps.apps[2].source, "selected");
assert.deepEqual(apps.missingConnectorIds, ["missing"]);
assert.equal(apiCalls.at(-1)[0], "post");
assert.deepEqual(apiCalls.at(-1)[2].requestBody.app_ids, ["a", "b", "z"]);
const connectorActions = details.c("account", "drive");
assert.deepEqual(connectorActions.queryKey, [
  "workspace-agent",
  "connector-actions",
  "account",
  "drive",
]);
const readiness = details.u({
  accountId: "account",
  agentId: "agent",
  versionScope: "draft",
});
assert.deepEqual(readiness.queryKey, [
  "workspace-agent",
  "connector-readiness",
  "account",
  "agent",
  "draft",
]);
assert.equal(details.i.getOptions("agent").enabled, false);
assert.deepEqual(
  details.i.getOptions("agent", { accountId: "account" }).queryKey,
  ["workspace-agent", "detail", "account", "agent"],
);
const activity = details.n.getOptions("agent", { accountId: "account" });
assert.equal(activity.initialPageParam, null);
assert.equal(activity.getNextPageParam({ cursor: "next" }), "next");
assert.equal(activity.getNextPageParam({ cursor: null }), undefined);
const memoryTree = details.o.getOptions(
  {
    agentId: "agent",
    channel: { type: "slack", linkId: "link", channelId: "channel" },
  },
  { accountId: "account" },
);
assert.deepEqual(memoryTree.queryKey.slice(0, 4), [
  "workspace-agent",
  "memory",
  "account",
  "agent",
]);
apiResponses.push({
  download_url: "https://files.example/note",
  mime_type: "text/plain",
  size_bytes: 4,
});
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => new Response("note");
const memoryText = await details.a
  .getOptions(
    { agentId: "agent", fileId: "file", fileName: "note.txt" },
    { accountId: "account" },
  )
  .queryFn({ signal: new AbortController().signal });
assert.deepEqual(memoryText, {
  kind: "text",
  content: "note",
  truncated: false,
});
apiResponses.push({
  download_url: "https://files.example/image",
  mime_type: "image/png",
  size_bytes: 4,
});
assert.deepEqual(
  await details.a
    .getOptions({ agentId: "agent", fileId: "image" }, { accountId: "account" })
    .queryFn({ signal: new AbortController().signal }),
  { kind: "unsupported", reason: "binary" },
);
apiResponses.push({
  download_url: "https://files.example/large",
  mime_type: "text/plain",
  size_bytes: 100_001,
});
assert.deepEqual(
  await details.a
    .getOptions({ agentId: "agent", fileId: "large" }, { accountId: "account" })
    .queryFn({ signal: new AbortController().signal }),
  { kind: "unsupported", reason: "too-large" },
);
apiResponses.push({
  download_url: "file:///private/note",
  mime_type: "text/plain",
  size_bytes: 4,
});
await assert.rejects(
  () =>
    details.a
      .getOptions(
        { agentId: "agent", fileId: "unsafe" },
        { accountId: "account" },
      )
      .queryFn({ signal: new AbortController().signal }),
  /unsafe/,
);
globalThis.fetch = originalFetch;
assert.equal(
  details.a.getOptions({ agentId: "agent" }, { accountId: "account" }).enabled,
  false,
);
assert.equal(details.r.getOptions([], { accountId: "account" }).enabled, false);
assert.deepEqual(
  details.r.getOptions(["drive"], { accountId: "account" }).queryKey,
  ["workspace-agent", "apps", "account", ["drive"]],
);

// duplicate-agent: 18
const duplicate = await bundle("duplicate-agent");
assert.deepEqual(Object.keys(duplicate), ["a", "i", "n", "o", "r", "t"]);
let selected = 0;
const menu = duplicate.n({
  onSelect() {
    selected++;
  },
});
assert.equal(menu.props.role, "menuitem");
menu.props.onClick();
assert.equal(selected, 1);
assert.equal(
  duplicate.r({
    agentId: "agent",
    onSelect() {},
    service: { canDuplicate: () => false },
  }),
  null,
);
const cloneEvents = [],
  invalidations = [];
const duplicateUi = duplicate.t({
  agentId: "agent",
  agentName: "  Researcher  ",
  onClose() {
    cloneEvents.push("closed");
  },
  service: {
    async clone(id, name) {
      cloneEvents.push([id, name]);
      return { id: "copy" };
    },
    invalidate(key) {
      invalidations.push(key);
    },
    navigateToAgent(id) {
      cloneEvents.push(["navigate", id]);
    },
  },
});
assert.equal(duplicateUi.props["aria-label"], "Duplicate Researcher?");
assert.match(text(duplicateUi), /won't copy channels/);
await find(duplicateUi, (node) => node.type === "form").props.onSubmit({
  preventDefault() {},
});
assert.deepEqual(cloneEvents[0], ["agent", "Researcher (Copy)"]);
assert.deepEqual(invalidations[0], ["workspace-agents", "created"]);
assert.deepEqual(cloneEvents.at(-1), ["navigate", "copy"]);
const unnamedUi = duplicate.t({
  agentId: "agent",
  agentName: " ",
  onClose() {},
  service: {
    async clone(_id, name) {
      cloneEvents.push(name);
      return { id: "copy" };
    },
  },
});
await unnamedUi.props.onSubmit({ preventDefault() {} });
assert.equal(cloneEvents.at(-1), "Unnamed agent (Copy)");
const deleteEvents = [],
  deleteInvalidations = [];
const deleteUi = duplicate.a({
  agentId: "agent",
  onClose() {
    deleteEvents.push("closed");
  },
  onDeleted() {
    deleteEvents.push("deleted");
  },
  service: {
    async delete(id) {
      deleteEvents.push(id);
    },
    invalidate(key) {
      deleteInvalidations.push(key);
    },
    notify(tone, message) {
      deleteEvents.push([tone, message]);
    },
  },
});
assert.equal(deleteUi.props["aria-label"], "Delete agent?");
await deleteUi.props.onSubmit({ preventDefault() {} });
assert.equal(deleteInvalidations.length, 9);
assert.deepEqual(deleteEvents.slice(-3), [
  ["success", "Agent deleted"],
  "closed",
  "deleted",
]);
const failureEvents = [];
const failedDuplicate = duplicate.t({
  agentId: "agent",
  agentName: "Agent",
  onClose() {},
  service: {
    async clone() {
      throw new Error("nope");
    },
    notify(tone, message) {
      failureEvents.push([tone, message]);
    },
  },
});
await failedDuplicate.props.onSubmit({ preventDefault() {} });
assert.deepEqual(failureEvents.at(-1), ["danger", "Failed to duplicate agent"]);
const failedDelete = duplicate.a({
  agentId: "agent",
  onClose() {
    failureEvents.push("closed");
  },
  service: {
    async delete() {
      throw new Error("nope");
    },
    notify(tone, message) {
      failureEvents.push([tone, message]);
    },
  },
});
await failedDelete.props.onSubmit({ preventDefault() {} });
assert.deepEqual(failureEvents.slice(-2), [
  ["danger", "Failed to delete agent"],
  "closed",
]);
assert.equal(
  find(
    duplicate.a({
      agentId: "agent",
      onClose() {},
      service: { canDelete: () => false },
    }),
    (node) => node.props?.children === "Delete",
  ).props.disabled,
  true,
);
let guardedClosed = 0;
const guardedDuplicate = duplicate.t({
  agentId: "agent",
  agentName: "Agent",
  onClose() {
    guardedClosed++;
  },
  service: { canDuplicate: () => false },
});
assert.equal(
  find(guardedDuplicate, (node) => node.props?.children === "Duplicate").props
    .disabled,
  true,
);
find(
  guardedDuplicate,
  (node) => node.props?.children === "Cancel",
).props.onClick();
assert.equal(guardedClosed, 1);

console.log(
  "64 workspace discovery and agent management cluster assertions passed",
);
