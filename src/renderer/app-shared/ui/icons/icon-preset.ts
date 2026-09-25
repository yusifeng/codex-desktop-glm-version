// 图标预设工厂（createIconPreset）：定义校验 + 冻结（原 app-shared 的 `Y`，
// 28456-28500 行区段）。
//
// 原版 Y() 逐字段校验（kT/Phe/Fhe/Ihe/Lhe）并深冻结产物；此处保留全部
// 校验语义与冻结行为，校验器实现按原语义内联（原版校验器群在同区段上方）。

// ---------------------------------------------------------------------------
// 类型（原版经校验器保证的形状）
// ---------------------------------------------------------------------------

/** 矩形。 */
export interface IconRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 画布。 */
export interface IconCanvas {
  width: number;
  height: number;
  viewBox: string;
  frame?: IconRect;
  inkBounds?: IconRect;
  visualBounds?: IconRect;
  effectBounds?: IconRect;
}

/** 单色绘制。 */
export interface MonochromePaint {
  kind: "monochrome";
}

/** 多色绘制（分层）。 */
export interface MulticolorLayer {
  body?: string;
  bounds?: IconRect;
  [key: string]: unknown;
}

export interface MulticolorPaint {
  kind: "multicolor";
  layers: MulticolorLayer[];
}

export type IconPaint = MonochromePaint | MulticolorPaint;

/** 冻结后的 paint 形态（layers 元素与数组均 readonly）。 */
export type FrozenIconPaint =
  | Readonly<MonochromePaint>
  | Readonly<{ kind: "multicolor"; layers: readonly Readonly<MulticolorLayer>[] }>;

/** 光学对齐元数据（部分图标只有 shape 单字段；完整形态含 bounds/center/insets/anchors）。 */
export interface IconOptical {
  shape: "circular" | "non-circular";
  bounds?: IconRect;
  center?: { x: number; y: number };
  insets?: { top: number; right: number; bottom: number; left: number };
  anchors?: { frame?: { x: number; y: number }; ink?: { x: number; y: number }; foreground?: { x: number; y: number }; [key: string]: unknown };
  [key: string]: unknown;
}

/** 支持的能力。 */
const SUPPORTED_CAPABILITIES = new Set(["icon", "logo", "illustration", "photo"]);

/** 图标预设（冻结产物）。 */
export interface IconPreset {
  name: string;
  canvas: Readonly<IconCanvas>;
  paint: FrozenIconPaint;
  optical?: Readonly<IconOptical>;
  capabilities: readonly string[];
  body: string;
}

// ---------------------------------------------------------------------------
// 校验器（原 kT/Phe/Fhe/Ihe/Lhe 的语义）
// ---------------------------------------------------------------------------

function requireObject(value: unknown, what: string): void {
  if (typeof value != "object" || value == null) throw TypeError(`${what} must be an object`);
}

