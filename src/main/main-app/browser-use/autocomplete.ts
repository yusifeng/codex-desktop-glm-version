// IAB 自动补全管理器 + 扩展动作菜单。
//
// 对应 main-C-Mhak1n.ts 69,354-69,715：
//   - bke AutocompleteManager（69,356-69,539）：per-owner 的补全会话
//     （controller 生命周期、composer surface 的 favicon 请求 LRU 128、
//     data:text/html 过滤、结果代数防乱序）
//   - xke/Ske/FD/ID 结果投影（69,540-69,574）
//   - Cke AutocompleteService 门面（69,575-69,596）
//   - wke ExtensionActionMenus（69,597-69,683）：扩展右键菜单的打开/执行/关闭
//     （webContents 生命周期 + origin/destroyed 双清理）
//   - LD 菜单项校验投影（69,684-69,715）
import { Uf as EventEmitterBase } from "@chunk/shared";
import { en as usingScope } from "@chunk/bootstrap";
import { getDesktopFeatureAvailability } from "../misc/availability";

// ---------------------------------------------------------------------------
// 结果投影（原 `xke`/`Ske`/`FD`/`ID`）
// ---------------------------------------------------------------------------

const DATA_HTML_PATTERN = /^data:text\/html(?:[;,]|$)/i;
const FAVICON_CACHE_LIMIT = 128;

interface AutocompleteMatch {
  acceptToken?: string | null;
  deleteToken?: string | null;
  contents: unknown;
  contentsClass: unknown;
  deletable?: boolean;
  description: unknown;
  descriptionClass: unknown;
  destinationURL: string;
  fillIntoEdit: string;
  iconURL?: string | null;
  inlineAutocompletion: unknown;
  isSearch?: boolean;
  type?: string;
}

interface ProjectedMatch {
  acceptToken?: string;
  deleteToken?: string;
  contents: unknown;
  contentsClass: unknown;
  deletable: boolean;
  description: unknown;
  descriptionClass: unknown;
  destinationURL: string;
  faviconDataURL: string | null;
  fillIntoEdit: string;
  inlineAutocompletion: unknown;
  isSearch: boolean;
  type: string;
}

/** favicon 缓存键（原 `FD`）。 */
function faviconKey(match: { iconURL?: string | null; destinationURL: string }): string {
  return `${match.iconURL ?? ``}\0${match.destinationURL}`;
}

/** match → 传输投影（原 `ID`）：token 按需携带。 */
function projectMatch(match: AutocompleteMatch, faviconDataURL: string | null): ProjectedMatch {
  return {
    ...(match.acceptToken == null ? {} : { acceptToken: match.acceptToken }),
    ...(match.deleteToken == null ? {} : { deleteToken: match.deleteToken }),
    contents: match.contents,
    contentsClass: match.contentsClass,
    deletable: match.deletable === true,
    description: match.description,
    descriptionClass: match.descriptionClass,
    destinationURL: match.destinationURL,
    faviconDataURL,
    fillIntoEdit: match.fillIntoEdit,
    inlineAutocompletion: match.inlineAutocompletion,
    isSearch: match.isSearch === true,
    type: match.type ?? ``,
  };
}

/** 无 favicon 的投影（原 `xke`）。 */
function projectResultWithoutFavicons(result: { defaultMatch: AutocompleteMatch | null; done: boolean; matches: AutocompleteMatch[] }): { defaultMatch: ProjectedMatch | null; done: boolean; matches: ProjectedMatch[] } {
  return {
    defaultMatch: result.defaultMatch == null ? null : projectMatch(result.defaultMatch, null),
    done: result.done,
    matches: result.matches.map((match) => projectMatch(match, null)),
  };
}

/** 带 favicon 缓存的投影（原 `Ske`）。 */
function projectResultWithFavicons(result: { defaultMatch: AutocompleteMatch | null; done: boolean; matches: AutocompleteMatch[] }, favicons: Map<string, string>): { defaultMatch: ProjectedMatch | null; done: boolean; matches: ProjectedMatch[] } {
  const project = (match: AutocompleteMatch) => projectMatch(match, favicons.get(faviconKey(match)) ?? null);
  return {
    defaultMatch: result.defaultMatch == null ? null : project(result.defaultMatch),
    done: result.done,
    matches: result.matches.map(project),
  };
}

