import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/terminal/terminal-session-manager.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createTerminalSessionManagerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const flush = async () => {
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
};

function createOwner(id) {
  const listeners = new Map();
  let destroyed = false;
  return {
    id,
    isDestroyed: () => destroyed,
    once(name, listener) {
      listeners.set(name, listener);
    },
    destroy() {
      destroyed = true;
      listeners.get("destroyed")?.();
    },
  };
}

function createHarness() {
  const backendRecords = [];
  let nextId = 1;
  const ztt = {
    create(options) {
      const calls = [];
      const backend = {
        calls,
        async write(value) {
          calls.push(["write", value]);
        },
        async resize(cols, rows) {
          calls.push(["resize", cols, rows]);
        },
        async terminate() {
          calls.push(["terminate"]);
        },
        async dispose(options) {
          calls.push(["dispose", options]);
        },
      };
      backendRecords.push({ backend, callbacks: options.callbacks, options });
      return backend;
    },
  };
  const n = {
    $n: (value) => JSON.stringify(value),
    Bi: (value) => value,
    Es: (host) => host?.kind === "remote",
    Hi: () => null,
    Vi: (value) => value,
    Wo: (roots) => roots?.[0] ?? null,
    Zo: (error) => error instanceof Error ? error.message : String(error),
  };
  const TerminalSessionManager = createTerminalSessionManagerClass({
    n,
    v: { existsSync: () => true },
    D: { setTimeout: async () => undefined },
    _: { randomUUID: () => `generated-${nextId++}` },
    Pr: () => ({ rootPaths: ["/workspace"] }),
    Bn: (value) => value,
    zn: (value) => value,
    Ntt: (value) => value.replaceAll("secret", ""),
    Gtt: (_kind, cwd, command) => `action:${cwd}:${command}`,
    jtt: () => ["/bin/default-shell"],
    h5: (command) => path.basename(command[0]),
    C5: () => "posix",
    ztt,
    NQ: class {},
    bE: () => ["remote-shell"],
    Vtt: 16_000,
    Htt: 100,
    x5: "xterm-256color",
    Utt: {
      write: async () => undefined,
      resize: async () => undefined,
      terminate: async () => undefined,
      dispose: async () => undefined,
    },
    S5: (ownerId, conversationId) => `${ownerId}:${conversationId}`,
  });
  const manager = new TerminalSessionManager(
    {},
    () => null,
    ["/bin/test-shell"],
    async () => ({ exclude: [], set: { TEST_ENV: "1" } }),
    (hostId) => hostId === "remote" ? { kind: "remote", home_dir: "/remote-home" } : null,
    () => null,
    async () => { throw Error("durable backend not expected"); },
  );
  return { backendRecords, manager };
}

{
  const { backendRecords, manager } = createHarness();
  const owner = createOwner(1);
  const events = [];
  const unsubscribe = manager.subscribe(owner, (event) => events.push(event));
  equal(manager.getRestartBlockers(), []);
  equal(
    await manager.createOrAttach(owner, {
      type: "create",
      sessionId: "session-1",
      conversationId: "conversation-1",
      cwd: "/repo",
      cols: 100,
      rows: 30,
    }),
    "session-1",
  );
  equal(manager.getRestartBlockers(), ["terminal.session"]);
  equal(backendRecords.length, 1);
  equal(backendRecords[0].options.command, ["/bin/test-shell"]);
  equal(backendRecords[0].options.cwd, "/repo");
  equal(events[0], {
    type: "attached",
    sessionId: "session-1",
    cwd: "/repo",
    shell: "test-shell",
  });

  backendRecords[0].callbacks.onData("hello");
  equal(events.at(-1), { type: "data", sessionId: "session-1", data: "hello" });
  equal(manager.getSnapshotForConversationId("conversation-1", owner.id), {
    cwd: "/repo",
    shell: "test-shell",
    buffer: "hello",
    truncated: false,
  });
  equal(manager.getShellCwd(owner, "session-1", "/next"), "/next");

  manager.write(owner, "session-1", "input");
  await flush();
  equal(backendRecords[0].backend.calls.at(-1), ["write", "input"]);
  manager.resize(owner, "session-1", 120, 40);
  await flush();
  equal(backendRecords[0].backend.calls.at(-1), ["resize", 120, 40]);
  const resizeCount = backendRecords[0].backend.calls.length;
  manager.resize(owner, "session-1", 120, 40);
  await flush();
  equal(backendRecords[0].backend.calls.length, resizeCount);

  const otherOwner = createOwner(2);
  const otherEvents = [];
  manager.subscribe(otherOwner, (event) => otherEvents.push(event));
  manager.write(otherOwner, "session-1", "denied");
  equal(otherEvents.at(-1), {
    type: "error",
    sessionId: "session-1",
    message: "Session owned by another window",
  });

  manager.runAction(owner, "session-1", { cwd: "/action-cwd", command: "pwd" });
  await flush();
  equal(backendRecords.length, 2);
  equal(backendRecords[0].backend.calls.some(([name]) => name === "dispose"), true);
  equal(backendRecords[1].backend.calls.at(-1), ["write", "action:/action-cwd:pwd"]);
  equal(events.some((event) => event.type === "init-log"), true);

  manager.close(owner, "session-1");
  await flush();
  equal(events.at(-1), {
    type: "exit",
    sessionId: "session-1",
    code: null,
    signal: null,
    error: undefined,
  });
  equal(manager.getRestartBlockers(), []);
  unsubscribe();
}

