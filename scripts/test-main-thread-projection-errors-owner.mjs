import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
async function load(path, stubs) {
  const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
  const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const module = { exports: {} };
  Function("require", "module", "exports", transpiled.code)(
    (specifier) => {
      if (specifier in stubs) return stubs[specifier];
      throw new Error(`unexpected require ${specifier}`);
    },
    module,
    module.exports,
  );
  return { exports: module.exports, source };
}

const projection = await load("../src/main/main-app/threads/projection.ts", {
  "@chunk/shared": {
    $u: (id) => `normalized:${id}`,
    Cf: {},
    Of: () => ({ regex: () => ({ nullish: () => ({}) }) }),
    wf: () => ({
      safeParse(value) {
        const id = value?.environmentConfigId;
        return typeof id === "string" && id.startsWith("asenvcfg_")
          ? { success: true, data: value }
          : { success: false };
      },
    }),
  },
  "../markdown/plain-text": { plainTextFromMarkdown: (value) => value.replaceAll("**", "") },
  "../misc/delegation": { parseCodexDelegation: () => null },
  "../prompts/section-markers": { takeLastRequestSection: (value) => value },
  "./automation-detector": { hasCanonicalVoiceHistory: () => true },
});
const p = projection.exports;
const skeleton = p.conversationFromThreadSummary({
  conversationId: "thread-1",
  forkedFromId: null,
  hostId: "local",
  createdAt: 10,
  updatedAt: 20,
  title: "Title",
  parentThreadId: "parent",
});
equal(skeleton.id, "thread-1");
equal(skeleton.parentThreadId, "normalized:parent");
equal(skeleton.resumeState, "needs_resume");
equal(skeleton.latestCollaborationMode.settings.model, "");
equal(p.cleanThreadTitle(" **hello** "), "hello");
equal(p.truncateText(" one   two three ", 8), "one two…");
equal(p.threadTimestamps({ createdAt: 2, updatedAt: 3 }), { createdAt: 2000, updatedAt: 3000, recencyAt: null });
equal(p.mergedRecencyAt({ currentRecencyAt: 10, threadRecencyAt: 20, updatedAt: 15 }), 20);
equal(p.environmentSelection(
  { updatedAt: 5, environments: [{ environmentId: "env", environmentConfigId: "asenvcfg_1" }] },
  null,
  "live",
), {
  environmentConfigId: "asenvcfg_1",
  environments: [{ environmentId: "env", environmentConfigId: "asenvcfg_1" }],
  environmentSelectionEvidence: { source: "live", updatedAt: 5 },
});
const source = { subAgent: { thread_spawn: {
  parent_thread_id: "parent",
  agent_path: "agent/path",
  agent_nickname: "worker",
  agent_role: "explorer",
} } };
equal(p.subAgentMetadata(source), {
  parentThreadId: "normalized:parent",
  agentPath: "agent/path",
  agentNickname: "worker",
  agentRole: "explorer",
});
equal(p.subAgentNickname({ agentNickname: " ", source }), "worker");
equal(p.hasCanonicalVoiceHistory(), true);

const errors = await load("../src/main/main-app/misc/thread-errors.ts", {});
const e = errors.exports;
equal(e.me(Object.assign(new Error("anything"), { code: "thread_not_found" })), true);
equal(e.me(new Error("Thread not loaded: thread-1")), true);
equal(e.me({ message: "rpc: unknown thread: thread-1", data: { grpcStatusCode: 5 } }), true);
equal(e.me(new Error("permission denied")), false);
equal(e.Xt("accept", { trace: 1 }, { answer: true }), {
  action: "accept",
  content: { answer: true },
  _meta: { trace: 1 },
});
equal(e.Xt("decline"), { action: "decline", content: null, _meta: null });

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('subAgentNickname: $ge } = require("./main-app/threads/projection.js")'), true);
equal(main.includes('const { me, Xt } = require("./main-app/misc/thread-errors.js")'), true);
for (const name of ["V_", "H_", "Zge", "Qge", "U_", "$ge", "W_", "Cv", "wv", "v_e", "Tv", "Ev", "Dv", "Xt"])
  equal(main.includes(`function ${name}(`), false);
equal(/^function me\(e\) \{/mu.test(main), false);

const threadStore = fs.readFileSync(
  new URL("../src/main/main-app/threads/thread-store.ts", import.meta.url),
  "utf8",
);
equal(threadStore.includes('import { isThreadNotFoundError } from "../misc/thread-errors"'), true);
equal(threadStore.includes("export const isThreadNotFound = isThreadNotFoundError"), true);
equal(threadStore.includes("/thread_not_found/.test(error.message)"), false);

console.log(`${assertions} main thread projection and errors owner assertions passed`);
