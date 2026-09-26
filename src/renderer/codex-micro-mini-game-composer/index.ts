// codex-micro-mini-game-composer —— Codex Micro 断线等待时的三种文字 mini-game 宿主。
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/codex-micro-mini-games";

export type MiniGameKind = "asteroids" | "brick-breaker" | "snake";
export interface MiniGameGlyph { id: string; character: string; bonus: boolean }

function buildMiniGameLevel(texts: Array<{ id: string; text: string }>, fallback = "") {
  const source = texts.filter((item) => item.text.trim()).length > 0 ? texts : [{ id: "home-title", text: fallback }];
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const glyphs: MiniGameGlyph[] = [];
  for (const item of source) {
    for (const part of segmenter.segment(item.text)) {
      const character = /\s/u.test(part.segment) ? " " : part.segment;
      if (character === " " && (glyphs.length === 0 || glyphs.at(-1)?.character === " ")) continue;
      glyphs.push({ id: `${item.id}:${part.index}`, character, bonus: character !== " " && /[^\p{L}\p{N}]/u.test(character) });
    }
  }
  while (glyphs.at(-1)?.character === " ") glyphs.pop();
  const last = glyphs.slice(-120);
  let nonSpace = last.filter((glyph) => glyph.character !== " ");
  if (nonSpace.length > 50) {
    const cutoffId = nonSpace.at(-50)!.id;
    const cutoff = last.findIndex((glyph) => glyph.id === cutoffId);
    nonSpace = last.slice(cutoff).filter((glyph) => glyph.character !== " ");
    return { blocks: [{ glyphs: last.slice(cutoff) }], fontSize: texts.length > 0 ? 13 : 28, key: nonSpace.map((glyph) => `${glyph.id}:${glyph.character}`).join("|") };
  }
  return { blocks: last.length === 0 ? [] : [{ glyphs: last }], fontSize: texts.length > 0 ? 13 : 28, key: nonSpace.map((glyph) => `${glyph.id}:${glyph.character}`).join("|") };
}

function CodexMicroMiniGameComposer(input: {
  composerInput: unknown; conversationId?: string | null; isSideChat?: boolean; playing?: boolean; showPendingRequest?: boolean;
  status?: "connected" | "not-detected" | string; activeComposer?: boolean; game?: MiniGameKind | null;
  conversationItems?: Array<{ id: string; type?: string; text: string }>; fallbackText?: string; onExit?(): void;
}) {
  const active = input.activeComposer === true;
  const available = input.isSideChat !== true && input.showPendingRequest !== true &&
    (input.status === "connected" || (active && input.status !== "not-detected"));
  if (!available || !active || input.game == null) return null;
  const texts = (input.conversationItems ?? []).filter((item) => item.type == null || item.type === "agentMessage");
  const level = buildMiniGameLevel(texts, input.fallbackText ?? "");
  return {
    kind: "codex-micro-mini-game-composer" as const,
    game: input.game,
    playing: (input.playing ?? true) && input.status === "connected",
    level,
    exit: input.onExit ?? (() => {}),
    controls: input.game === "snake" ? ["arrows", "swipe"] : input.game === "asteroids" ? ["rotate", "fire"] : ["move-paddle"],
  };
}

export { CodexMicroMiniGameComposer };
