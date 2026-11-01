type Deferred = { promise: Promise<unknown>; resolve(value: unknown): void; reject(error: unknown): void };
type DynamicAppToolResultParser = { safeParse(input: unknown): { success: boolean; data?: unknown; error?: unknown } };
type DynamicAppToolResultParserSource = DynamicAppToolResultParser | (() => DynamicAppToolResultParser | undefined);

function fallbackParseDynamicAppToolResult(input: unknown): { success: boolean; data?: unknown; error?: unknown } {
  if (input == null || typeof input !== `object`) return { success: false, error: `result must be an object` };
  const value = input as { contentItems?: unknown; success?: unknown };
  if (typeof value.success !== `boolean` || !Array.isArray(value.contentItems))
    return { success: false, error: `result must contain success and contentItems` };
  const valid = value.contentItems.every((item) => {
    if (item == null || typeof item !== `object`) return false;
    const content = item as { type?: unknown; text?: unknown; imageUrl?: unknown; audioUrl?: unknown };
    return content.type === `inputText`
      ? typeof content.text === `string`
      : content.type === `inputImage`
        ? typeof content.imageUrl === `string`
        : content.type === `inputAudio` && typeof content.audioUrl === `string`;
  });
  return valid ? { success: true, data: input } : { success: false, error: `invalid content item` };
}

/** Owns pending dynamic app-tool response identity, routing, cancellation, and disposal. */
class DynamicAppToolPendingResponses {
  pending = new Map<string, Deferred>();
  constructor(private readonly resultSchemaSource: DynamicAppToolResultParserSource) {}
  private resultSchema(): DynamicAppToolResultParser | undefined {
    return typeof this.resultSchemaSource === `function`
      ? this.resultSchemaSource()
      : this.resultSchemaSource;
  }
  wait(id: string | number): Promise<unknown> {
    const key = pendingKey(id);
    if (this.pending.has(key)) throw new Error(`Dynamic app tool call ${String(id)} is pending`);
    let resolve!: (value: unknown) => void; let reject!: (error: unknown) => void;
    const promise = new Promise<unknown>((res, rej) => { resolve = res; reject = rej; });
    this.pending.set(key, { promise, resolve, reject });
    return promise;
  }
  discard(id: string | number) { this.pending.delete(pendingKey(id)); }
  cancel(id: string | number) {
    const key = pendingKey(id); const deferred = this.pending.get(key);
    if (deferred != null) { this.pending.delete(key); deferred.reject(new Error(`Dynamic app tool call cancelled`)); }
  }
  route(response: { id: string | number; error?: { message: string } | null; result?: unknown }): boolean {
    const key = pendingKey(response.id); const deferred = this.pending.get(key);
    if (deferred == null) return false;
    this.pending.delete(key);
    if (response.error != null) { deferred.reject(new Error(response.error.message)); return true; }
    const parser = this.resultSchema();
    // The recovered main graph can observe the CommonJS schema export before
    // its circular dependency finishes initializing. Validate the small wire
    // contract locally in that transient case instead of dropping the result.
    const parsed = parser?.safeParse(response.result) ?? fallbackParseDynamicAppToolResult(response.result);
    return parsed.success ? (deferred.resolve(parsed.data), true) : (deferred.reject(new Error(`Dynamic app tool returned an invalid response`, { cause: parsed.error })), true);
  }
  dispose() { for (const deferred of this.pending.values()) deferred.reject(new Error(`Dynamic app tool response router disposed`)); this.pending.clear(); }
}
function pendingKey(id: string | number) { return `${typeof id}:${String(id)}`; }
export { DynamicAppToolPendingResponses };
if (typeof module !== `undefined`) module.exports = { DynamicAppToolPendingResponses };
