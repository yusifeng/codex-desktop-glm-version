import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/dialog-layout.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react", "react/jsx-runtime"],
  write: false,
  logLevel: "silent",
});

const Fragment = Symbol("Fragment");
const runtime = {
  Fragment,
  jsx(type, props, key) {
    return { type, props, key };
  },
  jsxs(type, props, key) {
    return { type, props, key };
  },
};
globalThis.__RENDERER_JSX_RUNTIME__ = runtime;
globalThis.__RENDERER_REACT__ = {
  Fragment,
  Children: {
    toArray(children) {
      return Array.isArray(children)
        ? children
        : children == null
          ? []
          : [children];
    },
  },
  isValidElement(value) {
    return (
      value != null &&
      typeof value === "object" &&
      "type" in value &&
      "props" in value
    );
  },
  cloneElement(element, props) {
    return { ...element, props: { ...element.props, ...props } };
  },
};
globalThis.__RENDERER_DIALOG_PRIMITIVES__ = {
  Root: "Root",
  Trigger: "Trigger",
  Portal: "Portal",
  Overlay: "Overlay",
  Content: "Content",
  Close: "Close",
  Title: "Title",
  Description: "Description",
};

const dialog = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const dialogTitle = dialog.DialogTitle({
  children: "Title",
  variant: "promotional",
  className: "title-extra",
});
equal(dialogTitle.type, "Title", "renders the title primitive");
check(
  dialogTitle.props.className.includes("dialog-promotional-title"),
  "styles promotional titles",
);
equal(dialogTitle.props.children, "Title", "forwards title children");
const dialogDescription = dialog.DialogDescription({ children: "Description" });
equal(
  dialogDescription.type,
  "Description",
  "renders the description primitive",
);

let prevented = 0;
let stopped = 0;
let outsideHandled = 0;
const dialogRoot = dialog.Dialog({
  open: true,
  onOpenChange: () => {},
  triggerContent: "Open",
  children: "Body",
  headerActions: "Actions",
  size: "wide",
  radius: "compact",
  contentOverflow: "visible",
  shouldIgnoreClickOutside: true,
  contentProps: {
    "data-test": "content",
    onPointerDownOutside: () => {
      outsideHandled += 1;
    },
  },
});
equal(dialogRoot.type, "Root", "renders the dialog root primitive");
equal(dialogRoot.props.open, true, "forwards root state");
const [trigger, portal] = dialogRoot.props.children;
equal(trigger.type, "Trigger", "renders a trigger when provided");
equal(trigger.props.asChild, true, "defaults trigger composition");
equal(portal.type, "Portal", "renders the dialog portal");
const [overlay, content] = portal.props.children;
equal(overlay.type, "Overlay", "renders the dialog overlay");
equal(content.type, "Content", "renders the dialog content");
equal(content.props["data-test"], "content", "forwards content props");
check(content.props.className.includes("w-[600px]"), "applies dialog width");
check(
  content.props.className.includes("rounded-2xl"),
  "applies compact radius",
);
check(
  content.props.className.includes("overflow-visible"),
  "supports visible overflow",
);
const [dialogChildren, actions, close] = content.props.children;
equal(dialogChildren, "Body", "renders dialog children");
equal(actions, "Actions", "renders header actions");
equal(close.type, "Close", "renders the close primitive");
equal(close.props["aria-label"], "Close dialog", "labels the close button");
content.props.onPointerDownOutside({
  preventDefault: () => {
    prevented += 1;
  },
});
content.props.onPointerDown({
  stopPropagation: () => {
    stopped += 1;
  },
});
equal(prevented, 1, "prevents ignored outside interactions");
equal(outsideHandled, 1, "calls the outside interaction handler");
equal(stopped, 1, "stops pointer propagation by default");

const inlineDialog = dialog.Dialog({
  children: "Inline",
  contentPosition: "inline",
  size: "square",
  showDialogClose: false,
  unstyledContent: true,
});
const inlineContent = inlineDialog.props.children[1].props.children[1];
check(
  !inlineContent.props.className.includes("fixed"),
  "keeps inline content in flow",
);
check(
  inlineContent.props.className.includes("aspect-square"),
  "applies square sizing",
);
equal(inlineContent.props.children[2], null, "can hide the close button");

