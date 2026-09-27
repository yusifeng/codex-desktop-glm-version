import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import { t as initializeModulePreload } from "@rchunk/modulepreload-polyfill";
async function initialize(): Promise<void> { initializeModulePreload(); await import("@rchunk/rpc"); await import("@rchunk/app-main"); }
await initialize();
