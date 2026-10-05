/** Pure Windows/WSL host path predicates and conversions used by the worker. */

export function isWslMountedPath(path: string): boolean {
  return /^\/mnt\/[a-zA-Z](?:\/|$)/.test(path) || /^\\{1,2}[Mm][Nn][Tt]\\[a-zA-Z](?:\\|$)/.test(path);
}

export function isWindowsPath(path: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(path) || path.startsWith(`\\\\`) || path.startsWith(`//`);
}

export function isWslUncPath(path: string): boolean {
  return /^(\\\\|\/\/)(?:\?[\\/]UNC[\\/])?(wsl\$|wsl\.localhost)[\\/]/i.test(path);
}

export function wslUncDistro(path: string): string | null {
  return path.match(/^(?:\\\\|\/\/)(?:\?[\\/]UNC[\\/])?(?:wsl\$|wsl\.localhost)[\\/]([^\\/]+)/i)?.[1] ?? null;
}

export function mountedPathToWindows(path: string): string {
  const drive = path.match(/^\/mnt\/([a-zA-Z])(?:\/(.*))?$/);
  if (drive) return `${drive[1].toUpperCase()}:\\${(drive[2] ?? ``).replace(/\//g, `\\`)}`;
  const mounted = path.match(/^\\{1,2}[Mm][Nn][Tt]\\([a-zA-Z])(?:\\(.*))?$/i);
  if (mounted) return `${mounted[1].toUpperCase()}:\\${(mounted[2] ?? ``).replace(/[\\/]/g, `\\`)}`;
  const legacy = path.match(/^C:\\mnt\\c(.*)$/i);
  return legacy
    ? `C:\\${legacy[1].replace(/^([\\/])+/, ``).replace(/[\\/]/g, `\\`)}`
    : path.replace(/\//g, `\\`);
}

export function windowsPathToWsl(path: string): string {
  const unc = path.match(/^(?:\\\\|\/\/)?[?][\\/]UNC[\\/](wsl\$|wsl\.localhost)[\\/](.*)$/i);
  if (unc) return windowsPathToWsl(`\\\\${unc[1]}\\${unc[2]}`);
  const extendedDrive = path.match(/^(?:\\\\|\/\/)[?][\\/]([a-zA-Z]):[\\/](.*)$/);
  if (extendedDrive) return `/mnt/${extendedDrive[1].toLowerCase()}/${extendedDrive[2].replace(/\\/g, `/`)}`;
  if (/^(\\\\|\/\/)(wsl\$|wsl\.localhost)/i.test(path)) {
    const parts = path.replace(/^((\\\\|\/\/)(wsl\$|wsl\.localhost)[\\/]+)/i, ``).split(/[\\/]/);
    parts.shift();
    const result = parts.join(`/`).replace(/\\/g, `/`);
    return result.length === 0 ? `/` : result.startsWith(`/`) ? result : `/${result}`;
  }
  if (path.startsWith(`\\\\`) || path.startsWith(`//`)) return toBackslashes(path);
  if (path.startsWith(`/`)) return path;
  const drive = path.match(/^([a-zA-Z]):[\\/](.*)$/);
  return drive ? `/mnt/${drive[1].toLowerCase()}/${drive[2].replace(/\\/g, `/`)}` : path.replace(/\\/g, `/`);
}

export function toBackslashes(path: string): string {
  return path.replace(/\//g, `\\`);
}

module.exports = { isWslMountedPath, isWindowsPath, isWslUncPath, wslUncDistro, mountedPathToWindows, windowsPathToWsl, toBackslashes };
