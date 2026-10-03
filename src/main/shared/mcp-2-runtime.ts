import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";
interface WebSocketLike {
  readyState: number;
  on(event: string, listener: (...args: never[]) => void): this;
  off(event: string, listener: (...args: never[]) => void): this;
  send(value: string): void;
  close(code?: number, reason?: string): void;
  ping(): void;
}
interface WebSocketConstructor {
  new (url: string, options?: Record<string, unknown>): WebSocketLike;
  OPEN: number;
}
const WebSocketClient = require("ws") as WebSocketConstructor;
export const WebSocket = WebSocketClient;

export class WebSocketWrapper {
  readonly ws: WebSocketLike;
  readonly authenticatedPrincipal: unknown;
  readyState: number;
  onopen: ((event: { type: "open" }) => void) | null = null;
  onmessage: ((event: { type: "message"; data: string; receivedAtMs: number }) => void) | null = null;
  onerror: ((event: { type: "error"; error: unknown }) => void) | null = null;
  onclose: ((event: { type: "close"; code: number; reason: string; wasClean: boolean }) => void) | null = null;

  constructor(socket: WebSocketLike, authenticatedPrincipal?: unknown) {
    this.ws = socket;
    this.authenticatedPrincipal = authenticatedPrincipal;
    this.readyState = socket.readyState;
    socket.on("open", () => { this.readyState = socket.readyState; this.onopen?.({ type: "open" }); });
    socket.on("message", (data) => { this.onmessage?.({ type: "message", data: String(data), receivedAtMs: Date.now() }); });
    socket.on("error", (error) => { this.readyState = socket.readyState; this.onerror?.({ type: "error", error }); });
    socket.on("close", (...args) => { const [code, reason] = args as unknown as [number, Buffer]; this.readyState = socket.readyState; this.onclose?.({ type: "close", code, reason: String(reason ?? ""), wasClean: code === 1000 }); });
  }

  send(value: string): void {
    if (this.ws.readyState !== WebSocketClient.OPEN) throw new Error("Codex app-server websocket is not open");
    this.ws.send(value);
  }
  close(code?: number, reason?: string): void { this.ws.close(code, reason); }
}

export function attachHeartbeat(socket: WebSocketLike, options: { onPongTimeout: () => void; pingIntervalMs?: number; pongTimeoutMs?: number }): () => void {
  let lastPong = Date.now();
  let stopped = false;
  const onPong = () => { lastPong = Date.now(); };
  const interval = setInterval(() => {
    if (stopped || socket.readyState !== WebSocketClient.OPEN) return;
    if (Date.now() - lastPong > (options.pongTimeoutMs ?? 60_000)) { stopped = true; options.onPongTimeout(); return; }
    socket.ping();
  }, options.pingIntervalMs ?? 10_000);
  const dispose = () => { if (stopped) return; stopped = true; clearInterval(interval); socket.off("pong", onPong); socket.off("close", dispose); };
  socket.on("pong", onPong); socket.on("close", dispose);
  return dispose;
}

export interface StdioTransportOptions {
  executablePath?: string;
  args?: string[];
  spawnCommand?: string;
  spawnArgs?: string[];
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  onFinish?: () => void;
  onStreamError?: (error: Error) => void;
}

/** JSONL stdio transport used by local and WSL app-server connections. */
export class StdioTransport extends EventEmitter {
  readonly options: StdioTransportOptions;
  private process: ChildProcessWithoutNullStreams | null = null;
  private buffer = "";
  private closed = false;
  constructor(options: StdioTransportOptions) { super(); this.options = options; }
  async connect(): Promise<this> {
    const command = this.options.spawnCommand ?? this.options.executablePath;
    if (!command) throw new Error("Missing app-server executable path");
    this.process = spawn(command, this.options.spawnArgs ?? this.options.args ?? [], { stdio: "pipe", env: this.options.env, cwd: this.options.cwd });
    this.process.stdout.on("data", (chunk: Buffer | string) => {
      this.buffer += chunk.toString();
      let index: number;
      while ((index = this.buffer.indexOf("\n")) >= 0) {
        const line = this.buffer.slice(0, index).trim(); this.buffer = this.buffer.slice(index + 1);
        if (!line) continue;
        try { this.emit("message", JSON.parse(line)); } catch (error) { this.options.onStreamError?.(error as Error); this.emit("error", error); }
      }
    });
    this.process.stderr.on("data", (chunk) => this.emit("stderr", chunk.toString()));
    this.process.once("error", (error) => { this.emit("error", error); });
    this.process.once("close", (code, signal) => { this.closed = true; this.options.onFinish?.(); this.emit("close", { code, signal }); });
    queueMicrotask(() => this.emit("open", { type: "open" }));
    return this;
  }
  send(value: string): void { if (!this.process?.stdin || this.closed) throw new Error("Codex app-server process is not available"); this.process.stdin.write(`${value}\n`); }
  close(): void { if (!this.closed) this.process?.kill(); }
  getIoStatsSnapshot(): { bytesRead: number; bytesWritten: number } { return { bytesRead: 0, bytesWritten: 0 }; }
}

export { WebSocketWrapper as gn, attachHeartbeat as hn, StdioTransport as dn, WebSocket as _n };
