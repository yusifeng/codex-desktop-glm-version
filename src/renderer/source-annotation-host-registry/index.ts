import { n as createLazyInitializerValue } from "@rchunk/rolldown-runtime";
import {
  getBrowserTabUrlState,
  hasBrowserCommentHandler,
  initializeBrowserTabUrlState,
  registerBrowserCommentHandler,
  registerBrowserContextProvider,
  resolveBrowserContext,
  setBrowserTabUrlState,
  subscribeBrowserCommentReadiness,
  submitBrowserComment,
  waitForBrowserCommentHandler,
} from "../app-primary-browser-comment-runtime";

type AnnotationHostCallback = () => boolean;
type RegistryListener = () => void;
type LazyInitializer = <Value>(factory: () => Value) => () => Value;

const createLazyInitializer = createLazyInitializerValue as LazyInitializer;

let annotationHosts: Map<string, AnnotationHostCallback>;
let registryListeners: Map<string, Set<RegistryListener>>;

function annotationHostKey(browserTabId: string, conversationId: string): string {
  return `${conversationId}\0${browserTabId}`;
}

function hasSourceAnnotationHost(browserTabId: string, conversationId: string): boolean {
  return annotationHosts.has(annotationHostKey(browserTabId, conversationId));
}

function subscribeSourceAnnotationHost(
  browserTabId: string,
  conversationId: string,
  listener: RegistryListener,
): () => void {
  const key = annotationHostKey(browserTabId, conversationId);
  const listeners = registryListeners.get(key) ?? new Set<RegistryListener>();
  listeners.add(listener);
  registryListeners.set(key, listeners);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) registryListeners.delete(key);
  };
}

function requestSourceAnnotationHost(browserTabId: string, conversationId: string): boolean {
  return annotationHosts.get(annotationHostKey(browserTabId, conversationId))?.() ?? false;
}

function registerSourceAnnotationHost(
  browserTabId: string,
  conversationId: string,
  callback: AnnotationHostCallback,
): () => void {
  const key = annotationHostKey(browserTabId, conversationId);
  annotationHosts.set(key, callback);
  for (const listener of registryListeners.get(key) ?? []) listener();
  return () => {
    if (annotationHosts.get(key) !== callback) return;
    annotationHosts.delete(key);
    for (const listener of registryListeners.get(key) ?? []) listener();
  };
}

const initializeSourceAnnotationHostRegistry = createLazyInitializer(() => {
  annotationHosts = new Map<string, AnnotationHostCallback>();
  registryListeners = new Map<string, Set<RegistryListener>>();
});

Object.assign(initializeSourceAnnotationHostRegistry, {
  browserComments: {
    getBrowserTabUrlState,
    hasBrowserCommentHandler,
    initializeBrowserTabUrlState,
    registerBrowserCommentHandler,
    registerBrowserContextProvider,
    resolveBrowserContext,
    setBrowserTabUrlState,
    subscribeBrowserCommentReadiness,
    submitBrowserComment,
    waitForBrowserCommentHandler,
  },
});

export {
  subscribeSourceAnnotationHost as a,
  registerSourceAnnotationHost as i,
  initializeSourceAnnotationHostRegistry as n,
  hasSourceAnnotationHost as r,
  requestSourceAnnotationHost as t,
};
