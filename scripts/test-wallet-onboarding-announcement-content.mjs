import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function bundle(entry) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, entry)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
}

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const htmlModule = await bundle(
  "src/renderer/wallet-onboarding-announcement-content/wallet-enrollment-html.ts",
);
const html = htmlModule.buildWalletEnrollmentHtml(
  { title: "Add <card>", submit: "Add card" },
  { styleVariables: { "--color": "<red>" }, theme: "dark" },
);
check(html.startsWith("<!doctype html>"), "builds a standalone enrollment document");
check(
  html.includes("https://js.verygoodvault.com/vgs-collect/3.2.2/vgs-collect.js"),
  "pins the official VGS Collect SDK",
);
check(
  html.includes("__wallet_onboarding_register_vgs_card"),
  "keeps the registration tool bridge",
);
check(
  html.includes("__wallet_onboarding_request_verification") &&
    html.includes("__wallet_onboarding_verify_card"),
  "keeps verification tool bridges",
);
check(
  html.includes("__wallet_onboarding_finalize_card"),
  "keeps the finalization tool bridge",
);
check(
  html.includes('addEventListener("openai:set_globals"'),
  "resynchronizes host globals",
);
check(
  html.includes("form.createCard"),
  "vaults card fields through VGS rather than the host page",
);
check(
  html.includes("Add \\u003ccard>") && html.includes("\\u003cred>"),
  "escapes injected message and style JSON",
);

assertions += assertReleaseOwner("wallet-onboarding-announcement-content");
console.log(`${assertions} Wallet onboarding content assertions passed`);
