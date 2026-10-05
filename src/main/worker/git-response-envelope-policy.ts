/** Pure protocol policy for stable worker response envelopes. */
function createGitWorkerResponse(input: { id: string; method: string; result: unknown; trace?: unknown; emittedAtMs?: number }) {
  return {
    ...(input.trace == null ? {} : { emittedAtMs: input.emittedAtMs ?? Date.now(), trace: input.trace }),
    id: input.id,
    method: input.method,
    result: input.result,
  };
}
export { createGitWorkerResponse };
if (typeof module !== `undefined`) module.exports = { createGitWorkerResponse };
