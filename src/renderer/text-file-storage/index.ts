import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignalRuntime,
  QI as initializeQueryRuntime,
  ZI as appScope,
  jU as requestClientKey,
  lW as contentSampleByteLimit,
  rZ as createDerivedFamily,
  uW as detectContentKind,
  wL as initializeWindowRuntime,
} from "@rchunk/app-shared";
import {
  Fon as encodeBase64,
  HZt as initializeSubagentsPanel,
  Non as decodeBase64,
  Oyt as initializeFileRpc,
  Qln as invokeHostCommand,
  kyt as conversationTargetFamily,
  nun as initializeHostCommands,
  yZt as requestClientFamily,
} from "@rchunk/app-initial";

interface RequestClient {
  sendRequest<Result>(method: string, parameters: Record<string, unknown>): Promise<Result>;
}

interface CloudFileAccess {
  environmentId: string;
  requestClient: RequestClient;
}

interface ReadTextFileInput {
  cloudFileAccess?: CloudFileAccess | null;
  filePath: string;
  hostId: string;
  maximumSizeBytes?: number;
  requireTextContent?: boolean;
  signal?: AbortSignal;
}

async function readTextFile({
  cloudFileAccess,
  filePath,
  hostId,
  maximumSizeBytes,
  requireTextContent = false,
  signal,
}: ReadTextFileInput): Promise<{ content: string; mtimeMs: number | null; sizeBytes: number }> {
  if (cloudFileAccess != null) {
    const { environmentId, requestClient } = cloudFileAccess;
    signal?.throwIfAborted();
    const parameters = { environmentId, path: filePath };
    const metadata = await requestClient.sendRequest<{ modifiedAtMs: number }>("fs/getMetadata", parameters);
    signal?.throwIfAborted();
    const { dataBase64 } = await requestClient.sendRequest<{ dataBase64: string }>("fs/readFile", parameters);
    signal?.throwIfAborted();
    const bytes = decodeBase64(dataBase64);
    if (maximumSizeBytes != null && bytes.byteLength > maximumSizeBytes) throw new Error("File is too large");
    if (requireTextContent && await detectContentKind(bytes.subarray(0, 4096)) !== "text") {
      throw new Error("File is not text");
    }
    return { content: new TextDecoder().decode(bytes), mtimeMs: metadata.modifiedAtMs, sizeBytes: bytes.byteLength };
  }
  const metadata = await invokeHostCommand<{
    contentKind?: string;
    mtimeMs?: number | null;
    sizeBytes?: number | null;
  }>("read-file-metadata", {
    params: {
      ...(requireTextContent ? { contentSampleByteLimit, contentSampleMaxFileBytes: maximumSizeBytes } : {}),
      hostId,
      path: filePath,
    },
    signal,
  });
  if (maximumSizeBytes != null && metadata.sizeBytes != null && metadata.sizeBytes > maximumSizeBytes) {
    throw new Error("File is too large");
  }
  if (requireTextContent && metadata.contentKind !== "text") throw new Error("File is not text");
  const { contents } = await invokeHostCommand<{ contents: string }>("read-file", {
    params: { hostId, path: filePath }, signal,
  });
  const sizeBytes = maximumSizeBytes == null && metadata.sizeBytes != null
    ? metadata.sizeBytes
    : new Blob([contents]).size;
  if (maximumSizeBytes != null && sizeBytes > maximumSizeBytes) throw new Error("File is too large");
  return { content: contents, mtimeMs: metadata.mtimeMs ?? null, sizeBytes };
}

interface WriteTextFileInput {
  cloudFileAccess?: CloudFileAccess | null;
  content: string;
  expectedMtimeMs: number;
  filePath: string;
  hostId: string;
}

async function writeTextFile({
  cloudFileAccess, content, expectedMtimeMs, filePath, hostId,
}: WriteTextFileInput): Promise<unknown> {
  if (cloudFileAccess != null) {
    const { environmentId, requestClient } = cloudFileAccess;
    const parameters = { environmentId, path: filePath };
    const metadata = await requestClient.sendRequest<{ modifiedAtMs: number }>("fs/getMetadata", parameters);
    if (metadata.modifiedAtMs !== expectedMtimeMs) {
      return { mtimeMs: metadata.modifiedAtMs, outcome: "conflict" };
    }
    await requestClient.sendRequest("fs/writeFile", { ...parameters, dataBase64: encodeBase64(content) });
    const updated = await requestClient.sendRequest<{ modifiedAtMs: number }>("fs/getMetadata", parameters);
    return { mtimeMs: updated.modifiedAtMs, outcome: "saved" };
  }
  return invokeHostCommand("write-file", {
    params: { content, expectedMtimeMs, hostId, path: filePath },
  });
}

let cloudFileAccessFamily: unknown;

function initializeTextFileStorage(): void {
  initializeSignalRuntime();
  initializeWindowRuntime();
  initializeSubagentsPanel();
  initializeQueryRuntime();
  initializeFileRpc();
  initializeHostCommands();
  cloudFileAccessFamily = createDerivedFamily(
    appScope,
    (conversationId: string | null, { get }) => {
      if (conversationId == null) return undefined;
      const target = get(conversationTargetFamily, {
        kind: "app-server", conversationId,
      }) as { environmentId?: string; hostId?: string } | null;
      return target?.hostId === "durable"
        ? { environmentId: target.environmentId, requestClient: get(requestClientFamily, requestClientKey) }
        : undefined;
    },
    {
      isEqual: (left: CloudFileAccess | undefined, right: CloudFileAccess | undefined) =>
        left?.environmentId === right?.environmentId && left?.requestClient === right?.requestClient,
    },
  );
}

export { writeTextFile as i, initializeTextFileStorage as n, readTextFile as r, cloudFileAccessFamily as t };
