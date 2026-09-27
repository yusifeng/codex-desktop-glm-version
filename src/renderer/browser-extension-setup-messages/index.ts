import "@rchunk/app-shared";

export interface BrowserExtensionMessage { defaultMessage: string; description: string; id: string }
const genericName: BrowserExtensionMessage = { id: "plugins.browserExtension.name", defaultMessage: "ChatGPT browser extension", description: "Name of the ChatGPT extension for a Chromium browser" };
const genericDescription: BrowserExtensionMessage = { id: "plugins.installModal.browserExtension.description", defaultMessage: "Install this extension to connect ChatGPT to your browser", description: "Description for the required Chromium browser extension in the plugin finish setup modal" };
const messages: Record<string, { description: BrowserExtensionMessage; name: BrowserExtensionMessage }> = {
  chrome: { name: { id: "plugins.browserExtension.chrome.name", defaultMessage: "ChatGPT for Chrome", description: "Name of the ChatGPT extension for Chrome" }, description: { id: "plugins.installModal.codexChrome.description", defaultMessage: "Install this extension in Chrome to connect ChatGPT to your browser", description: "Description for the required Chrome browser extension in the plugin finish setup modal" } },
  edge: { name: { id: "plugins.browserExtension.edge.name", defaultMessage: "ChatGPT for Edge", description: "Name of the ChatGPT extension for Edge" }, description: { id: "plugins.installModal.edgeBrowserExtension.description", defaultMessage: "Install this extension in Edge to connect ChatGPT to your browser", description: "Description for the required Edge browser extension in the plugin finish setup modal" } },
};
const browserExtensionName = (browserFamily: string): BrowserExtensionMessage => messages[browserFamily]?.name ?? genericName;
const browserExtensionDescription = (browserFamily: string): BrowserExtensionMessage => messages[browserFamily]?.description ?? genericDescription;
const initialize = (): void => {};
export { browserExtensionName as n, initialize as r, browserExtensionDescription as t };
