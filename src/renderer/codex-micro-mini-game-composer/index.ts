// Codex Micro disconnect composer games. This readable owner replaces the
// formatted release module while preserving its published component contract.
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as miniGamesChunk from "@rchunk/codex-micro-mini-games";

export type MiniGameKind = "asteroids" | "brick-breaker" | "snake";
interface Glyph { id: string; character: string; bonus: boolean }
interface Level { blocks: Array<{ glyphs: Glyph[] }>; fontSize: number; key: string }
interface PointerInput { angle: number; distance: number }
interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useRef<Value>(initialValue: Value): { current: Value };
}
interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface Scope { get?(signal: unknown): unknown; set?(signal: unknown, value: unknown): void }
interface RuntimeSelection { composerId?: string | null; game?: MiniGameKind | null }
interface DeviceStatus { status?: string }
interface Conversation { items?: Array<{ id: string; type?: string; text: string }> }

const shared = sharedChunk as unknown as {
  BX?: (query: unknown, parameter: unknown) => Conversation | null;
  HX?: <Value>(signal: unknown) => Value;
  I3: () => JsxRuntime;
  K3?: (eventName: string, listener: (payload: { event: unknown }) => void) => void;
  LX?: (signal: unknown) => Scope;
  ZI?: unknown;
  e6: () => ReactRuntime;
};
const initial = initialChunk as unknown as {
  $C?: unknown;
  Iht?: (value: unknown) => string;
  Rht?: (event: unknown) => boolean;
  Slt?: () => boolean;
  kht?: { value?: unknown };
  lQt?: unknown;
  non?: (markdown: string, options?: unknown) => unknown[];
};
const miniGames = miniGamesChunk as unknown as {
  d?: (composerId: string, composerInput: unknown, onRemoved: () => void) => void | (() => void);
  n?: unknown;
  t?: (scope: Scope) => void;
};
const React = shared.e6();
const jsx = shared.I3();
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const GAME_HEIGHT = 192;

