import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerCache,
  BX as useSignalFamilyValue,
  FX as initializeSignalRuntime,
} from "@rchunk/app-shared";
import {
  AXt as initializeGitQueries,
  fon as normalizeQueryOptions,
  gon as initializeQueryOptions,
  kXt as gitConfigValueQuery,
} from "@rchunk/app-initial";

function useGitConfigValue(
  cwd: string | null,
  hostConfig: unknown,
  key: string,
  scope: string,
  operationSource: string,
  options?: Record<string, unknown> | null,
): unknown {
  const lookup = cwd == null ? null : { cwd, hostConfig };
  const normalizedOptions = normalizeQueryOptions(options, null);
  const readSignalFamily = useSignalFamilyValue as unknown as (
    signal: unknown,
    parameter: unknown,
  ) => unknown;
  return readSignalFamily(gitConfigValueQuery, {
    key,
    operationSource,
    lookup,
    scope,
    ...normalizedOptions,
  });
}

function initializeUseGitConfigValue(): void {
  initializeCompilerCache();
  initializeSignalRuntime();
  initializeGitQueries();
  initializeQueryOptions();
}

export { useGitConfigValue as n, initializeUseGitConfigValue as t };
