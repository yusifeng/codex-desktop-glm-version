import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
  I3 as getJsxRuntime,
  a$ as initializeMotionRuntime,
  o$ as motion,
} from "@rchunk/app-shared";

interface CompilerRuntime {
  c(size: number): unknown[];
}

export interface AboveComposerFixedContentSurfaceProps {
  children: unknown;
  transition?: unknown;
}

let compilerRuntime: CompilerRuntime;
let jsxRuntime: ReturnType<typeof getJsxRuntime>;

function AboveComposerFixedContentSurface({
  children,
  transition,
}: AboveComposerFixedContentSurfaceProps): unknown {
  const cache = compilerRuntime.c(5);
  let surface: unknown;
  if (cache[0] !== children) {
    surface = jsxRuntime.jsx("div", {
      className:
        "flex w-max max-w-full min-w-0 items-center gap-2 rounded-3xl border border-border/80 bg-background-primary-soft/70 px-3 py-1.5 text-default backdrop-blur-sm",
      children,
    });
    cache[0] = children;
    cache[1] = surface;
  } else {
    surface = cache[1];
  }
  if (cache[2] !== surface || cache[3] !== transition) {
    cache[2] = surface;
    cache[3] = transition;
    cache[4] = jsxRuntime.jsx("div", {
      className:
        "flex w-full max-w-(--thread-content-max-width) min-w-0 justify-center",
      children: jsxRuntime.jsx(motion.div, {
        layout: "size",
        transition,
        className:
          "relative z-10 w-fit max-w-full min-w-0 overflow-hidden rounded-3xl",
        children: surface,
      }),
    });
  }
  return cache[4];
}

function initializeAboveComposerFixedContentSurface(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeMotionRuntime();
  jsxRuntime = getJsxRuntime();
}

export {
  initializeAboveComposerFixedContentSurface as n,
  AboveComposerFixedContentSurface as t,
};
