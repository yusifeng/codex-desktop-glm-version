import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const source = fs.readFileSync(
  new URL("../src/main/main-app/threads/automation-detector.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "@chunk/shared")
      return {
        Wu: (version, feature) => feature === "threadTimeline" && version === "supported",
        fd: () => null,
      };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);
const { hasCanonicalVoiceHistory } = module.exports;
equal(hasCanonicalVoiceHistory({ forkedFromId: null, historyMode: "paginated", cliVersion: "supported" }), true);
equal(hasCanonicalVoiceHistory({ forkedFromId: "parent", historyMode: "paginated", cliVersion: "supported" }), false);
equal(hasCanonicalVoiceHistory({ forkedFromId: null, historyMode: "legacy", cliVersion: "supported" }), false);
equal(hasCanonicalVoiceHistory({ forkedFromId: null, historyMode: "paginated", cliVersion: "0.0.0" }), false);
equal(hasCanonicalVoiceHistory({ forkedFromId: null, historyMode: "paginated", cliVersion: "old" }), false);

const creation = fs.readFileSync(
  new URL("../src/main/main-app/conversation/conversation-creation.ts", import.meta.url),
  "utf8",
);
equal(creation.includes('import { hasCanonicalVoiceHistory as isCanonicalVoiceHistory } from "../threads/automation-detector"'), true);
equal(creation.includes("(projectionModule as any).isCanonicalVoiceHistory"), false);
equal(creation.includes("canonicalVoiceHistory: isCanonicalVoiceHistory(response.thread)"), true);

const hydration = fs.readFileSync(
  new URL("../src/main/main-app/threads/hydration.ts", import.meta.url),
  "utf8",
);
equal(hydration.includes('import { hasCanonicalVoiceHistory as hasCanonicalVoice } from "./automation-detector"'), true);
equal(hydration.includes("export function hasCanonicalVoice("), false);
equal(hydration.includes("export { hasCanonicalVoice };"), true);

const projection = fs.readFileSync(
  new URL("../src/main/main-app/threads/projection.ts", import.meta.url),
  "utf8",
);
equal(projection.includes('export { hasCanonicalVoiceHistory } from "./automation-detector"'), true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('const { hasCanonicalVoiceHistory: q_ } = require("./main-app/threads/automation-detector.js")'), true);
equal(main.includes("function q_("), false);

console.log(`${assertions} main canonical voice history owner assertions passed`);
