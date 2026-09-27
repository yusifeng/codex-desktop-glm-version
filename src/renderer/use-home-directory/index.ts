// use-home-directory —— 按 host 查询并读取主目录。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

interface QueryResult<Data> {
  data?: Data;
  error?: unknown;
  isLoading?: boolean;
}

interface AppSharedBindings {
  BX: <Data>(query: unknown, variables?: Record<string, unknown>) => QueryResult<Data>;
}

interface AppInitialBindings {
  gcn: unknown;
}

interface HomeDirectoryData {
  homeDirectory?: string;
}

const { BX: useQuery } = appSharedChunk as unknown as AppSharedBindings;
const { gcn: homeDirectoryQuery } = appInitialChunk as unknown as AppInitialBindings;

function useHomeDirectoryQuery(hostId?: string | null): QueryResult<HomeDirectoryData> {
  return useQuery<HomeDirectoryData>(
    homeDirectoryQuery,
    hostId == null ? undefined : { hostId },
  );
}

function useHomeDirectory(hostId?: string | null): string | undefined {
  return useHomeDirectoryQuery(hostId).data?.homeDirectory;
}

function initializeUseHomeDirectory(): void {
  // 兼容原 chunk 的惰性初始化导出；依赖初始化由各 runtime 自身保证幂等。
}

export {
  useHomeDirectory as n,
  useHomeDirectoryQuery as r,
  initializeUseHomeDirectory as t,
};