function nonWhitespace(glyph: Glyph): boolean { return !/\s/u.test(glyph.character); }
function tokenizeText(text: string, id: string, bonus = false): Glyph[] {
  let previousWasSpace = true;
  const result: Glyph[] = [];
  for (const { index, segment } of segmenter.segment(text)) {
    const isSpace = /\s/u.test(segment);
    if (isSpace && previousWasSpace) continue;
    previousWasSpace = isSpace;
    const character = isSpace ? " " : segment;
    result.push({ id: `${id}:${index}`, character, bonus: bonus || (!isSpace && /[^\p{L}\p{N}]/u.test(character)) });
  }
  if (result.at(-1)?.character === " ") result.pop();
  return result;
}
function flattenMarkdownTokens(tokens: unknown[], messageId: string, path = ""): Glyph[] {
  return tokens.flatMap((token, index) => {
    if (token == null || typeof token !== "object") return [];
    const value = token as Record<string, unknown>;
    const id = `${messageId}:${path}${index}`;
    if (["space", "hr", "def", "html", "image"].includes(String(value.type))) return [];
    if (value.type === "list" && Array.isArray(value.items)) return value.items.flatMap((item, itemIndex) => {
      const nested = (item as { tokens?: unknown[] }).tokens;
      return Array.isArray(nested) ? flattenMarkdownTokens(nested, id, `:item:${itemIndex}:`) : [];
    });
    if (value.type === "table") {
      const rows = [value.header, ...(Array.isArray(value.rows) ? value.rows : [])].filter(Array.isArray) as unknown[][][];
      return rows.flatMap((row, rowIndex) => row.flatMap((cell, cellIndex) => {
        const nested = (cell as { tokens?: unknown[] }).tokens;
        const prefix = cellIndex === 0 ? [] : tokenizeText(" ", `${id}:row:${rowIndex}:${cellIndex}`);
        return [...prefix, ...(Array.isArray(nested) ? flattenMarkdownTokens(nested, id, `:row:${rowIndex}:${cellIndex}:`) : [])];
      }));
    }
    if (Array.isArray(value.tokens)) {
      const nested = flattenMarkdownTokens(value.tokens, id, ":");
      return value.type === "strong" || value.type === "codespan" ? nested.map(glyph => ({ ...glyph, bonus: true })) : nested;
    }
    return typeof value.text === "string" ? tokenizeText(value.text, id, value.type === "code" || value.type === "codespan") : [];
  });
}
function buildLevel(conversation: Conversation | null | undefined, fallback: string): Level {
  const parsedBlocks = (conversation?.items ?? []).flatMap(item => {
    if (item.type !== "agentMessage") return [];
    const parsed = initial.non?.(item.text, undefined);
    const glyphs = Array.isArray(parsed) ? flattenMarkdownTokens(parsed, item.id) : tokenizeText(item.text, item.id);
    return glyphs.some(nonWhitespace) ? [{ glyphs }] : [];
  });
  const source = parsedBlocks.length > 0 ? parsedBlocks : fallback.trim().length > 0 ? [{ glyphs: tokenizeText(fallback, "home-title") }] : [];
  const selected: Array<{ glyphs: Glyph[] }> = [];
  let count = 0;
  for (let index = source.length - 1; index >= 0 && count < 50; index -= 1) {
    const block = source[index];
    if (block == null) continue;
    let glyphs = block.glyphs;
    const available = 120 - count;
    if (glyphs.filter(nonWhitespace).length > available) {
      let remaining = 0; let start = glyphs.length;
      while (start > 0 && remaining < available) { start -= 1; if (nonWhitespace(glyphs[start]!)) remaining += 1; }
      const nextSpace = glyphs.findIndex((glyph, glyphIndex) => glyphIndex >= start && /\s/u.test(glyph.character));
      glyphs = glyphs.slice(nextSpace < 0 ? start : nextSpace + 1);
    }
    if (glyphs.some(nonWhitespace)) { selected.unshift({ glyphs }); count += glyphs.filter(nonWhitespace).length; }
  }
  const fontSize = parsedBlocks.length > 0 ? 13 : 28;
  return { blocks: selected, fontSize, key: selected.length === 0 ? "" : `${fontSize}:${selected.flatMap(block => block.glyphs).map(glyph => `${glyph.id}:${glyph.character}`).join("|")}` };
}

interface CanvasSurfaceProps {
  playing: boolean;
  reducedMotion: boolean;
  onFrame(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, elapsed: number, now: number): boolean;
  onResize(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, width: number, animateEntrance: boolean): void;
}
function CanvasSurface(props: CanvasSurfaceProps): unknown {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const view = canvas?.ownerDocument.defaultView;
    if (canvas == null || context == null || view == null) return;
    let frame = 0; let previous: number | null = null;
    const resize = () => {
      const width = canvas.clientWidth;
      if (width <= 0) return;
      const ratio = view.devicePixelRatio;
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(GAME_HEIGHT * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      props.onResize(context, canvas, width, props.playing && !props.reducedMotion);
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(canvas); resize();
    const draw = (now: number) => {
      const elapsed = previous == null ? 0 : (now - previous) / 1_000; previous = now;
      if (props.onFrame(context, canvas, elapsed, now)) frame = view.requestAnimationFrame(draw);
    };
    if (props.playing) frame = view.requestAnimationFrame(draw);
    return () => { observer?.disconnect(); view.cancelAnimationFrame(frame); };
  }, [props.playing, props.reducedMotion, props.onFrame, props.onResize]);
  return jsx.jsx("div", { className: "codex-micro-mini-game-surface", "data-feature": "game-surface", children: jsx.jsx("canvas", { ref: canvasRef, "aria-hidden": true, className: "pointer-events-none block h-48 w-full text-secondary" }) });
}
function canvasFont(element: HTMLElement, size: number): string { return `${size}px ${getComputedStyle(element).fontFamily}`; }
function drawScore(context: CanvasRenderingContext2D, element: HTMLElement, score: number, opacity: number, suffix = ""): void { context.fillStyle = getComputedStyle(element).color; context.globalAlpha = 0.5 * opacity; context.font = canvasFont(element, 11); context.textAlign = "left"; context.textBaseline = "alphabetic"; context.fillText(`${String(score).padStart(5, "0")}${suffix.length > 0 ? `  ${suffix}` : ""}`, 8, 176); }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(Math.max(value, minimum), maximum); }
function scoreFor(bonus: boolean): number { return bonus ? 20 : 10; }

