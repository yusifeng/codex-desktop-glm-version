import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
interface Blocker { isCommitting: boolean; proceed(): void; reset(): void; state: "blocked" | "proceeding" | "unblocked" }
function createNavigationBlocker(shouldBlock: () => boolean): Blocker { let state: Blocker["state"] = shouldBlock() ? "blocked" : "unblocked", committing = false; return { get state() { return state; }, get isCommitting() { return committing; }, proceed() { committing = true; state = "proceeding"; }, reset() { if (!committing) state = "unblocked"; } }; }
function initialize(): void {}
export { initialize as n, createNavigationBlocker as t };
