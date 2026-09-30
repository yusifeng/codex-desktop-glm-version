// Animated DNA helix background used by life-sciences onboarding. Release chunk: rosalind-helix-db030adb2faf.js.
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as threeCoreChunk from "@rchunk/three.core";
import * as threeModuleChunk from "@rchunk/three.module";

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
}
interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  useRef<Value>(value: Value): { current: Value };
}
interface SharedRuntime {
  I3(): JsxRuntime;
  XQ(): boolean;
  YQ(): void;
  e6(): ReactRuntime;
}
interface Vector2Like {
  x: number;
  y: number;
  lerp(target: Vector2Like, alpha: number): this;
  set(x: number, y: number): this;
}
interface ColorLike {
  b: number;
  g: number;
  r: number;
  copy(color: ColorLike): this;
}
interface Disposable {
  dispose(): void;
}
interface GeometryLike extends Disposable {
  setAttribute(name: string, attribute: unknown): this;
}
interface MaterialLike extends Disposable {
  blending: number;
  needsUpdate: boolean;
  uniforms: Record<string, { value: unknown }>;
}
interface SceneObject {
  geometry: GeometryLike;
  material: MaterialLike;
  position: { z: number };
  renderOrder: number;
  rotation: { z: number };
}
interface PointsLike extends SceneObject {
  frustumCulled: boolean;
}
interface SceneLike {
  add(object: unknown): void;
  remove(object: unknown): void;
}
interface CameraLike {
  aspect: number;
  fov: number;
  position: { z: number };
  updateProjectionMatrix(): void;
}
interface RendererLike extends Disposable {
  render(scene: SceneLike, camera: CameraLike): void;
  setClearColor(color: number, alpha: number): void;
  setPixelRatio(value: number): void;
  setSize(width: number, height: number, updateStyle: boolean): void;
}
interface ThreeCoreRuntime {
  A: new () => GeometryLike;
  H: new (color?: string) => ColorLike;
  Hi: new (options: Record<string, unknown>) => MaterialLike;
  Ii: new (
    innerRadius: number,
    outerRadius: number,
    segments: number,
  ) => GeometryLike;
  Jn: { degToRad(degrees: number): number };
  Nt: new (values: ArrayLike<number>, itemSize: number) => unknown;
  Or: new (geometry: GeometryLike, material: MaterialLike) => PointsLike;
  Qn: new (geometry: GeometryLike, material: MaterialLike) => SceneObject;
  Sr: new (
    fov: number,
    aspect: number,
    near: number,
    far: number,
  ) => CameraLike;
  Va: new (x?: number, y?: number) => Vector2Like;
  Vi: new () => SceneLike;
}
interface ThreeModuleRuntime {
  n: new (options: Record<string, unknown>) => RendererLike;
  r(): void;
}

const shared = appSharedChunk as unknown as SharedRuntime;
const core = threeCoreChunk as unknown as ThreeCoreRuntime;
const three = threeModuleChunk as unknown as ThreeModuleRuntime;
void runtimeChunk;

const FRAME_INTERVAL = 1_000 / 30;
const FIELD_OF_VIEW = 39;
const MAX_PIXEL_RATIO = 1.75;
const HELIX_SAMPLES = 720;
const VERTEX_SHADER = `
  attribute float aPhase;
  uniform float uTime;
  uniform float uMotion;
  uniform float uPointSize;
  uniform vec2 uPointer;
  varying float vGlow;
  void main() {
    vec3 animated = position;
    float pulse = sin(aPhase * 2.0 + uTime * 0.7) * 0.035 * uMotion;
    animated.xy += normalize(animated.xy + vec2(0.0001)) * pulse;
    animated.xy += uPointer * 0.045 * uMotion;
    vec4 viewPosition = modelViewMatrix * vec4(animated, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uPointSize * (12.0 / max(1.0, -viewPosition.z));
    vGlow = 0.55 + 0.45 * sin(aPhase + uTime * 0.25);
  }
`;
const FRAGMENT_SHADER = `
  uniform vec3 uForeground;
  uniform float uOpacity;
  varying float vGlow;
  void main() {
    vec2 point = gl_PointCoord - vec2(0.5);
    float distanceFromCenter = length(point);
    if (distanceFromCenter > 0.5) discard;
    float alpha = smoothstep(0.5, 0.05, distanceFromCenter) * (0.35 + vGlow * 0.65);
    gl_FragColor = vec4(uForeground, alpha * uOpacity);
  }
`;

