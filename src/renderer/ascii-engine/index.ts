import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  e6: getReactRuntime,
} = appSharedChunk;

type AsciiMode = "noise" | "video" | "composite";

export interface AsciiCanvasProps {
  autoCover?: boolean;
  backgroundColor?: string;
  columns: number;
  foregroundColor?: string;
  lines: readonly string[];
  rows: number;
  scale?: number;
}

export interface AsciiEngineOptions {
  initialColumns?: number;
  initialMode?: AsciiMode;
  initialRows?: number;
  preferredVideoKeyword?: string;
}

export interface AsciiEngineState {
  asciiChars: string;
  columns: number;
  lines: readonly string[];
  mode: AsciiMode;
  rows: number;
  setAsciiChars(value: string): void;
  setColumns(value: number): void;
  setMode(value: AsciiMode): void;
  setRows(value: number): void;
  setShowControls(value: boolean): void;
  showControls: boolean;
}

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function resolveCssColor(
  element: HTMLElement | null,
  probe: HTMLElement | null,
  value: string,
  property: "color" | "backgroundColor",
): string {
  if (value.trim().startsWith("var(") && probe != null) {
    probe.style[property] = value;
    const resolved = getComputedStyle(probe)[property];
    if (resolved) return resolved;
  }
  if (value) return value;
  if (element == null) return "";
  let resolved = getComputedStyle(element)[property];
  if (
    (resolved === "rgba(0, 0, 0, 0)" || resolved === "transparent") &&
    element.parentElement != null
  ) {
    resolved = getComputedStyle(element.parentElement)[property];
  }
  return resolved;
}

function AsciiCanvas({
  lines,
  columns,
  rows,
  scale = 0.75,
  foregroundColor = "var(--color-border)",
  backgroundColor = "var(--color-surface-secondary)",
  autoCover = false,
}: AsciiCanvasProps): unknown {
  initializeAsciiCanvas();
  const hostRef = React.useRef<HTMLElement | null>(null);
  const wrapperRef = React.useRef<HTMLElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const probeRef = React.useRef<HTMLElement | null>(null);
  const linesRef = React.useRef(lines);

  const draw = React.useCallback(() => {
    const host = hostRef.current;
    if (host == null) return;
    if (canvasRef.current == null) {
      const canvas = document.createElement("canvas");
      canvas.style.display = "block";
      canvas.style.imageRendering = "crisp-edges";
      const probe = document.createElement("div");
      probe.style.display = "none";
      host.append(canvas, probe);
      canvasRef.current = canvas;
      probeRef.current = probe;
    }
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (context == null) return;
    const fontSize = 12;
    context.font = fontSize + "px monospace";
    const metrics = context.measureText("M");
    const cellWidth = Math.max(1, Math.round(metrics.width));
    const cellHeight = Math.max(
      1,
      Math.round(
        (metrics.actualBoundingBoxAscent || fontSize) +
          (metrics.actualBoundingBoxDescent || Math.ceil(fontSize * 0.3)),
      ),
    );
    let appliedScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    if (autoCover && wrapperRef.current?.parentElement != null) {
      const bounds = wrapperRef.current.parentElement.getBoundingClientRect();
      appliedScale = Math.max(
        bounds.width / Math.max(1, columns * cellWidth),
        bounds.height / Math.max(1, rows * cellHeight),
      );
      if (!Number.isFinite(appliedScale) || appliedScale <= 0) appliedScale = 1;
      else appliedScale *= 1.02;
    }
    const pixelRatio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const width = Math.max(1, columns * cellWidth);
    const height = Math.max(1, rows * cellHeight);
    canvas.width = Math.max(1, Math.round(width * appliedScale * pixelRatio));
    canvas.height = Math.max(1, Math.round(height * appliedScale * pixelRatio));
    canvas.style.width = width * appliedScale + "px";
    canvas.style.height = height * appliedScale + "px";
    canvas.style.borderRadius = autoCover ? "0px" : "10px";
    context.setTransform(pixelRatio * appliedScale, 0, 0, pixelRatio * appliedScale, 0, 0);
    context.imageSmoothingEnabled = false;
    const background = resolveCssColor(host, probeRef.current, backgroundColor, "backgroundColor");
    const foreground = resolveCssColor(host, probeRef.current, foregroundColor, "color");
    if (background) {
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
    }
    if (foreground) context.fillStyle = foreground;
    context.textBaseline = "top";
    context.font = fontSize + "px monospace";
    for (let row = 0; row < Math.min(rows, linesRef.current.length); row += 1) {
      const line = linesRef.current[row] ?? "";
      if (line) context.fillText(line, 0, row * cellHeight);
    }
  }, [autoCover, backgroundColor, columns, foregroundColor, rows, scale]);

  React.useEffect(() => {
    linesRef.current = lines;
    requestAnimationFrame(() => requestAnimationFrame(draw));
  }, [draw, lines]);
  React.useEffect(() => {
    draw();
    const onResize = () => requestAnimationFrame(draw);
    if (autoCover) window.addEventListener("resize", onResize);
    return () => {
      if (autoCover) window.removeEventListener("resize", onResize);
      canvasRef.current?.remove();
      probeRef.current?.remove();
      canvasRef.current = null;
      probeRef.current = null;
    };
  }, [autoCover, draw]);

  const wrapperStyle = autoCover
    ? {
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        display: "block",
      }
    : {
        transform: "scale(" + scale + ")",
        transformOrigin: "center",
        display: "inline-block",
      };
  return jsx.jsx("div", {
    ref: wrapperRef,
    style: wrapperStyle,
    children: jsx.jsx("div", {
      ref: hostRef,
      style: {
        display: "inline-block",
        lineHeight: 1,
        borderRadius: autoCover ? 0 : 10,
      },
    }),
  });
}

