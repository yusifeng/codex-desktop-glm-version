// shared chunk：WebSocket URL 换算（ws-url 分区）。
//
// 对应 src-DldfpmrL.ts 的 L55,549（e3）：https → wss / 其他 → ws。

/** http(s) URL → WebSocket URL（原 `e3`，导出 `Wt`）。 */
export function toWebSocketUrl(url: string): string {
  const parsed = new URL(url);
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  return parsed.toString();
}

// 兼容导出（ws-url 分区 1 个压缩名）
export { toWebSocketUrl as Wt };
