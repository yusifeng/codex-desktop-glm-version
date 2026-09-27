import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
async function n(): Promise<unknown> { const module = await import("@rchunk/multiplayer-note"); return module.MultiplayerNote; }
async function r(): Promise<unknown> { const module = await import("@rchunk/multiplayer-writing-block"); return module.MultiplayerWritingBlock; }
function t(): void {}
export { n, r, t };
