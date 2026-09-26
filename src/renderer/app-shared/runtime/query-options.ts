export interface QueryOptionsShape {
  queryKey: readonly unknown[];
}

export interface InfiniteQueryOptionsShape extends QueryOptionsShape {
  initialPageParam: unknown;
}

/** 原 `eJe` / 压缩导出 `pL`。 */
export function queryOptions<Options extends QueryOptionsShape>(
  options: Options,
): Options {
  return options;
}

/** 原 `tJe` / 压缩导出 `fL`。 */
export function initializeQueryOptions(): void {}

/** 原 `nJe` / 压缩导出 `uL`。 */
export function infiniteQueryOptions<Options extends InfiniteQueryOptionsShape>(
  options: Options,
): Options {
  return options;
}

/** 原 `rJe` / 压缩导出 `dL`。 */
export function initializeInfiniteQueryOptions(): void {}

/** 原 `fJe` / 压缩导出 `nL`。 */
export function mutationOptions<Options extends Record<string, unknown>>(
  options: Options,
): Options {
  return options;
}

/** 原 `pJe` / 压缩导出 `tL`。 */
export function initializeMutationOptions(): void {}
