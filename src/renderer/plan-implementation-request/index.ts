import "@rchunk/rolldown-runtime";
const IMPLEMENT_PLAN_PREFIX = "PLEASE IMPLEMENT THIS PLAN:";
function isPlanImplementationRequest(input: string): boolean { return input.startsWith(IMPLEMENT_PLAN_PREFIX); }
function initializePlanImplementationRequest(): void {}
export { initializePlanImplementationRequest as n, isPlanImplementationRequest as r, IMPLEMENT_PLAN_PREFIX as t };
