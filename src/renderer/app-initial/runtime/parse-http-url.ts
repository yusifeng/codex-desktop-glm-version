/**
 * Parse an HTTP(S) URL while rejecting non-web protocols.
 *
 * This is the former app-initial `Asn`/`SWt` helper. Keeping the URL parsing
 * boundary local makes the policy consumers independent from the aggregation
 * hub without changing its null-on-invalid contract.
 */
export function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