function pseudoNoise(x: number, y: number, z: number, seed: number): number {
  const value = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function renderNoiseLines(
  columns: number,
  rows: number,
  chars: string,
  time: number,
  seed: number,
): string[] {
  if (!chars.length) return Array.from({ length: rows }, () => "");
  return Array.from({ length: rows }, (_, row) => {
    let line = "";
    for (let column = 0; column < columns; column += 1) {
      const intensity = (pseudoNoise(column * 0.15, row * 0.15, time, seed) + 1) / 2;
      const index = Math.max(
        0,
        Math.min(chars.length - 1, Math.round((1 - intensity) * (chars.length - 1))),
      );
      line += chars[index];
    }
    return line;
  });
}

function useAsciiEngine(options?: AsciiEngineOptions): AsciiEngineState {
  initializeAsciiEngine();
  const [mode, setMode] = React.useState<AsciiMode>(options?.initialMode ?? "noise");
  const [asciiChars, setAsciiChars] = React.useState("@%#*+=-:. ");
  const [columns, setColumns] = React.useState(options?.initialColumns ?? 50);
  const [rows, setRows] = React.useState(options?.initialRows ?? 30);
  const [lines, setLines] = React.useState<readonly string[]>([]);
  const [showControls, setShowControls] = React.useState(false);
  const seedRef = React.useRef(Date.now());

  React.useEffect(() => {
    let frame: number | null = null;
    let previous = 0;
    const render = (timestamp: number) => {
      if (!document.hidden && timestamp - previous >= 49) {
        const next =
          mode === "noise"
            ? renderNoiseLines(columns, rows, asciiChars, timestamp / 1000, seedRef.current)
            : [];
        setLines(next);
        previous = timestamp;
      }
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);
    return () => {
      if (frame != null) window.cancelAnimationFrame(frame);
    };
  }, [asciiChars, columns, mode, rows]);

  React.useEffect(() => {
    const presets = [
      "█▓▒░ ", "■□▲△●○◆◇", "⎺⎻⎼⎽⎾⎿", "o p e n a i ",
      "█▉▊▋▌▍▎▏", "█▓▒░-=:. ", "█▇▆▅▄▃▂▁", "C O D E X",
      "█■▲●◉○. ", "WMBRXVIl. ", "█#A*-. ", "●◉○· ",
    ];
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && (event.key === "/" || event.key === "?" || event.code === "Slash")) {
        event.preventDefault();
        if (!event.repeat) setMode(mode === "video" ? "noise" : "video");
        return;
      }
      if (event.metaKey && event.key === ".") {
        event.preventDefault();
        if (!event.repeat) {
          const current = Math.max(0, presets.indexOf(asciiChars));
          setAsciiChars(presets[(current + 1) % presets.length]);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [asciiChars, mode]);

  return {
    mode, setMode, asciiChars, setAsciiChars, columns, setColumns,
    rows, setRows, lines, showControls, setShowControls,
  };
}

let canvasInitialized = false;
function initializeAsciiCanvas(): void {
  if (canvasInitialized) return;
  initializeRuntimeLazy();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  canvasInitialized = true;
}

let engineInitialized = false;
function initializeAsciiEngine(): void {
  if (engineInitialized) return;
  initializeRuntimeLazy();
  React = getReactRuntime();
  engineInitialized = true;
}

export {
  initializeAsciiCanvas as i,
  useAsciiEngine as n,
  AsciiCanvas as r,
  initializeAsciiEngine as t,
};
