// 系统音频频谱捕获：管理 system-audio-spectrum 原生辅助进程的生命周期。
//
// 首个订阅者到达时启动子进程，解析它 stdout 上的逐行 JSON 消息（ready /
// levels / error）；最后一个订阅者离开时停止。60 秒内没有 ready 视为失败，
// 停止时先友好结束（关 stdin + SIGTERM），2 秒后仍存活则 SIGKILL。
import { spawn } from "node:child_process";
import { join } from "node:path";
import { app } from "electron";
import {
  bf as literalSchema,
  Cf as numberSchema,
  hf as arraySchema,
  Of as stringSchema,
  qn as executableResolver,
  vf as discriminatedUnionSchema,
  wf as objectSchema,
} from "@chunk/shared";

type SpectrumProcessMessage =
  | { type: "ready"; sampleRate: number }
  | { type: "levels"; levels: number[] }
  | { type: "error"; operation: string };

type SpectrumEvent =
  | { type: "ready" }
  | { type: "levels"; levels: number[] }
  | { type: "error"; reason: "permission-denied" | "capture-failed" };

const spectrumMessageSchema = discriminatedUnionSchema("type", [
  objectSchema({
    type: literalSchema("ready"),
    sampleRate: numberSchema().positive(),
  }),
  objectSchema({
    type: literalSchema("levels"),
    levels: arraySchema(numberSchema().min(0).max(1)).length(24),
  }),
  objectSchema({ type: literalSchema("error"), operation: stringSchema() }),
]);

const READY_TIMEOUT_MS = 60_000;
const GRACEFUL_KILL_TIMEOUT_MS = 2_000;
// 单行 JSON 超过该长度说明对端发的不是协议内的消息，按失败处理。
const MAX_LINE_BUFFER_BYTES = 4096;

export class SpectrumCapture {
  #subscribers = new Set<(event: SpectrumEvent) => void>();
  #process: ReturnType<typeof spawn> | undefined;
  #readyTimeout: ReturnType<typeof setTimeout> | undefined;
  #isReady = false;

  subscribe(listener: (event: SpectrumEvent) => void): () => void {
    this.#subscribers.add(listener);
    if (this.#process == null) {
      this.#startProcess();
    } else if (this.#isReady) {
      listener({ type: "ready" });
    }
    return () => {
      this.#subscribers.delete(listener);
      if (this.#subscribers.size === 0) this.#stopProcess();
    };
  }

  #startProcess() {
    const executable = app.isPackaged
      ? join(process.resourcesPath, "native", "system-audio-spectrum")
      : join(
          app.getAppPath(),
          "native/system-audio-spectrum/build",
          `Release-${process.arch}`,
          "system-audio-spectrum",
        );
    const child = spawn(executableResolver.resolve(executable) ?? executable, [], {
      stdio: ["pipe", "pipe", "ignore"],
    });
    this.#process = child;
    this.#readyTimeout = setTimeout(() => this.#fail(child), READY_TIMEOUT_MS);
    this.#readyTimeout.unref();

    let lineBuffer = "";
    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => {
      if (this.#process !== child) return;
      lineBuffer += chunk;
      let newlineIndex = lineBuffer.indexOf("\n");
      for (; newlineIndex !== -1 && this.#process === child; ) {
        const line = lineBuffer.slice(0, newlineIndex);
        lineBuffer = lineBuffer.slice(newlineIndex + 1);
        try {
          const parsed = spectrumMessageSchema.safeParse(JSON.parse(line)) as {
            success: boolean;
            data: SpectrumProcessMessage;
          };
          if (!parsed.success) {
            this.#fail(child);
            return;
          }
          const message = parsed.data;
          if (message.type === "error") {
            this.#fail(child, message.operation === "permission" ? "permission-denied" : "capture-failed");
            return;
          }
          if (message.type === "ready") {
            this.#isReady = true;
            clearTimeout(this.#readyTimeout);
          }
          for (const subscriber of this.#subscribers)
            subscriber(message.type === "ready" ? { type: "ready" } : message);
        } catch {
          this.#fail(child);
        }
        newlineIndex = lineBuffer.indexOf("\n");
      }
      if (lineBuffer.length > MAX_LINE_BUFFER_BYTES) this.#fail(child);
    });
    child.once("error", () => this.#fail(child));
    child.once("exit", () => this.#fail(child));
  }

  #stopProcess() {
    const child = this.#process;
    this.#process = undefined;
    this.#isReady = false;
    clearTimeout(this.#readyTimeout);
    this.#readyTimeout = undefined;
    if (child == null) return;
    child.stdin?.end();
    if (child.exitCode != null || child.signalCode != null) return;
    // 已经退出的进程不需要强杀；否则先 kill（SIGTERM），2 秒后仍存活则 SIGKILL。
    const killTimer = setTimeout(() => child.kill("SIGKILL"), GRACEFUL_KILL_TIMEOUT_MS);
    killTimer.unref();
    child.once("exit", () => clearTimeout(killTimer));
    child.kill();
  }

  #fail(child: ReturnType<typeof spawn>, reason: "permission-denied" | "capture-failed" = "capture-failed") {
    if (this.#process !== child) return;
    for (const subscriber of this.#subscribers) subscriber({ type: "error", reason });
  }
}
