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
  bounds?: IconRect;
  color: string;
  foundationToken?: string;
  role: "accent" | "brand" | "fixed" | "foreground";
  token?: string;
  wideGamut?: string;
  wideGamutToken?: string;
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
  useId(): string;
}

function reactOf(): ReactLike {
  return (globalThis as { __RENDERER_REACT__?: ReactLike }).__RENDERER_REACT__ ?? (require("react") as unknown as ReactLike);
}

/** 对齐方式。 */
export type IconAlignment = "composite" | "foreground";

export interface IconAssetProps extends Record<string, unknown> {
  alignment?: IconAlignment;
  asset: IconPreset;
  idPrefix?: string;
  label?: string;
}

/**
 * IconAsset 组件（原 `h3`）：
 * props { asset, alignment?, idPrefix?, label?, ...svgProps }。
 * 校验 asset 能力（Rhe：icon 能力必须存在）；按对齐方式换算光学尺寸。
 */
export function IconAsset(props: IconAssetProps): unknown {
  const { alignment, asset, idPrefix, label, ...svgProps } = props;
  requireCapability(asset, "icon");
  return renderIconSvg({
    preset: asset,
    icon: resolveIconBody(asset, alignment),
    svgProps,
    idPrefix,
    label,
  });
}

/** 原 `g3` / 压缩导出 `C_`。 */
export function initializeIconAsset(): void {}

/** 能力校验（原 `Rhe`）。 */
function requireCapability(preset: IconPreset, capability: string): void {
  if (!preset.capabilities.includes(capability))
    throw TypeError(`${preset.name} does not support the ${capability} capability`);
}

interface ResolvedIconBody {
  body: string;
  style: Record<string, string>;
  supportsWideGamut: boolean;
}

function paintToken(layer: MulticolorLayer): string | undefined {
  if (layer.token != null || layer.foundationToken != null)
    return layer.token ?? layer.foundationToken;
  if (
    (layer.role === "brand" || layer.role === "fixed") &&
    layer.wideGamut != null &&
    /^#[\da-f]{6}$/iu.test(layer.color)
  ) {
    return `authored-${layer.color.slice(1).toLowerCase()}`;
  }
  return undefined;
}

function multicolorStyle(preset: IconPreset): Record<string, string> {
  if (preset.paint.kind === "monochrome") return {};
  const style: Record<string, string> = {};
  for (const layer of preset.paint.layers) {
    const token = paintToken(layer);
    if (token == null) continue;
    const normalizedToken = token.replace(/^--/u, "");
    const fallback =
      layer.foundationToken == null
        ? layer.color
        : `var(--${layer.foundationToken.replace(/^--/u, "")}, ${layer.color})`;
    const gamutFallback =
      (layer.role !== "brand" && layer.role !== "fixed") ||
      (layer.wideGamut == null && layer.wideGamutToken == null)
        ? fallback
        : `var(--icon-p3-${normalizedToken}, ${fallback})`;
    style[`--icon-${normalizedToken}`] =
      layer.token == null
        ? gamutFallback
        : `var(--${normalizedToken}, ${gamutFallback})`;
  }
  return style;
}

function multicolorBody(preset: IconPreset): string {
  if (preset.paint.kind === "monochrome") return preset.body;
  let body = preset.body;
  const semanticColors = new Set(
    preset.paint.layers
      .filter((layer) => layer.role === "foreground" || layer.role === "accent")
      .map((layer) => layer.color.toLowerCase()),
  );
  const wideGamutRules: string[] = [];
  for (const layer of preset.paint.layers) {
    const token = paintToken(layer);
    if (token == null) continue;
    const normalizedToken = token.replace(/^--/u, "");
    const attribute =
      layer.role === "brand" || layer.role === "fixed"
        ? semanticColors.has(layer.color.toLowerCase())
          ? "stop-color"
          : "fill|stroke|stop-color"
        : "fill|stroke";
    const escapedColor = layer.color.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    body = body.replaceAll(
      RegExp(`\\b(${attribute})=(["'])${escapedColor}\\2`, "giu"),
      `$1="var(--icon-${normalizedToken}, ${layer.color})"`,
    );
    if (
      (layer.role === "brand" || layer.role === "fixed") &&
      layer.wideGamut != null
    ) {
      wideGamutRules.push(
        `--icon-p3-${normalizedToken}:` +
          (layer.wideGamutToken == null
            ? layer.wideGamut
            : `var(--${layer.wideGamutToken.replace(/^--/u, "")},${layer.wideGamut})`),
      );
    }
  }
  if (wideGamutRules.length === 0) return body;
  return (
    `<style>@supports (color:color(display-p3 1 1 1)){@media (color-gamut:p3){svg[data-icon-p3="${preset.name}"]{` +
    wideGamutRules.join(";") +
    "}}}</style>" +
    body
  );
}

function canvasOverflows(preset: IconPreset): boolean {
  const frame = preset.canvas.frame;
  const bounds = preset.canvas.visualBounds;
  return (
    frame != null &&
    bounds != null &&
    (bounds.x < frame.x ||
      bounds.y < frame.y ||
      bounds.x + bounds.width > frame.x + frame.width ||
      bounds.y + bounds.height > frame.y + frame.height)
  );
}

