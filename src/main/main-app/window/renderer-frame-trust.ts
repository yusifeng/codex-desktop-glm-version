import { pathToFileURL } from "node:url";
import { isAppFrameUrl, sameOrigin } from "../util/url-trust";

export function resolveRendererEntryUrl(
  environmentUrl: string | undefined,
  packagedEntryUrl: string,
): string {
  return environmentUrl || packagedEntryUrl;
}

export function rendererOrigin(rendererUrl: string): string | null {
  try {
    const url = new URL(rendererUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

export function isTrustedRendererFrameUrl(
  frameUrl: string,
  options: { rendererUrl: string; webviewEntryPath: string },
): boolean {
  if (frameUrl === "about:blank" || isAppFrameUrl(frameUrl)) return true;
  const origin = rendererOrigin(options.rendererUrl);
  if (origin != null && sameOrigin(frameUrl, origin)) return true;
  return frameUrl.startsWith(pathToFileURL(options.webviewEntryPath).toString());
}

export function isTrustedRendererSenderFrame(
  sender: { mainFrame: object & { url: string } },
  senderFrame: (object & { url: string }) | null | undefined,
  options: { rendererUrl: string; webviewEntryPath: string },
): boolean {
  if (senderFrame != null && senderFrame !== sender.mainFrame) return false;
  return isTrustedRendererFrameUrl((senderFrame ?? sender.mainFrame).url, options);
}

if (typeof module !== "undefined") module.exports = {
  isTrustedRendererFrameUrl,
  isTrustedRendererSenderFrame,
  rendererOrigin,
  resolveRendererEntryUrl,
};
