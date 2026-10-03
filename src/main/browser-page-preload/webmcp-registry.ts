type ToolRecord = {
  name: string;
  registrationId: string;
  description: string;
  execute: (input: unknown, context: { requestUserInteraction(): Promise<never> }) => unknown;
  signal?: AbortSignal;
  title?: string;
  inputSchema?: string;
  annotations?: Record<string, unknown>;
};

const toolNamePattern = /^[A-Za-z0-9_.-]{1,128}$/;

function requireSecureContext(locationLike: Location): void {
  if (globalThis.isSecureContext !== true)
    throw new DOMException(`WebMCP requires a secure context.`, `SecurityError`);
  if (locationLike.protocol !== `file:` && globalThis.originAgentCluster !== true)
    throw new DOMException(`WebMCP requires an origin-keyed agent cluster.`, `SecurityError`);
}

function validateToolName(value: unknown): string {
  if (typeof value !== `string` || !toolNamePattern.test(value))
    throw new DOMException(
      `WebMCP tool names must contain 1-128 ASCII letters, digits, underscores, hyphens, or periods.`,
      `InvalidStateError`,
    );
  return value;
}

function serializeResult(value: unknown, stringify: (value: unknown) => string | undefined): unknown {
  const normalized = value === undefined ? null : value;
  try {
    const result = stringify(normalized);
    if (result === undefined) throw Error();
    return result;
  } catch {
    throw Error(`WebMCP tool result is not JSON-serializable.`);
  }
}

function createWebMcpRegistry({
  locationLike = globalThis.location,
  onToolsChanged,
}: { locationLike?: Location; onToolsChanged?: () => void } = {}) {
  const tools = new Map<string, ToolRecord>();
  const randomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
  const registrationId = () => `${randomValues(new Uint32Array(4)).join(`-`)}`;
  const stringify = JSON.stringify;
  const parse = JSON.parse;
  const defer = globalThis.setTimeout.bind(globalThis);
  const context = Object.freeze({
    async requestUserInteraction(): Promise<never> {
      throw Error(`requestUserInteraction is not supported by the Codex WebMCP shim.`);
    },
  });

  const notify = () => {
    try { onToolsChanged?.(); } catch {}
  };
  const descriptor = (tool: ToolRecord) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema ?? null,
    ...(tool.title == null ? {} : { title: tool.title }),
    ...(tool.annotations == null ? {} : { annotations: { ...tool.annotations } }),
    ...(locationLike.origin == null ? {} : { origin: locationLike.origin }),
    ...(locationLike.href == null ? {} : { pageUrl: locationLike.href }),
  });
  const execute = async (tool: unknown, input: unknown, serialized: boolean) => {
    requireSecureContext(locationLike);
    let parsed: unknown;
    try {
      parsed = serialized ? parse(input as string) : input;
    } catch {
      throw Error(serialized
        ? `WebMCP executeTool requires a JSON-stringified input.`
        : `WebMCP executeTool requires a JSON-serializable object input.`);
    }
    if (typeof parsed !== `object` || !parsed) throw Error(`WebMCP executeTool requires an object input.`);
    const name = validateToolName((tool as { name?: unknown })?.name);
    const record = tools.get(name);
    if (record == null || record.signal?.aborted)
      throw Error(serialized ? `WebMCP tool ${JSON.stringify(name)} is stale. Call fetchTools() again.` : `WebMCP tool not found: ${name}`);
    if (serialized && record.registrationId !== (tool as { registrationId?: unknown })?.registrationId)
      throw Error(`WebMCP tool ${JSON.stringify(name)} is stale. Call fetchTools() again.`);
    return serializeResult(await record.execute(parsed, context), stringify);
  };

  return Object.freeze({
    async registerTool(tool: Record<string, unknown>, options?: { signal?: AbortSignal }) {
      requireSecureContext(locationLike);
      const name = validateToolName(tool?.name);
      if (tools.has(name)) throw new DOMException(`WebMCP tool ${JSON.stringify(name)} is already registered.`, `InvalidStateError`);
      if (typeof tool.description !== `string` || tool.description.length === 0)
        throw new DOMException(`WebMCP tools must have a non-empty description.`, `InvalidStateError`);
      if (typeof tool.execute !== `function`) throw Error(`WebMCP tool ${name} is missing an execute callback.`);
      const inputSchema = tool.inputSchema === undefined ? undefined : stringify(tool.inputSchema);
      if (tool.inputSchema !== undefined && (typeof tool.inputSchema !== `object` || !tool.inputSchema))
        throw TypeError(`WebMCP tool inputSchema must be an object.`);
      if (tool.inputSchema !== undefined && inputSchema === undefined)
        throw Error(`WebMCP tool inputSchema must be JSON-serializable.`);
      const signal = options?.signal;
      if (signal?.aborted) throw signal.reason;
      if (signal != null && typeof signal.addEventListener !== `function`)
        throw Error(`WebMCP tool registration signal must support abort events.`);
      const record: ToolRecord = {
        name, registrationId: registrationId(), description: tool.description as string,
        execute: tool.execute as ToolRecord[`execute`], ...(signal == null ? {} : { signal }),
        ...(tool.title == null ? {} : { title: tool.title as string }),
        ...(inputSchema === undefined ? {} : { inputSchema }),
        ...(tool.annotations == null ? {} : { annotations: { ...(tool.annotations as object) } }),
      };
      return new Promise<void>((resolve, reject) => {
        signal?.addEventListener(`abort`, () => {
          reject(signal.reason);
          if (tools.get(name) === record) { tools.delete(name); notify(); }
        }, { once: true });
        if (signal?.aborted) { reject(signal.reason); return; }
        tools.set(name, record); notify(); defer(resolve, 0);
      });
    },
    async getTools() { requireSecureContext(locationLike); return [...tools.values()].filter((tool) => !tool.signal?.aborted).map(descriptor); },
    codexGetTools() { requireSecureContext(locationLike); return [...tools.values()].filter((tool) => !tool.signal?.aborted).map((tool) => ({ ...descriptor(tool), registrationId: tool.registrationId })); },
    executeTool(tool: unknown, input: unknown) { return execute(tool, input, false); },
    codexExecuteTool(tool: unknown, input: string) { return execute(tool, input, true); },
  });
}

export { createWebMcpRegistry };
if (typeof module !== `undefined`) module.exports = { createWebMcpRegistry };
