import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [
    path.join(
      root,
      "src/main/main-app/remote-artifact/artifact-session-host-protocol.ts",
    ),
  ],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createArtifactSessionHostProtocol } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const rejects = async (operation, pattern) => {
  await assert.rejects(operation, pattern);
  assertions += 1;
};
const throws = (operation, pattern) => {
  assert.throws(operation, pattern);
  assertions += 1;
};

const protocol = createArtifactSessionHostProtocol({
  maxFileBytes: 1024,
  path,
  pathToFileUrl: pathToFileURL,
  schema: {
    wf: (shape) => z.object(shape),
    Of: () => z.string(),
    bf: (value) => z.literal(value),
    Cf: () => z.number(),
    vf: (key, values) => z.discriminatedUnion(key, values),
  },
});

equal(
  protocol.compareConnectionInfo(
    { hostClientModulePath: "client.js", socketPath: "socket", token: "token" },
    { hostClientModulePath: "client.js", socketPath: "socket", token: "token" },
  ),
  true,
);
equal(
  protocol.compareConnectionInfo(
    { hostClientModulePath: "client.js", socketPath: "socket", token: "token" },
    { hostClientModulePath: "client.js", socketPath: "other", token: "token" },
  ),
  false,
);
equal(protocol.isErrorCode(Object.assign(new Error("missing"), { code: "ENOENT" }), "ENOENT"), true);
equal(protocol.isErrorCode(null, "ENOENT"), false);

const binding = protocol.parseExternalDocumentBindingRequest({ bindingId: "binding-1" });
equal(binding, { bindingId: "binding-1" });
equal(
  protocol.parseExternalDocumentApplyRequest({
    bindingId: "binding-1",
    crdtUpdateBase64: "",
    invocationId: "invocation-1",
    snapshotId: "snapshot-1",
    updateId: "update-1",
  }),
  {
    bindingId: "binding-1",
    crdtUpdateBase64: "",
    invocationId: "invocation-1",
    snapshotId: "snapshot-1",
    updateId: "update-1",
  },
);
throws(() => protocol.parseExternalDocumentBindingRequest({ bindingId: "" }), /too_small/i);

equal(protocol.parseCapabilities({ capabilities: ["native-snapshot-v1"] }), ["native-snapshot-v1"]);
equal(protocol.parseArtifactKind({ kind: "spreadsheet" }), "spreadsheet");
throws(() => protocol.parseArtifactKind({ kind: "whiteboard" }), /invalid kind/);
equal(protocol.parseAppendResult({ applied: true, stateVersion: 4 }), {
  applied: true,
  stateVersion: 4,
});
throws(() => protocol.parseAppendResult({ applied: "yes", stateVersion: 4 }), /invalid boolean/);
throws(() => protocol.parseAppendResult({ applied: true, stateVersion: -1 }), /invalid version/);

const update = {
  baseStateVersion: 3,
  crdtUpdateBase64: "AQID",
  originId: "origin-1",
  source: "user",
  stateVersion: 4,
  summary: "edited cell",
  updateId: "update-1",
};
equal(protocol.parseEvent({
  stateVersion: 4,
  type: "artifact-session-update-committed",
  update,
}), {
  stateVersion: 4,
  update: {
    baseStateVersion: 3,
    bytes: new Uint8Array([1, 2, 3]),
    originId: "origin-1",
    source: "user",
    stateVersion: 4,
    summary: "edited cell",
    updateId: "update-1",
  },
});
throws(
  () => protocol.parseEvent({ stateVersion: 5, type: "artifact-session-update-committed", update }),
  /inconsistent versions/,
);
throws(
  () => protocol.parseEvent({ stateVersion: 4, type: "wrong", update }),
  /invalid event/,
);
throws(
  () => protocol.parseEvent({
    stateVersion: 4,
    type: "artifact-session-update-committed",
    update: { ...update, source: "system" },
  }),
  /invalid update source/,
);
throws(
  () => protocol.parseEvent({
    stateVersion: 4,
    type: "artifact-session-update-committed",
    update: { ...update, crdtUpdateBase64: "AB==" },
  }),
  /non-canonical base64/,
);

