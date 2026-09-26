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
      "src/renderer/app-shared/runtime/appgen-interaction-action.ts",
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const interactionAction = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

const expected = {
  CODEX_APPGEN_INTERACTION_ACTION_UNSPECIFIED:
    "CODEX_APPGEN_INTERACTION_ACTION_UNSPECIFIED",
  CODEX_APPGEN_INTERACTION_ACTION_CREATE_SITE_CLICKED:
    "CODEX_APPGEN_INTERACTION_ACTION_CREATE_SITE_CLICKED",
  CODEX_APPGEN_INTERACTION_ACTION_EDIT_WITH_CHAT_CLICKED:
    "CODEX_APPGEN_INTERACTION_ACTION_EDIT_WITH_CHAT_CLICKED",
  CODEX_APPGEN_INTERACTION_ACTION_ANALYTICS_OPENED:
    "CODEX_APPGEN_INTERACTION_ACTION_ANALYTICS_OPENED",
  CODEX_APPGEN_INTERACTION_ACTION_SETTINGS_OPENED:
    "CODEX_APPGEN_INTERACTION_ACTION_SETTINGS_OPENED",
  CODEX_APPGEN_INTERACTION_ACTION_PAGE_VIEWED:
    "CODEX_APPGEN_INTERACTION_ACTION_PAGE_VIEWED",
  CODEX_APPGEN_INTERACTION_ACTION_MENTION_SUGGESTIONS_LOADED:
    "CODEX_APPGEN_INTERACTION_ACTION_MENTION_SUGGESTIONS_LOADED",
  UNRECOGNIZED: "UNRECOGNIZED",
};

let assertions = 0;
assert.deepEqual(
  interactionAction.APPGEN_INTERACTION_ACTIONS,
  expected,
  "restores every AppGen interaction action",
);
assertions += 1;
assert.equal(
  interactionAction.appgenInteractionActions,
  interactionAction.APPGEN_INTERACTION_ACTIONS,
  "semantic export preserves the enum object identity",
);
assertions += 1;
assert.equal(
  Object.keys(interactionAction.appgenInteractionActions).length,
  8,
  "does not add undocumented interaction actions",
);
assertions += 1;

console.log(
  `app-shared AppGen interaction action behavior: ${assertions}/${assertions} assertions passed`,
);
