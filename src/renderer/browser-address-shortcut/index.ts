import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import { BrowserAddressSuggestionOverlay } from "@rchunk/browser-address-suggestion-overlay";

const {
  $3: initializeRuntimeLazy,
  G3: hostMessageBridge,
  HG: serializeBrowserTabMention,
  I3: getJsxRuntime,
  LG: browserTabMentionSchema,
  VG: parseBrowserTabMention,
  e6: getReactRuntime,
  wu: composerSuggestionPlugin,
} = appSharedChunk;
const {
  UZ: useComposerSuggestionState,
  VZ: initializeBrowserAutocompleteState,
} = appInitialChunk as typeof appInitialChunk & {
  UZ: <Value>(controller: ComposerController, reader: (controller: ComposerController) => Value) => Value;
};

interface BrowserTabMentionIdentity {
  browserId: string;
  pluginId?: string | null;
  snapshot?: unknown;
  source: string;
  tabId: string;
}

interface BrowserTabMentionUpdate extends BrowserTabMentionIdentity {
  faviconUrl?: string | null;
}

interface EditorNode {
  attrs: Record<string, unknown>;
  isBlock?: boolean;
  isInline?: boolean;
  isText?: boolean;
  textContent?: string;
  type: { name: string };
}

interface EditorDocument {
  descendants(visitor: (node: EditorNode, position: number) => boolean | void): void;
}

interface EditorTransaction {
  docChanged: boolean;
  setMeta(key: string, value: unknown): EditorTransaction;
  setNodeMarkup(position: number, type: unknown, attributes: Record<string, unknown>): EditorTransaction;
}

interface ComposerController {
  attachBrowserAutocompleteRuntime(runtime: BrowserAutocompleteRuntime): void;
  eventEmitter: {
    addListener(event: string, listener: () => void): void;
    emit(event: string): void;
    removeListener(event: string, listener: () => void): void;
  };
  getBrowserAutocompleteRuntime(): BrowserAutocompleteRuntime | null | undefined;
  setText(value: string): void;
  view: {
    dispatch(transaction: EditorTransaction): void;
    dom: HTMLElement;
    hasFocus(): boolean;
    isDestroyed: boolean;
    state: {
      doc: EditorDocument;
      tr: EditorTransaction;
    };
  };
}

interface BrowserAddressShortcutProps {
  browserConversationId?: string | null;
  composerController: ComposerController;
  composerId: string;
  placement?: string;
}

interface BrowserSuggestionState extends Record<string, unknown> {
  active?: boolean;
  kind?: string;
}

const DISMISSAL_EVENT = "browser-autocomplete-mention-dismissal-change";

class BrowserAutocompleteRuntime {
  private readonly composerController: ComposerController;
  private mentionDismissalFrame: number | null = null;
  private mentionDismissalTimeout: number | null = null;
  private mentionPath: string | null = null;
  private readonly metadataCleanups = new Set<() => void>();
  private prefersReducedMotion: boolean | null = null;

  constructor(composerController: ComposerController) {
    this.composerController = composerController;
  }

  subscribeMentionDismissal = (listener: () => void): (() => void) => {
    this.composerController.eventEmitter.addListener(DISMISSAL_EVENT, listener);
    return () => this.composerController.eventEmitter.removeListener(DISMISSAL_EVENT, listener);
  };

  getMentionDismissalSnapshot = (): boolean => this.mentionDismissalTimeout != null;

  setReducedMotion(value: boolean | null): void {
    this.prefersReducedMotion = value;
  }

  setMentionPath(path: string | null): void {
    this.mentionPath = path;
  }

  hasStandaloneMention(): boolean {
    if (this.mentionPath == null || this.composerController.view.isDestroyed) return false;
    let foundMention = false;
    let foundOtherContent = false;
    this.composerController.view.state.doc.descendants((node) => {
      if (node.type.name === "browserTabMention" && node.attrs.path === this.mentionPath) {
        foundOtherContent ||= foundMention;
        foundMention = true;
        return false;
      }
      if (node.isText) {
        foundOtherContent ||= (node.textContent ?? "").trim().length > 0;
      } else if (node.isInline || (node.isBlock && node.type.name !== "paragraph")) {
        foundOtherContent = true;
      }
      return !foundOtherContent;
    });
    return foundMention && !foundOtherContent;
  }

  dismissStandaloneMentionOnBlur(): void {
    this.cancelMentionDismissal();
    let canWaitForConnection = true;
    const check = () => {
      this.mentionDismissalFrame = null;
      const view = this.composerController.view;
      if (view.isDestroyed || view.hasFocus() || !this.hasStandaloneMention()) return;
      if (!view.dom.isConnected) {
        if (canWaitForConnection) {
          canWaitForConnection = false;
          this.mentionDismissalFrame = requestAnimationFrame(check);
        }
        return;
      }
      if (this.prefersReducedMotion ?? window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        this.composerController.setText("");
        return;
      }
      this.mentionDismissalTimeout = window.setTimeout(() => this.completeMentionDismissal(), 150);
      this.composerController.eventEmitter.emit(DISMISSAL_EVENT);
    };
    this.mentionDismissalFrame = requestAnimationFrame(check);
  }

