import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/runtime/service-tiers.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const serviceTiers = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function same(actual, expected, message) {
  assert.equal(actual, expected, message);
  assertions += 1;
}

same(serviceTiers.PRIORITY_SERVICE_TIER, "priority", "restores priority id");
same(serviceTiers.FAST_SERVICE_TIER, "fast", "restores fast id");
same(
  serviceTiers.classifyServiceTier("priority", "Standard"),
  "fast",
  "classifies the priority id as fast",
);
same(
  serviceTiers.classifyServiceTier("custom-fast", " FAST "),
  "fast",
  "classifies a normalized fast name",
);
same(
  serviceTiers.classifyServiceTier("ultrafast", "Turbo"),
  "ultrafast",
  "classifies the ultrafast id",
);
same(
  serviceTiers.classifyServiceTier("custom-ultra", " UltraFast "),
  "ultrafast",
  "classifies a normalized ultrafast name",
);
same(
  serviceTiers.classifyServiceTier("standard", "Standard"),
  null,
  "rejects an unrelated tier",
);

const priority = { id: "priority-v2", name: "Priority", credits: 2 };
const model = {
  defaultServiceTier: "fast",
  serviceTiers: [
    { id: "standard", name: "Standard" },
    priority,
    { id: "ultrafast", name: "UltraFast" },
  ],
};
same(
  serviceTiers.findFastServiceTier(model),
  priority,
  "finds a priority-named fast tier",
);
same(
  serviceTiers.findFastServiceTier(undefined),
  null,
  "handles a missing model",
);
same(serviceTiers.supportsServiceTier(model, "fast"), true, "supports fast alias");
same(
  serviceTiers.supportsServiceTier(model, "ultrafast"),
  true,
  "supports an exact id",
);
same(serviceTiers.supportsServiceTier(model, "missing"), false, "rejects missing id");
same(
  serviceTiers.resolveServiceTierId(model, "fast"),
  "priority-v2",
  "resolves the fast alias to its concrete id",
);
same(
  serviceTiers.resolveSelectedServiceTier(model, null),
  "priority-v2",
  "resolves the model default",
);
same(
  serviceTiers.resolveSelectedServiceTier(model, "default"),
  null,
  "maps the explicit default selection to null",
);
same(
  serviceTiers.resolveSelectedServiceTier(model, "ultrafast"),
  "ultrafast",
  "preserves an explicit selection",
);
same(
  serviceTiers.resolveSelectedServiceTier(model, "ultrafast", false),
  null,
  "disables the service-tier selection",
);
same(serviceTiers.initializeServiceTiers(), undefined, "initializes service tiers");

console.log(
  `app-shared service tier behavior: ${assertions}/${assertions} assertions passed`,
);
