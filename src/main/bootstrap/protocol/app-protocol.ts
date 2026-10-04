// app:// 自定义协议：
//  - app://-/ 服务 webview 静态资源（含路径穿越防护：拒绝 `..` 段与逃逸出
//    webview 根目录的路径）；
//  - app://fs/@fs/<绝对路径> 提供本机媒体文件（仅 audio/image/video MIME，
//    支持 Range 请求用于音视频流）。
// 另含：特权 scheme 注册（必须在 app ready 前调用）、session 级
// app://fs 访问限制（仅本应用 frame 可访问）、dev server origin 解析。
// 对应 bootstrap-C4dRql4x.ts 3311-3514 行（nt~Dt 全部）。
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { isAbsolute, join, posix, relative, resolve } from "node:path";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";
import { app, net, protocol, session } from "electron";
import {
  $o as sandboxScheme, // 'codex-sandbox'
  El as stripDriveLetterSlash, // '/c:/foo' → 'c:/foo'
  Tl as toForwardSlashes, // 反斜杠 → 斜杠
  vl as isAbsolutePath, // POSIX / Windows 盘符 / UNC 绝对路径判定
} from "@chunk/shared";
import { tt as mimeTypes } from "../vendor";
import type { NetworkPolicy } from "../net/network-policy";

const APP_HOST = "-"; // nt
const FS_HOST = "fs"; // rt
const INDEX_ENTRY = "index.html"; // it
const DETACHED_WINDOW_ENTRY = "detached-window.html"; // at
const FS_PATH_PREFIX = "/@fs"; // ot
const APP_ORIGIN = `app://${APP_HOST}`; // st
const FS_ORIGIN = `app://${FS_HOST}`; // ct

/**
 * 把 app / codex-sandbox 注册为特权 scheme（原 lt）。
 * 必须在 app ready 之前调用（registerSchemesAsPrivileged 的要求）。
 */
export function registerPrivilegedAppSchemes(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "app",
      privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true },
    },
    {
      scheme: sandboxScheme,
      privileges: {
        allowServiceWorkers: true,
        corsEnabled: true,
        standard: true,
        secure: true,
        stream: true,
        supportFetchAPI: true,
      },
    },
  ]);
}

/** webview 静态资源目录（原 ut）：相对给定根目录向上两级再进 webview。 */
export function getWebviewDir(root: string): string {
  return join(root, "..", "..", "webview");
}

/** Resolve the file path used by the main-process trust gate for the webview entry. */
export function getWebviewEntryPath(moduleDir: string): string {
  return join(getWebviewDir(moduleDir), INDEX_ENTRY);
}

/** 渲染入口文件名（原 dt）：detached-window 路由用独立入口。 */
export function rendererEntryForRoute(route: string): string {
  return route === "/detached-window" ? DETACHED_WINDOW_ENTRY : INDEX_ENTRY;
}

/** 构造渲染页 URL（原 ft）：app://-/<入口>?initialRoute=<route>。 */
export function resolveRendererUrl(
  route: string,
  options?: { mcpAppSandboxLocalDevelopment?: boolean },
): string {
  const url = new URL(`${APP_ORIGIN}/${rendererEntryForRoute(route)}`);
  if (route) url.searchParams.set("initialRoute", route);
  if (options?.mcpAppSandboxLocalDevelopment === true)
    url.searchParams.set("mcpAppSandboxLocalDevelopment", "1");
  return url.toString();
}

/**
 * 解析 app://fs/@fs/<绝对路径> 媒体 URL（原 mt）：
 * 仅接受指向 audio/image/video 文件的绝对路径，其余返回 null。
 */
export function parseAppFsMediaUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  return url.protocol !== "app:" || url.host !== FS_HOST || !url.pathname.startsWith(FS_PATH_PREFIX)
    ? null
    : resolveFsMediaPath(url.pathname);
}

/**
 * 开发模式的渲染 dev server origin（原 xt）：从 ELECTRON_RENDERER_URL 解析，
 * 仅接受 http/https；打包后或未设置时返回 null。
 */
