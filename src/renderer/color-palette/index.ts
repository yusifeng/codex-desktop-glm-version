import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  I3 as getJsxRuntime,
  K2 as initializeIntlComponents,
  Yh as IconButton,
  Zh as initializeIconButton,
  h4 as initializeClassNames,
  m4 as classNames,
  n4 as useIntl,
} from "@rchunk/app-shared";
import {
  TM as initializeProjectColors,
  xM as projectColors,
} from "@rchunk/app-initial";

type ProjectColor = "black" | "blue" | "green" | "orange" | "pink" | "purple" | "red" | "yellow";
const colors: ProjectColor[] = ["black", "red", "orange", "yellow", "green", "blue", "purple", "pink"];
const jsx = getJsxRuntime();

function colorName(intl: import("@rchunk/app-shared").IntlShape, color: ProjectColor): string {
  const defaults: Record<ProjectColor, string> = {
    black: "Default", blue: "Blue", green: "Green", orange: "Orange",
    pink: "Pink", purple: "Purple", red: "Red", yellow: "Yellow",
  };
  return String(intl.formatMessage({
    id: `codex.projectAppearance.color.option.${color}`,
    defaultMessage: defaults[color],
    description: "Color option name in the project marker popover.",
  }));
}

interface ColorPaletteProps {
  color: ProjectColor;
  defaultSwatchColor?: string;
  disabled?: boolean;
  groupAriaLabel?: string;
  onColorChange(color: ProjectColor): void;
}

function ColorPalette({
  color, defaultSwatchColor, disabled = false, groupAriaLabel, onColorChange,
}: ColorPaletteProps): unknown {
  const intl = useIntl();
  const label = groupAriaLabel ?? String(intl.formatMessage({
    id: "symbolPicker.icons.colors", defaultMessage: "Icon colors",
    description: "Accessible label for the icon picker color presets",
  }));
  return jsx.jsx("div", {
    className: "flex items-center justify-between gap-1 select-none",
    role: "group",
    "aria-label": label,
    children: colors.map((option) => jsx.jsx(IconButton, {
      color: color === option ? "secondary" : "ghost",
      size: "iconCircle", radius: "full", disabled,
      "aria-label": intl.formatMessage({
        id: "codex.projectAppearance.color.option.aria_label",
        defaultMessage: "Use {colorName}",
        description: "Accessible label for a project marker color swatch. Placeholder {colorName} is a color name such as Blue or Green.",
      }, { colorName: colorName(intl, option) }),
      "aria-pressed": color === option,
      onClick: () => onColorChange(option),
      children: jsx.jsx("span", {
        className: classNames(
          "size-6 rounded-full",
          option === "black" && defaultSwatchColor != null
            ? undefined
            : projectColors[option].swatchClassName,
        ),
        style: option === "black" && defaultSwatchColor != null
          ? { backgroundColor: defaultSwatchColor }
          : undefined,
        "aria-hidden": true,
      }),
    }, option)),
  });
}

function initializeColorPalette(): void {
  initializeCompilerRuntime();
  initializeClassNames();
  initializeIntlComponents();
  initializeIconButton();
  initializeProjectColors();
}

export { initializeColorPalette as n, ColorPalette as t };
