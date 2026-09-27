import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
export interface ImageGenLoadingGamesProps { aspectRatio?: number; game: "brick-breaker" | "snake"; imageCount?: number; isGif?: boolean; messageId: string; onGameEngaged?(sessionId: string): void; onGameOpened?(sessionId: string): void; startedAtMs?: number }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function ImageGenLoadingGames({ aspectRatio = 1, game, imageCount = 1, isGif = false, messageId, onGameEngaged, onGameOpened, startedAtMs = Date.now() }: ImageGenLoadingGamesProps): unknown { const sessionId = `${messageId}:${startedAtMs}`; const title = game === "snake" ? "Play Snake while your image is generating" : "Play Brick Breaker while your image is generating"; return jsx().jsxs("section", { "aria-label": title, "data-game": game, "data-image-count": imageCount, "data-is-gif": isGif, style: { aspectRatio }, children: [jsx().jsx("p", { role: "status", children: isGif ? "Generating animation…" : imageCount === 1 ? "Generating image…" : `Generating ${imageCount} images…` }), jsx().jsx("button", { onClick: () => onGameOpened?.(sessionId), onKeyDown: () => onGameEngaged?.(sessionId), type: "button", children: title })] }); }
export { ImageGenLoadingGames };