// ---------------------------------------------------------------------------
// AutocompleteManager（原 `bke`）
// ---------------------------------------------------------------------------

type RpcEventEmitter = InstanceType<typeof EventEmitterBase>;
interface AutocompleteController extends RpcEventEmitter {
  result: { defaultMatch: AutocompleteMatch | null; done: boolean; matches: AutocompleteMatch[] };
  start(input: { text: string }): void;
  stop(reason: string): void;
  resetSession(): void;
  accept(acceptToken: unknown, disposition: unknown): void;
  recordNavigation(destinationURL: string, target: unknown): void;
  deleteMatch(deleteToken: unknown): void;
  destroy(): void;
  on(event: "result-changed", listener: (result: never) => void): this;
}

interface AutocompleteRequest {
  browserTabId: unknown;
  conversationId: string;
  editingSessionId: unknown;
  input: { text: string };
  faviconDataURLs?: Map<string, string>;
  surface?: string;
  onResult: { (payload: unknown): unknown; dup(): AutocompleteRequest["onResult"]; onRpcBroken(cb: () => void): void; [Symbol.dispose](): void };
  requestId: unknown;
}

interface OwnerState {
  activeRequest: AutocompleteRequest | null;
  controller: AutocompleteController;
  editingSessionId: unknown;
  faviconRequests: Map<string, Promise<string | null>>;
  resultGeneration: number;
  surface: string;
  targetId: number | null;
}

interface AutocompleteOwner {
  id: number;
  once(event: "destroyed", listener: () => void): unknown;
}

/** per-owner 的自动补全会话管理（原 `bke`）。 */
class AutocompleteManager {
  createController: (target: unknown, request: { surface: string }) => AutocompleteController;
  ownerStates = new Map<number, OwnerState>();
  getTarget: (owner: AutocompleteOwner, request: Record<string, unknown>) => { id: number; isDestroyed(): boolean } | null;
  getFaviconDataURL: (request: { destinationURL: string; iconURL?: string | null }) => Promise<string | null>;

  constructor(
    createController: AutocompleteManager["createController"],
    getTarget: AutocompleteManager["getTarget"] = () => null,
    getFaviconDataURL: AutocompleteManager["getFaviconDataURL"] = async () => null,
  ) {
    this.createController = createController;
    this.getTarget = getTarget;
    this.getFaviconDataURL = getFaviconDataURL;
  }

  start(owner: AutocompleteOwner, request: Record<string, unknown> & { browserTabId: unknown; conversationId: string; editingSessionId: unknown; input: { text: string }; requestId: unknown; surface: string }, onResult: AutocompleteRequest["onResult"]) {
    const target = this.getTarget(owner, request);
    const state = this.getOwnerState(owner, target, request);
    this.clearActiveRequest(state);
    const activeRequest: AutocompleteRequest = {
      browserTabId: request.browserTabId,
      conversationId: request.conversationId,
      editingSessionId: request.editingSessionId,
      input: request.input,
      ...(request.surface === "composer" ? { faviconDataURLs: new Map<string, string>(), surface: "composer" } : {}),
      onResult: onResult.dup(),
      requestId: request.requestId,
    };
    state.activeRequest = activeRequest;
    activeRequest.onResult.onRpcBroken(() => {
      if (state.activeRequest === activeRequest) {
        state.controller.stop("interaction");
        this.clearActiveRequest(state);
        state.editingSessionId = null;
      }
    });
    if (state.editingSessionId !== request.editingSessionId) {
      state.controller.resetSession();
      state.faviconRequests.clear();
      state.editingSessionId = request.editingSessionId;
    }
    state.controller.start(request.input);
    this.sendResult(state, state.controller.result);
  }

