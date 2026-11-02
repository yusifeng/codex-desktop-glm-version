// @ts-nocheck
import { classNames, initializeClassNames } from "../../app-shared/ui/class-names";
import { n as once } from "@rchunk/rolldown-runtime";
import {
  $3 as getMemoCacheRuntime,
  I3 as getJsxRuntime,
  Yh as Button,
  Zh as initializeButtonRuntime,
} from "@rchunk/app-shared";
import {
  fit as Badge,
  n7 as AnnouncementSurface,
  pit as initializeBadgeRuntime,
  r7 as initializeAnnouncementSurface,
} from "@rchunk/app-initial";

function AnnouncementActionButton({ action, buttonRef, kind, variant = "default" }) {
  const cache = getMemoCacheRuntime().c(17);
  const Icon = action.icon;
  const uniform = Icon != null && action.label == null;
  let color = "ghost";
  let size = "composerSm";
  if (variant === "beacon") {
    color = uniform ? "ghostActive" : "outlineGhost";
    size = uniform ? "inputIcon" : "dialog";
  }
  const padded =
    variant !== "beacon" &&
    (uniform
      ? "border-transparent text-codex-description hover:text-default"
      : "px-3 [@container_(max-width:400px)]:flex-1 [@container_(max-width:400px)]:justify-center");
  let buttonClass;
  cache[0] === padded
    ? (buttonClass = cache[1])
    : ((buttonClass = classNames(padded)), (cache[0] = padded), (cache[1] = buttonClass));
  const buttonColor = kind === "primary" ? "primary" : color;
  let icon;
  cache[2] !== Icon || cache[3] !== variant
    ? ((icon = Icon ? getJsxRuntime().jsx(Icon, { className: variant === "beacon" ? undefined : "icon-xs" }) : null),
      (cache[2] = Icon),
      (cache[3] = variant),
      (cache[4] = icon))
    : (icon = cache[4]);
  let result;
  return (
    cache[5] !== action.ariaLabel ||
    cache[6] !== action.disabled ||
    cache[7] !== action.label ||
    cache[8] !== action.loading ||
    cache[9] !== action.onClick ||
    cache[10] !== buttonRef ||
    cache[11] !== uniform ||
    cache[12] !== size ||
    cache[13] !== buttonClass ||
    cache[14] !== buttonColor ||
    cache[15] !== icon
      ? ((result = getJsxRuntime().jsxs(Button, {
          ref: buttonRef,
          "aria-label": action.ariaLabel,
          className: buttonClass,
          color: buttonColor,
          disabled: action.disabled,
          loading: action.loading,
          onClick: action.onClick,
          size,
          radius: "full",
          uniform,
          children: [icon, action.label],
        })),
        (cache[5] = action.ariaLabel),
        (cache[6] = action.disabled),
        (cache[7] = action.label),
        (cache[8] = action.loading),
        (cache[9] = action.onClick),
        (cache[10] = buttonRef),
        (cache[11] = uniform),
        (cache[12] = size),
        (cache[13] = buttonClass),
        (cache[14] = buttonColor),
        (cache[15] = icon),
        (cache[16] = result))
      : (result = cache[16]),
    result
  );
}

