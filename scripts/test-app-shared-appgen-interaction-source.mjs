import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(
      ROOT,
      "src/renderer/app-shared/runtime/appgen-interaction-source.ts",
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const interactionSource = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

const expected = {
  CODEX_APPGEN_INTERACTION_SOURCE_UNSPECIFIED:
    "CODEX_APPGEN_INTERACTION_SOURCE_UNSPECIFIED",
  CODEX_APPGEN_INTERACTION_SOURCE_SITES:
    "CODEX_APPGEN_INTERACTION_SOURCE_SITES",
  CODEX_APPGEN_INTERACTION_SOURCE_LIBRARY:
    "CODEX_APPGEN_INTERACTION_SOURCE_LIBRARY",
  CODEX_APPGEN_INTERACTION_SOURCE_SITE_DETAILS:
    "CODEX_APPGEN_INTERACTION_SOURCE_SITE_DETAILS",
  CODEX_APPGEN_INTERACTION_SOURCE_AT_MENTION:
    "CODEX_APPGEN_INTERACTION_SOURCE_AT_MENTION",
  CODEX_APPGEN_INTERACTION_SOURCE_RESPONSE_CARD:
    "CODEX_APPGEN_INTERACTION_SOURCE_RESPONSE_CARD",
  UNRECOGNIZED: "UNRECOGNIZED",
};

let assertions = 0;
assert.deepEqual(
  interactionSource.APPGEN_INTERACTION_SOURCES,
  expected,
  "restores every AppGen interaction source",
);
assertions += 1;
assert.equal(
  interactionSource.appgenInteractionSources,
  interactionSource.APPGEN_INTERACTION_SOURCES,
  "semantic export preserves the enum object identity",
);
assertions += 1;
assert.equal(
  Object.keys(interactionSource.appgenInteractionSources).length,
  7,
  "does not add undocumented interaction sources",
);
assertions += 1;

console.log(
  `app-shared AppGen interaction source behavior: ${assertions}/${assertions} assertions passed`,
);
