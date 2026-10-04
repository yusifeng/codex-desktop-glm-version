// MCP App Sandbox 的 guest 侧 preload。
//
// 运行在 web-sandbox.oaiusercontent.com 的 iframe 里。宿主窗口通过
// postMessage 发来 init 消息（携带一组 MessagePort + 一个 replyPort）；
// 本模块验证 origin / initId / port 白名单后，把 port 所有权经 IPC 转交给
// 主进程，由主进程完成沙箱与宿主的对接。
import { ipcRenderer } from "electron";
import {
  ALL_ALLOWED_PORT_NAMES,
  REQUIRED_PORT_NAMES,
  extractInitId,
  getTargetOrigin,
  isValidPort,
} from "./sandbox-guest-policy";

/** 与主进程约定的 guest → main IPC 通道。 */
const MCP_SANDBOX_GUEST_CHANNEL = "codex_desktop:mcp-app-sandbox-guest-message";

/** 防止重复初始化。 */
let initialized = false;

function isCurrentPageSkybridge(): boolean {
  return getTargetOrigin(window.location.href, { requireSkybridge: true }) === window.location.origin;
}

window.addEventListener("message", (event: MessageEvent) => {
  const messageType = event.data != null && typeof event.data === "object" ? event.data.type : void 0;
  if (
    event.source !== window ||
    !isCurrentPageSkybridge() ||
    event.data == null ||
    typeof event.data !== "object" ||
    messageType !== "init"
  ) {
    return;
  }
  const ports = event.data.ports;
  const replyPort = event.data.replyPort;
  if (typeof ports !== "object" || !ports || !isValidPort(replyPort) || initialized) return;

  const initId = extractInitId(window.location.href);
  if (initId == null) return;

  // 可选 port 只收集实际存在且合法的；必需 port 缺任何一个都拒绝初始化。
  const presentPortNames = ALL_ALLOWED_PORT_NAMES.filter((name) =>
    isValidPort(Reflect.get(ports, name)),
  );
  if (REQUIRED_PORT_NAMES.filter((name) => !isValidPort(Reflect.get(ports, name))).length > 0)
    return;

  const portList = [...presentPortNames];
  const portValues = portList.map((name) => {
    const port = Reflect.get(ports, name);
    if (!isValidPort(port)) throw new Error(`Missing required MCP sandbox frame port: ${name}`);
    return port;
  });

  initialized = true;
  ipcRenderer.postMessage(
    MCP_SANDBOX_GUEST_CHANNEL,
    { origin: window.location.origin, initId, portNames: portList, type: "init" },
    [...portValues, replyPort],
  );
});
