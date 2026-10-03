const encoder = new TextEncoder();

function hostId(host: { id: string }): string {
  return host.id;
}

function gitQueryKey(root: string, host: { id: string }, operation: string, ...parts: string[]): string[] {
  return [`git`, hostId(host), root, operation, ...parts];
}

function normalizeGitPath(value: string): string {
  return value.replaceAll(`\\`, `/`).replace(/\/+$/, ``);
}

function utf8ByteLength(value: string): number {
  return encoder.encode(value).byteLength;
}

export { gitQueryKey, hostId, normalizeGitPath, utf8ByteLength };
if (typeof module !== `undefined`) module.exports = { gitQueryKey, hostId, normalizeGitPath, utf8ByteLength };
