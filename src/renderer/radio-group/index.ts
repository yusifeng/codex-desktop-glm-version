import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, m4 as joinClasses, type JsxRuntime } from "@rchunk/app-shared";

interface RadioGroupProps extends Record<string, unknown> {
  __isWidget?: boolean;
  children?: unknown;
  className?: string;
  direction?: "column" | "row";
  disabled?: boolean;
  onChange?(value: string): void;
  value?: string;
}
interface RadioItemProps extends Record<string, unknown> {
  block?: boolean;
  children?: unknown;
  className?: string;
  disabled?: boolean;
  id?: string;
  required?: boolean;
  value: string;
}
interface RadioGroupComponent {
  (props: RadioGroupProps): unknown;
  Item(props: RadioItemProps): unknown;
}

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function RadioItem({ block = false, children, className, disabled = false, id, required, value, ...props }: RadioItemProps): unknown {
  const inputId = id ?? `radio-${value}`;
  return jsx().jsx("div", {
    ...props,
    className: "flex",
    children: jsx().jsxs("label", {
      className: joinClasses("RadioLabel", className),
      "data-block": block ? "" : undefined,
      "data-disabled": disabled ? "" : undefined,
      htmlFor: inputId,
      onMouseDown: (event: { defaultPrevented: boolean; detail: number; preventDefault(): void }) => {
        if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
      },
      children: [jsx().jsx("input", { disabled, id: inputId, required, type: "radio", value }), children],
    }),
  });
}

const n = (({ __isWidget, children, className, direction = "row", disabled = false, onChange, ...props }: RadioGroupProps) => jsx().jsx("div", {
  ...props,
  className: joinClasses("RadioGroup", className),
  "data-direction": direction,
  "data-disabled": disabled ? "" : undefined,
  "data-w-component": __isWidget ? "radio-group" : undefined,
  onChange: (event: { target?: { value?: string } }) => {
    const value = event.target?.value;
    if (!disabled && value != null) onChange?.(value);
  },
  role: "radiogroup",
  children,
})) as RadioGroupComponent;
n.Item = RadioItem;

function r(): void {}
function t(): void {}
export { n, r, t };
