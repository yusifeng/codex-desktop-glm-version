// Image-edit annotation control wrapper. Release chunk: image-edit-size-control-585ada304286.js.
import "@rchunk/rolldown-runtime";
import * as AppShared from "@rchunk/app-shared";
import * as AppInitial from "@rchunk/app-initial";

interface CompilerRuntime {
  c(size: number): unknown[];
}

interface PortalRuntime {
  createPortal(children: unknown, container: Element): unknown;
}

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}

interface ImageEditSizeControlProps {
  children?: unknown;
  container?: Element | null;
  ref?: unknown;
  zoom?: number;
}

const sharedRuntime = AppShared as unknown as {
  $3(): CompilerRuntime;
  I3(): JsxRuntime;
  P3(): PortalRuntime;
  h4(): void;
  m4(...values: unknown[]): string;
};
const imageRuntime = AppInitial as unknown as {
  GB: (props: Record<string, unknown>) => unknown;
  KB(): void;
};

let compilerRuntime: CompilerRuntime;
let portalRuntime: PortalRuntime;
let jsxRuntime: JsxRuntime;

function ImageEditSizeControl({ children, container, ref, zoom }: ImageEditSizeControlProps): unknown {
  const cache = compilerRuntime.c(15);
  const positionClass =
    container == null
      ? "absolute start-button-toolbar-inline top-1/2 z-30 -translate-y-1/2"
      : undefined;
  let className: unknown;
  if (cache[0] === positionClass) {
    className = cache[1];
  } else {
    className = sharedRuntime.m4("pointer-events-none", positionClass);
    cache[0] = positionClass;
    cache[1] = className;
  }
  let style: unknown;
  if (cache[2] === container && cache[3] === zoom) {
    style = cache[4];
  } else {
    style = container == null ? { zoom } : undefined;
    cache[2] = container;
    cache[3] = zoom;
    cache[4] = style;
  }
  let toolbar: unknown;
  if (cache[5] === children) {
    toolbar = cache[6];
  } else {
    toolbar = jsxRuntime.jsx(imageRuntime.GB, {
      className: "pointer-events-auto",
      children,
    });
    cache[5] = children;
    cache[6] = toolbar;
  }
  let control: unknown;
  if (cache[7] === ref && cache[8] === className && cache[9] === style && cache[10] === toolbar) {
    control = cache[11];
  } else {
    control = jsxRuntime.jsx("div", {
      ref,
      className,
      style,
      "data-annotation-control": "",
      children: toolbar,
    });
    cache[7] = ref;
    cache[8] = className;
    cache[9] = style;
    cache[10] = toolbar;
    cache[11] = control;
  }
  if (cache[12] === container && cache[13] === control) {
    return cache[14];
  }
  const result = container == null ? control : portalRuntime.createPortal(control, container);
  cache[12] = container;
  cache[13] = control;
  cache[14] = result;
  return result;
}

function initializeImageEditSizeControl(): void {
  compilerRuntime = sharedRuntime.$3();
  sharedRuntime.h4();
  portalRuntime = sharedRuntime.P3();
  imageRuntime.KB();
  jsxRuntime = sharedRuntime.I3();
}

export { initializeImageEditSizeControl as n, ImageEditSizeControl as t };
