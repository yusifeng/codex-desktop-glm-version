// 远程托管画中画（PIP）视频帧的解码转发。
//
// 主进程把远端视频流的编码帧发过来（REMOTE_HOSTED_PIP_VIDEO_FRAME 通道），
// 这里按 presentationID 维护 VideoDecoder 实例，解码出的帧以
// VideoFrame（转移所有权）postMessage 给页面；stop 消息按 threadID 清理。
import { ipcRenderer } from "electron";
import { REMOTE_HOSTED_PIP_VIDEO_FRAME } from "./ipc-channels";
import { createPipVideoDecoderController } from "./pip-video-decoder-controller";

const controller = createPipVideoDecoderController({
  createDecoder: (callbacks) => new VideoDecoder(callbacks),
  createChunk: (input) => new EncodedVideoChunk(input),
  getOrigin: () => window.location.origin,
  postFrame: (payload, origin, frame) => window.postMessage(payload, origin, [frame]),
  postError: (payload, origin) => window.postMessage(payload, origin),
});

/** 主题布局变化时，关闭已不在展示列表中的 presentation 的解码器。 */
export function disposeDecodersForRemovedPresentations(state: { activeThreadID: string; orderedPresentationIDs: string[] }) { controller.disposeRemoved(state); }

function handleVideoChunk(message: any) { controller.handle(message); }

export function registerPipVideoFrameHandler() {
  ipcRenderer.on(REMOTE_HOSTED_PIP_VIDEO_FRAME, (_event, message: any) => {
    if ("stopped" in message) {
      controller.stopThread(message.threadID);
      return;
    }
    handleVideoChunk(message);
  });
}
