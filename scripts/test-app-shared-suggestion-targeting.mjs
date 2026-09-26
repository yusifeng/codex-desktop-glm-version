import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outfile = path.join(
  ROOT,
  "node_modules/.cache/suggestion-targeting-test.mjs",
);
await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/suggestion-targeting.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  outfile,
  logLevel: "silent",
});
const targeting = await import(
  `${new URL(`file://${outfile}`).href}?v=${Date.now()}`
);

const cases = [
  [{ selectedModel: "gpt-rosalind-preview" }, true, "preview slug"],
  [{ selectedModel: "gpt-rosalind-5-5" }, true, "versioned slug"],
  [{ selectedModel: "heisenberg" }, true, "internal alias"],
  [{ selectedModel: "HEISENBERG" }, true, "case normalization"],
  [{ selectedModel: "  Heisenberg  " }, true, "whitespace normalization"],
  [{ selectedModel: "GPT Rosalind Preview" }, true, "separator normalization"],
  [{ selectedModel: "openai/rosalind-experimental" }, true, "raw Rosalind match"],
  [
    { selectedModelDisplayName: "Rosalind Science" },
    true,
    "display name match",
  ],
  [
    { selectedModel: "gpt-5", selectedModelDisplayName: "Heisenberg" },
    true,
    "display name fallback",
  ],
  [{ selectedModel: "gpt-5.6-sol" }, false, "ordinary model"],
  [{ selectedModel: "gpt-heisenberg-preview" }, false, "nonexact alias"],
  [{ selectedModel: "ros-alind" }, false, "split name"],
  [{ selectedModel: "" }, false, "empty model"],
  [{ selectedModel: null }, false, "null model"],
  [{}, false, "missing selection"],
];

let assertions = 0;
for (const [selection, expected, label] of cases) {
  assert.equal(
    targeting.isScienceSuggestionModel(selection),
    expected,
    `detects ${label}`,
  );
  assertions += 1;
  assert.equal(
    targeting.getSuggestionTarget(selection),
    expected ? "science" : null,
    `targets ${label}`,
  );
  assertions += 1;
}
assert.equal(
  targeting.initializeSuggestionTargeting(),
  undefined,
  "keeps initialization idempotent",
);
assertions += 1;

console.log(
  `app-shared suggestion targeting behavior: ${assertions}/${assertions} assertions passed`,
);
