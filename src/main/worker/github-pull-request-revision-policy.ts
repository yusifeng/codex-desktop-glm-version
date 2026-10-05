import { isUtf8 } from "node:buffer";

const MAX_GITHUB_FILE_BYTES = 1048576;

/** Encode each path segment while preserving GitHub's slash separators. */
function encodeGithubContentPath(path: string): string {
  return path.split(`/`).map(encodeURIComponent).join(`/`);
}

/** Decode a GitHub contents API payload when it is a bounded UTF-8 text file. */
function decodeGithubFileContent(payload: any): string | null {
  const size = Number(payload?.size);
  if (size > MAX_GITHUB_FILE_BYTES || payload?.encoding !== `base64`) return null;
  const bytes = Buffer.from(payload?.content ?? ``, `base64`);
  if (bytes.byteLength > MAX_GITHUB_FILE_BYTES || bytes.includes(0) || !isUtf8(bytes)) return null;
  return bytes.toString(`utf8`);
}

export { MAX_GITHUB_FILE_BYTES, decodeGithubFileContent, encodeGithubContentPath };
if (typeof module !== `undefined`)
  module.exports = { MAX_GITHUB_FILE_BYTES, decodeGithubFileContent, encodeGithubContentPath };
