import assert from "node:assert/strict";
import fs from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { build } from "esbuild";

const output = await build({
  entryPoints: [
    new URL(
      "../src/main/main-app/sidebar/saved-section-policy.ts",
      import.meta.url,
    ).pathname,
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const { createSavedSectionPolicy } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);

const policy = createSavedSectionPolicy({
  dedupe: (values) => [...new Set(values)],
  deepEqual: isDeepStrictEqual,
  isInternalThreadId: (value) => value.startsWith("internal-"),
  pinnedThreadIdsKey: "pinned",
});
let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const state = () => ({
  sections: [
    {
      id: "one",
      name: "One",
      itemKeys: ["codex:thread:local:a", "codex:thread:local:b"],
      pendingDeletionHostIdsByItemKey: {
        "codex:thread:local:a": ["remote"],
        "codex:thread:local:b": ["remote"],
      },
    },
    { id: "two", name: "Two", itemKeys: ["chatgpt:conversation:c"] },
  ],
  collapsedSectionIds: ["one"],
  sectionOrder: ["pinned", "custom:one", "custom:two", "threads"],
  threadHostIds: { a: "local", b: "remote", orphan: "remote" },
});

equal(policy.readPinnedThreadIds({ get: () => ["a", "a", 1, "b"] }), [
  "a",
  "b",
]);
equal(policy.readPinnedThreadIds({ get: () => null }), []);
equal(policy.isRpcErrorCode({ jsonRpcCode: -1 }, -1), true);
equal(policy.isRpcErrorCode({ code: "missing" }, "missing"), true);

equal(
  policy
    .stripSectionAppearance(state())
    .sections.map((section) => section.appearance),
  [null, null],
);
equal(policy.moveItem(state(), "two", "codex:thread:local:a").sections, [
  {
    id: "one",
    name: "One",
    itemKeys: ["codex:thread:local:b"],
    pendingDeletionHostIdsByItemKey: { "codex:thread:local:b": ["remote"] },
  },
  {
    id: "two",
    name: "Two",
    itemKeys: ["chatgpt:conversation:c", "codex:thread:local:a"],
    pendingDeletionHostIdsByItemKey: undefined,
  },
]);
equal(policy.moveItem(state(), "missing", "x"), state());

const created = policy.createSection(state(), {
  id: "three",
  name: "  Three  ",
  itemKeys: ["codex:thread:local:b"],
});
equal(created.sections.at(-1).name, "Three");
equal(created.sections[0].itemKeys, ["codex:thread:local:a"]);
equal(created.sectionOrder, [
  "pinned",
  "custom:one",
  "custom:two",
  "custom:three",
  "threads",
]);
equal(
  policy.createSection(state(), { id: "one", name: "Duplicate", itemKeys: [] }),
  state(),
);
equal(
  policy.renameSection(state(), "one", "  Renamed ").sections[0].name,
  "Renamed",
);
equal(policy.renameSection(state(), "one", " "), state());
equal(policy.deleteSection(state(), "one").collapsedSectionIds, []);
equal(
  policy.deleteSection(state(), "one").sectionOrder.includes("custom:one"),
  false,
);
equal(policy.removeItem(state(), "codex:thread:local:a").sections[0].itemKeys, [
  "codex:thread:local:b",
]);
equal(
  policy.reorderItems(state(), "one", ["codex:thread:local:b"]).sections[0]
    .itemKeys,
  ["codex:thread:local:b", "codex:thread:local:a"],
);
equal(
  policy
    .reorderSectionKeys(state(), ["custom:two", "custom:one", "threads"])
    .sections.map(({ id }) => id),
  ["two", "one"],
);
equal(
  policy.replaceItem(state(), "codex:thread:local:a", "codex:thread:local:z")
    .sections[0],
  {
    id: "one",
    name: "One",
    itemKeys: ["codex:thread:local:z", "codex:thread:local:b"],
    pendingDeletionHostIdsByItemKey: {
      "codex:thread:local:z": ["remote"],
      "codex:thread:local:b": ["remote"],
    },
  },
);

equal(
  policy.applySavedSectionOperation(state(), {
    type: "collapse",
    sectionId: "two",
    collapsed: true,
  }).collapsedSectionIds,
  ["one", "two"],
);
equal(
  policy.applySavedSectionOperation(state(), {
    type: "move",
    sectionId: "two",
    itemKey: "codex:thread:local:a",
    onlyIfUnassigned: true,
  }),
  state(),
);
const withHost = policy.applyOperationWithHostIds(state(), {
  type: "move",
  sectionId: "two",
  itemKey: "codex:thread:local:a",
  threadHostId: "new-host",
});
equal(withHost.threadHostIds, { a: "new-host", b: "remote" });

const before = state();
const after = policy.renameSection(before, "one", "Changed");
const affected = policy.describeAffectedState(before, after);
equal(
  affected.sections.map(({ id }) => id),
  ["one"],
);
equal(affected.structure, false);
const guards = policy.captureAffectedStateGuards(before, affected);
equal(policy.affectedStateGuardsMatch(before, guards), true);
equal(
  policy.affectedStateGuardsMatch(
    { ...before, sections: [...before.sections] },
    guards,
  ),
  true,
);
equal(
  policy.affectedStateGuardsMatch(
    { ...before, sections: [{ ...before.sections[0] }, before.sections[1]] },
    guards,
  ),
  false,
);
const projected = policy.projectAffectedState(after, affected);
equal(projected.sections.length, 1);
equal(
  policy.applyAffectedState(before, projected, affected).sections[0].name,
  "Changed",
);

const writes = [];
const source = {
  isSourceCurrent: () => true,
  read: () => before,
  getConnection: (hostId) => writes.push(["connection", hostId]),
  write: (value, operationId) => writes.push(["write", value, operationId]),
};
equal(
  policy.commitReconciledState(source, before, after, "operation", "host"),
  "applied",
);
equal(writes[0], ["connection", "host"]);
equal(writes[1][2], "operation");
equal(
  policy.commitReconciledState(
    { ...source, isSourceCurrent: () => false },
    before,
    after,
  ),
  "unavailable",
);

equal(policy.threadIdFromItemKey("codex:thread:local:a"), "a");
equal(policy.threadIdFromItemKey("codex:thread:local:internal-a"), null);
equal(policy.threadIdFromItemKey("chatgpt:conversation:a"), null);
equal(policy.itemKeyFromThreadId("abc"), "codex:thread:local:abc");
equal(
  policy.pruneThreadHostIds(
    state(),
    { a: "local", b: "remote", orphan: "remote" },
    {},
  ).threadHostIds,
  { a: "local", b: "remote" },
);
equal(
  policy.updateSectionItems(
    state().sections[0],
    ["codex:thread:local:a"],
    new Set(["a"]),
    {},
  ).pendingDeletionHostIdsByItemKey,
  undefined,
);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes('require("./main-app/sidebar/saved-section-policy.js")'),
  true,
);
equal(main.includes("createSavedSectionPolicy({"), true);
for (const oldFunction of [
  "function Wb(",
  "function Gb(",
  "function Kb(",
  "function qb(",
  "function _H(",
  "function eBe(",
  "function vH(",
  "function bH(",
  "function wH(",
  "function DH(",
  "function OH(",
  "function AH(",
]) {
  equal(main.includes(oldFunction), false, `${oldFunction} must be removed`);
}

console.log(
  `main saved-section policy tests passed (${assertions} assertions)`,
);
