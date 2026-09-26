// app-shared Button / LoadingSpinner 基础组件。
// 对应 app-shared-7b9edc1bfb7f.js 的 n8/Qh、a8/Yh、pot/Xh、mot，
// 以及 hot/got/Z6/_ot 四组外观映射。

import { icon_spinner_rays_graded_regular_20 as spinnerRaysIcon } from "./icons/spinner-rays-graded-regular-20";

export type ButtonColor =
  | "accent"
  | "accentInverse"
  | "accentSubtle"
  | "activity"
  | "activityStop"
  | "activitySuccess"
  | "cardAction"
  | "composerPrimary"
  | "composerSurface"
  | "conversationFollowup"
  | "danger"
  | "dangerSolid"
  | "ghost"
  | "ghostAccent"
  | "ghostActive"
  | "ghostMuted"
  | "ghostOutline"
  | "ghostSecondary"
  | "ghostTertiary"
  | "ghostUserMessage"
  | "headerUpgrade"
  | "mediaOverlay"
  | "mediaSolid"
  | "mediaSubtle"
  | "outline"
  | "outlineActive"
  | "outlineCard"
  | "outlineGhost"
  | "outlineGhostMuted"
  | "outlineSurface"
  | "primary"
  | "secondary"
  | "segmentedInsetSelected"
  | "segmentedSelected"
  | "selectTrigger"
  | "shareDestination"
  | "successSolid"
  | "tinted"
  | "upgrade";

export type ButtonSize =
  | "actionSm"
  | "activityOption"
  | "auth"
  | "beaconAction"
  | "beaconCarousel"
  | "cardAction"
  | "compact"
  | "composer"
  | "composerAuxiliary"
  | "composerPermissions"
  | "composerPill"
  | "composerSm"
  | "composerSmLabel"
  | "composerWithBadge"
  | "conversationFollowup"
  | "default"
  | "detailAction"
  | "dialog"
  | "dialogAction"
  | "dialogGhost"
  | "dragHandle"
  | "entityHeader"
  | "entityRowAction"
  | "formatToolbar"
  | "formatToolbarIcon"
  | "giftCard"
  | "headerUpsell"
  | "icon"
  | "iconCircle"
  | "iconCircleSm"
  | "iconLarge"
  | "iconMd"
  | "iconSm"
  | "imageToolbar"
  | "inline"
  | "inputControl"
  | "inputIcon"
  | "inputSegment"
  | "inputSelect"
  | "large"
  | "medium"
  | "menuRow"
  | "paginationDot"
  | "panelAction"
  | "promotionalAction"
  | "promotionalLink"
  | "settingsSelect"
  | "shareDestination"
  | "surveyOption"
  | "tabStripAction"
  | "toolbar";

export type ButtonRadius =
  "default" | "extraLarge" | "full" | "large" | "small";
export type ButtonFocusRing = "default" | "inset" | "none";
export type ButtonContentLayout = "balanced" | "default";
export type SpinnerVariant = "default" | "rays";

export interface ButtonInteractionEvent {
  key?: string;
  preventDefault(): void;
}

export interface ButtonProps extends Record<string, unknown> {
  as?: "a" | "button";
  allowShrink?: boolean;
  "aria-disabled"?: boolean;
  children?: unknown;
  className?: string;
  color?: ButtonColor;
  contentLayout?: ButtonContentLayout;
  disabled?: boolean;
  focusRing?: ButtonFocusRing;
  href?: string;
  loading?: boolean;
  onAuxClick?: (event: ButtonInteractionEvent) => void;
  onClick?: (event: ButtonInteractionEvent) => void;
  onKeyDown?: (event: ButtonInteractionEvent) => void;
  radius?: ButtonRadius;
  role?: string;
  size?: ButtonSize;
  spinnerVariant?: SpinnerVariant;
  tabIndex?: number;
  type?: "button" | "reset" | "submit";
  uniform?: boolean;
}

export interface LoadingSpinnerProps extends Record<string, unknown> {
  as?: string | ((props: Record<string, unknown>) => unknown);
  animationDurationMs?: number;
  className?: string;
  containerClassName?: string;
  Icon?: (props: Record<string, unknown>) => unknown;
  variant?: SpinnerVariant;
}

