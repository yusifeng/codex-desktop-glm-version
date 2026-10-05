/**
 * Runs bounded asynchronous workers over a finite list and preserves the
 * worker's first failure as the cause of a stable boundary error.
 */
async function runBoundedWorkers<T>(
  values: T[],
  callback: (value: T) => Promise<void>,
  limit: number,
  failureMessage: string,
) {
  let index = 0;
  let failed = false;
  let failure: unknown = null;
  const worker = async () => {
    while (!failed) {
      const value = values[index];
      index += 1;
      if (value == null) return;
      try {
        await callback(value);
      } catch (error) {
        if (!failed) {
          failed = true;
          failure =
            error instanceof Error
              ? error
              : Error(failureMessage, { cause: error });
        }
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  if (failure != null) throw Error(failureMessage, { cause: failure });
}

export { runBoundedWorkers };

if (typeof module !== `undefined`) module.exports = { runBoundedWorkers };
