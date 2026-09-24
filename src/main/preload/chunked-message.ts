// 「宿主分块消息」协议的载荷校验（marker: codex-host-chunked-message-v1）。
//
// 大对象（如超长会话数据）从宿主流式发给渲染进程时按 token 分块；这里的
// 类型守卫保证渲染进程只把结构合法的消息继续派发。

interface ChunkTokenBase {
  type: string;
}

function isChunkToken(value: unknown): value is ChunkTokenBase & Record<string, unknown> {
  if (typeof value !== "object" || !value || !("type" in value)) return false;
  const token = value as Record<string, unknown>;
  switch (token.type) {
    case "array-start":
    case "object-start":
    case "container-end":
    case "string-end":
      return true;
    case "string-start":
      return "target" in token && (token.target === "key" || token.target === "value");
    case "key":
    case "string-chunk":
      return "value" in token && typeof token.value === "string";
    case "value":
      if (!("value" in token)) return true;
      return (
        token.value == null ||
        typeof token.value === "boolean" ||
        typeof token.value === "number" ||
        typeof token.value === "string"
      );
    default:
      return false;
  }
}

export function isChunkedHostMessage(value: unknown): boolean {
  if (
    typeof value !== "object" ||
    !value ||
    !("marker" in value) ||
    (value as Record<string, unknown>).marker !== "codex-host-chunked-message-v1" ||
    !("transferId" in value) ||
    typeof (value as Record<string, unknown>).transferId !== "string" ||
    !("sequence" in value) ||
    typeof (value as Record<string, unknown>).sequence !== "number" ||
    !Number.isSafeInteger((value as Record<string, unknown>).sequence) ||
    !("kind" in value)
  ) {
    return false;
  }
  const message = value as Record<string, unknown>;
  if (message.kind === "chunk") {
    return "tokens" in message && Array.isArray(message.tokens) && message.tokens.every(isChunkToken);
  }
  return message.kind === "start" || message.kind === "end";
}