  stop(owner: AutocompleteOwner, request: { browserTabId: unknown; conversationId: string; editingSessionId: unknown; requestId: unknown; reason: string }) {
    const state = this.getActiveOwnerState(owner, request);
    if (state != null) {
      state.controller.stop(request.reason);
      this.clearActiveRequest(state);
    }
  }

  accept(owner: AutocompleteOwner, request: { browserTabId: unknown; conversationId: string; editingSessionId: unknown; requestId: unknown; acceptToken: unknown; disposition: unknown }) {
    const state = this.getActiveOwnerState(owner, request);
    if (state == null) return;
    if (state.activeRequest?.surface === "composer" && state.targetId === owner.id) {
      state.controller.stop("interaction");
      this.clearActiveRequest(state);
      state.editingSessionId = null;
      return;
    }
    state.controller.accept(request.acceptToken, request.disposition);
    this.clearActiveRequest(state);
    state.editingSessionId = null;
  }

  recordNavigation(owner: AutocompleteOwner, request: { browserTabId: unknown; conversationId: string; editingSessionId: unknown; requestId: unknown; destinationURL: string }) {
    const state = this.getActiveOwnerState(owner, request);
    if (state == null) return;
    const target = this.getTarget(owner, request as never);
    if (
      target == null ||
      target.isDestroyed() ||
      (state.targetId != null && state.targetId !== target.id) ||
      !state.controller.result.matches.some(
        (match) => match.destinationURL === request.destinationURL && match.acceptToken == null,
      )
    )
      return;
    state.controller.recordNavigation(request.destinationURL, target);
  }

  deleteMatch(owner: AutocompleteOwner, request: { browserTabId: unknown; conversationId: string; editingSessionId: unknown; requestId: unknown; deleteToken: unknown }) {
    this.getActiveOwnerState(owner, request)?.controller.deleteMatch(request.deleteToken);
  }

  private getActiveOwnerState(owner: AutocompleteOwner, request: { browserTabId: unknown; conversationId: string; editingSessionId: unknown; requestId: unknown }): OwnerState | null {
    const state = this.ownerStates.get(owner.id);
    return state?.activeRequest != null &&
      state.activeRequest.browserTabId === request.browserTabId &&
      state.activeRequest.conversationId === request.conversationId &&
      state.activeRequest.editingSessionId === request.editingSessionId &&
      state.activeRequest.requestId === request.requestId
      ? state
      : null;
  }

  private getOwnerState(owner: AutocompleteOwner, target: { id: number } | null, request: { surface: string }): OwnerState {
    const existing = this.ownerStates.get(owner.id);
    if (existing?.targetId === (target?.id ?? null) && existing.surface === request.surface) return existing;
    if (existing != null) {
      existing.controller.destroy();
      this.clearActiveRequest(existing);
    }
    const state: OwnerState = {
      activeRequest: null,
      controller: this.createController(target ?? undefined, request),
      editingSessionId: null,
      faviconRequests: new Map(),
      resultGeneration: 0,
      surface: request.surface,
      targetId: target?.id ?? null,
    };
    state.controller.on("result-changed", (result) => {
      this.sendResult(state, result as never);
    });
    if (existing == null)
      owner.once("destroyed", () => {
        const current = this.ownerStates.get(owner.id);
        if (current != null) {
          this.clearActiveRequest(current);
          current.controller.destroy();
          this.ownerStates.delete(owner.id);
        }
      });
    this.ownerStates.set(owner.id, state);
    return state;
  }

  private clearActiveRequest(state: OwnerState) {
    const request = state.activeRequest;
    state.activeRequest = null;
    request?.faviconDataURLs?.clear();
    request?.onResult[Symbol.dispose]();
  }