/** 原 `v8e`/`y8e`：颜色变量替换 + 光学锚点平移。 */
function resolveIconBody(
  preset: IconPreset,
  alignment?: IconAlignment,
): ResolvedIconBody {
  let body = multicolorBody(preset);
  let overflows = canvasOverflows(preset);
  if (alignment != null) {
    const frame = preset.canvas.frame ?? {
      x: 0,
      y: 0,
      width: preset.canvas.width,
      height: preset.canvas.height,
    };
    const frameCenter = {
      x: frame.x + frame.width / 2,
      y: frame.y + frame.height / 2,
    };
    const anchor =
      alignment === "composite"
        ? (preset.optical?.anchors?.ink ?? preset.optical?.center ?? frameCenter)
        : (preset.optical?.anchors?.foreground ??
          preset.optical?.anchors?.ink ??
          preset.optical?.center ??
          frameCenter);
    const offsetX = Number((frameCenter.x - anchor.x).toFixed(6));
    const offsetY = Number((frameCenter.y - anchor.y).toFixed(6));
    if (offsetX !== 0 || offsetY !== 0) {
      body = `<g transform="translate(${offsetX} ${offsetY})">${body}</g>`;
      const bounds = preset.canvas.visualBounds;
      overflows =
        overflows ||
        bounds == null ||
        bounds.x + offsetX < frame.x ||
        bounds.y + offsetY < frame.y ||
        bounds.x + offsetX + bounds.width > frame.x + frame.width ||
        bounds.y + offsetY + bounds.height > frame.y + frame.height;
    }
  }
  return {
    body,
    style: {
      ...multicolorStyle(preset),
      ...(overflows ? { overflow: "visible" } : {}),
    },
    supportsWideGamut:
      preset.paint.kind === "multicolor" &&
      preset.paint.layers.some(
        (layer) =>
          (layer.role === "brand" || layer.role === "fixed") &&
          layer.wideGamut != null,
      ),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
}

function validateIdPrefix(value: string): void {
  if (!/^[A-Za-z_:][A-Za-z0-9_.:-]*$/.test(value))
    throw TypeError("icon idPrefix must be a non-empty SVG identifier prefix");
}

/** 原 `OT`：为 SVG body 内的本地 id、url(#id) 与 href="#id" 加前缀。 */
function prefixSvgIds(body: string, prefix?: string): string {
  const ids = new Set(
    [...body.matchAll(/(?:^|[\s<])id\s*=\s*(["'])([^"']+)\1/g)]
      .map((match) => match[2])
      .filter((id): id is string => id != null),
  );
  if (prefix == null) {
    if (ids.size > 0)
      throw TypeError("icon idPrefix is required when the SVG body contains local IDs");
    return body;
  }
  validateIdPrefix(prefix);
  let rewritten = body;
  for (const id of ids) {
    const nextId = `${prefix}-${id}`;
    const escapedId = escapeRegExp(id);
    rewritten = rewritten
      .replace(
        RegExp(`((?:^|[\\s<])id\\s*=\\s*)(["'])${escapedId}\\2`, "g"),
        (_match, lead: string, quote: string) => `${lead}${quote}${nextId}${quote}`,
      )
      .replace(
        RegExp(`(url\\(\\s*)(["']?)#${escapedId}\\2(\\s*\\))`, "g"),
        (_match, lead: string, quote: string, tail: string) =>
          `${lead}${quote}#${nextId}${quote}${tail}`,
      )
      .replace(
        RegExp(
          `((?:^|[\\s<])(?:xlink:)?href\\s*=\\s*)(["'])#${escapedId}\\2`,
          "g",
        ),
        (_match, lead: string, quote: string) =>
          `${lead}${quote}#${nextId}${quote}`,
      );
  }
  return rewritten;
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
  icon: ResolvedIconBody;
  svgProps: Record<string, unknown>;
  idPrefix?: string;
  label?: string;
}): unknown {
  const React = reactOf();
  const {
    "aria-hidden": ariaHiddenProp,
    "aria-label": ariaLabelProp,
    "aria-labelledby": ariaLabelledBy,
    className,
    focusable,
    role: roleProp,
    style,
    ...rest
  } = svgProps;
  const generatedId = React.useId();
  const ariaLabel = ariaLabelProp ?? (label == null || label === "" ? undefined : label);
  const hasAccessibleLabel =
    (ariaLabel != null && ariaLabel !== "") ||
    (ariaLabelledBy != null && ariaLabelledBy !== "");
  const ariaHidden = ariaHiddenProp ?? (!hasAccessibleLabel || undefined);
  const bodyPrefix = idPrefix ?? `${preset.name}-${generatedId}`;
  return React.createElement("svg", {
    ...rest,
    "aria-hidden": ariaHidden,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    className,
    "data-icon-p3": icon.supportsWideGamut ? preset.name : undefined,
    focusable,
    height: preset.canvas.height,
    role: roleProp ?? (hasAccessibleLabel ? "img" : undefined),
    style: { ...icon.style, ...(style as Record<string, unknown> | undefined) },
    viewBox: preset.canvas.viewBox,
    width: preset.canvas.width,
    xmlns: "http://www.w3.org/2000/svg",
    dangerouslySetInnerHTML: { __html: prefixSvgIds(icon.body, bodyPrefix) },
  });
}
