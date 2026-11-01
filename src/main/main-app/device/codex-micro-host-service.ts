// Per-window Codex Micro host service and macOS input-monitoring permission probe.
// Extracted from main-C-Mhak1n.ts (`Qk..rA/iA/cA`).
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { app, powerMonitor, shell } from "electron";
import { resolveElectronResourcesPath } from "@chunk/electron-resources-path";
import { createTaggedLogger } from "@chunk/logger";
import { Uf as EventEmitterBase } from "@chunk/shared";

const INPUT_MONITORING_ADDON = "input-monitoring-permission.node";
const DEVELOPMENT_INPUT_MONITORING_ADDON = "input_monitoring_permission.node";
const INPUT_MONITORING_SETTINGS_URL =
  "x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent";
const requireAddon = createRequire(import.meta.url);
const permissionLogger = createTaggedLogger("input-monitoring-permission");

interface InputMonitoringAddon {
  hasInputMonitoringPermission(): boolean;
}

function inputMonitoringAddonCandidates(): string[] {
  const developmentPath = join(
    app.getAppPath(),
    "native",
    "input-monitoring-permission-addon",
    "build",
    `Release-${process.arch}`,
    DEVELOPMENT_INPUT_MONITORING_ADDON,
  );
  const resourcesPath = resolveElectronResourcesPath({
    env: process.env,
    resourcesPath: process.resourcesPath,
  });
  return resourcesPath == null
    ? [developmentPath]
    : [join(resourcesPath, "native", INPUT_MONITORING_ADDON), developmentPath];
}

function loadInputMonitoringAddon(): InputMonitoringAddon {
  const addonPath = inputMonitoringAddonCandidates().find(existsSync);
  if (addonPath == null) throw new Error("Input Monitoring permission addon not found");
  return requireAddon(addonPath) as InputMonitoringAddon;
}

function getInputMonitoringPermissionStatus({
  addon,
  platform = process.platform,
}: { addon?: InputMonitoringAddon; platform?: string } = {}): "granted" | "denied" | "unavailable" {
  if (platform !== "darwin") return "unavailable";
  try {
    return (addon ?? loadInputMonitoringAddon()).hasInputMonitoringPermission() ? "granted" : "denied";
  } catch (error) {
    permissionLogger.warning("Failed to check input monitoring access", {
      safe: {},
      sensitive: { error },
    });
    return "unavailable";
  }
}

class CodexMicroHostService extends (EventEmitterBase as new () => {}) {
  serviceManager: any;
  windowManager: any;
  origin: any;
  logger = createTaggedLogger("CodexMicroHostService");

  constructor(serviceManager: any, windowManager: any, origin: any) {
    super();
    this.serviceManager = serviceManager;
    this.windowManager = windowManager;
    this.origin = origin;
  }

  getState(): unknown {
    return this.serviceManager.getState();
  }

  async getInputMonitoringPermissionStatus(): Promise<string> {
    return getInputMonitoringPermissionStatus();
  }

  ownsPrimaryWindow(): boolean {
    return (
      this.windowManager.getPrimaryWindow()?.webContents === this.origin &&
      powerMonitor.getSystemIdleState(1) !== "locked"
    );
  }

  async openInputMonitoringSettings(): Promise<void> {
    try {
      await shell.openExternal(INPUT_MONITORING_SETTINGS_URL);
    } catch (error) {
      this.logger.error("Open input monitoring settings failed", {
        safe: {},
        sensitive: { error },
      });
    }
  }

  async updateAgentThreadKeys(keys: unknown[], kinds: unknown[], singleTap = false): Promise<boolean> {
    if (!this.ownsPrimaryWindow()) return false;
    this.serviceManager.updateAgentThreadKeys(keys, kinds, singleTap);
    return true;
  }

  async updateLighting(lighting: unknown): Promise<unknown> {
    return this.ownsPrimaryWindow() ? this.serviceManager.updateLighting(lighting) : false;
  }
}

export {
  CodexMicroHostService,
  getInputMonitoringPermissionStatus,
  inputMonitoringAddonCandidates,
  loadInputMonitoringAddon,
};

if (typeof module !== "undefined") {
  module.exports = {
    CodexMicroHostService,
    getInputMonitoringPermissionStatus,
    inputMonitoringAddonCandidates,
    loadInputMonitoringAddon,
  };
}
