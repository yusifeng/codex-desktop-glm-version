import "@rchunk/rolldown-runtime";

let orbTransition: { duration: number; ease: readonly number[] };
let stageTransition: { duration: number; ease: readonly number[] };
let reducedMotionTransition: { duration: number };
function initializeRealtimeVoiceMotion(): void {
  orbTransition = { duration: 0.2, ease: [0.16, 1, 0.3, 1] };
  stageTransition = { duration: 0.28, ease: [0.33, 1, 0.68, 1] };
  reducedMotionTransition = { duration: 0 };
}
export { initializeRealtimeVoiceMotion as i, stageTransition as n, reducedMotionTransition as r, orbTransition as t };
