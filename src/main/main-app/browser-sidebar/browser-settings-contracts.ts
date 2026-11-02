export const BROWSER_EXTENSIONS_URL = "chrome://extensions/";
export const BROWSER_PASSWORD_MANAGER_URL = "chrome://password-manager/";
export const BROWSER_CONTACT_SETTINGS_URLS = ["chrome://settings/addresses", "chrome://settings/contactInfo"];
export const BROWSER_SITE_SETTINGS_URLS = ["chrome://settings/content", "chrome://settings/privacy", "chrome://settings/handlers", "chrome://settings/cookies"];
export const CONTACT_SETTINGS_PARTITION = "persist:codex-contact-info-settings";
export const PASSWORD_MANAGER_PARTITION = "persist:codex-password-manager-settings";
export const SITE_SETTINGS_PARTITION = "persist:codex-site-settings";

const ROUTES = new Map([
  ["downloads", "/settings/browser-use/downloads"],
  ["history", "/settings/browser-use/history"],
]);

export function browserSettingsRoutePathForUrl(value: string): string | null {
  try {
    const url = new URL(value.replace(/^chrome:\/{0,3}/i, "chrome://"));
    if (url.protocol !== "chrome:" || url.username || url.password || url.port) return null;
    const route = ROUTES.get(decodeURIComponent(url.hostname).toLowerCase());
    return route == null ? null : `${route}${url.search}`;
  } catch {
    return null;
  }
}
