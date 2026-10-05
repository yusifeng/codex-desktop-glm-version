/** Pure telemetry policy for normalizing Git process exit codes. */
function exitCodeBucket(exitCode: number | null): string | null {
  switch (exitCode) {
    case null: return null;
    case 1: return `1`;
    case 2: return `2`;
    case 128: return `128`;
    case 129: return `129`;
    default: return `other`;
  }
}
export { exitCodeBucket };
if (typeof module !== `undefined`) module.exports = { exitCodeBucket };
