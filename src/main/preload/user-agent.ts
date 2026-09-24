// 桌面应用的 User-Agent 构造（用于应用内发起的网络请求标识）。

const PLATFORM_UA_SEGMENTS: Record<string, string> = {
  darwin: "Mac OS",
  linux: "X11; Linux",
  win32: "Windows NT 10.0",
};

export function buildDesktopUserAgent({
  appVersion,
  platform = process.platform,
  arch = process.arch,
}: {
  appVersion: string;
  platform?: string;
  arch?: string;
}): string {
  return `Codex Desktop/${appVersion} (${PLATFORM_UA_SEGMENTS[platform] ?? platform}; ${arch})`;
}