function createHelixGeometry(width: number, height: number): GeometryLike {
  const positions: number[] = [];
  const phases: number[] = [];
  const radius = Math.min(width * 0.28, height * 0.38);
  const span = Math.max(width * 1.3, 12);
  const turns = Math.max(3.5, span / Math.max(radius * 1.8, 1));
  for (let index = 0; index < HELIX_SAMPLES; index += 1) {
    const progress = index / (HELIX_SAMPLES - 1);
    const x = (progress - 0.5) * span;
    const phase = progress * Math.PI * 2 * turns;
    const y = Math.sin(phase) * radius;
    const z = Math.cos(phase) * 1.6;
    positions.push(x, y, z, x, -y, -z);
    phases.push(phase, phase + Math.PI);
    if (index % 18 === 0) {
      for (let bond = 1; bond < 7; bond += 1) {
        const mix = bond / 7;
        positions.push(x, y + (-y - y) * mix, z + (-z - z) * mix);
        phases.push(phase + mix * Math.PI);
      }
    }
  }
  const geometry = new core.A();
  geometry.setAttribute(
    "position",
    new core.Nt(new Float32Array(positions), 3),
  );
  geometry.setAttribute("aPhase", new core.Nt(new Float32Array(phases), 1));
  return geometry;
}

function focusState(
  seconds: number,
  staticFrame: boolean,
): { fov: number; opacity: number; rotation: number } {
  if (staticFrame) return { fov: FIELD_OF_VIEW, opacity: 1, rotation: 0.12 };
  const intro = Math.min(1, seconds / 1.25);
  const eased = intro * intro * (3 - 2 * intro);
  return {
    fov: FIELD_OF_VIEW + (1 - eased) * 4,
    opacity: 0.15 + eased * 0.85,
    rotation: Math.sin(seconds * 0.12) * 0.08,
  };
}