const body = dialog.DialogBody({ children: "content" });
equal(body.type, "div", "renders a div body by default");
check(body.props.className.includes("px-5 py-5"), "uses default body padding");
equal(body.props.children, [null, "content"], "renders body content");

const formBody = dialog.DialogBody({
  as: "form",
  size: "viewport",
  variant: "flush",
  className: "custom",
  onSubmit: "submit-handler",
  children: "form-content",
});
equal(formBody.type, "form", "renders a form body");
equal(formBody.props.onSubmit, "submit-handler", "forwards form props");
check(!formBody.props.className.includes("px-5 py-5"), "supports a flush body");
check(
  formBody.props.className.includes("max-h-[calc"),
  "applies viewport sizing",
);
check(
  formBody.props.className.endsWith("custom"),
  "appends custom body classes",
);

const fullBody = dialog.DialogBody({ size: "full" });
check(
  fullBody.props.className.includes("h-full min-h-0"),
  "applies full sizing",
);
const tallBody = dialog.DialogBody({ size: "tall" });
check(
  tallBody.props.className.includes("min-h-[520px]"),
  "applies tall sizing",
);

const section = dialog.DialogSection({ children: "section", spacing: "large" });
check(section.props.className.includes("pt-5"), "uses large section spacing");
const defaultSection = dialog.DialogSection({ children: "section" });
check(
  defaultSection.props.className.includes("pt-3"),
  "uses default section spacing",
);

const row = dialog.DialogFormRow({ children: "row", className: "row-extra" });
check(
  row.props.className.includes("relative flex items-center gap-2"),
  "styles form rows",
);
check(row.props.className.endsWith("row-extra"), "appends form row classes");
const stack = dialog.DialogFieldStack({ children: "stack" });
check(
  stack.props.className.includes("flex flex-col gap-2"),
  "styles field stacks",
);

const header = dialog.DialogHeader({
  icon: "icon",
  title: "Title",
  subtitle: "Subtitle",
  titleSize: "lg",
  subtitleSize: "sm",
  subtitleTone: "secondary",
});
equal(header.type, "div", "renders a dialog header");
const [, icon, text] = header.props.children;
equal(icon.props.children, "icon", "renders the header icon");
check(
  icon.props.className.includes("bg-text/5"),
  "defaults the icon background",
);
const [title, subtitle] = text.props.children;
check(
  title.props.className.includes("heading-lg"),
  "uses the requested title size",
);
check(
  subtitle.props.className.includes("text-sm"),
  "uses the requested subtitle size",
);
check(
  subtitle.props.className.includes("text-secondary"),
  "uses the secondary subtitle tone",
);

const noHeaderContent = dialog.DialogHeader({});
equal(noHeaderContent.props.children[1], null, "omits an empty icon");
equal(
  noHeaderContent.props.children[2].props.children,
  [null, null],
  "omits empty text",
);

const onlyButton = runtime.jsx(dialog.Button, { children: "Save" });
const footer = dialog.DialogFooter({ children: onlyButton });
const normalizedButton = footer.props.children[1].props.children[0];
equal(normalizedButton.props.size, "medium", "defaults footer button size");
check(
  normalizedButton.props.className.includes("w-full justify-center"),
  "expands one button",
);

const explicitButton = runtime.jsx(dialog.Button, {
  size: "small",
  className: "keep",
});
const pairFooter = dialog.DialogFooter({
  children: [explicitButton, runtime.jsx(dialog.Button, {})],
});
const pair = pairFooter.props.children[1].props.children;
equal(pair[0].props.size, "small", "preserves an explicit button size");
equal(
  pair[0].props.className,
  "keep",
  "preserves button classes without expansion",
);
equal(pair[1].props.size, "medium", "defaults each footer button size");

globalThis.window = {
  localStorage: {
    getItem: (key) => (key === "codex.debug.dialogLayout" ? "1" : null),
  },
};
const debugSection = dialog.DialogSection({ children: "debug" });
check(
  debugSection.props.className.includes("border-chart-blue/40"),
  "enables debug outlines",
);
equal(
  debugSection.props.children[0].props.children,
  "DialogSection",
  "labels debug sections",
);
delete globalThis.window;

equal(
  dialog.initializeDialogLayout(),
  undefined,
  "keeps initialization idempotent",
);

console.log(
  `app-shared dialog layout behavior: ${assertions}/${assertions} assertions passed`,
);
