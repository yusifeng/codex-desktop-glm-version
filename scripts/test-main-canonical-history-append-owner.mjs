import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(new URL("../src/main/main-app/turns/canonical-history.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)((specifier) => {
  if (specifier === "../vendor/immer") return { freezeIdentity: (value) => value };
  if (specifier === "../util/lodash-interop") return { findLast: (values, predicate) => [...values].reverse().find(predicate) };
  if (specifier === "./item-merge") return { mergeTurnLists: (server) => server };
  throw new Error(`unexpected require ${specifier}`);
}, module, module.exports);

{
  const { appendConversationTurn } = module.exports;
  let assertions = 0;
  const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
  const ids = ["island", "entity"];
  const createId = () => ids.shift();

  const legacy = { id: "legacy", turns: [] };
  const legacyTurn = { turnId: null, items: [] };
  equal(appendConversationTurn(legacy, legacyTurn, createId), legacyTurn);
  equal(legacy.turns, [legacyTurn]);

  const canonical = {
    id: "canonical", turns: [], turnHistory: { kind: "canonical", history: {
      generation: 0, isComplete: true, entitiesByKey: {}, islands: [{
        id: "server-tail", entries: [],
        olderBoundary: { status: "exhausted", boundaryId: "server-tail:older" },
        newerBoundary: { status: "available", boundaryId: "server-tail:newer" },
      }],
    } },
  };
  const canonicalTurn = { turnId: null, items: [{ id: "worktree" }] };
  equal(appendConversationTurn(canonical, canonicalTurn, createId), canonicalTurn);
  equal(canonical.turnHistory.history.isComplete, false);
  equal(canonical.turnHistory.history.islands.at(-1).id, "local-live-tail:island");
  equal(canonical.turnHistory.history.islands.at(-1).entries[0].value, "local-live-tail:island:local:entity");
  equal(canonical.turnHistory.history.entitiesByKey["local-live-tail:island:local:entity"], canonicalTurn);
  equal(canonical.turns, []);

  console.log(`${assertions} main canonical history append owner assertions passed`);
}
