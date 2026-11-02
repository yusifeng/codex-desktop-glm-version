type IpcRole = "client" | "router";
type SocketLike = {
  writableLength: number;
  on(event: "close" | "error", listener: () => void): unknown;
  off(event: "close" | "error", listener: () => void): unknown;
};

const ROLES: IpcRole[] = ["client", "router"];
const RX_KINDS = ["snapshot", "patches", "follower_coordination", "other_request", "other_response", "other_broadcast", "unknown"] as const;

type Connection = {
  socket: SocketLike; role: IpcRole; active: boolean; announcedBytes: number;
  receivedBytes: number; startedAtMs: number; decoding: boolean;
  decodeStartedAtMs: number; pendingWrites: number; pendingWriteBytes: number; closed: boolean;
};

export class IpcMetrics {
  private readonly connections = new Map<SocketLike, Connection>();
  private readonly totals: Record<string, number> = {};

  constructor(private readonly now: () => number = () => performance.now()) {
    for (const role of ROLES) {
      for (const key of ["rx_announced_frames_total", "rx_announced_bytes_total", "rx_frame_bytes_max", "rx_failures_total", "rx_abandoned_frames_total", "rx_decode_ms_total", "rx_decode_chunk_ms_max", "tx_frames_total", "tx_bytes_total", "tx_frame_bytes_max", "tx_backpressure_total", "tx_write_failures_total", "tx_abandoned_frames_total", "tx_abandoned_bytes_total", "tx_socket_pending_bytes_max", "tx_socket_writable_bytes_max"])
        this.totals[`main_ipc_${role}_${key}`] = 0;
      for (const kind of RX_KINDS) for (const suffix of ["frames_total", "bytes_total", "bytes_max"])
        this.totals[`main_ipc_${role}_rx_${kind}_${suffix}`] = 0;
    }
  }

  attach(socket: SocketLike, role: IpcRole) {
    const state: Connection = { socket, role, active: false, announcedBytes: 0, receivedBytes: 0, startedAtMs: 0, decoding: false, decodeStartedAtMs: 0, pendingWrites: 0, pendingWriteBytes: 0, closed: false };
    this.connections.set(socket, state);
    const prefix = `main_ipc_${role}_rx_`;
    const endDecode = () => {
      if (!state.decoding) return;
      const elapsed = Math.max(0, this.now() - state.decodeStartedAtMs);
      this.totals[`${prefix}decode_ms_total`] += elapsed;
      this.totals[`${prefix}decode_chunk_ms_max`] = Math.max(this.totals[`${prefix}decode_chunk_ms_max`], elapsed);
      state.decoding = false;
    };
    const close = () => {
      if (state.closed) return;
      endDecode();
      if (state.active) this.totals[`${prefix}abandoned_frames_total`] += 1;
      this.totals[`main_ipc_${role}_tx_abandoned_frames_total`] += state.pendingWrites;
      this.totals[`main_ipc_${role}_tx_abandoned_bytes_total`] += state.pendingWriteBytes;
      state.closed = true; this.connections.delete(socket); socket.off("close", close); socket.off("error", close);
    };
    socket.on("close", close); socket.on("error", close);
    return {
      begin: (bytes: number) => { if (!state.closed) { state.active = true; state.announcedBytes = bytes; state.receivedBytes = 0; state.startedAtMs = this.now(); this.totals[`${prefix}announced_frames_total`] += 1; this.totals[`${prefix}announced_bytes_total`] += bytes; this.totals[`${prefix}frame_bytes_max`] = Math.max(this.totals[`${prefix}frame_bytes_max`], bytes); } },
      decode: (bytes: number) => { if (!state.closed) { state.receivedBytes += bytes; state.decoding = true; state.decodeStartedAtMs = this.now(); } },
      endDecode,
      complete: (message: unknown) => { if (!state.closed) { endDecode(); const kind = classifyIpcFrame(message); this.totals[`${prefix}${kind}_frames_total`] += 1; this.totals[`${prefix}${kind}_bytes_total`] += state.announcedBytes; this.totals[`${prefix}${kind}_bytes_max`] = Math.max(this.totals[`${prefix}${kind}_bytes_max`], state.announcedBytes); state.active = false; } },
      fail: () => { if (!state.closed) { this.totals[`${prefix}failures_total`] += 1; close(); } }, close,
    };
  }