interface JsxRuntimeLike {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

interface ReactLike {
  useState<T>(initial: T | (() => T)): [T, (value: T) => void];
}

function jsxRuntimeOf(): JsxRuntimeLike {
  return (
    (globalThis as { __RENDERER_JSX_RUNTIME__?: JsxRuntimeLike })
      .__RENDERER_JSX_RUNTIME__ ??
    (require("react/jsx-runtime") as JsxRuntimeLike)
  );
}

function reactOf(): ReactLike {
  return (
    (globalThis as { __RENDERER_REACT__?: ReactLike }).__RENDERER_REACT__ ??
    (require("react") as ReactLike)
  );
}

type ClassValue = string | false | null | undefined;

/** app-shared m4（内部 J）的本地等价子集。 */
function classNames(...values: ClassValue[]): string {
  return values
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    )
    .join(" ");
}

const BUTTON_RADIUS_BY_SIZE: Record<ButtonSize, string> = {
  activityOption: "rounded-full",
  auth: "rounded-full",
  giftCard: "rounded-full",
  compact: "rounded-button-action",
  cardAction: "rounded-full",
  default: "rounded-full",
  actionSm: "rounded-full",
  dialog: "rounded-full",
  dialogAction: "rounded-full",
  panelAction: "rounded-full",
  detailAction: "rounded-full",
  beaconAction: "rounded-full",
  promotionalAction: "rounded-full",
  promotionalLink: "rounded-full",
  beaconCarousel: "rounded-full",
  conversationFollowup: "rounded-full",
  paginationDot: "rounded-full",
  dialogGhost: "rounded-button-action",
  entityHeader: "rounded-xl",
  entityRowAction: "rounded-full",
  dragHandle: "rounded-lg",
  formatToolbar: "rounded-md",
  formatToolbarIcon: "rounded-md",
  icon: "rounded-full electron:rounded-md",
  iconCircle: "rounded-full",
  iconCircleSm: "rounded-full",
  iconLarge: "rounded-2xl",
  iconMd: "rounded-md",
  iconSm: "rounded-md",
  inputSegment: "rounded-none",
  inputSelect: "rounded-none",
  inputControl: "rounded-xl",
  imageToolbar: "rounded-full",
  inline: "rounded-none",
  inputIcon: "rounded-s-lg rounded-e-none",
  large: "rounded-full",
  medium: "rounded-button-action",
  menuRow: "rounded-lg",
  settingsSelect: "rounded-md",
  composer: "rounded-full",
  composerWithBadge: "rounded-full",
  composerPill: "rounded-full",
  composerAuxiliary: "rounded-full",
  composerPermissions: "rounded-full",
  composerSm: "rounded-full",
  composerSmLabel: "rounded-full",
  shareDestination: "rounded-full",
  surveyOption: "rounded-lg",
  tabStripAction: "rounded-lg",
  toolbar: "rounded-button-toolbar",
  headerUpsell: "rounded-md",
};

const BUTTON_RADIUS_CLASSES: Record<
  Exclude<ButtonRadius, "default">,
  string
> = {
  full: "rounded-full",
  extraLarge: "rounded-2xl",
  large: "rounded-lg",
  small: "rounded-md",
};

