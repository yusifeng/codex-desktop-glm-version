export interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T | PromiseLike<T>): void;
  reject(reason?: unknown): void;
}

/** Create the release deferred promise contract used by renderer coordinators. */
export function createDeferred<T = void>(): Deferred<T> {
  let resolve: Deferred<T>["resolve"] = () => {};
  let reject: Deferred<T>["reject"] = () => {};
  return {
    promise: new Promise<T>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise;
      reject = rejectPromise;
    }),
    resolve,
    reject,
  };
}

