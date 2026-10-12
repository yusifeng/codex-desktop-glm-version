type CaptureUpdateLoopDependencies = {
  getNextCaptureUpdate(request: { requestId: string }): Promise<any>;
  emitCaptureUpdate(requestId: string, update: any): void;
  shouldContinue(update: any): boolean;
  now?(): number;
  onWaiting?(requestId: string): void;
  onReceived?(requestId: string, update: any, elapsedMs: number): void;
  onFailure?(requestId: string, error: unknown): void;
};

async function readComputerUseCaptureUpdates(requestId: string, dependencies: CaptureUpdateLoopDependencies): Promise<void> {
  try {
    const startedAt = dependencies.now?.() ?? Date.now();
    dependencies.onWaiting?.(requestId);
    const update = await dependencies.getNextCaptureUpdate({ requestId });
    dependencies.onReceived?.(requestId, update, (dependencies.now?.() ?? Date.now()) - startedAt);
    dependencies.emitCaptureUpdate(requestId, update);
    if (dependencies.shouldContinue(update)) await readComputerUseCaptureUpdates(requestId, dependencies);
  } catch (error) {
    dependencies.onFailure?.(requestId, error);
    dependencies.emitCaptureUpdate(requestId, { type: `failed`, failureReason: `update_poll_failed` });
  }
}

export { readComputerUseCaptureUpdates };
if (typeof module !== `undefined`) module.exports = { readComputerUseCaptureUpdates };