const BUTTON_COLOR_CLASSES: Record<ButtonColor, string> = {
  activity:
    "border-transparent bg-activity-control text-activity-control not-disabled:not-aria-disabled:hover:bg-activity-control-hover not-disabled:not-aria-disabled:hover:text-activity-control-active not-disabled:not-aria-disabled:data-[native-hovered=true]:bg-activity-control-hover not-disabled:not-aria-disabled:data-[native-hovered=true]:text-activity-control-active aria-pressed:bg-activity-control-hover aria-pressed:text-activity-control-active",
  activityStop:
    "border-transparent bg-activity-control text-activity-control not-disabled:not-aria-disabled:hover:bg-activity-stop-hover not-disabled:not-aria-disabled:hover:text-activity-control-active not-disabled:not-aria-disabled:data-[native-hovered=true]:bg-activity-stop-hover not-disabled:not-aria-disabled:data-[native-hovered=true]:text-activity-control-active",
  activitySuccess:
    "border-transparent bg-[light-dark(var(--green-50),var(--green-900))] text-[color:light-dark(var(--green-400),var(--green-300))] not-disabled:not-aria-disabled:hover:bg-[light-dark(var(--green-300),var(--green-500))] not-disabled:not-aria-disabled:hover:text-white not-disabled:not-aria-disabled:data-[native-hovered=true]:bg-[light-dark(var(--green-300),var(--green-500))] not-disabled:not-aria-disabled:data-[native-hovered=true]:text-white",
  accent:
    "bg-info-solid not-disabled:not-aria-disabled:hover:bg-info-solid/90 data-[state=open]:bg-info-solid/90 text-info-solid border-transparent",
  accentInverse:
    "bg-info-solid not-disabled:not-aria-disabled:hover:bg-info-solid/90 data-[state=open]:bg-info-solid/90 text-inverse border-transparent",
  accentSubtle:
    "bg-text-info/10 not-disabled:not-aria-disabled:hover:bg-text-info/15 data-[state=open]:bg-text-info/15 text-info border-transparent",
  headerUpgrade:
    "border-transparent bg-transparent text-info-ghost not-disabled:not-aria-disabled:hover:bg-info-ghost-hover focus-visible:bg-info-ghost-hover data-[state=open]:bg-info-ghost-hover",
  upgrade:
    "border-transparent bg-[light-dark(var(--blue-a25),--alpha(var(--blue-100)/15%))] text-[color:light-dark(var(--blue-500),var(--blue-50))] not-disabled:not-aria-disabled:hover:bg-[light-dark(--alpha(var(--blue-400)/9%),--alpha(var(--blue-100)/20%))] data-[state=open]:bg-[light-dark(--alpha(var(--blue-400)/9%),--alpha(var(--blue-100)/20%))]",
  composerPrimary:
    "bg-composer-primary not-disabled:not-aria-disabled:hover:bg-composer-primary/90 data-[state=open]:bg-composer-primary/90 text-composer-primary border-transparent",
  composerSurface:
    "border-transparent bg-(--color-background-primary-soft)/90 text-default shadow-(--elevation-composer) backdrop-blur-lg dark:bg-surface-elevated dark:shadow-(--elevation-composer-dark) not-disabled:not-aria-disabled:hover:bg-primary-ghost-hover data-[state=open]:bg-primary-ghost-hover light:[:where(:root[data-codex-os=win32].electron-opaque)_&]:bg-(--color-background-primary-soft) [:where(:root[data-codex-os=win32].electron-opaque)_&]:backdrop-blur-none forced-colors:shadow-none forced-colors:outline forced-colors:outline-[CanvasText]",
  cardAction:
    "border-subtle bg-surface-card text-default not-disabled:not-aria-disabled:active:opacity-80 disabled:opacity-50 aria-disabled:opacity-50",
  successSolid:
    "bg-success-solid not-disabled:not-aria-disabled:hover:bg-success-solid-hover data-[state=open]:bg-success-solid-hover text-success-solid border-transparent",
  danger:
    "bg-chart-red/10 not-disabled:not-aria-disabled:hover:bg-chart-red/20 text-chart-red border-transparent",
  dangerSolid:
    "bg-danger-solid not-disabled:not-aria-disabled:hover:bg-danger-solid/90 text-danger-solid border-transparent",
  ghost:
    "text-tertiary not-disabled:not-aria-disabled:hover:bg-primary-ghost-hover data-[state=open]:bg-primary-ghost-hover border-transparent",
  ghostAccent:
    "text-info not-disabled:not-aria-disabled:hover:bg-primary-ghost-hover data-[state=open]:bg-primary-ghost-hover border-transparent",
  ghostOutline:
    "border-transparent text-tertiary not-disabled:not-aria-disabled:hover:border-default not-disabled:not-aria-disabled:hover:bg-surface not-disabled:not-aria-disabled:hover:text-default not-disabled:not-aria-disabled:hover:shadow-sm data-[state=open]:border-default data-[state=open]:bg-surface data-[state=open]:text-default data-[state=open]:shadow-sm",
  ghostSecondary:
    "text-secondary not-disabled:not-aria-disabled:hover:bg-primary-ghost-hover data-[state=open]:bg-primary-ghost-hover border-transparent",
  outlineActive:
    "border-default bg-text/10 not-disabled:not-aria-disabled:hover:bg-text/15 data-[state=open]:bg-text/15 border",
  ghostActive:
    "text-default not-disabled:not-aria-disabled:hover:bg-primary-ghost-hover data-[state=open]:bg-primary-ghost-hover border-transparent",
  ghostMuted:
    "not-disabled:not-aria-disabled:hover:bg-transparent data-[state=open]:bg-transparent hover:text-default border-transparent",
  ghostUserMessage:
    "text-user-message not-disabled:not-aria-disabled:hover:bg-transparent data-[state=open]:bg-transparent border-transparent",
  ghostTertiary:
    "text-tertiary not-disabled:not-aria-disabled:hover:bg-transparent data-[state=open]:bg-transparent not-disabled:not-aria-disabled:hover:text-default border-transparent",
  mediaSolid:
    "border-transparent bg-media-foreground text-media-background not-disabled:not-aria-disabled:hover:bg-media-foreground/90 data-[state=open]:bg-media-foreground/90",
  mediaSubtle:
    "border-media-foreground/20 bg-media-control-background text-media-foreground not-disabled:not-aria-disabled:hover:bg-media-control-hover data-[state=open]:bg-media-control-hover",
  mediaOverlay:
    "border-transparent bg-media-background/15 text-media-foreground backdrop-blur-md not-disabled:not-aria-disabled:hover:bg-media-background/30 focus:bg-media-background/30 data-[state=open]:bg-media-background/30",
  outline:
    "border-default bg-primary-soft-alpha not-disabled:not-aria-disabled:hover:bg-primary-ghost-hover data-[state=open]:bg-primary-ghost-hover border",
  outlineSurface:
    "border-default bg-surface not-disabled:not-aria-disabled:hover:bg-primary-ghost-hover data-[state=open]:bg-primary-ghost-hover border",
  outlineCard:
    "border-button-outline bg-surface-card text-button-outline not-disabled:not-aria-disabled:hover:bg-button-outline-hover data-[state=open]:bg-button-outline-hover not-disabled:not-aria-disabled:active:opacity-80",
  conversationFollowup:
    "border-default bg-surface text-default shadow-sm not-disabled:not-aria-disabled:hover:bg-primary-ghost-hover data-[state=open]:bg-primary-ghost-hover border",
  selectTrigger:
    "border-default bg-surface not-disabled:not-aria-disabled:hover:bg-primary-ghost-hover data-[state=open]:bg-surface-elevated-secondary data-[state=open]:rounded-t-2xl data-[state=open]:rounded-b-none data-[state=open]:border-b-transparent border",
  outlineGhost:
    "border-default bg-transparent text-default not-disabled:not-aria-disabled:hover:bg-primary-ghost-hover data-[state=open]:bg-primary-ghost-hover",
  outlineGhostMuted:
    "border-default bg-transparent text-tertiary not-disabled:not-aria-disabled:hover:bg-primary-ghost-hover data-[state=open]:bg-primary-ghost-hover",
  primary:
    "border-default bg-primary-solid not-disabled:not-aria-disabled:hover:bg-text/80 data-[state=open]:bg-text/80 text-primary-solid",
  shareDestination:
    "border-transparent bg-transparent text-secondary not-disabled:not-aria-disabled:hover:bg-transparent [&>.share-destination-icon]:bg-text/5 [&>.share-destination-icon]:text-default not-disabled:not-aria-disabled:hover:[&>.share-destination-icon]:bg-text/10 not-disabled:not-aria-disabled:active:[&>.share-destination-icon]:bg-text/10",
  secondary:
    "text-default bg-text/5 not-disabled:not-aria-disabled:hover:bg-text/10 data-[state=open]:bg-text/10 border-transparent",
  tinted:
    "bg-current/10 not-disabled:not-aria-disabled:hover:bg-current/15 data-[state=open]:bg-current/15 border-transparent",
  segmentedSelected:
    "text-default bg-segmented-selected not-disabled:not-aria-disabled:hover:bg-segmented-selected-hover data-[state=open]:bg-segmented-selected-hover border-transparent",
  segmentedInsetSelected:
    "border-transparent bg-surface text-default shadow-sm not-disabled:not-aria-disabled:hover:bg-surface not-disabled:not-aria-disabled:active:bg-surface data-[state=open]:bg-surface",
};

