function isWithinAnnotationUtf8ByteQuota(value: string, maxBytes: number): boolean {
  return new TextEncoder().encode(value).byteLength <= maxBytes;
}

export { isWithinAnnotationUtf8ByteQuota };
if (typeof module !== `undefined`) module.exports = { isWithinAnnotationUtf8ByteQuota };
