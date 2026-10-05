/** Build the canonical extension channel path from a base and encoded id. */
export function buildExtensionChannelPath(base: string, channelId: string, encode: (value: string) => string): string {
  return `${base}/${encode(channelId)}`;
}
