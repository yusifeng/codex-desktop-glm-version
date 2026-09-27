// home-prefill-artifact-preview —— Home 预填文件进入 artifact 预览桥。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const {
  $en: routeScope,
  Dyt: hostIdSignal,
  Hlt: initializeArtifactPreview,
  Ult: openArtifactPreview,
  byt: initializeHomePrefillState,
  itn: initializeAutomationRoutes,
} = appInitialChunk;
const {
  $3: initializeJsxRuntime,
  FX: initializeSignalRuntime,
  LX: useScope,
  e6: getReactRuntime,
} = appSharedChunk;

interface ReactRuntime {
  useEffect(effect: () => void, dependencies: unknown[]): void;
  useRef<T>(value: T): { current: T };
}

export interface PrefillPreviewFile {
  fsPath?: string;
  label?: string;
  path?: string;
}

export interface HomePrefillArtifactPreviewProps {
  locationKey: unknown;
  previewFiles: PrefillPreviewFile[];
}

let React: ReactRuntime | null = null;

function HomePrefillArtifactPreview({
  locationKey,
  previewFiles,
}: HomePrefillArtifactPreviewProps): null {
  initializeHomePrefillArtifactPreview();
  const react = React as ReactRuntime;
  const scope = useScope(routeScope);
  const handledLocation = react.useRef<unknown>(null);
  react.useEffect(() => {
    if (previewFiles.length === 0 || handledLocation.current === locationKey)
      return;
    const hostId = scope.get<string>(hostIdSignal);
    handledLocation.current = locationKey;
    for (const file of previewFiles) {
      const filePath = file.fsPath || file.path;
      if (filePath != null && filePath.length !== 0) {
        openArtifactPreview(scope, filePath, { hostId, title: file.label });
      }
    }
  }, [locationKey, previewFiles, scope]);
  return null;
}

function initializeHomePrefillArtifactPreview(): void {
  initializeJsxRuntime?.();
  initializeSignalRuntime?.();
  initializeArtifactPreview?.();
  initializeAutomationRoutes?.();
  initializeHomePrefillState?.();
  React ??=
    typeof getReactRuntime === "function" ? getReactRuntime() : getReactRuntime;
}

initializeHomePrefillArtifactPreview();

export { HomePrefillArtifactPreview };
