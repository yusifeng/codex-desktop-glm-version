// Connected cloud-file preview tab. Release chunk: tab-d6bbb8bc9acd.js.
import "@rchunk/rolldown-runtime";
import * as AppShared from "@rchunk/app-shared";
import * as AppInitial from "@rchunk/app-initial";
import * as LibraryCloudFilePreview from "@rchunk/library-cloud-file-preview";
import * as CloudFilePreview from "@rchunk/cloud-file-preview";

interface CompilerRuntime {
  c(size: number): unknown[];
}

interface ConnectedFile {
  id: string;
  fileId: string;
  currentVersion: unknown;
  modifiedAt: unknown;
  category: unknown;
}

interface ConnectedIdentity {
  accountId: string | null;
  userId: string | null;
}

interface ConnectedFilePreviewProps {
  file: ConnectedFile;
  identity: ConnectedIdentity;
  onClose?: () => void;
}

const sharedRuntime = AppShared as unknown as {
  $3(): CompilerRuntime;
  FX(): void;
  HX<Value>(signal: unknown): Value;
  I3(): AppShared.JsxRuntime;
};
const connectedRuntime = AppInitial as unknown as {
  Sun(): void;
  _un: unknown;
  mun: unknown;
  xun: unknown;
};
const libraryPreviewRuntime = LibraryCloudFilePreview as unknown as {
  n: (props: Record<string, unknown>) => unknown;
};
const cloudPreviewRuntime = CloudFilePreview as unknown as { t(): void };

let compilerRuntime: CompilerRuntime;
let jsxRuntime: AppShared.JsxRuntime;

function ConnectedFilePreview({ file, identity, onClose }: ConnectedFilePreviewProps): unknown {
  const cache = compilerRuntime.c(11);
  const accountId = sharedRuntime.HX<string | null>(connectedRuntime.mun);
  const userId = sharedRuntime.HX<string | null>(connectedRuntime._un);
  const isReady = sharedRuntime.HX<boolean>(connectedRuntime.xun);
  if (accountId !== identity.accountId || userId !== identity.userId || !isReady) {
    return null;
  }

  let key: unknown;
  if (
    cache[0] === file.currentVersion &&
    cache[1] === file.fileId &&
    cache[2] === file.modifiedAt &&
    cache[3] === identity
  ) {
    key = cache[4];
  } else {
    key = JSON.stringify([identity, file.fileId, file.currentVersion, file.modifiedAt]);
    cache[0] = file.currentVersion;
    cache[1] = file.fileId;
    cache[2] = file.modifiedAt;
    cache[3] = identity;
    cache[4] = key;
  }
  let item: unknown;
  if (cache[5] === file) {
    item = cache[6];
  } else {
    item = {
      id: file.id,
      kind: "cloud-file",
      cloudFile: file,
      modifiedAt: file.modifiedAt,
      fileType: file.category,
    };
    cache[5] = file;
    cache[6] = item;
  }
  if (cache[7] === onClose && cache[8] === key && cache[9] === item) {
    return cache[10];
  }
  const preview = jsxRuntime.jsx(
    libraryPreviewRuntime.n,
    { item, showComposer: false, onClose },
    key as string,
  );
  cache[7] = onClose;
  cache[8] = key;
  cache[9] = item;
  cache[10] = preview;
  return preview;
}

function initializeConnectedFilePreview(): void {
  compilerRuntime = sharedRuntime.$3();
  sharedRuntime.FX();
  connectedRuntime.Sun();
  cloudPreviewRuntime.t();
  jsxRuntime = sharedRuntime.I3();
}

initializeConnectedFilePreview();

export { ConnectedFilePreview };