  beginWrite(socket: SocketLike, bytes: number): ((error?: unknown) => void) | undefined {
    const state = this.connections.get(socket); if (!state) return;
    const prefix = `main_ipc_${state.role}_tx_`;
    state.pendingWrites += 1; state.pendingWriteBytes += bytes;
    this.totals[`${prefix}frames_total`] += 1; this.totals[`${prefix}bytes_total`] += bytes;
    this.totals[`${prefix}frame_bytes_max`] = Math.max(this.totals[`${prefix}frame_bytes_max`], bytes);
    this.totals[`${prefix}socket_pending_bytes_max`] = Math.max(this.totals[`${prefix}socket_pending_bytes_max`], state.pendingWriteBytes);
    let done = false;
    return (error?: unknown) => { if (!done && !state.closed) { done = true; state.pendingWrites -= 1; state.pendingWriteBytes -= bytes; if (error != null) this.totals[`${prefix}write_failures_total`] += 1; } };
  }

  wrote(socket: SocketLike, accepted: boolean): void {
    const state = this.connections.get(socket); if (!state) return;
    const prefix = `main_ipc_${state.role}_tx_`;
    if (!accepted) this.totals[`${prefix}backpressure_total`] += 1;
    this.totals[`${prefix}socket_writable_bytes_max`] = Math.max(this.totals[`${prefix}socket_writable_bytes_max`], socket.writableLength);
  }

  snapshot(): Record<string, number> {
    const result = { ...this.totals, main_ipc_sample_monotonic_ms: this.now() };
    for (const role of ROLES) for (const key of ["connections", "rx_active_frames", "rx_active_announced_bytes", "rx_active_received_bytes", "rx_oldest_active_ms", "rx_decoding_frames", "tx_pending_frames", "tx_pending_bytes", "tx_writable_bytes"]) result[`main_ipc_${role}_${key}`] = 0;
    for (const state of this.connections.values()) {
      const prefix = `main_ipc_${state.role}_`; result[`${prefix}connections`] += 1;
      if (state.active) { result[`${prefix}rx_active_frames`] += 1; result[`${prefix}rx_active_announced_bytes`] += state.announcedBytes; result[`${prefix}rx_active_received_bytes`] += state.receivedBytes; result[`${prefix}rx_oldest_active_ms`] = Math.max(result[`${prefix}rx_oldest_active_ms`], result.main_ipc_sample_monotonic_ms - state.startedAtMs); }
      if (state.decoding) result[`${prefix}rx_decoding_frames`] += 1;
      result[`${prefix}tx_pending_frames`] += state.pendingWrites; result[`${prefix}tx_pending_bytes`] += state.pendingWriteBytes; result[`${prefix}tx_writable_bytes`] += state.socket.writableLength;
    }
    return result;
  }
}

export function classifyIpcFrame(value: any): typeof RX_KINDS[number] {
  if (value?.type === "request") return "other_request";
  if (value?.type === "response") return "other_response";
  if (value?.type !== "broadcast") return "unknown";
  if (value.method === "thread-stream-state-changed") return value.params?.change?.type === "snapshot" || value.params?.change?.type === "patches" ? value.params.change.type : "unknown";
  return value.method === "thread-stream-following-changed" || value.method === "thread-stream-following-status-requested" ? "follower_coordination" : "other_broadcast";
}

export const ipcMetrics = new IpcMetrics();
export { ipcMetrics as y };
