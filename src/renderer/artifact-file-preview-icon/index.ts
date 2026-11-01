import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
  I3 as getJsxRuntime,
  e6 as getReactRuntime,
  gg as initializeFileIconRuntime,
  h4 as initializeClassNames,
  m4 as classNames,
  mg as getFileIcon,
} from "@rchunk/app-shared";

interface CompilerRuntime {
  c(size: number): unknown[];
}

export interface ArtifactFilePreviewIconProps {
  getImagePreviewSrc?(path: string): string | null | undefined;
  iconClassName?: string;
  imageClassName?: string;
  path: string;
}

let compilerRuntime: CompilerRuntime;
let React: ReturnType<typeof getReactRuntime>;
let jsxRuntime: ReturnType<typeof getJsxRuntime>;

function ArtifactFilePreviewIcon({
  getImagePreviewSrc,
  iconClassName,
  imageClassName,
  path,
}: ArtifactFilePreviewIconProps): unknown {
  const cache = compilerRuntime.c(18);
  let previewSource: string | null;
  if (cache[0] !== getImagePreviewSrc || cache[1] !== path) {
    previewSource = getImagePreviewSrc?.(path) ?? null;
    cache[0] = getImagePreviewSrc;
    cache[1] = path;
    cache[2] = previewSource;
  } else {
    previewSource = cache[2] as string | null;
  }

  const [failedSource, setFailedSource] = React.useState<string | null>(null);
  if (previewSource != null && previewSource !== failedSource) {
    let imageClasses: string;
    if (cache[3] !== imageClassName) {
      imageClasses = classNames("shrink-0 object-cover", imageClassName);
      cache[3] = imageClassName;
      cache[4] = imageClasses;
    } else {
      imageClasses = cache[4] as string;
    }
    let handleError: () => void;
    if (cache[5] !== previewSource) {
      handleError = () => setFailedSource(previewSource);
      cache[5] = previewSource;
      cache[6] = handleError;
    } else {
      handleError = cache[6] as () => void;
    }
    if (
      cache[7] !== previewSource ||
      cache[8] !== imageClasses ||
      cache[9] !== handleError
    ) {
      cache[7] = previewSource;
      cache[8] = imageClasses;
      cache[9] = handleError;
      cache[10] = jsxRuntime.jsx("img", {
        alt: "",
        className: imageClasses,
        src: previewSource,
        onError: handleError,
      });
    }
    return cache[10];
  }

  let Icon: unknown;
  if (cache[11] !== path) {
    Icon = getFileIcon(path);
    cache[11] = path;
    cache[12] = Icon;
  } else {
    Icon = cache[12];
  }
  let iconClasses: string;
  if (cache[13] !== iconClassName) {
    iconClasses = classNames("shrink-0", iconClassName);
    cache[13] = iconClassName;
    cache[14] = iconClasses;
  } else {
    iconClasses = cache[14] as string;
  }
  if (cache[15] !== Icon || cache[16] !== iconClasses) {
    cache[15] = Icon;
    cache[16] = iconClasses;
    cache[17] = jsxRuntime.jsx(Icon, { className: iconClasses });
  }
  return cache[17];
}

function initializeArtifactFilePreviewIcon(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeClassNames();
  React = getReactRuntime();
  initializeFileIconRuntime();
  jsxRuntime = getJsxRuntime();
}

export {
  initializeArtifactFilePreviewIcon as n,
  ArtifactFilePreviewIcon as t,
};
