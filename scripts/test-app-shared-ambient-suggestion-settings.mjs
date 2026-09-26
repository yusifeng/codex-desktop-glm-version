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
      "src/renderer/app-shared/runtime/ambient-suggestion-settings.ts",
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const settings = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

const enabled = settings.ambientSuggestionSettings.enabled;
equal(Object.keys(settings.ambientSuggestionSettings), ["enabled"], "defines only the enabled setting");
equal(enabled.agentAccess, "read-write", "allows agent reads and writes");
equal(enabled.default, true, "enables ambient suggestions by default");
equal(enabled.description, "Whether home-page ambient suggestions are enabled", "keeps the setting description");
equal(enabled.key, "ambient-suggestions-enabled", "uses the persisted setting key");
equal(
  enabled.hostStorage,
  { kind: "global-state", key: "ambient-suggestions-enabled" },
  "stores the value in global state",
);
equal(enabled.schema.safeParse(true).success, true, "accepts true");
equal(enabled.schema.safeParse(false).success, true, "accepts false");
equal(enabled.schema.safeParse("true").success, false, "rejects string booleans");
equal(enabled.schema.safeParse(null).success, false, "rejects null");
equal(
  settings.initializeAmbientSuggestionSettings(),
  undefined,
  "initializes ambient suggestion settings",
);

console.log(
  `app-shared ambient suggestion settings behavior: ${assertions}/${assertions} assertions passed`,
);
