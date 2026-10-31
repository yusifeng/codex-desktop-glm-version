import { randomUUID } from "node:crypto";

export interface AppEntryAttribution {
  appEntryInstanceId: string;
  appEntryReceivedTs: number;
  kind: `deep-link` | `direct` | `foreground`;
  entryUrl?: string;
  attribution?: unknown;
}

export class AppEntryAttributionTracker {
  private activationGeneration = 0;
  private sourceGeneration = 0;
  private isBackgrounded = true;
  private hasObservedInitialWindow = false;
  private hasCompletedInitialForeground = false;
  private suppressNextForeground = false;
  private pendingBackgroundSourceKey: string | undefined;

  constructor(
    private readonly emit: (entry: AppEntryAttribution) => void,
    private readonly schedule: (callback: () => void) => void = (callback) => setTimeout(callback, 0),
    private readonly now: () => number = Date.now,
    private readonly createId: () => string = randomUUID,
    private initialInstallerId?: string,
  ) {}

  handleDeepLink(url: string): void {
    let sourceKey = `deep-link:${url}`;
    if (
      (!this.isBackgrounded && this.hasCompletedInitialForeground) ||
      this.pendingBackgroundSourceKey !== sourceKey
    ) {
      this.emitReceipt(`deep-link`, url);
      this.handleSourceBearingActivation(sourceKey);
    }
  }

  handleSourceActivation(source: any, emit = this.emit): boolean {
    if (!this.hasObservedInitialWindow) return false;
    let sourceKey =
      source.notificationId == null && source.notificationChannelId == null
        ? undefined
        : [
            `source`,
            source.channel,
            source.source,
            source.notificationId ?? ``,
            source.notificationChannelId ?? ``,
          ].join(`\0`);
    if (
      sourceKey != null &&
      (this.isBackgrounded || !this.hasCompletedInitialForeground) &&
      this.pendingBackgroundSourceKey === sourceKey
    )
      return false;
    this.emitReceipt(`direct`, undefined, source, emit);
    this.handleSourceBearingActivation(sourceKey);
    return true;
  }

  handleUnloggableDeepLinkActivation(): void {
    this.handleSourceBearingActivation(undefined);
  }

  private handleSourceBearingActivation(sourceKey: string | undefined): void {
    this.sourceGeneration += 1;
    if (this.isBackgrounded || !this.hasCompletedInitialForeground) {
      this.pendingBackgroundSourceKey = sourceKey;
      this.suppressNextForeground = this.isBackgrounded;
      this.hasCompletedInitialForeground = true;
      this.activationGeneration += 1;
    }
  }

  handleInitialWindowVisible(): void {
    if (!this.hasObservedInitialWindow) {
      this.hasObservedInitialWindow = true;
      this.handleForeground();
    }
  }

  canAttributeRuntimeActivation(): boolean {
    return this.hasObservedInitialWindow;
  }

  handleBackground(): void {
    if (!this.isBackgrounded) {
      this.isBackgrounded = true;
      this.pendingBackgroundSourceKey = undefined;
      this.activationGeneration += 1;
    }
  }

  handleForeground(): void {
    if (!this.hasObservedInitialWindow || (!this.isBackgrounded && this.hasCompletedInitialForeground))
      return;
    this.isBackgrounded = false;
    if (this.suppressNextForeground) {
      this.suppressNextForeground = false;
      this.pendingBackgroundSourceKey = undefined;
      this.hasCompletedInitialForeground = true;
      this.activationGeneration += 1;
      return;
    }
    let activationGeneration = ++this.activationGeneration,
      sourceGeneration = this.sourceGeneration,
      kind: AppEntryAttribution[`kind`] = this.hasCompletedInitialForeground
        ? `foreground`
        : `direct`;
    this.schedule(() => {
      if (
        this.isBackgrounded ||
        this.activationGeneration !== activationGeneration ||
        this.sourceGeneration !== sourceGeneration
      )
        return;
      this.hasCompletedInitialForeground = true;
      this.pendingBackgroundSourceKey = undefined;
      this.emitReceipt(kind);
    });
  }

  private emitReceipt(
    kind: AppEntryAttribution[`kind`],
    entryUrl?: string,
    attribution?: unknown,
    emit = this.emit,
  ): void {
    let installerId = kind === `direct` && attribution == null && entryUrl == null
      ? this.initialInstallerId
      : undefined;
    this.initialInstallerId = undefined;
    emit({
      appEntryInstanceId: installerId ?? this.createId(),
      appEntryReceivedTs: this.now(),
      kind,
      entryUrl,
      attribution:
        installerId == null
          ? attribution
          : { channel: `installer`, source: `chatgpt_micro_installer`, entryId: installerId },
    });
  }
}
