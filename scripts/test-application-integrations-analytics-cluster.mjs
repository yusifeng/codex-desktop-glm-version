import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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
        name: "integration-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: name }) => ({
              contents:
                name === "rolldown-runtime"
                  ? "export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};"
                  : name === "app-initial"
                    ? "export const Pzt='/finances'; export const WW={}; export const ly={}; export const kft=()=>false;"
                    : name === "app-shared"
                      ? "export const q3=()=>null;"
                      : "export {};",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

assertReleaseOwner("builder-analytics");

// api: 15
const api = await bundle("api");
assert.deepEqual(Object.keys(api), ["a", "i", "n", "o", "r", "s", "t"]);
assert.equal(api.a({ name: "plugin.zip", size: 10 }), null);
assert.equal(api.a({ name: "plugin.tgz", size: 101 * 1024 * 1024 }), "size");
assert.equal(api.a({ name: "plugin.txt", size: 10 }), "type");
const originalFetch = globalThis.fetch;
let calls = [];
globalThis.fetch = async (input, init = {}) => {
  calls.push({ input: String(input), init });
  return new Response(
    JSON.stringify({
      pagination: { next_page_token: calls.length === 1 ? "next" : undefined },
      plugins:
        calls.length === 1
          ? []
          : [{ id: "plugin-2", can_refresh_from_source: false }],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
};
assert.equal((await api.i("plugin-2", "account-1")).id, "plugin-2");
assert.equal(calls.length, 2);
assert.match(calls[1].input, /pageToken=next/);
calls = [];
assert.equal(await api.t("plugin-2", "account-1"), true);
assert.equal(api.o(), undefined);
const file = {
  name: "plugin.zip",
  size: 3,
  async arrayBuffer() {
    return new Uint8Array([1, 2, 3]).buffer;
  },
};
const responses = [
  new Response(
    JSON.stringify({
      etag: "etag-1",
      file_id: "file-1",
      upload_url: "https://upload.test/file",
    }),
    { status: 200 },
  ),
  new Response(null, { status: 200 }),
  new Response(JSON.stringify({ plugin_id: "plugin-new" }), { status: 200 }),
];
calls = [];
globalThis.fetch = async (input, init = {}) => {
  calls.push({ input: String(input), init });
  return responses.shift();
};
assert.equal(await api.n("account-1", file), "plugin-new");
assert.equal(calls.length, 3);
assert.equal(calls[1].init.method, "PUT");
assert.match(String(calls[2].init.body), /file-1/);
globalThis.fetch = async () => new Response("archive", { status: 200 });
assert.equal((await api.r("plugin-1", "account-1")).size, 7);
globalThis.fetch = originalFetch;
assert.equal(api.a({ name: "PLUGIN.TAR.GZ", size: 12 }), null);

// plaid-link: 12
const plaid = await bundle("plaid-link");
assert.deepEqual(Object.keys(plaid), ["i", "n", "r", "t"]);
plaid.n();
const storage = new Map();
globalThis.window = globalThis;
globalThis.sessionStorage = {
  getItem(key) {
    return storage.get(key) ?? null;
  },
  setItem(key, value) {
    storage.set(key, value);
  },
  removeItem(key) {
    storage.delete(key);
  },
  clear() {
    storage.clear();
  },
  key() {
    return null;
  },
  get length() {
    return storage.size;
  },
};
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.Plaid = {
  create(options) {
    const handler = {
      open() {
        options.onSuccess("public-token");
      },
      destroy() {},
    };
    queueMicrotask(() => options.onLoad());
    return handler;
  },
};
assert.equal(plaid.t("account-1"), "/finances");
storage.set(
  "codex:finance:pending-plaid-link",
  JSON.stringify({
    accountId: "account-1",
    createdAt: Date.now(),
    linkToken: "token",
    oauthStateId: "state",
    returnTo: "/custom",
  }),
);
assert.equal(plaid.t("account-1"), "/custom");
assert.equal(plaid.t("other"), "/finances");
let invalidated = 0,
  received,
  submitted;
const plaidService = {
  async startOAuthFlow(input) {
    received = input;
    return { token: "link-token", oauth_state_id: "oauth-state" };
  },
  async markOAuthFlowInitializing() {},
  async submitPlaidPublicToken(input) {
    submitted = input;
  },
  async getOAuthState() {
    return { finished: true, connected_accounts: 1 };
  },
};
const plaidScope = {
  get() {
    return plaidService;
  },
  query: {
    invalidate() {
      invalidated++;
    },
  },
  queryClient: {
    async invalidateQueries() {
      invalidated++;
    },
  },
};
assert.equal(
  await plaid.r(plaidScope, { accountId: "account-1", returnTo: "/after" }),
  true,
);
assert.deepEqual(received, {
  link_id: undefined,
  native_android: false,
  native_ios: false,
});
assert.deepEqual(submitted, {
  link_token: "link-token",
  public_token: "public-token",
});
assert.equal(invalidated, 2);
const aborted = new AbortController();
aborted.abort();
assert.equal(
  await plaid.r(plaidScope, { accountId: "account-1", signal: aborted.signal }),
  false,
);
assert.equal(
  (
    await plaid.i(plaidScope, {
      accountId: "account-1",
      linkToken: "token",
      oauthStateId: "state",
    })
  ).type,
  "completed",
);
assert.equal(
  (
    await plaid.i(plaidScope, {
      accountId: "account-1",
      linkToken: "token",
      oauthStateId: "state",
      signal: aborted.signal,
    })
  ).plaidErrorCode,
  "launch_cancelled",
);
assert.equal(plaid.n(), undefined);
assert.equal(storage.get("codex:finance:pending-plaid-link"), undefined);

// chatgpt-sites: 8
const sites = await bundle("chatgpt-sites");
assert.deepEqual(Object.keys(sites), ["a", "i", "n", "r", "t"]);
assert.equal(
  sites.i.CHATGPT_SITES_SOURCE_SIDEBAR,
  "CHATGPT_SITES_SOURCE_SIDEBAR",
);
assert.equal(sites.i.UNRECOGNIZED, "UNRECOGNIZED");
assert.equal(
  sites.n.CHATGPT_SITES_INTERACTION_TYPE_SITE_OPENED,
  "CHATGPT_SITES_INTERACTION_TYPE_SITE_OPENED",
);
assert.equal(
  sites.n.CHATGPT_SITES_INTERACTION_TYPE_SEARCH_STARTED,
  "CHATGPT_SITES_INTERACTION_TYPE_SEARCH_STARTED",
);
assert.equal(
  sites.r.$type,
  "protobuf_analytics_events.v1.ChatgptSitesResponseCardViewed",
);
assert.equal(
  sites.t.$type,
  "protobuf_analytics_events.v1.ChatgptSitesInteraction",
);
assert.equal(sites.a(), undefined);

// chatgpt-tasks-runtime: 10
const tasks = await bundle("chatgpt-tasks-runtime");
tasks.s();
assert.deepEqual(Object.keys(tasks), ["a", "i", "n", "o", "r", "s", "t"]);
assert.equal(
  tasks.a.CHATGPT_TASKS_OPEN_DESTINATION_EDITOR,
  "CHATGPT_TASKS_OPEN_DESTINATION_EDITOR",
);
assert.equal(
  tasks.i.CHATGPT_TASKS_INTERACTION_SOURCE_SHARING_SHEET,
  "CHATGPT_TASKS_INTERACTION_SOURCE_SHARING_SHEET",
);
assert.equal(tasks.n.$type, "protobuf_analytics_events.v1.ChatgptTasksEvent");
assert.equal(
  tasks.o.CHATGPT_TASKS_OPEN_SOURCE_NOTIFICATION,
  "CHATGPT_TASKS_OPEN_SOURCE_NOTIFICATION",
);
assert.equal(
  tasks.r.CHATGPT_TASKS_EVENT_TYPE_TASK_SAVED,
  "CHATGPT_TASKS_EVENT_TYPE_TASK_SAVED",
);
assert.equal(
  tasks.r.CHATGPT_TASKS_EVENT_TYPE_TASK_SHARE_LINK_CREATED,
  "CHATGPT_TASKS_EVENT_TYPE_TASK_SHARE_LINK_CREATED",
);
assert.equal(
  tasks.t.CHATGPT_TASKS_ASSISTANT_MODE_WORK,
  "CHATGPT_TASKS_ASSISTANT_MODE_WORK",
);
assert.equal(tasks.r.UNRECOGNIZED, "UNRECOGNIZED");
assert.equal(tasks.s(), undefined);

console.log(
  "58 application integrations and analytics cluster assertions passed",
);
