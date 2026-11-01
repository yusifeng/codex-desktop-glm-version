import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
  BX as useSignalFamilyValue,
  FX as initializeSignalRuntime,
} from "@rchunk/app-shared";
import {
  AXt as initializeGitQueries,
  fon as normalizeQueryOptions,
  gon as initializeQueryOptions,
  kXt as gitConfigValueQuery,
} from "@rchunk/app-initial";

interface CompilerRuntime {
  c(size: number): unknown[];
}

let compilerRuntime: CompilerRuntime;

function useGitConfigValue(
  cwd: string | null,
  hostConfig: unknown,
  key: string,
  scope: string,
  operationSource: string,
  options?: Record<string, unknown> | null,
): unknown {
  const cache = compilerRuntime.c(11);
  let lookup: { cwd: string; hostConfig: unknown } | null;
  if (cache[0] !== cwd || cache[1] !== hostConfig) {
    lookup = cwd == null ? null : { cwd, hostConfig };
    cache[0] = cwd;
    cache[1] = hostConfig;
    cache[2] = lookup;
  } else {
    lookup = cache[2] as typeof lookup;
  }

  let normalizedOptions: Record<string, unknown>;
  if (cache[3] !== options) {
    normalizedOptions = normalizeQueryOptions(options, null) as Record<string, unknown>;
    cache[3] = options;
    cache[4] = normalizedOptions;
  } else {
    normalizedOptions = cache[4] as Record<string, unknown>;
  }

  let queryInput: Record<string, unknown>;
  if (
    cache[5] !== key ||
    cache[6] !== operationSource ||
    cache[7] !== scope ||
    cache[8] !== lookup ||
    cache[9] !== normalizedOptions
  ) {
    queryInput = {
      key,
      operationSource,
      lookup,
      scope,
      ...normalizedOptions,
    };
    cache[5] = key;
    cache[6] = operationSource;
    cache[7] = scope;
    cache[8] = lookup;
    cache[9] = normalizedOptions;
    cache[10] = queryInput;
  } else {
    queryInput = cache[10] as Record<string, unknown>;
  }

  const readSignalFamily = useSignalFamilyValue as unknown as (
    signal: unknown,
    parameter: unknown,
  ) => unknown;
  return readSignalFamily(gitConfigValueQuery, queryInput);
}

function initializeUseGitConfigValue(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeSignalRuntime();
  initializeGitQueries();
  initializeQueryOptions();
}

export { useGitConfigValue as n, initializeUseGitConfigValue as t };
