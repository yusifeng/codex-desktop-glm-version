import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/new-chat-page-suggestions-eligibility";

interface AvailableApp { id: string; isEnabled: boolean; name?: string }
interface AvailabilityUpdate { appId: string; appName?: string; enabled: boolean }
interface AppsAvailabilityOptions {
  apps?: AvailableApp[];
  hostId?: string;
  invalidate?(queryKey: readonly unknown[]): Promise<unknown> | unknown;
  notify?(tone: "danger" | "success", message: string): void;
  readApps?(): AvailableApp[] | undefined;
  writeConfig?(input: { edits: Array<{ keyPath: string; mergeStrategy: "upsert"; value: boolean }>; hostId: string }): Promise<{ status?: string }>;
  writeOptimistic?(apps: AvailableApp[]): void;
}
interface AppsAvailabilityController { isUpdating: boolean; setAppEnabled(update: AvailabilityUpdate): Promise<void>; updatingAppId: string | null }
function edits({ appId, enabled }: AvailabilityUpdate) { return [{ keyPath: `apps.${appId}.enabled`, value: enabled, mergeStrategy: "upsert" as const }]; }
function n(options: AppsAvailabilityOptions = {}): AppsAvailabilityController {
  const hostId = options.hostId ?? "local";
  const controller: AppsAvailabilityController = { isUpdating: false, updatingAppId: null, async setAppEnabled(update) {
    const previous = options.readApps?.() ?? options.apps;
    controller.isUpdating = true; controller.updatingAppId = update.appId;
    if (previous != null) options.writeOptimistic?.(previous.map(app => app.id === update.appId ? { ...app, isEnabled: update.enabled } : app));
    try {
      const result = await options.writeConfig?.({ edits: edits(update), hostId });
      if (result?.status === "okOverridden") throw new Error("App setting is overridden by project configuration");
      await Promise.all([
        options.invalidate?.(["available-apps", hostId]), options.invalidate?.(["new-chat-page-suggestions", hostId]),
        options.invalidate?.(["user-saved-config"]),
      ]);
      const current = options.readApps?.();
      if (update.enabled && previous?.find(app => app.id === update.appId)?.isEnabled === false && current?.find(app => app.id === update.appId)?.isEnabled === false) throw new Error("App remains disabled after updating its configuration");
      options.notify?.("success", `${update.appName ?? current?.find(app => app.id === update.appId)?.name ?? update.appId} app ${update.enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      if (previous != null) options.writeOptimistic?.(previous);
      options.notify?.("danger", "Failed to update app");
      throw error;
    } finally { controller.isUpdating = false; controller.updatingAppId = null; }
  } };
  return controller;
}
function t(): void {}
export { n, t };
