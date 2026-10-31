import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const nodeRequire = createRequire(import.meta.url);
const loadSourceModule = async (url, requireFn = nodeRequire) => {
  const source = fs.readFileSync(url, "utf8");
  const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const module = { exports: {} };
  Function("require", "module", "exports", transpiled.code)(requireFn, module, module.exports);
  return module.exports;
};

const attribution = await loadSourceModule(
  new URL("../src/main/main-app/startup/app-entry-attribution.ts", import.meta.url),
);
const entries = [];
const scheduled = [];
let id = 0;
const tracker = new attribution.AppEntryAttributionTracker(
  (entry) => entries.push(entry),
  (callback) => scheduled.push(callback),
  () => 1234,
  () => `generated-${++id}`,
  "installer-id",
);
equal(tracker.canAttributeRuntimeActivation(), false);
tracker.handleInitialWindowVisible();
equal(scheduled.length, 1);
scheduled.shift()();
equal(entries[0], {
  appEntryInstanceId: "installer-id",
  appEntryReceivedTs: 1234,
  kind: "direct",
  entryUrl: undefined,
  attribution: {
    channel: "installer",
    source: "chatgpt_micro_installer",
    entryId: "installer-id",
  },
});
tracker.handleBackground();
tracker.handleDeepLink("chatgpt://codex/thread");
equal(entries[1].kind, "deep-link");
equal(entries[1].entryUrl, "chatgpt://codex/thread");
tracker.handleForeground();
equal(entries.length, 2);
tracker.handleBackground();
tracker.handleForeground();
equal(scheduled.length, 1);
scheduled.shift()();
equal(entries[2].kind, "foreground");
equal(entries[2].appEntryInstanceId, "generated-2");
equal(tracker.handleSourceActivation({ channel: "notification", source: "push" }), true);
equal(entries[3].attribution, { channel: "notification", source: "push" });

const nativeCalls = [];
const pip = await loadSourceModule(
  new URL("../src/main/main-app/computer-use/pip-turn-lifecycle.ts", import.meta.url),
  (specifier) => {
    if (specifier === "../windows/native-app-icons")
      return {
        completeRemoteHostedPIPContentThread: (threadId) => nativeCalls.push(["complete", threadId]),
        invalidateRemoteHostedPIPContentTurn: (threadId, turnId) =>
          nativeCalls.push(["invalidate", threadId, turnId]),
      };
    throw new Error(`unexpected require ${specifier}`);
  },
);
let handler;
const closed = [];
const unsubscribe = () => {};
equal(
  pip.subscribeComputerUsePipTurnLifecycle({
    appServerConnection: {
      registerInternalNotificationHandler: (next) => ((handler = next), unsubscribe),
    },
    closeActiveTurn: (turn) => closed.push(turn),
  }),
  unsubscribe,
);
handler({ method: "turn/completed", params: { threadId: "thread-1", turn: { id: "turn-1", status: "completed" } } });
handler({ method: "turn/completed", params: { threadId: "thread-2", turn: { id: "turn-2", status: "failed" } } });
handler({ method: "item/completed", params: { threadId: "ignored" } });
equal(nativeCalls, [["complete", "thread-1"], ["invalidate", "thread-2", "turn-2"]]);
equal(closed, [
  { sessionId: "thread-1", turnId: "turn-1" },
  { sessionId: "thread-2", turnId: "turn-2" },
]);
equal(pip.isCompletedTurnNotification({ method: "turn/completed", params: { threadId: "x", turn: { id: "y" } } }), true);
equal(pip.isCompletedTurnNotification({ method: "turn/completed", params: { threadId: "x", turn: null } }), false);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/startup/app-entry-attribution.js")'), true);
equal(main.includes('require("./main-app/computer-use/pip-turn-lifecycle.js")'), true);
equal(main.includes("refreshCanonicalServiceAppCopy: Toe"), true);
equal(main.includes("resolveComputerUseAppPath: koe"), true);
equal(main.includes("var rl ="), false);
equal(main.includes("var Coe ="), false);
equal(main.includes("var Foe = class"), false);
equal(main.includes("AppEntryAttributionTracker: Foe"), true);
equal(main.includes("new Foe("), false);
equal(main.includes("I.add(Noe({"), true);

console.log(`${assertions} main startup attribution and PIP owner assertions passed`);