equal(protocol.parseOpenResult({
  subscriptionId: "subscription-1",
  document: {
    checkpointCrdtStateBase64: "",
    checkpointStateVersion: 0,
    initialArtifactProtoBase64: "AQ==",
    kind: "presentation",
    stateVersion: 4,
    title: "Quarterly plan",
    updates: [update],
  },
}, "artifact-1", "subscription-1"), {
  artifactRef: "artifact-1",
  checkpointCrdtState: new Uint8Array(),
  checkpointStateVersion: 0,
  initialArtifactProto: new Uint8Array([1]),
  kind: "presentation",
  stateVersion: 4,
  title: "Quarterly plan",
  updates: [{
    baseStateVersion: 3,
    bytes: new Uint8Array([1, 2, 3]),
    originId: "origin-1",
    source: "user",
    stateVersion: 4,
    summary: "edited cell",
    updateId: "update-1",
  }],
});
throws(
  () => protocol.parseOpenResult({ subscriptionId: "wrong", document: {} }, "artifact-1", "subscription-1"),
  /wrong subscription/,
);
equal(protocol.parseFlushSubscriptionId({ subscriptionId: "subscription-1" }), "subscription-1");

equal(protocol.parseAssetResult({ dataBase64: "BAU=", sha256: "abc" }, "abc"), new Uint8Array([4, 5]));
throws(() => protocol.parseAssetResult({ dataBase64: "BAU=", sha256: "wrong" }, "abc"), /wrong asset/);
equal(protocol.serializeBytes(new Uint8Array([0, 1, 2, 255])), "AAEC/w==");

const nativeSnapshot = {
  artifactRef: "artifact-1",
  artifactType: "spreadsheet",
  binding: { fileName: "workbook.xlsx" },
  byteLength: 512,
  contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  format: "xlsx",
  value: { path: path.resolve("/tmp/workbook.xlsx") },
};
equal(protocol.parseNativeSnapshot(nativeSnapshot, "artifact-1"), {
  byteLength: 512,
  contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  fileName: "workbook.xlsx",
  path: path.resolve("/tmp/workbook.xlsx"),
});
throws(() => protocol.parseNativeSnapshot(nativeSnapshot, "artifact-2"), /wrong artifact/);
throws(
  () => protocol.parseNativeSnapshot({ ...nativeSnapshot, byteLength: 2048 }, "artifact-1"),
  /invalid native snapshot/,
);
throws(
  () => protocol.parseNativeSnapshot({
    ...nativeSnapshot,
    value: { path: path.resolve("/tmp/renamed.xlsx") },
  }, "artifact-1"),
  /invalid native snapshot/,
);

let disposed = 0;
protocol.disposeValue({ [Symbol.dispose]() { disposed += 1; } });
equal(disposed, 1);
protocol.disposeValue(null);
equal(disposed, 1);

const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "artifact-host-protocol-"));
try {
  const validClientPath = path.join(temporaryDirectory, "valid-client.mjs");
  await fs.writeFile(validClientPath, `
    export class ArtifactSessionHostRpcClient {
      connectionEpoch = 7;
      constructor(options) { this.options = options; }
      connect() {}
      close() { return Promise.resolve(); }
      onDisconnect() {}
    }
  `);
  const client = await protocol.createViewerClient({
    hostClientModulePath: validClientPath,
    socketPath: "socket-1",
    token: "token-1",
  });
  equal(client.connectionEpoch, 7);
  equal(client.options, { role: "viewer", socketPath: "socket-1", token: "token-1" });

  const closedMarker = path.join(temporaryDirectory, "closed.txt");
  const invalidClientPath = path.join(temporaryDirectory, "invalid-client.mjs");
  await fs.writeFile(invalidClientPath, `
    import fs from "node:fs/promises";
    export class ArtifactSessionHostRpcClient {
      connectionEpoch = "bad";
      close() { return fs.writeFile(${JSON.stringify(closedMarker)}, "closed"); }
    }
  `);
  await rejects(
    protocol.createViewerClient({
      hostClientModulePath: invalidClientPath,
      socketPath: "socket-1",
      token: "token-1",
    }),
    /host client is invalid/,
  );
  equal(await fs.readFile(closedMarker, "utf8"), "closed");
} finally {
  await fs.rm(temporaryDirectory, { force: true, recursive: true });
}

const main = await fs.readFile(
  path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"),
  "utf8",
);
equal(main.includes('require("./main-app/remote-artifact/artifact-session-host-protocol.js")'), true);
equal(main.includes("artifactSessionHostProtocol = createArtifactSessionHostProtocol({"), true);
equal(main.includes("function Iet("), false);
equal(main.includes("async function Uet("), false);
equal(main.includes("function Wet("), false);
equal(main.includes("function Get("), false);
equal(main.includes("function Q8("), false);
equal(main.includes("function $8("), false);
equal(main.includes("function r5("), false);

console.log(`${assertions} main Artifact Session host protocol assertions passed`);