const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  activityOption: "px-4 py-2 text-[14px] leading-4 font-medium",
  auth: "min-h-13 justify-center gap-2 px-5 py-3 text-base leading-6 font-medium",
  giftCard: "h-12 justify-center px-6 text-base leading-[26px] font-medium",
  compact: "h-6 px-2 py-0 text-xs leading-4",
  cardAction:
    "h-7 min-h-7 shrink-0 justify-center px-3 py-0 text-sm leading-5 font-medium pointer-coarse:min-h-10",
  composer:
    "h-token-button-composer px-(--padding-button-composer-inline,calc(var(--spacing)*2)) py-0 text-(length:--text-button-composer,var(--text-sm)) leading-(--line-height-button-composer,18px)",
  composerWithBadge:
    "h-token-button-composer ps-2 pe-[calc((var(--spacing-token-button-composer)-var(--spacing)*5)/2-1px)] py-0 text-sm leading-[18px]",
  composerPill:
    "h-(--spacing-token-button-composer) py-0 ps-3 pe-3.5 text-base leading-relaxed",
  composerAuxiliary: "h-token-button-composer px-2 py-0 text-sm leading-[18px]",
  composerPermissions:
    "h-token-button-composer px-1.5 py-0 text-sm leading-[18px]",
  composerSm: "h-token-button-composer-sm px-1.5 py-0 text-sm leading-[18px]",
  composerSmLabel:
    "h-token-button-composer-sm px-2.5 py-0 text-sm leading-[18px]",
  default: "px-2 py-0.5 text-sm leading-[18px]",
  actionSm:
    "min-h-7 shrink-0 justify-center px-2.5 py-0 text-xs leading-4 font-medium pointer-coarse:min-h-10",
  dialog: "min-h-9 px-3 text-sm font-medium",
  dialogAction: "min-h-9 shrink-0 px-4 text-sm font-medium",
  entityRowAction:
    "min-h-9 shrink-0 justify-center gap-1.5 px-3 py-0 text-onboarding-body font-medium",
  panelAction:
    "min-h-12 shrink-0 justify-center px-8 text-sm leading-5 font-medium",
  detailAction: "min-h-10 justify-center px-4 text-base font-medium",
  beaconAction: "min-h-11 justify-center px-4 text-sm font-medium",
  promotionalAction:
    "min-h-11.5 justify-center border-0 px-4 py-3.25 text-onboarding-body font-medium",
  promotionalLink:
    "min-h-9 justify-center border-0 px-0 py-2 text-onboarding-body font-semibold tracking-announcement-body underline decoration-from-font [text-underline-position:from-font]",
  beaconCarousel: "h-9 min-w-30 justify-center px-4 text-sm font-medium",
  conversationFollowup: "h-10 shrink-0 px-4 py-0 text-sm leading-5",
  paginationDot: "h-6 w-3.5 shrink-0 justify-center border-0 p-0",
  dialogGhost: "min-h-9 gap-1.5 px-3 text-sm leading-5",
  entityHeader:
    "size-9 shrink-0 justify-center border-0 p-0 pointer-coarse:min-h-10 pointer-coarse:min-w-10",
  dragHandle: "h-7 w-6 shrink-0 justify-center p-0",
  formatToolbar: "h-7 border-0 px-2.5 py-0 text-sm leading-5",
  formatToolbarIcon: "h-7 w-8 shrink-0 justify-center border-0 p-0",
  icon: "electron:p-1 electron:[&>svg]:icon-sm flex items-center justify-center p-0.5",
  iconCircle: "flex size-8 items-center justify-center p-0",
  iconCircleSm: "flex size-5 items-center justify-center p-0",
  iconLarge: "flex size-16 items-center justify-center p-0",
  iconMd: "flex size-5 items-center justify-center p-0.5 [&>svg]:icon-2xs",
  iconSm: "flex h-4 w-4 items-center justify-center p-0.5 [&>svg]:icon-2xs",
  imageToolbar: "h-9 gap-1.5 border-0 px-2 py-0 text-sm leading-5",
  inline: "border-0 p-0",
  inputIcon: "size-9 justify-center border-0 p-0",
  inputSegment: "h-full w-10 shrink-0 justify-center border-e-border p-0",
  inputSelect: "h-full min-w-28 shrink-0 gap-2 border-0 px-3 text-sm",
  inputControl: "h-10 shrink-0 px-4 py-0 text-sm leading-5",
  large: "px-5 py-2 text-base leading-[18px]",
  medium: "px-4 py-1.5 text-base leading-[18px]",
  menuRow: "h-7 px-2 py-0 text-xs leading-4",
  settingsSelect: "h-9 px-2 py-1 text-sm leading-none",
  shareDestination:
    "min-w-20 flex-col gap-3 border-0 p-0 text-xs max-sm:min-w-0",
  surveyOption: "gap-3 border-0 p-4 text-base leading-6 font-normal",
  tabStripAction:
    "h-[calc(var(--spacing-token-button-composer)+6px)] px-2 py-0 text-base leading-[18px]",
  toolbar: "button-toolbar py-0 text-sm leading-[18px]",
  headerUpsell:
    "h-8.5 px-3 py-0 text-base leading-5 font-medium pointer-coarse:h-10",
};

