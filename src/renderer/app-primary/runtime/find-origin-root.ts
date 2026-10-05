export interface OriginRoot { originUrl?: string | null; root?: string | null }

/** Find the root associated with a normalized origin URL. */
export function findOriginRoot(url: string, origins: OriginRoot[] | null | undefined, normalize: (value: string) => string | null, matches: (candidate: string, target: string) => boolean): string | null {
  const target = normalize(url);
  if (target == null) return null;
  return origins?.find((origin) => origin.originUrl != null && matches(normalize(origin.originUrl) ?? "", target))?.root ?? null;
}
