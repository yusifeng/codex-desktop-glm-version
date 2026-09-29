// Trusted-contact invitation hero. Release chunk: trusted-contact-hero-7b0737a0d525.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as invitationBackgroundChunk from "@rchunk/parental-controls-invitation-background";

interface MemoCacheRuntime {
  c(size: number): unknown[];
}
interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
  jsxs(type: unknown, props: Record<string, unknown>): unknown;
}

interface SharedRuntime {
  $3(): MemoCacheRuntime;
  C_(): void;
  I3(): JsxRuntime;
  S_(props: { asset: unknown; className: string }): unknown;
  m: unknown;
  p(): void;
}

interface InvitationBackgroundRuntime {
  n: string;
  t(): void;
}

const sharedRuntime = appSharedChunk as unknown as SharedRuntime;
const invitationBackground =
  invitationBackgroundChunk as unknown as InvitationBackgroundRuntime;
let memoCacheRuntime: MemoCacheRuntime;
let jsx: JsxRuntime;
let initialized = false;

function TrustedContactHero(): unknown {
  const cache = memoCacheRuntime.c(2);
  let backgroundImage: unknown;
  if (cache[0] === Symbol.for("react.memo_cache_sentinel")) {
    backgroundImage = jsx.jsx("img", {
      src: invitationBackground.n,
      alt: "",
      className: "absolute size-full object-cover",
    });
    cache[0] = backgroundImage;
  } else {
    backgroundImage = cache[0];
  }

  let hero: unknown;
  if (cache[1] === Symbol.for("react.memo_cache_sentinel")) {
    hero = jsx.jsxs("div", {
      className: "relative grid h-44 shrink-0 place-items-center",
      "aria-hidden": "true",
      children: [
        backgroundImage,
        jsx.jsx("div", {
          className:
            "relative flex size-20 items-center justify-center rounded-2xl bg-surface shadow-lg",
          children: jsx.jsx(sharedRuntime.S_, {
            asset: sharedRuntime.m,
            className: "text-default",
          }),
        }),
      ],
    });
    cache[1] = hero;
  } else {
    hero = cache[1];
  }
  return hero;
}

function initialize(): void {
  if (initialized) return;
  initialized = true;
  memoCacheRuntime = sharedRuntime.$3();
  sharedRuntime.p();
  invitationBackground.t();
  sharedRuntime.C_();
  jsx = sharedRuntime.I3();
}

export { initialize as n, TrustedContactHero as t };