  private sendResult(state: OwnerState, result: { defaultMatch: AutocompleteMatch | null; done: boolean; matches: AutocompleteMatch[] }) {
    const request = state.activeRequest;
    if (request == null) return;
    let projected = result;
    // 空输入时过滤 data: HTML 建议（防钓鱼），默认项被过滤时顺延首个。
    if (request.input.text.length === 0) {
      const matches = result.matches.filter(
        ({ destinationURL, fillIntoEdit }) => !DATA_HTML_PATTERN.test(destinationURL) && !DATA_HTML_PATTERN.test(fillIntoEdit),
      );
      const defaultMatch = result.defaultMatch;
      const defaultIsData = defaultMatch != null && (DATA_HTML_PATTERN.test(defaultMatch.destinationURL) || DATA_HTML_PATTERN.test(defaultMatch.fillIntoEdit));
      if (matches.length !== result.matches.length || defaultIsData)
        projected = { ...result, defaultMatch: defaultIsData ? (matches[0] ?? null) : defaultMatch, matches };
    }
    const generation = ++state.resultGeneration;
    const favicons = request.faviconDataURLs;
    const first = favicons == null ? projectResultWithoutFavicons(projected) : projectResultWithFavicons(projected, favicons);
    this.sendResultUpdate(request, first);
    if (
      favicons == null ||
      !first.matches.every((match) => match.faviconDataURL != null) ||
      (first.defaultMatch != null && first.defaultMatch.faviconDataURL == null)
    )
      void this.sendFaviconResult(state, request, projected, generation);
  }

  private async sendFaviconResult(state: OwnerState, request: AutocompleteRequest, result: { defaultMatch: AutocompleteMatch | null; done: boolean; matches: AutocompleteMatch[] }, generation: number) {
    const requestCache = request.surface === "composer" ? new Map<string, Promise<string | null>>() : state.faviconRequests;
    const loadMatch = async (match: AutocompleteMatch): Promise<ProjectedMatch> => {
      const key = faviconKey(match);
      const cached = request.faviconDataURLs?.get(key);
      if (cached != null) return projectMatch(match, cached);
      let pending = requestCache.get(key);
      if (pending == null) {
        pending = this.getFaviconDataURL({
          destinationURL: match.destinationURL,
          iconURL: match.iconURL,
        }).catch(() => null);
        const ownerCache = request.faviconDataURLs;
        if (ownerCache != null) {
          pending = pending.then((dataUrl) => {
            if (dataUrl != null && state.activeRequest === request && (ownerCache.set(key, dataUrl), ownerCache.size > FAVICON_CACHE_LIMIT)) {
              const oldest = ownerCache.keys().next().value;
              if (oldest != null) ownerCache.delete(oldest);
            }
            return dataUrl;
          });
        }
        requestCache.set(key, pending);
      }
      return projectMatch(match, await pending);
    };
    const [matches, defaultMatch] = await Promise.all([
      Promise.all(result.matches.map(loadMatch)),
      result.defaultMatch == null ? null : loadMatch(result.defaultMatch),
    ]);
    if (
      state.activeRequest !== request ||
      state.resultGeneration !== generation ||
      (defaultMatch?.faviconDataURL == null && !matches.some((match) => match.faviconDataURL != null))
    )
      return;
    this.sendResultUpdate(request, { defaultMatch, done: result.done, matches });
  }

  private sendResultUpdate(request: AutocompleteRequest, result: { defaultMatch: ProjectedMatch | null; done: boolean; matches: ProjectedMatch[] }) {
    const scope = usingScope() as unknown as { u(value: unknown): unknown; e: unknown; d(): void };
    try {
      scope.u(request.onResult({
        browserTabId: request.browserTabId,
        conversationId: request.conversationId,
        editingSessionId: request.editingSessionId,
        requestId: request.requestId,
        result,
      }));
    } catch (error) {
      scope.e = error;
    } finally {
      scope.d();
    }
  }
}

/** per-origin 门面（原 `Cke`）。 */
class AutocompleteService extends (EventEmitterBase as new () => RpcEventEmitter) {
  autocomplete: AutocompleteManager;
  owner: AutocompleteOwner;

  constructor(autocomplete: AutocompleteManager, owner: AutocompleteOwner) {
    super();
    this.autocomplete = autocomplete;
    this.owner = owner;
  }

  start(request: Record<string, unknown>, onResult: AutocompleteRequest["onResult"]) {
    this.autocomplete.start(this.owner, request as never, onResult);
  }

