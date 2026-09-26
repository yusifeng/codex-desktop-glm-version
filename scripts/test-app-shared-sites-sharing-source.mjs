import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/sites-sharing-source.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const sharingSource = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

const expected = {
  CODEX_SITES_SHARING_SOURCE_UNSPECIFIED:
    "CODEX_SITES_SHARING_SOURCE_UNSPECIFIED",
  CODEX_SITES_SHARING_SOURCE_LIBRARY: "CODEX_SITES_SHARING_SOURCE_LIBRARY",
  CODEX_SITES_SHARING_SOURCE_LIBRARY_ACCESS_BADGE:
    "CODEX_SITES_SHARING_SOURCE_LIBRARY_ACCESS_BADGE",
  CODEX_SITES_SHARING_SOURCE_SITES: "CODEX_SITES_SHARING_SOURCE_SITES",
  CODEX_SITES_SHARING_SOURCE_SITES_ACCESS_BADGE:
    "CODEX_SITES_SHARING_SOURCE_SITES_ACCESS_BADGE",
  CODEX_SITES_SHARING_SOURCE_SETTINGS: "CODEX_SITES_SHARING_SOURCE_SETTINGS",
  CODEX_SITES_SHARING_SOURCE_CONVERSATION_RESOURCE:
    "CODEX_SITES_SHARING_SOURCE_CONVERSATION_RESOURCE",
  CODEX_SITES_SHARING_SOURCE_IN_APP_BROWSER:
    "CODEX_SITES_SHARING_SOURCE_IN_APP_BROWSER",
  UNRECOGNIZED: "UNRECOGNIZED",
};

let assertions = 0;
assert.deepEqual(
  sharingSource.SITES_SHARING_SOURCES,
  expected,
  "restores every Sites sharing source",
);
assertions += 1;
assert.equal(
  sharingSource.sitesSharingSources,
  sharingSource.SITES_SHARING_SOURCES,
  "semantic export preserves the enum object identity",
);
assertions += 1;
assert.equal(
  Object.keys(sharingSource.sitesSharingSources).length,
  9,
  "does not add undocumented sharing sources",
);
assertions += 1;

console.log(
  `app-shared Sites sharing source behavior: ${assertions}/${assertions} assertions passed`,
);