function DefaultSpinnerIcon(props: Record<string, unknown>): unknown {
  return jsxRuntimeOf().jsxs("svg", {
    ...props,
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
    children: [
      jsxRuntimeOf().jsx("path", {
        opacity: 0.3,
        d: "M18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12ZM20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z",
        fill: "currentColor",
      }),
      jsxRuntimeOf().jsx("path", {
        d: "M12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12H6C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6V4Z",
        fill: "currentColor",
      }),
    ],
  });
}

function RaysSpinnerIcon(props: Record<string, unknown>): unknown {
  return jsxRuntimeOf().jsx("svg", {
    ...props,
    width: spinnerRaysIcon.canvas.width,
    height: spinnerRaysIcon.canvas.height,
    viewBox: spinnerRaysIcon.canvas.viewBox,
    fill: "none",
    "aria-hidden": true,
    dangerouslySetInnerHTML: { __html: spinnerRaysIcon.body },
  });
}

function initialAnimationDelay(): string {
  return `-${Date.now() % 1_000}ms`;
}

/** 原 n8 / 导出 Qh。 */
export function LoadingSpinner({
  as: Container = "div",
  Icon,
  variant = "default",
  className,
  containerClassName,
  animationDurationMs,
}: LoadingSpinnerProps): unknown {
  const [animationDelay] = reactOf().useState(initialAnimationDelay);
  const SpinnerIcon =
    Icon ?? (variant === "rays" ? RaysSpinnerIcon : DefaultSpinnerIcon);
  return jsxRuntimeOf().jsx(Container, {
    className: classNames(
      "inline-flex h-fit w-fit items-center justify-center leading-none contain-layout contain-paint contain-style motion-safe:animate-spin",
      containerClassName,
    ),
    style: {
      animationDelay,
      animationDuration:
        animationDurationMs == null ? undefined : `${animationDurationMs}ms`,
    },
    children: jsxRuntimeOf().jsx(SpinnerIcon, {
      className: classNames(variant === "rays" && "_rays_kzweq_2", className),
    }),
  });
}

