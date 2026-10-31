// Browser source owner registry extracted from main-C-Mhak1n.ts (`rje/ije/EN/DN`).
import { BrowserWindow } from "electron";
import { Uf as EventEmitterBase } from "@chunk/shared";

function ownerKey(owner: {
  accountId?: string | null;
  hostId?: string | null;
  threadId?: string | null;
  clientThreadId?: string | null;
}): string {
  return JSON.stringify([owner.accountId, owner.hostId, owner.threadId, owner.clientThreadId]);
}

class DisposableRegistration extends (EventEmitterBase as new () => {}) {
  remove: () => void;

  constructor(remove: () => void) {
    super();
    this.remove = remove;
  }

  [Symbol.dispose](): void {
    this.remove();
  }
}

class BrowserSourceOwnerService extends (EventEmitterBase as new () => {}) {
  manager: BrowserSourceOwnerRegistry;
  origin: any;

  constructor(manager: BrowserSourceOwnerRegistry, origin: any) {
    super();
    this.manager = manager;
    this.origin = origin;
    origin.once("destroyed", () => manager.removeOrigin(origin));
  }

  async registerOwner(owner: any, handler: any): Promise<DisposableRegistration> {
    return this.manager.registerOwner(this.origin, owner, handler);
  }

  async subscribeOwners(accountId: string | null, listener: any): Promise<DisposableRegistration> {
    return this.manager.subscribeOwners(this.origin, accountId, listener);
  }

  reveal(request: any): Promise<string> {
    return this.manager.reveal(request);
  }
}

class BrowserSourceOwnerRegistry {
  windowManager: any;
  detachedWindows: any;
  owners = new Map<string, Set<any>>();
  listeners = new Set<any>();

  constructor(windowManager: any, detachedWindows: any) {
    this.windowManager = windowManager;
    this.detachedWindows = detachedWindows;
  }

  createService(origin: any): BrowserSourceOwnerService {
    return new BrowserSourceOwnerService(this, origin);
  }

  registerOwner(origin: any, owner: any, handler: any): DisposableRegistration {
    const key = ownerKey(owner);
    const owners = this.owners.get(key) ?? new Set();
    const duplicatedHandler = handler.dup();
    let record: any;
    const registration = new DisposableRegistration(() => {
      if (!owners.delete(record)) return;
      if (owners.size === 0 && this.owners.get(key) === owners) this.owners.delete(key);
      duplicatedHandler[Symbol.dispose]();
      this.notifyOwners(owner.accountId);
    });
    record = { owner, origin, handler: duplicatedHandler, registration };
    owners.add(record);
    this.owners.set(key, owners);

    let replacedSameOrigin = false;
    for (const candidate of owners) {
      if (candidate !== record && candidate.origin === origin) {
        replacedSameOrigin = true;
        candidate.registration[Symbol.dispose]();
      }
    }
    if (!replacedSameOrigin) this.notifyOwners(owner.accountId);
    duplicatedHandler.onRpcBroken(() => registration[Symbol.dispose]());
    return registration;
  }

  subscribeOwners(origin: any, accountId: string | null, listener: any): DisposableRegistration {
    const duplicatedListener = listener.dup();
    let record: any;
    const registration = new DisposableRegistration(() => {
      if (this.listeners.delete(record)) duplicatedListener[Symbol.dispose]();
    });
    record = { accountId, origin, listener: duplicatedListener, registration };
    this.listeners.add(record);
    duplicatedListener.onRpcBroken(() => registration[Symbol.dispose]());
    this.publishOwners(record, this.getOwners(accountId));
    return registration;
  }

  async reveal(request: any): Promise<string> {
    const owners = this.owners.get(ownerKey(request));
    if (owners == null) return "owner-missing";
    let result = "owner-missing";
    for (const record of [...owners]) {
      if (!owners.has(record)) continue;
      const window = record.origin.isDestroyed() ? null : BrowserWindow.fromWebContents(record.origin);
      if (window == null || window.isDestroyed()) {
        record.registration[Symbol.dispose]();
        continue;
      }
      result = "unavailable";
      try {
        const revealResult = await record.handler.reveal(request.tabId, request.sidebarPinnedContentTabId);
        if (revealResult === "cancelled") return "cancelled";
        if (
          revealResult === "revealed" &&
          owners.has(record) &&
          !record.origin.isDestroyed() &&
          !window.isDestroyed()
        ) {
          return this.detachedWindows.focus(record.origin, request.clientThreadId, request.tabId) ||
            this.windowManager.showWindow(window, { stealFocus: true })
            ? "revealed"
            : "unavailable";
        }
      } catch {
        record.registration[Symbol.dispose]();
      }
    }
    return owners.size === 0 ? "owner-missing" : result;
  }

  removeOrigin(origin: any): void {
    for (const listener of this.listeners) {
      if (listener.origin === origin) listener.registration[Symbol.dispose]();
    }
    for (const owners of this.owners.values()) {
      for (const owner of owners) {
        if (owner.origin === origin) owner.registration[Symbol.dispose]();
      }
    }
  }

  dispose(): void {
    for (const listener of this.listeners) listener.registration[Symbol.dispose]();
    for (const owners of this.owners.values()) {
      for (const owner of owners) owner.registration[Symbol.dispose]();
    }
  }

  getOwners(accountId: string | null): any[] {
    return [...this.owners.values()].flatMap((owners) =>
      [...owners].flatMap(({ owner }) => (owner.accountId == null || owner.accountId === accountId ? [owner] : [])),
    );
  }

  notifyOwners(accountId: string | null): void {
    const owners = accountId == null ? null : this.getOwners(accountId);
    for (const listener of this.listeners) {
      if (accountId == null || listener.accountId === accountId) {
        this.publishOwners(listener, owners ?? this.getOwners(listener.accountId));
      }
    }
  }

  publishOwners(listener: any, owners: any[]): void {
    listener.listener(owners).catch(() => listener.registration[Symbol.dispose]());
  }
}

export { BrowserSourceOwnerRegistry, BrowserSourceOwnerService, DisposableRegistration, ownerKey };

if (typeof module !== "undefined") {
  module.exports = { BrowserSourceOwnerRegistry, BrowserSourceOwnerService, DisposableRegistration, ownerKey };
}
