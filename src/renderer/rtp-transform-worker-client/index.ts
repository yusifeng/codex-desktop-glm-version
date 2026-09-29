// RTP transform worker side effect. Release chunk: rtp-transform-worker.client-27691be44d13.js.
interface RtpFrameMetadata {
  rtpTimestamp?: number;
}

interface RtpTransformFrame {
  getMetadata?: () => RtpFrameMetadata | undefined;
}

interface RtpTransformer {
  readable: ReadableStream<RtpTransformFrame>;
  writable: WritableStream<RtpTransformFrame>;
  options?: { name?: string };
}

interface RtpTransformEvent extends Event {
  transformer: RtpTransformer;
}

interface RtpTimestampMessage {
  type: "outbound-audio-rtp-timestamp" | "inbound-audio-rtp-timestamp";
  rtpTimestamp: number;
}

const workerScope = self as unknown as {
  postMessage(message: RtpTimestampMessage): void;
};

addEventListener("rtctransform", (event: Event) => {
  const { transformer } = event as RtpTransformEvent;
  const readable = transformer.readable;
  const writable = transformer.writable;

  if (readable.locked || writable.locked) {
    return;
  }

  const transformName = transformer.options?.name;
  if (
    transformName !== "captureOutboundAudioRtpTimestamp" &&
    transformName !== "captureInboundAudioRtpTimestamp"
  ) {
    readable.pipeTo(writable).catch(() => {});
    return;
  }

  const timestampTransform = new TransformStream<RtpTransformFrame, RtpTransformFrame>({
    transform(frame, controller) {
      const rtpTimestamp = frame.getMetadata?.()?.rtpTimestamp;
      if (Number.isFinite(rtpTimestamp)) {
        workerScope.postMessage({
          type:
            transformName === "captureOutboundAudioRtpTimestamp"
              ? "outbound-audio-rtp-timestamp"
              : "inbound-audio-rtp-timestamp",
          rtpTimestamp: rtpTimestamp as number,
        });
      }
      controller.enqueue(frame);
    },
  });

  readable.pipeThrough(timestampTransform).pipeTo(writable).catch(() => {});
});

export {};
