import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "chatgpt-accent-messages",
  "security-messages",
  "local-conversation-external-resources",
  "local-conversation-summary-panel-sources-model",
];

const state = (globalThis.__conversationSourceModelTest = { initialized: [] });

const importedNamesByModule = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(
    path.join(ROOT, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  for (const match of source.matchAll(
    /import\s*{([^;]*?)}\s*from\s*"@rchunk\/([^"]+)";/g,
  )) {
    const names = importedNamesByModule.get(match[2]) ?? new Set();
    for (const specifier of match[1].split(",")) {
      const name = specifier.trim().split(/\s+as\s+/)[0];
      if (name && !name.startsWith("type ")) names.add(name);
    }
    importedNamesByModule.set(match[2], names);
  }
}

const overrides = {
  "app-shared": {
    G2: `messages => messages`,
    II: `value => String(value).split("/").at(-1) ?? ""`,
    K2: `() => globalThis.__conversationSourceModelTest.initialized.push("intl")`,
    RH: `value => value`,
    RI: `() => globalThis.__conversationSourceModelTest.initialized.push("attachments")`,
    eU: `id => "app:" + id`,
    hq: `server => server === "web"`,
    wL: `() => globalThis.__conversationSourceModelTest.initialized.push("utilities")`,
  },
  "app-initial": {
    Brn: `name => "Server " + name`,
    Drn: `() => {}`,
    Ern: `({ appContext, apps }) => apps.find(app => app.id === appContext?.connectorId) ?? null`,
    F9t: `value => value`,
    Gdt: `() => {}`,
    I9t: `() => {}`,
    M9t: `value => value`,
    M_n: `() => {}`,
    N9t: `() => {}`,
    P9t: `() => false`,
    P_n: `() => {}`,
    Vrn: `() => {}`,
    Wdt: `server => server.logoUrl == null ? null : server`,
    ZGt: `({ url }) => { try { return { url: new URL(url).href }; } catch { return null; } }`,
    _hn: `content => content.filter(item => item.type === "attachment")`,
    dmn: `({ attachments }) => attachments`,
    fmn: `() => {}`,
    fnn: `() => {}`,
    hmn: `() => {}`,
    j9t: `() => "read"`,
    mmn: `attachment => attachment.path ?? attachment.fsPath ?? attachment.label`,
    non: `value => value`,
    pnn: `(turn, call) => ({ completed: call.status === "completed", id: call.id, turn })`,
    ton: `() => {}`,
    vhn: `() => {}`,
    w$t: `items => items`,
    wrn: `() => {}`,
    yrn: `"computer-use"`,
  },
  "mcp-app-analytics": {
    t: `app => app?.distributionChannel === "DEFAULT_OAI_CATALOG" ? app.name : undefined`,
  },
  "mcp-tool-activity-label": {
    i: `() => {}`,
    t: `({ completed, toolName }) => (completed ? "Used " : "Using ") + toolName`,
  },
  "local-conversation-external-resources": {
    r: `() => {}`,
    t: `value => { try { const url = new URL(value); url.hash = ""; return "url:" + url.href; } catch { return null; } }`,
  },
};

function generic(chunk, name) {
  return `(...args) => { globalThis.__conversationSourceModelTest.initialized.push(${JSON.stringify(`${chunk}:${name}`)}); return undefined; }`;
}

function mockChunk(name) {
  if (name === "rolldown-runtime")
    return "export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};";
  const names = importedNamesByModule.get(name) ?? new Set();
  return [...names]
    .map(
      (exportName) =>
        `export const ${exportName} = ${overrides[name]?.[exportName] ?? generic(name, exportName)};`,
    )
    .join("\n");
}

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
        name: "conversation-source-model-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice("@rchunk/".length),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: importPath }) => ({
              contents: mockChunk(importPath),
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

const accent = await bundle("chatgpt-accent-messages");
assert.equal(accent.n.blue.defaultMessage, "Blue");
assert.equal(
  accent.n.lightCustom.id,
  "settings.appearance.chatGptAccent.lightCustom",
);
assert.equal(
  accent.a.CHATGPT_FAMILY_TEEN_ONBOARDING_STEP_WELLBEING.endsWith("WELLBEING"),
  true,
);
assert.equal(
  accent.r.CHATGPT_FAMILY_TEEN_ONBOARDING_ACTION_VERIFY_AGE_CLICKED.endsWith(
    "VERIFY_AGE_CLICKED",
  ),
  true,
);
assert.equal(accent.i.$type.includes("ActionTaken"), true);
accent.t();
assert.equal(state.initialized.includes("intl"), true);

const security = await bundle("security-messages");
assert.equal(security.t.title.defaultMessage, "Security history");
assert.equal(
  security.t.description.id,
  "chatgpt.settings.security.history.description",
);
security.n();
assert.equal(state.initialized.filter((value) => value === "intl").length, 2);