interface Asteroid extends Glyph { x: number; y: number; radius: number; velocityX: number; velocityY: number }
interface AsteroidsState { width: number; height: number; elapsed: number; score: number; level: Level; ship: { x: number; y: number; angle: number; radius: number }; joystick: PointerInput; asteroids: Asteroid[]; bullets: Array<{ x: number; y: number; radius: number; velocityX: number; velocityY: number }>; status: "playing" | "lost"; animateEntrance: boolean }
function makeAsteroid(glyph: Glyph, index: number, width: number, height: number): Asteroid {
  const side = index % 4; const spread = ((Math.floor(index / 4) * 47 + side * 23) % 100) / 100; const speed = 24 + side * 5; const radius = glyph.bonus ? 9 : 7;
  const axis = (size: number) => { const half = Math.max(size / 2 - 29, 0); const distance = spread * half * 2; return distance <= half ? 10 + distance : size / 2 + 19 + distance - half; };
  if (side === 0) return { ...glyph, radius, velocityX: 0, velocityY: speed, x: axis(width), y: -radius };
  if (side === 1) return { ...glyph, radius, velocityX: -speed, velocityY: 0, x: width + radius, y: axis(height) };
  if (side === 2) return { ...glyph, radius, velocityX: 0, velocityY: -speed, x: axis(width), y: height + radius };
  return { ...glyph, radius, velocityX: speed, velocityY: 0, x: -radius, y: axis(height) };
}
function asteroidGlyphs(level: Level): Glyph[] { const glyphs = level.blocks.flatMap(block => block.glyphs).filter(nonWhitespace); const fallback = Array.from("CODEX", (character, index) => ({ id: `fallback:${index}`, character, bonus: false })); const source = glyphs.length > 0 ? glyphs : fallback; const step = Math.max(Math.ceil(source.length / 18), 1); return source.filter((_glyph, index) => index % step === 0).slice(0, 18); }
function createAsteroids(level: Level, width: number, animateEntrance: boolean): AsteroidsState { return { width, height: GAME_HEIGHT, elapsed: 0, score: 0, level, ship: { x: width / 2, y: GAME_HEIGHT / 2, angle: 0.75, radius: 6 }, joystick: { angle: 0, distance: 0 }, asteroids: asteroidGlyphs(level).map((glyph, index) => makeAsteroid(glyph, index, width, GAME_HEIGHT)), bullets: [], status: "playing", animateEntrance }; }
function circlesCollide(first: { x: number; y: number; radius: number }, second: { x: number; y: number; radius: number }): boolean { const x = first.x - second.x; const y = first.y - second.y; return x * x + y * y <= (first.radius + second.radius) ** 2; }
function stepAsteroids(state: AsteroidsState, elapsed: number): void {
  state.elapsed += Math.max(0, elapsed); let remaining = Math.min(Math.max(0, elapsed), 0.05);
  while (remaining > 0 && state.status === "playing") {
    const step = Math.min(1 / 120, remaining); remaining -= step;
    if (state.joystick.distance >= 0.08) { state.ship.angle = state.joystick.angle; const power = Math.min(state.joystick.distance, 1); const radians = state.ship.angle * Math.PI * 2; state.ship.x = clamp(state.ship.x + Math.cos(radians) * 180 * power * step, 6, state.width - 6); state.ship.y = clamp(state.ship.y + Math.sin(radians) * 180 * power * step, 6, state.height - 6); }
    state.bullets.forEach(bullet => { bullet.x += bullet.velocityX * step; bullet.y += bullet.velocityY * step; });
    state.bullets = state.bullets.filter(bullet => bullet.x >= -2 && bullet.x <= state.width + 2 && bullet.y >= -2 && bullet.y <= state.height + 2);
    for (let index = state.asteroids.length - 1; index >= 0; index -= 1) {
      const asteroid = state.asteroids[index]!; asteroid.x += asteroid.velocityX * step; asteroid.y += asteroid.velocityY * step;
      if (asteroid.x < -asteroid.radius) asteroid.x = state.width + asteroid.radius; else if (asteroid.x > state.width + asteroid.radius) asteroid.x = -asteroid.radius;
      if (asteroid.y < -asteroid.radius) asteroid.y = state.height + asteroid.radius; else if (asteroid.y > state.height + asteroid.radius) asteroid.y = -asteroid.radius;
      const hit = state.bullets.findIndex(bullet => circlesCollide(bullet, asteroid));
      if (hit >= 0) { state.score += scoreFor(asteroid.bonus); state.bullets.splice(hit, 1); state.asteroids[index] = makeAsteroid(asteroid, index, state.width, state.height); }
      else if (circlesCollide(state.ship, asteroid)) state.status = "lost";
    }
  }
}
function fireAsteroid(state: AsteroidsState): void { if (state.status !== "playing") return; const radians = state.ship.angle * Math.PI * 2; const x = Math.cos(radians); const y = Math.sin(radians); state.bullets.push({ x: state.ship.x + x * 9, y: state.ship.y + y * 9, radius: 2, velocityX: x * 320, velocityY: y * 320 }); }
function drawAsteroids(context: CanvasRenderingContext2D, state: AsteroidsState, canvas: HTMLCanvasElement): void { const color = getComputedStyle(canvas).color; const opacity = state.animateEntrance ? clamp(state.elapsed / 0.28, 0, 1) : 1; context.clearRect(0, 0, state.width, state.height); context.fillStyle = color; context.font = canvasFont(canvas, state.level.fontSize); context.textAlign = "center"; context.textBaseline = "middle"; state.asteroids.forEach(asteroid => { context.globalAlpha = (asteroid.bonus ? 0.85 : 0.55) * opacity; context.fillText(asteroid.character, asteroid.x, asteroid.y); }); context.globalAlpha = 0.95 * opacity; state.bullets.forEach(bullet => { context.beginPath(); context.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2); context.fill(); }); drawScore(context, canvas, state.score, opacity); context.globalAlpha = 0.95 * opacity; context.save(); context.translate(state.ship.x, state.ship.y); context.rotate(state.ship.angle * Math.PI * 2); context.beginPath(); context.moveTo(9, 0); context.lineTo(-6, -5); context.lineTo(-3, 0); context.lineTo(-6, 5); context.closePath(); context.fill(); context.restore(); context.globalAlpha = 1; }