function buttonClassName(props: ButtonProps): string {
  const size = props.size ?? "default";
  const color = props.color ?? "primary";
  const spinnerVariant = props.spinnerVariant ?? "default";
  const uniform = props.uniform === true;
  const contentLayout = props.contentLayout ?? "default";
  const focusRing = props.focusRing;
  const computedRadius =
    props.radius == null || props.radius === "default"
      ? uniform &&
        ["toolbar", "compact", "medium", "dialogGhost"].includes(size)
        ? "rounded-lg"
        : BUTTON_RADIUS_BY_SIZE[size]
      : BUTTON_RADIUS_CLASSES[props.radius];
  return classNames(
    "no-drag cursor-interaction items-center select-none focus:outline-hidden disabled:cursor-default aria-disabled:cursor-default",
    color !== "cardAction" && "disabled:opacity-40 aria-disabled:opacity-40",
    focusRing !== "none" &&
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
    size === "composerPill" ? "gap-1.5 border-0" : "border",
    size !== "composerPill" &&
      size !== "headerUpsell" &&
      size !== "entityRowAction" &&
      spinnerVariant !== "rays" &&
      "gap-1",
    size === "headerUpsell" && "gap-0.75",
    spinnerVariant === "rays" && "gap-1.5",
    size === "auth" || size === "surveyOption"
      ? "whitespace-normal"
      : "whitespace-nowrap",
    contentLayout === "balanced" ? "grid grid-cols-[1fr_auto_1fr]" : "flex",
    computedRadius,
    BUTTON_COLOR_CLASSES[color],
    BUTTON_SIZE_CLASSES[size],
    (focusRing === "inset" || (focusRing == null && size === "inputSegment")) &&
      "focus-visible:ring-inset",
    props.allowShrink === true && "min-w-0",
    uniform && "aspect-square shrink-0 items-center justify-center !px-0",
    props.className,
  );
}

