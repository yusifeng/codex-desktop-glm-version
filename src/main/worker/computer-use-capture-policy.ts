/**
 * Pure policy for deciding whether a computer-use capture worker should keep
 * polling for updates.  Transport, logging and event emission remain in the
 * worker entry; this module only owns the protocol state transition.
 */
function shouldContinueComputerUseCaptureUpdates(update: { type?: string; transitionSnapshotDataURL?: string | null }): boolean {
  switch (update.type) {
    case `metadata`:
    case `axText`:
      return true;
    case `screenshot`:
      return !(update.transitionSnapshotDataURL != null && update.transitionSnapshotDataURL.length > 0);
    case `completed`:
    case `failed`:
      return false;
    default:
      return false;
  }
}

export { shouldContinueComputerUseCaptureUpdates };
if (typeof module !== `undefined`) module.exports = { shouldContinueComputerUseCaptureUpdates };
