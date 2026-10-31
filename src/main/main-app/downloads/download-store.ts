// @ts-nocheck

const MAX_DOWNLOAD_HISTORY_ITEMS = 200;
const LINK_DOWNLOAD_TIMEOUT_MS = 60_000;

/** Owns native download history, live item state, save paths, and download lifecycle events. */
export function createDownloadStoreClass(dependencies: Record<string, any>) {
  const {
    electron,
    errorMessage,
    fs,
    path,
    sanitizeUrl,
    setTimer = setTimeout,
    clearTimer = clearTimeout,
    scheduleMicrotask = queueMicrotask,
  } = dependencies;

  class LinkDownloadCoordinator {
    pending = new Map();

    download(browserSession: any, options: any) {
      const sanitizedUrl = sanitizeUrl(options.url);
      if (sanitizedUrl == null) return Promise.resolve(false);
      const url = new URL(sanitizedUrl);
      url.hash = "";
      const view = new electron.WebContentsView({
        webPreferences: { session: browserSession, sandbox: true, nodeIntegration: false },
      });
      return new Promise((resolve) => {
        const pending = {
          options: { ...options, url: url.href },
          view,
          finish: (accepted: boolean) => {
            clearTimer(timer);
            this.pending.delete(view.webContents.id);
            if (!accepted && !view.webContents.isDestroyed()) view.webContents.close();
            resolve(accepted);
          },
        };
        const timer = setTimer(() => pending.finish(false), LINK_DOWNLOAD_TIMEOUT_MS);
        this.pending.set(view.webContents.id, pending);
        try {
          view.webContents.downloadURL(url.href);
        } catch {
          pending.finish(false);
        }
      });
    }

    consume(item: any, webContents: any) {
      const pending = webContents == null ? null : this.pending.get(webContents.id);
      if (pending == null) return null;
      const url = item.getURLChain()[0] ?? item.getURL();
      if (pending.options.url !== url) return null;
      const closeView = () => {
        scheduleMicrotask(() => {
          if (!pending.view.webContents.isDestroyed()) pending.view.webContents.close();
        });
      };
      item.once("done", closeView);
      item.once("destroyed", closeView);
      pending.finish(true);
      return pending.options;
    }
  }

  function handleWillDownload({
    browserSessionRegistry,
    downloadStore,
    event,
    findPageStateForWebContentsId,
    item,
    userDownload,
    webContents,
  }: Record<string, any>) {
    const webContentsId = webContents?.id ?? null;
    const pageState =
      webContentsId == null ? null : findPageStateForWebContentsId(webContentsId);
    const url = item.getURL();
    const urlChain = item.getURLChain();
    const browserUseDownload =
      webContentsId == null
        ? null
        : browserSessionRegistry.consumeAllowedBrowserUseDownload({
            url,
            urlChain,
            webContentsId,
          });
    const isAgentControllingBrowser =
      pageState?.threadState.isAgentControllingBrowser === true;
    if (
      userDownload == null &&
      browserUseDownload == null &&
      (pageState == null || isAgentControllingBrowser)
    ) {
      event.preventDefault();
      item.cancel();
      return;
    }
    const download = downloadStore.start({
      browserTabId: pageState?.threadState.browserTabId ?? null,
      conversationId:
        userDownload?.conversationId ?? pageState?.threadState.conversationId ?? null,
      isUserInitiated: browserUseDownload == null,
      item,
      promptForSave: userDownload != null,
      url,
    });
    const notifyBrowserUse = (status: string) => {
      if (browserUseDownload != null) {
        browserSessionRegistry.notifyBrowserUseDownloadChange({
          filename: download.path,
          id: download.id,
          session_id: browserUseDownload.sessionId,
          status,
          url: browserUseDownload.url,
        });
      }
    };
    const update = (status: string, storeStatus = status) => {
      downloadStore.update(download, item, storeStatus);
      notifyBrowserUse(status);
    };
    let finished = false;
    const finish = (status: string) => {
      if (finished) return;
      finished = true;
      downloadStore.finish(download, item, status);
      notifyBrowserUse(status);
    };
    item.once("destroyed", () => {
      if (!finished && downloadStore.forgetLiveDownload(download.id)) {
        finished = true;
        notifyBrowserUse("canceled");
      }
    });
    notifyBrowserUse("started");
    item.on("updated", (_event: unknown, state: string) => {
      if (state === "interrupted") {
        item.canResume() ? update("in_progress", "paused") : finish("failed");
        return;
      }
      update("in_progress", item.isPaused() ? "paused" : "in_progress");
    });
    item.once("done", (_event: unknown, state: string) => {
      if (state === "completed") finish("complete");
      else if (state === "cancelled") finish("canceled");
      else if (state === "interrupted") finish("failed");
    });
  }

  return class DownloadStore {
    getRestartBlockers() {
      return this.liveDownloads.size > 0 ? ["download.active"] : [];
    }

    linkDownloads = new LinkDownloadCoordinator();
    activeSavePaths = new Set();
    liveDownloads = new Map();
    unacknowledgedDownloadIds = new Set();
    getDownloadDirectory;
    getPromptForUserDownloads;
    browserSession = null;
    lifecycleSequence = 0;
    onActiveDownloadChange = null;
    onChange = null;
    onLifecycleEvent = null;
    snapshotReadQueue = Promise.resolve();
    unsubscribeDownloadHistoryChanged = null;

    constructor(options: Record<string, any> = {}) {
      this.getDownloadDirectory =
        options.getDownloadDirectory ?? (() => electron.app.getPath("downloads"));
      this.getPromptForUserDownloads = options.getPromptForUserDownloads ?? (() => false);
    }

    getSnapshot() {
      const snapshot = this.snapshotReadQueue.then(() => this.readSnapshot());
      this.snapshotReadQueue = snapshot.then(
        () => undefined,
        () => undefined,
      );
      return snapshot;
    }

    async clearHistory() {
      if (this.browserSession == null) return;
      const oldHistoryIds = new Set(
        (await this.readNativeHistory())
          ?.filter((item: any) => item.state !== "progressing")
          .map((item: any) => item.guid),
      );
      await this.browserSession.clearData({ dataTypes: ["downloads"] });
      if (
        (await this.readNativeHistory())?.some(
          (item: any) => item.state !== "progressing" && oldHistoryIds.has(item.guid),
        )
      ) {
        throw Error("Download history could not be cleared");
      }
      for (const id of this.unacknowledgedDownloadIds) {
        if (!this.liveDownloads.has(id)) this.unacknowledgedDownloadIds.delete(id);
      }
      this.notifyChanged();
    }

    async searchHistory(query: any) {
      const capturedAtMs = Date.now();
      const maxResults = query.maxResults ?? 100;
      const offset = query.offset ?? 0;
      const nativeHistory =
        this.browserSession == null
          ? null
          : (await this.browserSession.searchDownloadHistory(query)).filter(isVisibleHistoryItem);
      const text = query.text.toLowerCase();
      const downloads = new Map();
      for (const item of nativeHistory ?? []) {
        downloads.set(item.guid, this.getNativeItem(item, capturedAtMs));
      }
      if (offset === 0) {
        for (const item of this.liveDownloads.values()) {
          if (
            downloads.has(item.id) ||
            (nativeHistory == null &&
              (item.filename.toLowerCase().includes(text) || item.url.toLowerCase().includes(text)))
          ) {
            downloads.set(item.id, this.getLiveItem(item));
          }
        }
      }
      const result = Array.from(downloads.values())
        .sort((left: any, right: any) => right.startedAtMs - left.startedAtMs)
        .slice(0, maxResults > 0 ? maxResults : undefined);
      return {
        capturedAtMs,
        downloads: result,
        unacknowledgedIds: this.getUnacknowledgedIds(result),
      };
    }

    hasActiveDownloadForRoute(route: any) {
      for (const download of this.liveDownloads.values()) {
        if (
          download.browserTabId === route.browserTabId &&
          download.conversationId === route.conversationId
        ) {
          return true;
        }
      }
      return false;
    }

    registerSession({
      browserSession,
      browserSessionRegistry,
      findPageStateForWebContentsId,
    }: Record<string, any>) {
      this.browserSession = browserSession;
      this.unsubscribeDownloadHistoryChanged?.();
      const onHistoryChanged = () => this.notifyChanged();
      browserSession.on("download-history-changed", onHistoryChanged);
      this.unsubscribeDownloadHistoryChanged = () => {
        browserSession.removeListener("download-history-changed", onHistoryChanged);
      };
      browserSession.on("will-download", (event: any, item: any, webContents: any) => {
        handleWillDownload({
          browserSessionRegistry,
          downloadStore: this,
          event,
          findPageStateForWebContentsId,
          item,
          userDownload: this.linkDownloads.consume(item, webContents),
          webContents,
        });
      });
    }

    downloadUrl(options: any) {
      return this.browserSession == null
        ? Promise.resolve(false)
        : this.linkDownloads.download(this.browserSession, options);
    }
    acknowledge(request: any) {
      let changed = false;
      if ("all" in request) {
        changed = this.unacknowledgedDownloadIds.size > 0;
        this.unacknowledgedDownloadIds.clear();
      } else {
        changed = this.acknowledgeIds(request.ids);
      }
      if (changed) this.notifyChanged();
    }
    cancel({ id }: any) {
      const download = this.liveDownloads.get(id);
      if (download == null) return missingDownload();
      download.item.cancel();
      this.finish(download, download.item, "canceled");
      return { ok: true };
    }
    finish(download: any, item: any, status: string) {
      if (this.liveDownloads.has(download.id)) {
        this.update(download, item, status);
        this.removeLiveDownload(download);
      }
    }
    forgetLiveDownload(id: string) {
      const download = this.liveDownloads.get(id);
      if (download == null) return false;
      this.transition(download, "canceled");
      this.removeLiveDownload(download);
      return true;
    }
    async open({ id }: any) {
      const downloadPath = await this.getDownloadPath(id);
      if (downloadPath == null) return missingDownload();
      const result = await openPath(downloadPath);
      if (result.ok) this.acknowledge({ ids: [id] });
      return result;
    }
    pause({ id }: any) {
      const download = this.liveDownloads.get(id);
      if (download == null) return missingDownload();
      if (download.item.isPaused()) return { ok: false, reason: "download-not-pausable" };
      download.item.pause();
      this.update(download, download.item, "paused");
      return { ok: true };
    }
    async removeFromHistory({ id }: any) {
      if (this.liveDownloads.get(id) != null) {
        return { ok: false, reason: "download-not-removable" };
      }
      const item = (await this.readNativeHistory())?.find((candidate: any) => candidate.guid === id);
      if (item == null) return missingDownload();
      if (item.state === "progressing") return { ok: false, reason: "download-not-removable" };
      if (
        this.browserSession != null &&
        !(await this.browserSession.removeDownloadFromHistory(item.guid))
      ) {
        return missingDownload();
      }
      this.acknowledgeIds([id]);
      this.notifyChanged();
      return { ok: true };
    }
    reassignActiveDownloadRoute(from: any, to: any) {
      let changed = false;
      for (const download of this.liveDownloads.values()) {
        if (
          download.browserTabId === from.browserTabId &&
          download.conversationId === from.conversationId
        ) {
          download.browserTabId = to.browserTabId;
          download.conversationId = to.conversationId;
          changed = true;
        }
      }
      if (changed) this.onActiveDownloadChange?.();
    }
    resume({ id }: any) {
      const download = this.liveDownloads.get(id);
      if (download == null) return missingDownload();
      if (!download.item.isPaused() || !download.item.canResume()) {
        return { ok: false, reason: "download-not-resumable" };
      }
      download.item.resume();
      this.update(download, download.item, "in_progress");
      return { ok: true };
    }
    setChangeListener(listener: any) {
      this.onChange = listener;
    }
    setLifecycleEventListener(listener: any) {
      this.onLifecycleEvent = listener;
    }
    setActiveDownloadChangeListener(listener: any) {
      this.onActiveDownloadChange = listener;
    }
    showDownloadsFolder() {
      return openPath(this.getDownloadDirectory());
    }
    async showInFolder({ id }: any) {
      const downloadPath = await this.getDownloadPath(id);
      if (downloadPath == null) return missingDownload();
      try {
        electron.shell.showItemInFolder(downloadPath);
        this.acknowledge({ ids: [id] });
        return { ok: true };
      } catch (error) {
        return { message: errorMessage(error), ok: false, reason: "show-in-folder-failed" };
      }
    }

    start({
      browserTabId,
      conversationId,
      isUserInitiated,
      item,
      promptForSave = false,
      url,
    }: Record<string, any>) {
      const id = item.getGUID();
      const savePath = this.reserveSavePath(item.getFilename());
      if (isUserInitiated) {
        if (promptForSave || this.getPromptForUserDownloads()) {
          item.setSaveDialogOptions({ defaultPath: savePath });
        } else {
          this.browserSession?.setDownloadPath(this.getDownloadDirectory());
        }
      } else {
        item.setSavePath(savePath);
      }
      const now = Date.now();
      const download = {
        browserTabId,
        conversationId,
        filename: item.getFilename(),
        id,
        item,
        path: savePath,
        receivedBytes: item.getReceivedBytes(),
        startedAtMs: now,
        status: "started",
        totalBytes: item.getTotalBytes(),
        updatedAtMs: now,
        url,
        userInitiated: isUserInitiated,
      };
      this.liveDownloads.set(id, download);
      this.recordLifecycleTransition(download, null, now);
      this.onActiveDownloadChange?.();
      this.notifyChanged();
      return download;
    }
    update(download: any, item: any, status: string) {
      if (!this.liveDownloads.has(download.id)) return;
      const savePath = item.getSavePath();
      download.filename = savePath ? path.basename(savePath) : item.getFilename();
      if (savePath && savePath !== download.path) {
        this.activeSavePaths.delete(download.path);
        this.activeSavePaths.add(savePath);
        download.path = savePath;
      }
      download.receivedBytes = item.getReceivedBytes();
      download.totalBytes = item.getTotalBytes();
      this.transition(download, status);
    }
    transition(download: any, status: string) {
      const previousStatus = download.status;
      download.status = status;
      const now = Date.now();
      download.updatedAtMs = now;
      this.recordLifecycleTransition(download, previousStatus, now);
      this.notifyChanged();
    }
    async readSnapshot() {
      const history = await this.readNativeHistory();
      const capturedAtMs = Date.now();
      if (history == null) {
        const downloads = Array.from(this.liveDownloads.values(), (item: any) =>
          this.getLiveItem(item),
        ).sort((left: any, right: any) => right.startedAtMs - left.startedAtMs);
        return {
          capturedAtMs,
          downloads,
          unacknowledgedIds: this.getUnacknowledgedIds(downloads),
        };
      }
      const downloadsById = new Map();
      const active = history.filter(
        (item: any) => item.state === "progressing" || this.liveDownloads.has(item.guid),
      );
      const complete = history
        .filter(
          (item: any) => item.state !== "progressing" && !this.liveDownloads.has(item.guid),
        )
        .sort((left: any, right: any) => right.startTime - left.startTime)
        .slice(0, Math.max(0, MAX_DOWNLOAD_HISTORY_ITEMS - active.length));
      for (const item of [...active, ...complete]) {
        downloadsById.set(item.guid, this.getNativeItem(item, capturedAtMs));
      }
      const downloads = Array.from(downloadsById.values()).sort(
        (left: any, right: any) => right.startedAtMs - left.startedAtMs,
      );
      return {
        capturedAtMs,
        downloads,
        unacknowledgedIds: this.getUnacknowledgedIds(downloads),
      };
    }
    acknowledgeIds(ids: string[]) {
      let changed = false;
      for (const id of ids) changed = this.unacknowledgedDownloadIds.delete(id) || changed;
      return changed;
    }
    getUnacknowledgedIds(downloads: any[]) {
      const visibleIds = new Set(downloads.map((download) => download.id));
      return Array.from(this.unacknowledgedDownloadIds).filter((id) => visibleIds.has(id));
    }
    getLiveItem(download: any) {
      const paused = download.item.isPaused() || download.status === "paused";
      return {
        canCancel: true,
        canPause: !paused,
        canResume: paused && download.item.canResume(),
        fileExists: fs.existsSync(download.path),
        filename: download.filename,
        id: download.id,
        path: download.path,
        receivedBytes: download.receivedBytes,
        startedAtMs: download.startedAtMs,
        status: paused ? "paused" : download.status,
        totalBytes: download.totalBytes,
        updatedAtMs: download.updatedAtMs,
        url: download.url,
      };
    }
    getNativeItem(item: any, capturedAtMs: number) {
      const liveDownload = this.liveDownloads.get(item.guid);
      const paused =
        liveDownload != null &&
        (liveDownload.item.isPaused() || liveDownload.status === "paused");
      const startedAtMs = item.startTime * 1_000;
      let status = nativeDownloadStatus(item.state);
      if (liveDownload != null) status = paused ? "paused" : liveDownload.status;
      let updatedAtMs = startedAtMs;
      if (item.endTime > 0) updatedAtMs = item.endTime * 1_000;
      else if (liveDownload == null) {
        if (item.state === "progressing") updatedAtMs = capturedAtMs;
      } else updatedAtMs = liveDownload.updatedAtMs;
      return {
        canCancel: liveDownload != null,
        canPause: liveDownload != null && !paused,
        canResume: paused && liveDownload?.item.canResume() === true,
        fileExists: fs.existsSync(item.savePath),
        filename: item.filename,
        id: item.guid,
        path: item.savePath,
        receivedBytes: item.receivedBytes,
        startedAtMs,
        status,
        totalBytes: item.totalBytes,
        updatedAtMs,
        url: item.url,
      };
    }
    async getDownloadPath(id: string) {
      return (
        this.liveDownloads.get(id)?.path ??
        (await this.readNativeHistory())?.find((item: any) => item.guid === id)?.savePath ??
        null
      );
    }
    async readNativeHistory() {
      return this.browserSession == null
        ? null
        : (await this.browserSession.getDownloadHistory()).filter(isVisibleHistoryItem);
    }
    removeLiveDownload(download: any) {
      this.liveDownloads.delete(download.id);
      this.activeSavePaths.delete(download.path);
      this.onActiveDownloadChange?.();
    }
    recordLifecycleTransition(download: any, previousStatus: string | null, occurredAtMs: number) {
      if (previousStatus === download.status) return;
      if (download.status === "complete" || download.status === "failed") {
        this.unacknowledgedDownloadIds.add(download.id);
        if (this.unacknowledgedDownloadIds.size > MAX_DOWNLOAD_HISTORY_ITEMS) {
          const oldestId = this.unacknowledgedDownloadIds.values().next().value;
          if (oldestId != null) this.unacknowledgedDownloadIds.delete(oldestId);
        }
      }
      this.lifecycleSequence += 1;
      this.onLifecycleEvent?.({
        browserTabId: download.browserTabId,
        conversationId: download.conversationId,
        filename: download.filename,
        id: download.id,
        occurredAtMs,
        previousStatus,
        sequence: this.lifecycleSequence,
        status: download.status,
        userInitiated: download.userInitiated,
      });
    }
    reserveSavePath(filename: string) {
      const downloadDirectory = this.getDownloadDirectory();
      const basename = path.basename(filename.trim());
      const safeFilename = basename === "." || basename === ".." || !basename ? "download" : basename;
      const parsed = path.parse(safeFilename);
      for (let suffix = 0; ; suffix += 1) {
        const candidateName =
          suffix === 0 ? safeFilename : `${parsed.name} (${suffix})${parsed.ext}`;
        const candidatePath = path.join(downloadDirectory, candidateName);
        if (!fs.existsSync(candidatePath) && !this.activeSavePaths.has(candidatePath)) {
          this.activeSavePaths.add(candidatePath);
          return candidatePath;
        }
      }
    }
    notifyChanged() {
      this.onChange?.();
    }
  };

  function isVisibleHistoryItem(item: any) {
    return ["progressing", "completed", "cancelled", "interrupted"].includes(item.state);
  }
  function nativeDownloadStatus(state: string) {
    if (state === "progressing") return "in_progress";
    if (state === "completed") return "complete";
    if (state === "cancelled") return "canceled";
    if (state === "interrupted") return "failed";
  }
  function missingDownload() {
    return { ok: false, reason: "missing-download" };
  }
  async function openPath(targetPath: string) {
    const message = await electron.shell.openPath(targetPath);
    return message ? { message, ok: false, reason: "open-failed" } : { ok: true };
  }
}

if (typeof module !== "undefined") {
  module.exports = { createDownloadStoreClass };
}
