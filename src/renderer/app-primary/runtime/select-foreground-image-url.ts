/** Select and validate the foreground image URL for a surface. */
export function selectForegroundImageUrl(
  image: { foreground_image_url?: string | null; foreground_image_url_dark?: string | null } | null | undefined,
  useDarkVariant: boolean,
  enabled: boolean,
  isValidUrl: (value: string | null | undefined) => boolean,
): string | null {
  if (!enabled || image == null) return null;
  const candidate = useDarkVariant && image.foreground_image_url_dark != null
    ? image.foreground_image_url_dark
    : image.foreground_image_url;
  return isValidUrl(candidate) ? candidate ?? null : null;
}
