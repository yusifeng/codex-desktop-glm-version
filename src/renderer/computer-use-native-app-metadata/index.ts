import "@rchunk/rolldown-runtime";
import {
  $O as timeConstants,
  BX as useSignalFamilyValue,
  FX as initializeSignalRuntime,
  QI as initializeAppScope,
  ZI as appScope,
  ek as initializeQueryRuntime,
} from "@rchunk/app-shared";
import {
  eun as createAppServerQueryFamily,
  nun as initializeAppsQueries,
} from "@rchunk/app-initial";

export interface NativeAppMetadata {
  appId?: string;
  bundleId?: string;
  displayName: string;
  [key: string]: unknown;
}

export type NativeAppReference =
  | { kind: "appId"; appId: string }
  | { kind: "displayName"; displayName: string }
  | null;

interface QueryResult<T> {
  data?: T | null;
}

let nativeAppByBundleId: unknown;
let nativeAppsByDisplayName: unknown;

function getNativeAppMetadata(
  reference: NativeAppReference,
): NativeAppMetadata | null {
  const readFamily = useSignalFamilyValue as unknown as <T>(
    family: unknown,
    parameter: unknown,
  ) => QueryResult<T>;
  const { data: byBundleId } = readFamily<NativeAppMetadata>(
    nativeAppByBundleId,
    reference?.kind === "appId" ? reference.appId : null,
  );
  const { data: byDisplayName } = readFamily<NativeAppMetadata>(
    nativeAppsByDisplayName,
    reference?.kind === "displayName" ? reference.displayName : null,
  );
  return byBundleId ?? byDisplayName ?? null;
}

function initializeNativeAppMetadata(): void {
  initializeSignalRuntime();
  initializeAppScope();
  initializeQueryRuntime();
  initializeAppsQueries();
  const createQueryFamily = createAppServerQueryFamily as unknown as (
    scope: unknown,
    method: string,
    options: (parameter: string | null) => Record<string, unknown>,
  ) => unknown;
  nativeAppByBundleId = createQueryFamily(
    appScope,
    "native-desktop-app-by-bundle-id",
    (bundleId) => ({
      enabled: bundleId != null,
      params: bundleId == null ? undefined : { bundleId },
      refetchOnWindowFocus: false,
      select: (result: { app: NativeAppMetadata }) => result.app,
      staleTime: timeConstants.FIVE_MINUTES,
    }),
  );
  nativeAppsByDisplayName = createQueryFamily(
    appScope,
    "native-desktop-apps",
    (displayName) => ({
      cacheKey: ["computer-use-tool-row-display-name", displayName],
      enabled: displayName != null,
      params: { order: "usage" },
      refetchOnWindowFocus: false,
      select: (result: { apps: NativeAppMetadata[] }) =>
        result.apps.find(
          (app) =>
            app.displayName.toLowerCase() === displayName?.toLowerCase(),
        ) ?? null,
      staleTime: timeConstants.FIVE_MINUTES,
    }),
  );
}

export { getNativeAppMetadata as n, initializeNativeAppMetadata as t };
