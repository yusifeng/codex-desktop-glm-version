// 远程托管画中画（PIP）视频帧的解码转发。
//
// 主进程把远端视频流的编码帧发过来（REMOTE_HOSTED_PIP_VIDEO_FRAME 通道），
// 这里按 presentationID 维护 VideoDecoder 实例，解码出的帧以
// VideoFrame（转移所有权）postMessage 给页面；stop 消息按 threadID 清理。
import { ipcRenderer } from "electron";
import { REMOTE_HOSTED_PIP_VIDEO_FRAME } from "./ipc-channels";

interface PipDecoderEntry {
  configuration: Uint8Array;
  decoder: VideoDecoder;
  threadID: string;
}

interface PipVideoChunkMessage {
  presentationID: string;
  threadID: string;
  codec: string;
  timestamp: number;
  videoData: BufferSource;
  isKeyFrame: boolean;
  decoderConfiguration?: Uint8Array | null;
}

interface PipVideoStopMessage {
  stopped: true;
  threadID: string;
}

const decoders = new Map<string, PipDecoderEntry>();

function sameConfiguration(a: Uint8Array, b: Uint8Array | null | undefined): boolean {
  if (b == null) return false;
  return a.length === b.length && a.every((byte, index) => byte === b[index]);
}

/** 主题布局变化时，关闭已不在展示列表中的 presentation 的解码器。 */
export function disposeDecodersForRemovedPresentations(state: {
  activeThreadID: string;
  orderedPresentationIDs: string[];
}) {
  for (const [presentationID, entry] of decoders) {
    if (
      entry.threadID === state.activeThreadID &&
      !state.orderedPresentationIDs.includes(presentationID)
    ) {
      entry.decoder.close();
      decoders.delete(presentationID);
    }
  }
}

function handleVideoChunk(message: PipVideoChunkMessage) {
  const { presentationID } = message;
  let entry = decoders.get(presentationID);
  if (entry == null) {
    // 新 presentation 必须从关键帧 + 解码器配置开始。
    if (!message.isKeyFrame || message.decoderConfiguration == null) return;
    const decoder = new VideoDecoder({
      output: (frame) => {
        const origin = window.location.origin;
        if (origin === "null") {
          frame.close();
          return;
        }
        window.postMessage(
          {
            frame,
            presentationID,
            threadID: message.threadID,
            type: "remote-hosted-pip-video-frame",
          },
          origin,
          [frame],
        );
      },
      error: () => {
        if (decoders.get(presentationID)?.decoder !== decoder) return;
        decoders.delete(presentationID);
        const origin = window.location.origin;
        if (origin !== "null") {
          window.postMessage(
            { presentationID, threadID: message.threadID, type: "remote-hosted-pip-video-error" },
            origin,
          );
        }
      },
    });
    decoder.configure({
      codec: message.codec,
      description: message.decoderConfiguration,
      hardwareAcceleration: "prefer-hardware",
      optimizeForLatency: true,
    });
    entry = { configuration: message.decoderConfiguration, decoder, threadID: message.threadID };
    decoders.set(presentationID, entry);
  } else if (
    message.isKeyFrame &&
    message.decoderConfiguration != null &&
    !sameConfiguration(entry.configuration, message.decoderConfiguration)
  ) {
    // 流的编码参数变了：重置并重新配置解码器。
    entry.decoder.reset();
    entry.decoder.configure({
      codec: message.codec,
      description: message.decoderConfiguration,
      hardwareAcceleration: "prefer-hardware",
      optimizeForLatency: true,
    });
    entry.configuration = message.decoderConfiguration;
  }
  if (entry.decoder.state === "configured") {
    entry.decoder.decode(
      new EncodedVideoChunk({
        data: message.videoData,
        timestamp: message.timestamp,
        type: message.isKeyFrame ? "key" : "delta",
      }),
    );
  }
}

export function registerPipVideoFrameHandler() {
  ipcRenderer.on(REMOTE_HOSTED_PIP_VIDEO_FRAME, (_event, message: PipVideoChunkMessage | PipVideoStopMessage) => {
    if ("stopped" in message) {
      for (const [presentationID, entry] of decoders) {
        if (entry.threadID === message.threadID) {
          entry.decoder.close();
          decoders.delete(presentationID);
        }
      }
      return;
    }
    handleVideoChunk(message);
  });
}
