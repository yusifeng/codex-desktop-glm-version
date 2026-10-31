import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/turns/item-merge.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, {
  loader: "ts",
  format: "cjs",
  target: "es2022",
});
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "@chunk/shared")
      return { dd: (value) => value?.automation === true ? value : null };
    if (specifier === "../vendor/immer")
      return {
        freezeIdentity: (value) => value,
        produce: (value, recipe) => {
          const draft = structuredClone(value);
          recipe(draft);
          return draft;
        },
      };
    if (specifier === "../util/lodash-interop")
      return { deepEqual: (left, right) => JSON.stringify(left) === JSON.stringify(right) };
    if (specifier === "./steering-merge")
      return {
        isUnboundSteeringMessage: (item) =>
          item.type === "steeringUserMessage" && item.serverUserMessageId == null,
        recoverSteeringOrphans() {},
        recoverTurnSteeringOrphans() {},
      };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);

const {
  findAutomationItem,
  isAgentMessage,
  isAutomationOnlyTurn,
  isPlaceholderTurn,
  isUserInputLike,
  mergeItems,
  mergeTurn,
  mergeTurnLists,
  mergeTurnParams,
} = module.exports;

const message = (id, text, memoryCitation = null) => ({
  id,
  type: "agentMessage",
  phase: "final_answer",
  text,
  memoryCitation,
});
const turn = (turnId, items = [], overrides = {}) => ({
  turnId,
  turnStartedAtMs: 1,
  status: "completed",
  error: null,
  params: { input: "input", toolOutput: null },
  items,
  ...overrides,
});

equal(isAgentMessage({ type: "agentMessage" }), true);
equal(isAgentMessage({ type: "reasoning" }), false);
equal(isUserInputLike({ type: "functionCallOutput" }), true);
equal(isUserInputLike({ type: "reasoning" }), false);
equal(isPlaceholderTurn(turn(null, [], { turnStartedAtMs: null })), true);
equal(isPlaceholderTurn(turn(null, [{ id: "item" }], { turnStartedAtMs: null })), false);

const original = { id: "same", type: "reasoning", text: "old" };
const replacement = { id: "same", type: "reasoning", text: "new" };
equal(mergeItems([original], [replacement]), [original]);
equal(mergeItems([original], [replacement], "append", { preferIncomingItems: true }), [replacement]);

const cited = message("answer", "done", { source: "local" });
equal(
  mergeItems([cited], [message("answer", "updated")], "append", { preferIncomingItems: true }),
  [message("answer", "updated", { source: "local" })],
);
equal(
  mergeItems(
    [{ id: "known", type: "reasoning" }],
    [{ id: "before", type: "reasoning" }, { id: "known", type: "reasoning" }],
  ).map((item) => item.id),
  ["before", "known"],
);
equal(
  mergeItems([{ id: "known" }], [{ id: "new" }], "prepend").map((item) => item.id),
  ["new", "known"],
);
equal(
  mergeItems(
    [{ id: "first" }, { id: "anchor" }],
    [{ id: "snapshot" }],
    { snapshotBeforeItemId: "anchor" },
  ).map((item) => item.id),
  ["first", "snapshot", "anchor"],
);
equal(mergeItems([message("old-id", "same")], [message("new-id", "same")])[0].id, "old-id");
equal(
  mergeItems(
    [message("old-id", "same", { source: "old" })],
    [message("new-id", "same")],
    "append",
    { preferIncomingItems: true },
  )[0],
  message("new-id", "same", { source: "old" }),
);

const placeholder = turn(null, [], { turnStartedAtMs: null });
equal(mergeTurnLists([placeholder, turn("a")], [turn("a")]).map((value) => value.turnId), ["a"]);
equal(
  mergeTurnLists([turn("a"), turn("c")], [turn("a"), turn("b"), turn("c")]).map(
    (value) => value.turnId,
  ),
  ["a", "b", "c"],
);
equal(
  mergeTurnLists([turn("a")], [turn("a"), turn("b")]).map((value) => value.turnId),
  ["a", "b"],
);

const localTerminal = turn("merged", [{ id: "local" }], {
  status: "completed",
  error: { message: "local" },
  localMetadata: { source: "desktop" },
  requestTraceId: "local-trace",
  turnStartedAtMs: 10,
});
const serverStreaming = turn("merged", [{ id: "server" }], {
  status: "inProgress",
  error: null,
  localMetadata: null,
  requestTraceId: null,
  turnStartedAtMs: 20,
});
const preserved = mergeTurn(localTerminal, serverStreaming, {
  preserveExistingTerminalState: true,
});
equal(preserved.status, "completed");
equal(preserved.error, { message: "local" });
equal(preserved.items, [{ id: "local" }]);
equal(preserved.localMetadata, { source: "desktop" });
equal(preserved.requestTraceId, "local-trace");
equal(preserved.turnStartedAtMs, 10);

const localParams = turn("params", [], {
  params: { clientUserMessageId: "client", input: "local", toolOutput: null },
});
const emptyServerParams = turn("params", [], {
  params: { input: "", toolOutput: null },
});
equal(mergeTurnParams(localParams, emptyServerParams, null), localParams.params);

const automationPolicy = {
  isAutomationUserInput: (input) => input === "automation-input",
  isAutomationAssistantMessage: (text) => text === "automation-output",
};
const automationInput = { id: "automation", type: "userMessage", content: "automation-input" };
equal(findAutomationItem([automationInput], automationPolicy), automationInput);
equal(
  findAutomationItem(
    [{ id: "tool", type: "functionCallOutput", automation: true }],
    automationPolicy,
  )?.id,
  "tool",
);
equal(
  isAutomationOnlyTurn(
    turn("automation", [message("answer", "automation-output")], {
      params: { input: "human", toolOutput: null },
    }),
    automationPolicy,
  ),
  true,
);
equal(
  isAutomationOnlyTurn(
    turn("human", [message("answer", "human-output")], {
      params: { input: "human", toolOutput: null },
    }),
    automationPolicy,
  ),
  false,
);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/turns/item-merge.js")'), true);
for (const oldDefinition of ["bg", "xg", "Sg", "Cg", "xge", "wg", "Sge", "Cge", "Tg", "wge"])
  equal(main.includes(`function ${oldDefinition}(`), false);

console.log(`${assertions} main turn/item merge owner assertions passed`);
