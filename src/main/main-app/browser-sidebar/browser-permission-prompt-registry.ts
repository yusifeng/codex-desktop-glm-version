import { z } from "zod";

type DisposableSubscription = {
  [Symbol.dispose](): void;
};

type RpcCallback<T> = {
  (value: T): unknown;
  dup(): RpcCallback<T>;
  onRpcBroken(callback: () => void): void;
  [Symbol.dispose](): void;
};

type WebContentsLike = {
  id: number;
  isDestroyed(): boolean;
  once(event: "destroyed", callback: () => void): void;
  removeListener(event: "destroyed", callback: () => void): void;
};

type WindowState = {
  isClosing: boolean;
  owner: WebContentsLike;
  rendererInstanceId: unknown;
};

type ThreadState = {
  hostGeneration: unknown;
  mountGeneration: number;
  pendingTeardown: unknown;
  presented: boolean;
};

type PageState = {
  browserTabId: string;
  navigationVersion: number;
};

type PageEntry = {
  conversationId: string;
  page: PageState;
  threadState: ThreadState;
  windowState: WindowState;
};

type PermissionResponse = {
  action: string;
  geolocationAccuracy?: string;
};

type PermissionPrompt = {
  availableActions: string[];
  closed: boolean;
  embeddingOrigin?: string;
  geolocation?: {
    availableAccuracies: string[];
    initialAccuracy?: string;
  };
  id: string;
  once(event: "closed", callback: () => void): void;
  openSystemSettings(): unknown;
  permissions: Array<Record<string, unknown>>;
  presentation: unknown;
  requestingOrigin: string;
  respond(response: PermissionResponse): unknown;
  variant: string;
  webContents: WebContentsLike;
};

type PermissionPromptScope = {
  browserTabId: string;
  conversationId: string;
};

type PermissionPromptIdentity = PermissionPromptScope & {
  id: string;
  mountGeneration: number;
};

type PermissionPromptSnapshot = PermissionPromptIdentity & {
  availableActions: string[];
  embeddingOrigin?: string;
  geolocation?: {
    availableAccuracies: string[];
    initialAccuracy?: string;
  };
  permissions: Array<Record<string, unknown>>;
  presentation: unknown;
  requestingOrigin: string;
  variant: string;
};

type PendingPrompt = {
  entry: PageEntry;
  hostGeneration: unknown;
  navigationVersion: number;
  prompt: PermissionPrompt;
  rendererInstanceId: unknown;
  snapshot: PermissionPromptSnapshot;
};

export type BrowserPermissionPromptRegistryOptions = {
  createId(): string;
  findPage(webContentsId: number): PageEntry | null | undefined;
};

export const permissionPromptScopeSchema = z.object({
  browserTabId: z.string(),
  conversationId: z.string(),
});

export const permissionPromptIdentitySchema = permissionPromptScopeSchema.extend({
  id: z.string(),
  mountGeneration: z.number().int().nonnegative(),
});

export const permissionPromptResponseSchema = z.union([
  z
    .object({
      action: z.enum(["allow", "allow-this-time"]),
      geolocationAccuracy: z.enum(["approximate", "precise"]).optional(),
    })
    .strict(),
  z.object({ action: z.enum(["deny", "dismiss"]) }).strict(),
]);

class PermissionPromptSubscription implements DisposableSubscription {
  private readonly disposeSubscription: () => void;

  constructor(disposeSubscription: () => void) {
    this.disposeSubscription = disposeSubscription;
  }

  [Symbol.dispose](): void {
    this.disposeSubscription();
  }
}

/** Owns browser permission prompt identity, presentation, response, and subscription lifetime. */
export class BrowserPermissionPromptRegistry {
  private readonly listeners = new Set<() => void>();
  private readonly pending = new Map<string, PendingPrompt>();
  private readonly options: BrowserPermissionPromptRegistryOptions;

  constructor(options: BrowserPermissionPromptRegistryOptions) {
    this.options = options;
  }

  show(prompt: PermissionPrompt): void {
    const entry = this.options.findPage(prompt.webContents.id);
    if (prompt.closed) return;
    if (entry == null || entry.windowState.isClosing) {
      prompt.respond({ action: "dismiss" });
      return;
    }

    const pending: PendingPrompt = {
      entry,
      hostGeneration: entry.threadState.hostGeneration,
      navigationVersion: entry.page.navigationVersion,
      prompt,
      rendererInstanceId: entry.windowState.rendererInstanceId,
      snapshot: {
        id: prompt.id,
        browserTabId: entry.page.browserTabId,
        conversationId: entry.conversationId,
        mountGeneration: entry.threadState.mountGeneration,
        requestingOrigin: prompt.requestingOrigin,
        embeddingOrigin: prompt.embeddingOrigin,
        permissions: prompt.permissions.map((permission) => ({ ...permission })),
        presentation: prompt.presentation,
        variant: prompt.variant,
        availableActions: [...prompt.availableActions],
        geolocation:
          prompt.geolocation == null
            ? undefined
            : {
                availableAccuracies: [...prompt.geolocation.availableAccuracies],
                initialAccuracy: prompt.geolocation.initialAccuracy,
              },
      },
    };

    this.pending.set(prompt.id, pending);
    prompt.once("closed", () => {
      this.pending.delete(pending.snapshot.id);
      this.publish();
    });
    this.publish();
  }

  syncPresentation(threadState: ThreadState): void {
    for (const pending of this.pending.values()) {
      if (
        pending.entry.threadState === threadState &&
        pending.snapshot.mountGeneration !== threadState.mountGeneration
      ) {
        pending.snapshot = {
          ...pending.snapshot,
          mountGeneration: threadState.mountGeneration,
        };
      }
    }
    this.publish();
  }

