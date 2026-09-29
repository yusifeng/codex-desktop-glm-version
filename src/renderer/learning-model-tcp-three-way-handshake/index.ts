// TCP three-way-handshake learning model. Release chunk: model-11da4540b9d5.js.
import "@rchunk/rolldown-runtime";

interface HandshakeValues { client_initial_sequence?: number | null; server_initial_sequence?: number | null; stageIndex?: number | null }
interface HandshakeManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: {
    client_initial_sequence: { kind: "integer"; defaultValue: number; min: number; max: number };
    server_initial_sequence: { kind: "integer"; defaultValue: number; min: number; max: number };
  };
}

let tcpHandshakeManifest: HandshakeManifest;
let handshakeStageControl: { min: number; max: number; step: number; defaultValue: number };
let calculateHandshakeState: (values: HandshakeValues) => {
  client_initial_sequence: number; server_initial_sequence: number; stageIndex: number;
  clientNext: number; serverNext: number; clientState: "CLOSED" | "SYN-SENT" | "ESTABLISHED";
  serverState: "LISTEN" | "SYN-RECEIVED" | "ESTABLISHED";
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeTcpHandshakeManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  tcpHandshakeManifest = {
    type: "TCP_THREE_WAY_HANDSHAKE", version: 3, thumbnailAssetKey: "tcp-three-way-handshake-v1",
    parameters: {
      client_initial_sequence: { kind: "integer", defaultValue: 100, min: 0, max: 9998 },
      server_initial_sequence: { kind: "integer", defaultValue: 400, min: 0, max: 9998 },
    },
  };
}

function initializeTcpHandshakeModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeTcpHandshakeManifest();
  handshakeStageControl = { min: 0, max: 3, step: 1, defaultValue: 0 };
  const normalizeInteger = (value: number | null | undefined, fallback: number, minimum: number, maximum: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, Math.round(value))) : fallback;
  calculateHandshakeState = values => {
    const clientInitialSequence = normalizeInteger(
      values.client_initial_sequence, tcpHandshakeManifest.parameters.client_initial_sequence.defaultValue,
      tcpHandshakeManifest.parameters.client_initial_sequence.min, tcpHandshakeManifest.parameters.client_initial_sequence.max,
    );
    const serverInitialSequence = normalizeInteger(
      values.server_initial_sequence, tcpHandshakeManifest.parameters.server_initial_sequence.defaultValue,
      tcpHandshakeManifest.parameters.server_initial_sequence.min, tcpHandshakeManifest.parameters.server_initial_sequence.max,
    );
    const stageIndex = normalizeInteger(
      values.stageIndex, handshakeStageControl.defaultValue, handshakeStageControl.min, handshakeStageControl.max,
    );
    return {
      client_initial_sequence: clientInitialSequence, server_initial_sequence: serverInitialSequence, stageIndex,
      clientNext: clientInitialSequence + 1, serverNext: serverInitialSequence + 1,
      clientState: stageIndex === 0 ? "CLOSED" : stageIndex === 1 ? "SYN-SENT" : "ESTABLISHED",
      serverState: stageIndex === 0 ? "LISTEN" : stageIndex < 3 ? "SYN-RECEIVED" : "ESTABLISHED",
    };
  };
}

export {
  tcpHandshakeManifest as a, initializeTcpHandshakeManifest as i, calculateHandshakeState as n,
  initializeTcpHandshakeModel as r, handshakeStageControl as t,
};
