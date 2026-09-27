import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerCache,
  $O as timeConstants,
  BX as useSignalFamilyValue,
  FX as initializeSignalRuntime,
  ek as initializeQueryRuntime,
} from "@rchunk/app-shared";
import {
  MXt as initializeSubmoduleQueries,
  fon as normalizeQueryOptions,
  gon as initializeQueryOptions,
  jXt as createHostQuery,
} from "@rchunk/app-initial";

let submodulePathsFromTarget: unknown;

function initializeSubmodulePathsQuery(): void {
  initializeSubmoduleQueries();
  const query = createHostQuery({
    method: "submodule-paths",
    getParams: (input: { operationSource: string; root: string }) => ({
      operationSource: input.operationSource,
      root: input.root,
    }),
    getOptions: (input: { staleTime?: number }) => ({
      select: (result: { paths: string[] }) => result.paths,
      staleTime: input.staleTime,
    }),
  });
  submodulePathsFromTarget = query.fromTarget$;
}

function useGitSubmodulePaths(
  cwd: string | null,
  hostConfig: unknown,
  operationSource: string,
  options?: Record<string, unknown> | null,
): unknown {
  const normalizedOptions = normalizeQueryOptions(options, timeConstants.ONE_MINUTE);
  const lookup = cwd == null ? null : { cwd, hostConfig };
  const readSignalFamily = useSignalFamilyValue as unknown as (
    signal: unknown,
    parameter: unknown,
  ) => unknown;
  return readSignalFamily(submodulePathsFromTarget, {
    ...normalizedOptions,
    operationSource,
    lookup,
  });
}

function initializeUseGitSubmodulePaths(): void {
  initializeCompilerCache();
  initializeSignalRuntime();
  initializeQueryRuntime();
  initializeQueryOptions();
  initializeSubmodulePathsQuery();
}

export { useGitSubmodulePaths as n, initializeUseGitSubmodulePaths as t };
