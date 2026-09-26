export type LazyComponent<Props extends Record<string, unknown>> = (
  props: Props,
) => unknown;

export interface LazyComponentOptions<Props extends Record<string, unknown>> {
  errorFallback?: unknown | LazyComponent<Props>;
  fallback?: unknown;
  propagateLoadError?: boolean;
  suspendToParent?: boolean;
}

interface ReactLike {
  Suspense: unknown;
  lazy<Props extends Record<string, unknown>>(
    loader: () => Promise<{ default: LazyComponent<Props> }>,
  ): LazyComponent<Props>;
}

interface JsxRuntimeLike {
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

interface LazyComponentGlobals {
  __RENDERER_CAPTURE_ERROR__?: (
    error: Error,
    metadata: { tags: { operation: "lazy-component-load" } },
  ) => void;
  __RENDERER_JSX_RUNTIME__?: JsxRuntimeLike;
  __RENDERER_LAZY_RETRY_DELAY__?: number;
  __RENDERER_REACT__?: ReactLike;
}

function globalsOf(): LazyComponentGlobals {
  return globalThis as LazyComponentGlobals;
}

function reactOf(): ReactLike {
  return globalsOf().__RENDERER_REACT__ ?? (require("react") as ReactLike);
}

function runtimeOf(): JsxRuntimeLike {
  return (
    globalsOf().__RENDERER_JSX_RUNTIME__ ??
    (require("react/jsx-runtime") as JsxRuntimeLike)
  );
}

function normalizeLoadError(value: unknown): Error {
  return value instanceof Error
    ? value
    : new Error("Failed to load lazy component", { cause: value });
}

function waitBeforeRetry(): Promise<void> {
  const delay = globalsOf().__RENDERER_LAZY_RETRY_DELAY__ ?? 200;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/** 原 `cct` / 压缩导出 `Jm`。 */
export function createLazyComponent<Props extends Record<string, unknown>>(
  load: () => Promise<LazyComponent<Props>>,
  {
    fallback = null,
    suspendToParent = false,
    errorFallback = null,
    propagateLoadError = false,
  }: LazyComponentOptions<Props> = {},
): LazyComponent<Props> {
  const react = reactOf();
  const Lazy = react.lazy(async () => {
    try {
      return { default: await load() };
    } catch {
      await waitBeforeRetry();
    }
    try {
      return { default: await load() };
    } catch (value) {
      if (propagateLoadError) throw value;
      const error = normalizeLoadError(value);
      globalsOf().__RENDERER_CAPTURE_ERROR__?.(error, {
        tags: { operation: "lazy-component-load" },
      });
      return {
        default: (props: Props) =>
          typeof errorFallback === "function"
            ? (errorFallback as LazyComponent<Props>)(props)
            : errorFallback,
      };
    }
  });
  if (suspendToParent) return Lazy;
  return (props: Props) =>
    runtimeOf().jsx(react.Suspense, {
      fallback,
      children: runtimeOf().jsx(Lazy, { ...props }),
    });
}

/** 原 `sct` / 压缩导出 `Xm`。 */
export function initializeLazyComponent(): void {}
