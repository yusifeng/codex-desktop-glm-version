// Synthetic terrain contours and elevation profiles along a transect.
import "@rchunk/rolldown-runtime";

type TerrainExample = "single-hill" | "two-hills-and-saddle" | "valley-and-ridge";
interface TerrainValues { terrain_example?: unknown; ax?: number | null; ay?: number | null; bx?: number | null; by?: number | null }
interface Point { x: number; y: number }
interface ContourLine { level: number; points: Point[] }

const terrainExamples: TerrainExample[] = ["single-hill", "two-hills-and-saddle", "valley-and-ridge"];
const contourLevels = Array.from({ length: 10 }, (_, index) => 80 + index * 20);
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const finiteOrDefault = (value: number | null | undefined, defaultValue: number): number => typeof value === "number" && Number.isFinite(value) ? value : defaultValue;
const gaussianHill = (x: number, y: number, centerX: number, centerY: number, widthX: number, widthY: number): number => Math.exp(-(((x - centerX) / widthX) ** 2 + ((y - centerY) / widthY) ** 2));
const normalizeTerrainValues = (values: TerrainValues) => ({ terrain_example: typeof values.terrain_example === "string" && terrainExamples.some((example) => example === values.terrain_example) ? values.terrain_example as TerrainExample : "two-hills-and-saddle" as TerrainExample, ax: clamp(finiteOrDefault(values.ax, 8), 4, 96), ay: clamp(finiteOrDefault(values.ay, 30), 4, 56), bx: clamp(finiteOrDefault(values.bx, 92), 4, 96), by: clamp(finiteOrDefault(values.by, 30), 4, 56) });
const terrainElevation = (example: TerrainExample, x: number, y: number): number => { if (example === "single-hill") return 72 + 180 * gaussianHill(x, y, 54, 31, 28, 21) + 0.15 * (60 - y); if (example === "two-hills-and-saddle") return 72 + 154 * gaussianHill(x, y, 31, 32, 20, 19) + 138 * gaussianHill(x, y, 72, 28, 18, 17) + 14 * gaussianHill(x, y, 52, 30, 34, 11); const ridgeX = 31 + 0.1 * (y - 30); const valleyDistance = Math.sqrt((x - ridgeX) ** 2 + 16) - 4; return 56 + 1.45 * (60 - y) + 1.55 * valleyDistance + 78 * gaussianHill(x, y, 76, 30, 18, 25); };
const interpolateCrossing = (left: Point, right: Point, leftValue: number, rightValue: number): Point => { const progress = leftValue === rightValue ? 0.5 : leftValue / (leftValue - rightValue); return { x: left.x + (right.x - left.x) * progress, y: left.y + (right.y - left.y) * progress }; };
const pointKey = (point: Point): string => `${Math.round(point.x * 1e4)}:${Math.round(point.y * 1e4)}`;
const generateTerrainContours = (example: TerrainExample): ContourLine[] => {
  const elevations = Array.from({ length: 39 }, (_, row) => Array.from({ length: 65 }, (_, column) => terrainElevation(example, column / 64 * 100, row / 38 * 60)));
  const contours: ContourLine[] = [];
  for (const level of contourLevels) {
    const segments: Array<[Point, Point]> = [];
    for (let row = 0; row < 38; row += 1) for (let column = 0; column < 64; column += 1) {
      const x0 = column / 64 * 100; const x1 = (column + 1) / 64 * 100; const y0 = row / 38 * 60; const y1 = (row + 1) / 38 * 60;
      const corners: Point[] = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
      const values = [elevations[row][column] - level, elevations[row][column + 1] - level, elevations[row + 1][column + 1] - level, elevations[row + 1][column] - level];
      const crossings: Point[] = [];
      for (let edge = 0; edge < 4; edge += 1) { const next = (edge + 1) % 4; if ((values[edge] >= 0) !== (values[next] >= 0)) crossings.push(interpolateCrossing(corners[edge], corners[next], values[edge], values[next])); }
      if (crossings.length === 2) segments.push([crossings[0], crossings[1]]); else if (crossings.length === 4) segments.push([crossings[0], crossings[1]], [crossings[2], crossings[3]]);
    }
    const connected = new Map<string, number[]>();
    segments.forEach(([start, end], index) => { for (const point of [start, end]) { const indexes = connected.get(pointKey(point)) ?? []; indexes.push(index); connected.set(pointKey(point), indexes); } });
    const used = new Set<number>();
    for (let index = 0; index < segments.length; index += 1) {
      if (used.has(index)) continue; used.add(index); const points = [...segments[index]];
      for (const side of ["end", "start"] as const) {
        while (true) { const endpoint = side === "end" ? points.at(-1)! : points[0]; const nextSegment = (connected.get(pointKey(endpoint)) ?? []).find((candidate) => !used.has(candidate)); if (nextSegment === undefined) break; used.add(nextSegment); const [start, end] = segments[nextSegment]; const continuation = pointKey(start) === pointKey(endpoint) ? end : start; if (side === "end") points.push(continuation); else points.unshift(continuation); }
      }
      if (points.length > 1) contours.push({ level, points });
    }
  }
  return contours;
};
const analyzeTerrainTransect = (values: TerrainValues) => {
  const state = normalizeTerrainValues(values);
  const samples = Array.from({ length: 181 }, (_, index) => { const distance = index / 180; const point = { x: state.ax + (state.bx - state.ax) * distance, y: state.ay + (state.by - state.ay) * distance }; return { distance, point, elevation: terrainElevation(state.terrain_example, point.x, point.y) }; });
  const crossings: Array<{ distance: number; elevation: number; point: Point }> = [];
  for (const level of contourLevels) for (let index = 1; index < samples.length; index += 1) { const previous = samples[index - 1]; const current = samples[index]; const previousOffset = previous.elevation - level; const currentOffset = current.elevation - level; if ((previousOffset >= 0) === (currentOffset >= 0)) continue; const point = interpolateCrossing(previous.point, current.point, previousOffset, currentOffset); const progress = previousOffset / (previousOffset - currentOffset); crossings.push({ distance: previous.distance + (current.distance - previous.distance) * progress, elevation: level, point }); }
  crossings.sort((left, right) => left.distance - right.distance);
  return { state, samples, crossings, minimum: Math.min(...samples.map(({ elevation }) => elevation)), maximum: Math.max(...samples.map(({ elevation }) => elevation)) };
};

function initializeContourReliefModel(): void {}

export { normalizeTerrainValues as a, initializeContourReliefModel as i, analyzeTerrainTransect as n, generateTerrainContours as r, terrainExamples as t };
