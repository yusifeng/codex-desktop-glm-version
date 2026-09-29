import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  ROOT,
  "src/renderer/pca-connector-action-entry/index.ts",
);
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set(
  [...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map(
    (match) => match[1],
  ),
);

assert.deepEqual([...dependencies], ["pca-connector-action"]);
assert.doesNotMatch(source, /import\s*\(/);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(source, /\bpcaConnectorActionChunk\s*\./);

const state = (globalThis.__pcaConnectorActionEntryTest = {
  calls: [],
  error: null,
  initializations: 0,
  result: true,
  resume: null,
});

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "pca-connector-action-entry-mock",
      setup(build) {
        build.onResolve(
          { filter: /^@rchunk\/pca-connector-action$/ },
          () => ({ path: "pca-connector-action", namespace: "mock" }),
        );
        build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
          loader: "js",
          contents: `
            const state = globalThis.__pcaConnectorActionEntryTest;
            export const n = () => { state.initializations += 1; };
            export const r = async (scope, resumeTarget) => {
              state.calls.push({ scope, resumeTarget });
              if (state.error !== null) throw state.error;
              return state.result;
            };
            state.resume = r;
          `,
        }));
      },
    },
  ],
});

const module = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 4;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

check(
  Object.keys(module).join(",") ===
    "resumeChatGptPcaConnectorBeaconAction",
  "preserves the sole public export",
);
check(state.initializations === 1, "initializes the PCA action exactly once");
check(
  module.resumeChatGptPcaConnectorBeaconAction === state.resume,
  "re-exports the underlying resume action without wrapping it",
);

const scope = { activeLinks: async () => true };
const resumeTarget = {
  capturedLeafId: "leaf-1",
  capturedPromptId: "prompt-1",
  connectorId: "connector-1",
  kind: "chatgpt-pca-beacon",
  serverConversationId: "conversation-1",
  triggerTurnAfterLink: true,
};
check(
  (await module.resumeChatGptPcaConnectorBeaconAction(scope, resumeTarget)) ===
    true,
  "returns the core resume result unchanged",
);
check(state.calls[0].scope === scope, "forwards the action scope by identity");
check(
  state.calls[0].resumeTarget === resumeTarget,
  "forwards the resume target by identity",
);

state.result = false;
check(
  (await module.resumeChatGptPcaConnectorBeaconAction(scope, null)) === false,
  "preserves a declined resume result",
);
check(state.initializations === 1, "does not reinitialize on action calls");

const failure = new Error("resume failed");
state.error = failure;
await assert.rejects(
  module.resumeChatGptPcaConnectorBeaconAction(scope, resumeTarget),
  (error) => error === failure,
);
assertions += 1;
check(state.calls.length === 3, "delegates every attempted resume");

console.log(`${assertions} PCA connector action entry assertions passed`);