  stop(request: Record<string, unknown>) {
    this.autocomplete.stop(this.owner, request as never);
  }

  accept(request: Record<string, unknown>) {
    this.autocomplete.accept(this.owner, request as never);
  }

  recordNavigation(request: Record<string, unknown>) {
    this.autocomplete.recordNavigation(this.owner, request as never);
  }

  deleteMatch(request: Record<string, unknown>) {
    this.autocomplete.deleteMatch(this.owner, request as never);
  }
}

// ---------------------------------------------------------------------------
// ExtensionActionMenus（原 `wke`）
// ---------------------------------------------------------------------------

interface ExtensionMenuWebContents {
  isDestroyed(): boolean;
  beginExtensionActionContextMenu(actionId: string, options: { allowHiddenBlankTab: boolean; source: string }): { status: string; menuId?: string; items?: ExtensionMenuItem[] };
  closeExtensionActionContextMenu(menuId: string): void;
  executeExtensionActionContextMenuCommand(menuId: string, commandId: string): boolean;
  on(event: "extension-action-context-menu-closed", listener: (event: unknown, info: { menuId: string }) => void): unknown;
  removeListener(event: "extension-action-context-menu-closed", listener: (event: unknown, info: { menuId: string }) => void): unknown;
  removeListener(event: "destroyed", listener: () => void): unknown;
  once(event: "destroyed", listener: () => void): unknown;
}

interface ExtensionMenuItem {
  type: string;
  actionable?: unknown;
  checked?: unknown;
  commandId?: unknown;
  enabled?: unknown;
  groupId?: unknown;
  label?: unknown;
  submenu?: ExtensionMenuItem[] | null;
}

interface ProjectedMenuItem {
  actionable: unknown;
  checked: unknown;
  commandId: unknown;
  enabled: unknown;
  groupId: unknown;
  label: unknown;
  submenu: ProjectedMenuItem[] | undefined;
  type: string;
}

/** 菜单项白名单校验 + 投影（原 `LD`）：未知类型整体拒绝。 */
function projectMenuItems(items: ExtensionMenuItem[]): ProjectedMenuItem[] | null {
  const projected: ProjectedMenuItem[] = [];
  for (const item of items) {
    const type = item.type;
    if (
      type !== "normal" &&
      type !== "checkbox" &&
      type !== "radio" &&
      type !== "submenu" &&
      type !== "actionable-submenu" &&
      type !== "separator"
    )
      return null;
    let submenu: ProjectedMenuItem[] | undefined;
    if (item.submenu != null) {
      const nested = projectMenuItems(item.submenu);
      if (nested == null) return null;
      submenu = nested;
    }
    projected.push({
      actionable: item.actionable,
      checked: item.checked,
      commandId: item.commandId,
      enabled: item.enabled,
      groupId: item.groupId,
      label: item.label,
      submenu,
      type,
    });
  }
  return projected;
}

/** 扩展动作右键菜单的打开/执行/关闭（原 `wke`）。 */
class ExtensionActionMenus {
  origin: { isDestroyed(): boolean; once(event: "destroyed", listener: () => void): unknown; removeListener(event: "destroyed", listener: () => void): unknown };
  menus = new Map<string, { browserTabId: unknown; cleanup: (notify: boolean) => void; conversationId: string; webContents: ExtensionMenuWebContents }>();

  constructor(origin: ExtensionActionMenus["origin"]) {
    this.origin = origin;
  }

