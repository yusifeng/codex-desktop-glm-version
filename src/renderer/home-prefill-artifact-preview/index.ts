// home-prefill-artifact-preview —— Home 预填文件进入 artifact 预览桥。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;

interface ReactRuntime {
  useEffect(effect: () => void, dependencies: unknown[]): void;
  useRef<T>(value: T): { current: T };
}

export interface PrefillPreviewFile {
  fsPath?: string;
  label?: string;
  path?: string;
}

let React: ReactRuntime | null = null;

function HomePrefillArtifactPreview({
  locationKey,
  previewFiles,
}: {
  locationKey: unknown;
  previewFiles: PrefillPreviewFile[];
}): null {
  initializeHomePrefillArtifactPreview();
  const react = React as ReactRuntime;
  const scope = appShared.LX(appInitial.$en);
  const handledLocation = react.useRef<unknown>(null);
  react.useEffect(() => {
    if (previewFiles.length === 0 || handledLocation.current === locationKey)
      return;
    const hostId = scope.get(appInitial.Dyt);
    handledLocation.current = locationKey;
    for (const file of previewFiles) {
      const filePath = file.fsPath || file.path;
      if (filePath != null && filePath.length !== 0) {
        appInitial.Ult(scope, filePath, { hostId, title: file.label });
      }
    }
  }, [locationKey, previewFiles, scope]);
  return null;
}

function initializeHomePrefillArtifactPreview(): void {
  appShared.FX?.();
  appInitial.Hlt?.();
  appInitial.itn?.();
  appInitial.byt?.();
  React ??= typeof appShared.e6 === "function" ? appShared.e6() : appShared.e6;
}

initializeHomePrefillArtifactPreview();

export { HomePrefillArtifactPreview };