function buttonContent(props: ButtonProps): unknown {
  const spinner =
    props.loading === true
      ? jsxRuntimeOf().jsx(
          LoadingSpinner,
          props.spinnerVariant === "rays"
            ? { variant: "rays" }
            : { className: "icon-xxs" },
        )
      : null;
  return jsxRuntimeOf().jsxs(jsxRuntimeOf().Fragment, {
    children: [spinner, props.children],
  });
}

function renderButton(props: ButtonProps): unknown {
  const {
    uniform: _uniform,
    allowShrink: _allowShrink,
    color: _color,
    contentLayout: _contentLayout,
    radius: _radius,
    size: _size,
    focusRing: _focusRing,
    disabled = false,
    className: _className,
    children: _children,
    loading = false,
    spinnerVariant: _spinnerVariant,
    ...elementProps
  } = props;
  const className = buttonClassName(props);
  const children = buttonContent(props);
  if (props.as === "a") {
    const {
      as: _as,
      href,
      onClick,
      onAuxClick,
      onKeyDown,
      tabIndex,
      ...anchorProps
    } = elementProps;
    const unavailable = disabled || loading;
    return jsxRuntimeOf().jsx("a", {
      ...anchorProps,
      className,
      href: unavailable ? undefined : href,
      role: unavailable ? "link" : anchorProps.role,
      "aria-disabled": unavailable || anchorProps["aria-disabled"],
      tabIndex: unavailable ? -1 : tabIndex,
      onClick: (event: ButtonInteractionEvent) =>
        unavailable ? event.preventDefault() : onClick?.(event),
      onAuxClick: (event: ButtonInteractionEvent) =>
        unavailable ? event.preventDefault() : onAuxClick?.(event),
      onKeyDown: (event: ButtonInteractionEvent) => {
        if (unavailable) {
          if (event.key === "Enter" || event.key === " ")
            event.preventDefault();
        } else onKeyDown?.(event);
      },
      children,
    });
  }
  const { as: _as, type = "button", ...nativeButtonProps } = elementProps;
  return jsxRuntimeOf().jsx("button", {
    type,
    className,
    disabled: disabled || loading,
    ...nativeButtonProps,
    children,
  });
}

/** 原 a8 / 导出 Yh。 */
export function Button(props: ButtonProps): unknown {
  return renderButton(props);
}

/** 原 pot / 导出 Xh。 */
export function LinkButton(props: Omit<ButtonProps, "as">): unknown {
  return renderButton({ ...props, as: "a" });
}
