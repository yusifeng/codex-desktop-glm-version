import { H3 as initializeAsyncRuntime, V3 as preloadModule } from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

async function loadCodeBlockExecution(): Promise<unknown> {
  const loaded = await preloadModule(async () => { const module = await import("@rchunk/code-block-execution"); return { CodeBlockExecution: module.CodeBlockExecution }; }, [], import.meta.url);
  return loaded.CodeBlockExecution;
}
initializeAsyncRuntime();
export { loadCodeBlockExecution };
