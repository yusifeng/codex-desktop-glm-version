type PipVideoDecoderControllerDependencies = {
  createDecoder: (callbacks: { output: (frame: any) => void; error: () => void }) => any;
  createChunk: (input: { data: BufferSource; timestamp: number; type: `key` | `delta` }) => any;
  getOrigin: () => string;
  postFrame: (payload: any, origin: string, frame: any) => void;
  postError: (payload: any, origin: string) => void;
};

type PipVideoChunk = {
  presentationID: string;
  threadID: string;
  codec: string;
  timestamp: number;
  videoData: BufferSource;
  isKeyFrame: boolean;
  decoderConfiguration?: Uint8Array | null;
};

/** Owns remote PIP decoder state, configuration rollover, stop, and layout cleanup lifecycles. */
function createPipVideoDecoderController(dependencies: PipVideoDecoderControllerDependencies) {
  const decoders = new Map<string, { configuration: Uint8Array; decoder: any; threadID: string }>();
  const sameConfiguration = (a: Uint8Array, b: Uint8Array | null | undefined) =>
    b != null && a.length === b.length && a.every((byte, index) => byte === b[index]);
  const close = (presentationID: string) => {
    const entry = decoders.get(presentationID);
    if (entry == null) return false;
    entry.decoder.close();
    decoders.delete(presentationID);
    return true;
  };
  const handle = (message: PipVideoChunk) => {
    let entry = decoders.get(message.presentationID);
    if (entry == null) {
      if (!message.isKeyFrame || message.decoderConfiguration == null) return false;
      const decoder = dependencies.createDecoder({
        output: (frame) => {
          const origin = dependencies.getOrigin();
          if (origin === `null`) return frame.close();
          dependencies.postFrame({ frame, presentationID: message.presentationID, threadID: message.threadID, type: `remote-hosted-pip-video-frame` }, origin, frame);
        },
        error: () => {
          if (decoders.get(message.presentationID)?.decoder !== decoder) return;
          decoders.delete(message.presentationID);
          const origin = dependencies.getOrigin();
          if (origin !== `null`) dependencies.postError({ presentationID: message.presentationID, threadID: message.threadID, type: `remote-hosted-pip-video-error` }, origin);
        },
      });
      decoder.configure({ codec: message.codec, description: message.decoderConfiguration, hardwareAcceleration: `prefer-hardware`, optimizeForLatency: true });
      entry = { configuration: message.decoderConfiguration, decoder, threadID: message.threadID };
      decoders.set(message.presentationID, entry);
    } else if (message.isKeyFrame && message.decoderConfiguration != null && !sameConfiguration(entry.configuration, message.decoderConfiguration)) {
      entry.decoder.reset();
      entry.decoder.configure({ codec: message.codec, description: message.decoderConfiguration, hardwareAcceleration: `prefer-hardware`, optimizeForLatency: true });
      entry.configuration = message.decoderConfiguration;
    }
    if (entry.decoder.state === `configured`) entry.decoder.decode(dependencies.createChunk({ data: message.videoData, timestamp: message.timestamp, type: message.isKeyFrame ? `key` : `delta` }));
    return true;
  };
  const stopThread = (threadID: string) => {
    for (const [presentationID, entry] of decoders) if (entry.threadID === threadID) close(presentationID);
  };
  const disposeRemoved = (state: { activeThreadID: string; orderedPresentationIDs: string[] }) => {
    for (const [presentationID, entry] of decoders) if (entry.threadID === state.activeThreadID && !state.orderedPresentationIDs.includes(presentationID)) close(presentationID);
  };
  return { handle, stopThread, disposeRemoved, close };
}

export { createPipVideoDecoderController };
if (typeof module !== `undefined`) module.exports = { createPipVideoDecoderController };
