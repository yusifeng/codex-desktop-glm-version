// use-reduced-motion — read the shared reduced-motion preference once per mount.

import "@rchunk/rolldown-runtime";
import { d0 as initializeReducedMotionMedia, e6 as getReactRuntime, f0 as reducedMotionInitialized, m0 as reducedMotionValue, p0 as initializeReducedMotionState, u0 as updateReducedMotion } from "@rchunk/app-shared";

interface ReducedMotionReactRuntime { useState<Value>(value: Value): [Value, (value: Value) => void] }
interface MutableBoolean { current: boolean }

let React: ReducedMotionReactRuntime;
function initializeReducedMotionHook(): void {
  if (React != null) return;
  initializeReducedMotionState();
  initializeReducedMotionMedia();
  React = getReactRuntime() as unknown as ReducedMotionReactRuntime;
}
function useReducedMotion(): boolean {
  initializeReducedMotionHook();
  if (!(reducedMotionInitialized as MutableBoolean).current) updateReducedMotion();
  const [reducedMotion] = React.useState((reducedMotionValue as MutableBoolean).current);
  return reducedMotion;
}

export { useReducedMotion as n, initializeReducedMotionHook as t };