class HelixRenderer {
  private animationFrame: number | null = null;
  private readonly camera = new core.Sr(FIELD_OF_VIEW, 1, 0.1, 100);
  private elapsedSeconds = 0;
  private geometry: GeometryLike | null = null;
  private lastFrameTime = 0;
  private readonly material: MaterialLike;
  private particles: PointsLike | null = null;
  private readonly pointer = new core.Va();
  private readonly renderer: RendererLike;
  private resizeObserver: ResizeObserver | null = null;
  private readonly scene = new core.Vi();
  private readonly targetPointer = new core.Va();
  private themeObserver: MutationObserver | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    context: WebGL2RenderingContext,
  ) {
    this.renderer = new three.n({
      alpha: true,
      antialias: true,
      canvas,
      context,
      powerPreference: "low-power",
    });
    this.renderer.setClearColor(0, 0);
    this.camera.position.z = 10;
    this.material = new core.Hi({
      blending: 1,
      depthWrite: false,
      transparent: true,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uForeground: { value: new core.H() },
        uMotion: { value: 1 },
        uOpacity: { value: 1 },
        uPointSize: { value: 2.9 },
        uPointer: { value: this.pointer },
        uTime: { value: 0 },
      },
    });
  }

  start(animate: boolean): void {
    this.material.uniforms.uMotion.value = animate ? 1 : 0;
    this.resize();
    this.applyFocus(0, !animate);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.resize);
      this.resizeObserver.observe(this.canvas);
    }
    if (typeof MutationObserver !== "undefined") {
      this.themeObserver = new MutationObserver(this.refreshForeground);
      this.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme", "style"],
      });
      this.themeObserver.observe(this.canvas, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }
    if (animate) {
      window.addEventListener("pointermove", this.handlePointerMove, {
        passive: true,
      });
      window.addEventListener("pointerleave", this.handlePointerLeave);
      document.addEventListener("visibilitychange", this.handleVisibility);
      this.animationFrame = window.requestAnimationFrame(this.animate);
    }
  }

  dispose(): void {
    if (this.animationFrame != null)
      window.cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.themeObserver?.disconnect();
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerleave", this.handlePointerLeave);
    document.removeEventListener("visibilitychange", this.handleVisibility);
    this.geometry?.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }

  private readonly resize = (): void => {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width === 0 || height === 0) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    const visibleHeight =
      2 * Math.tan(core.Jn.degToRad(FIELD_OF_VIEW / 2)) * 10;
    const visibleWidth = visibleHeight * this.camera.aspect;
    this.rebuildGeometry(visibleWidth, visibleHeight);
  };

  private rebuildGeometry(width: number, height: number): void {
    if (this.particles != null) this.scene.remove(this.particles);
    this.geometry?.dispose();
    this.geometry = createHelixGeometry(width, height);
    this.particles = new core.Or(this.geometry, this.material);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);
    this.refreshForeground();
  }

  private readonly refreshForeground = (): void => {
    const color = new core.H(window.getComputedStyle(this.canvas).color);
    const foreground = this.material.uniforms.uForeground.value as ColorLike;
    foreground.copy(color);
    const isLight = (color.r + color.g + color.b) / 3 > 0.5;
    const blending = isLight ? 2 : 1;
    if (this.material.blending !== blending) {
      this.material.blending = blending;
      this.material.needsUpdate = true;
    }
    this.renderer.render(this.scene, this.camera);
  };

  private readonly animate = (timestamp: number): void => {
    if (document.visibilityState === "hidden") {
      this.animationFrame = null;
      this.lastFrameTime = 0;
      return;
    }
    if (timestamp - this.lastFrameTime >= FRAME_INTERVAL) {
      if (this.lastFrameTime !== 0)
        this.elapsedSeconds += Math.min(
          (timestamp - this.lastFrameTime) / 1_000,
          0.1,
        );
      this.lastFrameTime = timestamp;
      this.pointer.lerp(this.targetPointer, 0.065);
      this.material.uniforms.uTime.value = this.elapsedSeconds;
      this.applyFocus(this.elapsedSeconds, false);
      this.renderer.render(this.scene, this.camera);
    }
    this.animationFrame = window.requestAnimationFrame(this.animate);
  };

  private applyFocus(seconds: number, staticFrame: boolean): void {
    const state = focusState(seconds, staticFrame);
    this.material.uniforms.uOpacity.value = state.opacity;
    if (this.camera.fov !== state.fov) {
      this.camera.fov = state.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const bounds = this.canvas.getBoundingClientRect();
    this.targetPointer.set(
      ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1,
      1 - ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 2,
    );
  };
  private readonly handlePointerLeave = (): void => {
    this.targetPointer.set(0, 0);
  };
  private readonly handleVisibility = (): void => {
    if (document.visibilityState !== "hidden" && this.animationFrame == null)
      this.animationFrame = window.requestAnimationFrame(this.animate);
  };
}

let React: ReactRuntime;
let jsx: JsxRuntime;
function initialize(): void {
  shared.YQ();
  React = shared.e6();
  three.r();
  jsx = shared.I3();
}
initialize();

function LifeSciencesHelixBackground(props: {
  className?: string;
  disableAnimation?: boolean;
  disableRendering?: boolean;
}): unknown {
  const canvas = React.useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = shared.XQ() === true;
  React.useEffect(() => {
    if (props.disableRendering) return;
    const element = canvas.current;
    if (element == null) return;
    const context = element.getContext("webgl2", {
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    if (context == null) return;
    const renderer = new HelixRenderer(element, context);
    renderer.start(!reducedMotion && props.disableAnimation !== true);
    return () => renderer.dispose();
  }, [props.disableAnimation, props.disableRendering, reducedMotion]);
  return jsx.jsx("canvas", {
    ref: canvas,
    "aria-hidden": "true",
    className: props.className,
  });
}

export { LifeSciencesHelixBackground };
