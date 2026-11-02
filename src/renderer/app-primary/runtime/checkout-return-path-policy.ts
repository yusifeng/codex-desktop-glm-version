const RETURN_PATH_PARAM = "beacon_return_path";
const LEGACY_RETURN_TO_PARAM = "lightweight_return_to";

/** Validate the relative ChatGPT return paths accepted by checkout flows. */
export function normalizeCheckoutReturnPath(value: string | null | undefined): string | null {
  if (
    value == null ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    Array.from(value).some((character) => character.charCodeAt(0) <= 32)
  ) return null;
  try {
    const url = new URL(value, "https://chatgpt.com");
    if (
      url.origin !== "https://chatgpt.com" ||
      (url.pathname !== "/" && !/^\/c\/[A-Za-z0-9_-]+$/u.test(url.pathname))
    ) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function normalizeLegacyReturnTo(value: string, baseUrl: URL): string | null {
  if (value.includes("\\") || Array.from(value).some((character) => character.charCodeAt(0) <= 32)) return null;
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") ||
      url.origin !== baseUrl.origin ||
      url.username.length !== 0 ||
      url.password.length !== 0
    ) return null;
    const basePath = baseUrl.pathname.replace(/\/$/u, "");
    if (basePath.length !== 0 && !url.pathname.startsWith(`${basePath}/`)) return null;
    const result = normalizeCheckoutReturnPath(`${url.pathname.slice(basePath.length)}${url.search}${url.hash}`);
    return result?.startsWith("/c/") === true ? result : null;
  } catch {
    return null;
  }
}

/** Resolve the canonical return path from current and legacy checkout query parameters. */
export function resolveCheckoutReturnPath(
  input: string | URLSearchParams,
  baseUrl?: URL | null,
): string | null {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  if (params.has(RETURN_PATH_PARAM)) return normalizeCheckoutReturnPath(params.get(RETURN_PATH_PARAM));
  if (baseUrl == null) return null;
  const values = params.getAll(LEGACY_RETURN_TO_PARAM);
  return values.length === 1 ? normalizeLegacyReturnTo(values[0], baseUrl) : null;
}

/** Copy a validated checkout return path into an outbound query object. */
export function applyCheckoutReturnPath(
  input: string | URLSearchParams,
  output: URLSearchParams,
  baseUrl?: URL | null,
): URLSearchParams {
  const returnPath = resolveCheckoutReturnPath(input, baseUrl);
  if (returnPath != null) output.set(RETURN_PATH_PARAM, returnPath);
  return output;
}

