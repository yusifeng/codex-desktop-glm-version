// Buffered realtime audio worklet. Release chunk: realtime-buffered-audio-worklet-773c5f6cc0c3.js.
declare const sampleRate: number;
declare abstract class AudioWorkletProcessor {
  readonly port: {
    onmessage: ((event: { data?: unknown }) => void) | null;
    postMessage(message: unknown): void;
  };
  constructor(options?: unknown);
}
declare function registerProcessor(
  name: string,
  processor: new (options?: unknown) => AudioWorkletProcessor,
): void;

type QueuePhase = "buffering" | "live" | "replaying";
interface QueueOptions {
  capacitySamples: number;
  leadingSilenceThreshold: number;
  preRollSamples: number;
}
interface ReleaseMessage {
  type: "release";
}
interface MuteMessage {
  type: "mute";
  muted: boolean;
  requestId?: unknown;
}

function isMessage(value: unknown): value is ReleaseMessage | MuteMessage {
  return typeof value === "object" && value !== null && "type" in value;
}

class BufferedAudioQueue {
  private readonly samples: Float32Array<ArrayBufferLike>;
  private length = 0;
  private phase: QueuePhase = "buffering";
  private readOffset = 0;
  private muted = false;

  constructor(private readonly options: QueueOptions) {
    this.samples = new Float32Array(options.capacitySamples);
  }

  process(input: Float32Array | undefined, output: Float32Array): void {
    output.fill(0);
    if (this.muted) return;
    switch (this.phase) {
      case "buffering":
        this.append(input);
        break;
      case "live":
        this.copyInput(input, output);
        break;
      case "replaying":
        if (this.hasSignal(input)) this.append(input);
        for (let index = 0; index < output.length; index += 1) {
          if (this.length === 0) {
            this.phase = "live";
            this.copyInput(input, output, index);
            break;
          }
          output[index] = this.shift();
        }
        if (this.length === 0) this.phase = "live";
        break;
    }
  }

  release(): void {
    if (this.phase !== "buffering") return;
    const firstSignalOffset = this.findFirstSignalOffset();
    if (firstSignalOffset == null) {
      this.length = 0;
      this.phase = "live";
      return;
    }
    const trimCount = Math.max(
      0,
      firstSignalOffset - this.options.preRollSamples,
    );
    this.readOffset =
      (this.readOffset + trimCount) % this.options.capacitySamples;
    this.length -= trimCount;
    this.phase = "replaying";
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!muted) return;
    this.samples.fill(0);
    this.length = 0;
    this.readOffset = 0;
    if (this.phase === "replaying") this.phase = "live";
  }

  private append(input: Float32Array | undefined): void {
    if (!input) return;
    for (const sample of input) {
      if (this.length === this.options.capacitySamples) {
        this.readOffset = (this.readOffset + 1) % this.options.capacitySamples;
        this.length -= 1;
      }
      const writeOffset =
        (this.readOffset + this.length) % this.options.capacitySamples;
      this.samples[writeOffset] = sample;
      this.length += 1;
    }
  }

  private copyInput(
    input: Float32Array | undefined,
    output: Float32Array,
    start = 0,
  ): void {
    if (!input) return;
    for (
      let index = start;
      index < output.length && index < input.length;
      index += 1
    ) {
      output[index] = input[index] ?? 0;
    }
  }

  private findFirstSignalOffset(): number | null {
    for (let offset = 0; offset < this.length; offset += 1) {
      const index = (this.readOffset + offset) % this.options.capacitySamples;
      if (
        Math.abs(this.samples[index] ?? 0) >=
        this.options.leadingSilenceThreshold
      ) {
        return offset;
      }
    }
    return null;
  }

  private hasSignal(input: Float32Array | undefined): boolean {
    return (
      input?.some(
        (sample) => Math.abs(sample) >= this.options.leadingSilenceThreshold,
      ) ?? false
    );
  }

  private shift(): number {
    const sample = this.samples[this.readOffset] ?? 0;
    this.readOffset = (this.readOffset + 1) % this.options.capacitySamples;
    this.length -= 1;
    return sample;
  }
}

class RealtimeBufferedAudioProcessor extends AudioWorkletProcessor {
  private readonly queue = new BufferedAudioQueue({
    capacitySamples: sampleRate * 30,
    leadingSilenceThreshold: 0.003,
    preRollSamples: sampleRate * 0.1,
  });

  constructor() {
    super();
    this.port.onmessage = (event) => {
      if (!isMessage(event.data)) return;
      if (event.data.type === "release") this.queue.release();
      else if (event.data.type === "mute") {
        this.queue.setMuted(event.data.muted);
        this.port.postMessage({
          type: "mute-applied",
          muted: event.data.muted,
          requestId: event.data.requestId,
        });
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): true {
    const output = outputs[0]?.[0];
    if (output) this.queue.process(inputs[0]?.[0], output);
    return true;
  }
}

registerProcessor(
  "codex-realtime-buffered-audio",
  RealtimeBufferedAudioProcessor,
);

export {};
