/** Encode a path segment under a fixed protocol prefix. */
export function encodePrefixedPath(prefix: string, value: string): string {
  return `${prefix}${encodeURIComponent(value)}`;
}