type Direction = "up" | "right" | "down" | "left";
interface SnakeState { body: Array<{ x: number; y: number }>; columns: number; rows: number; direction: Direction; nextDirection: Direction; inputState: "waiting-for-neutral" | "waiting-for-direction" | "moving"; food: { x: number; y: number; character: string; bonus: boolean }; foodGlyphs: Array<{ character: string; bonus: boolean }>; foodCollected: number; score: number; status: "playing" | "lost"; accumulator: number }
function snakeFood(level: Level): Array<{ character: string; bonus: boolean }> { const result = level.blocks.flatMap(block => block.glyphs).filter(nonWhitespace).map(({ character, bonus }) => ({ character, bonus })); return result.length > 0 ? result : [{ character: "•", bonus: false }]; }
function placeFood(state: SnakeState, random = Math.random): void { const available: Array<{ x: number; y: number }> = []; for (let y = 0; y < state.rows; y += 1) for (let x = 0; x < state.columns; x += 1) if (!state.body.some(point => point.x === x && point.y === y)) available.push({ x, y }); const point = available[Math.floor(random() * available.length)]; if (point != null) state.food = { ...state.foodGlyphs[state.foodCollected % state.foodGlyphs.length]!, ...point }; }
function createSnake(level: Level, columns: number): SnakeState { const center = { x: Math.floor(columns / 2), y: 6 }; const state: SnakeState = { body: [center, { x: center.x - 1, y: center.y }, { x: center.x - 2, y: center.y }], columns, rows: 12, direction: "right", nextDirection: "right", inputState: "waiting-for-neutral", food: { x: 0, y: 0, character: "•", bonus: false }, foodGlyphs: snakeFood(level), foodCollected: 0, score: 0, status: "playing", accumulator: 0 }; placeFood(state); return state; }
function inputDirection(pointer: PointerInput): Direction | null { if (pointer.distance < 0.65) return null; const angle = ((pointer.angle % 1) + 1) % 1; if (angle >= 0.875 || angle < 0.125) return "right"; if (angle < 0.375) return "down"; if (angle < 0.625) return "left"; return "up"; }
function opposite(first: Direction, second: Direction): boolean { return (first === "up" && second === "down") || (first === "down" && second === "up") || (first === "left" && second === "right") || (first === "right" && second === "left"); }
function controlSnake(state: SnakeState, pointer: PointerInput): void { if (state.inputState === "waiting-for-neutral") { if (pointer.distance < 0.35) state.inputState = "waiting-for-direction"; return; } const direction = inputDirection(pointer); if (direction == null) return; state.inputState = "moving"; if (!opposite(direction, state.direction)) state.nextDirection = direction; }
function stepSnake(state: SnakeState, elapsed: number): void {
  if (state.status !== "playing" || state.inputState !== "moving") return;
  const interval = Math.max(0.08, 0.16 - state.foodCollected * 0.006);
  state.accumulator = Math.min(state.accumulator + Math.max(0, elapsed), interval);
  if (state.accumulator < interval) return;
  state.accumulator = 0; state.direction = state.nextDirection;
  const head = state.body[0]!;
  const next = state.direction === "up" ? { x: head.x, y: head.y - 1 } : state.direction === "right" ? { x: head.x + 1, y: head.y } : state.direction === "down" ? { x: head.x, y: head.y + 1 } : { x: head.x - 1, y: head.y };
  const ate = next.x === state.food.x && next.y === state.food.y;
  const collisionBody = ate ? state.body : state.body.slice(0, -1);
  if (next.x < 0 || next.x >= state.columns || next.y < 0 || next.y >= state.rows || collisionBody.some(point => point.x === next.x && point.y === next.y)) { state.status = "lost"; return; }
  state.body.unshift(next);
  if (ate) { state.foodCollected += 1; state.score += scoreFor(state.food.bonus); placeFood(state); } else state.body.pop();
}
function drawSnake(context: CanvasRenderingContext2D, state: SnakeState, canvas: HTMLCanvasElement): void { const width = canvas.clientWidth; const size = Math.min((width - 16) / state.columns, (GAME_HEIGHT - 16) / state.rows); const left = (width - size * state.columns) / 2; const top = (GAME_HEIGHT - size * state.rows) / 2; const color = getComputedStyle(canvas).color; context.clearRect(0, 0, width, GAME_HEIGHT); context.fillStyle = color; context.font = canvasFont(canvas, Math.min(16, size * 0.9)); context.textAlign = "center"; context.textBaseline = "middle"; context.globalAlpha = state.food.bonus ? 0.95 : 0.7; context.fillText(state.food.character, left + (state.food.x + 0.5) * size, top + (state.food.y + 0.5) * size); context.shadowColor = color; state.body.forEach((point, index) => { const inset = index === 0 ? 1 : 2; context.globalAlpha = Math.max(0.34, 0.92 - index * 0.06); context.shadowBlur = index === 0 ? 10 : 0; context.beginPath(); context.roundRect(left + point.x * size + inset, top + point.y * size + inset, size - inset * 2, size - inset * 2, Math.max(2, (size - inset * 2) / 3)); context.fill(); }); context.shadowBlur = 0; drawScore(context, canvas, state.score, 1); context.globalAlpha = 1; }

