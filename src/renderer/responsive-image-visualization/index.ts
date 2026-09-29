// Responsive learning-block image renderer. Release chunk: responsive-image-visualization-9fbd0706e5fc.js.
import "@rchunk/rolldown-runtime";
import * as AppShared from "@rchunk/app-shared";

interface ResponsiveImageSources {
  oneX: string;
  twoX?: string;
  threeX?: string;
}

interface ResponsiveImageProps {
  sources: ResponsiveImageSources;
  alt: string;
  presentationMode?: "standard" | "thumbnail";
  width?: number;
  height?: number;
  objectFit?: string;
}

let jsxRuntime: AppShared.JsxRuntime;

function createSourceSet({ oneX, twoX, threeX }: ResponsiveImageSources): string | undefined {
  const candidates = [oneX + " 1x"];
  if (twoX) candidates.push(twoX + " 2x");
  if (threeX) candidates.push(threeX + " 3x");
  return candidates.length > 1 ? candidates.join(",") : undefined;
}

function ResponsiveImageVisualization({
  sources,
  alt,
  presentationMode = "standard",
  width = 320,
  height = 320,
  objectFit = "contain",
}: ResponsiveImageProps): unknown {
  "use forget";
  const isThumbnail = presentationMode === "thumbnail";
  return jsxRuntime.jsx("div", {
    className: "flex h-full w-full items-center justify-center",
    "data-learning-block-responsive-image": true,
    children: jsxRuntime.jsx("img", {
      src: sources.oneX,
      srcSet: createSourceSet(sources),
      alt,
      width,
      height,
      className: isThumbnail ? "m-0 block h-full w-full" : "m-0 block max-h-full max-w-full",
      style: {
        objectFit,
        width: isThumbnail ? "100%" : width,
        height: isThumbnail ? "100%" : height,
        maxWidth: "100%",
        maxHeight: "100%",
      },
    }),
  });
}

function initializeResponsiveImageVisualization(): void {
  jsxRuntime = (AppShared as unknown as { I3(): AppShared.JsxRuntime }).I3();
}

export { initializeResponsiveImageVisualization as n, ResponsiveImageVisualization as t };