  cancelMentionDismissal(): void {
    if (this.mentionDismissalFrame != null) {
      cancelAnimationFrame(this.mentionDismissalFrame);
      this.mentionDismissalFrame = null;
    }
    if (this.mentionDismissalTimeout != null) {
      window.clearTimeout(this.mentionDismissalTimeout);
      this.mentionDismissalTimeout = null;
      this.composerController.eventEmitter.emit(DISMISSAL_EVENT);
    }
  }

  completeMentionDismissal(): void {
    const shouldClear = !this.composerController.view.isDestroyed
      && !this.composerController.view.hasFocus()
      && this.hasStandaloneMention();
    this.cancelMentionDismissal();
    if (shouldClear) this.composerController.setText("");
  }

  updateMention(update: BrowserTabMentionUpdate): boolean {
    if (this.composerController.view.isDestroyed) return false;
    const parsed = browserTabMentionSchema.safeParse({
      browserId: update.browserId,
      pluginId: update.pluginId,
      source: update.source,
      tabId: update.tabId,
      snapshot: update.snapshot,
    });
    if (!parsed.success) return false;
    const nextPath = serializeBrowserTabMention(parsed.data);
    const faviconUrl = update.faviconUrl ?? "";
    let transaction = this.composerController.view.state.tr;
    let found = false;
    this.composerController.view.state.doc.descendants((node, position) => {
      if (node.type.name !== "browserTabMention") return true;
      const identity = typeof node.attrs.path === "string" ? parseBrowserTabMention(node.attrs.path) : null;
      if (identity == null
        || identity.browserId !== update.browserId
        || identity.pluginId !== update.pluginId
        || identity.source !== update.source
        || identity.tabId !== update.tabId) return true;
      found = true;
      if (node.attrs.path === nextPath && node.attrs.faviconUrl === faviconUrl) return true;
      if (this.mentionPath === node.attrs.path) this.mentionPath = nextPath;
      transaction = transaction.setNodeMarkup(position, undefined, {
        ...node.attrs,
        faviconUrl,
        path: nextPath,
      });
      return true;
    });
    if (transaction.docChanged) {
      this.composerController.view.dispatch(transaction.setMeta("addToHistory", false));
    }
    return found;
  }

  trackMentionMetadata(cleanup: () => void): () => void {
    this.metadataCleanups.add(cleanup);
    return () => {
      if (this.metadataCleanups.delete(cleanup)) cleanup();
    };
  }

  dispose(): void {
    this.cancelMentionDismissal();
    this.mentionPath = null;
    for (const cleanup of this.metadataCleanups) cleanup();
    this.metadataCleanups.clear();
  }
}

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function readBrowserSuggestionState(controller: ComposerController): BrowserSuggestionState | null {
  const state = composerSuggestionPlugin.getState(controller.view.state) as BrowserSuggestionState | undefined;
  return state?.active === true && state.kind === "browser-autocomplete" ? state : null;
}

function BrowserAddressShortcut({
  browserConversationId,
  composerController,
  composerId,
  placement,
}: BrowserAddressShortcutProps): unknown {
  initializeBrowserAddressShortcut();
  const [runtime] = React.useState(
    () => composerController.getBrowserAutocompleteRuntime() ?? new BrowserAutocompleteRuntime(composerController),
  );
  const isDismissing = React.useSyncExternalStore(
    runtime.subscribeMentionDismissal,
    runtime.getMentionDismissalSnapshot,
    () => false,
  );
  const suggestionState = useComposerSuggestionState(composerController, readBrowserSuggestionState);

  React.useLayoutEffect(() => {
    composerController.attachBrowserAutocompleteRuntime(runtime);
  }, [composerController, runtime]);

  React.useLayoutEffect(() => {
    const parent = composerController.view.dom.parentElement;
    if (parent == null) return;
    if (isDismissing) parent.setAttribute("data-dismissing-browser-autocomplete-mention", "");
    else parent.removeAttribute("data-dismissing-browser-autocomplete-mention");
    return () => parent.removeAttribute("data-dismissing-browser-autocomplete-mention");
  }, [composerController, isDismissing]);

  React.useEffect(() => hostMessageBridge.subscribe(
    "browser-sidebar-web-contents-pointer-down",
    () => {
      if (composerController.view.hasFocus() && runtime.hasStandaloneMention()) {
        composerController.view.dom.blur();
      }
    },
  ), [composerController, runtime]);

  if (suggestionState == null) return null;
  return jsx.jsx(BrowserAddressSuggestionOverlay, {
    browserConversationId,
    composerController,
    composerId,
    placement,
    suggestionState,
  });
}

let initialized = false;
function initializeBrowserAddressShortcut(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeBrowserAutocompleteState();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeBrowserAddressShortcut();
export { BrowserAddressShortcut };
