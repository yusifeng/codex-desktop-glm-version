// use-stable-callback — stable function identity that always invokes the latest callback.

import "@rchunk/rolldown-runtime";
import { e6 as getReactRuntime } from "@rchunk/app-shared";

interface StableCallbackReactRuntime {
  useInsertionEffect(effect: () => void, dependencies: readonly unknown[]): void;
  useMemo<Value>(factory: () => Value, dependencies: readonly unknown[]): Value;
  useRef<Value>(value: Value): { current: Value };
}

let React: StableCallbackReactRuntime;
function initializeStableCallback(): void { React ??= getReactRuntime() as unknown as StableCallbackReactRuntime; }
function useStableCallback<Arguments extends unknown[], Result>(callback: (...arguments_: Arguments) => Result): (...arguments_: Arguments) => Result {
  initializeStableCallback();
  const callbackReference = React.useRef(callback);
  React.useInsertionEffect(() => { callbackReference.current = callback; }, [callback]);
  return React.useMemo(() => (...arguments_: Arguments): Result => callbackReference.current(...arguments_), []);
}

export { useStableCallback as n, initializeStableCallback as t };