{
  const { backendRecords, manager } = createHarness();
  const source = createOwner(10);
  const sourceEvents = [];
  manager.subscribe(source, (event) => sourceEvents.push(event));
  await manager.createOrAttach(source, {
    type: "create",
    sessionId: "preserved",
    conversationId: "conversation-a",
    cwd: "/repo",
    preserveOnOwnerDestroy: true,
  });
  backendRecords[0].callbacks.onData("secret-visible");
  source.destroy();
  equal(manager.getRestartBlockers(), ["terminal.session"]);

  const target = createOwner(11);
  const targetEvents = [];
  manager.subscribe(target, (event) => targetEvents.push(event));
  equal(
    await manager.attachExisting(target, {
      sessionId: "preserved",
      conversationId: "conversation-a",
      hostId: null,
    }),
    true,
  );
  equal(targetEvents[0], {
    type: "init-log",
    sessionId: "preserved",
    log: "-visible",
  });
  equal(targetEvents[1].type, "attached");
  equal(
    manager.transferSessionOwnership(target, {
      sessionId: "preserved",
      sourceConversationId: "conversation-a",
      targetConversationId: "conversation-b",
      nextSourceActiveSessionId: null,
    }),
    true,
  );
  equal(manager.getSnapshotForConversationId("conversation-a", target.id), null);
  equal(manager.getSnapshotForConversationId("conversation-b", target.id)?.buffer, "secret-visible");
  await manager.dispose();
  equal(manager.getRestartBlockers(), []);
  equal(backendRecords[0].backend.calls.at(-1), ["dispose", { killProcessTree: true }]);
  equal(targetEvents.at(-1).type, "exit");
}

{
  const { manager } = createHarness();
  const owner = createOwner(20);
  const events = [];
  manager.subscribe(owner, (event) => events.push(event));
  manager.write(owner, "missing", "value");
  equal(events.at(-1), { type: "error", sessionId: "missing", message: "Session missing" });
  manager.close(owner, "missing");
  equal(events.length, 1);
  await manager.dispose();
  equal(await manager.createOrAttach(owner, { type: "create", cwd: "/repo" }), null);
}

{
  const mainSource = fs.readFileSync(
    path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"),
    "utf8",
  );
  const ownerKeyStart = mainSource.indexOf("function S5(e, t) {");
  const managerFactoryStart = mainSource.indexOf("var Wtt = createTerminalSessionManagerClass({");
  const nextHelperStart = mainSource.indexOf("function C5(e)", managerFactoryStart);
  equal(ownerKeyStart >= 0, true);
  equal(managerFactoryStart > ownerKeyStart, true);
  equal(nextHelperStart > managerFactoryStart, true);
  equal(
    mainSource
      .slice(ownerKeyStart, managerFactoryStart)
      .endsWith("return `${e}:${t}`;\n}\n"),
    true,
  );
  equal(
    mainSource.slice(managerFactoryStart, nextHelperStart).trimEnd().endsWith("});"),
    true,
  );
}

console.log(`${assertions} main terminal session manager assertions passed`);
