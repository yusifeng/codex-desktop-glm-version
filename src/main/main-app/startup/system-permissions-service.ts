import { Uf as RpcTarget } from "@chunk/shared";

type Logger = {
  error(message: string, context: unknown): void;
};

type MediaAccessStatus = string;

export type SystemPermissionsServiceDependencies = {
  askForMicrophoneAccess(): Promise<boolean>;
  delay(milliseconds: number): Promise<void>;
  getMicrophoneAccessStatus(): MediaAccessStatus;
  getNotificationPermissionStatus(): Promise<string>;
  logger(): Logger;
  notificationAuthorizationUnavailable: boolean;
  notificationSettingsAppBundleIdentifier: string;
  openExternal(url: string): Promise<unknown>;
  permissionSettingsAppPath: string;
  platform: string;
  requestNotificationAuthorization(): void;
  showItemInFolder(path: string): void;
};

const MAC_SCREEN_RECORDING_SETTINGS =
  "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture";
const MAC_MICROPHONE_SETTINGS =
  "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone";
const MAC_ACCESSIBILITY_SETTINGS =
  "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";
const MAC_NOTIFICATION_SETTINGS =
  "x-apple.systempreferences:com.apple.Notifications-Settings.extension";
const WINDOWS_NOTIFICATION_SETTINGS = "ms-settings:notifications";
const WINDOWS_MICROPHONE_SETTINGS = "ms-settings:privacy-microphone";

/** Provides the renderer-facing OS permission status, request, and settings operations. */
export class SystemPermissionsService extends RpcTarget {
  private readonly dependencies: SystemPermissionsServiceDependencies;

  constructor(dependencies: SystemPermissionsServiceDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async getNotificationPermissionStatus(): Promise<
    "enabled" | "disabled" | "not-determined" | null
  > {
    if (this.dependencies.notificationAuthorizationUnavailable) return null;
    switch (await this.dependencies.getNotificationPermissionStatus()) {
      case "granted":
        return "enabled";
      case "denied":
        return "disabled";
      case "not-determined":
        return "not-determined";
      default:
        return null;
    }
  }

  async requestMicrophoneAccess(): Promise<{
    requestResult: string;
    statusAfter: string;
    statusBefore: string;
  }> {
    if (this.dependencies.platform !== "darwin") {
      return {
        statusBefore: "unknown",
        statusAfter: "unknown",
        requestResult: "not_requested",
      };
    }
    const statusBefore = this.dependencies.getMicrophoneAccessStatus();
    let statusAfter = "unknown";
    let requestResult = "error";
    try {
      if (statusBefore === "granted") {
        return { statusBefore, statusAfter: statusBefore, requestResult: "not_requested" };
      }
      requestResult = (await this.dependencies.askForMicrophoneAccess()) ? "granted" : "denied";
      statusAfter = this.dependencies.getMicrophoneAccessStatus();
      return { statusBefore, statusAfter, requestResult };
    } catch (error) {
      this.dependencies.logger().error("Microphone permission request failed", {
        safe: {},
        sensitive: { error },
      });
      return { statusBefore, statusAfter, requestResult };
    }
  }

  async openMicrophoneSettings(): Promise<void> {
    try {
      if (this.dependencies.platform === "darwin") {
        await this.dependencies.openExternal(MAC_MICROPHONE_SETTINGS);
      } else if (this.dependencies.platform === "win32") {
        await this.dependencies.openExternal(WINDOWS_MICROPHONE_SETTINGS);
      }
    } catch (error) {
      this.dependencies.logger().error("Open microphone settings failed", {
        safe: {},
        sensitive: { error },
      });
    }
  }

  async openNotificationSettings(): Promise<void> {
    try {
      if (this.dependencies.platform === "win32") {
        await this.dependencies.openExternal(WINDOWS_NOTIFICATION_SETTINGS);
        return;
      }
      if (this.dependencies.notificationAuthorizationUnavailable) return;
      const status = await this.getNotificationPermissionStatus();
      if (status == null || status === "not-determined") {
        this.dependencies.requestNotificationAuthorization();
        await this.dependencies.delay(2_000);
      }
      await this.dependencies.openExternal(
        `${MAC_NOTIFICATION_SETTINGS}?id=${encodeURIComponent(
          this.dependencies.notificationSettingsAppBundleIdentifier,
        )}`,
      );
    } catch (error) {
      this.dependencies.logger().error("Open notification settings failed", {
        safe: {},
        sensitive: { error },
      });
    }
  }

  async openScreenRecordingSettings(): Promise<void> {
    if (this.dependencies.platform !== "darwin") return;
    try {
      await this.dependencies.openExternal(MAC_SCREEN_RECORDING_SETTINGS);
    } catch (error) {
      this.dependencies.logger().error("Open screen recording settings failed", {
        safe: {},
        sensitive: { error },
      });
    }
  }

  async openAccessibilitySettings(): Promise<void> {
    if (this.dependencies.platform !== "darwin") return;
    try {
      await this.dependencies.openExternal(MAC_ACCESSIBILITY_SETTINGS);
    } catch (error) {
      this.dependencies.logger().error("Open accessibility settings failed", {
        safe: {},
        sensitive: { error },
      });
    }
  }

  async showPermissionSettingsAppInFinder(): Promise<void> {
    if (this.dependencies.platform !== "darwin") return;
    try {
      this.dependencies.showItemInFolder(this.dependencies.permissionSettingsAppPath);
    } catch (error) {
      this.dependencies.logger().error("Show permission settings app in Finder failed", {
        safe: {},
        sensitive: { error },
      });
    }
  }
}

if (typeof module !== "undefined") module.exports = { SystemPermissionsService };
