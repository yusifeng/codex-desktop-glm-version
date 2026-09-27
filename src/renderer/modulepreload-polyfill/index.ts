import "@rchunk/rolldown-runtime";

interface ModulePreloadLink extends HTMLLinkElement {
  ep?: boolean;
}

function fetchOptions(link: HTMLLinkElement): RequestInit {
  const options: RequestInit = {};
  if (link.integrity) options.integrity = link.integrity;
  if (link.referrerPolicy) options.referrerPolicy = link.referrerPolicy as ReferrerPolicy;
  options.credentials =
    link.crossOrigin === "use-credentials"
      ? "include"
      : link.crossOrigin === "anonymous"
        ? "omit"
        : "same-origin";
  return options;
}

function preload(link: ModulePreloadLink): void {
  if (link.ep) return;
  link.ep = true;
  void fetch(link.href, fetchOptions(link));
}

function initializeModulePreloadPolyfill(): void {
  const relationList = document.createElement("link").relList;
  if (relationList?.supports?.("modulepreload")) return;
  for (const link of document.querySelectorAll<ModulePreloadLink>(
    'link[rel="modulepreload"]',
  ))
    preload(link);
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type !== "childList") continue;
      for (const node of record.addedNodes) {
        if (node instanceof HTMLLinkElement && node.rel === "modulepreload")
          preload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
}

export { initializeModulePreloadPolyfill as t };
