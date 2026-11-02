import { e6 as getReactRuntime } from "@rchunk/app-shared";

interface MutableRef<T> {
  current: T;
}

interface ReactLike {
  useEffect(
    effect: () => void | (() => void),
    dependencies: readonly unknown[],
  ): void;
  useRef<T>(initialValue: T): MutableRef<T>;
}

function reactOf(): ReactLike {
  return (
    (globalThis as { __RENDERER_REACT__?: ReactLike }).__RENDERER_REACT__ ??
    (getReactRuntime() as ReactLike)
  );
}

/** 原 `Spt` / 压缩导出 `if`。 */
export function useIsMounted(): () => boolean {
  const react = reactOf();
  const mounted = react.useRef(false);
  react.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return () => mounted.current;
}

/** 原 `Tpt` / 压缩导出 `rf`。 */
export function initializeMountedState(): void {}