interface BrickGlyph extends Glyph { x: number; y: number; width: number; height: number; falling: boolean; velocityX: number; velocityY: number }
interface BrickState { width: number; elapsed: number; score: number; combo: number; lastHit: number | null; level: Level; glyphs: BrickGlyph[]; ball: { x: number; y: number; radius: number; velocityX: number; velocityY: number }; paddle: { x: number; y: number; width: number; height: number }; status: "playing" | "lost" | "cleared"; completedAt: number | null }
function layoutBricks(level: Level, width: number, context: CanvasRenderingContext2D): BrickGlyph[] {
  const glyphs = level.blocks.flatMap(block => block.glyphs).filter(nonWhitespace).slice(-80);
  const rows: Glyph[][] = []; let row: Glyph[] = []; let rowWidth = 0; context.font = canvasFont(context.canvas, level.fontSize);
  glyphs.forEach(glyph => { const glyphWidth = Math.max(context.measureText(glyph.character).width, 4) + 1; if (row.length > 0 && rowWidth + glyphWidth > width - 16) { rows.push(row); row = []; rowWidth = 0; } row.push(glyph); rowWidth += glyphWidth; });
  if (row.length > 0) rows.push(row);
  return rows.slice(-4).flatMap((line, rowIndex) => { const widths = line.map(glyph => Math.max(context.measureText(glyph.character).width, 4)); let x = (width - widths.reduce((sum, value) => sum + value + 1, -1)) / 2; return line.map((glyph, index) => { const result = { ...glyph, x, y: 8 + rowIndex * (Math.max(16, level.fontSize + 3) + 1), width: widths[index]!, height: Math.max(16, level.fontSize + 3), falling: false, velocityX: 0, velocityY: 0 }; x += result.width + 1; return result; }); });
}
function createBricks(level: Level, width: number, context: CanvasRenderingContext2D): BrickState { const glyphs = layoutBricks(level, width, context); const paddleWidth = clamp(width * (0.3 - Math.min(glyphs.length / 120, 1) * 0.1), 52, 96); return { width, elapsed: 0, score: 0, combo: 0, lastHit: null, level, glyphs, ball: { x: width / 2, y: GAME_HEIGHT - 29, radius: 5, velocityX: 105, velocityY: -145 }, paddle: { x: width / 2, y: GAME_HEIGHT - 15, width: paddleWidth, height: 6 }, status: "playing", completedAt: null }; }
function brickCollision(ball: BrickState["ball"], glyph: BrickGlyph): boolean { const x = clamp(ball.x, glyph.x - 1, glyph.x + glyph.width + 1); const y = clamp(ball.y, glyph.y - 1, glyph.y + glyph.height + 1); return (ball.x - x) ** 2 + (ball.y - y) ** 2 <= ball.radius ** 2; }
function stepBricks(state: BrickState, elapsed: number, paddleInput: number): void {
  state.elapsed += Math.max(0, elapsed);
  if (state.lastHit != null && state.elapsed - state.lastHit > 1.5) { state.combo = 0; state.lastHit = null; }
  state.glyphs.filter(glyph => glyph.falling).forEach(glyph => { glyph.velocityY += 420 * Math.min(elapsed, 0.05); glyph.x += glyph.velocityX * elapsed; glyph.y += glyph.velocityY * elapsed; });
  if (state.status !== "playing") return;
  let remaining = Math.min(Math.max(0, elapsed), 0.05);
  while (remaining > 0 && state.status === "playing") {
    const step = Math.min(1 / 120, remaining); remaining -= step; const half = state.paddle.width / 2;
    state.paddle.x = clamp(state.paddle.x + clamp(paddleInput, -1, 1) * 440 * step, half, state.width - half);
    const ball = state.ball; ball.x += ball.velocityX * step; ball.y += ball.velocityY * step;
    if (ball.x - ball.radius <= 0 && ball.velocityX < 0) { ball.x = ball.radius; ball.velocityX *= -1; } else if (ball.x + ball.radius >= state.width && ball.velocityX > 0) { ball.x = state.width - ball.radius; ball.velocityX *= -1; }
    if (ball.y - ball.radius <= 0 && ball.velocityY < 0) { ball.y = ball.radius; ball.velocityY *= -1; }
    const top = state.paddle.y - state.paddle.height / 2;
    if (ball.velocityY > 0 && ball.y + ball.radius >= top && ball.y - ball.radius <= state.paddle.y + state.paddle.height / 2 && Math.abs(ball.x - state.paddle.x) <= half + ball.radius) { ball.y = top - ball.radius; ball.velocityY = -Math.abs(ball.velocityY); ball.velocityX += ((ball.x - state.paddle.x) / half) * Math.abs(ball.velocityY) * 0.45; }
    const hit = state.glyphs.find(glyph => !glyph.falling && brickCollision(ball, glyph));
    if (hit != null) { hit.falling = true; hit.velocityX = ball.velocityX * 0.18; hit.velocityY = -55; state.combo = state.lastHit != null && state.elapsed - state.lastHit <= 1.5 ? Math.min(state.combo + 1, 5) : 1; state.lastHit = state.elapsed; state.score += scoreFor(hit.bonus) * state.combo; ball.velocityY *= -1; const speed = Math.hypot(ball.velocityX, ball.velocityY); if (speed > 0 && speed < 240) { const scale = Math.min(speed * 1.015, 240) / speed; ball.velocityX *= scale; ball.velocityY *= scale; } if (state.glyphs.every(glyph => glyph.falling)) { state.status = "cleared"; state.completedAt = state.elapsed; } }
    if (ball.y - ball.radius > GAME_HEIGHT) { state.status = "lost"; state.completedAt = state.elapsed; }
  }
}
function drawBricks(context: CanvasRenderingContext2D, state: BrickState, canvas: HTMLCanvasElement): void { const color = getComputedStyle(canvas).color; context.clearRect(0, 0, state.width, GAME_HEIGHT); context.fillStyle = color; context.font = canvasFont(canvas, state.level.fontSize); context.textBaseline = "top"; state.glyphs.forEach(glyph => { context.globalAlpha = glyph.falling ? 0.7 : glyph.bonus ? 0.65 : 0.5; context.fillText(glyph.character, glyph.x, glyph.y); }); drawScore(context, canvas, state.score, 1, `×${Math.max(state.combo, 1)}`); context.globalAlpha = 0.95; context.beginPath(); context.roundRect(state.paddle.x - state.paddle.width / 2, state.paddle.y - state.paddle.height / 2, state.paddle.width, state.paddle.height, state.paddle.height / 2); context.fill(); context.shadowBlur = 10; context.shadowColor = color; context.beginPath(); context.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2); context.fill(); context.shadowBlur = 0; context.globalAlpha = 1; }

