import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/sandbox-url.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const sandbox = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

equal(sandbox.getSandboxResourceUri(null), null, "rejects absent metadata");
equal(
  sandbox.getSandboxResourceUri({
    ui: { resourceUri: "ui://nested" },
    "ui/resourceUri": "ui://flat",
    "openai/outputTemplate": "ui://legacy",
  }),
  "ui://nested",
  "prefers nested UI resource metadata",
);
equal(
  sandbox.getSandboxResourceUri({ "ui/resourceUri": "ui://flat" }),
  "ui://flat",
  "reads flat UI resource metadata",
);
equal(
  sandbox.getSandboxResourceUri({ "openai/outputTemplate": "ui://legacy" }),
  "ui://legacy",
  "falls back to legacy output templates",
);
equal(
  sandbox.getSandboxResourceUri({ ui: { resourceUri: 1 } }),
  null,
  "rejects invalid known metadata fields",
);

equal(
  sandbox.areSandboxMethodsAllowed([...sandbox.requiredSandboxMethods]),
  true,
  "accepts the complete required method set",
);
equal(
  sandbox.areSandboxMethodsAllowed([
    ...sandbox.requiredSandboxMethods,
    ...sandbox.optionalSandboxMethods,
  ]),
  true,
  "accepts supported optional methods",
);
equal(
  sandbox.areSandboxMethodsAllowed(sandbox.requiredSandboxMethods.slice(1)),
  false,
  "rejects missing required methods",
);
equal(
  sandbox.areSandboxMethodsAllowed([
    ...sandbox.requiredSandboxMethods,
    sandbox.requiredSandboxMethods[0],
  ]),
  false,
  "rejects duplicate methods",
);
equal(
  sandbox.areSandboxMethodsAllowed([
    ...sandbox.requiredSandboxMethods,
    "unknown",
  ]),
  false,
  "rejects unknown methods",
);

const entryUrl = sandbox.createSandboxEntryUrl({
  locale: "zh-CN",
  subdomain: "wallet",
});
const parsedEntry = new URL(entryUrl);
equal(
  parsedEntry.origin,
  "https://wallet.web-sandbox.oaiusercontent.com",
  "builds the sandbox host",
);
equal(
  parsedEntry.searchParams.get("app"),
  "skybridge",
  "selects Skybridge mode",
);
equal(parsedEntry.searchParams.get("locale"), "zh-CN", "includes the locale");
equal(
  parsedEntry.searchParams.get("deviceType"),
  "desktop",
  "selects desktop mode",
);
equal(
  parsedEntry.searchParams.get("backgroundMode"),
  "transparent",
  "selects transparent mode",
);

const initializedUrl = sandbox.attachSandboxInitialization({
  initId: "init_123",
  sandboxId: "sandbox-456",
  sourceUrl: `${entryUrl}#old=value`,
});
equal(
  sandbox.getSandboxInitId(initializedUrl),
  "init_123",
  "round-trips initialization IDs",
);
equal(
  new URL(initializedUrl).hash.includes("sandboxId=sandbox-456"),
  true,
  "includes the sandbox ID",
);
equal(
  new URL(initializedUrl).hash.includes("old=value"),
  false,
  "replaces stale fragments",
);
equal(
  sandbox.getSandboxInitId("https://example.com/#initId=has%20space"),
  null,
  "rejects invalid initialization IDs",
);
equal(
  sandbox.getSandboxInitId("not a URL"),
  null,
  "rejects malformed initialization URLs",
);

equal(
  sandbox.parseSandboxResourceActivities(null),
  { status: "absent" },
  "reports absent metadata",
);
equal(
  sandbox.parseSandboxResourceActivities({ unrelated: true }),
  { status: "absent" },
  "reports a missing activities field",
);
const validActivities = sandbox.parseSandboxResourceActivities({
  "openai/resourceActivities": {
    version: 1,
    resources: [
      {
        id: "report",
        url: "https://example.com:8443/report.pdf",
        title: "Report",
        mimeType: "application/pdf",
        activities: ["read", "updated"],
        ignored: true,
      },
    ],
    ignored: true,
  },
});
equal(validActivities.status, "valid", "accepts valid resource activities");
equal(
  validActivities.resources[0],
  {
    id: "report",
    url: "https://example.com:8443/report.pdf",
    title: "Report",
    mimeType: "application/pdf",
    activities: ["read", "updated"],
  },
  "normalizes resource activity records",
);

for (const [metadata, message] of [
  [{ "openai/resourceActivities": null }, "rejects null activity metadata"],
  [
    { "openai/resourceActivities": { version: 2, resources: [] } },
    "rejects unsupported versions",
  ],
  [
    { "openai/resourceActivities": { version: 1, resources: {} } },
    "requires a resources array",
  ],
  [
    {
      "openai/resourceActivities": {
        version: 1,
        resources: [
          { id: "", url: "https://example.com", activities: ["read"] },
        ],
      },
    },
    "requires resource IDs",
  ],
  [
    {
      "openai/resourceActivities": {
        version: 1,
        resources: [
          { id: "x", url: "ftp://example.com", activities: ["read"] },
        ],
      },
    },
    "requires HTTP resource URLs",
  ],
  [
    {
      "openai/resourceActivities": {
        version: 1,
        resources: [
          { id: "x", url: "https://user@example.com", activities: ["read"] },
        ],
      },
    },
    "rejects credentialed resource URLs",
  ],
  [
    {
      "openai/resourceActivities": {
        version: 1,
        resources: [{ id: "x", url: "https://example.com", activities: [] }],
      },
    },
    "requires at least one activity",
  ],
  [
    {
      "openai/resourceActivities": {
        version: 1,
        resources: [
          { id: "x", url: "https://example.com", activities: ["deleted"] },
        ],
      },
    },
    "rejects unknown activities",
  ],
]) {
  equal(
    sandbox.parseSandboxResourceActivities(metadata),
    { status: "invalid" },
    message,
  );
}

console.log(
  `app-shared sandbox metadata behavior: ${assertions}/${assertions} assertions passed`,
);
