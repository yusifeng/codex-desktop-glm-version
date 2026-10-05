function classifyCatFileBatchError(requestCount: number, result: { outputLimitExceeded?: boolean | null; code?: number | null }, limitBytes: number) {
  return result.outputLimitExceeded != null && requestCount === 1
    ? { type: `error`, error: { type: `too-large`, limitBytes } }
    : { type: `error`, error: { type: result.code === 128 ? `not-found` : `unknown` } };
}
export { classifyCatFileBatchError };
if (typeof module !== `undefined`) module.exports = { classifyCatFileBatchError };