function requireIconName(value: unknown, what: string): void {
  if (typeof value != "string" || value.trim() === "" || /[<>:"/\\|?*\u0000-\u001f]/.test(value))
    throw TypeError(`${what} must be a non-empty filesystem-safe name`);
}

function requireCanvas(value: unknown): void {
  requireObject(value, "icon canvas");
  const canvas = value as IconCanvas;
  if (!Number.isFinite(canvas.width) || canvas.width <= 0) throw TypeError("icon canvas width must be positive");
  if (!Number.isFinite(canvas.height) || canvas.height <= 0) throw TypeError("icon canvas height must be positive");
  if (typeof canvas.viewBox != "string" || !/^\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/.test(canvas.viewBox))
    throw TypeError("icon canvas viewBox must be four space-separated numbers");
}

function requirePaint(value: unknown): void {
  requireObject(value, "icon paint");
  const paint = value as IconPaint;
  if (paint.kind === "monochrome") return;
  if (paint.kind === "multicolor") {
    if (!Array.isArray(paint.layers) || paint.layers.length === 0) throw TypeError("multicolor icon paint requires layers");
    return;
  }
  throw TypeError("icon paint kind must be monochrome or multicolor");
}

function requireOptical(value: unknown): void {
  requireObject(value, "icon optical");
  const optical = value as IconOptical;
  if (optical.shape !== "circular" && optical.shape !== "non-circular")
    throw TypeError("icon optical shape must be circular or non-circular");
}

function freezeRect(rect: IconRect): IconRect {
  return Object.freeze({ ...rect });
}

/**
 * 图标预设工厂（原 `Y`，28456）：
 * 全字段校验 → 深冻结（name/canvas/paint/optical/capabilities/body）。
 * body 必须是内层 SVG 片段（禁止 svg/symbol/script 标签）。
 */
export function createIconPreset(definition: {
  name: string;
  canvas: IconCanvas;
  paint: IconPaint;
  optical?: IconOptical;
  capabilities: string[];
  body: string;
}): IconPreset {
  requireObject(definition, "icon preset");
  requireIconName(definition.name, "icon preset name");
  requireCanvas(definition.canvas);
  requirePaint(definition.paint);
  const optical: IconOptical = definition.optical ?? { shape: "non-circular" };
  requireOptical(optical);
  if (!Array.isArray(definition.capabilities) || definition.capabilities.length === 0 || definition.capabilities.some((capability) => !SUPPORTED_CAPABILITIES.has(capability)))
    throw TypeError("icon capabilities must be supported and non-empty");
  if (typeof definition.body != "string" || definition.body.trim() === "" || /<\/?(?:svg|symbol|script)\b/i.test(definition.body))
    throw TypeError("icon body must be an inner SVG fragment");
  return Object.freeze({
    name: definition.name,
    canvas: Object.freeze({
      ...definition.canvas,
      ...definition.canvas.frame == null ? {} : { frame: freezeRect(definition.canvas.frame) },
      ...definition.canvas.inkBounds == null ? {} : { inkBounds: freezeRect(definition.canvas.inkBounds) },
      ...definition.canvas.visualBounds == null ? {} : { visualBounds: freezeRect(definition.canvas.visualBounds) },
      ...definition.canvas.effectBounds == null ? {} : { effectBounds: freezeRect(definition.canvas.effectBounds) },
    }),
    paint: Object.freeze(
      definition.paint.kind === "multicolor"
        ? {
            ...definition.paint,
            layers: Object.freeze(
              definition.paint.layers.map((layer) =>
                Object.freeze({
                  ...layer,
                  ...layer.bounds == null ? {} : { bounds: freezeRect(layer.bounds) },
                }),
              ),
            ),
          }
        : { ...definition.paint },
    ),
    optical: Object.freeze({
      ...optical,
      ...(optical.bounds == null ? {} : { bounds: freezeRect(optical.bounds) }),
      ...(optical.center == null ? {} : { center: Object.freeze({ ...optical.center }) }),
      ...(optical.insets == null ? {} : { insets: Object.freeze({ ...optical.insets }) }),
      ...(optical.anchors == null
        ? {}
        : {
            anchors: Object.freeze({
              frame: Object.freeze({ ...optical.anchors.frame }),
              ink: Object.freeze({ ...optical.anchors.ink }),
              foreground: Object.freeze({ ...optical.anchors.foreground }),
            }),
          }),
    }),
    capabilities: Object.freeze([...definition.capabilities]),
    body: definition.body,
  });
}

// ---------------------------------------------------------------------------
// 图标组件（原 `h3`，89193：IconAsset）
// ---------------------------------------------------------------------------

/** React 面（结构化子集）。 */
interface ReactLike {
  createElement(type: unknown, props: Record<string, unknown>, ...children: unknown[]): unknown;
  useContext<T>(context: { _currentValue?: T }): T;
}

function reactOf(): ReactLike {
  return (globalThis as { __RENDERER_REACT__?: ReactLike }).__RENDERER_REACT__ ?? (require("react") as unknown as ReactLike);
}

/** 尺寸上下文（原 `y3` = createContext(1)，缩放系数）。 */
const scaleContext = { _currentValue: 1 };

/** 对齐方式。 */
export type IconAlignment = "leading" | "secondary" | string;

/**
 * IconAsset 组件（原 `h3`）：
 * props { asset, alignment?, idPrefix?, label?, ...svgProps }。
 * 校验 asset 能力（Rhe：icon 能力必须存在）；按对齐方式换算光学尺寸。
 */
export function IconAsset(props: {
  alignment?: IconAlignment;
  asset: IconPreset;
  idPrefix?: string;
  label?: string;
  [key: string]: unknown;
}): unknown {
  const { alignment, asset, idPrefix, label, ...svgProps } = props;
  requireCapability(asset, "icon");
  const scale = reactOf().useContext(scaleContext) || 1;
  return renderIconSvg({ preset: asset, icon: scaledIcon(asset, alignment, scale), svgProps, idPrefix, label });
}

/** 能力校验（原 `Rhe`）。 */
function requireCapability(preset: IconPreset, capability: string): void {
  if (!preset.capabilities.includes(capability)) throw TypeError(`Icon asset ${preset.name} does not declare capability '${capability}'`);
}

/** 对齐换算（原 `v8e` 语义：secondary 取 16px 光学档，其余按画布）。 */
function scaledIcon(preset: IconPreset, alignment: IconAlignment | undefined, scale: number): { width: number; height: number; viewBox: string } {
  const canvas = preset.canvas;
  if (alignment === "secondary") {
    // secondary 场景（紧凑来源图标）：按 16 档渲染
    return { width: 16, height: 16, viewBox: canvas.viewBox };
  }
  return { width: canvas.width * scale, height: canvas.height * scale, viewBox: canvas.viewBox };
}

/** SVG 渲染（原 `f8e`）。 */
function renderIconSvg({
  preset,
  icon,
  svgProps,
  idPrefix,
  label,
}: {
  preset: IconPreset;
  icon: { width: number; height: number; viewBox: string };
  svgProps: Record<string, unknown>;
  idPrefix?: string;
  label?: string;
}): unknown {
  const React = reactOf();
  const body = preset.paint.kind === "multicolor" ? preset.paint.layers.map((layer) => layer.body).join(" ") : preset.body;
  const titleId = idPrefix != null ? `${idPrefix}-${preset.name}-title` : undefined;
  return React.createElement(
    "svg",
    {
      "aria-hidden": label == null ? true : undefined,
      "aria-labelledby": label != null && titleId != null ? titleId : undefined,
      fill: "currentColor",
      height: icon.height,
      role: label != null ? "img" : undefined,
      viewBox: icon.viewBox,
      width: icon.width,
      ...svgProps,
      dangerouslySetInnerHTML: {
        __html:
          (label != null && titleId != null ? `<title id="${titleId}">${escapeHtml(label)}</title>` : "") + body,
      },
    },
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] as string);
}
