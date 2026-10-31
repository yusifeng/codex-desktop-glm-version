import assert from "node:assert/strict";
import fs from "node:fs";
import { createThreadProjectMembershipOwnerClass } from "../src/main/main-app/projects/thread-project-membership-owner.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const keys = {
  THREAD_PROJECT_ASSIGNMENTS: "assignments",
  PROJECTLESS_THREAD_IDS: "projectless",
  THREAD_PROJECT_MEMBERSHIP_HOST_IDS: "membership-hosts",
  THREAD_PROJECTLESS_OUTPUT_DIRECTORIES: "output-directories",
  THREAD_WORKSPACE_ROOT_HINTS: "workspace-hints",
};
const chain = () => {
  const value = {
    min() { return value; }, transform() { return value; }, optional() { return value; }, nullable() { return value; },
  };
  return value;
};
const runtime = {
  iu: keys,
  Of: chain,
  gf: chain,
  wf: () => ({ parse: (value) => ({ ...value, threadId: `normalized:${value.threadId}` }) }),
  $u: (value) => `normalized:${value}`,
  ca: (value) => value ?? {},
  la: { parse: (value) => ({ parsed: value }) },
};

class MembershipStoreBase {
  setProjectlessCalls = [];
  constructor(persistence, publish, writer) {
    this.persistence = persistence;
    this.publishMemberships = publish;
    this.assignmentWriter = writer;
  }
  async setProjectless(value) {
    this.setProjectlessCalls.push(value);
  }
}
const ThreadProjectMembershipOwner = createThreadProjectMembershipOwnerClass({
  runtime,
  MembershipStoreBase,
});

function createHarness({ writer, getInitialServerProjectId } = {}) {
  const values = new Map([
    [keys.THREAD_PROJECT_ASSIGNMENTS, { one: "project-a" }],
    [keys.PROJECTLESS_THREAD_IDS, ["thread-p"]],
    [keys.THREAD_PROJECT_MEMBERSHIP_HOST_IDS, { "thread-old": "remote-old" }],
    [keys.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES, { "normalized:thread-1": "/old-output" }],
    [keys.THREAD_WORKSPACE_ROOT_HINTS, { "normalized:thread-1": "/old-workspace" }],
  ]);
  const setCalls = [];
  const updateCalls = [];
  const messages = [];
  const globalState = {
    get(key) { return values.get(key); },
    set(key, value) { setCalls.push([key, value]); values.set(key, value); },
    update(key, updater) {
      const value = updater(values.get(key));
      updateCalls.push([key, value]);
      values.set(key, value);
    },
  };
  const windowManager = {
    sendMessageToAllWindows(message) { messages.push(message); },
  };
  const owner = new ThreadProjectMembershipOwner(
    globalState,
    windowManager,
    writer,
    getInitialServerProjectId,
  );
  return { globalState, messages, owner, setCalls, updateCalls, values };
}

{
  const harness = createHarness();
  equal(harness.owner.persistence.read(), {
    assignments: { one: "project-a" },
    projectlessThreadIds: ["thread-p"],
  });
  const previous = harness.owner.persistence.read();
  const next = { assignments: { two: "project-b" }, projectlessThreadIds: ["other"] };
  harness.owner.persistence.write(previous, next);
  equal(harness.setCalls, [
    [keys.THREAD_PROJECT_ASSIGNMENTS, next.assignments],
    [keys.PROJECTLESS_THREAD_IDS, next.projectlessThreadIds],
  ]);
  harness.owner.publishMemberships([{ threadId: "one" }]);
  equal(harness.messages.at(-1), {
    type: "thread-project-memberships-updated",
    memberships: [{ threadId: "one" }],
  });
}

{
  const writerCalls = [];
  const harness = createHarness({
    writer: async (...args) => { writerCalls.push(args); return "written"; },
  });
  let committed = 0;
  const signal = new AbortController().signal;
  equal(
    await harness.owner.assignmentWriter(
      { threadId: "thread-1", assignment: { projectId: "p" }, hostId: "remote" },
      async () => { committed += 1; },
      signal,
    ),
    "written",
  );
  equal(writerCalls[0][0], "thread-1");
  equal(writerCalls[0][1], { projectId: "p" });
  equal(writerCalls[0][3], signal);
  equal(writerCalls[0][4], "remote");
  await writerCalls[0][2]();
  equal(committed, 1);
  equal(harness.values.get(keys.THREAD_PROJECT_MEMBERSHIP_HOST_IDS)["thread-1"], "remote");
}

{
  const harness = createHarness({
    getInitialServerProjectId: async (value) => `project:${value.parsed.threadId}`,
  });
  equal(await harness.owner.getThreadStartProjectId({ threadId: "one" }), "project:one");
  const noResolver = createHarness();
  equal(await noResolver.owner.getThreadStartProjectId({ threadId: "one" }), null);
}

{
  const harness = createHarness();
  await harness.owner.updateProjectlessThread({
    threadId: "thread-1",
    projectless: true,
    outputDirectory: "/new-output",
    workspaceRoot: "/new-workspace",
  });
  equal(harness.owner.setProjectlessCalls, [{ threadId: "normalized:thread-1", projectless: true }]);
  equal(harness.values.get(keys.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES)["normalized:thread-1"], "/new-output");
  equal(harness.values.get(keys.THREAD_WORKSPACE_ROOT_HINTS)["normalized:thread-1"], "/new-workspace");
  equal(harness.messages.at(-1), {
    type: "global-state-updated",
    keys: [
      keys.PROJECTLESS_THREAD_IDS,
      keys.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES,
      keys.THREAD_WORKSPACE_ROOT_HINTS,
    ],
  });
}

{
  const harness = createHarness();
  await harness.owner.updateProjectlessThread({
    threadId: "thread-1",
    projectless: false,
    outputDirectory: null,
  });
  equal(harness.values.get(keys.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES)["normalized:thread-1"], undefined);
  equal(harness.values.get(keys.THREAD_WORKSPACE_ROOT_HINTS)["normalized:thread-1"], undefined);
  const messageCount = harness.messages.length;
  const setCount = harness.owner.setProjectlessCalls.length;
  await harness.owner.updateProjectlessThread({
    threadId: "thread-1",
    projectless: true,
    outputDirectory: "/resurrected",
  });
  equal(harness.messages.length, messageCount);
  equal(harness.owner.setProjectlessCalls.length, setCount);
  equal(harness.values.get(keys.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES)["normalized:thread-1"], undefined);
}

{
  const harness = createHarness();
  await harness.owner.updateProjectlessThread({ threadId: "thread-2" });
  equal(harness.messages, []);
  equal(harness.updateCalls, []);
}

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("Snt = createThreadProjectMembershipOwnerClass({"), true);
equal(main.includes("new Snt("), true);
equal(main.includes("Snt = class"), false);
equal(main.includes("xnt = n.wf"), false);

console.log(`${assertions} main thread-project membership owner assertions passed`);
