const CHROME_WEB_STORE_DETAIL_URL = "https://chromewebstore.google.com/detail";

/** Build the Chrome Web Store detail URL after validating the extension id. */
export function buildChromeExtensionStoreUrl(extensionId: string): string {
  const normalized = extensionId.trim();
  if (!/^[a-p]{32}$/u.test(normalized)) throw new Error(`Invalid Chromium extension ID "${extensionId}".`);
  return `${CHROME_WEB_STORE_DETAIL_URL}/${normalized}`;
}
