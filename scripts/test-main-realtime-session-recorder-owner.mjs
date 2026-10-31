import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/realtime/session-recorder.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classes = new Map(
  ast.body
    .filter((node) => node.type === "ClassDeclaration")
    .map((node) => [node.id?.name, node]),
);
equal(classes.get("RecordingGate")?.body.body.length, 5);
equal(classes.get("RealtimeSessionRecorder")?.body.body.length, 16);
equal(classes.get("VoiceTimelineLedger")?.body.body.length, 5);

const classFromSource = (name, dependencies) => {
  const node = classes.get(name);
  const classSource = transpiled.code.slice(node.start, node.end);
  return Function(...Object.keys(dependencies), `${classSource}; return ${name};`)(
    ...Object.values(dependencies),
  );
};
const RecordingGate = classFromSource("RecordingGate", {});
const gate = new RecordingGate();
equal(gate.isEnabled(), false);
equal(gate.getGeneration(), 0);
gate.setEnabled(true);
equal(gate.isEnabled(), true);
equal(gate.getGeneration(), 1);
gate.setEnabled(true);
equal(gate.getGeneration(), 1);
gate.setEnabled(false);
equal(gate.getGeneration(), 2);

const RealtimeSessionRecorder = classFromSource("RealtimeSessionRecorder", {
  join: path.join,
  realtimeEventSchema: { safeParse: () => ({ success: false }) },
  turnNotificationSchema: { safeParse: () => ({ success: false }) },
});
equal(
  RealtimeSessionRecorder.getRootDirectory({ codexHome: "/codex-home" }),
  "/codex-home/realtime-sessions",
);
let generation = 1;
const recorder = new RealtimeSessionRecorder({
  hostId: "local",
  rootDirectory: "/recordings",
  isRecordingEnabled: () => false,
  getRecordingGeneration: () => generation,
});
recorder.recordings.set("thread-1", {});
recorder.record({ method: "ignored" });
equal(recorder.recordings.size, 1);
generation = 2;
recorder.record({ method: "ignored" });
equal(recorder.recordings.size, 0);
equal(recorder.recordingGeneration, 2);

const rows = new Map();
let maxSequence = 0;
const commands = [];
const db = {
  prepare(sql) {
    return {
      run(...args) {
        commands.push([sql.trim().split(/\s+/).slice(0, 2).join(" "), args]);
        if (sql.includes("INSERT INTO")) {
          const [, , sequence, recordId, payload] = args;
          maxSequence = sequence;
          rows.set(recordId, payload);
        }
      },
      get(...args) {
        if (sql.includes("MAX(sequence)")) return { sequence: maxSequence };
        if (sql.includes("record_id = ?")) {
          const recordId = args.at(-1);
          return rows.has(recordId) ? { payload_json: rows.get(recordId) } : undefined;
        }
      },
      all() {
        return [...rows.values()].map((payload_json) => ({ payload_json }));
      },
    };
  },
};
const parseVoiceTimelineRecord = (value) =>
  value?.recordId && Number.isInteger(value.sequence) ? value : null;
const VoiceTimelineLedger = classFromSource("VoiceTimelineLedger", { parseVoiceTimelineRecord });
const ledger = new VoiceTimelineLedger(db);
const scope = { hostId: "local", conversationId: "thread-1" };
const first = ledger.append(scope, { recordId: "record-1", type: "session-started" });
equal(first.sequence, 1);
equal(ledger.append(scope, { recordId: "record-1", type: "duplicate" }), first);
const second = ledger.append(scope, { recordId: "record-2", type: "session-ended" });
equal(second.sequence, 2);
equal(ledger.list(scope).map(({ recordId }) => recordId), ["record-1", "record-2"]);
equal(ledger.readById(scope, "missing"), null);
equal(commands.filter(([command]) => command === "BEGIN IMMEDIATE").length, 3);
equal(commands.filter(([command]) => command === "COMMIT").length, 3);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("kwe = readRealtimeSessionLogForFeedback"), true);
equal(main.includes("Awe = RecordingGate"), true);
equal(main.includes("mw = RealtimeSessionRecorder"), true);
equal(main.includes("Lwe = VoiceTimelineLedger"), true);
equal(main.includes("mw = class"), false);
equal(main.includes("Lwe = class"), false);
equal(main.includes("ie = new mw({"), true);

console.log(`${assertions} main realtime session recorder owner assertions passed`);
