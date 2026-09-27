import "@rchunk/rolldown-runtime";

interface WheelEventLike {
  deltaY: number;
  timeStamp: number;
}

interface ActiveSwipe {
  firstEventTimestamp: number;
  hasDecelerated: boolean;
  idleMs: number;
  lastDeltaY: number;
  lastEventTimestamp: number;
  peakDeltaY: number;
}

class WheelSwipeGesture {
  activeSwipe: ActiveSwipe | null = null;

  begin(event: WheelEventLike, idleMs: number): void {
    const deltaY = Math.abs(event.deltaY);
    this.activeSwipe = {
      firstEventTimestamp: event.timeStamp,
      hasDecelerated: false,
      idleMs,
      lastDeltaY: deltaY,
      lastEventTimestamp: event.timeStamp,
      peakDeltaY: deltaY,
    };
  }

  isContinuation(event: WheelEventLike): boolean {
    const swipe = this.activeSwipe;
    if (swipe == null) return false;
    const deltaY = Math.abs(event.deltaY);
    const restarted =
      event.timeStamp - swipe.firstEventTimestamp >= 200 &&
      swipe.hasDecelerated &&
      deltaY > swipe.lastDeltaY + 8;
    if (
      event.timeStamp - swipe.lastEventTimestamp >= swipe.idleMs ||
      restarted
    ) {
      this.activeSwipe = null;
      return false;
    }
    swipe.peakDeltaY = Math.max(swipe.peakDeltaY, deltaY);
    swipe.hasDecelerated ||= deltaY * 2 <= swipe.peakDeltaY;
    swipe.lastDeltaY = deltaY;
    swipe.lastEventTimestamp = event.timeStamp;
    return true;
  }
}

function initializeWheelSwipeGesture(): void {}
export { initializeWheelSwipeGesture as n, WheelSwipeGesture as t };
