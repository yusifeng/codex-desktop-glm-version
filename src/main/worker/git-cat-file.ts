const MAX_CAT_FILE_REQUESTS = 4;
const MAX_OBJECT_BYTES = 5_242_880;
const CAT_FILE_TIMEOUT_MS = 30_000;
const OUTPUT_OVERHEAD_BYTES = 64;
const NO_LAZY_FETCH_ENV = { GIT_NO_LAZY_FETCH: `1` };
const ZERO_OID = /^0+$/;
const LINE_BOUNDARY = /(?<=\n)/;
import { isQueryableOid } from "./git-cat-file-policy";

type CatFileDependencies = {
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
};

function unknownResult() { return unknownCatFileResult(); }

function defaultBatchError(requestCount: number, result: any, limitBytes: number) {
  return result.outputLimitExceeded != null && requestCount === 1
    ? { type: `error`, error: { type: `too-large`, limitBytes } }
    : { type: `error`, error: { type: gitErrorType(result) } };
}

function parseCatFileBatch(requestCount: number, result: any, limitBytes: number) {
  const fallback = defaultBatchError(requestCount, result, limitBytes);
  if (!result.success && result.outputLimitExceeded == null)
    return {
      results: Array.from({ length: requestCount }, () => fallback),
      retryStartIndex: null,
    };
  const bytes = result.stdoutBuffer ?? new TextEncoder().encode(result.stdout ?? ``);
  const decoder = new TextDecoder();
  const results: any[] = [];
  let offset = 0;
  let sawOversizedObject = false;
  for (let index = 0; index < requestCount; index += 1) {
    const headerEnd = bytes.indexOf(10, offset);
    if (headerEnd === -1) {
      if (result.outputLimitExceeded != null && sawOversizedObject)
        return { results, retryStartIndex: index };
      results.push(fallback);
      continue;
    }
    const header = decoder.decode(bytes.subarray(offset, headerEnd));
    offset = headerEnd + 1;
    if (header.endsWith(` missing`)) {
      results.push({ type: `error`, error: { type: `not-found` } });
      continue;
    }
    const match = /^[0-9a-f]+ [^ ]+ ([0-9]+)$/.exec(header);
    const objectSize = match?.[1] == null ? Number.NaN : Number(match[1]);
    if (!Number.isSafeInteger(objectSize) || objectSize < 0) {
      offset = bytes.byteLength;
      results.push(unknownResult());
      continue;
    }
    const payloadEnd = offset + objectSize;
    if (payloadEnd >= bytes.byteLength || bytes[payloadEnd] !== 10) {
      offset = bytes.byteLength;
      if (objectSize > limitBytes) {
        results.push({ type: `error`, error: { type: `too-large`, limitBytes } });
        return {
          results,
          retryStartIndex: index + 1 < requestCount ? index + 1 : null,
        };
      }
      if (result.outputLimitExceeded != null && sawOversizedObject)
        return { results, retryStartIndex: index };
      results.push(fallback);
      continue;
    }
    if (objectSize > limitBytes) {
      sawOversizedObject = true;
      results.push({ type: `error`, error: { type: `too-large`, limitBytes } });
    } else {
      results.push({
        type: `success`,
        lines: splitContentLines(decoder.decode(bytes.subarray(offset, payloadEnd))),
      });
    }
    offset = payloadEnd + 1;
  }
  return { results, retryStartIndex: null };
}

async function readCatFileBatch(
  repository: any,
  objectIds: string[],
  limitBytes: number,
  signal: AbortSignal | undefined,
  reviewSnapshot: any,
  dependencies: CatFileDependencies,
): Promise<any[]> {
  const encoder = new TextEncoder();
  const options = {
    collectStdoutBuffer: true,
    env: NO_LAZY_FETCH_ENV,
    maxOutputBytes: objectIds.reduce(
      (total, oid) =>
        Math.min(
          Number.MAX_SAFE_INTEGER,
          total + limitBytes + encoder.encode(oid).byteLength + OUTPUT_OVERHEAD_BYTES,
        ),
      0,
    ),
    signal,
    stdin: `${objectIds.join(`\n`)}\n`,
    timeoutMs: CAT_FILE_TIMEOUT_MS,
    trim: false,
  };
  const result = reviewSnapshot == null
    ? await dependencies.runGit(repository.root, [`cat-file`, `--batch`], repository.host, options)
    : await reviewSnapshot.git([`cat-file`, `--batch`], options);
  const parsed = parseCatFileBatch(objectIds.length, result, limitBytes);
  return parsed.retryStartIndex == null
    ? parsed.results
    : [
        ...parsed.results,
        ...(await readCatFileBatch(
          repository,
          objectIds.slice(parsed.retryStartIndex),
          limitBytes,
          signal,
          reviewSnapshot,
          dependencies,
        )),
      ];
}