export function getDevRendererOrigin(): string | null {
  if (app.isPackaged) return null;
  const devServerUrl = process.env.ELECTRON_RENDERER_URL;
  if (devServerUrl == null || devServerUrl.trim().length === 0) return null;
  try {
    const parsed = new URL(devServerUrl);
    return parsed.protocol !== "http:" && parsed.protocol !== "https:" ? null : parsed.origin;
  } catch {
    return null;
  }
}

/**
 * 安装 app:// 协议处理器（原 ht）。
 * webviewRoot 为静态资源根目录；networkPolicy 用于给默认 session 加
 * app://fs 访问限制（仅本应用 frame 可访问）。
 */
export function installAppProtocolHandler(webviewRoot: string, networkPolicy: NetworkPolicy): void {
  installDefaultSessionFsRestriction(networkPolicy);
  protocol.handle("app", async (request) => {
    const path = resolveAppProtocolPath(request.url, webviewRoot);
    return path
      ? isAudioVideoFile(path)
        ? serveFileWithRanges(request, path)
        : process.platform === "win32"
          ? net.fetch(pathToFileURL(path).toString())
          : serveFileResponse(path)
      : notFound();
  });
}

/** URL 的 origin；app: 协议按 host 重建（原 bt）。 */
function originOf(url: string | null | undefined): string | null {
  if (url == null) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "app:" ? `app://${parsed.host}` : parsed.origin;
  } catch {
    return null;
  }
}

/** frame 是否属于本应用（app://- 或 dev server，原 _t）。 */
function isAppFrameUrl(frameUrl: string | null | undefined): boolean {
  const origin = originOf(frameUrl);
  return origin == null ? false : origin === APP_ORIGIN || origin === getDevRendererOrigin();
}

/** frame 是否不属于本应用（原 vt）。 */
function isForeignFrame(frame: { url?: string | null } | null | undefined): boolean {
  return !isAppFrameUrl(frame?.url);
}

/** 给默认 session 加 app://fs 访问限制：非本应用 frame 的请求一律取消（原 yt）。 */
function installDefaultSessionFsRestriction(networkPolicy: NetworkPolicy): void {
  networkPolicy.addSessionRestriction(session.defaultSession, (details) => ({
    cancel: originOf(details.url) === FS_ORIGIN && isForeignFrame(details.frame),
  }));
}

/** 取 app:// URL 的 pathname（去 query/hash；非 app:// 返回 null，原 St）。 */
function getAppUrlPathname(url: string): string | null {
  if (!url.startsWith("app://")) return null;
  const rest = url.slice(6);
  const slashIndex = rest.indexOf("/");
  return (slashIndex >= 0 ? rest.slice(slashIndex) : "/").split("?")[0].split("#")[0];
}

/** 路径中是否含 `..` 或 ".. " 之类的父目录段（路径穿越防护，原 Ct）。 */
function hasParentDirectorySegment(path: string): boolean {
  return path.split("/").some((segment) => segment === ".." || /^\.\.[. ]+$/.test(segment));
}

/**
 * 把 app:// 请求 URL 解析成本地文件路径（原 pt）。
 * - /@fs 前缀走 app://fs 媒体路径解析（仅限 media MIME）；
 * - 其余路径相对 webviewRoot 解析，拒绝 `..` 逃逸；根路径映射到 index.html；
 * - 任何不合法（非 app: 协议、非法 host、穿越、坏转义）返回 null。
 */
function resolveAppProtocolPath(rawUrl: string, webviewRoot: string): string | null {
  const pathname = getAppUrlPathname(rawUrl);
  if (!pathname) return null;
  try {
    if (hasParentDirectorySegment(toForwardSlashes(decodeURIComponent(pathname)))) return null;
  } catch {
    return null;
  }
  const url = new URL(rawUrl);
  if (url.protocol !== "app:") return null;
  if (url.pathname.startsWith(FS_PATH_PREFIX))
    return url.host === FS_HOST ? resolveFsMediaPath(url.pathname) : null;
  if (url.host && url.host !== APP_HOST) return null;
  const rawPath = url.pathname ? url.pathname : "/";
  const forward = toForwardSlashes(rawPath);
  const withoutLeadingSlash = forward.startsWith("/") ? forward.slice(1) : forward;
  const normalized = posix.normalize(withoutLeadingSlash);
  if (normalized === "." || normalized === "") return join(webviewRoot, INDEX_ENTRY);
  if (normalized.startsWith("..") || normalized.includes("/..")) return null;
  const absolutePath = join(webviewRoot, ...normalized.split("/"));
  const relativePath = relative(webviewRoot, absolutePath);
  return relativePath.startsWith("..") || isAbsolute(relativePath) ? null : absolutePath;
}

