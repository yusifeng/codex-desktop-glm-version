/** Codex Web 入口（原 `_Me` / 压缩导出 `NX`）。 */
export const CODEX_WEB_URL = "https://chatgpt.com/codex";

export interface ParsedCodexDeepLink {
  destination: string;
  url: URL;
}

/**
 * 解析桌面端 `codex:` / `codex-dev:` deep link（原 `vMe` / `jX`）。
 * 带认证信息或端口的 URL 仍会被识别，但目的地标为 unsupported。
 */
export function parseCodexDeepLink(
  input: string | URL,
): ParsedCodexDeepLink | null {
  const url = typeof input === "string" ? URL.parse(input) : input;
  if (
    url == null ||
    (url.protocol !== "codex:" && url.protocol !== "codex-dev:")
  ) {
    return null;
  }
  return {
    destination:
      url.username === "" && url.password === "" && url.port === ""
        ? url.host
        : "unsupported",
    url,
  };
}

export interface CodexDelegationPayload {
  input: string;
  sourceThreadId: string;
}

export interface CodexToolOutput {
  name: string;
  namespace: string;
  output: unknown;
}

const DELEGATION_TOOL_NAMES = new Set([
  "create_thread",
  "handoff_thread",
  "send_message_to_thread",
]);

function decodeDelegationXmlText(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function extractDelegationField(xml: string, field: string): string | null {
  const value = new RegExp(
    `<${field}>\\s*([\\s\\S]*?)\\s*<\\/${field}>`,
    "i",
  ).exec(xml)?.[1].trim() ?? null;
  return value == null ? null : decodeDelegationXmlText(value);
}

/** 解析 Codex delegation XML（原 `xMe` / 压缩导出 `AX`）。 */
export function parseCodexDelegation(
  output: string,
): CodexDelegationPayload | null {
  const xml = output.trim();
  if (
    !xml.startsWith("<codex_delegation>") ||
    !xml.endsWith("</codex_delegation>")
  ) {
    return null;
  }
  const sourceThreadId = extractDelegationField(xml, "source_thread_id");
  const input = extractDelegationField(xml, "input");
  return sourceThreadId == null || input == null
    ? null
    : { input, sourceThreadId };
}

/**
 * 从允许产生 delegation 的 codex_app 工具结果中提取原始 XML（原 `bMe` /
 * 压缩导出 `OX`）。校验成功后保留调用方传入的原始空白。
 */
export function extractCodexDelegationToolOutput(
  toolOutput: CodexToolOutput,
): string | null {
  return toolOutput.namespace === "codex_app" &&
    DELEGATION_TOOL_NAMES.has(toolOutput.name) &&
    typeof toolOutput.output === "string" &&
    parseCodexDelegation(toolOutput.output) != null
    ? toolOutput.output
    : null;
}

/** Codex URL lazy initializer（原 `_L` / 压缩导出 `PX`）。 */
export function initializeCodexWebUrl(): void {}

/** Codex delegation lazy initializer（原 `yMe` / 压缩导出 `MX`）。 */
export function initializeCodexDelegationParser(): void {}