function GameCanvas({ game, level, onExit, playing }: { game: MiniGameKind; level: Level; onExit(): void; playing: boolean }): unknown {
  const stateRef = React.useRef<AsteroidsState | SnakeState | BrickState | null>(null);
  const horizontalRef = React.useRef({ value: 0, expiresAt: 0 });
  const reducedMotion = initial.Slt?.() ?? false;
  shared.K3?.("codex-micro-joystick-event", payload => {
    const pointer = payload.event as PointerInput;
    const state = stateRef.current;
    if (game === "asteroids" && state != null) (state as AsteroidsState).joystick = pointer;
    else if (game === "snake" && state != null) controlSnake(state as SnakeState, pointer);
    else horizontalRef.current = { value: pointer.distance < 0.08 ? 0 : Math.cos(pointer.angle * Math.PI * 2) * Math.min(pointer.distance / 0.7, 1), expiresAt: performance.now() + 600 };
  });
  shared.K3?.("codex-micro-hid-event", payload => { const state = stateRef.current; if (game === "asteroids" && state != null && (initial.Rht?.(payload.event) ?? true)) fireAsteroid(state as AsteroidsState); });
  React.useEffect(() => { stateRef.current = null; }, [game]);
  React.useEffect(() => { if (!playing && game === "asteroids" && stateRef.current != null) (stateRef.current as AsteroidsState).joystick = { angle: 0, distance: 0 }; }, [game, playing]);
  const onResize = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, width: number, animateEntrance: boolean) => {
    if (game === "asteroids") {
      const previous = stateRef.current as AsteroidsState | null;
      if (previous == null) stateRef.current = createAsteroids(level, width, animateEntrance);
      else if (previous.width !== width) { const scale = width / previous.width; previous.ship.x *= scale; previous.asteroids.forEach(value => { value.x *= scale; }); previous.bullets.forEach(value => { value.x *= scale; }); previous.width = width; }
      drawAsteroids(context, stateRef.current as AsteroidsState, canvas);
    } else if (game === "snake") {
      const columns = Math.max(6, Math.floor((width - 16) / ((GAME_HEIGHT - 16) / 12)));
      const previous = stateRef.current as SnakeState | null;
      if (previous == null) stateRef.current = createSnake(level, columns);
      else { previous.foodGlyphs = snakeFood(level); if (columns > previous.columns) { const shift = Math.floor(columns / 2) - Math.floor(previous.columns / 2); previous.columns = columns; previous.body.forEach(point => { point.x += shift; }); previous.food.x += shift; } }
      drawSnake(context, stateRef.current as SnakeState, canvas);
    } else {
      const previous = stateRef.current as BrickState | null;
      if (previous == null || previous.width !== width || previous.level.key !== level.key) stateRef.current = createBricks(level, width, context);
      drawBricks(context, stateRef.current as BrickState, canvas);
    }
  };
  const onFrame = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, elapsed: number, now: number) => {
    const state = stateRef.current;
    if (state == null) return true;
    if (game === "asteroids") { stepAsteroids(state as AsteroidsState, elapsed); drawAsteroids(context, state as AsteroidsState, canvas); if ((state as AsteroidsState).status === "lost") { onExit(); return false; } }
    else if (game === "snake") { stepSnake(state as SnakeState, elapsed); drawSnake(context, state as SnakeState, canvas); if ((state as SnakeState).status === "lost") { onExit(); return false; } }
    else { const input = now < horizontalRef.current.expiresAt ? horizontalRef.current.value : 0; stepBricks(state as BrickState, elapsed, input); drawBricks(context, state as BrickState, canvas); const bricks = state as BrickState; if (bricks.status === "lost" || (bricks.status === "cleared" && bricks.completedAt != null && bricks.elapsed - bricks.completedAt >= 0.8)) { onExit(); return false; } }
    return true;
  };
  return jsx.jsx(CanvasSurface, { playing, reducedMotion, onResize, onFrame });
}

