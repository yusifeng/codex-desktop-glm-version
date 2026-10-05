import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

const result = await esbuild.build({
  entryPoints: ["src/renderer/app-primary/runtime/account-spend-key.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  logLevel: "silent",
});
const { accountSpendKey } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

assert.equal(accountSpendKey({ account_id: "acct", spend_control: { individual_limit: { limit: 5, reset_at: 0 } } }), "acct:5:1970-01-01");
assert.equal(accountSpendKey({ account_id: "acct", spend_control: { individual_limit: { limit: 5 } } }), null);
assert.equal(accountSpendKey(null), null);
assert.equal(accountSpendKey({ account_id: 0, spend_control: { individual_limit: { limit: 0, reset_at: 1 } } }), "0:0:1970-01-01");
console.log("test-app-primary-account-spend-key: 4 assertions passed");
