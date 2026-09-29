// Stable callback identity with immediate forwarding to the latest render callback.
// Release chunk: useStableCallback-43628b79218b.js.
import "@rchunk/rolldown-runtime";
import { e6 as getReactRuntime } from "@rchunk/app-shared";

interface StableCallbackReactRuntime {
  useCallback?<Arguments extends unknown[], Result>(
    callback: (...arguments_: Arguments) => Result,
    dependencies: readonly unknown[],
  ): (...arguments_: Arguments) => Result;
  useMemo<Value>(factory: () => Value, dependencies: readonly unknown[]): Value;
  useRef<Value>(value: Value): { current: Value };
}

let React: StableCallbackReactRuntime;

function initializeStableCallback(): void {
  React ??= getReactRuntime() as unknown as StableCallbackReactRuntime;
}

function useStableCallback<Arguments extends unknown[], Result>(
  callback: (...arguments_: Arguments) => Result,
): (...arguments_: Arguments) => Result {
  initializeStableCallback();
  const callbackReference = React.useRef(callback);
  callbackReference.current = callback;
  const stableCallback = (...arguments_: Arguments): Result =>
    callbackReference.current(...arguments_);
  return React.useCallback
    ? React.useCallback(stableCallback, [])
    : React.useMemo(() => stableCallback, []);
}

export { useStableCallback as n, initializeStableCallback as t };
