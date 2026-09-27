import "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

interface WebMcpCall {
  description?: string;
  inputJson?: string;
  inputTruncated?: true;
  kind: "invokeTool" | "listTools";
  name: string;
  outputJson?: string;
  outputTruncated?: true;
  readOnlyHint?: boolean;
  sourceHostname?: string;
  title?: string;
}

function validOptionalString(value: unknown, nonEmpty = false): boolean {
  return (
    value == null ||
    (typeof value === "string" && (!nonEmpty || value.length > 0))
  );
}

function isWebMcpCall(value: unknown): value is WebMcpCall {
  if (value == null || typeof value !== "object") return false;
  const call = value as Record<string, unknown>;
  if (call.kind === "listTools") {
    if (call.name !== "webmcp_list_tools") return false;
  } else if (call.kind === "invokeTool") {
    if (typeof call.name !== "string" || call.name.trim().length === 0)
      return false;
  } else return false;
  return (
    validOptionalString(call.title, true) &&
    validOptionalString(call.description) &&
    validOptionalString(call.sourceHostname, true) &&
    validOptionalString(call.inputJson) &&
    validOptionalString(call.outputJson) &&
    (call.readOnlyHint == null || typeof call.readOnlyHint === "boolean") &&
    (call.inputTruncated == null || call.inputTruncated === true) &&
    (call.outputTruncated == null || call.outputTruncated === true)
  );
}

function webMcpCallsFromMetadata(metadata: unknown): WebMcpCall[] {
  if (metadata == null || typeof metadata !== "object") return [];
  const surface = (metadata as Record<string, unknown>)["codex/toolSurface"];
  if (surface == null || typeof surface !== "object") return [];
  const record = surface as Record<string, unknown>;
  if (
    record.kind !== "browserUse" ||
    !Array.isArray(record.webMcpCalls) ||
    !record.webMcpCalls.every(isWebMcpCall)
  )
    return [];
  return record.webMcpCalls;
}

function initializeWebMcpToolCalls(): void {}
export { initializeWebMcpToolCalls as n, webMcpCallsFromMetadata as t };
