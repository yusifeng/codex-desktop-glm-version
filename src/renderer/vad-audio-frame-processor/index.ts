// Voice-activity audio frame worklet. Release chunk: vad-audio-frame-processor-b6bea101f49a.js.
declare const sampleRate: number;
declare abstract class AudioWorkletProcessor {
  readonly port: {
    postMessage(message: unknown, transfer?: Transferable[]): void;
  };
  constructor(options?: unknown);
}
declare function registerProcessor(
  name: string,
  processor: new (options?: unknown) => AudioWorkletProcessor,
): void;

interface ProcessorOptions {
  processorOptions?: { frameDurationMs?: unknown };
}

function hasProcessorOptions(value: unknown): value is ProcessorOptions {
  return (
    typeof value === "object" && value !== null && "processorOptions" in value
  );
}
function appendSamples(
  pending: Float32Array,
  incoming: Float32Array,
): Float32Array {
  if (pending.length === 0) return incoming.slice();
  const combined = new Float32Array(pending.length + incoming.length);
  combined.set(pending);
  combined.set(incoming, pending.length);
  return combined;
}

class VoiceVadFrameProcessor extends AudioWorkletProcessor {
  private readonly frameSize: number;
  private pendingSamples: Float32Array<ArrayBufferLike> = new Float32Array();

  constructor(options?: unknown) {
    super(options);
    const processorOptions = hasProcessorOptions(options)
      ? options.processorOptions
      : undefined;
    const frameDurationMs =
      typeof processorOptions?.frameDurationMs === "number"
        ? processorOptions.frameDurationMs
        : 10;
    this.frameSize = Math.max(
      1,
      Math.round((sampleRate * frameDurationMs) / 1_000),
    );
  }

  process(inputs: Float32Array[][]): true {
    const samples = inputs[0]?.[0];
    if (!samples || samples.length === 0) return true;
    this.pendingSamples = appendSamples(this.pendingSamples, samples);
    let consumed = 0;
    while (this.pendingSamples.length - consumed >= this.frameSize) {
      const frame = this.pendingSamples.slice(
        consumed,
        consumed + this.frameSize,
      );
      this.port.postMessage(
        { payload: { sampleRate, samples: frame }, type: "frame" },
        [frame.buffer],
      );
      consumed += this.frameSize;
    }
    this.pendingSamples = this.pendingSamples.slice(consumed);
    return true;
  }
}

registerProcessor("voice-vad-frame-processor", VoiceVadFrameProcessor);
