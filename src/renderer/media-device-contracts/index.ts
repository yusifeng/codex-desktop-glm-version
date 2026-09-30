// Media transport and device-permission contracts. Release chunk: contracts-96b363340ff1.js.
import "@rchunk/rolldown-runtime";

type TransportScope = { Local: "local"; Remote: "remote" };
type MediaKind = { Audio: "audio"; Video: "video" };
type DevicePermission = { Camera: "camera"; Microphone: "microphone"; ScreenShare: "screen_share" };
let transportScope: TransportScope | undefined;
let mediaKind: MediaKind | undefined;
let devicePermission: DevicePermission | undefined;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  transportScope = { Local: "local", Remote: "remote" };
  mediaKind = { Audio: "audio", Video: "video" };
  devicePermission = { Camera: "camera", Microphone: "microphone", ScreenShare: "screen_share" };
}
export { initialize as i, transportScope as n, devicePermission as r, mediaKind as t };
