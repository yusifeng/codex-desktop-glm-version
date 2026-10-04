/** Pure path and icon input validation for open-in target descriptors. */

export function normalizeAppsPath(value: string): string {
  return value.startsWith(`apps/`) ? `/${value}` : value;
}

export function isPackagedAppPath(value: string): boolean {
  const normalized = value.startsWith(`/`) ? value.slice(1) : value;
  return normalized.startsWith(`apps/`) && !normalized.split(`/`).includes(`..`);
}

export function isDataImage(value: string): boolean {
  return /^data:image\/(?:png|jpe?g|gif|webp|bmp|x-icon|vnd\.microsoft\.icon);base64,/i.test(value);
}

export interface TargetPathApi {
  posix: { isAbsolute(value: string): boolean };
  win32: { parse(value: string): { root: string }; isAbsolute(value: string): boolean };
}

export function isAbsoluteTargetPath(value: string, platform: string, pathApi: TargetPathApi): boolean {
  if (platform !== `win32`) return pathApi.posix.isAbsolute(value);
  const root = pathApi.win32.parse(value).root;
  return pathApi.win32.isAbsolute(value) && (root.includes(`:`) || root.startsWith(`\\\\`));
}

if (typeof module !== "undefined") module.exports = {
  normalizeAppsPath,
  isPackagedAppPath,
  isDataImage,
  isAbsoluteTargetPath,
};
