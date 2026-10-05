/** Return whether a path ends with one of the configured extensions. */
export function hasAllowedFileExtension(path: string, extensions: readonly string[] | null | undefined): boolean {
  return !extensions?.length || extensions.some((extension) => path.toLowerCase().endsWith(`.${extension}`));
}