  transferPresentation(
    sourceWindow: WindowState,
    destinationWindow: WindowState,
    scope: PermissionPromptScope,
  ): void {
    for (const pending of [...this.pending.values()]) {
      const entry = this.options.findPage(pending.prompt.webContents.id);
      if (
        pending.entry.windowState === sourceWindow &&
        pending.snapshot.browserTabId === scope.browserTabId &&
        pending.snapshot.conversationId === scope.conversationId &&
        !pending.prompt.closed &&
        entry?.windowState === destinationWindow &&
        entry.threadState === pending.entry.threadState &&
        entry.page === pending.entry.page &&
        entry.page.navigationVersion === pending.navigationVersion
      ) {
        this.pending.delete(pending.snapshot.id);
        pending.entry = entry;
        pending.hostGeneration = entry.threadState.hostGeneration;
        pending.rendererInstanceId = destinationWindow.rendererInstanceId;
        pending.snapshot = {
          ...pending.snapshot,
          id: this.options.createId(),
          mountGeneration: entry.threadState.mountGeneration,
        };
        this.pending.set(pending.snapshot.id, pending);
      }
    }
    this.publish();
  }

  subscribe(
    owner: WebContentsLike,
    scopeValue: unknown,
    callback: RpcCallback<PermissionPromptSnapshot[]>,
  ): DisposableSubscription {
    const scope = permissionPromptScopeSchema.safeParse(scopeValue);
    if (!scope.success) return new PermissionPromptSubscription(() => {});
    const parsedScope = scope.data as PermissionPromptScope;

    const listener = callback.dup();
    let active = true;
    let previous: PermissionPromptSnapshot[] | undefined;
    const publish = () => {
      const snapshots = [...this.pending.values()]
        .filter((pending) => this.matches(pending, owner, parsedScope))
        .map(({ snapshot }) => snapshot);
      if (
        previous?.length !== snapshots.length ||
        !snapshots.every((snapshot, index) => snapshot === previous?.[index])
      ) {
        previous = snapshots;
        Promise.resolve(listener(snapshots)).catch(cleanup);
      }
    };
    const cleanup = () => {
      if (!active) return;
      active = false;
      this.listeners.delete(publish);
      owner.removeListener("destroyed", cleanup);
      listener[Symbol.dispose]();
    };

    this.listeners.add(publish);
    owner.once("destroyed", cleanup);
    listener.onRpcBroken(cleanup);
    if (owner.isDestroyed()) cleanup();
    else publish();
    return new PermissionPromptSubscription(cleanup);
  }

  respond(owner: WebContentsLike, identityValue: unknown, responseValue: unknown): unknown {
    const pending = this.getCurrent(owner, identityValue);
    const response = permissionPromptResponseSchema.safeParse(responseValue);
    if (pending == null || !response.success) return false;

    const { prompt } = pending;
    const parsedResponse = response.data as PermissionResponse;
    if (!prompt.availableActions.includes(parsedResponse.action)) return false;
    if (
      parsedResponse.geolocationAccuracy != null &&
      !prompt.geolocation?.availableAccuracies.includes(parsedResponse.geolocationAccuracy)
    ) {
      return false;
    }
    return prompt.respond(parsedResponse);
  }

  openSystemSettings(owner: WebContentsLike, identityValue: unknown): unknown {
    const pending = this.getCurrent(owner, identityValue);
    return pending?.prompt.variant === "os-system-settings" && pending.prompt.openSystemSettings();
  }

  private getCurrent(owner: WebContentsLike, identityValue: unknown): PendingPrompt | null {
    const identity = permissionPromptIdentitySchema.safeParse(identityValue);
    if (!identity.success) return null;
    const parsedIdentity = identity.data as PermissionPromptIdentity;
    const pending = this.pending.get(parsedIdentity.id);
    if (
      pending == null ||
      pending.prompt.closed ||
      parsedIdentity.mountGeneration !== pending.snapshot.mountGeneration ||
      !this.matches(pending, owner, parsedIdentity)
    ) {
      return null;
    }
    return pending;
  }

  private matches(
    pending: PendingPrompt,
    owner: WebContentsLike,
    scope: PermissionPromptScope,
  ): boolean {
    const { entry, prompt, snapshot } = pending;
    const current = this.options.findPage(prompt.webContents.id);
    return (
      !prompt.closed &&
      !owner.isDestroyed() &&
      !prompt.webContents.isDestroyed() &&
      entry.windowState.owner === owner &&
      !entry.windowState.isClosing &&
      scope.browserTabId === snapshot.browserTabId &&
      scope.conversationId === snapshot.conversationId &&
      current?.windowState === entry.windowState &&
      current.threadState === entry.threadState &&
      current.page === entry.page &&
      current.page.browserTabId === snapshot.browserTabId &&
      current.conversationId === snapshot.conversationId &&
      current.threadState.presented &&
      current.threadState.pendingTeardown == null &&
      current.threadState.mountGeneration === snapshot.mountGeneration &&
      current.threadState.hostGeneration === pending.hostGeneration &&
      current.windowState.rendererInstanceId === pending.rendererInstanceId &&
      current.page.navigationVersion === pending.navigationVersion
    );
  }

  private publish(): void {
    for (const listener of this.listeners) listener();
  }
}

if (typeof module !== "undefined")
  module.exports = {
    BrowserPermissionPromptRegistry,
    permissionPromptScopeSchema,
    permissionPromptIdentitySchema,
    permissionPromptResponseSchema,
  };
