/** Returns the final non-empty segment of a normalized path. */
export function getPathBasename(value: string): string {
  const extendedUnc = value.match(/^\\\\\?\\UNC\\(.*)$/i);
  const extendedDrive = value.match(/^\\\\\?\\([a-zA-Z]:[\\/].*)$/);
  const normalized = (extendedUnc == null
    ? extendedDrive == null
      ? value
      : extendedDrive[1]
    : `\\\\${extendedUnc[1]}`
  )
    .replace(/\\/g, "/")
    .replace(/\/+$/, "");
  return normalized.split("/").at(-1) ?? normalized;
}