const external = await bundle("local-conversation-external-resources");
assert.equal(external.t("bad url"), null);
assert.equal(
  external.t("https://docs.google.com/document/d/doc-1/edit#heading"),
  "google:document:doc-1",
);
assert.equal(
  external.t("https://linear.app/acme/issue/ABC-1"),
  "linear:acme:issue:abc-1",
);
assert.equal(
  external.t("https://example.com/path/#anchor"),
  "url:https://example.com/path",
);
const resources = external.n([
  {
    items: [
      {
        type: "userMessage",
        content: [
          {
            type: "text",
            text: "[Spec](https://docs.google.com/document/d/doc-1/edit) and https://linear.app/acme/issue/ABC-1",
          },
        ],
      },
      {
        type: "webSearch",
        action: { type: "openPage", url: "https://example.com/read" },
      },
    ],
    params: { input: [] },
  },
]);
assert.equal(resources.length, 3);
assert.equal(resources[0].title, "example.com/read");
assert.equal(resources[0].activities[0], "read");
assert.equal(resources[1].title, "Spec");
assert.equal(resources[1].provider.name, "Google Drive");
assert.equal(resources[2].provider.name, "Linear");
assert.equal(external.a(resources[0]), true);
assert.equal(external.i(resources[0]), false);
const written = external.n(
  [
    {
      items: [
        {
          type: "mcpToolCall",
          id: "call-1",
          status: "completed",
          error: null,
          server: "drive",
          tool: "create",
          pluginId: "drive-plugin",
          result: {
            _meta: {
              status: "present",
              resources: [
                {
                  activities: ["created"],
                  url: "https://example.com/new",
                  title: "New",
                },
              ],
            },
          },
        },
      ],
      params: { input: [] },
    },
  ],
  [{ id: "drive-plugin", name: "Drive", logoUrl: null, logoUrlDark: null }],
);
assert.equal(written.length, 1);
assert.equal(written[0].openInitiator, "mcp_app_resource");
assert.equal(external.i(written[0]), true);

const summary = await bundle("local-conversation-summary-panel-sources-model");
const turns = [
  {
    items: [
      {
        type: "userMessage",
        attachments: [{ label: "report", path: "/tmp/report.pdf" }],
        content: [{ type: "localImage", path: "/tmp/chart.png" }],
      },
      {
        type: "webSearch",
        query: "ignored",
        action: { type: "search", queries: ["alpha", "alpha", "beta"] },
      },
      {
        type: "webSearch",
        query: "ignored",
        action: { type: "openPage", url: "https://example.com/read" },
      },
    ],
    params: {
      attachments: [{ label: "report", path: "/tmp/report.pdf" }],
      input: [],
    },
  },
];
const files = summary.t(turns);
assert.equal(files.length, 2);
assert.equal(files[0].path, "/tmp/report.pdf");
assert.equal(files[1].path, "/tmp/chart.png");
const webSearch = summary.r(turns);
assert.equal(webSearch.queryCount, 3);
assert.deepEqual(webSearch.queries, ["alpha", "beta"]);
assert.equal(webSearch.viewedLinks[0].url, "https://example.com/read");
assert.equal(summary.r([{ items: [], params: { input: [] } }]), null);
const reconciled = summary.i(
  [
    {
      key: "url:https://example.com/read",
      provider: null,
      activities: ["read"],
    },
    {
      key: "provider:drive:1",
      provider: { id: "drive" },
      activities: ["read"],
    },
  ],
  webSearch,
);
assert.equal(reconciled.externalSources.length, 1);
assert.equal(reconciled.externalSources[0].key, "provider:drive:1");
assert.equal(reconciled.webSearchSource.viewedLinks.length, 1);
const toolSources = summary.n(
  [
    {
      items: [
        {
          type: "mcpToolCall",
          id: "1",
          status: "completed",
          server: "github",
          tool: "search",
        },
        {
          type: "mcpToolCall",
          id: "2",
          status: "completed",
          server: "github",
          tool: "search",
        },
        {
          type: "mcpToolCall",
          id: "3",
          status: "completed",
          server: "web",
          tool: "search",
        },
      ],
      params: { input: [] },
    },
  ],
  [],
  {},
  new Set(["app:1"]),
  {
    data: [
      {
        name: "github",
        serverInfo: { name: "github", title: "GitHub MCP", logoUrl: "logo" },
      },
    ],
  },
  new Set(),
);
assert.equal(toolSources.length, 1);
assert.equal(toolSources[0].name, "GitHub MCP");
assert.equal(toolSources[0].activities.length, 1);
assert.equal(toolSources[0].activities[0].calls.length, 2);
assert.equal(toolSources[0].mcpAppId, "app:1");
summary.a();
assert.equal(state.initialized.includes("attachments"), true);

console.log("conversation source model cluster assertions passed");