/**
 * 解析 /@fs/<绝对路径> 媒体路径（原 wt）：解码后必须是绝对路径（Windows 的
 * `/c:/…` 盘符前缀会被剥掉再 resolve），且 MIME 必须是 audio/image/video。
 */
function resolveFsMediaPath(
  pathname: string,
  resolvePath: (path: string) => string = resolve,
): string | null {
  const encoded = pathname.slice(4);
  if (!encoded) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(encoded);
  } catch {
    return null;
  }
  const forward = toForwardSlashes(decoded);
  if (!isAbsolutePath(forward)) return null;
  const absolutePath = resolvePath(stripDriveLetterSlash(forward));
  const contentType = mimeTypes.lookup(absolutePath);
  return typeof contentType !== "string" ||
    (!contentType.startsWith("audio/") &&
      !contentType.startsWith("image/") &&
      !contentType.startsWith("video/"))
    ? null
    : absolutePath;
}

/** 是否为 audio/video 文件（原 Tt，走 Range 请求分支）。 */
function isAudioVideoFile(path: string): boolean {
  const contentType = mimeTypes.lookup(path);
  return (
    typeof contentType === "string" &&
    (contentType.startsWith("audio/") || contentType.startsWith("video/"))
  );
}

function notFound(): Response {
  return new Response(null, { status: 404, statusText: "Not Found" });
}

/** 流式返回文件（原 gt；win32 之外的默认分支）。 */
async function serveFileResponse(path: string): Promise<Response> {
  let info;
  try {
    info = await stat(path);
  } catch {
    return notFound();
  }
  if (!info.isFile()) return notFound();
  const contentType = mimeTypes.lookup(path);
  return new Response(Readable.toWeb(createReadStream(path)), {
    headers: {
      "Content-Length": String(info.size),
      "Content-Type": typeof contentType === "string" ? contentType : "application/octet-stream",
    },
  });
}

/** 带 Range 支持的文件响应（原 Et）：无 Range 头返回 200 全量流，合法返回 206，非法返回 416。 */
async function serveFileWithRanges(request: Request, path: string): Promise<Response> {
  let info;
  try {
    info = await stat(path);
  } catch {
    return notFound();
  }
  const contentType = mimeTypes.lookup(path);
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Content-Type": typeof contentType === "string" ? contentType : "application/octet-stream",
  });
  const rangeHeader = request.headers.get("range");
  if (!rangeHeader) {
    headers.set("Content-Length", String(info.size));
    return new Response(Readable.toWeb(createReadStream(path)), { headers });
  }
  const range = parseRangeHeader(rangeHeader, info.size);
  if (range) {
    headers.set("Content-Length", String(range.end - range.start + 1));
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${info.size}`);
    return new Response(
      Readable.toWeb(createReadStream(path, { start: range.start, end: range.end })),
      { status: 206, statusText: "Partial Content", headers },
    );
  }
  headers.set("Content-Range", `bytes */${info.size}`);
  return new Response(null, { status: 416, statusText: "Range Not Satisfiable", headers });
}

/** 解析 `bytes=<start>-<end>` Range 头（原 Dt）；非法返回 null。 */
function parseRangeHeader(rangeHeader: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
  if (!match) return null;
  const [, startText, endText] = match;
  if (startText === "" && endText === "") return null;
  if (startText === "") {
    // 后缀长度：bytes=-N 取最后 N 个字节
    const suffixLength = Number(endText);
    return suffixLength <= 0 || size === 0
      ? null
      : { start: Math.max(size - suffixLength, 0), end: size - 1 };
  }
  const start = Number(startText);
  const end = endText === "" ? size - 1 : Number(endText);
  return start < 0 || end < start || start >= size
    ? null
    : { start, end: Math.min(end, size - 1) };
}