export function HomeAnnouncementBanner(props) {
  const cache = getMemoCacheRuntime().c(48);
  const {
    actionsPlacement = "aside",
    attachedToComposer = false,
    additionalActions,
    badge,
    density,
    description,
    dismissAction,
    leadingVisual,
    primaryAction,
    primaryActionRef,
    secondaryAction,
    title,
    variant = "default",
  } = props;
  const hasActions =
    additionalActions != null || primaryAction != null || secondaryAction != null || dismissAction != null;
  let asideActions;
  let bodyActions;
  let narrowActions;
  let wideActions;
  if (
    cache[0] !== actionsPlacement ||
    cache[1] !== additionalActions ||
    cache[2] !== dismissAction ||
    cache[3] !== hasActions ||
    cache[4] !== primaryAction ||
    cache[5] !== primaryActionRef ||
    cache[6] !== secondaryAction ||
    cache[7] !== variant
  ) {
    const placementClass = {
      aside:
        "self-center [@container_(max-width:400px)]:w-full [@container_(max-width:400px)]:justify-center [@container_(max-width:400px)]:self-stretch",
      body: "mt-3 w-full justify-end",
      bodyOnNarrow: "justify-start [@container_(max-width:400px)]:mt-3",
    }[actionsPlacement];
    const renderActions = (extraClass) =>
      getJsxRuntime().jsxs("div", {
        className: classNames(
          "flex items-center gap-2",
          variant === "beacon" && "min-w-0 flex-wrap",
          placementClass,
          extraClass,
        ),
        children: [
          secondaryAction
            ? getJsxRuntime().jsx(AnnouncementActionButton, {
                action: secondaryAction,
                kind: "secondary",
                variant,
              })
            : null,
          primaryAction
            ? getJsxRuntime().jsx(AnnouncementActionButton, {
                action: primaryAction,
                buttonRef: primaryActionRef,
                kind: "primary",
                variant,
              })
            : null,
          dismissAction && variant !== "beacon"
            ? getJsxRuntime().jsx(AnnouncementActionButton, { action: dismissAction, kind: "dismiss" })
            : null,
          additionalActions,
        ],
      });
    bodyActions = hasActions && actionsPlacement === "body" ? renderActions() : null;
    narrowActions =
      hasActions && actionsPlacement === "bodyOnNarrow"
        ? renderActions("hidden [@container_(max-width:400px)]:flex")
        : null;
    asideActions = hasActions && actionsPlacement === "aside" ? renderActions() : null;
    wideActions =
      hasActions && actionsPlacement === "bodyOnNarrow"
        ? renderActions("[@container_(max-width:400px)]:hidden")
        : null;
    Object.assign(cache, {
      0: actionsPlacement,
      1: additionalActions,
      2: dismissAction,
      3: hasActions,
      4: primaryAction,
      5: primaryActionRef,
      6: secondaryAction,
      7: variant,
      8: asideActions,
      9: bodyActions,
      10: narrowActions,
      11: wideActions,
    });
  } else {
    asideActions = cache[8];
    bodyActions = cache[9];
    narrowActions = cache[10];
    wideActions = cache[11];
  }
  let trailingAction;
  cache[12] !== dismissAction || cache[13] !== variant
    ? ((trailingAction =
        variant === "beacon" && dismissAction != null
          ? getJsxRuntime().jsx(AnnouncementActionButton, {
              action: dismissAction,
              kind: "dismiss",
              variant: "beacon",
            })
          : undefined),
      (cache[12] = dismissAction),
      (cache[13] = variant),
      (cache[14] = trailingAction))
    : (trailingAction = cache[14]);
  let visual;
  cache[15] !== actionsPlacement || cache[16] !== leadingVisual
    ? ((visual = leadingVisual
        ? getJsxRuntime().jsx("div", {
            className: classNames(
              "flex size-12 shrink-0 items-center justify-center self-center text-secondary",
              actionsPlacement === "bodyOnNarrow" && "[@container_(max-width:400px)]:self-start",
            ),
            children: leadingVisual,
          })
        : null),
      (cache[15] = actionsPlacement),
      (cache[16] = leadingVisual),
      (cache[17] = visual))
    : (visual = cache[17]);
  const titleClass = classNames(
    "min-w-0 text-default",
    variant === "beacon" ? "text-sm font-bold" : "text-base font-medium",
  );
  const titleNode = getJsxRuntime().jsx("div", { className: titleClass, children: title });
  const badgeNode = badge ? getJsxRuntime().jsx(Badge, { variant: "outline", children: badge }) : null;
  const heading = getJsxRuntime().jsxs("div", {
    className: "flex flex-wrap items-center gap-2",
    children: [titleNode, badgeNode],
  });
  const descriptionNode = getJsxRuntime().jsx("div", {
    className: classNames(
      "text-sm text-pretty text-secondary",
      variant === "beacon" ? "leading-5" : "leading-tight",
    ),
    children: description,
  });
  const body = getJsxRuntime().jsxs("div", {
    className: "min-w-0 flex-1",
    children: [heading, descriptionNode, bodyActions, narrowActions],
  });
  const content = getJsxRuntime().jsxs("div", {
    className: "flex min-w-0 items-center gap-2 [@container_(max-width:400px)]:items-start",
    children: [visual, body],
  });
  return getJsxRuntime().jsx(AnnouncementSurface, {
    attachedToComposer,
    density,
    stackOnNarrow: true,
    wrapCtas: variant === "beacon",
    trailingAction,
    content,
    customCtas: asideActions ?? wideActions ?? undefined,
  });
}

export const initializeHomeAnnouncementBanner = once(() => {
  getMemoCacheRuntime();
  initializeClassNames();
  initializeBadgeRuntime();
  initializeAnnouncementSurface();
  initializeButtonRuntime();
  getJsxRuntime();
});
