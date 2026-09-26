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
      "src/renderer/app-shared/runtime/appgen-interaction-page.ts",
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const interactionPage = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

const expected = {
  CODEX_APPGEN_INTERACTION_PAGE_UNSPECIFIED:
    "CODEX_APPGEN_INTERACTION_PAGE_UNSPECIFIED",
  CODEX_APPGEN_INTERACTION_PAGE_ANALYTICS:
    "CODEX_APPGEN_INTERACTION_PAGE_ANALYTICS",
  CODEX_APPGEN_INTERACTION_PAGE_SETTINGS:
    "CODEX_APPGEN_INTERACTION_PAGE_SETTINGS",
  CODEX_APPGEN_INTERACTION_PAGE_DATABASE:
    "CODEX_APPGEN_INTERACTION_PAGE_DATABASE",
  UNRECOGNIZED: "UNRECOGNIZED",
};

let assertions = 0;
assert.deepEqual(
  interactionPage.APPGEN_INTERACTION_PAGES,
  expected,
  "restores every AppGen interaction page",
);
assertions += 1;
assert.equal(
  interactionPage.appgenInteractionPages,
  interactionPage.APPGEN_INTERACTION_PAGES,
  "semantic export preserves the enum object identity",
);
assertions += 1;
assert.equal(
  Object.keys(interactionPage.appgenInteractionPages).length,
  5,
  "does not add undocumented interaction pages",
);
assertions += 1;

console.log(
  `app-shared AppGen interaction page behavior: ${assertions}/${assertions} assertions passed`,
);