  begin(
    webContents: ExtensionMenuWebContents | null,
    { actionId, browserTabId, conversationId }: { actionId: string; browserTabId: unknown; conversationId: string },
    onEvent: { (payload: unknown): unknown; dup(): ExtensionActionMenus extends never ? never : never; onRpcBroken(cb: () => void): void; [Symbol.dispose](): void },
    allowHiddenBlankTab: boolean,
  ): { status: string; menuId?: string; items?: ProjectedMenuItem[] } {
    if (!getDesktopFeatureAvailability().browserExtensions) return { status: "unsupported" };
    if (webContents == null || webContents.isDestroyed() || this.origin.isDestroyed())
      return { status: "invalid-target" };
    const opened = webContents.beginExtensionActionContextMenu(actionId, { allowHiddenBlankTab, source: "menu" });
    if (opened.status !== "opened") {
      switch (opened.status) {
        case "invalid-extension":
        case "disabled-extension":
        case "invalid-target":
        case "menu-failed":
          return { status: opened.status };
        default:
          return { status: "menu-failed" };
      }
    }
    const menuId = opened.menuId;
    const items = opened.items == null ? null : projectMenuItems(opened.items);
    if (menuId == null || items == null) {
      webContents.closeExtensionActionContextMenu(menuId as string);
      return { status: "menu-failed" };
    }
    const eventStream = onEvent.dup() as never as { (payload: unknown): unknown; onRpcBroken(cb: () => void): void; [Symbol.dispose](): void };
    const entry = { browserTabId, cleanup: (_notify: boolean) => {}, conversationId, webContents };
    const cleanup = (notify: boolean) => {
      if (this.menus.get(menuId) === entry) {
        this.menus.delete(menuId);
        webContents.removeListener("extension-action-context-menu-closed", onClosed);
        webContents.removeListener("destroyed", onWebContentsDestroyed);
        this.origin.removeListener("destroyed", onOriginDestroyed);
        if (notify && !this.origin.isDestroyed()) {
          const scope = usingScope() as unknown as { u(value: unknown): unknown; e: unknown; d(): void };
          try {
            scope.u(eventStream({ type: "closed", menuId }));
          } catch (error) {
            scope.e = error;
          } finally {
            scope.d();
          }
        }
        eventStream[Symbol.dispose]();
      }
    };
    const onClosed = (_event: unknown, info: { menuId: string }) => {
      if (info.menuId === menuId) cleanup(true);
    };
    const onWebContentsDestroyed = () => cleanup(true);
    const onOriginDestroyed = () => {
      cleanup(false);
      if (!webContents.isDestroyed()) webContents.closeExtensionActionContextMenu(menuId);
    };
    entry.cleanup = cleanup;
    this.menus.set(menuId, entry);
    webContents.on("extension-action-context-menu-closed", onClosed);
    webContents.once("destroyed", onWebContentsDestroyed);
    this.origin.once("destroyed", onOriginDestroyed);
    eventStream.onRpcBroken(onOriginDestroyed);
    return { status: "opened", menuId, items };
  }

  execute(getWebContents: () => ExtensionMenuWebContents | null, { browserTabId, commandId, conversationId, menuId }: { browserTabId: unknown; commandId: string; conversationId: string; menuId: string }) {
    if (!getDesktopFeatureAvailability().browserExtensions || this.origin.isDestroyed()) return false;
    const entry = this.menus.get(menuId);
    const webContents = getWebContents();
    return entry == null ||
      entry.conversationId !== conversationId ||
      entry.browserTabId !== browserTabId ||
      entry.webContents.isDestroyed() ||
      entry.webContents !== webContents
      ? false
      : entry.webContents.executeExtensionActionContextMenuCommand(menuId, commandId);
  }

  close({ browserTabId, conversationId, menuId }: { browserTabId: unknown; conversationId: string; menuId: string }) {
    const entry = this.menus.get(menuId);
    if (entry != null && entry.conversationId === conversationId && entry.browserTabId === browserTabId) {
      entry.cleanup(false);
      if (!entry.webContents.isDestroyed()) entry.webContents.closeExtensionActionContextMenu(menuId);
    }
  }

  [Symbol.dispose]() {
    for (const [menuId, entry] of this.menus)
      this.close({ browserTabId: entry.browserTabId, conversationId: entry.conversationId, menuId });
  }
}

export {
  AutocompleteManager,
  AutocompleteService,
  ExtensionActionMenus,
  projectMenuItems,
  type AutocompleteMatch,
  type ProjectedMatch,
  type ProjectedMenuItem,
};