async function readStreamPrefix(stream: any, byteLimit: number) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (byteLength < byteLimit) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value.subarray(0, byteLimit - byteLength);
      chunks.push(chunk);
      byteLength += chunk.byteLength;
    }
    if (byteLength === byteLimit) await reader.cancel();
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

async function readDiskFile(path: string, host: any, limitBytes: number) {
  const { size } = await host.stat(path, { bypassCache: true });
  if (size != null && size > limitBytes)
    return { type: `error`, error: { type: `too-large`, limitBytes } };
  const bytes = await readStreamPrefix(await host.readFile(path), limitBytes + 1);
  return bytes.byteLength > limitBytes
    ? { type: `error`, error: { type: `too-large`, limitBytes } }
    : {
        type: `success`,
        lines: splitContentLines(new TextDecoder(`utf-8`, { ignoreBOM: true }).decode(bytes)),
      };
}

function isDiskNotFoundError(error: unknown) {
  return error instanceof Error &&
    ((`code` in error && error.code === `ENOENT`) ||
      error.message.includes(`No such file`) ||
      error.message.includes(`cannot open`) ||
      error.message.includes(`not found`));
}

function diskErrorResult(error: unknown) {
  return {
    type: `error`,
    error: { type: isDiskNotFoundError(error) ? `not-found` : `unknown` },
  };
}

async function readGitCatFile(
  repository: any,
  { maxObjectBytes, requests, reviewSnapshot }: any,
  signal: AbortSignal | undefined,
  dependencies: CatFileDependencies,
) {
  if (requests.length > MAX_CAT_FILE_REQUESTS) return requests.map(unknownResult);
  const limitBytes = Math.max(0, Math.min(maxObjectBytes ?? MAX_OBJECT_BYTES, MAX_OBJECT_BYTES));
  try {
    const objectIds = [
      ...new Set<string>(
        requests.flatMap(({ oid }: any) => (isQueryableOid(oid) ? [oid] : [])),
      ),
    ];
    const batchResults = objectIds.length === 0
      ? []
      : await readCatFileBatch(
          repository,
          objectIds,
          limitBytes,
          signal,
          reviewSnapshot,
          dependencies,
        );
    const resultsByOid = new Map(
      objectIds.map((oid, index) => [oid, batchResults[index] ?? unknownResult()]),
    );
    const results = requests.map(({ oid }: any) =>
      isQueryableOid(oid)
        ? resultsByOid.get(oid) ?? unknownResult()
        : { type: `error`, error: { type: `not-found` } },
    );
    if (!results.some((result: any, index: number) =>
      requests[index]?.fallbackToDisk === true &&
      result.type === `error` &&
      result.error.type === `not-found`))
      return results;
    const platformPathPromise = repository.host.platformPath();
    return Promise.all(results.map(async (result: any, index: number) => {
      const request = requests[index];
      if (request?.fallbackToDisk !== true ||
          result.type !== `error` ||
          result.error.type !== `not-found`)
        return result;
      try {
        const path = (await platformPathPromise).join(repository.root, request.path);
        const read = () => readDiskFile(path, repository.host, limitBytes);
        return await (reviewSnapshot == null ? read() : reviewSnapshot.read(read));
      } catch (error) {
        return diskErrorResult(error);
      }
    }));
  } catch {
    return requests.map(unknownResult);
  }
}

export {
  MAX_OBJECT_BYTES,
  parseCatFileBatch,
  readGitCatFile,
  readStreamPrefix,
  splitContentLines,
};
if (typeof module !== `undefined`)
  module.exports = {
    MAX_OBJECT_BYTES,
    parseCatFileBatch,
    readGitCatFile,
    readStreamPrefix,
    splitContentLines,
  };
import { gitErrorType } from "./git-cat-file-error-policy";
import { unknownCatFileResult } from "./git-cat-file-error-envelope-policy";
import { splitContentLines } from "./git-cat-file-content-policy";
