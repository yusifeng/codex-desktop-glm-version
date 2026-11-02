import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { classifyHub } from "./audit-renderer-hub-classification.mjs";
import {
  EXACT_ROUTE_SOURCE_OWNERS,
  PRESERVED_ROUTE_SOURCE_OUTPUTS,
  collectConversationRouteClosure,
} from "./renderer-route-recovery.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
let assertions = 0;
const equal = (actual, expected) => {
  assertions += 1;
  assert.deepEqual(actual, expected);
};

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

const runtimeSourceRoots = [
  "src/main",
  "src/main-recovered",
  "src/renderer",
  "src/renderer-preserved",
  "src/renderer-recovered",
  "src/webview",
];
const rawJavaScriptSources = runtimeSourceRoots.flatMap((root) =>
  walk(path.join(ROOT, root)).filter((file) => /\.(?:c|m)?js$/.test(file)),
);
equal(rawJavaScriptSources, []);

const conversationDirectory = path.join(ROOT, "src/renderer-recovered/conversation-route");
const conversationManifest = JSON.parse(
  fs.readFileSync(path.join(conversationDirectory, "manifest.json"), "utf8"),
);
equal(conversationManifest, { format: 1, moduleCount: 0, modules: [] });
equal([...(await collectConversationRouteClosure(conversationDirectory))], []);
equal(EXACT_ROUTE_SOURCE_OWNERS.size, 0);

const preservedDirectory = path.join(ROOT, "src/renderer-preserved/route-runtime");
const preservedManifest = JSON.parse(
  fs.readFileSync(path.join(preservedDirectory, "manifest.json"), "utf8"),
);
equal(preservedManifest.moduleCount, 33);
equal(new Set(preservedManifest.outputs), PRESERVED_ROUTE_SOURCE_OUTPUTS);
equal(
  preservedManifest.outputs.filter(
    (output) => !fs.existsSync(path.join(preservedDirectory, output.replace(/\.js$/, ".ts"))),
  ),
  [],
);

const classifications = JSON.parse(
  fs.readFileSync(path.join(ROOT, "docs/renderer-hub-line-classification.json"), "utf8"),
);
for (const hub of ["app-shared", "app-initial", "app-primary"]) {
  const semanticAliases = new Set(
    classifications
      .filter((entry) => entry.hub === hub && entry.classification === "semantic-business-logic")
      .map((entry) => entry.alias),
  );
  const semanticConsumers = classifyHub(hub).consumedAliases.filter((alias) => semanticAliases.has(alias));
  equal(semanticConsumers, []);
}

console.log(`completion runtime source boundary: ${assertions} assertions passed`);
