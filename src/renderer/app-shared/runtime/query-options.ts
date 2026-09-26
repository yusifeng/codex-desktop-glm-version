export interface QueryOptionsShape {
  queryKey: readonly unknown[];
}

export interface InfiniteQueryOptionsShape extends QueryOptionsShape {
  initialPageParam: unknown;
}

export interface QueryFunctionContext<
  QueryKey extends readonly unknown[] = readonly unknown[],
> {
  queryKey: QueryKey;
  signal: AbortSignal;
  meta?: Record<string, unknown>;
}

export interface UseQueryOptions<
  QueryFnData,
  QueryError = Error,
  Data = QueryFnData,
  QueryKey extends readonly unknown[] = readonly unknown[],
> extends Record<string, unknown> {
  queryKey: QueryKey;
  queryFn?: (
    context: QueryFunctionContext<QueryKey>,
  ) => Promise<QueryFnData> | QueryFnData;
  enabled?: boolean | ((query: unknown) => boolean);
  select?: (data: QueryFnData) => Data;
  throwOnError?: boolean | ((error: QueryError, query: unknown) => boolean);
}

export interface UseQueryResult<Data, QueryError = Error> {
  data: Data | undefined;
  error: QueryError | null;
  isError: boolean;
  isFetching: boolean;
  isLoading: boolean;
  isPending: boolean;
  isSuccess: boolean;
  refetch(): Promise<UseQueryResult<Data, QueryError>>;
  status: "error" | "pending" | "success";
}

export interface MutationFunctionContext {
  client: unknown;
  meta?: Record<string, unknown>;
  mutationKey?: readonly unknown[];
}

export interface MutationCallbacks<Data, MutationError, Variables, Context> {
  onError?(
    error: MutationError,
    variables: Variables,
    context: Context | undefined,
    mutation: MutationFunctionContext,
  ): Promise<unknown> | unknown;
  onSettled?(
    data: Data | undefined,
    error: MutationError | null,
    variables: Variables,
    context: Context | undefined,
    mutation: MutationFunctionContext,
  ): Promise<unknown> | unknown;
  onSuccess?(
    data: Data,
    variables: Variables,
    context: Context | undefined,
    mutation: MutationFunctionContext,
  ): Promise<unknown> | unknown;
}

export interface UseMutationOptions<
  Data,
  MutationError = Error,
  Variables = void,
  Context = unknown,
> extends MutationCallbacks<Data, MutationError, Variables, Context>,
    Record<string, unknown> {
  mutationFn?: (
    variables: Variables,
    context: MutationFunctionContext,
  ) => Promise<Data> | Data;
  mutationKey?: readonly unknown[];
  onMutate?(
    variables: Variables,
    context: MutationFunctionContext,
  ): Promise<Context> | Context;
}

export type MutationArguments<Variables, Callbacks> = Variables extends void
  ? [variables?: Variables, callbacks?: Callbacks]
  : [variables: Variables, callbacks?: Callbacks];

export interface UseMutationResult<
  Data,
  MutationError = Error,
  Variables = void,
  Context = unknown,
> {
  data: Data | undefined;
  error: MutationError | null;
  isError: boolean;
  isIdle: boolean;
  isPending: boolean;
  isSuccess: boolean;
  mutate(
    ...arguments_: MutationArguments<
      Variables,
      MutationCallbacks<Data, MutationError, Variables, Context>
    >
  ): void;
  mutateAsync(
    ...arguments_: MutationArguments<
      Variables,
      MutationCallbacks<Data, MutationError, Variables, Context>
    >
  ): Promise<Data>;
  reset(): void;
  status: "error" | "idle" | "pending" | "success";
  variables: Variables | undefined;
}

/** 原 `Xqe` / 压缩导出 `_L` 的公开调用契约。运行时仍由内嵌 QueryObserver 提供。 */
export type UseQueryHook = <
  QueryFnData,
  QueryError = Error,
  Data = QueryFnData,
  QueryKey extends readonly unknown[] = readonly unknown[],
>(
  options: UseQueryOptions<QueryFnData, QueryError, Data, QueryKey>,
  queryClient?: unknown,
) => UseQueryResult<Data, QueryError>;

/** 原 `uJe` / 压缩导出 `iL` 的公开调用契约。运行时仍由内嵌 MutationObserver 提供。 */
export type UseMutationHook = <
  Data,
  MutationError = Error,
  Variables = void,
  Context = unknown,
>(
  options: UseMutationOptions<Data, MutationError, Variables, Context>,
  queryClient?: unknown,
) => UseMutationResult<Data, MutationError, Variables, Context>;

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
