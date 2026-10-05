import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

const result = await esbuild.build({
  entryPoints: ["src/renderer/app-primary/runtime/is-displayable-action.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  logLevel: "silent",
});
const { isDisplayableAction } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

assert.equal(isDisplayableAction({ type: "primary", action_v2: { action_enum: "copy_to_clipboard" } }), true);
assert.equal(isDisplayableAction({ type: "secondary", action_v2: { action_enum: "open_link" } }), true);
assert.equal(isDisplayableAction({ type: "primary", action_v2: { action_enum: "submit_personalized_information_questionnaire_feedback" } }), false);
assert.equal(isDisplayableAction({ type: "tertiary", action_v2: { action_enum: "open_link" } }), false);
assert.equal(isDisplayableAction({ type: "primary", action_v2: {} }), true);
console.log("test-app-primary-is-displayable-action: 5 assertions passed");