function CodexMicroMiniGameComposer(input: {
  composerInput: unknown;
  conversationId?: string | null;
  isSideChat?: boolean;
  playing?: boolean;
  showPendingRequest?: boolean;
  status?: "connected" | "not-detected" | string;
  activeComposer?: boolean;
  game?: MiniGameKind | null;
  conversationItems?: Array<{ id: string; type?: string; text: string }>;
  fallbackText?: string;
  onExit?(): void;
}) {
  const scope = shared.LX?.(shared.ZI) ?? {};
  const selected = shared.HX?.<RuntimeSelection>(miniGames.n) ?? null;
  const statusState = shared.HX?.<DeviceStatus>(initial.$C) ?? null;
  const composerId = initial.Iht?.(initial.kht?.value);
  const active = input.activeComposer ?? (selected?.composerId != null && selected.composerId === composerId);
  const status = input.status ?? statusState?.status;
  const game = input.game ?? selected?.game ?? null;
  const available = input.isSideChat !== true && input.showPendingRequest !== true && (status === "connected" || (active && status !== "not-detected"));
  React.useEffect(() => {
    if (!available || composerId == null) return;
    return miniGames.d?.(composerId, input.composerInput, () => {
      const current = scope.get?.(miniGames.n) as RuntimeSelection | null;
      if (current?.composerId === composerId) miniGames.t?.(scope);
    });
  }, [available, composerId, input.composerInput, scope]);
  if (!available || !active || game == null) return null;
  const conversation = input.conversationItems == null ? shared.BX?.(initial.lQt, active ? input.conversationId ?? null : null) : { items: input.conversationItems };
  const fallback = input.fallbackText ?? globalThis.document?.querySelector?.("[data-feature='game-source']")?.textContent?.trim() ?? "";
  const level = buildLevel(conversation, fallback);
  return jsx.jsx(GameCanvas, { game, level, playing: (input.playing ?? true) && status === "connected", onExit: input.onExit ?? (() => miniGames.t?.(scope)) });
}

export { CodexMicroMiniGameComposer };
