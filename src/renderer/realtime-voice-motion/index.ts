import "@rchunk/rolldown-runtime";

const orbTransition = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };
const stageTransition = { duration: 0.28, ease: [0.33, 1, 0.68, 1] as const };
const reducedMotionTransition = { duration: 0 };
function initializeRealtimeVoiceMotion(): void {}
export { initializeRealtimeVoiceMotion as i, stageTransition as n, reducedMotionTransition as r, orbTransition as t };
