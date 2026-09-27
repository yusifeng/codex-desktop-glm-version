import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
interface LibraryAccessState { accountFeatures?: readonly string[]; access: "allowed" | "denied" | "loading"; featureGateEnabled?: boolean; isInternal?: boolean; isLoadingAccount?: boolean; sharedContentGateEnabled?: boolean }
const r = { evaluate(state: LibraryAccessState): boolean { if (state.access === "denied") return false; if (state.isInternal || state.featureGateEnabled) return true; return state.sharedContentGateEnabled === true ? state.isLoadingAccount !== true : false; } };
const n = { evaluate(state: LibraryAccessState): boolean { return state.sharedContentGateEnabled === true && state.accountFeatures?.includes("library_shared_content_available") === true; } };
function t(): void {}
export { n, r, t };
